const tests = [];

export function test(name, fn) { tests.push({ name, fn }); }

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

export function assertEqual(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg || 'not equal'}: expected ${e}, got ${a}`);
}

export async function runTests() {
  // import test modules here as they're added
  await import('./schema.test.js');
  await import('./storage.test.js');
  await import('./path-trace.test.js');
  await import('./renderer.test.js');
  await import('./score.test.js');
  await import('./picker.test.js');
  // Backup any production localStorage keys the tests might touch, so a test
  // run can never wipe a real authored catalogue or score history.
  const PRODUCTION_KEYS = ['paths.draft.v1', 'paths.score.v1'];
  const backup = {};
  for (const k of PRODUCTION_KEYS) backup[k] = localStorage.getItem(k);
  document.body.innerHTML = '<pre id="out" style="padding:1rem;color:#f4f1e8;background:#073a22"></pre>';
  const out = document.getElementById('out');
  let pass = 0, fail = 0;
  try {
    for (const t of tests) {
      try { await t.fn(); out.textContent += `PASS  ${t.name}\n`; pass++; }
      catch (e) { out.textContent += `FAIL  ${t.name}\n      ${e.message}\n`; fail++; }
    }
    out.textContent += `\n${pass} passed, ${fail} failed`;
  } finally {
    for (const k of PRODUCTION_KEYS) {
      if (backup[k] !== null) localStorage.setItem(k, backup[k]);
      else localStorage.removeItem(k);
    }
  }
}
