# CC ERP — ITEM_CATEGORIES GAS Connection Guide
## Google Apps Script API for 3-Level Category Tree

**Version:** V8 Update — Feb 2026  
**Sheet:** `ITEM_CATEGORIES` (Sheet 14 in FILE 1A)  
**Structure:** R1 Banner, R2 Headers, R3 Descriptions, R4+ Data. Freeze A4.

---

## 1. SHEET STRUCTURE (Updated V8)

| Col | Header | Type | Description |
|-----|--------|------|-------------|
| A | Category Code | 🔑 Auto | `CAT-001` format. GAS generates. |
| B | L1 Division | ⚠ Mandatory | SELECTABLE for Apparel: Men's/Women's/Kids/Unisex. FIXED for all others. |
| C | L2 Type | ⚠ Mandatory | Product family. Cascades from L1. |
| D | L3 Style | ⚠ Mandatory | Most specific level. Cascades from L2. |
| E | Item Master Sheet | ⚠ Mandatory | Dropdown: ARTICLE / RM-FABRIC / RM-YARN / RM-WOVEN / TRIM / CONSUMABLE / PACKAGING |
| F | Default HSN | Text | Auto-suggested from L2, user can override. |
| G | Active | Dropdown | Yes / No |
| H | Remarks | Text | Optional |
| I | L1 Behavior | Auto | FIXED or SELECTABLE. GAS sets based on Master. |

---

## 2. L1 BEHAVIOR RULES

The key architectural change: L1 is NOT the same for every master.

| Item Master | L1 Behavior | L1 Value | L2 Cascades From | L3 Cascades From |
|-------------|-------------|----------|-------------------|-------------------|
| **ARTICLE** | **SELECTABLE** | User picks: Men's Apparel / Women's Apparel / Kids Apparel / Unisex Apparel | L1 selection | L2 selection |
| **RM-FABRIC** | FIXED | "Raw Material" | L1 (auto) → "Knit Fabric" | L2 selection |
| **RM-YARN** | FIXED | "Raw Material" | L1 (auto) → "Yarn" | L2 selection |
| **RM-WOVEN** | FIXED | "Raw Material" | L1 (auto) → "Woven / Interlining" | L2 selection |
| **TRIM** | FIXED | "Trim" | L1 (auto) → 11 trim categories | L2 selection |
| **CONSUMABLE** | FIXED | "Consumable" | L1 (auto) → 6 consumable categories | L2 selection |
| **PACKAGING** | FIXED | "Packaging" | L1 (auto) → 5 packaging categories | L2 selection |

**Why SELECTABLE for Apparel?**  
Apparel needs filtering by target audience (Men's/Women's/Kids/Unisex) as the first-level distinction. This is available as a filter across all ERP modules. For all other masters, L1 is simply the master type name — fixed and auto-set.

---

## 3. GAS MODULE — `CategoryEngine.gs`

### 3A. Code Generation

```javascript
/**
 * Generate next CAT-xxx code
 * Reads ITEM_CATEGORIES, finds max code, increments
 */
function generateCategoryCode() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('ITEM_CATEGORIES');
  const codes = ws.getRange('A4:A' + ws.getLastRow()).getValues()
    .flat()
    .filter(v => v && String(v).startsWith('CAT-'))
    .map(v => parseInt(String(v).replace('CAT-', ''), 10))
    .filter(n => !isNaN(n));
  
  const next = codes.length ? Math.max(...codes) + 1 : 1;
  return 'CAT-' + String(next).padStart(3, '0');
}
```

### 3B. Get L1 Options (Cascading Step 1)

```javascript
/**
 * Returns L1 dropdown options based on selected master
 * Called by React frontend via google.script.run
 * 
 * @param {string} masterSheet - ARTICLE | RM-FABRIC | RM-YARN | etc.
 * @returns {Object} { behavior: 'FIXED'|'SELECTABLE', options: string[], fixedValue?: string }
 */
function getL1Options(masterSheet) {
  const L1_CONFIG = {
    'ARTICLE':     { behavior: 'SELECTABLE', options: ["Men's Apparel", "Women's Apparel", "Kids Apparel", "Unisex Apparel"] },
    'RM-FABRIC':   { behavior: 'FIXED', fixedValue: 'Raw Material' },
    'RM-YARN':     { behavior: 'FIXED', fixedValue: 'Raw Material' },
    'RM-WOVEN':    { behavior: 'FIXED', fixedValue: 'Raw Material' },
    'TRIM':        { behavior: 'FIXED', fixedValue: 'Trim' },
    'CONSUMABLE':  { behavior: 'FIXED', fixedValue: 'Consumable' },
    'PACKAGING':   { behavior: 'FIXED', fixedValue: 'Packaging' },
  };
  
  const config = L1_CONFIG[masterSheet];
  if (!config) throw new Error('Unknown master: ' + masterSheet);
  
  if (config.behavior === 'FIXED') {
    return { behavior: 'FIXED', options: [config.fixedValue], fixedValue: config.fixedValue };
  }
  return { behavior: 'SELECTABLE', options: config.options };
}
```

