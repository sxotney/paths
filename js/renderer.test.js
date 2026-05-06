import { test, assert, assertEqual } from './tests.js';
import { renderTable, renderBall, renderCuePath } from './renderer.js';

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

test('renderBall produces a circle with given colour', () => {
  const c = renderBall({ x: 100, y: 200, color: 'red' });
  assertEqual(c.tagName.toLowerCase(), 'circle');
  assertEqual(c.getAttribute('cx'), '100');
});

test('renderCuePath produces a path + endpoint marker', () => {
  const g = renderCuePath('M0,0 L100,100');
  assert(g.querySelector('path'));
  assert(g.querySelector('[data-role="endpoint"]'));
});
