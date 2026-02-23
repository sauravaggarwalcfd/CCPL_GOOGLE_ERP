/**
 * =============================================================================
 * MODULE 8 — ITEM_SUPPLIER_RATES (ISR) — PO Sidebar Integration
 * =============================================================================
 *
 * Manages the ITEM_SUPPLIER_RATES sheet and provides supplier selection
 * functionality for Purchase Order creation via an HTML sidebar.
 *
 * ISR lives in FILE 1B (Factory Master) but is accessed cross-file from
 * FILE 1A scripts for PO line item supplier lookups.
 *
 * Sheet: ITEM_SUPPLIER_RATES (21 columns)
 * Row Structure: Row 1=banner, Row 2=headers, Row 3=descriptions, Row 4+=data
 *
 * 21-Column Structure:
 *   Col 01: # Rate Code         — AUTO: ISR-00001 (5-digit seq)
 *   Col 02: ⚠ Item Code         — FK (dynamic to item master)
 *   Col 03: Item Master          — Dropdown: TRIM/FABRIC/YARN/WOVEN/CONSUMABLE/PACKAGING
 *   Col 04: ← Item Name (Auto)  — Read-only (auto from FK)
 *   Col 05: → Supplier Code     — FK → SUPPLIER_MASTER
 *   Col 06: ← Supplier Name (Auto) — Read-only (auto from FK)
 *   Col 07: Supplier's Item Name — Text
 *   Col 08: Supplier's Item Code — Text
 *   Col 09: Unit Price (excl GST) — ₹
 *   Col 10: GST %                — Number (5/12/18)
 *   Col 11: ∑ Price incl GST (Auto) — Calculated: Price × (1 + GST%/100)
 *   Col 12: UOM                  — Dropdown: CONE/MTR/PCS/KG/SET/ROLL
 *   Col 13: MOQ                  — Number
 *   Col 14: Lead Time (Days)     — Number
 *   Col 15: Priority             — Dropdown: Primary/Secondary/Backup/Approved
 *   Col 16: Valid From           — Date
 *   Col 17: Valid To             — Date (blank = active)
 *   Col 18: ← Last PO Date (Auto)  — Read-only
 *   Col 19: ← Last PO Price (Auto) — Read-only
 *   Col 20: Active               — Yes/No
 *   Col 21: Notes                — Text
 *
 * Priority Logic:
 *   Primary   — Default supplier, pre-selected on PO
 *   Secondary — First alternate
 *   Backup    — Emergency only, shown with ⚠ warning
 *   Approved  — In list, not pre-selected
 *
 * PO Behaviour:
 *   1. User adds item to PO line
 *   2. GAS reads ISR filtered by Item Code + Active=Yes
 *   3. Sidebar shows all suppliers ranked by Priority, with price, GST, lead time
 *   4. Primary pre-selected. User can switch.
 *   5. On confirm → GAS uses that supplier's own Item Name + Item Code on PO line
 *
 * =============================================================================
 */


// ---------------------------------------------------------------------------
// ISR Column Index Constants (1-based)
// ---------------------------------------------------------------------------

var ISR_COL = {
  RATE_CODE:          1,
  ITEM_CODE:          2,
  ITEM_MASTER:        3,
  ITEM_NAME:          4,
  SUPPLIER_CODE:      5,
  SUPPLIER_NAME:      6,
  SUPPLIER_ITEM_NAME: 7,
  SUPPLIER_ITEM_CODE: 8,
  UNIT_PRICE:         9,
  GST_PERCENT:       10,
  PRICE_INCL_GST:    11,
  UOM:               12,
  MOQ:               13,
  LEAD_TIME:         14,
  PRIORITY:          15,
  VALID_FROM:        16,
  VALID_TO:          17,
  LAST_PO_DATE:      18,
  LAST_PO_PRICE:     19,
  ACTIVE:            20,
  NOTES:             21
};

