import { Router } from 'express';
import {
  createAccessRequest,
  listAccessRequests,
  reviewAccessRequest,
  shareAsset,
  listSharedWithMe,
  revokeShare
} from '../controllers/accessShareController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Access requests
router.post('/access-requests', createAccessRequest);
router.get('/access-requests', listAccessRequests);
router.put('/access-requests/:id/review', reviewAccessRequest);

// Peer sharing
router.post('/shares', shareAsset);
router.get('/shares/shared-with-me', listSharedWithMe);
router.delete('/shares/:id', revokeShare);

export default router;