### 3C. Get L2 Options (Cascading Step 2)

```javascript
/**
 * Returns L2 dropdown options based on master + L1 selection
 * Reads from ITEM_CATEGORIES sheet — distinct L2 values where L1 matches
 * 
 * @param {string} masterSheet
 * @param {string} l1Value
 * @returns {string[]} Array of unique L2 values
 */
function getL2Options(masterSheet, l1Value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('ITEM_CATEGORIES');
  const data = ws.getRange('A4:I' + ws.getLastRow()).getValues();
  
  const l2Set = new Set();
  data.forEach(row => {
    const [code, l1, l2, l3, master, hsn, active] = row;
    if (master === masterSheet && l1 === l1Value && active === 'Yes' && l2) {
      l2Set.add(l2);
    }
  });
  
  return Array.from(l2Set).sort();
}
```

### 3D. Get L3 Options (Cascading Step 3)

```javascript
/**
 * Returns L3 dropdown options based on master + L1 + L2
 * 
 * @param {string} masterSheet
 * @param {string} l1Value
 * @param {string} l2Value
 * @returns {Object[]} Array of { code, l3, hsn }
 */
function getL3Options(masterSheet, l1Value, l2Value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('ITEM_CATEGORIES');
  const data = ws.getRange('A4:I' + ws.getLastRow()).getValues();
  
  return data
    .filter(row => row[4] === masterSheet && row[1] === l1Value && row[2] === l2Value && row[6] === 'Yes')
    .map(row => ({ code: row[0], l3: row[3], hsn: row[5] }));
}
```

### 3E. Create New Category

```javascript
/**
 * Create a new ITEM_CATEGORIES row
 * Validates no duplicate L1+L2+L3+Master combination
 * 
 * @param {Object} formData - { master, l1, l2, l3, hsn, remarks }
 * @returns {Object} { success, code, error? }
 */
function createCategory(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('ITEM_CATEGORIES');
  const data = ws.getRange('A4:I' + ws.getLastRow()).getValues();
  
  // Duplicate check
  const dup = data.find(row =>
    row[1] === formData.l1 && row[2] === formData.l2 &&
    row[3] === formData.l3 && row[4] === formData.master
  );
  if (dup) {
    return { success: false, error: 'Duplicate: ' + dup[0] + ' already has this L1/L2/L3 combination' };
  }
  
  const code = generateCategoryCode();
  const l1Config = getL1Options(formData.master);
  const behavior = l1Config.behavior;
  
  const newRow = ws.getLastRow() + 1;
  ws.getRange(newRow, 1, 1, 9).setValues([[
    code,
    formData.l1,
    formData.l2,
    formData.l3,
    formData.master,
    formData.hsn || '',
    'Yes',
    formData.remarks || '',
    behavior,
  ]]);
  
  // Lock the code cell
  const codeCellRange = ws.getRange(newRow, 1);
  const protection = codeCellRange.protect().setDescription('Auto-generated CAT code');
  
  // Log to ITEM_CHANGE_LOG
  logChange('ITEM_CATEGORIES', code, 'CREATE', 'New category: ' + formData.l1 + ' > ' + formData.l2 + ' > ' + formData.l3);
  
  // Invalidate cache
  CacheService.getScriptCache().remove('item_categories');
  
  return { success: true, code: code };
}
```

### 3F. Update Category

```javascript
/**
 * Update an existing category row
 * 
 * @param {string} catCode - e.g. CAT-001
 * @param {Object} updates - { l1?, l2?, l3?, hsn?, active?, remarks? }
 * @returns {Object} { success, error? }
 */
function updateCategory(catCode, updates) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('ITEM_CATEGORIES');
  const data = ws.getRange('A4:I' + ws.getLastRow()).getValues();
  
  const rowIdx = data.findIndex(row => row[0] === catCode);
  if (rowIdx === -1) return { success: false, error: 'Code not found: ' + catCode };
  
  const excelRow = rowIdx + 4; // Row 4 = first data row
  const current = data[rowIdx];
  
  if (updates.l1 !== undefined)      ws.getRange(excelRow, 2).setValue(updates.l1);
  if (updates.l2 !== undefined)      ws.getRange(excelRow, 3).setValue(updates.l2);
  if (updates.l3 !== undefined)      ws.getRange(excelRow, 4).setValue(updates.l3);
  if (updates.hsn !== undefined)     ws.getRange(excelRow, 6).setValue(updates.hsn);
  if (updates.active !== undefined)  ws.getRange(excelRow, 7).setValue(updates.active);
  if (updates.remarks !== undefined) ws.getRange(excelRow, 8).setValue(updates.remarks);
  
  logChange('ITEM_CATEGORIES', catCode, 'UPDATE', JSON.stringify(updates));
  CacheService.getScriptCache().remove('item_categories');
  
  return { success: true };
}
```

