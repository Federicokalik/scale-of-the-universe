import { fill, formatCompare, formatSci, formatSize } from '../lib/format';
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

  const sources = el('cSources');
  const longDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' });

  /** Where the value comes from and when it was last checked. Hidden until an object has been verified. */
  function showSources(o: Placed): void {
    sources.replaceChildren();
    sources.hidden = !o.sources.length;
    if (!o.sources.length) return;
    const heading = document.createElement('div');
    heading.className = 'sources-title';
    heading.textContent = ui['card.sources'];
    const list = document.createElement('ul');
    for (const source of o.sources) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.title;
      link.setAttribute('aria-label', `${source.title} (${ui['card.newtab']})`);
      item.append(link);
      if (source.publisher) item.append(` · ${source.publisher}`);
      list.append(item);
    }
    sources.append(heading, list);
    if (o.verified) {
      const checked = document.createElement('div');
      checked.className = 'sources-date';
      checked.textContent = fill(ui['card.verified'], { date: longDate.format(new Date(o.verified)) });
      sources.append(checked);
    }
  }

  const figure = el('cFigure');
  const picture = el<HTMLImageElement>('cImg');
  const creditLine = el('cCredit');

  /** The photograph with who made it and its licence. Hidden for objects that have none. */
  function showPhoto(o: Placed): void {
    figure.hidden = !(o.image && o.credit);
    creditLine.replaceChildren();
    if (!o.image || !o.credit) {
      picture.removeAttribute('src');
      return;
    }
    const art = o.imageShape === 'art';
    picture.src = `${import.meta.env.BASE_URL}img/${o.image}${art ? '.svg' : '-800.webp'}`;
    picture.alt = o.name;
    const link = (text: string, href: string) => {
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = text;
      a.setAttribute('aria-label', `${text} (${ui['card.newtab']})`);
      return a;
    };
    if (art) creditLine.append(`${ui['card.illustration']} · `);
    else creditLine.append(`${ui['card.image']}: `, link(o.credit.author, o.credit.page), ' · ');
    creditLine.append(o.credit.licenceUrl ? link(o.credit.licence, o.credit.licenceUrl) : o.credit.licence);
  }

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
    showPhoto(o);
    showSources(o);
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
