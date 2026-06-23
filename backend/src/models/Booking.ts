import { Schema, model } from 'mongoose';

const bookingSchema = new Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bookingType: {
      type: String,
      enum: ['Service', 'HSRP'],
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    chassisNumber: {
      type: String,
      required: true,
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In-Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled',
      index: true,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Booking = model('Booking', bookingSchema);
export default Booking;
