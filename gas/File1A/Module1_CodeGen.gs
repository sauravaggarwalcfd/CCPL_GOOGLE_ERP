/**
 * ============================================================================
 * MODULE 1 — AUTO CODE GENERATOR
 * ============================================================================
 * File:    Module1_CodeGen.gs
 * Scope:   FILE 1A — CC ERP Masters (Items)
 * Version: V4
 *
 * Generates sequential item codes for all master sheets in FILE 1A + FILE 2.
 *
 * Code Formats — FILE 1A:
 *   RM_MASTER_FABRIC   → RM-FAB-001  (auto, 3-digit seq)
 *   RM_MASTER_YARN     → RM-YRN-001  (auto, 3-digit seq)
 *   RM_MASTER_WOVEN    → RM-WVN-001  (auto, 3-digit seq)
 *   TRIM_MASTER        → TRM-THD-001 (auto, per-category 3-digit seq)
 *   CONSUMABLE_MASTER  → CON-DYE-001 (auto, per-category 3-digit seq)
 *   PACKAGING_MASTER   → PKG-PLY-001 (auto, per-category 3-digit seq)
 *   ARTICLE_MASTER     → 5249HP       (manual, validated by GAS)
 *   ITEM_SUPPLIER_RATES→ ISR-00001    (auto, 5-digit seq)
 *
 * Code Formats — FILE 2 (Procurement):
 *   PO_MASTER          → PO-2026-0001   (auto, year-based 4-digit seq)
 *   PO_LINE_ITEMS      → POL-00001      (auto, 5-digit seq)
 *   GRN_MASTER         → GRN-2026-0001  (auto, year-based 4-digit seq)
 *   GRN_LINE_ITEMS     → GRL-00001      (auto, 5-digit seq)
 *
 * Row Layout:
 *   Row 1 = Banner, Row 2 = Headers, Row 3 = Descriptions, Row 4+ = Data
 *
 * Rules:
 *   - Code column is ALWAYS column A (col 1)
 *   - Never overwrite an existing code
 *   - Sequence is per-category for TRIM, CONSUMABLE, PACKAGING
 *   - Year-based codes reset sequence per year (PO/GRN)
 *   - No company prefix (CC-) anywhere — decision locked V1
 * ============================================================================
 */


// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

/**
 * Sheet-to-prefix mapping for non-category-based auto-code sheets.
 * These sheets have a single flat sequence with no category subdivision.
 */
var SIMPLE_CODE_CONFIG = {
  'RM_MASTER_FABRIC':    { prefix: 'RM-FAB-', digits: 3 },
  'RM_MASTER_YARN':      { prefix: 'RM-YRN-', digits: 3 },
  'RM_MASTER_WOVEN':     { prefix: 'RM-WVN-', digits: 3 },
  'ITEM_SUPPLIER_RATES': { prefix: 'ISR-',    digits: 5 },
  'PO_LINE_ITEMS':       { prefix: 'POL-',    digits: 5 },
  'GRN_LINE_ITEMS':      { prefix: 'GRL-',    digits: 5 }
};

/**
 * Year-based auto-code sheets (FILE 2 — Procurement).
 * Code format: PREFIX + YEAR + "-" + SEQUENCE
 * Example: PO-2026-0001, GRN-2026-0042
 */
var YEAR_CODE_CONFIG = {
  'PO_MASTER':  { prefix: 'PO-',  digits: 4 },
  'GRN_MASTER': { prefix: 'GRN-', digits: 4 }
};

/**
 * Sheet-to-prefix mapping for category-based auto-code sheets.
 * Code format: PREFIX + CATEGORY_CODE + "-" + SEQUENCE
 * Category is read from the designated column.
 */
var CATEGORY_CODE_CONFIG = {
  'TRIM_MASTER':       { prefix: 'TRM-', digits: 3, categoryCol: 5 }, // V9: L1 Division inserted at col 4; L2 Category shifted to col 5
  'CONSUMABLE_MASTER': { prefix: 'CON-', digits: 3, categoryCol: 5 }, // V9: L1 Division inserted at col 4; L2 Category shifted to col 5
  'PACKAGING_MASTER':  { prefix: 'PKG-', digits: 3, categoryCol: 5 }  // V9: L1 Division inserted at col 4; L2 Category shifted to col 5
};

