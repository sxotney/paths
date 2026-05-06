import { renderTable, renderBall, renderCuePath } from './renderer.js';
import { loadDraft, saveDraft, exportJSON } from './storage.js';
import { emptyCatalogue, TIP_CELLS, PACE_BUCKETS } from './schema.js';
import { simplify, pointsToPath } from './path-trace.js';

let catalogue = loadDraft();
let activePatternId = null;
let editing = {
  cueBall: null, objectBall: null, objectBallColor: 'red',
  blockers: [], pocket: null,
  cuePath: null, obFinal: null,
  tip: null, pace: null,
  step: 'placeCue', // placeCue | placeOB | drawPath | placeOBFinal | pickInputs | done
};
let traceBuffer = null;

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
  document.getElementById('redo-path').addEventListener('click', () => {
    editing.cuePath = null;
    editing.obFinal = null;
    editing.step = 'drawPath';
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
    pattern.variants.push({
      id: vId,
      label: `${editing.tip} ${editing.pace}`,
      tip: editing.tip,
      pace: editing.pace,
      cuePath: editing.cuePath,
      obFinal: editing.obFinal,
    });
    saveDraft(catalogue);
    refreshPatternList();
    document.getElementById('pattern-select').value = pattern.id;
    // Reset for next variant — keep setup, clear path/inputs.
    editing = {
      ...editing,
      cuePath: null, obFinal: null, tip: null, pace: null, step: 'drawPath',
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
        step: 'drawPath',
        cuePath: null, obFinal: null, tip: null, pace: null,
      };
      document.getElementById('ob-color').value = editing.objectBallColor;
    } else {
      nameInput.value = '';
      editing = {
        cueBall: null, objectBall: null, objectBallColor: 'red',
        blockers: [], pocket: null,
        cuePath: null, obFinal: null, tip: null, pace: null, step: 'placeCue'
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
  el.innerHTML = TIP_CELLS.map(t => `<button class="tip-cell" data-tip="${t}">${t}</button>`).join('');
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
  const ok = editing.cueBall && editing.objectBall && editing.cuePath && editing.obFinal && editing.tip && editing.pace;
  document.getElementById('save-variant').disabled = !ok;
}
function redraw() {
  const canvas = document.getElementById('canvas');
  canvas.innerHTML = '';
  const svg = renderTable();
  if (editing.cueBall) svg.appendChild(renderBall({ ...editing.cueBall, color: 'white' }));
  if (editing.objectBall) svg.appendChild(renderBall({ ...editing.objectBall, color: editing.objectBallColor }));
  for (const b of editing.blockers) svg.appendChild(renderBall(b));
  if (editing.cuePath) svg.appendChild(renderCuePath(editing.cuePath));
  if (editing.obFinal) {
    const m = renderBall({ ...editing.obFinal, color: editing.objectBallColor });
    m.setAttribute('opacity', 0.35);
    m.setAttribute('data-role', 'ob-final');
    svg.appendChild(m);
  }
  canvas.appendChild(svg);
  bindCanvasInteractions(svg);
}

function svgPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function bindCanvasInteractions(svg) {
  svg.addEventListener('pointerdown', e => {
    const p = svgPoint(svg, e);
    if (editing.step === 'placeCue') { editing.cueBall = { x:p.x, y:p.y }; editing.step = 'placeOB'; redraw(); updateStepHint(); return; }
    if (editing.step === 'placeOB')  { editing.objectBall = { x:p.x, y:p.y }; editing.step = 'drawPath'; redraw(); updateStepHint(); return; }
    if (editing.step === 'placeOBFinal') { editing.obFinal = { x:p.x, y:p.y }; editing.step = 'pickInputs'; redraw(); updateStepHint(); maybeEnableSave(); return; }
    if (editing.step === 'drawPath') {
      traceBuffer = [{ x: p.x, y: p.y }];
      svg.setPointerCapture(e.pointerId);
    }
  });
  svg.addEventListener('pointermove', e => {
    if (editing.step !== 'drawPath' || !traceBuffer) return;
    const p = svgPoint(svg, e);
    const last = traceBuffer[traceBuffer.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 8) return; // throttle
    traceBuffer.push({ x: p.x, y: p.y });
    editing.cuePath = pointsToPath(simplify(traceBuffer, 4));
    redraw();
  });
  svg.addEventListener('pointerup', e => {
    if (editing.step !== 'drawPath' || !traceBuffer) return;
    editing.cuePath = pointsToPath(simplify(traceBuffer, 4));
    traceBuffer = null;
    editing.step = 'placeOBFinal';
    redraw(); updateStepHint();
  });
}

function updateStepHint() {
  const hints = {
    placeCue: 'Tap to place cue ball',
    placeOB: 'Tap to place object ball',
    drawPath: 'Drag to trace cue ball path',
    placeOBFinal: 'Tap to mark object ball final position',
    pickInputs: 'Pick tip cell and pace, then Save',
  };
  document.getElementById('step-hint').textContent = hints[editing.step] || '';
}
