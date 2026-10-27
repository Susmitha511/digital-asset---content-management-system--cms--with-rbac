import { Response } from 'express';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { Content, Notification, ContentStatus } from '../../types/index.js';

export function listContent(req: AuthenticatedRequest, res: Response): void {
  try {
    const user = req.user;
    const { 
      status, 
      category, 
      search, 
      scope, 
      page = '1', 
      limit = '10' 
    } = req.query;

    const contentCol = dbStore.getCollection<Content>('contents');

    let items = contentCol.find(item => {
      // If user is requesting their own submissions
      if (scope === 'mine') {
        return user ? item.authorId === user._id : false;
      }

      // If user is regular user browsing content
      if (!user || user.role === 'user') {
        if (scope === 'mine') return item.authorId === user?._id;
        // regular users only see published content in general feed
        return item.status === 'published';
      }

      // Admin and Editor can filter by any status
      if (status && status !== 'all') {
        return item.status === status;
      }

      return true;
    });

    if (category && category !== 'all') {
      items = items.filter(c => c.category === category);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      items = items.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.summary.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort by latest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const p = Math.max(1, parseInt(page as string, 10));
    const lim = Math.max(1, parseInt(limit as string, 10));
    const startIndex = (p - 1) * lim;
    const paginated = items.slice(startIndex, startIndex + lim);

    res.json({
      success: true,
      content: paginated,
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

export function getContentById(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const contentCol = dbStore.getCollection<Content>('contents');
    const item = contentCol.findById(id) || contentCol.findOne({ slug: id });

    if (!item) {
      res.status(404).json({ success: false, message: 'Content article not found.' });
      return;
    }

    // Check visibility
    const user = req.user;
    if (item.status !== 'published') {
      const isAuthor = user && user._id === item.authorId;
      const isAdminOrEditor = user && (user.role === 'admin' || user.role === 'editor');
      if (!isAuthor && !isAdminOrEditor) {
        res.status(403).json({ success: false, message: 'This content is not published yet.' });
        return;
      }
    }

    res.json({ success: true, content: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function createContent(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { title, summary, body, category = 'General', tags = '', submitForReview = true } = req.body;

    if (!title || !summary || !body) {
      res.status(400).json({ success: false, message: 'Title, summary, and article body are required.' });
      return;
    }

    const parsedTags = Array.isArray(tags) 
      ? tags 
      : typeof tags === 'string' 
        ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${Date.now().toString(36)}`;

    // Admins and editors can directly publish or submit; users submit for pending review
    let status: ContentStatus = 'draft';
    if (req.user.role === 'admin' || req.user.role === 'editor') {
      status = submitForReview ? 'published' : 'draft';
    } else {
      status = submitForReview ? 'pending_review' : 'draft';
    }

    const contentCol = dbStore.getCollection<Content>('contents');
    const newContent = contentCol.create({
      title: title.trim(),
      slug,
      summary: summary.trim(),
      body: body.trim(),
      category: category.trim(),
      tags: parsedTags,
      authorId: req.user._id,
      authorName: req.user.name,
      status,
      publishedAt: status === 'published' ? new Date().toISOString() : undefined
    });

    // Notify admins if submitted for review
    if (status === 'pending_review') {
      const usersCol = dbStore.getCollection('users');
      const notifCol = dbStore.getCollection<Notification>('notifications');
      const admins = usersCol.find(u => u.role === 'admin' || u.role === 'editor');

      for (const admin of admins) {
        notifCol.create({
          userId: admin._id,
          title: 'New Content Submission Awaiting Review',
          message: `${req.user.name} submitted "${newContent.title}" for publishing review.`,
          type: 'info',
          link: '/admin/approvals',
          isRead: false
        });
      }
    }

    logAuditEvent({
      req,
      action: status === 'published' ? 'CONTENT_PUBLISHED_DIRECT' : 'CONTENT_SUBMITTED_FOR_REVIEW',
      resourceType: 'Content',
      resourceId: newContent._id,
      details: `Article "${newContent.title}" created with status '${status}'.`
    });

    res.status(201).json({
      success: true,
      message: status === 'published' ? 'Content published successfully.' : 'Content submitted for administrative review.',
      content: newContent
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function reviewContent(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
      res.status(403).json({ success: false, message: 'Forbidden: Reviewer or Administrator authority required.' });
      return;
    }

    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".' });
      return;
    }

    if (action === 'reject' && !rejectionReason) {
      res.status(400).json({ success: false, message: 'A constructive reason must be supplied when rejecting submissions.' });
      return;
    }

    const contentCol = dbStore.getCollection<Content>('contents');
    const item = contentCol.findById(id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Content item not found.' });
      return;
    }

    const newStatus: ContentStatus = action === 'approve' ? 'published' : 'rejected';
    const now = new Date().toISOString();

    const updated = contentCol.findByIdAndUpdate(id, {
      status: newStatus,
      rejectionReason: action === 'reject' ? rejectionReason.trim() : undefined,
      reviewedById: req.user._id,
      reviewedByName: req.user.name,
      reviewedAt: now,
      publishedAt: action === 'approve' ? now : undefined
    });

    // Send notification to author
    const notifCol = dbStore.getCollection<Notification>('notifications');
    notifCol.create({
      userId: item.authorId,
      title: action === 'approve' ? 'Submission Approved!' : 'Submission Needs Revision',
      message: action === 'approve' 
        ? `Your submission "${item.title}" was approved and published.`
        : `Your submission "${item.title}" was rejected: ${rejectionReason}`,
      type: action === 'approve' ? 'success' : 'alert',
      link: '/user/submissions',
      isRead: false
    });

    logAuditEvent({
      req,
      action: action === 'approve' ? 'CONTENT_APPROVED' : 'CONTENT_REJECTED',
      resourceType: 'Content',
      resourceId: item._id,
      details: `Article "${item.title}" ${action === 'approve' ? 'approved and published' : `rejected with note: "${rejectionReason}"`}.`
    });

    res.json({
      success: true,
      message: `Content successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
      content: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function updateContent(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const { title, summary, body, category, tags, status } = req.body;

    const contentCol = dbStore.getCollection<Content>('contents');
    const item = contentCol.findById(id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Content item not found.' });
      return;
    }

    const isAuthor = item.authorId === req.user._id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'editor';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ success: false, message: 'Not authorized to edit this content.' });
      return;
    }

    const updates: Partial<Content> = {};
    if (title) updates.title = title.trim();
    if (summary) updates.summary = summary.trim();
    if (body) updates.body = body.trim();
    if (category) updates.category = category.trim();
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    }

    // Status changes
    if (status) {
      if (isAdmin) {
        updates.status = status;
        if (status === 'published' && !item.publishedAt) {
          updates.publishedAt = new Date().toISOString();
        }
      } else if (isAuthor && (item.status === 'draft' || item.status === 'rejected') && status === 'pending_review') {
        // Author resubmitting
        updates.status = 'pending_review';
      }
    }

    const updated = contentCol.findByIdAndUpdate(id, updates);

    logAuditEvent({
      req,
      action: 'CONTENT_UPDATED',
      resourceType: 'Content',
      resourceId: item._id,
      details: `Article "${item.title}" updated.`
    });

    res.json({ success: true, message: 'Content updated successfully.', content: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function deleteContent(req: AuthenticatedRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const contentCol = dbStore.getCollection<Content>('contents');
    const item = contentCol.findById(id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Content not found.' });
      return;
    }

    const isAuthor = item.authorId === req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ success: false, message: 'Permission denied to delete this content.' });
      return;
    }

    contentCol.findByIdAndDelete(id);

    logAuditEvent({
      req,
      action: 'CONTENT_DELETED',
      resourceType: 'Content',
      resourceId: id,
      details: `Article "${item.title}" was removed.`
    });

    res.json({ success: true, message: 'Content deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
