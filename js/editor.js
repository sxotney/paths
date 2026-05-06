import { renderTable, renderBall, renderCueLines, BALL_RADIUS } from './renderer.js';
import { loadDraft, saveDraft, exportJSON } from './storage.js';
import { emptyCatalogue, TIP_CELLS, PACE_BUCKETS } from './schema.js';
import { tipWidgetSVG } from './tip-widget.js';

let catalogue = loadDraft();
let activePatternId = null;
let placingBlocker = false;
let editing = {
  cueBall: null, objectBall: null, objectBallColor: 'red',
  blockers: [], pocket: null,
  obFinal: null, cueFinal: null,
  obWaypoints: [], cueWaypoints: [],
  tip: null, pace: null,
  activeVariants: [], // saved variants of the active pattern, rendered as faint overlays
  step: 'placeCue', // placeCue | placeOB | placeOBFinal | placeCueFinal | pickInputs
};

export function mountEditor(root) {
  root.innerHTML = `
    <header class="bar">
      <select id="pattern-select"><option value="">(new pattern)</option></select>
      <input id="pattern-name" placeholder="Pattern name"/>
      <select id="ob-color">
        <option value="red">red</option>
        <option value="yellow">yellow</option>
        <option value="green">green</option>
        <option value="brown">brown</option>
        <option value="blue">blue</option>
        <option value="pink">pink</option>
        <option value="black">black</option>
      </select>
      <button id="export">Export</button>
    </header>
    <section id="canvas"></section>
    <footer class="bar bar-bottom">
      <div id="step-hint"></div>
      <button id="add-ball">+ball</button>
      <button id="start-over">Start over</button>
      <button id="redo-path">Redo path</button>
      <div id="tip-grid"></div>
      <div id="pace-buttons"></div>
      <button id="save-variant" disabled>Save variant</button>
    </footer>
  `;
  redraw();
  refreshPatternList();
  bindPatternSelect();
  bindExport();
  document.getElementById('ob-color').addEventListener('change', e => {
    editing.objectBallColor = e.target.value;
    redraw();
  });
  document.getElementById('add-ball').addEventListener('click', () => {
    placingBlocker = !placingBlocker;
    document.getElementById('add-ball').classList.toggle('on', placingBlocker);
    updateStepHint();
  });
  document.getElementById('redo-path').addEventListener('click', () => {
    editing.obFinal = null;
    editing.cueFinal = null;
    editing.obWaypoints = [];
    editing.cueWaypoints = [];
    editing.step = 'placeOBFinal';
    redraw(); updateStepHint(); maybeEnableSave();
  });
  document.getElementById('start-over').addEventListener('click', () => {
    editing = {
      cueBall: null, objectBall: null, objectBallColor: editing.objectBallColor,
      blockers: [], pocket: null,
      obFinal: null, cueFinal: null,
      obWaypoints: [], cueWaypoints: [],
      tip: null, pace: null,
      activeVariants: [],
      step: 'placeCue',
    };
    activePatternId = null;
    placingBlocker = false;
    document.getElementById('add-ball').classList.remove('on');
    document.getElementById('pattern-select').value = '';
    document.getElementById('pattern-name').value = '';
    document.querySelectorAll('.tip-cell.on, .pace-cell.on').forEach(x => x.classList.remove('on'));
    redraw(); updateStepHint(); maybeEnableSave();
  });
  document.getElementById('save-variant').addEventListener('click', () => {
    const name = document.getElementById('pattern-name').value.trim();
    if (!activePatternId && !name) { alert('Name the pattern first'); return; }

    let pattern = activePatternId ? catalogue.patterns.find(p => p.id === activePatternId) : null;
    if (!pattern) {
      const id = `PP${catalogue.patterns.length + 1}`;
      pattern = {
        id, name,
        setup: {
          cueBall: editing.cueBall,
          objectBall: { ...editing.objectBall, color: editing.objectBallColor },
          blockers: editing.blockers,
        },
        variants: [],
      };
      catalogue.patterns.push(pattern);
      activePatternId = id;
    }
    const vId = `${pattern.id}-${String.fromCharCode(97 + pattern.variants.length)}`; // a, b, c, ...
    const variant = {
      id: vId,
      label: `${editing.tip} ${editing.pace}`,
      tip: editing.tip,
      pace: editing.pace,
      cueFinal: editing.cueFinal,
      obFinal: editing.obFinal,
    };
    if (editing.obWaypoints.length) variant.obWaypoints = editing.obWaypoints.slice();
    if (editing.cueWaypoints.length) variant.cueWaypoints = editing.cueWaypoints.slice();
    pattern.variants.push(variant);
    saveDraft(catalogue);
    refreshPatternList();
    document.getElementById('pattern-select').value = pattern.id;
    // Reset for next variant — keep setup, clear destinations/inputs, refresh archive.
    editing = {
      ...editing,
      obFinal: null, cueFinal: null,
      obWaypoints: [], cueWaypoints: [],
      tip: null, pace: null,
      activeVariants: pattern.variants.slice(),
      step: 'placeOBFinal',
    };
    document.querySelectorAll('.tip-cell.on, .pace-cell.on').forEach(x => x.classList.remove('on'));
    redraw(); updateStepHint(); maybeEnableSave();
    alert(`Saved ${vId}`);
  });
  renderTipGrid();
  renderPaceButtons();
  updateStepHint();
}

