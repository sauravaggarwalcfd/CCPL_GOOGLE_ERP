/**
 * ============================================================================
 * API GATEWAY — HTTP Request Router for CC ERP
 * ============================================================================
 * Provides a REST-like API layer on top of the existing GAS functions.
 * Deployed as a Web App, this gateway receives GET/POST requests with an
 * "action" parameter and routes them to the corresponding server-side
 * function, returning JSON responses via ContentService.
 *
 * Usage:
 *   GET  https://<deployment-url>?action=heartbeat&module=procurement&page=po_list
 *   POST https://<deployment-url>  (body: { action: "savePO", payload: {...} })
 *
 * All 22 routes map to functions already defined in Modules 9-14 and
 * supporting helpers. No business logic lives here -- this file is purely
 * a thin routing and serialisation layer.
 *
 * File:    APIGateway.gs  (File 1A — Items Master project)
 * Depends: Config.gs, Module10_Presence.gs, Module11_UIBootstrap.gs,
 *          Module12_Notifications.gs, Module13_QuickAccess.gs,
 *          Module14_ProcurementAPI.gs, Module9_Export.gs, Cache.gs,
 *          Module5_AccessControl.gs
 * ============================================================================
 */


// =============================================================================
// ROUTE MAP
// =============================================================================
// Maps action names (sent by the client) to handler functions.
// Each handler receives a single "params" object and must return a value
// that will be JSON-serialised in the response.
//
// Naming convention: action names use camelCase, matching the existing
// function names wherever possible.
// =============================================================================

var API_ROUTES = {

  // -------------------------------------------------------------------------
  // UI Bootstrap & Preferences
  // -------------------------------------------------------------------------
  'getUIBootstrap':       handleGetUIBootstrap,
  'saveUserTheme':        handleSaveUserTheme,

  // -------------------------------------------------------------------------
  // Presence (real-time user tracking)
  // -------------------------------------------------------------------------
  'heartbeat':            handleHeartbeat,
  'getOnlineUsers':       handleGetOnlineUsers,

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  'getNotifications':     handleGetNotifications,
  'markNotificationRead': handleMarkNotificationRead,
  'dismissNotification':  handleDismissNotification,

  // -------------------------------------------------------------------------
  // Quick Access Shortcuts
  // -------------------------------------------------------------------------
  'addShortcut':          handleAddShortcut,
  'removeShortcut':       handleRemoveShortcut,
  'getUserShortcuts':     handleGetUserShortcuts,

  // -------------------------------------------------------------------------
  // Procurement — PO
  // -------------------------------------------------------------------------
  'getPOList':            handleGetPOList,
  'savePO':               handleSavePO,

  // -------------------------------------------------------------------------
  // Procurement — GRN
  // -------------------------------------------------------------------------
  'getGRNList':           handleGetGRNList,
  'saveGRN':              handleSaveGRN,
  'getOpenPOs':           handleGetOpenPOs,

  // -------------------------------------------------------------------------
  // Master Data Lookups
  // -------------------------------------------------------------------------
  'getItems':             handleGetItems,
  'getSuppliers':         handleGetSuppliers,
  'searchItems':          handleSearchItems,

  // -------------------------------------------------------------------------
  // Dashboard & Activity
  // -------------------------------------------------------------------------
  'getActivityFeed':      handleGetActivityFeed,
  'getDashboardStats':    handleGetDashboardStats,

  // -------------------------------------------------------------------------
  // Export & Print
  // -------------------------------------------------------------------------
  'exportDocument':       handleExportDocument,
  'printDocument':        handlePrintDocument,

  // -------------------------------------------------------------------------
  // Masters Hub (CRUD for all master sheets)
  // -------------------------------------------------------------------------
  'getMasterSheetCounts': handleGetMasterSheetCounts,
  'getMasterData':        handleGetMasterData,
  'saveMasterRecord':     handleSaveMasterRecord,
  'deleteMasterRecord':   handleDeleteMasterRecord,

  // -------------------------------------------------------------------------
  // V7 — Procurement Detail
  // -------------------------------------------------------------------------
  'getPODetail':          handleGetPODetail,
  'getLineItems':         handleGetLineItems,
  'updatePOStatus':       handleUpdatePOStatus,

  // -------------------------------------------------------------------------
  // V7 — Status Workflow Engine (Module 11)
  // -------------------------------------------------------------------------
  'getWorkflow':          handleGetWorkflow,

  // -------------------------------------------------------------------------
  // V7 — Rollup Engine (Module 12)
  // -------------------------------------------------------------------------
  'getRollups':           handleGetRollups,

  // -------------------------------------------------------------------------
  // V7 — Embedded Views Engine (Module 13)
  // -------------------------------------------------------------------------
  'getEmbeddedViewData':  handleGetEmbeddedViewData,

  // -------------------------------------------------------------------------
  // V7 — Comments (Module 14)
  // -------------------------------------------------------------------------
  'getComments':          handleGetComments,
  'addComment':           handleAddComment,

  // -------------------------------------------------------------------------
  // V7 — Templates
  // -------------------------------------------------------------------------
  'getTemplates':         handleGetTemplates,

  // -------------------------------------------------------------------------
  // V7 — Help System (Module 15)
  // -------------------------------------------------------------------------
  'getHelpContent':       handleGetHelpContent,
  'searchHelp':           handleSearchHelp,

  // -------------------------------------------------------------------------
  // Item Categories (dedicated CRUD)
  // -------------------------------------------------------------------------
  'getAllCategories':      handleGetAllCategories,
  'createCategory':       handleCreateCategory,
  'updateCategory':       handleUpdateCategory,

  // -------------------------------------------------------------------------
  // V10 — Article Dropdowns + Live Dropdown Data
  // -------------------------------------------------------------------------
  'getArticleDropdowns':  handleGetArticleDropdowns,

  // -------------------------------------------------------------------------
  // V13 — Performance: Boot Bundle + Incremental Sync
  // -------------------------------------------------------------------------
  'getBootBundle':        handleGetBootBundle,
  'getDataSince':         handleGetDataSince
};


// =============================================================================
// WEB APP ENTRY POINTS — doGet / doPost
// =============================================================================
// These are the standard GAS web-app hooks.  When the deployment URL receives
// a request, Apps Script calls doGet (for GET) or doPost (for POST).
//
// If the request contains an "action" parameter it is treated as an API call
// and routed through handleAPIRequest().  Otherwise doGet falls through to
// serve the HTML UI (defined in Code.gs).
// =============================================================================

/**
 * Handles HTTP GET requests.
 * If an "action" query parameter is present, routes to the API gateway.
 * Otherwise serves the standard web-app HTML page.
 *
 * @param {Object} e - The Apps Script event object
 * @returns {HtmlOutput|TextOutput} HTML page or JSON API response
 */
