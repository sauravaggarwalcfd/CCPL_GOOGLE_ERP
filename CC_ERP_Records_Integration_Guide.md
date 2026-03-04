# CC ERP — Records Page New Features · Integration Guide
**Target file:** `frontend/src/components/masters/RecordsTab.jsx`  
**Reference prototype:** `CC_ERP_ArticleMaster_Records_V2.jsx`  
**Scope:** Article Master (and any master using RecordsTab)

---

## What's New (vs existing RecordsTab)

| Feature | Old | New |
|---------|-----|-----|
| Views bar | Inline pills (savedViews only) | Single-row bar: system views + custom views + Filter + Sort + `+ New View` + `Manage` |
| System views | None | 4 locked views controlling visible columns |
| Custom views | Field visibility only | Column visibility + saved as before |
| Filter panel | Inline `showAdvFilters` dropdown rows | Right-side drawer with per-column dropdowns/search inputs |
| Sort panel | Inline `showAdvSorts` dropdown rows | Right-side drawer with presets + drag-to-reorder rules |
| Table/Split | Table only | `⊟ Table` / `◫ Split` segmented switcher in toolbar |
| Export | `showExportMenu` present | Standardised `⬇ Export` dropdown (PDF/Excel/GSheet/Print) |

---

## 1 — Views Bar (single row, replace existing)

### Where to add it
In `RecordsTab.jsx`, find the views pills section (currently renders `savedViews` as pill buttons inline in the sub-toolbar). **Replace that block** with the new single-row views bar.

### System Views — add constant at top of file

```js
// Add near the top of RecordsTab.jsx, after schema imports
const SYSTEM_VIEWS = [
  { id: 'sys_all',      name: 'All Columns',      icon: '⊞', color: '#64748b', isSystem: true,
    desc: 'Every column visible',
    cols: null },   // null = all columns
  { id: 'sys_overview', name: 'Article Overview',  icon: '👁', color: '#E8690A', isSystem: true,
    desc: 'Key identity + status at a glance',
    cols: ['imageLink','code','desc','shortName','sketchLink','l2Category','gender','season','status','tags'] },
  { id: 'sys_pricing',  name: 'Pricing & Tax',     icon: '₹',  color: '#15803d', isSystem: true,
    desc: 'Code + all pricing columns',
    cols: ['code','desc','wsp','mrp','markupPct','markdownPct','hsnCode','gstPct','status'] },
  { id: 'sys_fabric',   name: 'Fabric Focus',      icon: '🧵', color: '#6c3fc5', isSystem: true,
    desc: 'Fabric, colour, size columns',
    cols: ['code','desc','mainFabric','fabricName','colorCodes','sizeRange','status'] },
];
```

> **Note:** `cols: null` means no restriction — all schema columns shown. For other views, `cols` is an array of field keys.

### State additions (add to existing state block)

```js
// Add to existing state declarations in RecordsTab
const [sysViewId,    setSysViewId]    = useState('sys_all');
const [viewMode,     setViewMode]     = useState('table');  // 'table' | 'split'
const [showNewView,  setShowNewView]  = useState(false);
const [editingView,  setEditingView]  = useState(null);
const [showManage,   setShowManage]   = useState(false);
const [showSortPnl,  setShowSortPnl]  = useState(false);  // rename from showSortPanel
const [showFiltPnl,  setShowFiltPnl]  = useState(false);  // right-side panel (replaces showAdvFilters inline)
const [colFilters,   setColFilters]   = useState({});      // per-column key → value
```

### Column visibility derived from system view

```js
// Add derived computation after state declarations
const allFieldKeys = allFields.map(f => f.key);  // from existing schema
const activeSystemView = SYSTEM_VIEWS.find(v => v.id === sysViewId) || SYSTEM_VIEWS[0];

// visCols now has two layers: system view filter + user hidden columns
const sysVisKeys = useMemo(() => {
  if (!activeSystemView.cols) return new Set(allFieldKeys);
  return new Set(activeSystemView.cols);
}, [activeSystemView, allFieldKeys]);

// Existing visCols computation — prefix the hidden-col filter with the system view filter:
const visCols = useMemo(() =>
  (colOrder.length > 0 ? colOrder : allFieldKeys)
    .filter(k => sysVisKeys.has(k) && !hiddenC.includes(k))
    .map(k => allFields.find(f => f.key === k))
    .filter(Boolean),
  [colOrder, hiddenC, allFieldKeys, allFields, sysVisKeys]
);
```

