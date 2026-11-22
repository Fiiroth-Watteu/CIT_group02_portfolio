import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';

const username = `createtest_${Date.now()}`;

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE username = $1', [username]);
});

describe('POST /api/users', () => {
  it('writes framework data: creates a user and answers 201 with its URI', async () => {
    const res = await request(app).post('/api/users')
      .send({ username, email: `${username}@test.test`, password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.headers.location).toMatch(/^\/api\/users\/\d+$/);
    expect(res.body.username).toBe(username);
    expect(res.body).not.toHaveProperty('password');
  });

  it('rejects a taken username with 409', async () => {
    const res = await request(app).post('/api/users')
      .send({ username, email: `other_${username}@test.test`, password: 'secret123' });
    expect(res.status).toBe(409);
  });

  it('rejects a missing password with 400', async () => {
    const res = await request(app).post('/api/users').send({ username: 'x', email: 'x@x.x' });
    expect(res.status).toBe(400);
  });
});