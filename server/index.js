import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import 'express-async-errors';

import env, { validateEnv } from './src/config/env.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/services/socket.js';
import errorHandler from './src/middleware/errorHandler.js';

import authRoutes from './src/routes/auth.js';
import eventRoutes from './src/routes/events.js';
import bookingRoutes from './src/routes/bookings.js';
import adminRoutes from './src/routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate configurations before bootstrap
validateEnv();

const app = express();
const server = http.createServer(app);

// Connect to MongoDB Database
connectDB();

// Initialize Socket.io Server
initSocket(server, env.clientUrl);

// Base Middleware Stack
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading event banners on frontend
}));

app.use(cors({
  origin: env.clientUrl || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Serve static directory for uploaded event banners
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Mount API routers
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'TicketWave API service is online and healthy' });
});

// Capture and process global exceptions
app.use(errorHandler);

const PORT = env.port || 5000;
server.listen(PORT, () => {
  console.log(`\x1b[32m[Server] Listening on port ${PORT}\x1b[0m`);
});
