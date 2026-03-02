/**
 * ============================================================
 * CONFIDENCE CLOTHING — ERP V9 PATCH SCRIPT
 * ============================================================
 * Applies V8 → V9 structural changes to live Google Sheets.
 * Safe: inserts columns into existing sheets, no data deleted.
 *
 * HOW TO RUN:
 *   1. Open FILE 1A in Google Sheets
 *   2. Go to Extensions > Apps Script
 *   3. Run function: applyV9Updates
 *   4. Approve the confirmation dialog
 *
 * CHANGES APPLIED:
 *   ARTICLE_MASTER:      +1 col  (L3 Style at col I)
 *   RM_MASTER_FABRIC:    +2 cols (L1 Division, L2 Category at cols C, D)
 *   RM_MASTER_YARN:      +3 cols (L1 Division, L2 Category, L3 Yarn Type at cols B–D)
 *   RM_MASTER_WOVEN:     +2 cols (L1 Division, L2 Category at cols B, C)
 *   TRIM_MASTER:         +1 col  (L1 Division at col D)
 *   CONSUMABLE_MASTER:   +1 col  (L1 Division at col D)
 *   PACKAGING_MASTER:    +1 col  (L1 Division at col D)
 *   ITEM_CATEGORIES:     Rebuild to 138 rows with V9 CAT codes
 * ============================================================
 */

/* ── V9 Dropdown Options ── */
var V9_L1_ARTICLE  = ["Men's Apparel", "Women's Apparel", "Kids Apparel", "Unisex Apparel"];
var V9_L3_ARTICLE  = ['Basic', 'Pique', 'Striper', 'Jacquard', 'Designer', 'Henley', 'V-Neck',
                      'Oversized', 'Hoodie', 'Crew Neck', 'Quarter Zip', 'Half Zip', 'Fleece',
                      'Bomber', 'Pullover', 'Slim Fit', 'Relaxed Fit', 'Athletic', 'Cargo'];
var V9_L3_FABRIC   = ['Single Jersey', 'Pique', 'Fleece', 'French Terry', 'Rib', 'Interlock',
                      'Autostriper', 'Waffle Knit', 'Lycra Jersey', 'Textured / Yarn Dyed', 'Other Knit'];
var V9_L3_YARN     = ['Cotton Combed', 'Cotton Carded', 'Polyester', 'PC Blend', 'Viscose',
                      'Melange', 'Lycra / Spandex', 'Nylon', 'Other Yarn'];
var V9_L3_WOVEN    = ['Fusible Interlining', 'Non-Fusible Interlining', 'Woven Fabric',
                      'Collar Canvas', 'Lining', 'Tape', 'Other'];

/* ──────────────────────────────────────────────────────────────────
   MAIN ENTRY POINT
   ────────────────────────────────────────────────────────────────── */
function applyV9Updates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var result = ui.alert(
    'CC ERP — Apply V9 Updates',
    'This will insert new L1/L2/L3 columns into 7 master sheets\n' +
    'and rebuild ITEM_CATEGORIES with 138 rows.\n\n' +
    '⚠ No existing data rows will be deleted.\n' +
    '⚠ Columns are inserted — existing data shifts right.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );
  if (result !== ui.Button.YES) return;

  var log = [];

  try { updateArticleMaster_V9_(ss); log.push('✓ ARTICLE_MASTER'); }
  catch (e) { log.push('✗ ARTICLE_MASTER: ' + e.message); Logger.log(e.stack); }

  try { updateRMFabric_V9_(ss); log.push('✓ RM_MASTER_FABRIC'); }
  catch (e) { log.push('✗ RM_MASTER_FABRIC: ' + e.message); Logger.log(e.stack); }

  try { updateRMYarn_V9_(ss); log.push('✓ RM_MASTER_YARN'); }
  catch (e) { log.push('✗ RM_MASTER_YARN: ' + e.message); Logger.log(e.stack); }

  try { updateRMWoven_V9_(ss); log.push('✓ RM_MASTER_WOVEN'); }
  catch (e) { log.push('✗ RM_MASTER_WOVEN: ' + e.message); Logger.log(e.stack); }

  try { updateTrimMaster_V9_(ss); log.push('✓ TRIM_MASTER'); }
  catch (e) { log.push('✗ TRIM_MASTER: ' + e.message); Logger.log(e.stack); }

  try { updateConsumableMaster_V9_(ss); log.push('✓ CONSUMABLE_MASTER'); }
  catch (e) { log.push('✗ CONSUMABLE_MASTER: ' + e.message); Logger.log(e.stack); }

  try { updatePackagingMaster_V9_(ss); log.push('✓ PACKAGING_MASTER'); }
  catch (e) { log.push('✗ PACKAGING_MASTER: ' + e.message); Logger.log(e.stack); }

  try { updateItemCategories_V9_(ss); log.push('✓ ITEM_CATEGORIES (138 rows)'); }
  catch (e) { log.push('✗ ITEM_CATEGORIES: ' + e.message); Logger.log(e.stack); }

  SpreadsheetApp.flush();
  ui.alert('V9 Update Results\n\n' + log.join('\n'));
}

/* ──────────────────────────────────────────────────────────────────
   HELPER: Find a column index by header text (row 2). Returns 1-based index or -1.
   ────────────────────────────────────────────────────────────────── */
function findColByHeader_(sheet, headerText) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return -1;
  var headers = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === headerText.trim()) return i + 1;
  }
  return -1;
}

/* ──────────────────────────────────────────────────────────────────
   HELPER: Insert one column at position colIndex (1-based).
   Sets row 1 banner formatting for new cell, row 2 header, row 3 description.
   ────────────────────────────────────────────────────────────────── */
function insertNewCol_(sheet, colIndex, header, description) {
  sheet.insertColumns(colIndex, 1);
  sheet.setColumnWidth(colIndex, 140);

  // Row 1: extend banner merge by re-merging (best effort)
  // Just apply the banner style to the new cell in row 1
  sheet.getRange(1, colIndex)
    .setBackground('#1A1A2E')
    .setFontColor('#FFFFFF')
    .setFontSize(12)
    .setFontWeight('bold');

  // Row 2: header
  sheet.getRange(2, colIndex)
    .setValue(header)
    .setBackground('#CC0000')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  // Row 3: description
  sheet.getRange(3, colIndex)
    .setValue(description)
    .setBackground('#D6EAF8')
    .setFontColor('#333333')
    .setFontStyle('italic')
    .setFontSize(8)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
}

