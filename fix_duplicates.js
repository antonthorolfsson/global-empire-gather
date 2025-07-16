const fs = require('fs');

// Read the current file
const content = fs.readFileSync('src/data/gameCountries.ts', 'utf8');

// Extract the array part
const arrayStart = content.indexOf('export const GAME_COUNTRIES: CountryData[] = [');
const arrayEnd = content.lastIndexOf('];');
const beforeArray = content.substring(0, arrayStart);
const afterArray = content.substring(arrayEnd + 2);

// Get all country objects
const arrayContent = content.substring(arrayStart, arrayEnd + 2);
const countryObjects = [];
let braceCount = 0;
let currentObject = '';
let inObject = false;

for (let i = 0; i < arrayContent.length; i++) {
  const char = arrayContent[i];
  
  if (char === '{') {
    if (!inObject) {
      inObject = true;
      currentObject = '';
    }
    braceCount++;
  }
  
  if (inObject) {
    currentObject += char;
  }
  
  if (char === '}') {
    braceCount--;
    if (braceCount === 0 && inObject) {
      countryObjects.push(currentObject);
      inObject = false;
      currentObject = '';
    }
  }
}

// Extract IDs and deduplicate
const seen = new Set();
const uniqueCountries = [];

countryObjects.forEach(obj => {
  const idMatch = obj.match(/id:\s*"([^"]+)"/);
  if (idMatch) {
    const id = idMatch[1];
    if (!seen.has(id)) {
      seen.add(id);
      uniqueCountries.push(obj);
    }
  }
});

// Rebuild the file
const newContent = beforeArray + 
  'export const GAME_COUNTRIES: CountryData[] = [\n  ' + 
  uniqueCountries.join(',\n  ') + 
  '\n];' + afterArray;

fs.writeFileSync('src/data/gameCountries.ts', newContent);
console.log(`Fixed duplicates. Now have ${uniqueCountries.length} unique countries.`);