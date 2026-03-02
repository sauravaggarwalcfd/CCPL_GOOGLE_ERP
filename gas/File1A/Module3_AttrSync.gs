/**
 * =============================================================================
 * MODULE 3 — ATTRIBUTE SYSTEM TWO-WAY SYNC
 * =============================================================================
 *
 * Handles 4-direction attribute sync between MASTER, ATTR_NAMES, and
 * ATTR_VALUES sheets. The pattern is identical for TRIM, CONSUMABLE,
 * and PACKAGING.
 *
 * Three sheets work together per system:
 *   [X]_MASTER      — Item master with attr pair columns
 *                      (Attr N Name, Attr N Value for N = 1..6)
 *   [X]_ATTR_NAMES  — Which attribute names apply to each category
 *   [X]_ATTR_VALUES — What values are allowed per attribute per category
 *
 * Four-Direction Sync:
 *   1. ATTR_NAMES  -> MASTER       Auto-fill attr name cols on category select
 *   2. MASTER      -> ATTR_NAMES   New attr name typed -> prompt to add
 *   3. ATTR_VALUES -> MASTER       Dropdown values on attr value cell edit
 *   4. MASTER      -> ATTR_VALUES  New value typed -> prompt to add
 *
 * Special Rule — Color(REF NAME):
 *   When an attribute name is "Color(REF NAME)", GAS ignores ATTR_VALUES
 *   and loads COLOR_MASTER color names as the dropdown instead.
 *   Applies to: THD, ELS, ZIP, BUT, THP (any category where the attr is set).
 *
 * Sheet: TRIM_MASTER       -> TRIM_ATTR_NAMES  / TRIM_ATTR_VALUES
 * Sheet: CONSUMABLE_MASTER -> CON_ATTR_NAMES   / CON_ATTR_VALUES
 * Sheet: PACKAGING_MASTER  -> PKG_ATTR_NAMES   / PKG_ATTR_VALUES
 *
 * Row Structure: Row 1=banner, Row 2=headers, Row 3=descriptions, Row 4+=data
 *
 * TRIM_MASTER Attr Layout (cols 17-28):
 *   Col 17: Attr 1 Name  |  Col 18: Attr 1 Value
 *   Col 19: Attr 2 Name  |  Col 20: Attr 2 Value
 *   Col 21: Attr 3 Name  |  Col 22: Attr 3 Value
 *   Col 23: Attr 4 Name  |  Col 24: Attr 4 Value
 *   Col 25: Attr 5 Name  |  Col 26: Attr 5 Value
 *   Col 27: Attr 6 Name  |  Col 28: Attr 6 Value
 * =============================================================================
 */


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The special attr name that triggers COLOR_MASTER lookup instead of ATTR_VALUES */
var COLOR_REF_ATTR_NAME = 'Color(REF NAME)';

/**
 * Maximum number of attribute pairs per master (6 pairs = cols 17-28).
 * Each pair occupies two columns: Name (odd index) and Value (even index).
 */
var MAX_ATTR_PAIRS = 6;

/**
 * Attribute column layout per master sheet.
 * firstNameCol: 1-based column number of the first Attr Name column.
 * Each subsequent pair is +2 from the previous.
 * categoryCol: 1-based column where the L2 Category code lives.
 *
 * V9 update: L1 Division inserted at col D (col 4) for all three masters.
 * - TRIM_MASTER:       30 cols; L2 Category at col 5; Attr 1 Name at col 18
 * - CONSUMABLE_MASTER: 23 cols; L2 Category at col 5; Attr 1 Name at col 15
 * - PACKAGING_MASTER:  23 cols; L2 Category at col 5; Attr 1 Name at col 15
 */
var ATTR_COLUMN_MAP = {
  TRIM_MASTER: {
    firstNameCol: 18, // V9: shifted +1 (was 17); Attr cols now 18,19,20,21,22,23,24,25,26,27,28,29
    categoryCol:  5   // V9: L1 Division at col 4; L2 Category shifted to col 5
  },
  CONSUMABLE_MASTER: {
    firstNameCol: 15, // V9: 23-col layout; Status at col 14; Attr 1 Name at col 15
    categoryCol:  5   // V9: L1 Division at col 4; L2 Category shifted to col 5
  },
  PACKAGING_MASTER: {
    firstNameCol: 15, // V9: 23-col layout; Status at col 14; Attr 1 Name at col 15
    categoryCol:  5   // V9: L1 Division at col 4; L2 Category shifted to col 5
  }
};

