--drop table commands to allow for reruns of the scrcipt
DROP TABLE IF EXISTS "public".person_bookmark;
DROP TABLE IF EXISTS "public".title_bookmark;
DROP TABLE IF EXISTS "public".search_history;
DROP TABLE IF EXISTS "public".rating_history;
DROP TABLE IF EXISTS "public".users;
 
--Movie Data Model-user table--
 
CREATE TABLE users(
     user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     username VARCHAR(100) NOT NULL UNIQUE,
     email VARCHAR(255) NOT NULL UNIQUE,
     password_hash TEXT NOT NULL
);
 
--Movie Data Model-person bookmark table--
 
--had to replace space in the table name with underscore, and edit the referenes for the foreign keys to specify the column instead of the entire table. also had to rename the references from the source tables to the proper tables
CREATE TABLE person_bookmark(
    user_id INTEGER,
    person_id CHARACTER(10),
    PRIMARY KEY(user_id,person_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY(person_id) REFERENCES person(person_id)
);
--what is this foreign key below?! had to comment out
 
--FOREIGN KEY(user_id) REFERENCES user
 
 
--Movie Data Model-title bookmark table--
 
--again replace space with underscore and fix the foreign keys
CREATE TABLE title_bookmark(
    user_id INTEGER,
    title_id CHARACTER(10),
    PRIMARY KEY(user_id,title_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY(title_id) REFERENCES title(title_id)
);
--again referenced a table that we will be deleting, title_basics, the source table, instead of our own table just named "title"
 
-- Framework Model: Search History
 
CREATE TABLE search_history (
    search_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    search_input TEXT NOT NULL,
    searched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);
 
 
-- Framework Model: Rating History
 
CREATE TABLE rating_history (
    rating_history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title_id CHAR(10) NOT NULL,
    rating_score INTEGER NOT NULL,
    rated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    CHECK (rating_score BETWEEN 1 AND 10),
 
    FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (title_id)
        REFERENCES title(title_id),
 
    UNIQUE (user_id, title_id)
);
 