import { Schema, model } from 'mongoose';

const leadSchema = new Schema(
  {
    leadId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      default: 'Manual Entry', // or CSV Import, Website, etc.
    },
    status: {
      type: String,
      enum: ['New', 'Interested', 'Follow-up', 'Converted', 'Rejected'],
      default: 'New',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    remarks: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const Lead = model('Lead', leadSchema);
export default Lead;
