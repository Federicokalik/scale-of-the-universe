# Fase 2 — correzioni fatte e decisioni aperte

Aggiornato dopo ogni ondata. Le correzioni sono già applicate ai dati; le decisioni aperte aspettano Federico.

## Correzioni di valore applicate

| Oggetto | Da | A | Fonte |
|---|---|---|---|
| Elettrone (limite superiore) | 1,4 × 10⁻¹⁸ m | 2,8 × 10⁻¹⁹ m | Bourilkov, Phys. Rev. D (2000) |
| Batteriofago T4 | 210 nm | 260 nm | Rao e colleghi (2023), ViralZone; il totale è la somma di testa e coda |
| Anticorpo IgG | 12 nm | 15 nm | Rayner e colleghi, J. Biol. Chem. (2015) |
| Particella di argilla | 2,2 µm | 2,0 µm | ISO 14688-1 (limite di classe) |
| Nevischio | 4,2 mm | 1 mm | WMO International Cloud Atlas, Treccani |
| Uovo di colibrì | 10,6 mm | 10 mm | Guinness World Records ("meno di 10 mm", limite superiore) |
| Uovo di quaglia | 35 mm | 32 mm | Teușan e colleghi, Scientific Papers: Animal Science and Biotechnologies |

## Decisioni aperte

1. **Elettrone (limite superiore)**: tenere la correzione o tornare al valore convenzionale di partenza (senza fonte).
2. **Quark up e down**: le dimensioni convenzionali (1,1 e 1,2 × 10⁻¹⁸ m) superano il limite sperimentale di 0,43 × 10⁻¹⁸ m. Abbassarle o lasciarle con la nota.
3. **Cellula della pelle**: 30 µm vale solo per i corneociti appiattiti; i cheratinociti vivi sono 6–15 µm. Rinominare o rimpicciolire.
4. **Fibra di seta**: 12,5 µm è il singolo filamento (7–14 µm), non il filo del bozzolo (15–26 µm). Rinominare o cambiare valore.
5. **Nevischio**: in alternativa alla correzione, tenere 4,2 mm e rinominare in "Granuli di ghiaccio".
6. **Chicco di grandine più grande**: la fonte sostiene un record statunitense, non mondiale. Il nome dice ancora "più grande".
7. **Valori lasciati invariati ma con alternative più centrali**: gatto (0,46 m contro medie di 0,50–0,55 m), quercia (20 m, minimo dell'intervallo 20–40 m), saguaro (12 m contro massimi ordinari di 13,7–15,2 m).
8. **Pelle delle palpebre e della pianta del piede**: una sola fonte (Università di Leeds); altre non apribili suggeriscono 2,3–2,9 mm per il tallone.

9. **Fiammifero**: proposto per la rimozione (nessuna fonte apribile con una lunghezza). Non rimosso: tenerlo, cercare ancora o toglierlo.
10. **Seme di girasole**: l'unica fonte aperta dà 7,8 mm contro i 10,4 attuali, e il suo link va in timeout. Da ricontrollare.
11. **Starship**: 123 m confermati, ma la versione V3 (volata il 22 maggio 2026) sarebbe 124 m secondo Scientific American; le pagine SpaceX e FAA non si aprivano.
12. **Mondo di Minecraft**: nessuna pagina ufficiale Mojang aperta; unica fonte una segnalazione sul tracker dei bug. Segnato incerto.
13. **Cubo di Rubik**: confermato sul dato del V&A (5,5 cm); i 5,7 cm attuali non sono stati verificati.
14. **Oggetti generici** (smartphone, schermo, tazza, pallone da spiaggia, bicicletta, automobile): confermati su un solo esemplare ciascuno.

## Da sistemare prima di chiudere la fase

- **Note "L'originale: …"**: i ricercatori le tolgono perché non possono verificare la versione del 2012. Aggiornare in `it.json` la chiave `dialog.diff.values`, che promette il valore di partenza nelle schede, e decidere se il flag "Aggiornato" ha ancora senso così com'è.
- **Fonti tecniche**: alcuni lotti (molecole, biologia 1) citano indirizzi REST di Europe PMC o PubChem. Sostituirli con le pagine leggibili.
- **Link che rifiutano le richieste automatiche** (da aprire a mano): TSMC (gate dei transistor in produzione), Karger (cellula della pelle), Humanists UK (teiera di Russell).
- **Raggi atomici**: la fonte è WebElements (Università di Sheffield), secondaria.
- **Controllo a campione**: ondata 1 e pilota confermati; ondata 2 confermata su due fonti su tre (PubMed non rileggibile in automatico). Le ondate successive non hanno ancora avuto il campione.
- **Superlativi tolti** perché non sostenuti: elio "atomo più piccolo", cesio "tra i più grandi", Cosmic Horseshoe "misura diretta più alta", Argentinosaurus "da resti solidi".

## Avanzamento

Lotti applicati: black-holes, particles-1/2, atoms-1/2, waves-1/2, molecules-1/2, units-1/2/3, biology-1/2/3/4/5, objects-1/2/3/4/5 (201 oggetti su 447).

Lotti da fare: places-1/2/3/4, solar-system-1/2/3/4/5, stars-1/2/3/4, distances-1/2/3, nebulae-1/2/3, galaxies-1/2, cosmic-1/2.

Per ogni lotto: `node scripts/apply-research.mjs --check`, `node scripts/check-links.mjs`, campione di fonti riletto in modo indipendente, poi `node scripts/apply-research.mjs`, `npm run validate`, `npm test`, commit.
