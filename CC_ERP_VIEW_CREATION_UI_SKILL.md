# CC ERP — View Creation UI Skill
## Complete Feature Reference for Data Entry · Records · Bulk Entry Screens
**Version:** 2.0 | **Updated:** 27 Feb 2026 | **File:** `CC_ERP_MasterDataEntry.jsx`

---

## ⚠️ HOW TO USE THIS DOCUMENT

Read this **before writing a single line of code** for any of these screen types:

| Screen Type | Must Implement Sections |
|---|---|
| **Individual Data Entry** | §A, §B, §G |
| **Records / Reporting** | §A, §C, §D, §E, §F, §G |
| **Bulk Data Entry** | §A, §C, §D, §E, §F, §G |

**Non-negotiable rule:** Every feature in the checklists below is **mandatory**. If it is not in a screen it is a bug, not a design choice.

---

# ═══════════════════════════════════════════════════
# MASTER BUILD CHECKLIST — USE AS BUILD GATE
# Tick every box. Incomplete = not done.
# ═══════════════════════════════════════════════════

## ✅ CHECKLIST A — Common to ALL screens

- [ ] `position: relative` on the outer wrapper `<div>` of every tab component
- [ ] Theme tokens `M` (mode colors) and `A` (accent colors) passed as props — never hardcoded
- [ ] `fz` (font size) and `pyV` (row padding) passed as props — never hardcoded
- [ ] Toast notification system (`showToast(msg, color?)`)
- [ ] Global `Ctrl+K` command palette (if wiring to App)
- [ ] Status bar at bottom of every table view (total · visible · cols · sort · group info)

---

## ✅ CHECKLIST B — Individual Data Entry Tab

- [ ] Form mode: 2-column responsive card grid layout
- [ ] Inline mode: dense label + value row layout
- [ ] Form / Inline toggle button in top-right of tab bar
- [ ] **Views Bar** (Row 2 below tab buttons) — **only on Data Entry tab, hidden on all other tabs**
  - [ ] Conditional render: `{tab === "entry" && <ViewsBarDiv />}`
  - [ ] `VIEWS:` label on left
  - [ ] **All Fields pill** always first (clears active view, shows total col count)
  - [ ] **System view pills** (📋 Full Entry, ⚡ Quick Entry) with distinct gray/orange styling — no delete
  - [ ] **Custom view pills** with purple border — split compound button: [Name | divider | ✏ Edit]
  - [ ] Active pill shows filled `●` dot, stronger border, light tint background
  - [ ] Active view description chip on right side (icon + desc + "N of M fields")
  - [ ] `+ New View` dashed button
  - [ ] `🔖 Manage` button → opens ViewsPanel drawer
  - [ ] Activating already-active view → deactivates (returns to All Fields)
- [ ] Auto/FK fields rendered as read-only with `← GAS auto-fills` placeholder
- [ ] Mandatory fields marked with `⚠` icon; blocked on save if empty
- [ ] Field sections collapsible with chevron toggle
- [ ] Save to Sheet button in footer
- [ ] Clear / Reset button in footer
- [ ] Unsaved changes guard modal when switching masters or tabs

---

## ✅ CHECKLIST C — Views System (Records + Bulk both)

- [ ] **Views Bar Row 2** below the main toolbar — separate `<div>`, never inline with action buttons
- [ ] `VIEWS:` label
- [ ] **Default pill** always first — `LOCKED` badge, no action buttons, never deletable
- [ ] Default pill shows `MODIFIED` amber badge when state drifts from baseline
- [ ] **User-saved view pills**: click → load (with switch guard if dirty)
- [ ] Active view pill shows: filled dot + `MODIFIED` amber badge when dirty + `💾 Update View` button
- [ ] `💾 Update View` button only visible when `isActive && viewDirty && !isDefault`
- [ ] Inline rename: click ✎ → input appears in pill; Enter/Escape/Blur commit
- [ ] ✏ Edit button → opens `ViewEditModal` (edit mode)
- [ ] ⧉ Duplicate button → opens `ViewEditModal` (duplicate mode, auto-appends " (copy)")
- [ ] × Delete button → falls back to Default if deleted view was active
- [ ] `+ Save View` button captures current state into new named view
- [ ] Name `"Default"` is **reserved** — blocked at all 4 entry points: save / rename / duplicate / commit
- [ ] `existingNames` in `ViewEditModal` always includes `"Default"` as first entry

