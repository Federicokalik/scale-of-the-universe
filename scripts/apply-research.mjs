// Validates one or more research files and applies them to src/data.
//   node scripts/apply-research.mjs research/black-holes.json [more.json ...]
//   --check   validate only, write nothing
// Exit code 1 (and nothing written) if any entry has a problem.
import { readFileSync, writeFileSync } from 'node:fs';
import { applyResearch, validateResearch } from '../src/lib/research.ts';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('Usage: node scripts/apply-research.mjs [--check] research/<batch>.json ...');
  process.exit(1);
}

const dataUrl = (p) => new URL(`../src/data/${p}`, import.meta.url);
const read = (url) => JSON.parse(readFileSync(url, 'utf8'));
let objects = read(dataUrl('objects.json'));
let locale = read(dataUrl('i18n/it.json'));

let failed = false;
const summary = [];
for (const file of files) {
  const entries = JSON.parse(readFileSync(file, 'utf8'));
  const problems = validateResearch(entries, objects);
  if (problems.length) {
    failed = true;
    console.error(`${file}: ${problems.length} problem(s)`);
    for (const p of problems) console.error(`  - ${p}`);
    continue;
  }
  const result = applyResearch(objects, locale, entries);
  objects = result.objects;
  locale = result.locale;
  const count = (verdict) => entries.filter((e) => e.verdict === verdict).length;
  summary.push(
    `${file}: ${result.applied.length} applied (${count('confirmed')} confirmed, ${count('corrected')} corrected, ${count('uncertain')} uncertain)` +
      (result.proposedRemovals.length ? `, ${result.proposedRemovals.length} proposed for removal: ${result.proposedRemovals.map((r) => r.id).join(', ')}` : ''),
  );
}

if (failed) process.exit(1);
for (const line of summary) console.log(line);
if (checkOnly) {
  console.log('Check only: nothing written.');
} else {
  writeFileSync(dataUrl('objects.json'), JSON.stringify(objects, null, 2) + '\n');
  writeFileSync(dataUrl('i18n/it.json'), JSON.stringify(locale, null, 2) + '\n');
  const done = objects.filter((o) => o.verified).length;
  console.log(`Data written. ${done} of ${objects.length} objects verified so far.`);
}
