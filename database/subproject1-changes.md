# Changes to Subproject 1 (for the Subproject 2 report)

The report must explain every change to the Subproject 1 database.
This list tracks them: what changed, why, and what is still pending.

## Open questions

- How does the API let the user choose between `word_to_words_any` and
  `word_to_words_all` (e.g. `?match=all|any`)? Decide in 2-B.1.
- `person_words`: identify the person by id instead of name? Decide with the
  resource model (2-B.1).
- `weighted_match` treats multi-word terms ('mads mikkelsen') as one keyword.
  How does the API receive them? Decide in 2-B.1.
- Node must reject an empty keyword list with 400 (2-D.2).
- Can guests search, and are IR searches stored in search history? Proposed:
  everyone can search, IR searches not stored. Waiting for the group.
- Document how to load the IMDb source data from Moodle (rebuild prerequisite).

## Decided

### Paging of the keyword functions (1-D.11 to 1-D.14)
`exact_match`, `best_match`, `word_to_words_any`, `word_to_words_all`, `weighted_match`
- Paged in the data layer (Node) by wrapping the call:
  `SELECT * FROM f(VARIADIC $1::text[]) ORDER BY ... LIMIT $2 OFFSET $3`
- Why: the functions build their SQL dynamically. Paging inside them would mean
  changing the dynamic SQL now and again after the security lecture.
- Cost: the full result is computed for every page request (discuss in 2-C.2).
- May be moved into the functions when the dynamic SQL is rewritten (see Pending).

### word_to_words_any keeps UNION ALL (1-D.13)
- A title that matches several keywords appears once per matching keyword,
  so its words are counted that many times.
- Intended: titles matching more of the keywords are more relevant to the
  query, so their words weigh more (1-D.13: weights indicate relevance).

### Ordering of the keyword functions (1-D.11 to 1-D.14)

| Function | `ORDER BY` in the Node query |
|---|---|
| `exact_match` | `title ASC, title_id ASC` |
| `best_match` | `rank DESC, title_id ASC` |
| `weighted_match` | `rank DESC, title_id ASC` |
| `word_to_words_any` / `word_to_words_all` | `frequency DESC, word ASC` |

- The first key is what the user expects: best rank or highest frequency first.
  `exact_match` has no rank (all results match equally), so it is alphabetical
  by title, a column already in the result, so no extra data is needed.
- The second key is a unique tiebreaker, so the order is fully determined and
  pages never overlap or skip rows (7-1). `title_id` is unique per title;
  `word` is unique per row after `GROUP BY word`.

**Why the ordering and paging are in the Node query and not in the functions:**
- **Correctness:** paging is done by an outer `LIMIT`/`OFFSET` in Node. SQL does
  not guarantee that an ordering inside a function survives an outer query, so the
  `ORDER BY` must sit in the same query as the `LIMIT`/`OFFSET`. Putting it in the
  function as well would add nothing.
- **Maintainability:** the functions build their SQL dynamically, and that code is
  rewritten after the security lecture (see Pending). Not touching it now avoids
  changing it twice. Paging parameters, their defaults and limits, and the prev/next
  links all live in the backend, so all paging logic is in one place.
- **Testability:** the functions keep their Subproject 1 behaviour, so the existing
  1-F tests still apply. The ordering and paging can be tested in the data-access
  tests (2-E.2).
- **Cost (performance):** the function computes its full result on every page
  request, and PostgreSQL then discards everything except one page. For
  `best_match` and `word_to_words_any` on common words this can be many rows. If
  this becomes a problem, paging can move into the functions when they are rewritten.
- `person_words` is the exception: it pages inside the function, because it already
  had its own `LIMIT 10` (which would cut the result before an outer `LIMIT` could
  page it) and its SQL is static.

## Done

### person_words (1-D.10)
- Added optional parameters `limit_input` (default 10) and `offset_input` (default 0).
  - Why: 1-D.10 specifies an optional limit, and 2-A.3 requires every list to be paged.
  - Paging is inside the function because it had its own fixed `LIMIT 10`,
    which would make paging from outside impossible.
- Ordering changed to `frequency DESC, w.word ASC`.
  - Why: without a unique tiebreaker, words with equal frequency can come in any
    order, so pages can overlap or skip rows (7-1).
- Old calls such as `person_words('Tom Hanks')` behave as before.

### word_to_word / word_to_word1 (1-D.13)
- Renamed to `word_to_words_any` and `word_to_words_all`.
  - Why: the old names did not say how they differ. Both are kept because
    all-match gives the most relevant words but can be empty, while
    any-match always gives an answer but is dominated by generic words.
- Queries unchanged.

### Lowercasing of keywords (1-D.11 to 1-D.14)
- `exact_match`, `best_match`, `word_to_words_any`, `word_to_words_all` and
  `weighted_match` lowercase all keywords at the start of the function.
  - Why: every word in `wi` and `wi_weighted` is stored in lowercase, so
    `Apple` would otherwise match nothing.
  - Done in the function, not in Node, so it is guaranteed for every caller
    (Node, pgAdmin, the 1-F tests).
- The string-building lines are unchanged (they are rewritten after 18/11).

### rebuild_all.sql
- New script that drops the view and framework tables, then runs B2, C2 and
  the functions script in order.
  - Why: B2 is not re-runnable on its own once C2 and the functions exist,
    because the view and the framework tables depend on its tables.
- B2 and C2 themselves are unchanged.

## Pending (after the security lecture, 18/11)

- SQL injection in `exact_match`, `best_match`, `word_to_words_any`,
  `word_to_words_all`, `weighted_match`: keywords are concatenated into dynamic SQL.
  Rewrite with separate parameter passing (2-D.3).
- Add tests with a keyword containing `'` (e.g. `o'brien`); they must return a
  normal result, not an error.