-- Migration number: 0001 	 2024-05-23T00:00:00.000Z

DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    age INTEGER,
    language TEXT,
    experience_level TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE lessons (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    emphasis_level TEXT,
    completed BOOLEAN DEFAULT FALSE,
    "order" INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_lessons_user_id ON lessons(user_id);
