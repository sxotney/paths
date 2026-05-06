import { test, assert, assertEqual } from './tests.js';
import { saveDraft, loadDraft, clearDraft, exportJSON } from './storage.js';
import { emptyCatalogue } from './schema.js';

test('loadDraft returns empty catalogue when none stored', () => {
  clearDraft();
  const c = loadDraft();
  assertEqual(c.patterns, []);
});

test('saveDraft + loadDraft round-trips', () => {
  clearDraft();
  const c = emptyCatalogue();
  c.patterns.push({ id: 'PPX', name: 'x', setup: { cueBall:{x:1,y:2}, objectBall:{x:3,y:4,color:'red'}, blockers:[] }, variants: [] });
  saveDraft(c);
  const back = loadDraft();
  assertEqual(back.patterns[0].id, 'PPX');
});

test('exportJSON returns pretty-printed JSON', () => {
  const c = emptyCatalogue();
  const s = exportJSON(c);
  assert(s.includes('\n  '), 'should be indented');
  assert(JSON.parse(s).version === 1);
});
