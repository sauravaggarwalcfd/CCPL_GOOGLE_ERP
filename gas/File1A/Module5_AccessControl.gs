/**
 * =============================================================================
 * MODULE 5 — ACCESS CONTROL
 * =============================================================================
 *
 * Role-based access control driven by USER_MASTER in FILE 1B (cross-file).
 *
 * USER_MASTER columns: Email | Name | Role | Department | Active | Phone
 *
 * Roles and Permissions:
 * | Role            | Can Edit                              | Read Only         |
 * |-----------------|---------------------------------------|-------------------|
 * | SUPER_ADMIN     | All 48 sheets                         | —                 |
 * | ADMIN           | All item + factory masters             | Finance masters   |
 * | PURCHASE_MGR    | Supplier, ISR, Payment Terms           | Item masters      |
 * | PRODUCTION_MGR  | Process, Work Center, Machine          | Item masters      |
 * | STORE_KEEPER    | Warehouse, Bin, Spare Parts            | Item masters      |
 * | ACCOUNTS        | Finance masters                        | Item masters      |
 * | VIEW_ONLY       | —                                      | Item masters      |
 *
 * Row Structure: Row 1=banner, Row 2=headers, Row 3=descriptions, Row 4+=data
 * =============================================================================
 */


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cache key and TTL for user role lookups */
var AC_CACHE_KEY_PREFIX = 'AC_USER_ROLE_';
var AC_CACHE_TTL = 21600; // 6 hours (matches CONFIG.CACHE.LAYER1_EXPIRY_SECONDS)

/** USER_MASTER sheet name (lives in FILE 1B) */
var AC_USER_MASTER_SHEET = 'USER_MASTER';

/** USER_MASTER column indices (row 2 headers) */
var AC_UM_COL = {
  EMAIL:      1,
  NAME:       2,
  ROLE:       3,
  DEPARTMENT: 4,
  ACTIVE:     5,
  PHONE:      6
};

/**
 * Sheet groups used for permission mapping.
 * Each group contains sheet names that share the same access rules.
 */
var AC_SHEET_GROUPS = {

  // All FILE 1A item master sheets
  ITEM_MASTERS: [
    'ARTICLE_MASTER', 'RM_MASTER_FABRIC', 'RM_MASTER_YARN', 'RM_MASTER_WOVEN',
    'TRIM_MASTER', 'TRIM_ATTR_NAMES', 'TRIM_ATTR_VALUES',
    'CONSUMABLE_MASTER', 'CON_ATTR_NAMES', 'CON_ATTR_VALUES',
    'PACKAGING_MASTER', 'PKG_ATTR_NAMES', 'PKG_ATTR_VALUES',
    'ITEM_CATEGORIES', 'UOM_MASTER', 'HSN_MASTER', 'COLOR_MASTER',
    'SIZE_MASTER', 'FABRIC_TYPE_MASTER', 'TAG_MASTER',
    'ITEM_CHANGE_LOG', 'MASTER_RELATIONS'
  ],

  // FILE 1B factory master sheets
  FACTORY_MASTERS: [
    'USER_MASTER', 'DEPARTMENT_MASTER', 'DESIGNATION_MASTER', 'SHIFT_MASTER',
    'CUSTOMER_MASTER', 'CONTRACTOR_MASTER', 'WAREHOUSE_MASTER', 'STORAGE_BIN_MASTER',
    'FACTORY_MASTER', 'MACHINE_MASTER', 'MACHINE_CATEGORY', 'ASSET_MASTER',
    'MAINTENANCE_SCHEDULE', 'SPARE_PARTS_MASTER', 'PROCESS_MASTER',
    'WORK_CENTER_MASTER', 'JOBWORK_PARTY_MASTER'
  ],

  // FILE 1C finance master sheets
  FINANCE_MASTERS: [
    'SUPPLIER_MASTER', 'PAYMENT_TERMS_MASTER', 'TAX_MASTER',
    'BANK_MASTER', 'COST_CENTER_MASTER', 'ACCOUNT_MASTER'
  ],

  // Supplier-related sheets (cross-file, editable by PURCHASE_MGR)
  SUPPLIER_SHEETS: [
    'SUPPLIER_MASTER', 'ITEM_SUPPLIER_RATES', 'PAYMENT_TERMS_MASTER'
  ],

  // Production-related sheets (editable by PRODUCTION_MGR)
  PRODUCTION_SHEETS: [
    'PROCESS_MASTER', 'WORK_CENTER_MASTER', 'MACHINE_MASTER',
    'MACHINE_CATEGORY'
  ],

  // Store-related sheets (editable by STORE_KEEPER)
  STORE_SHEETS: [
    'WAREHOUSE_MASTER', 'STORAGE_BIN_MASTER', 'SPARE_PARTS_MASTER'
  ]
};


// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Checks whether a user has access to a specific sheet for a given action.
 *
 * @param {string} email      - The user's email address
 * @param {string} sheetName  - The name of the sheet being accessed
 * @param {string} actionType - 'edit' or 'read'
 * @param {string=} optRole   - Optional pre-resolved role (avoids repeated lookups)
 * @returns {Object} { canEdit: boolean, canRead: boolean, role: string }
 */
function checkUserAccess(email, sheetName, actionType, optRole) {
  var result = {
    canEdit: false,
    canRead: false,
    role: ''
  };

  try {
    if (!sheetName) {
      Logger.log('ACCESS :: checkUserAccess - Missing sheetName.');
      return result;
    }

    var role = optRole || getUserRole(email);
    result.role = role;

    if (!role) {
      return result;
    }

    // Determine permissions based on role
    switch (role) {

      case CONFIG.ROLES.SUPER_ADMIN:
        result.canEdit = true;
        result.canRead = true;
        break;

      case CONFIG.ROLES.ADMIN:
        // Can edit all item + factory masters; read-only on finance
        if (_isInGroup(sheetName, AC_SHEET_GROUPS.FINANCE_MASTERS)) {
          result.canEdit = false;
          result.canRead = true;
        } else {
          result.canEdit = true;
          result.canRead = true;
        }
        break;

      case CONFIG.ROLES.PURCHASE_MGR:
        // Can edit Supplier, ISR, Payment Terms; read item masters
        if (_isInGroup(sheetName, AC_SHEET_GROUPS.SUPPLIER_SHEETS)) {
          result.canEdit = true;
          result.canRead = true;
        } else if (_isInGroup(sheetName, AC_SHEET_GROUPS.ITEM_MASTERS)) {
          result.canEdit = false;
          result.canRead = true;
        } else {
          result.canEdit = false;
          result.canRead = false;
        }
        break;

      case CONFIG.ROLES.PRODUCTION_MGR:
        // Can edit Process, Work Center, Machine; read item masters
        if (_isInGroup(sheetName, AC_SHEET_GROUPS.PRODUCTION_SHEETS)) {
          result.canEdit = true;
          result.canRead = true;
        } else if (_isInGroup(sheetName, AC_SHEET_GROUPS.ITEM_MASTERS)) {
          result.canEdit = false;
          result.canRead = true;
        } else {
          result.canEdit = false;
          result.canRead = false;
        }
        break;

      case CONFIG.ROLES.STORE_KEEPER:
        // Can edit Warehouse, Bin, Spare Parts; read item masters
        if (_isInGroup(sheetName, AC_SHEET_GROUPS.STORE_SHEETS)) {
          result.canEdit = true;
          result.canRead = true;
        } else if (_isInGroup(sheetName, AC_SHEET_GROUPS.ITEM_MASTERS)) {
          result.canEdit = false;
          result.canRead = true;
        } else {
          result.canEdit = false;
          result.canRead = false;
        }
        break;

      case CONFIG.ROLES.ACCOUNTS:
        // Can edit finance masters; read item masters
        if (_isInGroup(sheetName, AC_SHEET_GROUPS.FINANCE_MASTERS)) {
          result.canEdit = true;
          result.canRead = true;
        } else if (_isInGroup(sheetName, AC_SHEET_GROUPS.ITEM_MASTERS)) {
          result.canEdit = false;
          result.canRead = true;
        } else {
          result.canEdit = false;
          result.canRead = false;
        }
        break;

      case CONFIG.ROLES.VIEW_ONLY:
        // Read-only on item masters, no access to anything else
        if (_isInGroup(sheetName, AC_SHEET_GROUPS.ITEM_MASTERS)) {
          result.canEdit = false;
          result.canRead = true;
        } else {
          result.canEdit = false;
          result.canRead = false;
        }
        break;

      default:
        Logger.log('ACCESS :: checkUserAccess - Unknown role: ' + role);
        result.canEdit = false;
        result.canRead = false;
        break;
    }

  } catch (err) {
    Logger.log('ACCESS :: checkUserAccess - Error: ' + err.message);
  }

  return result;
}


