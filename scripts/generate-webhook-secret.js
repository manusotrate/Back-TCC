const crypto = require('crypto');

function generateSecret(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64');
}

if (require.main === module) {
  const secret = generateSecret();
  console.log('# WEBHOOK_SECRET (base64)');
  console.log(secret);
  console.log('\n# Command to set in PowerShell (local, do not commit):');
  console.log(`$env:WEBHOOK_SECRET = "${secret}"`);
  console.log('\n# Or append to .env (only for local dev, DO NOT commit):');
  console.log(`echo WEBHOOK_SECRET=${secret} >> .env`);
}

module.exports = generateSecret;