/* ──────────────────────────────────────────────────────────────────
   HELPER: Apply dropdown validation to a column from row 4 downward.
   ────────────────────────────────────────────────────────────────── */
function applyDropdown_(sheet, colIndex, options) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(options, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(4, colIndex, 500, 1).setDataValidation(rule);
}

/* ──────────────────────────────────────────────────────────────────
   HELPER: Auto-fill a fixed value for all existing data rows (row 4 to lastRow).
   Green background = auto/read-only concept.
   ────────────────────────────────────────────────────────────────── */
function autoFillFixed_(sheet, colIndex, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 4) return;
  sheet.getRange(4, colIndex, lastRow - 3, 1)
    .setValue(value)
    .setBackground('#D5E8D4')  // light green = auto-filled / read-only concept
    .setFontColor('#2E7D32');
}

/* ──────────────────────────────────────────────────────────────────
   HELPER: Check if a column with this exact header already exists.
   ────────────────────────────────────────────────────────────────── */
function colExists_(sheet, headerText) {
  return findColByHeader_(sheet, headerText) !== -1;
}

/* ──────────────────────────────────────────────────────────────────
   1. ARTICLE_MASTER — +1 col: L3 Style (after L2 Product Category)
      ALSO: update L1 Division to dropdown (Men's/Women's/Kids/Unisex Apparel)
   ────────────────────────────────────────────────────────────────── */
function updateArticleMaster_V9_(ss) {
  var sheet = ss.getSheetByName('ARTICLE_MASTER');
  if (!sheet) throw new Error('Sheet not found: ARTICLE_MASTER');

  // --- L3 Style ---
  if (!colExists_(sheet, 'L3 Style')) {
    var l2Col = findColByHeader_(sheet, 'L2 Product Category');
    if (l2Col === -1) throw new Error('ARTICLE_MASTER: L2 Product Category column not found');
    var insertAt = l2Col + 1;
    insertNewCol_(sheet, insertAt, 'L3 Style',
      'Style type. Dropdown: Pique, Basic, Hoodie, Crew Neck, etc.');
    applyDropdown_(sheet, insertAt, V9_L3_ARTICLE);
    Logger.log('ARTICLE_MASTER: L3 Style inserted at col ' + insertAt);
  } else {
    Logger.log('ARTICLE_MASTER: L3 Style already exists — skipped');
  }

  // --- L1 Division: swap auto-fill to dropdown ---
  // Clear existing "Apparel" auto-fill and replace with dropdown
  var l1Col = findColByHeader_(sheet, 'L1 Division');
  if (l1Col !== -1) {
    // Remove old fixed "Apparel" fill, apply proper dropdown
    var lastRow = sheet.getLastRow();
    if (lastRow >= 4) {
      // Clear old background first (was set as auto-fill)
      var dataRange = sheet.getRange(4, l1Col, lastRow - 3, 1);
      // Update existing "Apparel" values to "Men's Apparel" (default — user can change)
      var vals = dataRange.getValues();
      for (var r = 0; r < vals.length; r++) {
        if (vals[r][0] === 'Apparel' || vals[r][0] === '') {
          vals[r][0] = "Men's Apparel";
        }
      }
      dataRange.setValues(vals).setBackground(null).setFontColor(null);
    }
    applyDropdown_(sheet, l1Col, V9_L1_ARTICLE);
    Logger.log('ARTICLE_MASTER: L1 Division updated to dropdown');
  }
}

/* ──────────────────────────────────────────────────────────────────
   2. RM_MASTER_FABRIC — +2 cols: L1 Division (col C), L2 Category (col D)
      Also: rename "KNIT NAME / STRUCTURE" → "L3 Knit Type" + add dropdown
   ────────────────────────────────────────────────────────────────── */
function updateRMFabric_V9_(ss) {
  var sheet = ss.getSheetByName('RM_MASTER_FABRIC');
  if (!sheet) throw new Error('Sheet not found: RM_MASTER_FABRIC');

  if (!colExists_(sheet, 'L1 Division') && !colExists_(sheet, 'L2 Category')) {
    // Find "∑ FINAL FABRIC SKU" (col B) — insert after it
    var anchorCol = findColByHeader_(sheet, '∑ FINAL FABRIC SKU');
    if (anchorCol === -1) {
      // Fallback: insert after col A (RM Code)
      anchorCol = findColByHeader_(sheet, '# RM Code');
      if (anchorCol === -1) anchorCol = 1;
    }

    // Insert L2 Category first (it will be pushed right when L1 is inserted)
    insertNewCol_(sheet, anchorCol + 1, 'L2 Category',
      'Auto: Knit Fabric. Read-only.');
    // Insert L1 Division before L2
    insertNewCol_(sheet, anchorCol + 1, 'L1 Division',
      'Auto: Raw Material. Read-only.');

    // Auto-fill L1 and L2 for all existing data rows
    autoFillFixed_(sheet, anchorCol + 1, 'Raw Material');
    autoFillFixed_(sheet, anchorCol + 2, 'Knit Fabric');

    Logger.log('RM_MASTER_FABRIC: L1 + L2 inserted after col ' + anchorCol);
  } else {
    Logger.log('RM_MASTER_FABRIC: L1/L2 already exist — skipped insertion');
  }

  // Rename "KNIT NAME / STRUCTURE" → "L3 Knit Type" and add dropdown
  var knitCol = findColByHeader_(sheet, 'KNIT NAME / STRUCTURE');
  if (knitCol === -1) knitCol = findColByHeader_(sheet, 'L3 Knit Type'); // already renamed?
  if (knitCol !== -1 && findColByHeader_(sheet, 'L3 Knit Type') === -1) {
    sheet.getRange(2, knitCol).setValue('L3 Knit Type');
    sheet.getRange(3, knitCol).setValue('Dropdown: fabric construction type.');
    applyDropdown_(sheet, knitCol, V9_L3_FABRIC);
    Logger.log('RM_MASTER_FABRIC: KNIT NAME renamed to L3 Knit Type at col ' + knitCol);
  } else if (knitCol !== -1) {
    // Ensure dropdown is applied even if already renamed
    applyDropdown_(sheet, knitCol, V9_L3_FABRIC);
  }
}

