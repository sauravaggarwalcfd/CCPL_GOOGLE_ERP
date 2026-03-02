# CC ERP — Bulk Master Entry
## Complete Feature Reference & Implementation Guide
**Version:** 1.0 | **Date:** 27 Feb 2026 | **File:** `CC_ERP_BulkEntry.jsx`

---

## 1. What This Is

`CC_ERP_BulkEntry.jsx` is a **standalone React component** for spreadsheet-style bulk data entry into any ERP master. It is self-contained — it includes every dependency it needs (no external imports beyond React).

It delivers:
- Spreadsheet grid with inline editing, row selection, sorting, filtering, grouping
- Notion-style saved view system with Default (locked) + user-created named views
- Two-level grouping (group + sub-group)
- Aggregation footer (13 functions per column)
- Notion-style Sort Panel with drag-reorder and type-aware engine
- Column visibility manager + drag-drop reorder
- Unsaved changes guard on master switch

---

## 2. File Contents Map

| Lines | What |
|---|---|
| 1 | React named imports |
| 3–50 | `MODES`, `ACC`, `VCOLS`, `VICONS`, `FK`, option constants |
| 51–72 | `mkViews()` — generates system views per master |
| 73–256 | `MASTERS[]` — 8 master definitions with fields + mockRecords |
| 257–304 | `computeAutos()` — field auto-computation (WSP→markup, code→HSN, etc.) |
| 305–320 | `useDrag()` — sidebar resize hook |
| 321–396 | `DT_MAP`, `DT_LABEL`, `DtBadge`, `IcoLabel`, `FieldInput` — field-type helpers |
| 568–590 | `AGG_OPTIONS` — 13 aggregation function definitions |
| 591–619 | `computeAgg()` — aggregation calculator |
| 620–634 | `fmtAgg()` — aggregation formatter (INR locale) |
| 635–640 | `AGG_COLORS` — per-function accent colors |
| 641–709 | `AggDropdown` — fixed-position dropdown component |
| 710–759 | `AggFooter` — pure `<tfoot>` row component |
| 760–1042 | `SortPanel` — right-side slide-over sort panel |
| 1920–1925 | `EMPTY_ROW()` — blank row factory |
| 1926–2636 | `BulkEntry` — main component |
| 2637–2859 | `ViewEditModal` — 4-tab view settings editor modal |
| 2860–2877 | `BulkCell` — inline editable cell component |
| 2878–end | `App` — standalone demo wrapper |

---

## 3. Component Signature

```jsx
<BulkEntry
  master={master}               // Master definition object (see §4)
  M={M}                         // Theme token object (MODES[key])
  A={A}                         // Accent token object (ACC[key])
  fz={fz}                       // Base font size (number, e.g. 13)
  pyV={pyV}                     // Row vertical padding (number, e.g. 6)
  rows={rows}                   // Row array from App state
  setRows={setRows}             // Row setter (proxied to App state)
  viewState={viewState}         // View config object | null
  setViewState={setViewState}   // View config setter
  templates={templates}         // Array of saved view objects
  onSaveTemplate={saveTpl}      // (tpl) => void — upsert by name
  onDeleteTemplate={delTpl}     // (name) => void — remove by name
/>
```

**All 11 props are required.**

---

## 4. Master Object Shape

```js
{
  id:     "ARTICLE_MASTER",         // unique string key
  label:  "Article Master",         // display name
  desc:   "Finished article master", // subtitle
  icon:   "👕",
  prefix: null,                      // null = manual code (e.g. 5249HP)
                                     // string = auto prefix (e.g. "RM-FAB-")
  fields: [
    {
      col:    "A",          // column code (single letter or short string)
      h:      "Article Code", // header label
      type:   "manual",     // see Field Types below
      req:    true,         // mandatory field
      auto:   false,        // auto-computed (read-only in grid)
      opts:   null,         // array of {v, l} for dropdown type
      fk:     null,         // FK target master id (for fk type)
      desc:   "...",        // field description
    },
    // ... more fields
  ],
  mockRecords: [            // initial demo data rows
    { A: "5249HP", B: "...", ... },
  ]
}
```

### Field Types

| `type` | Input | Notes |
|---|---|---|
| `manual` | Text input | Free text, often a code field |
| `text` | Text input | General text |
| `number` | Number input | Integer or float |
| `currency` | Number input | Formatted as ₹ |
| `dropdown` | `<select>` | Requires `opts: [{v,l}]` |
| `fk` | `<select>` | Requires `fk: "MASTER_ID"` — loads from FK map |
| `date` | Date input | ISO date string |
| `calc` | Read-only span | Auto-computed, never editable |
| `auto` | Read-only span | GAS-filled, never editable |

