import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/persons/{nconst}/words', () => {
  it("returns Tom Hanks' most frequent words first", async () => {
    const res = await request(app).get('/api/persons/nm0000158/words?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.items[0]).toEqual({ word: 'tom', frequency: 35 });
    expect(res.body.items.length).toBe(5);
    expect(res.body.next).toContain('offset=5');
  });

  it('answers 404 for a person that does not exist', async () => {
    const res = await request(app).get('/api/persons/nm0000000/words');
    expect(res.status).toBe(404);
  });
});