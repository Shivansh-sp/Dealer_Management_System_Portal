import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    action: {
      type: String, // e.g. DELETE_LEAD, APPROVE_CLAIM
      required: true,
      index: true,
    },
    entityName: {
      type: String, // e.g. Lead, WarrantyClaim
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    previousValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
  },
  { timestamps: true }
);

export const AuditLog = model('AuditLog', auditLogSchema);
export default AuditLog;
