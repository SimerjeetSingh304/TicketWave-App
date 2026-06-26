import { Server } from 'socket.io';
import { getLockedSeatsForEvent } from './redis.js';

let io;

export const initSocket = (server, clientUrl) => {
  io = new Server(server, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`\x1b[36m[Socket] Socket Connected: ${socket.id}\x1b[0m`);

    // Listen for client joining an event room
    socket.on('join-event', async (eventId) => {
      if (!eventId) return;
      socket.join(`event:${eventId}`);
      console.log(`[Socket] Client ${socket.id} joined event:${eventId}`);
      
      // Immediately send current locks in Redis to this client
      try {
        const lockedSeats = await getLockedSeatsForEvent(eventId);
        socket.emit('initial-locks', lockedSeats);
      } catch (err) {
        console.error('[Socket Initial Locks Error]', err.message);
      }
    });

    // Listen for client leaving an event room
    socket.on('leave-event', (eventId) => {
      if (!eventId) return;
      socket.leave(`event:${eventId}`);
      console.log(`[Socket] Client ${socket.id} left event:${eventId}`);
    });

    // Listen for client joining personal user room
    socket.on('join-user', (userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      console.log(`[Socket] Client ${socket.id} joined user:${userId}`);
    });

    // Listen for client leaving personal user room
    socket.on('leave-user', (userId) => {
      if (!userId) return;
      socket.leave(`user:${userId}`);
      console.log(`[Socket] Client ${socket.id} left user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

/**
 * Emit lock updates to all users in an event room
 */
export const emitSeatLocked = (eventId, seats, userId) => {
  if (!io) return;
  io.to(`event:${eventId}`).emit('seat-locked', { eventId, seats, userId });
};

/**
 * Emit release updates to all users in an event room
 */
export const emitSeatReleased = (eventId, seats) => {
  if (!io) return;
  io.to(`event:${eventId}`).emit('seat-released', { eventId, seats });
};

/**
 * Emit booking updates to all users in an event room
 */
export const emitSeatBooked = (eventId, seats) => {
  if (!io) return;
  io.to(`event:${eventId}`).emit('seat-booked', { eventId, seats });
};

/**
 * Emit personal notifications to a specific user
 */
export const emitUserNotification = (userId, notification) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
};

export default {
  initSocket,
  getIO,
  emitSeatLocked,
  emitSeatReleased,
  emitSeatBooked,
  emitUserNotification
};
