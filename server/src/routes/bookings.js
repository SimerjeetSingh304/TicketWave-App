import express from 'express';
import {
  createBooking,
  confirmBooking,
  getMyBookings,
  getEventBookings,
  cancelBooking,
  verifyBooking,
  releaseSeatsLock
} from '../controllers/bookingController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// User routes (Required authenticated user role)
router.post('/', authMiddleware, checkRole('user', 'admin'), createBooking);
router.post('/:id/confirm', authMiddleware, checkRole('user', 'admin'), confirmBooking);
router.get('/my', authMiddleware, checkRole('user', 'admin', 'organizer'), getMyBookings);
router.patch('/:id/cancel', authMiddleware, checkRole('user', 'admin'), cancelBooking);
router.delete('/lock', authMiddleware, checkRole('user', 'admin'), releaseSeatsLock);

// Organizer routes (Required organizer/admin role)
router.get('/event/:eventId', authMiddleware, checkRole('organizer', 'admin'), getEventBookings);
router.get('/verify/:bookingId', authMiddleware, checkRole('organizer', 'admin'), verifyBooking);

export default router;