---

## 5. App-Level State to Provision

When embedding BulkEntry in any module, add these 3 state entries to App:

```js
const [bulkRows,      setBulkRows]      = useState({});  // { masterId: rowArray }
const [bulkViewState, setBulkViewState] = useState({});  // { masterId: viewStateObj }
const [bulkTpls,      setBulkTpls]      = useState({});  // { masterId: templateArray }
```

**Proxy the setters** so they key by masterId:

```js
// rows setter proxy
const setRows = (rs) => setBulkRows(prev => ({
  ...prev,
  [selId]: typeof rs === "function" ? rs(prev[selId] ?? initRows(master)) : rs
}));

// viewState setter proxy
const setVS = (vs) => setBulkViewState(prev => ({
  ...prev,
  [selId]: typeof vs === "function" ? vs(prev[selId] || null) : vs
}));

// template setters
const saveTpl = (tpl) => setBulkTpls(prev => ({
  ...prev,
  [selId]: [...(prev[selId]||[]).filter(t => t.name !== tpl.name), tpl]
}));
const delTpl = (name) => setBulkTpls(prev => ({
  ...prev,
  [selId]: (prev[selId]||[]).filter(t => t.name !== name)
}));
```

---

## 6. View State Object Shape

This is the full shape of `viewState` / `bulkViewState[masterId]`:

```js
{
  colOrder:       ["A", "B", "C", ...],   // ordered column codes
  hiddenC:        ["D", "E"],             // hidden column codes
  sorts:          [                       // sort rules
    { col: "A", dir: "asc", type: "auto", nulls: "last" }
  ],
  filters:        { "A": "polo", "B": "" }, // per-column text filter
  groupBy:        "G",                    // null if no grouping
  subGroupBy:     "H",                    // null if no sub-group
  activeViewName: "Default"              // name of active saved view
}
```

`viewState` starts as `null` — all values fall back to defaults when null.

---

## 7. Row Object Shape

```js
{
  // Internal flags (never saved to GAS/Sheet)
  __id:    1,         // unique stable identity (number, auto-assigned)
  __new:   true,      // added in this session, not yet saved
  __dirty: false,     // modified but not yet saved

  // Data fields match master.fields[].col keys
  A: "5249HP",
  B: "Classic Polo",
  C: "Active",
  // ...
}
```

**Row flag visual styling:**

| Flag | Left border color | Background |
|---|---|---|
| `__new` | `#0078D4` Blue | transparent |
| `__dirty` | `#f59e0b` Amber | yellow-tinted |
| error | `#dc2626` Red | pink-tinted |
| Normal | none | alternating even/odd |

---

## 8. Views System

### 8.1 DEFAULT VIEW — Always First, Always Locked

```js
const DEFAULT_VIEW = {
  name: "Default",
  __builtin: true,
  colOrder:   allCols,   // derived fresh from master.fields — never hardcoded
  hiddenC:    [],
  sorts:      [],
  filters:    {},
  groupBy:    null,
  subGroupBy: null,      // always include
};
```

**Rules:**
- Always rendered first in Views Bar with `LOCKED` badge
- No action buttons (no edit, duplicate, delete, rename)
- Shows `MODIFIED` amber badge when current state drifts from these defaults
- Name `"Default"` is **reserved** — blocked at all 4 mutation entry points:
  `saveTemplate`, `renameTemplate`, `commitTplEdit`, `dupTemplate`

### 8.2 Views Bar (Toolbar Row 2)

Appears as a distinct second row below the main action toolbar:

```
VIEWS: [🏠 Default  LOCKED] [MODIFIED?]  [● My View  MODIFIED  💾 Update]  [+ Save View]
```

| Element | Behaviour |
|---|---|
| `VIEWS:` label | Static, uppercase, purple accent |
| Default pill | Click → resets to Default state; `LOCKED` badge always present |
| `MODIFIED` badge | Amber, shown when `viewDirty && activeViewName === "Default"` |
| Custom view pill | Click → load view (with switch guard if currently dirty) |
| `MODIFIED` badge on custom | Shown when `viewDirty && isActive` |
| `💾 Update View` btn | Only visible when `viewDirty && isActive && !isDefault` |
| `✎` | Inline rename toggle |
| `✏` | Opens ViewEditModal (edit mode) |
| `⧉` | Opens ViewEditModal (duplicate mode, appends " (copy)") |
| `×` | Delete view; falls back to Default if it was active |
| `+ Save View` | Captures current state → opens ViewEditModal as new view |

### 8.3 View Dirty Detection

