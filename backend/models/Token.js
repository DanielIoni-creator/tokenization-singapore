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
      buildingName: String,
      unitNumber: String,
      city: { type: String, default: 'Singapore' },
      country: { type: String, default: 'Singapore' }
    },
    propertyType: {
      type: String,
      enum: ['residential', 'commercial', 'mixed', 'industrial']
    },
    size: Number,
    landArea: Number,
    grossFloorArea: Number,
    valuation: Number,
    valuationCurrency: { type: String, default: 'SGD' },
    valuationDate: Date,
    valuerName: String,
    rentalYield: Number,
    tenure: String,
    planningRegion: String,
    district: String
  },
  registry: {
    authority: {
      type: String,
      enum: ['SLA_INLIS', 'SLA_LAND_TITLES_REGISTRY', 'ONEMAP_LAND_QUERY', 'MANUAL_LEGAL_REVIEW'],
      default: 'SLA_INLIS'
    },
    sourceUrl: {
      type: String,
      default: 'https://app.sla.gov.sg/inlis/'
    },
    titleNumber: String,
    lotNumber: String,
    strataLotNumber: String,
    referenceDate: Date,
    verificationStatus: {
      type: String,
      enum: ['pending-verification', 'verified', 'rejected', 'expired'],
      default: 'pending-verification'
    },
    registryFingerprint: {
      type: String,
      index: true
    },
    checkedAt: Date,
    notes: String
  },
  fractionalization: {
    valuation: Number,
    currency: { type: String, default: 'SGD' },
    totalShares: Number,
    tokenDecimals: { type: Number, default: 0 },
    tokenPrice: Number,
    ownershipPerTokenPercent: Number,
    issuerReservePercent: { type: Number, default: 0 },
    issuerReservedTokens: { type: Number, default: 0 },
    investorAvailableTokens: Number,
    investorAvailableRaise: Number,
    minimumInvestment: Number,
    minimumTokens: Number,
    distributionStatus: {
      type: String,
      enum: ['modeling', 'open', 'closed'],
      default: 'modeling'
    }
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
    uen: String,
    entityType: String,
    address: String,
    acra: {
      entityName: String,
      entityStatus: String,
      entityType: String,
      registrationDate: String,
      postalCode: String,
      registeredAddress: String,
      source: String,
      sourceUrl: String,
      fingerprint: {
        type: String,
        index: true
      },
      verificationStatus: {
        type: String,
        enum: ['pending-verification', 'verified', 'rejected', 'manual-review'],
        default: 'pending-verification'
      },
      checkedAt: Date,
      reason: String
    }
  },
  compliance: {
    jurisdiction: { type: String, default: 'Singapore' },
    offeringType: {
      type: String,
      enum: ['private-placement', 'accredited-investors', 'institutional', 'sandbox'],
      default: 'private-placement'
    },
    requiresAccreditedInvestor: { type: Boolean, default: true },
    transferRestrictions: [String],
    riskDisclosure: String
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

tokenSchema.index({ type: 1, status: 1 });
tokenSchema.index({ 'propertyDetails.address.postalCode': 1 });

module.exports = mongoose.model('Token', tokenSchema);
