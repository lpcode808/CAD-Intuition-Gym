# HANDOFF — CAD Intuition Gym

Last updated: 2026-07-03 by Codex.

## Recovered Session

Justin asked to recover Claude Code session `96090277-aebf-44cd-a5bc-d63914531188` and document the project so it can be pushed to GitHub and resumed overnight in Claude Code Cloud.

Evidence:

- Claude history entry: `/Users/justinlai/.claude/history.jsonl`
- Full session file: `/Users/justinlai/.claude/projects/-Users-justinlai-Coding/96090277-aebf-44cd-a5bc-d63914531188.jsonl`
- Session title: `Build CAD Intuition Gym MVP with four exercises`
- Last prompt: build E1-E4 from `PRD.md` and `_planning/FABLE-BUILD-BRIEF.md`
- Stop condition: rate limit at `2026-07-03T08:15:15Z`
- Last concrete edit before limit: added `dimV(...)` to `svg.js`

## Current State

The app is a vanilla static HTML/CSS/JS prototype.

What exists:

- Product spec: `PRD.md`
- Fable build brief: `_planning/FABLE-BUILD-BRIEF.md`
- Static shell: `index.html`
- App/router/player: `app.js`
- SVG helper vocabulary: `svg.js`
- Exercise content/scenes: `exercises.js`
- Styling: `style.css`

Playable state:

- E1 is available and implements the full loop:
  - intent brief
  - light predict tap
  - choose a scheme
  - width-change slider
  - toggle/compare paths A and B
  - takeaway
  - counter-context where edge anchoring becomes correct
- localStorage progress writes to `cad-gym.v1`.

Not done:

- E2-E4 are placeholders in `exercises.js` with `available: false`.
- No final desktop/mobile browser QA has been recorded after the recovered session hit the limit.
- No git repository exists yet in `CAD-Intuition-Gym/` as of this handoff.

## Design / Stack Choices Already Made

- Register: quiet product UI that mirrors CAD software chrome. The consequence moments carry the energy.
- Stack: vanilla HTML/CSS/JS, because the MVP is static, hand-authored, and does not need a build step.
- Predict friction: light "which do you think?" tap, not a long written commitment. This matches `PRD.md` §11.5 and keeps beginner friction low.
- Scene model: pre-authored SVG states driven by a slider. No solver.

## Resume Prompt

Paste this into Claude Code Cloud after pushing the repo:

```txt
Read `AGENTS.md`, `PRD.md`, `_planning/FABLE-BUILD-BRIEF.md`, and `HANDOFF.md` in full. Continue the recovered Claude Code session `96090277-aebf-44cd-a5bc-d63914531188`.

Current state: E1 is playable in the vanilla static app. E2-E4 are intentionally locked placeholders in `exercises.js`. Finish the MVP by authoring E2-E4 with the same full loop: intent brief, light predict tap, choose, change-request slider, pre-authored visual consequences, toggle-and-compare, takeaway, and required counter-context. Keep the app static and localStorage-only. Do not add a backend, build step, real solver, or Onshape bridge.

Before finishing, run the app in a browser at desktop and mobile widths, complete E1-E4 end-to-end, verify no console errors, and update `HANDOFF.md` with what changed, what remains, and any QA notes. If you initialize git or commit, use normal project-repo hygiene; do not force-push.
```

## Implementation Notes For E2-E4

Use E1 as the template. Each exercise should add:

- A main scene function.
- A counter-context scene function.
- A full exercise object in `EXERCISES`.
- `available: true` only after the loop and counter-context actually work.

Suggested scene directions from the PRD:

- E2: bracket holes. Independent holes drift or require double maintenance; mirrored holes preserve symmetry. Counter-context: independently adjustable holes where mirroring is wrong.
- E3: under-defined sketch. Loose geometry squirms when nudged; fully defined geometry holds shape. Counter-context: rough concept sketch intentionally left loose for exploration.
- E4: lid and box. Hardcoded lid size stops fitting when the box grows; related dimension tracks box plus 2 mm offset. Counter-context: fixed standard part, such as an M4 bolt hole, where hardcoding is correct.

## QA Checklist

- E1-E4 appear as startable exercises on the home screen.
- Each exercise can be completed from cold load.
- The prediction chip appears after dragging far enough.
- The continue button remains disabled until the learner has moved the change slider.
- Compare mode shows both paths side by side.
- The counter-context slider and scheme toggle work.
- Completing an exercise marks it done on the home screen.
- Reset progress clears `cad-gym.v1`.
- Desktop width has no console errors or incoherent overlap.
- Mobile width has no horizontal overflow or clipped controls.
