# CC ERP — Data Entry Views Bar · Feature Reference
**File:** `CC_ERP_DataEntry_V3.jsx`  
**Module:** Article Master › Data Entry tab  
**Last updated:** V3 — Single-row Views Bar

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CC ERP  ›  ARTICLE_MASTER  ›  Data Entry                    ██░░ 8/22 ●Unsaved│  ← Shell bar
├─────────────────────────────────────────────────────────────────────────────┤
│ VIEWS: [⊞ All Fields] [⚡ Quick Entry·5f] [₹ Pricing·8f] [🧵 Fabric·6f]   │
│        [🏷️ Buyer Entry·8f]  │  ⊟ Filter  ↕ Sort  ·flex·  + New View  Manage│  ← Single Views Row
├─────────────────────────────────────────────────────────────────────────────┤
│ [📋 Identity] [👕 Details] [🧵 Fabric] [₹ Pricing] [🏷️ Status]  ⚠ 2 req  │  ← Section tabs
├──────────────────────────────────────────────┬──────────────────────────────┤
│  Accordion form fields                       │  Live Preview (dark panel)   │
│  (filtered by active view + filter rules)    │  • Image placeholder         │
│                                              │  • Attribute chips           │
│                                              │  • Pricing block             │
│                                              │  • Barcode                   │
├──────────────────────────────────────────────┴──────────────────────────────┤
│ ●●●●●  8/22 · 0/2 req  [🏷️ Buyer Entry]  ⊟ Filtered  ↕ 1 sort    ↺ Clear  ✓ Save │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1 — Single Views Bar (Row)

**One row only.** No second chip row. Everything lives in a single `<div>` with `overflowX: auto` for narrow screens.

### Structure (left → right)

| Element | Type | Description |
|---------|------|-------------|
| `VIEWS:` | Label | Static uppercase label, always visible |
| View pills | Buttons | All system + custom views in one scrollable row |
| Separator `│` | Divider | 1px vertical line, separates views from tools |
| `⊟ Filter` | Tool button | Opens Filter Panel |
| `↕ Sort` | Tool button | Opens Sort Panel |
| `flex: 1` | Spacer | Pushes last two buttons to the right |
| `+ New View` | Action button | Opens New View Modal |
| `Manage` | Action button | Opens Manage Views Drawer |

### View Pill Behaviour

- **Inactive:** gray border, light gray background, faint `SYS` badge on system views
- **Active:** colored border + tinted background matching the view's color, filled dot + `Nf` field-count badge inside pill
- **Click active pill** → deactivates, returns to All Fields (no separate clear button needed)
- **Hover:** `title` tooltip shows view name, description, and field count
- **Scroll:** bar scrolls horizontally when pills overflow; `+ New View` and `Manage` are always visible (flex end)

---

## 2 — System Views (locked, always present)

Defined in `SYSTEM_VIEWS` constant. Cannot be edited or deleted.

| View | Icon | Color | Fields | Purpose |
|------|------|-------|--------|---------|
| All Fields | ⊞ | Gray | All 26 | Default — every field shown |
| Quick Entry | ⚡ | Orange | 5 | code, desc, l2Category, gender, status — fastest entry |
| Pricing & Tax | ₹ | Green | 8 | code, desc, wsp, mrp, markupPct, markdownPct, hsnCode, gstPct |
| Fabric Focus | 🧵 | Purple | 6 | code, desc, mainFabric, fabricName, colorCodes, sizeRange |

SYS badge shown in inactive state. In Manage drawer, listed as **LOCKED** — no edit/delete buttons.

---

## 3 — Custom Views

User-created views. Stored in `customViews` state array. Persist in session.

### Object shape
```js
{
  id:       "cv_1234567890",   // auto-generated
  name:     "Buyer Entry",     // user-defined, unique, non-reserved
  icon:     "📌",              // fixed for custom views
  color:    "#6c3fc5",         // purple
  isSystem: false,
  fields:   ["code","desc","shortName","buyerStyle","l2Category","gender","season","status"]
}
```

