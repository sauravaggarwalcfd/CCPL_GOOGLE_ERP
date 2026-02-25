# CONFIDENCE CLOTHING ERP — UI DESIGN SPECIFICATION
## Upload this file alongside CC_ERP_BUILD_REFERENCE_V4.md at every build session

**UI Version:** V6 — NetSuite-Style + Full Notification System + Quick Access Sidebar + Ctrl+K Command Palette + Font Family Picker (FINAL)
**Locked From:** CC_ERP_NetSuite_V2.jsx
**Last Updated:** Feb 2026 (V6)
**Purpose:** Canonical UI design system for all GAS ERP modules. Every screen, form, table, and modal must follow this spec exactly. No deviations without explicit "Override UI [component]" instruction from Saurav Aggarwal.

---

## 1. DESIGN LANGUAGE — NORTH STAR

The CC ERP UI is modelled on **Oracle NetSuite's dense commerce aesthetic**, adapted with:
- Full **6-mode colour theming** (live, no reload)
- **6 accent colour options** (brand customisable)
- **Draggable left Command Panel** with collapsible accordion sections
- **Dense data tables** as the primary content surface
- **IBM Plex Mono** for all numbers, codes, and computed values
- **Nunito Sans** for all UI text, labels, and prose
- **Icon-everywhere system** — every section, field, and entity has an icon; user can change any icon from Icon Master (Notion-style picker)
- **Full-width layout** — all pages always occupy 100% viewport width, no max-width caps
- **Table Power Controls** — sorting, grouping, sub-grouping, and filtering mandatory on every data table
- **Save Preview Modal** — all data entry saves require a confirmation preview before committing
- **Print Preview** — available on every screen with a dedicated print layout renderer
- **Unsaved Changes Guard** — any navigation away from dirty form triggers Save / Discard / Draft popup

This is a **professional back-office ERP interface** — not a dashboard or a consumer app. Every design decision prioritises data density, scan-ability, and speed of data entry over decorative aesthetics.

---

## 2. TYPOGRAPHY — LOCKED

| Role | Font | Weight | Size (medium) | Usage |
|------|------|--------|----------------|-------|
| UI Body | Nunito Sans | 400–800 | 12–13px | All labels, text, dropdowns |
| Display / Title | Nunito Sans | 900 | 14–16px | Page titles, section headers |
| Data / Codes | IBM Plex Mono | 500–700 | 11–13px | Codes, amounts, dates, references |
| Micro Labels | Nunito Sans | 900 | 8–9px | UPPERCASE field labels, column headers |

**Google Fonts import:**
```
https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,600;6..12,700;6..12,800;6..12,900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap
```

**Font size scale (user-controlled):**
| Setting | px |
|---------|-----|
| small | 11px |
| medium | 13px ← DEFAULT |
| large | 15px |

**Label style (always UPPERCASE):**
```js
lbl = {
  display:"block", fontSize:9, fontWeight:900,
  color:M.textC, marginBottom:4,
  fontFamily:"'Nunito Sans',sans-serif",
  letterSpacing:.5, textTransform:"uppercase",
}
```

---

## 3. COLOUR SYSTEM — COMPLETE TOKENS

### 3A. The 6 Colour Modes

Every mode provides the same named tokens. All UI components reference only tokens, never raw hex values.

| Token | Role |
|-------|------|
| `M.bg` | Page / outer background |
| `M.shellBg / shellBd` | Top shell bar background + border |
| `M.sidebarBg / sidebarBd` | Command Panel background + border |
| `M.surfHigh` | Highest surface (table rows, cards, main content) |
| `M.surfMid` | Mid surface (alternate rows, sub-sections) |
| `M.surfLow` | Lowest surface (page fill, status bar) |
| `M.hoverBg` | Row hover background |
| `M.inputBg / inputBd / inputFocus` | Form input states |
| `M.dropBg / dropHover` | Dropdown menu backgrounds |
| `M.selCard` | Selected item card background |
| `M.divider` | All dividers and borders within surfaces |
| `M.tblHead / tblEven / tblOdd` | Table header, striped rows |
| `M.statusBg` | Bottom status bar background |
| `M.badgeBg / badgeTx` | Neutral badge/pill background + text |
| `M.textA` | Primary text (headings, values) |
| `M.textB` | Secondary text (labels, metadata) |
| `M.textC` | Tertiary text (descriptions, hints) |
| `M.textD` | Disabled / placeholder text |
| `M.scrollThumb` | Scrollbar thumb colour |
| `M.shadow` | Box shadow string |

### 3B. The 6 Colour Modes — Full Hex Values

#### ☀️ Light (id: "light") — DEFAULT
```
bg:#f0f2f5 | shellBg:#ffffff | shellBd:#e2e4e8
sidebarBg:#ffffff | sidebarBd:#e2e4e8
surfHigh:#ffffff | surfMid:#f7f8fa | surfLow:#f0f2f5
hoverBg:#eef1f8 | inputBg:#ffffff | inputBd:#d1d5db
dropBg:#ffffff | dropHover:#f0f4ff | divider:#e5e7eb
tblHead:#f4f5f7 | tblEven:#ffffff | tblOdd:#fafbfc
statusBg:#f0f2f5 | badgeBg:#e5e7eb | badgeTx:#374151
textA:#111827 | textB:#374151 | textC:#6b7280 | textD:#9ca3af
scrollThumb:#d1d5db | shadow:0 4px 20px rgba(0,0,0,.09)
```

#### ⬛ Black (id: "black")
```
bg:#000000 | shellBg:#0a0a0a | shellBd:#1c1c1c
sidebarBg:#0a0a0a | sidebarBd:#1c1c1c
surfHigh:#111111 | surfMid:#161616 | surfLow:#0a0a0a
hoverBg:#1c1c1c | inputBg:#0d0d0d | inputBd:#2a2a2a
dropBg:#111111 | dropHover:#1e1e1e | divider:#1f1f1f
tblHead:#0d0d0d | tblEven:#111111 | tblOdd:#141414
statusBg:#0a0a0a | badgeBg:#1c1c1c | badgeTx:#888888
textA:#f0f0f0 | textB:#a0a0a0 | textC:#666666 | textD:#444444
scrollThumb:#2a2a2a | shadow:0 4px 28px rgba(0,0,0,.85)
```

#### 🩶 Light Grey (id: "lightgrey")
```
bg:#e4e7ec | shellBg:#f2f3f5 | shellBd:#d4d6dc
sidebarBg:#f2f3f5 | sidebarBd:#d4d6dc
surfHigh:#f8f9fa | surfMid:#eef0f3 | surfLow:#e4e7ec
hoverBg:#e0e4ef | inputBg:#f8f9fa | inputBd:#c8cdd8
dropBg:#f8f9fa | dropHover:#e0e4ef | divider:#d4d6dc
tblHead:#ebedf0 | tblEven:#f8f9fa | tblOdd:#f0f2f5
statusBg:#e4e7ec | badgeBg:#d4d6dc | badgeTx:#3d4460
textA:#1a1f2e | textB:#3d4460 | textC:#6b7590 | textD:#9ba3b8
scrollThumb:#c0c5d4 | shadow:0 4px 16px rgba(0,0,0,.08)
```

#### 🌙 Midnight (id: "midnight")
```
bg:#0d1117 | shellBg:#161b22 | shellBd:#21262d
sidebarBg:#161b22 | sidebarBd:#21262d
surfHigh:#1c2128 | surfMid:#161b22 | surfLow:#0d1117
hoverBg:#21262d | inputBg:#0d1117 | inputBd:#30363d
dropBg:#161b22 | dropHover:#21262d | divider:#21262d
tblHead:#161b22 | tblEven:#1c2128 | tblOdd:#161b22
statusBg:#0d1117 | badgeBg:#21262d | badgeTx:#7d8590
textA:#e6edf3 | textB:#8b949e | textC:#6e7681 | textD:#484f58
scrollThumb:#30363d | shadow:0 4px 24px rgba(0,0,0,.6)
```

#### 🌅 Warm Ivory (id: "warm")
```
bg:#f0ebe0 | shellBg:#fdf8f0 | shellBd:#e4d8c4
sidebarBg:#fdf8f0 | sidebarBd:#e4d8c4
surfHigh:#fdfaf4 | surfMid:#f5f0e8 | surfLow:#ede5d4
hoverBg:#e8dece | inputBg:#fdfaf4 | inputBd:#d4c8b0
dropBg:#fdfaf4 | dropHover:#e8dece | divider:#ddd0b8
tblHead:#f0ebe0 | tblEven:#fdfaf4 | tblOdd:#f5f0e8
statusBg:#ede5d4 | badgeBg:#e4d8c4 | badgeTx:#4a3c28
textA:#1c1409 | textB:#5a4a34 | textC:#8a7460 | textD:#b0a090
scrollThumb:#c8b89c | shadow:0 4px 16px rgba(60,40,10,.12)
```

#### 🔷 Slate (id: "slate")
```
bg:#1a2030 | shellBg:#252d40 | shellBd:#2d3654
sidebarBg:#1e2433 | sidebarBd:#2d3654
surfHigh:#2a3450 | surfMid:#222a3e | surfLow:#1a2030
hoverBg:#2d3654 | inputBg:#1a2030 | inputBd:#2d3654
dropBg:#222a3e | dropHover:#2d3654 | divider:#2d3654
tblHead:#1e2433 | tblEven:#222a3e | tblOdd:#1e2433
statusBg:#1a2030 | badgeBg:#2d3654 | badgeTx:#8895b0
textA:#d8e0f0 | textB:#8895b0 | textC:#5a6680 | textD:#3a4460
scrollThumb:#2d3654 | shadow:0 4px 24px rgba(0,0,0,.5)
```

### 3C. The 6 Accent Palettes

| ID | Label | Main | Light BG | Dark | Text-on |
|----|-------|------|----------|------|---------|
| orange | Oracle Orange | #E8690A | rgba(232,105,10,.1) | #b85208 | #fff |
| blue | Azure Blue | #0078D4 | rgba(0,120,212,.1) | #005a9e | #fff |
| teal | Deep Teal | #007C7C | rgba(0,124,124,.1) | #005f5f | #fff |
| green | Emerald | #15803D | rgba(21,128,61,.1) | #0f6330 | #fff |
| purple | Violet | #7C3AED | rgba(124,58,237,.1) | #5b21b6 | #fff |
| rose | Rose Red | #BE123C | rgba(190,18,60,.1) | #9b0d30 | #fff |

