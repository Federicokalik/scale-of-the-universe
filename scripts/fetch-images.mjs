// Downloads the photographs chosen in images/choices.json and prepares them for the site.
//   node scripts/fetch-images.mjs [id ...]      (no ids = every choice not yet done; --force redoes them)
// For each object it writes public/img/<id>-256.webp (canvas) and <id>-800.webp (card),
// records the credit in src/data/credits.json and sets image + imageShape in src/data/objects.json.
// Behind a proxy run it with NODE_USE_ENV_PROXY=1.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const UA = 'ScaleOfTheUniverse-build/0.1 (image licence check; static educational site)';
const force = process.argv.includes('--force');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback);

const choices = readJson('images/choices.json', {});
const objects = readJson('src/data/objects.json');
const credits = readJson('src/data/credits.json', {});
const byId = new Map(objects.map((o) => [o.id, o]));

/** Round bodies are cut to a disc; faint or irregular sky objects glow on black; everything else sits in a frame. */
const ROUND = new Set(
  'sole mercurio venere terra luna marte giove urano nettuno plutone caronte cerere io europa ganimede callisto titano tritone titania miranda mimas encelado'.split(' '),
);
function defaultShape(object) {
  if (ROUND.has(object.id)) return 'disc';
  return 'pshnxc'.includes(object.kind) ? 'glow' : 'frame';
}

async function download(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(8000 * attempt);
    }
  }
}

/** Author as plain words: no addresses, no empty brackets, not longer than a caption can hold. */
const tidy = (text) =>
  (text ?? '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\(\s*[&,;]*\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;)])/g, '$1')
    .trim()
    .slice(0, 90);

/** A soft round mask, so an additive image never shows the edge of its rectangle. */
const fade = (size) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="g"><stop offset="0.72" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );

async function canvasTile(source, shape) {
  const SIZE = 256;
  if (shape === 'disc') {
    return sharp(source).trim({ threshold: 18 }).resize(SIZE, SIZE, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
  }
  if (shape === 'glow') {
    const fitted = await sharp(source).resize(SIZE, SIZE, { fit: 'contain', background: '#000' }).flatten({ background: '#000' }).toBuffer();
    return sharp(fitted).composite([{ input: fade(SIZE), blend: 'multiply' }]).webp({ quality: 80 }).toBuffer();
  }
  return sharp(source).flatten({ background: '#fff' }).resize(SIZE, SIZE, { fit: 'cover', position: 'attention' }).webp({ quality: 80 }).toBuffer();
}

mkdirSync('public/img', { recursive: true });
mkdirSync('images/originals', { recursive: true });

const todo = Object.keys(choices).filter((id) => !id.startsWith('_') && (!only.length || only.includes(id)));
const done = [];
const problems = [];
for (const id of todo) {
  const choice = typeof choices[id] === 'number' ? { pick: choices[id] } : choices[id];
  const object = byId.get(id);
  if (!object) {
    problems.push(`${id}: no such object`);
    continue;
  }
  if (!choice.pick) continue; // 0 = no photograph: the object gets an illustration
  const small = `public/img/${id}-256.webp`;
  const large = `public/img/${id}-800.webp`;
  if (!force && existsSync(small) && existsSync(large) && credits[id]) continue;

  const candidates = readJson(`images/candidates/${id}.json`, []);
  const chosen = candidates[choice.pick - 1];
  if (!chosen) {
    problems.push(`${id}: choice ${choice.pick} is not among its ${candidates.length} candidate(s)`);
    continue;
  }
  try {
    // Large originals are fetched as a 1280 px rendition: enough for an 800 px card image.
    const url = Math.max(chosen.width, chosen.height) > 1600 ? chosen.thumb.replace(/\/\d+px-/, '/1280px-') : chosen.original;
    const source = await download(url);
    writeFileSync(`images/originals/${id}`, source);
    const shape = choice.shape ?? defaultShape(object);
    writeFileSync(small, await canvasTile(source, shape));
    writeFileSync(large, await sharp(source).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer());
    credits[id] = {
      title: chosen.file.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''),
      author: tidy(chosen.author) || tidy(chosen.credit) || 'Wikimedia Commons',
      licence: chosen.licence,
      licenceUrl: chosen.licenceUrl || '',
      page: chosen.page,
    };
    object.image = id;
    object.imageShape = shape;
    done.push(id);
  } catch (error) {
    problems.push(`${id}: ${error.message}`);
  }
  await sleep(600);
}

const sorted = Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync('src/data/credits.json', JSON.stringify(sorted, null, 2) + '\n');
writeFileSync('src/data/objects.json', JSON.stringify(objects, null, 2) + '\n');
console.log(`${done.length} image(s) prepared${done.length ? `: ${done.join(', ')}` : ''}.`);
for (const problem of problems) console.log(`  problem: ${problem}`);
