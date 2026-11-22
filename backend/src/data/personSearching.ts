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