const express = require('express');
const router = express.Router();
const acraController = require('../controllers/acraController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.post('/lookup', authenticate, isAdmin, acraController.lookupEntity);
router.post('/tokens/:id/verify-spv', authenticate, isAdmin, acraController.verifyTokenSpv);
router.post('/auth/verify-entity', authenticate, acraController.verifyAuthenticatedEntity);

module.exports = router;
