// Draws the original illustrations for the objects that have no photograph
// (particles, units, distances, wavelengths, molecules, hypothetical and unresolved things).
//   node scripts/make-illustrations.mjs            -> every object without a photo choice
//   node scripts/make-illustrations.mjs --sheet    -> also images/sheets/illustrations-N.jpg to look them over
// Writes public/img/<id>.svg, sets image + imageShape "art" in src/data/objects.json and the
// credit in src/data/credits.json. The drawings carry no words, only symbols, so they need no translation.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const W = 800;
const H = 600;
const CX = W / 2;
const CY = H / 2;
const readJson = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback);

/* ---------- small helpers ---------- */
function rng(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Number(n.toFixed(1));
const circle = (x, y, r, attrs = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ${attrs}/>`;
const line = (x1, y1, x2, y2, attrs = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${attrs}/>`;
const path = (d, attrs = '') => `<path d="${d}" ${attrs}/>`;
const text = (x, y, s, size = 44, attrs = '') =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${MONO}" font-size="${size}" font-weight="400" text-anchor="middle" dominant-baseline="central" fill="${INK}" ${attrs}>${s}</text>`;
/** A physical symbol, set in italic serif as in print. */
const symbol = (x, y, s, size = 44) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${SERIF}" font-style="italic" font-size="${size}" text-anchor="middle" dominant-baseline="central" fill="${INK}">${s}</text>`;
/** A dimension line with arrowheads, vertical when x1 === x2. */
function dimension(x1, y1, x2, y2, colour = INK) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (x, y, dir) => path(`M${f(x + Math.cos(a + 0.42) * 13 * dir)} ${f(y + Math.sin(a + 0.42) * 13 * dir)}L${f(x)} ${f(y)}L${f(x + Math.cos(a - 0.42) * 13 * dir)} ${f(y + Math.sin(a - 0.42) * 13 * dir)}`, `fill="none" stroke="${colour}" stroke-width="1.5"`);
  return line(x1, y1, x2, y2, `stroke="${colour}" stroke-width="1.5"`) + head(x1, y1, 1) + head(x2, y2, -1);
}
// One restrained palette for every drawing: off-white ink and five muted accents.
const INK = '#dfe3ea';
const TEAL = '#6fb3c4';
const AMBER = '#d6a35c';
const VIOLET = '#9b98c9';
const RED = '#cf6f5f';
const BLUE = '#7d9fd0';
const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
const SERIF = "'Times New Roman',Times,serif";

/** A matt sphere lit from the upper left: flat colour, soft light, dark limb, no gloss. `id` keeps gradient names unique inside one drawing. */
function sphere(x, y, r, colour, id) {
  return (
    `<defs><radialGradient id="${id}" cx="35%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient></defs>` +
    circle(x, y, r, `fill="${colour}"`) +
    circle(x, y, r, `fill="url(#${id})"`)
  );
}
const glow = (x, y, r, colour, id, strength = 0.6) =>
  `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${colour}" stop-opacity="${strength}"/><stop offset="1" stop-color="${colour}" stop-opacity="0"/></radialGradient></defs>` +
  circle(x, y, r, `fill="url(#${id})"`);
/** A closed lumpy outline around a centre, for irregular bodies and grains. */
function blob(x, y, r, random, lumps = 9, depth = 0.22, squash = 1) {
  const points = [];
  for (let i = 0; i < lumps; i++) {
    const a = (i / lumps) * Math.PI * 2;
    const d = r * (1 - depth + random() * depth * 2);
    points.push([x + Math.cos(a) * d, y + Math.sin(a) * d * squash]);
  }
  let d = '';
  for (let i = 0; i < lumps; i++) {
    const p = points[i];
    const q = points[(i + 1) % lumps];
    const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    d += i ? `Q${f(p[0])} ${f(p[1])} ${f(mid[0])} ${f(mid[1])}` : `M${f(mid[0])} ${f(mid[1])}`;
  }
  const first = points[0];
  return `${d}Q${f(first[0])} ${f(first[1])} ${f((first[0] + points[1][0]) / 2)} ${f((first[1] + points[1][1]) / 2)}Z`;
}
const bracket = (x1, x2, y, label) =>
  line(x1, y - 26, x1, y + 10, `stroke="${INK}" stroke-width="1" opacity=".6"`) +
  line(x2, y - 26, x2, y + 10, `stroke="${INK}" stroke-width="1" opacity=".6"`) +
  dimension(x1, y, x2, y) +
  (label ? symbol((x1 + x2) / 2, y + 34, label, 36) : '');

/* ---------- particles ---------- */
const PARTICLE = {
  neutrino: 'ν', 'quark-top': 't', preone: '?', 'neutrino-ad-alta-energia': 'ν', 'quark-bottom': 'b', 'quark-charm': 'c',
  'elettrone-limite-superiore': 'e⁻', 'quark-strange': 's', 'limite-sul-raggio-dei-quark': 'q', 'quark-up': 'u', 'quark-down': 'd',
  'raggio-d-azione-della-forza-debole': 'W', 'elettrone-raggio-classico': 'e⁻',
};
function particle(o, random) {
  const c = o.flags.includes('i') ? VIOLET : TEAL;
  if (o.id === 'schiuma-quantistica') {
    let s = '';
    for (let i = 0; i < 70; i++) s += circle(CX + (random() - 0.5) * 520, CY + (random() - 0.5) * 360, 8 + random() * 46, `fill="none" stroke="${c}" stroke-width="1" opacity="${f(0.25 + random() * 0.5)}"`);
    return s;
  }
  if (o.id === 'stringa') {
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const r = 150 + 34 * Math.sin(a * 7) + 16 * Math.sin(a * 13 + 1);
      d += `${i ? 'L' : 'M'}${f(CX + Math.cos(a) * r * 1.25)} ${f(CY + Math.sin(a) * r)}`;
    }
    return path(`${d}Z`, `fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"`);
  }
  if (o.id === 'lunghezze-sondate-da-lhc') {
    let s = circle(CX, CY, 4, `fill="${INK}"`);
    for (let i = 0; i < 26; i++) {
      const a = random() * Math.PI * 2;
      const bend = (random() - 0.5) * 260;
      const len = 150 + random() * 170;
      const ex = CX + Math.cos(a) * len;
      const ey = CY + Math.sin(a) * len;
      s += path(`M${CX} ${CY}Q${f(CX + Math.cos(a + 1.2) * bend * 0.4 + Math.cos(a) * len * 0.5)} ${f(CY + Math.sin(a + 1.2) * bend * 0.4 + Math.sin(a) * len * 0.5)} ${f(ex)} ${f(ey)}`, `fill="none" stroke="${[TEAL, AMBER, INK][i % 3]}" stroke-width="1.2" opacity=".8"`);
    }
    return s;
  }
  return (
    circle(CX, CY, 190, `fill="none" stroke="${c}" stroke-width="1.2" stroke-dasharray="3 9"`) +
    line(CX - 230, CY, CX - 190, CY, `stroke="${c}" stroke-width="1"`) + line(CX + 190, CY, CX + 230, CY, `stroke="${c}" stroke-width="1"`) +
    line(CX, CY - 230, CX, CY - 190, `stroke="${c}" stroke-width="1"`) + line(CX, CY + 190, CX, CY + 230, `stroke="${c}" stroke-width="1"`) +
    symbol(CX, CY, PARTICLE[o.id] ?? '', 150)
  );
}

/* ---------- units ---------- */
const UNIT = {
  'lunghezza-di-planck': 'ℓ<tspan baseline-shift="sub" font-size="24">P</tspan>', yoctometro: '1 ym', zeptometro: '1 zm', attometro: '1 am', femtometro: '1 fm', picometro: '1 pm',
  angstrom: '1 Å', nanometro: '1 nm', micrometro: '1 µm', twip: '1 twip', thou: '1 thou', millimetro: '1 mm', pollice: '1 in', metro: '1 m', chilometro: '1 km', miglio: '1 mi',
  megametro: '1 Mm', gigametro: '1 Gm', terametro: '1 Tm', 'giorno-luce': '1 ld', petametro: '1 Pm', 'anno-luce': '1 ly', parsec: '1 pc', esametro: '1 Em', zettametro: '1 Zm',
  yottametro: '1 Ym', gigaparsec: '1 Gpc',
};
function unit(o) {
  const x1 = 110;
  const x2 = W - 110;
  let s = line(x1, CY, x2, CY, `stroke="${INK}" stroke-width="1.5"`);
  for (let i = 0; i <= 10; i++) {
    const x = x1 + ((x2 - x1) * i) / 10;
    const tick = i % 10 ? (i % 5 ? 12 : 20) : 30;
    s += line(x, CY - tick, x, CY, `stroke="${INK}" stroke-width="${i % 5 ? 1 : 1.5}"`);
  }
  return s + text(CX, CY - 96, UNIT[o.id] ?? '', 64);
}

