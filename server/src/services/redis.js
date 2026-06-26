import Redis from 'ioredis';
import env from '../config/env.js';

let redisClient;

try {
  redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 2000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    console.log('\x1b[32m[Redis] Client Connected\x1b[0m');
  });

  redisClient.on('error', (err) => {
    console.error('\x1b[31m[Redis] Client Error:\x1b[0m', err.message);
  });

  redisClient.connect().catch(err => {
    console.error('\x1b[31m[Redis] Connection failed at boot:\x1b[0m', err.message);
  });
} catch (error) {
  console.error('\x1b[31m[Redis] Initialization Error:\x1b[0m', error.message);
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
  try {
    for (const seat of seats) {
      const lockKey = `seat:${eventId}:${seat.section}:${seat.seatNumber}`;
      // EX 600 NX: Expire in 10 minutes (600s), set ONLY if key does not exist
      const result = await redisClient.set(lockKey, userId, 'EX', 600, 'NX');
      
      if (result !== 'OK') {
        // Rollback already acquired locks in this attempt
        if (lockedKeys.length > 0) {
          await redisClient.del(lockedKeys);
        }
        return { success: false, conflictKey: lockKey };
      }
      lockedKeys.push(lockKey);
    }
    return { success: true };
  } catch (error) {
    if (lockedKeys.length > 0) {
      try {
        await redisClient.del(lockedKeys);
      } catch (delErr) {
        console.error('[Redis Lock Rollback Error]', delErr.message);
      }
    }
    throw error;
  }
};

/**
 * Releases locks for a set of seats.
 * @param {string} eventId 
 * @param {Array<{section: string, seatNumber: number}>} seats 
 */
export const releaseSeats = async (eventId, seats) => {
  try {
    const keys = seats.map(seat => `seat:${eventId}:${seat.section}:${seat.seatNumber}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('[Redis Release Error]', error.message);
    return false;
  }
};

/**
 * Retrieves the owner/userId of a locked seat, if it exists.
 */
export const isSeatLocked = async (eventId, section, seatNumber) => {
  try {
    const lockKey = `seat:${eventId}:${section}:${seatNumber}`;
    return await redisClient.get(lockKey);
  } catch (error) {
    return null;
  }
};

/**
 * Retrieves all locked seats and their owner IDs for a given event.
 */
export const getLockedSeatsForEvent = async (eventId) => {
  try {
    const pattern = `seat:${eventId}:*`;
    const keys = await redisClient.keys(pattern);
    if (!keys || keys.length === 0) return [];
    
    const lockedSeats = [];
    for (const key of keys) {
      const parts = key.split(':'); // ['seat', eventId, section, seatNumber]
      const section = parts[2];
      const seatNumber = parseInt(parts[3], 10);
      const lockedBy = await redisClient.get(key);
      
      lockedSeats.push({ section, seatNumber, lockedBy });
    }
    return lockedSeats;
  } catch (error) {
    console.error('[Redis getLockedSeatsForEvent Error]', error.message);
    return [];
  }
};

export const lockSeat = async (eventId, section, seatNumber, userId, ttlSeconds) => {
  try {
    const lockKey = `seat:${eventId}:${section}:${seatNumber}`;
    const result = await redisClient.set(lockKey, userId, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (error) {
    return false;
  }
};

export const releaseSeat = async (eventId, section, seatNumber) => {
  try {
    const lockKey = `seat:${eventId}:${section}:${seatNumber}`;
    await redisClient.del(lockKey);
    return true;
  } catch (error) {
    return false;
  }
};

export const getSeatLockOwner = async (eventId, section, seatNumber) => {
  return await isSeatLocked(eventId, section, seatNumber);
};

export default redisClient;
