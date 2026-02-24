/**
 * Cache.gs — 3-Layer Cache System for CC ERP (FILE 1A)
 *
 * Layer 1: CacheService (script-level, 6-hour TTL)
 *          Populated on onOpen() with all FK-referenced master data.
 *          Key format: CACHE_<sheetName>
 *
 * Layer 2: PropertiesService (cross-file, refreshed daily at 7am IST)
 *          Stores data pulled from FILE_1B and FILE_1C so zero
 *          IMPORTRANGE latency during working hours.
 *          Key format: PROP_<sheetName>
 *
 * Layer 3: Smart Invalidation
 *          onEdit() clears only the edited master's cache entry in
 *          both Layer 1 and Layer 2. All other caches remain untouched.
 *
 * Performance targets:
 *   Sheet open       : 2-4 seconds
 *   FK dropdown      : < 0.5 seconds
 *   Attr name fill   : < 0.3 seconds
 */

// ---------------------------------------------------------------------------
//  CONSTANTS
// ---------------------------------------------------------------------------

/** Cache key prefix for Layer 1 (CacheService). */
var CACHE_PREFIX = 'CACHE_';

/** Property key prefix for Layer 2 (PropertiesService). */
var PROP_PREFIX = 'PROP_';

/** CacheService TTL in seconds (6 hours). */
var CACHE_TTL = 21600;

/**
 * PropertiesService has a 9 KB per-property limit.  We chunk JSON strings
 * into segments of this size when they exceed the limit and store them
 * across multiple keys with a _PART_N suffix.
 */
var PROP_CHUNK_SIZE = 8000;

/**
 * CacheService has a ~100 KB per-value limit.  Values larger than this
 * threshold are split into chunks stored under _CHUNK_0, _CHUNK_1, etc.
 * A meta key stores the chunk count for reassembly.
 */
var CACHE_CHUNK_SIZE = 90000;

/**
 * All local (FILE 1A) master sheets whose data feeds FK dropdowns,
 * attribute lookups, and other in-file references.  These are loaded
 * into Layer 1 on onOpen().
 */
var LOCAL_MASTERS = [
  'ARTICLE_MASTER',
  'RM_MASTER_FABRIC',
  'RM_MASTER_YARN',
  'RM_MASTER_WOVEN',
  'TRIM_MASTER',
  'TRIM_ATTR_NAMES',
  'TRIM_ATTR_VALUES',
  'CONSUMABLE_MASTER',
  'CON_ATTR_NAMES',
  'CON_ATTR_VALUES',
  'PACKAGING_MASTER',
  'PKG_ATTR_NAMES',
  'PKG_ATTR_VALUES',
  'ITEM_CATEGORIES',
  'UOM_MASTER',
  'HSN_MASTER',
  'COLOR_MASTER',
  'SIZE_MASTER',
  'FABRIC_TYPE_MASTER',
  'TAG_MASTER',
  'MASTER_RELATIONS'
];

/**
 * Cross-file sheets pulled from FILE 1B.
 * Requires CONFIG.FILE_1B_ID (set in Config.gs).
 */
var CROSS_FILE_1B_SHEETS = [
  'USER_MASTER',
  'SUPPLIER_MASTER',
  'ITEM_SUPPLIER_RATES'
];

/**
 * Cross-file sheets pulled from FILE 1C.
 * Requires CONFIG.FILE_1C_ID (set in Config.gs).
 */
var CROSS_FILE_1C_SHEETS = [
  'SUPPLIER_MASTER',
  'PAYMENT_TERMS_MASTER'
];

/**
 * Cross-file sheets pulled from FILE 2 (Procurement).
 * Requires CONFIG.FILE_IDS.FILE_2 (set in Config.gs).
 */
var CROSS_FILE_F2_SHEETS = [
  'PO_MASTER',
  'PO_LINE_ITEMS',
  'GRN_MASTER',
  'GRN_LINE_ITEMS',
  'MASTER_RELATIONS_F2'
];


// ===========================================================================
//  LAYER 1 — CacheService  (session-level, 6-hour TTL)
// ===========================================================================