/**
 * Valid trim category codes — V4 final (AGT removed).
 */
var TRIM_CATEGORIES = ['THD', 'LBL', 'ELS', 'ZIP', 'BUT', 'TPE', 'DRW', 'VLC', 'RVT', 'THP', 'OTH', 'BDG'];

/**
 * First data row (1-indexed). Rows 1-3 are banner/headers/descriptions.
 */
var DATA_START_ROW = 4;

/**
 * Code column index (1-indexed). Always column A.
 */
var CODE_COL = 1;


// ---------------------------------------------------------------------------
// MAIN ENTRY: generateItemCode
// ---------------------------------------------------------------------------

/**
 * Main entry point: generates a code for a new row.
 * Called from handleCodeGeneration() when a trigger column is edited
 * and the code cell in that row is empty.
 *
 * @param {string} sheetName - The name of the master sheet.
 * @param {number} row       - The data row number (1-indexed, must be >= DATA_START_ROW).
 * @param {string} category  - The category code (e.g. 'THD', 'ZIP').
 *                              Pass null/empty for non-category sheets.
 * @return {string|null}     - The generated code, or null if generation failed.
 */
function generateItemCode(sheetName, row, category) {
  // Guard: never generate for header/banner rows
  if (row < DATA_START_ROW) {
    Logger.log('CodeGen: Row ' + row + ' is above data start. Skipping.');
    return null;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('CodeGen: Sheet "' + sheetName + '" not found.');
    return null;
  }

  // Check if code cell already has a value — never overwrite
  var existingCode = sheet.getRange(row, CODE_COL).getValue();
  if (existingCode !== '' && existingCode !== null && existingCode !== undefined) {
    Logger.log('CodeGen: Row ' + row + ' already has code "' + existingCode + '". Skipping.');
    return null;
  }

  // Build the full prefix for this sheet + category
  var prefix = getCodePrefix(sheetName, category);
  if (!prefix) {
    Logger.log('CodeGen: Could not determine prefix for sheet "' + sheetName + '", category "' + category + '".');
    return null;
  }

  // Scan all existing codes to find the next sequence number
  var nextSeq = getNextSequence(sheet, prefix);

  // Determine digit count
  var digits = getDigitCount_(sheetName);

  // Format the new code
  var newCode = prefix + formatSequence(nextSeq, digits);

  // Duplicate check — belt-and-suspenders safety
  if (codeExistsInSheet_(sheet, newCode)) {
    Logger.log('CodeGen: DUPLICATE detected for "' + newCode + '". Incrementing.');
    nextSeq++;
    newCode = prefix + formatSequence(nextSeq, digits);
  }

  // Write the code to column A
  sheet.getRange(row, CODE_COL).setValue(newCode);
  Logger.log('CodeGen: Generated "' + newCode + '" at row ' + row + ' on "' + sheetName + '".');

  return newCode;
}


// ---------------------------------------------------------------------------
// MAIN ENTRY: generateProcurementCode (FILE 2)
// ---------------------------------------------------------------------------

/**
 * Generates a code for a new row in a FILE 2 (Procurement) sheet.
 * Unlike generateItemCode, this opens FILE 2 by ID instead of using
 * the active spreadsheet.
 *
 * Supports both:
 *   - Year-based codes: PO-2026-0001, GRN-2026-0001
 *   - Simple sequential: POL-00001, GRL-00001
 *
 * @param {string} sheetName - The procurement sheet name (e.g. 'PO_MASTER').
 * @param {number} row       - The data row number (1-indexed, >= DATA_START_ROW).
 * @return {string|null}     - The generated code, or null if generation failed.
 */
