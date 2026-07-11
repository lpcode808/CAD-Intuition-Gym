# V2 scope — CAD Intuition Gym

Written 2026-07-03 (Fable orchestration round, see `FABLE-2026-07-03.md`).

## Status update — 2026-07-10

Justin cleared the E1–E4 review gate on 2026-07-09: **“yes, ship it.”** The
GitHub Pages site is live from `main` at
`https://lpcode808.github.io/CAD-Intuition-Gym/`; its root/subpath, live font
stylesheet, clean console, and desktop-width layout were smoke-checked on
2026-07-10. The light predict tap is now a settled decision — keep it; do not
build the commit-a-guess variant below.

None of the product additions in this document are built yet. The next scoped
product item is the per-exercise bridge card, then E5. Treat the “why nothing
was built” section as historical context, not an active gate.

## Historical: why nothing here was built in the original round

At the time, the build-brief's checkpoint 3 (Justin plays E1–E4) was
outstanding. Stacking new content on an unreviewed base risked compounding on
a foundation his playthrough might revise — especially the predict-friction
call, which E5 would inherit. That round therefore polished the existing app
and shaped the v2 candidates to be buildable immediately after review.

## Recommended order (post-gate)

1. ~~**Deploy to GitHub Pages**~~ — complete; live smoke-checked 2026-07-10.
2. ~~**Predict-friction decision**~~ — complete; keep the light tap.
3. ~~**Bridge-to-Onshape cards**~~ — complete 2026-07-11; see below.
4. **E5** — next; the real authoring lift, with the footgun tooling
   (getter contract + `qa/qa-check.mjs` audit) already in place.

---

## 1. Bridge-to-real-Onshape micro-tasks (PRD §4 step 6, deferred 2026-07-02)

**Status: shipped 2026-07-11.** One optional "Try the real thing" card per
exercise, rendered at the bottom of the takeaway step (after the Done
button). Copy + an outbound link to `https://cad.onshape.com` only — no
integration, no accounts. Skippable, never gates the Done button or saved
progress (QA-asserted). See `HANDOFF.md` for the full round writeup.

Decision made: per-exercise cards, not a single completion-screen block —
per-exercise reads as more actionable and keeps the task in the exercise's
own vocabulary.

## 2. Closed: fuller commit-a-guess predict (PRD §11.5)

**Current state:** light "which do you think?" tap, deliberately low-friction.
HANDOFF confirms an upgrade only touches `railPredict()` in `app.js`.

**Shape if dialed up:** learner must select A/B and press "lock it in" before
the choose step unlocks; at the consequence reveal, show their locked guess
against what happened ("You bet on A. Watch."). Optionally count predict
accuracy in `cad-gym.v1` (note: progress-shape change — keep the reader
tolerant of the old shape, don't migrate).

**Decision (2026-07-09):** the light tap is enough. Do not build this.

## 3. E5 — sketch-level vs. part-level features (PRD §7, stretch)

**The judgment:** put each decision at the level where you'll want to change
it later. Features are future edits, filed in advance.

**Draft shape (E1–E4 template):**
- **Intent:** a plate needs four mounting holes that marketing keeps moving.
- **Choices:** (a) draw the four circles inside the base sketch profile;
  (b) keep the base sketch a clean outline, add the holes as their own
  part-level feature.
- **Change request:** "drop the hole count to two and move them" — with (a)
  you're doing surgery inside a crowded base sketch (the scene shows the
  tangle: every edit risks the outline itself); with (b) you edit one
  self-contained feature and the base never flinches.
- **Takeaway:** "The base sketch is the part's identity. Everything you
  expect to revisit deserves its own line in the tree."
- **Counter-context:** a one-off profile where a notch is intrinsic to the
  outline — splitting it into micro-features just makes the tree noisy.
  One sketch, one extrude, done. Simplicity *is* the intent.

**The real cost (scope risk):** E1–E4's scenes only show geometry. E5's
consequence lives partly in the *feature tree* — it needs a small tree
visualization (two or three rows, highlight the row being edited) as new
scene vocabulary in `svg.js`/`style.css`. That's the bulk of the lift, not
the copy. Estimate: one prior exercise's authoring effort plus one new visual
component.

**Prerequisite discipline:** every unit-bearing copy string follows the
getter contract at the top of `exercises.js`; run `qa/qa-check.mjs` before
calling it done.

## Explicitly not in v2

Accounts/backend, authoring tools, a real solver, comprehensive feature
coverage — all reaffirmed non-goals per PRD §10/§11.