**Accent token reference:**
- `A.a` — main accent colour
- `A.al` — light accent background (for selected items, auto-fill cells)
- `A.ad` — dark accent (for hover states on accent elements)
- `A.tx` — text colour on accent background (always #fff)

**DEFAULT COMBINATION: ☀️ Light mode + Oracle Orange accent**

---

## 4. LAYOUT ARCHITECTURE — EVERY MODULE

Every ERP screen must use this exact 3-zone layout. **No exceptions.**

```
┌─────────────────────────────────────────────────────────────┐
│  TOP SHELL BAR (48px fixed height)                          │
│  Logo | Breadcrumb | [Quick Theme] [Quick Accent] | Mode    │
│  Toggle | ⚙ Settings gear                                   │
├───────────────────────────┬────┬───────────────────────────┤
│                           │ ↔  │                           │
│   LEFT COMMAND PANEL      │drag│   MAIN CONTENT AREA       │
│   (default 340px,         │ 5px│   (flex-1, fills rest)    │
│    draggable 220–580px)   │    │                           │
│                           │    │  ┌─────────────────────┐  │
│  ┌─ Panel Label Bar ────┐ │    │  │ Content Sub-Toolbar │  │
│  │ "Command Panel · PO" │ │    │  │ (title + actions)   │  │
│  └──────────────────────┘ │    │  ├─────────────────────┤  │
│                           │    │  │                     │  │
│  Accordion Sections:      │    │  │  DATA TABLE or      │  │
│  ├─ 📋 Document Info      │    │  │  CARD VIEW          │  │
│  ├─ 🏭 Supplier           │    │  │  (flex-1, scroll)   │  │
│  ├─ 📅 Terms/Logistics    │    │  │                     │  │
│  ├─ ₹ Totals              │    │  └─────────────────────┘  │
│  └─ [module-specific]     │    │                           │
│                           │    │  STATUS BAR (30px fixed)  │
│  ── Footer Actions ──     │    │  ROWS | BASE | GST | TOTAL│
│  [ Draft ] [▶ Submit ]    │    │                           │
└───────────────────────────┴────┴───────────────────────────┘
```

### Zone Specifications

**Top Shell Bar — 48px**
- Background: `M.shellBg`
- Border-bottom: `1px solid M.shellBd`
- z-index: 200
- Fixed / no-scroll
- Contains: Logo block | Breadcrumb trail | Spacer | Quick theme picker | Quick accent picker | Mode toggle | Settings ⚙️

**Left Command Panel**
- Default width: 340px (user-adjustable: 260 / 340 / 440 via settings)
- Drag range: 220px minimum — 580px maximum
- Background: `M.sidebarBg`
- Border-right: `1px solid M.sidebarBd`
- Contains: Panel label bar + Accordion body (overflow-y auto) + Footer actions (sticky)

**Drag Handle — 5px**
- cursor: col-resize
- Background active: `${A.a}25`
- Border-left active: `1px solid A.a`
- Contains: 2px × 60px centred bar (visual indicator)

**Main Content Area**
- Background: `M.bg` (outer) / `M.surfHigh` (content surfaces)
- flex: 1, overflow: hidden
- Contains: Sub-toolbar + Table/Cards area + Status Bar

**Status Bar — ~30px**
- Background: `M.statusBg`
- Border-top: `1px solid M.sidebarBd`
- Always shows: ROWS | BASE VALUE | GST | GRAND TOTAL
- Right side: module identifier + date + mode label
- User can hide via settings toggle

---

## 5. TOP SHELL BAR — SPECIFICATION

```
┌─────────────────────────────────────────────────────────────────┐
│ [📦 CC] [Home › Module › Screen]  ········ [THEME] [ACCENT]     │
│ [ERP  ]                                    [MODE TOGGLE] [⚙️]  │
└─────────────────────────────────────────────────────────────────┘
```

**Logo Block:**
- 30×30px accent-coloured square (radius 5), module emoji inside
- "CC ERP" — 12px, weight 900, accent colour
- "CONFIDENCE CLOTHING" — 8px, `M.textD`, letter-spacing 0.5
- Separated from breadcrumb by right border

**Breadcrumb:**
- "Home › Module › Screen" in 11px
- Inactive: `M.textC`
- Active (current screen): `A.a`, weight 700
- Separator ›: `M.textD`

**Quick Theme Switcher** (in toolbar, always visible):
- Label: "THEME" in 9px, weight 800, `M.textD`
- One 22×22px button per mode, shows emoji
- Active mode: `border: 2px solid A.a`, `background: A.al`
- Inactive: transparent background, no border
- Container: `M.surfLow` background, `M.shellBd` border, radius 5

**Quick Accent Switcher** (in toolbar, always visible):
- Label: "ACCENT" in 9px, weight 800, `M.textD`
- One 16×16px circle per accent colour
- Active: `border: 2px solid M.textA`
- Container: same style as theme switcher

**Mode Toggle** (module-specific):
- Two or more buttons in a pill container
- Active: `A.a` background, `A.tx` text
- Inactive: transparent, `M.textB`
- Container: `M.surfLow` bg, `M.shellBd` border, radius 5, padding 2px

**Settings Button (⚙️):**
- 34×34px, radius 6
- Active (panel open): `A.a` bg, `A.tx` colour
- Inactive: `M.surfLow` bg, `M.textB` colour

---

## 6. COMMAND PANEL — ACCORDION SPECIFICATION

### Panel Label Bar
```
"Command Panel · [MODE]"          "[width]px ↔"
```
- Background: `M.surfMid`
- Border-bottom: `1px solid M.sidebarBd`
- Text: 9px, weight 900, `M.textD`, UPPERCASE, letter-spacing 1.5

### Accordion Section Button (collapsed)
- Full width, `padding: (sp+2)px 16px`
- Background: `M.sidebarBg`
- Border-left: `3px solid transparent`
- Icon (14px) + Title + optional Badge + ▾ chevron

### Accordion Section Button (expanded)
- Background: `${A.a}12`
- Border-left: `3px solid A.a`
- Title text: `A.a` colour
- Chevron: `rotate(180deg)`

### Accordion Content Area (when open)
- Background: `M.surfHigh`
- Padding: `sp px 16px (sp+6)px`
- Animation class: `dd-anim` (fadeDown 0.16s)

### Standard Section List (every module adapts these):
| Section | Icon | Contains |
|---------|------|----------|
| Document Info | 📋 | Reference# (auto), Date, type-specific fields |
| Party / Supplier / Customer | 🏭 / 👤 | Code selector + detail card |
| Terms / Logistics / Details | 📅 / 🚛 | Date, terms, address, notes |
| Financial Summary / Totals | ₹ | Calculated totals + Grand Total accent card |
| Quick Reference (contextual) | 📄 | Related records quick-select |

### Footer Actions (sticky at panel bottom)
```
[ 💾 Draft ]   [ ▶ Send / Submit / Confirm ]
```
- Container: `padding (sp+2)px 16px`, `M.surfMid` bg, top border
- Draft: `M.inputBg` bg, `M.inputBd` border, `M.textB` text
- Primary: `A.a` bg, `A.tx` text, weight 900

---

## 7. FORM INPUTS — SPECIFICATION

### Standard Text/Number Input
```js
{
  border: `1px solid ${M.inputBd}`,
  borderRadius: 3,
  background: M.inputBg,
  color: M.textA,
  fontSize: fz,  // from settings
  fontFamily: "'Nunito Sans', sans-serif",
  padding: `${pyV}px 9px`,  // pyV from density setting
  width: "100%",
  outline: "none",
  transition: "border-color .15s",
}
```

### Auto-filled / Read-only Cell
Used for GAS-computed fields (UOM, HSN, GST%, totals):
```js
{
  padding: "3px 8px",
  background: it ? A.al : M.surfMid,
  color: it ? A.a : M.textD,
  borderRadius: 3,
  fontSize: 10,
  fontWeight: 700,
  textAlign: "center",
  border: `1px solid ${it ? `${A.a}30` : M.divider}`,
  fontFamily: "'IBM Plex Mono', monospace",
}
```
**Rule:** All auto-populated fields MUST use accent light background (`A.al`) + accent text (`A.a`) to visually distinguish them from user-editable fields.

### Dropdown / Select
Same as text input but `cursor: "pointer"`.

### Textarea
Same as text input but `height: 54px`, `resize: "vertical"`.

### Row Density (user-controlled):
| Setting | Vertical Padding (`pyV`) |
|---------|--------------------------|
| compact | 4px |
| comfortable | 7px ← DEFAULT |
| spacious | 12px |

---

## 8. ITEM SEARCH COMPONENT — SPECIFICATION

Used wherever an item/record needs to be selected. Reusable across all modules.

**Props:** `value, onChange, M, A, fz, py, showThumbs`

**States:**
1. **Empty** — input with placeholder "Search by code or name…"
2. **Typing / Open** — dropdown visible, filtered results
3. **Selected / Closed** — thumbnail in input + selected card below input

**Input container:**
- `border: 1px solid (open ? A.a : M.inputBd)`
- `boxShadow: open ? M.inputFocus.replace("VAR_ACCENT", A.a) : none`
- Left thumbnail slot (28×28px) when item selected
- Right ▾ toggle button with `M.surfMid` background

**Dropdown row:**
- 34×34px image thumbnail OR category emoji fallback
- Item name (weight 700, truncated) + code · uom · HSN · GST% below
- Category pill (colour from CAT_CLR)
- Hover: `M.dropHover`

**Selected card:**
- `background: A.al`, `border: 1px solid ${A.a}40`, `borderLeft: 3px solid A.a`
- 38×38px thumbnail
- Animation: `sc-anim` (scaleIn 0.15s)

**Search behaviour:**
- Filters by `code` OR `name` (case-insensitive)
- Shows all items if query is empty
- "No items match" message if zero results

---

## 9. DATA TABLE — SPECIFICATION

### Table Header Row
```js
// TH cell styles
{
  padding: `${pyV}px 8px`,
  textAlign: right ? "right" : "left",
  fontSize: 10,
  fontWeight: 900,
  color: M.textC,
  fontFamily: "'Nunito Sans', sans-serif",
  letterSpacing: .4,
  whiteSpace: "nowrap",
  borderBottom: `2px solid ${A.a}50`,
  background: M.tblHead,
}
```

### Table Data Rows
- Background (striped): `tblEven` / `tblOdd` alternating
- Background (bordered): `M.surfHigh` uniform
- Background (clean): `M.surfHigh` uniform
- Hover: `M.hoverBg`
- Cell padding: `${pyV}px 8px`
- Border-bottom: `1px solid M.divider`

### Row Number Column (optional, user-toggleable)
- `#` header, 38px wide
- Values: "01", "02" etc. in `A.a` colour, IBM Plex Mono, weight 900

### Standard Column Order (Procurement PO):
`#` | Item Search | UOM (auto) | HSN (auto) | GST% (auto) | Qty | Unit Price | Disc% | Line Total | ×

### Standard Column Order (Procurement GRN):
`#` | Item Search | UOM (auto) | HSN (auto) | GST% (auto) | Received Qty | Accepted Qty | Rejected (auto) | Rolls | Lot No | ×

### Delete Row Button
- 24×24px, radius 3
- `border: 1px solid M.divider`, `color: #f87171`
- transparent background

### Table Styles (user-controlled):
| Style | Row Background | Borders |
|-------|----------------|---------|
| Striped | Even/Odd alternating | bottom only |
| Bordered | All same M.surfHigh | all sides |
| Clean | All same M.surfHigh | bottom only |

---

## 10. STATUS BAR — SPECIFICATION

Permanently docked at bottom of main content area. User can hide.

```
ROWS  3     BASE  ₹ 48,500.00     GST  ₹ 8,730.00     GRAND TOTAL  ₹ 57,230.00
                                                    [module · mode · date]
```

- Background: `M.statusBg`
- Border-top: `1px solid M.sidebarBd`
- Padding: `5px 20px`
- Label: 8px, weight 900, `M.textD`, UPPERCASE, letter-spacing 1
- Value: 11px, weight 900, IBM Plex Mono
- Grand Total value: `A.a` colour, all others `M.textB`
- Right side: 8px, `M.textD`, IBM Plex Mono — "CC ERP · FILE-0X · MODULE · MODE · DATE"

---

## 11. SETTINGS PANEL — SPECIFICATION

Slides in from the RIGHT over the main content on ⚙️ click.

**Dimensions:** 420px wide, full height
**Animation:** `sp-anim` (slideLeft 0.22s)
**Backdrop:** `rgba(0,0,0,.45)` blur(2px), clickable to close

**Header (sticky):**
- Title "⚙ Workspace Settings" — 15px, weight 900
- Subtitle "Personalise your ERP interface" — 10px, `M.textC`
- × close button — 30×30px, radius 6

**Section dividers:**
```js
{ fontSize:9, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", color:M.textD, padding:"16px 0 8px", borderTop:`1px solid M.divider` }
```

**Settings sections (in order):**
1. **Color Mode** — 6 preview cards in a flex-wrap row
2. **Accent Color** — 6 colour dot swatches with labels
3. **Typography & Density** — Font Size chips + Row Density chips
4. **Table Style** — 3 chips
5. **Line Item View** — 2 chips (Table / Cards)
6. **Sidebar Width** — 3 preset chips
7. **Display Toggles** — Toggle switches for: Status Bar / Thumbnails / Row Numbers / Category Badges / Compact Sidebar

**Color Mode Preview Card:**
- Shows a mini wireframe of the layout (shell bar + sidebar + content)
- Uses the mode's own background colours
- Active: `border: 2px solid A.a`, `background: A.al`

**Chip Button (settings control):**
```js
{
  padding: "5px 13px",
  border: `1.5px solid ${active ? A.a : M.inputBd}`,
  borderRadius: 20,
  background: active ? A.a : M.inputBg,
  color: active ? A.tx : M.textB,
  fontSize: 11,
  fontWeight: 700,
}
```

**Toggle Switch:**
- 40×22px pill
- Background: `A.a` (on) / `M.inputBd` (off)
- Thumb: 18×18px white circle, `left: 20px` (on) / `left: 2px` (off)
- Both transition: 0.2s

**Footer:**
- "↩ Reset Defaults" — ghost button, full width
- "✓ Apply & Close" — accent button, full width

---

## 12. ANIMATIONS — ALL KEYFRAMES

```css
@keyframes fadeDown  { from { opacity:0; transform:translateY(-8px) }  to { opacity:1; transform:translateY(0) } }
@keyframes slideLeft { from { opacity:0; transform:translateX(20px) }  to { opacity:1; transform:translateX(0) } }
@keyframes scaleIn   { from { opacity:0; transform:scale(.95) }        to { opacity:1; transform:scale(1) } }
@keyframes themeSwap { 0%{ opacity:.6 } 100%{ opacity:1 } }
```

| Class | Animation | Used For |
|-------|-----------|---------|
| `.dd-anim` | fadeDown 0.16s | Dropdowns, accordion open |
| `.sp-anim` | slideLeft 0.22s | Settings panel slide-in |
| `.sc-anim` | scaleIn 0.15s | Selected item card |
| `.theme-anim` | themeSwap 0.25s | Applied to root div on theme change |

---

## 13. CARD VIEW (ALTERNATIVE TO TABLE)

Used when `cfg.lineView === "cards"`. Each line item rendered as a card.

**Card structure:**
```
┌─ Card Header ─────────────────────────────────────────────┐
│ [#] [thumbnail] Item Name                 [cat badge] [×] │
│                                           [₹ line total]  │
├─ Card Body ───────────────────────────────────────────────┤
│ Item Search field (full width)                            │
│                                                           │
│ [UOM auto] [HSN auto] [GST% auto] [Qty] [Price] [Disc%]  │
└───────────────────────────────────────────────────────────┘
```

- Background: `M.surfHigh`
- Border: `1px solid M.divider`, radius 5
- Shadow: `0 1px 4px rgba(0,0,0,.06)`
- Header background: `A.al` if item selected, else `M.surfMid`
- Header border-bottom: `1px solid M.divider`

---

## 14. CATEGORY & BADGE SYSTEM

### Item Category Colours (locked)
| Category | Colour |
|----------|--------|
| Fabric | #2563eb |
| Trim | #7c3aed |
| Chemical | #dc2626 |
| Packaging | #ea580c |
| Label | #059669 |

### Category Emoji Icons
| Category | Icon |
|----------|------|
| Fabric | 🧵 |
| Trim | 🪡 |
| Chemical | 🧪 |
| Packaging | 📦 |
| Label | 🏷️ |

### Category Pill/Badge
```js
{
  fontSize: 9,
  padding: "2px 8px",
  borderRadius: 99,
  background: `${CAT_CLR[cat]}20`,
  color: CAT_CLR[cat],
  fontWeight: 800,
}
```

### Neutral Badge (counts, status)
```js
{
  fontSize: 11,
  padding: "3px 10px",
  borderRadius: 10,
  background: M.badgeBg,
  color: M.badgeTx,
  fontWeight: 700,
}
```

---

## 15. SUPPLIER / PARTY DETAIL CARD

Shown inside Command Panel when a supplier/party is selected.

```
┌─ Supplier Card ────────────────────────────────────────────┐
│ Supplier Full Name                                (weight 900)│
│                                                             │
│ City     Credit Days    Rating ★★★★☆    GSTIN             │
└─────────────────────────────────────────────────────────────┘
```

```js
{
  background: A.al,
  borderRadius: 4,
  padding: "11px 12px",
  border: `1px solid ${A.a}35`,
  borderLeft: `3px solid ${A.a}`,
}
```

- Grid: 2 columns for the detail rows
- Key label: 8px, weight 900, `M.textD`, UPPERCASE, letter-spacing 0.5
- Value: 10px, weight 700, `M.textA`

---

## 16. DRAG HANDLE — SPECIFICATION

```js
// Container
{
  width: 5,
  cursor: "col-resize",
  background: dragging ? `${A.a}25` : "transparent",
  borderLeft: `1px solid ${dragging ? A.a : M.sidebarBd}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all .15s",
}

