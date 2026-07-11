import express from 'express';
import { deleteHistoryValidator } from '../validators/historyValidator.js';
import { fetchHistoryHandler, deleteHistoryHandler, clearHistoryHandler } from '../controllers/historyController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', fetchHistoryHandler);
router.put('/clear', clearHistoryHandler);
router.delete('/:historyId', deleteHistoryValidator, deleteHistoryHandler);

export default router;
