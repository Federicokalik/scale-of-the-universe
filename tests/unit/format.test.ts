import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { formatCompare, formatSci, formatSize } from '../../src/lib/format';

const ui: Record<string, string> = JSON.parse(
  readFileSync(new URL('../../src/data/i18n/it.json', import.meta.url), 'utf8'),
).ui;

test.each([
  [1.7, '1,7 m'],
  [8849, '8,85 km'],
  [1.2742e7, '12.742 km'],
  [1.3914e9, '1,39 milioni di km'],
  [1.496e11, '1 UA'],
  [9.461e15, '1 anno luce'],
  [4.018e16, '4,25 anni luce'],
  [1.44e21, '152.209 anni luce'],
  [2.4e22, '2,54 milioni di anni luce'],
  [8.8e26, '93 miliardi di anni luce'],
  [5.5e-2, '5,5 cm'],
  [7.5e-6, '7,5 µm'],
  [1.68e-15, '1,68 fm'],
  [1.616e-35, '1,62 × 10⁻³⁵ m'],
])('formatSize(%s) in Italian -> %s', (metres, text) => {
  expect(formatSize(metres, 'it', ui)).toBe(text);
});

test('formatSize follows the locale for digits', () => {
  expect(formatSize(1.7, 'en', ui)).toBe('1.7 m');
});

test('formatSci drops a mantissa of one', () => {
  expect(formatSci(1e-24, 'it')).toBe('10⁻²⁴ m');
});

test('formatSci keeps two decimals', () => {
  expect(formatSci(1.2742e7, 'it')).toBe('1,27 × 10⁷ m');
});

test('formatSci rounds a mantissa near ten up to the next power', () => {
  expect(formatSci(9.999e5, 'it')).toBe('10⁶ m');
});

test.each([
  [1.2742e7, "Circa 1,4K volte l'Everest."],
  // Intl puts a non-breaking space before compact suffixes.
  [1e-24, 'Circa 1/1,7 Mld di un protone.'],
  [8.8e26, 'Circa 1,1 Mln volte la Via Lattea.'],
  [1.7, 'Circa 21K volte un capello.'],
])('formatCompare(%s) in Italian -> %s', (metres, text) => {
  expect(formatCompare(metres, 'it', ui)).toBe(text);
});
