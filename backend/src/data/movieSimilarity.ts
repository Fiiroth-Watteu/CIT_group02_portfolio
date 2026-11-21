import { pool } from '../db.js';

export interface SimilarMovie {
  title_id: string;
  primary_title: string;
  similarity_score: number;
}

export async function getSimilarMovies(
  tconst: string,
  limit: number,
  offset: number
): Promise<SimilarMovie[]> {
  const result = await pool.query<SimilarMovie>(
    `SELECT
       BTRIM(title_id) AS title_id,
       primary_title,
       similarity_score
     FROM movie_similarity($1, $2, $3)`,
    [tconst, limit, offset]
  );

  return result.rows;
}