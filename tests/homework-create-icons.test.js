import fs from 'node:fs';
import assert from 'node:assert/strict';

const pageSource = fs.readFileSync('src/pages/homework-create.jsx', 'utf8');
const iconsSource = fs.readFileSync('src/components/ui/icons.jsx', 'utf8');

const usedIcons = [...pageSource.matchAll(/Icon\.([A-Za-z0-9_]+)/g)].map(match => match[1]);
const iconObject = iconsSource.match(/export const Icon = \{([\s\S]*?)\n\};/);

assert.ok(iconObject, 'Icon object should be present in ui/icons.jsx.');

for (const iconName of new Set(usedIcons)) {
  const hasIcon = new RegExp(`\\b${iconName}\\s*:`).test(iconObject[1]);
  assert.equal(hasIcon, true, `Icon.${iconName} is used by homework-create.jsx but is not defined.`);
}
