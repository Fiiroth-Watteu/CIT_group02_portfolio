import { describe, it, expect } from 'vitest';
import { getPersonRating } from '../src/data/personRating.js';

describe('Person rating database function', () => {
  it('returns matching persons in the correct order', async () => {
    const persons = await getPersonRating('Tom Hanks', 5, 0);

    expect(persons.length).toBeGreaterThan(0);
    expect(persons.length).toBeLessThanOrEqual(5);
    expect(persons[0]).toHaveProperty('person_id');
    expect(persons[0]).toHaveProperty('primary_name');
    expect(persons[0]).toHaveProperty('name_rating');
    expect(persons[0].primary_name).toBe('Tom Hanks');
  });

  it('returns an empty array when no person matches', async () => {
    const persons = await getPersonRating(
      'ThisPersonDoesNotExist12345',
      5,
      0
    );

    expect(persons).toEqual([]);
  });

  it('respects limit and offset', async () => {
    const firstPage = await getPersonRating('a', 3, 0);
    const secondPage = await getPersonRating('a', 3, 3);

    expect(firstPage).toHaveLength(3);
    expect(secondPage).toHaveLength(3);

    const firstPageIds = firstPage.map(person => person.person_id);
    const secondPageIds = secondPage.map(person => person.person_id);

    expect(firstPageIds).not.toEqual(secondPageIds);
    expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
  }, 15000);

  it('returns persons ordered by descending name rating', async () => {
    const persons = await getPersonRating('a', 10, 0);

    const ratings = persons.map(person => Number(person.name_rating));

    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });
});
