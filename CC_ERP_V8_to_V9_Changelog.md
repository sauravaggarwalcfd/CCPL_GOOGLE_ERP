# CC ERP Masters — V8 → V9 Update Changelog
## ITEM_CATEGORIES 3-Level Hierarchy + Dropdown Integration

**Version:** V9  
**Updated:** 28 Feb 2026  
**Previous:** V8 (55 sheets, no category dropdowns in master sheets)  
**Current:** V9 (55 sheets, 138 categories, L1/L2/L3 columns + dropdowns in all 7 item masters)

---

## WHAT CHANGED (Summary)

| Change | V8 | V9 |
|--------|----|----|
| ITEM_CATEGORIES rows | 8 basic rows | **138 rows** covering all 7 masters |
| L1 behavior | All "Apparel" (no Men/Women split) | **SELECTABLE** for Article, **FIXED** for rest |
| L1/L2/L3 columns in masters | Not present | **Added to all 7 master sheets** |
| Dropdowns in master sheets | None | **L1/L2/L3 dropdowns on every master** |
| ARTICLE_MASTER cols | 26 | **27** (+1 new L3 Style column) |
| RM_MASTER_FABRIC cols | 25 | **27** (+2 new L1, L2 columns) |
| RM_MASTER_YARN cols | 15 | **18** (+3 new L1, L2, L3 columns) |
| RM_MASTER_WOVEN cols | 15 | **17** (+2 new L1, L2 columns) |
| TRIM_MASTER cols | 29 | **30** (+1 new L1 column) |
| CONSUMABLE_MASTER cols | 19 | **20** (+1 new L1 column) |
| PACKAGING_MASTER cols | 19 | **20** (+1 new L1 column) |

**Total new columns inserted across all sheets: 11**

---

## DETAILED CHANGES PER SHEET

### 1. ITEM_CATEGORIES (Sheet 16 in FILE 1A)

**What changed:** Complete rebuild from 8 → 138 rows.

**New column added:**
- **Col I: L1 Behavior** — Values: `FIXED` or `SELECTABLE`. Indicates whether L1 is user-selectable (Article only) or auto-set (all others).

**138 categories breakdown:**

| Master | L1 Value | L2 Options | L3 Count | Total |
|--------|----------|------------|----------|-------|
| ARTICLE | Men's / Women's / Kids / Unisex Apparel | Tops-Polo, Tops-Tee, Sweatshirt, Tracksuit, Bottoms | 3–7 per L2 | 23 |
| RM-FABRIC | Raw Material (fixed) | Knit Fabric | 11 | 11 |
| RM-YARN | Raw Material (fixed) | Yarn | 8 | 8 |
| RM-WOVEN | Raw Material (fixed) | Woven / Interlining | 4 | 4 |
| TRIM | Trim (fixed) | Thread, Label, Elastic, Zipper, Button, Tape, Drawcord, Velcro, Rivet/Eyelet, Neck/Shoulder Tape, Other | 1–6 per L2 | 38 |
| CONSUMABLE | Consumable (fixed) | Softener, Fixer, Needle, Oil, Fuel, Cleaning, Other | 2–6 per L2 | 26 |
| PACKAGING | Packaging (fixed) | Poly Bag, Carton, Hanger, Price Tag, Tissue, Sticker, Other | 3–5 per L2 | 28 |

**Code numbering gaps (for future inserts):**
- ARTICLE: CAT-001 to CAT-023
- RM-FABRIC: CAT-100 to CAT-110
- RM-YARN: CAT-120 to CAT-127
- RM-WOVEN: CAT-140 to CAT-143
- TRIM: CAT-200 to CAT-237
- CONSUMABLE: CAT-300 to CAT-325
- PACKAGING: CAT-400 to CAT-427

**Color coding:** Each L1 group has a distinct row background color for visual scanning.

---

### 2. ARTICLE_MASTER (Sheet 3)

**Column inserted:** 1 new column at position I (shifts Season, Gender, etc. right by 1)

| Col | Header | Change | Dropdown Options |
|-----|--------|--------|-----------------|
| G | L1 Division | **Existing — updated values** | Men's Apparel, Women's Apparel, Kids Apparel, Unisex Apparel |
| H | L2 Product Category | **Existing — dropdown added** | Tops - Polo, Tops - Tee, Sweatshirt, Tracksuit, Bottoms |
| **I** | **L3 Style** | **🆕 NEW COLUMN** | Basic, Pique, Striper, Jacquard, Designer, Henley, V-Neck, Oversized, Hoodie, Crew Neck, Quarter Zip, Half Zip, Fleece, Bomber, Pullover, Slim Fit, Relaxed Fit, Athletic, Cargo |

