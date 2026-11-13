# Scale of the Universe 2026 — documento di progetto

Data: 12 novembre 2026 · Stato: in attesa di approvazione

## Intento

Trasformare la bozza (artifact a file unico, "Scala dell'Universo 2026") in un sito
pubblico vero: repository GitHub più GitHub Pages, con immagini reali, descrizioni
verificabili e undici lingue.

Il sito è una reinterpretazione dichiarata di *Scale of the Universe* di Cary e
Michael Huang (https://scaleofuniverse.com/): il credito e il link all'originale sono
sempre visibili. L'intero lavoro è dichiarato come **esperimento per provare
Claude Fable 5.2**.

## Punto di partenza

La bozza contiene circa 435 oggetti da 10⁻³⁵ a 10²⁷ m in una stringa dentro l'HTML,
una tela canvas con zoom logaritmico, scheda di dettaglio, ricerca, filtri
(Aggiornato / Nuovo / Ipotetico / Incerto), musica generativa e controlli in "vetro
liquido". Mancano: immagini (solo emoji e sprite procedurali), descrizioni per molte
voci, fonte per singola voce, struttura di progetto, README, licenze, crediti,
favicon, anteprima social, link diretto a un oggetto, traduzioni.

Sorgente della bozza: https://claude.ai/artifact/6FYp4oWo648vWcRmWZMsRo (937 righe,
un solo file HTML). Va copiata nel repo come `reference/draft.html` al primo passo,
perché la fase 1 è un porting senza cambi visibili.

## Obiettivi

