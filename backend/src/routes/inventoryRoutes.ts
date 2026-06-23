import { Router } from 'express';
import {
  getInventory,
  addInventoryItem,
  getGatePasses,
  generateGatePass,
  approveGatePass,
} from '../controllers/inventoryController';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('manage_inventory'), getInventory);
router.post('/', requirePermission('manage_inventory'), addInventoryItem);

// Gate passes
router.get('/gate-passes', requirePermission('manage_gate_passes'), getGatePasses);
router.post('/gate-passes', requirePermission('manage_gate_passes'), generateGatePass);
router.put('/gate-passes/:id/approve', requirePermission('manage_gate_passes'), approveGatePass);

export default router;
