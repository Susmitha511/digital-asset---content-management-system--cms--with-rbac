import { Response } from 'express';
import { dbStore } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { SystemSettings } from '../../types/index.js';

export function getSettings(_req: AuthenticatedRequest, res: Response): void {
  try {
    const settingsCol = dbStore.getCollection<SystemSettings>('system_settings');
    const settings = settingsCol.findOne();

    res.json({
      success: true,
      settings: settings || {
        appName: 'SecureAsset CMS',
        orgName: 'Department of Cyber Security',
        maxUploadSizeMB: 50,
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
        defaultStorageQuotaMB: 100,
        enableRegistration: true,
        enableAuditLog: true,
        maintenanceMode: false
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export function updateSettings(req: AuthenticatedRequest, res: Response): void {
  try {
    const settingsCol = dbStore.getCollection<SystemSettings>('system_settings');
    let settings = settingsCol.findOne();

    const {
      appName,
      orgName,
      maxUploadSizeMB,
      allowedMimeTypes,
      defaultStorageQuotaMB,
      enableRegistration,
      enableAuditLog,
      maintenanceMode
    } = req.body;

    const updates: Partial<SystemSettings> = {
      updatedAt: new Date().toISOString()
    };

    if (appName) updates.appName = appName.trim();
    if (orgName) updates.orgName = orgName.trim();
    if (maxUploadSizeMB !== undefined) updates.maxUploadSizeMB = Number(maxUploadSizeMB);
    if (allowedMimeTypes) updates.allowedMimeTypes = allowedMimeTypes;
    if (defaultStorageQuotaMB !== undefined) updates.defaultStorageQuotaMB = Number(defaultStorageQuotaMB);
    if (enableRegistration !== undefined) updates.enableRegistration = Boolean(enableRegistration);
    if (enableAuditLog !== undefined) updates.enableAuditLog = Boolean(enableAuditLog);
    if (maintenanceMode !== undefined) updates.maintenanceMode = Boolean(maintenanceMode);

    let updated;
    if (settings) {
      updated = settingsCol.findByIdAndUpdate(settings._id, updates);
    } else {
      updated = settingsCol.create(updates as any);
    }

    logAuditEvent({
      req,
      action: 'SYSTEM_SETTINGS_UPDATED',
      resourceType: 'Settings',
      resourceId: updated?._id,
      details: 'Administrator modified system configuration and storage quotas.'
    });

    res.json({ success: true, message: 'Settings saved successfully.', settings: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
