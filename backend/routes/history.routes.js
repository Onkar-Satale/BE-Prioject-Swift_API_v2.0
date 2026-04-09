import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validation.middleware.js';
import { fetchHistoryHandler, deleteHistoryHandler, clearHistoryHandler } from '../controllers/history.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

const deleteHistorySchema = z.object({
  params: z.object({
    historyId: z.string().min(1, "History ID is required"),
  })
});

router.use(authMiddleware);

router.get('/', fetchHistoryHandler);
router.put('/clear', clearHistoryHandler);
router.delete('/:historyId', validate(deleteHistorySchema), deleteHistoryHandler);

export default router;
