import { Router } from 'express';
import {
  listContent,
  getContentById,
  createContent,
  reviewContent,
  updateContent,
  deleteContent
} from '../controllers/contentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.get('/', (req, res, next) => {
  if (req.cookies?.token || req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, listContent);

router.get('/:id', (req, res, next) => {
  if (req.cookies?.token || req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, getContentById);

router.post('/', authenticate, createContent);
router.put('/:id', authenticate, updateContent);
router.put('/:id/review', authenticate, requireRole('admin', 'editor'), reviewContent);
router.delete('/:id', authenticate, deleteContent);

export default router;
