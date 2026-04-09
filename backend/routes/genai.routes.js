import express from 'express';
import { botHandler, analyzeHandler } from '../controllers/genai.controller.js';
import { authOptional } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authOptional);

router.post('/bot', botHandler);
router.post('/analyze', analyzeHandler);

export default router;
