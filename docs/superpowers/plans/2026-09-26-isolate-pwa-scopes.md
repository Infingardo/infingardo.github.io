# PWA indipendenti per Dashboard e app figlie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere installabili come PWA distinte Dashboard, Enigmistica e Dizionario dei Sinonimi senza cambiare gli URL delle app figlie.

**Architecture:** La Dashboard viene trasferita come PWA da `/` a `/dashboard/`. La radice diventa una pagina di migrazione che reindirizza al nuovo percorso e ritira soltanto il vecchio service worker di Dashboard; Enigmistica e Sinonimi conservano manifest e service worker già pubblicati.

**Tech Stack:** HTML statico, manifest web JSON, service worker JavaScript, Node.js per controlli statici, Chrome per verifica manuale.

**Spec:** `docs/superpowers/specs/2026-09-26-isolate-pwa-scopes-design.md`

## Global Constraints

- Non cambiare contenuto, logica o URL delle app figlie.
- Il nuovo manifest Dashboard deve usare esattamente `id`, `start_url` e `scope` uguali a `/dashboard/`.
- Il service worker di migrazione alla radice può eliminare solo cache con prefisso `dashboard-` e solo la registrazione con scope uguale alla radice dell'origine.
- La Dashboard continua a includere le 22 card mediche, fra cui Parigi urinario e Immunoistochimica - HER2.
- Nessuna dipendenza nuova.
- Il repository deve restare localmente salvato; commit e push richiedono autorizzazione esplicita dell'utente.

## Review Focus

- Una Dashboard già installata con scope `/` non deve eliminare registrazioni o cache delle app figlie durante la migrazione.
- Una visita a `https://infingardo.github.io/` deve portare a `/dashboard/` anche con JavaScript disattivato.
- Il manifest `/dashboard/manifest.json` non deve recuperare accidentalmente l'identità o il service worker radice.
- Le card dashboard devono mantenere URL assoluti verso le app figlie e non puntare a `/dashboard/<app>/`.
- Offline, una prima visita alla nuova Dashboard deve precache della propria shell senza pretendere di precache tutte le app figlie.

---

### Task 1: Test di configurazione PWA e migrazione della radice

**Files:**
- Create: `tests/pwa-scopes.test.mjs`
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- Consumes: percorso repository e file statici pubblicati.
- Produces: `node tests/pwa-scopes.test.mjs`, controllo eseguibile della separazione degli scope PWA.

- [ ] **Step 1: Scrivere il test inizialmente fallente**

Creare `tests/pwa-scopes.test.mjs` con questi controlli:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootHtml = readFileSync('index.html', 'utf8');
const rootWorker = readFileSync('sw.js', 'utf8');
const dashboardManifest = JSON.parse(readFileSync('dashboard/manifest.json', 'utf8'));
const dashboardHtml = readFileSync('dashboard/index.html', 'utf8');
const dashboardWorker = readFileSync('dashboard/sw.js', 'utf8');

