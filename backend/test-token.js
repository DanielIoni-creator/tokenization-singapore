const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'myzubster-test-secret-2026';

// Crea un token di test per un utente esistente
const token = jwt.sign(
  { 
    id: 'test-user-123', 
    username: 'testuser',
    email: 'test@example.com'
  },
  secret,
  { expiresIn: '1h' }
);

console.log('🔑 Token di test:');
console.log(token);
console.log('\n📋 Usa questo token per le richieste autenticate:');
console.log(`Authorization: Bearer ${token}`);
