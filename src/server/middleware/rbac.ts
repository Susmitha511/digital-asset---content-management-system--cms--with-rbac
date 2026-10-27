import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { dbStore } from '../db/store.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { RoleDefinition } from '../../types/index.js';

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logAuditEvent({
        req,
        action: 'UNAUTHORIZED_ROLE_ACCESS_DENIED',
        resourceType: 'User',
        resourceId: req.user._id,
        details: `User with role '${req.user.role}' attempted unauthorized access to role-protected endpoint '${req.originalUrl}' (Requires: ${allowedRoles.join(', ')}).`
      });

      res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient privileges. Required role: ${allowedRoles.join(' or ')}.`
      });
      return;
    }

    next();
  };
}

export function requirePermission(permissionId: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Admins have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    const rolesCol = dbStore.getCollection<RoleDefinition>('roles');
    const roleDef = rolesCol.findOne({ name: req.user.role as any });

    if (!roleDef || !roleDef.permissions.includes(permissionId)) {
      logAuditEvent({
        req,
        action: 'UNAUTHORIZED_PERMISSION_ACCESS_DENIED',
        resourceType: 'Role',
        resourceId: req.user._id,
        details: `User '${req.user.email}' lacks permission '${permissionId}' for endpoint '${req.originalUrl}'.`
      });

      res.status(403).json({
        success: false,
        message: `Access denied. You do not possess the required permission: [${permissionId}].`
      });
      return;
    }

    next();
  };
}