/* ──────────────────────────────────────────────────────────────────
   3. RM_MASTER_YARN — +3 cols: L1 Division (B), L2 Category (C), L3 Yarn Type (D)
   ────────────────────────────────────────────────────────────────── */
function updateRMYarn_V9_(ss) {
  var sheet = ss.getSheetByName('RM_MASTER_YARN');
  if (!sheet) throw new Error('Sheet not found: RM_MASTER_YARN');

  if (!colExists_(sheet, 'L1 Division') && !colExists_(sheet, 'L3 Yarn Type')) {
    var rmCodeCol = findColByHeader_(sheet, '# RM Code');
    if (rmCodeCol === -1) rmCodeCol = 1; // default to col A

    // Insert in reverse order so positions stay correct
    // Insert L3 Yarn Type at col B+3 (rightmost first)
    insertNewCol_(sheet, rmCodeCol + 1, 'L3 Yarn Type',
      'Dropdown: Cotton Combed, Polyester, PC Blend, etc.');
    // Insert L2 Category at col B+2
    insertNewCol_(sheet, rmCodeCol + 1, 'L2 Category',
      'Auto: Yarn. Read-only.');
    // Insert L1 Division at col B+1
    insertNewCol_(sheet, rmCodeCol + 1, 'L1 Division',
      'Auto: Raw Material. Read-only.');

    autoFillFixed_(sheet, rmCodeCol + 1, 'Raw Material');
    autoFillFixed_(sheet, rmCodeCol + 2, 'Yarn');
    applyDropdown_(sheet, rmCodeCol + 3, V9_L3_YARN);

    Logger.log('RM_MASTER_YARN: L1 + L2 + L3 inserted after col ' + rmCodeCol);
  } else {
    Logger.log('RM_MASTER_YARN: L1/L2/L3 already exist — skipped');
  }
}

/* ──────────────────────────────────────────────────────────────────
   4. RM_MASTER_WOVEN — +2 cols: L1 Division (B), L2 Category (C)
      Also: rename "Type" or "Woven Category" → "L3 Woven Type" + dropdown
   ────────────────────────────────────────────────────────────────── */
function updateRMWoven_V9_(ss) {
  var sheet = ss.getSheetByName('RM_MASTER_WOVEN');
  if (!sheet) throw new Error('Sheet not found: RM_MASTER_WOVEN');

  if (!colExists_(sheet, 'L1 Division') && !colExists_(sheet, 'L2 Category')) {
    var rmCodeCol = findColByHeader_(sheet, '# RM Code');
    if (rmCodeCol === -1) rmCodeCol = 1;

    // Insert L2 first (pushed right when L1 goes in)
    insertNewCol_(sheet, rmCodeCol + 1, 'L2 Category',
      'Auto: Woven / Interlining. Read-only.');
    // Insert L1 at position after RM Code
    insertNewCol_(sheet, rmCodeCol + 1, 'L1 Division',
      'Auto: Raw Material. Read-only.');

    autoFillFixed_(sheet, rmCodeCol + 1, 'Raw Material');
    autoFillFixed_(sheet, rmCodeCol + 2, 'Woven / Interlining');

    Logger.log('RM_MASTER_WOVEN: L1 + L2 inserted after col ' + rmCodeCol);
  } else {
    Logger.log('RM_MASTER_WOVEN: L1/L2 already exist — skipped');
  }

  // Rename "Type" / "Woven Category" → "L3 Woven Type" and add dropdown
  var typeCol = findColByHeader_(sheet, 'Woven Category');
  if (typeCol === -1) typeCol = findColByHeader_(sheet, 'Type');
  if (typeCol === -1) typeCol = findColByHeader_(sheet, 'L3 Woven Type');
  if (typeCol !== -1 && findColByHeader_(sheet, 'L3 Woven Type') === -1) {
    sheet.getRange(2, typeCol).setValue('L3 Woven Type');
    sheet.getRange(3, typeCol).setValue('Dropdown: Fusible, Non-Fusible, Woven Fabric, etc.');
    applyDropdown_(sheet, typeCol, V9_L3_WOVEN);
    Logger.log('RM_MASTER_WOVEN: Type/Woven Category renamed to L3 Woven Type at col ' + typeCol);
  } else if (typeCol !== -1) {
    applyDropdown_(sheet, typeCol, V9_L3_WOVEN);
  }
}

/* ──────────────────────────────────────────────────────────────────
   5. TRIM_MASTER — +1 col: L1 Division (before Trim Category)
   ────────────────────────────────────────────────────────────────── */
function updateTrimMaster_V9_(ss) {
  var sheet = ss.getSheetByName('TRIM_MASTER');
  if (!sheet) throw new Error('Sheet not found: TRIM_MASTER');

  if (colExists_(sheet, 'L1 Division')) {
    Logger.log('TRIM_MASTER: L1 Division already exists — skipped');
    return;
  }

  // Find "⚠ Trim Category" — insert L1 Division before it
  var catCol = findColByHeader_(sheet, '⚠ Trim Category');
  if (catCol === -1) catCol = findColByHeader_(sheet, 'Trim Category');
  if (catCol === -1) catCol = findColByHeader_(sheet, 'L2 Trim Category');
  if (catCol === -1) throw new Error('TRIM_MASTER: Could not find Trim Category column');

  insertNewCol_(sheet, catCol, 'L1 Division',
    'Auto: Trim. Read-only.');
  autoFillFixed_(sheet, catCol, 'Trim');

  // Update header of next col (old Trim Category) to show it's now L2
  var newCatCol = catCol + 1;
  var currentCatHeader = sheet.getRange(2, newCatCol).getValue();
  if (String(currentCatHeader).indexOf('L2') === -1) {
    sheet.getRange(2, newCatCol).setValue('L2 Trim Category');
    sheet.getRange(3, newCatCol).setValue('Dropdown category code: THD/LBL/ELS/ZIP/BUT/TPE/DRW/VLC/RVT/THP/OTH');
  }

  // Update next col (Trim Sub-Category) header if not already updated
  var subCatCol = catCol + 2;
  var subHeader = sheet.getRange(2, subCatCol).getValue();
  if (String(subHeader).indexOf('L3') === -1 && String(subHeader).toLowerCase().indexOf('sub') !== -1) {
    sheet.getRange(2, subCatCol).setValue('L3 Sub-Category');
    sheet.getRange(3, subCatCol).setValue('Dropdown: specific trim sub-type.');
  }

  Logger.log('TRIM_MASTER: L1 Division inserted at col ' + catCol);
}

