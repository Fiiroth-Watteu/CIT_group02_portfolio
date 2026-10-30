# CIT/P Portfolio Project – Movie application

- `backend/` – Subproject 2: REST API (TypeScript, Node.js, Express, node-postgres)
- `frontend/` – Subproject 3 (later)

## Getting started (backend)

```bash
cd backend
npm install
cp .env.example .env      # fill in your own database credentials
npm test                  # should pass before you change anything
npm run dev               # builds and starts on http://localhost:3000
```

Check: http://localhost:3000/api/health → `{"status":"ok"}`

## Structure (see 7-1, 7-2)

```
backend/src/
  app.ts          creates the app, middleware, mounts routers (exported for supertest)
  index.ts        starts the server
  db.ts           the pg pool, created once
  middleware/     error handler, 404, auth guards
  routes/         one Router per resource
  services/       operations, no HTTP
  data/           one module per table, all SQL
  auth/           crypto.ts: hashing and tokens
backend/tests/    Vitest + supertest
```

Dependencies only go one way: routes → services → data → db.

## Git workflow

- Never push to `main` directly. Work on your own branch and open a pull request.
- Keep your branch up to date: `git switch main && git pull && git switch <branch> && git merge main`
