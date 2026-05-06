import { runTests } from './tests.js';

const params = new URLSearchParams(location.search);

if (params.has('test')) {
  runTests();
} else if (params.has('edit')) {
  const { mountEditor } = await import('./editor.js');
  mountEditor(document.getElementById('root'));
} else {
  const { mountPuzzle } = await import('./puzzle.js');
  mountPuzzle(document.getElementById('root'));
}
