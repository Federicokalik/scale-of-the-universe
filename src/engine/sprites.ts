/** Procedural sprites for nebulae, galaxies and the cosmic web. Built once, in the browser. */

/** Small seeded generator (mulberry32) so sprites look the same on every visit. */
export function rng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;

function sprite(paint: (g: Ctx, size: number) => void, size = 256): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d')!, size);
  return canvas;
}

/** Soft radial blob. `colour` is an rgba() string with `A` in place of the alpha. */
function blob(g: Ctx, x: number, y: number, r: number, colour: string, alpha: number): void {
  const gradient = g.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, colour.replace('A', String(alpha)));
  gradient.addColorStop(1, colour.replace('A', '0'));
  g.fillStyle = gradient;
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fill();
}

const NEBULA_PALETTES = [
  ['rgba(255,110,130,A)', 'rgba(255,170,120,A)', 'rgba(140,160,255,A)'],
  ['rgba(110,220,210,A)', 'rgba(120,160,255,A)', 'rgba(200,255,240,A)'],
  ['rgba(170,140,255,A)', 'rgba(110,200,255,A)', 'rgba(255,150,220,A)'],
  ['rgba(255,190,110,A)', 'rgba(200,120,90,A)', 'rgba(255,230,180,A)'],
  ['rgba(255,240,210,A)', 'rgba(255,210,150,A)', 'rgba(220,230,255,A)'],
];

function nebula(palette: string[], k: number): HTMLCanvasElement {
  return sprite((g, S) => {
    const r = rng(11 + k * 7);
    g.globalCompositeOperation = 'lighter';
    if (k === 4) {
      // Palette 4 is a star cluster: points instead of gas.
      for (let i = 0; i < 900; i++) {
        const a = r() * 7;
        const d = Math.pow(r(), 2.2) * S * 0.46;
        g.fillStyle = palette[i % 3].replace('A', String(0.5 + r() * 0.5));
        g.fillRect(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, 1.4, 1.4);
      }
      blob(g, S / 2, S / 2, S * 0.3, palette[0], 0.35);
      return;
    }
    for (let i = 0; i < 22; i++) {
      const a = r() * 7;
      const d = r() * S * 0.27;
      blob(g, S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, S * (0.1 + r() * 0.16), palette[i % 3], 0.16 + r() * 0.14);
    }
    for (let i = 0; i < 40; i++) {
      const a = r() * 7;
      const d = r() * S * 0.4;
      g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`;
      g.fillRect(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, 1.2, 1.2);
    }
  });
}

export type GalaxyKind = 'S' | 'E' | 'I';

function galaxy(kind: GalaxyKind, seed: number, tint: string): HTMLCanvasElement {
  return sprite((g, S) => {
    const r = rng(seed);
    g.globalCompositeOperation = 'lighter';
    blob(g, S / 2, S / 2, S * 0.46, tint, kind === 'E' ? 0.5 : 0.16);
    blob(g, S / 2, S / 2, S * 0.13, 'rgba(255,244,214,A)', 0.95);
    if (kind === 'E') return;
    const arms = kind === 'I' ? 0 : 2;
    for (let i = 0; i < 1500; i++) {
      let x: number;
      let y: number;
      if (arms) {
        const t = r();
        const arm = i % arms;
        const angle = t * 5.2 + arm * Math.PI + (r() - 0.5) * 0.55;
        const d = t * S * 0.45 + (r() - 0.5) * S * 0.05;
        x = Math.cos(angle) * d;
        y = Math.sin(angle) * d;
      } else {
        const a = r() * 7;
        const d = Math.sqrt(r()) * S * 0.4;
        x = Math.cos(a) * d * (1 + 0.4 * Math.sin(a * 3));
        y = Math.sin(a) * d * 0.7;
      }
      g.fillStyle = (i % 5 ? tint : 'rgba(255,200,210,A)').replace('A', String(0.25 + r() * 0.6));
      g.fillRect(S / 2 + x, S / 2 + y, 1.5, 1.5);
    }
  });
}

function cosmicWeb(): HTMLCanvasElement {
  return sprite((g, S) => {
    const r = rng(42);
    const points: [number, number][] = [];
    for (let i = 0; i < 90; i++) {
      const a = r() * 7;
      const d = Math.sqrt(r()) * S * 0.46;
      points.push([S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d]);
    }
    g.strokeStyle = 'rgba(190,170,255,.35)';
    g.lineWidth = 1;
    for (const p of points) {
      const nearest = points
        .map((q, j) => [(q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2, j] as const)
        .sort((a, b) => a[0] - b[0])
        .slice(1, 3);
      for (const [, j] of nearest) {
        g.beginPath();
        g.moveTo(p[0], p[1]);
        g.lineTo(points[j][0], points[j][1]);
        g.stroke();
      }
    }
    g.globalCompositeOperation = 'lighter';
    for (const p of points) blob(g, p[0], p[1], 5 + r() * 6, 'rgba(255,225,190,A)', 0.8);
  }, 320);
}

export interface Sprites {
  nebulae: HTMLCanvasElement[];
  spirals: HTMLCanvasElement[];
  elliptical: HTMLCanvasElement;
  irregular: HTMLCanvasElement;
  web: HTMLCanvasElement;
}

export function createSprites(): Sprites {
  return {
    nebulae: NEBULA_PALETTES.map(nebula),
    spirals: [
      galaxy('S', 3, 'rgba(150,180,255,A)'),
      galaxy('S', 9, 'rgba(190,170,255,A)'),
      galaxy('S', 21, 'rgba(140,210,230,A)'),
    ],
    elliptical: galaxy('E', 5, 'rgba(255,214,160,A)'),
    irregular: galaxy('I', 8, 'rgba(160,190,255,A)'),
    web: cosmicWeb(),
  };
}
