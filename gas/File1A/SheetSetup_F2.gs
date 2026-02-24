/**
 * ============================================================
 * CONFIDENCE CLOTHING — ERP FILE 2
 * Sheet Structure Setup & Formatting — Procurement
 * ============================================================
 * Creates all 5 sheets with proper headers, descriptions,
 * formatting, data validation, and tab colors.
 * ============================================================
 */

/* ---------------------------------------------------------------
   MASTER SETUP — Creates/formats all File 2 sheets
   --------------------------------------------------------------- */
function setupAllSheets_F2(ss) {
  setup2_PoMaster_(ss);
  setup2_PoLineItems_(ss);
  setup2_GrnMaster_(ss);
  setup2_GrnLineItems_(ss);
  setup2_MasterRelationsF2_(ss);

  // Delete temp sheet created during old-sheet deletion
  deleteTempSheet_(ss);

  Logger.log('All 5 FILE 2 sheets setup complete.');
}

/* ===============================================================
   INDIVIDUAL SHEET SETUP FUNCTIONS — FILE 2
   =============================================================== */

var TAB_F2 = '#8B0000'; // Dark Red for all File 2 procurement sheets

/* -- 01. PO_MASTER (21 columns) -- */
function setup2_PoMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_F2.PO_MASTER);
  var headers = [
    '# PO Number', '\u26A0 PO Date', 'Season', 'PO Type',
    '\u2192 Supplier Code', '\u2190 Supplier Name',
    '\u2192 Payment Terms', '\u2190 Payment Terms Name',
    'Currency', 'Delivery Date', 'Delivery Address', 'Remarks',
    '\u2211 Total Lines', '\u2211 Base Value', '\u2211 Total GST',
    '\u2211 Grand Total', 'Status', 'GRN Status',
    'Created By', 'Created Date', 'Physical PO Image'
  ];
  var descriptions = [
    'AUTO: PO-YYYY-NNNN', 'DD-MMM-YYYY (mandatory)',
    'SS25 / AW25 / SS26 / AW26 / Year Round',
    'Fabric / Trim / Packaging / Chemicals / Services / Assets',
    'FK \u2192 SUPPLIER_MASTER (FILE 1C)', 'Auto from SUPPLIER_MASTER',
    'FK \u2192 PAYMENT_TERMS_MASTER (FILE 1C)', 'Auto from PAYMENT_TERMS_MASTER',
    'INR / USD / EUR', 'Expected delivery DD-MMM-YYYY',
    'Factory or warehouse address', 'Special instructions or notes',
    'Auto: count of PO line items', 'Auto: sum of line base values',
    'Auto: sum of line GST amounts', 'Auto: Base Value + Total GST',
    'Draft / Pending / Approved / Sent / etc.', 'Auto: None / Partial / Full',
    'Auto: user email on creation', 'Auto: DD-MMM-YYYY HH:mm:ss',
    'Google Drive link to scanned PO'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 2 \u2014 PO_MASTER \u2014 Purchase Orders',
    headers, descriptions, TAB_F2);

  setValidation_(sheet, 3, CONFIG.SEASON_LIST);
  setValidation_(sheet, 4, CONFIG.PO_TYPE_LIST);
  setValidation_(sheet, 9, CONFIG.CURRENCY_LIST);
  setValidation_(sheet, 17, CONFIG.PO_STATUS_LIST);
  setValidation_(sheet, 18, CONFIG.PO_GRN_STATUS_LIST);
}

