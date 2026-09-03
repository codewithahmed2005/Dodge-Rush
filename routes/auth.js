const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');  // ← Fixed path
const config = require('../config');

// ============================================================
// 📝 REGISTER
// ============================================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (!email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Check if user exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create user
        const user = await User.create(username, email, password);
        
        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            config.server.jwtSecret,
            { expiresIn: config.server.jwtExpiresIn }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: config.server.env === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                created_at: user.created_at
            },
            token
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// ============================================================
// 🔐 LOGIN
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await User.comparePassword(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await User.updateLastLogin(user.id);

        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            config.server.jwtSecret,
            { expiresIn: config.server.jwtExpiresIn }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: config.server.env === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                best_score: user.best_score || 0,
                total_games: user.total_games || 0,
                total_score: user.total_score || 0
            },
            token
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ============================================================
// 🚪 LOGOUT
// ============================================================
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ 
        success: true,
        message: 'Logged out successfully' 
    });
});

// ============================================================
// 👤 GET CURRENT USER
// ============================================================
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, config.server.jwtSecret);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
                total_games: user.total_games || 0,
                total_wins: user.total_wins || 0,
                total_score: user.total_score || 0,
                best_score: user.best_score || 0
            }
        });
    } catch (error) {
        console.error('❌ Auth check error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;