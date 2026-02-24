# CONFIDENCE CLOTHING ERP — PRODUCTION ROADMAP
## From Excel Design → Production-Ready Google Apps Script ERP

**Date:** Feb 2026  
**For:** Saurav Aggarwal  
**Status:** Phase 0 ✅ Complete → Phase 1 NEXT

---

## WHAT YOU HAVE RIGHT NOW (Assets Inventory)

| # | Asset | Status | Purpose |
|---|-------|--------|---------|
| 1 | `CC_ERP_Masters_V7.xlsx` (51 sheets) | ✅ Complete | All master data structures — items, factory, finance |
| 2 | `CC_ERP_FILE2_Procurement_V1.xlsx` (5 sheets) | ✅ Complete | PO + GRN structures with 8 FK relations (REL-047→054) |
| 3 | `CC_ERP_Main.jsx` (2039 lines) | ✅ Complete | Full React UI prototype — shell, sidebar, themes, procurement module |
| 4 | `CC_ERP_NetSuite_V2.jsx` (1103 lines) | ✅ Complete | PO/GRN form + line items table with live calculations |
| 5 | `CC_ERP_BUILD_REFERENCE_V6.md` | ✅ Complete | Architecture bible — 13 modules, 52 sheets, all locked decisions |
| 6 | `CC_ERP_UI_SPEC_V6.md` | ✅ Complete | Pixel-level UI specification — 35+ sections |
| 7 | `CC_ERP_GAS_Custom_Instructions.docx` | ✅ Complete | GAS coding rules — icons, FK engine, cache, modules |

**Bottom line:** Your DESIGN is 100% done. What's missing is the actual RUNNING CODE on Google Sheets.

---

## THE GAP: WHAT "PRODUCTION READY" REQUIRES

Your React `.jsx` files are **prototypes** — they run in a browser sandbox with fake data. Production ERP needs:

1. **Real Google Sheets** — 52+ sheets with proper formatting, validation, dropdowns
2. **Real GAS Backend** — 13 modules of server-side code that reads/writes sheets
3. **Real Web App UI** — Your React design converted to GAS `HtmlService` (HTML/CSS/JS)
4. **Real Data Flow** — UI → `google.script.run` → GAS function → Sheet → Cache → UI
5. **Real Users** — RBAC, login, presence, notifications working with actual Google accounts

---

## PRODUCTION BUILD — 7 STAGES (Recommended Order)

### ══════════════════════════════════════════════
### STAGE 1: CREATE GOOGLE SHEETS BACKEND (Week 1-2)
### ══════════════════════════════════════════════

**Goal:** All 52 master sheets exist in 3 Google Sheet files with correct structure.

**What to build:**

```
1.1  Create 3 Google Sheet files:
     • CC ERP Masters (Items)    → FILE 1A (23 sheets)
     • CC ERP Masters (Factory)  → FILE 1B (23 sheets including PRESENCE + NOTIFICATIONS)
     • CC ERP Masters (Finance)  → FILE 1C (6 sheets)

1.2  For EACH sheet, GAS must create:
     • Row 1: Banner (dark bg, white text, full-width merged)
     • Row 2: Column headers (red #CC0000 bg, white bold)
     • Row 3: Field descriptions (light blue bg, italic)
     • Freeze at A4
     • Tab colors per file type
     • Column widths sized to content

1.3  Add data validations (dropdowns):
     • All Status fields → dropdown lists
     • All Yes/No fields → checkbox or dropdown
     • All Category fields → restricted dropdown
     • All UOM fields → KG/MTR/PCS/CONE etc.
     • Date fields → date format DD-MMM-YYYY

1.4  Create FILE 2: Procurement (1 new Google Sheet)
     • PO_MASTER (21 cols)
     • PO_LINE_ITEMS (20 cols)
     • GRN_MASTER (17 cols)
     • GRN_LINE_ITEMS (19 cols)
     • MASTER_RELATIONS_F2 (8 relations)
```

**GAS Code to Write:**

```javascript
// setupSheets.gs — Run ONCE to create all sheet structures
function setupAllFiles() {
  setupFile1A();  // Items — 23 sheets
  setupFile1B();  // Factory — 23 sheets
  setupFile1C();  // Finance — 6 sheets
  setupFile2();   // Procurement — 5 sheets
}

function setupSheet(ss, sheetName, banner, headers, descriptions, tabColor) {
  // Creates one sheet with standard R1/R2/R3 structure
  // Sets formatting, freeze, column widths, tab color
}
```

