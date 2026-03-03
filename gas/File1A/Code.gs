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

  // ── Multi-select toggle: RM_MASTER_FABRIC col G (⟷ YARN COMPOSITION) ──
  // User picks a yarn name from dropdown → append to existing values with | separator.
  // If the name is already in the list, remove it (toggle behavior).
  if (sheetName === CONFIG.SHEETS.RM_MASTER_FABRIC && col === 7) {
    try {
      var newVal  = String(e.value || '').trim();
      var oldVal  = (e.oldValue !== undefined) ? String(e.oldValue).trim() : '';
      if (newVal && oldVal) {
        var existing = oldVal.split('|').map(function(s) { return s.trim(); }).filter(Boolean);
        var idx = existing.indexOf(newVal);
        if (idx !== -1) {
          existing.splice(idx, 1);                   // toggle OFF — remove if present
        } else {
          existing.push(newVal);                      // toggle ON — append new name
        }
        var merged = existing.join(' | ');
        e.range.setValue(merged);
        // e.range still points to this cell; downstream _directFKResolveOnEdit
        // reads the updated value via e.range.getValue()
      }
    } catch (err) {
      Logger.log('Multi-select toggle error: ' + err.message);
    }
  }

  // ── Auto Description: ARTICLE_MASTER col B = L1 › L2 › L3 ──
  if (sheetName === CONFIG.SHEETS.ARTICLE_MASTER && (col === 7 || col === 8 || col === 9)) {
    try {
      var l1Val = sheet.getRange(row, 7).getValue() || '';
      var l2Val = sheet.getRange(row, 8).getValue() || '';
      var l3Val = sheet.getRange(row, 9).getValue() || '';
      var parts = [l1Val, l2Val, l3Val].filter(function(p) { return String(p).trim() !== ''; });
      if (parts.length > 0) {
        sheet.getRange(row, 2).setValue(parts.join(' › '));
      }
    } catch (err) {
      Logger.log('Auto Description error: ' + err.message);
    }
  }

  // ── Auto HSN: ARTICLE_MASTER — When L2 (col 8) changes, auto-fill HSN Code + GST% ──
  // Reads HSN_MASTER directly, matches L2 value to HSN Description.
  // Col 23 = → HSN Code, Col 24 = ← GST % (Auto)
  if (sheetName === CONFIG.SHEETS.ARTICLE_MASTER && col === 8) {
    try {
      var l2ForHSN = String(sheet.getRange(row, 8).getValue() || '').trim();
      if (l2ForHSN) {
        var hsnMatch = _directLookupHSNByL2(l2ForHSN);
        if (hsnMatch) {
          sheet.getRange(row, 23).setValue(hsnMatch.code);
          sheet.getRange(row, 24).setValue(hsnMatch.gst);
        }
      }
    } catch (err) {
      Logger.log('Auto HSN lookup error: ' + err.message);
    }
  }

  // ── Module 1: Auto Code Generation ──
  try {
    handleCodeGeneration(e);
  } catch (err) {
    Logger.log('CodeGen error: ' + err.message);
  }

  // ── Module 2: FK Auto-Display ──
  // Skip handleFKEdit for RM_MASTER_FABRIC col G (⟷ YARN COMPOSITION) — it writes to col+1 (H)
  // which is wrong. The correct handler is _directFKResolveOnEdit below (writes to col-1 = F).
  try {
    if (!(sheetName === CONFIG.SHEETS.RM_MASTER_FABRIC && col === 7)) {
      handleFKEdit(e);
    }
  } catch (err) {
    Logger.log('FK Engine error: ' + err.message);
  }

  // ── V12.4: DIRECT FK DISPLAY OVERRIDE ──
  // Bypasses MASTER_RELATIONS + cache. Reads referenced sheets directly by header name.
  // Runs AFTER handleFKEdit to override with fresh, correct display names.
  try {
    _directFKResolveOnEdit(sheet, sheetName, row, col, e);
  } catch (err) {
    Logger.log('Direct FK resolve error: ' + err.message);
  }

  // ── Auto SKU: RM_MASTER_FABRIC col B = L3 Knit Type + Yarn Names ──
  // V9 columns: E(5)=L3 Knit Type, F(6)=← Yarn Codes (Auto), G(7)=⟷ YARN COMPOSITION (names), B(2)=∑ FINAL FABRIC SKU
  // Triggers when L3 Knit Type (col 5) is edited.
  // When col 7 is edited, _directFKResolveOnEdit above already rebuilds col B + col F.
  if (sheetName === CONFIG.SHEETS.RM_MASTER_FABRIC && col === 5) {
    try {
      var knitType  = String(sheet.getRange(row, 5).getValue() || '').trim();
      var yarnNames = String(sheet.getRange(row, 7).getValue() || '').trim();
      var skuParts  = [knitType, yarnNames].filter(function(p) { return p !== ''; });
      sheet.getRange(row, 2).setValue(skuParts.length > 0 ? skuParts.join(' — ') : '');
    } catch (err) {
      Logger.log('Fabric SKU auto-build error: ' + err.message);
    }
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
    menu.addItem('🗂 Seed Item Categories', 'seedItemCategories');
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
      return 5; // V9: L2 Trim Category (L1 Division inserted at col 4; category shifted to col 5)
    case CONFIG.SHEETS.CONSUMABLE_MASTER:
      return 5; // V9: L2 Category (L1 Division inserted at col 4; category shifted to col 5)
    case CONFIG.SHEETS.PACKAGING_MASTER:
      return 5; // V9: L2 Category (L1 Division inserted at col 4; category shifted to col 5)
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


/* ───────────────────────────────────────────────────────────
   V12.4 — DIRECT FK RESOLUTION HELPERS
   Bypasses MASTER_RELATIONS sheet and cache entirely.
   Reads referenced sheets DIRECTLY, finds columns by header
   name matching, resolves FK codes to display names.
   ─────────────────────────────────────────────────────────── */

/**
 * Called from onEdit after handleFKEdit. Detects specific FK edits and
 * resolves display names by reading referenced sheets directly (no cache).
 *
 * Currently handles:
 *   1. RM_MASTER_FABRIC ⟷ YARN COMPOSITION → Yarn Names + SKU rebuild
 *   2. ARTICLE_MASTER → MAIN FABRIC USED → Fabric Name
 */
function _directFKResolveOnEdit(sheet, sheetName, row, col, e) {
  if (row < 4) return;

  var headerVal = String(sheet.getRange(2, col).getValue()).trim();
  var cellValue = String(e.range.getValue() || '').trim();

  // ── RM_MASTER_FABRIC: ⟷ YARN COMPOSITION (col G, names separated by |) → Yarn Codes (col F, comma-separated) ──
  if (sheetName === CONFIG.SHEETS.RM_MASTER_FABRIC) {
    var normHeader = _normalizeHeader(headerVal);
    if (normHeader === 'yarn composition') {
      // Resolve yarn names → yarn codes from RM_MASTER_YARN (direct read)
      // Col G names are pipe-separated, col F codes are comma-separated
      var yarnCodes = cellValue
        ? _directResolveFKPipeToComma(CONFIG.SHEETS.RM_MASTER_YARN, cellValue, 'Yarn Name', '# RM Code')
        : '';
      sheet.getRange(row, col - 1).setValue(yarnCodes);

      // Also rebuild ∑ FINAL FABRIC SKU (col B) = L3 Knit Type — Yarn Names
      var knitType = String(sheet.getRange(row, 5).getValue() || '').trim();
      var skuParts = [knitType, cellValue].filter(function(p) { return p !== ''; });
      sheet.getRange(row, 2).setValue(skuParts.length > 0 ? skuParts.join(' — ') : '');
      return;
    }
  }

  // ── ARTICLE_MASTER: → MAIN FABRIC USED → Fabric Name (col+1) ──
  if (sheetName === CONFIG.SHEETS.ARTICLE_MASTER) {
    var normArtHeader = _normalizeHeader(headerVal);
    if (normArtHeader === 'main fabric used') {
      var fabricDisplay = cellValue
        ? _directResolveFabricName(cellValue)
        : '';
      sheet.getRange(row, col + 1).setValue(fabricDisplay);
      return;
    }
  }
}


/**
 * Generic direct FK resolve. Reads the referenced sheet directly (NO cache,
 * NO MASTER_RELATIONS). Finds code and display columns by header name.
 *
 * @param {string}  refSheetName   Name of the referenced sheet
 * @param {string}  codes          Code(s) to resolve (comma-separated if multi)
 * @param {string}  codeHeader     Header name of the code column in ref sheet
 * @param {string}  displayHeader  Header name of the display column in ref sheet
 * @param {boolean} isMulti        True for multi-select (comma-separated codes)
 * @returns {string} Resolved display name(s), or the original code if not found
 */
function _directResolveFK(refSheetName, codes, codeHeader, displayHeader, isMulti) {
  if (!codes || String(codes).trim() === '') return '';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var refSheet = ss.getSheetByName(refSheetName);
  if (!refSheet) {
    Logger.log('_directResolveFK: Sheet "' + refSheetName + '" not found');
    return String(codes);
  }

  var lastRow = refSheet.getLastRow();
  var lastCol = refSheet.getLastColumn();
  if (lastRow < 4 || lastCol < 1) return String(codes);

  // Read headers from row 2 directly (no cache)
  var headers = refSheet.getRange(2, 1, 1, lastCol).getValues()[0];

  // Find columns using _findColumnIndex (from Module2_FKEngine.gs)
  var codeIdx = _findColumnIndex(headers, codeHeader);
  var dispIdx = _findColumnIndex(headers, displayHeader);

  if (codeIdx === -1 || dispIdx === -1) {
    Logger.log('_directResolveFK: Column not found in "' + refSheetName + '". ' +
               'codeHeader="' + codeHeader + '" (idx=' + codeIdx + '), ' +
               'displayHeader="' + displayHeader + '" (idx=' + dispIdx + ')');
    return String(codes);
  }

  // Read data rows (row 4+) directly (no cache)
  var numRows = lastRow - 3;
  var data = refSheet.getRange(4, 1, numRows, lastCol).getValues();

  // Build code → display map
  var map = {};
  for (var r = 0; r < data.length; r++) {
    var c = String(data[r][codeIdx]).trim();
    if (c) map[c] = String(data[r][dispIdx]).trim();
  }

  // Resolve codes to display names
  if (isMulti) {
    var codeList = String(codes).split(',');
    var results = [];
    for (var j = 0; j < codeList.length; j++) {
      var code = codeList[j].trim();
      if (code) results.push(map[code] || code);
    }
    return results.join(', ');
  } else {
    var trimmed = String(codes).trim();
    return map[trimmed] || trimmed;
  }
}


/**
 * Resolves pipe-separated names to comma-separated codes.
 * Used for RM_MASTER_FABRIC col G (names | separated) → col F (codes , separated).
 *
 * @param {string} refSheetName   Name of the referenced sheet (RM_MASTER_YARN)
 * @param {string} pipeNames      Pipe-separated names (e.g. "Cotton 40s | Polyester DTY")
 * @param {string} nameHeader     Header of the name column in ref sheet (Yarn Name)
 * @param {string} codeHeader     Header of the code column in ref sheet (# RM Code)
 * @returns {string} Comma-separated codes (e.g. "RM-YRN-001, RM-YRN-003")
 */
function _directResolveFKPipeToComma(refSheetName, pipeNames, nameHeader, codeHeader) {
  if (!pipeNames || String(pipeNames).trim() === '') return '';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var refSheet = ss.getSheetByName(refSheetName);
  if (!refSheet) {
    Logger.log('_directResolveFKPipeToComma: Sheet "' + refSheetName + '" not found');
    return '';
  }

  var lastRow = refSheet.getLastRow();
  var lastCol = refSheet.getLastColumn();
  if (lastRow < 4 || lastCol < 1) return '';

  var headers = refSheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var nameIdx = _findColumnIndex(headers, nameHeader);
  var codeIdx = _findColumnIndex(headers, codeHeader);

  if (nameIdx === -1 || codeIdx === -1) {
    Logger.log('_directResolveFKPipeToComma: Column not found. nameHeader="' +
               nameHeader + '" (idx=' + nameIdx + '), codeHeader="' + codeHeader + '" (idx=' + codeIdx + ')');
    return '';
  }

  var numRows = lastRow - 3;
  var data = refSheet.getRange(4, 1, numRows, lastCol).getValues();

  // Build name → code map (case-insensitive key for robustness)
  var map = {};
  for (var r = 0; r < data.length; r++) {
    var name = String(data[r][nameIdx]).trim();
    var code = String(data[r][codeIdx]).trim();
    if (name && code) map[name.toLowerCase()] = code;
  }

  // Split by pipe, resolve each name → code
  var nameList = String(pipeNames).split('|');
  var codes = [];
  for (var j = 0; j < nameList.length; j++) {
    var n = nameList[j].trim();
    if (!n) continue;
    var resolved = map[n.toLowerCase()];
    codes.push(resolved || n);    // fallback to name if code not found
  }

  return codes.join(', ');
}


/**
 * Resolves a fabric code to its display name from RM_MASTER_FABRIC.
 * Tries ∑ FINAL FABRIC SKU first; falls back to L3 Knit Type — Yarn Names.
 *
 * @param {string} fabricCode  The fabric code (e.g. "RM-FAB-001")
 * @returns {string} The fabric display name, or the code if not found
 */
function _directResolveFabricName(fabricCode) {
  if (!fabricCode || String(fabricCode).trim() === '') return '';
  fabricCode = String(fabricCode).trim();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fabSheet = ss.getSheetByName(CONFIG.SHEETS.RM_MASTER_FABRIC);
  if (!fabSheet) return fabricCode;

  var lastRow = fabSheet.getLastRow();
  var lastCol = fabSheet.getLastColumn();
  if (lastRow < 4 || lastCol < 1) return fabricCode;

  // Read headers from row 2 directly (no cache)
  var headers = fabSheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var codeIdx = _findColumnIndex(headers, '# RM Code');
  var skuIdx  = _findColumnIndex(headers, '∑ FINAL FABRIC SKU');
  var knitIdx = _findColumnIndex(headers, 'L3 Knit Type');
  var yarnIdx = _findColumnIndex(headers, '⟷ YARN COMPOSITION');

  if (codeIdx === -1) return fabricCode;

  // Read data rows directly (no cache)
  var numRows = lastRow - 3;
  var data = fabSheet.getRange(4, 1, numRows, lastCol).getValues();

  for (var r = 0; r < data.length; r++) {
    if (String(data[r][codeIdx]).trim() === fabricCode) {
      // Try ∑ FINAL FABRIC SKU first (the fully-built display name)
      if (skuIdx !== -1) {
        var sku = String(data[r][skuIdx]).trim();
        if (sku) return sku;
      }
      // Fallback: compose from L3 Knit Type + Yarn Names
      var parts = [];
      if (knitIdx !== -1) {
        var knit = String(data[r][knitIdx]).trim();
        if (knit) parts.push(knit);
      }
      if (yarnIdx !== -1) {
        var yarn = String(data[r][yarnIdx]).trim();
        if (yarn) parts.push(yarn);
      }
      return parts.length > 0 ? parts.join(' — ') : fabricCode;
    }
  }

  return fabricCode; // Code not found in fabric master
}


/**
 * Looks up HSN_MASTER by matching HSN Description to an L2 category name.
 * HSN_MASTER rows for articles have Description = L2 value (e.g. "Tops - Polo").
 * Returns { code, gst } or null if no match.
 *
 * @param {string} l2Value  The L2 Product Category (e.g. "Tops - Tee")
 * @returns {Object|null} { code: "6109", gst: 5 } or null
 */
function _directLookupHSNByL2(l2Value) {
  if (!l2Value) return null;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hsnSheet = ss.getSheetByName(CONFIG.SHEETS.HSN_MASTER);
  if (!hsnSheet) return null;

  var lastRow = hsnSheet.getLastRow();
  var lastCol = hsnSheet.getLastColumn();
  if (lastRow < 4 || lastCol < 3) return null;

  // Read headers from row 2 directly (no cache)
  var headers = hsnSheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var codeIdx = -1, descIdx = -1, gstIdx = -1;

  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim().toLowerCase();
    if (h === 'hsn code') codeIdx = i;
    if (h === 'hsn description') descIdx = i;
    if (h === 'gst %' || h === 'gst%') gstIdx = i;
  }

  if (codeIdx === -1 || descIdx === -1 || gstIdx === -1) return null;

  // Read data rows directly (no cache)
  var data = hsnSheet.getRange(4, 1, lastRow - 3, lastCol).getValues();
  var search = l2Value.trim().toLowerCase();

  for (var r = 0; r < data.length; r++) {
    var desc = String(data[r][descIdx]).trim().toLowerCase();
    if (desc === search) {
      return {
        code: String(data[r][codeIdx]).trim(),
        gst: data[r][gstIdx]
      };
    }
  }

  return null;
}
