import { Schema, model } from 'mongoose';

const technicianSchema = new Schema(
  {
    technicianId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
      index: true,
    },
    specialty: {
      type: String,
      enum: ['Battery & Electrical', 'Mechanical', 'Software', 'General Service'],
      default: 'General Service',
    },
    status: {
      type: String,
      enum: ['Available', 'Busy', 'Leave'],
      default: 'Available',
    },
    trainingCompleted: [
      {
        moduleName: String,
        completedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

export const Technician = model('Technician', technicianSchema);
export default Technician;
