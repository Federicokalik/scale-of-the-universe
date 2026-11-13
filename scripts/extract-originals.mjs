// Reads, from the draft this project started from, the values it recorded for the 2012 list
// ("L'originale: 80 km") and writes them in metres to src/data/originals.json.
//   node scripts/extract-originals.mjs
// Only plain figures are taken. A remark in words ("the original confused it with the radius") is left out:
// it cannot be shown as a number. The values are the draft's notes; they were not re-checked on the original site.
import { readFileSync, writeFileSync } from 'node:fs';

const slugify = (name) =>
  name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const UNIT = { 'Å': 1e-10, UA: 1.495978707e11, nm: 1e-9, 'µm': 1e-6, mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, 'milioni di km': 1e9, 'miliardi di km': 1e12, 'anni luce': 9.4607e15 };
const POWER = { '⁻': '-', '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };

const ids = new Set(JSON.parse(readFileSync('src/data/objects.json', 'utf8')).map((o) => o.id));
const out = {};
const skipped = [];
for (const line of readFileSync('reference/draft.html', 'utf8').split('\n')) {
  const fields = line.split('|');
  if (fields.length < 6 || !/originale/i.test(line)) continue;
  const id = slugify(fields[0]);
  if (!ids.has(id)) continue;
  const note = fields.slice(5).join('|');
  const plain = note.match(/L'originale(?::| indicava| fermava il confine a)\s*([\d.,]+)\s*(miliardi di km|milioni di km|anni luce|UA|Å|nm|µm|mm|cm|km|m)(?![\wÀ-ÿ])/);
  // A bare figure right after a size in light-years is in light-years too ("Circa 230 anni luce. L'originale: 60.").
  const bare = note.match(/anni luce\. L'originale:\s*([\d.,]+)\.?\s*$/);
  const power = note.match(/L'originale[^.]*?10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)\s*m\b/);
  if (plain) out[id] = Number((Number(plain[1].replace(/\./g, '').replace(',', '.')) * UNIT[plain[2]]).toPrecision(6));
  else if (bare) out[id] = Number((Number(bare[1].replace(/\./g, '').replace(',', '.')) * UNIT['anni luce']).toPrecision(6));
  else if (power) out[id] = 10 ** Number([...power[1]].map((c) => POWER[c]).join(''));
  else skipped.push(`${id}: ${note.slice(note.search(/L'originale|originale/)).slice(0, 80)}`);
}
writeFileSync('src/data/originals.json', JSON.stringify(out, null, 2) + '\n');
console.log(`${Object.keys(out).length} original value(s) written.`);
for (const s of skipped) console.log(`  left out: ${s}`);
