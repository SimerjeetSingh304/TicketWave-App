import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import { lockSeat, releaseSeat, getSeatLockOwner } from '../services/redis.js';
import { generateQRCode } from '../services/qr.js';
import { emitSeatLocked, emitSeatReleased, emitSeatBooked, emitUserNotification } from '../services/socket.js';

// @desc    Initiate Booking & Lock Seats
// @route   POST /api/bookings
// @access  User
export const createBooking = async (req, res) => {
  console.log('[DEBUG] Incoming createBooking request:', req.body);
  const { eventId, seats, totalAmount } = req.body;
  const userId = req.user._id;

  if (!eventId || !seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Please provide eventId and seats to book'
    });
  }

  console.log('[DEBUG] Querying Event by ID:', eventId);
  const event = await Event.findById(eventId);
  console.log('[DEBUG] Event query complete. Found:', event ? event.title : 'null');
  if (!event) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Event not found'
    });
  }

  if (event.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Cannot book seats for a cancelled event'
    });
  }

  // 1. Verify seat availability and lock status
  const lockedSeats = [];
  try {
    for (const seat of seats) {
      const { section, seatNumber } = seat;

      // Check if seat section exists in event
      const sect = event.seatSections.find(s => s.name === section);
      if (!sect) {
        throw new Error(`Section ${section} does not exist in this event`);
      }

      if (seatNumber < 1 || seatNumber > sect.totalSeats) {
        throw new Error(`Seat number ${seatNumber} is out of bounds for section ${section}`);
      }

      console.log(`[DEBUG] Querying Booking for seat ${seatNumber} in ${section}`);
      const alreadyBooked = await Booking.findOne({
        event: eventId,
        status: 'confirmed',
        'seats.section': section,
        'seats.seatNumber': seatNumber
      });
      console.log(`[DEBUG] Booking query complete. Booked:`, !!alreadyBooked);

      if (alreadyBooked) {
        res.status(409); // Conflict
        throw new Error(`Seat ${seatNumber} in section ${section} is already booked`);
      }

      console.log(`[DEBUG] Querying Redis lock for seat ${seatNumber}`);
      const lockOwner = await getSeatLockOwner(eventId, section, seatNumber);
      console.log(`[DEBUG] Redis query complete. Owner:`, lockOwner);
      if (lockOwner && lockOwner.toString() !== userId.toString()) {
        res.status(409); // Conflict
        throw new Error(`Seat ${seatNumber} in section ${section} is currently locked by another user`);
      }
    }

    // 2. Lock the seats in Redis
    for (const seat of seats) {
      const { section, seatNumber } = seat;
      console.log(`[DEBUG] Setting Redis lock for seat ${seatNumber}`);
      const locked = await lockSeat(eventId, section, seatNumber, userId, 600); // 10 minutes lock
      console.log(`[DEBUG] Redis lock set complete. Success:`, locked);
      if (!locked) {
        res.status(409);
        throw new Error(`Failed to acquire lock for seat ${seatNumber} in section ${section}`);
      }
      lockedSeats.push(seat);
      // Emit socket event to event room
      emitSeatLocked(eventId, section, seatNumber, userId);
    }

    console.log('[DEBUG] Creating pending booking in MongoDB');
    const booking = await Booking.create({
      user: userId,
      event: eventId,
      seats,
      totalAmount,
      status: 'pending'
    });
    console.log('[DEBUG] MongoDB booking creation complete. ID:', booking._id);

    res.status(201).json({
      success: true,
      data: {
        bookingId: booking._id,
        seats: booking.seats,
        totalAmount: booking.totalAmount,
        expiresIn: 600 // 10 minutes in seconds
      },
      message: 'Seats locked. Please confirm booking within 10 minutes.'
    });

  } catch (error) {
    // Rollback any locks set in this request
    for (const seat of lockedSeats) {
      await releaseSeat(eventId, seat.section, seat.seatNumber);
      emitSeatReleased(eventId, seat.section, seat.seatNumber);
    }

    if (!res.statusCode || res.statusCode === 200) {
      res.status(400);
    }
    
    res.json({
      success: false,
      data: null,
      message: error.message
    });
  }
};

