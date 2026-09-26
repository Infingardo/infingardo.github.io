# PWA indipendenti per Dashboard e app figlie

## Obiettivo

Consentire l'installazione separata in Chrome di Dashboard, Enigmistica e
Dizionario dei Sinonimi. Ogni app deve mostrare la propria icona e avere il
proprio service worker, senza che la PWA Dashboard intercetti le pagine sotto
`/Enigmistica/` o `/sinonimi-dizionario/`.

## Contesto e causa

La Dashboard corrente risiede alla radice del sito. Il suo manifest ha
`start_url` e `scope` uguali a `/`, e registra `/sw.js`. Questa PWA quindi
include tutti i percorsi del sito. Chrome associa una pagina figlia a questa
PWA già installata e propone di aprirla nella Dashboard anziché di installare
l'app figlia.

Le app figlie hanno già manifest e service worker propri. Il problema è
l'ambito della Dashboard, non le loro configurazioni.

## Decisione

La Dashboard diventa una PWA separata sotto `/dashboard/`.

- Nuovo URL installabile: `https://infingardo.github.io/dashboard/`.
- `https://infingardo.github.io/` resta un URL valido e reindirizza a
  `/dashboard/`.
- Il manifest Dashboard usa `id`, `start_url` e `scope` pari a `/dashboard/`.
- Il service worker Dashboard risiede sotto `/dashboard/sw.js` e controlla
  soltanto client sotto `/dashboard/`.
- Le app esistenti, inclusi `/Enigmistica/` e `/sinonimi-dizionario/`, non
  vengono modificate.

## Migrazione della vecchia PWA radice

La pagina radice non caricherà più un manifest né registrerà un service worker
persistente. Il vecchio `/sw.js` diventerà un service-worker di migrazione:
all'attivazione elimina esclusivamente cache con prefisso `dashboard-` e
annulla la propria registrazione. Non deve annullare registrazioni delle app
figlie né cancellarne le cache.

Una PWA Dashboard già installata dall'utente conserva comunque la propria
voce nel sistema operativo: l'utente dovrà disinstallarla e installare una
volta la nuova Dashboard da `/dashboard/`.

## File e responsabilità

| Percorso | Responsabilità dopo la modifica |
| --- | --- |
| `/index.html` | Redirect compatibile a `/dashboard/`; nessuna registrazione PWA. |
| `/sw.js` | Migrazione e auto-rimozione della sola vecchia PWA radice. |
| `/dashboard/index.html` | Interfaccia Dashboard e registrazione di `./sw.js`. |
| `/dashboard/manifest.json` | Identità, scope e icone della nuova Dashboard PWA. |
| `/dashboard/sw.js` | Precache della shell Dashboard e runtime cache solo per client Dashboard. |
| `/dashboard/*.png` | Icone Dashboard riferite dal manifest. |

## Compatibilità e limiti

- I collegamenti esistenti alla radice restano validi grazie al redirect.
- Gli URL delle app mediche e delle app non mediche restano invariati.
- La cache offline della nuova Dashboard viene popolata dopo una prima visita
  online a `/dashboard/`.
- L'installazione effettiva delle tre PWA è una verifica manuale in Chrome:
  non è dimostrabile solo con controlli statici.

## Verifica richiesta

1. Test statico dei manifest: ogni PWA ha `id`, `start_url` e `scope` nel
   proprio percorso.
2. Test statico del service worker: la migrazione radice tocca soltanto
   registrazione e cache Dashboard radice.
3. Test browser locale: Dashboard mostra tutte le card e il redirect radice
   porta a `/dashboard/`.
4. Test browser Chrome: installare Dashboard, Enigmistica e Sinonimi e
   confermare tre icone/app distinte.
5. Test offline manuale dopo una prima apertura online di ciascuna app.

## Non-obiettivi

- Nessuna modifica al contenuto o alla logica delle app mediche.
- Nessun cambiamento agli URL delle app figlie.
- Nessun tentativo di aggiornare automaticamente l'icona di una PWA già
  installata nel sistema operativo.
