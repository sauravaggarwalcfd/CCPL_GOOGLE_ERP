import { useState, useEffect } from "react";

const ACC   = "#E8690A";
const FONT  = "'Nunito Sans', sans-serif";
const MONO  = "'IBM Plex Mono', monospace";

const FILES = {
  "1A": {
    key: "1A", label: "FILE 1A — Items", short: "1A",
    icon: "📦", color: "#1A1A2E", badge: "#3B3B6E", accent: "#ECEEF8",
    sheets: [
      { name: "Article Master",     sheetName: "ARTICLE_MASTER",     icon: "👕", count: 24, desc: "Finished garments",          tags: ["Core"] },
      { name: "RM Fabric",          sheetName: "RM_MASTER_FABRIC",   icon: "🧵", count: 18, desc: "Knit fabrics",               tags: ["Active"] },
      { name: "RM Yarn",            sheetName: "RM_MASTER_YARN",     icon: "🪢", count: 12, desc: "Yarn inventory",             tags: ["Active"] },
      { name: "RM Woven",           sheetName: "RM_MASTER_WOVEN",    icon: "🔲", count: 7,  desc: "Woven materials",            tags: ["Active"] },
      { name: "Trim Master",        sheetName: "TRIM_MASTER",        icon: "🔗", count: 66, desc: "All trims & accessories",    tags: ["Core"] },
      { name: "Trim Attr Names",    sheetName: "TRIM_ATTR_NAMES",    icon: "📝", count: 10, desc: "Trim attribute definitions", tags: [] },
      { name: "Trim Attr Values",   sheetName: "TRIM_ATTR_VALUES",   icon: "📝", count: 48, desc: "Trim attribute values",      tags: [] },
      { name: "Consumable Master",  sheetName: "CONSUMABLE_MASTER",  icon: "🧪", count: 31, desc: "Dyes, chemicals",            tags: ["Active"] },
      { name: "Con Attr Names",     sheetName: "CON_ATTR_NAMES",     icon: "📝", count: 6,  desc: "Consumable attr names",      tags: [] },
      { name: "Con Attr Values",    sheetName: "CON_ATTR_VALUES",    icon: "📝", count: 22, desc: "Consumable attr values",     tags: [] },
      { name: "Packaging Master",   sheetName: "PACKAGING_MASTER",   icon: "📦", count: 15, desc: "Poly bags, cartons",         tags: ["Active"] },
      { name: "Pkg Attr Names",     sheetName: "PKG_ATTR_NAMES",     icon: "📝", count: 5,  desc: "Packaging attr names",       tags: [] },
      { name: "Pkg Attr Values",    sheetName: "PKG_ATTR_VALUES",    icon: "📝", count: 18, desc: "Packaging attr values",      tags: [] },
      { name: "Item Categories",    sheetName: "ITEM_CATEGORIES",    icon: "🗂", count: 9,  desc: "Item category definitions",  tags: ["Core"] },
      { name: "UOM Master",         sheetName: "UOM_MASTER",         icon: "📏", count: 9,  desc: "Units of measure",           tags: ["Core"] },
      { name: "HSN Master",         sheetName: "HSN_MASTER",         icon: "🏷️", count: 22, desc: "GST HSN codes",              tags: ["Finance"] },
      { name: "Color Master",       sheetName: "COLOR_MASTER",       icon: "🎨", count: 87, desc: "Pantone + hex swatches",     tags: ["Core"] },
      { name: "Size Master",        sheetName: "SIZE_MASTER",        icon: "📐", count: 14, desc: "Size specs",                 tags: ["Active"] },
      { name: "Fabric Type Master", sheetName: "FABRIC_TYPE_MASTER", icon: "🔲", count: 11, desc: "SJ, PIQ, FLC etc.",          tags: ["Active"] },
      { name: "Tag Master",         sheetName: "TAG_MASTER",         icon: "🏷",  count: 28, desc: "Classification tags",        tags: ["Core"] },
      { name: "Item Change Log",    sheetName: "ITEM_CHANGE_LOG",    icon: "📋", count: 142,desc: "Audit trail",                tags: ["System"] },
      { name: "Master Relations",   sheetName: "MASTER_RELATIONS",   icon: "🔗", count: 46, desc: "FK relationship config",     tags: ["System"] },
    ]
  },
  "1B": {
    key: "1B", label: "FILE 1B — Factory", short: "1B",
    icon: "🏭", color: "#1C3A2E", badge: "#2E5C47", accent: "#EBF5F0",
    sheets: [
      { name: "User Master",           sheetName: "USER_MASTER",          icon: "👤", count: 8,  desc: "Team accounts + RBAC",      tags: ["Admin"] },
      { name: "Department Master",      sheetName: "DEPARTMENT_MASTER",    icon: "🏢", count: 6,  desc: "Company departments",        tags: ["Active"] },
      { name: "Designation Master",     sheetName: "DESIGNATION_MASTER",   icon: "📌", count: 12, desc: "Job designations",           tags: ["Active"] },
      { name: "Shift Master",           sheetName: "SHIFT_MASTER",         icon: "🕐", count: 3,  desc: "Work shifts",                tags: ["Active"] },
      { name: "Customer Master",        sheetName: "CUSTOMER_MASTER",      icon: "🛍", count: 22, desc: "Buyers & brands",            tags: ["Core"] },
      { name: "Contractor Master",      sheetName: "CONTRACTOR_MASTER",    icon: "👷", count: 9,  desc: "Job work parties",           tags: ["Active"] },
      { name: "Warehouse Master",       sheetName: "WAREHOUSE_MASTER",     icon: "🏪", count: 3,  desc: "Storage locations",          tags: ["Active"] },
      { name: "Storage Bin Master",     sheetName: "STORAGE_BIN_MASTER",   icon: "📦", count: 18, desc: "Bin locations",              tags: ["Active"] },
      { name: "Factory Master",         sheetName: "FACTORY_MASTER",       icon: "🏭", count: 2,  desc: "Factory units",              tags: ["Core"] },
      { name: "Machine Master",         sheetName: "MACHINE_MASTER",       icon: "⚙️", count: 12, desc: "Knitting machines",          tags: ["Core"] },
      { name: "Machine Category",       sheetName: "MACHINE_CATEGORY",     icon: "⚙️", count: 5,  desc: "Machine categories",         tags: [] },
      { name: "Asset Master",           sheetName: "ASSET_MASTER",         icon: "🏗", count: 7,  desc: "Fixed assets",               tags: ["Active"] },
      { name: "Maintenance Schedule",   sheetName: "MAINTENANCE_SCHEDULE", icon: "🔧", count: 14, desc: "Service schedules",          tags: ["Active"] },
      { name: "Spare Parts Master",     sheetName: "SPARE_PARTS_MASTER",   icon: "🔩", count: 28, desc: "Machinery spare parts",      tags: ["Active"] },
      { name: "Process Master",         sheetName: "PROCESS_MASTER",       icon: "🔄", count: 7,  desc: "Production processes",       tags: ["Core"] },
      { name: "Work Center Master",     sheetName: "WORK_CENTER_MASTER",   icon: "🏗", count: 5,  desc: "Work centers",               tags: ["Active"] },
      { name: "Jobwork Party Master",   sheetName: "JOBWORK_PARTY_MASTER", icon: "🤝", count: 6,  desc: "Jobwork vendors",            tags: ["Active"] },
      { name: "Item Supplier Rates",    sheetName: "ITEM_SUPPLIER_RATES",  icon: "💱", count: 47, desc: "Multi-supplier pricing",     tags: ["Finance"] },
      { name: "Presence",              sheetName: "PRESENCE",              icon: "🟢", count: 8,  desc: "Live user presence",         tags: ["System"] },
      { name: "Notifications",         sheetName: "NOTIFICATIONS",         icon: "🔔", count: 34, desc: "System notifications",       tags: ["System"] },
      { name: "Role Master",           sheetName: "ROLE_MASTER",           icon: "🔐", count: 6,  desc: "Role definitions",           tags: ["Admin"] },
      { name: "Role Permissions",      sheetName: "ROLE_PERMISSIONS",      icon: "🔑", count: 18, desc: "Permission matrix",          tags: ["Admin"] },
      { name: "Notification Templates",sheetName: "NOTIFICATION_TEMPLATES",icon: "📩", count: 12, desc: "Notification templates",     tags: ["System"] },
    ]
  },
  "1C": {
    key: "1C", label: "FILE 1C — Finance", short: "1C",
    icon: "💰", color: "#1A3A4A", badge: "#2E5D72", accent: "#EDF3F6",
    sheets: [
      { name: "Supplier Master",    sheetName: "SUPPLIER_MASTER",      icon: "🤝", count: 14, desc: "PRIMARY supplier source",    tags: ["Core"] },
      { name: "Payment Terms",      sheetName: "PAYMENT_TERMS_MASTER", icon: "📋", count: 6,  desc: "Net 30, advance etc.",       tags: ["Finance"] },
      { name: "Tax Master",         sheetName: "TAX_MASTER",           icon: "🧾", count: 4,  desc: "GST rates",                 tags: ["Finance"] },
      { name: "Bank Master",        sheetName: "BANK_MASTER",          icon: "🏦", count: 3,  desc: "Company banks",             tags: ["Finance"] },
      { name: "Cost Center",        sheetName: "COST_CENTER_MASTER",   icon: "📊", count: 5,  desc: "Cost allocation centers",   tags: ["Finance"] },
      { name: "Account Master",     sheetName: "ACCOUNT_MASTER",       icon: "📒", count: 18, desc: "Chart of accounts",         tags: ["Core"] },
    ]
  }
};

