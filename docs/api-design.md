# API design (raw material for 2-B.1)

## Conventions (6-2, slide 5)
- All URIs start with `/api/`.
- Nouns, not verbs; the HTTP method is the verb.
- Plural for collections, lowercase, hyphens for two-word names.
- At most two levels of nesting.

## Paging (2-A.3)
- Every list is paged with `?limit=&offset=` and has `prev`/`next` links.
- `limit` defaults to 20 (minimum 1, maximum 100). `offset` defaults to 0.
- Invalid values are clamped to this range (7-1, slide 7), so paging never gives 400.

## Status code rules

### All routes
- **500** applies to every route and is handled centrally (2-D.5).
- **400** when a parameter or the request body is missing or invalid (2-D.2).
- **An empty list is never 404.** It is 200 + `[]` (6-2, slide 11).

### Read-only routes (IMDb data)
- **One resource by id** (e.g. `/titles/{tconst}`): 404 if the id does not exist.
- **List under an id** (e.g. `/titles/{tconst}/similar`): 404 only if the parent does not exist.
- **Search with parameters** (e.g. `/titles?q=…`): no id in the path, so never 404.

### Framework routes (user data)
- **Guarded:** every route under `/api/users/{id}`, including `/users/{id}` itself, requires a
  valid token. **401** if the token is missing, invalid or expired. **403** if the id in the URI
  is not the id in the token (8-2).
- **Open:** `POST /api/users` and `POST /api/tokens` require no token (8-2: login is open).
- **Created:** a `POST` that creates a resource gives **201** + a `Location` header (6-2, slide 11).
- **Deleted:** a successful `DELETE` gives **204** with no body (6-2, slide 11).
- **Conflict:** **409** when the request clashes with an existing resource (e.g. a taken username).

## Routes

### Titles (read-only IMDb data)
```
GET    /api/titles?q=…&mode=weighted|best|exact|simple                    200 | 400         search; weighted is the default
GET    /api/titles?title=…&plot=…&characters=…&person=…&mode=structured   200 | 400         structured search
GET    /api/titles/{tconst}                                               200 | 404         details
GET    /api/titles/{tconst}/similar                                       200 | 404         similar movies (1-D.9)
GET    /api/titles/{tconst}/actors                                        200 | 404         popular actors (1-D.8)
```
- Search: 400 if `q` is missing or `mode` is unknown. `q` may be repeated for several
  keywords: `?q=adams&q=mads mikkelsen`.
- Structured search: 400 if all four fields (`title`, `plot`, `characters`, `person`) are missing.

### Persons (read-only IMDb data)
```
GET    /api/persons?name=…                                                200 | 400         find person (1-D.5)
GET    /api/persons/{nconst}                                              200 | 404         details + name rating (1-D.7)
GET    /api/persons/{nconst}/co-players                                   200 | 404         co-players (1-D.6)
GET    /api/persons/{nconst}/words                                        200 | 404         person words (1-D.10)
```
- Find person: 400 if `name` is missing.
- Person words: a person whose titles have no indexed words gives 200 + `[]`.

### Words (read-only IMDb data)
```
GET    /api/words?q=…&match=all|any                                       200 | 400         word-to-words (1-D.13)
```
- 400 if `q` is missing or `match` is unknown.

### Users and authentication (framework data)
```
POST   /api/users                                                         201 | 400 | 409                     create user
POST   /api/tokens                                                        200 | 400 | 401                     log in (open)
GET    /api/users/{id}                                                    200 | 401 | 403 | 404               see user
PATCH  /api/users/{id}                                                    200 | 400 | 401 | 403 | 404 | 409   change part of a user
DELETE /api/users/{id}                                                    204 | 401 | 403 | 404               delete user
```

### Bookmarks (framework data)
```
GET    /api/users/{id}/title-bookmarks                                    200 | 401 | 403                     title bookmarks (1-D.1)
POST   /api/users/{id}/title-bookmarks                                    201 | 400 | 401 | 403 | 409
DELETE /api/users/{id}/title-bookmarks/{tconst}                           204 | 401 | 403 | 404

GET    /api/users/{id}/person-bookmarks                                   200 | 401 | 403                     person bookmarks (1-D.1)
POST   /api/users/{id}/person-bookmarks                                   201 | 400 | 401 | 403 | 409
DELETE /api/users/{id}/person-bookmarks/{nconst}                          204 | 401 | 403 | 404
```

