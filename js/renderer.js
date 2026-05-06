import { TABLE } from './schema.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Standard mm positions on a 3569×1778 playing area.
// viewBox uses x: 0..3569 (long axis), y: 0..1778 (short axis).
// Six pockets: four corners + two mid-pockets on the long cushions.
// Naming: T = y=0 edge, B = y=1778 edge, L = x=0 edge, R = x=3569 edge.
// Visual orientation (which is "top") is set by CSS transform on the SVG host.

const POCKETS = [
  { id: 'TL', x: 0,         y: 0    },
  { id: 'TM', x: 3569/2,    y: 0    },
  { id: 'TR', x: 3569,      y: 0    },
  { id: 'BL', x: 0,         y: 1778 },
  { id: 'BM', x: 3569/2,    y: 1778 },
  { id: 'BR', x: 3569,      y: 1778 },
];

// Snooker spot standard positions:
// - Baulk line at x=737 from baulk cushion. D-radius 292.
// - Yellow / green at the ends of the baulk line; brown at D centre.
// - Blue at table centre.
// - Black at 324 mm from the top cushion (x = 3569 - 324 = 3245).
// - Pink at midpoint between centre and black: (1784.5 + 3245) / 2 ≈ 2515.
const SPOTS = {
  yellow: { x: 737,     y: 1778/2 + 292 },
  green:  { x: 737,     y: 1778/2 - 292 },
  brown:  { x: 737,     y: 1778/2 },
  blue:   { x: 3569/2,  y: 1778/2 },
  pink:   { x: 2515,    y: 1778/2 },
  black:  { x: 3569 - 324, y: 1778/2 },
};

const SPOT_COLOR = {
  yellow:'#e8c948', green:'#1e7a3e', brown:'#6b3a1f',
  blue:'#1d4ea8', pink:'#e8a4b8', black:'#111',
};

export function renderTable() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${TABLE.width} ${TABLE.height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('data-role', 'table');

  // Cloth background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width', TABLE.width);
  bg.setAttribute('height', TABLE.height);
  bg.setAttribute('fill', '#0a4d2e');
  svg.appendChild(bg);

  // Pockets
  for (const p of POCKETS) {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', p.x);
    c.setAttribute('cy', p.y);
    c.setAttribute('r', 60);
    c.setAttribute('fill', '#000');
    c.setAttribute('data-role', 'pocket');
    c.setAttribute('data-id', p.id);
    svg.appendChild(c);
  }

  // Baulk line
  const baulk = document.createElementNS(SVG_NS, 'line');
  baulk.setAttribute('x1', 737); baulk.setAttribute('y1', 0);
  baulk.setAttribute('x2', 737); baulk.setAttribute('y2', TABLE.height);
  baulk.setAttribute('stroke', 'rgba(255,255,255,0.25)');
  baulk.setAttribute('stroke-width', 4);
  baulk.setAttribute('data-role', 'baulk-line');
  svg.appendChild(baulk);

  // D arc
  const d = document.createElementNS(SVG_NS, 'path');
  const cy = TABLE.height / 2;
  d.setAttribute('d', `M737,${cy - 292} A292,292 0 0,0 737,${cy + 292}`);
  d.setAttribute('stroke', 'rgba(255,255,255,0.25)');
  d.setAttribute('stroke-width', 4);
  d.setAttribute('fill', 'none');
  d.setAttribute('data-role', 'd-arc');
  svg.appendChild(d);

  // Spots
  for (const [name, pos] of Object.entries(SPOTS)) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', pos.x);
    dot.setAttribute('cy', pos.y);
    dot.setAttribute('r', 6);
    dot.setAttribute('fill', SPOT_COLOR[name]);
    dot.setAttribute('opacity', 0.9);
    dot.setAttribute('data-role', 'spot');
    dot.setAttribute('data-name', name);
    svg.appendChild(dot);
  }

  return svg;
}

const BALL_FILL = {
  white:'#f4f1e8', red:'#c8313c', yellow:'#e8c948', green:'#1e7a3e',
  brown:'#6b3a1f', blue:'#1d4ea8', pink:'#e8a4b8', black:'#111'
};
const BALL_RADIUS = 78.75; // mm — 3× snooker ball radius for legibility on phone screens

export function renderBall({ x, y, color }) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', x);
  c.setAttribute('cy', y);
  c.setAttribute('r', BALL_RADIUS);
  c.setAttribute('fill', BALL_FILL[color] || '#999');
  c.setAttribute('stroke', 'rgba(0,0,0,0.4)');
  c.setAttribute('stroke-width', 1.5);
  c.setAttribute('data-role', 'ball');
  c.setAttribute('data-color', color);
  return c;
}

export function renderCuePath(d) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('data-role', 'cue-path');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', '#f4f1e8');
  path.setAttribute('stroke-width', 4);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  g.appendChild(path);
  // Endpoint marker — read last coord from d attribute.
  const m = d.match(/([\d.\-]+)[, ]([\d.\-]+)\s*$/);
  if (m) {
    const ep = document.createElementNS(SVG_NS, 'circle');
    ep.setAttribute('cx', m[1]);
    ep.setAttribute('cy', m[2]);
    ep.setAttribute('r', 14);
    ep.setAttribute('fill', 'none');
    ep.setAttribute('stroke', '#f4f1e8');
    ep.setAttribute('stroke-width', 3);
    ep.setAttribute('data-role', 'endpoint');
    g.appendChild(ep);
  }
  return g;
}