/* ---------- wavelengths ---------- */
function wave(o, random) {
  const c = o.glyph || AMBER;
  const cycles = 2 + Math.floor(random() * 3);
  const x1 = 90;
  const x2 = W - 90;
  let d = '';
  for (let i = 0; i <= 240; i++) {
    const u = i / 240;
    d += `${i ? 'L' : 'M'}${f(x1 + u * (x2 - x1))} ${f(CY - 40 - Math.sin(u * Math.PI * 2 * cycles) * 120)}`;
  }
  const span = (x2 - x1) / cycles;
  return line(x1 - 30, CY - 40, x2 + 30, CY - 40, `stroke="${INK}" stroke-width="1" opacity=".45"`) + path(d, `fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"`) + bracket(x1 + span / 4, x1 + span / 4 + span, CY + 150, 'λ');
}

/* ---------- nuclei and atoms ---------- */
const NUCLEUS = { protone: [1, 0], neutrone: [0, 1], 'nucleo-di-elio': [2, 2], deuterone: [1, 1], 'nucleo-di-cloro': [17, 18], 'nucleo-atomico-medio': [26, 30], 'nucleo-di-piombo-208': [82, 126], 'nucleo-di-uranio': [92, 146] };
const SHELLS = { 'atomo-di-elio': [2], 'atomo-di-idrogeno': [1], 'atomo-di-carbonio': [2, 4], 'atomo-di-zolfo': [2, 8, 6], 'atomo-di-cesio': [2, 8, 18, 18, 8, 1] };
function nucleons(x, y, protons, neutrons, radius, random, tag) {
  const total = protons + neutrons;
  const kinds = [...Array(protons).fill(1), ...Array(neutrons).fill(0)].sort(() => random() - 0.5);
  const r = total === 1 ? radius : (radius / Math.sqrt(total)) * 1.25;
  let s = '';
  // Sunflower packing, outermost first, so the cluster reads as a ball.
  for (let i = total - 1; i >= 0; i--) {
    const d = total === 1 ? 0 : radius * Math.sqrt((i + 0.5) / total) * 0.92;
    const a = i * 2.39996323;
    s += sphere(x + Math.cos(a) * d, y + Math.sin(a) * d, r, kinds[i] ? RED : BLUE, `${tag}${i}`);
  }
  return s;
}
function atomOrNucleus(o, random) {
  if (NUCLEUS[o.id]) {
    const [z, n] = NUCLEUS[o.id];
    const radius = z + n === 1 ? 130 : 60 + 18 * Math.cbrt(z + n) * 1.6;
    return nucleons(CX, CY, z, n, Math.min(radius, 230), random, 'n');
  }
  const shells = SHELLS[o.id] ?? [1];
  const outer = 250;
  let s = circle(CX, CY, 12, `fill="${RED}"`);
  shells.forEach((count, i) => {
    const r = shells.length === 1 ? 170 : 60 + ((outer - 60) * i) / (shells.length - 1);
    s += circle(CX, CY, r, `fill="none" stroke="${INK}" stroke-width="1" opacity=".45"`);
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + i * 0.7;
      s += circle(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 6, `fill="${TEAL}"`);
    }
  });
  return s;
}

/* ---------- stars and unresolved worlds ---------- */
function star(o, random) {
  const c = o.glyph || '#ffe9a8';
  if (o.id === 'stella-di-neutroni') {
    return (
      path(`M${CX - 30} ${CY}L${CX - 330} ${CY - 230}L${CX - 250} ${CY - 280}Z`, `fill="${c}" opacity=".35"`) +
      path(`M${CX + 30} ${CY}L${CX + 330} ${CY + 230}L${CX + 250} ${CY + 280}Z`, `fill="${c}" opacity=".35"`) +
      glow(CX, CY, 190, c, 'g', 0.8) +
      sphere(CX, CY, 62, c, 's')
    );
  }
  const r = o.id === 'sirio-b' ? 110 : 205;
  let s = glow(CX, CY, r * 1.35, c, 'g', 0.28);
  s += `<defs><radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${c}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="#000" stop-opacity=".0"/></radialGradient><radialGradient id="l"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient><clipPath id="k">${circle(CX, CY, r)}</clipPath></defs>`;
  s += circle(CX, CY, r, `fill="${c}"`);
  // Cool, bloated stars get large convection cells; a brown dwarf gets bands.
  const cool = /^#ff[4-9]/i.test(c) || o.id === 'gliese-229-b';
  let marks = '';
  if (o.id === 'gliese-229-b') {
    for (let i = -3; i <= 3; i++) marks += `<rect x="${CX - r}" y="${f(CY + i * 52 - 12)}" width="${r * 2}" height="${f(18 + random() * 14)}" fill="#000" opacity=".22"/>`;
  } else {
    // Granulation: many small cells of slightly different brightness, coarser on cool giants.
    const cells = cool ? 260 : 420;
    for (let i = 0; i < cells; i++) {
      const a = random() * 7;
      const d = Math.sqrt(random()) * r;
      marks += circle(CX + Math.cos(a) * d, CY + Math.sin(a) * d, (cool ? 7 : 4) + random() * (cool ? 9 : 4), `fill="${random() > 0.5 ? '#fff' : '#000'}" opacity=".05"`);
    }
  }
  return `${s}<g clip-path="url(#k)">${marks}</g>${circle(CX, CY, r, 'fill="url(#l)"')}`;
}
function world(o, random) {
  const c = o.glyph || '#9aa3bd';
  if (o.id === 'oumuamua') return `<g transform="rotate(-22 ${CX} ${CY})">${path(blob(CX, CY, 250, random, 11, 0.1, 0.17), `fill="${c}"`)}${path(blob(CX - 20, CY - 12, 200, random, 9, 0.12, 0.08), 'fill="#fff" opacity=".12"')}</g>`;
  if (['cruithne', 'ganymed', 'psyche', 'galatea', 'nereide', 'bianca', 'belinda'].includes(o.id)) return path(blob(CX, CY, 190, random, 10, 0.2, 0.84), `fill="${c}"`) + path(blob(CX - 46, CY - 44, 96, random, 8, 0.2, 0.8), 'fill="#fff" opacity=".12"') + circle(CX + 60, CY + 40, 30, 'fill="#000" opacity=".18"') + circle(CX - 20, CY + 80, 18, 'fill="#000" opacity=".18"');
  // Haumea spins so fast that it is stretched into an ellipsoid about twice as long as it is thick.
  if (o.id === 'haumea') return `<g transform="translate(${CX} ${CY}) rotate(-14) scale(1 .51) translate(${-CX} ${-CY})">${sphere(CX, CY, 200, c, 'w')}</g>`;
  let s = sphere(CX, CY, 200, c, 'w');
  if (o.id === 'tres-4-b' || o.id === 'k2-18-b') {
    let bands = '';
    for (let i = -4; i <= 4; i++) bands += `<rect x="${CX - 200}" y="${f(CY + i * 44 - 10)}" width="400" height="${f(14 + random() * 12)}" fill="${i % 2 ? '#fff' : '#000'}" opacity=".12"/>`;
    s = `<defs><clipPath id="k">${circle(CX, CY, 200)}</clipPath></defs>${circle(CX, CY, 200, `fill="${c}"`)}<g clip-path="url(#k)">${bands}</g>${sphere(CX, CY, 200, 'transparent', 'w')}`;
  }
  return s;
}

/* ---------- black holes ---------- */
function blackHole(o) {
  const hole = (x, y, r, tag) =>
    glow(x, y, r * 2.2, '#d6a35c', `${tag}g`, 0.3) +
    `<ellipse cx="${x}" cy="${y}" rx="${f(r * 2.2)}" ry="${f(r * 0.5)}" fill="none" stroke="#ffb46e" stroke-width="${f(r * 0.16)}" opacity=".6" transform="rotate(-14 ${x} ${y})"/>` +
    circle(x, y, r, 'fill="#000"') +
    circle(x, y, r * 1.06, `fill="none" stroke="#ffcd8c" stroke-width="${f(Math.max(2, r * 0.07))}"`);
  if (o.id === 'gaia-bh3') return circle(CX, CY, 220, `fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="5 9" opacity=".5"`) + hole(CX - 40, CY, 46, 'a') + sphere(CX + 220 * Math.cos(-0.5) - 40, CY + 220 * Math.sin(-0.5), 34, '#ffe9a8', 'c');
  if (o.id === 'buco-nero-del-cosmic-horseshoe') return path(`M${CX - 196} ${CY + 120}A230 230 0 1 1 ${CX + 196} ${CY + 120}`, 'fill="none" stroke="#7fb6ff" stroke-width="18" stroke-linecap="round" opacity=".8"') + hole(CX, CY, 70, 'a');
  if (o.id === 'ton-618') return path(`M${CX - 16} ${CY}L${CX - 50} ${CY - 290}L${CX + 50} ${CY - 290}L${CX + 16} ${CY}L${CX + 50} ${CY + 290}L${CX - 50} ${CY + 290}Z`, 'fill="#9fd0ff" opacity=".35"') + hole(CX, CY, 96, 'a');
  return hole(CX, CY, 84, 'a');
}

