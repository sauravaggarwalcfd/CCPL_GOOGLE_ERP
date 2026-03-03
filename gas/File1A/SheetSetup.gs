/**
 * ============================================================
 * CONFIDENCE CLOTHING — ERP FILE 1A
 * Sheet Structure Setup & Formatting
 * ============================================================
 * Creates all 23 sheets with proper headers, descriptions,
 * formatting, data validation, and tab colors.
 * ============================================================
 */

/* ───────────────────────────────────────────────────────────
   MASTER SETUP — Creates/formats all File 1A sheets
   ─────────────────────────────────────────────────────────── */
/* ───────────────────────────────────────────────────────────
   V10 PATCH — Run this to apply V10 changes to an existing sheet.
   Creates ARTICLE_DROPDOWNS, rebuilds ITEM_CATEGORIES (column-grouped),
   and refreshes ARTICLE_MASTER dropdown validations.
   ─────────────────────────────────────────────────────────── */
function applyV10Updates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('V10: Starting updates...');

  // 1. Create ARTICLE_DROPDOWNS sheet (new)
  setupArticleDropdowns_(ss);
  Logger.log('V10: ARTICLE_DROPDOWNS created.');

  // 2. Rebuild ITEM_CATEGORIES in column-grouped format
  //    NOTE: Only writes seed data if sheet has < 4 rows.
  //    If old data exists, delete rows 4+ manually first, or delete the sheet.
  setupItemCategories_(ss);
  Logger.log('V10: ITEM_CATEGORIES rebuilt (column-grouped).');

  // 3. Refresh ARTICLE_MASTER dropdown validations (reads from new sources)
  setupArticleMaster_(ss);
  Logger.log('V10: ARTICLE_MASTER dropdowns refreshed.');

  // 4. Refresh other masters (TRIM/CONSUMABLE/PACKAGING read from new ITEM_CATEGORIES)
  setupTrimMaster_(ss);
  setupConsumableMaster_(ss);
  setupPackagingMaster_(ss);
  setupRMFabric_(ss);
  setupRMYarn_(ss);
  setupRMWoven_(ss);
  Logger.log('V10: All master dropdowns refreshed.');

  SpreadsheetApp.flush();
  Logger.log('V10: All updates complete!');
}

/* ───────────────────────────────────────────────────────────
   V13 PATCH — Adds yarn name dropdown to RM_MASTER_FABRIC col G.
   Run this once on existing sheets to enable multi-select.
   ─────────────────────────────────────────────────────────── */
function applyV13YarnDropdown() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fabricSheet = ss.getSheetByName(CONFIG.SHEETS.RM_MASTER_FABRIC);
  var yarnSheet   = ss.getSheetByName(CONFIG.SHEETS.RM_MASTER_YARN);
  if (!fabricSheet || !yarnSheet) {
    Logger.log('V13: Missing FABRIC or YARN sheet — aborting.');
    return;
  }
  var yarnLastRow = Math.max(yarnSheet.getLastRow(), 4);
  var yarnNameRange = yarnSheet.getRange(4, 5, yarnLastRow - 3, 1); // col E = Yarn Name
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(yarnNameRange, true)
    .setAllowInvalid(true)
    .build();
  fabricSheet.getRange(4, 7, 500, 1).setDataValidation(rule);
  SpreadsheetApp.flush();
  Logger.log('V13: Yarn name dropdown applied to RM_MASTER_FABRIC col G (⟷ YARN COMPOSITION).');
  Logger.log('V13: Multi-select is handled by onEdit toggle — picks append with | separator.');
  Logger.log('V13: Col F (← Yarn Codes) auto-fills with comma-separated codes.');
}

/* ───────────────────────────────────────────────────────────
   MASTER SETUP — Creates/formats all File 1A sheets (fresh install)
   ─────────────────────────────────────────────────────────── */
function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  setupArticleMaster_(ss);
  setupRMFabric_(ss);
  setupRMYarn_(ss);
  setupRMWoven_(ss);
  setupTrimMaster_(ss);
  setupTrimAttrNames_(ss);
  setupTrimAttrValues_(ss);
  setupConsumableMaster_(ss);
  setupConAttrNames_(ss);
  setupConAttrValues_(ss);
  setupPackagingMaster_(ss);
  setupPkgAttrNames_(ss);
  setupPkgAttrValues_(ss);
  setupItemCategories_(ss);
  setupArticleDropdowns_(ss);
  setupUOMMaster_(ss);
  setupHSNMaster_(ss);
  setupColorMaster_(ss);
  setupSizeMaster_(ss);
  setupFabricTypeMaster_(ss);
  setupTagMaster_(ss);
  setupItemChangeLog_(ss);
  setupMasterRelations_(ss);

  // Delete temp sheet created during old-sheet deletion
  deleteTempSheet_(ss);

  SpreadsheetApp.flush();
  Logger.log('All 22 FILE 1A sheets setup complete.');
}

/* ───────────────────────────────────────────────────────────
   HELPER: Get or create sheet
   ─────────────────────────────────────────────────────────── */
function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/* ───────────────────────────────────────────────────────────
   HELPER: Apply standard formatting to a sheet
   Row 1: Banner (dark bg, white text, merged)
   Row 2: Headers (red bg #CC0000, white bold, frozen)
   Row 3: Descriptions (light blue #D6EAF8, italic, frozen)
   Freeze at A4
   ─────────────────────────────────────────────────────────── */
function applyStandardFormat_(sheet, bannerText, headers, descriptions, tabColor) {
  var numCols = headers.length;

  // Ensure enough columns
  if (sheet.getMaxColumns() < numCols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), numCols - sheet.getMaxColumns());
  }

  // Row 1: Banner
  sheet.getRange(1, 1).setValue(bannerText);
  if (numCols > 1) {
    sheet.getRange(1, 1, 1, numCols).merge();
  }
  sheet.getRange(1, 1, 1, numCols)
    .setBackground('#1A1A2E')
    .setFontColor('#FFFFFF')
    .setFontSize(12)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);

  // Row 2: Headers
  for (var i = 0; i < numCols; i++) {
    sheet.getRange(2, i + 1).setValue(headers[i]);
  }
  sheet.getRange(2, 1, 1, numCols)
    .setBackground('#CC0000')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setRowHeight(2, 35);

  // Row 3: Descriptions
  for (var i = 0; i < numCols; i++) {
    sheet.getRange(3, i + 1).setValue(descriptions[i] || '');
  }
  sheet.getRange(3, 1, 1, numCols)
    .setBackground('#D6EAF8')
    .setFontColor('#333333')
    .setFontStyle('italic')
    .setFontSize(8)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setRowHeight(3, 30);

  // Freeze rows 1-3
  sheet.setFrozenRows(3);

  // Tab color
  if (tabColor) {
    sheet.setTabColor(tabColor);
  }

  // Auto-resize columns
  for (var i = 1; i <= numCols; i++) {
    sheet.setColumnWidth(i, 140);
  }
}

/* ───────────────────────────────────────────────────────────
   HELPER: Set dropdown validation on a column
   ─────────────────────────────────────────────────────────── */
function setColumnValidation_(sheet, col, values, startRow) {
  startRow = startRow || 4;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, col, 500, 1).setDataValidation(rule);
}

/* ───────────────────────────────────────────────────────────
   HELPER: Read ITEM_CATEGORIES (V10 column-grouped layout) and return
   dropdown lists for a given master.
   Column groups: ARTICLE=B,C,D  FABRIC=E,F,G  YARN=H,I,J
                  WOVEN=K,L,M    TRIM=N,O,P    CONSUMABLE=Q,R,S
                  PACKAGING=T,U,V
   Returns { l1: string[], l2Flat: string[], l3Flat: string[],
             l2Map: { [l1]: string[] }, l3Map: { [l2]: string[] } }
   ─────────────────────────────────────────────────────────── */
function getCategoryDropdownsForMaster_(ss, masterKey) {
  // Map master key to column offset (1-based: B=2, C=3, D=4, ...)
  var COL_MAP = {
    'ARTICLE':    2,
    'RM-FABRIC':  5,
    'RM-YARN':    8,
    'RM-WOVEN':   11,
    'TRIM':       14,
    'CONSUMABLE': 17,
    'PACKAGING':  20
  };
  var startCol = COL_MAP[masterKey];
  if (!startCol) return { l1: [], l2Flat: [], l3Flat: [], l2Map: {}, l3Map: {} };

  var catSheet = ss.getSheetByName(CONFIG.SHEETS.ITEM_CATEGORIES);
  if (!catSheet) return { l1: [], l2Flat: [], l3Flat: [], l2Map: {}, l3Map: {} };

  var lastRow = catSheet.getLastRow();
  if (lastRow < 4) return { l1: [], l2Flat: [], l3Flat: [], l2Map: {}, l3Map: {} };

  // Read the 3 columns for this master (startCol = L1, startCol+1 = L2, startCol+2 = L3)
  var numRows = lastRow - 3;
  var data = catSheet.getRange(4, startCol, numRows, 3).getValues();
  var l1Set = [];
  var l2Map = {};  // l1 → [l2 values]
  var l3Map = {};  // l2 → [l3 values]

  for (var i = 0; i < data.length; i++) {
    var l1 = String(data[i][0]).trim();
    var l2 = String(data[i][1]).trim();
    var l3 = String(data[i][2]).trim();
    if (!l1 && !l2 && !l3) continue;  // empty row for this master

    if (l1 && l1Set.indexOf(l1) === -1) l1Set.push(l1);
    if (l1 && l2) {
      if (!l2Map[l1]) l2Map[l1] = [];
      if (l2Map[l1].indexOf(l2) === -1) l2Map[l1].push(l2);
    }
    if (l2 && l3) {
      if (!l3Map[l2]) l3Map[l2] = [];
      if (l3Map[l2].indexOf(l3) === -1) l3Map[l2].push(l3);
    }
  }

  // Flatten l2/l3 into unique arrays for static dropdown (non-cascading sheet validation)
  var allL2 = [];
  for (var k1 in l2Map) { for (var j = 0; j < l2Map[k1].length; j++) { if (allL2.indexOf(l2Map[k1][j]) === -1) allL2.push(l2Map[k1][j]); } }
  var allL3 = [];
  for (var k2 in l3Map) { for (var j2 = 0; j2 < l3Map[k2].length; j2++) { if (allL3.indexOf(l3Map[k2][j2]) === -1) allL3.push(l3Map[k2][j2]); } }

  return { l1: l1Set, l2Flat: allL2, l3Flat: allL3, l2Map: l2Map, l3Map: l3Map };
}