### 3G. Get All Categories (for React)

```javascript
/**
 * Bulk load all active categories — used by React frontend on mount
 * Uses CacheService Layer 1 for performance
 * 
 * @param {boolean} includeInactive - if true, returns inactive too
 * @returns {Object[]} Array of category objects
 */
function getAllCategories(includeInactive) {
  const cache = CacheService.getScriptCache();
  const cacheKey = includeInactive ? 'item_categories_all' : 'item_categories';
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('ITEM_CATEGORIES');
  const data = ws.getRange('A4:I' + ws.getLastRow()).getValues();
  
  const result = data
    .filter(row => row[0] && (includeInactive || row[6] === 'Yes'))
    .map(row => ({
      code: row[0],
      l1: row[1],
      l2: row[2],
      l3: row[3],
      master: row[4],
      hsn: row[5],
      active: row[6],
      remarks: row[7],
      behavior: row[8],
    }));
  
  // Cache for 6 hours
  cache.put(cacheKey, JSON.stringify(result), 21600);
  return result;
}
```

### 3H. Cascading Dropdown for Other Masters

```javascript
/**
 * When a master like ARTICLE_MASTER has an "L2 Product Category" dropdown,
 * this function returns the filtered options based on the selected L1
 * 
 * Used in: ARTICLE_MASTER Col 8 (L2 Product Category) dropdown
 * Depends on: ARTICLE_MASTER Col 7 (L1 Division) selection
 * 
 * @param {string} l1Value - e.g. "Men's Apparel"
 * @returns {string[]} Unique L2 values for that L1
 */
function getCategoryDropdownForMaster(l1Value) {
  const categories = getAllCategories(false);
  const l2Set = new Set();
  categories
    .filter(c => c.l1 === l1Value && c.master === 'ARTICLE')
    .forEach(c => l2Set.add(c.l2));
  return Array.from(l2Set).sort();
}

/**
 * Auto-fill L1 Division in ARTICLE_MASTER
 * Called on row creation or when L2 Product Category changes
 * 
 * For non-ARTICLE masters, L1 is always auto-set:
 * - RM_MASTER_FABRIC → "Raw Material"  
 * - TRIM_MASTER → "Trim"
 * - etc.
 */
function autoFillL1Division(sheetName) {
  const FIXED_L1 = {
    'RM_MASTER_FABRIC': 'Raw Material',
    'RM_MASTER_YARN':   'Raw Material',
    'RM_MASTER_WOVEN':  'Raw Material',
    'TRIM_MASTER':      'Trim',
    'CONSUMABLE_MASTER':'Consumable',
    'PACKAGING_MASTER': 'Packaging',
  };
  return FIXED_L1[sheetName] || null; // null = user must select (ARTICLE)
}
```

---

## 4. REACT FRONTEND — API INTEGRATION

### 4A. Hook for Category System

```javascript
// In your React app, call GAS functions via google.script.run:

function useCategoryAPI() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    google.script.run
      .withSuccessHandler(data => { setCategories(data); setLoading(false); })
      .withFailureHandler(err => { console.error(err); setLoading(false); })
      .getAllCategories(true); // includeInactive = true for admin view
  }, []);
  
  const getL1 = (master) => {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getL1Options(master);
    });
  };
  
  const getL2 = (master, l1) => {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getL2Options(master, l1);
    });
  };
  
  const getL3 = (master, l1, l2) => {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getL3Options(master, l1, l2);
    });
  };
  
  const create = (formData) => {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .createCategory(formData);
    });
  };
  
  const update = (code, updates) => {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .updateCategory(code, updates);
    });
  };
  
  return { categories, loading, getL1, getL2, getL3, create, update };
}
```

### 4B. In ARTICLE_MASTER Entry Form

When a user selects L1 Division in the Article form:

```javascript
// In Article Data Entry component:
const [l1Value, setL1Value] = useState('');
const [l2Options, setL2Options] = useState([]);

// When L1 changes, fetch cascading L2
const handleL1Change = async (newL1) => {
  setL1Value(newL1);
  const opts = await categoryAPI.getL2('ARTICLE', newL1);
  setL2Options(opts);
  // Clear L2 and L3 selections
  setFormField('l2', '');
};
```

### 4C. In Non-Article Masters (Auto L1)

```javascript
// For TRIM_MASTER, RM_MASTER_FABRIC, etc:
// L1 is auto-set, user only sees L2/L3
useEffect(() => {
  if (masterSheet !== 'ARTICLE_MASTER') {
    const fixedL1 = autoFillL1Division(masterSheet);
    setFormField('l1', fixedL1); // Auto-set, read-only in UI
  }
}, [masterSheet]);
```

---

## 5. DATA VALIDATION (Sheet-Level)

Apply these data validations in GAS `onOpen()` or via setup function:

```javascript
function setupCategoryValidations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('ITEM_CATEGORIES');
  const lastRow = Math.max(ws.getLastRow(), 100); // Validate up to row 100
  
  // Col E: Item Master Sheet — Dropdown
  const masterRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['ARTICLE', 'RM-FABRIC', 'RM-YARN', 'RM-WOVEN', 'TRIM', 'CONSUMABLE', 'PACKAGING'])
    .setAllowInvalid(false)
    .setHelpText('Select the item master this category belongs to')
    .build();
  ws.getRange('E4:E' + lastRow).setDataValidation(masterRule);
  
  // Col G: Active — Yes/No
  const activeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No'])
    .setAllowInvalid(false)
    .build();
  ws.getRange('G4:G' + lastRow).setDataValidation(activeRule);
  
  // Col I: L1 Behavior — Auto (FIXED/SELECTABLE)
  const behaviorRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['FIXED', 'SELECTABLE'])
    .setAllowInvalid(false)
    .build();
  ws.getRange('I4:I' + lastRow).setDataValidation(behaviorRule);
}
```

---

## 6. onEdit TRIGGER — Auto-Set L1 Behavior

```javascript
/**
 * When Col E (Master) is changed, auto-set Col I (Behavior) and 
 * auto-fill Col B (L1) for FIXED masters
 */
function onEditCategorySheet(e) {
  const ws = e.range.getSheet();
  if (ws.getName() !== 'ITEM_CATEGORIES') return;
  
  const col = e.range.getColumn();
  const row = e.range.getRow();
  if (row < 4) return; // Header rows
  
  // Col 5 = Item Master Sheet
  if (col === 5) {
    const master = e.range.getValue();
    const l1Info = getL1Options(master);
    
    // Set behavior (Col I)
    ws.getRange(row, 9).setValue(l1Info.behavior);
    
    // If FIXED, auto-fill L1 (Col B)
    if (l1Info.behavior === 'FIXED') {
      ws.getRange(row, 2).setValue(l1Info.fixedValue);
    }
  }
}
```

---

## 7. FILTERING ACROSS MODULES

L1 Division is now available as a **first-level filter** across ALL ERP modules:

| Module | Filter Use |
|--------|------------|
| **Article Records** | Group/filter by L1: "Men's Apparel" vs "Women's Apparel" |
| **PO Creation** | Filter articles by L1 when adding line items |
| **Inventory** | Segment stock by L1 Division |
| **Reports** | L1 → L2 → L3 drill-down in all dashboards |
| **BOM** | Filter components by L1 category |

### Filter API

```javascript
/**
 * Get unique L1 values for filter dropdowns
 * @returns {string[]} e.g. ["Men's Apparel", "Women's Apparel", "Raw Material", "Trim", ...]
 */
function getL1FilterOptions() {
  const categories = getAllCategories(false);
  return [...new Set(categories.map(c => c.l1))].sort();
}
```

---

## 8. IMPORTANT RULES

1. **🔒 DATA SAFETY:** Never delete existing rows. New categories = new rows only. Deactivate with Active = No.
2. **🔒 CODE FORMAT:** `CAT-xxx` auto-generated. Never allow manual entry. Lock cell after creation.
3. **🔒 L1 BEHAVIOR:** ARTICLE is the ONLY master with SELECTABLE L1. All others are FIXED. This is locked.
4. **Cache:** Invalidate `item_categories` cache key on any CRUD operation.
5. **Cross-module:** When ITEM_CATEGORIES changes, dependent dropdowns in ARTICLE_MASTER (Col 7, Col 8) must refresh.
6. **ARTICLE_MASTER Col 7:** Now contains "Men's Apparel" / "Women's Apparel" / etc. instead of just "Apparel".

---

*CC ERP • Item Categories GAS Connection • V8 • Feb 2026*
