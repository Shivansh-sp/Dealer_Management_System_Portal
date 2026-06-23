import { Request, Response, NextFunction } from 'express';
import { Inventory } from '../models/Inventory';
import { GatePass } from '../models/GatePass';
import { AppError, catchAsync } from '../utils/errors';

export const getInventory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const filter: any = { isDeleted: false };
  if (req.query.itemType) {
    filter.itemType = req.query.itemType;
  }
  if (req.query.lowStock === 'true') {
    filter.$expr = { $lte: ['$stockLevel', '$minStockLevel'] };
  }
  if (req.query.search) {
    const searchString = req.query.search as string;
    filter.$or = [
      { name: { $regex: searchString, $options: 'i' } },
      { sku: { $regex: searchString, $options: 'i' } },
      { chassisNumber: { $regex: searchString, $options: 'i' } },
      { motorNumber: { $regex: searchString, $options: 'i' } },
    ];
  }

  const inventory = await Inventory.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Inventory.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Inventory retrieved successfully',
    data: inventory,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    errors: null,
  });
});

export const addInventoryItem = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { itemType, name, sku, chassisNumber, motorNumber, price, stockLevel, minStockLevel, warehouseLocation } = req.body;

  if (!itemType || !name || !sku || price === undefined) {
    return next(new AppError('Item Type, Name, SKU and Price are required', 400));
  }

  const existing = await Inventory.findOne({ sku });
  if (existing) {
    return next(new AppError('Inventory item with this SKU already exists', 400));
  }

  // Barcode simulation: let's use the SKU or generate a barcode sequence
  const barcode = `BC-${sku}-${Math.floor(1000 + Math.random() * 9000)}`;

  const item = await Inventory.create({
    itemType,
    name,
    sku,
    chassisNumber: itemType === 'Scooter' ? chassisNumber : undefined,
    motorNumber: itemType === 'Scooter' ? motorNumber : undefined,
    barcode,
    price,
    stockLevel: stockLevel || 0,
    minStockLevel: minStockLevel || 5,
    warehouseLocation: warehouseLocation || 'Main Warehouse',
  });

  res.status(201).json({
    success: true,
    message: 'Inventory item added successfully',
    data: item,
    pagination: null,
    errors: null,
  });
});

export const getGatePasses = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const passes = await GatePass.find()
    .populate('generatedBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Gate passes retrieved successfully',
    data: passes,
    pagination: null,
    errors: null,
  });
});

export const generateGatePass = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { chassisNumber, motorNumber, invoiceNumber, customerName, driverName } = req.body;

  if (!chassisNumber || !motorNumber || !invoiceNumber || !customerName || !driverName) {
    return next(new AppError('All gate pass fields are required', 400));
  }

  const gatePassId = `GP-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

  const gatePass = await GatePass.create({
    gatePassId,
    chassisNumber,
    motorNumber,
    invoiceNumber,
    customerName,
    driverName,
    generatedBy: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: 'Gate pass generated successfully',
    data: gatePass,
    pagination: null,
    errors: null,
  });
});

export const approveGatePass = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const gatePass = await GatePass.findByIdAndUpdate(
    id,
    { securityApproved: true, checkedOutAt: new Date() },
    { new: true }
  );

  if (!gatePass) {
    return next(new AppError('Gate pass not found', 404));
  }

  // Deduct the inventory scooter stock level if not already done, or mark scooter as dispatched
  await Inventory.findOneAndUpdate(
    { chassisNumber: gatePass.chassisNumber },
    { $set: { stockLevel: 0 } } // Dispatched/Sold
  );

  res.status(200).json({
    success: true,
    message: 'Gate pass approved by security. Vehicle checked out.',
    data: gatePass,
    pagination: null,
    errors: null,
  });
});
