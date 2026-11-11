-- Combined function and test script for subproject 1 (1-D, 1-F)
--
-- Prerequisites (run first):
--   * B2_build_movie_db.sql (title, person, casted_as, genre, ratings, ...)
--   * the framework tables: users, title_bookmark, person_bookmark,
--     rating_history, search_history
--   * the loaded word index table wi
--
-- The script can be rerun: functions are replaced, the tests use a fixed
-- test user that is looked up by name, and wi_weighted is dropped and rebuilt.
-- Only the new tables are used (title, person, casted_as, genre, ...), so the
-- script keeps working after the source tables have been deleted.
--
-- Run with:
--   psql -U postgres -a -d imdb -f subproject1_functions_and_tests.sql > output.txt 2>&1
-- (2>&1 so RAISE NOTICE output, i.e. the dynamically built queries, ends up in the file too)


-- 1-D.1 Basic framework functionality

-- Create a user if the username isn't taken and the email isn't tied to a user.
-- Note: the password is stored as plain text, not as a hash.
CREATE OR REPLACE FUNCTION Create_user (name_input VARCHAR(100), email_input VARCHAR(255), pass_input TEXT)
RETURNS VARCHAR
LANGUAGE plpgsql AS $$
  DECLARE status_output VARCHAR := 'start';
  BEGIN
    IF EXISTS (SELECT * FROM users WHERE name_input = users.username) THEN
      status_output := 'username already taken';
    END IF;
    IF EXISTS (SELECT * FROM users WHERE email_input = users.email) THEN
      status_output := 'email already has a user';
    END IF;
    IF status_output = 'start' THEN
      INSERT INTO users(username, email, password_hash) VALUES (name_input, email_input, pass_input);
      status_output := 'user has been created';
    END IF;
    RETURN status_output;
  END;
$$;

-- Delete a user. The password is required to make sure the owner requests it.
CREATE OR REPLACE FUNCTION Delete_user (name_input VARCHAR(100), pass_input TEXT)
RETURNS VARCHAR
LANGUAGE plpgsql AS $$
  DECLARE status_output VARCHAR := 'start';
  BEGIN
    IF NOT EXISTS (SELECT * FROM users WHERE name_input = users.username) THEN
      status_output := 'user not found';
    END IF;
    IF EXISTS (SELECT * FROM users WHERE name_input = users.username AND pass_input <> users.password_hash) THEN
      status_output := 'incorrect password';
    END IF;
    IF status_output = 'start' THEN
      DELETE FROM users
      WHERE name_input = users.username AND pass_input = users.password_hash;
      status_output := 'user "' || name_input ||  '" has been deleted';
    END IF;
    RETURN status_output;
  END;
$$;

-- Bookmark entry between a user and a title
CREATE OR REPLACE FUNCTION Create_title_bookmark (name_input INT, title_input CHAR(10))
RETURNS VARCHAR
LANGUAGE plpgsql AS $$
  DECLARE status_output VARCHAR := 'start';
  BEGIN
    IF NOT EXISTS (SELECT * FROM title WHERE title_input = title.title_id) THEN
      status_output := 'title not found';
    END IF;
    IF NOT EXISTS (SELECT * FROM users WHERE name_input = users.user_id) THEN
      status_output := 'user not found';
    END IF;
    IF EXISTS (SELECT * FROM title_bookmark WHERE name_input = title_bookmark.user_id AND title_input = title_bookmark.title_id) THEN
      status_output := 'bookmark already exists';
    END IF;
    IF status_output = 'start' THEN
      INSERT INTO title_bookmark (user_id, title_id)
      VALUES (name_input, title_input);
      status_output = 'user with ID ' || name_input || ' has bookmarked title with ID ' || title_input;
    END IF;
    RETURN status_output;
  END;
$$;

CREATE OR REPLACE FUNCTION Delete_title_bookmark (name_input INT, title_input CHAR(10))
RETURNS VARCHAR
LANGUAGE plpgsql AS $$
  DECLARE status_output VARCHAR := 'start';
  BEGIN
    IF NOT EXISTS (SELECT * FROM title_bookmark WHERE name_input = title_bookmark.user_id AND title_input = title_bookmark.title_id) THEN
      status_output := 'bookmark not found';
    END IF;
    IF status_output = 'start' THEN
      DELETE FROM title_bookmark
      WHERE name_input = title_bookmark.user_id AND title_input = title_bookmark.title_id;
      status_output := 'bookmark for title with ID ' || title_input || ' has been deleted';
    END IF;
    RETURN status_output;
  END;
