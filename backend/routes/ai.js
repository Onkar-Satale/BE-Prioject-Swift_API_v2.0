import express from 'express';
import rateLimit from 'express-rate-limit';
import { botValidator, analyzeValidator } from '../validators/aiValidator.js';
import { botHandler, analyzeHandler } from '../controllers/aiController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// Extremely strict rate limiting for AI generation to prevent abuse, similar to what Python had
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { success: false, message: "Too many AI requests, please try again later." },
});

router.use(authMiddleware);

router.post(
  '/bot', 
  aiLimiter, 
  botValidator, 
  botHandler);
  
router.post(
  '/analyze', 
  aiLimiter, 
  analyzeValidator, 
  analyzeHandler);

export default router;

