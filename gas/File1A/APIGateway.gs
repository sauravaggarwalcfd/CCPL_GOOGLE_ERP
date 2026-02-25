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
  'printDocument':        handlePrintDocument
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
    var params = {};
    var action = '';

    if (method === 'GET') {
      // GET: all params come from the query string
      params = e.parameter || {};
      action = params.action || '';
    } else {
      // POST: params may be in the body (JSON) or as form fields
      if (e.postData && e.postData.type === 'application/json') {
        try {
          params = JSON.parse(e.postData.contents);
        } catch (parseErr) {
          return jsonError('Invalid JSON in request body.', 400);
        }
      } else if (e.parameter) {
        params = e.parameter;
      }
      action = params.action || (e.parameter ? e.parameter.action : '') || '';
    }

    // ------------------------------------------------------------------
    // 2. Validate action
    // ------------------------------------------------------------------
    if (!action) {
      return jsonError('Missing required parameter: action', 400);
    }

    var handler = API_ROUTES[action];
    if (!handler) {
      return jsonError('Unknown action: ' + action, 404);
    }

    // ------------------------------------------------------------------
    // 3. Execute handler
    // ------------------------------------------------------------------
    var result = handler(params);

    // ------------------------------------------------------------------
    // 4. Return success response
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
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.ITEM_CHANGE_LOG);
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return [];

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
    var numRows = Math.min(lastRow - 3, limit);

    // Read the most recent rows (bottom of the sheet)
    var startRow = Math.max(4, lastRow - numRows + 1);
    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).getValues();

    var feed = [];
    // Iterate in reverse to get newest first
    for (var r = data.length - 1; r >= 0 && feed.length < limit; r--) {
      var entry = {};
      for (var c = 0; c < headers.length; c++) {
        var h = String(headers[c]).trim();
        if (h) entry[h] = data[r][c];
      }
      feed.push(entry);
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