/* ──────────────────────────────────────────────────────────────────
   6. CONSUMABLE_MASTER — +1 col: L1 Division (before Category)
   ────────────────────────────────────────────────────────────────── */
function updateConsumableMaster_V9_(ss) {
  var sheet = ss.getSheetByName('CONSUMABLE_MASTER');
  if (!sheet) throw new Error('Sheet not found: CONSUMABLE_MASTER');

  if (colExists_(sheet, 'L1 Division')) {
    Logger.log('CONSUMABLE_MASTER: L1 Division already exists — skipped');
    return;
  }

  var catCol = findColByHeader_(sheet, '⚠ Category');
  if (catCol === -1) catCol = findColByHeader_(sheet, 'Category');
  if (catCol === -1) catCol = findColByHeader_(sheet, 'L2 Category');
  if (catCol === -1) throw new Error('CONSUMABLE_MASTER: Could not find Category column');

  insertNewCol_(sheet, catCol, 'L1 Division',
    'Auto: Consumable. Read-only.');
  autoFillFixed_(sheet, catCol, 'Consumable');

  // Update old Category → L2 Category
  var newCatCol = catCol + 1;
  var currentHeader = sheet.getRange(2, newCatCol).getValue();
  if (String(currentHeader).indexOf('L2') === -1) {
    sheet.getRange(2, newCatCol).setValue('L2 Category');
    sheet.getRange(3, newCatCol).setValue('Dropdown: Softener, Fixer, Needle, Oil, Fuel, Cleaning, Other');
    applyDropdown_(sheet, newCatCol,
      ['Softener', 'Fixer', 'Needle', 'Oil', 'Fuel', 'Cleaning', 'Other']);
  }

  // Update Sub-Category → L3 Sub Type
  var subCatCol = catCol + 2;
  var subHeader = sheet.getRange(2, subCatCol).getValue();
  if (String(subHeader).toLowerCase().indexOf('sub') !== -1 && String(subHeader).indexOf('L3') === -1) {
    sheet.getRange(2, subCatCol).setValue('L3 Sub Type');
    sheet.getRange(3, subCatCol).setValue('Dropdown: specific consumable type.');
  }

  Logger.log('CONSUMABLE_MASTER: L1 Division inserted at col ' + catCol);
}

/* ──────────────────────────────────────────────────────────────────
   7. PACKAGING_MASTER — +1 col: L1 Division (before Category)
   ────────────────────────────────────────────────────────────────── */
function updatePackagingMaster_V9_(ss) {
  var sheet = ss.getSheetByName('PACKAGING_MASTER');
  if (!sheet) throw new Error('Sheet not found: PACKAGING_MASTER');

  if (colExists_(sheet, 'L1 Division')) {
    Logger.log('PACKAGING_MASTER: L1 Division already exists — skipped');
    return;
  }

  var catCol = findColByHeader_(sheet, '⚠ Category');
  if (catCol === -1) catCol = findColByHeader_(sheet, 'Category');
  if (catCol === -1) catCol = findColByHeader_(sheet, 'L2 Category');
  if (catCol === -1) throw new Error('PACKAGING_MASTER: Could not find Category column');

  insertNewCol_(sheet, catCol, 'L1 Division',
    'Auto: Packaging. Read-only.');
  autoFillFixed_(sheet, catCol, 'Packaging');

  // Update old Category → L2 Category
  var newCatCol = catCol + 1;
  var currentHeader = sheet.getRange(2, newCatCol).getValue();
  if (String(currentHeader).indexOf('L2') === -1) {
    sheet.getRange(2, newCatCol).setValue('L2 Category');
    sheet.getRange(3, newCatCol).setValue('Dropdown: Poly Bag, Carton, Hanger, Price Tag, Tissue, Sticker, Other');
    applyDropdown_(sheet, newCatCol,
      ['Poly Bag', 'Carton', 'Hanger', 'Price Tag', 'Tissue', 'Sticker', 'Other']);
  }

  // Update Sub-Category → L3 Sub-Category
  var subCatCol = catCol + 2;
  var subHeader = sheet.getRange(2, subCatCol).getValue();
  if (String(subHeader).toLowerCase().indexOf('sub') !== -1 && String(subHeader).indexOf('L3') === -1) {
    sheet.getRange(2, subCatCol).setValue('L3 Sub-Category');
    sheet.getRange(3, subCatCol).setValue('Dropdown: specific packaging type.');
  }

  Logger.log('PACKAGING_MASTER: L1 Division inserted at col ' + catCol);
}

/* ──────────────────────────────────────────────────────────────────
   8. ITEM_CATEGORIES — Rebuild to 138 rows with V9 CAT codes
      Clears rows 4+ and writes fresh V9 seed data.
      Col I (L1 Behavior) added if missing.
   ────────────────────────────────────────────────────────────────── */
function updateItemCategories_V9_(ss) {
  var sheet = ss.getSheetByName('ITEM_CATEGORIES');
  if (!sheet) throw new Error('Sheet not found: ITEM_CATEGORIES');

  // Add L1 Behavior column (col I) if not present
  if (!colExists_(sheet, 'L1 Behavior')) {
    insertNewCol_(sheet, 9, 'L1 Behavior',
      'FIXED = auto-set per master. SELECTABLE = user picks (Apparel only).');
    var behaviorRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['FIXED', 'SELECTABLE'], true).build();
    sheet.getRange(4, 9, 500, 1).setDataValidation(behaviorRule);
    Logger.log('ITEM_CATEGORIES: L1 Behavior column added at col 9');
  }

  // Clear all data rows (rows 4+) and replace with V9 seed data
  var lastRow = sheet.getLastRow();
  if (lastRow >= 4) {
    sheet.getRange(4, 1, lastRow - 3, sheet.getLastColumn()).clearContent();
  }

  var catData = getV9ItemCategorySeedData_();
  sheet.getRange(4, 1, catData.length, catData[0].length).setValues(catData);

  // Apply color coding by L1 group
  applyItemCategoryColors_(sheet, catData);

  Logger.log('ITEM_CATEGORIES: Rebuilt with ' + catData.length + ' rows (V9)');
}