/**
 * Reads every sheet listed in LOCAL_MASTERS from the active spreadsheet
 * and stores each as a JSON array in CacheService.
 *
 * Called from onOpen() so that all FK dropdown data is pre-warmed and
 * available in < 0.5 sec for the entire editing session.
 *
 * Sheets whose JSON exceeds the CacheService per-value limit (~100 KB)
 * are stored using chunked keys (_CHUNK_0, _CHUNK_1, ...) with a meta
 * key recording the chunk count.
 */
function cacheAllMasters() {
  var cache = CacheService.getScriptCache();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cachePayload = {};   // {key: jsonString} — for putAll batch write

  for (var i = 0; i < LOCAL_MASTERS.length; i++) {
    var sheetName = LOCAL_MASTERS[i];
    try {
      var data = readSheetData(sheetName);
      if (data && data.length > 0) {
        var key = CACHE_PREFIX + sheetName;
        var json = JSON.stringify(data);

        if (json.length < CACHE_CHUNK_SIZE) {
          // Small enough for batch write
          cachePayload[key] = json;
        } else {
          // Too large for a single CacheService value — use chunking
          setCacheDataChunked_(cache, key, json);
        }
      }
    } catch (e) {
      Logger.log('cacheAllMasters — skipped ' + sheetName + ': ' + e.message);
    }
  }

  // Batch-write everything that fits in one call
  if (Object.keys(cachePayload).length > 0) {
    cache.putAll(cachePayload, CACHE_TTL);
  }
}


/**
 * Stores a large JSON string in CacheService using chunked keys.
 * Creates: KEY_CHUNKS = chunkCount, KEY_CHUNK_0, KEY_CHUNK_1, ...
 *
 * @param {GoogleAppsScript.Cache.Cache} cache  CacheService instance.
 * @param {string} key   Base cache key.
 * @param {string} json  The JSON string to store.
 * @private
 */
function setCacheDataChunked_(cache, key, json) {
  var chunks = [];
  for (var offset = 0; offset < json.length; offset += CACHE_CHUNK_SIZE) {
    chunks.push(json.substring(offset, offset + CACHE_CHUNK_SIZE));
  }

  var payload = {};
  payload[key + '_CHUNKS'] = String(chunks.length);
  for (var i = 0; i < chunks.length; i++) {
    payload[key + '_CHUNK_' + i] = chunks[i];
  }

  // Write all chunks in batch calls (putAll has 100 KB total limit,
  // so we write chunks individually if there are many)
  if (chunks.length <= 2) {
    cache.putAll(payload, CACHE_TTL);
  } else {
    for (var k in payload) {
      cache.put(k, payload[k], CACHE_TTL);
    }
  }
  Logger.log('cacheAllMasters — chunked ' + key + ' into ' + chunks.length + ' parts (' + json.length + ' chars)');
}


/**
 * Reads a chunked value from CacheService.
 * Returns null if no chunks exist for the key.
 *
 * @param {GoogleAppsScript.Cache.Cache} cache  CacheService instance.
 * @param {string} key  Base cache key.
 * @return {string|null}  Reassembled JSON string, or null.
 * @private
 */
function getCacheDataChunked_(cache, key) {
  var countStr = cache.get(key + '_CHUNKS');
  if (!countStr) return null;

  var count = parseInt(countStr, 10);
  if (isNaN(count) || count <= 0) return null;

  var assembled = '';
  for (var i = 0; i < count; i++) {
    var part = cache.get(key + '_CHUNK_' + i);
    if (part === null) return null; // Incomplete — a chunk expired
    assembled += part;
  }
  return assembled;
}


/**
 * Retrieves cached data for a sheet with a 3-tier fallback:
 *   1. Layer 1  (CacheService)       — fastest, in-memory
 *   2. Layer 2  (PropertiesService)   — cross-file / persistent
 *   3. Live read from sheet           — guaranteed fresh
 *
 * On a live-read fallback the result is automatically written back to
 * Layer 1 so subsequent calls within the session are fast.
 *
 * @param  {string}  sheetName   Name of the sheet to retrieve.
 * @param  {string=} optFileId   Optional file ID for cross-file reads.
 * @return {Object[]}            Array of {header: value} row objects.
 */
