import { renderTable } from './renderer.js';
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
  document.getElementById('canvas').appendChild(renderTable());
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
function bindPatternSelect() { /* implement in next task */ }
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