function generateProcurementCode(sheetName, row) {
  if (row < DATA_START_ROW) {
    Logger.log('CodeGen-F2: Row ' + row + ' is above data start. Skipping.');
    return null;
  }

  var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_2);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('CodeGen-F2: Sheet "' + sheetName + '" not found in FILE 2.');
    return null;
  }

  // Never overwrite existing code
  var existingCode = sheet.getRange(row, CODE_COL).getValue();
  if (existingCode !== '' && existingCode !== null && existingCode !== undefined) {
    Logger.log('CodeGen-F2: Row ' + row + ' already has code "' + existingCode + '". Skipping.');
    return null;
  }

  var newCode;

  // Year-based codes (PO_MASTER, GRN_MASTER)
  if (YEAR_CODE_CONFIG.hasOwnProperty(sheetName)) {
    var cfg = YEAR_CODE_CONFIG[sheetName];
    var year = new Date().getFullYear().toString();
    var yearPrefix = cfg.prefix + year + '-';
    var nextSeq = getNextSequence(sheet, yearPrefix);
    newCode = yearPrefix + formatSequence(nextSeq, cfg.digits);

    // Duplicate check
    if (codeExistsInSheet_(sheet, newCode)) {
      nextSeq++;
      newCode = yearPrefix + formatSequence(nextSeq, cfg.digits);
    }
  }
  // Simple sequential codes (PO_LINE_ITEMS, GRN_LINE_ITEMS)
  else if (SIMPLE_CODE_CONFIG.hasOwnProperty(sheetName)) {
    var sCfg = SIMPLE_CODE_CONFIG[sheetName];
    var nextSeqS = getNextSequence(sheet, sCfg.prefix);
    newCode = sCfg.prefix + formatSequence(nextSeqS, sCfg.digits);

    if (codeExistsInSheet_(sheet, newCode)) {
      nextSeqS++;
      newCode = sCfg.prefix + formatSequence(nextSeqS, sCfg.digits);
    }
  }
  else {
    Logger.log('CodeGen-F2: No config found for sheet "' + sheetName + '".');
    return null;
  }

  sheet.getRange(row, CODE_COL).setValue(newCode);
  Logger.log('CodeGen-F2: Generated "' + newCode + '" at row ' + row + ' on "' + sheetName + '".');
  return newCode;
}


// ---------------------------------------------------------------------------
// handleProcurementCodeGen — onEdit entry for FILE 2 procurement sheets
// ---------------------------------------------------------------------------

/**
 * Called from onEdit routing when an edit occurs on a FILE 2 procurement sheet.
 * Generates auto-codes for PO_MASTER, PO_LINE_ITEMS, GRN_MASTER, GRN_LINE_ITEMS.
 *
 * Trigger conditions:
 *   - Edit is on a recognized procurement sheet
 *   - Edited row >= DATA_START_ROW
 *   - Code cell (col A) is empty
 *   - Edit is NOT in col A (the auto-code column)
 *
 * @param {Event} e - The Google Sheets onEdit event object.
 */
function handleProcurementCodeGen(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  var editedRow = e.range.getRow();
  var editedCol = e.range.getColumn();

  if (editedRow < DATA_START_ROW) return;
  if (editedCol === CODE_COL) return; // don't trigger on code column itself

  // Only for procurement sheets
  if (!isProcurementCodeSheet(sheetName)) return;

  // Check if code cell is empty
  var existingCode = sheet.getRange(editedRow, CODE_COL).getValue();
  if (existingCode !== '' && existingCode !== null && existingCode !== undefined) return;

  // Require non-empty edit
  var editedValue = e.range.getValue();
  if (editedValue === '' || editedValue === null || editedValue === undefined) return;

  generateProcurementCode(sheetName, editedRow);
}


/**
 * Checks whether a sheet is a procurement auto-code sheet (FILE 2).
 *
 * @param {string} sheetName - The sheet name to check.
 * @return {boolean}
 */
function isProcurementCodeSheet(sheetName) {
  return YEAR_CODE_CONFIG.hasOwnProperty(sheetName) ||
         (sheetName === 'PO_LINE_ITEMS' || sheetName === 'GRN_LINE_ITEMS');
}


// ---------------------------------------------------------------------------
// getCodePrefix
// ---------------------------------------------------------------------------

