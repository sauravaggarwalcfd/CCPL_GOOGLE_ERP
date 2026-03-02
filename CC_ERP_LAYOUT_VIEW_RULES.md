# CC ERP — LAYOUT VIEW SETUP RULES
### Master Reference Checklist for All Sections / All Modules
> Built from: Article Master (`ArticleMasterLayoutPanel` in `ArticleMasterTab.jsx`)
> Apply this exact structure whenever implementing a Layout View in any CC ERP module.

---

## SECTION 1 — COMPONENT STRUCTURE

### 1.1 Two Exports from One File
- **Default export** → Standalone tab (e.g., `ArticleMasterTab`). Used when the module has its own dedicated page.
- **Named export** → Panel component (e.g., `ArticleMasterLayoutPanel`). Used when another workspace (e.g., `SheetWorkspace`) injects the Layout View as an extra tab alongside Records / Data Entry / Bulk / Field Specs tabs.
- Both share all internal sub-components, constants, and helpers defined in the same file.

### 1.2 Standard Props Signature
```jsx
export function [Module]LayoutPanel({ M: rawM, A, uff, dff, canEdit = true, onEditRecord }) {}
export default function [Module]Tab({ M: rawM, A, uff, dff, canEdit = true }) {}
```
- `M` (rawM) — Theme token object, always run through `toM()` adapter before use.
- `A` — Accent color object: `A.a` = main accent, `A.al` = accent-light tint, `A.tx` = text on accent.
- `uff` — UI font family string.
- `dff` — Data/mono font family string.
- `canEdit` — Boolean (default `true`). Controls edit button visibility. Pass `false` for read-only users.
- `onEditRecord` — Callback `(record) => void`. Called when Edit Record is clicked in the detail modal.

### 1.3 Theme Adapter — `toM()`
Always include this at the top of the file. Maps verbose token names to short aliases:
```js
function toM(M) {
  return {
    ...M,
    sh: M.shellBg || M.surfHigh,  shBd: M.shellBd || M.divider,
    hi: M.surfHigh, mid: M.surfMid, lo: M.surfLow,
    hov: M.hoverBg, inBg: M.inputBg, inBd: M.inputBd,
    div: M.divider, thd: M.tblHead, tev: M.tblEven, tod: M.tblOdd,
    bBg: M.badgeBg, bTx: M.badgeTx,
    tA: M.textA, tB: M.textB, tC: M.textC, tD: M.textD,
    scr: M.scrollThumb, shadow: M.shadow,
  };
}
```

---

## SECTION 2 — DATA & SCHEMA RULES

### 2.1 Seed / Static Data
- Define `[MODULE]_SEED_DATA` as a const array of flat record objects.
- Each record must have a unique `code` field as primary key.
- Enrich derived fields via `.map()` immediately after seed data (e.g., `l1Category` derived from `l2Category`).

### 2.2 AM_SCHEMA (Detail Modal Schema) — 17 fields minimum
Define a separate `AM_SCHEMA` array for the detail modal display:
```js
const AM_SCHEMA = [
  { key: 'code',      label: 'Article Code', mono: true, required: true },
  { key: 'desc',      label: 'Description',              required: true },
  // ... all fields
  { key: 'status',    label: 'Status',  badge: true },
  { key: 'tags',      label: 'Tags'               },
];
```
- `mono: true` → render in `dff` (monospace/data font)
- `badge: true` → render as status badge pill
- `required: true` → show red asterisk `*` in detail modal labels

### 2.3 Records Table Fields — `AM_FIELDS`
Separate, shorter field list for the flat records table view:
```js
const AM_FIELDS = [
  { key: 'code',  label: 'Art Code', w: 90,  mono: true },
  { key: 'status',label: 'Status',   w: 90,  badge: true },
  // ...
];
```

### 2.4 Groupable Fields — `GROUPABLE_FIELDS`
Define which fields can be used as Group By L1 / L2 axes:
```js
const GROUPABLE_FIELDS = [
  { key: "l1Division", label: "Division" },
  { key: "l2Category", label: "Category" },
  { key: "gender",     label: "Gender"   },
  { key: "season",     label: "Season"   },
  { key: "status",     label: "Status"   },
  // ... up to ~9 fields
];
```

