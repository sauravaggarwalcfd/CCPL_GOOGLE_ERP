# CONFIDENCE CLOTHING — ERP BUILD REFERENCE
## Upload this file at the start of every build session

**Version:** V5 — Masters Design Complete + UI System + RBAC + Presence  
**Last Updated:** Feb 2026  
**Purpose:** Complete technical specification for Google Sheets + GAS ERP build. Claude reads this file at session start — no need to repeat any decision already made here.

---

## HOW TO START A NEW SESSION

**Paste this exactly:**

> "Claude — I am uploading CC_ERP_BUILD_REFERENCE_V5.md and CC_ERP_UI_SPEC_V5.md. Read all sections. All decisions in Sections 14, 21, 25, 26, 27 of the build reference and all locked sections of the UI spec are locked — do not re-open. Current Excel file: CC_ERP_Masters_V6.xlsx (49 sheets). Today's task: [YOUR TASK]"

**Always upload these THREE files together:**
1. `CC_ERP_BUILD_REFERENCE_V5.md` — architecture, sheets, GAS modules, locked decisions
2. `CC_ERP_UI_SPEC_V5.md` — UI design system, RBAC, presence, export specs
3. `CC_ERP_Masters_V6.xlsx` — 49-sheet Excel master data file

Claude will: read all three → confirm phase → start immediately. No re-explaining needed.
---

## 1. COMPANY CONTEXT

| Field | Value |
|---|---|
| Company | Confidence Clothing |
| Owner / MD | Saurav Aggarwal |
| Location | Ludhiana, Punjab |
| Business | Menswear manufacturing — circular knit products |
| Products | Tees, Polos, Tracksuits, Sweatshirts, Hoodies |
| Target Market | Men aged 21–45, domestic India only (no export) |
| Machines | 12 circular knitting machines |
| Job Work | Printing, Embroidery, Dyeing, Finishing — outsourced |
| ERP Type | Google Sheets + Google Apps Script (GAS) |
| Future Plan | Migrate to FastAPI / MongoDB / React (Phase 3) |

---

## 2. MASTER FILE ARCHITECTURE

### Three Google Sheet Files (Masters only)

| File | Name | Sheets | Who Manages |
|---|---|---|---|
| FILE 1A | CC ERP Masters (Items) | 23 sheets | MD / Admin only |
| FILE 1B | CC ERP Masters (Factory) | 21 sheets | Factory Manager / HR / Admin |
| FILE 1C | CC ERP Masters (Finance) | 6 sheets | Accounts team only |

**Current design file:** `CC_ERP_Masters_V6.xlsx` — 49 sheets total (23+21+6 = 50 across files; 49 in single Excel design file)

---

## 3. COMPLETE SHEET LIST (V4 — 48 sheets)

### FILE 1A — ITEMS MASTER (23 sheets)
```
01. ARTICLE_MASTER          — Finished garments. Manual code: 5249HP
02. RM_MASTER_FABRIC        — Knit fabrics. Auto code RM-FAB-xxx.
03. RM_MASTER_YARN          — Yarn. Auto code RM-YRN-xxx.
04. RM_MASTER_WOVEN         — Woven/interlining. Auto code RM-WVN-xxx.
05. TRIM_MASTER             — All trims. Auto code TRM-[CAT]-xxx. 29 cols.
06. TRIM_ATTR_NAMES         — Attribute names per trim category. 10 categories.
07. TRIM_ATTR_VALUES        — Allowed values per trim attribute. 175 values.
08. CONSUMABLE_MASTER       — Dyes, chemicals, needles, oils. CON-[CAT]-xxx.
09. CON_ATTR_NAMES          — Attribute names per consumable category.
10. CON_ATTR_VALUES         — Allowed values per consumable attribute.
11. PACKAGING_MASTER        — Poly bags, cartons, hangers. PKG-[CAT]-xxx.
12. PKG_ATTR_NAMES          — Attribute names per packaging category.
13. PKG_ATTR_VALUES         — Allowed values per packaging attribute.
14. ITEM_CATEGORIES         — 3-level category tree (L1/L2/L3).
15. UOM_MASTER              — Units of measure.
16. HSN_MASTER              — GST HSN codes with rates.
17. COLOR_MASTER            — Colors with Pantone refs + hex swatch.
18. SIZE_MASTER             — Size specs with body measurements.
19. FABRIC_TYPE_MASTER      — Knit construction types (SJ, PIQ, FLC etc.).
20. TAG_MASTER              — 28 starter tags. Chip system. Two-way sync.
21. ITEM_CHANGE_LOG         — Auto audit trail (GAS-written only).
22. MASTER_RELATIONS        — 46 FK relations (REL-001 to REL-046). GAS reads.
```

### FILE 1B — FACTORY MASTER (21 sheets)
```
01. USER_MASTER             ★ RBAC V5. Full columns per UI_SPEC §35D.
02. ROLE_MASTER             ★ NEW V5. Role permission matrix. Per UI_SPEC §35E.
03. DEPARTMENT_MASTER
04. DESIGNATION_MASTER
05. SHIFT_MASTER
06. CUSTOMER_MASTER
07. CONTRACTOR_MASTER
08. WAREHOUSE_MASTER
09. STORAGE_BIN_MASTER
10. FACTORY_MASTER
11. MACHINE_MASTER
12. MACHINE_CATEGORY
13. ASSET_MASTER
14. MAINTENANCE_SCHEDULE
15. SPARE_PARTS_MASTER
16. PROCESS_MASTER
17. WORK_CENTER_MASTER
18. JOBWORK_PARTY_MASTER
19. SUPPLIER_MASTER         — FILE 1C sheet, referenced cross-file by FILE 1A/1B.
20. ITEM_SUPPLIER_RATES     ★ NEW V4. Junction table. One row per item+supplier.
21. PRESENCE                ★ NEW V5. Active user session log. Per UI_SPEC §34G.
```

### FILE 1C — FINANCE MASTER (6 sheets)
```
01. SUPPLIER_MASTER         — All vendors. SUP-001.
02. PAYMENT_TERMS_MASTER
03. TAX_MASTER
04. BANK_MASTER
05. COST_CENTER_MASTER
06. ACCOUNT_MASTER
```