/**
 * Returns the full prefix string for a given sheet and optional category.
 *
 * Examples:
 *   getCodePrefix('RM_MASTER_FABRIC', null)   → 'RM-FAB-'
 *   getCodePrefix('TRIM_MASTER', 'THD')       → 'TRM-THD-'
 *   getCodePrefix('CONSUMABLE_MASTER', 'DYE') → 'CON-DYE-'
 *   getCodePrefix('ITEM_SUPPLIER_RATES', null) → 'ISR-'
 *
 * @param {string} sheetName - The master sheet name.
 * @param {string} category  - The category code (required for TRIM/CONSUMABLE/PACKAGING).
 * @return {string|null}     - The full prefix, or null if invalid.
 */
function getCodePrefix(sheetName, category) {
  // Simple (non-category) sheets
  if (SIMPLE_CODE_CONFIG.hasOwnProperty(sheetName)) {
    return SIMPLE_CODE_CONFIG[sheetName].prefix;
  }

  // Category-based sheets
  if (CATEGORY_CODE_CONFIG.hasOwnProperty(sheetName)) {
    if (!category || category.toString().trim() === '') {
      Logger.log('CodeGen: Category required for sheet "' + sheetName + '" but was empty.');
      return null;
    }
    var catCode = category.toString().trim().toUpperCase();
    return CATEGORY_CODE_CONFIG[sheetName].prefix + catCode + '-';
  }

  // ARTICLE_MASTER is manual — no prefix generation
  if (sheetName === 'ARTICLE_MASTER') {
    Logger.log('CodeGen: ARTICLE_MASTER codes are manual. No prefix generated.');
    return null;
  }

  Logger.log('CodeGen: Unknown sheet "' + sheetName + '" for code generation.');
  return null;
}


// ---------------------------------------------------------------------------
// getNextSequence
// ---------------------------------------------------------------------------

/**
 * Scans ALL existing codes in column A of the given sheet and returns
 * the next sequence number for the given prefix.
 *
 * Handles:
 *   - Empty sheets (returns 1)
 *   - Gaps in sequence (returns max + 1, does NOT fill gaps)
 *   - Non-matching codes in column A (skips them)
 *   - Category divider rows (blank or non-code text — skips)
 *
 * @param {Sheet}  sheet  - The Google Sheet object to scan.
 * @param {string} prefix - The full prefix to match (e.g. 'TRM-THD-', 'RM-FAB-').
 * @return {number}       - The next sequence number (>= 1).
 */
