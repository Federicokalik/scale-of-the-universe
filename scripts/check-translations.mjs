// Checks every translation in src/data/i18n against the Italian original.
//   node scripts/check-translations.mjs                 -> report; exits 1 on a structural problem
//   node scripts/check-translations.mjs --merge <dir>   -> first builds <code>.json from <dir>/<code>/{ui,chunk-N}.json
// Structural problems (missing or extra keys, empty text, a lost placeholder or HTML tag) are errors.
// A description whose digits differ from the Italian is only listed: a number may rightly be written
// in words, or regrouped, in another language, so a person has to look.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'src/data/i18n';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const source = read(`${DIR}/it.json`);

const mergeAt = process.argv.indexOf('--merge');
if (mergeAt > 0) {
  const from = process.argv[mergeAt + 1];
  for (const code of readdirSync(from).filter((d) => existsSync(`${from}/${d}/ui.json`))) {
    const objects = {};
    for (const file of readdirSync(`${from}/${code}`).filter((f) => /^chunk-\d+\.json$/.test(f)).sort()) Object.assign(objects, read(`${from}/${code}/${file}`));
    const ui = read(`${from}/${code}/ui.json`);
    // Keys are written in the order of the Italian file, whatever order the translation came in.
    const ordered = {
      ui: Object.fromEntries(Object.keys(source.ui).filter((k) => k in ui).map((k) => [k, ui[k]])),
      objects: Object.fromEntries(Object.keys(source.objects).filter((k) => k in objects).map((k) => [k, objects[k]])),
    };
    for (const k of Object.keys(ui)) if (!(k in source.ui)) ordered.ui[k] = ui[k];
    for (const k of Object.keys(objects)) if (!(k in source.objects)) ordered.objects[k] = objects[k];
    writeFileSync(`${DIR}/${code}.json`, JSON.stringify(ordered, null, 2) + '\n');
    console.log(`merged ${code}`);
  }
}

const tokens = (text, pattern) => (text.match(pattern) ?? []).sort().join(' ');
const PLACEHOLDER = /\{\w+\}/g;
const TAG = /<[^>]+>/g;
/** Digits with separators and spaces removed, so 1,609344 and 1.609344 and 12 742 compare equal. */
const digits = (text) =>
  (text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/(\d)[.,   '’]+(?=\d)/g, '$1').match(/\d+/g) ?? []).sort().join(' ');

let errors = 0;
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'it.json').sort()) {
  const code = file.replace('.json', '');
  const locale = read(`${DIR}/${file}`);
  const problems = [];
  const notes = [];
  for (const section of ['ui', 'objects']) {
    for (const key of Object.keys(source[section])) if (!(key in (locale[section] ?? {}))) problems.push(`${section}: missing ${key}`);
    for (const key of Object.keys(locale[section] ?? {})) if (!(key in source[section])) problems.push(`${section}: unknown ${key}`);
  }
  for (const [key, text] of Object.entries(locale.ui ?? {})) {
    const original = source.ui[key];
    if (original === undefined) continue;
    if (typeof text !== 'string' || !text.trim()) problems.push(`ui.${key}: empty`);
    else if (tokens(text, PLACEHOLDER) !== tokens(original, PLACEHOLDER)) problems.push(`ui.${key}: placeholders differ`);
    else if (tokens(text, TAG) !== tokens(original, TAG)) problems.push(`ui.${key}: HTML tags differ`);
  }
  for (const [id, entry] of Object.entries(locale.objects ?? {})) {
    const original = source.objects[id];
    if (!original) continue;
    if (!entry?.name?.trim()) problems.push(`${id}: no name`);
    if (!entry?.desc?.trim()) problems.push(`${id}: no description`);
    else if (digits(entry.desc) !== digits(original.desc)) notes.push(id);
    else if (entry.desc.length < original.desc.length * 0.25 && !/^(zh|ja)/.test(code)) notes.push(`${id} (much shorter)`);
  }
  errors += problems.length;
  console.log(`${code}: ${problems.length} problem(s), ${notes.length} description(s) to look at`);
  for (const problem of problems.slice(0, 40)) console.log(`  problem: ${problem}`);
  if (process.argv.includes('--notes')) for (const note of notes) console.log(`  look: ${note}`);
}
process.exit(errors ? 1 : 0);