/** ISR sheet name in FILE 1B */
var ISR_SHEET_NAME = 'ITEM_SUPPLIER_RATES';

/** Total columns in ISR */
var ISR_TOTAL_COLS = 21;

/** Priority sort order — lower number = higher rank */
var ISR_PRIORITY_ORDER = {
  'Primary':   1,
  'Secondary': 2,
  'Backup':    3,
  'Approved':  4
};


// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Reads the ITEM_SUPPLIER_RATES sheet from FILE 1B, filtered by itemCode
 * and Active = 'Yes'. Returns a ranked list sorted by Priority.
 *
 * @param  {string} itemCode - The item code to filter by (e.g. 'TRM-THD-001')
 * @return {Object[]} Array of supplier rate objects, sorted by priority rank.
 *         Each object contains all 21 ISR fields as named properties.
 *         Returns empty array if no matching rates found.
 */
function getItemSuppliers(itemCode) {
  try {
    if (!itemCode || String(itemCode).trim() === '') {
      Logger.log('Module8_ISR :: getItemSuppliers - No itemCode provided.');
      return [];
    }

    var data = getISRData();
    if (!data || data.length === 0) {
      return [];
    }

    var itemCodeStr = String(itemCode).trim().toUpperCase();
    var now = new Date();
    var results = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];

      // Filter: Item Code must match
      var rowItemCode = String(row[ISR_COL.ITEM_CODE - 1] || '').trim().toUpperCase();
      if (rowItemCode !== itemCodeStr) {
        continue;
      }

      // Filter: Active must be 'Yes'
      var activeVal = String(row[ISR_COL.ACTIVE - 1] || '').trim();
      if (activeVal !== 'Yes') {
        continue;
      }

      // Filter: Valid To — blank means still active, otherwise check date
      var validTo = row[ISR_COL.VALID_TO - 1];
      if (validTo && validTo instanceof Date && validTo < now) {
        continue;
      }

      // Build supplier rate object
      var supplierRate = {
        rateCode:         String(row[ISR_COL.RATE_CODE - 1] || ''),
        itemCode:         String(row[ISR_COL.ITEM_CODE - 1] || ''),
        itemMaster:       String(row[ISR_COL.ITEM_MASTER - 1] || ''),
        itemName:         String(row[ISR_COL.ITEM_NAME - 1] || ''),
        supplierCode:     String(row[ISR_COL.SUPPLIER_CODE - 1] || ''),
        supplierName:     String(row[ISR_COL.SUPPLIER_NAME - 1] || ''),
        supplierItemName: String(row[ISR_COL.SUPPLIER_ITEM_NAME - 1] || ''),
        supplierItemCode: String(row[ISR_COL.SUPPLIER_ITEM_CODE - 1] || ''),
        unitPrice:        parseFloat(row[ISR_COL.UNIT_PRICE - 1]) || 0,
        gstPercent:       parseFloat(row[ISR_COL.GST_PERCENT - 1]) || 0,
        priceInclGST:     parseFloat(row[ISR_COL.PRICE_INCL_GST - 1]) || 0,
        uom:              String(row[ISR_COL.UOM - 1] || ''),
        moq:              parseInt(row[ISR_COL.MOQ - 1], 10) || 0,
        leadTime:         parseInt(row[ISR_COL.LEAD_TIME - 1], 10) || 0,
        priority:         String(row[ISR_COL.PRIORITY - 1] || 'Approved'),
        validFrom:        row[ISR_COL.VALID_FROM - 1] || '',
        validTo:          row[ISR_COL.VALID_TO - 1] || '',
        lastPODate:       row[ISR_COL.LAST_PO_DATE - 1] || '',
        lastPOPrice:      parseFloat(row[ISR_COL.LAST_PO_PRICE - 1]) || 0,
        active:           String(row[ISR_COL.ACTIVE - 1] || ''),
        notes:            String(row[ISR_COL.NOTES - 1] || '')
      };

      // Recalculate price incl GST for accuracy
      supplierRate.priceInclGST = calculatePriceInclGST(supplierRate.unitPrice, supplierRate.gstPercent);

      results.push(supplierRate);
    }

    // Sort by priority rank (Primary first, then Secondary, Backup, Approved)
    results.sort(function(a, b) {
      var rankA = ISR_PRIORITY_ORDER[a.priority] || 99;
      var rankB = ISR_PRIORITY_ORDER[b.priority] || 99;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      // Secondary sort: lower unit price first
      return a.unitPrice - b.unitPrice;
    });

    return results;

  } catch (err) {
    Logger.log('Module8_ISR :: getItemSuppliers - Error: ' + err.message);
    return [];
  }
}


