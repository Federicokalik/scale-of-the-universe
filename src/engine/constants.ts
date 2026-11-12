import type { Flag } from '../lib/types';

/** Scale range, in log10 metres. */
export const ZOOM_MIN = -35.6;
export const ZOOM_MAX = 27.6;
export const ZOOM_START = 0.2;

export const FLAG_ORDER: readonly Flag[] = ['r', 'n', 'i', 'u'];
export const FLAG_COLOUR: Record<Flag, string> = { r: '#ffd08a', n: '#8ff0e2', i: '#c9b8ff', u: '#b4b9c9' };

/** Upper bound (log10 metres) of each named regime; the label is ui[`regime.<index>`]. */
export const REGIME_LIMITS = [-17, -11, -8, -4, -1, 3, 7, 10, 14, 19, 22.5, 99];
