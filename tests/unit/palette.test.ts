import { expect, test } from 'vitest';
import { depthDim, paletteAt, type Rgb } from '../../src/engine/palette';

/** Perceived brightness, 0..255. */
const luma = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const brightness = (z: number) => paletteAt(z).fields.reduce((sum, c) => sum + luma(c), 0);

test('the human scale is warm amber', () => {
  const [r, g, b] = paletteAt(0).fields[0];
  expect(r).toBeGreaterThan(g);
  expect(g).toBeGreaterThan(b);
});

test('the cellular scale is green', () => {
  const [r, g, b] = paletteAt(-5.5).fields[0];
  expect(g).toBeGreaterThan(r);
  expect(g).toBeGreaterThan(b);
});

test('colours are at full strength up to the human scale', () => {
  expect(depthDim(-30)).toBe(1);
  expect(depthDim(3)).toBe(1);
});

test('colours only ever get darker as the scale grows beyond the human one', () => {
  for (let z = 3; z < 27.5; z += 0.25) expect(depthDim(z + 0.25)).toBeLessThanOrEqual(depthDim(z));
  expect(depthDim(27)).toBeLessThan(0.4);
});

test('the cosmic scales are darker than planets, which are darker than the human scale', () => {
  expect(brightness(25)).toBeLessThan(brightness(16));
  expect(brightness(16)).toBeLessThan(brightness(8));
  expect(brightness(8)).toBeLessThan(brightness(0));
});

test('colour never jumps: a tenth of a decade changes each channel only slightly', () => {
  for (let z = -35; z < 27; z += 0.1) {
    const a = paletteAt(z);
    const b = paletteAt(z + 0.1);
    for (let field = 0; field < 3; field++) {
      for (let channel = 0; channel < 3; channel++) {
        expect(Math.abs(a.fields[field][channel] - b.fields[field][channel])).toBeLessThanOrEqual(14);
      }
    }
  }
});

test('the accent stays light enough to read on a dark panel at every scale', () => {
  for (let z = -35; z <= 27; z += 1) expect(luma(paletteAt(z).accent)).toBeGreaterThan(150);
});
