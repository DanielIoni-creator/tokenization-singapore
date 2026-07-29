const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Routes
router.get('/', authenticate, tokenController.getAllTokens);
router.post('/fractionalize', authenticate, isAdmin, tokenController.previewFractionalization);
router.post('/real-estate', authenticate, isAdmin, tokenController.createRealEstateTokenization);
router.post('/:id/registry/verify', authenticate, isAdmin, tokenController.verifySingaporeRegistryReference);
router.get('/:id', authenticate, tokenController.getTokenById);

module.exports = router;