// Inner bar
{
  width: 2,
  height: 60,
  background: dragging ? A.a : M.sidebarBd,
  borderRadius: 2,
}
```

**useDrag hook:** `init=340, min=220, max=580`
- `onStart` → sets dragging=true, body cursor=col-resize, userSelect=none
- `onMove` → clamps width within min/max
- `onUp` → resets all

---

## 17. MODULE-SPECIFIC ADAPTATIONS

When building each new module, keep the full layout structure and adapt only:

| Module | Shell Icon | Breadcrumb | Mode Toggle | Command Panel Sections |
|--------|-----------|------------|-------------|------------------------|
| FILE 2 — Procurement (PO) | 📦 | Home › Procurement › Purchase Order | PO / GRN | Doc · Supplier · Terms · Totals |
| FILE 2 — Procurement (GRN) | 📦 | Home › Procurement › Goods Receipt | PO / GRN | Doc · Supplier · Logistics · Open POs |
| FILE 3 — Production (WO) | 🏭 | Home › Production › Work Order | WO / Cutting | Doc · Item/BOM · Schedule · Totals |
| FILE 3 — Production (BOM) | 🏭 | Home › Production › BOM | BOM / WO | Header · Components · Summary |
| FILE 4 — Inventory | 📊 | Home › Inventory › Stock Ledger | Receive / Issue / Adjust | Doc · Location · Item · Summary |
| FILE 5 — Quality (Fabric) | 🔬 | Home › Quality › Fabric Inspection | Fabric / Garment | GRN Link · Item · Measurements · Result |
| FILE 5 — Quality (Garment) | 🔬 | Home › Quality › Garment QC | Fabric / Garment | WO Link · Item · AQL · Result |
| FILE 6 — Dashboard | 📈 | Home › Dashboard | — | KPI Filters · Date Range · Modules |
| FILE 1A — Masters | 🗂️ | Home › Masters › [Sheet Name] | Active / All | Type · Category · Filters |

---

## 18. DEFAULT SETTINGS OBJECT (copy into every new module)

```js
const DEFAULTS = {
  mode:          "light",        // ☀️ Light mode is default
  accent:        "orange",       // 🟠 Oracle Orange accent is default
  density:       "comfortable",  // compact | comfortable | spacious
  fontSize:      "medium",       // small (11) | medium (13) | large (15)
  tblStyle:      "striped",      // striped | bordered | clean
  lineView:      "table",        // table | cards
  sbWidth:       340,            // sidebar default width px
  showStatusBar: true,
  showThumbs:    true,
  showRowNums:   true,
  showCatBadge:  true,
  compactSide:   false,
};
```

---

## 19. SCROLLBAR STYLING

```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { border-radius: 4px; background: M.scrollThumb; }
```
Update `scrollThumb` dynamically when theme changes.

---

## 20. REUSABLE COMPONENT CHECKLIST

Before building any new module screen, confirm you have:

- [ ] `GlobalStyles` component with fonts + keyframes
- [ ] `MODES` object (copy exactly — all 6 modes)
- [ ] `ACCENTS` object (copy exactly — all 6 accents)
- [ ] `DEFAULTS` settings object
- [ ] `useDrag` hook
- [ ] `ItemSearch` / entity search component (adapted for module's master data)
- [ ] `SettingsPanel` component (identical across all modules)
- [ ] Top Shell Bar with Quick Theme + Quick Accent pickers
- [ ] Left Command Panel with accordion
- [ ] Drag handle
- [ ] Main content area with sub-toolbar
- [ ] Table OR Cards view (user-toggleable)
- [ ] Status bar
- [ ] `M` (mode tokens) and `A` (accent tokens) passed as props everywhere

---

## 21. LOCKED UI DECISIONS — DO NOT RE-OPEN

| Decision | Locked Choice |
|----------|---------------|
| UI pattern | Oracle NetSuite dense commerce + custom theming |
| Body font | Nunito Sans (Google Fonts) |
| Code/number font | IBM Plex Mono (Google Fonts) |
| Default colour mode | ☀️ Light |
| Default accent | Oracle Orange (#E8690A) |
| Layout structure | Shell (48px) + Sidebar (drag) + Drag handle + Main |
| Command panel default width | 340px, min 220, max 580 |
| Settings panel position | Right-side slide-in, 420px wide |
| Auto-fill field visual | Accent light bg + accent text (A.al / A.a) |
| Item search | Dual search (code + name), thumbnail, selected card |
| Status bar position | Bottom of main content, always visible by default |
| Animation library | CSS only (no framer-motion, no react-spring) |
| Row numbers format | Zero-padded 2-digit: "01", "02"… |
| Category colour scheme | Fabric #2563eb, Trim #7c3aed, Chemical #dc2626, etc. |
| Breadcrumb separator | › character |
| Number formatting | en-IN locale (₹ 1,23,456.00) |
| Code display font | IBM Plex Mono always |

---

## 22. FINAL RECOMMENDATIONS (Auto-saved Feb 2026)

The following improvements are recommended for implementation in Phase 1 GAS and Phase 3 transaction modules. These are auto-logged here and will be implemented as each module is built.

### REC-001 — Keyboard Shortcuts
Add keyboard shortcuts visible in tooltips:
- `Ctrl+N` → New line item
- `Ctrl+S` → Save draft
- `Ctrl+Enter` → Submit / Send PO
- `Esc` → Close dropdowns / settings panel
- `Tab` → Move between fields within a line

### REC-002 — Inline Validation Indicators
Show per-field validation state without a modal:
- Red left border on required field if empty when trying to submit
- Green tick (✓) on field after valid data entered
- Amber border on fields with warnings (e.g. price lower than last PO)

### REC-003 — Smart Price Memory
In ITEM_SUPPLIER_RATES integration: if unit price is blank for an item+supplier combo, GAS should auto-suggest the last PO price with a subtle amber note "Last PO: ₹XX.XX" beneath the price field.

### REC-004 — Line Item Reordering
Add drag handles on table rows (6-dot grip on left of row number) to allow reordering of line items. Important for BOM and PO presentation order.

### REC-005 — Quick Duplicate Row
Right-click on a line → "Duplicate Row" context menu. Useful when ordering same item from multiple suppliers or same fabric in different lots.

### REC-006 — Search Keyboard Navigation
In ItemSearch dropdown: arrow keys to navigate, Enter to select, Esc to close. Standard UX expectation for power users.

### REC-007 — Print / PDF Preview
Add a "🖨 Print" button in the sub-toolbar that renders the document in a clean print layout (white background, no UI chrome, proper column widths) before triggering browser print.

### REC-008 — Autosave Draft Indicator
Show a subtle "⟳ Saving…" → "✓ Saved at HH:MM" indicator in the status bar right section. Autosave draft every 2 minutes to a GAS property.

### REC-009 — Empty State Illustrations
When line items table is empty, show a contextual empty state: icon + "No line items yet" + quick tip relevant to the module (not just plain text).

### REC-010 — Responsive Command Panel Collapse
At viewport widths below 900px, Command Panel should auto-collapse to an icon-only rail (48px), expandable on click. This handles tablet access.

---

## 24. ICON SYSTEM — MANDATORY EVERYWHERE 🎨

### 24A. Core Principle
**Every entity, section, accordion item, menu item, field group, module, record type, and status must carry an icon.** Icons make the ERP scannable at speed — reducing cognitive load in dense tables.

Icons are sourced from a single **ICON_MASTER** constant (emoji-first, with future SVG icon set support). Users can change any icon via a **Notion-style icon picker** that appears on hover/click of any icon in the UI.

### 24B. ICON_MASTER — Complete Library

```js
const ICON_MASTER = {
  // ── Modules ─────────────────────────────────────
  procurement:     "📦",   production:     "🏭",
  inventory:       "🗄️",   quality:        "🔬",
  sales:           "💼",   finance:        "💰",
  masters:         "🗂️",   dashboard:      "📈",
  settings:        "⚙️",   reports:        "📊",

  // ── Documents ───────────────────────────────────
  purchaseOrder:   "🧾",   goodsReceipt:   "📥",
  workOrder:       "🔧",   bom:            "📐",
  stockLedger:     "📋",   qualityReport:  "🧪",
  salesOrder:      "🛒",   invoice:        "🧾",
  deliveryNote:    "🚚",   creditNote:     "↩️",

  // ── Items / Categories ───────────────────────────
  fabric:          "🧵",   trim:           "🪡",
  chemical:        "🧪",   packaging:      "📦",
  label:           "🏷️",   garment:        "👕",
  thread:          "🧶",   zipper:         "🔗",
  button:          "🔘",   elastic:        "〰️",

  // ── Entities ─────────────────────────────────────
  supplier:        "🏭",   customer:       "👤",
  warehouse:       "🏪",   location:       "📍",
  uom:             "📏",   currency:       "💱",
  tax:             "📑",   season:         "🗓️",

  // ── Actions ──────────────────────────────────────
  add:             "➕",   edit:           "✏️",
  delete:          "🗑️",   save:           "💾",
  submit:          "▶️",   approve:        "✅",
  reject:          "❌",   print:          "🖨️",
  preview:         "👁️",   export:         "📤",
  import:          "📥",   search:         "🔍",
  filter:          "🔽",   sort:           "↕️",
  group:           "📁",   duplicate:      "📄",
  attach:          "📎",   refresh:        "🔄",
  draft:           "📝",   lock:           "🔒",
  unlock:          "🔓",   info:           "ℹ️",
  warning:         "⚠️",   error:          "🚨",
  success:         "✅",   pending:        "⏳",

  // ── Accordion Sections ───────────────────────────
  docInfo:         "📋",   partyInfo:      "🏭",
  terms:           "📅",   logistics:      "🚛",
  totals:          "₹",    notes:          "📝",
  attachments:     "📎",   history:        "🕐",
  openRecords:     "📄",   measurements:   "📐",
  results:         "🎯",   schedule:       "🗓️",

  // ── Status ───────────────────────────────────────
  draft:           "📝",   pending:        "⏳",
  approved:        "✅",   rejected:       "❌",
  partiallyDone:   "🔶",   completed:      "🏁",
  cancelled:       "🚫",   onHold:         "⏸️",
};
```

### 24C. Notion-Style Icon Picker

**Trigger:** Hover over any icon → it gains a subtle border + pencil overlay (✏️ in bottom-right corner). Click → `IconPicker` component opens.

**IconPicker Component:**
```
┌─ Change Icon ─────────────────────────────────┐
│ 🔍 Search icons…                              │
├───────────────────────────────────────────────┤
│  MODULES        DOCUMENTS       ITEMS          │
│  📦 📊 🏭 🔬   🧾 📥 🔧 📐   🧵 🪡 🧪 📦    │
│  💼 💰 🗂️ 📈                   🏷️ 👕 🧶 🔗   │
├───────────────────────────────────────────────┤
│  ACTIONS        STATUS          ENTITIES       │
│  ➕ ✏️ 🗑️ 💾   📝 ⏳ ✅ ❌   🏭 👤 🏪 📍   │
│  ▶️ ✅ 🖨️ 👁️   🔶 🏁 🚫 ⏸️                   │
├───────────────────────────────────────────────┤
│  Or type any emoji directly:  [_________]     │
│                                    [ Apply ]  │
└───────────────────────────────────────────────┘
```

**IconPicker Spec:**
- Width: 320px, positioned below the clicked icon
- Background: `M.surfHigh`, border: `1px solid M.divider`, radius: 8, shadow: `M.shadow`
- Search: filters ICON_MASTER keys by name
- Grid: categories as rows, 12 icons per row, 28×28px each, hover: `M.hoverBg` background
- Selected icon: `A.al` background + `A.a` border
- "Type emoji directly" fallback input for any custom emoji
- Apply button: accent bg, saves icon to user preferences via GAS `PropertiesService`
- Animation: `dd-anim` (fadeDown)

### 24D. Icon Display Rules

| Context | Icon Size | Shown Where |
|---------|-----------|-------------|
| Shell bar logo module icon | 15–18px inside 30×30px container | Shell bar logo block |
| Module/page title | 20px | Breadcrumb trail, page heading |
| Accordion section header | 14px | Beside accordion title |
| Table column header | 10–12px | Optional, for key columns |
| Table row — item category | 14px | Category column or badge |
| Form field label | 10px | Beside the UPPERCASE label |
| Status chips / badges | 10–12px | Inside pill, before status text |
| Command panel nav items | 14px | Beside nav label |
| Button | 12–14px | Before button text (never after) |
| Empty state | 36–48px | Centred, large, above text |
| Toast / notification | 14px | Before message text |

### 24E. Icon Persistence
Icons selected via picker are saved per-entity in GAS `PropertiesService` under key `ICON_[entityType]_[code]`. Example: `ICON_SUPPLIER_SUP-001` = `"🏗️"`. Loaded at render time. Fallback = ICON_MASTER default.

---

## 25. DATA TABLE POWER CONTROLS — MANDATORY 🔽

### 25A. Principle
**Every data table in the ERP — list views, line items, master records, reports — must include sorting, filtering, grouping, and sub-grouping.** These controls appear in a persistent Table Control Bar between the sub-toolbar and the table itself.

### 25B. Table Control Bar Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔽 Filters (2)  ↕️ Sort: Item Name ↑  📁 Group: Category  📄 Sub: UOM │
│                                         [ 🗑 Clear All ]  [ ⊞ Columns ] │
└─────────────────────────────────────────────────────────────────────────┘
```

- Background: `M.surfMid`
- Border-bottom: `1px solid M.divider`
- Padding: `6px 20px`
- Height: auto (collapses to ~34px when no controls active)
- All controls are pills/chips — clicking opens a popover/dropdown

### 25C. SORTING

**Trigger:** Click any column header → cycles: None → ASC ↑ → DESC ↓ → None
**Or:** Click `↕️ Sort` pill in Control Bar → opens Sort Builder

**Sort Builder popover (300px wide):**
```
┌─ Sort ────────────────────────────────────┐
│ Primary:  [Item Name ▾]  [ASC ▾]  [🗑]   │
│ Then by:  [Category  ▾]  [ASC ▾]  [🗑]   │
│ Then by:  [Date      ▾]  [DESC▾]  [🗑]   │
│ [ + Add Sort Level ]                      │
│                        [ Apply ] [Clear]  │
└───────────────────────────────────────────┘
```

**Column header sort indicators:**
- Unsorted: `↕️` in `M.textD`
- ASC: `↑` in `A.a`
- DESC: `↓` in `A.a`
- Sorted column header background: `${A.a}10`

**Multi-sort:** Up to 3 levels. Priority shown with numbers (1, 2, 3) beside the arrow.

### 25D. FILTERING

**Trigger:** Click `🔽 Filters` pill → opens Filter Builder panel

**Filter Builder (420px slide-down below control bar):**
```
┌─ Filters ──────────────────────────────────────────────────────────────┐
│  + Add Filter                                   Match: [ALL ▾] of rules│
├────────────────────────────────────────────────────────────────────────┤
│  🔽  [Category     ▾]  [is         ▾]  [Fabric          ▾]  [🗑]      │
│  🔽  [GST %        ▾]  [equals     ▾]  [12              ]   [🗑]      │
│  🔽  [Supplier     ▾]  [contains   ▾]  [Vardhman        ]   [🗑]      │
│  🔽  [Date         ▾]  [is between ▾]  [01 Jan] and [28 Feb]  [🗑]   │
├────────────────────────────────────────────────────────────────────────┤
│                              [ Apply Filters ]      [ Clear All ]      │
└────────────────────────────────────────────────────────────────────────┘
```

**Filter operators by field type:**
| Type | Operators |
|------|-----------|
| Text | is · is not · contains · starts with · ends with · is empty |
| Number | equals · ≠ · > · ≥ · < · ≤ · is between · is empty |
| Date | is · is before · is after · is between · this week · this month |
| Select/Code | is · is not · is any of · is none of |
| Boolean | is true · is false |

**Active filter chips (shown in Control Bar):**
- Each active filter shown as a small chip: `🔽 Category: Fabric ×`
- Chip: `A.al` background, `A.a` text, `A.a` border, `× ` to remove
- Filter count shown: `🔽 Filters (2)`

**Column header filter icon:** Small `▾` icon appears on hover of any column header → quick single-field filter popover

### 25E. GROUPING

**Trigger:** Click `📁 Group` pill in Control Bar → opens Group selector

**Group Selector (240px dropdown):**
```
┌─ Group by ─────────────────────────┐
│  None (remove grouping)            │
│  ─────────────────────────────     │
│  📦 Category                       │
│  🏭 Supplier                       │
│  🗓️ Season / Month                 │
│  ↕️ GST %                          │
│  📍 Warehouse                      │
└────────────────────────────────────┘
```

**Grouped table appearance:**
```
┌─ 🧵 FABRIC  (4 items)  ─────────────────── [▾ Collapse] ──────────┐
│   # │ Item Name         │ UOM │ Qty │ Unit Price │ Line Total      │
│   1 │ Single Jersey…    │ KG  │ 100 │ ₹ 185      │ ₹ 18,500       │
│   2 │ Pique Fabric…     │ KG  │  50 │ ₹ 200      │ ₹ 10,000       │
│     │                   │     │     │ Group Total│ ₹ 28,500 ●     │
├─ 🪡 TRIM    (2 items)  ─────────────────── [▾ Collapse] ──────────┤
│  ...                                                                │
```

**Group header row:**
- Background: `${A.a}15`, left border: `3px solid A.a`
- Icon (from ICON_MASTER) + GROUP NAME (weight 900, uppercase) + item count badge
- Right side: Collapse/Expand toggle + group subtotal for numeric columns
- Subtotal row at bottom of each group: lighter accent bg, bold values, `●` marker

**Expand / Collapse all:** Button in table control bar: `[⊞ Expand All]` / `[⊟ Collapse All]`

### 25F. SUB-GROUPING

Appears as a second level within a group. Same visual treatment but indented 20px, with a softer accent shade.

**Sub-group Selector (shown after primary group selected):**
```
📁 Group: Category   →   📁 Sub: UOM
```

**Sub-group header:**
- Background: `${A.a}08` (softer than group)
- Left border: `3px solid ${A.a}60`
- Indent: 20px
- Smaller text: 10px, weight 800

**Example visual:**
```
┌─ 🧵 FABRIC (6 items) ─────────────────────────────────────────────┐
│  ┌─ KG (4 items) ─────────────────────────────────────────────┐   │
│  │  1 │ Single Jersey…     │ 100 │ ₹185  │ ₹18,500           │   │
│  │  2 │ French Terry…      │  80 │ ₹240  │ ₹19,200           │   │
│  │    │                    │     │ Sub Total│ ₹37,700         │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌─ MTR (2 items) ────────────────────────────────────────────┐   │
│  │  3 │ Pique Fabric…      │ 200 │ ₹90   │ ₹18,000           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                           Group Total: ₹55,700 ● │
└───────────────────────────────────────────────────────────────────┘
```

### 25G. COLUMN MANAGER

**Trigger:** Click `⊞ Columns` button (right of Control Bar)

```
┌─ Manage Columns ──────────────────────┐
│  Drag to reorder. Toggle to show/hide.│
│  ─────────────────────────────────── │
│  ⠿  ✅  #   Row Number               │
│  ⠿  ✅  📦  Item                     │
│  ⠿  ✅  📏  UOM                      │
│  ⠿  ✅  🏷️  HSN                     │
│  ⠿  ✅  %   GST %                    │
│  ⠿  ✅  🔢  Quantity                 │
│  ⠿  ✅  ₹   Unit Price               │
│  ⠿  ☑️  %   Discount %               │
│  ⠿  ✅  ₹   Line Total               │
│  ─────────────────────────────────── │
│  [ Reset to Default ]                 │
└───────────────────────────────────────┘
```
- Drag handle: ⠿ (6-dot grip), `M.textD`
- Toggle: checkbox — checked = visible
- Saves column order + visibility to `PropertiesService`

### 25H. Quick Filter Row (Optional Per Module)

Directly beneath column headers, a row of lightweight filter inputs per column:

```
│ [🔍 search name…] │ [All UOM▾] │ [All HSN▾] │ [All GST▾] │ [≥ qty] │
```

- Shown/hidden via a `[≡ Quick Filter]` toggle in the Control Bar
- Each cell is a small input or select matching the column type
- Filters apply live as the user types (debounced 300ms)

### 25I. State Persistence
All sort/filter/group state saved to `PropertiesService` per user per sheet. Restored on next open. Users can save named "views" (e.g. "Fabric Only", "High Value POs") and switch between them.

---

## 26. FULL-WIDTH LAYOUT — MANDATORY 📐

### 26A. Rule
**ALL pages, panels, tables, and forms in the CC ERP must fill 100% of the available viewport width at all times. There are no max-width caps anywhere in the application.**

```js
// Root container — always
{ width: "100vw", minHeight: "100vh", overflow: "hidden" }

// Body layout — always
{ display: "flex", flexDirection: "column", height: "100vh" }

// Shell bar — always
{ width: "100%", display: "flex", alignItems: "center" }

// Main body row — always
{ flex: 1, display: "flex", overflow: "hidden", width: "100%" }

// Main content — always
{ flex: 1, overflow: "hidden" }  // takes all remaining width after sidebar
```

### 26B. Sidebar does NOT restrict main content
The Command Panel is fixed-width (draggable), and the main content area is `flex: 1` — it automatically fills all remaining space. As the sidebar is dragged wider, the table/form area shrinks proportionally (never clipped, never scrolled horizontally unless the table columns themselves require it).

### 26C. Modal / Settings Panel overlays
All panels (Settings, Icon Picker, Filter Builder, Preview, Print) use `position: fixed, inset: 0` for the backdrop — they overlay the full viewport without affecting the base layout width.

### 26D. Table minimum width
Data tables set `min-width` per module based on their column count, triggering horizontal scroll **within the table scroll container only** (not the page). The page itself never scrolls horizontally.

---

## 27. SAVE PREVIEW MODAL — MANDATORY BEFORE ALL SAVES 👁️

### 27A. Rule
**Every data entry form that writes to Google Sheets must show a Preview Modal before committing.** No silent saves. User must actively confirm after reviewing a summary of what will be saved.

**Exceptions:** Draft autosave (every 2 min) happens silently in the background without preview.

