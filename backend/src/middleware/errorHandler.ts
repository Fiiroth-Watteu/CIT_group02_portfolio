import type { Request, Response, NextFunction } from 'express';

// Answers any request that no router handled.
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

// Central error handler (7-1 "Handling errors in one place", 2-D.5).
// Four parameters is what tells Express this is an error handler. Registered last.
// Never sends the stack, SQL text or DB identifiers to the client (2-A.4).
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
}
