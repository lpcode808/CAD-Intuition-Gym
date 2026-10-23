/* app.js — router, home screen, and the exercise player.
   The player runs the five-step loop every exercise shares:
   intent → predict → choose → the change lands → name it & flip it. */
'use strict';

const STORE_KEY = 'cad-gym.v1';
const appRoot = document.getElementById('app');
let sessionProgress = {};
let progressWritable = true;   // false once a write has failed: then the session copy is the truth

/* ------------------------------------------------------------ unit toggle
   A single fixed control, outside #app so re-rendering the home screen or
   the player never wipes it out. Toggling re-runs whatever is on screen
   right now (without resetting exercise progress). */

let rerenderCurrent = () => {};

function unitToggleLabel() {
  return getUnit() === 'in' ? 'in' : 'mm';
}
function unitToggleA11yLabel() {
  return getUnit() === 'in'
    ? 'Units: inches. Switch to millimeters.'
    : 'Units: millimeters. Switch to inches.';
}

const unitToggleBtn = h('button', {
  class: 'unit-toggle',
  title: 'Switch between millimeters and inches',
  'aria-label': unitToggleA11yLabel(),
  'aria-pressed': getUnit() === 'in' ? 'true' : 'false',
  onclick: () => {
    toggleUnit();
    unitToggleBtn.textContent = unitToggleLabel();
    unitToggleBtn.setAttribute('aria-label', unitToggleA11yLabel());
    unitToggleBtn.setAttribute('aria-pressed', getUnit() === 'in' ? 'true' : 'false');
    rerenderCurrent();
  },
}, unitToggleLabel());
appRoot.before(unitToggleBtn);   // first in Tab order, where it sits (top-right)

const STEP_NAMES = ['Intent', 'Predict', 'Choose', 'The change', 'Flip it'];
const TONE_MARK = { good: '✓', bad: '✕', warn: '△', idle: '' };

/* ---------------------------------------------------------------- badges
   Light gym flavor. Each badge is earned once and kept in this browser
   (cad-gym.badges: badge id → ISO date), cleared with progress. It lives
   apart from cad-gym.v1 so the per-exercise progress schema stays as-is. */

const BADGE_KEY = 'cad-gym.badges';
const BADGES = [
  { id: 'first-rep', glyph: '1', name: 'First rep', how: 'Finish your first exercise.' },
  { id: 'called-it', glyph: '✓', name: 'Called it', how: 'Predict the consequence before it lands.' },
  { id: 'felt-the-miss', glyph: '✕', name: 'Felt the miss', how: 'Finish one you predicted wrong. The miss is the workout.' },
  { id: 'spotter', glyph: 'AB', name: 'Spotter', how: 'Watch both schemes side by side.' },
  { id: 'cross-trainer', glyph: 'IRL', name: 'Cross-trainer', how: 'See a scene in the everyday layer.' },
  { id: 'called-the-flip', glyph: '⇄', name: 'Called the flip', how: 'In “Flip it”, call the right scheme before you run it.' },
  { id: 'sharp-eye', glyph: '3×', name: 'Sharp eye', how: 'Call three predictions right.' },
  { id: 'second-set', glyph: '↺', name: 'Second set', how: 'Come back on a later day and redo one you finished.' },
  { id: 'into-the-cockpit', glyph: '↗', name: 'Into the cockpit', how: 'Open Onshape from a “Try the real thing” card.' },
  { id: 'full-circuit', glyph: '★', name: 'Full circuit', how: 'Finish every exercise.' },
];
let sessionBadges = {};
let badgesWritable = true;

