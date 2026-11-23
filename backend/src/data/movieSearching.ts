
import { pool } from '../db.js';

export interface Resultrows {
    title_id: string;
    primary_title: string;
}

export async function simpleSearch(
    input: string,
    userId: number | null,
    limit: number,
    offset: number
): Promise<Resultrows[]> {
    const result = await pool.query<Resultrows>(
        `SELECT BTRIM(title_id) AS title_id, primary_title
         FROM String_search($1, $2, $3, $4)`,
        [input, userId, limit + 1, offset]
    );

    return result.rows;
}

export async function structuredSearch(
    titleIn: string,
    plotIn: string,
    charIn: string,
    actorIn: string,
    userId: number | null,
    limit: number,
    offset: number
): Promise<Resultrows[]> {
    const result = await pool.query<Resultrows>(
        `SELECT BTRIM(title_id) AS title_id, primary_title
         FROM Structured_string_search($1, $2, $3, $4, $5, $6, $7)`,
        [titleIn, plotIn, charIn, actorIn, userId, limit + 1, offset]
    );

    return result.rows;
}
