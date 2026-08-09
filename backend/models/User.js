const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String
  },
  country: {
    type: String
  },
  city: {
    type: String
  },
  bio: {
    type: String,
    maxlength: 500
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationExpires: {
    type: Date
  },
  moneroAddress: {
    type: String
  },
  ethereumAddress: {
    type: String
  },
  roles: [{
    type: String,
    enum: ['user', 'admin', 'investor', 'developer'],
    default: 'user'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
