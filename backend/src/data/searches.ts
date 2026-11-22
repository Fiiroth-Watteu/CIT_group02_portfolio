import { pool } from '../db.js';

export interface searchHistory {
    user_id: number;
    search_input: string;
    searched_at: number;
}

export async function getSearchHistory(user: number, limit: number, offset: number): Promise<searchHistory[]>{
    const result = await pool.query<searchHistory>(
        `SELECT * FROM Get_search_history($1, $2, $3)`, [user, limit, offset]
    );
    return result.rows;
}