function getNextSequence(sheet, prefix) {
  var lastRow = sheet.getLastRow();

  // Empty sheet or no data rows yet
  if (lastRow < DATA_START_ROW) {
    return 1;
  }

  // Read all code values at once (single API call for performance)
  var numDataRows = lastRow - DATA_START_ROW + 1;
  var codeRange = sheet.getRange(DATA_START_ROW, CODE_COL, numDataRows, 1);
  var codeValues = codeRange.getValues(); // 2D array: [[val], [val], ...]

  var maxSeq = 0;

  for (var i = 0; i < codeValues.length; i++) {
    var cellValue = codeValues[i][0];
    if (cellValue === '' || cellValue === null || cellValue === undefined) {
      continue;
    }

    var code = cellValue.toString().trim().toUpperCase();

    // Check if this code starts with the target prefix
    if (code.indexOf(prefix.toUpperCase()) === 0) {
      // Extract the numeric part after the prefix
      var seqStr = code.substring(prefix.length);
      var seqNum = parseInt(seqStr, 10);

      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }

  return maxSeq + 1;
}


// ---------------------------------------------------------------------------
// formatSequence
// ---------------------------------------------------------------------------

/**
 * Zero-pads a sequence number to the specified digit count.
 *
 * @param {number} seq    - The sequence number (e.g. 1, 42, 123).
 * @param {number} digits - The total digit width (e.g. 3 → '001', 5 → '00001').
 * @return {string}       - The zero-padded string.
 */
function formatSequence(seq, digits) {
  if (typeof digits !== 'number' || digits < 1) {
    digits = 3; // safe default
  }
  var str = seq.toString();
  while (str.length < digits) {
    str = '0' + str;
  }
  return str;
}


// ---------------------------------------------------------------------------
// validateArticleCode
// ---------------------------------------------------------------------------

/**
 * Validates a manually entered ARTICLE_MASTER code.
 *
 * Format rules (locked V3.1):
 *   - 4 or 5 digits followed by exactly 2 uppercase letters
 *   - No spaces, no dashes, no prefix
 *   - Examples: 5249HP, 54568HR, 1234AB
 *
 * @param {string} code - The code to validate.
 * @return {Object}     - { valid: boolean, message: string }
 */
function validateArticleCode(code) {
  if (code === null || code === undefined || code.toString().trim() === '') {
    return {
      valid: false,
      message: 'Article code cannot be empty.'
    };
  }

  var codeStr = code.toString().trim();

  // Regex: exactly 4-5 digits followed by exactly 2 uppercase letters, nothing else
  var pattern = /^[0-9]{4,5}[A-Z]{2}$/;

  if (!pattern.test(codeStr)) {
    return {
      valid: false,
      message: 'Invalid article code "' + codeStr + '". Must be 4-5 digits + 2 uppercase letters (e.g. 5249HP, 54568HR). No spaces or special characters.'
    };
  }

  return {
    valid: true,
    message: 'Valid article code.'
  };
}


// ---------------------------------------------------------------------------
// handleCodeGeneration — onEdit entry point
// ---------------------------------------------------------------------------

/**
 * Called from the main onEdit(e) trigger. Determines if code generation
 * is needed based on the edited cell, then generates the code.
 *
 * Trigger conditions for AUTO code generation:
 *   1. The edited sheet is a recognized master sheet
 *   2. The edited row is a data row (>= DATA_START_ROW)
 *   3. The code cell (col A) for that row is empty
 *   4. For category-based sheets: the edit was in the category column
 *      and the category value is non-empty
 *   5. For simple sheets: any meaningful column was edited
 *      (we trigger when column B or later is edited, since col A is the code cell)
 *
 * For ARTICLE_MASTER: validates the manually entered code in col A.
 *
 * @param {Event} e - The Google Sheets onEdit event object.
 */
function handleCodeGeneration(e) {
  if (!e || !e.range) {
    return;
  }

  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  var editedRow = e.range.getRow();
  var editedCol = e.range.getColumn();

  // Ignore edits in banner/header/description rows
  if (editedRow < DATA_START_ROW) {
    return;
  }

  // -----------------------------------------------------------------------
  // ARTICLE_MASTER — Validate manual code on col A edit
  // -----------------------------------------------------------------------
  if (sheetName === 'ARTICLE_MASTER') {
    if (editedCol === CODE_COL) {
      var enteredCode = e.range.getValue();
      if (enteredCode === '' || enteredCode === null) {
        return; // user cleared the cell, nothing to validate
      }

      var validation = validateArticleCode(enteredCode);
      if (!validation.valid) {
        // Show error to user and clear the invalid entry
        SpreadsheetApp.getUi().alert('Invalid Article Code\n\n' + validation.message);
        e.range.setValue('');
        e.range.activate(); // put focus back on the cell
        return;
      }

      // Check for duplicate article codes
      var normalizedCode = enteredCode.toString().trim();
      if (codeExistsInSheet_(sheet, normalizedCode)) {
        SpreadsheetApp.getUi().alert(
          'Duplicate Article Code\n\n' +
          'Code "' + normalizedCode + '" already exists in ARTICLE_MASTER.\n' +
          'Each article must have a unique code.'
        );
        e.range.setValue('');
        e.range.activate();
        return;
      }
    }
    return; // ARTICLE_MASTER never auto-generates
  }

  // -----------------------------------------------------------------------
  // CATEGORY-BASED AUTO-CODE SHEETS (TRIM, CONSUMABLE, PACKAGING)
  // -----------------------------------------------------------------------
  if (CATEGORY_CODE_CONFIG.hasOwnProperty(sheetName)) {
    var catConfig = CATEGORY_CODE_CONFIG[sheetName];

    // Only trigger when the category column is edited
    if (editedCol !== catConfig.categoryCol) {
      return;
    }

    var categoryValue = sheet.getRange(editedRow, catConfig.categoryCol).getValue();
    if (categoryValue === '' || categoryValue === null || categoryValue === undefined) {
      return; // category was cleared, don't generate
    }

    var categoryCode = categoryValue.toString().trim().toUpperCase();

    // For TRIM_MASTER, validate that the category code is recognized
    if (sheetName === 'TRIM_MASTER' && TRIM_CATEGORIES.indexOf(categoryCode) === -1) {
      Logger.log('CodeGen: Unrecognized trim category "' + categoryCode + '". Skipping code generation.');
      SpreadsheetApp.getUi().alert(
        'Unknown Trim Category\n\n' +
        '"' + categoryCode + '" is not a valid trim category.\n' +
        'Valid categories: ' + TRIM_CATEGORIES.join(', ')
      );
      return;
    }

    // Check if code cell is already filled
    var existingCode = sheet.getRange(editedRow, CODE_COL).getValue();
    if (existingCode !== '' && existingCode !== null && existingCode !== undefined) {
      return; // code already exists, never overwrite
    }

    generateItemCode(sheetName, editedRow, categoryCode);
    return;
  }

  // -----------------------------------------------------------------------
  // SIMPLE AUTO-CODE SHEETS (RM_MASTER_FABRIC, RM_MASTER_YARN, etc.)
  // -----------------------------------------------------------------------
  if (SIMPLE_CODE_CONFIG.hasOwnProperty(sheetName)) {
    // Trigger when any column other than A is edited (col A is the code itself)
    if (editedCol === CODE_COL) {
      return; // user should not be typing in the auto-code column
    }

    // Only generate if the code cell is empty
    var existingSimpleCode = sheet.getRange(editedRow, CODE_COL).getValue();
    if (existingSimpleCode !== '' && existingSimpleCode !== null && existingSimpleCode !== undefined) {
      return; // already has a code
    }

    // Require at least one substantive cell to be filled before generating
    // For RM sheets, we check that the edited cell actually has content
    var editedValue = e.range.getValue();
    if (editedValue === '' || editedValue === null || editedValue === undefined) {
      return; // blank edit, don't generate
    }

    generateItemCode(sheetName, editedRow, null);
    return;
  }
}


// ---------------------------------------------------------------------------
// BATCH CODE GENERATION (for initial data import / bulk operations)
// ---------------------------------------------------------------------------

/**
 * Generates codes for all rows in a sheet that are missing codes.
 * Useful when importing data or when codes need to be back-filled.
 *
 * For category-based sheets, reads the category from the designated column.
 * For simple sheets, assigns the next sequential code.
 * Skips rows where both code and all other columns are empty (truly blank rows).
 *
 * @param {string} sheetName - The master sheet name.
 */
function batchGenerateCodes(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Sheet "' + sheetName + '" not found.');
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    SpreadsheetApp.getUi().alert('No data rows found in "' + sheetName + '".');
    return;
  }

  var numDataRows = lastRow - DATA_START_ROW + 1;
  var lastCol = sheet.getLastColumn();

  // Read all data at once for performance
  var allData = sheet.getRange(DATA_START_ROW, 1, numDataRows, Math.max(lastCol, 4)).getValues();
  var codesGenerated = 0;

  var isCategorySheet = CATEGORY_CODE_CONFIG.hasOwnProperty(sheetName);
  var isSimpleSheet = SIMPLE_CODE_CONFIG.hasOwnProperty(sheetName);

  if (!isCategorySheet && !isSimpleSheet) {
    SpreadsheetApp.getUi().alert('"' + sheetName + '" is not configured for auto-code generation.');
    return;
  }

  for (var i = 0; i < allData.length; i++) {
    var row = allData[i];
    var rowNum = DATA_START_ROW + i;
    var existingCode = row[0]; // col A (index 0)

    // Skip if code already exists
    if (existingCode !== '' && existingCode !== null && existingCode !== undefined) {
      continue;
    }

    // Skip truly empty rows — check if any cell in the row has content
    var hasContent = false;
    for (var c = 1; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null && row[c] !== undefined) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) {
      continue;
    }

    if (isCategorySheet) {
      var catCol = CATEGORY_CODE_CONFIG[sheetName].categoryCol;
      var category = row[catCol - 1]; // convert 1-indexed col to 0-indexed array
      if (category === '' || category === null || category === undefined) {
        Logger.log('CodeGen Batch: Row ' + rowNum + ' has no category. Skipping.');
        continue;
      }
      generateItemCode(sheetName, rowNum, category.toString().trim().toUpperCase());
    } else {
      generateItemCode(sheetName, rowNum, null);
    }

    codesGenerated++;
  }

  SpreadsheetApp.getUi().alert(
    'Batch Code Generation Complete\n\n' +
    'Sheet: ' + sheetName + '\n' +
    'Codes generated: ' + codesGenerated
  );
}


