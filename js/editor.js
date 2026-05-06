import { renderTable, renderBall, renderCuePath } from './renderer.js';
import { loadDraft, saveDraft, exportJSON } from './storage.js';
import { emptyCatalogue, TIP_CELLS, PACE_BUCKETS } from './schema.js';

let catalogue = loadDraft();
let activePatternId = null;
let editing = {
  cueBall: null, objectBall: null, objectBallColor: 'red',
  blockers: [], pocket: null,
  cuePath: null, obFinal: null,
  tip: null, pace: null,
  step: 'placeCue', // placeCue | placeOB | drawPath | placeOBFinal | pickInputs | done
};

export function mountEditor(root) {
  root.innerHTML = `
    <header class="bar">
      <select id="pattern-select"><option value="">(new pattern)</option></select>
      <input id="pattern-name" placeholder="Pattern name"/>
      <button id="export">Export</button>
    </header>
    <section id="canvas"></section>
    <footer class="bar bar-bottom">
      <div id="step-hint"></div>
      <div id="tip-grid"></div>
      <div id="pace-buttons"></div>
      <button id="save-variant" disabled>Save variant</button>
    </footer>
  `;
  redraw();
  refreshPatternList();
  bindPatternSelect();
  bindExport();
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
    } else {
      nameInput.value = '';
      editing = {
        cueBall: null, objectBall: null, objectBallColor: 'red',
        blockers: [], pocket: null,
        cuePath: null, obFinal: null, tip: null, pace: null, step: 'placeCue'
      };
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

function bindCanvasInteractions(svg) {
  // implemented in Task 10
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