/* ═══════════════════════════════════════════════════════════
   INDIVIDUAL SHEET SETUP FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

/* ── 01. ARTICLE_MASTER (27 cols) — V9: +1 col L3 Style at col I ── */
function setupArticleMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.ARTICLE_MASTER);
  var headers = [
    '🔑 Article Code', 'Article Description', 'Short Name', 'IMAGE LINK',
    '⟷ SKETCH DRIVE LINKS', 'Buyer Style No', 'L1 Division',
    'L2 Product Category', 'L3 Style',
    'Season', 'Gender', 'Fit Type', 'Neckline',
    'Sleeve Type', '→ MAIN FABRIC USED', '← Fabric Name (Auto)',
    'Colour Name(s)', 'Size Range', '∑ FINAL MARKUP %', '∑ FINAL MARKDOWN %',
    'W.S.P (Rs)', 'MRP (Rs)', '→ HSN Code', '← GST % (Auto)',
    'Status', 'Remarks', '⟷ Tags'
  ];
  var descriptions = [
    '4-5 digits + 2 CAPS. No space. Manual.', 'Full name with construction', 'Max 25 chars',
    'Google Drive link', 'Popup log. Appends only.', 'Optional buyer ref',
    'Dropdown: Men\'s/Women\'s/Kids/Unisex Apparel', 'Dropdown: Tops/Sweatshirt/Tracksuit/Bottoms',
    'Dropdown: style type (Pique, Hoodie, Crew Neck, etc.)',
    'Multi-select', 'Dropdown', 'Dropdown',
    'Dropdown', 'Dropdown', 'FK → RM_MASTER_FABRIC', 'Auto-filled by GAS',
    'Dropdown → COLOR_MASTER names', 'Dropdown → ARTICLE_DROPDOWNS col G', '(MRP−WSP)÷WSP×100',
    '(MRP−WSP)÷MRP×100', 'Wholesale price/pc', 'Max retail price',
    'FK → HSN_MASTER', 'Auto from HSN', 'Active/Inactive/Dev/Discontinued',
    'Notes', 'Multi-select → TAG_MASTER'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — ARTICLE_MASTER — Finished Garments',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Validations — L1/L2/L3 from ITEM_CATEGORIES grouped by master=ARTICLE
  var catDropdowns = getCategoryDropdownsForMaster_(ss, 'ARTICLE');
  if (catDropdowns.l1.length > 0) {
    setColumnValidation_(sheet, 7, catDropdowns.l1);
  } else {
    setColumnValidation_(sheet, 7, ["Men's Apparel", "Women's Apparel", "Kids Apparel", "Unisex Apparel"]);
  }
  if (catDropdowns.l2Flat.length > 0) {
    setColumnValidation_(sheet, 8, catDropdowns.l2Flat);
  } else {
    setColumnValidation_(sheet, 8, ['Tops - Polo', 'Tops - Tee', 'Sweatshirt', 'Tracksuit', 'Bottoms']);
  }
  if (catDropdowns.l3Flat.length > 0) {
    setColumnValidation_(sheet, 9, catDropdowns.l3Flat);
  } else {
    setColumnValidation_(sheet, 9, ['Pique Polo', 'Round Neck Tee', 'Hoodie', 'Jogger']);
  }
  // Read other dropdowns from ARTICLE_DROPDOWNS sheet (single source of truth)
  // Columns: A=Gender, B=Fit, C=Neckline, D=Sleeve, E=Status, F=Season, G=Size Range
  var ddSheet = ss.getSheetByName('ARTICLE_DROPDOWNS');
  if (ddSheet && ddSheet.getLastRow() >= 4) {
    var ddCols = Math.min(ddSheet.getLastColumn(), 7);
    var ddRows = ddSheet.getRange(4, 1, ddSheet.getLastRow() - 3, ddCols).getValues();
    var genderOpts = [], fitOpts = [], neckOpts = [], sleeveOpts = [], statusOpts = [], sizeOpts = [];
    for (var d = 0; d < ddRows.length; d++) {
      if (String(ddRows[d][0]).trim()) genderOpts.push(String(ddRows[d][0]).trim());
      if (String(ddRows[d][1]).trim()) fitOpts.push(String(ddRows[d][1]).trim());
      if (String(ddRows[d][2]).trim()) neckOpts.push(String(ddRows[d][2]).trim());
      if (String(ddRows[d][3]).trim()) sleeveOpts.push(String(ddRows[d][3]).trim());
      if (String(ddRows[d][4]).trim()) statusOpts.push(String(ddRows[d][4]).trim());
      if (ddCols >= 7 && String(ddRows[d][6]).trim()) sizeOpts.push(String(ddRows[d][6]).trim());
    }
    setColumnValidation_(sheet, 11, genderOpts.length ? genderOpts : ['Men', 'Women', 'Kids', 'Unisex']);
    setColumnValidation_(sheet, 12, fitOpts.length ? fitOpts : ['Regular', 'Slim', 'Relaxed', 'Oversized', 'Athletic']);
    setColumnValidation_(sheet, 13, neckOpts.length ? neckOpts : ['Round Neck', 'V-Neck', 'Collar', 'Hooded', 'Mock Neck']);
    setColumnValidation_(sheet, 14, sleeveOpts.length ? sleeveOpts : ['Half', 'Full', 'Sleeveless', '3-4', 'Raglan']);
    setColumnValidation_(sheet, 25, statusOpts.length ? statusOpts : CONFIG.STATUS_LIST);
    // V12.5: Col R (18) = Size Range dropdown from ARTICLE_DROPDOWNS col G
    if (sizeOpts.length > 0) {
      setColumnValidation_(sheet, 18, sizeOpts);
    } else {
      setColumnValidation_(sheet, 18, ['S-M-L-XL-XXL', 'S-M-L-XL', 'M-L-XL-XXL', 'XS-S-M-L-XL', 'Free Size']);
    }
  } else {
    setColumnValidation_(sheet, 11, ['Men', 'Women', 'Kids', 'Unisex']);
    setColumnValidation_(sheet, 12, ['Regular', 'Slim', 'Relaxed', 'Oversized', 'Athletic']);
    setColumnValidation_(sheet, 13, ['Round Neck', 'V-Neck', 'Collar', 'Hooded', 'Mock Neck']);
    setColumnValidation_(sheet, 14, ['Half', 'Full', 'Sleeveless', '3-4', 'Raglan']);
    setColumnValidation_(sheet, 25, CONFIG.STATUS_LIST);
    setColumnValidation_(sheet, 18, ['S-M-L-XL-XXL', 'S-M-L-XL', 'M-L-XL-XXL', 'XS-S-M-L-XL', 'Free Size']);
  }

  // V12.5: Col Q (17) = Colour Name(s) dropdown from COLOR_MASTER col B
  var colorSheet = ss.getSheetByName(CONFIG.SHEETS.COLOR_MASTER);
  if (colorSheet && colorSheet.getLastRow() >= 4) {
    var colorData = colorSheet.getRange(4, 2, colorSheet.getLastRow() - 3, 1).getValues();
    var colorNames = [];
    for (var cn = 0; cn < colorData.length; cn++) {
      var cName = String(colorData[cn][0]).trim();
      if (cName) colorNames.push(cName);
    }
    if (colorNames.length > 0) {
      setColumnValidation_(sheet, 17, colorNames);
    }
  }
}

/* ── 02. RM_MASTER_FABRIC (27 cols) — V9: +2 cols L1/L2 at cols C,D ── */
function setupRMFabric_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.RM_MASTER_FABRIC);
  var headers = [
    '# RM Code', '∑ FINAL FABRIC SKU',
    'L1 Division', 'L2 Category', 'L3 Knit Type',
    '← Yarn Codes (Auto)', '⟷ YARN COMPOSITION', 'FABRIC TYPE', 'COLOUR',
    'GSM (Min)', 'GSM (Max)', 'Width (inches)', 'UOM', '→ HSN Code',
    '← GST % (Auto)', '→ Primary Supplier', 'Supplier Code',
    '← Supplier Name (Auto)', 'Lead Time (Days)', 'Reorder Level',
    'Min Order Qty', 'Cost per UOM', 'Season', 'Status', 'Remarks',
    '← FINISHED FABRIC COST (Auto)', '⟷ Tags'
  ];
  var descriptions = [
    'AUTO: RM-FAB-xxx', 'GAS builds: KNIT+YARN',
    'Auto: Raw Material. Read-only.', 'Auto: Knit Fabric. Read-only.',
    'Dropdown: Single Jersey, Pique, Fleece, French Terry, Rib, etc.',
    'Auto from yarn names', 'Multi-select yarn names from RM_MASTER_YARN', 'KORA / FINISHED',
    'KORA/COLOURED/DYED/MEL', 'Grams per sq meter min', 'Grams per sq meter max',
    'Tube/Open width', 'KG/MTR', 'FK → HSN_MASTER', 'Auto from HSN',
    'FK → SUPPLIER_MASTER', 'Supplier catalogue code', 'Auto from SUPPLIER',
    'Days', 'Stock trigger qty', 'Minimum order', '₹ per UOM',
    'Season code', 'Active/Inactive', 'Notes',
    'Phase 3 link', 'Multi-select → TAG_MASTER'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — RM_MASTER_FABRIC — Knit Fabrics',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // L1/L2 auto-fill (green read-only concept)
  sheet.getRange(4, 3, 500, 1).setValue('Raw Material').setBackground('#D5E8D4').setFontColor('#2E7D32');
  sheet.getRange(4, 4, 500, 1).setValue('Knit Fabric').setBackground('#D5E8D4').setFontColor('#2E7D32');

  // Validations — L3 from ITEM_CATEGORIES grouped by master=RM-FABRIC
  var fabricCats = getCategoryDropdownsForMaster_(ss, 'RM-FABRIC');
  if (fabricCats.l3Flat.length > 0) {
    setColumnValidation_(sheet, 5, fabricCats.l3Flat);
  } else {
    setColumnValidation_(sheet, 5, ['Single Jersey', 'Pique', 'Fleece', 'French Terry', 'Rib',
      'Interlock', 'Autostriper', 'Waffle Knit', 'Lycra Jersey', 'Textured / Yarn Dyed', 'Other Knit']);
  }
  // Col G (7): Yarn names dropdown from RM_MASTER_YARN col E (Yarn Name)
  // Uses range-based validation so it stays in sync with live yarn data.
  // Multi-select is handled by onEdit toggle logic in Code.gs (appends with | separator).
  try {
    var yarnSheet = ss.getSheetByName(CONFIG.SHEETS.RM_MASTER_YARN);
    if (yarnSheet) {
      var yarnLastRow = Math.max(yarnSheet.getLastRow(), 4);
      var yarnNameRange = yarnSheet.getRange(4, 5, yarnLastRow - 3, 1); // col E = Yarn Name
      var yarnRule = SpreadsheetApp.newDataValidation()
        .requireValueInRange(yarnNameRange, true)
        .setAllowInvalid(true)    // Allow invalid so multi-select toggle can write pipe-separated values
        .build();
      sheet.getRange(4, 7, 500, 1).setDataValidation(yarnRule);
    }
  } catch (err) {
    Logger.log('Yarn dropdown validation error: ' + err.message);
  }

  setColumnValidation_(sheet, 8, ['KORA', 'FINISHED']);
  setColumnValidation_(sheet, 9, ['KORA', 'COLOURED', 'DYED', 'MEL']);
  setColumnValidation_(sheet, 13, CONFIG.UOM_LIST);
  setColumnValidation_(sheet, 24, CONFIG.STATUS_LIST);
}

