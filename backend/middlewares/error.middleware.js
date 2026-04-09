import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const errorMiddleware = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = statusCode || 500;
    message = err.message || 'Internal Server Error';
  }

  const response = {
    success: false,
    error: message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