**How to approach this with Claude:**
> "Create GAS code for setupFile1A() that creates all 23 item master sheets in FILE 1A with banner/header/description rows per GAS Custom Instructions. Use the Excel column headers from CC_ERP_Masters_V7.xlsx."

---

### ══════════════════════════════════════════════
### STAGE 2: CORE GAS MODULES 1-4 (Week 2-3)
### ══════════════════════════════════════════════

**Goal:** Auto-codes, FK engine, attribute sync, and change log working.

**Build in this exact order (each depends on the previous):**

```
MODULE 1 — Code Generation
├── generateItemCode(sheetName, category)
├── generateProcurementCode(type) → PO-YYYY-NNNN / POL-NNNNN / GRN-YYYY-NNNN / GRL-NNNNN
├── validateCodeFormat(code, sheetName)
└── Lock # cells after write

MODULE 2 — FK Relationship Engine
├── getFKDropdown(parentSheet, parentColumn)     → reads MASTER_RELATIONS
├── autoDisplayFKName(code, sheet, nameCol)       → fills ← display columns
├── createNewFKRecord(referencedSheet, formData)  → inline creation
├── resolveCrossFileFKName(code, fileLabel)        → Layer 2 cache lookup
└── resolvePolyFK(itemCode, itemMasterCol)         → routes to correct master (REL-049/054)

MODULE 3 — Attribute System (4 Directions)
├── autoFillAttrNames(sheet, row, category)
├── getAttrValueDropdown(category, attrName)  → Color(REF NAME) bypass
├── syncNewAttrName(sheet, category, newName)
└── syncNewAttrValue(category, attrName, newValue)

MODULE 4 — Change Log
├── writeChangeLog(action, sheet, itemCode, field, oldVal, newVal, userEmail)
└── onEdit trigger → auto-capture all changes
```

**How to approach this with Claude:**
> "Write Module 1 (Code Generation) for CC ERP GAS. It must handle all master codes (RM-FAB-xxx, TRM-THD-xxx etc.) plus procurement codes (PO-YYYY-NNNN, POL-NNNNN, GRN-YYYY-NNNN, GRL-NNNNN). Follow the GAS Custom Instructions exactly."

Then ask for Module 2, 3, 4 one at a time. Each module = one session.

---

### ══════════════════════════════════════════════
### STAGE 3: CACHE SYSTEM + ACCESS CONTROL (Week 3-4)
### ══════════════════════════════════════════════

**Goal:** Performance optimization and user security.

```
CACHE — 3 Layers (MUST be built before any UI)
├── Layer 1: CacheService (session, 6hr)
│   └── onOpen() → loadAllMastersToCache() → all FK dropdowns < 0.5s
├── Layer 2: PropertiesService (cross-file, daily 7am refresh)
│   └── SUPPLIER_MASTER from FILE 1C → cached in FILE 1B/2
│   └── All cross-file FK lookups use this layer
└── Layer 3: Smart Invalidation
    └── onEdit() → clears ONLY the edited master's cache key

MODULE 5 — RBAC Access Control
├── checkPermission(email, action, module)  → called in EVERY write function
├── getUserPermissions(email)               → reads USER_MASTER + ROLE_MASTER
├── onOpen() → hide sheets by role, lock ranges, show role-relevant menus
└── 5 roles: SUPER ADMIN / ADMIN / PURCHASE MGR / PRODUCTION MGR / STORE KEEPER / ACCOUNTS / VIEW ONLY

MODULE 6 — Color Swatch
└── applyColorSwatch() → sets cell bg to hex value from COLOR_MASTER

MODULE 7 — Reorder Alert
└── Scheduled trigger 8am daily → check stock < reorder level → email Purchase Mgr

MODULE 8 — ISR PO Sidebar
├── getItemSuppliers(itemCode) → filtered + ranked by Priority
├── selectSupplierForPO(itemCode) → sidebar panel, pre-selects Primary
└── updateLastPOData(rateCode, poDate, poPrice) → auto on PO confirm
```

---

