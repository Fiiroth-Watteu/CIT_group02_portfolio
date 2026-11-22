import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

// Password hashing as in security lectures I and II.
const ITERATIONS = 1000;

// A new random salt per password (security lecture I, generateSalt()).
export function generateSalt(): string {
  return randomBytes(8).toString('hex');
}

// Iterative hashing (security lecture II): h1 = sha256(password + salt), h(i+1) = sha256(h(i)).
export async function hashPassword(salt: string, password: string): Promise<string> {
  let hash = createHash('sha256').update(password + salt).digest('hex');
  for (let i = 1; i < ITERATIONS; i++) {
    hash = createHash('sha256').update(hash).digest('hex');
  }
  return hash;
}

// salt and oldhash are looked up in the users table (security lecture I).
export async function verifyPassword(password: string, salt: string, oldhash: string): Promise<boolean> {
  const newhash = await hashPassword(salt, password);
  return newhash === oldhash;
}

/*
Whoever writes POST /api/users calls generateSalt(), then hashPassword(salt, password), then Create_user(username, email, hash, salt). 
Login fetches password_hash and salt by username, then calls verifyPassword.
*/

// The token carries only the user id: it is readable by whoever holds it,
// so it carries no secrets (8-2). Signed, so it cannot be changed without the secret
// (security lecture II).
export interface Claims {
  id: number;
}

const TOKEN_LIFETIME = '1h';

export function signToken(claims: Claims): string {
  return jwt.sign(claims, process.env.JWT_SECRET ?? '', { expiresIn: TOKEN_LIFETIME });
}

// Returns the claims if the token is valid and not expired, otherwise undefined.
export function verifyToken(token: string): Claims | undefined {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? '');
    if (typeof payload === 'object' && typeof payload.id === 'number') {
      return { id: payload.id };
    }
    return undefined;
  } catch {
    return undefined;
  }
}