### Views bar JSX — replace existing pills section

The views bar sits **between the main-tabs row and the sub-toolbar**, rendered only when `mainTab === "records"`. Find where the existing saved views pills are rendered and replace with:

```jsx
{/* ── Single Views Bar (Records tab only) ── */}
{mainTab === "records" && (
  <div style={{
    background: M.lo, borderBottom: `2px solid ${M.div}`,
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '0 12px', minHeight: 40, overflowX: 'auto', flexShrink: 0,
  }}>
    <span style={{ fontSize: 8, fontWeight: 900, color: M.tD,
      letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0, marginRight: 4 }}>
      VIEWS:
    </span>

    {/* System views */}
    {SYSTEM_VIEWS.map(v => {
      const isActive = sysViewId === v.id;
      return (
        <button key={v.id}
          onClick={() => setSysViewId(isActive ? 'sys_all' : v.id)}
          title={v.desc ? `${v.name} — ${v.desc}` : v.name}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 8, flexShrink: 0,
            cursor: 'pointer', transition: 'all .15s',
            border: `1.5px solid ${isActive ? v.color : M.div}`,
            background: isActive ? v.color + '18' : M.inputBg,
            fontFamily: uff,
          }}>
          <span style={{ fontSize: 11 }}>{v.icon}</span>
          <span style={{ fontSize: 9.5, fontWeight: isActive ? 900 : 700,
            color: isActive ? v.color : M.tB, whiteSpace: 'nowrap' }}>
            {v.name}
          </span>
          {isActive ? (
            <>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: v.color }}/>
              <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6,
                background: v.color + '22', color: v.color, fontWeight: 900 }}>
                {visCols.length}c
              </span>
            </>
          ) : (
            <span style={{ fontSize: 7, padding: '0 3px', borderRadius: 3,
              background: M.hi, color: M.tD, fontWeight: 900 }}>SYS</span>
          )}
        </button>
      );
    })}

    {/* Custom saved views */}
    {savedViews.map(v => {
      const isActive = activeViewName === v.name;
      const vc = v.color || A.a;
      return (
        <button key={v.name}
          onClick={() => handleViewClick(v.name)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 8, flexShrink: 0,
            cursor: 'pointer', transition: 'all .15s',
            border: `1.5px solid ${isActive ? vc : M.div}`,
            background: isActive ? vc + '18' : M.inputBg,
            fontFamily: uff,
          }}>
          <span>{v.icon || '📌'}</span>
          <span style={{ fontSize: 9.5, fontWeight: isActive ? 900 : 700,
            color: isActive ? vc : M.tB }}>{v.name}</span>
          {isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: vc }}/>}
          {viewDirty && isActive && (
            <span style={{ fontSize: 7, padding: '0 4px', borderRadius: 3,
              background: '#fef3c7', color: '#92400e', fontWeight: 900 }}>MODIFIED</span>
          )}
        </button>
      );
    })}

    {/* Separator */}
    <div style={{ width: 1, height: 22, background: M.div, flexShrink: 0, margin: '0 3px' }}/>

    {/* Filter button */}
    <button onClick={() => setShowFiltPnl(true)} style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
      borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: uff,
      border: `1.5px solid ${hasColFilter ? A.a : M.div}`,
      background: hasColFilter ? A.al : M.inputBg,
      color: hasColFilter ? A.a : M.tB,
      fontSize: 9.5, fontWeight: 800, transition: 'all .15s',
    }}>
      ⊟ Filter
      {hasColFilter && (
        <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 8,
          background: A.a, color: '#fff', fontWeight: 900 }}>ON</span>
      )}
    </button>

    {/* Sort button */}
    <button onClick={() => setShowSortPnl(true)} style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
      borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: uff,
      border: `1.5px solid ${sorts.length > 0 ? M.tA : M.div}`,
      background: sorts.length > 0 ? M.tA : M.inputBg,
      color: sorts.length > 0 ? '#fff' : M.tB,
      fontSize: 9.5, fontWeight: 800, transition: 'all .15s',
    }}>
      ↕ Sort
      {sorts.length > 0 && (
        <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 8,
          background: 'rgba(255,255,255,.25)', color: '#fff', fontWeight: 900 }}>
          {sorts.length}
        </span>
      )}
    </button>

    <div style={{ flex: 1 }}/>

    {/* + New View */}
    <button onClick={() => { setEditingView(null); setShowNewView(true); }} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
      borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: uff,
      border: `1.5px dashed ${A.a}`,
      background: A.al, color: A.a,
      fontSize: 9.5, fontWeight: 900, transition: 'all .15s',
    }}>
      + New View
    </button>

    {/* Manage */}
    <button onClick={() => setShowManage(true)} style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
      borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: uff,
      border: `1.5px solid ${M.div}`, background: M.inputBg, color: M.tB,
      fontSize: 9.5, fontWeight: 800, transition: 'all .15s',
    }}>
      Manage
    </button>
  </div>
)}
```