function doGetAPI(e) {
  // If the request carries an action param, treat it as an API call
  if (e && e.parameter && e.parameter.action) {
    return handleAPIRequest(e, 'GET');
  }

  // No action param — fall through to the normal web-app HTML
  // (doGet in Code.gs handles this; this function is only called when
  //  the deployment is pointed at doGetAPI instead.)
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('CC ERP \u2014 Confidence Clothing')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


/**
 * Handles HTTP POST requests.
 * Always treated as an API call — the action must be in the POST body.
 *
 * @param {Object} e - The Apps Script event object
 * @returns {TextOutput} JSON API response
 */
function doPostAPI(e) {
  return handleAPIRequest(e, 'POST');
}


// =============================================================================
// CORE GATEWAY
// =============================================================================

/**
 * Central API request handler.
 * Parses the incoming request, resolves the correct route handler,
 * invokes it, and wraps the result in a JSON ContentService response.
 *
 * @param {Object} e      - The Apps Script event object (from doGet / doPost)
 * @param {string} method - 'GET' or 'POST'
 * @returns {TextOutput}  JSON response via ContentService
 */
function handleAPIRequest(e, method) {
  var startTime = new Date().getTime();

  try {
    // ------------------------------------------------------------------
    // 1. Extract parameters
    // ------------------------------------------------------------------
    // All requests come as GET (to avoid GAS 302 redirect POST→GET issue).
    // Read params from query string. Write data is in ?payload={json}.
    var params = {};

    if (method === 'GET') {
      params = e.parameter || {};
    } else {
      // POST fallback: read from body or query string
      if (e.postData && e.postData.type === 'application/json') {
        try {
          params = JSON.parse(e.postData.contents);
        } catch (parseErr) {
          return jsonError('Invalid JSON in request body.', 400);
        }
      }
      // Merge query string params (action is always in query string)
      if (e.parameter) {
        for (var qk in e.parameter) {
          if (!params[qk]) params[qk] = e.parameter[qk];
        }
      }
    }

    var action = params.action || '';

    // ------------------------------------------------------------------
    // 2. Parse payload (JSON-stringified write data in GET param)
    // ------------------------------------------------------------------
    if (params.payload) {
      try {
        var payload = JSON.parse(params.payload);
        for (var key in payload) {
          params[key] = payload[key];
        }
      } catch (parseErr) {
        return jsonError('Invalid JSON in payload parameter.', 400);
      }
    }

    // ------------------------------------------------------------------
    // 3. Validate action
    // ------------------------------------------------------------------
    if (!action) {
      return jsonError('Missing required parameter: action', 400);
    }

    var handler = API_ROUTES[action];
    if (!handler) {
      return jsonError('Unknown action: ' + action, 404);
    }

    // ------------------------------------------------------------------
    // 4. Execute handler
    // ------------------------------------------------------------------
    var result = handler(params);

    // ------------------------------------------------------------------
    // 5. Return success response
    // ------------------------------------------------------------------
    var elapsed = new Date().getTime() - startTime;

    return jsonResponse({
      success: true,
      action:  action,
      data:    result,
      meta: {
        timestamp:  new Date().toISOString(),
        durationMs: elapsed
      }
    });

  } catch (err) {
    Logger.log('APIGateway :: handleAPIRequest error: ' + err.message);
    return jsonError('Internal server error: ' + err.message, 500);
  }
}


// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Wraps a data payload in a JSON ContentService TextOutput with CORS headers.
 *
 * @param {Object} data - The object to serialise as JSON
 * @returns {TextOutput} ContentService response with application/json MIME type
 */
function jsonResponse(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}


/**
 * Returns a JSON error response with the given message and HTTP-style code.
 * Note: Apps Script ContentService does not support setting HTTP status codes
 * directly, so the code is included in the JSON body for the client to inspect.
 *
 * @param {string} msg  - Human-readable error message
 * @param {number} code - HTTP-style status code (400, 404, 500, etc.)
 * @returns {TextOutput} ContentService JSON error response
 */
function jsonError(msg, code) {
  var payload = {
    success: false,
    error: {
      message: msg,
      code:    code || 500
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
  var output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}


/**
 * Builds the standard CORS headers object.
 * Apps Script web apps set CORS implicitly, but this helper is provided
 * for documentation and for use in any manual UrlFetchApp-based proxying.
 *
 * @returns {Object} Headers map suitable for CORS pre-flight responses
 */
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400'
  };
}


// =============================================================================
// ROUTE HANDLERS
// =============================================================================
// Each handler extracts the parameters it needs from the "params" object,
// calls the existing GAS function, and returns the result.
// The gateway wraps the return value in the standard JSON envelope.
// =============================================================================


// ---------------------------------------------------------------------------
// UI Bootstrap & Preferences
// ---------------------------------------------------------------------------

/**
 * Returns the full UI bootstrap payload (user info, theme, modules, lookups).
 * Delegates to: getUIBootstrap() in Module11_UIBootstrap.gs
 *
 * @param {Object} params - (no params required)
 * @returns {Object} Bootstrap payload
 */
function handleGetUIBootstrap(params) {
  return getUIBootstrap();
}


/**
 * Saves the user's theme configuration.
 * Delegates to: saveUserTheme() in Module11_UIBootstrap.gs
 *
 * @param {Object} params - { mode: string, accent: string }
 * @returns {Object} { success: boolean }
 */
function handleSaveUserTheme(params) {
  var themeConfig = {
    mode:   params.mode   || 'light',
    accent: params.accent || 'orange'
  };
  return saveUserTheme(themeConfig);
}


// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

/**
 * Records a heartbeat for the current user.
 * Delegates to: heartbeat() in Module10_Presence.gs
 *
 * @param {Object} params - { module: string, page: string }
 * @returns {Object} { success: boolean }
 */
function handleHeartbeat(params) {
  var module = params.module || '';
  var page   = params.page   || '';
  return heartbeat(module, page);
}


/**
 * Returns all currently online users.
 * Delegates to: getOnlineUsers() in Module10_Presence.gs
 *
 * @param {Object} params - (no params required)
 * @returns {Object[]} Array of online user objects
 */
function handleGetOnlineUsers(params) {
  return getOnlineUsers();
}


// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/**
 * Returns notifications for the current user.
 * Delegates to: getNotifications() in Module12_Notifications.gs
 *
 * @param {Object} params - { status: string (optional), limit: number (optional) }
 * @returns {Object[]} Array of notification objects
 */
function handleGetNotifications(params) {
  var opts = {};
  if (params.status) opts.status = params.status;
  if (params.limit)  opts.limit  = parseInt(params.limit, 10) || 50;
  return getNotifications(opts);
}


/**
 * Marks a specific notification as read.
 * Delegates to: markNotificationRead() in Module12_Notifications.gs
 *
 * @param {Object} params - { notificationId: string }
 * @returns {Object} { success: boolean }
 */
function handleMarkNotificationRead(params) {
  var notificationId = params.notificationId || '';
  if (!notificationId) {
    return { success: false, message: 'Missing notificationId parameter.' };
  }
  return markNotificationRead(notificationId);
}


/**
 * Dismisses a specific notification.
 * Delegates to: dismissNotification() in Module12_Notifications.gs
 *
 * @param {Object} params - { notificationId: string }
 * @returns {Object} { success: boolean }
 */
function handleDismissNotification(params) {
  var notificationId = params.notificationId || '';
  if (!notificationId) {
    return { success: false, message: 'Missing notificationId parameter.' };
  }
  return dismissNotification(notificationId);
}


// ---------------------------------------------------------------------------
// Quick Access Shortcuts
// ---------------------------------------------------------------------------

/**
 * Adds a shortcut to the current user's quick-access list.
 * Delegates to: addShortcut() in Module13_QuickAccess.gs
 *
 * @param {Object} params - { shortcutId: string }
 * @returns {Object} { success: boolean, shortcuts: string[] }
 */
function handleAddShortcut(params) {
  var shortcutId = params.shortcutId || '';
  if (!shortcutId) {
    return { success: false, message: 'Missing shortcutId parameter.' };
  }
  return addShortcut(shortcutId);
}


/**
 * Removes a shortcut from the current user's quick-access list.
 * Delegates to: removeShortcut() in Module13_QuickAccess.gs
 *
 * @param {Object} params - { shortcutId: string }
 * @returns {Object} { success: boolean, shortcuts: string[] }
 */
function handleRemoveShortcut(params) {
  var shortcutId = params.shortcutId || '';
  if (!shortcutId) {
    return { success: false, message: 'Missing shortcutId parameter.' };
  }
  return removeShortcut(shortcutId);
}


/**
 * Returns the current user's saved shortcuts.
 * Delegates to: getUserShortcuts() in Module13_QuickAccess.gs
 *
 * @param {Object} params - (no params required)
 * @returns {string[]} Array of shortcut IDs
 */
function handleGetUserShortcuts(params) {
  return getUserShortcuts();
}


// ---------------------------------------------------------------------------
// Procurement — PO
// ---------------------------------------------------------------------------

/**
 * Returns all Purchase Orders for the list view.
 * Delegates to: getPOList() in Module14_ProcurementAPI.gs
 *
 * @param {Object} params - (no params required)
 * @returns {Object[]} Array of PO summary objects
 */
function handleGetPOList(params) {
  return getPOList();
}


/**
 * Saves a Purchase Order (create or update) with its line items.
 * Delegates to: savePO() in Module14_ProcurementAPI.gs
 *
 * Expects POST body:
 *   { action: "savePO", poData: {...}, lineItems: [{...}, ...] }
 *
 * @param {Object} params - { poData: Object, lineItems: Object[] }
 * @returns {Object} { success: boolean, poCode: string, message: string }
 */
function handleSavePO(params) {
  var poData    = params.poData    || {};
  var lineItems = params.lineItems || [];
  return savePO(poData, lineItems);
}


// ---------------------------------------------------------------------------
// Procurement — GRN
// ---------------------------------------------------------------------------

/**
 * Returns all GRNs for the list view.
 * Delegates to: getGRNList() in Module14_ProcurementAPI.gs
 *
 * @param {Object} params - (no params required)
 * @returns {Object[]} Array of GRN summary objects
 */
function handleGetGRNList(params) {
  return getGRNList();
}


/**
 * Saves a GRN (create or update) with its line items.
 * Delegates to: saveGRN() in Module14_ProcurementAPI.gs
 *
 * Expects POST body:
 *   { action: "saveGRN", grnData: {...}, lineItems: [{...}, ...] }
 *
 * @param {Object} params - { grnData: Object, lineItems: Object[] }
 * @returns {Object} { success: boolean, grnCode: string, message: string }
 */
function handleSaveGRN(params) {
  var grnData   = params.grnData   || {};
  var lineItems = params.lineItems || [];
  return saveGRN(grnData, lineItems);
}


/**
 * Returns POs with status "Approved" that are eligible for GRN creation.
 * Filters the full PO list to only include open/approved POs.
 *
 * @param {Object} params - (no params required)
 * @returns {Object[]} Array of open PO objects
 */
function handleGetOpenPOs(params) {
  var allPOs = getPOList();
  var openPOs = [];

  for (var i = 0; i < allPOs.length; i++) {
    var status = String(allPOs[i]['Status'] || '').trim();
    // Include POs that are Approved, Sent, Acknowledged, or Partially Received
    if (status === 'Approved' || status === 'Sent' ||
        status === 'Acknowledged' || status === 'Partially Received') {
      openPOs.push(allPOs[i]);
    }
  }

  return openPOs;
}


// ---------------------------------------------------------------------------
// Master Data Lookups
// ---------------------------------------------------------------------------

/**
 * Returns items master data for a given PO type.
 * Delegates to: getItemsForPOType() in Module14_ProcurementAPI.gs
 *
 * @param {Object} params - { poType: string } e.g. "Fabric", "Trim"
 * @returns {Object[]} Array of { code, name } item objects
 */
function handleGetItems(params) {
  var poType = params.poType || params.type || '';
  if (!poType) {
    // Return all item categories if no type specified
    var allItems = [];
    var types = CONFIG.PO_TYPE_LIST || ['Fabric', 'Trim', 'Packaging'];
    for (var i = 0; i < types.length; i++) {
      var items = getItemsForPOType(types[i]);
      for (var j = 0; j < items.length; j++) {
        items[j].poType = types[i];
        allItems.push(items[j]);
      }
    }
    return allItems;
  }
  return getItemsForPOType(poType);
}


/**
 * Returns the supplier list from FILE 1C.
 * Uses the cached supplier data from the bootstrap lookup helpers.
 *
 * @param {Object} params - (no params required)
 * @returns {Object[]} Array of { code, name } supplier objects
 */
function handleGetSuppliers(params) {
  // _getSupplierList is defined in Module11_UIBootstrap.gs
  return _getSupplierList();
}


/**
 * Searches items across all master sheets by a query string.
 * Performs a case-insensitive partial match on item code and name.
 *
 * @param {Object} params - { query: string, poType: string (optional), limit: number (optional) }
 * @returns {Object[]} Array of matching { code, name, poType } objects
 */
function handleSearchItems(params) {
  var query = String(params.query || '').trim().toLowerCase();
  var poType = params.poType || '';
  var limit = parseInt(params.limit, 10) || 50;

  if (!query) {
    return [];
  }

  var results = [];
  var typesToSearch = poType ? [poType] : (CONFIG.PO_TYPE_LIST || ['Fabric', 'Trim', 'Yarn', 'Woven', 'Consumable', 'Packaging']);

  for (var t = 0; t < typesToSearch.length; t++) {
    var items = getItemsForPOType(typesToSearch[t]);
    for (var i = 0; i < items.length && results.length < limit; i++) {
      var code = String(items[i].code || '').toLowerCase();
      var name = String(items[i].name || '').toLowerCase();
      if (code.indexOf(query) !== -1 || name.indexOf(query) !== -1) {
        results.push({
          code:   items[i].code,
          name:   items[i].name,
          poType: typesToSearch[t]
        });
      }
    }
    if (results.length >= limit) break;
  }

  return results;
}


// ---------------------------------------------------------------------------
// Dashboard & Activity
// ---------------------------------------------------------------------------

/**
 * Returns a feed of recent activity (last N changes from the change log).
 * Reads from ITEM_CHANGE_LOG in File 1A.
 *
 * @param {Object} params - { limit: number (optional, default 20) }
 * @returns {Object[]} Array of recent activity objects
 */
function handleGetActivityFeed(params) {
  var limit = parseInt(params.limit, 10) || 20;

  try {
    // Use 3-layer cache instead of raw sheet read
    var allData = getCachedData(CONFIG.SHEETS.ITEM_CHANGE_LOG);
    if (!allData || !allData.length) return [];

    // Return last N entries in reverse (newest first)
    var start = Math.max(0, allData.length - limit);
    var feed = [];
    for (var i = allData.length - 1; i >= start && feed.length < limit; i--) {
      feed.push(allData[i]);
    }
    return feed;

  } catch (err) {
    Logger.log('APIGateway :: handleGetActivityFeed error: ' + err.message);
    return [];
  }
}


/**
 * Returns summary statistics for the dashboard.
 * Aggregates counts from PO_MASTER, GRN_MASTER, and notification data.
 *
 * @param {Object} params - (no params required)
 * @returns {Object} Dashboard statistics object
 */
function handleGetDashboardStats(params) {
  try {
    var stats = {
      po:            { total: 0, draft: 0, approved: 0, sent: 0, partiallyReceived: 0, fullyReceived: 0, cancelled: 0 },
      grn:           { total: 0, pending: 0, accepted: 0, partial: 0, rejected: 0 },
      notifications: { total: 0, unread: 0 },
      onlineUsers:   0
    };

    // PO statistics
    try {
      var poList = getPOList();
      stats.po.total = poList.length;
      for (var i = 0; i < poList.length; i++) {
        var poStatus = String(poList[i]['Status'] || '').trim();
        switch (poStatus) {
          case 'Draft':              stats.po.draft++; break;
          case 'Approved':           stats.po.approved++; break;
          case 'Sent':               stats.po.sent++; break;
          case 'Partially Received': stats.po.partiallyReceived++; break;
          case 'Fully Received':     stats.po.fullyReceived++; break;
          case 'Cancelled':          stats.po.cancelled++; break;
        }
      }
    } catch (poErr) {
      Logger.log('APIGateway :: getDashboardStats PO error: ' + poErr.message);
    }

    // GRN statistics
    try {
      var grnList = getGRNList();
      stats.grn.total = grnList.length;
      for (var j = 0; j < grnList.length; j++) {
        var grnStatus = String(grnList[j]['Status'] || '').trim();
        switch (grnStatus) {
          case 'Pending':  stats.grn.pending++; break;
          case 'Accepted': stats.grn.accepted++; break;
          case 'Partial':  stats.grn.partial++; break;
          case 'Rejected': stats.grn.rejected++; break;
        }
      }
    } catch (grnErr) {
      Logger.log('APIGateway :: getDashboardStats GRN error: ' + grnErr.message);
    }

    // Notification counts
    try {
      var allNotifs = getNotifications({ limit: 999 });
      stats.notifications.total = allNotifs.length;
      for (var k = 0; k < allNotifs.length; k++) {
        if (allNotifs[k].status === 'Unread') {
          stats.notifications.unread++;
        }
      }
    } catch (notifErr) {
      Logger.log('APIGateway :: getDashboardStats notification error: ' + notifErr.message);
    }

    // Online users count
    try {
      var online = getOnlineUsers();
      stats.onlineUsers = online.length;
    } catch (presenceErr) {
      Logger.log('APIGateway :: getDashboardStats presence error: ' + presenceErr.message);
    }

    return stats;

  } catch (err) {
    Logger.log('APIGateway :: handleGetDashboardStats error: ' + err.message);
    return {};
  }
}


// ---------------------------------------------------------------------------
// Export & Print
// ---------------------------------------------------------------------------

/**
 * Exports a PO or GRN document to the requested format.
 * Delegates to: exportPOToPDF(), exportPOToSheets(), exportPOToExcel()
 *               in Module9_Export.gs
 *
 * @param {Object} params - { documentType: "PO"|"GRN", documentCode: string, format: "pdf"|"sheets"|"excel" }
 * @returns {Object} { success: boolean, url: string, message: string }
 */
function handleExportDocument(params) {
  var docType = String(params.documentType || params.docType || 'PO').toUpperCase();
  var docCode = params.documentCode || params.code || '';
  var format  = String(params.format || 'pdf').toLowerCase();

  if (!docCode) {
    return { success: false, url: '', message: 'Missing documentCode parameter.' };
  }

  // Currently the export module supports PO exports.
  // GRN export can be added following the same pattern.
  if (docType === 'PO') {
    switch (format) {
      case 'pdf':
        return exportPOToPDF(docCode);
      case 'sheets':
        return exportPOToSheets(docCode);
      case 'excel':
        return exportPOToExcel(docCode);
      default:
        return { success: false, url: '', message: 'Unsupported format: ' + format + '. Use pdf, sheets, or excel.' };
    }
  }

  if (docType === 'GRN') {
    // GRN export follows the same pattern as PO export.
    // For now, return a helpful message until GRN-specific export is built.
    return { success: false, url: '', message: 'GRN export is not yet implemented. Use PO export as reference.' };
  }

  return { success: false, url: '', message: 'Unknown document type: ' + docType + '. Use PO or GRN.' };
}


/**
 * Generates a print-friendly HTML view of a PO or GRN.
 * Returns structured data that the client can render in a print dialog.
 *
 * @param {Object} params - { documentType: "PO"|"GRN", documentCode: string }
 * @returns {Object} Document data suitable for client-side print rendering
 */
function handlePrintDocument(params) {
  var docType = String(params.documentType || params.docType || 'PO').toUpperCase();
  var docCode = params.documentCode || params.code || '';

  if (!docCode) {
    return { success: false, message: 'Missing documentCode parameter.' };
  }

  try {
    if (docType === 'PO') {
      var poDetail = getPODetail(docCode);
      if (!poDetail.po) {
        return { success: false, message: 'PO ' + docCode + ' not found.' };
      }

      return {
        success:      true,
        documentType: 'PO',
        documentCode: docCode,
        header:       poDetail.po,
        lines:        poDetail.lines,
        company: {
          name:    CONFIG.SYSTEM.COMPANY_NAME,
          appName: CONFIG.SYSTEM.APP_NAME
        },
        printedAt:    new Date().toISOString(),
        printedBy:    Session.getActiveUser().getEmail()
      };
    }

    if (docType === 'GRN') {
      var grnDetail = getGRNDetail(docCode);
      if (!grnDetail.grn) {
        return { success: false, message: 'GRN ' + docCode + ' not found.' };
      }

      return {
        success:      true,
        documentType: 'GRN',
        documentCode: docCode,
        header:       grnDetail.grn,
        lines:        grnDetail.lines,
        company: {
          name:    CONFIG.SYSTEM.COMPANY_NAME,
          appName: CONFIG.SYSTEM.APP_NAME
        },
        printedAt:    new Date().toISOString(),
        printedBy:    Session.getActiveUser().getEmail()
      };
    }

    return { success: false, message: 'Unknown document type: ' + docType };

  } catch (err) {
    Logger.log('APIGateway :: handlePrintDocument error: ' + err.message);
    return { success: false, message: 'Error generating print view: ' + err.message };
  }
}


// =============================================================================
// MASTERS HUB — CRUD for all master sheets
// =============================================================================
// Maps sheet keys to actual Google Sheet names.
// Adjust these to match your real sheet tab names.
// =============================================================================

var MASTER_SHEET_MAP = {
  // FILE 1A — Items (tab names from CONFIG.SHEETS)
  'article_master':      { sheet: 'ARTICLE_MASTER',      file: '1A' },
  'rm_fabric':           { sheet: 'RM_MASTER_FABRIC',    file: '1A' },
  'rm_yarn':             { sheet: 'RM_MASTER_YARN',      file: '1A' },
  'rm_woven':            { sheet: 'RM_MASTER_WOVEN',     file: '1A' },
  'trim_master':         { sheet: 'TRIM_MASTER',         file: '1A' },
  'consumable_master':   { sheet: 'CONSUMABLE_MASTER',   file: '1A' },
  'packaging_master':    { sheet: 'PACKAGING_MASTER',    file: '1A' },
  'color_master':        { sheet: 'COLOR_MASTER',        file: '1A' },
  'hsn_master':          { sheet: 'HSN_MASTER',          file: '1A' },
  'uom_master':          { sheet: 'UOM_MASTER',          file: '1A' },
  'size_master':         { sheet: 'SIZE_MASTER',         file: '1A' },
  'fabric_type_master':  { sheet: 'FABRIC_TYPE_MASTER',  file: '1A' },
  'tag_master':          { sheet: 'TAG_MASTER',          file: '1A' },
  'item_categories':     { sheet: 'ITEM_CATEGORIES',     file: '1A' },
  'trim_attr_names':     { sheet: 'TRIM_ATTR_NAMES',     file: '1A' },
  'trim_attr_values':    { sheet: 'TRIM_ATTR_VALUES',    file: '1A' },
  'con_attr_names':      { sheet: 'CON_ATTR_NAMES',      file: '1A' },
  'con_attr_values':     { sheet: 'CON_ATTR_VALUES',     file: '1A' },
  'pkg_attr_names':      { sheet: 'PKG_ATTR_NAMES',      file: '1A' },
  'pkg_attr_values':     { sheet: 'PKG_ATTR_VALUES',     file: '1A' },
  'item_change_log':     { sheet: 'ITEM_CHANGE_LOG',     file: '1A' },
  'master_relations':    { sheet: 'MASTER_RELATIONS',    file: '1A' },

  // FILE 1B — Factory (tab names from CONFIG.SHEETS_1B)
  'user_master':          { sheet: 'USER_MASTER',          file: '1B' },
  'role_master':          { sheet: 'ROLE_MASTER',          file: '1B' },
  'department_master':    { sheet: 'DEPARTMENT_MASTER',    file: '1B' },
  'designation_master':   { sheet: 'DESIGNATION_MASTER',   file: '1B' },
  'shift_master':         { sheet: 'SHIFT_MASTER',         file: '1B' },
  'machine_master':       { sheet: 'MACHINE_MASTER',       file: '1B' },
  'machine_category':     { sheet: 'MACHINE_CATEGORY',     file: '1B' },
  'supplier_master_1b':   { sheet: 'CUSTOMER_MASTER',      file: '1B' },
  'customer_master':      { sheet: 'CUSTOMER_MASTER',      file: '1B' },
  'item_supplier_rates':  { sheet: 'ITEM_SUPPLIER_RATES',  file: '1B' },
  'warehouse_master':     { sheet: 'WAREHOUSE_MASTER',     file: '1B' },
  'storage_bin_master':   { sheet: 'STORAGE_BIN_MASTER',   file: '1B' },
  'factory_master':       { sheet: 'FACTORY_MASTER',       file: '1B' },
  'contractor_master':    { sheet: 'CONTRACTOR_MASTER',    file: '1B' },
  'process_master':       { sheet: 'PROCESS_MASTER',       file: '1B' },
  'asset_master':         { sheet: 'ASSET_MASTER',         file: '1B' },
  'maintenance_schedule': { sheet: 'MAINTENANCE_SCHEDULE', file: '1B' },
  'spare_parts_master':   { sheet: 'SPARE_PARTS_MASTER',   file: '1B' },
  'work_center_master':   { sheet: 'WORK_CENTER_MASTER',   file: '1B' },
  'jobwork_party_master': { sheet: 'JOBWORK_PARTY_MASTER', file: '1B' },
  'presence':             { sheet: 'PRESENCE',             file: '1B' },
  'notifications':        { sheet: 'NOTIFICATIONS',        file: '1B' },
  'role_permissions':     { sheet: 'ROLE_PERMISSIONS',     file: '1B' },
  'notification_templates': { sheet: 'NOTIFICATION_TEMPLATES', file: '1B' },

  // FILE 1C — Finance (tab names from CONFIG.SHEETS_1C)
  'supplier_master_1c':  { sheet: 'SUPPLIER_MASTER',       file: '1C' },
  'payment_terms':       { sheet: 'PAYMENT_TERMS_MASTER',  file: '1C' },
  'tax_master':          { sheet: 'TAX_MASTER',            file: '1C' },
  'bank_master':         { sheet: 'BANK_MASTER',           file: '1C' },
  'cost_center':         { sheet: 'COST_CENTER_MASTER',    file: '1C' },
  'account_master':      { sheet: 'ACCOUNT_MASTER',        file: '1C' }
};


/**
 * Returns an object mapping each sheet key to its record count.
 * Example: { "article_master": 24, "rm_fabric": 18, ... }
 */
function handleGetMasterSheetCounts(params) {
  // Check CacheService first (5-min TTL)
  var cache = CacheService.getScriptCache();
  var cacheKey = 'API_MASTER_SHEET_COUNTS';
  var cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }

  var result = {};
  var ssCache = {};

  for (var key in MASTER_SHEET_MAP) {
    try {
      var info  = MASTER_SHEET_MAP[key];
      var ssId  = getMasterFileId_(info.file);
      if (!ssId) { result[key] = 0; continue; }

      if (!ssCache[ssId]) ssCache[ssId] = SpreadsheetApp.openById(ssId);
      var sh = ssCache[ssId].getSheetByName(info.sheet);
      // Row 1=title, Row 2=headers, Row 3=descriptions → data starts at row 4
      result[key] = sh ? Math.max(0, sh.getLastRow() - 3) : 0;
    } catch (e) {
      result[key] = 0;
    }
  }

  // Cache for 5 minutes (300 seconds)
  try { cache.put(cacheKey, JSON.stringify(result), 300); } catch(e) {}
  return result;
}


