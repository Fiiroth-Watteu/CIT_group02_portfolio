import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type Claims } from '../auth/crypto.js';

// 8-2, slide 9 ("What the guard does"): no valid token → 401, and the handler never runs.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];   // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  const claims = verifyToken(token);
  if (!claims) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  res.locals.user = claims;
  next();
}

// For open routes that behave differently for logged-in users (e.g. search history).
// No token → undefined (guest). Invalid token → 'invalid'.
export function readOptionalUser(req: Request): Claims | undefined | 'invalid' {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return undefined;
  return verifyToken(token) ?? 'invalid';
}

// The id in the URI must be the logged-in user's id, otherwise 403 (8-2: we know who you are,
// and the answer is no). Needs no database, so it is middleware (api-design.md).
export function requireSelf(req: Request, res: Response, next: NextFunction) {
  if (Number(req.params.id) !== res.locals.user?.id) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  next();
}