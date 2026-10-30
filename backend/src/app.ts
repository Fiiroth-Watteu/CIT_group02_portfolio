import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Builds the app without starting it, so supertest can use it directly (8-1).
export const app = express();

// Middleware order matters (6-3, 7-1, 8-2):
// 1. cors before anything that answers
app.use(cors());
// 2. parse JSON bodies
app.use(express.json());

// 3. routers, one per resource
app.use('/api/health', healthRouter);
// TODO: mount resource routers here once the resource model (2-B.1) is decided.

// 4. nothing matched -> 404
app.use(notFoundHandler);
// 5. error handler, always last
app.use(errorHandler);