### 2.5 Group Presets — `PRESETS`
Define 5–6 common grouping combinations:
```js
const PRESETS = [
  { label: "Div › Category",   l1: "l1Division", l2: "l2Category" },
  { label: "Gender › Category", l1: "gender",    l2: "l2Category" },
  { label: "Season › Category", l1: "season",    l2: "l2Category" },
  { label: "Category › Fit",   l1: "l2Category", l2: "fitType"    },
  { label: "Status › Div",     l1: "status",     l2: "l1Division" },
];
```

### 2.6 Group Color Metadata
Define metadata per group value (color + icon):
- `DIVISION_META` — per L1 division
- `GENDER_META`, `SEASON_META`, `STATUS_META`, `FIT_META`, `SLEEVE_META`
- `hashColor(str)` function using a 12-color PALETTE for unknown group values
- `getGroupMeta(field, value)` — returns `{ color, icon }` for any groupable field/value combo

### 2.7 Display Options — `INIT_DISPLAY_OPTS`
```js
const INIT_DISPLAY_OPTS = {
  thumbnail: false,       // show/hide cover thumbnail
  thumbSize: "md",        // "sm" | "md" | "lg"
  density: "summary",     // "summary" | "detail"
  showFields: {           // per-field visibility toggles
    code: true, gender: true, season: true,
    fitType: true, wsp: true, mrp: true, status: true,
    // all others default false
  }
};
```

### 2.8 Filter System — `CARD_FIELDS` + `FILTER_OPS`
Define filterable fields with their type:
```js
const CARD_FIELDS = [
  { key: 'l1Division', label: 'Division', type: 'cat' },
  { key: 'wsp',        label: 'WSP ₹',   type: 'num' },
  // ...
];
const FILTER_OPS = {
  cat: ['is', 'is not', 'contains', 'starts with'],
  num: ['=', '≠', '>', '<', '≥', '≤'],
  txt: ['contains', 'starts with', 'is', 'is not'],
};
```

### 2.9 Sort System — Sort Modes
```js
const SORT_MODES = [
  { value: 'a_z',   label: 'A → Z' },
  { value: 'z_a',   label: 'Z → A' },
  { value: 'freq_h',label: 'Most frequent' },
  { value: 'freq_l',label: 'Least frequent' },
  { value: 'num_h', label: 'High → Low' },
  { value: 'num_l', label: 'Low → High' },
];
```
- `applyMultiSort(data, sorts, freqMaps)` — multi-level sort function
- `evalFilter(record, filter)` — single filter evaluation function

---

## SECTION 3 — STATE MANAGEMENT

### 3.1 Layout State
```js
const [layoutTab,      setLayoutTab]      = useState("classic");
const [groupByL1,      setGroupByL1]      = useState("l1Division");
const [groupByL2,      setGroupByL2]      = useState("l2Category");
const [displayOpts,    setDisplayOpts]    = useState(INIT_DISPLAY_OPTS);
const [showPanel,      setShowPanel]      = useState(false);   // Properties panel
const [isMaxView,      setIsMaxView]      = useState(false);   // Full page / Max View
```

### 3.2 Filter / Sort / Search State
```js
const [filters,     setFilters]     = useState([]);
const [sorts,       setSorts]       = useState([{ id: 1, field: 'code', mode: 'a_z', value: '' }]);
const [search,      setSearch]      = useState('');
const [showFilters, setShowFilters] = useState(false);
const [showSorts,   setShowSorts]   = useState(false);
```

### 3.3 Cards-specific Grouping (lifted to panel level for view capture)
```js
const [cardsGroupBy,    setCardsGroupBy]    = useState('');
const [cardsSubGroupBy, setCardsSubGroupBy] = useState('');
```

### 3.4 Views System State
```js
const INIT_VIEWS = [
  { id: 'v_default', name: 'Default', icon: '🌳', color: '#0078D4', locked: true,
    layoutTab: 'classic', groupByL1: 'l1Division', groupByL2: 'l2Category',
    filters: [], sorts: [{...}], search: '', displayOpts: INIT_DISPLAY_OPTS,
    cardsGroupBy: '', cardsSubGroupBy: '' },
  { id: 'v_cards',  name: 'Cards',  icon: '▦', color: '#7C3AED', locked: true, layoutTab: 'cards',  ... },
  { id: 'v_matrix', name: 'Matrix', icon: '⊞', color: '#E8690A', locked: true, layoutTab: 'matrix', ... },
];
const [layoutViews,   setLayoutViews]   = useState(INIT_VIEWS);
const [activeViewId,  setActiveViewId]  = useState('v_default');
const [selectedArt,   setSelectedArt]   = useState(null);
const [showExport,    setShowExport]    = useState(false);
const [showSaveModal, setShowSaveModal] = useState(false);
```

