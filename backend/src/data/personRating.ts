import { pool } from '../db.js';

export interface PersonRating {
  person_id: string;
  primary_name: string;
  name_rating: string;
}

export async function getPersonRating(
  personName: string,
  limit: number = 10,
  offset: number = 0
): Promise<PersonRating[]> {
  const result = await pool.query<PersonRating>(
    `SELECT
       BTRIM(person_id) AS person_id,
       primary_name,
       name_rating
     FROM get_person_rating($1)
     ORDER BY name_rating DESC, BTRIM(person_id) ASC
     LIMIT $2 OFFSET $3`,
    [personName, limit, offset]
  );

  return result.rows;
}