// ---------------------------------------------------------------------------
// UTILITY / HELPER FUNCTIONS (private)
// ---------------------------------------------------------------------------

/**
 * Returns the digit count for a given sheet's code format.
 *
 * @param {string} sheetName - The master sheet name.
 * @return {number}          - Number of digits for zero-padding.
 * @private
 */
function getDigitCount_(sheetName) {
  if (SIMPLE_CODE_CONFIG.hasOwnProperty(sheetName)) {
    return SIMPLE_CODE_CONFIG[sheetName].digits;
  }
  if (CATEGORY_CODE_CONFIG.hasOwnProperty(sheetName)) {
    return CATEGORY_CODE_CONFIG[sheetName].digits;
  }
  if (YEAR_CODE_CONFIG.hasOwnProperty(sheetName)) {
    return YEAR_CODE_CONFIG[sheetName].digits;
  }
  return 3; // default
}


/**
 * Checks if a specific code already exists in column A of the sheet.
 * Used for duplicate detection on both auto-generated and manual codes.
 *
 * @param {Sheet}  sheet - The Google Sheet object.
 * @param {string} code  - The code to search for.
 * @return {boolean}     - True if the code already exists.
 * @private
 */
function codeExistsInSheet_(sheet, code) {
  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    return false;
  }

  var numDataRows = lastRow - DATA_START_ROW + 1;
  var codeValues = sheet.getRange(DATA_START_ROW, CODE_COL, numDataRows, 1).getValues();
  var normalizedCode = code.toString().trim().toUpperCase();

  for (var i = 0; i < codeValues.length; i++) {
    var cellValue = codeValues[i][0];
    if (cellValue !== '' && cellValue !== null && cellValue !== undefined) {
      if (cellValue.toString().trim().toUpperCase() === normalizedCode) {
        return true;
      }
    }
  }

  return false;
}


