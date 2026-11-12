# Fase 2 — Verifica dei dati (italiano)

**Obiettivo:** ogni oggetto ha un valore controllato su una fonte primaria, una descrizione di 2–3 frasi, almeno una fonte collegata e la data di verifica.

**Spec:** `claudedocs/2026-11-12-scale-of-the-universe-design.md` · **Formato e regole:** `research/README.md`

## Come funziona

1. La ricerca di un lotto produce un file `research/<lotto>.json`: per ogni oggetto dimensione, cosa misura (`basis`), esito, descrizione, fonti con la **frase o cifra della fonte che sostiene il valore** (`evidence`).
2. `node scripts/apply-research.mjs --check` rifiuta il lotto se manca una fonte, se una fonte è Wikipedia, se la descrizione non è di 2–3 frasi, se un valore cambia senza essere dichiarato "corretto".
3. `node scripts/check-links.mjs` controlla che ogni indirizzo risponda.
4. Controllo a campione mio: apro alcune fonti e verifico che dicano davvero ciò che `evidence` riporta.
5. `node scripts/apply-research.mjs` scrive i dati. Gli oggetti proposti per la rimozione non vengono toccati: li decide Federico.

## Lotti

| Lotto | Categoria | Oggetti | Stato |
|---|---|---|---|
| black-holes | Buchi neri | 6 | pilota |
| particles | Particelle | 16 | da fare |
| atoms | Atomi e nuclei | 13 | da fare |
| waves | Lunghezze d'onda | 13 | da fare |
| molecules | Molecole e nanoscala | 19 | da fare |
| units | Unità di misura | 27 | da fare |
| biology-1, biology-2 | Biologia | 52 | da fare |
| objects-1, objects-2 | Oggetti | 56 | da fare |
| places-1, places-2 | Luoghi e costruzioni | 40 | da fare |
| solar-1, solar-2 | Pianeti, lune, corpi minori | 52 | da fare |
| stars-1, stars-2 | Stelle | 48 | da fare |
| distances | Distanze ed estensioni | 31 | da fare |
| nebulae | Nebulose e ammassi | 34 | da fare |
| galaxies | Galassie | 23 | da fare |
| cosmic | Strutture cosmiche | 17 | da fare |

Totale: 447 oggetti. I lotti sopra i 30 oggetti si dividono in due.

## Dopo i lotti

- Scheda dell'oggetto: mostrare fonte (titolo, editore, link) e "verificato il …".
- "Metodo e fonti": elenco completo delle fonti, generato dai dati.
- `npm run validate -- --strict` deve passare per tutto tranne le immagini (fase 3).
- Tabella delle correzioni e lista di aggiunte proposte, da far approvare a Federico.

## Limiti dichiarati

- La ricerca è fatta da agenti che leggono pagine web: il controllo a campione riduce gli errori, non li azzera. Ogni valore resta ricontrollabile grazie a `evidence`.
- Alcuni siti rifiutano le richieste automatiche: i loro link vanno verificati a mano.
