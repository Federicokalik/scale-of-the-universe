import { expect, test } from 'vitest';
import type { LocaleFile, ObjectRecord } from '../../src/lib/types';
import { validateData } from '../../src/lib/validate';

const obj = (over: Partial<ObjectRecord> = {}): ObjectRecord => ({
  id: 'terra', size: 1.2742e7, kind: 'p', glyph: '#3b82c4', flags: [], image: null, sources: [], verified: null, ...over,
});
const loc = (ids: string[]): LocaleFile => ({ ui: {}, objects: Object.fromEntries(ids.map((id) => [id, { name: id, desc: '' }])) });

test('coherent data has no problems', () => {
  expect(validateData([obj()], { it: loc(['terra']) })).toEqual([]);
});

test('duplicate ids are reported', () => {
  expect(validateData([obj(), obj()], { it: loc(['terra']) })).toContain('duplicate id: terra');
});

test('non-slug ids, bad sizes, kinds and flags are reported', () => {
  const problems = validateData(
    [obj({ id: 'Terra!', size: 0, kind: 'z' as never, flags: ['q' as never] })],
    { it: loc(['Terra!']) },
  );
  expect(problems).toEqual(expect.arrayContaining([
    'Terra!: id is not a slug', 'Terra!: size must be a positive number', 'Terra!: unknown kind "z"', 'Terra!: unknown flag "q"',
  ]));
});

test('a locale missing an object, or holding an unknown one, is reported', () => {
  const problems = validateData([obj()], { it: loc(['luna']) });
  expect(problems).toEqual(expect.arrayContaining(['it: missing entry for terra', 'it: entry for unknown object luna']));
});

test('an object with an empty name is reported', () => {
  expect(validateData([obj()], { it: { ui: {}, objects: { terra: { name: '', desc: '' } } } })).toContain('it: terra has no name');
});

test('strict mode requires source, verification date, image and description', () => {
  expect(validateData([obj()], { it: loc(['terra']) }, { strict: true })).toEqual(expect.arrayContaining([
    'terra: no source', 'terra: no verification date', 'terra: no image', 'it: terra has no description',
  ]));
});

test('objects out of size order are reported', () => {
  const problems = validateData(
    [obj({ id: 'terra', size: 10 }), obj({ id: 'luna', size: 5 })],
    { it: loc(['terra', 'luna']) },
  );
  expect(problems).toContain('luna: out of size order (must not be smaller than terra)');
});
