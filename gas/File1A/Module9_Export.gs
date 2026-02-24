/**
 * ============================================================================
 * MODULE 9 — EXPORT (PDF / Sheets / Excel)
 * ============================================================================
 * Exports PO and GRN documents to PDF, Google Sheets, or Excel format.
 * Called from the web app via google.script.run.
 * ============================================================================
 */

/**
 * Exports a PO to PDF format.
 * Creates a temporary Google Sheet with the PO layout, converts to PDF,
 * saves to Drive, and returns the download URL.
 *
 * @param {string} poCode - The PO code to export
 * @returns {Object} { success, url, message }
 */
function exportPOToPDF(poCode) {
  try {
    var detail = getPODetail(poCode);
    if (!detail.po) return { success: false, url: '', message: 'PO ' + poCode + ' not found.' };

    var ss = SpreadsheetApp.create('PO_' + poCode + '_' + new Date().getTime());
    var sheet = ss.getActiveSheet();
    sheet.setName('Purchase Order');

    // Header section
    sheet.getRange('A1').setValue('CONFIDENCE CLOTHING PVT. LTD.').setFontSize(16).setFontWeight('bold');
    sheet.getRange('A2').setValue('PURCHASE ORDER').setFontSize(14).setFontWeight('bold').setFontColor('#CC0000');
    sheet.getRange('A3').setValue('');

    // PO Details
    var po = detail.po;
    var infoData = [
      ['PO Number:', poCode, 'Date:', po['PO Date'] || ''],
      ['Supplier:', po['\u2190 Supplier Name (Auto)'] || po['Supplier Name'] || '', 'Season:', po['Season'] || ''],
      ['PO Type:', po['PO Type'] || '', 'Currency:', po['Currency'] || 'INR'],
      ['Payment Terms:', po['\u2190 Payment Terms (Auto)'] || '', 'Delivery Date:', po['Expected Delivery Date'] || ''],
      ['Status:', po['Status'] || 'Draft', '', '']
    ];
    sheet.getRange(4, 1, infoData.length, 4).setValues(infoData);
    sheet.getRange(4, 1, infoData.length, 1).setFontWeight('bold');
    sheet.getRange(4, 3, infoData.length, 1).setFontWeight('bold');

    // Line items header
    var lineStart = 10;
    var lineHeaders = ['#', 'Item Code', 'Item Name', 'UOM', 'Qty', 'Unit Price', 'GST %', 'Total'];
    sheet.getRange(lineStart, 1, 1, lineHeaders.length).setValues([lineHeaders])
      .setBackground('#CC0000').setFontColor('#FFFFFF').setFontWeight('bold');

    // Line items data
    var lines = detail.lines;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var row = [
        i + 1,
        ln['\u2192 Item Code'] || ln['Item Code'] || '',
        ln['\u2190 Item Name (Auto)'] || ln['Item Name'] || '',
        ln['UOM'] || '',
        ln['Order Qty'] || ln['Quantity'] || 0,
        ln['Unit Price'] || 0,
        ln['GST %'] || 0,
        ln['\u2211 Line Total (Auto)'] || ln['Line Total'] || 0
      ];
      sheet.getRange(lineStart + 1 + i, 1, 1, row.length).setValues([row]);
    }

    // Totals
    var totalRow = lineStart + 1 + lines.length + 1;
    sheet.getRange(totalRow, 6).setValue('Sub Total:').setFontWeight('bold');
    sheet.getRange(totalRow, 8).setValue(po['\u2211 Sub Total (Auto)'] || po['Sub Total'] || '');
    sheet.getRange(totalRow + 1, 6).setValue('GST Amount:').setFontWeight('bold');
    sheet.getRange(totalRow + 1, 8).setValue(po['\u2211 GST Amount (Auto)'] || po['GST Amount'] || '');
    sheet.getRange(totalRow + 2, 6).setValue('Grand Total:').setFontWeight('bold').setFontSize(12);
    sheet.getRange(totalRow + 2, 8).setValue(po['\u2211 Grand Total (Auto)'] || po['Grand Total'] || '').setFontWeight('bold').setFontSize(12);

    // Format column widths
    sheet.setColumnWidth(1, 40);
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 60);
    sheet.setColumnWidth(5, 80);
    sheet.setColumnWidth(6, 100);
    sheet.setColumnWidth(7, 60);
    sheet.setColumnWidth(8, 120);

    SpreadsheetApp.flush();

    // Convert to PDF
    var ssId = ss.getId();
    var url = 'https://docs.google.com/spreadsheets/d/' + ssId + '/export?format=pdf&portrait=true&size=A4&gridlines=false';
    var token = ScriptApp.getOAuthToken();
    var response = UrlFetchApp.fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    var blob = response.getBlob().setName('PO_' + poCode + '.pdf');

    // Save to Drive
    var file = DriveApp.createFile(blob);
    var fileUrl = file.getUrl();

    // Cleanup temp spreadsheet
    DriveApp.getFileById(ssId).setTrashed(true);

    return { success: true, url: fileUrl, message: 'PDF exported: PO_' + poCode + '.pdf' };

  } catch (err) {
    Logger.log('Module9 :: exportPOToPDF error: ' + err.message);
    return { success: false, url: '', message: 'Export error: ' + err.message };
  }
}