const NAV_MODULES = [
  { key: "dashboard",   icon: "📊", label: "Dashboard" },
  { key: "masters",     icon: "📋", label: "Masters",   active: true },
  { key: "procurement", icon: "📦", label: "Procurement" },
  { key: "production",  icon: "🏭", label: "Production" },
  { key: "inventory",   icon: "🗄",  label: "Inventory" },
  { key: "quality",     icon: "🔬", label: "Quality" },
  { key: "sales",       icon: "💼", label: "Sales" },
  { key: "finance",     icon: "💰", label: "Finance" },
];

const SAMPLE_ROWS = {
  "ARTICLE_MASTER": [
    { A: "5249HP", B: "Heavy Polo Pique SS26",          C: "Tops-Polo",  D: "Active",      E: "240", F: "22 Feb 2026" },
    { A: "5248TR", B: "Classic Tracksuit Bottom AW25",  C: "Bottoms",    D: "Active",      E: "320", F: "20 Feb 2026" },
    { A: "5250SW", B: "French Terry Sweatshirt SS26",   C: "Sweatshirt", D: "Development", E: "280", F: "18 Feb 2026" },
  ],
  "RM_MASTER_FABRIC": [
    { A: "RM-FAB-001", B: "Single Jersey 180gsm White Kora",    C: "SJ",  D: "Active", E: "180", F: "21 Feb 2026" },
    { A: "RM-FAB-002", B: "Pique 220gsm Navy Finished",         C: "PIQ", D: "Active", E: "220", F: "19 Feb 2026" },
    { A: "RM-FAB-003", B: "French Terry 300gsm Melange Kora",   C: "FTC", D: "Active", E: "300", F: "15 Feb 2026" },
  ],
  "SUPPLIER_MASTER": [
    { A: "SUP-001", B: "Coats India Pvt Ltd",      C: "Thread",  D: "Active", E: "—", F: "20 Feb 2026" },
    { A: "SUP-002", B: "Vardhman Textiles Ltd",    C: "Fabric",  D: "Active", E: "—", F: "18 Feb 2026" },
    { A: "SUP-003", B: "YKK India Pvt Ltd",        C: "Zipper",  D: "Active", E: "—", F: "15 Feb 2026" },
  ],
};
const EMPTY_ROWS = [{ A: "—", B: "No records yet", C: "—", D: "—", E: "—", F: "—" }];