/**
 * ATTR_NAMES sheet structure (per row, data starts row 4):
 *   Col 1: Category Code (e.g. THD, LBL)
 *   Col 2: Attr Slot (1, 2, 3, etc.)
 *   Col 3: Attr Name (e.g. "Type", "Denier", "Color(REF NAME)")
 *
 * ATTR_VALUES sheet structure (per row, data starts row 4):
 *   Col 1: Category Code
 *   Col 2: Attr Name
 *   Col 3: Allowed Value
 */
var ATTR_NAMES_COL = {
  CATEGORY:  1,
  SLOT:      2,
  ATTR_NAME: 3
};

var ATTR_VALUES_COL = {
  CATEGORY:  1,
  ATTR_NAME: 2,
  VALUE:     3
};

/**
 * COLOR_MASTER layout:
 *   Col 1: Color Code
 *   Col 2: Color Name / Shade Name
 * We read Col 2 for dropdown values.
 */
var COLOR_MASTER_NAME_COL = 2;


// ---------------------------------------------------------------------------
// Sheet Name Mapping
// ---------------------------------------------------------------------------

/**
 * Gets the right ATTR_NAMES and ATTR_VALUES sheet names for a given master.
 *
 * Mapping:
 *   TRIM_MASTER       -> TRIM_ATTR_NAMES,  TRIM_ATTR_VALUES
 *   CONSUMABLE_MASTER -> CON_ATTR_NAMES,   CON_ATTR_VALUES
 *   PACKAGING_MASTER  -> PKG_ATTR_NAMES,   PKG_ATTR_VALUES
 *
 * @param  {string} masterSheetName - Name of the master sheet
 * @return {Object|null} Object with { attrNamesSheet, attrValuesSheet, systemKey }
 *         or null if the master is not part of the attribute system.
 */
function getAttrSheetNames(masterSheetName) {
  var mapping = {
    TRIM_MASTER: {
      attrNamesSheet:  CONFIG.SHEETS.TRIM_ATTR_NAMES,
      attrValuesSheet: CONFIG.SHEETS.TRIM_ATTR_VALUES,
      systemKey:       'TRIM'
    },
    CONSUMABLE_MASTER: {
      attrNamesSheet:  CONFIG.SHEETS.CON_ATTR_NAMES,
      attrValuesSheet: CONFIG.SHEETS.CON_ATTR_VALUES,
      systemKey:       'CONSUMABLE'
    },
    PACKAGING_MASTER: {
      attrNamesSheet:  CONFIG.SHEETS.PKG_ATTR_NAMES,
      attrValuesSheet: CONFIG.SHEETS.PKG_ATTR_VALUES,
      systemKey:       'PACKAGING'
    }
  };

  return mapping[masterSheetName] || null;
}


// ---------------------------------------------------------------------------
// Direction 1: ATTR_NAMES -> MASTER
// ---------------------------------------------------------------------------

/**
 * Direction 1: Auto-fills attr name columns when category changes.
 *
 * Reads ATTR_NAMES for the given category, writes the attribute names into
 * the Name columns for the given master (e.g. TRIM: 18,20,22,24,26,28;
 * CONSUMABLE/PACKAGING: 15,17,19,21) and clears the corresponding Value columns.
 *
 * Unused attr slots (beyond the category's count) are also cleared.
 *
 * After writing names, sets data validation dropdowns on value cells
 * for each attribute (Direction 3 piggybacks here for efficiency).
 *
 * @param {string} sheetName - Name of the master sheet (e.g. 'TRIM_MASTER')
 * @param {number} row       - Data row number (4+) where category was changed
 * @param {string} category  - Category code (e.g. 'THD', 'LBL')
 */
