const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const aiRoutes = require('./routes/ai');

// Import request controller/validator/auth directly matching PackMate's Gateway design
const { proxyRequestHandler } = require('./controllers/requestController');
const { requestProxyValidator } = require('./validators/requestValidator');
const auth = require('./middlewares/auth');

const app = express();

// Global Middlewares
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
  : [];

// CORS configuration matching PackMate exactly
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked this Origin:', origin);
      callback(new Error('CORS blocked origin'), false);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser()); // Enable HTTP-only cookie parsing matching PackMate
app.use(morgan('dev'));

// Rate Limiting defined directly in app.js matching PackMate Gateway style
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 30, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 200, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after a minute',
  },
});

// Apply rate limiting raw mapping like PackMate
app.use('/api/auth/signup', authRateLimiter);
app.use('/api/auth/login', authRateLimiter);

// Base route for health checks
app.get('/', (req, res) => res.send('Backend is running...'));

// Direct mount for Gateway API Proxy matching PackMate travel-chat direct declaration
app.post('/api/request', apiRateLimiter, auth, requestProxyValidator, proxyRequestHandler);

// API Routes (mounted individually like PackMate)
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
