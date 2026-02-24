/**
 * ============================================================================
 * MODULE 14 — PROCUREMENT API
 * ============================================================================
 * Server-side API for the Procurement web app (PO & GRN management).
 * All functions are called from the client via google.script.run.
 *
 * FILE 2 sheets: PO_MASTER, PO_LINE_ITEMS, GRN_MASTER, GRN_LINE_ITEMS
 * ============================================================================
 */

var F2_DATA_START = 4; // Row 4+ is data
var F2_HEADER_ROW = 2;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function _getF2Spreadsheet() {
  return SpreadsheetApp.openById(CONFIG.FILE_IDS.FILE_2);
}

function _getF2Sheet(sheetName) {
  return _getF2Spreadsheet().getSheetByName(sheetName);
}

function _readF2SheetAsObjects(sheetName) {
  var sheet = _getF2Sheet(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < F2_DATA_START || lastCol < 1) return [];

  var headers = sheet.getRange(F2_HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(F2_DATA_START, 1, lastRow - F2_DATA_START + 1, lastCol).getValues();

  var result = [];
  for (var r = 0; r < data.length; r++) {
    var row = data[r];
    // Skip empty rows
    if (!row[0] && !row[1]) continue;

    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c]).trim();
      if (h) obj[h] = row[c];
    }
    result.push(obj);
  }
  return result;
}

function _writeF2Row(sheetName, rowIndex, headerMap) {
  var sheet = _getF2Sheet(sheetName);
  if (!sheet) return;

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(F2_HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var rowData = [];

  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    rowData.push(headerMap.hasOwnProperty(h) ? headerMap[h] : '');
  }

  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
}


// ---------------------------------------------------------------------------
// PO LIST & DETAIL
// ---------------------------------------------------------------------------

/**
 * Returns all POs for the list view.
 * @returns {Object[]} Array of PO summary objects
 */
function getPOList() {
  return _readF2SheetAsObjects('PO_MASTER');
}

/**
 * Returns a single PO with its line items.
 * @param {string} poCode - The PO code (e.g. PO-2026-0001)
 * @returns {Object} { po: {}, lines: [] }
 */
function getPODetail(poCode) {
  var poList = _readF2SheetAsObjects('PO_MASTER');
  var po = null;
  for (var i = 0; i < poList.length; i++) {
    var code = String(poList[i]['# PO Number'] || '').trim();
    if (code === poCode) {
      po = poList[i];
      break;
    }
  }

  var allLines = _readF2SheetAsObjects('PO_LINE_ITEMS');
  var lines = [];
  for (var j = 0; j < allLines.length; j++) {
    var linePoCode = String(allLines[j]['\u2192 PO Number'] || '').trim();
    if (linePoCode === poCode) {
      lines.push(allLines[j]);
    }
  }

  return { po: po, lines: lines };
}


// ---------------------------------------------------------------------------
// PO SAVE
// ---------------------------------------------------------------------------

/**
 * Saves a PO (create or update) with its line items.
 * @param {Object} poData - PO header fields
 * @param {Object[]} lineItems - Array of line item objects
 * @returns {Object} { success, poCode, message }
 */
