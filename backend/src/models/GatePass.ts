import { Schema, model } from 'mongoose';

const gatePassSchema = new Schema(
  {
    gatePassId: {
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
    motorNumber: {
      type: String,
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    securityApproved: {
      type: Boolean,
      default: false,
    },
    checkedOutAt: {
      type: Date,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const GatePass = model('GatePass', gatePassSchema);
export default GatePass;