/** Sentinel value used to cache "user not found" results so we don't re-query. */
var AC_NOT_FOUND_SENTINEL = '__NOT_FOUND__';

/**
 * Reads the user's role from USER_MASTER in FILE 1B.
 * Uses 3-layer cache: CacheService -> PropertiesService -> direct sheet read.
 * Caches negative results (user not found) to prevent repeated cross-file lookups.
 *
 * @param {string} email - The user's email address
 * @returns {string} The role string (e.g. 'SUPER_ADMIN'), or empty string if not found
 */
function getUserRole(email) {
  if (!email) {
    return '';
  }

  var normalizedEmail = email.toLowerCase().trim();
  var cacheKey = AC_CACHE_KEY_PREFIX + normalizedEmail;

  // --- Layer 1: CacheService (fast, in-memory) ---
  try {
    var cache = CacheService.getScriptCache();
    var cachedRole = cache.get(cacheKey);
    if (cachedRole !== null) {
      return cachedRole === AC_NOT_FOUND_SENTINEL ? '' : cachedRole;
    }
  } catch (e) {
    Logger.log('ACCESS :: getUserRole - CacheService read failed: ' + e.message);
  }

  // --- Layer 2: PropertiesService (persistent, script-scoped) ---
  try {
    var props = PropertiesService.getScriptProperties();
    var storedRole = props.getProperty(cacheKey);
    if (storedRole !== null) {
      // Promote back to Layer 1 cache
      try {
        CacheService.getScriptCache().put(cacheKey, storedRole, AC_CACHE_TTL);
      } catch (e2) { /* ignore cache write failure */ }
      return storedRole === AC_NOT_FOUND_SENTINEL ? '' : storedRole;
    }
  } catch (e) {
    Logger.log('ACCESS :: getUserRole - PropertiesService read failed: ' + e.message);
  }

  // --- Layer 3: Direct sheet read (fallback, slowest) ---
  var role = _readRoleFromUserMaster(normalizedEmail);

  // Store in both cache layers — including negative results to prevent repeated lookups
  var valueToCache = role || AC_NOT_FOUND_SENTINEL;
  try {
    CacheService.getScriptCache().put(cacheKey, valueToCache, AC_CACHE_TTL);
  } catch (e) { /* ignore */ }
  try {
    PropertiesService.getScriptProperties().setProperty(cacheKey, valueToCache);
  } catch (e) { /* ignore */ }

  return role;
}


/**
 * Called on onOpen — applies access control by hiding sheets the user cannot
 * see and protecting sheets the user cannot edit.
 * Also builds the custom menu appropriate to the user's role.
 */
