require('dotenv').config();

module.exports = {
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this',
        jwtExpiresIn: '7d',
    },
    cors: {
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'dodge_rush',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    },
    game: {
        tickRate: 60,
        player: {
            width: 40,
            height: 40,
            speed: 5,
        },
        enemy: {
            radius: 15,
            speed: 2,
            maxSpeed: 8,
        },
        spawn: {
            interval: 60,
            minInterval: 15,
        },
        score: {
            multiplier: 1,
        },
        canvas: {
            width: 800,
            height: 600,
        },
    },
};
