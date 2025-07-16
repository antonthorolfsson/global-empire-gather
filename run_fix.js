const { execSync } = require('child_process');

try {
  const output = execSync('node remove_duplicates.js', { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error('Error:', error.message);
}