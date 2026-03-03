# CC ERP — Complete Column Reference & Connection Guide

> **Version:** V12.4 (3 Mar 2026) — FK Engine + Fabric SKU fixes
> **Files:** 4 Google Sheets | 56 Total Sheets | 24 GAS Files (14,407 lines) | React Frontend
> **Generated:** 2 Mar 2026
> **V9.1 Fixes:** Article Code manual entry, duplicate check self-match, L1/L2/L3 from ITEM_CATEGORIES
> **V10 Changes:** ITEM_CATEGORIES restructured to column-grouped layout (22 cols). New ARTICLE_DROPDOWNS sheet. FK_DATA split per level. Auto-description (L1 › L2 › L3).
> **V12.4 Fixes:** `_isFKColumn()` now recognizes `⟷` prefix → Yarn Names + Tags auto-fill works. Fabric SKU (col B) auto-builds from L3 Knit Type + Yarn Names.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [FILE 1A — Items Master (22 Sheets)](#2-file-1a--items-master-22-sheets)
   - [ARTICLE_MASTER](#21-article_master-27-columns)
   - [RM_MASTER_FABRIC](#22-rm_master_fabric-27-columns)
   - [RM_MASTER_YARN](#23-rm_master_yarn-18-columns)
   - [RM_MASTER_WOVEN](#24-rm_master_woven-17-columns)
   - [TRIM_MASTER](#25-trim_master-30-columns)
   - [TRIM_ATTR_NAMES](#26-trim_attr_names-9-columns)
   - [TRIM_ATTR_VALUES](#27-trim_attr_values-5-columns)
   - [CONSUMABLE_MASTER](#28-consumable_master-23-columns)
   - [CONSUMABLE_ATTR_NAMES / ATTR_VALUES](#29-consumable_attr_names--attr_values)
   - [PACKAGING_MASTER](#210-packaging_master-23-columns)
   - [PACKAGING_ATTR_NAMES / ATTR_VALUES](#211-packaging_attr_names--attr_values)
   - [ITEM_CATEGORIES](#212-item_categories-9-columns-138-rows)
   - [Reference Masters](#213-reference-masters)
   - [ITEM_CHANGE_LOG](#214-item_change_log-10-columns)
   - [MASTER_RELATIONS](#215-master_relations-13-columns)
3. [FILE 1B — Factory Master (23 Sheets)](#3-file-1b--factory-master-23-sheets)
4. [FILE 1C — Finance Master (6 Sheets)](#4-file-1c--finance-master-6-sheets)
5. [FILE 2 — Procurement (5 Sheets)](#5-file-2--procurement-5-sheets)
6. [Frontend ↔ GAS Connection](#6-frontend--gas-connection)
7. [API Endpoints (22 Routes)](#7-api-endpoints-22-routes)
8. [Caching System (3-Layer)](#8-caching-system-3-layer)
9. [Code Generation Rules](#9-code-generation-rules)
10. [Validation & FK Engine](#10-validation--fk-engine)
11. [Access Control (7 Roles)](#11-access-control-7-roles)
12. [Header Symbol Legend](#12-header-symbol-legend)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                 REACT FRONTEND                    │
│  App.jsx → Masters/Procurement/Settings/Users     │
│  services/api.js → ALL GET requests to GAS        │
│  constants/masterSchemas.js → Column definitions  │
└─────────────────────┬────────────────────────────┘
                      │ HTTP GET (JSON payload in query param)
                      ▼
┌──────────────────────────────────────────────────┐
│            GAS BACKEND (APIGateway.gs)            │
│  doGet(e) → handleAPIRequest() → 22 routes        │
│  Returns: JSON { success, data, error }           │
└─────────────┬───────────┬──────────┬─────────────┘
              │           │          │
    ┌─────────▼──┐  ┌─────▼───┐  ┌──▼───────┐  ┌──────────┐
    │  FILE 1A   │  │ FILE 1B │  │ FILE 1C  │  │  FILE 2  │
    │ Items (22) │  │ Fac (23)│  │ Fin (6)  │  │ Proc (5) │
    └────────────┘  └─────────┘  └──────────┘  └──────────┘
```

**Row Structure (All Sheets):**
| Row | Purpose | Style |
|-----|---------|-------|
| 1 | Banner | Dark bg (#1A1A2E), white bold, merged |
| 2 | Headers | Red bg (#CC0000), white bold, **frozen** |
| 3 | Descriptions | Light blue bg (#D6EAF8), italic, **frozen** |
| 4+ | Data | White bg, editable |

**Freeze:** Row 4, Column A (rows 1-3 + col A frozen)

---

## 2. FILE 1A — Items Master (22 Sheets)

**File ID:** `1eaDbKEJpty6c7_FrVm5wElOce_z4yHRMr3E-SAskdMc`
**GAS Source:** `/workspaces/CCPL_GOOGLE_ERP/gas/File1A/`
**Frontend Schema:** `/workspaces/CCPL_GOOGLE_ERP/frontend/src/constants/masterSchemas.js`

---

### 2.1 ARTICLE_MASTER (28 columns)

| Col | Header | Frontend Key | Type | Behavior | FK Target | Notes |
|-----|--------|-------------|------|----------|-----------|-------|
| A | `🔑 Article Code` | `code` | **Manual** | **User enters** | — | Format: `5249HP` (4-5 digits + 2 CAPS). **V9.1 FIX:** Changed from auto:true to manual input. GAS validates regex `^[0-9]{4,5}[A-Z]{2}$` and checks duplicates (excluding self-row). |
| B | `Article Description` | `desc` | Text | User enters | — | Full name with construction |
| C | `Short Name` | `shortName` | Text | User enters | — | Max 25 chars |
| D | `IMAGE LINK` | `imageLink` | Text | User enters | — | Google Drive URL |
| E | `⟷ SKETCH DRIVE LINKS` | `sketchLinks` | Multi-link | Append-only | — | Log of sketch URLs |
| F | `Buyer Style No` | `buyerStyle` | Text | User enters | — | Optional buyer reference |
| **G** | **`L1 Division`** | `l1Division` | FK Dropdown | **SELECTABLE** | ITEM_CATEGORIES | Men's/Women's/Kids/Unisex Apparel. **V9.1 FIX:** Options now derived from SEED_DATA. |
| **H** | **`L2 Product Category`** | `l2Category` | FK Dropdown | Cascading | ITEM_CATEGORIES | Cascades from L1. **V9.1 FIX:** Built from ITEM_CATEGORIES. |
| **I** | **`L3 Style`** | `l3Style` | FK Dropdown | Cascading | ITEM_CATEGORIES | **V9 NEW** — Cascades from L2. Added to schema + FIELD_META in V9.1. |
| J | `Season` | `season` | Multi-select | User picks | — | SS25, AW25, etc. |
| K | `Gender` | `gender` | Dropdown | User picks | — | Men, Women, Kids, Unisex |
| L | `Fit Type` | `fit` | Dropdown | User picks | — | Regular, Slim, Oversized, Athletic |
| M | `Neckline` | `neckline` | Dropdown | User picks | — | Round, V-Neck, Hooded, Mock |
| N | `Sleeve Type` | `sleeveType` | Dropdown | User picks | — | Half, Full, Sleeveless, Raglan |
| O | `→ MAIN FABRIC USED` | `mainFabric` | FK Code | User selects | RM_MASTER_FABRIC | Stores `RM-FAB-NNN` code only |
| P | `← Fabric Name (Auto)` | `fabricName` | Auto-display | **GAS fills** | — | Read-only, from RM_MASTER_FABRIC |
| Q | `Color Code(s)` | `colorCodes` | Multi-FK | User selects | COLOR_MASTER | Multiple color codes |
| R | `Size Range` | `sizeRange` | Display | **Auto-calc** | — | From SIZE_MASTER |
| S | `∑ FINAL MARKUP %` | `markupPct` | Formula | **GAS formula** | — | `(MRP−WSP)÷WSP×100` |
| T | `∑ FINAL MARKDOWN %` | `markdownPct` | Formula | **GAS formula** | — | `(MRP−WSP)÷MRP×100` |
| U | `W.S.P (Rs)` | `wsp` | Currency | User enters | — | Wholesale price per piece (₹) |
| V | `MRP (Rs)` | `mrp` | Currency | User enters | — | Maximum retail price (₹) |
| W | `→ HSN Code` | `hsnCode` | FK Code | User selects | HSN_MASTER | 6-8 digit HSN |
| X | `← GST % (Auto)` | `gstPct` | Auto-display | **GAS fills** | — | Read-only, from HSN_MASTER |
| Y | `Status` | `status` | Dropdown | User picks | — | Active/Inactive/Development/Discontinued |
| Z | `Remarks` | `remarks` | Text | User enters | — | Free-text notes |
| AA | `⟷ Tags` | `tags` | Multi-FK | User selects | TAG_MASTER | Multiple tag codes |

**L1/L2/L3 Behavior:** L1 is **SELECTABLE** (user picks from dropdown). L2 cascades from L1. L3 cascades from L2.
**Frontend Component:** `ItemCategoryTab.jsx` (2176 lines) — handles the cascading hierarchy.
**Frontend Schema:** `SCHEMA_ARTICLE_MASTER` in `masterSchemas.js`

---

### 2.2 RM_MASTER_FABRIC (27 columns)

| Col | Header | Frontend Key | Type | Behavior | FK Target | Notes |
|-----|--------|-------------|------|----------|-----------|-------|
| A | `# RM Code` | `code` | Auto-code | **GAS generates** | — | `RM-FAB-001`, `RM-FAB-002`, ... |
| B | `∑ FINAL FABRIC SKU` | `fabricSku` | Formula | **GAS auto-build** | — | V12.4: `L3 Knit Type — Yarn Name(s)` built on edit of col E or F |
| **C** | **`L1 Division`** | `l1Division` | Fixed | **Auto-fill** | — | Always "Raw Material" (green bg, read-only) |
| **D** | **`L2 Category`** | `l2Category` | Fixed | **Auto-fill** | — | Always "Knit Fabric" (green bg, read-only) |
| **E** | **`L3 Knit Type`** | `l3KnitType` | Dropdown | User picks | ITEM_CATEGORIES | Single Jersey, Pique, Fleece, French Terry, etc. |
| F | `⟷ YARN COMPOSITION` | `yarnComp` | Multi-FK | User selects | RM_MASTER_YARN | Select `RM-YRN-NNN` codes |
| G | `← Yarn Names (Auto)` | `yarnNames` | Auto-display | **GAS fills** | — | Read-only, from RM_MASTER_YARN |
| H | `FABRIC TYPE` | `fabricType` | Dropdown | User picks | — | KORA / FINISHED |
| I | `COLOUR` | `colour` | Dropdown | User picks | — | KORA/COLOURED/DYED/MEL |
| J | `GSM (Min)` | `gsmMin` | Number | User enters | — | Grams per sq meter |
| K | `GSM (Max)` | `gsmMax` | Number | User enters | — | Grams per sq meter |
| L | `Width (inches)` | `width` | Number | User enters | — | Tube/Open width |
| M | `UOM` | `uom` | Dropdown | User picks | UOM_MASTER | KG, MTR, PCS, SET, ROLL, CONE |
| N | `→ HSN Code` | `hsnCode` | FK Code | User selects | HSN_MASTER | 6-8 digit HSN |
| O | `← GST % (Auto)` | `gstPct` | Auto-display | **GAS fills** | — | Read-only |
| P | `→ Primary Supplier` | `supplier` | FK Code | User selects | SUPPLIER_MASTER (1B) | Cross-file FK |
| Q | `Supplier Code` | `supplierCode` | Text | User enters | — | Supplier's own catalogue code |
| R | `← Supplier Name (Auto)` | `supplierName` | Auto-display | **GAS fills** | — | Read-only, from SUPPLIER_MASTER |
| S | `Lead Time (Days)` | `leadTime` | Number | User enters | — | Procurement lead time |
| T | `Reorder Level` | `reorderLevel` | Number | User enters | — | Stock trigger qty |
| U | `Min Order Qty` | `moq` | Number | User enters | — | Minimum order quantity |
| V | `Cost per UOM` | `costPerUom` | Currency | User enters | — | ₹ per UOM |
| W | `Season` | `season` | Dropdown | User picks | — | SS25, AW25, Year Round |
| X | `Status` | `status` | Dropdown | User picks | — | Active/Inactive/Dev/Discontinued |
| Y | `Remarks` | `remarks` | Text | User enters | — | Free-text notes |
| Z | `← FINISHED FABRIC COST (Auto)` | `finishedCost` | Auto-display | **GAS fills** | — | Phase 3 link (future) |
| AA | `⟷ Tags` | `tags` | Multi-FK | User selects | TAG_MASTER | Multiple tag codes |

**L1/L2 Behavior:** **FIXED** — Auto-populated with green background, user cannot change.
**Code Gen Trigger:** GAS auto-fills col A when user starts editing a new row.
**Frontend Schema:** `SCHEMA_RM_FABRIC` in `masterSchemas.js`

---

### 2.3 RM_MASTER_YARN (18 columns)

| Col | Header | Frontend Key | Type | Behavior | FK Target | Notes |
|-----|--------|-------------|------|----------|-----------|-------|
| A | `# RM Code` | `code` | Auto-code | **GAS generates** | — | `RM-YRN-001`, `RM-YRN-002`, ... |
| **B** | **`L1 Division`** | `l1Division` | Fixed | **Auto-fill** | — | "Raw Material" |
| **C** | **`L2 Category`** | `l2Category` | Fixed | **Auto-fill** | — | "Yarn" |
| **D** | **`L3 Yarn Type`** | `l3YarnType` | Dropdown | User picks | ITEM_CATEGORIES | Cotton Combed, Polyester, PC Blend, Viscose, Melange |
| E | `Yarn Name` | `yarnName` | Text | User enters | — | Full yarn description |
| F | `Colour Type` | `colourType` | Dropdown | User picks | — | Raw / Dyed / Melange |
| G | `Colour (if dyed)` | `colour` | Text | Conditional | — | Only if dyed/melange |
| H | `→ HSN Code` | `hsnCode` | FK Code | User selects | HSN_MASTER | 6-8 digit HSN |
| I | `← GST % (Auto)` | `gstPct` | Auto-display | **GAS fills** | — | Read-only |
| J | `→ Supplier Code` | `supplier` | FK Code | User selects | SUPPLIER_MASTER (1B) | Cross-file FK |
| K | `← Primary Supplier` | `supplierName` | Auto-display | **GAS fills** | — | Read-only |
| L | `← Supplier Name (Auto)` | `supplierFullName` | Auto-display | **GAS fills** | — | Read-only |
| M | `Season for Cost` | `season` | Text | User enters | — | SS25/AW25 |
| N | `Avg Cost (excl GST)` | `avgCost` | Currency | User enters | — | ₹ per KG |
| O | `GST % for Cost` | `gstForCost` | Number | User enters | — | GST rate % |
| P | `∑ Total Cost (incl GST)` | `totalCost` | Formula | **GAS formula** | — | `Cost × (1+GST%/100)` |
| Q | `Status` | `status` | Dropdown | User picks | — | Active/Inactive |
| R | `Remarks` | `remarks` | Text | User enters | — | Composition notes |

**L1/L2/L3 Behavior:** L1 & L2 are **FIXED**. L3 is user-selectable dropdown.

---

### 2.4 RM_MASTER_WOVEN (17 columns)

| Col | Header | Frontend Key | Type | Behavior | FK Target | Notes |
|-----|--------|-------------|------|----------|-----------|-------|
| A | `# RM Code` | `code` | Auto-code | **GAS generates** | — | `RM-WVN-001`, ... |
| **B** | **`L1 Division`** | `l1Division` | Fixed | **Auto-fill** | — | "Raw Material" |
| **C** | **`L2 Category`** | `l2Category` | Fixed | **Auto-fill** | — | "Woven / Interlining" |
| D | `Woven/Interlining Name` | `wovenName` | Text | User enters | — | Full description |
| **E** | **`L3 Woven Type`** | `l3WovenType` | Dropdown | User picks | ITEM_CATEGORIES | Fusible, Non-Fusible, Woven Fabric, Collar Canvas, Lining |
| F | `Composition` | `composition` | Text | User enters | — | Fabric blend |
| G | `Width (inches)` | `width` | Number | User enters | — | |
| H | `Weight (GSM)` | `weight` | Number | User enters | — | |
| I | `UOM` | `uom` | Dropdown | User picks | UOM_MASTER | MTR / KG |
| J | `→ HSN Code` | `hsnCode` | FK Code | User selects | HSN_MASTER | |
| K | `← GST % (Auto)` | `gstPct` | Auto-display | **GAS fills** | — | Read-only |
| L | `→ Primary Supplier` | `supplier` | FK Code | User selects | SUPPLIER_MASTER (1B) | Cross-file FK |
| M | `← Supplier Name (Auto)` | `supplierName` | Auto-display | **GAS fills** | — | Read-only |
| N | `Cost per UOM` | `costPerUom` | Currency | User enters | — | ₹ per UOM |
| O | `Reorder Level` | `reorderLevel` | Number | User enters | — | Stock trigger |
| P | `Status` | `status` | Dropdown | User picks | — | Active/Inactive |
| Q | `Remarks` | `remarks` | Text | User enters | — | |

---

### 2.5 TRIM_MASTER (30 columns)

| Col | Header | Frontend Key | Type | Behavior | FK Target | Notes |
|-----|--------|-------------|------|----------|-----------|-------|
| A | `# TRM Code` | `code` | Auto-code | **GAS generates** | — | `TRM-THD-001`, `TRM-LBL-001` (per-category) |
| B | `Parent Code` | `parentCode` | FK Code | User enters | Self-ref | Variant parent |
| C | `⚠ Trim Name` | `trimName` | Text | **Required** | — | ⚠ means mandatory |
| **D** | **`L1 Division`** | `l1Division` | Fixed | **Auto-fill** | — | "Trim" (green bg) |
| **E** | **`L2 Trim Category`** | `l2TrimCat` | Dropdown | User picks | ITEM_CATEGORIES | THD/LBL/ELS/ZIP/BUT/TPE/DRW/VLC/RVT/THP/OTH |
| F | `L3 Sub-Category` | `l3SubCat` | Dropdown | Cascading | ITEM_CATEGORIES | Specific trim sub-type |
| G | `IMAGE LINK` | `imageLink` | Text | User enters | — | Google Drive link |
| H | `→ COLOUR CODE` | `colourCode` | FK Code | User selects | COLOR_MASTER | Single color FK |
| I | `← Color/Shade Name (Auto)` | `colourName` | Auto-display | **GAS fills** | — | Read-only |
| J | `UOM` | `uom` | Dropdown | User picks | UOM_MASTER | CONE, MTR, PCS, KG, SET, ROLL |
| K | `→ HSN Code` | `hsnCode` | FK Code | User selects | HSN_MASTER | |
| L | `← GST % (Auto)` | `gstPct` | Auto-display | **GAS fills** | — | Read-only |
| M | `→ Primary Supplier` | `supplier` | FK Code | User selects | SUPPLIER_MASTER (1B) | Cross-file FK |
| N | `Supplier Code` | `supplierCode` | Text | User enters | — | Supplier's own code |
| O | `Lead Time (Days)` | `leadTime` | Number | User enters | — | |
| P | `Reorder Level` | `reorderLevel` | Number | User enters | — | Stock trigger |
| Q | `Status` | `status` | Dropdown | User picks | — | Active/Inactive/Dev/Discontinued |
| R | `Attr 1 Name` | `attr1Name` | Auto-text | **GAS fills** | TRIM_ATTR_NAMES | Auto from category |
| S | `Attr 1 Value` | `attr1Value` | Dropdown | User picks | TRIM_ATTR_VALUES | Values for attr 1 |
| T | `Attr 2 Name` | `attr2Name` | Auto-text | **GAS fills** | TRIM_ATTR_NAMES | |
| U | `Attr 2 Value` | `attr2Value` | Dropdown | User picks | TRIM_ATTR_VALUES | |
| V | `Attr 3 Name` | `attr3Name` | Auto-text | **GAS fills** | TRIM_ATTR_NAMES | |
| W | `Attr 3 Value` | `attr3Value` | Dropdown | User picks | TRIM_ATTR_VALUES | |
| X | `Attr 4 Name` | `attr4Name` | Auto-text | **GAS fills** | TRIM_ATTR_NAMES | |
| Y | `Attr 4 Value` | `attr4Value` | Dropdown | User picks | TRIM_ATTR_VALUES | |
| Z | `Attr 5 Name` | `attr5Name` | Auto-text | **GAS fills** | TRIM_ATTR_NAMES | |
| AA | `Attr 5 Value` | `attr5Value` | Dropdown | User picks | TRIM_ATTR_VALUES | |
| AB | `Attr 6 Name` | `attr6Name` | Auto-text | **GAS fills** | TRIM_ATTR_NAMES | |
| AC | `Attr 6 Value` | `attr6Value` | Dropdown | User picks | TRIM_ATTR_VALUES | |
| AD | `Remarks` | `remarks` | Text | User enters | — | Brand notes, quality flag |

**Attribute System:** When user picks L2 category (e.g., THD), GAS reads TRIM_ATTR_NAMES for that category and auto-fills attr name columns. Attr value columns get dropdowns from TRIM_ATTR_VALUES.
**Special:** If attr name is `Color(REF NAME)`, the value dropdown loads from COLOR_MASTER instead of ATTR_VALUES.
**Code Gen:** Per-category sequence — e.g., all "Thread" items get `TRM-THD-NNN`, all "Label" items get `TRM-LBL-NNN`.

---

### 2.6 TRIM_ATTR_NAMES (9 columns)

| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Category Code | Text | THD, LBL, ELS, ZIP, BUT, TPE, DRW, VLC, RVT, THP |
| B | Category Name | Text | Full name (Thread, Label, Elastic, etc.) |
| C | Attr 1 Name | Text | e.g., "Type" |
| D | Attr 2 Name | Text | e.g., "Denier" |
| E | Attr 3 Name | Text | e.g., "Ply" |
| F | Attr 4 Name | Text | e.g., "Color(REF NAME)" |
| G | Attr 5 Name | Text | |
| H | Attr 6 Name | Text | |
| I | Active | Dropdown | Yes/No |

**How it works:** Module3_AttrSync reads this sheet when L2 category is selected, then writes attr names to TRIM_MASTER cols R/T/V/X/Z/AB.

---

### 2.7 TRIM_ATTR_VALUES (5 columns)

| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Category Code | Text | THD, LBL, etc. |
| B | Attr Name | Text | Matches name from ATTR_NAMES |
| C | Attr Value | Text | The dropdown option |
| D | Sort Order | Number | Display order in dropdown |
| E | Active | Dropdown | Yes/No |

**How it works:** Module3_AttrSync filters by category + attr name to build dropdown for each attr value column.

---

### 2.8 CONSUMABLE_MASTER (23 columns)

| Col | Header | Type | Behavior | Notes |
|-----|--------|------|----------|-------|
| A | `# CON Code` | Auto-code | **GAS generates** | `CON-DYE-001`, `CON-NDL-001` (per-category) |
| B | `Parent Code` | FK Code | Self-ref | Variant parent |
| C | `⚠ Consumable Name` | Text | **Required** | |
| **D** | **`L1 Division`** | Fixed | **Auto-fill** | "Consumable" (green bg) |
| **E** | **`L2 Category`** | Dropdown | User picks | Softener, Fixer, Needle, Oil, Fuel, Cleaning, Other |
| F | `L3 Sub Type` | Dropdown | Cascading | Specific consumable type |
| G | `IMAGE LINK` | Text | User enters | |
| H | `→ COLOUR CODE` | FK Code | User selects → COLOR_MASTER | |
| I | `← Color Name (Auto)` | Auto-display | **GAS fills** | |
| J | `UOM` | Dropdown | User picks → UOM_MASTER | |
| K | `→ HSN Code` | FK Code | User selects → HSN_MASTER | |
| L | `← GST % (Auto)` | Auto-display | **GAS fills** | |
| M | `→ Primary Supplier` | FK Code | User selects → SUPPLIER_MASTER | Cross-file |
| N | `Supplier Code` | Text | User enters | |
| O | `Lead Time (Days)` | Number | User enters | |
| P | `Reorder Level` | Number | User enters | |
| Q | `Status` | Dropdown | User picks | Active/Inactive |
| R-S | `Attr 1 Name/Value` | Auto/Dropdown | GAS fills name, user picks value | |
| T-U | `Attr 2 Name/Value` | Auto/Dropdown | | |
| V-W | `Attr 3 Name/Value` | Auto/Dropdown | | |
| X-Y | `Attr 4 Name/Value` | Auto/Dropdown | | |

**Same attr system as TRIM** but with 4 pairs instead of 6. Uses CON_ATTR_NAMES and CON_ATTR_VALUES sheets.

---

### 2.9 CONSUMABLE_ATTR_NAMES / ATTR_VALUES

Identical structure to TRIM_ATTR_NAMES (but only Attr 1-4) and TRIM_ATTR_VALUES. Separate sheets.

---

### 2.10 PACKAGING_MASTER (23 columns)

| Col | Header | Type | Behavior | Notes |
|-----|--------|------|----------|-------|
| A | `# PKG Code` | Auto-code | **GAS generates** | `PKG-PLY-001`, `PKG-CTN-001` (per-category) |
| B | `Parent Code` | FK Code | Self-ref | |
| C | `⚠ Packaging Name` | Text | **Required** | |
| **D** | **`L1 Division`** | Fixed | **Auto-fill** | "Packaging" (green bg) |
| **E** | **`L2 Category`** | Dropdown | User picks | Poly Bag, Carton, Hanger, Price Tag, Tissue, Sticker, Other |
| F | `L3 Sub-Category` | Dropdown | Cascading | Specific packaging type |
| G | `IMAGE LINK` | Text | User enters | |
| H | `→ COLOUR CODE` | FK Code | User selects → COLOR_MASTER | |
| I | `← Color Name (Auto)` | Auto-display | **GAS fills** | |
| J | `UOM` | Dropdown | User picks → UOM_MASTER | |
| K | `→ HSN Code` | FK Code | User selects → HSN_MASTER | |
| L | `← GST % (Auto)` | Auto-display | **GAS fills** | |
| M | `→ Primary Supplier` | FK Code | User selects → SUPPLIER_MASTER | Cross-file |
| N | `Supplier Code` | Text | User enters | |
| O | `Lead Time (Days)` | Number | User enters | |
| P | `Reorder Level` | Number | User enters | |
| Q | `Status` | Dropdown | User picks | |
| R-Y | `Attr 1-4 Name/Value` | Auto/Dropdown | Same system as Consumable | 4 attr pairs |

Uses PKG_ATTR_NAMES and PKG_ATTR_VALUES sheets.

---

### 2.11 PACKAGING_ATTR_NAMES / ATTR_VALUES

Identical structure to CONSUMABLE_ATTR_NAMES / ATTR_VALUES. Separate sheets.

---

### 2.12 ITEM_CATEGORIES — Column-Grouped by Master (22 columns, V10)

Central lookup for L1/L2/L3 hierarchy. **V10 restructure:** columns grouped by master (3 cols each).
Each master fills rows independently — they do not need to align across groups.

| Col | Header | Master | Level | Notes |
|-----|--------|--------|-------|-------|
| A | # | — | — | Row number |
| **B** | **Article L1** | ARTICLE | L1 | Men's/Women's/Kids/Unisex Apparel (SELECTABLE) |
| **C** | **Article L2** | ARTICLE | L2 | Tops-Polo, Tops-Tee, Sweatshirt, Tracksuit, Bottoms |
| **D** | **Article L3** | ARTICLE | L3 | Pique Polo, Round Neck Tee, Hoodie, Jogger, etc. |
| **E** | **Fabric L1** | RM-FABRIC | L1 | Fixed: "Raw Material" (green bg) |
| **F** | **Fabric L2** | RM-FABRIC | L2 | Fixed: "Knit Fabric" (green bg) |
| **G** | **Fabric L3** | RM-FABRIC | L3 | Single Jersey, Pique, Fleece, French Terry, etc. |
| **H** | **Yarn L1** | RM-YARN | L1 | Fixed: "Raw Material" (green bg) |
| **I** | **Yarn L2** | RM-YARN | L2 | Fixed: "Yarn" (green bg) |
| **J** | **Yarn L3** | RM-YARN | L3 | Cotton Combed, Polyester, PC Blend, etc. |
| **K** | **Woven L1** | RM-WOVEN | L1 | Fixed: "Raw Material" (green bg) |
| **L** | **Woven L2** | RM-WOVEN | L2 | Fixed: "Woven / Interlining" (green bg) |
| **M** | **Woven L3** | RM-WOVEN | L3 | Fusible, Non-Fusible, Woven Fabric |
| **N** | **Trim L1** | TRIM | L1 | Fixed: "Trim" (green bg) |
| **O** | **Trim L2** | TRIM | L2 | Thread, Label, Elastic, Zipper, Button, etc. |
| **P** | **Trim L3** | TRIM | L3 | Sewing Thread, Main Label, Crochet Elastic, etc. |
| **Q** | **Consumable L1** | CONSUMABLE | L1 | Fixed: "Consumable" (green bg) |
| **R** | **Consumable L2** | CONSUMABLE | L2 | Dye, Chemical, Needle, Oil, Other |
| **S** | **Consumable L3** | CONSUMABLE | L3 | Reactive Dye, Softener, Knitting Needle, etc. |
| **T** | **Packaging L1** | PACKAGING | L1 | Fixed: "Packaging" (green bg) |
| **U** | **Packaging L2** | PACKAGING | L2 | Polybag, Carton, Hanger, Ticket/Tag, Other |
| **V** | **Packaging L3** | PACKAGING | L3 | LDPE Polybag, Single Wall Carton, etc. |

**Row counts per master:** Article=23, Fabric=7, Yarn=6, Woven=3, Trim=27, Consumable=10, Packaging=8

**GAS Helper:** `getCategoryDropdownsForMaster_(ss, 'ARTICLE')` reads cols B,C,D; `'TRIM'` reads cols N,O,P; etc.
Uses `COL_MAP` to map master key → starting column.

**Frontend:** `ItemCategoryTab.jsx` SEED_DATA still uses row-based objects (logical view).
`masterLookupData.js` FK_DATA split into `article_l1`, `article_l2`, `article_l3` — separate per level.

---

### 2.12b ARTICLE_DROPDOWNS (6 columns, NEW in V10)

Single source of truth for all Article Master dropdown values (for both GAS sheet and webapp).

| Col | Header | Values |
|-----|--------|--------|
| A | Gender | Men, Women, Kids, Unisex |
| B | Fit Type | Regular, Slim, Relaxed, Oversized, Crop, Athletic |
| C | Neckline | Round Neck, V-Neck, Polo, Henley, Hood, Crew Neck, Quarter Zip, Mock Neck |
| D | Sleeve Type | Half Sleeve, Full Sleeve, Sleeveless, Cap Sleeve, 3/4 Sleeve, Raglan |
| E | Status | Active, Inactive, Development, Discontinued |
| F | Season | SS2024, AW2024, SS2025, AW2025, SS2026, AW2026, Year Round |

**GAS:** `setupArticleDropdowns_(ss)` creates and pre-populates. `setupArticleMaster_()` reads from this sheet for col 11-14, 25 validations.
**Frontend:** `DROPDOWN_OPTS` in `masterLookupData.js` mirrors these values.

---

### 2.13 Reference Masters

#### UOM_MASTER (3 columns)
| Col | Header | Notes |
|-----|--------|-------|
| A | UOM Code | CONE, MTR, PCS, KG, SET, ROLL |
| B | UOM Name | Full name |
| C | Multiplier | Unit conversion factor |

#### HSN_MASTER (5 columns)
| Col | Header | Notes |
|-----|--------|-------|
| A | HSN Code | 6-8 digit HSN code |
| B | Description | Goods description |
| C | GST % | 5, 12, 18, or 28 |
| D | IGST % | Integrated GST rate |
| E | Active | Yes/No |

#### COLOR_MASTER (4 columns)
| Col | Header | Notes |
|-----|--------|-------|
| A | Color Code | COL-RED, COL-BLU, etc. |
| B | Color Name / Shade | Human-readable |
| C | Hex Value | #FF0000 (Module6_ColorSwatch uses this) |
| D | Active | Yes/No |

#### SIZE_MASTER (5 columns)
| Col | Header | Notes |
|-----|--------|-------|
| A | Size Code | S, M, L, XL, XXL, 28, 30, 32 |
| B | Size Name | Small, Medium, Large |
| C | Measurement (cm) | Exact measurement |
| D | Sort Order | Display order |
| E | Active | Yes/No |

#### FABRIC_TYPE_MASTER (4 columns)
| Col | Header | Notes |
|-----|--------|-------|
| A | Fabric Type Code | KNIT, WOVEN, etc. |
| B | Fabric Type Name | Full name |
| C | Description | Technical notes |
| D | Active | Yes/No |

#### TAG_MASTER (4 columns)
| Col | Header | Notes |
|-----|--------|-------|
| A | Tag Code | TAG-001, TAG-002, ... |
| B | Tag Name | "Bestseller", "Seasonal", "Limited Edition" |
| C | Applies To | Sheet names or "ALL" |
| D | Active | Yes/No |

---

### 2.14 ITEM_CHANGE_LOG (10 columns)

**Written by GAS only** (Module4_ChangeLog.gs) — never manual entry.

| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Timestamp | DateTime | `dd-MMM-yyyy HH:mm:ss` (IST) |
| B | User Email | Text | From Session.getActiveUser() |
| C | Action | Text | CREATE / UPDATE / DELETE / STATUS_CHANGE |
| D | Sheet Name | Text | Which master sheet was edited |
| E | Item Code | Text | Code from col A of edited row |
| F | Field Changed | Text | Header name of edited column |
| G | Old Value | Text | Previous cell value |
| H | New Value | Text | New cell value |
| I | Row | Number | Row number (1-indexed) |
| J | Column | Number | Column number (1-indexed) |

**Excluded sheets:** ITEM_CHANGE_LOG itself, MASTER_RELATIONS

---

### 2.15 MASTER_RELATIONS (13 columns, ~46 rows)

Drives **all FK dropdowns, auto-display, multi-select, and cross-file references**.

| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Relation Code | Text | REL-001 to REL-046 |
| B | Parent Sheet | Text | E.g., ARTICLE_MASTER |
| C | Parent Column | Text | E.g., "→ MAIN FABRIC USED" |
| D | Referenced Sheet | Text | E.g., RM_MASTER_FABRIC |
| E | Ref Code Column | Text | E.g., "# RM Code" |
| F | Ref Display Col | Text | E.g., "Fabric Name" |
| G | Allow Create New | Dropdown | Yes / No |
| H | Dropdown Filter | Text | Optional: `Status=Active` |
| I | Multi-Select | Dropdown | Yes / No |
| J | Cross-File | Dropdown | Yes / No |
| K | Ref File Label | Text | FILE_1B / FILE_1C (blank = same file) |
| L | Active | Dropdown | Yes / No |
| M | Notes | Text | Documentation |

**Key Relations:**
| Code | From (Sheet → Col) | To (Sheet → Col) | Multi? | Cross-File? |
|------|---------------------|-------------------|--------|-------------|
| REL-001 | ARTICLE → Main Fabric | RM_FABRIC → # RM Code | No | No |
| REL-002 | ARTICLE → HSN Code | HSN_MASTER → HSN Code | No | No |
| REL-003 | ARTICLE → Color Codes | COLOR_MASTER → Color Code | **Yes** | No |
| REL-004 | ARTICLE → Tags | TAG_MASTER → Tag Code | **Yes** | No |
| REL-005 | RM_FABRIC → Yarn Comp | RM_YARN → # RM Code | **Yes** | No |
| REL-006 | RM_FABRIC → Supplier | SUPPLIER_MASTER → Code | No | **Yes (1B)** |
| REL-007 | RM_FABRIC → HSN Code | HSN_MASTER → HSN Code | No | No |
| REL-008+ | TRIM/CON/PKG → Supplier | SUPPLIER_MASTER → Code | No | **Yes (1B)** |

**Principle:** Store ONLY the code in `→` columns. Never copy text. `←` columns are read-only, GAS auto-fills via Module2_FKEngine.

---

## 3. FILE 1B — Factory Master (23 Sheets)

**File ID:** `1WjtpBhXwYVBVnPSDbzTWm8X0nyVhzsailBpRqXi7Se4`
**Setup:** `SheetSetup_1B.gs`

| # | Sheet Name | Key Columns | Notes |
|---|-----------|-------------|-------|
| 1 | USER_MASTER | Email, Name, Role, Dept, Status | Auth + access control |
| 2 | DEPARTMENT_MASTER | Dept Code, Name, Head, Active | |
| 3 | DESIGNATION_MASTER | Desig Code, Name, Level, Active | |
| 4 | SHIFT_MASTER | Shift Code, Name, Start, End, Active | |
| 5 | CUSTOMER_MASTER | Cust Code, Name, GSTIN, Address, Contact | |
| 6 | CONTRACTOR_MASTER | Contr Code, Name, PAN, Service Type | |
| 7 | WAREHOUSE_MASTER | WH Code, Name, Location, Type, Capacity | |
| 8 | STORAGE_BIN_MASTER | Bin Code, Warehouse FK, Zone, Rack, Level | |
| 9 | FACTORY_MASTER | Factory Code, Name, Address, Capacity | |
| 10 | MACHINE_MASTER | Machine Code, Category FK, Make, Model, Year | |
| 11 | MACHINE_CATEGORY | Cat Code, Name, Type, Active | |
| 12 | ASSET_MASTER | Asset Code, Name, Category, Location, Value | |
| 13 | MAINTENANCE_SCHEDULE | Schedule Code, Machine FK, Type, Frequency | |
| 14 | SPARE_PARTS_MASTER | Part Code, Name, Machine FK, Reorder Level | |
| 15 | PROCESS_MASTER | Process Code, Name, Dept FK, Sequence, Active | |
| 16 | WORK_CENTER_MASTER | WC Code, Name, Process FK, Machine FK | |
| 17 | JOBWORK_PARTY_MASTER | JW Code, Name, Process Types, Rate, Active | |
| 18 | SUPPLIER_MASTER | Supplier Code, Name, GSTIN, Address, Contact, Rating | **Referenced by FILE 1A (cross-file FK)** |
| 19 | ITEM_SUPPLIER_RATES | ISR Code, Item FK, Supplier FK, Rate, Priority, Valid From/To | Module8_ISR.gs manages priority ranking |
| 20 | PRESENCE_LOG | Email, Status, Timestamp | Module10_Presence.gs |
| 21 | NOTIFICATIONS | Notif ID, User FK, Message, Read, Timestamp | Module12_Notifications.gs |
| 22 | ROLE_MASTER | Role Code, Name, Description | |
| 23 | ROLE_PERMISSIONS | Role FK, Sheet Group, Can View, Can Edit | |

---

## 4. FILE 1C — Finance Master (6 Sheets)

**File ID:** `1t3zHrORAjZJ2cVr8bru4HE4kUvyYdm5RDICA8NkiDX8`
**Setup:** `SheetSetup_1C.gs`

| # | Sheet Name | Key Columns | Notes |
|---|-----------|-------------|-------|
| 1 | SUPPLIER_MASTER | Supplier Code, Name, GSTIN, PAN, Bank Details | Finance-side supplier data |
| 2 | PAYMENT_TERMS | PT Code, Name, Days, Discount %, Active | Net 30, Net 60, etc. |
| 3 | TAX_MASTER | Tax Code, Name, Rate %, Type, Active | GST, IGST, CESS |
| 4 | BANK_MASTER | Bank Code, Name, Branch, IFSC, Account No | |
| 5 | COST_CENTER | CC Code, Name, Dept FK, Budget, Active | |
| 6 | GL_ACCOUNT | GL Code, Name, Type, Sub-Type, Active | General ledger |

---

## 5. FILE 2 — Procurement (5 Sheets)

**File ID:** `1KfeKzO-djdMn6YFSNOoyLeKOZfdcFCyHLzf7jpm6Pls`
**Setup:** `SheetSetup_F2.gs`
**API:** `Module14_ProcurementAPI.gs`

### PO_MASTER
| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | PO Code | Auto-code | `PO-2026-0001` (year-based) |
| B | Supplier Code | FK | → SUPPLIER_MASTER (1B) |
| C | Supplier Name | Auto | ← from SUPPLIER |
| D | PO Date | Date | Creation date |
| E | Expected Delivery | Date | |
| F | Payment Terms | FK | → PAYMENT_TERMS (1C) |
| G | Total Qty | Formula | Sum of line item qtys |
| H | Total Value | Formula | Sum of line values |
| I | Total GST | Formula | Sum of line GST |
| J | Grand Total | Formula | Value + GST |
| K | Status | Dropdown | Draft/Submitted/Approved/Sent/Partially Received/Fully Received/Cancelled |
| L | Created By | Auto | User email |
| M | Approved By | Auto | Approver email |
| N | Remarks | Text | |

### PO_LINE_ITEMS
| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Line Code | Auto-code | `POL-00001` |
| B | PO Code | FK | → PO_MASTER |
| C | Item Code | FK | → Any item master |
| D | Item Name | Auto | ← from item master |
| E | Item Category | Auto | ARTICLE/RM-FABRIC/TRIM/etc. |
| F | UOM | Auto | From item master |
| G | Quantity | Number | User enters |
| H | Unit Price | Currency | ₹ per UOM |
| I | Discount % | Number | Line discount |
| J | Line Value | Formula | `Qty × Price × (1-Disc%)` |
| K | HSN Code | Auto | From item master |
| L | GST % | Auto | From HSN |
| M | GST Amount | Formula | `LineValue × GST%` |
| N | Line Total | Formula | `LineValue + GST` |
| O | Received Qty | Number | Updated by GRN |
| P | Status | Dropdown | Open/Partially Received/Fully Received |

### GRN_MASTER
Same pattern as PO_MASTER with GRN-specific fields (GRN Code `GRN-2026-0001`, PO Reference FK, Received Date, Inspector, Quality Status).

### GRN_LINE_ITEMS
Same pattern as PO_LINE_ITEMS with GRN-specific fields (GRL Code `GRL-00001`, GRN Code FK, Accepted Qty, Rejected Qty, Quality Notes).

### MASTER_RELATIONS_F2
Same structure as FILE 1A MASTER_RELATIONS — defines FK relationships for procurement sheets.

---

## 6. Frontend ↔ GAS Connection

### Connection Mechanism

**File:** `/workspaces/CCPL_GOOGLE_ERP/frontend/src/services/api.js`

```
Frontend (React)  ──GET request──▶  GAS Web App (doGet)
                                      │
                                      ▼
                                 APIGateway.gs
                                 handleAPIRequest(e)
                                      │
                                      ▼
                               Route to handler
                               Return JSON response
```

**All requests are GET** (not POST) because GAS web app redirects convert POST→GET and lose the body.

**Query Pattern:**
```
GET {GAS_URL}?action=getMasterData&payload={"sheet":"ARTICLE_MASTER","file":"1A"}
```

### Field Mapping Pipeline

```
Google Sheet Headers (Row 2)
        ↕  mapRawToSchema() / mapSchemaToRaw()
Frontend Field Keys (JS objects)
        ↕  enrichSchema()
Enriched Fields (with col letter, type, FK info, sections)
        ↕  FieldInput component
UI Rendering (dropdowns, auto-fill, text, currency)
```

**Key files:**
| File | Purpose |
|------|---------|
| `masterSchemas.js` | `SCHEMA_MAP` — maps JS keys ↔ sheet headers for every sheet |
| `masterFieldMeta.js` | `FIELD_META` — UI enrichment (sections, icons, FK refs, hints) |
| `masterLookupData.js` | `FK_DATA` + `DROPDOWN_OPTS` — dropdown values |
| `enrichSchema.js` | Merges schema + meta + resolves FKs + assigns col letters |

### Save Flow

1. User fills form → `formData` state object (JS keys)
2. Click Save → `SheetWorkspace.handleSave()`
3. `mapSchemaToRaw(formData, schema)` → converts JS keys to sheet headers
4. `api.saveMasterRecord(sheetName, file, rawRecord, isEdit)` → GET request
5. GAS `handleSaveMasterRecord()` → writes to sheet row
6. GAS triggers: code gen, FK auto-display, attr sync, change log, cache invalidation
7. Response → frontend shows success toast

---

## 7. API Endpoints (22 Routes)

| # | Route | Method | What it does |
|---|-------|--------|-------------|
| 1 | `heartbeat` | GET | Module alive check |
| 2 | `getUIBootstrap` | GET | User info, config, modules on app load |
| 3 | `listPresence` | GET | Active user list |
| 4 | `getNotifications` | GET | User's notifications |
| 5 | `markNotificationRead` | POST | Mark notification read |
| 6 | `getQuickAccessItems` | GET | Recent items |
| 7 | `savePO` | POST | Create/update Purchase Order |
| 8 | `getPOList` | GET | All POs |
| 9 | `getPODetail` | GET | Single PO + line items |
| 10 | `submitPO` | POST | Submit PO for approval |
| 11 | `approvePO` | POST | Approve PO |
| 12 | `cancelPO` | POST | Cancel PO |
| 13 | `saveGRN` | POST | Create/update GRN |
| 14 | `getGRNList` | GET | All GRNs |
| 15 | `getGRNDetail` | GET | Single GRN + line items |
| 16 | `submitGRN` | POST | Submit GRN |
| 17 | `exportSheet` | POST | Export as JSON/CSV |
| 18 | `refreshCache` | POST | Force cache invalidation |
| 19 | `getSheetHeaders` | GET | Column headers + descriptions |
| 20 | `confirmSupplierSelection` | POST | Confirm supplier for item |
| 21 | `getTagsForSheet` | GET | Available tags for a sheet |
| 22 | `getCurrentTags` | GET | Tags currently assigned to row |

**Additional frontend-only endpoints in `api.js`:**
- `getMasterSheetCounts()` — record counts for dashboard
- `getMasterData(sheet, file)` — fetch all rows for a sheet
- `saveMasterRecord(sheet, file, record, isEdit)` — create/update record
- `deleteMasterRecord(sheet, file, code)` — delete by code
- `getItemCategories(includeInactive)` — all CAT-xxx entries
- `createCategory(data)` — new category

---

## 8. Caching System (3-Layer)

| Layer | Technology | TTL | Scope | Trigger |
|-------|-----------|-----|-------|---------|
| **L1** | CacheService | 6 hours | Script-level session | `onOpen()` pre-warm |
| **L2** | PropertiesService | Persistent | Cross-file | Daily 7:00 AM IST refresh |
| **L3** | Smart Invalidation | — | Per-sheet | `onEdit()` clears edited sheet only |

**Cache Keys:** `CACHE_ARTICLE_MASTER`, `CACHE_RM_MASTER_FABRIC`, `CACHE_TRIM_MASTER`, `CACHE_ITEM_CATEGORIES`, `CACHE_HSN_MASTER`, `CACHE_COLOR_MASTER`, etc. (one per sheet)

**Chunking:** Values > ~100KB (L1) or ~9KB (L2) are split across `_PART_0`, `_PART_1`, etc.

---

## 9. Code Generation Rules

| Master | Format | Example | Trigger |
|--------|--------|---------|---------|
| ARTICLE_MASTER | Manual | `5249HP` | User types (5 digits + 2 CAPS) |
| RM_MASTER_FABRIC | `RM-FAB-###` | RM-FAB-001 | Auto on row edit |
| RM_MASTER_YARN | `RM-YRN-###` | RM-YRN-042 | Auto on row edit |
| RM_MASTER_WOVEN | `RM-WVN-###` | RM-WVN-005 | Auto on row edit |
| TRIM_MASTER | `TRM-{CAT}-###` | TRM-THD-001 | Auto, per-category |
| CONSUMABLE_MASTER | `CON-{CAT}-###` | CON-DYE-001 | Auto, per-category |
| PACKAGING_MASTER | `PKG-{CAT}-###` | PKG-PLY-005 | Auto, per-category |
| ISR | `ISR-#####` | ISR-00001 | Auto, sequential |
| PO_MASTER | `PO-YYYY-####` | PO-2026-0001 | Auto, year-based |
| PO_LINE_ITEMS | `POL-#####` | POL-00042 | Auto, sequential |
| GRN_MASTER | `GRN-YYYY-####` | GRN-2026-0001 | Auto, year-based |
| GRN_LINE_ITEMS | `GRL-#####` | GRL-00123 | Auto, sequential |

**Rules:** No CC- prefix. Code column always col A. Never overwrite existing code. GAS Module1_CodeGen.gs handles all generation.

---

## 10. Validation & FK Engine

### FK Rules (Module2_FKEngine.gs)

1. **`→` columns:** Store code only (e.g., `RM-FAB-001`). `_isFKColumn()` detects `→` (U+2192) prefix.
2. **`←` columns:** Read-only, GAS auto-fills display name from referenced sheet via `autoDisplayFKName()`.
3. **`⟷` columns:** Multi-select FK — stores comma-separated codes. `_isFKColumn()` detects `⟷` (U+27F7) prefix. *(V12.4 fix: was missing, caused Yarn Names + Tags auto-fill to never trigger.)*
4. **Cross-file FKs:** Use PropertiesService (L2 cache) for FILE_1B/1C data
5. **MASTER_RELATIONS** drives all FK behavior — no hardcoding in modules
6. **Column lookup by header name:** `_findColumnIndex()` finds columns by matching header text (row 2), NOT by column position. Safe across V9 column shifts.

### FK Flow: RM_MASTER_FABRIC → RM_MASTER_YARN (REL-006)

```
User edits col F (⟷ YARN COMPOSITION) → e.g., "RM-YRN-001, RM-YRN-002"
  │
  ├─ _isFKColumn("⟷ YARN COMPOSITION") → TRUE (detects ⟷)
  ├─ getRelationForColumn() → REL-006 (multiSelect=Yes)
  ├─ resolveMultiSelectFK() → reads RM_MASTER_YARN:
  │     "# RM Code" (col A) for matching, "Yarn Name" (col E) for display
  │     → returns "30s Cotton Ring Spun, 40s Combed Cotton"
  ├─ Writes col G (← Yarn Names Auto): "30s Cotton Ring Spun, 40s Combed Cotton"
  │
  └─ Auto SKU handler (Code.gs):
       Reads col 5 (L3 Knit Type) + col 7 (Yarn Names)
       → Writes col 2 (∑ FINAL FABRIC SKU): "Single Jersey — 30s Cotton Ring Spun, 40s Combed Cotton"
```

### Dropdown Validation (SheetSetup)
- All dropdowns use `allowInvalid: false` — GAS rejects invalid entries
- Dropdown ranges built from reference sheets (COLOR_MASTER, HSN_MASTER, etc.)
- Multi-select uses comma-separated format with GAS validation

### Attribute Sync (Module3_AttrSync.gs)
When user selects L2 category in TRIM/CONSUMABLE/PACKAGING:
1. GAS reads ATTR_NAMES for that category → fills attr name columns
2. GAS reads ATTR_VALUES for that category + attr name → sets dropdown on value columns
3. Special: `Color(REF NAME)` attr loads COLOR_MASTER instead of ATTR_VALUES

---

## 11. Access Control (7 Roles)

| Role | Items | Factory | Finance | Procurement |
|------|-------|---------|---------|-------------|
| SUPER_ADMIN | Edit | Edit | Edit | Edit |
| ADMIN | Edit | Edit | Read | Edit |
| PURCHASE_MGR | Read | Partial | Read | Edit |
| PRODUCTION_MGR | Read | Partial | — | Read |
| STORE_KEEPER | Read | Partial | — | Read |
| ACCOUNTS | Read | — | Edit | Read |
| VIEW_ONLY | Read | — | — | — |

Role stored in USER_MASTER (FILE 1B). Module5_AccessControl.gs hides/protects sheets per role.

---

## 12. Header Symbol Legend

| Symbol | Meaning | Example | Behavior |
|--------|---------|---------|----------|
| `🔑` | Primary key | `🔑 Article Code` | Manual entry, unique |
| `#` | Auto-generated | `# RM Code` | GAS fills, read-only |
| `→` | FK to (foreign key) | `→ MAIN FABRIC USED` | User selects from dropdown, stores code only |
| `←` | Auto-display from FK | `← Fabric Name (Auto)` | GAS fills, read-only, green bg in frontend |
| `⟷` | Multi-select FK | `⟷ Tags` | Comma-separated codes |
| `∑` | Calculated/Formula | `∑ FINAL MARKUP %` | GAS formula, read-only |
| `⚠` | Required/Mandatory | `⚠ Trim Name` | Validation enforced |

---

## GAS File Index

| File | Lines | Key Functions |
|------|-------|--------------|
| Config.gs | 650 | File IDs, sheet names, item codes, status enums, cache keys |
| Cache.gs | 742 | 3-layer cache, chunking, invalidation |
| Code.gs | 560 | onOpen, onEdit (+ Fabric SKU auto-build V12.4), menu builders, trigger routing |
| APIGateway.gs | 2000+ | doGet/doPost, 22 route handlers |
| SheetSetup.gs | 1500+ | FILE 1A sheet creation & formatting |
| SheetSetup_1B.gs | 800+ | FILE 1B sheet creation |
| SheetSetup_1C.gs | 450+ | FILE 1C sheet creation |
| SheetSetup_F2.gs | 350+ | FILE 2 sheet creation |
| V9_Update.gs | 600+ | V8→V9 migration (L1/L2/L3 columns) |
| MasterSetup.gs | 300+ | One-click setup for all 4 files |
| Module1_CodeGen.gs | 900+ | Auto-generate item codes |
| Module2_FKEngine.gs | 1300+ | FK dropdowns, auto-display, multi-select. V12.4: `_isFKColumn` detects `⟷` prefix |
| Module3_AttrSync.gs | 800+ | Attribute name/value sync |
| Module4_ChangeLog.gs | 350+ | Audit trail logging |
| Module5_AccessControl.gs | 650+ | Role-based sheet protection |
| Module6_ColorSwatch.gs | 300+ | Cell background from hex |
| Module7_ReorderAlert.gs | 550+ | Daily stock alerts |
| Module8_ISR.gs | 650+ | Item-Supplier rate management |
| Module9_Export.gs | 220+ | JSON/CSV export |
| Module10_Presence.gs | 150+ | User presence tracking |
| Module11_UIBootstrap.gs | 220+ | React frontend init data |
| Module12_Notifications.gs | 220+ | In-app notifications |
| Module13_QuickAccess.gs | 60+ | Shortcuts |
| Module14_ProcurementAPI.gs | 600+ | PO/GRN CRUD |

---

## Frontend File Index

| File | Lines | Purpose |
|------|-------|---------|
| `App.jsx` | 672 | Shell, sidebar, theme, module navigation |
| `services/api.js` | ~120 | 36 GAS endpoint wrappers |
| `constants/masterSchemas.js` | 56.6KB | SCHEMA_MAP for every sheet |
| `constants/masterFieldMeta.js` | 240 | Field enrichment metadata |
| `constants/masterLookupData.js` | 120 | FK_DATA + DROPDOWN_OPTS |
| `components/masters/Masters.jsx` | 400 | Hub view, file navigation |
| `components/masters/SheetWorkspace.jsx` | 458 | Tab container, save handler |
| `components/masters/RecordsTab.jsx` | 1576 | Sortable/filterable table |
| `components/masters/DataEntryTab.jsx` | 631 | 3-layout form entry |
| `components/masters/BulkEntryTab.jsx` | 1584 | CSV/Excel import |
| `components/masters/ItemCategoryTab.jsx` | 2176 | V9 L1/L2/L3 hierarchy |
| `components/masters/ArticleMasterTab.jsx` | 2741 | Article layout + preview |
| `components/masters/TrimMasterTab.jsx` | 1531 | Trim grid + inline edit |
| `components/masters/helpers/enrichSchema.js` | — | Schema + meta merger |
| `components/masters/helpers/fieldInput.jsx` | — | Field type renderer |
| `components/procurement/Procurement.jsx` | 89.7K | Full PO/GRN module |

---

---

## V9.1 Bug Fixes (2 Mar 2026)

### Fix 1: GAS — Article Code duplicate check self-match

**File:** `Module1_CodeGen.gs` lines 716-740
**Bug:** `codeExistsInSheet_()` read all of column A including the cell the user just edited, so it always found "itself" as a duplicate. Every manually entered Article Code was rejected as duplicate even on an empty sheet.
**Fix:** Added `excludeRow` parameter. The `handleCodeGeneration()` caller now passes `editedRow` so the function skips the cell being edited during the duplicate scan.

### Fix 2: Frontend — Article Code readonly → manual input

**Files:** `masterSchemas.js` line 21, `masterFieldMeta.js` line 27, `ArticleMasterTab.jsx`
**Bug:** Schema had `auto:true` on Article Code. In `fieldInput.jsx`, `isAuto = f.auto || [...]` evaluated to `true`, rendering the field as `readOnly` despite `fieldType:"manual"` in FIELD_META.
**Fix:**
- Changed `auto:true` → `required:true` in SCHEMA_ARTICLE_MASTER
- Changed `l1Division` fieldType from `"auto"` → `"fk"` (since Article L1 is SELECTABLE)
- In `ArticleMasterTab.jsx`: Replaced auto-generated `ART-NNN` codes with manual text input field, client-side regex validation (`^[0-9]{4,5}[A-Z]{2}$`), and duplicate check against existing data

### Fix 3: Frontend — L1/L2/L3 dropdowns now from ITEM_CATEGORIES

**Files:** `ItemCategoryTab.jsx`, `ArticleMasterTab.jsx`, `masterLookupData.js`
**Bug:** `DIVISIONS`, `L2_BY_DIV`, `L2_HSN` in ArticleMasterTab and `CATEGORY_HIERARCHY` l1Options/l2Options/l3Options in ItemCategoryTab were all hardcoded, not matching ITEM_CATEGORIES sheet data.
**Fix:**
- Exported `SEED_DATA` and `CATEGORY_HIERARCHY` from `ItemCategoryTab.jsx`
- Added `_syncHierarchyFromSeed()` IIFE that rebuilds l1Options, l2Options, l3Options, and defaultHSN from SEED_DATA on module load
- In `ArticleMasterTab.jsx`: Replaced hardcoded `DIVISIONS`/`L2_BY_DIV`/`L2_HSN` with derivations from `SEED_DATA` filtered by `master === "ARTICLE"`
- Updated `FK_DATA.item_categories` to include L1 division values as dropdown options

### Fix 4: Frontend — Added missing V9 L3 Style column

**Files:** `masterSchemas.js`, `masterFieldMeta.js`
**Bug:** SCHEMA_ARTICLE_MASTER was missing the V9 `L3 Style` column (col I). Schema jumped from L2 Category straight to Season, which meant column letters were shifted by 1 for all subsequent columns.
**Fix:** Added `{ key:"l3Style", header:"L3 Style", label:"Style", w:"110px" }` between L2 Category and Season. Added corresponding FIELD_META entry with FK to item_categories.

---

## V10 Changes (2 Mar 2026)

### Change 1: ITEM_CATEGORIES restructured to column-grouped layout

**File:** `SheetSetup.gs` — `setupItemCategories_()`
**Before (V9):** Row-based layout with 9 cols (Code, L1, L2, L3, Master, HSN, Active, Remarks, Behavior). Each row = one category. `Master` column (E) used to filter per master type.
**After (V10):** Column-grouped layout with 22 cols. Each master gets its own 3 columns (L1, L2, L3):
- B,C,D = Article | E,F,G = Fabric | H,I,J = Yarn | K,L,M = Woven
- N,O,P = Trim | Q,R,S = Consumable | T,U,V = Packaging

Seed data function changed from `getItemCategorySeedData_()` (delegating to V9 row arrays) to `getItemCategorySeedData_V10_()` which builds a combined row array where each master fills its own column group independently.

**`getCategoryDropdownsForMaster_(ss, masterKey)`** now uses a `COL_MAP` to find the 3-column group for each master instead of filtering by a "Master" column.

### Change 2: New ARTICLE_DROPDOWNS sheet

**File:** `SheetSetup.gs` — `setupArticleDropdowns_()`
6-column sheet: Gender, Fit Type, Neckline, Sleeve Type, Status, Season.
Single source of truth for both GAS dropdown validations and webapp dropdowns.
`setupArticleMaster_()` reads from this sheet for cols 11-14, 25 (with hardcoded fallbacks).

### Change 3: Auto-description (L1 › L2 › L3)

**GAS:** `Code.gs` onEdit handler — when Article Master cols G/H/I change, col B auto-fills as "L1 › L2 › L3".
**Frontend:** `ArticleMasterTab.jsx` — `buildDesc()` joins selected levels. Description field is readonly.

### Change 4: FK_DATA split per level (fixes mixed dropdown bug)

**Bug:** `FK_DATA.item_categories` was a flat list mixing L1 divisions AND L2 categories. All fields with `fk: "item_categories"` showed the same combined dropdown.
**Fix:**
- `masterLookupData.js`: Split into `article_l1` (4 divisions), `article_l2` (5 categories), `article_l3` (16 styles)
- `masterFieldMeta.js`: l1Division → `fk: "article_l1"`, l2Category → `fk: "article_l2"`, l3Style → `fk: "article_l3"`
- Legacy `item_categories` key kept for backwards compatibility (points to L1 only)

### Change 5: L3 Style dropdown added to Article form

**File:** `ArticleMasterTab.jsx`
- Added `L3_BY_L2` map built from SEED_DATA (L2 → array of L3 values)
- Added `l3Style` to `emptyForm`, `handleEdit`, save handlers
- L3 dropdown cascades from L2 selection, resets on L1/L2 change
- Preview shows full L1 › L2 › L3 chain

### GAS: What to run in Google Sheets

To apply the V10 ITEM_CATEGORIES restructure and create ARTICLE_DROPDOWNS on your live sheet, you need to run the setup functions from the GAS Script Editor:

1. Open **FILE 1A** in Google Sheets
2. Go to **Extensions > Apps Script**
3. Run these functions (in order):
   - `setupArticleDropdowns_` — creates the new ARTICLE_DROPDOWNS sheet
   - `setupItemCategories_` — rebuilds ITEM_CATEGORIES in column-grouped format
   - `setupArticleMaster_` — re-applies dropdown validations from the new sources

**Note:** `setupItemCategories_` only writes seed data if the sheet has no data below row 3. If the sheet already has data, you may need to clear rows 4+ first, or manually restructure. The old `ITEM_CATEGORIES` format (9-column row-based) is no longer used.

---

*End of document*
