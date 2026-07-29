// controllers/tokenController.js
const Joi = require('joi');
const Token = require('../models/Token');
const {
  buildRealEstateTokenModel,
  calculateFractionalization,
  verifyRegistryEvidence,
  REGISTRY_AUTHORITIES,
  PROPERTY_TYPES,
  OFFERING_TYPES
} = require('../services/tokenizationService');

const addressSchema = Joi.object({
  street: Joi.string().trim().required(),
  postalCode: Joi.string().pattern(/^\d{6}$/).required(),
  buildingName: Joi.string().trim().allow(''),
  unitNumber: Joi.string().trim().allow(''),
  city: Joi.string().trim().default('Singapore'),
  country: Joi.string().trim().default('Singapore')
});

const registrySchema = Joi.object({
  authority: Joi.string().valid(...REGISTRY_AUTHORITIES).default('SLA_INLIS'),
  sourceUrl: Joi.string().uri().allow(''),
  titleNumber: Joi.string().trim().min(1),
  lotNumber: Joi.string().trim().min(1),
  strataLotNumber: Joi.string().trim().min(1),
  referenceDate: Joi.date().allow(null),
  verificationStatus: Joi.string().valid('pending-verification', 'verified', 'rejected', 'expired'),
  registryFingerprint: Joi.string().hex().length(64).allow(''),
  notes: Joi.string().trim().allow('')
}).or('titleNumber', 'lotNumber', 'strataLotNumber');

const fractionalizationSchema = Joi.object({
  totalShares: Joi.number().integer().positive(),
  tokenDecimals: Joi.number().integer().min(0).max(18),
  currency: Joi.string().trim().uppercase().length(3).default('SGD'),
  issuerReservePercent: Joi.number().min(0).less(100).default(0),
  minimumInvestment: Joi.number().min(0),
  distributionStatus: Joi.string().valid('modeling', 'open', 'closed')
});

const complianceSchema = Joi.object({
  jurisdiction: Joi.string().trim().default('Singapore'),
  offeringType: Joi.string().valid(...OFFERING_TYPES).default('private-placement'),
  requiresAccreditedInvestor: Joi.boolean().default(true),
  transferRestrictions: Joi.array().items(Joi.string().trim()),
  riskDisclosure: Joi.string().trim().allow('')
});

const realEstateTokenSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  symbol: Joi.string().trim().alphanum().min(2).max(12).required(),
  description: Joi.string().trim().allow(''),
  totalSupply: Joi.number().integer().positive().required(),
  status: Joi.string().valid('draft', 'pending-approval', 'active', 'paused', 'closed'),
  propertyDetails: Joi.object({
    address: addressSchema.required(),
    propertyType: Joi.string().valid(...PROPERTY_TYPES).required(),
    size: Joi.number().positive(),
    landArea: Joi.number().positive(),
    grossFloorArea: Joi.number().positive(),
    valuation: Joi.number().positive().required(),
    valuationCurrency: Joi.string().trim().uppercase().length(3).default('SGD'),
    valuationDate: Joi.date().allow(null),
    valuerName: Joi.string().trim().allow(''),
    rentalYield: Joi.number().min(0),
    tenure: Joi.string().trim().allow(''),
    planningRegion: Joi.string().trim().allow(''),
    district: Joi.string().trim().allow('')
  }).required(),
  registry: registrySchema.required(),
  fractionalization: fractionalizationSchema.default({}),
  spv: Joi.object({
    name: Joi.string().trim().allow(''),
    registration: Joi.string().trim().allow(''),
    uen: Joi.string().trim().allow(''),
    entityType: Joi.string().trim().allow(''),
    address: Joi.string().trim().allow('')
  }).default({}),
  compliance: complianceSchema.default({})
});

const fractionPreviewSchema = Joi.object({
  valuation: Joi.number().positive().required(),
  totalSupply: Joi.number().integer().positive().required(),
  currency: Joi.string().trim().uppercase().length(3).default('SGD'),
  issuerReservePercent: Joi.number().min(0).less(100).default(0),
  minimumInvestment: Joi.number().min(0),
  tokenDecimals: Joi.number().integer().min(0).max(18),
  distributionStatus: Joi.string().valid('modeling', 'open', 'closed')
});

const registryEvidenceSchema = Joi.object({
  registryFingerprint: Joi.string().hex().length(64),
  fingerprint: Joi.string().hex().length(64),
  hash: Joi.string().hex().length(64),
  checkedBy: Joi.string().trim().allow(''),
  notes: Joi.string().trim().allow('')
}).or('registryFingerprint', 'fingerprint', 'hash');

function validateBody(schema, body) {
  return schema.validate(body, {
    abortEarly: false,
    stripUnknown: true
  });
}

function sendValidationError(res, error) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: error.details.map((detail) => detail.message)
  });
}

exports.getAllTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

exports.previewFractionalization = async (req, res, next) => {
  try {
    const { error, value } = validateBody(fractionPreviewSchema, req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    res.json({
      success: true,
      data: calculateFractionalization(value)
    });
  } catch (error) {
    next(error);
  }
};

exports.createRealEstateTokenization = async (req, res, next) => {
  try {
    const { error, value } = validateBody(realEstateTokenSchema, req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    const tokenData = buildRealEstateTokenModel(value);
    const existingToken = await Token.findOne({ symbol: tokenData.symbol });

    if (existingToken) {
      return res.status(409).json({
        success: false,
        message: req.t ? req.t('tokens.create.symbol_exists') : 'Token symbol already exists'
      });
    }

    const token = await Token.create(tokenData);

    res.status(201).json({
      success: true,
      message: req.t ? req.t('tokens.create.success') : 'Token created successfully',
      data: token,
      tokenization: tokenData.fractionalization
    });
  } catch (error) {
    next(error);
  }
};

exports.verifySingaporeRegistryReference = async (req, res, next) => {
  try {
    const { error, value } = validateBody(registryEvidenceSchema, req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: req.t ? req.t('tokens.deploy.not_found') : 'Token not found'
      });
    }

    const verification = verifyRegistryEvidence(token.registry || {}, value);
    token.registry.verificationStatus = verification.verificationStatus;
    token.registry.checkedAt = verification.checkedAt;
    token.registry.notes = value.notes || verification.reason;
    await token.save();

    res.json({
      success: verification.verificationStatus === 'verified',
      data: {
        token,
        verification
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: req.t('tokens.deploy.not_found')
      });
    }
    res.json({
      success: true,
      data: token
    });
  } catch (error) {
    next(error);
  }
};