```js
const getViewDirty = () => {
  if (activeViewName === "Default") {
    return !(
      JSON.stringify(colOrder) === JSON.stringify(allCols) &&
      hiddenC.length === 0 &&
      sorts.length === 0 &&
      Object.values(filters).every(v => !v.trim()) &&
      groupBy === null &&
      subGroupBy === null        // ← must be here
    );
  }
  const saved = templates.find(t => t.name === activeViewName);
  if (!saved) return false;
  return (
    JSON.stringify(colOrder) !== JSON.stringify((saved.colOrder||allCols).filter(c=>allCols.includes(c))) ||
    JSON.stringify(hiddenC)  !== JSON.stringify(saved.hiddenC||[])  ||
    JSON.stringify(sorts)    !== JSON.stringify(saved.sorts||[])    ||
    JSON.stringify(filters)  !== JSON.stringify(saved.filters||{})  ||
    groupBy    !== (saved.groupBy||null)    ||
    subGroupBy !== (saved.subGroupBy||null)  // ← must be here
  );
};
const viewDirty = getViewDirty(); // recalculates every render
```

### 8.4 View Switch Guard Modal

Triggered by `tryLoadTemplate(tpl)` when `viewDirty && tpl.name !== activeViewName`:

```
┌─────────────────────────────────────────────┐
│ Unsaved View Changes                        │
│ You've changed view settings. What to do?   │
│                                             │
│ [💾 Save changes → Switch]                  │
│ [Discard changes → Switch]                  │
│ [← Stay on current view]                    │
└─────────────────────────────────────────────┘
```

### 8.5 Inline Rename

Click `✎` on any view pill → name text replaced by `<input>`:
- `Enter` or `onBlur` → commits rename
- `Escape` → cancels
- Blocks: empty name, name `"Default"`, duplicate names
- When renaming active view → `activeViewName` updates to match

### 8.6 ViewEditModal — 4 Sub-tabs

Opens for Edit (✏), Duplicate (⧉), and + Save View. Distinguishes modes via `originalName`:
- **Edit**: `originalName = t.name` (may rename)
- **Duplicate**: `originalName = null` (always creates new)
- **New**: `originalName = null` (always creates new)

| Tab | Contents |
|---|---|
| **⊟ Columns** | Toggle visibility per column (toggle pill) + ↑↓ reorder buttons |
| **↕ Sort** | Multi-level sort list with column picker + dir toggle + remove |
| **🔍 Filter** | Per-column text filter inputs with clear (×) per field |
| **⊞ Group** | Primary group radio buttons + conditional Sub-group section |

**Group tab — Sub-group section** only appears when a primary group is selected:
```
─ ─ ─ ─ ─ ─ ─ ─ (purple dashed divider)
↳ Sub-group within each group (optional)
  ○ No sub-grouping
  ○ [field options excluding primary group column]
```

### 8.7 Template Object Shape

```js
{
  name:       "My Custom View",     // string, unique; "Default" is reserved
  colOrder:   ["A","C","B",...],
  hiddenC:    ["D","E"],
  sorts:      [{ col:"A", dir:"asc", type:"auto", nulls:"last" }],
  filters:    {"A":"polo"},
  groupBy:    null,
  subGroupBy: null                  // always include even if null
}
```

---

## 9. Two-Level Grouping

### 9.1 State

Both `groupBy` and `subGroupBy` live in `viewState`:

```js
const groupBy    = vs.groupBy    ?? null;
const subGroupBy = vs.subGroupBy ?? null;
```

### 9.2 Toolbar Behaviour

- Primary `Group by` dropdown: always visible
- Sub-group dropdown: **only appears when `groupBy` is set**
- Sub-group options **exclude the primary group column**
- When primary group is cleared → `subGroupBy` is **auto-cleared** (`setSubGroupBy(null)`)
- Sub-group dropdown styled distinctly: purple border when active, green when idle

### 9.3 Data Structure

```js
const grouped = (() => {
  if (!groupBy) return [{ key:null, sub:[{ subKey:null, rows:visRows }] }];
  const map = {};
  visRows.forEach(r => {
    const k = String(r[groupBy] || "(blank)");
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return Object.entries(map).map(([key, rows]) => {
    if (!subGroupBy || subGroupBy === groupBy)
      return { key, sub:[{ subKey:null, rows }] };
    const smap = {};
    rows.forEach(r => {
      const sk = String(r[subGroupBy] || "(blank)");
      if (!smap[sk]) smap[sk] = [];
      smap[sk].push(r);
    });
    return { key, sub: Object.entries(smap).map(([subKey,rows])=>({ subKey,rows })) };
  });
})();
```

