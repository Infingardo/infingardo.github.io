import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootHtml = readFileSync('index.html', 'utf8');
const rootWorker = readFileSync('sw.js', 'utf8');
const dashboardManifest = JSON.parse(readFileSync('dashboard/manifest.json', 'utf8'));
const dashboardHtml = readFileSync('dashboard/index.html', 'utf8');
const dashboardWorker = readFileSync('dashboard/sw.js', 'utf8');
const enigmisticaManifest = JSON.parse(readFileSync('../Enigmistica/manifest.json', 'utf8'));
const sinonimiManifest = JSON.parse(readFileSync('../sinonimi-dizionario/manifest.json', 'utf8'));

assert.match(rootHtml, /<noscript><meta http-equiv="refresh" content="0; url=\/dashboard\/"><\/noscript>/);
assert.doesNotMatch(rootHtml, /rel="manifest"/);
assert.doesNotMatch(rootHtml, /serviceWorker\.register/);
assert.match(rootHtml, /registration\.scope === `\$\{location\.origin\}\//);
assert.match(rootWorker, /key\.startsWith\('dashboard-'\)/);
assert.equal(dashboardManifest.id, '/dashboard/');
assert.equal(dashboardManifest.start_url, '/dashboard/');
assert.equal(dashboardManifest.scope, '/dashboard/');
assert.match(dashboardHtml, /href="\.\/manifest\.json"/);
assert.match(dashboardHtml, /src="\.\.\/lib\/react\.min\.js"/);
assert.match(dashboardHtml, /src="\.\.\/lib\/react-dom\.min\.js"/);
assert.match(dashboardHtml, /src="\.\.\/lib\/babel\.min\.js"/);
assert.match(dashboardHtml, /src="\.\.\/lib\/tailwind\.js"/);
assert.match(dashboardHtml, /serviceWorker\.register\('\.\/sw\.js'\)/);
assert.match(dashboardWorker, /const CACHE = 'pwa-dashboard-v1';/);
assert.equal(enigmisticaManifest.scope, './');
assert.equal(sinonimiManifest.scope, './');

console.log('PWA scope configuration checks passed');
