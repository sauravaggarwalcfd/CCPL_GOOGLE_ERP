/**
 * =============================================================================
 * MODULE 2 — FK RELATIONSHIP ENGINE
 * =============================================================================
 *
 * Reads the MASTER_RELATIONS sheet and manages all foreign key lookups,
 * dropdowns, auto-display columns, multi-select fields, and cross-file
 * references for every master in FILE 1A.
 *
 * MASTER_RELATIONS sheet columns (Row 2 headers):
 *   Col  1  |  Relation Code          (REL-001 .. REL-046)
 *   Col  2  |  Parent Sheet            e.g. ARTICLE_MASTER
 *   Col  3  |  Parent Column           e.g. -> MAIN FABRIC USED
 *   Col  4  |  Referenced Sheet        e.g. RM_MASTER_FABRIC
 *   Col  5  |  Ref Code Column         e.g. # RM Code
 *   Col  6  |  Ref Display Col         e.g. Fabric Name
 *   Col  7  |  Allow Create New        Yes / No
 *   Col  8  |  Dropdown Filter         optional filter expression
 *   Col  9  |  Multi-Select            Yes / No
 *   Col 10  |  Cross-File              Yes / No
 *   Col 11  |  Ref File Label          FILE_1B / FILE_1C / (blank)
 *   Col 12  |  Active                  Yes / No
 *   Col 13  |  Notes                   free text
 *
 * Core principle: STORE ONLY THE CODE. Never copy data between sheets.
 *   - FK column (->): stores code only (e.g. RM-YRN-001)
 *   - Adjacent "Name (Auto)" column (<-): read-only, GAS-filled display name
 *   - Data lives in exactly one sheet. No duplication.
 *
 * Dependencies:
 *   - Config.gs        (CONFIG object, getSheetByName, getCrossFileSheet)
 *   - Cache.gs         (getCachedData, getCrossFileData — future module)
 *   - Module4_ChangeLog.gs (writeChangeLog — called on create-new)
 *
 * =============================================================================
 */


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Column indices (1-based) in the MASTER_RELATIONS sheet */
var MR_COL = {
  RELATION_CODE:    1,
  PARENT_SHEET:     2,
  PARENT_COLUMN:    3,
  REF_SHEET:        4,
  REF_CODE_COL:     5,
  REF_DISPLAY_COL:  6,
  ALLOW_CREATE_NEW: 7,
  DROPDOWN_FILTER:  8,
  MULTI_SELECT:     9,
  CROSS_FILE:      10,
  REF_FILE_LABEL:  11,
  ACTIVE:          12,
  NOTES:           13
};

/** Maximum number of items in a GAS data-validation dropdown list */
var FK_MAX_DROPDOWN_ITEMS = 500;

/** Separator used for multi-select FK values */
var FK_MULTI_SELECT_SEP = ', ';

/** Cache key for parsed MASTER_RELATIONS data */
var FK_RELATIONS_CACHE_KEY = 'CACHE_MASTER_RELATIONS';

/** Data rows start at row 4 (rows 1-3: banner, header, description) */
var FK_DATA_START_ROW = 4;

/** Header row is row 2 */
var FK_HEADER_ROW = 2;


// ---------------------------------------------------------------------------
// 1. loadMasterRelations()
// ---------------------------------------------------------------------------

/**
 * Reads the MASTER_RELATIONS sheet and returns all active relations as an
 * array of plain objects.  Uses the 3-layer cache (getCachedData) when
 * available; falls back to a direct sheet read if the cache module has not
 * yet been loaded.
 *
 * Each object has the following keys:
 *   relationCode, parentSheet, parentColumn, refSheet, refCodeCol,
 *   refDisplayCol, allowCreateNew, dropdownFilter, multiSelect,
 *   crossFile, refFileLabel, active, notes
 *
 * Only rows where Active == "Yes" are returned.
 *
 * @returns {Object[]} Array of relation config objects (active only)
 */
function loadMasterRelations() {
  // Try cache first (Layer 1 / Layer 2)
  var cached = _fkGetCachedRelations();
  if (cached) {
    return cached;
  }

  var relations = [];

  // --- Load from FILE 1A MASTER_RELATIONS ---
  var sheet = getSheetByName(CONFIG.SHEETS.MASTER_RELATIONS);
  if (sheet) {
    var rows1A = _readRelationsFromSheet(sheet);
    for (var i = 0; i < rows1A.length; i++) {
      relations.push(rows1A[i]);
    }
  } else {
    Logger.log('MODULE2 :: loadMasterRelations - MASTER_RELATIONS sheet not found in FILE 1A.');
  }

  // --- Load from FILE 2 MASTER_RELATIONS_F2 (Procurement) ---
  try {
    var fileId = CONFIG.FILE_IDS.FILE_2;
    if (fileId && fileId !== 'YOUR_FILE_2_SPREADSHEET_ID') {
      var ss2 = SpreadsheetApp.openById(fileId);
      var sheet2 = ss2.getSheetByName(CONFIG.SHEETS_F2.MASTER_RELATIONS_F2);
      if (sheet2) {
        var rows2 = _readRelationsFromSheet(sheet2);
        for (var j = 0; j < rows2.length; j++) {
          relations.push(rows2[j]);
        }
        Logger.log('MODULE2 :: Loaded ' + rows2.length + ' relations from MASTER_RELATIONS_F2.');
      }
    }
  } catch (err) {
    Logger.log('MODULE2 :: loadMasterRelations - Could not load FILE 2 relations: ' + err.message);
  }

  // Store in cache for subsequent calls
  _fkSetCachedRelations(relations);

  return relations;
}


/**
 * Reads and parses active relations from a MASTER_RELATIONS-format sheet.
 * Used by loadMasterRelations() to read from both FILE 1A and FILE 2 relation sheets.
 *
 * @param   {GoogleAppsScript.Spreadsheet.Sheet} sheet - The relations sheet to read
 * @returns {Object[]} Array of active parsed relation objects
 */
function _readRelationsFromSheet(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < FK_DATA_START_ROW) {
    return [];
  }

  var numRows = lastRow - FK_DATA_START_ROW + 1;
  var numCols = MR_COL.NOTES; // 13 columns
  var data = sheet.getRange(FK_DATA_START_ROW, 1, numRows, numCols).getValues();

  var results = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (!row[MR_COL.RELATION_CODE - 1] || String(row[MR_COL.RELATION_CODE - 1]).trim() === '') {
      continue;
    }
    var rel = _parseRelationRow(row);
    if (rel.active) {
      results.push(rel);
    }
  }
  return results;
}