function autoFillAttrNames(sheetName, row, category) {
  try {
    if (!sheetName || !category || row < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = ss.getSheetByName(sheetName);
    if (!masterSheet) {
      Logger.log('Module3 :: autoFillAttrNames - Master sheet "' + sheetName + '" not found.');
      return;
    }

    // Resolve attr sheet names
    var attrSheets = getAttrSheetNames(sheetName);
    if (!attrSheets) {
      Logger.log('Module3 :: autoFillAttrNames - No attr system for sheet "' + sheetName + '".');
      return;
    }

    // Get the ATTR_NAMES sheet
    var attrNamesSheet = ss.getSheetByName(attrSheets.attrNamesSheet);
    if (!attrNamesSheet) {
      Logger.log('Module3 :: autoFillAttrNames - ATTR_NAMES sheet "' + attrSheets.attrNamesSheet + '" not found.');
      return;
    }

    // Read attr names for this category (ordered by slot)
    var attrNames = getAttrNamesForCategory(attrNamesSheet, category);

    // Get column layout for this master
    var colLayout = ATTR_COLUMN_MAP[sheetName];
    if (!colLayout) {
      Logger.log('Module3 :: autoFillAttrNames - No column layout defined for "' + sheetName + '".');
      return;
    }

    var firstNameCol = colLayout.firstNameCol;

    // Write attr names into Name columns and clear Value columns
    for (var i = 0; i < MAX_ATTR_PAIRS; i++) {
      var nameCol = firstNameCol + (i * 2);       // 17, 19, 21, 23, 25, 27
      var valueCol = firstNameCol + (i * 2) + 1;  // 18, 20, 22, 24, 26, 28

      if (i < attrNames.length && attrNames[i]) {
        // Write the attr name
        masterSheet.getRange(row, nameCol).setValue(attrNames[i]);
      } else {
        // Clear unused attr name slot
        masterSheet.getRange(row, nameCol).clearContent();
      }

      // Always clear the value column when category changes
      var valueRange = masterSheet.getRange(row, valueCol);
      valueRange.clearContent();
      valueRange.clearDataValidations();

      // Set dropdown validation on value cell if attr name exists
      if (i < attrNames.length && attrNames[i]) {
        var dropdownValues = getAttrValueDropdown(sheetName, category, attrNames[i]);
        if (dropdownValues && dropdownValues.length > 0) {
          setAttrValueValidation(masterSheet, row, valueCol, dropdownValues);
        }
      }
    }

    // Protect attr name cells from casual editing (visual cue only, not hard lock)
    // Name columns get a light grey background to signal they are auto-filled
    for (var j = 0; j < MAX_ATTR_PAIRS; j++) {
      var nc = firstNameCol + (j * 2);
      if (j < attrNames.length && attrNames[j]) {
        masterSheet.getRange(row, nc).setBackground('#F0F0F0');
      } else {
        masterSheet.getRange(row, nc).setBackground(null);
      }
    }

  } catch (err) {
    Logger.log('Module3 :: autoFillAttrNames - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// Direction 2: MASTER -> ATTR_NAMES
// ---------------------------------------------------------------------------

/**
 * Direction 2: Syncs a new attr name back to the ATTR_NAMES sheet.
 *
 * If a user manually types an attr name into a Name column that does not
 * exist in ATTR_NAMES for that category, this function prompts the user
 * to confirm adding it.
 *
 * @param {string} sheetName - Name of the master sheet
 * @param {string} category  - Category code
 * @param {string} attrName  - The new attribute name typed by the user
 */
function syncNewAttrName(sheetName, category, attrName) {
  try {
    if (!sheetName || !category || !attrName) {
      return;
    }

    var attrSheets = getAttrSheetNames(sheetName);
    if (!attrSheets) {
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var attrNamesSheet = ss.getSheetByName(attrSheets.attrNamesSheet);
    if (!attrNamesSheet) {
      Logger.log('Module3 :: syncNewAttrName - ATTR_NAMES sheet not found.');
      return;
    }

    // Check if this attr name already exists for this category
    var existingNames = getAttrNamesForCategory(attrNamesSheet, category);
    var trimmedNewName = attrName.trim();

    for (var i = 0; i < existingNames.length; i++) {
      if (existingNames[i].toLowerCase() === trimmedNewName.toLowerCase()) {
        // Already exists — no action needed
        return;
      }
    }

    // Prompt user to confirm adding the new attr name
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      'New Attribute Name Detected',
      'Add "' + trimmedNewName + '" to ' + category + ' attributes in ' +
        attrSheets.attrNamesSheet + '?',
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      // Determine the next available slot number for this category
      var nextSlot = existingNames.length + 1;

      // Append new row to ATTR_NAMES sheet
      var lastRow = attrNamesSheet.getLastRow();
      var targetRow = Math.max(lastRow + 1, CONFIG.ROW_STRUCTURE.DATA_START_ROW);

      attrNamesSheet.getRange(targetRow, ATTR_NAMES_COL.CATEGORY).setValue(category);
      attrNamesSheet.getRange(targetRow, ATTR_NAMES_COL.SLOT).setValue(nextSlot);
      attrNamesSheet.getRange(targetRow, ATTR_NAMES_COL.ATTR_NAME).setValue(trimmedNewName);

      // Invalidate cache for the ATTR_NAMES sheet
      _invalidateAttrCache(attrSheets.attrNamesSheet);

      SpreadsheetApp.getActiveSpreadsheet().toast(
        '"' + trimmedNewName + '" added to ' + category + ' in ' + attrSheets.attrNamesSheet,
        'Attribute Name Added',
        5
      );
    }

  } catch (err) {
    Logger.log('Module3 :: syncNewAttrName - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// Direction 3: ATTR_VALUES -> MASTER (Dropdown)
// ---------------------------------------------------------------------------

/**
 * Direction 3: Gets dropdown values for an attribute.
 *
 * If attrName is "Color(REF NAME)", returns color names from COLOR_MASTER
 * instead of reading ATTR_VALUES. This enforces a single color reference
 * across all masters.
 *
 * For all other attr names, reads the ATTR_VALUES sheet filtered by
 * category + attrName.
 *
 * @param  {string}   sheetName - Name of the master sheet
 * @param  {string}   category  - Category code (e.g. 'THD')
 * @param  {string}   attrName  - Attribute name (e.g. 'Type', 'Color(REF NAME)')
 * @return {string[]} Array of allowed values for the dropdown, or empty array
 */
function getAttrValueDropdown(sheetName, category, attrName) {
  try {
    if (!sheetName || !category || !attrName) {
      return [];
    }

    var trimmedName = attrName.trim();

    // ----- COLOR(REF NAME) SPECIAL RULE -----
    if (trimmedName === COLOR_REF_ATTR_NAME) {
      return _getColorMasterNames();
    }

    // ----- STANDARD: Read from ATTR_VALUES -----
    var attrSheets = getAttrSheetNames(sheetName);
    if (!attrSheets) {
      return [];
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var attrValuesSheet = ss.getSheetByName(attrSheets.attrValuesSheet);
    if (!attrValuesSheet) {
      Logger.log('Module3 :: getAttrValueDropdown - ATTR_VALUES sheet "' + attrSheets.attrValuesSheet + '" not found.');
      return [];
    }

    return getAttrValuesForAttr(attrValuesSheet, category, trimmedName);

  } catch (err) {
    Logger.log('Module3 :: getAttrValueDropdown - Error: ' + err.message);
    return [];
  }
}


// ---------------------------------------------------------------------------
// Direction 4: MASTER -> ATTR_VALUES
// ---------------------------------------------------------------------------

/**
 * Direction 4: Syncs a new attr value back to the ATTR_VALUES sheet.
 *
 * If a user types a value not in the allowed list, prompts to confirm
 * adding it. Skips the prompt for Color(REF NAME) since those values
 * come from COLOR_MASTER exclusively.
 *
 * @param {string} sheetName - Name of the master sheet
 * @param {string} category  - Category code
 * @param {string} attrName  - The attribute name
 * @param {string} newValue  - The new value typed by the user
 */
function syncNewAttrValue(sheetName, category, attrName, newValue) {
  try {
    if (!sheetName || !category || !attrName || !newValue) {
      return;
    }

    var trimmedName = attrName.trim();
    var trimmedValue = String(newValue).trim();

    if (!trimmedValue) {
      return;
    }

    // Color(REF NAME) values live in COLOR_MASTER — never add to ATTR_VALUES
    if (trimmedName === COLOR_REF_ATTR_NAME) {
      Logger.log('Module3 :: syncNewAttrValue - Color(REF NAME) values managed by COLOR_MASTER. Skipping.');
      return;
    }

    var attrSheets = getAttrSheetNames(sheetName);
    if (!attrSheets) {
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var attrValuesSheet = ss.getSheetByName(attrSheets.attrValuesSheet);
    if (!attrValuesSheet) {
      Logger.log('Module3 :: syncNewAttrValue - ATTR_VALUES sheet not found.');
      return;
    }

    // Check if this value already exists for this category+attr combo
    var existingValues = getAttrValuesForAttr(attrValuesSheet, category, trimmedName);

    for (var i = 0; i < existingValues.length; i++) {
      if (existingValues[i].toLowerCase() === trimmedValue.toLowerCase()) {
        // Already exists — no action needed
        return;
      }
    }

    // Prompt user to confirm adding the new value
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      'New Attribute Value Detected',
      'Add "' + trimmedValue + '" to ' + trimmedName + ' for ' + category +
        ' in ' + attrSheets.attrValuesSheet + '?',
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      // Append new row to ATTR_VALUES sheet
      var lastRow = attrValuesSheet.getLastRow();
      var targetRow = Math.max(lastRow + 1, CONFIG.ROW_STRUCTURE.DATA_START_ROW);

      attrValuesSheet.getRange(targetRow, ATTR_VALUES_COL.CATEGORY).setValue(category);
      attrValuesSheet.getRange(targetRow, ATTR_VALUES_COL.ATTR_NAME).setValue(trimmedName);
      attrValuesSheet.getRange(targetRow, ATTR_VALUES_COL.VALUE).setValue(trimmedValue);

      // Invalidate cache for the ATTR_VALUES sheet
      _invalidateAttrCache(attrSheets.attrValuesSheet);

      SpreadsheetApp.getActiveSpreadsheet().toast(
        '"' + trimmedValue + '" added to ' + trimmedName + ' (' + category + ') in ' +
          attrSheets.attrValuesSheet,
        'Attribute Value Added',
        5
      );
    }

  } catch (err) {
    Logger.log('Module3 :: syncNewAttrValue - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// ATTR_NAMES Reader
// ---------------------------------------------------------------------------

/**
 * Reads the ATTR_NAMES sheet and returns attr names for a category,
 * ordered by slot number.
 *
 * ATTR_NAMES sheet structure:
 *   Col 1: Category Code   Col 2: Slot Number   Col 3: Attr Name
 *
 * @param  {GoogleAppsScript.Spreadsheet.Sheet} attrNamesSheet - The ATTR_NAMES sheet
 * @param  {string}   category - Category code (e.g. 'THD')
 * @return {string[]} Ordered array of attribute names for the category
 */
function getAttrNamesForCategory(attrNamesSheet, category) {
  try {
    if (!attrNamesSheet || !category) {
      return [];
    }

    var lastRow = attrNamesSheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return [];
    }

    // Read all data rows at once (batch read for performance)
    var dataRange = attrNamesSheet.getRange(
      CONFIG.ROW_STRUCTURE.DATA_START_ROW,
      1,
      lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1,
      3
    );
    var data = dataRange.getValues();

    // Filter by category and collect { slot, name } pairs
    var pairs = [];
    var catUpper = category.toUpperCase().trim();

    for (var i = 0; i < data.length; i++) {
      var rowCat = String(data[i][ATTR_NAMES_COL.CATEGORY - 1]).toUpperCase().trim();
      var rowSlot = data[i][ATTR_NAMES_COL.SLOT - 1];
      var rowName = String(data[i][ATTR_NAMES_COL.ATTR_NAME - 1]).trim();

      if (rowCat === catUpper && rowName) {
        pairs.push({
          slot: parseInt(rowSlot, 10) || 0,
          name: rowName
        });
      }
    }

    // Sort by slot ascending
    pairs.sort(function(a, b) {
      return a.slot - b.slot;
    });

    // Return just the names in slot order
    var result = [];
    for (var j = 0; j < pairs.length; j++) {
      result.push(pairs[j].name);
    }

    return result;

  } catch (err) {
    Logger.log('Module3 :: getAttrNamesForCategory - Error: ' + err.message);
    return [];
  }
}


// ---------------------------------------------------------------------------
// ATTR_VALUES Reader
// ---------------------------------------------------------------------------

/**
 * Reads the ATTR_VALUES sheet and returns allowed values for a specific
 * category + attribute name combination.
 *
 * ATTR_VALUES sheet structure:
 *   Col 1: Category Code   Col 2: Attr Name   Col 3: Allowed Value
 *
 * @param  {GoogleAppsScript.Spreadsheet.Sheet} attrValuesSheet - The ATTR_VALUES sheet
 * @param  {string}   category - Category code (e.g. 'THD')
 * @param  {string}   attrName - Attribute name (e.g. 'Type')
 * @return {string[]} Array of allowed values
 */
function getAttrValuesForAttr(attrValuesSheet, category, attrName) {
  try {
    if (!attrValuesSheet || !category || !attrName) {
      return [];
    }

    var lastRow = attrValuesSheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return [];
    }

    // Read all data rows at once (batch read for performance)
    var dataRange = attrValuesSheet.getRange(
      CONFIG.ROW_STRUCTURE.DATA_START_ROW,
      1,
      lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1,
      3
    );
    var data = dataRange.getValues();

    var values = [];
    var catUpper = category.toUpperCase().trim();
    var nameUpper = attrName.toUpperCase().trim();

    for (var i = 0; i < data.length; i++) {
      var rowCat = String(data[i][ATTR_VALUES_COL.CATEGORY - 1]).toUpperCase().trim();
      var rowAttr = String(data[i][ATTR_VALUES_COL.ATTR_NAME - 1]).toUpperCase().trim();
      var rowVal = String(data[i][ATTR_VALUES_COL.VALUE - 1]).trim();

      if (rowCat === catUpper && rowAttr === nameUpper && rowVal) {
        values.push(rowVal);
      }
    }

    return values;

  } catch (err) {
    Logger.log('Module3 :: getAttrValuesForAttr - Error: ' + err.message);
    return [];
  }
}


// ---------------------------------------------------------------------------
// Data Validation
// ---------------------------------------------------------------------------

/**
 * Sets data validation dropdown on an attribute value cell.
 *
 * Creates a dropdown list from the provided values array. Allows custom
 * entries (showWarning = true instead of rejectInput) so that Direction 4
 * (syncNewAttrValue) can catch and handle new values.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet  - The master sheet
 * @param {number}   row    - Row number (1-based)
 * @param {number}   col    - Column number (1-based)
 * @param {string[]} values - Array of allowed values
 */
function setAttrValueValidation(sheet, row, col, values) {
  try {
    if (!sheet || !values || values.length === 0) {
      return;
    }

    var cell = sheet.getRange(row, col);

    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)   // true = show dropdown in cell
      .setAllowInvalid(true)              // allow custom entry (triggers Direction 4)
      .setHelpText('Select a value or type a new one. New values will be synced.')
      .build();

    cell.setDataValidation(rule);

  } catch (err) {
    Logger.log('Module3 :: setAttrValueValidation - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// onEdit Handler
// ---------------------------------------------------------------------------

/**
 * Called from the installable onEdit trigger. Detects edits in attr-enabled
 * master sheets and dispatches the appropriate sync direction.
 *
 * Detection logic:
 *   - If the edited column is the Category column -> Direction 1 (autoFillAttrNames)
 *   - If the edited column is an Attr Name column -> Direction 2 (syncNewAttrName)
 *   - If the edited column is an Attr Value column -> Direction 3 + 4
 *     (refresh dropdown + check for new value)
 *
 * @param {Object} e - The onEdit event object
 */
function handleAttrEdit(e) {
  try {
    // Guard: must have a valid event
    if (!e || !e.range) {
      return;
    }

    var range = e.range;
    var sheet = range.getSheet();
    var sheetName = sheet.getName();

    // Only process attr-enabled master sheets
    var attrSheets = getAttrSheetNames(sheetName);
    if (!attrSheets) {
      return;
    }

    var row = range.getRow();
    var col = range.getColumn();

    // Only process data rows (row 4+)
    if (row < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return;
    }

    // Only process single-cell edits for attr sync
    if (range.getNumRows() > 1 || range.getNumColumns() > 1) {
      return;
    }

    var colLayout = ATTR_COLUMN_MAP[sheetName];
    if (!colLayout) {
      return;
    }

    var categoryCol = colLayout.categoryCol;
    var firstNameCol = colLayout.firstNameCol;
    var lastValueCol = firstNameCol + (MAX_ATTR_PAIRS * 2) - 1;  // 17 + 12 - 1 = 28

    // ----- DIRECTION 1: Category column changed -----
    if (col === categoryCol) {
      var newCategory = range.getValue();
      if (newCategory && String(newCategory).trim()) {
        autoFillAttrNames(sheetName, row, String(newCategory).trim());
      }
      return;
    }

    // Check if the edited column is within the attr range (cols 17-28)
    if (col < firstNameCol || col > lastValueCol) {
      return;
    }

    // Determine if this is a Name column (odd offset) or Value column (even offset)
    var offset = col - firstNameCol;  // 0-based offset from first name col
    var isNameCol = (offset % 2 === 0);
    var isValueCol = (offset % 2 === 1);
    var pairIndex = Math.floor(offset / 2);  // 0-based attr pair index

    // Read the category from the same row
    var category = String(sheet.getRange(row, categoryCol).getValue()).trim();
    if (!category) {
      return;
    }

    // ----- DIRECTION 2: Attr Name column changed -----
    if (isNameCol) {
      var newAttrName = range.getValue();
      if (newAttrName && String(newAttrName).trim()) {
        var trimmedAttrName = String(newAttrName).trim();

        // Sync new name to ATTR_NAMES if it does not exist
        syncNewAttrName(sheetName, category, trimmedAttrName);

        // Also refresh the adjacent value column dropdown
        var adjValueCol = col + 1;
        var dropdownValues = getAttrValueDropdown(sheetName, category, trimmedAttrName);
        if (dropdownValues && dropdownValues.length > 0) {
          setAttrValueValidation(sheet, row, adjValueCol, dropdownValues);
        } else {
          // Clear stale validation if no values available
          sheet.getRange(row, adjValueCol).clearDataValidations();
        }
      }
      return;
    }

    // ----- DIRECTION 3 + 4: Attr Value column changed -----
    if (isValueCol) {
      // Read the attr name from the adjacent Name column (col - 1)
      var attrNameCol = col - 1;
      var attrName = String(sheet.getRange(row, attrNameCol).getValue()).trim();
      if (!attrName) {
        return;
      }

      var newValue = range.getValue();

      // Direction 3: Refresh/set the dropdown for this value cell
      var allowedValues = getAttrValueDropdown(sheetName, category, attrName);
      if (allowedValues && allowedValues.length > 0) {
        setAttrValueValidation(sheet, row, col, allowedValues);
      }

      // Direction 4: If the typed value is new, prompt to add it
      if (newValue && String(newValue).trim()) {
        syncNewAttrValue(sheetName, category, attrName, String(newValue).trim());
      }

      return;
    }

  } catch (err) {
    Logger.log('Module3 :: handleAttrEdit - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Reads all color names from COLOR_MASTER for the Color(REF NAME) dropdown.
 *
 * COLOR_MASTER structure:
 *   Col 1: Color Code
 *   Col 2: Color Name / Shade Name
 * Data starts at row 4.
 *
 * @return {string[]} Array of color names from COLOR_MASTER
 * @private
 */
function _getColorMasterNames() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var colorSheet = ss.getSheetByName(CONFIG.SHEETS.COLOR_MASTER);
    if (!colorSheet) {
      Logger.log('Module3 :: _getColorMasterNames - COLOR_MASTER sheet not found.');
      return [];
    }

    var lastRow = colorSheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return [];
    }

    // Read color name column (col 2) from data rows
    var dataRange = colorSheet.getRange(
      CONFIG.ROW_STRUCTURE.DATA_START_ROW,
      COLOR_MASTER_NAME_COL,
      lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1,
      1
    );
    var data = dataRange.getValues();

    var colorNames = [];
    for (var i = 0; i < data.length; i++) {
      var name = String(data[i][0]).trim();
      if (name) {
        colorNames.push(name);
      }
    }

    return colorNames;

  } catch (err) {
    Logger.log('Module3 :: _getColorMasterNames - Error: ' + err.message);
    return [];
  }
}


/**
 * Invalidates the CacheService entry for a given sheet name.
 * Uses the CONFIG.CACHE.KEYS mapping to find the right cache key.
 *
 * @param {string} sheetName - The sheet whose cache should be cleared
 * @private
 */
function _invalidateAttrCache(sheetName) {
  try {
    // Map sheet name to cache key
    var cacheKeyMap = {};
    var keys = CONFIG.CACHE.KEYS;
    var sheets = CONFIG.SHEETS;

    // Build reverse lookup: sheet name -> cache key
    for (var prop in sheets) {
      if (sheets.hasOwnProperty(prop) && keys.hasOwnProperty(prop)) {
        cacheKeyMap[sheets[prop]] = keys[prop];
      }
    }

    var cacheKey = cacheKeyMap[sheetName];
    if (cacheKey) {
      var cache = CacheService.getScriptCache();
      cache.remove(cacheKey);
      Logger.log('Module3 :: _invalidateAttrCache - Cleared cache key: ' + cacheKey);
    }

  } catch (err) {
    Logger.log('Module3 :: _invalidateAttrCache - Error: ' + err.message);
  }
}


/**
 * Utility: Checks if a column number falls within the attr range for a master sheet.
 *
 * @param  {string}  sheetName - Master sheet name
 * @param  {number}  col       - 1-based column number
 * @return {boolean} True if the column is an attr name or value column
 */
function _isAttrColumn(sheetName, col) {
  var colLayout = ATTR_COLUMN_MAP[sheetName];
  if (!colLayout) {
    return false;
  }
  var firstNameCol = colLayout.firstNameCol;
  var lastValueCol = firstNameCol + (MAX_ATTR_PAIRS * 2) - 1;
  return col >= firstNameCol && col <= lastValueCol;
}


/**
 * Utility: For a given master sheet and column, returns the attr pair index (0-based)
 * and whether it is a name or value column.
 *
 * @param  {string} sheetName - Master sheet name
 * @param  {number} col       - 1-based column number
 * @return {Object|null} { pairIndex: number, isName: boolean, isValue: boolean }
 *         or null if col is not in attr range
 */
function _getAttrColumnInfo(sheetName, col) {
  var colLayout = ATTR_COLUMN_MAP[sheetName];
  if (!colLayout) {
    return null;
  }

  var firstNameCol = colLayout.firstNameCol;
  var lastValueCol = firstNameCol + (MAX_ATTR_PAIRS * 2) - 1;

  if (col < firstNameCol || col > lastValueCol) {
    return null;
  }

  var offset = col - firstNameCol;
  return {
    pairIndex: Math.floor(offset / 2),
    isName: (offset % 2 === 0),
    isValue: (offset % 2 === 1)
  };
}


/**
 * Refreshes data validation dropdowns for all attr value cells in a given row.
 *
 * Called when validation might be stale (e.g. after ATTR_VALUES sheet update).
 * Reads the current attr names from the row and sets fresh dropdowns.
 *
 * @param {string} sheetName - Master sheet name
 * @param {number} row       - Data row number (4+)
 */
function refreshAttrDropdownsForRow(sheetName, row) {
  try {
    if (!sheetName || row < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = ss.getSheetByName(sheetName);
    if (!masterSheet) {
      return;
    }

    var colLayout = ATTR_COLUMN_MAP[sheetName];
    if (!colLayout) {
      return;
    }

    // Read category from the row
    var category = String(masterSheet.getRange(row, colLayout.categoryCol).getValue()).trim();
    if (!category) {
      return;
    }

    var firstNameCol = colLayout.firstNameCol;

    for (var i = 0; i < MAX_ATTR_PAIRS; i++) {
      var nameCol = firstNameCol + (i * 2);
      var valueCol = firstNameCol + (i * 2) + 1;

      var attrName = String(masterSheet.getRange(row, nameCol).getValue()).trim();
      if (attrName) {
        var values = getAttrValueDropdown(sheetName, category, attrName);
        if (values && values.length > 0) {
          setAttrValueValidation(masterSheet, row, valueCol, values);
        } else {
          masterSheet.getRange(row, valueCol).clearDataValidations();
        }
      } else {
        // No attr name — clear any stale validation
        masterSheet.getRange(row, valueCol).clearDataValidations();
      }
    }

  } catch (err) {
    Logger.log('Module3 :: refreshAttrDropdownsForRow - Error: ' + err.message);
  }
}
