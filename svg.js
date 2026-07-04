/* svg.js — tiny SVG helpers for the pre-authored scenes.
   There is no solver here, on purpose: every scene is a hand-choreographed
   function of (t, path), so the gotcha lands exactly where we aimed it. */
'use strict';

const SVGNS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs = {}, parent = null) {
  const node = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  if (parent) parent.appendChild(node);
  return node;
}

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

const lerp = (a, b, t) => a + (b - a) * t;

const SCENE_W = 520;
const SCENE_H = 300;
const MM = 1.6; // px per mm — one scale for every exercise keeps proportions honest

/* ---------------------------------------------------------------- units
   Every scene is authored in mm — that stays the source of truth for all
   geometry. The unit toggle only changes how a length is *printed*. */

const UNIT_KEY = 'cad-gym.unit';

// Cached in memory — a slider drag can call fmtLen() dozens of times per
// second, and localStorage reads are synchronous. Only localStorage itself
// is the source of truth across page loads; this variable just avoids
// re-reading it on every draw.
let cachedUnit = localStorage.getItem(UNIT_KEY) === 'in' ? 'in' : 'mm';

function getUnit() {
  return cachedUnit;
}
function setUnit(unit) {
  cachedUnit = unit === 'in' ? 'in' : 'mm';
  localStorage.setItem(UNIT_KEY, cachedUnit);
}
function toggleUnit() {
  setUnit(getUnit() === 'in' ? 'mm' : 'in');
}

const MM_PER_IN = 25.4;

/* Format a millimeter quantity in whichever unit the toggle is set to. */
function fmtLen(mm, { mmDecimals = 0, inDecimals = 2 } = {}) {
  return getUnit() === 'in'
    ? `${(mm / MM_PER_IN).toFixed(inDecimals)} in`
    : `${mm.toFixed(mmDecimals)} mm`;
}

/* A scene viewport: grid background + a stage group that scenes draw into. */
function makeSceneSvg() {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${SCENE_W} ${SCENE_H}`,
    class: 'scene',
    role: 'img',
  });
  const defs = svgEl('defs', {}, svg);

  const grid = svgEl('pattern', {
    id: 'grid', width: 16, height: 16, patternUnits: 'userSpaceOnUse',
  }, defs);
  svgEl('path', { d: 'M 16 0 H 0 V 16', class: 'grid-line' }, grid);

  const hatch = svgEl('pattern', {
    id: 'hatch', width: 7, height: 7,
    patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)',
  }, defs);
  svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 7, class: 'hatch-line' }, hatch);

  svgEl('rect', { x: 0, y: 0, width: SCENE_W, height: SCENE_H, fill: 'url(#grid)' }, svg);
  const stage = svgEl('g', {}, svg);
  return { svg, stage };
}

/* Horizontal linear dimension: extension lines from the geometry (ext1/ext2 are
   the y-coords being measured from), a dimension line at y, arrowheads, label. */
function dimH(parent, { x1, x2, y, ext1 = null, ext2 = null, label = '', cls = '' }) {
  const g = svgEl('g', { class: `dim ${cls}`.trim() }, parent);
  const a = Math.min(x1, x2);
  const b = Math.max(x1, x2);
  if (ext1 !== null) svgEl('line', { x1: x1, y1: ext1, x2: x1, y2: y, class: 'ext' }, g);
  if (ext2 !== null) svgEl('line', { x1: x2, y1: ext2, x2: x2, y2: y, class: 'ext' }, g);
  svgEl('line', { x1: a, y1: y, x2: b, y2: y, class: 'dimline' }, g);
  if (b - a > 18) {
    svgEl('path', { d: `M ${a} ${y} l 7 -2.6 v 5.2 z`, class: 'arrowhead' }, g);
    svgEl('path', { d: `M ${b} ${y} l -7 -2.6 v 5.2 z`, class: 'arrowhead' }, g);
  }
  if (label) {
    svgEl('text', {
      x: (a + b) / 2, y: y - 4.5, class: 'dimtext', 'text-anchor': 'middle', text: label,
    }, g);
  }
  return g;
}

/* Vertical linear dimension: extension lines from the geometry (ext1/ext2 are
   the x-coords being measured from), a dimension line at x, arrowheads, label. */
function dimV(parent, { y1, y2, x, ext1 = null, ext2 = null, label = '', cls = '' }) {
  const g = svgEl('g', { class: `dim ${cls}`.trim() }, parent);
  const a = Math.min(y1, y2);
  const b = Math.max(y1, y2);
  if (ext1 !== null) svgEl('line', { x1: ext1, y1: y1, x2: x, y2: y1, class: 'ext' }, g);
  if (ext2 !== null) svgEl('line', { x1: ext2, y1: y2, x2: x, y2: y2, class: 'ext' }, g);
  svgEl('line', { x1: x, y1: a, x2: x, y2: b, class: 'dimline' }, g);
  if (b - a > 18) {
    svgEl('path', { d: `M ${x} ${a} l -2.6 7 h 5.2 z`, class: 'arrowhead' }, g);
    svgEl('path', { d: `M ${x} ${b} l -2.6 -7 h 5.2 z`, class: 'arrowhead' }, g);
  }
  if (label) {
    svgEl('text', {
      x: x + 5, y: (a + b) / 2 + 3.5, class: 'dimtext', 'text-anchor': 'start', text: label,
    }, g);
  }
  return g;
}

/* Vertical dash-dot construction centerline — classic drafting vocabulary. */
function centerlineV(parent, x, y1, y2, cls = '') {
  return svgEl('line', { x1: x, y1: y1, x2: x, y2: y2, class: `centerline ${cls}`.trim() }, parent);
}

/* Intent marker: a dashed crosshair showing where the intent says something
   must live. Deviation from this mark is the whole show. */
function intentMark(parent, x, y, label = '', labelDy = 34) {
  const g = svgEl('g', { class: 'intent' }, parent);
  svgEl('circle', { cx: x, cy: y, r: 12, class: 'intent-ring' }, g);
  svgEl('line', { x1: x - 18, y1: y, x2: x + 18, y2: y, class: 'intent-line' }, g);
  svgEl('line', { x1: x, y1: y - 18, x2: x, y2: y + 18, class: 'intent-line' }, g);
  if (label) {
    svgEl('text', { x: x, y: y + labelDy, class: 'intent-label', 'text-anchor': 'middle', text: label }, g);
  }
  return g;
}

function sceneLabel(parent, x, y, text, cls = '', anchor = 'middle') {
  return svgEl('text', {
    x, y, class: `scenelabel ${cls}`.trim(), 'text-anchor': anchor, text,
  }, parent);
}
