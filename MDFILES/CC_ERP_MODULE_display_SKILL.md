# CC ERP — Module Implementation Skill
## Master Checklist for Building Any ERP Screen
**Version:** 2.0 | **Created:** Mar 2026 | **Updated:** Mar 2026
**Source files:** `CC_ERP_MasterDataEntry.jsx` + `CC_ERP_VIEW_CREATION_UI_SKILL.md` + `ArticleMasterTab.jsx`
**Layout View rules:** See also `CC_ERP_LAYOUT_VIEW_RULES.md` for full implementation reference

---

## ⚠️ HOW TO USE THIS FILE

**Before writing a single line of code for any new ERP module:**

1. Read this file **line by line**
2. Identify which screen types you need (see table below)
3. Run the checklists for those sections — **every item is mandatory, not optional**
4. Tick boxes as you implement. Unticked = bug, not design choice.

| Screen Type | Required Sections |
|---|---|
| **Records / Reports** | §COMMON + §RECORDS |
| **Data Entry** | §COMMON + §DATA_ENTRY + §FIELD_SPECS |
| **Bulk Entry** | §COMMON + §BULK_ENTRY + §FIELD_SPECS |
| **Layout View** | §COMMON + §LAYOUT_VIEW |
| **All four** | All sections |

**To implement selected types only:** Tell Claude which sections to apply, e.g.:
> "Implement Records and Bulk Entry for PO_MASTER — run §COMMON + §RECORDS + §BULK_ENTRY + §FIELD_SPECS"
> "Implement Layout View for ARTICLE_MASTER — run §COMMON + §LAYOUT_VIEW"

---
---

# ══════════════════════════════════════════════════════
# §COMMON — Applies to ALL Screen Types
# ══════════════════════════════════════════════════════

## §COMMON-A — Wrapper & Theme

- [ ] Outer `<div>` of every tab component has `position: relative` (required for SortPanel overlay)
- [ ] Theme tokens `M` (mode colors) passed as props — **never hardcoded hex values**
- [ ] Accent tokens `A` passed as props — **never hardcoded**
- [ ] `fz` (font size px) passed as prop
- [ ] `pyV` (row vertical padding px) passed as prop
- [ ] 5 theme modes available: `light` · `black` · `midnight` · `warm` · `slate`
- [ ] 6 accent options: `orange` · `blue` · `teal` · `green` · `purple` · `rose`

### Theme Object Shape
```js
// M (mode) keys used everywhere:
M.bg  M.sh  M.shBd  M.hi  M.mid  M.lo  M.hov
M.inBg  M.inBd  M.div  M.thd  M.tev  M.tod
M.bBg  M.bTx  M.tA  M.tB  M.tC  M.tD  M.scr  M.shadow

// A (accent) keys:
A.a    // main accent hex
A.al   // accent with 12% opacity (tinted bg)
A.tx   // text on accent bg (#fff)
```

## §COMMON-B — Toast Notification System

- [ ] `showToast(msg, color?)` function implemented
- [ ] Default color: `#15803d` (green — success)
- [ ] Toast rendered at `position:fixed, bottom:24, right:24, zIndex:9999`
- [ ] Auto-dismiss after 2500ms
- [ ] Font: 12px, weight 800, rounded 8px

## §COMMON-C — Status Bar

- [ ] Sticky status bar at **bottom** of every table view
- [ ] Shows: `Total: N` · `Visible: M` · `Cols: K` · active sort summary · active group info
- [ ] Updates reactively when filters/sort/group change

## §COMMON-D — Ctrl+K Command Palette

- [ ] Global `Ctrl+K` listener wired at App level
- [ ] Opens command palette for deep-linking to masters / modules

## §COMMON-E — App-Level State to Provision

Add this state block to App.jsx when building a new module:

```js
// Data Entry view persistence
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

## §COMMON-F — Color Conventions (locked — do not deviate)

| Color | Hex | Usage |
|---|---|---|
| CC Red | `#CC0000` | Add Row, Default view active, Save to Sheet, confirm modals |
| Purple | `#7C3AED` | Saved view pills, Sort panel header, sub-group rows, AGG label |
| Amber | `#f59e0b` | MODIFIED badge, dirty row border, drag-drop target |
| Green | `#15803d` | Save toast, Sum agg, % Filled |
| Blue | `#0078D4` | New row border, Count agg |
| Orange | `#E8690A` | Quick Entry pill, Average agg |
| Red | `#dc2626` | Errors, Delete, mandatory missing |
| Dark Slate | `#1e293b` | Primary group header row bg |
| Mid Slate | `#334155` | Sub-group header row bg |
| Sub-group divider | `#c4b5fd` | Dashed border in ViewEditModal Group tab |

---
---

# ══════════════════════════════════════════════════════
# §RECORDS — Records / Reports Screen
# ══════════════════════════════════════════════════════

*Full read-only browser of sheet data with view system, sorting, grouping, aggregation, and export.*

## §RECORDS-A — Views System (Notion-style)

- [ ] **Views Bar Row 2** — rendered in a separate `<div>` below the main toolbar, **never inline** with action buttons
- [ ] `VIEWS:` label on left edge
- [ ] **Default pill** always first — `LOCKED` badge, no rename/delete/action buttons
- [ ] Default pill shows amber `MODIFIED` badge when current state drifts from baseline
- [ ] **User-saved view pills**: click → load (triggers switch guard if dirty)
- [ ] Active view pill shows: filled `●` dot + amber `MODIFIED` badge when dirty + `💾 Update View` button
- [ ] `💾 Update View` button visible **only** when `isActive && viewDirty && !isDefault`
- [ ] Inline rename: click ✎ → input replaces name; Enter/Escape/Blur commits
- [ ] ✏ Edit button → opens `ViewEditModal` (edit mode)
- [ ] ⧉ Duplicate button → opens `ViewEditModal` (duplicate mode, auto-appends " (copy)")
- [ ] × Delete button → falls back to Default if deleted view was active
- [ ] `+ Save View` button captures current state as new named view
- [ ] Name `"Default"` is **reserved** — blocked at all 4 entry points: save / rename / duplicate / commit
- [ ] `existingNames` in `ViewEditModal` always includes `"Default"` as first entry

### View State Object (mandatory — use exactly this shape)
```js
{
  colOrder:       ["A","B","C",...],   // all column ids in display order
  hiddenC:        ["D","E"],           // hidden column ids
  sorts:          [{ col:"A", dir:"asc", type:"auto", nulls:"last" }],
  filters:        {"A":"polo", "B":""},
  groupBy:        "G",                 // null if none
  subGroupBy:     "H",                 // null if none — ALWAYS include even if null
  activeViewName: "Default"
}
```

### Template Object Shape
```js
{
  name:       "My View",
  colOrder:   [...],
  hiddenC:    [...],
  sorts:      [{ col, dir, type, nulls }],  // full shape always
  filters:    {...},
  groupBy:    null,
  subGroupBy: null    // always include, even if null
}
```

### View Dirty Detection — 6 comparisons (all required)
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
          subGroupBy !== (saved.subGroupBy || null));  // ← must include
};
```

### View Switch Guard Modal (3 options — all mandatory)
```
Trigger: tryLoadTemplate when viewDirty && different view clicked
  Option 1: 💾 Save changes → switch   (updateCurrentView + loadTemplate)
  Option 2: Discard changes → switch   (loadTemplate directly)
  Option 3: ← Stay on this view        (close modal, do nothing)