/* ── 03. RM_MASTER_YARN (18 cols) — V9: +3 cols L1/L2/L3 at cols B–D ── */
function setupRMYarn_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.RM_MASTER_YARN);
  var headers = [
    '# RM Code',
    'L1 Division', 'L2 Category', 'L3 Yarn Type',
    'Yarn Name', 'Colour Type', 'Colour (if dyed)',
    '→ HSN Code', '← GST % (Auto)', '→ Supplier Code',
    '← Primary Supplier', '← Supplier Name (Auto)',
    'Season for Cost', 'Avg Cost (excl GST)', 'GST % for Cost',
    '∑ Total Cost (incl GST)', 'Status', 'Remarks'
  ];
  var descriptions = [
    'AUTO: RM-YRN-xxx',
    'Auto: Raw Material. Read-only.', 'Auto: Yarn. Read-only.',
    'Dropdown: Cotton Combed, Polyester, PC Blend, etc.',
    'Full yarn description', 'Raw/Dyed/Melange',
    'If dyed/melange only', 'FK → HSN_MASTER', 'Auto from HSN',
    'FK → SUPPLIER_MASTER', 'Supplier name ref', 'Auto from SUPPLIER',
    'SS25/AW25 etc', '₹ per KG excl GST', 'GST rate %',
    'Auto: Cost × (1+GST%/100)', 'Active/Inactive', 'Composition notes'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — RM_MASTER_YARN — Yarn',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // L1/L2 auto-fill (green read-only concept)
  sheet.getRange(4, 2, 500, 1).setValue('Raw Material').setBackground('#D5E8D4').setFontColor('#2E7D32');
  sheet.getRange(4, 3, 500, 1).setValue('Yarn').setBackground('#D5E8D4').setFontColor('#2E7D32');

  // Validations — L3 from ITEM_CATEGORIES grouped by master=RM-YARN
  var yarnCats = getCategoryDropdownsForMaster_(ss, 'RM-YARN');
  if (yarnCats.l3Flat.length > 0) {
    setColumnValidation_(sheet, 4, yarnCats.l3Flat);
  } else {
    setColumnValidation_(sheet, 4, ['Cotton Combed', 'Cotton Carded', 'Polyester', 'PC Blend',
      'Viscose', 'Melange', 'Lycra / Spandex', 'Nylon', 'Other Yarn']);
  }
  setColumnValidation_(sheet, 6, ['Raw', 'Dyed', 'Melange']);
  setColumnValidation_(sheet, 17, CONFIG.STATUS_LIST);
}

/* ── 04. RM_MASTER_WOVEN (17 cols) — V9: +2 cols L1/L2 at cols B,C ── */
function setupRMWoven_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.RM_MASTER_WOVEN);
  var headers = [
    '# RM Code',
    'L1 Division', 'L2 Category',
    'Woven/Interlining Name', 'L3 Woven Type', 'Composition',
    'Width (inches)', 'Weight (GSM)', 'UOM', '→ HSN Code',
    '← GST % (Auto)', '→ Primary Supplier', '← Supplier Name (Auto)',
    'Cost per UOM', 'Reorder Level', 'Status', 'Remarks'
  ];
  var descriptions = [
    'AUTO: RM-WVN-xxx',
    'Auto: Raw Material. Read-only.', 'Auto: Woven / Interlining. Read-only.',
    'Full description',
    'Dropdown: Fusible, Non-Fusible, Woven Fabric, Collar Canvas, etc.',
    'Fabric blend', 'Width', 'GSM', 'MTR/KG', 'FK → HSN_MASTER',
    'Auto from HSN', 'FK → SUPPLIER_MASTER', 'Auto from SUPPLIER',
    '₹ per UOM', 'Stock trigger qty', 'Active/Inactive', 'Notes'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — RM_MASTER_WOVEN — Woven & Interlining',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // L1/L2 auto-fill (green read-only concept)
  sheet.getRange(4, 2, 500, 1).setValue('Raw Material').setBackground('#D5E8D4').setFontColor('#2E7D32');
  sheet.getRange(4, 3, 500, 1).setValue('Woven / Interlining').setBackground('#D5E8D4').setFontColor('#2E7D32');

  // Validations — L3 from ITEM_CATEGORIES grouped by master=RM-WOVEN
  var wovenCats = getCategoryDropdownsForMaster_(ss, 'RM-WOVEN');
  if (wovenCats.l3Flat.length > 0) {
    setColumnValidation_(sheet, 5, wovenCats.l3Flat);
  } else {
    setColumnValidation_(sheet, 5, ['Fusible Interlining', 'Non-Fusible Interlining',
      'Woven Fabric', 'Collar Canvas', 'Lining', 'Tape', 'Other']);
  }
  setColumnValidation_(sheet, 9, CONFIG.UOM_LIST);
  setColumnValidation_(sheet, 16, CONFIG.STATUS_LIST);
}

/* ── 05. TRIM_MASTER (30 cols) — V9: +1 col L1 Division at col D ── */
function setupTrimMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.TRIM_MASTER);
  var headers = [
    '# TRM Code', 'Parent Code', '⚠ Trim Name',
    'L1 Division', 'L2 Trim Category', 'L3 Sub-Category',
    'IMAGE LINK', '→ COLOUR CODE',
    '← Color/Shade Name (Auto)', 'UOM', '→ HSN Code',
    '← GST % (Auto)', '→ Primary Supplier', 'Supplier Code',
    'Lead Time (Days)', 'Reorder Level', 'Status',
    '⟷ Attr 1 Name', 'Attr 1 Value', '⟷ Attr 2 Name', 'Attr 2 Value',
    '⟷ Attr 3 Name', 'Attr 3 Value', '⟷ Attr 4 Name', 'Attr 4 Value',
    '⟷ Attr 5 Name', 'Attr 5 Value', '⟷ Attr 6 Name', 'Attr 6 Value',
    'Remarks'
  ];
  var descriptions = [
    'AUTO: TRM-[CAT]-xxx', 'FK → self (variant)', 'Required',
    'Auto: Trim. Read-only.', 'Dropdown: THD/LBL/ELS/ZIP/BUT/TPE/DRW/VLC/RVT/THP/OTH',
    'Dropdown: specific sub-type',
    'Google Drive link', 'FK → COLOR_MASTER',
    'Auto from COLOR_MASTER', 'CONE/MTR/PCS/KG/SET/ROLL', 'FK → HSN_MASTER',
    'Auto from HSN', 'FK → SUPPLIER_MASTER', 'Supplier cat code',
    'Days', 'Stock trigger', 'Active/Inactive/Dev/Discontinued',
    'Auto-filled by GAS', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Brand notes, quality flag'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — TRIM_MASTER — All Trims (30 Columns)',
    headers, descriptions, CONFIG.TAB_COLORS.TRIM_MASTER);

  // L1 auto-fill (green read-only concept)
  sheet.getRange(4, 4, 500, 1).setValue('Trim').setBackground('#D5E8D4').setFontColor('#2E7D32');

  // Validations — L2 from ITEM_CATEGORIES grouped by master=TRIM
  var trimCats = getCategoryDropdownsForMaster_(ss, 'TRIM');
  if (trimCats.l2Flat.length > 0) {
    setColumnValidation_(sheet, 5, trimCats.l2Flat);
  } else {
    setColumnValidation_(sheet, 5, CONFIG.TRIM_CATEGORY_LIST);
  }
  setColumnValidation_(sheet, 10, CONFIG.UOM_LIST);
  setColumnValidation_(sheet, 17, CONFIG.STATUS_LIST);
}

/* ── 06. TRIM_ATTR_NAMES ── */
function setupTrimAttrNames_(ss) {
  var sheet = getOrCreateSheet_(ss, 'TRIM_ATTR_NAMES');
  var headers = [
    'Category Code', 'Category Name', 'Attr 1 Name', 'Attr 2 Name',
    'Attr 3 Name', 'Attr 4 Name', 'Attr 5 Name', 'Attr 6 Name', 'Active'
  ];
  var descriptions = [
    'THD/LBL/ELS etc', 'Full category name', 'First attribute', 'Second attribute',
    'Third attribute', 'Fourth attribute', 'Fifth attribute', 'Sixth attribute', 'Yes/No'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — TRIM_ATTR_NAMES — Attribute Names per Category',
    headers, descriptions, CONFIG.TAB_COLORS.TRIM_ATTR_NAMES);

  // Pre-populate attr names per the V4 spec
  var attrData = [
    ['THD', 'Thread', 'Type', 'Denier', 'Ply', 'Color(REF NAME)', '', '', 'Yes'],
    ['LBL', 'Label', 'Size', 'TYPE', '', '', '', '', 'Yes'],
    ['ELS', 'Elastic', 'Width', 'Stretch %', 'Color(REF NAME)', '', '', '', 'Yes'],
    ['ZIP', 'Zipper', 'Length', 'Teeth Type', 'Puller Type', 'Color(REF NAME)', '', '', 'Yes'],
    ['BUT', 'Button', 'Size', 'Material', 'Holes', 'Color(REF NAME)', '', '', 'Yes'],
    ['TPE', 'Tape', 'Width', 'Material', '', '', '', '', 'Yes'],
    ['DRW', 'Drawcord', 'Width', 'Material', '', '', '', '', 'Yes'],
    ['VLC', 'Velcro', 'Width', 'Color', '', '', '', '', 'Yes'],
    ['RVT', 'Rivet/Eyelet', 'Size', 'Material', 'Finish', '', '', '', 'Yes'],
    ['THP', 'Neck/Shoulder Tape', 'Width', 'Material', 'Color(REF NAME)', '', '', '', 'Yes']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, attrData.length, attrData[0].length).setValues(attrData);
  }
}

/* ── 07. TRIM_ATTR_VALUES ── */
function setupTrimAttrValues_(ss) {
  var sheet = getOrCreateSheet_(ss, 'TRIM_ATTR_VALUES');
  var headers = [
    'Category Code', 'Attr Name', 'Attr Value', 'Sort Order', 'Active'
  ];
  var descriptions = [
    'THD/LBL/ELS etc', 'Attribute this value belongs to', 'Allowed value',
    'Display order', 'Yes/No'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — TRIM_ATTR_VALUES — Allowed Values per Attribute',
    headers, descriptions, CONFIG.TAB_COLORS.TRIM_ATTR_VALUES);
}

