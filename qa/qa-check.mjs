#!/usr/bin/env node
/* qa/qa-check.mjs — durable QA harness for CAD Intuition Gym.
   Run: node qa/qa-check.mjs
   See qa/README.md for how Playwright is resolved on this machine and what
   "cold load" / "drag the slider" mean operationally here.

   This file is the ONLY thing this harness is allowed to touch besides:
     - screenshots written under the scratch dir (never the repo)
     - a Playwright install under the scratch dir if none is found on the
       machine already (never the repo — no package.json/node_modules here)

   Exit code: 0 on full pass, 1 on any failure. */

'use strict';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);
const APP_URL = pathToFileURL(path.join(REPO_ROOT, 'index.html')).href;

const SCRATCH_DIR = process.env.QA_SCRATCH_DIR
  || path.join(os.tmpdir(), 'cad-gym-qa');
const SHOT_DIR = path.join(SCRATCH_DIR, 'qa-screenshots');
const FALLBACK_INSTALL_DIR = path.join(SCRATCH_DIR, 'qa-playwright');
const PLAYWRIGHT_PIN = '1.58.2'; // matches an already-cached Chromium revision on this machine

const STORE_KEY = 'cad-gym.v1';
const UNIT_KEY = 'cad-gym.unit';
const EXERCISE_IDS = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'];

/* One distinctive phrase from each exercise's bridge task, so the takeaway
   step can be checked for the right card (not just any card). */
const BRIDGE_MARKERS = {
  e1: 'Symmetric constraint',
  e2: 'Mirror tool',
  e3: 'turns black',
  e4: '#base',
  e5: 'Remove',
  e6: 'above the notch',
};

/* The saved-progress schema `finish()` writes — the bridge card must add
   nothing to it. */
const PROGRESS_KEYS = ['done', 'finishedAt', 'predicted', 'predictedRight'];

const VIEWPORTS = [
  { label: '1400x900', width: 1400, height: 900 },
  { label: '390x844', width: 390, height: 844 },
];

const MM_RE = /\b\d+(?:\.\d+)?\s*mm\b/;
const IN_RE = /\b\d+(?:\.\d+)?\s*in\b/;
const FONT_HOST_RE = /fonts\.(googleapis|gstatic)\.com/;

/* ------------------------------------------------------- Playwright resolution */

async function resolvePlaywright() {
  const attempts = [];

  try {
    const mod = await import('playwright');
    const chromium = mod.chromium ?? mod.default?.chromium;
    if (chromium) return { chromium, how: 'bare import("playwright") — found on Node\'s module path' };
    attempts.push('bare import("playwright") resolved but had no .chromium export');
  } catch (e) {
    attempts.push(`bare import("playwright") failed: ${e.message}`);
  }

  for (const [cmd, args] of [['npm', ['root', '-g']], ['pnpm', ['root', '-g']]]) {
    try {
      const root = execFileSync(cmd, args, { encoding: 'utf8' }).trim();
      const dir = path.join(root, 'playwright');
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        const require = createRequire(import.meta.url);
        const pw = require(dir);
        if (pw?.chromium) return { chromium: pw.chromium, how: `${cmd} root -g → ${dir}` };
      }
      attempts.push(`${cmd} root -g (${root}) had no playwright package`);
    } catch (e) {
      attempts.push(`${cmd} root -g failed: ${e.message}`);
    }
  }

  // Optional fallback: install into a directory OUTSIDE the repo (the scratch
  // dir). Network mutation must be explicit; lifecycle scripts stay disabled.
  const pkgDir = path.join(FALLBACK_INSTALL_DIR, 'node_modules', 'playwright');
  if (!fs.existsSync(path.join(pkgDir, 'package.json'))) {
    if (process.env.QA_ALLOW_INSTALL !== '1') {
      throw new Error(`Playwright is unavailable. Tried:\n  - ${attempts.join('\n  - ')}\nSet QA_ALLOW_INSTALL=1 to install the pinned playwright@${PLAYWRIGHT_PIN} into ${FALLBACK_INSTALL_DIR} with lifecycle scripts disabled.`);
    }
    fs.mkdirSync(FALLBACK_INSTALL_DIR, { recursive: true });
    if (!fs.existsSync(path.join(FALLBACK_INSTALL_DIR, 'package.json'))) {
      execFileSync('npm', ['init', '-y'], { cwd: FALLBACK_INSTALL_DIR, stdio: 'ignore' });
    }
    console.log(`[qa] installing playwright@${PLAYWRIGHT_PIN} into ${FALLBACK_INSTALL_DIR} (outside the repo)…`);
    execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', `playwright@${PLAYWRIGHT_PIN}`], {
      cwd: FALLBACK_INSTALL_DIR,
      stdio: 'inherit',
    });
  }
  const require = createRequire(import.meta.url);
  const pw = require(pkgDir);
  if (!pw?.chromium) {
    throw new Error(`Playwright unavailable. Tried:\n  - ${attempts.join('\n  - ')}\n  - scratch install at ${pkgDir} also failed to expose chromium`);
  }
  return { chromium: pw.chromium, how: `scratch install at ${FALLBACK_INSTALL_DIR} (outside the repo)` };
}

/* ------------------------------------------------------------------- helpers */

