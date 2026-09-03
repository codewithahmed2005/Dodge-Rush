const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
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