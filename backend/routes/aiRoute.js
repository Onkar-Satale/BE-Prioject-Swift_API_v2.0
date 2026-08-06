import express from 'express';
import { botValidator, analyzeValidator } from '../validators/aiValidator.js';
import { botHandler, analyzeHandler } from '../controllers/aiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { aiRateLimiter } from '../middlewares/rateLimiterMiddleware.js';

/**
 * AI Service Routes (/api/ai)
 * Requires JWT authentication and applies AI-specific rate limiting.
 */
const router = express.Router();

router.use(authMiddleware);

// AI Chatbot interaction endpoint
router.post('/bot', aiRateLimiter, botValidator, botHandler);

// API response analysis & suggestions endpoint
router.post('/analyze', aiRateLimiter, analyzeValidator, analyzeHandler);

export default router;