export const TIP_CELLS = ['TL','T','TR','L','C','R','BL','B','BR'];
export const PACE_BUCKETS = ['gentle','medium','firm','hard'];
export const TABLE = { width: 3569, height: 1778 };
export const BALL_COLORS = ['white','red','yellow','green','brown','blue','pink','black'];

export function emptyCatalogue() {
  return { version: 1, table: { ...TABLE }, patterns: [] };
}

function isPoint(p) {
  return p && typeof p.x === 'number' && typeof p.y === 'number';
}

function validateVariant(v) {
  if (!v.id || typeof v.id !== 'string') return 'variant.id missing';
  if (!TIP_CELLS.includes(v.tip)) return `variant.tip invalid: ${v.tip}`;
  if (!PACE_BUCKETS.includes(v.pace)) return `variant.pace invalid: ${v.pace}`;
  if (typeof v.cuePath !== 'string' || !v.cuePath.startsWith('M')) return 'variant.cuePath must be SVG path d starting with M';
  if (!isPoint(v.obFinal)) return 'variant.obFinal missing point';
  return null;
}

function validatePattern(p) {
  if (!p.id || typeof p.id !== 'string') return 'pattern.id missing';
  if (!p.setup || !isPoint(p.setup.cueBall)) return 'pattern.setup.cueBall missing';
  if (!isPoint(p.setup.objectBall)) return 'pattern.setup.objectBall missing';
  if (!Array.isArray(p.setup.blockers)) return 'pattern.setup.blockers must be array';
  if (!Array.isArray(p.variants)) return 'pattern.variants must be array';
  for (const v of p.variants) {
    const err = validateVariant(v);
    if (err) return `pattern ${p.id}: ${err}`;
  }
  return null;
}

export function validateCatalogue(c) {
  if (!c || c.version !== 1) return { ok: false, error: 'catalogue.version must be 1' };
  if (!c.table || typeof c.table.width !== 'number') return { ok: false, error: 'catalogue.table.width missing' };
  if (!Array.isArray(c.patterns)) return { ok: false, error: 'catalogue.patterns must be array' };
  for (const p of c.patterns) {
    const err = validatePattern(p);
    if (err) return { ok: false, error: err };
  }
  return { ok: true };
}
