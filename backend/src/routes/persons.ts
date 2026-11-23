
import { Router } from 'express';
import { getPersonById } from '../data/personDetails.js';

export const personRouter = Router();

// 1-D.7: Get a person's details and name rating.
personRouter.get('/:nconst', async (req, res, next) => {
  try {
    const nconst = req.params.nconst;
    const person = await getPersonById(nconst);

    if (!person) {
      res.status(404).json({ error: 'No such person' });
      return;
    }

    res.json({
      url: `/api/persons/${person.person_id}`,
      primary_name: person.primary_name,
      birth_year: person.birth_year === null
        ? null
        : Number(person.birth_year),
      death_year: person.death_year === null
        ? null
        : Number(person.death_year),
      name_rating: person.name_rating === null
        ? null
        : Number(person.name_rating),
      co_players: `/api/persons/${person.person_id}/co-players`,
      words: `/api/persons/${person.person_id}/words`
    });
  } catch (error) {
    next(error);
  }
});
