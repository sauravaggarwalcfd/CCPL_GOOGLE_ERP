# CC ERP — V12.5 Direct FK Resolution: Yarn Name + Fabric Name Fix

**Version:** V12.5
**Date:** 3 Mar 2026
**Files Changed:** `Code.gs` (3 new functions + onEdit routing change)
**Depends On:** V12.4 `_isFKColumn()` fix in `Module2_FKEngine.gs`
**Issue:** FK lookups still returning CODE instead of NAME. ARTICLE_MASTER not fetching fabric name.

---

## Problem

### Issue 1: RM_MASTER_FABRIC col G still shows yarn CODE, not yarn NAME

After V12.4 `_isFKColumn` fix, `handleFKEdit` now triggers — but `_buildCodeDisplayMap` returns an empty map because:
- **Stale cache**: The 3-layer cache (CacheService/PropertiesService) may contain pre-V9 data where column positions are wrong
- **MASTER_RELATIONS dependency**: `getRelationForColumn()` reads MASTER_RELATIONS sheet to find REL-006 config. If this sheet is empty, has wrong data, or wasn't seeded, the lookup silently fails
- **Fallback masks the bug**: `resolveMultiSelectFK` uses `name || code` — when the lookup map is empty, it returns the CODE as fallback, so the column shows RM-YRN-001 instead of "30s Cotton Ring Spun"

### Issue 2: ARTICLE_MASTER col P not fetching fabric name

Same root cause. When `→ MAIN FABRIC USED` (col O) is edited:
- `handleFKEdit` finds REL-001 in MASTER_RELATIONS
- REL-001 says `refDisplayCol = '∑ FINAL FABRIC SKU'`
- But `∑ FINAL FABRIC SKU` (col B of RM_MASTER_FABRIC) is EMPTY because the auto-build wasn't working (Issue 1)
- Result: col P shows blank or the code

---

## Root Cause: FK Engine Dependency Chain

The FK engine (`Module2_FKEngine.gs`) has a fragile dependency chain:

```
handleFKEdit(e)
  → getRelationForColumn(sheetName, header)    ← REQUIRES MASTER_RELATIONS sheet data
    → loadMasterRelations()
      → _fkGetCachedRelations()                ← MAY RETURN STALE CACHE
      → _readRelationsFromSheet()              ← REQUIRES sheet to have correct data
  → autoDisplayFKName()
    → _buildCodeDisplayMap()
      → _getReferencedSheetData()              ← MAY RETURN STALE CACHED DATA
        → getCachedData(cacheKey)              ← LAYER 1/2 CACHE (possibly pre-V9)
      → _findColumnIndex(headers, displayCol)  ← WRONG HEADERS IF CACHE IS STALE
    → lookupMap[code]                          ← EMPTY MAP → returns code as fallback
```

**Any failure at any point → silent fallback to showing the code.**

---

## Fix: Direct FK Resolution (V12.5)

### Strategy: Bypass MASTER_RELATIONS + Cache Entirely

Added 3 new functions to `Code.gs` that read referenced sheets **directly** from the live Google Sheet:
- NO cache reads (reads row 2 headers + row 4+ data fresh every time)
- NO MASTER_RELATIONS dependency (hardcoded relationship definitions)
- Finds columns by **header name matching** (using `_findColumnIndex` + `_normalizeHeader` from Module2_FKEngine.gs)

These run in `onEdit` **AFTER** `handleFKEdit(e)` and **override** whatever it wrote.

### New Functions

#### 1. `_directFKResolveOnEdit(sheet, sheetName, row, col, e)`

**Purpose:** Dispatcher called from `onEdit`. Detects specific FK edits by checking the edited column's header name, then calls the appropriate direct resolver.

**Currently handles:**
- `RM_MASTER_FABRIC` + header matches "YARN COMPOSITION" → calls `_directResolveFK` for yarn names + rebuilds SKU
- `ARTICLE_MASTER` + header matches "MAIN FABRIC USED" → calls `_directResolveFabricName`

