/* exercises.js — the content objects. Each exercise carries the full loop:
   intent brief → predict → choose → change request (pre-authored outcomes)
   → takeaway → counter-context. Hard rule from the PRD: no exercise ships
   without its counter-context.

   AUTHORING CONTRACT — unit-bearing copy:
   These objects are built once at script load, but the mm/inch toggle can
   flip at any time. Any property whose TEXT embeds a converted length —
   anything calling fmtLen() in a template literal — must be a getter:

       get sub() { return `It sits ${fmtLen(60)} from the edge.`; },   // ✓
       sub: `It sits ${fmtLen(60)} from the edge.`,                    // ✗ freezes

   A plain string bakes in whichever unit was active at page load and never
   updates — no error, just silent staleness next to converted siblings.
   Text produced inside functions the player calls fresh per render
   (outcome(), features(), the scene functions) is naturally reactive and
   needs no getter. `qa/qa-check.mjs` audits this mechanically — run it
   after touching copy. */
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
      label: fmtLen(60), cls: 'anchor',
    });
  } else if (path === 'b') {
    centerlineV(stage, cx, top - 34, bot + 18);
    dimH(stage, { x1: left, x2: cx, y: top - 22, ext1: top, label: '=', cls: 'anchor' });
    dimH(stage, { x1: cx, x2: right, y: top - 22, ext2: top, label: '=', cls: 'anchor' });
  }

  dimH(stage, {
    x1: left, x2: right, y: bot + 30, ext1: bot, ext2: bot,
    label: fmtLen(W), cls: 'live',
  });

  if (path && offMm >= 3) {
    dimH(stage, {
      x1: hx, x2: cx, y: cy - 5 * MM - 18, ext1: cy - 5 * MM, ext2: cy - 12,
      label: `${fmtLen(offMm)} off`, cls: 'bad',
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
  const hatchId = stage.ownerSVGElement.querySelector('[data-pattern="hatch"]').id;
  svgEl('rect', { x: wallX - 30, y: 50, width: 30, height: 200, fill: `url(#${hatchId})`, class: 'wall' }, stage);
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
      label: fmtLen(60), cls: 'anchor',
    });
  } else {
    const mid = wallX + Wpx / 2;
    centerlineV(stage, mid, top - 34, bot + 18);
    dimH(stage, { x1: wallX, x2: mid, y: top - 22, ext1: top, label: '=', cls: 'anchor' });
    dimH(stage, { x1: mid, x2: right, y: top - 22, ext2: top, label: '=', cls: 'anchor' });
  }

  dimH(stage, {
    x1: wallX, x2: right, y: bot + 30, ext1: bot, ext2: bot,
    label: fmtLen(W), cls: 'live',
  });

  if (offMm >= 3) {
    dimH(stage, {
      x1: intentX, x2: hx, y: cy - 5 * MM - 18, ext1: cy - 12, ext2: cy - 5 * MM,
      label: `${fmtLen(offMm)} off the bolt`, cls: 'bad',
    });
  }
}

/* ---------------------------------------------------------------- E2 scenes
   A bracket with two mounting holes that must stay symmetric while their
   spacing changes. Main scene: independent holes mean two dimensions to
   remember — the demo plays the classic miss, where you edit one and forget
   its twin. Counter scene: the same plate, but the two holes have two
   different jobs, and mirroring welds them together exactly when they need
   to move apart. */

function e2MainScene(stage, { t, path }) {
  const cx = 260, cy = 160;
  const Wpx = 160 * MM, Hpx = 56 * MM;
  const left = cx - Wpx / 2, right = cx + Wpx / 2;
  const top = cy - Hpx / 2, bot = cy + Hpx / 2;
  const r = 5 * MM;

  const S = lerp(80, 140, t);                    // hole spacing, mm
  const targetL = cx - (S / 2) * MM;
  const targetR = cx + (S / 2) * MM;

  if (path === null) {
    // Before any scheme is chosen: show where the spacing is headed.
    svgEl('circle', { cx: cx - 70 * MM, cy, r, class: 'ghost' }, stage);
    svgEl('circle', { cx: cx + 70 * MM, cy, r, class: 'ghost' }, stage);
    sceneLabel(stage, cx + 70 * MM + 10, cy - r - 12, 'where the spacing is headed', 'ghost-label', 'end');
  }

  svgEl('rect', { x: left, y: top, width: Wpx, height: Hpx, class: 'part' }, stage);

  const hxL = targetL;                           // the hole you remembered to edit
  const hxR = path === 'b' ? cx + 40 * MM : targetR;   // …and the one you forgot
  const offMm = (targetR - hxR) / MM;
  const badR = offMm > 0.5;

  intentMark(stage, targetL, cy);
  intentMark(stage, targetR, cy, 'intent: a symmetric pair');

  svgEl('circle', { cx: hxL, cy, r, class: 'hole' + (path ? ' is-good' : '') }, stage);
  svgEl('circle', { cx: hxR, cy, r, class: 'hole' + (path ? (badR ? ' is-bad' : ' is-good') : '') }, stage);

  if (path === 'b') {
    centerlineV(stage, cx, top - 30, bot + 14);
    dimH(stage, { x1: hxL, x2: cx, y: top - 22, ext1: cy - r, label: fmtLen(S / 2), cls: 'anchor' });
    dimH(stage, { x1: cx, x2: hxR, y: top - 22, ext2: cy - r, label: fmtLen(40), cls: badR ? 'bad' : 'anchor' });
  } else if (path === 'a') {
    centerlineV(stage, cx, top - 30, bot + 14);
    dimH(stage, { x1: hxL, x2: hxR, y: top - 22, ext1: cy - r, ext2: cy - r, label: fmtLen(S), cls: 'anchor' });
    sceneLabel(stage, hxR, cy + r + 14, 'mirrored copy', 'muted');
  }

  dimH(stage, { x1: left, x2: right, y: bot + 28, ext1: bot, ext2: bot, label: fmtLen(160) });

  if (path === 'b' && offMm >= 3) {
    dimH(stage, {
      x1: hxR, x2: targetR, y: cy - r - 16, ext1: cy - r, ext2: cy - 12,
      label: `${fmtLen(offMm)} short`, cls: 'bad',
    });
  }
}

function e2CounterScene(stage, { t, path }) {
  const cx = 260, cy = 160;
  const Wpx = 160 * MM, Hpx = 56 * MM;
  const left = cx - Wpx / 2, right = cx + Wpx / 2;
  const top = cy - Hpx / 2, bot = cy + Hpx / 2;
  const r = 5 * MM;

  const R = lerp(40, 70, t);                     // connector target, mm right of center
  const sensorX = cx - 40 * MM;                  // the sensor pad: glued down, forever
  const connX = cx + R * MM;
  const hxL = path === 'a' ? cx - R * MM : sensorX;
  const offMm = (sensorX - hxL) / MM;
  const badL = offMm > 0.5;

  svgEl('rect', { x: left, y: top, width: Wpx, height: Hpx, class: 'part' }, stage);

  intentMark(stage, sensorX, cy, 'intent: stay on the sensor');
  intentMark(stage, connX, cy, 'intent: follow the connector', -30);

  svgEl('circle', { cx: hxL, cy, r, class: 'hole' + (badL ? ' is-bad' : ' is-good') }, stage);
  svgEl('circle', { cx: connX, cy, r, class: 'hole is-good' }, stage);

  centerlineV(stage, cx, top - 30, bot + 14);
  if (path === 'b') {
    dimH(stage, { x1: sensorX, x2: cx, y: top - 22, ext1: cy - r, label: fmtLen(40), cls: 'anchor' });
    dimH(stage, { x1: cx, x2: connX, y: top - 22, ext2: cy - r, label: fmtLen(R), cls: 'anchor' });
  } else {
    dimH(stage, { x1: hxL, x2: connX, y: top - 22, ext1: cy - r, ext2: cy - r, label: fmtLen(2 * R), cls: 'anchor' });
    sceneLabel(stage, hxL, cy + r + 14, 'mirrored copy', 'muted');
  }

  dimH(stage, { x1: left, x2: right, y: bot + 28, ext1: bot, ext2: bot, label: fmtLen(160) });

  if (offMm >= 3) {
    dimH(stage, {
      x1: hxL, x2: sensorX, y: cy - r - 16, ext1: cy - r, ext2: cy - 12,
      label: `${fmtLen(offMm)} off the sensor`, cls: 'bad',
    });
  }
}

