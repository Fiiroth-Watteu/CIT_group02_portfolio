
import { describe, it, expect } from 'vitest';
import { getPersonRating } from '../src/data/personRating.js';

describe('Person rating database function', () => {
  it('getPersonRating returns matching persons', async () => {
    const persons = await getPersonRating('Tom Hanks', 5, 0);

    expect(persons.length).toBeGreaterThan(0);
    expect(persons.length).toBeLessThanOrEqual(5);
    expect(persons[0]).toHaveProperty('person_id');
    expect(persons[0]).toHaveProperty('primary_name');
    expect(persons[0]).toHaveProperty('name_rating');
    expect(persons[0].primary_name).toBe('Tom Hanks');
  });

  it('getPersonRating returns an empty array when no person matches', async () => {
    const persons = await getPersonRating(
      'ThisPersonDoesNotExist12345',
      5,
      0
    );

    expect(persons).toEqual([]);
  });
});
