import { pool } from '../db.js';

export interface givenRating {
    user: number;
    title: string;
    score: number;
}

export async function getRatingHistory(user: number, limit: number, offset: number): Promise<givenRating[]> {
    const result = await pool.query<givenRating>(
        `SELECT * FROM Get_rating_history($1, $2, $3)`, [user, limit, offset]
    );
    return result.rows;
}

export async function giveRating(user: number, title: string, score: number): Promise<string>{
    const result = await pool.query<{ message: string }>(
        `SELECT Give_rating($1, $2, $3) AS message`, [user, title, score]
    );
    return result.rows[0].message;
}

export async function deleteRating(user: number, title: string): Promise<string>{
    const result = await pool.query<{ message: string }>(
        `SELECT Delete_rating($1, $2) AS message`, [user, title]
    );
    return result.rows[0].message;
}