function savePO(poData, lineItems) {
  try {
    var ss = _getF2Spreadsheet();
    var poSheet = ss.getSheetByName('PO_MASTER');
    var lineSheet = ss.getSheetByName('PO_LINE_ITEMS');
    if (!poSheet || !lineSheet) {
      return { success: false, poCode: '', message: 'PO sheets not found in FILE 2.' };
    }

    var isNew = !poData.poCode || poData.poCode === '';
    var poCode = poData.poCode;
    var poLastCol = poSheet.getLastColumn();
    var poHeaders = poSheet.getRange(F2_HEADER_ROW, 1, 1, poLastCol).getValues()[0];

    if (isNew) {
      // Generate new PO code
      var year = new Date().getFullYear().toString();
      var prefix = 'PO-' + year + '-';
      var nextSeq = getNextSequence(poSheet, prefix);
      poCode = prefix + formatSequence(nextSeq, 4);

      // Build new row
      var poRow = _buildRowFromHeaders(poHeaders, poData, poCode);
      var targetRow = Math.max(poSheet.getLastRow() + 1, F2_DATA_START);
      poSheet.getRange(targetRow, 1, 1, poRow.length).setValues([poRow]);
    } else {
      // Update existing PO
      var poRowIdx = _findRowByCode(poSheet, poCode);
      if (poRowIdx === -1) {
        return { success: false, poCode: poCode, message: 'PO ' + poCode + ' not found.' };
      }
      var updateRow = _buildRowFromHeaders(poHeaders, poData, poCode);
      poSheet.getRange(poRowIdx, 1, 1, updateRow.length).setValues([updateRow]);
    }

    // Save line items
    if (lineItems && lineItems.length > 0) {
      var lineLastCol = lineSheet.getLastColumn();
      var lineHeaders = lineSheet.getRange(F2_HEADER_ROW, 1, 1, lineLastCol).getValues()[0];

      // Delete existing lines for this PO
      _deleteLinesByPOCode(lineSheet, lineHeaders, poCode);

      // Append new lines
      var lineStartRow = Math.max(lineSheet.getLastRow() + 1, F2_DATA_START);
      for (var i = 0; i < lineItems.length; i++) {
        var line = lineItems[i];
        // Generate line code if missing
        var lineCode = line.lineCode || '';
        if (!lineCode) {
          var lineNextSeq = getNextSequence(lineSheet, 'POL-');
          lineCode = 'POL-' + formatSequence(lineNextSeq, 5);
        }

        // Set the PO Number reference
        line['\u2192 PO Number'] = poCode;

        var lineRow = _buildRowFromHeaders(lineHeaders, line, lineCode);
        lineSheet.getRange(lineStartRow + i, 1, 1, lineRow.length).setValues([lineRow]);
      }
    }

    return { success: true, poCode: poCode, message: isNew ? 'PO ' + poCode + ' created.' : 'PO ' + poCode + ' updated.' };

  } catch (err) {
    Logger.log('ProcurementAPI :: savePO error: ' + err.message);
    return { success: false, poCode: '', message: 'Error saving PO: ' + err.message };
  }
}


/**
 * Submits a PO for approval (changes status from Draft to Submitted).
 * @param {string} poCode
 * @returns {Object} { success, message }
 */
function submitPO(poCode) {
  return _updatePOStatus(poCode, 'Submitted');
}


/**
 * Approves a PO (changes status from Submitted/Under Review to Approved).
 * @param {string} poCode
 * @returns {Object} { success, message }
 */
function approvePO(poCode) {
  return _updatePOStatus(poCode, 'Approved');
}


/**
 * Cancels a PO.
 * @param {string} poCode
 * @returns {Object} { success, message }
 */
function cancelPO(poCode) {
  return _updatePOStatus(poCode, 'Cancelled');
}


function _updatePOStatus(poCode, newStatus) {
  try {
    var sheet = _getF2Sheet('PO_MASTER');
    if (!sheet) return { success: false, message: 'PO_MASTER not found.' };

    var rowIdx = _findRowByCode(sheet, poCode);
    if (rowIdx === -1) return { success: false, message: 'PO ' + poCode + ' not found.' };

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(F2_HEADER_ROW, 1, 1, lastCol).getValues()[0];

    // Find Status column
    var statusCol = -1;
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'Status') {
        statusCol = i + 1;
        break;
      }
    }
    if (statusCol === -1) return { success: false, message: 'Status column not found.' };

    sheet.getRange(rowIdx, statusCol).setValue(newStatus);

    // If approved, set approval date
    if (newStatus === 'Approved') {
      for (var j = 0; j < headers.length; j++) {
        if (String(headers[j]).trim() === 'Approved Date') {
          sheet.getRange(rowIdx, j + 1).setValue(new Date());
          break;
        }
      }
    }

    return { success: true, message: 'PO ' + poCode + ' status changed to ' + newStatus + '.' };

  } catch (err) {
    Logger.log('ProcurementAPI :: _updatePOStatus error: ' + err.message);
    return { success: false, message: 'Error: ' + err.message };
  }
}


// ---------------------------------------------------------------------------
// GRN LIST & DETAIL
// ---------------------------------------------------------------------------

function getGRNList() {
  return _readF2SheetAsObjects('GRN_MASTER');
}

