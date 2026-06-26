import express from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerEvents
} from '../controllers/event.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Organizer routes (note: place specific routes before parametrized :id to avoid collisions)
router.get('/organizer/my-events', authMiddleware, checkRole('organizer'), getOrganizerEvents);

// Organizer / Admin write routes
router.post('/', authMiddleware, checkRole('organizer', 'admin'), upload.single('bannerImage'), createEvent);
router.put('/:id', authMiddleware, checkRole('organizer', 'admin'), upload.single('bannerImage'), updateEvent);
router.delete('/:id', authMiddleware, checkRole('organizer', 'admin'), deleteEvent);

export default router;
