const { Pool } = require('pg');

// Try to load config, use defaults if missing
let config;
try {
    config = require('../config');
} catch (e) {
    console.log('⚠️ Config not found, using defaults');
    config = { db: {} };
}

// Check if we have database config
const hasDbConfig = config.db && config.db.host;

if (!hasDbConfig) {
    console.log('⚠️ No database configuration found.');
    console.log('ℹ️ Game will run without database features (scores won\'t be saved).');
    
    // Export a dummy pool
    module.exports = {
        query: (text, params) => {
            console.log('ℹ️ Database query skipped (no DB):', text);
            return Promise.resolve({ rows: [] });
        },
        connect: () => Promise.resolve(),
        end: () => Promise.resolve(),
    };
} else {
    const pool = new Pool({
        host: config.db.host,
        port: config.db.port || 5432,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        max: config.db.maxConnections || 20,
        idleTimeoutMillis: 30000,
    });

    pool.on('connect', () => {
        console.log('📊 Connected to PostgreSQL');
    });

    pool.on('error', (err) => {
        console.error('❌ PostgreSQL error:', err);
    });

    module.exports = pool;
}
