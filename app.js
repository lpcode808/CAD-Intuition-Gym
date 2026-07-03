/* app.js — router, home screen, and the exercise player.
   The player runs the five-step loop every exercise shares:
   intent → predict → choose → the change lands → name it & flip it. */
'use strict';

const STORE_KEY = 'cad-gym.v1';
const appRoot = document.getElementById('app');

/* ------------------------------------------------------------ unit toggle
   A single fixed control, outside #app so re-rendering the home screen or
   the player never wipes it out. Toggling re-runs whatever is on screen
   right now (without resetting exercise progress). */

let rerenderCurrent = () => {};

function unitToggleLabel() {
  return getUnit() === 'in' ? 'in' : 'mm';
}

const unitToggleBtn = h('button', {
  class: 'unit-toggle',
  title: 'Switch between millimeters and inches',
  onclick: () => {
    toggleUnit();
    unitToggleBtn.textContent = unitToggleLabel();
    rerenderCurrent();
  },
}, unitToggleLabel());
document.body.appendChild(unitToggleBtn);

const STEP_NAMES = ['Intent', 'Predict', 'Choose', 'The change', 'Flip it'];
const TONE_MARK = { good: '✓', bad: '✕', warn: '△', idle: '' };

/* ------------------------------------------------------------- utilities */

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; }
  catch { return {}; }
}
function saveProgress(p) { localStorage.setItem(STORE_KEY, JSON.stringify(p)); }

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
    const startLabel = !anyDone && ex.num === 1 ? 'start here →' : 'start →';
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
      h('h2', { class: 'section-label' }, 'Four decisions'),
      h('div', { class: 'ex-list' }, rows),
      h('footer', { class: 'home-foot' },
        h('span', {}, 'Progress lives in this browser and nowhere else.'),
        h('button', { class: 'linklike', onclick: resetProgress }, 'Reset progress'))));
}

function resetProgress() {
  if (confirm('Clear your progress on this device?')) {
    localStorage.removeItem(STORE_KEY);
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
  };
  const refs = {};

  function go(i) { S.step = i; S.maxStep = Math.max(S.maxStep, i); render(); }
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
    refs.rail = h('div', { class: 'rail' });

    const featuresPanel = h('details', { class: 'features-panel' },
      h('summary', {},
        h('span', { class: 'panel-kicker' }, 'Features'),
        h('span', { class: 'panel-sub' }, 'Part Studio')),
      refs.features);
    featuresPanel.open = window.matchMedia('(min-width: 981px)').matches;

    appRoot.replaceChildren(
      h('div', { class: 'player' },
        h('header', { class: 'ex-header' },
          h('div', { class: 'ex-header-row' },
            h('a', { class: 'backlink', href: '#/' }, '← All exercises'),
            h('span', { class: 'ex-title' }, `Exercise ${ex.num} — ${ex.title}`),
            h('button', { class: 'linklike', onclick: restart }, '↺ restart')),
          stepper()),
        h('div', { class: 'ex-body' },
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
        refs.panes[p] = { stage, chip };
      }
      refs.viewport.replaceChildren(wrap);
    } else {
      const { svg, stage } = makeSceneSvg();
      const chip = h('div', { class: 'outcome-chip' });
      refs.single = { stage, chip };
      refs.viewport.replaceChildren(svg, chip);
    }
    drawScenes();
  }

  function setChip(chip, o) {
    if (!o) { chip.className = 'outcome-chip'; chip.textContent = ''; return; }
    chip.className = `outcome-chip is-on tone-${o.tone}`;
    const mark = TONE_MARK[o.tone];
    chip.textContent = (mark ? mark + ' ' : '') + o.headline;
  }

  function drawScenes() {
    if (S.step === 4) {
      const { stage, chip } = refs.single;
      clearNode(stage);
      ex.counter.scene(stage, { t: S.counterT, path: S.counterPath });
      setChip(chip, ex.counter.outcome(S.counterPath, S.counterT));
    } else if (S.step === 3 && S.compare) {
      for (const p of ['a', 'b']) {
        const { stage, chip } = refs.panes[p];
        clearNode(stage);
        ex.scene(stage, { t: S.t, path: p });
        setChip(chip, ex.outcome(p, S.t));
      }
    } else {
      const { stage, chip } = refs.single;
      clearNode(stage);
      ex.scene(stage, {
        t: S.step === 3 ? S.t : 0,
        path: S.step >= 2 ? S.view : null,
      });
      setChip(chip, S.step === 3 ? ex.outcome(S.view, S.t) : null);
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
        onclick: () => { S.compare = !S.compare; renderStep(); },
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
            onclick: () => { S.counterPath = p; renderStep(); },
          }, `${p.toUpperCase()} · ${ex.paths[p].short}`)))),
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
    prog[ex.id] = {
      done: true,
      predicted: S.predicted,
      predictedRight: S.predicted === ex.predict.answer,
      finishedAt: new Date().toISOString(),
    };
    saveProgress(prog);
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