**Column shift impact (I→onwards):**
```
OLD Col I (Season)      → NEW Col J
OLD Col J (Gender)      → NEW Col K
OLD Col K (Fit Type)    → NEW Col L
OLD Col L (Neckline)    → NEW Col M
OLD Col M (Sleeve Type) → NEW Col N
...all subsequent columns shift +1
OLD Col Z (Tags)        → NEW Col AA (if applicable)
```

**Existing data updated:**
- Col G values changed: `"Apparel"` → `"Men's Apparel"` (based on Gender column for existing 3 rows)
- Col I (new L3) auto-populated from article description: Pique→Pique, RN Tee→Basic, Hoodie→Hoodie

**Total cols: 26 → 27**

---

### 3. RM_MASTER_FABRIC (Sheet 4)

**Columns inserted:** 2 new columns at position C and D (shifts KNIT NAME and everything right by 2)

| Col | Header | Change | Values |
|-----|--------|--------|--------|
| **C** | **L1 Division** | **🆕 NEW** | Auto-filled: "Raw Material" (green, read-only concept) |
| **D** | **L2 Category** | **🆕 NEW** | Auto-filled: "Knit Fabric" (green, read-only concept) |
| E | L3 Knit Type | **Renamed from "KNIT NAME"** | Dropdown: Single Jersey, Pique, Fleece, French Terry, Rib, Interlock, Autostriper, Waffle Knit, Lycra Jersey, Textured / Yarn Dyed, Other Knit |

**Column shift impact (C→onwards):**
```
OLD Col C (KNIT NAME)         → NEW Col E (L3 Knit Type)
OLD Col D (YARN COMPOSITION)  → NEW Col F
OLD Col E (Yarn Names Auto)   → NEW Col G
...all subsequent columns shift +2
OLD Col Y (Status)            → NEW Col AA
```

**Existing data:** L1/L2 auto-filled for all 4 data rows. Knit Name data preserved in shifted Col E.

**Total cols: 25 → 27**

---

### 4. RM_MASTER_YARN (Sheet 5)

**Columns inserted:** 3 new columns at position B, C, D (shifts Yarn Name and everything right by 3)

| Col | Header | Change | Values |
|-----|--------|--------|--------|
| **B** | **L1 Division** | **🆕 NEW** | Auto: "Raw Material" |
| **C** | **L2 Category** | **🆕 NEW** | Auto: "Yarn" |
| **D** | **L3 Yarn Type** | **🆕 NEW** | Dropdown: Cotton Combed, Cotton Carded, Polyester, PC Blend, Viscose, Melange, Lycra / Spandex, Nylon, Other Yarn |

**Column shift impact (B→onwards):**
```
OLD Col B (Yarn Name)      → NEW Col E
OLD Col C (Colour Type)    → NEW Col F
OLD Col D (Colour if dyed) → NEW Col G
...all subsequent columns shift +3
OLD Col O (Remarks)        → NEW Col R
```

**Existing data:** L1/L2 auto-filled. L3 derived from yarn name (30S CTN COMBED → "Cotton Combed", 30S PC → "PC Blend").

**Total cols: 15 → 18**

---

### 5. RM_MASTER_WOVEN (Sheet 6)

**Columns inserted:** 2 new columns at position B and C

| Col | Header | Change | Values |
|-----|--------|--------|--------|
| **B** | **L1 Division** | **🆕 NEW** | Auto: "Raw Material" |
| **C** | **L2 Category** | **🆕 NEW** | Auto: "Woven / Interlining" |
| G | L3 Woven Type | **Renamed from "Woven Category" (was col E)** | Dropdown: Fusible Interlining, Non-Fusible Interlining, Woven Fabric, Collar Canvas, Lining, Tape, Other |

**Column shift:** All columns from old B onwards shift +2.

**Total cols: 15 → 17**

---

### 6. TRIM_MASTER (Sheet 7)

**Column inserted:** 1 new column at position D (shifts Trim Category and everything right by 1)

