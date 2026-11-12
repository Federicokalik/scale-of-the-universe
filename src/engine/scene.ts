import { formatSize } from '../lib/format';
import type { Flag, SceneData } from '../lib/types';
import { FLAG_COLOUR, ZOOM_MAX, ZOOM_MIN, ZOOM_START } from './constants';
import { createRenderer } from './draw';
import { place, type Placed } from './placed';
import { createSprites } from './sprites';

const LABEL_FONT = '"Inter Variable",system-ui,sans-serif';
const NUMBER_FONT = '"JetBrains Mono Variable",ui-monospace,monospace';

export interface Scene {
  readonly objects: Placed[];
  /** Current scale, log10 metres (eased towards the target). */
  zoom(): number;
  target(): number;
  setZoom(value: number, immediate?: boolean): void;
  selected(): Placed | null;
  /** Opens (or with null, closes) an object; `fly` also moves the scale onto it. */
  select(object: Placed | null, fly?: boolean): void;
  /** Opens the object with this id and flies to it. False when the id is unknown. */
  selectById(id: string): boolean;
  /** Dims every object that lacks this flag; '' clears the filter. */
  setHighlight(flag: Flag | ''): void;
  /** Smallest object under a point, in CSS pixels. */
  pick(x: number, y: number): Placed | null;
  onSelect(listener: (object: Placed | null) => void): void;
  onFrame(listener: (zoom: number) => void): void;
  start(): void;
}

export function createScene(canvas: HTMLCanvasElement, data: SceneData): Scene {
  const ctx = canvas.getContext('2d')!;
  const objects = place(data.objects);
  const byId = new Map(objects.map((o) => [o.id, o]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = createRenderer(ctx, createSprites(), reduceMotion);
  const selectListeners: ((object: Placed | null) => void)[] = [];
  const frameListeners: ((zoom: number) => void)[] = [];

  let width = 0;
  let height = 0;
  let z = ZOOM_START;
  let zTarget = ZOOM_START;
  let selected: Placed | null = null;
  let highlight: Flag | '' = '';
  let hits: [Placed, number, number, number][] = [];

  function resize(): void {
    const dpr = Math.min(2, devicePixelRatio || 1);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(ms: number): void {
    const t = ms / 1000;
    z = reduceMotion ? zTarget : z + (zTarget - z) * 0.12;
    if (Math.abs(zTarget - z) < 1e-4) z = zTarget;

    const m = Math.min(width, height);
    const unit = m * 0.3;
    const cx = width / 2;
    const cy = height * 0.46;
    renderer.background(z, t, width, height, cx, cy);

    hits = [];
    const labels: [Placed, number, number, number, number][] = [];
    // Largest first, so smaller objects paint on top; stop once they are too small to see.
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      const px = Math.pow(10, o.log - z) * unit;
      if (px < 5) break;
      if (px > m * 2.3) continue;
      let alpha = Math.min(1, (px - 5) / 14) * Math.max(0, Math.min(1, (m * 2.3 - px) / (m * 1.2)));
      if (highlight && !o.flags.includes(highlight)) alpha *= 0.18;
      if (alpha <= 0.01) continue;
      const x = cx + Math.cos(o.angle) * o.distance * px;
      const y = cy + Math.sin(o.angle) * o.distance * px * 0.86;
      if (x < -px || x > width + px || y < -px || y > height + px) continue;
      ctx.globalAlpha = alpha;
      ctx.save();
      renderer.object(o, x, y, px, t);
      ctx.restore();
      if (o === selected) {
        ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 3);
        ctx.strokeStyle = '#ffb86b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, px / 2 + 7, 0, 7);
        ctx.stroke();
      }
      hits.push([o, x, y, Math.max(px / 2, 16)]);
      if (px > 40) labels.push([o, x, y, px, alpha]);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (const [o, x, y, px, alpha] of labels) {
      const fontSize = Math.max(13, Math.min(16, px * 0.075));
      const flat = 'udw'.includes(o.kind) && !o.emoji;
      let labelY = y + (flat ? Math.min(px * 0.16, 60) + fontSize + 8 : px / 2 + fontSize + 6);
      // Keep labels clear of the bottom control bar.
      if (labelY > height - 150 && y < height - 170) labelY = Math.min(labelY, height - 150);
      ctx.globalAlpha = alpha * Math.min(1, (px - 40) / 30);
      ctx.font = `600 ${fontSize}px ${LABEL_FONT}`;
      const textWidth = ctx.measureText(o.name).width;
      const flag = (['i', 'u', 'n', 'r'] as const).find((f) => o.flags.includes(f));
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(4,6,14,.92)';
      ctx.strokeText(o.name, x, labelY);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(o.name, x, labelY);
      if (flag) {
        ctx.fillStyle = FLAG_COLOUR[flag];
        ctx.beginPath();
        ctx.arc(x - textWidth / 2 - 8, labelY - fontSize * 0.33, 3.2, 0, 7);
        ctx.fill();
      }
      if (px > 95) {
        const size = formatSize(o.size, data.locale, data.ui);
        ctx.font = `500 ${fontSize - 1}px ${NUMBER_FONT}`;
        ctx.fillStyle = '#d5daea';
        ctx.strokeText(size, x, labelY + fontSize + 2);
        ctx.fillText(size, x, labelY + fontSize + 2);
      }
    }
    ctx.globalAlpha = 1;

    for (const listener of frameListeners) listener(z);
    requestAnimationFrame(frame);
  }

  const scene: Scene = {
    objects,
    zoom: () => z,
    target: () => zTarget,
    setZoom(value, immediate = false) {
      zTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));
      if (immediate) z = zTarget;
    },
    selected: () => selected,
    select(object, fly = false) {
      selected = object;
      if (object && fly) scene.setZoom(object.log + 0.05);
      for (const listener of selectListeners) listener(object);
    },
    selectById(id) {
      const object = byId.get(id);
      if (!object) return false;
      scene.select(object, true);
      return true;
    },
    setHighlight(flag) {
      highlight = flag;
    },
    pick(x, y) {
      let best: Placed | null = null;
      for (const [o, hx, hy, radius] of hits) {
        if (Math.hypot(x - hx, y - hy) <= radius && (!best || o.size < best.size)) best = o;
      }
      return best;
    },
    onSelect(listener) {
      selectListeners.push(listener);
    },
    onFrame(listener) {
      frameListeners.push(listener);
    },
    start() {
      addEventListener('resize', resize);
      resize();
      requestAnimationFrame(frame);
    },
  };
  return scene;
}
