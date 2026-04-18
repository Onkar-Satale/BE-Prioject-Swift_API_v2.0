import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validation.middleware.js';
import { proxyRequestHandler } from '../controllers/request.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { apiRateLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

const requestProxySchema = z.object({
  body: z.object({
    url: z.string().url("Must be a valid URL").min(1, "URL is required"),
    method: z.string().min(1, "Method is required"),
    headers: z.any().optional(),
    params: z.any().optional(),
    body: z.any().optional(),
  })
});

router.post('/', apiRateLimiter, authMiddleware, validate(requestProxySchema), proxyRequestHandler);

export default router;