---

## 3A. UI DESIGN SYSTEM — REFERENCE FILE

**File:** `CC_ERP_UI_SPEC_V5.md` — must be uploaded alongside this file at every session.

| Spec Area | UI Spec Section | Summary |
|-----------|----------------|---------|
| Design language | §1–2 | Oracle NetSuite style, Nunito Sans + IBM Plex Mono |
| Colour system | §3 | 6 modes (Light default) + 6 accents (Orange default) |
| Layout architecture | §4 | Shell 48px + Sidebar 340px draggable + Main flex-1 |
| Shell bar | §5 | Logo, breadcrumb, theme/accent pickers, mode toggle, ⚙️ |
| Command panel | §6 | Accordion, drag handle, sticky footer actions |
| Form inputs | §7 | Auto-fill = accent bg, density settings |
| Item search | §8 | Dual search code+name, thumbnail, selected card |
| Data table | §9 | Headers, striped/bordered/clean styles |
| Status bar | §10 | ROWS, BASE, GST, GRAND TOTAL |
| Settings panel | §11 | Right slide-in 420px, all 7 categories |
| Icon system | §24 | ICON_MASTER, Notion-style picker on every icon |
| Table controls | §25 | Sort + Filter + Group + Sub-group on every table |
| Full-width rule | §26 | 100vw always, zero max-width caps |
| Save preview modal | §27 | Validate → Preview → Confirm → Toast |
| Print preview | §28 | Full overlay, A4 white page, company header |
| Unsaved guard | §29 | isDirty → Draft/Keep/Discard popup |
| Export options | §30 | PDF + Google Sheets + Excel + Clipboard |
| Active user presence | §34 | Avatar strip top-right, dual-layer (Props + PRESENCE sheet) |
| RBAC | §35 | 5 roles, 4 dimensions, USER_MASTER + ROLE_MASTER, PermContext |

**⚠️ CONFLICT CORRECTION (V5):**
UI_SPEC §34G originally placed the PRESENCE sheet in FILE 1C. This is incorrect — FILE 1C is Finance-only. **PRESENCE sheet is in FILE 1B (sheet 21).** This correction is locked here and supersedes §34G of the UI spec.

---

| Master | Format | Example | Auto/Manual |
|---|---|---|---|
| ARTICLE_MASTER | 4–5 digits + 2 CAPS | 5249HP, 54568HR | Manual — no space, no prefix |
| RM_MASTER_FABRIC | RM-FAB-[SEQ] | RM-FAB-001 | AUTO by GAS |
| RM_MASTER_YARN | RM-YRN-[SEQ] | RM-YRN-001 | AUTO by GAS |
| RM_MASTER_WOVEN | RM-WVN-[SEQ] | RM-WVN-001 | AUTO by GAS |
| TRIM_MASTER | TRM-[CAT]-[SEQ] | TRM-THD-001, TRM-ZIP-003 | AUTO by GAS — sequence per category |
| CONSUMABLE_MASTER | CON-[CAT]-[SEQ] | CON-DYE-001 | AUTO by GAS |
| PACKAGING_MASTER | PKG-[CAT]-[SEQ] | PKG-PLY-001 | AUTO by GAS |
| SUPPLIER_MASTER | SUP-001 | SUP-001 | AUTO |
| ITEM_SUPPLIER_RATES | ISR-00001 | ISR-00001 | AUTO (5 digit seq) |
| MASTER_RELATIONS | REL-001 | REL-001 to REL-046 | Manual config |

**RULE: No company prefix (CC-) anywhere. Decided and locked.**

### TRIM Category Codes (V4 — AGT removed)
| Code | Category |
|---|---|
| THD | Thread (Sewing, Overlock, Embroidery, Tacking) |
| LBL | Label (Main, Care, Size, Compliance, Hang Tag) |
| ELS | Elastic (Crochet, Knitted, Flat, Drawstring, Braces) |
| ZIP | Zipper (Dress, Open-End, Invisible, Metal) |
| BUT | Button (Flat, Snap, Shank) |
| TPE | Tape (Twill, Reflective, Silicone, Herringbone) |
| DRW | Drawcord (Flat, Round, Woven) |
| VLC | Velcro (Sew-On, Self-Adhesive) |
| RVT | Rivet/Eyelet |
| THP | Neck/Shoulder Tape |
| OTH | Other trim (not classified above) |
| BADGE | Sub-category under LBL. TRM-BDG-001. |

**AGT (Aglet) — REMOVED permanently in V4.**

---

## 5. ATTRIBUTE SYSTEM — TRIM / CONSUMABLE / PACKAGING

### Architecture (identical pattern for all three)
Three sheets work together:
1. **[X]_MASTER** — Item master with attr pair columns
2. **[X]_ATTR_NAMES** — Which attribute names apply to each category
3. **[X]_ATTR_VALUES** — What values are allowed per attribute per category

### TRIM_MASTER Attr Sets — V4 Final (10 categories)

| Category | Attr 1 | Attr 2 | Attr 3 | Attr 4 | Total |
|---|---|---|---|---|---|
| THD Thread | Type | Denier | Ply | Color(REF NAME) | 4 |
| LBL Label | Size | TYPE | — | — | 2 |
| ELS Elastic | Width | Stretch % | Color(REF NAME) | — | 3 |
| ZIP Zipper | Length | Teeth Type | Puller Type | Color(REF NAME) | 4 |
| BUT Button | Size | Material | Holes | Color(REF NAME) | 4 |
| TPE Tape | Width | Material | — | — | 2 |
| DRW Drawcord | Width | Material | — | — | 2 |
| VLC Velcro | Width | Color | — | — | 2 |
| RVT Rivet/Eyelet | Size | Material | Finish | — | 3 |
| THP Neck/Shoulder Tape | Width | Material | Color(REF NAME) | — | 3 |

### `Color(REF NAME)` Special Rule (LOCKED)
When attr name = `Color(REF NAME)`:
- GAS **ignores** TRIM_ATTR_VALUES for this attr
- GAS loads **COLOR_MASTER color names** as dropdown instead
- This enforces one color name across all masters
- Applies to: THD, ELS, ZIP, BUT, THP categories

