import fs from 'node:fs';
import assert from 'node:assert/strict';

const pageSource = fs.readFileSync('src/pages/homework-create.jsx', 'utf8');
const sharedSource = fs.readFileSync('src/components/shared.jsx', 'utf8');

const usedIcons = [...pageSource.matchAll(/Icon\.([A-Za-z0-9_]+)/g)].map(match => match[1]);
const iconObject = sharedSource.match(/export const Icon = \{([\s\S]*?)\n\};/);

assert.ok(iconObject, 'Shared icon object should be present.');

for (const iconName of new Set(usedIcons)) {
  const hasIcon = new RegExp(`\\b${iconName}\\s*:`).test(iconObject[1]);
  assert.equal(hasIcon, true, `Icon.${iconName} is used by homework-create.jsx but is not defined.`);
}
