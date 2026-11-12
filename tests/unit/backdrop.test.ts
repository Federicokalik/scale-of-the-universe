import { expect, test } from 'vitest';
import { layerWeights } from '../../src/engine/backdrop';

test.each([
  [-30, 'foam'],
  [-12, 'lattice'],
  [-5, 'cells'],
  [0, 'motes'],
  [8, 'stars'],
  [16, 'nebula'],
  [25, 'web'],
])('at 10^%s m the backdrop is entirely "%s"', (z, layer) => {
  const weights = layerWeights(z);
  expect(weights[layer as keyof typeof weights]).toBe(1);
  expect(Object.values(weights).reduce((a, b) => a + b, 0)).toBe(1);
});

test('on a boundary the two neighbouring layers share the backdrop equally', () => {
  const weights = layerWeights(-15);
  expect(weights.foam).toBeCloseTo(0.5);
  expect(weights.lattice).toBeCloseTo(0.5);
});

test('layers always add up to one, so the backdrop never dims between regimes', () => {
  for (let z = -36; z <= 28; z += 0.25) {
    const total = Object.values(layerWeights(z)).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
  }
});
