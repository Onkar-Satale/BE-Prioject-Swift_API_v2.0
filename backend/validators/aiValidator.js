import { body } from 'express-validator';
import { validateRequest } from './authValidator.js';

const botValidator = [
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("currentApiContext").optional(),
  body("requestHistory").optional().isArray().withMessage("Request history must be an array"),
  body("userId").optional(),
  validateRequest,
];

const analyzeValidator = [
  body("url").optional(),
  body("method").optional(),
  body("headers").optional(),
  body("body").optional(),
  body("status").optional().isNumeric().withMessage("Status must be a number"),
  body("response").optional(),
  body("feature").trim().notEmpty().withMessage("Feature is required"),
  validateRequest,
];

export {
  botValidator,
  analyzeValidator,
};
