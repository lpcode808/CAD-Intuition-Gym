# Fable Orchestration Prompt — CAD Intuition Gym v2 build

**Use after the 2026-07-10 reliability-hardening changes are committed and
pushed to a branch or merged to `main`.** Claude Code Web cannot see the local
working tree summarized in `HANDOFF.md` until that happens.

Paste everything below the rule into a new Claude Code Web task using Fable
(or the strongest available Opus seat) with the CAD Intuition Gym repository.

---

Read `AGENTS.md` first. (This repository has no repo-level `CLAUDE.md`; do not
wait for one. Claude Code Web should treat `AGENTS.md` as the canonical project
instruction file.) Then read `PRD.md` in full — its product
constraints are settled, so do not re-litigate audience, the judgment-first
exercise structure, or the vanilla/local-first architecture. Then read
`HANDOFF.md`, `_planning/V2-SCOPE.md`, and `qa/README.md`. Finally inspect
`qa/qa-check.mjs` and the unit-bearing-copy authoring contract at the top of
`exercises.js` before planning any implementation.

You are the orchestrating seat: own product judgment, copy, integration,
evaluation, and the final call. Before substantive implementation, state the
role split. Delegate isolated mechanical slices to subagents in isolated
worktrees, or to the Codex subagent when that is the cleaner execution seat.
Do not build the feature inline. Keep each subagent's scope bounded, wait for
its result, then judge the result yourself by reading the diff and driving the
app. The builder does not grade itself.

## Starting state — verify, do not redo

- Justin played E1–E4 and said **“yes, ship it.”** The review/deploy gate is
  cleared.
- GitHub Pages is already live from `main` at
  `https://lpcode808.github.io/CAD-Intuition-Gym/`; its subpath, live fonts,
  console, and desktop layout were smoke-checked on 2026-07-10.
- The light predict tap is approved. Do not touch `railPredict()` and do not
  build the declined commit-a-guess variant.
- The 2026-07-10 hardening pass should already be present: defensive progress
  parsing with session fallback, unique compare-SVG pattern IDs, named scene
  images, an explicit unit-toggle accessible state, opt-in Playwright bootstrap,
  and the expanded **112/112** QA baseline. If any of that is absent, stop and
  report that this task was started from the wrong branch/base; do not silently
  recreate it inside a feature PR.
- Preserve vanilla HTML/CSS/JS, pre-authored consequences, browser-only
  progress, plain-language-first/CAD-term-second copy, and the rule that no
  exercise ships without a counter-context.

## PR 1 — bridge the simulator to real Onshape

Start with the remaining small v2 item in `_planning/V2-SCOPE.md` §1:
per-exercise, optional “try it in Onshape” cards after the takeaway. The
placement decision is settled for this run: use one card per exercise, not a
single completion-screen block.

The card must be skippable and must never gate progress. It is copy plus an
official outbound Onshape link — no login flow, API, screenshots, accounts, or
integration. Each E1–E4 micro-task should rehearse that exercise's judgment in
the smallest real action possible:

- E1: replace an edge-relative dimension with an intent anchor and move the
  surrounding geometry.
- E2: create or inspect a mirrored pair, then change the source once.
- E3: find blue under-defined sketch geometry and drag it to feel the slack.
- E4: compare a typed constant with a relationship/variable, then change the
  upstream dimension.

Fable owns the final wording and verifies that each task is feasible in
current Onshape terminology. Delegate the repeatable content-object additions,
rail-card wiring, styling, and QA assertions as bounded execution slices.
Extend the harness to prove all four cards appear in the correct exercise,
use valid official HTTPS links, open safely in a new tab, and do not affect the
Done-button gate or saved progress.

Open one focused PR for this item. In the PR description include: what changed,
what was deliberately excluded, the exact QA result, desktop/mobile visual
evidence reviewed, and any remaining uncertainty in the Onshape wording.
Merge or otherwise establish a clean reviewed base before PR 2; do not stack
both roadmap items into one giant PR.

## PR 2 — E5, feature decisions belong where future edits belong

Only after PR 1 passes its full bar, move to `_planning/V2-SCOPE.md` §3: E5,
sketch-level versus part-level features. This is the deep v2 item; budget it
more design and evaluation time than the bridge cards.

Follow the complete E1–E4 loop without shortcuts: intent, predict, choose,
change request, visually undeniable consequence, takeaway, and a genuine
counter-context. The main case is a plate whose four mounting holes later drop
to two and move: burying them in the base sketch creates crowded surgery;
keeping the base outline clean and putting holes in their own feature makes the
change local. The counter-context is a one-off intrinsic notch where splitting
the profile into micro-features creates noise — simplicity is the intent.

The consequence is partly structural, so give E5 enough visual vocabulary to
make the feature-tree difference legible. Design a small, CAD-familiar feature
tree (roughly 2–4 rows with the edited row and affected geometry clearly
linked), not a text explanation pasted beside unchanged geometry. Preserve the
quiet product-UI register; let the failure/reveal carry the visual energy.
Delegate the mechanical scene primitives, content-object wiring, and harness
extension, but keep the interaction shape, copy, and final visual judgment in
the orchestrating seat.

Extend `qa/qa-check.mjs` so E5 is completed through both main and
counter-context loops at 1400×900 and 390×844. Update exercise counts and
E1–E4 wording in QA/docs wherever it becomes stale. Every new unit-bearing
static content field must obey the getter contract in `exercises.js`.

Open a second focused PR for E5. Do not call it shipped merely because tests
pass: mark it ready for Justin's human playthrough because the feature-tree
scene is new visual vocabulary. Stop there and request that review before any
new exercise or public-scope expansion.

## Full verification bar — required for each PR

After every subagent handoff and before every PR:

1. Read the complete diff and inspect for scope creep, duplicated primitives,
   frozen unit copy, accidental solver logic, and progress-schema regressions.
2. Run `node qa/qa-check.mjs`; require 100% pass. If Playwright is absent on
   the web runner, follow `qa/README.md`'s explicit opt-in setup rather than
   silently installing packages.
3. Launch and actually drive the complete affected flow in a real browser at
   1400×900 and 390×844. Exercise the slider, compare toggle, counter-context,
   unit toggle, Done gate, reset, and the new interaction/card.
4. Capture screenshots of the meaningful changed states at both widths and
   read the screenshots back yourself. Check clipping, overflow, label size,
   focus visibility, consequence legibility, and whether the new material
   still feels like the same application.
5. Confirm zero console/page errors and no horizontal overflow. For outbound
   links, verify the official destination and safe target/rel attributes.
6. Update `HANDOFF.md`, `_planning/V2-SCOPE.md`, `README.md`/`qa/README.md` if
   their counts or state changed, and append the portfolio handoff log in the
   required format.

## Hard stops

- Do not reopen predict friction, audience, framework choice, backend/accounts,
  real solver, authoring tools, or comprehensive CAD coverage.
- Do not build an Onshape bridge/API; the bridge cards are optional practice
  prompts and links only.
- Do not start E6, public analytics, a curriculum-management layer, or any
  feature beyond `_planning/V2-SCOPE.md` without Justin's sign-off.
- Do not commit directly to `main`. One independently reviewable PR per roadmap
  item; keep agent worktrees isolated and clean them up after integration.
- If the 2026-07-10 hardening baseline is missing on the remote branch, stop
  and report the prerequisite instead of mixing recovery work into PR 1.
