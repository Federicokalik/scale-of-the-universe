/**
 * The backdrop behind the objects: three slow-moving colour fields that follow
 * the scale (see palette.ts), rings that mark the powers of ten, and the current
 * power of ten as a giant numeral.
 */
import { paletteAt, type Rgb } from './palette';

type Ctx = CanvasRenderingContext2D;

const BASE = '#07080c';
const NUMERAL_FONT = '"Fraunces Variable",Georgia,serif';

/** Where each colour field sits (fractions of the viewport) and how strong it is. */
const FIELDS = [
  { x: 0.12, y: 0.1, alpha: 0.55, drift: 0.9 },
  { x: 0.92, y: 0.22, alpha: 0.5, drift: 1.3 },
  { x: 0.6, y: 1.05, alpha: 0.5, drift: 0.7 },
];

export interface Backdrop {
  /** `t` is the animation clock in seconds; pass a constant to hold the fields still. */
  draw(z: number, t: number, width: number, height: number, cx: number, cy: number): void;
}

export function createBackdrop(ctx: Ctx): Backdrop {
  const rgba = (c: Rgb, alpha: number) => `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;

  function fields(z: number, t: number, w: number, h: number): void {
    const palette = paletteAt(z);
    const reach = Math.max(w, h) * 0.75;
    FIELDS.forEach((field, i) => {
      const x = (field.x + Math.sin(t * 0.05 * field.drift + i * 2.1) * 0.05) * w;
      const y = (field.y + Math.cos(t * 0.04 * field.drift + i * 1.3) * 0.05) * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, reach);
      g.addColorStop(0, rgba(palette.fields[i], field.alpha));
      g.addColorStop(0.7, rgba(palette.fields[i], 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }

  /** One ring per power of ten: they grow and wrap around as the scale changes. */
  function rings(z: number, w: number, h: number, cx: number, cy: number): void {
    const unit = Math.min(w, h) * 0.3;
    const fraction = z - Math.floor(z);
    const reach = Math.hypot(w, h);
    ctx.lineWidth = 1;
    for (let k = -1; k <= 3; k++) {
      const radius = (unit / 2) * Math.pow(10, k + 1 - fraction);
      if (radius < 12 || radius > reach) continue;
      // Rings fade in from the centre and out towards the edge.
      const presence = Math.min(1, (radius - 12) / 60) * Math.min(1, (reach - radius) / (reach * 0.4));
      ctx.strokeStyle = `rgba(243,239,230,${0.09 * presence})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 7);
      ctx.stroke();
    }
  }

  /** The current power of ten, very large and very faint, bottom left. */
  function numeral(z: number, w: number, h: number): void {
    const size = Math.min(w * 0.3, h * 0.62);
    const exponent = String(Math.round(z)).replace('-', '−');
    ctx.fillStyle = 'rgba(243,239,230,.09)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 ${size}px ${NUMERAL_FONT}`;
    const x = w * 0.02;
    const y = h + size * 0.06;
    ctx.fillText('10', x, y);
    const base = ctx.measureText('10').width;
    ctx.font = `600 ${size * 0.5}px ${NUMERAL_FONT}`;
    ctx.fillText(exponent, x + base + size * 0.02, y - size * 0.42);
  }

  return {
    draw(z, t, width, height, cx, cy) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = BASE;
      ctx.fillRect(0, 0, width, height);
      fields(z, t, width, height);
      rings(z, width, height, cx, cy);
      numeral(z, width, height);
      ctx.restore();
    },
  };
}
