import mongoose from 'mongoose';
import Redis from 'ioredis';
import { logger } from './logger';
import { UserRole } from '../constants/roles';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smg-dms';
const REDIS_URI = process.env.REDIS_URI || 'redis://127.0.0.1:6379';

// Mock Redis implementation for fallback if Redis server is not running
class MemoryRedisMock {
  private store = new Map<string, { value: string; expiry: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value, expiry: null });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expiry = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    let deletedCount = 0;
    for (const k of keys) {
      if (this.store.has(k)) {
        this.store.delete(k);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return allKeys.filter(k => regex.test(k));
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (event === 'connect') {
      setTimeout(() => callback(), 50);
    }
    return this;
  }
}

// Default initialize redisClient as MemoryRedisMock so it has a persistent state out of the box
export let redisClient: Redis | MemoryRedisMock = new MemoryRedisMock();

// Resilient Offline Mock Database Store
const mockStore = new Map<string, any[]>();

const matchCriteria = (item: any, filter: any): boolean => {
  if (!filter) return true;
  for (const key of Object.keys(filter)) {
    const val = filter[key];
    if (key === '$or' && Array.isArray(val)) {
      if (!val.some(subFilter => matchCriteria(item, subFilter))) return false;
      continue;
    }
    
    const itemVal = item[key];
    if (val instanceof RegExp) {
      if (itemVal === undefined || itemVal === null || !val.test(itemVal.toString())) return false;
    } else if (typeof val === 'object' && val !== null) {
      if (val.toString().startsWith('/')) {
        const regexStr = val.toString().slice(1, -1);
        const r = new RegExp(regexStr, 'i');
        if (itemVal === undefined || itemVal === null || !r.test(itemVal.toString())) return false;
      } else if (val.$ne !== undefined) {
        if (itemVal === val.$ne) return false;
      } else if (val.$gte !== undefined) {
        if (itemVal === undefined || itemVal === null || itemVal < val.$gte) return false;
      } else if (val.$lte !== undefined) {
        if (itemVal === undefined || itemVal === null || itemVal > val.$lte) return false;
      } else if (val.$gt !== undefined) {
        if (itemVal === undefined || itemVal === null || itemVal <= val.$gt) return false;
      } else if (val.$lt !== undefined) {
        if (itemVal === undefined || itemVal === null || itemVal >= val.$lt) return false;
      } else if (val.$in !== undefined && Array.isArray(val.$in)) {
        const itemStr = itemVal?.toString();
        if (!val.$in.map((x: any) => x?.toString()).includes(itemStr)) return false;
      } else if (val.$nin !== undefined && Array.isArray(val.$nin)) {
        const itemStr = itemVal?.toString();
        if (val.$nin.map((x: any) => x?.toString()).includes(itemStr)) return false;
      } else {
        if (itemVal?.toString() !== val.toString()) return false;
      }
    } else {
      if (val === false) {
        if (itemVal && itemVal !== 'false') return false;
      } else {
        if (itemVal?.toString() !== val?.toString()) return false;
      }
    }
  }
  return true;
};

const applyUpdate = (docObj: any, update: any) => {
  const result = JSON.parse(JSON.stringify(docObj));
  let hasOperators = false;
  for (const key of Object.keys(update)) {
    if (key.startsWith('$')) {
      hasOperators = true;
      break;
    }
  }

  if (!hasOperators) {
    return { ...result, ...update };
  }

  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      result[k] = v;
    }
  }
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      result[k] = (Number(result[k]) || 0) + (Number(v) || 0);
    }
  }
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(result[k])) {
        result[k] = [];
      }
      if (v && typeof v === 'object' && '$each' in v) {
        result[k].push(...(v as any).$each);
      } else {
        result[k].push(v);
      }
    }
  }
  if (update.$pull) {
    for (const [k, v] of Object.entries(update.$pull)) {
      if (Array.isArray(result[k])) {
        result[k] = result[k].filter((item: any) => {
          if (typeof v === 'object' && v !== null) {
            for (const [subKey, subVal] of Object.entries(v)) {
              if (item[subKey] !== subVal) return true;
            }
            return false;
          }
          return item !== v;
        });
      }
    }
  }
  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) {
      delete result[k];
    }
  }

  for (const [k, v] of Object.entries(update)) {
    if (!k.startsWith('$')) {
      result[k] = v;
    }
  }

  return result;
};

