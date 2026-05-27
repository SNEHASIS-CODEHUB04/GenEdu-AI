import Redis from 'ioredis';

export let redisClient: Redis;

export async function connectRedis() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl && redisUrl !== 'redis://localhost:6379') {
    // Real Redis (e.g. Upstash)
    redisClient = new Redis(redisUrl);
  } else {
    // Use ioredis-mock for local dev
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const RedisMock = require('ioredis-mock');
      redisClient = new RedisMock();
      console.log('Using in-memory Redis mock (local dev)');
    } catch {
      redisClient = new Redis(redisUrl || 'redis://localhost:6379');
    }
  }

  redisClient.on('error', (err: Error) => {
    // Suppress connection errors in mock mode
    if (!err.message.includes('mock')) {
      console.error('Redis error:', err.message);
    }
  });

  console.log('Redis ready');
}