/**
 * Returns all rows from a master sheet as an array of objects.
 * Sheet structure: Row 1=title, Row 2=column headers, Row 3=descriptions, Row 4+=data.
 * Keys are the RAW header strings from row 2 (frontend maps them via schema).
 */
function handleGetMasterData(params) {
  var sheetKey = params.sheet || '';
  var page     = parseInt(params.page, 10) || 0;   // 0 = no pagination (return all)
  var pageSize = parseInt(params.pageSize, 10) || 100;
  var info = MASTER_SHEET_MAP[sheetKey];
  if (!info) return page ? { rows: [], total: 0, page: 1, totalPages: 0 } : [];

  var ssId = getMasterFileId_(info.file);
  if (!ssId) return page ? { rows: [], total: 0, page: 1, totalPages: 0 } : [];

  // Use 3-layer cache instead of raw sheet read
  var cached = getCachedData(info.sheet, info.file !== '1A' ? ssId : undefined);
  if (!cached || !cached.length) return page ? { rows: [], total: 0, page: 1, totalPages: 0 } : [];

  // Format dates in cached data
  var rows = [];
  for (var i = 0; i < cached.length; i++) {
    var row = {};
    var hasContent = false;
    for (var key in cached[i]) {
      var val = cached[i][key];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd MMM yyyy');
      }
      row[key] = val;
      if (val !== '' && val !== null && val !== undefined) hasContent = true;
    }
    if (hasContent) rows.push(row);
  }

  // If page=0, return all rows (backwards-compatible)
  if (!page) return rows;

  // Paginated response
  var total = rows.length;
  var start = (page - 1) * pageSize;
  var slice = rows.slice(start, start + pageSize);
  return {
    rows:       slice,
    total:      total,
    page:       page,
    pageSize:   pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}