/* ── 08. CONSUMABLE_MASTER (23 cols) — V9: +1 col L1 Division at col D ── */
function setupConsumableMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.CONSUMABLE_MASTER);
  var headers = [
    '# CON Code', 'Parent Code', '⚠ Consumable Name',
    'L1 Division', 'L2 Category', 'L3 Sub Type',
    'UOM', '→ HSN Code', '← GST % (Auto)',
    '→ Primary Supplier', '← Supplier Name (Auto)', 'Cost per UOM',
    'Reorder Level', 'Status',
    '⟷ Attr 1 Name', 'Attr 1 Value', '⟷ Attr 2 Name', 'Attr 2 Value',
    '⟷ Attr 3 Name', 'Attr 3 Value', '⟷ Attr 4 Name', 'Attr 4 Value',
    'Remarks'
  ];
  var descriptions = [
    'AUTO: CON-[CAT]-xxx', 'FK → self (variant)', 'Required',
    'Auto: Consumable. Read-only.',
    'Dropdown: Softener, Fixer, Needle, Oil, Fuel, Cleaning, Other',
    'Dropdown: specific consumable sub-type',
    'KG/LTR/PCS/SET', 'FK → HSN_MASTER', 'Auto from HSN',
    'FK → SUPPLIER_MASTER', 'Auto', '₹ per UOM', 'Stock trigger',
    'Active/Inactive', 'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown', 'Notes'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — CONSUMABLE_MASTER — Dyes, Chemicals, Needles, Oils',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // L1 auto-fill (green read-only concept)
  sheet.getRange(4, 4, 500, 1).setValue('Consumable').setBackground('#D5E8D4').setFontColor('#2E7D32');

  // Validations — L2 from ITEM_CATEGORIES grouped by master=CONSUMABLE
  var conCats = getCategoryDropdownsForMaster_(ss, 'CONSUMABLE');
  if (conCats.l2Flat.length > 0) {
    setColumnValidation_(sheet, 5, conCats.l2Flat);
  } else {
    setColumnValidation_(sheet, 5, ['Softener', 'Fixer', 'Needle', 'Oil', 'Fuel', 'Cleaning', 'Other']);
  }
  setColumnValidation_(sheet, 14, CONFIG.STATUS_LIST);
}

/* ── 09. CON_ATTR_NAMES ── */
function setupConAttrNames_(ss) {
  var sheet = getOrCreateSheet_(ss, 'CON_ATTR_NAMES');
  var headers = [
    'Category Code', 'Category Name', 'Attr 1 Name', 'Attr 2 Name',
    'Attr 3 Name', 'Attr 4 Name', 'Active'
  ];
  var descriptions = [
    'Category code', 'Full name', 'First attr', 'Second attr',
    'Third attr', 'Fourth attr', 'Yes/No'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — CON_ATTR_NAMES — Consumable Attribute Names',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);
}

/* ── 10. CON_ATTR_VALUES ── */
function setupConAttrValues_(ss) {
  var sheet = getOrCreateSheet_(ss, 'CON_ATTR_VALUES');
  var headers = [
    'Category Code', 'Attr Name', 'Attr Value', 'Sort Order', 'Active'
  ];
  var descriptions = [
    'Category code', 'Attribute name', 'Allowed value', 'Display order', 'Yes/No'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — CON_ATTR_VALUES — Consumable Attribute Values',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);
}

/* ── 11. PACKAGING_MASTER (23 cols) — V9: +1 col L1 Division at col D ── */
function setupPackagingMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.PACKAGING_MASTER);
  var headers = [
    '# PKG Code', 'Parent Code', '⚠ Packaging Name',
    'L1 Division', 'L2 Category', 'L3 Sub-Category',
    'UOM', '→ HSN Code', '← GST % (Auto)',
    '→ Primary Supplier', '← Supplier Name (Auto)', 'Cost per UOM',
    'Reorder Level', 'Status',
    '⟷ Attr 1 Name', 'Attr 1 Value', '⟷ Attr 2 Name', 'Attr 2 Value',
    '⟷ Attr 3 Name', 'Attr 3 Value', '⟷ Attr 4 Name', 'Attr 4 Value',
    'Remarks'
  ];
  var descriptions = [
    'AUTO: PKG-[CAT]-xxx', 'FK → self (variant)', 'Required',
    'Auto: Packaging. Read-only.',
    'Dropdown: Poly Bag, Carton, Hanger, Price Tag, Tissue, Sticker, Other',
    'Dropdown: specific packaging sub-type',
    'PCS/ROLL/KG', 'FK → HSN_MASTER', 'Auto from HSN',
    'FK → SUPPLIER_MASTER', 'Auto', '₹ per UOM', 'Stock trigger',
    'Active/Inactive', 'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown', 'Notes'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — PACKAGING_MASTER — Poly Bags, Cartons, Hangers',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // L1 auto-fill (green read-only concept)
  sheet.getRange(4, 4, 500, 1).setValue('Packaging').setBackground('#D5E8D4').setFontColor('#2E7D32');

  // Validations — L2 from ITEM_CATEGORIES grouped by master=PACKAGING
  var pkgCats = getCategoryDropdownsForMaster_(ss, 'PACKAGING');
  if (pkgCats.l2Flat.length > 0) {
    setColumnValidation_(sheet, 5, pkgCats.l2Flat);
  } else {
    setColumnValidation_(sheet, 5, ['Poly Bag', 'Carton', 'Hanger', 'Price Tag', 'Tissue', 'Sticker', 'Other']);
  }
  setColumnValidation_(sheet, 14, CONFIG.STATUS_LIST);
}

/* ── 12. PKG_ATTR_NAMES ── */
function setupPkgAttrNames_(ss) {
  var sheet = getOrCreateSheet_(ss, 'PKG_ATTR_NAMES');
  var headers = [
    'Category Code', 'Category Name', 'Attr 1 Name', 'Attr 2 Name',
    'Attr 3 Name', 'Attr 4 Name', 'Active'
  ];
  var descriptions = [
    'Category code', 'Full name', 'First attr', 'Second attr',
    'Third attr', 'Fourth attr', 'Yes/No'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — PKG_ATTR_NAMES — Packaging Attribute Names',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);
}

/* ── 13. PKG_ATTR_VALUES ── */
function setupPkgAttrValues_(ss) {
  var sheet = getOrCreateSheet_(ss, 'PKG_ATTR_VALUES');
  var headers = [
    'Category Code', 'Attr Name', 'Attr Value', 'Sort Order', 'Active'
  ];
  var descriptions = [
    'Category code', 'Attribute name', 'Allowed value', 'Display order', 'Yes/No'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — PKG_ATTR_VALUES — Packaging Attribute Values',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);
}

/* ── 14. ITEM_CATEGORIES — Column-Grouped by Master (V10) ──
 *  Layout: 7 master groups × 3 columns each = 21 data columns (B-V)
 *  Col A = Row # (auto)
 *  B,C,D  = ARTICLE       L1, L2, L3
 *  E,F,G  = RM-FABRIC     L1, L2, L3
 *  H,I,J  = RM-YARN       L1, L2, L3
 *  K,L,M  = RM-WOVEN      L1, L2, L3
 *  N,O,P  = TRIM          L1, L2, L3
 *  Q,R,S  = CONSUMABLE    L1, L2, L3
 *  T,U,V  = PACKAGING     L1, L2, L3
 *
 *  Each master's rows are independent — they fill down from row 4
 *  and do not need to align across masters.
 */
function setupItemCategories_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.ITEM_CATEGORIES);
  var headers = [
    '#',
    'Article L1', 'Article L2', 'Article L3',
    'Fabric L1',  'Fabric L2',  'Fabric L3',
    'Yarn L1',    'Yarn L2',    'Yarn L3',
    'Woven L1',   'Woven L2',   'Woven L3',
    'Trim L1',    'Trim L2',    'Trim L3',
    'Consumable L1', 'Consumable L2', 'Consumable L3',
    'Packaging L1',  'Packaging L2',  'Packaging L3'
  ];
  var descriptions = [
    'Row #',
    'Men\'s/Women\'s/Kids/Unisex Apparel', 'Article L2 Category', 'Article L3 Style',
    'Fixed: Raw Material', 'Fixed: Knit Fabric', 'Knit Type',
    'Fixed: Raw Material', 'Fixed: Yarn', 'Yarn Type',
    'Fixed: Raw Material', 'Fixed: Woven / Interlining', 'Woven Type',
    'Fixed: Trim', 'Trim Category', 'Trim Sub-type',
    'Fixed: Consumable', 'Consumable Category', 'Consumable Sub-type',
    'Fixed: Packaging', 'Packaging Category', 'Packaging Sub-type'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — ITEM_CATEGORIES — Column-Grouped by Master (22 cols)',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Pre-populate seed data
  var catData = getItemCategorySeedData_V10_();
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, catData.length, catData[0].length).setValues(catData);
  }

  // Color-code the FIXED L1/L2 columns (green background, read-only concept)
  var numRows = Math.max(catData.length, 50);
  // Fabric L1+L2 (E,F)
  sheet.getRange(4, 5, numRows, 2).setBackground('#D5E8D4').setFontColor('#2E7D32');
  // Yarn L1+L2 (H,I)
  sheet.getRange(4, 8, numRows, 2).setBackground('#D5E8D4').setFontColor('#2E7D32');
  // Woven L1+L2 (K,L)
  sheet.getRange(4, 11, numRows, 2).setBackground('#D5E8D4').setFontColor('#2E7D32');
  // Trim L1 (N)
  sheet.getRange(4, 14, numRows, 1).setBackground('#D5E8D4').setFontColor('#2E7D32');
  // Consumable L1 (Q)
  sheet.getRange(4, 17, numRows, 1).setBackground('#D5E8D4').setFontColor('#2E7D32');
  // Packaging L1 (T)
  sheet.getRange(4, 20, numRows, 1).setBackground('#D5E8D4').setFontColor('#2E7D32');
}

