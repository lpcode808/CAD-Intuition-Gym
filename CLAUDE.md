# CAD Intuition Gym — Claude Code notes

`AGENTS.md` is the canonical project instruction file. Read it first, then
follow its reading list (`PRD.md`, `_planning/FABLE-BUILD-BRIEF.md`,
`HANDOFF.md`). All hard rules live there; this file only adds Claude Code
specifics.

## Division of labor (use the committed subagents)

This repo ships subagent definitions in `.claude/agents/` that encode the
orchestrator/executor split proven over the v2 rounds. The orchestrating
seat owns product judgment, copy, interaction shape, integration, and the
final call — it delegates but never outsources those. Delegate with:

- **slice-builder** — bounded mechanical implementation (content-object
  wiring, rail rendering, scene primitives, styling, QA-harness extensions),
  ideally in an isolated worktree. Give it exact scope and final wording;
  it must not invent copy.
- **qa-verifier** — independent grading after any slice: re-runs the
  harness, drives the app at 1400×900 and 390×844, reads screenshots back.
  The builder does not grade itself.
- **copy-auditor** — read-only sweep of `exercises.js` for getter-contract
  violations, register drift, counter-context integrity, and option-letter
  bias. Useful before any content PR.

Always re-read a subagent's diff and re-run `node qa/qa-check.mjs` yourself
before integrating — delegation does not transfer responsibility.

## Done bar

`node qa/qa-check.mjs` must pass 100% (see `qa/README.md`; opt-in Playwright
bootstrap via `QA_ALLOW_INSTALL=1`). It automates most of the bar but does
not replace driving the app and reading screenshots yourself for visual or
copy work. Update `HANDOFF.md` every round: what changed, what remains.

## Standing decisions — do not reopen

- Light predict tap (`railPredict()`) is settled; no commit-a-guess variant.
- Vanilla static HTML/CSS/JS; no build step, backend, accounts, or solver.
- Progress in `localStorage` only (`cad-gym.v1`, `cad-gym.unit`).
- No new exercise (E6+) or scope beyond the current approved `_planning/`
  scope doc without Justin's explicit sign-off.
