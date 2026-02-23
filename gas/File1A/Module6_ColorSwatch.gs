/**
 * =============================================================================
 * MODULE 6 — COLOR SWATCH (COLOR_MASTER)
 * =============================================================================
 *
 * Auto-applies hex color swatch backgrounds in COLOR_MASTER.
 *
 * COLOR_MASTER columns:
 *   Col A (1): Color Code
 *   Col B (2): Color Name
 *   Col C (3): Pantone Reference
 *   Col D (4): Hex Code
 *   Col E (5): Color Swatch (cell background set to hex value)
 *   Col F (6): Active
 *
 * Row Structure: Row 1=banner, Row 2=headers, Row 3=descriptions, Row 4+=data
 *
 * When Hex Code (col D, row 4+) changes, the Color Swatch cell (col E, same
 * row) background is set to that hex color.
 * =============================================================================
 */


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var CS_SHEET_NAME = 'COLOR_MASTER';
var CS_COL_HEX_CODE = 4;      // Column D — Hex Code
var CS_COL_SWATCH = 5;        // Column E — Color Swatch (background)
var CS_DEFAULT_BG = '#FFFFFF'; // White — used when hex is invalid


// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Applies a color swatch to a single row. Reads the Hex Code from col D of
 * the given row and sets the background of col E (Color Swatch) to that hex.
 *
 * Called when a single Hex Code cell is edited.
 *
 * If the hex is invalid, the swatch cell background is set to white and a
 * note is added to explain the issue.
 */
function applyColorSwatch() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CS_SHEET_NAME);

    if (!sheet) {
      Logger.log('COLOR_SWATCH :: applyColorSwatch - COLOR_MASTER sheet not found.');
      return;
    }

    var activeRange = sheet.getActiveRange();
    if (!activeRange) {
      Logger.log('COLOR_SWATCH :: applyColorSwatch - No active range.');
      return;
    }

    var row = activeRange.getRow();
    var col = activeRange.getColumn();

    // Only process edits in the Hex Code column (col D), data rows (4+)
    if (col !== CS_COL_HEX_CODE || row < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return;
    }

    var hexValue = String(sheet.getRange(row, CS_COL_HEX_CODE).getValue()).trim();
    var swatchCell = sheet.getRange(row, CS_COL_SWATCH);

    if (!hexValue) {
      // Hex cleared — reset swatch to white, remove any note
      swatchCell.setBackground(CS_DEFAULT_BG);
      swatchCell.clearNote();
      return;
    }

    // Normalize hex: add # prefix if missing
    var normalizedHex = _normalizeHex(hexValue);

    if (isValidHex(normalizedHex)) {
      swatchCell.setBackground(normalizedHex);
      swatchCell.clearNote();
    } else {
      swatchCell.setBackground(CS_DEFAULT_BG);
      swatchCell.setNote('Invalid hex code: "' + hexValue + '". Expected format: #RRGGBB or RRGGBB.');
    }

  } catch (err) {
    Logger.log('COLOR_SWATCH :: applyColorSwatch - Error: ' + err.message);
  }
}


/**
 * Batch applies color swatches to ALL data rows in COLOR_MASTER.
 * Loops through every row from row 4 onward and applies the hex background
 * to the Color Swatch column.
 *
 * Can be triggered from the custom menu: CCPL ERP > Apply All Color Swatches
 */
function applyAllColorSwatches() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CS_SHEET_NAME);

    if (!sheet) {
      Logger.log('COLOR_SWATCH :: applyAllColorSwatches - COLOR_MASTER sheet not found.');
      SpreadsheetApp.getUi().alert('COLOR_MASTER sheet not found.');
      return;
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      Logger.log('COLOR_SWATCH :: applyAllColorSwatches - No data rows to process.');
      SpreadsheetApp.getUi().alert('No data rows found in COLOR_MASTER.');
      return;
    }

    var numRows = lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1;

    // Read all hex codes at once for performance
    var hexRange = sheet.getRange(CONFIG.ROW_STRUCTURE.DATA_START_ROW, CS_COL_HEX_CODE, numRows, 1);
    var hexValues = hexRange.getValues();

    // Get the swatch column range
    var swatchRange = sheet.getRange(CONFIG.ROW_STRUCTURE.DATA_START_ROW, CS_COL_SWATCH, numRows, 1);

    // Build arrays for batch operations
    var backgrounds = [];
    var notes = [];
    var appliedCount = 0;
    var invalidCount = 0;

    for (var i = 0; i < hexValues.length; i++) {
      var hexValue = String(hexValues[i][0]).trim();

      if (!hexValue) {
        backgrounds.push([CS_DEFAULT_BG]);
        notes.push(['']);
        continue;
      }

      var normalizedHex = _normalizeHex(hexValue);

      if (isValidHex(normalizedHex)) {
        backgrounds.push([normalizedHex]);
        notes.push(['']);
        appliedCount++;
      } else {
        backgrounds.push([CS_DEFAULT_BG]);
        notes.push(['Invalid hex code: "' + hexValue + '". Expected format: #RRGGBB or RRGGBB.']);
        invalidCount++;
      }
    }

    // Apply all backgrounds and notes in batch
    swatchRange.setBackgrounds(backgrounds);
    swatchRange.setNotes(notes);

    // Notify user
    var message = 'Color swatches applied.\n' +
      'Processed: ' + hexValues.length + ' rows\n' +
      'Applied: ' + appliedCount + ' swatches\n' +
      'Invalid: ' + invalidCount + ' hex codes';

    Logger.log('COLOR_SWATCH :: applyAllColorSwatches - ' + message.replace(/\n/g, ' | '));
    SpreadsheetApp.getUi().alert('Color Swatch Update', message, SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (err) {
    Logger.log('COLOR_SWATCH :: applyAllColorSwatches - Error: ' + err.message);
    SpreadsheetApp.getUi().alert('Error applying color swatches: ' + err.message);
  }
}


