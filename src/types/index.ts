export type UserRole = 'admin' | 'editor' | 'user';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  storageUsed: number; // in bytes
  storageQuota: number; // in bytes (e.g. 100MB or 1GB)
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssetVisibility = 'public' | 'private' | 'restricted' | 'shared';
export type AssetStatus = 'active' | 'archived' | 'deleted';

export interface Asset {
  _id: string;
  originalName: string;
  storedName: string;
  title: string;
  description: string;
  mimeType: string;
  size: number;
  category: string;
  tags: string[];
  ownerId: string;
  ownerName: string;
  visibility: AssetVisibility;
  status: AssetStatus;
  downloadCount: number;
  filePath: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';

export interface Content {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  thumbnailAssetId?: string;
  authorId: string;
  authorName: string;
  status: ContentStatus;
  rejectionReason?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  color?: string;
  assetCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  usageCount: number;
}

export interface Permission {
  id: string;
  name: string;
  category: 'Asset' | 'Content' | 'User' | 'System' | 'Audit';
  description: string;
}

export interface RoleDefinition {
  _id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

export interface AccessRequest {
  _id: string;
  assetId: string;
  assetTitle: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface Share {
  _id: string;
  assetId: string;
  assetTitle: string;
  sharedById: string;
  sharedByName: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  permission: 'view' | 'download' | 'edit';
  expiresAt?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: 'User' | 'Asset' | 'Content' | 'Role' | 'Category' | 'Settings' | 'Auth' | 'AccessRequest';
  resourceId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface SystemSettings {
  _id: string;
  appName: string;
  orgName: string;
  maxUploadSizeMB: number;
  allowedMimeTypes: string[];
  defaultStorageQuotaMB: number;
  enableRegistration: boolean;
  enableAuditLog: boolean;
  maintenanceMode: boolean;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAssets: number;
  totalStorageUsed: number;
  pendingApprovals: number;
  totalContent: number;
  publishedContent: number;
  pendingAccessRequests: number;
  categoryDistribution: { name: string; count: number; size: number }[];
  fileTypeDistribution: { type: string; count: number }[];
  uploadTrends: { date: string; uploads: number }[];
  recentActivity: AuditLog[];
}
