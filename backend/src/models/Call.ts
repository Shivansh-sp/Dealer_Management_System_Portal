import { Schema, model } from 'mongoose';

const callSchema = new Schema(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    callerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      required: true,
    },
    nextFollowUp: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Call = model('Call', callSchema);
export default Call;