$$;

-- Bookmark entry between a user and a person
CREATE OR REPLACE FUNCTION Create_person_bookmark (name_input INT, person_input CHAR(10))
RETURNS VARCHAR
LANGUAGE plpgsql AS $$
  DECLARE status_output VARCHAR := 'start';
  BEGIN
    IF NOT EXISTS (SELECT * FROM person WHERE person_input = person.person_id) THEN
      status_output := 'person not found';
    END IF;
    IF NOT EXISTS (SELECT * FROM users WHERE name_input = users.user_id) THEN
      status_output := 'user not found';
    END IF;
    IF EXISTS (SELECT * FROM person_bookmark WHERE name_input = person_bookmark.user_id AND person_input = person_bookmark.person_id) THEN
      status_output := 'bookmark already exists';
    END IF;
    IF status_output = 'start' THEN
      INSERT INTO person_bookmark (user_id, person_id)
      VALUES (name_input, person_input);
      status_output = 'user with ID ' || name_input || ' has bookmarked person with ID ' || person_input;
    END IF;
    RETURN status_output;
  END;
$$;

CREATE OR REPLACE FUNCTION Delete_person_bookmark (user_input INT, person_input CHAR(10))
RETURNS VARCHAR
LANGUAGE plpgsql AS $$
  DECLARE status_output VARCHAR := 'start';
  BEGIN
    IF NOT EXISTS (SELECT * FROM person_bookmark WHERE user_input = person_bookmark.user_id AND person_input = person_bookmark.person_id) THEN
      status_output := 'bookmark not found';
    END IF;
    IF status_output = 'start' THEN
      DELETE FROM person_bookmark
      WHERE user_input = person_bookmark.user_id AND person_input = person_bookmark.person_id;
      status_output := 'bookmark for person with ID ' || person_input || ' has been deleted';
    END IF;
    RETURN status_output;
  END;
$$;

-- Retrieve title and person bookmarks for a user.
-- Title IDs and person IDs can be told apart by the first two characters (tt / nm).
CREATE OR REPLACE FUNCTION Get_bookmarks (user_input INT, limit_input INT DEFAULT 10, offset_input INT DEFAULT 0)
RETURNS TABLE (
  user_id int,
  bookmarked_id CHAR(10)
)
LANGUAGE plpgsql AS $$
  BEGIN
    RETURN QUERY
    (SELECT * FROM title_bookmark WHERE user_input = title_bookmark.user_id)
    UNION
    (SELECT * FROM person_bookmark WHERE user_input = person_bookmark.user_id)
    LIMIT limit_input OFFSET offset_input;
  END;
$$;

-- Retrieve search history for a user
CREATE OR REPLACE FUNCTION Get_search_history (user_input INT, limit_input INT DEFAULT 10, offset_input INT DEFAULT 0)
RETURNS TABLE (
  user_id INT,
  search_input TEXT,
  searched_at TIMESTAMP
)
LANGUAGE plpgsql AS $$
  BEGIN
    RETURN QUERY
    SELECT search_history.user_id, search_history.search_input, search_history.searched_at
    FROM search_history WHERE user_input = search_history.user_id
    LIMIT limit_input OFFSET offset_input;
  END;
$$;

-- Retrieve rating history for a user
CREATE OR REPLACE FUNCTION Get_rating_history (user_input INT, limit_input INT DEFAULT 10, offset_input INT DEFAULT 0)
RETURNS TABLE (
  user_id INT,
  title_id CHAR(10),
  rating_score INT4,
  rated_at TIMESTAMP
)
LANGUAGE plpgsql AS $$
  BEGIN
    RETURN QUERY
    SELECT rating_history.user_id, rating_history.title_id, rating_history.rating_score, rating_history.rated_at FROM rating_history WHERE user_input = rating_history.user_id LIMIT limit_input OFFSET offset_input;
  END;
