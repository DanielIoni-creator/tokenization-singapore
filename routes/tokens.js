import express from 'express';
import { getTokenBalances } from '../controllers/tokenController.js';

const router = express.Router();

/**
 * GET /api/tokens/balance/:walletAddress
 * Resolves Issue #1 ([BOUNTY] GET /api/tokens/balance/:walletAddress with USD Pricing - 0.05 XMR)
 */
router.get('/balance/:walletAddress', getTokenBalances);

export default router;