### Four-Direction GAS Sync (unchanged from V3)
1. ATTR_NAMES → MASTER (auto-fill attr names on category select)
2. MASTER → ATTR_NAMES (new attr name discovered → prompt to add)
3. ATTR_VALUES → MASTER (dropdown values on cell focus)
4. MASTER → ATTR_VALUES (new value typed → prompt to add)

---

## 6. FOREIGN KEY (FK) RELATIONSHIP SYSTEM

### Core Principle
**Store only the code. Never copy data between sheets.**
- FK column: stores code only (e.g. RM-YRN-001)
- Adjacent "Name (Auto)" column: read-only, GAS-filled display name
- Data lives in exactly one sheet. No duplication.

### FK Column Header Convention
| Prefix | Meaning |
|---|---|
| → | FK column pointing TO another master (stores code) |
| ← | Auto-display pulled FROM another master (read-only) |
| ⟷ | Two-way sync column (attrs, tags) |
| ∑ | Calculated field — GAS computes, never type |
| ⚠ | Mandatory field |
| # | Auto-generated by GAS — never type |
| 🔑 | Primary key / code column of this sheet |

### MASTER_RELATIONS — All 46 Relations (REL-001 to REL-046)

Complete table stored in the Excel MASTER_RELATIONS sheet.

Key additions in V4:
| Code | Parent Sheet | Column | Referenced Sheet | Notes |
|---|---|---|---|---|
| REL-044 | TRIM_MASTER | → COLOUR CODE | COLOR_MASTER | Single-select. Trim color → garment color. |
| REL-045 | ITEM_SUPPLIER_RATES | → Item Code | [ALL MASTERS — dynamic] | Poly-FK. GAS routes based on Item Master col value. |
| REL-046 | ITEM_SUPPLIER_RATES | → Supplier Code | SUPPLIER_MASTER | Cross-file FK to FILE-1C. |

To add a new FK: add one row to MASTER_RELATIONS. GAS reads it automatically. No code change.

---

## 7. VARIANT SYSTEM — TRIM MASTER (unchanged)

**Option B: Sequential code + Parent Code column**

| TRM Code | Parent Code | Trim Name |
|---|---|---|
| TRM-ZIP-001 | (blank) | Nylon Zipper 6 inch Black — Base |
| TRM-ZIP-002 | TRM-ZIP-001 | Nylon Zipper 6 inch White |
| TRM-ZIP-003 | TRM-ZIP-001 | Nylon Zipper 9 inch Black |

- First/only SKU → Parent Code blank
- Variant → Parent Code = base TRM code
- BOM and PO always reference specific variant, never parent
- GAS filter: "Show all variants of TRM-ZIP-001" → filter Parent Code = TRM-ZIP-001

---

## 8. GAS SHEET STRUCTURE STANDARDS

### Every Master Sheet — Fixed Row Structure
| Row | Purpose | Style |
|---|---|---|
| Row 1 | File label + Sheet name + Description banner | Dark background, white text |
| Row 2 | Column headers | Red background, white bold text, frozen |
| Row 3 | Field descriptions (italic) | Light blue background, frozen |
| Row 4+ | Data rows | Category-colored alternating |

**Freeze:** Always at A4 (rows 1–3 frozen, columns never frozen)

### Sheet Tab Colors
- FILE 1A Items: Dark Navy #1A1A2E
- TRIM_MASTER: Purple #4A0E4E
- TRIM attr sheets: Deeper Purple #2D0A4E / #1A0A3A
- FILE 1B Factory: Dark Slate #2C3E50
- ITEM_SUPPLIER_RATES: Teal #004D40
- FILE 1C Finance: Dark Steel #1A3A4A

---

## 9. ITEM_SUPPLIER_RATES — FULL SPECIFICATION (V4 ★ NEW)

**Location:** FILE 1B, Sheet 43, positioned after SUPPLIER_MASTER.

**Architecture: Option C — Hybrid (LOCKED)**
- Item master keeps `→ Primary Supplier` + `Supplier Code` as quick reference
- ITEM_SUPPLIER_RATES holds full detail: unlimited suppliers, each with own name/code/price

### 21-Column Structure (V4 — includes GST% and ∑ Price incl GST)

| Col | Header | Type | Notes |
|---|---|---|---|
| 01 | # Rate Code | AUTO: ISR-00001 | 5-digit seq. Never type. |
| 02 | ⚠ Item Code | FK (dynamic) | TRM-THD-001 / RM-FAB-001 / CON-DYE-001 etc. |
| 03 | Item Master | Dropdown | TRIM / FABRIC / YARN / WOVEN / CONSUMABLE / PACKAGING |
| 04 | ← Item Name (Auto) | Read-only | GAS resolves from Item Code + Item Master |
| 05 | → Supplier Code | FK → SUPPLIER_MASTER | SUP-xxx |
| 06 | ← Supplier Name (Auto) | Read-only | Auto from SUPPLIER_MASTER |
| 07 | Supplier's Item Name | Text | **Their** catalogue name. Used on POs to this supplier. |
| 08 | Supplier's Item Code | Text | **Their** code/reference for PO line items |
| 09 | Unit Price (excl GST) | ₹ | Per UOM. Update each season. |
| 10 | GST % | Number | Match to HSN GST rate (5/12/18) |
| 11 | ∑ Price incl GST (Auto) | Calculated | GAS: Unit Price × (1 + GST% ÷ 100) |
| 12 | UOM | Dropdown | CONE/MTR/PCS/KG/SET/ROLL |
| 13 | MOQ | Qty | Minimum order qty in UOM |
| 14 | Lead Time (Days) | Number | PO to factory gate |
| 15 | Priority | Dropdown | Primary / Secondary / Backup / Approved |
| 16 | Valid From | Date | DD-MMM-YYYY |
| 17 | Valid To | Date | Blank = open/active. GAS flags expired red. |
| 18 | ← Last PO Date (Auto) | Read-only | GAS fills from PO module on order |
| 19 | ← Last PO Price (Auto) | Read-only | GAS fills from last confirmed PO |
| 20 | Active | Yes/No | Inactive = hidden from PO selection, kept for history |
| 21 | Notes | Text | Quality grade, brand restriction, seasonal usage |