function getCachedData(sheetName, optFileId) {
  // --- Layer 1: CacheService ---
  var cache = CacheService.getScriptCache();
  var key = CACHE_PREFIX + sheetName;
  var cached = cache.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      Logger.log('getCachedData L1 parse error for ' + sheetName + ': ' + e.message);
    }
  }

  // --- Layer 1 chunked: CacheService (large sheets stored in chunks) ---
  var chunked = getCacheDataChunked_(cache, key);
  if (chunked) {
    try {
      return JSON.parse(chunked);
    } catch (e) {
      Logger.log('getCachedData L1 chunked parse error for ' + sheetName + ': ' + e.message);
    }
  }

  // --- Layer 2: PropertiesService ---
  var propData = getCrossFileData(sheetName);
  if (propData && propData.length > 0) {
    // Promote back into Layer 1 for speed within this session
    setCacheData(sheetName, propData);
    return propData;
  }

  // --- Layer 3: Live read (fallback) ---
  var data = readSheetData(sheetName, optFileId);
  if (data && data.length > 0) {
    setCacheData(sheetName, data);
  }
  return data || [];
}


/**
 * Stores data in Layer 1 (CacheService) with standard TTL.
 *
 * @param {string}   sheetName  Sheet name used as cache key suffix.
 * @param {Object[]} data       Array of row objects to cache.
 */
function setCacheData(sheetName, data) {
  try {
    var cache = CacheService.getScriptCache();
    var key = CACHE_PREFIX + sheetName;
    var json = JSON.stringify(data);
    cache.put(key, json, CACHE_TTL);
  } catch (e) {
    Logger.log('setCacheData error for ' + sheetName + ': ' + e.message);
  }
}


// ===========================================================================
//  LAYER 2 — PropertiesService  (cross-file, daily 7am IST refresh)
// ===========================================================================

/**
 * Pulls all cross-file master data from FILE_1B and FILE_1C and stores
 * it in PropertiesService so that no IMPORTRANGE calls are needed
 * during normal working hours.
 *
 * Designed to run on a daily time-driven trigger at 7:00 AM IST
 * (see setupDailyRefreshTrigger()).
 *
 * Cross-file sheets:
 *   FILE 1B: USER_MASTER, SUPPLIER_MASTER, ITEM_SUPPLIER_RATES
 *   FILE 1C: SUPPLIER_MASTER, PAYMENT_TERMS_MASTER
 *
 * When SUPPLIER_MASTER exists in both 1B and 1C the canonical source
 * is FILE 1C (finance-owned).  FILE 1B holds a reference copy.  We
 * read from 1C and tag it as the single SUPPLIER_MASTER property.
 */
function refreshCrossFileProperties() {
  var file1bId = CONFIG.FILE_1B_ID;
  var file1cId = CONFIG.FILE_1C_ID;

  // --- FILE 1C sheets (finance — authoritative for SUPPLIER_MASTER) ---
  for (var i = 0; i < CROSS_FILE_1C_SHEETS.length; i++) {
    var sheetName = CROSS_FILE_1C_SHEETS[i];
    try {
      var data = readSheetData(sheetName, file1cId);
      if (data && data.length > 0) {
        setCrossFileData(sheetName, data);
        // Also warm Layer 1 so the first FK lookup of the day is instant
        setCacheData(sheetName, data);
      }
    } catch (e) {
      Logger.log('refreshCrossFileProperties — FILE_1C ' + sheetName + ': ' + e.message);
    }
  }

  // --- FILE 1B sheets (factory) ---
  for (var j = 0; j < CROSS_FILE_1B_SHEETS.length; j++) {
    var sheetName1B = CROSS_FILE_1B_SHEETS[j];
    // SUPPLIER_MASTER already loaded from 1C above — skip duplicate
    if (sheetName1B === 'SUPPLIER_MASTER') continue;
    try {
      var data1B = readSheetData(sheetName1B, file1bId);
      if (data1B && data1B.length > 0) {
        setCrossFileData(sheetName1B, data1B);
        setCacheData(sheetName1B, data1B);
      }
    } catch (e) {
      Logger.log('refreshCrossFileProperties — FILE_1B ' + sheetName1B + ': ' + e.message);
    }
  }

  // --- FILE 2 sheets (Procurement) ---
  var file2Id = CONFIG.FILE_IDS.FILE_2;
  if (file2Id && file2Id !== 'YOUR_FILE_2_SPREADSHEET_ID') {
    for (var k = 0; k < CROSS_FILE_F2_SHEETS.length; k++) {
      var sheetNameF2 = CROSS_FILE_F2_SHEETS[k];
      try {
        var dataF2 = readSheetData(sheetNameF2, file2Id);
        if (dataF2 && dataF2.length > 0) {
          setCrossFileData(sheetNameF2, dataF2);
          setCacheData(sheetNameF2, dataF2);
        }
      } catch (e) {
        Logger.log('refreshCrossFileProperties — FILE_2 ' + sheetNameF2 + ': ' + e.message);
      }
    }
  }

  Logger.log('refreshCrossFileProperties completed at ' + new Date().toISOString());
}


