import pg from 'pg';

// One pool for the whole application, created once (5-1, 8-1 "Supplying dependencies").
// Settings come from .env, loaded by `node --env-file=.env`.
export const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});