```javascript
function _directFKResolveOnEdit(sheet, sheetName, row, col, e) {
  if (row < 4) return;

  var headerVal = String(sheet.getRange(2, col).getValue()).trim();
  var cellValue = String(e.range.getValue() || '').trim();

  // RM_MASTER_FABRIC: ⟷ YARN COMPOSITION → Yarn Names (col+1)
  if (sheetName === CONFIG.SHEETS.RM_MASTER_FABRIC) {
    var normHeader = _normalizeHeader(headerVal);
    if (normHeader === 'yarn composition') {
      var yarnDisplay = cellValue
        ? _directResolveFK(CONFIG.SHEETS.RM_MASTER_YARN, cellValue,
            '# RM Code', 'Yarn Name', true)
        : '';
      sheet.getRange(row, col + 1).setValue(yarnDisplay);

      // Rebuild ∑ FINAL FABRIC SKU
      var knitType = String(sheet.getRange(row, 5).getValue() || '').trim();
      var skuParts = [knitType, yarnDisplay].filter(function(p) { return p !== ''; });
      sheet.getRange(row, 2).setValue(skuParts.length > 0 ? skuParts.join(' — ') : '');
      return;
    }
  }

  // ARTICLE_MASTER: → MAIN FABRIC USED → Fabric Name (col+1)
  if (sheetName === CONFIG.SHEETS.ARTICLE_MASTER) {
    var normArtHeader = _normalizeHeader(headerVal);
    if (normArtHeader === 'main fabric used') {
      var fabricDisplay = cellValue
        ? _directResolveFabricName(cellValue)
        : '';
      sheet.getRange(row, col + 1).setValue(fabricDisplay);
      return;
    }
  }
}
```

#### 2. `_directResolveFK(refSheetName, codes, codeHeader, displayHeader, isMulti)`

**Purpose:** Generic direct FK resolver. Opens the referenced sheet, reads headers from row 2, finds code and display columns by header name, builds a code→display map from live data, resolves input codes.

**Key design:** No cache, no MASTER_RELATIONS. Pure sheet read + header matching.

```javascript
function _directResolveFK(refSheetName, codes, codeHeader, displayHeader, isMulti) {
  // Opens refSheetName, reads row 2 headers, row 4+ data
  // Uses _findColumnIndex(headers, codeHeader) to find code column
  // Uses _findColumnIndex(headers, displayHeader) to find display column
  // Builds map: { "RM-YRN-001": "30s Cotton Ring Spun", ... }
  // Returns resolved display name(s) or fallback to code
}
```

#### 3. `_directResolveFabricName(fabricCode)`

**Purpose:** Specialized resolver for Article → Fabric lookups. Tries `∑ FINAL FABRIC SKU` first (the full built name). If that column is empty, falls back to composing `L3 Knit Type — Yarn Names`.

```javascript
function _directResolveFabricName(fabricCode) {
  // Opens RM_MASTER_FABRIC, reads headers
  // Finds: # RM Code, ∑ FINAL FABRIC SKU, L3 Knit Type, ← Yarn Names (Auto)
  // For the matching row:
  //   1. Try ∑ FINAL FABRIC SKU → if non-empty, return it
  //   2. Fallback: compose "L3 Knit Type — Yarn Names"
  //   3. Last resort: return the code itself
}
```

---

## Updated onEdit Flow

```
1. User selects yarn code(s) in RM_MASTER_FABRIC col F  →  "RM-YRN-001, RM-YRN-002"
       │
2. onEdit(e) fires
       │
3. handleFKEdit(e)                    ← MAY FAIL (stale cache / missing MASTER_RELATIONS)
       │                                 If fails: col G gets "RM-YRN-001, RM-YRN-002" (code fallback)
       │
4. _directFKResolveOnEdit()           ← V12.5 NEW — ALWAYS WORKS
       │
       ├── Reads RM_MASTER_YARN directly (no cache)
       ├── Finds "# RM Code" col by header  → index 0
       ├── Finds "Yarn Name" col by header   → index 4
       ├── Builds map: { "RM-YRN-001": "30s Cotton Ring Spun", ... }
       ├── Resolves: "30s Cotton Ring Spun, 40s Combed Cotton"
       ├── Writes col G: "30s Cotton Ring Spun, 40s Combed Cotton"  ← OVERRIDES step 3
       │
       └── Rebuilds col B (∑ FINAL FABRIC SKU):
             "Single Jersey — 30s Cotton Ring Spun, 40s Combed Cotton"

5. Auto SKU handler (col 5 only now)
       │
       └── Only triggers when L3 Knit Type (col 5) is edited
           (col 6 edits are handled by step 4)
```

