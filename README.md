# CAD Intuition Gym

A static web gym for beginner CAD modeling judgment: make a modeling decision, change the design, and feel the consequence.

The product spine is:

> Model your intent, not your accident.

## Status

MVP complete. E1-E4 are authored, playable end-to-end, and covered by the QA harness at desktop and mobile widths.

Human review gate cleared 2026-07-09 — Justin played E1-E4 and greenlit v2
work and public deploy, which is now live at
https://lpcode808.github.io/CAD-Intuition-Gym/. Per-exercise "try it in
Onshape" bridge cards (v2 item 1) shipped 2026-07-11. The v2 scope is
captured in `_planning/V2-SCOPE.md`; E5 (sketch-level vs. part-level
features) is built and on an open PR, awaiting Justin's playthrough before
merge — it adds new feature-tree scene vocabulary that needs human eyes.

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
- `_planning/V2-SCOPE.md` — scoped v2 candidates after Justin's playthrough.
- `_planning/FABLE-PROMPT-2026-07-10.md` — ready-to-paste prompt for the next Fable/Opus thread (current, bridge cards + E5). Earlier dated prompts in `_planning/` are superseded prior rounds.
- `HANDOFF.md` — current continuation state.
- `index.html`, `style.css`, `app.js`, `svg.js`, `exercises.js` — static app.
- `qa/qa-check.mjs` — Playwright QA harness for the full E1-E5 loop.

## Persistence

Progress is stored only in this browser under:

```txt
cad-gym.v1
cad-gym.unit
```

No data leaves the browser.