/**
 * Opens the supplier selection sidebar for a given item code.
 * Called from the PO line item UI or custom menu.
 *
 * @param {string} itemCode - The item code to show suppliers for
 */
function selectSupplierForPO(itemCode) {
  try {
    if (!itemCode || String(itemCode).trim() === '') {
      SpreadsheetApp.getUi().alert('No item code provided. Please select an item first.');
      return;
    }

    showSupplierSidebar(String(itemCode).trim());

  } catch (err) {
    Logger.log('Module8_ISR :: selectSupplierForPO - Error: ' + err.message);
    SpreadsheetApp.getUi().alert('Error opening supplier selection: ' + err.message);
  }
}


/**
 * Updates the Last PO Date (col 18) and Last PO Price (col 19) on the ISR
 * sheet when a PO is confirmed. Called after PO creation/confirmation.
 *
 * @param {string} rateCode - The ISR rate code (e.g. 'ISR-00001')
 * @param {Date|string} poDate - The PO date
 * @param {number} poPrice - The PO unit price used
 */
function updateLastPOData(rateCode, poDate, poPrice) {
  try {
    if (!rateCode || String(rateCode).trim() === '') {
      Logger.log('Module8_ISR :: updateLastPOData - No rateCode provided.');
      return;
    }

    var sheet = _getISRSheet();
    if (!sheet) {
      Logger.log('Module8_ISR :: updateLastPOData - ISR sheet not found.');
      return;
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      Logger.log('Module8_ISR :: updateLastPOData - No data rows in ISR sheet.');
      return;
    }

    // Read rate codes from column 1
    var rateCodeRange = sheet.getRange(
      CONFIG.ROW_STRUCTURE.DATA_START_ROW,
      ISR_COL.RATE_CODE,
      lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1,
      1
    );
    var rateCodes = rateCodeRange.getValues();
    var targetRateCode = String(rateCode).trim().toUpperCase();

    for (var i = 0; i < rateCodes.length; i++) {
      var currentCode = String(rateCodes[i][0] || '').trim().toUpperCase();
      if (currentCode === targetRateCode) {
        var dataRow = CONFIG.ROW_STRUCTURE.DATA_START_ROW + i;

        // Format PO date
        var formattedDate = '';
        if (poDate) {
          if (poDate instanceof Date) {
            formattedDate = Utilities.formatDate(poDate, CONFIG.SYSTEM.TIMEZONE, CONFIG.SYSTEM.DATE_FORMAT);
          } else {
            formattedDate = String(poDate);
          }
        }

        // Update Last PO Date (col 18)
        sheet.getRange(dataRow, ISR_COL.LAST_PO_DATE).setValue(formattedDate);

        // Update Last PO Price (col 19)
        sheet.getRange(dataRow, ISR_COL.LAST_PO_PRICE).setValue(
          poPrice !== undefined && poPrice !== null ? parseFloat(poPrice) : ''
        );

        Logger.log('Module8_ISR :: updateLastPOData - Updated ISR rate ' + rateCode +
                    ' with PO date: ' + formattedDate + ', price: ' + poPrice);

        // Log to change log
        writeChangeLog(
          CL_ACTION.UPDATE,
          ISR_SHEET_NAME,
          rateCode,
          'Last PO Date / Last PO Price',
          '',
          formattedDate + ' / ' + poPrice,
          _getCurrentUserEmail()
        );

        return;
      }
    }

    Logger.log('Module8_ISR :: updateLastPOData - Rate code "' + rateCode + '" not found in ISR sheet.');

  } catch (err) {
    Logger.log('Module8_ISR :: updateLastPOData - Error: ' + err.message);
  }
}


