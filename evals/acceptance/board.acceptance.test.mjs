// The eval's own acceptance tests: one per Done-when item of the fixture's GOAL.md. The run under test never sees
// this file; run.mjs points EVAL_REPO at the repo the run left behind.
import assert from 'node:assert/strict'
import path from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'

const load = file => import(pathToFileURL(path.join(process.env.EVAL_REPO, 'src', file)).href)

test('BOARD-1.1 tags are trimmed, lowercased and deduped in order', async () => {
  const { addCard, createBoard } = await load('board.mjs')
  const card = addCard(createBoard(), { title: 'a', tags: [' Bug', 'ui', 'bug ', '', 'UI', 'api'] })
  assert.deepEqual(card.tags, ['bug', 'ui', 'api'])
})

test('BOARD-1.2 a card without tags has none', async () => {
  const { addCard, createBoard } = await load('board.mjs')
  assert.deepEqual(addCard(createBoard(), { title: 'a' }).tags, [])
})

test('BOARD-1.3 listCards filters by tag', async () => {
  const { addCard, createBoard, listCards } = await load('board.mjs')
  const board = createBoard()
  addCard(board, { title: 'a', tags: ['bug'] })
  addCard(board, { title: 'b', tags: ['ui'] })
  addCard(board, { title: 'c', tags: ['ui', 'bug'] })
  assert.deepEqual(listCards(board, { tag: ' BUG ' }).map(card => card.title), ['a', 'c'])
  assert.equal(listCards(board).length, 3)
})

test('BOARD-2.1 due is kept, and null without one', async () => {
  const { addCard, createBoard } = await load('board.mjs')
  const board = createBoard()
  assert.equal(addCard(board, { title: 'a', due: '2026-03-01' }).due, '2026-03-01')
  assert.equal(addCard(board, { title: 'b' }).due, null)
})

test('BOARD-2.2 a due that is no real date throws and adds nothing', async () => {
  const { addCard, createBoard, listCards } = await load('board.mjs')
  const board = createBoard()
  for (const due of ['2026-02-30', 'tomorrow', '2026-1-5', '2026-13-01']) {
    assert.throws(() => addCard(board, { title: 'a', due }), RangeError, due)
  }
  assert.equal(listCards(board).length, 0)
  assert.equal(addCard(board, { title: 'leap', due: '2028-02-29' }).due, '2028-02-29')
})

test('BOARD-2.3 overdue lists earlier cards, earliest first', async () => {
  const { addCard, createBoard, overdue } = await load('board.mjs')
  const board = createBoard()
  addCard(board, { title: 'late', due: '2026-03-05' })
  addCard(board, { title: 'today', due: '2026-03-10' })
  addCard(board, { title: 'none' })
  addCard(board, { title: 'later', due: '2026-04-01' })
  addCard(board, { title: 'latest', due: '2026-01-20' })
  assert.deepEqual(overdue(board, '2026-03-10').map(card => card.title), ['latest', 'late'])
})

test('BOARD-3.1 toCsv writes a header and a line per card, no trailing newline', async () => {
  const { addCard, createBoard } = await load('board.mjs')
  const { toCsv } = await load('export.mjs')
  const board = createBoard()
  assert.equal(toCsv(board), 'id,title,tags,due')
  addCard(board, { title: 'a', tags: ['bug'], due: '2026-03-01' })
  addCard(board, { title: 'b', tags: ['ui'], due: '2026-03-02' })
  assert.equal(toCsv(board), 'id,title,tags,due\n1,a,bug,2026-03-01\n2,b,ui,2026-03-02')
})

test('BOARD-3.2 tags join with ; and a missing due is empty', async () => {
  const { addCard, createBoard } = await load('board.mjs')
  const { toCsv } = await load('export.mjs')
  const board = createBoard()
  addCard(board, { title: 'a', tags: ['bug', 'ui'] })
  addCard(board, { title: 'b' })
  assert.equal(toCsv(board), 'id,title,tags,due\n1,a,bug;ui,\n2,b,,')
})

test('BOARD-3.3 fields with a comma, quote or newline are quoted', async () => {
  const { addCard, createBoard } = await load('board.mjs')
  const { toCsv } = await load('export.mjs')
  const board = createBoard()
  addCard(board, { title: 'fix, then "ship"' })
  addCard(board, { title: 'two\nlines', tags: ['a,b'] })
  assert.equal(toCsv(board), 'id,title,tags,due\n1,"fix, then ""ship""",,\n2,"two\nlines","a,b",')
})
