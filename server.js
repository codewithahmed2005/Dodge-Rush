const express = require('express');
const path = require('path');
const http = require('http');
const cookieParser = require('cookie-parser');
const socketIO = require('socket.io');
const config = require('./config');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const apiRoutes = require('./routes/api');
const { securityHeaders, corsMiddleware, rateLimiter } = require('./middleware/security');
const { errorHandler, AppError } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: config.cors.clientUrl,
        credentials: true,
    }
});

const PORT = config.server.port;

// Middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(rateLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
    });
});

// 404 handler
app.use((req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Error handler
app.use(errorHandler);

// Socket.IO handling (keep existing)
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Start server
server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📡 Environment: ${config.server.env}`);
    logger.info(`🔌 Socket.IO ready`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        logger.error('Forced shutdown.');
        process.exit(1);
    }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server, io };