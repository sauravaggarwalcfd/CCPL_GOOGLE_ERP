/**
 * ============================================================
 * CONFIDENCE CLOTHING — ERP FILE 1A (ITEMS MASTER)
 * Main Entry Points: onOpen, onEdit, Custom Menu, Triggers
 * ============================================================
 * Version: V4 — Phase 1 GAS Build
 * Sheets: 23 master sheets for Items
 * ============================================================
 */

/* ───────────────────────────────────────────────────────────
   INSTALLABLE TRIGGER: onOpen
   - Caches all master data (Layer 1)
   - Applies access control (hides sheets, protects ranges)
   - Builds custom menu based on user role
   ─────────────────────────────────────────────────────────── */
function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  var email = Session.getActiveUser().getEmail();

  // Layer 1 cache: batch-read all masters
  try {
    cacheAllMasters();
  } catch (err) {
    Logger.log('Cache warm-up error: ' + err.message);
  }

  // Build custom menu
  var role = getUserRole(email);
  buildCustomMenu_(ui, role);

  // Apply access control
  try {
    applyAccessControl();
  } catch (err) {
    Logger.log('Access control error: ' + err.message);
  }
}

/* ───────────────────────────────────────────────────────────
   INSTALLABLE TRIGGER: onEdit
   Routing hub — detects which sheet/column was edited and
   dispatches to the correct module handler.
   ─────────────────────────────────────────────────────────── */
function onEdit(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  var row = e.range.getRow();
  var col = e.range.getColumn();

  // Ignore edits on header/description rows (1-3)
  if (row <= 3) return;

  // Ignore edits on ITEM_CHANGE_LOG itself (prevent recursion)
  if (sheetName === CONFIG.SHEETS.ITEM_CHANGE_LOG) return;

  // ── Module 1: Auto Code Generation ──
  try {
    handleCodeGeneration(e);
  } catch (err) {
    Logger.log('CodeGen error: ' + err.message);
  }

  // ── Module 2: FK Auto-Display ──
  try {
    handleFKEdit(e);
  } catch (err) {
    Logger.log('FK Engine error: ' + err.message);
  }

  // ── Module 3: Attribute Sync ──
  try {
    handleAttrEdit(e);
  } catch (err) {
    Logger.log('Attr Sync error: ' + err.message);
  }

  // ── Module 4: Change Log ──
  try {
    handleChangeLog(e);
  } catch (err) {
    Logger.log('ChangeLog error: ' + err.message);
  }

  // ── Module 6: Color Swatch ──
  if (sheetName === CONFIG.SHEETS.COLOR_MASTER) {
    try {
      handleColorSwatchEdit(e);
    } catch (err) {
      Logger.log('Color Swatch error: ' + err.message);
    }
  }

  // ── Module 8: ISR Price Calculation ──
  if (sheetName === 'ITEM_SUPPLIER_RATES') {
    try {
      handleISREdit(e);
    } catch (err) {
      Logger.log('ISR error: ' + err.message);
    }
  }

  // ── Procurement: Auto Code Generation (FILE 2 sheets) ──
  if (isProcurementCodeSheet(sheetName)) {
    try {
      handleProcurementCodeGen(e);
    } catch (err) {
      Logger.log('Procurement CodeGen error: ' + err.message);
    }
  }

  // ── Procurement: FK Auto-Display (FILE 2 sheets) ──
  if (sheetName === 'PO_MASTER' || sheetName === 'PO_LINE_ITEMS' ||
      sheetName === 'GRN_MASTER' || sheetName === 'GRN_LINE_ITEMS') {
    try {
      handleProcurementFKEdit(e);
    } catch (err) {
      Logger.log('Procurement FK error: ' + err.message);
    }
  }

  // ── Layer 3: Smart Cache Invalidation ──
  try {
    invalidateCache(sheetName);
  } catch (err) {
    Logger.log('Cache invalidation error: ' + err.message);
  }
}