/**
 * Saves (creates or updates) a record in a master sheet.
 * Sheet structure: Row 1=title, Row 2=headers, Row 3=descriptions, Row 4+=data.
 * Record keys are RAW header strings (matching row 2 headers exactly).
 * If params.isEdit is true, updates the row where column A matches the first header's value.
 */
function handleSaveMasterRecord(params) {
  var sheetKey = params.sheet || '';
  var record   = params.record || {};
  var isEdit   = params.isEdit || false;
  var info     = MASTER_SHEET_MAP[sheetKey];
  if (!info) return { saved: false, message: 'Unknown sheet: ' + sheetKey };

  var ssId = getMasterFileId_(info.file);
  if (!ssId) return { saved: false, message: 'File not found for: ' + info.file };

  var ss = SpreadsheetApp.openById(ssId);
  var sh = ss.getSheetByName(info.sheet);
  if (!sh) return { saved: false, message: 'Sheet not found: ' + info.sheet };

  var lastCol = sh.getLastColumn();
  // Row 2 = column headers
  var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0]
    .map(function(h) { return String(h).trim(); });

  // The code/ID column is the first header
  var codeHeader = headers[0];
  var codeValue  = record[codeHeader] || '';

  if (isEdit && codeValue) {
    // Search data rows (row 4+) for matching code in column A
    var lastRow = sh.getLastRow();
    var numDataRows = Math.max(1, lastRow - 3);
    var codes = sh.getRange(4, 1, numDataRows, 1).getValues();
    for (var i = 0; i < codes.length; i++) {
      if (String(codes[i][0]).trim() === String(codeValue).trim()) {
        var rowNum = i + 4;  // offset: data starts at row 4
        var rowData = headers.map(function(h) {
          return record[h] !== undefined ? record[h] : '';
        });
        sh.getRange(rowNum, 1, 1, rowData.length).setValues([rowData]);
        invalidateCache(info.sheet);
        return { saved: true, code: codeValue, action: 'updated' };
      }
    }
    return { saved: false, message: 'Record not found: ' + codeValue };
  } else {
    // Append new row
    var newRow = headers.map(function(h) {
      return record[h] !== undefined ? record[h] : '';
    });
    sh.appendRow(newRow);
    invalidateCache(info.sheet);
    return { saved: true, action: 'created' };
  }
}


