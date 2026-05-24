import mongoose from 'mongoose';

const BookedSeatSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    trim: true
  },
  seatNumber: {
    type: Number,
    required: true
  }
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seats: {
    type: [BookedSeatSchema],
    required: true,
    validate: [v => Array.isArray(v) && v.length > 0, 'Booking must select at least one seat']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  qrCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Single field indexes for querying
BookingSchema.index({ user: 1 });
BookingSchema.index({ event: 1 });
BookingSchema.index({ status: 1 });

export default mongoose.model('Booking', BookingSchema);
