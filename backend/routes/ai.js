const express = require('express');
const { botValidator, analyzeValidator } = require('../validators/aiValidator');
const { botHandler, analyzeHandler } = require('../controllers/aiController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.use(auth);

router.post('/bot', botValidator, botHandler);
router.post('/analyze', analyzeValidator, analyzeHandler);

module.exports = router;