### ══════════════════════════════════════════════
### STAGE 4: WEB APP UI (Week 4-6) ← BIGGEST PIECE
### ══════════════════════════════════════════════

**Goal:** Convert React prototype to production GAS Web App.

**Critical Understanding:** Your `.jsx` files run in React. GAS Web Apps use `HtmlService` which serves plain HTML/CSS/JS. You have two approaches:

```
OPTION A: Pure HTML/CSS/JS (Simpler, recommended for V1)
─────────────────────────────────────────────────────────
• Convert React components to vanilla JS with DOM manipulation
• Single index.html + CSS + JS served via HtmlService.createHtmlOutputFromFile()
• All google.script.run calls work natively
• Faster to debug, no build step needed
• Limitation: More verbose code, no JSX

OPTION B: React via CLASP + Build Pipeline (Advanced)
────────────────────────────────────────────────────────
• Use clasp (Google's CLI) + webpack/vite to bundle React
• npm run build → outputs single HTML file with inline JS
• Push to GAS via clasp push
• Full React ecosystem (hooks, state, components)
• Requirement: Node.js + clasp setup + build pipeline
• Better for long-term maintainability
```

**RECOMMENDATION: Start with Option A for the Procurement module.** Get it working, then decide if you want React for remaining modules.

**Web App Structure (GAS):**

```
Code.gs (or Main.gs)
├── doGet(e) → returns HtmlService.createHtmlOutputFromFile('index')
├── All server-side functions (Modules 1-13)
└── google.script.run.withSuccessHandler().serverFunction()

index.html
├── Full UI shell (sidebar, header, content area, status bar)
├── Theme system (6 modes × 6 accents)
├── Module views (Procurement PO/GRN list + form)
└── All JS logic using google.script.run for data

appsscript.json
└── webapp: { executeAs: "USER_ACCESSING", access: "DOMAIN" }
```

**Build the UI in this order:**

```
4.1  Shell + Routing
     • Header bar with breadcrumbs, user avatar, notification bell
     • Sidebar with module navigation (Procurement, Masters, etc.)
     • Main content area with module switching
     • Status bar at bottom

4.2  Theme Engine
     • 6 colour modes (Light, Black, Light Grey, Midnight, Warm, Slate)
     • 6 accent colours (Oracle Orange, Azure Blue, Deep Teal, etc.)
     • Settings panel for font + density + table style
     • Save/restore via getUserPrefs / saveUserPrefs

4.3  Procurement PO — List View
     • Table showing all POs (fetched from PO_MASTER sheet)
     • Sort / filter / search
     • Status badges (Draft, Sent, Acknowledged, etc.)
     • "New PO" button → opens form view

4.4  Procurement PO — Form View (THE CORE)
     • Header: PO Number (auto), Date, Supplier (FK dropdown)
     • Details: PO Type, Season, Currency, Payment Terms
     • Line Items Table:
       - Item search (poly-FK → routes to FABRIC/TRIM/YARN etc.)
       - UOM, HSN, GST% auto-fill from item master
       - Qty, Unit Price, Discount% → Line Total auto-calc
       - Add/remove rows
     • Footer: ∑ Base Value, ∑ GST, ∑ Grand Total (all auto)
     • Actions: Save Draft, Submit for Approval, Print, Export

4.5  Procurement GRN — List + Form
     • Similar to PO but with: Vehicle No, DC Number, Gate Pass
     • GRN Line Items: Received/Accepted/Rejected qty, Batch/Lot, Rolls
     • Links back to PO for reference data

4.6  Save Preview Modal
     • Shows all data before writing to sheet
     • Confirmation required before save
     • google.script.run.savePO(poData) → writes to PO_MASTER + PO_LINE_ITEMS

4.7  Print Preview
     • Formatted PO/GRN document view
     • Export to PDF / Google Sheet / Excel
```

**How to approach this with Claude:**
> "Convert the Procurement PO form from CC_ERP_Main.jsx into a GAS HtmlService web app. Create index.html with the shell layout, theme system, and PO form. Use google.script.run to connect to backend GAS functions. Follow CC_ERP_UI_SPEC_V6.md for all styling."

---

### ══════════════════════════════════════════════
### STAGE 5: PROCUREMENT BUSINESS LOGIC (Week 6-7)
### ══════════════════════════════════════════════

**Goal:** Full PO → GRN → Stock flow working end-to-end.

