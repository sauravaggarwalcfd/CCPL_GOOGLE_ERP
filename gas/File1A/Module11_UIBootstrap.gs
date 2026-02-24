/**
 * ============================================================================
 * MODULE 11 — UI BOOTSTRAP
 * ============================================================================
 * Returns all data the web app client needs on initial load in a single call.
 * Reduces round-trips between client and server to just one at startup.
 *
 * Called via: google.script.run.getUIBootstrap()
 * ============================================================================
 */

/**
 * Returns the full UI bootstrap payload for the web app.
 * Called once when the web app loads.
 *
 * @returns {Object} Bootstrap payload with user info, config, lists, etc.
 */
function getUIBootstrap() {
  var email = Session.getActiveUser().getEmail();
  var role = getUserRole(email);

  // Get user display name from USER_MASTER
  var userName = _getDisplayName(email);

  // Get supplier list for dropdowns
  var suppliers = _getSupplierList();

  // Get warehouse list for dropdowns
  var warehouses = _getWarehouseList();

  // Get payment terms for dropdowns
  var paymentTerms = _getPaymentTermsList();

  // Get user shortcuts
  var shortcuts = getUserShortcuts_();

  // Get user theme preference
  var theme = getUserTheme_();

  return {
    user: {
      email: email,
      name: userName,
      role: role
    },
    modules: [
      { id: 'procurement', name: 'Procurement', icon: 'package', description: 'PO & GRN Management' },
      { id: 'production',  name: 'Production',  icon: 'factory', description: 'Production Planning' },
      { id: 'inventory',   name: 'Inventory',   icon: 'warehouse', description: 'Stock Management' },
      { id: 'quality',     name: 'Quality',     icon: 'shield-check', description: 'Quality Control' },
      { id: 'sales',       name: 'Sales',       icon: 'trending-up', description: 'Sales & Orders' },
      { id: 'finance',     name: 'Finance',     icon: 'indian-rupee', description: 'Finance & Accounts' },
      { id: 'masters',     name: 'Masters',     icon: 'database', description: 'Master Data Management' },
      { id: 'dashboard',   name: 'Dashboard',   icon: 'layout-dashboard', description: 'Reports & Analytics' }
    ],
    lists: {
      poStatusList:     CONFIG.PO_STATUS_LIST,
      grnStatusList:    CONFIG.GRN_STATUS_LIST,
      poGrnStatusList:  CONFIG.PO_GRN_STATUS_LIST,
      poTypeList:       CONFIG.PO_TYPE_LIST,
      seasonList:       CONFIG.SEASON_LIST,
      currencyList:     CONFIG.CURRENCY_LIST,
      inspectionResult: CONFIG.INSPECTION_RESULT_LIST,
      itemMasterList:   CONFIG.ITEM_MASTER_LIST,
      lineStatusList:   CONFIG.LINE_STATUS_LIST,
      roleList:         CONFIG.ROLE_LIST,
      uomList:          CONFIG.UOM_LIST,
      priorityList:     CONFIG.PRIORITY_LIST
    },
    lookups: {
      suppliers:    suppliers,
      warehouses:   warehouses,
      paymentTerms: paymentTerms
    },
    preferences: {
      theme: theme,
      shortcuts: shortcuts
    }
  };
}


/**
 * Saves the user's theme preference.
 *
 * @param {Object} themeConfig - { mode: string, accent: string }
 */
function saveUserTheme(themeConfig) {
  var email = Session.getActiveUser().getEmail();
  var key = 'THEME_' + email;
  PropertiesService.getUserProperties().setProperty(key, JSON.stringify(themeConfig));
  return { success: true };
}


/**
 * Saves the user's quick-access shortcuts.
 *
 * @param {string[]} shortcutIds - Array of shortcut IDs
 */
function saveUserShortcuts(shortcutIds) {
  var email = Session.getActiveUser().getEmail();
  var key = 'SHORTCUTS_' + email;
  PropertiesService.getUserProperties().setProperty(key, JSON.stringify(shortcutIds));
  return { success: true };
}


// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _getDisplayName(email) {
  try {
    var fileId = CONFIG.FILE_IDS.FILE_1B;
    if (!fileId || fileId === 'YOUR_FILE_1B_SPREADSHEET_ID') return email;

    var ss = SpreadsheetApp.openById(fileId);
    var sheet = ss.getSheetByName('USER_MASTER');
    if (!sheet) return email;

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return email;

    var data = sheet.getRange(4, 1, lastRow - 3, 3).getValues(); // Code, Name, Email
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][2]).trim().toLowerCase() === email.toLowerCase()) {
        return String(data[i][1]).trim() || email;
      }
    }
  } catch (err) {
    Logger.log('UIBootstrap :: _getDisplayName error: ' + err.message);
  }
  return email;
}


function _getSupplierList() {
  try {
    var data = getCachedData('SUPPLIER_MASTER', CONFIG.FILE_IDS.FILE_1C);
    if (!data || data.length === 0) return [];

    var result = [];
    for (var i = 0; i < data.length; i++) {
      var code = data[i]['# Supplier Code'] || data[i]['Supplier Code'] || '';
      var name = data[i]['Supplier Name'] || data[i]['\u26A0 Supplier Name'] || '';
      if (code) {
        result.push({ code: String(code).trim(), name: String(name).trim() });
      }
    }
    return result;
  } catch (err) {
    Logger.log('UIBootstrap :: _getSupplierList error: ' + err.message);
    return [];
  }
}


function _getWarehouseList() {
  try {
    var data = getCachedData('WAREHOUSE_MASTER', CONFIG.FILE_IDS.FILE_1B);
    if (!data || data.length === 0) return [];

    var result = [];
    for (var i = 0; i < data.length; i++) {
      var code = data[i]['# Warehouse Code'] || '';
      var name = data[i]['\u26A0 Warehouse Name'] || data[i]['Warehouse Name'] || '';
      if (code) {
        result.push({ code: String(code).trim(), name: String(name).trim() });
      }
    }
    return result;
  } catch (err) {
    Logger.log('UIBootstrap :: _getWarehouseList error: ' + err.message);
    return [];
  }
}


function _getPaymentTermsList() {
  try {
    var data = getCachedData('PAYMENT_TERMS_MASTER', CONFIG.FILE_IDS.FILE_1C);
    if (!data || data.length === 0) return [];

    var result = [];
    for (var i = 0; i < data.length; i++) {
      var code = data[i]['# Payment Terms Code'] || '';
      var name = data[i]['Payment Terms Name'] || data[i]['\u26A0 Payment Terms Name'] || '';
      if (code) {
        result.push({ code: String(code).trim(), name: String(name).trim() });
      }
    }
    return result;
  } catch (err) {
    Logger.log('UIBootstrap :: _getPaymentTermsList error: ' + err.message);
    return [];
  }
}


function getUserTheme_() {
  try {
    var email = Session.getActiveUser().getEmail();
    var key = 'THEME_' + email;
    var raw = PropertiesService.getUserProperties().getProperty(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    Logger.log('UIBootstrap :: getUserTheme_ error: ' + err.message);
  }
  return { mode: 'light', accent: 'orange' };
}


function getUserShortcuts_() {
  try {
    var email = Session.getActiveUser().getEmail();
    var key = 'SHORTCUTS_' + email;
    var raw = PropertiesService.getUserProperties().getProperty(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    Logger.log('UIBootstrap :: getUserShortcuts_ error: ' + err.message);
  }
  return [];
}
