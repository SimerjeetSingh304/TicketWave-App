import User from '../models/User.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import { emitSeatReleased } from '../services/socket.js';

// @desc    Get all users with roles
// @route   GET /api/admin/users
// @access  Admin
export const getUsers = async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: users,
    message: 'Users fetched successfully'
  });
};

// @desc    Change user role
// @route   PATCH /api/admin/users/:id/role
// @access  Admin
export const updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!role || !['user', 'organizer', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Please provide a valid role (user, organizer, admin)'
    });
  }

  // Prevent self role-demotion
  if (req.user._id.toString() === req.params.id && role !== 'admin') {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'You cannot change your own admin role status'
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'User not found'
    });
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: `User role updated to ${role} successfully`
  });
};

// @desc    Get all events with status
// @route   GET /api/admin/events
// @access  Admin
export const getAllEventsAdmin = async (req, res) => {
  const events = await Event.find({})
    .populate('organizer', 'name email')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    data: events,
    message: 'All events fetched successfully'
  });
};

// @desc    Moderate event status (Approve / Cancel)
// @route   PATCH /api/admin/events/:id/status
// @access  Admin
export const moderateEventStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || !['upcoming', 'ongoing', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Please provide a valid event status (upcoming, ongoing, cancelled)'
    });
  }

  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Event not found'
    });
  }

  const previousStatus = event.status;
  event.status = status;
  await event.save();

  // If status is cancelled, cancel all active bookings and refund
  if (status === 'cancelled' && previousStatus !== 'cancelled') {
    const bookings = await Booking.find({ event: event._id, status: 'confirmed' });
    for (const booking of bookings) {
      booking.status = 'cancelled';
      await booking.save();

      // Release seats on live socket room
      for (const seat of booking.seats) {
        emitSeatReleased(event._id, seat.section, seat.seatNumber);
      }
    }
  }

  res.status(200).json({
    success: true,
    data: event,
    message: `Event status set to ${status} successfully`
  });
};