$$;

-- Test helper: ID of the test user. Looked up by name, so the tests do not
-- depend on the (ever increasing) user ID counter.
CREATE OR REPLACE FUNCTION test_user_id() RETURNS INT
LANGUAGE sql AS $$ SELECT user_id FROM users WHERE username = 'test' $$;

-- Test: create user (before / after)
SELECT user_id, username, email FROM users WHERE username = 'test';
SELECT Create_user('test', 'test@test.test', 'testpass');
SELECT user_id, username, email FROM users WHERE username = 'test';

-- Test: delete user, using a separate temporary user (before / after)
SELECT Create_user('temp_user', 'temp@test.test', 'temppass');
SELECT user_id, username FROM users WHERE username = 'temp_user';
SELECT Delete_user('temp_user', 'temppass');
SELECT user_id, username FROM users WHERE username = 'temp_user';

-- Test: bookmarks (before / after create / after delete).
-- Note the trailing space in the IDs: the columns are CHAR(10) and the IDs are 9 characters.
SELECT * FROM Get_bookmarks (test_user_id());
SELECT Create_title_bookmark (test_user_id(), 'tt0052520 ');
SELECT Create_person_bookmark (test_user_id(), 'nm0000001 ');
SELECT * FROM Get_bookmarks (test_user_id());
SELECT Delete_title_bookmark (test_user_id(), 'tt0052520 ');
SELECT Delete_person_bookmark (test_user_id(), 'nm0000001 ');
SELECT * FROM Get_bookmarks (test_user_id());


-- 1-D.2 Simple search

-- Find titles where the search string is a substring of the title.
-- The search is stored in the search history as a side effect.
CREATE OR REPLACE FUNCTION String_search(S_input VARCHAR(255), user_searching int, limit_input INT DEFAULT 10, offset_input INT DEFAULT 0)
RETURNS TABLE (
  Title_ID CHAR(10),
  primary_title TEXT
)
LANGUAGE plpgsql AS $$
  BEGIN
    RETURN QUERY
    SELECT title.title_id, title.primary_title FROM "public".title WHERE title.primary_title ILIKE '%' || S_input || '%' LIMIT limit_input OFFSET offset_input;
    
    INSERT INTO search_history (user_id, search_input)
    VALUES (user_searching, 'simple search: ' || S_input);
  END;
$$;

-- Test: search history before / after (first 5 hits shown)
SELECT * FROM Get_search_history (test_user_id());
SELECT * FROM String_search('death', test_user_id()) LIMIT 5;
SELECT * FROM Get_search_history (test_user_id());


-- 1-D.3 Title rating

-- Rate a title. A second rating by the same user updates the earlier one.
CREATE OR REPLACE FUNCTION Give_rating (user_input INT, title_input char(10), score NUMERIC)
RETURNS VARCHAR
LANGUAGE plpgsql AS $$
  DECLARE status_output VARCHAR := 'start';
  BEGIN
    IF NOT EXISTS (SELECT * FROM title WHERE title_input = title.title_id) THEN
      status_output := 'title not found';
    END IF;
    IF NOT EXISTS (SELECT * FROM users WHERE user_input = users.user_id) THEN
      status_output := 'user not found';
    END IF;
    IF EXISTS (SELECT * FROM rating_history WHERE user_input = rating_history.user_id AND title_input = rating_history.title_id) THEN
      UPDATE rating_history
      SET rating_score = score
      WHERE user_input = rating_history.user_id AND title_input = rating_history.title_id;
      status_output := 'user ' || user_input || ' updated their score to ' || score || ' for title ' || title_input;
    END IF;
    IF status_output = 'start' THEN
      INSERT INTO rating_history (user_id, title_id, rating_score)
      VALUES (user_input, title_input, score);
      status_output := 'user ' || user_input || ' has given title ' || title_input || ' a score of ' || score;
    END IF;
    RETURN status_output;
  END;
$$;

