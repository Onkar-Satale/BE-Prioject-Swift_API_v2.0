import morgan from 'morgan';
import { config } from '../config/env.js';

// Setup Morgan Request logger format
const format = config.env === 'development' ? 'dev' : 'combined';

export const requestLogger = morgan(format, {
  skip: (req, res) => config.env === 'test'
});