/* ───────────────────────────────────────────────────────────
   CUSTOM MENU BUILDER
   ─────────────────────────────────────────────────────────── */
function buildCustomMenu_(ui, role) {
  var menu = ui.createMenu('⚙ CC ERP');

  // Everyone gets these
  menu.addItem('🔄 Refresh Cache', 'menuRefreshCache');
  menu.addSeparator();

  // Code generation
  menu.addItem('🆕 Generate Missing Codes', 'menuGenerateMissingCodes');
  menu.addSeparator();

  // FK & Lookup
  menu.addItem('🔗 Refresh FK Dropdowns', 'menuRefreshFKDropdowns');
  menu.addSeparator();

  // Tags
  menu.addItem('🏷️ Manage Tags', 'menuOpenTagSidebar');
  menu.addSeparator();

  // Color
  menu.addItem('🎨 Apply All Color Swatches', 'menuApplyAllSwatches');
  menu.addSeparator();

  // Supplier
  menu.addItem('📦 Supplier Lookup', 'menuOpenSupplierSidebar');
  menu.addSeparator();

  // Procurement
  menu.addItem('📋 Open Procurement App', 'menuOpenProcurementApp');
  menu.addSeparator();

  // Admin only
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    menu.addItem('🔧 Setup File 1A Sheets', 'menuSetupSheetStructure');
    menu.addItem('🔧 Setup File 2 (Procurement)', 'setupFile2_Only');
    menu.addItem('⚙ MASTER SETUP — All 4 Files', 'masterSetupAll');
    menu.addItem('📊 Setup All Triggers', 'menuSetupAllTriggers');
    menu.addItem('🗑️ Clear All Caches', 'menuClearAllCaches');
    menu.addItem('📋 View Change Log', 'menuViewChangeLog');
    menu.addSeparator();
  }

  menu.addItem('ℹ️ About CC ERP', 'menuAbout');
  menu.addToUi();
}

/* ───────────────────────────────────────────────────────────
   MENU ACTION HANDLERS
   ─────────────────────────────────────────────────────────── */
function menuRefreshCache() {
  invalidateAllCaches();
  cacheAllMasters();
  SpreadsheetApp.getUi().alert('Cache refreshed successfully.');
}

function menuGenerateMissingCodes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsToProcess = [
    CONFIG.SHEETS.RM_MASTER_FABRIC,
    CONFIG.SHEETS.RM_MASTER_YARN,
    CONFIG.SHEETS.RM_MASTER_WOVEN,
    CONFIG.SHEETS.TRIM_MASTER,
    CONFIG.SHEETS.CONSUMABLE_MASTER,
    CONFIG.SHEETS.PACKAGING_MASTER
  ];

  var generated = 0;
  sheetsToProcess.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return;

    var codeCol = 1; // Column A
    var catCol = getCategoryColumn_(name);

    for (var r = 4; r <= lastRow; r++) {
      var code = sheet.getRange(r, codeCol).getValue();
      if (code) continue; // Already has code

      var category = catCol ? sheet.getRange(r, catCol).getValue() : null;
      if (!category && catCol) continue; // Category required but empty

      var newCode = generateItemCode(name, r, category);
      if (newCode) {
        sheet.getRange(r, codeCol).setValue(newCode);
        generated++;
      }
    }
  });

  SpreadsheetApp.getUi().alert(generated + ' codes generated.');
}

function menuRefreshFKDropdowns() {
  var relations = loadMasterRelations();
  SpreadsheetApp.getUi().alert(relations.length + ' FK relations loaded. Dropdowns will update on next cell edit.');
}

function menuOpenTagSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('TagSidebar')
    .setTitle('🏷️ Manage Tags')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function menuApplyAllSwatches() {
  applyAllColorSwatches();
  SpreadsheetApp.getUi().alert('All color swatches applied.');
}

