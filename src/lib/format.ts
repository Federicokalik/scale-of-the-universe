/** Locale-aware formatting of sizes in metres. Words come from `ui`; SI symbols stay in code. */

type Ui = Record<string, string>;

const LIGHT_YEAR = 9.4607e15;
const ASTRONOMICAL_UNIT = 1.495978707e11;

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
};

const SUB_METRE: readonly [number, string][] = [
  [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm'],
  [1e-15, 'fm'], [1e-18, 'am'], [1e-21, 'zm'], [1e-24, 'ym'],
];

/** Familiar sizes used for "about N times X" comparisons, smallest first. */
const ANCHORS: readonly [string, number][] = [
  ['anchor.proton', 1.68e-15], ['anchor.hydrogen', 1.06e-10], ['anchor.redcell', 7.5e-6],
  ['anchor.hair', 8e-5], ['anchor.person', 1.7], ['anchor.everest', 8849],
  ['anchor.earth', 1.2742e7], ['anchor.sun', 1.3914e9], ['anchor.au', 1.496e11],
  ['anchor.ly', 9.461e15], ['anchor.milkyway', 8.3e20], ['anchor.universe', 8.8e26],
];

export const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export const superscript = (n: number): string => [...String(n)].map((c) => SUPERSCRIPT[c]).join('');

/** Fewer decimals as the number grows: 1,23 / 12,3 / 123. */
function number(v: number, locale: string): string {
  return v.toLocaleString(locale, { maximumFractionDigits: v >= 100 ? 0 : v >= 10 ? 1 : 2 });
}

export function formatSci(metres: number, locale: string): string {
  let exponent = Math.floor(Math.log10(metres));
  let mantissa = metres / 10 ** exponent;
  if (mantissa >= 9.995) {
    mantissa = 1;
    exponent++;
  }
  const isOne = Math.round(mantissa * 100) === 100;
  const text = mantissa.toLocaleString(locale, { maximumFractionDigits: 2 });
  return `${isOne ? '' : `${text} × `}10${superscript(exponent)} m`;
}

export function formatSize(metres: number, locale: string, ui: Ui): string {
  if (metres >= LIGHT_YEAR * 0.5) {
    const ly = metres / LIGHT_YEAR;
    if (ly >= 1e9) return fill(ui['unit.ly.billions'], { n: number(ly / 1e9, locale) });
    if (ly >= 1e6) return fill(ui['unit.ly.millions'], { n: number(ly / 1e6, locale) });
    if (Math.abs(ly - 1) < 0.005) return ui['unit.ly.one'];
    return fill(ui['unit.ly'], { n: number(ly, locale) });
  }
  if (metres >= ASTRONOMICAL_UNIT * 0.5) return fill(ui['unit.au'], { n: number(metres / ASTRONOMICAL_UNIT, locale) });
  if (metres >= 1e9) return fill(ui['unit.mkm'], { n: number(metres / 1e9, locale) });
  if (metres >= 1e3) return `${number(metres / 1e3, locale)} km`;
  if (metres >= 1) return `${number(metres, locale)} m`;
  for (const [unit, symbol] of SUB_METRE) if (metres >= unit) return `${number(metres / unit, locale)} ${symbol}`;
  return formatSci(metres, locale);
}

function ratio(r: number, locale: string): string {
  if (r >= 1e15) return `10${superscript(Math.round(Math.log10(r)))}`;
  return r.toLocaleString(locale, { notation: 'compact', maximumSignificantDigits: 2 });
}

/** "About N times X", against the largest anchor at most half the size; a fraction below the smallest. */
export function formatCompare(metres: number, locale: string, ui: Ui): string {
  let smaller: readonly [string, number] | undefined;
  for (const anchor of ANCHORS) if (anchor[1] <= metres / 2) smaller = anchor;
  if (smaller) return fill(ui['compare.times'], { n: ratio(metres / smaller[1], locale), a: ui[smaller[0]] });
  const larger = ANCHORS.find((anchor) => anchor[1] >= metres * 2);
  return larger ? fill(ui['compare.fraction'], { n: ratio(larger[1] / metres, locale), a: ui[larger[0]] }) : '';
}
