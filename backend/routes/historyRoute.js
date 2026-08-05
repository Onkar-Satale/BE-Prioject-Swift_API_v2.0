import express from 'express';
import { deleteHistoryValidator } from '../validators/historyValidator.js';
import { fetchHistoryHandler, deleteHistoryHandler, clearHistoryHandler } from '../controllers/historyController.js';
import auth from '../middlewares/authMiddleware.js';

// Create a router for history-related endpoints
const router = express.Router();

// Protect all history routes with authentication
router.use(auth);

// Retrieve the authenticated user's history
router.get('/', fetchHistoryHandler);

// Remove all history entries for the authenticated user
router.put('/clear', clearHistoryHandler);

// Delete a specific history entry after validation
router.delete('/:historyId', deleteHistoryValidator, deleteHistoryHandler);

export default router;