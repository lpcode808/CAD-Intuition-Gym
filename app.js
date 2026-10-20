/* app.js — router, home screen, and the exercise player.
   The player runs the five-step loop every exercise shares:
   intent → predict → choose → the change lands → name it & flip it. */
'use strict';

const STORE_KEY = 'cad-gym.v1';
const appRoot = document.getElementById('app');
let sessionProgress = {};

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
    award('kilos-pounds');
    unitToggleBtn.textContent = unitToggleLabel();
    unitToggleBtn.setAttribute('aria-label', unitToggleA11yLabel());
    unitToggleBtn.setAttribute('aria-pressed', getUnit() === 'in' ? 'true' : 'false');
    rerenderCurrent();
  },
}, unitToggleLabel());
document.body.appendChild(unitToggleBtn);

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
  { id: 'cross-trainer', glyph: 'IRL', name: 'Cross-trainer', how: 'Flip a scene to the everyday layer.' },
  { id: 'kilos-pounds', glyph: '⇄', name: 'Kilos & pounds', how: 'Switch the units.' },
  { id: 'sharp-eye', glyph: '3×', name: 'Sharp eye', how: 'Call three predictions right.' },
  { id: 'second-set', glyph: '↺', name: 'Second set', how: 'Redo an exercise you already finished.' },
  { id: 'into-the-cockpit', glyph: '↗', name: 'Into the cockpit', how: 'Open Onshape from a “Try the real thing” card.' },
  { id: 'full-circuit', glyph: '★', name: 'Full circuit', how: 'Finish every exercise.' },
];
let sessionBadges = {};

function loadBadges() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BADGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : sessionBadges;
  }
  catch { return sessionBadges; }
}

function award(id) {
  const earned = loadBadges();
  const badge = BADGES.find((b) => b.id === id);
  if (!badge || earned[id]) return;
  earned[id] = new Date().toISOString();
  sessionBadges = earned;
  try { localStorage.setItem(BADGE_KEY, JSON.stringify(earned)); } catch { /* session-only */ }
  showToast(badge);
}

/* Toasts sit outside #app (like the unit pill) so a route change — finishing
   an exercise lands you on home — doesn't wipe one mid-read. */
const toastHost = h('div', { class: 'toast-host', role: 'status', 'aria-live': 'polite' });
document.body.appendChild(toastHost);

function showToast(badge) {
  const el = h('div', { class: 'toast' },
    h('span', { class: 'medal is-earned', 'aria-hidden': 'true' }, badge.glyph),
    h('span', { class: 'toast-text' },
      h('span', { class: 'toast-kicker' }, 'Badge earned'),
      h('span', { class: 'toast-name' }, badge.name),
      h('span', { class: 'toast-how' }, badge.how)));
  toastHost.append(el);
  setTimeout(() => el.classList.add('is-leaving'), 3400);
  setTimeout(() => el.remove(), 3800);
}

/* ------------------------------------------------------------- utilities */

