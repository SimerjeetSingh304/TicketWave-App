import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'info' // e.g., 'booking_success', 'booking_cancelled', 'info'
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ user: 1 });
NotificationSchema.index({ user: 1, read: 1 });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
