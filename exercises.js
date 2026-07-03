/* exercises.js — the content objects. Each exercise carries the full loop:
   intent brief → predict → choose → change request (pre-authored outcomes)
   → takeaway → counter-context. Hard rule from the PRD: no exercise ships
   without its counter-context. */
'use strict';

/* ---------------------------------------------------------------- E1 scenes
   A plate whose width changes. The hole's anchoring scheme is the decision.
   Main scene: the plate grows about its own center (the part changed shape;
   did your hole keep the promise?). Counter scene: the same plate hung on a
   wall, growing rightward, where the hole must stay on a bolt line 60 mm
   from that wall — same two schemes, opposite winner. */

function e1MainScene(stage, { t, path }) {
  const cx = 260, cy = 160;
  const W = lerp(120, 200, t);           // mm
  const Wpx = W * MM, Hpx = 60 * MM;
  const left = cx - Wpx / 2, right = cx + Wpx / 2;
  const top = cy - Hpx / 2, bot = cy + Hpx / 2;

  if (path === null) {
    // Before any scheme is chosen: show where the width is headed.
    const gW = 200 * MM;
    svgEl('rect', { x: cx - gW / 2, y: top, width: gW, height: Hpx, class: 'ghost' }, stage);
    sceneLabel(stage, cx + gW / 2, top - 10, 'where the width is headed', 'ghost-label', 'end');
  }

  svgEl('rect', { x: left, y: top, width: Wpx, height: Hpx, class: 'part' }, stage);

  const hx = path === 'a' ? left + 60 * MM : cx;
  const offMm = Math.abs(hx - cx) / MM;
  const bad = offMm > 0.5;

  intentMark(stage, cx, cy, 'intent: dead center');
  svgEl('circle', {
    cx: hx, cy: cy, r: 5 * MM,
    class: 'hole' + (path ? (bad ? ' is-bad' : ' is-good') : ''),
  }, stage);

  if (path === 'a') {
    dimH(stage, {
      x1: left, x2: hx, y: top - 22, ext1: top, ext2: cy - 5 * MM,
      label: '60 mm', cls: 'anchor',
    });
  } else if (path === 'b') {
    centerlineV(stage, cx, top - 34, bot + 18);
    dimH(stage, { x1: left, x2: cx, y: top - 22, ext1: top, label: '=', cls: 'anchor' });
    dimH(stage, { x1: cx, x2: right, y: top - 22, ext2: top, label: '=', cls: 'anchor' });
  }

  dimH(stage, {
    x1: left, x2: right, y: bot + 30, ext1: bot, ext2: bot,
    label: `${Math.round(W)} mm`, cls: 'live',
  });

  if (path && offMm >= 3) {
    dimH(stage, {
      x1: hx, x2: cx, y: cy - 5 * MM - 18, ext1: cy - 5 * MM, ext2: cy - 12,
      label: `${offMm.toFixed(0)} mm off`, cls: 'bad',
    });
  }
}

