import { Request, Response, NextFunction } from 'express';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { PDIReport } from '../models/PDIReport';
import { Inventory } from '../models/Inventory';
import { AppError, catchAsync } from '../utils/errors';
import { clearDashboardCache } from './dashboardController';

export const getPurchaseOrders = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const orders = await PurchaseOrder.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await PurchaseOrder.countDocuments();

  res.status(200).json({
    success: true,
    message: 'Purchase orders retrieved',
    data: orders,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    errors: null,
  });
});

export const createPurchaseOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { itemType, itemName, quantity, unitPrice, vendorName } = req.body;

  if (!itemType || !itemName || !quantity || !unitPrice || !vendorName) {
    return next(new AppError('Required purchase order fields are missing', 400));
  }

  const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
  const totalAmount = Number(quantity) * Number(unitPrice);

  const order = await PurchaseOrder.create({
    poNumber,
    itemType,
    itemName,
    quantity,
    unitPrice,
    totalAmount,
    vendorName,
  });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Purchase Order generated successfully',
    data: order,
    pagination: null,
    errors: null,
  });
});

export const createPDIReport = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { poNumber, chassisNumber, checklist, status, remarks } = req.body;

  if (!poNumber || !chassisNumber || !status) {
    return next(new AppError('Purchase order number, chassis number, and inspection status are required', 400));
  }

  const pdiId = `PDI-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

  const pdi = await PDIReport.create({
    pdiId,
    poNumber,
    chassisNumber,
    inspectorId: req.user?.id,
    checklist: checklist || [],
    status,
    remarks,
  });

  // Update PO PDI status
  await PurchaseOrder.findOneAndUpdate(
    { poNumber },
    { $set: { pdiStatus: status === 'Approved' ? 'Completed' : 'Failed' } }
  );

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Pre-Delivery Inspection (PDI) report logged successfully',
    data: pdi,
    pagination: null,
    errors: null,
  });
});

export const receivePurchaseOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const order = await PurchaseOrder.findById(id);
  if (!order) {
    return next(new AppError('Purchase order not found', 404));
  }

  if (order.status === 'Received') {
    return next(new AppError('Purchase order already marked as received', 400));
  }

  if (order.itemType === 'Scooter' && order.pdiStatus !== 'Completed') {
    return next(new AppError('PDI verification is required for Scooters before receiving stock', 400));
  }

  // Update PO status
  order.status = 'Received';
  await order.save();

  // Add stock to Inventory
  let inventoryItem = await Inventory.findOne({ name: order.itemName, itemType: order.itemType });
  if (inventoryItem) {
    inventoryItem.stockLevel += order.quantity;
    await inventoryItem.save();
  } else {
    // Generate new SKU
    const sku = `SKU-${order.itemType.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const barcode = `BC-${sku}-${Math.floor(1000 + Math.random() * 9000)}`;
    await Inventory.create({
      itemType: order.itemType,
      name: order.itemName,
      sku,
      barcode,
      stockLevel: order.quantity,
      minStockLevel: 5,
      price: order.unitPrice * 1.25, // Markup price for resale
    });
  }

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(200).json({
    success: true,
    message: 'Purchase order received. Stock levels updated.',
    data: order,
    pagination: null,
    errors: null,
  });
});