const activateOfflineMockDb = async () => {
  const roles = Object.values(UserRole);
  const users: any[] = [];
  
  for (const roleName of roles) {
    const roleSlug = roleName.toLowerCase().replace(/\s+/g, '');
    const hashedPassword = await bcrypt.hash('password123', 10);
    users.push({
      _id: new mongoose.Types.ObjectId().toString(),
      userId: roleSlug,
      name: `${roleName} User`,
      email: `${roleSlug}@smg.com`,
      password: hashedPassword,
      role: roleName,
      phoneNumber: '9876543210',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  mockStore.set('User', users);

  // Seed default inventory
  const scooterId = new mongoose.Types.ObjectId().toString();
  const batteryId = new mongoose.Types.ObjectId().toString();
  mockStore.set('Inventory', [
    {
      _id: scooterId,
      itemType: 'Scooter',
      name: 'S1 Pro Gen 2 Matte Gray',
      sku: 'SKU-SCO-S1P2',
      chassisNumber: 'CS12345',
      motorNumber: 'MN54321',
      barcode: 'BC-SKU-SCO-S1P2-8739',
      stockLevel: 12,
      minStockLevel: 5,
      price: 145000,
      warehouseLocation: 'Main Warehouse',
      isDeleted: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      itemType: 'Scooter',
      name: 'S1 Air Neon Green',
      sku: 'SKU-SCO-S1A1',
      chassisNumber: 'CS67890',
      motorNumber: 'MN09876',
      barcode: 'BC-SKU-SCO-S1A1-1249',
      stockLevel: 2,
      minStockLevel: 5,
      price: 115000,
      warehouseLocation: 'Main Warehouse',
      isDeleted: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      itemType: 'Accessory',
      name: 'Premium Helmet',
      sku: 'SKU-ACC-HELMET',
      barcode: 'BC-HELM-892',
      stockLevel: 25,
      minStockLevel: 10,
      price: 3500,
      warehouseLocation: 'Accessory Bay',
      isDeleted: false,
    },
    {
      _id: batteryId,
      itemType: 'Spare Part',
      name: 'Lithium Battery Pack 3kWh',
      sku: 'SKU-SPA-BATTERY',
      barcode: 'BC-BATT-348',
      stockLevel: 4,
      minStockLevel: 5,
      price: 45000,
      warehouseLocation: 'Battery Vault',
      isDeleted: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      itemType: 'Merchandise',
      name: 'SMG Racing Jacket',
      sku: 'SKU-MER-JACKET',
      barcode: 'BC-JACK-102',
      stockLevel: 8,
      minStockLevel: 2,
      price: 5500,
      warehouseLocation: 'Merch Rack',
      isDeleted: false,
    }
  ]);

  // Seed default customers
  const custId1 = new mongoose.Types.ObjectId().toString();
  const custId2 = new mongoose.Types.ObjectId().toString();
  mockStore.set('Customer', [
    {
      _id: custId1,
      customerId: 'CUST-001',
      name: 'Raman Sharma',
      phoneNumber: '9876543210',
      email: 'raman@gmail.com',
      isDeleted: false,
    },
    {
      _id: custId2,
      customerId: 'CUST-002',
      name: 'Sanjana Roy',
      phoneNumber: '9988776655',
      email: 'sanjana@gmail.com',
      isDeleted: false,
    }
  ]);

  // Seed default leads
  mockStore.set('Lead', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      leadId: 'LD-101',
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '9876501234',
      source: 'Website',
      status: 'Interested',
      remarks: 'Interested in S1 Pro',
      isDeleted: false,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      leadId: 'LD-102',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phoneNumber: '9876505678',
      source: 'Manual Entry',
      status: 'New',
      remarks: 'Referred by friend',
      isDeleted: false,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      leadId: 'LD-103',
      name: 'Vikram Patel',
      email: 'vikram@example.com',
      phoneNumber: '9123456789',
      source: 'CSV Import',
      status: 'Follow-up',
      remarks: 'Callback tomorrow',
      isDeleted: false,
      createdAt: new Date(),
    }
  ]);

  // Seed technicians
  const techUserId = users.find(u => u.role === UserRole.SERVICE_TECHNICIAN_OFFICER)?._id || new mongoose.Types.ObjectId().toString();
  mockStore.set('Technician', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      technicianId: 'TECH-01',
      userId: techUserId,
      name: 'Ramesh Kumar',
      region: 'Delhi-NCR',
      specialty: 'Battery & Electrical',
      status: 'Available',
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      technicianId: 'TECH-02',
      userId: new mongoose.Types.ObjectId().toString(),
      name: 'Suresh Singh',
      region: 'Delhi-NCR',
      specialty: 'Mechanical',
      status: 'Busy',
    }
  ]);

  // Seed bookings
  mockStore.set('Booking', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      bookingId: 'BK-001',
      bookingType: 'Service',
      customerId: custId1,
      chassisNumber: 'CS12345',
      scheduledDate: new Date(Date.now() + 86400000),
      status: 'Scheduled',
      details: 'Second free service',
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      bookingId: 'BK-002',
      bookingType: 'HSRP',
      customerId: custId2,
      chassisNumber: 'CS67890',
      scheduledDate: new Date(Date.now() + 172800000),
      status: 'Scheduled',
      details: 'HSRP plate attachment',
    }
  ]);

  // Seed warranty claims
  mockStore.set('WarrantyClaim', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      claimId: 'WC-101',
      chassisNumber: 'CS12345',
      customerId: custId1,
      claimType: 'Scooter',
      invoiceNumber: 'INV-72918',
      issueDescription: 'Battery state of health dropped below 70%',
      status: 'Pending',
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      claimId: 'WC-102',
      chassisNumber: 'CS67890',
      customerId: custId2,
      claimType: 'Part',
      partNumber: 'BATT-3KWH',
      invoiceNumber: 'INV-83921',
      issueDescription: 'Charger port lock malfunction',
      status: 'Approved',
      createdAt: new Date(),
    }
  ]);

  // Seed material requests
  mockStore.set('Material', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      requestId: 'REQ-01',
      serviceRecordId: null,
      chassisNumber: 'CS12345',
      partSku: 'SKU-SPA-BATTERY',
      partName: 'Lithium Battery Pack 3kWh',
      quantity: 1,
      status: 'Pending Store Approval',
      requestedBy: techUserId,
      createdAt: new Date(),
    }
  ]);

  // Seed gate passes
  mockStore.set('GatePass', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      gatePassId: 'GP-101',
      chassisNumber: 'CS12345',
      motorNumber: 'MN54321',
      invoiceNumber: 'INV-72918',
      customerName: 'Raman Sharma',
      driverName: 'Self-driven',
      securityApproved: false,
      generatedBy: users.find(u => u.role === UserRole.MASTER_ADMIN)?._id,
      createdAt: new Date(),
    }
  ]);

  // Seed sales
  mockStore.set('Sales', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      invoiceNumber: 'INV-72918',
      salesType: 'Retail',
      customerId: custId1,
      itemId: scooterId,
      quantity: 1,
      price: 145000,
      subsidyAmount: 15000,
      subsidyStatus: 'Approved',
      paymentStatus: 'Paid',
      soldBy: users.find(u => u.role === UserRole.SALES_MANAGER)?._id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      invoiceNumber: 'INV-83921',
      salesType: 'Corporate',
      customerId: custId2,
      itemId: scooterId,
      quantity: 2,
      price: 290000,
      subsidyAmount: 0,
      subsidyStatus: 'Not Applicable',
      paymentStatus: 'Paid',
      soldBy: users.find(u => u.role === UserRole.SALES_MANAGER)?._id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    }
  ]);

  // Seed service records
  mockStore.set('ServiceRecord', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      recordId: 'SR-001',
      chassisNumber: 'CS12345',
      customerId: custId1,
      jobCardDetails: 'Periodic maintenance service & washing',
      technicianId: techUserId,
      laborCharges: 950,
      billingAmount: 950,
      status: 'Received',
      createdAt: new Date(),
    }
  ]);

  // Helper to ensure physical PDF files exist in backend/uploads for the DMS preview
  const ensureUploadsExist = () => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const createMinimalPDF = (filename: string, contentText: string) => {
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) return;

      const pdfData = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 12 Tf