/* -- 02. PO_LINE_ITEMS (20 columns) -- */
function setup2_PoLineItems_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_F2.PO_LINE_ITEMS);
  var headers = [
    '# Line ID', '\u2192 PO Number', '\u2192 Item Code',
    '\u2190 Item Name', 'Item Master', '\u2190 UOM',
    '\u2190 HSN Code', '\u2190 GST %',
    '\u26A0 Quantity', '\u26A0 Unit Price', 'Discount %',
    '\u2211 Line Base Value', '\u2211 Line GST', '\u2211 Line Total',
    '\u2190 Supplier Item Name', '\u2190 Supplier Item Code',
    '\u2190 Received Qty', '\u2211 Pending Qty',
    'Line Status', 'Notes'
  ];
  var descriptions = [
    'AUTO: POL-NNNNN', 'FK \u2192 PO_MASTER',
    'Poly-FK \u2192 routes by Item Master col', 'Auto from item master',
    'FABRIC / TRIM / YARN / WOVEN / CONSUMABLE / PACKAGING',
    'Auto from item master', 'Auto from item master', 'Auto from item master',
    'Order quantity (mandatory)', 'Price per UOM excl GST (mandatory)',
    'Line discount percentage (default 0)',
    'Auto: Qty \u00D7 Price \u00D7 (1 - Disc%)',
    'Auto: Base \u00D7 GST%', 'Auto: Base + GST',
    'Auto from ITEM_SUPPLIER_RATES', 'Auto from ITEM_SUPPLIER_RATES',
    'Auto from GRN (initially 0)', 'Auto: Quantity - Received',
    'Auto: Open / Partial / Closed', 'Line-level notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 2 \u2014 PO_LINE_ITEMS \u2014 Purchase Order Lines',
    headers, descriptions, TAB_F2);

  setValidation_(sheet, 5, CONFIG.ITEM_MASTER_LIST);
  setValidation_(sheet, 19, CONFIG.LINE_STATUS_LIST);
}

/* -- 03. GRN_MASTER (17 columns) -- */
function setup2_GrnMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_F2.GRN_MASTER);
  var headers = [
    '# GRN Number', '\u26A0 GRN Date', '\u2192 PO Number',
    '\u2190 Supplier Code', '\u2190 Supplier Name',
    'Vehicle No', 'DC Number', 'DC Date', 'Gate Pass No',
    '\u2192 Warehouse', '\u2190 Warehouse Name',
    'Received By', 'Notes', 'Status',
    'Created By', 'Created Date', 'Gate Inward Image'
  ];
  var descriptions = [
    'AUTO: GRN-YYYY-NNNN', 'DD-MMM-YYYY (mandatory)',
    'FK \u2192 PO_MASTER',
    'Auto from PO_MASTER', 'Auto from PO_MASTER',
    'Transport vehicle number', 'Delivery challan number',
    'Delivery challan date DD-MMM-YYYY', 'Factory gate pass number',
    'FK \u2192 WAREHOUSE_MASTER (FILE 1B)', 'Auto from WAREHOUSE_MASTER',
    'Person who received goods', 'Inspection notes or remarks',
    'Pending / Accepted / Partial / Rejected',
    'Auto: user email on creation', 'Auto: DD-MMM-YYYY HH:mm:ss',
    'Google Drive link to gate photo'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 2 \u2014 GRN_MASTER \u2014 Goods Received Notes',
    headers, descriptions, TAB_F2);

  setValidation_(sheet, 14, CONFIG.GRN_STATUS_LIST);
}

/* -- 04. GRN_LINE_ITEMS (19 columns) -- */
function setup2_GrnLineItems_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_F2.GRN_LINE_ITEMS);
  var headers = [
    '# Line ID', '\u2192 GRN Number', '\u2192 PO Line ID',
    '\u2190 Item Code', '\u2190 Item Name', '\u2190 UOM',
    '\u2190 PO Qty', '\u26A0 Received Qty', '\u26A0 Accepted Qty',
    '\u2211 Rejected Qty', 'Batch No', 'Lot No', 'Rolls',
    'Inspection Result', 'Rejection Reason',
    '\u2192 Storage Bin', '\u2190 Bin Name',
    'Line Status', 'Notes'
  ];
  var descriptions = [
    'AUTO: GRL-NNNNN', 'FK \u2192 GRN_MASTER',
    'FK \u2192 PO_LINE_ITEMS',
    'Auto from PO line', 'Auto from PO line', 'Auto from PO line',
    'Auto from PO line item qty', 'Actual qty received (mandatory)',
    'Qty accepted after inspection (mandatory)',
    'Auto: Received - Accepted', 'Manufacturer batch number',
    'Internal lot number (LOT-###)', 'Number of rolls (fabric/tape)',
    'Pass / Fail / Conditional', 'Reason for rejection if any',
    'FK \u2192 STORAGE_BIN_MASTER (FILE 1B)', 'Auto from STORAGE_BIN_MASTER',
    'Auto: Accepted / Partial / Rejected', 'Line-level inspection notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 2 \u2014 GRN_LINE_ITEMS \u2014 GRN Lines & Inspection',
    headers, descriptions, TAB_F2);

  setValidation_(sheet, 14, CONFIG.INSPECTION_RESULT_LIST);
  setValidation_(sheet, 18, ['Accepted', 'Partial', 'Rejected']);
}

