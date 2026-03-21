# Claude Project Knowledge Sync — 21 Mar 2026

> **Purpose:** Paste this into your Claude Project "Google AppScript CCPL ERP" knowledge/instructions to sync it with the current repo state. Replace any outdated sections in the project knowledge with the information below.

---

## CURRENT VERSION

**v14.10.1.1** (commit 6a8b663, branch: main)
Post-release commits: "sv all update" + "sv 02"

---

## SYSTEM ARCHITECTURE (unchanged)

```
React Frontend (Vite, port 9090) ←→ GAS APIGateway.gs (54 routes) ←→ Google Sheets (Files 1A–F2)
```
- PM2 for production, Vite dev server for development
- GAS = API only (no HTML serving)
- All UI in React

---

## GAS BACKEND — 54 API ROUTES (was 22, now 54)

Update any project knowledge that says "22 routes" to **54 routes**.

### Full Route List (APIGateway.gs):

**UI Bootstrap (2):** getUIBootstrap, saveUserTheme
**Presence (2):** heartbeat, getOnlineUsers
**Notifications (3):** getNotifications, markNotificationRead, dismissNotification
**Quick Access (3):** addShortcut, removeShortcut, getUserShortcuts
**Procurement PO (2):** getPOList, savePO
**Procurement GRN (3):** getGRNList, saveGRN, getOpenPOs
**Master Lookups (3):** getItems, getSuppliers, searchItems
**Dashboard (2):** getActivityFeed, getDashboardStats
**Export (2):** exportDocument, printDocument
**Masters CRUD (4):** getMasterSheetCounts, getMasterData, saveMasterRecord, deleteMasterRecord
**Procurement Detail (3):** getPODetail, getLineItems, updatePOStatus
**Workflow (1):** getWorkflow
**Rollups (1):** getRollups
**Embedded Views (1):** getEmbeddedViewData
**Comments (2):** getComments, addComment
**Templates (1):** getTemplates
**Help (2):** getHelpContent, searchHelp
**Categories (3):** getAllCategories, createCategory, updateCategory
**Article Dropdowns (1):** getArticleDropdowns *(added V12.6)*
**Boot/Sync (2):** getBootBundle, getDataSince *(added V13)*
**Schema Admin (1):** updateSchemaFields *(added V15)*

### GAS Files (25 total in gas/File1A/):
APIGateway.gs, Cache.gs, Code.gs, Config.gs, MasterSetup.gs,
Module1_CodeGen.gs through Module14_ProcurementAPI.gs (14 modules),
SheetSetup.gs, SheetSetup_1B.gs, SheetSetup_1C.gs, SheetSetup_F2.gs,
V9_Update.gs, appsscript.json, .clasp.json,
+ 4 HTML files (index.html, CreateNewSidebar.html, SupplierSidebar.html, TagSidebar.html)

**Note:** `CategoryEngine.gs` was never created as a standalone file. Category CRUD functions live in `APIGateway.gs` (lines 1723–1900+).

---

## FRONTEND COMPONENT INVENTORY (35 files, ~23,090 lines)

### Key Files (by size):
| File | Lines | Purpose |
|------|-------|---------|
| ArticleMasterTab.jsx | 3,917 | Layout View gold standard + standalone tab |
| RecordsTab.jsx | 3,163 | Records with V2 Table/Split views |
| ItemCategoryTab.jsx | 2,271 | 3-level category tree management |
| ArticleDataEntryForm.jsx | 1,745 | V2 data entry form with live dropdowns |
| BulkEntryTab.jsx | 1,584 | Bulk entry with adv filter/sort |
| TrimMasterTab.jsx | 1,531 | Trim master + Layout View |
| SchemaEditor.jsx | 1,464 | Schema editing UI |
| Procurement.jsx | 1,071 | PO/GRN management |
| UsersPanel.jsx | 924 | User management panel |
| FieldRenderer.jsx | 795 | Shared field rendering |
| DataEntryTab.jsx | 620 | Data entry tab wrapper |
| SheetWorkspace.jsx | 554 | Master workspace (2 Layout Views wired) |

