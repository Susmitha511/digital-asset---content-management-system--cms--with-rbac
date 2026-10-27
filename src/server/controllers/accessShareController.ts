import { Response } from 'express';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { AccessRequest, Share, Asset, User, Notification } from '../../types/index.js';

export function createAccessRequest(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { assetId, reason } = req.body;
    if (!assetId || !reason) {
      res.status(400).json({ success: false, message: 'Asset ID and reason for access are required.' });
      return;
    }

    const assetsCol = dbStore.getCollection<Asset>('assets');
    const asset = assetsCol.findById(assetId);

    if (!asset || asset.isDeleted) {
      res.status(404).json({ success: false, message: 'Asset not found.' });
      return;
    }

    if (asset.ownerId === req.user._id) {
      res.status(400).json({ success: false, message: 'You already own this asset.' });
      return;
    }

    const accessCol = dbStore.getCollection<AccessRequest>('access_requests');
    // Check if already requested
    const existing = accessCol.findOne({
      assetId,
      requesterId: req.user._id,
      status: 'pending'
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'You already have a pending request for this asset.' });
      return;
    }

    const newReq = accessCol.create({
      assetId,
      assetTitle: asset.title,
      requesterId: req.user._id,
      requesterName: req.user.name,
      requesterEmail: req.user.email,
      ownerId: asset.ownerId,
      status: 'pending',
      reason: reason.trim()
    });

    // Notify asset owner
    const notifCol = dbStore.getCollection<Notification>('notifications');
    notifCol.create({
      userId: asset.ownerId,
      title: 'New Access Request',
      message: `${req.user.name} has requested access to "${asset.title}".`,
      type: 'info',
      link: '/user/access-requests',
      isRead: false
    });

    logAuditEvent({
      req,
      action: 'ACCESS_REQUEST_SUBMITTED',
      resourceType: 'AccessRequest',
      resourceId: newReq._id,
      details: `User '${req.user.email}' requested access to asset '${asset.title}'. Reason: "${reason.trim()}"`
    });

    res.status(201).json({ success: true, message: 'Access request submitted to owner/administrator.', request: newReq });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function listAccessRequests(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { type = 'received' } = req.query; // 'received' | 'sent' | 'all'
    const accessCol = dbStore.getCollection<AccessRequest>('access_requests');

    let requests: AccessRequest[] = [];

    if (req.user.role === 'admin' || req.user.role === 'editor') {
      requests = accessCol.find();
    } else {
      if (type === 'sent') {
        requests = accessCol.find({ requesterId: req.user._id });
      } else {
        requests = accessCol.find({ ownerId: req.user._id });
      }
    }

    // Sort newest first
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function reviewAccessRequest(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const { action, reviewNote } = req.body; // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".' });
      return;
    }

    const accessCol = dbStore.getCollection<AccessRequest>('access_requests');
    const reqDoc = accessCol.findById(id);

    if (!reqDoc) {
      res.status(404).json({ success: false, message: 'Access request not found.' });
      return;
    }

    const isOwner = reqDoc.ownerId === req.user._id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'editor';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized to review this request.' });
      return;
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    const updated = accessCol.findByIdAndUpdate(id, {
      status,
      reviewNote: reviewNote ? reviewNote.trim() : '',
      reviewedAt: new Date().toISOString()
    });

    // If approved, create a Share record
    if (action === 'approve') {
      const sharesCol = dbStore.getCollection<Share>('shares');
      sharesCol.create({
        assetId: reqDoc.assetId,
        assetTitle: reqDoc.assetTitle,
        sharedById: req.user._id,
        sharedByName: req.user.name,
        sharedWithUserId: reqDoc.requesterId,
        sharedWithEmail: reqDoc.requesterEmail,
        permission: 'download'
      });
    }

    // Send notification to requester
    const notifCol = dbStore.getCollection<Notification>('notifications');
    notifCol.create({
      userId: reqDoc.requesterId,
      title: action === 'approve' ? 'Access Request Approved' : 'Access Request Denied',
      message: action === 'approve'
        ? `Access granted to "${reqDoc.assetTitle}". You can now view and download the asset.`
        : `Your access request for "${reqDoc.assetTitle}" was declined.`,
      type: action === 'approve' ? 'success' : 'alert',
      link: '/user/shared-with-me',
      isRead: false
    });

    logAuditEvent({
      req,
      action: action === 'approve' ? 'ACCESS_REQUEST_APPROVED' : 'ACCESS_REQUEST_REJECTED',
      resourceType: 'AccessRequest',
      resourceId: reqDoc._id,
      details: `${action === 'approve' ? 'Granted' : 'Denied'} access to asset '${reqDoc.assetTitle}' for user '${reqDoc.requesterEmail}'.`
    });

    res.json({ success: true, message: `Access request ${status}.`, request: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function shareAsset(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { assetId, recipientEmail, permission = 'download', expiresAt } = req.body;

    if (!assetId || !recipientEmail) {
      res.status(400).json({ success: false, message: 'Asset ID and recipient email are required.' });
      return;
    }

    const assetsCol = dbStore.getCollection<Asset>('assets');
    const asset = assetsCol.findById(assetId);

    if (!asset || asset.isDeleted) {
      res.status(404).json({ success: false, message: 'Asset not found.' });
      return;
    }

    const isOwner = asset.ownerId === req.user._id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'editor';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Only asset owners or administrators can share this asset.' });
      return;
    }

    const usersCol = dbStore.getCollection<User>('users');
    const recipient = usersCol.findOne({ email: recipientEmail.toLowerCase().trim() });

    if (!recipient) {
      res.status(404).json({ success: false, message: 'Recipient user account not found.' });
      return;
    }

    if (recipient._id === req.user._id) {
      res.status(400).json({ success: false, message: 'Cannot share an asset with yourself.' });
      return;
    }

    const sharesCol = dbStore.getCollection<Share>('shares');
    // Check if existing share
    const existingShare = sharesCol.findOne({
      assetId,
      sharedWithUserId: recipient._id
    });

    let shareRecord;
    if (existingShare) {
      shareRecord = sharesCol.findByIdAndUpdate(existingShare._id, {
        permission,
        expiresAt: expiresAt || undefined
      });
    } else {
      shareRecord = sharesCol.create({
        assetId,
        assetTitle: asset.title,
        sharedById: req.user._id,
        sharedByName: req.user.name,
        sharedWithUserId: recipient._id,
        sharedWithEmail: recipient.email,
        permission: ['view', 'download', 'edit'].includes(permission) ? permission : 'download',
        expiresAt: expiresAt || undefined
      });
    }

    // Notify recipient
    const notifCol = dbStore.getCollection<Notification>('notifications');
    notifCol.create({
      userId: recipient._id,
      title: 'Digital Asset Shared With You',
      message: `${req.user.name} shared "${asset.title}" with you (${permission} permission).`,
      type: 'info',
      link: '/user/shared-with-me',
      isRead: false
    });

    logAuditEvent({
      req,
      action: 'ASSET_PEER_SHARED',
      resourceType: 'Asset',
      resourceId: asset._id,
      details: `Asset '${asset.title}' shared with '${recipient.email}' (permission: ${permission}).`
    });

    res.status(201).json({ success: true, message: `Asset shared with ${recipient.name}.`, share: shareRecord });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function listSharedWithMe(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const sharesCol = dbStore.getCollection<Share>('shares');
    const assetsCol = dbStore.getCollection<Asset>('assets');

    const myShares = sharesCol.find({ sharedWithUserId: req.user._id });

    // Join with asset details
    const result = myShares.map(share => {
      const asset = assetsCol.findById(share.assetId);
      return {
        ...share,
        asset: asset && !asset.isDeleted ? asset : null
      };
    }).filter(s => s.asset !== null);

    res.json({ success: true, shares: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function revokeShare(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const sharesCol = dbStore.getCollection<Share>('shares');
    const share = sharesCol.findById(id);

    if (!share) {
      res.status(404).json({ success: false, message: 'Share record not found.' });
      return;
    }

    const isSharer = share.sharedById === req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (!isSharer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized to revoke this share.' });
      return;
    }

    sharesCol.findByIdAndDelete(id);

    logAuditEvent({
      req,
      action: 'ASSET_SHARE_REVOKED',
      resourceType: 'Asset',
      resourceId: share.assetId,
      details: `Revoked share of '${share.assetTitle}' for '${share.sharedWithEmail}'.`
    });

    res.json({ success: true, message: 'Access share revoked.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
