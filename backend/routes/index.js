import express from 'express';
import authRoutes from './auth.routes.js';
import historyRoutes from './history.routes.js';
import requestRoutes from './request.routes.js';
import genaiRoutes from './genai.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/request', requestRoutes);
router.use('/ai', genaiRoutes);

export default router;
