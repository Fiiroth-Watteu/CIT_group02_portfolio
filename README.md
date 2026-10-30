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

Everyone works on their own branch. `main` is the shared version and must always build and pass the tests.

**First time:**
```bash
git switch main && git pull
git switch -c <your-name>
git push -u origin <your-name>
```

**While working on your branch:**
- Commit and push as often as you like: `git add .`, `git commit -m "..."`, `git push`
- Bring in the others' work regularly:
  ```bash
  git switch main && git pull
  git switch <your-name> && git merge main
  ```

**When something is finished, merge it into `main`:**
```bash
git switch <your-name> && git merge main   # get the latest main first, fix any conflicts
npm test && npm run build                  # both must pass
git switch main && git pull
git merge <your-name>
git push
git switch <your-name>                     # back to your branch
```

**Rules**
1. Never merge into `main` if `npm test` or `npm run build` fails.
2. Merge small and often (e.g. one route or data module at a time).
3. Say in the group chat when you change `src/app.ts`, since everyone mounts their routers there.
4. Never force-push (`--force`) to `main`.
5. Never commit `.env`. Copy `.env.example` instead and fill in your own values.
