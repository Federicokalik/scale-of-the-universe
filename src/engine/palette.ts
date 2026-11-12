/**
 * Colour follows the scale, the way the music does. Each regime has three field
 * colours for the backdrop and one accent for the interface; neighbours blend,
 * and everything darkens as the scale grows towards the whole universe.
 */

export type Rgb = [number, number, number];

export interface Palette {
  /** Three colour fields painted behind the objects. */
  fields: [Rgb, Rgb, Rgb];
  /** Highlight colour for numbers and labels in the panels. Never dimmed. */
  accent: Rgb;
}

interface Regime extends Palette {
  /** Upper bound of the regime, log10 metres. */
  to: number;
}

const REGIMES: readonly Regime[] = [
  { to: -15, fields: [[109, 59, 214], [176, 75, 217], [43, 26, 107]], accent: [201, 184, 255] }, // particles: violet
  { to: -8, fields: [[15, 163, 163], [42, 111, 219], [11, 58, 74]], accent: [143, 240, 226] }, // atoms: teal
  { to: -3, fields: [[47, 174, 106], [143, 209, 79], [12, 59, 42]], accent: [170, 232, 150] }, // cells: green
  { to: 4, fields: [[227, 154, 59], [217, 96, 59], [74, 42, 18]], accent: [255, 208, 138] }, // human: amber
  { to: 12, fields: [[47, 111, 224], [53, 192, 214], [12, 31, 74]], accent: [150, 205, 255] }, // planets, stars: blue
  { to: 19, fields: [[214, 59, 143], [122, 59, 224], [58, 15, 58]], accent: [255, 170, 215] }, // nebulae: magenta
  { to: Infinity, fields: [[59, 63, 214], [106, 90, 214], [10, 10, 46]], accent: [232, 183, 106] }, // galaxies and beyond: indigo
];

/** Decades over which one regime's colours turn into the next one's. */
const BLEND = 2;
/** Colours start to darken above this scale and are darkest at DIM_END. */
const DIM_START = 3;
const DIM_END = 27;
const DIM_FLOOR = 0.35;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: Rgb, b: Rgb, u: number): Rgb => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * u) as Rgb;
const scale = (c: Rgb, k: number): Rgb => c.map((v) => Math.round(v * k)) as Rgb;

/**
 * How much of their strength the field colours keep: 1 up to the human scale,
 * falling steadily to DIM_FLOOR at the largest scales. The vaster, the darker.
 */
export function depthDim(z: number): number {
  return 1 - clamp01((z - DIM_START) / (DIM_END - DIM_START)) * (1 - DIM_FLOOR);
}

export function paletteAt(z: number): Palette {
  const index = REGIMES.findIndex((regime) => z < regime.to);
  const here = REGIMES[index];
  const next = REGIMES[index + 1] ?? here;
  // The blend happens in the last BLEND decades of a regime, so colour never jumps.
  const u = clamp01((z - (here.to - BLEND)) / BLEND);
  const dim = depthDim(z);
  return {
    fields: here.fields.map((c, i) => scale(mix(c, next.fields[i], u), dim)) as [Rgb, Rgb, Rgb],
    accent: scale(mix(here.accent, next.accent, u), 1),
  };
}
