# CONFIDENCE CLOTHING — ERP BUILD REFERENCE
## Upload this file at the start of every build session

**Version:** V7 — Masters V8 + Notion Foundation (Status Workflow, Rollups, Embedded Views, Templates, Comments, Automations)  
**Last Updated:** Feb 2026  
**Purpose:** Complete technical specification for Google Sheets + GAS ERP build. Claude reads this file at session start — no need to repeat any decision already made here.

---

## HOW TO START A NEW SESSION

**Paste this exactly:**

> "Claude — I am uploading CC_ERP_BUILD_REFERENCE_V7.md and CC_ERP_UI_SPEC_V6.md. Read all sections. All decisions in Sections 14, 21, 25, 26, 27 of the build reference and all locked sections of the UI spec are locked — do not re-open. Current Excel file: CC_ERP_Masters_V8.xlsx (56 sheets). Today's task: [YOUR TASK]"

**Always upload these THREE files together:**
1. `CC_ERP_BUILD_REFERENCE_V7.md` — architecture, sheets, GAS modules, Notion features, locked decisions
2. `CC_ERP_UI_SPEC_V6.md` — UI design system, RBAC, presence, export, notifications, shortcuts specs
3. `CC_ERP_Masters_V8.xlsx` — 55-sheet Excel master data file

**For Procurement work, also upload:**
4. `CC_ERP_FILE2_Procurement_V2.xlsx` — 7-sheet Procurement file (PO, GRN, Relations, Templates, Comments)

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
| FILE 1A | CC ERP Masters (Items) | 27 sheets | MD / Admin only |
| FILE 1B | CC ERP Masters (Factory) | 23 sheets | Factory Manager / HR / Admin |
| FILE 1C | CC ERP Masters (Finance) | 6 sheets | Accounts team only |

**Current design file:** `CC_ERP_Masters_V8.xlsx` — 56 sheets total (27+23+6 = 56)

### Transaction Files

| File | Name | Sheets | Status |
|---|---|---|---|
| FILE 2 | CC ERP Procurement | 7 sheets | V2 — PO + GRN + Relations + Templates + Comments |
| FILE 3 | CC ERP Inventory | — | Pending |
| FILE 4 | CC ERP Production | — | Pending |
| FILE 5 | CC ERP Quality | — | Pending |
| FILE 6 | CC ERP Sales | — | Pending |
| FILE 7 | CC ERP Finance | — | Pending |
| FILE 8 | CC ERP Dashboard | — | Pending |

**Current procurement file:** `CC_ERP_FILE2_Procurement_V2.xlsx` — 7 sheets

---

## 3. COMPLETE SHEET LIST (V7 — 56 master sheets + 7 procurement sheets)

### FILE 1A — ITEMS MASTER (27 sheets)
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
23. STATUS_WORKFLOW         ★ NEW V7. Status definitions + transitions for ALL modules. 41 rows. WF-001.
24. ROLLUP_CONFIG           ★ NEW V7. Computed aggregate definitions across FK relations. 17 rows. RUP-001.
25. EMBEDDED_VIEWS          ★ NEW V7. Linked Database View definitions for ALL modules. 13 rows. EMB-001.
26. HELP_CONTENT            ★ NEW V7. In-app help pages + setup instructions. 13 pages. HLP-001. Claude-maintained.
27. GARMENT_COMPONENT       — Garment component list.
```

### FILE 1B — FACTORY MASTER (23 sheets)
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
22. NOTIFICATIONS           ★ NEW V6. Push notification queue. NTF-XXXXX auto-code.
23. AUTOMATION_RULES        ★ NEW V7. Event-driven automation definitions for ALL modules. 8 rows. AUT-001.
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

### FILE 2 — PROCUREMENT (7 sheets) ★ NEW V7
```
01. PO_MASTER               — Purchase Orders. PO-YYYY-NNNN. 21 cols.
02. PO_LINE_ITEMS           — PO line items. POL-NNNNN. 20 cols.
03. GRN_MASTER              — Goods Receipt Notes. GRN-YYYY-NNNN. 17 cols.
04. GRN_LINE_ITEMS          — GRN line items. GRL-NNNNN. 19 cols.
05. MASTER_RELATIONS_F2     — FK relations for FILE 2. REL-047 to REL-054.
06. TEMPLATES               ★ NEW V7. Pre-fill templates for PO & GRN. 10 rows. TPL-001.
07. RECORD_COMMENTS         ★ NEW V7. Comments + @Mentions per record. CMT-00001.
```

**Rule: Every future transaction file (FILE 3–8) MUST include TEMPLATES + RECORD_COMMENTS sheets.**

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
| STATUS_WORKFLOW | WF-001 | WF-001 to WF-041 | Manual config |
| ROLLUP_CONFIG | RUP-001 | RUP-001 to RUP-017 | Manual config |
| EMBEDDED_VIEWS | EMB-001 | EMB-001 to EMB-013 | Manual config |
| AUTOMATION_RULES | AUT-001 | AUT-001 to AUT-008 | Manual config |
| TEMPLATES (per file) | TPL-001 | TPL-001 to TPL-011 | Manual config |
| RECORD_COMMENTS (per file) | CMT-00001 | CMT-00001 | AUTO (5 digit seq) |

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
| React = real frontend | React is production frontend, GAS = backend API only via google.script.run. | V7 |
| Linked DB views = view-only | No inline edit, no action buttons. Row click→navigate. "View All→" filter. | V7 |
| View customization 3 layers | Personal (PropertiesService) + Shared (Sheets config) + Role-Filtered (GAS filters) | V7 |
| Tiered lazy loading | Tier 1 app open (~1.5s) + Tier 2 module open (~0.8s) + Tier 3 record open (form instant, linked bg) | V7 |
| Config-driven Notion features | STATUS_WORKFLOW + ROLLUP_CONFIG + EMBEDDED_VIEWS + TEMPLATES + RECORD_COMMENTS + AUTOMATION_RULES | V7 |
| Every transaction file includes TEMPLATES + RECORD_COMMENTS | Mandatory for FILE 2–8. No exceptions. | V7 |
| Dual-path config: Manual + Claude + Admin UI | All 3 paths write to same config sheets. Admin UI = Phase 3C. | V7 |
| Build sequence: Foundation → Polish → Notion → Configurators | Stage 1-2 first. Notion features Stage 3. Admin configurators Phase 3C. | V7 |
| Notion Foundation Architecture | Config-sheet-driven. Add rows to config sheets → features auto-work for new modules. | V7 |
| STATUS_WORKFLOW | Central config sheet in FILE 1A. 48 statuses across 8 modules. STS-001 code format. | V7 |
| ROLLUP_CONFIG | Central config sheet in FILE 1A. 24 rollup definitions. RUP-001 code format. | V7 |
| EMBEDDED_VIEWS | Central config sheet in FILE 1A. 16 linked view configs. EMB-001 code format. | V7 |
| AUTOMATION_RULES | Central config sheet in FILE 1B. 8 rules (5 active). AUT-001 code format. Stage 3 execution. | V7 |
| TEMPLATES per txn file | Every transaction file (FILE 2-8) gets TEMPLATES sheet. TPL-001 code format. | V7 |
| RECORD_COMMENTS per txn file | Every transaction file (FILE 2-8) gets RECORD_COMMENTS sheet. CMT-00001 code format. | V7 |
| Linked DB Views = strict view-only | No inline edit, no action buttons. Row click → navigate to record. "View All→" → filtered module. | V7 |
| View Customization 3 layers | Personal (PropertiesService) / Shared (config sheets) / Role-Filtered (GAS filters before React). | V7 |
| Saved Filter Views per user | Max 10 per user per module. Stored in PropertiesService. Module-agnostic pattern. | V7 |
| Tiered Lazy Loading | Tier 1 (app open) → Tier 2 (module open) → Tier 3 (record open). Form instant, linked views background. | V7 |
| React = REAL frontend | GAS = backend API only (google.script.run). React serves all UI. NOT a prototype. | V7 |

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

## 20A. NOTION FEATURES — FOUNDATION ARCHITECTURE ★ NEW V7

### Core Principle: Config-Driven Features
**Add rows to config sheets → get features for free in any module.**

All Notion-inspired features are built as **module-agnostic systems**. When building a new module (Production, Inventory, Sales etc.), these features work automatically by adding config rows — zero new React or GAS code needed.

### 6 Foundation Config Sheets

| Sheet | Location | Rows | Purpose | React Component |
|---|---|---|---|---|
| STATUS_WORKFLOW | FILE 1A #23 | 41 | Status definitions + transitions + Kanban columns | `<StatusBadge>` `<StatusTransitionDropdown>` `<KanbanBoard>` |
| ROLLUP_CONFIG | FILE 1A #24 | 17 | Aggregate computations across FK relations | `<RollupSummaryCards>` |
| EMBEDDED_VIEWS | FILE 1A #25 | 13 | Linked Database views on record detail pages | `<LinkedDatabaseView>` |
| AUTOMATION_RULES | FILE 1B #23 | 8 | Event-driven automation (status change, record create) | `<AutomationRulesPanel>` (Admin) |
| TEMPLATES | Per transaction file | 11 (F2) | Pre-fill templates for new records | `<TemplatePickerModal>` |
| RECORD_COMMENTS | Per transaction file | — | Comments + @Mentions per record | `<CommentsPanel>` |

### Additional Features (React state + PropertiesService — no sheet needed)

| Feature | Storage | React Component | GAS API |
|---|---|---|---|
| Saved Filter Views | PropertiesService `SAVED_VIEWS` | `<SavedViewsTabs>` `<FilterBuilder>` | `getUserSavedViews()` `saveUserView()` `deleteUserView()` |
| Favorites (⭐🕐🔥) | PropertiesService `FAVORITES` | `<QuickAccessPanel>` | `logRecordAccess()` `getFrequentRecords()` |
| View Switcher | React state | `<ViewSwitcher>` (Table/Kanban) | None — same data, different render |
| Collapsible Sections | React useState | `<CollapsibleSection>` | None — pure UI |

### STATUS_WORKFLOW — Column Structure (12 cols)
```
🔑 Workflow ID | ⚠ Module | ⚠ Status Code | Status Name | Stage Group | Color Hex | Allowed Next Statuses | Required Role | Auto Actions | Sort Order | Active | Notes
```
- **Module** format: `Procurement-PO`, `Production-WO`, `Quality-QC`, `Inventory-ADJ`, `Jobwork-OUT`, `Maintenance-WR`
- **Stage Group** values: `Not Started` / `In Progress` / `Complete` — drives Kanban column grouping
- **Allowed Next** = comma-separated status codes this status can transition TO
- **Required Role** = minimum RBAC role to set this status (Operator+ / Supervisor+ / Manager+ / Admin)
- **Pre-populated**: 41 workflow states across 8 modules (Procurement-PO, Procurement-GRN, Production-WO, Inventory-ADJ, Inventory-TRF, Quality-QC, Jobwork-OUT, Maintenance-WR)

### ROLLUP_CONFIG — Column Structure (13 cols)
```
🔑 Rollup ID | ⚠ Source Module | ⚠ Source Sheet | ⚠ FK Column | ⚠ Agg Column | Agg Function | ⚠ Target Module | ⚠ Target Sheet | Display Label | Format | Sort Order | Active | Notes
```
- **Agg Function** values: `COUNT` / `SUM` / `AVG` / `MIN` / `MAX` / `LAST` / `COUNT:STATUS` (filtered count)
- **Pre-populated**: 17 rollup definitions across Supplier (5), Article (4), PO (3), Machine (3), Customer (2)
- Example: RUP-001 counts all POs for a supplier; RUP-003 gets last PO date

### EMBEDDED_VIEWS — Column Structure (13 cols) 🔒 STRICT VIEW-ONLY
```
🔑 View ID | ⚠ Parent Module | ⚠ Parent Sheet | ⚠ Child Module | ⚠ Child Sheet | ⚠ FK Column | Display Columns | Sort Column | Sort Direction | Max Rows | Default Collapsed | Active | Notes
```
- **LOCKED RULE**: Linked DB views are strictly **read-only**. No inline edit, no action buttons.
- **Row click** → navigates to that record's full page (hover cursor: pointer)
- **"View All →"** → full module with filter pre-applied
- **Collapsible** (▼/▶), lazy-loaded on first expand
- **Pre-populated**: 13 views across Supplier (3), PO (2), GRN (1), Article (2), Machine (2), Warehouse (1), Customer (1), Contractor (1)

### AUTOMATION_RULES — Column Structure (11 cols)
```
🔑 Rule ID | ⚠ Module | Rule Name | Trigger Type | Trigger Detail | Condition JSON | Actions JSON | Priority | Active | Created By | Notes
```
- **Trigger types**: `STATUS_CHANGE` / `RECORD_CREATE` / `FIELD_UPDATE` / `SCHEDULE`
- **Pre-populated**: 8 rules (PO approval notify, GRN→PO status sync, QC failure notify, audit logging, etc.)
- **Stage 3 feature** — GAS execution engine built later. Config exists now.

### TEMPLATES — Column Structure (11 cols, per transaction file)
```
🔑 Template ID | ⚠ Module | ⚠ Sheet Target | Template Name | Description | Pre-fill JSON | Icon | Sort Order | Active | Created By | Created Date
```
- **Pre-fill JSON** = column:value pairs to auto-fill on new record. e.g. `{"PO Type":"Fabric","Currency":"INR"}`
- **Special action**: `{"_action":"copy_from_previous"}` triggers "copy from existing record" flow
- **FILE 2 pre-populated**: 8 PO templates + 3 GRN templates

### RECORD_COMMENTS — Column Structure (13 cols, per transaction file)
```
🔑 Comment ID | ⚠ Record Ref | ⚠ Module | ⚠ Sheet | Author Email | Author Name | Timestamp | Comment Text | Mentions | Parent Comment ID | Status | Edited | Edit Timestamp
```
- **@Mentions**: `@{email}` in text → triggers `createNotification()` for mentioned user
- **Threading**: `Parent Comment ID` links replies to parent → threaded display
- **Soft delete**: Status = `ACTIVE` / `DELETED`. Never remove rows.

### New Module Checklist (MANDATORY for every future FILE 3–8)

When building any new transaction file, these steps are **mandatory**:
1. Add status rows to `STATUS_WORKFLOW` in FILE 1A
2. Add linked view rows to `EMBEDDED_VIEWS` in FILE 1A  
3. Add rollup rows to `ROLLUP_CONFIG` in FILE 1A
4. Add `TEMPLATES` sheet to the new transaction file
5. Add `RECORD_COMMENTS` sheet to the new transaction file
6. React components are reusable — no new code needed

### GAS API Functions for Notion Features

```
// Status Workflow (Module 14)
getWorkflowConfig(module)           → returns all status rows for module from STATUS_WORKFLOW
validateStatusTransition(ref, from, to, role) → checks Allowed Next + Required Role
updateRecordStatus(ref, newStatus)  → validates + updates + triggers automations