/* ---------- distances ---------- */
const BODY = { sun: ['#ffd76a', 46], earth: ['#3b82c4', 22], moon: ['#c9c9c9', 12], probe: [INK, 7], red: ['#ff7a4d', 22], mercury: ['#9c8f84', 14], jupiter: ['#d9a66b', 34], neptune: ['#4f7cff', 26], pluto: ['#c7a98a', 12] };
function body(kind, x, y, tag) {
  if (kind === 'galaxy') return `<ellipse cx="${x}" cy="${y}" rx="46" ry="17" fill="#cfd8ff" opacity=".85" transform="rotate(-20 ${x} ${y})"/>${circle(x, y, 9, 'fill="#fff"')}`;
  if (kind === 'faint') return `<ellipse cx="${x}" cy="${y}" rx="18" ry="8" fill="#ff7a6a" opacity=".9" transform="rotate(-20 ${x} ${y})"/>`;
  if (kind === 'cluster') {
    const random = rng(tag);
    let s = '';
    for (let i = 0; i < 26; i++) s += circle(x + (random() - 0.5) * 110, y + (random() - 0.5) * 110, 2 + random() * 5, 'fill="#cfd8ff"');
    return s;
  }
  if (kind === 'probe') return path(`M${x} ${y - 12}L${x + 12} ${y}L${x} ${y + 12}L${x - 12} ${y}Z`, `fill="${INK}"`) + line(x - 26, y, x + 26, y, `stroke="${INK}" stroke-width="3"`);
  const [colour, r] = BODY[kind];
  return (kind === 'sun' || kind === 'red' ? glow(x, y, r * 2.2, colour, `${tag}g`, 0.6) : '') + sphere(x, y, r, colour, tag);
}
const SPAN = {
  maratona: ['dot', 'dot'], 'distanza-terra-luna': ['earth', 'moon'], 'distanza-del-telescopio-webb': ['earth', 'probe'], 'perielio-della-parker-solar-probe': ['sun', 'probe'],
  'distanza-mercurio-sole': ['sun', 'mercury'], 'distanza-terra-sole': ['sun', 'earth'], 'distanza-giove-sole': ['sun', 'jupiter'], 'distanza-nettuno-sole': ['sun', 'neptune'],
  'distanza-plutone-sole': ['sun', 'pluto'], 'voyager-1': ['sun', 'probe'], 'distanza-proxima-alfa-centauri-a': ['sun', 'red'], 'distanza-sole-proxima': ['sun', 'red'],
  'distanza-di-andromeda': ['galaxy', 'galaxy'], 'distanza-del-grande-attrattore': ['galaxy', 'cluster'], 'distanza-del-superammasso-di-shapley': ['galaxy', 'cluster'],
  'distanza-dell-hubble-deep-field': ['galaxy', 'faint'], 'mom-z14': ['galaxy', 'faint'],
};
function distance(o, random) {
  const dashed = `stroke="${TEAL}" stroke-width="1.5" stroke-dasharray="8 8"`;
  const ring = (r, extra = '') => circle(CX, CY, r, `fill="none" stroke="${TEAL}" stroke-width="1.2" ${extra}`);
  if (SPAN[o.id]) {
    const [a, b] = SPAN[o.id];
    const x1 = 130;
    const x2 = W - 130;
    const end = (kind, x, tag) => (kind === 'dot' ? circle(x, CY, 12, `fill="${TEAL}"`) : body(kind, x, CY, tag));
    return line(x1, CY, x2, CY, dashed) + end(a, x1, 'a') + end(b, x2, 'b') + bracket(x1, x2, CY + 130, '');
  }
  switch (o.id) {
    case 'sensibilita-di-ligo':
      return line(160, 470, 640, 470, `stroke="${INK}" stroke-width="4"`) + line(160, 470, 160, 110, `stroke="${INK}" stroke-width="4"`) + `<rect x="632" y="440" width="14" height="60" fill="${TEAL}"/><rect x="130" y="100" width="60" height="14" fill="${TEAL}"/>` + circle(160, 470, 16, `fill="${AMBER}"`) + line(205, 440, 600, 440, `stroke="${AMBER}" stroke-width="2" opacity=".8"`) + line(190, 425, 190, 130, `stroke="${AMBER}" stroke-width="2" opacity=".8"`);
    case 'orbita-geostazionaria':
      return ring(230, 'stroke-dasharray="6 10"') + body('earth', CX, CY, 'a') + body('probe', CX + 230, CY, 'b') + line(CX, CY, CX + 230, CY, `stroke="${INK}" stroke-width="1.5" opacity=".5"`);
    case 'anelli-di-saturno':
      return `<ellipse cx="${CX}" cy="${CY}" rx="300" ry="84" fill="none" stroke="#e3cf9c" stroke-width="34" opacity=".55" transform="rotate(-12 ${CX} ${CY})"/>` + sphere(CX, CY, 118, '#e3cf9c', 'a') + path(`M${CX - 293} ${CY + 62}A300 84 -12 0 0 ${CX + 293} ${CY - 62}`, 'fill="none" stroke="#e3cf9c" stroke-width="34" opacity=".8"') + bracket(CX - 318, CX + 318, CY + 210, '');
    case 'altezza-totale-dell-umanita': {
      // A column of equal segments, one per person, fading upwards: the heights simply add up.
      let s = '';
      for (let i = 0; i < 26; i++) s += `<rect x="${CX - 14}" y="${f(548 - i * 20)}" width="28" height="18" fill="none" stroke="${INK}" stroke-width="1" opacity="${f(1 - i * 0.034)}"/>`;
      return s + dimension(CX + 80, 40, CX + 80, 566, TEAL);
    }
    case 'sistema-di-trappist-1': {
      let s = body('red', CX, CY, 'a');
      for (let i = 0; i < 7; i++) {
        const r = 56 + i * 32;
        const a = random() * 7;
        s += ring(r, 'opacity=".5"') + circle(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 7, `fill="${BLUE}"`);
      }
      return s;
    }
    case 'fascia-di-kuiper': {
      let s = body('sun', CX, CY, 'a') + ring(90, 'opacity=".4"');
      for (let i = 0; i < 260; i++) {
        const a = random() * 7;
        const r = 190 + random() * 80;
        s += circle(CX + Math.cos(a) * r, CY + Math.sin(a) * r * 0.9, 1 + random() * 2.4, 'fill="#cfd8ff"');
      }
      return s;
    }
    case 'nube-di-oort': {
      let s = body('sun', CX, CY, 'a');
      for (let i = 0; i < 520; i++) {
        const a = random() * 7;
        const r = 120 + Math.sqrt(random()) * 160;
        s += circle(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 0.8 + random() * 1.8, 'fill="#cfd8ff" opacity=".8"');
      }
      return s;
    }
    case 'eliopausa':
      return path(`M${CX + 250} ${CY}C${CX + 250} ${CY - 200} ${CX - 60} ${CY - 230} ${CX - 330} ${CY - 90}C${CX - 200} ${CY - 20} ${CX - 200} ${CY + 20} ${CX - 330} ${CY + 90}C${CX - 60} ${CY + 230} ${CX + 250} ${CY + 200} ${CX + 250} ${CY}Z`, `fill="${TEAL}" fill-opacity=".1" stroke="${TEAL}" stroke-width="2.5"`) + body('sun', CX + 40, CY, 'a');
    case 'afelio-della-cometa-hale-bopp':
    case 'afelio-di-sedna':
      return `<ellipse cx="${CX}" cy="${CY}" rx="300" ry="96" fill="none" stroke="${TEAL}" stroke-width="2.5" stroke-dasharray="8 9"/>` + body('sun', CX + 258, CY, 'a') + circle(CX - 300, CY, 11, `fill="${o.id === 'afelio-di-sedna' ? '#b4533c' : INK}"`) + bracket(CX - 300, CX + 258, CY + 170, '');
    case 'getto-relativistico-di-m87':
      return path(`M${CX - 250} ${CY + 90}L${CX + 300} ${CY - 150}L${CX + 310} ${CY - 118}Z`, 'fill="#9fd0ff" opacity=".75"') + glow(CX - 250, CY + 90, 150, '#ffe9a8', 'g', 0.8) + circle(CX - 250, CY + 90, 16, 'fill="#fff"');
    case 'strada-percorsa-dalla-terra-attorno-al-sole': {
      let s = body('sun', CX, CY, 'a');
      for (let i = 0; i < 9; i++) s += `<ellipse cx="${CX}" cy="${CY}" rx="${210 + i * 5}" ry="${196 + i * 4}" fill="none" stroke="${TEAL}" stroke-width="1.5" opacity="${f(0.25 + i * 0.07)}"/>`;
      return s + body('earth', CX + 250, CY, 'b');
    }
    case 'scala-acustica-barionica': {
      let s = ring(210, 'opacity=".5" stroke-dasharray="4 10"') + body('cluster', CX, CY, 'a');
      for (let i = 0; i < 90; i++) {
        const a = random() * 7;
        const r = 210 + (random() - 0.5) * 44;
        s += circle(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 1.5 + random() * 3.5, 'fill="#cfd8ff"');
      }
      return s;
    }
    case 'raggio-di-hubble':
      return ring(230) + circle(CX, CY, 9, 'fill="#fff"') + line(CX, CY, CX + 230, CY, dashed);
    default:
      return line(130, CY, W - 130, CY, dashed) + circle(130, CY, 12, `fill="${TEAL}"`) + circle(W - 130, CY, 12, `fill="${TEAL}"`);
  }
}

