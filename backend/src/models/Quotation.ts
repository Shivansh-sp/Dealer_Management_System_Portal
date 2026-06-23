import { Schema, model } from 'mongoose';

const quotationSchema = new Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    scooterModel: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    insuranceCost: {
      type: Number,
      default: 0,
    },
    accessoriesCost: {
      type: Number,
      default: 0,
    },
    maintenanceCost: {
      type: Number,
      default: 0,
    },
    registrationCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const Quotation = model('Quotation', quotationSchema);
export default Quotation;
