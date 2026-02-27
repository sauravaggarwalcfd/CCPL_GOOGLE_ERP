import { useState, useEffect } from 'react';
import { uiFF } from '../../constants/fonts';
import api from '../../services/api';
import SheetWorkspace from './SheetWorkspace';

// ── All master sheets by file (v2 full list) ──
const FILES = {
  "1A": {
    key: "1A", label: "FILE 1A — Items", short: "1A",
    icon: "📦", color: "#1A1A2E", badge: "#3B3B6E", accent: "#ECEEF8",
    sheets: [
      { key: "article_master",      name: "Article Master",     icon: "👕", desc: "Finished garments",          tags: ["Core"] },
      { key: "rm_fabric",           name: "RM Fabric",          icon: "🧵", desc: "Knit fabrics",               tags: ["Active"] },
      { key: "rm_yarn",             name: "RM Yarn",            icon: "🪢", desc: "Yarn inventory",             tags: ["Active"] },
      { key: "rm_woven",            name: "RM Woven",           icon: "🔲", desc: "Woven materials",            tags: ["Active"] },
      { key: "trim_master",         name: "Trim Master",        icon: "🔗", desc: "All trims & accessories",    tags: ["Core"] },
      { key: "trim_attr_names",     name: "Trim Attr Names",    icon: "📝", desc: "Trim attribute definitions", tags: [] },
      { key: "trim_attr_values",    name: "Trim Attr Values",   icon: "📝", desc: "Trim attribute values",      tags: [] },
      { key: "consumable_master",   name: "Consumable Master",  icon: "🧪", desc: "Dyes, chemicals",            tags: ["Active"] },
      { key: "con_attr_names",      name: "Con Attr Names",     icon: "📝", desc: "Consumable attr names",      tags: [] },
      { key: "con_attr_values",     name: "Con Attr Values",    icon: "📝", desc: "Consumable attr values",     tags: [] },
      { key: "packaging_master",    name: "Packaging Master",   icon: "📦", desc: "Poly bags, cartons",         tags: ["Active"] },
      { key: "pkg_attr_names",      name: "Pkg Attr Names",     icon: "📝", desc: "Packaging attr names",       tags: [] },
      { key: "pkg_attr_values",     name: "Pkg Attr Values",    icon: "📝", desc: "Packaging attr values",      tags: [] },
      { key: "item_categories",     name: "Item Categories",    icon: "🗂", desc: "Item category definitions",  tags: ["Core"] },
      { key: "uom_master",          name: "UOM Master",         icon: "📏", desc: "Units of measure",           tags: ["Core"] },
      { key: "hsn_master",          name: "HSN Master",         icon: "🏷️", desc: "GST HSN codes",              tags: ["Finance"] },
      { key: "color_master",        name: "Color Master",       icon: "🎨", desc: "Pantone + hex swatches",     tags: ["Core"] },
      { key: "size_master",         name: "Size Master",        icon: "📐", desc: "Size specs",                 tags: ["Active"] },
      { key: "fabric_type_master",  name: "Fabric Type Master", icon: "🔲", desc: "SJ, PIQ, FLC etc.",          tags: ["Active"] },
      { key: "tag_master",          name: "Tag Master",         icon: "🏷",  desc: "Classification tags",        tags: ["Core"] },
      { key: "item_change_log",     name: "Item Change Log",    icon: "📋", desc: "Audit trail",                tags: ["System"] },
      { key: "master_relations",    name: "Master Relations",   icon: "🔗", desc: "FK relationship config",     tags: ["System"] },
    ]
  },
  "1B": {
    key: "1B", label: "FILE 1B — Factory", short: "1B",
    icon: "🏭", color: "#1C3A2E", badge: "#2E5C47", accent: "#EBF5F0",
    sheets: [
      { key: "user_master",           name: "User Master",           icon: "👤", desc: "Team accounts + RBAC",      tags: ["Admin"] },
      { key: "department_master",     name: "Department Master",     icon: "🏢", desc: "Company departments",       tags: ["Active"] },
      { key: "designation_master",    name: "Designation Master",    icon: "📌", desc: "Job designations",          tags: ["Active"] },
      { key: "shift_master",          name: "Shift Master",          icon: "🕐", desc: "Work shifts",               tags: ["Active"] },
      { key: "customer_master",       name: "Customer Master",       icon: "🛍", desc: "Buyers & brands",           tags: ["Core"] },
      { key: "contractor_master",     name: "Contractor Master",     icon: "👷", desc: "Job work parties",          tags: ["Active"] },
      { key: "warehouse_master",      name: "Warehouse Master",      icon: "🏪", desc: "Storage locations",         tags: ["Active"] },
      { key: "storage_bin_master",    name: "Storage Bin Master",    icon: "📦", desc: "Bin locations",             tags: ["Active"] },
      { key: "factory_master",        name: "Factory Master",        icon: "🏭", desc: "Factory units",             tags: ["Core"] },
      { key: "machine_master",        name: "Machine Master",        icon: "⚙️", desc: "Knitting machines",         tags: ["Core"] },
      { key: "machine_category",      name: "Machine Category",      icon: "⚙️", desc: "Machine categories",        tags: [] },
      { key: "asset_master",          name: "Asset Master",          icon: "🏗", desc: "Fixed assets",              tags: ["Active"] },
      { key: "maintenance_schedule",  name: "Maintenance Schedule",  icon: "🔧", desc: "Service schedules",         tags: ["Active"] },
      { key: "spare_parts_master",    name: "Spare Parts Master",    icon: "🔩", desc: "Machinery spare parts",     tags: ["Active"] },
      { key: "process_master",        name: "Process Master",        icon: "🔄", desc: "Production processes",      tags: ["Core"] },
      { key: "work_center_master",    name: "Work Center Master",    icon: "🏗", desc: "Work centers",              tags: ["Active"] },
      { key: "jobwork_party_master",  name: "Jobwork Party Master",  icon: "🤝", desc: "Jobwork vendors",           tags: ["Active"] },
      { key: "item_supplier_rates",   name: "Item Supplier Rates",   icon: "💱", desc: "Multi-supplier pricing",    tags: ["Finance"] },
      { key: "presence",              name: "Presence",              icon: "🟢", desc: "Live user presence",        tags: ["System"] },
      { key: "notifications",         name: "Notifications",         icon: "🔔", desc: "System notifications",      tags: ["System"] },
      { key: "role_master",           name: "Role Master",           icon: "🔐", desc: "Role definitions",          tags: ["Admin"] },
      { key: "role_permissions",      name: "Role Permissions",      icon: "🔑", desc: "Permission matrix",         tags: ["Admin"] },
      { key: "notification_templates",name: "Notification Templates",icon: "📩", desc: "Notification templates",    tags: ["System"] },
    ]
  },
  "1C": {
    key: "1C", label: "FILE 1C — Finance", short: "1C",
    icon: "💰", color: "#1A3A4A", badge: "#2E5D72", accent: "#EDF3F6",
    sheets: [
      { key: "supplier_master_1c",  name: "Supplier Master",    icon: "🤝", desc: "PRIMARY supplier source",    tags: ["Core"] },
      { key: "payment_terms",       name: "Payment Terms",      icon: "📋", desc: "Net 30, advance etc.",       tags: ["Finance"] },
      { key: "tax_master",          name: "Tax Master",         icon: "🧾", desc: "GST rates",                 tags: ["Finance"] },
      { key: "bank_master",         name: "Bank Master",        icon: "🏦", desc: "Company banks",             tags: ["Finance"] },
      { key: "cost_center",         name: "Cost Center",        icon: "📊", desc: "Cost allocation centers",   tags: ["Finance"] },
      { key: "account_master",      name: "Account Master",     icon: "📒", desc: "Chart of accounts",         tags: ["Core"] },
    ]
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
//  MASTERS HOME — Card grid overview
// ═══════════════════════════════════════════════════════════════════════════════
function MastersHome({ M, A, uff, dff, onSelectSheet, sheetCounts }) {
  const totalSheets  = Object.values(FILES).reduce((a, f) => a + f.sheets.length, 0);
  const totalRecords = Object.values(FILES).reduce((a, f) => a + f.sheets.reduce((b, s) => b + (sheetCounts[s.key] || 0), 0), 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
      {/* KPI row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[["Total Sheets", totalSheets, "📋"], ["Total Records", totalRecords, "📊"], ["Files", 3, "🗂"]].map(([l, v, ic]) => (
          <div key={l} style={{ background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 8, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>{ic}</span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>{l}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: M.textA, fontFamily: dff }}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      {/* File sections */}
      {Object.values(FILES).map(file => (
        <div key={file.key} style={{ marginBottom: 28 }}>
          {/* File header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: "10px 14px", background: file.color, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 900, color: "#fff", fontFamily: uff }}>
              {file.icon} {file.label}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[["Sheets", file.sheets.length], ["Records", file.sheets.reduce((a, s) => a + (sheetCounts[s.key] || 0), 0)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700, fontFamily: uff }}>{l}:</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", fontFamily: dff }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {file.sheets.map(sheet => {
              const count = sheetCounts[sheet.key] || 0;
              return (
                <div key={sheet.key} className="card-wrap" style={{ position: "relative" }}>
                  {/* Add New pill */}
                  <button className="add-btn"
                    onClick={e => { e.stopPropagation(); onSelectSheet(file.key, sheet); }}
                    style={{ position: "absolute", top: -10, right: 10, zIndex: 10, background: A.a, border: "none", borderRadius: 5, padding: "3px 10px", fontSize: 9, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: uff, boxShadow: `0 2px 8px ${A.a}50` }}>
                    + Add
                  </button>
                  {/* Card */}
                  <div className="card-hover"
                    onClick={() => onSelectSheet(file.key, sheet)}
                    style={{ background: M.surfHigh, border: `1.5px solid ${M.divider}`, borderRadius: 9, padding: "14px 14px 12px", cursor: "pointer", transition: "all .15s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", height: "100%", boxSizing: "border-box" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = file.color; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = M.divider; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, background: file.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{sheet.icon}</div>
                      <div style={{ background: file.badge, color: "#fff", fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 20, fontFamily: dff }}>{count}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: M.textA, marginBottom: 3, lineHeight: 1.3, fontFamily: uff }}>{sheet.name}</div>
                    <div style={{ fontSize: 10, color: M.textD, marginBottom: 10, fontFamily: uff }}>{sheet.desc}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                      {sheet.tags.map(t => <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 3, background: M.surfMid, color: M.textC, textTransform: "uppercase", fontFamily: uff }}>{t}</span>)}
                    </div>
                    <div style={{ paddingTop: 9, borderTop: `1px solid ${M.bg}`, fontSize: 10, fontWeight: 800, color: A.a, fontFamily: uff }}>Open →</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  FILE SIDEBAR — Sheet navigation (visible when a sheet is selected)
// ═══════════════════════════════════════════════════════════════════════════════
function FileSidebar({ activeSheet, activeFileKey, expandedFile, setExpandedFile, onSelectSheet, onClose, M, A, uff, dff, sheetCounts }) {
  return (
    <div style={{ width: 260, background: M.surfMid, borderRight: `1px solid ${M.divider}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 14px", borderBottom: `1px solid ${M.divider}`, gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: M.textB, flex: 1, fontFamily: uff }}>All Masters</span>
        <button onClick={onClose}
          style={{ width: 24, height: 24, borderRadius: 5, background: M.surfHigh, border: `1px solid ${M.divider}`, cursor: "pointer", fontSize: 11, color: M.textC }}>✕</button>
      </div>

      {/* All 3 files */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {Object.values(FILES).map(file => {
          const isExpanded = expandedFile === file.key;
          return (
            <div key={file.key}>
              {/* File row */}
              <div onClick={() => setExpandedFile(isExpanded ? null : file.key)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", background: isExpanded ? file.color : M.surfHigh, borderBottom: `1px solid ${M.divider}`, transition: "background .15s", userSelect: "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: isExpanded ? "rgba(255,255,255,0.2)" : file.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{file.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: isExpanded ? "#fff" : M.textA, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: uff }}>{file.label}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: isExpanded ? "rgba(255,255,255,0.6)" : M.textD, fontFamily: dff }}>{file.sheets.length} sheets</div>
                </div>
                <div style={{ fontSize: 11, color: isExpanded ? "rgba(255,255,255,0.7)" : M.textD, transition: "transform .2s", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}>▾</div>
              </div>

              {/* Sheets list */}
              {isExpanded && (
                <div style={{ borderBottom: `2px solid ${M.divider}` }}>
                  {file.sheets.map(sheet => {
                    const isActive = activeFileKey === file.key && activeSheet?.key === sheet.key;
                    const count = sheetCounts[sheet.key] || 0;
                    return (
                      <div key={sheet.key} onClick={() => onSelectSheet(file.key, sheet)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px 7px 22px", cursor: "pointer", background: isActive ? A.al : "transparent", borderLeft: `3px solid ${isActive ? A.a : "transparent"}`, transition: "background .1s" }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = M.hoverBg; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? A.al : "transparent"; }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{sheet.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: isActive ? 900 : 700, color: isActive ? A.a : M.textB, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: uff }}>{sheet.name}</div>
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: isActive ? A.a : M.textD, fontFamily: dff, flexShrink: 0 }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${M.divider}`, background: M.surfHigh }}>
        <div style={{ fontSize: 10, color: M.textD, fontFamily: dff }}>
          {Object.values(FILES).reduce((a, f) => a + f.sheets.length, 0)} sheets ·{" "}
          {Object.values(FILES).reduce((a, f) => a + f.sheets.reduce((b, s) => b + (sheetCounts[s.key] || 0), 0), 0)} records
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN MASTERS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Masters({ M, A, cfg, fz, dff }) {
  const uff = uiFF(cfg.uiFont);

  // Navigation state
  const [activeSheet, setActiveSheet]   = useState(null);   // { fileKey, sheet } | null
  const [expandedFile, setExpandedFile] = useState("1A");

  // API state
  const [sheetCounts, setSheetCounts]     = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError]     = useState(null);

  // Fetch sheet counts on mount
  useEffect(() => {
    setCountsLoading(true);
    setCountsError(null);
    api.getMasterSheetCounts()
      .then(data => { if (data) setSheetCounts(data); })
      .catch(err => {
        console.error("getMasterSheetCounts:", err);
        setCountsError(err.message || "Failed to load sheet counts from API");
      })
      .finally(() => setCountsLoading(false));
  }, []);

  function handleSelectSheet(fileKey, sheet) {
    setActiveSheet({ fileKey, sheet });
    setExpandedFile(fileKey);
  }

  function handleCloseSidebar() {
    setActiveSheet(null);
  }

  const showSidebar = !!activeSheet;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: M.bg, fontFamily: uff }}>

      {/* ── CONTENT HEADER ── */}
      <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>
            {activeSheet ? `${FILES[activeSheet.fileKey].label} ›` : "Masters"} {activeSheet ? activeSheet.sheet.name : "Data Hub"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: M.textA, fontFamily: uff }}>
            {activeSheet ? activeSheet.sheet.name : "📋 Master Data Hub"}
          </div>
        </div>

        {activeSheet ? (
          <button onClick={handleCloseSidebar}
            style={{ padding: "6px 14px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontWeight: 800, color: M.textB, cursor: "pointer", fontFamily: uff }}>
            ← Back to Hub
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            {Object.values(FILES).map(f => (
              <button key={f.key} onClick={() => { setExpandedFile(f.key); handleSelectSheet(f.key, f.sheets[0]); }}
                style={{ padding: "6px 14px", background: f.accent, border: `1.5px solid ${f.badge}`, borderRadius: 7, fontSize: 11, fontWeight: 800, color: f.color, cursor: "pointer", fontFamily: uff }}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── API STATUS ── */}
      {countsError && (
        <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "10px 24px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#991b1b", fontFamily: uff }}>API Connection Failed</div>
            <div style={{ fontSize: 10, color: "#b91c1c", fontFamily: uff }}>{countsError}</div>
          </div>
          <button onClick={() => { setCountsError(null); setCountsLoading(true); api.getMasterSheetCounts().then(data => { if (data) setSheetCounts(data); setCountsError(null); }).catch(err => setCountsError(err.message)).finally(() => setCountsLoading(false)); }}
            style={{ padding: "6px 14px", background: "#dc2626", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: uff }}>
            Retry
          </button>
        </div>
      )}
      {countsLoading && !countsError && (
        <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: "8px 24px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12 }}>⏳</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: M.textC, fontFamily: uff }}>Loading sheet counts from Google Sheets...</span>
        </div>
      )}

      {/* ── BODY: SIDEBAR + CONTENT ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* File sidebar (visible when a sheet is selected) */}
        {showSidebar && (
          <FileSidebar
            activeSheet={activeSheet.sheet}
            activeFileKey={activeSheet.fileKey}
            expandedFile={expandedFile}
            setExpandedFile={setExpandedFile}
            onSelectSheet={handleSelectSheet}
            onClose={handleCloseSidebar}
            M={M} A={A} uff={uff} dff={dff}
            sheetCounts={sheetCounts}
          />
        )}

        {/* Main content */}
        {activeSheet
          ? <SheetWorkspace
              sheet={activeSheet.sheet}
              fileKey={activeSheet.fileKey}
              fileLabel={FILES[activeSheet.fileKey].label}
              M={M} A={A} uff={uff} dff={dff}
              sheetCounts={sheetCounts}
            />
          : <MastersHome
              M={M} A={A} uff={uff} dff={dff}
              onSelectSheet={handleSelectSheet}
              sheetCounts={sheetCounts}
            />
        }
      </div>

      {/* CSS */}
      <style>{`
        @keyframes slideR { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
        .card-hover:hover { transform: translateY(-2px) !important; }
        .add-btn { opacity: 0; transition: opacity 0.15s; }
        .card-wrap:hover .add-btn { opacity: 1; }
      `}</style>
    </div>
  );
}
