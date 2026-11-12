// Splits the objects that are not verified yet into research batches:
// one category at a time, in size order, at most BATCH objects each.
// Writes research/_input/<batch>.json (what a researcher starts from) and prints the list.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const BATCH = 12;
const NAMES = {
  q: 'particles', a: 'atoms', w: 'waves', m: 'molecules', u: 'units', b: 'biology', o: 'objects', g: 'places',
  p: 'solar-system', s: 'stars', h: 'black-holes', d: 'distances', n: 'nebulae', x: 'galaxies', c: 'cosmic',
};

const read = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));
const objects = read('objects.json');
const it = read('i18n/it.json');
const outDir = new URL('../research/_input/', import.meta.url);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const pending = objects.filter((o) => !o.verified);
const batches = [];
for (const [kind, name] of Object.entries(NAMES)) {
  const group = pending.filter((o) => o.kind === kind);
  const parts = Math.ceil(group.length / BATCH);
  for (let i = 0; i < parts; i++) {
    // Even-sized parts rather than a short last one.
    const slice = group.slice(Math.round((i * group.length) / parts), Math.round(((i + 1) * group.length) / parts));
    const batch = parts > 1 ? `${name}-${i + 1}` : name;
    writeFileSync(
      new URL(`${batch}.json`, outDir),
      JSON.stringify(slice.map((o) => ({ id: o.id, name: it.objects[o.id].name, size: o.size, flags: o.flags, desc: it.objects[o.id].desc })), null, 2) + '\n',
    );
    batches.push(`${batch} (${slice.length})`);
  }
}
console.log(`${pending.length} objects pending in ${batches.length} batches:`);
console.log(batches.join(', '));
