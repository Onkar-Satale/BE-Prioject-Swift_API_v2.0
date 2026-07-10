require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

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
