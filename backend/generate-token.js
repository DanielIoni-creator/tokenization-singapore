const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tokenization')
  .then(async () => {
    const user = await User.findOne({ username: 'testuser' });
    if (!user) {
      console.error('❌ Utente non trovato');
      process.exit(1);
    }

    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(
      { id: user._id, username: user.username },
      secret,
      { expiresIn: '1h' }
    );
    console.log('TOKEN=' + token);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Errore:', err);
    process.exit(1);
  });