function applyAccessControl() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var email = Session.getActiveUser().getEmail();

    if (!email) {
      Logger.log('ACCESS :: applyAccessControl - Cannot determine user email. Skipping.');
      return;
    }

    var role = getUserRole(email);

    if (!role) {
      Logger.log('ACCESS :: applyAccessControl - No role found for ' + email + '. Showing VIEW_ONLY access.');
      role = CONFIG.ROLES.VIEW_ONLY;
    }

    var sheets = ss.getSheets();

    // First pass: determine which sheets are visible vs hidden
    var visibleSheets = [];
    var hiddenSheets = [];

    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i];
      var sheetName = sheet.getName();
      // Pass role directly to avoid repeated getUserRole lookups
      var access = checkUserAccess(email, sheetName, 'read', role);

      if (access.canRead) {
        visibleSheets.push({ sheet: sheet, canEdit: access.canEdit });
      } else {
        hiddenSheets.push(sheet);
      }
    }

    // Safety: ensure at least one sheet stays visible
    if (visibleSheets.length === 0 && sheets.length > 0) {
      // Show the first sheet as fallback to prevent "can't hide all sheets" error
      visibleSheets.push({ sheet: sheets[0], canEdit: false });
      hiddenSheets = sheets.slice(1);
      Logger.log('ACCESS :: applyAccessControl - No readable sheets for role ' + role + '. Showing first sheet as fallback.');
    }

    // Second pass: show visible sheets and apply protections
    for (var v = 0; v < visibleSheets.length; v++) {
      visibleSheets[v].sheet.showSheet();
      if (!visibleSheets[v].canEdit) {
        protectSheet(visibleSheets[v].sheet, []);
      }
    }

    // Third pass: hide non-readable sheets
    for (var h = 0; h < hiddenSheets.length; h++) {
      hiddenSheets[h].hideSheet();
    }

    // Build the role-specific custom menu
    buildMenuForRole(role);

    Logger.log('ACCESS :: applyAccessControl - Applied for ' + email + ' (role: ' + role + ')');

  } catch (err) {
    Logger.log('ACCESS :: applyAccessControl - Error: ' + err.message);
  }
}


/**
 * Builds and displays a custom menu tailored to the user's role.
 * Menu items are filtered so that users only see actions they are authorized to perform.
 *
 * @param {string} role - The user's role from CONFIG.ROLES
 */
