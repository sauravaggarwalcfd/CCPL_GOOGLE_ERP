# CC ERP — Changelog V12.7 → V14.10.1.1

**Period:** 3 Mar 2026 → 21 Mar 2026
**Current version:** v14.10.1.1

---

## V12.7 (8a4270d) — GAS Sheet Setup Fix
- Updated `Code.gs` (19 line changes) and `SheetSetup.gs` (6 line changes)
- 12 files changed total, minor GAS adjustments

## V12.8 (8f2a88f) — Header ↔ Form Alignment
- Google Sheet headers now match form field headings exactly
- `RecordsTab.jsx` + `SortPanel.jsx` updated (6 files, 61 ins / 59 del)

---

## V13 (42cc52b) — Frontend Caching Layer
- **Major:** +1,777 lines added — caching infrastructure for frontend
- `Cache.gs` updated, `Config.gs` extended
- 9 files changed — performance optimization for data fetching

## V13.1 (1d4d61b) — GAS Code + Sheet Enhancements
- `Code.gs` significantly expanded (+96 line changes)
- `SheetSetup.gs` +43 lines
- 5 files changed, 828 ins / 206 del

---

## V14 (1ccd67a) — Data Entry Page Overhaul (Start of V2 Design)
- **ArticleDataEntryForm.jsx** rewritten: 530 ins / 364 del (825 line delta)
- `ArticleMasterTab.jsx` updated (+66 lines)
- Beginning of V2 design system migration

## V14.1 (78d9ccf) — Data Entry Minor Fix
- `ArticleDataEntryForm.jsx` +1 line fix

## V14.2 (41d2503) — Records Page V2 Design
- **Major:** +1,500 lines — Records page redesigned
- `Masters.jsx` (-34 lines) and `SheetWorkspace.jsx` (-26 lines) cleaned up
- 5 files changed

## V14.3 (e701093) — Data Entry V2 Expansion
- **Major:** ArticleDataEntryForm grew by +869 lines
- Created `CC_ERP_DataEntry_V3_FEATURES.md` (+316 lines — new feature doc)
- 3 files changed, 2,403 ins / 36 del

## V14.4 (10d6a8e) — Data Entry Cleanup
- Removed 46 lines from ArticleDataEntryForm (code cleanup)

## V14.5 (8fabbf6) — Data Entry + SheetWorkspace
- ArticleDataEntryForm +151 lines (new features)
- SheetWorkspace.jsx integration updates (+10/-3)

## V14.6 (be743d0) — Data Entry + Workspace Polish
- ArticleDataEntryForm 29 line changes
- SheetWorkspace 26 line changes

## V14.7 (e1b2b8c) — SheetWorkspace Major Update
- SheetWorkspace.jsx significantly expanded (+82/-31 = +51 net)
- ArticleDataEntryForm 10 line changes

## V14.8 (db0f2b3) — Data Entry Refactor
- ArticleDataEntryForm trimmed (-29 lines — moved logic)
- DataEntryTab.jsx updated (16 line changes)

## V14.9 (b7aa0d4) — App Routing
- `App.jsx` + `Masters.jsx` minor routing adjustments (6 lines total)

## V14.9.2 (f0aa92a) — Records Integration Guide + RecordsTab V2
- Created `CC_ERP_Records_Integration_Guide.md` (+627 lines — new doc)
- RecordsTab.jsx expanded (+1,671 lines)
- ArticleDataEntryForm.jsx minor update

## V14.2 (6640650) — RecordsTab V2 Design Applied
- **Major:** RecordsTab.jsx rewritten: 723 ins / 126 del
- Applied V2 design patterns to Records page

## V14.3.2–V14.3.7 — RecordsTab Iterations
- **V14.3.2** (ef40ba4): Merge fixes
- **V14.3.4** (f6f9173): RecordsTab refinements
- **V14.3.5** (2bc676c): RecordsTab polish
- **V14.3.6** (9f8e84c): RecordsTab polish
- **V14.3.7** (9715ad3): RecordsTab +84/-22 (row height presets, column resizing)

## V14.4 (b7f95ed) — RecordsTab Complete Rewrite
- **Major:** Consolidated split files back into single RecordsTab.jsx
- Deleted `RecordsTab_part1.jsx` (-433 lines) and `RecordsTab_part2.jsx` (-850 lines)
- New unified RecordsTab: +1,549 lines
- 4 files changed, net -1,833 lines (consolidation)

## Drive Thumbnail Helper (3217f5e)
- RecordsTab +165 lines (thumbnail URL helper, row height presets)
- `masterSchemas.js` updated (4 line changes)

---

## V14.10 (046182c) — Data Entry Fix
- ArticleDataEntryForm 3 ins / 2 del

## V14.10.1 (462d5a2) — Data Entry Enhancement
- ArticleDataEntryForm +11 lines

## V14.10.1.1 (6a8b663) — Data Entry Fix ← CURRENT RELEASE
- ArticleDataEntryForm +10 lines

---

## Post-Release (sv 02)
- `c54995f` — "sv all update" (full sync commit)
- `61f550f` — "sv 02" (latest commit on main)

---

## Summary: What Changed V12.7 → V14.10.1.1

| Area | Key Changes |
|------|-------------|
| **GAS Backend** | V13 caching layer, sheet setup fixes, Code.gs expansion |
| **ArticleDataEntryForm** | Complete V2 rewrite (+2000 lines net), HSN auto-fill, new dropdowns |
| **RecordsTab** | Full V2 rewrite, split → unified, +3000 lines net, drive thumbnails |
| **SheetWorkspace** | Layout View integration, V2 wiring, +100 lines net |
| **New Docs** | DataEntry_V3_FEATURES.md, Records_Integration_Guide.md |

*CC ERP • Changelog V12.7–V14.10.1.1 • Generated 21 Mar 2026*
