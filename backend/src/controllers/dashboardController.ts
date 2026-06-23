import { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/Lead';
import { Customer } from '../models/Customer';
import { Sales } from '../models/Sales';
import { WarrantyClaim } from '../models/WarrantyClaim';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { ServiceRecord } from '../models/ServiceRecord';
import { Inventory } from '../models/Inventory';
import { Document } from '../models/Document';
import { AppError, catchAsync } from '../utils/errors';
import { redisClient } from '../config/db';
import { logger } from '../config/logger';

// 1. Global Search
export const globalSearch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return next(new AppError('Search query is required', 400));
  }

  const regex = new RegExp(query, 'i');

  // Search parallelly
  const [customers, leads, sales, claims, purchaseOrders, serviceRecords] = await Promise.all([
    Customer.find({ $or: [{ name: regex }, { phoneNumber: regex }, { customerId: regex }] }).limit(5),
    Lead.find({ $or: [{ name: regex }, { phoneNumber: regex }, { leadId: regex }] }).limit(5),
    Sales.find({ invoiceNumber: regex }).populate('customerId', 'name').limit(5),
    WarrantyClaim.find({ $or: [{ claimId: regex }, { chassisNumber: regex }] }).limit(5),
    PurchaseOrder.find({ poNumber: regex }).limit(5),
    ServiceRecord.find({ chassisNumber: regex }).limit(5),
  ]);

  res.status(200).json({
    success: true,
    message: 'Global search completed',
    data: {
      customers,
      leads,
      sales,
      warrantyClaims: claims,
      purchaseOrders,
      serviceRecords,
    },
    pagination: null,
    errors: null,
  });
});

// 2. Document Management
export const uploadDocument = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { documentType, name, relatedEntityId } = req.body;

  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  if (!documentType || !name) {
    return next(new AppError('Document Type and Name are required', 400));
  }

  const documentId = `DOC-${Date.now().toString().slice(-6)}`;
  const fileUrl = `/uploads/${req.file.filename}`;

  const doc = await Document.create({
    documentId,
    name,
    documentType,
    fileUrl,
    relatedEntityId,
    uploadedBy: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: doc,
    pagination: null,
    errors: null,
  });
});

export const getDocuments = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { relatedEntityId, type } = req.query;

  const filter: any = {};
  if (relatedEntityId) filter.relatedEntityId = relatedEntityId;
  if (type) filter.documentType = type;

  const docs = await Document.find(filter)
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Documents retrieved successfully',
    data: docs,
    pagination: null,
    errors: null,
  });
});

// 3. Caching Dashboard Analytics
export const getDashboardAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const cacheKey = 'dashboard:analytics';

  // Check Redis cache first
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    logger.debug('Dashboard analytics serving from cache.');
    res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved (cached)',
      data: JSON.parse(cachedData),
      pagination: null,
      errors: null,
    });
    return;
  }

  // Aggregate Data
  const [
    totalLeads,
    totalSales,
    totalInventory,
    pendingClaims,
    activeServiceCount,
  ] = await Promise.all([
    Lead.countDocuments({ isDeleted: false }),
    Sales.aggregate([
      { $group: { _id: null, totalAmount: { $sum: '$price' }, count: { $sum: 1 } } },
    ]),
    Inventory.aggregate([
      { $group: { _id: null, totalStock: { $sum: '$stockLevel' } } },
    ]),
    WarrantyClaim.countDocuments({ status: 'Pending' }),
    ServiceRecord.countDocuments({ status: { $ne: 'Delivered' } }),
  ]);

  // Lead conversions rates
  const leadConversions = await Lead.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Sales Trends (Monthly aggregation for last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlySalesTrend = await Sales.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$price' },
        units: { $sum: '$quantity' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const responseData = {
    kpis: {
      leadsCount: totalLeads,
      salesCount: totalSales[0]?.count || 0,
      totalRevenue: totalSales[0]?.totalAmount || 0,
      inventoryStock: totalInventory[0]?.totalStock || 0,
      pendingClaims,
      activeServices: activeServiceCount,
    },
    leadConversions: leadConversions.reduce((acc: any, cur: any) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {}),
    monthlySales: monthlySalesTrend.map((el: any) => ({
      month: `${el._id.year}-${el._id.month.toString().padStart(2, '0')}`,
      revenue: el.revenue,
      units: el.units,
    })),
  };

  // Cache dashboard statistics for 5 minutes (300 seconds)
  await redisClient.setex(cacheKey, 300, JSON.stringify(responseData));

  res.status(200).json({
    success: true,
    message: 'Dashboard analytics retrieved',
    data: responseData,
    pagination: null,
    errors: null,
  });
});