function loadBadges() {
  if (!badgesWritable) return sessionBadges;
  try {
    const parsed = JSON.parse(localStorage.getItem(BADGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : sessionBadges;
  }
  catch { return sessionBadges; }
}

// Returns the badge if this call earned it. `quiet` skips the toast — finish()
// lists its badges on the rep-complete card instead of stacking toasts on it.
function award(id, { quiet = false } = {}) {
  const earned = loadBadges();
  const badge = BADGES.find((b) => b.id === id);
  if (!badge || earned[id]) return null;
  earned[id] = new Date().toISOString();
  sessionBadges = earned;
  try { localStorage.setItem(BADGE_KEY, JSON.stringify(earned)); } catch { badgesWritable = false; }
  if (!quiet) showToast(badge);
  return badge;
}

/* Toasts sit outside #app (like the unit pill) so a route change — finishing
   an exercise lands you on home — doesn't wipe one mid-read. */
const toastHost = h('div', { class: 'toast-host', role: 'status', 'aria-live': 'polite' });
document.body.appendChild(toastHost);

// Screen readers hear the moments that matter (a verdict, a gate opening) —
// once, on the transition — not every slider tick.
const srStatus = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
document.body.appendChild(srStatus);
function announce(text) {
  srStatus.textContent = '';
  setTimeout(() => { srStatus.textContent = text; }, 50);
}

function showToast(badge) {
  const el = h('div', { class: 'toast' },
    h('span', { class: 'medal is-earned', 'aria-hidden': 'true' }, badge.glyph),
    h('span', { class: 'toast-text' },
      h('span', { class: 'toast-kicker' }, 'Badge earned'),
      h('span', { class: 'toast-name' }, badge.name),
      h('span', { class: 'toast-how' }, badge.how)));
  while (toastHost.children.length >= 3) toastHost.firstChild.remove();
  toastHost.append(el);
  setTimeout(() => el.classList.add('is-leaving'), 3400);
  setTimeout(() => el.remove(), 3800);
}

/* ------------------------------------------------------------- utilities */

function loadProgress() {
  if (!progressWritable) return sessionProgress;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : sessionProgress;
  }
  catch { return sessionProgress; }
}
function saveProgress(p) {
  // Storage can be blocked (locked-down classroom browsers, strict privacy
  // modes) — retain it for this session rather than failing to render.
  sessionProgress = p;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch { progressWritable = false; }
}

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

/* ------------------------------------------------------------------ home */

// Set by finish(), read once by the next home render: the rep-complete card.
let justFinished = null;
// In-progress reps by exercise id — memory only, so Back/Forward or a peek at
// home doesn't throw a rep away. Cleared on finish and on Reset progress.
const reps = {};

function renderHome() {
  document.title = 'CAD Intuition Gym';
  rerenderCurrent = renderHome;
  const prog = loadProgress();
  const anyDone = EXERCISES.some((ex) => prog[ex.id] && prog[ex.id].done);
  const availableExercises = EXERCISES.filter((ex) => ex.available);
  const allDone = availableExercises.length > 0
    && availableExercises.every((ex) => prog[ex.id] && prog[ex.id].done);
  const nextUp = availableExercises.find((ex) => !(prog[ex.id] && prog[ex.id].done));
  const doneList = availableExercises.filter((ex) => prog[ex.id] && prog[ex.id].done);
  const called = doneList.filter((ex) => prog[ex.id].predictedRight).length;
  // Badges arrived after the circuit had been live for months: quietly award
  // whatever stored progress already proves, so a finished circuit doesn't
  // sit next to an empty locker. (No-ops once earned; finish() awards first.)
  const quiet = { quiet: true };
  if (anyDone) award('first-rep', quiet);
  if (allDone) award('full-circuit', quiet);
  if (called >= 3) award('sharp-eye', quiet);
  if (called > 0) award('called-it', quiet);
  if (doneList.some((ex) => !prog[ex.id].predictedRight)) award('felt-the-miss', quiet);
  const finished = justFinished && EXERCISES.find((ex) => ex.id === justFinished.id);
  const inProgress = (ex) => !!(reps[ex.id] && reps[ex.id].maxStep > 0);
  const justBadges = (justFinished && justFinished.badges) || [];

  const rows = EXERCISES.map((ex) => {
    const done = prog[ex.id] && prog[ex.id].done;
    const num = h('span', { class: 'ex-num' }, String(ex.num).padStart(2, '0'));
    // The principle is the payoff: until it's earned, a row names the
    // situation and its job, so the menu doesn't answer the prediction.
    const text = h('span', { class: 'ex-row-text' },
      h('span', { class: 'ex-row-title' }, done ? ex.title : ex.brief.heading),
      h('span', { class: 'ex-row-tag' }, done ? ex.tagline : ex.brief.intent));
    if (!ex.available) {
      return h('div', { class: 'ex-row is-locked' },
        num, text, h('span', { class: 'ex-status' }, 'in authoring'));
    }
    const startLabel = inProgress(ex) ? 'resume →' : ex !== nextUp ? 'start →' : anyDone ? 'next →' : 'start here →';
    return h('a', { class: 'ex-row', href: `#/${ex.id}` },
      num, text,
      h('span', { class: 'ex-status' + (done ? ' is-done' : ' is-go') },
        done ? 'done ✓' : startLabel));
  });

  const repDone = finished && h('section', { class: 'rep-done', tabindex: '-1' },
    h('p', { class: 'rep-kicker' }, `Rep complete · ${doneList.length} of ${availableExercises.length}`),
    h('p', { class: 'rep-title' }, finished.title),
    h('p', { class: 'rep-line' }, finished.takeaway.line),
    justBadges.length > 0 && h('span', { class: 'sr-only' }, 'Badges earned: '),
    justBadges.length > 0 && h('ul', { class: 'rep-badges' }, justBadges.map((b) =>
      h('li', {},
        h('span', { class: 'medal is-earned', 'aria-hidden': 'true' }, b.glyph),
        h('span', {}, h('strong', {}, b.name), ' — ', b.how)))),
    nextUp
      ? h('a', { class: 'btn primary', href: `#/${nextUp.id}` }, `Next: ${nextUp.brief.heading} →`)
      : h('button', {
        class: 'btn primary',
        onclick: () => {
          const target = document.querySelector('.recap h2');
          if (!target) return;
          target.focus({ preventScroll: true });
          target.scrollIntoView({
            block: 'start',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          });
        },
      }, 'See what you leave with ↓'));

  appRoot.replaceChildren(
    h('main', { class: 'home' },
      repDone,
      h('p', { class: 'kicker' }, 'CAD Intuition Gym'),
      h('h1', {}, 'Model your intent, not your accident.'),
      h('p', { class: 'lede' },
        'A gym for the CAD decisions that don’t have a button. You can sketch and extrude — but nothing you’ve modeled has ever broken on you. Here, it will. On purpose, a few minutes per exercise.'),
      h('p', { class: 'rep-how' },
        'One rep: read the job → guess what breaks → push the change through both ways → name the rule, then find where it flips. About five minutes.'),
      !finished && nextUp && h('a', { class: 'btn primary hero-cta', href: `#/${nextUp.id}` },
        inProgress(nextUp) ? `Resume Exercise ${nextUp.num} →` : anyDone ? `Continue: Exercise ${nextUp.num} →` : 'Start Exercise 1 →'),
      h('p', { class: 'sim-note' },
        'It’s a flight simulator: crash here so you don’t crash in Onshape. There’s no CAD engine behind it — every consequence is hand-built so the lesson lands clean.'),
      h('h2', { class: 'section-label' }, 'Six decisions',
        anyDone && h('span', { class: 'section-count' },
          ` · ${availableExercises.filter((ex) => prog[ex.id] && prog[ex.id].done).length} done`)),
      h('div', { class: 'ex-list' }, rows),
      anyDone && h('section', { class: 'recap' },
        h('h2', { class: 'section-label', tabindex: '-1' }, allDone ? 'What you leave with' : 'What you’ve earned so far'),
        h('p', { class: 'recap-lede' }, 'Every rule you’ve earned, with the flip that keeps it honest. Say the exception to yourself before you open “Unless…?” — the rule was never the rule; the intent is.'),
        h('p', { class: 'recap-score' }, called === doneList.length
          ? `You called ${doneList.length === 1 ? 'your prediction' : `all ${doneList.length} predictions`} before the change landed.`
          : `You called ${called} of ${doneList.length} predictions before the change landed — and felt the rest.`),
        h('div', { class: 'recap-list' }, doneList.map((ex) =>
          h('div', { class: 'recap-row' },
            h('span', { class: 'ex-num' }, String(ex.num).padStart(2, '0')),
            h('div', { class: 'recap-text' },
              h('p', { class: 'recap-title' }, ex.title),
              h('p', { class: 'recap-line' }, ex.takeaway.line),
              h('details', { class: 'recap-flip' },
                h('summary', {}, 'Unless…?', h('span', { class: 'sr-only' }, ` — ${ex.title}`)),
                h('p', {}, ex.takeaway.flip)),
              ex.takeaway.tool && h('details', { class: 'recap-flip' },
                h('summary', {}, 'In Onshape…?', h('span', { class: 'sr-only' }, ` — ${ex.title}`)),
                h('p', {}, ex.takeaway.tool))))))),
      locker(),
      h('footer', { class: 'home-foot' },
        h('span', {}, 'Progress lives in this browser and nowhere else.'),
        h('button', { class: 'linklike', onclick: resetProgress }, 'Reset progress'))));
  if (repDone && !justFinished.focused) { justFinished.focused = true; repDone.focus({ preventScroll: true }); }
}

function locker() {
  const earned = loadBadges();
  const count = BADGES.filter((b) => earned[b.id]).length;
  if (!count) {
    // Ten empty slots shouldn't outweigh the exercises on a first visit.
    return h('section', { class: 'locker' },
      h('h2', { class: 'section-label' }, `Your locker · 0 of ${BADGES.length} badges`),
      h('p', { class: 'locker-empty' }, 'Badges land as you train — for calling a consequence, watching both schemes, coming back on another day.'));
  }
  return h('section', { class: 'locker' },
    h('h2', { class: 'section-label' }, `Your locker · ${count} of ${BADGES.length} badges`),
    h('ul', { class: 'locker-grid' }, BADGES.map((b) =>
      h('li', { class: 'badge' + (earned[b.id] ? ' is-earned' : '') },
        h('span', { class: 'medal' + (earned[b.id] ? ' is-earned' : ''), 'aria-hidden': 'true' }, b.glyph),
        h('span', { class: 'badge-text' },
          h('span', { class: 'badge-name' }, b.name),
          h('span', { class: 'sr-only' }, earned[b.id] ? ' — earned. ' : ' — not yet. '),
          h('span', { class: 'badge-how' }, b.how))))));
}

function resetProgress() {
  if (confirm('Clear your progress and badges on this device?')) {
    sessionProgress = {};
    sessionBadges = {};
    justFinished = null;
    for (const k in reps) delete reps[k];
    try { localStorage.removeItem(STORE_KEY); } catch { /* nothing stored anyway */ }
    try { localStorage.removeItem(BADGE_KEY); } catch { /* nothing stored anyway */ }
    route();
  }
}

/* ---------------------------------------------------------------- player */

function renderPlayer(ex) {
  justFinished = null;   // the rep card belongs to the home visit right after a finish
  // A redo isn't a cold prediction: its home row already shows the principle.
  // The score and the prediction badges count first attempts only.
  const isRedo = !!(loadProgress()[ex.id] && loadProgress()[ex.id].done);

  const S = reps[ex.id] || (reps[ex.id] = {
    step: 0, maxStep: 0,
    predicted: null,      // their guess at what survives
    built: null,          // the scheme they committed to
    view: null,           // the scheme currently on screen (flippable in step 3)
    t: 0, moved: false, compare: false, revealed: false,
    counterT: 0, counterPath: ex.counter.defaultPath, counterMoved: false,
    seen: { a: false, b: false },          // each scheme watched under the change (t ≥ SEEN_T)
    earned: [],                            // badges toasted during this rep, listed again on the rep card
    counterCall: null,                     // their call in "Flip it", before running it
    counterSeen: { a: false, b: false },
    flipDone: false,                       // the flip's verdict has been announced
    featuresOpen: null,   // null until the learner toggles it — then it sticks
  });
  // The flip's winner: whichever scheme holds at the full change.
  const counterAnswer = ['a', 'b'].find((p) => ex.counter.outcome(p, 1).tone === 'good');
  const refs = {};

  function earn(id) {
    const quiet = window.matchMedia('(max-width: 600px)').matches;
    const b = award(id, { quiet });
    if (b) S.earned.push(quiet ? { ...b, quiet: true } : b);
  }

  function go(i) {
    S.step = i; S.maxStep = Math.max(S.maxStep, i);
    // Choose starts on their guess — one tap to build it, or pick the other.
    if (i === 2 && !S.built && S.predicted) { S.built = S.predicted; S.view = S.predicted; }
    render();
    landStep();
  }
  function advance() { go(S.step + 1); }
  // Land the new step's first line in view — just below the pinned scene on
  // phones, or scrolled up to in short windows — and focus its heading.
  function landStep() {
    const vp = refs.body.querySelector('.viewport-panel');
    const cover = window.matchMedia('(max-width: 980px)').matches && getComputedStyle(vp).position === 'sticky'
      ? vp.offsetHeight : 0;
    const top = refs.rail.getBoundingClientRect().top;
    if (top < cover || top > window.innerHeight - 60) window.scrollBy(0, top - cover - 12);
    focusStep();
    shieldRail();
  }
  // The second click of a double-click or double-tap would land on whatever
  // the new rail put under the pointer (a prediction, a scheme, the call).
  function shieldRail() {
    const rail = refs.rail;
    rail.style.pointerEvents = 'none';
    setTimeout(() => { rail.style.pointerEvents = ''; }, 400);
  }
  function focusStep() {
    (refs.rail.querySelector('[data-ref="stephead"]') || refs.rail).focus({ preventScroll: true });
  }

  function restart() {
    Object.assign(S, {
      step: 0, maxStep: 0, predicted: null, built: null, view: null,
      t: 0, moved: false, compare: false, revealed: false,
      counterT: 0, counterPath: ex.counter.defaultPath, counterMoved: false,
      seen: { a: false, b: false }, counterCall: null, counterSeen: { a: false, b: false },
      flipDone: false,
      earned: S.earned.filter((b) => b.quiet),   // never toasted (phone) — the rep card is their only showing
    });
    render();
    window.scrollTo(0, 0);
    landStep();
  }

  /* ---- shell ---- */

  function render() {
    // The situation until "Name it", then the principle.
    document.title = `E${ex.num} · ${S.step === 4 ? ex.title : ex.brief.heading} — CAD Intuition Gym`;
    refs.features = h('div', { class: 'features-body' });
    refs.viewport = h('div', { class: 'viewport' });
    refs.rail = h('div', { class: 'rail', tabindex: '-1' });

    const featuresPanel = h('details', { class: 'features-panel' },
      h('summary', { onclick: () => { S.featuresOpen = !featuresPanel.open; } },
        h('span', { class: 'panel-kicker' }, 'Features'),
        h('span', { class: 'panel-sub' }, 'Part Studio')),
      refs.features);
    featuresPanel.open = S.featuresOpen ?? window.matchMedia('(min-width: 981px)').matches;

    appRoot.replaceChildren(
      h('div', { class: 'player' },
        h('header', { class: 'ex-header' },
          h('div', { class: 'ex-header-row' },
            h('a', { class: 'backlink', href: '#/' }, '← All exercises'),
            h('h1', { class: 'ex-title' }, `Exercise ${ex.num} — ${S.step === 4 ? ex.title : ex.brief.heading}`),
            h('button', { class: 'linklike', onclick: restart }, '↺ restart')),
          stepper()),
        refs.body = h('main', { class: 'ex-body', 'data-step': String(S.step) },
          featuresPanel,
          h('div', { class: 'viewport-panel' }, refs.viewport),
          h('div', { class: 'rail-panel' }, refs.rail))));

    renderStep();
  }

  function stepper() {
    return h('ol', { class: 'stepper' }, STEP_NAMES.map((name, i) => {
      const dot = h('span', { class: 'step-dot' }, i < S.step ? '✓' : String(i + 1));
      const cls = 'step' + (i === S.step ? ' is-current' : '') + (i < S.step ? ' is-done' : '');
      const inner = (i <= S.maxStep && i !== S.step)
        ? h('button', { class: 'step-btn', onclick: () => go(i) }, dot, name)
        : h('span', { class: 'step-btn', 'aria-current': i === S.step ? 'step' : null }, dot, name);
      return h('li', { class: cls }, inner);
    }));
  }

  function renderStep(focusName) {
    const y = window.scrollY;
    refs.continueBtn = refs.doneBtn = null;   // drawScenes() gates only what the new rail builds
    refreshFeatures();
    renderViewport();
    refs.rail.replaceChildren(...railContent());
    updateGates();
    // Replacing the rail under a focused control would drop focus to <body>
    // and clamp the scroll; put both back.
    if (window.scrollY !== y) window.scrollTo(0, y);
    if (focusName) focusRef(focusName);
  }

  function focusRef(name) {
    const el = refs.rail.querySelector(`[data-ref="${name}"]`);
    if (el) el.focus();
  }

  /* ---- left panel: the Onshape furniture ---- */

  function refreshFeatures() {
    const list = S.step === 4
      ? ex.counter.features(S.counterPath)
      : ex.features(S.step >= 2 ? S.view : null);
    refs.features.replaceChildren(...list.map((f) =>
      h('div', { class: 'feat' + (f.active ? ' is-active' : '') },
        h('span', { class: 'feat-dot' }),
        h('span', { class: 'feat-text' },
          h('span', { class: 'feat-label' }, f.label),
          f.sub ? h('span', { class: 'feat-sub' }, f.sub) : null))));
  }

  /* ---- viewport ---- */

  function renderViewport() {
    refs.panes = null;
    refs.single = null;
    // Compare gets the features column's width: the left panel can only
    // describe one scheme, and two legible panes need the room.
    refs.body.classList.toggle('is-compare', S.step === 3 && S.compare);
    if (S.step === 3 && S.compare) {
      refs.panes = {};
      const wrap = h('div', { class: 'compare' });
      for (const p of ['a', 'b']) {
        const { svg, stage } = makeSceneSvg();
        const chip = h('div', { class: 'outcome-chip' });
        wrap.append(h('figure', { class: 'pane' },
          h('figcaption', { class: 'pane-cap' },
            h('span', { class: 'pane-key' }, p.toUpperCase()),
            ex.paths[p].label),
          svg, chip));
        refs.panes[p] = { svg, stage, chip };
      }
      refs.viewport.replaceChildren(...[layerBar(), wrap].filter(Boolean));
    } else {
      const { svg, stage } = makeSceneSvg();
      const chip = h('div', { class: 'outcome-chip' });
      refs.single = { svg, stage, chip };
      refs.viewport.replaceChildren(...[layerBar(), svg, chip].filter(Boolean));
    }
    drawScenes();
  }

  /* ---- everyday layer: the same scene, seen as the real thing ---- */

  function everydayDef() {
    return S.step === 4 ? ex.counter.everyday : ex.everyday;
  }

  function layerBar() {
    const def = everydayDef();
    if (!def) return null;
    return h('div', { class: 'layer-bar' },
      h('div', { class: 'segmented', role: 'group', 'aria-label': 'Scene layer' },
        [['cad', 'CAD'], ['everyday', 'Everyday']].map(([v, label]) =>
          h('button', {
            class: 'seg' + (getLayer() === v ? ' is-on' : ''),
            'aria-pressed': getLayer() === v ? 'true' : 'false',
            onclick: () => {
              if (getLayer() === v) return;
              setLayer(v);
              if (v === 'everyday') earn('cross-trainer');
              renderViewport();
              const again = refs.viewport.querySelector('.layer-bar .seg.is-on');
              if (again) again.focus();
            },
          }, label))),
      getLayer() === 'everyday'
        ? h('span', { class: 'layer-thing' }, def.thing,
          S.step >= 3 && h('span', { class: 'layer-note' }, ' Each slider position is a fresh one, built from your model.'))
        : h('span', { class: 'layer-hint' }, 'Everyday shows the real object this part stands for.'));
  }

  /* Under → CAD scene → over. The CAD drawing stays on top as the trace. */
  function paintScene({ svg, stage }, sceneFn, def, opts) {
    clearNode(stage);
    const everyday = getLayer() === 'everyday' && def ? def : null;
    svg.classList.toggle('is-everyday', !!everyday);
    svg.classList.toggle('is-trace', !!(everyday && everyday.trace));
    // fill / fillAlt: a color, or a function of { t, path } (material can differ by scheme).
    for (const [key, prop] of [['fill', '--ed-fill'], ['fillAlt', '--ed-fill-alt']]) {
      const v = everyday && (typeof everyday[key] === 'function' ? everyday[key](opts) : everyday[key]);
      if (v) svg.style.setProperty(prop, v);
      else svg.style.removeProperty(prop);
    }
    svg.setAttribute('aria-label', everyday
      ? `Everyday view: ${everyday.thing}`
      : 'CAD modeling consequence scene');
    if (everyday && everyday.under) everyday.under(svgEl('g', { class: 'ed-under' }, stage), opts);
    sceneFn(svgEl('g', { class: 'cad' }, stage), opts);
    if (everyday && everyday.over) {
      const over = svgEl('g', { class: 'ed-over' }, stage);
      everyday.over(over, opts);
      // The everyday line never contradicts the outcome chip: no "all good"
      // while the chip still warns (an object can forgive a little drift
      // that the intent doesn't).
      if (opts.tone === 'warn' || opts.tone === 'bad') {
        over.querySelectorAll('.ed-say.good').forEach((n) => n.remove());
      }
    }
  }

  function setChip(chip, o) {
    if (!o) { chip.className = 'outcome-chip'; chip.textContent = ''; return; }
    chip.className = `outcome-chip is-on tone-${o.tone}`;
    const mark = TONE_MARK[o.tone];
    chip.textContent = (mark ? mark + ' ' : '') + o.headline;
  }

  function drawScenes() {
    if (S.step === 4) {
      const o = ex.counter.outcome(S.counterPath, S.counterT);
      paintScene(refs.single, ex.counter.scene, ex.counter.everyday, { t: S.counterT, path: S.counterPath, tone: o.tone });
      setChip(refs.single.chip, o);
    } else if (S.step === 3 && S.compare) {
      for (const p of ['a', 'b']) {
        const o = ex.outcome(p, S.t);
        paintScene(refs.panes[p], ex.scene, ex.everyday, { t: S.t, path: p, tone: o.tone });
        setChip(refs.panes[p].chip, o);
      }
    } else {
      const o = S.step === 3 ? ex.outcome(S.view, S.t) : null;
      paintScene(refs.single, ex.scene, ex.everyday, {
        t: S.step === 3 ? S.t : 0,
        path: S.step >= 2 ? S.view : null,
        tone: o ? o.tone : null,
      });
      setChip(refs.single.chip, o);
    }
    markSeen();
  }

  /* Contrasting cases are the mechanism (PRD §5): both schemes have to be
     watched under the change — in "The change" and again in "Flip it" —
     before the lesson gets named. Compare mode counts for both. */
  const SEEN_T = 0.55;

  const settled = (outcome, p, t) => t >= SEEN_T && outcome(p, t).tone === outcome(p, 1).tone;

  function markSeen() {
    if (S.step === 3) {
      for (const p of S.compare ? ['a', 'b'] : S.view ? [S.view] : []) {
        if (settled(ex.outcome, p, S.t)) S.seen[p] = true;
      }
    }
    if (S.step === 4 && S.counterCall && settled(ex.counter.outcome, S.counterPath, S.counterT)) {
      S.counterSeen[S.counterPath] = true;
    }
    updateGates();
  }

  function gateHint(seen, view, first, t) {
    if (seen.a && seen.b) return null;
    const past = t >= SEEN_T;
    if (view === null) return past ? 'Keep going — let both verdicts land.' : 'Drag the change past halfway — both schemes are on screen.';
    if (!seen[view] && past) return 'Keep going — the verdict hasn’t landed yet.';
    if (!seen.a && !seen.b) return first;
    const other = seen.a ? 'b' : 'a';
    return view === other
      ? `Keep going — run ${other.toUpperCase()} through the change too.`
      : `Now switch to ${other.toUpperCase()} and run the same change — the lesson is in the difference.`;
  }

  function setHint(node, msg) {
    if (node.textContent !== (msg || '')) node.textContent = msg || '';
    node.hidden = !msg;
  }

  function updateGates() {
    if (S.step === 3 && refs.continueBtn) {
      const both = S.seen.a && S.seen.b;
      refs.continueBtn.disabled = !both;
      setHint(refs.moveHint, gateHint(S.seen, S.compare ? null : S.view,
        ex.change.hint || 'Drag the slider first — feel it before we name it.', S.t));
      // The verdict waits for the comparison, like the flip's moral does.
      if (both && !S.revealed) {
        S.revealed = true;
        fillPredChip();
        announce(`${refs.predChip.textContent} Both schemes have run — Name the lesson is ready.`);
      }
    }
    if (S.step === 4 && refs.doneBtn) {
      const both = S.counterSeen.a && S.counterSeen.b;
      refs.doneBtn.disabled = !both;
      refs.moral.hidden = !both;
      refs.callChip.hidden = !both;
      setHint(refs.moveHint2, gateHint(S.counterSeen, S.counterPath,
        ex.counter.hint || 'Run the change one more time — this part has a different job.', S.counterT));
      if (both && !S.flipDone) {
        S.flipDone = true;
        announce(`${refs.callChip.textContent} ${ex.counter.moral}`);
      }
    }
  }

  /* ---- rail (step content) ---- */

  function railContent() {
    switch (S.step) {
      case 0: return railBrief();
      case 1: return railPredict();
      case 2: return railChoose();
      case 3: return railChange();
      case 4: return railTakeaway();
      default: return [];
    }
  }

  function optionButtons(selected, onPick, guessed) {
    return h('div', { class: 'options' }, ['a', 'b'].map((p) =>
      h('button', {
        class: 'option' + (selected === p ? ' is-selected' : ''),
        'aria-pressed': selected === p ? 'true' : 'false',
        disabled: !onPick,
        onclick: onPick ? () => onPick(p) : null,
      },
        h('span', { class: 'option-key' }, p.toUpperCase()),
        h('span', { class: 'option-text' },
          h('span', { class: 'option-label' }, ex.paths[p].label),
          h('span', { class: 'option-sub' }, ex.paths[p].sub)),
        guessed === p ? h('span', { class: 'guess-tag' }, 'your guess') : null)));
  }

  function sliderBlock({ label, value, format, oninput, valuetext }) {
    refs.sliderVal = h('span', { class: 'slider-val' }, format(value));
    const input = h('input', {
      type: 'range', min: '0', max: '1000',
      value: String(Math.round(value * 1000)),
      class: 'slider', 'aria-label': label,
    });
    const describe = () => input.setAttribute('aria-valuetext', valuetext(input.valueAsNumber / 1000));
    describe();
    input.addEventListener('input', () => { oninput(input.valueAsNumber / 1000); describe(); });
    // Fine-grained for dragging, but arrows move 5% (PageUp/PageDown 20%):
    // reaching the halfway reveal shouldn't take hundreds of key presses.
    input.addEventListener('keydown', (e) => {
      const steps = { ArrowRight: 50, ArrowUp: 50, ArrowLeft: -50, ArrowDown: -50, PageUp: 200, PageDown: -200 };
      if (!(e.key in steps)) return;
      e.preventDefault();
      input.value = String(Math.max(0, Math.min(1000, input.valueAsNumber + steps[e.key])));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return h('div', { class: 'slider-block' },
      h('div', { class: 'slider-head' },
        h('span', { class: 'slider-label' }, label),
        refs.sliderVal),
      input);
  }

  /* step 0 — the intent brief */
  function railBrief() {
    return [
      h('p', { class: 'kicker' }, `Exercise ${ex.num} · the intent`),
      h('h2', { class: 'rail-head', tabindex: '-1', 'data-ref': 'stephead' }, ex.brief.heading),
      h('p', { class: 'prose' }, ex.brief.body),
      h('div', { class: 'intent-card' },
        h('div', { class: 'intent-item' },
          h('span', { class: 'intent-k' }, 'What it’s for'),
          h('span', { class: 'intent-v' }, ex.brief.intent)),
        h('div', { class: 'intent-item' },
          h('span', { class: 'intent-k' }, 'What will change'),
          h('span', { class: 'intent-v' }, ex.brief.change))),
      h('button', { class: 'btn primary', onclick: advance }, 'Make a prediction →'),
    ];
  }

  /* step 1 — predict (light tap; see PRD §11.5) */
  function railPredict() {
    // Once the change has landed, the guess is on record — coming back here
    // can't rewrite "You called it", the score, or the badges.
    const locked = S.maxStep >= 3;
    const out = [
      h('h2', { class: 'kicker', tabindex: '-1', 'data-ref': 'stephead' }, 'Predict'),
      h('p', { class: 'prose' }, ex.predict.prompt),
      optionButtons(S.predicted, locked ? null : (p) => { S.predicted = p; renderStep('continue'); }, locked ? S.predicted : null),
      h('p', { class: 'fine' }, locked ? 'Your guess is locked in — you made it before the change landed.' : ex.predict.note),
    ];
    if (S.predicted) {
      out.push(h('button', {
        class: 'btn primary', 'data-ref': 'continue', onclick: locked ? () => go(S.maxStep) : advance,
      }, locked ? 'Back to where you were →' : 'Lock it in →'));
    }
    return out;
  }

  /* step 2 — choose a modeling strategy */
  function railChoose() {
    const out = [
      h('h2', { class: 'kicker', tabindex: '-1', 'data-ref': 'stephead' }, 'Choose'),
      h('p', { class: 'prose' }, ex.choose.prompt),
      optionButtons(S.built, (p) => { S.built = p; S.view = p; renderStep('continue'); }, S.predicted),
    ];
    if (S.built) {
      out.push(h('button', {
        class: 'btn primary', 'data-ref': 'continue', onclick: advance,
      }, 'Send in the change request →'));
    }
    return out;
  }

  /* step 3 — the change lands (slider + toggle + compare) */
  function railChange() {
    const out = [
      h('h2', { class: 'kicker', tabindex: '-1', 'data-ref': 'stephead' }, 'The change lands'),
      h('div', { class: 'change-card' },
        h('span', { class: 'change-kicker' }, 'Change request · #001'),
        h('p', { class: 'change-quote' }, ex.change.request)),
      sliderBlock({
        label: ex.change.sliderLabel,
        value: S.t,
        format: ex.change.format,
        oninput: (t) => {
          S.t = t;
          refs.sliderVal.textContent = ex.change.format(t);
          if (t > 0.15) S.moved = true;
          drawScenes();
          updateOutcomeNote();
        },
        valuetext: (t) => (S.compare
          ? `${ex.change.format(t)} — A: ${ex.outcome('a', t).headline}; B: ${ex.outcome('b', t).headline}`
          : `${ex.change.format(t)} — ${ex.outcome(S.view, t).headline}`),
      }),
    ];

    refs.outcomeNote = h('p', { class: 'outcome-note' });
    out.push(refs.outcomeNote);
    refs.moveHint = h('p', { class: 'fine gate-hint', 'data-ref': 'movehint', 'aria-live': 'polite' });
    out.push(refs.moveHint);

    out.push(h('div', { class: 'viewrow' },
      h('span', { class: 'viewrow-label' }, 'viewing'),
      h('div', { class: 'segmented' + (S.compare ? ' is-disabled' : '') }, ['a', 'b'].map((p) =>
        h('button', {
          class: 'seg' + (S.view === p ? ' is-on' : ''),
          'aria-pressed': S.view === p ? 'true' : 'false',
          'data-ref': `view-${p}`,
          disabled: S.compare,
          onclick: () => { S.view = p; renderStep(`view-${p}`); },
        }, `${p.toUpperCase()} · ${ex.paths[p].short}`))),
      h('button', {
        class: 'btn ghost',
        'aria-pressed': S.compare ? 'true' : 'false',
        'data-ref': 'compare',
        onclick: () => {
          S.compare = !S.compare;
          if (S.compare) earn('spotter');
          renderStep('compare');
        },
      }, S.compare ? 'Back to one view' : 'Compare side by side')));

    refs.predChip = h('p', { class: 'pred-chip' });
    refs.predChip.hidden = true;
    out.push(refs.predChip);
    if (S.revealed) fillPredChip();

    refs.continueBtn = h('button', {
      class: 'btn primary', 'data-ref': 'continue', onclick: advance,
    }, 'Name the lesson →');
    out.push(refs.continueBtn);

    updateOutcomeNote();
    return out;
  }

  function updateOutcomeNote() {
    const o = ex.outcome(S.view, S.t);
    const key = S.compare ? `${S.view.toUpperCase()} · ${ex.paths[S.view].short} — ` : '';
    refs.outcomeNote.textContent = key + o.note;
    refs.outcomeNote.className = 'outcome-note tone-' + o.tone;
  }

  function fillPredChip() {
    const right = S.predicted === ex.predict.answer;
    refs.predChip.hidden = false;
    refs.predChip.className = 'pred-chip ' + (right ? 'is-right' : 'is-wrong');
    refs.predChip.textContent = (right
      ? 'You called it. '
      : 'Not what you predicted — good, that’s the workout. ') + (ex.predict.why || '');
    if (right && !isRedo) earn('called-it');
  }

  /* step 4 — name it, then flip it (counter-context) */
  function railTakeaway() {
    const out = [
      h('h2', { class: 'kicker', tabindex: '-1', 'data-ref': 'stephead' }, 'Name it'),
      h('p', { class: 'takeaway' }, ex.takeaway.line),
      h('p', { class: 'term-note' }, ex.takeaway.term),
      h('hr', { class: 'rule' }),
      h('h3', { class: 'flip-head' }, ex.counter.heading),
      ex.counter.job && h('div', { class: 'intent-card' },
        h('div', { class: 'intent-item' },
          h('span', { class: 'intent-k' }, 'New job'),
          h('span', { class: 'intent-v' }, ex.counter.job))),
      h('p', { class: 'prose' }, ex.counter.body),
    ].filter(Boolean);

    if (!S.counterCall) {
      // A light tap, like Predict: commit before running anything.
      out.push(
        h('p', { class: 'call-prompt' }, 'Your call — which scheme serves this part?'),
        h('div', { class: 'options' }, ['a', 'b'].map((p) =>
          h('button', {
            class: 'option',
            'aria-pressed': 'false',
            onclick: () => {
              S.counterCall = p;
              S.counterPath = p;
              renderStep();
              shieldRail();
              const slider = refs.rail.querySelector('input.slider');
              if (slider) slider.focus({ preventScroll: true });
            },
          },
            h('span', { class: 'option-key' }, p.toUpperCase()),
            h('span', { class: 'option-text' },
              h('span', { class: 'option-label' }, ex.counter.pathLabels[p]))))),
        h('p', { class: 'fine' }, 'Just a call — you’ll run both.'));
      return out;
    }

    out.push(
      h('p', { class: 'call-made' }, `Your call: ${S.counterCall.toUpperCase()} · ${ex.counter.pathLabels[S.counterCall]}`),
      h('div', { class: 'viewrow' },
        h('span', { class: 'viewrow-label' }, 'scheme'),
        h('div', { class: 'segmented' }, ['a', 'b'].map((p) =>
          h('button', {
            class: 'seg' + (S.counterPath === p ? ' is-on' : ''),
            'aria-pressed': S.counterPath === p ? 'true' : 'false',
            title: ex.counter.pathLabels[p],
            'data-ref': `cpath-${p}`,
            onclick: () => { S.counterPath = p; renderStep(`cpath-${p}`); },
          }, `${p.toUpperCase()} · ${(ex.counter.short || {})[p] || ex.paths[p].short}`)))),
      sliderBlock({
        label: ex.counter.sliderLabel,
        value: S.counterT,
        format: ex.counter.format,
        oninput: (t) => {
          S.counterT = t;
          refs.sliderVal.textContent = ex.counter.format(t);
          if (t > 0.15) S.counterMoved = true;
          drawScenes();
          updateCounterNote();
        },
        valuetext: (t) => `${ex.counter.format(t)} — ${ex.counter.outcome(S.counterPath, t).headline}`,
      }));

    refs.counterNote = h('p', { class: 'outcome-note' });
    out.push(refs.counterNote);
    refs.moveHint2 = h('p', { class: 'fine gate-hint', 'data-ref': 'movehint2', 'aria-live': 'polite' });
    out.push(refs.moveHint2);

    const called = S.counterCall === counterAnswer;
    refs.callChip = h('p', { class: 'pred-chip ' + (called ? 'is-right' : 'is-wrong') },
      called ? 'You called the flip.' : 'The flip caught you — that’s what it’s for.');
    refs.callChip.hidden = true;
    out.push(refs.callChip);

    refs.moral = h('p', { class: 'moral' }, ex.counter.moral);
    refs.moral.hidden = true;
    out.push(refs.moral);

    refs.doneBtn = h('button', { class: 'btn primary', onclick: finish },
      `Mark Exercise ${ex.num} done ✓`);
    refs.doneBtn.disabled = true;
    out.push(refs.doneBtn);

    if (ex.bridge) {
      out.push(h('aside', { class: 'bridge-card' },
        h('span', { class: 'bridge-kicker' }, 'Try the real thing'),
        h('p', { class: 'prose' }, ex.bridge.task),
        h('a', {
          class: 'btn ghost bridge-link',
          href: ex.bridge.href,
          target: '_blank',
          rel: 'noopener noreferrer',
          onclick: () => earn('into-the-cockpit'),
        }, 'Open Onshape ↗'),
        h('p', { class: 'fine' }, 'Optional — the gym taught the judgment; the real cockpit is one tab away.')));
    }

    updateCounterNote();
    return out;
  }

  function updateCounterNote() {
    const o = ex.counter.outcome(S.counterPath, S.counterT);
    refs.counterNote.textContent = o.note;
    refs.counterNote.className = 'outcome-note tone-' + o.tone;
  }

  let finishing = false;
  function finish() {
    if (finishing) return;
    finishing = true;
    delete reps[ex.id];   // a finished rep starts fresh next time
    const prog = loadProgress();
    const prev = prog[ex.id] && prog[ex.id].done ? prog[ex.id] : null;
    const again = !!prev && new Date(prev.finishedAt).toDateString() !== new Date().toDateString();
    const right = S.predicted === ex.predict.answer;
    prog[ex.id] = {
      done: true,
      predicted: prev ? prev.predicted : S.predicted,          // a redo keeps the cold guess
      predictedRight: prev ? prev.predictedRight : right,
      finishedAt: new Date().toISOString(),
    };
    saveProgress(prog);

    const quiet = { quiet: true };
    const badges = [
      ...S.earned,
      !isRedo && S.counterCall === counterAnswer && award('called-the-flip', quiet),
      award('first-rep', quiet),
      !right && award('felt-the-miss', quiet),
      again && award('second-set', quiet),
      EXERCISES.filter((e) => prog[e.id] && prog[e.id].predictedRight).length >= 3 && award('sharp-eye', quiet),
      EXERCISES.filter((e) => e.available).every((e) => prog[e.id] && prog[e.id].done) && award('full-circuit', quiet),
    ].filter(Boolean);

    justFinished = { id: ex.id, badges };
    location.hash = '#/';
  }

  rerenderCurrent = render;
  render();
}

/* ---------------------------------------------------------------- router */

function route() {
  const id = location.hash.replace(/^#\/?/, '');
  const ex = EXERCISES.find((e) => e.id === id);
  if (ex && ex.available) renderPlayer(ex);
  else renderHome();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
