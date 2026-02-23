/**
 * =============================================================================
 * MODULE 7 — REORDER LEVEL ALERTS
 * =============================================================================
 *
 * Scheduled daily trigger (8:00 AM IST) that checks inventory levels across
 * multiple master sheets and sends email alerts when stock falls below the
 * reorder level.
 *
 * Checked sheets:
 *   - TRIM_MASTER          (Reorder Level: col 15)
 *   - RM_MASTER_FABRIC     (Current Stock vs Reorder Level)
 *   - RM_MASTER_YARN       (Current Stock vs Reorder Level)
 *   - CONSUMABLE_MASTER    (Current Stock vs Reorder Level)
 *   - PACKAGING_MASTER     (Current Stock vs Reorder Level)
 *
 * Alert recipients: all active users with Role = PURCHASE_MGR in USER_MASTER.
 *
 * Row Structure: Row 1=banner, Row 2=headers, Row 3=descriptions, Row 4+=data
 * =============================================================================
 */


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var RA_TIMEZONE = 'Asia/Kolkata';
var RA_TRIGGER_HOUR = 8;   // 8:00 AM IST daily
var RA_TRIGGER_MINUTE = 0;

/**
 * Sheet configurations for reorder level checking.
 * Each entry defines:
 *   sheetName  - CONFIG sheet name constant
 *   codeCol    - Column index for the item code (col A = 1)
 *   nameCol    - Column index for the item name
 *   stockCol   - Column index for Current Stock
 *   reorderCol - Column index for Reorder Level
 *   statusCol  - Column index for Status field
 *   uomCol     - Column index for UOM field
 *
 * Column indices are based on the V4 master sheet structures.
 * TRIM_MASTER: Reorder Level is col 15 (per spec).
 */
var RA_SHEET_CONFIGS = {
  TRIM_MASTER: {
    sheetName:  'TRIM_MASTER',
    codeCol:    1,   // # TRM Code
    nameCol:    3,   // Trim Name
    stockCol:   0,   // TRIM_MASTER does not have a Current Stock column in masters
                     // (stock is tracked in Phase 3 Inventory); uses Reorder Level only
    reorderCol: 15,  // Reorder Level (col 15 per V4 spec)
    statusCol:  16,  // Status
    uomCol:     9    // UOM
  },
  RM_MASTER_FABRIC: {
    sheetName:  'RM_MASTER_FABRIC',
    codeCol:    1,   // # RM Code
    nameCol:    2,   // Final Fabric SKU
    stockCol:   0,   // Current Stock — column TBD (Phase 3 Inventory)
    reorderCol: 0,   // Reorder Level — column TBD (Phase 3 Inventory)
    statusCol:  0,   // Status column
    uomCol:     0    // UOM column
  },
  RM_MASTER_YARN: {
    sheetName:  'RM_MASTER_YARN',
    codeCol:    1,   // # RM Code
    nameCol:    2,   // Yarn Name
    stockCol:   0,   // Current Stock — column TBD (Phase 3 Inventory)
    reorderCol: 0,   // Reorder Level — column TBD (Phase 3 Inventory)
    statusCol:  0,   // Status column
    uomCol:     0    // UOM column
  },
  CONSUMABLE_MASTER: {
    sheetName:  'CONSUMABLE_MASTER',
    codeCol:    1,   // # CON Code
    nameCol:    2,   // Consumable Name (assumed)
    stockCol:   0,   // Current Stock — column TBD
    reorderCol: 0,   // Reorder Level — column TBD
    statusCol:  0,   // Status column
    uomCol:     0    // UOM column
  },
  PACKAGING_MASTER: {
    sheetName:  'PACKAGING_MASTER',
    codeCol:    1,   // # PKG Code
    nameCol:    2,   // Packaging Name (assumed)
    stockCol:   0,   // Current Stock — column TBD
    reorderCol: 0,   // Reorder Level — column TBD
    statusCol:  0,   // Status column
    uomCol:     0    // UOM column
  }
};

/**
 * Dynamic column detection: when stockCol or reorderCol is 0, the system
 * will attempt to detect the correct columns by scanning row 2 headers
 * for keywords: "Current Stock", "Reorder Level", "Status", "UOM".
 */
var RA_HEADER_KEYWORDS = {
  STOCK:   ['current stock', 'stock qty', 'stock', 'qty on hand', 'available stock'],
  REORDER: ['reorder level', 'reorder qty', 'min stock', 'minimum stock', 'reorder'],
  STATUS:  ['status'],
  UOM:     ['uom', 'unit']
};


// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Main function — scheduled daily at 8:00 AM IST.
 * Checks all configured master sheets for items below their reorder level
 * and sends an alert email to all active Purchase Managers.
 */
function checkReorderLevels() {
  try {
    Logger.log('REORDER :: checkReorderLevels - Starting reorder level check...');

    var allAlertItems = [];

    // Check each configured master sheet
    var configKeys = Object.keys(RA_SHEET_CONFIGS);
    for (var k = 0; k < configKeys.length; k++) {
      var key = configKeys[k];
      var sheetConfig = RA_SHEET_CONFIGS[key];

      Logger.log('REORDER :: Checking ' + sheetConfig.sheetName + '...');

      var items = getItemsBelowReorder(
        sheetConfig.sheetName,
        sheetConfig.stockCol,
        sheetConfig.reorderCol,
        sheetConfig
      );

      if (items && items.length > 0) {
        allAlertItems = allAlertItems.concat(items);
        Logger.log('REORDER :: Found ' + items.length + ' items below reorder in ' + sheetConfig.sheetName);
      } else {
        Logger.log('REORDER :: No alerts for ' + sheetConfig.sheetName);
      }
    }

    // Send alert if any items are below reorder level
    if (allAlertItems.length > 0) {
      Logger.log('REORDER :: Total items below reorder: ' + allAlertItems.length + '. Sending alert...');
      sendReorderAlert(allAlertItems);
    } else {
      Logger.log('REORDER :: checkReorderLevels - All stock levels OK. No alerts needed.');
    }

  } catch (err) {
    Logger.log('REORDER :: checkReorderLevels - Error: ' + err.message);
  }
}


/**
 * Scans a master sheet and returns items where Current Stock < Reorder Level.
 * Only returns items where Status = Active.
 *
 * If stockCol or reorderCol is 0 in the config, attempts to auto-detect the
 * columns by scanning row 2 headers.
 *
 * @param {string} sheetName  - Name of the sheet to check
 * @param {number} stockCol   - Column index for Current Stock (0 = auto-detect)
 * @param {number} reorderCol - Column index for Reorder Level (0 = auto-detect)
 * @param {Object} sheetConfig - Full configuration object for this sheet
 * @returns {Object[]} Array of alert items, each with:
 *   { sheetName, itemCode, itemName, currentStock, reorderLevel, deficit, uom }
 */
function getItemsBelowReorder(sheetName, stockCol, reorderCol, sheetConfig) {
  var alertItems = [];

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      Logger.log('REORDER :: getItemsBelowReorder - Sheet "' + sheetName + '" not found.');
      return alertItems;
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getMaxColumns();

    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return alertItems; // No data rows
    }

    // Read header row for auto-detection
    var headers = sheet.getRange(CONFIG.ROW_STRUCTURE.HEADER_ROW, 1, 1, lastCol).getValues()[0];

    // Auto-detect columns if not configured (value = 0)
    var effectiveStockCol = stockCol > 0 ? stockCol : _detectColumn(headers, RA_HEADER_KEYWORDS.STOCK);
    var effectiveReorderCol = reorderCol > 0 ? reorderCol : _detectColumn(headers, RA_HEADER_KEYWORDS.REORDER);
    var effectiveStatusCol = (sheetConfig && sheetConfig.statusCol > 0) ?
      sheetConfig.statusCol : _detectColumn(headers, RA_HEADER_KEYWORDS.STATUS);
    var effectiveUomCol = (sheetConfig && sheetConfig.uomCol > 0) ?
      sheetConfig.uomCol : _detectColumn(headers, RA_HEADER_KEYWORDS.UOM);

    // If we cannot find the reorder column, skip this sheet
    if (effectiveReorderCol === 0) {
      Logger.log('REORDER :: getItemsBelowReorder - Cannot detect Reorder Level column in "' +
        sheetName + '". Skipping.');
      return alertItems;
    }

    // If no stock column found, we can still alert based on reorder level > 0
    // (useful when stock tracking is in Phase 3 and reorder level is set as a placeholder)
    var hasStockCol = effectiveStockCol > 0;

    // Read all data rows at once for performance
    var numRows = lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1;
    var data = sheet.getRange(CONFIG.ROW_STRUCTURE.DATA_START_ROW, 1, numRows, lastCol).getValues();

    var codeCol = (sheetConfig && sheetConfig.codeCol > 0) ? sheetConfig.codeCol : 1;
    var nameCol = (sheetConfig && sheetConfig.nameCol > 0) ? sheetConfig.nameCol : 2;

    for (var i = 0; i < data.length; i++) {
      var row = data[i];

      // Get item code — skip empty rows
      var itemCode = String(row[codeCol - 1]).trim();
      if (!itemCode) {
        continue;
      }

      // Check Active status — only alert for Active items
      if (effectiveStatusCol > 0) {
        var status = String(row[effectiveStatusCol - 1]).trim();
        if (status.toLowerCase() !== 'active') {
          continue;
        }
      }

      var reorderLevel = _parseNumber(row[effectiveReorderCol - 1]);

      // Skip items with no reorder level set
      if (reorderLevel <= 0) {
        continue;
      }

      var currentStock = hasStockCol ? _parseNumber(row[effectiveStockCol - 1]) : 0;

      // Alert if current stock is below reorder level
      if (currentStock < reorderLevel) {
        var itemName = String(row[nameCol - 1]).trim();
        var uom = effectiveUomCol > 0 ? String(row[effectiveUomCol - 1]).trim() : '';

        alertItems.push({
          sheetName:    sheetName,
          itemCode:     itemCode,
          itemName:     itemName,
          currentStock: currentStock,
          reorderLevel: reorderLevel,
          deficit:      reorderLevel - currentStock,
          uom:          uom
        });
      }
    }

  } catch (err) {
    Logger.log('REORDER :: getItemsBelowReorder - Error for "' + sheetName + '": ' + err.message);
  }

  return alertItems;
}


