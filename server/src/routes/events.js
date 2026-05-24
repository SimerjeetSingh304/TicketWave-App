import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerEvents
} from '../controllers/eventController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

// Setup uploads directory
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: fileFilter
});

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/organizer/my-events', authMiddleware, checkRole('organizer'), getOrganizerEvents);
router.get('/:id', getEventById);

// Protected routes (Organizer only)
router.post('/', authMiddleware, checkRole('organizer'), upload.single('bannerImage'), createEvent);
router.put('/:id', authMiddleware, checkRole('organizer'), upload.single('bannerImage'), updateEvent);

// Organizer or Admin can delete
router.delete('/:id', authMiddleware, checkRole('organizer', 'admin'), deleteEvent);

export default router;
