import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { signToken, verifyToken } from '../src/auth/crypto.js';

describe('tokens', () => {
  it('verifies a token it signed', () => {
    expect(verifyToken(signToken({ id: 5 }))).toEqual({ id: 5 });
  });
  it('rejects a token that has been tampered with', () => {
    expect(verifyToken(signToken({ id: 5 }) + 'x')).toBeUndefined();
  });
});

describe('guard on /api/users/{id}', () => {
  it('rejects a request without a token with 401', async () => {
    const res = await request(app).get('/api/users/1/ratings');
    expect(res.status).toBe(401);
  });
  it('rejects an invalid token with 401', async () => {
    const res = await request(app).get('/api/users/1/ratings').set('Authorization', 'Bearer nonsense');
    expect(res.status).toBe(401);
  });
  it("rejects another user's data with 403", async () => {
    const res = await request(app)
      .get('/api/users/1/ratings')
      .set('Authorization', `Bearer ${signToken({ id: 2 })}`);
    expect(res.status).toBe(403);
  });
});