function getGRNDetail(grnCode) {
  var grnList = _readF2SheetAsObjects('GRN_MASTER');
  var grn = null;
  for (var i = 0; i < grnList.length; i++) {
    var code = String(grnList[i]['# GRN Number'] || '').trim();
    if (code === grnCode) {
      grn = grnList[i];
      break;
    }
  }

  var allLines = _readF2SheetAsObjects('GRN_LINE_ITEMS');
  var lines = [];
  for (var j = 0; j < allLines.length; j++) {
    var lineGrnCode = String(allLines[j]['\u2192 GRN Number'] || '').trim();
    if (lineGrnCode === grnCode) {
      lines.push(allLines[j]);
    }
  }

  return { grn: grn, lines: lines };
}


// ---------------------------------------------------------------------------
// GRN SAVE
// ---------------------------------------------------------------------------

/**
 * Saves a GRN with its line items, and syncs PO status.
 * @param {Object} grnData - GRN header fields
 * @param {Object[]} lineItems - GRN line items
 * @returns {Object} { success, grnCode, message }
 */
function saveGRN(grnData, lineItems) {
  try {
    var ss = _getF2Spreadsheet();
    var grnSheet = ss.getSheetByName('GRN_MASTER');
    var lineSheet = ss.getSheetByName('GRN_LINE_ITEMS');
    if (!grnSheet || !lineSheet) {
      return { success: false, grnCode: '', message: 'GRN sheets not found in FILE 2.' };
    }

    var isNew = !grnData.grnCode || grnData.grnCode === '';
    var grnCode = grnData.grnCode;
    var grnLastCol = grnSheet.getLastColumn();
    var grnHeaders = grnSheet.getRange(F2_HEADER_ROW, 1, 1, grnLastCol).getValues()[0];

    if (isNew) {
      var year = new Date().getFullYear().toString();
      var prefix = 'GRN-' + year + '-';
      var nextSeq = getNextSequence(grnSheet, prefix);
      grnCode = prefix + formatSequence(nextSeq, 4);

      var grnRow = _buildRowFromHeaders(grnHeaders, grnData, grnCode);
      var targetRow = Math.max(grnSheet.getLastRow() + 1, F2_DATA_START);
      grnSheet.getRange(targetRow, 1, 1, grnRow.length).setValues([grnRow]);
    } else {
      var grnRowIdx = _findRowByCode(grnSheet, grnCode);
      if (grnRowIdx === -1) {
        return { success: false, grnCode: grnCode, message: 'GRN ' + grnCode + ' not found.' };
      }
      var updateRow = _buildRowFromHeaders(grnHeaders, grnData, grnCode);
      grnSheet.getRange(grnRowIdx, 1, 1, updateRow.length).setValues([updateRow]);
    }

    // Save line items
    if (lineItems && lineItems.length > 0) {
      var lineLastCol = lineSheet.getLastColumn();
      var lineHeaders = lineSheet.getRange(F2_HEADER_ROW, 1, 1, lineLastCol).getValues()[0];

      // Delete existing lines for this GRN
      _deleteLinesByGRNCode(lineSheet, lineHeaders, grnCode);

      var lineStartRow = Math.max(lineSheet.getLastRow() + 1, F2_DATA_START);
      for (var i = 0; i < lineItems.length; i++) {
        var line = lineItems[i];
        var lineCode = line.lineCode || '';
        if (!lineCode) {
          var lineNextSeq = getNextSequence(lineSheet, 'GRL-');
          lineCode = 'GRL-' + formatSequence(lineNextSeq, 5);
        }
        line['\u2192 GRN Number'] = grnCode;

        var lineRow = _buildRowFromHeaders(lineHeaders, line, lineCode);
        lineSheet.getRange(lineStartRow + i, 1, 1, lineRow.length).setValues([lineRow]);
      }
    }

    // Sync PO status based on GRN
    var poCode = grnData['\u2192 PO Number'] || grnData.poCode || '';
    if (poCode) {
      _syncPOStatusFromGRN(poCode);
    }

    return { success: true, grnCode: grnCode, message: isNew ? 'GRN ' + grnCode + ' created.' : 'GRN ' + grnCode + ' updated.' };

  } catch (err) {
    Logger.log('ProcurementAPI :: saveGRN error: ' + err.message);
    return { success: false, grnCode: '', message: 'Error saving GRN: ' + err.message };
  }
}


