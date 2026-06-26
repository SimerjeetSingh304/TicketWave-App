import User from '../models/User.js';
import Event from '../models/Event.js';

/**
 * Fetch all users (Admin only)
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: users
  });
};

/**
 * Update a user's role (Admin only)
 * PATCH /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!role || !['user', 'organizer', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid user role specified' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.role = role;
  await user.save();

  return res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    message: `User role successfully changed to ${role}`
  });
};

/**
 * Fetch all events with status details (Admin only)
 * GET /api/admin/events
 */
export const getAllEventsAdmin = async (req, res) => {
  const events = await Event.find().populate('organizer', 'name email').sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: events
  });
};

/**
 * Moderate event status (Admin only)
 * PATCH /api/admin/events/:id/status
 */
export const updateEventStatus = async (req, res) => {
  const { status } = req.body;
  if (!status || !['upcoming', 'ongoing', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid event status specified' });
  }

  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  event.status = status;
  await event.save();

  return res.status(200).json({
    success: true,
    data: event,
    message: `Event status updated successfully to ${status}`
  });
};