/**
 * Returns the configuration object for a sheet, regardless of type.
 * Useful for external modules that need to know a sheet's code setup.
 *
 * @param {string} sheetName - The master sheet name.
 * @return {Object|null}     - Config object { prefix, digits, categoryCol? } or null.
 */
function getCodeConfig(sheetName) {
  if (SIMPLE_CODE_CONFIG.hasOwnProperty(sheetName)) {
    return SIMPLE_CODE_CONFIG[sheetName];
  }
  if (CATEGORY_CODE_CONFIG.hasOwnProperty(sheetName)) {
    return CATEGORY_CODE_CONFIG[sheetName];
  }
  if (YEAR_CODE_CONFIG.hasOwnProperty(sheetName)) {
    return YEAR_CODE_CONFIG[sheetName];
  }
  return null;
}


/**
 * Checks whether a given sheet uses auto-code generation.
 *
 * @param {string} sheetName - The master sheet name.
 * @return {boolean}         - True if codes are auto-generated for this sheet.
 */
function isAutoCodeSheet(sheetName) {
  return SIMPLE_CODE_CONFIG.hasOwnProperty(sheetName) ||
         CATEGORY_CODE_CONFIG.hasOwnProperty(sheetName) ||
         YEAR_CODE_CONFIG.hasOwnProperty(sheetName);
}


/**
 * Returns all valid trim category codes.
 * Exposed for use by other modules (attribute system, validation, dropdowns).
 *
 * @return {string[]} - Array of trim category codes.
 */
function getTrimCategories() {
  return TRIM_CATEGORIES.slice(); // return a copy
}


// ---------------------------------------------------------------------------
// CUSTOM MENU INTEGRATION
// ---------------------------------------------------------------------------

