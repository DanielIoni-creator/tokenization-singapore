// scripts/createAdmin.js
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
  try {
    // Verifica che MONGODB_URI sia definito
    if (!process.env.MONGODB_URI) {
      console.error('❌ ERRORE: MONGODB_URI non definito nel file .env');
      console.log('📝 Assicurati che il file .env contenga:');
      console.log('   MONGODB_URI=mongodb://localhost:27017/tokenization-singapore');
      process.exit(1);
    }

    console.log(`📡 Connessione a MongoDB: ${process.env.MONGODB_URI}`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    const adminData = {
      username: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@myzubster.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@2024',
      fullName: 'Administrator',
      role: 'superadmin',
      isVerified: true,
      isActive: true,
      isAccredited: true
    };

    // Verifica se esiste già
    const existing = await User.findOne({ 
      $or: [{ email: adminData.email }, { username: adminData.username }] 
    });

    if (existing) {
      console.log('⚠️ Admin già esistente:', existing.email);
      process.exit(0);
    }

    const admin = new User(adminData);
    await admin.save();

    console.log('\n✅ Admin creato con successo!');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Password: ${adminData.password}`);
    console.log(`👤 Username: ${adminData.username}`);

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