-- Test: rating history and the title's rating before / after, then a second rating of the same title
SELECT * FROM Get_rating_history (test_user_id());
SELECT * FROM ratings WHERE title_id = 'tt0052520';
SELECT Give_rating (test_user_id(), 'tt0052520 ', 9);
SELECT * FROM Get_rating_history (test_user_id());
SELECT * FROM ratings WHERE title_id = 'tt0052520';
SELECT Give_rating (test_user_id(), 'tt0052520 ', 7);
SELECT * FROM Get_rating_history (test_user_id());
SELECT * FROM ratings WHERE title_id = 'tt0052520';


-- 1-D.4 Structured string search

-- All four parameters are used as case-insensitive substrings and the results
-- are intersected. The search is stored in the search history as a side effect.
-- Note: an empty parameter becomes '%%', which only matches non-NULL values.
CREATE OR REPLACE FUNCTION Structured_string_search(title_input1 VARCHAR(255), plot_input2 VARCHAR(255), characters_input3 VARCHAR(255), person_input4 VARCHAR(255), user_searching int, limit_input INT DEFAULT 10, offset_input INT DEFAULT 0)
RETURNS TABLE (
  Title_ID CHAR(10),
  primary_title TEXT
)
LANGUAGE plpgsql AS $$
  DECLARE structured_search_notation TEXT;
  BEGIN
    RETURN QUERY
    (SELECT title.title_id, title.primary_title FROM "public".title WHERE title.primary_title ILIKE '%' || title_input1 || '%')
    INTERSECT
    (SELECT title.title_id, title.primary_title FROM "public".title WHERE title.plot ILIKE '%' || plot_input2 || '%')
    INTERSECT
    (SELECT title.title_id, title.primary_title FROM "public".casted_as JOIN "public".title USING (title_id) WHERE casted_as."characters" ILIKE '%' || characters_input3 || '%')
    INTERSECT
    (SELECT title.title_id, title.primary_title FROM "public".casted_as JOIN "public".title USING (title_id) JOIN "public".person USING (person_id) WHERE person.primary_name ILIKE '%' || person_input4 || '%')
    LIMIT limit_input OFFSET offset_input;
    
    structured_search_notation := CONCAT('structured search title:', title_input1, ' plot:', plot_input2, ' characters:', characters_input3, ' person:', person_input4);
    INSERT INTO search_history (user_id, search_input)
    VALUES (user_searching, structured_search_notation);
  END;
$$;

-- Test: search history before / after
SELECT * FROM Get_search_history (test_user_id());
SELECT * FROM Structured_string_search('casino', 'bond', 'james bond', 'Mads mikkelsen', test_user_id());
SELECT * FROM Get_search_history (test_user_id());


-- 1-D.5 Finding names and 1-D.6 Finding co-players

-- View collecting the most important columns from casted_as and person
CREATE OR REPLACE VIEW person_title_view AS
SELECT
    c.title_id,
    c.person_id,
    p.primary_name,
    c.category,
    c.job
FROM casted_as c
JOIN person p ON c.person_id = p.person_id;

