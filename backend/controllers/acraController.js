const Joi = require('joi');
const Token = require('../models/Token');
const {
  isValidUen,
  lookupAcraEntity,
  normalizeUen,
  verifyLegalIdentity
} = require('../services/acraService');

const acraEvidenceSchema = Joi.object({
  uen: Joi.string().trim().required(),
  entityName: Joi.string().trim().allow(''),
  record: Joi.object().unknown(true)
});

const entityAuthSchema = Joi.object({
  uen: Joi.string().trim().required(),
  entityName: Joi.string().trim().required(),
  record: Joi.object().unknown(true)
});

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

exports.lookupEntity = async (req, res, next) => {
  try {
    const { error, value } = validateBody(acraEvidenceSchema, req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    if (!isValidUen(value.uen)) {
      return res.status(400).json({
        success: false,
        message: 'A valid Singapore UEN is required'
      });
    }

    const entity = await lookupAcraEntity({
      uen: value.uen,
      record: value.record
    });

    res.json({
      success: true,
      data: entity
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyTokenSpv = async (req, res, next) => {
  try {
    const { error, value } = validateBody(acraEvidenceSchema, req.body);
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

    const expectedUen = normalizeUen(token.spv?.uen || token.spv?.registration || value.uen);
    const expectedName = token.spv?.name || value.entityName;
    const entity = await lookupAcraEntity({
      uen: value.uen || expectedUen,
      record: value.record
    });
    const verification = verifyLegalIdentity({
      expectedUen,
      expectedName,
      entity
    });

    if (!token.spv) {
      token.spv = {};
    }

    token.spv.uen = expectedUen;
    token.spv.registration = token.spv.registration || expectedUen;
    token.spv.acra = {
      entityName: verification.entity.entityName,
      entityStatus: verification.entity.entityStatus,
      entityType: verification.entity.entityType,
      registrationDate: verification.entity.registrationDate,
      postalCode: verification.entity.postalCode,
      registeredAddress: verification.entity.registeredAddress,
      source: verification.entity.source,
      sourceUrl: verification.entity.sourceUrl,
      fingerprint: verification.entity.fingerprint,
      verificationStatus: verification.verificationStatus,
      checkedAt: verification.checkedAt,
      reason: verification.reason
    };
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

exports.verifyAuthenticatedEntity = async (req, res, next) => {
  try {
    const { error, value } = validateBody(entityAuthSchema, req.body);
    if (error) {
      return sendValidationError(res, error);
    }

    const entity = await lookupAcraEntity({
      uen: value.uen,
      record: value.record
    });
    const verification = verifyLegalIdentity({
      expectedUen: value.uen,
      expectedName: value.entityName,
      entity
    });

    req.user.legalIdentity = {
      authProvider: 'acra',
      uen: verification.entity.uen,
      entityName: verification.entity.entityName,
      entityStatus: verification.entity.entityStatus,
      entityType: verification.entity.entityType,
      verificationStatus: verification.verificationStatus,
      verifiedAt: verification.verificationStatus === 'verified' ? verification.checkedAt : null,
      source: verification.entity.source,
      sourceUrl: verification.entity.sourceUrl,
      fingerprint: verification.entity.fingerprint,
      reason: verification.reason
    };
    await req.user.save();

    res.json({
      success: verification.verificationStatus === 'verified',
      data: {
        user: req.user,
        verification
      }
    });
  } catch (error) {
    next(error);
  }
};