// Rollups (Module 14)
getRollups(recordRef, module)       → computes all rollups for this record from ROLLUP_CONFIG
                                       Cached Layer 1 after first compute per record

// Embedded Views (Module 14)
getEmbeddedViewData(parentRef, viewId) → reads EMBEDDED_VIEWS config + fetches filtered child data
                                          Returns {columns, rows, total} for React component

// Templates (Module 15)
getTemplates(module)                → returns all active templates for module from TEMPLATES sheet
saveTemplate(module, templateData)  → creates new template row (Manager+ role)
deleteTemplate(templateId)          → sets Active=No (Admin only)

// Comments (Module 15)
getComments(recordRef)              → returns all ACTIVE comments for record, threaded
addComment(recordRef, text, mentions) → appends row + triggers notifications for @mentions
editComment(commentId, newText)     → updates text + sets Edited=Yes
deleteComment(commentId)            → soft-delete: Status→DELETED

// Saved Views (Module 16)
getUserSavedViews(email, module)    → reads SAVED_VIEWS from PropertiesService
saveUserView(email, module, view)   → stores named filter combo (max 10 per module)
deleteUserView(email, module, viewId) → removes saved view

// Favorites (Module 16)
logRecordAccess(email, ref, module) → tracks ⭐ Starred + 🕐 Recent + 🔥 Frequent
getFrequentRecords(email)           → returns top 5 by access count
toggleStar(email, ref)              → add/remove from starred list
```

### Performance: Tiered Lazy Loading (LOCKED)

| Tier | When | What Loads | Target |
|---|---|---|---|
| Tier 1 | App Open | ONE `getUIBootstrap()` → role, perms, userPrefs, shortcuts, STATUS_WORKFLOW (cached), TEMPLATES (cached) | ~1.0-1.5s |
| Tier 2 | Module Open | `getModuleData()` from cache, saved views from userPrefs | ~0.5-0.8s |
| Tier 3 | Record Open | Form instant → linked views + rollups + comments load background with skeleton loaders | Form 0.5s, linked 1-2s |

**Real risk is data volume, not features.** CC scale (200-500 POs/year) = well under 5K rows for 3+ years.

### React Component Tree (Notion Features + Configurators)

```
<App>
  ├── <ViewSwitcher> (Table | Kanban)
  │   ├── <DataTable>
  │   └── <KanbanBoard>
  │       └── <DroppableColumn> → <DraggableCard>
  ├── <SavedViewsTabs>
  ├── <FilterBuilder>
  ├── <RecordForm>
  │   ├── <CollapsibleSection>
  │   ├── <RollupSummaryCards>
  │   │   └── [+ Add Rollup] → <RollupConfigurator>         ★ Admin/Manager
  │   ├── <StatusBadge> + <StatusTransitionDropdown>
  │   ├── <LinkedDatabaseView> (view-only, row click→navigate)
  │   │   └── [+ Add Linked View] → <EmbeddedViewConfigurator> ★ Admin/Manager
  │   ├── <CommentsPanel> → <CommentInput> + <CommentThread>
  │   └── <SlashCommandPopover> (Phase 2)
  ├── <TemplatePickerModal>
  ├── <QuickAccessPanel> (⭐ Starred, 🕐 Recent, 🔥 Frequent)
  └── <ModuleSettings>                                        ★ Admin only
      ├── <WorkflowEditor> (visual status flow editor)
      ├── <TemplateEditor> (template list + CRUD)
      └── <AutomationRuleBuilder> (trigger/condition/action)
