/**
 * =============================================================================
 * MODULE 4 — ITEM_CHANGE_LOG (Audit Trail)
 * =============================================================================
 *
 * Auto-logs every edit to any master sheet in FILE 1A.
 *
 * Sheet: ITEM_CHANGE_LOG
 * Row Structure: Row 1=banner, Row 2=headers, Row 3=descriptions, Row 4+=data
 * Columns: Timestamp | User Email | Action | Sheet Name | Item Code |
 *          Field Changed | Old Value | New Value | Row | Column
 *
 * Action types: CREATE, UPDATE, DELETE, STATUS_CHANGE
 * Timestamp format: dd-MMM-yyyy HH:mm:ss (IST)
 *
 * This sheet is auto-written ONLY by GAS — never manual entry.
 * =============================================================================
 */


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var CHANGELOG_SHEET_NAME = 'ITEM_CHANGE_LOG';
var CHANGELOG_TIMESTAMP_FORMAT = 'dd-MMM-yyyy HH:mm:ss';
var CHANGELOG_TIMEZONE = 'Asia/Kolkata';

/** Columns in the ITEM_CHANGE_LOG sheet (Row 2 headers) */
var CL_COL = {
  TIMESTAMP:     1,
  USER_EMAIL:    2,
  ACTION:        3,
  SHEET_NAME:    4,
  ITEM_CODE:     5,
  FIELD_CHANGED: 6,
  OLD_VALUE:     7,
  NEW_VALUE:     8,
  ROW:           9,
  COLUMN:       10
};

/** Valid action types */
var CL_ACTION = {
  CREATE:        'CREATE',
  UPDATE:        'UPDATE',
  DELETE:        'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE'
};

/**
 * Sheets that should NOT be logged (non-data or system sheets).
 * ITEM_CHANGE_LOG itself is excluded to prevent infinite recursion.
 * MASTER_RELATIONS is config-only and read by GAS — edits are rare manual config.
 */
var CL_EXCLUDED_SHEETS = [
  'ITEM_CHANGE_LOG',
  'MASTER_RELATIONS'
];


// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Writes a single row to the ITEM_CHANGE_LOG sheet.
 *
 * @param {string} action      - One of CREATE, UPDATE, DELETE, STATUS_CHANGE
 * @param {string} sheetName   - Name of the sheet where the edit occurred
 * @param {string} itemCode    - The item/record code from column A of the edited row
 * @param {string} field       - The header name of the edited column
 * @param {*}      oldVal      - Previous cell value (before edit)
 * @param {*}      newVal      - New cell value (after edit)
 * @param {string} userEmail   - Email of the user who made the edit
 */
function writeChangeLog(action, sheetName, itemCode, field, oldVal, newVal, userEmail) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(CHANGELOG_SHEET_NAME);

    if (!logSheet) {
      Logger.log('ITEM_CHANGE_LOG sheet not found. Cannot write audit entry.');
      return;
    }

    // Format timestamp in IST
    var timestamp = Utilities.formatDate(
      new Date(),
      CHANGELOG_TIMEZONE,
      CHANGELOG_TIMESTAMP_FORMAT
    );

    // Sanitize values — convert objects/arrays to string, handle nulls
    var oldStr = _sanitizeLogValue(oldVal);
    var newStr = _sanitizeLogValue(newVal);

    // Build the log row matching the 10-column structure
    var logRow = [
      timestamp,                         // Col 1: Timestamp
      userEmail || '',                   // Col 2: User Email
      action || CL_ACTION.UPDATE,        // Col 3: Action
      sheetName || '',                   // Col 4: Sheet Name
      itemCode || '',                    // Col 5: Item Code
      field || '',                       // Col 6: Field Changed
      oldStr,                            // Col 7: Old Value
      newStr,                            // Col 8: New Value
      '',                                // Col 9: Row (set by caller or handleChangeLog)
      ''                                 // Col 10: Column (set by caller or handleChangeLog)
    ];

    // Append to the next available row (after row 3 headers)
    var lastRow = logSheet.getLastRow();
    var targetRow = Math.max(lastRow + 1, 4); // Data starts at row 4
    logSheet.getRange(targetRow, 1, 1, logRow.length).setValues([logRow]);

  } catch (err) {
    Logger.log('Error writing change log: ' + err.message);
  }
}


/**
 * Called from the installable onEdit trigger. Extracts all parameters from the
 * event object and writes to ITEM_CHANGE_LOG.
 *
 * @param {Object} e - The onEdit event object
 *   e.range, e.oldValue, e.value, e.source, etc.
 */
