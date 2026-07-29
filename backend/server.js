import 'dotenv/config';

import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

// Prevent the server from running in an unstable state after unexpected synchronous errors
process.on('uncaughtException', (err) => {
  logger.error('CRITICAL: Uncaught Exception detected!', err);

  // Exit so the application can be restarted safely
  process.exit(1);
});

// Prevent ignored Promise failures from leaving the application in an inconsistent state
process.on('unhandledRejection', (reason) => {
  logger.error('CRITICAL: Unhandled Rejection detected!', reason);

  // Exit so the application can be restarted safely
  process.exit(1);
});

// Establish database connection before handling client requests
connectDB();

// Stop startup if authentication secrets are missing
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("Missing JWT environment variables");
}

// Use configured port or fall back to the default
const PORT = process.env.PORT || 5000;

// Start accepting incoming HTTP requests
app.listen(PORT, () => {
  logger.info(`🚀 Server proudly serving requests on port ${PORT}`);
});