```

### ViewEditModal — 4 Sub-tabs (all mandatory)
| Tab | Contents |
|---|---|
| ⊟ Columns | Toggle visibility per column + ↑↓ reorder buttons |
| ↕ Sort | Multi-level sort list with full `{col,dir,type,nulls}` shape on add |
| 🔍 Filter | Per-column text filter inputs with individual clear buttons |
| ⊞ Group | Primary group radio + conditional sub-group radio with purple dashed divider |

## §RECORDS-B — Two-Level Grouping

- [ ] `groupBy` state (null if none)
- [ ] `subGroupBy` state (null if none)
- [ ] When primary group cleared → **auto-clear subGroupBy** (`setSubGroupBy(null)`)
- [ ] Sub-group dropdown only renders when `groupBy` is set
- [ ] Sub-group options exclude the primary group column: `.filter(f => f.col !== groupBy)`
- [ ] Grouped data builds nested structure: `[{ key, sub:[{ subKey, rows }] }]`
- [ ] **Primary group header row**: bg `#1e293b`, white text, red count badge, field label + value
- [ ] **Sub-group header row**: bg `#334155`, `↳` prefix, 28px left indent, purple count badge
- [ ] Both headers use `colSpan` to span full table width
- [ ] Group + sub-group saved in viewState and templates
- [ ] Both included in `getViewDirty()` comparison
- [ ] ViewEditModal Group tab: Primary radio section + Sub-group section (shown only when primary set)
- [ ] Sub-group section separated from primary with purple dashed border `#c4b5fd`

## §RECORDS-C — Sort Panel (Notion-style slide-over)

- [ ] Sort button in toolbar shows rule count badge: `↕ Sort [N]`
- [ ] Clicking opens `<SortPanel>` as right-side slide-over overlay
- [ ] Panel: 440px wide, full height, right-anchored, `position:absolute`
- [ ] Transparent dark backdrop behind panel — click closes
- [ ] **Header**: purple bg `#7C3AED`, rule count badge, `✕ Clear All`, close `✕`
- [ ] **Quick Presets bar**: Name A→Z · Name Z→A · Code ↑ · ✕ Clear All
- [ ] **Empty state**: centered icon + "No sort rules" message when `sorts.length === 0`
- [ ] **Per-rule row**: `⠿` drag handle · `①` priority badge · "then by" label · column picker · direction toggle · `▼` advanced · `×` remove
- [ ] **Direction toggle** is type-aware:
  - Numeric → `1 → 9` / `9 → 1`
  - Date → `Oldest` / `Newest`
  - Length → `Shortest` / `Longest`
  - Alpha/default → `A → Z` / `Z → A`
- [ ] **Advanced row** (expands per rule):
  - Sort type override: Auto-detect / Text (A→Z) / Number / Date / Text length
  - Null handling: Nulls last / Nulls first (segmented control)
  - ↑ ↓ priority buttons (alternative to drag)
- [ ] **Drag-to-reorder**: `onDragStart/Over/Drop` with amber `3px` border on drop target, `opacity:0.5` on dragged item
- [ ] **Add rule dropdown** at bottom — shows only columns NOT already in sorts list
- [ ] **Active sort summary strip** at very bottom — pills showing `① Name A→Z` `② Date Oldest ∅↑`
- [ ] Header column click adds/toggles/removes sort using full `{col,dir,type,nulls}` shape (3-state cycle)

### Sort State Shape (always use full shape — never `{col, dir}` only)
```js
sorts: [{ col: "A", dir: "asc", type: "auto", nulls: "last" }]
// dir:   "asc" | "desc"
// type:  "auto" | "alpha" | "numeric" | "date" | "length"
// nulls: "last" | "first"
```

### Sort Engine — Type-Aware + Null-Safe
```js
rs.sort((a, b) => {
  for (const { col, dir, type, nulls } of sorts) {
    const av = a[col], bv = b[col];
    const an = av == null || av === "", bn = bv == null || bv === "";
    if (an && bn) continue;
    if (an) return nulls === "first" ? -1 : 1;
    if (bn) return nulls === "first" ? 1 : -1;
    const ft = type === "auto" || !type
      ? (() => {
          const f = allFields.find(x => x.col === col);
          return ["currency","number","calc"].includes(f?.type) ? "numeric"
               : f?.type === "date" ? "date" : "alpha";
        })()
      : type;
    let d = 0;
    if (ft === "numeric") { d = parseFloat(av) - parseFloat(bv); if (isNaN(d)) d = 0; }
    else if (ft === "date") { d = new Date(av) - new Date(bv); if (isNaN(d)) d = 0; }
    else if (ft === "length") { d = String(av).length - String(bv).length; }
    else { d = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" }); }
    if (d !== 0) return dir === "asc" ? d : -d;
  }
  return 0;
});
```

## §RECORDS-D — Σ Aggregation Footer Row

- [ ] Sticky `<tfoot>` row at bottom of the data table
- [ ] First cell: `Σ AGG` label, purple text `#7C3AED`, purple-tinted bg `#ede9fe`
- [ ] `hasCheckbox={false}` for Records tab (no row selection checkboxes)
- [ ] Each column cell shows: faint `+ Calculate` hint **or** active function value + label
- [ ] Clicking a cell opens `<AggDropdown>` for that column

### Architecture — Dropdown is NOT inside tfoot
```
❌ WRONG: dropdown inside <tfoot><td> → clipped by overflow:auto
❌ WRONG: ReactDOM.createPortal → not available in embedded envs

✅ CORRECT:
  AggFooter   = pure <tfoot> row with onCellClick callback
  AggDropdown = separate sibling component OUTSIDE <table>
  Backdrop    = transparent fixed div that closes on click
```

### Aggregation State
```js
const [aggState,    setAggState]    = useState({});   // {[col]: "sum"|"avg"|...}
const [aggOpenInfo, setAggOpenInfo] = useState(null); // {col, top, left} | null

const aggCellClick = (col, el) => {
  if (aggOpenInfo?.col === col) { setAggOpenInfo(null); return; }
  const r = el.getBoundingClientRect();
  setAggOpenInfo({
    col,
    top:  Math.max(8, r.top - 410),
    left: Math.min(r.left, window.innerWidth - 230)
  });
};
```

### Render Pattern
```jsx
{/* Inside table */}
<AggFooter
  visRows={visRows}  visCols={visCols}  allFields={allFields}
  aggState={aggState}  openCol={aggOpenInfo?.col || null}
  onCellClick={aggCellClick}
  hasCheckbox={false}  M={M}  A={A}
/>

{/* Outside table — sibling */}
{aggOpenInfo && (<>
  <div onClick={() => setAggOpenInfo(null)}
    style={{position:"fixed",inset:0,zIndex:9998}} />
  <AggDropdown
    openInfo={aggOpenInfo}  aggState={aggState}  setAggState={setAggState}
    visRows={visRows}  allFields={allFields}
    onClose={() => setAggOpenInfo(null)}  M={M}  A={A}
  />
</>)}
```

### All 12 Aggregation Functions
| Group | Key | Label |
|---|---|---|
| — | `none` | — (no aggregation) |
| Count | `count` | Count all |
| Count | `count_values` | Count values (non-empty) |
| Count | `count_empty` | Count empty |
| Count | `unique` | Unique values |
| Calculate | `sum` | Sum |
| Calculate | `avg` | Average |
| Calculate | `min` | Min |
| Calculate | `max` | Max |
| Calculate | `range` | Range (max−min) |
| Calculate | `median` | Median |
| Percent | `percent_filled` | % Filled |
| Percent | `percent_empty` | % Empty |

- [ ] `computeAgg(fn, rows, col, allFields)` handles all 12 functions
- [ ] `fmtAgg(fn, val, allFields, col)` — currency uses `₹` + `en-IN` locale; `%` shows 1 decimal
- [ ] Aggregations computed on **`visRows` only** (filtered/sorted) — **never raw rows**
- [ ] `onMouseDown: e.stopPropagation()` on dropdown div to prevent backdrop closing it immediately
- [ ] Dropdown opens **upward** above the cell (never downward)
- [ ] Dropdown header: dark `#1e293b`, field name + column code + current value badge
- [ ] Options grouped: Count / Calculate / Percent with colored section headers
- [ ] Active option: `3px solid` colored left border + dot + value badge on right
- [ ] Dropdown footer: `✕ Remove` button (only when function is active) + `Close`

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

