const pool = require('../database/db');

class GameResult {
    // Save game result
    static async create(userId, score, survivalTime, difficulty, deaths) {
        const result = await pool.query(
            `INSERT INTO game_results (user_id, score, survival_time, difficulty, deaths)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, score, survivalTime, difficulty, deaths]
        );
        return result.rows[0];
    }

    // Get user's game history
    static async getUserResults(userId, limit = 10) {
        const result = await pool.query(
            `SELECT * FROM game_results 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    // Get user's best score
    static async getUserBest(userId) {
        const result = await pool.query(
            'SELECT MAX(score) as best_score FROM game_results WHERE user_id = $1',
            [userId]
        );
        return result.rows[0].best_score || 0;
    }

    // Get leaderboard
    static async getLeaderboard(limit = 50) {
        const result = await pool.query(
            `SELECT 
                u.username,
                MAX(gr.score) AS best_score,
                COUNT(gr.id) AS games_played,
                ROUND(AVG(gr.score), 0) AS avg_score,
                SUM(gr.deaths) AS total_deaths,
                MAX(gr.survival_time) AS best_survival
             FROM game_results gr
             JOIN users u ON u.id = gr.user_id
             GROUP BY u.id, u.username
             ORDER BY best_score DESC
             LIMIT $1`,
            [limit]
        );
        return result.rows;
    }
}

module.exports = GameResult;