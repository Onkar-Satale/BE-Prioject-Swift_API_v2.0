import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const PORT = process.env.PORT || 5000;
  const ENV = process.env.NODE_ENV || 'development';

  // Start Express Server
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} in ${ENV} mode`);
  });
};

startServer();