/* ---------- the large-scale universe ---------- */
function web(random, { nodes = 46, voidAt = null, band = false } = {}) {
  const points = [];
  while (points.length < nodes) {
    const x = 60 + random() * (W - 120);
    const y = band ? CY + (random() - 0.5) * 150 + Math.sin(x / 110) * 40 : 50 + random() * (H - 100);
    if (voidAt && Math.hypot(x - voidAt[0], y - voidAt[1]) < voidAt[2]) continue;
    points.push([x, y]);
  }
  let s = '';
  points.forEach((p, i) => {
    const near = points.map((q, j) => [Math.hypot(p[0] - q[0], p[1] - q[1]), j]).sort((a, b) => a[0] - b[0]).slice(1, 3);
    for (const [, j] of near) if (j > i || near.length) s += line(p[0], p[1], points[j][0], points[j][1], `stroke="${VIOLET}" stroke-width="1.6" opacity=".45"`);
  });
  for (const p of points) s += circle(p[0], p[1], 2.5 + random() * 4.5, 'fill="#e6e0ff"');
  return s;
}
function cosmic(o, random) {
  const dashedRing = (r, colour) => circle(CX, CY, r, `fill="none" stroke="${colour}" stroke-width="2.5" stroke-dasharray="6 10"`);
  switch (o.id) {
    case 'gruppo-locale': {
      let s = '';
      for (let i = 0; i < 40; i++) s += circle(CX + (random() - 0.5) * 620, CY + (random() - 0.5) * 420, 1.5 + random() * 3, 'fill="#cfd8ff" opacity=".8"');
      return s + body('galaxy', CX - 190, CY + 40, 'a') + body('galaxy', CX + 170, CY - 50, 'b') + `<ellipse cx="${CX + 250}" cy="${CY + 80}" rx="26" ry="11" fill="#cfd8ff" opacity=".7"/>`;
    }
    case 'vuoto-del-boote':
    case 'supervuoto-di-eridano':
      return web(random, { nodes: 70, voidAt: [CX, CY, o.id === 'vuoto-del-boote' ? 150 : 190] }) + dashedRing(o.id === 'vuoto-del-boote' ? 150 : 190, TEAL);
    case 'vuoto-kbc':
      return web(random, { nodes: 70, voidAt: [CX, CY, 180] }) + dashedRing(180, TEAL) + body('galaxy', CX, CY, 'a');
    case 'grande-muraglia-sloan':
    case 'grande-muraglia-ercole-corona-boreale':
    case 'complesso-pesci-balena':
    case 'quipu':
      return web(random, { nodes: o.id === 'quipu' ? 60 : 90, band: true });
    case 'arco-gigante': {
      let s = web(random, { nodes: 26 });
      for (let i = 0; i < 44; i++) {
        const a = Math.PI * (1.15 + (i / 43) * 0.7);
        const r = 250 + (random() - 0.5) * 26;
        s += circle(CX + Math.cos(a) * r, CY + 190 + Math.sin(a) * r, 3 + random() * 4, `fill="${AMBER}"`);
      }
      return s;
    }
    case 'huge-lqg': {
      let s = web(random, { nodes: 30 });
      for (let i = 0; i < 40; i++) {
        const u = random();
        const x = 150 + u * 500 + (random() - 0.5) * 60;
        const y = CY + Math.sin(u * 4) * 90 + (random() - 0.5) * 70;
        s += glow(x, y, 16, '#9fd0ff', `q${i}`, 0.9) + circle(x, y, 3.5, 'fill="#fff"');
      }
      return s;
    }
    case 'laniakea': {
      let s = '';
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2;
        const r = 170 + random() * 110;
        const sx = CX + Math.cos(a) * r * 1.25;
        const sy = CY + Math.sin(a) * r;
        s += path(`M${f(sx)} ${f(sy)}Q${f(CX + Math.cos(a + 0.9) * r * 0.5)} ${f(CY + Math.sin(a + 0.9) * r * 0.4)} ${CX + 60} ${CY + 10}`, `fill="none" stroke="${INK}" stroke-width="1.6" opacity=".55"`);
      }
      return s + glow(CX + 60, CY + 10, 70, AMBER, 'g', 0.9) + circle(CX - 150, CY - 40, 7, `fill="${TEAL}"`);
    }
    case 'superammasso-della-vergine':
      return web(random, { nodes: 40 }) + glow(CX, CY, 150, '#cfd8ff', 'g', 0.5) + body('cluster', CX, CY, 'a') + circle(CX - 220, CY + 90, 7, `fill="${TEAL}"`);
    case 'universo-osservabile':
      return `<defs><clipPath id="k">${circle(CX, CY, 260)}</clipPath></defs><g clip-path="url(#k)">${web(random, { nodes: 150 })}</g>` + circle(CX, CY, 260, `fill="none" stroke="${AMBER}" stroke-width="3"`) + circle(CX, CY, 6, `fill="${TEAL}"`);
    case 'universo-intero':
      return web(random, { nodes: 150 }) + dashedRing(120, VIOLET) + circle(CX, CY, 5, `fill="${TEAL}"`);
    default:
      return web(random);
  }
}
function cloud(o, random) {
  const puff = (x, y, r, colour, i, strength = 0.5) => glow(x, y, r, colour, `p${i}`, strength);
  // Two lobes above and below the disc of the Milky Way, seen edge-on.
  if (o.id === 'bolle-di-fermi') return `<ellipse cx="${CX}" cy="${CY - 142}" rx="140" ry="138" fill="${VIOLET}" fill-opacity=".12" stroke="${VIOLET}" stroke-width="1.5"/><ellipse cx="${CX}" cy="${CY + 142}" rx="140" ry="138" fill="${VIOLET}" fill-opacity=".12" stroke="${VIOLET}" stroke-width="1.5"/><ellipse cx="${CX}" cy="${CY}" rx="330" ry="14" fill="${INK}" opacity=".8"/>` + glow(CX, CY, 60, '#fff', 'g', 0.6);
  if (o.id === 'onda-di-radcliffe') {
    let s = '';
    for (let i = 0; i < 80; i++) {
      const u = i / 79;
      s += puff(90 + u * 620, CY - Math.sin(u * Math.PI * 2) * 110 + (random() - 0.5) * 30, 16 + random() * 22, i % 3 ? '#ff8a7a' : '#ffd0c0', i, 0.7);
    }
    return s + body('sun', CX + 60, CY + 150, 'a');
  }
  let s = '';
  if (o.id === 'bolla-locale') {
    for (let i = 0; i < 46; i++) {
      const a = random() * 7;
      const r = 215 + random() * 60;
      s += puff(CX + Math.cos(a) * r * 1.2, CY + Math.sin(a) * r * 0.95, 40 + random() * 50, i % 2 ? '#ff8a7a' : VIOLET, i, 0.45);
    }
    return s + body('sun', CX, CY, 'a');
  }
  for (let i = 0; i < 34; i++) s += puff(CX + (random() - 0.5) * 520, CY + (random() - 0.5) * 320, 50 + random() * 90, i % 2 ? TEAL : VIOLET, i, 0.3);
  return s + body('sun', CX + 30, CY + 10, 'a');
}
function dwarfGalaxy(o, random) {
  let s = '';
  const stars = (x, y, rx, ry, count, tilt) => {
    for (let i = 0; i < count; i++) {
      const a = random() * 7;
      const d = Math.pow(random(), 0.7);
      const px = Math.cos(a) * d * rx;
      const py = Math.sin(a) * d * ry;
      s += circle(x + px * Math.cos(tilt) - py * Math.sin(tilt), y + px * Math.sin(tilt) + py * Math.cos(tilt), 0.8 + random() * 2.2, `fill="#e8ecff" opacity="${f(0.4 + random() * 0.6)}"`);
    }
  };
  if (o.id === 'canes-venatici-i') stars(CX, CY, 300, 190, 420, -0.3);
  else {
    // A satellite seen against the disc of the Milky Way.
    s += `<ellipse cx="${CX}" cy="${CY + 150}" rx="360" ry="46" fill="#cfd8ff" opacity=".28"/>`;
    stars(CX + (o.id === 'nana-del-cane-maggiore' ? 210 : 0), CY + (o.id === 'nana-del-cane-maggiore' ? 100 : -40), o.id === 'nana-del-cane-maggiore' ? 150 : 110, o.id === 'nana-del-cane-maggiore' ? 60 : 260, 420, o.id === 'nana-del-cane-maggiore' ? -0.15 : 0.25);
  }
  return s;
}

