import 'dotenv/config';

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'MY_SECRET_KEY',
  mongoURI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/postman-clone',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001',
  aiServiceSecret: process.env.AI_SERVICE_SECRET || 'my_super_secret_ai_token_123',
  env: process.env.NODE_ENV || 'development',
};
