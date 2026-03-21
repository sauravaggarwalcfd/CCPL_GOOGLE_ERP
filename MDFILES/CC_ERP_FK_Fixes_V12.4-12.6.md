# CC ERP — FK Engine & Frontend Fixes V12.4–12.6

**Date:** 3 Mar 2026
**Files Changed:** `Module2_FKEngine.gs`, `Code.gs`, `APIGateway.gs`, `ArticleMasterTab.jsx`
**Replaces:** `CC_ERP_V12.4_FK_YarnName_Fix.md`, `CC_ERP_V12.5_DirectFK_Fix.md`, `CC_ERP_V12.6_LiveDropdowns_Fix.md`

---

## V12.4 — FK Column Detection Fix

**Problem:** `_isFKColumn()` in `Module2_FKEngine.gs` didn't recognize `⟷` (TWO_WAY_SYNC) prefix, so `handleFKEdit` never triggered for yarn composition or tags columns.

**Fix:** Added `⟷` and `<->` detection to `_isFKColumn()` (line 935). Also added Fabric SKU auto-build handler in `Code.gs` `onEdit` for RM_MASTER_FABRIC col B.

**Affected columns:** RM_MASTER_FABRIC col G (← Yarn Names), col B (∑ FINAL FABRIC SKU), ALL `⟷ Tags` columns.

---

## V12.5 — Direct FK Resolution (Bypass Cache)

**Problem:** Even after V12.4, FK lookups returned CODE instead of NAME due to stale 3-layer cache and missing/wrong MASTER_RELATIONS data.

**Fix:** 3 new functions in `Code.gs` bypass MASTER_RELATIONS + cache entirely:

| Function | Purpose |
|----------|---------|
| `_directFKResolveOnEdit(sheet, sheetName, row, col, e)` | Dispatcher: detects FK edits by header name, calls resolver |
| `_directResolveFK(refSheetName, codes, codeHeader, displayHeader, isMulti)` | Generic: reads ref sheet live, resolves codes → display names |
| `_directResolveFabricName(fabricCode)` | Specialized: resolves fabric code with SKU fallback |

**Key design:** No cache, no MASTER_RELATIONS. Pure sheet read + header matching. Runs AFTER `handleFKEdit` and overrides whatever it wrote.

**onEdit flow:**
```
User edits FK column → onEdit → handleFKEdit (may fail) → _directFKResolveOnEdit (always works, overrides)
```

**Currently handles:**
- `RM_MASTER_FABRIC` + "YARN COMPOSITION" → yarn names + SKU rebuild
- `ARTICLE_MASTER` + "MAIN FABRIC USED" → fabric display name

---

## V12.6 — Frontend Live Dropdowns & HSN Auto-Fill

**Problem:** Frontend only read 6 columns from ARTICLE_DROPDOWNS. Missing Season + Size Range. No HSN→GST auto-fill.

**GAS fix:** `handleGetArticleDropdowns()` now reads 7 columns (A–G), returns `{ gender, fit, neckline, sleeve, status, season, sizeRange }`.

**Frontend fix (ArticleMasterTab.jsx):**
- New states: `seasonOpts`, `sizeRangeOpts`, `colourOpts`
- New form fields: `colourNames`, `sizeRange`, `gstPct`
- HSN→GST% auto-fill via `HSN_GST_MAP` when L2 is selected
- All dropdowns have static fallbacks (INIT_*_OPTS) until API responds

**Form layout:**
- Row 1: L1* | L2* | L3 | HSN Code | GST%
- Row 3: Gender | Fit | Neckline | Sleeve
- Row 4: Season | Colour | Size Range | Status
- Row 5: WSP | MRP | Buyer Style No | Tags

---

## Key Principle

**Columns found by HEADER NAME, not position.** The FK engine uses `_findColumnIndex(headers, "Yarn Name")` to locate columns. Even when V9 shifted columns by inserting L1/L2/L3, header-based matching works correctly.

---

## Deployment

1. Replace `Module2_FKEngine.gs` (V12.4 fix)
2. Replace `Code.gs` (V12.5 direct resolvers)
3. Replace `APIGateway.gs` (V12.6 dropdowns)
4. Deploy frontend (V12.6 form changes)
5. Clear cache: `menuClearAllCaches()` from CC ERP menu

*CC ERP • FK Engine Fixes V12.4–12.6 • 3 Mar 2026*
