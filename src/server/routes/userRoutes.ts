import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUserRole,
  updateUserStatus,
  updateUserDetails
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// Admin-only user management routes
router.get('/', requireRole('admin', 'editor'), getAllUsers);
router.get('/:id', requireRole('admin', 'editor'), getUserById);
router.post('/', requireRole('admin'), createUser);
router.put('/:id/role', requireRole('admin'), updateUserRole);
router.put('/:id/status', requireRole('admin'), updateUserStatus);
router.put('/:id', requireRole('admin'), updateUserDetails);

export default router;
