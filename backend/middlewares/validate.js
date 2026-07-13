import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((err) => err.msg).join(", ");
    return next(new ApiError(400, `Validation Error: ${errorMsg}`));
  }
  next();
};
