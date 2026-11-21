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