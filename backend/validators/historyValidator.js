const { param, validationResult } = require("express-validator");
const { ApiError } = require("../utils/ApiError");

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

module.exports = {
  deleteHistoryValidator
};