/* ── 15. ARTICLE_DROPDOWNS — Single source for all Article Master dropdowns ── */
function setupArticleDropdowns_(ss) {
  var sheet = getOrCreateSheet_(ss, 'ARTICLE_DROPDOWNS');
  var headers = [
    'Gender', 'Fit Type', 'Neckline', 'Sleeve Type', 'Status', 'Season', 'Size Range'
  ];
  var descriptions = [
    'Men/Women/Kids/Unisex', 'Regular/Slim/Relaxed/Oversized', 'Round Neck/V-Neck/Collar etc.',
    'Half/Full/Sleeveless etc.', 'Active/Inactive/Development', 'SS25/AW26 examples',
    'S-M-L-XL etc.'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — ARTICLE_DROPDOWNS — All Article Master Dropdown Values',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Pre-populate dropdown values
  if (sheet.getLastRow() < 4) {
    var data = [
      ['Men',    'Regular',   'Round Neck',   'Half Sleeve',  'Active',       'SS2024',     'S-M-L-XL-XXL'],
      ['Women',  'Slim',      'V-Neck',       'Full Sleeve',  'Inactive',     'AW2024',     'S-M-L-XL'],
      ['Kids',   'Relaxed',   'Polo',         'Sleeveless',   'Development',  'SS2025',     'M-L-XL-XXL'],
      ['Unisex', 'Oversized', 'Henley',       'Cap Sleeve',   'Discontinued', 'AW2025',     'XS-S-M-L-XL'],
      ['',       'Crop',      'Hood',         '3/4 Sleeve',   '',             'SS2026',     'S-M-L'],
      ['',       'Athletic',  'Crew Neck',    'Raglan',       '',             'AW2026',     'M-L-XL-XXL-3XL'],
      ['',       '',          'Quarter Zip',  '',             '',             'Year Round', 'Free Size'],
      ['',       '',          'Mock Neck',    '',             '',             '',           'XS-S-M-L-XL-XXL-3XL'],
    ];
    sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
  }
}

/**
 * V10 column-grouped seed data for ITEM_CATEGORIES.
 * Returns rows with 22 columns: [#, ArtL1, ArtL2, ArtL3, FabL1, FabL2, FabL3,
 *   YarnL1, YarnL2, YarnL3, WovenL1, WovenL2, WovenL3, TrimL1, TrimL2, TrimL3,
 *   ConL1, ConL2, ConL3, PkgL1, PkgL2, PkgL3]
 *
 * Each master fills its own 3-column group independently; other columns are blank.
 * Rows are padded so each master starts at row 4.
 */
function getItemCategorySeedData_V10_() {
  // Per-master data arrays (each entry = [L1, L2, L3])
  var article = [
    ["Men's Apparel", "Tops - Polo", "Pique Polo"],
    ["Men's Apparel", "Tops - Polo", "Autostriper Polo"],
    ["Men's Apparel", "Tops - Polo", "Jacquard Polo"],
    ["Men's Apparel", "Tops - Tee", "Round Neck Tee"],
    ["Men's Apparel", "Tops - Tee", "V-Neck Tee"],
    ["Men's Apparel", "Tops - Tee", "Henley Tee"],
    ["Men's Apparel", "Sweatshirt", "Hoodie"],
    ["Men's Apparel", "Sweatshirt", "Crew Neck Sweatshirt"],
    ["Men's Apparel", "Sweatshirt", "Quarter Zip"],
    ["Men's Apparel", "Tracksuit", "Full Tracksuit"],
    ["Men's Apparel", "Tracksuit", "Track Jacket"],
    ["Men's Apparel", "Tracksuit", "Track Pant"],
    ["Men's Apparel", "Bottoms", "Jogger"],
    ["Men's Apparel", "Bottoms", "Shorts"],
    ["Women's Apparel", "Tops - Tee", "Round Neck Tee"],
    ["Women's Apparel", "Tops - Tee", "Crop Top"],
    ["Women's Apparel", "Sweatshirt", "Hoodie"],
    ["Women's Apparel", "Bottoms", "Jogger"],
    ["Kids Apparel", "Tops - Tee", "Round Neck Tee"],
    ["Kids Apparel", "Sweatshirt", "Hoodie"],
    ["Unisex Apparel", "Tops - Tee", "Oversized Tee"],
    ["Unisex Apparel", "Sweatshirt", "Hoodie"],
    ["Unisex Apparel", "Bottoms", "Jogger"],
  ];
  var fabric = [
    ["Raw Material", "Knit Fabric", "Single Jersey"],
    ["Raw Material", "Knit Fabric", "Pique"],
    ["Raw Material", "Knit Fabric", "Fleece"],
    ["Raw Material", "Knit Fabric", "French Terry"],
    ["Raw Material", "Knit Fabric", "Rib"],
    ["Raw Material", "Knit Fabric", "Interlock"],
    ["Raw Material", "Knit Fabric", "Lycra Jersey"],
  ];
  var yarn = [
    ["Raw Material", "Yarn", "Cotton Combed"],
    ["Raw Material", "Yarn", "Cotton Carded"],
    ["Raw Material", "Yarn", "Polyester"],
    ["Raw Material", "Yarn", "PC Blend"],
    ["Raw Material", "Yarn", "Viscose"],
    ["Raw Material", "Yarn", "Melange"],
  ];
  var woven = [
    ["Raw Material", "Woven / Interlining", "Fusible Interlining"],
    ["Raw Material", "Woven / Interlining", "Non-Fusible Interlining"],
    ["Raw Material", "Woven / Interlining", "Woven Fabric"],
  ];
  var trim = [
    ["Trim", "Thread", "Sewing Thread"],
    ["Trim", "Thread", "Overlock Thread"],
    ["Trim", "Thread", "Embroidery Thread"],
    ["Trim", "Thread", "Tacking Thread"],
    ["Trim", "Label", "Main Label"],
    ["Trim", "Label", "Care Label"],
    ["Trim", "Label", "Size Label"],
    ["Trim", "Label", "Hang Tag"],
    ["Trim", "Label", "Badge"],
    ["Trim", "Elastic", "Crochet Elastic"],
    ["Trim", "Elastic", "Knitted Elastic"],
    ["Trim", "Elastic", "Flat Elastic"],
    ["Trim", "Zipper", "Dress Zipper"],
    ["Trim", "Zipper", "Open-End Zipper"],
    ["Trim", "Zipper", "Invisible Zipper"],
    ["Trim", "Button", "Flat Button"],
    ["Trim", "Button", "Snap Button"],
    ["Trim", "Button", "Shank Button"],
    ["Trim", "Tape", "Twill Tape"],
    ["Trim", "Tape", "Herringbone Tape"],
    ["Trim", "Drawcord", "Flat Drawcord"],
    ["Trim", "Drawcord", "Round Drawcord"],
    ["Trim", "Velcro", "Sew-On Velcro"],
    ["Trim", "Rivet / Eyelet", "Metal Rivet"],
    ["Trim", "Rivet / Eyelet", "Brass Eyelet"],
    ["Trim", "Neck / Shoulder Tape", "Neck Tape"],
    ["Trim", "Other", "Other Trim"],
  ];
  var consumable = [
    ["Consumable", "Dye", "Reactive Dye"],
    ["Consumable", "Dye", "Disperse Dye"],
    ["Consumable", "Dye", "Pigment Dye"],
    ["Consumable", "Chemical", "Softener"],
    ["Consumable", "Chemical", "Fixing Agent"],
    ["Consumable", "Chemical", "Levelling Agent"],
    ["Consumable", "Needle", "Knitting Needle"],
    ["Consumable", "Needle", "Sewing Needle"],
    ["Consumable", "Oil", "Machine Oil"],
    ["Consumable", "Other", "Other Consumable"],
  ];
  var packaging = [
    ["Packaging", "Polybag", "LDPE Polybag"],
    ["Packaging", "Polybag", "HM Polybag"],
    ["Packaging", "Carton", "Single Wall Carton"],
    ["Packaging", "Carton", "Double Wall Carton"],
    ["Packaging", "Hanger", "Plastic Hanger"],
    ["Packaging", "Ticket / Tag", "Price Ticket"],
    ["Packaging", "Ticket / Tag", "Barcode Label"],
    ["Packaging", "Other", "Tissue Paper"],
  ];

  // Find the max row count across all masters
  var masters = [article, fabric, yarn, woven, trim, consumable, packaging];
  var maxRows = 0;
  for (var m = 0; m < masters.length; m++) {
    if (masters[m].length > maxRows) maxRows = masters[m].length;
  }

  // Build combined rows: [#, ArtL1..L3, FabL1..L3, YarnL1..L3, WovenL1..L3, TrimL1..L3, ConL1..L3, PkgL1..L3]
  var result = [];
  for (var r = 0; r < maxRows; r++) {
    var row = [r + 1]; // Col A = row number
    for (var m = 0; m < masters.length; m++) {
      if (r < masters[m].length) {
        row.push(masters[m][r][0], masters[m][r][1], masters[m][r][2]);
      } else {
        row.push('', '', '');
      }
    }
    result.push(row);
  }
  return result;
}

/** Legacy V9 seed data — kept for reference. New installs use getItemCategorySeedData_V10_(). */
function getItemCategorySeedData_() {
  return getItemCategorySeedData_V10_();
}

// ── LEGACY STUB — kept for reference; actual data is in getV9ItemCategorySeedData_() ──
function _getItemCategorySeedData_LEGACY_() {
  return [
    // ── ARTICLE — SELECTABLE L1 ──
    ['CAT-001', "Men's Apparel", 'Tops - Polo', 'Pique Polo', 'ARTICLE', '6105', 'Yes', 'Classic polo', 'SELECTABLE'],
    ['CAT-002', "Men's Apparel", 'Tops - Polo', 'Autostriper Polo', 'ARTICLE', '6105', 'Yes', '', 'SELECTABLE'],
    ['CAT-003', "Men's Apparel", 'Tops - Polo', 'Jacquard Polo', 'ARTICLE', '6105', 'Yes', '', 'SELECTABLE'],
    ['CAT-004', "Men's Apparel", 'Tops - Tee', 'Round Neck Tee', 'ARTICLE', '6109', 'Yes', '', 'SELECTABLE'],
    ['CAT-005', "Men's Apparel", 'Tops - Tee', 'V-Neck Tee', 'ARTICLE', '6109', 'Yes', '', 'SELECTABLE'],
    ['CAT-006', "Men's Apparel", 'Tops - Tee', 'Henley Tee', 'ARTICLE', '6109', 'Yes', '', 'SELECTABLE'],
    ['CAT-007', "Men's Apparel", 'Sweatshirt', 'Hoodie', 'ARTICLE', '6110', 'Yes', '', 'SELECTABLE'],
    ['CAT-008', "Men's Apparel", 'Sweatshirt', 'Crew Neck Sweatshirt', 'ARTICLE', '6110', 'Yes', '', 'SELECTABLE'],
    ['CAT-009', "Men's Apparel", 'Sweatshirt', 'Quarter Zip', 'ARTICLE', '6110', 'Yes', '', 'SELECTABLE'],
    ['CAT-010', "Men's Apparel", 'Tracksuit', 'Full Tracksuit', 'ARTICLE', '6112', 'Yes', '', 'SELECTABLE'],
    ['CAT-011', "Men's Apparel", 'Tracksuit', 'Track Jacket', 'ARTICLE', '6112', 'Yes', '', 'SELECTABLE'],
    ['CAT-012', "Men's Apparel", 'Tracksuit', 'Track Pant', 'ARTICLE', '6112', 'Yes', '', 'SELECTABLE'],
    ['CAT-013', "Men's Apparel", 'Bottoms', 'Jogger', 'ARTICLE', '6103', 'Yes', '', 'SELECTABLE'],
    ['CAT-014', "Men's Apparel", 'Bottoms', 'Shorts', 'ARTICLE', '6103', 'Yes', '', 'SELECTABLE'],
    ['CAT-015', "Women's Apparel", 'Tops - Tee', 'Round Neck Tee', 'ARTICLE', '6109', 'Yes', '', 'SELECTABLE'],
    ['CAT-016', "Women's Apparel", 'Tops - Tee', 'Crop Top', 'ARTICLE', '6109', 'Yes', '', 'SELECTABLE'],
    ['CAT-017', "Women's Apparel", 'Sweatshirt', 'Hoodie', 'ARTICLE', '6110', 'Yes', '', 'SELECTABLE'],
    ['CAT-018', "Women's Apparel", 'Bottoms', 'Jogger', 'ARTICLE', '6103', 'Yes', '', 'SELECTABLE'],
    ['CAT-019', 'Kids Apparel', 'Tops - Tee', 'Round Neck Tee', 'ARTICLE', '6109', 'Yes', '', 'SELECTABLE'],
    ['CAT-020', 'Kids Apparel', 'Sweatshirt', 'Hoodie', 'ARTICLE', '6110', 'Yes', '', 'SELECTABLE'],
    ['CAT-021', 'Unisex Apparel', 'Tops - Tee', 'Oversized Tee', 'ARTICLE', '6109', 'Yes', '', 'SELECTABLE'],
    ['CAT-022', 'Unisex Apparel', 'Sweatshirt', 'Hoodie', 'ARTICLE', '6110', 'Yes', '', 'SELECTABLE'],
    // ── RM-FABRIC — FIXED L1 ──
    ['CAT-030', 'Raw Material', 'Knit Fabric', 'Single Jersey', 'RM-FABRIC', '6006', 'Yes', '', 'FIXED'],
    ['CAT-031', 'Raw Material', 'Knit Fabric', 'Pique', 'RM-FABRIC', '6006', 'Yes', '', 'FIXED'],
    ['CAT-032', 'Raw Material', 'Knit Fabric', 'Fleece', 'RM-FABRIC', '6006', 'Yes', '', 'FIXED'],
    ['CAT-033', 'Raw Material', 'Knit Fabric', 'French Terry', 'RM-FABRIC', '6006', 'Yes', '', 'FIXED'],
    ['CAT-034', 'Raw Material', 'Knit Fabric', 'Rib', 'RM-FABRIC', '6006', 'Yes', '', 'FIXED'],
    ['CAT-035', 'Raw Material', 'Knit Fabric', 'Interlock', 'RM-FABRIC', '6006', 'Yes', '', 'FIXED'],
    ['CAT-036', 'Raw Material', 'Knit Fabric', 'Lycra Jersey', 'RM-FABRIC', '6006', 'Yes', '', 'FIXED'],
    // ── RM-YARN — FIXED L1 ──
    ['CAT-040', 'Raw Material', 'Yarn', 'Cotton Combed', 'RM-YARN', '5205', 'Yes', '', 'FIXED'],
    ['CAT-041', 'Raw Material', 'Yarn', 'Cotton Carded', 'RM-YARN', '5205', 'Yes', '', 'FIXED'],
    ['CAT-042', 'Raw Material', 'Yarn', 'Polyester', 'RM-YARN', '5402', 'Yes', '', 'FIXED'],
    ['CAT-043', 'Raw Material', 'Yarn', 'PC Blend', 'RM-YARN', '5205', 'Yes', '', 'FIXED'],
    ['CAT-044', 'Raw Material', 'Yarn', 'Viscose', 'RM-YARN', '5510', 'Yes', '', 'FIXED'],
    ['CAT-045', 'Raw Material', 'Yarn', 'Melange', 'RM-YARN', '5205', 'Yes', '', 'FIXED'],
    // ── RM-WOVEN — FIXED L1 ──
    ['CAT-050', 'Raw Material', 'Woven / Interlining', 'Fusible Interlining', 'RM-WOVEN', '5903', 'Yes', '', 'FIXED'],
    ['CAT-051', 'Raw Material', 'Woven / Interlining', 'Non-Fusible Interlining', 'RM-WOVEN', '5903', 'Yes', '', 'FIXED'],
    ['CAT-052', 'Raw Material', 'Woven / Interlining', 'Woven Fabric', 'RM-WOVEN', '5208', 'Yes', '', 'FIXED'],
    // ── TRIM — FIXED L1 ──
    ['CAT-060', 'Trim', 'Thread', 'Sewing Thread', 'TRIM', '5204', 'Yes', '', 'FIXED'],
    ['CAT-061', 'Trim', 'Thread', 'Overlock Thread', 'TRIM', '5204', 'Yes', '', 'FIXED'],
    ['CAT-062', 'Trim', 'Thread', 'Embroidery Thread', 'TRIM', '5204', 'Yes', '', 'FIXED'],
    ['CAT-063', 'Trim', 'Thread', 'Tacking Thread', 'TRIM', '5204', 'Yes', '', 'FIXED'],
    ['CAT-064', 'Trim', 'Label', 'Main Label', 'TRIM', '5807', 'Yes', '', 'FIXED'],
    ['CAT-065', 'Trim', 'Label', 'Care Label', 'TRIM', '5807', 'Yes', '', 'FIXED'],
    ['CAT-066', 'Trim', 'Label', 'Size Label', 'TRIM', '5807', 'Yes', '', 'FIXED'],
    ['CAT-067', 'Trim', 'Label', 'Hang Tag', 'TRIM', '5807', 'Yes', '', 'FIXED'],
    ['CAT-068', 'Trim', 'Label', 'Badge', 'TRIM', '5807', 'Yes', 'Sub-category under LBL', 'FIXED'],
    ['CAT-069', 'Trim', 'Elastic', 'Crochet Elastic', 'TRIM', '5604', 'Yes', '', 'FIXED'],
    ['CAT-070', 'Trim', 'Elastic', 'Knitted Elastic', 'TRIM', '5604', 'Yes', '', 'FIXED'],
    ['CAT-071', 'Trim', 'Elastic', 'Flat Elastic', 'TRIM', '5604', 'Yes', '', 'FIXED'],
    ['CAT-072', 'Trim', 'Zipper', 'Dress Zipper', 'TRIM', '9607', 'Yes', '', 'FIXED'],
    ['CAT-073', 'Trim', 'Zipper', 'Open-End Zipper', 'TRIM', '9607', 'Yes', '', 'FIXED'],
    ['CAT-074', 'Trim', 'Zipper', 'Invisible Zipper', 'TRIM', '9607', 'Yes', '', 'FIXED'],
    ['CAT-075', 'Trim', 'Button', 'Flat Button', 'TRIM', '9606', 'Yes', '', 'FIXED'],
    ['CAT-076', 'Trim', 'Button', 'Snap Button', 'TRIM', '9606', 'Yes', '', 'FIXED'],
    ['CAT-077', 'Trim', 'Button', 'Shank Button', 'TRIM', '9606', 'Yes', '', 'FIXED'],
    ['CAT-078', 'Trim', 'Tape', 'Twill Tape', 'TRIM', '5806', 'Yes', '', 'FIXED'],
    ['CAT-079', 'Trim', 'Tape', 'Herringbone Tape', 'TRIM', '5806', 'Yes', '', 'FIXED'],
    ['CAT-080', 'Trim', 'Drawcord', 'Flat Drawcord', 'TRIM', '5604', 'Yes', '', 'FIXED'],
    ['CAT-081', 'Trim', 'Drawcord', 'Round Drawcord', 'TRIM', '5604', 'Yes', '', 'FIXED'],
    ['CAT-082', 'Trim', 'Velcro', 'Sew-On Velcro', 'TRIM', '5806', 'Yes', '', 'FIXED'],
    ['CAT-083', 'Trim', 'Rivet / Eyelet', 'Metal Rivet', 'TRIM', '8308', 'Yes', '', 'FIXED'],
    ['CAT-084', 'Trim', 'Rivet / Eyelet', 'Brass Eyelet', 'TRIM', '8308', 'Yes', '', 'FIXED'],
    ['CAT-085', 'Trim', 'Neck / Shoulder Tape', 'Neck Tape', 'TRIM', '5806', 'Yes', '', 'FIXED'],
    ['CAT-086', 'Trim', 'Other', 'Other Trim', 'TRIM', '6307', 'Yes', '', 'FIXED'],
    // ── CONSUMABLE — FIXED L1 ──
    ['CAT-090', 'Consumable', 'Dye', 'Reactive Dye', 'CONSUMABLE', '3204', 'Yes', '', 'FIXED'],
    ['CAT-091', 'Consumable', 'Dye', 'Disperse Dye', 'CONSUMABLE', '3204', 'Yes', '', 'FIXED'],
    ['CAT-092', 'Consumable', 'Dye', 'Pigment Dye', 'CONSUMABLE', '3204', 'Yes', '', 'FIXED'],
    ['CAT-093', 'Consumable', 'Chemical', 'Softener', 'CONSUMABLE', '3402', 'Yes', '', 'FIXED'],
    ['CAT-094', 'Consumable', 'Chemical', 'Fixing Agent', 'CONSUMABLE', '3402', 'Yes', '', 'FIXED'],
    ['CAT-095', 'Consumable', 'Chemical', 'Levelling Agent', 'CONSUMABLE', '3402', 'Yes', '', 'FIXED'],
    ['CAT-096', 'Consumable', 'Needle', 'Knitting Needle', 'CONSUMABLE', '7319', 'Yes', '', 'FIXED'],
    ['CAT-097', 'Consumable', 'Needle', 'Sewing Needle', 'CONSUMABLE', '7319', 'Yes', '', 'FIXED'],
    ['CAT-098', 'Consumable', 'Oil', 'Machine Oil', 'CONSUMABLE', '2710', 'Yes', '', 'FIXED'],
    ['CAT-099', 'Consumable', 'Other', 'Other Consumable', 'CONSUMABLE', '6307', 'Yes', '', 'FIXED'],
    // ── PACKAGING — FIXED L1 ──
    ['CAT-100', 'Packaging', 'Polybag', 'LDPE Polybag', 'PACKAGING', '3923', 'Yes', '', 'FIXED'],
    ['CAT-101', 'Packaging', 'Polybag', 'HM Polybag', 'PACKAGING', '3923', 'Yes', '', 'FIXED'],
    ['CAT-102', 'Packaging', 'Carton', 'Single Wall Carton', 'PACKAGING', '4819', 'Yes', '', 'FIXED'],
    ['CAT-103', 'Packaging', 'Carton', 'Double Wall Carton', 'PACKAGING', '4819', 'Yes', '', 'FIXED'],
    ['CAT-104', 'Packaging', 'Hanger', 'Plastic Hanger', 'PACKAGING', '3926', 'Yes', '', 'FIXED'],
    ['CAT-105', 'Packaging', 'Ticket / Tag', 'Price Ticket', 'PACKAGING', '4821', 'Yes', '', 'FIXED'],
    ['CAT-106', 'Packaging', 'Ticket / Tag', 'Barcode Label', 'PACKAGING', '4821', 'Yes', '', 'FIXED'],
    ['CAT-107', 'Packaging', 'Other', 'Tissue Paper', 'PACKAGING', '4818', 'Yes', '', 'FIXED'],
  ];
} // end _getItemCategorySeedData_LEGACY_

/**
 * Standalone function to re-seed ITEM_CATEGORIES sheet with V9 data (138 rows).
 * Run this from Apps Script menu: CC ERP > Seed Item Categories
 * Clears existing data (rows 4+) and writes fresh V9 seed data.
 */
function seedItemCategories() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.ITEM_CATEGORIES);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('ITEM_CATEGORIES sheet not found. Run full setup first.');
    return;
  }
  // Clear old data (keep rows 1-3: banner, headers, descriptions)
  var lastRow = sheet.getLastRow();
  if (lastRow >= 4) {
    sheet.getRange(4, 1, lastRow - 3, sheet.getLastColumn()).clearContent();
  }
  var catData = getItemCategorySeedData_(); // delegates to V9 138-row data
  sheet.getRange(4, 1, catData.length, catData[0].length).setValues(catData);
  SpreadsheetApp.getUi().alert('Seeded ' + catData.length + ' item categories (V9: CAT-001 to CAT-427).');
}