/**
 * Calculates Price inclusive of GST.
 * Formula: Unit Price × (1 + GST% / 100)
 *
 * @param  {number} unitPrice  - Unit price excluding GST (₹)
 * @param  {number} gstPercent - GST percentage (e.g. 5, 12, 18)
 * @return {number} Price inclusive of GST, rounded to 2 decimal places
 */
function calculatePriceInclGST(unitPrice, gstPercent) {
  var price = parseFloat(unitPrice) || 0;
  var gst = parseFloat(gstPercent) || 0;

  if (price <= 0) {
    return 0;
  }

  var result = price * (1 + gst / 100);
  return Math.round(result * 100) / 100;
}


/**
 * onEdit handler for the ISR sheet. Attached to the installable onEdit trigger.
 * Handles auto-calculation of Price incl GST (col 11) when Unit Price (col 9)
 * or GST % (col 10) is edited.
 *
 * @param {Object} e - The onEdit event object
 */
function handleISREdit(e) {
  try {
    if (!e || !e.range) {
      return;
    }

    var range = e.range;
    var sheet = range.getSheet();
    var sheetName = sheet.getName();

    // Only handle ISR sheet
    if (sheetName !== ISR_SHEET_NAME) {
      return;
    }

    var row = range.getRow();
    var col = range.getColumn();

    // Only process data rows (row 4+)
    if (row < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return;
    }

    // Only handle single-cell edits
    if (range.getNumRows() > 1 || range.getNumColumns() > 1) {
      return;
    }

    // --- Auto-calculate Price incl GST when Unit Price or GST% changes ---
    if (col === ISR_COL.UNIT_PRICE || col === ISR_COL.GST_PERCENT) {
      var unitPrice = sheet.getRange(row, ISR_COL.UNIT_PRICE).getValue();
      var gstPercent = sheet.getRange(row, ISR_COL.GST_PERCENT).getValue();
      var priceInclGST = calculatePriceInclGST(unitPrice, gstPercent);

      sheet.getRange(row, ISR_COL.PRICE_INCL_GST).setValue(priceInclGST);
    }

    // --- Auto-populate Item Name (col 4) when Item Code (col 2) is set ---
    if (col === ISR_COL.ITEM_CODE || col === ISR_COL.ITEM_MASTER) {
      _autoPopulateItemName(sheet, row);
    }

    // --- Auto-populate Supplier Name (col 6) when Supplier Code (col 5) is set ---
    if (col === ISR_COL.SUPPLIER_CODE) {
      _autoPopulateSupplierName(sheet, row);
    }

  } catch (err) {
    Logger.log('Module8_ISR :: handleISREdit - Error: ' + err.message);
  }
}


/**
 * Shows the supplier selection HTML sidebar for a given item code.
 *
 * @param {string} itemCode - The item code to display suppliers for
 */
function showSupplierSidebar(itemCode) {
  try {
    var suppliers = getItemSuppliers(itemCode);

    // Get item name from first result or look it up
    var itemName = '';
    if (suppliers.length > 0) {
      itemName = suppliers[0].itemName;
    }

    // Build template data to pass into the sidebar
    var templateData = {
      itemCode: String(itemCode).trim(),
      itemName: itemName,
      suppliers: suppliers
    };

    var htmlTemplate = HtmlService.createTemplateFromFile('SupplierSidebar');
    htmlTemplate.data = JSON.stringify(templateData);

    var htmlOutput = htmlTemplate.evaluate()
      .setTitle('Select Supplier')
      .setWidth(300);

    SpreadsheetApp.getUi().showSidebar(htmlOutput);

  } catch (err) {
    Logger.log('Module8_ISR :: showSupplierSidebar - Error: ' + err.message);
    SpreadsheetApp.getUi().alert('Error loading supplier sidebar: ' + err.message);
  }
}