/* ---------------------------------------------------------------- E3 scenes
   A tab profile that looks finished either way. Main scene: a pull lands on
   the apex; the fully defined sketch has no slack to give, the loose one
   squirms away from the drawing. Counter scene: a ten-minute-old concept
   sketch, where the same lock that saved you now fights every proportion
   you want to try. */

/* A tug on a sketch point: line + barbs + label, aimed along (ux, uy). */
function pullArrow(stage, x, y, t, ux = 0.794, uy = -0.607) {
  if (t < 0.02) return;
  const len = lerp(12, 42, t);
  const tx = x + ux * len, ty = y + uy * len;
  const g = svgEl('g', { class: 'pull' }, stage);
  svgEl('line', { x1: x, y1: y, x2: tx, y2: ty, class: 'pull-line' }, g);
  const bx = -ux, by = -uy, bl = 8;
  for (const a of [0.5, -0.5]) {
    const rx = bx * Math.cos(a) - by * Math.sin(a);
    const ry = bx * Math.sin(a) + by * Math.cos(a);
    svgEl('line', { x1: tx, y1: ty, x2: tx + rx * bl, y2: ty + ry * bl, class: 'pull-line' }, g);
  }
  sceneLabel(g, tx + ux * 8 + 4, ty + uy * 8, 'pull', 'muted', ux >= 0 ? 'start' : 'end');
}

function e3MainScene(stage, { t, path }) {
  const A = [172, 225], B = [348, 225];
  const C0 = [348, 153], D0 = [260, 105], E0 = [172, 153];
  const w = path === 'b' ? t : 0;                // only the loose sketch gives way
  const C = [C0[0] + 12 * w, C0[1] + 10 * w];
  const D = [D0[0] + 34 * w, D0[1] - 26 * w];
  const off = Math.round(27 * w);

  const outline = (p1, p2, p3, p4, p5) => `M ${p1} L ${p2} L ${p3} L ${p4} L ${p5} Z`;

  if (path === 'b' && t > 0.02) {
    svgEl('path', { d: outline(A, B, C0, D0, E0), class: 'ghost' }, stage);
    sceneLabel(stage, 354, 148, 'the drawing', 'ghost-label', 'start');
  }

  svgEl('path', { d: outline(A, B, C, D, E0), class: 'part' + (path === 'a' ? '' : ' is-loose') }, stage);

  intentMark(stage, D0[0], D0[1], 'intent: hold this shape');

  if (path === 'a') {
    centerlineV(stage, 260, 92, 126);
    sceneLabel(stage, 260, 86, 'apex centered', 'muted');
    dimH(stage, { x1: 172, x2: 348, y: 255, ext1: 225, ext2: 225, label: fmtLen(110), cls: 'anchor' });
    dimV(stage, { y1: 153, y2: 225, x: 378, ext1: 348, ext2: 348, label: fmtLen(45), cls: 'anchor' });
    dimV(stage, { y1: 105, y2: 225, x: 148, ext1: 260, ext2: 172, label: fmtLen(75), cls: 'anchor' });
  }

  pullArrow(stage, D[0], D[1], path ? t : 0);

  if (path === 'b' && off >= 3) {
    svgEl('line', { x1: D0[0], y1: D0[1], x2: D[0], y2: D[1], class: 'offline' }, stage);
    sceneLabel(stage, (D0[0] + D[0]) / 2 + 14, (D0[1] + D[1]) / 2 + 4, `${fmtLen(off)} adrift`, 'bad', 'start');
  }
}

function e3CounterScene(stage, { t, path }) {
  // Two hand-authored proportion variants of a rough bracket profile.
  const s0 = [[204, 235], [316, 235], [316, 203], [244, 203], [244, 115], [204, 115]];
  const s1 = [[164, 235], [356, 235], [356, 191], [244, 191], [244, 159], [164, 159]];
  const k = path === 'b' ? t : 0;                // the locked sketch won't explore
  const pts = s0.map((p, i) => [lerp(p[0], s1[i][0], k), lerp(p[1], s1[i][1], k)]);
  const d = 'M ' + pts.map((p) => p.join(',')).join(' L ') + ' Z';

  svgEl('path', { d, class: 'part' + (path === 'a' ? '' : ' is-loose') }, stage);

  if (path === 'a') {
    sceneLabel(stage, 260, 86, 'fully defined — it will not be argued with', 'muted');
    dimH(stage, { x1: 204, x2: 316, y: 259, ext1: 235, ext2: 235, label: fmtLen(70), cls: 'anchor' });
    dimV(stage, { y1: 115, y2: 235, x: 176, ext1: 204, ext2: 204, label: fmtLen(75), cls: 'anchor' });
    dimH(stage, { x1: 204, x2: 244, y: 97, ext1: 115, ext2: 115, label: fmtLen(25), cls: 'anchor' });
    dimV(stage, { y1: 203, y2: 235, x: 344, ext1: 316, ext2: 316, label: fmtLen(20), cls: 'anchor' });
    pullArrow(stage, 204, 115, t, -0.55, -0.835);
  } else {
    sceneLabel(stage, 260, 86, 'rough concept — proportions still on trial', 'muted');
  }
}

/* ---------------------------------------------------------------- E4 scenes
   A lid that owes the box 2 mm of overhang. Main scene: the box grows; the
   typed lid stops fitting, the linked lid tracks. Counter scene: a panel
   hole for a standard ⌀20 switch, where linking passes along a change the
   standard never asked for. */

