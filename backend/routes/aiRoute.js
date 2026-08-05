import express from 'express';
import { botValidator, analyzeValidator } from '../validators/aiValidator.js';
import { botHandler, analyzeHandler } from '../controllers/aiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { aiRateLimiter } from '../middlewares/rateLimiterMiddleware.js';

// Create a router for AI-related endpoints
const router = express.Router();

// Protect all AI routes with authentication
router.use(authMiddleware);

// Handle AI chatbot requests
router.post(
  '/bot',
  aiRateLimiter,
  botValidator,
  botHandler
);

// Handle AI API analysis requests
router.post(
  '/analyze',
  aiRateLimiter,
  analyzeValidator,
  analyzeHandler
);

export default router;