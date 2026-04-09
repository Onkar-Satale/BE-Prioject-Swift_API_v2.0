import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './utils/logger.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(requestLogger);

// Base route for health checks
app.get('/', (req, res) => res.send('Backend is running...'));

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
