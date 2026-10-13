# expensestraker

## Sviluppo e verifiche

Node >=22.12.0. Eseguire dalla radice: `npm run install:all`, quindi `npm run dev:server` e `npm run dev:client` in due terminali.

Porte riservate: frontend **3000**, API **4000**, anteprima **4100**. Le porte sono fisse; Vite fallisce se occupate e non passa alla porta di un’altra app. Le API locali passano tramite il proxy /api, anche nell’anteprima. PORT nel file .env non modifica la porta riservata.

Comandi comuni: `npm run build`, `npm test`, `npm run preview`, `npm run format`, `npm run format:check`.

Struttura comune: client/src (components, pages, hooks, contexts, i18n/locales, routes, styles, types, utils), client/tests, server/src, server/test, docs. Le cartelle aggiuntive contengono funzionalità specifiche dell’app.
