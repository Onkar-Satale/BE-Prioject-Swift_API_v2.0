import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start Express Server
  app.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port} in ${config.env} mode`);
  });
};

startServer();