### View State Object Shape (mandatory — use exactly this)
```js
{
  colOrder:       ["A","B","C",...],
  hiddenC:        ["D","E"],
  sorts:          [{ col:"A", dir:"asc", type:"auto", nulls:"last" }],  // full shape
  filters:        {"A":"polo", "B":""},
  groupBy:        "G",          // null if none
  subGroupBy:     "H",          // null if none — ALWAYS include even if null
  activeViewName: "Default"
}
```

### Template Object Shape
```js
{
  name:       "My View",
  colOrder:   [...],
  hiddenC:    [...],
  sorts:      [{ col, dir, type, nulls }],  // always full shape
  filters:    {...},
  groupBy:    null,
  subGroupBy: null    // always include
}
```

### View Dirty Detection — include ALL 6 comparisons + subGroupBy
```js
const getViewDirty = () => {
  if (activeViewName === "Default") {
    return !(colOrder deep-equals allCols
          && hiddenC.length === 0
          && sorts.length === 0
          && all filter values empty
          && groupBy === null
          && subGroupBy === null);   // ← must include
  }
  const saved = templates.find(t => t.name === activeViewName);
  return (colOrder differs ||
          hiddenC differs ||
          sorts differs ||
          filters differs ||
          groupBy !== saved.groupBy ||
          subGroupBy !== (saved.subGroupBy||null));  // ← must include
};
```

### View Switch Guard Modal (3 options)
```
Triggered: tryLoadTemplate when viewDirty && different view clicked
  Option 1: 💾 Save changes → switch   (updateCurrentView + loadTemplate)
  Option 2: Discard changes → switch   (loadTemplate directly)
  Option 3: ← Stay on this view        (close modal, do nothing)
```

### ViewEditModal — 4 Sub-tabs (all mandatory)
| Tab | Contents |
|---|---|
| ⊟ Columns | Toggle visibility per column + ↑↓ reorder buttons |
| ↕ Sort | Multi-level sort list — full `{col,dir,type,nulls}` shape on add |
| 🔍 Filter | Per-column text filter inputs with clear buttons |
| ⊞ Group | Primary group radio + conditional Sub-group radio section with purple dashed divider |

---

## ✅ CHECKLIST D — Two-Level Grouping

- [ ] Primary `groupBy` state (null if none)
- [ ] `subGroupBy` state (null if none)
- [ ] When primary group cleared → **auto-clear subGroupBy** (`setSubGroupBy(null)`)
- [ ] Sub-group dropdown only appears when `groupBy` is set
- [ ] Sub-group options exclude the primary group column
- [ ] Grouped data builds nested structure: `[{ key, sub:[{ subKey, rows }] }]`
- [ ] **Primary group header row**: dark slate bg (`#1e293b`), white text, red count badge, field label + value
- [ ] **Sub-group header row**: slightly lighter slate (`#334155`), `↳` prefix, 28px left indent, purple count badge
- [ ] Both headers span full `colSpan` of table
- [ ] Group and sub-group state saved in viewState + templates
- [ ] Group and sub-group included in `getViewDirty()` comparison
- [ ] ViewEditModal Group tab: Primary radio section + Sub-group section (shown only when primary set)
- [ ] Sub-group section separated from primary with purple dashed border divider

---

## ✅ CHECKLIST E — Notion-Style Sort Panel

- [ ] Sort button in toolbar shows rule count badge when active: `↕ Sort [N]`
- [ ] Clicking sort button opens `<SortPanel>` as right-side slide-over overlay
- [ ] Sort panel requires `position:relative` on outer tab wrapper
- [ ] Panel width: 440px, full height, right-anchored
- [ ] Transparent dark backdrop closes panel on click
- [ ] **Header**: purple bg `#7C3AED`, rule count badge, `✕ Clear All`, close `✕`
- [ ] **Quick Presets bar**: Name A→Z · Name Z→A · Code ↑ · ✕ Clear All
- [ ] **Empty state** when no rules: centered icon + "No sort rules" message
- [ ] **Per rule row** (top to bottom): `⠿` drag handle · `①` priority badge · "then by" label · column picker · direction toggle · `▼` advanced · `×` remove
- [ ] **Direction toggle** is type-aware:
  - Numeric field → `1 → 9` / `9 → 1`
  - Date field → `Oldest` / `Newest`
  - Length → `Shortest` / `Longest`
  - Alpha/default → `A → Z` / `Z → A`
