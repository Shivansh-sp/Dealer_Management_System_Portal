import { Request, Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { WarrantyClaim } from '../models/WarrantyClaim';
import { ServiceRecord } from '../models/ServiceRecord';
import { Technician } from '../models/Technician';
import { Material } from '../models/Material';
import { Inventory } from '../models/Inventory';
import { Customer } from '../models/Customer';
import { AppError, catchAsync } from '../utils/errors';
import { clearDashboardCache } from './dashboardController';

// 1. HSRP Booking & General Service Booking
export const createBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingType, customerPhone, customerName, chassisNumber, scheduledDate, details } = req.body;

  if (!bookingType || !customerPhone || !customerName || !chassisNumber || !scheduledDate) {
    return next(new AppError('Required booking fields are missing', 400));
  }

  // Create customer if they don't exist
  let customer = await Customer.findOne({ phoneNumber: customerPhone });
  if (!customer) {
    const customerId = `CUST-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
    customer = await Customer.create({
      customerId,
      name: customerName,
      phoneNumber: customerPhone,
    });
  }

  const bookingId = `BK-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

  const booking = await Booking.create({
    bookingId,
    bookingType,
    customerId: customer._id,
    chassisNumber,
    scheduledDate: new Date(scheduledDate),
    details,
  });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: `${bookingType} Booking created successfully`,
    data: booking,
    pagination: null,
    errors: null,
  });
});

export const getBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.bookingType) {
    filter.bookingType = req.query.bookingType;
  }

  const bookings = await Booking.find(filter)
    .populate('customerId', 'name phoneNumber')
    .sort({ scheduledDate: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Bookings retrieved successfully',
    data: bookings,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    errors: null,
  });
});

// 2. Warranty Claims
export const submitWarrantyClaim = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { chassisNumber, customerPhone, claimType, partNumber, invoiceNumber, issueDescription } = req.body;

  if (!chassisNumber || !customerPhone || !claimType || !invoiceNumber || !issueDescription) {
    return next(new AppError('Required warranty claim fields are missing', 400));
  }

  const customer = await Customer.findOne({ phoneNumber: customerPhone });
  if (!customer) {
    return next(new AppError('Customer not found. Please create a customer record first.', 404));
  }

  const claimId = `WC-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

  const claim = await WarrantyClaim.create({
    claimId,
    chassisNumber,
    customerId: customer._id,
    claimType,
    partNumber: claimType === 'Part' ? partNumber : undefined,
    invoiceNumber,
    issueDescription,
  });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Warranty claim submitted successfully',
    data: claim,
    pagination: null,
    errors: null,
  });
});

export const getWarrantyClaims = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const claims = await WarrantyClaim.find()
    .populate('customerId', 'name phoneNumber')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Warranty claims retrieved',
    data: claims,
    pagination: null,
    errors: null,
  });
});

export const updateWarrantyClaimStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    return next(new AppError('Invalid claim status', 400));
  }

  const claim = await WarrantyClaim.findByIdAndUpdate(
    id,
    { status, remarks },
    { new: true, runValidators: true }
  );

  if (!claim) {
    return next(new AppError('Warranty claim not found', 404));
  }

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(200).json({
    success: true,
    message: 'Warranty claim status updated',
    data: claim,
    pagination: null,
    errors: null,
  });
});

// 3. Service Records and Billing
export const createServiceRecord = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { chassisNumber, customerPhone, jobCardDetails, technicianUserId, laborCharges, amcAttached, roadsideAssistance } = req.body;

  if (!chassisNumber || !customerPhone || !jobCardDetails || !technicianUserId) {
    return next(new AppError('Required service record fields are missing', 400));
  }

  const customer = await Customer.findOne({ phoneNumber: customerPhone });
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  const recordId = `SR-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

  const service = await ServiceRecord.create({
    recordId,
    chassisNumber,
    customerId: customer._id,
    jobCardDetails,
    technicianId: technicianUserId,
    laborCharges: Number(laborCharges || 0),
    billingAmount: Number(laborCharges || 0), // Start with labor charges
    amcAttached: amcAttached || false,
    roadsideAssistance: roadsideAssistance || false,
  });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Service record job card created successfully',
    data: service,
    pagination: null,
    errors: null,
  });
});