// ---------------------------------------------------------------------------
// 2. getFKDropdown()
// ---------------------------------------------------------------------------

/**
 * Gets FK dropdown values for a specific parent sheet + column combination.
 * Looks up the relation in MASTER_RELATIONS, reads the referenced sheet,
 * and returns an array of {code, display} objects.
 *
 * Respects the Dropdown Filter column if set (e.g. "Status=Active" will
 * filter the referenced sheet to only rows where Status == Active).
 *
 * For cross-file relations, uses getCrossFileData() when available, or
 * falls back to getCrossFileSheet() from Config.gs.
 *
 * @param   {string}   parentSheet   - Name of the parent sheet (e.g. "ARTICLE_MASTER")
 * @param   {string}   parentColumn  - Header name of the FK column (e.g. "-> MAIN FABRIC USED")
 * @returns {Object[]} Array of {code: string, display: string} sorted by display name.
 *                     Returns empty array if the relation or referenced sheet is not found.
 */
function getFKDropdown(parentSheet, parentColumn) {
  var rel = getRelationForColumn(parentSheet, parentColumn);
  if (!rel) {
    Logger.log('MODULE2 :: getFKDropdown - No relation found for ' + parentSheet + '.' + parentColumn);
    return [];
  }

  // Read all data from the referenced sheet
  var refData = _getReferencedSheetData(rel);
  if (!refData || refData.length === 0) {
    return [];
  }

  // Identify code and display column indices from headers
  var headers = refData[0]; // first row is headers (row 2 of the sheet)
  var codeIdx = _findColumnIndex(headers, rel.refCodeCol);
  var displayIdx = _findColumnIndex(headers, rel.refDisplayCol);

  if (codeIdx === -1) {
    Logger.log('MODULE2 :: getFKDropdown - Code column "' + rel.refCodeCol + '" not found in ' + rel.refSheet);
    return [];
  }
  if (displayIdx === -1) {
    Logger.log('MODULE2 :: getFKDropdown - Display column "' + rel.refDisplayCol + '" not found in ' + rel.refSheet);
    return [];
  }

  // Parse dropdown filter (if set)
  var filter = _parseDropdownFilter(rel.dropdownFilter, headers);

  // Build the dropdown list from data rows (index 1+ because 0 = headers)
  var items = [];
  for (var i = 1; i < refData.length; i++) {
    var row = refData[i];
    var code = String(row[codeIdx]).trim();
    var display = String(row[displayIdx]).trim();

    // Skip rows with empty code
    if (!code) {
      continue;
    }

    // Apply dropdown filter if present
    if (filter && !_rowMatchesFilter(row, filter)) {
      continue;
    }

    items.push({
      code: code,
      display: display || code  // Fallback to code if display is blank
    });
  }

  // Sort alphabetically by display name
  items.sort(function(a, b) {
    return a.display.localeCompare(b.display);
  });

  // Limit to max dropdown items to prevent GAS data-validation overflow
  if (items.length > FK_MAX_DROPDOWN_ITEMS) {
    Logger.log('MODULE2 :: getFKDropdown - Truncating dropdown for ' + parentSheet + '.' + parentColumn +
               ' from ' + items.length + ' to ' + FK_MAX_DROPDOWN_ITEMS + ' items.');
    items = items.slice(0, FK_MAX_DROPDOWN_ITEMS);
  }

  return items;
}


// ---------------------------------------------------------------------------
// 3. autoDisplayFKName()
// ---------------------------------------------------------------------------

/**
 * Auto-fills the adjacent display column (<-) when an FK code is entered
 * or changed. Looks up the display value from the referenced sheet using
 * the relation config.
 *
 * The display column is assumed to be the column immediately to the right
 * of the FK code column.
 *
 * @param {string} sheetName - The sheet where the FK edit occurred
 * @param {number} row       - The row number (1-based) of the edit
 * @param {number} codeCol   - The column number (1-based) of the FK code cell
 * @param {string} code      - The FK code value that was entered
 */
