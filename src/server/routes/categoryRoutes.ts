import { Router } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Publicly readable taxonomy
router.get('/', listCategories);

// Modifications restricted to admin/editor
router.post('/', authenticate, requireRole('admin', 'editor'), createCategory);
router.put('/:id', authenticate, requireRole('admin', 'editor'), updateCategory);
router.delete('/:id', authenticate, requireRole('admin'), deleteCategory);

export default router;
