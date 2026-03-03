# CC ERP — RULES & COMMANDS
## Confidence Clothing Pvt. Ltd. — Google Sheets + GAS + React ERP

> **MANDATORY:** Read this file BEFORE making ANY changes. Update this file AFTER any change that adds/modifies a rule.

**Last Updated:** V12.7 (3 Mar 2026)

---

## TABLE OF CONTENTS

1. [GOLDEN RULES (Never Break)](#1-golden-rules-never-break)
2. [UI/DISPLAY RULES](#2-uidisplay-rules)
3. [SCHEMA & COLUMN RULES](#3-schema--column-rules)
4. [CODE GENERATION RULES](#4-code-generation-rules)
5. [FK / RELATION ENGINE RULES](#5-fk--relation-engine-rules)
6. [L1/L2/L3 HIERARCHY RULES](#6-l1l2l3-hierarchy-rules)
7. [API & GATEWAY RULES](#7-api--gateway-rules)
8. [CACHING RULES](#8-caching-rules)
9. [ACCESS CONTROL RULES](#9-access-control-rules)
10. [VALIDATION RULES](#10-validation-rules)
11. [CHANGE LOG / AUDIT RULES](#11-change-log--audit-rules)
12. [FRONTEND / REACT RULES](#12-frontend--react-rules)
13. [STYLING & THEME RULES](#13-styling--theme-rules)
14. [GAS BACKEND RULES](#14-gas-backend-rules)
15. [FILE & SHEET STRUCTURE RULES](#15-file--sheet-structure-rules)
16. [VERSION-SPECIFIC RULES](#16-version-specific-rules)
17. [MAGIC VALUES & CONSTANTS](#17-magic-values--constants)
18. [ERROR HANDLING RULES](#18-error-handling-rules)
19. [DEPLOYMENT RULES](#19-deployment-rules)
20. [COMMANDS REFERENCE](#20-commands-reference)

---

## 1. GOLDEN RULES (Never Break)

| # | Rule | Status |
|---|------|--------|
| G1 | **No CC- prefix anywhere.** Codes are always bare (e.g., `5249HP`, `RM-FAB-001`, NOT `CC-5249HP`). | LOCKED |
| G2 | **React = real frontend. GAS = API backend only.** No HTML served from GAS. | LOCKED |
| G3 | **3-layer caching:** CacheService (6h) → PropertiesService (daily 07:00 IST) → Direct sheet read. | LOCKED |
| G4 | **FK stores CODES ONLY.** Never copy data between sheets. Adjacent column auto-displays names. | LOCKED |
| G5 | **Header-based FK resolution.** Match by column header name, NEVER by column position. Safe across V9+ column shifts. | LOCKED |
| G6 | **All API requests via GET.** JSON payload in query param (POST→GET redirect issue with GAS). | LOCKED |
| G7 | **MASTER_RELATIONS drives all FKs.** REL-001 to REL-054. Config-driven, not hard-coded. | LOCKED |
| G8 | **Row structure:** Banner (R1) → Headers (R2) → Descriptions (R3) → Data (R4+). Freeze at R3+Col A. | LOCKED |
| G9 | **ITEM_CHANGE_LOG is GAS-written only.** Never manually edit. | LOCKED |
| G10 | **ARTICLE code is manual (user enters).** All other master codes are auto-generated. | LOCKED |
| G11 | **4 Google Sheets files:** FILE 1A (23sh), FILE 1B (23sh), FILE 1C (6sh), FILE 2 (5sh). | LOCKED |
| G12 | **Linked DB views are strict read-only.** No inline edit, no action buttons. | LOCKED |
| G13 | **L1/L2/L3 for all 7 item masters.** Article L1 = SELECTABLE; rest = FIXED. | LOCKED |

---

## 2. UI/DISPLAY RULES

### 2.1 Header/Label Display Rule (V12.7 — MANDATORY)

> **RULE:** Everywhere a field name is shown in the UI (table headers, form labels, filter chips, sort labels, column pills, detail modals, dropdowns), use the `header` property from the schema, NOT the `label` property.

| Context | Use | Example |
|---------|-----|---------|
| Table column headers | `f.header` | "L1 Division" not "Division" |
| Form field labels | `f.header` | "L2 Product Category" not "Category" |
| Filter/sort chips | `f.header` | "→ HSN Code contains 6105" |
| Column visibility pills | `f.header` | "● L1 Division" |
| Group-by labels | `f.header` | "GROUPED BY: L1 Division" |
| Aggregation dropdowns | `f.header` | "L1 Division" |
| Detail modal fields | `f.header` | Card/Table/JSON layouts |
| Sort panel dropdowns | `f.header || f.label` | Fallback for non-schema fields |
| Column panel labels | `f.header || f.label` | Fallback for non-schema fields |
| Input placeholders | `` `Enter ${f.header}…` `` | "Enter L1 Division…" |

**Files affected:** `RecordsTab.jsx`, `RecordDetailModal.jsx`, `SortPanel.jsx`, `ColumnPanel.jsx`, `ArticleMasterTab.jsx`

**For ArticleMasterTab (hardcoded form labels):** Always match the exact `header` value from `SCHEMA_ARTICLE_MASTER`. Examples:
- "L2 Product Category *" (not "L2 Category *")
- "Article Description" (not "Description")
- "→ HSN Code" (not "HSN Code")
- "← GST % (Auto)" (not "GST %")
- "W.S.P (Rs)" (not "WSP ₹")
- "MRP (Rs)" (not "MRP ₹")
- "⟷ Tags" (not "Tags")

**For AM_FIELDS / CARD_FIELDS constants:** Labels must match headers:
- `label: '🔑 Article Code'` (not "Art Code")
- `label: 'L1 Division'` (not "Division")
- `label: 'L2 Product Category'` (not "Category")
- `label: 'W.S.P (Rs)'` (not "WSP ₹")

### 2.2 Edit Form Rule (V12.7)

> **RULE:** When editing any record, the editing window MUST be the SAME as the new record creation window. Open it in the data entry panel/tab, not a separate modal.

| Component | Create Form | Edit Form | Behavior |
|-----------|-------------|-----------|----------|
| RecordsTab (all generic masters) | Right side panel (380px) | SAME right side panel | `openEdit(row)` loads data into same form. `editRow` state determines title ("New Record" vs "Edit {code}"). |
| ArticleMasterTab | "Create" tab | SAME "Create" tab | `handleEdit(item)` loads data, switches to create tab. `editItem` state determines title. |

**Clicking a table row** in RecordsTab opens the **edit form directly** (`openEdit(row)`), NOT the read-only detail modal.

### 2.3 Header Symbol Prefixes

| Symbol | Meaning | Unicode | Example |
|--------|---------|---------|---------|
| `→` | FK to (user selects code) | U+2192 | `→ MAIN FABRIC USED` |
| `←` | Auto-display from (GAS-filled) | U+2190 | `← Fabric Name (Auto)` |
| `⟷` | Two-way sync / multi-select | U+27F7 | `⟷ YARN COMPOSITION`, `⟷ Tags` |
| `∑` | Calculated/derived | U+2211 | `∑ FINAL MARKUP %`, `∑ FINAL FABRIC SKU` |
| `#` | Auto-generated code | text | `# RM Code` |
| `🔑` | Primary key | emoji | `🔑 Article Code` |
| `⚠` | Required/mandatory | emoji | `⚠ Trim Name` |

### 2.4 Typography Rules

| Use | Font | Weight | Size |
|-----|------|--------|------|
| UI text, labels | Nunito Sans | 400–900 | 12–16px |
| Codes, amounts, dates | IBM Plex Mono | 500–700 | 11–13px |
| Field labels (UPPERCASE) | Nunito Sans | 900 | 8–9px |

### 2.5 Status Badge Colors

| Status | Background | Text |
|--------|-----------|------|
| Active / Approved / Completed / Yes | `#d1fae5` | `#065f46` |
| Development / Maintenance | `#fef3c7` | `#92400e` |
| Inactive / Overdue / Blocked / No | `#fee2e2` | `#991b1b` |
| Draft / Disposed | `#f3f4f6` | `#6b7280` |
| Scheduled | `#dbeafe` | `#1e40af` |

### 2.6 Accent Color

- **CC_RED:** `#CC0000` — Used for mandatory accent (Default pill, Add New button, sheet header bg).

---

## 3. SCHEMA & COLUMN RULES

### 3.1 Schema Field Properties

Every field in `masterSchemas.js` MUST have:

| Property | Required | Purpose |
|----------|----------|---------|
| `key` | YES | JS key for data objects |
| `header` | YES | Exact Google Sheet column header (with symbols) |
| `label` | YES | Short label (legacy, NOT used for display — see Rule 2.1) |
| `w` | YES | Grid width (`"130px"`, `"1fr"`, `"0"` for hidden) |
| `type` | NO | `"text"` / `"select"` / `"date"` / `"number"` / `"textarea"` |
| `options` | NO | For `select` type — array of strings |
| `required` | NO | `true` = mandatory field marker |
| `auto` | NO | `true` = auto-calculated, readonly in create form |
| `hidden` | NO | `true` = don't show in table (still in form) |
| `mono` | NO | `true` = monospace font (IBM Plex Mono) |
| `badge` | NO | `true` = render as status badge |

### 3.2 Column Count Per Master (V9+)

| Sheet | Columns | Code Format |
|-------|---------|-------------|
| ARTICLE_MASTER | 27 | Manual: `[4-5 digits][2 CAPS]` (e.g., `5249HP`) |
| RM_MASTER_FABRIC | 27 | Auto: `RM-FAB-###` |
| RM_MASTER_YARN | 18 | Auto: `RM-YRN-###` |
| RM_MASTER_WOVEN | 17 | Auto: `RM-WVN-###` |
| TRIM_MASTER | 30 | Auto: `TRM-[CAT]-###` |
| CONSUMABLE_MASTER | 20 | Auto: `CON-[CAT]-###` |
| PACKAGING_MASTER | 20 | Auto: `PKG-[CAT]-###` |

### 3.3 Schema Map Keys

```javascript
SCHEMA_MAP = {
  article_master:    SCHEMA_ARTICLE_MASTER,
  rm_master_fabric:  SCHEMA_RM_FABRIC,
  rm_master_yarn:    SCHEMA_RM_YARN,
  rm_master_woven:   SCHEMA_RM_WOVEN,
  trim_master:       SCHEMA_TRIM_MASTER,
  consumable_master: SCHEMA_CONSUMABLE_MASTER,
  packaging_master:  SCHEMA_PACKAGING_MASTER,
  item_categories:   SCHEMA_ITEM_CATEGORIES,
  color_master:      SCHEMA_COLOR_MASTER,
  hsn_master:        SCHEMA_HSN_MASTER,
  uom_master:        SCHEMA_UOM_MASTER,
  size_master:       SCHEMA_SIZE_MASTER,
  fabric_type_master:SCHEMA_FABRIC_TYPE,
  tag_master:        SCHEMA_TAG_MASTER,
  // FILE 1B
  user_master:       SCHEMA_USER_MASTER,
  department_master: SCHEMA_DEPARTMENT_MASTER,
  // ... etc
}
```

---

## 4. CODE GENERATION RULES

### 4.1 Code Formats

| Sheet | Format | Example | Sequence Type |
|-------|--------|---------|---------------|
| ARTICLE_MASTER | `[4-5 digits][2 CAPS]` | `5249HP` | Manual (user enters) |
| RM_MASTER_FABRIC | `RM-FAB-###` | `RM-FAB-001` | Global (never resets) |
| RM_MASTER_YARN | `RM-YRN-###` | `RM-YRN-042` | Global |
| RM_MASTER_WOVEN | `RM-WVN-###` | `RM-WVN-008` | Global |
| TRIM_MASTER | `TRM-[CAT]-###` | `TRM-THD-005` | Per-category |
| CONSUMABLE_MASTER | `CON-[CAT]-###` | `CON-DYE-012` | Per-category |
| PACKAGING_MASTER | `PKG-[CAT]-###` | `PKG-PLY-043` | Per-category |
| ITEM_CATEGORIES | `CAT-###` | `CAT-001` | Global |
| SUPPLIER_MASTER | `SUP-###` | `SUP-042` | Global |
| PO_MASTER | `PO-[YYYY]-####` | `PO-2026-0001` | Year-based |
| GRN_MASTER | `GRN-[YYYY]-####` | `GRN-2026-0001` | Year-based |

### 4.2 Code Generation Rules

- Code column is ALWAYS column A (col 1).
- Never overwrite existing code (check before generate).
- Article code: user enters, GAS validates regex `^[0-9]{4,5}[A-Z]{2}$` + duplicate check (excluding self-row).
- Auto-codes trigger on first edit to any data column (not col A itself).
- Per-category codes: read category from col 5, extract code, filter by category, increment.
- Year-based codes: `Math.max(...codes_for_year) + 1`.
- Duplicate check uses `codeExistsInSheet_(sheetName, code, excludeRow)` — the `excludeRow` param prevents false duplicates when editing (V9.1 fix).

### 4.3 Trim Category Codes

`THD`=Thread, `LBL`=Label, `ELS`=Elastic, `ZIP`=Zipper, `BUT`=Button, `TPE`=Tape, `DRW`=Drawcord, `VLC`=Velcro, `RVT`=Rivet/Eyelet, `THP`=Neck/Shoulder Tape, `OTH`=Other, `BDG`=Badge

---

## 5. FK / RELATION ENGINE RULES

### 5.1 MASTER_RELATIONS Structure (13 cols)

| Col | Header | Purpose |
|-----|--------|---------|
| A | Relation Code | REL-001 to REL-054 |
| B | Parent Sheet | Which sheet has the FK column |
| C | Parent Column | Exact header name (with symbol prefix) |
| D | Referenced Sheet | Where data comes from |
| E | Ref Code Column | Header in ref sheet for codes |
| F | Ref Display Col | Header in ref sheet for display names |
| G | Allow Create New | Yes / No |
| H | Dropdown Filter | e.g., "Status='Active'" |
| I | Multi-Select | Yes / No (comma-separated codes) |
| J | Cross-File | Yes / No |
| K | Ref File Label | FILE_1B, FILE_1C (if cross-file) |
| L | Active | Yes / No |
| M | Notes | Documentation |

### 5.2 FK Resolution Flow (V12.5 Direct Lookup)

1. User edits FK column (header starts with `→`, `←`, or `⟷`)
2. `onEdit` fires → `handleFKEdit(e)` in Module2_FKEngine.gs
3. Detect FK via `_isFKColumn(header)` — checks `→`, `⟷`, `->`, `<->` prefixes
4. Find relation by matching parent sheet + header name
5. Read referenced sheet headers (row 2) — **header-based, NOT position-based**
6. Build code→display map: `_buildCodeDisplayMap(refSheet, codeColHeader, displayColHeader)`
7. Resolve codes → names, write to adjacent column
8. Multi-select separator: `", "` (comma-space)

### 5.3 Two-Way Sync (`⟷`) Rules

- Store codes only (comma-separated for multi-select)
- Adjacent column auto-displays names
- Append-only (user adds, doesn't remove)
- V12.4 FIX: `_isFKColumn()` now recognizes `⟷`

### 5.4 Key Relations

| REL | Parent | Column | → Ref Sheet | Display |
|-----|--------|--------|-------------|---------|
| REL-006 | RM_MASTER_FABRIC | `⟷ YARN COMPOSITION` | RM_MASTER_YARN | Yarn Name (col E) |
| REL-001–010 | ARTICLE_MASTER | Various FKs | FABRIC, HSN, Supplier, Tags | — |
| REL-011–020 | RM_MASTER_FABRIC | Yarn, HSN, Supplier, Tags | Various | — |

---

## 6. L1/L2/L3 HIERARCHY RULES

### 6.1 Behavior by Master

| Master | L1 Behavior | L1 Values | L2 Cascades From | L3 Cascades From |
|--------|-------------|-----------|------------------|------------------|
| **ARTICLE** | **SELECTABLE** | Men's/Women's/Kids/Unisex Apparel | L1 choice | L2 choice |
| RM-FABRIC | FIXED | "Raw Material" (auto) | "Knit Fabric" (auto) | L2 choice |
| RM-YARN | FIXED | "Raw Material" (auto) | "Yarn" (auto) | L2 choice |
| RM-WOVEN | FIXED | "Raw Material" (auto) | "Woven/Interlining" (auto) | L2 choice |
| TRIM | FIXED | "Trim" (auto) | 11 trim categories | L2 choice |
| CONSUMABLE | FIXED | "Consumable" (auto) | 7 categories | L2 choice |
| PACKAGING | FIXED | "Packaging" (auto) | 7 categories | L2 choice |

### 6.2 Category Code Ranges

- ARTICLE: CAT-001–023 (24–099 reserved)
- RM-FABRIC: CAT-100–110 (111–119 reserved)
- RM-YARN: CAT-120–127 (128–139 reserved)
- RM-WOVEN: CAT-140–143 (144–199 reserved)
- TRIM: CAT-200–237 (238–299 reserved)
- CONSUMABLE: CAT-300–325 (326–399 reserved)
- PACKAGING: CAT-400–427 (428–500 reserved)

### 6.3 ITEM_CATEGORIES Layouts

- **V9 (row-based):** 9 cols, 138 rows. Col E = master code (ARTICLE, RM-FABRIC, etc.)
- **V10 (column-grouped):** 22 cols. B–D=Article, E–G=Fabric, H–J=Yarn, K–M=Woven, N–P=Trim, Q–S=Consumable, T–V=Packaging
- **Auto-detection:** GAS checks if row4/colE matches a known master code → V9 path; else → V10 path

### 6.4 Frontend Hierarchy Sources

- `SEED_DATA` (138 entries) exported from `ItemCategoryTab.jsx` — fallback
- `CATEGORY_HIERARCHY` derived from SEED_DATA — `DIVISIONS`, `L2_BY_DIV`, `L3_BY_L2`, `L2_HSN`
- Live data fetched from GAS API via `api.getItemCategories()` on mount

---

## 7. API & GATEWAY RULES

### 7.1 Request Pattern

```
GET https://<GAS_URL>?action=<ACTION>&payload=<JSON_STRING>
```

### 7.2 Response Pattern

```javascript
{ success: true, data: {...} }   // Success
{ success: false, error: { message: "..." } }  // Error
```

### 7.3 Key API Routes

| Route | Purpose |
|-------|---------|
| `getUIBootstrap` | Init app state, user, theme |
| `getMasterData` | Fetch all rows from a master sheet |
| `saveMasterRecord` | Create/update a master record |
| `deleteMasterRecord` | Delete a master record |
| `getAllCategories` | Fetch ITEM_CATEGORIES |
| `getArticleDropdowns` | Fetch live dropdowns (Gender, Fit, Neckline, Sleeve, Status, Season, Size Range) |
| `getMasterSheetCounts` | Row counts per master |
| `heartbeat` / `getOnlineUsers` | Presence tracking |
| `getNotifications` / `markNotificationRead` | Notifications |
| `savePO` / `getPOList` / `saveGRN` / `getGRNList` | Procurement |

### 7.4 Article Dropdowns API (V12.6)

- Source: `ARTICLE_DROPDOWNS` sheet (7 cols, row 4+)
- Returns: `{ gender, fit, neckline, sleeve, status, season, sizeRange }`
- Frontend uses live data; falls back to `INIT_*_OPTS` constants

---

## 8. CACHING RULES

| Layer | Type | Expiry | Key Format |
|-------|------|--------|------------|
| 1 | CacheService (in-memory) | 6 hours (21,600s) | `CACHE_[SHEET_NAME]` |
| 2 | PropertiesService (persistent) | Daily 07:00 IST | `CACHE_[SHEET_NAME]` |
| 3 | Direct sheet read | Always fresh | — |

- **Invalidation:** On `onEdit` in row 4+, invalidate that sheet's cache.
- **Manual clear:** `menuClearAllCaches()` (GAS menu).

---

## 9. ACCESS CONTROL RULES

### 9.1 Roles (7 total)

| Role | Masters | Procurement | Users |
|------|---------|-------------|-------|
| SUPER_ADMIN | All CRUD | All | All CRUD |
| ADMIN | All CRUD | All | View |
| PURCHASE_MGR | View only | CRUD (PO/GRN) | View |
| PRODUCTION_MGR | View only | View | View |
| STORE_KEEPER | View only | View (GRN) | View |
| ACCOUNTS | View only | View | View |
| VIEW_ONLY | View only | View | View |

### 9.2 User Lookup

- Email from `Session.getActiveUser().getEmail()`
- Look up in USER_MASTER (FILE 1B) by email
- Cache role in PropertiesService

---

## 10. VALIDATION RULES

| What | Rule | Where |
|------|------|-------|
| Article code format | Regex: `^[0-9]{4,5}[A-Z]{2}$` | GAS + React |
| Article code duplicate | `codeExistsInSheet_()` with `excludeRow` | GAS |
| FK code exists | Code must exist in referenced sheet | GAS |
| Mandatory fields | Marked with `⚠` or `required:true` | React + GAS |
| Max cell length | 2000 chars per cell (Sheets API limit) | GAS |

---

## 11. CHANGE LOG / AUDIT RULES

- Sheet: `ITEM_CHANGE_LOG` (FILE 1A, Sheet 21)
- **GAS-written only. NEVER manually edit.**
- 10 columns: Timestamp, User Email, Sheet Name, Row, Column Header, Field Key, Old Value, New Value, Change Type, Remarks
- Change types: "Create", "Update", "Delete", "Auto Code", "Auto Fill"
- Entry point: `writeChangeLog()` in Module4_ChangeLog.gs

---

## 12. FRONTEND / REACT RULES

### 12.1 Component Structure

```
frontend/src/
├── components/
│   ├── masters/          # Master sheet tabs
│   │   ├── RecordsTab.jsx         # Generic master UI (all non-Article)
│   │   ├── ArticleMasterTab.jsx   # Custom Article UI
│   │   ├── ItemCategoryTab.jsx    # Category hierarchy
│   │   ├── RecordDetailModal.jsx  # Detail popup (read-only)
│   │   ├── SortPanel.jsx          # Sort configuration
│   │   ├── ColumnPanel.jsx        # Column visibility/order
│   │   └── ViewEditModal.jsx      # View create/edit
│   ├── procurement/      # PO, GRN views
│   ├── users/            # User panel, roles
│   ├── panels/           # Side panels (Notifications, Settings)
│   └── ui/               # Atomic components
├── constants/
│   ├── masterSchemas.js  # All sheet schemas
│   └── masterFieldMeta.js # Field metadata
├── services/
│   └── api.js            # GAS API service
└── App.jsx               # Main shell
```

### 12.2 State Patterns

- **RecordsTab** (generic): `editRow` (null = create, object = edit), `formData`, `showAddForm`
- **ArticleMasterTab** (custom): `editItem` (null = create, object = edit), `form`, `tab` ("create"/"records"/"layout"/"auditlog")
- **Extra Options** (session-level): `extraOpts` state in ItemCategoryTab — session-only additions to dropdowns, not persisted to GAS

### 12.3 Data Mapping

```javascript
// Raw sheet headers ↔ schema keys
mapRawToSchema(rawRow, schema)  // API response → JS object
mapSchemaToRaw(formData, schema) // JS object → API payload
```

### 12.4 Build Commands

```bash
cd frontend
npm run dev      # Dev server (port 9090)
npm run build    # Production build (vite build → dist/)
npm run preview  # Preview production build
```

---

## 13. STYLING & THEME RULES

### 13.1 Color Modes (6 total)

Light (default), Dark, Navy, Forest, Twilight, Autumn

### 13.2 Theme Tokens

```
M.bg, M.shellBg, M.sidebarBg, M.surfHigh, M.surfMid, M.surfLow,
M.hoverBg, M.inputBg, M.divider, M.tblHead, M.tblEven, M.tblOdd,
M.textA (primary), M.textB (secondary), M.textC (tertiary), M.textD (disabled),
M.badgeBg, M.badgeTx, M.shadow, M.scrollThumb
```

### 13.3 Accent Tokens

```
A.a = accent color (e.g., #0078D4 for Light)
A.al = accent light (e.g., rgba(0,120,212,.08))
A.tx = accent text (e.g., #fff)
```

---

## 14. GAS BACKEND RULES

### 14.1 Entry Points

| Trigger | Function | Purpose |
|---------|----------|---------|
| HTTP GET | `doGet(e)` | API gateway → route dispatch |
| Sheet open | `onOpen(e)` | Cache warm-up, menu, access control |
| Sheet edit | `onEdit(e)` | Code gen, FK resolution, change log |

### 14.2 Module Files (19 total)

| File | Purpose |
|------|---------|
| Config.gs | Constants, file IDs, sheet names |
| Code.gs | onOpen/onEdit entry points |
| Cache.gs | 3-layer caching |
| APIGateway.gs | HTTP router (22+ routes) |
| Module1_CodeGen.gs | Auto-code generation |
| Module2_FKEngine.gs | FK resolution |
| Module3_AttrSync.gs | Attribute sync (TRIM/CON/PKG) |
| Module4_ChangeLog.gs | Audit trail |
| Module5_AccessControl.gs | RBAC |
| Module6_ColorSwatch.gs | Color utilities |
| Module7_ReorderAlert.gs | Stock alerts |
| Module8_ISR.gs | Supplier rates |
| Module9_Export.gs | PDF/Excel export |
| Module10_Presence.gs | User tracking |
| Module11_UIBootstrap.gs | App init data |
| Module12_Notifications.gs | Notif CRUD |
| Module13_QuickAccess.gs | Shortcuts |
| Module14_ProcurementAPI.gs | PO/GRN operations |
| SheetSetup*.gs | Fresh setup scripts |

### 14.3 GAS Coding Rules

- All functions use `var` (not `let`/`const`) — GAS V8 compat
- All sheet reads start from `DATA_START_ROW` (row 4)
- Header row is always row 2
- Column lookup by header name: `_findColumnIndex(headers, headerName)`
- Multi-select separator: `", "` (comma-space)

---

## 15. FILE & SHEET STRUCTURE RULES

### 15.1 Universal Row Layout

| Row | Content | Style |
|-----|---------|-------|
| 1 | BANNER (sheet title) | Dark bg (#1A1A2E), white bold, merged |
| 2 | HEADERS (column names) | Red bg (#CC0000), white bold, 10px |
| 3 | DESCRIPTIONS (instructions) | Light blue bg (#D6EAF8), italic, 9px |
| 4+ | DATA | White bg (#FFFFFF), 10px |

Frozen: Rows 1–3 + Column A.

### 15.2 File IDs

```javascript
FILE_1A: '1eaDbKEJpty6c7_FrVm5wElOce_z4yHRMr3E-SAskdMc'
FILE_1B: '1WjtpBhXwYVBVnPSDbzTWm8X0nyVhzsailBpRqXi7Se4'
FILE_1C: '1t3zHrORAjZJ2cVr8bru4HE4kUvyYdm5RDICA8NkiDX8'
FILE_2:  '1KfeKzO-djdMn6YFSNOoyLeKOZfdcFCyHLzf7jpm6Pls'
```

### 15.3 Sheet Counts

- FILE 1A — Items Master: 23 sheets
- FILE 1B — Factory Master: 23 sheets
- FILE 1C — Finance Master: 6 sheets
- FILE 2 — Procurement: 5 sheets

---

## 16. VERSION-SPECIFIC RULES

### V9 (28 Feb 2026) — L1/L2/L3 Hierarchy
- 11 new columns inserted across 7 masters
- ITEM_CATEGORIES: 8 → 138 rows
- Column shifts: ARTICLE +1 from I, FABRIC +2 from C, YARN +3 from B
- FK engine safe because header-based matching

### V9.1 (2 Mar 2026) — Bug Fixes
- `codeExistsInSheet_`: Added `excludeRow` param (no false duplicates)
- Article code: `auto:true` → `required:true` (manual entry)
- L1/L2/L3 options from SEED_DATA
- L1 Division fieldType: `"auto"` → `"fk"` (SELECTABLE for Article)

### V12.4 (3 Mar 2026) — FK Engine Fix
- `_isFKColumn()` now detects `⟷` (TWO_WAY_SYNC)
- Fabric SKU auto-build on col E/F edit
- Header-based matching safe across shifts

### V12.5 (3 Mar 2026) — Direct FK
- FK resolution bypasses MASTER_RELATIONS cache
- Direct header scan on referenced sheet

### V12.6 (3 Mar 2026) — Live Dropdowns
- `getArticleDropdowns` API reads from ARTICLE_DROPDOWNS sheet (row 4+)
- `getAllCategories` auto-detects V9 vs V10 ITEM_CATEGORIES format
- Frontend fetches live; fallback to INIT_*_OPTS

### V12.7 (3 Mar 2026) — Header Display + Edit Form
- All UI labels use `f.header` instead of `f.label`
- Edit form is same as create form (no separate modal for editing)
- Table row click opens edit form directly

---

## 17. MAGIC VALUES & CONSTANTS

| Constant | Value | Purpose |
|----------|-------|---------|
| `DATA_START_ROW` | 4 | First data row |
| `HEADER_ROW` | 2 | Column headers |
| `DESCRIPTION_ROW` | 3 | Column descriptions |
| `FREEZE_ROW` | 3 | Freeze up to row 3 |
| `FREEZE_COL` | 1 | Freeze column A |
| `CACHE_EXPIRY_SECONDS` | 21,600 | 6 hours |
| `CACHE_REFRESH_HOUR` | 7 | 07:00 IST |
| `FK_MULTI_SELECT_SEP` | `", "` | Comma-space |
| `FK_MAX_DROPDOWN_ITEMS` | 500 | Max dropdown entries |
| `CC_RED` | `#CC0000` | Brand red |
| `ARTICLE_CODE_REGEX` | `^[0-9]{4,5}[A-Z]{2}$` | Code validation |
| `SEED_DATA` | Array[138] | ITEM_CATEGORIES fallback |
| `AM_SEED_DATA` | Array[23] | ARTICLE_MASTER samples |

---

## 18. ERROR HANDLING RULES

| Error | Message | Action |
|-------|---------|--------|
| FK code not found | "Code [X] not found in [SHEET]" | Toast, clear display col |
| Duplicate code | "[X] already exists" | Prevent save, highlight |
| Missing relation | "No relation for [SHEET].[COL]" | Log warning, skip FK |
| Cross-file FK fail | "Cannot access [FILE]" | Log, show "N/A" |
| API timeout | "GAS API timeout" | Retry 3x exponential backoff |
| Empty sheet | — | Treat as 0 rows, code starts at 001 |

---

## 19. DEPLOYMENT RULES

### Frontend
- **Port:** 9090
- **Build:** `npm run build` (Vite → `dist/`)
- **Env:** `VITE_GAS_URL` in `.env` / `.env.development`

### GAS Backend
- **Source:** `/workspaces/CCPL_GOOGLE_ERP/gas/File1A/`
- **Deploy:** `clasp` CLI or GAS editor
- **Bound to:** FILE 1A Google Sheet

---

## 20. COMMANDS REFERENCE

### 20.1 Frontend Commands

```bash
cd /workspaces/CCPL_GOOGLE_ERP/frontend
npm run dev       # Start dev server (port 9090)
npm run build     # Production build
npm run preview   # Preview prod build
```

### 20.2 GAS Commands

```bash
cd /workspaces/CCPL_GOOGLE_ERP/gas/File1A
clasp push        # Push to GAS
clasp pull        # Pull from GAS
clasp open        # Open GAS editor
```

### 20.3 GAS Menu Functions (Run from Sheets)

| Function | Purpose |
|----------|---------|
| `applyV9Updates()` | Upgrade sheet from V8→V9 (insert L1/L2/L3 columns) |
| `applyV10Updates()` | Upgrade ITEM_CATEGORIES from V9→V10 layout |
| `menuClearAllCaches()` | Clear all 3-layer caches |
| `setupFile1A()` | Fresh setup of FILE 1A (all 23 sheets) |
| `setupFile1B()` | Fresh setup of FILE 1B |
| `setupFile1C()` | Fresh setup of FILE 1C |
| `setupFile2()` | Fresh setup of FILE 2 |

### 20.4 Key GAS Functions

| Function | File | Purpose |
|----------|------|---------|
| `doGet(e)` | APIGateway.gs | HTTP entry point |
| `onOpen(e)` | Code.gs | Sheet open handler |
| `onEdit(e)` | Code.gs | Sheet edit handler |
| `generateItemCode(e)` | Module1_CodeGen.gs | Auto-code generation |
| `handleFKEdit(e)` | Module2_FKEngine.gs | FK resolution |
| `_isFKColumn(header)` | Module2_FKEngine.gs | Detect FK column |
| `_findColumnIndex(headers, name)` | Module2_FKEngine.gs | Header-based col lookup |
| `writeChangeLog(...)` | Module4_ChangeLog.gs | Audit trail entry |
| `codeExistsInSheet_(sheet, code, excludeRow)` | Module1_CodeGen.gs | Duplicate check |

---

## CHANGE LOG

| Date | Version | Changes to this file |
|------|---------|---------------------|
| 3 Mar 2026 | V12.7 | Initial creation. All rules cataloged. Header display rule (2.1) and edit form rule (2.2) added. |

---

> **REMINDER:** After making any code change, check if a new rule was established and update this file accordingly.
