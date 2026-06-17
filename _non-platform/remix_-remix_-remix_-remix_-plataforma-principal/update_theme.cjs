const fs = require('fs');
const path = require('path');

const fileExtensions = ['.tsx', '.ts', '.css', '.html'];

const colorMap = {
  '#1a2332': '#2C241E',
  '#2d8b8b': '#8C3A3A',
  '#e4f2f2': '#F4ECEC',
  '#cbdada': '#EAE0E0',
  '#607380': '#8A7A70',
  '#f0f8f7': '#FCF9F9',
  '#247070': '#6B2B2B',
  '#1f2d3a': '#3B312A',
  '#d8e6e6': '#EBE3E3',
  '#A8DADC': '#D4A8A8',
  '#657b8c': '#8C7E77'
};

function replaceColors(content) {
  let newContent = content;
  // Hex colors
  for (const [oldC, newC] of Object.entries(colorMap)) {
    newContent = newContent.replace(new RegExp(oldC, 'ig'), newC);
  }
  // Slate to stone for warmer neutrals
  newContent = newContent.replace(/slate-/g, 'stone-');
  
  // Replace references to font-sans with font-serif
  newContent = newContent.replace(/font-sans/g, 'font-serif');
  return newContent;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      if (fileExtensions.some(ext => fullPath.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const newContent = replaceColors(content);
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Updated ${fullPath}`);
        }
      }
    }
  }
}

walkDir('src');
