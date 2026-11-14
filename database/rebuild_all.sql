-- Rebuilds the whole database from the IMDb source tables, in the right order.
--
-- Run from the repo root with psql (\ir and \set only work in psql, not in pgAdmin):
--   psql -U postgres -d imdb -f database/rebuild_all.sql
--
-- Requires the source tables (title_basics, name_basics, title_principals, ...).
-- WARNING: deletes all framework data (users, bookmarks, rating and search history).

-- Stop at the first error instead of continuing with a half-built database
\set ON_ERROR_STOP on

-- 1. Drop the objects that depend on the movie tables, so B2 can drop and recreate them
DROP VIEW IF EXISTS person_title_view;
DROP TABLE IF EXISTS person_bookmark;
DROP TABLE IF EXISTS title_bookmark;
DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS rating_history;
DROP TABLE IF EXISTS users;

-- 2. Movie data model (1-B.2)
\ir B2_build_movie_db.sql

-- 3. Framework data model (1-C.2)
\ir C2_build_framework_db.sql

-- 4. Functions, view, name ratings, wi_weighted and tests (1-D, 1-F)
\ir subproject1_functions_and_tests.sql