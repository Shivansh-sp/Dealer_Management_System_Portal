import { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/Lead';
import { Call } from '../models/Call';
import { TestRide } from '../models/TestRide';
import { Quotation } from '../models/Quotation';
import { AppError, catchAsync } from '../utils/errors';
import mongoose from 'mongoose';
import { clearDashboardCache } from './dashboardController';

// Leads CRUD
export const getLeads = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const filter: any = { isDeleted: false };

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    const searchString = req.query.search as string;
    filter.$or = [
      { name: { $regex: searchString, $options: 'i' } },
      { phoneNumber: { $regex: searchString, $options: 'i' } },
      { leadId: { $regex: searchString, $options: 'i' } },
    ];
  }

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Lead.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Leads retrieved successfully',
    data: leads,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    errors: null,
  });
});

export const createLead = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phoneNumber, source, status, remarks, assignedTo } = req.body;

  if (!name || !phoneNumber) {
    return next(new AppError('Name and Phone Number are required', 400));
  }

  // Generate unique lead ID
  const leadId = `LEAD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const lead = await Lead.create({
    leadId,
    name,
    email,
    phoneNumber,
    source: source || 'Manual Entry',
    status: status || 'New',
    remarks,
    assignedTo: assignedTo || null,
  });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: lead,
    pagination: null,
    errors: null,
  });
});

export const updateLead = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updates = req.body;

  const lead = await Lead.findOneAndUpdate({ _id: id, isDeleted: false }, updates, {
    new: true,
    runValidators: true,
  });

  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(200).json({
    success: true,
    message: 'Lead updated successfully',
    data: lead,
    pagination: null,
    errors: null,
  });
});

export const deleteLead = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const lead = await Lead.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(200).json({
    success: true,
    message: 'Lead soft-deleted successfully',
    data: null,
    pagination: null,
    errors: null,
  });
});

// Import Leads CSV simulation
export const importLeadsCsv = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { csvData } = req.body; // Expecting raw string of CSV data

  if (!csvData) {
    return next(new AppError('CSV Data string is required', 400));
  }

  const lines = csvData.split('\n');
  const importedLeads = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [name, email, phoneNumber, source, remarks] = line.split(',');
    if (!name || !phoneNumber) continue;

    const leadId = `LEAD-CSV-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`;
    const lead = await Lead.create({
      leadId,
      name: name.trim(),
      email: email ? email.trim() : '',
      phoneNumber: phoneNumber.trim(),
      source: source ? source.trim() : 'CSV Import',
      remarks: remarks ? remarks.trim() : '',
    });
    importedLeads.push(lead);
  }

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: `Imported ${importedLeads.length} leads successfully`,
    data: importedLeads,
    pagination: null,
    errors: null,
  });
});

// Call History
export const getCallHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { leadId } = req.params;

  const calls = await Call.find({ leadId })
    .populate('callerId', 'name')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    message: 'Call history retrieved',
    data: calls,
    pagination: null,
    errors: null,
  });
});

export const logCall = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { leadId } = req.params;
  const { remarks, nextFollowUp } = req.body;

  if (!remarks) {
    return next(new AppError('Call remarks are required', 400));
  }

  const call = await Call.create({
    leadId,
    callerId: req.user?.id,
    remarks,
    nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
  });

  // Automatically update lead status to 'Follow-up'
  await Lead.findByIdAndUpdate(leadId, { status: 'Follow-up' });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Call logged successfully',
    data: call,
    pagination: null,
    errors: null,
  });
});

// Test Rides
export const getTestRides = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const testRides = await TestRide.find()
    .populate('leadId', 'name phoneNumber')
    .populate('assignedStaff', 'name')
    .sort({ scheduledTime: -1 });

  res.status(200).json({
    success: true,
    message: 'Test rides retrieved',
    data: testRides,
    pagination: null,
    errors: null,
  });
});

export const bookTestRide = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { leadId, chassisNumber, scheduledTime, assignedStaff, remarks, driverLicense, route, scooterModel } = req.body;

  if (!leadId || !chassisNumber || !scheduledTime) {
    return next(new AppError('Lead ID, Chassis Number, and Scheduled Time are required', 400));
  }

  const testRide = await TestRide.create({
    leadId,
    chassisNumber,
    scheduledTime: new Date(scheduledTime),
    assignedStaff: assignedStaff || null,
    remarks,
    driverLicense,
    route,
    scooterModel,
  });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Test ride booked successfully',
    data: testRide,
    pagination: null,
    errors: null,
  });
});

export const updateTestRideStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!['Pending', 'Completed', 'Cancelled'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const testRide = await TestRide.findByIdAndUpdate(
    id,
    { status, remarks },
    { new: true, runValidators: true }
  );

  if (!testRide) {
    return next(new AppError('Test ride not found', 404));
  }

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(200).json({
    success: true,
    message: 'Test ride status updated',
    data: testRide,
    pagination: null,
    errors: null,
  });
});

// Quotations & Ownership Calculator
export const createQuotation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { leadId, scooterModel, basePrice, insuranceCost, accessoriesCost, maintenanceCost, registrationCost, validDays } = req.body;

  if (!leadId || !scooterModel || !basePrice) {
    return next(new AppError('Lead ID, Scooter Model, and Base Price are required', 400));
  }

  const insurance = Number(insuranceCost || 0);
  const accessories = Number(accessoriesCost || 0);
  const maintenance = Number(maintenanceCost || 0);
  const registration = Number(registrationCost || 0);

  const totalCost = Number(basePrice) + insurance + accessories + maintenance + registration;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (validDays || 30));

  const quotationNumber = `QT-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

  const quotation = await Quotation.create({
    quotationNumber,
    leadId,
    scooterModel,
    basePrice,
    insuranceCost: insurance,
    accessoriesCost: accessories,
    maintenanceCost: maintenance,
    registrationCost: registration,
    totalCost,
    validUntil,
    createdBy: req.user?.id,
  });

  // Clear dashboard stats cache so UI updates immediately
  await clearDashboardCache();

  res.status(201).json({
    success: true,
    message: 'Quotation generated successfully',
    data: quotation,
    pagination: null,
    errors: null,
  });
});
