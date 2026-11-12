import type { Scene } from './scene';

interface Controls {
  canvas: HTMLCanvasElement;
  slider: HTMLInputElement;
  minus: HTMLElement;
  plus: HTMLElement;
  /** Called on Escape, after the selection is cleared. */
  onEscape(): void;
}

/** Wheel, pinch, vertical drag, tap-to-select, slider, step buttons and keyboard. */
export function bindInput(scene: Scene, { canvas, slider, minus, plus, onEscape }: Controls): void {
  const nudge = (delta: number) => scene.setZoom(scene.target() + delta);

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      nudge(e.deltaY * (e.ctrlKey ? 0.01 : 0.0016));
    },
    { passive: false },
  );

  const pointers = new Map<number, [number, number]>();
  let moved = 0;
  let pinch = 0;

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const previous = pointers.get(e.pointerId);
    if (!previous) return;
    if (pointers.size === 2) {
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch && distance) scene.setZoom(scene.target() - Math.log10(distance / pinch), true);
      pinch = distance;
      moved = 99;
      return;
    }
    const dy = e.clientY - previous[1];
    moved += Math.abs(dy) + Math.abs(e.clientX - previous[0]);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (moved > 6) nudge(dy * 0.006);
  });

  const release = (e: PointerEvent) => {
    const tap = pointers.has(e.pointerId) && pointers.size === 1 && moved <= 6 && e.type === 'pointerup';
    if (tap) scene.select(scene.pick(e.clientX, e.clientY));
    pointers.delete(e.pointerId);
    pinch = 0;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  slider.addEventListener('input', () => scene.setZoom(Number(slider.value)));
  minus.addEventListener('click', () => nudge(-0.5));
  plus.addEventListener('click', () => nudge(0.5));

  addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === '+') {
      nudge(0.25);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === '-') {
      nudge(-0.25);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      scene.select(null);
      onEscape();
    }
  });
}
