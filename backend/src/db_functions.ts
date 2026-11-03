//first import the pool to be able to connect to the databse
import { pool } from './db.js';

export interface Resultrows {
    //wip
}

//functions to call the SQL functions in the db
export async function simpleSearch(input:string): promise{
    //wip
    const result = await pool.query<Resultrows>
}