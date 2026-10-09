# Struttura e API

```text
expenses-traker/
  client/                   React + TypeScript + Vite + Tailwind
    src/components/         Componenti riutilizzati da Alice & Kevin
    src/App.tsx             Dashboard, movimenti e management
    src/api.ts              HTTP, formattazione, export CSV
  server/                   Node.js + Express + Mongoose
    src/index.js            Configurazione, database, avvio
    src/app.js              API e serving della build
    src/auth.js             Cookie JWT, sessioni, limite tentativi
    src/models.js           Account, Category, Subcategory, Entry
    src/validation.js       Validazione condivisa back-end
    test/                   Test Node.js
```

Ogni documento Category/Subcategory/Entry ha un proprietario `user`. Il proprietario viene ricavato dalla sessione autenticata; non viene accettato dal body inviato dal client. Ogni lettura, aggiornamento ed eliminazione include il proprietario nel filtro. I collegamenti categoria/sottocategoria sono verificati dal server.

I movimenti sono conservati con importi interi in centesimi e date di calendario `YYYY-MM-DD`. Il dashboard e il CSV usano EUR; la data di default segue Europe/Rome. Il saldo è il totale delle entrate meno il totale delle spese del mese.

Le transazioni MongoDB proteggono la creazione degli account con categorie iniziali, le modifiche ai collegamenti e l’eliminazione dei riferimenti. Le risorse referenziate vengono aggiornate nella stessa transazione per creare conflitti di scrittura quando due operazioni concorrenti potrebbero lasciare dati incoerenti.

## Endpoint

| Metodo | Percorso | Funzione |
|---|---|---|
| GET | /api/health | Stato connessione database |
| POST | /api/auth/register | Crea account e categorie iniziali |
| POST | /api/auth/login | Accedi |
| GET | /api/auth/me | Account corrente |
| POST | /api/auth/logout | Esci e invalida sessioni |
| GET | /api/categories | Categorie e sottocategorie personali |
| POST/PATCH/DELETE | /api/categories[/:id] | Gestione categorie |
| POST/PATCH/DELETE | /api/subcategories[/:id] | Gestione sottocategorie |
| GET | /api/entries?month=YYYY-MM&page=1&category=ID&kind=expense&q=testo | Lista filtrata, 30 record per pagina |
| POST/PATCH/DELETE | /api/entries[/:id] | Gestione movimenti |
| GET | /api/summary?month=YYYY-MM | Totali e grafici mensili |

Esempio di movimento:

```json
{
  "title": "Visita medica",
  "kind": "expense",
  "amount": "45,50",
  "date": "2026-10-09",
  "category": "ID_CATEGORIA",
  "subcategory": "ID_SOTTOCATEGORIA",
  "notes": "Controllo annuale"
}
```

Gli ID devono essere ObjectId MongoDB validi. La sottocategoria può essere vuota, ma se indicata deve appartenere alla categoria e allo stesso account. Ogni risposta di errore ha `{ "message": "..." }`.
