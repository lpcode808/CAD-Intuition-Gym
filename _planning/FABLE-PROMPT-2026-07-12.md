# Fable Orchestration Prompt — CAD Intuition Gym v3 round

**Supersedes `FABLE-PROMPT-2026-07-10.md`** (that round's two PRs — bridge
cards and E5 — are both merged to `main`). Paste everything below the rule
into a new Claude Code task using Fable (or the strongest available Opus
seat) with the CAD Intuition Gym repository.

---

Read `CLAUDE.md` and `AGENTS.md` first, then `PRD.md` in full (its product
constraints are settled — do not re-litigate audience, judgment-first
structure, or the vanilla/local-first architecture), then `HANDOFF.md`,
`_planning/V3-SCOPE.md`, and `qa/README.md`. Inspect the authoring contract
at the top of `exercises.js` before planning any implementation.

You are the orchestrating seat: own product judgment, copy, integration,
evaluation, and the final call. This repo now ships subagent definitions in
`.claude/agents/` — use them instead of improvising the split:

- Delegate bounded mechanical slices to **slice-builder** (in an isolated
  worktree where possible), giving it exact scope and final wording.
- After every slice, grade with **qa-verifier** AND read the full diff
  yourself; the builder never grades itself, and neither report replaces
  your own read.
- Run **copy-auditor** before any PR that adds or edits exercise content.

## Starting state — verify, do not redo

- All of `_planning/V2-SCOPE.md` is shipped and merged: Pages live at
  https://lpcode808.github.io/CAD-Intuition-Gym/, bridge cards (PR #4), and
  E5 with the in-scene feature tree (PR #5, merged 2026-07-11 after
  Justin's playthrough).
- QA baseline on `main` is **212/212** (`node qa/qa-check.mjs`, both
  widths). Re-run it first; if it doesn't pass cleanly, stop and report
  rather than building on a broken base. The Google-Fonts environmental
  console bucket is the only tolerated noise in sandboxes.
- The light predict tap, vanilla stack, localStorage-only progress,
  counter-context hard rule, and plain-language-first register are all
  settled. Do not reopen them.

## The gate that decides your work order

Check whether Justin has answered the three decision points at the bottom
of `_planning/V3-SCOPE.md` (in the task prompt you were given, a repo
commit, or an issue/PR comment).

**If he has:** build exactly the approved items, smallest first (share
polish → recap screen → E6-order), one independently reviewable PR per
item, each against a clean reviewed base. E6, if approved, follows the
complete E1–E5 loop with no shortcuts and reuses E5's
`featureTree()`/`leaderLine()` vocabulary rather than inventing parallel
primitives. Any exercise or scene-vocabulary change ends at "ready for
Justin's playthrough," not at "merged."

**If he has not:** do NOT guess an approval. This round is then
maintenance-scope only: re-run and report the QA baseline, fix anything
genuinely broken (with evidence), keep docs truthful, and stop. Ask the
decision questions in your final report.

## Full verification bar — required for each PR

1. Read the complete diff yourself: scope creep, duplicated primitives,
   frozen unit copy (getter contract), accidental solver logic,
   progress-schema regressions.
2. `node qa/qa-check.mjs` at 100%, run independently of the builder.
3. Drive the complete affected flow in real headless Chromium at 1400×900
   and 390×844: slider, compare, counter-context, unit toggle, Done gate,
   reset, plus whatever changed.
4. Capture and read back screenshots of the meaningful states at both
   widths — clipping, overflow, label collisions, consequence legibility,
   register.
5. Zero real console/page errors; no horizontal overflow at 390px; safe
   target/rel on any outbound link.
6. Update `HANDOFF.md` (new round section at top), `README.md`,
   `_planning/V3-SCOPE.md` status, and `qa/README.md` counts wherever they
   go stale.

## Hard stops

- Nothing beyond what Justin approved from `V3-SCOPE.md`; no E7+, no
  analytics, no accounts/backend, no authoring tools, no solver.
- Do not commit directly to `main`; one PR per item.
- Exercises and new scene vocabulary require Justin's human playthrough
  before merge.
- If the 212/212 baseline is missing at the start, report the prerequisite
  failure instead of folding recovery into a feature PR.
