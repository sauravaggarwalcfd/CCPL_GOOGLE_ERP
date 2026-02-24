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
  setupUOMMaster_(ss);
  setupHSNMaster_(ss);
  setupColorMaster_(ss);
  setupSizeMaster_(ss);
  setupGarmentComponent_(ss);
  setupFabricTypeMaster_(ss);
  setupTagMaster_(ss);
  setupItemChangeLog_(ss);
  setupMasterRelations_(ss);

  // Delete temp sheet created during old-sheet deletion
  deleteTempSheet_(ss);

  SpreadsheetApp.flush();
  Logger.log('All 23 FILE 1A sheets setup complete.');
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

/* ═══════════════════════════════════════════════════════════
   INDIVIDUAL SHEET SETUP FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

/* ── 01. ARTICLE_MASTER (26 cols) ── */
function setupArticleMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.ARTICLE_MASTER);
  var headers = [
    '🔑 Article Code', 'Article Description', 'Short Name', 'IMAGE LINK',
    '⟷ SKETCH DRIVE LINKS', 'Buyer Style No', 'L1 Division',
    'L2 Product Category', 'Season', 'Gender', 'Fit Type', 'Neckline',
    'Sleeve Type', '→ MAIN FABRIC USED', '← Fabric Name (Auto)',
    'Color Code(s)', 'Size Range', '∑ FINAL MARKUP %', '∑ FINAL MARKDOWN %',
    'W.S.P (Rs)', 'MRP (Rs)', '→ HSN Code', '← GST % (Auto)',
    'Status', 'Remarks', '⟷ Tags'
  ];
  var descriptions = [
    '4-5 digits + 2 CAPS. No space. Manual.', 'Full name with construction', 'Max 25 chars',
    'Google Drive link', 'Popup log. Appends only.', 'Optional buyer ref',
    'Auto: Apparel', 'Dropdown', 'Multi-select', 'Dropdown', 'Dropdown',
    'Dropdown', 'Dropdown', 'FK → RM_MASTER_FABRIC', 'Auto-filled by GAS',
    'Multi-select → COLOR_MASTER', 'Display only', '(MRP−WSP)÷WSP×100',
    '(MRP−WSP)÷MRP×100', 'Wholesale price/pc', 'Max retail price',
    'FK → HSN_MASTER', 'Auto from HSN', 'Active/Inactive/Dev/Discontinued',
    'Notes', 'Multi-select → TAG_MASTER'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — ARTICLE_MASTER — Finished Garments',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Validations
  setColumnValidation_(sheet, 8, ['Tops-Polo', 'Tops-Tee', 'Sweatshirt', 'Tracksuit', 'Bottoms']);
  setColumnValidation_(sheet, 10, ['Men', 'Women', 'Kids', 'Unisex']);
  setColumnValidation_(sheet, 11, ['Regular', 'Slim', 'Relaxed', 'Oversized', 'Athletic']);
  setColumnValidation_(sheet, 12, ['Round Neck', 'V-Neck', 'Collar', 'Hooded', 'Mock Neck']);
  setColumnValidation_(sheet, 13, ['Half', 'Full', 'Sleeveless', '3-4', 'Raglan']);
  setColumnValidation_(sheet, 24, CONFIG.STATUS_LIST);

  // L1 Division auto-fill
  sheet.getRange(4, 7, 500, 1).setValue('Apparel');
}

/* ── 02. RM_MASTER_FABRIC (25 cols) ── */
function setupRMFabric_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.RM_MASTER_FABRIC);
  var headers = [
    '# RM Code', '∑ FINAL FABRIC SKU', 'KNIT NAME / STRUCTURE',
    '⟷ YARN COMPOSITION', '← Yarn Names (Auto)', 'FABRIC TYPE', 'COLOUR',
    'GSM (Min)', 'GSM (Max)', 'Width (inches)', 'UOM', '→ HSN Code',
    '← GST % (Auto)', '→ Primary Supplier', 'Supplier Code',
    '← Supplier Name (Auto)', 'Lead Time (Days)', 'Reorder Level',
    'Min Order Qty', 'Cost per UOM', 'Season', 'Status', 'Remarks',
    '← FINISHED FABRIC COST (Auto)', '⟷ Tags'
  ];
  var descriptions = [
    'AUTO: RM-FAB-xxx', 'GAS builds: KNIT+YARN', 'FK → FABRIC_TYPE_MASTER',
    'Multi-select FK → RM_MASTER_YARN', 'Auto from yarn codes', 'KORA / FINISHED',
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

  setColumnValidation_(sheet, 6, ['KORA', 'FINISHED']);
  setColumnValidation_(sheet, 7, ['KORA', 'COLOURED', 'DYED', 'MEL']);
  setColumnValidation_(sheet, 11, CONFIG.UOM_LIST);
  setColumnValidation_(sheet, 22, CONFIG.STATUS_LIST);
}