/* ──────────────────────────────────────────────────────────────────
   COLOR CODING for ITEM_CATEGORIES rows by L1 group
   ────────────────────────────────────────────────────────────────── */
function applyItemCategoryColors_(sheet, catData) {
  var colorMap = {
    'ARTICLE':     '#FFF3E0',   // light orange — Apparel
    'RM-FABRIC':   '#E8F5E9',   // light green  — Raw Material Fabric
    'RM-YARN':     '#E3F2FD',   // light blue   — Raw Material Yarn
    'RM-WOVEN':    '#F3E5F5',   // light purple — Raw Material Woven
    'TRIM':        '#FCE4EC',   // light pink   — Trim
    'CONSUMABLE':  '#FFF8E1',   // light yellow — Consumable
    'PACKAGING':   '#E0F7FA'    // light cyan   — Packaging
  };

  for (var r = 0; r < catData.length; r++) {
    var master = catData[r][4]; // col E = Item Master Sheet
    var bg = colorMap[master] || '#FFFFFF';
    sheet.getRange(r + 4, 1, 1, catData[r].length).setBackground(bg);
  }
}

/* ──────────────────────────────────────────────────────────────────
   V9 ITEM_CATEGORIES SEED DATA — 138 rows
   Columns: Code, L1 Division, L2 Type, L3 Style, Master, HSN, Active, Remarks, Behavior
   Code numbering:
     ARTICLE:    CAT-001 to CAT-023
     RM-FABRIC:  CAT-100 to CAT-110
     RM-YARN:    CAT-120 to CAT-127
     RM-WOVEN:   CAT-140 to CAT-143
     TRIM:       CAT-200 to CAT-237
     CONSUMABLE: CAT-300 to CAT-325
     PACKAGING:  CAT-400 to CAT-427
   ────────────────────────────────────────────────────────────────── */
