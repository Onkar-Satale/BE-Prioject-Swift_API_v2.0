import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((err) => err.msg).join(", ");
    return next(new ApiError(400, `Validation Error: ${errorMsg}`));
  }
  next();
};

const registerValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required").isLength({ max: 50 }).withMessage("First name must be at most 50 characters long"),
  body("lastName").optional().trim().isLength({ max: 50 }).withMessage("Last name must be at most 50 characters long"),
  body("email").trim().isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),
  validateRequest,
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

export {
  registerValidator,
  loginValidator,
  validateRequest
};
