# CC ERP — V12.4 FK Engine Fix: Yarn Name Lookup + Fabric SKU Auto-Build

**Version:** V12.4
**Date:** 3 Mar 2026
**Files Changed:** `Module2_FKEngine.gs`, `Code.gs`
**Issue:** Column G of RM_MASTER_FABRIC not fetching yarn name from RM_MASTER_YARN; Column B (∑ FINAL FABRIC SKU) not auto-building.

---

## Problem

### Issue 1: Column G (← Yarn Names) stays empty

When a user selects yarn code(s) in **RM_MASTER_FABRIC column F** (`⟷ YARN COMPOSITION`), **column G** (`← Yarn Names (Auto)`) should auto-fill with the corresponding yarn names from **RM_MASTER_YARN column E** (`Yarn Name`). But it was NOT triggering at all.

### Issue 2: Column B (∑ FINAL FABRIC SKU) not auto-building

Column B should auto-build as `L3 Knit Type — Yarn Name(s)` (e.g., `Single Jersey — 30s Cotton Ring Spun, 40s Combed Cotton`). Since column G was empty (Issue 1), column B also couldn't build.

---

## Root Cause Analysis

### Bug 1: `_isFKColumn()` did not recognize `⟷` prefix

**File:** `Module2_FKEngine.gs` — function `_isFKColumn()` (line 935)

The `handleFKEdit(e)` function (called by `onEdit`) checks if the edited column is an FK column using `_isFKColumn(headerStr)`. This function ONLY recognized:
- `→` (U+2192) — single FK prefix
- `->` — literal text prefix

But the YARN COMPOSITION column header is `⟷ YARN COMPOSITION`, which uses `⟷` (U+27F7, TWO_WAY_SYNC). This prefix was **NOT checked**, so `_isFKColumn` returned `false`, `handleFKEdit` silently returned, and `autoDisplayFKName` was **never called**.

**Same bug affected:** `⟷ Tags` columns on ALL master sheets.

### Bug 2: No onEdit handler for Fabric SKU auto-build

**File:** `Code.gs` — function `onEdit(e)`

ARTICLE_MASTER had an auto-description builder (col B = L1 › L2 › L3), but RM_MASTER_FABRIC had **no equivalent handler** to auto-build column B (∑ FINAL FABRIC SKU) from L3 Knit Type + Yarn Names.

---

## Fixes Applied

### Fix 1: `_isFKColumn()` — Added `⟷` detection

**File:** `Module2_FKEngine.gs`, line 935

```javascript
// BEFORE (broken):
function _isFKColumn(header) {
  if (!header) return false;
  var s = String(header).trim();
  return s.charAt(0) === CONFIG.HEADER_PREFIXES.FK_TO ||
         s.indexOf(CONFIG.HEADER_PREFIXES.FK_TO) !== -1 ||
         s.indexOf('->') !== -1;
}

// AFTER (fixed):
function _isFKColumn(header) {
  if (!header) return false;
  var s = String(header).trim();
  return s.charAt(0) === CONFIG.HEADER_PREFIXES.FK_TO ||
         s.indexOf(CONFIG.HEADER_PREFIXES.FK_TO) !== -1 ||
         s.indexOf(CONFIG.HEADER_PREFIXES.TWO_WAY_SYNC) !== -1 ||
         s.indexOf('->') !== -1 ||
         s.indexOf('<->') !== -1;
}
```

### Fix 2: Fabric SKU auto-build in `onEdit`

**File:** `Code.gs`, after `handleFKEdit(e)` call (line 88)

```javascript
// ── Auto SKU: RM_MASTER_FABRIC col B = L3 Knit Type + Yarn Names ──
// V9 columns: E(5)=L3 Knit Type, F(6)=⟷ YARN COMPOSITION, G(7)=← Yarn Names (Auto), B(2)=∑ FINAL FABRIC SKU
// Triggers when L3 Knit Type (col 5) or Yarn Composition (col 6) is edited.
// handleFKEdit above has already resolved yarn codes→names into col G by this point.
if (sheetName === CONFIG.SHEETS.RM_MASTER_FABRIC && (col === 5 || col === 6)) {
  try {
    var knitType  = String(sheet.getRange(row, 5).getValue() || '').trim();
    var yarnNames = String(sheet.getRange(row, 7).getValue() || '').trim();
    var skuParts  = [knitType, yarnNames].filter(function(p) { return p !== ''; });
    sheet.getRange(row, 2).setValue(skuParts.length > 0 ? skuParts.join(' — ') : '');
  } catch (err) {
    Logger.log('Fabric SKU auto-build error: ' + err.message);
  }
}
```

---

## How FK Resolution Works (Full Flow for Fabric → Yarn)

### V9 Column Positions

**RM_MASTER_FABRIC:**
| Col | # | Header | Type |
|-----|---|--------|------|
| A | 1 | `# RM Code` | Auto-code |
| B | 2 | `∑ FINAL FABRIC SKU` | Auto-build (knit type + yarn names) |
| C | 3 | `L1 Division` | Fixed: "Raw Material" |
| D | 4 | `L2 Category` | Fixed: "Knit Fabric" |
| E | 5 | `L3 Knit Type` | Dropdown (Single Jersey, Pique, etc.) |
| F | 6 | `⟷ YARN COMPOSITION` | Multi-FK → RM_MASTER_YARN |
| G | 7 | `← Yarn Names (Auto)` | Auto-display from RM_MASTER_YARN |

**RM_MASTER_YARN:**
| Col | # | Header | Type |
|-----|---|--------|------|
| A | 1 | `# RM Code` | Auto-code (RM-YRN-001, etc.) |
| B | 2 | `L1 Division` | Fixed: "Raw Material" |
| C | 3 | `L2 Category` | Fixed: "Yarn" |
| D | 4 | `L3 Yarn Type` | Dropdown |
| E | 5 | `Yarn Name` | User enters (e.g., "30s Cotton Ring Spun") |

