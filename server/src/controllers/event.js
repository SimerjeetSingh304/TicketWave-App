import Event from '../models/Event.js';
import Booking from '../models/Booking.js';

/**
 * Fetch all events (Public, paginated and filtered)
 * GET /api/events
 */
export const getAllEvents = async (req, res) => {
  const { city, category, date, page = 1, limit = 10 } = req.query;
  const filter = {};

  // Case-insensitive filtering
  if (city) {
    filter.city = city.toLowerCase().trim();
  }
  if (category) {
    filter.category = new RegExp(category.trim(), 'i');
  }
  if (date) {
    const queryDate = new Date(date);
    // Find events happening on the query date
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Event.countDocuments(filter);
  const events = await Event.find(filter)
    .populate('organizer', 'name email')
    .sort({ date: 1 })
    .skip(skip)
    .limit(limitNum);

  return res.status(200).json({
    success: true,
    data: {
      events,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
};

/**
 * Fetch a single event's details
 * GET /api/events/:id
 */
export const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name email');
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  return res.status(200).json({
    success: true,
    data: event
  });
};

/**
 * Create a new event (Organizer only)
 * POST /api/events
 */
export const createEvent = async (req, res) => {
  const { title, description, category, date, venue, city, seatSections } = req.body;

  let bannerImage = '/uploads/default-event.jpg';
  if (req.file) {
    bannerImage = `/uploads/${req.file.filename}`;
  }

  let parsedSections = seatSections;
  if (typeof seatSections === 'string') {
    parsedSections = JSON.parse(seatSections);
  }

  if (!parsedSections || parsedSections.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one seat section must be defined' });
  }

  // Populate available seats matching total seats
  const sections = parsedSections.map((sec) => ({
    name: sec.name,
    price: Number(sec.price),
    totalSeats: Number(sec.totalSeats),
    availableSeats: Number(sec.totalSeats)
  }));

  const totalSeats = sections.reduce((sum, sec) => sum + sec.totalSeats, 0);

  const event = new Event({
    title,
    description,
    category,
    date: new Date(date),
    venue,
    city: city.toLowerCase().trim(),
    bannerImage,
    organizer: req.user._id,
    totalSeats,
    seatSections: sections
  });

  await event.save();

  return res.status(201).json({
    success: true,
    data: event
  });
};

/**
 * Update an event (Organizer own event only)
 * PUT /api/events/:id
 */
export const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  // Role validation: Only the organizing user or an admin can modify
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not own this event' });
  }

  const { title, description, category, date, venue, city, status, seatSections } = req.body;

  if (title) event.title = title;
  if (description) event.description = description;
  if (category) event.category = category;
  if (date) event.date = new Date(date);
  if (venue) event.venue = venue;
  if (city) event.city = city.toLowerCase().trim();
  if (status) event.status = status;

  if (req.file) {
    event.bannerImage = `/uploads/${req.file.filename}`;
  }

  if (seatSections) {
    let parsedSections = seatSections;
    if (typeof seatSections === 'string') {
      parsedSections = JSON.parse(seatSections);
    }
    
    event.seatSections = parsedSections.map((sec) => ({
      name: sec.name,
      price: Number(sec.price),
      totalSeats: Number(sec.totalSeats),
      availableSeats: sec.availableSeats !== undefined ? Number(sec.availableSeats) : Number(sec.totalSeats)
    }));

    event.totalSeats = event.seatSections.reduce((sum, sec) => sum + sec.totalSeats, 0);
  }

  await event.save();

  return res.status(200).json({
    success: true,
    data: event
  });
};

/**
 * Delete an event (Organizer or Admin)
 * DELETE /api/events/:id
 */
export const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot delete this event' });
  }

  await Event.findByIdAndDelete(req.params.id);

  return res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
};

/**
 * Get all events organized by the authenticated organizer along with booking statistics
 * GET /api/events/organizer/my-events
 */
export const getOrganizerEvents = async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });

  const eventsWithStats = [];
  for (const event of events) {
    // Look up confirmed bookings
    const bookings = await Booking.find({ event: event._id, status: 'confirmed' });
    
    const revenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const ticketsSold = bookings.reduce((sum, b) => sum + b.seats.length, 0);

    eventsWithStats.push({
      ...event.toObject(),
      stats: {
        revenue,
        ticketsSold,
        bookingCount: bookings.length
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: eventsWithStats
  });
};
