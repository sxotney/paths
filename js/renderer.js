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
  // Portrait viewBox — short axis horizontal, long axis vertical. Inner content
  // is authored in landscape coords (x = long axis 0..3569, y = short axis
  // 0..1778) and rotated by the wrapper group below; this keeps catalogue
  // data in its natural coordinate system and only the display flips.
  svg.setAttribute('viewBox', `${-CUSHION} ${-CUSHION} ${TABLE.height + 2*CUSHION} ${TABLE.width + 2*CUSHION}`);
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

  // Wrapper group: rotate landscape content (-90°) and translate so the long
  // axis runs vertically on screen. Original (0,0) → (0, TABLE.width).
  const portraitWrap = document.createElementNS(SVG_NS, 'g');
  portraitWrap.setAttribute('transform', `translate(0 ${TABLE.width}) rotate(-90)`);
  portraitWrap.setAttribute('data-role', 'portrait-wrap');
  svg.appendChild(portraitWrap);
  // Use portraitWrap as the parent for everything below by reassigning svg
  // locally; subsequent appendChild calls go to portraitWrap.
  const wrap = portraitWrap;

  // Cushion frame (outer, brown)
  const cushion = document.createElementNS(SVG_NS, 'rect');
  cushion.setAttribute('x', -CUSHION);
  cushion.setAttribute('y', -CUSHION);
  cushion.setAttribute('width', TABLE.width + 2*CUSHION);
  cushion.setAttribute('height', TABLE.height + 2*CUSHION);
  cushion.setAttribute('fill', '#4a2818');
  cushion.setAttribute('data-role', 'cushion');
  wrap.appendChild(cushion);

  // Cloth background (inner, green)
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width', TABLE.width);
  bg.setAttribute('height', TABLE.height);
  bg.setAttribute('fill', '#0a4d2e');
  bg.setAttribute('data-role', 'cloth');
  wrap.appendChild(bg);

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
  wrap.appendChild(pocketGroup);

  // Baulk line
  const baulk = document.createElementNS(SVG_NS, 'line');
  baulk.setAttribute('x1', 737); baulk.setAttribute('y1', 0);
  baulk.setAttribute('x2', 737); baulk.setAttribute('y2', TABLE.height);
  baulk.setAttribute('stroke', 'rgba(255,255,255,0.25)');
  baulk.setAttribute('stroke-width', 4);
  baulk.setAttribute('data-role', 'baulk-line');
  wrap.appendChild(baulk);

  // D arc
  const d = document.createElementNS(SVG_NS, 'path');
  const cy = TABLE.height / 2;
  d.setAttribute('d', `M737,${cy - 292} A292,292 0 0,0 737,${cy + 292}`);
  d.setAttribute('stroke', 'rgba(255,255,255,0.25)');
  d.setAttribute('stroke-width', 4);
  d.setAttribute('fill', 'none');
  d.setAttribute('data-role', 'd-arc');
  wrap.appendChild(d);

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
    wrap.appendChild(dot);
  }

  return svg;
}

const BALL_FILL = {
  white:'#f4f1e8', red:'#c8313c', yellow:'#e8c948', green:'#1e7a3e',
  brown:'#6b3a1f', blue:'#1d4ea8', pink:'#e8a4b8', black:'#111'
};
export const BALL_RADIUS = 30; // mm — half the pocket radius (60), keeps balls and spots visually consistent

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

// Ghost ball: the cue ball's position at the moment of contact with the OB,
// touching it on the side opposite to the OB's outgoing direction.
function ghostBallPosition(objectBall, obFinal) {
  const dx = obFinal.x - objectBall.x;
  const dy = obFinal.y - objectBall.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  return {
    x: objectBall.x - (dx / len) * 2 * BALL_RADIUS,
    y: objectBall.y - (dy / len) * 2 * BALL_RADIUS,
  };
}

export function renderCueLines({ cueBall, objectBall, obFinal, cueFinal, objectBallColor, obWaypoints = [], cueWaypoints = [] }) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('data-role', 'cue-lines');

  // OB's first outgoing target — the first waypoint (cushion strike) if any,
  // else the final position. This drives ghost ball positioning.
  const obFirstTarget = obWaypoints.length > 0 ? obWaypoints[0] : obFinal;
  const ghost = (objectBall && obFirstTarget) ? ghostBallPosition(objectBall, obFirstTarget) : null;

  // Aim line: cue → ghost (preferred), or cue → OB centre as fallback.
  if (cueBall && (ghost || objectBall)) {
    const aimEnd = ghost || objectBall;
    const aim = document.createElementNS(SVG_NS, 'line');
    aim.setAttribute('x1', cueBall.x);
    aim.setAttribute('y1', cueBall.y);
    aim.setAttribute('x2', aimEnd.x);
    aim.setAttribute('y2', aimEnd.y);
    aim.setAttribute('stroke', 'rgba(244,241,232,0.65)');
    aim.setAttribute('stroke-width', 4);
    aim.setAttribute('stroke-dasharray', '20 12');
    aim.setAttribute('data-role', 'aim-line');
    g.appendChild(aim);
  }

  // OB polyline: OB → waypoints → obFinal
  if (objectBall && obFinal) {
    const points = [objectBall, ...obWaypoints, obFinal];
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', toPathD(points));
    path.setAttribute('stroke', BALL_FILL[objectBallColor] || '#999');
    path.setAttribute('stroke-width', 4);
    path.setAttribute('opacity', 0.7);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('data-role', 'ob-line');
    g.appendChild(path);
  }

  // Cue after-contact polyline: ghost → waypoints → cueFinal
  if (ghost && cueFinal) {
    const points = [ghost, ...cueWaypoints, cueFinal];
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', toPathD(points));
    path.setAttribute('stroke', '#f4f1e8');
    path.setAttribute('stroke-width', 5);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('data-role', 'cue-line');
    g.appendChild(path);
  }

  // Ghost ball outline at contact
  if (ghost) {
    const gh = document.createElementNS(SVG_NS, 'circle');
    gh.setAttribute('cx', ghost.x);
    gh.setAttribute('cy', ghost.y);
    gh.setAttribute('r', BALL_RADIUS);
    gh.setAttribute('fill', 'rgba(244,241,232,0.18)');
    gh.setAttribute('stroke', 'rgba(244,241,232,0.7)');
    gh.setAttribute('stroke-width', 2);
    gh.setAttribute('stroke-dasharray', '4 3');
    gh.setAttribute('data-role', 'ghost-ball');
    g.appendChild(gh);
  }

  // OB-final translucent ball
  if (obFinal) {
    const ob = document.createElementNS(SVG_NS, 'circle');
    ob.setAttribute('cx', obFinal.x);
    ob.setAttribute('cy', obFinal.y);
    ob.setAttribute('r', BALL_RADIUS);
    ob.setAttribute('fill', BALL_FILL[objectBallColor] || '#999');
    ob.setAttribute('opacity', 0.35);
    ob.setAttribute('data-role', 'ob-final');
    g.appendChild(ob);
  }

  // Cue-final translucent white ball
  if (cueFinal) {
    const cf = document.createElementNS(SVG_NS, 'circle');
    cf.setAttribute('cx', cueFinal.x);
    cf.setAttribute('cy', cueFinal.y);
    cf.setAttribute('r', BALL_RADIUS);
    cf.setAttribute('fill', BALL_FILL.white);
    cf.setAttribute('opacity', 0.35);
    cf.setAttribute('data-role', 'cue-final');
    g.appendChild(cf);
  }

  return g;
}

function toPathD(points) {
  return points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
}
