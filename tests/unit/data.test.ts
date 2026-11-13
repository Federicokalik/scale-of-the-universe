import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import type { LocaleFile, ObjectRecord } from '../../src/lib/types';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const draft = read('reference/draft.html');
const objects: ObjectRecord[] = JSON.parse(read('src/data/objects.json'));
const it: LocaleFile = JSON.parse(read('src/data/i18n/it.json'));
const raw = draft.match(/const RAW=`([\s\S]*?)`;/)![1].trim().split('\n');

// Draft rows dropped in phase 2 because no openable source gave their size (see claudedocs/fase-2-decisioni-aperte.md).
const REMOVED = ['fiammifero'];

test('every draft row becomes one object, except the ones removed for lack of a source', () => {
  expect(objects.length).toBe(raw.length - REMOVED.length);
  for (const id of REMOVED) expect(objects.some((o) => o.id === id)).toBe(false);
});

test('ids are unique', () => {
  expect(new Set(objects.map((o) => o.id)).size).toBe(objects.length);
});

test('objects are sorted by size', () => {
  const sizes = objects.map((o) => o.size);
  expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
});

test('italian file has exactly one entry per object', () => {
  expect(Object.keys(it.objects).sort()).toEqual(objects.map((o) => o.id).sort());
});

test('fields are carried over from the draft', () => {
  expect(objects.find((o) => o.id === 'terra')).toMatchObject({ size: 1.2742e7, kind: 'p', glyph: '#3b82c4', flags: [] });
  expect(objects.find((o) => o.id === 'woh-g64')!.flags).toEqual(['r', 'u']);
  // Descriptions are rewritten by the research phase, so only the name is pinned here.
  expect(it.objects['lunghezza-di-planck'].name).toBe('Lunghezza di Planck');
  expect(it.objects['terra'].name).toBe('Terra');
});