---

## 2 — Table / Split View Switcher

### Where to add it
Inside the sub-toolbar of RecordsTab (the row that has Search + Column Manager + Export). Add the segmented switcher **before** the Export button.

```jsx
{/* Table / Split switcher */}
<div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden',
  border: `1.5px solid ${M.div}`, flexShrink: 0 }}>
  {[
    { id: 'table', icon: '⊟', label: 'Table' },
    { id: 'split', icon: '◫', label: 'Split' },
  ].map(v => (
    <button key={v.id} onClick={() => setViewMode(v.id)} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '5px 11px', border: 'none', cursor: 'pointer',
      background: viewMode === v.id ? M.tA : M.inputBg,
      color:      viewMode === v.id ? '#fff' : M.tB,
      fontSize: 10, fontWeight: 900, transition: 'all .15s',
      borderRight: v.id === 'table' ? `1px solid ${M.div}` : 'none',
      fontFamily: uff,
    }}>
      <span style={{ fontSize: 12 }}>{v.icon}</span>{v.label}
    </button>
  ))}
</div>
```

### Conditional render (table vs split)

Replace the existing `<div style={{ flex:1, overflow:"auto" }}>` table wrapper with:

```jsx
{/* Content area — conditional on viewMode */}
{viewMode === 'split' ? (
  <SplitView
    sorted={processedRows}        // pass the already-filtered+sorted data
    schema={allFields}
    M={M} A={A} uff={uff} dff={dff}
    onEdit={row => { setEditRow(row); setShowAddForm(true); }}
  />
) : (
  <div style={{ flex: 1, overflow: 'auto' }}>
    {/* existing table JSX unchanged */}
  </div>
)}
```

### SplitView component — where to place it
Copy the `SplitView` function from `CC_ERP_ArticleMaster_Records_V2.jsx` into `RecordsTab.jsx` **above** the `export default function RecordsTab(...)` declaration.

**Prop adaptations needed** (the prototype uses hardcoded MOCK data — adapt these):

| Prototype | RecordsTab equivalent |
|-----------|----------------------|
| `sorted` (MOCK array) | `processedRows` (your filtered+sorted rows) |
| `effSel.imageLink` | `row[imageField]` — find the image field key from schema |
| `effSel.sketchLink` | `row[sketchField]` — find the sketch field key from schema |
| `onEdit(row)` | `setEditRow(row); setShowAddForm(true)` |
| Hardcoded tab content (details/pricing/fabric) | Render using schema fields grouped by section |

For **Article Master** the fields are known. For other masters, render the detail modal generically using `allFields`:

```jsx
// Generic detail content for non-AM masters
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 14px' }}>
  {allFields.filter(f => !f.hidden).map(f => (
    <div key={f.key} style={{ background: M.lo, borderRadius: 7, padding: '8px 12px',
      border: `1px solid ${M.div}`, gridColumn: f.type === 'textarea' ? '1/-1' : 'auto' }}>
      <div style={{ fontSize: 8, fontWeight: 900, color: M.tD,
        textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{f.label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: row[f.key] ? M.tA : M.tD }}>
        {row[f.key] || '—'}
      </div>
    </div>
  ))}
</div>
```