/**
 * Sends a reorder alert email to all active Purchase Managers.
 * Retrieves PM email addresses from USER_MASTER in FILE 1B.
 *
 * @param {Object[]} items - Array of alert items from getItemsBelowReorder
 */
function sendReorderAlert(items) {
  try {
    if (!items || items.length === 0) {
      Logger.log('REORDER :: sendReorderAlert - No items to alert. Skipping.');
      return;
    }

    // Get Purchase Manager emails from USER_MASTER (FILE 1B)
    var pmEmails = _getPurchaseManagerEmails();

    if (!pmEmails || pmEmails.length === 0) {
      Logger.log('REORDER :: sendReorderAlert - No active Purchase Manager emails found. Cannot send alert.');
      // Fall back: try to send to the script owner
      var fallbackEmail = Session.getEffectiveUser().getEmail();
      if (fallbackEmail) {
        pmEmails = [fallbackEmail];
        Logger.log('REORDER :: sendReorderAlert - Falling back to script owner: ' + fallbackEmail);
      } else {
        return;
      }
    }

    // Format the email
    var htmlBody = formatAlertEmail(items);

    // Build subject line with date and count
    var dateStr = Utilities.formatDate(new Date(), RA_TIMEZONE, CONFIG.SYSTEM.DATE_FORMAT);
    var subject = CONFIG.SYSTEM.APP_NAME + ' — Reorder Alert: ' +
      items.length + ' item(s) below reorder level (' + dateStr + ')';

    // Send to all Purchase Managers
    for (var i = 0; i < pmEmails.length; i++) {
      try {
        MailApp.sendEmail({
          to:       pmEmails[i],
          subject:  subject,
          htmlBody: htmlBody,
          name:     CONFIG.SYSTEM.APP_NAME + ' Alerts',
          noReply:  true
        });
        Logger.log('REORDER :: sendReorderAlert - Email sent to: ' + pmEmails[i]);
      } catch (mailErr) {
        Logger.log('REORDER :: sendReorderAlert - Failed to send to ' + pmEmails[i] + ': ' + mailErr.message);
      }
    }

  } catch (err) {
    Logger.log('REORDER :: sendReorderAlert - Error: ' + err.message);
  }
}


/**
 * Formats the reorder alert as an HTML email.
 * Produces a styled HTML table with item details grouped by master sheet.
 *
 * @param {Object[]} items - Array of alert items
 * @returns {string} HTML email body
 */
