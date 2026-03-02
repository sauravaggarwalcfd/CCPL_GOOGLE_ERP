# CC ERP Architecture — V6

## System Architecture

```
┌─────────────────────┐     HTTPS/JSON      ┌──────────────────────┐     Read/Write     ┌─────────────────┐
│   React Frontend    │ ◄──────────────────► │   GAS API Gateway    │ ◄────────────────► │  Google Sheets  │
│   (Vite + React)    │    ?action=XXX       │   (APIGateway.gs)    │   SpreadsheetApp   │  (Files 1A-2)   │
│   localhost:9090    │                      │   API-only (no HTML) │                    │  23+ sheets     │
└─────────────────────┘                      └──────────────────────┘                    └─────────────────┘
        │                                              │
        │  Dev: Vite proxy /api → GAS URL              │  GAS serves ONLY JSON — zero HTML load
        │  Prod: PM2 + Vite on port 9090               │  All UI runs in the React app
```

### Single Webapp Architecture
- **ONE webapp**: The React frontend is the only UI. There is no GAS HTML webapp.
- **GAS = API only**: App Script handles only data read/write (JSON). No HTML rendering, no HtmlService.
- **Reduced GAS load**: GAS does not serve HTML/CSS/JS. It only processes API calls to Google Sheets.
- **All updates happen in React**: Any UI change is made in the `frontend/` codebase only.

### GAS Files — What to Keep / Delete

**DELETE from App Script** (old HTML frontend — replaced by React):
| File | Reason |
|------|--------|
| `index.html` | Old HTML webapp UI — replaced by React |
| `scripts.html` | Old JavaScript (66KB) — replaced by React components |
| `styles.html` | Old CSS (42KB) — replaced by React inline styles |

**KEEP in App Script** (backend + API):
| File | Purpose |
|------|---------|
| `APIGateway.gs` | **NEW** — Routes API calls from React to GAS functions |
| `Code.gs` | **UPDATED** — doGet/doPost are API-only (no HTML serving) |
| `Config.gs` | Config & constants |
| `Cache.gs` | Caching layer |
| `MasterSetup.gs` | Sheet setup utilities |
| `Module1_CodeGen.gs` | Code generation logic |
| `Module2_FKEngine.gs` | Foreign key engine |
| `Module3_AttrSync.gs` | Attribute sync |
| `Module4_ChangeLog.gs` | Change log tracking |
| `Module5_AccessControl.gs` | Access control / roles |
| `Module6_ColorSwatch.gs` | Color swatch logic |
| `Module7_ReorderAlert.gs` | Reorder alerts |
| `Module8_ISR.gs` | ISR module |
| `Module9_Export.gs` | Export (PDF/Excel) |
| `Module10_Presence.gs` | Online user tracking |
| `Module11_UIBootstrap.gs` | Bootstrap data for React app |
| `Module12_Notifications.gs` | Notification CRUD |
| `Module13_QuickAccess.gs` | Shortcuts/quick access |
| `Module14_ProcurementAPI.gs` | Procurement data operations |
| `SheetSetup.gs` | Sheet creation (1A) |
| `SheetSetup_1B.gs` | Sheet creation (1B) |
| `SheetSetup_1C.gs` | Sheet creation (1C) |
| `SheetSetup_F2.gs` | Sheet creation (F2) |
| `CreateNewSidebar.html` | Spreadsheet sidebar (inside Sheets, not webapp) |
| `SupplierSidebar.html` | Spreadsheet sidebar |
| `TagSidebar.html` | Spreadsheet sidebar |
| `appsscript.json` | GAS project manifest |
| `.clasp.json` | clasp deployment config |

## Project Structure