assert.match(rootHtml, /http-equiv="refresh" content="0; url=\/dashboard\//);
assert.doesNotMatch(rootHtml, /rel="manifest"/);
assert.doesNotMatch(rootHtml, /serviceWorker\.register/);
assert.match(rootHtml, /registration\.scope === `\$\{location\.origin\}\//);
assert.match(rootWorker, /key\.startsWith\('dashboard-'\)/);
assert.equal(dashboardManifest.id, '/dashboard/');
assert.equal(dashboardManifest.start_url, '/dashboard/');
assert.equal(dashboardManifest.scope, '/dashboard/');
assert.match(dashboardHtml, /href="\.\/manifest\.json"/);
assert.match(dashboardHtml, /serviceWorker\.register\('\.\/sw\.js'\)/);
assert.match(dashboardWorker, /const CACHE = 'dashboard-v1';/);
console.log('PWA scope configuration checks passed');
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node tests/pwa-scopes.test.mjs`

Expected: errore `ENOENT` per `dashboard/manifest.json`, perché la nuova PWA Dashboard non è ancora stata creata.

- [ ] **Step 3: Sostituire la radice con la pagina di migrazione**

Sostituire `index.html` con questa pagina, che esegue un redirect HTML anche senza JavaScript e rimuove soltanto il vecchio service worker radice prima del redirect JavaScript:

```html
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=/dashboard/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Filippo's Dashboard</title>
  <script>
    window.addEventListener('load', async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations
          .filter(registration => registration.scope === `${location.origin}/`)
          .map(registration => registration.unregister()));
      }
      location.replace('/dashboard/');
    });
  </script>
</head>
<body><p>Reindirizzamento alla <a href="/dashboard/">Dashboard</a>…</p></body>
</html>
```

- [ ] **Step 4: Trasformare `sw.js` in service worker di migrazione**

Sostituire il contenuto di `sw.js` con:

```js
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('dashboard-'))
      .map(key => caches.delete(key)));
    await self.registration.unregister();
  })());
});
```

- [ ] **Step 5: Creare l'app Dashboard separata**

Eseguire, usando il contenuto Dashboard dell'attuale `HEAD` anche se la
pagina radice è già stata sostituita al passo 3:

```bash
mkdir -p dashboard
cp android-chrome-192x192.png android-chrome-512x512.png apple-touch-icon.png favicon-16x16.png favicon-32x32.png favicon.ico dashboard/
git show HEAD:index.html > dashboard/index.html
```

Nel file copiato applicare esclusivamente queste sostituzioni:

```diff
- <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
+ <link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png">
- <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
+ <link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png">
- <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
+ <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png">
- <link rel="manifest" href="/manifest.json">
+ <link rel="manifest" href="./manifest.json">
- navigator.serviceWorker.register('/sw.js')
+ navigator.serviceWorker.register('./sw.js')
```

- [ ] **Step 6: Creare manifest e service worker della nuova Dashboard**

Creare `dashboard/manifest.json`:

```json
{
  "name": "Filippo's Dashboard app",
  "short_name": "Dashboard",
  "description": "Applicazioni mediche e progetti in un unico posto",
  "id": "/dashboard/",
  "start_url": "/dashboard/",
  "scope": "/dashboard/",
  "display": "standalone",
  "background_color": "#f0f4ff",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "./android-chrome-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "./android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Creare `dashboard/sw.js` copiando il comportamento cache-first/stale-while-revalidate della vecchia Dashboard, con `const CACHE = 'dashboard-v1';`, e precache relativo:

```js
const PRECACHE = [
  './', './index.html', './manifest.json',
  '../lib/react.min.js', '../lib/react-dom.min.js', '../lib/babel.min.js', '../lib/tailwind.js',
  './android-chrome-192x192.png', './android-chrome-512x512.png', './apple-touch-icon.png'
];
```

Nel gestore `fetch`, mantenere il limite `url.origin === location.origin` e
il fallback offline a `caches.match('./index.html')`.

- [ ] **Step 7: Rieseguire il test e controllare il diff**

Run: `node tests/pwa-scopes.test.mjs && git diff --check`

Expected: `PWA scope configuration checks passed` ed exit code 0.

### Task 2: Verifica browser e compatibilità degli URL

**Files:**
- Test: `tests/pwa-scopes.test.mjs`
- Verify: `index.html`, `dashboard/index.html`, `dashboard/manifest.json`, `dashboard/sw.js`, `sw.js`

**Interfaces:**
- Consumes: separazione statica prodotta dal Task 1.
- Produces: evidenza locale che dashboard e app figlie non condividono la stessa PWA.

- [ ] **Step 1: Estendere il test con manifest delle app figlie**

Aggiungere al test:

```js
const enigmisticaManifest = JSON.parse(readFileSync('../Enigmistica/manifest.json', 'utf8'));
const sinonimiManifest = JSON.parse(readFileSync('../sinonimi-dizionario/manifest.json', 'utf8'));
assert.equal(enigmisticaManifest.scope, './');
assert.equal(sinonimiManifest.scope, './');
```

- [ ] **Step 2: Eseguire il test e verificare che passi**

Run: `node tests/pwa-scopes.test.mjs`

Expected: `PWA scope configuration checks passed` ed exit code 0.

- [ ] **Step 3: Servire la Dashboard localmente e verificare il redirect**

Run: `python3 -m http.server 8080 --bind 127.0.0.1`

Expected: aprendo `http://127.0.0.1:8080/` il browser finisce su
`http://127.0.0.1:8080/dashboard/`; la pagina contiene 22 app mediche,
“Citologia urinaria - Sistema di Parigi (TPS 2022)” e
“Immunoistochimica - HER2”.

- [ ] **Step 4: Verificare i manifest in Chrome**

Aprire in Chrome `http://127.0.0.1:8080/dashboard/`,
`https://infingardo.github.io/Enigmistica/` e
`https://infingardo.github.io/sinonimi-dizionario/`. Controllare che la
Dashboard locale offra il proprio manifest sotto `/dashboard/` e che le due
app figlie mantengano ciascuna il proprio manifest; non installare o
disinstallare PWA dell'utente durante il test automatico.

- [ ] **Step 5: Chiudere il server locale e rieseguire la suite**

Run: `node tests/pwa-scopes.test.mjs && git diff --check && git status --short`

Expected: test statico passato, nessun errore di whitespace e lista esatta
dei file creati/modificati.

## Coverage review

- Scope separati e identità Dashboard: Task 1, passi 5-7.
- Compatibilità della radice: Task 1, passo 3 e Task 2, passo 3.
- Ritiro sicuro del vecchio service worker: Task 1, passo 4.
- Nessuna modifica alle app figlie: Task 2, passo 1 e revisione del diff.
- Verifica Chrome e offline: Task 2, passi 3-5; il test in modalità aereo
  resta manuale dopo pubblicazione.