```
5.1  PO Creation Flow:
     User fills form → Save Draft → Submit for Approval
     → Notification to Approver → Approve/Reject
     → Status: Draft → Sent → Acknowledged

5.2  PO Line Item Logic:
     Select Item → poly-FK resolves master → auto-fill UOM/HSN/GST
     Enter Qty + Price → auto-calc Line Value / GST / Total
     ∑ rollup to PO_MASTER totals (∑ Base, ∑ GST, ∑ Grand Total)

5.3  GRN Creation Flow:
     Select PO → auto-fill Supplier from PO_MASTER
     Enter Vehicle/DC/Gate Pass → Add line items
     Received Qty vs PO Qty → auto-calc Pending
     Accepted + Rejected = Received (validation)

5.4  PO ↔ GRN Status Sync:
     GRN submitted → PO_MASTER "GRN Status" updates automatically
     All PO lines fully received → PO Status = "Fully Received"
     Partial receipt → "Partially Received"

5.5  Image Links:
     PO: Physical PO scan → Google Drive link stored
     PO Lines: Item images from masters (auto-pulled)
     GRN: Gate Inward Challan image + timestamp
```

---

### ══════════════════════════════════════════════
### STAGE 6: SUPPORTING MODULES (Week 7-8)
### ══════════════════════════════════════════════

```
MODULE 9  — Export Engine
           PDF / Google Sheet / Excel export for PO and GRN

MODULE 10 — Presence System
           Heartbeat every 30s → shows online users → PRESENCE sheet

MODULE 11 — UI Bootstrap
           Single getUIBootstrap() call on app load → returns everything

MODULE 12 — Notification Engine
           PO submitted → notification to approver
           GRN QC fail → notification to production mgr

MODULE 13 — Quick Access + User Prefs
           Ctrl+K command palette
           Pinned shortcuts in sidebar
           Theme preferences saved per user
```

---

### ══════════════════════════════════════════════
### STAGE 7: DATA ENTRY + GO LIVE (Week 8-10)
### ══════════════════════════════════════════════

```
7.1  Enter master data (in this order):
     FILE 1C first: SUPPLIER_MASTER, PAYMENT_TERMS, BANK, GST
     FILE 1B next:  USER_MASTER (real emails), MACHINE, CONTRACTOR
     FILE 1A last:  RM_MASTER_FABRIC, TRIM_MASTER, ARTICLE_MASTER

7.2  Enter ITEM_SUPPLIER_RATES:
     All fabric suppliers with prices
     All trim suppliers (Coats, YKK, etc.)
     Set Primary/Secondary/Backup priorities

7.3  Test with real PO:
     Create actual PO for next fabric order
     Get GRN when goods arrive
     Verify all auto-calcs, FK lookups, status updates

7.4  Onboard team:
     Add users to USER_MASTER with correct roles
     Train: Purchase Mgr on PO/GRN, Store Keeper on GRN
     Share web app URL with team

7.5  Go live:
     Switch from test to production
     Monitor for 1 week with manual backup
```

---

## PRACTICAL SESSION PLAN (How to ask Claude)

Each Claude session should tackle ONE focused piece. Here's your exact sequence:

```
SESSION 1:  "Create setupFile1A.gs — generates all 23 item master sheets
             with proper banner/headers/descriptions from the Excel file"

SESSION 2:  "Create setupFile1B.gs + setupFile1C.gs + setupFile2.gs"

SESSION 3:  "Build Module 1 — Code Generation for all masters + procurement"

SESSION 4:  "Build Module 2 — FK Relationship Engine reading MASTER_RELATIONS"

SESSION 5:  "Build Module 3 — Attribute System with 4-direction sync"

SESSION 6:  "Build Module 4 — Change Log + onEdit trigger"

SESSION 7:  "Build Cache System — 3 layers + onOpen loader"

SESSION 8:  "Build Module 5 — RBAC + access control"

SESSION 9:  "Convert Procurement PO List view to GAS HtmlService web app"

SESSION 10: "Build PO Form view with line items, auto-calcs, FK dropdowns"

SESSION 11: "Build GRN List + Form views"

SESSION 12: "Wire Save/Submit flow — PO_MASTER + PO_LINE_ITEMS write"

SESSION 13: "Build GRN → PO status sync + QC flow"

SESSION 14: "Build Notification system for PO approval workflow"

SESSION 15: "Build Export engine — PDF/Sheets/Excel for PO/GRN"

SESSION 16: "Final integration — test end-to-end PO → GRN flow"
```