### Ratings and search history (framework data)
```
GET    /api/users/{id}/ratings                                            200 | 401 | 403                     rating history
PUT    /api/users/{id}/ratings/{tconst}                                   200 | 400 | 401 | 403 | 404         give or change rating (1-D.3)
DELETE /api/users/{id}/ratings/{tconst}                                   204 | 401 | 403 | 404

GET    /api/users/{id}/searches                                           200 | 401 | 403                     search history
DELETE /api/users/{id}/searches                                           204 | 401 | 403
```

## Representations (2-B.2)

Field names are snake_case. A field with no value is `null`, never left out.
Years and numbers are JSON numbers. Timestamps are ISO 8601 strings
(e.g. `"2026-11-20T13:54:00Z"`).

### Lists (2-A.3)
Every list is returned as a page object. Example: the second page of a search,
requested with `limit=20&offset=20`:
```json
{
  "items": [ … ],
  "prev": "/api/titles?q=twilight&limit=20&offset=0",
  "next": "/api/titles?q=twilight&limit=20&offset=40"
}
```
- `prev` is `null` on the first page. `next` is `null` on the last page.
- `prev` and `next` keep all other query parameters of the request (e.g. `q`, `mode`).

### References to resources (2-A.2)
Every resource in a response is identified by a relative URI in a `url` field, never by a
bare id. Related resources appear in their short form:
```json
{ "url": "/api/titles/tt0052520", "primary_title": "The Twilight Zone", "start_year": 1959 }
```

### Errors
Every error response has the same shape:
```json
{ "error": "No such title" }
```
The message never contains a stack trace, SQL text or database identifiers (2-A.4).

### Title
… (continue with the Title, Person, List items, User, Token, Bookmarks and Request bodies
sections from the other block)

## Resource representations (2-B.2)

Field names are snake_case. A field with no value is `null`, never left out.
Years and numbers are JSON numbers. Timestamps are ISO 8601 strings
(e.g. `"2026-11-20T13:54:00Z"`).

### Title
Short form, used in every list and wherever a title is referred to:
```json
{ "url": "/api/titles/tt0052520", "primary_title": "The Twilight Zone", "start_year": 1959 }
```
Full form, `GET /api/titles/{tconst}`:
```json
{
  "url": "/api/titles/tt0052520",
  "type": "tvSeries",
  "primary_title": "The Twilight Zone",
  "original_title": "The Twilight Zone",
  "is_adult": false,
  "start_year": 1959,
  "end_year": 1964,
  "runtime": 50,
  "plot": "…",
  "poster": "https://m.media-amazon.com/images/…",
  "genres": [ "Drama", "Fantasy", "Horror" ],
  "avg_rating": 9.0,
  "votes": 109820,
  "similar": "/api/titles/tt0052520/similar",
  "actors": "/api/titles/tt0052520/actors"
}
```

### Person
Short form:
```json
{ "url": "/api/persons/nm0000158", "primary_name": "Tom Hanks" }
```
Full form, `GET /api/persons/{nconst}`:
```json
{
  "url": "/api/persons/nm0000158",
  "primary_name": "Tom Hanks",
  "birth_year": 1956,
  "death_year": null,
  "name_rating": 8.02,
  "co_players": "/api/persons/nm0000158/co-players",
  "words": "/api/persons/nm0000158/words"
}
```

### List items (inside `items` of a page)
| Route | Item |
|---|---|
| `GET /api/titles?q=…` (weighted, best) | short title + `"rank"` (number) |
| `GET /api/titles?q=…` (exact, simple, structured) | short title |
| `GET /api/titles/{tconst}/similar` | short title + `"similarity_score"` (number) |
| `GET /api/titles/{tconst}/actors` | short person + `"name_rating"` (number or `null`) |
| `GET /api/persons?name=…` | short person + `"birth_year"`, `"death_year"`, `"name_rating"` |
| `GET /api/persons/{nconst}/co-players` | short person + `"frequency"` (number) |
| `GET /api/persons/{nconst}/words`, `GET /api/words` | `{ "word": "…", "frequency": … }` |

### User
`GET /api/users/{id}`, and the response to `POST /api/users` and `PATCH /api/users/{id}`:
```json
{
  "url": "/api/users/5",
  "username": "jonas",
  "email": "jonas@example.com",
  "title_bookmarks": "/api/users/5/title-bookmarks",
  "person_bookmarks": "/api/users/5/person-bookmarks",
  "ratings": "/api/users/5/ratings",
  "searches": "/api/users/5/searches"
}
```

