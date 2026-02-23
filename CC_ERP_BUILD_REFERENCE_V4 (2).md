# CONFIDENCE CLOTHING — ERP BUILD REFERENCE
## Upload this file at the start of every build session

**Version:** V4 — Masters Design Complete  
**Last Updated:** Feb 2026  
**Purpose:** Complete technical specification for Google Sheets + GAS ERP build. Claude reads this file at session start — no need to repeat any decision already made here.

---

## HOW TO START A NEW SESSION

**Paste this exactly:**

>.
 "Claude — I am uploading CC_ERP_BUILD_REFERENCE_V4.md. Read all sections. All decisions in Sections 14, 21, 25, 26, 27 are locked — do not re-open. Current Excel file: CC_ERP_Masters_V4.xlsx (48 sheets). Today's task: [YOUR TASK]"

**Also upload:** `CC_ERP_Masters_V4.xlsx` alongside this .md file.

Claude will: read both files → confirm phase → start immediately. No re-explaining needed
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
| FILE 1B | CC ERP Masters (Factory) | 19 sheets | Factory Manager / HR / Admin |
| FILE 1C | CC ERP Masters (Finance) | 6 sheets | Accounts team only |

**Current design file:** `CC_ERP_Masters_V4.xlsx` — 48 sheets total

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

### FILE 1B — FACTORY MASTER (19 sheets)
```
01. USER_MASTER
02. DEPARTMENT_MASTER
03. DESIGNATION_MASTER
04. SHIFT_MASTER
05. CUSTOMER_MASTER
06. CONTRACTOR_MASTER
07. WAREHOUSE_MASTER
08. STORAGE_BIN_MASTER
09. FACTORY_MASTER
10. MACHINE_MASTER
11. MACHINE_CATEGORY
12. ASSET_MASTER
13. MAINTENANCE_SCHEDULE
14. SPARE_PARTS_MASTER
15. PROCESS_MASTER
16. WORK_CENTER_MASTER
17. JOBWORK_PARTY_MASTER
18. SUPPLIER_MASTER         — FILE 1C sheet, referenced cross-file by FILE 1A/1B.
19. ITEM_SUPPLIER_RATES     ★ NEW V4. Junction table. One row per item+supplier.
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

## 4. ITEM CODING SYSTEM

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
Upload CC_ERP_BUILD_REFERENCE_V4.md + CC_ERP_Masters_V4.xlsx together.
Say: "Read this, pick up from here. Today's task: [task]"

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

### Module 5 — Access Control
`checkUserAccess(email, sheetName, actionType)` → reads USER_MASTER roles
`onOpen trigger` → hides inaccessible sheets, locks ranges, shows relevant menus

### Module 6 — Color Swatch
`applyColorSwatch()` → on COLOR_MASTER hex change → sets cell background to that hex

### Module 7 — Reorder Alert
Scheduled trigger 8am daily → checks Current Stock < Reorder Level → email/WhatsApp to Purchase Manager

### Module 8 — ITEM_SUPPLIER_RATES (NEW V4)
`getItemSuppliers(itemCode)` → reads ISR filtered by itemCode + Active=Yes → returns ranked supplier list
`selectSupplierForPO(itemCode)` → sidebar panel, Priority pre-selects Primary → user confirms or switches
`updateLastPOData(rateCode, poDate, poPrice)` → AUTO on PO confirmation → fills cols 18/19

---

## 22. IMPLEMENTATION SEQUENCE

```
Phase 0  — Masters Design ✅ CURRENT STATUS: V4 complete
           48 sheets locked. 66 trim rows populated.
           ITEM_SUPPLIER_RATES live with 15 sample rows.
           MASTER_RELATIONS 46 relations confirmed.

Phase 1  — Google Sheets Setup (1 week)
  Step 1.1  — GAS creates all 3 master files + sheet structure
  Step 1.2  — Dropdowns and data validation on all sheets
  Step 1.3  — Auto-code generators (Module 1)
  Step 1.4  — FK relationship engine via MASTER_RELATIONS (Module 2)
  Step 1.5  — Attribute two-way sync (Module 3)
  Step 1.6  — ITEM_CHANGE_LOG onEdit trigger (Module 4)
  Step 1.7  — Access control from USER_MASTER (Module 5)
  Step 1.8  — CacheService Layer 1 session cache
  Step 1.9  — PropertiesService Layer 2 cross-file cache
  Step 1.10 — Smart invalidation Layer 3
  Step 1.11 — COLOR_MASTER hex swatch auto-apply (Module 6)
  Step 1.12 — Reorder alert scheduled trigger (Module 7)
  Step 1.13 — ITEM_SUPPLIER_RATES PO sidebar (Module 8)

