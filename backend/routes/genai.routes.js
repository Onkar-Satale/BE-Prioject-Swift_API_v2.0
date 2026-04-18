import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validation.middleware.js';
import { botHandler, analyzeHandler } from '../controllers/genai.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

const botSchema = z.object({
  body: z.object({
    message: z.string().min(1, "Message is required"),
    currentApiContext: z.any().optional(),
    requestHistory: z.array(z.any()).optional(),
    userId: z.string().optional(),
  })
});

const analyzeSchema = z.object({
  body: z.object({
    url: z.string().optional(),
    method: z.string().optional(),
    headers: z.any().optional(),
    body: z.any().optional(),
    status: z.number().optional(),
    response: z.any().optional(),
    feature: z.string().min(1, "Feature is required"),
  })
});

router.use(authMiddleware);

router.post('/bot', validate(botSchema), botHandler);
router.post('/analyze', validate(analyzeSchema), analyzeHandler);

export default router;
