/**
 * Mongoose Schema & Model definitions for MongoDB Atlas / Production deployment
 * Contains schemas, indexes, validation, references, and timestamps.
 */
import mongoose, { Schema } from 'mongoose';

// User Schema
export const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor', 'user'], default: 'user', index: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', index: true },
  department: { type: String, default: 'Engineering' },
  storageUsed: { type: Number, default: 0 },
  storageQuota: { type: Number, default: 104857600 }, // 100MB default
  avatarUrl: { type: String },
  lastLoginAt: { type: Date }
}, { timestamps: true });

// Asset Schema
export const AssetSchema = new Schema({
  originalName: { type: String, required: true },
  storedName: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, default: '' },
  mimeType: { type: String, required: true, index: true },
  size: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  tags: [{ type: String, index: true }],
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ownerName: { type: String, required: true },
  visibility: { type: String, enum: ['public', 'private', 'restricted', 'shared'], default: 'private', index: true },
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active', index: true },
  downloadCount: { type: Number, default: 0 },
  filePath: { type: String, required: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date }
}, { timestamps: true });

AssetSchema.index({ title: 'text', description: 'text', tags: 'text' });
AssetSchema.index({ ownerId: 1, createdAt: -1 });

// Content Schema
export const ContentSchema = new Schema({
  title: { type: String, required: true, trim: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  summary: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, required: true, index: true },
  tags: [{ type: String }],
  thumbnailUrl: { type: String },
  thumbnailAssetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  authorName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'pending_review', 'published', 'rejected', 'archived'], 
    default: 'draft', 
    index: true 
  },
  rejectionReason: { type: String },
  reviewedById: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedByName: { type: String },
  reviewedAt: { type: Date },
  publishedAt: { type: Date }
}, { timestamps: true });

ContentSchema.index({ title: 'text', summary: 'text', body: 'text' });

// Category Schema
export const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#3b82f6' },
  assetCount: { type: Number, default: 0 }
}, { timestamps: true });

// Tag Schema
export const TagSchema = new Schema({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

// Role & Permission Schemas
export const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: { type: String, default: '' },
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

// Access Request Schema
export const AccessRequestSchema = new Schema({
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  assetTitle: { type: String, required: true },
  requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requesterName: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reason: { type: String, required: true },
  reviewedAt: { type: Date },
  reviewNote: { type: String }
}, { timestamps: true });

// Share Schema
export const ShareSchema = new Schema({
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  assetTitle: { type: String, required: true },
  sharedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sharedByName: { type: String, required: true },
  sharedWithUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sharedWithEmail: { type: String, required: true },
  permission: { type: String, enum: ['view', 'download', 'edit'], default: 'view' },
  expiresAt: { type: Date }
}, { timestamps: true });

// Notification Schema
export const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'alert'], default: 'info' },
  link: { type: String },
  isRead: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Audit Log Schema (Immutable Records)
export const AuditLogSchema = new Schema({
  actorId: { type: String, required: true, index: true },
  actorEmail: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true, index: true },
  resourceType: { type: String, required: true, index: true },
  resourceId: { type: String },
  details: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Password Reset Token Schema
export const PasswordResetTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  used: { type: Boolean, default: false }
}, { timestamps: true });

// System Settings Schema
export const SystemSettingsSchema = new Schema({
  appName: { type: String, default: 'SecureCMS' },
  orgName: { type: String, default: 'Department of Cyber Security' },
  maxUploadSizeMB: { type: Number, default: 50 },
  allowedMimeTypes: [{ type: String }],
  defaultStorageQuotaMB: { type: Number, default: 100 },
  enableRegistration: { type: Boolean, default: true },
  enableAuditLog: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });
