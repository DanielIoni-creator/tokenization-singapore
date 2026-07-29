const assert = require('assert/strict');
const {
  buildRealEstateTokenModel,
  calculateFractionalization,
  verifyRegistryEvidence
} = require('../services/tokenizationService');

const sampleToken = buildRealEstateTokenModel({
  name: 'Marina Bay Fractional Tower',
  symbol: 'MBFT',
  description: 'Fractionalized Singapore commercial property model',
  totalSupply: 10000,
  propertyDetails: {
    address: {
      street: '10 Marina Boulevard',
      postalCode: '018983',
      buildingName: 'Marina Bay Financial Centre'
    },
    propertyType: 'commercial',
    size: 1200,
    valuation: 10000000,
    valuationCurrency: 'SGD',
    rentalYield: 4.2,
    tenure: '99-year leasehold',
    planningRegion: 'Central Region',
    district: '01'
  },
  registry: {
    authority: 'SLA_INLIS',
    titleNumber: 'MK01-12345A',
    lotNumber: 'TS01-99999X'
  },
  fractionalization: {
    issuerReservePercent: 10,
    minimumInvestment: 5000
  },
  spv: {
    name: 'MBFT Holdings Pte. Ltd.',
    uen: '202400001A',
    entityType: 'Private Company Limited by Shares'
  }
});

assert.equal(sampleToken.type, 'real-estate');
assert.equal(sampleToken.tokenPrice, 1000);
assert.equal(sampleToken.fractionalization.investorAvailableTokens, 9000);
assert.equal(sampleToken.fractionalization.minimumTokens, 5);
assert.equal(sampleToken.registry.registryFingerprint.length, 64);
assert.equal(sampleToken.propertyDetails.address.country, 'Singapore');
assert.equal(sampleToken.compliance.requiresAccreditedInvestor, true);

const samePreview = calculateFractionalization({
  valuation: 10000000,
  totalSupply: 10000,
  issuerReservePercent: 10,
  minimumInvestment: 5000
});

assert.deepEqual(samePreview, sampleToken.fractionalization);

const verification = verifyRegistryEvidence(sampleToken.registry, {
  registryFingerprint: sampleToken.registry.registryFingerprint
});

assert.equal(verification.verificationStatus, 'verified');

assert.throws(() => buildRealEstateTokenModel({
  ...sampleToken,
  propertyDetails: {
    ...sampleToken.propertyDetails,
    address: {
      street: '10 Marina Boulevard',
      postalCode: 'ABC123'
    }
  }
}), /6-digit postal code/);

console.log('Singapore real-estate tokenization validation passed');