/* ── 03. RM_MASTER_YARN (15 cols) ── */
function setupRMYarn_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.RM_MASTER_YARN);
  var headers = [
    '# RM Code', 'Yarn Name', 'Colour Type', 'Colour (if dyed)',
    '→ HSN Code', '← GST % (Auto)', '→ Supplier Code',
    '← Primary Supplier', '← Supplier Name (Auto)',
    'Season for Cost', 'Avg Cost (excl GST)', 'GST % for Cost',
    '∑ Total Cost (incl GST)', 'Status', 'Remarks'
  ];
  var descriptions = [
    'AUTO: RM-YRN-xxx', 'Full yarn description', 'Raw/Dyed/Melange',
    'If dyed/melange only', 'FK → HSN_MASTER', 'Auto from HSN',
    'FK → SUPPLIER_MASTER', 'Supplier name ref', 'Auto from SUPPLIER',
    'SS25/AW25 etc', '₹ per KG excl GST', 'GST rate %',
    'Auto: Cost × (1+GST%/100)', 'Active/Inactive', 'Composition notes'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — RM_MASTER_YARN — Yarn',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  setColumnValidation_(sheet, 3, ['Raw', 'Dyed', 'Melange']);
  setColumnValidation_(sheet, 14, CONFIG.STATUS_LIST);
}

/* ── 04. RM_MASTER_WOVEN (15 cols) ── */
function setupRMWoven_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.RM_MASTER_WOVEN);
  var headers = [
    '# RM Code', 'Woven/Interlining Name', 'Type', 'Composition',
    'Width (inches)', 'Weight (GSM)', 'UOM', '→ HSN Code',
    '← GST % (Auto)', '→ Primary Supplier', '← Supplier Name (Auto)',
    'Cost per UOM', 'Reorder Level', 'Status', 'Remarks'
  ];
  var descriptions = [
    'AUTO: RM-WVN-xxx', 'Full description', 'Woven/Interlining/Fusing',
    'Fabric blend', 'Width', 'GSM', 'MTR/KG', 'FK → HSN_MASTER',
    'Auto from HSN', 'FK → SUPPLIER_MASTER', 'Auto from SUPPLIER',
    '₹ per UOM', 'Stock trigger qty', 'Active/Inactive', 'Notes'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — RM_MASTER_WOVEN — Woven & Interlining',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  setColumnValidation_(sheet, 3, ['Woven', 'Interlining', 'Fusing']);
  setColumnValidation_(sheet, 7, CONFIG.UOM_LIST);
  setColumnValidation_(sheet, 14, CONFIG.STATUS_LIST);
}

/* ── 05. TRIM_MASTER (29 cols) ── */
function setupTrimMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.TRIM_MASTER);
  var headers = [
    '# TRM Code', 'Parent Code', '⚠ Trim Name', '⚠ Trim Category',
    'Trim Sub-Category', 'IMAGE LINK', '→ COLOUR CODE',
    '← Color/Shade Name (Auto)', 'UOM', '→ HSN Code',
    '← GST % (Auto)', '→ Primary Supplier', 'Supplier Code',
    'Lead Time (Days)', 'Reorder Level', 'Status',
    '⟷ Attr 1 Name', 'Attr 1 Value', '⟷ Attr 2 Name', 'Attr 2 Value',
    '⟷ Attr 3 Name', 'Attr 3 Value', '⟷ Attr 4 Name', 'Attr 4 Value',
    '⟷ Attr 5 Name', 'Attr 5 Value', '⟷ Attr 6 Name', 'Attr 6 Value',
    'Remarks'
  ];
  var descriptions = [
    'AUTO: TRM-[CAT]-xxx', 'FK → self (variant)', 'Required', 'Required dropdown',
    'Sub-category text', 'Google Drive link', 'FK → COLOR_MASTER',
    'Auto from COLOR_MASTER', 'CONE/MTR/PCS/KG/SET/ROLL', 'FK → HSN_MASTER',
    'Auto from HSN', 'FK → SUPPLIER_MASTER', 'Supplier cat code',
    'Days', 'Stock trigger', 'Active/Inactive/Dev/Discontinued',
    'Auto-filled by GAS', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Brand notes, quality flag'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — TRIM_MASTER — All Trims (29 Columns)',
    headers, descriptions, CONFIG.TAB_COLORS.TRIM_MASTER);

  // Trim Category dropdown
  setColumnValidation_(sheet, 4, CONFIG.TRIM_CATEGORY_LIST);
  setColumnValidation_(sheet, 9, CONFIG.UOM_LIST);
  setColumnValidation_(sheet, 16, CONFIG.STATUS_LIST);
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

