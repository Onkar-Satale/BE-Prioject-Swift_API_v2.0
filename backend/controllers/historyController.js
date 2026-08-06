import historyService from '../services/historyService.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Retrieves the request execution history for the authenticated user (latest 50 entries).
 */
export const fetchHistoryHandler = async (req, res, next) => {
  try {
    const history = await historyService.getHistory(req.userId);
    if (!history) {
      return next(new ApiError(404, 'User not found'));
    }
    res.json(history);
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a single request history entry by ID for the authenticated user.
 */
export const deleteHistoryHandler = async (req, res, next) => {
  try {
    const { historyId } = req.params;
    const result = await historyService.deleteHistoryItem(req.userId, historyId);
    if (!result) {
      return next(new ApiError(404, 'History item not found'));
    }
    res.json({ success: true, message: 'History item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Clears all request history entries for the authenticated user.
 */
export const clearHistoryHandler = async (req, res, next) => {
  try {
    const result = await historyService.clearHistory(req.userId);
    if (!result) {
      return next(new ApiError(404, 'User not found'));
    }
    res.json({ success: true, message: 'History cleared successfully' });
  } catch (error) {
    next(error);
  }
};
