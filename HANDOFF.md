# HANDOFF — CAD Intuition Gym

Last updated: 2026-07-10 by Codex (sync, reliability hardening, and live smoke check).

## What changed in this round (reliability hardening, 2026-07-10)

Synced `main` to `origin/main` (fast-forward to `2d6773f`) while preserving
the pre-existing local edit to `_planning/FABLE-PROMPT-2026-07-05.md`.
Three independent read-only audits covered code/accessibility, browser QA,
and roadmap state; the concrete findings below were implemented.

- **Progress storage is defensive** (`app.js`): valid JSON with the wrong
  shape (a string, number, array, or `null`) now safely falls back to empty
  progress instead of crashing on completion. When browser storage is blocked,
  progress now survives for the active session rather than disappearing on the
  first re-render.
- **Compare SVGs are deterministic** (`svg.js`, `exercises.js`): every scene
  now has unique pattern IDs, including the E1 wall hatch. Two side-by-side
  scenes no longer create duplicate document IDs or browser-dependent pattern
  references.
- **Accessibility basics tightened**: the unit toggle announces its current
  unit and action via an explicit accessible label/state; consequence scenes
  are named images rather than anonymous `role="img"` elements.
- **QA bootstrap is explicit and safer** (`qa/qa-check.mjs`, `qa/README.md`):
  an absent Playwright no longer triggers a surprise network install. A clean
  machine must opt in with `QA_ALLOW_INSTALL=1`; the pinned install runs with
  lifecycle scripts, audit, and funding requests disabled.
- **QA coverage expanded to 112 checks**: malformed saved-progress values,
  duplicate SVG IDs in compare mode, named scene images, and unit-control
  accessibility now run at both 1400×900 and 390×844. Full result: **112/112
  pass**, zero console/page errors, no horizontal overflow, and no stale unit
  strings. Visual mobile compare review also passed.

**Live status:** GitHub Pages was already configured from `main` at
https://lpcode808.github.io/CAD-Intuition-Gym/. A live browser smoke check
confirmed the root/subpath, four-exercise home screen, Google Fonts stylesheet,
no console errors, and no desktop overflow. These local hardening edits are
not live until they are committed and pushed.

**Next:** build the approved per-exercise, skippable bridge-to-Onshape cards;
then E5. Do not reopen predict friction — Justin approved the shipped light
tap. E5 needs its own human visual/playthrough check because it adds new
feature-tree scene vocabulary. `_planning/V2-SCOPE.md` was updated to reflect
the cleared gate and live deployment, rather than leaving the old gate active.
`_planning/FABLE-PROMPT-2026-07-10.md` is the Claude Code Web orchestration
prompt for that two-PR sequence. It assumes this hardening batch has first been
committed and pushed so the web runner can see the 112-check baseline.

## What changed in this round (gate cleared, 2026-07-09)

Justin played E1–E4 end-to-end and said **"yes, ship it."** This clears the
human-review gate that HANDOFF.md and `_planning/V2-SCOPE.md` both named as
the blocker on v2 build work and public deploy. It also resolves the
predict-friction open call from PRD §11.5 / V2-SCOPE.md §2: the light "which
do you think?" tap feels like enough friction as shipped — **`railPredict()`
is not being upgraded to a commit-a-guess lock-in.** Treat V2-SCOPE.md §2 as
closed, not just deferred.

