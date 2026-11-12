/**
 * Liquid-glass refraction, after kube.io/blog/liquid-glass-css-svg:
 * convex squircle profile -> surface normal -> Snell's law (n = 1.5) -> displacement along a ray
 * (127 samples) -> one displacement map per element (R = x, G = y, 128 neutral)
 * -> feImage + feDisplacementMap -> a specular highlight at -60 degrees blended on top.
 * SVG filters work as backdrop-filter only in Chromium; elsewhere the CSS blur stays.
 */

const SAMPLES = 127;
const REFRACTIVE_INDEX = 1.5;
const GLASS_SELECTOR = '.glass,.brand,.btn,.chip,.step,.x,.search input,.nav button';
const SHEEN_SELECTOR = '.btn,.chip,.step,.brand,.bottom';

function svg(name: string, attributes: Record<string, string | number>): SVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

const surface = (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 0.25);

function profile(bezel: number, thickness: number): { samples: Float32Array; max: number } {
  const samples = new Float32Array(SAMPLES);
  let max = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const x = (i + 0.5) / SAMPLES;
    const a = Math.max(0, x - 0.001);
    const b = Math.min(1, x + 0.001);
    const slope = (((surface(b) - surface(a)) / (b - a)) * thickness) / bezel;
    const incidence = Math.atan(slope);
    const refraction = Math.asin(Math.sin(incidence) / REFRACTIVE_INDEX);
    samples[i] = surface(x) * thickness * Math.tan(incidence - refraction);
    if (samples[i] > max) max = samples[i];
  }
  for (let i = 0; i < SAMPLES; i++) samples[i] /= max || 1;
  return { samples, max };
}

function initRefraction(root: HTMLElement, defs: SVGSVGElement): void {
  const filterOf = new WeakMap<HTMLElement, string>();
  const timerOf = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  let version = 0;

  function build(el: HTMLElement): void {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w < 8 || h < 8 || w * h > 900000) return;

    const cssRadius = getComputedStyle(el).borderTopLeftRadius;
    let radius = cssRadius.endsWith('%') ? (Math.min(w, h) * parseFloat(cssRadius)) / 100 : parseFloat(cssRadius) || 0;
    radius = Math.min(radius, w / 2, h / 2);

    const panel = el.classList.contains('glass');
    const bezel = Math.max(6, Math.min(radius, panel ? 28 : 17));
    const { samples, max } = profile(bezel, panel ? 44 : 20);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d')!;
    const displacement = g.createImageData(w, h);
    const specular = g.createImageData(w, h);
    const D = displacement.data;
    const S = specular.data;
    const halfW = w / 2;
    const halfH = h / 2;
    const light = (-60 * Math.PI) / 180;
    const lightX = Math.cos(light);
    const lightY = Math.sin(light);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - halfW;
        const py = y + 0.5 - halfH;
        const signX = px < 0 ? -1 : 1;
        const signY = py < 0 ? -1 : 1;
        const cornerX = Math.abs(px) - (halfW - radius);
        const cornerY = Math.abs(py) - (halfH - radius);
        let edge: number;
        let nx: number;
        let ny: number;
        if (cornerX > 0 && cornerY > 0) {
          const length = Math.hypot(cornerX, cornerY) || 1;
          edge = radius - length;
          nx = (-cornerX / length) * signX;
          ny = (-cornerY / length) * signY;
        } else {
          const toSide = halfW - Math.abs(px);
          const toTop = halfH - Math.abs(py);
          if (toSide < toTop) {
            edge = toSide;
            nx = -signX;
            ny = 0;
          } else {
            edge = toTop;
            nx = 0;
            ny = -signY;
          }
        }
        const k = (y * w + x) * 4;
        const inBezel = edge >= 0 && edge < bezel;
        const amount = inBezel ? samples[Math.min(SAMPLES - 1, Math.floor((edge / bezel) * SAMPLES))] : 0;
        D[k] = 128 + 127 * nx * amount;
        D[k + 1] = 128 + 127 * ny * amount;
        D[k + 2] = 128;
        D[k + 3] = 255;
        if (inBezel) {
          S[k] = S[k + 1] = S[k + 2] = 255;
          S[k + 3] = 255 * 0.8 * Math.pow(Math.abs(nx * lightX + ny * lightY), 2.2) * Math.exp(-edge / 1.7);
        }
      }
    }

    g.putImageData(displacement, 0, 0);
    const mapUrl = canvas.toDataURL();
    g.clearRect(0, 0, w, h);
    g.putImageData(specular, 0, 0);
    const specularUrl = canvas.toDataURL();

    const id = `lg${++version}`;
    const previous = filterOf.get(el);
    if (previous) defs.querySelector(`#${previous}`)?.remove();
    const box = { x: 0, y: 0, width: w, height: h };
    const filter = svg('filter', { id, x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' });
    filter.append(
      svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: panel ? 3 : 1.1, result: 'b' }),
      svg('feImage', { href: mapUrl, ...box, result: 'm' }),
      svg('feDisplacementMap', {
        in: 'b', in2: 'm', scale: (2 * max).toFixed(1), xChannelSelector: 'R', yChannelSelector: 'G', result: 'r',
      }),
      svg('feColorMatrix', { in: 'r', type: 'saturate', values: 1.7, result: 's' }),
      svg('feImage', { href: specularUrl, ...box, result: 'sp' }),
      svg('feBlend', { in: 'sp', in2: 's', mode: 'screen' }),
    );
    defs.append(filter);
    filterOf.set(el, id);
    el.style.backdropFilter = `url(#${id}) brightness(1.1)`;
  }

  // Elements resize on load, on rotation and when their text changes: rebuild, debounced.
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      clearTimeout(timerOf.get(el));
      timerOf.set(el, setTimeout(() => build(el), 140));
    }
  });
  root.querySelectorAll<HTMLElement>(GLASS_SELECTOR).forEach((el) => observer.observe(el));
}

export function initGlass(root: HTMLElement, defs: SVGSVGElement): void {
  const chromium = /Chrome\//.test(navigator.userAgent);
  const opaque = matchMedia('(prefers-reduced-transparency: reduce)').matches;
  if (chromium && !opaque) initRefraction(root, defs);

  // The highlight on each control follows the pointer.
  addEventListener(
    'pointermove',
    (e) => {
      const target = e.target as Element | null;
      const el = target?.closest?.<HTMLElement>(SHEEN_SELECTOR);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    },
    { passive: true },
  );
}
