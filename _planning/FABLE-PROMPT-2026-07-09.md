# Fable Orchestration Prompt — CAD Intuition Gym v2 (post-gate)

**How to use:** paste everything below the rule into a new Claude Code thread
running Fable (or Opus, if past the Fable window), cwd `~/Coding/CAD-Intuition-Gym`.

---

You're picking up CAD Intuition Gym after the human-review gate cleared. Read
`AGENTS.md`, `HANDOFF.md`, and `_planning/V2-SCOPE.md` in full before doing
anything else — they contain the hard rules (counter-context required on
every exercise, getter contract for unit-bearing copy, `qa/qa-check.mjs` must
pass) and the scoped v2 backlog you're about to build.

## Gate status — cleared, do not re-litigate

Justin played E1–E4 end-to-end on 2026-07-09 and said **"yes, ship it."**
That resolves both open questions from `_planning/V2-SCOPE.md`:

- **Public deploy is authorized.** Go ahead with GitHub Pages.
- **Predict-friction stays as-is.** The light "which do you think?" tap
  (PRD §11.5) felt like enough friction. **Do not touch `railPredict()`** —
  V2-SCOPE.md §2's fuller commit-a-guess lock-in is explicitly declined, not
  just deferred. Treat that section of V2-SCOPE.md as closed.

Don't re-ask Justin whether he's played it or how predict friction feels —
both are settled. If you find yourself wanting to reopen either, that's a
signal to stop and ask a narrower question instead.

## Your seat vs. Codex's seat

You are the taste / judgment / integration / evaluation seat here, not the
bulk-execution seat. Per this portfolio's Fable Delegation Gate: before any
substantive build, name the split out loud — what you keep, what you hand to
the `codex` subagent — then spawn `codex` for the mechanical slices and wait
for its result. Don't run `codex exec` yourself and don't babysit it with
`pgrep`/`ps`/repeated `tail`.

## Build order

1. **Deploy to GitHub Pages.** Repo is static-root ready, zero build work.
   Do this yourself; nothing here to delegate. Confirm relative asset paths
   and hash routing survive a real Pages deploy, not just `file://` — this is
   the one thing prior rounds flagged as unverified beyond local testing.
   Also do the one-time check HANDOFF.md calls out: confirm the Google Fonts
   stylesheet actually loads from a normal (non-sandboxed) connection post-deploy;
   prior QA only ran in an environment that couldn't reach `fonts.googleapis.com`.
2. **Bridge-to-Onshape cards** (V2-SCOPE.md §1). One new rail card type in
   `app.js` + four `bridge` content blocks in `exercises.js` (copy already
   sketched in V2-SCOPE.md). Open decision inside this item: per-exercise
   card after each takeaway vs. one "go try it" block on the completion
   screen — V2-SCOPE.md recommends per-exercise; confirm with Justin before
   building if you want to deviate, otherwise proceed with the recommendation.
   Split: you write and own the per-exercise micro-task copy — it needs the
   app's plain-language-first, CAD-term-second voice; hand the mechanical
   rail-card wiring in `app.js` to Codex.
3. **E5 — sketch-level vs. part-level features** (V2-SCOPE.md §3). The big
   lift, do it last. The real cost is a new feature-tree SVG visual (2–3
   rows, highlight the edited row) in `svg.js`/`style.css` — new scene
   vocabulary, not copy. Split: you own the exercise content
   (intent/predict/choose/change/takeaway/counter-context, following the
   E1–E4 template and V2-SCOPE.md §3's draft), the visual/UX shape of the
   feature-tree component, and the final voice pass; hand Codex the
   mechanical authoring — wiring E5 into `exercises.js` per the established
   template, and extending `qa/qa-check.mjs`'s E1–E4 coverage to include E5.

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
  rounds committing directly).
- The GitHub Pages deploy in step 1 is pre-authorized by Justin's 2026-07-09
  "yes, ship it" — you do not need to ask again before that step. Anything
  beyond what's scoped in this prompt (new exercises past E5, structural
  changes, anything V2-SCOPE.md marks "explicitly not in v2") still needs his
  sign-off.
- If you hit a decision V2-SCOPE.md flags as "for Justin" (e.g., per-exercise
  bridge card vs. a single completion-screen block), ask rather than picking
  silently.
