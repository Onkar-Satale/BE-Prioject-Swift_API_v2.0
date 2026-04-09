import { getHistory, deleteHistoryItem, clearHistory } from '../services/history.service.js';

export const fetchHistoryHandler = async (req, res, next) => {
  try {
    const history = await getHistory(req.userId);
    if (!history) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json(history);
  } catch (error) {
    next(error);
  }
};

export const deleteHistoryHandler = async (req, res, next) => {
  try {
    const { historyId } = req.params;
    const result = await deleteHistoryItem(req.userId, historyId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'History item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const clearHistoryHandler = async (req, res, next) => {
  try {
    const result = await clearHistory(req.userId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'History cleared successfully' });
  } catch (error) {
    next(error);
  }
};