## §RECORDS-E — Column Management + Drag Reorder

- [ ] Columns button → inline panel listing all columns as toggle pills
- [ ] Hidden columns: strikethrough text, muted border
- [ ] `Show All` button resets `hiddenC` to `[]`
- [ ] Column headers are `draggable` — amber `3px` left border on drop target
- [ ] `visCols` = `colOrder.filter(c => !hiddenC.includes(c))` — derived, never stored separately
- [ ] Header click: asc → desc → remove (3-state cycle)

## §RECORDS-F — Row Detail + Export

- [ ] Row click → opens Record Detail Modal
- [ ] Modal has 3 layout options: Card grid / Inline table / JSON raw
- [ ] Export options in toolbar: PDF · Excel · Google Sheet · Print
- [ ] Export respects current `visCols` + `visRows` (filtered data, not all rows)

## §RECORDS-G — Advanced Operator Filter Panel (Layout View style)

*Operator-based multi-condition filter — lives alongside the existing per-column `⚡ Filter` panel. Both coexist; do NOT remove the per-column panel.*

- [ ] **`＋ Filter` button** placed on the **LEFT** side of toolbar, **before** the `flex:1` spacer — always visible
- [ ] Button accent: teal `A.a` when active/open, neutral `M.inputBd` otherwise
- [ ] Button shows count badge `[N]` of filters with a non-empty value
- [ ] Clicking when `advFilters.length === 0` → **auto-adds one blank row** (no empty panel)
- [ ] Toggling the button also **closes the sort panel** (`setShowAdvSorts(false)`)
- [ ] **`✕ Reset` button** shown between Filter + Sort and the spacer — only when `activeAdvFilterCount > 0 || isAdvSortActive`; clears both `advFilters` and `advSorts`

### State
```js
const [advFilters,     setAdvFilters]    = useState([]);
const [showAdvFilters, setShowAdvFilters] = useState(false);
// Each entry: { id: Date.now(), field: firstFieldKey, op: 'is', value: '' }
const activeAdvFilterCount = advFilters.filter(f => f.value !== '').length;
```

### Filter Operators (by field type)
```js
const FILTER_OPS = {
  cat: ['is', 'is not'],
  txt: ['contains', 'not contains', 'starts with'],
  num: ['=', '≠', '>', '<', '≥', '≤'],
};
```

### Field type detection
```js
function advFieldType(f) {
  if (!f) return 'txt';
  if (f.type === 'number' || f.type === 'currency') return 'num';
  if (f.type === 'select' || f.options?.length || f.opts?.length) return 'cat';
  return 'txt';
}
```

### Evaluation function
```js
function evalAdvFilter(row, { field, op, value }, fields) {
  const f = fields?.find(x => x.key === field || x.col === field);
  const fType = advFieldType(f);
  const rv = row[field];
  if (fType === 'num') {
    const n = parseFloat(rv), v = parseFloat(value);
    if (isNaN(n) || isNaN(v)) return true;
    return op==='='?n===v : op==='≠'?n!==v : op==='>'?n>v : op==='<'?n<v : op==='≥'?n>=v : n<=v;
  }
  if (fType === 'txt') {
    const s = String(rv||'').toLowerCase(), v = String(value||'').toLowerCase();
    return op==='contains'?s.includes(v) : op==='not contains'?!s.includes(v) : s.startsWith(v);
  }
  return op === 'is' ? rv === value : rv !== value;
}
```

### Panel UI
- [ ] Panel renders below toolbar when `showAdvFilters` is true
- [ ] Background `M.surfHigh`, bottom border `M.divider`, `flexShrink: 0`
- [ ] Each row: `Where / And` label (9px, `M.textD`) + **field select** (teal `#0e7490`, `#f0fdfa` bg) + **op select** + **value** (input or select for `cat` type) + `×` remove button
- [ ] `Where` label for row index 0; `And` for all others
- [ ] **`＋ Add another filter`** link at bottom (teal, no border, `marginLeft: 40`)
- [ ] When field changes → auto-reset op to first valid op + clear value
- [ ] Apply to `filtered` useMemo — after per-column `filters`, skip rows where `value === ''`

### Helpers
```js
const addAdvFilter    = () => setAdvFilters(p => [...p, { id: Date.now(), field: allFields[0]?.key, op: 'is', value: '' }]);
const removeAdvFilter = (id) => setAdvFilters(p => p.filter(f => f.id !== id));
const updateAdvFilter = (id, patch) => setAdvFilters(p => p.map(f => {
  if (f.id !== id) return f;
  const merged = { ...f, ...patch };
  if (patch.field && patch.field !== f.field) {
    const ft = advFieldType(allFields.find(x => x.key === patch.field));
    merged.op = FILTER_OPS[ft]?.[0] || 'is'; merged.value = '';
  }
  return merged;
}));
```

## §RECORDS-H — Multi-Mode Advanced Sort Panel (Layout View style)

*10-mode sort — lives alongside the existing `⇅ Sort` SortPanel. Both coexist.*

- [ ] **`↑ Sort` button** placed on LEFT of toolbar (after `＋ Filter`), before `flex:1` spacer
- [ ] Button accent: purple `#7C3AED` when active/open
- [ ] Shows count badge `[N]` when `advSorts.length > 0`
- [ ] Clicking when empty → **auto-adds one blank row**
- [ ] Toggling closes the filter panel (`setShowAdvFilters(false)`)

### State
```js
const [advSorts,     setAdvSorts]    = useState([]);
const [showAdvSorts, setShowAdvSorts] = useState(false);
const isAdvSortActive = advSorts.length > 0;
```

### 10 Sort Modes (mandatory — all must be available in dropdown)
```js
const SORT_MODES = [
  { value: 'a_z',       label: 'A → Z'                },
  { value: 'z_a',       label: 'Z → A'                },
  { value: 'nil_first', label: 'Nil / Empty First'     },
  { value: 'nil_last',  label: 'Nil / Empty Last'      },
  { value: 'freq_hi',   label: 'Most Frequent First'   },
  { value: 'freq_lo',   label: 'Least Frequent First'  },
  { value: 'num_lo',    label: 'Lowest → Highest'      },
  { value: 'num_hi',    label: 'Highest → Lowest'      },
  { value: 'val_first', label: 'Value is… First'       },
  { value: 'val_last',  label: 'Value is… Last'        },
];
```

### Sort Engine
```js
function applyAdvSort(arr, advSorts, freqMaps) {
  if (!advSorts.length) return arr;
  return [...arr].sort((a, b) => {
    for (const s of advSorts) {
      const av = a[s.field]??'', bv = b[s.field]??'';
      const ae = av===''||av==null, be = bv===''||bv==null;
      let cmp = 0;
      if      (s.mode==='nil_first') { if(ae!==be) cmp=ae?-1:1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='nil_last')  { if(ae!==be) cmp=ae?1:-1;  else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='freq_hi')   { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fb-fa; }
      else if (s.mode==='freq_lo')   { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fa-fb; }
      else if (s.mode==='num_lo')    cmp=parseFloat(av||0)-parseFloat(bv||0);
      else if (s.mode==='num_hi')    cmp=parseFloat(bv||0)-parseFloat(av||0);
      else if (s.mode==='val_first') { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm) cmp=am?-1:1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='val_last')  { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm) cmp=am?1:-1;  else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='z_a')       cmp=String(bv).localeCompare(String(av),undefined,{sensitivity:'base'});
      else                           cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'});
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}
```

### Frequency maps (required for freq_hi/freq_lo modes)
```js
const freqMaps = useMemo(() => {
  const m = {};
  allFields.forEach(f => {
    const counts = {};
    rows.forEach(r => { const v = String(r[f.key]??''); counts[v] = (counts[v]||0) + 1; });
    m[f.key] = counts;
  });
  return m;
}, [rows, allFields]);
```

