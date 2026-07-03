# PRD — CAD Intuition Gym (working title: *Intent*)

**One line:** A beginner web tool that builds CAD *modeling judgment* — not button knowledge — by making learners commit to a modeling decision, then feel its deferred consequence instantly.

**Status:** MVP spec for a build agent. Tech-stack agnostic. Behavior is specified; implementation is the agent's call.

---

## 1. The gap this fills

The existing ecosystem already covers two layers well, so **do not rebuild them**:

- **Procedural** ("which button, which menu") — Onshape's Learning Center, YouTube playlists, bootcamp, certification.
- **Geometric reproduction** ("can you build this shape from a drawing") — the Onshape CAD Challenges app, FRC "CAD calisthenics" decks.

Neither teaches the **strategic layer**: *how to structure a model and why.* Tellingly, the Challenges app hands learners a finished part with the feature history stripped out — so a learner literally cannot see *how it was built* or *why*. That reasoning layer is the gap. This product owns exactly that layer and nothing else.

## 2. Target user

A **beginner**: someone who has opened a CAD tool, drawn a sketch, and extruded something — but has **never felt a model break on them.** They don't yet have design intent of their own, and they've never paid the price for a bad modeling decision three features downstream. That last fact drives the entire design: **we must supply the intent and manufacture the consequence**, because the learner can't bring either.

**Confirmed 2026-07-02: general beginner CAD learners** — not a specific classroom. Not the target (v1): experienced CAD users, people who need certification prep, people who want to learn specific Onshape features. Keep examples neutral/generic (brackets, plates, lids) rather than tied to any one curriculum.

## 3. The one thing it teaches (the spine)

Everything descends from a single idea:

> **Model your intent, not your accident.**

A beginner's instinct is to dimension off whatever edge is nearby, type in whatever number looks right, and duplicate things by hand. Each of those is anchoring to an *accident* of the current geometry. The skill is anchoring to the *thing that expresses what the part is for* — so the model survives change. Every exercise is one face of this:

- Anchor to a stable reference, not a convenient edge.
- Mirror from one source, don't maintain two copies.
- Fully define, so nothing drifts on you.
- Relate features to each other, don't hardcode independent numbers.

**Decision (confirmed 2026-07-02): organize by judgment, not by CAD topic.** Rejected alternative: organizing by CAD topic (a "sketching" unit, a "mirroring" unit) — that's how the Learning Center is structured, and it teaches *features*. This product is deliberately organized by *judgment* instead. This is the load-bearing architectural decision — every content and navigation choice downstream should reinforce "which principle is this," not "which CAD feature is this."

## 4. Core loop (per exercise)

Six steps. Steps 2 and 5 are what make this a gym rather than a guide.

1. **Brief the intent.** Plain language: what this part is for, and *what is going to change about it.* (The learner has no intent of their own, so we hand it to them as a first-class object. This is non-negotiable — the strategic choice is only meaningful relative to a stated intent.)
2. **Predict.** Before choosing, the learner commits to a guess about what will happen. This converts the later reveal from "shown" into "felt." (Friction dial — can be softened if beginners bounce. **Open call, see §11** — start light, tune from there.)
3. **Choose.** Pick a modeling strategy from 2–3 options.
4. **Feel the consequence.** A "change request" arrives (a slider to drag, or a stated design change) and plays the learner's choice out against the intent. **Both the good and bad paths are explorable** — the learner can toggle between strategies and watch the difference, not just be told.
5. **Name it + flip it.** A one-line generalizable takeaway, immediately followed by a *second context where the opposite choice is correct.* This is a hard requirement (see §6). Prevents brittle-rule learning.
6. **Bridge (deferred to v2 — confirmed 2026-07-02).** A "now do this one thing in real Onshape" micro-task. Not in MVP scope — see §11.

## 5. The sandbox mechanic

- **No real CAD engine. No constraint solver.** Consequences are **pre-authored and curated**, not computed. Each exercise ships two (or three) hand-built end states — the "intent-honoring" path and the "accident" path(s) — and the draggable parameter interpolates between pre-defined states. This keeps the build tractable and lets us *choreograph* the gotcha precisely, which a real solver wouldn't.
- **The consequence must be visually undeniable.** A hole visibly drifting off-center as a plate widens. A sketch visibly squirming when nudged. The beginner should not need to interpret an error message — they should *see* the part misbehave.
- **Toggle-and-compare is core**, not a bonus. Seeing A hold while B fails, side by side under the same change, is the mechanism.

## 6. Content architecture

Every exercise is authored as this object:

- **Intent brief** — what it's for + what will change.
- **Choices** — 2–3 modeling strategies (at least one "accident," at least one "intent").
- **Change request** — the parameter or design change that reveals the consequence.
- **Per-path outcome** — the pre-authored visual result for each choice under the change.
- **Takeaway** — one generalizable line.
- **Counter-context (required)** — a short second scenario where a *different* choice is right, so the takeaway reads as conditional ("it depends on the intent"), never as a fixed rule.

**Hard rule:** no exercise ships without its counter-context. A rule taught without its exception becomes a superstition.

## 7. Starter exercise set (MVP)

Four exercises, all descending from the spine, ordered so each unlocks the next. Specced concretely enough to build.