function menuOpenSupplierSidebar() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = SpreadsheetApp.getActiveRange().getRow();
  if (row < 4) {
    SpreadsheetApp.getUi().alert('Select a data row first (row 4+).');
    return;
  }
  var itemCode = sheet.getRange(row, 1).getValue();
  if (!itemCode) {
    SpreadsheetApp.getUi().alert('No item code found in this row.');
    return;
  }
  showSupplierSidebar(itemCode);
}

function menuSetupSheetStructure() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    'Setup Sheet Structure',
    'This will create/format all 23 File 1A sheets. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (result === ui.Button.YES) {
    setupAllSheets();
    ui.alert('Sheet structure setup complete.');
  }
}

function menuSetupAllTriggers() {
  setupAllTriggers();
  SpreadsheetApp.getUi().alert('All triggers configured.');
}

function menuClearAllCaches() {
  invalidateAllCaches();
  SpreadsheetApp.getUi().alert('All caches cleared.');
}

function menuViewChangeLog() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(CONFIG.SHEETS.ITEM_CHANGE_LOG);
  if (logSheet) {
    ss.setActiveSheet(logSheet);
  } else {
    SpreadsheetApp.getUi().alert('ITEM_CHANGE_LOG sheet not found.');
  }
}

function menuOpenProcurementApp() {
  var html = HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('CC ERP — Procurement')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showSidebar(html);
}

function menuAbout() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    'Confidence Clothing ERP',
    'Version: V5\n' +
    'Files: 1A (22 Items) + 1B (23 Factory) + 1C (6 Finance) + F2 (5 Procurement)\n' +
    'Modules: Code Gen, FK Engine, Attr Sync, Change Log, Access Control, Color Swatch, Reorder Alerts, ISR, Export, Presence, UIBootstrap, Notifications, QuickAccess, ProcurementAPI\n' +
    'Cache: 3-Layer (CacheService + PropertiesService + Smart Invalidation)\n\n' +
    'Built with Google Apps Script',
    ui.ButtonSet.OK
  );
}

/* ───────────────────────────────────────────────────────────
   WEB APP ENTRY POINT — API ONLY
   GAS serves ONLY as a JSON API backend for the React webapp.
   No HTML is served from here — the frontend runs locally via Vite.
   Deploy as: Web App → Execute as: User Accessing → Access: Anyone
   ─────────────────────────────────────────────────────────── */
function doGet(e) {
  return handleAPIRequest(e, 'GET');
}

function doPost(e) {
  return handleAPIRequest(e, 'POST');
}

/* ───────────────────────────────────────────────────────────
   TEMPLATE INCLUDE HELPER
   Used in HTML templates: <?!= include('styles') ?>
   ─────────────────────────────────────────────────────────── */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ───────────────────────────────────────────────────────────
   TRIGGER SETUP
   Creates all installable triggers for File 1A
   ─────────────────────────────────────────────────────────── */
function setupAllTriggers() {
  // Remove existing triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // onOpen trigger
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(ss)
    .onOpen()
    .create();

  // onEdit trigger
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  // Daily reorder alert at 8am IST
  ScriptApp.newTrigger('checkReorderLevels')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone('Asia/Kolkata')
    .create();

  // Daily cross-file cache refresh at 7am IST
  ScriptApp.newTrigger('refreshCrossFileProperties')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .inTimezone('Asia/Kolkata')
    .create();

  Logger.log('All triggers setup complete.');
}

/* ───────────────────────────────────────────────────────────
   HELPER: Get category column index for a sheet
   ─────────────────────────────────────────────────────────── */
function getCategoryColumn_(sheetName) {
  switch (sheetName) {
    case CONFIG.SHEETS.TRIM_MASTER:
      return 4; // Trim Category
    case CONFIG.SHEETS.CONSUMABLE_MASTER:
      return 4; // Consumable Category
    case CONFIG.SHEETS.PACKAGING_MASTER:
      return 4; // Packaging Category
    default:
      return null; // No category column (simple sequential)
  }
}

/* ───────────────────────────────────────────────────────────
   TAG MANAGEMENT (called from TagSidebar.html)
   ─────────────────────────────────────────────────────────── */
function getTagsForSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tagSheet = ss.getSheetByName(CONFIG.SHEETS.TAG_MASTER);
  if (!tagSheet) return [];

  var lastRow = tagSheet.getLastRow();
  if (lastRow < 4) return [];

  var data = tagSheet.getRange(4, 1, lastRow - 3, 4).getValues(); // Code, Name, Applies To, Active
  var tags = [];
  data.forEach(function(row) {
    var appliesTo = row[2] ? row[2].toString() : '';
    var active = row[3] ? row[3].toString() : '';
    if (active.toUpperCase() === 'YES' || active.toUpperCase() === 'ACTIVE') {
      // Check if this tag applies to the current sheet
      if (appliesTo === 'ALL' || appliesTo.indexOf(sheetName) !== -1) {
        tags.push({
          code: row[0],
          name: row[1],
          appliesTo: appliesTo
        });
      }
    }
  });
  return tags;
}

function getCurrentTags() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = SpreadsheetApp.getActiveRange().getRow();
  var sheetName = sheet.getName();

  // Find Tags column
  var headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  var tagCol = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().indexOf('Tags') !== -1) {
      tagCol = i + 1;
      break;
    }
  }
  if (tagCol === -1 || row < 4) return { sheetName: sheetName, row: row, tags: '' };

  var currentVal = sheet.getRange(row, tagCol).getValue();
  return {
    sheetName: sheetName,
    row: row,
    tagCol: tagCol,
    tags: currentVal ? currentVal.toString() : ''
  };
}

function saveTagSelection(tagCodes, row, tagCol) {
  var sheet = SpreadsheetApp.getActiveSheet();
  sheet.getRange(row, tagCol).setValue(tagCodes);
}

function createNewTag(tagName, appliesTo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tagSheet = ss.getSheetByName(CONFIG.SHEETS.TAG_MASTER);
  if (!tagSheet) return null;

  // Generate next TAG code
  var lastRow = tagSheet.getLastRow();
  var maxNum = 0;
  if (lastRow >= 4) {
    var codes = tagSheet.getRange(4, 1, lastRow - 3, 1).getValues();
    codes.forEach(function(row) {
      var code = row[0].toString();
      var match = code.match(/TAG-(\d+)/);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
  }

  var newCode = 'TAG-' + String(maxNum + 1).padStart(3, '0');
  var newRow = lastRow + 1;
  tagSheet.getRange(newRow, 1).setValue(newCode);
  tagSheet.getRange(newRow, 2).setValue(tagName);
  tagSheet.getRange(newRow, 3).setValue(appliesTo);
  tagSheet.getRange(newRow, 4).setValue('Yes');

  // Invalidate tag cache
  invalidateCache(CONFIG.SHEETS.TAG_MASTER);

  return { code: newCode, name: tagName };
}

/* ───────────────────────────────────────────────────────────
   SUPPLIER SELECTION (called from SupplierSidebar.html)
   ─────────────────────────────────────────────────────────── */
function confirmSupplierSelection(data) {
  // data = { itemCode, supplierCode, supplierName, unitPrice, gstPercent }
  // This will be used in Phase 3 PO module
  Logger.log('Supplier confirmed: ' + JSON.stringify(data));
  return { success: true, message: 'Supplier ' + data.supplierCode + ' selected.' };
}

/* ───────────────────────────────────────────────────────────
   FK CREATE NEW (called from CreateNewSidebar.html)
   ─────────────────────────────────────────────────────────── */
function getSheetHeaders(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];

  var headers = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var descriptions = sheet.getRange(3, 1, 1, lastCol).getValues()[0];

  var fields = [];
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i].toString();
    // Skip auto-generated, calculated, and read-only columns
    if (header.indexOf('#') === 0 || header.indexOf('←') !== -1 ||
        header.indexOf('∑') !== -1) continue;

    fields.push({
      col: i + 1,
      header: header,
      description: descriptions[i] ? descriptions[i].toString() : ''
    });
  }
  return fields;
}
