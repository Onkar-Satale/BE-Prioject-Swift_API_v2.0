import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Common middleware function that checks express-validator results.
 * Forwards a 400 ApiError if any validation rules failed.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((err) => err.msg).join(", ");
    return next(new ApiError(400, `Validation Error: ${errorMsg}`));
  }
  next();
};

/**
 * Validation schema for the /api/request endpoint.
 */
export const requestProxyValidator = [
  body("url").trim().notEmpty().withMessage("URL is required").isURL().withMessage("Must be a valid URL"),
  body("method").trim().notEmpty().withMessage("Method is required"),
  body("headers").optional(),
  body("params").optional(),
  body("body").optional(),
  validateRequest
];
