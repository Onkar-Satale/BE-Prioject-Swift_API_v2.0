import { param } from 'express-validator';
import { validateRequest } from '../middlewares/validate.js';

const deleteHistoryValidator = [
  param("historyId").trim().notEmpty().withMessage("History ID is required"),
  validateRequest
];

export {
  deleteHistoryValidator
};
