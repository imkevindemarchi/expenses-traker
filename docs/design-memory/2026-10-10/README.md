# Memoria dello stile — 10 ottobre 2026

Riferimento salvato su richiesta dell'utente per riutilizzare il selettore mese/anno della Home e il FloatingButton. Le copie in questa cartella sono snapshot di riferimento, non file da importare nell'app. Non modificarle quando si cambia la UI corrente.

## Selettore mese/anno della Home

Fonti: MonthPicker.component.tsx, app.css, liquid-glass.asset.ts e index.css.

- Pulsante con icona calendario, mese in evidenza, anno sotto e chevron; frecce precedente/successivo ai lati.
- Icona 36px, raggio 13px; pulsante con raggio 18px, padding 7px 12px e gap 11px.
- Pannello in portal, larghezza massima 344px, raggio 28px e padding 18px; barra anno con raggio 16px e griglia mesi a tre colonne.
- Glass del pannello tramite getLiquidGlassClass: tema chiaro fondo bianco al 35%, bordo bianco al 70%; tema scuro fondo nero al 35%, bordo bianco al 15%.
- Blur xs e saturazione 125%; da md blur sm e saturazione 150%. Conservare i valori esatti delle classi nella copia del helper.
- Mese selezionato verde #32cd32 con testo bianco e spunta; indicatore discreto del mese corrente.
- Chiusura con clic esterno/Esc e selezione; navigazione con frecce da tastiera.

## FloatingButton

Fonti: FloatingButton.component.tsx e FloatingButton.styles.css.

- Pulsante circolare: size-13, da sm size-18; icona verde primaria.
- Vetro poco sfocato: blur 2px, saturazione 1.15. Riflessi esclusivamente bianchi/neutri, senza rosso/blu.
- Superficie a gradienti, luce interna morbida e bordo conico mascherato di 1.5px.
- Riflesso che segue il puntatore mouse attraverso --glass-x e --glass-y.
- Hover: sollevamento di 2px, scala 1.035; icona scala 1.06. Pressione: scala .95.
- Tema scuro tramite data-glass-theme; fallback senza backdrop-filter, focus visibile e movimento ridotto.

## Preferenze concordate da conservare

- Contorni del glass discreti e più scuri in dark mode.
- Nessun riflesso colorato rosso/blu.
- Il comando “Torna al mese corrente” deve comparire solo se il valore selezionato è diverso dal mese attuale.
- Liquid glass dei titoli solo su mobile dopo lo scroll, quando diventano compatti.
- Modal moderno con superficie opaca, senza liquid glass.

## Stato dello snapshot

Questo salvataggio riflette i file effettivamente presenti nel workspace al momento della richiesta. Qui il MonthPicker ha il glass sul pannello, non sul pulsante o sulla barra anno; “Torna al mese corrente” è ancora sempre renderizzato. Queste differenze dalle preferenze concordate sono annotate, non corrette da questa operazione di salvataggio. Non presumere che gli ultimi cambiamenti descritti in chat siano ancora presenti nei file: verificare prima di riutilizzare lo stile.

Per recuperare il design, confrontare le copie con i file correnti e trasferire solo gli stili necessari, senza sovrascrivere logica o modifiche successive.