```
C:\CCPL_GOOGLE_ERP\                      ← Local Windows folder
├── START.bat                            # Launch script (git pull + PM2 start)
├── SETUP_FIRST_TIME.bat                 # One-time setup (installs PM2, auto-boot)
├── ecosystem.config.cjs                 # PM2 process config (port 9090)
├── logs/                                # PM2 runtime logs
│   ├── cc-erp-out.log
│   └── cc-erp-error.log
├── CC_ERP_ARCHITECTURE_V6.md            # This file
├── CC_ERP_Main.jsx                      # Original monolithic reference (read-only)
├── CC_ERP_UI_SPEC_V6.md                 # UI spec document
├── gas/
│   └── File1A/                          # GAS backend files (deploy to App Script)
│       ├── APIGateway.gs                # NEW — API router (22 routes)
│       ├── Code.gs                      # UPDATED — API-only doGet/doPost
│       ├── Config.gs
│       ├── Cache.gs
│       ├── Module1-14_*.gs              # All business logic modules
│       ├── SheetSetup*.gs               # Sheet creation scripts
│       ├── *Sidebar.html                # Spreadsheet sidebars (keep)
│       ├── appsscript.json
│       └── .clasp.json
└── frontend/                            # React webapp (the ONLY UI)
    ├── package.json                     # React 18, Vite 6
    ├── vite.config.js                   # Port 9090, dev proxy
    ├── index.html                       # Vite entry
    ├── .env                             # VITE_GAS_URL (production GAS URL)
    ├── .env.development                 # VITE_GAS_URL=/api (proxied)
    └── src/
        ├── main.jsx                     # ReactDOM entry
        ├── App.jsx                      # Root component (shell + routing)
        ├── styles/
        │   ├── fonts.css                # Google Fonts @import
        │   └── global.css               # Animations, scrollbar, resets
        ├── constants/
        │   ├── index.js                 # Barrel export
        │   ├── themes.js                # MODES (6), ACCENTS (6)
        │   ├── defaults.js              # DEFAULTS, FS_MAP, PY_MAP
        │   ├── modules.js               # MODS, CMD_INDEX, ACTIVITY
        │   ├── roles.js                 # ROLE_C, ROLE_K, ME, OTHERS, NOTIF_INIT
        │   ├── fonts.js                 # UI_FONTS, DATA_FONTS, uiFF(), dataFF()
        │   └── procurement.js           # ITEMS, SUPPLIERS, catalogs, demo data
        ├── services/
        │   └── api.js                   # Central fetch-based API client (22 endpoints)
        ├── hooks/
        │   ├── useHeartbeat.js          # 30s presence heartbeat
        │   └── useKeyboard.js           # Ctrl+K, Escape handlers
        ├── utils/
        │   └── helpers.js               # aColor, ini, ago, greet, fmtINR, etc.
        └── components/
            ├── ui/                      # Chip, Toggle, ModeCard, SDiv, Avatar
            ├── panels/                  # NotifPanel, CmdPalette, SettingsPanel
            ├── modules/                 # Tile
            └── procurement/             # Procurement, ItemSearch
```

## Server & Deployment

### Port
**9090** — configured in `vite.config.js`, `package.json`, and `ecosystem.config.cjs`.

### PM2 Process Manager
The app runs as a background service via PM2:

| Setting | Value |
|---------|-------|
| Process name | `cc-erp` |
| Port | 9090 |
| Host | `0.0.0.0` (accessible from LAN) |
| Auto-restart | Yes (on crash) |
| Max restarts | 10 |
| Restart delay | 3 seconds |
| Boot start | Yes (via `pm2-windows-startup`) |
| Logs | `logs/cc-erp-out.log`, `logs/cc-erp-error.log` |

### PM2 Commands
```bash
pm2 status              # See all running processes
pm2 logs cc-erp         # Live log output
pm2 restart cc-erp      # Restart server
pm2 stop cc-erp         # Stop server
pm2 delete cc-erp       # Remove from PM2
pm2 save                # Save process list for boot recovery
```

### First-Time Setup (run once on new machine)

**Prerequisites**: Node.js 18+, Git, Windows OS

```
1. git clone https://github.com/sauravaggarwalcfd/CCPL_GOOGLE_ERP.git C:\CCPL_GOOGLE_ERP
2. Double-click:  C:\CCPL_GOOGLE_ERP\SETUP_FIRST_TIME.bat
```

`SETUP_FIRST_TIME.bat` does:
- Verifies Node.js and Git are installed
- Installs PM2 and `pm2-windows-startup` globally
- Configures PM2 to auto-start on every Windows boot
- Runs `npm install` in the frontend folder

### Daily Launch / Update

```
Double-click:  C:\CCPL_GOOGLE_ERP\START.bat
```

`START.bat` does:
1. `git fetch --all` + `git reset --hard origin/main` — pulls latest from GitHub
2. `npm install` — installs any new dependencies
3. `npm run build` — builds production bundle
4. `pm2 delete cc-erp` — clears old process
5. `pm2 start ecosystem.config.cjs` — starts server on port 9090
6. `pm2 save` — saves for boot recovery

After running, open **http://localhost:9090** in browser.

### Environment Variables
| File | Variable | Value |
|------|----------|-------|
| `.env` | `VITE_GAS_URL` | `https://script.google.com/macros/s/DEPLOY_ID/exec` |
| `.env.development` | `VITE_GAS_URL` | `/api` (proxied by Vite) |

### CORS Handling
- **Development**: Vite's built-in proxy routes `/api` requests to the GAS URL, bypassing CORS
- **Production**: Direct fetch to the deployed GAS web app URL (GAS handles CORS via ContentService)

## GAS Deployment

### Adding APIGateway.gs to App Script
1. Open the Apps Script editor for File 1A
2. Create a new script file named `APIGateway`
3. Paste the contents of `gas/File1A/APIGateway.gs`
4. Delete `index.html`, `scripts.html`, `styles.html` from the project
5. Update `Code.gs` with the new API-only `doGet`/`doPost`

### Deploying as Web App
1. In Apps Script editor: Deploy → New Deployment
2. Type: Web App
3. Execute as: User accessing the web app
4. Who has access: Anyone within your domain
5. Copy the deployment URL and update `frontend/.env`