/* ---------- molecules and the nanoscale ---------- */
// CPK colours, toned down.
const ATOM = { C: ['#7b8090', 30], O: ['#c9584c', 30], H: ['#dfe3ea', 20], N: ['#5f7bd0', 30] };
function ballAndStick(atoms, bonds, scale, ox = CX, oy = CY) {
  let s = '';
  for (const [a, b, order = 1] of bonds) {
    const [, x1, y1] = atoms[a];
    const [, x2, y2] = atoms[b];
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const len = Math.hypot(nx, ny) || 1;
    for (let k = 0; k < order; k++) {
      const off = (k - (order - 1) / 2) * 12;
      s += line(ox + x1 * scale + (nx / len) * off, oy + y1 * scale + (ny / len) * off, ox + x2 * scale + (nx / len) * off, oy + y2 * scale + (ny / len) * off, `stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".7"`);
    }
  }
  atoms.forEach(([el, x, y], i) => {
    const [colour, r] = ATOM[el];
    s += sphere(ox + x * scale, oy + y * scale, r * (scale / 100), colour, `a${i}`);
  });
  return s;
}
function ring6(cx, cy, r, start = Math.PI / 6) {
  return Array.from({ length: 6 }, (_, i) => [cx + Math.cos(start + (i * Math.PI) / 3) * r, cy + Math.sin(start + (i * Math.PI) / 3) * r]);
}
function lipid(x, y, up, colour = AMBER) {
  const dir = up ? -1 : 1;
  return path(`M${x - 7} ${y}q-8 ${28 * dir} 0 ${56 * dir}t0 ${50 * dir}M${x + 7} ${y}q8 ${28 * dir} 0 ${56 * dir}t0 ${50 * dir}`, `fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".8"`) + circle(x, y, 17, `fill="${colour}"`);
}
function molecule(o, random) {
  switch (o.id) {
    case 'legame-carbonio-carbonio':
      return ballAndStick([['C', -1.5, 0], ['C', 1.5, 0]], [[0, 1]], 130) + bracket(CX - 195, CX + 195, CY + 150, '');
    case 'molecola-di-co2':
      return ballAndStick([['O', -2.2, 0], ['C', 0, 0], ['O', 2.2, 0]], [[0, 1, 2], [1, 2, 2]], 120);
    case 'molecola-d-acqua':
      return ballAndStick([['O', 0, -0.45], ['H', -1.5, 0.75], ['H', 1.5, 0.75]], [[0, 1], [0, 2]], 150);
    case 'molecola-di-glucosio': {
      const ring = ring6(0, 0, 1.6);
      const atoms = ring.map(([x, y], i) => [i === 5 ? 'O' : 'C', x, y]);
      const bonds = ring.map((_, i) => [i, (i + 1) % 6]);
      [0, 1, 2, 3].forEach((i) => {
        atoms.push(['O', ring[i][0] * 1.75, ring[i][1] * 1.75]);
        bonds.push([i, atoms.length - 1]);
      });
      atoms.push(['C', ring[4][0] * 1.75, ring[4][1] * 1.75], ['O', ring[4][0] * 2.45, ring[4][1] * 2.0]);
      bonds.push([4, 10], [10, 11]);
      return ballAndStick(atoms, bonds, 78);
    }
    case 'molecola-di-caffeina': {
      // Purine skeleton: a six-membered ring fused to a five-membered one, three methyl groups, two oxygens.
      const six = ring6(-0.9, 0, 1.3);
      const atoms = six.map(([x, y], i) => [[1, 3].includes(i) ? 'N' : 'C', x, y]);
      const bonds = six.map((_, i) => [i, (i + 1) % 6]);
      atoms.push(['N', 1.55, -1.25], ['C', 2.3, 0], ['N', 1.55, 1.25]);
      bonds.push([5, 6], [6, 7], [7, 8, 2], [8, 0]);
      const out = (i, el, k = 1.85) => {
        atoms.push([el, -0.9 + (atoms[i][1] + 0.9) * k, atoms[i][2] * k]);
        bonds.push([i, atoms.length - 1, el === 'O' ? 2 : 1]);
      };
      out(1, 'C');
      out(3, 'C');
      out(2, 'O');
      out(4, 'O');
      atoms.push(['C', 2.1, -2.35]);
      bonds.push([6, atoms.length - 1]);
      return ballAndStick(atoms, bonds, 82, CX - 20, CY);
    }
    case 'fullerene-c60': {
      // The sixty corners of a truncated icosahedron, drawn from one side.
      const phi = (1 + Math.sqrt(5)) / 2;
      const base = [[0, 1, 3 * phi], [1, 2 + phi, 2 * phi], [phi, 2, 2 * phi + 1]];
      const vertices = [];
      for (const [a, b, c] of base) for (const perm of [[a, b, c], [b, c, a], [c, a, b]]) for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {
        const v = [perm[0] * sx, perm[1] * sy, perm[2] * sz];
        if (!vertices.some((w) => Math.hypot(w[0] - v[0], w[1] - v[1], w[2] - v[2]) < 1e-6)) vertices.push(v);
      }
      const rot = ([x, y, z]) => {
        const a = 0.5;
        const b = 0.35;
        const x1 = x * Math.cos(a) + z * Math.sin(a);
        const z1 = -x * Math.sin(a) + z * Math.cos(a);
        return [x1, y * Math.cos(b) - z1 * Math.sin(b), y * Math.sin(b) + z1 * Math.cos(b)];
      };
      const pts = vertices.map(rot);
      let back = '';
      let front = '';
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        if (Math.abs(Math.hypot(vertices[i][0] - vertices[j][0], vertices[i][1] - vertices[j][1], vertices[i][2] - vertices[j][2]) - 2) > 0.01) continue;
        const near = (pts[i][2] + pts[j][2]) / 2 > 0;
        const l = line(CX + pts[i][0] * 46, CY + pts[i][1] * 46, CX + pts[j][0] * 46, CY + pts[j][1] * 46, `stroke="${INK}" stroke-width="${near ? 4 : 2}" opacity="${near ? 0.9 : 0.3}"`);
        if (near) front += l;
        else back += l;
      }
      for (const p of pts) if (p[2] > 0) front += circle(CX + p[0] * 46, CY + p[1] * 46, 9, 'fill="#8d93a6"');
      return back + front;
    }
    case 'nanotubo-di-carbonio': {
      let s = '';
      const R = 120;
      for (let row = 0; row < 15; row++) for (let col = 0; col < 16; col++) {
        const theta = (col / 16) * Math.PI + (row % 2 ? Math.PI / 32 : 0);
        const x = 120 + row * 40;
        const y = CY - Math.cos(theta) * R;
        const next = CY - Math.cos(theta + Math.PI / 16) * R;
        s += line(x, y, x + 40, next, `stroke="${INK}" stroke-width="2" opacity=".55"`) + line(x, y, x, CY - Math.cos(theta + Math.PI / 16) * R, `stroke="${INK}" stroke-width="2" opacity=".35"`) + circle(x, y, 4, 'fill="#8d93a6"');
      }
      return s;
    }
    case 'alfa-elica-di-una-proteina':
    case 'dna-spessore': {
      const dna = o.id === 'dna-spessore';
      let back = '';
      let front = '';
      for (let i = 0; i <= 160; i++) {
        const u = i / 160;
        const x = 100 + u * 600;
        const phase = u * Math.PI * (dna ? 5 : 7);
        for (const [shift, colour] of dna ? [[0, TEAL], [Math.PI, AMBER]] : [[0, VIOLET]]) {
          const y = CY + Math.sin(phase + shift) * 110;
          const dot = circle(x, y, dna ? 9 : 14, `fill="${colour}"`);
          if (Math.cos(phase + shift) > 0) front += dot;
          else back += circle(x, y, dna ? 7 : 11, `fill="${colour}" opacity=".45"`);
        }
        if (dna && i % 8 === 0) back += line(x, CY + Math.sin(phase) * 100, x, CY - Math.sin(phase) * 100, `stroke="${INK}" stroke-width="3" opacity=".5"`);
      }
      return back + front;
    }
    case 'fosfolipide':
      return `<g transform="translate(${CX} ${CY - 150}) scale(2.6) translate(${-CX} ${-(CY - 150) - 0})">${lipid(CX, CY - 150, false)}</g>`;
    case 'doppio-strato-fosfolipidico': {
      let s = '';
      for (let i = 0; i < 15; i++) s += lipid(100 + i * 43, CY - 125, false) + lipid(100 + i * 43, CY + 125, true, TEAL);
      return s;
    }
    case 'emoglobina': {
      let s = '';
      [[-95, -80, RED], [95, -80, '#ffb0a6'], [-95, 80, '#ffb0a6'], [95, 80, RED]].forEach(([dx, dy, colour], i) => {
        s += path(blob(CX + dx, CY + dy, 125, random, 9, 0.18), `fill="${colour}" opacity=".85"`) + `<rect x="${CX + dx - 15}" y="${CY + dy - 15}" width="30" height="30" rx="5" fill="#7a0f1e" transform="rotate(${i * 30} ${CX + dx} ${CY + dy})"/>` + circle(CX + dx, CY + dy, 6, 'fill="#ffd76a"');
      });
      return s;
    }
    case 'anticorpo-igg': {
      const arm = (d, colour, width) => path(d, `fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"`);
      return `<g transform="translate(${CX} ${CY + 20}) scale(.8) translate(${-CX} ${-CY})">${arm(`M${CX} ${CY + 250}V${CY + 20}`, VIOLET, 64) + arm(`M${CX} ${CY + 20}L${CX - 210} ${CY - 220}`, VIOLET, 46) + arm(`M${CX} ${CY + 20}L${CX + 210} ${CY - 220}`, VIOLET, 46) + arm(`M${CX - 56} ${CY - 6}L${CX - 250} ${CY - 180}`, TEAL, 30) + arm(`M${CX + 56} ${CY - 6}L${CX + 250} ${CY - 180}`, TEAL, 30) + circle(CX - 232, CY - 222, 26, `fill="${AMBER}"`) + circle(CX + 232, CY - 222, 26, `fill="${AMBER}"`)}</g>`;
    }
    case 'nanoparticella-lipidica': {
      let s = '';
      for (let i = 0; i < 44; i++) {
        const a = (i / 44) * Math.PI * 2;
        s += line(CX + Math.cos(a) * 232, CY + Math.sin(a) * 232, CX + Math.cos(a) * 180, CY + Math.sin(a) * 180, `stroke="${INK}" stroke-width="3" opacity=".6"`) + circle(CX + Math.cos(a) * 240, CY + Math.sin(a) * 240, 12, `fill="${AMBER}"`);
      }
      let d = `M${CX - 130} ${CY}`;
      for (let i = 0; i < 9; i++) d += `q${14 + random() * 10} ${i % 2 ? 80 : -80} ${30} 0`;
      return s + path(d, `fill="none" stroke="${RED}" stroke-width="6" stroke-linecap="round"`);
    }
    case 'gate-di-transistor-piu-corto':
    case 'gate-di-un-transistor-in-produzione': {
      const gate = o.id === 'gate-di-transistor-piu-corto' ? 26 : 110;
      return `<rect x="110" y="${CY + 60}" width="580" height="120" rx="8" fill="#39405c"/><rect x="110" y="${CY + 24}" width="${290 - gate / 2 - 20}" height="46" rx="6" fill="${TEAL}"/><rect x="${400 + gate / 2 + 20}" y="${CY + 24}" width="${290 - gate / 2 - 20}" height="46" rx="6" fill="${TEAL}"/><rect x="${400 - gate / 2}" y="${CY - 120}" width="${gate}" height="150" rx="5" fill="${AMBER}"/><rect x="${400 - gate / 2 - 6}" y="${CY + 30}" width="${gate + 12}" height="8" fill="${INK}"/>` + bracket(400 - gate / 2, 400 + gate / 2, CY - 160, '');
    }
    case 'risoluzione-record-di-un-microscopio-elettronico': {
      let s = '';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) s += glow(120 + c * 80 + (r % 2 ? 40 : 0), 100 + r * 80, 34, '#e9fff9', `m${r}_${c}`, 0.95);
      return s;
    }
    case 'limite-del-microscopio-ottico':
      return glow(CX - 78, CY, 190, TEAL, 'a', 0.85) + glow(CX + 78, CY, 190, TEAL, 'b', 0.85) + circle(CX - 78, CY, 5, 'fill="#fff"') + circle(CX + 78, CY, 5, 'fill="#fff"') + bracket(CX - 78, CX + 78, CY + 200, '');
    case 'particella-piu-penetrante-per-un-filtro-ffp2': {
      let s = '';
      for (let i = 0; i < 16; i++) s += path(`M${-20} ${f(random() * H)}Q${CX} ${f(random() * H)} ${W + 20} ${f(random() * H)}`, `fill="none" stroke="${INK}" stroke-width="${f(8 + random() * 14)}" opacity=".3"`);
      return s + glow(CX, CY, 90, AMBER, 'g', 0.7) + circle(CX, CY, 26, `fill="${AMBER}"`) + path(`M${60} ${CY - 40}Q${CX - 120} ${CY + 60} ${CX - 30} ${CY}`, `fill="none" stroke="${AMBER}" stroke-width="3" stroke-dasharray="6 9"`);
    }
    default:
      return ballAndStick([['C', -1, 0.2], ['O', 0.4, -0.5], ['N', 1.5, 0.5]], [[0, 1], [1, 2]], 120);
  }
}