/* ── 15. UOM_MASTER ── */
function setupUOMMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.UOM_MASTER);
  var headers = ['UOM Code', 'UOM Name', 'Description', 'Active'];
  var descriptions = ['Short code', 'Full name', 'Usage description', 'Yes/No'];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — UOM_MASTER — Units of Measure',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  var uomData = [
    ['CONE', 'Cone', 'Thread/yarn cones', 'Yes'],
    ['MTR', 'Meter', 'Linear measurement', 'Yes'],
    ['PCS', 'Pieces', 'Individual items', 'Yes'],
    ['KG', 'Kilogram', 'Weight measurement', 'Yes'],
    ['SET', 'Set', 'Set of items', 'Yes'],
    ['ROLL', 'Roll', 'Rolled material', 'Yes'],
    ['LTR', 'Liter', 'Liquid volume', 'Yes'],
    ['DOZ', 'Dozen', '12 pieces', 'Yes'],
    ['GRS', 'Gross', '144 pieces', 'Yes']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, uomData.length, uomData[0].length).setValues(uomData);
  }
}

/* ── 16. HSN_MASTER ── */
function setupHSNMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.HSN_MASTER);
  var headers = ['HSN Code', 'HSN Description', 'GST %', 'Category', 'Active'];
  var descriptions = ['4-8 digit HSN', 'Official description', '5/12/18/28', 'Product type', 'Yes/No'];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — HSN_MASTER — GST HSN Codes with Rates',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Textile HSN codes
  // ARTICLE rows: HSN Description = L2 Product Category (for auto-fetch by L2)
  // Other rows: standard HSN descriptions
  var hsnData = [
    // ── Article Garments (Description = L2 category for auto-match) ──
    ['6105', 'Tops - Polo',   5,  'Garment', 'Yes'],
    ['6109', 'Tops - Tee',    5,  'Garment', 'Yes'],
    ['6110', 'Sweatshirt',    12, 'Garment', 'Yes'],
    ['6112', 'Tracksuit',     12, 'Garment', 'Yes'],
    ['6103', 'Bottoms',       5,  'Garment', 'Yes'],
    // ── Fabric ──
    ['6001', 'Pile fabrics including long pile and terry, knitted', 5, 'Fabric', 'Yes'],
    ['6006', 'Other knitted fabrics', 5, 'Fabric', 'Yes'],
    // ── Yarn ──
    ['5509', 'Yarn of synthetic staple fibres', 12, 'Yarn', 'Yes'],
    ['5205', 'Cotton yarn (not for retail)', 5, 'Yarn', 'Yes'],
    ['5402', 'Synthetic filament yarn', 12, 'Yarn', 'Yes'],
    // ── Thread ──
    ['5204', 'Cotton sewing thread', 12, 'Thread', 'Yes'],
    // ── Trim ──
    ['9606', 'Buttons, press fasteners, snap fasteners', 18, 'Trim', 'Yes'],
    ['9607', 'Slide fasteners (zippers)', 18, 'Trim', 'Yes'],
    ['5807', 'Labels, badges and similar articles of textiles', 12, 'Trim', 'Yes'],
    ['5806', 'Narrow woven fabrics (tapes, ribbons)', 12, 'Trim', 'Yes'],
    // ── Packaging ──
    ['3920', 'Plastic sheets (poly bags)', 18, 'Packaging', 'Yes'],
    ['4819', 'Cartons, boxes of paper/paperboard', 18, 'Packaging', 'Yes']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, hsnData.length, hsnData[0].length).setValues(hsnData);
  }
}