/**
 * Called from the installable onEdit trigger when the edited sheet is
 * COLOR_MASTER. Detects if the Hex Code column was edited and applies
 * the swatch background.
 *
 * @param {Object} e - The onEdit event object
 */
function handleColorSwatchEdit(e) {
  try {
    // Guard: must have a valid event with range
    if (!e || !e.range) {
      return;
    }

    var range = e.range;
    var sheet = range.getSheet();
    var sheetName = sheet.getName();

    // Only process COLOR_MASTER edits
    if (sheetName !== CS_SHEET_NAME) {
      return;
    }

    var row = range.getRow();
    var col = range.getColumn();

    // Only process edits in the Hex Code column (col D), data rows (4+)
    if (col !== CS_COL_HEX_CODE || row < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return;
    }

    // Handle multi-cell edits (e.g. paste): apply to each row
    var numRows = range.getNumRows();
    var numCols = range.getNumColumns();

    // If multi-column paste, only care about the Hex Code column
    if (numCols > 1) {
      // Check if the hex code column is within the pasted range
      var startCol = range.getColumn();
      var endCol = startCol + numCols - 1;
      if (CS_COL_HEX_CODE < startCol || CS_COL_HEX_CODE > endCol) {
        return; // Hex Code column not in the pasted range
      }
    }

    // Apply swatch for each affected row
    for (var i = 0; i < numRows; i++) {
      var currentRow = row + i;
      if (currentRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
        continue;
      }

      var hexValue = String(sheet.getRange(currentRow, CS_COL_HEX_CODE).getValue()).trim();
      var swatchCell = sheet.getRange(currentRow, CS_COL_SWATCH);

      if (!hexValue) {
        swatchCell.setBackground(CS_DEFAULT_BG);
        swatchCell.clearNote();
        continue;
      }

      var normalizedHex = _normalizeHex(hexValue);

      if (isValidHex(normalizedHex)) {
        swatchCell.setBackground(normalizedHex);
        swatchCell.clearNote();
      } else {
        swatchCell.setBackground(CS_DEFAULT_BG);
        swatchCell.setNote('Invalid hex code: "' + hexValue + '". Expected format: #RRGGBB or RRGGBB.');
      }
    }

  } catch (err) {
    Logger.log('COLOR_SWATCH :: handleColorSwatchEdit - Error: ' + err.message);
  }
}


/**
 * Validates whether a string is a valid hex color code.
 * Accepts both #RRGGBB and RRGGBB formats (6 hex digits, optionally prefixed with #).
 *
 * @param {string} hex - The hex color string to validate
 * @returns {boolean} True if the hex code is valid
 */
function isValidHex(hex) {
  if (!hex || typeof hex !== 'string') {
    return false;
  }

  // Match #RRGGBB (with hash) — exactly 6 hex digits after the hash
  var hexPattern = /^#[0-9A-Fa-f]{6}$/;
  return hexPattern.test(hex);
}


// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a hex color string by ensuring it has the # prefix.
 * - If input is "#RRGGBB", returns as-is.
 * - If input is "RRGGBB", prepends "#".
 * - Other formats are returned with # prepended for validation to catch.
 *
 * @param {string} hex - Raw hex color string
 * @returns {string} Normalized hex string with # prefix
 */
function _normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') {
    return '';
  }

  var trimmed = hex.trim();

  // Already has # prefix
  if (trimmed.charAt(0) === '#') {
    return trimmed.toUpperCase();
  }

  // No # prefix — add it
  return '#' + trimmed.toUpperCase();
}