### Priority Logic (LOCKED)
| Value | Meaning | GAS Behaviour |
|---|---|---|
| Primary | Default supplier | Pre-selected on PO creation |
| Secondary | First alternate | Shown if Primary unavailable or user switches |
| Backup | Emergency only | Shown with ⚠ warning flag in GAS sidebar |
| Approved | Approved, no rank | Shown in list, not pre-selected |

### GAS PO Behaviour
1. User adds item to PO line
2. GAS reads ITEM_SUPPLIER_RATES filtered by Item Code + Active=Yes
3. Sidebar shows all suppliers ranked by Priority, with price, GST, and lead time
4. Primary pre-selected. User can switch.
5. On confirm → GAS uses that supplier's own Item Name + Item Code on the PO line

**Covers:** TRIM, FABRIC, YARN, WOVEN, CONSUMABLE, PACKAGING — single sheet for all sourcing.

---

## 10. TRIM_MASTER — FINAL COLUMN STRUCTURE V4 (29 cols)

| Col | Header | Type |
|---|---|---|
| 01 | # TRM Code | AUTO: TRM-THD-001 |
| 02 | Parent Code | FK → self (variant system) |
| 03 | ⚠ Trim Name | Text |
| 04 | ⚠ Trim Category | Dropdown: THD/LBL/ELS/ZIP/BUT/TPE/DRW/VLC/RVT/THP/OTH |
| 05 | Trim Sub-Category | Text: Sewing Thread / CROCHET Elastic / BADGE etc. |
| 06 | IMAGE LINK | Google Drive link (1 image per SKU) |
| 07 | → COLOUR CODE | FK → COLOR_MASTER |
| 08 | ← Color/Shade Name (Auto) | Read-only from COLOR_MASTER |
| 09 | UOM | Dropdown: CONE/MTR/PCS/KG/SET/ROLL |
| 10 | → HSN Code | FK → HSN_MASTER |
| 11 | ← GST % (Auto) | Read-only from HSN_MASTER |
| 12 | → Primary Supplier | FK → SUPPLIER_MASTER (quick ref; full detail in ISR) |
| 13 | Supplier Code | Primary supplier's catalogue code for PO |
| 14 | Lead Time (Days) | Primary supplier lead time |
| 15 | Reorder Level | Qty trigger for reorder alert |
| 16 | Status | Active / Inactive / Development / Discontinued |
| 17–28 | ⟷ Attr 1–6 Name + Attr 1–6 Value | Auto-fill names; dropdown values |
| 29 | Remarks | Brand notes, quality flag, substitutes |

**66 data rows populated** across 10 category groups (THD to THP) + BADGE sub-category.
**Category divider rows** inserted between each group for visual scanning.

---

## 11. ARTICLE_MASTER — FINAL COLUMN STRUCTURE V3.1 (26 cols)

| Col | Header | Type | Key Rule |
|---|---|---|---|
| 01 | 🔑 Article Code | Manual | 4-5 digits + 2 CAPS. **NO SPACE: `5249HP`** |
| 02 | Article Description | Text | Full name with construction |
| 03 | Short Name | Text | Max 25 chars for barcode/tag |
| 04 | IMAGE LINK | Link | Single Google Drive image |
| 05 | ⟷ SKETCH DRIVE LINKS | Multi-link log | Popup. Appends ArticleCode-DyeingPlanNo-Date. Never overwrites. |
| 06 | Buyer Style No | Text | Optional |
| 07 | L1 Division | Auto | Apparel |
| 08 | L2 Product Category | Dropdown | Tops-Polo/Tops-Tee/Sweatshirt/Tracksuit/Bottoms |
| 09 | Season | Multi-select | SS25/AW25/SS26/AW26/Year Round |
| 10 | Gender | Dropdown | Men/Women/Kids/Unisex |
| 11 | Fit Type | Dropdown | Regular/Slim/Relaxed/Oversized/Athletic |
| 12 | Neckline | Dropdown | Round Neck/V-Neck/Collar/Hooded/Mock Neck |
| 13 | Sleeve Type | Dropdown | Half/Full/Sleeveless/3-4/Raglan |
| 14 | → MAIN FABRIC USED | FK → RM_MASTER_FABRIC | Search enabled |
| 15 | ← Fabric Name (Auto) | Read-only | GAS fills from RM_MASTER_FABRIC |
| 16 | Color Code(s) | Multi-select FK | → COLOR_MASTER |
| 17 | Size Range | Text | Display only |
| 18 | ∑ FINAL MARKUP % | Calculated | (MRP−WSP)÷WSP×100 |
| 19 | ∑ FINAL MARKDOWN % | Calculated | (MRP−WSP)÷MRP×100 |
| 20 | W.S.P (Rs) | Manual | Wholesale price per piece |
| 21 | MRP (Rs) | Manual | Maximum retail price |
| 22 | → HSN Code | FK → HSN_MASTER | |
| 23 | ← GST % (Auto) | Read-only | Auto from HSN_MASTER |
| 24 | Status | Dropdown | Active/Inactive/Development/Discontinued |
| 25 | Remarks | Text | |
| 26 | ⟷ Tags | Multi-select | TAG_MASTER |

---

## 12. RM_MASTER_FABRIC — KEY COLUMNS (25 cols)

| Col | Header | Notes |
|---|---|---|
| 01 | # RM Code | AUTO: RM-FAB-001 |
| 02 | ∑ FINAL FABRIC SKU | GAS builds: KNIT NAME + YARN COMPOSITION. Read-only. |
| 03 | KNIT NAME / STRUCTURE | FK → FABRIC_TYPE_MASTER (SJ/PIQ/FLC etc.) |
| 04 | ⟷ YARN COMPOSITION | Multi-select FK → RM_MASTER_YARN. Two-way sync. +Create New inline. |
| 05 | ← Yarn Names (Auto) | Read-only display. Built from RM-YRN codes. |
| 06 | FABRIC TYPE | KORA / FINISHED — drives separate inventory buckets |
| 07 | COLOUR | KORA / COLOURED / DYED / MEL |
| ... | (remaining cols) | Supplier, GSM, UOM, HSN, Status, etc. |
| 23 | ← FINISHED FABRIC COST (Auto) | Linked from Fabric Cost Sheet (Phase 3). Blank until then. |
| 25 | ⟷ Tags | Multi-select → TAG_MASTER |

