import { Router } from 'express';
import {
  uploadAsset,
  listAssets,
  getAssetById,
  previewAssetFile,
  downloadAssetFile,
  updateAsset,
  deleteAsset,
  restoreAsset
} from '../controllers/assetController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

// Public / Semi-public listing (unauthenticated users can see public, authenticated see according to role/ownership)
// We use a soft auth middleware so public can view without token
router.get('/', (req, res, next) => {
  if (req.cookies?.token || req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, listAssets);

router.get('/:id', (req, res, next) => {
  if (req.cookies?.token || req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, getAssetById);

router.get('/:id/preview', (req, res, next) => {
  if (req.cookies?.token || req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, previewAssetFile);

router.get('/:id/download', (req, res, next) => {
  if (req.cookies?.token || req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, downloadAssetFile);

// Protected mutation routes
router.post('/upload', authenticate, uploadMiddleware.single('file'), uploadAsset);
router.put('/:id', authenticate, updateAsset);
router.delete('/:id', authenticate, deleteAsset);
router.post('/:id/restore', authenticate, restoreAsset);

export default router;
