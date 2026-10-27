import { Request } from 'express';
import { dbStore } from '../db/store.js';

export interface AuditLogParams {
  req?: Request;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType: 'User' | 'Asset' | 'Content' | 'Role' | 'Category' | 'Settings' | 'Auth' | 'AccessRequest';
  resourceId?: string;
  details: string;
}

export function logAuditEvent(params: AuditLogParams): void {
  try {
    const settingsCol = dbStore.getCollection('system_settings');
    const settings = settingsCol.findOne();
    if (settings && settings.enableAuditLog === false) {
      return;
    }

    const auditCol = dbStore.getCollection('audit_logs');
    const req = params.req;

    const actorId = params.actorId || (req as any)?.user?._id || 'SYSTEM';
    const actorEmail = params.actorEmail || (req as any)?.user?.email || 'system@cms.internal';
    const actorRole = params.actorRole || (req as any)?.user?.role || 'system';

    const ipAddress = req?.ip || req?.socket.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || 'Unknown Agent';

    auditCol.create({
      actorId,
      actorEmail,
      actorRole,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId || '',
      details: params.details,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
