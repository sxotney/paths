const KEY = 'paths.score.v1';

function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function saveAll(all) { localStorage.setItem(KEY, JSON.stringify(all)); }

export function recordResult(variantId, correct) {
  const all = loadAll();
  const cur = all[variantId] || { lastSeen: 0, correctCount: 0, wrongCount: 0, lastResult: null };
  cur.lastSeen = Date.now();
  if (correct) { cur.correctCount += 1; cur.lastResult = 'correct'; }
  else { cur.wrongCount += 1; cur.lastResult = 'wrong'; }
  all[variantId] = cur;
  saveAll(all);
}

export function recordSeenWithoutGuess(variantId) {
  const all = loadAll();
  const cur = all[variantId] || { lastSeen: 0, correctCount: 0, wrongCount: 0, lastResult: null };
  cur.lastSeen = Date.now();
  cur.lastResult = 'shown';
  all[variantId] = cur;
  saveAll(all);
}

export function getStats(variantId) {
  const all = loadAll();
  return all[variantId] || null;
}

export function clearAllStats() { localStorage.removeItem(KEY); }
