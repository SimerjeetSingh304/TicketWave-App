import { Server } from 'socket.io';
import { lockSeat, releaseSeat } from './redis.js';

let io;
const viewerCounts = new Map(); // eventId -> Set of socketIds

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // Join room when viewing specific event detail
    socket.on('join-event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`[Socket] Socket ${socket.id} joined event:${eventId}`);

      // Track viewer counts
      if (!viewerCounts.has(eventId)) {
        viewerCounts.set(eventId, new Set());
      }
      viewerCounts.get(eventId).add(socket.id);
      const count = viewerCounts.get(eventId).size;
      io.to(`event:${eventId}`).emit('viewer-count', { count });
    });

    // Leave room when exiting event detail page
    socket.on('leave-event', (eventId) => {
      socket.leave(`event:${eventId}`);
      console.log(`[Socket] Socket ${socket.id} left event:${eventId}`);

      // Track viewer counts
      if (viewerCounts.has(eventId)) {
        viewerCounts.get(eventId).delete(socket.id);
        const count = viewerCounts.get(eventId).size;
        io.to(`event:${eventId}`).emit('viewer-count', { count });
      }
    });

    // Join personal user room for direct bookings/updates notifications
    socket.on('join-user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket] Socket ${socket.id} joined user:${userId}`);
    });

    socket.on('leave-user', (userId) => {
      socket.leave(`user:${userId}`);
      console.log(`[Socket] Socket ${socket.id} left user:${userId}`);
    });

    // Listen for real-time seat lock requests from client
    socket.on('lock-seat', async ({ eventId, section, seatNumber, userId }) => {
      try {
        const locked = await lockSeat(eventId, section, seatNumber, userId, 600);
        if (locked) {
          io.to(`event:${eventId}`).emit('seat-locked', { 
            section, 
            seatNumber, 
            userId,
            lockedAt: Date.now(),
            ttlSeconds: 600
          });
        } else {
          socket.emit('lock-failed', { section, seatNumber, message: 'Seat already locked' });
        }
      } catch (err) {
        socket.emit('lock-failed', { section, seatNumber, message: err.message });
      }
    });

    // Listen for real-time seat unlock requests from client
    socket.on('unlock-seat', async ({ eventId, section, seatNumber }) => {
      try {
        await releaseSeat(eventId, section, seatNumber);
        io.to(`event:${eventId}`).emit('seat-released', { section, seatNumber });
      } catch (err) {
        console.error('[Socket unlock-seat Error]', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);

      // Remove from all viewerCounts tracking
      for (const [eventId, socketIds] of viewerCounts.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          const count = socketIds.size;
          io.to(`event:${eventId}`).emit('viewer-count', { count });
        }
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

// Socket Emit Helper functions
export function emitSeatLocked(eventId, section, seatNumber, userId) {
  if (!io) return;
  io.to(`event:${eventId}`).emit('seat-locked', { 
    section, 
    seatNumber, 
    userId,
    lockedAt: Date.now(),
    ttlSeconds: 600
  });
  console.log(`[Socket Emit] seat-locked: event:${eventId} -> ${section}:${seatNumber} by user:${userId}`);
}

export function emitSeatReleased(eventId, section, seatNumber) {
  if (!io) return;
  io.to(`event:${eventId}`).emit('seat-released', { section, seatNumber });
  console.log(`[Socket Emit] seat-released: event:${eventId} -> ${section}:${seatNumber}`);
}

export function emitSeatBooked(eventId, seats) {
  if (!io) return;
  // seats is an array of { section, seatNumber }
  io.to(`event:${eventId}`).emit('seats-booked', { seats });
  console.log(`[Socket Emit] seats-booked: event:${eventId} ->`, seats);
}

export function emitUserNotification(userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`[Socket Emit] notification: user:${userId} ->`, notification.message);
}