function buildMenuForRole(role) {
  try {
    var ui = SpreadsheetApp.getUi();
    var menu = ui.createMenu(CONFIG.SYSTEM.APP_NAME);

    // -- Common menu items for all roles --
    menu.addItem('Refresh Data', 'refreshAllCaches');
    menu.addSeparator();

    // -- Role-specific menu items --
    switch (role) {

      case CONFIG.ROLES.SUPER_ADMIN:
        menu.addItem('Generate Item Code', 'generateItemCodeMenu');
        menu.addItem('Apply All Color Swatches', 'applyAllColorSwatches');
        menu.addSeparator();
        menu.addSubMenu(ui.createMenu('Admin Tools')
          .addItem('Check Reorder Levels', 'checkReorderLevels')
          .addItem('Setup Reorder Trigger', 'setupReorderTrigger')
          .addItem('Rebuild Sheet Protections', 'applyAccessControl')
          .addItem('Clear All Caches', 'clearAllCaches')
        );
        menu.addSeparator();
        menu.addSubMenu(ui.createMenu('Audit')
          .addItem('View Change Log', 'navigateToChangeLog')
        );
        break;

      case CONFIG.ROLES.ADMIN:
        menu.addItem('Generate Item Code', 'generateItemCodeMenu');
        menu.addItem('Apply All Color Swatches', 'applyAllColorSwatches');
        menu.addSeparator();
        menu.addSubMenu(ui.createMenu('Admin Tools')
          .addItem('Check Reorder Levels', 'checkReorderLevels')
          .addItem('Rebuild Sheet Protections', 'applyAccessControl')
        );
        menu.addSeparator();
        menu.addSubMenu(ui.createMenu('Audit')
          .addItem('View Change Log', 'navigateToChangeLog')
        );
        break;

      case CONFIG.ROLES.PURCHASE_MGR:
        menu.addItem('Check Reorder Levels', 'checkReorderLevels');
        menu.addSeparator();
        menu.addSubMenu(ui.createMenu('Supplier Tools')
          .addItem('View Supplier Rates', 'navigateToISR')
          .addItem('Add New Supplier', 'addNewSupplierMenu')
        );
        break;

      case CONFIG.ROLES.PRODUCTION_MGR:
        menu.addSubMenu(ui.createMenu('Production Tools')
          .addItem('View Process Master', 'navigateToProcessMaster')
          .addItem('View Work Centers', 'navigateToWorkCenters')
          .addItem('View Machines', 'navigateToMachines')
        );
        break;

      case CONFIG.ROLES.STORE_KEEPER:
        menu.addSubMenu(ui.createMenu('Store Tools')
          .addItem('View Warehouse Master', 'navigateToWarehouse')
          .addItem('View Storage Bins', 'navigateToStorageBins')
          .addItem('View Spare Parts', 'navigateToSpareParts')
        );
        break;

      case CONFIG.ROLES.ACCOUNTS:
        menu.addSubMenu(ui.createMenu('Finance Tools')
          .addItem('View Supplier Master', 'navigateToSupplierMaster')
          .addItem('View Payment Terms', 'navigateToPaymentTerms')
          .addItem('View Tax Master', 'navigateToTaxMaster')
        );
        break;

      case CONFIG.ROLES.VIEW_ONLY:
        // No additional menu items for view-only users
        menu.addItem('About ' + CONFIG.SYSTEM.APP_NAME, 'showAbout');
        break;

      default:
        menu.addItem('About ' + CONFIG.SYSTEM.APP_NAME, 'showAbout');
        break;
    }

    menu.addToUi();

  } catch (err) {
    Logger.log('ACCESS :: buildMenuForRole - Error: ' + err.message);
  }
}


/**
 * Adds sheet-level protection to prevent unauthorized edits.
 * Only the specified email addresses (and script owner) can edit.
 * Rows 1-3 (banner, headers, descriptions) are always protected for all users.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to protect
 * @param {string[]} allowedEmails - Array of email addresses allowed to edit.
 *                                   Empty array means no one can edit (read-only).
 */