### 27B. Preview Modal Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  👁️  Preview — Purchase Order                              [×]          │
│  ─────────────────────────────────────────────────────────────────────  │
│  WHAT WILL BE SAVED                                                     │
│                                                                         │
│  ┌─ Document ──────────────────────────────────────────────────────┐   │
│  │  📋 Reference    PO-2026-0042 (auto)                            │   │
│  │  🗓️ Date         24 Feb 2026                                    │   │
│  │  🏭 Supplier     SUP-004 · Vardhman Textiles Ltd, Ludhiana      │   │
│  │  📦 Type         Fabric                                         │   │
│  │  📅 Payment      30 Days Credit                                 │   │
│  │  🗓️ Deliver By   10 Mar 2026                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Line Items (3) ────────────────────────────────────────────────┐   │
│  │  # │ Item                     │ Qty │ Price   │ Disc │ Total    │   │
│  │  1 │ 🧵 Single Jersey 180 GSM │ 100 │ ₹185.00 │  0%  │ ₹18,500 │   │
│  │  2 │ 🧵 Pique Fabric 220 GSM  │  50 │ ₹200.00 │  5%  │ ₹ 9,500 │   │
│  │  3 │ 🧵 French Terry 280 GSM  │  80 │ ₹240.00 │  0%  │ ₹19,200 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Financial Summary ─────────────────────────────────────────────┐   │
│  │  Base Value    ₹ 47,200.00     GST (12%)   ₹ 5,664.00          │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  GRAND TOTAL  ₹ 52,864.00  ▓▓▓▓▓▓▓▓▓▓▓▓ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ⚠️  This action will write to PO_MASTER and PO_LINE_ITEMS sheets.     │
│      This cannot be undone without admin access.                        │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  [ 💾 Save as Draft ]        [ ← Edit ]    [ ✅ Confirm & Submit ]     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 27C. Preview Modal Spec

**Dimensions:** `max-width: 780px`, centred, `max-height: 90vh`, scrollable body
**Backdrop:** `rgba(0,0,0,.6)` + `backdropFilter: blur(3px)`, `position: fixed, inset: 0`
**Animation:** `scaleIn 0.2s` (from 0.95 scale)
**Background:** `M.surfHigh`
**Border:** `1px solid M.divider`, radius: 8
**Shadow:** `M.shadow` × 2 (doubled intensity)

**Header:**
- Icon (module/doc icon from ICON_MASTER) + "Preview — [Document Type]"
- Font: 16px, weight 900, `M.textA`
- `×` close = same as Edit (does not discard data)

**Section blocks (inside preview):**
- Background: `M.surfMid`, padding: `12px 16px`, radius: 6, `margin-bottom: 12px`
- Section label: 9px, weight 900, uppercase, `M.textD`
- Each field: `icon + label (M.textC)` on left, `value (M.textA, weight 700)` on right
- Codes displayed in IBM Plex Mono

**Line items mini-table:**
- Compact version of the main table
- Scrollable if > 8 rows
- Row numbers + icons + key columns only
- Total row: `A.a` colour, weight 900

**Financial summary block:**
- Background: `A.al`, border: `1px solid ${A.a}40`
- Grand Total: centred, `A.a` colour, 18px, weight 900, IBM Plex Mono
- Optional progress bar accent strip above/below

**Warning message:**
- `⚠️` prefix, `M.textC`, 11px italic
- States exactly which sheets will be written to

**Action buttons:**
| Button | Style | Action |
|--------|-------|--------|
| 💾 Save as Draft | Ghost (border only) | Saves draft, closes modal, stays on form |
| ← Edit | `M.surfMid` bg | Closes modal, returns to form without losing data |
| ✅ Confirm & Submit | `A.a` bg, `A.tx` text, weight 900 | Commits to GAS, shows success toast, navigates to record view |

### 27D. Validation Before Preview
Preview Modal only opens if all required fields pass validation. If validation fails:
- Modal does NOT open
- All failing fields get red left border + shake animation
- A validation summary appears above the form: `⚠️ 3 required fields are missing`
- First failing field auto-scrolls into view and gains focus

### 27E. Success Toast (post-submit)
After confirmed submit:
```
┌──────────────────────────────────────────────────────┐
│  ✅  PO-2026-0042 created successfully  [ View ]     │
└──────────────────────────────────────────────────────┘
```
- Position: bottom-right, `position: fixed`
- Background: `#15803D` (success green), white text
- Auto-dismiss: 5 seconds with a progress bar underline
- `[ View ]` button navigates to the new record

---

## 28. PRINT PREVIEW — MANDATORY EVERYWHERE 🖨️

### 28A. Rule
**Every module screen must have a Print Preview button** (`🖨️ Print Preview`) in the main content sub-toolbar. This renders a **clean, themed print layout** in a full-screen overlay before the browser's native print dialog is invoked.

### 28B. Print Button Placement

In every **Content Sub-Toolbar** (just below the top shell bar, inside the main content area):

```
┌─ Content Sub-Toolbar ──────────────────────────────────────────────────┐
│  📋 Line Items  (3 rows)  ₹52,864 total   [+ Add Row]  [🖨️ Preview]   │
└────────────────────────────────────────────────────────────────────────┘
```

The `🖨️ Print Preview` button:
- Style: ghost (border only, `M.inputBd` border, `M.textB` text)
- On hover: border turns `A.a`, text turns `A.a`
- Opens the Print Preview overlay (full screen)

### 28C. Print Preview Overlay

Full-screen white overlay simulating a printed page. The overlay is rendered before `window.print()` is called, so users see exactly what will be printed.

```
┌─────────────────────────────────────────── [ × Close ]  [ 🖨️ Print ] ─┐
│  [ ← Landscape ] [ → Portrait ]  [ 🔎 Zoom: 100% ▾ ]  [PDF / Sheet]  │
├──────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─────────────────────────── PRINT AREA (white) ───────────────────┐  │
│  │  CONFIDENCE CLOTHING PVT. LTD.          [Logo/Brand block]       │  │
│  │  Phase-8, Industrial Area, Ludhiana     Tel: +91-XXXXXXXXXX      │  │
│  │  GSTIN: XXXXXXXXXXX                                              │  │
│  │  ─────────────────────────────────────────────────────────────   │  │
│  │                                                                   │  │
│  │  PURCHASE ORDER                         PO-2026-0042             │  │
│  │  Date: 24 Feb 2026   Delivery: 10 Mar 2026   Season: SS26        │  │
│  │                                                                   │  │
│  │  SUPPLIER                                                         │  │
│  │  Vardhman Textiles Ltd, Ludhiana                                  │  │
│  │  GSTIN: 03AABCV3456I1Z1   Credit: 30 Days                        │  │
│  │  ─────────────────────────────────────────────────────────────   │  │
│  │  # │ Item Description    │ HSN  │ UOM │ Qty │ Rate  │ Amount    │  │
│  │  1 │ Single Jersey 180…  │ 6006 │ KG  │ 100 │  185  │ 18,500   │  │
│  │  2 │ Pique Fabric 220…   │ 6006 │ KG  │  50 │  200  │  9,500   │  │
│  │  3 │ French Terry 280…   │ 6006 │ KG  │  80 │  240  │ 19,200   │  │
│  │  ─────────────────────────────────────────────────────────────   │  │
│  │                          Sub-Total (excl. GST)    ₹ 47,200.00   │  │
│  │                          IGST @ 12%                ₹  5,664.00  │  │
│  │                          ══ GRAND TOTAL ══         ₹ 52,864.00  │  │
│  │                                                                   │  │
│  │  Terms: 30 Days Credit                                           │  │
│  │  Deliver to: Factory, Phase-8, Ludhiana                          │  │
│  │  ─────────────────────────────────────────────────────────────   │  │
│  │  Authorised Signatory                    For Confidence Clothing │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 28D. Print Preview Spec

**Overlay container:** `position: fixed, inset: 0`, `background: #1a1a1a` (always dark, regardless of theme), `z-index: 9999`

**Control bar (top of overlay):**
- Background: `#111`, `border-bottom: 1px solid #333`
- Controls: × Close | Orientation toggle | Zoom selector | Export as PDF / Export to Google Sheet

**Print area (white page):**
- Background: `#ffffff` (always white — print standard)
- `color: #000000` (always black text on print)
- Max-width: A4 portrait (794px) or A4 landscape (1123px)
- Shadow: `0 8px 40px rgba(0,0,0,.5)` on dark overlay
- Padding: 40px (simulating print margins)
- Centred in the overlay

**Print area contents (always include):**
1. **Company header block:** Name, address, GSTIN, phone
2. **Document title + reference number** — bold, prominent
3. **Document metadata** — date, type, season, etc.
4. **Party block** — supplier/customer details
5. **Line items table** — clean black borders, no colours, standard font
6. **Financial summary** — aligned right, boxed totals
7. **Terms & conditions** — compact, below totals
8. **Footer** — "Authorised Signatory" line + "For Confidence Clothing"
9. **Page number** — "Page 1 of N" bottom-right

**Print CSS rules (injected on print):**
```css
@media print {
  body * { visibility: hidden; }
  #print-area, #print-area * { visibility: visible; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; }
  @page { margin: 20mm; }
}
```

**Zoom control:** 60% / 80% / 100% / 120% — scales the print area using `transform: scale(x)`

**Export options:**
- `🖨️ Print` → triggers `window.print()` using the prepared print CSS
- `📄 PDF` → note "Use 'Save as PDF' in the print dialog" (no server-side PDF yet; REC-007)

---

## 29. UNSAVED CHANGES GUARD — MANDATORY 🚨

### 29A. Rule
**Any navigation away from a form that contains unsaved user-entered data must trigger an Unsaved Changes Guard popup.** This applies to:
- Switching between PO ↔ GRN mode
- Clicking breadcrumb / Home
- Closing a browser tab (browser native `beforeunload`)
- Switching modules
- Clicking any link that would navigate away

**NOT triggered by:** Opening/closing the Settings Panel, Icon Picker, filter dropdowns, or sort popovers.

### 29B. Dirty State Detection

A form is **dirty** when any user-entered field has been changed from its initial state (empty or last-saved value). Tracked via a `isDirty` boolean state, set to `true` on any `onChange` event in the form. Reset to `false` after successful save or explicit discard.

```js
// Example state
const [isDirty, setIsDirty] = useState(false);

// On any field change
const handleFieldChange = (field, value) => {
  setIsDirty(true);
  // ... update state
};

// On save success
const handleSaveSuccess = () => {
  setIsDirty(false);
};
```

A subtle **dirty indicator** shows in the shell bar breadcrumb when `isDirty === true`:
```
Home › Procurement › Purchase Order  ●
```
The `●` is a small amber dot (`#f59e0b`), 6px, beside the current page name. Tooltip: "You have unsaved changes".

### 29C. Unsaved Changes Popup

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ⚠️   Unsaved Changes                                    │
│                                                          │
│  You have unsaved changes on this form.                  │
│  What would you like to do?                             │
│                                                          │
│  ┌──────────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │  💾 Save as Draft │ │ ← Keep Editing│ │ 🗑 Discard │  │
│  └──────────────────┘ └──────────────┘ └────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Popup Spec:**
- Width: 440px, centred (horizontal + vertical)
- Background: `M.surfHigh`, border: `1px solid M.divider`, radius: 10
- Backdrop: `rgba(0,0,0,.65)` + blur(3px), `position: fixed, inset: 0`
- Animation: `scaleIn 0.15s`
- Icon: `⚠️` 32px, centred above title
- Title: "Unsaved Changes" — 16px, weight 900, `M.textA`
- Body: 13px, `M.textB`

**Three action buttons:**

| Button | Style | Behaviour |
|--------|-------|-----------|
| 💾 Save as Draft | `A.a` bg, `A.tx` text, weight 900 | Saves all current data as a draft record in GAS, then proceeds with navigation |
| ← Keep Editing | `M.surfMid` bg, `M.textB` | Closes popup, returns to form exactly as left |
| 🗑 Discard Changes | Red border (`#ef4444`), red text | Discards all changes, `isDirty = false`, proceeds with navigation |

**Button order:** Draft (primary, left) → Keep Editing (secondary, centre) → Discard (danger, right)

**Keyboard:** `Esc` = Keep Editing. `Enter` on focused button = that action.

### 29D. Browser Tab Close / Refresh Guard

```js
useEffect(() => {
  const handler = (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = ""; // triggers native browser dialog
    }
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [isDirty]);
```

Note: Browser's native dialog cannot be customised — shows default "Leave site?" message. This is acceptable.

### 29E. Draft Storage Format

Draft saved to GAS `PropertiesService` under key `DRAFT_[MODULE]_[userId]`:

```json
{
  "savedAt": "2026-02-24T10:35:00.000Z",
  "module": "PROCUREMENT_PO",
  "formData": {
    "supplier": "SUP-004",
    "poDate": "2026-02-24",
    "season": "SS26",
    "lines": [...]
  }
}
```

**Draft restore:** On next page open, if a draft exists for the current module + user:
```
┌──────────────────────────────────────────────────────────────┐
│  📝  Draft found from 24 Feb 2026, 10:35 AM                 │
│  Would you like to restore it?    [ Restore ] [ Start Fresh ]│
└──────────────────────────────────────────────────────────────┘
```
This banner appears below the shell bar, full-width, `A.al` background + `A.a` border-bottom.

---

## 30. EXPORT OPTIONS — MANDATORY ON EVERY MODULE 📤

### 30A. Rule
**Every module list view, transaction form, and report must offer all four export options: Print, PDF, Google Sheets, and Excel.** These are accessible from a single **Export Menu** button in the content sub-toolbar, and also from within the Print Preview overlay.

### 30B. Export Button in Sub-Toolbar

```
┌─ Content Sub-Toolbar ──────────────────────────────────────────────────┐
│  📋 Line Items  (3 rows)  ₹52,864 total   [+ Add Row]  [📤 Export ▾]  │
│                                                        [🖨️ Print Preview]│
└────────────────────────────────────────────────────────────────────────┘
```

`[📤 Export ▾]` button opens a dropdown menu directly below:

```
┌─ Export / Open ──────────────────────────────┐
│  🖨️  Print Preview          Ctrl+P           │
│  ─────────────────────────────────────────   │
│  📄  Save as PDF            (via Print)      │
│  📊  Open in Google Sheets  (new tab)        │
│  📗  Download as Excel      (.xlsx file)     │
│  ─────────────────────────────────────────   │
│  📋  Copy Table to Clipboard                 │
│  🔗  Share Link to this View                 │
└──────────────────────────────────────────────┘
```

**Button style:**
- Ghost with border: `1px solid M.inputBd`, `M.textB` text
- Hover: border `A.a`, text `A.a`
- Dropdown: `dd-anim`, `M.dropBg` bg, `M.shadow`, radius 6, 240px wide
- Each row: icon (14px) + label + right-aligned shortcut/tag
- Hover: `M.dropHover` bg
- Dividers: `M.divider`

### 30C. 📄 Save as PDF

**Method:** Triggers the browser's native `window.print()` with a print-optimised CSS layout. User selects "Save as PDF" in the browser's print dialog.

**Process:**
1. User clicks "📄 Save as PDF"
2. Print Preview overlay opens automatically (same as §28)
3. A banner appears at top: `💡 In the print dialog, choose "Save as PDF" as the destination`
4. User clicks `🖨️ Print` in the overlay
5. Browser print dialog opens — user selects "Save as PDF" and chooses file location

**PDF filename suggestion (set via document title before print):**
```js
document.title = `${docType}_${docRef}_${dateStr}`;
// e.g. "PO_PO-2026-0042_24Feb2026"
// Browser uses this as the default PDF filename
```

**Print/PDF CSS (injected at print time):**
```css
@media print {
  body * { visibility: hidden; }
  #cc-print-area, #cc-print-area * { visibility: visible; }
  #cc-print-area {
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: white; color: black;
  }
  @page {
    size: A4 portrait;
    margin: 15mm 20mm;
  }
  .no-print { display: none !important; }
}
```

**Print area always includes (see §28C for full layout):**
- Company header (name, address, GSTIN, phone)
- Document title + auto-reference number
- Party / supplier / customer block
- Line items table (clean, black borders, no theme colours)
- Financial summary (Base + GST + Grand Total)
- Terms, delivery address, notes
- Authorised signatory footer
- Page N of N (bottom-right)

### 30D. 📊 Open in Google Sheets

**Method:** GAS function `exportToGoogleSheet()` creates a new Google Sheet in the user's Drive from the current view data and opens it in a new tab.

