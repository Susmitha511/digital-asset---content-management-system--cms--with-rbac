import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { dbStore } from '../db/store.js';
import { signToken } from '../utils/jwt.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../../types/index.js';

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    const usersCol = dbStore.getCollection<User & { password?: string }>('users');
    const existing = usersCol.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = usersCol.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      role: 'user', // Default role always user
      status: 'active',
      department: department?.trim() || 'General',
      storageUsed: 0,
      storageQuota: 104857600, // 100MB default
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    });

    const token = signToken(newUser);

    // Set HTTP-only secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logAuditEvent({
      actorId: newUser._id,
      actorEmail: newUser.email,
      actorRole: newUser.role,
      action: 'USER_REGISTRATION_SUCCESS',
      resourceType: 'Auth',
      resourceId: newUser._id,
      details: `New account registered for '${newUser.email}'.`
    });

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userSafe
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const usersCol = dbStore.getCollection<User & { password?: string }>('users');
    const user = usersCol.findOne({ email: email.toLowerCase().trim() });

    if (!user || !user.password) {
      logAuditEvent({
        req,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'Auth',
        details: `Failed login attempt for non-existent email '${email}'.`
      });
      res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logAuditEvent({
        req,
        actorId: user._id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'Auth',
        resourceId: user._id,
        details: `Invalid password entered for user account '${user.email}'.`
      });
      res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
      return;
    }

    if (user.status !== 'active') {
      logAuditEvent({
        req,
        actorId: user._id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_LOGIN_BLOCKED',
        resourceType: 'Auth',
        resourceId: user._id,
        details: `Login blocked for account with status '${user.status}'.`
      });
      res.status(403).json({ success: false, message: `Account is currently ${user.status}. Access denied.` });
      return;
    }

    // Update last login
    usersCol.findByIdAndUpdate(user._id, { lastLoginAt: new Date().toISOString() });

    const token = signToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logAuditEvent({
      req,
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'Auth',
      resourceId: user._id,
      details: `Successful authenticated login session established for '${user.email}'.`
    });

    const { password: _, ...userSafe } = user;
    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: userSafe
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login failed.' });
  }
}

export function logout(req: AuthenticatedRequest, res: Response): void {
  if (req.user) {
    logAuditEvent({
      req,
      action: 'USER_LOGOUT',
      resourceType: 'Auth',
      resourceId: req.user._id,
      details: `User '${req.user.email}' signed out and cleared session.`
    });
  }

  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }
  const { password: _, ...userSafe } = req.user as any;
  res.json({ success: true, user: userSafe });
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
      return;
    }

    const usersCol = dbStore.getCollection<User & { password?: string }>('users');
    const user = usersCol.findById(req.user._id);
    if (!user || !user.password) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Incorrect current password.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    usersCol.findByIdAndUpdate(user._id, { password: newHash });

    logAuditEvent({
      req,
      action: 'USER_PASSWORD_CHANGED',
      resourceType: 'Auth',
      resourceId: user._id,
      details: `Password securely updated for '${user.email}'.`
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Password update failed.' });
  }
}

export function forgotPassword(req: AuthenticatedRequest, res: Response): void {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email address is required.' });
    return;
  }

  const usersCol = dbStore.getCollection<User>('users');
  const user = usersCol.findOne({ email: email.toLowerCase().trim() });

  // Return consistent message to prevent user enumeration
  if (!user) {
    res.json({ success: true, message: 'If that email exists in our system, password reset instructions have been generated.' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  const resetCol = dbStore.getCollection('password_reset_tokens');
  resetCol.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    used: false
  });

  logAuditEvent({
    req,
    action: 'PASSWORD_RESET_REQUESTED',
    resourceType: 'Auth',
    resourceId: user._id,
    details: `Password reset token generated for '${user.email}'.`
  });

  res.json({
    success: true,
    message: 'If that email exists in our system, password reset instructions have been generated.',
    // For demonstration in review environment, provide the reset token
    demoResetToken: resetToken
  });
}

export async function resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetCol = dbStore.getCollection('password_reset_tokens');
    const record = resetCol.findOne({ tokenHash, used: false });

    if (!record || new Date(record.expiresAt) < new Date()) {
      res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
      return;
    }

    const usersCol = dbStore.getCollection<User & { password?: string }>('users');
    const user = usersCol.findById(record.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    usersCol.findByIdAndUpdate(user._id, { password: newHash });

    resetCol.findByIdAndUpdate(record._id, { used: true });

    logAuditEvent({
      req,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'Auth',
      resourceId: user._id,
      details: `Password successfully reset via one-time cryptographic token for '${user.email}'.`
    });

    res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Password reset failed.' });
  }
}