/**
 * Confirms a GRN (changes status from Draft to Confirmed).
 */
function confirmGRN(grnCode) {
  try {
    var sheet = _getF2Sheet('GRN_MASTER');
    if (!sheet) return { success: false, message: 'GRN_MASTER not found.' };

    var rowIdx = _findRowByCode(sheet, grnCode);
    if (rowIdx === -1) return { success: false, message: 'GRN ' + grnCode + ' not found.' };

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(F2_HEADER_ROW, 1, 1, lastCol).getValues()[0];

    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'Status') {
        sheet.getRange(rowIdx, i + 1).setValue('Confirmed');
        break;
      }
    }

    return { success: true, message: 'GRN ' + grnCode + ' confirmed.' };

  } catch (err) {
    return { success: false, message: 'Error: ' + err.message };
  }
}


/**
 * Gets PO line items for GRN creation (to pre-fill GRN lines from PO).
 * @param {string} poCode
 * @returns {Object[]} PO line items
 */
function getPOLinesForGRN(poCode) {
  var allLines = _readF2SheetAsObjects('PO_LINE_ITEMS');
  var result = [];
  for (var i = 0; i < allLines.length; i++) {
    var linePoCode = String(allLines[i]['\u2192 PO Number'] || '').trim();
    if (linePoCode === poCode) {
      result.push(allLines[i]);
    }
  }
  return result;
}


/**
 * Gets items for a specific PO Type (for PO line item dropdowns).
 * @param {string} poType - e.g. 'Fabric', 'Trim', 'Yarn'
 * @returns {Object[]} Array of { code, name } for items of that type
 */
function getItemsForPOType(poType) {
  var sheetMap = {
    'Fabric': 'RM_MASTER_FABRIC',
    'Yarn': 'RM_MASTER_YARN',
    'Woven': 'RM_MASTER_WOVEN',
    'Trim': 'TRIM_MASTER',
    'Consumable': 'CONSUMABLE_MASTER',
    'Packaging': 'PACKAGING_MASTER'
  };

  var sheetName = sheetMap[poType];
  if (!sheetName) return [];

  try {
    var data = getCachedData(sheetName);
    if (!data || data.length === 0) return [];

    var result = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      // Find code and name from headers that start with # and contain Name
      var code = '';
      var name = '';
      for (var key in row) {
        if (key.indexOf('#') === 0) code = String(row[key]).trim();
        if (key.indexOf('Name') !== -1 && key.indexOf('Auto') === -1 && key.indexOf('#') !== 0) {
          name = String(row[key]).trim();
        }
      }
      if (code) {
        result.push({ code: code, name: name || code });
      }
    }
    return result;
  } catch (err) {
    Logger.log('ProcurementAPI :: getItemsForPOType error: ' + err.message);
    return [];
  }
}


// ---------------------------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------------------------

function _findRowByCode(sheet, code) {
  var lastRow = sheet.getLastRow();
  if (lastRow < F2_DATA_START) return -1;

  var codes = sheet.getRange(F2_DATA_START, 1, lastRow - F2_DATA_START + 1, 1).getValues();
  for (var i = 0; i < codes.length; i++) {
    if (String(codes[i][0]).trim() === code) {
      return F2_DATA_START + i;
    }
  }
  return -1;
}

function _buildRowFromHeaders(headers, data, code) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (i === 0) {
      row.push(code); // Col A is always the code
    } else if (data.hasOwnProperty(h)) {
      row.push(data[h]);
    } else {
      // Try matching without prefix symbols
      var clean = h.replace(/^[#\u2192\u2190\u27F7\u2211\u26A0\s]+/, '').trim();
      row.push(data.hasOwnProperty(clean) ? data[clean] : '');
    }
  }
  return row;
}

function _deleteLinesByPOCode(lineSheet, headers, poCode) {
  var lastRow = lineSheet.getLastRow();
  if (lastRow < F2_DATA_START) return;

  // Find PO Code column in line items
  var poCodeCol = -1;
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (h.indexOf('PO Number') !== -1) {
      poCodeCol = i;
      break;
    }
  }
  if (poCodeCol === -1) return;

  var data = lineSheet.getRange(F2_DATA_START, 1, lastRow - F2_DATA_START + 1, headers.length).getValues();

  // Delete from bottom to top to avoid shifting issues
  for (var r = data.length - 1; r >= 0; r--) {
    if (String(data[r][poCodeCol]).trim() === poCode) {
      lineSheet.deleteRow(F2_DATA_START + r);
    }
  }
}

function _deleteLinesByGRNCode(lineSheet, headers, grnCode) {
  var lastRow = lineSheet.getLastRow();
  if (lastRow < F2_DATA_START) return;

  var grnCodeCol = -1;
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (h.indexOf('GRN Number') !== -1) {
      grnCodeCol = i;
      break;
    }
  }
  if (grnCodeCol === -1) return;

  var data = lineSheet.getRange(F2_DATA_START, 1, lastRow - F2_DATA_START + 1, headers.length).getValues();

  for (var r = data.length - 1; r >= 0; r--) {
    if (String(data[r][grnCodeCol]).trim() === grnCode) {
      lineSheet.deleteRow(F2_DATA_START + r);
    }
  }
}

/**
 * Syncs PO GRN Status based on received quantities across all GRNs for that PO.
 * Updates PO_MASTER GRN Status to: Not Received / Partially Received / Fully Received
 */
function _syncPOStatusFromGRN(poCode) {
  try {
    var ss = _getF2Spreadsheet();
    var poSheet = ss.getSheetByName('PO_MASTER');
    var poLineSheet = ss.getSheetByName('PO_LINE_ITEMS');
    var grnLineSheet = ss.getSheetByName('GRN_LINE_ITEMS');

    if (!poSheet || !poLineSheet || !grnLineSheet) return;

    // Get PO line items total ordered qty
    var poLines = _readF2SheetAsObjects('PO_LINE_ITEMS');
    var totalOrdered = 0;
    for (var i = 0; i < poLines.length; i++) {
      var lnPoCode = String(poLines[i]['\u2192 PO Number'] || '').trim();
      if (lnPoCode === poCode) {
        totalOrdered += Number(poLines[i]['\u26A0 Quantity'] || 0);
      }
    }

    // Get GRN line items total received qty for this PO
    var grnLines = _readF2SheetAsObjects('GRN_LINE_ITEMS');
    var totalReceived = 0;
    for (var j = 0; j < grnLines.length; j++) {
      var lnPo = String(grnLines[j]['\u2192 PO Number'] || '').trim();
      if (lnPo === poCode) {
        totalReceived += Number(grnLines[j]['\u26A0 Received Qty'] || 0);
      }
    }

    // Determine GRN status
    var grnStatus = 'Not Received';
    if (totalReceived > 0 && totalReceived < totalOrdered) {
      grnStatus = 'Partially Received';
    } else if (totalReceived >= totalOrdered && totalOrdered > 0) {
      grnStatus = 'Fully Received';
    }

    // Update PO_MASTER GRN Status column
    var poRowIdx = _findRowByCode(poSheet, poCode);
    if (poRowIdx === -1) return;

    var lastCol = poSheet.getLastColumn();
    var headers = poSheet.getRange(F2_HEADER_ROW, 1, 1, lastCol).getValues()[0];

    for (var k = 0; k < headers.length; k++) {
      if (String(headers[k]).trim() === 'GRN Status') {
        poSheet.getRange(poRowIdx, k + 1).setValue(grnStatus);
        break;
      }
    }

    // Also update PO Status if fully received
    if (grnStatus === 'Fully Received') {
      for (var m = 0; m < headers.length; m++) {
        if (String(headers[m]).trim() === 'Status') {
          var currentStatus = poSheet.getRange(poRowIdx, m + 1).getValue();
          if (currentStatus === 'Approved' || currentStatus === 'Partially Received') {
            poSheet.getRange(poRowIdx, m + 1).setValue('Fully Received');
          }
          break;
        }
      }
    } else if (grnStatus === 'Partially Received') {
      for (var n = 0; n < headers.length; n++) {
        if (String(headers[n]).trim() === 'Status') {
          var curStatus = poSheet.getRange(poRowIdx, n + 1).getValue();
          if (curStatus === 'Approved') {
            poSheet.getRange(poRowIdx, n + 1).setValue('Partially Received');
          }
          break;
        }
      }
    }

  } catch (err) {
    Logger.log('ProcurementAPI :: _syncPOStatusFromGRN error: ' + err.message);
  }
}