/**
 * Exports a PO to a new Google Sheets file.
 * @param {string} poCode
 * @returns {Object} { success, url, message }
 */
function exportPOToSheets(poCode) {
  try {
    var detail = getPODetail(poCode);
    if (!detail.po) return { success: false, url: '', message: 'PO not found.' };

    // Use the PDF export function's sheet creation, but don't convert
    // Just create the sheet and return the URL
    var ss = SpreadsheetApp.create('PO_' + poCode);
    var sheet = ss.getActiveSheet();
    sheet.setName('Purchase Order');

    sheet.getRange('A1').setValue('Purchase Order: ' + poCode).setFontSize(14).setFontWeight('bold');
    sheet.getRange('A2').setValue('Exported: ' + new Date().toLocaleString());

    // Write headers
    var headers = Object.keys(detail.po);
    sheet.getRange(4, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

    // Write PO data
    var values = headers.map(function(h) { return detail.po[h]; });
    sheet.getRange(5, 1, 1, values.length).setValues([values]);

    // Write lines
    if (detail.lines.length > 0) {
      var lineHeaders = Object.keys(detail.lines[0]);
      sheet.getRange(8, 1, 1, lineHeaders.length).setValues([lineHeaders]).setFontWeight('bold').setBackground('#D6EAF8');
      for (var i = 0; i < detail.lines.length; i++) {
        var lineVals = lineHeaders.map(function(h) { return detail.lines[i][h]; });
        sheet.getRange(9 + i, 1, 1, lineVals.length).setValues([lineVals]);
      }
    }

    return { success: true, url: ss.getUrl(), message: 'Exported to Google Sheets.' };

  } catch (err) {
    return { success: false, url: '', message: 'Export error: ' + err.message };
  }
}


/**
 * Exports a PO to Excel (.xlsx) format.
 * Creates a Google Sheet, then provides the Excel export URL.
 * @param {string} poCode
 * @returns {Object} { success, url, message }
 */
function exportPOToExcel(poCode) {
  try {
    var result = exportPOToSheets(poCode);
    if (!result.success) return result;

    // Extract the spreadsheet ID from the URL and build Excel export URL
    var match = result.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return { success: false, url: '', message: 'Could not extract spreadsheet ID.' };

    var ssId = match[1];
    var excelUrl = 'https://docs.google.com/spreadsheets/d/' + ssId + '/export?format=xlsx';

    return { success: true, url: excelUrl, message: 'Excel download ready.' };

  } catch (err) {
    return { success: false, url: '', message: 'Export error: ' + err.message };
  }
}
