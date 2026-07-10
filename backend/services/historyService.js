const mongoose = require("mongoose");
const User = require("../models/User");

class HistoryService {
  async getHistory(userId) {
    const user = await User.findById(userId, { history: { $slice: -50 } });
    if (!user) return null;

    return Array.isArray(user.history) ? user.history.slice().reverse() : [];
  }

  async pushHistoryItem(userId, historyEntry) {
    // We make sure it has an _id so we can return it reliably
    const newEntry = { ...historyEntry, _id: new mongoose.Types.ObjectId() };
    
    await User.findByIdAndUpdate(userId, {
      $push: { 
        history: {
          $each: [newEntry],
          $slice: -100 // keep only the latest 100 entries to save space
        }
      },
      $inc: { reqCount: 1 }
    });
    
    return newEntry;
  }

  async deleteHistoryItem(userId, historyId) {
    return await User.findByIdAndUpdate(userId, {
      $pull: { history: { _id: historyId } },
    });
  }

  async clearHistory(userId) {
    return await User.findByIdAndUpdate(userId, { $set: { history: [] } });
  }
}

module.exports = new HistoryService();