/**
 * Reads all data from the ITEM_SUPPLIER_RATES sheet in FILE 1B.
 * Uses 3-layer cache for performance.
 *
 * @return {Array[]} 2D array of ISR data rows (row 4+ only, no headers).
 *         Returns empty array if sheet not found or no data.
 */
function getISRData() {
  try {
    // Layer 1: Try CacheService
    var cache = CacheService.getScriptCache();
    var cacheKey = 'CACHE_ITEM_SUPPLIER_RATES';
    var cached = cache.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (parseErr) {
        Logger.log('Module8_ISR :: getISRData - Cache parse error, falling through to sheet read.');
      }
    }

    // Layer 2: Try PropertiesService
    var props = PropertiesService.getScriptProperties();
    var propData = props.getProperty(cacheKey);

    if (propData) {
      try {
        var parsed = JSON.parse(propData);
        // Repopulate Layer 1 cache
        _cacheISRData(cache, cacheKey, parsed);
        return parsed;
      } catch (parseErr) {
        Logger.log('Module8_ISR :: getISRData - Properties parse error, falling through to sheet read.');
      }
    }

    // Layer 3: Direct sheet read (fallback)
    var sheet = _getISRSheet();
    if (!sheet) {
      Logger.log('Module8_ISR :: getISRData - ISR sheet not found in FILE 1B.');
      return [];
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return [];
    }

    var lastCol = Math.min(sheet.getLastColumn(), ISR_TOTAL_COLS);
    var dataRange = sheet.getRange(
      CONFIG.ROW_STRUCTURE.DATA_START_ROW,
      1,
      lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1,
      lastCol
    );
    var data = dataRange.getValues();

    // Populate both cache layers
    _cacheISRData(cache, cacheKey, data);
    try {
      props.setProperty(cacheKey, JSON.stringify(data));
    } catch (propErr) {
      Logger.log('Module8_ISR :: getISRData - Could not write to PropertiesService: ' + propErr.message);
    }

    return data;

  } catch (err) {
    Logger.log('Module8_ISR :: getISRData - Error: ' + err.message);
    return [];
  }
}


/**
 * Called from the SupplierSidebar.html when user confirms a supplier selection.
 * Writes the selected supplier data back to the active PO row.
 *
 * @param {Object} selectionData - Object with supplier selection details:
 *   {string} selectionData.rateCode         - ISR rate code
 *   {string} selectionData.itemCode         - Item code
 *   {string} selectionData.supplierCode     - Selected supplier code
 *   {string} selectionData.supplierName     - Selected supplier name
 *   {string} selectionData.supplierItemName - Supplier's own item name
 *   {string} selectionData.supplierItemCode - Supplier's own item code
 *   {number} selectionData.unitPrice        - Unit price excl GST
 *   {number} selectionData.gstPercent       - GST %
 *   {number} selectionData.priceInclGST     - Price incl GST
 *   {string} selectionData.uom              - Unit of measurement
 *   {number} selectionData.moq              - Minimum order quantity
 *   {number} selectionData.leadTime         - Lead time in days
 *   {string} selectionData.priority         - Priority level
 * @return {Object} Result with success flag and message
 */
