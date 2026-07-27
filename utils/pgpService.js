const crypto = require('crypto');

class PGPService {
  constructor() {
    this.secretKey = process.env.PGP_SECRET_KEY || '0123456789abcdef0123456789abcdef';
  }

  encryptData(plaintext) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.secretKey.slice(0, 32)), iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v4.10.1\n\n${iv.toString('hex')}:${encrypted}\n-----END PGP MESSAGE-----`;
  }

  decryptData(armoredPgp) {
    if (!armoredPgp.includes('BEGIN PGP MESSAGE')) return armoredPgp;
    const lines = armoredPgp.split('\n');
    const body = lines[3];
    const [ivHex, encryptedHex] = body.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.secretKey.slice(0, 32)), Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

module.exports = new PGPService();
