import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { Asset, User, Share, AccessRequest } from '../../types/index.js';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export function uploadAsset(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file was uploaded.' });
      return;
    }

    const { title, description, category = 'General', tags = '', visibility = 'private' } = req.body;

    const file = req.file;
    const fileSize = file.size;

    // Check user storage quota
    const usersCol = dbStore.getCollection<User>('users');
    const user = usersCol.findById(req.user._id);

    if (user && (user.storageUsed + fileSize > user.storageQuota)) {
      // Remove uploaded file from disk to avoid clutter
      try {
        fs.unlinkSync(file.path);
      } catch (e) {}

      res.status(400).json({
        success: false,
        message: `Upload exceeds your available storage quota (${(user.storageQuota / (1024 * 1024)).toFixed(1)} MB).`
      });
      return;
    }

    // Process tags
    const parsedTags = Array.isArray(tags) 
      ? tags 
      : typeof tags === 'string' 
        ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

    const assetsCol = dbStore.getCollection<Asset>('assets');
    const newAsset = assetsCol.create({
      originalName: file.originalname,
      storedName: file.filename,
      title: (title || file.originalname).trim(),
      description: (description || '').trim(),
      mimeType: file.mimetype || 'application/octet-stream',
      size: fileSize,
      category: category.trim(),
      tags: parsedTags,
      ownerId: req.user._id,
      ownerName: req.user.name,
      visibility: ['public', 'private', 'restricted', 'shared'].includes(visibility) ? visibility : 'private',
      status: 'active',
      downloadCount: 0,
      filePath: file.filename,
      isDeleted: false
    });

    // Update user's storage used
    if (user) {
      usersCol.findByIdAndUpdate(user._id, {
        storageUsed: user.storageUsed + fileSize
      });
    }

    // Update category asset count
    const catCol = dbStore.getCollection('categories');
    const cat = catCol.findOne({ name: category.trim() });
    if (cat) {
      catCol.findByIdAndUpdate(cat._id, { assetCount: (cat.assetCount || 0) + 1 });
    }

    logAuditEvent({
      req,
      action: 'ASSET_UPLOAD',
      resourceType: 'Asset',
      resourceId: newAsset._id,
      details: `User uploaded asset '${newAsset.title}' (${file.originalname}, ${(fileSize / 1024).toFixed(1)} KB).`
    });

    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully.',
      asset: newAsset
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function listAssets(req: AuthenticatedRequest, res: Response): void {
  try {
    const user = req.user;
    const { 
      search, 
      category, 
      type, 
      visibility, 
      scope, 
      sortBy = 'createdAt', 
      order = 'desc',
      page = '1', 
      limit = '12',
      includeDeleted = 'false'
    } = req.query;

    const assetsCol = dbStore.getCollection<Asset>('assets');
    const sharesCol = dbStore.getCollection<Share>('shares');

    // Get assets shared with user
    const userShares = user ? sharesCol.find({ sharedWithUserId: user._id }) : [];
    const sharedAssetIds = new Set(userShares.map(s => s.assetId));

    let assets = assetsCol.find(asset => {
      // Soft deletion filter
      if (includeDeleted === 'true' && user?.role === 'admin') {
        // Admin can view deleted
      } else if (asset.isDeleted || asset.status === 'deleted') {
        return false;
      }

      // Scope filter
      if (scope === 'mine') {
        return user ? asset.ownerId === user._id : false;
      }

      if (scope === 'shared') {
        return user ? sharedAssetIds.has(asset._id) : false;
      }

      // Authorization & Visibility Filter
      if (!user) {
        return asset.visibility === 'public';
      }

      // Admins and editors have enterprise visibility
      if (user.role === 'admin' || user.role === 'editor') {
        return true;
      }

      // Regular user: can see public, own, or shared
      if (asset.visibility === 'public') return true;
      if (asset.ownerId === user._id) return true;
      if (sharedAssetIds.has(asset._id)) return true;

      // Also visible in browse if restricted so they can request access
      if (asset.visibility === 'restricted') return true;

      return false;
    });

    // Filtering
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      assets = assets.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.description.toLowerCase().includes(q) ||
        a.originalName.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (category && typeof category === 'string' && category !== 'all') {
      assets = assets.filter(a => a.category === category);
    }

    if (visibility && typeof visibility === 'string' && visibility !== 'all') {
      assets = assets.filter(a => a.visibility === visibility);
    }

    if (type && typeof type === 'string' && type !== 'all') {
      if (type === 'image') {
        assets = assets.filter(a => a.mimeType.startsWith('image/'));
      } else if (type === 'pdf') {
        assets = assets.filter(a => a.mimeType === 'application/pdf');
      } else if (type === 'document') {
        assets = assets.filter(a => 
          a.mimeType.includes('word') || 
          a.mimeType.includes('text') || 
          a.mimeType.includes('presentation') || 
          a.mimeType.includes('pdf') ||
          a.originalName.endsWith('.txt') ||
          a.originalName.endsWith('.doc') ||
          a.originalName.endsWith('.docx')
        );
      } else if (type === 'media') {
        assets = assets.filter(a => a.mimeType.startsWith('video/') || a.mimeType.startsWith('audio/'));
      }
    }

    // Sorting
    assets.sort((a, b) => {
      let valA: any = (a as any)[sortBy as string] || a.createdAt;
      let valB: any = (b as any)[sortBy as string] || b.createdAt;

      if (sortBy === 'size' || sortBy === 'downloadCount') {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (order === 'asc') {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });

    const total = assets.length;
    const p = Math.max(1, parseInt(page as string, 10));
    const lim = Math.max(1, parseInt(limit as string, 10));
    const startIndex = (p - 1) * lim;
    const paginated = assets.slice(startIndex, startIndex + lim);

    res.json({
      success: true,
      assets: paginated,
      pagination: {
        total,
        page: p,
        limit: lim,
        pages: Math.ceil(total / lim)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function getAssetById(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const assetsCol = dbStore.getCollection<Asset>('assets');
    const asset = assetsCol.findById(id);

    if (!asset || asset.isDeleted) {
      res.status(404).json({ success: false, message: 'Asset not found or removed.' });
      return;
    }

    const user = req.user;
    const isAuthorized = checkAssetAuthorization(asset, user);

    if (!isAuthorized.canView) {
      res.status(403).json({
        success: false,
        message: 'Access denied. This digital asset is restricted or private.',
        requiresAccessRequest: asset.visibility === 'restricted'
      });
      return;
    }

    res.json({
      success: true,
      asset,
      permissions: isAuthorized
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function previewAssetFile(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const assetsCol = dbStore.getCollection<Asset>('assets');
    const asset = assetsCol.findById(id);

    if (!asset || asset.isDeleted) {
      res.status(404).send('Asset not found');
      return;
    }

    const user = req.user;
    const isAuthorized = checkAssetAuthorization(asset, user);

    if (!isAuthorized.canView) {
      res.status(403).send('Forbidden: Not authorized to preview this private asset.');
      return;
    }

    const filePath = path.resolve(UPLOAD_DIR, asset.storedName);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Physical file missing on server storage');
      return;
    }

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${asset.originalName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    res.status(500).send('Error streaming preview');
  }
}

export function downloadAssetFile(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const assetsCol = dbStore.getCollection<Asset>('assets');
    const asset = assetsCol.findById(id);

    if (!asset || asset.isDeleted) {
      res.status(404).json({ success: false, message: 'Asset not found.' });
      return;
    }

    const user = req.user;
    const isAuthorized = checkAssetAuthorization(asset, user);

    if (!isAuthorized.canDownload) {
      logAuditEvent({
        req,
        action: 'UNAUTHORIZED_DOWNLOAD_ATTEMPT',
        resourceType: 'Asset',
        resourceId: asset._id,
        details: `Unauthorized download attempt for '${asset.title}' by user '${user?.email || 'Anonymous'}'.`
      });

      res.status(403).json({ success: false, message: 'Forbidden: Download not authorized for this asset.' });
      return;
    }

    const filePath = path.resolve(UPLOAD_DIR, asset.storedName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Physical file not found.' });
      return;
    }

    // Increment download count
    assetsCol.findByIdAndUpdate(asset._id, {
      downloadCount: (asset.downloadCount || 0) + 1
    });

    logAuditEvent({
      req,
      action: 'ASSET_DOWNLOAD_AUTHORIZED',
      resourceType: 'Asset',
      resourceId: asset._id,
      details: `Authorized download of '${asset.title}' (${asset.originalName}).`
    });

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(asset.originalName)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function updateAsset(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const { title, description, category, tags, visibility, status } = req.body;

    const assetsCol = dbStore.getCollection<Asset>('assets');
    const asset = assetsCol.findById(id);

    if (!asset) {
      res.status(404).json({ success: false, message: 'Asset not found.' });
      return;
    }

    // Check ownership or admin privileges
    const isOwner = asset.ownerId === req.user._id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'editor';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'You do not have permission to edit this asset.' });
      return;
    }

    const updates: Partial<Asset> = {};
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category) updates.category = category.trim();
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    }
    if (visibility && ['public', 'private', 'restricted', 'shared'].includes(visibility)) {
      updates.visibility = visibility;
    }
    if (status && ['active', 'archived', 'deleted'].includes(status)) {
      updates.status = status;
    }

    const updated = assetsCol.findByIdAndUpdate(id, updates);

    logAuditEvent({
      req,
      action: 'ASSET_METADATA_UPDATED',
      resourceType: 'Asset',
      resourceId: asset._id,
      details: `Updated metadata for asset '${asset.title}'.`
    });

    res.json({ success: true, message: 'Asset updated successfully.', asset: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function deleteAsset(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const { permanent = 'false' } = req.query;

    const assetsCol = dbStore.getCollection<Asset>('assets');
    const asset = assetsCol.findById(id);

    if (!asset) {
      res.status(404).json({ success: false, message: 'Asset not found.' });
      return;
    }

    const isOwner = asset.ownerId === req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'You do not have permission to delete this asset.' });
      return;
    }

    if (permanent === 'true' && isAdmin) {
      // Permanent deletion: remove physical file & db record
      const filePath = path.resolve(UPLOAD_DIR, asset.storedName);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      assetsCol.findByIdAndDelete(id);

      // Decrement storage used
      const usersCol = dbStore.getCollection<User>('users');
      const owner = usersCol.findById(asset.ownerId);
      if (owner) {
        usersCol.findByIdAndUpdate(owner._id, {
          storageUsed: Math.max(0, owner.storageUsed - asset.size)
        });
      }

      logAuditEvent({
        req,
        action: 'ASSET_PERMANENTLY_DELETED',
        resourceType: 'Asset',
        resourceId: id,
        details: `Permanently removed asset '${asset.title}' and deleted physical file.`
      });

      res.json({ success: true, message: 'Asset permanently deleted.' });
    } else {
      // Soft deletion
      assetsCol.findByIdAndUpdate(id, {
        isDeleted: true,
        status: 'deleted',
        deletedAt: new Date().toISOString()
      });

      logAuditEvent({
        req,
        action: 'ASSET_SOFT_DELETED',
        resourceType: 'Asset',
        resourceId: id,
        details: `Soft deleted asset '${asset.title}'.`
      });

      res.json({ success: true, message: 'Asset moved to trash (soft-deleted).' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function restoreAsset(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const assetsCol = dbStore.getCollection<Asset>('assets');
    const asset = assetsCol.findById(id);

    if (!asset) {
      res.status(404).json({ success: false, message: 'Asset not found.' });
      return;
    }

    const isOwner = asset.ownerId === req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'You do not have permission to restore this asset.' });
      return;
    }

    const restored = assetsCol.findByIdAndUpdate(id, {
      isDeleted: false,
      status: 'active',
      deletedAt: undefined
    });

    logAuditEvent({
      req,
      action: 'ASSET_RESTORED',
      resourceType: 'Asset',
      resourceId: id,
      details: `Restored soft-deleted asset '${asset.title}'.`
    });

    res.json({ success: true, message: 'Asset restored successfully.', asset: restored });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Helper authorization evaluation function
function checkAssetAuthorization(asset: Asset, user?: User) {
  if (!user) {
    const isPublic = asset.visibility === 'public';
    return {
      canView: isPublic,
      canDownload: isPublic,
      canEdit: false,
      canDelete: false,
      isOwner: false
    };
  }

  const isOwner = asset.ownerId === user._id;
  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'editor';

  if (isAdmin) {
    return { canView: true, canDownload: true, canEdit: true, canDelete: true, isOwner };
  }

  if (isEditor) {
    return { canView: true, canDownload: true, canEdit: true, canDelete: false, isOwner };
  }

  if (isOwner) {
    return { canView: true, canDownload: true, canEdit: true, canDelete: true, isOwner: true };
  }

  // Check peer share
  const sharesCol = dbStore.getCollection<Share>('shares');
  const share = sharesCol.findOne({ assetId: asset._id, sharedWithUserId: user._id });

  if (share) {
    return {
      canView: true,
      canDownload: share.permission === 'download' || share.permission === 'edit',
      canEdit: share.permission === 'edit',
      canDelete: false,
      isOwner: false,
      sharedPermission: share.permission
    };
  }

  // Check approved access request
  const accessCol = dbStore.getCollection<AccessRequest>('access_requests');
  const approvedReq = accessCol.findOne({
    assetId: asset._id,
    requesterId: user._id,
    status: 'approved'
  });

  if (approvedReq) {
    return { canView: true, canDownload: true, canEdit: false, canDelete: false, isOwner: false };
  }

  const isPublic = asset.visibility === 'public';
  return {
    canView: isPublic,
    canDownload: isPublic,
    canEdit: false,
    canDelete: false,
    isOwner: false
  };
}