---

## GAS PROJECT FILE STRUCTURE (Final)

```
CC_ERP_Procurement/
│
├── Code.gs                    ← Web App entry point (doGet)
├── Config.gs                  ← File IDs, sheet names, constants
│
├── Module01_CodeGen.gs        ← generateItemCode, generateProcurementCode
├── Module02_FKEngine.gs       ← getFKDropdown, autoDisplayFKName, resolvePolyFK
├── Module03_AttrSync.gs       ← 4-direction attribute sync
├── Module04_ChangeLog.gs      ← writeChangeLog, onEdit trigger
├── Module05_RBAC.gs           ← checkPermission, getUserPermissions
├── Module06_ColorSwatch.gs    ← applyColorSwatch
├── Module07_ReorderAlert.gs   ← scheduled reorder check
├── Module08_ISR.gs            ← getItemSuppliers, selectSupplierForPO
├── Module09_Export.gs         ← exportToGoogleSheet, exportToExcel, exportToPDF
├── Module10_Presence.gs       ← heartbeat, logPresenceAction
├── Module11_UIBootstrap.gs    ← getUIBootstrap (single call returns everything)
├── Module12_Notifications.gs  ← createNotification, actionNotification
├── Module13_QuickAccess.gs    ← shortcuts, user prefs, cmd history
│
├── Cache.gs                   ← 3-layer cache system
├── Setup.gs                   ← setupAllFiles (run once)
├── Triggers.gs                ← onOpen, onEdit, time-based triggers
│
├── index.html                 ← Main web app UI
├── styles.html                ← CSS (included via <?!= ?>)
├── scripts.html               ← Client-side JS (included via <?!= ?>)
│
└── appsscript.json            ← Manifest (webapp config, scopes)
```

---

## KEY GAS LIMITATIONS TO KNOW

| Limitation | Value | Impact on Your ERP |
|---|---|---|
| Execution time limit | 6 minutes per function | Break large operations into batches |
| Script properties | 500KB total | Store only cache keys, not full data |
| CacheService | 100KB per key, 25MB total | Cache master data in chunks |
| Triggers | 20 per project | Combine triggers where possible |
| URL Fetch | 100 calls/minute | Rate-limit cross-file lookups |
| HTML output | 50MB | Keep UI assets minimal |
| Concurrent users | 30 simultaneous | Fine for 5-10 team members |
| IMPORTRANGE | Requires one-time auth | Set up once per file pair |

---

## CRITICAL RULES (From your locked decisions — never violate)

1. **NO CC- prefix** in any code, ever
2. **Store code only in FK columns** — never copy data between sheets
3. **MASTER_RELATIONS drives all FKs** — no hardcoded FK logic in GAS
4. **Color(REF NAME) → loads COLOR_MASTER directly** — bypasses ATTR_VALUES
5. **ITEM_SUPPLIER_RATES is in FILE 1B** — Supplier Code is cross-file FK to FILE 1C
6. **Freeze at A4 always** — Rows 1-3 frozen, columns NEVER frozen
7. **RBAC check in EVERY write function** — `checkPermission()` at top, no exceptions
8. **Never delete data rows** — incremental changes only
9. **3-layer cache mandatory** — never query sheets live on every cell edit
10. **Header icons drive GAS behaviour** — → ← ⟷ ∑ ⚠ # 🔑

---

## READY TO START?

**Your first task should be Stage 1, Session 1:**

> "Claude — I am uploading CC_ERP_BUILD_REFERENCE_V6.md, CC_ERP_UI_SPEC_V6.md, CC_ERP_GAS_Custom_Instructions.docx, CC_ERP_Masters_V7.xlsx, and CC_ERP_FILE2_Procurement_V1.xlsx. Read all files. Create setupFile1A.gs — a GAS function that creates all 23 item master sheets in a Google Sheet with proper Row 1 banner, Row 2 red headers, Row 3 blue descriptions, freeze at A4, tab colors, and data validation dropdowns. Use the exact column headers from the Excel file."

This gives you the foundation everything else builds on. 🚀