/**
 * Reads data for a sheet from PropertiesService (Layer 2).
 *
 * Handles chunked storage transparently: if the original JSON exceeded
 * PROP_CHUNK_SIZE it was split across PROP_<sheet>_PART_0, _PART_1, etc.
 *
 * @param  {string}   sheetName  Sheet name.
 * @return {Object[]|null}        Parsed array or null if not found.
 */
function getCrossFileData(sheetName) {
  var props = PropertiesService.getScriptProperties();
  var key = PROP_PREFIX + sheetName;

  // Try single-key storage first
  var raw = props.getProperty(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      Logger.log('getCrossFileData parse error for ' + sheetName + ': ' + e.message);
      return null;
    }
  }

  // Try chunked storage
  var assembled = '';
  var partIndex = 0;
  while (true) {
    var partKey = key + '_PART_' + partIndex;
    var part = props.getProperty(partKey);
    if (part === null) break;
    assembled += part;
    partIndex++;
  }

  if (assembled.length > 0) {
    try {
      return JSON.parse(assembled);
    } catch (e) {
      Logger.log('getCrossFileData chunked parse error for ' + sheetName + ': ' + e.message);
      return null;
    }
  }

  return null;
}


/**
 * Stores data in PropertiesService (Layer 2).
 *
 * PropertiesService has a ~9 KB per-property limit.  If the JSON string
 * exceeds PROP_CHUNK_SIZE it is split across multiple keys with a
 * _PART_N suffix, and the single-key entry is deleted.
 *
 * @param {string}   sheetName  Sheet name.
 * @param {Object[]} data       Array of row objects to store.
 */
function setCrossFileData(sheetName, data) {
  var props = PropertiesService.getScriptProperties();
  var key = PROP_PREFIX + sheetName;
  var json = JSON.stringify(data);

  // Clean up any existing chunks first
  clearPropertyChunks_(props, key);

  if (json.length <= PROP_CHUNK_SIZE) {
    props.setProperty(key, json);
  } else {
    // Remove single-key entry
    props.deleteProperty(key);
    // Write chunks
    var partIndex = 0;
    for (var offset = 0; offset < json.length; offset += PROP_CHUNK_SIZE) {
      var chunk = json.substring(offset, offset + PROP_CHUNK_SIZE);
      props.setProperty(key + '_PART_' + partIndex, chunk);
      partIndex++;
    }
  }
}


/**
 * Deletes all chunk keys (_PART_0, _PART_1, ...) and the single-key
 * entry for a given property key prefix.
 *
 * @param {PropertiesService.Properties} props  Properties instance.
 * @param {string} key  Base key (e.g. PROP_SUPPLIER_MASTER).
 * @private
 */
function clearPropertyChunks_(props, key) {
  // Delete single-key entry
  props.deleteProperty(key);
  // Delete any chunks
  var partIndex = 0;
  while (true) {
    var partKey = key + '_PART_' + partIndex;
    var exists = props.getProperty(partKey);
    if (exists === null) break;
    props.deleteProperty(partKey);
    partIndex++;
  }
}


