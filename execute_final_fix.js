
const { execSync } = require('child_process');

try {
  const output = execSync('node final_country_fix.js', { encoding: 'utf8' });
  console.log(output);
  
  // Verify the fix worked
  const fs = require('fs');
  const content = fs.readFileSync('src/data/gameCountries.ts', 'utf8');
  const countryMatches = content.match(/{\s*id:\s*"[^"]+",[\s\S]*?}/g) || [];
  
  console.log(`\nFile now contains ${countryMatches.length} countries`);
  
  // Check for duplicates
  const ids = new Set();
  const duplicates = [];
  countryMatches.forEach(match => {
    const idMatch = match.match(/id:\s*"([^"]+)"/);
    if (idMatch) {
      const id = idMatch[1];
      if (ids.has(id)) {
        duplicates.push(id);
      } else {
        ids.add(id);
      }
    }
  });
  
  console.log(`Duplicates found: ${duplicates.length > 0 ? duplicates.join(', ') : 'None'}`);
  console.log(`Final status: ${ids.size === 195 && duplicates.length === 0 ? 'SUCCESS - 195 unique countries' : 'NEEDS FIXING'}`);
  
} catch (error) {
  console.error('Error:', error.message);
}
