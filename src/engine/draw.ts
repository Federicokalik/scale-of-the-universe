import { createBackdrop } from './backdrop';
import type { Placed } from './placed';
import { rng, type Sprites } from './sprites';

type Ctx = CanvasRenderingContext2D;

/** Line colours for units, distances and wavelengths without a colour of their own. */
const LINE_COLOUR: Record<string, string> = { u: '#eef0f7', d: '#7fe0d4', w: '#ffb86b' };

const DUST = Array.from({ length: 150 }, (_, i) => {
  const r = rng(i + 99);
  return { angle: r() * 7, phase: r(), size: 0.6 + r() * 1.6, twinkle: r() * 7 };
});

export interface Renderer {
  background(z: number, t: number, w: number, h: number, cx: number, cy: number): void;
  object(o: Placed, x: number, y: number, px: number, t: number): void;
}

/** Below this size on screen a photograph is not worth a download. */
const PHOTO_MIN_PX = 28;

/** `still` freezes the backdrop's own motion, for people who prefer reduced motion. */
export function createRenderer(ctx: Ctx, sprites: Sprites, still = false): Renderer {
  const backdrop = createBackdrop(ctx);
  const photos = new Map<string, HTMLImageElement | null>();

  /** The object's photograph once it has loaded; starts the download the first time it is asked for. */
  function photo(o: Placed): HTMLImageElement | null {
    // Stars and black holes without a photograph are drawn by the code below, which renders them well at any size;
    // every other illustrated object shows its own drawing.
    if (!o.image || (o.imageShape === 'art' && 'sh'.includes(o.kind))) return null;
    const known = photos.get(o.image);
    if (known !== undefined) return known && known.complete && known.naturalWidth ? known : null;
    const image = new Image();
    image.decoding = 'async';
    image.onerror = () => photos.set(o.image!, null);
    image.src = `${import.meta.env.BASE_URL}img/${o.image}-256.webp`;
    photos.set(o.image, image);
    return null;
  }

  /** Draws the photograph in the way its shape asks for. Returns false when there is none to draw yet. */
  function drawPhoto(o: Placed, x: number, y: number, px: number): boolean {
    if (px < PHOTO_MIN_PX) return false;
    const image = photo(o);
    if (!image) return false;
    const r = px / 2;
    if (o.imageShape === 'disc') {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.clip();
      ctx.drawImage(image, x - r, y - r, px, px);
      return true;
    }
    if (o.imageShape === 'glow') {
      // Additive, with the tile's own soft edge: the black around the subject vanishes.
      ctx.globalCompositeOperation = 'lighter';
      const side = px * 1.2;
      ctx.drawImage(image, x - side / 2, y - side / 2, side, side);
      return true;
    }
    // A rounded frame inside the dashed circle that marks the real size.
    ctx.strokeStyle = 'rgba(255,255,255,.13)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.stroke();
    ctx.setLineDash([]);
    if (o.imageShape === 'art' && 'pnxc'.includes(o.kind)) {
      // Sky drawings have no background of their own, so only the object itself is painted.
      // A world fills half the plate's width; a cloud, galaxy or structure nearly all of it.
      const w = px * (o.kind === 'p' ? 2 : 1.25);
      ctx.drawImage(image, x - w / 2, y - (w * 0.75) / 2, w, w * 0.75);
      return true;
    }
    if (o.imageShape === 'art') {
      // The drawing is a 4:3 plate whose diagonal is the object's size.
      const w = px * 0.8;
      const h = px * 0.6;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, px * 0.03);
      ctx.clip();
      ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
      return true;
    }
    const side = px * 0.7;
    ctx.beginPath();
    ctx.roundRect(x - side / 2, y - side / 2, side, side, side * 0.16);
    ctx.clip();
    ctx.drawImage(image, x - side / 2, y - side / 2, side, side);
    return true;
  }

  function glow(x: number, y: number, r: number, inner: string, outer: string): void {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }

  function stamp(image: HTMLCanvasElement, o: Placed, x: number, y: number, r: number, tilt: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.angle);
    ctx.scale(1, tilt);
    ctx.drawImage(image, -r * 1.12, -r * 1.12, r * 2.24, r * 2.24);
    ctx.restore();
  }

  function background(z: number, t: number, w: number, h: number, cx: number, cy: number): void {
    backdrop.draw(z, still ? 0 : t, w, h, cx, cy);

    // Dust drifts outward as the scale changes, which gives zooming a sense of motion.
    const far = Math.max(w, h) * 0.7;
    for (const d of DUST) {
      const u = (((d.phase - z * 0.35) % 1) + 1) % 1;
      const radius = far * Math.pow(u, 1.7);
      const alpha = Math.sin(u * Math.PI) * (0.35 + 0.25 * Math.sin(t * 0.7 + d.twinkle));
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx + Math.cos(d.angle) * radius, cy + Math.sin(d.angle) * radius, d.size * (0.5 + u), d.size * (0.5 + u));
    }
  }

  function object(o: Placed, x: number, y: number, px: number, t: number): void {
    const r = px / 2;
    const k = o.kind;
    const colour = o.glyph[0] === '#' ? o.glyph : null;

    if (drawPhoto(o, x, y, px)) return;

    if (o.emoji && o.image) {
      // Too small for its picture yet (or the picture is still loading): a plain mark, not an emoji.
      ctx.fillStyle = 'rgba(223,227,234,.5)';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, r * 0.45), 0, 7);
      ctx.fill();
      return;
    }

    if (o.emoji) {
      ctx.strokeStyle = 'rgba(255,255,255,.13)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `${Math.min(px * 0.74, 1400)}px system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(o.emoji, x, y + px * 0.04);
      return;
    }

    if (k === 'u' || k === 'd' || k === 'w') {
      const c = colour || LINE_COLOUR[k];
      ctx.strokeStyle = c;
      ctx.fillStyle = c;
      ctx.lineWidth = k === 'u' ? 2 : 1.5;
      if (k === 'w') {
        ctx.beginPath();
        const n = Math.max(24, Math.min(160, px / 3));
        for (let i = 0; i <= n; i++) {
          const u = i / n;
          const xx = x - r + u * px;
          const yy = y - Math.sin(u * Math.PI * 2) * Math.min(px * 0.16, 60);
          if (i) ctx.lineTo(xx, yy);
          else ctx.moveTo(xx, yy);
        }
        ctx.stroke();
        ctx.globalAlpha *= 0.4;
        ctx.beginPath();
        ctx.moveTo(x - r, y - 10);
        ctx.lineTo(x - r, y + 10);
        ctx.moveTo(x + r, y - 10);
        ctx.lineTo(x + r, y + 10);
        ctx.stroke();
        return;
      }
      if (k === 'd') ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x + r, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (k === 'u') {
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          const xx = x - r + (px * i) / 10;
          const tick = i % 5 ? 4 : 9;
          ctx.moveTo(xx, y - tick);
          ctx.lineTo(xx, y + tick);
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x - r, y, 3.5, 0, 7);
        ctx.arc(x + r, y, 3.5, 0, 7);
        ctx.fill();
      }
      return;
    }

    if (k === 's') {
      const c = colour || '#ffe9a8';
      glow(x, y, r * 1.6, `${c}50`, `${c}00`);
      const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.55, c);
      g.addColorStop(1, `${c}cc`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
      return;
    }

    if (k === 'p') {
      const c = colour || '#9aa3bd';
      if (o.id === 'saturno') {
        ctx.strokeStyle = 'rgba(227,207,156,.55)';
        ctx.lineWidth = Math.max(1, r * 0.16);
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.9, r * 0.5, -0.35, 0, 7);
        ctx.stroke();
      }
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
      const g = ctx.createRadialGradient(x - r * 0.45, y - r * 0.45, r * 0.1, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,.38)');
      g.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(0,0,10,.62)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
      return;
    }

    if (k === 'h') {
      glow(x, y, r * 2.3, 'rgba(255,170,90,.42)', 'rgba(255,120,60,0)');
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,205,140,.95)';
      ctx.lineWidth = Math.max(1.2, r * 0.07);
      ctx.beginPath();
      ctx.arc(x, y, r * 1.06, 0, 7);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,180,110,.5)';
      ctx.lineWidth = Math.max(1, r * 0.12);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 2, r * 0.42, -0.25, 0, 7);
      ctx.stroke();
      return;
    }

    if (k === 'x') {
      if (o.glyph === 'E') stamp(sprites.elliptical, o, x, y, r, 0.8);
      else if (o.glyph === 'I') stamp(sprites.irregular, o, x, y, r, 0.8);
      else stamp(sprites.spirals[o.index % 3], o, x, y, r, 0.55 + 0.4 * ((o.index * 0.37) % 1));
      return;
    }

    if (k === 'n') {
      stamp(sprites.nebulae[Number(o.glyph) || 0], o, x, y, r, 0.9);
      return;
    }

    if (k === 'c') {
      stamp(sprites.web, o, x, y, r, 1);
      if (o.id.startsWith('universo')) {
        const hypothetical = o.flags.includes('i');
        ctx.strokeStyle = hypothetical ? 'rgba(185,162,255,.5)' : 'rgba(255,184,107,.6)';
        ctx.lineWidth = 1.5;
        if (hypothetical) ctx.setLineDash([4, 7]);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      return;
    }

    if (k === 'q') {
      const c = o.flags.includes('i') ? '185,162,255' : '127,224,212';
      glow(x, y, r, `rgba(${c},.55)`, `rgba(${c},0)`);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, r * 0.07), 0, 7);
      ctx.fill();
      ctx.strokeStyle = `rgba(${c},.5)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.7, r * 0.28, t * 0.4 + o.angle, 0, 7);
      ctx.stroke();
      return;
    }

    if (k === 'a') {
      glow(x, y, r, 'rgba(255,184,107,.5)', 'rgba(255,184,107,0)');
      ctx.strokeStyle = 'rgba(255,184,107,.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.stroke();
      const random = rng(o.index + 1);
      const nucleons = r > 30 ? 7 : 3;
      for (let i = 0; i < nucleons; i++) {
        const a = random() * 7;
        const d = random() * r * 0.3;
        ctx.fillStyle = i % 2 ? '#ff8a7a' : '#9fc2ff';
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(1.5, r * 0.12), 0, 7);
        ctx.fill();
      }
      return;
    }

    if (k === 'm') {
      const atoms = [[-0.5, 0.15, 0.42], [0.12, -0.2, 0.5], [0.56, 0.25, 0.36]];
      ctx.strokeStyle = 'rgba(255,255,255,.4)';
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.beginPath();
      ctx.moveTo(x + atoms[0][0] * r, y + atoms[0][1] * r);
      ctx.lineTo(x + atoms[1][0] * r, y + atoms[1][1] * r);
      ctx.lineTo(x + atoms[2][0] * r, y + atoms[2][1] * r);
      ctx.stroke();
      atoms.forEach((p, i) => {
        const ax = x + p[0] * r;
        const ay = y + p[1] * r;
        const ar = p[2] * r * 0.75;
        const g = ctx.createRadialGradient(ax - ar * 0.3, ay - ar * 0.3, 0, ax, ay, ar);
        g.addColorStop(0, '#fff');
        g.addColorStop(1, ['#7fe0d4', '#ffb86b', '#b9a2ff'][(o.index + i) % 3]);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ax, ay, ar, 0, 7);
        ctx.fill();
      });
      return;
    }

    if (k === 'b') {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const wobble = r * (0.92 + 0.07 * Math.sin(a * 3 + o.angle) + 0.04 * Math.sin(a * 7 + t * 0.6));
        const xx = x + Math.cos(a) * wobble;
        const yy = y + Math.sin(a) * wobble;
        if (i) ctx.lineTo(xx, yy);
        else ctx.moveTo(xx, yy);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(127,224,212,.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(127,224,212,.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      glow(x + r * 0.15, y - r * 0.1, r * 0.38, 'rgba(185,162,255,.7)', 'rgba(185,162,255,.05)');
      return;
    }

    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fill();
  }

  return { background, object };
}