function e4MainScene(stage, { t, path }) {
  const cx = 260;
  const B = lerp(100, 160, t);                   // box outer width, mm
  const Bpx = B * MM;
  const boxL = cx - Bpx / 2, boxR = cx + Bpx / 2;
  const boxTop = 142, boxBot = 230, wall = 8 * MM;
  const innerBot = boxBot - wall;

  if (path === null) {
    svgEl('rect', { x: cx - 80 * MM, y: boxTop, width: 160 * MM, height: boxBot - boxTop, class: 'ghost' }, stage);
    sceneLabel(stage, cx + 80 * MM, 120, 'where the box is headed', 'ghost-label', 'end');
  }

  // Open-topped box, drawn as a U cross-section.
  svgEl('path', {
    d: `M ${boxL} ${boxTop} L ${boxL} ${boxBot} L ${boxR} ${boxBot} L ${boxR} ${boxTop} ` +
       `L ${boxR - wall} ${boxTop} L ${boxR - wall} ${innerBot} L ${boxL + wall} ${innerBot} L ${boxL + wall} ${boxTop} Z`,
    class: 'part',
  }, stage);
  sceneLabel(stage, cx, boxBot - 4.5, 'box', 'muted');

  const Lmm = path === 'b' ? B + 4 : 104;        // the lid: linked, or frozen at day one
  const Lpx = Lmm * MM;
  const lidL = cx - Lpx / 2, lidR = cx + Lpx / 2;
  const lidTop = 126;

  svgEl('rect', { x: lidL, y: lidTop, width: Lpx, height: 14, class: 'part alt' }, stage);
  sceneLabel(stage, lidL - 8, 136, 'lid', 'muted', 'end');

  const tickL = cx - (B / 2 + 2) * MM, tickR = cx + (B / 2 + 2) * MM;
  svgEl('line', { x1: tickL, y1: 118, x2: tickL, y2: 148, class: 'intent-line' }, stage);
  svgEl('line', { x1: tickR, y1: 118, x2: tickR, y2: 148, class: 'intent-line' }, stage);
  svgEl('text', { x: tickL + 6, y: 112, class: 'intent-label', 'text-anchor': 'start', text: `intent: ${fmtLen(2)} past the box` }, stage);

  dimH(stage, {
    x1: lidL, x2: lidR, y: 104, ext1: lidTop, ext2: lidTop,
    label: path === 'b' ? `= box width + ${fmtLen(4)}` : path === 'a' ? fmtLen(104) : `? ${getUnit()}`,
    cls: path ? 'anchor' : '',
  });
  dimH(stage, { x1: boxL, x2: boxR, y: boxBot + 26, ext1: boxBot, ext2: boxBot, label: fmtLen(B), cls: 'live' });

  if (path === 'a') {
    const expPx = boxR - lidR;                   // box sticking out past the lid, per side
    if (expPx > 1) {
      if (lidR < boxR - wall) {
        // The cavity itself is uncovered — the lid has lost its one job.
        svgEl('rect', { x: lidR, y: 136, width: boxR - wall - lidR, height: 12, class: 'gap-bad' }, stage);
        svgEl('rect', { x: boxL + wall, y: 136, width: lidL - (boxL + wall), height: 12, class: 'gap-bad' }, stage);
      }
      dimH(stage, {
        x1: lidR, x2: boxR, y: 118, ext1: lidTop, ext2: boxTop,
        label: `${fmtLen(expPx / MM)} short`, cls: 'bad',
      });
    }
  } else if (path === 'b') {
    dimH(stage, { x1: boxR, x2: lidR, y: 118, ext1: boxTop, ext2: lidTop, label: fmtLen(2), cls: 'anchor' });
  }
}

function e4CounterScene(stage, { t, path }) {
  const cx = 260, cy = 168;
  const P = lerp(80, 160, t);                    // panel width, mm
  const Ppx = P * MM;
  const pTop = 106, pBot = 238;
  const dHole = path === 'b' ? P / 4 : 20;       // linked scales; typed holds
  const rH = (dHole / 2) * MM;
  const rS = 10 * MM;                            // the switch: ⌀20, off a shelf
  const oversize = dHole - 20;
  const bad = oversize > 0.5;

  svgEl('rect', { x: cx - Ppx / 2, y: pTop, width: Ppx, height: pBot - pTop, class: 'part' }, stage);

  svgEl('circle', { cx, cy, r: rH, class: 'hole' + (bad ? ' is-bad' : ' is-good') }, stage);
  svgEl('circle', { cx, cy, r: rS, class: 'switch-part' }, stage);
  svgEl('line', { x1: cx - 7, y1: cy, x2: cx + 7, y2: cy, class: 'switch-mark' }, stage);
  svgEl('line', { x1: cx, y1: cy - 7, x2: cx, y2: cy + 7, class: 'switch-mark' }, stage);

  sceneLabel(stage, cx, 98, `a standard ⌀${fmtLen(20)} switch must drop in here`, 'muted');
  svgEl('circle', { cx, cy, r: rS + 3, class: 'intent-ring' }, stage);
  svgEl('text', { x: cx, y: pBot - 8, class: 'intent-label', 'text-anchor': 'middle', text: `intent: fit the switch — ⌀${fmtLen(20)}, forever` }, stage);

  sceneLabel(stage, cx, cy + rH + 18,
    path === 'b' ? `⌀${fmtLen(dHole)} = panel width ÷ 4` : `⌀${fmtLen(20)} — typed in`,
    bad ? 'bad' : 'accent');

  if (oversize >= 4) {
    dimH(stage, { x1: cx + rS, x2: cx + rH, y: cy, label: `${fmtLen(oversize / 2)} gap`, cls: 'bad' });
  }

  dimH(stage, { x1: cx - Ppx / 2, x2: cx + Ppx / 2, y: pBot + 26, ext1: pBot, ext2: pBot, label: fmtLen(P), cls: 'live' });
}

/* ---------------------------------------------------------------- E5 scenes
   A plate whose outline is settled but whose hole pattern keeps changing.
   The decision is structural: where in the tree does the hole pattern live?
   Main scene: the rework lands — in one crowded sketch the outline catches
   a stray edit; as its own feature, the outline is never even in the room.
   Counter scene: a one-off bracket whose notch IS the silhouette — filing
   it as a separate feature lets the part disagree with itself. */

