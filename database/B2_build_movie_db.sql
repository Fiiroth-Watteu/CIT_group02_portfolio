--drop table commands to allow for repeated runs of the script long as source data doesn't get deleted yet
--drop the tables that depend upon the "Title" table
DROP TABLE IF EXISTS "public".Aliases;
DROP TABLE IF EXISTS "public".Genre;
DROP TABLE IF EXISTS "public".Episodes;

DROP TABLE IF EXISTS "public".ratings;
DROP TABLE IF EXISTS "public".Person_known_for;
DROP TABLE IF EXISTS "public".Casted_as;

--drop the core tables after its dependants are dropped (edit: could just use CASCADE but this helps me track what tables are done. EVENTUALLY replace this by changing all CREATE TABLE lines to CREATE OR REPLACE TABLE. WOULD NEED to change the foreign key contraints also to allow for deletion in any order)
DROP TABLE IF EXISTS "public".Title;
DROP TABLE IF EXISTS "public".person;

--first create the table(s) that have no foreign keys
CREATE TABLE Title (
  Title_ID CHAR(10) PRIMARY KEY,
  "Type" VARCHAR(20),
  Primary_title TEXT,
  Original_title TEXT,
  Is_adult BOOL,
  Start_year CHAR(4),
  End_year CHAR(4),
  Runtime INT4,
  Plot TEXT,
  Poster VARCHAR(180)
);

CREATE TABLE IF NOT EXISTS Person (
    person_id char(10) PRIMARY KEY,
    primary_name varchar(256),
    birth_year char(4),
    death_year char(4)
); --no need to set a field to not null if it is set as primary key in the same line. only needed if you intend to make a composite primary key further down

--create all the tables that depend on the previous ones
CREATE TABLE Aliases (
  Title_ID CHAR(10) NOT NULL,
  "Ordering" INT4 NOT NULL,
  Local_title TEXT,
  Region VARCHAR(10),
  "Language" VARCHAR(10),
  "Types" VARCHAR(255),
  "Attributes" VARCHAR(255),
  isoriginaltitle BOOL,
  PRIMARY KEY (Title_ID,"Ordering"),
  FOREIGN KEY (Title_ID) REFERENCES Title(Title_ID)
);

CREATE TABLE Genre (
  Title_ID CHAR(10) NOT NULL,
  Genre VARCHAR(255) NOT NULL,
  PRIMARY KEY (Title_ID, Genre),
  FOREIGN KEY (Title_ID) REFERENCES Title(Title_ID)
);

CREATE TABLE Episodes (
  Episode_ID CHAR(10),
  Title_ID CHAR(10),
  Season INT4,
  Episode_number INT4,
  PRIMARY KEY (Episode_ID, Title_ID),
  FOREIGN KEY (Episode_ID) REFERENCES Title(Title_ID),
  FOREIGN KEY (Title_ID) REFERENCES Title(Title_ID)  
);

--code parts from others
CREATE TABLE ratings (
    title_id CHAR(10) PRIMARY KEY,
    avg_rating NUMERIC(5,1),
    votes INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (title_id)
        REFERENCES title(title_id)
);

CREATE TABLE IF NOT EXISTS Person_known_for (
    person_id char(10) NOT NULL,
    title_id char(10) NOT NULL,
    PRIMARY KEY (person_id, title_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (title_id) REFERENCES title(title_id)
);

CREATE TABLE IF NOT EXISTS Casted_as (
    person_id char(10) NOT NULL,
    "ordering" INT4,
    title_id char(10) NOT NULL,
    category varchar(50),
    job text,
    "characters" text,
    PRIMARY KEY (person_id, "ordering", title_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (title_id) REFERENCES title(title_id)
);

--insert source data into the new table
--inserting titles with plot and poster from OMDB (weirdly the OMDB is missing a single entry that is present in the title_basics source table, so have to use a left join so this one single entry is still added despite not having a corrosponding entry in OMDB. if this is not done then the aliases insertion will give an error, having an alias pointing to a title that then won't exist)
INSERT INTO "public".title SELECT title_basics.tconst, title_basics.titletype, title_basics.primarytitle, title_basics.originaltitle, title_basics.isadult, title_basics.startyear, title_basics.endyear, title_basics.runtimeminutes, omdb_data.plot, omdb_data.poster FROM title_basics LEFT JOIN omdb_data ON title_basics.tconst = omdb_data.tconst;

--inserting persons
INSERT INTO Person (person_id, primary_name, birth_year, death_year)
SELECT nconst, primaryname, birthyear, deathyear
FROM name_basics;

--inserting aliases
INSERT INTO "public".aliases SELECT * FROM title_akas;

--inserting episodes
INSERT INTO "public".episodes SELECT * FROM title_episode;

--insert genre information by using STRING_TO_ARRAY and then UNNEST to split the array into seperate rows
INSERT INTO "public".genre SELECT title_basics.tconst, UNNEST(STRING_TO_ARRAY(genres, ',')) AS "genre" FROM title_basics;

--insert ratings data
INSERT INTO ratings (title_id, avg_rating, votes)
SELECT
    tconst,
    averagerating,
    numvotes
FROM title_ratings;

--insert info for known for table, to unravel the multi valued attribute in the source data
INSERT INTO Person_known_for (person_id, title_id)
SELECT DISTINCT nconst, trim(t)
FROM name_basics, unnest(string_to_array(knownfortitles, ',')) AS t
WHERE knownfortitles IS NOT NULL
  AND trim(t) IN (SELECT tconst FROM title_basics);
  
--insert casting data
INSERT INTO Casted_as (person_id, "ordering", title_id, category, job, "characters")
SELECT DISTINCT nconst, "ordering", tconst, category, job, "characters"
FROM title_principals
WHERE nconst IN (SELECT person_id FROM Person)
  AND tconst IN (SELECT tconst FROM title_basics);

--eventually code to delete the source data tables
/*
DROP TABLE  title_akas, title_basics, title_crew, title_episode, title_principals, title_ratings, name_basics;
*/
