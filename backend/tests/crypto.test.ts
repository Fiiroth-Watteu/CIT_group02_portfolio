import { describe, it, expect } from 'vitest';
import { generateSalt, hashPassword, verifyPassword } from '../src/auth/crypto.js';

describe('password hashing', () => {
  it('gives the same hash for the same salt and password', async () => {
    const salt = generateSalt();
    expect(await hashPassword(salt, 'pastalover')).toBe(await hashPassword(salt, 'pastalover'));
  });

  it('gives different hashes for different salts', async () => {
    expect(await hashPassword(generateSalt(), 'pastalover'))
      .not.toBe(await hashPassword(generateSalt(), 'pastalover'));
  });

  it('accepts the right password and rejects a wrong one', async () => {
    const salt = generateSalt();
    const hash = await hashPassword(salt, 'pastalover');
    expect(await verifyPassword('pastalover', salt, hash)).toBe(true);
    expect(await verifyPassword('wrong', salt, hash)).toBe(false);
  });
});