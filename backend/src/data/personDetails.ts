
import { pool } from '../db.js';

export interface PersonDetails {
  person_id: string;
  primary_name: string;
  birth_year: string | null;
  death_year: string | null;
  name_rating: string | null;
}

export async function getPersonById(
  personId: string
): Promise<PersonDetails | null> {
  const result = await pool.query<PersonDetails>(
    `SELECT
       BTRIM(person_id) AS person_id,
       primary_name,
       NULLIF(BTRIM(birth_year), '') AS birth_year,
       NULLIF(BTRIM(death_year), '') AS death_year,
       name_rating
     FROM person
     WHERE BTRIM(person_id) = $1
     LIMIT 1`,
    [personId]
  );

  return result.rows[0] ?? null;
}