function rec(bucket, name, pass, detail = '') {
  bucket.push({ name, pass, detail });
}

async function pollUntil(fn, { timeout = 3000, interval = 30 } = {}) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeout) {
    last = await fn();
    if (last) return last;
    await new Promise((r) => setTimeout(r, interval));
  }
  return last;
}

function attachErrorListeners(page, label, collectors) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      collectors.consoleErrors.push({ label, text: msg.text(), location: msg.location() });
    }
  });
  page.on('pageerror', (err) => {
    collectors.pageErrors.push({ label, message: err.message });
  });
  page.on('requestfailed', (req) => {
    collectors.requestFailures.push({ label, url: req.url(), error: req.failure()?.errorText });
  });
  page.on('response', (res) => {
    if (res.status() >= 400) collectors.httpErrors.push({ label, url: res.url(), status: res.status() });
  });
}

function isFontRelated(entry) {
  // A failed-stylesheet console error's text is just "Failed to load resource: …";
  // the fonts URL is only in msg.location().url, so location must be checked too.
  return FONT_HOST_RE.test(entry.url || '') || FONT_HOST_RE.test(entry.text || '') || FONT_HOST_RE.test(entry.message || '') || FONT_HOST_RE.test(entry.location?.url || '');
}

/* Simulate "drag the slider" on a native <input type=range>. Real pixel-drag
   math on a bare range input is unreliable across platforms/headless modes;
   setting .value and dispatching a real 'input' event exercises the exact
   same listener (`input.addEventListener('input', ...)`) a physical drag
   would trigger, so it is a faithful stand-in for this app's logic. */
