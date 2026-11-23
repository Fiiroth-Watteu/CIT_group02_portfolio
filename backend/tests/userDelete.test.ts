import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('DELETE /api/users/:id', () => {
  it('deletes the logged-in user (204), then 404', async () => {
    const name = `del_${Date.now()}`;
    const password = 'secret123';
    await request(app).post('/api/users')
      .send({ username: name, email: `${name}@test.dk`, password })
      .expect(201);

    const login = await request(app).post('/api/tokens')
      .send({ username: name, password })
      .expect(200);
    const { token, user } = login.body;   // user = '/api/users/{id}'

    await request(app).delete(user)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const again = await request(app).delete(user)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(again.body).toEqual({ error: 'User not found' });
  });

  it('rejects delete without a token (401)', async () => {
    await request(app).delete('/api/users/1').expect(401);
  });
});