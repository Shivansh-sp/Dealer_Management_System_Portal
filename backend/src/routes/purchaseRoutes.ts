import { Router } from 'express';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  createPDIReport,
  receivePurchaseOrder,
} from '../controllers/purchaseController';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('manage_purchase_orders'), getPurchaseOrders);
router.post('/', requirePermission('manage_purchase_orders'), createPurchaseOrder);
router.post('/pdi', requirePermission('manage_pdi'), createPDIReport);
router.put('/:id/receive', requirePermission('manage_purchase_orders'), receivePurchaseOrder);

export default router;
