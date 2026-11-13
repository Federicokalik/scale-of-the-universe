// Finds candidate photographs with a usable licence for the objects in images/plan.json.
//   node scripts/find-images.mjs --from 0 --count 12
//   node scripts/find-images.mjs --ids globulo-rosso,colibri     (search these again)
// For each object it writes up to four candidates to images/candidates/<id>.json and
// draws one contact sheet, images/sheets/sheet-<from>.jpg, so a person can pick by eye.
// Wikipedia is used only as a trail to the file on Wikimedia Commons, where the licence is read.
// Behind a proxy run it with NODE_USE_ENV_PROXY=1.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const from = Number(arg('from', 0));
const count = Number(arg('count', 12));
// --ids a,b,c searches those objects again (ignoring what was found before) and draws sheet-redo.jpg.
const only = arg('ids', '').split(',').filter(Boolean);
const force = process.argv.includes('--force') || only.length > 0;

const UA = 'ScaleOfTheUniverse-build/0.1 (image licence check; static educational site)';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const ENWIKI = 'https://en.wikipedia.org/w/api.php';
const ALLOWED = /^(public domain|pd\b|cc0|cc[ -]by([ -]sa)?[ -]\d)/i;
const FORBIDDEN = /\b(nc|nd)\b/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
      if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      await sleep(700);
      return json;
    } catch (error) {
      if (attempt === 5) throw error;
      await sleep(6000 * attempt);
    }
  }
}

const strip = (html) => (html ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const INFO = {
  prop: 'imageinfo',
  iiprop: 'url|size|mime|extmetadata',
  iiurlwidth: '320',
  iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|Credit|ImageDescription|UsageTerms',
};

function candidate(page, via) {
  const info = page.imageinfo?.[0];
  if (!info || !/^image\/(jpeg|png|tiff|webp)$/.test(info.mime)) return null;
  const meta = info.extmetadata ?? {};
  const licence = strip(meta.LicenseShortName?.value) || strip(meta.UsageTerms?.value);
  if (!ALLOWED.test(licence) || FORBIDDEN.test(licence)) return null;
  if (Math.max(info.width, info.height) < 700) return null;
  return {
    file: page.title,
    page: info.descriptionurl,
    original: info.url.split('?')[0],
    thumb: info.thumburl,
    width: info.width,
    height: info.height,
    licence,
    licenceUrl: strip(meta.LicenseUrl?.value),
    author: strip(meta.Artist?.value).slice(0, 200),
    credit: strip(meta.Credit?.value).slice(0, 200),
    description: strip(meta.ImageDescription?.value).slice(0, 240),
    via,
  };
}

async function fromWikipedia(title) {
  const data = await api(ENWIKI, { action: 'query', titles: title, redirects: '1', prop: 'pageimages', piprop: 'name' });
  const name = data.query?.pages?.[0]?.pageimage;
  if (!name) return [];
  const files = await api(COMMONS, { action: 'query', titles: `File:${name}`, ...INFO });
  return (files.query?.pages ?? []).filter((p) => !p.missing).map((p) => candidate(p, `lead image of the English Wikipedia article "${title}"`));
}

async function fromSearch(query, limit) {
  const data = await api(COMMONS, {
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    ...INFO,
  });
  return (data.query?.pages ?? []).sort((a, b) => a.index - b.index).map((p) => candidate(p, `Commons search "${query}"`));
}

async function find(spec) {
  const [mode, ...rest] = spec.split(':');
  const value = rest.join(':');
  const found = mode === 'wiki' ? [...(await fromWikipedia(value)), ...(await fromSearch(value, 6))] : await fromSearch(value, 8);
  const seen = new Set();
  return found.filter((c) => c && !seen.has(c.file) && seen.add(c.file)).slice(0, 4);
}

const plan = JSON.parse(readFileSync('images/plan.json', 'utf8'));
const planned = Object.keys(plan).filter((id) => !id.startsWith('_'));
const unknown = only.filter((id) => !planned.includes(id));
if (unknown.length) throw new Error(`not in images/plan.json: ${unknown.join(', ')}`);
const ids = only.length ? only : planned.slice(from, from + count);
mkdirSync('images/candidates', { recursive: true });
mkdirSync('images/sheets', { recursive: true });

const CELL = 240;
const LABEL = 34;
const composites = [];
const failures = [];
for (const [row, id] of ids.entries()) {
  const path = `images/candidates/${id}.json`;
  let candidates;
  try {
    candidates = !force && existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : await find(plan[id]);
    writeFileSync(path, JSON.stringify(candidates, null, 2) + '\n');
  } catch (error) {
    failures.push(`${id}: ${error.message}`);
    continue;
  }
  if (!candidates.length) failures.push(`${id}: no candidate with a usable licence`);
  // Two objects side by side, so a sheet of twelve stays readable when scaled down.
  const top = Math.floor(row / 2) * (CELL + LABEL);
  const left = (row % 2) * CELL * 4;
  const label = `${from + row}. ${id}  [${plan[id]}]`.replace(/[<&>]/g, '');
  composites.push({
    input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CELL * 4}" height="${LABEL}"><text x="6" y="23" font-family="sans-serif" font-size="18" fill="#fff">${label}</text></svg>`),
    left,
    top,
  });
  for (const [col, c] of candidates.entries()) {
    try {
      let response;
      for (let attempt = 1; ; attempt++) {
        response = await fetch(c.thumb, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
        if (response.ok) break;
        if (attempt === 4) throw new Error(`HTTP ${response.status}`);
        await sleep(5000 * attempt);
      }
      const tile = await sharp(Buffer.from(await response.arrayBuffer()))
        .resize(CELL - 6, CELL - 6, { fit: 'contain', background: '#202028' })
        .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="26"><rect width="34" height="26" fill="#000"/><text x="9" y="20" font-family="sans-serif" font-size="20" fill="#ff0">${col + 1}</text></svg>`), left: 0, top: 0 }])
        .jpeg({ quality: 70 })
        .toBuffer();
      composites.push({ input: tile, left: left + col * CELL + 3, top: top + LABEL });
    } catch (error) {
      failures.push(`${id}: thumbnail ${col + 1} did not load (${error.message})`);
    }
    await sleep(250);
  }
  await sleep(300);
}

const sheet = only.length ? 'images/sheets/sheet-redo.jpg' : `images/sheets/sheet-${String(from).padStart(3, '0')}.jpg`;
await sharp({ create: { width: CELL * 8, height: Math.ceil(ids.length / 2) * (CELL + LABEL), channels: 3, background: '#101014' } })
  .composite(composites)
  .jpeg({ quality: 72 })
  .toFile(sheet);

console.log(`${ids.length} object(s) searched, sheet written to ${sheet}.`);
for (const failure of failures) console.log(`  problem: ${failure}`);
