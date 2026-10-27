import {
  User,
  Asset,
  Content,
  Category,
  RoleDefinition,
  Permission,
  AccessRequest,
  Share,
  Notification,
  AuditLog,
  SystemSettings,
  DashboardStats
} from '../types/index.js';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // include HTTP-only cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }) {
    return fetchJson<{ success: boolean; user: User; token: string }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  async register(data: { name: string; email: string; password: string; department?: string }) {
    return fetchJson<{ success: boolean; user: User; token: string }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async logout() {
    return fetchJson<{ success: boolean }>(`${API_BASE}/auth/logout`, {
      method: 'POST'
    });
  },

  async getCurrentUser() {
    return fetchJson<{ success: boolean; user: User }>(`${API_BASE}/auth/me`);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return fetchJson<{ success: boolean; message: string }>(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async forgotPassword(email: string) {
    return fetchJson<{ success: boolean; message: string; demoResetToken?: string }>(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(data: { token: string; newPassword: string }) {
    return fetchJson<{ success: boolean; message: string }>(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Users
  async getUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.role) q.set('role', params.role);
    if (params.status) q.set('status', params.status);
    if (params.page) q.set('page', params.page.toString());
    if (params.limit) q.set('limit', params.limit.toString());
    return fetchJson<{ success: boolean; users: User[]; pagination: any }>(`${API_BASE}/users?${q.toString()}`);
  },

  async createUser(data: { name: string; email: string; password: string; role?: string; department?: string; storageQuotaMB?: number }) {
    return fetchJson<{ success: boolean; user: User }>(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateUserRole(id: string, role: string) {
    return fetchJson<{ success: boolean; user: User }>(`${API_BASE}/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },

  async updateUserStatus(id: string, status: string) {
    return fetchJson<{ success: boolean; user: User }>(`${API_BASE}/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async updateUserDetails(id: string, data: { name?: string; department?: string; storageQuotaMB?: number }) {
    return fetchJson<{ success: boolean; user: User }>(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Assets
  async getAssets(params: { 
    search?: string; 
    category?: string; 
    type?: string; 
    visibility?: string; 
    scope?: string; 
    sortBy?: string; 
    order?: string; 
    page?: number; 
    limit?: number;
    includeDeleted?: boolean;
  } = {}) {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.category) q.set('category', params.category);
    if (params.type) q.set('type', params.type);
    if (params.visibility) q.set('visibility', params.visibility);
    if (params.scope) q.set('scope', params.scope);
    if (params.sortBy) q.set('sortBy', params.sortBy);
    if (params.order) q.set('order', params.order);
    if (params.page) q.set('page', params.page.toString());
    if (params.limit) q.set('limit', params.limit.toString());
    if (params.includeDeleted) q.set('includeDeleted', 'true');
    return fetchJson<{ success: boolean; assets: Asset[]; pagination: any }>(`${API_BASE}/assets?${q.toString()}`);
  },

  async getAssetById(id: string) {
    return fetchJson<{ success: boolean; asset: Asset; permissions: any }>(`${API_BASE}/assets/${id}`);
  },

  async uploadAsset(formData: FormData) {
    return fetchJson<{ success: boolean; asset: Asset }>(`${API_BASE}/assets/upload`, {
      method: 'POST',
      body: formData
    });
  },

  async updateAsset(id: string, data: Partial<Asset>) {
    return fetchJson<{ success: boolean; asset: Asset }>(`${API_BASE}/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAsset(id: string, permanent: boolean = false) {
    return fetchJson<{ success: boolean; message: string }>(`${API_BASE}/assets/${id}?permanent=${permanent}`, {
      method: 'DELETE'
    });
  },

  async restoreAsset(id: string) {
    return fetchJson<{ success: boolean; asset: Asset }>(`${API_BASE}/assets/${id}/restore`, {
      method: 'POST'
    });
  },

  // Content
  async getContent(params: { status?: string; category?: string; search?: string; scope?: string; page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.category) q.set('category', params.category);
    if (params.search) q.set('search', params.search);
    if (params.scope) q.set('scope', params.scope);
    if (params.page) q.set('page', params.page.toString());
    if (params.limit) q.set('limit', params.limit.toString());
    return fetchJson<{ success: boolean; content: Content[]; pagination: any }>(`${API_BASE}/content?${q.toString()}`);
  },

  async getContentById(id: string) {
    return fetchJson<{ success: boolean; content: Content }>(`${API_BASE}/content/${id}`);
  },

  async createContent(data: { title: string; summary: string; body: string; category?: string; tags?: string[]; submitForReview?: boolean }) {
    return fetchJson<{ success: boolean; content: Content }>(`${API_BASE}/content`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateContent(id: string, data: Partial<Content>) {
    return fetchJson<{ success: boolean; content: Content }>(`${API_BASE}/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async reviewContent(id: string, action: 'approve' | 'reject', rejectionReason?: string) {
    return fetchJson<{ success: boolean; content: Content }>(`${API_BASE}/content/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ action, rejectionReason })
    });
  },

  async deleteContent(id: string) {
    return fetchJson<{ success: boolean }>(`${API_BASE}/content/${id}`, {
      method: 'DELETE'
    });
  },

  // Categories
  async getCategories() {
    return fetchJson<{ success: boolean; categories: Category[] }>(`${API_BASE}/categories`);
  },

  async createCategory(data: { name: string; description?: string; color?: string }) {
    return fetchJson<{ success: boolean; category: Category }>(`${API_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateCategory(id: string, data: Partial<Category>) {
    return fetchJson<{ success: boolean; category: Category }>(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteCategory(id: string, reassignTo: string = 'General') {
    return fetchJson<{ success: boolean; message: string }>(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reassignTo })
    });
  },

  // Access Requests & Shares
  async requestAccess(assetId: string, reason: string) {
    return fetchJson<{ success: boolean; request: AccessRequest }>(`${API_BASE}/access-requests`, {
      method: 'POST',
      body: JSON.stringify({ assetId, reason })
    });
  },

  async getAccessRequests(type: 'received' | 'sent' | 'all' = 'received') {
    return fetchJson<{ success: boolean; requests: AccessRequest[] }>(`${API_BASE}/access-requests?type=${type}`);
  },

  async reviewAccessRequest(id: string, action: 'approve' | 'reject', reviewNote?: string) {
    return fetchJson<{ success: boolean; request: AccessRequest }>(`${API_BASE}/access-requests/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ action, reviewNote })
    });
  },

  async shareAsset(data: { assetId: string; recipientEmail: string; permission?: string; expiresAt?: string }) {
    return fetchJson<{ success: boolean; share: Share }>(`${API_BASE}/shares`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getSharedWithMe() {
    return fetchJson<{ success: boolean; shares: (Share & { asset: Asset })[] }>(`${API_BASE}/shares/shared-with-me`);
  },

  async revokeShare(id: string) {
    return fetchJson<{ success: boolean }>(`${API_BASE}/shares/${id}`, {
      method: 'DELETE'
    });
  },

  // Roles & Permissions
  async getRolesAndPermissions() {
    return fetchJson<{ success: boolean; roles: RoleDefinition[]; permissions: Permission[] }>(`${API_BASE}/roles`);
  },

  async updateRolePermissions(id: string, permissions: string[], description?: string) {
    return fetchJson<{ success: boolean; role: RoleDefinition }>(`${API_BASE}/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions, description })
    });
  },

  // Analytics & Dashboard Stats
  async getDashboardStats() {
    return fetchJson<{ success: boolean; stats: DashboardStats & { personalStats?: any } }>(`${API_BASE}/dashboard-stats`);
  },

  // Audit Logs
  async getAuditLogs(params: { 
    search?: string; 
    action?: string; 
    resourceType?: string; 
    actorEmail?: string; 
    startDate?: string; 
    endDate?: string; 
    page?: number; 
    limit?: number;
  } = {}) {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.action) q.set('action', params.action);
    if (params.resourceType) q.set('resourceType', params.resourceType);
    if (params.actorEmail) q.set('actorEmail', params.actorEmail);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    if (params.page) q.set('page', params.page.toString());
    if (params.limit) q.set('limit', params.limit.toString());
    return fetchJson<{ success: boolean; logs: AuditLog[]; pagination: any }>(`${API_BASE}/audit-logs?${q.toString()}`);
  },

  // Notifications
  async getNotifications() {
    return fetchJson<{ success: boolean; notifications: Notification[]; unreadCount: number }>(`${API_BASE}/notifications`);
  },

  async markNotificationRead(id: string) {
    return fetchJson<{ success: boolean }>(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  async markAllNotificationsRead() {
    return fetchJson<{ success: boolean }>(`${API_BASE}/notifications/mark-all-read`, {
      method: 'PUT'
    });
  },

  // Settings
  async getSettings() {
    return fetchJson<{ success: boolean; settings: SystemSettings }>(`${API_BASE}/settings`);
  },

  async updateSettings(data: Partial<SystemSettings>) {
    return fetchJson<{ success: boolean; settings: SystemSettings }>(`${API_BASE}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};
