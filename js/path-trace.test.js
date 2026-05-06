import { test, assert, assertEqual } from './tests.js';
import { pointsToPath, simplify } from './path-trace.js';

test('pointsToPath single point returns just M', () => {
  assertEqual(pointsToPath([{x:10,y:20}]), 'M10,20');
});

test('pointsToPath multiple points uses M then Q quadratics', () => {
  const d = pointsToPath([{x:0,y:0},{x:10,y:10},{x:20,y:0}]);
  assert(d.startsWith('M0,0'));
  assert(d.includes('Q'));
});

test('simplify drops collinear-ish points', () => {
  const pts = [{x:0,y:0},{x:5,y:0},{x:10,y:0}];
  const s = simplify(pts, 1);
  assertEqual(s.length, 2);
});

test('simplify keeps distinct points', () => {
  const pts = [{x:0,y:0},{x:5,y:5},{x:10,y:0}];
  const s = simplify(pts, 1);
  assertEqual(s.length, 3);
});
