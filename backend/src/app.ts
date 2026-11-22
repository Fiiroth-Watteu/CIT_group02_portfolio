import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { requireAuth, requireSelf } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Builds the app without starting it, so supertest can use it directly (8-1).
export const app = express();

// Middleware order matters (6-3, 7-1, 8-2):
// 1. CORS before anything that answers. Only the frontend's origin (2-D.7)
app.use(cors({ origin: 'http://localhost:5173' }));
// 2. Parse JSON bodies
app.use(express.json());

// 3. Open routes
app.use('/api/health', healthRouter);

// 4. Everything under /api/users/{id} requires a token for that user (2-D.6):
//    no valid token → 401, another user's id → 403
app.use('/api/users/:id', requireAuth, requireSelf);

// 5. Resource routers go here, after the guard

// 6. Nothing matched → 404
app.use(notFoundHandler);
// 7. Error handler, always last
app.use(errorHandler);