### 9.4 Table Header Rows

**Primary group header:**
```
│ [● 3 rows] Article Type: TEE-SHIRT                             │
```
- Background: `#1e293b` (dark slate)
- Text: `#f1f5f9` (white-ish), bold
- Count badge: red `#CC0000`
- Spans full `colSpan`

**Sub-group header:**
```
│    [● 2 rows] ↳ Status: Active                                 │
```
- Background: `#334155` (slightly lighter slate)
- `↳` prefix, 28px left padding indent
- Count badge: purple `#7C3AED`
- Spans full `colSpan`

---

## 10. Sort Panel

### 10.1 Architecture

`<SortPanel>` is a right-side slide-over overlay. It requires `position: relative` on the BulkEntry outer wrapper (already set).

```jsx
{showSortPanel && (
  <SortPanel
    sorts={sorts}
    setSorts={s => setViewState(p=>({...p, sorts:s}))}
    allFields={allFields}
    M={M} A={A}
    onClose={() => setShowSortPanel(false)}
  />
)}
```

### 10.2 Sort State Shape

```js
// Each sort rule — always use full shape:
{ col: "A", dir: "asc", type: "auto", nulls: "last" }

// dir:   "asc" | "desc"
// type:  "auto"    → detect from field type at runtime
//        "alpha"   → string localeCompare
//        "numeric" → parseFloat comparison
//        "date"    → Date object comparison
//        "length"  → String.length comparison
// nulls: "last"  → nulls/empty sort to bottom
//        "first" → nulls/empty sort to top
```

### 10.3 Panel Layout (top → bottom)

| Zone | Content |
|---|---|
| **Header** | Purple bg `#7C3AED`, `↕ Sort [N]` title, `✕ Clear all`, close `✕` |
| **Quick Presets** | `Name A→Z` · `Name Z→A` · `Code ↑` · `✕ Clear All` (one-click) |
| **Empty state** | Shown when no rules: `↕` icon + "No sort rules · Add a column below" |
| **Rules list** | One row per active sort rule |
| **Add rule** | `+ Pick a column to sort by…` select (only shows unused columns) |
| **Summary strip** | Bottom bar: pills showing full sort chain `①Name A→Z  ②Date Oldest` |

### 10.4 Sort Rule Row

```
[⠿ drag]  [① badge]  ["then by" if 2+]  [Column ▼]  [A→Z toggle]  [▼ adv]  [× remove]
└── Advanced row (toggles open per rule):
    [Sort type: Auto / Text / Number / Date / Length]
    [Empty values: Nulls last ● / Nulls first ○]
    [↑ ↓ priority shift buttons]
```

### 10.5 Direction Label (type-aware)

| Field type | Ascending label | Descending label |
|---|---|---|
| `numeric` / `currency` / `calc` | `1 → 9` | `9 → 1` |
| `date` | `Oldest` | `Newest` |
| `length` | `Shortest` | `Longest` |
| `text` / `manual` / `dropdown` / `fk` | `A → Z` | `Z → A` |

### 10.6 Drag-to-Reorder

- `draggable` on rule rows
- `onDragStart` → sets `dragIdx`
- `onDragOver` → sets `overIdx`, applies yellow border on target
- `onDrop` → reorders `sorts` array
- Dragged item: `opacity: 0.5`
- Drop target: left border `3px solid #f59e0b`

### 10.7 Header Column Click Sort

Clicking any column header cycles: `none → asc → desc → none`

```js
const handleHeaderSort = (col) => {
  const existing = sorts.find(s => s.col === col);
  if (!existing) {
    setSorts([...sorts, { col, dir:"asc", type:"auto", nulls:"last" }]);
  } else if (existing.dir === "asc") {
    setSorts(sorts.map(s => s.col===col ? {...s, dir:"desc"} : s));
  } else {
    setSorts(sorts.filter(s => s.col !== col));
  }
};
```

### 10.8 Sort Engine — Type-Aware + Null-Safe

```js
rs.sort((a,b) => {
  for (const {col,dir,type,nulls} of sorts) {
    const av=a[col], bv=b[col];
    const an=av==null||av==="", bn=bv==null||bv==="";
    if(an&&bn) continue;
    if(an) return nulls==="first"?-1:1;
    if(bn) return nulls==="first"?1:-1;
    const ft = type==="auto"||!type
      ? (() => {
          const f=allFields.find(x=>x.col===col);
          return ["currency","number","calc"].includes(f?.type)?"numeric"
               : f?.type==="date"?"date":"alpha";
        })()
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

## 11. Σ Aggregation Footer

### 11.1 Architecture — Critical Pattern

The aggregation dropdown **cannot** live inside `<tfoot>`. It is clipped by `overflow:auto` on the scroll container.

```
✅ CORRECT PATTERN:

