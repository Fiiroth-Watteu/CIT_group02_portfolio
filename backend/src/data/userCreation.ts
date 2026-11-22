import { pool } from '../db.js';

export interface ResultString {
    message: string;
}

export async function createUser(username:string, email:string, password:string): Promise<ResultString[]> {

    const result = await pool.query<ResultString>(
        `SELECT create_user($1, $2, $3)`, [username, email, password]
    );
    
    return result.rows;
}