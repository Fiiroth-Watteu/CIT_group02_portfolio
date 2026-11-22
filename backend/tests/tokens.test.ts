import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';
import { generateSalt, hashPassword, verifyToken } from '../src/auth/crypto.js';

// A fresh user with a hashed password, removed again after the tests.
const username = `logintest_${Date.now()}`;

beforeAll(async () => {
  const salt = generateSalt();
  const hash = await hashPassword(salt, 'secret123');
  await pool.query('SELECT create_user($1, $2, $3, $4)', [username, `${username}@test.test`, hash, salt]);
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE username = $1', [username]);
});

describe('POST /api/tokens', () => {
  it('logs in with the right password and returns a valid token', async () => {
    const res = await request(app).post('/api/tokens').send({ username, password: 'secret123' });
    expect(res.status).toBe(200);
    expect(typeof verifyToken(res.body.token)?.id).toBe('number');
    expect(res.body.user).toMatch(/^\/api\/users\/\d+$/);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app).post('/api/tokens').send({ username, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects a missing password with 400', async () => {
    const res = await request(app).post('/api/tokens').send({ username });
    expect(res.status).toBe(400);
  });
});