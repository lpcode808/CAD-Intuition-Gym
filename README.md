# CAD Intuition Gym

A static web gym for beginner CAD modeling judgment: make a modeling decision, change the design, and feel the consequence.

The product spine is:

> Model your intent, not your accident.

## Status

v2 complete. All five exercises (E1-E5) are authored, playable end-to-end,
and covered by the QA harness at desktop and mobile widths. Live at
https://lpcode808.github.io/CAD-Intuition-Gym/.

The full v2 scope (`_planning/V2-SCOPE.md`) is shipped and merged: public
deploy (2026-07-10), per-exercise "try it in Onshape" bridge cards
(PR #4, 2026-07-11), and E5 — sketch-level vs. part-level features with an
in-scene feature tree (PR #5, merged 2026-07-11 after Justin's
playthrough). v3 candidates are scoped but not approved in
`_planning/V3-SCOPE.md`; nothing there gets built without Justin's
sign-off.

GitHub:

- Repo: https://github.com/lpcode808/CAD-Intuition-Gym

See `HANDOFF.md` for the current state, QA notes, and continuation checklist.

## Run Locally

This app has no build step. Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `PRD.md` — product spec and resolved scope decisions.
- `_planning/FABLE-BUILD-BRIEF.md` — original build dispatch brief.
- `_planning/V2-SCOPE.md` — v2 scope, fully shipped 2026-07-11.
- `_planning/V3-SCOPE.md` — scoped v3 candidates, awaiting Justin's sign-off.
- `_planning/FABLE-PROMPT-2026-07-12.md` — ready-to-paste prompt for the next Fable/Opus thread (current). Earlier dated prompts in `_planning/` are superseded prior rounds.
- `HANDOFF.md` — current continuation state.
- `CLAUDE.md` + `.claude/agents/` — Claude Code project notes and committed subagent definitions (slice-builder, qa-verifier, copy-auditor) for the orchestrator/executor split.
- `index.html`, `style.css`, `app.js`, `svg.js`, `exercises.js` — static app.
- `qa/qa-check.mjs` — Playwright QA harness for the full E1-E5 loop.

## Persistence

Progress is stored only in this browser under:

```txt
cad-gym.v1
cad-gym.unit
```

No data leaves the browser.
