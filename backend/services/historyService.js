import mongoose from 'mongoose';
import User from '../models/userModel.js';

/**
 * Service managing user API request history records.
 */
class HistoryService {
  /**
   * Fetches the 50 most recent request history entries for a user in reverse chronological order.
   */
  async getHistory(userId) {
    const user = await User.findById(userId, { history: { $slice: -50 } });
    if (!user) return null;

    return Array.isArray(user.history) ? user.history.slice().reverse() : [];
  }

  /**
   * Appends a new API request history entry to the user's history array, capping total items at 100.
   */
  async pushHistoryItem(userId, historyEntry) {
    const newEntry = { 
      ...historyEntry, 
      _id: new mongoose.Types.ObjectId(),
      time: historyEntry.time || new Date()
    };
    
    await User.findByIdAndUpdate(userId, {
      $push: { 
        history: {
          $each: [newEntry],
          $slice: -100 // Cap history array at latest 100 items
        }
      },
      $inc: { reqCount: 1 }
    });
    
    return newEntry;
  }

  /**
   * Deletes a specific history item by ID from the user document.
   */
  async deleteHistoryItem(userId, historyId) {
    return await User.findByIdAndUpdate(userId, {
      $pull: { history: { _id: historyId } },
    });
  }

  /**
   * Clears all history entries for a user document.
   */
  async clearHistory(userId) {
    return await User.findByIdAndUpdate(userId, { $set: { history: [] } });
  }
}

export default new HistoryService();