| Col | Header | Change | Values |
|-----|--------|--------|--------|
| **D** | **L1 Division** | **🆕 NEW** | Auto: "Trim" |
| E | L2 Trim Category | **Renamed from "Trim Category" (was col D)** | Dropdown: THD, LBL, ELS, ZIP, BUT, TPE, DRW, VLC, RVT, THP, OTH |
| F | L3 Sub-Category | **Renamed from "Trim Sub-Category" (was col E)** | Dropdown: 38 options (Sewing Thread, Overlock Thread, Care Label, Main Label, Waistband Elastic, Dress Zipper, Flat Button, etc.) |

**Column shift:** Old Col D (Trim Category) → New Col E. Old Col E (Sub-Category) → New Col F. All subsequent cols shift +1.

**Existing data:** L1 auto-filled "Trim" for all 66 data rows. Category/Sub-Category data preserved in shifted positions.

**Total cols: 29 → 30**

---

### 7. CONSUMABLE_MASTER (Sheet 10)

**Column inserted:** 1 new column at position D

| Col | Header | Change | Values |
|-----|--------|--------|--------|
| **D** | **L1 Division** | **🆕 NEW** | Auto: "Consumable" |
| E | L2 Category | **Renamed (was col D)** | Dropdown: Softener, Fixer, Needle, Oil, Fuel, Cleaning, Other |
| F | L3 Sub Type | **Renamed (was col E)** | Dropdown: 26 options (Silicone Softener, Cationic Fixer, DB x1 System, Mineral Oil, LPG, Degreaser, Desiccant, etc.) |

**Column shift:** All cols from old D onwards shift +1.

**Existing data:** L1 auto-filled "Consumable" for all 29 data rows.

**Total cols: 19 → 20**

---

### 8. PACKAGING_MASTER (Sheet 13)

**Column inserted:** 1 new column at position D

| Col | Header | Change | Values |
|-----|--------|--------|--------|
| **D** | **L1 Division** | **🆕 NEW** | Auto: "Packaging" |
| E | L2 Category | **Renamed (was col D)** | Dropdown: Poly Bag, Carton, Hanger, Price Tag, Tissue, Sticker, Other |
| F | L3 Sub-Category | **Renamed (was col E)** | Dropdown: 28 options (LDPE Flat Bag, Dispatch Carton, Velvet Hanger, Swing Tag, Branded Tissue, MRP Sticker, Bubble Wrap, etc.) |

**Column shift:** All cols from old D onwards shift +1.

**Existing data:** L1 auto-filled "Packaging" for all 36 data rows.

**Total cols: 19 → 20**

---

## WHAT YOU NEED TO UPDATE AFTER THIS

### ⚠ MASTER_RELATIONS (Sheet 25) — FK References

Since columns shifted in multiple sheets, any FK relation pointing to shifted columns needs its **Parent Column** reference updated:

| Affected Sheet | Shift | Relations to Check |
|---|---|---|
| ARTICLE_MASTER | +1 from Col I | REL-001 to REL-010 (any pointing to cols I onwards) |
| RM_MASTER_FABRIC | +2 from Col C | REL-011 to REL-020 |
| RM_MASTER_YARN | +3 from Col B | REL-021 to REL-025 |
| RM_MASTER_WOVEN | +2 from Col B | REL-026 to REL-030 |
| TRIM_MASTER | +1 from Col D | REL-031 to REL-038 |
| CONSUMABLE_MASTER | +1 from Col D | REL-039 to REL-042 |
| PACKAGING_MASTER | +1 from Col D | REL-043 to REL-046 |

**Action:** Open MASTER_RELATIONS, find any `→ Parent Column` that references a shifted column, increment the column letter by the shift amount.

### ⚠ GAS Modules — Column References

Any GAS function that references column numbers or letters in these sheets must be updated:

```
ARTICLE_MASTER:     All cols from I onwards → add 1
RM_MASTER_FABRIC:   All cols from C onwards → add 2
RM_MASTER_YARN:     All cols from B onwards → add 3
RM_MASTER_WOVEN:    All cols from B onwards → add 2
TRIM_MASTER:        All cols from D onwards → add 1
CONSUMABLE_MASTER:  All cols from D onwards → add 1
PACKAGING_MASTER:   All cols from D onwards → add 1
```

### ⚠ React Frontend — Field Definitions

In `CC_ERP_MasterDataEntry.jsx`, the MASTERS array field `col` letters need updating:

