/**
 * The animated backdrop behind the objects. Like the music, it follows the scale:
 * seven procedural layers, one per regime, cross-fading as you zoom.
 */
import { rng } from './sprites';

type Ctx = CanvasRenderingContext2D;

export type Layer = 'foam' | 'lattice' | 'cells' | 'motes' | 'stars' | 'nebula' | 'web';

/** Each layer's home range, in log10 metres. Neighbours cross-fade over FADE decades. */
const RANGES: readonly (readonly [Layer, number, number])[] = [
  ['foam', -Infinity, -15],
  ['lattice', -15, -8],
  ['cells', -8, -3],
  ['motes', -3, 4],
  ['stars', 4, 12],
  ['nebula', 12, 19],
  ['web', 19, Infinity],
];
const FADE = 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** How much of the backdrop each layer owns at this scale. Always sums to one. */
export function layerWeights(z: number): Record<Layer, number> {
  const weights = {} as Record<Layer, number>;
  for (const [layer, low, high] of RANGES) {
    weights[layer] = clamp01((z - (low - FADE / 2)) / FADE) * clamp01((high + FADE / 2 - z) / FADE);
  }
  return weights;
}

interface Point {
  /** Position as a fraction of the viewport, 0..1. */
  x: number;
  y: number;
  /** Per-point random values for size, phase and speed. */
  a: number;
  b: number;
  c: number;
}

function scatter(count: number, seed: number): Point[] {
  const r = rng(seed);
  return Array.from({ length: count }, () => ({ x: r(), y: r(), a: r(), b: r(), c: r() }));
}

const FOAM = scatter(80, 301);
const CELLS = scatter(16, 302);
const MOTES = scatter(70, 303);
const STARS = scatter(260, 304);
const CLOUDS = scatter(7, 305);
const NODES = scatter(64, 306);

/** For each web node, its two nearest neighbours: the filaments. */
const FILAMENTS: [number, number][] = NODES.flatMap((p, i) =>
  NODES.map((q, j) => [(q.x - p.x) ** 2 + (q.y - p.y) ** 2, j] as const)
    .sort((m, n) => m[0] - n[0])
    .slice(1, 3)
    .map(([, j]) => [i, j] as [number, number]),
);

const CLOUD_COLOURS = ['255,110,160', '110,150,255', '110,220,210', '190,140,255'];

export interface Backdrop {
  draw(z: number, t: number, width: number, height: number): void;
}