// ===========================================================================
//  LAYER 3 — Smart Invalidation
// ===========================================================================

/**
 * Invalidates cache entries for a single master sheet in both Layer 1
 * (CacheService) and Layer 2 (PropertiesService).
 *
 * Called from onEdit() when a user modifies a master sheet so that
 * subsequent reads pick up the fresh data.  All other masters' caches
 * remain untouched.
 *
 * @param {string} sheetName  The sheet whose cache should be cleared.
 */
function invalidateCache(sheetName) {
  if (!sheetName) return;

  // Layer 1 — CacheService (single key + chunked keys)
  try {
    var cache = CacheService.getScriptCache();
    var key = CACHE_PREFIX + sheetName;
    cache.remove(key);

    // Also clear any chunked entries
    var countStr = cache.get(key + '_CHUNKS');
    if (countStr) {
      var count = parseInt(countStr, 10);
      var chunkKeys = [key + '_CHUNKS'];
      for (var i = 0; i < count; i++) {
        chunkKeys.push(key + '_CHUNK_' + i);
      }
      cache.removeAll(chunkKeys);
    }
  } catch (e) {
    Logger.log('invalidateCache L1 error for ' + sheetName + ': ' + e.message);
  }

  // Layer 2 — PropertiesService
  try {
    var props = PropertiesService.getScriptProperties();
    clearPropertyChunks_(props, PROP_PREFIX + sheetName);
  } catch (e) {
    Logger.log('invalidateCache L2 error for ' + sheetName + ': ' + e.message);
  }

  Logger.log('Cache invalidated for ' + sheetName);
}


/**
 * Nuclear option: clears ALL cached data in both Layer 1 and Layer 2.
 *
 * Use sparingly — this forces a full reload on next access.  Intended
 * for admin / debug scenarios only.
 */
function invalidateAllCaches() {
  // Layer 1 — remove every known master key
  try {
    var cache = CacheService.getScriptCache();
    var allKeys = [];
    var allSheets = LOCAL_MASTERS
      .concat(CROSS_FILE_1B_SHEETS)
      .concat(CROSS_FILE_1C_SHEETS)
      .concat(CROSS_FILE_F2_SHEETS);

    // Deduplicate (SUPPLIER_MASTER appears in both 1B and 1C lists)
    var seen = {};
    for (var i = 0; i < allSheets.length; i++) {
      if (!seen[allSheets[i]]) {
        allKeys.push(CACHE_PREFIX + allSheets[i]);
        seen[allSheets[i]] = true;
      }
    }
    cache.removeAll(allKeys);
  } catch (e) {
    Logger.log('invalidateAllCaches L1 error: ' + e.message);
  }

  // Layer 2 — delete all PROP_ keys
  try {
    var props = PropertiesService.getScriptProperties();
    var allProps = props.getProperties();
    var keysToDelete = Object.keys(allProps).filter(function(k) {
      return k.indexOf(PROP_PREFIX) === 0;
    });
    for (var j = 0; j < keysToDelete.length; j++) {
      props.deleteProperty(keysToDelete[j]);
    }
  } catch (e) {
    Logger.log('invalidateAllCaches L2 error: ' + e.message);
  }

  Logger.log('All caches invalidated (Layer 1 + Layer 2)');
}


// ===========================================================================
//  HELPER — Sheet Data Reader
// ===========================================================================

/**
 * Reads all data rows from a sheet and returns them as an array of
 * objects keyed by header names.
 *
 * Assumes the standard CC ERP row structure:
 *   Row 1 — banner (ignored)
 *   Row 2 — column headers
 *   Row 3 — descriptions (ignored)
 *   Row 4+ — data
 *
 * @param  {string}  sheetName  Name of the sheet to read.
 * @param  {string=} optFileId  Optional spreadsheet file ID for
 *                               cross-file reads.  Omit for the
 *                               active spreadsheet.
 * @return {Object[]}           Array of row objects [{header: value}, ...].
 *                               Empty array if sheet not found or empty.
 */
