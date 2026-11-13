# Fase 3 — Immagini

**Obiettivo:** ogni oggetto ha un'immagine con licenza chiara e credito: una fotografia libera dove esiste ed è quella giusta, altrimenti un'illustrazione originale.

**Spec:** `claudedocs/2026-11-12-scale-of-the-universe-design.md`

## Regole

- **Licenze ammesse:** pubblico dominio, CC0, CC BY, CC BY-SA. Escluse NC e ND (la validazione le rifiuta).
- **Oggetto giusto:** una foto si sceglie guardando la miniatura **e** leggendo titolo e descrizione del file. Una specie, una stella o una nebulosa diversa da quella della scheda non si usa, anche se somiglia.
- **Niente foto dubbie:** se non c'è una foto libera e sicura, l'oggetto riceve un'illustrazione originale.
- **Wikipedia è solo una pista:** serve a trovare il file su Wikimedia Commons, dove si legge la licenza. Il credito cita autore, licenza e pagina del file.
- **Illustrazioni senza parole:** solo simboli (λ, 1 km, e⁻), così non vanno tradotte.

## Come funziona

1. `images/plan.json`: per ogni oggetto, la pista per la foto (`wiki:` o `search:`). Chi non è in elenco riceve un'illustrazione.
2. `node scripts/find-images.mjs --from N --count 12`: cerca fino a quattro candidati con licenza ammessa, li salva in `images/candidates/<id>.json` e disegna un foglio di confronto in `images/sheets/` (non versionato).
3. Scelta a occhio e sui testi, registrata in `images/choices.json` (numero del candidato; 0 = nessuno).
4. `node scripts/fetch-images.mjs`: scarica le foto scelte, produce `public/img/<id>-256.webp` (tela) e `-800.webp` (scheda), scrive il credito in `src/data/credits.json` e `image` + `imageShape` in `objects.json`.
5. `node scripts/make-illustrations.mjs`: disegna un SVG per ogni oggetto senza foto (`public/img/<id>.svg`, forma `art`).
6. `node scripts/make-credits.mjs`: genera `CREDITS.md`.
7. `npm run validate -- --strict`: ogni oggetto ha immagine, forma, credito completo e file presenti.

Dietro un proxy gli script di rete vanno lanciati con `NODE_USE_ENV_PROXY=1`.

## Forme sulla tela

| Forma | Per | Resa |
|---|---|---|
| `disc` | pianeti e lune sferiche, il Sole | foto ritagliata a disco |
| `glow` | nebulose, galassie, corpi irregolari su fondo nero | foto additiva con bordo sfumato |
| `frame` | esseri viventi, oggetti, luoghi | foto in cornice arrotondata dentro il cerchio della dimensione reale |
| `art` | illustrazioni originali | solo nella scheda; sulla tela resta il disegno generato |

## Chi fa cosa

Il ragionamento (piano, scelta delle foto, disegno delle illustrazioni, controlli) resta alla sessione principale. I passaggi meccanici (lanciare la ricerca lotto per lotto, scaricare e convertire le foto scelte) vanno a sub-agenti Haiku.

## Stato

- [x] Catena di strumenti, validazione, tela, scheda, crediti nel pannello "Metodo e fonti"
- [x] 208 illustrazioni originali
- [ ] Ricerca dei candidati per i 239 oggetti con foto (in corso)
- [ ] Scelta, scaricamento e controllo delle foto
- [ ] `CREDITS.md` definitivo, validazione rigorosa pulita, controllo visivo su tela