- [ ] **Advanced row** (expands per rule):
  - [ ] Sort type override: Auto-detect / Text (A→Z) / Number / Date / Text length
  - [ ] Null handling toggle: Nulls last / Nulls first (segmented control)
  - [ ] ↑ ↓ priority buttons (alternative to drag)
- [ ] **Drag-to-reorder**: `onDragStart/Over/Drop` with yellow border on drop target, 0.5 opacity on dragged item
- [ ] **Add rule dropdown** at bottom — shows only columns not already in sorts list
- [ ] **Active sort summary strip** at very bottom — pills showing full chain `① Name A→Z` `② Date Oldest ∅↑`
- [ ] Header column click adds/toggles/removes sort rule using full `{col,dir,type,nulls}` shape
- [ ] SortPanel is a **shared component** — same component instance used by both RecordsTab and BulkEntry

### Sort State Shape (mandatory — never use old `{col, dir}` only)
```js
sorts: [{ col: "A", dir: "asc", type: "auto", nulls: "last" }]
// dir:   "asc" | "desc"
// type:  "auto" | "alpha" | "numeric" | "date" | "length"
// nulls: "last" | "first"
```

### Sort Engine — Type-Aware + Null-Safe (use this always)
```js
rs.sort((a,b) => {
  for (const {col,dir,type,nulls} of sorts) {
    const av=a[col], bv=b[col];
    const an=av==null||av==="", bn=bv==null||bv==="";
    if(an&&bn) continue;
    if(an) return nulls==="first"?-1:1;
    if(bn) return nulls==="first"?1:-1;
    const ft = type==="auto"||!type
      ? (()=>{ const f=allFields.find(x=>x.col===col);
               return ["currency","number","calc"].includes(f?.type)?"numeric"
                    : f?.type==="date"?"date":"alpha"; })()
      : type;
    let d=0;
    if(ft==="numeric"){ d=parseFloat(av)-parseFloat(bv); if(isNaN(d))d=0; }
    else if(ft==="date"){ d=new Date(av)-new Date(bv); if(isNaN(d))d=0; }
    else if(ft==="length"){ d=String(av).length-String(bv).length; }
    else { d=String(av).localeCompare(String(bv),undefined,{sensitivity:"base"}); }
    if(d!==0) return dir==="asc"?d:-d;
  }
  return 0;
});
```

---

## ✅ CHECKLIST F — Σ Aggregation Footer Row

- [ ] Sticky `<tfoot>` row at the bottom of every data table in Records + Bulk
- [ ] First cell: `Σ AGG` label, purple text `#7C3AED`, purple-tinted bg `#ede9fe`
- [ ] Accounts for extra columns: `hasCheckbox={true}` for BulkEntry, `hasCheckbox={false}` for Records
- [ ] Each column cell shows either: faint `+ Calculate` hint OR active function value + label
- [ ] Clicking a cell opens `<AggDropdown>` for that column

### Architecture — CRITICAL: dropdown is NOT inside tfoot
```
❌ WRONG:  <tfoot><tr><td><div style="position:absolute">dropdown</div></td></tr></tfoot>
           → Clipped by overflow:auto container

❌ WRONG:  <tfoot> with ReactDOM.createPortal
           → Not available in artifact/embedded environments

✅ CORRECT: AggFooter  = pure <tfoot> row with onCellClick callback
            AggDropdown = separate component rendered as sibling outside <table>
            Backdrop    = transparent fixed div that closes on click
```

### State Pattern (in RecordsTab and BulkEntry)
```js
const [aggState,    setAggState]    = useState({});   // {[col]: "sum"|"avg"|...}
const [aggOpenInfo, setAggOpenInfo] = useState(null); // {col, top, left} | null

const aggCellClick = (col, el) => {
  if (aggOpenInfo?.col === col) { setAggOpenInfo(null); return; }
  const r = el.getBoundingClientRect();
  setAggOpenInfo({
    col,
    top:  Math.max(8, r.top - 410),              // opens above button
    left: Math.min(r.left, window.innerWidth-230) // clamped to viewport
  });
};
```

