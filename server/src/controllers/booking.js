import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import { lockSeats, releaseSeats, isSeatLocked } from '../services/redis.js';
import { emitSeatLocked, emitSeatReleased, emitSeatBooked, emitUserNotification } from '../services/socket.js';
import { generateQRCode } from '../services/qr.js';

/**
 * Lock seats in Redis (pre-checkout reservation)
 * POST /api/bookings/lock
 */
export const lockSeatsController = async (req, res) => {
  const { eventId, seats } = req.body;
  const userId = req.user._id.toString();

  if (!eventId || !seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid request data' });
  }

  // Verify event exists and is upcoming
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  if (event.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Event has been cancelled' });
  }

  // Attempt locking in Redis
  const lockResult = await lockSeats(eventId, seats, userId);
  if (!lockResult.success) {
    return res.status(409).json({
      success: false,
      message: 'One or more of the selected seats are already locked or booked. Please choose other seats.',
      conflictKey: lockResult.conflictKey
    });
  }

  // Broadcast lock state to all viewers of this event room
  emitSeatLocked(eventId, seats, userId);

  return res.status(200).json({
    success: true,
    message: 'Seats locked successfully for 10 minutes'
  });
};

/**
 * Release locked seats in Redis
 * POST /api/bookings/unlock
 */
export const unlockSeatsController = async (req, res) => {
  const { eventId, seats } = req.body;

  if (!eventId || !seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid request data' });
  }

  await releaseSeats(eventId, seats);

  // Broadcast release state to the event room
  emitSeatReleased(eventId, seats);

  return res.status(200).json({
    success: true,
    message: 'Seats released successfully'
  });
};

/**
 * Confirm checkout and create Booking
 * POST /api/bookings
 */
export const createBooking = async (req, res) => {
  const { eventId, seats, totalAmount } = req.body;
  const userId = req.user._id.toString();

  if (!eventId || !seats || !Array.isArray(seats) || seats.length === 0 || !totalAmount) {
    return res.status(400).json({ success: false, message: 'Missing required booking parameters' });
  }

  // Fetch Event
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  // Verify that the user holds the locks for these seats in Redis (optional but recommended safety)
  for (const seat of seats) {
    const lockedBy = await isSeatLocked(eventId, seat.section, seat.seatNumber);
    if (lockedBy && lockedBy !== userId) {
      return res.status(409).json({
        success: false,
        message: 'Seats are locked by another user. Booking expired or cancelled.'
      });
    }
  }

  // Check section capacity & deduct availability in Event model
  for (const seat of seats) {
    const section = event.seatSections.find((s) => s.name === seat.section);
    if (!section) {
      return res.status(400).json({ success: false, message: `Seat section "${seat.section}" does not exist` });
    }
    if (section.availableSeats <= 0) {
      return res.status(400).json({ success: false, message: `No seats available in section ${seat.section}` });
    }
    // Deduct seat
    section.availableSeats -= 1;
  }

  event.bookedSeats += seats.length;
  await event.save();

  // Create the booking in MongoDB
  const booking = new Booking({
    user: userId,
    event: eventId,
    seats,
    totalAmount,
    status: 'confirmed'
  });

  await booking.save();

  // Generate QR Code base64 data URL
  const qrCodeData = await generateQRCode(booking._id.toString());
  booking.qrCode = qrCodeData;
  await booking.save();

  // Release Redis keys now that the seats are permanently booked
  await releaseSeats(eventId, seats);

  // Create Notification
  const notification = new Notification({
    user: userId,
    message: `Your booking for "${event.title}" has been confirmed!`,
    type: 'booking_success'
  });
  await notification.save();

  // Broadcast updates
  emitSeatBooked(eventId, seats);
  emitUserNotification(userId, notification);

  return res.status(201).json({
    success: true,
    data: booking
  });
};

/**
 * Fetch authenticated user's bookings
 * GET /api/bookings/my
 */
export const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('event')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: bookings
  });
};

/**
 * Fetch all bookings for a specific event (Organizer only)
 * GET /api/bookings/event/:eventId
 */
export const getEventBookings = async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  // Check event ownership
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not own this event' });
  }

  const bookings = await Booking.find({ event: eventId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: bookings
  });
};

/**
 * Cancel user's booking (allowed only if event start date is > 24 hours away)
 * PATCH /api/bookings/:id/cancel
 */
export const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('event');
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Check booking ownership
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized cancellation' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
  }

  // Check start date (must be > 24hr away)
  const eventTime = new Date(booking.event.date).getTime();
  const currentTime = Date.now();
  const timeDifference = eventTime - currentTime;
  const hoursRemaining = timeDifference / (1000 * 60 * 60);

  if (hoursRemaining < 24) {
    return res.status(400).json({
      success: false,
      message: 'Cancellations must be requested at least 24 hours before the event start time'
    });
  }

  // Update Event seat counts
  const event = await Event.findById(booking.event._id);
  if (event) {
    for (const seat of booking.seats) {
      const section = event.seatSections.find((s) => s.name === seat.section);
      if (section) {
        section.availableSeats += 1;
      }
    }
    event.bookedSeats = Math.max(0, event.bookedSeats - booking.seats.length);
    await event.save();
  }

  // Set booking status to cancelled
  booking.status = 'cancelled';
  await booking.save();

  // Create Notification
  const notification = new Notification({
    user: booking.user,
    message: `Your booking for "${booking.event.title}" has been cancelled. Refund initiated.`,
    type: 'booking_cancelled'
  });
  await notification.save();

  // Broadcast seat release to room
  emitSeatReleased(booking.event._id.toString(), booking.seats);
  emitUserNotification(booking.user.toString(), notification);

  return res.status(200).json({
    success: true,
    data: booking,
    message: 'Booking cancelled successfully'
  });
};

/**
 * Verify scan QR code (Organizer only)
 * GET /api/bookings/verify/:bookingId
 */
export const verifyBooking = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId).populate('event').populate('user', 'name email');
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Invalid ticket / Booking not found' });
  }

  // Verify that the requester is the event organizer or admin
  if (booking.event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to verify this event' });
  }

  return res.status(200).json({
    success: true,
    message: 'Ticket verified successfully',
    data: {
      bookingId: booking._id,
      userName: booking.user.name,
      userEmail: booking.user.email,
      eventTitle: booking.event.title,
      eventDate: booking.event.date,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      status: booking.status
    }
  });
};
