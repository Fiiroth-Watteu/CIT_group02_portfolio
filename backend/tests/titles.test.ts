import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/titles (search)', () => {
  it("reads IMDb data: exact match finds Adam's Apples", async () => {
    const res = await request(app).get('/api/titles?q=apple&q=mads&q=mikkelsen&mode=exact');
    expect(res.status).toBe(200);
    expect(res.body.items.map((i: { url: string }) => i.url)).toContain('/api/titles/tt0418455');
  });

  it('returns a paged listing with prev and next links', async () => {
    const res = await request(app).get('/api/titles?q=death&mode=exact&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
    expect(res.body.prev).toBeNull();
    expect(res.body.next).toContain('offset=2');
  });

  it('rejects a search without keywords with 400', async () => {
    const res = await request(app).get('/api/titles');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Query parameter q is required' });
  });

  it('rejects an unknown mode with 400', async () => {
    const res = await request(app).get('/api/titles?q=death&mode=fast');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/titles/{tconst}/similar and /actors', () => {
    it('returns similar titles with URIs', async () => {
      const res = await request(app).get('/api/titles/tt26693752/similar?limit=3');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(3);
      expect(res.body.items[0].url).toMatch(/^\/api\/titles\/tt\d+$/);
    });
  
    it('returns the actors ordered by name rating', async () => {
      const res = await request(app).get('/api/titles/tt26693752/actors');
      expect(res.status).toBe(200);
      expect(res.body.items[0]).toEqual({
        url: '/api/persons/nm5419548', primary_name: 'Kim Nam-Hee', name_rating: 8.22,
      });
    });
  
    it('answers 404 for a title that does not exist', async () => {
      const res = await request(app).get('/api/titles/tt0000000/similar');
      expect(res.status).toBe(404);
    });
  });