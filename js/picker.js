export function allVariants(catalogue) {
  const out = [];
  for (const pattern of catalogue.patterns) {
    for (const variant of pattern.variants) {
      out.push({ pattern, variant });
    }
  }
  return out;
}

export function pickVariant(catalogue, rng = Math.random) {
  const all = allVariants(catalogue);
  if (all.length === 0) return null;
  return all[Math.floor(rng() * all.length)];
}