function formatAlertEmail(items) {
  var dateStr = Utilities.formatDate(new Date(), RA_TIMEZONE, CONFIG.SYSTEM.DATETIME_FORMAT);

  var html = '';

  // -- Email Header --
  html += '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">';
  html += '<div style="background-color: #1A1A2E; color: #FFFFFF; padding: 16px 24px; border-radius: 4px 4px 0 0;">';
  html += '<h2 style="margin: 0; font-size: 18px;">' + CONFIG.SYSTEM.APP_NAME + ' — Reorder Level Alert</h2>';
  html += '<p style="margin: 4px 0 0 0; font-size: 12px; color: #CCCCCC;">' +
    CONFIG.SYSTEM.COMPANY_NAME + ' | ' + dateStr + '</p>';
  html += '</div>';

  // -- Summary --
  html += '<div style="background-color: #FFF3CD; padding: 12px 24px; border-left: 4px solid #FFC107;">';
  html += '<strong>' + items.length + ' item(s)</strong> are below their reorder level and require attention.';
  html += '</div>';

  // -- Group items by sheet name --
  var grouped = {};
  for (var i = 0; i < items.length; i++) {
    var sn = items[i].sheetName;
    if (!grouped[sn]) {
      grouped[sn] = [];
    }
    grouped[sn].push(items[i]);
  }

  // -- Table per group --
  var sheetNames = Object.keys(grouped);
  for (var s = 0; s < sheetNames.length; s++) {
    var groupName = sheetNames[s];
    var groupItems = grouped[groupName];

    html += '<div style="margin-top: 16px; padding: 0 24px;">';
    html += '<h3 style="color: #1A1A2E; border-bottom: 2px solid #CC0000; padding-bottom: 4px; font-size: 14px;">';
    html += groupName + ' (' + groupItems.length + ' item' + (groupItems.length > 1 ? 's' : '') + ')';
    html += '</h3>';

    html += '<table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;">';

    // Table header
    html += '<thead>';
    html += '<tr style="background-color: #CC0000; color: #FFFFFF;">';
    html += '<th style="padding: 8px; text-align: left; border: 1px solid #DDD;">Item Code</th>';
    html += '<th style="padding: 8px; text-align: left; border: 1px solid #DDD;">Item Name</th>';
    html += '<th style="padding: 8px; text-align: right; border: 1px solid #DDD;">Current Stock</th>';
    html += '<th style="padding: 8px; text-align: right; border: 1px solid #DDD;">Reorder Level</th>';
    html += '<th style="padding: 8px; text-align: right; border: 1px solid #DDD;">Deficit</th>';
    html += '<th style="padding: 8px; text-align: center; border: 1px solid #DDD;">UOM</th>';
    html += '</tr>';
    html += '</thead>';

    // Table body
    html += '<tbody>';
    for (var j = 0; j < groupItems.length; j++) {
      var item = groupItems[j];
      var rowBg = (j % 2 === 0) ? '#FFFFFF' : '#F9F9F9';
      var deficitColor = item.deficit > 0 ? '#CC0000' : '#333333';

      html += '<tr style="background-color: ' + rowBg + ';">';
      html += '<td style="padding: 6px 8px; border: 1px solid #DDD; font-weight: bold;">' +
        _escapeHtml(item.itemCode) + '</td>';
      html += '<td style="padding: 6px 8px; border: 1px solid #DDD;">' +
        _escapeHtml(item.itemName) + '</td>';
      html += '<td style="padding: 6px 8px; border: 1px solid #DDD; text-align: right;">' +
        item.currentStock + '</td>';
      html += '<td style="padding: 6px 8px; border: 1px solid #DDD; text-align: right;">' +
        item.reorderLevel + '</td>';
      html += '<td style="padding: 6px 8px; border: 1px solid #DDD; text-align: right; color: ' +
        deficitColor + '; font-weight: bold;">' + item.deficit + '</td>';
      html += '<td style="padding: 6px 8px; border: 1px solid #DDD; text-align: center;">' +
        _escapeHtml(item.uom) + '</td>';
      html += '</tr>';
    }
    html += '</tbody>';
    html += '</table>';
    html += '</div>';
  }

  // -- Footer --
  html += '<div style="margin-top: 24px; padding: 12px 24px; background-color: #F5F5F5; ' +
    'border-radius: 0 0 4px 4px; font-size: 11px; color: #666666;">';
  html += '<p style="margin: 0;">This is an automated alert from ' + CONFIG.SYSTEM.APP_NAME + '. ';
  html += 'Please review and raise Purchase Orders for the items listed above.</p>';
  html += '<p style="margin: 4px 0 0 0;">Generated: ' + dateStr + ' | ';
  html += 'Trigger: Daily at ' + RA_TRIGGER_HOUR + ':00 AM IST</p>';
  html += '</div>';

  html += '</div>';

  return html;
}


/**
 * Creates (or replaces) the daily 8:00 AM IST time-driven trigger for
 * checkReorderLevels. Removes any existing trigger with the same function
 * name to prevent duplicates.
 *
 * Call this once during initial setup or from the Admin Tools menu.
 */
