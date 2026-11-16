# expensestraker

## Sviluppo e verifiche

Node >=22.12.0. Eseguire dalla radice: `npm run install:all`, quindi `npm run dev:server` e `npm run dev:client` in due terminali.

Porte riservate: frontend **3001**, API **4001**, anteprima **4101**. Le porte sono fisse; Vite fallisce se occupate e non passa alla porta di un’altra app. Le API locali passano tramite il proxy /api, anche nell’anteprima. PORT nel file .env non modifica la porta riservata. In sviluppo il backend accetta automaticamente gli indirizzi di rete di questo PC sulle porte 3001 e 4101, quindi dal telefono sulla stessa Wi-Fi basta aprire `http://IP-DEL-PC:3001`; in produzione valgono solo `APP_ORIGIN` e `APP_ORIGINS`.

Comandi comuni: `npm run build`, `npm test`, `npm run preview`, `npm run format`, `npm run format:check`.

Struttura comune: client/src (components, pages, hooks, contexts, i18n/locales, routes, styles, types, utils), client/tests, server/src, server/test, docs. Le cartelle aggiuntive contengono funzionalità specifiche dell’app.
