import { TABLE } from './schema.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Standard mm positions on a 3569×1778 playing area.
// viewBox uses x: 0..3569 (long axis), y: 0..1778 (short axis).
// Six pockets: four corners + two mid-pockets on the long cushions.
// Naming: T = y=0 edge, B = y=1778 edge, L = x=0 edge, R = x=3569 edge.
// Visual orientation (which is "top") is set by CSS transform on the SVG host.

const CUSHION = 100; // mm — visible rail/cushion width framing the cloth

// Pocket centres are pushed slightly outside the cloth; pockets are clipped
// to the cloth area so the cushion overlaps the part outside, leaving only a
// small arc visible inside the play area as the pocket mouth.
const POCKETS = [
  { id: 'TL', x: -25,         y: -25        },
  { id: 'TM', x: 3569/2,      y: -30        },
  { id: 'TR', x: 3569 + 25,   y: -25        },
  { id: 'BL', x: -25,         y: 1778 + 25  },
  { id: 'BM', x: 3569/2,      y: 1778 + 30  },
  { id: 'BR', x: 3569 + 25,   y: 1778 + 25  },
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
  svg.setAttribute('viewBox', `${-CUSHION} ${-CUSHION} ${TABLE.width + 2*CUSHION} ${TABLE.height + 2*CUSHION}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('data-role', 'table');

  // Clip-path for cloth area — pockets render only inside this rectangle,
  // so the cushion overlaps any part of a pocket circle that strays onto it.
  const defs = document.createElementNS(SVG_NS, 'defs');
  const clip = document.createElementNS(SVG_NS, 'clipPath');
  clip.setAttribute('id', 'cloth-clip');
  const clipRect = document.createElementNS(SVG_NS, 'rect');
  clipRect.setAttribute('x', 0);
  clipRect.setAttribute('y', 0);
  clipRect.setAttribute('width', TABLE.width);
  clipRect.setAttribute('height', TABLE.height);
  clip.appendChild(clipRect);
  defs.appendChild(clip);
  svg.appendChild(defs);

  // Cushion frame (outer, brown)
  const cushion = document.createElementNS(SVG_NS, 'rect');
  cushion.setAttribute('x', -CUSHION);
  cushion.setAttribute('y', -CUSHION);
  cushion.setAttribute('width', TABLE.width + 2*CUSHION);
  cushion.setAttribute('height', TABLE.height + 2*CUSHION);
  cushion.setAttribute('fill', '#4a2818');
  cushion.setAttribute('data-role', 'cushion');
  svg.appendChild(cushion);

  // Cloth background (inner, green)
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width', TABLE.width);
  bg.setAttribute('height', TABLE.height);
  bg.setAttribute('fill', '#0a4d2e');
  bg.setAttribute('data-role', 'cloth');
  svg.appendChild(bg);

  // Pockets — clipped to cloth so cushion overlaps the part outside the play area
  const pocketGroup = document.createElementNS(SVG_NS, 'g');
  pocketGroup.setAttribute('clip-path', 'url(#cloth-clip)');
  for (const p of POCKETS) {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', p.x);
    c.setAttribute('cy', p.y);
    c.setAttribute('r', 60);
    c.setAttribute('fill', '#000');
    c.setAttribute('data-role', 'pocket');
    c.setAttribute('data-id', p.id);
    pocketGroup.appendChild(c);
  }
  svg.appendChild(pocketGroup);

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
    dot.setAttribute('r', 30);
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
const BALL_RADIUS = 30; // mm — half the pocket radius (60), keeps balls and spots visually consistent

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

export function renderCueLines({ cueBall, objectBall, obFinal, cueFinal, objectBallColor }) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('data-role', 'cue-lines');

  // Aim line: cue → OB (dashed white)
  if (cueBall && objectBall) {
    const aim = document.createElementNS(SVG_NS, 'line');
    aim.setAttribute('x1', cueBall.x);
    aim.setAttribute('y1', cueBall.y);
    aim.setAttribute('x2', objectBall.x);
    aim.setAttribute('y2', objectBall.y);
    aim.setAttribute('stroke', 'rgba(244,241,232,0.65)');
    aim.setAttribute('stroke-width', 4);
    aim.setAttribute('stroke-dasharray', '20 12');
    aim.setAttribute('data-role', 'aim-line');
    g.appendChild(aim);
  }

  // OB line: OB → OB final (in OB's colour, faded)
  if (objectBall && obFinal) {
    const obLine = document.createElementNS(SVG_NS, 'line');
    obLine.setAttribute('x1', objectBall.x);
    obLine.setAttribute('y1', objectBall.y);
    obLine.setAttribute('x2', obFinal.x);
    obLine.setAttribute('y2', obFinal.y);
    obLine.setAttribute('stroke', BALL_FILL[objectBallColor] || '#999');
    obLine.setAttribute('stroke-width', 4);
    obLine.setAttribute('opacity', 0.7);
    obLine.setAttribute('data-role', 'ob-line');
    g.appendChild(obLine);
  }

  // Cue after-contact line: OB → cue final (solid white, with endpoint marker)
  if (objectBall && cueFinal) {
    const cueLine = document.createElementNS(SVG_NS, 'line');
    cueLine.setAttribute('x1', objectBall.x);
    cueLine.setAttribute('y1', objectBall.y);
    cueLine.setAttribute('x2', cueFinal.x);
    cueLine.setAttribute('y2', cueFinal.y);
    cueLine.setAttribute('stroke', '#f4f1e8');
    cueLine.setAttribute('stroke-width', 5);
    cueLine.setAttribute('stroke-linecap', 'round');
    cueLine.setAttribute('data-role', 'cue-line');
    g.appendChild(cueLine);

    const ep = document.createElementNS(SVG_NS, 'circle');
    ep.setAttribute('cx', cueFinal.x);
    ep.setAttribute('cy', cueFinal.y);
    ep.setAttribute('r', 14);
    ep.setAttribute('fill', 'none');
    ep.setAttribute('stroke', '#f4f1e8');
    ep.setAttribute('stroke-width', 3);
    ep.setAttribute('data-role', 'endpoint');
    g.appendChild(ep);
  }

  return g;
}
