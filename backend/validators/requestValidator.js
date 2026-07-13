import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validate.js';

const requestProxyValidator = [
  body("url").trim().notEmpty().withMessage("URL is required").isURL().withMessage("Must be a valid URL"),
  body("method").trim().notEmpty().withMessage("Method is required"),
  body("headers").optional(),
  body("params").optional(),
  body("body").optional(),
  validateRequest
];

export {
  requestProxyValidator
};