```

### Linked DB Views — Strict Rules (LOCKED)
1. **View-only** — no inline edit, no action buttons in embedded views
2. **Row click** → navigates to that record's full detail page
3. **"View All →"** → opens full module with filter pre-applied
4. **Collapsible** (▼/▶) — some default collapsed, some expanded per EMBEDDED_VIEWS config
5. **Lazy-loaded** — data fetched on first expand, not on page load
6. **Max rows** — configurable per view (5, 10, or 20), then "View All →"

---

## 20B. FRONTEND ARCHITECTURE — REACT + GAS ★ LOCKED V7

### Core Decision (LOCKED — C-01 Resolved)
- **React** = REAL production frontend (not prototype)
- **GAS** = backend API only. All data access via `google.script.run`
- **BUILD_REFERENCE V7** governs architecture
- **Sheets Design Docx** = content reference only

### View Customization — 3 Layers (LOCKED)
1. **Personal (per user)**: Preferred view mode, saved filters, starred records, theme, column order → `PropertiesService`
2. **Shared (same for all)**: Kanban columns, status workflows, linked DB configs, rollups, templates → Google Sheets config
3. **Role-Filtered (same view, different data)**: Admin sees all, Manager sees department, Operator sees assigned → GAS filters before sending to React

### Build Sequence (LOCKED)
- **Stage 1 (Weeks 1-4)**: Foundation — Sheets + GAS doGet() + first CRUD + PO/GRN flow + basic RBAC
- **Stage 2 (Weeks 5-8)**: Core Polish — FK engine + auto-codes + 3-layer cache + notifications + save/print/export
- **Stage 3 (Weeks 9-12)**: Notion Features — View Switcher + Status Workflow + Saved Views + Drag & Drop + Templates + Linked DB + Rollups + Comments
- **Stage 3C (Weeks 12-14)**: Admin Configurators — Self-service UI for adding linked views, rollups, workflows, templates, automation rules
- **Exception**: `<CollapsibleSection>` built in Stage 1 (trivial React, essential UX for 21-column PO forms)

The Excel file is a DESIGN DOCUMENT only. No live formulas, no GAS, no connections.
Editing Excel freely (add/move/delete columns) affects nothing in any live system.

**Sequence:** Edit Excel → Upload to Claude → Claude reads all changes → Confirms out loud → Updates reference .md → Excel saved as new version → Phase 1 GAS build uses final Excel as spec.

To add a new FK in Excel:
- Method A: Add row to MASTER_RELATIONS with all columns filled
- Method B: Name FK column with → prefix — Claude infers relation
- Method C: Tell Claude in chat — Claude adds to MASTER_RELATIONS

---

## 20C. CONFIG MANAGEMENT — DUAL-PATH ARCHITECTURE ★ NEW V7

### Core Principle: Three Ways to Configure

Every config sheet (STATUS_WORKFLOW, ROLLUP_CONFIG, EMBEDDED_VIEWS, AUTOMATION_RULES, TEMPLATES) supports **three configuration paths**. All three write to the same sheets — the system doesn't care how a row got there.

```
PATH 1: Manual (Sheet)     → Admin opens Google Sheet → types row directly
PATH 2: Claude-Assisted    → Saurav tells Claude what to add → Claude writes .xlsx
PATH 3: Admin UI (ERP)     → Admin clicks "+ Add" in ERP → modal form → GAS writes row
```

### Path 1 — Manual Sheet Editing (Always Available)
- Open `CC_ERP_Masters_V8.xlsx` (or live Google Sheet)
- Navigate to config sheet (e.g. EMBEDDED_VIEWS)
- Add row following R2 header format + R3 description guidance
- GAS reads on next module load — config takes effect immediately
- **Best for:** Initial setup, bulk config, development phase

### Path 2 — Claude-Assisted Configuration (Always Available)
- Tell Claude in chat: "Add a linked view on CUSTOMER_MASTER showing their Sales Orders"
- Claude reads EMBEDDED_VIEWS structure → generates row → writes to .xlsx
- Upload updated .xlsx to Google Drive → takes effect
- **Best for:** Complex configs, new module setup, when unsure of column names
- **Claude knows:** All sheet structures, valid FK columns, module names, status codes

### Path 3 — Admin UI Configurator (Phase 3C Build)
- Admin opens any record page in ERP → clicks "+ Add Linked View" / "+ Add Rollup" / "Edit Workflow"
- Visual modal with dropdowns — no sheet knowledge needed
- GAS validates + writes row to config sheet
- React refreshes → new config visible immediately
- **Best for:** Day-to-day changes by managers, self-service config

### Admin UI Configurator — Component Specifications

#### `<EmbeddedViewConfigurator>` — "+ Add Linked View" Modal
```
Trigger:     "+ Add Linked View" button on any record detail page
Permission:  Admin = any module, Manager = own module only
Fields:
  ┌──────────────────────────────────────────────────────┐
  │  Add Linked View                               [✕]  │
  │                                                      │
  │  Show data from:  [ PO_MASTER          ▼ ]          │
  │  Where:           [ → Supplier Code    ▼ ]  (auto)  │
  │  Display columns: [☑ PO Code ☑ Date ☑ Amount  ...]  │
  │  Sort by:         [ PO Date            ▼ ]          │
  │  Sort direction:  [ DESC               ▼ ]          │
  │  Max rows:        [ 5                  ▼ ]          │
  │  Default state:   ( ) Expanded  (•) Collapsed       │
  │                                                      │
  │              [ Cancel ]  [ Save View ]               │
  └──────────────────────────────────────────────────────┘

Smart behaviour:
  - "Show data from" dropdown lists all sheets across all files
  - "Where" auto-populates FK columns that link back to current record's sheet
  - "Display columns" reads R2 headers from selected source sheet
  - Validation: FK column must exist in source sheet, max 6 display columns
