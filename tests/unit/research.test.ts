import { expect, test } from 'vitest';
import { applyResearch, validateResearch, type ResearchEntry } from '../../src/lib/research';
import type { LocaleFile, ObjectRecord } from '../../src/lib/types';

const objects: ObjectRecord[] = [
  { id: 'luna', size: 3.475e6, kind: 'p', glyph: '#c9c9c9', flags: [], image: null, sources: [], verified: null },
  { id: 'terra', size: 1.2742e7, kind: 'p', glyph: '#3b82c4', flags: [], image: null, sources: [], verified: null },
];
const locale: LocaleFile = {
  ui: { title: 'x' },
  objects: { luna: { name: 'Luna', desc: '' }, terra: { name: 'Terra', desc: '' } },
};
const entry = (over: Partial<ResearchEntry> = {}): ResearchEntry => ({
  id: 'terra',
  size: 1.2742e7,
  basis: 'diametro medio',
  verdict: 'confirmed',
  flags: [],
  desc: 'Il terzo pianeta dal Sole, largo in media 12.742 km. È l’unico mondo noto con oceani liquidi in superficie.',
  sources: [{ title: 'Earth Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html', publisher: 'NASA', evidence: 'Volumetric mean radius (km) 6371.0' }],
  note: '',
  verified: '2026-11-12',
  ...over,
});

test('a complete entry has no problems', () => {
  expect(validateResearch([entry()], objects)).toEqual([]);
});

test('an entry for an unknown object is reported', () => {
  expect(validateResearch([entry({ id: 'marte' })], objects)).toContain('marte: no such object');
});

test('an entry needs a source with an https address, a title and the supporting evidence', () => {
  const problems = validateResearch(
    [entry({ sources: [{ title: '', url: 'http://example.org', publisher: 'x', evidence: '' }] })],
    objects,
  );
  expect(problems).toEqual(expect.arrayContaining([
    'terra: source 1 has no title', 'terra: source 1 address must start with https://', 'terra: source 1 has no evidence',
  ]));
  expect(validateResearch([entry({ sources: [] })], objects)).toContain('terra: no source');
});

test('Wikipedia is not accepted as a cited source', () => {
  const sources = [{ title: 'Earth', url: 'https://en.wikipedia.org/wiki/Earth', publisher: 'Wikipedia', evidence: '12,742 km' }];
  expect(validateResearch([entry({ sources })], objects)).toContain('terra: source 1 is Wikipedia, cite the primary source instead');
});

test('the description must be two or three sentences', () => {
  expect(validateResearch([entry({ desc: 'Una frase sola.' })], objects)).toContain('terra: description must be 2 or 3 sentences, found 1');
  expect(validateResearch([entry({ desc: 'Uno. Due. Tre. Quattro.' })], objects)).toContain('terra: description must be 2 or 3 sentences, found 4');
});

test('decimals and abbreviations do not count as sentence ends', () => {
  const desc = 'Raggio di carica di 0,8408 fm secondo CODATA 2022. Misurato anche con l’idrogeno muonico, cioè con un metodo indipendente.';
  expect(validateResearch([entry({ desc })], objects)).toEqual([]);
});

test('a corrected value must differ, be flagged as updated and say what changed', () => {
  const problems = validateResearch([entry({ verdict: 'corrected', note: '' })], objects);
  expect(problems).toEqual(expect.arrayContaining([
    'terra: verdict is "corrected" but the size is unchanged', 'terra: a corrected value needs the "r" flag', 'terra: a corrected value needs a note saying what changed',
  ]));
});

test('an uncertain value must carry the uncertain flag', () => {
  expect(validateResearch([entry({ verdict: 'uncertain' })], objects)).toContain('terra: an uncertain value needs the "u" flag');
});

test('a confirmed value may not silently change the size', () => {
  expect(validateResearch([entry({ size: 1.3e7 })], objects)).toContain('terra: size changed but verdict is "confirmed"');
});

test('the verification date must be an ISO date', () => {
  expect(validateResearch([entry({ verified: '12/11/2026' })], objects)).toContain('terra: verified must be a date like 2026-11-12');
});

test('applying research fills size, flags, sources, date and description', () => {
  const corrected = entry({
    id: 'luna', size: 3.4748e6, verdict: 'corrected', flags: ['r'], note: 'Diametro medio da 3.475 a 3.474,8 km.',
    desc: 'Il satellite naturale della Terra. Ha un diametro medio di 3.474,8 km.',
  });
  const result = applyResearch(objects, locale, [corrected, entry()]);
  const luna = result.objects.find((o) => o.id === 'luna')!;
  expect(luna).toMatchObject({ size: 3.4748e6, flags: ['r'], verified: '2026-11-12' });
  expect(luna.sources).toEqual([{ title: 'Earth Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html', publisher: 'NASA' }]);
  expect(result.locale.objects.luna).toEqual({ name: 'Luna', desc: corrected.desc });
  expect(result.locale.ui).toEqual({ title: 'x' });
  expect(result.applied).toEqual(['luna', 'terra']);
});

test('applying research keeps the objects in size order', () => {
  const huge = entry({ id: 'luna', size: 9e9, verdict: 'corrected', flags: ['r'], note: 'test' });
  const result = applyResearch(objects, locale, [huge]);
  expect(result.objects.map((o) => o.id)).toEqual(['terra', 'luna']);
});

test('objects proposed for removal are listed, not removed', () => {
  const result = applyResearch(objects, locale, [entry({ verdict: 'remove', note: 'Nessuna fonte affidabile.' })]);
  expect(result.proposedRemovals).toEqual([{ id: 'terra', note: 'Nessuna fonte affidabile.' }]);
  expect(result.objects.find((o) => o.id === 'terra')!.verified).toBeNull();
  expect(result.applied).toEqual([]);
});

test('the input data is not modified', () => {
  applyResearch(objects, locale, [entry({ id: 'luna', size: 1, verdict: 'corrected', flags: ['r'], note: 'x' })]);
  expect(objects[0].size).toBe(3.475e6);
  expect(locale.objects.luna.desc).toBe('');
});
