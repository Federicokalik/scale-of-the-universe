// Checks src/data for coherence. Exit code 0 when clean, 1 with a list of problems.
// --strict also requires a source, a verification date, an image and a description
// for every object (used from phase 2 onwards).
import { readFileSync } from 'node:fs';
import { ENABLED_LOCALES } from '../src/data/locales.ts';
import { validateData } from '../src/lib/validate.ts';

const read = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));
const objects = read('objects.json');
const locales = Object.fromEntries(ENABLED_LOCALES.map((l) => [l.code, read(`i18n/${l.code}.json`)]));
const strict = process.argv.includes('--strict');

const problems = validateData(objects, locales, { strict });
if (problems.length) {
  const shown = problems.slice(0, 40);
  console.error(`${problems.length} problem(s) found${strict ? ' (strict)' : ''}:`);
  for (const p of shown) console.error(`  - ${p}`);
  if (problems.length > shown.length) console.error(`  ... and ${problems.length - shown.length} more`);
  process.exit(1);
}
console.log(`Data OK: ${objects.length} objects, ${Object.keys(locales).length} locale(s)${strict ? ' (strict)' : ''}.`);
