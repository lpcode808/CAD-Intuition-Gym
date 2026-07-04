# CAD Intuition Gym agent notes

Read these before editing:

1. `PRD.md`
2. `_planning/FABLE-BUILD-BRIEF.md`
3. `HANDOFF.md`

This is a static, local-first web app. Keep it vanilla HTML/CSS/JS unless Justin explicitly asks for a rebuild. No backend, no accounts, no real CAD solver, and no Onshape bridge task in the MVP.

The load-bearing product idea is: **model your intent, not your accident.** Organize work by modeling judgment, not by CAD feature topic.

Hard rules:

- E1-E4 must each include the full loop: intent, predict, choose, change request, consequence, takeaway, and counter-context.
- No exercise ships without a counter-context.
- Consequences are pre-authored scenes, not computed by a solver.
- Copy stays plain-language-first, CAD-term-second.
- Progress stays in browser `localStorage` only.

Before declaring done, run the app in a browser at desktop and mobile widths, complete all available exercises, check there are no console errors, and update `HANDOFF.md` with what changed and what remains. `node qa/qa-check.mjs` automates most of that bar (full E1–E4 loop at both widths, zero-console-error check, and the unit-copy staleness audit — see the authoring contract at the top of `exercises.js`); run it after any change, but it doesn't replace looking at the app yourself for visual/copy work.
