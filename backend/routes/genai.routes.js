import express from 'express';
import { botHandler, analyzeHandler } from '../controllers/genai.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/bot', botHandler);
router.post('/analyze', analyzeHandler);

export default router;
