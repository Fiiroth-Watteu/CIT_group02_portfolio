import { pool } from '../db.js';

// Creates a user. passwordHash and salt are made by auth/crypto.ts, so the plain
// password never reaches the database (2-A.4).
// Returns the status text from Create_user, e.g. 'user has been created'.
export async function createUser(
  username: string, email: string, passwordHash: string, salt: string,
): Promise<string> {
  const result = await pool.query<{ message: string }>(
    'SELECT create_user($1, $2, $3, $4) AS message',
    [username, email, passwordHash, salt],
  );
  return result.rows[0].message;
}

export interface LoginRow {
  user_id: number;
  password_hash: string;
  salt: string | null;
}

// What login needs to check a password (security lecture I: look up salt and hash).
export async function findUserForLogin(username: string): Promise<LoginRow | undefined> {
  const result = await pool.query<LoginRow>(
    'SELECT user_id, password_hash, salt FROM users WHERE username = $1',
    [username],
  );
  return result.rows[0];
}

// Deletes a user by id. Only called after the guard has checked the token (2-D.6).
// Bookmarks, ratings and search history go with it (ON DELETE CASCADE in C2).
// Returns false if there was no such user.
export async function deleteUser(userId: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
  return (result.rowCount ?? 0) > 0;
}