import { test, assert, assertEqual } from './tests.js';
import { validateCatalogue, emptyCatalogue, TIP_CELLS, PACE_BUCKETS } from './schema.js';

test('TIP_CELLS has 9 entries', () => {
  assertEqual(TIP_CELLS.length, 9);
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
      variants: [{ id: 'PP1-a', label: 'a', tip: 'C', pace: 'firm', cuePath: 'M100,100 L200,200', obFinal: {x:200,y:200} }]
    }]
  };
  assert(validateCatalogue(c).ok);
});

test('rejects unknown tip cell', () => {
  const c = emptyCatalogue();
  c.patterns.push({
    id: 'PPX', name: 'x',
    setup: { cueBall: {x:0,y:0}, objectBall: {x:0,y:0,color:'red'}, blockers: [] },
    variants: [{ id: 'PPX-a', label: '', tip: 'NOPE', pace: 'firm', cuePath: 'M0,0', obFinal: {x:0,y:0} }]
  });
  assert(!validateCatalogue(c).ok);
});
