import mongoose from 'mongoose';
import User from '../models/userModel.js';

// Service managing user API request history records and RAG resolution memories.
class HistoryService {
  // Fetches the 50 most recent request history entries for a user in reverse chronological order.
  async getHistory(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) return [];
      const user = await User.findById(userId, { history: { $slice: -50 } });
      if (!user) return [];

      return Array.isArray(user.history) ? user.history.slice().reverse() : [];
    } catch {
      return [];
    }
  }

  // Appends a new API request history entry to the user's history array, capping total items at 100.
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

  // Appends a new verified resolution episode into the user's RAG memory
  async pushResolutionEpisode(userId, episode) {
    const newEpisode = {
      ...episode,
      _id: new mongoose.Types.ObjectId(),
      timestamp: episode.timestamp || new Date()
    };

    await User.findByIdAndUpdate(userId, {
      $push: {
        resolutionEpisodes: {
          $each: [newEpisode],
          $slice: -100
        }
      }
    });

    return newEpisode;
  }

  // Retrieves stored resolution episodes for RAG initialization
  async getResolutionEpisodes(userId) {
    const user = await User.findById(userId, { resolutionEpisodes: { $slice: -50 } });
    if (!user) return [];
    return user.resolutionEpisodes || [];
  }

  // Deletes a specific history item by ID from the user document.
  async deleteHistoryItem(userId, historyId) {
    return await User.findByIdAndUpdate(userId, {
      $pull: { history: { _id: historyId } },
    });
  }

  // Clears all history entries for a user document.
  async clearHistory(userId) {
    return await User.findByIdAndUpdate(userId, { $set: { history: [] } });
  }
}

export default new HistoryService();