<div style={{position:"relative", flex:1, overflow:"auto"}}>    ← scroll container
  <table>
    <thead>...</thead>
    <tbody>...</tbody>
    <AggFooter onCellClick={aggCellClick} ... />                 ← pure <tfoot>
  </table>
</div>                                                           ← end scroll container

{/* Siblings — outside scroll container */}
{aggOpenInfo && (
  <>
    <div onClick={()=>setAggOpenInfo(null)}
      style={{position:"fixed", inset:0, zIndex:9998}}/>        ← transparent backdrop
    <AggDropdown openInfo={aggOpenInfo} ... />                   ← position:fixed
  </>
)}
```

### 11.2 State

```js
const [aggState,    setAggState]    = useState({});   // { [col]: "sum" | "avg" | ... }
const [aggOpenInfo, setAggOpenInfo] = useState(null); // { col, top, left } | null

const aggCellClick = (col, el) => {
  if (aggOpenInfo?.col === col) { setAggOpenInfo(null); return; }
  if (!el) return;
  const r = el.getBoundingClientRect();
  setAggOpenInfo({
    col,
    top:  Math.max(8, r.top - 410),              // opens above button
    left: Math.min(r.left, window.innerWidth-230) // clamped to viewport
  });
};
```

### 11.3 AggFooter Props

```jsx
<AggFooter
  visRows={visRows}        // filtered rows only — aggregation reflects visible data
  visCols={visCols}        // visible columns only
  allFields={allFields}    // for type detection
  aggState={aggState}      // { [col]: fnKey }
  openCol={aggOpenInfo?.col || null}   // highlights the open cell
  onCellClick={aggCellClick}
  hasCheckbox={true}       // true = BulkEntry (checkbox col + # col)
                           // false = RecordsTab (# col only)
  M={M} A={A}
/>
```

### 11.4 All 13 Aggregation Functions

| Group | Key | Label | Works on |
|---|---|---|---|
| — | `none` | — | All (no aggregation) |
| **Count** | `count` | Count all | All |
| **Count** | `count_values` | Count values | All |
| **Count** | `count_empty` | Count empty | All |
| **Count** | `unique` | Unique values | All |
| **Calculate** | `sum` | Sum | Numeric |
| **Calculate** | `avg` | Average | Numeric |
| **Calculate** | `min` | Min | Numeric / Text |
| **Calculate** | `max` | Max | Numeric / Text |
| **Calculate** | `range` | Range (max−min) | Numeric |
| **Calculate** | `median` | Median | Numeric |
| **Percent** | `percent_filled` | % Filled | All |
| **Percent** | `percent_empty` | % Empty | All |

### 11.5 computeAgg

```js
function computeAgg(fn, rows, col, allFields) {
  const f        = allFields.find(x => x.col === col);
  const vals     = rows.map(r => r[col]);
  const nonempty = vals.filter(v => v != null && v !== "");
  const nums     = nonempty.map(v => parseFloat(v)).filter(n => !isNaN(n));

  switch(fn) {
    case "count":          return rows.length;
    case "count_values":   return nonempty.length;
    case "count_empty":    return vals.length - nonempty.length;
    case "unique":         return new Set(nonempty.map(v=>String(v))).size;
    case "sum":            return nums.length ? nums.reduce((a,b)=>a+b,0) : null;
    case "avg":            return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null;
    case "min":            return nums.length ? Math.min(...nums)
                                              : (nonempty.length ? nonempty.sort()[0] : null);
    case "max":            return nums.length ? Math.max(...nums)
                                              : (nonempty.length ? nonempty.sort().slice(-1)[0] : null);
    case "range":          return nums.length>=2 ? Math.max(...nums)-Math.min(...nums) : null;
    case "median": {
      if(!nums.length) return null;
      const s=[...nums].sort((a,b)=>a-b), m=Math.floor(s.length/2);
      return s.length%2 ? s[m] : (s[m-1]+s[m])/2;
    }
    case "percent_filled": return rows.length ? (nonempty.length/rows.length)*100 : null;
    case "percent_empty":  return rows.length ? ((rows.length-nonempty.length)/rows.length)*100 : null;
    default: return null;
  }
}
```

### 11.6 fmtAgg — Number Formatting (INR locale)

```js
function fmtAgg(fn, val, allFields, col) {
  if (val === null || val === undefined) return "—";
  const f = allFields.find(x => x.col === col);
  const isCur = f?.type === "currency";
  if (["percent_filled","percent_empty"].includes(fn)) return val.toFixed(1)+"%";
  if (typeof val === "number") {
    return isCur
      ? "₹"+val.toLocaleString("en-IN",{maximumFractionDigits:2})
      : val % 1 === 0
        ? val.toLocaleString("en-IN")
        : val.toLocaleString("en-IN",{maximumFractionDigits:2});
  }
  return String(val);
}
```

### 11.7 AGG_COLORS

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

### 11.8 AggDropdown Positioning

```js
// In aggCellClick():
const r = el.getBoundingClientRect();
setAggOpenInfo({
  col,
  top:  Math.max(8, r.top - 410),              // always opens above button
  left: Math.min(r.left, window.innerWidth-230) // clamped so it stays in viewport
});
```

The dropdown is `position:fixed` — it escapes all scroll containers.

### 11.9 Dropdown Structure

```
┌─────────────────────────────────────┐
│ [dark slate header]                 │
│  Field Name                [VALUE]  │  ← current value badge if active
│  column-code                        │
├─────────────────────────────────────┤
│  COUNT                              │  ← purple group header
│  ○ Count all                        │
│  ○ Count values                     │
│  ○ Count empty                      │
│  ○ Unique values                    │
│  CALCULATE                          │
│  ● Sum                   ₹1,23,456  │  ← active: colored left border + dot + value
│  ○ Average                          │
│  ○ Min / Max / Range / Median       │
│  PERCENT                            │
│  ○ % Filled / % Empty               │
├─────────────────────────────────────┤
│  [✕ Remove]        [Close]          │
└─────────────────────────────────────┘
```

---

## 12. Main Toolbar

### Row 1 — Action Buttons

```
[+ Add Row]  [🗑 Delete N]*  [✓ Save N Changes]*
                                      |  🔍 Filter  ↕ Sort [N]  ⊞ Group by ▼  ↳ Sub-group ▼*
                                      |  ⊟ Columns  |  N rows · M cols [✕ Clear All]*