function protectSheet(sheet, allowedEmails) {
  try {
    if (!sheet) {
      Logger.log('ACCESS :: protectSheet - No sheet provided.');
      return;
    }

    var sheetName = sheet.getName();

    // Remove existing protections on this sheet to avoid duplicates
    var existingProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    for (var i = 0; i < existingProtections.length; i++) {
      if (existingProtections[i].canDomainEdit()) {
        existingProtections[i].remove();
      } else {
        // Only remove protections we created (described with our prefix)
        var desc = existingProtections[i].getDescription();
        if (desc && desc.indexOf('CCPL_AC_') === 0) {
          existingProtections[i].remove();
        }
      }
    }

    // Protect the entire sheet
    var protection = sheet.protect().setDescription('CCPL_AC_' + sheetName);

    // Remove all editors first, then add back only allowed ones
    var editors = protection.getEditors();
    if (editors && editors.length > 0) {
      protection.removeEditors(editors);
    }

    // Add allowed editors
    if (allowedEmails && allowedEmails.length > 0) {
      protection.addEditors(allowedEmails);
    }

    // Ensure the script owner retains edit access
    var me = Session.getEffectiveUser();
    if (me) {
      protection.addEditor(me);
    }

    // Always protect rows 1-3 (banner, headers, descriptions) even for editors
    // by adding an unprotected range for data rows only
    if (allowedEmails && allowedEmails.length > 0) {
      var lastCol = sheet.getMaxColumns();
      var lastRow = sheet.getMaxRows();
      if (lastRow > 3 && lastCol > 0) {
        var dataRange = sheet.getRange(
          CONFIG.ROW_STRUCTURE.DATA_START_ROW, 1,
          lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1, lastCol
        );
        protection.setUnprotectedRanges([dataRange]);
      }
    }

    Logger.log('ACCESS :: protectSheet - Protection set on "' + sheetName + '" with ' +
      (allowedEmails ? allowedEmails.length : 0) + ' allowed editors.');

  } catch (err) {
    Logger.log('ACCESS :: protectSheet - Error on "' +
      (sheet ? sheet.getName() : 'null') + '": ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Reads the role for a given email directly from the USER_MASTER sheet in FILE 1B.
 * This is the Layer 3 (slowest) fallback.
 *
 * @param {string} normalizedEmail - Lowercase trimmed email address
 * @returns {string} The role string, or empty string if not found / inactive
 */
function _readRoleFromUserMaster(normalizedEmail) {
  try {
    // Open USER_MASTER from FILE 1B (cross-file)
    var userSheet = getCrossFileSheet(CONFIG.FILE_IDS.FILE_1B, AC_USER_MASTER_SHEET);

    if (!userSheet) {
      Logger.log('ACCESS :: _readRoleFromUserMaster - USER_MASTER sheet not found in FILE 1B.');
      return '';
    }

    var lastRow = userSheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return ''; // No data rows
    }

    // Read all data rows at once for performance (row 4 to lastRow)
    var numRows = lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1;
    var numCols = 6; // Email, Name, Role, Department, Active, Phone
    var data = userSheet.getRange(CONFIG.ROW_STRUCTURE.DATA_START_ROW, 1, numRows, numCols).getValues();

    for (var i = 0; i < data.length; i++) {
      var rowEmail = String(data[i][AC_UM_COL.EMAIL - 1]).toLowerCase().trim();
      var rowActive = String(data[i][AC_UM_COL.ACTIVE - 1]).trim();
      var rowRole = String(data[i][AC_UM_COL.ROLE - 1]).trim();

      if (rowEmail === normalizedEmail) {
        // Check if the user is active
        if (rowActive.toLowerCase() === 'yes' || rowActive.toLowerCase() === 'true' ||
            rowActive.toLowerCase() === 'active' || rowActive === '1') {
          return rowRole;
        } else {
          Logger.log('ACCESS :: _readRoleFromUserMaster - User ' + normalizedEmail + ' is inactive.');
          return '';
        }
      }
    }

    Logger.log('ACCESS :: _readRoleFromUserMaster - Email ' + normalizedEmail + ' not found in USER_MASTER.');
    return '';

  } catch (err) {
    Logger.log('ACCESS :: _readRoleFromUserMaster - Error: ' + err.message);
    return '';
  }
}


/**
 * Checks whether a sheet name belongs to a given group array.
 *
 * @param {string}   sheetName - The sheet name to check
 * @param {string[]} group     - Array of sheet names in the group
 * @returns {boolean} True if the sheet is in the group
 */
function _isInGroup(sheetName, group) {
  if (!sheetName || !group) {
    return false;
  }
  return group.indexOf(sheetName) !== -1;
}


/**
 * Gets a list of emails for all users with a specific role.
 * Useful for building editor lists for sheet protection.
 *
 * @param {string} targetRole - The role to search for (e.g. CONFIG.ROLES.SUPER_ADMIN)
 * @returns {string[]} Array of email addresses with that role
 */
function _getEmailsByRole(targetRole) {
  var emails = [];

  try {
    var userSheet = getCrossFileSheet(CONFIG.FILE_IDS.FILE_1B, AC_USER_MASTER_SHEET);
    if (!userSheet) {
      return emails;
    }

    var lastRow = userSheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return emails;
    }

    var numRows = lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1;
    var data = userSheet.getRange(CONFIG.ROW_STRUCTURE.DATA_START_ROW, 1, numRows, 6).getValues();

    for (var i = 0; i < data.length; i++) {
      var rowRole = String(data[i][AC_UM_COL.ROLE - 1]).trim();
      var rowActive = String(data[i][AC_UM_COL.ACTIVE - 1]).trim();
      var rowEmail = String(data[i][AC_UM_COL.EMAIL - 1]).trim();

      if (rowRole === targetRole && rowEmail &&
          (rowActive.toLowerCase() === 'yes' || rowActive.toLowerCase() === 'true' ||
           rowActive.toLowerCase() === 'active' || rowActive === '1')) {
        emails.push(rowEmail.toLowerCase());
      }
    }
  } catch (err) {
    Logger.log('ACCESS :: _getEmailsByRole - Error: ' + err.message);
  }

  return emails;
}


// ---------------------------------------------------------------------------
// Navigation Helpers (called from menu items)
// ---------------------------------------------------------------------------

/** Navigates to the ITEM_CHANGE_LOG sheet */
function navigateToChangeLog() {
  _navigateToSheet('ITEM_CHANGE_LOG');
}

/** Navigates to ITEM_SUPPLIER_RATES (cross-file, opens FILE 1B) */
function navigateToISR() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_1B);
    var sheet = ss.getSheetByName('ITEM_SUPPLIER_RATES');
    if (sheet) {
      SpreadsheetApp.setActiveSpreadsheet(ss);
      sheet.activate();
    } else {
      SpreadsheetApp.getUi().alert('ITEM_SUPPLIER_RATES sheet not found in FILE 1B.');
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert('Cannot open FILE 1B: ' + err.message);
  }
}

