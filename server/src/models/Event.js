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
    min: 0
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  }
});

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Event description is required']
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Event date is required']
    },
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      lowercase: true,
      trim: true
    },
    bannerImage: {
      type: String,
      default: '/uploads/default-event.jpg'
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'cancelled'],
      default: 'upcoming'
    },
    seatSections: {
      type: [SeatSectionSchema],
      required: true,
      validate: [
        (val) => val.length > 0,
        'At least one seat section must be defined'
      ]
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance (search, filter, sort)
EventSchema.index({ city: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ city: 1, category: 1, date: 1 }); // Compound index for search filters

const Event = mongoose.model('Event', EventSchema);

export default Event;
