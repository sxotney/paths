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
  document.body.innerHTML = '<pre id="out" style="padding:1rem;color:#f4f1e8;background:#073a22"></pre>';
  const out = document.getElementById('out');
  let pass = 0, fail = 0;
  for (const t of tests) {
    try { await t.fn(); out.textContent += `PASS  ${t.name}\n`; pass++; }
    catch (e) { out.textContent += `FAIL  ${t.name}\n      ${e.message}\n`; fail++; }
  }
  out.textContent += `\n${pass} passed, ${fail} failed`;
}