function confirmSupplierSelection(selectionData) {
  try {
    if (!selectionData) {
      return { success: false, message: 'No selection data provided.' };
    }

    // Validate required fields
    if (!selectionData.supplierCode) {
      return { success: false, message: 'No supplier selected.' };
    }

    // Get the active sheet and selection to determine target PO row
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var activeSheet = ss.getActiveSheet();
    var activeRange = activeSheet.getActiveRange();

    if (!activeRange) {
      return { success: false, message: 'No active cell. Please select a PO row first.' };
    }

    var targetRow = activeRange.getRow();

    // Return the selection data to be applied by the PO module
    Logger.log('Module8_ISR :: confirmSupplierSelection - Supplier confirmed: ' +
               selectionData.supplierCode + ' (' + selectionData.supplierName + ') ' +
               'for item ' + selectionData.itemCode + ' on row ' + targetRow);

    return {
      success: true,
      message: 'Supplier ' + selectionData.supplierName + ' selected successfully.',
      data: {
        targetRow:        targetRow,
        rateCode:         selectionData.rateCode || '',
        itemCode:         selectionData.itemCode || '',
        supplierCode:     selectionData.supplierCode || '',
        supplierName:     selectionData.supplierName || '',
        supplierItemName: selectionData.supplierItemName || '',
        supplierItemCode: selectionData.supplierItemCode || '',
        unitPrice:        parseFloat(selectionData.unitPrice) || 0,
        gstPercent:       parseFloat(selectionData.gstPercent) || 0,
        priceInclGST:     parseFloat(selectionData.priceInclGST) || 0,
        uom:              selectionData.uom || '',
        moq:              parseInt(selectionData.moq, 10) || 0,
        leadTime:         parseInt(selectionData.leadTime, 10) || 0,
        priority:         selectionData.priority || ''
      }
    };

  } catch (err) {
    Logger.log('Module8_ISR :: confirmSupplierSelection - Error: ' + err.message);
    return { success: false, message: 'Error confirming supplier: ' + err.message };
  }
}


// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Gets the ISR sheet from FILE 1B via cross-file access.
 *
 * @return {GoogleAppsScript.Spreadsheet.Sheet|null} The ISR sheet, or null
 * @private
 */
function _getISRSheet() {
  try {
    return getCrossFileSheet(CONFIG.FILE_IDS.FILE_1B, ISR_SHEET_NAME);
  } catch (err) {
    // Fallback: try active spreadsheet (for development/testing)
    Logger.log('Module8_ISR :: _getISRSheet - Cross-file access failed (' + err.message +
               '), falling back to active spreadsheet.');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      return ss.getSheetByName(ISR_SHEET_NAME);
    }
    return null;
  }
}


/**
 * Writes ISR data to CacheService (Layer 1).
 *
 * @param {GoogleAppsScript.Cache.Cache} cache    - CacheService instance
 * @param {string}                       cacheKey - Cache key
 * @param {Array[]}                      data     - Data to cache
 * @private
 */
function _cacheISRData(cache, cacheKey, data) {
  try {
    var jsonStr = JSON.stringify(data);
    // CacheService has a 100KB limit per key; check size
    if (jsonStr.length < 100000) {
      cache.put(cacheKey, jsonStr, CONFIG.CACHE.LAYER1_EXPIRY_SECONDS);
    } else {
      Logger.log('Module8_ISR :: _cacheISRData - Data exceeds CacheService limit, skipping Layer 1.');
    }
  } catch (err) {
    Logger.log('Module8_ISR :: _cacheISRData - Error: ' + err.message);
  }
}


/**
 * Auto-populates the Item Name (col 4) based on Item Code (col 2) and
 * Item Master (col 3). Reads from the appropriate item master sheet.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The ISR sheet
 * @param {number} row - The data row to populate
 * @private
 */
