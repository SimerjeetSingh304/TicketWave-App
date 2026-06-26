import express from 'express';
import {
  getUsers,
  updateUserRole,
  getAllEventsAdmin,
  moderateEventStatus
} from '../controllers/adminController.js';
import { authMiddleware, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Apply admin validation middleware globally to all sub-routes
router.use(authMiddleware);
router.use(checkRole('admin'));

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/events', getAllEventsAdmin);
router.patch('/events/:id/status', moderateEventStatus);

export default router;
