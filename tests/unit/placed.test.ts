import { expect, test } from 'vitest';
import { place } from '../../src/engine/placed';
import type { SceneObject } from '../../src/lib/types';

const object = (id: string, size: number, glyph: string): SceneObject => ({
  id, size, glyph, kind: 'o', flags: [], image: null, sources: [], verified: null, name: id, desc: '',
});

test('an emoji glyph is drawn as an emoji', () => {
  expect(place([object('gatto', 0.46, '🐈')])[0].emoji).toBe('🐈');
});

test.each(['#3b82c4', '', '0', '4', 'E', 'I'])('glyph "%s" is a colour or sprite code, not an emoji', (glyph) => {
  expect(place([object('x', 1, glyph)])[0].emoji).toBe('');
});

test('each object gets its index and the log of its size', () => {
  const placed = place([object('a', 1e-3, ''), object('b', 1e6, '')]);
  expect(placed.map((p) => [p.index, p.log])).toEqual([[0, -3], [1, 6]]);
});

test('objects sit between 1.02 and 1.52 diameters from the centre', () => {
  const placed = place(Array.from({ length: 50 }, (_, i) => object(`o${i}`, 1, '')));
  for (const p of placed) {
    expect(p.distance).toBeGreaterThanOrEqual(1.02);
    expect(p.distance).toBeLessThan(1.52);
  }
});
