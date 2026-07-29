import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Establish a connection with MongoDB
const connectDB = async () => {
  try {
    // Connect using the database URL from the environment
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Log successful database connection
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // Log database connection failure
    logger.error('❌ MongoDB connection error:', err);

    // Stop the application if the database is unavailable
    process.exit(1);
  }
};

export default connectDB;