const { body, validationResult } = require("express-validator");
const { ApiError } = require("../utils/ApiError");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((err) => err.msg).join(", ");
    return next(new ApiError(400, `Validation Error: ${errorMsg}`));
  }
  next();
};

const botValidator = [
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("currentApiContext").optional(),
  body("requestHistory").optional().isArray().withMessage("Request history must be an array"),
  body("userId").optional(),
  validateRequest
];

const analyzeValidator = [
  body("url").optional(),
  body("method").optional(),
  body("headers").optional(),
  body("body").optional(),
  body("status").optional().isNumeric().withMessage("Status must be a number"),
  body("response").optional(),
  body("feature").trim().notEmpty().withMessage("Feature is required"),
  validateRequest
];

module.exports = {
  botValidator,
  analyzeValidator
};
