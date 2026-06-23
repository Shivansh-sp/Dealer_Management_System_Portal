import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Material Request', 'Purchase Request', 'Warranty Status', 'Low Stock', 'Lead Assignment', 'Service Update', 'Gate Pass'],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const Notification = model('Notification', notificationSchema);
export default Notification;
