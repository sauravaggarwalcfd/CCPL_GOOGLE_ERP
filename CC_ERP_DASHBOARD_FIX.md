# CC ERP — Dashboard Not Fetching Data: Fix Guide
## For: Claude in VS Code / Cursor
**Architecture:** React (Vite port 9090) → fetch() → GAS JSON API → Google Sheets
**Date:** Feb 2026

---

## How This System Works (Read First)

```
React Dashboard Component
        │
        │  fetch(`${VITE_GAS_URL}?action=getUIBootstrap`)
        ▼
GAS APIGateway.gs → handleAPIRequest(e, 'GET')
        │
        │  routes to Module11_UIBootstrap.gs → getUIBootstrap()
        ▼
Reads Google Sheets (FILE_1A, 1B, 1C, FILE_2)
        │
        └─ Returns JSON: { success: true, data: { ... } }
```

**Dashboard fails when ANY link in this chain breaks.**

---

## STEP 1 — Diagnose: Where Is It Failing?

Open browser DevTools → Network tab → reload dashboard → find the GAS fetch call.

### Outcome A: No network request at all
→ Problem is in React: `VITE_GAS_URL` is undefined or the fetch is never called.
→ Jump to **Fix 1**.

### Outcome B: Request made but returns CORS error
```
Access to fetch at 'https://script.google.com/...' blocked by CORS policy
```
→ Jump to **Fix 2**.

### Outcome C: Request returns 200 but data is wrong/empty
```json
{ "success": false, "error": "..." }
```
or
```json
{ "success": true, "data": null }
```
→ Jump to **Fix 3**.

### Outcome D: Request returns HTML instead of JSON
```html
<!DOCTYPE html><html>...Google sign-in page...
```
→ Jump to **Fix 4**.

---

## FIX 1 — React: VITE_GAS_URL Not Set