```

Items marked `*` are **conditionally rendered**.

| Button | Condition | Action |
|---|---|---|
| `+ Add Row` | Always | Adds `EMPTY_ROW` to top of rows |
| `🗑 Delete N` | `selRows.size > 0` | Removes selected rows |
| `✓ Save N Changes` | `dirtyCount > 0` | Validates mandatory fields, saves dirty rows |
| `🔍 Filter` | Always | Toggles inline filter row |
| `↕ Sort [N]` | Always | Opens Sort Panel (badge shows count) |
| `⊞ Group by` | Always | Primary group dropdown |
| `↳ Sub-group by` | `groupBy !== null` | Sub-group dropdown |
| `⊟ Columns` | Always | Toggles column manager panel |
| `✕ Clear All` | Any filter/sort/group active | Resets everything |

### Row 2 — Views Bar

Always shown directly below Row 1:

```
VIEWS: [🏠 Default LOCKED]  [● My View MODIFIED 💾]  [+ Save View]
```

See §8 for full views system details.

---

## 13. Inline Editing (BulkCell)

```js
function BulkCell({ f, val, onChange, onBlur, M, A, fz }) {
  // f.type === "dropdown" → <select> with f.opts
  // f.type === "fk"       → <select> from FK[f.fk] options
  // f.auto || f.type==="calc" || f.type==="auto" → read-only <span>
  // everything else       → <input type="text|number|date">
}
```

**Editing flow:**
1. Click cell → cell enters edit mode, focused
2. Tab / Enter → move to next cell
3. Escape → cancel edit, revert value
4. Any change → sets `__dirty: true` on the row
5. Auto-computed fields re-run `computeAutos()` on blur of trigger fields

---

## 14. Mandatory Field Validation

```js
const saveDirty = () => {
  const dirtyRows = rows.filter(r => r.__dirty || r.__new);
  const errs = {};
  dirtyRows.forEach(r => {
    const missing = mandFields.filter(f => !String(r[f.col]||"").trim());
    if (missing.length) errs[r.__id] = missing.map(f => f.col);
  });
  if (Object.keys(errs).length) {
    setRowErrors(errs);
    showToast(`⚠ ${Object.keys(errs).length} row(s) missing mandatory fields`, "#dc2626");
    return;   // ← BLOCK save
  }
  // Clear flags, call GAS save
  setRows(prev => prev.map(r => ({...r, __dirty:false, __new:false})));
  setRowErrors({});
  showToast(`✅ ${dirtyRows.length} row(s) saved`);
};
```

- `mandFields = allFields.filter(f => f.req && !f.auto)`
- Rows with errors: red left border + red cell backgrounds on missing columns
- Clicking into a missing cell immediately clears that cell's error

---

## 15. Column Manager

Appears inline below toolbar when `showCM` is true:

```jsx
<div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
  {colOrder.map(col => {
    const hidden = hiddenC.includes(col);
    return (
      <button onClick={() => setHiddenC(p =>
        hidden ? p.filter(c=>c!==col) : [...p, col]
      )}>
        {col} {field.h}
        {hidden ? " 👁‍🗨" : " ✓"}
      </button>
    );
  })}
  <button onClick={() => setHiddenC([])}>Show All</button>
