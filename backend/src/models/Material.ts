import { Schema, model } from 'mongoose';

const materialSchema = new Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    serviceRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceRecord',
      index: true,
    },
    chassisNumber: {
      type: String,
      required: true,
      index: true,
    },
    partSku: {
      type: String,
      required: true,
      index: true,
    },
    partName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: [
        'Pending Store Approval',
        'Pending Manager Approval',
        'Approved',
        'Incoming Material Notification',
        'Received',
        'Rejected',
      ],
      default: 'Pending Store Approval',
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    stickerBarcode: {
      type: String, // scanned barcode for inventory update
    },
  },
  { timestamps: true }
);

export const Material = model('Material', materialSchema);
export default Material;
