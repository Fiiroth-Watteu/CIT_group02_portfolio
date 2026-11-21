
import { pool } from '../db.js';

export interface PopularActor {
  person_id: string;
  primary_name: string;
  name_rating: string | null;
}

export async function getPopularActors(
  tconst: string,
  limit: number,
  offset: number
): Promise<PopularActor[]> {
  const result = await pool.query<PopularActor>(
    `SELECT
       BTRIM(person_id) AS person_id,
       primary_name,
       name_rating
     FROM popular_actors($1)
     ORDER BY name_rating DESC NULLS LAST, BTRIM(person_id) ASC
     LIMIT $2 OFFSET $3`,
    [tconst, limit, offset]
  );

  return result.rows;
}
