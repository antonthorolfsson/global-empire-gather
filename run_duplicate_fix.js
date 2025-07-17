
const { execSync } = require('child_process');

try {
  console.log('Running duplicate removal...');
  const output = execSync('node fix_duplicates.js', { encoding: 'utf8' });
  console.log(output);
  console.log('\nDuplicate removal completed! The game should now show 195 total countries.');
} catch (error) {
  console.error('Error running duplicate fix:', error.message);
}
