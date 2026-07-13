# CAD Intuition Gym

A static web gym for beginner CAD modeling judgment: make a modeling decision, change the design, and feel the consequence.

The product spine is:

> Model your intent, not your accident.

## Status

v3 built, on a branch awaiting Justin's playthrough. Six exercises (E1-E6)
are authored, playable end-to-end, and covered by the QA harness at desktop
and mobile widths. The live site at
https://lpcode808.github.io/CAD-Intuition-Gym/ serves `main` (five
exercises) until the v3 branch merges.

v2 (`_planning/V2-SCOPE.md`) is fully shipped and merged. v3
(`_planning/V3-SCOPE.md`, all three items approved by Justin 2026-07-12) is
built on branch `claude/sub-agent-setup-favz3d`: share/OG meta with a real
consequence-moment preview image, a completion recap ("What you leave
with") once every exercise is done, and E6 — "Put it downstream", feature
order and dependency, reusing E5's in-scene feature-tree vocabulary. E6 and
the recap are new content/scene material, so the branch stays unmerged
until Justin plays it.

GitHub:

- Repo: https://github.com/lpcode808/CAD-Intuition-Gym

See `HANDOFF.md` for the current state, QA notes, and continuation checklist.

## Run Locally

This app has no build step. Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `PRD.md` — product spec and resolved scope decisions.
- `_planning/FABLE-BUILD-BRIEF.md` — original build dispatch brief.
- `_planning/V2-SCOPE.md` — v2 scope, fully shipped 2026-07-11.
- `_planning/V3-SCOPE.md` — v3 scope, approved and built 2026-07-12 (merge gated on Justin's playthrough).
- `_planning/FABLE-PROMPT-2026-07-12.md` — ready-to-paste prompt for the next Fable/Opus thread (current). Earlier dated prompts in `_planning/` are superseded prior rounds.
- `HANDOFF.md` — current continuation state.
- `CLAUDE.md` + `.claude/agents/` — Claude Code project notes and committed subagent definitions (slice-builder, qa-verifier, copy-auditor) for the orchestrator/executor split.
- `index.html`, `style.css`, `app.js`, `svg.js`, `exercises.js` — static app.
- `qa/qa-check.mjs` — Playwright QA harness for the full E1-E6 loop.

## Persistence

Progress is stored only in this browser under:

```txt
cad-gym.v1
cad-gym.unit
```

No data leaves the browser.