### Reserved names (blocked at save)
`Default`, `All Fields`, `Quick Entry`, `Pricing & Tax`, `Fabric Focus`

---

## 4 — `+ New View` Button

**Trigger:** dashed orange border button, far right of views bar.

Opens **New View Modal** (center overlay, `modalIn` spring animation).

### Modal sections

#### 4a — View Name
- Text input, required
- Real-time reserved-name + duplicate-name validation
- Error shown inline below input in red

#### 4b — Field Picker
Three quick-select buttons:
- **All** → selects all 26 fields
- **Req only** → selects only the 5 required fields
- **Clear** → deselects everything

Section rows (5 sections):
- Click **section header** → toggles all fields in that section (tri-state checkbox: all / partial / none)
- Click individual **field pill** → toggles that field on/off
- Pill badges: `✱` required, `←` auto-computed, `→` FK field
- Active pills: section accent color border + tinted background

#### 4c — Footer
- Shows `N fields · M sections` summary
- **Cancel** → closes, no changes
- **✚ Create View** → validates → saves → auto-activates new view → closes modal

---

## 5 — `Manage` Button

Opens **Manage Views Drawer** (right-side slide-over, `slideFromRight` animation).

### Drawer sections

#### System Views block
All 4 system views listed as read-only cards. Each shows name, description, field count, and `LOCKED` badge.

#### Custom Views block
Separator with count badge. For each custom view:

| Control | Action |
|---------|--------|
| `✎ Edit` | Closes drawer → opens New View Modal in edit mode, pre-filled |
| `⧉` (duplicate) | Clones the view with `(copy)` suffix, adds to custom views list |
| `×` (delete) | Shows inline red confirm block: **Delete** / **Keep** |

- If deleted view was active → auto-falls back to `All Fields`
- **ACTIVE** badge shown on currently active view

#### Footer
Shows `N system · M custom · total` count.

---

## 6 — `⊟ Filter` Button

Filters which **fields** are visible in the form — operates on top of the active view's field list.

**Button states:**
- Default: gray border, gray text
- Active (filter applied): orange border, orange tint background, `ON` badge

Opens **Filter Panel** (right-side drawer, 300px wide).

### Filter controls

| Control | Type | Options |
|---------|------|---------|
| Search Fields | Text input | Matches field label or field key |
| Section | Radio group | All Sections / Identity / Details / Fabric / Pricing / Status |
| Field Type | Toggle pills | All Fields / ✱ Required / ← Auto only / → FK fields / Text fields / Number only |

**Apply Filter** → filters intersect with active view's field list → form shows only matching fields.  
**Clear** → resets all three controls + closes panel.

### Filter + View interaction
Active view sets the base field list. Filter narrows it further. Example:
- Active view: `Pricing & Tax` (8 fields)
- Filter: Section = Pricing → shows only Pricing section fields from that 8
- Filter: Type = Auto → shows only `← AUTO` fields from the view

---

## 7 — `↕ Sort` Button

Sorts the **section accordion order** isn't changed — sort is recorded for future Records/Bulk integration and shown as a status indicator.

**Button states:**
- Default: gray border, gray text
- Active: dark slate background, white text, count badge

Opens **Sort Panel** (right-side drawer, 340px wide).

### Sort controls

#### Quick Presets
Five one-click preset buttons:

| Preset | Field | Direction |
|--------|-------|-----------|
| Code A→Z | code | asc |
| Code Z→A | code | desc |
| Status | status | asc |
| MRP ↑ | mrp | asc |
| MRP ↓ | mrp | desc |

Clicking a preset replaces current rules entirely.