GAS call:    google.script.run.saveEmbeddedView(config)
```

#### `<RollupConfigurator>` — "+ Add Rollup" Modal
```
Trigger:     "+ Add Rollup" button on record detail page (next to rollup cards)
Permission:  Admin = any, Manager = own module
Fields:
  ┌──────────────────────────────────────────────────────┐
  │  Add Rollup Card                               [✕]  │
  │                                                      │
  │  Data from:       [ PO_MASTER          ▼ ]          │
  │  Link column:     [ → Supplier Code    ▼ ]  (auto)  │
  │  Aggregate:       [ ∑ Grand Total      ▼ ]          │
  │  Function:        [ SUM                ▼ ]          │
  │  Display label:   [ Total PO Value         ]        │
  │  Format:          [ ₹##,###            ▼ ]          │
  │                                                      │
  │              [ Cancel ]  [ Save Rollup ]             │
  └──────────────────────────────────────────────────────┘

Smart behaviour:
  - "Link column" auto-detects FK columns pointing to current record's sheet
  - "Aggregate" dropdown lists all numeric/date columns from source
  - "Function" = COUNT / SUM / AVG / MIN / MAX / LAST
  - Preview shows sample value before saving
GAS call:    google.script.run.saveRollupConfig(config)
```

#### `<WorkflowEditor>` — "Edit Workflow" Panel
```
Trigger:     "⚙ Edit Workflow" in module settings (Admin only)
Permission:  Admin only
UI:          Visual flow editor — status nodes with drag-to-connect arrows
  ┌──────────────────────────────────────────────────────┐
  │  Workflow: Procurement-PO                      [✕]  │
  │                                                      │
  │  [DRAFT] ──→ [PENDING] ──→ [APPROVED] ──→ [CLOSED] │
  │                  │              │                     │
  │                  └→ [CANCELLED] ←┘                   │
  │                                 │                     │
  │              [PARTIAL] ──→ [RECEIVED] ──→ [CLOSED]  │
  │                                                      │
  │  + Add Status    Edit selected    Delete selected    │
  │                                                      │
  │  Selected: APPROVED                                  │
  │  Color:        [#0078D4  ◼]                         │
  │  Stage Group:  [ In Progress    ▼ ]                 │
  │  Required Role:[ Manager+       ▼ ]                 │
  │  Auto Actions: [ notify_supplier ☑ ] [+ Add]        │
  │                                                      │
  │              [ Cancel ]  [ Save Workflow ]            │
  └──────────────────────────────────────────────────────┘

Smart behaviour:
  - Drag arrows between nodes to set Allowed Next transitions
  - Color picker for each status badge
  - Stage Group enforced: Not Started → In Progress → Complete
  - Cannot delete status if active records use it
GAS call:    google.script.run.saveWorkflowConfig(module, statuses)
```

#### `<TemplateEditor>` — "Manage Templates" Panel
```
Trigger:     "📋 Manage Templates" in module header dropdown
Permission:  Admin = any, Manager = own module
UI:          List of existing templates + "Create New" form
  ┌──────────────────────────────────────────────────────┐
  │  Templates: Procurement-PO                     [✕]  │
  │                                                      │
  │  🧵 Fabric PO — Domestic          [Edit] [Delete]  │
  │  🌏 Fabric PO — Import            [Edit] [Delete]  │
  │  🏷️ Trim PO — Thread/Label        [Edit] [Delete]  │
  │  ...                                                 │
  │                                                      │
  │  ──── Create New Template ────                       │
  │  Name:        [ Yarn PO — Domestic        ]         │
  │  Description: [ Standard yarn purchase... ]          │
  │  Icon:        [ 🧶 ]  (emoji picker)                │
  │  Pre-fill:                                           │
  │    PO Type:        [ Fabric     ▼ ]                 │
  │    Currency:       [ INR        ▼ ]                 │
  │    Payment Terms:  [ 30 Days    ▼ ]                 │
  │                                                      │
  │              [ Cancel ]  [ Save Template ]           │
  └──────────────────────────────────────────────────────┘

Smart behaviour:
  - Pre-fill fields auto-populated from target sheet's column headers
  - Dropdown values pulled from existing data validation / FK lookups
  - "Copy from existing PO" template auto-generates _action JSON
GAS call:    google.script.run.saveTemplate(module, templateData)
```

#### `<AutomationRuleBuilder>` — "Manage Automations" Panel
```
Trigger:     "⚡ Automations" in module settings (Admin only)
Permission:  Admin only
UI:          List of rules + visual builder
  ┌──────────────────────────────────────────────────────┐
  │  Automations: Procurement-PO                   [✕]  │
  │                                                      │
  │  ✅ Notify on PO Approval         [Edit] [Toggle]  │
  │  ✅ Auto-update PO on GRN         [Edit] [Toggle]  │
  │  ⬜ Email supplier on approval     [Edit] [Toggle]  │
  │                                                      │
  │  ──── Create New Rule ────                           │
  │  Name:    [ Alert on high-value PO       ]          │
  │  When:    [ Status changes  ▼ ] to [ APPROVED ▼ ]  │
  │  AND:     [ ∑ Grand Total   ▼ ] [ > ] [ 100000 ]   │
  │  Then:    [ Send notification ▼ ]                   │
  │    To:    [ role:Admin       ▼ ]                    │
  │    Title: [ High-value PO approved       ]          │
  │                                                      │
  │              [ Cancel ]  [ Save Rule ]               │
  └──────────────────────────────────────────────────────┘

GAS call:    google.script.run.saveAutomationRule(module, ruleData)
```

### Configurator GAS Functions (Module 14 Extension)

```
// Embedded View CRUD
saveEmbeddedView(config)           → validates FK exists + columns valid → auto-generates EMB-xxx ID
                                      → appends row to EMBEDDED_VIEWS → invalidates cache → returns viewId
updateEmbeddedView(viewId, config) → updates existing row by View ID → re-validates → cache clear
deleteEmbeddedView(viewId)         → sets Active=No (soft delete) → cache clear
getAvailableSheets()               → returns [{sheetName, fileLabel, columns[]}] for dropdown population
getAvailableFKColumns(parentSheet, childSheet) → scans MASTER_RELATIONS + child R2 headers
                                      → returns columns that link child → parent

// Rollup Config CRUD
saveRollupConfig(config)           → validates source sheet + FK + agg column → auto-generates RUP-xxx ID
                                      → appends to ROLLUP_CONFIG → cache clear → returns rollupId
updateRollupConfig(rollupId, config) → updates existing → re-validates
deleteRollupConfig(rollupId)       → Active=No → cache clear
getAggregableColumns(sheet)        → returns numeric + date columns from sheet for function dropdown

// Workflow Config CRUD
saveWorkflowConfig(module, statuses[]) → validates transitions + stage groups → writes/updates STATUS_WORKFLOW
                                          → checks no active records use deleted statuses → cache clear
addWorkflowStatus(module, statusConfig) → single status add to existing workflow
deleteWorkflowStatus(module, statusCode) → checks no records in this status → Active=No

// Template CRUD
saveTemplate(module, templateData)  → validates pre-fill JSON keys match target sheet columns
                                      → auto-generates TPL-xxx → appends to TEMPLATES → cache clear
updateTemplate(templateId, data)    → updates existing
deleteTemplate(templateId)          → Active=No → cache clear
getTemplatePreFillOptions(module)   → returns target sheet columns + their dropdowns/validation values

// Automation Rule CRUD
saveAutomationRule(module, ruleData) → validates trigger type + condition JSON + actions JSON
                                       → auto-generates AUT-xxx → appends to AUTOMATION_RULES
updateAutomationRule(ruleId, data)  → updates existing
toggleAutomationRule(ruleId)        → flips Active Yes↔No
```

### Permission Matrix for Configurators

| Config Sheet | Admin | Manager | Supervisor | Operator |
|---|---|---|---|---|
| EMBEDDED_VIEWS | ✅ CRUD any module | ✅ Add/Edit own module | ❌ | ❌ |
| ROLLUP_CONFIG | ✅ CRUD any module | ✅ Add/Edit own module | ❌ | ❌ |
| STATUS_WORKFLOW | ✅ CRUD any module | 👁 View only | ❌ | ❌ |
| TEMPLATES | ✅ CRUD any module | ✅ Add/Edit own module | ❌ | ❌ |
| AUTOMATION_RULES | ✅ CRUD any module | 👁 View only | ❌ | ❌ |
| RECORD_COMMENTS | ✅ Delete any | ✅ Own comments | ✅ Own comments | ✅ Own comments |

### Claude-Assisted Configuration — How It Works

When Saurav tells Claude to add a config (e.g., "Add a linked view on CUSTOMER_MASTER showing their invoices"):

1. Claude reads current EMBEDDED_VIEWS sheet from the .xlsx
2. Claude determines next EMB-xxx ID
3. Claude identifies correct FK column and display columns
4. Claude adds row to .xlsx with proper formatting
5. Claude outputs updated .xlsx for upload to Google Drive
6. On next app load, React reads the new config → view appears

**Claude can also:**
- Add/modify status workflows for new modules
- Create rollup definitions with proper aggregation logic
- Design template pre-fill JSONs matching exact column names
- Write automation rules with valid trigger/condition/action patterns
- Bulk-configure all 5 config sheets for an entire new module in one pass

---

## 20D. IN-APP HELP SYSTEM ★ NEW V7

### Core Principle: Claude-Maintained Living Documentation
- `HELP_CONTENT` sheet in FILE 1A stores all instruction pages as Markdown
- React `<HelpPanel>` renders them in a slide-in panel with search
- **Claude updates help pages whenever architecture changes** — every new module, config change, or feature addition triggers help page updates
- Users see contextual help relevant to their current page + role

### HELP_CONTENT — Column Structure (14 cols)
```
🔑 Help ID | ⚠ Category | ⚠ Section | Title | Content (Markdown) | Target Audience | Related Module | Related Config Sheet | Sort Order | Icon | Tags | Last Updated By | Last Updated | Active
```

### Categories
| Category | Purpose |
|---|---|
| **Getting Started** | Welcome, navigation, shortcuts, status workflow overview |
| **Module Setup** | How each module works — PO, GRN, Work Order, QC, etc. |
| **Config Guide** | How to configure linked views, rollups, workflows, templates, automations |
| **Troubleshooting** | Common issues: stale data, permissions, errors |
| **FAQ** | Frequently asked questions |
| **Release Notes** | What changed in each version |

### Pre-Populated Help Pages (13 pages)
| ID | Category | Title |
|---|---|---|
| HLP-001 | Getting Started | Welcome to CC ERP |
| HLP-002 | Getting Started | Keyboard Shortcuts |
| HLP-003 | Getting Started | Understanding Status Badges |
| HLP-004 | Module Setup | Purchase Order — How It Works |
| HLP-005 | Module Setup | Goods Receipt Note — How It Works |
| HLP-006 | Config Guide | How to Add a Linked Database View |
| HLP-007 | Config Guide | How to Add a Rollup Summary Card |
| HLP-008 | Config Guide | How to Edit Status Workflows |
| HLP-009 | Config Guide | How to Create Record Templates |
| HLP-010 | Config Guide | How to Set Up Automations |
| HLP-011 | Config Guide | How to Set Up a New Module (Checklist) |
| HLP-012 | Troubleshooting | Data Not Showing / Stale Data |
| HLP-013 | Troubleshooting | Permission Denied / Cannot See Button |

### React Components

**`<HelpButton>`** — "?" icon in top shell bar (always visible)
- Click → opens `<HelpPanel>` slide-in from right (420px, same as Settings panel)
- Badge shows "New" if help pages updated since last visit

**`<HelpPanel>`** — Right slide-in panel
```
┌──────────────────────────────────┐
│  📖 Help & Instructions    [✕]  │
│                                  │
│  🔍 [ Search help...        ]   │
│                                  │
│  ▼ Getting Started               │
│    👋 Welcome to CC ERP          │
│    ⌨️ Keyboard Shortcuts          │
│    🏷️ Understanding Status Badges │
│                                  │
│  ▼ Module Setup                  │
│    📋 Purchase Order             │
│    📥 Goods Receipt Note         │
│                                  │
│  ▶ Config Guide (5 pages)        │
│  ▶ Troubleshooting (2 pages)     │
│                                  │
│  ─────────────────────────       │
│  💡 Context: Procurement > PO    │
│  Showing help for current page   │
└──────────────────────────────────┘
```

**`<HelpPage>`** — Renders Markdown content with:
- Proper heading hierarchy (##, ###)
- Tables (Markdown tables → HTML tables)
- Code blocks (for JSON, config examples)
- Bold/italic/links
- Numbered and bullet lists

### Smart Behaviours

1. **Contextual help:** Panel auto-highlights pages related to current module. If user is on PO_MASTER, "Purchase Order — How It Works" shows at top under "💡 Relevant to this page"

2. **Role filtering:** Pages with `Target Audience = Admin` are hidden from Operators. Each user only sees pages for their role level and below.

3. **Search:** Fuzzy search across Title + Tags + Content. Instant results as you type.

4. **Module-specific "?" icons:** Each module header can show a small "?" that directly opens the relevant help page (no need to search).

5. **Claude auto-updates:** Whenever Claude builds a new module or changes config, Claude also updates/adds help pages in HELP_CONTENT sheet. This is part of the session protocol.

### GAS Functions (Module 14 Extension)

```
getHelpContent(role, module)        → reads HELP_CONTENT filtered by Active=Yes + role audience
                                      → returns [{id, category, section, title, content, icon}]
                                      → cached Layer 1 (6hr) — help pages rarely change

getContextualHelp(role, module)     → same as above but filtered by Related Module
                                      → returns subset relevant to current page

searchHelp(query, role)             → full-text search across Title + Tags + Content
                                      → returns matched pages with highlighted snippets
```

### Claude's Session Protocol Update (LOCKED)

**Rule: When Claude creates or modifies any module, config sheet, or feature, Claude MUST also update HELP_CONTENT with relevant instruction pages.**

Specifically:
- New module → add "Module Setup" pages explaining how it works
- New config sheet → add "Config Guide" page explaining 3 configuration paths
- Architecture change → update affected "Getting Started" or "Troubleshooting" pages
- New feature → add relevant help page
- Version release → add "Release Notes" page

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
`getUIBootstrap(email)` → single GAS call on app load → returns merged object: `{ perms, onlineUsers, draftData, userPrefs, notifications }` → minimises round-trips on startup

### Module 12 — Notification Engine ★ NEW V6

**Sheet:** `NOTIFICATIONS` in FILE 1B (Sheet 22 after PRESENCE). 19 columns. NTF-00001 auto-code.

**GAS Functions:**

`createNotification(payload)` → validates payload → auto-generates NTF-XXXXX code → appends row to NOTIFICATIONS sheet → broadcasts to targeted users via cache key `NOTIFS_[email]` → clears their unread count cache.

`getNotifications(email, role)` → reads NOTIFICATIONS sheet → filters rows where `For User` = email OR blank AND `For Role` = role OR "All" → returns array sorted by Timestamp DESC → caches result in CacheService (5-min TTL per user).

`markNotificationRead(notifId, email)` → appends email to `Read By` column (comma-sep) → updates `Status` to "read" if all targets have read → clears NOTIFS_[email] cache.

`actionNotification(notifId, email, action, replyText)` → validates action is in `Actions Available` column → writes `Actioned By`, `Action Taken`, `Reply Text`, `Action Timestamp` → sets `Status` to "actioned" → triggers downstream: approve=calls approval handler, reject=calls rejection handler, reply=logs reply → invalidates NOTIFS_[email] cache for all parties.

`buildNotifURL(module, recordCode)` → builds Google Sheets deep link to exact record row:
```js
function buildNotifURL(module, recordCode) {
  const FILE_MAP = {
    Procurement: "SPREADSHEET_ID_FILE2",
    Production:  "SPREADSHEET_ID_FILE4",
    Inventory:   "SPREADSHEET_ID_FILE3",
    Quality:     "SPREADSHEET_ID_FILE5",
    Finance:     "SPREADSHEET_ID_FILE7",
    Sales:       "SPREADSHEET_ID_FILE6",
  };
  const SHEET_MAP = {
    "PO":"PO_MASTER","GRN":"GRN_MASTER","WO":"WORK_ORDERS",
    "QC":"QC_MASTER","INV":"INVOICES","STK":"STOCK_LEDGER",
  };
  const prefix = recordCode.split("-")[0];
  const fileId  = FILE_MAP[module];
  const sheetName = SHEET_MAP[prefix] || "MASTER";
  // Find exact row for record
  const ss    = SpreadsheetApp.openById(fileId);
  const sheet = ss.getSheetByName(sheetName);
  const codes = sheet.getRange("A:A").getValues().flat();
  const row   = codes.indexOf(recordCode) + 1;   // 1-based
  const gid   = sheet.getSheetId();
  return `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=${gid}&range=A${row}`;
}
```
Returns URL that opens the exact Google Sheet, tabs to correct sheet, highlights the record row. Called on client as `window.open(url, "_blank")`.

`getUnreadCount(email)` → fast CacheService-only check for notification badge count → returns integer → used by heartbeat poll (30s) to update bell badge without full notification fetch.

**Notification types and triggers:**
| Type | Trigger | For Role |
|---|---|---|
| action | PO/Invoice submitted for approval | Admin or Finance Manager |
| action | Work Order marked complete (needs QC) | Quality Supervisor |
| warning | Stock below reorder level (Module 7 trigger) | Purchase Manager |
| warning | QC lot failed | Production Manager |
| info | Any record submitted/updated | Module Manager |
| system | Cache refresh, GAS errors, user added | Admin only |

**Role routing matrix** (stored in ROLE_MASTER as JSON, read by `createNotification`):
| Role | Receives |
|---|---|
| Admin | All types in all modules |
| Manager | action + warning in their module; info from their team |
| Supervisor | warning + info in their module |
| Operator | info for their own submissions only |
| View Only | None (no notifications sent) |

**Client polling:** same 30s `setInterval` as presence heartbeat → calls `getUnreadCount` → updates bell badge → if count changed, fetches full notifications list.

**NOTIFICATIONS sheet columns (19 total):**
`# Notif ID | Timestamp | Type | Priority | Title | Detail | Module | Record Ref | Record URL | For Role | For User | Created By | Actions Available | Read By | Actioned By | Action Taken | Reply Text | Action Timestamp | Status`

**Retention:** daily 2 AM trigger archives rows >30 days to NOTIFICATIONS_ARCHIVE sheet.

---

### Module 13 — Quick Access & User Preferences ★ NEW V6

**Storage:** `PropertiesService.getUserProperties()` per user — no sheet needed, zero latency.

**GAS Functions:**

`getUserShortcuts(email)` → reads `SHORTCUTS` key from user properties → parses JSON array → returns `[{id, icon, label, mod, sub}]` → called in `getUIBootstrap` bundle.

`saveUserShortcuts(email, shortcuts)` → serialises shortcuts array to JSON → writes to user `SHORTCUTS` property → max 30 shortcuts enforced → returns success/count.

`getUserPrefs(email)` → reads `UI_PREFS` key → returns settings object `{mode, accent, fontSize, density, tblStyle, lineView, sbWidth, showStatusBar, showThumbs, showRowNums, showCatBadge, compactSide, uiFont, dataFont}`.

`saveUserPrefs(email, prefs)` → writes `UI_PREFS` to user properties → called on Settings "Apply & Close" → auto-called 2s after any quick-change (theme/accent toggle) with debounce.

`getUserCmdHistory(email)` → reads `CMD_HISTORY` key → returns last 10 Ctrl+K selections → used to personalise Recent Records group in palette.

`logCmdSelection(email, item)` → prepends item to CMD_HISTORY → trims to 10 → saves → async, non-blocking.

**Shortcut data format:**
```js
{
  id:    "sc1",             // client-generated timestamp ID
  icon:  "📦",             // emoji from ICON_MASTER
  label: "New PO",         // display name
  mod:   "procurement",    // module ID for navigation
  sub:   "Quick Actions",  // group label (shown below label in sidebar)
  url:   "procurement/new" // optional deep link within module
}
```

**Ctrl+K command palette search index** is built client-side from:
1. Static MODS array (all 8 modules) — always present
2. Static quick actions (New PO/WO/GRN/QC etc.) — always present
3. User's CMD_HISTORY (recent records) — loaded from `getUIBootstrap`
4. Settings shortcuts — always present
Future V2: GAS search across live record codes for real-time record lookup
`saveUserPreferences(email, prefs)` → saves theme/accent/density/tableStyle settings to PropertiesService under `PREFS_[email]`
`getUserPreferences(email)` → returns saved UI preferences → used to restore theme + layout on next login
`saveDraft(module, sessionId, formData)` → saves dirty form data to PropertiesService under `DRAFT_[MODULE]_[userId]`
`restoreDraft(module, userId)` → returns saved draft if exists → client shows restore banner
`clearDraft(module, userId)` → called after successful save or explicit discard

### Module 14 — Status Workflow Engine ★ NEW V7

**Sheet:** `STATUS_WORKFLOW` in FILE 1A (Sheet 23 after MASTER_RELATIONS). 11 columns. STS-001 auto-code.

**Columns:** 🔑 Status ID | ⚠ Module | ⚠ Status Code | Status Name | Stage Group | Color Hex | → Allowed Next | Required Role | Auto Actions | # Sort Order | Active

**Pre-populated:** 48 status rows across 8 modules (Procurement-PO, Procurement-GRN, Production-WO, Production-JC, Inventory-ADJ, Inventory-TRF, Quality-QC, Jobwork-DC, Sales-SO).

**Stage Groups (3):** Not Started → In Progress → Complete. Used by Kanban to auto-generate columns.

**GAS Functions:**

`getWorkflowConfig(module)` → reads STATUS_WORKFLOW filtered by Module + Active=Yes → returns ordered array `[{code, name, stageGroup, color, allowedNext[], requiredRole}]` → cached Layer 1 (6-hour TTL per module).

`validateStatusTransition(recordRef, currentStatus, newStatus, userRole)` → reads STATUS_WORKFLOW → checks: (1) newStatus is in allowedNext of currentStatus, (2) userRole meets requiredRole → returns `{allowed, reason}`. Called server-side before any status change write.

`updateRecordStatus(module, recordRef, newStatus, userEmail)` → validates transition → writes new status → executes Auto Actions JSON → creates ITEM_CHANGE_LOG entry → triggers createNotification for relevant parties → returns success.

**Auto Actions format:** JSON array of action strings. Executed server-side on status change.
- `"notify:role:Manager:message"` → createNotification to role
- `"notify:supplier:{supplier_code}:message"` → external notification
- `"auto:update_po_received_qty:{po_code}"` → trigger GAS function
- `"lock:record"` → set record as read-only
- `"log:audit:description"` → ITEM_CHANGE_LOG entry

**React integration:** `<StatusBadge>` renders color pill. `<StatusTransitionDropdown>` shows only allowed next statuses based on current user role. Kanban columns auto-generated from Stage Groups.

### Module 15 — Notion Data Features ★ NEW V7

Groups: Rollups, Embedded Views, Templates, Comments, Saved Views, Favorites.

#### 15A — Rollup Properties

**Sheet:** `ROLLUP_CONFIG` in FILE 1A (Sheet 24). 10 columns. RUP-001 auto-code.

**Columns:** 🔑 Rollup ID | ⚠ Target Module | ⚠ Source Module | → FK Column | Aggregate Function | Aggregate Column | Display Label | Format | # Sort Order | Active

**Pre-populated:** 24 rollup definitions across SUPPLIER_MASTER, PO_MASTER, ARTICLE_MASTER, RM_MASTER_FABRIC, MACHINE_MASTER, CUSTOMER_MASTER, WAREHOUSE_MASTER.

**GAS Functions:**

`getRollups(recordRef, targetModule)` → reads ROLLUP_CONFIG filtered by Target Module + Active=Yes → for each rollup: reads Source Module filtered by FK Column = recordRef → computes aggregate (COUNT/SUM/MAX/MIN/AVG/LATEST) → returns `[{label, value, format}]` → cached Layer 1 (5-min TTL per record).

**Aggregate Functions:**
| Function | Behaviour |
|---|---|
| COUNT | Count matching rows |
| SUM | Sum values in Aggregate Column |
| AVG | Average of Aggregate Column |
| MIN | Minimum of Aggregate Column |
| MAX | Maximum of Aggregate Column |
| LATEST | Most recent value by date column |

**React:** `<RollupSummaryCards>` renders 4-6 metric cards at top of record detail view. Lazy-loaded (Tier 3).

#### 15B — Embedded (Linked Database) Views

**Sheet:** `EMBEDDED_VIEWS` in FILE 1A (Sheet 25). 10 columns. EMB-001 auto-code.

**Columns:** 🔑 View ID | ⚠ Parent Module | ⚠ Child Module | → FK Column | Display Columns | Max Rows | Sort Column | Sort Dir | View Title | Active

**Pre-populated:** 16 embedded view definitions linking Suppliers↔POs↔GRNs, Articles↔Rates, Machines↔Maintenance, etc.

**GAS Functions:**

`getEmbeddedViews(parentModule)` → reads EMBEDDED_VIEWS filtered by Parent Module + Active=Yes → returns view configs.

`getFilteredRecords(childModule, fkColumn, filterValue, displayColumns, maxRows, sortColumn, sortDir)` → reads child module data → filters by FK → selects display columns → sorts → limits to maxRows → returns compact data array. Lazy-loaded on first section expand.

**React:** `<LinkedDatabaseView>` component — collapsible section (▼/▶), compact read-only table. Row click → navigates to that record's full page (hover + pointer cursor). "View All →" link → full module with filter pre-applied. Skeleton loader while data loads.

🔒 **LOCKED:** Linked DB Views are STRICT VIEW-ONLY. No inline editing. No action buttons. No drag-and-drop within linked views.

#### 15C — Record Templates

**Sheet:** `TEMPLATES` in EVERY transaction file (FILE 2-8). 8 columns. TPL-001 auto-code.

**Columns:** 🔑 Template ID | ⚠ Module | Template Name | Description | Pre-fill JSON | Created By | # Sort Order | Active

**FILE 2 Pre-populated:** 10 templates (7 PO: Fabric Domestic, Fabric Import, Trim, Consumables, Packaging, Repeat, Rush + 3 GRN: Standard, Returnable, Non-PO).

**GAS Functions:**

`getTemplates(module)` → reads TEMPLATES filtered by Module + Active=Yes → returns `[{id, name, description, prefillJSON}]` → cached Layer 2.

`saveTemplate(module, templateData, userEmail)` → validates JSON → auto-generates TPL code → appends row → clears template cache.

**Pre-fill JSON format:**
```json
{
  "PO Type": "Domestic",
  "Payment Terms": "Net 30",
  "Currency": "INR",
  "_action": "copy_from_previous"  // special: opens record picker
}
```

**React:** `<TemplatePickerModal>` shows on [+ New Record] click → card grid with name + description → selecting a template pre-fills form fields → user edits and saves normally.

#### 15D — Record Comments + @Mentions

**Sheet:** `RECORD_COMMENTS` in EVERY transaction file (FILE 2-8). 10 columns. CMT-00001 auto-code.

**Columns:** 🔑 Comment ID | ⚠ Record Ref | ⚠ Module | Author Email | ← Author Name | Timestamp | Comment Text | Mentions | Status | Parent CMT ID

**GAS Functions:**

`getComments(recordRef, module)` → reads RECORD_COMMENTS filtered by Record Ref + Module + Status=Active → resolves Author Name from USER_MASTER → returns threaded array (parent + replies grouped).

`addComment(recordRef, module, text, mentions[], userEmail)` → auto-generates CMT code → appends row → for each mention: createNotification with link to record → returns new comment.

`deleteComment(commentId, userEmail)` → sets Status = Deleted (soft delete) → only original author or Admin can delete.

**@Mention format:** User types `@` in comment textarea → dropdown of active users (from cached USER_MASTER) → selecting inserts `@email` into text → on save, `mentions[]` array populated → notifications sent.

**React:** `<CommentsPanel>` collapsible section at bottom of record form. `<CommentThread>` for threaded display. `<CommentInput>` with @mention autocomplete. Lazy-loaded (Tier 3).

#### 15E — Saved Filter Views

**Storage:** PropertiesService per user — `SAVED_VIEWS_[module]` key.

**No config sheet needed** — purely client-side + PropertiesService.

**GAS Functions:**

`getUserSavedViews(email, module)` → reads `SAVED_VIEWS_[module]` from user properties → returns `[{id, name, filters[], groupBy, subGroupBy, sortBy, viewMode}]`.

`saveUserView(email, module, viewData)` → validates max 10 views per module → serialises to JSON → saves to user properties.

`deleteUserView(email, module, viewId)` → removes view from saved array → saves.

**Filter chain format:**
```json
{
  "name": "My Pending POs",
  "filters": [
    {"field": "Status", "op": "=", "value": "PENDING"},
    {"field": "→ Supplier Code", "op": "=", "value": "SUP-003"}
  ],
  "groupBy": "Status",
  "subGroupBy": null,
  "sortBy": "PO Date",
  "viewMode": "table"
}
```

**React:** `<SavedViewsTabs>` renders as tab bar above data table. Clicking a tab applies filter+sort+group combo instantly (client-side filtering, no GAS call).

#### 15F — Favorites & Recent

**Storage:** PropertiesService per user — `FAVORITES`, `RECENT_RECORDS`, `FREQUENT_RECORDS` keys.

**GAS Functions:**

`toggleFavorite(email, recordRef, module)` → adds/removes from FAVORITES array → max 50 items.

`logRecordAccess(email, recordRef, module)` → prepends to RECENT_RECORDS (max 20) → increments access count in FREQUENT_RECORDS (top 5 computed).

`getQuickAccessData(email)` → returns `{ starred: [], recent: [], frequent: [] }` → called in getUIBootstrap.

**React:** Sidebar `<QuickAccessPanel>` with three sub-sections: ⭐ Starred, 🕐 Recent, 🔥 Frequent. Star icon (☆/★) on every record header for one-click add/remove.

### Module 16 — Automation Engine ★ NEW V7 (Stage 3 Execution)

**Sheet:** `AUTOMATION_RULES` in FILE 1B (Sheet 23 after NOTIFICATIONS). 9 columns. AUT-001 auto-code.

**Columns:** 🔑 Rule ID | ⚠ Module | Rule Name | ⚠ Trigger Type | Trigger Condition | Actions | Description | Created By | Active

**Pre-populated:** 8 rules (5 active). Covers PO approval notifications, GRN→PO auto-update, QC triggers, overdue alerts.

**Trigger Types:**
| Type | When |
|---|---|
| STATUS_CHANGE | Record status changes to specified value |
| FIELD_UPDATE | Specific field value changes |
| RECORD_CREATE | New record created in module |
| SCHEDULED | Daily/weekly cron trigger |

**GAS Functions (Stage 3 — not built in Stage 1):**

`getAutomationRules(module)` → reads AUTOMATION_RULES filtered by Module + Active=Yes → returns rule configs.

`evaluateAutomation(module, triggerType, eventData)` → called after every write operation → matches against rules → executes matched actions → logs results.

`executeAutomationActions(rule, eventData)` → parses Actions JSON → dispatches each action (notify, auto-update, lock, log).

**Note:** Automation execution is Stage 3 feature. Sheet structure exists now so rules can be defined and tested later. Module 14 (Status Workflow) handles status-specific auto-actions in the interim.

---

## 22. IMPLEMENTATION SEQUENCE

```
Phase 0  — Masters Design ✅ COMPLETE (V7)
           56 master sheets locked. 7 procurement sheets designed.
           66 trim rows populated.
           ITEM_SUPPLIER_RATES live with 15 sample rows.
           MASTER_RELATIONS 46 relations + 8 FILE 2 relations confirmed.
           USER_MASTER + ROLE_MASTER + PRESENCE + NOTIFICATIONS sheets added.
           Notion config sheets added: STATUS_WORKFLOW (41 rows), ROLLUP_CONFIG (17),
           EMBEDDED_VIEWS (13), AUTOMATION_RULES (8), TEMPLATES (11), RECORD_COMMENTS.

Phase 1  — Google Sheets Setup + GAS Core (2 weeks)
  Step 1.1  — GAS creates all 3 master files + all sheet structures
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
  Step 1.19 — Notification engine: createNotification + getNotifications + actionNotification (Module 12)
  Step 1.20 — buildNotifURL: deep-link to record row in any file (Module 12)
  Step 1.21 — Quick Access + User Prefs: getUserShortcuts/saveUserShortcuts/getUserPrefs/saveUserPrefs (Module 13)
  Step 1.22 — Ctrl+K palette search index wired to CMD_HISTORY (Module 13)
  Step 1.23 — Status Workflow Engine: getWorkflowConfig + validateStatusTransition + updateRecordStatus (Module 14)
  Step 1.24 — Rollup Properties: getRollups + aggregate computation + caching (Module 15A)
  Step 1.25 — Embedded Views: getEmbeddedViews + getFilteredRecords (Module 15B)
  Step 1.26 — Record Templates: getTemplates + saveTemplate (Module 15C)
  Step 1.27 — Record Comments: getComments + addComment + deleteComment + @mention notifications (Module 15D)
  Step 1.28 — Saved Filter Views: getUserSavedViews + saveUserView + deleteUserView (Module 15E)
  Step 1.29 — Favorites & Recent: toggleFavorite + logRecordAccess + getQuickAccessData (Module 15F)
  Step 1.23 — Status Workflow reader: getWorkflowConfig + validateStatusTransition (Module 14) ★ NEW V7
  Step 1.24 — Templates reader: getTemplates (Module 15) ★ NEW V7
  Step 1.25 — Comments engine: getComments + addComment (Module 15) ★ NEW V7

Phase 1B — UI Build (React/GAS Web App) — parallel to Phase 1
  Step 1B.1  — Base layout: Shell bar + Command Panel + Main area (UI_SPEC §4)
  Step 1B.2  — Theme system: 6 modes + 6 accents + Settings panel (UI_SPEC §3, §11)
  Step 1B.3  — ICON_MASTER + IconPicker component (UI_SPEC §24)
  Step 1B.4  — PermContext + can()/sees()/canExp()/canSee() helpers (UI_SPEC §35I)
  Step 1B.5  — Avatar strip + presence polling (UI_SPEC §34)
  Step 1B.6  — Users & Roles Admin Panel (UI_SPEC §35H)
  Step 1B.7  — Table controls: Sort + Filter + Group + Sub-group (UI_SPEC §25)
  Step 1B.8  — Save Preview Modal + Unsaved Changes Guard (UI_SPEC §27, §29)
  Step 1B.9  — Print Preview overlay + Export dropdown (UI_SPEC §28, §30)
  Step 1B.10 — Suspended user lock screen (UI_SPEC §35J)
  Step 1B.11 — Notification bell + panel: bell badge, dropdown, Approve/Reject/Reply/Open Record (UI_SPEC §36)
  Step 1B.12 — Quick Access sidebar section: pinned shortcuts, edit mode, remove (UI_SPEC §37)
  Step 1B.13 — Ctrl+K command palette: search, groups, keyboard nav, pin to shortcuts (UI_SPEC §38)
  Step 1B.14 — ViewSwitcher: Table + Kanban views per module (Notion)
  Step 1B.15 — StatusBadge + StatusTransitionDropdown: color pill + allowed transitions (Module 14)
  Step 1B.16 — CollapsibleSection: form sections with expand/collapse (Module 15)
  Step 1B.17 — RollupSummaryCards: aggregate metric cards on record detail (Module 15A)
  Step 1B.18 — LinkedDatabaseView: compact read-only tables with row click → navigate (Module 15B)
  Step 1B.19 — TemplatePickerModal: card grid on [+ New Record] (Module 15C)
  Step 1B.20 — CommentsPanel + CommentThread + @mention autocomplete (Module 15D)
  Step 1B.21 — SavedViewsTabs: tab bar with filter/sort/group combos (Module 15E)
  Step 1B.22 — StarButton + QuickAccessPanel: ⭐🕐🔥 sidebar sections (Module 15F)

Phase 2  — Data Entry (1–2 weeks)
  Fill FILE 1C first (Finance) → FILE 1B (Factory, including USER_MASTER
  with real emails + ROLE_MASTER defaults) → FILE 1A (Items)
  Reason: child masters before parent masters

Phase 3  — Transaction Modules (4–8 weeks)
  FILE 2: Procurement (PO, GRN) → FILE 3: Inventory
  → FILE 4: Production → FILE 5: Quality
  → FILE 6: Sales → FILE 7: Finance → FILE 8: Dashboard
  Each file MUST include TEMPLATES + RECORD_COMMENTS sheets.

Phase 3B — Notion Features (Weeks 9–12, after procurement works end-to-end) ★ NEW V7
  Step 3B.1  — View Switcher: Table + Kanban (reads STATUS_WORKFLOW Stage Groups)
  Step 3B.2  — Saved Filter Views: <SavedViewsTabs> + getUserSavedViews/saveUserView
  Step 3B.3  — Drag & Drop: Kanban status change + line item reorder (@dnd-kit)
  Step 3B.4  — Linked Database Views: <LinkedDatabaseView> reading EMBEDDED_VIEWS
  Step 3B.5  — Rollup Summary Cards: <RollupSummaryCards> reading ROLLUP_CONFIG
  Step 3B.6  — Comments Panel: <CommentsPanel> with @mention → notification
  Step 3B.7  — Favorites Panel: ⭐ Starred + 🕐 Recent + 🔥 Frequent
  Step 3B.8  — Automation Rules Engine: GAS executes server-side on triggers

Phase 3C — Admin Configurators (Weeks 12–14, self-service config UI) ★ NEW V7
  Step 3C.1  — Configurator GAS: saveEmbeddedView + updateEmbeddedView + deleteEmbeddedView
  Step 3C.2  — Configurator GAS: saveRollupConfig + getAggregableColumns
  Step 3C.3  — Configurator GAS: saveWorkflowConfig + addWorkflowStatus + deleteWorkflowStatus
  Step 3C.4  — Configurator GAS: saveTemplate + getTemplatePreFillOptions
  Step 3C.5  — Configurator GAS: saveAutomationRule + toggleAutomationRule
  Step 3C.6  — Helper GAS: getAvailableSheets + getAvailableFKColumns (powers all modals)
  Step 3C.7  — React: <EmbeddedViewConfigurator> modal — dropdown-based linked view setup
  Step 3C.8  — React: <RollupConfigurator> modal — aggregate card setup
  Step 3C.9  — React: <WorkflowEditor> panel — visual status flow editor (Admin only)
  Step 3C.10 — React: <TemplateEditor> panel — template list + create/edit form
  Step 3C.11 — React: <AutomationRuleBuilder> panel — trigger/condition/action builder (Admin only)
  Step 3C.12 — RBAC integration: permission checks for all configurator actions

Phase 4  — Reporting Dashboard (IMPORTRANGE + GAS summaries)

Phase 5  — WhatsApp/Email Notifications (optional)
```

---

## 23. CURRENT STATUS — V7 SNAPSHOT

### ✅ LOCKED — Do not re-open
- All master sheet structures (56 sheets across 3 files — Notion config + HELP_CONTENT added V7)
- All 46 FK relations in MASTER_RELATIONS (+ 8 in MASTER_RELATIONS_F2)
- All coding systems and GAS 16-module architecture
- Attribute system for TRIM, CONSUMABLE, PACKAGING
- ITEM_SUPPLIER_RATES full specification (21 cols, Option C hybrid)
- TRIM_MASTER: 66 rows × 10 category groups populated with reference data
- TRIM_ATTR_NAMES: 10 categories, simplified V4 attr sets
- TRIM_ATTR_VALUES: 175 clean values, Color(REF NAME) excluded
- UI Design System: CC_ERP_UI_SPEC_V6.md (NetSuite V5 standard, Light+Orange default)
- RBAC: 5 roles, 4 permission dimensions, USER_MASTER + ROLE_MASTER specs
- Presence: dual-layer PropertiesService + PRESENCE sheet (FILE 1B Sheet 21)
- Export: PDF + Google Sheets + Excel + Clipboard on every module
- Notion Foundation: STATUS_WORKFLOW (41 rows), ROLLUP_CONFIG (17 rows), EMBEDDED_VIEWS (13 rows), AUTOMATION_RULES (8 rows)
- Procurement: FILE 2 V2 — PO_MASTER, PO_LINE_ITEMS, GRN_MASTER, GRN_LINE_ITEMS, MASTER_RELATIONS_F2, TEMPLATES (11 rows), RECORD_COMMENTS
- React = REAL frontend. GAS = backend API only. MD V7 governs architecture.

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
**Phase 0 — Masters Design COMPLETE. V7 updates: 5 Notion config sheets + HELP_CONTENT added to masters (56 total). FILE 2 Procurement V2 with TEMPLATES + RECORD_COMMENTS (7 sheets). React confirmed as production frontend. Dual-path configuration: Manual + Claude-assisted (now) + Admin UI configurators (Phase 3C). All config-driven Notion features baked into foundation.** Ready for Phase 1 GAS + Phase 1B UI builds after data entry.

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
| **V6** | **Feb 2026** | **Notification System: Module 12, NOTIFICATIONS sheet (FILE 1B Sheet 22, 19 cols, NTF-XXXXX auto-code). GAS functions: createNotification, getNotifications, actionNotification, buildNotifURL (deep-link to exact record row). Quick Access + User Prefs: Module 13, getUserShortcuts/saveUserShortcuts/getUserPrefs/saveUserPrefs/getUserCmdHistory/logCmdSelection via PropertiesService. Ctrl+K Command Palette: static search index, keyboard navigation, pin-to-sidebar. UI: NotifPanel (Approve/Reject/Reply/Open Record), CmdPalette, Quick Access sidebar section. Phase 1B steps 11-13 added. 52 sheets. 13 GAS modules. 4 reference files (added CC_ERP_Main.jsx prototype).** | **UI Design System locked: CC_ERP_UI_SPEC_V5.md (NetSuite V5, Light+Orange, full spec 35 sections). RBAC: 5 roles, 4 permission dimensions, Module 5 upgraded to full permission engine. USER_MASTER V5 spec (15 cols). ROLE_MASTER new sheet. Presence system: Module 10, PRESENCE sheet (FILE 1B Sheet 21). Export engine: Module 9 (PDF+Sheets+Excel+Clipboard). UI Render Engine: Module 11 (bootstrap, prefs, draft). Phase 1B UI build steps added. 49 sheets. 11 GAS modules. 3 reference files.** |
| **V7** | **Feb 2026** | **Notion Foundation Architecture: 6 new config sheets. FILE 1A: STATUS_WORKFLOW (41, WF-001), ROLLUP_CONFIG (17, RUP-001), EMBEDDED_VIEWS (13, EMB-001). FILE 1B: AUTOMATION_RULES (8, AUT-001). FILE 2: TEMPLATES (11, TPL-001), RECORD_COMMENTS (CMT-00001). GAS Modules 14-16. Dual-path config: Manual sheet + Claude-assisted + Admin UI configurators (Phase 3C). Configurator components: EmbeddedViewConfigurator, RollupConfigurator, WorkflowEditor, TemplateEditor, AutomationRuleBuilder. Locked: React=REAL frontend, Linked DB=strict view-only, 3-layer views, tiered lazy loading, mandatory TEMPLATES+RECORD_COMMENTS in every file. 56 master + 7 procurement sheets. 16 GAS modules.** |

---

## 26. RULES FOR CLAUDE IN NEW SESSIONS

1. **Read ALL files first** — CC_ERP_BUILD_REFERENCE_V7.md + CC_ERP_UI_SPEC_V6.md + CC_ERP_Masters_V8.xlsx (+ CC_ERP_FILE2_Procurement_V2.xlsx for procurement work) — before doing any work or writing any code
2. **Confirm understanding in 3 lines max** — do not recite the entire architecture back
3. **Never rebuild what is locked** — if TRIM_MASTER, MASTER_RELATIONS, or any V4/V5/V7 structure already exists in the Excel, do not overwrite without an explicit instruction
4. **Changes are incremental** — always load the existing Excel, make targeted changes, save. Never start from blank.
5. **Flag conflicts before acting** — if something contradicts either reference doc, point it out and ask before proceeding
6. **Always release FOUR files together** — after any significant session: CC_ERP_BUILD_REFERENCE_V7.md + CC_ERP_UI_SPEC_V6.md + CC_ERP_Masters_V8.xlsx + CC_ERP_Main.jsx (prototype)
7. **Data rows are sacred** — never delete Saurav's entered data rows when rebuilding a sheet. Clear only if explicitly told to.
8. **ITEM_SUPPLIER_RATES is in FILE 1B (Sheet 20)** — Cross-file lookup. Always treat Supplier Code as cross-file FK to FILE-1C.
9. **Color(REF NAME) has no rows in TRIM_ATTR_VALUES** — intentional. GAS reads COLOR_MASTER directly. Never add Color(REF NAME) values to any ATTR_VALUES sheet.
10. **PRESENCE sheet is in FILE 1B (Sheet 21). NOTIFICATIONS sheet is in FILE 1B (Sheet 22). AUTOMATION_RULES is in FILE 1B (Sheet 23)** — NOT FILE 1C. This overrides any conflicting reference.
11. **UI spec governs all frontend** — any UI question, component, layout, colour, or behaviour → check CC_ERP_UI_SPEC_V6.md first. Never deviate without "Override UI [component]" from Saurav.
12. **RBAC check is mandatory in every GAS action** — every function that writes data must call `checkPermission(email, action, module)` at top. No exceptions.
13. **Hidden ≠ disabled** — restricted UI elements are removed from DOM entirely. Never render a greyed-out or disabled button for permission-blocked actions. Exception: Submit button during form validation.
14. **Hidden fields = `🔒 ——`** — restricted financial/sensitive fields render as lock icon + em dash. Never an empty input.
15. **Sheet count is 56 + 7** — FILE 1A (27) + FILE 1B (23) + FILE 1C (6) = 56 master sheets. FILE 2 (7) procurement sheets. Masters file: CC_ERP_Masters_V8.xlsx. Procurement file: CC_ERP_FILE2_Procurement_V2.xlsx.
16. **Notification actions require server-side validation** — `actionNotification()` must re-check `Actions Available` column before writing any action. Never trust client-side action list alone.
17. **buildNotifURL always returns exact row** — URL must include `&range=A[row]`. Never link to sheet root. If row not found, return sheet URL + show toast "Record not found — may have been moved."
18. **User preferences are per-user via getUserProperties** — never store UI prefs in a shared sheet. Each user's `UI_PREFS`, `SHORTCUTS`, `CMD_HISTORY`, `SAVED_VIEWS_*`, `FAVORITES`, `RECENT_RECORDS` are private PropertiesService keys.
19. **Ctrl+K palette does not query live sheets in V1** — search index is static (modules + actions + cmd history). Live record search is V2 feature.
20. **Quick Access max 30 items** — enforced by `saveUserShortcuts`. UI shows warning if user tries to exceed.
21. **Every new transaction file MUST include TEMPLATES + RECORD_COMMENTS sheets** — this is a mandatory checklist item when building FILE 3-8. Column structure mirrors FILE 2 pattern.
22. **Notion config sheets are module-agnostic** — STATUS_WORKFLOW, ROLLUP_CONFIG, EMBEDDED_VIEWS, AUTOMATION_RULES serve ALL modules. To add support for a new module: add rows to config sheets. No code changes needed.
23. **Status transitions must be validated server-side** — `validateStatusTransition()` is called inside `updateRecordStatus()`. React dropdown shows allowed options, but GAS re-validates before writing. Never trust client-only status changes.
24. **Linked DB Views are STRICT VIEW-ONLY** — no inline edit, no action buttons, no drag-drop. Row click navigates. "View All →" goes to filtered module. Collapsible with lazy loading.
25. **Saved Filter Views max 10 per user per module** — enforced by `saveUserView()`. Stored in PropertiesService, not shared sheets.
26. **React = REAL frontend, GAS = backend API only** — all UI rendered by React served via doGet(). GAS only provides data via google.script.run. MD V7 governs architecture.
27. **Claude must update HELP_CONTENT when changing architecture** — new module → add Module Setup pages. New config → add Config Guide page. Architecture change → update affected help pages. This is mandatory, not optional.