### Panel UI
- [ ] Each row: `Sort / Then` label + **field select** (purple bg) + **mode select** (10 options) + **optional value** input (only for `val_first`/`val_last`) + `×` remove (only when >1 row)
- [ ] `Sort` label for index 0; `Then` for all others
- [ ] **`＋ Add another sort`** link at bottom (purple)
- [ ] Field/mode change resets value to `''`
- [ ] Applied in `sorted` useMemo AFTER the existing `applySort(filtered, sorts)` call

### Sorted useMemo pattern
```js
const sorted = useMemo(() => {
  const base = applySort(filtered, sorts, schema);    // existing column-click sort
  if (!advSorts.length) return base;
  const fMaps = {}; /* build freq maps */
  return applyAdvSort(base, advSorts, fMaps);
}, [filtered, sorts, advSorts]);
```

## §RECORDS-I — Combined Filter + Sort Summary Strip

*Single persistent row just above the table — always visible when any filter or sort is active.*

- [ ] Strip shows when `Object.values(filters).some(v=>v) || activeAdvFilterCount > 0 || isAdvSortActive`
- [ ] Uses IIFE pattern `{(() => { ... return <div>...</div>; })()}` for inline logic
- [ ] Background `M.surfHigh`, bottom border `M.divider`, `flexWrap: 'wrap'`

### Layout (left to right)
```
[FILTERED: label]  [col chip ×]...  [adv chip ×]...  |divider|  [SORT: label]  [sort chip ×]...  flex:1  [✕ Clear all]
```

- [ ] **FILTERED section** (teal `#0891B2`) shown when either per-column or adv filters active
  - Per-column chips: `Field contains value ×` — clicking × does `setFilters(p => {delete p[key]; return {...p}})`
  - Adv filter chips: `Field op value ×` — clicking × calls `removeAdvFilter(id)`
  - Chip style: `rgba(8,145,178,.08)` bg, `rgba(8,145,178,.3)` border, `#0e7490` text
- [ ] **Thin `M.divider` separator** between FILTERED and SORT sections (only when both active)
- [ ] **SORT section** (purple `#7C3AED`) shown when `isAdvSortActive`
  - Sort chips: `Field mode [value]` — × only shown when `advSorts.length > 1`
  - Chip style: `rgba(124,58,237,.08)` bg, `rgba(124,58,237,.3)` border, `#7C3AED` text
- [ ] **`✕ Clear all`** pushed to far right — clears ALL three: `setFilters({})` + `setAdvFilters([])` + `setAdvSorts([])`

---
---

# ══════════════════════════════════════════════════════
# §DATA_ENTRY — Individual Data Entry Screen
# ══════════════════════════════════════════════════════

*One-record-at-a-time form entry with views, sections, and save confirmation.*

## §DATA_ENTRY-A — Layout Modes

- [ ] **Form mode**: 2-column responsive card grid, fields grouped by section
- [ ] **Inline mode**: dense label + value table (row per field) with search/filter
- [ ] Form / Inline toggle button in **top-right of tab bar**

### Form Mode — Section Collapsible Cards
- [ ] Each section renders as collapsible card with chevron toggle
- [ ] Section header: icon + title + field count + error count badge
- [ ] Open section: `A.a + "08"` tint bg on header
- [ ] Error border: `1px solid #ef4444` on section wrapper when section has errors
- [ ] Fields in 2-column grid; `textarea` spans full width (`gridColumn: "1 / -1"`)

### Inline Mode — Dense Row Table
- [ ] Sticky header row: bg `#CC0000`, white text
- [ ] Columns: COL · # · ICO · FIELD · TYPE · VALUE · STS
- [ ] Active row (clicked): accent tint bg `A.al`, left border `3px solid A.a`
- [ ] Auto fields: green `AUTO` status; read-only monospace value
- [ ] Filled fields: green `✓` status
- [ ] Error fields: red `!!` status, pink bg
- [ ] Required unfilled: amber `req` status
- [ ] Optional unfilled: muted `opt` status
- [ ] Field search bar at top of inline mode

## §DATA_ENTRY-B — Views Bar (Data Entry tab ONLY)

> **Guard**: `{tab === "entry" && <ViewsBarDiv />}` — never show on Records or Bulk tabs

- [ ] Views Bar in **Row 2** below tab buttons — separate `<div>`
- [ ] `VIEWS:` label on left
- [ ] **All Fields pill** always first — clears active view, shows total column count
- [ ] **System view pills** (📋 Full Entry, ⚡ Quick Entry):
  - Distinct styling: Full = gray, Quick = orange
  - No delete button
  - No rename
- [ ] **Custom view pills**: purple border, split compound button: `[Name | divider | ✏ Edit]`
- [ ] Active pill: filled `●` dot + stronger border + light tint background
- [ ] Activating already-active view → deactivates (returns to All Fields)
- [ ] Active view description chip on right: icon + description + "N of M fields"
- [ ] `+ New View` dashed button
- [ ] `🔖 Manage` button → opens ViewsPanel drawer

### System Views to Generate (per master, in `mkViews(master)`)
```js
// Always generated:
{ name:"Full Entry",  icon:"📋", color:"#6b7280", fields:allCols,  isSystem:true }
{ name:"Quick Entry", icon:"⚡",  color:"#E8690A", fields:mandCols, isSystem:true }

// Custom master-specific views pushed on top (isSystem:false)
// Examples from ARTICLE_MASTER:
{ name:"Pricing & Tax",  icon:"₹",  fields:["A","Q","R","S","T","U","V"] }
{ name:"Fabric Focus",   icon:"🧵", fields:["A","B","M","N","O","P"] }
{ name:"Item Identity",  icon:"👕", fields:["A","B","C","G","H","I","J","K","L","Y"] }
{ name:"Status & Tags",  icon:"🏷️", fields:["A","B","W","X","Y","Z"] }
```

## §DATA_ENTRY-C — Field Rendering Rules

- [ ] `auto` / `calc` / `autocode` fields → read-only input, placeholder `← GAS auto-fills` / `← GAS generates`
- [ ] Auto fields: accent-tinted background `A.al`, accent border, monospace font, `cursor:not-allowed`
- [ ] Mandatory (`req:true`) fields: `⚠ ` prefix on label, accent color label
- [ ] FK fields: `<select>` dropdown loading from FK data source
- [ ] Multi-FK fields: multi-select or tag-style FK picker
- [ ] Currency fields: `type="number" step="0.01"`, prefix `Rs`
- [ ] Textarea: `rows={3}`, `resize:vertical`
- [ ] Error state: `1px solid #ef4444` border + red error message below field

## §DATA_ENTRY-D — Footer Actions

- [ ] **Save to Sheet** button (`#CC0000`) — validates mandatory fields first
- [ ] **Clear / Reset** button — clears form data, resets errors
- [ ] Save opens **Confirm Save Modal** with record summary before committing
- [ ] Confirm modal header: `#CC0000` bg, record ID title
- [ ] Summary section: 2-column grid of filled field values (up to 10)
- [ ] Warning notice: "Saving writes one row to {SHEET}. Edit directly in GSheets to undo."
- [ ] Confirm modal actions: `← Edit` · `✅ Confirm & Save`

## §DATA_ENTRY-E — Guards

- [ ] **Unsaved changes guard modal** when:
  - Switching to a different master in sidebar
  - Switching tabs (Entry → Records or Bulk)
- [ ] Guard triggered ONLY when `formDirty === true`
- [ ] Guard modal actions: `← Stay & Keep Editing` · `🗑 Discard & Continue`
- [ ] Bulk variant shows dirty row count: "N row(s) with unsaved data in Bulk Master Entry"
- [ ] Guard modal tip: "Click ✓ Save to Sheet first to commit your record"

---
---

# ══════════════════════════════════════════════════════
# §BULK_ENTRY — Bulk / Spreadsheet Data Entry Screen
# ══════════════════════════════════════════════════════

*Multi-row spreadsheet-style entry with inline editing, all view features, and row state flags.*

## §BULK_ENTRY-A — Grid Structure

