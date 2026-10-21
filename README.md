# CAD Intuition Gym

A static web gym for beginner CAD modeling judgment: make a modeling decision, change the design, and feel the consequence.

The product spine is:

> Model your intent, not your accident.

## Status

v3 is merged and live. Six exercises (E1-E6) are authored, playable
end-to-end, and covered by the QA harness at desktop and mobile widths, plus
share/OG meta and a completion recap ("What you leave with") once every
exercise is done. The live site at
https://lpcode808.github.io/CAD-Intuition-Gym/ serves `main`.

Every scene also has an **Everyday** layer (toggle above the scene): the
part drawn as the real thing it stands for — a seesaw, a cabinet handle, a
lunch box — reacting to the same change, with the CAD drawing kept on top
as the trace. Light gym badges collect in a locker on the home screen.

Still open: Justin's own playthrough of E6 and the recap (the merge was his
call; the playthrough may not have happened yet). No E7+ or new scope
without his sign-off — see `HANDOFF.md`.

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
- `_planning/V3-SCOPE.md` — v3 scope, approved 2026-07-12, merged to `main` 2026-07-16.
- `_planning/FABLE-PROMPT-2026-07-12.md` — ready-to-paste prompt for the next Fable/Opus thread (current). Earlier dated prompts in `_planning/` are superseded prior rounds.
- `HANDOFF.md` — current continuation state.
- `CLAUDE.md` + `.claude/agents/` — Claude Code project notes and committed subagent definitions (slice-builder, qa-verifier, copy-auditor) for the orchestrator/executor split.
- `index.html`, `style.css`, `app.js`, `svg.js`, `exercises.js` — static app.
- `qa/qa-check.mjs` — Playwright QA harness for the full E1-E6 loop.

## Persistence

Progress is stored only in this browser under:

```txt
cad-gym.v1      progress per exercise
cad-gym.unit    in (default) or mm
cad-gym.layer   cad (default) or everyday
cad-gym.badges  earned badges
```

No data leaves the browser.
