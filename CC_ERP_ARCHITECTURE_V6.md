# CC ERP Architecture — V6

## System Architecture

```
┌─────────────────────┐     HTTPS/JSON      ┌──────────────────────┐     Read/Write     ┌─────────────────┐
│   React Frontend    │ ◄──────────────────► │   GAS API Gateway    │ ◄────────────────► │  Google Sheets  │
│   (Vite + React)    │    ?action=XXX       │   (APIGateway.gs)    │   SpreadsheetApp   │  (Files 1A-2)   │
│   Standalone App    │                      │   API-only (no HTML) │                    │  23+ sheets     │
└─────────────────────┘                      └──────────────────────┘                    └─────────────────┘
        │                                              │
        │  Dev: Vite proxy /api → GAS URL              │  GAS serves ONLY JSON — zero HTML load
        │  Prod: Direct fetch to GAS URL               │  All UI runs in the React app
```

### Single Webapp Architecture
- **ONE webapp**: The React frontend is the only UI. There is no GAS HTML webapp.
- **GAS = API only**: App Script handles only data read/write (JSON). No HTML rendering, no HtmlService.
- **Reduced GAS load**: GAS does not serve HTML/CSS/JS. It only processes API calls to Google Sheets.
- **All updates happen in React**: Any UI change is made in the `frontend/` codebase only.

## Project Structure

```
frontend/
├── package.json                  # React 18, Vite 6
├── vite.config.js                # Dev proxy, port 3000
├── index.html                    # Vite entry
├── .env                          # VITE_GAS_URL (production)
├── .env.development              # VITE_GAS_URL=/api (proxied)
└── src/
    ├── main.jsx                  # ReactDOM entry
    ├── App.jsx                   # Root component (shell + routing)
    ├── styles/
    │   ├── fonts.css             # Google Fonts @import
    │   └── global.css            # Animations, scrollbar, resets
    ├── constants/
    │   ├── index.js              # Barrel export
    │   ├── themes.js             # MODES (6), ACCENTS (6)
    │   ├── defaults.js           # DEFAULTS, FS_MAP, PY_MAP
    │   ├── modules.js            # MODS, CMD_INDEX, ACTIVITY
    │   ├── roles.js              # ROLE_C, ROLE_K, ME, OTHERS, NOTIF_INIT
    │   ├── fonts.js              # UI_FONTS, DATA_FONTS, uiFF(), dataFF()
    │   └── procurement.js        # ITEMS, SUPPLIERS, catalogs, demo data
    ├── services/
    │   └── api.js                # Central fetch-based API client
    ├── hooks/
    │   ├── useHeartbeat.js       # 30s presence heartbeat
    │   └── useKeyboard.js        # Ctrl+K, Escape handlers
    ├── utils/
    │   └── helpers.js            # aColor, ini, ago, greet, fmtINR, etc.
    └── components/
        ├── ui/                   # Chip, Toggle, ModeCard, SDiv, Avatar
        ├── panels/               # NotifPanel, CmdPalette, SettingsPanel
        ├── modules/              # Tile
        └── procurement/          # Procurement, ItemSearch
```

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

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Quick Start
```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:3000` with hot module replacement.

### Environment Variables
- `.env` — Production GAS URL: `VITE_GAS_URL=https://script.google.com/macros/s/DEPLOY_ID/exec`
- `.env.development` — Dev proxy: `VITE_GAS_URL=/api`

### CORS Handling
- **Development**: Vite's built-in proxy routes `/api` requests to the GAS URL, bypassing CORS
- **Production**: Direct fetch to the deployed GAS web app URL (GAS handles CORS via ContentService)

## GAS Deployment

### Adding APIGateway.gs
1. Open the Apps Script editor for File 1A
2. Create a new script file named `APIGateway`
3. Paste the contents of `gas/File1A/APIGateway.gs`
4. The modified `Code.gs` already routes `?action=` requests to the gateway

### Deploying as Web App
1. In Apps Script editor: Deploy → New Deployment
2. Type: Web App
3. Execute as: User accessing the web app
4. Who has access: Anyone within your domain
5. Copy the deployment URL and update `frontend/.env`

## Build & Deploy

### Build for Production
```bash
cd frontend
npm run build
```

Output goes to `frontend/dist/`. Deploy to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Google Cloud Storage

### Preview Production Build
```bash
npm run preview
```

## Architecture Notes

- **No GAS HTML webapp**: GAS `doGet` and `doPost` only handle API requests (JSON). No HTML is served.
- **Single source of truth**: The React frontend in `frontend/` is the only UI. All changes happen here.
- **GAS load reduced**: App Script only processes data operations — no HTML rendering, no HtmlService templating.
- **Google Sheets unchanged**: No changes to sheet structure or data format.

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

Built with React 18 + Vite 6 · GAS Backend · Google Sheets Data Layer