### 3.5 isViewDirty — Computed
```js
const isViewDirty = useMemo(() => {
  const av = layoutViews.find(v => v.id === activeViewId);
  if (!av) return false;
  const cur   = JSON.stringify({ layoutTab, groupByL1, groupByL2, filters, sorts, search,
    displayOpts: JSON.stringify(displayOpts), cardsGroupBy, cardsSubGroupBy });
  const saved = JSON.stringify({ layoutTab: av.layoutTab, groupByL1: av.groupByL1, ...av });
  return cur !== saved;
}, [layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy, layoutViews, activeViewId]);
```

---

## SECTION 4 — VIEW SYSTEM HELPERS

### 4.1 `switchToView(viewId)` — useCallback
Restores all panel state (layoutTab, groupBy, filters, sorts, search, displayOpts, cardsGroupBy) from the saved view snapshot.

### 4.2 `saveCurrentToView()` — useCallback
Writes current panel state back into the active view object in `layoutViews` array.

### 4.3 `addNewView({ name, icon, color })` — useCallback
Creates new view with `id: v_${Date.now()}`, `locked: false`, capturing current state. Switches to it immediately.

### 4.4 `deleteView(viewId)` — useCallback
Removes non-locked view. If deleted view was active, falls back to `v_default`.

### 4.5 Max View Escape Key — useEffect
```js
useEffect(() => {
  if (!isMaxView || selectedArt) return;
  const h = (e) => { if (e.key === 'Escape') setIsMaxView(false); };
  document.addEventListener('keydown', h);
  return () => document.removeEventListener('keydown', h);
}, [isMaxView, selectedArt]);
```
Rule: Escape exits Max View **only when no detail modal is open**.

---

## SECTION 5 — LAYOUT TABS (5 Views)

### 5.1 Five Layout Tabs — Always These Five
| ID | Label | Properties Panel |
|---|---|---|
| `classic` | 🌳 Classic | Yes |
| `hierarchy` | ⟁ Hierarchy | Yes |
| `column` | ≡ Column | Yes |
| `cards` | ▦ Cards | Yes |
| `matrix` | ⊞ Matrix | No |

`PROPS_VIEWS = ["classic", "hierarchy", "column", "cards"]`
Close Properties panel automatically when switching to `matrix`.

### 5.2 Classic View
- Accordion tree: L1 group → L2 subgroup → list of items
- Each group header: color dot + icon + L1 name + item count badge
- Each subgroup: indented with L2 name + count
- Each item row: uses `ArtListRow` component (thumbnail optional)
- Density: summary (2 lines) or detail (3 lines) via `displayOpts.density`

### 5.3 Hierarchy View
- Grid of L1 division columns, each with its own scroll
- Group header same style as Classic
- Items stacked inside column cards using `ArtListRow`

### 5.4 Column View
- Each L1 group = a horizontal column card
- Items rendered as `ArtCoverCard` (cover thumbnail style)

### 5.5 Cards View
- Flat grid of `ArtCoverCard` tiles, no mandatory grouping
- Cards View has its own independent groupBy controls (`cardsGroupBy`, `cardsSubGroupBy`)
- Group By UI hidden in the unified toolbar when `layoutTab === "cards"` (Cards view manages its own)
- Thumbnail cover: gradient initials avatar if no `imageLink`, real image if present
- Thumb sizes: sm (62px height) / md (90px) / lg (128px)
- Hover: border color changes to group accent color, box-shadow glow

### 5.6 Matrix View
- Cross-tab table: L1 groups as rows, L2 subgroups as column headers
- Cells: count badge + article codes list
- No Properties panel support

---

## SECTION 6 — UI LAYOUT (Row Order — Top to Bottom)

```
1. Sub-tab bar   (Classic / Hierarchy / Column / Cards / Matrix) + Export / Print / Max View / Properties
2. Views Bar     (VIEWS: | Default LOCKED | ...user views | + New View)
3. Unified Toolbar (Search + Filter + Sort + Reset | Group By L1 › L2 + Presets | count)
4. Content Area  (the active layout view)
```

**Rule: Sub-tab bar is always ROW 1 (top). Views Bar is always ROW 2.**

---

## SECTION 7 — SUB-TAB BAR (Row 1)