---

## 13. RM_MASTER_YARN — KEY COLUMNS (15 cols)

**WEIGHT and NO OF CONES removed** — moved to YARN_INVENTORY (Phase 3).
**Duplicate HSN Col 11 deleted.**

Final cols: RM Code · Yarn Name · Colour Type · Colour (if dyed) · HSN Code · GST% · Supplier Code · Primary Supplier · ← Supplier Name (Auto) · Season for Cost · Avg Cost (excl GST) · GST% for cost · ∑ Total Cost (incl GST) · Status · Remarks

---

## 14. DECISIONS MADE — DO NOT RE-OPEN

| Decision | Choice | Locked In |
|---|---|---|
| ERP platform | Google Sheets + GAS | V1 |
| RM master structure | 3 separate sheets (Fabric/Yarn/Woven) | V1 |
| Item code style | Sequential with category prefix | V1 |
| No company prefix (CC-) | Never | V1 |
| Variant tracking | Parent Code column, not suffix | V1 |
| Attribute system | ATTR_NAMES + ATTR_VALUES two-way sync | V1 |
| FK approach | Store code only + auto-display name | V1 |
| MASTER_RELATIONS | Central config drives all FKs | V1 |
| Audit trail | ITEM_CHANGE_LOG auto-written by GAS | V1 |
| GAS 3-layer cache | CacheService + PropertiesService + Smart invalidation | V2 |
| TAG system | TAG_MASTER + ⟷ Tags chip column on 6 masters | V3 |
| Article code format | `5249HP` — NO space | V3.1 |
| Sketch links | Popup log. ArticleCode-DyeingPlanNo-Date. GAS appends only. | V3.1 |
| Markup formula | (MRP−WSP)÷WSP×100 | V3.1 |
| Markdown formula | (MRP−WSP)÷MRP×100 | V3.1 |
| YARN COMPOSITION | Multi-select FK, two-way sync, +Create New inline | V3.1 |
| FABRIC TYPE vs KNIT STRUCTURE | Separate columns. TYPE=KORA/FINISHED. STRUCTURE=construction. | V3.1 |
| WEIGHT/CONES in Yarn | Removed. Will be in YARN_INVENTORY Phase 3. | V3.1 |
| Multi-supplier architecture | Option C Hybrid. Primary in master. Full detail in ITEM_SUPPLIER_RATES. | V4 |
| ITEM_SUPPLIER_RATES scope | Covers ALL item masters — Trim/Fabric/Yarn/Woven/Consumable/Packaging | V4 |
| Color(REF NAME) attr | GAS loads COLOR_MASTER directly when attr name = Color(REF NAME) | V4 |
| Trim color FK | TRIM_MASTER col 7 → COLOR_MASTER. Enforces one color name. | V4 |
| AGT category | Removed permanently from TRIM_MASTER and attr sheets | V4 |
| ISR Priority | Primary → Secondary → Backup → Approved. GAS pre-selects Primary on PO. | V4 |
| ISR GST% column | Added to ITEM_SUPPLIER_RATES col 10. ∑ Price incl GST auto-calculated col 11. | V4 |

---

## 15. GAS PERFORMANCE — 3-LAYER CACHE (LOCKED V2)

### Layer 1 — CacheService (Session, 6 hours)
- onOpen() — one-time read of all master data in parallel batch
- Result: all FK dropdowns < 0.5 sec during session

### Layer 2 — PropertiesService (Cross-file, daily 7am)
- Pulls all cross-file data (SUPPLIER_MASTER from FILE-1C) once
- Result: zero IMPORTRANGE latency during working hours

### Layer 3 — Smart Invalidation
- onEdit() clears only the edited master's cache entry
- Other caches untouched

### Performance Targets
| Operation | Target |
|---|---|
| Sheet open | 2–4 seconds |
| FK dropdown | < 0.5 seconds |
| Attr names auto-fill | < 0.3 seconds |
| Write / save record | 2–4 seconds |

---

## 16. TAG SYSTEM (LOCKED V3)

**TAG_MASTER** — 28 starter tags. Code format: TAG-001.
**⟷ Tags column** on: ARTICLE_MASTER · RM_MASTER_FABRIC · TRIM_MASTER · SUPPLIER_MASTER · CUSTOMER_MASTER · MACHINE_MASTER

GAS: sidebar chip panel filtered by `Applies To` for that master. Toggle on/off. Type new → prompt to add to TAG_MASTER.

Stored as comma-separated Tag Codes (TAG-001, TAG-008).

---

## 17. MASTER_RELATIONS — SUMMARY

**46 relations total. REL-001 to REL-046.**

Sheet columns: 🔑 Relation Code | → Parent Sheet | → Parent Column | ← Referenced Sheet | ← Ref Code Column | ← Ref Display Col | ⟷ Allow Create New | ⚙ Dropdown Filter | ⚙ Multi-Select | ⚙ Cross-File | ⚙ Ref File Label | Active | Notes

Multi-select relations (comma-separated codes): Color Code(s) on ARTICLE_MASTER · Spare Parts on MAINTENANCE_SCHEDULE · Compatible Machines on SPARE_PARTS_MASTER · YARN COMPOSITION on RM_MASTER_FABRIC · Tags on 6 masters.

Cross-file relations (IMPORTRANGE to FILE-1C): all SUPPLIER_MASTER lookups, all PAYMENT_TERMS lookups, ITEM_SUPPLIER_RATES → SUPPLIER_MASTER.

---

## 18. ACCESS CONTROL MATRIX

| ERP Role | Can Edit | Read Only | No Access |
|---|---|---|---|
| SUPER ADMIN | All 48 sheets | — | — |
| ADMIN | All item + factory masters | Finance masters | — |
| PURCHASE MGR | Supplier, ISR, Payment Terms | Item masters | User, Finance internals |
| PRODUCTION MGR | Process, Work Center, Machine | Item masters | Finance, Users |
| STORE KEEPER | Warehouse, Bin, Spare Parts | Item masters | Finance, Users |
| ACCOUNTS | Finance masters | Item masters | Factory internals |
| VIEW ONLY | — | Item masters | Everything else |