### Token
Response to `POST /api/tokens`:
```json
{ "token": "eyJhbGciOi…", "user": "/api/users/5" }
```

### Bookmarks, ratings, searches (items in the user's lists)
```json
{ "url": "/api/users/5/title-bookmarks/tt0052520", "title": { short title } }
{ "url": "/api/users/5/person-bookmarks/nm0000158", "person": { short person } }
{ "url": "/api/users/5/ratings/tt0052520", "title": { short title }, "rating_score": 9, "rated_at": "2026-11-20T13:54:00Z" }
{ "search_input": "simple search: twilight", "searched_at": "2026-11-20T13:54:00Z" }
```

### Request bodies
```
POST   /api/users                          { "username", "email", "password" }
POST   /api/tokens                         { "username", "password" }
PATCH  /api/users/{id}                     any of { "email", "password" }
POST   /api/users/{id}/title-bookmarks     { "title": "/api/titles/tt0052520" }
POST   /api/users/{id}/person-bookmarks    { "person": "/api/persons/nm0000158" }
PUT    /api/users/{id}/ratings/{tconst}    { "rating_score": 9 }
```

## Decisions and reasons

### Routes
- **`co-players`**, not `coplayers`: lowercase with hyphens for two-word names (6-2, slide 5).
- **`POST /api/tokens`** for login: logging in creates a token, and 6-2 prefers nouns over
  verbs. (8-2 uses `/auth`, which would also be acceptable.)
- **Two bookmark collections** (`title-bookmarks`, `person-bookmarks`): clearer than one mixed
  collection, matches the two tables, and each DELETE takes one kind of id.
- **`PATCH`** for changing a user: a user changes part of their profile (e.g. email or
  password), not the whole resource (6-2, slide 6).
- **`/users/{id}/…`** rather than `/users/me/…`: the URI identifies one specific resource
  (2-A.2). The check that the id matches the token does not need the database, so it can be
  middleware (2-C.7).
- **All title searches are modes of `GET /api/titles`**: they all return titles (6-1: place by
  what is returned). Simple and structured search also store search history for logged-in
  users, which makes them not strictly safe (4-4, slide 5). Accepted, because the history entry
  is a record of the read, not something the client asks to create, and GET keeps search
  results linkable (3-E.4).

### Status codes
- **409 for duplicates:** creating a user with a taken username or email, changing to a taken
  email, or bookmarking something already bookmarked clashes with an existing resource.
  (409 is standard HTTP, not covered in the slides.)
- **Login gives 200, not 201:** the token is returned to the client but not stored as a
  resource on the server, so nothing with a URI is created.
- **Wrong username or password gives one 401 with the same message:** saying which one was
  wrong would tell an attacker which usernames exist.
- **PATCH returns 200 with the updated user**, so the client sees the result without a
  second request.
- **Bookmarking a title that does not exist gives 400:** the URI points to the bookmark
  collection, which exists. The invalid `tconst` is in the request body, so it is a bad
  request, not a missing resource.
- **PUT on a rating always gives 200**, whether it creates or replaces the rating: simpler for
  the client, and PUT is idempotent (4-4, slide 5). 400 if the score is not a whole number
  1–10. 404 if the title in the path does not exist.
- **DELETE of something that does not exist gives 404**, so the client learns it made a
  mistake. Deleting the whole search history gives 204 even if it was already empty.

### Representations
- **Page object with `items`, `prev`, `next`:** one shape for every list, so the client
  handles paging the same way everywhere.
- **`null` when there is no previous or next page:** the fields always exist, so the client
  only has to check for `null`.
- **Relative URIs:** they do not depend on the host the backend runs on.
- **URI only, no separate id field:** 2-A.2 requires resources to be identified by URI. The
  id is part of the URI.
- **Error format `{ "error": "…" }`:** one simple shape for every error (2-B.2), as used in
  the skeleton's error handler.

## Open
- Simple and structured search fail for guests: `search_history.user_id` is NOT NULL.
  Either the function skips the INSERT when there is no user, or those modes require
  login. The owner of 1-D.2 / 1-D.4 decides.
- Delete user: if the password must be sent to confirm, a wrong password gives 403.
  Agree with the owner of the user routes.
- Whether a "top 10" route is needed (depends on the user stories).