import { Router } from 'express';

import { generateSalt, hashPassword } from '../auth/crypto.js';
import { createUser, findUserForLogin, deleteUser} from '../data/user.js';

export const usersRouter = Router();

// The user representation from docs/api-design.md. Never contains the password or hash (2-A.4).
function toUser(id: number, username: string, email: string) {
  const url = `/api/users/${id}`;
  return {
    url, username, email,
    title_bookmarks: `${url}/title-bookmarks`,
    person_bookmarks: `${url}/person-bookmarks`,
    ratings: `${url}/ratings`,
    searches: `${url}/searches`,
  };
}

// POST /api/users   201 | 400 | 409   create user (open route)
usersRouter.post('/', async (req, res) => {
  const { username, email, password } = req.body ?? {};
  if (![username, email, password].every(v => typeof v === 'string' && v.length > 0)) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }

  usersRouter.delete('/:id', async (req, res) => {
    const deleted = await deleteUser(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).end();
  });

  // Hash before storing: salted, iterated SHA-256 (2-A.4, security lectures I and II).
  const salt = generateSalt();
  const hash = await hashPassword(salt, password);
  const message = await createUser(username, email, hash, salt);
  if (message !== 'user has been created') {
    return res.status(409).json({ error: message });   // username taken or email in use
  }

  const created = await findUserForLogin(username);
  const user = toUser(created!.user_id, username, email);
  res.status(201).location(user.url).json(user);
});