/* ---------- the few everyday things without a usable photograph ---------- */
function everyday(o, random) {
  const layers = (thicknesses, colours) => {
    let y = 120;
    let s = '';
    thicknesses.forEach((t, i) => {
      s += `<rect x="130" y="${y}" width="540" height="${t}" fill="${colours[i]}" stroke="${INK}" stroke-width="1"/>`;
      y += t;
    });
    return s;
  };
  switch (o.id) {
    case 'membrana-cellulare': {
      let s = '';
      for (let i = 0; i < 15; i++) s += lipid(100 + i * 43, CY - 125, false) + lipid(100 + i * 43, CY + 125, true, TEAL);
      return s + path(blob(CX, CY, 92, random, 9, 0.12, 1.9), `fill="${VIOLET}" opacity=".9"`);
    }
    case 'mitocondrio': {
      // Section: outer membrane, inner membrane folded into cristae, matrix inside.
      let folds = '';
      for (let i = 0; i < 7; i++) {
        const x = CX - 210 + i * 70;
        const up = i % 2;
        folds += path(`M${x - 9} ${CY + (up ? -112 : 112)}V${CY + (up ? 30 : -30)}a9 9 0 0 ${up ? 0 : 1} 18 0V${CY + (up ? -112 : 112)}`, `fill="#0b0d13" stroke="${AMBER}" stroke-width="2"`);
      }
      return `<rect x="${CX - 290}" y="${CY - 130}" width="580" height="260" rx="130" fill="none" stroke="${INK}" stroke-width="2"/><rect x="${CX - 272}" y="${CY - 112}" width="544" height="224" rx="112" fill="${AMBER}" fill-opacity=".1" stroke="${AMBER}" stroke-width="2"/>` + folds;
    }
    case 'circovirus-suino': {
      const pts = ring6(CX, CY, 220, 0);
      let s = path(`M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`, `fill="${TEAL}" fill-opacity=".35" stroke="${TEAL}" stroke-width="4"`);
      for (const p of pts) s += line(CX, CY, p[0], p[1], `stroke="${TEAL}" stroke-width="2" opacity=".7"`) + circle(p[0], p[1], 14, `fill="${INK}"`);
      return s + circle(CX, CY, 46, `fill="none" stroke="${AMBER}" stroke-width="6"`);
    }
    case 'cromosoma-y':
    case 'cromosoma-x': {
      // Two sister chromatids joined at the centromere, with a banding pattern; the Y has short upper arms.
      const y = o.id === 'cromosoma-y';
      const top = y ? 70 : 200;
      const bottom = y ? 190 : 230;
      const arm = (side) => {
        const x = CX + side * 34;
        let s = `<rect x="${x - 26}" y="${CY - top}" width="52" height="${top + bottom}" rx="26" fill="${VIOLET}" fill-opacity=".14" stroke="${VIOLET}" stroke-width="2"/>`;
        for (let i = 0; i < 9; i++) {
          const by = CY - top + 30 + random() * (top + bottom - 70);
          if (Math.abs(by - CY) > 26) s += `<rect x="${x - 25}" y="${f(by)}" width="50" height="${f(6 + random() * 16)}" fill="${VIOLET}" opacity=".55"/>`;
        }
        return s;
      };
      return arm(-1) + arm(1) + `<rect x="${CX - 66}" y="${CY - 12}" width="132" height="24" rx="12" fill="#0b0d13" stroke="${INK}" stroke-width="2"/>`;
    }
    case 'sequoia-hyperion': {
      // Elevation: the trunk and crown in outline, a person-sized mark for proportion, the height dimensioned.
      let crown = `M${CX} 56`;
      for (let i = 0; i < 12; i++) crown += `L${CX + 20 + i * 5} ${86 + i * 26}L${CX + 8 + i * 4} ${92 + i * 26}`;
      crown += `L${CX + 8} 400`;
      const left = crown.replace(/([ML])(\d+)/g, (_, c, x) => `${c}${2 * CX - Number(x)}`);
      return path(crown, `fill="none" stroke="${INK}" stroke-width="1.5"`) + path(left, `fill="none" stroke="${INK}" stroke-width="1.5"`) + path(`M${CX - 8} 400V552M${CX + 8} 400V552`, `stroke="${INK}" stroke-width="1.5"`) + line(60, 552, W - 60, 552, `stroke="${INK}" stroke-width="1.5"`) + line(CX + 150, 552, CX + 150, 544.5, `stroke="${AMBER}" stroke-width="3"`) + dimension(CX - 150, 56, CX - 150, 552, TEAL);
    }
    case 'uovo-di-colibri':
      return `<g transform="rotate(-18 ${CX} ${CY})">` + path(`M${CX - 190} ${CY}C${CX - 190} ${CY - 150} ${CX + 60} ${CY - 150} ${CX + 200} ${CY - 40}C${CX + 250} ${CY} ${CX + 250} ${CY + 10} ${CX + 200} ${CY + 50}C${CX + 60} ${CY + 150} ${CX - 190} ${CY + 150} ${CX - 190} ${CY}Z`, `fill="#d9d4c8" stroke="${INK}" stroke-width="1.5"`) + '</g>' + dimension(CX - 205, CY + 215, CX + 215, CY + 215);
    case 'gocciolina-di-nebbia': {
      let s = '';
      for (let i = 0; i < 26; i++) s += circle(40 + random() * 720, 40 + random() * 520, 6 + random() * 16, `fill="none" stroke="${BLUE}" stroke-width="1" opacity="${f(0.3 + random() * 0.4)}"`);
      return s + sphere(CX, CY, 150, '#8fa9c9', 'w') + dimension(CX - 150, CY + 200, CX + 150, CY + 200);
    }
    case 'foglio-di-carta-spessore':
    case 'carta-di-credito-spessore': {
      // Orthographic views: the face above, the edge below, with the thickness dimensioned.
      const card = o.id === 'carta-di-credito-spessore';
      const t = card ? 16 : 5;
      const face = card
        ? `<rect x="190" y="90" width="420" height="265" rx="20" fill="none" stroke="${INK}" stroke-width="1.5"/><rect x="190" y="130" width="420" height="44" fill="${INK}" opacity=".18"/><rect x="232" y="222" width="62" height="48" rx="6" fill="none" stroke="${AMBER}" stroke-width="1.5"/>`
        : `<rect x="250" y="60" width="300" height="320" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
      const x1 = card ? 190 : 250;
      const x2 = card ? 610 : 550;
      const top = 470 - t / 2;
      const bottom = 470 + t / 2;
      const x = x2 + 60;
      const arrow = (y, dir) => line(x, y + dir * 46, x, y, `stroke="${TEAL}" stroke-width="1.5"`) + path(`M${x - 6} ${y + dir * 12}L${x} ${y}L${x + 6} ${y + dir * 12}`, `fill="none" stroke="${TEAL}" stroke-width="1.5"`);
      return face + `<rect x="${x1}" y="${top}" width="${x2 - x1}" height="${t}" fill="${INK}" opacity=".85"/>` + line(x2 + 12, top, x + 22, top, `stroke="${TEAL}" stroke-width="1" opacity=".7"`) + line(x2 + 12, bottom, x + 22, bottom, `stroke="${TEAL}" stroke-width="1" opacity=".7"`) + arrow(top, -1) + arrow(bottom, 1);
    }
    case 'fibra-di-seta': {
      // The thread of a silkworm seen end-on: two filaments of fibroin inside one coat of sericin.
      const tri = (x) => path(`M${x - 92} ${CY + 70}Q${x - 110} ${CY - 20} ${x} ${CY - 96}Q${x + 110} ${CY - 20} ${x + 92} ${CY + 70}Q${x} ${CY + 104} ${x - 92} ${CY + 70}Z`, `fill="${INK}" fill-opacity=".8"`);
      return `<ellipse cx="${CX}" cy="${CY}" rx="290" ry="170" fill="${AMBER}" fill-opacity=".16" stroke="${AMBER}" stroke-width="1.5"/>` + tri(CX - 122) + tri(CX + 122);
    }
    case 'pixel-di-uno-smartphone': {
      // One pixel in the middle of its neighbours: three coloured sub-pixels side by side.
      let s = '';
      for (let row = -1; row <= 1; row++)
        for (let col = -1; col <= 1; col++)
          for (const [i, colour] of ['#d9584e', '#56b86a', '#5a86e0'].entries())
            s += `<rect x="${CX - 99 + col * 236 + i * 70}" y="${CY - 99 + row * 236}" width="58" height="198" rx="12" fill="${colour}" opacity="${row || col ? 0.28 : 1}"/>`;
      return s + `<rect x="${CX - 116}" y="${CY - 116}" width="232" height="232" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="6 6"/>`;
    }
    case 'seme-di-sesamo': {
      const seed = (x, y, angle, scale) =>
        `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">` +
        path('M-150 0C-150 -84 -30 -100 90 -62C150 -42 176 -14 176 0C176 14 150 42 90 62C-30 100 -150 84 -150 0Z', `fill="#cdbd97" stroke="${INK}" stroke-width="1.2"`) +
        '</g>';
      return seed(CX, CY - 30, 0, 1.5) + dimension(CX - 225, CY + 170, CX + 264, CY + 170);
    }
    case 'righello-da-un-piede': {
      let s = `<rect x="70" y="${CY - 70}" width="660" height="140" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
      for (let i = 0; i <= 48; i++) {
        const x = 94 + (i * 612) / 48;
        const long = i % 4 === 0;
        s += line(x, CY - 70, x, CY - 70 + (long ? 56 : i % 2 === 0 ? 38 : 24), `stroke="${INK}" stroke-width="${long ? 1.5 : 1}"`);
        if (long && i < 48) s += `<text x="${f(x + 14)}" y="${CY + 16}" font-family="${MONO}" font-size="20" fill="${INK}">${i / 4 + 1}</text>`;
      }
      return s;
    }
    case 'brunei':
    case 'west-virginia': {
      // No free picture from orbit was found: a plain patch of land with its width marked, not a map.
      return (
        path(blob(CX, CY - 30, 200, random, 11, 0.3, 0.72), `fill="${TEAL}" fill-opacity=".1" stroke="${TEAL}" stroke-width="1.5"`) +
        path(blob(CX, CY - 30, 150, random, 11, 0.3, 0.72), `fill="none" stroke="${TEAL}" stroke-width="1" opacity=".5"`) +
        path(blob(CX, CY - 30, 96, random, 11, 0.3, 0.72), `fill="none" stroke="${TEAL}" stroke-width="1" opacity=".5"`) +
        bracket(150, W - 150, H - 80, '')
      );
    }
    case 'cellula-della-pelle': {
      let s = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const pts = ring6(170 + c * 165 + (r % 2 ? 82 : 0), 150 + r * 150, 88, 0);
        s += path(`M${pts.map((p) => `${f(p[0])} ${f(p[1] * 0.92 + 20)}`).join('L')}Z`, `fill="${INK}" fill-opacity="${f(0.04 + random() * 0.08)}" stroke="${INK}" stroke-width="1.5"`) + circle(170 + c * 165 + (r % 2 ? 82 : 0), (150 + r * 150) * 0.92 + 20, 13, `fill="${VIOLET}" opacity=".7"`);
      }
      return s;
    }
    case 'fibra-acrilica': {
      let s = '';
      for (let i = 0; i < 7; i++) s += path(`M${-20} ${f(90 + i * 70 + random() * 30)}Q${CX} ${f(60 + i * 70 + random() * 90)} ${W + 20} ${f(90 + i * 70 + random() * 30)}`, `fill="none" stroke="${INK}" stroke-width="30" stroke-linecap="round" opacity="${i % 2 ? 0.2 : 0.32}"`);
      return s;
    }
    case 'particella-di-limo':
      return path(blob(CX, CY, 200, random, 8, 0.16, 0.8), `fill="#6f6658" stroke="${INK}" stroke-width="1.5"`) + dimension(CX - 205, CY + 215, CX + 205, CY + 215);
    case 'limite-dell-occhio-nudo':
      // Two points at the smallest separation the eye can tell apart: the rays meet at the pupil under a small angle.
      return path(`M150 ${CY - 26}L640 ${CY}L150 ${CY + 26}`, `fill="none" stroke="${INK}" stroke-width="1.2"`) + circle(150, CY - 26, 6, `fill="${AMBER}"`) + circle(150, CY + 26, 6, `fill="${AMBER}"`) + path(`M640 ${CY - 70}A120 120 0 0 1 640 ${CY + 70}A60 120 0 0 1 640 ${CY - 70}Z`, `fill="${TEAL}" fill-opacity=".12" stroke="${TEAL}" stroke-width="1.5"`) + path(`M470 ${CY - 9}A170 170 0 0 0 470 ${CY + 9}`, `fill="none" stroke="${AMBER}" stroke-width="1.5"`) + symbol(440, CY, 'θ', 34) + dimension(110, CY - 26, 110, CY + 26, TEAL);
    case 'pelle-delle-palpebre':
      return layers([22, 60, 150], ['#8d7a70', '#5f5450', '#3a3636']) + dimension(100, 120, 100, 142, TEAL);
    case 'pelle-della-pianta-del-piede':
      return layers([150, 70, 120], ['#8d7a70', '#5f5450', '#3a3636']) + dimension(100, 120, 100, 270, TEAL);
    case 'nevischio': {
      let s = '';
      for (let i = 0; i < 46; i++) s += path(blob(60 + random() * 680, 60 + random() * 480, 9 + random() * 16, random, 7, 0.25, 0.8), `fill="${INK}" fill-opacity=".2" stroke="${INK}" stroke-width="1"`);
      return s;
    }
    case 'fiocco-di-neve-piu-grande': {
      let arm = `M0 0V-240`;
      for (const [y, len] of [[-70, 60], [-125, 78], [-180, 52]]) arm += `M0 ${y}L${len} ${y - len * 0.75}M0 ${y}L${-len} ${y - len * 0.75}`;
      let s = '';
      for (let i = 0; i < 6; i++) s += `<g transform="translate(${CX} ${CY}) rotate(${i * 60})">${path(arm, `fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"`)}</g>`;
      return s;
    }
    case 'teiera-di-russell':
      // Russell's thought experiment: a small body on an orbit between Earth and Mars, too small to detect.
      return `<ellipse cx="${CX}" cy="${CY}" rx="170" ry="120" fill="none" stroke="${INK}" stroke-width="1" opacity=".5"/><ellipse cx="${CX}" cy="${CY}" rx="320" ry="226" fill="none" stroke="${INK}" stroke-width="1" opacity=".5"/><ellipse cx="${CX}" cy="${CY}" rx="245" ry="173" fill="none" stroke="${VIOLET}" stroke-width="1.5" stroke-dasharray="6 8"/>` + body('sun', CX, CY, 'a') + circle(CX + 170, CY, 7, `fill="${BLUE}"`) + circle(CX - 320, CY, 6, `fill="${RED}"`) + circle(CX + 173, CY - 122, 3, `fill="${INK}"`) + circle(CX + 173, CY - 122, 16, `fill="none" stroke="${VIOLET}" stroke-width="1.2"`) + symbol(CX + 205, CY - 150, '?', 34);
    case 'mondo-di-minecraft': {
      // A square plane in perspective, ruled in blocks: the world is 60 million blocks on a side.
      let s = '';
      for (let i = 0; i <= 12; i++) {
        s += line(CX - 336 + i * 28, 342 - i * 16, CX + i * 28, 534 - i * 16, `stroke="${INK}" stroke-width="1" opacity=".6"`);
        s += line(CX + 336 - i * 28, 342 - i * 16, CX - i * 28, 534 - i * 16, `stroke="${INK}" stroke-width="1" opacity=".6"`);
      }
      return s + dimension(CX - 336, 372, CX, 564, TEAL);
    }
    case 'dal-pavimento-al-soffitto':
      return `<rect x="150" y="96" width="500" height="14" fill="${INK}" opacity=".85"/><rect x="150" y="490" width="500" height="14" fill="${INK}" opacity=".85"/><rect x="430" y="250" width="110" height="240" fill="none" stroke="${INK}" stroke-width="1.5"/>` + circle(522, 372, 3, `fill="${INK}"`) + dimension(250, 110, 250, 490, TEAL);
    case 'fossa-delle-marianne-profondita':
      return `<rect x="0" y="110" width="${W}" height="${H - 110}" fill="${BLUE}" opacity=".12"/>` + path(`M0 250L250 270L360 330L400 560L440 340L560 280L${W} 260V${H}H0Z`, `fill="#2a2a2c" stroke="${INK}" stroke-width="1.5"`) + line(0, 110, W, 110, `stroke="${BLUE}" stroke-width="1.5"`) + dimension(400, 110, 400, 558, TEAL);
    case 'future-circular-collider':
      return `<ellipse cx="${CX}" cy="${CY}" rx="310" ry="205" fill="none" stroke="${AMBER}" stroke-width="2.5"/><ellipse cx="${CX + 190}" cy="${CY + 60}" rx="92" ry="60" fill="none" stroke="${TEAL}" stroke-width="2"/>` + path(`M40 ${CY + 170}Q200 ${CY + 130} 330 ${CY + 190}T${W - 40} ${CY + 150}`, `fill="none" stroke="${BLUE}" stroke-width="3" opacity=".6" stroke-linecap="round"`);
    default:
      return circle(CX, CY, 190, `fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="6 10"`);
  }
}

const DRAW = { q: particle, u: unit, d: distance, w: wave, a: atomOrNucleus, m: molecule, s: star, p: world, h: blackHole, c: cosmic, n: cloud, x: dwarfGalaxy, b: everyday, o: everyday, g: everyday };
const SKY = 'sphcnx';

/** `bare` leaves the background out: the canvas draws sky objects straight onto the scene. */
export function illustration(o, bare = false) {
  const body = DRAW[o.kind](o, rng(o.id));
  let grid = '';
  if (!SKY.includes(o.kind)) {
    for (let x = 40; x < W; x += 40) grid += line(x, 0, x, H, 'stroke="#fff" stroke-width="1" opacity=".035"');
    for (let y = 40; y < H; y += 40) grid += line(0, y, W, y, 'stroke="#fff" stroke-width="1" opacity=".035"');
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">` +
    (bare ? '' : `<rect width="${W}" height="${H}" fill="${SKY.includes(o.kind) ? '#05060a' : '#0b0d13'}"/>${grid}`) + `${body}</svg>\n`
  );
}

/* ---------- run ---------- */
const objects = readJson('src/data/objects.json');
const choices = readJson('images/choices.json', {});
const plan = readJson('images/plan.json', {});
const credits = readJson('src/data/credits.json', {});
const SITE = 'https://federicokalik.github.io/scale-of-the-universe/';
mkdirSync('public/img', { recursive: true });

// An object gets a drawing when the plan gives it no photograph, or when no candidate was good enough (choice 0).
const targets = objects.filter((o) => (!plan[o.id] || choices[o.id] === 0) && !(o.image && o.imageShape !== 'art'));
const { default: sharp } = await import('sharp');
for (const o of targets) {
  const svg = illustration(o);
  writeFileSync(`public/img/${o.id}.svg`, svg);
  // A small raster copy for the canvas, which draws it in place of an emoji.
  await sharp(Buffer.from(SKY.includes(o.kind) ? illustration(o, true) : svg)).resize(512, 384).webp({ quality: 80 }).toFile(`public/img/${o.id}-256.webp`);
  o.image = o.id;
  o.imageShape = 'art';
  credits[o.id] = { title: 'Illustrazione originale', author: 'Federico Calicchia', licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/', page: SITE };
}
writeFileSync('src/data/objects.json', JSON.stringify(objects, null, 2) + '\n');
writeFileSync('src/data/credits.json', JSON.stringify(Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
console.log(`${targets.length} illustration(s) written.`);

if (process.argv.includes('--sheet')) {
  mkdirSync('images/sheets', { recursive: true });
  const PER = 24;
  for (let start = 0; start < targets.length; start += PER) {
    const group = targets.slice(start, start + PER);
    const tiles = await Promise.all(
      group.map(async (o, i) => ({
        input: await sharp(Buffer.from(illustration(o)))
          .resize(316, 237)
          .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="316" height="24"><rect width="316" height="24" fill="#000" opacity=".6"/><text x="6" y="17" font-family="sans-serif" font-size="14" fill="#fff">${o.id}</text></svg>`), left: 0, top: 0 }])
          .png()
          .toBuffer(),
        left: (i % 6) * 320 + 2,
        top: Math.floor(i / 6) * 241 + 2,
      })),
    );
    await sharp({ create: { width: 1920, height: Math.ceil(group.length / 6) * 241, channels: 3, background: '#000' } })
      .composite(tiles)
      .jpeg({ quality: 80 })
      .toFile(`images/sheets/illustrations-${String(start / PER).padStart(2, '0')}.jpg`);
  }
  console.log(`${Math.ceil(targets.length / PER)} sheet(s) written to images/sheets/.`);
}