function refreshPatternList() {
  const sel = document.getElementById('pattern-select');
  sel.innerHTML = '<option value="">(new pattern)</option>' +
    catalogue.patterns.map(p => `<option value="${p.id}">${p.id}: ${p.name}</option>`).join('');
}
function bindPatternSelect() {
  const sel = document.getElementById('pattern-select');
  const nameInput = document.getElementById('pattern-name');
  sel.addEventListener('change', () => {
    activePatternId = sel.value || null;
    if (activePatternId) {
      const p = catalogue.patterns.find(x => x.id === activePatternId);
      nameInput.value = p.name;
      // Pre-fill setup from existing pattern; only authoring NEW variants for it.
      // Note: schema's objectBall has a nested .color field; editor keeps colour
      // in a sibling editing.objectBallColor. Unpack so redraw() finds the colour
      // where it expects.
      editing = {
        ...editing,
        cueBall: p.setup.cueBall,
        objectBall: { x: p.setup.objectBall.x, y: p.setup.objectBall.y },
        objectBallColor: p.setup.objectBall.color,
        blockers: p.setup.blockers,
        activeVariants: p.variants.slice(),
        step: 'placeOBFinal',
        obFinal: null, cueFinal: null, obWaypoints: [], cueWaypoints: [], tip: null, pace: null,
      };
      document.getElementById('ob-color').value = editing.objectBallColor;
    } else {
      nameInput.value = '';
      editing = {
        cueBall: null, objectBall: null, objectBallColor: 'red',
        blockers: [], pocket: null,
        obFinal: null, cueFinal: null,
        obWaypoints: [], cueWaypoints: [],
        tip: null, pace: null,
        activeVariants: [],
        step: 'placeCue',
      };
      document.getElementById('ob-color').value = 'red';
    }
    redraw();
    updateStepHint();
    maybeEnableSave();
    document.querySelectorAll('.tip-cell.on, .pace-cell.on').forEach(x => x.classList.remove('on'));
  });
}
function bindExport() {
  document.getElementById('export').addEventListener('click', async () => {
    const json = exportJSON(catalogue);
    await navigator.clipboard.writeText(json);
    alert('Catalogue copied to clipboard');
  });
}
function renderTipGrid() {
  const el = document.getElementById('tip-grid');
  el.innerHTML = tipWidgetSVG();
  el.addEventListener('click', e => {
    const b = e.target.closest('.tip-cell');
    if (!b) return;
    editing.tip = b.dataset.tip;
    el.querySelectorAll('.tip-cell').forEach(x => x.classList.toggle('on', x === b));
    maybeEnableSave();
  });
}
function renderPaceButtons() {
  const el = document.getElementById('pace-buttons');
  el.innerHTML = PACE_BUCKETS.map(p => `<button class="pace-cell" data-pace="${p}">${p}</button>`).join('');
  el.addEventListener('click', e => {
    const b = e.target.closest('.pace-cell');
    if (!b) return;
    editing.pace = b.dataset.pace;
    el.querySelectorAll('.pace-cell').forEach(x => x.classList.toggle('on', x === b));
    maybeEnableSave();
  });
}
function maybeEnableSave() {
  const ok = editing.cueBall && editing.objectBall && editing.obFinal && editing.cueFinal && editing.tip && editing.pace;
  document.getElementById('save-variant').disabled = !ok;
}
const SVG_NS = 'http://www.w3.org/2000/svg';
function redraw() {
  const canvas = document.getElementById('canvas');
  canvas.innerHTML = '';
  const svg = renderTable();
  // All ball + line content goes inside the portrait-wrap group so it gets
  // rotated alongside the table.
  const portraitWrap = svg.querySelector('[data-role="portrait-wrap"]');
  // Archived variants for the active pattern — render at reduced opacity so
  // they sit behind the in-progress variant as visible context.
  for (const v of editing.activeVariants || []) {
    const wrap = document.createElementNS(SVG_NS, 'g');
    wrap.setAttribute('opacity', '0.4');
    wrap.setAttribute('data-role', 'archived-variant');
    wrap.setAttribute('data-variant-id', v.id);
    wrap.appendChild(renderCueLines({
      cueBall: editing.cueBall,
      objectBall: editing.objectBall,
      obFinal: v.obFinal,
      cueFinal: v.cueFinal,
      objectBallColor: editing.objectBallColor,
      obWaypoints: v.obWaypoints,
      cueWaypoints: v.cueWaypoints,
    }));
    portraitWrap.appendChild(wrap);
  }
  // In-progress variant at full opacity
  portraitWrap.appendChild(renderCueLines({
    cueBall: editing.cueBall,
    objectBall: editing.objectBall,
    obFinal: editing.obFinal,
    cueFinal: editing.cueFinal,
    objectBallColor: editing.objectBallColor,
    obWaypoints: editing.obWaypoints,
    cueWaypoints: editing.cueWaypoints,
  }));
  // Solid balls for cue + OB (drawn ON TOP of all paths)
  if (editing.cueBall) portraitWrap.appendChild(renderBall({ ...editing.cueBall, color: 'white' }));
  if (editing.objectBall) portraitWrap.appendChild(renderBall({ ...editing.objectBall, color: editing.objectBallColor }));
  for (const b of editing.blockers) portraitWrap.appendChild(renderBall(b));
  canvas.appendChild(svg);
  bindCanvasInteractions(svg);
}