---

## 3 — Column Filter Panel (right-side drawer)

### Replace existing `showAdvFilters` inline block
The existing inline filter panel (the `{showAdvFilters && (...)}` block that expands below the toolbar) should be **kept as-is** for backward compatibility, OR replaced with the new right-side drawer below.

### Recommended: use BOTH
- Keep `showAdvFilters` for the existing advanced expression filter (field / operator / value)
- Add new `showFiltPnl` right-side drawer for the quick per-column filter (simpler, faster to use)

### Quick column filter state

```js
const hasColFilter = Object.values(colFilters).some(v => v && v !== 'all');

// Merge colFilters into processedRows filter chain:
const processedRows = useMemo(() => {
  let result = [...rows];

  // existing search filter
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(r => allFields.some(f => String(r[f.key] || '').toLowerCase().includes(q)));
  }

  // existing advFilters (keep unchanged)
  // ...

  // NEW: per-column quick filters
  Object.entries(colFilters).forEach(([key, val]) => {
    if (!val || val === 'all') return;
    const f = allFields.find(x => x.key === key);
    if (!f) return;
    // text-search for open-text fields, exact-match for enum fields
    const isEnum = f.type === 'select' || f.options;
    result = result.filter(r =>
      isEnum
        ? String(r[key] || '') === val
        : String(r[key] || '').toLowerCase().includes(val.toLowerCase())
    );
  });

  return result;
}, [rows, search, advFilters, colFilters, allFields]);
```

### FilterPanel component
Copy `FilterPanel` from `CC_ERP_ArticleMaster_Records_V2.jsx`.

**Adaptations needed:**

| Prototype prop | RecordsTab equivalent |
|---------------|----------------------|
| `data` | `rows` (your raw rows array) |
| `visCols` | `visCols` (your existing computed visible cols) |
| `colFilters` / `setColFilters` | same state from above |
| `C.slate` header color | `M.tA` |
| `C.orange` accent | `A.a` |
| `C.border` | `M.div` |
| `C.orangeSoft` | `A.al` |

**Add to JSX (near the end of RecordsTab return, beside other panels):**

```jsx
{showFiltPnl && (
  <FilterPanel
    data={rows}
    colFilters={colFilters}
    setColFilters={setColFilters}
    visCols={visCols}
    onClose={() => setShowFiltPnl(false)}
    M={M} A={A} uff={uff}
  />
)}
```

### Active filter chips strip
Add below the toolbar (before the table):

```jsx
{hasColFilter && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
    padding: '5px 12px', borderBottom: `1px solid ${M.div}`,
    background: M.hi, flexShrink: 0 }}>
    <span style={{ fontSize: 8.5, fontWeight: 900, color: A.a }}>⊟ Active filters:</span>
    {Object.entries(colFilters).filter(([, v]) => v && v !== 'all').map(([k, v]) => {
      const col = allFields.find(f => f.key === k);
      return (
        <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 8.5, padding: '2px 8px', borderRadius: 8,
          background: A.a + '18', color: A.a, fontWeight: 700 }}>
          <b>{col?.label}</b>: {v}
          <button onClick={() => setColFilters(p => ({ ...p, [k]: 'all' }))} style={{
            border: 'none', background: 'none', color: A.a, cursor: 'pointer',
            fontSize: 12, lineHeight: 1, padding: 0 }}>×</button>
        </span>
      );
    })}
    <button onClick={() => setColFilters({})} style={{ padding: '2px 8px', border: 'none',
      background: 'transparent', color: M.tD, fontSize: 8.5, cursor: 'pointer', fontWeight: 700 }}>
      Clear all
    </button>
  </div>
)}
```

---

## 4 — Sort Panel (right-side drawer)

The existing `showAdvSorts` inline panel should be replaced by `showSortPnl` right-side panel.

### SortPanel component
Copy `SortPanel` from `CC_ERP_ArticleMaster_Records_V2.jsx`.

**Adaptations needed:**