72 720 Td
(SMG Electric Scooters Ltd) Tj
0 -20 Td
(${contentText.slice(0, 70)}) Tj
0 -20 Td
(${contentText.slice(70, 140)}) Tj
0 -20 Td
(${contentText.slice(140, 210)}) Tj
0 -20 Td
(${contentText.slice(210, 280)}) Tj
0 -20 Td
(${contentText.slice(280, 350)}) Tj
0 -20 Td
(${contentText.slice(350, 420)}) Tj
0 -20 Td
(${contentText.slice(420, 490)}) Tj
0 -20 Td
(${contentText.slice(490, 560)}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000282 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
860
%%EOF`;

      fs.writeFileSync(filePath, pdfData);
    };

    createMinimalPDF('material_receipt_sheet.pdf', 'Material Receipt Sheet - PO Number: 0981298R, Vendor: Laxmi Electromobiles Pvt Ltd, Part Name: SEAT, Qty: 1UNIT, Date: 5th July 2025');
    createMinimalPDF('callback_pick_up_indent.pdf', 'Call Back Consignment Pick Up Indent - From: LAXMI ELECTROMOBILES PVT LTD Sector 43 Chandigarh, To: SMG Electric Scooters Ltd Warranty Department, Weight: 2 KG');
    createMinimalPDF('labour_schedule_chart.pdf', 'Labour Schedule Chart - Job Code J001 Replacement of Head lamp Bulb cost 5, J053 Replacement of Frame cost 300, J086 Brake Lever Assembly-RH cost 30');
    createMinimalPDF('part_replacement_cost_sheet.pdf', 'Part Replacement Cost Sheet - P001 Front Fender, P002 Screen Cluster Cover Top, J032 Handle bar, J081 HV WIRING HARNESS');
    createMinimalPDF('part_replacement_schedule.pdf', 'Part Replacement Schedule - Part Model Part Code MRP Benefit Replacement Period');
    createMinimalPDF('service_record_1233.pdf', 'Service Record - Chassis No: 1233, Date, Job Card No, Part Description, Km/Month, Remarks');
    createMinimalPDF('service_schedule_warranty.pdf', 'Service Schedule (For Warranty) - Free 30-45 500-1000, Free 120-135 3500-4000, Paid 240-255 6500-7000');
    createMinimalPDF('service_inspection_parameters.pdf', 'Service Inspection Parameters - Front Brakes, Rear Brakes, Throttle Free Play, Front Wheel Rotation');
    createMinimalPDF('pdi_inspection_sheet_genz.pdf', 'PDI Inspection Sheet-GenZ - Lockset ON/OFF, Seat lock, Instrument cluster, Electrical Part Check');
    createMinimalPDF('purchase_order_0981298r.pdf', 'Purchase Order - PO No: 0981298R, Date: 5th July 2025, Vendor: Meenakshi Polymers Pvt Ltd, Item: SEAT, Qty: 1UNIT, Total: Rs 896');
  };

  // Seed default documents
  const adminUser = users.find(u => u.role === UserRole.MASTER_ADMIN)?._id;
  ensureUploadsExist();

  mockStore.set('Document', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-MR-0981298R',
      name: 'Material Receipt Sheet (PO 0981298R)',
      documentType: 'Material Receipt Sheet',
      fileUrl: '/uploads/material_receipt_sheet.pdf',
      relatedEntityId: '0981298R',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-WPU-001',
      name: 'Call Back Consignment Pick Up Indent',
      documentType: 'Warranty Pickup Sheet',
      fileUrl: '/uploads/callback_pick_up_indent.pdf',
      relatedEntityId: 'WC-101',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-LSC-001',
      name: 'Labour Schedule Chart',
      documentType: 'Labor Cost Sheet',
      fileUrl: '/uploads/labour_schedule_chart.pdf',
      relatedEntityId: '',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-PRC-001',
      name: 'Part Replacement Cost Sheet',
      documentType: 'Part Replacement Cost Sheet',
      fileUrl: '/uploads/part_replacement_cost_sheet.pdf',
      relatedEntityId: '',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-PRS-001',
      name: 'Part Replacement Schedule',
      documentType: 'Technical Component Detail',
      fileUrl: '/uploads/part_replacement_schedule.pdf',
      relatedEntityId: '',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-SR-1233',
      name: 'Service Record (Chassis 1233)',
      documentType: 'Service Schedule',
      fileUrl: '/uploads/service_record_1233.pdf',
      relatedEntityId: '1233',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-SSW-001',
      name: 'Service Schedule (For Warranty)',
      documentType: 'Service Schedule',
      fileUrl: '/uploads/service_schedule_warranty.pdf',
      relatedEntityId: '',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-SIP-001',
      name: 'Service Inspection Parameters',
      documentType: 'Technical Component Detail',
      fileUrl: '/uploads/service_inspection_parameters.pdf',
      relatedEntityId: '',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-PDI-GZ',
      name: 'PDI Inspection Sheet - GenZ (PO 0981298R)',
      documentType: 'PDI Inspection Sheet',
      fileUrl: '/uploads/pdi_inspection_sheet_genz.pdf',
      relatedEntityId: '0981298R',
      uploadedBy: adminUser,
      createdAt: new Date(),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      documentId: 'DOC-PO-0981298R',
      name: 'Purchase Order (PO 0981298R)',
      documentType: 'Purchase Order',
      fileUrl: '/uploads/purchase_order_0981298r.pdf',
      relatedEntityId: '0981298R',
      uploadedBy: adminUser,
      createdAt: new Date(),
    }
  ]);

  // Seed purchase orders matching schema fields exactly
  mockStore.set('PurchaseOrder', [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      poNumber: '0981298R',
      itemType: 'Spare Part',
      itemName: 'SEAT (PRIMUS SEAT)',
      quantity: 1,
      unitPrice: 700,
      totalAmount: 896,
      vendorName: 'Meenakshi Polymers Pvt Ltd',
      orderDate: new Date('2025-07-05'),
      status: 'Pending',
      pdiStatus: 'Not Started',
      createdAt: new Date('2025-07-05'),
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      poNumber: 'PO-901',
      itemType: 'Scooter',
      itemName: 'S1 Pro Gen 2 Matte Gray',
      quantity: 5,
      unitPrice: 120000,
      totalAmount: 600000,
      vendorName: 'SMG Manufacturing India',
      orderDate: new Date(),
      status: 'Pending',
      pdiStatus: 'Not Started',
      createdAt: new Date(),
    }
  ]);

  // 2. Intercept Mongoose Queries
  mongoose.Query.prototype.exec = async function (this: any) {
    const modelName = this.model.modelName;
    const op = this.op;
    const filter = this.getQuery();
    const list = mockStore.get(modelName) || [];

    let matched = list.filter(item => matchCriteria(item, filter));

    // Handle limit
    const limitOpt = this.options && this.options.limit;
    if (limitOpt && typeof limitOpt === 'number') {
      matched = matched.slice(0, limitOpt);
    }

    // Populate helper
    const populatePaths = this._mongooseOptions && this._mongooseOptions.populate;
    if (populatePaths) {
      for (const doc of matched) {
        for (const [pathKey, popOpt] of Object.entries(populatePaths)) {
          const path = (popOpt as any).path || pathKey;
          const refModelName = this.model.schema.paths[path]?.options?.ref;
          if (refModelName) {
            const refList = mockStore.get(refModelName) || [];
            const idToFind = doc[path]?.toString();
            if (idToFind) {
              const refDoc = refList.find(item => item._id === idToFind);
              if (refDoc) {
                const populatedDoc = JSON.parse(JSON.stringify(refDoc));
                const selectFields = (popOpt as any).select;
                if (selectFields) {
                  let fieldsToKeep: string[] = [];
                  if (typeof selectFields === 'string') {
                    fieldsToKeep = selectFields.split(/\s+/).filter(Boolean);
                  } else if (typeof selectFields === 'object') {
                    fieldsToKeep = Object.keys(selectFields).filter(k => selectFields[k] === 1 || selectFields[k] === true);
                  }
                  if (fieldsToKeep.length > 0) {
                    fieldsToKeep.push('_id');
                    for (const key of Object.keys(populatedDoc)) {
                      if (!fieldsToKeep.includes(key)) {
                        delete populatedDoc[key];
                      }
                    }
                  }
                }
                doc[path] = populatedDoc;
              }
            }
          }
        }
      }
    }

    if (op === 'find') {
      return matched.map(doc => new this.model(doc));
    }
    if (op === 'findOne' || op === 'findOneAndRemove' || op === 'findOneAndUpdate') {
      if (matched.length === 0) return null;
      const docObj = matched[0];
      
      if (op === 'findOneAndUpdate') {
        const update = this.getUpdate();
        if (update) {
          const updatedDoc = applyUpdate(docObj, update);
          const idx = list.findIndex(item => item._id === docObj._id);
          if (idx >= 0) {
            list[idx] = updatedDoc;
            mockStore.set(modelName, list);
          }
          return new this.model(updatedDoc);
        }
      }
      return new this.model(docObj);
    }
    if (op === 'countDocuments') {
      return matched.length;
    }
    return null;
  };

  // 3. Intercept save()
  mongoose.Model.prototype.save = async function (this: any) {
    const modelName = this.constructor.modelName;
    const list = mockStore.get(modelName) || [];
    const docObj = this.toObject();
    
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId().toString();
    }
    docObj._id = this._id.toString();

    const idx = list.findIndex(item => item._id === docObj._id);
    if (idx >= 0) {
      list[idx] = docObj;
    } else {
      list.push(docObj);
    }
    mockStore.set(modelName, list);
    return this;
  };

  // 4. Intercept model creations
  mongoose.Model.create = (async function (this: any, doc: any) {
    const modelName = this.modelName;
    const list = mockStore.get(modelName) || [];
    if (Array.isArray(doc)) {
      const createdDocs = doc.map(d => {
        const id = new mongoose.Types.ObjectId().toString();
        return { _id: id, ...d };
      });
      list.push(...createdDocs);
      mockStore.set(modelName, list);
      return createdDocs.map(d => new this(d));
    } else {
      const id = new mongoose.Types.ObjectId().toString();
      const newDoc = { _id: id, ...doc };
      list.push(newDoc);
      mockStore.set(modelName, list);
      return new this(newDoc);
    }
  }) as any;

  // 5. Intercept Aggregate
  mongoose.Model.aggregate = function (this: any, pipeline: any[]) {
    const modelName = this.modelName;
    let list = mockStore.get(modelName) || [];
    
    // Support $match stage
    const matchStage = pipeline.find(stage => stage.$match);
    if (matchStage) {
      const matchFilter = matchStage.$match;
      list = list.filter(item => matchCriteria(item, matchFilter));
    }

    return {
      exec: async () => {
        const groupStage = pipeline.find(stage => stage.$group);
        if (groupStage) {
          const groupFields = groupStage.$group;
          const idExpr = groupFields._id;
          
          if (idExpr === null) {
            const result: any = { _id: null };
            for (const key of Object.keys(groupFields)) {
              if (key === '_id') continue;
              const opObj = groupFields[key];
              if (opObj && opObj.$sum) {
                if (typeof opObj.$sum === 'string' && opObj.$sum.startsWith('$')) {
                  const fieldName = opObj.$sum.slice(1);
                  result[key] = list.reduce((acc, cur) => acc + (Number(cur[fieldName]) || 0), 0);
                } else if (opObj.$sum === 1) {
                  result[key] = list.length;
                }
              }
            }
            return [result];
          } else if (typeof idExpr === 'object' && idExpr !== null) {
            if (idExpr.year && idExpr.month) {
              const groupsMap = new Map<string, { year: number, month: number, revenue: number, units: number }>();
              for (const item of list) {
                const dateVal = item.createdAt ? new Date(item.createdAt) : new Date();
                const yr = dateVal.getFullYear();
                const mth = dateVal.getMonth() + 1;
                const key = `${yr}-${mth}`;
                const existing = groupsMap.get(key) || { year: yr, month: mth, revenue: 0, units: 0 };
                existing.revenue += Number(item.price) || 0;
                existing.units += Number(item.quantity) || 0;
                groupsMap.set(key, existing);
              }
              const results = Array.from(groupsMap.values()).map(g => ({
                _id: { year: g.year, month: g.month },
                revenue: g.revenue,
                units: g.units
              }));
              const sortStage = pipeline.find(stage => stage.$sort);
              if (sortStage) {
                results.sort((a, b) => {
                  if (a._id.year !== b._id.year) return a._id.year - b._id.year;
                  return a._id.month - b._id.month;
                });
              }
              return results;
            }
          } else if (typeof idExpr === 'string' && idExpr.startsWith('$')) {
            const fieldName = idExpr.slice(1);
            const groupsMap = new Map<string, number>();
            for (const item of list) {
              const val = item[fieldName] || 'Unknown';
              groupsMap.set(val, (groupsMap.get(val) || 0) + 1);
            }
            return Array.from(groupsMap.entries()).map(([k, v]) => ({
              _id: k,
              count: v
            }));
          }
        }
        return [];
      },
      then: function(resolve: any) {
        this.exec().then(resolve);
      }
    } as any;
  };

  logger.warn('[Resilient DB Fallback] Dynamic Mongoose In-Memory mock activated successfully.');
};

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    logger.info('MongoDB Connected successfully.');
  } catch (error: any) {
    logger.error(`MongoDB Connection Failed: ${error.message}`);
    await activateOfflineMockDb();
  }
};

export const connectRedis = async (): Promise<void> => {
  try {
    // Only attempt real connection if user configured a Redis URI that is reachable.
    // We connect with a lazy configuration to avoid infinite retry re-initialization crashes.
    const client = new Redis(REDIS_URI, {
      maxRetriesPerRequest: null,
      connectTimeout: 1000,
      retryStrategy: () => null,
    });

    client.on('error', (err) => {
      // Fail silently and use the pre-initialized MemoryRedisMock instance to preserve state.
      logger.debug(`Redis connection failed: ${err.message}. Sticking with In-Memory Cache.`);
    });

    client.on('connect', () => {
      redisClient = client;
      logger.info('Redis Connected successfully.');
    });
  } catch (error) {
    logger.debug('Failed to initialize Redis. Sticking with In-Memory Cache.');
  }
};
