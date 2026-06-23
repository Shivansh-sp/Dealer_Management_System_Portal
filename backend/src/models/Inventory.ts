import { Schema, model } from 'mongoose';

const inventorySchema = new Schema(
  {
    itemType: {
      type: String,
      enum: ['Scooter', 'Accessory', 'Merchandise', 'Spare Part'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    chassisNumber: {
      type: String,
      index: true,
      sparse: true, // Sparse because only scooters have chassis numbers
      unique: true,
    },
    motorNumber: {
      type: String,
      index: true,
      sparse: true,
      unique: true,
    },
    barcode: {
      type: String,
      index: true,
    },
    stockLevel: {
      type: Number,
      required: true,
      default: 0,
    },
    minStockLevel: {
      type: Number,
      required: true,
      default: 5,
    },
    price: {
      type: Number,
      required: true,
    },
    warehouseLocation: {
      type: String,
      default: 'Main Warehouse',
    },
    batchNumber: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const Inventory = model('Inventory', inventorySchema);
export default Inventory;
