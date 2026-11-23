
import { Router } from 'express';
import { pool } from '../db.js';
import { getPopularActors } from '../data/popularActors.js';
import { getSimilarMovies } from '../data/movieSimilarity.js';
import { readPageParams, makePage } from '../paging.js';

export const titleRouter = Router();

// Check whether the parent title exists.
async function titleExists(tconst: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1
     FROM title
     WHERE BTRIM(title_id) = $1
     LIMIT 1`,
    [tconst]
  );

  return result.rows.length > 0;
}

// 1-D.8: Popular actors for a title.
titleRouter.get('/:tconst/actors', async (req, res, next) => {
  try {
    const tconst = req.params.tconst;

    if (!(await titleExists(tconst))) {
      res.status(404).json({ error: 'No such title' });
      return;
    }

    const params = readPageParams(req.query);

    const actors = await getPopularActors(
      tconst,
      params.limit + 1,
      params.offset
    );

    const items = actors.map(actor => ({
      url: `/api/persons/${actor.person_id.trim()}`,
      primary_name: actor.primary_name,
      name_rating:
        actor.name_rating === null ? null : Number(actor.name_rating)
    }));

    res.json(makePage(items, params, req.originalUrl));
  } catch (error) {
    next(error);
  }
});

// 1-D.9: Similar movies for a title.
titleRouter.get('/:tconst/similar', async (req, res, next) => {
  try {
    const tconst = req.params.tconst;

    if (!(await titleExists(tconst))) {
      res.status(404).json({ error: 'No such title' });
      return;
    }

    const params = readPageParams(req.query);

    const movies = await getSimilarMovies(
      tconst,
      params.limit + 1,
      params.offset
    );

    const items = movies.map(movie => ({
      url: `/api/titles/${movie.title_id.trim()}`,
      primary_title: movie.primary_title,
      similarity_score: Number(movie.similarity_score)
    }));

    res.json(makePage(items, params, req.originalUrl));
  } catch (error) {
    next(error);
  }
});
