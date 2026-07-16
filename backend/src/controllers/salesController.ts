import { Request, Response, NextFunction } from 'express';
import { Sales } from '../models/Sales';
import { Customer } from '../models/Customer';
import { Inventory } from '../models/Inventory';
import { AppError, catchAsync } from '../utils/errors';
import { clearDashboardCache } from './dashboardController';

export const getSales = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.salesType) {
    filter.salesType = req.query.salesType;
  }

  const sales = await Sales.find(filter)
    .populate('customerId', 'name phoneNumber')
    .populate('itemId', 'name sku itemType')
    .populate('soldBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Sales.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Sales record retrieved successfully',
    data: sales,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    errors: null,
  });
});

export const recordSale = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    salesType,
    customerName,
    customerPhone,
    customerEmail,
    itemId, // inventory ref
    quantity,
    price,
    subsidyAmount,
    subsidyStatus,
    paymentStatus,
  } = req.body;

  if (!salesType || !customerName || !customerPhone || !itemId || !price) {
    return next(new AppError('Required sales fields are missing', 400));
  }

  // Verify inventory item
  const inventoryItem = await Inventory.findById(itemId);
  if (!inventoryItem || inventoryItem.isDeleted) {
    return next(new AppError('Inventory item not found', 404));
  }

  const qty = Number(quantity || 1);
  if (inventoryItem.stockLevel < qty) {
    return next(new AppError(`Insufficient stock. Current: ${inventoryItem.stockLevel}`, 400));
  }

  // Create or Find Customer
  let customer = await Customer.findOne({ phoneNumber: customerPhone });
  if (!customer) {
    const customerId = `CUST-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
    customer = await Customer.create({
      customerId,
      name: customerName,
      phoneNumber: customerPhone,
      email: customerEmail || '',
    });
  }

  // Generate Invoice Number
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // Create Sales Record
  const sale = await Sales.create({
    invoiceNumber,
    salesType,
    customerId: customer._id,
    itemId: inventoryItem._id,
    quantity: qty,
    price,
    subsidyAmount: subsidyAmount || 0,
    subsidyStatus: subsidyStatus || 'Not Applicable',
    paymentStatus: paymentStatus || 'Pending',
    soldBy: req.user?.id,
  });

  // Deduct Inventory Stock Level
  inventoryItem.stockLevel -= qty;
  await inventoryItem.save();

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Sale transaction recorded successfully',
    data: sale,
    pagination: null,
    errors: null,
  });
});

export const updateSubsidyStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { subsidyStatus } = req.body;

  if (!['Pending Approval', 'Approved', 'Disbursed'].includes(subsidyStatus)) {
    return next(new AppError('Invalid subsidy status', 400));
  }

  const sale = await Sales.findByIdAndUpdate(
    id,
    { subsidyStatus },
    { new: true, runValidators: true }
  );

  if (!sale) {
    return next(new AppError('Sales record not found', 404));
  }

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(200).json({
    success: true,
    message: 'Subsidy status updated successfully',
    data: sale,
    pagination: null,
    errors: null,
  });
});
