import { Router } from 'express';
import {
  getSales,
  recordSale,
  updateSubsidyStatus,
} from '../controllers/salesController';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('manage_sales'), getSales);
router.post('/', requirePermission('manage_sales'), recordSale);
router.put('/:id/subsidy', requirePermission('manage_sales'), updateSubsidyStatus);

export default router;