function handleChangeLog(e) {
  try {
    // Guard: must have a valid event with range
    if (!e || !e.range) {
      return;
    }

    var range = e.range;
    var sheet = range.getSheet();
    var sheetName = sheet.getName();

    // Skip excluded sheets
    if (CL_EXCLUDED_SHEETS.indexOf(sheetName) !== -1) {
      return;
    }

    var row = range.getRow();
    var col = range.getColumn();

    // Only log data row edits (row 4+). Rows 1-3 are banner/headers/descriptions.
    if (row < 4) {
      return;
    }

    // Handle multi-cell edits: only log single-cell edits for accuracy
    // For bulk operations, use dedicated batch functions that call writeChangeLog directly.
    if (range.getNumRows() > 1 || range.getNumColumns() > 1) {
      return;
    }

    var newValue = e.value !== undefined ? e.value : range.getValue();
    var oldValue = e.oldValue !== undefined ? e.oldValue : '';

    // Skip if nothing actually changed
    if (String(oldValue) === String(newValue)) {
      return;
    }

    // Get user email
    var userEmail = _getCurrentUserEmail();

    // Get item code from column A of the edited row
    var itemCode = getItemCodeFromRow(sheet, row);

    // Get field name from the header row (row 2)
    var fieldName = getFieldNameFromCol(sheet, col);

    // Determine the action type
    var action = _determineAction(sheet, row, col, oldValue, newValue, fieldName);

    // Write the log entry
    writeChangeLog(action, sheetName, itemCode, fieldName, oldValue, newValue, userEmail);

    // Update the row and column references on the log entry just written
    _updateRowColOnLastEntry(row, col);

  } catch (err) {
    Logger.log('Error in handleChangeLog: ' + err.message);
  }
}


/**
 * Gets the item/record code from column A of the given row.
 * Column A is always the primary key / code column per the sheet structure standard.
 *
 * @param {Sheet} sheet - The Google Sheet object
 * @param {number} row  - The row number (1-based)
 * @returns {string} The item code, or empty string if not found
 */
function getItemCodeFromRow(sheet, row) {
  try {
    if (!sheet || row < 4) {
      return '';
    }
    var value = sheet.getRange(row, 1).getValue();
    return value ? String(value).trim() : '';
  } catch (err) {
    Logger.log('Error getting item code from row ' + row + ': ' + err.message);
    return '';
  }
}


/**
 * Gets the header/field name from row 2 of the given column.
 * Row 2 is always the header row per the sheet structure standard.
 *
 * @param {Sheet} sheet - The Google Sheet object
 * @param {number} col  - The column number (1-based)
 * @returns {string} The field/header name, or 'Column ' + col if not found
 */
function getFieldNameFromCol(sheet, col) {
  try {
    if (!sheet || col < 1) {
      return 'Column ' + col;
    }
    var value = sheet.getRange(2, col).getValue();
    return value ? String(value).trim() : 'Column ' + col;
  } catch (err) {
    Logger.log('Error getting field name from col ' + col + ': ' + err.message);
    return 'Column ' + col;
  }
}


// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Determines the appropriate action type for a change log entry.
 *
 * Rules:
 * - If the code column itself (col A) is edited from blank to a value => CREATE
 * - If the field name contains "Status" and value changed => STATUS_CHANGE
 * - If the new value is blank and old value existed => could be a DELETE signal
 *   (actual DELETE is typically handled by dedicated delete functions)
 * - Otherwise => UPDATE
 *
 * @param {Sheet}  sheet    - The sheet
 * @param {number} row      - Edited row
 * @param {number} col      - Edited column
 * @param {*}      oldValue - Previous value
 * @param {*}      newValue - New value
 * @param {string} fieldName - Header name of the column
 * @returns {string} Action type
 */
function _determineAction(sheet, row, col, oldValue, newValue, fieldName) {
  // Column A (code column) edited from blank => new record creation
  if (col === 1 && (!oldValue || String(oldValue).trim() === '') && newValue && String(newValue).trim() !== '') {
    return CL_ACTION.CREATE;
  }

  // Column A cleared => potential deletion
  if (col === 1 && oldValue && String(oldValue).trim() !== '' && (!newValue || String(newValue).trim() === '')) {
    return CL_ACTION.DELETE;
  }

  // Status field changed
  if (fieldName && fieldName.toLowerCase().indexOf('status') !== -1) {
    return CL_ACTION.STATUS_CHANGE;
  }

  // Default: regular update
  return CL_ACTION.UPDATE;
}


/**
 * Updates the Row and Column fields on the last entry in the change log.
 * Called after writeChangeLog to fill in position data.
 *
 * @param {number} row - The row where the edit occurred
 * @param {number} col - The column where the edit occurred
 */
function _updateRowColOnLastEntry(row, col) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(CHANGELOG_SHEET_NAME);
    if (!logSheet) return;

    var lastRow = logSheet.getLastRow();
    if (lastRow < 4) return;

    logSheet.getRange(lastRow, CL_COL.ROW).setValue(row);
    logSheet.getRange(lastRow, CL_COL.COLUMN).setValue(col);
  } catch (err) {
    Logger.log('Error updating row/col on log entry: ' + err.message);
  }
}


/**
 * Gets the current user email from Session.
 * Falls back to 'system@gas' if unavailable (e.g., time-driven triggers).
 *
 * @returns {string} The user's email address
 */
function _getCurrentUserEmail() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email || 'system@gas';
  } catch (err) {
    return 'system@gas';
  }
}


/**
 * Sanitizes a value for safe storage in the change log.
 * Converts objects, arrays, dates to string. Handles null/undefined.
 *
 * @param {*} val - Any value
 * @returns {string} Sanitized string representation
 */
function _sanitizeLogValue(val) {
  if (val === null || val === undefined) {
    return '';
  }
  if (val instanceof Date) {
    return Utilities.formatDate(val, CHANGELOG_TIMEZONE, CHANGELOG_TIMESTAMP_FORMAT);
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (e) {
      return String(val);
    }
  }
  return String(val);
}
