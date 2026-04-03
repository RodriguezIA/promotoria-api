import IORedis from 'ioredis';

export const connectionQueue = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0"),
});

export const connectionWorker = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0"),
    maxRetriesPerRequest: null,
});

// 👇 Agrega esto
connectionWorker.on('connect', () => console.log('✅ Redis Worker conectado'));
connectionWorker.on('error', (err) => console.error('❌ Redis Worker error:', err.message));
connectionQueue.on('connect', () => console.log('✅ Redis Queue conectado'));
connectionQueue.on('error', (err) => console.error('❌ Redis Queue error:', err.message));