---

## 19. SESSION PROTOCOL

**RULE 1 — Auto-save to reference file**
Every finalized decision gets added to CC_ERP_BUILD_REFERENCE.md.
Re-presented for download after every significant decision block.

**RULE 2 — Confirm before locking**
If Claude is unsure whether something is final → asks: "Is this decision final? Should I save it to the reference file?"

**RULE 3 — Session start**
Upload CC_ERP_BUILD_REFERENCE_V5.md + CC_ERP_UI_SPEC_V5.md + CC_ERP_Masters_V6.xlsx together.
Say: "Read all three, pick up from here. Today's task: [task]"

**RULE 4 — No re-opening locked decisions**
Decisions in Section 14 are closed. To change: explicitly say "Override decision [name]."

**RULE 5 — What Claude does at session start**
1. Read reference .md fully
2. Briefly confirm architecture understood (2–3 lines, not full recap)
3. State current phase + last confirmed step
4. Ask for today's specific task or proceed if task is in the opening message
5. Never ask Saurav to re-explain anything already in this document

---

## 20. HOW EXCEL AND LIVE SHEETS INTERACT

The Excel file is a DESIGN DOCUMENT only. No live formulas, no GAS, no connections.
Editing Excel freely (add/move/delete columns) affects nothing in any live system.

**Sequence:** Edit Excel → Upload to Claude → Claude reads all changes → Confirms out loud → Updates reference .md → Excel saved as new version → Phase 1 GAS build uses final Excel as spec.

To add a new FK in Excel:
- Method A: Add row to MASTER_RELATIONS with all columns filled
- Method B: Name FK column with → prefix — Claude infers relation
- Method C: Tell Claude in chat — Claude adds to MASTER_RELATIONS

---

## 21. GAS FUNCTION LIBRARY — PHASE 1 BUILD ORDER

### Module 1 — Code Generation
`generateItemCode(sheet, category)` → increments sequence per category, validates format, returns new code

### Module 2 — FK Relationship Engine
`getFKDropdown(parentSheet, parentColumn)` → reads MASTER_RELATIONS → returns code+name pairs filtered Active=Yes
`createNewFKRecord(referencedSheet, formData)` → mini-form sidebar → writes to referenced master → returns new code
`autoDisplayFKName(code, sheet, nameCol)` → fills adjacent read-only display column

### Module 3 — Attribute System (4 directions)
`autoFillAttrNames(sheet, row, category)` → on category change → writes attr names into Name cols, clears Value cols
`getAttrValueDropdown(category, attrName)` → returns allowed values; if attrName=Color(REF NAME) → loads COLOR_MASTER instead
`syncNewAttrName()` + `syncNewAttrValue()` → two-way sync, prompts user, writes to ATTR_NAMES / ATTR_VALUES

### Module 4 — Change Log
`writeChangeLog(action, sheet, itemCode, field, oldVal, newVal, userEmail)` → AUTO on onEdit. Never manual.

### Module 5 — RBAC Permission Engine ★ UPGRADED V5
`getUserPermissions(email)` → reads USER_MASTER + ROLE_MASTER → merges role defaults with per-user overrides → returns full perms object → caches in CacheService (6-hour TTL)
`checkPermission(email, action, module)` → called server-side at top of EVERY GAS action function → blocks suspended/inactive users → blocks unauthorised module/action combos → returns `{allowed, reason}`
`invalidatePermissionsCache(email)` → clears PERMS_* cache key for one user or all active users on role-level change
`onOpen trigger` → calls getUserPermissions → hides inaccessible sheet tabs → locks inaccessible ranges → renders role-appropriate menus
**Permission dimensions (4):** module access · action rights (13 actions) · export rights (5 types) · field visibility (hidden fields → `🔒 ——` in UI, skipped in GAS writes)
**UI layer:** PermContext React context → `can()` / `sees()` / `canExp()` / `canSee()` helpers → buttons hidden (not disabled) when not permitted
**Full spec:** CC_ERP_UI_SPEC_V5.md §35

### Module 6 — Color Swatch
`applyColorSwatch()` → on COLOR_MASTER hex change → sets cell background to that hex

### Module 7 — Reorder Alert
Scheduled trigger 8am daily → checks Current Stock < Reorder Level → email/WhatsApp to Purchase Manager

### Module 8 — ITEM_SUPPLIER_RATES (NEW V4)
`getItemSuppliers(itemCode)` → reads ISR filtered by itemCode + Active=Yes → returns ranked supplier list
`selectSupplierForPO(itemCode)` → sidebar panel, Priority pre-selects Primary → user confirms or switches
`updateLastPOData(rateCode, poDate, poPrice)` → AUTO on PO confirmation → fills cols 18/19

### Module 9 — Export Engine ★ NEW V5
`exportToGoogleSheet(moduleId, recordRef, dataPayload)` → creates new formatted Google Sheet in user's Drive → applies company header rows + column headers + data rows + totals → auto-resizes columns → returns Sheet URL → client opens in new tab
`exportToExcel(moduleId, recordRef, dataPayload)` → creates temp Sheet via exportToGoogleSheet → generates Drive export URL (xlsx format) → returns download URL → temp Sheet deleted after 60s via time-based trigger
**File naming:** `CC ERP — [Module] — [DocRef] — [Date]` for Sheets · `CC_ERP_[Module]_[DocRef]_[YYYYMMDD].xlsx` for Excel
**Export permissions:** filtered per user role via checkPermission before any export function executes
**Full spec:** CC_ERP_UI_SPEC_V5.md §30

