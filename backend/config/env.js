import 'dotenv/config';

export const config = {
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  mongoURI: process.env.MONGO_URI,
  aiServiceUrl: process.env.AI_SERVICE_URL,
  aiServiceSecret: process.env.AI_SERVICE_SECRET,
  env: process.env.NODE_ENV,
};
