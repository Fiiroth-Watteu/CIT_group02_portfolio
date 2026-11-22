import { pool } from '../db.js';

export interface ResultPerson {
    person_id: string;
    primary_name: string;
    birth_year: string;
    death_year: string;
}

export async function personNameSearch(input: string, limit: number, offset: number): Promise<ResultPerson[]>{
    const result = await pool.query<ResultPerson>(
        `SELECT * FROM find_person_by_name($1, $2, $3)`, [input, limit, offset]
    );
    return result.rows;
}

export async function personCoPlayers(target_person: string): Promise<ResultPerson[]>{
    const result = await pool.query<ResultPerson>(
        `SELECT * FROM find_co_players($1)`, [target_person]
    );
    return result.rows;
}

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

// Whether a person exists, so a route can answer 404 for an unknown id (api-design.md).
export async function personExists(nconst: string): Promise<boolean> {
  const result = await pool.query('SELECT 1 FROM person WHERE person_id = $1', [nconst]);
  return (result.rowCount ?? 0) > 0;
}