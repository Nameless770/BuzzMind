const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; //level of hashing complexity

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (stored.startsWith('$2')) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

module.exports = { hashPassword, verifyPassword };
