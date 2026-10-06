// Builds public/data/icons.json: every icon in the Material Symbols Rounded font,
// with search tags, most popular first. Re-run to pick up new icons from Google:
//   npm run icons

import fs from 'node:fs';
import path from 'node:path';

const CODEPOINTS_URL =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsRounded%5BFILL,GRAD,opsz,wght%5D.codepoints';
const METADATA_URL = 'https://fonts.google.com/metadata/icons'; // tags + popularity
const OUTPUT = path.resolve('public', 'data', 'icons.json');

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download ${url} (${res.status})`);
  return res.text();
}

const [codepointsText, metadataText] = await Promise.all([download(CODEPOINTS_URL), download(METADATA_URL)]);

// Metadata starts with an anti-JSON-hijacking prefix: )]}'
const metadata = JSON.parse(metadataText.slice(metadataText.indexOf('{')));
const info = new Map(metadata.icons.map(icon => [icon.name, icon]));

// Several names can point at the same glyph (aliases). Keep one name per glyph,
// preferring the one Google's metadata knows about.
const byCodepoint = new Map();
for (const line of codepointsText.trim().split('\n')) {
  const [name, codepoint] = line.trim().split(' ');
  const current = byCodepoint.get(codepoint);
  if (!current || (!info.has(current) && info.has(name))) byCodepoint.set(codepoint, name);
}

const icons = [...byCodepoint.values()]
  .map(name => {
    const meta = info.get(name);
    const tags = meta ? [...new Set([...meta.tags, ...meta.categories].map(t => t.toLowerCase()))] : [];
    return { name, tags: tags.join(' '), popularity: meta?.popularity ?? 0 };
  })
  .sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name))
  .map(({ name, tags }) => [name, tags]);

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(icons));
console.log(`Wrote ${icons.length} icons to ${path.relative(process.cwd(), OUTPUT)}`);