/* ── 17. COLOR_MASTER ── */
function setupColorMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.COLOR_MASTER);
  var headers = [
    'Color Code', 'Color Name', 'Pantone Reference', 'Hex Code',
    'Color Swatch', 'Color Family', 'Active'
  ];
  var descriptions = [
    'Unique code', 'Standard color name', 'Pantone # if available',
    '#RRGGBB format', 'BG auto-set by GAS', 'Group (Red/Blue/etc)', 'Yes/No'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — COLOR_MASTER — Colors with Pantone & Hex Swatch',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Sample colors
  var colorData = [
    ['CLR-001', 'Black', 'Pantone Black C', '#000000', '', 'Neutral', 'Yes'],
    ['CLR-002', 'White', 'Pantone White', '#FFFFFF', '', 'Neutral', 'Yes'],
    ['CLR-003', 'Navy Blue', 'Pantone 289 C', '#003366', '', 'Blue', 'Yes'],
    ['CLR-004', 'Charcoal Grey', 'Pantone Cool Gray 11C', '#333333', '', 'Grey', 'Yes'],
    ['CLR-005', 'Red', 'Pantone 186 C', '#CC0000', '', 'Red', 'Yes'],
    ['CLR-006', 'Royal Blue', 'Pantone 286 C', '#0033A0', '', 'Blue', 'Yes'],
    ['CLR-007', 'Olive Green', 'Pantone 5757 C', '#5B6236', '', 'Green', 'Yes'],
    ['CLR-008', 'Maroon', 'Pantone 195 C', '#800020', '', 'Red', 'Yes'],
    ['CLR-009', 'Heather Grey', 'Pantone 423 C', '#999999', '', 'Grey', 'Yes'],
    ['CLR-010', 'Mustard', 'Pantone 7406 C', '#E3A600', '', 'Yellow', 'Yes']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, colorData.length, colorData[0].length).setValues(colorData);
  }
}

/* ── 18. SIZE_MASTER ── */
function setupSizeMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.SIZE_MASTER);
  var headers = [
    'Size Code', 'Size Label', 'Chest (inches)', 'Length (inches)',
    'Shoulder (inches)', 'Sleeve (inches)', 'Category', 'Gender', 'Active'
  ];
  var descriptions = [
    'S/M/L/XL etc', 'Display label', 'Chest measurement',
    'Body length', 'Shoulder width', 'Sleeve length',
    'Tops/Bottoms', 'Men/Women/Kids', 'Yes/No'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — SIZE_MASTER — Size Specs with Body Measurements',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  var sizeData = [
    ['S', 'Small', 38, 26, 17, 8, 'Tops', 'Men', 'Yes'],
    ['M', 'Medium', 40, 27, 18, 8.5, 'Tops', 'Men', 'Yes'],
    ['L', 'Large', 42, 28, 19, 9, 'Tops', 'Men', 'Yes'],
    ['XL', 'Extra Large', 44, 29, 20, 9.5, 'Tops', 'Men', 'Yes'],
    ['XXL', '2X Large', 46, 30, 21, 10, 'Tops', 'Men', 'Yes'],
    ['3XL', '3X Large', 48, 31, 22, 10.5, 'Tops', 'Men', 'Yes']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, sizeData.length, sizeData[0].length).setValues(sizeData);
  }
}

/* ── 19. FABRIC_TYPE_MASTER ── */
function setupFabricTypeMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.FABRIC_TYPE_MASTER);
  var headers = [
    'Fabric Type Code', 'Knit Construction', 'Short Code', 'Description',
    'Common Use', 'Active'
  ];
  var descriptions = [
    'Unique code', 'Full construction name', 'Abbreviation',
    'Technical description', 'Typical garment use', 'Yes/No'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — FABRIC_TYPE_MASTER — Knit Construction Types',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  var fabricData = [
    ['FT-001', 'Single Jersey', 'SJ', 'Plain knit one face', 'T-shirts, vests', 'Yes'],
    ['FT-002', 'Pique', 'PIQ', 'Textured knit with honeycomb', 'Polo shirts', 'Yes'],
    ['FT-003', 'French Terry / Fleece', 'FLC', 'Loop back / brushed back', 'Sweatshirts, hoodies', 'Yes'],
    ['FT-004', 'Interlock', 'INT', 'Double knit, same both sides', 'Premium tees, tracksuits', 'Yes'],
    ['FT-005', 'Rib Knit', 'RIB', 'Alternating knit/purl', 'Cuffs, collars, trims', 'Yes'],
    ['FT-006', 'Autostriper / Feeder Stripe', 'AFS', 'Horizontal stripes in knitting', 'Striped tees, polos', 'Yes'],
    ['FT-007', 'Waffle Knit', 'WFL', 'Thermal waffle texture', 'Thermals, casual wear', 'Yes'],
    ['FT-008', 'Textured / Yarn Dyed', 'TXD', 'Pre-dyed yarn patterns', 'Premium fashion tees', 'Yes'],
    ['FT-009', 'Other', 'OTH', 'Non-standard constructions', 'Special orders', 'Yes']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, fabricData.length, fabricData[0].length).setValues(fabricData);
  }
}