/**
 * Deletes a record from a master sheet by code (column A match).
 * Data rows start at row 4 (row 1=title, row 2=headers, row 3=descriptions).
 */
function handleDeleteMasterRecord(params) {
  var sheetKey = params.sheet || '';
  var code     = params.code  || '';
  var info     = MASTER_SHEET_MAP[sheetKey];
  if (!info) return { deleted: false, message: 'Unknown sheet: ' + sheetKey };

  var ssId = getMasterFileId_(info.file);
  if (!ssId) return { deleted: false, message: 'File not found.' };

  var ss = SpreadsheetApp.openById(ssId);
  var sh = ss.getSheetByName(info.sheet);
  if (!sh) return { deleted: false, message: 'Sheet not found.' };

  var lastRow = sh.getLastRow();
  var numDataRows = Math.max(1, lastRow - 3);
  var codes = sh.getRange(4, 1, numDataRows, 1).getValues();
  for (var i = 0; i < codes.length; i++) {
    if (String(codes[i][0]).trim() === String(code).trim()) {
      sh.deleteRow(i + 4);  // offset: data starts at row 4
      invalidateCache(info.sheet);
      return { deleted: true, code: code };
    }
  }
  return { deleted: false, message: 'Record not found: ' + code };
}


// ── Helper: Get spreadsheet ID for each file ──
// These should match your actual Google Sheets file IDs.
// You can set them in CONFIG or PropertiesService.
function getMasterFileId_(fileCode) {
  // Try CONFIG first (if defined in Config.gs)
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG.FILE_IDS) {
      if (fileCode === '1A' && CONFIG.FILE_IDS.FILE_1A) return CONFIG.FILE_IDS.FILE_1A;
      if (fileCode === '1B' && CONFIG.FILE_IDS.FILE_1B) return CONFIG.FILE_IDS.FILE_1B;
      if (fileCode === '1C' && CONFIG.FILE_IDS.FILE_1C) return CONFIG.FILE_IDS.FILE_1C;
    }
  } catch (e) {}

  // Fallback: try PropertiesService
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty('FILE_' + fileCode + '_ID') || '';
  } catch (e) {}

  // Last resort: if this IS file 1A, use active spreadsheet
  if (fileCode === '1A') {
    try { return SpreadsheetApp.getActiveSpreadsheet().getId(); } catch (e) {}
  }
  return '';
}


// =============================================================================
// V7 — PROCUREMENT DETAIL HANDLERS
// =============================================================================

/**
 * Returns PO header detail by PO code.
 * Reads PO_MASTER sheet in FILE 2.
 */
function handleGetPODetail(params) {
  var poCode = params.poCode || '';
  if (!poCode) return null;
  try {
    var ssId = getFile2Id_();
    if (!ssId) return null;

    // Use 3-layer cache instead of raw sheet read
    var allPOs = getCachedData('PO_MASTER', ssId);
    if (!allPOs || !allPOs.length) return null;

    // Find the matching PO by code (first column key)
    var codeKey = Object.keys(allPOs[0])[0]; // first header = PO code column
    for (var i = 0; i < allPOs.length; i++) {
      if (String(allPOs[i][codeKey] || '').trim() === poCode) {
        return allPOs[i];
      }
    }
    return null;
  } catch (e) {
    Logger.log('handleGetPODetail error: ' + e.message);
    return null;
  }
}


/**
 * Returns line items for a given PO code.
 * Reads PO_LINE_ITEMS sheet in FILE 2.
 */
function handleGetLineItems(params) {
  var poCode = params.poCode || '';
  if (!poCode) return [];
  try {
    var ssId = getFile2Id_();
    if (!ssId) return [];

    // Use 3-layer cache instead of raw sheet read
    var allLines = getCachedData('PO_LINE_ITEMS', ssId);
    if (!allLines || !allLines.length) return [];

    // Find PO Code column header
    var headers = Object.keys(allLines[0]);
    var poColKey = '';
    for (var h = 0; h < headers.length; h++) {
      if (headers[h].indexOf('PO Code') > -1 || headers[h].indexOf('PO_Code') > -1) {
        poColKey = headers[h];
        break;
      }
    }
    if (!poColKey) poColKey = headers[1] || headers[0]; // fallback: second or first header

    // Filter line items by PO code
    var results = [];
    for (var i = 0; i < allLines.length; i++) {
      if (String(allLines[i][poColKey] || '').trim() === poCode) {
        results.push(allLines[i]);
      }
    }
    return results;
  } catch (e) {
    Logger.log('handleGetLineItems error: ' + e.message);
    return [];
  }
}


/**
 * Updates PO status with workflow validation.
 */
function handleUpdatePOStatus(params) {
  var poCode = params.poCode || '';
  var newStatus = params.newStatus || '';
  if (!poCode || !newStatus) return { success: false, message: 'Missing poCode or newStatus' };
  try {
    var ssId = getFile2Id_();
    if (!ssId) return { success: false, message: 'FILE 2 not found' };
    var ss = SpreadsheetApp.openById(ssId);
    var sh = ss.getSheetByName('PO_MASTER');
    if (!sh) return { success: false, message: 'PO_MASTER sheet not found' };
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    // Find Status column
    var statusCol = -1;
    for (var h = 0; h < headers.length; h++) {
      if (headers[h].indexOf('Status') > -1) { statusCol = h; break; }
    }
    if (statusCol < 0) return { success: false, message: 'Status column not found' };
    var data = sh.getRange(4, 1, lastRow - 3, lastCol).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === poCode) {
        sh.getRange(i + 4, statusCol + 1).setValue(newStatus);
        return { success: true, poCode: poCode, newStatus: newStatus };
      }
    }
    return { success: false, message: 'PO not found: ' + poCode };
  } catch (e) {
    Logger.log('handleUpdatePOStatus error: ' + e.message);
    return { success: false, message: e.message };
  }
}


