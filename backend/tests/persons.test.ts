
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Person routes', () => {
  it('returns person details for an existing person', async () => {
    const response = await request(app)
      .get('/api/persons/nm0000158');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
    expect(response.body).toHaveProperty('primary_name');
    expect(response.body).toHaveProperty('birth_year');
    expect(response.body).toHaveProperty('death_year');
    expect(response.body).toHaveProperty('name_rating');
    expect(response.body).toHaveProperty('co_players');
    expect(response.body).toHaveProperty('words');
  });

  it('returns 404 for a person that does not exist', async () => {
    const response = await request(app)
      .get('/api/persons/nm9999999999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No such person' });
  });
});