- [ ] Spreadsheet-style `<table>` with inline editing in every cell
- [ ] Checkbox column on left (for multi-row select/delete)
- [ ] Row number column (auto-increments, not editable)
- [ ] All data columns follow field definitions from master config
- [ ] Sticky header row (position:sticky, top:0)
- [ ] Minimum 3 empty rows pre-loaded on first mount
- [ ] **Add Row** button (`#CC0000`) appends a blank row with `__new: true`

## §BULK_ENTRY-B — Row State Flags

Every bulk row object must carry these flags:

| Flag | Meaning | Visual |
|---|---|---|
| `__id` | Stable unique row identity (uuid or timestamp) | — |
| `__new` | Added this session, not yet saved | Blue `#0078D4` left border |
| `__dirty` | Modified but not saved | Amber `#f59e0b` left border + yellow row bg |
| `error` | Failed mandatory validation | Red `#dc2626` left border + pink row bg |

```js
// New row template:
{
  __id: Date.now() + Math.random(),
  __new: true,
  __dirty: false,
  // ...all field cols empty
}
```

## §BULK_ENTRY-C — Inline Cell Editing

- [ ] Click on any non-auto cell → renders `<FieldInput>` inline in cell
- [ ] Auto / calc / autocode cells → read-only, accent tint
- [ ] Mandatory unfilled cells → red border + pink bg
- [ ] Tab key moves focus to next editable cell in same row
- [ ] Enter key commits edit and moves to next row, same column
- [ ] Escape key cancels edit without saving change
- [ ] Cell value saved into row on blur / Tab / Enter
- [ ] Row `__dirty` set to `true` on any edit

## §BULK_ENTRY-D — Toolbar Actions

- [ ] **+ Add Row** — appends blank row
- [ ] **✓ Save Changes** — validates all rows, saves dirty/new rows to GAS
- [ ] **🗑 Delete Selected** — removes checked rows (with confirmation)
- [ ] **⬆ Import CSV** — paste/upload CSV to pre-fill rows
- [ ] **↕ Sort** button — opens SortPanel (shared with Records)
- [ ] **⊟ Columns** button — column visibility panel
- [ ] **Σ Agg** in tfoot with `hasCheckbox={true}`

## §BULK_ENTRY-E — Views System

Same as §RECORDS-A but for Bulk Entry state. State stored in:
```js
bulkViewState[masterId]  // current view state object
bulkTpls[masterId]       // saved template array
```

All view features apply: dirty detection, switch guard, inline rename, ViewEditModal 4 tabs, MODIFIED badge, 💾 Update View.

## §BULK_ENTRY-F — Two-Level Grouping in Bulk

Same as §RECORDS-B. Grouped rows still support inline editing within group sections.

## §BULK_ENTRY-G — Sort (Shared SortPanel)

- [ ] Same `<SortPanel>` component used in both Records and Bulk — do NOT duplicate
- [ ] Sort state stored separately per tab: `bulkViewState[id].sorts`

## §BULK_ENTRY-H — Σ Aggregation Footer

Same as §RECORDS-D but with `hasCheckbox={true}` to offset the checkbox column.

## §BULK_ENTRY-I — Unsaved Row Guard

- [ ] Triggered when navigating away with `(bulkRows[id]||[]).filter(r=>r.__dirty||r.__new).length > 0`
- [ ] Same guard modal as §DATA_ENTRY-E with bulk-specific message
- [ ] Tip in guard modal: "Fill all mandatory fields (marked ⚠) and click ✓ Save Changes"

## §BULK_ENTRY-J — Advanced Operator Filter (same as §RECORDS-G)

- [ ] **`＋ Filter` button** on LEFT of toolbar — teal `#0891B2` accent
- [ ] Renamed existing per-column filter button to **`Col Filter`** to distinguish from adv filter
- [ ] Same `FILTER_OPS` constants, `advFieldType()`, `evalAdvFilter()` pattern as §RECORDS-G
- [ ] Field defs derived from `allFields` excluding auto/calc fields
- [ ] Cat options from `f.opts` array (BulkEntry uses `opts`, Records uses `options`)
- [ ] Applied in `visRows` derivation AFTER per-column `filters` pass
- [ ] Panel renders below sort panel area with same `Where / And / ＋ Add another filter` UI

## §BULK_ENTRY-K — Multi-Mode Advanced Sort (same as §RECORDS-H)

- [ ] **`↑ Sort` button** on LEFT of toolbar — purple `#7C3AED` accent
- [ ] Renamed existing simple sort button to **`Col Sort`** to distinguish
- [ ] Same `SORT_MODES` (10 modes) and `applyAdvSort()` pattern as §RECORDS-H
- [ ] Applied in `visRows` derivation AFTER per-column `sorts` pass
- [ ] Panel renders below the adv filter panel

## §BULK_ENTRY-L — Combined Filter + Sort Summary Strip (same as §RECORDS-I)

- [ ] Exactly same strip layout as §RECORDS-I placed just above the data table
- [ ] Uses `M.hi` (BulkEntry theme token) instead of `M.surfHigh` for strip bg
- [ ] Uses `M.div` instead of `M.divider` for borders (BulkEntry uses shorter token names)
- [ ] Per-column filter chips use `advFieldDefs.find(x => x.key === col)?.label` for display
- [ ] `✕ Clear all` clears `setFilters({})` + `setAdvFilters([])` + `setAdvSorts([])`

---
---

# ══════════════════════════════════════════════════════
# §FIELD_SPECS — Field Types, Icons & Data Type Badges
# ══════════════════════════════════════════════════════

*Reference for all field types, their rendering, and icon convention.*

## §FIELD_SPECS-A — Field Object Shape

Every field in a master's `fields` array must follow this shape:

```js
{
  col:   "A",              // column letter or short ID — used as key everywhere
  ico:   "K",              // icon type (see §FIELD_SPECS-B)
  h:     "Article Code",  // display label
  type:  "manual",        // field type (see §FIELD_SPECS-C)
  req:   true,            // mandatory — blocked on save if empty
  auto:  false,           // GAS auto-fills — always read-only
  fk:    null,            // FK source name (e.g. "SUPPLIER", "HSN") or null
  opts:  [...],           // for dropdown type only — [{v, l}] array
  hint:  "...",           // helper text shown below field
}
```

## §FIELD_SPECS-B — Icon Convention (IcoLabel)

| ico value | Symbol | Color | Meaning |
|---|---|---|---|
| `"K"` | 🔑 | — | Primary Key |
| `"M"` | ⚠ | Red `#ef4444` | Mandatory user input |
| `"F"` | → | Blue `#2563eb` | FK (points to another master) |
| `"A"` | ← | Green `#059669` | Auto-filled by GAS |
| `"S"` | ⟷ | Accent `A.a` | Sync (bidirectional) |
| `"C"` | ∑ | Orange `#c2410c` | Calculated field |
| `"#"` | # | Purple `#6d28d9` | Auto-generated code |
| `"_"` | — | Muted `#9ca3af` | Optional plain field |

## §FIELD_SPECS-C — All Field Types + DtBadge Colors

| Type | Badge Label | Badge Colors (bg / text / border) | Behavior |
|---|---|---|---|
| `manual` | Manual | `#fff1f2` / `#9f1239` / `#fecdd3` | User types; monospace bold; validates uniqueness |
| `autocode` | AUTO # | `#ede9fe` / `#6d28d9` / `#c4b5fd` | GAS generates; always read-only |
| `calc` | Calc | `#fff7ed` / `#c2410c` / `#fed7aa` | Computed client-side; always read-only |
| `auto` | Auto | `#f0fdf4` / `#166534` / `#bbf7d0` | GAS auto-fills; always read-only |
| `fk` | FK | `#eff6ff` / `#1d4ed8` / `#bfdbfe` | `<select>` loading FK data source |
| `multifk` | Multi-FK | `#eef2ff` / `#4338ca` / `#c7d2fe` | Multi-select FK picker |
| `dropdown` | Dropdown | `#f0f9ff` / `#0369a1` / `#bae6fd` | `<select>` with static `opts` array |
| `text` | Text | `#fafafa` / `#374151` / `#e5e7eb` | Plain `<input type="text">` |
| `currency` | Rs | `#fefce8` / `#854d0e` / `#fde68a` | `<input type="number" step="0.01">`, prefix Rs |
| `number` | Number | `#f0fdf4` / `#166534` / `#bbf7d0` | `<input type="number">` |
| `url` | URL | `#f0fdfa` / `#0f766e` / `#99f6e4` | `<input type="url">` or text |
| `textarea` | Text Area | `#fafafa` / `#374151` / `#e5e7eb` | `<textarea rows={3} resize:vertical>` |