- Background: `M.thd` (table header colour)
- Left side: 5 layout tab buttons using `layoutBtnS(active)` style helper
  - Active: `A.a` border + `A.al` background + `A.a` text + fontWeight 900
  - Inactive: `M.div` border + transparent background + `M.tB` text + fontWeight 600
- Right side (marginLeft auto): Export dropdown | Print | Max View | Properties
- **Export button**: dropdown with "📄 Export CSV" + "🖨 Print / PDF"
- **Print button**: calls `window.print()`
- **Max View / Restore button**:
  - Label: `⛶ Max View` → `⊡ Restore`
  - Active state: `A.a` border + `A.al` background + `A.a` text + fontWeight 800
- **Properties button** (⚙ Properties): Only shown when `propsSupported`. Active dot indicator when non-default options are set.

---

## SECTION 8 — VIEWS BAR (Row 2) COLOR RULES

Background: **`#ffffff`** (always solid white — never theme mid/surface).

### 8.1 VIEWS: Label
```jsx
<span style={{ fontSize: 8.5, fontWeight: 900, color: M.tD, textTransform: "uppercase",
  letterSpacing: 0.8, fontFamily: uff, flexShrink: 0, marginRight: 2 }}>VIEWS:</span>
```

### 8.2 Default / Locked View Pills — CC Red `#CC0000`
- Border: `1.5px solid #CC0000` (active) / `1.5px solid #CC000055` (inactive)
- Background: `#fff0f0` (active) / `transparent` (inactive)
- Text color: `#CC0000` (active) / `M.tB` (inactive)
- Always shows `LOCKED` badge: `{ background: "#f3f4f6", color: "#6b7280" }`
- Shows `MODIFIED` amber badge when dirty: `{ background: "#fef3c7", color: "#92400e" }`
- No delete (×) button — locked views cannot be deleted

### 8.3 User-Created View Pills — Purple `#7C3AED`
- Border: `1.5px solid #7C3AED` (active) / `1.5px dashed #c4b5fd` (inactive)
- Background: `#f5f3ff` (active) / `transparent` (inactive)
- Text color: `#7C3AED` (active) / `M.tB` (inactive)
- No `LOCKED` badge
- Shows `MODIFIED` amber badge when dirty (same colors as above)
- When dirty + active + non-locked → shows inline **💾 Update View** button:
  ```jsx
  style={{ border: `1px solid #7C3AED`, borderRadius: "0 5px 5px 0", background: "#f5f3ff",
    color: "#7C3AED", fontSize: 9, fontWeight: 800 }}
  ```
- Has delete (×) button — small 14×14 transparent button

### 8.4 + New View Button — Purple Dashed
```jsx
style={{ padding: "3px 10px", border: "1.5px dashed #c4b5fd", borderRadius: 6,
  background: "#fdf4ff", color: "#7C3AED", fontSize: 9.5, fontWeight: 700 }}
```

### 8.5 Save View Modal
- Opens when `+ New View` clicked: `showSaveModal` state
- Fields: View Name (text input) + Icon picker (emoji grid) + Color picker (circle swatches)
- On save: calls `addNewView({ name, icon, color })`
- Available icons `VICONS`: 6–8 emoji options
- Available colors `VCOLORS`: 8–10 hex values from PALETTE

---

## SECTION 9 — UNIFIED TOOLBAR (Row 3)

**One single row** — no separate Group By bar + Filter/Sort bar.
Background: `M.hi` (surface high).

### 9.1 Left Cluster: Search + Filter + Sort + Reset
```
[🔍 Search input] [⊞ Filter (N)] [↕ Sort] [✕ Reset]
```
- Search: text input, 140–160px wide, searches code + desc + shortName + season + gender + division + category
- Filter button: shows count `(N)` when active filters exist. Active state: `A.a` accent color
- Sort button: highlighted when non-default sort is active
- Reset: clears all filters, sorts, search

### 9.2 Vertical Divider: `{ width: 1, height: 16, background: M.div }`

### 9.3 Right Cluster: Group By (hidden in Cards view)
```
[⊞ Group By] [L1 ▼ select] [›] [L2 ▼ select] | [Preset pills]
```
- Label: `⊞ Group By` — small uppercase muted text
- Two `<select>` dropdowns from `GROUPABLE_FIELDS`
- Separator `›` between L1 and L2 selects
- Preset pills: quick-select buttons, active state uses `A.a` accent
- Hidden when `layoutTab === "cards"` (Cards has its own group controls)

### 9.4 Count Display (far right)
```
"N groups · M / T articles"   or   "M articles (T total)"
```

### 9.5 Expandable Rows (below the toolbar row)
- **Filter rows**: each row = field select + operator select + value input + (×) remove
- **Sort rows**: each row = field select + mode select + (×) remove
- Both expand/collapse via chevron toggles

---

## SECTION 10 — PROPERTIES PANEL (ViewOptionsPanel)

Floating panel anchored to the Properties button. Closes on outside click.
Sections:
1. **Thumbnail** — Toggle on/off. When on: size selector (sm/md/lg)
2. **Density** — `summary` (2 lines) / `detail` (3 lines)
3. **Fields** — Per-field toggle switches for all `DISPLAY_FIELDS`

Implementation: `useRef(propsBtnRef)` + `document.addEventListener('mousedown', handler)` for outside-click close.

---

## SECTION 11 — DETAIL MODAL (`ArtDetailModal`)

### 11.1 Standard Modal Props
```jsx
function ArtDetailModal({ art, onClose, onPrev, onNext, artIndex, totalArts,
  onEdit, canEdit = true, M, A, uff, dff, fz }) {}