function e5MainScene(stage, { t, path }) {
  const cx = 340, cy = 163;
  const Wpx = 130 * MM, Hpx = 70 * MM;
  const left = cx - Wpx / 2, right = cx + Wpx / 2;
  const top = cy - Hpx / 2, bot = cy + Hpx / 2;
  const r = 4 * MM;
  const gouge = path === 'a' ? 12 * t : 0;       // mm bitten out of the right edge
  const gpx = gouge * MM;

  const rows = path === 'a'
    ? [{ label: 'Sketch 1 · plate', state: 'active' }, { label: 'Extrude 1' }]
    : path === 'b'
      ? [{ label: 'Sketch 1 · outline' }, { label: 'Extrude 1' },
         { label: 'Sketch 2 · holes', state: 'active' }, { label: 'Extrude 2 · cut' }]
      : [{ label: 'Sketch 1 · outline' }, { label: 'Extrude 1' }];
  const anchors = featureTree(stage, 14, 30, rows);
  if (path === null) sceneLabel(stage, 14, 92, '+ four holes — where?', 'muted', 'start');

  // The plate, with the path-a bite taken out of its right edge.
  svgEl('path', {
    d: `M ${left} ${top} L ${right} ${top} L ${right} ${top + 28} L ${right - gpx} ${cy} ` +
       `L ${right} ${bot - 28} L ${right} ${bot} L ${left} ${bot} Z`,
    class: 'part',
  }, stage);

  // Where the outline is supposed to be — the promise, visible when broken.
  svgEl('rect', { x: left, y: top, width: Wpx, height: Hpx, class: 'intent-outline' }, stage);
  svgEl('text', {
    x: cx, y: bot + 26, class: 'intent-label', 'text-anchor': 'middle',
    text: 'intent: the outline is settled — it never moves',
  }, stage);

  // Four holes reworking into two: two travel to the new pattern, two fade out.
  const k1 = [lerp(cx - 30 * MM, cx - 45 * MM, t), lerp(cy - 16 * MM, cy, t)];
  const k2 = [lerp(cx + 30 * MM, cx + 45 * MM, t), lerp(cy + 16 * MM, cy, t)];
  const faders = [[cx + 30 * MM, cy - 16 * MM], [cx - 30 * MM, cy + 16 * MM]];

  if (path === null) {
    for (const gx of [cx - 45 * MM, cx + 45 * MM]) {
      svgEl('circle', { cx: gx, cy, r, class: 'ghost' }, stage);
    }
    sceneLabel(stage, right, top - 10, 'where the pattern is headed', 'ghost-label', 'end');
  }

  const scoped = path === 'b';                   // scope halos on the holes only
  for (const [hx, hy] of [k1, k2]) {
    if (scoped) svgEl('circle', { cx: hx, cy: hy, r: r + 5, class: 'edit-scope' }, stage);
    svgEl('circle', { cx: hx, cy: hy, r, class: 'hole' + (path ? ' is-good' : '') }, stage);
  }
  for (const [hx, hy] of faders) {
    if (t < 0.98) {
      const g = svgEl('g', { opacity: String(1 - t) }, stage);
      if (scoped) svgEl('circle', { cx: hx, cy: hy, r: r * (1 - t) + 5, class: 'edit-scope' }, g);
      svgEl('circle', { cx: hx, cy: hy, r: r * (1 - t), class: 'hole' }, g);
    }
  }

  if (path === 'a') {
    svgEl('rect', {
      x: left - 12, y: top - 12, width: Wpx + 24, height: Hpx + 24, rx: 8, class: 'edit-scope',
    }, stage);
    svgEl('text', {
      x: left - 12, y: top - 20, class: 'scope-label', 'text-anchor': 'start',
      text: 'open for edit: everything — outline included',
    }, stage);
    leaderLine(stage, anchors[0].x, anchors[0].y, left - 14, 130);
  } else if (path === 'b') {
    svgEl('text', {
      x: left - 12, y: top - 20, class: 'scope-label', 'text-anchor': 'start',
      text: 'open for edit: just the holes',
    }, stage);
    leaderLine(stage, anchors[2].x, anchors[2].y, k1[0] - r - 8, k1[1]);
  }

  if (path === 'a' && gouge >= 1) {
    svgEl('path', {
      d: `M ${right} ${top + 28} L ${right - gpx} ${cy} L ${right} ${bot - 28} Z`,
      class: 'gap-bad',
    }, stage);
  }
  if (path === 'a' && gouge >= 3) {
    dimH(stage, {
      x1: right - gpx, x2: right, y: 123, ext1: cy, ext2: top + 28,
      label: `${fmtLen(Math.round(gouge))} out of true`, cls: 'bad',
    });
  }
}

