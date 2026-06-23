import { Schema, model } from 'mongoose';

const serviceRecordSchema = new Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    chassisNumber: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    serviceDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    jobCardDetails: {
      type: String,
      required: true,
    },
    technicianId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    laborCharges: {
      type: Number,
      required: true,
      default: 0,
    },
    partsReplaced: [
      {
        partSku: String,
        partName: String,
        quantity: Number,
        price: Number,
      },
    ],
    billingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Received', 'Inspecting', 'Parts Replaced', 'Washing', 'Ready', 'Delivered'],
      default: 'Received',
      index: true,
    },
    amcAttached: {
      type: Boolean,
      default: false,
    },
    roadsideAssistance: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ServiceRecord = model('ServiceRecord', serviceRecordSchema);
export default ServiceRecord;
