import { Schema, model } from 'mongoose';

const testRideSchema = new Schema(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    chassisNumber: {
      type: String,
      required: true,
      index: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    driverLicense: {
      type: String,
    },
    route: {
      type: String,
    },
    scooterModel: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

export const TestRide = model('TestRide', testRideSchema);
export default TestRide;
