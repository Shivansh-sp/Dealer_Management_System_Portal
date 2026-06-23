import { Router } from 'express';
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  importLeadsCsv,
  getCallHistory,
  logCall,
  getTestRides,
  bookTestRide,
  updateTestRideStatus,
  createQuotation,
} from '../controllers/preSalesController';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Leads
router.get('/leads', requirePermission('manage_leads'), getLeads);
router.post('/leads', requirePermission('manage_leads'), createLead);
router.post('/leads/import', requirePermission('manage_leads'), importLeadsCsv);
router.put('/leads/:id', requirePermission('manage_leads'), updateLead);
router.delete('/leads/:id', requirePermission('manage_leads'), deleteLead);

// Calls
router.get('/leads/:leadId/calls', requirePermission('manage_leads'), getCallHistory);
router.post('/leads/:leadId/calls', requirePermission('manage_leads'), logCall);

// Test rides
router.get('/test-rides', requirePermission('manage_test_rides'), getTestRides);
router.post('/test-rides', requirePermission('manage_test_rides'), bookTestRide);
router.put('/test-rides/:id', requirePermission('manage_test_rides'), updateTestRideStatus);

// Quotation
router.post('/quotations', requirePermission('manage_quotations'), createQuotation);

export default router;
