// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  fullName: { type: String, trim: true },
  phone: { type: String },
  country: { type: String },
  city: { type: String },
  bio: { type: String, maxlength: 500 },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationExpires: { type: Date },
  moneroAddress: { type: String },
  ethereumAddress: { type: String },
  // CAMPO LANGUAGE AGGIUNTO
  language: {
    type: String,
    enum: ['en', 'zh', 'ms', 'ta'],
    default: 'en'
  },
  role: {
    type: String,
    enum: ['user', 'investor', 'seller', 'admin', 'superadmin'],
    default: 'user'
  },
  isAccredited: { type: Boolean, default: false },
  accreditationDocuments: [{
    type: { type: String },
    url: { type: String },
    verified: { type: Boolean, default: false }
  }],
  stats: {
    totalInvestments: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalReturns: { type: Number, default: 0 },
    portfolio: [{
      tokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
      amount: { type: Number },
      averagePrice: { type: Number },
      currentValue: { type: Number },
      returns: { type: Number }
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual
userSchema.virtual('isInvestor').get(function() {
  return this.role === 'investor' || this.role === 'admin' || this.role === 'superadmin';
});

// Pre-save middleware - Hash password (versione corretta)
userSchema.pre('save', function(next) {
  const user = this;
  
  if (!user.isModified('password')) {
    return next();
  }
  
  bcrypt.genSalt(12, function(err, salt) {
    if (err) {
      return next(err);
    }
    
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