1. **Immagini per tutti gli oggetti.** Foto reali con licenza libera dove esistono;
   illustrazione SVG originale per ciò che non è fotografabile (particelle, unità,
   distanze, lunghezze d'onda, oggetti ipotetici). Le immagini compaiono sia sulla
   tela sia nella scheda.
2. **Descrizione di 2–3 frasi per ogni oggetto**, con almeno una fonte primaria
   collegata e la data dell'ultima verifica.
3. **Undici lingue**: italiano, inglese, tedesco, olandese (Belgio, `nl-BE`),
   portoghese (Brasile), spagnolo, francese, russo, cinese semplificato, arabo
   (layout da destra a sinistra), giapponese.
4. **Landing fissa** all'indirizzo principale: titolo, due righe, credito agli Huang
   con link, dichiarazione dell'esperimento Fable 5.2, scelta della lingua, pulsante
   d'ingresso. L'esperienza vive su `/<lingua>/`.
5. **Pubblicazione**: repo `scale-of-the-universe` sull'account GitHub
   `Federicokalik`, Pages su un sottodominio di `calicchia.design`.
6. **Aspetto mantenuto e rifinito**: stessa tela scura, stesso vetro liquido, stessa
   musica; funzionante anche su Firefox, Safari, mobile e in arabo.

## Non obiettivi

- Nessun backend, account, analytics o CMS.
- Nessun ridisegno dell'identità visiva.
- Nessuna riproduzione di grafica, testi, musica o codice dell'opera originale.
- Nessuna revisione madrelingua delle traduzioni in questa fase.

## Anti-obiettivi (fallimento anche se "funziona")

- Un valore o una descrizione senza fonte verificata, o una fonte che non dice ciò
  che la voce afferma.
- Un'immagine senza licenza chiara, senza credito, o che ritrae un oggetto diverso
  da quello dichiarato (rischio alto per stelle, nebulose minori, lune piccole).
- Sembrare l'originale o farsi passare per esso.

## Decisioni prese da Federico

| Tema | Decisione |
|---|---|
| Immagini | Foto reali + illustrazioni originali; su tela e in scheda |
| Descrizioni | 2–3 frasi + fonte per voce |
| Lingue | IT, EN, DE, NL-BE, PT-BR, ES, FR, RU, ZH-Hans, AR, JA |
| Stack | Astro (ultima versione) + UnoCSS |
| Repo | `scale-of-the-universe`, account `Federicokalik`, sottodominio di calicchia.design |
| Landing | Pagina d'ingresso fissa con credito e link all'originale |
| Licenze | MIT per il codice, CC BY 4.0 per testi e illustrazioni originali |
| Elenco oggetti | Verifica di tutti i valori; aggiunte solo dopo approvazione |
| Design | Mantenere e rifinire, musica compresa |
| Traduzioni | Tutte al lancio, con avviso che sono automatiche |
| Note d'attualità | Mantenute, con data di verifica |
| File immagini | Nel repo, ottimizzate |
| Dichiarazione | Tutto il lavoro è un esperimento per provare Fable 5.2 |

## Scelte mie (da confermare leggendo)

- **Architettura.** Sito Astro statico, senza framework UI: il motore della tela
  resta un modulo TypeScript puro caricato come script di pagina; Astro genera
  landing, pagine per lingua, metadati e sitemap. UnoCSS per i controlli; il
  materiale "vetro" resta in CSS dedicato perché usa filtri SVG generati a runtime.
- **Dati.** Un file per oggetto non serve: `src/data/objects.json` (id stabile,
  dimensione in metri, tipo, flag, immagine, fonti, data di verifica) più
  `src/data/i18n/<lingua>.json` con nome e descrizione per id. Schema validato in
  build.
- **Fonti ammesse.** Primarie o istituzionali: NASA/JPL, ESA, ESO, CODATA/NIST,
  IAU/Minor Planet Center, SIMBAD/NED, articoli peer-reviewed o arXiv, enti
  ufficiali per edifici e geografia. Wikipedia solo come pista, mai come fonte
  citata.
- **Licenze immagini ammesse.** Pubblico dominio, CC0, CC BY, CC BY-SA (ESA: CC
  BY-SA 3.0 IGO; ESO: CC BY 4.0; NASA: pubblico dominio salvo eccezioni indicate).
  Escluse NC e ND. Se non esiste una foto libera e corretta, l'oggetto riceve
  un'illustrazione originale, non una foto dubbia.
- **Formato immagini.** WebP in due misure (circa 256 px per la tela, 800 px per la
  scheda), caricamento pigro in base alla scala visibile; sulla tela ritaglio
  circolare per corpi sferici, sagoma su trasparente dove possibile. Crediti in
  `src/data/credits.json`, da cui si genera `CREDITS.md` e il pannello crediti.
- **Immagini sulla tela per oggetti non sferici.** Nebulose, galassie e strutture
  cosmiche: foto su fondo nero con bordo sfumato, fusa in modo additivo, così non si
  vede il rettangolo. Edifici, luoghi, animali e oggetti: foto in cornice arrotondata
  con il cerchio tratteggiato della dimensione reale, come oggi per le emoji.
- **Cosa si traduce.** Nome e descrizione (la nota d'attualità fa parte della
  descrizione) sono tradotti per lingua. Numeri e unità non stanno nei testi dei
  dati: li formatta il codice con `Intl` per ogni lingua, con cifre occidentali
  anche in arabo. I nomi delle unità e le etichette dell'interfaccia stanno in un
  file di stringhe per lingua.
- **Licenze miste.** La CC BY 4.0 copre solo testi e illustrazioni originali. Ogni
  foto di terzi conserva la propria licenza (comprese le CC BY-SA di ESA, anche
  dopo il ritaglio), indicata voce per voce nei crediti.
- **Landing.** Nessun reindirizzamento automatico. Testo breve in inglese, elenco
  delle undici lingue ciascuna con il proprio nome; ricorda l'ultima lingua scelta
  e la evidenzia. Ogni pagina per lingua ha i propri metadati e `hreflang`.
- **Oggetti senza valore verificabile.** Se la fonte non conferma il valore: lo
  correggo e segno "Aggiornato"; se è contestato: "Incerto" con la forbice; se non
  trovo nulla di affidabile: lo propongo per la rimozione.
- **Link diretto.** `/<lingua>/#<id>` apre la scheda dell'oggetto e porta la scala
  su di esso.
- **Vetro fuori da Chromium.** Sfocatura più bordo speculare, senza rifrazione
  (limite della piattaforma, già previsto nella bozza).
- **Accessibilità.** Navigazione completa da tastiera, elenco testuale degli oggetti
  per lettori di schermo, rispetto di `prefers-reduced-motion` e
  `prefers-reduced-transparency`, contrasto AA sui testi.
- **Controlli automatici.** Script che verifica: schema dei dati, ogni oggetto ha
  immagine + credito + fonte + data, ogni lingua ha tutte le chiavi, i link delle
  fonti rispondono. Test Playwright su zoom, ricerca, scheda, cambio lingua, RTL.
- **Deploy.** GitHub Actions costruisce e pubblica su Pages a ogni push su `main`;
  file `CNAME` per il sottodominio. Il record DNS lo imposta Federico.
- **Git.** Lavoro su rami di funzionalità con pull request verso `main`; serve
  `gh auth switch` sull'account `Federicokalik` (già presente nel portachiavi).

## Dimensione reale del lavoro

Circa 435 oggetti significano circa 435 verifiche di valore, 435 immagini con
licenza e circa 4.800 descrizioni (435 × 11 lingue). È un progetto, non una
modifica: va fatto a fasi, con un punto di controllo dopo ognuna.

## Fasi

1. **Fondamenta.** Repo locale, Astro + UnoCSS, porting della bozza senza cambi
   visibili, dati estratti in JSON, landing, deploy di prova su Pages.
2. **Verifica dei dati (italiano).** A blocchi per categoria (particelle, atomi e
   molecole, biologia, oggetti, luoghi, Sistema Solare, stelle, buchi neri,
   nebulose, galassie, strutture cosmiche): valore, descrizione, fonte, data.
   Consegna intermedia: tabella delle correzioni e lista delle aggiunte proposte.
3. **Immagini.** Ricerca, scaricamento, licenza e credito per ogni oggetto;
   illustrazioni SVG per i non fotografabili; integrazione su tela e scheda.
4. **Traduzioni.** Dieci lingue a partire dall'italiano verificato; RTL per
   l'arabo; avviso "traduzione automatica" in README e in "Metodo e fonti".
5. **Rifinitura.** Compatibilità browser, mobile, accessibilità, prestazioni,
   metadati social, favicon, README, LICENSE, CREDITS.
6. **Pubblicazione.** Creazione del repo pubblico, push, Pages, dominio. Solo dopo
   conferma esplicita.

## Lasciato a chi costruisce

Struttura interna dei moduli della tela, nomi dei file, strategia di caricamento
delle immagini, dettagli delle utility UnoCSS, forma esatta dei test.

## Risposte arrivate dopo l'approvazione

1. Indirizzo: `https://federicokalik.github.io/scale-of-the-universe/` (deciso il 13 novembre 2026: niente sottodominio di calicchia.design).
2. Licenza, crediti e firma: **Federico Calicchia**.
3. Il titolo è tradotto in ogni lingua (in italiano "Scala dell'Universo 2026").
