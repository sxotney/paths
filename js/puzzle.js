import { renderTable, renderBall, renderCueLines } from './renderer.js';
import { loadShipped } from './storage.js';
import { pickVariant } from './picker.js';
import { tipWidgetSVG } from './tip-widget.js';
import { PACE_BUCKETS } from './schema.js';
import { recordResult, recordSeenWithoutGuess } from './score.js';

let catalogue = null;
let current = null; // { pattern, variant }
let inputState = { tip: null, pace: null, locked: false };

export async function mountPuzzle(root) {
  root.innerHTML = `
    <header class="bar puzzle-bar">
      <span id="puzzle-pattern-name">—</span>
    </header>
    <section id="canvas"></section>
    <footer class="bar bar-bottom puzzle-bar">
      <div id="puzzle-result"></div>
      <div id="puzzle-tip">${tipWidgetSVG()}</div>
      <div id="puzzle-pace">${PACE_BUCKETS.map(p => `<button class="pace-cell" data-pace="${p}">${p}</button>`).join('')}</div>
      <button id="puzzle-show-me" class="ghost-link">Show me</button>
      <button id="puzzle-reveal" disabled>Reveal</button>
      <button id="puzzle-next" hidden>Next</button>
    </footer>
  `;
  catalogue = await loadShipped();
  loadNext();
  bindInputs();
}

function loadNext() {
  current = pickVariant(catalogue);
  inputState = { tip: null, pace: null, locked: false };
  document.querySelectorAll('#puzzle-tip .tip-cell').forEach(x => x.classList.remove('on','correct','wrong'));
  document.querySelectorAll('#puzzle-pace .pace-cell').forEach(x => x.classList.remove('on','correct','wrong'));
  document.getElementById('puzzle-result').textContent = '';
  document.getElementById('puzzle-reveal').disabled = true;
  document.getElementById('puzzle-reveal').hidden = false;
  document.getElementById('puzzle-next').hidden = true;
  const nameEl = document.getElementById('puzzle-pattern-name');
  if (!current) {
    nameEl.textContent = 'No patterns yet — open ?edit=1 to author one.';
    document.getElementById('canvas').innerHTML = '';
    document.getElementById('canvas').appendChild(renderTable());
    return;
  }
  nameEl.textContent = `${current.pattern.id} — ${current.pattern.name}`;
  redraw();
}

function redraw() {
  const canvas = document.getElementById('canvas');
  canvas.innerHTML = '';
  const svg = renderTable();
  if (!current) { canvas.appendChild(svg); return; }
  const { pattern, variant } = current;
  // Cue lines + ghost + destination markers
  svg.appendChild(renderCueLines({
    cueBall: pattern.setup.cueBall,
    objectBall: pattern.setup.objectBall,
    obFinal: variant.obFinal,
    cueFinal: variant.cueFinal,
    objectBallColor: pattern.setup.objectBall.color,
    obWaypoints: variant.obWaypoints,
    cueWaypoints: variant.cueWaypoints,
  }));
  // Solid balls on top
  svg.appendChild(renderBall({ ...pattern.setup.cueBall, color: 'white' }));
  svg.appendChild(renderBall({ ...pattern.setup.objectBall }));
  for (const b of pattern.setup.blockers) svg.appendChild(renderBall(b));
  canvas.appendChild(svg);
}

function bindInputs() {
  const tip = document.getElementById('puzzle-tip');
  const pace = document.getElementById('puzzle-pace');

  tip.addEventListener('click', e => {
    if (inputState.locked) return;
    const b = e.target.closest('.tip-cell');
    if (!b) return;
    inputState.tip = b.dataset.tip;
    tip.querySelectorAll('.tip-cell').forEach(x => x.classList.toggle('on', x === b));
    maybeEnableReveal();
  });
  pace.addEventListener('click', e => {
    if (inputState.locked) return;
    const b = e.target.closest('.pace-cell');
    if (!b) return;
    inputState.pace = b.dataset.pace;
    pace.querySelectorAll('.pace-cell').forEach(x => x.classList.toggle('on', x === b));
    maybeEnableReveal();
  });
  document.getElementById('puzzle-reveal').addEventListener('click', () => {
    if (!current) return;
    revealResult();
  });
  document.getElementById('puzzle-next').addEventListener('click', loadNext);
  document.getElementById('puzzle-show-me').addEventListener('click', () => {
    if (!current || inputState.locked) return;
    showWithoutScoring();
  });
}

function maybeEnableReveal() {
  document.getElementById('puzzle-reveal').disabled = !(inputState.tip && inputState.pace);
}

function revealResult() {
  const { variant } = current;
  const correctTip = variant.tip;
  const correctPace = variant.pace;
  const isCorrect = inputState.tip === correctTip && inputState.pace === correctPace;

  // Highlight tip cells
  document.querySelectorAll('#puzzle-tip .tip-cell').forEach(el => {
    if (el.dataset.tip === correctTip) el.classList.add('correct');
    else if (el.classList.contains('on')) el.classList.add('wrong');
  });
  // Highlight pace cells
  document.querySelectorAll('#puzzle-pace .pace-cell').forEach(el => {
    if (el.dataset.pace === correctPace) el.classList.add('correct');
    else if (el.classList.contains('on')) el.classList.add('wrong');
  });

  document.getElementById('puzzle-result').textContent = isCorrect ? '✓' : '✗';
  document.getElementById('puzzle-reveal').hidden = true;
  document.getElementById('puzzle-next').hidden = false;
  inputState.locked = true;
  recordResult(variant.id, isCorrect);
}

function showWithoutScoring() {
  const { variant } = current;
  const correctTip = variant.tip;
  const correctPace = variant.pace;
  // Mark only the correct cells; player's selection is cleared
  document.querySelectorAll('#puzzle-tip .tip-cell').forEach(el => {
    el.classList.remove('on');
    if (el.dataset.tip === correctTip) el.classList.add('correct');
  });
  document.querySelectorAll('#puzzle-pace .pace-cell').forEach(el => {
    el.classList.remove('on');
    if (el.dataset.pace === correctPace) el.classList.add('correct');
  });
  document.getElementById('puzzle-result').textContent = '';
  document.getElementById('puzzle-reveal').hidden = true;
  document.getElementById('puzzle-next').hidden = false;
  inputState.locked = true;
  recordSeenWithoutGuess(variant.id);
}
