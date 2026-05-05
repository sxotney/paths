import { runTests } from './tests.js';

const params = new URLSearchParams(location.search);

if (params.has('test')) {
  runTests();
} else if (params.has('edit')) {
  const { mountEditor } = await import('./editor.js');
  mountEditor(document.getElementById('root'));
} else {
  document.getElementById('root').innerHTML =
    '<p style="padding:1rem">Puzzle mode is M2. Use <code>?edit=1</code> for the editor or <code>?test=1</code> to run tests.</p>';
}
