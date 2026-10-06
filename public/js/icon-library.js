// The full Material Symbols icon list (built by `npm run icons`), loaded on first use.

let iconsPromise = null;

/** Resolves to [[name, tags], …], most popular first. */
export function loadIcons() {
  iconsPromise ||= fetch('data/icons.json').then(res => res.json());
  return iconsPromise;
}

/**
 * Finds icons whose name or tags contain every word of the query.
 * Name matches rank above tag-only matches; otherwise popularity order is kept.
 */
export async function searchIcons(query) {
  const words = query.toLowerCase().trim().split(/[\s_]+/).filter(Boolean);
  if (!words.length) return [];

  const icons = await loadIcons();
  const nameHits = [];
  const tagHits = [];

  for (const [name, tags] of icons) {
    const readableName = name.replace(/_/g, ' ');
    const inName = words.every(word => readableName.includes(word));
    if (inName) nameHits.push(name);
    else if (words.every(word => readableName.includes(word) || tags.includes(word))) tagHits.push(name);
  }
  return [...nameHits, ...tagHits];
}
