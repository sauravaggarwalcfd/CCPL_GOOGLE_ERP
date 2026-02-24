/**
 * ============================================================================
 * MODULE 12 — NOTIFICATIONS
 * ============================================================================
 * Manages the notification queue in the NOTIFICATIONS sheet (FILE 1B).
 * Supports 4 types: action, warning, info, system.
 * ============================================================================
 */

/**
 * Creates a new notification.
 *
 * @param {Object} opts - { type, title, message, toEmail, module, referenceId, priority }
 * @returns {Object} { success, notificationId }
 */
function createNotification(opts) {
  try {
    var fileId = CONFIG.FILE_IDS.FILE_1B;
    if (!fileId || fileId === 'YOUR_FILE_1B_SPREADSHEET_ID') {
      return { success: false, notificationId: '' };
    }

    var ss = SpreadsheetApp.openById(fileId);
    var sheet = ss.getSheetByName('NOTIFICATIONS');
    if (!sheet) return { success: false, notificationId: '' };

    var lastRow = sheet.getLastRow();
    var nextId = 'NTF-' + String(Math.max(lastRow - 2, 0) + 1).padStart(5, '0');
    var fromEmail = Session.getActiveUser().getEmail() || 'SYSTEM';
    var now = new Date().toISOString();

    var newRow = Math.max(lastRow + 1, 4);
    sheet.getRange(newRow, 1, 1, 12).setValues([[
      nextId,
      opts.type || 'info',
      opts.title || '',
      opts.message || '',
      opts.toEmail || '',
      fromEmail,
      opts.module || '',
      opts.referenceId || '',
      now,
      '',        // Read At
      'Unread',
      opts.priority || 'Normal'
    ]]);

    return { success: true, notificationId: nextId };

  } catch (err) {
    Logger.log('Module12 :: createNotification error: ' + err.message);
    return { success: false, notificationId: '' };
  }
}


/**
 * Gets notifications for the current user.
 *
 * @param {Object} opts - { status, limit }
 * @returns {Object[]} Array of notification objects
 */
function getNotifications(opts) {
  try {
    opts = opts || {};
    var email = Session.getActiveUser().getEmail();
    var fileId = CONFIG.FILE_IDS.FILE_1B;
    if (!fileId || fileId === 'YOUR_FILE_1B_SPREADSHEET_ID') return [];

    var ss = SpreadsheetApp.openById(fileId);
    var sheet = ss.getSheetByName('NOTIFICATIONS');
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return [];

    var data = sheet.getRange(4, 1, lastRow - 3, 12).getValues();
    var result = [];
    var limit = opts.limit || 50;

    for (var i = data.length - 1; i >= 0 && result.length < limit; i--) {
      var toEmail = String(data[i][4]).trim().toLowerCase();
      if (toEmail !== email.toLowerCase() && toEmail !== 'all') continue;

      var status = String(data[i][10]).trim();
      if (opts.status && status !== opts.status) continue;
      if (status === 'Dismissed' || status === 'Archived') continue;

      result.push({
        id: String(data[i][0]).trim(),
        type: String(data[i][1]).trim(),
        title: String(data[i][2]).trim(),
        message: String(data[i][3]).trim(),
        toEmail: toEmail,
        fromEmail: String(data[i][5]).trim(),
        module: String(data[i][6]).trim(),
        referenceId: String(data[i][7]).trim(),
        createdAt: String(data[i][8]).trim(),
        readAt: String(data[i][9]).trim(),
        status: status,
        priority: String(data[i][11]).trim(),
        rowIndex: 4 + i
      });
    }

    return result;

  } catch (err) {
    Logger.log('Module12 :: getNotifications error: ' + err.message);
    return [];
  }
}


/**
 * Marks a notification as read.
 * @param {string} notificationId
 * @returns {Object} { success }
 */
function markNotificationRead(notificationId) {
  return _updateNotificationStatus(notificationId, 'Read');
}


/**
 * Dismisses a notification.
 * @param {string} notificationId
 * @returns {Object} { success }
 */
function dismissNotification(notificationId) {
  return _updateNotificationStatus(notificationId, 'Dismissed');
}


/**
 * Sends a templated notification using NOTIFICATION_TEMPLATES.
 *
 * @param {string} templateCode - e.g. 'NTPL-001'
 * @param {Object} placeholders - { po_code, supplier, total, ... }
 * @param {string} toEmail - Recipient email
 * @returns {Object} { success, notificationId }
 */
function sendTemplatedNotification(templateCode, placeholders, toEmail) {
  try {
    var fileId = CONFIG.FILE_IDS.FILE_1B;
    if (!fileId || fileId === 'YOUR_FILE_1B_SPREADSHEET_ID') return { success: false };

    var ss = SpreadsheetApp.openById(fileId);
    var tplSheet = ss.getSheetByName('NOTIFICATION_TEMPLATES');
    if (!tplSheet) return { success: false, notificationId: '' };

    var lastRow = tplSheet.getLastRow();
    if (lastRow < 4) return { success: false, notificationId: '' };

    var data = tplSheet.getRange(4, 1, lastRow - 3, 7).getValues();
    var template = null;

    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === templateCode && String(data[i][6]).trim() === 'Yes') {
        template = {
          type: String(data[i][2]).trim(),
          titleTemplate: String(data[i][3]).trim(),
          messageTemplate: String(data[i][4]).trim(),
          module: String(data[i][5]).trim()
        };
        break;
      }
    }

    if (!template) return { success: false, notificationId: '', message: 'Template ' + templateCode + ' not found.' };

    // Replace placeholders
    var title = template.titleTemplate;
    var message = template.messageTemplate;
    for (var key in placeholders) {
      var placeholder = '{{' + key + '}}';
      title = title.split(placeholder).join(String(placeholders[key]));
      message = message.split(placeholder).join(String(placeholders[key]));
    }

    return createNotification({
      type: template.type,
      title: title,
      message: message,
      toEmail: toEmail,
      module: template.module,
      referenceId: placeholders.po_code || placeholders.grn_code || ''
    });

  } catch (err) {
    Logger.log('Module12 :: sendTemplatedNotification error: ' + err.message);
    return { success: false, notificationId: '' };
  }
}


function _updateNotificationStatus(notificationId, newStatus) {
  try {
    var fileId = CONFIG.FILE_IDS.FILE_1B;
    if (!fileId || fileId === 'YOUR_FILE_1B_SPREADSHEET_ID') return { success: false };

    var ss = SpreadsheetApp.openById(fileId);
    var sheet = ss.getSheetByName('NOTIFICATIONS');
    if (!sheet) return { success: false };

    var lastRow = sheet.getLastRow();
    if (lastRow < 4) return { success: false };

    var ids = sheet.getRange(4, 1, lastRow - 3, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === notificationId) {
        var rowIdx = 4 + i;
        sheet.getRange(rowIdx, 11).setValue(newStatus); // Status col
        if (newStatus === 'Read') {
          sheet.getRange(rowIdx, 10).setValue(new Date().toISOString()); // Read At
        }
        return { success: true };
      }
    }
    return { success: false };

  } catch (err) {
    Logger.log('Module12 :: _updateNotificationStatus error: ' + err.message);
    return { success: false };
  }
}
