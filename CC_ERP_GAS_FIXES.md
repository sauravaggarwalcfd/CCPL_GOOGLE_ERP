# CC ERP — GAS Fixes & Cleanup Instructions
## For: Claude in VS Code / Cursor
**Priority: FIX BEFORE ANYTHING ELSE**
**Date:** Feb 2026 | **Author:** Saurav Aggarwal

---

## ⚠️ HAVE I READ THE GOOGLE SHEETS?

**NO. Claude cannot read Google Sheets directly.** The Drive tool only reads Google Docs.

To audit live sheet structure, paste this function into Apps Script → run once → paste output back to Claude:

```javascript
function auditSheetStructure() {
  var result = {};

  var ss1A = SpreadsheetApp.openById('1eaDbKEJpty6c7_FrVm5wElOce_z4yHRMr3E-SAskdMc');
  result.FILE_1A = ss1A.getSheets().map(function(s) {
    return { name: s.getName(), dataRows: Math.max(0, s.getLastRow() - 3) };
  });

  var ss1B = SpreadsheetApp.openById('1WjtpBhXwYVBVnPSDbzTWm8X0nyVhzsailBpRqXi7Se4');
  result.FILE_1B = ss1B.getSheets().map(function(s) {
    return { name: s.getName(), dataRows: Math.max(0, s.getLastRow() - 3) };
  });

  var ss1C = SpreadsheetApp.openById('1t3zHrORAjZJ2cVr8bru4HE4kUvyYdm5RDICA8NkiDX8');
  result.FILE_1C = ss1C.getSheets().map(function(s) {
    return { name: s.getName(), dataRows: Math.max(0, s.getLastRow() - 3) };
  });

  var ss2 = SpreadsheetApp.openById('1KfeKzO-djdMn6YFSNOoyLeKOZfdcFCyHLzf7jpm6Pls');
  result.FILE_2 = ss2.getSheets().map(function(s) {
    return { name: s.getName(), dataRows: Math.max(0, s.getLastRow() - 3) };
  });

  Logger.log(JSON.stringify(result, null, 2));
}
```

---

## 🔴 FIX 1 — CRITICAL: Config.gs FILE_2 ID (Breaks All Procurement)

**File:** `Config.gs`

**Find this line (around line 18):**
```javascript
FILE_2:  'YOUR_FILE_2_SPREADSHEET_ID'
```

**Replace with:**
```javascript
FILE_2:  '1KfeKzO-djdMn6YFSNOoyLeKOZfdcFCyHLzf7jpm6Pls'
```

**Why:** Every PO, GRN, and Procurement function calls `CONFIG.FILE_IDS.FILE_2`. With the placeholder ID it throws `Unable to open spreadsheet` and crashes the entire procurement module + any dashboard panel that reads File 2 data.

**After fixing:** Save → Deploy → New Deployment (redeploy as Web App).

---

## 🟡 FIX 2 — HTML Files: What to Keep vs Delete

### Files in Apps Script:
```
.clasp.json             → KEEP (clasp config)
appsscript.json         → KEEP (OAuth scopes)
APIGateway.gs           → KEEP
Cache.gs                → KEEP
Code.gs                 → KEEP
Config.gs               → KEEP (after Fix 1)
MasterSetup.gs          → KEEP
Module1_CodeGen.gs      → KEEP
Module2_FKEngine.gs     → KEEP
Module3_AttrSync.gs     → KEEP
Module4_ChangeLog.gs    → KEEP
Module5_AccessControl.gs→ KEEP
Module6_ColorSwatch.gs  → KEEP
Module7_ReorderAlert.gs → KEEP
Module8_ISR.gs          → KEEP
Module9_Export.gs       → KEEP
Module10_Presence.gs    → KEEP
Module11_UIBootstrap.gs → KEEP
Module12_Notifications.gs→KEEP
Module13_QuickAccess.gs → KEEP
Module14_ProcurementAPI.gs→KEEP
SheetSetup.gs           → KEEP
SheetSetup_1B.gs        → KEEP
SheetSetup_1C.gs        → KEEP
SheetSetup_F2.gs        → KEEP
```

### HTML Files Decision:
```
CreateNewSidebar.html   → KEEP  (used by menuOpenCreateNewSidebar — GAS Sheets sidebar)
TagSidebar.html         → KEEP  (used by menuOpenTagSidebar — GAS Sheets sidebar)
SupplierSidebar.html    → KEEP  (used by menuOpenSupplierSidebar — GAS Sheets sidebar)

index.html              → ⚠️ CHECK FIRST (see below)
scripts.html            → ⚠️ CHECK FIRST (see below)
styles.html             → ⚠️ CHECK FIRST (see below)
```

### How to check index.html / scripts.html / styles.html:

Open `Code.gs` → find `menuOpenProcurementApp`:
```javascript
function menuOpenProcurementApp() {
  var html = HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('CC ERP — Procurement')
  SpreadsheetApp.getUi().showSidebar(html);
}
```

**IF this function exists and is used** → these HTML files are a legacy procurement sidebar inside Google Sheets. Since the React frontend now handles procurement UI, this sidebar is redundant but harmless.

**Decision:**
- If no one uses "Open Procurement App" from the GAS menu → **DELETE** `index.html`, `scripts.html`, `styles.html`
- If some team members still use the sheet sidebar as a fallback → **KEEP** for now

**To delete in Apps Script:** Open file → click the 3-dot menu (⋯) next to the filename → Delete.

**IMPORTANT:** Deleting `index.html` will break `menuOpenProcurementApp()`. You must also delete or comment out that function in `Code.gs`:
```javascript
// REMOVED — React frontend handles procurement UI
// function menuOpenProcurementApp() { ... }
```

---

## 🟡 FIX 3 — appsscript.json OAuth Scopes

Open `appsscript.json`. Make sure it contains ALL these scopes:

```json
{
  "timeZone": "Asia/Kolkata",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_ACCESSING",
    "access": "ANYONE"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

**Critical:** `"access": "ANYONE"` — if this is `"DOMAIN"` the React app cannot call GAS from localhost.

---

## 🟡 FIX 4 — Redeploy After Every Config Change

After every change to ANY `.gs` file:
1. Apps Script → **Deploy** → **Manage Deployments**
2. Click the pencil ✏️ on your active deployment
3. Change version to **"New version"**
4. Click **Deploy**
5. Copy the new `/exec` URL
6. Paste into your React `.env` file:
   ```
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_NEW_ID/exec
   ```

**⚠️ Warning:** The deployment URL only changes if you create a NEW deployment. Editing existing one keeps same URL but pushes new code. Always use "New version" not "New deployment" for routine fixes.

---

## ✅ Verification Checklist

After all fixes:
```
□ Config.gs FILE_2 ID = '1KfeKzO-djdMn6YFSNOoyLeKOZfdcFCyHLzf7jpm6Pls'
□ appsscript.json access = "ANYONE" (not DOMAIN)
□ appsscript.json has all 4 OAuth scopes
□ GAS redeployed as new version
□ React .env VITE_GAS_URL updated to latest /exec URL
□ Run auditSheetStructure() — no errors in execution log
□ Open browser → paste GAS URL + ?action=getUIBootstrap → should return JSON
```

---

*CC ERP GAS Fixes V1 · Feb 2026 · Confidence Clothing*
