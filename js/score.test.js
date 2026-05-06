import { test, assert, assertEqual } from './tests.js';
import { recordResult, getStats, clearAllStats } from './score.js';

test('getStats returns null for unknown variant', () => {
  clearAllStats();
  assertEqual(getStats('PPX-z'), null);
});

test('recordResult correct increments correctCount + sets lastResult', () => {
  clearAllStats();
  recordResult('PP1-a', true);
  const s = getStats('PP1-a');
  assertEqual(s.correctCount, 1);
  assertEqual(s.wrongCount, 0);
  assertEqual(s.lastResult, 'correct');
  assert(typeof s.lastSeen === 'number');
});

test('recordResult wrong increments wrongCount', () => {
  clearAllStats();
  recordResult('PP1-a', false);
  const s = getStats('PP1-a');
  assertEqual(s.correctCount, 0);
  assertEqual(s.wrongCount, 1);
  assertEqual(s.lastResult, 'wrong');
});

test('multiple recordResults accumulate', () => {
  clearAllStats();
  recordResult('PP1-a', true);
  recordResult('PP1-a', false);
  recordResult('PP1-a', true);
  const s = getStats('PP1-a');
  assertEqual(s.correctCount, 2);
  assertEqual(s.wrongCount, 1);
  assertEqual(s.lastResult, 'correct');
});

test('clearAllStats wipes everything', () => {
  recordResult('PP1-a', true);
  clearAllStats();
  assertEqual(getStats('PP1-a'), null);
});