| Prototype | RecordsTab equivalent |
|----------|-----------------------|
| `COLS.filter(c=>c.sortable)` | `allFields.filter(f => !f.auto)` |
| `sorts` / `setSorts` | your existing `sorts` / `setSorts` |
| Sort state shape `{id, key, dir}` | Existing RecordsTab shape is `{col, dir, type, nulls}` — **keep existing shape**, just rename `key` → `col` in the panel, or adapter-map on apply |
| `C.*` color tokens | `M.*` and `A.*` tokens |

**Existing sort shape (keep this, don't change):**
```js
{ col: "code", dir: "asc", type: "auto", nulls: "last" }
```

**Add to JSX:**
```jsx
{showSortPnl && (
  <SortPanel
    sorts={sorts}
    setSorts={setSorts}
    allFields={allFields}
    onClose={() => setShowSortPnl(false)}
    M={M} A={A} uff={uff}
  />
)}
```

**Note:** The `⊟ Sort [N]` button in the sub-toolbar should open `setShowSortPnl(true)` instead of `setShowAdvSorts(true)`. You can keep `showAdvSorts` for backward compatibility and just add a new entry point.

---

## 5 — Export Dropdown (standardise)

The existing `showExportMenu` dropdown is already present. Confirm it has all 4 options:

```jsx
const EXPORT_OPTS = [
  { icon: '📄', label: 'Export as PDF',           sub: 'Formatted A4 layout',     fn: () => window.print() },
  { icon: '📊', label: 'Export as Excel (.xlsx)',  sub: 'Full sheet with all cols', fn: () => exportToExcel() },
  { icon: '📋', label: 'Copy to Google Sheet',     sub: 'Opens in new tab',         fn: () => exportToGSheet() },
  { icon: '🖨️', label: 'Print view',              sub: 'Browser print dialog',     fn: () => window.print() },
];
```

**GAS functions required** (in `APIGateway.gs` or module-specific GAS file):

```js
// Add to GAS — called via api.call('exportToGoogleSheet', { sheetKey, rows })
function exportToGoogleSheet(sheetKey, rows) { ... }

// Add to GAS — called via api.call('exportToExcel', { sheetKey, rows })
function exportToExcel(sheetKey, rows) { ... }
```

**Front-end export call pattern:**
```js
const exportToGSheet = async () => {
  setShowExportMenu(false);
  showToast('Creating Google Sheet…');
  try {
    const url = await api.call('exportToGoogleSheet', { sheetKey: sheet.key, rows: processedRows });
    window.open(url, '_blank');
    showToast('✓ Opened in Google Sheets');
  } catch (e) {
    showToast(`Error: ${e.message}`, 'error');
  }
};
```

---

## 6 — New View Modal & Manage Panel

### New View Modal
Copy `NewViewModal` from the prototype. This creates **custom column views** (same concept as existing `showViewEdit` modal in ViewBuilder).

**Decision — use existing or new?**
- The existing `ViewBuilder` component handles field visibility + sort + filter + group in one modal
- The new `NewViewModal` handles **column visibility only** (simpler)
- **Recommendation:** Keep existing `ViewBuilder` for full view editing. Use `NewViewModal` only for quick column-only views.

If you want to wire it to the existing view system:

```js
// When + New View is clicked:
setEditingView(null);    // existing state
setShowViewEdit({ mode: 'create' });  // opens existing ViewBuilder

// When Manage is clicked:
// Open existing ViewsPanel (already imported in SheetWorkspace)
// OR open new ManagePanel from prototype (self-contained)
```

### Simplest integration path
1. `+ New View` button → opens existing `setShowViewEdit({ mode: 'create' })` (zero new code)
2. `Manage` button → opens existing `setShowViewsPanel(true)` (zero new code)
3. New `ManagePanel` from prototype is optional — use only if you want the richer inline Edit/Duplicate/Delete UI

---

## 7 — File Diff Summary (what to add/change in RecordsTab.jsx)

```
ADDS:
  + SYSTEM_VIEWS constant (top of file)
  + sysViewId state
  + viewMode state ('table' | 'split')
  + showFiltPnl state
  + showSortPnl state
  + colFilters state
  + hasColFilter derived boolean
  + sysVisKeys useMemo
  + colFilters filter chain in processedRows useMemo
  + SplitView component (copy from prototype, adapt schema-driven)
  + FilterPanel component (copy from prototype, adapt M/A tokens)
  + SortPanel component (already exists — use showSortPnl to open it)
  + Views Bar JSX block (replace existing pill buttons)
  + Table/Split switcher in sub-toolbar
  + Active filter chips strip (below toolbar)
  + FilterPanel, SortPanel, ManagePanel in JSX render

CHANGES:
  ~ visCols useMemo — prepend sysVisKeys filter
  ~ processedRows useMemo — add colFilters step
  ~ '⊟ Filter' button → opens showFiltPnl (right panel) instead of inline showAdvFilters
  ~ '↕ Sort' button → opens showSortPnl (right panel) instead of inline showAdvSorts
  ~ Table render — wrap in {viewMode === 'table' ? <table...> : <SplitView...>}

KEEPS UNCHANGED:
  = All existing advFilters / advSorts state + logic
  = All existing savedViews / viewDirty / ViewBuilder / ViewsPanel wiring
  = All existing column drag / agg footer / grouping / detail modal
  = All GAS API calls (fetchRows, saveRow, deleteRow)
  = All M / A / uff / dff prop usage
  = All existing export menu structure
```

---

## 8 — Component Placement in SheetWorkspace

`RecordsTab` is rendered from `SheetWorkspace.jsx`:

```jsx
{mainTab === "records" && (
  <RecordsTab
    sheet={sheet}
    fileKey={fileKey}
    fileLabel={fileLabel}
    M={M} A={A} uff={uff} dff={dff} fz={fz} pyV={pyV}
    sheetCounts={sheetCounts}
  />
)}
```

**No changes needed in SheetWorkspace.** All new state (viewMode, sysViewId, colFilters, etc.) lives inside RecordsTab — fully self-contained.

**Views Bar positioning** — the new Views Bar renders inside RecordsTab itself (not in SheetWorkspace), unlike the Data Entry Views Bar which is rendered by SheetWorkspace above `DataEntryTab`. This keeps `RecordsTab` self-contained.

---

## 9 — Token Mapping Reference

| Prototype (`C.*`) | RecordsTab (`M.*` / `A.*`) |
|-------------------|---------------------------|
| `C.surface` | `M.lo` (surface/card bg) |
| `C.bg` | `M.bg` (page background) |
| `C.border` | `M.div` (divider/border) |
| `C.faint` | `M.hi` (hover/highlight bg) |
| `C.text` | `M.tA` (primary text) |
| `C.sub` | `M.tB` (secondary text) |
| `C.muted` | `M.tC` (muted text) |
| `C.dim` | `M.tD` (dimmed/placeholder) |
| `C.slate` | `M.tA` (dark = panel headers) |
| `C.orange` | `A.a` (accent color) |
| `C.orangeSoft` | `A.al` (accent light bg) |
| `C.purple` | `#6c3fc5` (hardcode, no M token) |
| `C.purpleSoft` | `#f0eeff` (hardcode) |
| `C.inputBg` | `M.inputBg` |
| `'Nunito Sans'` | `uff` prop |
| `'IBM Plex Mono'` | `dff` prop |

---

## 10 — Quick Implementation Order

Follow this order to avoid breaking existing functionality:

1. **Add SYSTEM_VIEWS constant** — no side effects, safe first step
2. **Add sysViewId state + sysVisKeys useMemo** — update visCols to use it
3. **Add viewMode state** — add the Table/Split switcher in toolbar, wrap table in conditional
4. **Copy SplitView component** — adapt props, test with existing data
5. **Add Views Bar JSX** — replace existing inline pills, wire sysViewId + existing savedViews
6. **Add colFilters state** — add to processedRows filter chain
7. **Copy FilterPanel component** — wire showFiltPnl + hasColFilter + chips strip
8. **Wire SortPanel** — add showSortPnl state, open from Sort button in views bar
9. **Test all existing features** — views dirty, switch guard, agg footer, grouping, detail modal
10. **Final check** — ensure M/A tokens are consistent, no hardcoded colors remaining

---

*End of CC_ERP_Records_Integration_Guide.md*
