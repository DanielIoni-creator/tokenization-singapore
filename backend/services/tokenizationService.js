const crypto = require('crypto');

const DEFAULT_CURRENCY = 'SGD';
const REGISTRY_AUTHORITIES = [
  'SLA_INLIS',
  'SLA_LAND_TITLES_REGISTRY',
  'ONEMAP_LAND_QUERY',
  'MANUAL_LEGAL_REVIEW'
];

const PROPERTY_TYPES = ['residential', 'commercial', 'mixed', 'industrial'];
const OFFERING_TYPES = [
  'private-placement',
  'accredited-investors',
  'institutional',
  'sandbox'
];

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

function cleanString(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function asPositiveNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${field} must be a positive number`);
  }

  return parsed;
}

function asNonNegativeNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }

  return parsed;
}

function asPositiveInteger(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }

  return parsed;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value) {
  return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
}

function normalizeAddress(address = {}) {
  const street = cleanString(address.street);
  const postalCode = cleanString(address.postalCode);

  if (!street) {
    throw new Error('propertyDetails.address.street is required');
  }

  if (!/^\d{6}$/.test(postalCode)) {
    throw new Error('propertyDetails.address.postalCode must be a Singapore 6-digit postal code');
  }

  return {
    street,
    postalCode,
    buildingName: cleanString(address.buildingName),
    unitNumber: cleanString(address.unitNumber),
    city: cleanString(address.city) || 'Singapore',
    country: cleanString(address.country) || 'Singapore'
  };
}

function normalizeRegistryReference(registry = {}, address = {}) {
  const authority = cleanString(registry.authority) || 'SLA_INLIS';
  if (!REGISTRY_AUTHORITIES.includes(authority)) {
    throw new Error(`registry.authority must be one of: ${REGISTRY_AUTHORITIES.join(', ')}`);
  }

  const titleNumber = cleanString(registry.titleNumber);
  const lotNumber = cleanString(registry.lotNumber);
  const strataLotNumber = cleanString(registry.strataLotNumber);

  if (!titleNumber && !lotNumber && !strataLotNumber) {
    throw new Error('registry.titleNumber, registry.lotNumber, or registry.strataLotNumber is required');
  }

  const canonical = {
    authority,
    titleNumber,
    lotNumber,
    strataLotNumber,
    postalCode: cleanString(address.postalCode || registry.postalCode),
    street: cleanString(address.street || registry.street)
  };

  return {
    authority,
    sourceUrl: cleanString(registry.sourceUrl) || 'https://app.sla.gov.sg/inlis/',
    titleNumber,
    lotNumber,
    strataLotNumber,
    referenceDate: registry.referenceDate ? new Date(registry.referenceDate) : null,
    verificationStatus: cleanString(registry.verificationStatus) || 'pending-verification',
    registryFingerprint: registry.registryFingerprint || fingerprint(canonical),
    notes: cleanString(registry.notes)
  };
}

function calculateFractionalization(input = {}) {
  const valuation = asPositiveNumber(input.valuation, 'valuation');
  const totalSupply = asPositiveInteger(input.totalSupply || input.totalShares, 'totalSupply');
  const currency = cleanString(input.currency) || DEFAULT_CURRENCY;
  const issuerReservePercent = asNonNegativeNumber(input.issuerReservePercent || 0, 'issuerReservePercent');

  if (issuerReservePercent >= 100) {
    throw new Error('issuerReservePercent must be less than 100');
  }

  const minimumInvestment = input.minimumInvestment === undefined
    ? null
    : asNonNegativeNumber(input.minimumInvestment, 'minimumInvestment');
  const tokenDecimals = input.tokenDecimals === undefined
    ? 0
    : asNonNegativeNumber(input.tokenDecimals, 'tokenDecimals');

  const tokenPrice = roundMoney(valuation / totalSupply);
  const issuerReservedTokens = Math.floor(totalSupply * issuerReservePercent / 100);
  const investorAvailableTokens = totalSupply - issuerReservedTokens;
  const minimumTokens = minimumInvestment
    ? Math.max(1, Math.ceil(minimumInvestment / tokenPrice))
    : 1;

  return {
    valuation: roundMoney(valuation),
    currency,
    totalShares: totalSupply,
    tokenDecimals,
    tokenPrice,
    ownershipPerTokenPercent: roundPercent(100 / totalSupply),
    issuerReservePercent: roundPercent(issuerReservePercent),
    issuerReservedTokens,
    investorAvailableTokens,
    investorAvailableRaise: roundMoney(investorAvailableTokens * tokenPrice),
    minimumInvestment: minimumInvestment === null ? tokenPrice : roundMoney(minimumInvestment),
    minimumTokens,
    distributionStatus: cleanString(input.distributionStatus) || 'modeling'
  };
}

function normalizeCompliance(compliance = {}) {
  const offeringType = cleanString(compliance.offeringType) || 'private-placement';
  if (!OFFERING_TYPES.includes(offeringType)) {
    throw new Error(`compliance.offeringType must be one of: ${OFFERING_TYPES.join(', ')}`);
  }

  const transferRestrictions = Array.isArray(compliance.transferRestrictions)
    ? compliance.transferRestrictions.map(cleanString).filter(Boolean)
    : [
        'Singapore securities-law review required before any public offer',
        'Investor eligibility must be checked before token allocation',
        'Property title evidence must be verified before activation'
      ];

  return {
    jurisdiction: cleanString(compliance.jurisdiction) || 'Singapore',
    offeringType,
    requiresAccreditedInvestor: compliance.requiresAccreditedInvestor !== false,
    transferRestrictions,
    riskDisclosure: cleanString(compliance.riskDisclosure)
      || 'Tokenized real estate may be illiquid and subject to legal, market, and regulatory risk.'
  };
}

function buildRealEstateTokenModel(input = {}) {
  const propertyDetails = input.propertyDetails || {};
  const address = normalizeAddress(propertyDetails.address || input.address || {});
  const propertyType = cleanString(propertyDetails.propertyType || input.propertyType);

  if (!PROPERTY_TYPES.includes(propertyType)) {
    throw new Error(`propertyDetails.propertyType must be one of: ${PROPERTY_TYPES.join(', ')}`);
  }

  const valuation = asPositiveNumber(propertyDetails.valuation || input.valuation, 'propertyDetails.valuation');
  const totalSupply = asPositiveInteger(input.totalSupply || input.fractionalization?.totalShares, 'totalSupply');
  const fractionalization = calculateFractionalization({
    ...(input.fractionalization || {}),
    valuation,
    totalSupply,
    currency: propertyDetails.valuationCurrency || input.currency || input.fractionalization?.currency
  });
  const registry = normalizeRegistryReference(input.registry || input.singaporeRegistry || {}, address);

  return {
    name: cleanString(input.name),
    symbol: cleanString(input.symbol).toUpperCase(),
    description: cleanString(input.description),
    type: 'real-estate',
    propertyDetails: {
      address,
      propertyType,
      size: propertyDetails.size ? asPositiveNumber(propertyDetails.size, 'propertyDetails.size') : undefined,
      landArea: propertyDetails.landArea ? asPositiveNumber(propertyDetails.landArea, 'propertyDetails.landArea') : undefined,
      grossFloorArea: propertyDetails.grossFloorArea
        ? asPositiveNumber(propertyDetails.grossFloorArea, 'propertyDetails.grossFloorArea')
        : undefined,
      valuation: fractionalization.valuation,
      valuationCurrency: fractionalization.currency,
      valuationDate: propertyDetails.valuationDate ? new Date(propertyDetails.valuationDate) : null,
      valuerName: cleanString(propertyDetails.valuerName),
      rentalYield: propertyDetails.rentalYield
        ? asNonNegativeNumber(propertyDetails.rentalYield, 'propertyDetails.rentalYield')
        : undefined,
      tenure: cleanString(propertyDetails.tenure),
      planningRegion: cleanString(propertyDetails.planningRegion),
      district: cleanString(propertyDetails.district)
    },
    registry,
    fractionalization,
    totalSupply,
    tokenPrice: fractionalization.tokenPrice,
    spv: {
      name: cleanString(input.spv?.name),
      registration: cleanString(input.spv?.registration || input.spv?.uen),
      uen: cleanString(input.spv?.uen || input.spv?.registration),
      entityType: cleanString(input.spv?.entityType),
      address: cleanString(input.spv?.address)
    },
    compliance: normalizeCompliance(input.compliance),
    status: cleanString(input.status) || 'pending-approval'
  };
}

function verifyRegistryEvidence(reference = {}, evidence = {}) {
  const providedFingerprint = cleanString(
    evidence.registryFingerprint || evidence.fingerprint || evidence.hash
  );
  const expectedFingerprint = cleanString(reference.registryFingerprint);
  const hasEvidence = Boolean(providedFingerprint && expectedFingerprint);
  const isVerified = hasEvidence && providedFingerprint === expectedFingerprint;

  return {
    verificationStatus: isVerified ? 'verified' : 'rejected',
    checkedAt: new Date(),
    expectedFingerprint,
    providedFingerprint,
    authority: cleanString(reference.authority),
    sourceUrl: cleanString(reference.sourceUrl),
    reason: isVerified
      ? 'Registry evidence fingerprint matches the stored Singapore registry reference.'
      : 'Registry evidence fingerprint does not match the stored Singapore registry reference.'
  };
}

module.exports = {
  REGISTRY_AUTHORITIES,
  PROPERTY_TYPES,
  OFFERING_TYPES,
  buildRealEstateTokenModel,
  calculateFractionalization,
  normalizeRegistryReference,
  verifyRegistryEvidence
};
