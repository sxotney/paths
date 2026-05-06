import { test, assert, assertEqual } from './tests.js';
import { validateCatalogue, emptyCatalogue, TIP_CELLS, PACE_BUCKETS } from './schema.js';

test('TIP_CELLS contents', () => {
  assertEqual(TIP_CELLS, ['T2','TL','T','TR','L2','L','C','R','R2','BL','B','BR','B2']);
});

test('PACE_BUCKETS has 4 entries', () => {
  assertEqual(PACE_BUCKETS, ['gentle','medium','firm','hard']);
});

test('emptyCatalogue is valid', () => {
  const c = emptyCatalogue();
  const r = validateCatalogue(c);
  assert(r.ok, r.error);
});

test('catalogue with one valid pattern + variant is valid', () => {
  const c = {
    version: 1,
    table: { width: 3569, height: 1778 },
    patterns: [{
      id: 'PP1', name: 'Test',
      setup: { cueBall: {x:100,y:100}, objectBall: {x:200,y:200,color:'red'}, blockers: [] },
      variants: [{ id: 'PP1-a', label: 'a', tip: 'C', pace: 'firm', cueFinal: {x:300,y:300}, obFinal: {x:200,y:200} }]
    }]
  };
  assert(validateCatalogue(c).ok);
});

test('rejects unknown tip cell', () => {
  const c = emptyCatalogue();
  c.patterns.push({
    id: 'PPX', name: 'x',
    setup: { cueBall: {x:0,y:0}, objectBall: {x:0,y:0,color:'red'}, blockers: [] },
    variants: [{ id: 'PPX-a', label: '', tip: 'NOPE', pace: 'firm', cueFinal: {x:0,y:0}, obFinal: {x:0,y:0} }]
  });
  assert(!validateCatalogue(c).ok);
});

test('rejects catalogue with wrong version', () => {
  const c = { version: 2, table: { width: 3569, height: 1778 }, patterns: [] };
  assert(!validateCatalogue(c).ok);
});

test('accepts variant with valid waypoints', () => {
  const c = emptyCatalogue();
  c.patterns.push({
    id: 'PP1', name: 'x',
    setup: { cueBall:{x:0,y:0}, objectBall:{x:0,y:0,color:'red'}, blockers:[] },
    variants: [{
      id:'PP1-a', label:'a', tip:'C', pace:'firm',
      cueFinal:{x:1,y:1}, obFinal:{x:2,y:2},
      obWaypoints: [{x:10,y:0},{x:20,y:5}],
      cueWaypoints: [{x:30,y:0}],
    }],
  });
  assert(validateCatalogue(c).ok);
});

test('rejects variant with malformed waypoint', () => {
  const c = emptyCatalogue();
  c.patterns.push({
    id: 'PP1', name: 'x',
    setup: { cueBall:{x:0,y:0}, objectBall:{x:0,y:0,color:'red'}, blockers:[] },
    variants: [{
      id:'PP1-a', label:'a', tip:'C', pace:'firm',
      cueFinal:{x:1,y:1}, obFinal:{x:2,y:2},
      obWaypoints: [{x:10}],  // missing y
    }],
  });
  assert(!validateCatalogue(c).ok);
});
