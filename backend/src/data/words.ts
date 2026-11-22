import { pool } from '../db.js';

export type MatchMode = 'all' | 'any';

export interface WordRow {
  word: string;
  frequency: number;
}

// Function names come from this fixed list, never from the client (2-D.3).
const WORD_FUNCTIONS: Record<MatchMode, string> = {
  all: 'word_to_words_all',
  any: 'word_to_words_any',
};

// Fetches limit + 1 rows for makePage. ORDER BY as decided in subproject1-changes.md.
export async function relatedWords(
  match: MatchMode, keywords: string[], limit: number, offset: number,
): Promise<WordRow[]> {
  const result = await pool.query<WordRow>(
    `SELECT word, frequency::int AS frequency
     FROM ${WORD_FUNCTIONS[match]}(VARIADIC $1::text[])
     ORDER BY frequency DESC, word ASC
     LIMIT $2 OFFSET $3`,
    [keywords, limit + 1, offset],
  );
  return result.rows;
}

// Words in the titles a person is involved in (1-D.10). The function pages internally
// (subproject1-changes.md), so limit + 1 is passed to it for makePage.
export async function personWords(nconst: string, limit: number, offset: number): Promise<WordRow[]> {
    const result = await pool.query<WordRow>(
      `SELECT word, frequency::int AS frequency
       FROM person_words($1, $2, $3)
       ORDER BY frequency DESC, word ASC`,
      [nconst, limit + 1, offset],
    );
    return result.rows;
  }