#### Sort Rules
- **+ Add Rule** → appends a new rule using the first unused field
- Up to one rule per field (duplicate field options disabled in dropdowns)
- **Numbered priority badges** ① ② ③ — drag the `⠿` handle to reorder
- **Direction toggle** button — type-aware labels: `A→Z` / `Z→A` for text, `1→9` / `9→1` for numbers
- **× button** → removes that rule

**Clear All** → removes all rules, closes panel.  
**↕ Apply Sort** → saves rules to state, closes panel. Count badge updates on button.

---

## 8 — Form Field Visibility Logic

Fields shown in the accordion are computed as:

```
visibleFieldKeys = activeView.fields
  → filtered by: section (if set)
  → filtered by: type (if set)
  → filtered by: search text (if set)
```

- Sections with **zero visible fields** are hidden entirely (not rendered)
- If **no fields** match at all → empty state shown with `Clear Filter` button
- Section header subtitle updates to show `N fields visible` (not total)
- Section completion ring + status only counts visible fields

---

## 9 — Status Bar (Footer)

Always visible, 1 row.

| Element | Shows when |
|---------|-----------|
| Section progress dots | Always — colored by completion state, click to expand/collapse |
| `N/M · R/R req` | Always — filled fields / total, required filled / total required |
| Active view badge | A non-default view is active |
| `⊟ Filtered` | Any field filter is active |
| `↕ N sort(s)` | Any sort rules are active |
| `✓ Saved to ARTICLE_MASTER` | 2.5s after successful save |
| `↺ Clear` | Always |
| `✓ Save to Sheet` / `⚠ N required` | Always — red when ready, gray when blocked |

---

## 10 — Data Entry Form (unchanged from V2)

### Section accordion
5 collapsible sections: **Article Identity**, **Item Details**, **Fabric & Colors**, **Pricing & Tax**, **Status & Tags**

Each section card:
- Header click → expand/collapse
- Colored accent border when open
- Completion ring (ring progress + color: amber = missing required, green = complete, accent = partial)
- Section tab strip at top (same 5 sections, clickable, colored bottom border on active)

### Field row layout
Two-column grid: `200px label | 1fr input`

Label column shows:
- Field label (red for required, purple for auto)
- Type badge: `REQ` (red) · `← AUTO` (purple) · `→ FK` (blue)
- Field key in IBM Plex Mono (dims when not focused, accent color when focused)

Input column shows:
- Hint text above input (only when hint adds info beyond the label)
- Input rendered by type: `text` / `number` / `select` / `textarea` / `auto` (read-only purple)

### Auto-computed fields
Purple background, `← AUTO` badge, read-only, placeholder: *GAS auto-fills*.
Fields: `l1Division`, `fabricName`, `markupPct`, `markdownPct`, `gstPct`

### Required field validation
- `✱` prefix on label + red color
- Save button blocked (gray + `⚠ N required`) until all required fields filled
- Warning bar at top of form with quick-jump buttons to each missing field
- Shake animation on save attempt when blocked

---

## 11 — Live Preview Panel (right sidebar, 220px)

Dark slate panel, always visible. Updates live as fields are filled.

| Block | Appears when |
|-------|-------------|
| Image placeholder + status badge overlay + article code stamp | Always |
| Description + Short Name + Buyer Style | Any of those fields filled |
| Attribute chips (gender, category, style, fit, season, neckline, sleeve) | Any filled |
| Fabric block (fabric name, color codes, size range) | Any filled |
| Pricing block (WSP, MRP, markup %, HSN, GST) | wsp or mrp filled |
| Barcode visualization | code filled |
| Completion ring + % | Always (shell bar + preview header) |

---

## 12 — Animations

| Name | Used on |
|------|---------|
| `modalIn` | New View Modal — spring scale-in |
| `slideFromRight` | Manage / Filter / Sort panels |
| `shake` | Save button + warning bar when validation fails |
| `fade` | "Saved" success message |
| `chipIn` | (removed in V3 — was for chip row) |

---

*End of CC_ERP_DataEntry_V3_FEATURES.md*