/**
 * Adds the Code Generation submenu items to the ERP custom menu.
 * Called from the main onOpen() trigger.
 *
 * @param {Menu} menu - The Google Sheets custom menu object to add items to.
 */
function addCodeGenMenuItems(menu) {
  menu.addSubMenu(
    SpreadsheetApp.getUi().createMenu('Code Generation')
      .addItem('Batch Generate — RM Fabric', 'batchGenRM_FABRIC_')
      .addItem('Batch Generate — RM Yarn', 'batchGenRM_YARN_')
      .addItem('Batch Generate — RM Woven', 'batchGenRM_WOVEN_')
      .addItem('Batch Generate — Trim Master', 'batchGenTRIM_')
      .addItem('Batch Generate — Consumable Master', 'batchGenCONSUMABLE_')
      .addItem('Batch Generate — Packaging Master', 'batchGenPACKAGING_')
      .addItem('Batch Generate — Item Supplier Rates', 'batchGenISR_')
      .addSeparator()
      .addItem('Batch Generate — PO Master (F2)', 'batchGenPO_MASTER_')
      .addItem('Batch Generate — PO Line Items (F2)', 'batchGenPO_LINES_')
      .addItem('Batch Generate — GRN Master (F2)', 'batchGenGRN_MASTER_')
      .addItem('Batch Generate — GRN Line Items (F2)', 'batchGenGRN_LINES_')
  );
}

// Menu callback wrappers (GAS menu items require named no-arg functions)
function batchGenRM_FABRIC_()  { batchGenerateCodes('RM_MASTER_FABRIC'); }
function batchGenRM_YARN_()    { batchGenerateCodes('RM_MASTER_YARN'); }
function batchGenRM_WOVEN_()   { batchGenerateCodes('RM_MASTER_WOVEN'); }
function batchGenTRIM_()       { batchGenerateCodes('TRIM_MASTER'); }
function batchGenCONSUMABLE_() { batchGenerateCodes('CONSUMABLE_MASTER'); }
function batchGenPACKAGING_()  { batchGenerateCodes('PACKAGING_MASTER'); }
function batchGenISR_()        { batchGenerateCodes('ITEM_SUPPLIER_RATES'); }
function batchGenPO_MASTER_()  { batchGenerateProcurementCodes('PO_MASTER'); }
function batchGenPO_LINES_()   { batchGenerateProcurementCodes('PO_LINE_ITEMS'); }
function batchGenGRN_MASTER_() { batchGenerateProcurementCodes('GRN_MASTER'); }
function batchGenGRN_LINES_()  { batchGenerateProcurementCodes('GRN_LINE_ITEMS'); }


// ---------------------------------------------------------------------------
// BATCH CODE GENERATION — PROCUREMENT (FILE 2)
// ---------------------------------------------------------------------------

/**
 * Generates codes for all rows in a FILE 2 procurement sheet that are missing codes.
 *
 * @param {string} sheetName - The procurement sheet name.
 */
function batchGenerateProcurementCodes(sheetName) {
  var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_2);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Sheet "' + sheetName + '" not found in FILE 2.');
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    SpreadsheetApp.getUi().alert('No data rows found in "' + sheetName + '".');
    return;
  }

  var numDataRows = lastRow - DATA_START_ROW + 1;
  var lastCol = sheet.getLastColumn();
  var allData = sheet.getRange(DATA_START_ROW, 1, numDataRows, Math.max(lastCol, 2)).getValues();
  var codesGenerated = 0;

  for (var i = 0; i < allData.length; i++) {
    var row = allData[i];
    var rowNum = DATA_START_ROW + i;
    var existingCode = row[0];

    if (existingCode !== '' && existingCode !== null && existingCode !== undefined) continue;

    // Skip truly empty rows
    var hasContent = false;
    for (var c = 1; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null && row[c] !== undefined) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) continue;

    generateProcurementCode(sheetName, rowNum);
    codesGenerated++;
  }

  SpreadsheetApp.getUi().alert(
    'Batch Code Generation Complete (FILE 2)\n\n' +
    'Sheet: ' + sheetName + '\n' +
    'Codes generated: ' + codesGenerated
  );
}