function e1CounterScene(stage, { t, path }) {
  const wallX = 96, cy = 160;
  const W = lerp(120, 200, t);
  const Wpx = W * MM, Hpx = 60 * MM;
  const top = cy - Hpx / 2, bot = cy + Hpx / 2;
  const right = wallX + Wpx;

  // The wall (and the anchor bolt already set in it, 60 mm over).
  svgEl('rect', { x: wallX - 30, y: 50, width: 30, height: 200, fill: 'url(#hatch)', class: 'wall' }, stage);
  svgEl('line', { x1: wallX, y1: 50, x2: wallX, y2: 250, class: 'wall-face' }, stage);
  sceneLabel(stage, wallX - 15, 42, 'wall', 'muted');

  svgEl('rect', { x: wallX, y: top, width: Wpx, height: Hpx, class: 'part' }, stage);

  const intentX = wallX + 60 * MM;               // the bolt line: fixed, forever
  const hx = path === 'b' ? wallX + Wpx / 2 : intentX;
  const offMm = Math.abs(hx - intentX) / MM;
  const bad = offMm > 0.5;

  centerlineV(stage, intentX, 76, cy - 34, 'bolt-line');
  sceneLabel(stage, intentX, 70, 'bolt line', 'muted');
  intentMark(stage, intentX, cy, 'intent: on the bolt');

  svgEl('circle', {
    cx: hx, cy: cy, r: 5 * MM,
    class: 'hole' + (bad ? ' is-bad' : ' is-good'),
  }, stage);

  if (path === 'a') {
    dimH(stage, {
      x1: wallX, x2: hx, y: top - 22, ext1: top, ext2: cy - 5 * MM,
      label: '60 mm', cls: 'anchor',
    });
  } else {
    const mid = wallX + Wpx / 2;
    centerlineV(stage, mid, top - 34, bot + 18);
    dimH(stage, { x1: wallX, x2: mid, y: top - 22, ext1: top, label: '=', cls: 'anchor' });
    dimH(stage, { x1: mid, x2: right, y: top - 22, ext2: top, label: '=', cls: 'anchor' });
  }

  dimH(stage, {
    x1: wallX, x2: right, y: bot + 30, ext1: bot, ext2: bot,
    label: `${Math.round(W)} mm`, cls: 'live',
  });

  if (offMm >= 3) {
    dimH(stage, {
      x1: intentX, x2: hx, y: cy - 5 * MM - 18, ext1: cy - 12, ext2: cy - 5 * MM,
      label: `${offMm.toFixed(0)} mm off the bolt`, cls: 'bad',
    });
  }
}

/* ---------------------------------------------------------------- exercises */

