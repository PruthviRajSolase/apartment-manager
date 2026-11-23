const crypto = require('crypto');

function generateTempPassword() {
  // 10 hex characters — fixed length, no characters that get lost when read aloud.
  return crypto.randomBytes(8).toString('hex').slice(0, 10);
}

module.exports = generateTempPassword;