function setupReorderTrigger() {
  try {
    // Remove any existing triggers for checkReorderLevels to prevent duplicates
    var existingTriggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < existingTriggers.length; i++) {
      if (existingTriggers[i].getHandlerFunction() === 'checkReorderLevels') {
        ScriptApp.deleteTrigger(existingTriggers[i]);
        Logger.log('REORDER :: setupReorderTrigger - Removed existing trigger.');
      }
    }

    // Create new daily trigger at 8:00 AM IST
    ScriptApp.newTrigger('checkReorderLevels')
      .timeBased()
      .atHour(RA_TRIGGER_HOUR)
      .nearMinute(RA_TRIGGER_MINUTE)
      .everyDays(1)
      .inTimezone(RA_TIMEZONE)
      .create();

    Logger.log('REORDER :: setupReorderTrigger - Daily trigger created for ' +
      RA_TRIGGER_HOUR + ':00 AM IST.');

    // Confirm to user if running from UI
    try {
      SpreadsheetApp.getUi().alert(
        'Reorder Trigger Setup',
        'Daily reorder level check trigger has been created.\n' +
        'Schedule: Every day at ' + RA_TRIGGER_HOUR + ':00 AM IST.\n' +
        'Function: checkReorderLevels()',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (uiErr) {
      // UI not available (running from trigger or script editor) — silent
    }

  } catch (err) {
    Logger.log('REORDER :: setupReorderTrigger - Error: ' + err.message);
  }
}


// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Gets email addresses for all active Purchase Managers from USER_MASTER.
 * USER_MASTER is in FILE 1B (cross-file).
 *
 * @returns {string[]} Array of PM email addresses
 */
function _getPurchaseManagerEmails() {
  var emails = [];

  try {
    var userSheet = getCrossFileSheet(CONFIG.FILE_IDS.FILE_1B, 'USER_MASTER');

    if (!userSheet) {
      Logger.log('REORDER :: _getPurchaseManagerEmails - USER_MASTER not found in FILE 1B.');
      return emails;
    }

    var lastRow = userSheet.getLastRow();
    if (lastRow < CONFIG.ROW_STRUCTURE.DATA_START_ROW) {
      return emails;
    }

    // Read all user data at once (columns: Email, Name, Role, Department, Active, Phone)
    var numRows = lastRow - CONFIG.ROW_STRUCTURE.DATA_START_ROW + 1;
    var data = userSheet.getRange(CONFIG.ROW_STRUCTURE.DATA_START_ROW, 1, numRows, 6).getValues();

    for (var i = 0; i < data.length; i++) {
      var email = String(data[i][0]).trim();    // Col 1: Email
      var role = String(data[i][2]).trim();      // Col 3: Role
      var active = String(data[i][4]).trim();    // Col 5: Active

      // Check for Purchase Manager role and Active status
      if (role === CONFIG.ROLES.PURCHASE_MGR && email) {
        if (active.toLowerCase() === 'yes' || active.toLowerCase() === 'true' ||
            active.toLowerCase() === 'active' || active === '1') {
          emails.push(email.toLowerCase());
        }
      }
    }

  } catch (err) {
    Logger.log('REORDER :: _getPurchaseManagerEmails - Error: ' + err.message);
  }

  return emails;
}


/**
 * Auto-detects a column index by scanning row 2 headers for keyword matches.
 *
 * @param {Array} headers - Array of header values from row 2
 * @param {string[]} keywords - Array of keyword strings to match (case-insensitive)
 * @returns {number} 1-based column index, or 0 if not found
 */
function _detectColumn(headers, keywords) {
  if (!headers || !keywords) {
    return 0;
  }

  for (var col = 0; col < headers.length; col++) {
    var headerText = String(headers[col]).toLowerCase().trim();

    for (var k = 0; k < keywords.length; k++) {
      if (headerText.indexOf(keywords[k]) !== -1) {
        return col + 1; // Convert to 1-based index
      }
    }
  }

  return 0;
}


/**
 * Safely parses a value as a number. Returns 0 for non-numeric or empty values.
 *
 * @param {*} val - Value to parse
 * @returns {number} Parsed number or 0
 */
function _parseNumber(val) {
  if (val === null || val === undefined || val === '') {
    return 0;
  }
  var num = Number(val);
  return isNaN(num) ? 0 : num;
}


/**
 * Escapes HTML special characters to prevent XSS in email output.
 *
 * @param {string} str - String to escape
 * @returns {string} HTML-safe string
 */
function _escapeHtml(str) {
  if (!str) {
    return '';
  }
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
