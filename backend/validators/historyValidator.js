import { param, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((err) => err.msg).join(", ");
    return next(new ApiError(400, `Validation Error: ${errorMsg}`));
  }
  next();
};

const deleteHistoryValidator = [
  param("historyId").trim().notEmpty().withMessage("History ID is required"),
  validateRequest
];

export {
  deleteHistoryValidator
};