### Render Pattern
```jsx
{/* Inside table — pure tfoot, no dropdown */}
<AggFooter
  visRows={visRows}    visCols={visCols}   allFields={allFields}
  aggState={aggState}  openCol={aggOpenInfo?.col||null}
  onCellClick={aggCellClick}
  hasCheckbox={true|false}  M={M}  A={A}
/>

{/* Outside table — sibling components */}
{aggOpenInfo && (<>
  <div onClick={()=>setAggOpenInfo(null)}
    style={{position:"fixed",inset:0,zIndex:9998}}/>
  <AggDropdown
    openInfo={aggOpenInfo}  aggState={aggState}  setAggState={setAggState}
    visRows={visRows}  allFields={allFields}
    onClose={()=>setAggOpenInfo(null)}  M={M}  A={A}
  />
</>)}
```

### All 12 Aggregation Functions

| Group | Key | Label |
|---|---|---|
| — | `none` | — (no aggregation) |
| **Count** | `count` | Count all |
| **Count** | `count_values` | Count values (non-empty) |
| **Count** | `count_empty` | Count empty |
| **Count** | `unique` | Unique values |
| **Calculate** | `sum` | Sum |
| **Calculate** | `avg` | Average |
| **Calculate** | `min` | Min |
| **Calculate** | `max` | Max |
| **Calculate** | `range` | Range (max−min) |
| **Calculate** | `median` | Median |
| **Percent** | `percent_filled` | % Filled |
| **Percent** | `percent_empty` | % Empty |

- [ ] `computeAgg(fn, rows, col, allFields)` handles all 12 functions
- [ ] `fmtAgg(fn, val, allFields, col)` — currency uses `₹` + `en-IN` locale, % shows 1 decimal
- [ ] `AGG_COLORS` map — each function has its own accent color
- [ ] Dropdown opens **upward** above the cell (not downward)
- [ ] Dropdown header: dark slate `#1e293b`, field name + column code + current value badge
- [ ] Dropdown options grouped: Count / Calculate / Percent with colored section headers
- [ ] Active option: colored left border `3px solid` + dot + value badge on right
- [ ] Dropdown footer: `✕ Remove` button (only when function is active) + `Close`
- [ ] Aggregations reflect **visible rows only** (`visRows`) — filtered/sorted, not all rows
- [ ] `onMouseDown: e.stopPropagation()` on dropdown div to prevent backdrop closing it immediately

### AGG_COLORS Reference
```js
const AGG_COLORS = {
  count:"#0078D4",        count_values:"#0078D4",
  count_empty:"#6b7280",  unique:"#7C3AED",
  sum:"#15803d",          avg:"#E8690A",
  min:"#0e7490",          max:"#7c2d12",
  range:"#4338ca",        median:"#0891b2",
  percent_filled:"#15803d", percent_empty:"#6b7280",
};
```

---

## ✅ CHECKLIST G — Column Management + Drag Reorder

- [ ] Columns button → inline panel listing all columns as toggle pills
- [ ] Hidden columns: strikethrough text, muted border
- [ ] `Show All` button resets `hiddenC` to `[]`
- [ ] Column headers are `draggable` — amber `3px` left border on drop target
- [ ] `visCols` = `colOrder.filter(c => !hiddenC.includes(c))` — always derived, never stored separately
- [ ] Header click: asc → desc → remove (3-state cycle) using full sort shape

---

## §H — App-Level State to Provision

When building a new module with these screens, add to App state:

```js
// Data Entry views
const [views,          setViews]          = useState({});  // {masterId: viewArray}
const [activeV,        setActiveV]        = useState({});  // {masterId: viewId|null}

// Records tab persistence
const [recViewState,   setRecViewState]   = useState({});  // {masterId: viewStateObj}
const [recTpls,        setRecTpls]        = useState({});  // {masterId: templateArray}

// Bulk Entry persistence
const [bulkRows,       setBulkRows]       = useState({});  // {masterId: rowArray}
const [bulkViewState,  setBulkViewState]  = useState({});  // {masterId: viewStateObj}
const [bulkTpls,       setBulkTpls]       = useState({});  // {masterId: templateArray}
```