/* -- 05. MASTER_RELATIONS_F2 (13 columns) -- */
function setup2_MasterRelationsF2_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_F2.MASTER_RELATIONS_F2);
  var headers = [
    '# Relation Code', 'Parent Sheet', 'Parent Column',
    'Referenced Sheet', 'Ref Code Column', 'Ref Display Column',
    'Allow Create New', 'Dropdown Filter', 'Multi-Select',
    'Cross-File', 'Ref File Label', 'Active', 'Notes'
  ];
  var descriptions = [
    'REL-047 to REL-054', 'Sheet containing the FK', 'Column with the FK',
    'Sheet being referenced', 'Code column in ref sheet', 'Display column in ref sheet',
    'Yes = sidebar create new', 'Filter condition', 'Yes = comma-separated',
    'Yes = different file', 'FILE_1A/1B/1C', 'Yes/No', 'Description'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 2 \u2014 MASTER_RELATIONS_F2 \u2014 Procurement FK Relations',
    headers, descriptions, TAB_F2);

  // Pre-populate 8 FK relation rows
  var relData = [
    ['REL-047', 'PO_MASTER', '\u2192 Supplier Code', 'SUPPLIER_MASTER', '# Supplier Code', 'Supplier Name', 'No', 'Status=Active', 'No', 'Yes', 'FILE_1C', 'Yes', 'PO to Supplier'],
    ['REL-048', 'PO_MASTER', '\u2192 Payment Terms', 'PAYMENT_TERMS_MASTER', '# Terms Code', 'Terms Name', 'No', 'Active=Yes', 'No', 'Yes', 'FILE_1C', 'Yes', 'PO payment terms'],
    ['REL-049', 'PO_LINE_ITEMS', '\u2192 PO Number', 'PO_MASTER', '# PO Number', '# PO Number', 'No', '', 'No', 'No', '', 'Yes', 'Line to PO header'],
    ['REL-050', 'PO_LINE_ITEMS', '\u2192 Item Code', 'DYNAMIC', '# Item Code', 'Item Name', 'Yes', 'Status=Active', 'No', 'No', '', 'Yes', 'Poly-FK routes by Item Master col'],
    ['REL-051', 'GRN_MASTER', '\u2192 PO Number', 'PO_MASTER', '# PO Number', '# PO Number', 'No', 'Status=Approved|Sent|Acknowledged|Partially Received', 'No', 'No', '', 'Yes', 'GRN to PO'],
    ['REL-052', 'GRN_MASTER', '\u2192 Warehouse', 'WAREHOUSE_MASTER', '# Warehouse Code', 'Warehouse Name', 'No', 'Active=Yes', 'No', 'Yes', 'FILE_1B', 'Yes', 'GRN receiving warehouse'],
    ['REL-053', 'GRN_LINE_ITEMS', '\u2192 GRN Number', 'GRN_MASTER', '# GRN Number', '# GRN Number', 'No', '', 'No', 'No', '', 'Yes', 'Line to GRN header'],
    ['REL-054', 'GRN_LINE_ITEMS', '\u2192 Storage Bin', 'STORAGE_BIN_MASTER', '# Bin Code', 'Bin Name', 'No', 'Active=Yes', 'No', 'Yes', 'FILE_1B', 'Yes', 'GRN line storage location']
  ];
  sheet.getRange(4, 1, relData.length, relData[0].length).setValues(relData);
}