### E1 — Anchor to intent, not to a convenient edge *(the seed)*
- **Intent:** A plate with one hole. The hole must stay centered as the plate gets wider.
- **Choices:** (a) dimension the hole from the left edge; (b) dimension it symmetric about the center / origin.
- **Change request:** drag a "plate width" slider.
- **Outcome:** (a) hole drifts off-center; (b) hole stays put.
- **Takeaway:** "Dimension to the thing that expresses your intent — here, the center — not to whatever edge is closest."
- **Counter-context:** a part where the hole must sit a fixed distance *from one edge* (e.g. a screw boss near a wall) — now edge-anchoring is correct. Same decision, opposite answer, because the intent flipped.

### E2 — Mirror from one source, don't keep two copies
- **Intent:** A bracket with two mounting holes that must stay symmetric.
- **Choices:** (a) place two holes independently; (b) place one and mirror it across a centerline.
- **Change request:** "the client moved the mounting spacing" — change the drive dimension.
- **Outcome:** (a) you edit twice, and the demo shows them drifting out of symmetry when you forget one; (b) both move together, symmetry preserved.
- **Takeaway:** "One source of truth. If two things must stay related, don't maintain them separately."
- **Counter-context:** two holes that must be *independently* adjustable (different fasteners) — mirroring would now be wrong. Independence *is* the intent.

### E3 — Fully define, so it can't drift
- **Intent:** A simple sketch that looks correct but isn't fully constrained.
- **Choices:** (a) leave it looking right; (b) add constraints/dimensions until it's fully defined.
- **Change request:** an upstream dimension changes / the learner nudges a point.
- **Outcome:** (a) the under-defined geometry squirms unpredictably; (b) it holds its shape.
- **Takeaway:** "If it *can* move, eventually it *will* move on you. Looking right isn't being right."
- **Counter-context:** an early rough-concept sketch you deliberately leave loose to explore proportions — under-defined on purpose, because the intent is exploration, not commitment.

### E4 — Relate features, don't hardcode numbers
- **Intent:** A lid that must always overhang the box it covers by 2 mm.
- **Choices:** (a) type the lid size as an absolute number; (b) reference the box dimension + a 2 mm offset.
- **Change request:** the box gets bigger.
- **Outcome:** (a) the lid no longer fits; (b) the lid tracks the box automatically.
- **Takeaway:** "A relationship is intent made durable. When two dimensions belong together, link them."
- **Counter-context:** a standardized part that must stay a fixed size regardless of neighbors (e.g. a bolt hole for an M4) — hardcoding is correct because the intent is a fixed standard.

### E5 — *(stretch / v2)* Where does the feature belong — sketch level or part level?
Flagged as more advanced; likely out of the beginner MVP. Left here so the architecture anticipates it.

## 8. Visual & interaction model

- **Mirror Onshape's mental furniture** even though the engine is faked: a sketch region, a **feature list on the left**, and a changeable parameter. The point is that when the learner opens real Onshape, the layout and vocabulary are already familiar — transfer should be frictionless.
- **Plain language first, term second.** Introduce the CAD term alongside the everyday phrase ("anchor it to the center — in Onshape this is a *symmetric constraint*"), never term-first.
- **Beginner-safe:** heavy visual, minimal reading, one decision on screen at a time, no jargon walls.

## 9. Graduation / transfer

The risk of a faked sandbox is that learners master *the game*, not the skill. Mitigations:

- The sandbox looks and behaves like Onshape's model tree (see §8).
- Framing throughout: "this is a flight simulator; the real cockpit is one tab away."
- (Bridge task deferred to v2, see §11 — this framing still applies even without a shipped micro-task; it sets expectations for a future bridge.)

## 10. Non-goals / explicit scope cuts

- **Not** a real CAD engine or constraint solver — pre-authored consequences only.
- **Not** comprehensive feature coverage — the Learning Center owns that.
- **Not** teaching *which button to click* — we teach *which decision to make*.
- **Not** certification prep.
- **Not** an authoring tool for teachers (v1). Content is fixed, hand-built.
- **Not (MVP)** a bridge-to-real-Onshape task — deferred to v2 (see §11).
- **Not** a persistent-account / cross-device product (v1) — see §11.

## 11. Decisions (resolved 2026-07-02) and one open call

Resolved directly with Justin before build dispatch:

1. **Spine vs. topic organization (§3):** confirmed — judgment-spine, not feature-topic. Load-bearing; do not restructure around CAD topics.
2. **Bridge to real Onshape (§4 step 6, §9):** deferred to v2. MVP proves the standalone judgment-loop; no Onshape-coupled micro-tasks this round.
3. **Audience (§2):** general beginner CAD learners, not a specific classroom. Portfolio-shippable artifact, not a curriculum-embedded tool. Keep examples neutral (generic brackets/plates/lids), not tied to any one project domain.
4. **Progress/accounts (non-goal, §10):** no backend. Anonymous, single-device, localStorage-only progress for MVP.

Still open — **the build agent's judgment call, not a blocker**:

5. **Predict-step friction (§4 step 2):** full "commit a guess" vs. a lighter "which do you think?" tap. Recommendation: ship the lighter tap-based version first (lower risk of beginners bouncing off friction), but make it trivially easy to dial up to a fuller commit-a-guess interaction later — treat this as a tunable, not a fixed spec. Note the choice and reasoning in the build handoff.