---

## §I — Row State Flags (Bulk Entry)

| Flag | Meaning | Visual |
|---|---|---|
| `__id` | Stable unique row identity | — |
| `__new` | Added this session, not saved | Blue `#0078D4` left border |
| `__dirty` | Modified but not saved | Amber `#f59e0b` left border + yellow bg |
| error | Failed mandatory validation | Red `#dc2626` left border + pink bg |

---

## §J — Color Conventions

| Color | Hex | Usage |
|---|---|---|
| CC Red | `#CC0000` | Add Row, Default view active indicator, Save to Sheet |
| Purple | `#7C3AED` | Saved view pills, Sort panel header, sub-group, Agg header, Σ AGG label |
| Amber | `#f59e0b` | MODIFIED badge, dirty row border, drag-drop target indicator |
| Green | `#15803d` | Save confirmed toast, Sum agg, % Filled |
| Blue | `#0078D4` | New row border, Count agg |
| Orange | `#E8690A` | Quick Entry pill, Average agg |
| Red | `#dc2626` | Errors, Delete button, mandatory missing cells |
| Group header | `#1e293b` | Primary group row background |
| Sub-group header | `#334155` | Sub-group row background |
| Sub-group divider | `#c4b5fd` | Dashed border in ViewEditModal Group tab |

---

## §K — Critical DO-NOTs

| ❌ Never | ✅ Instead |
|---|---|
| Dropdown inside `<tfoot>` | `AggDropdown` as separate sibling component outside table |
| `position:absolute` for table row overlays | `position:fixed` + `getBoundingClientRect()` |
| `ReactDOM.createPortal` | Lift component to parent render tree |
| Sort state as `{col, dir}` only | Always `{col, dir, type, nulls}` |
| Plain `localeCompare` sort only | Type-aware null-safe sort engine (§E) |
| `subGroupBy` missing from dirty detection | Include in all 6 comparison paths |
| `subGroupBy` missing from template shape | Always store even if null |
| Views Bar on all tabs | Guard with `{tab === "entry" && ...}` |
| `DEFAULT_VIEW.colOrder` hardcoded | Always derive from `allCols` inside component |
| Name `"Default"` allowed in save/rename/dup | Block at all 4 entry points with guard |
| SortPanel without `position:relative` on wrapper | Add `position:relative` to outer tab `<div>` |
| `computeAgg` without currency detection | Check `f?.type === "currency"` in fmtAgg |
| Aggregations on all rows | Always pass `visRows` (filtered), never raw `rows` |
| Sub-group dropdown always visible | Only render when `groupBy` is set |
| Sub-group includes primary col in options | Filter: `.filter(f => f.col !== groupBy)` |

---

## §L — Session History / What Was Built When

| Session | Features Delivered |
|---|---|
| Feb 26 eve | Base Data Entry form, field specs table, 5 themes, 6 accents, 8 master types, mock records |
| Feb 27 morning | Bulk Master Entry tab: spreadsheet grid, multi-sort/filter/group, inline editing, saved views |
| Feb 27 | View persistence lifted to App state, DEFAULT_VIEW constant, dirty detection, MODIFIED badge, 💾 Update View, view switch guard modal, inline rename, ViewEditModal 4 tabs, mandatory validation, unsaved row guards |
| Feb 27 | Records tab: read-only browser, same view system, Record Detail Modal (3 layouts), export options (PDF/Excel/GSheet/Print), drag-drop columns |
| Feb 27 | Two-level sub-grouping (subGroupBy) in both Records + Bulk, nested headers, ViewEditModal Group tab with conditional sub-group section |
| Feb 27 | Views Bar in Data Entry tab only — All Fields + System + Custom pills, description chip, + New View, 🔖 Manage |
| Feb 27 | Notion-style Sort Panel: drag reorder, type-aware labels, advanced row (type override + nulls), quick presets, active summary strip, upgraded sort engine |
| Feb 27 | Σ Aggregation footer: AggFooter (pure tfoot) + AggDropdown (fixed sibling), 12 functions, INR formatting, color-coded, fixed dropdown positioning via getBoundingClientRect |

---

*End of CC_ERP_VIEW_CREATION_UI_SKILL.md — Version 2.0*