### MASTER_RELATIONS Entry (REL-006)

```
REL-006:
  Parent Sheet:    RM_MASTER_FABRIC
  Parent Column:   ⟷ YARN COMPOSITION     (col F)
  Referenced Sheet: RM_MASTER_YARN
  Ref Code Column: # RM Code              (col A of yarn master)
  Ref Display Col: Yarn Name              (col E of yarn master) ← THIS IS THE NAME, NOT CODE
  Multi-Select:    Yes                     (comma-separated)
  Cross-File:      No                      (same FILE 1A)
```

### Step-by-Step onEdit Flow

```
1. User selects yarn code(s) in col F  →  e.g. "RM-YRN-001, RM-YRN-002"
       │
2. onEdit(e) fires
       │
3. handleFKEdit(e)
       │
       ├── _isFKColumn("⟷ YARN COMPOSITION")  →  ✅ TRUE (now detects ⟷)
       │
       ├── getRelationForColumn("RM_MASTER_FABRIC", "⟷ YARN COMPOSITION")
       │       └── Finds REL-006 via normalized header match
       │
       ├── autoDisplayFKName("RM_MASTER_FABRIC", row, 6, "RM-YRN-001, RM-YRN-002")
       │       │
       │       ├── rel.multiSelect = true
       │       │
       │       ├── resolveMultiSelectFK(
       │       │     codes:      "RM-YRN-001, RM-YRN-002",
       │       │     refSheet:   "RM_MASTER_YARN",
       │       │     codeCol:    "# RM Code",        ← header name for MATCHING input codes
       │       │     displayCol: "Yarn Name",         ← header name for FETCHING display values
       │       │     refFileLabel: null                ← same file
       │       │   )
       │       │       │
       │       │       ├── _buildCodeDisplayMap("RM_MASTER_YARN", "# RM Code", "Yarn Name")
       │       │       │       │
       │       │       │       ├── Reads RM_MASTER_YARN headers (row 2) + data (row 4+)
       │       │       │       ├── _findColumnIndex(headers, "# RM Code")   → finds col A (index 0)
       │       │       │       ├── _findColumnIndex(headers, "Yarn Name")   → finds col E (index 4)
       │       │       │       └── Builds map: { "RM-YRN-001": "30s Cotton Ring Spun",
       │       │       │                         "RM-YRN-002": "40s Combed Cotton", ... }
       │       │       │
       │       │       └── Returns "30s Cotton Ring Spun, 40s Combed Cotton"
       │       │
       │       └── sheet.getRange(row, 7).setValue("30s Cotton Ring Spun, 40s Combed Cotton")
       │                                           ↑ col G = ← Yarn Names (Auto)
       │
4. Auto SKU handler (new Code.gs logic)
       │
       ├── col === 6 (YARN COMPOSITION was edited)  →  ✅ triggers
       ├── Reads col 5 (L3 Knit Type):  "Single Jersey"
       ├── Reads col 7 (Yarn Names):    "30s Cotton Ring Spun, 40s Combed Cotton"
       └── Writes col 2 (∑ FINAL FABRIC SKU):
             "Single Jersey — 30s Cotton Ring Spun, 40s Combed Cotton"
```

### Key Principle: Columns Found by HEADER NAME, Not Position

The FK engine uses `_findColumnIndex(headers, "Yarn Name")` to locate the yarn name column. This scans ALL headers in row 2 of RM_MASTER_YARN and matches by normalized name. Even though V9 shifted `Yarn Name` from col B to col E (by inserting L1/L2/L3 at B/C/D), the lookup works correctly because it matches the header text, not the column number.

---

## Columns Affected by This Fix

| Sheet | Column | What Changes |
|-------|--------|-------------|
| RM_MASTER_FABRIC col G | `← Yarn Names (Auto)` | Now correctly auto-fills with yarn names from RM_MASTER_YARN col E |
| RM_MASTER_FABRIC col B | `∑ FINAL FABRIC SKU` | Now auto-builds: `L3 Knit Type — Yarn Name1, Yarn Name2` |
| ALL masters `⟷ Tags` col | `⟷ Tags` | Now correctly triggers FK resolution (same `_isFKColumn` fix) |

---

## Functions Modified

### Module2_FKEngine.gs

| Function | Line | Change |
|----------|------|--------|
| `_isFKColumn(header)` | 935 | Added `CONFIG.HEADER_PREFIXES.TWO_WAY_SYNC` and `'<->'` checks |

### Code.gs

| Function | Line | Change |
|----------|------|--------|
| `onEdit(e)` | 88–101 | Added auto-build handler for RM_MASTER_FABRIC col B |

---

## Deployment Steps

1. Open FILE 1A in Google Sheets
2. Go to **Extensions > Apps Script**
3. Replace contents of `Module2_FKEngine.gs` with updated file
4. Replace contents of `Code.gs` with updated file
5. Save (Ctrl+S)
6. Clear cache: Run `menuClearAllCaches()` from CC ERP menu
7. Test: Enter a yarn code in RM_MASTER_FABRIC col F → verify col G shows yarn name and col B shows SKU

---

**Note:** V12.4 fixed `_isFKColumn` detection but the FK engine still failed due to stale cache / missing MASTER_RELATIONS data. See **V12.5** (`CC_ERP_V12.5_DirectFK_Fix.md`) for the complete fix that bypasses MASTER_RELATIONS + cache entirely.

*CC ERP • V12.4 FK Engine Fix • 3 Mar 2026*
