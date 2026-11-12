import { expect, test } from 'vitest';
import { slugify } from '../../src/lib/slug';

test.each([
  ['Terra', 'terra'],
  ['M87*', 'm87'],
  ['Sagittarius A*', 'sagittarius-a'],
  ['ʻOumuamua', 'oumuamua'],
  ['3I/ATLAS', '3i-atlas'],
  ['Molecola di CO₂', 'molecola-di-co2'],
  ['Elettrone (limite superiore)', 'elettrone-limite-superiore'],
  ['Ångström', 'angstrom'],
])('slugify(%s) -> %s', (name, id) => {
  expect(slugify(name)).toBe(id);
});