### Layout View Status:
- **article_master** → `ArticleMasterLayoutPanel` (GOLD STANDARD)
- **trim_master** → `TrimMasterLayoutPanel`
- All other masters: NO Layout View yet

### SheetWorkspace Wiring (554 lines):
- Imports: ArticleMasterLayoutPanel, TrimMasterLayoutPanel
- Flags: `isArticleMaster`, `isTrimMaster`
- `displayTabs` adds Layout View tab for these 2 masters
- `handleEditFromLayout` handles edit-from-layout for all masters

---

## WHAT CHANGED V12.6 → V14.10.1.1

### V13: Frontend caching layer (+1,777 lines), GAS Cache.gs + Config.gs updates, getBootBundle + getDataSince API routes added

### V14: Complete V2 design overhaul
- **ArticleDataEntryForm**: Full rewrite, HSN auto-fill, 7 live dropdowns, new form layout
- **RecordsTab**: V2 rewrite with Table/Split/Sheet views, drive thumbnails, row heights, consolidated from split files
- **SheetWorkspace**: V2 wiring, Layout View integration finalized
- **New docs created**: DataEntry_V3_FEATURES.md, Records_Integration_Guide.md

---

## MD FILES — CURRENT STATE

### Active Docs (in MDFILES/):
| File | Status |
|------|--------|
| CC_ERP_ARCHITECTURE_V6.md | Updated (54 routes) |
| CC_ERP_BUILD_REFERENCE_V7.md | Gold standard |
| CC_ERP_BulkEntry_SKILL.md | Current |
| CC_ERP_GAS_Custom_Instructions_V7.md | Current |
| CC_ERP_ItemCategories_GAS_Connection.md | Fixed (no CategoryEngine.gs) |
| CC_ERP_LAYOUT_VIEW_RULES.md | Gold standard |
| CC_ERP_MODULE_display_SKILL.md | Current |
| CC_ERP_Notion_Features_V3.md | Current (Phase 3C status TBD) |
| CC_ERP_PRODUCTION_ROADMAP.md | Current |
| CC_ERP_UI_SPEC_V6.md | Review needed (43KB) |
| CC_ERP_Users_Panel_Working.md | Review needed |
| CC_ERP_V8_to_V9_Changelog.md | Current |
| CC_ERP_VIEW_CREATION_UI_SKILL.md | Current |
| CC_ERP_FK_Fixes_V12.4-12.6.md | NEW — merged V12.4/5/6 |
| CC_ERP_V13-V14_Changelog.md | NEW — full changelog |

### Archived (in MDFILES/archive/):
- CC_ERP_BUILD_REFERENCE_V5.md (replaced by V7)
- CC_ERP_V12.4_FK_YarnName_Fix.md (merged into FK_Fixes)
- CC_ERP_V12.5_DirectFK_Fix.md (merged into FK_Fixes)
- CC_ERP_V12.6_LiveDropdowns_Fix.md (merged into FK_Fixes)

### Root-level:
- CC_ERP_COLUMN_REFERENCE.md — Column reference
- CC_ERP_DataEntry_V3_FEATURES.md — V3 features spec
- CC_ERP_Records_Integration_Guide.md — Records integration

---

## OPEN ITEMS FOR CLAUDE PROJECT

1. **Notion Phase 3C configurators** — 5 modals spec'd, status unknown (built or not?)
2. **MASTER_RELATIONS V9 column updates** — confirm completed or pending
3. **CC_ERP_UI_SPEC_V6.md** — 43KB, needs review against current components
4. **CC_ERP_Users_Panel_Working.md** — verify against UsersPanel.jsx (924 lines)

*Sync generated by Claude Code • 21 Mar 2026*