function e5CounterScene(stage, { t, path }) {
  const bot = 216;
  const L = lerp(234, 210, t), R = lerp(426, 450, t);  // the silhouette, reshaping
  const top = lerp(152, 164.8, t);
  const nHalf = 7 * MM, nDeep = 12 * MM;         // the notch: 14 mm wide, 12 mm deep
  const oldX = 362, oldTop = 152;                // where the notch was on day one
  const beadX = lerp(oldX, 402, t);              // the weld bead the notch must clear
  const offMm = Math.round(25 * t);
  const bad = offMm >= 4;

  const rows = path === 'a'
    ? [{ label: 'Sketch 1 · bracket', state: 'active' }, { label: 'Extrude 1' }]
    : [{ label: 'Sketch 1 · outline', state: 'active' }, { label: 'Extrude 1' },
       { label: 'Sketch 2 · notch', state: bad ? 'error' : '' }, { label: 'Extrude 2 · cut' }];
  const anchors = featureTree(stage, 14, 30, rows);

  sceneLabel(stage, 330, 86, 'one-off — ships friday, never opens again', 'muted');

  if (path === 'a') {
    // One sketch: the notch is part of the silhouette, so it rides the reshape.
    svgEl('path', {
      d: `M ${L} ${top} L ${beadX - nHalf} ${top} L ${beadX - nHalf} ${top + nDeep} ` +
         `L ${beadX + nHalf} ${top + nDeep} L ${beadX + nHalf} ${top} L ${R} ${top} ` +
         `L ${R} ${bot} L ${L} ${bot} Z`,
      class: 'part',
    }, stage);
  } else {
    svgEl('rect', { x: L, y: top, width: R - L, height: bot - top, class: 'part' }, stage);
    // The notch feature, still cutting where the old edge used to be.
    svgEl('rect', {
      x: oldX - nHalf, y: oldTop, width: nHalf * 2, height: nDeep,
      class: 'hole' + (bad ? ' is-bad' : ''),
    }, stage);
    if (bad) {
      svgEl('rect', { x: beadX - nHalf, y: top, width: nHalf * 2, height: nDeep, class: 'ghost' }, stage);
      svgEl('line', { x1: oldX, y1: oldTop + nDeep / 2, x2: beadX, y2: top + nDeep / 2, class: 'offline' }, stage);
      dimH(stage, {
        x1: oldX, x2: beadX, y: 128, ext1: oldTop, ext2: top,
        label: `${fmtLen(offMm)} off the bead`, cls: 'bad',
      });
    }
  }

  svgEl('circle', { cx: beadX, cy: top + 8, r: 7, class: 'switch-part' }, stage);
  intentMark(stage, beadX, top + 8, 'intent: clear the bead', 96 - top);

  svgEl('rect', {
    x: L - 10, y: top - 10, width: R - L + 20, height: bot - top + 20, rx: 8, class: 'edit-scope',
  }, stage);
  svgEl('text', {
    x: L - 10, y: bot + 28, class: 'scope-label', 'text-anchor': 'start',
    text: path === 'a' ? 'open for edit: the whole story' : 'open for edit: outline only',
  }, stage);
  leaderLine(stage, anchors[0].x, anchors[0].y, L - 12, top + 20);
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
      get change() { return `The plate’s width. It’s ${fmtLen(120)} today. The client is still deciding — the dashed outline is where it’s headed.`; },
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
        get label() { return `Measure ${fmtLen(60)} from the left edge`; },
        get sub() { return `${fmtLen(60)} is half of ${fmtLen(120)}, so it’s perfectly centered today.`; },
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
      get request() { return `“We’re going bigger — take the plate out toward ${fmtLen(200)}. The sensor still needs to be dead center.”`; },
      sliderLabel: 'Plate width',
      format: (t) => fmtLen(lerp(120, 200, t)),
      hint: 'Drag the width first — feel it before we name it.',
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
            headline: `hole is ${fmtLen(off)} off center`,
            note: 'Only a hair off so far. Keep going.',
          };
        }
        return {
          tone: 'bad',
          headline: `hole is ${fmtLen(off)} off center`,
          note: `The ${fmtLen(60)} dimension is doing exactly what you said — not what you meant. It keeps the hole loyal to an edge that stopped mattering.`,
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
            ? { label: 'Sketch 2 — sensor hole', sub: `${fmtLen(60)} off the left edge · a linear dimension`, active: true }
            : { label: 'Sketch 2 — sensor hole', sub: 'held to the midline · a symmetric constraint', active: true },
        { label: 'Extrude 1', sub: `${fmtLen(6)} thick` },
      ];
    },

    takeaway: {
      line: 'Dimension to the thing that expresses your intent — here, the center — not to whatever edge is closest.',
      term: 'Plain words: “tie it to the midline.” Onshape’s word for it: a symmetric constraint. (A midpoint constraint gets you there too.)',
      flip: 'Unless the intent points at an edge — then edge-anchoring is exactly right.',
    },

    bridge: {
      task: 'In a new sketch, draw a rectangle with a circle inside it. Dimension the circle from one side of the rectangle, then drag that side — the circle rides along with the edge. Now delete that dimension and anchor the circle to the origin instead (a dimension from the origin, or Onshape’s Symmetric constraint), and drag the side again. It holds.',
      href: 'https://cad.onshape.com',
    },

    counter: {
      heading: 'Now flip it',
      get body() { return `Same plate, same two schemes — different job. This one hangs on a wall, and its hole must land on an anchor bolt already set in that wall, ${fmtLen(60)} over. The client still wants the plate wider.`; },
      defaultPath: 'b',
      scene: e1CounterScene,
      sliderLabel: 'Plate width',
      format: (t) => fmtLen(lerp(120, 200, t)),
      hint: 'Run the width change one more time — this part has a different job.',
      pathLabels: {
        get a() { return `Measure ${fmtLen(60)} from the wall edge`; },
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
            return { tone: 'warn', headline: `hole is ${fmtLen(off)} off the bolt`, note: 'Drifting already.' };
          }
          return {
            tone: 'bad',
            headline: `hole is ${fmtLen(off)} off the bolt`,
            note: '“Stay centered” was never this part’s job. The midline moved; the bolt didn’t.',
          };
        }
        return {
          tone: 'good',
          headline: 'still on the bolt line',
          note: `${fmtLen(60)} from the wall, at every width. Here, the edge is the intent.`,
        };
      },
      features(path) {
        return [
          { label: 'Origin', sub: 'the one reference that never moves' },
          { label: 'Sketch 1 — plate outline', sub: 'left edge sits on the wall' },
          path === 'a'
            ? { label: 'Sketch 2 — bolt hole', sub: `${fmtLen(60)} off the wall edge · a linear dimension`, active: true }
            : { label: 'Sketch 2 — bolt hole', sub: 'held to the midline · a symmetric constraint', active: true },
          { label: 'Extrude 1', sub: `${fmtLen(6)} thick` },
        ];
      },
      moral: 'Edge-anchoring — the “accident” from a minute ago — is exactly right here, because the intent flipped. The rule was never “edges are bad.” It’s: dimension from the thing your intent points at. Sometimes that’s an edge.',
    },
  },

  {
    id: 'e2',
    num: 2,
    available: true,
    title: 'One source of truth',
    tagline: 'mirror it, don’t maintain twins',
    principle: 'Mirror from one source, don’t keep two copies.',

    brief: {
      heading: 'One bracket, two holes, one promise',
      body: 'This bracket bolts onto two standoffs. Two mounting holes — and the whole point of them is symmetry. They must sit the same distance either side of the center, or the bracket goes on crooked.',
      intent: 'Keep the two holes perfectly symmetric about the center.',
      get change() { return `The spacing between them. It’s ${fmtLen(80)} today, and the client is already muttering about moving the standoffs — the dashed circles are where the holes are headed.`; },
    },

    predict: {
      prompt: 'Two reasonable-looking ways to put two holes in a plate. The spacing is about to change. Which one keeps the pair symmetric through the edit?',
      note: 'Just a guess — you’ll test both in a minute.',
      answer: 'a',
    },

    choose: {
      prompt: 'Now build it. Pick either scheme — including the one you suspect fails. You’ll flip between them and watch.',
    },

    paths: {
      a: {
        label: 'Sketch one hole, mirror it',
        sub: 'Draw only the left hole. Reflect it across the centerline — the right one is a copy that can’t disagree.',
        short: 'mirrored',
        kind: 'intent',
      },
      b: {
        label: 'Place two holes, one dimension each',
        get sub() { return `Left hole: ${fmtLen(40)} from center. Right hole: ${fmtLen(40)} from center. Two dimensions, perfectly symmetric today.`; },
        short: 'two copies',
        kind: 'accident',
      },
    },

    change: {
      get request() { return `“The standoffs moved — take the hole spacing from ${fmtLen(80)} out to ${fmtLen(140)}. The pair still has to be dead symmetric.”`; },
      sliderLabel: 'Hole spacing',
      format: (t) => fmtLen(lerp(80, 140, t)),
      hint: 'Drag the spacing first — feel it before we name it.',
    },

    scene: e2MainScene,

    outcome(path, t) {
      const off = Math.round(30 * t);
      if (t < 0.02) {
        return {
          tone: 'idle',
          headline: 'spacing unchanged so far',
          note: 'Drag the spacing and play the change request through your scheme.',
        };
      }
      if (path === 'b') {
        if (off < 5) {
          return {
            tone: 'warn',
            headline: `right hole is ${fmtLen(off)} behind`,
            note: 'Barely visible yet — but notice only one hole is listening to you.',
          };
        }
        return {
          tone: 'bad',
          headline: `right hole is ${fmtLen(off)} out of place`,
          note: `You dutifully updated the left dimension. The right one is a separate copy, still sitting at ${fmtLen(40)} — nobody told it. Two copies means two edits, every time, forever.`,
        };
      }
      return {
        tone: 'good',
        headline: 'symmetric at every spacing',
        note: 'One dimension drives both holes. The mirror isn’t decoration — it’s the promise “these two stay related,” built into the model itself.',
      };
    },

    features(path) {
      const base = [
        { label: 'Origin', sub: 'the one reference that never moves' },
        { label: 'Sketch 1 — bracket outline', sub: `${fmtLen(160)} wide, and staying that way` },
      ];
      if (path === null) {
        base.push({ label: 'Sketch 2 — mounting holes', sub: 'two holes. how they stay symmetric is your call', active: true });
      } else if (path === 'a') {
        base.push({ label: 'Sketch 2 — left hole', sub: 'the only hole you actually drew', active: true });
        base.push({ label: 'Mirror 1 — right hole', sub: 'reflected across the centerline · a sketch mirror', active: true });
      } else {
        base.push({ label: 'Sketch 2 — mounting holes', sub: `two holes, two separate ${fmtLen(40)} dimensions`, active: true });
      }
      base.push({ label: 'Extrude 1', sub: `${fmtLen(6)} thick` });
      return base;
    },

    takeaway: {
      line: 'One source of truth. If two things must stay related, don’t maintain them separately — make one drive the other.',
      term: 'Plain words: “draw one, reflect it.” Onshape’s word for it: a mirror — here a sketch mirror; there’s a feature-level Mirror too.',
      flip: 'Unless the two must move independently — sometimes separateness is the intent.',
    },

    bridge: {
      task: 'Sketch a vertical centerline, draw one circle to its left, and make its twin with the sketch Mirror tool. Then edit the original once — move it or resize it. The mirrored copy follows on its own; there was only ever one source to maintain.',
      href: 'https://cad.onshape.com',
    },

    counter: {
      heading: 'Now flip it',
      body: 'Same plate, same two schemes — but now the holes have different jobs. The left one sits over a sensor that’s already glued in place. The right one holds a connector the client keeps moving. The request: “shift the connector outward — and don’t you dare touch my sensor.”',
      defaultPath: 'a',
      scene: e2CounterScene,
      sliderLabel: 'Connector position',
      format: (t) => `${fmtLen(lerp(40, 70, t))} right of center`,
      hint: 'Move the connector — this pair has a different job.',
      pathLabels: {
        a: 'One hole, mirrored',
        b: 'Two holes, two dimensions',
      },
      outcome(path, t) {
        const off = Math.round(30 * t);
        if (t < 0.02) {
          return {
            tone: 'idle',
            headline: 'connector unmoved so far',
            note: 'Slide the connector outward and watch both holes.',
          };
        }
        if (path === 'a') {
          if (off < 5) {
            return { tone: 'warn', headline: `sensor hole dragged ${fmtLen(off)}`, note: 'The left hole is moving. Nobody asked it to.' };
          }
          return {
            tone: 'bad',
            headline: `sensor hole dragged ${fmtLen(off)} off its pad`,
            note: 'The mirror is doing its one job: keeping the two identical. But these holes were never twins — they only matched by coincidence on day one.',
          };
        }
        return {
          tone: 'good',
          headline: 'sensor holds; connector moves alone',
          note: 'Two dimensions, two jobs. Independence isn’t laziness here — it is the intent.',
        };
      },
      features(path) {
        const base = [
          { label: 'Origin', sub: 'the one reference that never moves' },
          { label: 'Sketch 1 — plate outline', sub: `${fmtLen(160)} wide` },
        ];
        if (path === 'a') {
          base.push({ label: 'Sketch 2 — connector hole', sub: 'the one you drew', active: true });
          base.push({ label: 'Mirror 1 — sensor hole', sub: 'a reflected copy — moves whenever the connector moves', active: true });
        } else {
          base.push({ label: 'Sketch 2 — sensor hole', sub: `${fmtLen(40)} left of center · its own dimension`, active: true });
          base.push({ label: 'Sketch 3 — connector hole', sub: 'its own dimension · free to move alone', active: true });
        }
        base.push({ label: 'Extrude 1', sub: `${fmtLen(6)} thick` });
        return base;
      },
      moral: 'Mirroring — the hero a minute ago — is wrong here, because the intent changed. The rule was never “always mirror.” It’s: things that must stay related get one source; things that must move apart stay separate.',
    },
  },

  {
    id: 'e3',
    num: 3,
    available: true,
    title: 'Pin it down',
    tagline: 'looking right isn’t being right',
    principle: 'Fully define, so nothing drifts on you.',

    brief: {
      heading: 'A sketch that looks finished',
      body: 'This tab profile is headed for an extrude, with more features stacked on top. It matches the drawing exactly. Here’s the catch: looking like the drawing and being locked to the drawing are two different things.',
      intent: 'This profile must hold exactly this shape, no matter who touches it next.',
      change: 'Someone will bump it — a stray drag, an edited dimension upstream. In a shared model that’s a when, not an if. Today it’s a deliberate pull on the apex.',
    },

    predict: {
      prompt: 'Two copies of this sketch, pixel-identical today. Someone grabs the apex and pulls. Which one still matches the drawing afterward?',
      note: 'Just a guess — you’ll pull on both in a minute.',
      answer: 'a',
    },

    choose: {
      prompt: 'Now build it. Pick either version — including the one you suspect gives way. You’ll flip between them and pull.',
    },

    paths: {
      a: {
        label: 'Pin it down first',
        sub: 'Add dimensions and constraints until nothing is free to move. The lines turn black.',
        short: 'pinned down',
        kind: 'intent',
      },
      b: {
        label: 'Leave it — it looks right',
        sub: 'It already matches the drawing. More dimensions feel like busywork.',
        short: 'left loose',
        kind: 'accident',
      },
    },

    change: {
      request: '“Stress-test that sketch before we build on it. Grab the apex and pull — if it can drift, I want to find out today, not five features from now.”',
      sliderLabel: 'Pull on the apex',
      format: (t) => `${fmtLen(lerp(0, 27, t))} of pull`,
      hint: 'Drag the pull slider first — that’s your hand on the apex.',
    },

    scene: e3MainScene,

    outcome(path, t) {
      const off = Math.round(27 * t);
      if (t < 0.02) {
        return {
          tone: 'idle',
          headline: 'no pull yet',
          note: 'Drag the slider — that’s your hand on the apex.',
        };
      }
      if (path === 'a') {
        return {
          tone: 'good',
          headline: 'holds its shape',
          note: 'Pull as hard as you like. Every point is accounted for, so there’s no slack to steal — this sketch has exactly one possible shape, and it’s in it.',
        };
      }
      if (off < 4) {
        return { tone: 'warn', headline: `apex is ${fmtLen(off)} adrift`, note: 'It moved. Nothing stopped it.' };
      }
      return {
        tone: 'bad',
        headline: `apex is ${fmtLen(off)} adrift`,
        note: 'The sketch was never wrong — it was unlocked. Under-defined geometry keeps looking right until the day something touches it, and then it moves without asking.',
      };
    },

    features(path) {
      return [
        { label: 'Origin', sub: 'the one reference that never moves' },
        path === null
          ? { label: 'Sketch 1 — tab profile', sub: 'five lines, drawn blue. looks done. is it?', active: true }
          : path === 'a'
            ? { label: 'Sketch 1 — tab profile', sub: 'fully defined — dimensioned and constrained, drawn black', active: true }
            : { label: 'Sketch 1 — tab profile', sub: 'under-defined — still blue, still free to move', active: true },
        { label: 'Extrude 1', sub: 'waiting on this sketch' },
      ];
    },

    takeaway: {
      line: 'If it can move, eventually it will. Looking right isn’t being right — lock the sketch until nothing is left to chance.',
      term: 'Plain words: “no slack left.” Onshape’s phrase: a fully defined sketch — entities draw blue while they’re free, black once they’re locked.',
      flip: 'Unless you’re still exploring — an early sketch earns its slack.',
    },

    bridge: {
      task: 'Open any sketch and hunt for blue — blue is Onshape’s color for “this can still move.” Drag a blue line and feel the slack. Then add dimensions and constraints until everything turns black, and drag again: nothing gives.',
      href: 'https://cad.onshape.com',
    },

    counter: {
      heading: 'Now flip it',
      body: 'Ten minutes into a brand-new idea, you’re roughing out a bracket profile just to find its proportions. Nothing depends on it yet — it might not survive the afternoon. Same two disciplines. Which one serves you now?',
      defaultPath: 'a',
      scene: e3CounterScene,
      sliderLabel: 'Push the proportions',
      format: (t) => `${Math.round(t * 100)}% toward the stout variant`,
      hint: 'Push the proportions around — this sketch has a different job.',
      pathLabels: {
        a: 'Fully define the concept sketch',
        b: 'Leave it loose while you explore',
      },
      outcome(path, t) {
        if (t < 0.02) {
          return {
            tone: 'idle',
            headline: 'nothing tried yet',
            note: 'Push the slider — try a few shapes on.',
          };
        }
        if (path === 'a') {
          return {
            tone: 'bad',
            headline: 'nothing budges',
            note: 'It’s bolted down. Every proportion you want to try now costs a dimension edit — six numbers, changed one at a time. The lock you added for safety has become friction.',
          };
        }
        return {
          tone: 'good',
          headline: 'proportions flow',
          note: 'This sketch’s job is to be argued with. Loose isn’t sloppy here — exploring is the intent, and slack is the tool.',
        };
      },
      features(path) {
        return [
          { label: 'Origin', sub: 'the one reference that never moves' },
          path === 'a'
            ? { label: 'Sketch 1 — concept profile', sub: 'fully defined — and fighting you', active: true }
            : { label: 'Sketch 1 — concept profile', sub: 'loose on purpose — blue and proud', active: true },
        ];
      },
      moral: 'Fully defining — the discipline you just learned — is the wrong move ten minutes into a new idea. The rule was never “always lock everything.” Match the slack to the intent: committing? Pin it down. Exploring? Let it breathe.',
    },
  },

  {
    id: 'e4',
    num: 4,
    available: true,
    title: 'Link what belongs together',
    tagline: 'a relationship beats a hardcoded number',
    principle: 'Relate features to each other, don’t hardcode independent numbers.',

    brief: {
      heading: 'A lid with one job',
      get body() { return `This box gets a snap-on lid. The lid must overhang the box by ${fmtLen(2)} on each side — enough to grab, not enough to snag. The box is ${fmtLen(100)} wide today, so the correct lid is ${fmtLen(104)}.`; },
      get intent() { return `Keep the lid exactly ${fmtLen(2)} past the box on each side.`; },
      change: 'The box. A bigger version keeps coming up in meetings — the dashed outline is where it’s headed.',
    },

    predict: {
      get prompt() { return `Two ways to size the lid, and both come out to ${fmtLen(104)} today. The box is about to grow. Which lid still fits the day it does?`; },
      note: 'Just a guess — you’ll test both in a minute.',
      answer: 'b',
    },

    choose: {
      prompt: 'Now build it. Pick either lid — including the one you suspect fails. You’ll flip between them and watch the box grow.',
    },

    paths: {
      a: {
        get label() { return `Type the lid at ${fmtLen(104)}`; },
        get sub() { return `Box is ${fmtLen(100)}, plus ${fmtLen(2)} per side. Do the math once, type the answer.`; },
        short: 'hardcoded',
        kind: 'accident',
      },
      b: {
        get label() { return `Make the lid “box width + ${fmtLen(4)}”`; },
        sub: 'No number of its own — the lid asks the box how wide to be.',
        short: 'linked',
        kind: 'intent',
      },
    },

    change: {
      get request() { return `“The bigger version is approved — take the box out toward ${fmtLen(160)}. And yes, the lid still owes us its ${fmtLen(2)}.”`; },
      sliderLabel: 'Box width',
      format: (t) => fmtLen(lerp(100, 160, t)),
      hint: 'Grow the box first — feel it before we name it.',
    },

    scene: e4MainScene,

    outcome(path, t) {
      const over = 2 - 30 * t;                   // lid overhang per side, mm
      if (t < 0.02) {
        return {
          tone: 'idle',
          headline: 'box unchanged so far',
          note: 'Drag the box wider and watch the lid’s edges.',
        };
      }
      if (path === 'a') {
        if (over > 0.3) {
          return {
            tone: 'warn',
            headline: `overhang down to ${fmtLen(over, { mmDecimals: 1 })}`,
            note: `The lid isn’t growing. Its ${fmtLen(2)} of grace is being spent.`,
          };
        }
        if (over > -1.5) {
          return {
            tone: 'bad',
            headline: `the lid is flush — ${fmtLen(0)} to grab`,
            note: 'The overhang is gone. Keep going.',
          };
        }
        return {
          tone: 'bad',
          headline: `box sticks out ${fmtLen(Math.abs(over))} past the lid`,
          note: `${fmtLen(104)} was the right answer to a question the box stopped asking. The number didn’t drift — the world did, and a typed number never hears about it.`,
        };
      }
      return {
        tone: 'good',
        headline: `always ${fmtLen(2)} past the box`,
        note: 'The lid doesn’t know a number — it knows a relationship. The box grew, the lid heard about it, and nobody edited anything.',
      };
    },

    features(path) {
      return [
        { label: 'Origin', sub: 'the one reference that never moves' },
        { label: 'Sketch 1 — box body', sub: 'its width is the thing that will change' },
        { label: 'Extrude 1 — box', sub: 'hollow, open on top' },
        path === null
          ? { label: 'Sketch 2 — lid plate', sub: 'how wide? that’s your call', active: true }
          : path === 'a'
            ? { label: 'Sketch 2 — lid plate', sub: `width typed in: ${fmtLen(104)}`, active: true }
            : { label: 'Sketch 2 — lid plate', sub: `width = box width + ${fmtLen(4)} · a linked dimension`, active: true },
        { label: 'Extrude 2 — lid', sub: `${fmtLen(7)} thick` },
      ];
    },

    takeaway: {
      line: 'A relationship is intent made durable. When two dimensions belong together, link them — don’t make one memorize the other.',
      get term() { return `Plain words: “the lid asks the box.” Onshape’s tools for it: a variable, or an equation typed right into the dimension (#box_width + ${fmtLen(4)}).`; },
      flip: 'Unless a standard already decided the number — then typing it is correct.',
    },

    bridge: {
      task: 'In a Part Studio, create a variable — call it #base — and use it in one sketch dimension. Type a matching plain number into a second dimension. Now change #base and watch: the linked dimension follows, the typed one just sits there.',
      href: 'https://cad.onshape.com',
    },

    counter: {
      heading: 'Now flip it',
      get body() { return `Same instinct, different hole. This control panel takes a standard ⌀${fmtLen(20)} push-button switch. The switch comes off a shelf and will never change — but the panel is about to get wider.`; },
      defaultPath: 'b',
      scene: e4CounterScene,
      sliderLabel: 'Panel width',
      format: (t) => fmtLen(lerp(80, 160, t)),
      hint: 'Grow the panel — this hole answers to a standard, not a neighbor.',
      pathLabels: {
        get a() { return `Type the hole at ⌀${fmtLen(20)}`; },
        b: 'Link the hole to the panel width',
      },
      outcome(path, t) {
        const g = Math.round(20 * t);            // how oversize the linked hole runs, mm
        if (t < 0.02) {
          return {
            tone: 'idle',
            headline: 'panel unchanged so far',
            note: 'Widen the panel and watch the hole.',
          };
        }
        if (path === 'b') {
          if (g < 4) {
            return { tone: 'warn', headline: `hole is ${fmtLen(g)} oversize`, note: 'The hole is growing with the panel. The switch is not.' };
          }
          return {
            tone: 'bad',
            headline: `hole is ⌀${fmtLen(20 + g)} — the switch is ⌀${fmtLen(20)}`,
            note: 'The link is doing what links do: passing the change along. But the switch doesn’t scale with your panel. This dimension answers to a standard, not to a neighbor.',
          };
        }
        return {
          tone: 'good',
          headline: `⌀${fmtLen(20)} at every panel size`,
          note: 'A typed number — the villain a minute ago — is exactly right here, because the real reference is a standard that never moves.',
        };
      },
      features(path) {
        return [
          { label: 'Origin', sub: 'the one reference that never moves' },
          { label: 'Sketch 1 — panel outline', sub: 'its width is the thing that will change' },
          path === 'a'
            ? { label: 'Sketch 2 — switch hole', sub: `⌀${fmtLen(20)} typed in — quoting the standard`, active: true }
            : { label: 'Sketch 2 — switch hole', sub: '⌀ linked to panel width ÷ 4', active: true },
          { label: 'Extrude 1', sub: `${fmtLen(3)} panel` },
        ];
      },
      moral: 'Linking — the lesson you just banked — becomes the mistake the moment a dimension answers to a standard instead of a neighbor. The rule was never “never type numbers.” Link what varies together; hardcode what a standard has already decided.',
    },
  },

  {
    id: 'e5',
    num: 5,
    available: true,
    title: 'Give it its own line',
    tagline: 'a feature is a future edit, filed in advance',
    principle: 'Put each decision at the level where you’ll want to change it later.',

    brief: {
      heading: 'One part, two schedules',
      body: 'This mounting plate is two things at once. The outline already fits its enclosure — signed off, settled, done. The four bezel holes are the opposite: marketing redraws that bezel every other sprint. Two parts of one part, on very different schedules.',
      intent: 'The outline never moves. The holes stay easy to rework.',
      change: 'The hole pattern — count and positions. A two-hole bezel is already circulating in meetings, and when it lands, someone opens this part and reworks the holes.',
    },

    predict: {
      prompt: 'Two reasonable places for four circles to live. The hole pattern is about to be reworked — count, positions, everything. Which structure lets that rework land without putting the outline at risk?',
      note: 'Just a guess — you’ll test both in a minute.',
      answer: 'b',
    },

    choose: {
      prompt: 'Now build it. Pick either structure — including the one you suspect fails. You’ll flip between them and watch the rework land.',
    },

    paths: {
      a: {
        label: 'Draw the holes inside the base sketch',
        sub: 'One sketch carries everything — outline and holes together. One line in the tree. Feels tidy.',
        short: 'one sketch',
        kind: 'accident',
      },
      b: {
        label: 'Give the holes their own feature',
        sub: 'The base sketch stays a clean outline. The holes get their own sketch and cut, one line further down the tree.',
        short: 'own feature',
        kind: 'intent',
      },
    },

    change: {
      request: '“The two-hole bezel is approved — rework the pattern: four holes down to two, moved out toward the ends. And the outline is signed off. Do not move my outline.”',
      sliderLabel: 'Hole rework',
      format: (t) => `${Math.round(t * 100)}% reworked`,
      hint: 'Drag the rework through first — feel it before we name it.',
    },

    scene: e5MainScene,

    outcome(path, t) {
      const off = Math.round(12 * t);
      if (t < 0.02) {
        return {
          tone: 'idle',
          headline: 'rework not started',
          note: 'Drag the rework through and watch two things: the holes, and the outline.',
        };
      }
      if (path === 'a') {
        if (off < 4) {
          return {
            tone: 'warn',
            headline: `outline nicked — ${fmtLen(off)} out of true`,
            note: 'You’re inside the base sketch to touch holes — and every line of the outline is within reach of every click.',
          };
        }
        return {
          tone: 'bad',
          headline: `outline gouged ${fmtLen(off)} out of true`,
          note: 'The holes came out right. But they shared a sketch with the outline, and deleting them took a stray edge along. In a crowded sketch, everything is on the operating table, every time.',
        };
      }
      return {
        tone: 'good',
        headline: 'holes reworked — the outline never flinched',
        note: 'The rework happened one line down the tree, in a sketch whose only job is holes. The outline wasn’t just safe — it was never even in the room.',
      };
    },

    features(path) {
      const base = [
        { label: 'Origin', sub: 'the one reference that never moves' },
      ];
      if (path === 'a') {
        base.push({ label: 'Sketch 1 — outline + four holes', sub: 'one crowded sketch — the outline and the holes share every edit', active: true });
        base.push({ label: 'Extrude 1', sub: `${fmtLen(6)} thick` });
      } else if (path === 'b') {
        base.push({ label: 'Sketch 1 — plate outline', sub: 'clean — nothing in it but the part’s identity' });
        base.push({ label: 'Extrude 1', sub: `${fmtLen(6)} thick` });
        base.push({ label: 'Sketch 2 — hole pattern', sub: 'the part that keeps changing, on its own line', active: true });
        base.push({ label: 'Extrude 2 — cut', sub: 'removes the holes, through all' });
      } else {
        base.push({ label: 'Sketch 1 — plate outline', sub: 'settled — it already fits the enclosure' });
        base.push({ label: 'Extrude 1', sub: `${fmtLen(6)} thick` });
        base.push({ label: 'the four holes', sub: 'marketing keeps moving them. where they live is your call', active: true });
      }
      return base;
    },

    takeaway: {
      line: 'The base sketch is the part’s identity — keep it clean. Anything you expect to revisit deserves its own line in the tree: a feature is a future edit, filed in advance.',
      term: 'Plain words: “give the holes their own drawer.” Onshape’s shape for it: a second sketch plus an Extrude set to Remove — or a Hole feature — stacked after the base extrude in the feature list.',
      flip: 'Unless the decision was never separate — then one clean sketch wins.',
    },

    bridge: {
      task: 'Extrude a simple plate from one rectangle sketch. Add two holes the filed-in-advance way: a new sketch on the plate’s face, two circles, then an Extrude set to Remove. Now edit that hole sketch and move a circle — watch the feature list: only your hole feature rebuilds, and the base sketch never opens.',
      href: 'https://cad.onshape.com',
    },

    counter: {
      heading: 'Now flip it',
      body: 'A one-off spacer bracket, shipping Friday, never to be opened again. Its silhouette has a notch that clears a weld bead — and the notch isn’t a bolt-on decision, it is the silhouette. One last request lands: reshape the whole thing for the new bead. Same two structures. Which serves you now?',
      defaultPath: 'b',
      scene: e5CounterScene,
      sliderLabel: 'Reshape the silhouette',
      format: (t) => `${Math.round(t * 100)}% toward the new shape`,
      hint: 'Reshape it — this part has a different job.',
      pathLabels: {
        a: 'Keep the notch in the outline sketch',
        b: 'File the notch as its own feature',
      },
      outcome(path, t) {
        const off = Math.round(25 * t);
        if (t < 0.02) {
          return {
            tone: 'idle',
            headline: 'nothing reshaped yet',
            note: 'Drag the reshape through and watch the notch.',
          };
        }
        if (path === 'b') {
          if (off < 4) {
            return { tone: 'warn', headline: `notch is ${fmtLen(off)} off the bead`, note: 'The outline is moving. The notch feature isn’t.' };
          }
          return {
            tone: 'bad',
            headline: `notch is ${fmtLen(off)} off the bead`,
            note: 'You filed the notch as its own future edit — but it was never a separate decision. It belongs to the silhouette, and the silhouette just left without it. That extra line in the tree wasn’t organization; it was a place for the part to disagree with itself.',
          };
        }
        return {
          tone: 'good',
          headline: 'notch rides the outline — still on the bead',
          note: 'One sketch, one identity. The notch was never a separate decision, so the reshape can’t leave it behind. For a one-off, the short tree is the honest tree.',
        };
      },
      features(path) {
        const base = [
          { label: 'Origin', sub: 'the one reference that never moves' },
        ];
        if (path === 'a') {
          base.push({ label: 'Sketch 1 — bracket + notch', sub: 'one sketch — the notch is part of the silhouette', active: true });
          base.push({ label: 'Extrude 1', sub: `${fmtLen(5)} thick` });
        } else {
          base.push({ label: 'Sketch 1 — bracket outline', sub: 'the silhouette, being reshaped', active: true });
          base.push({ label: 'Extrude 1', sub: `${fmtLen(5)} thick` });
          base.push({ label: 'Sketch 2 — notch', sub: 'still drawn against the old edge' });
          base.push({ label: 'Extrude 2 — cut', sub: 'cuts where the notch used to belong' });
        }
        return base;
      },
      moral: 'Filing things on their own line — the habit you just built — turns the tree to noise when the decision was never separate. The notch changes with the outline, so it belongs to the outline. The rule was never “more features.” It’s: one line per decision you’ll revisit on its own.',
    },
  },
];
