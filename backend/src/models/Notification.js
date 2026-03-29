import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    meta: { type: Object },
    createdAt: { type: Date, default: Date.now },
    dedupKey: { type: String }, // for deduplication
  },
  { timestamps: true }
);

// Prevent duplicate notifications with same dedupKey
NotificationSchema.index({ dedupKey: 1 }, { unique: true, sparse: true });

export default mongoose.model('Notification', NotificationSchema);
