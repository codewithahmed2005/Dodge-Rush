const express = require('express');
const router = express.Router();
const GameResult = require('../models/GameResult');  // ← Fixed path
const Leaderboard = require('../models/Leaderboard'); // ← Fixed path
const User = require('../models/User'); // ← Fixed path
const authMiddleware = require('../middleware/auth');

// ============================================================
// 🌍 GLOBAL LEADERBOARD
// ============================================================
router.get('/global', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const timeFilter = req.query.time || 'all';
        
        const leaderboard = await Leaderboard.getGlobal(limit, timeFilter);
        
        res.json({
            success: true,
            leaderboard,
            total: leaderboard.length,
            filter: timeFilter
        });
    } catch (error) {
        console.error('❌ Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// ============================================================
// 📅 DAILY LEADERBOARD
// ============================================================
router.get('/daily', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const leaderboard = await Leaderboard.getDaily(limit);
        
        res.json({
            success: true,
            leaderboard,
            total: leaderboard.length,
            filter: 'daily'
        });
    } catch (error) {
        console.error('❌ Daily leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch daily leaderboard' });
    }
});

// ============================================================
// 📊 WEEKLY LEADERBOARD
// ============================================================
router.get('/weekly', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const leaderboard = await Leaderboard.getWeekly(limit);
        
        res.json({
            success: true,
            leaderboard,
            total: leaderboard.length,
            filter: 'weekly'
        });
    } catch (error) {
        console.error('❌ Weekly leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch weekly leaderboard' });
    }
});

// ============================================================
// 📆 MONTHLY LEADERBOARD
// ============================================================
router.get('/monthly', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const leaderboard = await Leaderboard.getMonthly(limit);
        
        res.json({
            success: true,
            leaderboard,
            total: leaderboard.length,
            filter: 'monthly'
        });
    } catch (error) {
        console.error('❌ Monthly leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch monthly leaderboard' });
    }
});

// ============================================================
// 🏅 GET USER RANK
// ============================================================
router.get('/rank', authMiddleware, async (req, res) => {
    try {
        const rank = await Leaderboard.getUserRank(req.username);
        
        res.json({
            success: true,
            rank: rank || 'Not ranked yet',
            username: req.username
        });
    } catch (error) {
        console.error('❌ Rank error:', error);
        res.status(500).json({ error: 'Failed to fetch rank' });
    }
});

// ============================================================
// 💾 SAVE GAME RESULT
// ============================================================
router.post('/save', authMiddleware, async (req, res) => {
    try {
        const { score, survivalTime, difficulty, deaths } = req.body;
        
        // Validate
        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({ error: 'Invalid score' });
        }
        
        if (typeof survivalTime !== 'number' || survivalTime < 0) {
            return res.status(400).json({ error: 'Invalid survival time' });
        }
        
        // Save game result
        const result = await GameResult.create(
            req.userId,
            score,
            Math.floor(survivalTime),
            Math.floor(difficulty),
            deaths || 0
        );
        
        // Update user stats
        const updatedUser = await User.updateStats(
            req.userId, 
            score, 
            Math.floor(survivalTime), 
            deaths || 0
        );
        
        res.json({
            success: true,
            result,
            userStats: {
                total_games: updatedUser.total_games,
                total_score: updatedUser.total_score,
                best_score: updatedUser.best_score
            }
        });
        
    } catch (error) {
        console.error('❌ Save result error:', error);
        res.status(500).json({ error: 'Failed to save game result' });
    }
});

module.exports = router;