function loadProgress() {
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
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch { /* session-only */ }
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

function renderHome() {
  document.title = 'CAD Intuition Gym';
  rerenderCurrent = renderHome;
  const prog = loadProgress();
  const anyDone = EXERCISES.some((ex) => prog[ex.id] && prog[ex.id].done);
  const availableExercises = EXERCISES.filter((ex) => ex.available);
  const allDone = availableExercises.length > 0
    && availableExercises.every((ex) => prog[ex.id] && prog[ex.id].done);
  const nextUp = availableExercises.find((ex) => !(prog[ex.id] && prog[ex.id].done));

  const rows = EXERCISES.map((ex) => {
    const done = prog[ex.id] && prog[ex.id].done;
    const num = h('span', { class: 'ex-num' }, String(ex.num).padStart(2, '0'));
    const text = h('span', { class: 'ex-row-text' },
      h('span', { class: 'ex-row-title' }, ex.title),
      h('span', { class: 'ex-row-tag' }, ex.tagline));
    if (!ex.available) {
      return h('div', { class: 'ex-row is-locked' },
        num, text, h('span', { class: 'ex-status' }, 'in authoring'));
    }
    const startLabel = ex !== nextUp ? 'start →' : anyDone ? 'next →' : 'start here →';
    return h('a', { class: 'ex-row', href: `#/${ex.id}` },
      num, text,
      h('span', { class: 'ex-status' + (done ? ' is-done' : ' is-go') },
        done ? 'done ✓' : startLabel));
  });

  appRoot.replaceChildren(
    h('main', { class: 'home' },
      h('p', { class: 'kicker' }, 'CAD Intuition Gym'),
      h('h1', {}, 'Model your intent, not your accident.'),
      h('p', { class: 'lede' },
        'A gym for the CAD decisions that don’t have a button. You can sketch and extrude — but nothing you’ve modeled has ever broken on you. Here, it will. On purpose, a few minutes per exercise.'),
      h('p', { class: 'sim-note' },
        'This is a flight simulator: there’s no CAD engine behind it, and every consequence is hand-built so the lesson lands clean. The real cockpit — Onshape — is one tab away.'),
      h('h2', { class: 'section-label' }, 'Six decisions',
        anyDone && h('span', { class: 'section-count' },
          ` · ${availableExercises.filter((ex) => prog[ex.id] && prog[ex.id].done).length} done`)),
      h('div', { class: 'ex-list' }, rows),
      locker(),
      allDone && h('section', { class: 'recap' },
        h('h2', { class: 'section-label' }, 'What you leave with'),
        h('p', { class: 'recap-lede' }, 'Every rule you just learned, next to the flip that keeps it honest. The rule was never the rule — the intent is.'),
        h('div', { class: 'recap-list' }, availableExercises.map((ex) =>
          h('div', { class: 'recap-row' },
            h('span', { class: 'ex-num' }, String(ex.num).padStart(2, '0')),
            h('div', { class: 'recap-text' },
              h('p', { class: 'recap-line' }, ex.takeaway.line),
              h('p', { class: 'recap-flip' }, ex.takeaway.flip)))))),
      h('footer', { class: 'home-foot' },
        h('span', {}, 'Progress lives in this browser and nowhere else.'),
        h('button', { class: 'linklike', onclick: resetProgress }, 'Reset progress'))));
}

function locker() {
  const earned = loadBadges();
  const count = BADGES.filter((b) => earned[b.id]).length;
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
    try { localStorage.removeItem(STORE_KEY); } catch { /* nothing stored anyway */ }
    try { localStorage.removeItem(BADGE_KEY); } catch { /* nothing stored anyway */ }
    route();
  }
}

/* ---------------------------------------------------------------- player */

