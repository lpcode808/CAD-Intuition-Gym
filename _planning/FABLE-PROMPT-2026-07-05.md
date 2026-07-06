# Fable Orchestration Prompt — CAD Intuition Gym v2

**How to use:** paste everything below the rule into a new Claude Code thread
running Fable (or Opus, if past the Fable window), cwd `~/Coding/CAD-Intuition-Gym`.

---

You're picking up CAD Intuition Gym after the 2026-07-03 polish round. Read
`AGENTS.md`, `HANDOFF.md`, and `_planning/V2-SCOPE.md` in full before doing
anything else — they contain the hard rules (counter-context required on
every exercise, getter contract for unit-bearing copy, `qa/qa-check.mjs` must
pass) and the scoped v2 backlog you're about to build.

## Gate check first — do not skip

HANDOFF.md and V2-SCOPE.md both say Justin's own E1–E4 playthrough is the
gate before any v2 work starts, and before anything deploys publicly. Ask him
directly, first message: has he done that playthrough yet, and did it change
his read on the predict-friction feel (light "which do you think?" tap vs.
the fuller commit-a-guess lock-in)? Don't start building until he answers. If
he says go ahead, proceed; if he hasn't played it, offer to wait or note that
proceeding is at his own risk — his call, not yours.

## Your seat vs. Codex's seat

You are the taste / judgment / integration / evaluation seat here, not the
bulk-execution seat. Per this portfolio's Fable Delegation Gate: before any
substantive build, name the split out loud — what you keep, what you hand to
the `codex` subagent — then spawn `codex` for the mechanical slices and wait
for its result. Don't run `codex exec` yourself and don't babysit it with
`pgrep`/`ps`/repeated `tail`.

## Recommended order (from V2-SCOPE.md)

1. **Deploy to GitHub Pages.** Repo is static-root ready, zero build work.
   Do this yourself; nothing here to delegate. Confirm relative paths + hash
   routing survive a real Pages deploy, not just `file://`.
2. **Predict-friction decision.** A feel call, Justin's, not yours or
   Codex's. Resolve it from the gate-check answer above before touching
   `railPredict()`.
3. **Bridge-to-Onshape cards.** One new rail card type in `app.js` + four
   `bridge` content blocks in `exercises.js` (copy already sketched in
   V2-SCOPE.md §1). Split: you write and own the per-exercise micro-task copy
   — it needs the app's plain-language-first, CAD-term-second voice; hand the
   mechanical rail-card wiring in `app.js` to Codex.
4. **E5.** The big lift, do it last. The real cost is a new feature-tree SVG
   visual (2–3 rows, highlight the edited row) in `svg.js`/`style.css` — new
   scene vocabulary, not copy. Split: you own the exercise content
   (intent/predict/choose/change/takeaway/counter-context, following the
   E1–E4 template and V2-SCOPE.md §3's draft), the visual/UX shape of the
   feature-tree component, and the final voice pass; hand Codex the
   mechanical authoring — wiring E5 into `exercises.js` per the established
   template, and extending `qa/qa-check.mjs`'s E1–E4 coverage to include E5.

Only build items 3–4 if the gate check clears them. If Justin's verdict on
item 2 is "yes, dial it up," fold the `railPredict()` change into whichever
step you're on when you get that answer.

## Evaluation — before calling anything done

After each Codex handoff, evaluate it, don't just merge it:

- Read the diff yourself. Does it match the register ("quiet product UI...
  consequence moments carry the energy") and the getter contract for any new
  unit-bearing copy?
- Run `node qa/qa-check.mjs` — must be 100% pass, not "no new regressions."
  If you added E5, the harness needs new assertions for it, not just the old
  ones still passing.
- Actually play the app yourself in a browser at 1400×900 and 390×844 —
  AGENTS.md's hard rule; the harness doesn't replace looking at it for
  visual/copy judgment.
- Every new exercise needs a real counter-context — no placeholders.
- Update `HANDOFF.md` with what changed and what remains, matching the format
  of prior entries.

## Guardrails

- Vanilla HTML/CSS/JS only — no framework, no build step, no backend
  (AGENTS.md).
- Commit at logical breakpoints (this repo's history shows prior Fable
  rounds committing directly) — but do NOT push a public GitHub Pages deploy
  without an explicit final "yes, ship it" from Justin, separate from the
  E1–E4 review gate above.
- If you hit a decision V2-SCOPE.md flags as "for Justin" (e.g., per-exercise
  bridge card vs. a single completion-screen block), ask rather than picking
  silently.
