
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Title routes', () => {
  it('returns popular actors for an existing title', async () => {
    const response = await request(app)
      .get('/api/titles/tt0052520/actors?limit=2&offset=0');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body.items.length).toBeLessThanOrEqual(2);
    expect(response.body.items[0]).toHaveProperty('primary_name');
    expect(response.body.items[0]).toHaveProperty('url');
  });

  it('returns similar movies for an existing title', async () => {
    const response = await request(app)
      .get('/api/titles/tt0052520/similar?limit=2&offset=0');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body.items.length).toBeLessThanOrEqual(2);

    if (response.body.items.length > 0) {
      expect(response.body.items[0]).toHaveProperty('primary_title');
      expect(response.body.items[0]).toHaveProperty('similarity_score');
    }
  });

  it('returns 404 for a title that does not exist', async () => {
    const response = await request(app)
      .get('/api/titles/tt9999999999/actors');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No such title' });
  });
});
