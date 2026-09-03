const pool = require('../database/db');

class Leaderboard {
    // Get global leaderboard with time filter
    static async getGlobal(limit = 50, timeFilter = 'all') {
        let timeCondition = '';
        if (timeFilter === 'daily') {
            timeCondition = 'AND gr.created_at > NOW() - INTERVAL \'1 day\'';
        } else if (timeFilter === 'weekly') {
            timeCondition = 'AND gr.created_at > NOW() - INTERVAL \'7 days\'';
        } else if (timeFilter === 'monthly') {
            timeCondition = 'AND gr.created_at > NOW() - INTERVAL \'30 days\'';
        }

        const result = await pool.query(
            `SELECT 
                u.username,
                MAX(gr.score) AS best_score,
                COUNT(gr.id) AS games_played,
                ROUND(AVG(gr.score), 0) AS avg_score,
                SUM(gr.deaths) AS total_deaths,
                MAX(gr.survival_time) AS best_survival,
                MAX(gr.created_at) AS last_played
             FROM game_results gr
             JOIN users u ON u.id = gr.user_id
             WHERE 1=1 ${timeCondition}
             GROUP BY u.id, u.username
             ORDER BY best_score DESC
             LIMIT $1`,
            [limit]
        );
        return result.rows;
    }

    // Get daily leaderboard
    static async getDaily(limit = 50) {
        return this.getGlobal(limit, 'daily');
    }

    // Get weekly leaderboard
    static async getWeekly(limit = 50) {
        return this.getGlobal(limit, 'weekly');
    }

    // Get monthly leaderboard
    static async getMonthly(limit = 50) {
        return this.getGlobal(limit, 'monthly');
    }

    // Get user's rank
    static async getUserRank(username) {
        const result = await pool.query(
            `SELECT 
                u.username,
                MAX(gr.score) AS best_score,
                ROW_NUMBER() OVER (ORDER BY MAX(gr.score) DESC) AS rank
             FROM game_results gr
             JOIN users u ON u.id = gr.user_id
             GROUP BY u.id, u.username`,
            []
        );
        
        const userEntry = result.rows.find(row => row.username === username);
        return userEntry ? userEntry.rank : null;
    }
}

module.exports = Leaderboard;