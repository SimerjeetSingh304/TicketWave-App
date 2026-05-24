import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please add a message']
  },
  type: {
    type: String,
    enum: ['booking_success', 'booking_cancelled', 'seat_release', 'system'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to quickly fetch notifications for a user sorted by date
NotificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