### Module 10 — Active User Presence ★ NEW V5
`heartbeat(userInfo)` → dual-write: (1) writes `PRESENCE_[email]` key to ScriptProperties with `{email, name, module, page, sessionId, ts}` + (2) appends audit row to PRESENCE sheet (FILE 1B, Sheet 21) with Action=HEARTBEAT → reads all PRESENCE_* keys → filters stale (>3 min) → cleans up expired keys → returns active user list to client
`logPresenceAction(action, sessionId)` → writes LOGIN or LOGOUT row to PRESENCE sheet → called on page open and beforeunload
**Client polling:** React `setInterval(heartbeat, 30000)` + immediate call on mount + beforeunload LOGOUT
**PRESENCE sheet columns:** Timestamp | Email | Name | Module | Page | Session ID | Action
**Retention:** daily 2 AM trigger archives rows >90 days to PRESENCE_ARCHIVE sheet
**Full spec:** CC_ERP_UI_SPEC_V5.md §34
**⚠️ PRESENCE sheet is in FILE 1B (Sheet 21) — NOT FILE 1C**

### Module 11 — UI Render Engine ★ NEW V5
`getUIBootstrap(email)` → single GAS call on app load → returns merged object: `{ perms, onlineUsers, draftData, userPrefs }` → minimises round-trips on startup
`saveUserPreferences(email, prefs)` → saves theme/accent/density/tableStyle settings to PropertiesService under `PREFS_[email]`
`getUserPreferences(email)` → returns saved UI preferences → used to restore theme + layout on next login
`saveDraft(module, sessionId, formData)` → saves dirty form data to PropertiesService under `DRAFT_[MODULE]_[userId]`
`restoreDraft(module, userId)` → returns saved draft if exists → client shows restore banner
`clearDraft(module, userId)` → called after successful save or explicit discard

---

## 22. IMPLEMENTATION SEQUENCE

```
Phase 0  — Masters Design ✅ COMPLETE (V5)
           49 sheets locked. 66 trim rows populated.
           ITEM_SUPPLIER_RATES live with 15 sample rows.
           MASTER_RELATIONS 46 relations confirmed.
           USER_MASTER + ROLE_MASTER + PRESENCE sheets added (V5).

Phase 1  — Google Sheets Setup + GAS Core (2 weeks)
  Step 1.1  — GAS creates all 3 master files + all 49 sheet structures
  Step 1.2  — Dropdowns and data validation on all sheets
  Step 1.3  — Auto-code generators (Module 1)
  Step 1.4  — FK relationship engine via MASTER_RELATIONS (Module 2)
  Step 1.5  — Attribute two-way sync (Module 3)
  Step 1.6  — ITEM_CHANGE_LOG onEdit trigger (Module 4)
  Step 1.7  — RBAC engine: getUserPermissions + checkPermission (Module 5)
  Step 1.8  — USER_MASTER + ROLE_MASTER seeded with 5 default roles
  Step 1.9  — CacheService Layer 1 session cache
  Step 1.10 — PropertiesService Layer 2 cross-file cache
  Step 1.11 — Smart invalidation Layer 3
  Step 1.12 — COLOR_MASTER hex swatch auto-apply (Module 6)
  Step 1.13 — Reorder alert scheduled trigger (Module 7)
  Step 1.14 — ITEM_SUPPLIER_RATES PO sidebar (Module 8)
  Step 1.15 — Export engine: Google Sheets + Excel (Module 9)
  Step 1.16 — Presence heartbeat + PRESENCE sheet (Module 10)
  Step 1.17 — UI bootstrap + draft save/restore + user prefs (Module 11)
  Step 1.18 — onOpen: hide sheets by role, lock ranges, show menus

Phase 1B — UI Build (React/GAS Web App) — parallel to Phase 1
  Step 1B.1 — Base layout: Shell bar + Command Panel + Main area (UI_SPEC §4)
  Step 1B.2 — Theme system: 6 modes + 6 accents + Settings panel (UI_SPEC §3, §11)
  Step 1B.3 — ICON_MASTER + IconPicker component (UI_SPEC §24)
  Step 1B.4 — PermContext + can()/sees()/canExp()/canSee() helpers (UI_SPEC §35I)
  Step 1B.5 — Avatar strip + presence polling (UI_SPEC §34)
  Step 1B.6 — Users & Roles Admin Panel (UI_SPEC §35H)
  Step 1B.7 — Table controls: Sort + Filter + Group + Sub-group (UI_SPEC §25)
  Step 1B.8 — Save Preview Modal + Unsaved Changes Guard (UI_SPEC §27, §29)
  Step 1B.9 — Print Preview overlay + Export dropdown (UI_SPEC §28, §30)
  Step 1B.10 — Suspended user lock screen (UI_SPEC §35J)

Phase 2  — Data Entry (1–2 weeks)
  Fill FILE 1C first (Finance) → FILE 1B (Factory, including USER_MASTER
  with real emails + ROLE_MASTER defaults) → FILE 1A (Items)
  Reason: child masters before parent masters

Phase 3  — Transaction Modules (4–8 weeks)
  FILE 2: Procurement (PO, GRN) → FILE 3: Inventory
  → FILE 4: Production → FILE 5: Quality
  → FILE 6: Sales → FILE 7: Finance → FILE 8: Dashboard

Phase 4  — Reporting Dashboard (IMPORTRANGE + GAS summaries)

Phase 5  — WhatsApp/Email Notifications (optional)
```

---

## 23. CURRENT STATUS — V5 SNAPSHOT

### ✅ LOCKED — Do not re-open
- All master sheet structures (49 sheets across 3 files)
- All 46 FK relations in MASTER_RELATIONS
- All coding systems and GAS 11-module architecture
- Attribute system for TRIM, CONSUMABLE, PACKAGING
- ITEM_SUPPLIER_RATES full specification (21 cols, Option C hybrid)
- TRIM_MASTER: 66 rows × 10 category groups populated with reference data
- TRIM_ATTR_NAMES: 10 categories, simplified V4 attr sets
- TRIM_ATTR_VALUES: 175 clean values, Color(REF NAME) excluded
- UI Design System: CC_ERP_UI_SPEC_V5.md (NetSuite V5 standard, Light+Orange default)
- RBAC: 5 roles, 4 permission dimensions, USER_MASTER + ROLE_MASTER specs
- Presence: dual-layer PropertiesService + PRESENCE sheet (FILE 1B Sheet 21)
- Export: PDF + Google Sheets + Excel + Clipboard on every module

