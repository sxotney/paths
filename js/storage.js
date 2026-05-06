import { emptyCatalogue, validateCatalogue } from './schema.js';

const KEY = 'paths.draft.v1';

export function saveDraft(catalogue) {
  const r = validateCatalogue(catalogue);
  if (!r.ok) throw new Error(`refusing to save invalid catalogue: ${r.error}`);
  localStorage.setItem(KEY, JSON.stringify(catalogue));
}

export function loadDraft() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return emptyCatalogue();
  try {
    const c = JSON.parse(raw);
    return validateCatalogue(c).ok ? c : emptyCatalogue();
  } catch { return emptyCatalogue(); }
}

export function clearDraft() { localStorage.removeItem(KEY); }

export function exportJSON(catalogue) {
  return JSON.stringify(catalogue, null, 2);
}

export async function loadShipped() {
  try {
    const r = await fetch('patterns.json');
    if (!r.ok) return emptyCatalogue();
    const c = await r.json();
    return validateCatalogue(c).ok ? c : emptyCatalogue();
  } catch { return emptyCatalogue(); }
}
