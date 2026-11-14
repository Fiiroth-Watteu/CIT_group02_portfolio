import { describe, it, expect } from 'vitest';
import { getPopularActors } from '../src/data/popularActors.js';
import { getSimilarMovies } from '../src/data/movieSimilarity.js';

describe('Movie database functions', () => {
  it('getPopularActors returns up to 5 actors', async () => {
    const actors = await getPopularActors('tt26693752', 5, 0);

    expect(actors.length).toBeLessThanOrEqual(5);
    expect(actors.length).toBeGreaterThan(0);
    expect(actors[0]).toHaveProperty('person_id');
    expect(actors[0]).toHaveProperty('primary_name');
    expect(actors[0]).toHaveProperty('name_rating');
  });

  it('getSimilarMovies returns up to 5 similar movies', async () => {
    const movies = await getSimilarMovies('tt26693752', 5, 0);

    expect(movies.length).toBeLessThanOrEqual(5);
    expect(movies.length).toBeGreaterThan(0);
    expect(movies[0]).toHaveProperty('title_id');
    expect(movies[0]).toHaveProperty('primary_title');
    expect(movies[0]).toHaveProperty('similarity_score');
  });
});