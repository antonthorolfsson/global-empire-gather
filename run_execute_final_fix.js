
const { execSync } = require('child_process');

try {
  console.log('Running final country fix...');
  const output = execSync('node execute_final_fix.js', { encoding: 'utf8' });
  console.log(output);
  console.log('\nCountry fix completed! The game should now show the correct totals.');
} catch (error) {
  console.error('Error running fix:', error.message);
}