## §FIELD_SPECS-D — Auto-Compute Rules (computeAutos)

When a field changes, `computeAutos(masterId, col, val, data)` must fire and cascade:

- FK field change → auto-fill linked auto fields in same row
- Currency pair → compute markup % and margin %
- HSN FK change → auto-fill GST %
- Supplier FK change → auto-fill Supplier Name
- Color FK change → auto-fill Color Name

```js
// Pattern:
function computeAutos(mId, col, val, data) {
  const d = { ...data, [col]: val };
  const n = k => parseFloat(d[k]) || 0;
  // cascade rules per master...
  return d;  // return full updated data object
}
// Call on every onChange:
setFormData(prev => computeAutos(masterId, col, val, prev));
```

## §FIELD_SPECS-E — Validation Rules

- [ ] Mandatory (`req:true && !auto`) fields: block save, show `⚠` on label
- [ ] `manual` type: validate no CC- prefix; format check (e.g. 5249HP pattern)
- [ ] `autocode` type: never allow user to type — always GAS generated
- [ ] `currency` / `number`: parse as float; NaN → show error
- [ ] `fk`: if value not in FK options list → show warning (stale data)
- [ ] `url`: basic URL format check
- [ ] Error collection: `errors` object `{[col]: "error message"}` drives all visual error states

## §FIELD_SPECS-F — Resizable Sidebar / Panel (useDrag hook)

```js
function useDrag(init, min, max) {
  const [w, setW] = useState(init);
  const [drag, setDrag] = useState(false);
  const sx = useRef(0), sw = useRef(init);
  const onMouseDown = useCallback(e => {
    e.preventDefault(); setDrag(true);
    sx.current = e.clientX; sw.current = w;
  }, [w]);
  useEffect(() => {
    const mv = e => {
      if (!drag) return;
      setW(Math.min(max, Math.max(min, sw.current + (e.clientX - sx.current))));
    };
    const up = () => setDrag(false);
    if (drag) { window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up); }
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, [drag, min, max]);
  return { w, drag, onMouseDown };
}
```

---
---

# ══════════════════════════════════════════════════════
# §LAYOUT_VIEW — Layout View Tab
# ══════════════════════════════════════════════════════

*Multi-layout visual browser with 5 view modes, saved views system, group-by, filter/sort, detail modal, and Max View.*
*Source implementation: `ArticleMasterLayoutPanel` in `ArticleMasterTab.jsx`*
*Full rules reference: `CC_ERP_LAYOUT_VIEW_RULES.md`*

## §LAYOUT_VIEW-A — Two Exports, One File

- [ ] **Named export** `[Module]LayoutPanel` — injected into SheetWorkspace or host as an extra tab panel
- [ ] **Default export** `[Module]Tab` — standalone tab when module has its own dedicated screen
- [ ] Both share all constants, helpers, and sub-components defined in the same file
- [ ] Props signature: `{ M: rawM, A, uff, dff, canEdit = true, onEditRecord }`
- [ ] Always run `M` through `toM()` adapter — never use `rawM` directly anywhere
- [ ] `canEdit = true` (default) — `false` hides all edit buttons and shows 🔒 notices

## §LAYOUT_VIEW-B — Data & Schema Config (Module-Specific TODO Blocks)

### [TODO-LV-GROUPABLE] Groupable Fields (~9 fields)
```js
const GROUPABLE_FIELDS = [
  { key: "l1Division", label: "Division"   },
  { key: "l2Category", label: "Category"   },
  { key: "gender",     label: "Gender"     },
  { key: "season",     label: "Season"     },
  { key: "fitType",    label: "Fit Type"   },
  { key: "status",     label: "Status"     },
  // ... add module-specific groupable fields
];
```

### [TODO-LV-PRESETS] Group Presets (5–6 combinations)
```js
const PRESETS = [
  { label: "Div › Category",    l1: "l1Division", l2: "l2Category" },
  { label: "Gender › Category", l1: "gender",     l2: "l2Category" },
  { label: "Status › Div",      l1: "status",     l2: "l1Division" },
  // ... 2–3 more module-specific presets
];
```

### [TODO-LV-META] Group Color Metadata
- [ ] Define color+icon per group value for all primary dimensions (division, gender, season, status, etc.)
- [ ] `hashColor(str)` function with 12-color PALETTE for unknown/dynamic group values
- [ ] `getGroupMeta(field, value)` → `{ color, icon }` for any field/value combo

### [TODO-LV-SCHEMA] Detail Modal Schema
```js
const MODULE_LV_SCHEMA = [
  { key: 'code',   label: 'Record Code', mono: true, required: true },
  // ... all display fields
  { key: 'status', label: 'Status',      badge: true },
];
// badge: true  → render as status badge pill
// mono: true   → render in dff (data font)
// required: true → show red * in modal labels
```

### [TODO-LV-INIT-VIEWS] Initial Locked Views (2–3)
```js
const INIT_VIEWS = [
  { id: 'v_default', name: 'Default', icon: '🌳', color: '#0078D4', locked: true,
    layoutTab: 'classic', groupByL1: 'l1Division', groupByL2: 'l2Category',
    filters: [], sorts: [{ id: 1, field: 'code', mode: 'a_z', value: '' }], search: '',
    displayOpts: INIT_DISPLAY_OPTS, cardsGroupBy: '', cardsSubGroupBy: '' },
  { id: 'v_cards',  name: 'Cards',  icon: '▦', color: '#7C3AED', locked: true, layoutTab: 'cards',  ... },
  { id: 'v_matrix', name: 'Matrix', icon: '⊞', color: '#E8690A', locked: true, layoutTab: 'matrix', ... },
];
```

### [TODO-LV-DISPLAY] Display Options Init
```js
const INIT_DISPLAY_OPTS = {
  thumbnail: false,
  thumbSize: "md",         // "sm" | "md" | "lg"
  density: "summary",      // "summary" | "detail"
  showFields: {            // per-field visibility — set module-specific defaults
    code: true, status: true, /* ... */
  }
};
```

## §LAYOUT_VIEW-C — State (All Required)

| State | Init | Purpose |
|---|---|---|
| `layoutTab` | `"classic"` | Active layout tab ID |
| `groupByL1` | `"[primary field]"` | L1 group dimension |
| `groupByL2` | `"[secondary field]"` | L2 sub-group dimension |
| `displayOpts` | `INIT_DISPLAY_OPTS` | Properties panel options |
| `showPanel` | `false` | Properties panel open/close |
| `isMaxView` | `false` | Full page / Max View mode |
| `filters` | `[]` | Active filter rules array |
| `sorts` | `[{id,field,mode,value}]` | Active sort rules array |
| `search` | `""` | Global search string |
| `showFilters` | `false` | Filter rows expanded |
| `showSorts` | `false` | Sort rows expanded |
| `cardsGroupBy` | `""` | Cards-specific L1 group |
| `cardsSubGroupBy` | `""` | Cards-specific L2 group |
| `layoutViews` | `INIT_VIEWS` | All saved views array |
| `activeViewId` | `"v_default"` | Currently active view ID |
| `selectedArt` | `null` | Record open in detail modal |
| `showExport` | `false` | Export dropdown open |
| `showSaveModal` | `false` | Save New View modal open |