### Code.gs — doGet / doPost (API-only)
```javascript
function doGet(e) {
  return handleAPIRequest(e, 'GET');
}

function doPost(e) {
  return handleAPIRequest(e, 'POST');
}
```
No HTML is served. All requests route to `APIGateway.gs`.

## API Reference

All endpoints are accessed via the deployed GAS web app URL with `?action=<name>`.

| # | Action | Method | Parameters | Description |
|---|--------|--------|------------|-------------|
| 1 | `getUIBootstrap` | GET | — | Returns user info, theme config, modules, shortcuts |
| 2 | `saveUserTheme` | POST | `config` (object) | Saves user theme preferences to PropertiesService |
| 3 | `heartbeat` | POST | `module`, `page` | Updates user presence timestamp |
| 4 | `getOnlineUsers` | GET | — | Returns list of currently active users |
| 5 | `getNotifications` | GET | `filter?` | Returns notifications from NTF sheet |
| 6 | `markNotificationRead` | POST | `id` | Marks a notification as read |
| 7 | `dismissNotification` | POST | `id` | Removes a notification |
| 8 | `getUserShortcuts` | GET | — | Returns user's quick access shortcuts |
| 9 | `addShortcut` | POST | `shortcut` (object) | Adds a quick access shortcut |
| 10 | `removeShortcut` | POST | `id` | Removes a shortcut |
| 11 | `getPOList` | GET | — | Returns all purchase orders |
| 12 | `getGRNList` | GET | — | Returns all goods receipt notes |
| 13 | `savePO` | POST | `data`, `lines` | Creates/updates a purchase order |
| 14 | `saveGRN` | POST | `data`, `lines` | Creates/updates a GRN |
| 15 | `getOpenPOs` | GET | — | Returns open POs for GRN reference |
| 16 | `getItems` | GET | — | Returns items master data |
| 17 | `getSuppliers` | GET | — | Returns suppliers master data |
| 18 | `searchItems` | GET | `query` | Search items by code/name |
| 19 | `getActivityFeed` | GET | — | Returns recent activity entries |
| 20 | `getDashboardStats` | GET | — | Returns aggregated dashboard statistics |
| 21 | `exportDocument` | POST | `type`, `id`, `format` | Exports PO/GRN to PDF/Excel/Sheets |
| 22 | `printDocument` | GET | `type`, `id` | Returns structured data for print view |

### Response Format

All API responses follow this envelope:
```json
{
  "success": true,
  "action": "getUIBootstrap",
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-25T10:30:00.000Z",
    "durationMs": 142
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": { "message": "Invalid action", "code": 400 },
  "meta": { "timestamp": "..." }
}
```

## Theme System

### 6 Color Modes
| Mode | Description |
|------|-------------|
| Light | Default warm white theme |
| Black | Pure OLED black |
| Light Grey | Soft neutral grey |
| Midnight | GitHub-style dark |
| Warm Ivory | Earthy warm tones |
| Slate | Deep blue-grey |

### 6 Accent Colors
| Accent | Hex | Use |
|--------|-----|-----|
| Oracle Orange | #E8690A | Default — brand color |
| Azure Blue | #0078D4 | Professional |
| Deep Teal | #007C7C | Nature |
| Emerald | #15803D | Success-oriented |
| Violet | #7C3AED | Creative |
| Rose Red | #BE123C | Bold |

### Customizable Options
- Font size: Small (11px) / Medium (13px) / Large (15px)
- Row density: Compact / Comfortable / Spacious
- UI font: 6 sans-serif options
- Data font: 5 monospace options
- Table style: Striped / Bordered / Clean
- Sidebar width: 260px / 340px / 440px (or drag)
- Toggles: Status bar, thumbnails, row numbers, category badges, compact sidebar

## Component Architecture

```
App
├── ShellBar (top bar)
│   ├── Logo + Breadcrumb
│   ├── Search Pill (→ CmdPalette)
│   ├── Theme/Accent Quick Switchers
│   ├── Notification Bell (→ NotifPanel)
│   ├── Settings Button (→ SettingsPanel)
│   └── User Avatars + Presence
├── Sidebar
│   ├── Quick Access Shortcuts
│   ├── Module Navigation
│   └── User Card
├── Main Content
│   ├── Dashboard (Home)
│   │   ├── Greeting + Stats Cards
│   │   ├── Module Tiles (→ Tile)
│   │   ├── Activity Feed
│   │   └── Online Users
│   └── Procurement Module
│       ├── List View (PO / GRN tables)
│       └── Form View
│           ├── Command Panel (accordions)
│           ├── Line Items Table (→ ItemSearch)
│           └── Modals (Save, Print, Unsaved)
├── SettingsPanel (overlay)
├── CmdPalette (overlay)
└── NotifPanel (dropdown)
```

---

Built with React 18 + Vite 6 · Port 9090 · PM2 · GAS API Backend · Google Sheets Data Layer
