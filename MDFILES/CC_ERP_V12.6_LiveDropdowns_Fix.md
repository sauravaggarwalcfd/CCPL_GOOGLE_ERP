# CC ERP V12.6 — Frontend Live Dropdowns & HSN Auto-Fill

**Date:** 3 Mar 2026
**Scope:** Frontend ArticleMasterTab + GAS APIGateway
**Previous:** V12.5 (Direct FK Fix)

---

## Summary

Fixed the frontend webapp Article Master form to fetch **all dropdown data live** from Google Sheets via GAS API, instead of relying only on static fallback data. Added missing dropdowns (Season, Colour Names, Size Range) and HSN → GST% auto-fill in the webapp form.

---

## Changes Made

### 1. GAS — `handleGetArticleDropdowns()` (APIGateway.gs)

**Problem:** Only read 6 columns from ARTICLE_DROPDOWNS sheet. Missing col G (Size Range) added in V12.5.

**Fix:** Now reads **7 columns** (A–G):
| Col | Key | Data |
|-----|-----|------|
| A | gender | Men, Women, Kids, Unisex |
| B | fit | Regular, Slim, Relaxed, Oversized, Crop, Athletic |
| C | neckline | Round Neck, V-Neck, Polo, Henley, Hood, etc. |
| D | sleeve | Half Sleeve, Full Sleeve, Sleeveless, etc. |
| E | status | Active, Inactive, Development, Discontinued |
| F | season | SS2024, AW2024, SS2025, AW2025, SS2026, AW2026, Year Round |
| G | sizeRange | S-M-L-XL-XXL, S-M-L-XL, M-L-XL-XXL, etc. |

Returns: `{ gender:[], fit:[], neckline:[], sleeve:[], status:[], season:[], sizeRange:[] }`

### 2. Frontend — ArticleMasterTab.jsx

#### a) New State Variables
```javascript
const [seasonOpts, setSeasonOpts]       = useState(INIT_SEASON_OPTS);
const [sizeRangeOpts, setSizeRangeOpts] = useState(INIT_SIZE_RANGE_OPTS);
const [colourOpts, setColourOpts]       = useState(INIT_COLOUR_OPTS);
```

#### b) New Form Fields
Added to `emptyForm` and `handleEdit`:
- `colourNames` — single colour dropdown (from COLOR_MASTER)
- `sizeRange` — size range dropdown (from ARTICLE_DROPDOWNS col G)
- `gstPct` — auto-fill from HSN code (read-only)

#### c) Live Data Fetching (useEffect on mount)
The `fetchLiveData()` function now processes **all 7** dropdown keys from the API:
- `gender` → `setGenderOpts`
- `fit` → `setFitOpts`
- `neckline` → `setNeckOpts`
- `sleeve` → `setSleeveOpts`
- `status` → `setStatusOpts`
- `season` → `setSeasonOpts` *(NEW)*
- `sizeRange` → `setSizeRangeOpts` *(NEW)*

L1/L2/L3 hierarchy still fetched from `api.getItemCategories()` (ITEM_CATEGORIES sheet).

#### d) HSN → GST% Auto-Fill
```javascript
const HSN_GST_MAP = { "6105": 5, "6109": 5, "6110": 12, "6112": 12, "6103": 5 };
```
When L2 Category is selected:
- HSN Code auto-fills from `l2Hsn` map (from ITEM_CATEGORIES / CATEGORY_HIERARCHY)
- GST% auto-fills from `HSN_GST_MAP` based on the HSN code
- Both are displayed in the form (HSN editable, GST% read-only)

#### e) Form Layout Changes

**Row 1** (5 cols): `L1 Division* | L2 Category* | L3 Style | HSN Code | GST%`
- HSN + GST% auto-fill when L2 is selected
- GST% is read-only with grey background

**Row 3** (4 cols): `Gender | Fit Type | Neckline | Sleeve Type`
- All dropdowns fetched from ARTICLE_DROPDOWNS sheet

**Row 4** (4 cols): `Season | Colour Name(s) | Size Range | Status`
- Season: changed from text input → dropdown (fetched from ARTICLE_DROPDOWNS col F)
- Colour Names: dropdown with 16 colours (static, from COLOR_MASTER)
- Size Range: dropdown (fetched from ARTICLE_DROPDOWNS col G)
- Status: dropdown (fetched from ARTICLE_DROPDOWNS col E)

**Row 5** (4 cols): `WSP (₹) | MRP (₹) | Buyer Style No | Tags`

---

## Data Flow

```
┌─────────────────────────────┐
│   Google Sheets (FILE 1A)   │
│                             │
│  ITEM_CATEGORIES ──────────→ L1/L2/L3 dropdowns + HSN map
│  ARTICLE_DROPDOWNS ────────→ Gender, Fit, Neckline, Sleeve,
│                               Status, Season, Size Range
│  COLOR_MASTER ─────────────→ Colour Names (static fallback)
│  HSN_MASTER ───────────────→ HSN → GST% mapping
└──────────┬──────────────────┘
           │ GAS API (GET)
           ▼
┌──────────────────────────────┐
│   React Frontend             │
│                              │
│  useEffect → fetchLiveData() │
│    ├─ api.getItemCategories()│
│    └─ api.getArticleDropdowns()
│                              │
│  L2 selected → auto-fill:   │
│    ├─ hsnCode (from l2Hsn)   │
│    └─ gstPct (from HSN_GST)  │
└──────────────────────────────┘
```

---

## Files Modified

| File | Change |
|------|--------|
| `gas/File1A/APIGateway.gs` | `handleGetArticleDropdowns()`: read 7 cols, return sizeRange |
| `frontend/src/components/masters/ArticleMasterTab.jsx` | New dropdown states, form fields, Season/Colour/SizeRange dropdowns, HSN→GST auto-fill |

---

## Static Fallback Data

All dropdowns have static fallback values (INIT_*_OPTS constants) that are used until the GAS API responds. This ensures the form is usable even offline or before API loads.

| Dropdown | Static Source | Live Source |
|----------|--------------|-------------|
| L1/L2/L3 | SEED_DATA from ItemCategoryTab | api.getItemCategories() → ITEM_CATEGORIES |
| Gender | INIT_GENDER_OPTS | api.getArticleDropdowns() → col A |
| Fit | INIT_FIT_OPTS | api.getArticleDropdowns() → col B |
| Neckline | INIT_NECK_OPTS | api.getArticleDropdowns() → col C |
| Sleeve | INIT_SLEEVE_OPTS | api.getArticleDropdowns() → col D |
| Status | INIT_STATUS_OPTS | api.getArticleDropdowns() → col E |
| Season | INIT_SEASON_OPTS | api.getArticleDropdowns() → col F |
| Size Range | INIT_SIZE_RANGE_OPTS | api.getArticleDropdowns() → col G |
| Colour Names | INIT_COLOUR_OPTS | Static (COLOR_MASTER seed) |
| HSN Code | CATEGORY_HIERARCHY.defaultHSN | Auto from L2 selection |
| GST% | HSN_GST_MAP | Auto from HSN code |