- [ ] `isViewDirty` — `useMemo` comparing current state vs active view snapshot via `JSON.stringify`
- [ ] `processedData` — `useMemo` applying search → filters → multi-sort to seed data
- [ ] `orgHierarchy` — `useMemo` building `[{label,color,icon,l2s:{}}]` tree from `processedData`

## §LAYOUT_VIEW-D — View System Helpers (All useCallback)

- [ ] `switchToView(viewId)` — restores all state from saved view snapshot (layoutTab, groupBy, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy). Collapses filter/sort panels.
- [ ] `saveCurrentToView()` — writes current state back into active view in layoutViews array
- [ ] `addNewView({ name, icon, color })` — creates new view with `id: v_${Date.now()}`, locked: false, captures current state. Switches to it.
- [ ] `deleteView(viewId)` — removes non-locked view. Falls back to `v_default` if deleted view was active.
- [ ] Escape key exits Max View (useEffect) — **only when `isMaxView && !selectedArt`**

## §LAYOUT_VIEW-E — Five Layout Tabs (Mandatory)

| ID | Label | Group By UI | Properties |
|---|---|---|---|
| `classic` | 🌳 Classic | Shared toolbar | Yes |
| `hierarchy` | ⟁ Hierarchy | Shared toolbar | Yes |
| `column` | ≡ Column | Shared toolbar | Yes |
| `cards` | ▦ Cards | Own group controls | Yes |
| `matrix` | ⊞ Matrix | Shared toolbar | No |

- [ ] `PROPS_VIEWS = ["classic","hierarchy","column","cards"]` — auto-close Properties when switching to `matrix`
- [ ] Group By UI in unified toolbar is **hidden** when `layoutTab === "cards"` (Cards manages own grouping)

## §LAYOUT_VIEW-F — UI Row Order (MANDATORY — never change this sequence)

```
Row 1 (top):  Sub-tab bar — Classic/Hierarchy/Column/Cards/Matrix + Export/Print/Max View/Properties
Row 2:        Views Bar   — VIEWS: label · view pills · + New View   (bg: #ffffff — always white)
Row 3:        Unified Toolbar — Search + Filter + Sort + Reset | ⊞ Group By L1 › L2 + Presets | count
Row 4:        Content Area — the active layout view render
```

## §LAYOUT_VIEW-G — Sub-tab Bar (Row 1)

- [ ] Background: `M.thd`
- [ ] Left: 5 layout tab buttons — active uses `A.a` border + `A.al` bg + `A.a` text + weight 900
- [ ] Right (marginLeft: auto): Export dropdown → Print → ⛶ Max View → ⚙ Properties
- [ ] Export dropdown: "📄 Export CSV" + "🖨 Print / PDF"
- [ ] Print: `window.print()`
- [ ] Max View: `⛶ Max View` ↔ `⊡ Restore` — active state uses `A.a` colors
- [ ] Properties: only shown when `propsSupported`. Shows dot indicator when non-default opts active.

## §LAYOUT_VIEW-H — Views Bar (Row 2) — Color Rules

- [ ] **Background: `#ffffff` — always solid white, never a theme surface color**
- [ ] `VIEWS:` label: `fontSize: 8.5, fontWeight: 900, color: M.tD, textTransform: "uppercase", letterSpacing: 0.8`
- [ ] **Default / Locked pills — CC Red `#CC0000`**:
  - Active border: `1.5px solid #CC0000`
  - Inactive border: `1.5px solid #CC000055`
  - Active bg: `#fff0f0` / Inactive bg: `transparent`
  - Text: `#CC0000` (active) / `M.tB` (inactive)
  - Always shows `LOCKED` badge: `{ bg: "#f3f4f6", color: "#6b7280" }`
  - MODIFIED badge when dirty: `{ bg: "#fef3c7", color: "#92400e" }`
  - **No delete button** — locked views cannot be removed
- [ ] **User-created view pills — Purple `#7C3AED`**:
  - Active border: `1.5px solid #7C3AED`
  - Inactive border: `1.5px dashed #c4b5fd`
  - Active bg: `#f5f3ff` / Inactive bg: `transparent`
  - Text: `#7C3AED` (active) / `M.tB` (inactive)
  - No LOCKED badge
  - MODIFIED badge when dirty (same amber colors)
  - When `active + dirty + non-locked` → inline `💾 Update View` button: `border: 1px solid #7C3AED, bg: #f5f3ff, color: #7C3AED`
  - Has delete `×` button (14×14 transparent)
- [ ] **`+ New View` button**: `border: "1.5px dashed #c4b5fd", bg: "#fdf4ff", color: "#7C3AED"` — matches Records tab `+ Save View`

## §LAYOUT_VIEW-I — Unified Toolbar (Row 3 — ONE row only)

- [ ] **Single row** — never two separate rows for Group By + Filter/Sort
- [ ] Background: `M.hi`
- [ ] **Left cluster**: 🔍 Search input (140–160px) + ⊞ Filter (count badge) + ↕ Sort + ✕ Reset
- [ ] **Divider**: `{ width: 1, height: 16, background: M.div }`
- [ ] **Right cluster** (hidden when `layoutTab === "cards"`): `⊞ Group By` label → L1 select → `›` → L2 select → divider → preset pills
- [ ] **Count** (far right): "N groups · M / T records"
- [ ] **Expandable filter rows** below toolbar: field + operator + value + (×)
- [ ] **Expandable sort rows** below toolbar: field + mode + (×)
- [ ] Filter operators by type: `cat: ['is','is not','contains','starts with']` / `txt: ['contains','not contains','starts with']` / `num: ['=','≠','>','<','≥','≤']`; `evalFilter` must handle all `cat` text ops too
- [ ] Sort modes: `a_z, z_a, nil_first, nil_last, freq_hi, freq_lo, num_lo, num_hi, val_first, val_last` (10 modes — consistent with §RECORDS-H)

## §LAYOUT_VIEW-J — Properties Panel (ViewOptionsPanel)

- [ ] Floating panel anchored to Properties button. Ref-based outside-click to close.
- [ ] Section 1: **Thumbnail** — toggle on/off + size selector (sm/md/lg) when on
- [ ] Section 2: **Density** — `summary` (2 lines) / `detail` (3 lines) segmented control
- [ ] Section 3: **Fields** — per-field toggle switches for all `DISPLAY_FIELDS`
- [ ] Active dot on Properties button when `thumbnail: true` OR `density !== "summary"`

## §LAYOUT_VIEW-K — Detail Modal (3-layout)

- [ ] Header background: **`A.a`** accent (orange/blue/etc — matches module accent)
- [ ] Header left: `📋` + "Record Detail" (13px, 900, white) + code subtitle (10px, white 75%)
- [ ] Header center: `▦ Card` | `≡ Table` | `{ } JSON` layout toggle
- [ ] Header right: `✏ Edit` (if `canEdit`) + `×` close
- [ ] When `canEdit = false`: show `🔒 Read Only` label instead of Edit
- [ ] **Card layout**: 2-col grid, uppercase labels, bordered value boxes. Mark long-text fields with `full: true` in `LV_SCHEMA`/`AM_SCHEMA` to span full width (`gridColumn: "1 / -1"`). Always apply to `desc`, `tags`, and any `textarea` field.
- [ ] **Table layout**: sticky FIELD/VALUE header, alternating `M.tev/tod` row colors
- [ ] **JSON layout**: dark `#0f172a` pre block + `⧉ Copy JSON` button with `✓ Copied!` feedback
- [ ] **Footer**: `‹ Prev | N/M | Next ›` + `🖨 Print` + `⬇ Export` + [spacer] + `Close` + `✏ Edit Record`
- [ ] Edit Record: calls `onEdit(record)` — **only** shown when `canEdit = true`
- [ ] When `canEdit = false`: show `🔒 No Edit Rights — Contact Admin` in footer instead

