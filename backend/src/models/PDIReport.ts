import { Schema, model } from 'mongoose';

const pdiReportSchema = new Schema(
  {
    pdiId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    poNumber: {
      type: String,
      required: true,
      index: true,
    },
    chassisNumber: {
      type: String,
      required: true,
      index: true,
    },
    inspectorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checklist: [
      {
        item: String,
        status: {
          type: String,
          enum: ['Pass', 'Fail'],
          default: 'Pass',
        },
      },
    ],
    status: {
      type: String,
      enum: ['Approved', 'Failed'],
      default: 'Approved',
      index: true,
    },
    remarks: String,
    documentUrl: String,
  },
  { timestamps: true }
);

export const PDIReport = model('PDIReport', pdiReportSchema);
export default PDIReport;
