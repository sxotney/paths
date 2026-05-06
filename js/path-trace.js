// Ramer-Douglas-Peucker simplification
function perpDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx*dx + dy*dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  const px = a.x + t * dx, py = a.y + t * dy;
  return Math.hypot(p.x - px, p.y - py);
}

export function simplify(points, epsilon = 2) {
  if (points.length < 3) return points.slice();
  let maxDist = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; idx = i; }
  }
  if (maxDist > epsilon) {
    const left = simplify(points.slice(0, idx + 1), epsilon);
    const right = simplify(points.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

// Convert simplified points into an SVG path d using quadratic curves through midpoints.
export function pointsToPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i+1].x) / 2;
    const my = (points[i].y + points[i+1].y) / 2;
    d += ` Q${points[i].x},${points[i].y} ${mx},${my}`;
  }
  const last = points[points.length - 1];
  d += ` T${last.x},${last.y}`;
  return d;
}
