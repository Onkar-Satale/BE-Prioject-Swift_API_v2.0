const express = require('express');
const rateLimit = require('express-rate-limit');
const { botValidator, analyzeValidator } = require('../validators/aiValidator');
const { botHandler, analyzeHandler } = require('../controllers/aiController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Extremely strict rate limiting for AI generation to prevent abuse, similar to what Python had
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { success: false, message: "Too many AI requests, please try again later." },
});

router.use(auth);

router.post('/bot', aiLimiter, botValidator, botHandler);
router.post('/analyze', aiLimiter, analyzeValidator, analyzeHandler);

module.exports = router;

