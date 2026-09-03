const pool = require('../database/db');
const bcrypt = require('bcrypt');

class User {
    // Create new user
    static async create(username, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
            [username, email, hashedPassword]
        );
        
        return result.rows[0];
    }

    // Find user by username
    static async findByUsername(username) {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0];
    }

    // Find user by email
    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const result = await pool.query(
            `SELECT id, username, email, created_at, 
                    total_games, total_wins, total_score, best_score 
             FROM users WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Update user stats after game
    static async updateStats(userId, score, survivalTime, deaths) {
        const result = await pool.query(
            `UPDATE users 
             SET total_games = total_games + 1,
                 total_score = total_score + $2,
                 best_score = GREATEST(best_score, $2),
                 total_wins = total_wins + CASE WHEN $3 > 0 THEN 1 ELSE 0 END
             WHERE id = $1
             RETURNING id, username, total_games, total_score, best_score, total_wins`,
            [userId, score, survivalTime]
        );
        return result.rows[0];
    }

    // Update last login time
    static async updateLastLogin(userId) {
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );
    }

    // Compare password
    static async comparePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;