/* ── 20. TAG_MASTER ── */
function setupTagMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.TAG_MASTER);
  var headers = [
    'Tag Code', 'Tag Name', 'Applies To', 'Active', 'Color', 'Description'
  ];
  var descriptions = [
    'TAG-001 format', 'Display name', 'Sheet names (comma-separated) or ALL',
    'Yes/No', 'Chip color hex', 'What this tag means'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — TAG_MASTER — 28 Starter Tags (Chip System)',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  var tagData = [
    ['TAG-001', 'Best Seller', 'ARTICLE_MASTER', 'Yes', '#27AE60', 'Top selling article'],
    ['TAG-002', 'New Arrival', 'ARTICLE_MASTER', 'Yes', '#2980B9', 'Recently launched'],
    ['TAG-003', 'Discontinued', 'ALL', 'Yes', '#E74C3C', 'Being phased out'],
    ['TAG-004', 'Premium Quality', 'RM_MASTER_FABRIC,TRIM_MASTER', 'Yes', '#8E44AD', 'High-grade material'],
    ['TAG-005', 'Budget Friendly', 'ALL', 'Yes', '#F39C12', 'Cost-effective option'],
    ['TAG-006', 'Seasonal Only', 'ARTICLE_MASTER,RM_MASTER_FABRIC', 'Yes', '#E67E22', 'Available in specific seasons'],
    ['TAG-007', 'Import', 'RM_MASTER_FABRIC,TRIM_MASTER', 'Yes', '#3498DB', 'Imported material'],
    ['TAG-008', 'Domestic', 'RM_MASTER_FABRIC,TRIM_MASTER', 'Yes', '#1ABC9C', 'Locally sourced'],
    ['TAG-009', 'Eco Friendly', 'ALL', 'Yes', '#27AE60', 'Sustainable/organic'],
    ['TAG-010', 'Certified Supplier', 'SUPPLIER_MASTER', 'Yes', '#2ECC71', 'Has quality certification'],
    ['TAG-011', 'Fast Delivery', 'SUPPLIER_MASTER', 'Yes', '#3498DB', 'Quick turnaround supplier'],
    ['TAG-012', 'Slow Moving', 'ARTICLE_MASTER,RM_MASTER_FABRIC', 'Yes', '#E74C3C', 'Low demand/slow sell'],
    ['TAG-013', 'Core Style', 'ARTICLE_MASTER', 'Yes', '#2C3E50', 'Always-on basic styles'],
    ['TAG-014', 'Limited Edition', 'ARTICLE_MASTER', 'Yes', '#9B59B6', 'Limited production run'],
    ['TAG-015', 'Needs Review', 'ALL', 'Yes', '#F1C40F', 'Data needs verification'],
    ['TAG-016', 'Approved', 'ALL', 'Yes', '#2ECC71', 'Verified and approved'],
    ['TAG-017', 'Color Sensitive', 'RM_MASTER_FABRIC', 'Yes', '#E74C3C', 'Requires color matching'],
    ['TAG-018', 'Heavy GSM', 'RM_MASTER_FABRIC', 'Yes', '#34495E', 'Above 250 GSM'],
    ['TAG-019', 'Light GSM', 'RM_MASTER_FABRIC', 'Yes', '#BDC3C7', 'Below 160 GSM'],
    ['TAG-020', 'Bulk Item', 'TRIM_MASTER,CONSUMABLE_MASTER,PACKAGING_MASTER', 'Yes', '#E67E22', 'Order in large quantities'],
    ['TAG-021', 'Critical Spare', 'TRIM_MASTER', 'Yes', '#C0392B', 'Must maintain safety stock'],
    ['TAG-022', 'Machine Specific', 'MACHINE_MASTER', 'Yes', '#7F8C8D', 'Tied to specific machine'],
    ['TAG-023', 'Key Account', 'CUSTOMER_MASTER', 'Yes', '#2980B9', 'Major customer'],
    ['TAG-024', 'Regular Buyer', 'CUSTOMER_MASTER', 'Yes', '#27AE60', 'Repeat customer'],
    ['TAG-025', 'New Vendor', 'SUPPLIER_MASTER', 'Yes', '#F39C12', 'Recently onboarded supplier'],
    ['TAG-026', 'Quality Issue', 'SUPPLIER_MASTER,RM_MASTER_FABRIC', 'Yes', '#E74C3C', 'Has quality concerns'],
    ['TAG-027', 'Price Negotiation', 'SUPPLIER_MASTER', 'Yes', '#F1C40F', 'Price under negotiation'],
    ['TAG-028', 'Sample Pending', 'ALL', 'Yes', '#95A5A6', 'Awaiting sample approval']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, tagData.length, tagData[0].length).setValues(tagData);
  }
}

/* ── 21. ITEM_CHANGE_LOG ── */
function setupItemChangeLog_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.ITEM_CHANGE_LOG);
  var headers = [
    'Timestamp', 'User Email', 'Action', 'Sheet Name', 'Item Code',
    'Field Changed', 'Old Value', 'New Value', 'Row', 'Column'
  ];
  var descriptions = [
    'dd-MMM-yyyy HH:mm:ss IST', 'Google account email', 'CREATE/UPDATE/DELETE/STATUS_CHANGE',
    'Which master sheet', 'Item code from col A', 'Column header name',
    'Previous value', 'New value', 'Row number', 'Column number'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — ITEM_CHANGE_LOG — Auto Audit Trail (GAS-written only)',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Protect this sheet — GAS writes only
  var protection = sheet.protect().setDescription('ITEM_CHANGE_LOG — GAS auto-write only');
  protection.setWarningOnly(true);
}

/* ── 22. MASTER_RELATIONS ── */
function setupMasterRelations_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.MASTER_RELATIONS);
  var headers = [
    '🔑 Relation Code', '→ Parent Sheet', '→ Parent Column',
    '← Referenced Sheet', '← Ref Code Column', '← Ref Display Col',
    '⟷ Allow Create New', '⚙ Dropdown Filter', '⚙ Multi-Select',
    '⚙ Cross-File', '⚙ Ref File Label', 'Active', 'Notes'
  ];
  var descriptions = [
    'REL-001 to REL-046', 'Sheet containing the FK', 'Column with the FK',
    'Sheet being referenced', 'Code column in ref sheet', 'Display column in ref sheet',
    'Yes = sidebar create new', 'Filter condition', 'Yes = comma-separated',
    'Yes = different file', 'FILE_1A/1B/1C', 'Yes/No', 'Description'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — MASTER_RELATIONS — 46 FK Relations Config',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Pre-populate key File 1A relations
  var relData = [
    ['REL-001', 'ARTICLE_MASTER', '→ MAIN FABRIC USED', 'RM_MASTER_FABRIC', '# RM Code', '∑ FINAL FABRIC SKU', 'Yes', '', 'No', 'No', 'FILE_1A', 'Yes', 'Article → Fabric FK'],
    ['REL-002', 'ARTICLE_MASTER', '→ HSN Code', 'HSN_MASTER', 'HSN Code', 'HSN Description', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Article → HSN'],
    ['REL-003', 'ARTICLE_MASTER', 'Colour Name(s)', 'COLOR_MASTER', 'Color Code', 'Color Name', 'No', '', 'No', 'No', 'FILE_1A', 'No', 'REMOVED V12.5 — Col Q stores colour names directly (dropdown), not FK codes'],
    ['REL-004', 'ARTICLE_MASTER', '⟷ Tags', 'TAG_MASTER', 'Tag Code', 'Tag Name', 'Yes', 'ARTICLE_MASTER', 'Yes', 'No', 'FILE_1A', 'Yes', 'Article → Tags (multi)'],
    ['REL-005', 'RM_MASTER_FABRIC', 'L3 Knit Type', 'FABRIC_TYPE_MASTER', 'Fabric Type Code', 'Knit Construction', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Fabric → Knit Type (V9: renamed from KNIT NAME / STRUCTURE)'],
    ['REL-006', 'RM_MASTER_FABRIC', '⟷ YARN COMPOSITION', 'RM_MASTER_YARN', 'Yarn Name', '# RM Code', 'Yes', '', 'Yes', 'No', 'FILE_1A', 'Yes', 'Fabric → Yarn names→codes (multi)'],
    ['REL-007', 'RM_MASTER_FABRIC', '→ HSN Code', 'HSN_MASTER', 'HSN Code', 'HSN Description', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Fabric → HSN'],
    ['REL-008', 'RM_MASTER_FABRIC', '→ Primary Supplier', 'SUPPLIER_MASTER', 'Supplier Code', 'Supplier Name', 'No', '', 'No', 'Yes', 'FILE_1C', 'Yes', 'Fabric → Supplier (cross-file)'],
    ['REL-009', 'RM_MASTER_FABRIC', '⟷ Tags', 'TAG_MASTER', 'Tag Code', 'Tag Name', 'Yes', 'RM_MASTER_FABRIC', 'Yes', 'No', 'FILE_1A', 'Yes', 'Fabric → Tags (multi)'],
    ['REL-010', 'RM_MASTER_YARN', '→ HSN Code', 'HSN_MASTER', 'HSN Code', 'HSN Description', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Yarn → HSN'],
    ['REL-011', 'RM_MASTER_YARN', '→ Supplier Code', 'SUPPLIER_MASTER', 'Supplier Code', 'Supplier Name', 'No', '', 'No', 'Yes', 'FILE_1C', 'Yes', 'Yarn → Supplier (cross-file)'],
    ['REL-012', 'RM_MASTER_WOVEN', '→ HSN Code', 'HSN_MASTER', 'HSN Code', 'HSN Description', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Woven → HSN'],
    ['REL-013', 'RM_MASTER_WOVEN', '→ Primary Supplier', 'SUPPLIER_MASTER', 'Supplier Code', 'Supplier Name', 'No', '', 'No', 'Yes', 'FILE_1C', 'Yes', 'Woven → Supplier (cross-file)'],
    ['REL-014', 'TRIM_MASTER', '→ COLOUR CODE', 'COLOR_MASTER', 'Color Code', 'Color Name', 'Yes', '', 'No', 'No', 'FILE_1A', 'Yes', 'Trim → Color'],
    ['REL-015', 'TRIM_MASTER', '→ HSN Code', 'HSN_MASTER', 'HSN Code', 'HSN Description', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Trim → HSN'],
    ['REL-016', 'TRIM_MASTER', '→ Primary Supplier', 'SUPPLIER_MASTER', 'Supplier Code', 'Supplier Name', 'No', '', 'No', 'Yes', 'FILE_1C', 'Yes', 'Trim → Supplier (cross-file)'],
    ['REL-017', 'CONSUMABLE_MASTER', '→ HSN Code', 'HSN_MASTER', 'HSN Code', 'HSN Description', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Consumable → HSN'],
    ['REL-018', 'CONSUMABLE_MASTER', '→ Primary Supplier', 'SUPPLIER_MASTER', 'Supplier Code', 'Supplier Name', 'No', '', 'No', 'Yes', 'FILE_1C', 'Yes', 'Consumable → Supplier'],
    ['REL-019', 'PACKAGING_MASTER', '→ HSN Code', 'HSN_MASTER', 'HSN Code', 'HSN Description', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Packaging → HSN'],
    ['REL-020', 'PACKAGING_MASTER', '→ Primary Supplier', 'SUPPLIER_MASTER', 'Supplier Code', 'Supplier Name', 'No', '', 'No', 'Yes', 'FILE_1C', 'Yes', 'Packaging → Supplier'],
    ['REL-044', 'TRIM_MASTER', '→ COLOUR CODE', 'COLOR_MASTER', 'Color Code', 'Color Name', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Trim color → garment color'],
    ['REL-045', 'ITEM_SUPPLIER_RATES', '→ Item Code', 'DYNAMIC', 'Code Col', 'Name Col', 'No', '', 'No', 'No', 'FILE_1B', 'Yes', 'Poly-FK. Routes by Item Master col.'],
    ['REL-046', 'ITEM_SUPPLIER_RATES', '→ Supplier Code', 'SUPPLIER_MASTER', 'Supplier Code', 'Supplier Name', 'No', '', 'No', 'Yes', 'FILE_1C', 'Yes', 'ISR → Supplier (cross-file)']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, relData.length, relData[0].length).setValues(relData);
  }
}
