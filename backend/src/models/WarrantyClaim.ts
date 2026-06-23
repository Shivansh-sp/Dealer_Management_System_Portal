import { Schema, model } from 'mongoose';

const warrantyClaimSchema = new Schema(
  {
    claimId: {
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
    claimType: {
      type: String,
      enum: ['Scooter', 'Part'],
      required: true,
    },
    partNumber: {
      type: String, // Filled if claimType is Part
    },
    invoiceNumber: {
      type: String,
      required: true,
      index: true,
    },
    issueDescription: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    remarks: {
      type: String,
    },
    documentUrl: {
      type: String, // PDF attachment
    },
  },
  { timestamps: true }
);

export const WarrantyClaim = model('WarrantyClaim', warrantyClaimSchema);
export default WarrantyClaim;
