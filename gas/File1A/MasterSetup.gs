/**
 * ============================================================
 * CONFIDENCE CLOTHING — ERP MASTER SETUP
 * ============================================================
 * One-click setup for ALL 4 Google Sheet files:
 *   FILE 1A: Items Master      (22 sheets)
 *   FILE 1B: Factory Master    (23 sheets)
 *   FILE 1C: Finance Master    (6 sheets)
 *   FILE 2:  Procurement Master (5 sheets)
 *
 * Deletes ALL old sheets, then creates fresh sheets with
 * headers, descriptions, formatting, data validation, and
 * pre-populated reference data.
 * ============================================================
 */

/* ───────────────────────────────────────────────────────────
   MASTER SETUP — Run this to set up ALL 4 files at once
   ─────────────────────────────────────────────────────────── */
function masterSetupAll() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '⚙ MASTER SETUP — All 4 Files',
    'This will DELETE all existing sheets and create fresh sheets in:\n\n' +
    '• FILE 1A (Items Master) — 22 sheets\n' +
    '• FILE 1B (Factory Master) — 23 sheets\n' +
    '• FILE 1C (Finance Master) — 6 sheets\n' +
    '• FILE 2  (Procurement Master) — 5 sheets\n\n' +
    '⚠ ALL existing data will be lost!\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );
  if (result !== ui.Button.YES) return;

  var startTime = new Date();
  Logger.log('=== MASTER SETUP START: ' + startTime.toISOString() + ' ===');

  // Setup FILE 1C first (Finance — referenced by 1A, 1B, and F2)
  try {
    Logger.log('--- Setting up FILE 1C (Finance Master) ---');
    var ss1C = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_1C);
    deleteAllOldSheets_(ss1C);
    setupAllSheets_1C(ss1C);
    SpreadsheetApp.flush();
    Logger.log('FILE 1C setup complete.');
  } catch (err) {
    Logger.log('ERROR setting up FILE 1C: ' + err.message);
    ui.alert('Error setting up FILE 1C: ' + err.message);
    return;
  }

  // Setup FILE 1B next (Factory — references 1C)
  try {
    Logger.log('--- Setting up FILE 1B (Factory Master) ---');
    var ss1B = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_1B);
    deleteAllOldSheets_(ss1B);
    setupAllSheets_1B(ss1B);
    SpreadsheetApp.flush();
    Logger.log('FILE 1B setup complete.');
  } catch (err) {
    Logger.log('ERROR setting up FILE 1B: ' + err.message);
    ui.alert('Error setting up FILE 1B: ' + err.message);
    return;
  }

  // Setup FILE 1A (Items — references 1B and 1C)
  try {
    Logger.log('--- Setting up FILE 1A (Items Master) ---');
    var ss1A = SpreadsheetApp.getActiveSpreadsheet();
    deleteAllOldSheets_(ss1A);
    setupAllSheets();
    SpreadsheetApp.flush();
    Logger.log('FILE 1A setup complete.');
  } catch (err) {
    Logger.log('ERROR setting up FILE 1A: ' + err.message);
    ui.alert('Error setting up FILE 1A: ' + err.message);
    return;
  }

  // Setup FILE 2 last (Procurement — references 1B and 1C)
  try {
    Logger.log('--- Setting up FILE 2 (Procurement Master) ---');
    var ss2 = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_2);
    deleteAllOldSheets_(ss2);
    setupAllSheets_F2(ss2);
    SpreadsheetApp.flush();
    Logger.log('FILE 2 setup complete.');
  } catch (err) {
    Logger.log('ERROR setting up FILE 2: ' + err.message);
    ui.alert('Error setting up FILE 2: ' + err.message);
    return;
  }

  var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  var msg = 'MASTER SETUP COMPLETE!\n\n' +
    '• FILE 1A: 22 sheets created\n' +
    '• FILE 1B: 23 sheets created\n' +
    '• FILE 1C: 6 sheets created\n' +
    '• FILE 2:  5 sheets created\n\n' +
    'Total: 56 sheets in ' + elapsed + ' seconds.';
  Logger.log(msg);
  ui.alert(msg);
}

/* ───────────────────────────────────────────────────────────
   Setup individual files (can be run standalone too)
   ─────────────────────────────────────────────────────────── */
function setupFile1A_Only() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  deleteAllOldSheets_(ss);
  setupAllSheets();
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('FILE 1A setup complete — 22 sheets created.');
}

function setupFile1B_Only() {
  var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_1B);
  deleteAllOldSheets_(ss);
  setupAllSheets_1B(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('FILE 1B setup complete — 23 sheets created.');
}

function setupFile1C_Only() {
  var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_1C);
  deleteAllOldSheets_(ss);
  setupAllSheets_1C(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('FILE 1C setup complete — 6 sheets created.');
}

function setupFile2_Only() {
  var ss = SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_2);
  deleteAllOldSheets_(ss);
  setupAllSheets_F2(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('FILE 2 setup complete — 5 sheets created.');
}

/* ───────────────────────────────────────────────────────────
   DELETE ALL OLD SHEETS
   Removes every sheet except one (Google Sheets requires at
   least one sheet). Creates a temp sheet, deletes all others,
   then the temp is deleted after new sheets are created.
   ─────────────────────────────────────────────────────────── */
function deleteAllOldSheets_(ss) {
  var sheets = ss.getSheets();
  if (sheets.length === 0) return;

  // Create a temp sheet so we always have at least one
  var tempSheet = ss.insertSheet('_TEMP_SETUP_');

  // Delete all original sheets
  for (var i = 0; i < sheets.length; i++) {
    try {
      ss.deleteSheet(sheets[i]);
    } catch (err) {
      Logger.log('Could not delete sheet "' + sheets[i].getName() + '": ' + err.message);
    }
  }

  Logger.log('All old sheets deleted from: ' + ss.getName());
  // Note: _TEMP_SETUP_ will be deleted after all new sheets are created
}

/* ───────────────────────────────────────────────────────────
   CLEANUP TEMP SHEET — call after all sheets are created
   ─────────────────────────────────────────────────────────── */
function deleteTempSheet_(ss) {
  var tempSheet = ss.getSheetByName('_TEMP_SETUP_');
  if (tempSheet) {
    try {
      ss.deleteSheet(tempSheet);
    } catch (err) {
      Logger.log('Could not delete temp sheet: ' + err.message);
    }
  }
}

/* ───────────────────────────────────────────────────────────
   HELPER: Apply standard formatting to a sheet (cross-file)
   Same as applyStandardFormat_ but works on any spreadsheet.
   ─────────────────────────────────────────────────────────── */
function applyFormat_(sheet, bannerText, headers, descriptions, tabColor) {
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

  // Set column widths
  for (var i = 1; i <= numCols; i++) {
    sheet.setColumnWidth(i, 140);
  }
}

/* ───────────────────────────────────────────────────────────
   HELPER: Set dropdown validation on a column (cross-file)
   ─────────────────────────────────────────────────────────── */
function setValidation_(sheet, col, values, startRow) {
  startRow = startRow || 4;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, col, 500, 1).setDataValidation(rule);
}