/* ── 08. CONSUMABLE_MASTER ── */
function setupConsumableMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.CONSUMABLE_MASTER);
  var headers = [
    '# CON Code', 'Parent Code', '⚠ Consumable Name', '⚠ Category',
    'Sub-Category', 'UOM', '→ HSN Code', '← GST % (Auto)',
    '→ Primary Supplier', '← Supplier Name (Auto)', 'Cost per UOM',
    'Reorder Level', 'Status',
    '⟷ Attr 1 Name', 'Attr 1 Value', '⟷ Attr 2 Name', 'Attr 2 Value',
    '⟷ Attr 3 Name', 'Attr 3 Value', '⟷ Attr 4 Name', 'Attr 4 Value',
    'Remarks'
  ];
  var descriptions = [
    'AUTO: CON-[CAT]-xxx', 'FK → self (variant)', 'Required', 'Required dropdown',
    'Sub-category text', 'KG/LTR/PCS/SET', 'FK → HSN_MASTER', 'Auto from HSN',
    'FK → SUPPLIER_MASTER', 'Auto', '₹ per UOM', 'Stock trigger',
    'Active/Inactive', 'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown', 'Notes'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — CONSUMABLE_MASTER — Dyes, Chemicals, Needles, Oils',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  setColumnValidation_(sheet, 13, CONFIG.STATUS_LIST);
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

/* ── 11. PACKAGING_MASTER ── */
function setupPackagingMaster_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.PACKAGING_MASTER);
  var headers = [
    '# PKG Code', 'Parent Code', '⚠ Packaging Name', '⚠ Category',
    'Sub-Category', 'UOM', '→ HSN Code', '← GST % (Auto)',
    '→ Primary Supplier', '← Supplier Name (Auto)', 'Cost per UOM',
    'Reorder Level', 'Status',
    '⟷ Attr 1 Name', 'Attr 1 Value', '⟷ Attr 2 Name', 'Attr 2 Value',
    '⟷ Attr 3 Name', 'Attr 3 Value', '⟷ Attr 4 Name', 'Attr 4 Value',
    'Remarks'
  ];
  var descriptions = [
    'AUTO: PKG-[CAT]-xxx', 'FK → self (variant)', 'Required', 'Required dropdown',
    'Sub-category text', 'PCS/ROLL/KG', 'FK → HSN_MASTER', 'Auto from HSN',
    'FK → SUPPLIER_MASTER', 'Auto', '₹ per UOM', 'Stock trigger',
    'Active/Inactive', 'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown',
    'Auto-filled', 'Dropdown', 'Auto-filled', 'Dropdown', 'Notes'
  ];

  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — PACKAGING_MASTER — Poly Bags, Cartons, Hangers',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  setColumnValidation_(sheet, 13, CONFIG.STATUS_LIST);
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

