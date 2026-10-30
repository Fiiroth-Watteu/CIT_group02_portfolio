import { Router } from 'express';

// Skeleton check route: proves the app, routing and tests are wired up.
export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({ status: 'ok' });
});
