import { test, assert, assertEqual } from './tests.js';
import { renderTable } from './renderer.js';

test('renderTable produces an svg element', () => {
  const el = renderTable();
  assertEqual(el.tagName.toLowerCase(), 'svg');
});

test('renderTable contains 6 pockets', () => {
  const el = renderTable();
  assertEqual(el.querySelectorAll('[data-role="pocket"]').length, 6);
});

test('renderTable contains baulk line and D', () => {
  const el = renderTable();
  assert(el.querySelector('[data-role="baulk-line"]'));
  assert(el.querySelector('[data-role="d-arc"]'));
});

test('renderTable has 6 spots (yellow/green/brown/blue/pink/black)', () => {
  const el = renderTable();
  assertEqual(el.querySelectorAll('[data-role="spot"]').length, 6);
});
