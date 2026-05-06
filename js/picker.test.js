import { test, assert, assertEqual } from './tests.js';
import { pickVariant, allVariants } from './picker.js';
import { emptyCatalogue } from './schema.js';

test('pickVariant returns null for empty catalogue', () => {
  assertEqual(pickVariant(emptyCatalogue()), null);
});

test('pickVariant returns null for catalogue with no variants', () => {
  const c = emptyCatalogue();
  c.patterns.push({ id: 'PP1', name: 'x', setup: { cueBall:{x:0,y:0}, objectBall:{x:0,y:0,color:'red'}, blockers:[] }, variants: [] });
  assertEqual(pickVariant(c), null);
});

test('pickVariant returns deterministic result with fixed rng=0', () => {
  const c = emptyCatalogue();
  c.patterns.push({
    id: 'PP1', name: 'x',
    setup: { cueBall:{x:1,y:1}, objectBall:{x:2,y:2,color:'red'}, blockers:[] },
    variants: [
      { id:'PP1-a', label:'a', tip:'C', pace:'firm', cueFinal:{x:3,y:3}, obFinal:{x:2,y:2} },
      { id:'PP1-b', label:'b', tip:'T', pace:'firm', cueFinal:{x:4,y:4}, obFinal:{x:2,y:2} },
    ],
  });
  const result = pickVariant(c, () => 0);
  assertEqual(result.variant.id, 'PP1-a');
  assert(result.pattern);
  assertEqual(result.pattern.id, 'PP1');
});

test('pickVariant with rng=0.99 picks last variant', () => {
  const c = emptyCatalogue();
  c.patterns.push({
    id: 'PP1', name: 'x',
    setup: { cueBall:{x:1,y:1}, objectBall:{x:2,y:2,color:'red'}, blockers:[] },
    variants: [
      { id:'PP1-a', label:'a', tip:'C', pace:'firm', cueFinal:{x:3,y:3}, obFinal:{x:2,y:2} },
      { id:'PP1-b', label:'b', tip:'T', pace:'firm', cueFinal:{x:4,y:4}, obFinal:{x:2,y:2} },
    ],
  });
  assertEqual(pickVariant(c, () => 0.99).variant.id, 'PP1-b');
});

test('allVariants flattens patterns', () => {
  const c = emptyCatalogue();
  c.patterns.push({
    id: 'PP1', name: 'a',
    setup: { cueBall:{x:1,y:1}, objectBall:{x:2,y:2,color:'red'}, blockers:[] },
    variants: [
      { id:'PP1-a', label:'a', tip:'C', pace:'firm', cueFinal:{x:3,y:3}, obFinal:{x:2,y:2} },
    ],
  });
  c.patterns.push({
    id: 'PP2', name: 'b',
    setup: { cueBall:{x:5,y:5}, objectBall:{x:6,y:6,color:'red'}, blockers:[] },
    variants: [
      { id:'PP2-a', label:'a', tip:'C', pace:'firm', cueFinal:{x:7,y:7}, obFinal:{x:6,y:6} },
      { id:'PP2-b', label:'b', tip:'T', pace:'firm', cueFinal:{x:8,y:8}, obFinal:{x:6,y:6} },
    ],
  });
  assertEqual(allVariants(c).length, 3);
});
