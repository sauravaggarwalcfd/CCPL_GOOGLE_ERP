/**
 * ============================================================================
 * MODULE 10 — PRESENCE (Real-Time User Tracking)
 * ============================================================================
 * Tracks which users are active in the ERP, on which module/page.
 * Uses the PRESENCE sheet in FILE 1B.
 * Client sends heartbeat every 30 seconds.
 * ============================================================================
 */

var PRESENCE_STALE_MINUTES = 2; // Mark offline after 2 min without heartbeat

/**
 * Records a heartbeat for the current user.
 * Called from the client every 30 seconds.
 *
 * @param {string} module - Active module (e.g. 'procurement')
 * @param {string} page   - Active page (e.g. 'po_list', 'po_form')
 * @returns {Object} { success: boolean }
 */
function heartbeat(module, page) {
  try {
    var email = Session.getActiveUser().getEmail();
    if (!email) return { success: false };

    var fileId = CONFIG.FILE_IDS.FILE_1B;
    if (!fileId || fileId === 'YOUR_FILE_1B_SPREADSHEET_ID') return { success: false };

    var ss = SpreadsheetApp.openById(fileId);
    var sheet = ss.getSheetByName('PRESENCE');
    if (!sheet) return { success: false };

    var now = new Date().toISOString();
    var lastRow = sheet.getLastRow();

    // Check if user already has a presence row
    if (lastRow >= 4) {
      var data = sheet.getRange(4, 1, lastRow - 3, 10).getValues();
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][1]).trim().toLowerCase() === email.toLowerCase()) {
          // Update existing row
          var rowIdx = 4 + i;
          sheet.getRange(rowIdx, 4).setValue(module);     // Module
          sheet.getRange(rowIdx, 5).setValue(page);        // Page
          sheet.getRange(rowIdx, 6).setValue(now);          // Last Heartbeat
          sheet.getRange(rowIdx, 10).setValue('Online');    // Status
          return { success: true };
        }
      }
    }

    // New presence entry
    var presenceId = 'PRS-' + String(lastRow - 2).padStart(5, '0');
    var newRow = Math.max(lastRow + 1, 4);
    sheet.getRange(newRow, 1, 1, 10).setValues([[
      presenceId, email, email.split('@')[0], module, page,
      now, now, '', '', 'Online'
    ]]);

    return { success: true };

  } catch (err) {
    Logger.log('Module10 :: heartbeat error: ' + err.message);
    return { success: false };
  }
}


/**
 * Returns all currently online users.
 *
 * @returns {Object[]} Array of { email, name, module, page, lastSeen }
 */
function getOnlineUsers() {
  try {
    var fileId = CONFIG.FILE_IDS.FILE_1B;
    if (!fileId || fileId === 'YOUR_FILE_1B_SPREADSHEET_ID') return [];

    var ss = SpreadsheetApp.openById(fileId);
    var sheet = ss.getSheetByName('PRESENCE');
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return [];

    var data = sheet.getRange(4, 1, lastRow - 3, 10).getValues();
    var now = new Date().getTime();
    var result = [];

    for (var i = 0; i < data.length; i++) {
      var status = String(data[i][9]).trim();
      if (status !== 'Online') continue;

      var lastHB = data[i][5];
      if (lastHB) {
        var hbTime = new Date(lastHB).getTime();
        var diffMin = (now - hbTime) / 60000;
        if (diffMin > PRESENCE_STALE_MINUTES) continue; // Stale
      }

      result.push({
        email: String(data[i][1]).trim(),
        name: String(data[i][2]).trim(),
        module: String(data[i][3]).trim(),
        page: String(data[i][4]).trim(),
        lastSeen: String(data[i][5]).trim()
      });
    }

    return result;

  } catch (err) {
    Logger.log('Module10 :: getOnlineUsers error: ' + err.message);
    return [];
  }
}


/**
 * Cleans up stale presence entries (>2 min without heartbeat).
 * Designed to run on a time-driven trigger (every 5 minutes).
 */
function cleanStalePresence() {
  try {
    var fileId = CONFIG.FILE_IDS.FILE_1B;
    if (!fileId || fileId === 'YOUR_FILE_1B_SPREADSHEET_ID') return;

    var ss = SpreadsheetApp.openById(fileId);
    var sheet = ss.getSheetByName('PRESENCE');
    if (!sheet) return;

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return;

    var data = sheet.getRange(4, 1, lastRow - 3, 10).getValues();
    var now = new Date().getTime();

    for (var i = 0; i < data.length; i++) {
      var status = String(data[i][9]).trim();
      if (status !== 'Online') continue;

      var lastHB = data[i][5];
      if (lastHB) {
        var hbTime = new Date(lastHB).getTime();
        var diffMin = (now - hbTime) / 60000;
        if (diffMin > PRESENCE_STALE_MINUTES) {
          sheet.getRange(4 + i, 10).setValue('Offline');
        }
      }
    }
  } catch (err) {
    Logger.log('Module10 :: cleanStalePresence error: ' + err.message);
  }
}
