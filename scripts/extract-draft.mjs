// One-off bootstrap: turns the RAW table inside reference/draft.html into
// src/data/objects.json and src/data/i18n/it.json. After phase 2 the JSON files
// are the source of truth, so the script refuses to overwrite them without --force.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { slugify } from '../src/lib/slug.ts';

const root = new URL('../', import.meta.url);
const objectsUrl = new URL('src/data/objects.json', root);
const itUrl = new URL('src/data/i18n/it.json', root);

if (existsSync(objectsUrl) && !process.argv.includes('--force')) {
  console.error('src/data/objects.json already exists. Re-run with --force to overwrite it.');
  process.exit(1);
}

/** Explicit ids for names that would otherwise collide. */
const ID_OVERRIDES = {};

const draft = readFileSync(new URL('reference/draft.html', root), 'utf8');
const match = draft.match(/const RAW=`([\s\S]*?)`;/);
if (!match) {
  console.error('RAW table not found in reference/draft.html');
  process.exit(1);
}

const rows = match[1].trim().split('\n').map((line) => {
  const [name, size, kind, glyph = '', flags = '', desc = ''] = line.split('|');
  return { id: ID_OVERRIDES[name] ?? slugify(name), name, size: Number(size), kind, glyph, flags: [...flags], desc };
});

const seen = new Map();
for (const row of rows) seen.set(row.id, [...(seen.get(row.id) ?? []), row.name]);
const clashes = [...seen].filter(([, names]) => names.length > 1);
if (clashes.length) {
  console.error('Duplicate ids, add them to ID_OVERRIDES:');
  for (const [id, names] of clashes) console.error(`  ${id}: ${names.join(' / ')}`);
  process.exit(1);
}

rows.sort((a, b) => a.size - b.size);

const objects = rows.map(({ id, size, kind, glyph, flags }) => ({
  id, size, kind, glyph, flags, image: null, sources: [], verified: null,
}));
const previousUi = existsSync(itUrl) ? JSON.parse(readFileSync(itUrl, 'utf8')).ui : {};
const it = { ui: previousUi, objects: Object.fromEntries(rows.map((r) => [r.id, { name: r.name, desc: r.desc }])) };

writeFileSync(objectsUrl, JSON.stringify(objects, null, 2) + '\n');
writeFileSync(itUrl, JSON.stringify(it, null, 2) + '\n');
console.log(`Extracted ${objects.length} objects.`);
