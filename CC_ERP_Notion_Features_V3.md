# CC ERP — NOTION FEATURES SPECIFICATION V3

**Version:** V3.1 — Dual-Path Configuration Architecture  
**Date:** Feb 2026  
**Status:** Config sheets built + pre-populated. 3 configuration paths defined. Phase 3C configurator UI spec'd.

---

## ARCHITECTURE PRINCIPLE

**Add rows to config sheets → get features for free in any module.**

6 config sheets power all Notion-inspired features. When building Production (FILE 4) or Sales (FILE 6), features work automatically by adding config rows — zero new code.

```
Add rows to STATUS_WORKFLOW   → Kanban + Status badges + Transition validation
Add rows to ROLLUP_CONFIG     → Summary metric cards on record detail
Add rows to EMBEDDED_VIEWS    → Linked database tables inside record forms
Add rows to TEMPLATES         → Template picker on [+ New Record]
Add RECORD_COMMENTS sheet     → Comments + @Mentions
Add rows to AUTOMATION_RULES  → Event-driven automations
```

---

## THREE CONFIGURATION PATHS (LOCKED)

All 3 paths write to the **same config sheets**. The system doesn't care how a row got there.

### Path 1 — Manual Sheet Editing
- Open Google Sheet → navigate to config sheet → add row following R2/R3 format
- GAS reads on next module load → config takes effect immediately
- **Best for:** Initial setup, bulk config, development phase
- **Who:** Admin / Developer
- **Available:** From day one

### Path 2 — Claude-Assisted Configuration
- Tell Claude: "Add a linked view on CUSTOMER_MASTER showing their invoices"
- Claude reads current config → generates row → writes to .xlsx
- Upload updated file → takes effect on next load
- **Best for:** Complex configs, new module setup, when unsure of column names
- **Who:** Saurav / Admin (via Claude chat)
- **Available:** From day one

**Claude can:**
- Add/modify status workflows for new modules
- Create rollup definitions with proper aggregation logic
- Design template pre-fill JSONs matching exact column names
- Write automation rules with valid trigger/condition/action patterns
- Bulk-configure all 6 config sheets for an entire new module in one pass

### Path 3 — Admin UI Configurator (Phase 3C)
- Admin opens ERP → clicks "+ Add Linked View" / "+ Add Rollup" / "Edit Workflow"
- Visual modal with dropdowns — no sheet knowledge needed
- GAS validates + writes row → React refreshes → config visible immediately
- **Best for:** Day-to-day changes, self-service config by managers
- **Who:** Admin (all modules), Manager (own module)
- **Available:** Phase 3C (Weeks 12-14)

---

## FEATURE STATUS MATRIX

### Foundation (Config Sheets Built)

| # | Feature | Config Sheet | Rows | React Component | GAS Module |
|---|---|---|---|---|---|
| 1 | **Status Workflow Engine** | STATUS_WORKFLOW | 41 | StatusBadge + StatusTransitionDropdown | Module 14 |
| 2 | **Rollup Properties** | ROLLUP_CONFIG | 17 | RollupSummaryCards | Module 14 |
| 3 | **Linked Database Views** | EMBEDDED_VIEWS | 13 | LinkedDatabaseView | Module 14 |
| 4 | **Record Templates** | TEMPLATES | 11 | TemplatePickerModal | Module 15 |
| 5 | **Comments + @Mentions** | RECORD_COMMENTS | — | CommentsPanel | Module 15 |
| 6 | **Automation Rules** | AUTOMATION_RULES | 8 | AutomationRulesPanel | Module 16 |
| 7 | **Collapsible Sections** | None (React) | — | CollapsibleSection | — |
| 8 | **Saved Filter Views** | PropertiesService | — | SavedViewsTabs | Module 16 |
| 9 | **Favorites** | PropertiesService | — | QuickAccessPanel | Module 16 |

### Stage 3B — Visual Features (After Procurement Works)

| # | Feature | React Component | Libraries |
|---|---|---|---|
| 10 | **View Switcher** (Table + Kanban) | ViewSwitcher | — |
| 11 | **Drag & Drop** (Kanban + Line Items) | DraggableCard | @dnd-kit |
| 12 | **Calendar View** | CalendarView | react-big-calendar |
| 13 | **Slash Commands** | SlashCommandPopover | — |

### Stage 3C — Admin Configurator UI (Self-Service Config)

| # | Component | Configures | Permission |
|---|---|---|---|
| 14 | **EmbeddedViewConfigurator** | EMBEDDED_VIEWS — add/edit linked views | Admin any, Manager own |
| 15 | **RollupConfigurator** | ROLLUP_CONFIG — add/edit metric cards | Admin any, Manager own |
| 16 | **WorkflowEditor** | STATUS_WORKFLOW — visual flow editor | Admin only |
| 17 | **TemplateEditor** | TEMPLATES — create/edit pre-fills | Admin any, Manager own |
| 18 | **AutomationRuleBuilder** | AUTOMATION_RULES — trigger/action builder | Admin only |

---

## ADMIN CONFIGURATOR SPECIFICATIONS

### EmbeddedViewConfigurator — "+ Add Linked View" Modal

**Trigger:** "+ Add Linked View" button at bottom of linked views section on any record page

```
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
```

**Smart behaviour:**
- "Show data from" lists all sheets across all files (via getAvailableSheets)
- "Where" auto-populates FK columns linking back to current record's sheet
- "Display columns" reads R2 headers from selected source sheet
- Validation: FK must exist, max 6 display columns
- GAS: saveEmbeddedView → validates → auto-generates EMB-xxx → appends → cache clear