### Check `.env` file in your React project root:
```bash
# Should exist and have this:
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**If file doesn't exist:** Create it at `frontend/.env` (or wherever your `vite.config.js` is).

**If the variable exists but still undefined in code:** Make sure you're accessing it as:
```javascript
const GAS_URL = import.meta.env.VITE_GAS_URL;
// NOT process.env.VITE_GAS_URL  ← this is wrong for Vite
// NOT process.env.REACT_APP_GAS_URL ← that's Create React App
```

**After changing `.env`:** Restart Vite dev server. Environment variables are read at startup.
```bash
# Stop the server (Ctrl+C) then:
npm run dev
```

---

## FIX 2 — CORS Error from GAS

GAS requires specific response headers. Open `APIGateway.gs` and find `handleAPIRequest`. The response must be built like this:

```javascript
function handleAPIRequest(e, method) {
  var output;
  
  try {
    var action = e.parameter ? e.parameter.action : null;
    var data;

    switch (action) {
      case 'getUIBootstrap':
        data = getUIBootstrap(e.parameter);
        break;
      case 'getMastersList':
        data = getMastersList();
        break;
      case 'getMasterRows':
        data = getMasterRows(e.parameter);
        break;
      // ... other cases ...
      default:
        data = { error: 'Unknown action: ' + action };
    }

    output = ContentService
      .createTextOutput(JSON.stringify({ success: true, data: data }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    output = ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: { message: err.message, stack: err.stack } 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return output;
}
```

**Critical rules:**
- Must use `ContentService.createTextOutput()` — NOT `HtmlService`
- Must set `.setMimeType(ContentService.MimeType.JSON)`
- GAS automatically adds CORS headers when deployed as Web App with `access: ANYONE`

**After changing `APIGateway.gs`:** Redeploy (Deploy → Manage Deployments → New version).

---

## FIX 3 — GAS Returns Error or Empty Data

### 3A: Check the action name matches exactly

In your React dashboard component, find the fetch call:
```javascript
// What does it say?
fetch(`${GAS_URL}?action=SOMETHING`)
```

Then open `APIGateway.gs` → find `handleAPIRequest` → check the `switch(action)` block.

The string in React `?action=SOMETHING` must **exactly match** the `case 'SOMETHING':` in GAS. Case-sensitive.

**Common mismatch examples:**
```
React sends:    ?action=getDashboardData
GAS has case:   'getdashboarddata'    ← won't match
GAS has case:   'getDashboard'        ← won't match
GAS has case:   'getDashboardData'    ← ✅ matches
```

### 3B: Check FILE_2 ID in Config.gs

If any dashboard panel reads Procurement data (POs, GRNs) this will return null if FILE_2 ID is wrong:

```javascript
// Config.gs — THIS MUST BE:
FILE_2: '1KfeKzO-djdMn6YFSNOoyLeKOZfdcFCyHLzf7jpm6Pls'
// NOT:
FILE_2: 'YOUR_FILE_2_SPREADSHEET_ID'   // ← breaks procurement data
```

### 3C: Test the API directly in browser

Paste this URL in your browser (replace with your actual deployment URL):
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getUIBootstrap
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "user": { "email": "...", "role": "..." },
    "notifications": [...],
    "shortcuts": [...],
    "presence": [...]
  }
}
```

If you get an error message in the JSON — that tells you exactly what's failing server-side.

---

## FIX 4 — GAS Returns HTML (Sign-in Page or Error Page)

This means the GAS deployment is set to wrong access level.

### Fix in Apps Script:
1. Go to `appsscript.json`
2. Make sure it says:
```json
"webapp": {
  "executeAs": "USER_ACCESSING",
  "access": "ANYONE"
}
```
3. Save → **Deploy → New Deployment** (not edit existing — this changes the access setting)

**Note:** `"ANYONE"` means anyone with the URL can call it. This is required for the React app running on localhost to reach GAS without being blocked.

---

## FIX 5 — Dev Server Proxy Not Working

If you're running `npm run dev` and getting errors only in dev (not in production build), check `vite.config.js`:

```javascript
// vite.config.js
export default {
  server: {
    port: 9090,
    proxy: {
      '/api': {
        target: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
}
```

And in `.env.development`:
```
VITE_GAS_URL=/api
```

And in `.env` (production):
```
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

---

## FIX 6 — Module11_UIBootstrap.gs Is Missing or Incomplete

The dashboard almost certainly calls `getUIBootstrap()`. Open `Module11_UIBootstrap.gs` and check this function exists and reads from sheets:

```javascript
function getUIBootstrap(params) {
  var email = Session.getActiveUser().getEmail();
  
  // Get user role
  var userPerms = getUserPermissions(email);
  
  // Get notifications  
  var notifications = getUnreadNotifications(email);
  
  // Get shortcuts
  var shortcuts = getUserShortcuts(email);
  
  // Get presence
  var presence = getActivePresence();
  
  return {
    user: {
      email: email,
      role: userPerms.role,
      name: userPerms.name,
      modules: userPerms.modules,
      actions: userPerms.actions
    },
    notifications: notifications,
    shortcuts: shortcuts,
    presence: presence,
    timestamp: new Date().toISOString()
  };
}
```

**If this function is empty or throws** → the entire dashboard load fails because React waits for this bootstrap response before rendering.

---

## FIX 7 — Dashboard Component: Check the Fetch Logic

Open your dashboard `.jsx` file. The fetch should follow this pattern:

```jsx
// ✅ CORRECT PATTERN
const [dashData, setDashData] = useState(null);
const [loading, setLoading]   = useState(true);
const [error, setError]       = useState(null);

useEffect(() => {
  const GAS_URL = import.meta.env.VITE_GAS_URL;
  
  // Guard: don't fetch if URL not set
  if (!GAS_URL) {
    setError('VITE_GAS_URL not set in .env');
    setLoading(false);
    return;
  }

  fetch(`${GAS_URL}?action=getUIBootstrap`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(json => {
      if (!json.success) throw new Error(json.error?.message || 'GAS returned success:false');
      setDashData(json.data);
    })
    .catch(err => {
      setError(err.message);
      console.error('Dashboard fetch failed:', err);
    })
    .finally(() => setLoading(false));
}, []);
```

**Common mistakes to find and fix:**
```javascript
// ❌ WRONG — process.env doesn't work in Vite
const url = process.env.GAS_URL;

// ❌ WRONG — missing error handling, silent failures
fetch(url).then(r => r.json()).then(d => setData(d));

// ❌ WRONG — no loading state so component renders with null data
const data = await fetch(url);  // in useEffect without state

// ❌ WRONG — google.script.run is for GAS sidebar only, not React
google.script.run.withSuccessHandler(cb).getUIBootstrap();
```

---

## Quick Diagnosis Script (Run in Browser Console)

With your React app open, paste this in browser console:

```javascript
// Quick GAS health check
const gasUrl = import.meta.env.VITE_GAS_URL || window.__GAS_URL__;
console.log('GAS URL:', gasUrl);

fetch(gasUrl + '?action=getUIBootstrap')
  .then(r => r.json())
  .then(d => console.log('GAS response:', JSON.stringify(d, null, 2)))
  .catch(e => console.error('FETCH FAILED:', e.message));
```

**Read the output:**
- `GAS URL: undefined` → Fix 1 (env var)
- `FETCH FAILED: Failed to fetch` → Fix 2 (CORS) or Fix 4 (access level)
- JSON with `success: false` → Fix 3 (action name or FILE_2 ID)
- JSON with `success: true, data: {...}` → GAS works, bug is in React rendering

---

## Summary: Fix Order

```
1. Fix Config.gs FILE_2 ID                    ← fixes procurement data
2. Redeploy GAS as new version                ← pushes all fixes live
3. Update VITE_GAS_URL in .env               ← React points to right GAS
4. Restart Vite (npm run dev)                 ← picks up .env changes
5. Test URL directly in browser               ← confirms GAS returns JSON
6. Check browser DevTools Network tab         ← confirms React is calling correctly
7. If still failing — check switch(action)    ← action name mismatch
```

---

## The ONE Test That Tells You Everything

After fixing Config.gs + redeploying, paste this in browser:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getUIBootstrap
```

- ✅ Returns JSON with `"success": true` → GAS is fully working, bug is in React
- ❌ Returns HTML → access level wrong (Fix 4)
- ❌ Returns `{"success":false,"error":"Cannot open spreadsheet"}` → Config.gs FILE_2 ID still wrong (Fix 1)
- ❌ Returns `{"success":false,"error":"Unknown action"}` → APIGateway missing the case (Fix 3A)

---

*CC ERP Dashboard Fix Guide V1 · Feb 2026 · Confidence Clothing*
