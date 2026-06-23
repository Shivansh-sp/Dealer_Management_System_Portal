import { Schema, model } from 'mongoose';

const purchaseOrderSchema = new Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ['Scooter', 'Accessory', 'Merchandise', 'Spare Part'],
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Pending', 'Received', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    pdiStatus: {
      type: String,
      enum: ['Not Started', 'Completed', 'Failed'],
      default: 'Not Started',
    },
  },
  { timestamps: true }
);

export const PurchaseOrder = model('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;
