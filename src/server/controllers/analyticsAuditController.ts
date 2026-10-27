import { Response } from 'express';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, Asset, Content, AuditLog, AccessRequest } from '../../types/index.js';

export function getDashboardStats(req: AuthenticatedRequest, res: Response): void {
  try {
    const user = req.user;
    const usersCol = dbStore.getCollection<User>('users');
    const assetsCol = dbStore.getCollection<Asset>('assets');
    const contentCol = dbStore.getCollection<Content>('contents');
    const accessCol = dbStore.getCollection<AccessRequest>('access_requests');
    const auditCol = dbStore.getCollection<AuditLog>('audit_logs');

    const allUsers = usersCol.find();
    const allAssets = assetsCol.find(a => !a.isDeleted);
    const allContent = contentCol.find();
    const allRequests = accessCol.find();
    const allAudit = auditCol.find();

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.status === 'active').length;
    const totalAssets = allAssets.length;
    const totalStorageUsed = allAssets.reduce((sum, a) => sum + (a.size || 0), 0);
    const pendingApprovals = allContent.filter(c => c.status === 'pending_review').length;
    const totalContent = allContent.length;
    const publishedContent = allContent.filter(c => c.status === 'published').length;
    const pendingAccessRequests = allRequests.filter(r => r.status === 'pending').length;

    // Category distribution
    const categoryMap: Record<string, { count: number; size: number }> = {};
    for (const a of allAssets) {
      const cat = a.category || 'General';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, size: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].size += a.size || 0;
    }
    const categoryDistribution = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      count: data.count,
      size: data.size
    }));

    // File type distribution
    const typeMap: Record<string, number> = {};
    for (const a of allAssets) {
      let t = 'Document';
      if (a.mimeType.startsWith('image/')) t = 'Images';
      else if (a.mimeType === 'application/pdf') t = 'PDFs';
      else if (a.mimeType.startsWith('video/')) t = 'Videos';
      else if (a.mimeType.startsWith('audio/')) t = 'Audio';
      else if (a.mimeType.includes('json') || a.mimeType.includes('xml')) t = 'Data / Code';

      typeMap[t] = (typeMap[t] || 0) + 1;
    }
    const fileTypeDistribution = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

    // 7-day upload trends
    const now = new Date();
    const uploadTrends: { date: string; uploads: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = allAssets.filter(a => a.createdAt.startsWith(dateStr)).length;
      uploadTrends.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uploads: count
      });
    }

    // Recent activity (latest 10)
    const recentActivity = [...allAudit]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Personal user stats (if regular user)
    let personalStats = null;
    if (user && user.role === 'user') {
      const myAssets = allAssets.filter(a => a.ownerId === user._id);
      const mySubmissions = allContent.filter(c => c.authorId === user._id);
      personalStats = {
        myAssetsCount: myAssets.length,
        myStorageUsed: user.storageUsed || myAssets.reduce((s, a) => s + a.size, 0),
        myStorageQuota: user.storageQuota || 104857600,
        myPendingSubmissions: mySubmissions.filter(c => c.status === 'pending_review').length,
        myPublishedSubmissions: mySubmissions.filter(c => c.status === 'published').length
      };
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalAssets,
        totalStorageUsed,
        pendingApprovals,
        totalContent,
        publishedContent,
        pendingAccessRequests,
        categoryDistribution,
        fileTypeDistribution,
        uploadTrends,
        recentActivity,
        personalStats
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function listAuditLogs(req: AuthenticatedRequest, res: Response): void {
  try {
    const { 
      search, 
      action, 
      resourceType, 
      actorEmail, 
      startDate, 
      endDate, 
      page = '1', 
      limit = '20' 
    } = req.query;

    const auditCol = dbStore.getCollection<AuditLog>('audit_logs');
    let logs = auditCol.find();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      logs = logs.filter(l => 
        l.details.toLowerCase().includes(q) || 
        l.actorEmail.toLowerCase().includes(q) || 
        l.action.toLowerCase().includes(q)
      );
    }

    if (action && action !== 'all') {
      logs = logs.filter(l => l.action === action);
    }

    if (resourceType && resourceType !== 'all') {
      logs = logs.filter(l => l.resourceType === resourceType);
    }

    if (actorEmail && typeof actorEmail === 'string') {
      logs = logs.filter(l => l.actorEmail.toLowerCase().includes(actorEmail.toLowerCase()));
    }

    if (startDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(startDate as string));
    }

    if (endDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(endDate as string));
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = logs.length;
    const p = Math.max(1, parseInt(page as string, 10));
    const lim = Math.max(1, parseInt(limit as string, 10));
    const startIndex = (p - 1) * lim;
    const paginated = logs.slice(startIndex, startIndex + lim);

    res.json({
      success: true,
      logs: paginated,
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

export function exportAuditLogsCsv(req: AuthenticatedRequest, res: Response): void {
  try {
    const auditCol = dbStore.getCollection<AuditLog>('audit_logs');
    const logs = [...auditCol.find()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const headers = ['Timestamp', 'Actor Email', 'Actor Role', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      `"${l.timestamp}"`,
      `"${l.actorEmail}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${l.resourceType}"`,
      `"${l.resourceId || ''}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress || '127.0.0.1'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cybersec-cms-audit-report-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