-- 1-D.5 Find persons whose name contains a search text
CREATE OR REPLACE FUNCTION find_person_by_name(search_text TEXT)
RETURNS TABLE (
    person_id    CHAR(10),
    primary_name VARCHAR(256),
    birth_year   CHAR(4),
    death_year   CHAR(4)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.person_id,
        p.primary_name,
        p.birth_year,
        p.death_year
    FROM person p
    WHERE p.primary_name ILIKE '%' || search_text || '%'
    ORDER BY p.primary_name;
END;
$$;

-- 1-D.6 Most frequent co-players of an actor (top 20).
-- Columns of the CTEs are qualified (t.person_id) to avoid a clash with the
-- output column person_id.
CREATE OR REPLACE FUNCTION find_co_players(actor_name TEXT)
RETURNS TABLE (
    person_id    CHAR(10),
    primary_name VARCHAR(256),
    frequency    BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH target_actor AS (
        SELECT p.person_id
        FROM person p
        WHERE p.primary_name ILIKE actor_name
        LIMIT 1
    ),
    actor_titles AS (
        SELECT c.title_id
        FROM casted_as c
        WHERE c.person_id = (SELECT t.person_id FROM target_actor t)
    )
    SELECT
        c.person_id,
        p.primary_name,
        COUNT(*) AS frequency
    FROM casted_as c
    JOIN person p ON c.person_id = p.person_id
    WHERE c.title_id IN (SELECT a.title_id FROM actor_titles a)
      AND c.person_id != (SELECT t.person_id FROM target_actor t)
    GROUP BY c.person_id, p.primary_name
    ORDER BY frequency DESC
    LIMIT 20;
END;
$$;

-- Test (first 10 shown for the name search)
SELECT * FROM find_person_by_name('Tom') LIMIT 10;
SELECT * FROM find_co_players('Tom Hanks');


-- 1-D.7 Name rating

-- Store the name rating on the person table
ALTER TABLE person
ADD COLUMN IF NOT EXISTS name_rating NUMERIC(5,2);

-- Weighted average of the title ratings a person is related to (numvotes as weight)
CREATE OR REPLACE FUNCTION calculate_name_ratings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE person p
    SET name_rating = sub.weighted_avg
    FROM (
        SELECT
            c.person_id,
            ROUND(
                (SUM(r.avg_rating * r.votes) / NULLIF(SUM(r.votes), 0))::NUMERIC
            , 2) AS weighted_avg
        FROM casted_as c
        JOIN ratings r ON c.title_id = r.title_id
        WHERE r.avg_rating IS NOT NULL
          AND r.votes > 0
        GROUP BY c.person_id
    ) sub
    WHERE p.person_id = sub.person_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_person_rating(person_name TEXT)
RETURNS TABLE (
    person_id    CHAR(10),
    primary_name VARCHAR(256),
    name_rating  NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.person_id,
        p.primary_name,
        p.name_rating
    FROM person p
    WHERE p.primary_name ILIKE '%' || person_name || '%'
      AND p.name_rating IS NOT NULL
    ORDER BY p.name_rating DESC;
END;
$$;

-- Test: name rating before / after the calculation (this takes a while)
SELECT person_id, primary_name, name_rating FROM person WHERE primary_name = 'Tom Hanks';
SELECT count(name_rating) AS persons_with_rating_before FROM person;
SELECT calculate_name_ratings();
SELECT person_id, primary_name, name_rating FROM person WHERE primary_name = 'Tom Hanks';
SELECT count(name_rating) AS persons_with_rating_after FROM person;
SELECT * FROM get_person_rating('Tom Hanks');


-- 1-D.8 Popular actors

-- Actors of a title ordered by decreasing name rating (uses the ratings from 1-D.7)
DROP FUNCTION IF EXISTS popular_actors(TEXT);

CREATE OR REPLACE FUNCTION popular_actors(input_tconst TEXT)
RETURNS TABLE (
    person_id    CHAR(10),
    primary_name VARCHAR(256),
    name_rating  NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.person_id,
        p.primary_name,
        COALESCE(p.name_rating, 0)
    FROM casted_as c
    JOIN person p ON p.person_id = c.person_id
    WHERE c.title_id = input_tconst
      AND c.category IN ('actor', 'actress')
    GROUP BY p.person_id, p.primary_name, p.name_rating
    ORDER BY COALESCE(p.name_rating, 0) DESC;
END;
$$;

SELECT * FROM popular_actors('tt26693752');


-- 1-D.9 Similar movies

-- Similarity = number of genres two titles share (top 20).
-- Genres are in the separate genre table, one row per (title, genre).
DROP FUNCTION IF EXISTS movie_similarity(TEXT);

CREATE FUNCTION movie_similarity(input_id TEXT)
RETURNS TABLE (
    title_id         CHAR(10),
    primary_title    TEXT,
    similarity_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.title_id,
        t.primary_title,
        COUNT(*)::INTEGER
    FROM genre g1
    JOIN genre g2 ON g2.genre = g1.genre AND g2.title_id <> g1.title_id
    JOIN title t ON t.title_id = g2.title_id
    WHERE g1.title_id = input_id
    GROUP BY t.title_id, t.primary_title
    ORDER BY COUNT(*) DESC, t.primary_title
    LIMIT 20;
END;
$$;

SELECT * FROM movie_similarity('tt26693752');


-- 1-D.10 Frequent person words

-- Most frequent words paged with limit (default 10) and offset (default 0) in the titles a person is involved in, from the word index wi
DROP FUNCTION IF EXISTS person_words(TEXT);
DROP FUNCTION IF EXISTS person_words(TEXT, INT, INT);

CREATE OR REPLACE FUNCTION person_words(input_name TEXT, limit_input INT DEFAULT 10, offset_input INT DEFAULT 0)
RETURNS TABLE (word TEXT, frequency BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.word,
        COUNT(*) AS frequency
    FROM person p
    JOIN casted_as c ON c.person_id = p.person_id
    JOIN wi w ON w.tconst = c.title_id
    WHERE p.primary_name = input_name
    GROUP BY w.word
    -- Oder by frequency descending, then by word ascending for when two words have the same frequency
    ORDER BY frequency DESC, w.word ASC
    LIMIT limit_input OFFSET offset_input;
END;
$$;

   SELECT * FROM person_words('Tom Hanks');         -- default: first 10
   SELECT * FROM person_words('Tom Hanks', 5);      -- page size 5
   SELECT * FROM person_words('Tom Hanks', 5, 5);   -- second page of 5


-- =====================================================================
-- 1-D.11 Exact match
-- =====================================================================
-- Titles where ALL given keywords occur.
-- Merges page 27's INTERSECT query with page 34's VARIADIC input and
-- page 35-36's dynamic EXECUTE, since page 27's INTERSECT is hardcoded
-- to 3 words but VARIADIC gives an array of unknown length.

DROP FUNCTION IF EXISTS exact_match(text[]);

CREATE OR REPLACE FUNCTION exact_match(VARIADIC keywords text[])
RETURNS TABLE (title_id char(10), title text)
AS $$
DECLARE
    q text;  -- holds the dynamically built query
    i int;   -- loop counter over keywords
BEGIN

      -- lowercase all keywords, because every word in wi is stored in lowercase
    FOR i IN 1..array_length(keywords, 1) LOOP
        keywords[i] := lower(keywords[i]);
    END LOOP;

    -- start the chain with the first keyword (no INTERSECT yet)
    q := 'SELECT tconst FROM wi WHERE word = ''' || keywords[1] || '''';

    -- add one INTERSECT clause per remaining keyword (page 27's pattern, built dynamically), starting from the 2nd word
    FOR i IN 2..array_length(keywords, 1) LOOP
        q := q || ' INTERSECT SELECT tconst FROM wi WHERE word = ''' || keywords[i] || '''';
    END LOOP;

    -- print the built query, for debugging (page 36's trick)
    RAISE NOTICE '%', q;

    -- run the built query, joined with title for the title (as on page 27)
    RETURN QUERY EXECUTE
        'SELECT t.title_id, t.primary_title FROM title t, (' || q || ') w WHERE t.title_id = w.tconst';
END;
$$
LANGUAGE plpgsql;

-- Test: should return exactly one title (Adam's Apples)
SELECT * FROM exact_match('apple', 'mads', 'mikkelsen');


-- 1-D.12 Best match
-- Titles ranked by HOW MANY of the given keywords they match (not just
-- all-or-nothing like exact_match). Same VARIADIC + dynamic EXECUTE structure
-- as exact_match, but UNION ALL instead of INTERSECT, plus a relevance score
-- summed up per title.

DROP FUNCTION IF EXISTS best_match(text[]);

CREATE OR REPLACE FUNCTION best_match(VARIADIC keywords text[])
RETURNS TABLE (title_id char(10), rank BIGINT, title text)
AS $$
DECLARE
    q text;  -- holds the dynamically built query (just the raw tconst+relevance pairs,
             -- NOT the aggregation - that happens later, in the outer query)
    i int;
BEGIN

      -- lowercase all keywords, because every word in wi is stored in lowercase
    FOR i IN 1..array_length(keywords, 1) LOOP
        keywords[i] := lower(keywords[i]);
    END LOOP;

    -- each keyword gets relevance = 1. A title matching 3/3 keywords ends up with
    -- 3 rows here, which sum() turns into rank = 3 in the outer query.
    q := 'SELECT tconst, 1 relevance FROM wi WHERE word = ''' || keywords[1] || '''';

    -- UNION ALL (not INTERSECT!) - every match is kept as its own row, not just
    -- the titles where ALL words matched.
    FOR i IN 2..array_length(keywords, 1) LOOP
        q := q || ' UNION ALL SELECT tconst, 1 relevance FROM wi WHERE word = ''' || keywords[i] || '''';
    END LOOP;

    RAISE NOTICE '%', q;

    -- sum(relevance) lives in the outer query: q only produces the raw per-word
    -- rows, the aggregation into a rank per title happens once everything is
    -- joined and grouped
    RETURN QUERY EXECUTE
        'SELECT t.title_id, sum(relevance) rank, t.primary_title FROM title t, (' || q || ') w WHERE t.title_id = w.tconst GROUP BY t.title_id, t.primary_title ORDER BY rank DESC;';
END;
$$
LANGUAGE plpgsql;

-- Test: Adam's Apples should be on top with rank 3 (top 10 shown, the full result is large)
SELECT * FROM best_match('apple', 'mads', 'mikkelsen') ORDER BY rank DESC LIMIT 10;


-- 1-D.13 Word-to-words
-- ANY-MATCH variant: step 1 reuses best_match's title-finder (UNION ALL -
-- titles matching AT LEAST ONE keyword), step 2 counts words across ALL those
-- titles. Result: a broad set of titles, so the word counts are dominated by
-- generic words (e.g. "self", "episode"), not necessarily specific to the search.

DROP FUNCTION IF EXISTS word_to_words_any(text[]);

CREATE OR REPLACE FUNCTION word_to_words_any(VARIADIC keywords text[])
RETURNS TABLE (word text, frequency BIGINT)
AS $$
DECLARE
    q text;  -- step 1: raw (tconst, relevance) pairs, one per keyword match.
             -- relevance isn't used here, q is only a source of matching tconst values
    i int;
BEGIN

      -- lowercase all keywords, because every word in wi is stored in lowercase
    FOR i IN 1..array_length(keywords, 1) LOOP
        keywords[i] := lower(keywords[i]);
    END LOOP;

    q := 'SELECT tconst, 1 relevance FROM wi WHERE word = ''' || keywords[1] || '''';

    FOR i IN 2..array_length(keywords, 1) LOOP
        q := q || ' UNION ALL SELECT tconst, 1 relevance FROM wi WHERE word = ''' || keywords[i] || '''';
    END LOOP;

    RAISE NOTICE '%', q;

    -- step 2: for every title found in q, count how many times each word occurs
    -- ACROSS ALL those titles combined (GROUP BY word, not GROUP BY tconst)
    RETURN QUERY EXECUTE
        'SELECT word, count(*) frequency FROM wi t, (' || q || ') w WHERE t.tconst = w.tconst GROUP BY t.word ORDER BY frequency DESC;';
END;
$$
LANGUAGE plpgsql;

-- Test: generic words dominate (top 10 shown)
SELECT * FROM word_to_words_any('apple', 'mads', 'mikkelsen') ORDER BY frequency DESC LIMIT 10;


-- EXACT-MATCH variant: step 1 reuses exact_match's title-finder (INTERSECT -
-- titles matching ALL keywords), step 2 counts words across those (far fewer)
-- titles. Result: the word counts stay specific to the actual search.

DROP FUNCTION IF EXISTS word_to_words_all(text[]);

CREATE OR REPLACE FUNCTION word_to_words_all(VARIADIC keywords text[])
RETURNS TABLE (word text, frequency BIGINT)
AS $$
DECLARE
    q text;
    i int;
BEGIN

        -- lowercase all keywords, because every word in wi is stored in lowercase
    FOR i IN 1..array_length(keywords, 1) LOOP
        keywords[i] := lower(keywords[i]);
    END LOOP;

    -- start the chain with the first keyword (no INTERSECT yet)
    q := 'SELECT tconst FROM wi WHERE word = ''' || keywords[1] || '''';

    -- INTERSECT: only titles containing EVERY keyword survive, so q ends up with
    -- very few titles (often just one, as in the "Adam's Apples" example)
    FOR i IN 2..array_length(keywords, 1) LOOP
        q := q || ' INTERSECT SELECT tconst FROM wi WHERE word = ''' || keywords[i] || '''';
    END LOOP;

    RAISE NOTICE '%', q;

    -- same step 2 as word_to_word, just on a much smaller set of titles
    RETURN QUERY EXECUTE
        'SELECT word, count(*) frequency FROM wi t, (' || q || ') w WHERE t.tconst = w.tconst GROUP BY t.word ORDER BY frequency DESC;';
END;
$$
LANGUAGE plpgsql;

-- Test: words specific to Adam's Apples (top 10 shown)
SELECT * FROM word_to_words_all('apple', 'mads', 'mikkelsen') ORDER BY frequency DESC LIMIT 10;


-- 1-D.14 Weighted querying: wi_weighted + weighted_match
-- Rerunnable: drops everything first.

DROP FUNCTION IF EXISTS weighted_match(text[]);
DROP TABLE IF EXISTS wi_weighted;

-- Weighted inverted index: one row per (title, term) with a TF-IDF weight.
CREATE TABLE wi_weighted (
    tconst char(10),
    word   text,
    weight numeric,
    PRIMARY KEY (tconst, word)
);

-- BEFORE: wi_weighted is empty
SELECT count(*) AS wi_weighted_rows_before FROM wi_weighted;

-- Terms from three sources. Title/plot stay single words (as in wi), but
-- names and characters are indexed as ONE whole term each (slide 26), so a big
-- cast doesn't inflate n(d).
-- (This statement takes a while: it aggregates over all of wi and casted_as.)
WITH combined AS (
    SELECT tconst, word AS term
    FROM wi
    WHERE field IN ('t', 'p')

    UNION ALL

    SELECT c.title_id, lower(trim(p.primary_name))
    FROM casted_as c
    JOIN person p ON c.person_id = p.person_id
    WHERE p.primary_name IS NOT NULL

    UNION ALL

    SELECT c.title_id, lower(trim(c."characters"))
    FROM casted_as c
    WHERE c."characters" IS NOT NULL
),
dt AS (SELECT tconst, term, count(*) AS n_dt FROM combined GROUP BY tconst, term),   -- n(d,t)
dl AS (SELECT tconst, count(*) AS doc_len FROM combined GROUP BY tconst),            -- n(d)
wf AS (SELECT term, count(DISTINCT tconst) AS n_t FROM combined GROUP BY term)       -- n(t)
INSERT INTO wi_weighted (tconst, word, weight)
SELECT dt.tconst, dt.term,
       ln(1 + dt.n_dt::numeric / dl.doc_len) * (1.0 / wf.n_t)   -- TF * IDF (slide 7-8)
FROM dt
JOIN dl ON dt.tconst = dl.tconst
JOIN wf ON dt.term = wf.term;

-- AFTER: wi_weighted is populated
SELECT count(*) AS wi_weighted_rows_after FROM wi_weighted;

-- Same shape as best_match, but sums the TF-IDF weight instead of a flat 1.
CREATE OR REPLACE FUNCTION weighted_match(VARIADIC keywords text[])
RETURNS TABLE (title_id char(10), rank numeric, title text)
AS $$
DECLARE
    q text;
    i int;
BEGIN

      -- lowercase all keywords, because every word in wi is stored in lowercase
    FOR i IN 1..array_length(keywords, 1) LOOP
        keywords[i] := lower(keywords[i]);
    END LOOP;

    q := 'SELECT tconst, weight FROM wi_weighted WHERE word = ''' || keywords[1] || '''';

    FOR i IN 2..array_length(keywords, 1) LOOP
        q := q || ' UNION ALL SELECT tconst, weight FROM wi_weighted WHERE word = ''' || keywords[i] || '''';
    END LOOP;

    RAISE NOTICE '%', q;

    RETURN QUERY EXECUTE
        'SELECT t.title_id, sum(weight) rank, t.primary_title FROM title t, (' || q || ') w WHERE t.title_id = w.tconst GROUP BY t.title_id, t.primary_title ORDER BY rank DESC;';
END;
$$
LANGUAGE plpgsql;

-- Test (full names as one keyword): Adam's Apples should rank first
SELECT * FROM weighted_match('adams', 'apples', 'mads mikkelsen', 'ulrich thomsen') ORDER BY rank DESC LIMIT 10;