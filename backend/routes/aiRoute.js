import express from 'express';
import {
  botValidator,
  analyzeValidator,
  failureAssistValidator,
  compareValidator,
  healthScoreValidator,
  indexEpisodeValidator,
  retrieveEpisodesValidator
} from '../validators/aiValidator.js';
import {
  botHandler,
  analyzeHandler,
  failureAssistHandler,
  compareHandler,
  healthScoreHandler,
  indexEpisodeHandler,
  retrieveEpisodesHandler
} from '../controllers/aiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { aiRateLimiter } from '../middlewares/rateLimiterMiddleware.js';

/**
 * AI Service Routes (/api/ai)
 * Requires JWT authentication and applies AI-specific rate limiting.
 */
const router = express.Router();

router.use(authMiddleware);

// AI Chatbot interaction endpoint (V1)
router.post('/bot', aiRateLimiter, botValidator, botHandler);

// API response analysis & suggestions endpoint (V1)
router.post('/analyze', aiRateLimiter, analyzeValidator, analyzeHandler);

// Automatic AI Failure Assistant & Auto-Fix recommendation (V2 + RAG)
router.post('/failure-assist', aiRateLimiter, failureAssistValidator, failureAssistHandler);

// Side-by-side history comparison & differential diagnosis (V2)
router.post('/compare', aiRateLimiter, compareValidator, compareHandler);

// Measurable 0-100 API Health Score calculation (V2)
router.post('/health-score', aiRateLimiter, healthScoreValidator, healthScoreHandler);

// RAG Memory Indexing: Record verified resolution episode (V2 RAG)
router.post('/rag/index-episode', aiRateLimiter, indexEpisodeValidator, indexEpisodeHandler);

// RAG Memory Retrieval: Search relevant past resolutions (V2 RAG)
router.post('/rag/retrieve', aiRateLimiter, retrieveEpisodesValidator, retrieveEpisodesHandler);

export default router;