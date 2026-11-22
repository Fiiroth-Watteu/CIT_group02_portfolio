import { describe, it, expect } from 'vitest';
import { readPageParams, makePage } from '../src/paging.js';

describe('readPageParams', () => {
  it('uses the defaults when nothing is given', () => {
    expect(readPageParams({})).toEqual({ limit: 20, offset: 0 });
  });
  it('clamps invalid and too large values', () => {
    expect(readPageParams({ limit: 'abc', offset: '-5' })).toEqual({ limit: 20, offset: 0 });
    expect(readPageParams({ limit: '1000' }).limit).toBe(100);
  });
});

describe('makePage', () => {
  it('has no prev on the first page and a next when there are more rows', () => {
    const page = makePage([1, 2, 3], { limit: 2, offset: 0 }, '/api/words?q=war');
    expect(page.items).toEqual([1, 2]);
    expect(page.prev).toBeNull();
    expect(page.next).toBe('/api/words?q=war&limit=2&offset=2');
  });
  it('has no next on the last page', () => {
    const page = makePage([1], { limit: 2, offset: 2 }, '/api/words?q=war&limit=2&offset=2');
    expect(page.next).toBeNull();
    expect(page.prev).toBe('/api/words?q=war&limit=2&offset=0');
  });
});