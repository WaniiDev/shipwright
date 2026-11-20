# Evals

One small goal, run two ways, scored the same way. It answers the question the mod's tests can't: does a shipwright run ship the goal, and what does it cost next to one plain session?

- `fixture/`: a tiny card board library (Node, no dependencies) and `GOAL.md`, three issues with Done-when items, the third needing the other two.
- `acceptance/`: one test per Done-when item. The run under test never sees them.
- `run.mjs`: copies the fixture to a temp dir, runs one arm headless, scores the repo it left behind, and saves `results/<time>-<arm>.json`.

```
node evals/run.mjs shipwright
node evals/run.mjs baseline
node evals/run.mjs score <dir>
```

`shipwright` runs `/shipwright:run GOAL.md --auto` with this checkout's plugin; `baseline` gives one plain session the same goal. Both run with permission checks off (`--dangerously-skip-permissions`), in the throwaway copy only, and both spend your plan: the shipwright arm starts several agents. `score` only scores a repo that is already there.

Each result holds the acceptance tests passed and failed (of 9), the repo's own tests, the commits made, wall time, turns, cost and token usage as the CLI reported them, and the run's `GOAL:` line.

## Results

No runs are recorded yet. Add a row per run, from its file in `results/`:

| Date | Arm | Plugin | Acceptance | Wall time | Cost | GOAL line |
| --- | --- | --- | --- | --- | --- | --- |

One fixture and one run per arm show little: run each arm a few times before reading anything into a difference, and before pruning a rule from the skills, run the shipwright arm with and without it.