// =============================================================================
// V7 — STATUS WORKFLOW ENGINE (Module 11)
// =============================================================================

/**
 * Returns workflow statuses for a module.
 * Reads STATUS_WORKFLOW sheet in FILE 1A.
 */
function handleGetWorkflow(params) {
  var module = params.module || 'Procurement-PO';
  try {
    var ssId = getMasterFileId_('1A');
    if (!ssId) return [];
    var ss = SpreadsheetApp.openById(ssId);
    var sh = ss.getSheetByName('STATUS_WORKFLOW');
    if (!sh) return [];
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 4) return [];
    var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var data = sh.getRange(4, 1, lastRow - 3, lastCol).getValues();
    var results = [];
    for (var i = 0; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        if (headers[j]) row[headers[j]] = data[i][j];
      }
      // Filter by module if column exists
      var modCol = row['Module'] || row['module'] || '';
      if (modCol && modCol !== module) continue;
      // Filter Active=Yes
      var active = row['Active'] || row['active'] || 'Yes';
      if (String(active).toLowerCase() === 'no') continue;
      results.push(row);
    }
    return results;
  } catch (e) {
    Logger.log('handleGetWorkflow error: ' + e.message);
    return [];
  }
}


// =============================================================================
// V7 — ROLLUP ENGINE (Module 12)
// =============================================================================

/**
 * Computes rollup values for a parent record.
 * Reads ROLLUP_CONFIG in FILE 1A, then aggregates from child sheets.
 */
function handleGetRollups(params) {
  var parentSheet = params.parentSheet || '';
  var parentCode = params.parentCode || '';
  if (!parentSheet || !parentCode) return [];
  try {
    var ssId = getMasterFileId_('1A');
    if (!ssId) return [];
    var ss = SpreadsheetApp.openById(ssId);
    var sh = ss.getSheetByName('ROLLUP_CONFIG');
    if (!sh) return [];
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 4) return [];
    var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var data = sh.getRange(4, 1, lastRow - 3, lastCol).getValues();
    var configs = [];
    for (var i = 0; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        if (headers[j]) row[headers[j]] = data[i][j];
      }
      var parent = row['Parent Sheet'] || row['parent_sheet'] || '';
      if (parent === parentSheet) configs.push(row);
    }
    // For each config, compute the aggregate (simplified — real impl reads child data)
    return configs.map(function(cfg) {
      return {
        label: cfg['Display Label'] || cfg['Label'] || 'Rollup',
        value: '—',
        func: cfg['Function'] || 'COUNT',
        format: cfg['Format'] || '',
        sourceSheet: cfg['Source Sheet'] || ''
      };
    });
  } catch (e) {
    Logger.log('handleGetRollups error: ' + e.message);
    return [];
  }
}


// =============================================================================
// V7 — EMBEDDED VIEWS ENGINE (Module 13)
// =============================================================================

/**
 * Returns child data for an embedded/linked view.
 * Reads EMBEDDED_VIEWS config in FILE 1A, then fetches filtered data.
 */
function handleGetEmbeddedViewData(params) {
  var parentRef = params.parentRef || '';
  var viewId = params.viewId || '';
  if (!viewId) return { columns: [], rows: [] };
  try {
    var ssId = getMasterFileId_('1A');
    if (!ssId) return { columns: [], rows: [] };
    var ss = SpreadsheetApp.openById(ssId);
    var sh = ss.getSheetByName('EMBEDDED_VIEWS');
    if (!sh) return { columns: [], rows: [] };
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 4) return { columns: [], rows: [] };
    var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var data = sh.getRange(4, 1, lastRow - 3, lastCol).getValues();
    // Find the view config
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === viewId) {
        var row = {};
        for (var j = 0; j < headers.length; j++) {
          if (headers[j]) row[headers[j]] = data[i][j];
        }
        var displayCols = String(row['Display Columns'] || '').split(',').map(function(c) { return c.trim(); }).filter(Boolean);
        return { columns: displayCols, rows: [], config: row };
      }
    }
    return { columns: [], rows: [] };
  } catch (e) {
    Logger.log('handleGetEmbeddedViewData error: ' + e.message);
    return { columns: [], rows: [] };
  }
}


// =============================================================================
// V7 — COMMENTS (Module 14)
// =============================================================================

/**
 * Returns comments for a record.
 * Reads RECORD_COMMENTS sheet in FILE 2.
 */
function handleGetComments(params) {
  var recordType = params.recordType || '';
  var recordCode = params.recordCode || '';
  if (!recordCode) return [];
  try {
    var ssId = getFile2Id_();
    if (!ssId) return [];
    var ss = SpreadsheetApp.openById(ssId);
    var sh = ss.getSheetByName('RECORD_COMMENTS');
    if (!sh) return [];
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 4) return [];
    var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var data = sh.getRange(4, 1, lastRow - 3, lastCol).getValues();
    var results = [];
    for (var i = 0; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        if (headers[j]) row[headers[j]] = data[i][j];
      }
      // Match by record code column
      var code = row['Record Code'] || row['record_code'] || '';
      if (String(code).trim() === recordCode) {
        results.push({
          id: row['Comment ID'] || row['comment_id'] || '',
          author: row['Author'] || row['author'] || '',
          text: row['Comment'] || row['Text'] || row['text'] || '',
          time: row['Timestamp'] || row['timestamp'] || '',
          parentId: row['Parent Comment ID'] || ''
        });
      }
    }
    return results;
  } catch (e) {
    Logger.log('handleGetComments error: ' + e.message);
    return [];
  }
}


/**
 * Adds a comment to RECORD_COMMENTS sheet in FILE 2.
 */
function handleAddComment(params) {
  var recordType = params.recordType || 'PO';
  var recordCode = params.recordCode || '';
  var text = params.text || '';
  if (!recordCode || !text) return { success: false, message: 'Missing recordCode or text' };
  try {
    var ssId = getFile2Id_();
    if (!ssId) return { success: false, message: 'FILE 2 not found' };
    var ss = SpreadsheetApp.openById(ssId);
    var sh = ss.getSheetByName('RECORD_COMMENTS');
    if (!sh) return { success: false, message: 'RECORD_COMMENTS not found' };
    var lastRow = sh.getLastRow();
    var seq = Math.max(1, lastRow - 3 + 1);
    var commentId = 'CMT-' + String(seq).padStart(5, '0');
    var email = Session.getActiveUser().getEmail();
    var now = new Date();
    sh.appendRow([commentId, recordType, recordCode, text, email, '', now, '', '', 'Yes']);
    return { success: true, commentId: commentId };
  } catch (e) {
    Logger.log('handleAddComment error: ' + e.message);
    return { success: false, message: e.message };
  }
}


// =============================================================================
// V7 — TEMPLATES
// =============================================================================

/**
 * Returns templates for a module.
 * Reads TEMPLATES sheet in FILE 2.
 */
function handleGetTemplates(params) {
  var module = params.module || 'PO';
  try {
    var ssId = getFile2Id_();
    if (!ssId) return [];
    var ss = SpreadsheetApp.openById(ssId);
    var sh = ss.getSheetByName('TEMPLATES');
    if (!sh) return [];
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 4) return [];
    var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var data = sh.getRange(4, 1, lastRow - 3, lastCol).getValues();
    var results = [];
    for (var i = 0; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        if (headers[j]) row[headers[j]] = data[i][j];
      }
      var modCol = row['Module'] || row['module'] || '';
      if (modCol && modCol !== module && modCol !== 'All') continue;
      var active = row['Active'] || row['active'] || 'Yes';
      if (String(active).toLowerCase() === 'no') continue;
      results.push(row);
    }
    return results;
  } catch (e) {
    Logger.log('handleGetTemplates error: ' + e.message);
    return [];
  }
}


// =============================================================================
// V7 — HELP SYSTEM (Module 15)
// =============================================================================

/**
 * Returns help content filtered by role and module.
 * Reads HELP_CONTENT sheet in FILE 1A.
 */