const EXERCISES = [
  {
    id: 'e1',
    num: 1,
    available: true,
    title: 'Anchor to intent',
    tagline: 'not to whatever edge is closest',
    principle: 'Anchor to a stable reference, not a convenient edge.',

    brief: {
      heading: 'A plate, a hole, one promise',
      body: 'This is a mounting plate. A sensor bolts through that one hole, and everything downstream assumes the hole sits dead center.',
      intent: 'Keep the hole at the exact center of the plate.',
      change: 'The plate’s width. It’s 120 mm today. The client is still deciding — the dashed outline is where it’s headed.',
    },

    predict: {
      prompt: 'There are two reasonable-looking ways to pin that hole down. The plate is about to get wider. Which one keeps the hole centered?',
      note: 'Just a guess — you’ll test both in a minute.',
      answer: 'b',
    },

    choose: {
      prompt: 'Now build it. Pick either scheme — including the one you suspect fails. You’ll get to flip between them and watch.',
    },

    paths: {
      a: {
        label: 'Measure 60 mm from the left edge',
        sub: '60 is half of 120, so it’s perfectly centered today.',
        short: 'edge-anchored',
        kind: 'accident',
      },
      b: {
        label: 'Tie it to the plate’s midline',
        sub: 'No number at all. Just: stay in the middle, whatever happens.',
        short: 'midline-tied',
        kind: 'intent',
      },
    },

    change: {
      request: '“We’re going bigger — take the plate out toward 200 mm. The sensor still needs to be dead center.”',
      sliderLabel: 'Plate width',
      format: (t) => `${Math.round(lerp(120, 200, t))} mm`,
    },

    scene: e1MainScene,

    outcome(path, t) {
      const off = Math.round(40 * t);
      if (t < 0.02) {
        return {
          tone: 'idle',
          headline: 'width unchanged so far',
          note: 'Drag the width and play the change request through your scheme.',
        };
      }
      if (path === 'a') {
        if (off < 6) {
          return {
            tone: 'warn',
            headline: `hole is ${off} mm off center`,
            note: 'Only a hair off so far. Keep going.',
          };
        }
        return {
          tone: 'bad',
          headline: `hole is ${off} mm off center`,
          note: 'The 60 mm dimension is doing exactly what you said — not what you meant. It keeps the hole loyal to an edge that stopped mattering.',
        };
      }
      return {
        tone: 'good',
        headline: 'dead center, at every width',
        note: 'The midline is the intent, so the hole never has to be told twice. Change the plate all you want.',
      };
    },

    features(path) {
      return [
        { label: 'Origin', sub: 'the one reference that never moves' },
        { label: 'Sketch 1 — plate outline', sub: 'its width is the thing that will change' },
        path === null
          ? { label: 'Sketch 2 — sensor hole', sub: 'not anchored yet. that’s your call', active: true }
          : path === 'a'
            ? { label: 'Sketch 2 — sensor hole', sub: '60 mm off the left edge · a linear dimension', active: true }
            : { label: 'Sketch 2 — sensor hole', sub: 'held to the midline · a symmetric constraint', active: true },
        { label: 'Extrude 1', sub: '6 mm thick' },
      ];
    },

    takeaway: {
      line: 'Dimension to the thing that expresses your intent — here, the center — not to whatever edge is closest.',
      term: 'Plain words: “tie it to the midline.” Onshape’s word for it: a symmetric constraint. (A midpoint constraint gets you there too.)',
    },

    counter: {
      heading: 'Now flip it',
      body: 'Same plate, same two schemes — different job. This one hangs on a wall, and its hole must land on an anchor bolt already set in that wall, 60 mm over. The client still wants the plate wider.',
      defaultPath: 'b',
      scene: e1CounterScene,
      sliderLabel: 'Plate width',
      format: (t) => `${Math.round(lerp(120, 200, t))} mm`,
      pathLabels: {
        a: 'Measure 60 mm from the wall edge',
        b: 'Tie it to the plate’s midline',
      },
      outcome(path, t) {
        const off = Math.round(40 * t);
        if (t < 0.02) {
          return {
            tone: 'idle',
            headline: 'width unchanged so far',
            note: 'Same change request as before. This time, watch the bolt line.',
          };
        }
        if (path === 'b') {
          if (off < 6) {
            return { tone: 'warn', headline: `hole is ${off} mm off the bolt`, note: 'Drifting already.' };
          }
          return {
            tone: 'bad',
            headline: `hole is ${off} mm off the bolt`,
            note: '“Stay centered” was never this part’s job. The midline moved; the bolt didn’t.',
          };
        }
        return {
          tone: 'good',
          headline: 'still on the bolt line',
          note: '60 mm from the wall, at every width. Here, the edge is the intent.',
        };
      },
      features(path) {
        return [
          { label: 'Origin', sub: 'the one reference that never moves' },
          { label: 'Sketch 1 — plate outline', sub: 'left edge sits on the wall' },
          path === 'a'
            ? { label: 'Sketch 2 — bolt hole', sub: '60 mm off the wall edge · a linear dimension', active: true }
            : { label: 'Sketch 2 — bolt hole', sub: 'held to the midline · a symmetric constraint', active: true },
          { label: 'Extrude 1', sub: '6 mm thick' },
        ];
      },
      moral: 'Edge-anchoring — the “accident” from a minute ago — is exactly right here, because the intent flipped. The rule was never “edges are bad.” It’s: dimension from the thing your intent points at. Sometimes that’s an edge.',
    },
  },

  /* E2–E4 are authored after the E1 feel-check (build brief, human checkpoint 2). */
  {
    id: 'e2',
    num: 2,
    available: false,
    title: 'One source of truth',
    tagline: 'mirror it, don’t maintain twins',
    principle: 'Mirror from one source, don’t keep two copies.',
  },
  {
    id: 'e3',
    num: 3,
    available: false,
    title: 'Pin it down',
    tagline: 'looking right isn’t being right',
    principle: 'Fully define, so nothing drifts on you.',
  },
  {
    id: 'e4',
    num: 4,
    available: false,
    title: 'Link what belongs together',
    tagline: 'a relationship beats a hardcoded number',
    principle: 'Relate features to each other, don’t hardcode independent numbers.',
  },
];
