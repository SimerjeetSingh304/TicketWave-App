import './src/config/env.js'; // Must be first to validate env variables
import { validateEnv } from './src/config/env.js';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import 'express-async-errors'; // Clean async errors without try-catch in routes

import { connectDB } from './src/config/db.js';
import { initSocket } from './src/services/socket.js';
import { errorHandler } from './src/middleware/errorHandler.js';

// Route imports
import authRoutes from './src/routes/auth.js';
import eventRoutes from './src/routes/events.js';
import bookingRoutes from './src/routes/bookings.js';
import adminRoutes from './src/routes/admin.js';

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environments on startup
validateEnv();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading images from frontend
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      app: 'TicketWave API Service',
      version: '1.0.0',
      status: 'healthy'
    },
    message: 'Welcome to TicketWave backend services'
  });
});

// Bind routers
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// Global Error Handler Middleware (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] TicketWave API server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