function svgPoint(svg, evt) {
  // Use the rotated portrait-wrap's CTM so client coords map directly to the
  // original landscape coordinate system that all catalogue data is authored in.
  const wrap = svg.querySelector('[data-role="portrait-wrap"]') || svg;
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(wrap.getScreenCTM().inverse());
}

function isOnCushion(p) {
  return p.x < 0 || p.x > 3569 || p.y < 0 || p.y > 1778;
}

// Clamp a click that landed past the cushion back to the play-area edge,
// so the bounce waypoint sits on the cushion boundary (not in the brown rail).
function clampToCushion(p) {
  return {
    x: Math.max(0, Math.min(3569, p.x)),
    y: Math.max(0, Math.min(1778, p.y)),
  };
}

function existingBalls() {
  const out = [];
  if (editing.cueBall) out.push(editing.cueBall);
  if (editing.objectBall) out.push(editing.objectBall);
  for (const b of editing.blockers) out.push(b);
  return out;
}

// If the click lands inside an existing ball, push the new ball to be tangent
// in the direction from that ball toward the click point (so it ends up on the
// side closest to where the user clicked). Iterate to handle chained overlaps.
function resolveBallPlacement(p, existing) {
  let pos = { x: p.x, y: p.y };
  const minDist = 2 * BALL_RADIUS;
  for (let iter = 0; iter < 8; iter++) {
    let conflict = null;
    for (const b of existing) {
      const dx = pos.x - b.x;
      const dy = pos.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < minDist - 0.01) { conflict = { b, dx, dy, d }; break; }
    }
    if (!conflict) break;
    const { b, dx, dy, d } = conflict;
    if (d === 0) { pos.x = b.x + minDist; pos.y = b.y; }
    else { pos.x = b.x + (dx / d) * minDist; pos.y = b.y + (dy / d) * minDist; }
  }
  return pos;
}

function bindCanvasInteractions(svg) {
  svg.addEventListener('pointerdown', e => {
    const p = svgPoint(svg, e);
    // Blocker placement mode preempts the state machine.
    if (placingBlocker) {
      const pos = resolveBallPlacement(p, existingBalls());
      editing.blockers.push({ x: pos.x, y: pos.y, color: 'red' });
      redraw();
      return;
    }
    if (editing.step === 'placeCue') {
      editing.cueBall = { x: p.x, y: p.y }; // first ball — no conflicts possible
      editing.step = 'placeOB';
      redraw(); updateStepHint();
    } else if (editing.step === 'placeOB') {
      const pos = resolveBallPlacement(p, existingBalls());
      editing.objectBall = { x: pos.x, y: pos.y };
      editing.step = 'placeOBFinal';
      redraw(); updateStepHint();
    } else if (editing.step === 'placeOBFinal') {
      if (isOnCushion(p)) {
        editing.obWaypoints.push(clampToCushion(p));
        redraw();
      } else {
        editing.obFinal = { x: p.x, y: p.y };
        editing.step = 'placeCueFinal';
        redraw(); updateStepHint();
      }
    } else if (editing.step === 'placeCueFinal') {
      if (isOnCushion(p)) {
        editing.cueWaypoints.push(clampToCushion(p));
        redraw();
      } else {
        editing.cueFinal = { x: p.x, y: p.y };
        editing.step = 'pickInputs';
        redraw(); updateStepHint(); maybeEnableSave();
      }
    }
  });
}

function updateStepHint() {
  if (placingBlocker) {
    document.getElementById('step-hint').textContent = 'Tap to place red blocker (or +ball again to exit)';
    return;
  }
  const hints = {
    placeCue: 'Tap to place cue ball',
    placeOB: 'Tap to place object ball',
    placeOBFinal: 'Tap on cloth to set OB final, on cushion for a bounce',
    placeCueFinal: 'Tap on cloth to set cue final, on cushion for a bounce',
    pickInputs: 'Pick tip cell and pace, then Save',
  };
  document.getElementById('step-hint').textContent = hints[editing.step] || '';
}
