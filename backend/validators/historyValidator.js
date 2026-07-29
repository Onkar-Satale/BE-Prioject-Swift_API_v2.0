import { param } from 'express-validator';
import { validateRequest } from './requestValidator.js';

const deleteHistoryValidator = [
  param("historyId").trim().notEmpty().withMessage("History ID is required"),
  validateRequest
];

export {
  deleteHistoryValidator
};
