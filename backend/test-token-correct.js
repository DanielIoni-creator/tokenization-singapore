const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error('❌ JWT_SECRET non trovato in .env');
  process.exit(1);
}

console.log('🔑 Usando secret:', secret.substring(0, 10) + '...');

const token = jwt.sign(
  { 
    id: 'test-user-123', 
    username: 'testuser',
    email: 'test@example.com'
  },
  secret,
  { expiresIn: '1h' }
);

console.log('\n🔑 Token di test:');
console.log(token);
console.log('\n📋 Usa questo token:');
console.log(`Authorization: Bearer ${token}`);
