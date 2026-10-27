import { Response } from 'express';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { RoleDefinition } from '../../types/index.js';
import { ALL_PERMISSIONS } from '../seed/seedData.js';

export function getRolesAndPermissions(req: AuthenticatedRequest, res: Response): void {
  try {
    const rolesCol = dbStore.getCollection<RoleDefinition>('roles');
    const roles = rolesCol.find();

    res.json({
      success: true,
      roles,
      permissions: ALL_PERMISSIONS
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function updateRolePermissions(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const { permissions, description } = req.body;

    if (!Array.isArray(permissions)) {
      res.status(400).json({ success: false, message: 'Permissions must be an array of permission IDs.' });
      return;
    }

    const rolesCol = dbStore.getCollection<RoleDefinition>('roles');
    const role = rolesCol.findById(id);

    if (!role) {
      res.status(404).json({ success: false, message: 'Role definition not found.' });
      return;
    }

    // Protect admin role from losing critical permissions
    if (role.name === 'admin' && !permissions.includes('settings:manage')) {
      res.status(400).json({
        success: false,
        message: 'Security constraint violation: Administrator role must retain core security permissions.'
      });
      return;
    }

    const updates: Partial<RoleDefinition> = {
      permissions
    };
    if (description) updates.description = description.trim();

    const updated = rolesCol.findByIdAndUpdate(id, updates);

    logAuditEvent({
      req,
      action: 'ROLE_PERMISSIONS_UPDATED',
      resourceType: 'Role',
      resourceId: id,
      details: `Administrator updated permissions policy for role '${role.displayName}'.`
    });

    res.json({ success: true, message: `Permissions updated for ${role.displayName}.`, role: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
