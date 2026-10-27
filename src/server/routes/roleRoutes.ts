import { Router } from 'express';
import {
  getRolesAndPermissions,
  updateRolePermissions
} from '../controllers/roleController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'editor'), getRolesAndPermissions);
router.put('/:id', requireRole('admin'), updateRolePermissions);

export default router;
