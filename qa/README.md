# QA harness

`qa-check.mjs` is a self-contained, re-runnable QA harness for this vanilla
static app (no build step, no `package.json`, no `node_modules` in this
repo — and this harness doesn't add any).

## Run it

```
node qa/qa-check.mjs
```

Exit code `0` on full pass, `1` on any failure. Prints a per-check
PASS/FAIL table, verbatim unit-copy-staleness violations (if any), verbatim
console/page errors (if any), and the list of screenshots it wrote.

No flags, no setup step. Playwright is resolved automatically (see below),
and its logic never fixes the app — if it finds a real bug, it reports it
without touching `index.html` / `app.js` / `exercises.js` / `svg.js`.

## How Playwright is resolved

The repo intentionally has no `package.json` / `node_modules`, so the
script never assumes Playwright is installed here. On each run it tries,
in order:

1. **Bare `import('playwright')`** — works if Playwright is already
   hoisted somewhere on Node's module resolution path.
2. **`npm root -g` / `pnpm root -g`** — checks for a global install.
3. **Opt-in fallback: install into the scratch dir, outside this repo.**
   If neither of the above finds anything, rerun with `QA_ALLOW_INSTALL=1`.
   The script then runs
   `npm install --ignore-scripts --no-audit --no-fund playwright@1.58.2` inside `<os tmpdir>/cad-gym-qa/qa-playwright`
   (overridable via `QA_SCRATCH_DIR`) — never inside this repo. That
   version is pinned because this machine already had a matching Chromium
   build cached under `~/Library/Caches/ms-playwright` (revision 1208), so
   the fallback install doesn't need to download a browser, only the
   small `playwright`/`playwright-core` npm packages.
   Subsequent runs detect the existing install and reuse it (no
   reinstall, no re-download). Without `QA_ALLOW_INSTALL=1`, the harness
   stops with setup instructions rather than silently making a network or
   package-manager change.

Whichever path is used is printed at the top of the run, e.g.:

```
[qa] Playwright resolved via: scratch install at .../scratchpad/qa-playwright (outside the repo)
```

On this machine it currently always falls through to path 3 — there is no
global or ancestor-`node_modules` Playwright install, but several sibling
project repos (e.g. `ConicSections`, `GoogleAIMode`) do have their own
local Playwright installs. The harness deliberately does **not** reach
into another project's `node_modules` — that's an unversioned, unstable
dependency (that repo could delete or upgrade it at any time) — hence the
scratch-dir fallback instead.

## What it checks

All checks run at both **1400×900** and **390×844**, in a fresh cold
`file://` load into real headless Chromium each time (a new browser
context per concern, so localStorage always starts empty unless the
harness explicitly seeds it):

1. **Full loop, all four exercises (E1–E4).** From the home screen: opens
   each exercise, does the predict tap, chooses a path, drags the
   change-request slider (asserting the Continue button is disabled
   beforehand and enabled after), toggles compare/side-by-side (asserts
   two panes render), names the takeaway, then in the counter-context
   drags its slider and uses its scheme toggle (asserting the moral text
   stays hidden until the slider moves, then appears). Confirms finishing
   an exercise marks it "done ✓" on the home screen. After all four are
   done, clicks **Reset progress** (auto-accepting the `confirm()`
   dialog), and confirms `localStorage["cad-gym.v1"]` is cleared and all
   four rows return to startable.

2. **Console/page errors.** Every `console.error` and uncaught `pageerror`
   across the *entire* run is collected. The bar is zero. The one
   documented exception: if the Google Fonts stylesheet fails purely due
   to a sandboxed/offline network policy, those specific entries are
   bucketed as "environmental" and printed separately, not counted as
   failures. (On this machine, fonts actually load fine, so this
   exception hasn't been exercised in practice — but the classification
   logic is there for a locked-down CI box.) Also explicitly verifies no
   network request for `/favicon.ico` ever fails, confirming the inline
   `data:image/svg+xml` favicon in `index.html` is doing its job.

3. **Layout.** `document.scrollingElement.scrollWidth <= innerWidth` at
   390px — checked on the home screen and again inside a busy exercise
   view (the compare pane is the most overflow-prone layout).

4. **Unit-copy staleness audit** (the important one). `EXERCISES` in
   `exercises.js` is deep-walked (recursing into every enumerable own
   property; accessor/getter properties are invoked; function-valued
   properties are skipped, since those are per-render and can't be called
   generically) — twice, from two separate cold loads:
   - Load A: `localStorage['cad-gym.unit'] = 'mm'` at load, then
     `setUnit('in')` in-page **without reloading**. Any collected string
     still matching `/\b\d+(\.\d+)?\s*mm\b/` is a plain string that was
     frozen at mm during object construction and never re-evaluates —
     flagged with its property path and exact text.
   - Load B (the mirror): `localStorage['cad-gym.unit'] = 'in'` at load,
     then `setUnit('mm')` in-page. Anything still matching
     `/\b\d+(\.\d+)?\s*in\b/` is the same bug in the other direction.
   Two separate cold loads are required because a frozen plain string
   bakes in whichever unit was active *when the script first ran* — a
   getter that only reruns while the unit happens to already be right
   wouldn't be caught by a single-direction check.
   Zero violations expected in the shipped app; verified by deliberately
   patching a throwaway copy of `exercises.js` (a `paths.a.sub` getter
   turned into a plain string) and confirming the harness reports it by
   exact `EXERCISES[0].paths.a.sub` path with the frozen text, then exits
   1 — see the run notes for that negative-control test.

5. **Screenshots.** Saved under `<scratch dir>/qa-screenshots/`
   (never in this repo) — the home screen, one mid-exercise consequence
   moment, one compare view, and one counter-context view, at each width
   (captured on Exercise 1 as the representative run).

6. **Storage and SVG hardening.** Seeds valid JSON values with the wrong
   shape (`"hello"`, `42`, `[]`, and `null`) and confirms the home screen
   treats each as empty progress. Compare mode is also checked for duplicate
   document IDs so SVG pattern references remain deterministic.

7. **Accessible controls.** Verifies that the unit toggle has an explicit
   current-state label and that compare scenes are named images.

## A note on "dragging" the slider

The change-request and counter sliders are native `<input type="range">`
elements. Real pixel-drag math on a bare range input is unreliable across
platforms and headless modes, so the harness sets `.value` and dispatches
a real `input` event (`el.dispatchEvent(new Event('input', {bubbles:
true}))`). That fires the exact same listener
(`input.addEventListener('input', ...)` in `app.js`) a physical drag
would — it's a faithful stand-in for "the user moved the slider," not a
shortcut around the app's logic.

## Constraints this harness respects

- No `package.json` / `node_modules` added to the repo root.
- Nothing outside `qa/` is written to (screenshots and any fallback
  Playwright install live entirely under the scratch dir above).
- No git commands are run by this script.