## §LAYOUT_VIEW-L — Max View (Full Page Mode)

- [ ] Outer wrapper switches between normal flex column and `position: fixed; inset: 0; zIndex: 1200; background: M.hi`
- [ ] Button label: `⛶ Max View` → `⊡ Restore` (in sub-tab bar right side)
- [ ] Escape key listener active only when `isMaxView && !selectedArt` (modal blocks Escape)

## §LAYOUT_VIEW-M — Edit Permissions (`canEdit` prop)

- [ ] `canEdit = true` (default): all edit entry points visible and functional
- [ ] `canEdit = false`: ALL edit buttons hidden, `🔒` notices shown
- [ ] Guard in `handleEdit`: `if (!canEdit) return;`
- [ ] `canEdit` must be checked in: panel-level handler + modal header + modal footer
- [ ] When used in SheetWorkspace: `handleEditFromLayout(art)` populates formData, switches to "entry" tab

## §LAYOUT_VIEW-N — Sub-components to Build

| Component | Purpose |
|---|---|
| `[Module]ListRow` | Item row for Classic/Column/Hierarchy — thumbnail + density-aware |
| `[Module]CoverCard` | Cover card for Cards/Column — thumbnail cover + hover glow |
| `[Module]Thumbnail` | Initials avatar (cover + inline modes) + real image if `imageLink` |
| `StatusBadge` | Colored pill from `STATUS_BG/TX` maps |
| `ViewOptionsPanel` | Floating Properties — thumbnail/density/fields |
| `ToggleSwitch` | Boolean pill toggle for ViewOptionsPanel |
| `SaveViewModal` | Name + icon + color picker for new views |
| `[Module]DetailModal` | 3-layout popup — Card/Table/JSON + Prev/Next + Print/Export + Edit |

## §LAYOUT_VIEW-O — Implementation Command Template

Use this exact wording when giving the implementation command for any new module:

```
IMPLEMENT LAYOUT VIEW FOR [MODULE NAME] FOLLOWING §LAYOUT_VIEW IN CC_ERP_MODULE_display_SKILL.md
AND CC_ERP_LAYOUT_VIEW_RULES.md.

[TODO-LV-GROUPABLE]:  [list field keys and labels]
[TODO-LV-PRESETS]:    [list 5-6 preset combinations L1/L2]
[TODO-LV-META]:       [list group values with hex colors and icons]
[TODO-LV-SCHEMA]:     [list all modal display fields with mono/badge/required flags]
[TODO-LV-INIT-VIEWS]: [list 2-3 default locked views with layoutTab and default groupBy]
[TODO-LV-DISPLAY]:    [list fields that default ON in showFields]

ALL OTHER RULES: FOLLOW §LAYOUT_VIEW EXACTLY —
row order, views bar colors, toolbar, modal, max view, edit permissions, toast system.
```

---
---

# ══════════════════════════════════════════════════════
# §DO_NOTS — Critical Anti-Patterns (Never Violate)
# ══════════════════════════════════════════════════════

| ❌ Never | ✅ Instead |
|---|---|
| Dropdown inside `<tfoot>` | `AggDropdown` as separate sibling outside `<table>` |
| `position:absolute` for table overlays | `position:fixed` + `getBoundingClientRect()` |
| `ReactDOM.createPortal` | Lift component to parent render tree |
| Sort state as `{col, dir}` only | Always full `{col, dir, type, nulls}` |
| Plain `localeCompare` sort | Type-aware null-safe sort engine (§RECORDS-C) |
| `subGroupBy` missing from dirty detection | Include in all 6 comparison paths |
| `subGroupBy` missing from template shape | Always store even if null |
| Views Bar on Records/Bulk tabs | Guard with `{tab === "entry" && ...}` |
| `DEFAULT_VIEW.colOrder` hardcoded | Always derive from `allCols` inside component |
| Name `"Default"` allowed in save/rename/dup | Block at all 4 entry points |
| SortPanel without `position:relative` on wrapper | Add `position:relative` to outer tab `<div>` |
| `computeAgg` without currency detection | Check `f?.type === "currency"` in `fmtAgg` |
| Aggregations on all rows | Always pass `visRows` (filtered) |
| Sub-group dropdown always visible | Only render when `groupBy` is set |
| Sub-group includes primary col | Filter: `.filter(f => f.col !== groupBy)` |
| Hardcoded hex colors in components | Always use `M.*` and `A.*` tokens |
| Separate SortPanel per tab | One shared `<SortPanel>` component |
| Starting from blank when rebuilding | Load existing state, make incremental edits only |
| Views Bar above Sub-tab bar | Sub-tab bar is ALWAYS Row 1 (top); Views Bar is ALWAYS Row 2 |
| Views Bar background using M.mid/M.lo | Always `#ffffff` — solid white, never a theme surface |
| Locked view pills using purple | Locked/Default pills use `#CC0000` CC Red only |
| User view pills using red | User-created views use `#7C3AED` purple only |
| + New View using solid border | Always `1.5px dashed #c4b5fd` with `#fdf4ff` background |
| Group By row as separate toolbar | Merge with Filter/Sort into ONE unified toolbar row |
| Group By shown in Cards view toolbar | Hide Group By cluster when `layoutTab === "cards"` |
| Escape key always exiting Max View | Guard: only exit when `isMaxView && !selectedArt` |
| Edit buttons shown when canEdit=false | Guard at panel + modal header + modal footer level |
| Modal header using M.thd/M.mid | Detail modal header ALWAYS uses `A.a` accent background |
| Two separate bars for toolbar | One row only — §LAYOUT_VIEW-I |
| isViewDirty as boolean state | isViewDirty must be `useMemo` comparing JSON.stringify snapshots |
| Cards groupBy lifted via context | Lift cardsGroupBy/cardsSubGroupBy to panel state, saved in view |

---
---

# ══════════════════════════════════════════════════════
# §EXTENSION — How to Add New Features in Future
# ══════════════════════════════════════════════════════

This section governs how to extend this skill file without breaking existing checklists.

## Adding a New Feature to an Existing Section

1. Add a new subsection `§SECTION-X` under the relevant parent section
2. Write the full checklist with `- [ ]` items
3. Add any code patterns / state shapes needed
4. Update the "Required Sections" table at the top if the feature applies to a specific screen type
5. Add the feature to §DO_NOTS if it has a known anti-pattern

## Adding a Completely New Screen Type

1. Create a new top-level section `§NEW_SECTION — Screen Type Name`
2. Add the new type to the "Required Sections" table at the top of this file
3. List which §COMMON sub-sections it inherits
4. Write all unique checklists for the new type

## Reserved Section Names for Future Use

| Section | Status | Planned Feature |
|---|---|---|
| `§LAYOUT_VIEW` | ✅ **Implemented** | Multi-layout visual browser (Classic/Hierarchy/Column/Cards/Matrix) |
| `§GANTT` | Planned | Timeline / Gantt view for production scheduling |
| `§KANBAN` | Planned | Card-based workflow view (e.g. PO status board) |
| `§CALENDAR` | Planned | Date-grid view for delivery / season planning |
| `§DASHBOARD` | Planned | Aggregated KPI tiles + mini charts |
| `§IMPORT` | Planned | CSV / Excel bulk import wizard |
| `§AUDIT` | Planned | Audit trail / change log viewer |
| `§PDF_PREVIEW` | Planned | Embedded PDF template preview pane |
| `§APPROVAL` | Planned | Multi-step approval workflow UI |

---

*End of CC_ERP_MODULE_display_SKILL.md — Version 2.0*
*Source: CC_ERP_MasterDataEntry.jsx + CC_ERP_VIEW_CREATION_UI_SKILL.md + ArticleMasterTab.jsx*
*Layout View: See CC_ERP_LAYOUT_VIEW_RULES.md for full rules + CC_ERP_MODULE_display_TEMPLATE.jsx for code*
*Maintained by: Saurav / Confidence Clothing ERP Project*