```

### 11.2 Header (always `A.a` accent background)
- Left: `📋` icon + "Record Detail" (13px, fontWeight 900, white) + subtitle (record code, 10px, white 75%)
- Center: Layout toggle: `▦ Card` | `≡ Table` | `{ } JSON`
- Right: `✏ Edit` button (if `canEdit`) + `×` close button
- When `canEdit = false`: show `🔒 Read Only` label instead of Edit

### 11.3 Three Layout Modes
| Mode | Description |
|---|---|
| `card` | 2-column grid. Uppercase label + bordered value box. Full-width for textarea fields. |
| `table` | Sticky-header FIELD / VALUE table. Alternating row colors `M.tev/tod`. |
| `json` | Dark `#0f172a` pre block. `⧉ Copy JSON` button with ✓ Copied! confirmation. |

### 11.4 Footer
```
[‹ Prev]  [N / M]  [Next ›]  |  [🖨 Print]  [⬇ Export]  [spacer]  [Close]  [✏ Edit Record]
```
- Prev/Next: navigate through filtered records list
- Print: `window.print()`
- Export: download as JSON (or CSV)
- Edit Record: calls `onEdit(art)` — only shown when `canEdit = true`
- When `canEdit = false`: shows `🔒 No Edit Rights — Contact Admin` notice instead of Edit button

### 11.5 Status Badge Colors (shared constants)
```js
const STATUS_BG = { Active: '#d1fae5', Development: '#fef3c7', Inactive: '#fee2e2', ... };
const STATUS_TX = { Active: '#065f46', Development: '#92400e', Inactive: '#991b1b', ... };
```

---

## SECTION 12 — MAX VIEW (Full Page Mode)

### 12.1 Outer Wrapper — Conditional Style
```jsx
<div style={isMaxView
  ? { position: 'fixed', inset: 0, zIndex: 1200, background: M.hi,
      display: 'flex', flexDirection: 'column', overflow: 'hidden' }
  : { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
```

### 12.2 Toggle Button (in Sub-tab bar right side)
- Label: `⛶ Max View` ↔ `⊡ Restore`
- Active: `A.a` border + `A.al` bg + `A.a` text + fontWeight 800
- Inactive: `M.div` border + transparent bg + `M.tB` text + fontWeight 600

### 12.3 Escape Key to Exit
- Only activates when `isMaxView = true` AND no detail modal is open (`!selectedArt`)
- `document.addEventListener('keydown', h)` with cleanup

---

## SECTION 13 — EDIT PERMISSIONS (`canEdit`)

### 13.1 Rules
- `canEdit = true` (default): Edit buttons visible throughout. Full edit functionality enabled.
- `canEdit = false`: All edit entry points suppressed. Shows `🔒 Read Only` / `🔒 No Edit Rights — Contact Admin` notices.
- **Never show an edit button for a user who lacks edit rights** — guard at both panel level AND modal level.

### 13.2 Where `canEdit` must be checked
1. Layout Panel — `handleEdit` function (guard: `if (!canEdit) return`)
2. `ArtDetailModal` — header Edit button
3. `ArtDetailModal` — footer Edit Record button
4. SheetWorkspace — `handleEditFromLayout` function

