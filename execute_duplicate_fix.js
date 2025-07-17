
const { execSync } = require('child_process');

try {
  console.log('Starting duplicate country fix...');
  const output = execSync('node run_duplicate_fix.js', { encoding: 'utf8' });
  console.log(output);
  
  // Verify the fix worked
  const fs = require('fs');
  const content = fs.readFileSync('src/data/gameCountries.ts', 'utf8');
  const countryMatches = content.match(/{\s*id:\s*"[^"]+",[\s\S]*?}/g) || [];
  
  console.log(`\nVerification: File now contains ${countryMatches.length} countries`);
  
  // Check for any remaining duplicates
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
  
  console.log(`Duplicates remaining: ${duplicates.length > 0 ? duplicates.join(', ') : 'None'}`);
  console.log(`Final status: ${ids.size === 195 && duplicates.length === 0 ? 'SUCCESS - 195 unique countries' : 'NEEDS REVIEW'}`);
  
} catch (error) {
  console.error('Error during duplicate fix:', error.message);
}
