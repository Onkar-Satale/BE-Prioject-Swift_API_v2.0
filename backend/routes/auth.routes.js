import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validation.middleware.js';
import { registerHandler, loginHandler, meHandler, deleteMeHandler } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

const signupSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required").max(50),
    email: z.string().email("Invalid email format"),
    password: z.string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  })
});

// Apply rate limiter to auth endpoints
router.post('/signup', authRateLimiter, validate(signupSchema), registerHandler);
router.post('/login', authRateLimiter, validate(loginSchema), loginHandler);

router.get('/me', authMiddleware, meHandler);
router.delete('/me', authMiddleware, deleteMeHandler);

export default router;
