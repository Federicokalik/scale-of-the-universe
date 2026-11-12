# Scale of the Universe 2026 — Fase 1 (Fondamenta) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare la bozza a file unico in un progetto Astro + UnoCSS con dati in JSON, landing fissa e pagina `/it/` identica alla bozza, pronto per le fasi successive.

**Architecture:** Sito Astro statico senza framework UI. I dati escono dalla bozza con uno script di estrazione e vivono in `src/data`; il motore della tela è diviso in moduli TypeScript e montato da uno script di pagina; Astro genera la landing e una pagina per lingua da una rotta dinamica `[lang]`.

**Tech Stack:** Astro 7.4.x, UnoCSS 66.x (`@unocss/astro`), TypeScript 7, Vitest 5, Playwright 1.65, Node ≥ 22.23.4 (installato: 26.3.0).

**Spec:** `claudedocs/2026-11-12-scale-of-the-universe-design.md`

Questo piano copre solo la fase 1 della spec. Le fasi 2–6 (verifica dati, immagini,
traduzioni, rifinitura, pubblicazione) avranno ciascuna il proprio piano, scritto
quando la precedente è chiusa, perché dipendono dai suoi risultati.

## Global Constraints

- Node ≥ 22.23.4; Astro 7.4.x; UnoCSS 66.x. Astro 7 è più recente delle mie conoscenze: prima di usare un'API di Astro, leggerne la documentazione installata o via Context7.
- Output statico; nessun framework UI (niente React/Vue/Svelte).
- `/it/` non deve mostrare differenze visibili rispetto a `reference/draft.html`: stessi controlli, stessi testi, stessa musica, stesso vetro.
- Landing e dialogo "Metodo e fonti" contengono sempre il link `https://scaleofuniverse.com/` e il credito a Cary e Michael Huang.
- Landing e dialogo dichiarano: il lavoro è un esperimento per provare Claude Fable 5.2.
- Nessuna grafica, testo, musica o codice dell'opera originale.
- Lavoro sul ramo `feat/foundations`; commit piccoli; **nessun `git push`, nessuna creazione di repo remoto** in questo piano.
- `site` in `astro.config.mjs` è `https://scale-of-universe.calicchia.design`, sovrascrivibile con `SITE_URL`; `public/CNAME` contiene `scale-of-universe.calicchia.design`.
- Autore in `package.json`, README e piè di pagina: Federico Calicchia, con link a `https://calicchia.design`. Nel repo pubblico vanno solo nome, sito ed eventualmente `mail@calicchia.design`: nessun dato fiscale, bancario o telefonico.
- Il titolo del sito è una chiave `ui.title` tradotta per lingua.
- File temporanei fuori dal repo; test in `tests/`, script in `scripts/`.

## Review Focus

1. Due nomi che producono lo stesso `id` → l'estrazione deve fallire con l'elenco dei duplicati, non sovrascrivere in silenzio. (Task 2)
2. `/it/#id-inesistente` → la pagina si carica normalmente, nessuna scheda aperta, nessun errore in console. (Task 5)
3. Oggetto con descrizione vuota (oggi sono molti) → la scheda nasconde il paragrafo, non mostra uno spazio vuoto né `undefined`. (Task 5)
4. Lingua non abilitata (`/xx/`, o `/de/` prima della fase 4) → 404 di Astro, non una pagina bianca. (Task 5)
5. `localStorage` non disponibile sulla landing (finestra privata) → la landing funziona e i link alle lingue restano cliccabili. (Task 5)

---

## File Structure