function handleGetHelpContent(params) {
  var role = params.role || 'All';
  var module = params.module || '';
  try {
    var ssId = getMasterFileId_('1A');
    if (!ssId) return [];
    var ss = SpreadsheetApp.openById(ssId);
    var sh = ss.getSheetByName('HELP_CONTENT');
    if (!sh) return [];
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 4) return [];
    var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
    var data = sh.getRange(4, 1, lastRow - 3, lastCol).getValues();
    var results = [];
    for (var i = 0; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        if (headers[j]) row[headers[j]] = data[i][j];
      }
      var active = row['Active'] || row['active'] || 'Yes';
      if (String(active).toLowerCase() === 'no') continue;
      // Filter by audience/role
      var audience = row['Target Audience'] || row['audience'] || 'All';
      if (audience !== 'All' && audience !== role) continue;
      // Filter by module if specified
      if (module) {
        var relMod = row['Related Module'] || row['module'] || 'All';
        if (relMod !== 'All' && relMod !== module) continue;
      }
      results.push(row);
    }
    return results;
  } catch (e) {
    Logger.log('handleGetHelpContent error: ' + e.message);
    return [];
  }
}


/**
 * Full-text search across help pages.
 */
function handleSearchHelp(params) {
  var query = String(params.query || '').toLowerCase();
  var role = params.role || 'All';
  if (!query) return [];
  try {
    var allHelp = handleGetHelpContent({ role: role });
    return allHelp.filter(function(page) {
      var searchable = (
        (page['Title'] || '') + ' ' +
        (page['Tags'] || '') + ' ' +
        (page['Content (Markdown)'] || page['Content'] || '')
      ).toLowerCase();
      return searchable.indexOf(query) > -1;
    });
  } catch (e) {
    Logger.log('handleSearchHelp error: ' + e.message);
    return [];
  }
}


// ── Helper: Get FILE 2 (Procurement) spreadsheet ID ──
function getFile2Id_() {
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG.FILE_IDS && CONFIG.FILE_IDS.FILE_2) {
      return CONFIG.FILE_IDS.FILE_2;
    }
  } catch (e) {}
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty('FILE_2_ID') || '';
  } catch (e) {}
  return '';
}


// ── Helper: Convert header string to camelCase key ──
// "Item Code" → "code",  "Name / Description" → "name", etc.
// For simplicity, maps common headers; falls back to lowercase-no-spaces.
function headerToKey_(header) {
  var h = String(header).trim().toLowerCase();
  var MAP = {
    'code': 'code', 'item code': 'code', 'article code': 'code', 'supplier code': 'code',
    'name': 'name', 'item name': 'name', 'description': 'name', 'name / description': 'name', 'article name': 'name', 'supplier name': 'name',
    'category': 'category', 'cat': 'category', 'type': 'category',
    'status': 'status',
    'gsm': 'extra', 'weight': 'extra', 'rate': 'extra', 'value': 'extra',
    'updated': 'updated', 'last updated': 'updated', 'modified': 'updated', 'date': 'updated',
    'uom': 'uom', 'unit': 'uom',
    'hsn': 'hsn', 'hsn code': 'hsn',
    'gst': 'gst', 'gst %': 'gst', 'gst rate': 'gst',
    'city': 'city', 'location': 'city',
    'gstin': 'gstin',
    'credit': 'credit', 'credit days': 'credit',
    'rating': 'rating',
    'remarks': 'remarks', 'notes': 'remarks'
  };
  return MAP[h] || h.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}


// =============================================================================
// ITEM CATEGORIES — Dedicated CRUD Handlers
// =============================================================================

/**
 * GET all categories from ITEM_CATEGORIES sheet.
 * Params: { includeInactive: true|false }
 */
/**
 * GET all categories from ITEM_CATEGORIES sheet.
 * Supports both sheet layouts automatically:
 *
 *   V10 (column-grouped, 22 cols) — 3 cols per master, masters run in parallel rows.
 *      A=#  |  B-D=Article  |  E-G=Fabric  |  H-J=Yarn  |  K-M=Woven
 *           |  N-P=Trim     |  Q-S=Consumable  |  T-V=Packaging
 *
 *   V9 (row-based, 9 cols) — one row per category, master identified in col E.
 *      A=Code  B=L1  C=L2  D=L3  E=Master  F=HSN  G=Active  H=Behavior  I=Remarks
 *
 * Detects format from data row 4 col E:
 *   - If col E matches a known master code ('ARTICLE', 'RM-FABRIC', …) → V9
 *   - Otherwise → V10
 *
 * Returns flat array of { l1, l2, l3, master, active, behavior } objects.
 */
function handleGetAllCategories(params) {
  // Try 3-layer cache first for fast response
  var cached = getCachedData(CONFIG.SHEETS.ITEM_CATEGORIES);

  // If cache returned row-based objects, detect format from data shape
  if (cached && cached.length > 0) {
    // Check if cached data is already in {l1, l2, l3, master} format (previously parsed)
    // or in raw {header: value} format from readSheetData
    var firstRow = cached[0];
    if (firstRow.l1 !== undefined && firstRow.master !== undefined) {
      // Already parsed — return as-is
      return cached;
    }
    // Raw header-keyed data from cache — need to detect V9 vs V10 and parse
    // Fall through to sheet-based parsing below
  }

  // Fallback: direct sheet read (when cache miss or raw data needs V9/V10 detection)
  var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_1A);
  var sheet = ss.getSheetByName(CONFIG.SHEETS.ITEM_CATEGORIES);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 4) return [];

  // ── Format detection ────────────────────────────────────────────────────────
  var V9_MASTER_CODES = ['ARTICLE', 'RM-FABRIC', 'RM-YARN', 'RM-WOVEN', 'TRIM', 'CONSUMABLE', 'PACKAGING'];
  var colEValue = String(sheet.getRange(4, 5, 1, 1).getValue() || '').trim();
  var isV9 = V9_MASTER_CODES.indexOf(colEValue) >= 0;

  if (isV9) {
    var V9_BEHAVIOR = { 'ARTICLE': 'SELECTABLE', 'RM-FABRIC': 'FIXED', 'RM-YARN': 'FIXED',
                        'RM-WOVEN': 'FIXED', 'TRIM': 'FIXED', 'CONSUMABLE': 'FIXED', 'PACKAGING': 'FIXED' };
    var numCols = Math.min(sheet.getLastColumn(), 8);
    var v9data = sheet.getRange(4, 1, lastRow - 3, numCols).getValues();
    var result = [];
    for (var i = 0; i < v9data.length; i++) {
      var l1     = String(v9data[i][1] || '').trim();
      var l2     = String(v9data[i][2] || '').trim();
      var l3     = String(v9data[i][3] || '').trim();
      var master = String(v9data[i][4] || '').trim();
      var active = String(v9data[i][6] || 'Yes').trim() || 'Yes';
      var beh    = String(v9data[i][7] || '').trim() || (V9_BEHAVIOR[master] || '');
      if (!l1 && !l2 && !l3) continue;
      if (!master) continue;
      result.push({ l1: l1, l2: l2, l3: l3, master: master, active: active, behavior: beh });
    }
    return result;
  }

  // ── V10 column-grouped reading ───────────────────────────────────────────
  var masters = [
    ['ARTICLE',    1, 'SELECTABLE'],
    ['RM-FABRIC',  4, 'FIXED'],
    ['RM-YARN',    7, 'FIXED'],
    ['RM-WOVEN',  10, 'FIXED'],
    ['TRIM',      13, 'FIXED'],
    ['CONSUMABLE',16, 'FIXED'],
    ['PACKAGING', 19, 'FIXED']
  ];

  var data = sheet.getRange(4, 1, lastRow - 3, 22).getValues();
  var result = [];
  for (var m = 0; m < masters.length; m++) {
    var masterKey = masters[m][0];
    var colIdx    = masters[m][1];
    var behavior  = masters[m][2];

    for (var i = 0; i < data.length; i++) {
      var l1 = String(data[i][colIdx]     || '').trim();
      var l2 = String(data[i][colIdx + 1] || '').trim();
      var l3 = String(data[i][colIdx + 2] || '').trim();
      if (!l1 && !l2 && !l3) continue;

      result.push({
        l1:       l1,
        l2:       l2,
        l3:       l3,
        master:   masterKey,
        active:   'Yes',
        behavior: behavior
      });
    }
  }
  return result;
}

/**
 * CREATE a new category in ITEM_CATEGORIES (V10 column-grouped layout).
 * Params: { master, l1, l2, l3 }
 * Finds the master's column group and appends L1/L2/L3 in the next empty row.
 */