**GAS function behaviour:**
```js
function exportToGoogleSheet(moduleId, recordRef, dataPayload) {
  // 1. Create new SS in user's Drive
  const ss = SpreadsheetApp.create(`CC ERP Export — ${moduleId} — ${recordRef}`);
  const sheet = ss.getActiveSheet();

  // 2. Write company header rows
  sheet.getRange("A1").setValue("CONFIDENCE CLOTHING PVT. LTD.");
  sheet.getRange("A2").setValue(`${moduleId} — ${recordRef}`);
  sheet.getRange("A3").setValue(`Exported: ${new Date().toLocaleString("en-IN")}`);

  // 3. Write column headers (Row 5)
  // 4. Write data rows from dataPayload
  // 5. Apply basic formatting (bold headers, borders, number formats)
  // 6. Auto-resize columns
  // 7. Freeze header rows

  // 8. Return the URL
  return ss.getUrl();
}
```

**UI flow:**
1. User clicks "📊 Open in Google Sheets"
2. A loading toast appears: `⟳ Creating Google Sheet…` (bottom-right, `M.surfMid` bg)
3. GAS `exportToGoogleSheet()` called via `google.script.run`
4. On success: toast updates to `✅ Opened in Google Sheets` + auto-opens the new Sheet URL in a new browser tab
5. On failure: toast updates to `❌ Export failed — try again`

**Google Sheet format (when opened):**
```
Row 1: CONFIDENCE CLOTHING PVT. LTD.          [bold, merged A1:G1]
Row 2: Purchase Order — PO-2026-0042           [bold, merged A2:G2]
Row 3: Exported: 24 Feb 2026, 10:35 AM        [italic, merged A3:G3]
Row 4: (blank)
Row 5: # | Item Code | Item Name | UOM | Qty | Unit Price | Line Total   [bold, bg #E8690A, white text]
Row 6+: data rows (alternating #f9fafb / #ffffff)
Last rows: Base Total | GST | Grand Total
```

**Naming convention for exported file:** `CC ERP — [Module] — [DocRef] — [Date]`
Example: `CC ERP — PO — PO-2026-0042 — 24Feb2026`

**Saved location:** User's Google Drive root (or a subfolder `CC ERP Exports/` if it exists).

**"Open" vs "Save":** Always opens immediately in a new tab — no separate "save" step needed since it's already in Drive.

### 30E. 📗 Download as Excel (.xlsx)

**Method:** GAS function `exportToExcel()` generates an `.xlsx` file and triggers a browser download.

**GAS approach — using Google Sheets as intermediary:**
```js
function exportToExcel(moduleId, recordRef, dataPayload) {
  // 1. Create temporary Google Sheet (same as exportToGoogleSheet)
  const ss = createExportSheet(moduleId, recordRef, dataPayload);

  // 2. Convert to Excel using Drive API export URL
  const xlsxUrl = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=xlsx&id=${ss.getId()}`;

  // 3. Return the download URL to the client
  // 4. Delete the temporary Sheet after 60 seconds (via time-based trigger)
  return xlsxUrl;
}
```

**UI flow:**
1. User clicks "📗 Download as Excel"
2. Loading toast: `⟳ Preparing Excel file…`
3. GAS generates temp Sheet → returns download URL
4. Client opens the URL → browser auto-downloads the `.xlsx` file
5. Toast: `✅ Excel file downloaded`

**Excel filename:** `CC_ERP_[Module]_[DocRef]_[YYYYMMDD].xlsx`
Example: `CC_ERP_PO_PO-2026-0042_20260224.xlsx`

**Excel format (when opened):**
- Sheet tab named: `[Module] — [DocRef]`
- Same layout as Google Sheets export (header rows, formatted table, totals)
- Column widths set appropriately
- Number formats: Indian currency `₹#,##,##0.00`
- Date format: `DD-MMM-YYYY`

### 30F. 📋 Copy Table to Clipboard

Copies the current visible table data (respecting active filters/grouping) as tab-separated values. User can paste directly into any spreadsheet.

```js
const copyTableToClipboard = (rows, headers) => {
  const tsv = [
    headers.join("\t"),
    ...rows.map(r => headers.map(h => r[h] ?? "").join("\t"))
  ].join("\n");
  navigator.clipboard.writeText(tsv);
};
```

Toast on success: `✅ Table copied to clipboard (${rows.length} rows)`

### 30G. Export Options Within Print Preview Overlay

The Print Preview overlay (§28) has its own export toolbar at the top:

```
┌──────────────────────────────────────────────────────────────────────┐
│ [× Close]  [◩ Portrait] [◪ Landscape]  [🔎 100%▾]        [📤 Export▾]│
│                                                            [🖨️ Print] │
└──────────────────────────────────────────────────────────────────────┘
```

The `[📤 Export ▾]` within Print Preview shows:
- 📄 Save as PDF — `💡 Select "Save as PDF" in print dialog, then click Print →`
- 📊 Open in Google Sheets
- 📗 Download as Excel

### 30H. Export Availability by Module

| Module | Print/PDF | Google Sheets | Excel | Clipboard |
|--------|-----------|--------------|-------|-----------|
| Procurement PO | ✅ | ✅ | ✅ | ✅ |
| Procurement GRN | ✅ | ✅ | ✅ | ✅ |
| Production WO | ✅ | ✅ | ✅ | ✅ |
| Production BOM | ✅ | ✅ | ✅ | ✅ |
| Inventory Ledger | ✅ | ✅ | ✅ | ✅ |
| Quality Report | ✅ | ✅ | ✅ | ✅ |
| Master Lists | ✅ | ✅ | ✅ | ✅ |
| Dashboard KPIs | ✅ (chart + table) | ✅ | ✅ | ✅ |

---

## 31. UPDATED COMPONENT CHECKLIST (V3)

Before shipping any new module screen, confirm ALL of the following:

**Theme & Layout**
- [ ] `GlobalStyles` component with fonts + keyframes
- [ ] `MODES` + `ACCENTS` objects (all 6 each, exact hex values)
- [ ] `DEFAULTS` settings object
- [ ] `useDrag` hook (sidebar, min 220, max 580)
- [ ] Full-width root: `width: 100vw`, no max-width caps anywhere
- [ ] 3-zone layout: Shell (48px) + Sidebar (drag) + Main

**Shell Bar**
- [ ] Logo with module icon (from ICON_MASTER, picker-enabled)
- [ ] Breadcrumb with dirty indicator `●`
- [ ] Quick Theme switcher (6 mode emojis)
- [ ] Quick Accent switcher (6 colour dots)
- [ ] Mode toggle (module-specific)
- [ ] ⚙️ Settings gear

**Command Panel**
- [ ] Panel label bar
- [ ] Accordion sections with icons (all from ICON_MASTER, picker-enabled)
- [ ] Supplier / Party detail card
- [ ] Footer: Draft + Submit actions
- [ ] Sticky footer (doesn't scroll)

**Table Controls**
- [ ] Table Control Bar (filters pill + sort pill + group pill + sub-group pill + columns button)
- [ ] Column header sort indicators (click to cycle)
- [ ] Filter Builder (all operators, match ALL/ANY)
- [ ] Sort Builder (multi-level, up to 3)
- [ ] Group + Sub-group rendering with subtotals
- [ ] Column Manager (show/hide, reorder)
- [ ] Optional quick filter row

**Icons**
- [ ] ICON_MASTER constant present
- [ ] All accordion sections have icons
- [ ] All status badges have icons
- [ ] All buttons have icon prefix
- [ ] All category pills have icons (from CAT_ICON)
- [ ] `IconPicker` component on all section icons + entity icons

**Safety Guards**
- [ ] `isDirty` state tracking on all form fields
- [ ] Dirty indicator `●` in breadcrumb
- [ ] `beforeunload` event listener when `isDirty`
- [ ] Unsaved Changes Popup on all navigation triggers
- [ ] Save Preview Modal before every submit
- [ ] Validation check before opening Preview Modal
- [ ] Success toast after confirmed save

**Export**
- [ ] `[📤 Export ▾]` dropdown in sub-toolbar (Print / PDF / Google Sheets / Excel / Clipboard)
- [ ] `🖨️ Print Preview` button in sub-toolbar
- [ ] Print Preview overlay with company header + clean table + financial summary
- [ ] PDF via `window.print()` with correct `document.title` for filename
- [ ] GAS `exportToGoogleSheet()` function — creates new Sheet in Drive, opens in new tab
- [ ] GAS `exportToExcel()` function — creates temp Sheet, exports as .xlsx, auto-downloads
- [ ] Clipboard copy (tab-separated, paste-ready)
- [ ] Export options also available inside Print Preview overlay toolbar
- [ ] Loading toasts and success/error toasts for all export actions
- [ ] `@media print` CSS injected on print with `#cc-print-area` targeting

**Settings Panel**
- [ ] All 7 settings categories
- [ ] 6 colour mode preview cards
- [ ] 6 accent dots
- [ ] Font size / density / table style / line view / sidebar chips
- [ ] 5 display toggles
- [ ] Reset to defaults

**Status Bar**
- [ ] ROWS | BASE | GST | GRAND TOTAL
- [ ] Module identifier + mode + date on right
- [ ] User can hide via settings toggle

---

## 32. LOCKED UI DECISIONS (UPDATED V3)

| Decision | Locked Choice |
|----------|---------------|
| UI pattern | Oracle NetSuite dense commerce + custom theming |
| Body font | Nunito Sans (Google Fonts) |
| Code/number font | IBM Plex Mono (Google Fonts) |
| Default colour mode | ☀️ Light |
| Default accent | Oracle Orange (#E8690A) |
| Layout structure | Shell (48px) + Sidebar (drag) + Drag handle + Main |
| Command panel default width | 340px, min 220, max 580 |
| Settings panel position | Right-side slide-in, 420px wide |
| Auto-fill field visual | Accent light bg + accent text (A.al / A.a) |
| Item search | Dual search (code + name), thumbnail, selected card |
| Status bar position | Bottom of main content, always visible by default |
| Animation library | CSS only (no framer-motion, no react-spring) |
| Row numbers format | Zero-padded 2-digit: "01", "02"… |
| Category colour scheme | Fabric #2563eb, Trim #7c3aed, Chemical #dc2626, etc. |
| Breadcrumb separator | › character |
| Number formatting | en-IN locale (₹ 1,23,456.00) |
| Code display font | IBM Plex Mono always |
| **Page width** | **100% viewport always. Zero max-width caps. Ever.** |
| **Icon system** | **ICON_MASTER emoji library, Notion-style picker on every icon** |
| **Table controls** | **Sort + Filter + Group + Sub-group mandatory on every table** |
| **Save flow** | **Validate → Preview Modal → Confirm → Success toast** |
| **Print** | **Print Preview overlay mandatory on every module** |
| **Unsaved guard** | **isDirty tracking + Popup (Draft / Keep / Discard) mandatory** |
| **Export options** | **Print/PDF + Google Sheets + Excel + Clipboard on every module** |
| **PDF method** | **Browser print dialog → Save as PDF (no server-side PDF generation)** |
| **Google Sheets export** | **GAS creates new Sheet in user Drive, opens in new tab immediately** |
| **Excel export** | **GAS temp Sheet → Drive export URL → .xlsx download, file auto-deleted** |

---

## 34. ACTIVE USER PRESENCE — SHELL BAR TOP RIGHT 👥

### 34A. Approach — Option A + B Combined (LOCKED)

**Dual-layer presence system:**
- **Layer 1 — PropertiesService (speed):** Each client reads/writes `ScriptProperties` every 30 seconds for fast, low-overhead presence detection
- **Layer 2 — PRESENCE Sheet (audit):** Every heartbeat also writes a timestamped row to the `PRESENCE` sheet inside FILE 1C (Masters) for usage logging and audit trails

Both layers run from the same `heartbeat()` call — one write, two destinations.

---

### 34B. UI — Avatar Strip in Shell Bar

**Position:** Right side of the 48px shell bar, between the Settings ⚙️ button and the right edge.

```
┌─ Shell Bar (48px) ──────────────────────────────────────────────────────────┐
│ [📦 CC ERP] [Breadcrumb ●]  ···  [THEME] [ACCENT] [PO/GRN] [⚙️]           │
│                                                                              │
│                              [SA You] [RA●] [PK●] [+2]  🟢 3 online        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Avatar strip layout (right-aligned, flex row, gap 6px):**
```
[You]  [RA ●]  [PK ●]  [MS ●]  [+2]   🟢 3 online
  ↑       ↑       ↑      ↑       ↑         ↑
 Self   Active  Active  Active  Overflow  Count pill
```

**Rules:**
- **Max visible avatars:** 4 (self always shown, + 3 others)
- **Overflow:** If > 3 others online, show `+N` pill instead of extra avatars
- **Self is always first** with accent ring border to distinguish from others
- **Others sorted by:** Most recently active first
- **Stale users fade out** gracefully over 5 seconds after their last heartbeat expires
- **Separator:** Thin `M.divider` line before the avatar strip, separating from ⚙️ button

---

### 34C. Avatar Circle Spec

```
┌──────────────────────────────────────────────────────────┐
│   28×28px circle   │  Colour    │  Content               │
│   border-radius:50%│  from email│  2-letter initials     │
│                    │  hash      │  e.g. "SA", "RA", "PK" │
└──────────────────────────────────────────────────────────┘
```

**Colour generation (deterministic from email):**
```js
const AVATAR_PALETTE = [
  "#E8690A","#0078D4","#007C7C","#15803D",
  "#7C3AED","#BE123C","#B45309","#0E7490",
  "#6D28D9","#047857","#C2410C","#1D4ED8",
];

function avatarColor(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name) {
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts[1]?.[0] || parts[0][1] || "")).toUpperCase();
}
```

**Avatar circle CSS spec:**
```js
// Base avatar
{
  width: 28, height: 28,
  borderRadius: "50%",
  background: avatarColor(user.email),
  color: "#ffffff",
  fontSize: 10, fontWeight: 900,
  fontFamily: "'Nunito Sans', sans-serif",
  display: "flex", alignItems: "center", justifyContent: "center",
  position: "relative",
  cursor: "pointer",
  flexShrink: 0,
  transition: "transform .15s, box-shadow .15s",
  // On hover:
  transform: "scale(1.12)",
  boxShadow: `0 2px 8px rgba(0,0,0,.3)`,
}

// Self ring
{
  border: `2px solid ${A.a}`,
  boxShadow: `0 0 0 1px ${A.al}`,
}

// Active status dot (bottom-right of avatar)
{
  position: "absolute", bottom: 0, right: 0,
  width: 8, height: 8, borderRadius: "50%",
  border: `1.5px solid ${M.shellBg}`,  // cuts into avatar for clean look
}
```

**Status dot colours:**
| State | Colour | Condition |
|-------|--------|-----------|
| 🟢 Active now | `#22c55e` | Last heartbeat < 45 seconds ago |
| 🟡 Idle | `#f59e0b` | Last heartbeat 45 sec – 2 min ago |
| ⚫ Just left | `#6b7280` | Last heartbeat 2–3 min ago (fading out) |
| *(no dot)* | — | > 3 min = removed from strip entirely |

---

### 34D. Hover Tooltip

On hover of any avatar (including self), show a tooltip card:

```
┌─────────────────────────────────────────────┐
│  [RA]  Rajesh Aggarwal                      │
│        rajesh@confidenceclothing.com         │
│        🟢 Active now · 14:08                │
│        📦 Procurement › PO-2026-0041        │
│        ──────────────────────────────       │
│        Online since 13:45 · 23 min          │
└─────────────────────────────────────────────┘
```

**Tooltip spec:**
- Position: below the avatar, right-aligned to avatar
- Background: `M.surfHigh`, border: `1px solid M.divider`, radius: 8
- Shadow: `M.shadow`
- Width: 240px
- Animation: `dd-anim` (fadeDown 0.16s)
- z-index: 9000

**Tooltip content:**
- Row 1: Avatar (larger, 36px) + Full name (weight 900, `M.textA`)
- Row 2: Email in `M.textC`, 10px
- Row 3: Status dot + "Active now" / "Idle" + time (e.g. "14:08")
- Row 4: Module icon + Module › Page they are currently on (from presence data)
- Divider
- Row 5: "Online since HH:MM · X min" in `M.textD`, 10px

**For self tooltip:** Same layout but top line shows "You" badge: `[SA You]` with accent bg pill.

---

### 34E. Overflow Pill (`+N`)

When > 3 other users are online:

```js
// +2 pill spec
{
  height: 28, minWidth: 28,
  padding: "0 8px",
  borderRadius: 14,
  background: M.badgeBg,
  color: M.textB,
  fontSize: 10, fontWeight: 900,
  border: `1px solid M.divider`,
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
}
```

**Click on `+N` pill** → opens a small dropdown panel showing ALL online users:

```
┌─ All Online (5) ──────────────────────────────┐
│  [SA] Saurav Aggarwal (You)     🟢 Masters   │
│  [RA] Rajesh Kumar              🟢 Procurement│
│  [PK] Priya Kapoor              🟡 Inventory  │
│  [MS] Manish Sharma             🟢 Production │
│  [AK] Anita Kaur                🟢 Quality    │
└────────────────────────────────────────────────┘
```