async function setSlider(page, t) {
  const input = page.locator('.rail input.slider');
  await input.evaluate((el, tt) => {
    el.value = String(Math.round(tt * 1000));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, t);
}

async function checkOverflow(page) {
  return page.evaluate(() => ({
    scrollWidth: document.scrollingElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
}

async function runStorageAndIdHardeningChecks(browser, vp, collectors) {
  const checks = [];
  for (const stored of ['"hello"', '42', '[]', 'null']) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORE_KEY, value: stored });
    const page = await ctx.newPage();
    attachErrorListeners(page, `${vp.label} malformed-storage(${stored})`, collectors);
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const statuses = await page.locator('a.ex-row .ex-status').allInnerTexts();
    rec(checks, `[${vp.label}] malformed progress ${stored} falls back safely`, statuses.length === EXERCISE_IDS.length && statuses.every((s) => !/done/i.test(s)));
    await ctx.close();
  }

  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  attachErrorListeners(page, `${vp.label} unique-svg-ids`, collectors);
  await page.goto(`${APP_URL}#/e1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('.rail button.btn.primary').click();
  await page.locator('.rail .option').first().click();
  await page.locator('.rail button.btn.primary').click();
  await page.locator('.rail .option').first().click();
  await page.locator('.rail button.btn.primary').click();
  await setSlider(page, 0.6);
  await page.locator('.rail button.btn.ghost').click();
  const duplicates = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  rec(checks, `[${vp.label}] compare mode has no duplicate document IDs`, duplicates.length === 0, `duplicates=${JSON.stringify(duplicates)}`);
  const unnamedScenes = await page.evaluate(() => [...document.querySelectorAll('svg[role="img"]')].filter((svg) => !svg.getAttribute('aria-label')).length);
  rec(checks, `[${vp.label}] compare scenes have accessible names`, unnamedScenes === 0, `unnamed=${unnamedScenes}`);
  await ctx.close();
  return checks;
}

/* E5 is the one exercise whose consequence lives partly in the feature tree
   itself (drawn inside the scene via svg.js's featureTree/leaderLine — see
   the comment above e5MainScene). These checks are grounded in that scene
   vocabulary and don't apply to E1–E4, so they run as their own pass rather
   than folding into the generic per-exercise loop. */
async function runE5SceneChecks(browser, vp, collectors) {
  const checks = [];
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  attachErrorListeners(page, `${vp.label} e5-scene`, collectors);
  const primaryBtn = page.locator('.rail button.btn.primary');

  await page.goto(`${APP_URL}#/e5`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('.player').waitFor({ state: 'visible' });

  /* step 0-2 — predict, then build path A ("draw the holes inside the base sketch") */
  await primaryBtn.click(); // "Make a prediction →"
  await page.locator('.rail .option').first().click(); // the predict tap
  await primaryBtn.click(); // "Lock it in →"
  await page.locator('.rail .option').first().click(); // build path A
  await primaryBtn.click(); // "Send in the change request →"
  await page.locator('.rail input.slider').waitFor({ state: 'visible' });

  /* single view, path A, before compare — one in-scene feature tree with one
     active row, a leader tying it to its edit scope, and path A's two-row tree */
  const ftreeGroups = await page.locator('.viewport svg .ftree').count();
  rec(checks, `[${vp.label}] e5: single view draws exactly one in-scene feature tree`, ftreeGroups === 1, `ftree groups=${ftreeGroups}`);

  const activeRows = await page.locator('.viewport svg .ftree-row.is-active').count();
  rec(checks, `[${vp.label}] e5: exactly one feature-tree row is active in single view`, activeRows === 1, `active rows=${activeRows}`);

  const leaderCount = await page.locator('.viewport svg .leader').count();
  rec(checks, `[${vp.label}] e5: a leader line ties the active row to its edit scope`, leaderCount > 0, `leaders=${leaderCount}`);

  const rowCountA = await page.locator('.viewport svg .ftree-row').count();
  rec(checks, `[${vp.label}] e5: path A's crowded sketch shows only two tree rows`, rowCountA === 2, `rows=${rowCountA}`);

  const editScopeCount = await page.locator('.viewport svg .edit-scope').count();
  rec(checks, `[${vp.label}] e5: an edit-scope halo marks what path A's edit can touch`, editScopeCount > 0, `edit-scope=${editScopeCount}`);

  /* drive the rework through, then compare — pane A (one shared sketch)
     gouges the outline; pane B (holes on their own feature) never does */
  await setSlider(page, 0.8);
  const compareBtn = page.locator('.rail button.btn.ghost');
  await compareBtn.click();
  await page.locator('.viewport .compare').waitFor({ state: 'visible' });

  const paneA = page.locator('.compare .pane:nth-child(1)');
  const paneB = page.locator('.compare .pane:nth-child(2)');

  const paneAText = await paneA.locator('svg').evaluate((el) => el.textContent);
  const paneBText = await paneB.locator('svg').evaluate((el) => el.textContent);
  rec(checks, `[${vp.label}] e5: compare pane A shows the outline gouged "out of true"`, paneAText.includes('out of true'), `paneA snippet="${paneAText.slice(0, 120)}"`);
  rec(checks, `[${vp.label}] e5: compare pane B never gouges the outline`, !paneBText.includes('out of true'), `paneB snippet="${paneBText.slice(0, 120)}"`);

  const paneARows = await paneA.locator('svg .ftree-row').count();
  const paneBRows = await paneB.locator('svg .ftree-row').count();
  rec(checks, `[${vp.label}] e5: compare pane A's tree stays at two rows (outline and holes share one sketch)`, paneARows === 2, `rows=${paneARows}`);
  rec(checks, `[${vp.label}] e5: compare pane B's tree grows to four rows (outline, extrude, holes, cut)`, paneBRows === 4, `rows=${paneBRows}`);

  const paneAFtree = await paneA.locator('svg .ftree').count();
  const paneBFtree = await paneB.locator('svg .ftree').count();
  rec(checks, `[${vp.label}] e5: both compare panes draw their own feature tree`, paneAFtree >= 1 && paneBFtree >= 1, `paneA ftree=${paneAFtree} paneB ftree=${paneBFtree}`);

  await compareBtn.click(); // back to one view before continuing
  await page.locator('.viewport .compare').waitFor({ state: 'detached' });
  await primaryBtn.click(); // "Name the lesson →"

  /* step 4 — counter-context. Default scheme is b ("File the notch as its
     own feature"); reshaping under b strands the notch feature off the bead
     and flags its row red. Scheme a folds the notch into the outline sketch,
     so it rides the reshape and never drifts. */
  await setSlider(page, 0.8);
  const errorRowsBefore = await page.locator('.viewport svg .ftree-row.is-error').count();
  rec(checks, `[${vp.label}] e5 counter: the notch filed as its own feature flags red once the outline reshapes without it`, errorRowsBefore > 0, `error rows=${errorRowsBefore}`);

  const counterTextBefore = await page.locator('.viewport svg').evaluate((el) => el.textContent);
  rec(checks, `[${vp.label}] e5 counter: scheme B drifts "off the bead"`, counterTextBefore.includes('off the bead'), `snippet="${counterTextBefore.slice(0, 120)}"`);

  await page.locator('.rail .segmented .seg').first().click(); // switch to scheme A

  const errorRowsAfter = await page.locator('.viewport svg .ftree-row.is-error').count();
  rec(checks, `[${vp.label}] e5 counter: scheme A folds the notch into the outline — no error row`, errorRowsAfter === 0, `error rows=${errorRowsAfter}`);

  const counterTextAfter = await page.locator('.viewport svg').evaluate((el) => el.textContent);
  rec(checks, `[${vp.label}] e5 counter: scheme A never drifts "off the bead"`, !counterTextAfter.includes('off the bead'), `snippet="${counterTextAfter.slice(0, 120)}"`);

  const rowCountAfter = await page.locator('.viewport svg .ftree-row').count();
  rec(checks, `[${vp.label}] e5 counter: scheme A's tree collapses back to two rows`, rowCountAfter === 2, `rows=${rowCountAfter}`);

  await ctx.close();
  return checks;
}

/* E6's consequence is the tree's ORDER: the same four rows appear in both
   paths, but which of {opening, screws} sits upstream decides who survives
   the spec change. These checks assert the order swap itself (row text
   sequence per pane) plus the geometric fallout (screws swallowed only in
   path B), so they run as their own pass like E5's. */
async function runE6SceneChecks(browser, vp, collectors) {
  const checks = [];
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  attachErrorListeners(page, `${vp.label} e6-scene`, collectors);
  const primaryBtn = page.locator('.rail button.btn.primary');

  await page.goto(`${APP_URL}#/e6`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('.player').waitFor({ state: 'visible' });

  /* step 0-2 — predict, then build path A ("cut the opening first") */
  await primaryBtn.click(); // "Make a prediction →"
  await page.locator('.rail .option').first().click(); // the predict tap
  await primaryBtn.click(); // "Lock it in →"
  await page.locator('.rail .option').first().click(); // build path A
  await primaryBtn.click(); // "Send in the change request →"
  await page.locator('.rail input.slider').waitFor({ state: 'visible' });

  /* single view, path A — one in-scene tree, one active row, a leader, four
     rows with the opening filed ABOVE the screws */
  const ftreeGroups = await page.locator('.viewport svg .ftree').count();
  rec(checks, `[${vp.label}] e6: single view draws exactly one in-scene feature tree`, ftreeGroups === 1, `ftree groups=${ftreeGroups}`);

  const activeRows = await page.locator('.viewport svg .ftree-row.is-active').count();
  rec(checks, `[${vp.label}] e6: exactly one feature-tree row is active in single view`, activeRows === 1, `active rows=${activeRows}`);

  const leaderCount = await page.locator('.viewport svg .leader').count();
  rec(checks, `[${vp.label}] e6: a leader line ties the edited opening to the geometry`, leaderCount > 0, `leaders=${leaderCount}`);

  const rowTextsA = await page.locator('.viewport svg .ftree-row').evaluateAll((els) => els.map((el) => el.textContent));
  rec(checks, `[${vp.label}] e6: path A files four features`, rowTextsA.length === 4, `rows=${JSON.stringify(rowTextsA)}`);
  const aCutIdx = rowTextsA.findIndex((s) => /Cut 1/.test(s));
  const aHolesIdx = rowTextsA.findIndex((s) => /Holes/.test(s));
  rec(checks, `[${vp.label}] e6: path A files the opening ABOVE the screws (screws downstream)`,
    aCutIdx !== -1 && aHolesIdx !== -1 && aCutIdx < aHolesIdx, `cut@${aCutIdx} holes@${aHolesIdx}`);

  /* drive the spec change through, then compare — the SAME four rows in each
     pane, opposite order; only pane B's screws get swallowed */
  await setSlider(page, 0.8);
  const compareBtn = page.locator('.rail button.btn.ghost');
  await compareBtn.click();
  await page.locator('.viewport .compare').waitFor({ state: 'visible' });

  const paneA = page.locator('.compare .pane:nth-child(1)');
  const paneB = page.locator('.compare .pane:nth-child(2)');

  const paneARowTexts = await paneA.locator('svg .ftree-row').evaluateAll((els) => els.map((el) => el.textContent));
  const paneBRowTexts = await paneB.locator('svg .ftree-row').evaluateAll((els) => els.map((el) => el.textContent));
  const bCutIdx = paneBRowTexts.findIndex((s) => /Cut 1/.test(s));
  const bHolesIdx = paneBRowTexts.findIndex((s) => /Holes/.test(s));
  rec(checks, `[${vp.label}] e6: both compare panes file the same four features`,
    paneARowTexts.length === 4 && paneBRowTexts.length === 4,
    `paneA=${paneARowTexts.length} paneB=${paneBRowTexts.length}`);
  rec(checks, `[${vp.label}] e6: pane B files the screws ABOVE the opening — the order is the only difference`,
    bCutIdx !== -1 && bHolesIdx !== -1 && bHolesIdx < bCutIdx, `holes@${bHolesIdx} cut@${bCutIdx}`);

  const paneABad = await paneA.locator('svg .hole.is-bad').count();
  const paneBBad = await paneB.locator('svg .hole.is-bad').count();
  const paneBDrift = await paneB.locator('svg .offline').count();
  rec(checks, `[${vp.label}] e6: pane A's screws ride the opening — none breached`, paneABad === 0, `bad holes=${paneABad}`);
  rec(checks, `[${vp.label}] e6: pane B's screws are swallowed by the opening, drift marked`, paneBBad === 2 && paneBDrift === 2, `bad holes=${paneBBad} drift lines=${paneBDrift}`);

  const chipA = await paneA.locator('.outcome-chip').innerText();
  const chipB = await paneB.locator('.outcome-chip').innerText();
  rec(checks, `[${vp.label}] e6: pane A's chip reports the gap held`, chipA.includes('gap held'), `chipA="${chipA}"`);
  rec(checks, `[${vp.label}] e6: pane B's chip reports the break into the screws`, chipB.includes('into the screws'), `chipB="${chipB}"`);

  await compareBtn.click(); // back to one view before continuing
  await page.locator('.viewport .compare').waitFor({ state: 'detached' });
  await primaryBtn.click(); // "Name the lesson →"

  /* step 4 — counter-context. Default scheme is a (label chained to the
     hole): moving the hole drags the label off center. Scheme b anchors the
     label to the plate, so the hole moves alone. */
  await setSlider(page, 0.8);
  const counterTextA = await page.locator('.viewport svg').evaluate((el) => el.textContent);
  const counterDriftA = await page.locator('.viewport svg .offline').count();
  rec(checks, `[${vp.label}] e6 counter: the chained label is dragged "off center"`, counterTextA.includes('off center'), `snippet="${counterTextA.slice(0, 120)}"`);
  rec(checks, `[${vp.label}] e6 counter: the drag is marked with a drift line`, counterDriftA > 0, `drift lines=${counterDriftA}`);

  await page.locator('.rail .segmented .seg').nth(1).click(); // switch to scheme B

  const counterTextB = await page.locator('.viewport svg').evaluate((el) => el.textContent);
  const counterDriftB = await page.locator('.viewport svg .offline').count();
  rec(checks, `[${vp.label}] e6 counter: scheme B's label never leaves center`, !counterTextB.includes('off center') && counterDriftB === 0, `snippet="${counterTextB.slice(0, 120)}" drift=${counterDriftB}`);

  const counterRows = await page.locator('.viewport svg .ftree-row').count();
  rec(checks, `[${vp.label}] e6 counter: the tree keeps the same four rows — no false reorganizing`, counterRows === 4, `rows=${counterRows}`);

  await ctx.close();
  return checks;
}

async function collectUnitStrings(page) {
  return page.evaluate(() => {
    const out = [];
    const seen = new Set();
    function walk(val, p) {
      if (val === null || val === undefined) return;
      const t = typeof val;
      if (t === 'string') { out.push({ path: p, value: val }); return; }
      if (t === 'function') return; // per-render; can't be called generically
      if (t !== 'object') return; // number, boolean, etc — not unit-bearing text
      if (seen.has(val)) return;
      seen.add(val);
      if (Array.isArray(val)) {
        val.forEach((v, i) => walk(v, `${p}[${i}]`));
        return;
      }
      for (const key of Object.getOwnPropertyNames(val)) {
        const desc = Object.getOwnPropertyDescriptor(val, key);
        const childPath = `${p}.${key}`;
        if (desc.get) {
          let v;
          try { v = val[key]; } catch (e) { out.push({ path: childPath, value: `<getter threw: ${e.message}>` }); continue; }
          walk(v, childPath);
        } else if (typeof desc.value === 'function') {
          continue; // skip — per-render functions, not static copy
        } else {
          walk(desc.value, childPath);
        }
      }
    }
    // eslint-disable-next-line no-undef
    walk(EXERCISES, 'EXERCISES');
    return out;
  });
}

/* ------------------------------------------------------------- exercise loop */

async function runExercise(page, exId, { capture, shotDir, vpLabel }) {
  const steps = [];
  const primaryBtn = page.locator('.rail button.btn.primary');

  const row = page.locator(`a.ex-row[href="#/${exId}"]`);
  await row.waitFor({ state: 'visible' });
  await row.click();
  await page.locator('.player').waitFor({ state: 'visible' });

  /* step 0 — intent brief */
  await primaryBtn.waitFor({ state: 'visible' }); // "Make a prediction →"
  await primaryBtn.click();

  /* step 1 — predict */
  await page.locator('.rail .options .option').first().waitFor({ state: 'visible' });
  const noContinueYet = await page.locator('.rail button.btn.primary').count();
  rec(steps, `${exId}: predict step shows no Continue before a guess`, noContinueYet === 0, `count=${noContinueYet}`);
  await page.locator('.rail .options .option').first().click(); // the predict tap
  await primaryBtn.waitFor({ state: 'visible' }); // "Lock it in →"
  await primaryBtn.click();

  /* step 2 — choose a path */
  await page.locator('.rail .options .option').first().waitFor({ state: 'visible' });
  await page.locator('.rail .options .option').first().click(); // choosing a path
  await primaryBtn.waitFor({ state: 'visible' }); // "Send in the change request →"
  await primaryBtn.click();

  /* step 3 — the change lands */
  await page.locator('.rail input.slider').waitFor({ state: 'visible' });
  const disabledBefore = await primaryBtn.isDisabled();
  rec(steps, `${exId}: change-request Continue disabled before slider moves`, disabledBefore === true, `disabled=${disabledBefore}`);

  await setSlider(page, 0.6); // drag the change-request slider
  const enabledAfter = await pollUntil(async () => !(await primaryBtn.isDisabled()));
  rec(steps, `${exId}: change-request Continue enabled after slider moves`, enabledAfter === true, `enabled=${enabledAfter}`);

  const hintGone = await pollUntil(async () => (await page.locator('[data-ref="movehint"]').count()) === 0);
  rec(steps, `${exId}: "drag first" hint removed after slider moves`, hintGone === true);

  if (capture) {
    await fs.promises.mkdir(shotDir, { recursive: true });
    await page.screenshot({ path: path.join(shotDir, `${exId}-consequence-${vpLabel}.png`) });
  }

  const compareBtn = page.locator('.rail button.btn.ghost');
  await compareBtn.click(); // the compare/toggle step
  await page.locator('.viewport .compare').waitFor({ state: 'visible' });
  const paneCount = await page.locator('.viewport .compare .pane').count();
  rec(steps, `${exId}: compare view shows two panes`, paneCount === 2, `panes=${paneCount}`);

  if (capture) {
    await page.screenshot({ path: path.join(shotDir, `${exId}-compare-${vpLabel}.png`) });
  }

  await compareBtn.click(); // back to one view before continuing
  await page.locator('.viewport .compare').waitFor({ state: 'detached' });
  await primaryBtn.click(); // "Name the lesson →"

  /* step 4 — takeaway + counter-context */
  const moral = page.locator('.rail .moral');
  await moral.waitFor({ state: 'attached' });
  const moralHiddenBefore = await moral.isHidden();
  const doneDisabledBefore = await primaryBtn.isDisabled();
  rec(steps, `${exId}: counter moral hidden before counter slider moves`, moralHiddenBefore === true, `hidden=${moralHiddenBefore}`);
  rec(steps, `${exId}: counter Done button disabled before counter slider moves`, doneDisabledBefore === true, `disabled=${doneDisabledBefore}`);

  /* bridge card — the optional real-Onshape postscript on the takeaway step */
  const bridge = page.locator('.rail .bridge-card');
  const bridgeCount = await bridge.count();
  rec(steps, `${exId}: bridge card present on the takeaway step`, bridgeCount === 1, `count=${bridgeCount}`);

  const bridgeText = bridgeCount === 1 ? await bridge.innerText() : '';
  rec(steps, `${exId}: bridge card carries this exercise's task ("${BRIDGE_MARKERS[exId]}")`,
    bridgeText.includes(BRIDGE_MARKERS[exId]));

  let linkOk = false;
  let linkDetail = 'no bridge card';
  if (bridgeCount === 1) {
    const link = await bridge.locator('a').evaluate((a) => ({
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    }));
    let parsed = null;
    try { parsed = new URL(link.href); } catch { /* linkOk stays false */ }
    linkOk = parsed !== null
      && parsed.protocol === 'https:'
      && parsed.hostname === 'cad.onshape.com'
      && link.target === '_blank'
      && /\bnoopener\b/.test(link.rel || '')
      && /\bnoreferrer\b/.test(link.rel || '');
    linkDetail = JSON.stringify(link);
  }
  rec(steps, `${exId}: bridge link opens https://cad.onshape.com in a safe new tab`, linkOk, linkDetail);

  rec(steps, `${exId}: Done stays gated while the bridge card is already showing`,
    doneDisabledBefore === true && bridgeCount === 1,
    `disabled=${doneDisabledBefore} bridge=${bridgeCount}`);

  const segs = page.locator('.rail .segmented .seg');
  const onIndex = await segs.evaluateAll((nodes) => nodes.findIndex((n) => n.classList.contains('is-on')));
  await segs.nth(onIndex === 0 ? 1 : 0).click(); // use its scheme toggle

  await setSlider(page, 0.5); // drag its slider
  const moralVisibleAfter = await pollUntil(async () => !(await moral.isHidden()));
  const doneEnabledAfter = await pollUntil(async () => !(await primaryBtn.isDisabled()));
  rec(steps, `${exId}: counter moral appears only after counter slider moves`, moralVisibleAfter === true, `visible=${moralVisibleAfter}`);
  rec(steps, `${exId}: counter Done button enabled after counter slider moves`, doneEnabledAfter === true, `enabled=${doneEnabledAfter}`);

  if (capture) {
    await page.screenshot({ path: path.join(shotDir, `${exId}-counter-${vpLabel}.png`) });
  }

  await primaryBtn.click(); // "Mark Exercise N done ✓"
  await page.locator('.home').waitFor({ state: 'visible' });

  const status = (await page.locator(`a.ex-row[href="#/${exId}"] .ex-status`).innerText()).trim();
  rec(steps, `${exId}: marked done on home screen`, /done/i.test(status), `status="${status}"`);

  const storedKeys = await page.evaluate(({ key, id }) => {
    try {
      const p = JSON.parse(localStorage.getItem(key) || '{}');
      return p[id] ? Object.keys(p[id]).sort() : null;
    } catch { return null; }
  }, { key: STORE_KEY, id: exId });
  rec(steps, `${exId}: saved progress keeps its schema (no bridge-related keys)`,
    JSON.stringify(storedKeys) === JSON.stringify(PROGRESS_KEYS),
    `keys=${JSON.stringify(storedKeys)}`);

  return steps;
}

async function verifyResetProgress(page) {
  const steps = [];

  const allDoneBefore = await page.evaluate(({ key, ids }) => {
    try {
      const p = JSON.parse(localStorage.getItem(key) || '{}');
      return ids.every((id) => p[id] && p[id].done);
    } catch { return false; }
  }, { key: STORE_KEY, ids: EXERCISE_IDS });
  rec(steps, 'all six exercises marked done before reset', allDoneBefore === true);

  page.once('dialog', (d) => d.accept());
  await page.locator('.home-foot button.linklike', { hasText: 'Reset progress' }).click();
  await pollUntil(async () => (await page.evaluate((key) => localStorage.getItem(key), STORE_KEY)) === null);

  const storeAfter = await page.evaluate((key) => localStorage.getItem(key), STORE_KEY);
  rec(steps, `reset progress clears localStorage key "${STORE_KEY}"`, storeAfter === null, `value=${storeAfter}`);

  const statuses = await page.locator('a.ex-row .ex-status').allInnerTexts();
  const allStartable = statuses.length === EXERCISE_IDS.length && statuses.every((s) => !/done/i.test(s));
  rec(steps, 'reset progress returns all six to startable', allStartable, `statuses=${JSON.stringify(statuses)}`);

  const recapAfterReset = await page.locator('.recap').count();
  rec(steps, 'reset progress removes the completion recap', recapAfterReset === 0, `count=${recapAfterReset}`);

  return steps;
}

/* --------------------------------------------------------------- unit audit */

async function runUnitAudit(browser, vp, { loadUnit, toggleTo, flagRe, label }, collectors) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  await ctx.addInitScript((unit) => {
    try { localStorage.setItem('cad-gym.unit', unit); } catch { /* ignore */ }
  }, loadUnit);
  const page = await ctx.newPage();
  attachErrorListeners(page, `${vp.label} unit-audit(${label})`, collectors);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('.home').waitFor({ state: 'visible', timeout: 10000 });

  // eslint-disable-next-line no-undef
  await page.evaluate((u) => { setUnit(u); }, toggleTo);
  const strings = await collectUnitStrings(page);
  await ctx.close();

  const violations = strings.filter((s) => flagRe.test(s.value)).map((s) => ({ ...s, viewport: vp.label, check: label }));
  return { violations, scanned: strings.length };
}

/* -------------------------------------------------------------------- main */

async function main() {
  console.log('[qa] resolving Playwright…');
  const { chromium, how } = await resolvePlaywright();
  console.log(`[qa] Playwright resolved via: ${how}`);

  await fs.promises.mkdir(SHOT_DIR, { recursive: true });

  const collectors = { consoleErrors: [], pageErrors: [], requestFailures: [], httpErrors: [] };
  const allChecks = [];
  const shotPaths = [];
  const unitAuditSummaries = [];
  const allUnitViolations = [];

  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n[qa] === viewport ${vp.label} ===`);

      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      attachErrorListeners(page, `${vp.label} main`, collectors);

      await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.locator('.home').waitFor({ state: 'visible', timeout: 10000 });

      const faviconHref = await page.evaluate(() => document.querySelector('link[rel="icon"]')?.getAttribute('href') || '');
      rec(allChecks, `[${vp.label}] favicon is an inline data URI (no /favicon.ico request)`, faviconHref.startsWith('data:image/svg+xml'), faviconHref.slice(0, 50) + (faviconHref.length > 50 ? '…' : ''));

      const unitA11y = await page.evaluate(() => {
        const btn = document.querySelector('.unit-toggle');
        return btn && btn.getAttribute('aria-label') === 'Units: millimeters. Switch to inches.' && btn.getAttribute('aria-pressed') === 'false';
      });
      rec(allChecks, `[${vp.label}] unit toggle has an explicit accessible name and state`, unitA11y === true);

      const ovHome = await checkOverflow(page);
      const overflowPassHome = vp.width !== 390 || ovHome.scrollWidth <= ovHome.innerWidth;
      rec(allChecks, `[${vp.label}] no horizontal overflow — home`, overflowPassHome, `scrollWidth=${ovHome.scrollWidth} innerWidth=${ovHome.innerWidth}`);

      const recapFresh = await page.locator('.recap').count();
      rec(allChecks, `[${vp.label}] completion recap absent on fresh home screen`, recapFresh === 0, `count=${recapFresh}`);

      const homeShot = path.join(SHOT_DIR, `home-${vp.label}.png`);
      await page.screenshot({ path: homeShot });
      shotPaths.push(homeShot);

      for (const exId of EXERCISE_IDS) {
        const capture = exId === 'e1';
        console.log(`[qa]   running ${exId}${capture ? ' (with screenshots)' : ''}…`);
        const exSteps = await runExercise(page, exId, { capture, shotDir: SHOT_DIR, vpLabel: vp.label });
        allChecks.push(...exSteps);
        if (capture) {
          shotPaths.push(
            path.join(SHOT_DIR, `e1-consequence-${vp.label}.png`),
            path.join(SHOT_DIR, `e1-compare-${vp.label}.png`),
            path.join(SHOT_DIR, `e1-counter-${vp.label}.png`),
          );
        }
      }

      console.log('[qa]   verifying completion recap…');
      const recapCount = await page.locator('.recap').count();
      rec(allChecks, `[${vp.label}] completion recap present once all exercises are done`, recapCount === 1, `count=${recapCount}`);

      // eslint-disable-next-line no-undef
      const recapExpected = await page.evaluate(() => EXERCISES.filter((ex) => ex.available)
        .map((ex) => ({ id: ex.id, line: ex.takeaway.line, flip: ex.takeaway.flip })));
      const recapRows = await page.locator('.recap .recap-row').count();
      rec(allChecks, `[${vp.label}] recap row count matches available exercises`, recapRows === recapExpected.length, `rows=${recapRows} expected=${recapExpected.length}`);

      const recapText = recapCount === 1 ? await page.locator('.recap').innerText() : '';
      const recapMissing = recapExpected
        .filter((ex) => !recapText.includes(ex.line) || !recapText.includes(ex.flip))
        .map((ex) => ex.id);
      rec(allChecks, `[${vp.label}] recap carries every takeaway line and flip verbatim`, recapCount === 1 && recapMissing.length === 0, `missing=${JSON.stringify(recapMissing)}`);

      // Layout re-check inside a busy exercise view (compare pane), the most
      // likely place for a mobile overflow bug to show up.
      await page.locator(`a.ex-row[href="#/e2"]`).click();
      await page.locator('.player').waitFor({ state: 'visible' });
      const ovPlayer = await checkOverflow(page);
      const overflowPassPlayer = vp.width !== 390 || ovPlayer.scrollWidth <= ovPlayer.innerWidth;
      rec(allChecks, `[${vp.label}] no horizontal overflow — inside player`, overflowPassPlayer, `scrollWidth=${ovPlayer.scrollWidth} innerWidth=${ovPlayer.innerWidth}`);
      await page.locator('.backlink').click();
      await page.locator('.home').waitFor({ state: 'visible' });

      console.log('[qa]   verifying reset progress…');
      const resetSteps = await verifyResetProgress(page);
      allChecks.push(...resetSteps);

      await ctx.close();

      console.log('[qa]   running unit-copy staleness audit…');
      const auditA = await runUnitAudit(browser, vp, { loadUnit: 'mm', toggleTo: 'in', flagRe: MM_RE, label: 'frozen-mm-while-in' }, collectors);
      rec(allChecks, `[${vp.label}] unit audit: no frozen "NN mm" strings while unit=in`, auditA.violations.length === 0, `${auditA.violations.length} violation(s) out of ${auditA.scanned} strings scanned`);

      const auditB = await runUnitAudit(browser, vp, { loadUnit: 'in', toggleTo: 'mm', flagRe: IN_RE, label: 'frozen-in-while-mm' }, collectors);
      rec(allChecks, `[${vp.label}] unit audit: no frozen "NN in" strings while unit=mm`, auditB.violations.length === 0, `${auditB.violations.length} violation(s) out of ${auditB.scanned} strings scanned`);

      unitAuditSummaries.push({ vp: vp.label, scannedA: auditA.scanned, scannedB: auditB.scanned });
      allUnitViolations.push(...auditA.violations, ...auditB.violations);

      console.log('[qa]   running storage/SVG hardening checks…');
      allChecks.push(...await runStorageAndIdHardeningChecks(browser, vp, collectors));

      console.log('[qa]   running E5 feature-tree scene checks…');
      allChecks.push(...await runE5SceneChecks(browser, vp, collectors));
      allChecks.push(...await runE6SceneChecks(browser, vp, collectors));
    }
  } finally {
    await browser.close();
  }

  /* ---- console/page error gate ---- */
  const rawErrors = [...collectors.consoleErrors, ...collectors.pageErrors];
  const realErrors = rawErrors.filter((e) => !isFontRelated(e));
  const environmentalErrors = rawErrors.filter(isFontRelated);
  rec(allChecks, 'zero console/page errors across the whole run', realErrors.length === 0, `${realErrors.length} real, ${environmentalErrors.length} environmental (fonts)`);

  const faviconNetworkIssues = [...collectors.requestFailures, ...collectors.httpErrors].filter((e) => /favicon/i.test(e.url || ''));
  rec(allChecks, 'no /favicon.ico network failure anywhere in the run', faviconNetworkIssues.length === 0, `${faviconNetworkIssues.length} favicon-related network issue(s)`);

  /* ---------------------------------------------------------------- report */
  console.log('\n' + '='.repeat(78));
  console.log('CAD Intuition Gym — QA report');
  console.log('='.repeat(78));
  console.log(`Playwright resolved via: ${how}`);
  console.log(`Screenshots written to: ${SHOT_DIR}`);
  for (const s of unitAuditSummaries) {
    console.log(`Unit audit @ ${s.vp}: scanned ${s.scannedA} strings (mm-load pass), ${s.scannedB} strings (in-load pass)`);
  }
  console.log('');

  const width = Math.min(100, Math.max(...allChecks.map((c) => c.name.length)) + 2);
  let passCount = 0;
  for (const c of allChecks) {
    const mark = c.pass ? 'PASS' : 'FAIL';
    if (c.pass) passCount++;
    console.log(`[${mark}] ${c.name.padEnd(width)} ${c.detail || ''}`);
  }
  console.log('');
  console.log(`${passCount}/${allChecks.length} checks passed.`);

  if (allUnitViolations.length) {
    console.log('\n--- Unit-copy staleness violations (verbatim) ---');
    for (const v of allUnitViolations) {
      console.log(`  [${v.viewport} / ${v.check}] ${v.path}\n    → "${v.value}"`);
    }
  }

  if (realErrors.length) {
    console.log('\n--- Real console/page errors (verbatim) ---');
    for (const e of realErrors) {
      console.log(`  [${e.label}] ${e.text || e.message}`);
    }
  }
  if (environmentalErrors.length) {
    console.log('\n--- Environmental (Google Fonts network) — not counted as failures ---');
    for (const e of environmentalErrors) {
      console.log(`  [${e.label}] ${e.text || e.message}`);
    }
  }

  console.log('\nScreenshots:');
  for (const p of shotPaths) console.log(`  ${p}`);

  const failed = allChecks.filter((c) => !c.pass);
  console.log('\n' + '='.repeat(78));
  console.log(failed.length ? `RESULT: FAIL (${failed.length} failing check(s))` : 'RESULT: PASS');
  console.log('='.repeat(78));

  process.exitCode = failed.length ? 1 : 0;
}

main().catch((err) => {
  console.error('\n[qa] harness crashed:', err);
  process.exitCode = 1;
});
