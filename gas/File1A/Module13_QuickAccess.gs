/**
 * ============================================================================
 * MODULE 13 — QUICK ACCESS (Command Palette Shortcuts)
 * ============================================================================
 * Stores and retrieves user-specific quick-access shortcuts.
 * Powered by PropertiesService (per-user).
 * Used by the Ctrl+K command palette in the web app.
 * ============================================================================
 */

/**
 * Gets the current user's pinned shortcuts.
 * @returns {string[]} Array of shortcut IDs
 */
function getUserShortcuts() {
  try {
    var email = Session.getActiveUser().getEmail();
    var key = 'QA_SHORTCUTS_' + email;
    var raw = PropertiesService.getUserProperties().getProperty(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    Logger.log('Module13 :: getUserShortcuts error: ' + err.message);
  }
  return [];
}


/**
 * Saves the user's shortcut list (replaces existing).
 * @param {string[]} shortcutIds - Array of shortcut IDs
 * @returns {Object} { success }
 */
function saveQuickAccessShortcuts(shortcutIds) {
  try {
    var email = Session.getActiveUser().getEmail();
    var key = 'QA_SHORTCUTS_' + email;
    PropertiesService.getUserProperties().setProperty(key, JSON.stringify(shortcutIds || []));
    return { success: true };
  } catch (err) {
    Logger.log('Module13 :: saveQuickAccessShortcuts error: ' + err.message);
    return { success: false };
  }
}


/**
 * Adds a single shortcut to the user's list.
 * @param {string} shortcutId
 * @returns {Object} { success, shortcuts }
 */
function addShortcut(shortcutId) {
  try {
    var current = getUserShortcuts();
    if (current.indexOf(shortcutId) === -1) {
      current.push(shortcutId);
    }
    saveQuickAccessShortcuts(current);
    return { success: true, shortcuts: current };
  } catch (err) {
    return { success: false, shortcuts: [] };
  }
}


/**
 * Removes a single shortcut from the user's list.
 * @param {string} shortcutId
 * @returns {Object} { success, shortcuts }
 */
function removeShortcut(shortcutId) {
  try {
    var current = getUserShortcuts();
    var idx = current.indexOf(shortcutId);
    if (idx !== -1) {
      current.splice(idx, 1);
    }
    saveQuickAccessShortcuts(current);
    return { success: true, shortcuts: current };
  } catch (err) {
    return { success: false, shortcuts: [] };
  }
}
