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

const api = {
  // UI Bootstrap
  getUIBootstrap: () => request('getUIBootstrap'),
  saveUserTheme: (config) => request('saveUserTheme', config),

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

  // Procurement
  getPOList: () => request('getPOList'),
  getGRNList: () => request('getGRNList'),
  savePO: (data, lines) => request('savePO', { poData: data, lineItems: lines }),
  saveGRN: (data, lines) => request('saveGRN', { grnData: data, lineItems: lines }),
  getOpenPOs: () => request('getOpenPOs'),

  // Master Data
  getItems: () => request('getItems'),
  getSuppliers: () => request('getSuppliers'),
  searchItems: (query) => request('searchItems', { query }),

  // Masters Hub
  getMasterSheetCounts: () => request('getMasterSheetCounts'),
  getMasterData: (sheet, file) => request('getMasterData', { sheet, file }),
  saveMasterRecord: (sheet, file, record, isEdit) => request('saveMasterRecord', { sheet, file, record, isEdit }),
  deleteMasterRecord: (sheet, file, code) => request('deleteMasterRecord', { sheet, file, code }),

  // Item Categories
  getItemCategories: (includeInactive) => request('getAllCategories', { includeInactive }),
  createCategory: (data) => request('createCategory', data),
  updateCategory: (catCode, updates) => request('updateCategory', { catCode, ...updates }),

  // Procurement — PO detail
  getPODetail: (poCode) => request('getPODetail', { poCode }),
  getLineItems: (poCode) => request('getLineItems', { poCode }),
  updatePOStatus: (poCode, newStatus) => request('updatePOStatus', { poCode, newStatus }),

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
};

export default api;