No app code changed this round. What did change: `_planning/FABLE-PROMPT-2026-07-09.md`,
a new orchestration prompt for the next Fable/Opus thread that skips the now-
cleared gate check and goes straight to the v2 build order — GitHub Pages
deploy, then bridge-to-Onshape cards, then E5 (in that order, per
V2-SCOPE.md's recommendation). The prior prompt, `_planning/FABLE-PROMPT-2026-07-05.md`,
is now superseded but left in place as a record of the gate-check round.

What remains unchanged: no v2 app work has started yet. Next thread's first
real task is the GitHub Pages deploy, then bridge cards, then E5.
## What changed in this round (gate check + QA re-run, 2026-07-06)

This was a scheduled Fable pickup in a cloud container. Per the gate in
`_planning/FABLE-PROMPT-2026-07-05.md`, **no v2 work was started** — Justin's
E1–E4 playthrough answer (and his predict-friction verdict) is still
outstanding, and this run could only ask, not wait for an answer. Bridge
cards, E5, predict changes, and public deploy all remain untouched and gated.

What did happen:

- **`qa/qa-check.mjs` re-run in a fresh environment: 98/98 pass** (real
  headless Chromium, `file://` cold load, both widths). First re-run since
  the harness was written, on a different machine than authored it — good
  signal the harness is genuinely portable (it resolved Playwright from the
  container's global install, resolution path 2 in `qa/README.md`, which had
  never been exercised before).
- **One-line harness fix, `isFontRelated()` in `qa/qa-check.mjs`:** the
  documented Google-Fonts environmental exception never actually matched
  failed-stylesheet console errors, because Chromium puts the fonts URL in
  `msg.location().url` while the error *text* is just "Failed to load
  resource: net::ERR_CONNECTION_RESET" — and the classifier only checked
  `text`/`message`/`url`, never `location.url`. On the authoring machine
  fonts always loaded, so the gap was latent; this sandbox's network policy
  resets `fonts.googleapis.com` and surfaced it as a spurious 97/98 FAIL.
  The classifier now also checks `entry.location?.url`. Verified: the fonts
  reset is the *only* failing network request in the whole run (probed
  directly via `requestfailed` listeners), so nothing real is being masked —
  a genuine app error would still have a non-fonts location and still fail
  the run.
- **Visual spot-check from the harness screenshots** at 1400×900 and
  390×844: home screen, E1 consequence, compare, and counter-context all
  render correctly; system-font fallback (fonts blocked here) is fully
  legible. This supplements but does not replace Justin's human playthrough.

No app files (`index.html`, `app.js`, `exercises.js`, `svg.js`,
`style.css`) were touched this round.

## What changed in this round (handoff prompt check, 2026-07-05)

Claude Code added `_planning/FABLE-PROMPT-2026-07-05.md`, a ready-to-paste
orchestration prompt for the next Fable/Opus thread. It does not change app
behavior. The prompt correctly treats Justin's E1-E4 playthrough as the gate
before public deploy or v2 build work, points the next thread at
`AGENTS.md`, `HANDOFF.md`, and `_planning/V2-SCOPE.md`, and preserves the
Fable/Codex role split for future mechanical implementation.

Codex also refreshed `README.md`, which was stale and still described the
older "E1 playable, E2-E4 locked" state. The README now matches this handoff:
MVP complete, E1-E4 covered by QA, v2 gated on Justin's playthrough.

What remains unchanged: no v2 app work has started yet; bridge cards,
predict-friction changes, E5, and GitHub Pages deploy still wait on Justin's
playthrough/ship decision.

## What changed in this round (Fable orchestration, 2026-07-03 evening)

Planner/evaluator round per `_planning/FABLE-2026-07-03.md` — polish and
scoping only, no new exercises (deliberately: Justin's human review of E1–E4
gates any new content, see `_planning/V2-SCOPE.md`).

- **Favicon** (`index.html`): inline SVG data-URI of the app's own
  intent-mark motif (dashed ring + crosshair, accent blue). Kills the
  `/favicon.ico` 404 with zero extra network requests. Note: Safari ignores
  SVG favicons and may still quietly request `favicon.ico` — cosmetic,
  Chromium-verified clean.
- **Unit-copy footgun, resolved as policy + tooling** (the architecture call
  the brief flagged): the getter convention stays — no restructuring — but it
  no longer depends on authors remembering. (1) An AUTHORING CONTRACT comment
  now sits at the top of `exercises.js` with a ✓/✗ example; (2) the new QA
  harness audits it mechanically (below). A gpt-5.5 sweep of all ~995 lines
  found zero remaining getter violations and two borderline strings — E4's
  "box width + 4" label and its `#box_width + 4` takeaway equation — both now
  converted (`${fmtLen(4)}`), which also reads better in mm mode ("+ 4 mm").
- **`qa/qa-check.mjs` — durable Playwright QA harness** (new, committed):
  `node qa/qa-check.mjs`, no repo deps (resolves Playwright from a scratch
  install outside the repo — see `qa/README.md`). Covers the full E1–E4 loop
  at 1400×900 and 390×844, slider gating, compare panes, counter morals,
  done-marking, reset, zero-console-error bar, favicon, overflow, and a
  two-direction unit-staleness audit (cold-load mm → flip to in and vice
  versa, deep-walking `EXERCISES` incl. getters). Validated with a
  negative-control run (deliberately frozen getter → correctly flagged by
  exact property path). Current state: **98/98 pass.**
- **Storage guards** (`app.js`, `svg.js`): all `localStorage` access is now
  try/catch-guarded. Previously the unguarded read at `svg.js` script load
  could take the whole app down in browsers that block storage (locked-down
  classroom machines, strict privacy modes). Now the app degrades to
  session-only progress/unit preference instead of failing to render.
- **localStorage wrapper duplication — resolved: leave as-is.** The progress
  blob (`app.js`, JSON) and unit cache (`svg.js`, string, per-frame read
  pressure) have genuinely different shapes; unifying two tiny helpers adds
  abstraction without payoff.
- **Deploy readiness — confirmed.** Relative asset paths only, hash routing
  (subpath-safe), no fetches/CDN scripts; the only external requests are the
  Google Fonts stylesheet + preconnects. GitHub-Pages-ready as-is.
- **v2 scoped, not built:** `_planning/V2-SCOPE.md` — bridge-to-Onshape
  cards, the commit-a-guess predict dial (gated on Justin's playthrough
  verdict), and E5 shaped into the full template with its real cost named
  (a small feature-tree visualization is new scene vocabulary — that's the
  lift, not the copy). Recommended order is in the doc.

## What changed in this session (unit toggle)

Added a persistent mm/inch toggle (`.unit-toggle`, fixed pill top-right, `localStorage` key `cad-gym.unit`) that switches every dimension label, slider readout, and outcome note between millimeters and inches. Geometry stays in mm internally — a `fmtLen(mm, opts)` helper in `svg.js` is the single place that converts for display, and `getUnit()`/`setUnit()`/`toggleUnit()` live there too, backed by an in-memory cache (not a bare `localStorage.getItem()` per call) since scene draws hit `fmtLen()` many times per slider-drag frame.

Toggling calls `rerenderCurrent()` (a module-level function reference in `app.js`, reassigned by `renderHome()` and `renderPlayer()`) so it repaints whatever's on screen without resetting exercise progress or slider position.

**A real gotcha, worth knowing before touching `exercises.js` again:** most exercise-copy fields (`brief`, `predict`, `paths`, `change`, `counter`) are plain object literals built once when the script loads. A field like `label: fmtLen(60)` bakes in whichever unit was active at page load and **never updates again** — no error, just silent staleness. Any field whose text embeds a converted length must be a **getter** (`get label() { return \`...${fmtLen(60)}...\`; }`), not a plain string, so it re-evaluates on every read. Fields inside functions that are already called fresh per render (`outcome()`, `features()`, the `eNMainScene`/`eNCounterScene` scene functions) don't need this — they're naturally reactive.

A code-review pass (8-angle diff review, medium effort) on the first cut of this feature caught exactly this failure mode live in the field: `paths.a.sub` in E1 and E4, an `outcome()` note in E4, and two `⌀20`-quoting strings in E4's counter-context had unconverted mm numbers sitting next to correctly-converted siblings. All fixed and re-verified with a Playwright pass showing consistent units across the same screen in inch mode. If a future edit adds a new unit-bearing string to these objects, check whether it needs `get`.

## Status: MVP complete

All four exercises (E1–E4) are authored, playable end-to-end, and QA'd in a real
browser at desktop and mobile widths. The app remains a vanilla static
HTML/CSS/JS artifact — no backend, no build step, no solver, no Onshape bridge.

## What changed in this session

Starting point: E1 playable, E2–E4 locked placeholders (`available: false`).

- **E2 — One source of truth** (mirror, don't maintain twins), authored in full:
  - Main scene: a 160 mm bracket with two mounting holes whose spacing changes
    80→140 mm. Path B (two independent dimensions) plays the classic miss — you
    edit the left dimension, the forgotten right one glows red and the hole
    lands up to 30 mm short of its intent mark. Path A (sketch mirror) keeps
    the pair symmetric at every spacing. (Letters flipped in the 2026-07-03
    polish batch below — mirror moved from B to A.)
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
  - Note: at the time of authoring, this was the one exercise where the
    intent path was option **A** — since the 2026-07-03 polish batch also
    moved E2's intent path to **A**, that's no longer unique to E3, which is
    the point: option letters no longer correlate with "intent" anywhere.
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

## What changed in this batch (2026-07-03 polish pass)

Three small, targeted fixes on top of the completed MVP:

- **E2 choice order flipped.** Every exercise before this one happened to put
  the "intent" strategy under option **B**, which risked training "always
  pick B" instead of actually reading the two schemes. In `exercises.js`,
  E2's mirror strategy ("Sketch one hole, mirror it") is now path **A** and
  the two-independent-dimensions strategy is now path **B** — in the predict
  answer, the `paths` object, both `outcome()` functions, both `features()`
  functions, `e2MainScene`, `e2CounterScene`, and the counter's
  `defaultPath`/`pathLabels`. All copy text is unchanged; only which letter
  it sits under moved. Confirmed `app.js` never assumed a fixed letter→kind
  mapping — it always reads `ex.paths[p]` / `ex.predict.answer` generically,
  so no player-logic changes were needed.
- **Mobile compare-pane label legibility.** `style.css` gained a
  `@media (max-width: 480px)` rule that bumps `.compare .scenelabel`,
  `.compare .ghost-label`, `.compare .intent-label` (10px → 12px) and
  `.compare .dimtext` (11px → 13px). Compare panes render the same fixed
  520×300 SVG viewBox at a smaller on-screen width than the single-view
  scene does, so their labels were disproportionately tight at narrow
  widths — this only touches text inside `.compare`, so the single-view
  scene and desktop compare view are unaffected.
- **First-visit cue on the home screen.** In `app.js`, when no exercise has
  been completed yet, Exercise 1's action link reads "start here →" instead
  of "start →"; the other three still read the plain "start →". Once any
  exercise is marked done, all four revert to "start →". Text-only change,
  same `.ex-status` styling.

Verified with a real-Chromium Playwright pass (`file://` cold load) at
1400×900 and 390×844: E2 plays end-to-end after the flip (A/mirror = good,
B/two-copies = the forgotten-hole "mm short" failure; counter-context A/
mirror = the sensor-hole-dragged failure, B/two-copies = holds), the home
screen shows "start here →" on E1 only and reverts after completing an
exercise, zero console/page errors at both widths, and no horizontal
overflow at 390px.

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

- **Human final review: cleared 2026-07-09.** Justin played E1–E4 end-to-end
  and said "yes, ship it." Predict-friction stays as the light tap; no
  `railPredict()` change. See `_planning/FABLE-PROMPT-2026-07-09.md` for the
  next thread's build order.
- Deploy target: GitHub Pages, confirmed ready as-is (static root, relative
  paths, hash routing), now authorized. One-time post-deploy check: fonts
  load on a normal connection (the sandboxed QA box couldn't reach Google
  Fonts once).
- v2 items: scoped with recommendations and decision points in
  `_planning/V2-SCOPE.md` (bridge cards → E5, in that order, now that
  predict-friction and deploy are both resolved).

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
