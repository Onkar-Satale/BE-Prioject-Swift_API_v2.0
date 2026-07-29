import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

// Read the GenAI service URL from .env
const genaiUrl = process.env.GENAI_SERVICE_URL;

// Read the shared secret used to authenticate with the GenAI service
const genaiApiSecret = process.env.GENAI_API_SECRET;

// Handle all Axios communication errors in one place
const handleAxiosError = (err, next) => {

  // FastAPI returned an error response
  if (err.response) {
    const msg = err.response.data?.detail || err.response.data?.error || 'GenAI Error';

    // Forward the error to the centralized error handler
    return next(new ApiError(err.response.status, msg, true, err.stack));
  }

  // FastAPI could not be reached
  return next(new ApiError(500, 'Failed to communicate with GenAI service', false, err.stack));
};

// Handle chatbot requests
export const botHandler = async (req, res, next) => {
  try {

    // Forward the chatbot request to the FastAPI GenAI service
    const response = await axios.post(`${genaiUrl}/bot`, {
      userId: req.userId || req.body.userId || 'guest',
      message: req.body.message,
      currentApiContext: req.body.currentApiContext,
      requestHistory: req.body.requestHistory || []
    }, {
      // Authenticate the request using the shared API key
      headers: { 'x-api-key': genaiApiSecret }
    });

    // Return the AI response to the frontend
    res.json(response.data);

  } catch (err) {

    // Handle communication errors
    handleAxiosError(err, next);
  }
};

// Handle API analysis requests
export const analyzeHandler = async (req, res, next) => {
  try {

    // Forward the analysis request to the FastAPI GenAI service
    const response = await axios.post(`${genaiUrl}/analyze`, req.body, {
      // Authenticate the request using the shared API key
      headers: { 'x-api-key': genaiApiSecret }
    });

    // Return the AI analysis to the frontend
    res.json(response.data);

  } catch (err) {

    // Handle communication errors
    handleAxiosError(err, next);
  }
};