**ARTICLE_MASTER example:**
```js
// OLD                          // NEW
{col:"I", h:"Season"}          → {col:"J", h:"Season"}
{col:"J", h:"Gender"}          → {col:"K", h:"Gender"}
// Add new field:
{col:"I", h:"L3 Style", type:"dropdown", opts:OPT_L3_ARTICLE}
```

### ⚠ Procurement FILE 2 — PO Line Items

If PO_LINE_ITEMS references ARTICLE_MASTER columns by letter, update accordingly (+1 from Col I onwards).

### ⚠ EMBEDDED_VIEWS / ROLLUP_CONFIG

Any embedded view or rollup referencing column positions in affected sheets needs column letter updates.

---

## HOW L1/L2/L3 WORKS PER MASTER

### Apparel (ARTICLE_MASTER) — All 3 Levels User-Selectable

```
Step 1: User picks L1 → Men's Apparel / Women's Apparel / Kids / Unisex
Step 2: User picks L2 → Tops-Polo / Tops-Tee / Sweatshirt / Tracksuit / Bottoms
Step 3: User picks L3 → Basic / Pique / Striper / Jacquard / Designer / Hoodie / Crew Neck etc.
```

L1 drives filtering across the entire ERP (PO, Inventory, Reports).

### Raw Material (FABRIC / YARN / WOVEN) — L1+L2 Auto, L3 User-Selectable

```
L1 = "Raw Material"     ← auto-filled, read-only (green cells)
L2 = "Knit Fabric"      ← auto-filled based on which sheet (Fabric/Yarn/Woven)
L3 = User picks          ← dropdown with specific types
```

| Sheet | L2 (Auto) | L3 Options (Dropdown) |
|-------|-----------|----------------------|
| RM_MASTER_FABRIC | Knit Fabric | Single Jersey, Pique, Fleece, French Terry, Rib, Interlock, Autostriper, Waffle, Lycra, Textured, Other |
| RM_MASTER_YARN | Yarn | Cotton Combed, Cotton Carded, Polyester, PC Blend, Viscose, Melange, Lycra/Spandex, Nylon |
| RM_MASTER_WOVEN | Woven / Interlining | Fusible, Non-Fusible, Woven Fabric, Collar Canvas, Lining, Tape, Other |

### Trim / Consumable / Packaging — L1 Auto, L2+L3 User-Selectable

```
L1 = "Trim" / "Consumable" / "Packaging"  ← auto-filled
L2 = User picks category                   ← dropdown
L3 = User picks sub-type                   ← dropdown
```

| Sheet | L1 (Auto) | L2 Dropdown | L3 Dropdown Count |
|-------|-----------|-------------|-------------------|
| TRIM_MASTER | Trim | 11 categories (THD/LBL/ELS/ZIP/BUT/TPE/DRW/VLC/RVT/THP/OTH) | 38 sub-types |
| CONSUMABLE_MASTER | Consumable | 7 categories (Softener/Fixer/Needle/Oil/Fuel/Cleaning/Other) | 26 sub-types |
| PACKAGING_MASTER | Packaging | 7 categories (Poly Bag/Carton/Hanger/Price Tag/Tissue/Sticker/Other) | 28 sub-types |

---

## DATA SAFETY NOTES

- **🔒 No existing data rows were deleted.** All 66 trim rows, 29 consumable rows, 36 packaging rows, 4 fabric rows, 3 yarn rows, 3 article rows remain intact.
- **New columns were inserted**, not replacing existing ones. Existing data shifted right but values preserved.
- **Auto-filled L1/L2 values** are populated in green background cells for all existing rows.
- **L3 values** were derived from existing data (descriptions, names) where possible.

---

## FILES AFFECTED

| File | Change |
|------|--------|
| `CC_ERP_Masters_V9.xlsx` | 7 sheets modified, 11 columns inserted, 138 ITEM_CATEGORIES rows |
| `MASTER_RELATIONS` (Sheet 25) | ⚠ Needs manual column reference updates |
| `CC_ERP_MasterDataEntry.jsx` | ⚠ Needs field `col` letter updates |
| `CC_ERP_BUILD_REFERENCE_V7.md` | ⚠ Column lists in Sections 11-13 need updating |
| `CC_ERP_FILE2_Procurement_V2.xlsx` | ⚠ Check PO line item FK column refs |

---

*CC ERP • V8 → V9 Changelog • 28 Feb 2026*
