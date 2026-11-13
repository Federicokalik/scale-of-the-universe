# Fasi 4 e 5: traduzioni e rifinitura

Stato al 13 novembre 2026. Tutto su `main`.

## Fase 4 – traduzioni (chiusa)

- Dieci lingue dall'italiano verificato: en, de, nl-BE, pt-BR, es, fr, ru, zh-Hans, ar, ja.
- Traduzioni automatiche, non riviste da madrelingua; l'avviso è in "Metodo e fonti", nella pagina iniziale e nel README.
- `node scripts/check-translations.mjs` confronta ogni lingua con l'italiano: voci mancanti o in più, testi vuoti, segnaposto e tag HTML persi (errori); numeri dell'italiano assenti nella traduzione (solo elenco, con `--notes`).
- In cinese, giapponese e spagnolo i grandi numeri sono riscritti nelle unità della lingua (万, 亿, "millones"): lì il controllo sui numeri segnala falsi positivi e non sostituisce una lettura.
- Russo, cinese, giapponese e arabo usano i caratteri di sistema: Fraunces e Public Sans non coprono quelle scritture.

## Fase 5 – rifinitura (fatta in questa sessione)

- Indirizzo: `https://federicokalik.github.io/scale-of-the-universe/` (niente dominio proprio).
- Telefono (375 px): tre righe in alto, strumenti a icona, scheda come foglio sopra la barra della scala; la scena sposta il proprio centro nella parte libera, anche su schermi larghi.
- Menu della lingua dentro l'esperienza, che conserva l'oggetto aperto.
- Controlli da almeno 44 px al tocco, finestra chiudibile dall'alto, favicon, immagine di anteprima, link hreflang.
- Clic su un oggetto: zoom e centratura. Nomi mai sovrapposti e subito sotto l'immagine. Nessuna emoji sulla tela.
- Regole della skill ui-ux-pro-max applicate in ordine di priorità (accessibilità, tocco, prestazioni, stile, layout, tipografia, movimento).

## Non verificato

- Firefox e Safari: in questo ambiente c'è solo Chromium.
- Musica: si avvia senza errori, ma il suono non è stato ascoltato.
- Lettori di schermo reali.
- Esito di GitHub Actions (nessuna esecuzione registrata al momento della scrittura).
