import { formatCompare, formatSci, formatSize } from '../lib/format';
import type { Flag, SceneData } from '../lib/types';
import type { Music } from './audio';
import { FLAG_COLOUR, REGIME_LIMITS } from './constants';
import { paletteAt } from './palette';
import type { Placed } from './placed';
import type { Scene } from './scene';

/** Lower-cased, accent-free form used to match search queries. */
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Wires the DOM controls (card, search, filters, read-out, dialog, music) to the scene. */
export function bindUi(root: HTMLElement, scene: Scene, data: SceneData, music: Music): { closeResults(): void } {
  const { ui, locale } = data;
  const el = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const size = (metres: number) => formatSize(metres, locale, ui);

  /* ---- detail card ---- */
  const card = el('card');
  const note = el('cNote');
  const badges = el('cBadges');
  const prev = el<HTMLButtonElement>('prev');
  const next = el<HTMLButtonElement>('next');

  function showCard(o: Placed | null): void {
    // Keep the address shareable: #id while a card is open, nothing otherwise.
    history.replaceState(null, '', o ? `#${o.id}` : location.pathname + location.search);
    if (!o) {
      card.classList.remove('open');
      return;
    }
    el('cKind').textContent = ui[`kind.${o.kind}`];
    el('cName').textContent = o.name;
    el('cSize').textContent = size(o.size);
    el('cSci').textContent = formatSci(o.size, locale);
    note.textContent = o.desc;
    note.hidden = !o.desc;
    el('cCmp').textContent = formatCompare(o.size, locale, ui);
    badges.replaceChildren(
      ...o.flags.map((flag) => {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = ui[`flag.${flag}`];
        badge.style.color = FLAG_COLOUR[flag];
        return badge;
      }),
    );
    const before = scene.objects[o.index - 1];
    const after = scene.objects[o.index + 1];
    prev.textContent = before ? `← ${before.name}` : '';
    prev.disabled = !before;
    next.textContent = after ? `${after.name} →` : '';
    next.disabled = !after;
    card.classList.add('open');
    card.scrollTop = 0;
    music.chime();
  }
  scene.onSelect(showCard);
  el('close').addEventListener('click', () => scene.select(null));
  const step = (delta: number) => {
    const current = scene.selected();
    const neighbour = current && scene.objects[current.index + delta];
    if (neighbour) scene.select(neighbour, true);
  };
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));

  /* ---- search ---- */
  const query = el<HTMLInputElement>('q');
  const results = el('results');
  const closeResults = () => results.classList.remove('open');

  query.addEventListener('input', () => {
    const needle = normalize(query.value.trim());
    results.replaceChildren();
    if (!needle) {
      closeResults();
      return;
    }
    const found = scene.objects.filter((o) => normalize(o.name).includes(needle)).slice(0, 10);
    for (const o of found) {
      const button = document.createElement('button');
      const name = document.createElement('span');
      const dimension = document.createElement('span');
      name.textContent = o.name;
      dimension.textContent = size(o.size);
      button.append(name, dimension);
      button.addEventListener('click', () => {
        scene.select(o, true);
        closeResults();
        query.value = '';
      });
      results.append(button);
    }
    if (!found.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = ui['search.empty'];
      results.append(empty);
    }
    results.classList.add('open');
  });
  query.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') results.querySelector('button')?.click();
  });

  /* ---- flag filters ---- */
  const chips = [...root.querySelectorAll<HTMLButtonElement>('.chip[data-flag]')];
  let active: Flag | '' = '';
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const flag = chip.dataset.flag as Flag;
      active = active === flag ? '' : flag;
      scene.setHighlight(active);
      for (const other of chips) other.setAttribute('aria-pressed', String(other === chip && active !== ''));
    });
  }

  /* ---- scale read-out ---- */
  const pretty = el('pretty');
  const regime = el('regime');
  const slider = el<HTMLInputElement>('zoom');
  let lastKey = '';
  scene.onFrame((z) => {
    music.follow(z);
    const key = z.toFixed(2);
    if (key === lastKey) return;
    lastKey = key;
    pretty.textContent = size(Math.pow(10, z));
    regime.textContent = ui[`regime.${REGIME_LIMITS.findIndex((limit) => z < limit)}`];
    root.style.setProperty('--accent', `rgb(${paletteAt(z).accent.join(',')})`);
    if (document.activeElement !== slider) slider.value = String(scene.target());
  });

  /* ---- method dialog ---- */
  const dialog = el<HTMLDialogElement>('dlg');
  el('about').addEventListener('click', () => dialog.showModal());
  el('dlgClose').addEventListener('click', () => dialog.close());

  /* ---- music ---- */
  const musicButton = el('music');
  const volume = el<HTMLInputElement>('vol');
  musicButton.addEventListener('click', () => {
    const state = music.toggle(Number(volume.value));
    musicButton.textContent = ui[`music.${state}`];
    musicButton.classList.toggle('on', state === 'on');
    musicButton.setAttribute('aria-pressed', String(state === 'on'));
  });
  volume.addEventListener('input', () => music.setVolume(Number(volume.value)));

  return { closeResults };
}