/** Navigates to a sheet by name in the active spreadsheet */
function _navigateToSheet(sheetName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      sheet.activate();
    } else {
      SpreadsheetApp.getUi().alert('Sheet "' + sheetName + '" not found.');
    }
  } catch (err) {
    Logger.log('ACCESS :: _navigateToSheet - Error: ' + err.message);
  }
}

/** Shows an About dialog with system info */
function showAbout() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.alert(
      CONFIG.SYSTEM.APP_NAME + ' v' + CONFIG.SYSTEM.VERSION,
      CONFIG.SYSTEM.COMPANY_NAME + '\n\n' +
      'Google Sheets + Apps Script ERP System\n' +
      'For support, contact the system administrator.',
      ui.ButtonSet.OK
    );
  } catch (err) {
    Logger.log('ACCESS :: showAbout - Error: ' + err.message);
  }
}

// Placeholder navigation functions referenced by menus
function navigateToProcessMaster()  { _navigateToSheet('PROCESS_MASTER'); }
function navigateToWorkCenters()    { _navigateToSheet('WORK_CENTER_MASTER'); }
function navigateToMachines()       { _navigateToSheet('MACHINE_MASTER'); }
function navigateToWarehouse()      { _navigateToSheet('WAREHOUSE_MASTER'); }
function navigateToStorageBins()    { _navigateToSheet('STORAGE_BIN_MASTER'); }
function navigateToSpareParts()     { _navigateToSheet('SPARE_PARTS_MASTER'); }
function navigateToSupplierMaster() { _navigateToSheet('SUPPLIER_MASTER'); }
function navigateToPaymentTerms()   { _navigateToSheet('PAYMENT_TERMS_MASTER'); }
function navigateToTaxMaster()      { _navigateToSheet('TAX_MASTER'); }

// Placeholder functions for menu actions (implemented in other modules)
function generateItemCodeMenu() { Logger.log('generateItemCodeMenu called — implement in Module 1.'); }
function refreshAllCaches()     { Logger.log('refreshAllCaches called — implement in Cache module.'); }
function clearAllCaches()       { Logger.log('clearAllCaches called — implement in Cache module.'); }
function addNewSupplierMenu()   { Logger.log('addNewSupplierMenu called — implement in Module 2.'); }
