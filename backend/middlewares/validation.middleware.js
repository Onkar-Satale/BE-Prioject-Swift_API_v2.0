import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Replace req properties with validated ones (which trims / converts types sometimes)
    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const errorMessage = error.errors.map((e) => e.message).join(', ');
      return next(new ApiError(400, `Validation Error: ${errorMessage}`));
    }
    next(error);
  }
};
