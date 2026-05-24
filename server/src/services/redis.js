import Redis from 'ioredis';

class InMemoryRedis {
  constructor() {
    this.store = new Map();
    console.log('[Redis Fallback] Initialized in-memory lock store.');
  }

  async set(key, value, mode, duration, flag) {
    this.cleanupExpired();

    if (flag === 'NX') {
      if (this.store.has(key)) {
        return null; // Key already exists (lock active)
      }
      
      const expiresAt = Date.now() + (parseInt(duration, 10) * 1000);
      this.store.set(key, { value, expiresAt });
      return 'OK';
    }

    // Default SET (no NX)
    const expiresAt = duration ? Date.now() + (parseInt(duration, 10) * 1000) : null;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key) {
    const deleted = this.store.delete(key);
    return deleted ? 1 : 0;
  }

  async get(key) {
    this.cleanupExpired();
    if (!this.store.has(key)) return null;
    return this.store.get(key).value;
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.expiresAt && record.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  // To mimic ioredis API
  on(event, handler) {
    // dummy listener
  }
}

let redisClient;

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

if (process.env.NODE_ENV === 'test') {
  redisClient = new InMemoryRedis();
} else {
  try {
    console.log(`[Redis] Connecting to Redis at ${redisUrl}...`);
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy(times) {
        // If it fails to connect once, stop retrying and trigger error to fallback
        if (times >= 1) {
          console.warn('[Redis] Connection failed. Switching to In-Memory Fallback.');
          return null; 
        }
        return 100;
      }
    });

    redisClient.on('error', (err) => {
      if (!(redisClient instanceof InMemoryRedis)) {
        console.error('[Redis Error] Connection failed. Falling back to in-memory store.');
        redisClient = new InMemoryRedis();
      }
    });
  } catch (error) {
    console.error('[Redis Init Error] Falling back to in-memory store:', error.message);
    redisClient = new InMemoryRedis();
  }
}

// Seat Lock Helper Functions
export const lockSeat = async (eventId, section, seatNumber, userId, ttl = 600) => {
  const key = `seat:${eventId}:${section}:${seatNumber}`;
  
  // If the lock is already held by the same user, overwrite/extend it (without NX)
  const currentOwner = await getSeatLockOwner(eventId, section, seatNumber);
  if (currentOwner && currentOwner.toString() === userId.toString()) {
    const res = await redisClient.set(key, userId, 'EX', ttl);
    return res === 'OK';
  }
  
  const res = await redisClient.set(key, userId, 'EX', ttl, 'NX');
  return res === 'OK';
};

export const releaseSeat = async (eventId, section, seatNumber) => {
  const key = `seat:${eventId}:${section}:${seatNumber}`;
  await redisClient.del(key);
};

export const getSeatLockOwner = async (eventId, section, seatNumber) => {
  const key = `seat:${eventId}:${section}:${seatNumber}`;
  return await redisClient.get(key);
};

export const getEventLocks = async (eventId) => {
  const locks = [];
  if (redisClient instanceof InMemoryRedis) {
    redisClient.cleanupExpired();
    for (const [key, record] of redisClient.store.entries()) {
      if (key.startsWith(`seat:${eventId}:`)) {
        const parts = key.split(':');
        locks.push({
          section: parts[2],
          seatNumber: parseInt(parts[3], 10),
          userId: record.value
        });
      }
    }
  } else {
    try {
      const keys = await redisClient.keys(`seat:${eventId}:*`);
      for (const key of keys) {
        const userId = await redisClient.get(key);
        const parts = key.split(':');
        locks.push({
          section: parts[2],
          seatNumber: parseInt(parts[3], 10),
          userId
        });
      }
    } catch (err) {
      console.error('[Redis getEventLocks Error]', err.message);
    }
  }
  return locks;
};

export default redisClient;
