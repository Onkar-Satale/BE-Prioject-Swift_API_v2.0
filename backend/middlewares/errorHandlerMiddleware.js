import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

// Handle all application errors in one place
const errorHandler = (err, req, res, next) => {
  // Store the incoming error
  let error = err;

  // Handle invalid MongoDB ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    error = new ApiError(404, message);
  }

  // Handle duplicate unique fields (e.g., email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `An account with that ${field} already exists. Please use a different one.`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose schema validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message).join(", ");
    error = new ApiError(400, message);
  }

  // Convert unknown errors into ApiError format
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, false, err.stack);
  }

  // Prepare the error response
  const response = {
    success: false,
    message: error.message,

    // Include stack trace only during development
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  // Create a readable log message
  const logMessage = `${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;

  // Store additional error details
  const logMeta = {
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: error.stack,
  };

  // Log server errors as ERROR and client errors as WARNING
  if (error.statusCode >= 500) {
    logger.error(logMessage, logMeta);
  } else {
    logger.warn(logMessage, { ...logMeta, stack: undefined });
  }

  // Send the final error response to the client
  res.status(error.statusCode).json(response);
};

export default errorHandler;