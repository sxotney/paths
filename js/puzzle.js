import { renderTable } from './renderer.js';
import { tipWidgetSVG } from './tip-widget.js';
import { PACE_BUCKETS } from './schema.js';

export function mountPuzzle(root) {
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
  // Render an empty table for now; variant rendering comes in Task 5
  document.getElementById('canvas').appendChild(renderTable());
}
