# HANDOFF — CAD Intuition Gym

Last updated: 2026-07-03 by Claude Code (cloud session, resuming recovered session `96090277-aebf-44cd-a5bc-d63914531188`).

## Status: MVP complete

All four exercises (E1–E4) are authored, playable end-to-end, and QA'd in a real
browser at desktop and mobile widths. The app remains a vanilla static
HTML/CSS/JS artifact — no backend, no build step, no solver, no Onshape bridge.

## What changed in this session

Starting point: E1 playable, E2–E4 locked placeholders (`available: false`).

- **E2 — One source of truth** (mirror, don't maintain twins), authored in full:
  - Main scene: a 160 mm bracket with two mounting holes whose spacing changes
    80→140 mm. Path A (two independent dimensions) plays the classic miss — you
    edit the left dimension, the forgotten right one glows red and the hole
    lands up to 30 mm short of its intent mark. Path B (sketch mirror) keeps
    the pair symmetric at every spacing.
  - Counter-context: same plate, but the left hole sits over a glued-down
    sensor and the right one follows a connector the client keeps moving.
    Mirroring now drags the sensor hole off its pad — independence is the
    intent.
- **E3 — Pin it down** (fully define), authored in full:
  - Main scene: a five-line tab profile that looks identical either way. A
    "pull on the apex" slider tugs the sketch: the fully defined version
    (black, dimensioned) doesn't give; the loose version (blue, per Onshape's
    vocabulary) squirms up to 27 mm off the ghosted drawing with a visible
    pull arrow and drift line.
  - Counter-context: a ten-minute-old concept sketch. Fully defined refuses to
    explore ("nothing budges"); loose morphs freely between two pre-authored
    proportion variants. Slack matched to intent.
  - Note: this is the one exercise where the intent path is option **A**, so
    "always pick B" doesn't become the meta-game.
- **E4 — Link what belongs together** (relate, don't hardcode), authored in
  full:
  - Main scene: box + lid cross-section. Box grows 100→160 mm. The hardcoded
    104 mm lid goes flush, then the box sticks out past it with red-hatched
    exposed-cavity regions and a "mm short" dimension. The linked lid
    (= box width + 4) holds its 2 mm overhang at every size.
  - Counter-context: a panel hole for a standard ⌀20 mm push-button switch.
    Linking the hole to the panel width scales it to ⌀40 and the switch swims
    in it; the typed ⌀20 is correct because the reference is a standard, not a
    neighbor.
- `app.js`: the two step-gating hint strings ("drag the width first…") were
  E1-specific hardcoded copy; they now read from `ex.change.hint` /
  `ex.counter.hint` with generic fallbacks. E1's original lines moved into its
  content object. No other player changes were needed — E1's loop generalized
  cleanly.
- `style.css`: added scene vocabulary for the new exercises — `.part.is-loose`
  (Onshape blue for under-defined entities), `.part.alt` (lid fill),
  `.pull-line`, `.offline` (drift indicator), `.gap-bad` (exposed cavity),
  `.switch-part`/`.switch-mark`, and `bad`/`accent` scene-label tints.

All four exercises follow the E1 template exactly: intent brief → light
predict tap → choose → change-request slider with pre-authored outcomes →
toggle + side-by-side compare → takeaway → required counter-context with its
own slider and scheme toggle. No counter-context is a placeholder.

## Design / stack choices (unchanged from the recovered session)

- Register: quiet product UI that mirrors CAD software chrome; the consequence
  moments carry the energy.
- Stack: vanilla HTML/CSS/JS — static, hand-authored, no build step.
- Predict friction: light "which do you think?" tap (PRD §11.5). Upgrading to
  a fuller commit-a-guess later only touches `railPredict()` in `app.js`.
- Scene model: pre-authored SVG states driven by a slider; no solver.

## QA notes (2026-07-03)

Automated Playwright run against a real Chromium, `file://` cold load, at
1400×900 (desktop) and 390×844 (mobile). Full pass at both widths:

- E1–E4 all appear startable on the home screen and complete from cold load.
- Continue stays disabled until the change slider moves; the prediction chip
  reveals past ~55% travel; compare mode shows two panes with per-path outcome
  chips; the counter-context slider and scheme toggle work in every exercise;
  the moral stays hidden until the counter slider moves.
- Completing each exercise marks it done on the home screen; Reset progress
  clears `cad-gym.v1` and returns all four to startable.
- No horizontal overflow at 390 px; compare panes stack vertically.
- Zero console/page errors from the app itself. The only console error in the
  sandboxed QA environment was the Google Fonts stylesheet being blocked by
  that sandbox's network policy (`fonts.googleapis.com`, ERR_CONNECTION_RESET)
  — environmental, not an app bug; font stacks fall back to system fonts and
  the page is fully usable. Worth a one-time re-check on a normal connection
  after deploy.
- Visual spot-checks (screenshots reviewed): each exercise's failure state is
  visually undeniable — red off-dimensions against blue dashed intent marks in
  E1/E2, the blue sketch squirming off its ghosted drawing in E3, the box
  outgrowing its lid / the switch swimming in its hole in E4.

## What remains (post-MVP / v2 candidates)

- Human final review: Justin plays E1–E4 end-to-end (build-brief checkpoint 3)
  before deploying anywhere public.
- Deploy target: the repo is GitHub-Pages-ready as-is (static root).
- v2 items per PRD §11: bridge-to-real-Onshape micro-tasks, fuller
  commit-a-guess predict interaction if the light tap proves too breezy, E5
  (sketch-level vs. part-level features).
- Nice-to-have polish, not blocking: scene labels in the small compare panes
  are dense at mobile widths (legible but tight); could scale up on
  `max-width` if it bothers anyone in real use.

## QA checklist (verified this session)

- [x] E1–E4 appear as startable exercises on the home screen.
- [x] Each exercise can be completed from cold load.
- [x] The prediction chip appears after dragging far enough.
- [x] The continue button remains disabled until the learner has moved the change slider.
- [x] Compare mode shows both paths side by side.
- [x] The counter-context slider and scheme toggle work.
- [x] Completing an exercise marks it done on the home screen.
- [x] Reset progress clears `cad-gym.v1`.
- [x] Desktop width has no console errors or incoherent overlap.
- [x] Mobile width has no horizontal overflow or clipped controls.