### 13.3 SheetWorkspace Integration
```jsx
const handleEditFromLayout = (art) => {
  if (!canEdit) return;
  const fd = {};
  enriched.fields.forEach(f => { if (art[f.key] !== undefined) fd[f.key] = art[f.key]; });
  setFormData(fd);
  setErrors({});
  setIsDirty(false);
  setMainTab("entry");
  setEntryMode("form");
};
<ArticleMasterLayoutPanel canEdit={canEdit} onEditRecord={handleEditFromLayout} />
```

---

## SECTION 14 — TOAST NOTIFICATION SYSTEM

```js
const TOAST_COLORS = { success: '#15803d', delete: '#dc2626', view: '#7C3AED', info: '#0078D4' };
```
- `useToast()` hook returns `{ toasts, add }`
- `add(message, color)` — shows toast for 2500ms, auto-dismisses
- `<Toasts toasts={toasts} />` — fixed bottom-right corner, `zIndex: 9999`
- Use `TOAST_COLORS.view` (purple) for view save/switch messages
- Use `TOAST_COLORS.success` (green) for record create/update
- Use `TOAST_COLORS.delete` (red) for delete actions

---

## SECTION 15 — SUB-COMPONENTS TO BUILD

| Component | Purpose |
|---|---|
| `[Module]ListRow` | Single item row renderer for Classic / Column / Hierarchy. Supports thumbnail + density. |
| `[Module]CoverCard` | Cover-card for Cards / Column views. Thumbnail cover + key fields + hover glow. |
| `[Module]Thumbnail` | Initials avatar fallback + real image. Cover mode (full-width) + inline mode (square). |
| `StatusBadge` | Colored pill for status field. Uses `STATUS_BG/TX` maps. |
| `ViewOptionsPanel` | Floating Properties panel. Thumbnail toggle + density + field visibility toggles. |
| `ToggleSwitch` | Pill toggle for boolean options in ViewOptionsPanel. |
| `SaveViewModal` | Modal for naming + icon + color of a new view. |
| `[Module]DetailModal` | 3-layout detail popup (Card / Table / JSON). Prev/Next nav + Print + Export + Edit. |

---

## SECTION 16 — CC ERP COLOR CONSTANTS

| Token | Value | Usage |
|---|---|---|
| `CC_RED` | `#CC0000` | Default/Locked view pills border + text |
| `CC_PUR` / Purple | `#7C3AED` | User view pills, + New View, Women's Apparel group |
| Amber modified | `#fef3c7` bg / `#92400e` text | MODIFIED badge on dirty views |
| Locked badge | `#f3f4f6` bg / `#6b7280` text | LOCKED badge on locked views |
| Active Detail | `Active: #d1fae5/#065f46` | Status badge — Active |
| Development | `#fef3c7/#92400e` | Status badge — Development |
| Inactive | `#fee2e2/#991b1b` | Status badge — Inactive |
| Men's Division | `#E8690A` | Division accent |
| Women's Division | `#7C3AED` | Division accent |
| Kids Division | `#15803D` | Division accent |
| Unisex Division | `#0078D4` | Division accent |

---

## SECTION 17 — IMPLEMENTATION COMMAND TEMPLATE

Use this exact wording when giving implementation commands for a new module:

> "IMPLEMENT LAYOUT VIEW FOR [MODULE NAME] FOLLOWING CC_ERP_LAYOUT_VIEW_RULES.MD EXACTLY.
>
> MODULE DATA: [describe the record fields, primary key, groupable fields]
>
> GROUPABLE FIELDS: [list field keys and labels]
>
> DEFAULT GROUP BY: L1 = [field], L2 = [field]
>
> PRESETS: [list 5–6 preset combos]
>
> SCHEMA FOR DETAIL MODAL: [list all fields with mono/badge/required flags]
>
> DIVISION/GROUP METADATA: [list group values with hex colors and icons]
>
> STATUS VALUES: [list statuses with Active/Inactive/Development equivalents]
>
> INIT VIEWS: [list 2–3 default locked views with their default layoutTab]
>
> EXPORT NAME: [Module]LayoutPanel (named) + [Module]Tab (default)
>
> ALL OTHER RULES: FOLLOW CC_ERP_LAYOUT_VIEW_RULES.MD — VIEWS BAR, TOOLBAR, MODAL, MAX VIEW, EDIT PERMISSIONS, TOAST SYSTEM — EXACTLY AS SPECIFIED."

---

*Last updated: 2026-03-02 | Source: ArticleMasterTab.jsx — ArticleMasterLayoutPanel*
