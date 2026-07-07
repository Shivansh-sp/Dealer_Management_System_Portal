import { Router } from 'express';
import {
  login,
  verifyOtp,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// User Management (Master Admin only)
router.get('/users', authenticate, requirePermission('manage_users'), getUsers);
router.post('/users', authenticate, requirePermission('manage_users'), createUser);
router.put('/users/:id', authenticate, requirePermission('manage_users'), updateUser);
router.delete('/users/:id', authenticate, requirePermission('manage_users'), deleteUser);

export default router;
