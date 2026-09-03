-- Create database (run this first)
CREATE DATABASE dodge_rush;

-- Connect to database
\c dodge_rush;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0
);

-- Game sessions
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    score INTEGER DEFAULT 0,
    survival_time INTEGER DEFAULT 0,
    difficulty INTEGER DEFAULT 1,
    deaths INTEGER DEFAULT 0
);

-- Game results
CREATE TABLE game_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    survival_time INTEGER NOT NULL,
    difficulty INTEGER NOT NULL,
    deaths INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard (view)
CREATE VIEW leaderboard AS
SELECT 
    u.username,
    MAX(gr.score) AS best_score,
    COUNT(gr.id) AS games_played,
    AVG(gr.score) AS avg_score,
    SUM(gr.deaths) AS total_deaths
FROM game_results gr
JOIN users u ON u.id = gr.user_id
GROUP BY u.id, u.username
ORDER BY best_score DESC;

-- Indexes for performance
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_score ON game_results(score);
CREATE INDEX idx_game_results_created_at ON game_results(created_at);
CREATE INDEX idx_users_username ON users(username);