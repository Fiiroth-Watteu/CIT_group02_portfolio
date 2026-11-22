//first import the pool to be able to connect to the databse
import { pool } from '../db.js';

export interface Resultrows {
    title_id: string;
    primary_title: string;
}

//functions to call the SQL functions in the db
export async function simpleSearch(input: string, limit: number, offset: number): Promise<Resultrows[]>{
    //wip
    const result = await pool.query<Resultrows>(
        `SELECT String_search($1,,$2,$3)`, [input, limit, offset]
    );
    return result.rows;
}

export async function structuredSearch(titleIn: string, plotIn: string, charIn: string, actorIn: string, limit: number, offset: number): Promise<Resultrows[]>{
    const result = await pool.query<Resultrows>(
        `SELECT * FROM Structured_string_search($1, $2, $3, $4,,$5,$6)`, [titleIn, plotIn, charIn, actorIn, limit, offset]
    );
    return result.rows;
}

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

// ---- Keyword search: exact, best and weighted match (1-D.11, 1-D.12, 1-D.14) ----

export type SearchMode = 'weighted' | 'best' | 'exact';

export interface TitleSearchRow {
  title_id: string;
  primary_title: string;
  start_year: string | null;
  rank: number | null;
}

// Function name and ORDER BY come from this fixed list, never from the client, so
// building them into the SQL text is safe. All client values go in as $1, $2, $3 (2-D.3).
// The ORDER BY is decided in database/subproject1-changes.md.
const SEARCHES: Record<SearchMode, { fn: string; rank: string; order: string }> = {
  weighted: { fn: 'weighted_match', rank: 's.rank::float8', order: 's.rank DESC, s.title_id ASC' },
  best:     { fn: 'best_match',     rank: 's.rank::float8', order: 's.rank DESC, s.title_id ASC' },
  exact:    { fn: 'exact_match',    rank: 'NULL::float8',   order: 's.title ASC, s.title_id ASC' },
};

// Fetches limit + 1 rows, so makePage can tell whether a next page exists.
export async function searchTitles(
  mode: SearchMode, keywords: string[], limit: number, offset: number,
): Promise<TitleSearchRow[]> {
  const s = SEARCHES[mode];
  const result = await pool.query<TitleSearchRow>(
    `SELECT BTRIM(s.title_id) AS title_id, s.title AS primary_title, t.start_year,
            ${s.rank} AS rank
     FROM ${s.fn}(VARIADIC $1::text[]) s
     JOIN title t ON t.title_id = s.title_id
     ORDER BY ${s.order}
     LIMIT $2 OFFSET $3`,
    [keywords, limit + 1, offset],
  );
  return result.rows;
}