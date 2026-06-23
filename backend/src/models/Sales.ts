import { Schema, model } from 'mongoose';

const salesSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    salesType: {
      type: String,
      enum: ['Retail', 'Corporate', 'CPC & CSD', 'Dealership Unit'],
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    subsidyAmount: {
      type: Number,
      default: 0,
    },
    subsidyStatus: {
      type: String,
      enum: ['Not Applicable', 'Pending Approval', 'Approved', 'Disbursed'],
      default: 'Not Applicable',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid'],
      default: 'Pending',
    },
    soldBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const Sales = model('Sales', salesSchema);
export default Sales;
