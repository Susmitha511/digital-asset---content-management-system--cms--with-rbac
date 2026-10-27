import { Router } from 'express';
import {
  getSettings,
  updateSettings
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.get('/', getSettings);
router.put('/', authenticate, requireRole('admin'), updateSettings);

export default router;
