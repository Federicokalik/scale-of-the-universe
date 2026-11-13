// Builds src/data/originals.json (object id -> size in the 2012 list, in metres) from
// reference/original-2012.json, the list of Scale of the Universe 2 with each entry paired to an object here.
//   node scripts/extract-originals.mjs            -> writes originals.json and reports
//   node scripts/extract-originals.mjs --flags    -> also sets the "r" and "n" flags in objects.json from it
// The flags then mean exactly what the site says:
//   n  the object is not in the 2012 list
//   r  it is in the 2012 list and its value here differs from the one there by more than 10 %
// (the original gives one or two significant figures, so smaller gaps are mostly rounding).
import { readFileSync, writeFileSync } from 'node:fs';

const THRESHOLD = 0.1;
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const original = read('reference/original-2012.json').objects;
const objects = read('src/data/objects.json');
const known = new Set(objects.map((o) => o.id));

const out = {};
for (const entry of original) {
  if (!entry.ours) continue;
  if (!known.has(entry.ours)) throw new Error(`reference/original-2012.json pairs "${entry.name}" with unknown object ${entry.ours}`);
  if (out[entry.ours]) throw new Error(`two original entries are paired with ${entry.ours}`);
  out[entry.ours] = entry.metres;
}
const ordered = Object.fromEntries(objects.filter((o) => out[o.id]).map((o) => [o.id, out[o.id]]));
writeFileSync('src/data/originals.json', JSON.stringify(ordered, null, 2) + '\n');

const differs = (o) => Math.abs(o.size / out[o.id] - 1) > THRESHOLD;
const fresh = objects.filter((o) => !out[o.id]);
const changed = objects.filter((o) => out[o.id] && differs(o));
console.log(`${Object.keys(ordered).length} objects are in the 2012 list; ${changed.length} differ by more than ${THRESHOLD * 100} %; ${fresh.length} are not in it.`);
console.log(`Original entries with no object here: ${original.filter((e) => !e.ours).map((e) => e.name).join(', ')}.`);

if (process.argv.includes('--flags')) {
  let touched = 0;
  for (const o of objects) {
    const flags = o.flags.filter((f) => f !== 'r' && f !== 'n');
    if (!out[o.id]) flags.push('n');
    else if (differs(o)) flags.push('r');
    const order = ['r', 'n', 'i', 'u'];
    flags.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (flags.join() !== o.flags.join()) touched++;
    o.flags = flags;
  }
  writeFileSync('src/data/objects.json', JSON.stringify(objects, null, 2) + '\n');
  console.log(`Flags set from the list: ${touched} object(s) changed.`);
}