/* ── 14. ITEM_CATEGORIES ── */
function setupItemCategories_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.ITEM_CATEGORIES);
  var headers = [
    'L1 Division', 'L2 Product Category', 'L3 Sub-Category', 'Active', 'Notes'
  ];
  var descriptions = [
    'Top level: Apparel', 'Tops-Polo/Tee/Sweatshirt etc', 'Specific sub-type', 'Yes/No', 'Notes'
  ];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — ITEM_CATEGORIES — 3-Level Category Tree',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  // Pre-populate categories
  var catData = [
    ['Apparel', 'Tops-Polo', 'Polo T-Shirt', 'Yes', ''],
    ['Apparel', 'Tops-Tee', 'Round Neck T-Shirt', 'Yes', ''],
    ['Apparel', 'Tops-Tee', 'V-Neck T-Shirt', 'Yes', ''],
    ['Apparel', 'Sweatshirt', 'Crew Neck Sweatshirt', 'Yes', ''],
    ['Apparel', 'Sweatshirt', 'Hoodie', 'Yes', ''],
    ['Apparel', 'Tracksuit', 'Tracksuit Set', 'Yes', ''],
    ['Apparel', 'Tracksuit', 'Track Pants', 'Yes', ''],
    ['Apparel', 'Bottoms', 'Jogger', 'Yes', ''],
    ['Apparel', 'Bottoms', 'Shorts', 'Yes', '']
  ];
  if (sheet.getLastRow() < 4) {
    sheet.getRange(4, 1, catData.length, catData[0].length).setValues(catData);
  }
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

  // Common textile HSN codes
  var hsnData = [
    ['6109', 'T-shirts, singlets and other vests, knitted', 5, 'Garment', 'Yes'],
    ['6105', 'Mens shirts, knitted', 5, 'Garment', 'Yes'],
    ['6110', 'Jerseys, pullovers, cardigans, knitted', 12, 'Garment', 'Yes'],
    ['6104', 'Womens suits, dresses, skirts, knitted', 5, 'Garment', 'Yes'],
    ['6001', 'Pile fabrics including long pile and terry, knitted', 5, 'Fabric', 'Yes'],
    ['6006', 'Other knitted fabrics', 5, 'Fabric', 'Yes'],
    ['5509', 'Yarn of synthetic staple fibres', 12, 'Yarn', 'Yes'],
    ['5205', 'Cotton yarn (not for retail)', 5, 'Yarn', 'Yes'],
    ['5402', 'Synthetic filament yarn', 12, 'Yarn', 'Yes'],
    ['5204', 'Cotton sewing thread', 12, 'Thread', 'Yes'],
    ['9606', 'Buttons, press fasteners, snap fasteners', 18, 'Trim', 'Yes'],
    ['9607', 'Slide fasteners (zippers)', 18, 'Trim', 'Yes'],
    ['5807', 'Labels, badges and similar articles of textiles', 12, 'Trim', 'Yes'],
    ['5806', 'Narrow woven fabrics (tapes, ribbons)', 12, 'Trim', 'Yes'],
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

/* ── 19. GARMENT_COMPONENT ── */
function setupGarmentComponent_(ss) {
  var sheet = getOrCreateSheet_(ss, CONFIG.SHEETS.GARMENT_COMPONENT);
  var headers = ['Garment Component'];
  var descriptions = ['Dropdown of all garment panels / semi-finished parts. Used in cutting & production.'];
  applyStandardFormat_(sheet,
    'CC ERP FILE 1A — GARMENT_COMPONENT — Garment Panels / Semi-Finished Parts',
    headers, descriptions, CONFIG.TAB_COLORS.FILE_1A_ITEMS);

  var components = [
    'BACK','BACK PANELS','BACK POCKET','BACK YOKE','BELT','BOTTOM PANELS','BR LEGS',
    'COLLAR (17" X 3.25" - 36/42)','FR+BK+SLV+MOON+BORDER+BAND','FR+BK+SLV+MOON+BORDER+BAND+SLV CUFFS',
    'FR+BK+SLV+MOON+NECK','FR+BK+SLV+MOON+NECK TAPE','FR+BK+SLV+MOON+NECK TAPE+POCKET',
    'FRONT','FRONT PANELS','FRONT YOKE','FULL PIECE','GAMLA MOON','INNER JATI','INNER POCKET',
    'INSIDE PLACKET','LR LEGS','LR POCKETS','LR SIDE PANELS','MOON','NECK','NECK TAPE',
    'OUTER JATI','OUTER POCKET','PLACKET','POCKET','POCKET FITCH','POCKET FLAP','POCKET JATI',
    'SIDE POCKET','SLEEVE','SLEEVE CUFFS','SLEEVE TAPE (29" X 1.125"-36/50)',
    'ZIP INSIDE+NK. TAPE','ZIP YKK 8"','ZIPPER','FRONT+BACK+SLEEVE','HIGH NECK','V-NECK',
    'T-NECK','ROUND NECK','LR WITH BELT+POCKETS','FR+BK+SLV+MOON+NK+NK TAPE+BORDER+SLV CUFFS',
    'FR+BK. PANEL + BK. YOKE+SLV+MOON','BAND+PLACKET+POCKET','FR+BK+SLV+MOON',
    'HOOD+PATCH POCKET+NECK TAPE','FR+BK+SLV+MOON+PLKT+NK. TAPE',
    'LR-LEG PANELS + BELT + JATI POCKETS','BR LEGS+BELT+JATI','FULL LR ',
    'FR+BK+SLV+PKT+PLKT+FITCH+POKT BAG+NK TAPE','SLV CUFF+BORDER',
    'FR+BK+SLV+MOON+PKT+PLKT+NK TAPE ','SHOULDER','FRONT+BACK+ SLV PANELS & MOON',
    'FRONT+BACK+ SLV PANELS+MOON+NECK TAPE','CENTRE PANEL+ SLV PANELS','FRONT BOTTOM PANEL',
    'COLLAR (18" X 3.25"-44/50)','INNER BAND','FR+BK+SLV+PKT+COLLAR+PLKT+BK. YOKE',
    'INNER BACK YOKE','LR-LEG PANELS + JATI POCKETS','FR+BK+SLV+MOON+BAND+PLKT',
    'FR+BK+SLV+PKT+FITCH+POKT BAG+NK TAPE','COLLAR + PLACKET TAPE',
    'COLLAR + PLACKET TAPE+SLV CUFFS','FR+BK+SLV','FRT+BK+SL+MOON+COLLAR+FASHION',
    'FR+BK+SLV+PKT+PLKT+FITCH+POKT BAG+NK TAPE+ZIP BONE ','ZIP COVERING',
    'FR+BK+SLV+MOON+PLKT+PKT+FITCH+NK BONE','FR+BK+SLV+MOON+POCKET BAG+NK TAPE',
    'FR+BK+SLV+MOON+BAND+PKT BAG+FITCH ','COLLAR','COLLAR + CUFF',
    'LR + TOP INNER PLACKET','LR LEGS+BK POCKET+BELT',
    'FR+BK+SLV+MOON+SELF COLLAR+PLACKET+FASHION+POCKET','LR LEGS+POCKETS+BK POCKET ',
    'FULL TOP+FULL LR ','TOP POCKETS+LR POCKETS+ZIP BONE','SLEEVE CUFF +BORDER+NECK',
    'LR LEGS+BELT+JATI +BK POCKET ','FRONT PANELS+BACK+SLEEVE+MOON+INNER PLACKET+NK. TAPE',
    'FRONT PANELS+BACK+SLEEVE+MOON+PLACKET+NK. TAPE',
    'FR+BK+SLV+MOON+BAND COLLAR+SLV CUFFS+BORDER','4 POCKETS','4 POCKETS + ZIP COVERING',
    'LR-W/OUT INNER POCKETS','FRONT PANEL + SLEEVE + MOON + BACK',
    'FR+BK+SLV+MOON+POCKET+COLLAR+CUFF+BORDER+ZIP BONE',
    'FR+BK+SLV+MOON+COLLAR+CUFF+BORDER+ZIP BONE','AT SIDE POCKET',
    'FR+BK+SLV+MOON+PKTBAG+FITCH','LR LEGS+POCKETS+BELT','FR+BK+SLV+NK TAPE',
    'LR + OUTER JATI POCKET','INNER JATI+2 UPPER POCKETS','PIPING ',
    'FR+BK+SLV+MOON+COLLAR+2 PKT','4 LEGS+BELT+2 POCKETS ','INNER JATI POCKETS',
    'ZIP COVERING+FR POCKET','FR+BK+SLV+MOON+COLLAR+ZIP BONE','FR+BK+SLV 1+HOOD',
    'FR PANEL+BK+SLV1+MOON','INNER HOOD ','FR PANEL+SLV PANEL','LR W/O POCKETS','4 LEGS ',
    'BRIEF+POCKET','POCKET BAGS','LR +4 POCKETS','SLEEVE CUFF (21"X3")','2 UPPER POCKETS',
    'FR+BK+SLV+MOON+2 PKTS','NK TAPE+UPPER POCKETS 2','FR+BK+SLV+MOON+2PKTS+FITCH+COLLAR ',
    'ZIP INSIDE+2PKTS+FITCH','FR+BK+OUTER HOOD+2 PKT+SLV',
    'INNER HOOD+NK TAPE+ZIP INSIDE+2 PKT','ZIP INSIDE+2PKTS+NK BONE ','LR 2 POCKETS',
    'LR +2 PKTS ','PKT  BONE +SHLDR BONE ','ZIP INSIDE BONE +2PKTS ',
    'FR+BK+UPPER PLKT ','SLV+PKT','PLKT+MOON+NK BONE ','4 LEGS +2PKTS +BK PKT ',
    'FR+BK+SLV+NK BAND+PKT  FITCH+PKT 2+YOKE ','INNER  ',
    'BAND +PKT FITCH+FR PATCH +PKT 2','LR PIPING ','FR+BK+SLV+BK YOKE+PLKT+BAND',
    'FULL BR ','FR+BK+SLV 1+MOON+HOOD','FR+BK+SLV 1','LR LEGS+2 POCKETS+BK POCKET',
    '2 POCKETS','INNERHOOD+NK TAPE+ZIP BONE',
    'FR+BK+SLV+MOON+COLLAR+FASHION+BORDER+CUFF',
    'FR+BK+SLV+MOON+PKT+FITCH+NK BAND+PLKT ','PLKT+NK BONE',
    'COLLAR (16"X2.5") - 36/42','COLLAR (17"X2.5") - 44/50','BAND+PLKT+MOON','OLD STOCK ',
    'FR+BK+SLV+MOON+COLLAR+JATI+CUFF+BORDER','4 LEGS+BELT+BK POKT+2 POCKETS',
    'FR+BK+SLV+MOON+POCKET','FR+BK+SLV+MOON+COLLAR+CUFF+BORDER',
    'FR+BK+SLV+MOON+NECK+CUFF+BORDER','FR=BK+SLV+MOON+HOOD 2+CUFF+BORDER',
    'FR+BK+SLV+POKT+PLKT+FASHION','BAND+PLKT+MOON+NK TAPE',
    'FR+BK=SLV+MOON+ZIP COVERING+POKT+CUFF','FR+BK+SLV+PLKT',
    'FR PANEL+BK+SLV+MOON+PLKT+NK BONE+CUFF','FR PANEL+BK+SLV+NK BONE+CUFF',
    'FR PANEL+MOON+PLKT2','FR+BK+SLV+NK BAND+PKT  FITCH+PKT 2+BORDER LAPPA',
    '4 LEGS+POCKETS','FR+BK+SLV+PKT+NK BAND+BK YOKE 2',
    'FR+BK+SLV+MOON+COLLAR+FASHION+PKT','SHOULDER BONE','FR+BK+SLV+MOON+PLKT+PKT+BAND',
    'FR+BK+SLV+MOON+JATI+CUFF+BORDER+HOOD','FR+BK+SLV+MOON+BORDER+CUFF+COLLAR+JATI+FITCH',
    'FR+BK+SLV+MOON+CUFF+BORDER','PKT+COLLAR+LUPPA','FR+BK+SLV+MOON+PLKT+POCKET+NK BONE',
    'FR PANEL+BK+SLV PANEL+MOON','FR PANEL+BK +MOON+SLV+CUFF+BORDER+NECK',
    'FR+BK+SLV+MOON+CUFF+BORDER+LR PANEL+LR BK YOKE',
    'FR PANEL+SHLDR PANEL+SLV PANEL+COLLAR','LR PANEL+LR BK YOKE',
    'FR+BK+SLV+MOON+POCKET+CUFF+BORDER','LR PANELS+BELT',
    'FR+BK+SLV+MOON+POCKET+COLLAR+CUFF+BORDER ','FR+HOOD',
    'FR+BK+SLV+MOON+COLLAR+FASHION+BORDER+CUFF+JATI',
    'FR+BK+SLV+MOON+PLKT+PATCH PKT+NK BONE',
    'FR+BK+SLV+MOON+PKTBAG+FITCH+NK BONE ','SLV TAPE + PLACKET TAPE','FR+BK+SLV+JATI',
    'FR+BK+SLV+MOON+ZIP COVERING+FITCH+PKT BAGS+NK BONE','COLLAR BAND ',
    'FR+BK+SLV+MOON+NECK+NK TAPE','FR+BK+SLV+MOON+BAND COLLAR+PLACKET',
    'FR+BK+SLV+PLKT+POKT','COLLAR+SLV TAPE','COLLAR BAND+PLKT',
    'FR+BK+SLV+MOON+COLLAR+PLKT','FR+BK+SLV+MOON+COLLAR+NK TAPE','CENTRE PANEL',
    'COLLAR+PLKT+MOON','LR+JATI+DRAWSTRING','FR+BK','SLEEVE+ NK BONE','SLEEVE++ MOON',
    'BR LEGS+BELT+JATI+DRAWCORD','BR PANEL','POCKET+MOON+NK BONE',
    'NECK BAND+PLACKET+SHOULDER PATCH','FR+SLV',
    'FR+BK+SLV+MOON+PLKT+FITCH+PKT+BAND COLLAR','4 LEGS+4 POCKETS+ FITCH',
    'POCKET+NK BONE','FR PANELS+BACK+SLV+MOON+NK BONE','BK+SLV+MOON+NK BONE',
    'LR PIPING+2 POCKETS','FR+BK+PLKT+MOON+NK BONE','FR+BK+SLV+MOON+PLKT',
    'FR PANEL+BK PANEL+MOON+SLV+PLKT+NK BONE','CENTRE PANEL+BK PANEL',
    'TOP LOWER PANEL+BK PANEL','FR YOKE+ BK YOKE+SLV+MOON+PLKT+NK BONE',
    'FR BOTTOM PANEL+BK PANEL','FR PANEL+MOON+PLKT+NK BONE','FR SIDE PANEL',
    'FR PANEL+SLV+BK','BR LEGS+BELT+POCKET','FR PANEL+BK PANEL +MOON+PLKT',
    'FR PANEL+SLV','BRIEF','FR PANEL+BK+PLKT+MOON+NK BONE','FR+BK+SLV+OUTER HOOD ',
    'INNER HOOD+NK BONE+ZIP BONE+SLV BONE','LR BONE','COLLAR+FASHION','SLEEVE BONE',
    'LR CUFF','FR+BK+SLV PANEL+PLKT+PKT','SLV PANEL+OUTER HOOD',
    'FR+BK+SLV+NECK+NK BONE','SLV+MOON+PLKT+NK BONE','SLV 1','FR+BK+BK YOKE+POKT',
    'SLV+MOON+PLKT+NK BONE+PKT FITCH+PKT BAGS','FR+BK+SLV+NK BONE',
    'COLLAR+PLKT+SLV TAPE','FR+BK+PLKT+POKT','FR+BK+SLV+OUTER BAND+ZIP COVERING',
    'INNER BAND+NECK BONE+MOON','FR+BK+SLV+MOON+NK BONE',
    'SLEEVE TAPE (30" X 1.125"-36/50)','NECK+SLV CUFF','SLEEVE TAPE (17" X 1.125")',
    'PLACKET TAPE','BACK + SLEEVE + MOON + NECK TAPE + PLACKET FITCH','HALF ZIPPER',
    'FR + BK + SLV + MOON + NECK + NECK TAPE + SLV CUFFS','FRONT FOLDER',
    'FR+BK+SLV+MOON+COLLAR','FR+BK+SLV+MOON+COLLAR+CUFF','FR+BK+SLV+MOON+NK BONE+CUFF',
    'FR+BK+SLV+MOON+PLKT+POKT+NK BONE','FR+BK+SLV+MOON+ZIP COVERING+COLLAR',
    'SLV+MOON+PLKT+NK BONE+PATCH POKT','FR+BK+SLV+MOON+POKT BAG+CUFF+NK BONE',
    'FR+BK+SLV+MOON+HOOD','FR+BK+SLV+MOON+PLKT+COLLAR+NK BONE',
    'FR PANEL+BK+SLV+SLV PANEL+MOON+NK BONE','POCKET FEACH SIZE 6 " X 1 "','FR+PLKT',
    'BK+SLV+INNER PLKT+MOON+NK BONE','FR+BK+SLV+MOON+NK BONE+POKT+SELF NECK',
    'FR+BK+SLV PANELS+HOOD+POKT JATI+LR SIDE PANELS','FR PANEL+BK PANEL+SLV PANEL',
    'FR + BK + SLV + MOON + SELF COLLAR + PLACKET + POCKET',
    'FR PANEL-2+SLV-1+BACK+OUTER HOOD+MOON+POKT-1','FR PANEL-1+SLV-1','BORDER+CUFF-1',
    'CUFF-1','POKT-2','FR + BK + SLV + MOON + BAND COLLAR','PATCH POCKET+OUTER HOOD',
    'INNER HOOD+INNER POCKET','LR LEGS+BELT+JATI+BK POCKET+FITCH','POKT-3+INNER HOOD',
    'FR PANEL-1+SLV-1+BACK+MOON+POKT-1','FR PANEL+OUTER HOOD',
    'FR PANEL+BK+MOON+SLV+POKTBAG+FITCH+PLKT+NK BONE','FR PANELS',
    'FR+BK+SLV+COLLAR+MOON+ZIP BONE','ZIP BONE+POCKETS-2',
    'FR+BK+SLV+MOON+BAND COLLAR+CUFF+BORDER+POCKET-2','FR PANEL-2+BK+SLV+MOON',
    'BORDER+SLV CUFF','FR PANEL+NK BONE',
    'FR+BK+SLV+MOON+COLLAR+FASHION+CUFF+BORDER+POKT-2','ONLY BORDER',
    'FR PANELS + BACK + SLV + MOON + INNER BAND + 2 INNER PKTS',
    'OUTER BAND + CHEST PKT FITCH + BELOW CHEST POCKET + 2 SIDE PKT FITCH + 2 UPPER POCKETS',
    'FR + BK +SLV + MOON + OUTER HOOD + 2 INNER POCKETS','INNER HOOD + 2 UPPER PKTS',
    'FRONT + SLV PANELS','FR PANELS + SLV PANELS + BACK + MOON + COLLAR BAND + 2 POCKETS',
    'FR + BK + 2 SLV + MOON + 2 BAND + 2 POCKETS + BORDER + 2 SLV CUFFS',
    '2 SIDE PANELS + 2 SLV PANELS','2 UPPER PKTS + 2 JATI PKTS',
    'FR PANELS + SLV PANELS + BACK + MOON + COLLAR BAND + 2 POCKETS + BORDER + 2 SLV CUFFS',
    'FR PANELS + BACK + OUTER BAND + MOON + 2 POCKETS',
    'FR CHEST PKT + 2 SLV + INNER BAND + 2 PKT FITCHS + BORDER + 2 SLV CUFFS',
    '2 UPPER POCKETS + 1 CHEST POCKET','FR PANELS + BK + SLV + MOON + 2 POCKETS ',
    '2 POCKETS + NK BONE','FR PANEL + BACK + MOON + SINGLE SLV + 2 POCKETS',
    'FR PANEL + HOOD + SINGLE SLV',
    'FR PANELS + BACK + SLEEVE PANELS  + MOON + BAND COLLAR + 2 POCKETS ',
    'FR PANELS + SLV PANELS ','FR PANELS + BAND',
    'FR PANELS + SLV PANELS + 2 POCKETS + BORDER',
    'FR PANELS + SLV PANELS + BACK + MOON + SELF COLLAR  + SLEEVE CUFFS',
    'FRONT + BACK + SLEEVE + MOON + COLLAR BAND + BORDER + SLEEVE CUFFS + 2 POCKETS',
    'FRONT FOLDER+NK BONE','FR + BK + SLV + MOON + COLLAR BAND  + 2 POCKETS',
    'FR + BK + SLV + MOON + PLKT + NK BONE',
    'BK + SLV + MOON + NECK TAPE + INNER PLACKETS',
    'FR + BK + SLV + MOON + COLLAR + POKT + PLKT + FASHION + CUFF','INNER + OUTER HOOD',
    'FRONT + BACK + SLEEVE + MOON + BORDER + SLEEVE CUFFS + 2 POCKETS',
    'BACK + SLEEVE + MOON + SHOULDER PANEL + COLLAR + 2 POCKETS',
    'FRONT PANELS + SLEEVE + BACK + MOON + OUTER HOOD',
    'FRONT PANELS + INNER HOOD + 2 POCKETS','FRONT PANELS + 2 POCKETS',
    'FR + BK + SLV + PLKT','SLEEVE + POKT',
    'FR + BK + SLV + MOON + NECK BONE + PLACKET ZIP COVERING',
    'FR + BK + SLV + MOON + NECK BONE','FR + BK + SLV + NECK BONE',
    'FR PANEL + BK PANEL + SL PANEL-2 + COLLAR BAND + MOON',
    'FR PANEL + BK PANEL + SLV PANEL-2 + SLEEVE CUFF + BORDER + PKT-2',
    'LR PANELS + 2 POCKETS',
    'FR YOKE + FRONT PANELS + BACK + SLV + MOON + BAND COLLAR + 2 POCKETS + POCKET FITCH',
    'FR YOKE + 2 UPPER POCKETS','AT CHEST',
    'FR PANELS + BACK + SLV + MOON + NECK + CHEST POCKET + SLV CUFFS + BORDER',
    'FR PANELS + BK. PANELS + SLEEVE + MOON + OUTER BAND + 2 POCKETS + BORDER + SLV CUFFS',
    'BACK YOKE + INNER BAND','FR PANEL + BK PANEL + SLV + POKETS - 2',
    'FR+BK+SLV PANELS+HOOD+POKT 2+LR SIDE PANELS','FR PANELS + BK PANELS + SLV + 2 POCKETS',
    'FR YOKE + BK. YOKE + COLLAR','BORDER + SLEEVE CUFFS',
    'FR + BK +SLV + MOON + OUTER HOOD + 2 PKTS + BORDER + SLV CUFFS',
    'FRONT + BACK+ SLEEVE + MOON + COLLAR BAND + BORDER + SLV CUFFS + ZIP FASHION + 2 POCKETS',
    'SLEEVE & PLACKET TAPE','LR LEGS + 2 POCKETS + 2 JATI POCKETS',
    'FR + BK PANEL + BK YOKE + SLEEVE + BAND + PLACKET + POCKET + PKT FITCH + GAMLA CHAND',
    'FR + BK + SLV + MOON + SINGLE PLACKET + POCKET + POCKET FITCH + NECK BONE',
    'FR + BK + SLV + MOON + PLACKET + POCKET + POCKET FITCH + NECK BONE',
    'MOON + NECK BONE + EMB. BADGE','FR + BK + SLV',
    'FR + BK + SLV + SINGLE PLACKET + PKT FITCH',
    'MOON + NECK BONE + POCKET BAGS + SINGLE PLACKET','SIZE RANGE 36-42',
    'SIZE RANGE 44-50','SIZE RANGE 36-50',
    'PLACKET + BAND + POCKET + POCKET FITCH + BACK YOKE','FRONT + BACK + SLEEVE + NECK',
    'POCKET + MOON + NECK BONE',
    'PLACKET + BAND+ POKT BAG + FITCH + BK YOKE + GUMLA CHAND ','SIZE RANGE 38-42',
    'FR + BK + MOON + NECK TAPE + PLACKET',
    'INNER PLACKETS (BOTH) + BACK + MOON + NECK TAPE + SLEEVE','SIZE RANGE 38-50',
    'FR + BK + SLV + MOON + PLKT + PATCH POKT + BAND','SLEEVE + MOON','PLACKET + NECK BONE',
    'BK YOKE + SLEEVES + POKT + INNER PLKT ',
    'FR + MOON + NK BONE + BK PANEL + UPPER  PLKT + LR 2 POKTS ','PLACKET + POCKET FITCH ',
    'BACK + SLEEVE + NECK BONE + MOON + ZIP BONE ','FR PANEL + BK PANEL + MOON + UPPER PLKT',
    'FR PANELS + BK PANELS + SLV PANELS',
    'SLV PANELS + SHOULDER PANEL + INNER PLKT + NK BONE ',
    'FR PANELS + SLV + BK PANELS',
    'FR PANELS + PLKT + MOON + NECK BAND + POCKET + FITCH + SHOULDER PATCH',
    'FULL LR + POKT + FRONT FOLDER','NECK BAND + PLACKET','SLEEVE + INNER PLACKET',
    'FRONT PANELS + SLEEVE + BACK + MOON + NECK BONE','FR + BK + MOON + PLKT',
    'LR + 4 PKTS + NK BONE','FR + BK + SLV + MOON','SLEEVE TAPE',
    'FR + BK + MOON + PLKT','FR + BK + NK BONE + UPPER PLKT','SLEEVES + MOON + INNER PLKT',
    'FR PANELS-2 + BK + SLV + PKT FITCH + PKT BAG  + NK BONE',
    'FR PANELS-2 +  PLKT-2 + MOON','FR + BK + SLV + MOON + NK BONE + FASHION ',
    'FRONT PANELS + SLEEVE','FRONT PANEL + SINGLE SLV + MOON + NK BONE + PLKT',
    'FRONT PANEL + BACK','FR + BK + MOON + SLV PANELS ','UPPER PLKT + NK BONE',
    'SLV PANELS-2 + INNER PLKT PANEL','INNER PLKT PANEL',
    'FR PANELS + BK +  SLV +MOON + NK BONE + PLKT','FRONT CUT N SEW PANEL',
    'FULL BR + POCKETS','FRONT PANEL + SINGLE SLEEVE',
    'FRONT PANELS + BACK + SINGLE SLV + PLACKET + MOON + NECK BONE',
    'FRONT PANELS + BACK + PLACKET + MOON + NECK BONE',
    'FRONT PANELS + BACK + PLACKET + MOON','FRONT PANEL + NECK BONE',
    'FRONT PANEL + BACK PANEL + SINGLE SLEEVE + INNER PLACKET ',
    'FRONT PANEL + BACK PANEL + SINGLE SLEEVE + INNER PLACKET + MOON + NECK BONE ',
    'SLV + EMB PATCH','INNER PLKT',
    'SLEEVE  +  MOON + NECK TAPE + INNER PLACKET',
    'FRONT + BACK + MOON + PLACKET + POCKET + NECK BONE',
    'FR + BK + SLV + MOON + BAND','SLEEVES + INNER PLKT ',
    'FR + BK + MOON + UPPER PLKT + NK BONE',
    'FR PANEL + SLV-1 + BK PANEL + MOON + NK BONE ',
    'FR PANEL + BK PANEL + SLV-1',
    'FR PANELS  + SLV +BK + NK BONE + FASHION + ZIP BONE + MOON',
    'LOWER LEG PANELS + BELT + FITCH + PIPING + BK POCKET'
  ];

  if (sheet.getLastRow() < 4) {
    var data = components.map(function(c) { return [c]; });
    sheet.getRange(4, 1, data.length, 1).setValues(data);
  }

  // Single column — set width
  sheet.setColumnWidth(1, 400);
}

/* ── 20. FABRIC_TYPE_MASTER ── */
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
    ['REL-003', 'ARTICLE_MASTER', 'Color Code(s)', 'COLOR_MASTER', 'Color Code', 'Color Name', 'Yes', '', 'Yes', 'No', 'FILE_1A', 'Yes', 'Article → Colors (multi)'],
    ['REL-004', 'ARTICLE_MASTER', '⟷ Tags', 'TAG_MASTER', 'Tag Code', 'Tag Name', 'Yes', 'ARTICLE_MASTER', 'Yes', 'No', 'FILE_1A', 'Yes', 'Article → Tags (multi)'],
    ['REL-005', 'RM_MASTER_FABRIC', 'KNIT NAME / STRUCTURE', 'FABRIC_TYPE_MASTER', 'Fabric Type Code', 'Knit Construction', 'No', '', 'No', 'No', 'FILE_1A', 'Yes', 'Fabric → Knit Type'],
    ['REL-006', 'RM_MASTER_FABRIC', '⟷ YARN COMPOSITION', 'RM_MASTER_YARN', '# RM Code', 'Yarn Name', 'Yes', '', 'Yes', 'No', 'FILE_1A', 'Yes', 'Fabric → Yarn (multi)'],
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
