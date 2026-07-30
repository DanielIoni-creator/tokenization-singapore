const assert = require('assert/strict');
const {
  buildRealEstateTokenModel,
  calculateFractionalization,
  verifyRegistryEvidence
} = require('../services/tokenizationService');
const {
  buildAcraRequestUrl,
  isValidUen,
  lookupAcraEntity,
  normalizeUen,
  verifyLegalIdentity
} = require('../services/acraService');

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
assert.equal(normalizeUen(' 2024-00001a '), '202400001A');
assert.equal(isValidUen('202400001A'), true);
assert.equal(
  buildAcraRequestUrl('202400001A', {
    ACRA_API_URL_TEMPLATE: 'https://example.test/entities/{uen}'
  }),
  'https://example.test/entities/202400001A'
);

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

(async () => {
  const acraEntity = await lookupAcraEntity({
    uen: '202400001A',
    record: {
      uen: '202400001A',
      entity_name: 'MBFT Holdings Pte. Ltd.',
      entity_status: 'LIVE COMPANY',
      entity_type: 'Private Company Limited by Shares',
      registration_date: '2024-01-02',
      postal_code: '018983',
      registered_address: '10 Marina Boulevard, Singapore 018983'
    }
  });

  const identityVerification = verifyLegalIdentity({
    expectedUen: '202400001A',
    expectedName: 'MBFT Holdings Pte. Ltd.',
    entity: acraEntity
  });

  assert.equal(acraEntity.fingerprint.length, 64);
  assert.equal(identityVerification.verificationStatus, 'verified');

  const rejectedVerification = verifyLegalIdentity({
    expectedUen: '202400001A',
    expectedName: 'Different SPV Pte. Ltd.',
    entity: acraEntity
  });

  assert.equal(rejectedVerification.verificationStatus, 'rejected');
  console.log('Singapore real-estate tokenization validation passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