const STATUS_C = {
  Active:      { bg: "#d1fae5", c: "#065f46" },
  Development: { bg: "#fef3c7", c: "#92400e" },
  Inactive:    { bg: "#fee2e2", c: "#991b1b" },
  "—":         { bg: "#f3f4f6", c: "#9ca3af" },
};

// ─────────────────────────────────────────────────────────────────
// MAIN CONTENT: SHEET TABLE VIEW
// ─────────────────────────────────────────────────────────────────
function SheetTable({ sheet, fileKey }) {
  const file      = FILES[fileKey];
  const rows      = SAMPLE_ROWS[sheet.sheetName] || EMPTY_ROWS;
  const headers   = ["Code", "Name", "Category", "Status", "GSM / Detail", "Updated"];
  const [search, setSearch]         = useState("");
  const [showForm, setShowForm]     = useState(false);
  const filtered = rows.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Sheet top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", display: "flex", alignItems: "center", gap: 12, height: 52, flexShrink: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          <span style={{ fontSize: 16 }}>{file.icon}</span>
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>{file.label}</span>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontSize: 16 }}>{sheet.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>{sheet.name}</span>
          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: "#f4f5f7", color: "#6b7280", fontFamily: MONO, marginLeft: 4 }}>{sheet.count} records</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#9ca3af" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."
              style={{ padding: "6px 10px 6px 28px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 11, fontFamily: FONT, width: 180, outline: "none", color: "#374151" }} />
          </div>
          <button style={{ padding: "6px 12px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>⬆ Import</button>
          <button style={{ padding: "6px 12px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>📤 Export</button>
          <button onClick={() => setShowForm(true)}
            style={{ padding: "6px 16px", background: ACC, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: FONT }}>
            + Add New
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 100px 100px 110px 80px", padding: "8px 16px", background: "#f4f5f7", borderBottom: "2px solid #e5e7eb", gap: 8 }}>
            {[...headers, ""].map(h => (
              <div key={h} style={{ fontSize: 9, fontWeight: 900, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
            ))}
          </div>
          {/* Data rows */}
          {filtered.map((row, i) => {
            const sc = STATUS_C[row.D] || STATUS_C["—"];
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 100px 100px 110px 80px", padding: "9px 16px", borderBottom: i < filtered.length - 1 ? "1px solid #f0f2f5" : "none", background: i % 2 === 0 ? "#fff" : "#fafbfc", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: ACC }}>{row.A}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{row.B}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{row.C}</div>
                <div><span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: sc.bg, color: sc.c }}>{row.D}</span></div>
                <div style={{ fontSize: 11, color: "#374151", fontFamily: MONO }}>{row.E}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{row.F}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={{ fontSize: 10, fontWeight: 700, color: ACC, background: "#FEF3EA", border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: FONT }}>Edit</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: "#9ca3af", fontFamily: MONO }}>
          SHOWING {filtered.length} OF {rows.length} RECORDS · {sheet.sheetName} · FILE {fileKey}
        </div>
      </div>

      {/* Add form slide */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", justifyContent: "flex-end" }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ width: 400, background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", animation: "slideR .2s ease" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{sheet.icon}</span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase" }}>New Record</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>{sheet.name}</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ marginLeft: "auto", background: "#f4f5f7", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {headers.slice(0, 5).map(h => (
                <div key={h} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 9, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{h}</label>
                  <input placeholder={`Enter ${h.toLowerCase()}...`} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "9px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>Cancel</button>
              <button style={{ flex: 2, padding: "9px", background: ACC, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: FONT }}>✅ Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MASTERS HOME: Card grid for a file
// ─────────────────────────────────────────────────────────────────
function MastersHome({ onSelectSheet }) {
  const totalSheets  = Object.values(FILES).reduce((a, f) => a + f.sheets.length, 0);
  const totalRecords = Object.values(FILES).reduce((a, f) => a + f.sheets.reduce((b, s) => b + s.count, 0), 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
      {/* KPI row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[["Total Sheets", totalSheets, "📋"], ["Total Records", totalRecords, "📊"], ["Files", 3, "🗂"]].map(([l, v, ic]) => (
          <div key={l} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>{ic}</span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", fontFamily: MONO }}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      {/* File sections */}
      {Object.values(FILES).map(file => (
        <div key={file.key} style={{ marginBottom: 28 }}>
          {/* File header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: "10px 14px", background: file.color, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 900, color: "#fff" }}>
              {file.icon} {file.label}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[["Sheets", file.sheets.length], ["Records", file.sheets.reduce((a, s) => a + s.count, 0)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{l}:</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", fontFamily: MONO }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {file.sheets.map(sheet => (
              <div key={sheet.name} style={{ position: "relative" }}>
                {/* Add New pill */}
                <button onClick={e => { e.stopPropagation(); onSelectSheet(file.key, sheet); }}
                  style={{ position: "absolute", top: -10, right: 10, zIndex: 10, background: ACC, border: "none", borderRadius: 5, padding: "3px 10px", fontSize: 9, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: FONT, boxShadow: "0 2px 8px rgba(232,105,10,0.35)" }}>
                  + Add
                </button>
                {/* Card */}
                <div onClick={() => onSelectSheet(file.key, sheet)}
                  style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "14px 14px 12px", cursor: "pointer", transition: "all .15s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = file.color; e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.1)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, background: file.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{sheet.icon}</div>
                    <div style={{ background: file.badge, color: "#fff", fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 20, fontFamily: MONO }}>{sheet.count}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#111827", marginBottom: 3, lineHeight: 1.3 }}>{sheet.name}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 10 }}>{sheet.desc}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                    {sheet.tags.map(t => <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 3, background: "#f4f5f7", color: "#6b7280", textTransform: "uppercase" }}>{t}</span>)}
                  </div>
                  <div style={{ paddingTop: 9, borderTop: "1px solid #f0f2f5", fontSize: 10, fontWeight: 800, color: ACC }}>Open →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────
export default function App() {
  // activeSheet = { fileKey, sheet } | null (null = show home)
  const [activeSheet,  setActiveSheet]  = useState(null);
  // fileSidebarOpen = true when a sheet is selected (or user manually toggled)
  const [fileSideOpen, setFileSideOpen] = useState(false);
  // Which file is expanded in the file sidebar
  const [expandedFile, setExpandedFile] = useState("1A");
  // Main sidebar collapsed state
  const [mainCollapsed, setMainCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  // When a sheet is selected, open file sidebar + collapse main sidebar
  function handleSelectSheet(fileKey, sheet) {
    setActiveSheet({ fileKey, sheet });
    setExpandedFile(fileKey);
    setFileSideOpen(true);
    setMainCollapsed(true);
  }

  // Close file sidebar → expand main sidebar → go home
  function handleCloseSidebar() {
    setFileSideOpen(false);
    setActiveSheet(null);
    setMainCollapsed(false);
  }

  const MAIN_W   = mainCollapsed ? 52 : 220;
  const FILE_W   = fileSideOpen  ? 260 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: FONT, background: "#f0f2f5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,700;6..12,800;6..12,900&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        @keyframes slideR { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
      `}</style>

      {/* ── SHELL BAR ─────────────────────────────────────────── */}
      <div style={{ height: 44, background: "#1A1A2E", display: "flex", alignItems: "center", padding: "0 16px", gap: 14, borderBottom: `2px solid ${ACC}`, flexShrink: 0, zIndex: 100 }}>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: 0.5 }}>CC ERP</div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>›</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>Masters</span>
          {activeSheet && <>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>›</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{FILES[activeSheet.fileKey].label}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>›</span>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>{activeSheet.sheet.name}</span>
          </>}
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#9ca3af" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search masters…  Ctrl K"
            style={{ padding: "6px 12px 6px 28px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 7, fontSize: 11, fontFamily: FONT, color: "#fff", width: 220, outline: "none" }} />
        </div>
        <button style={{ padding: "5px 14px", background: ACC, border: "none", borderRadius: 7, fontSize: 11, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: FONT }}>+ New Record</button>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: ACC, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff" }}>SA</div>
      </div>

      {/* ── BODY ROW ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ══ MAIN SIDEBAR ════════════════════════════════════ */}
        <div style={{ width: MAIN_W, background: "#fff", borderRight: "1px solid #e2e4e8", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.25s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>

          {/* Toggle button */}
          <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: mainCollapsed ? "center" : "flex-end", padding: mainCollapsed ? 0 : "0 10px", borderBottom: "1px solid #f0f2f5", flexShrink: 0 }}>
            <button onClick={() => setMainCollapsed(p => !p)}
              style={{ width: 28, height: 28, borderRadius: 6, background: "#f4f5f7", border: "1px solid #e5e7eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#374151", transition: "transform .25s", transform: mainCollapsed ? "rotate(180deg)" : "rotate(0deg)" }}>
              ‹
            </button>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {!mainCollapsed && <div style={{ padding: "4px 14px 6px", fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>MODULES</div>}
            {NAV_MODULES.map(m => {
              const isActive = m.key === "masters";
              return (
                <div key={m.key}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: mainCollapsed ? "9px 0" : "8px 14px", cursor: "pointer", justifyContent: mainCollapsed ? "center" : "flex-start", background: isActive ? "#FEF3EA" : "transparent", borderLeft: mainCollapsed ? "none" : `3px solid ${isActive ? ACC : "transparent"}`, transition: "all .1s", margin: mainCollapsed ? "1px 6px" : "0", borderRadius: mainCollapsed ? 7 : 0, position: "relative" }}
                  title={mainCollapsed ? m.label : ""}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
                  {!mainCollapsed && <span style={{ fontSize: 11, fontWeight: isActive ? 900 : 700, color: isActive ? ACC : "#374151", whiteSpace: "nowrap" }}>{m.label}</span>}
                  {mainCollapsed && isActive && <div style={{ position: "absolute", right: -1, width: 3, height: "100%", background: ACC, borderRadius: "2px 0 0 2px" }} />}
                </div>
              );
            })}
          </div>

          {/* Bottom: Settings */}
          {!mainCollapsed ? (
            <div style={{ padding: "12px 14px", borderTop: "1px solid #f0f2f5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", cursor: "pointer" }}>
                <span style={{ fontSize: 14 }}>⚙️</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Settings</span>
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 0", borderTop: "1px solid #f0f2f5", display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: 16, cursor: "pointer" }} title="Settings">⚙️</span>
            </div>
          )}
        </div>

        {/* ══ FILE SIDEBAR ════════════════════════════════════ */}
        <div style={{ width: FILE_W, background: "#fafbfc", borderRight: FILE_W > 0 ? "1px solid #e2e4e8" : "none", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.25s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>
          {FILE_W > 0 && (
            <>
              {/* File sidebar header */}
              <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 14px", borderBottom: "1px solid #e5e7eb", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#374151", flex: 1 }}>All Masters</span>
                <button onClick={handleCloseSidebar}
                  style={{ width: 24, height: 24, borderRadius: 5, background: "#f4f5f7", border: "1px solid #e5e7eb", cursor: "pointer", fontSize: 11, color: "#6b7280" }}>✕</button>
              </div>

              {/* All 3 files */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {Object.values(FILES).map(file => {
                  const isExpanded = expandedFile === file.key;
                  const fileSheets = file.sheets;
                  const shownSheets = isExpanded ? fileSheets : [];

                  return (
                    <div key={file.key}>
                      {/* File row (clickable header) */}
                      <div onClick={() => setExpandedFile(isExpanded ? null : file.key)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", background: isExpanded ? file.color : "#fff", borderBottom: "1px solid #e5e7eb", transition: "background .15s", userSelect: "none" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: isExpanded ? "rgba(255,255,255,0.2)" : file.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{file.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: isExpanded ? "#fff" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.label}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: isExpanded ? "rgba(255,255,255,0.6)" : "#9ca3af", fontFamily: MONO }}>{fileSheets.length} sheets</div>
                        </div>
                        <div style={{ fontSize: 11, color: isExpanded ? "rgba(255,255,255,0.7)" : "#9ca3af", transition: "transform .2s", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}>▾</div>
                      </div>

                      {/* Sheets list for expanded file */}
                      {isExpanded && (
                        <div style={{ borderBottom: "2px solid #e5e7eb" }}>
                          {fileSheets.map(sheet => {
                            const isActive = activeSheet?.fileKey === file.key && activeSheet?.sheet?.name === sheet.name;
                            return (
                              <div key={sheet.name} onClick={() => handleSelectSheet(file.key, sheet)}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px 7px 22px", cursor: "pointer", background: isActive ? "#FEF3EA" : "transparent", borderLeft: `3px solid ${isActive ? ACC : "transparent"}`, transition: "background .1s" }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f5f5f7"; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                                <span style={{ fontSize: 13, flexShrink: 0 }}>{sheet.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 11, fontWeight: isActive ? 900 : 700, color: isActive ? ACC : "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sheet.name}</div>
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 800, color: isActive ? ACC : "#9ca3af", fontFamily: MONO, flexShrink: 0 }}>{sheet.count}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* File sidebar footer: total */}
              <div style={{ padding: "10px 14px", borderTop: "1px solid #e5e7eb", background: "#fff" }}>
                <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: MONO }}>
                  {Object.values(FILES).reduce((a, f) => a + f.sheets.length, 0)} sheets ·{" "}
                  {Object.values(FILES).reduce((a, f) => a + f.sheets.reduce((b, s) => b + s.count, 0), 0)} records
                </div>
              </div>
            </>
          )}
        </div>

        {/* ══ MAIN CONTENT ════════════════════════════════════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Content header */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {activeSheet ? `${FILES[activeSheet.fileKey].label} ›` : "Masters"} {activeSheet ? activeSheet.sheet.name : "Data Hub"}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#111827" }}>
                {activeSheet ? activeSheet.sheet.name : "📋 Master Data Hub"}
              </div>
            </div>
            {!activeSheet && (
              <div style={{ display: "flex", gap: 8 }}>
                {Object.values(FILES).map(f => (
                  <button key={f.key} onClick={() => { setExpandedFile(f.key); setFileSideOpen(true); setMainCollapsed(true); }}
                    style={{ padding: "6px 14px", background: f.accent, border: `1.5px solid ${f.badge}`, borderRadius: 7, fontSize: 11, fontWeight: 800, color: f.color, cursor: "pointer", fontFamily: FONT }}>
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Page content */}
          {activeSheet
            ? <SheetTable sheet={activeSheet.sheet} fileKey={activeSheet.fileKey} />
            : <MastersHome onSelectSheet={handleSelectSheet} />
          }
        </div>
      </div>

      {/* ── STATUS BAR ─────────────────────────────────────── */}
      <div style={{ height: 26, background: "#1A1A2E", display: "flex", alignItems: "center", padding: "0 16px", gap: 16, flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.4)", fontFamily: MONO }}>CC ERP</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>·</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: MONO }}>
          MASTERS · {Object.values(FILES).reduce((a,f)=>a+f.sheets.length,0)} SHEETS · {Object.values(FILES).reduce((a,f)=>a+f.sheets.reduce((b,s)=>b+s.count,0),0)} RECORDS
        </span>
        {activeSheet && (
          <>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>·</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: ACC, fontFamily: MONO }}>{activeSheet.sheet.sheetName}</span>
          </>
        )}
        <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: MONO }}>{new Date().toLocaleDateString("en-IN")}</span>
      </div>
    </div>
  );
}