// @desc    Confirm Booking & Make Mock Payment
// @route   POST /api/bookings/:id/confirm
// @access  User
export const confirmBooking = async (req, res) => {
  console.log('[DEBUG] Incoming confirmBooking request for ID:', req.params.id);
  const bookingId = req.params.id;
  const userId = req.user._id;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Booking not found'
    });
  }

  if (booking.user.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Not authorized to confirm this booking'
    });
  }

  if (booking.status !== 'pending') {
    return res.status(400).json({
      success: false,
      data: null,
      message: `Booking cannot be confirmed because it is already ${booking.status}`
    });
  }

  const event = await Event.findById(booking.event);
  if (!event) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Event associated with this booking does not exist'
    });
  }

  // 1. Verify locks are still active in Redis
  for (const seat of booking.seats) {
    const lockOwner = await getSeatLockOwner(event._id, seat.section, seat.seatNumber);
    if (!lockOwner || lockOwner.toString() !== userId.toString()) {
      return res.status(410).json({
        success: false,
        data: null,
        message: 'Seat locks expired. Please try booking again.'
      });
    }
  }

  // 2. Perform payment transaction (Mocked) and finalize seats
  // Update Event seats availability
  for (const seat of booking.seats) {
    const sectionIndex = event.seatSections.findIndex(s => s.name === seat.section);
    if (sectionIndex !== -1) {
      if (event.seatSections[sectionIndex].availableSeats < 1) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `Seats no longer available in section ${seat.section}`
        });
      }
      event.seatSections[sectionIndex].availableSeats -= 1;
    }
  }
  event.bookedSeats += booking.seats.length;
  await event.save();

  // 3. Generate QR code
  const qrCodeBase64 = await generateQRCode(booking._id);

  // 4. Update Booking status to confirmed
  booking.status = 'confirmed';
  booking.qrCode = qrCodeBase64;
  await booking.save();

  // 5. Release Redis locks
  for (const seat of booking.seats) {
    await releaseSeat(event._id, seat.section, seat.seatNumber);
  }

  // 6. Socket updates
  emitSeatBooked(event._id, booking.seats);

  // Create persistent notification & emit
  const notification = await Notification.create({
    user: userId,
    message: `Your booking for "${event.title}" (${booking.seats.length} ticket(s)) has been confirmed!`,
    type: 'booking_success'
  });
  emitUserNotification(userId, notification);

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Booking confirmed and ticket generated successfully'
  });
};

// @desc    Get user's own bookings
// @route   GET /api/bookings/my
// @access  User
export const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name email' }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: bookings,
    message: 'User bookings fetched successfully'
  });
};

// @desc    Get all bookings for an event (Organizer only)
// @route   GET /api/bookings/event/:eventId
// @access  Organizer
export const getEventBookings = async (req, res) => {
  const eventId = req.params.eventId;

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Event not found'
    });
  }

  // Verify ownership
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Not authorized to view bookings for this event'
    });
  }

  const bookings = await Booking.find({ event: eventId, status: 'confirmed' })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: bookings,
    message: 'Event bookings fetched successfully'
  });
};

// @desc    Cancel Booking
// @route   PATCH /api/bookings/:id/cancel
// @access  User
export const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Booking not found'
    });
  }

  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Not authorized to cancel this booking'
    });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({
      success: false,
      data: null,
      message: `Booking cannot be cancelled because its status is ${booking.status}`
    });
  }

  const event = await Event.findById(booking.event);
  if (!event) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Event not found'
    });
  }

  // Verify cancellation is >24hr before event date
  const now = new Date();
  const eventTime = new Date(event.date);
  const diffTimeHours = (eventTime - now) / (1000 * 60 * 60);

  if (diffTimeHours < 24) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Bookings can only be cancelled at least 24 hours prior to the event start time'
    });
  }

  // Restore available seat counts on the Event
  for (const seat of booking.seats) {
    const sectionIndex = event.seatSections.findIndex(s => s.name === seat.section);
    if (sectionIndex !== -1) {
      event.seatSections[sectionIndex].availableSeats += 1;
    }
  }
  event.bookedSeats = Math.max(0, event.bookedSeats - booking.seats.length);
  await event.save();

  // Cancel booking
  booking.status = 'cancelled';
  await booking.save();

  // Emit socket update that seats are now released
  for (const seat of booking.seats) {
    emitSeatReleased(event._id, seat.section, seat.seatNumber);
  }

  // Create cancellation notification
  const notification = await Notification.create({
    user: booking.user,
    message: `Your booking for "${event.title}" has been successfully cancelled. Refund initiated.`,
    type: 'booking_cancelled'
  });
  emitUserNotification(booking.user, notification);

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Booking cancelled successfully'
  });
};

// @desc    Verify QR Scan (Organizer Only)
// @route   GET /api/bookings/verify/:bookingId
// @access  Organizer
export const verifyBooking = async (req, res) => {
  const bookingId = req.params.bookingId;

  const booking = await Booking.findById(bookingId)
    .populate('user', 'name email')
    .populate('event', 'title date venue city organizer status');

  if (!booking) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Ticket/Booking not found or invalid'
    });
  }

  // Check if current user is the organizer of the booking's event
  if (booking.event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Not authorized to verify tickets for this event'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      bookingId: booking._id,
      userName: booking.user.name,
      userEmail: booking.user.email,
      eventTitle: booking.event.title,
      eventDate: booking.event.date,
      venue: booking.event.venue,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      status: booking.status
    },
    message: 'Ticket verified successfully'
  });
};

// @desc    Release specific seat locks (deselecting seats)
// @route   DELETE /api/bookings/lock
// @access  User
export const releaseSeatsLock = async (req, res) => {
  const { eventId, seats } = req.body;

  if (!eventId || !seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Please provide eventId and seats to release locks'
    });
  }

  try {
    for (const seat of seats) {
      const { section, seatNumber } = seat;
      await releaseSeat(eventId, section, seatNumber);
      emitSeatReleased(eventId, section, seatNumber);
    }

    res.status(200).json({
      success: true,
      data: null,
      message: 'Seat locks released successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message
    });
  }
};
