import { Router } from 'express';
import { findUserForLogin } from '../data/user.js';
import { verifyPassword, signToken } from '../auth/crypto.js';

export const tokensRouter = Router();

// POST /api/tokens   200 | 400 | 401   log in (open route, 8-2)
tokensRouter.post('/', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = await findUserForLogin(username);
  // The same 401 for an unknown user and a wrong password, so it does not reveal
  // which usernames exist (api-design.md).
  if (!user || !user.salt || !(await verifyPassword(password, user.salt, user.password_hash))) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }

  res.json({ token: signToken({ id: user.user_id }), user: `/api/users/${user.user_id}` });
});