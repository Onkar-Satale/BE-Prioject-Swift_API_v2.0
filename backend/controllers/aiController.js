import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const genaiUrl = process.env.GENAI_SERVICE_URL;
const genaiApiSecret = process.env.GENAI_API_SECRET;
/**
 * Handles Axios communication errors when calling the external GenAI FastAPI service.
 * Converts FastAPI error payloads into operational ApiErrors.
 */
const handleAxiosError = (err, next) => {
  if (err.response) {
    const msg = err.response.data?.detail || err.response.data?.error || 'GenAI Error';
    return next(new ApiError(err.response.status, msg, true, err.stack));
  }
  return next(new ApiError(500, 'Failed to communicate with GenAI service', false, err.stack));
};

// Handles AI chatbot requests by forwarding prompt and API context to the GenAI microservice.
export const botHandler = async (req, res, next) => {
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
    handleAxiosError(err, next);
  }
};

// Handles request/response analysis by sending raw execution payload to the GenAI microservice.
export const analyzeHandler = async (req, res, next) => {
  try {
    const response = await axios.post(`${genaiUrl}/analyze`, req.body, {
      headers: { 'x-api-key': genaiApiSecret }
    });

    res.json(response.data);
  } catch (err) {
    handleAxiosError(err, next);
  }
};