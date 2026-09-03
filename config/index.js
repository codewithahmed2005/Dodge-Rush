require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  cors: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
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
      interval: 30, // CHANGE: was 60, now 30 (faster spawning)
      minInterval: 10, // CHANGE: was 15, now 10
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