- Each row: 28px avatar + full name + module badge (right-aligned)
- Background: `M.dropBg`, border: `M.divider`, radius: 8, shadow: `M.shadow`
- Width: 280px
- Max-height: 320px, scrollable
- Module badge: 9px chip in `M.badgeBg`

---

### 34F. Online Count Pill

After the avatars, show a compact online count:

```js
// 🟢 3 online
{
  display: "flex", alignItems: "center", gap: 5,
  padding: "3px 10px",
  borderRadius: 20,
  background: "rgba(34,197,94,.12)",   // green tint
  border: "1px solid rgba(34,197,94,.3)",
  fontSize: 10, fontWeight: 800,
  color: "#22c55e",
}
```

Text: `🟢 {n} online` — updates live as count changes.
If only 1 user (self): shows `🟢 Just you`.

---

### 34G. GAS Backend — Dual-Layer Heartbeat

#### Layer 1 — PropertiesService (read/write, every 30 sec)

```js
// CLIENT → GAS (called every 30 seconds via setInterval)
function heartbeat(userInfo) {
  // userInfo = { email, name, module, page, timestamp }

  const props = PropertiesService.getScriptProperties();

  // 1. Write own presence
  props.setProperty(
    `PRESENCE_${userInfo.email}`,
    JSON.stringify({ ...userInfo, ts: Date.now() })
  );

  // 2. Read ALL presence keys
  const all = props.getKeys()
    .filter(k => k.startsWith("PRESENCE_"))
    .map(k => JSON.parse(props.getProperty(k)))
    .filter(u => Date.now() - u.ts < 180000); // keep only last 3 min

  // 3. Clean up stale entries (older than 3 min)
  props.getKeys()
    .filter(k => k.startsWith("PRESENCE_"))
    .forEach(k => {
      const u = JSON.parse(props.getProperty(k));
      if (Date.now() - u.ts > 180000) props.deleteProperty(k);
    });

  return all; // returned to client → updates avatar strip
}
```

#### Layer 2 — PRESENCE Sheet (write-only audit log)

```js
// Appended to same heartbeat() function
function logToPresenceSheet(userInfo) {
  const ss = SpreadsheetApp.openById(FILE_1C_ID);
  const sheet = ss.getSheetByName("PRESENCE") || ss.insertSheet("PRESENCE");

  // Sheet columns:
  // A: Timestamp | B: Email | C: Name | D: Module | E: Page | F: Session ID | G: Action

  sheet.appendRow([
    new Date(),
    userInfo.email,
    userInfo.name,
    userInfo.module,
    userInfo.page,
    userInfo.sessionId,
    "HEARTBEAT"
  ]);
}

// Called on page load with Action = "LOGIN"
// Called on page unload (beforeunload) with Action = "LOGOUT"
// Called every 30 sec with Action = "HEARTBEAT"
```

#### PRESENCE Sheet structure (in FILE 1C):

| Col | Field | Type | Notes |
|-----|-------|------|-------|
| A | Timestamp | DateTime | Auto, every heartbeat |
| B | User Email | Text | FK to user |
| C | User Name | Text | Display name |
| D | Module | Text | e.g. "Procurement" |
| E | Page | Text | e.g. "PO-2026-0041" |
| F | Session ID | Text | UUID generated on login |
| G | Action | Enum | LOGIN / HEARTBEAT / LOGOUT |

**Sheet formatting:** Follows standard CC ERP sheet format — Row 1 banner, Row 2 headers (red/white), Row 3 descriptions, Row 4+ data. Freeze at A4.

**Retention:** A scheduled GAS trigger runs daily at 2 AM to archive rows older than 90 days to a `PRESENCE_ARCHIVE` sheet.

---

### 34H. Client-Side Polling Loop

```js
// In React app — runs after mount
useEffect(() => {
  const sessionId = uid(); // unique per tab open
  let interval;

  const ping = async () => {
    const result = await new Promise((res, rej) =>
      google.script.run
        .withSuccessHandler(res)
        .withFailureHandler(rej)
        .heartbeat({
          email:     Session.getActiveUser().getEmail(),
          name:      currentUserName,
          module:    currentModule,   // e.g. "Procurement"
          page:      currentPage,     // e.g. "PO-2026-0041"
          sessionId: sessionId,
        })
    );
    setOnlineUsers(result); // updates avatar strip
  };

  ping(); // immediate on mount
  interval = setInterval(ping, 30000); // every 30 sec

  // Cleanup: mark as logged out
  const onUnload = () => google.script.run.logPresenceAction("LOGOUT", sessionId);
  window.addEventListener("beforeunload", onUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener("beforeunload", onUnload);
  };
}, []);
```

---

### 34I. Presence Data Flow Diagram

```
┌─ Browser Client A ─────────┐     ┌─ Browser Client B ─────────┐
│  React App                 │     │  React App                 │
│  setInterval(ping, 30000)  │     │  setInterval(ping, 30000)  │
│  onlineUsers state         │     │  onlineUsers state         │
└────────────┬───────────────┘     └────────────┬───────────────┘
             │ google.script.run                 │ google.script.run
             ▼                                   ▼
┌─ GAS heartbeat() ──────────────────────────────────────────────┐
│  1. Write own presence to ScriptProperties                     │
│  2. Read all PRESENCE_* keys from ScriptProperties             │
│  3. Filter out stale (>3 min)                                  │
│  4. Write audit row to PRESENCE sheet (FILE 1C)                │
│  5. Return active user list → both clients update avatar strip │
└────────────────────────────────────────────────────────────────┘
             │                                   │
             ▼                                   ▼
┌─ ScriptProperties ──────────┐   ┌─ PRESENCE Sheet (FILE 1C) ──┐
│  PRESENCE_a@cc.com = {...}  │   │  Timestamp | Email | Module  │
│  PRESENCE_b@cc.com = {...}  │   │  14:08:30  | a@cc  | Proc.  │
│  (auto-cleaned after 3 min) │   │  14:08:30  | b@cc  | Inv.   │
└─────────────────────────────┘   │  (retained 90 days)         │
                                  └─────────────────────────────┘
```

---

### 34J. Usage Analytics from PRESENCE Sheet

Because every session is logged, you get free analytics from the PRESENCE sheet:

| Query | What it shows |
|-------|---------------|
| Sessions per user per day | Who is using the ERP most |
| Time on each module | Which modules get most usage |
| Peak concurrent users | When to schedule maintenance |
| First login / last logout | Working hours per user |
| Page-level heatmap | Which forms are most used |

These can be visualised in a **Dashboard module** (FILE 6) using GAS to query the PRESENCE sheet.

---

### 34K. Presence in the Component Checklist

Add to §31 checklist under a new "Presence" section:

- [ ] `heartbeat()` GAS function written (writes to both PropertiesService + PRESENCE sheet)
- [ ] Client polling loop (`setInterval`, 30 sec) set up in `useEffect`
- [ ] `beforeunload` LOGOUT call wired up
- [ ] `onlineUsers` state drives avatar strip render
- [ ] Avatar colours deterministic from email hash (`avatarColor()`)
- [ ] Initials computed from display name (`initials()`)
- [ ] Status dots: 🟢 Active / 🟡 Idle / ⚫ Leaving (by timestamp delta)
- [ ] Hover tooltip shows: name, email, status, module+page, online duration
- [ ] Overflow `+N` pill with full user list dropdown
- [ ] `🟢 N online` count pill (updates live)
- [ ] Self avatar always first with accent ring
- [ ] PRESENCE sheet in FILE 1C with correct CC ERP formatting
- [ ] Daily 2 AM cleanup trigger for PRESENCE sheet (archive > 90 days)

---

## 35. USER RIGHTS & RBAC — 5-ROLE PERMISSION SYSTEM 🔒

### 35A. Architecture — Source of Truth

**Three-layer system — all three layers always in sync:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — USER_MASTER Sheet (FILE 1C)                             │
│  Source of truth. Admin edits here. GAS reads from here at login.  │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — PropertiesService Cache                                  │
│  GAS caches USER_MASTER data at login. Refreshed every 6 hours.    │
│  Used for fast permission checks without Sheet reads.               │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — Users & Roles Admin Panel (UI)                          │
│  Admin-only interface to add/edit/deactivate users and roles.       │
│  Writes back to USER_MASTER sheet. Also accessible via ⚙️ Settings.│
└─────────────────────────────────────────────────────────────────────┘
```

---

### 35B. The 5 Roles — Definition & Colour Coding

| Role | Badge Colour | Badge | Scope | Typical User |
|------|-------------|-------|-------|--------------|
| **Admin** | `#BE123C` Rose Red | 🔴 ADMIN | Full system access + user management | Owner / IT |
| **Manager** | `#1D4ED8` Blue | 🔵 MANAGER | All modules, all actions, all exports | Department Head |
| **Supervisor** | `#7C3AED` Violet | 🟣 SUPERVISOR | All modules, create/edit/approve, limited exports | Team Lead |
| **Operator** | `#15803D` Green | 🟢 OPERATOR | Assigned modules only, create + view, print only | Data Entry Staff |
| **View Only** | `#6b7280` Grey | ⚪ VIEW ONLY | Assigned modules, read-only, no exports | Auditor / Trainee |

**Role badge** appears:
- In the avatar strip hover tooltip (beside user name)
- In the Users & Roles admin panel
- In the All Online `+N` dropdown (small pill beside each user)
- In the user's own profile (accessible via clicking their own avatar)

---

### 35C. Complete Permission Matrix

#### 35C-1. Module Access

| Module | 🔴 Admin | 🔵 Manager | 🟣 Supervisor | 🟢 Operator | ⚪ View Only |
|--------|---------|-----------|-------------|-----------|------------|
| 📦 Procurement | ✅ | ✅ | ✅ | ✅ (assignable) | ✅ (assignable) |
| 🏭 Production | ✅ | ✅ | ✅ | ✅ (assignable) | ✅ (assignable) |
| 🗄️ Inventory | ✅ | ✅ | ✅ | ✅ (assignable) | ✅ (assignable) |
| 🔬 Quality | ✅ | ✅ | ✅ | ✅ (assignable) | ✅ (assignable) |
| 💼 Sales | ✅ | ✅ | ✅ | ✅ (assignable) | ✅ (assignable) |
| 💰 Finance | ✅ | ✅ | ❌ | ❌ | ❌ |
| 🗂️ Masters / Setup | ✅ | ✅ | ❌ | ❌ | ❌ |
| 📈 Dashboard | ✅ | ✅ | ✅ | ❌ | ✅ (own data only) |
| 👥 User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| ⚙️ System Settings | ✅ | ✅ (partial) | ❌ | ❌ | ❌ |

**"assignable"** = Admin/Manager can restrict an Operator or View Only to specific modules only (e.g. Operator sees Procurement but not Production).

#### 35C-2. Action Permissions

| Action | 🔴 Admin | 🔵 Manager | 🟣 Supervisor | 🟢 Operator | ⚪ View Only |
|--------|---------|-----------|-------------|-----------|------------|
| 👁️ View records | ✅ | ✅ | ✅ | ✅ | ✅ |
| ➕ Create new | ✅ | ✅ | ✅ | ✅ | ❌ |
| ✏️ Edit (draft/pending) | ✅ | ✅ | ✅ | ❌ | ❌ |
| ✏️ Edit (submitted) | ✅ | ✅ | ❌ | ❌ | ❌ |
| ✅ Submit / Send | ✅ | ✅ | ✅ | ❌ | ❌ |
| 🏁 Approve / Authorise | ✅ | ✅ | ✅ | ❌ | ❌ |
| 🚫 Cancel / Void | ✅ | ✅ | ❌ | ❌ | ❌ |
| 🗑️ Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| 💾 Save as Draft | ✅ | ✅ | ✅ | ✅ | ❌ |
| 📝 Add Notes / Remarks | ✅ | ✅ | ✅ | ✅ | ❌ |
| 📎 Add Attachments | ✅ | ✅ | ✅ | ✅ | ❌ |
| 🔓 Unlock locked record | ✅ | ❌ | ❌ | ❌ | ❌ |
| 🕐 View audit history | ✅ | ✅ | ✅ | ❌ | ❌ |

#### 35C-3. Export Permissions

| Export Option | 🔴 Admin | 🔵 Manager | 🟣 Supervisor | 🟢 Operator | ⚪ View Only |
|--------------|---------|-----------|-------------|-----------|------------|
| 🖨️ Print / PDF | ✅ | ✅ | ✅ | ✅ | ✅ |
| 📊 Open in Google Sheets | ✅ | ✅ | ✅ | ❌ | ❌ |
| 📗 Download as Excel | ✅ | ✅ | ❌ | ❌ | ❌ |
| 📋 Copy to Clipboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🔗 Share link | ✅ | ✅ | ✅ | ❌ | ❌ |

#### 35C-4. Field Visibility Permissions

| Field Category | 🔴 Admin | 🔵 Manager | 🟣 Supervisor | 🟢 Operator | ⚪ View Only |
|----------------|---------|-----------|-------------|-----------|------------|
| Unit Price / Rate | ✅ | ✅ | ✅ | ❌ → `——` | ❌ → `——` |
| Discount % | ✅ | ✅ | ✅ | ❌ → `——` | ❌ → `——` |
| Line Total | ✅ | ✅ | ✅ | ❌ → `——` | ❌ → `——` |
| GST Amount | ✅ | ✅ | ✅ | ❌ → `——` | ❌ → `——` |
| Grand Total | ✅ | ✅ | ✅ | ✅ (sum only) | ❌ → `——` |
| Supplier GSTIN | ✅ | ✅ | ✅ | ❌ → `——` | ❌ → `——` |
| Supplier Credit Terms | ✅ | ✅ | ✅ | ❌ → `——` | ❌ → `——` |
| Supplier Rating | ✅ | ✅ | ✅ | ✅ | ❌ → `——` |
| User email (others) | ✅ | ✅ | ✅ | ❌ → initials only | ❌ |
| Audit trail / history | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cost of production | ✅ | ✅ | ❌ → `——` | ❌ → `——` | ❌ → `——` |
| Rejection details | ✅ | ✅ | ✅ | ✅ | ✅ |

**Hidden field rule:** Restricted fields are **never rendered** as inputs. They render as a `——` placeholder with a 🔒 icon. No empty input box — this prevents tab-navigation into invisible fields and avoids confusing UX.

```js
// Field render pattern
const PriceCell = ({ value, canView }) =>
  canView
    ? <input value={value} onChange={...} style={inp} />
    : <div style={{ color:M.textD, fontSize:11 }}>🔒 ——</div>;
```

---

### 35D. USER_MASTER Sheet (FILE 1C)

**Sheet name:** `USER_MASTER`
**Location:** FILE 1C (Suppliers & Masters workbook)
**Format:** Standard CC ERP format — Row 1 banner, Row 2 headers (red/white), Row 3 descriptions (light blue italic), Row 4+ data, freeze at A4.

#### Columns:

| Col | Field | Type | Notes |
|-----|-------|------|-------|
| A | User Code | Auto | USR-001, USR-002 … |
| B | Full Name | Text | Display name in UI |
| C | Email | Text | Google account email — primary key |
| D | Role | Enum | Admin / Manager / Supervisor / Operator / View Only |
| E | Status | Enum | Active / Inactive / Suspended |
| F | Module Access | Multi | Comma-separated: Procurement,Production,Inventory … |
| G | Restricted Fields | Multi | Comma-separated field codes to hide beyond role default |
| H | Extra Permissions | Multi | Comma-separated granted extras beyond role default |
| I | Denied Permissions | Multi | Comma-separated overrides to remove from role default |
| J | Department | Text | Cutting / Stitching / QC / Stores / Accounts … |
| K | Reporting To | FK | USR code of direct manager |
| L | Created On | Date | Auto |
| M | Created By | FK | USR code |
| N | Last Login | DateTime | Auto-updated by GAS on each login |
| O | Notes | Text | Any admin notes about this user |

**Columns F–I allow per-user fine-tuning on top of the role defaults:**
- `Module Access` — overrides which modules an Operator/View Only can see
- `Restricted Fields` — additional fields to hide beyond their role matrix
- `Extra Permissions` — grant specific actions above their role (e.g. grant one Operator the ability to Submit)
- `Denied Permissions` — remove actions from their role (e.g. deny one Manager the ability to Delete)

---

### 35E. ROLE_MASTER Sheet (FILE 1C)

**Sheet name:** `ROLE_MASTER`
**Purpose:** Defines the base permission matrix for each role. Admin can tweak role defaults here without code changes.

| Col | Field | Notes |
|-----|-------|-------|
| A | Role Name | Admin / Manager / Supervisor / Operator / View Only |
| B | Role Code | ADMIN / MGR / SUP / OPR / VIEW |
| C | Badge Colour | Hex colour for UI badge |
| D | Module Defaults | JSON string of module access defaults |
| E | Action Defaults | JSON string of allowed actions |
| F | Export Defaults | JSON string of export permissions |
| G | Field Restrictions | JSON string of hidden field codes |
| H | Description | Plain text description of this role |
| I | Last Modified | DateTime |
| J | Modified By | USR code |

