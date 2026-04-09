import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }
    if (parsed.query !== undefined) {
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
    if (parsed.params !== undefined) {
      Object.defineProperty(req, 'params', {
        value: parsed.params,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const errorMessage = error.errors.map((e) => e.message).join(', ');
      return next(new ApiError(400, `Validation Error: ${errorMessage}`));
    }
    next(error);
  }
};