</div>
```

`visCols` is always derived: `colOrder.filter(c => !hiddenC.includes(c))`

---

## 16. Column Drag-Drop Reorder

```js
const [dragCol, setDragCol] = useState(null);
const [dropCol, setDropCol] = useState(null);

// On header <th>:
draggable
onDragStart={() => setDragCol(col)}
onDragOver={e => { e.preventDefault(); setDropCol(col); }}
onDrop={() => {
  setColOrder(prev => {
    const arr = [...prev];
    const fi = arr.indexOf(dragCol), ti = arr.indexOf(dropCol);
    arr.splice(fi,1); arr.splice(ti,0,dragCol);
    return arr;
  });
  setDragCol(null); setDropCol(null);
}}
style={{ borderLeft: dropCol===col && dragCol!==col
  ? "3px solid #f59e0b"   // ← amber drop indicator
  : "3px solid transparent" }}
```

---

## 17. Filter System

Toggle filter row with `showFilters` state. Adds a second `<tr>` under the header:

```jsx
{showFilters && (
  <tr>
    {visCols.map(col => (
      <td key={col}>
        <input
          value={filters[col]||""}
          onChange={e => setViewState(p => ({...p, filters:{...p.filters, [col]:e.target.value}}))}
          placeholder="Filter…"
        />
      </td>
    ))}
  </tr>
)}
```

Filtering logic:

```js
const visRows = (() => {
  let rs = [...rows];
  // 1. Apply text filters
  Object.entries(filters).forEach(([col, val]) => {
    if (!val.trim()) return;
    rs = rs.filter(r => String(r[col]||"").toLowerCase().includes(val.toLowerCase()));
  });
  // 2. Apply sort
  if (sorts.length) { /* type-aware sort engine */ }
  return rs;
})();
```

---

## 18. Unsaved Rows Guard

When user tries to switch master while dirty rows exist:

```js
const bulkDirty = rows.some(r => r.__dirty || r.__new);

const trySetMaster = (newId) => {
  if (bulkDirty) {
    setGuardModal({ newId });
  } else {
    setSelId(newId);
  }
};
```

Guard modal offers:
1. **Discard Changes → Switch** — removes all `__dirty` / `__new` rows, switches master
2. **Keep Changes (go back)** — closes modal, stays

---

## 19. Status Bar

Always visible at the bottom of the component:

```
N total · M visible · P cols shown  |  Sorted by: X, Y  |  Grouped: G → SG  |  N dirty
```

```jsx
<div style={{/* bottom bar */}}>
  <span>{rows.length} total · {visRows.length} visible · {visCols.length} cols</span>
  {sorts.length > 0 && (
    <span>Sorted: {sorts.map(s=>s.col).join(", ")}</span>
  )}
  {groupBy && (
    <span>Grouped: {groupByField.h}{subGroupBy ? " → "+subGroupByField.h : ""}</span>
  )}
  {dirtyCount > 0 && (
    <span style={{color:"#f59e0b"}}>{dirtyCount} unsaved</span>
  )}
</div>
```

---

## 20. EMPTY_ROW Factory

```js
const EMPTY_ROW = (master, id) => {
  const r = { __id: id, __new: true, __dirty: false };
  (master?.fields || []).forEach(f => { r[f.col] = ""; });
  return r;
};
```

New row ID is `Math.max(0, ...rows.map(r=>r.__id)) + 1`.

---

## 21. Color Reference

| Color | Hex | Used for |
|---|---|---|
| CC Red | `#CC0000` | Add Row button, Default view indicator, Save to Sheet |
| Purple | `#7C3AED` | Views, Sort panel header, sub-group badge, Σ AGG label, ViewEditModal |
| Amber | `#f59e0b` | MODIFIED badge, dirty row border, drag-drop indicator |
| Green | `#15803d` | Save confirmed toast, Sum/% Filled agg color |
| Blue | `#0078D4` | New row border, Count agg color |
| Orange | `#E8690A` | Average agg color |
| Red | `#dc2626` | Error rows, Delete button, missing mandatory cell |
| Group slate | `#1e293b` | Primary group header background |
| Sub-group slate | `#334155` | Sub-group header background |
| Sub-group divider | `#c4b5fd` | Dashed border in ViewEditModal Group tab |

