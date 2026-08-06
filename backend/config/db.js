import mongoose from 'mongoose';
import logger from '../utils/logger.js';
/**
 * Connects to MongoDB using connection string from MONGO_URI environment variable.
 * Terminates process immediately on connection failure.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;