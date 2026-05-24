import mongoose from 'mongoose';

const SeatSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  totalSeats: {
    type: Number,
    required: true,
    min: [1, 'Total seats must be at least 1']
  },
  availableSeats: {
    type: Number,
    required: true,
    min: [0, 'Available seats cannot be negative']
  }
});

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add an event date']
  },
  venue: {
    type: String,
    required: [true, 'Please add a venue'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Please add a city'],
    trim: true,
    lowercase: true
  },
  bannerImage: {
    type: String,
    default: '/uploads/default-banner.jpg'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalSeats: {
    type: Number,
    required: true
  },
  bookedSeats: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'cancelled'],
    default: 'upcoming'
  },
  seatSections: {
    type: [SeatSectionSchema],
    validate: [v => Array.isArray(v) && v.length > 0, 'Event must have at least one seat section']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Single field indexes for querying
EventSchema.index({ city: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ date: 1 });

// Compound indexes for common combinations
EventSchema.index({ city: 1, category: 1 });
EventSchema.index({ city: 1, date: 1 });

export default mongoose.model('Event', EventSchema);
