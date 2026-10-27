import { Router } from 'express';
import {
  getDashboardStats,
  listAuditLogs,
  exportAuditLogsCsv
} from '../controllers/analyticsAuditController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard-stats', getDashboardStats);
router.get('/audit-logs', requireRole('admin', 'editor'), listAuditLogs);
router.get('/audit-logs/export-csv', requireRole('admin'), exportAuditLogsCsv);

export default router;
