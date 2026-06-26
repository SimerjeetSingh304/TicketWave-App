import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import fs from 'fs';
import { getLockedSeatsForEvent } from '../services/redis.js';

// @desc    Get all events (filtered, paginated)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  const { city, category, date, page = 1, limit = 10, search } = req.query;

  const query = {};

  // Filters
  if (city) {
    query.city = city.toLowerCase();
  }

  if (category) {
    query.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  if (date) {
    // Matches start of day to end of day in UTC/Local
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  // Full-text search
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  // Only show active/upcoming events for the public
  query.status = { $ne: 'cancelled' };

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const eventsWithSeats = events.map(event => {
      const availableSeats = event.totalSeats - (event.bookedSeats || 0);
      const seatsLeft = event.totalSeats > 0 ? Math.round((availableSeats / event.totalSeats) * 100) : 0;
      return {
        ...event,
        availableSeats,
        seatsLeft
      };
    });

    res.status(200).json({
      success: true,
      data: {
        events: eventsWithSeats,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: 'Events fetched successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message
    });
  }
};

// @desc    Get single event detail
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name email').lean();
  if (!event) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Event not found'
    });
  }

  // Calculate available seats
  const availableSeats = event.totalSeats - (event.bookedSeats || 0);
  const seatsLeft = event.totalSeats > 0 ? Math.round((availableSeats / event.totalSeats) * 100) : 0;
  event.availableSeats = availableSeats;
  event.seatsLeft = seatsLeft;

  // Fetch confirmed booked seats from MongoDB
  const bookings = await Booking.find({ event: event._id, status: 'confirmed' });
  const bookedSeats = bookings.flatMap(b => 
    b.seats.map(s => ({ section: s.section, seatNumber: s.seatNumber }))
  );

  // Fetch current active locks from Redis
  const lockedSeats = await getLockedSeatsForEvent(event._id);

  res.status(200).json({
    success: true,
    data: {
      event,
      bookedSeats,
      lockedSeats
    },
    message: 'Event detail fetched successfully'
  });
};

// @desc    Create new event
// @route   POST /api/events
// @access  Organizer
export const createEvent = async (req, res) => {
  const { title, description, category, date, venue, city, seatSections } = req.body;

  if (!title || !description || !category || !date || !venue || !city || !seatSections) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Please provide all required fields'
    });
  }

  // Parse seat sections if sent as string (from Multipart FormData)
  let parsedSeatSections;
  try {
    parsedSeatSections = typeof seatSections === 'string' ? JSON.parse(seatSections) : seatSections;
  } catch (e) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Invalid seat sections format'
    });
  }

  if (!Array.isArray(parsedSeatSections) || parsedSeatSections.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'At least one seat section is required'
    });
  }

  // Calculate capacity and sync available seats
  let totalSeats = 0;
  const structuredSections = parsedSeatSections.map(section => {
    const total = parseInt(section.totalSeats, 10);
    totalSeats += total;
    return {
      name: section.name,
      price: parseFloat(section.price),
      totalSeats: total,
      availableSeats: total // starts as fully available
    };
  });

  // Handle banner image upload path
  let bannerImage = '/uploads/default-banner.jpg';
  if (req.file) {
    bannerImage = `/uploads/${req.file.filename}`;
  }

  const event = await Event.create({
    title,
    description,
    category,
    date: new Date(date),
    venue,
    city: city.toLowerCase(),
    bannerImage,
    organizer: req.user._id,
    totalSeats,
    bookedSeats: 0,
    status: 'upcoming',
    seatSections: structuredSections
  });

  res.status(201).json({
    success: true,
    data: event,
    message: 'Event created successfully'
  });
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Organizer (Own Events)
export const updateEvent = async (req, res) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Event not found'
    });
  }

  // Check if owner is requesting update
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'You are not authorized to update this event'
    });
  }

  const { title, description, category, date, venue, city, status } = req.body;

  // Handle banner update if new file uploaded
  if (req.file) {
    // Delete old file if not default
    if (event.bannerImage && !event.bannerImage.includes('default-banner.jpg')) {
      const oldPath = `./${event.bannerImage}`;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    event.bannerImage = `/uploads/${req.file.filename}`;
  }

  if (title) event.title = title;
  if (description) event.description = description;
  if (category) event.category = category;
  if (date) event.date = new Date(date);
  if (venue) event.venue = venue;
  if (city) event.city = city.toLowerCase();
  if (status) event.status = status;

  await event.save();

  res.status(200).json({
    success: true,
    data: event,
    message: 'Event updated successfully'
  });
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Organizer (Own) / Admin
export const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      data: null,
      message: 'Event not found'
    });
  }

  // Authorized: either the organizer or an admin
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'You are not authorized to delete this event'
    });
  }

  // Delete banner image
  if (event.bannerImage && !event.bannerImage.includes('default-banner.jpg')) {
    const imagePath = `./${event.bannerImage}`;
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
      } catch (err) {
        console.error(`[File Delete Error] Failed to delete banner: ${err.message}`);
      }
    }
  }

  // Instead of deleting entirely, we mark it as cancelled, or delete from DB.
  // The user requirement says "DELETE /:id — organizer or admin".
  // Let's delete it from database.
  await Event.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Event deleted successfully'
  });
};

// @desc    Get organizer's own events with booking stats
// @route   GET /api/events/organizer/my-events
// @access  Organizer
export const getOrganizerEvents = async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ date: -1 });

  const eventsWithStats = await Promise.all(events.map(async (event) => {
    // Fetch bookings for this event
    const bookings = await Booking.find({ event: event._id, status: 'confirmed' });
    
    const totalTicketsSold = bookings.reduce((sum, b) => sum + b.seats.length, 0);
    const revenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const occupancyRate = event.totalSeats > 0 
      ? Math.round((totalTicketsSold / event.totalSeats) * 100) 
      : 0;

    return {
      _id: event._id,
      title: event.title,
      date: event.date,
      venue: event.venue,
      city: event.city,
      status: event.status,
      totalSeats: event.totalSeats,
      availableSeats: event.seatSections.reduce((sum, sec) => sum + sec.availableSeats, 0),
      totalTicketsSold,
      revenue,
      occupancyRate
    };
  }));

  res.status(200).json({
    success: true,
    data: eventsWithStats,
    message: 'Organizer events and stats fetched successfully'
  });
};
