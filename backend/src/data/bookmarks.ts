import { pool } from '../db.js';

export interface bookmarks {
    user_id: number;
    bookmarked_id: string;
}

export async function getBookmarks(user: number, limit: number, offset: number): Promise<bookmarks[]>{
    const result = await pool.query<bookmarks>(
        `SELECT * FROM Get_bookmarks($1, $2, $3)`, [user, limit, offset]
    );
    return result.rows;
}

export interface ResultString {
    message: string;
}

export async function bookmarkTitle(user: number, title: string): Promise<ResultString[]>{
    const result = await pool.query<ResultString>(
        `SELECT create_title_bookmark($1, $2)`, [user, title]
    );

    return result.rows;
}

export async function deleteBookmarkTitle(user: number, title: string): Promise<ResultString[]>{
    const result = await pool.query<ResultString>(
        `SELECT delete_title_bookmark($1, $2)`, [user, title]
    );

    return result.rows;
}

export async function bookmarkPerson(user: number, person: string): Promise<ResultString[]>{
    const result = await pool.query<ResultString>(
        `SELECT create_person_bookmark($1, $2)`, [user, person]
    );

    return result.rows;
}

export async function deleteBookmarkPerson(user: number, person: string): Promise<ResultString[]>{
    const result = await pool.query<ResultString>(
        `SELECT delete_person_bookmark($1, $2)`, [user, person]
    );

    return result.rows;
}