function readSheetData(sheetName, optFileId) {
  var ss;
  if (optFileId) {
    ss = SpreadsheetApp.openById(optFileId);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('readSheetData — sheet not found: ' + sheetName);
    return [];
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  // Need at least header row (2) + one data row (4)
  if (lastRow < 4 || lastCol < 1) return [];

  // Row 2 = headers
  var headers = sheet.getRange(2, 1, 1, lastCol).getValues()[0];

  // Rows 4..lastRow = data
  var dataRange = sheet.getRange(4, 1, lastRow - 3, lastCol);
  var values = dataRange.getValues();
  var result = [];

  for (var r = 0; r < values.length; r++) {
    var row = values[r];

    // Skip completely empty rows and category divider rows
    // (divider rows typically have only column A filled with a label)
    var nonEmptyCount = 0;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null && row[c] !== undefined) {
        nonEmptyCount++;
      }
    }
    if (nonEmptyCount < 2) continue;

    var obj = {};
    for (var h = 0; h < headers.length; h++) {
      var header = String(headers[h]).trim();
      if (header) {
        obj[header] = row[h];
      }
    }
    result.push(obj);
  }

  return result;
}


// ===========================================================================
//  TRIGGER SETUP — Daily 7am IST refresh for Layer 2
// ===========================================================================

/**
 * Creates (or replaces) a daily time-driven trigger that fires
 * refreshCrossFileProperties() at 7:00 AM IST every day.
 *
 * Safe to call multiple times: deletes any existing trigger for
 * refreshCrossFileProperties before creating a new one, so duplicates
 * are avoided.
 *
 * Run once manually (or from onOpen on first install) to set up.
 */
function setupDailyRefreshTrigger() {
  // Remove any existing triggers for the target function
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'refreshCrossFileProperties') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create new daily trigger at 7am IST
  // Apps Script uses the project timezone (Asia/Kolkata in appsscript.json)
  // atHour(7) means 7:00 AM in the project timezone
  ScriptApp.newTrigger('refreshCrossFileProperties')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .nearMinute(0)
    .create();

  Logger.log('Daily refresh trigger set for refreshCrossFileProperties at 7:00 AM IST');
}


// ===========================================================================
//  onOpen HOOK — Pre-warm Layer 1
// ===========================================================================

/**
 * Called automatically when the spreadsheet is opened.
 *
 * Performs a one-time parallel batch read of all local master sheets
 * and stores them in CacheService (Layer 1) so that FK dropdowns and
 * attribute lookups respond in < 0.5 sec throughout the session.
 *
 * NOTE: This function should be called from the main onOpen() trigger
 * in Code.gs / Main.gs.  If there is no central onOpen, this file's
 * onOpenCache() can be registered as a simple trigger directly.
 */
function onOpenCache() {
  try {
    cacheAllMasters();
    Logger.log('Layer 1 cache warmed on open (' + LOCAL_MASTERS.length + ' masters)');
  } catch (e) {
    Logger.log('onOpenCache error: ' + e.message);
    // Non-fatal — the getCachedData fallback will do live reads
  }
}


// ===========================================================================
//  onEdit HOOK — Smart Invalidation entry point
// ===========================================================================

/**
 * Called from the central onEdit(e) trigger.
 *
 * Determines which master sheet was edited and invalidates only that
 * sheet's cache in both Layer 1 and Layer 2.  All other caches remain
 * untouched, keeping FK lookups fast for non-edited masters.
 *
 * @param {Object} e  The onEdit event object from Apps Script.
 */
function onEditCache(e) {
  if (!e || !e.source) return;

  try {
    var sheetName = e.source.getActiveSheet().getName();

    // Only invalidate if the edited sheet is a known master
    var allKnown = LOCAL_MASTERS
      .concat(CROSS_FILE_1B_SHEETS)
      .concat(CROSS_FILE_1C_SHEETS)
      .concat(CROSS_FILE_F2_SHEETS);

    for (var i = 0; i < allKnown.length; i++) {
      if (allKnown[i] === sheetName) {
        invalidateCache(sheetName);
        return;
      }
    }
    // Edited sheet is not a cached master — do nothing
  } catch (e) {
    Logger.log('onEditCache error: ' + e.message);
  }
}