export const updateServiceRecordStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStages = ['Received', 'Inspecting', 'Parts Replaced', 'Washing', 'Ready', 'Delivered'];
  if (!validStages.includes(status)) {
    return next(new AppError('Invalid service status stage', 400));
  }

  const service = await ServiceRecord.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!service) {
    return next(new AppError('Service record not found', 404));
  }

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(200).json({
    success: true,
    message: `Service stage updated to ${status}`,
    data: service,
    pagination: null,
    errors: null,
  });
});

export const getServiceRecords = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const filter: any = {};
  if (req.query.chassisNumber) {
    filter.chassisNumber = req.query.chassisNumber;
  }

  const records = await ServiceRecord.find(filter)
    .populate('customerId', 'name phoneNumber')
    .populate('technicianId', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Service records retrieved successfully',
    data: records,
    pagination: null,
    errors: null,
  });
});

// 4. Material Request Workflow (Service Point -> Store Department)
export const createMaterialRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { serviceRecordId, chassisNumber, partSku, partName, quantity } = req.body;

  if (!chassisNumber || !partSku || !partName) {
    return next(new AppError('Chassis number, Part SKU, and Part Name are required', 400));
  }

  const requestId = `REQ-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

  const materialReq = await Material.create({
    requestId,
    serviceRecordId: serviceRecordId || null,
    chassisNumber,
    partSku,
    partName,
    quantity: Number(quantity || 1),
    requestedBy: req.user?.id,
    status: 'Pending Store Approval',
  });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Material request sent to Store Department',
    data: materialReq,
    pagination: null,
    errors: null,
  });
});

export const getMaterialRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const requests = await Material.find()
    .populate('requestedBy', 'name')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Material requests retrieved',
    data: requests,
    pagination: null,
    errors: null,
  });
});

export const approveMaterialRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { action, stickerBarcode } = req.body; // Action: approve_store, approve_manager, dispatch

  const materialReq = await Material.findById(id);
  if (!materialReq) {
    return next(new AppError('Material request not found', 404));
  }

  if (action === 'approve_store') {
    materialReq.status = 'Pending Manager Approval';
  } else if (action === 'approve_manager') {
    materialReq.status = 'Approved';
    materialReq.approvedBy = req.user?.id as any;
  } else if (action === 'dispatch') {
    if (!stickerBarcode) {
      return next(new AppError('Scanning sticker barcode is required for inventory dispatch', 400));
    }
    // Deduct inventory stock
    const part = await Inventory.findOne({ sku: materialReq.partSku });
    if (!part) {
      return next(new AppError('Part SKU not found in inventory', 404));
    }
    if (part.stockLevel < materialReq.quantity) {
      return next(new AppError('Insufficient stock for part dispatch', 400));
    }

    part.stockLevel -= materialReq.quantity;
    await part.save();

    materialReq.status = 'Incoming Material Notification';
    materialReq.stickerBarcode = stickerBarcode;

    // If attached to a service record, add to the record's replaced parts list
    if (materialReq.serviceRecordId) {
      const replacedPart = {
        partSku: materialReq.partSku,
        partName: materialReq.partName,
        quantity: materialReq.quantity,
        price: part.price,
      };
      await ServiceRecord.findByIdAndUpdate(materialReq.serviceRecordId, {
        $push: { partsReplaced: replacedPart },
        $inc: { billingAmount: part.price * materialReq.quantity },
      });
    }
  } else if (action === 'receive') {
    materialReq.status = 'Received';
  } else {
    return next(new AppError('Invalid request action', 400));
  }

  await materialReq.save();

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(200).json({
    success: true,
    message: `Material request status updated to ${materialReq.status}`,
    data: materialReq,
    pagination: null,
    errors: null,
  });
});

// 5. Technicians
export const getTechnicians = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const technicians = await Technician.find()
    .populate('userId', 'name email')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    message: 'Technicians list retrieved',
    data: technicians,
    pagination: null,
    errors: null,
  });
});

export const addTechnician = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, name, region, specialty } = req.body;

  if (!userId || !name || !region) {
    return next(new AppError('User Ref, Name, and Region are required', 400));
  }

  const techId = `TECH-${Date.now().toString().slice(-6)}`;
  const technician = await Technician.create({
    technicianId: techId,
    userId,
    name,
    region,
    specialty: specialty || 'General Service',
  });

  res.status(201).json({
    success: true,
    message: 'Technician added successfully',
    data: technician,
    pagination: null,
    errors: null,
  });
});