---

### 35F. GAS Permission Engine

#### 35F-1. Load permissions on login

```js
function getUserPermissions(email) {
  // 1. Check cache first (PropertiesService, 6-hour TTL)
  const cached = CacheService.getScriptCache().get(`PERMS_${email}`);
  if (cached) return JSON.parse(cached);

  // 2. Read USER_MASTER sheet
  const ss   = SpreadsheetApp.openById(FILE_1C_ID);
  const data = ss.getSheetByName("USER_MASTER").getDataRange().getValues();
  const headers = data[2]; // Row 3 = descriptions, Row 1(idx0) = banner, Row 2(idx1) = headers
  // actual headers at index 1:
  const hdr = data[1];
  const userRow = data.slice(3).find(r => r[hdr.indexOf("Email")] === email);

  if (!userRow) throw new Error(`User ${email} not found in USER_MASTER`);

  // 3. Read ROLE_MASTER for base role permissions
  const roleData = ss.getSheetByName("ROLE_MASTER").getDataRange().getValues();
  const roleHdr  = roleData[1];
  const role     = userRow[hdr.indexOf("Role")];
  const roleRow  = roleData.slice(3).find(r => r[roleHdr.indexOf("Role Name")] === role);

  // 4. Build permission object
  const perms = {
    userCode:    userRow[hdr.indexOf("User Code")],
    name:        userRow[hdr.indexOf("Full Name")],
    email:       email,
    role:        role,
    status:      userRow[hdr.indexOf("Status")],
    modules:     parseModules(userRow, roleRow, hdr, roleHdr),
    actions:     parseActions(userRow, roleRow, hdr, roleHdr),
    exports:     parseExports(userRow, roleRow, hdr, roleHdr),
    hiddenFields:parseFields(userRow, roleRow, hdr, roleHdr),
    department:  userRow[hdr.indexOf("Department")],
    reportingTo: userRow[hdr.indexOf("Reporting To")],
  };

  // 5. Cache for 6 hours
  CacheService.getScriptCache().put(`PERMS_${email}`, JSON.stringify(perms), 21600);

  return perms;
}
```

#### 35F-2. Permission check helper (called by every GAS action)

```js
function checkPermission(email, action, module) {
  const perms = getUserPermissions(email);

  // Suspended / Inactive users → immediate block
  if (perms.status !== "Active") {
    return { allowed: false, reason: "Account suspended or inactive" };
  }

  // Module access check
  if (module && !perms.modules.includes(module)) {
    return { allowed: false, reason: `No access to ${module} module` };
  }

  // Action check
  if (action && !perms.actions.includes(action)) {
    return { allowed: false, reason: `Role '${perms.role}' cannot perform '${action}'` };
  }

  return { allowed: true };
}

// Usage in any GAS function:
function submitPurchaseOrder(poData) {
  const email = Session.getActiveUser().getEmail();
  const check = checkPermission(email, "SUBMIT", "Procurement");
  if (!check.allowed) throw new Error(check.reason); // returns error to client UI
  // ... proceed with PO submission
}
```

#### 35F-3. Cache invalidation

```js
// Called whenever USER_MASTER or ROLE_MASTER is edited
function invalidatePermissionsCache(email) {
  if (email) {
    CacheService.getScriptCache().remove(`PERMS_${email}`);
  } else {
    // Invalidate all (e.g. after role-level change)
    // PropertiesService stores list of active user emails
    const emails = JSON.parse(
      PropertiesService.getScriptProperties().getProperty("ACTIVE_USERS") || "[]"
    );
    emails.forEach(e => CacheService.getScriptCache().remove(`PERMS_${e}`));
  }
}
```

---

### 35G. UI — How Permissions Affect Every Screen

#### Rule 1 — Hidden, not disabled
Buttons and actions the user cannot perform are **completely hidden** from the DOM. Never show a greyed-out/disabled button — this is confusing and reveals the permission structure to users. Exception: the Submit button when a form is incomplete (validation state) — that stays visible but disabled.

#### Rule 2 — Module nav items hidden
Modules the user cannot access do not appear in navigation, breadcrumbs, or any menu.

#### Rule 3 — Restricted fields render as `🔒 ——`
Never an empty input, never `[Restricted]` text — always the lock icon + em dash combination. This makes it visually clear data exists but is protected.

#### Rule 4 — Export dropdown filtered
The Export `[📤 Export ▾]` dropdown only shows options the user's role permits. If only Print is permitted, the dropdown shows only Print — no hint that other options exist.

#### Rule 5 — GAS double-checks every action server-side
Even if a user bypasses the UI (e.g. calls GAS directly via console), `checkPermission()` blocks the action server-side. The UI filtering is UX, the GAS check is security.

---

### 35H. Users & Roles Admin Panel — UI Spec

**Access:** Admin only. Opened via:
1. ⚙️ Settings panel → "👥 User Management" section (bottom of settings)
2. Standalone link in Shell Bar user tooltip (Admin only): `[ Manage Users ]`
3. Direct navigation: `Home › Settings › User Management`

**Panel type:** Full-page route (not a slide-in panel — this is a full module screen using the standard 3-zone layout).

#### Left Command Panel sections (Users & Roles module):
```
📋 All Users         (count badge)
🔴 Admins            (count)
🔵 Managers          (count)
🟣 Supervisors       (count)
🟢 Operators         (count)
⚪ View Only         (count)
──────────────────
🚫 Inactive          (count)
📊 Usage Stats
```

#### Main content area — User List Table

```
┌─ Users & Roles ── [+ Add User] [📤 Export ▾] ─────────────────────────────┐
│ 🔽 Filters  ↕️ Sort  [All Roles ▾]  [All Status ▾]  [🔍 Search by name…]  │
├────┬──────────────────┬───────────────────────┬──────────┬────────┬────────┤
│ #  │ User             │ Email                 │ Role     │ Status │ Last   │
│    │                  │                       │          │        │ Login  │
├────┼──────────────────┼───────────────────────┼──────────┼────────┼────────┤
│ 01 │ [SA] Saurav A.   │ saurav@cc.com         │ 🔴 ADMIN │ 🟢 Act │ Now    │
│ 02 │ [RA] Rajesh K.   │ rajesh@cc.com         │ 🔵 MGR   │ 🟢 Act │ 14:08  │
│ 03 │ [PK] Priya K.    │ priya@cc.com          │ 🟣 SUP   │ 🟢 Act │ 13:45  │
│ 04 │ [MS] Manish S.   │ manish@cc.com         │ 🟢 OPR   │ 🟢 Act │ 12:30  │
│ 05 │ [AK] Anita K.    │ anita@cc.com          │ ⚪ VIEW  │ 🟡 Idle│ 09:00  │
│ 06 │ [VT] Vikas T.    │ vikas@cc.com          │ 🟢 OPR   │ 🔴 Sus │ 3d ago │
├────┴──────────────────┴───────────────────────┴──────────┴────────┴────────┤
│ STATUS BAR: 6 users · 1 Admin · 1 Manager · 1 Supervisor · 2 Operators    │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Add / Edit User — Right Slide Panel (420px, same spec as Settings Panel)

```
┌─ ✏️ Edit User ─────────────────────────────────── [×] ──┐
│                                                          │
│  IDENTITY                                                │
│  Full Name *          [Rajesh Kumar              ]       │
│  Email *              [rajesh@cc.com             ]       │
│  Department           [Procurement ▾             ]       │
│  Reporting To         [Saurav Aggarwal (SA) ▾    ]       │
│                                                          │
│  ROLE & STATUS                                           │
│  Role *               [🔵 Manager ▾              ]       │
│  Status               [🟢 Active ▾               ]       │
│                                                          │
│  MODULE ACCESS                                           │
│  (Based on role — toggle to restrict further)            │
│  ✅ 📦 Procurement                                       │
│  ✅ 🏭 Production                                        │
│  ✅ 🗄️ Inventory                                         │
│  ✅ 🔬 Quality                                           │
│  ✅ 💼 Sales                                             │
│  ❌ 💰 Finance          (not in role)                    │
│  ❌ 🗂️ Masters           (not in role)                   │
│                                                          │
│  PERMISSION OVERRIDES  ℹ️ Advanced — use carefully       │
│  Extra permissions     [________________ ▾ +Add ]        │
│  Denied permissions    [________________ ▾ +Add ]        │
│  Hidden fields         [________________ ▾ +Add ]        │
│                                                          │
│  NOTES                                                   │
│  [Admin notes about this user…                    ]      │
│  ──────────────────────────────────────────────── │
│  Created: 01 Jan 2026 by Saurav A.                       │
│  Last Login: 24 Feb 2026, 14:08                          │
│                                                          │
│  [ 🗑 Deactivate ]    [ ← Cancel ]   [ ✅ Save Changes ] │
└──────────────────────────────────────────────────────────┘
```

#### Role Manager Tab (inside User Management)

```
┌─ Role Permissions Matrix ───────────────────────────────────────────────────┐
│  View and edit default permissions for each role.                           │
│  Changes apply to ALL users with that role (individual overrides preserved).│
├──────────────────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│ Permission           │🔴 Admin  │🔵 Manager│🟣 Super. │🟢 Operat.│⚪ View  │
├──────────────────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│ Create Records       │ ✅ (lock)│ ✅       │ ✅       │ ✅       │ ❌      │
│ Edit Draft           │ ✅ (lock)│ ✅       │ ✅       │ ❌ [+]   │ ❌      │
│ Submit               │ ✅ (lock)│ ✅       │ ✅       │ ❌ [+]   │ ❌      │
│ Approve              │ ✅ (lock)│ ✅       │ ✅       │ ❌ [+]   │ ❌      │
│ Delete               │ ✅ (lock)│ ❌ [+]   │ ❌       │ ❌       │ ❌      │
│ Export Google Sheets │ ✅ (lock)│ ✅       │ ✅       │ ❌ [+]   │ ❌      │
│ Export Excel         │ ✅ (lock)│ ✅       │ ❌ [+]   │ ❌       │ ❌      │
│ View Unit Prices     │ ✅ (lock)│ ✅       │ ✅       │ ❌ [+]   │ ❌      │
└──────────────────────┴──────────┴──────────┴──────────┴──────────┴─────────┘
 [+] = click to toggle for that role     (lock) = Admin row is always locked
 [ ↩ Reset to Defaults ]                              [ ✅ Save Role Changes ]
```

---

### 35I. Permission Object in React State

On login, the GAS `getUserPermissions()` result is stored in a top-level React context — available to every component without prop-drilling.

```js
// Context definition
const PermContext = React.createContext(null);

// Usage in any component
const { perms } = React.useContext(PermContext);

// Helper functions
const can    = (action) => perms.actions.includes(action);
const sees   = (module) => perms.modules.includes(module);
const canExp = (type)   => perms.exports.includes(type);
const canSee = (field)  => !perms.hiddenFields.includes(field);

// Examples in JSX:
{can("CREATE")  && <button>+ New PO</button>}
{can("DELETE")  && <button>🗑 Delete</button>}
{can("APPROVE") && <button>✅ Approve</button>}
{canExp("EXCEL")&& <div>📗 Download as Excel</div>}
{canSee("UNIT_PRICE") ? <input value={price}/> : <div>🔒 ——</div>}
```

---

### 35J. Suspended / Inactive User Handling

If a user's status is **Inactive** or **Suspended**:
- GAS `getUserPermissions()` returns status flag
- React app shows a full-screen lock screen (not a redirect):

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🔒                                       │
│                                                             │
│         Account Suspended                                   │
│                                                             │
│  Your account has been suspended. Please contact           │
│  your system administrator.                                 │
│                                                             │
│  📧  saurav@confidenceclothing.com                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
- Background: `M.bg`
- Icon: 🔒 48px
- No navigation, no shell bar, no bypass possible
- Admin email shown so user knows who to contact

---

### 35K. Presence Strip Integration with RBAC

The avatar strip (§34) now shows role badges in hover tooltips and the `+N` dropdown:

```
┌─ Tooltip (with role) ───────────────────────────┐
│  [RA] Rajesh Aggarwal    [🔵 MANAGER]           │
│       rajesh@cc.com                             │
│       🟢 Active now · 14:08                     │
│       📦 Procurement › PO-2026-0041             │
│       Online since 13:45 · 23 min               │
└─────────────────────────────────────────────────┘
```

- Role badge colour matches the role colour coding in §35B
- Admin can see all users' roles in the `+N` dropdown
- Non-Admin users see role badges only for users in their department (`Reporting To` chain)
- View Only users see no role badges at all — only names and module

---

### 35L. RBAC Checklist — Add to Component Checklist

- [ ] `getUserPermissions()` GAS function written and returns full perms object
- [ ] `checkPermission()` called server-side in every GAS action function
- [ ] `PermContext` React context set up at app root
- [ ] `can()` / `sees()` / `canExp()` / `canSee()` helper functions available everywhere
- [ ] All action buttons conditionally rendered using `can()`
- [ ] All module nav items conditionally rendered using `sees()`
- [ ] Export dropdown items filtered using `canExp()`
- [ ] All financial/restricted fields use `canSee()` pattern with `🔒 ——` fallback
- [ ] USER_MASTER sheet in FILE 1C with correct CC ERP formatting (49+1 = 50th sheet)
- [ ] ROLE_MASTER sheet in FILE 1C
- [ ] Users & Roles Admin Panel accessible via ⚙️ Settings + direct navigation
- [ ] Add/Edit User slide panel with module toggles + overrides
- [ ] Role Matrix editor tab in User Management
- [ ] Role badge in presence tooltips and `+N` dropdown
- [ ] Suspended/Inactive users see lock screen — no app access
- [ ] Permissions cache 6-hour TTL with manual invalidation on USER_MASTER edit
- [ ] `ACTIVE_USERS` list in PropertiesService for bulk cache invalidation

---


---

## 36. NOTIFICATION SYSTEM ★ NEW V6

### 36A. Bell Icon — Shell Bar

Position: Shell bar right side, between accent picker and ⚙️ settings gear.

```
[Theme] [Accent] [🔔 3] [⚙️] | Avatars
                  ↑
          Red badge = unread count
```

**Bell button spec:**
- Size: 34×34px, radius 6
- Active (panel open): `A.a` background, white icon
- Inactive: `M.surfLow` background, `M.textB` icon
- Unread badge: 16×16px circle, `#ef4444`, white 8px font, `2px solid M.shellBg` border, positioned top:3 right:3

### 36B. Notification Panel — Layout

```
┌─ 🔔 Notifications ─ [3 unread] ─── [Mark all read] [×] ─┐
│ [All 5] [Unread 3] [Action 2]                             │
├───────────────────────────────────────────────────────────┤
│ ▌ 🔴 ACTION REQUIRED                          9m ago  🔴 │  ← unread dot
│   PO-2026-0042 awaiting approval                         │
│   Procurement · PO-2026-0042                             │
│   [✅ Approve] [❌ Reject] [💬 Reply]  [PO-2026-0042 → Open Record] │
├───────────────────────────────────────────────────────────┤
│ ▌ 🟠 WARNING                                  2h ago     │
│   RM-FAB-007 stock below reorder level                   │
│   Inventory · RM-FAB-007                                 │
│   [👁 View] [💬 Reply]                [RM-FAB-007 → Open Record]   │
├───────────────────────────────────────────────────────────┤
│                   NTF sheet · FILE 1B · GAS-managed       │
│                                     [View All →]          │
└───────────────────────────────────────────────────────────┘
```

**Panel spec:**
- Width: 420px, max-height: `calc(100vh - 80px)`
- Position: absolute, top 52px, right 0
- Background: `M.dropBg`, border: `1px solid M.divider`, radius 10, shadow: `M.shadow`
- Z-index: 499 (below settings panel 500)
- Animation: `dd-anim` (fadeDown 0.16s)
- Backdrop: transparent click-away div at z-index 498

### 36C. Notification Row — States

**Unread:**
- Background: type-specific tint (`NOTIF_BG[type]`)
- Left border: 3px solid `NOTIF_C[type]` (red/amber/blue/grey)
- Title: fontWeight 800
- Unread dot: 6px circle, `NOTIF_C[type]`, top-right of row

**Read:**
- Background: `M.surfHigh`
- Left border: 3px solid `M.divider`
- Title: fontWeight 600

**Actioned:**
- Background: `M.surfHigh`, opacity 0.7
- Left border: 3px solid `M.divider`
- Type badge replaced with: `✓ APPROVED` / `✓ REJECTED` / `✓ REPLY` in `M.textD`
- No action buttons shown

**Expanded (clicked):**
- Detail text block appears below title in `M.surfMid` background, radius 6
- If reply was sent: reply text shown in `A.al` block with `A.a` left border

### 36D. Type Colour System