function autoDisplayFKName(sheetName, row, codeCol, code) {
  try {
    var sheet = getSheetByName(sheetName);
    if (!sheet) {
      return;
    }

    // Get the FK column header to find its relation
    var headerValue = sheet.getRange(FK_HEADER_ROW, codeCol).getValue();
    var headerStr = String(headerValue).trim();

    var rel = getRelationForColumn(sheetName, headerStr);
    if (!rel) {
      Logger.log('MODULE2 :: autoDisplayFKName - No relation for ' + sheetName + '.' + headerStr);
      return;
    }

    // The display column is immediately to the right of the FK code column
    var displayCol = codeCol + 1;

    // If code is blank or cleared, clear the display cell
    if (!code || String(code).trim() === '') {
      sheet.getRange(row, displayCol).setValue('');
      return;
    }

    var codeStr = String(code).trim();

    // Handle multi-select values: if relation is multi-select, resolve all codes
    if (rel.multiSelect) {
      var displayNames = resolveMultiSelectFK(
        codeStr,
        rel.refSheet,
        rel.refCodeCol,
        rel.refDisplayCol,
        rel.crossFile ? rel.refFileLabel : null
      );
      sheet.getRange(row, displayCol).setValue(displayNames);
      return;
    }

    // Single-select: look up one code
    var displayValue = _lookupSingleFKDisplay(
      codeStr,
      rel.refSheet,
      rel.refCodeCol,
      rel.refDisplayCol,
      rel.crossFile ? rel.refFileLabel : null
    );

    sheet.getRange(row, displayCol).setValue(displayValue);

  } catch (err) {
    Logger.log('MODULE2 :: autoDisplayFKName - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// 4. resolveMultiSelectFK()
// ---------------------------------------------------------------------------

/**
 * Handles multi-select FK values stored as comma-separated codes.
 * Resolves each code to its display name and returns a comma-separated
 * string of display names.
 *
 * Example:
 *   codes = "TAG-001, TAG-008"
 *   returns "Bestseller, Seasonal"
 *
 * @param   {string}      codes         - Comma-separated FK code string
 * @param   {string}      refSheet      - Name of the referenced sheet
 * @param   {string}      codeCol       - Header name of the code column in the ref sheet
 * @param   {string}      displayCol    - Header name of the display column in the ref sheet
 * @param   {string|null} refFileLabel  - File label for cross-file lookups (e.g. "FILE_1C"), or null
 * @returns {string}      Comma-separated display names (in the same order as input codes)
 */
function resolveMultiSelectFK(codes, refSheet, codeCol, displayCol, refFileLabel) {
  if (!codes || String(codes).trim() === '') {
    return '';
  }

  var codeList = String(codes).split(',');
  var lookupMap = _buildCodeDisplayMap(refSheet, codeCol, displayCol, refFileLabel);

  var displayNames = [];
  for (var i = 0; i < codeList.length; i++) {
    var c = codeList[i].trim();
    if (!c) {
      continue;
    }
    var name = lookupMap[c];
    displayNames.push(name || c);  // Fallback to the code itself if not found
  }

  return displayNames.join(FK_MULTI_SELECT_SEP);
}


// ---------------------------------------------------------------------------
// 5. createNewFKRecord()
// ---------------------------------------------------------------------------

/**
 * Creates a new record in the referenced sheet, intended to be called from
 * a sidebar mini-form when the user picks "Create New" in an FK dropdown.
 *
 * Steps:
 *   1. Validates formData has all required fields
 *   2. Generates the new item code (using Module 1 code gen when available)
 *   3. Appends the new row to the referenced sheet
 *   4. Logs the creation in ITEM_CHANGE_LOG
 *   5. Invalidates the cache for the referenced sheet
 *   6. Returns the newly generated code
 *
 * @param   {string} referencedSheet - The sheet to add the record to
 * @param   {Object} formData        - Key/value pairs matching column headers
 *                                     e.g. { "Yarn Name": "Cotton 40s", "Colour Type": "KORA" }
 * @returns {Object} { success: boolean, code: string, message: string }
 */
function createNewFKRecord(referencedSheet, formData) {
  try {
    // Validate inputs
    if (!referencedSheet || !formData || typeof formData !== 'object') {
      return { success: false, code: '', message: 'Invalid arguments: sheet name and form data are required.' };
    }

    var sheet = getSheetByName(referencedSheet);
    if (!sheet) {
      return { success: false, code: '', message: 'Sheet "' + referencedSheet + '" not found.' };
    }

    // Read headers from row 2
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) {
      return { success: false, code: '', message: 'Sheet "' + referencedSheet + '" has no columns.' };
    }
    var headers = sheet.getRange(FK_HEADER_ROW, 1, 1, lastCol).getValues()[0];

    // Generate the new item code
    var newCode = _generateCodeForSheet(referencedSheet, formData);
    if (!newCode) {
      return { success: false, code: '', message: 'Unable to generate item code for ' + referencedSheet + '.' };
    }

    // Build the new row array, mapping formData keys to column positions
    var newRow = [];
    for (var c = 0; c < headers.length; c++) {
      var header = String(headers[c]).trim();
      var cleanHeader = _stripHeaderPrefix(header);

      if (c === 0) {
        // Column A is always the code column
        newRow.push(newCode);
      } else if (formData.hasOwnProperty(header)) {
        newRow.push(formData[header]);
      } else if (formData.hasOwnProperty(cleanHeader)) {
        newRow.push(formData[cleanHeader]);
      } else {
        newRow.push('');
      }
    }

    // Append to the next available data row
    var lastRow = sheet.getLastRow();
    var targetRow = Math.max(lastRow + 1, FK_DATA_START_ROW);
    sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);

    // Log the creation
    var userEmail = _fkGetCurrentUserEmail();
    writeChangeLog(
      CL_ACTION.CREATE,
      referencedSheet,
      newCode,
      '(new record via FK mini-form)',
      '',
      JSON.stringify(formData),
      userEmail
    );

    // Invalidate cache for this sheet
    _fkInvalidateCache(referencedSheet);

    return { success: true, code: newCode, message: 'Created ' + newCode + ' in ' + referencedSheet + '.' };

  } catch (err) {
    Logger.log('MODULE2 :: createNewFKRecord - Error: ' + err.message);
    return { success: false, code: '', message: 'Error creating record: ' + err.message };
  }
}


// ---------------------------------------------------------------------------
// 6. handleFKEdit()
// ---------------------------------------------------------------------------

/**
 * Called from the installable onEdit trigger. Detects whether an FK column
 * was edited and, if so, triggers auto-display of the referenced name in
 * the adjacent column.
 *
 * This function is designed to be called from a single central onEdit handler
 * that also calls handleChangeLog and other edit handlers.
 *
 * @param {Object} e - The onEdit event object
 *   e.range       - The edited range
 *   e.value       - The new cell value (single-cell edits)
 *   e.oldValue    - The previous cell value
 *   e.source      - The Spreadsheet object
 */
function handleFKEdit(e) {
  try {
    // Guard: must have a valid event with a range
    if (!e || !e.range) {
      return;
    }

    var range = e.range;
    var sheet = range.getSheet();
    var sheetName = sheet.getName();
    var row = range.getRow();
    var col = range.getColumn();

    // Only process data rows (row 4+)
    if (row < FK_DATA_START_ROW) {
      return;
    }

    // Only handle single-cell edits
    if (range.getNumRows() > 1 || range.getNumColumns() > 1) {
      return;
    }

    // Get the column header to check if this is an FK column
    var headerValue = sheet.getRange(FK_HEADER_ROW, col).getValue();
    var headerStr = String(headerValue).trim();

    // FK columns are prefixed with the -> symbol or the literal '->'
    if (!_isFKColumn(headerStr)) {
      return;
    }

    // Get the relation config for this column
    var rel = getRelationForColumn(sheetName, headerStr);
    if (!rel) {
      // Not every -> column might have a MASTER_RELATIONS entry yet; just return
      return;
    }

    // Get the new code value
    var newCode = e.value !== undefined ? e.value : range.getValue();
    var codeStr = newCode ? String(newCode).trim() : '';

    // Auto-fill the display column
    autoDisplayFKName(sheetName, row, col, codeStr);

  } catch (err) {
    Logger.log('MODULE2 :: handleFKEdit - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// 6b. handleProcurementFKEdit() — FILE 2 Procurement FK handling
// ---------------------------------------------------------------------------

/**
 * Called from onEdit routing when an edit occurs on a FILE 2 procurement sheet.
 * Detects FK columns and auto-fills display columns, just like handleFKEdit but
 * works against the FILE 2 spreadsheet and its MASTER_RELATIONS_F2 definitions.
 *
 * Also handles auto-fill chains:
 *   - Selecting a PO on GRN_MASTER auto-fills Supplier Code + Name
 *   - Selecting a PO Line on GRN_LINE_ITEMS auto-fills Item details
 *
 * @param {Object} e - The onEdit event object from FILE 2
 */
function handleProcurementFKEdit(e) {
  try {
    if (!e || !e.range) return;

    var range = e.range;
    var sheet = range.getSheet();
    var sheetName = sheet.getName();
    var row = range.getRow();
    var col = range.getColumn();

    if (row < FK_DATA_START_ROW) return;
    if (range.getNumRows() > 1 || range.getNumColumns() > 1) return;

    var headerValue = sheet.getRange(FK_HEADER_ROW, col).getValue();
    var headerStr = String(headerValue).trim();

    if (!_isFKColumn(headerStr)) return;

    // Look up the relation (loads from both 1A and F2 MASTER_RELATIONS)
    var rel = getRelationForColumn(sheetName, headerStr);
    if (!rel) return;

    var newCode = e.value !== undefined ? e.value : range.getValue();
    var codeStr = newCode ? String(newCode).trim() : '';

    // Auto-fill the display column (immediately adjacent)
    var displayCol = col + 1;

    if (!codeStr) {
      sheet.getRange(row, displayCol).setValue('');
      return;
    }

    // Resolve the display value
    var displayValue = _lookupSingleFKDisplay(
      codeStr,
      rel.refSheet,
      rel.refCodeCol,
      rel.refDisplayCol,
      rel.crossFile ? rel.refFileLabel : null
    );
    sheet.getRange(row, displayCol).setValue(displayValue);

    // --- Auto-fill chains for procurement ---
    // GRN_MASTER: when PO Code is selected, auto-fill Supplier Code + Name
    if (sheetName === 'GRN_MASTER' && _normalizeHeader(headerStr) === _normalizeHeader('PO Code')) {
      _autoFillGRNFromPO(sheet, row, codeStr);
    }

  } catch (err) {
    Logger.log('MODULE2 :: handleProcurementFKEdit - Error: ' + err.message);
  }
}


/**
 * Auto-fills GRN_MASTER fields from the selected PO.
 * When a PO Code is selected on a GRN, copies:
 *   - Supplier Code → GRN Supplier Code column
 *   - Supplier Name → GRN Supplier Name column
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} grnSheet - The GRN_MASTER sheet
 * @param {number} row      - The edited row
 * @param {string} poCode   - The selected PO code
 */
function _autoFillGRNFromPO(grnSheet, row, poCode) {
  try {
    var ss2 = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_2);
    var poSheet = ss2.getSheetByName(CONFIG.SHEETS_F2.PO_MASTER);
    if (!poSheet) return;

    var poLastRow = poSheet.getLastRow();
    if (poLastRow < FK_DATA_START_ROW) return;

    // Read PO headers to find Supplier Code and Supplier Name columns
    var poLastCol = poSheet.getLastColumn();
    var poHeaders = poSheet.getRange(FK_HEADER_ROW, 1, 1, poLastCol).getValues()[0];
    var poCodeIdx = -1, poSupCodeIdx = -1, poSupNameIdx = -1;

    for (var i = 0; i < poHeaders.length; i++) {
      var h = _normalizeHeader(String(poHeaders[i]));
      if (h === _normalizeHeader('PO Code') || h === _normalizeHeader('# PO Code')) poCodeIdx = i;
      if (h === _normalizeHeader('Supplier Code')) poSupCodeIdx = i;
      if (h === _normalizeHeader('Supplier Name') || h === _normalizeHeader('Supplier Name (Auto)')) poSupNameIdx = i;
    }
    if (poCodeIdx === -1) return;

    // Find the PO row
    var poData = poSheet.getRange(FK_DATA_START_ROW, 1, poLastRow - FK_DATA_START_ROW + 1, poLastCol).getValues();
    for (var r = 0; r < poData.length; r++) {
      if (String(poData[r][poCodeIdx]).trim() === poCode) {
        // Found the PO — now fill GRN fields
        var grnLastCol = grnSheet.getLastColumn();
        var grnHeaders = grnSheet.getRange(FK_HEADER_ROW, 1, 1, grnLastCol).getValues()[0];

        for (var g = 0; g < grnHeaders.length; g++) {
          var gh = _normalizeHeader(String(grnHeaders[g]));
          if (gh === _normalizeHeader('Supplier Code') && poSupCodeIdx !== -1) {
            grnSheet.getRange(row, g + 1).setValue(poData[r][poSupCodeIdx]);
          }
          if ((gh === _normalizeHeader('Supplier Name') || gh === _normalizeHeader('Supplier Name (Auto)')) && poSupNameIdx !== -1) {
            grnSheet.getRange(row, g + 1).setValue(poData[r][poSupNameIdx]);
          }
        }
        break;
      }
    }
  } catch (err) {
    Logger.log('MODULE2 :: _autoFillGRNFromPO - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// 7. getRelationForColumn()
// ---------------------------------------------------------------------------

/**
 * Gets the relation configuration object for a specific sheet + column pair.
 * Returns the first matching active relation from MASTER_RELATIONS.
 *
 * Matching logic: compares Parent Sheet (exact) and Parent Column (flexible
 * matching after stripping header prefixes and normalizing whitespace).
 *
 * @param   {string}      sheetName    - The parent sheet name (e.g. "TRIM_MASTER")
 * @param   {string}      columnHeader - The column header to find (e.g. "-> COLOUR CODE")
 * @returns {Object|null} The relation config object, or null if not found
 */
function getRelationForColumn(sheetName, columnHeader) {
  if (!sheetName || !columnHeader) {
    return null;
  }

  var relations = loadMasterRelations();
  var normalizedHeader = _normalizeHeader(columnHeader);

  for (var i = 0; i < relations.length; i++) {
    var rel = relations[i];

    // Match parent sheet exactly
    if (rel.parentSheet !== sheetName) {
      continue;
    }

    // Match parent column with flexible comparison
    var normalizedRelCol = _normalizeHeader(rel.parentColumn);
    if (normalizedRelCol === normalizedHeader) {
      return rel;
    }
  }

  return null;
}


// ---------------------------------------------------------------------------
// 8. setFKDropdownValidation()
// ---------------------------------------------------------------------------

/**
 * Builds and applies data validation dropdown rules for an FK column.
 * Sets the validation on all data cells (row 4 to last row) in the
 * specified column.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet  - The sheet object
 * @param {number}                             column - Column number (1-based)
 * @param {string[]}                           values - Array of allowed dropdown values (codes)
 */
function setFKDropdownValidation(sheet, column, values) {
  try {
    if (!sheet || !column || !values || values.length === 0) {
      return;
    }

    var lastRow = sheet.getLastRow();
    var endRow = Math.max(lastRow, FK_DATA_START_ROW + 50); // Extend a bit beyond last data row

    var range = sheet.getRange(FK_DATA_START_ROW, column, endRow - FK_DATA_START_ROW + 1, 1);

    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)  // true = show dropdown in cell
      .setAllowInvalid(false)            // Reject values not in the list
      .setHelpText('Select a value from the dropdown, or type a valid code.')
      .build();

    range.setDataValidation(rule);

  } catch (err) {
    Logger.log('MODULE2 :: setFKDropdownValidation - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// 9. applyAllFKDropdowns()
// ---------------------------------------------------------------------------

/**
 * Reads all active relations from MASTER_RELATIONS and applies data
 * validation dropdowns on every FK column that belongs to a sheet in
 * the current file (FILE 1A).
 *
 * Intended to be called from onOpen() or a menu action to initialize
 * all FK dropdowns at once.
 */
function applyAllFKDropdowns() {
  var relations = loadMasterRelations();

  for (var i = 0; i < relations.length; i++) {
    var rel = relations[i];

    // Only process sheets that exist in this file
    var sheet = getSheetByName(rel.parentSheet);
    if (!sheet) {
      continue;
    }

    // Find the FK column index by searching the header row
    var colIndex = _findHeaderColumn(sheet, rel.parentColumn);
    if (colIndex === -1) {
      Logger.log('MODULE2 :: applyAllFKDropdowns - Column "' + rel.parentColumn +
                 '" not found in sheet ' + rel.parentSheet);
      continue;
    }

    // Get dropdown values
    var items = getFKDropdown(rel.parentSheet, rel.parentColumn);
    if (items.length === 0) {
      continue;
    }

    // For multi-select columns, skip data validation (user uses sidebar chip panel)
    if (rel.multiSelect) {
      continue;
    }

    // Extract just the codes for the dropdown
    var codes = [];
    for (var j = 0; j < items.length; j++) {
      codes.push(items[j].code);
    }

    setFKDropdownValidation(sheet, colIndex, codes);
  }
}


// ---------------------------------------------------------------------------
// 10. refreshFKDisplayColumn()
// ---------------------------------------------------------------------------

/**
 * Refreshes all auto-display values (<-) for a given FK column across all
 * data rows.  Useful after a referenced sheet has been updated (e.g. a
 * fabric name was changed in RM_MASTER_FABRIC — all ARTICLE_MASTER rows
 * pointing to that fabric need their display name updated).
 *
 * @param {string} sheetName    - The parent sheet name
 * @param {string} columnHeader - The FK column header (e.g. "-> MAIN FABRIC USED")
 */
function refreshFKDisplayColumn(sheetName, columnHeader) {
  try {
    var sheet = getSheetByName(sheetName);
    if (!sheet) {
      return;
    }

    var rel = getRelationForColumn(sheetName, columnHeader);
    if (!rel) {
      Logger.log('MODULE2 :: refreshFKDisplayColumn - No relation for ' + sheetName + '.' + columnHeader);
      return;
    }

    var codeColIndex = _findHeaderColumn(sheet, rel.parentColumn);
    if (codeColIndex === -1) {
      return;
    }

    var displayColIndex = codeColIndex + 1; // Display is always the adjacent column
    var lastRow = sheet.getLastRow();

    if (lastRow < FK_DATA_START_ROW) {
      return;
    }

    var numRows = lastRow - FK_DATA_START_ROW + 1;

    // Read all codes in the FK column
    var codeRange = sheet.getRange(FK_DATA_START_ROW, codeColIndex, numRows, 1).getValues();

    // Build a lookup map for batch efficiency
    var lookupMap = _buildCodeDisplayMap(
      rel.refSheet,
      rel.refCodeCol,
      rel.refDisplayCol,
      rel.crossFile ? rel.refFileLabel : null
    );

    // Resolve display values
    var displayValues = [];
    for (var i = 0; i < codeRange.length; i++) {
      var code = String(codeRange[i][0]).trim();
      if (!code) {
        displayValues.push(['']);
        continue;
      }

      if (rel.multiSelect) {
        // Resolve comma-separated codes
        var resolved = resolveMultiSelectFK(
          code,
          rel.refSheet,
          rel.refCodeCol,
          rel.refDisplayCol,
          rel.crossFile ? rel.refFileLabel : null
        );
        displayValues.push([resolved]);
      } else {
        displayValues.push([lookupMap[code] || '']);
      }
    }

    // Write all display values in one batch
    sheet.getRange(FK_DATA_START_ROW, displayColIndex, numRows, 1).setValues(displayValues);

  } catch (err) {
    Logger.log('MODULE2 :: refreshFKDisplayColumn - Error: ' + err.message);
  }
}


// ===========================================================================
// INTERNAL HELPER FUNCTIONS
// ===========================================================================


/**
 * Parses a single row from MASTER_RELATIONS into a relation config object.
 *
 * @param   {Array}  row - Array of cell values from one row (0-indexed)
 * @returns {Object} Parsed relation config
 */
function _parseRelationRow(row) {
  return {
    relationCode:   String(row[MR_COL.RELATION_CODE - 1]).trim(),
    parentSheet:    String(row[MR_COL.PARENT_SHEET - 1]).trim(),
    parentColumn:   String(row[MR_COL.PARENT_COLUMN - 1]).trim(),
    refSheet:       String(row[MR_COL.REF_SHEET - 1]).trim(),
    refCodeCol:     String(row[MR_COL.REF_CODE_COL - 1]).trim(),
    refDisplayCol:  String(row[MR_COL.REF_DISPLAY_COL - 1]).trim(),
    allowCreateNew: _isYes(row[MR_COL.ALLOW_CREATE_NEW - 1]),
    dropdownFilter: String(row[MR_COL.DROPDOWN_FILTER - 1]).trim(),
    multiSelect:    _isYes(row[MR_COL.MULTI_SELECT - 1]),
    crossFile:      _isYes(row[MR_COL.CROSS_FILE - 1]),
    refFileLabel:   String(row[MR_COL.REF_FILE_LABEL - 1]).trim(),
    active:         _isYes(row[MR_COL.ACTIVE - 1]),
    notes:          String(row[MR_COL.NOTES - 1]).trim()
  };
}


/**
 * Checks if a value is "Yes" (case-insensitive).
 *
 * @param   {*}       val - The cell value
 * @returns {boolean} True if the value is "Yes" or "yes" or "YES"
 */
function _isYes(val) {
  return val && String(val).trim().toLowerCase() === 'yes';
}


/**
 * Determines whether a column header represents an FK column.
 * FK columns are prefixed with the -> (U+2192) symbol or contain "->".
 *
 * @param   {string}  header - The column header text
 * @returns {boolean} True if this is an FK column
 */
function _isFKColumn(header) {
  if (!header) return false;
  var s = String(header).trim();
  // Check for unicode -> prefix (U+2192) or the two-way sync symbol (U+27F7)
  // The -> symbol indicates a foreign key TO another sheet
  return s.charAt(0) === CONFIG.HEADER_PREFIXES.FK_TO ||
         s.indexOf(CONFIG.HEADER_PREFIXES.FK_TO) !== -1 ||
         s.indexOf('->') !== -1;
}


/**
 * Normalizes a column header for flexible matching.
 * Strips leading/trailing whitespace, unicode prefix symbols, and collapses
 * internal whitespace to single spaces.
 *
 * @param   {string} header - The raw column header
 * @returns {string} Normalized lowercase string for comparison
 */
function _normalizeHeader(header) {
  if (!header) return '';
  var s = String(header).trim();

  // Remove known prefix symbols
  var prefixes = [
    CONFIG.HEADER_PREFIXES.FK_TO,
    CONFIG.HEADER_PREFIXES.AUTO_DISPLAY,
    CONFIG.HEADER_PREFIXES.TWO_WAY_SYNC,
    CONFIG.HEADER_PREFIXES.CALCULATED,
    CONFIG.HEADER_PREFIXES.MANDATORY,
    CONFIG.HEADER_PREFIXES.AUTO_GENERATED,
    CONFIG.HEADER_PREFIXES.PRIMARY_KEY
  ];

  for (var i = 0; i < prefixes.length; i++) {
    if (s.indexOf(prefixes[i]) === 0) {
      s = s.substring(prefixes[i].length);
      break;
    }
  }

  // Also strip literal text prefixes
  var textPrefixes = ['->', '<-', '<->', '#'];
  for (var j = 0; j < textPrefixes.length; j++) {
    if (s.indexOf(textPrefixes[j]) === 0) {
      s = s.substring(textPrefixes[j].length);
      break;
    }
  }

  // Collapse whitespace and lowercase
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}


/**
 * Strips the prefix symbol from a column header, returning just the label.
 *
 * @param   {string} header - The raw header (e.g. "-> MAIN FABRIC USED")
 * @returns {string} The label without prefix (e.g. "MAIN FABRIC USED")
 */
function _stripHeaderPrefix(header) {
  if (!header) return '';
  var s = String(header).trim();

  var prefixes = [
    CONFIG.HEADER_PREFIXES.FK_TO,
    CONFIG.HEADER_PREFIXES.AUTO_DISPLAY,
    CONFIG.HEADER_PREFIXES.TWO_WAY_SYNC,
    CONFIG.HEADER_PREFIXES.CALCULATED,
    CONFIG.HEADER_PREFIXES.MANDATORY,
    CONFIG.HEADER_PREFIXES.AUTO_GENERATED,
    CONFIG.HEADER_PREFIXES.PRIMARY_KEY
  ];

  for (var i = 0; i < prefixes.length; i++) {
    if (s.indexOf(prefixes[i]) === 0) {
      return s.substring(prefixes[i].length).trim();
    }
  }

  return s;
}


/**
 * Finds the column index (1-based) of a header in a sheet's header row.
 * Uses flexible matching (normalized comparison).
 *
 * @param   {GoogleAppsScript.Spreadsheet.Sheet} sheet  - The sheet to search
 * @param   {string}                             header - The header text to find
 * @returns {number} Column index (1-based), or -1 if not found
 */
function _findHeaderColumn(sheet, header) {
  if (!sheet || !header) return -1;

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return -1;

  var headers = sheet.getRange(FK_HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var normalized = _normalizeHeader(header);

  for (var i = 0; i < headers.length; i++) {
    if (_normalizeHeader(String(headers[i])) === normalized) {
      return i + 1; // Convert to 1-based
    }
  }

  return -1;
}


/**
 * Finds the index (0-based) of a column header in a headers array.
 * Uses flexible matching.
 *
 * @param   {Array}  headers   - Array of header strings
 * @param   {string} headerName - The header to find
 * @returns {number} 0-based index, or -1 if not found
 */
function _findColumnIndex(headers, headerName) {
  if (!headers || !headerName) return -1;

  var normalized = _normalizeHeader(headerName);

  for (var i = 0; i < headers.length; i++) {
    if (_normalizeHeader(String(headers[i])) === normalized) {
      return i;
    }
  }

  return -1;
}


/**
 * Gets all data (headers + data rows) from the referenced sheet specified
 * in a relation config.
 *
 * For local sheets, reads directly from the active spreadsheet.
 * For cross-file sheets, uses getCrossFileData() (Layer 2 cache) when
 * available, otherwise falls back to getCrossFileSheet() (Config.gs).
 *
 * Returns an array of arrays: first row is headers (from row 2), remaining
 * rows are data (from row 4+).
 *
 * @param   {Object}   rel - A relation config object
 * @returns {Array[]|null} 2D array [headers, row4, row5, ...], or null
 */
function _getReferencedSheetData(rel) {
  try {
    if (rel.crossFile) {
      return _getCrossFileRefData(rel);
    }

    // Local sheet in the active spreadsheet
    // Try cache first
    if (typeof getCachedData === 'function') {
      var cacheKey = CONFIG.CACHE.KEYS[rel.refSheet];
      if (cacheKey) {
        var cached = getCachedData(cacheKey);
        if (cached) {
          return cached;
        }
      }
    }

    // Direct sheet read
    var sheet = getSheetByName(rel.refSheet);
    if (!sheet) {
      Logger.log('MODULE2 :: _getReferencedSheetData - Sheet "' + rel.refSheet + '" not found.');
      return null;
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < FK_DATA_START_ROW || lastCol < 1) {
      // Return headers only
      var hdrs = sheet.getRange(FK_HEADER_ROW, 1, 1, Math.max(lastCol, 1)).getValues();
      return hdrs;
    }

    // Read headers (row 2) + data (row 4 onward) — skip row 3 (descriptions)
    var headers = sheet.getRange(FK_HEADER_ROW, 1, 1, lastCol).getValues()[0];
    var numDataRows = lastRow - FK_DATA_START_ROW + 1;
    var dataRows = sheet.getRange(FK_DATA_START_ROW, 1, numDataRows, lastCol).getValues();

    // Combine: first element is headers array, rest are data rows
    var result = [headers].concat(dataRows);

    // Store in cache for subsequent calls
    if (typeof getCachedData === 'function' && typeof setCachedData === 'function') {
      var ck = CONFIG.CACHE.KEYS[rel.refSheet];
      if (ck) {
        setCachedData(ck, result);
      }
    }

    return result;

  } catch (err) {
    Logger.log('MODULE2 :: _getReferencedSheetData - Error: ' + err.message);
    return null;
  }
}


/**
 * Gets data from a cross-file referenced sheet.
 *
 * Tries getCrossFileData() (from future Cache.gs) first for cached data.
 * Falls back to getCrossFileSheet() (from Config.gs) for direct reads.
 *
 * @param   {Object}   rel - A relation config object with crossFile=true
 * @returns {Array[]|null} 2D array [headers, data rows...], or null
 */
function _getCrossFileRefData(rel) {
  try {
    // Try the cross-file cache (Layer 2) first
    if (typeof getCrossFileData === 'function') {
      var cached = getCrossFileData(rel.refFileLabel, rel.refSheet);
      if (cached) {
        return cached;
      }
    }

    // Resolve the file ID from the label
    var fileId = _resolveFileId(rel.refFileLabel);
    if (!fileId) {
      Logger.log('MODULE2 :: _getCrossFileRefData - Cannot resolve file ID for label "' + rel.refFileLabel + '".');
      return null;
    }

    // Direct cross-file read
    var sheet = getCrossFileSheet(fileId, rel.refSheet);
    if (!sheet) {
      Logger.log('MODULE2 :: _getCrossFileRefData - Sheet "' + rel.refSheet + '" not found in ' + rel.refFileLabel);
      return null;
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) {
      return null;
    }

    var headers = sheet.getRange(FK_HEADER_ROW, 1, 1, lastCol).getValues()[0];

    if (lastRow < FK_DATA_START_ROW) {
      return [headers];
    }

    var numDataRows = lastRow - FK_DATA_START_ROW + 1;
    var dataRows = sheet.getRange(FK_DATA_START_ROW, 1, numDataRows, lastCol).getValues();

    return [headers].concat(dataRows);

  } catch (err) {
    Logger.log('MODULE2 :: _getCrossFileRefData - Error: ' + err.message);
    return null;
  }
}


/**
 * Maps a file label string (e.g. "FILE_1B", "FILE_1C") to the actual
 * Google Spreadsheet file ID from CONFIG.FILE_IDS.
 *
 * @param   {string}      label - The file label
 * @returns {string|null} The Google Spreadsheet ID, or null if not found
 */
function _resolveFileId(label) {
  if (!label) return null;

  var normalized = String(label).trim().toUpperCase().replace(/[\s-]/g, '_');

  if (CONFIG.FILE_IDS[normalized]) {
    return CONFIG.FILE_IDS[normalized];
  }

  // Try common label variations
  var map = {
    'FILE_1A':  CONFIG.FILE_IDS.FILE_1A,
    'FILE_1B':  CONFIG.FILE_IDS.FILE_1B,
    'FILE_1C':  CONFIG.FILE_IDS.FILE_1C,
    'FILE_2':   CONFIG.FILE_IDS.FILE_2,
    'FILE1A':   CONFIG.FILE_IDS.FILE_1A,
    'FILE1B':   CONFIG.FILE_IDS.FILE_1B,
    'FILE1C':   CONFIG.FILE_IDS.FILE_1C,
    'FILE2':    CONFIG.FILE_IDS.FILE_2
  };

  return map[normalized] || null;
}


/**
 * Looks up the display value for a single FK code from the referenced sheet.
 *
 * @param   {string}      code         - The FK code to look up
 * @param   {string}      refSheet     - Referenced sheet name
 * @param   {string}      codeCol      - Code column header in ref sheet
 * @param   {string}      displayCol   - Display column header in ref sheet
 * @param   {string|null} refFileLabel - File label for cross-file, or null
 * @returns {string}      The display value, or empty string if not found
 */
function _lookupSingleFKDisplay(code, refSheet, codeCol, displayCol, refFileLabel) {
  var lookupMap = _buildCodeDisplayMap(refSheet, codeCol, displayCol, refFileLabel);
  return lookupMap[code] || '';
}


/**
 * Builds a map of { code: displayName } from the referenced sheet.
 * This is used for batch lookups and multi-select resolution.
 *
 * @param   {string}      refSheet     - Referenced sheet name
 * @param   {string}      codeCol      - Code column header in ref sheet
 * @param   {string}      displayCol   - Display column header in ref sheet
 * @param   {string|null} refFileLabel - File label for cross-file, or null
 * @returns {Object}      Map of code -> display name
 */
function _buildCodeDisplayMap(refSheet, codeCol, displayCol, refFileLabel) {
  var map = {};

  // Construct a minimal relation object for _getReferencedSheetData
  var rel = {
    refSheet:     refSheet,
    refCodeCol:   codeCol,
    refDisplayCol: displayCol,
    crossFile:    !!refFileLabel,
    refFileLabel: refFileLabel || ''
  };

  var data = _getReferencedSheetData(rel);
  if (!data || data.length < 2) {
    return map;
  }

  var headers = data[0];
  var codeIdx = _findColumnIndex(headers, codeCol);
  var displayIdx = _findColumnIndex(headers, displayCol);

  if (codeIdx === -1 || displayIdx === -1) {
    return map;
  }

  for (var i = 1; i < data.length; i++) {
    var c = String(data[i][codeIdx]).trim();
    if (c) {
      map[c] = String(data[i][displayIdx]).trim();
    }
  }

  return map;
}


/**
 * Parses a dropdown filter expression from the MASTER_RELATIONS sheet.
 * Supported filter format: "ColumnHeader=Value" (single equality check).
 * Multiple filters can be separated by "&" (AND logic):
 *   e.g. "Status=Active&Type=KORA"
 *
 * @param   {string}     filterExpr - The filter expression, or empty string
 * @param   {Array}      headers    - Array of header strings from the ref sheet
 * @returns {Object[]|null} Array of {colIndex, value} filter rules, or null if no filter
 */
function _parseDropdownFilter(filterExpr, headers) {
  if (!filterExpr || filterExpr === '') {
    return null;
  }

  var parts = filterExpr.split('&');
  var filters = [];

  for (var i = 0; i < parts.length; i++) {
    var eq = parts[i].indexOf('=');
    if (eq === -1) {
      continue;
    }

    var colName = parts[i].substring(0, eq).trim();
    var filterValue = parts[i].substring(eq + 1).trim();

    var colIndex = _findColumnIndex(headers, colName);
    if (colIndex === -1) {
      Logger.log('MODULE2 :: _parseDropdownFilter - Filter column "' + colName + '" not found in headers.');
      continue;
    }

    filters.push({
      colIndex: colIndex,
      value: filterValue
    });
  }

  return filters.length > 0 ? filters : null;
}


/**
 * Tests whether a data row passes all filter rules.
 *
 * @param   {Array}    row     - The data row array
 * @param   {Object[]} filters - Array of {colIndex, value} rules
 * @returns {boolean}  True if the row matches all filter conditions
 */
function _rowMatchesFilter(row, filters) {
  for (var i = 0; i < filters.length; i++) {
    var f = filters[i];
    var cellVal = String(row[f.colIndex]).trim().toLowerCase();
    var filterVal = f.value.toLowerCase();
    if (cellVal !== filterVal) {
      return false;
    }
  }
  return true;
}


/**
 * Generates an item code for a sheet when creating a new FK record.
 * Delegates to generateItemCode() from Module 1 (Code Generation) when
 * available.  If Module 1 is not loaded, uses a simple fallback that
 * reads the last code from the sheet and increments.
 *
 * @param   {string} sheetName - The sheet to generate a code for
 * @param   {Object} formData  - Form data (may contain category info)
 * @returns {string} The new item code, or empty string on failure
 */
function _generateCodeForSheet(sheetName, formData) {
  // Try Module 1 function if available
  if (typeof generateItemCode === 'function') {
    // V9: headers renamed; check both old (V8) and new (V9) key names for compatibility
    var category = formData['L2 Trim Category'] || formData['L2 Category'] ||
                   formData['Trim Category']    || formData['Category'] || '';
    return generateItemCode(sheetName, category);
  }

  // Fallback: simple sequential code generation
  var codeFormat = CONFIG.ITEM_CODE_FORMATS[sheetName];
  if (!codeFormat) {
    Logger.log('MODULE2 :: _generateCodeForSheet - No code format defined for ' + sheetName);
    return '';
  }

  var sheet = getSheetByName(sheetName);
  if (!sheet) {
    return '';
  }

  var lastRow = sheet.getLastRow();
  var maxSeq = 0;

  if (lastRow >= FK_DATA_START_ROW) {
    var codes = sheet.getRange(FK_DATA_START_ROW, 1, lastRow - FK_DATA_START_ROW + 1, 1).getValues();

    for (var i = 0; i < codes.length; i++) {
      var codeStr = String(codes[i][0]).trim();
      if (!codeStr) continue;

      // Extract the numeric sequence from the end of the code
      var match = codeStr.match(/(\d+)$/);
      if (match) {
        var seq = parseInt(match[1], 10);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  var nextSeq = maxSeq + 1;
  var prefix = codeFormat.prefix;

  // For per-category codes (TRIM, CONSUMABLE, PACKAGING), insert category
  // V9: headers renamed; check both new (V9) and old (V8) key names for compatibility
  if (codeFormat.perCategory) {
    var cat = formData['L2 Trim Category'] || formData['L2 Category']      ||
              formData['Trim Category']    || formData['Category']          ||
              formData['Consumable Category'] || formData['Packaging Category'] || '';
    if (cat) {
      prefix = codeFormat.prefix + cat + '-';
    } else {
      Logger.log('MODULE2 :: _generateCodeForSheet - Category required for per-category code in ' + sheetName);
      return '';
    }
  }

  // Zero-pad the sequence number
  var seqStr = String(nextSeq);
  while (seqStr.length < codeFormat.seqDigits) {
    seqStr = '0' + seqStr;
  }

  return prefix + seqStr;
}


// ---------------------------------------------------------------------------
// Cache Helpers
// ---------------------------------------------------------------------------

/**
 * Tries to get cached MASTER_RELATIONS data from the 3-layer cache.
 * Returns null if cache miss or getCachedData() is not available.
 *
 * @returns {Object[]|null} Cached relations array, or null
 */
function _fkGetCachedRelations() {
  try {
    if (typeof getCachedData === 'function') {
      var cached = getCachedData(FK_RELATIONS_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }
  } catch (err) {
    Logger.log('MODULE2 :: _fkGetCachedRelations - Cache read error: ' + err.message);
  }
  return null;
}


/**
 * Stores parsed MASTER_RELATIONS data in the cache.
 *
 * @param {Object[]} relations - Array of parsed relation objects
 */
function _fkSetCachedRelations(relations) {
  try {
    if (typeof setCachedData === 'function') {
      setCachedData(FK_RELATIONS_CACHE_KEY, relations);
    }
  } catch (err) {
    Logger.log('MODULE2 :: _fkSetCachedRelations - Cache write error: ' + err.message);
  }
}


/**
 * Invalidates the cache entry for a given sheet name.
 * Called after creating new records so that subsequent dropdown reads
 * pick up the new data.
 *
 * @param {string} sheetName - The sheet whose cache should be cleared
 */
function _fkInvalidateCache(sheetName) {
  try {
    // Invalidate via dedicated function if available (Layer 3 — Smart Invalidation)
    if (typeof invalidateCache === 'function') {
      invalidateCache(sheetName);
      return;
    }

    // Manual invalidation via CacheService
    var cacheKey = CONFIG.CACHE.KEYS[sheetName];
    if (cacheKey) {
      var cache = CacheService.getScriptCache();
      cache.remove(cacheKey);
    }
  } catch (err) {
    Logger.log('MODULE2 :: _fkInvalidateCache - Error: ' + err.message);
  }
}


/**
 * Gets the current user's email address.
 * Falls back to 'system@gas' if unavailable.
 *
 * @returns {string} The user's email
 */
function _fkGetCurrentUserEmail() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email || 'system@gas';
  } catch (err) {
    return 'system@gas';
  }
}
