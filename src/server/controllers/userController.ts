import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { User, UserRole, UserStatus } from '../../types/index.js';

export function getAllUsers(req: AuthenticatedRequest, res: Response): void {
  try {
    const { search, role, status, page = '1', limit = '10' } = req.query;
    const usersCol = dbStore.getCollection<User>('users');

    let users = usersCol.find();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        (u.department && u.department.toLowerCase().includes(q))
      );
    }

    if (role && typeof role === 'string' && role !== 'all') {
      users = users.filter(u => u.role === role);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      users = users.filter(u => u.status === status);
    }

    const total = users.length;
    const p = Math.max(1, parseInt(page as string, 10));
    const lim = Math.max(1, parseInt(limit as string, 10));
    const startIndex = (p - 1) * lim;
    const paginated = users.slice(startIndex, startIndex + lim).map(u => {
      const { password, ...safe } = u as any;
      return safe;
    });

    res.json({
      success: true,
      users: paginated,
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

export function getUserById(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const usersCol = dbStore.getCollection<User>('users');
    const user = usersCol.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const { password, ...safe } = user as any;
    res.json({ success: true, user: safe });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, password, role = 'user', department, storageQuotaMB = 100 } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and temporary password are required.' });
      return;
    }

    const usersCol = dbStore.getCollection<User & { password?: string }>('users');
    if (usersCol.findOne({ email: email.toLowerCase().trim() })) {
      res.status(409).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = usersCol.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      role: role as UserRole,
      status: 'active',
      department: department?.trim() || 'General',
      storageUsed: 0,
      storageQuota: Number(storageQuotaMB) * 1024 * 1024,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    });

    logAuditEvent({
      req,
      action: 'ADMIN_USER_PROVISIONED',
      resourceType: 'User',
      resourceId: newUser._id,
      details: `Administrator provisioned new user '${newUser.email}' with role '${newUser.role}'.`
    });

    const { password: _, ...safe } = newUser;
    res.status(201).json({ success: true, message: 'User provisioned successfully.', user: safe });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function updateUserRole(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'editor', 'user'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role specified.' });
      return;
    }

    const usersCol = dbStore.getCollection<User>('users');
    const target = usersCol.findById(id);

    if (!target) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Critical security check: Prevent removal of the last active administrator
    if (target.role === 'admin' && role !== 'admin') {
      const activeAdmins = usersCol.find(u => u.role === 'admin' && u.status === 'active');
      if (activeAdmins.length <= 1) {
        res.status(400).json({
          success: false,
          message: 'Security constraint violation: Cannot demote the last active administrator.'
        });
        return;
      }
    }

    const prevRole = target.role;
    const updated = usersCol.findByIdAndUpdate(id, { role: role as UserRole });

    logAuditEvent({
      req,
      action: 'USER_ROLE_CHANGED',
      resourceType: 'User',
      resourceId: target._id,
      details: `Changed role of user '${target.email}' from '${prevRole}' to '${role}'.`
    });

    const { password, ...safe } = updated as any;
    res.json({ success: true, message: `Role changed to ${role} successfully.`, user: safe });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function updateUserStatus(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status.' });
      return;
    }

    const usersCol = dbStore.getCollection<User>('users');
    const target = usersCol.findById(id);

    if (!target) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Critical security check: Prevent deactivating the last active administrator
    if (target.role === 'admin' && status !== 'active') {
      const activeAdmins = usersCol.find(u => u.role === 'admin' && u.status === 'active');
      if (activeAdmins.length <= 1) {
        res.status(400).json({
          success: false,
          message: 'Security constraint violation: Cannot deactivate the last active administrator.'
        });
        return;
      }
    }

    const prevStatus = target.status;
    const updated = usersCol.findByIdAndUpdate(id, { status: status as UserStatus });

    logAuditEvent({
      req,
      action: 'USER_STATUS_CHANGED',
      resourceType: 'User',
      resourceId: target._id,
      details: `User '${target.email}' status transitioned from '${prevStatus}' to '${status}'.`
    });

    const { password, ...safe } = updated as any;
    res.json({ success: true, message: `Status updated to ${status}.`, user: safe });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function updateUserDetails(req: AuthenticatedRequest, res: Response): void {
  try {
    const { id } = req.params;
    const { name, department, storageQuotaMB } = req.body;

    const usersCol = dbStore.getCollection<User>('users');
    const target = usersCol.findById(id);

    if (!target) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const updates: Partial<User> = {};
    if (name) updates.name = name.trim();
    if (department) updates.department = department.trim();
    if (storageQuotaMB !== undefined) updates.storageQuota = Number(storageQuotaMB) * 1024 * 1024;

    const updated = usersCol.findByIdAndUpdate(id, updates);

    logAuditEvent({
      req,
      action: 'USER_PROFILE_UPDATED',
      resourceType: 'User',
      resourceId: target._id,
      details: `Profile details updated for '${target.email}'.`
    });

    const { password, ...safe } = updated as any;
    res.json({ success: true, message: 'User profile updated.', user: safe });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