---

## 22. Build Checklist — When Reusing in New Module

Copy this list and tick everything before considering the screen done:

### Core Grid
- [ ] EMPTY_ROW factory with `__id`, `__new`, `__dirty` flags
- [ ] `initRows()` from `master.mockRecords` with flags added
- [ ] `selRows` Set for row selection (checkboxes)
- [ ] `rowErrors` map `{[__id]: [col, col]}` for validation errors
- [ ] `visCols = colOrder.filter(c => !hiddenC.includes(c))`
- [ ] `visRows` applies filters then sort engine
- [ ] Header click cycles sort: none → asc → desc → remove

### Toolbar
- [ ] Row 1: Add Row · Delete N (conditional) · Save N (conditional) · Filter · Sort · Group · Sub-group (conditional) · Columns · stat · Clear All (conditional)
- [ ] Row 2: Views Bar (VIEWS: label + Default pill + user view pills + Save View)

### Views System
- [ ] `DEFAULT_VIEW` derived from `allCols` — never hardcoded
- [ ] Default pill shows `LOCKED` badge and `MODIFIED` when dirty
- [ ] Custom view pills: load / MODIFIED / 💾 Update / ✎ / ✏ / ⧉ / ×
- [ ] `getViewDirty()` checks all 6 fields including `subGroupBy`
- [ ] View switch guard modal with 3 options
- [ ] Inline rename: Enter/Escape/Blur, blocks "Default" and duplicates
- [ ] ViewEditModal: 4 tabs (Columns, Sort, Filter, Group)
- [ ] Group tab has conditional Sub-group section with purple dashed divider
- [ ] Template shape always includes `subGroupBy`

### Grouping
- [ ] Sub-group dropdown only shown when `groupBy !== null`
- [ ] Sub-group options exclude primary group column
- [ ] Auto-clear `subGroupBy` when primary group cleared
- [ ] Primary group header: `#1e293b` bg, red count badge
- [ ] Sub-group header: `#334155` bg, purple count badge, `↳` prefix, 28px indent
- [ ] Both headers span full `colSpan`

### Sort Panel
- [ ] Sort state uses `{col, dir, type, nulls}` — never `{col, dir}` only
- [ ] Direction labels are type-aware (1→9, Oldest, Shortest, A→Z)
- [ ] Advanced row per rule: type override + nulls first/last + priority ↑↓
- [ ] Drag-to-reorder with amber drop border
- [ ] Quick presets bar
- [ ] Active summary strip at bottom
- [ ] Sort engine is type-aware + null-safe (see §10.8)

### Aggregation Footer
- [ ] `AggFooter` is a pure `<tfoot>` — no dropdown inside it
- [ ] `AggDropdown` is a sibling outside the scroll container
- [ ] Backdrop `position:fixed inset:0 zIndex:9998` closes dropdown
- [ ] `getBoundingClientRect()` for dropdown positioning
- [ ] Dropdown opens upward (`top = r.top - 410`)
- [ ] Viewport clamp (`left = Math.min(r.left, window.innerWidth - 230)`)
- [ ] 13 functions in 3 groups (Count / Calculate / Percent)
- [ ] `computeAgg` handles numeric-only gracefully (returns `null` → shows `—`)
- [ ] `fmtAgg` uses `en-IN` locale for currency + ₹ prefix
- [ ] `AGG_COLORS` — each function has its own accent color
- [ ] `✕ Remove` button in dropdown footer (only shown when function is active)
- [ ] `hasCheckbox={true}` for BulkEntry (extra column offsets)

### Validation + Guards
- [ ] Mandatory field check on `saveDirty()`
- [ ] Error rows: red left border + pink cell bg on missing fields
- [ ] Clicking into missing cell clears that cell's error immediately
- [ ] Unsaved rows guard modal on master switch (Discard / Keep)

### Column Management
- [ ] Column visibility toggle panel (pill buttons)
- [ ] `Show All` button
- [ ] Drag-drop reorder with amber drop indicator on header
- [ ] `visCols` always derived, never stored separately

### GAS Integration (when connecting to backend)
- [ ] `saveDirty()` calls `google.script.run.withSuccessHandler().saveRows()`
- [ ] Row objects sent without `__id`, `__dirty`, `__new` flags stripped
- [ ] Received GAS response updates `__id` for new rows
- [ ] Error handler shows toast with error message

---

*End of CC_ERP_BulkEntry_SKILL.md — Version 1.0*
