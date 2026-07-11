const axios = require('axios');
const { ApiError } = require('../utils/ApiError');

const genaiUrl = process.env.GENAI_SERVICE_URL;
const genaiApiSecret = process.env.GENAI_API_SECRET;

exports.botHandler = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/bot`, {
      userId: req.userId || req.body.userId || 'guest',
      message: req.body.message,
      currentApiContext: req.body.currentApiContext,
      requestHistory: req.body.requestHistory || []
    }, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      const msg = err.response.data.detail || err.response.data.error || 'GenAI Error';
      return next(new ApiError(err.response.status, msg));
    }
    console.error("GenAI Communication Error:", err.message);
    next(new ApiError(500, 'Failed to communicate with GenAI service'));
  }
};

exports.analyzeHandler = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/analyze`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      const msg = err.response.data.detail || err.response.data.error || 'GenAI Error';
      return next(new ApiError(err.response.status, msg));
    }
    console.error("GenAI Communication Error:", err.message);
    next(new ApiError(500, 'Failed to communicate with GenAI service'));
  }
};