| File | Responsabilità |
|---|---|
| `reference/draft.html` | Copia della bozza, sola lettura, riferimento per il porting |
| `scripts/extract-draft.mjs` | Legge `RAW` dalla bozza e scrive `objects.json` e `i18n/it.json` |
| `scripts/validate-data.mjs` | Controlli sui dati (schema, id unici, chiavi per lingua) |
| `src/data/objects.json` | Dati indipendenti dalla lingua |
| `src/data/i18n/it.json` | Nomi, descrizioni e stringhe d'interfaccia in italiano |
| `src/data/i18n/en.json` | Solo stringhe della landing (le descrizioni arrivano in fase 4) |
| `src/data/locales.ts` | Elenco delle undici lingue e quali sono abilitate |
| `src/lib/types.ts` | Tipi condivisi |
| `src/lib/slug.ts` | `slugify` |
| `src/lib/format.ts` | Formattazione di dimensioni e confronti |
| `src/lib/data.ts` | Unisce `objects.json` e file di lingua |
| `src/engine/sprites.ts` | Sprite procedurali (nebulose, galassie, rete cosmica) |
| `src/engine/draw.ts` | Disegno di un oggetto e dello sfondo |
| `src/engine/scene.ts` | Stato, ciclo di frame, hit-test |
| `src/engine/input.ts` | Rotella, puntatori, tastiera, slider |
| `src/engine/ui.ts` | Scheda, ricerca, filtri, dialogo, HUD |
| `src/engine/audio.ts` | Musica generativa |
| `src/engine/glass.ts` | Rifrazione del vetro (solo Chromium) |
| `src/engine/main.ts` | `mountScene` |
| `src/styles/glass.css` | Materiale "vetro" e layout dei controlli, dalla bozza |
| `src/layouts/Base.astro` | `<head>`, metadati, `lang`/`dir` |
| `src/pages/index.astro` | Landing |
| `src/pages/[lang]/index.astro` | Esperienza per lingua |
| `.github/workflows/deploy.yml` | Build e deploy su Pages (inattivo finché non c'è il remoto) |

## Tipi condivisi (`src/lib/types.ts`)

```ts
export type Kind = 'u'|'d'|'w'|'q'|'a'|'m'|'b'|'o'|'g'|'p'|'s'|'h'|'n'|'x'|'c';
export type Flag = 'r'|'n'|'i'|'u';
export interface Source { title: string; url: string }
export interface ObjectRecord {
  id: string; size: number; kind: Kind;
  glyph: string;            // quarto campo della bozza: colore #hex, emoji, o codice sprite (0-4, E, I)
  flags: Flag[];
  image: string | null;     // fase 3
  sources: Source[];        // fase 2
  verified: string | null;  // data ISO, fase 2
}
export interface LocaleFile {
  ui: Record<string, string>;
  objects: Record<string, { name: string; desc: string }>;
}
export interface SceneObject extends ObjectRecord { name: string; desc: string }
export interface SceneData { locale: string; ui: Record<string, string>; objects: SceneObject[] }
```

---

### Task 1: Progetto, ramo e strumenti

**Files:**
- Create: `package.json`, `astro.config.mjs`, `uno.config.ts`, `tsconfig.json`, `.gitignore`, `vitest.config.ts`, `playwright.config.ts`, `reference/draft.html`, `src/pages/index.astro` (segnaposto), `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: script npm `dev`, `build`, `preview`, `test` (vitest), `test:e2e` (playwright contro `astro preview` su porta 4321), `extract`, `validate`.

- [ ] **Step 1:** `git init`, poi `git checkout -b feat/foundations`.
- [ ] **Step 2:** Copiare la bozza salvata in `reference/draft.html` (sorgente: l'artifact indicato nella spec, 937 righe). Verifica: `wc -l reference/draft.html` → 937.
- [ ] **Step 3:** Inizializzare `package.json` (`"type": "module"`, `"private": true`, `engines.node ">=22.23.4"`) e installare `astro@^7.4`, `unocss@^66`, `@unocss/astro@^66`, `@astrojs/sitemap`, e in dev `typescript`, `@astrojs/check`, `vitest`, `@playwright/test`.
- [ ] **Step 4:** `astro.config.mjs`: `site: process.env.SITE_URL ?? 'http://localhost:4321'`, `output: 'static'`, integrazioni UnoCSS e sitemap. `uno.config.ts`: preset di default più i token colore della bozza (`ink #070a16`, `accent #ffd08a`, `teal #8ff0e2`, `violet #c9b8ff`, `grey #b4b9c9`).
- [ ] **Step 5:** Scrivere `tests/unit/smoke.test.ts` con `expect(1 + 1).toBe(2)`; eseguire `npm test` → 1 passed.
- [ ] **Step 6:** `npm run build` → termina senza errori e crea `dist/index.html`.
- [ ] **Step 7:** Commit: `chore: scaffold Astro 7 + UnoCSS project with draft reference`.

### Task 2: Estrazione e validazione dei dati

**Files:**
- Create: `src/lib/types.ts`, `src/lib/slug.ts`, `scripts/extract-draft.mjs`, `scripts/validate-data.mjs`, `src/data/objects.json`, `src/data/i18n/it.json`
- Test: `tests/unit/slug.test.ts`, `tests/unit/data.test.ts`

**Interfaces:**
- Produces: `slugify(name: string): string`; `objects.json` come `ObjectRecord[]` ordinato per `size` crescente; `it.json` come `LocaleFile` (per ora `ui: {}`); `node scripts/validate-data.mjs` esce con codice 0 se i dati sono coerenti, 1 con l'elenco dei problemi.

- [ ] **Step 1: Test di `slugify`**

```ts
expect(slugify('Terra')).toBe('terra');
expect(slugify('M87*')).toBe('m87');
expect(slugify('Sagittarius A*')).toBe('sagittarius-a');
expect(slugify('ʻOumuamua')).toBe('oumuamua');
expect(slugify('3I/ATLAS')).toBe('3i-atlas');
expect(slugify('Molecola di CO₂')).toBe('molecola-di-co2');
expect(slugify('Elettrone (limite superiore)')).toBe('elettrone-limite-superiore');
expect(slugify('Ångström')).toBe('angstrom');
```

- [ ] **Step 2:** Eseguire `npm test` → fallisce (`slugify` non definita).
- [ ] **Step 3:** Implementare `slugify` in `src/lib/slug.ts`: normalizzazione NFKD, rimozione dei segni diacritici, minuscolo, ogni sequenza non alfanumerica diventa `-`, trattini rimossi agli estremi.
- [ ] **Step 4:** `npm test` → passa.
- [ ] **Step 5:** Implementare `scripts/extract-draft.mjs`: isola il template `RAW` in `reference/draft.html`, divide ogni riga su `|` in `nome|dimensione|tipo|glyph|flag|nota`, costruisce `ObjectRecord` (`image: null`, `sources: []`, `verified: null`) e la voce `{ name, desc }` in `it.json`. **Se due nomi danno lo stesso id, esce con codice 1 elencando i duplicati** (Review Focus 1); in quel caso si aggiunge una mappa esplicita `ID_OVERRIDES` nello script.
- [ ] **Step 6: Test dei dati** (`tests/unit/data.test.ts`)

```ts
const raw = draft.match(/const RAW=`([\s\S]*?)`;/)[1].trim().split('\n');
expect(objects.length).toBe(raw.length);
expect(new Set(objects.map(o => o.id)).size).toBe(objects.length);
expect(objects.map(o => o.size)).toEqual([...objects.map(o => o.size)].sort((a, b) => a - b));
expect(Object.keys(it.objects).sort()).toEqual(objects.map(o => o.id).sort());
const terra = objects.find(o => o.id === 'terra');
expect(terra).toMatchObject({ size: 1.2742e7, kind: 'p', glyph: '#3b82c4', flags: [] });
expect(objects.find(o => o.id === 'woh-g64').flags).toEqual(['r', 'u']);
expect(it.objects['lunghezza-di-planck'].desc).toContain('CODATA 2022');
```

- [ ] **Step 7:** `npm run extract && npm test` → passa.
- [ ] **Step 8:** Implementare `scripts/validate-data.mjs`: id unici e in formato slug, `size > 0`, `kind` e `flags` nei valori ammessi, ogni lingua abilitata ha una voce per ogni id e nessuna in più. Con `--strict` (usato dalla fase 2 in poi) richiede anche `sources.length ≥ 1`, `verified` e `image`. Verifica: `npm run validate` → codice 0; `npm run validate -- --strict` → codice 1.
- [ ] **Step 9:** Commit: `feat: extract draft objects into JSON data with validation`.

### Task 3: Formattazione delle dimensioni

**Files:**
- Create: `src/lib/format.ts`
- Test: `tests/unit/format.test.ts`

**Interfaces:**
- Produces:
  - `formatSize(meters: number, locale: string, ui: Record<string,string>): string`
  - `formatSci(meters: number, locale: string): string`
  - `formatCompare(meters: number, locale: string, ui: Record<string,string>): string`
  - Le parole ("anni luce", "milioni di km", "volte", nomi delle ancore) vengono da `ui` con chiavi `unit.*`, `compare.*`, `anchor.*`; i simboli SI (`m`, `km`, `µm`…) restano nel codice.

- [ ] **Step 1: Test** (valori ricavati dalla bozza, lingua `it`, `ui` dall'italiano)

```ts
expect(formatSize(1.7, 'it', ui)).toBe('1,7 m');
expect(formatSize(8849, 'it', ui)).toBe('8,85 km');
expect(formatSize(1.2742e7, 'it', ui)).toBe('12.742 km');
expect(formatSize(1.496e11, 'it', ui)).toBe('1 UA');
expect(formatSize(9.461e15, 'it', ui)).toBe('1 anno luce');
expect(formatSize(8.8e26, 'it', ui)).toBe('93 miliardi di anni luce');
expect(formatSize(7.5e-6, 'it', ui)).toBe('7,5 µm');
expect(formatSize(1.616e-35, 'it', ui)).toBe('1,62 × 10⁻³⁵ m');
expect(formatSci(1e-24, 'it')).toBe('10⁻²⁴ m');
expect(formatSci(1.2742e7, 'it')).toBe('1,27 × 10⁷ m');
expect(formatCompare(1.2742e7, 'it', ui)).toMatch(/^Circa .+ volte l'Everest\.$/);
expect(formatSize(1.7, 'en', { ...ui })).toBe('1.7 m');
```

- [ ] **Step 2:** `npm test` → fallisce.
- [ ] **Step 3:** Portare `nf`, `sci`, `fmt`, `ratio`, `compare` e le tabelle `ANCH` dalla bozza (righe 673–696), sostituendo `'it-IT'` con il parametro `locale` e le parole fisse con le chiavi `ui`. Aggiungere a `it.json` le chiavi usate.
- [ ] **Step 4:** `npm test` → passa.
- [ ] **Step 5:** Commit: `feat: locale-aware size formatting ported from draft`.

### Task 4: Motore della tela in moduli

**Files:**
- Create: `src/lib/data.ts`, `src/engine/{sprites,draw,scene,input,ui,audio,glass,main}.ts`
- Test: `tests/unit/data-merge.test.ts` (il comportamento visibile si prova nel Task 5)

**Interfaces:**
- Consumes: tipi del Task 2, `formatSize`/`formatSci`/`formatCompare` del Task 3.
- Produces:
  - `loadSceneData(locale: string): Promise<SceneData>` in `src/lib/data.ts` (usata in build da Astro).
  - `mountScene(root: HTMLElement, data: SceneData): void` in `src/engine/main.ts`. `root` contiene gli elementi con gli stessi `id` della bozza (`stage`, `card`, `q`, `results`, `zoom`, `pow`, `pretty`, `regime`, `chips`, `music`, `vol`, `about`, `dlg`…).
  - `selectById(id: string): boolean` in `scene.ts`: apre la scheda e porta la scala sull'oggetto; `false` se l'id non esiste.

- [ ] **Step 1: Test di `loadSceneData`**

```ts
const d = await loadSceneData('it');
expect(d.objects.length).toBe(objects.length);
expect(d.objects.find(o => o.id === 'terra').name).toBe('Terra');
await expect(loadSceneData('xx')).rejects.toThrow();
```

- [ ] **Step 2:** `npm test` → fallisce; implementare `loadSceneData`; `npm test` → passa.
- [ ] **Step 3:** Portare il codice della bozza nei moduli, senza cambiarne il comportamento: sprite (righe 698–719) → `sprites.ts`; `drawObj`, sfondo e polvere (721–764) → `draw.ts`; `frame`, `hud`, `setZ`, hit-test (766–811) → `scene.ts`; input (830–844) → `input.ts`; scheda, ricerca, filtri, dialogo (813–862) → `ui.ts`; musica (864–889) → `audio.ts`; vetro (891–932) → `glass.ts`. Lo stato condiviso (`z`, `zT`, `sel`, `hl`, `hits`) vive in `scene.ts` ed è esportato tramite funzioni, non variabili globali. I testi fissi in italiano passano a `data.ui`.
- [ ] **Step 4:** In `ui.ts`, se `desc` è vuota il paragrafo della scheda è nascosto (già così nella bozza: mantenerlo).
- [ ] **Step 5:** `npx astro check` → 0 errori.
- [ ] **Step 6:** Commit: `refactor: split draft canvas engine into typed modules`.

### Task 5: Pagine — esperienza per lingua e landing

**Files:**
- Create: `src/data/locales.ts`, `src/data/i18n/en.json`, `src/styles/glass.css`, `src/layouts/Base.astro`, `src/pages/[lang]/index.astro`
- Modify: `src/pages/index.astro`, `src/data/i18n/it.json` (chiavi `ui`)
- Test: `tests/e2e/experience.spec.ts`, `tests/e2e/landing.spec.ts`

**Interfaces:**
- Consumes: `loadSceneData`, `mountScene`, `selectById`.
- Produces: `LOCALES: { code: string; name: string; dir: 'ltr'|'rtl'; enabled: boolean }[]` con le undici lingue (`it, en, de, nl-BE, pt-BR, es, fr, ru, zh-Hans, ar, ja`); in questa fase `enabled` è vero solo per `it`. Rotte: `/` (landing), `/it/`.

- [ ] **Step 1: Test dell'esperienza** (`tests/e2e/experience.spec.ts`)

```ts
test('conteggio e ricerca', async ({ page }) => {
  await page.goto('/it/');
  await expect(page.locator('#count')).toContainText(/\d+ oggetti da 10⁻³⁵ a 10²⁷ metri/);
  await page.fill('#q', 'terra');
  await page.locator('#results button', { hasText: /^Terra/ }).click();
  await expect(page.locator('#card')).toHaveClass(/open/);
  await expect(page.locator('#cName')).toHaveText('Terra');
  await expect(page.locator('#cSize')).toHaveText('12.742 km');
});
test('la rotella cambia la scala', async ({ page }) => {
  await page.goto('/it/');
  const before = await page.locator('#pretty').textContent();
  await page.mouse.move(400, 300); await page.mouse.wheel(0, 2000);
  await expect(page.locator('#pretty')).not.toHaveText(before);
});
test('link diretto', async ({ page }) => {
  await page.goto('/it/#sole');
  await expect(page.locator('#cName')).toHaveText('Sole');
});
test('id inesistente: nessuna scheda, nessun errore', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e));
  await page.goto('/it/#non-esiste');
  await expect(page.locator('#card')).not.toHaveClass(/open/);
  expect(errors).toEqual([]);
});
test('descrizione vuota: paragrafo nascosto', async ({ page }) => {
  await page.goto('/it/#formica');
  await expect(page.locator('#cNote')).toBeHidden();
});
test('filtro', async ({ page }) => {
  await page.goto('/it/');
  const chip = page.locator('.chip').first();
  await chip.click(); await expect(chip).toHaveAttribute('aria-pressed', 'true');
});
test('lingua non abilitata dà 404', async ({ page }) => {
  expect((await page.goto('/de/')).status()).toBe(404);
  expect((await page.goto('/xx/')).status()).toBe(404);
});
test('metodo e fonti: credito e dichiarazione', async ({ page }) => {
  await page.goto('/it/'); await page.click('#about');
  await expect(page.locator('#dlg a[href="https://scaleofuniverse.com/"]')).toBeVisible();
  await expect(page.locator('#dlg')).toContainText('Fable 5.2');
});
```

- [ ] **Step 2: Test della landing** (`tests/e2e/landing.spec.ts`)

```ts
test('credito, dichiarazione, ingresso', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="https://scaleofuniverse.com/"]')).toBeVisible();
  await expect(page.locator('body')).toContainText('Cary and Michael Huang');
  await expect(page.locator('body')).toContainText('Fable 5.2');
  await page.locator('a[hreflang="it"]').click();
  await expect(page).toHaveURL(/\/it\/$/);
});
test('senza localStorage', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const errors = []; page.on('pageerror', e => errors.push(e));
  await page.goto('/');
  await expect(page.locator('a[hreflang="it"]')).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 3:** `npm run build && npm run test:e2e` → fallisce.
- [ ] **Step 4:** `src/styles/glass.css`: il CSS della bozza (righe 8–137) senza modifiche ai valori. `Base.astro`: `<html lang dir>`, titolo, descrizione, `color-scheme: dark`.
- [ ] **Step 5:** `src/pages/[lang]/index.astro`: `getStaticPaths` restituisce solo le lingue con `enabled: true`; il markup è quello della bozza (righe 141–214) con i testi presi da `ui`; i dati della scena sono serializzati nella pagina e passati a `mountScene`; all'avvio, se `location.hash` non è vuoto, chiama `selectById` e ignora il risultato falso. Nel dialogo "Metodo e fonti" aggiungere il paragrafo sull'esperimento Fable 5.2.
- [ ] **Step 6:** `src/pages/index.astro` (landing, in inglese, stesso materiale vetro su sfondo `--ink`): titolo; due righe sul progetto; credito "An independent reinterpretation of Scale of the Universe by Cary and Michael Huang" con link; riga "Built as an experiment to try Claude Fable 5.2"; elenco delle lingue abilitate, ciascuna con il proprio nome e `hreflang`; l'ultima lingua scelta è evidenziata leggendo `localStorage` dentro `try/catch`. Nessun reindirizzamento.
- [ ] **Step 7:** `npm run build && npm run test:e2e` → passa.
- [ ] **Step 8: Confronto visivo.** Aprire nel browser `reference/draft.html` e `http://localhost:4321/it/` affiancati alle scale 10⁻¹⁵, 10⁰, 10⁷, 10²¹ m, a 1440 px e a 375 px di larghezza: stessi oggetti, stesse posizioni, stessi controlli. Attivare la musica in entrambe. Console senza errori. Annotare ogni differenza e correggerla.
- [ ] **Step 9:** Commit: `feat: landing page and Italian experience on Astro`.

### Task 6: Workflow di deploy e README minimo

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:**
- Produces: workflow "Deploy to GitHub Pages" su push a `main`: checkout, Node 22, `npm ci`, `npm run validate`, `npm test`, `npm run build` con `SITE_URL` da variabile di repository, upload di `dist`, deploy con le action ufficiali di Pages; `permissions: pages: write, id-token: write`; action fissate per SHA.

- [ ] **Step 1:** Scrivere il workflow. Verifica: il file passa `npx --yes yaml-lint .github/workflows/deploy.yml` (o equivalente) senza errori.
- [ ] **Step 2:** `README.md` in inglese, breve: cos'è, credito e link all'originale, dichiarazione Fable 5.2, come avviare in locale (`npm install`, `npm run dev`), stato "work in progress". Licenze e crediti completi arrivano in fase 5.
- [ ] **Step 3:** Verifica finale: `npm run validate && npm test && npm run build && npm run test:e2e` → tutto verde.
- [ ] **Step 4:** Commit: `ci: add GitHub Pages deploy workflow and README stub`.
- [ ] **Step 5:** Fermarsi. Il push e la creazione del repo remoto appartengono alla fase 6 e richiedono conferma esplicita.

---

## Scostamento dalla spec

La spec mette nella fase 1 un "deploy di prova su Pages", ma dice anche che il repo
pubblico si crea solo dopo conferma esplicita. In questo piano la prova è locale
(`astro build` + `astro preview`); il workflow è pronto ma non parte finché non
esiste il remoto.

## Decisioni mie in questo piano

- Gli `id` derivano dai nomi italiani (`terra`, `sole`). Diventano parte degli URL pubblici: se si preferiscono id in inglese, il momento per cambiarli è prima della fase 6.
- In fase 1 è abilitata solo `/it/`; le altre dieci lingue sono elencate in `locales.ts` ma danno 404 finché la fase 4 non le riempie.
- Titolo: "Scala dell'Universo 2026" in italiano, "Scale of the Universe 2026" sulla landing in inglese; le altre lingue ricevono il proprio in fase 4.
