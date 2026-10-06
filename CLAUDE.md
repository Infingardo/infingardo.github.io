# infingardo.github.io: dashboard / PWA portal

Portal that links the tool repos (siblings in `../`). Not a diagnostic tool itself. Shared tool rules are in `../CLAUDE.md`.

- Root `/` is only a redirect page plus an `sw.js` that unregisters itself and deletes `dashboard-*` caches. Do not register a service worker or manifest at the root. The PWA lives in `/dashboard/` (own manifest, scope `/dashboard/`, own `sw.js`).
- `lib/` holds vendored react, react-dom, babel (kept on v7: v8 was breaking, see commit 29d1d53) and tailwind, precached for offline use. Keep them local.
- Test: from the repo root, `node tests/pwa-scopes.test.mjs` (no package.json). It also reads `../Enigmistica` and `../sinonimi-dizionario`, so those must be cloned next to this repo. It asserts exact strings (cache name `pwa-dashboard-v1`, manifest id/start_url/scope): update the test together with any intentional change.
- Design notes: `docs/superpowers/` (spec and plan of 2026-09-26 on PWA scopes).