function renderPlayer(ex) {
  document.title = `E${ex.num} · ${ex.title} — CAD Intuition Gym`;

  const S = {
    step: 0, maxStep: 0,
    predicted: null,      // their guess at what survives
    built: null,          // the scheme they committed to
    view: null,           // the scheme currently on screen (flippable in step 3)
    t: 0, moved: false, compare: false, revealed: false,
    counterT: 0, counterPath: ex.counter.defaultPath, counterMoved: false,
    featuresOpen: null,   // null until the learner toggles it — then it sticks
  };
  const refs = {};

  function go(i) {
    S.step = i; S.maxStep = Math.max(S.maxStep, i);
    render();
    // Keyboard users land on the new step's content, not back at the top.
    refs.rail.focus({ preventScroll: true });
  }
  function advance() { go(S.step + 1); }

  function restart() {
    Object.assign(S, {
      step: 0, maxStep: 0, predicted: null, built: null, view: null,
      t: 0, moved: false, compare: false, revealed: false,
      counterT: 0, counterPath: ex.counter.defaultPath, counterMoved: false,
    });
    render();
  }

  /* ---- shell ---- */

  function render() {
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
            h('span', { class: 'ex-title' }, `Exercise ${ex.num} — ${ex.title}`),
            h('button', { class: 'linklike', onclick: restart }, '↺ restart')),
          stepper()),
        refs.body = h('div', { class: 'ex-body' },
          featuresPanel,
          h('div', { class: 'viewport-panel' }, refs.viewport),
          h('aside', { class: 'rail-panel' }, refs.rail))));

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

  function renderStep() {
    refreshFeatures();
    renderViewport();
    refs.rail.replaceChildren(...railContent());
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
              if (v === 'everyday') award('cross-trainer');
              renderViewport();
            },
          }, label))),
      getLayer() === 'everyday'
        ? h('span', { class: 'layer-thing' }, def.thing)
        : h('span', { class: 'layer-hint' }, 'Flip to Everyday to see the real thing this part stands for.'));
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
        onclick: () => onPick(p),
      },
        h('span', { class: 'option-key' }, p.toUpperCase()),
        h('span', { class: 'option-text' },
          h('span', { class: 'option-label' }, ex.paths[p].label),
          h('span', { class: 'option-sub' }, ex.paths[p].sub)),
        guessed === p ? h('span', { class: 'guess-tag' }, 'your guess') : null)));
  }

  function sliderBlock({ label, value, format, oninput }) {
    refs.sliderVal = h('span', { class: 'slider-val' }, format(value));
    const input = h('input', {
      type: 'range', min: '0', max: '1000',
      value: String(Math.round(value * 1000)),
      class: 'slider', 'aria-label': label,
    });
    input.addEventListener('input', () => oninput(input.valueAsNumber / 1000));
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
      h('h2', { class: 'rail-head' }, ex.brief.heading),
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
    const out = [
      h('p', { class: 'kicker' }, 'Predict'),
      h('p', { class: 'prose' }, ex.predict.prompt),
      optionButtons(S.predicted, (p) => { S.predicted = p; renderStep(); focusRef('continue'); }, null),
      h('p', { class: 'fine' }, ex.predict.note),
    ];
    if (S.predicted) {
      out.push(h('button', {
        class: 'btn primary', 'data-ref': 'continue', onclick: advance,
      }, 'Lock it in →'));
    }
    return out;
  }

  /* step 2 — choose a modeling strategy */
  function railChoose() {
    const out = [
      h('p', { class: 'kicker' }, 'Choose'),
      h('p', { class: 'prose' }, ex.choose.prompt),
      optionButtons(S.built, (p) => { S.built = p; S.view = p; renderStep(); focusRef('continue'); }, S.predicted),
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
      h('p', { class: 'kicker' }, 'The change lands'),
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
          if (t > 0.15 && !S.moved) {
            S.moved = true;
            refs.continueBtn.disabled = false;
            const hint = refs.rail.querySelector('[data-ref="movehint"]');
            if (hint) hint.remove();
          }
          if (t > 0.55 && !S.revealed) { S.revealed = true; fillPredChip(); }
          drawScenes();
          updateOutcomeNote();
        },
      }),
    ];

    refs.outcomeNote = h('p', { class: 'outcome-note' });
    out.push(refs.outcomeNote);

    out.push(h('div', { class: 'viewrow' },
      h('span', { class: 'viewrow-label' }, 'viewing'),
      h('div', { class: 'segmented' + (S.compare ? ' is-disabled' : '') }, ['a', 'b'].map((p) =>
        h('button', {
          class: 'seg' + (S.view === p ? ' is-on' : ''),
          'aria-pressed': S.view === p ? 'true' : 'false',
          disabled: S.compare,
          onclick: () => { S.view = p; renderStep(); },
        }, `${p.toUpperCase()} · ${ex.paths[p].short}`))),
      h('button', {
        class: 'btn ghost',
        'aria-pressed': S.compare ? 'true' : 'false',
        onclick: () => {
          S.compare = !S.compare;
          if (S.compare) award('spotter');
          renderStep();
        },
      }, S.compare ? 'Back to one view' : 'Compare side by side')));

    refs.predChip = h('p', { class: 'pred-chip' });
    refs.predChip.hidden = true;
    out.push(refs.predChip);
    if (S.revealed) fillPredChip();

    refs.continueBtn = h('button', {
      class: 'btn primary', 'data-ref': 'continue', onclick: advance,
    }, 'Name the lesson →');
    refs.continueBtn.disabled = !S.moved;
    out.push(refs.continueBtn);
    if (!S.moved) {
      out.push(h('p', { class: 'fine', 'data-ref': 'movehint' },
        ex.change.hint || 'Drag the slider first — feel it before we name it.'));
    }

    updateOutcomeNote();
    return out;
  }

  function updateOutcomeNote() {
    const o = ex.outcome(S.view, S.t);
    refs.outcomeNote.textContent = o.note;
    refs.outcomeNote.className = 'outcome-note tone-' + o.tone;
  }

  function fillPredChip() {
    const right = S.predicted === ex.predict.answer;
    refs.predChip.hidden = false;
    refs.predChip.className = 'pred-chip ' + (right ? 'is-right' : 'is-wrong');
    refs.predChip.textContent = right
      ? 'Your prediction held. Flip to the other scheme anyway — watching it fail is half the workout.'
      : 'Not what you predicted — good. Feeling the miss is the workout. Flip between A and B and watch why.';
    if (right) award('called-it');
  }

  /* step 4 — name it, then flip it (counter-context) */
  function railTakeaway() {
    const out = [
      h('p', { class: 'kicker' }, 'Name it'),
      h('p', { class: 'takeaway' }, ex.takeaway.line),
      h('p', { class: 'term-note' }, ex.takeaway.term),
      h('hr', { class: 'rule' }),
      h('h3', { class: 'flip-head' }, ex.counter.heading),
      h('p', { class: 'prose' }, ex.counter.body),
      h('div', { class: 'viewrow' },
        h('span', { class: 'viewrow-label' }, 'scheme'),
        h('div', { class: 'segmented' }, ['a', 'b'].map((p) =>
          h('button', {
            class: 'seg' + (S.counterPath === p ? ' is-on' : ''),
            'aria-pressed': S.counterPath === p ? 'true' : 'false',
            title: ex.counter.pathLabels[p],
            onclick: () => { S.counterPath = p; renderStep(); },
          }, `${p.toUpperCase()} · ${(ex.counter.short || {})[p] || ex.paths[p].short}`)))),
      sliderBlock({
        label: ex.counter.sliderLabel,
        value: S.counterT,
        format: ex.counter.format,
        oninput: (t) => {
          S.counterT = t;
          refs.sliderVal.textContent = ex.counter.format(t);
          if (t > 0.15 && !S.counterMoved) {
            S.counterMoved = true;
            refs.moral.hidden = false;
            refs.doneBtn.disabled = false;
            const hint = refs.rail.querySelector('[data-ref="movehint2"]');
            if (hint) hint.remove();
          }
          drawScenes();
          updateCounterNote();
        },
      }),
    ];

    refs.counterNote = h('p', { class: 'outcome-note' });
    out.push(refs.counterNote);

    refs.moral = h('p', { class: 'moral' }, ex.counter.moral);
    refs.moral.hidden = !S.counterMoved;
    out.push(refs.moral);

    refs.doneBtn = h('button', { class: 'btn primary', onclick: finish },
      `Mark Exercise ${ex.num} done ✓`);
    refs.doneBtn.disabled = !S.counterMoved;
    out.push(refs.doneBtn);
    if (!S.counterMoved) {
      out.push(h('p', { class: 'fine', 'data-ref': 'movehint2' },
        ex.counter.hint || 'Run the change one more time — this part has a different job.'));
    }

    if (ex.bridge) {
      out.push(h('aside', { class: 'bridge-card' },
        h('span', { class: 'bridge-kicker' }, 'Try the real thing'),
        h('p', { class: 'prose' }, ex.bridge.task),
        h('a', {
          class: 'btn ghost bridge-link',
          href: ex.bridge.href,
          target: '_blank',
          rel: 'noopener noreferrer',
          onclick: () => award('into-the-cockpit'),
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

  function finish() {
    const prog = loadProgress();
    const again = !!(prog[ex.id] && prog[ex.id].done);
    const right = S.predicted === ex.predict.answer;
    prog[ex.id] = {
      done: true,
      predicted: S.predicted,
      predictedRight: right,
      finishedAt: new Date().toISOString(),
    };
    saveProgress(prog);

    award('first-rep');
    if (!right) award('felt-the-miss');
    if (again) award('second-set');
    if (EXERCISES.filter((e) => prog[e.id] && prog[e.id].predictedRight).length >= 3) award('sharp-eye');
    if (EXERCISES.filter((e) => e.available).every((e) => prog[e.id] && prog[e.id].done)) award('full-circuit');

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