### 🔲 PENDING — Before Phase 1 GAS build starts
1. **USER_MASTER** — actual Google email addresses + roles for Saurav's team
2. **ROLE_MASTER** — seed 5 default roles with permission JSON
3. **FACTORY_MASTER** — actual address, GST number, PAN, bank details
4. **CONSUMABLE_MASTER + PACKAGING_MASTER** — review and confirm reference data rows
5. **SUPPLIER_MASTER** — key suppliers entered (Coats, Madura, YKK, fabric mills)
6. **Machine list** — all 12 knitting machine specs in MACHINE_MASTER
7. **Contractor list** — all current JW parties with rates in CONTRACTOR_MASTER
8. **ITEM_SUPPLIER_RATES** — fill actual rates once suppliers entered

### 📋 CURRENT PHASE
**Phase 0 — Masters Design COMPLETE.** Structural decisions locked. Data entry in masters to complete before Phase 1 GAS + Phase 1B UI builds declared ready.

---

## 24. TRANSACTION MODULES — PHASE 3 FUTURE BUILD

| # | File | Key Sheets | Key GAS |
|---|---|---|---|
| 1 | FILE 2: Procurement | PO, GRN, Purchase Return, Invoice Register | PO# gen, GRN→Stock |
| 2 | FILE 3: Inventory | Stock Ledger, Transfer, Adjustment, Alerts | Real-time balance |
| 3 | FILE 4: Production | Work Order, BOM, Job Card, JW Order | WO→BOM pull |
| 4 | FILE 5: Quality | Fabric Inspection, Inline, AQL, Defect Register | Rejection→WH-REJ |
| 5 | FILE 6: Sales | Sales Order, Delivery Challan, Invoice | DC→Stock deduct |
| 6 | FILE 7: Finance | Purchase/Payment/Receipt/Expense, GST Summary | GSTR-1/3B output |
| 7 | FILE 8: Dashboard | All reports | IMPORTRANGE summaries |

---

## 25. VERSION HISTORY

| Version | Date | Changes |
|---|---|---|
| V1 | Feb 2026 | Initial 44-sheet design. Coding system. Attribute system. FK architecture. MASTER_RELATIONS. Icon system. |
| V2 | Feb 2026 | MASTER_RELATIONS 35 relations. GAS 3-layer cache locked. |
| V3 | Feb 2026 | TAG_MASTER (28 tags). ⟷ Tags on 6 masters. REL-036 to REL-041. 47 sheets. |
| V3.1 | Feb 2026 | ARTICLE, RM_FABRIC, RM_YARN rebuilt from Saurav edits. Article code no space. Sketch link popup. Markup/Markdown calc. YARN COMPOSITION multi-FK. FABRIC TYPE vs KNIT STRUCTURE separated. WEIGHT/CONES removed from Yarn. REL-042 + REL-043. |
| V4 | Feb 2026 | TRIM_MASTER: IMAGE LINK + COLOUR CODE FK. Multi-supplier ITEM_SUPPLIER_RATES (21 cols, Option C hybrid, GST% + ∑Price incl GST). Color(REF NAME) → COLOR_MASTER. AGT removed. Attr sets simplified. 66 trim rows populated. 48 sheets. 46 relations. REL-044/045/046. |
| **V5** | **Feb 2026** | **UI Design System locked: CC_ERP_UI_SPEC_V5.md (NetSuite V5, Light+Orange, full spec 35 sections). RBAC: 5 roles, 4 permission dimensions, Module 5 upgraded to full permission engine. USER_MASTER V5 spec (15 cols). ROLE_MASTER new sheet. Presence system: Module 10, PRESENCE sheet (FILE 1B Sheet 21). Export engine: Module 9 (PDF+Sheets+Excel+Clipboard). UI Render Engine: Module 11 (bootstrap, prefs, draft). Phase 1B UI build steps added. 49 sheets. 11 GAS modules. 3 reference files.** |

---

## 26. RULES FOR CLAUDE IN NEW SESSIONS

1. **Read ALL THREE files first** — CC_ERP_BUILD_REFERENCE_V5.md + CC_ERP_UI_SPEC_V5.md + CC_ERP_Masters_V6.xlsx — before doing any work or writing any code
2. **Confirm understanding in 3 lines max** — do not recite the entire architecture back
3. **Never rebuild what is locked** — if TRIM_MASTER, MASTER_RELATIONS, or any V4/V5 structure already exists in the Excel, do not overwrite without an explicit instruction
4. **Changes are incremental** — always load the existing Excel, make targeted changes, save. Never start from blank.
5. **Flag conflicts before acting** — if something contradicts either reference doc, point it out and ask before proceeding
6. **Always release THREE files together** — after any significant session: CC_ERP_BUILD_REFERENCE_V5.md + CC_ERP_UI_SPEC_V5.md + CC_ERP_Masters_V6.xlsx
7. **Data rows are sacred** — never delete Saurav's entered data rows when rebuilding a sheet. Clear only if explicitly told to.
8. **ITEM_SUPPLIER_RATES is in FILE 1B (Sheet 20)** — Cross-file lookup. Always treat Supplier Code as cross-file FK to FILE-1C.
9. **Color(REF NAME) has no rows in TRIM_ATTR_VALUES** — intentional. GAS reads COLOR_MASTER directly. Never add Color(REF NAME) values to any ATTR_VALUES sheet.
10. **PRESENCE sheet is in FILE 1B (Sheet 21)** — NOT FILE 1C. This overrides any conflicting reference in UI_SPEC §34G.
11. **UI spec governs all frontend** — any UI question, component, layout, colour, or behaviour → check CC_ERP_UI_SPEC_V5.md first. Never deviate without "Override UI [component]" from Saurav.
12. **RBAC check is mandatory in every GAS action** — every function that writes data must call `checkPermission(email, action, module)` at top. No exceptions.
13. **Hidden ≠ disabled** — restricted UI elements are removed from DOM entirely. Never render a greyed-out or disabled button for permission-blocked actions. Exception: Submit button during form validation.
14. **Hidden fields = `🔒 ——`** — restricted financial/sensitive fields render as lock icon + em dash. Never an empty input.
15. **Sheet count is 49** — FILE 1A (23) + FILE 1B (21) + FILE 1C (6) = 50 total across live files; 49 in the single CC_ERP_Masters_V6.xlsx design file (SUPPLIER_MASTER counted once).