function _autoPopulateItemName(sheet, row) {
  try {
    var itemCode = String(sheet.getRange(row, ISR_COL.ITEM_CODE).getValue() || '').trim();
    var itemMaster = String(sheet.getRange(row, ISR_COL.ITEM_MASTER).getValue() || '').trim().toUpperCase();

    if (!itemCode || !itemMaster) {
      return;
    }

    // Map Item Master dropdown value to sheet name
    var masterSheetMap = {
      'TRIM':        CONFIG.SHEETS.TRIM_MASTER,
      'FABRIC':      CONFIG.SHEETS.RM_MASTER_FABRIC,
      'YARN':        CONFIG.SHEETS.RM_MASTER_YARN,
      'WOVEN':       CONFIG.SHEETS.RM_MASTER_WOVEN,
      'CONSUMABLE':  CONFIG.SHEETS.CONSUMABLE_MASTER,
      'PACKAGING':   CONFIG.SHEETS.PACKAGING_MASTER
    };

    var targetSheetName = masterSheetMap[itemMaster];
    if (!targetSheetName) {
      Logger.log('Module8_ISR :: _autoPopulateItemName - Unknown Item Master: ' + itemMaster);
      return;
    }

    // Read from the master sheet in the active spreadsheet (FILE 1A)
    var masterSheet = getSheetByName(targetSheetName);
    if (!masterSheet) {
      Logger.log('Module8_ISR :: _autoPopulateItemName - Master sheet "' + targetSheetName + '" not found.');
      return;
    }

    var lastRow = masterSheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return;
    }

    // Read code column (col 1) and name column (col 2) from master
    var masterData = masterSheet.getRange(
      CONFIG.ROW_STRUCTURE.DATA_START_ROW,
      1,
      lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1,
      2
    ).getValues();

    for (var i = 0; i < masterData.length; i++) {
      var code = String(masterData[i][0] || '').trim().toUpperCase();
      if (code === itemCode.toUpperCase()) {
        sheet.getRange(row, ISR_COL.ITEM_NAME).setValue(masterData[i][1]);
        return;
      }
    }

    Logger.log('Module8_ISR :: _autoPopulateItemName - Item code "' + itemCode +
               '" not found in ' + targetSheetName);

  } catch (err) {
    Logger.log('Module8_ISR :: _autoPopulateItemName - Error: ' + err.message);
  }
}


/**
 * Auto-populates the Supplier Name (col 6) based on Supplier Code (col 5).
 * Reads from SUPPLIER_MASTER in FILE 1B.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The ISR sheet
 * @param {number} row - The data row to populate
 * @private
 */
function _autoPopulateSupplierName(sheet, row) {
  try {
    var supplierCode = String(sheet.getRange(row, ISR_COL.SUPPLIER_CODE).getValue() || '').trim();
    if (!supplierCode) {
      return;
    }

    // SUPPLIER_MASTER is in FILE 1B
    var supplierSheet;
    try {
      supplierSheet = getCrossFileSheet(CONFIG.FILE_IDS.FILE_1B, 'SUPPLIER_MASTER');
    } catch (crossErr) {
      // Fallback to active spreadsheet for development
      supplierSheet = getSheetByName('SUPPLIER_MASTER');
    }

    if (!supplierSheet) {
      Logger.log('Module8_ISR :: _autoPopulateSupplierName - SUPPLIER_MASTER sheet not found.');
      return;
    }

    var lastRow = supplierSheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return;
    }

    // Read code (col 1) and name (col 2) from SUPPLIER_MASTER
    var supplierData = supplierSheet.getRange(
      CONFIG.ROW_STRUCTURE.DATA_START_ROW,
      1,
      lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1,
      2
    ).getValues();

    var targetCode = supplierCode.toUpperCase();
    for (var i = 0; i < supplierData.length; i++) {
      var code = String(supplierData[i][0] || '').trim().toUpperCase();
      if (code === targetCode) {
        sheet.getRange(row, ISR_COL.SUPPLIER_NAME).setValue(supplierData[i][1]);
        return;
      }
    }

    Logger.log('Module8_ISR :: _autoPopulateSupplierName - Supplier code "' + supplierCode +
               '" not found in SUPPLIER_MASTER.');

  } catch (err) {
    Logger.log('Module8_ISR :: _autoPopulateSupplierName - Error: ' + err.message);
  }
}