### Article → Fabric Flow

```
1. User selects fabric code in ARTICLE_MASTER col O  →  "RM-FAB-001"
       │
2. onEdit(e) fires
       │
3. handleFKEdit(e)                    ← MAY FAIL
       │
4. _directFKResolveOnEdit()           ← V12.5 NEW
       │
       ├── Reads RM_MASTER_FABRIC directly (no cache)
       ├── Finds row where # RM Code = "RM-FAB-001"
       ├── Tries ∑ FINAL FABRIC SKU → "Single Jersey — 30s Cotton Ring Spun"
       │   (if empty, falls back to composing from L3 Knit Type + Yarn Names)
       │
       └── Writes col P: "Single Jersey — 30s Cotton Ring Spun"
```

---

## Columns Affected

| Sheet | Column | What Changes |
|-------|--------|-------------|
| RM_MASTER_FABRIC col G | `← Yarn Names (Auto)` | Now auto-fills with yarn NAMES (not codes) via direct sheet read |
| RM_MASTER_FABRIC col B | `∑ FINAL FABRIC SKU` | Auto-builds: `L3 Knit Type — Yarn Name(s)` |
| ARTICLE_MASTER col P | `← Fabric Name (Auto)` | Now auto-fills with fabric display name from RM_MASTER_FABRIC |

---

## Functions Added / Modified

### Code.gs — New Functions

| Function | Purpose |
|----------|---------|
| `_directFKResolveOnEdit(sheet, sheetName, row, col, e)` | Dispatcher: detects FK edits, calls appropriate direct resolver |
| `_directResolveFK(refSheetName, codes, codeHeader, displayHeader, isMulti)` | Generic: reads ref sheet directly, resolves codes → display names |
| `_directResolveFabricName(fabricCode)` | Specialized: resolves fabric code with SKU fallback logic |

### Code.gs — Modified

| Function | Change |
|----------|--------|
| `onEdit(e)` | Added `_directFKResolveOnEdit()` call after `handleFKEdit(e)`. Changed SKU handler to trigger on col 5 only (col 6 handled by direct resolver). |

### Module2_FKEngine.gs — No Changes in V12.5

(V12.4 `_isFKColumn` fix still applies)

---

## Why Direct Resolution Works When FK Engine Doesn't

| Factor | FK Engine (handleFKEdit) | Direct Resolution (V12.5) |
|--------|--------------------------|---------------------------|
| MASTER_RELATIONS | **Required** — reads REL-006 entry | **Not needed** — relationships hardcoded |
| Cache | **Uses 3-layer cache** — may be stale | **Never caches** — reads sheet live |
| Column finding | Via cache → `_findColumnIndex` | Direct read → `_findColumnIndex` |
| Failure mode | Silent fallback to code | Explicit logging, still falls back |
| Performance | Faster (cached) | Slightly slower (live read) |

The direct resolvers trade a small performance cost for **guaranteed correctness**. The FK engine can still handle all other FK columns via MASTER_RELATIONS; the direct resolvers only override for these two critical relationships.

---

## Deployment Steps

1. Open FILE 1A in Google Sheets
2. Go to **Extensions > Apps Script**
3. Replace contents of `Code.gs` with updated file
4. Save (Ctrl+S)
5. **Clear cache**: Run `menuClearAllCaches()` from CC ERP menu (⚙ CC ERP → 🗑️ Clear All Caches)
6. Test:
   - RM_MASTER_FABRIC: Enter a yarn code in col F → verify col G shows yarn **NAME** and col B shows SKU
   - ARTICLE_MASTER: Enter a fabric code in col O → verify col P shows fabric name

---

*CC ERP • V12.5 Direct FK Resolution Fix • 3 Mar 2026*