function getV9ItemCategorySeedData_() {
  return [
    // ── ARTICLE — SELECTABLE L1 — 23 rows ──
    ['CAT-001', "Men's Apparel", 'Tops - Polo', 'Pique Polo',              'ARTICLE', '6105', 'Yes', 'Classic polo',          'SELECTABLE'],
    ['CAT-002', "Men's Apparel", 'Tops - Polo', 'Autostriper Polo',         'ARTICLE', '6105', 'Yes', '',                      'SELECTABLE'],
    ['CAT-003', "Men's Apparel", 'Tops - Polo', 'Jacquard Polo',            'ARTICLE', '6105', 'Yes', '',                      'SELECTABLE'],
    ['CAT-004', "Men's Apparel", 'Tops - Tee',  'Round Neck Tee',           'ARTICLE', '6109', 'Yes', '',                      'SELECTABLE'],
    ['CAT-005', "Men's Apparel", 'Tops - Tee',  'V-Neck Tee',               'ARTICLE', '6109', 'Yes', '',                      'SELECTABLE'],
    ['CAT-006', "Men's Apparel", 'Tops - Tee',  'Henley Tee',               'ARTICLE', '6109', 'Yes', '',                      'SELECTABLE'],
    ['CAT-007', "Men's Apparel", 'Sweatshirt',  'Hoodie',                   'ARTICLE', '6110', 'Yes', '',                      'SELECTABLE'],
    ['CAT-008', "Men's Apparel", 'Sweatshirt',  'Crew Neck Sweatshirt',     'ARTICLE', '6110', 'Yes', '',                      'SELECTABLE'],
    ['CAT-009', "Men's Apparel", 'Sweatshirt',  'Quarter Zip',              'ARTICLE', '6110', 'Yes', '',                      'SELECTABLE'],
    ['CAT-010', "Men's Apparel", 'Tracksuit',   'Full Tracksuit',           'ARTICLE', '6112', 'Yes', '',                      'SELECTABLE'],
    ['CAT-011', "Men's Apparel", 'Tracksuit',   'Track Jacket',             'ARTICLE', '6112', 'Yes', '',                      'SELECTABLE'],
    ['CAT-012', "Men's Apparel", 'Tracksuit',   'Track Pant',               'ARTICLE', '6112', 'Yes', '',                      'SELECTABLE'],
    ['CAT-013', "Men's Apparel", 'Bottoms',     'Jogger',                   'ARTICLE', '6103', 'Yes', '',                      'SELECTABLE'],
    ['CAT-014', "Men's Apparel", 'Bottoms',     'Shorts',                   'ARTICLE', '6103', 'Yes', '',                      'SELECTABLE'],
    ['CAT-015', "Women's Apparel",'Tops - Tee', 'Round Neck Tee',           'ARTICLE', '6109', 'Yes', '',                      'SELECTABLE'],
    ['CAT-016', "Women's Apparel",'Tops - Tee', 'Crop Top',                 'ARTICLE', '6109', 'Yes', '',                      'SELECTABLE'],
    ['CAT-017', "Women's Apparel",'Sweatshirt', 'Hoodie',                   'ARTICLE', '6110', 'Yes', '',                      'SELECTABLE'],
    ['CAT-018', "Women's Apparel",'Bottoms',    'Jogger',                   'ARTICLE', '6103', 'Yes', '',                      'SELECTABLE'],
    ['CAT-019', 'Kids Apparel',  'Tops - Tee',  'Round Neck Tee',           'ARTICLE', '6109', 'Yes', '',                      'SELECTABLE'],
    ['CAT-020', 'Kids Apparel',  'Sweatshirt',  'Hoodie',                   'ARTICLE', '6110', 'Yes', '',                      'SELECTABLE'],
    ['CAT-021', 'Unisex Apparel','Tops - Tee',  'Oversized Tee',            'ARTICLE', '6109', 'Yes', '',                      'SELECTABLE'],
    ['CAT-022', 'Unisex Apparel','Sweatshirt',  'Hoodie',                   'ARTICLE', '6110', 'Yes', '',                      'SELECTABLE'],
    ['CAT-023', 'Unisex Apparel','Bottoms',     'Jogger',                   'ARTICLE', '6103', 'Yes', '',                      'SELECTABLE'],
    // ── RM-FABRIC — FIXED L1 — 11 rows (CAT-100 to CAT-110) ──
    ['CAT-100', 'Raw Material', 'Knit Fabric', 'Single Jersey',             'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-101', 'Raw Material', 'Knit Fabric', 'Pique',                    'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-102', 'Raw Material', 'Knit Fabric', 'Fleece',                   'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-103', 'Raw Material', 'Knit Fabric', 'French Terry',             'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-104', 'Raw Material', 'Knit Fabric', 'Rib',                      'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-105', 'Raw Material', 'Knit Fabric', 'Interlock',                'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-106', 'Raw Material', 'Knit Fabric', 'Autostriper',              'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-107', 'Raw Material', 'Knit Fabric', 'Waffle Knit',              'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-108', 'Raw Material', 'Knit Fabric', 'Lycra Jersey',             'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-109', 'Raw Material', 'Knit Fabric', 'Textured / Yarn Dyed',    'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    ['CAT-110', 'Raw Material', 'Knit Fabric', 'Other Knit',               'RM-FABRIC','6006','Yes', '',                      'FIXED'],
    // ── RM-YARN — FIXED L1 — 8 rows (CAT-120 to CAT-127) ──
    ['CAT-120', 'Raw Material', 'Yarn', 'Cotton Combed',                   'RM-YARN', '5205','Yes', '',                      'FIXED'],
    ['CAT-121', 'Raw Material', 'Yarn', 'Cotton Carded',                   'RM-YARN', '5205','Yes', '',                      'FIXED'],
    ['CAT-122', 'Raw Material', 'Yarn', 'Polyester',                       'RM-YARN', '5402','Yes', '',                      'FIXED'],
    ['CAT-123', 'Raw Material', 'Yarn', 'PC Blend',                        'RM-YARN', '5205','Yes', '',                      'FIXED'],
    ['CAT-124', 'Raw Material', 'Yarn', 'Viscose',                         'RM-YARN', '5510','Yes', '',                      'FIXED'],
    ['CAT-125', 'Raw Material', 'Yarn', 'Melange',                         'RM-YARN', '5205','Yes', '',                      'FIXED'],
    ['CAT-126', 'Raw Material', 'Yarn', 'Lycra / Spandex',                 'RM-YARN', '5402','Yes', '',                      'FIXED'],
    ['CAT-127', 'Raw Material', 'Yarn', 'Nylon',                           'RM-YARN', '5402','Yes', '',                      'FIXED'],
    // ── RM-WOVEN — FIXED L1 — 4 rows (CAT-140 to CAT-143) ──
    ['CAT-140', 'Raw Material', 'Woven / Interlining', 'Fusible Interlining',     'RM-WOVEN','5903','Yes', '',              'FIXED'],
    ['CAT-141', 'Raw Material', 'Woven / Interlining', 'Non-Fusible Interlining', 'RM-WOVEN','5903','Yes', '',              'FIXED'],
    ['CAT-142', 'Raw Material', 'Woven / Interlining', 'Woven Fabric',            'RM-WOVEN','5208','Yes', '',              'FIXED'],
    ['CAT-143', 'Raw Material', 'Woven / Interlining', 'Collar Canvas',           'RM-WOVEN','5903','Yes', '',              'FIXED'],
    // ── TRIM — FIXED L1 — 38 rows (CAT-200 to CAT-237) ──
    // Thread (THD) — 4
    ['CAT-200', 'Trim', 'Thread', 'Sewing Thread',                         'TRIM', '5204','Yes', '',                        'FIXED'],
    ['CAT-201', 'Trim', 'Thread', 'Overlock Thread',                       'TRIM', '5204','Yes', '',                        'FIXED'],
    ['CAT-202', 'Trim', 'Thread', 'Embroidery Thread',                     'TRIM', '5204','Yes', '',                        'FIXED'],
    ['CAT-203', 'Trim', 'Thread', 'Tacking Thread',                        'TRIM', '5204','Yes', '',                        'FIXED'],
    // Label (LBL) — 5
    ['CAT-204', 'Trim', 'Label', 'Main Label',                             'TRIM', '5807','Yes', '',                        'FIXED'],
    ['CAT-205', 'Trim', 'Label', 'Care Label',                             'TRIM', '5807','Yes', '',                        'FIXED'],
    ['CAT-206', 'Trim', 'Label', 'Size Label',                             'TRIM', '5807','Yes', '',                        'FIXED'],
    ['CAT-207', 'Trim', 'Label', 'Hang Tag',                               'TRIM', '5807','Yes', '',                        'FIXED'],
    ['CAT-208', 'Trim', 'Label', 'Badge / Woven Badge',                    'TRIM', '5807','Yes', '',                        'FIXED'],
    // Elastic (ELS) — 3
    ['CAT-209', 'Trim', 'Elastic', 'Crochet Elastic',                      'TRIM', '5604','Yes', '',                        'FIXED'],
    ['CAT-210', 'Trim', 'Elastic', 'Knitted Elastic',                      'TRIM', '5604','Yes', '',                        'FIXED'],
    ['CAT-211', 'Trim', 'Elastic', 'Flat / Woven Elastic',                 'TRIM', '5604','Yes', '',                        'FIXED'],
    // Zipper (ZIP) — 3
    ['CAT-212', 'Trim', 'Zipper', 'Dress Zipper',                          'TRIM', '9607','Yes', '',                        'FIXED'],
    ['CAT-213', 'Trim', 'Zipper', 'Open-End Zipper',                       'TRIM', '9607','Yes', '',                        'FIXED'],
    ['CAT-214', 'Trim', 'Zipper', 'Invisible Zipper',                      'TRIM', '9607','Yes', '',                        'FIXED'],
    // Button (BUT) — 4
    ['CAT-215', 'Trim', 'Button', 'Flat Button',                           'TRIM', '9606','Yes', '',                        'FIXED'],
    ['CAT-216', 'Trim', 'Button', 'Snap Button',                           'TRIM', '9606','Yes', '',                        'FIXED'],
    ['CAT-217', 'Trim', 'Button', 'Shank Button',                          'TRIM', '9606','Yes', '',                        'FIXED'],
    ['CAT-218', 'Trim', 'Button', 'Toggle Button',                         'TRIM', '9606','Yes', '',                        'FIXED'],
    // Tape (TPE) — 4
    ['CAT-219', 'Trim', 'Tape', 'Twill Tape',                              'TRIM', '5806','Yes', '',                        'FIXED'],
    ['CAT-220', 'Trim', 'Tape', 'Herringbone Tape',                        'TRIM', '5806','Yes', '',                        'FIXED'],
    ['CAT-221', 'Trim', 'Tape', 'Satin Ribbon Tape',                       'TRIM', '5806','Yes', '',                        'FIXED'],
    ['CAT-222', 'Trim', 'Tape', 'Reflective Tape',                         'TRIM', '5806','Yes', '',                        'FIXED'],
    // Drawcord (DRW) — 3
    ['CAT-223', 'Trim', 'Drawcord', 'Flat Drawcord',                       'TRIM', '5604','Yes', '',                        'FIXED'],
    ['CAT-224', 'Trim', 'Drawcord', 'Round Drawcord',                      'TRIM', '5604','Yes', '',                        'FIXED'],
    ['CAT-225', 'Trim', 'Drawcord', 'Braided Drawcord',                    'TRIM', '5604','Yes', '',                        'FIXED'],
    // Velcro (VLC) — 3
    ['CAT-226', 'Trim', 'Velcro', 'Sew-On Velcro',                         'TRIM', '5806','Yes', '',                        'FIXED'],
    ['CAT-227', 'Trim', 'Velcro', 'Self-Adhesive Velcro',                  'TRIM', '5806','Yes', '',                        'FIXED'],
    ['CAT-228', 'Trim', 'Velcro', 'Iron-On Velcro',                        'TRIM', '5806','Yes', '',                        'FIXED'],
    // Rivet / Eyelet (RVT) — 3
    ['CAT-229', 'Trim', 'Rivet / Eyelet', 'Metal Rivet',                   'TRIM', '8308','Yes', '',                        'FIXED'],
    ['CAT-230', 'Trim', 'Rivet / Eyelet', 'Brass Eyelet',                  'TRIM', '8308','Yes', '',                        'FIXED'],
    ['CAT-231', 'Trim', 'Rivet / Eyelet', 'Plastic Eyelet',                'TRIM', '8308','Yes', '',                        'FIXED'],
    // Neck / Shoulder Tape (THP) — 2
    ['CAT-232', 'Trim', 'Neck / Shoulder Tape', 'Neck Tape',               'TRIM', '5806','Yes', '',                        'FIXED'],
    ['CAT-233', 'Trim', 'Neck / Shoulder Tape', 'Shoulder Tape',           'TRIM', '5806','Yes', '',                        'FIXED'],
    // Other (OTH) — 4
    ['CAT-234', 'Trim', 'Other', 'Hang Tag String',                        'TRIM', '6307','Yes', '',                        'FIXED'],
    ['CAT-235', 'Trim', 'Other', 'Polybag Clip',                           'TRIM', '6307','Yes', '',                        'FIXED'],
    ['CAT-236', 'Trim', 'Other', 'Safety Pin',                             'TRIM', '7317','Yes', '',                        'FIXED'],
    ['CAT-237', 'Trim', 'Other', 'Other Trim',                             'TRIM', '6307','Yes', '',                        'FIXED'],
    // ── CONSUMABLE — FIXED L1 — 26 rows (CAT-300 to CAT-325) ──
    // Softener — 4
    ['CAT-300', 'Consumable', 'Softener', 'Silicone Softener',             'CONSUMABLE','3402','Yes','',                    'FIXED'],
    ['CAT-301', 'Consumable', 'Softener', 'Cationic Softener',             'CONSUMABLE','3402','Yes','',                    'FIXED'],
    ['CAT-302', 'Consumable', 'Softener', 'Non-Ionic Softener',            'CONSUMABLE','3402','Yes','',                    'FIXED'],
    ['CAT-303', 'Consumable', 'Softener', 'Hydrophilic Softener',          'CONSUMABLE','3402','Yes','',                    'FIXED'],
    // Fixer — 4
    ['CAT-304', 'Consumable', 'Fixer', 'Cationic Fixer',                   'CONSUMABLE','3402','Yes','',                    'FIXED'],
    ['CAT-305', 'Consumable', 'Fixer', 'Anionic Fixer',                    'CONSUMABLE','3402','Yes','',                    'FIXED'],
    ['CAT-306', 'Consumable', 'Fixer', 'Reactive Dye Fixer',               'CONSUMABLE','3402','Yes','',                    'FIXED'],
    ['CAT-307', 'Consumable', 'Fixer', 'Colour Fixing Agent',              'CONSUMABLE','3402','Yes','',                    'FIXED'],
    // Needle — 4
    ['CAT-308', 'Consumable', 'Needle', 'DB x1 Sewing Needle',            'CONSUMABLE','7319','Yes','',                    'FIXED'],
    ['CAT-309', 'Consumable', 'Needle', 'DC x27 Overlock Needle',         'CONSUMABLE','7319','Yes','',                    'FIXED'],
    ['CAT-310', 'Consumable', 'Needle', 'UY x128 Chain Stitch Needle',    'CONSUMABLE','7319','Yes','',                    'FIXED'],
    ['CAT-311', 'Consumable', 'Needle', 'DP x5 Button Stitch Needle',     'CONSUMABLE','7319','Yes','',                    'FIXED'],
    // Oil — 3
    ['CAT-312', 'Consumable', 'Oil', 'Mineral Oil',                        'CONSUMABLE','2710','Yes','',                    'FIXED'],
    ['CAT-313', 'Consumable', 'Oil', 'Sewing Machine Oil',                 'CONSUMABLE','2710','Yes','',                    'FIXED'],
    ['CAT-314', 'Consumable', 'Oil', 'Knitting Machine Oil',               'CONSUMABLE','2710','Yes','',                    'FIXED'],
    // Fuel — 3
    ['CAT-315', 'Consumable', 'Fuel', 'LPG',                               'CONSUMABLE','2711','Yes','',                    'FIXED'],
    ['CAT-316', 'Consumable', 'Fuel', 'Diesel',                            'CONSUMABLE','2710','Yes','',                    'FIXED'],
    ['CAT-317', 'Consumable', 'Fuel', 'HSD',                               'CONSUMABLE','2710','Yes','Heavy speed diesel', 'FIXED'],
    // Cleaning — 4
    ['CAT-318', 'Consumable', 'Cleaning', 'Degreaser',                     'CONSUMABLE','3402','Yes','',                    'FIXED'],
    ['CAT-319', 'Consumable', 'Cleaning', 'Fabric Stain Remover',          'CONSUMABLE','3402','Yes','',                    'FIXED'],
    ['CAT-320', 'Consumable', 'Cleaning', 'Bleach',                        'CONSUMABLE','2828','Yes','',                    'FIXED'],
    ['CAT-321', 'Consumable', 'Cleaning', 'Sanitizer',                     'CONSUMABLE','3808','Yes','',                    'FIXED'],
    // Other — 4
    ['CAT-322', 'Consumable', 'Other', 'Desiccant / Silica Gel',           'CONSUMABLE','3824','Yes','',                    'FIXED'],
    ['CAT-323', 'Consumable', 'Other', 'Stretch Film',                     'CONSUMABLE','3920','Yes','',                    'FIXED'],
    ['CAT-324', 'Consumable', 'Other', 'Velcro Strip (Consumable)',        'CONSUMABLE','5806','Yes','',                    'FIXED'],
    ['CAT-325', 'Consumable', 'Other', 'Other Consumable',                 'CONSUMABLE','6307','Yes','',                    'FIXED'],
    // ── PACKAGING — FIXED L1 — 28 rows (CAT-400 to CAT-427) ──
    // Poly Bag — 5
    ['CAT-400', 'Packaging', 'Poly Bag', 'LDPE Flat Bag',                  'PACKAGING','3923','Yes','',                    'FIXED'],
    ['CAT-401', 'Packaging', 'Poly Bag', 'HDPE Bag',                       'PACKAGING','3923','Yes','',                    'FIXED'],
    ['CAT-402', 'Packaging', 'Poly Bag', 'Dispatch Bag',                   'PACKAGING','3923','Yes','',                    'FIXED'],
    ['CAT-403', 'Packaging', 'Poly Bag', 'Garment Cover Bag',              'PACKAGING','3923','Yes','',                    'FIXED'],
    ['CAT-404', 'Packaging', 'Poly Bag', 'Zip-Lock Bag',                   'PACKAGING','3923','Yes','',                    'FIXED'],
    // Carton — 4
    ['CAT-405', 'Packaging', 'Carton', 'Export Carton',                    'PACKAGING','4819','Yes','',                    'FIXED'],
    ['CAT-406', 'Packaging', 'Carton', 'Master Carton',                    'PACKAGING','4819','Yes','',                    'FIXED'],
    ['CAT-407', 'Packaging', 'Carton', 'Inner Box',                        'PACKAGING','4819','Yes','',                    'FIXED'],
    ['CAT-408', 'Packaging', 'Carton', 'Display Box',                      'PACKAGING','4819','Yes','',                    'FIXED'],
    // Hanger — 4
    ['CAT-409', 'Packaging', 'Hanger', 'Plastic Hanger',                   'PACKAGING','3926','Yes','',                    'FIXED'],
    ['CAT-410', 'Packaging', 'Hanger', 'Velvet Hanger',                    'PACKAGING','3926','Yes','',                    'FIXED'],
    ['CAT-411', 'Packaging', 'Hanger', 'Wooden Hanger',                    'PACKAGING','4421','Yes','',                    'FIXED'],
    ['CAT-412', 'Packaging', 'Hanger', 'Metal Hanger',                     'PACKAGING','7323','Yes','',                    'FIXED'],
    // Price Tag — 4
    ['CAT-413', 'Packaging', 'Price Tag', 'Swing Tag',                     'PACKAGING','4821','Yes','',                    'FIXED'],
    ['CAT-414', 'Packaging', 'Price Tag', 'Barcode Label',                 'PACKAGING','4821','Yes','',                    'FIXED'],
    ['CAT-415', 'Packaging', 'Price Tag', 'MRP Sticker',                   'PACKAGING','4821','Yes','',                    'FIXED'],
    ['CAT-416', 'Packaging', 'Price Tag', 'Hologram Label',                'PACKAGING','4821','Yes','',                    'FIXED'],
    // Tissue — 3
    ['CAT-417', 'Packaging', 'Tissue', 'Branded Tissue',                   'PACKAGING','4818','Yes','',                    'FIXED'],
    ['CAT-418', 'Packaging', 'Tissue', 'Plain Tissue',                     'PACKAGING','4818','Yes','',                    'FIXED'],
    ['CAT-419', 'Packaging', 'Tissue', 'Kraft Paper',                      'PACKAGING','4804','Yes','',                    'FIXED'],
    // Sticker — 3
    ['CAT-420', 'Packaging', 'Sticker', 'Size Sticker',                    'PACKAGING','4821','Yes','',                    'FIXED'],
    ['CAT-421', 'Packaging', 'Sticker', 'Country of Origin Sticker',       'PACKAGING','4821','Yes','',                    'FIXED'],
    ['CAT-422', 'Packaging', 'Sticker', 'Carton Marking Sticker',          'PACKAGING','4821','Yes','',                    'FIXED'],
    // Other — 5
    ['CAT-423', 'Packaging', 'Other', 'Bubble Wrap',                       'PACKAGING','3923','Yes','',                    'FIXED'],
    ['CAT-424', 'Packaging', 'Other', 'Foam Sheet',                        'PACKAGING','3921','Yes','',                    'FIXED'],
    ['CAT-425', 'Packaging', 'Other', 'Packing Tape',                      'PACKAGING','3919','Yes','',                    'FIXED'],
    ['CAT-426', 'Packaging', 'Other', 'Strapping Band',                    'PACKAGING','3923','Yes','',                    'FIXED'],
    ['CAT-427', 'Packaging', 'Other', 'Other Packaging',                   'PACKAGING','6307','Yes','',                    'FIXED'],
  ];
}

/* ──────────────────────────────────────────────────────────────────
   STANDALONE: Re-seed ITEM_CATEGORIES only (no other changes)
   Run from Apps Script: seedItemCategoriesV9
   ────────────────────────────────────────────────────────────────── */
function seedItemCategoriesV9() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    'Re-Seed ITEM_CATEGORIES (V9)',
    'This will clear all existing category rows (row 4+) and write 138 rows of V9 data.\nContinue?',
    ui.ButtonSet.YES_NO
  );
  if (result !== ui.Button.YES) return;
  updateItemCategories_V9_(ss);
  SpreadsheetApp.flush();
  ui.alert('ITEM_CATEGORIES seeded with 138 V9 rows.');
}
