import { renderTable, renderBall, renderCueLines } from './renderer.js';
import { loadShipped } from './storage.js';
import { pickVariant } from './picker.js';
import { tipWidgetSVG } from './tip-widget.js';
import { PACE_BUCKETS } from './schema.js';

let catalogue = null;
let current = null; // { pattern, variant }

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
}

function loadNext() {
  current = pickVariant(catalogue);
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
  }));
  // Solid balls on top
  svg.appendChild(renderBall({ ...pattern.setup.cueBall, color: 'white' }));
  svg.appendChild(renderBall({ ...pattern.setup.objectBall }));
  for (const b of pattern.setup.blockers) svg.appendChild(renderBall(b));
  canvas.appendChild(svg);
}
