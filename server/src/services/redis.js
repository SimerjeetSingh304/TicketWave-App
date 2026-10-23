import Redis from 'ioredis';
import env from '../config/env.js';

// In-memory fallback cache for seat locking when Redis is unavailable
const memoryLockStore = new Map();
const memoryLockTimeouts = new Map();

let redisClient = null;
let isRedisAvailable = false;

if (env.redisUrl) {
  try {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      retryStrategy(times) {
        if (times > 2) {
          console.warn('\x1b[33m[Redis] Redis host unreachable. Operating in high-speed in-memory lock mode.\x1b[0m');
          return null; // Stop retrying to prevent event loop clogging
        }
        return 1000;
      }
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('\x1b[32m[Redis] Client Connected\x1b[0m');
    });

    redisClient.on('error', () => {
      isRedisAvailable = false;
    });

    redisClient.connect().catch(() => {
      isRedisAvailable = false;
      console.warn('\x1b[33m[Redis] External connection failed. In-memory fallback is active.\x1b[0m');
    });
  } catch (error) {
    isRedisAvailable = false;
    console.warn('\x1b[33m[Redis] Initialization skipped, using in-memory store.\x1b[0m');
  }
} else {
  console.log('\x1b[36m[Redis] No REDIS_URL configured. Operating in high-speed in-memory lock mode (10-min TTL).\x1b[0m');
}

/**
 * Attempts to lock a set of seats for a specific event and user.
 * Atomic check-and-set: if any seat is already locked, roll back other locks.
 * @param {string} eventId 
 * @param {Array<{section: string, seatNumber: number}>} seats 
 * @param {string} userId 
 * @returns {Promise<{success: boolean, conflictKey?: string}>}
 */
export const lockSeats = async (eventId, seats, userId) => {
  const lockedKeys = [];

  // 1. Try Redis if available
  if (isRedisAvailable && redisClient) {
    try {
      for (const seat of seats) {
        const lockKey = `seat:${eventId}:${seat.section}:${seat.seatNumber}`;
        const result = await redisClient.set(lockKey, userId, 'EX', 600, 'NX');
        
        if (result !== 'OK') {
          if (lockedKeys.length > 0) {
            await redisClient.del(lockedKeys);
          }
          return { success: false, conflictKey: lockKey };
        }
        lockedKeys.push(lockKey);
      }
      return { success: true };
    } catch (redisErr) {
      console.warn('[Redis] Redis error during lock, switching to in-memory fallback:', redisErr.message);
      isRedisAvailable = false;
    }
  }

  // 2. In-memory lock fallback
  for (const seat of seats) {
    const lockKey = `seat:${eventId}:${seat.section}:${seat.seatNumber}`;
    if (memoryLockStore.has(lockKey)) {
      // Conflict: rollback locks acquired in this batch
      for (const key of lockedKeys) {
        memoryLockStore.delete(key);
        if (memoryLockTimeouts.has(key)) {
          clearTimeout(memoryLockTimeouts.get(key));
          memoryLockTimeouts.delete(key);
        }
      }
      return { success: false, conflictKey: lockKey };
    }

    memoryLockStore.set(lockKey, userId);
    const timeout = setTimeout(() => {
      memoryLockStore.delete(lockKey);
      memoryLockTimeouts.delete(lockKey);
    }, 600 * 1000); // 10 minutes
    memoryLockTimeouts.set(lockKey, timeout);
    lockedKeys.push(lockKey);
  }

  return { success: true };
};

/**
 * Releases locks for a set of seats.
 * @param {string} eventId 
 * @param {Array<{section: string, seatNumber: number}>} seats 
 */
export const releaseSeats = async (eventId, seats) => {
  const keys = seats.map(seat => `seat:${eventId}:${seat.section}:${seat.seatNumber}`);

  // In-memory cleanup
  for (const key of keys) {
    memoryLockStore.delete(key);
    if (memoryLockTimeouts.has(key)) {
      clearTimeout(memoryLockTimeouts.get(key));
      memoryLockTimeouts.delete(key);
    }
  }

  // Redis cleanup
  if (isRedisAvailable && redisClient && keys.length > 0) {
    try {
      await redisClient.del(keys);
    } catch (error) {
      console.error('[Redis Release Error]', error.message);
    }
  }

  return true;
};

/**
 * Retrieves the owner/userId of a locked seat, if it exists.
 */
export const isSeatLocked = async (eventId, section, seatNumber) => {
  const lockKey = `seat:${eventId}:${section}:${seatNumber}`;

  if (isRedisAvailable && redisClient) {
    try {
      const owner = await redisClient.get(lockKey);
      if (owner) return owner;
    } catch (e) {
      isRedisAvailable = false;
    }
  }

  return memoryLockStore.get(lockKey) || null;
};

/**
 * Retrieves all locked seats and their owner IDs for a given event.
 */
export const getLockedSeatsForEvent = async (eventId) => {
  const lockedSeats = [];
  const prefix = `seat:${eventId}:`;

  // From in-memory store
  for (const [key, lockedBy] of memoryLockStore.entries()) {
    if (key.startsWith(prefix)) {
      const parts = key.split(':');
      lockedSeats.push({
        section: parts[2],
        seatNumber: parseInt(parts[3], 10),
        lockedBy
      });
    }
  }

  // From Redis if online
  if (isRedisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(`${prefix}*`);
      for (const key of keys) {
        const parts = key.split(':');
        const section = parts[2];
        const seatNumber = parseInt(parts[3], 10);
        const lockedBy = await redisClient.get(key);
        if (!lockedSeats.some(s => s.section === section && s.seatNumber === seatNumber)) {
          lockedSeats.push({ section, seatNumber, lockedBy });
        }
      }
    } catch (error) {
      isRedisAvailable = false;
    }
  }

  return lockedSeats;
};

export const lockSeat = async (eventId, section, seatNumber, userId, ttlSeconds = 600) => {
  const lockKey = `seat:${eventId}:${section}:${seatNumber}`;

  if (isRedisAvailable && redisClient) {
    try {
      const result = await redisClient.set(lockKey, userId, 'EX', ttlSeconds, 'NX');
      if (result === 'OK') return true;
    } catch (e) {
      isRedisAvailable = false;
    }
  }

  if (memoryLockStore.has(lockKey)) return false;
  memoryLockStore.set(lockKey, userId);
  const timeout = setTimeout(() => {
    memoryLockStore.delete(lockKey);
    memoryLockTimeouts.delete(lockKey);
  }, ttlSeconds * 1000);
  memoryLockTimeouts.set(lockKey, timeout);
  return true;
};

export const releaseSeat = async (eventId, section, seatNumber) => {
  const lockKey = `seat:${eventId}:${section}:${seatNumber}`;
  memoryLockStore.delete(lockKey);
  if (memoryLockTimeouts.has(lockKey)) {
    clearTimeout(memoryLockTimeouts.get(lockKey));
    memoryLockTimeouts.delete(lockKey);
  }

  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(lockKey);
    } catch (e) {
      isRedisAvailable = false;
    }
  }
  return true;
};

export const getSeatLockOwner = async (eventId, section, seatNumber) => {
  return await isSeatLocked(eventId, section, seatNumber);
};

export default redisClient;