### RollupConfigurator — "+ Add Rollup" Modal

**Trigger:** "+ Add Rollup" button next to rollup summary cards on record page

```
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
```

**Smart behaviour:**
- "Link column" auto-detects FK columns pointing to current record's sheet
- "Aggregate" lists numeric + date columns from source (via getAggregableColumns)
- Function = COUNT / SUM / AVG / MIN / MAX / LAST
- Preview shows sample computed value before saving

### WorkflowEditor — "Edit Workflow" Panel (Admin Only)

**Trigger:** "⚙ Edit Workflow" in module settings

```
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
```

**Smart behaviour:**
- Drag arrows between nodes to set Allowed Next transitions
- Color picker for each status badge
- Stage Group enforced: Not Started → In Progress → Complete
- Cannot delete status if active records use it (GAS checks)

### TemplateEditor — "Manage Templates" Panel

**Trigger:** "📋 Manage Templates" in module header dropdown

- List existing templates with Edit/Delete buttons
- "Create New" form: Name, description, icon (emoji picker), pre-fill fields
- Pre-fill dropdowns auto-populated from target sheet columns + validation
- GAS: saveTemplate → validates JSON keys match sheet → auto-generates TPL-xxx

### AutomationRuleBuilder — "Manage Automations" (Admin Only)

**Trigger:** "⚡ Automations" in module settings

- List rules with Active toggle
- "Create New" builder: When [trigger] AND [condition] THEN [action]
- Triggers: STATUS_CHANGE / RECORD_CREATE / FIELD_UPDATE / SCHEDULE
- GAS: saveAutomationRule → validates → auto-generates AUT-xxx

---

## CONFIGURATOR GAS FUNCTIONS

```
// Config CRUD (all config sheets)
saveEmbeddedView(config)              → validate + auto-ID + append + cache clear
updateEmbeddedView(viewId, config)    → update + re-validate + cache clear
deleteEmbeddedView(viewId)            → Active=No + cache clear
saveRollupConfig(config)              → validate + auto-ID + append + cache clear
updateRollupConfig(rollupId, config)
deleteRollupConfig(rollupId)
saveWorkflowConfig(module, statuses[])→ validate transitions + write/update
addWorkflowStatus(module, config)     → single status add
deleteWorkflowStatus(module, code)    → check no active records → Active=No
saveTemplate(module, data)            → validate pre-fill JSON → auto-ID → append
updateTemplate(templateId, data)
deleteTemplate(templateId)            → Active=No
saveAutomationRule(module, data)      → validate trigger/condition/actions
updateAutomationRule(ruleId, data)
toggleAutomationRule(ruleId)          → flip Active Yes↔No

// Helper functions (power all configurator dropdowns)
getAvailableSheets()                  → [{sheetName, fileLabel, columns[]}]
getAvailableFKColumns(parent, child)  → columns linking child → parent
getAggregableColumns(sheet)           → numeric + date columns for function dropdown
getTemplatePreFillOptions(module)     → target columns + their dropdown values
```

### Permission Matrix

| Config | Admin | Manager | Supervisor | Operator |
|---|---|---|---|---|
| EMBEDDED_VIEWS | CRUD any | Add/Edit own module | — | — |
| ROLLUP_CONFIG | CRUD any | Add/Edit own module | — | — |
| STATUS_WORKFLOW | CRUD any | View only | — | — |
| TEMPLATES | CRUD any | Add/Edit own module | — | — |
| AUTOMATION_RULES | CRUD any | View only | — | — |

---

## NEW MODULE CHECKLIST (MANDATORY)

When building any new transaction file (FILE 3-8):

```
□ STATUS_WORKFLOW  → Add status rows (manual / Claude / Admin UI)
□ EMBEDDED_VIEWS   → Add linked view rows (manual / Claude / Admin UI)
□ ROLLUP_CONFIG    → Add rollup rows (manual / Claude / Admin UI)
□ TEMPLATES        → Create TEMPLATES sheet in new file
□ RECORD_COMMENTS  → Create RECORD_COMMENTS sheet in new file
□ AUTOMATION_RULES → (Optional) Add rules for new module
□ MASTER_RELATIONS → Add FK relations for new file
```

React components are REUSABLE — zero new code per module.

---

## BUILD SEQUENCE

| Phase | When | What |
|---|---|---|
| **Stage 1** | Weeks 1-4 | Foundation: Sheets + GAS + CRUD + PO/GRN + RBAC |
| **Stage 2** | Weeks 5-8 | Core: FK engine + cache + notifications + export |
| **Stage 3B** | Weeks 9-12 | Notion Features: Kanban + Saved Views + D&D + Linked DB + Rollups + Comments |
| **Stage 3C** | Weeks 12-14 | Admin Configurators: 5 configurator modals + CRUD GAS + helper functions |

---

## FILES

| File | Version | Sheets | Key Change |
|---|---|---|---|
| CC_ERP_Masters_V8.xlsx | V8 | 55 | +4 config sheets |
| CC_ERP_FILE2_Procurement_V2.xlsx | V2 | 7 | +2 sheets (TEMPLATES, RECORD_COMMENTS) |
| CC_ERP_BUILD_REFERENCE_V7.md | V7 | — | Sections 20A-20C. Phase 3B+3C. 26 rules. |
| CC_ERP_Notion_Features_V3.md | V3.1 | — | This file. Dual-path config. Configurator specs. |
