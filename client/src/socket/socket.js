import { io } from 'socket.io-client';

let socket = null;

export const initSocketClient = (userId) => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  
  if (socket) {
    socket.disconnect();
  }

  socket = io(socketUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('[Socket Client] Connected to real-time server:', socket.id);
    
    // Join personal user notification room
    if (userId) {
      socket.emit('join-user', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket Client] Disconnected from server.');
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocketClient = (userId) => {
  if (socket) {
    if (userId) {
      socket.emit('leave-user', userId);
    }
    socket.disconnect();
    socket = null;
    console.log('[Socket Client] Socket terminated.');
  }
};
