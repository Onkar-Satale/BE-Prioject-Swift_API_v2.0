import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import logger from './utils/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import { authRateLimiter, apiRateLimiter } from './middlewares/rateLimiter.js';
import authRoutes from './routes/auth.js';
import historyRoutes from './routes/history.js';
import aiRoutes from './routes/ai.js';
import { proxyRequestHandler } from './controllers/requestController.js';
import { requestProxyValidator } from './validators/requestValidator.js';
import auth from './middlewares/auth.js';

const app = express();

// Trust reverse proxy so Express gets the client's real IP (used for rate limiting)
app.set("trust proxy", 1);

// Add common security-related HTTP headers
app.use(helmet());

// Read allowed frontend URLs from the environment
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
  : [];

// Allow requests only from trusted frontend origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow Swift API client and local development servers
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked this Origin: ${origin}`);
      callback(new Error('CORS blocked origin'), false);
    }
  },
  credentials: true // Allow HTTP-only cookies (Refresh Token)
}));

// Parse JSON, form-data and cookies from incoming requests
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Log every incoming HTTP request
app.use(morgan("dev"));

// Apply stricter rate limiting only to authentication routes
app.use("/api/login", authRateLimiter);
app.use("/api/register", authRateLimiter);

// Request pipeline: Rate Limiter → Authentication → Validation → Controller
app.post('/api/request', apiRateLimiter, auth, requestProxyValidator, proxyRequestHandler);

// Register application routes
app.use('/api', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint used by deployment platforms
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Backend is running securely' });
});

// Keep the global error handler last so it can catch errors from all routes
app.use(errorHandler);

export default app;