export function createBackdrop(ctx: Ctx): Backdrop {
  function disc(x: number, y: number, r: number, rgb: string, alpha: number): void {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }

  /** Planck scale: bubbles of spacetime that swell and vanish. */
  function foam(a: number, t: number, w: number, h: number): void {
    ctx.lineWidth = 1;
    for (const p of FOAM) {
      const life = (t * (0.25 + p.a * 0.5) + p.b * 10) % 1;
      // Each bubble reappears somewhere new once it has faded.
      const cycle = Math.floor(t * (0.25 + p.a * 0.5) + p.b * 10);
      const x = ((p.x + cycle * 0.618) % 1) * w;
      const y = ((p.y + cycle * 0.382) % 1) * h;
      ctx.strokeStyle = `rgba(200,180,255,${a * 0.34 * Math.sin(life * Math.PI)})`;
      ctx.beginPath();
      ctx.arc(x, y, 4 + life * (10 + p.c * 26), 0, 7);
      ctx.stroke();
    }
  }

  /** Atoms and molecules: a breathing lattice that slides as you zoom. */
  function lattice(a: number, t: number, z: number, w: number, h: number): void {
    const step = 58;
    const rowHeight = step * 0.866;
    const shift = (((z * 46) % step) + step) % step;
    ctx.fillStyle = `rgba(143,240,226,${a * 0.42})`;
    for (let row = -1; row * rowHeight < h + rowHeight; row++) {
      const offset = (row & 1 ? step / 2 : 0) + shift - step;
      for (let x = offset; x < w + step; x += step) {
        const y = row * rowHeight;
        const wave = Math.sin(t * 0.8 + x * 0.012 + y * 0.016);
        ctx.beginPath();
        ctx.arc(x + wave * 3, y + wave * 3, 1.3 + (wave + 1) * 0.6, 0, 7);
        ctx.fill();
      }
    }
  }

  /** Cells: large soft membranes drifting past. */
  function cells(a: number, t: number, w: number, h: number): void {
    for (const p of CELLS) {
      const x = ((p.x + t * 0.006 * (p.a - 0.5) + 1) % 1) * w;
      const y = ((p.y + t * 0.004 * (p.b - 0.5) + 1) % 1) * h;
      const r = (50 + p.c * 130) * (1 + 0.05 * Math.sin(t * 0.5 + p.a * 7));
      disc(x, y, r, '127,224,212', a * 0.06);
      ctx.strokeStyle = `rgba(127,224,212,${a * 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.86, 0, 7);
      ctx.stroke();
      disc(x + r * 0.2, y - r * 0.15, r * 0.3, '185,162,255', a * 0.09);
    }
  }

  /** Human scale: dust motes in warm light, slowly rising. */
  function motes(a: number, t: number, w: number, h: number): void {
    disc(w * 0.5, h * 1.05, Math.max(w, h) * 0.7, '255,214,170', a * 0.1);
    for (const p of MOTES) {
      const x = (p.x + Math.sin(t * 0.2 + p.a * 7) * 0.012) * w;
      const y = ((p.y - t * 0.006 * (0.4 + p.b) + 100) % 1) * h;
      disc(x, y, 3 + p.c * 22, '255,236,210', a * (0.05 + p.a * 0.09));
    }
  }

  /** From planets up: a sky of stars that turns slightly as you zoom. */
  function stars(a: number, t: number, z: number, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    const reach = Math.hypot(w, h) / 2;
    const turn = z * 0.06;
    for (const p of STARS) {
      const angle = p.x * Math.PI * 2 + turn * (0.4 + p.b);
      const distance = Math.sqrt(p.y) * reach;
      const twinkle = 0.55 + 0.45 * Math.sin(t * (0.6 + p.a * 1.8) + p.b * 9);
      ctx.fillStyle = `rgba(${p.c > 0.8 ? '255,214,170' : p.c < 0.15 ? '170,200,255' : '255,255,255'},${a * 0.75 * twinkle})`;
      const size = 0.7 + p.a * 1.5;
      ctx.fillRect(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance, size, size);
    }
  }

  /** Nebulae: coloured gas clouds drifting in front of the stars. */
  function nebula(a: number, t: number, w: number, h: number): void {
    ctx.globalCompositeOperation = 'lighter';
    CLOUDS.forEach((p, i) => {
      const x = (p.x + Math.sin(t * 0.05 + p.a * 7) * 0.05) * w;
      const y = (p.y + Math.cos(t * 0.04 + p.b * 7) * 0.05) * h;
      disc(x, y, Math.max(w, h) * (0.22 + p.c * 0.2), CLOUD_COLOURS[i % CLOUD_COLOURS.length], a * 0.13);
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  /** The largest scales: filaments of the cosmic web, slowly breathing. */
  function web(a: number, t: number, w: number, h: number): void {
    const at = (p: Point): [number, number] => [
      (p.x + Math.sin(t * 0.07 + p.a * 7) * 0.012) * w,
      (p.y + Math.cos(t * 0.06 + p.b * 7) * 0.012) * h,
    ];
    ctx.strokeStyle = `rgba(190,170,255,${a * 0.13})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [i, j] of FILAMENTS) {
      const [x0, y0] = at(NODES[i]);
      const [x1, y1] = at(NODES[j]);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
    ctx.stroke();
    for (const p of NODES) {
      const [x, y] = at(p);
      disc(x, y, 5 + p.c * 9, '255,225,190', a * (0.14 + 0.08 * Math.sin(t * 0.5 + p.a * 9)));
    }
  }

  return {
    draw(z, t, width, height) {
      const weight = layerWeights(z);
      ctx.save();
      ctx.globalAlpha = 1;
      if (weight.foam > 0.01) foam(weight.foam, t, width, height);
      if (weight.lattice > 0.01) lattice(weight.lattice, t, z, width, height);
      if (weight.cells > 0.01) cells(weight.cells, t, width, height);
      if (weight.motes > 0.01) motes(weight.motes, t, width, height);
      // Stars stay on behind the nebulae and, fainter, behind the cosmic web.
      const sky = weight.stars + weight.nebula * 0.7 + weight.web * 0.35;
      if (sky > 0.01) stars(sky, t, z, width, height);
      if (weight.nebula > 0.01) nebula(weight.nebula, t, width, height);
      if (weight.web > 0.01) web(weight.web, t, width, height);
      ctx.restore();
    },
  };
}