function handleCreateCategory(params) {
  var master = params.master;
  var l1 = params.l1 || '';
  var l2 = params.l2 || '';
  var l3 = params.l3 || '';

  if (!master) throw new Error('master is required');
  if (!l1 && !l2 && !l3) throw new Error('At least one of l1/l2/l3 is required');

  var COL_MAP = {
    'ARTICLE': 2, 'RM-FABRIC': 5, 'RM-YARN': 8, 'RM-WOVEN': 11,
    'TRIM': 14, 'CONSUMABLE': 17, 'PACKAGING': 20
  };
  var startCol = COL_MAP[master];
  if (!startCol) throw new Error('Unknown master: ' + master);

  var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_1A);
  var sheet = ss.getSheetByName(CONFIG.SHEETS.ITEM_CATEGORIES);
  if (!sheet) throw new Error('ITEM_CATEGORIES sheet not found');

  var lastRow = Math.max(sheet.getLastRow(), 3);
  var targetRow = 4; // data starts at row 4

  if (lastRow >= 4) {
    var colData = sheet.getRange(4, startCol, lastRow - 3, 3).getValues();
    for (var i = 0; i < colData.length; i++) {
      if (String(colData[i][0]).trim() || String(colData[i][1]).trim() || String(colData[i][2]).trim()) {
        targetRow = i + 5; // next row after this occupied row
      }
    }
  }

  // Write the data
  sheet.getRange(targetRow, startCol, 1, 3).setValues([[l1, l2, l3]]);
  // Update row number in column A
  sheet.getRange(targetRow, 1).setValue(targetRow - 3);

  // Invalidate cache
  try { invalidateCache('ITEM_CATEGORIES'); } catch(e) {}

  return { saved: true, master: master, l1: l1, l2: l2, l3: l3, action: 'created' };
}

/**
 * UPDATE an existing category in ITEM_CATEGORIES (V10 column-grouped layout).
 * Params: { master, oldL1, oldL2, oldL3, l1, l2, l3 }
 * Finds the row by matching old L1/L2/L3 in the master's column group.
 */
function handleUpdateCategory(params) {
  var master = params.master;
  if (!master) throw new Error('master is required');

  var COL_MAP = {
    'ARTICLE': 2, 'RM-FABRIC': 5, 'RM-YARN': 8, 'RM-WOVEN': 11,
    'TRIM': 14, 'CONSUMABLE': 17, 'PACKAGING': 20
  };
  var startCol = COL_MAP[master];
  if (!startCol) throw new Error('Unknown master: ' + master);

  var oldL1 = String(params.oldL1 || '').trim();
  var oldL2 = String(params.oldL2 || '').trim();
  var oldL3 = String(params.oldL3 || '').trim();
  var l1 = params.l1 || '';
  var l2 = params.l2 || '';
  var l3 = params.l3 || '';

  var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_1A);
  var sheet = ss.getSheetByName(CONFIG.SHEETS.ITEM_CATEGORIES);
  if (!sheet) throw new Error('ITEM_CATEGORIES sheet not found');

  var lastRow = sheet.getLastRow();
  if (lastRow < 4) throw new Error('No data in sheet');

  var colData = sheet.getRange(4, startCol, lastRow - 3, 3).getValues();
  var rowIndex = -1;
  for (var i = 0; i < colData.length; i++) {
    if (String(colData[i][0]).trim() === oldL1 &&
        String(colData[i][1]).trim() === oldL2 &&
        String(colData[i][2]).trim() === oldL3) {
      rowIndex = i + 4;
      break;
    }
  }
  if (rowIndex === -1) throw new Error('Category not found: ' + oldL1 + ' / ' + oldL2 + ' / ' + oldL3);

  sheet.getRange(rowIndex, startCol, 1, 3).setValues([[l1, l2, l3]]);

  // Invalidate cache
  try { invalidateCache('ITEM_CATEGORIES'); } catch(e) {}

  return { saved: true, master: master, l1: l1, l2: l2, l3: l3, action: 'updated' };
}


// =============================================================================
// ARTICLE DROPDOWNS — Read from ARTICLE_DROPDOWNS sheet
// =============================================================================

/**
 * GET all dropdown values from the ARTICLE_DROPDOWNS sheet.
 * Sheet structure: Row 1=Banner, Row 2=Headers, Row 3=Descriptions, Row 4+=Data
 * Columns: A=Gender, B=Fit Type, C=Neckline, D=Sleeve Type, E=Status, F=Season, G=Size Range
 * Returns: { gender:[], fit:[], neckline:[], sleeve:[], status:[], season:[], sizeRange:[] }
 */
function handleGetArticleDropdowns(params) {
  // Sensible fallback values returned when sheet is missing or empty
  var defaults = {
    gender:    ['Men', 'Women', 'Kids', 'Unisex'],
    fit:       ['Regular', 'Slim', 'Relaxed', 'Oversized', 'Crop', 'Athletic'],
    neckline:  ['Round Neck', 'V-Neck', 'Polo', 'Henley', 'Hood', 'Crew Neck', 'Quarter Zip', 'Mock Neck'],
    sleeve:    ['Half Sleeve', 'Full Sleeve', 'Sleeveless', 'Cap Sleeve', '3/4 Sleeve', 'Raglan'],
    status:    ['Active', 'Inactive', 'Development', 'Discontinued'],
    season:    ['SS2024', 'AW2024', 'SS2025', 'AW2025', 'SS2026', 'AW2026', 'Year Round'],
    sizeRange: ['S-M-L-XL-XXL', 'S-M-L-XL', 'M-L-XL-XXL', 'XS-S-M-L-XL', 'S-M-L', 'M-L-XL-XXL-3XL', 'Free Size', 'XS-S-M-L-XL-XXL-3XL']
  };

  // Use 3-layer cache instead of raw sheet read
  var cached = getCachedData('ARTICLE_DROPDOWNS');
  if (!cached || !cached.length) return defaults;

  // The cache returns [{header: value}, ...] row objects.
  // Map header keys to our output keys.
  var headerToKey = {};
  var keys = ['gender', 'fit', 'neckline', 'sleeve', 'status', 'season', 'sizeRange'];
  // Detect headers from first cached row
  var firstRow = cached[0];
  var headerNames = Object.keys(firstRow);
  // Map by position (A=Gender, B=Fit Type, C=Neckline, D=Sleeve Type, E=Status, F=Season, G=Size Range)
  for (var h = 0; h < Math.min(headerNames.length, 7); h++) {
    headerToKey[headerNames[h]] = keys[h];
  }

  var result = {};
  for (var k = 0; k < keys.length; k++) result[keys[k]] = [];

  for (var i = 0; i < cached.length; i++) {
    for (var hdr in headerToKey) {
      var outKey = headerToKey[hdr];
      var val = String(cached[i][hdr] || '').trim();
      if (val && result[outKey] && result[outKey].indexOf(val) === -1) {
        result[outKey].push(val);
      }
    }
  }

  // Fall back to defaults for any column that came back empty
  for (var k = 0; k < keys.length; k++) {
    if (!result[keys[k]].length) result[keys[k]] = defaults[keys[k]];
  }
  return result;
}


// =============================================================================
// V13 — PERFORMANCE: BOOT BUNDLE
// =============================================================================

/**
 * Returns all boot-time data in a single response, eliminating 6 separate
 * GAS web app invocations on page load.
 *
 * @param {Object} params - (no params required)
 * @returns {Object} Combined boot payload
 */
function handleGetBootBundle(params) {
  return {
    bootstrap:     handleGetUIBootstrap(params),
    onlineUsers:   handleGetOnlineUsers(params),
    notifications: handleGetNotifications(params),
    activityFeed:  handleGetActivityFeed(params),
    dashboardStats:handleGetDashboardStats(params),
    shortcuts:     handleGetUserShortcuts(params)
  };
}


// =============================================================================
// V13 — PERFORMANCE: INCREMENTAL SYNC
// =============================================================================

/**
 * Lightweight endpoint for checking if a sheet's data has changed.
 * Returns empty rows if the client's version matches the server version
 * (no changes), otherwise returns full data + new version.
 *
 * @param {Object} params - { sheet: string, version: string }
 * @returns {Object} { rows: [], unchanged: boolean, version: string }
 */
function handleGetDataSince(params) {
  var sheetKey = params.sheet || '';
  var clientVersion = String(params.version || '0');
  var info = MASTER_SHEET_MAP[sheetKey];
  if (!info) return { rows: [], unchanged: true, version: '0' };

  var cache = CacheService.getScriptCache();
  var versionKey = 'VERSION_' + info.sheet;
  var serverVersion = cache.get(versionKey) || '0';

  // If versions match, no changes — return empty
  if (clientVersion === serverVersion) {
    return { rows: [], unchanged: true, version: serverVersion };
  }

  // Data changed — return full cached data + new version
  var ssId = getMasterFileId_(info.file);
  var data = getCachedData(info.sheet, info.file !== '1A' ? ssId : undefined);

  // Format dates
  var rows = [];
  if (data && data.length) {
    for (var i = 0; i < data.length; i++) {
      var row = {};
      var hasContent = false;
      for (var key in data[i]) {
        var val = data[i][key];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd MMM yyyy');
        }
        row[key] = val;
        if (val !== '' && val !== null && val !== undefined) hasContent = true;
      }
      if (hasContent) rows.push(row);
    }
  }

  return { rows: rows, unchanged: false, version: serverVersion };
}
