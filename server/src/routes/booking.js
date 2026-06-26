import express from 'express';
import {
  lockSeatsController,
  unlockSeatsController,
  createBooking,
  getMyBookings,
  getEventBookings,
  cancelBooking,
  verifyBooking
} from '../controllers/booking.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// All booking routes require authentication
router.use(authMiddleware);

// User endpoints
router.post('/lock', lockSeatsController);
router.post('/unlock', unlockSeatsController);
router.post('/', createBooking);
router.get('/my', getMyBookings);
router.patch('/:id/cancel', cancelBooking);

// Organizer/Admin endpoints
router.get('/event/:eventId', checkRole('organizer', 'admin'), getEventBookings);
router.get('/verify/:bookingId', checkRole('organizer', 'admin'), verifyBooking);

export default router;
