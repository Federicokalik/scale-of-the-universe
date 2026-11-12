import type { SceneObject } from '../lib/types';

/** A scene object with the derived values the renderer needs. */
export interface Placed extends SceneObject {
  /** Index in size order. */
  index: number;
  /** log10 of the size in metres. */
  log: number;
  /** Angle around the centre, golden-angle spaced so neighbours do not overlap. */
  angle: number;
  /** Distance from the centre, in units of the object's own diameter. */
  distance: number;
  /** Emoji to draw, or '' when the glyph is a colour or a sprite code. */
  emoji: string;
}

const GOLDEN_ANGLE = 2.39996323;
const GOLDEN_RATIO_FRACTION = 0.6180339887;

export function place(objects: SceneObject[]): Placed[] {
  return objects.map((o, index) => ({
    ...o,
    index,
    log: Math.log10(o.size),
    angle: index * GOLDEN_ANGLE,
    distance: 1.02 + 0.5 * ((index * GOLDEN_RATIO_FRACTION) % 1),
    emoji: o.glyph && o.glyph[0] !== '#' && !/^[0-9EI]$/.test(o.glyph) ? o.glyph : '',
  }));
}
