import { TIP_CELLS } from './schema.js';

export const TIP_POS = {
  T2:[50,12], T:[50,30], C:[50,50], B:[50,70], B2:[50,88],
  L2:[12,50], L:[30,50],            R:[70,50], R2:[88,50],
  TL:[30,30], TR:[70,30], BL:[30,70], BR:[70,70],
};

// Returns the inner HTML string for the tip widget. Caller wires events
// and toggles `.on` / `.correct` / `.wrong` classes on `.tip-cell` elements.
export function tipWidgetSVG() {
  const cells = TIP_CELLS.map(t => {
    const [cx, cy] = TIP_POS[t];
    return `<circle class="tip-cell" data-tip="${t}" cx="${cx}" cy="${cy}" r="5"/>`;
  }).join('');
  return `
    <svg viewBox="0 0 100 100">
      <circle class="tip-ball" cx="50" cy="50" r="46"/>
      <line class="tip-axis" x1="50" y1="6" x2="50" y2="94"/>
      <line class="tip-axis" x1="6" y1="50" x2="94" y2="50"/>
      ${cells}
    </svg>
  `;
}
