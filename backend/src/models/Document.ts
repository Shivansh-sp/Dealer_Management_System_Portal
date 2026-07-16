import { Schema, model } from 'mongoose';

const documentSchema = new Schema(
  {
    documentId: {
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
    documentType: {
      type: String,
      enum: [
        'Warranty Claim Form',
        'Technical Component Detail',
        'Warranty Pickup Sheet',
        'PDI Inspection Sheet',
        'Failed Part Tag',
        'Labor Cost Sheet',
        'Part Replacement Cost Sheet',
        'Service Schedule',
        'Material Receipt Sheet',
        'Purchase Order',
        'Gate Pass',
      ],
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: function (this: any) {
        return !this.isDigital;
      },
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    formData: {
      type: Schema.Types.Mixed,
    },
    signature: {
      type: String,
    },
    signatureStyle: {
      type: String,
    },
    relatedEntityId: {
      type: String, // poNumber, chassisNumber, claimId, etc.
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [
      {
        version: Number,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const Document = model('Document', documentSchema);
export default Document;
