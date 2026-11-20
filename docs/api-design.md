# API design (raw material for 2-B.1)

## Conventions (6-2, slide 5)
- All URIs start with `/api/`.
- Nouns, not verbs; the HTTP method is the verb.
- Plural for collections, lowercase, hyphens for two-word names.
- At most two levels of nesting.
- Every list is paged with `?limit=&offset=` and has `prev`/`next` links (2-A.3).

## Routes

### Titles (read-only IMDb data)
```
GET    /api/titles?q=…&mode=weighted|best|exact|simple    search; weighted is the default
GET    /api/titles?title=…&plot=…&characters=…&person=…&mode=structured
GET    /api/titles/{tconst}                               details
GET    /api/titles/{tconst}/similar                       similar movies (1-D.9)
GET    /api/titles/{tconst}/actors                        popular actors (1-D.8)
```
`q` may be repeated for several keywords: `?q=adams&q=mads mikkelsen`.

### Persons (read-only IMDb data)
```
GET    /api/persons?name=…                                find person (1-D.5)
GET    /api/persons/{nconst}                              details + name rating (1-D.7)
GET    /api/persons/{nconst}/co-players                   co-players (1-D.6)
GET    /api/persons/{nconst}/words                        person words (1-D.10)
```

### Words (read-only IMDb data)
```
GET    /api/words?q=…&match=all|any                       word-to-words (1-D.13)
```

### Users and authentication (framework data)
```
POST   /api/users                                         create user
POST   /api/tokens                                        log in (open route, 8-2)
GET    /api/users/{id}                                    see user
PATCH  /api/users/{id}                                    change part of a user
DELETE /api/users/{id}                                    delete user

GET    /api/users/{id}/title-bookmarks                    title bookmarks (1-D.1)
POST   /api/users/{id}/title-bookmarks
DELETE /api/users/{id}/title-bookmarks/{tconst}

GET    /api/users/{id}/person-bookmarks                   person bookmarks (1-D.1)
POST   /api/users/{id}/person-bookmarks
DELETE /api/users/{id}/person-bookmarks/{nconst}

GET    /api/users/{id}/ratings                            rating history
PUT    /api/users/{id}/ratings/{tconst}                   give or change rating (1-D.3)
DELETE /api/users/{id}/ratings/{tconst}

GET    /api/users/{id}/searches                           search history
DELETE /api/users/{id}/searches
```

## Decisions and reasons
- **`co-players`**, not `coplayers`: lowercase with hyphens for two-word names (6-2, slide 5).
- **`POST /api/tokens`** for login: logging in creates a token, and 6-2 prefers nouns
  over verbs. (8-2 uses `/auth`, which would also be acceptable.)
- **Two bookmark collections** (`title-bookmarks`, `person-bookmarks`): clearer than one
  mixed collection, matches the two tables, and each DELETE takes one kind of id.
- **`PATCH`** for changing a user: a user changes part of their profile (e.g. email or
  password), not the whole resource (6-2, slide 6).
- **`/users/{id}/…`** rather than `/users/me/…`: the URI identifies one specific resource
  (2-A.2). The id in the URI must match the id in the token, otherwise 403 (8-2). The
  check does not need the database, so it can be middleware (2-C.7).
- **All title searches are modes of `GET /api/titles`**: they all return titles (6-1:
  place by what is returned). Simple and structured search also store search history for
  logged-in users, which makes them not strictly safe (4-4, slide 5). Accepted, because
  the history entry is a record of the read, not something the client asks to create,
  and GET keeps search results linkable (3-E.4).

## Open
- Status codes for each route (6-2, slide 11). Next step.
- Simple and structured search fail for guests: `search_history.user_id` is NOT NULL.
  Either the function skips the INSERT when there is no user, or those modes require
  login. The owner of 1-D.2 / 1-D.4 decides.
- Whether a "top 10" route is needed (depends on the user stories).