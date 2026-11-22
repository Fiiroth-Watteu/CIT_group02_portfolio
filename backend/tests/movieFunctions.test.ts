import { describe, it, expect } from 'vitest';
import { getPopularActors } from '../src/data/persons.js';
import { getSimilarMovies } from '../src/data/titles.js';
import { simpleSearch, structuredSearch } from '../src/data/titles.js'

describe('simple movie search by title', () => {
  it('returns matching movies', async () => {
    const movies = await simpleSearch('casino', 5, 0);

    expect(movies.length).toBeGreaterThan(0);
    expect(movies.length).toBeLessThanOrEqual(5);
    expect(movies[0]).toHaveProperty('title_id');
    expect(movies[0]).toHaveProperty('primary_title');
  })
});

describe('Popular actors database function', () => {
  it('returns matching actors', async () => {
    const actors = await getPopularActors('tt26693752', 5, 0);

    expect(actors.length).toBeGreaterThan(0);
    expect(actors.length).toBeLessThanOrEqual(5);
    expect(actors[0]).toHaveProperty('person_id');
    expect(actors[0]).toHaveProperty('primary_name');
    expect(actors[0]).toHaveProperty('name_rating');
  });

  it('returns actors ordered by descending rating', async () => {
    const actors = await getPopularActors('tt26693752', 10, 0);

    const ratings = actors.map(actor =>
      actor.name_rating === null ? -Infinity : Number(actor.name_rating)
    );

    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it('respects pagination', async () => {
    const firstPage = await getPopularActors('tt26693752', 2, 0);
    const secondPage = await getPopularActors('tt26693752', 2, 2);

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);

    const firstIds = firstPage.map(actor => actor.person_id);
    const secondIds = secondPage.map(actor => actor.person_id);

    expect(firstIds.some(id => secondIds.includes(id))).toBe(false);
  });
});

describe('Movie similarity database function', () => {
  it('returns similar movies', async () => {
    const movies = await getSimilarMovies('tt26693752', 5, 0);

    expect(movies.length).toBeGreaterThan(0);
    expect(movies.length).toBeLessThanOrEqual(5);
    expect(movies[0]).toHaveProperty('title_id');
    expect(movies[0]).toHaveProperty('primary_title');
    expect(movies[0]).toHaveProperty('similarity_score');
  });

  it('returns movies ordered by descending similarity score', async () => {
    const movies = await getSimilarMovies('tt26693752', 10, 0);

    const scores = movies.map(movie => movie.similarity_score);

    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('respects pagination', async () => {
    const firstPage = await getSimilarMovies('tt26693752', 2, 0);
    const secondPage = await getSimilarMovies('tt26693752', 2, 2);

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);

    const firstIds = firstPage.map(movie => movie.title_id);
    const secondIds = secondPage.map(movie => movie.title_id);

    expect(firstIds.some(id => secondIds.includes(id))).toBe(false);
  });
});