Phase 2  — Data Entry (1–2 weeks)
  Fill FILE 1C first (Finance) → FILE 1B (Factory) → FILE 1A (Items)
  Reason: child masters before parent masters

Phase 3  — Transaction Modules (4–8 weeks)
  FILE 2: Procurement (PO, GRN) → FILE 3: Inventory
  → FILE 4: Production → FILE 5: Quality
  → FILE 6: Sales → FILE 7: Finance → FILE 8: Dashboard

Phase 4  — Reporting Dashboard

Phase 5  — WhatsApp/Email Notifications (optional)
```

---

## 23. CURRENT STATUS — V4 SNAPSHOT

### ✅ LOCKED — Do not re-open
- All master sheet structures (48 sheets)
- All 46 FK relations in MASTER_RELATIONS
- All coding systems and GAS architecture
- Attribute system for TRIM, CONSUMABLE, PACKAGING
- ITEM_SUPPLIER_RATES full specification (21 cols, Option C hybrid)
- TRIM_MASTER: 66 rows × 10 category groups populated with reference data
- TRIM_ATTR_NAMES: 10 categories, simplified V4 attr sets
- TRIM_ATTR_VALUES: 175 clean values, Color(REF NAME) excluded (GAS loads COLOR_MASTER)

### 🔲 PENDING — Before Phase 1 GAS build starts
1. **USER_MASTER** — actual Google email addresses of Saurav's team to be filled
2. **FACTORY_MASTER** — actual address, GST number, PAN, bank details
3. **CONSUMABLE_MASTER + PACKAGING_MASTER** — review and confirm reference data rows (similar pattern to TRIM_MASTER)
4. **SUPPLIER_MASTER** — at least key suppliers entered (Coats, Madura, YKK, LBL suppliers, fabric mills)
5. **Machine list** — all 12 knitting machine specs in MACHINE_MASTER
6. **Contractor list** — all current JW parties with rates in CONTRACTOR_MASTER
7. **ITEM_SUPPLIER_RATES** — fill actual rates for all primary/secondary suppliers once suppliers entered

### 📋 CURRENT PHASE
**Phase 0 — Masters Design.** All structural decisions locked. Data entry in masters to complete before Phase 1 GAS build declared ready.

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
| V3.1 | Feb 2026 | ARTICLE, RM_FABRIC, RM_YARN rebuilt from Saurav edits. Article code no space. Sketch link popup. Markup/Markdown calc. YARN COMPOSITION multi-FK. FABRIC TYPE vs KNIT STRUCTURE separated. WEIGHT/CONES removed from Yarn. REL-042 + REL-043. 43 relations. |
| **V4** | **Feb 2026** | **TRIM_MASTER: IMAGE LINK + COLOUR CODE FK. Multi-supplier ITEM_SUPPLIER_RATES (21 cols, Option C hybrid, GST% + ∑Price incl GST). Color(REF NAME) → COLOR_MASTER. AGT removed. Attr sets simplified across all trim categories. 66 trim rows populated + category dividers. 48 sheets. 46 relations. REL-044/045/046.** |
| V5 | Pending | CONSUMABLE_MASTER + PACKAGING_MASTER review. Supplier data entry. Masters fully populated → Phase 1 GAS build. |

---

## 26. RULES FOR CLAUDE IN NEW SESSIONS

1. **Read both files first** — .md AND the Excel — before doing any work or writing any code
2. **Confirm understanding in 3 lines max** — do not recite the entire architecture back
3. **Never rebuild what is locked** — if TRIM_MASTER, MASTER_RELATIONS, or any V4 structure already exists in the Excel, do not overwrite it without an explicit instruction
4. **Changes are incremental** — always load the existing Excel, make targeted changes, save. Never start from blank.
5. **Flag conflicts before acting** — if something in the Excel contradicts the reference doc, point it out and ask before proceeding
6. **One .md + one .xlsx always released together** — after any significant session, present both updated files for download
7. **Data rows are sacred** — never delete Saurav's entered data rows when rebuilding a sheet. Clear only if explicitly told to.
8. **ITEM_SUPPLIER_RATES is in FILE 1B (Sheet 43)** — not FILE 1A. Cross-file lookup. Always treat Supplier Code as cross-file FK to FILE-1C.
9. **Color(REF NAME) does not have rows in TRIM_ATTR_VALUES** — this is intentional. GAS reads COLOR_MASTER directly for this attr. Do not add Color(REF NAME) values to TRIM_ATTR_VALUES.
10. **When asked to populate reference data** — use the CC_TRIM_REFERENCE_V4.xlsx as source of truth for trim data, not the uploaded V3.1 Excel (which only had 4 sheets and no trim data).

