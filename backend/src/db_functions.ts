//first import the pool to be able to connect to the databse
import { pool } from './db.js';

export interface Resultrows {
    //wip
    title_id: string;
    primary_title: string;
}

//functions to call the SQL functions in the db
export async function simpleSearch(input: string): Promise<Resultrows[]>{
    //wip
    const result = await pool.query<Resultrows>(
        `SELECT String_search($1)`, [input]
    );
    return result.rows;
}

export async function structuredSearch(titleIn: string, plotIn: string, charIn: string, actorIn: string): Promise<Resultrows[]>{
    const result = await pool.query<Resultrows>(
        `SELECT * FROM Structured_string_search($1, $2, $3, $4)`, [titleIn, plotIn, charIn, actorIn]
    );
    return result.rows;
}