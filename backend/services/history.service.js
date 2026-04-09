import mongoose from 'mongoose';
import User from '../models/User.js';

export const getHistory = async (userId) => {
  const user = await User.findById(userId, { history: { $slice: -50 } });
  if (!user) return null;

  return Array.isArray(user.history) ? user.history.slice().reverse() : [];
};

export const pushHistoryItem = async (userId, historyEntry) => {
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
};

export const deleteHistoryItem = async (userId, historyId) => {
  return await User.findByIdAndUpdate(userId, {
    $pull: { history: { _id: historyId } },
  });
};

export const clearHistory = async (userId) => {
  return await User.findByIdAndUpdate(userId, { $set: { history: [] } });
};
