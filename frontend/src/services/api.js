/**
 * API Service — talks to GAS Web App backend.
 *
 * KEY DESIGN DECISION: ALL requests use GET.
 * GAS web apps return a 302 redirect. Browsers convert POST→GET on redirect,
 * losing the request body. To avoid this, we send everything as GET and
 * pass "write" data as a JSON-stringified `payload` query parameter.
 *
 * The GAS backend parses: e.parameter.action + e.parameter.payload (JSON string)
 */

import dataCache from './dataCache';

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

async function request(action, payload = null) {
  if (!GAS_URL) {
    throw new Error('VITE_GAS_URL is not configured in .env');
  }

  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);

  // For write operations, JSON-stringify the data into a payload param
  if (payload) {
    url.searchParams.set('payload', JSON.stringify(payload));
  }

  const res = await fetch(url.toString(), { redirect: 'follow' });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Unknown API error');
  return json.data;
}

/** Helper: cached GET — returns from cache if available, else fetches and caches */
async function cachedRequest(cacheKey, action, payload = null, ttl = undefined) {
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  const data = await request(action, payload);
  dataCache.set(cacheKey, data, ttl);
  return data;
}

const api = {
  // UI Bootstrap
  getUIBootstrap: () => request('getUIBootstrap'),
  saveUserTheme: (config) => request('saveUserTheme', config),

  // Boot Bundle — single call replaces 6 parallel boot requests
  getBootBundle: () => request('getBootBundle'),

  // Presence
  heartbeat: (mod, page) => request('heartbeat', { module: mod, page }),
  getOnlineUsers: () => request('getOnlineUsers'),

  // Notifications
  getNotifications: (params = {}) => request('getNotifications', Object.keys(params).length ? params : null),
  markNotificationRead: (id) => request('markNotificationRead', { notificationId: id }),
  dismissNotification: (id) => request('dismissNotification', { notificationId: id }),

  // Quick Access
  getUserShortcuts: () => request('getUserShortcuts'),
  addShortcut: (shortcut) => request('addShortcut', { shortcutId: shortcut }),
  removeShortcut: (id) => request('removeShortcut', { shortcutId: id }),

  // Procurement (cached reads)
  getPOList: () => cachedRequest('poList', 'getPOList'),
  getGRNList: () => cachedRequest('grnList', 'getGRNList'),
  savePO: async (data, lines) => {
    const result = await request('savePO', { poData: data, lineItems: lines });
    dataCache.invalidate('poList');
    return result;
  },
  saveGRN: async (data, lines) => {
    const result = await request('saveGRN', { grnData: data, lineItems: lines });
    dataCache.invalidate('grnList');
    return result;
  },
  getOpenPOs: () => request('getOpenPOs'),

  // Master Data (cached reads)
  getItems: () => cachedRequest('items', 'getItems'),
  getSuppliers: () => cachedRequest('suppliers', 'getSuppliers'),
  searchItems: (query) => request('searchItems', { query }),

  // Masters Hub (cached reads, invalidation on write)
  getMasterSheetCounts: () => cachedRequest('masterSheetCounts', 'getMasterSheetCounts'),
  getMasterData: (sheet, file, page = 0, pageSize = 100) => {
    const cacheKey = `masterData_${sheet}_${file}_p${page}`;
    return cachedRequest(cacheKey, 'getMasterData', { sheet, file, page, pageSize });
  },
  saveMasterRecord: async (sheet, file, record, isEdit) => {
    const result = await request('saveMasterRecord', { sheet, file, record, isEdit });
    dataCache.invalidatePrefix(`masterData_${sheet}`);
    dataCache.invalidate('masterSheetCounts');
    return result;
  },
  deleteMasterRecord: async (sheet, file, code) => {
    const result = await request('deleteMasterRecord', { sheet, file, code });
    dataCache.invalidatePrefix(`masterData_${sheet}`);
    dataCache.invalidate('masterSheetCounts');
    return result;
  },

  // Item Categories (cached)
  getItemCategories: (includeInactive) => cachedRequest('itemCategories', 'getAllCategories', { includeInactive }),
  createCategory: async (data) => {
    const result = await request('createCategory', data);
    dataCache.invalidate('itemCategories');
    return result;
  },
  updateCategory: async (updates) => {
    const result = await request('updateCategory', updates);
    dataCache.invalidate('itemCategories');
    return result;
  },

  // Article Dropdowns (cached — rarely changes)
  getArticleDropdowns: () => cachedRequest('articleDropdowns', 'getArticleDropdowns', null, 10 * 60 * 1000),

  // Procurement — PO detail
  getPODetail: (poCode) => request('getPODetail', { poCode }),
  getLineItems: (poCode) => request('getLineItems', { poCode }),
  updatePOStatus: async (poCode, newStatus) => {
    const result = await request('updatePOStatus', { poCode, newStatus });
    dataCache.invalidate('poList');
    return result;
  },

  // Workflow
  getWorkflow: (module) => request('getWorkflow', { module }),

  // Rollups
  getRollups: (parentSheet, parentCode) => request('getRollups', { parentSheet, parentCode }),

  // Embedded Views (Linked DB)
  getEmbeddedViewData: (parentRef, viewId) => request('getEmbeddedViewData', { parentRef, viewId }),

  // Comments
  getComments: (recordType, recordCode) => request('getComments', { recordType, recordCode }),
  addComment: (recordType, recordCode, text) => request('addComment', { recordType, recordCode, text }),

  // Templates
  getTemplates: (module) => request('getTemplates', { module }),

  // Help System
  getHelpContent: (role, module) => request('getHelpContent', { role, module }),
  searchHelp: (query, role) => request('searchHelp', { query, role }),

  // Users & Roles
  getUsers: () => request('getUsers'),
  saveUser: (userData) => request('saveUser', userData),
  updateUser: (userId, userData) => request('updateUser', { userId, ...userData }),
  deleteUser: (userId) => request('deleteUser', { userId }),
  updateUserPermissions: (userId, permissions) => request('updateUserPermissions', { userId, permissions }),

  // Dashboard
  getActivityFeed: () => request('getActivityFeed'),
  getDashboardStats: () => request('getDashboardStats'),

  // Export & Print
  exportDocument: (type, id, format) => request('exportDocument', { documentType: type, documentCode: id, format }),
  printDocument: (type, id) => request('printDocument', { documentType: type, documentCode: id }),

  // Incremental Sync — lightweight check if data changed
  getDataSince: (sheet, version) => request('getDataSince', { sheet, version }),
};

export default api;
