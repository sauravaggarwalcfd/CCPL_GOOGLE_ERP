const BASE_URL = import.meta.env.VITE_GAS_URL || '';

async function request(action, method = 'GET', body = null) {
  const url = new URL(BASE_URL, window.location.origin);
  url.searchParams.set('action', action);

  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (method === 'POST' && body) {
    opts.body = JSON.stringify(body);
  }

  if (method === 'GET' && body) {
    Object.entries(body).forEach(([k, v]) => {
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v);
    });
  }

  const res = await fetch(url.toString(), opts);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Unknown API error');
  return json.data;
}

const api = {
  // UI Bootstrap
  getUIBootstrap: () => request('getUIBootstrap'),
  saveUserTheme: (config) => request('saveUserTheme', 'POST', { args: [config] }),

  // Presence
  heartbeat: (mod, page) => request('heartbeat', 'POST', { args: [mod, page] }),
  getOnlineUsers: () => request('getOnlineUsers'),

  // Notifications
  getNotifications: (params = {}) => request('getNotifications', 'GET', params),
  markNotificationRead: (id) => request('markNotificationRead', 'POST', { args: [id] }),
  dismissNotification: (id) => request('dismissNotification', 'POST', { args: [id] }),

  // Quick Access
  getUserShortcuts: () => request('getUserShortcuts'),
  addShortcut: (shortcut) => request('addShortcut', 'POST', { args: [shortcut] }),
  removeShortcut: (id) => request('removeShortcut', 'POST', { args: [id] }),

  // Procurement
  getPOList: () => request('getPOList'),
  getGRNList: () => request('getGRNList'),
  savePO: (data, lines) => request('savePO', 'POST', { args: [data, lines] }),
  saveGRN: (data, lines) => request('saveGRN', 'POST', { args: [data, lines] }),
  getOpenPOs: () => request('getOpenPOs'),

  // Master Data
  getItems: () => request('getItems'),
  getSuppliers: () => request('getSuppliers'),
  searchItems: (query) => request('searchItems', 'GET', { query }),

  // Dashboard
  getActivityFeed: () => request('getActivityFeed'),
  getDashboardStats: () => request('getDashboardStats'),

  // Export & Print
  exportDocument: (type, id, format) => request('exportDocument', 'POST', { args: [type, id, format] }),
  printDocument: (type, id) => request('printDocument', 'GET', { type, id }),
};

export default api;
