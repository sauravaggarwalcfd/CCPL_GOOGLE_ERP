/**
 * =============================================================================
 * CCPL ERP SYSTEM - CONFIGURATION & CONSTANTS
 * =============================================================================
 * Confidence Clothing Pvt. Ltd. (CCPL) - Google Apps Script ERP
 *
 * File:    Config.gs (File 1A - Items Master)
 * Purpose: Central configuration object containing all constants, sheet names,
 *          code formats, cache keys, styling rules, access roles, and helpers.
 * =============================================================================
 */

var CONFIG = {

  // ===========================================================================
  // GOOGLE SHEET FILE IDS
  // ===========================================================================
  // Replace these placeholder values with actual Google Spreadsheet IDs.
  // File 1A: Items Master        (23 sheets)
  // File 1B: Factory Master      (19 sheets)
  // File 1C: Finance Master      (6 sheets)
  // ===========================================================================

  FILE_IDS: {
    FILE_1A: '1eaDbKEJpty6c7_FrVm5wElOce_z4yHRMr3E-SAskdMc',
    FILE_1B: '1WjtpBhXwYVBVnPSDbzTWm8X0nyVhzsailBpRqXi7Se4',
    FILE_1C: '1t3zHrORAjZJ2cVr8bru4HE4kUvyYdm5RDICA8NkiDX8'
  },

  // ===========================================================================
  // SHEET NAMES - FILE 1A (Items Master - 23 sheets)
  // ===========================================================================

  SHEETS: {
    // -- Article / Finished Goods --
    ARTICLE_MASTER:       'ARTICLE_MASTER',

    // -- Raw Materials --
    RM_MASTER_FABRIC:     'RM_MASTER_FABRIC',
    RM_MASTER_YARN:       'RM_MASTER_YARN',
    RM_MASTER_WOVEN:      'RM_MASTER_WOVEN',

    // -- Trims --
    TRIM_MASTER:          'TRIM_MASTER',
    TRIM_ATTR_NAMES:      'TRIM_ATTR_NAMES',
    TRIM_ATTR_VALUES:     'TRIM_ATTR_VALUES',

    // -- Consumables --
    CONSUMABLE_MASTER:    'CONSUMABLE_MASTER',
    CON_ATTR_NAMES:       'CON_ATTR_NAMES',
    CON_ATTR_VALUES:      'CON_ATTR_VALUES',

    // -- Packaging --
    PACKAGING_MASTER:     'PACKAGING_MASTER',
    PKG_ATTR_NAMES:       'PKG_ATTR_NAMES',
    PKG_ATTR_VALUES:      'PKG_ATTR_VALUES',

    // -- Reference / Lookup Masters --
    ITEM_CATEGORIES:      'ITEM_CATEGORIES',
    UOM_MASTER:           'UOM_MASTER',
    HSN_MASTER:           'HSN_MASTER',
    COLOR_MASTER:         'COLOR_MASTER',
    SIZE_MASTER:          'SIZE_MASTER',
    GARMENT_COMPONENT:    'GARMENT_COMPONENT',
    FABRIC_TYPE_MASTER:   'FABRIC_TYPE_MASTER',
    TAG_MASTER:           'TAG_MASTER',

    // -- System / Audit --
    ITEM_CHANGE_LOG:      'ITEM_CHANGE_LOG',

    // -- Relations --
    MASTER_RELATIONS:     'MASTER_RELATIONS'
  },

  // ===========================================================================
  // SHEET NAMES - FILE 1B (Factory Master - 21 sheets)
  // ===========================================================================

  SHEETS_1B: {
    USER_MASTER:          'USER_MASTER',
    ROLE_MASTER:          'ROLE_MASTER',
    DEPARTMENT_MASTER:    'DEPARTMENT_MASTER',
    DESIGNATION_MASTER:   'DESIGNATION_MASTER',
    SHIFT_MASTER:         'SHIFT_MASTER',
    CUSTOMER_MASTER:      'CUSTOMER_MASTER',
    CONTRACTOR_MASTER:    'CONTRACTOR_MASTER',
    WAREHOUSE_MASTER:     'WAREHOUSE_MASTER',
    STORAGE_BIN_MASTER:   'STORAGE_BIN_MASTER',
    FACTORY_MASTER:       'FACTORY_MASTER',
    MACHINE_MASTER:       'MACHINE_MASTER',
    MACHINE_CATEGORY:     'MACHINE_CATEGORY',
    ASSET_MASTER:         'ASSET_MASTER',
    MAINTENANCE_SCHEDULE: 'MAINTENANCE_SCHEDULE',
    SPARE_PARTS_MASTER:   'SPARE_PARTS_MASTER',
    PROCESS_MASTER:       'PROCESS_MASTER',
    WORK_CENTER_MASTER:   'WORK_CENTER_MASTER',
    JOBWORK_PARTY_MASTER: 'JOBWORK_PARTY_MASTER',
    ITEM_SUPPLIER_RATES:  'ITEM_SUPPLIER_RATES',
    PRESENCE:             'PRESENCE'
  },

  // ===========================================================================
  // SHEET NAMES - FILE 1C (Finance Master - 6 sheets)
  // ===========================================================================

  SHEETS_1C: {
    SUPPLIER_MASTER:       'SUPPLIER_MASTER',
    PAYMENT_TERMS_MASTER:  'PAYMENT_TERMS_MASTER',
    TAX_MASTER:            'TAX_MASTER',
    BANK_MASTER:           'BANK_MASTER',
    COST_CENTER_MASTER:    'COST_CENTER_MASTER',
    ACCOUNT_MASTER:        'ACCOUNT_MASTER'
  },

  // ===========================================================================
  // ITEM CODE FORMATS
  // ===========================================================================
  // Defines the prefix and sequence pattern for auto-generated item codes.
  //   prefix      - static string prepended to the sequence number
  //   seqDigits   - zero-padded width of the numeric sequence
  //   perCategory - when true, sequence resets per category code
  //   pattern     - human-readable description of the format
  // ===========================================================================

  ITEM_CODE_FORMATS: {
    RM_MASTER_FABRIC: {
      prefix:      'RM-FAB-',
      seqDigits:   3,
      perCategory: false,
      pattern:     'RM-FAB-###'
    },
    RM_MASTER_YARN: {
      prefix:      'RM-YRN-',
      seqDigits:   3,
      perCategory: false,
      pattern:     'RM-YRN-###'
    },
    RM_MASTER_WOVEN: {
      prefix:      'RM-WVN-',
      seqDigits:   3,
      perCategory: false,
      pattern:     'RM-WVN-###'
    },
    TRIM_MASTER: {
      prefix:      'TRM-',
      seqDigits:   3,
      perCategory: true,
      pattern:     'TRM-{CAT}-###'
    },
    CONSUMABLE_MASTER: {
      prefix:      'CON-',
      seqDigits:   3,
      perCategory: true,
      pattern:     'CON-{CAT}-###'
    },
    PACKAGING_MASTER: {
      prefix:      'PKG-',
      seqDigits:   3,
      perCategory: true,
      pattern:     'PKG-{CAT}-###'
    },
    SUPPLIER_MASTER: {
      prefix:      'SUP-',
      seqDigits:   3,
      perCategory: false,
      pattern:     'SUP-###'
    },
    ITEM_SUPPLIER_RATES: {
      prefix:      'ISR-',
      seqDigits:   5,
      perCategory: false,
      pattern:     'ISR-#####'
    }
  },

  // ===========================================================================
  // TRIM CATEGORY CODES
  // ===========================================================================
  // Each trim belongs to one of these categories. BADGE (BDG) is treated as
  // a sub-category under Labels (LBL).
  // ===========================================================================

  TRIM_CATEGORY_CODES: {
    THD: 'Thread',
    LBL: 'Label',
    ELS: 'Elastic',
    ZIP: 'Zipper',
    BUT: 'Button',
    TPE: 'Tape',
    DRW: 'Drawcord',
    VLC: 'Velcro',
    RVT: 'Rivet',
    THP: 'Thread Pad',
    OTH: 'Other',
    BDG: 'Badge'          // Sub-category of LBL (Label)
  },

  TRIM_CATEGORY_LIST: ['THD', 'LBL', 'ELS', 'ZIP', 'BUT', 'TPE', 'DRW', 'VLC', 'RVT', 'THP', 'OTH', 'BDG'],

  // ===========================================================================
  // TRIM ATTRIBUTE COUNTS PER CATEGORY
  // ===========================================================================
  // Number of configurable attribute columns each trim category supports.
  // ===========================================================================

  TRIM_ATTR_COUNTS: {
    THD: 4,
    LBL: 2,
    ELS: 3,
    ZIP: 4,
    BUT: 4,
    TPE: 2,
    DRW: 2,
    VLC: 2,
    RVT: 3,
    THP: 3
  },

  // ===========================================================================
  // STATUS VALUES
  // ===========================================================================

  STATUS: {
    ACTIVE:        'Active',
    INACTIVE:      'Inactive',
    DEVELOPMENT:   'Development',
    DISCONTINUED:  'Discontinued'
  },

  STATUS_LIST: ['Active', 'Inactive', 'Development', 'Discontinued'],

  // ===========================================================================
  // PRIORITY VALUES (Item-Supplier Rates)
  // ===========================================================================

  PRIORITY: {
    PRIMARY:   'Primary',
    SECONDARY: 'Secondary',
    BACKUP:    'Backup',
    APPROVED:  'Approved'
  },

  PRIORITY_LIST: ['Primary', 'Secondary', 'Backup', 'Approved'],

  // ===========================================================================
  // UNITS OF MEASUREMENT
  // ===========================================================================

  UOM: {
    CONE: 'CONE',
    MTR:  'MTR',
    PCS:  'PCS',
    KG:   'KG',
    SET:  'SET',
    ROLL: 'ROLL'
  },

  UOM_LIST: ['CONE', 'MTR', 'PCS', 'KG', 'SET', 'ROLL'],

  // ===========================================================================
  // FK / HEADER PREFIX SYMBOLS
  // ===========================================================================
  // These unicode symbols prefix column headers to indicate field behaviour.
  //
  //   Symbol   Meaning
  //   ------   ------------------------------------------------
  //     ->     FK to (foreign key reference to another sheet)
  //     <-     Auto display from (auto-populated from FK source)
  //     <->    Two-way sync
  //     SUM    Calculated / derived field
  //     !!     Mandatory field
  //     #      Auto-generated value
  //     KEY    Primary key
  // ===========================================================================

  HEADER_PREFIXES: {
    FK_TO:          '\u2192',      // -> (FK to)
    AUTO_DISPLAY:   '\u2190',      // <- (auto display from)
    TWO_WAY_SYNC:  '\u27F7',      // <-> (two-way sync)
    CALCULATED:     '\u2211',      // SUM (calculated)
    MANDATORY:      '\u26A0',      // !! (mandatory)
    AUTO_GENERATED: '#',           // # (auto-generated)
    PRIMARY_KEY:    '\uD83D\uDD11' // KEY (primary key)
  },

  // ===========================================================================
  // SHEET TAB COLORS (hex without #, used by setTabColor)
  // ===========================================================================

  TAB_COLORS: {
    FILE_1A_ITEMS:        '#1A1A2E',   // Dark Navy - general File 1A sheets
    TRIM_MASTER:          '#4A0E4E',   // Purple - TRIM_MASTER
    TRIM_ATTR_NAMES:      '#2D0A4E',   // Deeper Purple - TRIM_ATTR_NAMES
    TRIM_ATTR_VALUES:     '#1A0A3A',   // Deeper Purple - TRIM_ATTR_VALUES
    FILE_1B_FACTORY:      '#2C3E50',   // Dark Slate - File 1B sheets
    ITEM_SUPPLIER_RATES:  '#004D40',   // Teal - ITEM_SUPPLIER_RATES
    FILE_1C_FINANCE:      '#1A3A4A'    // Dark Steel - File 1C sheets
  },

  // ===========================================================================
  // ROW STRUCTURE & FREEZE SETTINGS
  // ===========================================================================
  // Row 1: Banner         - dark background, white text
  // Row 2: Headers        - red background (#CC0000), white bold text
  // Row 3: Descriptions   - light blue background (#D6EAF8), italic text
  // Row 4+: Data rows
  // Freeze: rows 1-3 frozen (freeze at row 4, column A)
  // ===========================================================================

  ROW_STRUCTURE: {
    BANNER_ROW:       1,
    HEADER_ROW:       2,
    DESCRIPTION_ROW:  3,
    DATA_START_ROW:   4,
    FREEZE_ROW:       3,     // Number of rows to freeze (rows 1..3)
    FREEZE_COL:       1      // Number of columns to freeze (column A)
  },

  // ===========================================================================
  // ROW / CELL STYLING
  // ===========================================================================

  STYLES: {
    BANNER: {
      background:  '#1A1A2E',
      fontColor:   '#FFFFFF',
      fontWeight:  'bold',
      fontSize:    12
    },
    HEADER: {
      background:  '#CC0000',
      fontColor:   '#FFFFFF',
      fontWeight:  'bold',
      fontSize:    10
    },
    DESCRIPTION: {
      background:  '#D6EAF8',
      fontColor:   '#333333',
      fontStyle:   'italic',
      fontSize:    9
    },
    DATA: {
      background:  '#FFFFFF',
      fontColor:   '#000000',
      fontWeight:  'normal',
      fontStyle:   'normal',
      fontSize:    10
    }
  },

  // ===========================================================================
  // 3-LAYER CACHE CONFIGURATION
  // ===========================================================================
  //
  // Layer 1: CacheService (in-memory, fast)
  //   - Expiry: 21600 seconds (6 hours)
  //
  // Layer 2: PropertiesService (persistent, script-scoped)
  //   - Refresh: daily at 07:00 IST via time-driven trigger
  //
  // Layer 3: Direct Sheet read (fallback, slowest)
  //
  // Each master sheet has a dedicated cache key.
  // ===========================================================================

  CACHE: {
    LAYER1_EXPIRY_SECONDS: 21600,   // 6 hours

    LAYER2_REFRESH_HOUR:   7,       // 07:00 IST daily
    LAYER2_TIMEZONE:       'Asia/Kolkata',

    KEYS: {
      ARTICLE_MASTER:     'CACHE_ARTICLE_MASTER',
      RM_MASTER_FABRIC:   'CACHE_RM_MASTER_FABRIC',
      RM_MASTER_YARN:     'CACHE_RM_MASTER_YARN',
      RM_MASTER_WOVEN:    'CACHE_RM_MASTER_WOVEN',
      TRIM_MASTER:        'CACHE_TRIM_MASTER',
      TRIM_ATTR_NAMES:    'CACHE_TRIM_ATTR_NAMES',
      TRIM_ATTR_VALUES:   'CACHE_TRIM_ATTR_VALUES',
      CONSUMABLE_MASTER:  'CACHE_CONSUMABLE_MASTER',
      CON_ATTR_NAMES:     'CACHE_CON_ATTR_NAMES',
      CON_ATTR_VALUES:    'CACHE_CON_ATTR_VALUES',
      PACKAGING_MASTER:   'CACHE_PACKAGING_MASTER',
      PKG_ATTR_NAMES:     'CACHE_PKG_ATTR_NAMES',
      PKG_ATTR_VALUES:    'CACHE_PKG_ATTR_VALUES',
      ITEM_CATEGORIES:    'CACHE_ITEM_CATEGORIES',
      UOM_MASTER:         'CACHE_UOM_MASTER',
      HSN_MASTER:         'CACHE_HSN_MASTER',
      COLOR_MASTER:       'CACHE_COLOR_MASTER',
      SIZE_MASTER:        'CACHE_SIZE_MASTER',
      FABRIC_TYPE_MASTER: 'CACHE_FABRIC_TYPE_MASTER',
      TAG_MASTER:         'CACHE_TAG_MASTER',
      ITEM_CHANGE_LOG:    'CACHE_ITEM_CHANGE_LOG',
      MASTER_RELATIONS:   'CACHE_MASTER_RELATIONS'
    }
  },

  // ===========================================================================
  // ACCESS ROLES
  // ===========================================================================

  ROLES: {
    SUPER_ADMIN:    'SUPER_ADMIN',
    ADMIN:          'ADMIN',
    PURCHASE_MGR:   'PURCHASE_MGR',
    PRODUCTION_MGR: 'PRODUCTION_MGR',
    STORE_KEEPER:   'STORE_KEEPER',
    ACCOUNTS:       'ACCOUNTS',
    VIEW_ONLY:      'VIEW_ONLY'
  },

  ROLE_LIST: [
    'SUPER_ADMIN',
    'ADMIN',
    'PURCHASE_MGR',
    'PRODUCTION_MGR',
    'STORE_KEEPER',
    'ACCOUNTS',
    'VIEW_ONLY'
  ],

  // ===========================================================================
  // ATTRIBUTE SYSTEM CONFIGURATION
  // ===========================================================================
  // The attribute system supports dynamic attributes for Trims, Consumables,
  // and Packaging.  Each category can define a set number of named attributes
  // whose allowed values are stored in the corresponding *_ATTR_VALUES sheet.
  // ===========================================================================

  ATTR_SYSTEMS: {
    TRIM: {
      masterSheet:     'TRIM_MASTER',
      attrNamesSheet:  'TRIM_ATTR_NAMES',
      attrValuesSheet: 'TRIM_ATTR_VALUES',
      categories:      ['THD', 'LBL', 'ELS', 'ZIP', 'BUT', 'TPE', 'DRW', 'VLC', 'RVT', 'THP'],
      attrCounts: {
        THD: 4,
        LBL: 2,
        ELS: 3,
        ZIP: 4,
        BUT: 4,
        TPE: 2,
        DRW: 2,
        VLC: 2,
        RVT: 3,
        THP: 3
      }
    },
    CONSUMABLE: {
      masterSheet:     'CONSUMABLE_MASTER',
      attrNamesSheet:  'CON_ATTR_NAMES',
      attrValuesSheet: 'CON_ATTR_VALUES',
      categories:      [],
      attrCounts:      {}
    },
    PACKAGING: {
      masterSheet:     'PACKAGING_MASTER',
      attrNamesSheet:  'PKG_ATTR_NAMES',
      attrValuesSheet: 'PKG_ATTR_VALUES',
      categories:      [],
      attrCounts:      {}
    }
  },

  // ===========================================================================
  // MISCELLANEOUS
  // ===========================================================================

  SYSTEM: {
    APP_NAME:      'CCPL ERP',
    COMPANY_NAME:  'Confidence Clothing Pvt. Ltd.',
    VERSION:       '1.0.0',
    TIMEZONE:      'Asia/Kolkata',
    DATE_FORMAT:   'dd-MMM-yyyy',
    DATETIME_FORMAT: 'dd-MMM-yyyy HH:mm:ss'
  }

};


// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets a sheet from the active (bound) spreadsheet by name.
 *
 * @param  {string}                name - The sheet/tab name to retrieve.
 * @return {GoogleAppsScript.Spreadsheet.Sheet|null}
 *         The Sheet object, or null if no sheet with that name exists.
 */
function getSheetByName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('CONFIG :: getSheetByName - No active spreadsheet found.');
  }
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    Logger.log('CONFIG :: getSheetByName - Sheet "' + name + '" not found in active spreadsheet.');
    return null;
  }
  return sheet;
}


/**
 * Opens a spreadsheet by its file ID and returns the requested sheet.
 * Use this to read/write sheets that live in a different Google Sheets file
 * (e.g. File 1B or File 1C from within File 1A scripts).
 *
 * @param  {string}                fileId    - The Google Spreadsheet file ID.
 * @param  {string}                sheetName - The sheet/tab name to retrieve.
 * @return {GoogleAppsScript.Spreadsheet.Sheet|null}
 *         The Sheet object, or null if the sheet name is not found.
 * @throws {Error} If the spreadsheet cannot be opened (invalid ID or no access).
 */
function getCrossFileSheet(fileId, sheetName) {
  if (!fileId || fileId.indexOf('YOUR_') === 0) {
    throw new Error(
      'CONFIG :: getCrossFileSheet - Invalid or placeholder file ID: "' + fileId + '". ' +
      'Please update CONFIG.FILE_IDS with the real Spreadsheet ID.'
    );
  }

  var ss;
  try {
    ss = SpreadsheetApp.openById(fileId);
  } catch (e) {
    throw new Error(
      'CONFIG :: getCrossFileSheet - Unable to open spreadsheet with ID "' + fileId + '". ' +
      'Check that the ID is correct and that the script has access. Original error: ' + e.message
    );
  }

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(
      'CONFIG :: getCrossFileSheet - Sheet "' + sheetName + '" not found in spreadsheet "' + fileId + '".'
    );
    return null;
  }
  return sheet;
}
