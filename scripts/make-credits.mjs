// Writes CREDITS.md from src/data: one line per photograph with author, licence and the page that hosts it.
//   node scripts/make-credits.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));
const objects = read('objects.json');
const credits = read('credits.json');
const names = read('i18n/it.json').objects;

const photos = objects.filter((o) => o.image && o.imageShape !== 'art' && credits[o.id]);
const art = objects.filter((o) => o.imageShape === 'art');
const byName = (a, b) => names[a.id].name.localeCompare(names[b.id].name, 'it');

const lines = [
  '# Credits',
  '',
  'Scale of the Universe 2026 is an independent remake of [Scale of the Universe 2](https://scaleofuniverse.com/) by Cary and Michael Huang (2012). Nothing of the original work is copied.',
  '',
  '## Original work',
  '',
  `Code: MIT. Texts and the ${art.length} original illustrations (the SVG files in \`public/img\`): CC BY 4.0, Federico Calicchia.`,
  '',
  '## Photographs',
  '',
  `The ${photos.length} photographs below are the work of others. Each keeps its own licence, also after cropping and resizing; the CC BY 4.0 of this project does not cover them.`,
  '',
  '| Object | Author | Licence | Source |',
  '|---|---|---|---|',
  ...photos.sort(byName).map((o) => {
    const c = credits[o.id];
    const licence = c.licenceUrl ? `[${c.licence}](${c.licenceUrl})` : c.licence;
    return `| ${names[o.id].name} | ${c.author.replace(/\|/g, '/')} | ${licence} | [${c.title.replace(/[|[\]]/g, ' ')}](${c.page}) |`;
  }),
  '',
];
writeFileSync(new URL('../CREDITS.md', import.meta.url), lines.join('\n'));
console.log(`CREDITS.md written: ${photos.length} photograph(s), ${art.length} illustration(s).`);
