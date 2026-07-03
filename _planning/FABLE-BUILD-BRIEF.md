# Build Brief — CAD Intuition Gym ("Intent")

Prepared 2026-07-02 for dispatch to a fresh thread. Follows the portfolio's standard Fable-brief shape (`~/Coding/_planning/fable-briefs-2026-07-01.md`). Read `../PRD.md` in full before starting — this brief is the dispatch wrapper, the PRD is the spec.

## Model seat

**Taste seat: Fable-5** (`Agent` tool, `model: fable`) — this is new UI, new interaction design, and microcopy (intent briefs, takeaways, counter-contexts) where taste ≥ 7 matters, per `~/Coding/_docs/model-routing.md`. The Fable-5 window is open through ~2026-07-08; if it has closed by the time this runs, substitute **Opus-4.8** — the strategy is identical, only the seat changes (see routing doc's "Fable while available, else Opus" framing).

Delegate any clearly-mechanical sub-piece (e.g. generating repetitive SVG/path data for pre-authored exercise states, or scaffolding boilerplate) to the `codex` agent (gpt-5.5) — **spawn it and wait for the result; do not run `codex exec` or poll it yourself from the orchestrator seat.** This is a known regression risk (see routing doc's "Open thread" note from 2026-07-01/02).

## Problem

Beginners who've done a sketch-and-extrude in a CAD tool have never felt a model *break* on them three features downstream. The Onshape Learning Center teaches procedure; the CAD Challenges app teaches geometric reproduction (with feature history stripped, so learners can't even see *how* a model was built). Nothing teaches the strategic layer: *how to structure a model, and why* — anchoring to intent instead of to whatever geometry happens to be nearby. Full framing, spine, and rationale in `../PRD.md` §1–§3.

## Final outcome

A single deployable web artifact (static-hostable, e.g. GitHub Pages — matches this portfolio's default) implementing:

1. The **four MVP exercises** (E1–E4 in `../PRD.md` §7), each authored as the full content object from §6 — intent brief, 2–3 choices, change request, pre-authored per-path outcomes, takeaway, and a **required counter-context** (no exercise ships without one — this is a hard rule, not a nice-to-have).
2. The **six-step core loop** per exercise (§4), with the predict step (step 2) implemented as the lighter "which do you think?" tap per the resolved recommendation in §11.5 — but built so it's easy to upgrade to a fuller commit-a-guess interaction later without a rewrite.
3. **Toggle-and-compare** as a first-class interaction (§5) — the learner can flip between the "accident" and "intent" paths under the same change request and see both, not just be told the answer.
4. The **Onshape-mirroring visual model** (§8): a feature-list panel + sketch/canvas region + a changeable parameter, using plain language first and the CAD term second.
5. **localStorage-only progress** (§11.4, resolved) — no backend, no accounts.
6. **No bridge-to-Onshape task** in this build (§11.2, resolved — deferred to v2).

## Sources

- `../PRD.md` — the full spec (read completely; this brief doesn't restate the exercise content).
- `~/Coding/CAD-History/Opus-plan.md` — a sibling explorable built for related Onshape/CAD-education content (Hermite→Bezier→NURBS curve ladder). Same portfolio, same "vanilla-first, single deployable artifact, GitHub-Pages-able" instinct. Worth skimming for tone and technical patterns (e.g. its `drawCurve` / draggable-point primitives), **not** for content — the curve ladder and the modeling-judgment gym are unrelated subject matter.
- `~/Coding/CLAUDE.md` (project instructions) — stack table under "Preferred Stack" and the "Educational UI Patterns" three-panel layout (Tool palette | Canvas/Workspace | Code/Preview), which is structurally very close to what PRD §8 asks for. The PRD is explicitly tech-stack agnostic — use this as a strong default, not a mandate: **vanilla JS/single-file HTML** if the four-exercise MVP stays simple, **React + TS + Vite + Tailwind** if the pre-authored-state/toggle-compare logic across exercises benefits from componentization. Make the call and state the reasoning in the handoff.
- `~/Coding/_planning/design-agent-priorities.md` — read before any visual/layout decision. This surface is a hybrid: mostly **Product UI** register (quiet, dense, familiar controls — it's mirroring real CAD software), with the predict/reveal moments allowed to carry a little more **playful-learning** energy. Name this register explicitly per Priority 0 before styling. Avoid the Priority-1 hard-avoids list (no gradient text, no glassmorphism, no card-around-everything, etc.).

## Constraints

- No real CAD engine, no constraint solver — all consequences are pre-authored end states with interpolation (§5). Do not scope-creep into "just build a mini solver," even a simple one — that's a different, much bigger project.
- No exercise ships without a counter-context (§6 hard rule).
- No backend, no accounts (§11.4).
- No Onshape-bridge task this round (§11.2).
- Examples stay neutral/generic (brackets, plates, lids) — this is a general-beginner artifact, not tied to any one classroom or curriculum (§11.3).
- Plain-language-first, term-second in all copy (§8) — never lead with jargon.
- The consequence in each exercise must be **visually undeniable** — no error-message-reading required (§5).

## Suggested workflow

1. Read `../PRD.md` fully, then this brief, then skim `CAD-History/Opus-plan.md` for tone/pattern reference.
2. Name the design register (design-agent-priorities.md Priority 0) and pick the stack (vanilla vs. React) — **checkpoint** with a one-paragraph rationale before building.
3. Build the shared primitives first: the feature-list-panel + canvas shell, the pre-authored-state/interpolation mechanism, and the toggle-and-compare interaction. These power all four exercises — get this right once.
4. Author E1 end-to-end (content + interaction + counter-context) as the proof of the primitives — **checkpoint**: does the consequence actually feel undeniable, not just correct?
5. Author E2–E4 against the proven primitives.
6. Wire localStorage progress across the four exercises.
7. Self-check against the Evidence list below before declaring done.

## Human checkpoints

1. **Register + stack choice** (step 2 above) — confirm before the primitive build, since it's expensive to redo.
2. **E1 feel-check** (step 4) — Justin should actually play E1 (drag the plate-width slider, toggle A/B) before E2–E4 are authored, since E1 is the template the rest inherit.
3. **Final review** — Justin plays all four exercises end-to-end before this is called done or deployed anywhere public.

## Evidence required before completion

- Every one of E1–E4 has a working predict step, a working choose step, a working change-request interaction, pre-authored outcomes for every path, a takeaway, and a counter-context — verified by actually running the app, not by reading the code.
- Toggle-and-compare is exercised and confirmed working for at least E1 and E2 (screenshot or described observation, not just "the code has a toggle").
- No exercise's counter-context is a placeholder/TODO.
- The app runs from a cold load with no console errors, on both a desktop-width and mobile-width viewport.
- A short handoff note (append to this file or a sibling `HANDOFF.md`) stating: stack chosen + why, predict-step friction level chosen + why, and anything from the PRD's open call (§11.5) that got revisited.

## Kickoff prompt (paste into the new thread)

> Read `~/Coding/CAD-Intuition-Gym/PRD.md` and `~/Coding/CAD-Intuition-Gym/_planning/FABLE-BUILD-BRIEF.md` in full. Build the MVP described there: four judgment-spine CAD exercises (anchor-to-intent, mirror-from-one-source, fully-define, relate-features), each with a predict→choose→feel-consequence→name-it-and-flip-it loop, pre-authored (not solved) consequences, required counter-contexts, and a toggle-and-compare interaction. No backend — localStorage progress only. No Onshape-bridge task this round. Checkpoint with Justin on register/stack choice before building primitives, and again after E1 is playable before authoring E2–E4. Write everything inside `~/Coding/CAD-Intuition-Gym/`.
