# CAD Intuition Gym agent notes

Read these before editing:

1. `PRD.md`
2. `_planning/FABLE-BUILD-BRIEF.md`
3. `HANDOFF.md`

If you can run subagents (Claude Code), `.claude/agents/` ships three
definitions — `slice-builder`, `qa-verifier`, `copy-auditor` — and
`CLAUDE.md` explains the division of labor. The orchestrating seat owns
product judgment, copy, and the final call; delegation never transfers the
responsibility to re-read the diff and re-run QA yourself.

This is a static, local-first web app. Keep it vanilla HTML/CSS/JS unless Justin explicitly asks for a rebuild. No backend, no accounts, no real CAD solver, and no Onshape bridge task in the MVP (optional "Try the real thing" bridge cards shipped in v2).

The load-bearing product idea is: **model your intent, not your accident.** Organize work by modeling judgment, not by CAD feature topic.

Hard rules:

- Every exercise (E1-E6 today) must include the full loop: intent, predict, choose, change request, consequence, takeaway, and counter-context.
- No exercise ships without a counter-context.
- Consequences are pre-authored scenes, not computed by a solver.
- Copy stays plain-language-first, CAD-term-second.
- Progress stays in browser `localStorage` only.

Before declaring done, run the app in a browser at desktop and mobile widths, complete all available exercises, check there are no console errors, and update `HANDOFF.md` with what changed and what remains. `node qa/qa-check.mjs` automates most of that bar (full E1–E6 loop at both widths, zero-console-error check, and the unit-copy staleness audit — see the authoring contract at the top of `exercises.js`); run it after any change, but it doesn't replace looking at the app yourself for visual/copy work.

## Questions for Justin — `ASK.md`

<!-- ask-convention:v1 · propagated by ~/Coding/_scripts/propagate-ask-convention.sh.
     Edit the script, not this block — a re-run won't overwrite local edits, it just skips. -->

When you hit a decision that is genuinely Justin's to make, and you can't resolve it from this repo,
the request, or a sensible default: append it to `ASK.md` at this repo's root (create the file if it
doesn't exist), then keep going on everything that doesn't depend on the answer.

    - [ ] YYYY-MM-DD · **The question, one sentence, in bold.**
          Context: why it came up. One or two lines.
          Options: (a) the one you'd pick and why (b) the real alternative
          Blocks: what's stalled — or "nothing, I proceeded with (a)"
          Asked-by: <harness>

Append at the bottom. Never delete, reorder, or check your own box. Always draft the options — a
question with no options is homework; a question with two named options and a recommendation is a
fifteen-second decision.

Justin's laptop sweeps every repo's `ASK.md` on a schedule and he answers them in one sitting. The
answer comes back into this same file as a checked item with an `**Answer (date):**` line, so a
later session reads it as settled rather than re-asking.

Ask sparingly — one or two real asks per session is a lot. Routine judgment calls, file moves,
cleanups, and merge conflicts are inside the assignment, not asks. If you could proceed under an
assumption, proceed under it and say which one you took.

## Cursor Cloud specific instructions

Static, no-build vanilla HTML/CSS/JS app — there is no `package.json`, no `node_modules`, and no lint or build step. Only two things to run:

- Run the app: `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000` (see `README.md`). Opening `index.html` via `file://` also works.
- QA harness: `node qa/qa-check.mjs` (see `qa/README.md`). It needs Playwright + Chromium. In this environment the update script installs Playwright into the npm global prefix `~/.npm-global` and the Chromium browser into `~/.cache/ms-playwright`, so the harness resolves Playwright automatically via `npm root -g` — you do NOT need `QA_ALLOW_INSTALL=1` here. If `node qa/qa-check.mjs` ever reports Playwright not found, re-run the update script rather than reaching for the `QA_ALLOW_INSTALL=1` scratch-install fallback.

Non-obvious env note: `node` is `/exec-daemon/node`; `npm` is nvm's, with its global prefix set to `~/.npm-global`. Google Fonts load fine here, so the harness's "environmental fonts error" exception normally reports 0.
