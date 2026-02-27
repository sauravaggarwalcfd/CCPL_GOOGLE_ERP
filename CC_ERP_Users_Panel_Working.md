# CC ERP — USERS & ROLES PANEL
## Complete Working Documentation

**Component:** `CC_ERP_Users_Final.jsx`  
**File:** FILE 1B › USER_MASTER + ROLE_MASTER  
**Access:** Admin only  
**Layout:** Concept 2 — Profile Card Grid  
**Last Updated:** Feb 2026

---

## TABLE OF CONTENTS

1. [Page Structure](#1-page-structure)
2. [Shell Bar](#2-shell-bar)
3. [Left Sidebar](#3-left-sidebar)
4. [Sub-Toolbar](#4-sub-toolbar)
5. [Role Filter Tabs](#5-role-filter-tabs)
6. [User Card Grid](#6-user-card-grid)
7. [Card Expanded View](#7-card-expanded-view)
8. [Status Bar](#8-status-bar)
9. [Edit User Panel](#9-edit-user-panel)
10. [Permissions Panel](#10-permissions-panel)
11. [Toast Notifications](#11-toast-notifications)
12. [State Management](#12-state-management)
13. [Permission Logic Engine](#13-permission-logic-engine)
14. [Override Count System](#14-override-count-system)
15. [Design Tokens & Colors](#15-design-tokens--colors)

---

## 1. PAGE STRUCTURE

The page is a full-height layout with 5 vertical zones stacked in a flex column:

```
┌─────────────────────────────────────────────────────────┐  48px
│  SHELL BAR (top nav, logo, breadcrumb, controls)        │
├────────────┬────────────────────────────────────────────┤
│            │  SUB-TOOLBAR (title, search, buttons)      │  46px
│            ├────────────────────────────────────────────┤
│  SIDEBAR   │  ROLE FILTER TABS                          │  ~50px
│  240px     ├────────────────────────────────────────────┤
│            │  CARD GRID (scrollable)                    │  flex 1
│            ├────────────────────────────────────────────┤
│            │  STATUS BAR                                │  28px
└────────────┴────────────────────────────────────────────┘

OVERLAY PANELS (position:fixed, z-index:400):
  - Edit User Panel   (420px, slides in from right)
  - Permissions Panel (540px, slides in from right)

TOAST (position:fixed, bottom:28, center, z-index:999)
```

---

## 2. SHELL BAR

**Height:** 48px · **Background:** `#ffffff` · **Border-bottom:** `1px solid #e2e4e8`

### 2A. Logo Block (left, 240px wide)
- 28×28px orange square icon with 👥 emoji
- "CC ERP" in orange (#E8690A), 12px weight 900
- "CONFIDENCE CLOTHING" in gray, 8px weight 700, letter-spacing 0.06em
- Right border separates logo from breadcrumb
- Width matches sidebar (240px) for visual alignment

### 2B. Breadcrumb (center, flex:1)
```
🏠 Home  ›  ⚙️ Settings  ›  👥 Users & Roles
```
- Font: 12px, color `#6b7280`
- "Users & Roles" highlighted in orange (#E8690A), weight 700
- Separators `›` in `#9ca3af`
- Static — not interactive in current build

### 2C. Right Controls
From left to right:

**Accent Picker:**
- Label "ACCENT" in 9px uppercase gray
- 6 colored circles: `#E8690A` (active), `#0078D4`, `#007C7C`, `#15803D`, `#7C3AED`, `#BE123C`
- Active dot has `2px solid #111` border, others transparent
- Static UI in this build — no theme switching logic wired yet

**Bell Button (🔔):**
- 34×34px, borderRadius 6, background `#f0f2f5`
- Red badge (16×16px, `#ef4444`) showing count "3" — hardcoded demo
- Badge position: top:3 right:3, has white border for separation

**Settings Button (⚙️):**
- 34×34px, borderRadius 6, background `#f0f2f5`
- Static in this build

**Online Presence Avatars:**
- First 3 users shown as 28px circles with initials
- USR-001 (current user Saurav) has orange ring `2px solid #E8690A`
- Others have white ring `2px solid #ffffff`
- Green pill: "🟢 6 online" — background `rgba(34,197,94,0.1)`, border `rgba(34,197,94,0.25)`

---

## 3. LEFT SIDEBAR

**Width:** 240px · **Background:** `#1a1c20` · **Border-right:** `1px solid #2a2d33`

### 3A. Quick Access Section
Header: "QUICK ACCESS" — 9px, weight 900, `#484c55`, uppercase, letter-spacing 0.12em

Three shortcuts:
- 👤 New User
- 🔑 Permissions
- 📊 Usage Stats

Each: flex row, 13px icon, 12px weight 600 label `#8891a4`, 5px padding, rounded hover area

### 3B. Divider
1px line, `#2a2d33`, margin 4px 14px 6px

### 3C. Modules Section
Header: "MODULES" — same style as Quick Access header

8 nav items: Procurement 📦 (3) · Production 🏭 (1) · Inventory 🗄️ · Quality 🔬 (2) · Sales 💼 · Finance 💰 (4) · Masters 🗂️ · Dashboard 📈

Each item:
- 8px 10px padding, borderRadius 7, marginBottom 2
- Default: transparent background, transparent left border (3px)
- Active state: background `#E8690A22`, left border `3px solid #E8690A`, white text weight 700
- Badge: min-width 18px circle, orange `#E8690A` background, white 10px text
- In this build: no items are set active in modules (Users is active in bottom nav)

### 3D. Bottom Nav
Two items: ⚙️ Settings · 👥 Users (active)

**Users** is active: `#E8690A22` background, `3px solid #E8690A` left border, white label

### 3E. User Footer
- 30px orange circle avatar "SA"
- "Saurav Aggarwal" — 12px weight 700, `#e5e7eb`
- "🔴 ADMIN" — 9px, `#484c55`
- Border-top: `1px solid #2a2d33`

---

## 4. SUB-TOOLBAR

**Height:** 46px · **Background:** `#ffffff` · **Border-bottom:** `1px solid #e2e4e8` · **Padding:** 0 24px

### 4A. Title
"Users & Roles" — 15px, weight 800, `#111827`

### 4B. Search Box
- Placeholder: "Search users…"
- Width: 200px, padding left 26px for icon space
- 🔍 icon absolutely positioned left:8, vertically centered, 12px `#9ca3af`
- Searches: `user.name` (case-insensitive) + `user.email`
- Triggers: `onChange` → updates `search` state → `filtered` array recomputes
- Clears filter when empty

### 4C. Export Button
- "📤 Export" — 6px 14px padding, borderRadius 6
- Background `#f0f2f5`, border `1px solid #e5e7eb`
- Static in this build (no dropdown yet)

### 4D. Add User Button
- "+ Add User" — orange `#E8690A`, white text, 6px 18px padding
- **onClick:** `setEditUser(false)` → opens EditPanel in "new user" mode
- `false` signals new user (no existing data), `null` means panel closed

---

## 5. ROLE FILTER TABS

**Background:** `#ffffff` · **Border-bottom:** `1px solid #e2e4e8` · **Padding:** 10px 24px

### 5A. Tab Pills
7 pills total: **All** + one per role (Admin · Manager · Supervisor · Operator · View Only)

Each pill:
- Label + count badge inside
- borderRadius 20px (pill shape)
- **Inactive state:** background `#f0f2f5`, border `1px solid #e5e7eb`, text `#374151`
- **Active state:** background = role's color (or `#E8690A` for All), no border, white text
- Count badge inside active pill: white text, `rgba(255,255,255,0.22)` background
- Count badge inside inactive pill: `#f7f8fa` background, `#6b7280` text

**onClick:** `setRoleFilter(label)` → updates `roleFilter` state → `filtered` array recomputes

**Count logic:**
- "All" pill → `users.length` (total count, regardless of filter)
- Role pills → `users.filter(u => u.role === label).length`

### 5B. Live Stats (right side)
- 🟢 Active: count of `status === "Active"` users
- 🔴 Suspended: count of `status === "Suspended"` users
- Font: 11px IBM Plex Mono weight 700 for numbers
- Updates live as users are added/edited

---

## 6. USER CARD GRID

**Background:** `#f0f2f5` · **Padding:** 20px 24px · **Overflow:** auto (scrollable)

**Grid:** `repeat(auto-fill, minmax(240px, 1fr))` — responsive, fills available width, minimum 240px per card

### 6A. Card Anatomy

```
┌─ 3px top border (role color) ────────────────────────┐
│ [44px Avatar]           [RolePill sm]                 │
│  (with status dot)      [⚡ N custom]  ← if overrides │
│                                                       │
│ Full Name (14px weight 800)                           │
│ email@cc.com (11px IBM Plex Mono, truncated)          │
│                                                       │
│ [📦][🏭][🗄️][🔬][💼][💰][🗂️][📈]  ← module dots     │
├───────────────────────────────────────────────────────┤
│ Last login         [🔑 Permissions] [✏️]              │
│ label + value                                         │
│ (+ expanded section if card is selected)              │
└───────────────────────────────────────────────────────┘
```

### 6B. Card Top Border
`borderTop: 3px solid {role.color}`
- Admin: `#BE123C` (rose red)
- Manager: `#1D4ED8` (blue)
- Supervisor: `#7C3AED` (violet)
- Operator: `#15803D` (green)
- View Only: `#6b7280` (gray)

### 6C. Avatar (44px)
- Background: color hashed from `user.name` — picks from 9 colors deterministically
- Shows 2-letter `user.initials` (e.g. "SA", "RK")
- borderRadius 12 (rounded square, larger than 40px threshold)
- **Status dot:** 11×11px circle, absolute bottom-right of avatar
  - Active → `#22c55e` (green)
  - Suspended → `#ef4444` (red)
  - Inactive → `#9ca3af` (gray)
  - Has `2px solid white` border for visibility on any avatar color

### 6D. Role Pill (sm variant)
- Small: 10px font, 2px 7px padding
- Shows role icon + role code (e.g. "🔵 MGR")
- Background/color/border from `ROLE_DEFS[role]`

### 6E. Override Badge
- Shown only when `countOverrides(user) > 0` AND role is NOT Admin
- "⚡ N custom" — 9px weight 900, violet `#7C3AED`
- Background `#f5f3ff`, border `1px solid #ddd6fe`, borderRadius 10

### 6F. Module Dots (8 dots)
One dot per module: Procurement · Production · Inventory · Quality · Sales · Finance · Masters · Dashboard

Each dot: 24×24px, borderRadius 6, shows module emoji

**Dot states (derived from `getEffective(user)`):**

| State | Condition | Background | Border | Opacity |
|-------|-----------|-----------|--------|---------|
| Active (role) | Module in effective list, in role default | `role.bg` (tinted) | `role.color + 30` | 1.0 |
| Custom Grant | In effective list, NOT in role default | `#dcfce7` (green) | `#bbf7d0` | 1.0 |
| Custom Deny | NOT in effective list, IS in role default | `#fee2e2` (red) | `#fecaca` | 1.0 |
| Off (no access) | NOT in effective list, NOT in role default | `#f0f2f5` | `#e5e7eb` | 0.25 |

Hover title shows: module name + "(custom grant)" or "(custom deny)" if applicable

### 6G. Card Footer
- Left: "Last login" label (9px uppercase `#9ca3af`) + value (11px IBM Plex Mono weight 700)
- Right: action buttons (see 6H below)
- Background: `#f7f8fa`, border-top: `1px solid #e5e7eb`

### 6H. Card Action Buttons

**🔑 Permissions Button** (shown for non-Admin users only):
- Default: "🔑 Permissions" — background `#f0f2f5`, border `#e5e7eb`, text `#374151`
- With overrides: "🔑 N overrides" — background `#f5f3ff`, border `#ddd6fe`, text `#7C3AED` (violet)
- **onClick** (stopPropagation prevents card selection): `setPermUser(user)` → opens PermissionsPanel

**✏️ Edit Button:**
- Always shown for all users
- **onClick** (stopPropagation): `setEditUser(user)` → opens EditPanel with user data

**Admin cards:** No 🔑 button — Admin permissions cannot be changed

### 6I. Card Selection
- **onClick on card body:** toggles `selectedCard` state (card id or null)
- Selected card: orange border `1px solid #E8690A` + orange glow shadow `0 0 0 2px rgba(232,105,10,0.4)`
- Deselect: click same card again → `setSelectedCard(null)`
- Card selection is independent — buttons inside use `e.stopPropagation()`

### 6J. Empty State
When `filtered.length === 0`:
- 40px 👥 emoji centered
- "No users match your filter" text in `#6b7280`
- 60px top/bottom padding

---

## 7. CARD EXPANDED VIEW

Triggered when `selectedCard === user.id`. Renders below the card footer as an additional section with `animation: scaleUp 0.15s`.

**Background:** `#fafafa` · **Padding:** 12px 16px · **Border-top:** `1px solid #e5e7eb`

### 7A. Effective Permissions Chips
Header: "EFFECTIVE PERMISSIONS" — 9px uppercase `#9ca3af`

Shows `eff.actions.slice(0, 6)` as green chips:
- Each chip: 9px, weight 800, `#15803d` text, `#dcfce7` background, `#bbf7d0` border
- Shows action icon + action code (underscores replaced with spaces)
- If more than 6 actions: "+N more" pill in gray

### 7B. Hidden Fields Row
Shown only if `eff.hiddenFields.length > 0`:
- "🔒 Hidden: Unit Prices, Salary Data…" (field labels joined by ", ")
- 10px, weight 700, `#be123c` (red)

### 7C. Meta Row
- User Code (`user.id`) in IBM Plex Mono weight 700
- Department if set: " · Cutting" etc.
- Sessions count in IBM Plex Mono

### 7D. Notes
If `user.notes` is set: "💬 Note text here" — 10px italic `#6b7280`

---

## 8. STATUS BAR

**Height:** 28px · **Background:** `#f0f2f5` · **Border-top:** `1px solid #e5e7eb`

### Left metrics (3 counters):
- **USERS** — total `users.length` (all users, no filter)
- **SHOWING** — `filtered.length` (after role filter + search)
- **WITH OVERRIDES** — `users.filter(u => countOverrides(u) > 0).length`

Each: 9px uppercase `#9ca3af` label + 10px IBM Plex Mono `#374151` value

### Right metadata:
`CC ERP · FILE-1C · USER_MASTER · Light · [today's date in en-IN format]`
- 9px IBM Plex Mono `#9ca3af`
- Date: `new Date().toLocaleDateString("en-IN")` → e.g. "27/2/2026"

---

## 9. EDIT USER PANEL

**Trigger:** `editUser !== null`  
- `editUser === false` → new user mode (no pre-filled data)  
- `editUser === {object}` → edit mode (pre-filled with existing user)

**Width:** 420px · **Position:** fixed right 0, full height · **z-index:** 400  
**Background:** `#ffffff` · **Shadow:** `-6px 0 28px rgba(0,0,0,0.10)`  
**Animation:** `slideInRight 0.22s`  
**Close:** click backdrop (outside panel) OR × button

### 9A. Panel Header
- Title: "✨ Add New User" (new) OR "✏️ Edit User" (existing)
- Subtitle: "FILE 1C › USER_MASTER" — 11px `#6b7280`
- × button: 28×28px, closes panel

### 9B. Role Banner
Colored strip showing current role:
- Background: `ROLE_DEFS[form.role].bg` (light tint)
- Border: `1px solid {role.color}30`
- Shows: `<RolePill role={form.role} />` + role description text

Role descriptions:
- Admin → "Full system access"
- Manager → "All modules + reports"
- Supervisor → "Core ops modules"
- Operator → "Assigned modules only"
- View Only → "Read-only access"

Updates live as user changes the Role dropdown.

### 9C. Form Fields

**Full Name*** (text input)
- Required. Min 2 chars.
- `onChange` auto-computes initials: first char of word 1 + first char of word 2, uppercase
- `useEffect` watches `form.name`, updates `form.initials` automatically

**Email (Google Account)*** (email input)
- Required. Must be unique (GAS validates on save).
- Used as primary key for all permission lookups

**Role** (select) · **Status** (select) — side by side in 2-column grid
- Role options: Admin / Manager / Supervisor / Operator / View Only
- Status options: Active / Inactive / Suspended
- Role change updates the banner immediately

**Department** (text input) · **Reports To** (select) — side by side
- Department: free text
- Reports To: dropdown of all other users by name, value = USR code, default "— None —"
- Filters out the user being edited from their own reports-to list

**Notes** (textarea)
- Min height 60px, resizable vertically
- Admin notes only — not visible to the user themselves

### 9D. Permissions Hint (edit mode only)
Orange info box: "💡 Use the 🔑 Permissions button on the user card to manage custom access overrides."
Only shown in edit mode, not in new user mode.

### 9E. Footer Buttons

**New user mode:**
- [Cancel] — closes panel
- [✅ Save User] — calls `handleSaveUser(form)`

**Edit mode:**
- [🗑 Deactivate] — left-aligned, red styling (sets status to Inactive)
- [Cancel] — closes panel
- [✅ Save User] — calls `handleSaveUser(form)`

### 9F. Save Logic (`handleSaveUser`)
```
1. Validate: name and email required → showToast error if missing
2. If form.id exists → update in users array (setUsers map)
3. If no form.id → generate new id "USR-XXX", append to users array
4. setEditUser(null) — close panel
5. showToast success message
```
Note: In real GAS build, replace setUsers with `gas.call("saveUser", form)` then refresh.

---

## 10. PERMISSIONS PANEL

**Trigger:** `permUser !== null` (set when 🔑 button is clicked)  
**Width:** 540px · **Position:** fixed right 0, full height · **z-index:** 400  
**Background:** `#ffffff` · **Shadow:** `-6px 0 28px rgba(0,0,0,0.14)`  
**Animation:** `slideInRight 0.22s`  
**Close:** click backdrop OR × button

### 10A. Panel Header

**Left:** 40px Avatar + Name (15px weight 800) + Email (11px IBM Plex Mono)  
**Right:** × close button

**Badges row below:**
- `<RolePill role={user.role} />`
- `<StatusBubble status={user.status} />`
- **Admin:** "🔒 Admin permissions are locked" — orange pill
- **With overrides:** "⚡ N custom override(s)" — violet pill
- **No overrides:** "Using role defaults" — gray pill

### 10B. Legend Bar (non-Admin only)
```
LEGEND  |  — Role default  |  ✅ Custom grant  |  ❌ Custom deny  |  Click to cycle
```
Three colored badges + right-aligned instruction text.
Hidden for Admin users (since everything is locked).

### 10C. Tab Bar
4 tabs: **📦 Modules** · **⚡ Actions** · **📤 Exports** · **🔒 Fields**

Active tab: orange bottom border `2px solid #E8690A`, orange text  
Inactive tabs: no border, gray text `#6b7280`

Tabs with overrides show a violet badge with count.

---

### 10D. MODULES TAB

Shows all 8 modules. Each module is a row:

**Row layout:**
- Left: 32×32px icon square + module name + subtitle
- Right: `<ThreeToggle>` button

**Subtitle shows:**
- "Included in role" or "Not in role" (based on `ROLE_DEFS[user.role].mods`)
- " · ✅ Custom granted" or " · ❌ Custom denied" if overridden

**Row background/border changes with state:**
- `granted` → green background `#f0fdf4`, green border `#bbf7d0`
- `denied` → red background `#fff8f8`, red border `#fecaca`
- `role` → white background, default border

**ThreeToggle cycling — Module logic:**

```
IF customMods is empty (no overrides set):
  Clicking any module → initializes customMods from role defaults, then toggles clicked module

IF customMods has values:
  Module IN customMods → remove it (deny if it was in role, remove grant if it wasn't)
  Module NOT IN customMods → add it
```

**State derivation (`getModState`):**
```
customMods.length === 0 → use role defaults
  → rd.mods.includes(mod) ? "role" : "off"

customMods.length > 0 → compare against customMods
  → customMods.includes(mod):
      rd.mods.includes(mod) → "role"   (in both role and custom = just confirming default)
      NOT rd.mods.includes(mod) → "granted"  (added above role)
  → NOT customMods.includes(mod):
      rd.mods.includes(mod) → "denied"  (removed from role)
      NOT rd.mods.includes(mod) → "off"   (never had it, not added)
```

---

### 10E. ACTIONS TAB

Shows all 13 actions grouped into 4 sections:

| Group | Actions |
|-------|---------|
| Record Actions | CREATE · EDIT · SUBMIT · APPROVE · DELETE |
| Exports & Import | EXPORT_PDF · EXPORT_SHEET · EXPORT_EXCEL · IMPORT |
| Data Visibility | VIEW_PRICES |
| Administration | USER_MGMT · SUSPEND · AUDIT |

Each action row:
- Left: action icon + action label + `ACTION_CODE · In role / Not in role` subtitle in IBM Plex Mono
- Right: `<ThreeToggle>`

**ThreeToggle cycling — Action logic:**

```
IF action IS in role defaults:
  Cycle: role → denied → role
  (you can only deny what the role gives; can't "grant again" what's already there)
  
  Click 1: add to deniedActions → state = "denied"
  Click 2: remove from deniedActions → state = "role"

IF action is NOT in role defaults:
  Cycle: off → granted → off
  (you can grant extras above the role)
  
  Click 1: add to extraActions → state = "granted"
  Click 2: remove from extraActions → state = "off"
```

**State derivation (`getActState`):**
```
draft.extraActions.includes(action)  → "granted"
draft.deniedActions.includes(action) → "denied"
rd.actions.includes(action) → "role"
else → "off"
```

---

### 10F. EXPORTS TAB

Shows all 5 export types. These are **derived from action toggles** — not independently controllable.

| Export | Controlled By | Note |
|--------|--------------|------|
| PDF / Print | EXPORT_PDF action | Toggle in Actions tab |
| Google Sheets | EXPORT_SHEET action | Toggle in Actions tab |
| Excel (.xlsx) | EXPORT_EXCEL action | Toggle in Actions tab |
| Copy to Clipboard | Role default only | No action key — toggle disabled |
| Email Export | Role default only | No action key — toggle disabled |

Clicking a row with an action key → delegates to `cycleAction(actionKey)` (same as Actions tab)  
Rows without an action key: toggle is **disabled** (`disabled={true}` on ThreeToggle)

Each row shows "Controlled via Actions tab" or "Role default" as subtitle.

---

### 10G. FIELDS TAB

Shows all 10 sensitive field codes. Fields can be **hidden per user** — they render as `🔒 ——` everywhere in the ERP for this user.

Fields: Unit Prices · Supplier Pricing · Landed Cost · Profit Margin · Salary Data · Bank Details · GST Numbers · Credit Limits · Discount Rates · Cost Sheets

**Two-state only** (no "granted" — fields are either visible or hidden):
- `role` (default) → field is visible for this user
- `denied` → field is hidden → `deniedFields` array → saved to USER_MASTER Col G

**Toggle cycling:**
```
denied → remove from deniedFields → state = "role"
role   → add to deniedFields     → state = "denied"
```

**Row UI when denied:** red background, red border, full opacity 🔒 icon  
**Row UI when visible:** white background, 30% opacity 🔒 icon

---

### 10H. ThreeToggle Component

Shared component used across all 4 tabs.

```
State "role"    → gray pill  "Role default"
State "granted" → green pill "Granted ✅"
State "denied"  → red pill   "Denied ❌"
State "off"     → light gray "No access"
```

- Min-width 110px, padding 5px 12px, borderRadius 6
- Shows ↻ arrow on the right when not disabled (indicates clickable)
- `disabled={true}` → cursor not-allowed, 50% opacity — used for Admin + uncontrollable exports

---

### 10I. Panel Footer

**With overrides (totalOverrides > 0):**
```
[↩ Reset to Role Defaults]  (left, gray)        [Cancel]  [✅ Save Permissions]
```

**No overrides:**
```
                                                 [Cancel]  [✅ Save Permissions]
```

**↩ Reset:** Sets draft back to `{ customMods:[], extraActions:[], deniedActions:[], deniedFields:[] }` — wipes all overrides from panel state (not saved until user clicks Save)

**Save Permissions logic (`handleSavePerms`):**
```
1. setUsers: map over users, find matching id, spread draft overrides onto user
2. showToast: "Permissions saved for {name}"
3. setPermUser(null): close panel
```
Note: In real GAS build, replace with `gas.call("savePermissions", permUser.id, draft)`.

### 10J. Admin Locked State
When `user.role === "Admin"`:
- Legend bar hidden
- All ThreeToggle components: `disabled={true}`
- Reset button not shown (totalOverrides always 0 for Admin)
- Header shows orange "🔒 Admin permissions are locked" pill
- All 4 tabs still navigable — Admin sees their full permissions in read-only view

---

## 11. TOAST NOTIFICATIONS

**Position:** fixed, bottom 28px, centered horizontally  
**z-index:** 999 (above panels)  
**Animation:** `scaleUp 0.15s`  
**Auto-dismiss:** 3000ms

**Success toast:**
- Background: `#E8690A` (orange)
- Icon: ✅
- Text: e.g. "Saurav Aggarwal updated successfully"

**Error toast:**
- Background: `#be123c` (red)
- Icon: ❌
- Text: e.g. "Name and email are required."

**Triggers:**
- User saved → ✅ success
- User added → ✅ success
- Permission saved → ✅ success
- Validation failure → ❌ error

---

## 12. STATE MANAGEMENT

All state lives in the root `UsersRolesPage` component. All panels receive props.

```javascript
// Root state
const [users, setUsers]               // Array — all user objects (source of truth)
const [roleFilter, setRoleFilter]     // String — "All" | "Admin" | "Manager" | …
const [search, setSearch]             // String — search input value
const [editUser, setEditUser]         // null=closed | false=new | {object}=edit
const [permUser, setPermUser]         // null=closed | {user object}=open
const [selectedCard, setSelectedCard] // null | "USR-XXX" — expanded card
const [toast, setToast]               // null | { msg, type }

// Derived (computed on every render)
const filtered = users.filter(u => {
  const matchRole   = roleFilter === "All" || u.role === roleFilter;
  const matchSearch = !search || 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase());
  return matchRole && matchSearch;
});
```

### Panel state isolation
Each panel manages its own local draft state:

**EditPanel:** `const [form, setForm]` — copy of user on open, never mutates parent until save  
**PermissionsPanel:** `const [draft, setDraft]` — copy of user's 4 permission arrays on open  
**Tab:** `const [tab, setTab]` — active tab within PermissionsPanel

---

## 13. PERMISSION LOGIC ENGINE

### `getEffective(user)` — Computes effective permissions for display

```
Input:  user object with role + 4 override arrays
Output: { mods, actions, exports, hiddenFields }

Admin:   returns role defaults unchanged — no overrides ever applied
Others:
  mods    = customMods.length > 0 ? customMods : roleMods
  actions = union(roleMods, extraActions) minus deniedActions
  exports = roleExports minus denied export actions
            + add EXCEL if EXPORT_EXCEL in extraActions
  hiddenFields = deniedFields
```

Used by: card module dots · card expanded view · status bar counter

### `countOverrides(user)` — Counts total active overrides

```
Admin:   always 0

Others:
  customModDiffs = customMods.length > 0
    ? modules added above role + modules removed from role
    : 0
  total = customModDiffs + extraActions.length + deniedActions.length + deniedFields.length
```

Used by: override badge on card · override count on 🔑 button · status bar "WITH OVERRIDES" count

---

## 14. OVERRIDE COUNT SYSTEM

Overrides are counted as **diffs from role defaults**, not just array lengths:

```
Example: Supervisor role has 6 modules by default.
  user.customMods = ["Procurement","Production","Finance"]

  Added above role: Finance (1 module not in Supervisor defaults)
  Removed from role: Inventory, Quality, Sales, Dashboard (4 modules Supervisor has but user doesn't)
  customModDiffs = 1 + 4 = 5

  user.extraActions = ["EXPORT_EXCEL"]  → 1
  user.deniedActions = []               → 0
  user.deniedFields = ["UNIT_PRICE"]    → 1

  Total overrides = 5 + 1 + 0 + 1 = 7
```

This makes the count meaningful: it tells you how many ways this user differs from their role baseline.

---

## 15. DESIGN TOKENS & COLORS

### Base Palette (M)
```javascript
M.bg        = "#f0f2f5"   // Page background
M.shellBg   = "#ffffff"   // Shell bar, sub-toolbar, tabs background
M.shellBd   = "#e2e4e8"   // Shell bar border
M.sidebarBg = "#1a1c20"   // Sidebar background
M.sidebarBd = "#2a2d33"   // Sidebar border + dividers
M.surfHigh  = "#ffffff"   // Cards, panels (highest surface)
M.surfMid   = "#f7f8fa"   // Card footer, panel headers
M.surfLow   = "#f0f2f5"   // Buttons, inputs background
M.divider   = "#e5e7eb"   // All dividers inside panels/cards
M.textA     = "#111827"   // Primary text (names, headings)
M.textB     = "#374151"   // Secondary text (values)
M.textC     = "#6b7280"   // Tertiary text (labels, subtitles)
M.textD     = "#9ca3af"   // Quaternary text (micro labels, status bar)
```

### Accent (A — Oracle Orange)
```javascript
A.a  = "#E8690A"               // Orange — buttons, active states, badges
A.al = "rgba(232,105,10,0.08)" // Orange tint — info boxes, hover backgrounds
A.tx = "#ffffff"               // Text on orange
```

### Role Colors
```javascript
Admin:      color "#BE123C"  bg "#fff1f2"  // Rose red
Manager:    color "#1D4ED8"  bg "#eff6ff"  // Blue
Supervisor: color "#7C3AED"  bg "#f5f3ff"  // Violet
Operator:   color "#15803D"  bg "#f0fdf4"  // Green
View Only:  color "#6b7280"  bg "#f9fafb"  // Gray
```

### Permission State Colors
```javascript
Role default: bg "#f3f4f6"  text "#6b7280"  border "#e5e7eb"
Granted:      bg "#dcfce7"  text "#15803d"  border "#bbf7d0"  // Green
Denied:       bg "#fee2e2"  text "#be123c"  border "#fecaca"  // Red
Off:          bg "#f9fafb"  text "#d1d5db"  border "#e5e7eb"  // Light gray
```

### Typography
```javascript
UI text:     'Nunito Sans', sans-serif  — weights 400/600/700/800/900
Data/codes:  'IBM Plex Mono', monospace — weights 500/700
Micro labels: 9px uppercase letter-spacing 0.1em (section headers, status bar)
```

### Animations
```javascript
slideInRight: from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) }
  → Used by: both panels on open (0.22s)

fadeIn: from { opacity:0 } to { opacity:1 }
  → Used by: panel backdrops (0.15s)

scaleUp: from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) }
  → Used by: card expanded section, toast notification (0.15s)
```

---

## COMPONENT TREE

```
UsersRolesPage
├── Shell
│   ├── ShellBar (top 48px)
│   │   ├── LogoBlock
│   │   ├── Breadcrumb
│   │   └── RightControls (accent, bell, settings, avatars)
│   └── Body (flex row)
│       ├── Sidebar (240px)
│       │   ├── QuickAccess section
│       │   ├── Modules nav
│       │   ├── BottomNav
│       │   └── UserFooter
│       └── Main (flex:1, flex column)
│           ├── SubToolbar (46px)
│           ├── RoleFilterTabs (~50px)
│           ├── CardGrid (flex:1, scrollable)
│           │   └── UserCard × N
│           │       ├── CardHeader (avatar, role pill, override badge)
│           │       ├── UserInfo (name, email)
│           │       ├── ModuleDots (8 dots)
│           │       ├── CardFooter (last login, buttons)
│           │       └── ExpandedSection (conditional, isSel)
│           └── StatusBar (28px)
│
├── EditPanel (conditional, fixed overlay)
│   ├── PanelHeader
│   ├── RoleBanner
│   ├── FormFields (name, email, role, status, dept, reportTo, notes)
│   ├── PermissionsHint (edit mode only)
│   └── Footer (deactivate, cancel, save)
│
├── PermissionsPanel (conditional, fixed overlay)
│   ├── PanelHeader (avatar, name, email, role pill, status, override badge)
│   ├── LegendBar
│   ├── TabBar (modules, actions, exports, fields)
│   ├── TabContent
│   │   ├── ModulesTab → ThreeToggle × 8
│   │   ├── ActionsTab → ThreeToggle × 13 (grouped)
│   │   ├── ExportsTab → ThreeToggle × 5 (some disabled)
│   │   └── FieldsTab  → ThreeToggle × 10
│   └── Footer (reset, cancel, save)
│
└── Toast (conditional, fixed center-bottom)
```

---

*CC ERP · Users & Roles Panel · Working Documentation · Feb 2026*
