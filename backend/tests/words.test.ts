import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/words (word-to-words)', () => {
  it("returns words related to Adam's Apples for an all-match", async () => {
    const res = await request(app).get('/api/words?q=apple&q=mads&q=mikkelsen&match=all');
    expect(res.status).toBe(200);
    expect(res.body.items.map((w: { word: string }) => w.word)).toContain('adam');
  });

  it('rejects a request without keywords with 400', async () => {
    const res = await request(app).get('/api/words');
    expect(res.status).toBe(400);
  });

  it('rejects an unknown match with 400', async () => {
    const res = await request(app).get('/api/words?q=war&match=some');
    expect(res.status).toBe(400);
  });
});