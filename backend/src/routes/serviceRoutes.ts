import { Router } from 'express';
import {
  createBooking,
  getBookings,
  submitWarrantyClaim,
  getWarrantyClaims,
  updateWarrantyClaimStatus,
  createServiceRecord,
  updateServiceRecordStatus,
  getServiceRecords,
  createMaterialRequest,
  getMaterialRequests,
  approveMaterialRequest,
  getTechnicians,
  addTechnician,
} from '../controllers/serviceController';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticate);

// Bookings
router.post('/bookings', requirePermission('manage_service_bookings'), createBooking);
router.get('/bookings', requirePermission('manage_service_bookings'), getBookings);

// Warranty
router.post('/warranty', requirePermission('manage_warranty_claims'), submitWarrantyClaim);
router.get('/warranty', requirePermission('manage_warranty_claims'), getWarrantyClaims);
router.put('/warranty/:id', requirePermission('manage_warranty_claims'), updateWarrantyClaimStatus);

// Service records
router.post('/records', requirePermission('manage_service_bookings'), createServiceRecord);
router.get('/records', requirePermission('manage_service_bookings'), getServiceRecords);
router.put('/records/:id/stage', requirePermission('manage_service_bookings'), updateServiceRecordStatus);

// Material requests
router.post('/materials', requirePermission('manage_materials'), createMaterialRequest);
router.get('/materials', requirePermission('manage_materials'), getMaterialRequests);
router.put('/materials/:id/approve', requirePermission('manage_materials'), approveMaterialRequest);

// Technicians
router.get('/technicians', requirePermission('manage_technicians'), getTechnicians);
router.post('/technicians', requirePermission('manage_technicians'), addTechnician);

export default router;
