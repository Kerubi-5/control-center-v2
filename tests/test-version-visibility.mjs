import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../versions.json', import.meta.url), 'utf8'));
const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

if (manifest.production !== '2.6') {
  throw new Error('Production version must explicitly be v2.6');
}
const alternate = manifest.versions.find((version) => version.id === '2.5-alt');
if (!alternate || alternate.hidden !== true) {
  throw new Error('Alba V3 alternate must be hidden from pickers while retaining its direct-link payload');
}
if (!page.includes('function visibleVersions()')) {
  throw new Error('Picker must filter hidden versions through visibleVersions()');
}
if (!page.includes('function productionId()') || !page.includes('return manifest.production || manifest.latest;')) {
  throw new Error('Production version resolver is missing');
}
if (!page.includes('return productionId();')) {
  throw new Error('Default load must resolve to the production version');
}
console.log('PASS: v2.6 is production and hidden alternates remain direct-link only');
