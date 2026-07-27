// models/Token.js
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['real-estate', 'equity', 'commodity', 'debt'],
    default: 'real-estate'
  },
  propertyDetails: {
    address: {
      street: String,
      postalCode: String,
      city: { type: String, default: 'Singapore' },
      country: { type: String, default: 'Singapore' }
    },
    propertyType: {
      type: String,
      enum: ['residential', 'commercial', 'mixed', 'industrial']
    },
    size: Number,
    valuation: Number,
    rentalYield: Number
  },
  contractAddress: {
    type: String,
    default: '0x' + '0'.repeat(40)
  },
  totalSupply: { type: Number, required: true },
  tokenPrice: { type: Number, required: true },
  spv: {
    name: String,
    registration: String,
    address: String
  },
  status: {
    type: String,
    enum: ['draft', 'pending-approval', 'active', 'paused', 'closed'],
    default: 'draft'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Token', tokenSchema);
