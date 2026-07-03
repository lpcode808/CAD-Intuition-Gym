# CAD Intuition Gym

A static web gym for beginner CAD modeling judgment: make a modeling decision, change the design, and feel the consequence.

The product spine is:

> Model your intent, not your accident.

## Status

Prototype in progress. E1 is playable. E2-E4 are still locked in authoring and need to be built from the same primitives.

Recovered Claude Code session:

- Session id: `96090277-aebf-44cd-a5bc-d63914531188`
- Local source: `/Users/justinlai/.claude/projects/-Users-justinlai-Coding/96090277-aebf-44cd-a5bc-d63914531188.jsonl`
- End state: hit Claude session limit after adding the `dimV` helper in `svg.js`

GitHub:

- Repo: https://github.com/lpcode808/CAD-Intuition-Gym

See `HANDOFF.md` for the continuation prompt and checklist.

## Run Locally

This app has no build step. Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `PRD.md` — product spec and resolved scope decisions.
- `_planning/FABLE-BUILD-BRIEF.md` — original build dispatch brief.
- `HANDOFF.md` — current continuation state for Claude Code Cloud.
- `index.html`, `style.css`, `app.js`, `svg.js`, `exercises.js` — static app.

## Persistence

Progress is stored only in this browser under:

```txt
cad-gym.v1
```

No data leaves the browser.