| Type | `NOTIF_C` | `NOTIF_BG` | Badge label |
|------|-----------|------------|-------------|
| action | `#ef4444` | `rgba(239,68,68,.08)` | ACTION REQUIRED |
| warning | `#f59e0b` | `rgba(245,158,11,.08)` | WARNING |
| info | `#0078D4` | `rgba(0,120,212,.08)` | INFO |
| system | `#6b7280` | `rgba(107,114,128,.06)` | SYSTEM |

### 36E. Action Buttons

Rendered only when `status !== "actioned"`. Button set driven by `actions` array from NOTIFICATIONS sheet `Actions Available` column:

| Button | Style | GAS call |
|--------|-------|---------|
| ✅ Approve | `#15803D` solid, white text | `actionNotification(id, email, "approve")` |
| ❌ Reject | `#ef4444` solid, white text | `actionNotification(id, email, "reject")` |
| 💬 Reply | `M.surfMid` border, opens textarea | `actionNotification(id, email, "reply", text)` |
| 👁 View | `M.surfMid` border, grey text | `markNotificationRead(id)` + expand row |
| ✕ Dismiss | transparent border, `M.textD` text | removes from list (sets status=dismissed) |
| **[ref → Open Record]** | `A.al` bg, `A.a` border + text, mono ref code | `window.open(buildNotifURL(module, ref))` |

**Open Record button** — always appears when `n.ref` is non-empty, regardless of other actions. Positioned at far right of action row (margin-left: auto). Shows `{ref} → Open Record` with ref in IBM Plex Mono.

**In prototype (CC_ERP_Main.jsx):** shows alert explaining what GAS will do.
**In GAS live build:** calls `google.script.run.getRecordURL(module, ref, callback)` → opens URL in new tab.

### 36F. Reply Input

```
┌─ Reply textarea ────────────────────────┐ [Send ↵]
│ Type your reply… (Enter to send)        │
└─────────────────────────────────────────┘
```
- Textarea: `1.5px solid A.a` border, `A.al` background tint on focus
- Enter sends (Shift+Enter = newline), Escape cancels
- Sent reply persists in card: shown in `A.al` block below detail

### 36G. Filter Tabs

Three pill tabs below the panel header:
- **All** — shows all notifications
- **Unread** — filters `n.read === false`
- **Action** — filters `n.type === "action"`

Active tab: `A.al` background, `A.a` border, `A.a` text.

### 36H. Empty State

When all notifications dismissed/actioned:
```
    🎉
All caught up!
No notifications
```
Centred in panel body. 32px emoji, 12px title, 10px sub.

### 36I. Mark All Read

Button in panel header (shown only when `unread > 0`): `A.a` text, no background. 
Calls: sets all `n.read = true` client-side immediately → GAS `markAllRead(email)` async.

### 36J. GAS Integration Points

- **On app load:** `getUIBootstrap` returns notifications in bundle
- **Every 30s heartbeat:** `getUnreadCount(email)` → updates bell badge
- **On bell click:** if count changed since last fetch, fetch full list; otherwise use cached
- **After any action:** re-fetch notifications for affected parties via `createNotification` downstream triggers
- **Deep link:** `buildNotifURL(module, ref)` → opens exact Google Sheets row in new tab

---

## 37. QUICK ACCESS — SIDEBAR SECTION ★ NEW V6

### 37A. Placement

Top of left sidebar, above the "Modules" nav section. Separated by divider.

```
Sidebar:
┌──────────────────────────────┐
│ Navigation · 340px  ‹        │  ← panel label
├──────────────────────────────┤
│ ⭐ QUICK ACCESS    ＋  Edit  │  ← section header
│   📦  New PO       Procurement│
│   🏭  WO-0089      Production │
│   🏭  Coats India  Supplier  │
│   🔬  Pending QC   Quality   │
├──────────────────────────────┤
│ MODULES                      │
│   📦 Procurement        [3]  │
│   🏭 Production         [1]  │
...
```

### 37B. Section Header

- Label: `⭐ QUICK ACCESS` — 9px, fontWeight 900, `M.textD`, uppercase, letterSpacing 1.2
- `＋` button: opens Ctrl+K palette to pin new items
- `Edit` / `Done` toggle: enters edit mode (shows ✕ remove buttons per item)

### 37C. Shortcut Row

- Height: ~34px with 7px vertical padding
- Icon: 13px, flexShrink 0
- Label: `fz-2`, fontWeight 700, `M.textB`, truncated with ellipsis
- Sub-label: 8px, `M.textD` (module/group name)
- Edit mode: red ✕ circle (18×18px, `#ef4444`) appears on each row
- Click: navigates to associated module; future V2 = deep link to record/action

### 37D. Empty State

```
No shortcuts yet.
Open Ctrl+K to pin items ⭐
```
"Open Ctrl+K" text in `A.a` colour, cursor pointer.

### 37E. Collapsed Sidebar

When sidebar is in icon-only mode (`compactSide: true`), Quick Access section shows as a single ⭐ button that opens Ctrl+K on click.

### 37F. GAS Storage

```js
// Per-user. Called in getUIBootstrap. Saved on every change.
PropertiesService.getUserProperties().getProperty("SHORTCUTS")
// → JSON array of shortcut objects (max 30)
// Saved by: saveUserShortcuts(email, shortcuts)
```

Max 30 shortcuts. Excess: toast warning "Maximum 30 shortcuts reached. Remove one to add more."

---

## 38. COMMAND PALETTE (Ctrl+K) ★ NEW V6

### 38A. Trigger

- **Keyboard:** `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) — registered as global keydown listener
- **Shell bar:** search pill button `[🔍 Search… | Ctrl K]`
- **Sidebar:** `＋` button in Quick Access section header
- **Closes:** `Esc` key, or click outside

### 38B. Layout

```
╔═══════════════════════════════════════════════════╗
║  🔍  Search modules, actions, records, settings…  ║  [ESC]
╠═══════════════════════════════════════════════════╣
║  MODULES                                          ║
║  📦  Procurement        PO · GRN · Returns   [☆]  ║  ← selected (accent bg)
║  🏭  Production         Work Orders · BOM    [☆]  ║
║  ...                                              ║
╠═══════════════════════════════════════════════════╣
║  QUICK ACTIONS                                    ║
║  ➕  New Purchase Order  Procurement → PO    [☆]  ║
║  ➕  New Work Order      Production → WO     [☆]  ║
║  ...                                              ║
╠═══════════════════════════════════════════════════╣
║  RECENT RECORDS                                   ║
║  🧾  PO-2026-0042        Coats India · Pending[☆]  ║
║  ...                                              ║
╠═══════════════════════════════════════════════════╣
║  ↑↓ Navigate  ↵ Open  ☆ Pin to Quick Access  ESC Close ║
╚═══════════════════════════════════════════════════╝
```

### 38C. Specs

- Width: 580px, max-width 94vw
- Position: fixed, top 18%, left 50%, translateX(-50%)
- Background: `M.dropBg`, radius 12, border `1px solid M.divider`
- Shadow: `0 24px 60px rgba(0,0,0,.35)`
- Backdrop: `rgba(0,0,0,.5)` with `blur(3px)`
- Animation: `cmd-anim` (scale + fade 0.18s cubic-bezier)
- Z-index: 801 (above settings panel 500, above notification panel 499)

### 38D. Search Input

- Full width, no border, transparent background
- Font: `uff` (user's UI font), `fz+1`
- Placeholder: `"Search modules, actions, records, settings…"` in `M.textC`
- Autofocused on open
- Filters all groups simultaneously as user types

### 38E. Result Groups

4 static groups (V1), each with its own section divider:

| Group | Contents | Source |
|-------|----------|--------|
| Modules | 8 ERP modules | `MODS` constant |
| Quick Actions | New PO/WO/GRN/QC/searches | Static list |
| Recent Records | Last 10 Ctrl+K selections | `CMD_HISTORY` from GAS |
| Settings | Open settings, switch theme etc. | Static list |

V2 addition: **Live Records** group — GAS search across PO_MASTER, WO, etc.

### 38F. Result Row

- Padding: 9px 16px
- Selected state: `A.al` background, `3px solid A.a` left border
- Icon: 16px emoji
- Label: `fz-1`, fontWeight 700, `A.a` when selected else `M.textA`
- Sub: 9px, `M.textC`
- Pin button (☆/⭐): 26×26px, right side. Active = `A.al` bg + `A.a` border. Click = adds to Quick Access shortcuts.
- Enter hint: `↵` badge (mono, `M.badgeBg`) appears on selected row

### 38G. Keyboard Navigation

| Key | Action |
|-----|--------|
| `↓` | Move selection down |
| `↑` | Move selection up |
| `↵ Enter` | Open selected item |
| `Esc` | Close palette |

Selection wraps on mouse hover (hover → set selected index).

### 38H. Actions on Selection

| Item type | Action on Enter/click |
|-----------|----------------------|
| module | `setActMod(id)` — navigate to module |
| action | Navigate to new record form for that type |
| record | Open record (uses `buildNotifURL` pattern) |
| setting | Execute: open settings panel, switch theme, etc. |

### 38I. GAS Integration

- `getUserCmdHistory(email)` → called in `getUIBootstrap` → populates Recent Records group
- `logCmdSelection(email, item)` → called async on every palette selection → updates history
- V2: `searchLiveRecords(query)` → IMPORTRANGE-based search across transaction files

---

## 39. FONT FAMILY PICKER ★ NEW V6 (Settings §④)

### 39A. UI Body Font — 6 options

Each option card renders its own name **in its own font face** so user can see exactly how it looks in the ERP.

Preview sentence: `"The quick brown fox — ERP data entry"`

Options:
| ID | Name | Tag |
|----|------|-----|
| nunito | Nunito Sans | DEFAULT · Warm & Rounded |
| inter | Inter | Clean · Neutral |
| dm | DM Sans | Modern · Geometric |
| jakarta | Plus Jakarta Sans | Professional · Crisp |
| outfit | Outfit | Minimal · Contemporary |
| source | Source Sans 3 | Editorial · Readable |

### 39B. Data & Codes Font — 5 options (Monospace)

Preview sentence: `"PO-2026-0042 · Rs.48,500 · GST 18%"` (shown in the font being chosen)

Options:
| ID | Name | Tag |
|----|------|-----|
| ibmplex | IBM Plex Mono | DEFAULT · Technical |
| jetbrains | JetBrains Mono | Dev-Friendly · Sharp |
| fira | Fira Code | Ligatures · Elegant |
| roboto | Roboto Mono | Neutral · Clean |
| space | Space Mono | Distinctive · Retro |

### 39C. GAS Storage

Stored in `UI_PREFS` object via `getUserPrefs/saveUserPrefs` (Module 13). Fields: `uiFont` (string ID), `dataFont` (string ID). Applied at app load via `getUIBootstrap`.

### 39D. Application

- `uff = uiFF(cfg.uiFont)` — resolved CSS font-family string for all UI text
- `dff = dataFF(cfg.dataFont)` — resolved CSS font-family string for all codes/amounts
- Applied via inline `fontFamily:` on all components, not via global CSS
- Takes effect immediately on Apply & Close (no reload needed)

---

## 40. DEFAULT SETTINGS OBJECT (Updated V6)

```js
const DEFAULTS = {
  // ── Theme ─────────────────────────────────────────
  mode:          "light",        // light|black|lightgrey|midnight|warm|slate
  accent:        "orange",       // orange|blue|teal|green|purple|rose

  // ── Typography ────────────────────────────────────
  density:       "comfortable",  // compact|comfortable|spacious
  fontSize:      "medium",       // small(11px)|medium(13px)|large(15px)
  uiFont:        "nunito",       // UI body font — see §39A
  dataFont:      "ibmplex",      // Mono/code font — see §39B

  // ── Tables ────────────────────────────────────────
  tblStyle:      "striped",      // striped|bordered|clean
  lineView:      "table",        // table|cards

  // ── Layout ────────────────────────────────────────
  sbWidth:       340,            // sidebar px — min 200, max 520
  showStatusBar: true,
  showThumbs:    true,
  showRowNums:   true,
  showCatBadge:  true,
  compactSide:   false,          // icon-only sidebar
};
```

All fields are saved per-user via `getUserPrefs/saveUserPrefs` (Module 13 GAS).

---

## 33. VERSION LOG

| Version | Date | Change |
|---------|------|--------|
| V1 | Feb 2026 | Initial lock from CC_ERP_NetSuite_V2.jsx. Full spec documented. 6 colour modes. 6 accents. All components specified. 10 recommendations logged. |
| V2 | Feb 2026 | 6 major additions: Icon System (§24), Table Power Controls (§25), Full-Width Rule (§26), Save Preview Modal (§27), Print Preview (§28), Unsaved Changes Guard (§29). Component checklist updated. Locked decisions updated. |
| V3 | Feb 2026 | Default mode changed from Black → ☀️ Light. Export Options section added (§30). GAS export functions specified. File renamed CC_ERP_UI_SPEC_V3.md. |
| V4 | Feb 2026 | Active User Presence added (§34): PropertiesService + PRESENCE sheet dual-layer. Avatar strip, tooltip, heartbeat GAS, 90-day retention. File renamed CC_ERP_UI_SPEC_V4.md. |
| V5 | Feb 2026 | RBAC added (§35): 5 roles (Admin/Manager/Supervisor/Operator/View Only), 4 permission dimensions (modules/actions/exports/fields), USER_MASTER + ROLE_MASTER sheets, full GAS permission engine, Users & Roles Admin Panel, PermContext React pattern, role badges in presence strip. File renamed CC_ERP_UI_SPEC_V5.md. |
| V6 | Feb 2026 | Notification System added (§36): bell icon, 420px panel, Approve/Reject/Reply/Open Record action buttons, deep-link to exact record row via buildNotifURL, role-routed, 4 types (action/warning/info/system), reply textarea, filter tabs, mark all read. Quick Access Sidebar (§37): pinned shortcuts in sidebar above nav, edit mode, ＋ to open palette, GAS getUserShortcuts/saveUserShortcuts. Command Palette Ctrl+K (§38): global keyboard shortcut, 580px modal with blur backdrop, 4 groups (Modules/Quick Actions/Recent/Settings), keyboard nav, pin-to-sidebar, logCmdSelection history. Font Family Picker (§39): 6 UI fonts + 5 mono fonts, live preview in own face. Settings object updated (§40): uiFont + dataFont fields. File renamed CC_ERP_UI_SPEC_V6.md. | 5 roles (Admin/Manager/Supervisor/Operator/View Only), 4 permission dimensions (modules/actions/exports/fields), USER_MASTER + ROLE_MASTER sheets, full GAS permission engine, Users & Roles Admin Panel, PermContext React pattern, role badges in presence strip. File renamed CC_ERP_UI_SPEC_V5.md. |

---

## HOW CLAUDE SHOULD USE THIS FILE

1. **At the start of every UI build session:** Read this file + CC_ERP_BUILD_REFERENCE_V6.md before writing any code
2. **Never deviate from the layout architecture** in Section 4 without "Override UI [component]"
3. **Always copy MODES and ACCENTS exactly** — never simplify or reduce the colour system
4. **When adding a new feature:** Add it to Section 22 (recommendations) before implementing, then add to §33 version log
5. **After building each module:** Confirm the full Component Checklist (§31) + Presence checklist (§34K) + RBAC checklist (§35L)
6. **Never omit:** Sort/Filter/Group, Save Preview, Print Preview, Export Menu, Unsaved Guard, Presence Strip, Permission checks — all mandatory
7. **Always check ICON_MASTER** — every icon must come from this constant and support the Notion-style picker
8. **Export always means four options:** PDF + Google Sheets + Excel + Clipboard (filtered per user role via `canExp()`)
9. **Presence = dual-layer always:** PropertiesService (speed) + PRESENCE sheet (audit)
10. **Permissions = dual-layer always:** UI filtering (UX) + GAS server-side check (security)
11. **Hidden fields = `🔒 ——` always:** Never empty input, never disabled input, never text saying "Restricted"
12. **Buttons hidden, never disabled** (except Submit during form validation)
13. **Notification bell always shows unread badge** — 30s heartbeat via `getUnreadCount`. Never poll full list more than once per minute.
14. **Open Record always uses buildNotifURL** — never link to spreadsheet root. Always `&range=A[row]` for exact row targeting.
15. **Quick Access shortcuts are PropertiesService, never a sheet** — zero latency on load, bundled in `getUIBootstrap`.
16. **Ctrl+K palette is static in V1** — no live sheet search. V2 feature. Never build IMPORTRANGE search until Phase 3 transaction sheets exist.

---

*Confidence Clothing ERP · UI Spec V6 (file: CC_ERP_UI_SPEC_V6.md) · NetSuite-Style Design System + Icon System + Table Controls + Safety Guards + Export Options + Active User Presence + RBAC + Notification System + Quick Access + Command Palette + Font Picker · Feb 2026*
*Locked from CC_ERP_NetSuite_V2.jsx · Default: ☀️ Light mode + 🟠 Oracle Orange · Approved by Saurav Aggarwal*
