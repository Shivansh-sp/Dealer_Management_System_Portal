import { Schema, model } from 'mongoose';
import { UserRole, Permission } from '../constants/roles';

const roleSchema = new Schema(
  {
    name: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

export const Role = model('Role', roleSchema);
export default Role;
