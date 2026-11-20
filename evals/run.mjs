// Runs the fixture goal once and scores what the run left behind.
//
//   node evals/run.mjs shipwright   /shipwright:run GOAL.md --auto, with this checkout's plugin
//   node evals/run.mjs baseline     one plain session, same goal, no plugin
//   node evals/run.mjs score <dir>  only score a repo that is already there
//
// A run works in a throwaway copy of evals/fixture under the system temp dir, with permission checks off.
// The result goes to evals/results/<time>-<arm>.json.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const plugin = path.join(here, '..', 'plugins', 'shipwright')

const PROMPTS = {
  shipwright: '/shipwright:run GOAL.md --auto',
  baseline: 'Implement every issue in GOAL.md on a new branch named feat/goal, with tests. Make `npm test` pass and commit your work. Do not ask me anything.',
}

function run(command, args, options = {}) {
  const ran = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...options })
  if (ran.error) throw ran.error
  return ran
}

// `node --test` with the TAP reporter ends with "# pass <n>" and "# fail <n>".
function counts(tap) {
  const count = name => Number(new RegExp(`^# ${name} (\\d+)`, 'm').exec(tap)?.[1] ?? NaN)
  return { pass: count('pass'), fail: count('fail') }
}

function score(repo) {
  const tap = ['--test', '--test-reporter=tap']
  const acceptance = run(process.execPath, [...tap, path.join(here, 'acceptance', 'board.acceptance.test.mjs')], { env: { ...process.env, EVAL_REPO: repo } })
  const own = run(process.execPath, tap, { cwd: repo })
  const log = run('git', ['-C', repo, 'log', '--oneline'])
  return {
    acceptance: counts(acceptance.stdout),
    repoTests: counts(own.stdout),
    commits: log.status === 0 ? log.stdout.trim().split('\n').length - 1 : null,
    branch: run('git', ['-C', repo, 'branch', '--show-current']).stdout.trim(),
  }
}

const [arm, dir] = process.argv.slice(2)

if (arm === 'score' && dir) {
  console.log(JSON.stringify(score(path.resolve(dir)), null, 2))
} else if (arm in PROMPTS) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), `shipwright-eval-${arm}-`))
  fs.cpSync(path.join(here, 'fixture'), repo, { recursive: true })
  const git = (...args) => run('git', ['-C', repo, '-c', 'user.name=eval', '-c', 'user.email=eval@example.invalid', ...args])
  git('init', '-b', 'main')
  git('add', '-A')
  git('commit', '-m', 'Start the board')

  const args = ['-p', PROMPTS[arm], '--output-format', 'json', '--dangerously-skip-permissions']
  if (arm === 'shipwright') args.push('--plugin-dir', plugin)
  console.error(`${arm}: running in ${repo}`)
  const started = Date.now()
  // Print mode would stop background agents 10 minutes after the last turn.
  const session = run('claude', args, { cwd: repo, env: { ...process.env, CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0' } })
  const wallMs = Date.now() - started

  let out = {}
  try {
    out = JSON.parse(session.stdout)
  } catch {
    out = { result: session.stdout.slice(-2000) }
  }
  const result = {
    arm,
    at: new Date(started).toISOString(),
    claude: run('claude', ['--version']).stdout.trim(),
    plugin: arm === 'shipwright' ? JSON.parse(fs.readFileSync(path.join(plugin, '.claude-plugin', 'plugin.json'), 'utf8')).version : null,
    exit: session.status,
    wallMs,
    turns: out.num_turns ?? null,
    costUsd: out.total_cost_usd ?? null,
    usage: out.usage ?? null,
    goalLine: /^GOAL: .*$/m.exec(String(out.result ?? ''))?.[0] ?? null,
    ...score(repo),
    repo,
  }
  const file = path.join(here, 'results', `${result.at.replace(/[:.]/g, '-')}-${arm}.json`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify(result, null, 2))
  console.error(`saved ${file}`)
} else {
  console.error('usage: node evals/run.mjs <shipwright | baseline | score <dir>>')
  process.exit(2)
}
