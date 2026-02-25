import { useState } from "react";

const ACC = "#E8690A";
const FONT = "'Nunito Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const MASTERS = {
  "FILE 1A — Items": {
    icon: "📦", color: "#1A1A2E", badge: "#3B3B6E", accentLight: "#ECEEF8",
    sheets: [
      { name: "Article Master", icon: "👕", count: 24, desc: "Finished garments", tags: ["Active", "Core"] },
      { name: "RM Fabric", icon: "🧵", count: 18, desc: "Knit fabrics", tags: ["Active"] },
      { name: "RM Yarn", icon: "🪢", count: 12, desc: "Yarn inventory", tags: ["Active"] },
      { name: "Trim Master", icon: "🔗", count: 66, desc: "All trims & accessories", tags: ["Active", "Core"] },
      { name: "Consumable Master", icon: "🧪", count: 31, desc: "Dyes, chemicals", tags: ["Active"] },
      { name: "Packaging Master", icon: "📦", count: 15, desc: "Poly bags, cartons", tags: ["Active"] },
      { name: "Color Master", icon: "🎨", count: 87, desc: "Pantone + hex swatches", tags: ["Core"] },
      { name: "HSN Master", icon: "🏷️", count: 22, desc: "GST HSN codes", tags: ["Finance"] },
      { name: "UOM Master", icon: "📏", count: 9, desc: "Units of measure", tags: ["Core"] },
      { name: "Size Master", icon: "📐", count: 14, desc: "Size specs", tags: ["Active"] },
      { name: "Fabric Type Master", icon: "🔲", count: 11, desc: "SJ, PIQ, FLC etc.", tags: ["Active"] },
      { name: "Tag Master", icon: "🏷", count: 28, desc: "Item classification tags", tags: ["Core"] },
    ]
  },
  "FILE 1B — Factory": {
    icon: "🏭", color: "#2C3E50", badge: "#4A6278", accentLight: "#EEF2F5",
    sheets: [
      { name: "User Master", icon: "👤", count: 8, desc: "Team accounts + RBAC", tags: ["Admin"] },
      { name: "Role Master", icon: "🔐", count: 5, desc: "Permission matrix", tags: ["Admin"] },
      { name: "Department Master", icon: "🏢", count: 6, desc: "Company departments", tags: ["Active"] },
      { name: "Machine Master", icon: "⚙️", count: 12, desc: "Knitting machines", tags: ["Active", "Core"] },
      { name: "Supplier Master", icon: "🤝", count: 14, desc: "All vendors (ref)", tags: ["Active"] },
      { name: "Item Supplier Rates", icon: "💱", count: 47, desc: "Multi-supplier pricing", tags: ["Active", "Finance"] },
      { name: "Warehouse Master", icon: "🏪", count: 3, desc: "Storage locations", tags: ["Active"] },
      { name: "Contractor Master", icon: "👷", count: 9, desc: "Job work parties", tags: ["Active"] },
      { name: "Process Master", icon: "🔄", count: 7, desc: "Production processes", tags: ["Core"] },
    ]
  },
  "FILE 1C — Finance": {
    icon: "💰", color: "#1A3A4A", badge: "#2E5D72", accentLight: "#EDF3F6",
    sheets: [
      { name: "Supplier Master", icon: "🤝", count: 14, desc: "PRIMARY supplier source", tags: ["Core", "Finance"] },
      { name: "Payment Terms", icon: "📋", count: 6, desc: "Net 30, advance etc.", tags: ["Finance"] },
      { name: "Tax Master", icon: "🧾", count: 4, desc: "GST rates", tags: ["Finance"] },
      { name: "Bank Master", icon: "🏦", count: 3, desc: "Company banks", tags: ["Finance", "Admin"] },
      { name: "Cost Center", icon: "📊", count: 5, desc: "Cost allocation centers", tags: ["Finance"] },
      { name: "Account Master", icon: "📒", count: 18, desc: "Chart of accounts", tags: ["Finance", "Core"] },
    ]
  }
};

// Sample table data for detail view
const SAMPLE_DATA = {
  "Article Master": [
    { code: "5249HP", name: "Heavy Polo Pique SS26", category: "Tops-Polo", status: "Active", gsm: 240, updated: "22 Feb 2026" },
    { code: "5248TR", name: "Classic Tracksuit Bottom AW25", category: "Bottoms", status: "Active", gsm: 320, updated: "20 Feb 2026" },
    { code: "5250SW", name: "French Terry Sweatshirt", category: "Sweatshirt", status: "Development", gsm: 280, updated: "18 Feb 2026" },
  ],
  "RM Fabric": [
    { code: "RM-FAB-001", name: "Single Jersey 180gsm White Kora", category: "SJ", status: "Active", gsm: 180, updated: "21 Feb 2026" },
    { code: "RM-FAB-002", name: "Pique 220gsm Navy Finished", category: "PIQ", status: "Active", gsm: 220, updated: "19 Feb 2026" },
    { code: "RM-FAB-003", name: "French Terry 300gsm Melange Kora", category: "FTC", status: "Active", gsm: 300, updated: "15 Feb 2026" },
  ],
  "Supplier Master": [
    { code: "SUP-001", name: "Coats India Pvt Ltd", category: "Thread", status: "Active", gsm: "-", updated: "20 Feb 2026" },
    { code: "SUP-002", name: "Vardhman Textiles Ltd", category: "Fabric", status: "Active", gsm: "-", updated: "18 Feb 2026" },
    { code: "SUP-003", name: "YKK India Pvt Ltd", category: "Zipper", status: "Active", gsm: "-", updated: "15 Feb 2026" },
  ],
};

const DEFAULT_DATA = [
  { code: "—", name: "No records yet", category: "—", status: "—", gsm: "—", updated: "—" },
];

const statusColors = {
  Active: { bg: "#d1fae5", color: "#065f46" },
  Development: { bg: "#fef3c7", color: "#92400e" },
  Inactive: { bg: "#fee2e2", color: "#991b1b" },
  "—": { bg: "#f3f4f6", color: "#9ca3af" },
};

// ── DETAIL VIEW ───────────────────────────────────────────────────────────────
function DetailView({ sheet, allSheets, fileColor, fileBadge, fileName, onClose, onSelectSheet }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const rows = SAMPLE_DATA[sheet.name] || DEFAULT_DATA;
  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "stretch" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f0f2f5", animation: "slideIn 0.2s ease" }}>

        {/* LEFT SIDEBAR — all sheets of this file */}
        <div style={{ width: 240, background: "#fff", borderRight: "1px solid #e2e4e8", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Sidebar header */}
          <div style={{ background: fileColor, padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.6)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Masters</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{fileName}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{allSheets.length} sheets</div>
          </div>

          {/* Sheets list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {allSheets.map(s => {
              const isActive = s.name === sheet.name;
              return (
                <div key={s.name} onClick={() => onSelectSheet(s)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", cursor: "pointer", background: isActive ? "#FEF3EA" : "transparent", borderLeft: `3px solid ${isActive ? ACC : "transparent"}`, transition: "all 0.1s" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: isActive ? 900 : 700, color: isActive ? ACC : "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, fontFamily: MONO }}>{s.count} records</div>
                  </div>
                  {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: ACC, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top bar */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 24 }}>{sheet.icon}</span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: "#9ca3af", letterSpacing: 0.5, textTransform: "uppercase" }}>Masters › {fileName}</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#111827" }}>{sheet.name}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: MONO, fontWeight: 700 }}>{rows.length} records</div>
              <button onClick={() => setShowAddForm(true)}
                style={{ padding: "8px 18px", background: ACC, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
                + Add New
              </button>
              <button onClick={onClose}
                style={{ padding: "8px 14px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>
                ✕ Close
              </button>
            </div>
          </div>

          {/* Controls */}
          <div style={{ background: "#fff", borderBottom: "1px solid #f0f2f5", padding: "10px 24px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 12 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${sheet.name}...`}
                style={{ padding: "7px 12px 7px 30px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: FONT, width: 240, outline: "none", color: "#111827" }} />
            </div>
            <button style={{ padding: "7px 12px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>⚙ Filter</button>
            <button style={{ padding: "7px 12px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>↕ Sort</button>
            <button style={{ padding: "7px 12px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>📥 Import</button>
            <button style={{ padding: "7px 12px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>📊 Export</button>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 120px 90px 80px 120px 80px", background: "#f4f5f7", borderBottom: "1px solid #e5e7eb", padding: "9px 16px", gap: 8 }}>
                {["Code", "Name", "Category", "Status", "GSM", "Updated", "Actions"].map(h => (
                  <div key={h} style={{ fontSize: 9, fontWeight: 900, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                ))}
              </div>
              {/* Rows */}
              {filtered.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr 120px 90px 80px 120px 80px", padding: "10px 16px", borderBottom: i < filtered.length - 1 ? "1px solid #f0f2f5" : "none", background: i % 2 === 0 ? "#fff" : "#fafbfc", gap: 8, alignItems: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", fontFamily: MONO }}>{row.code}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{row.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{row.category}</div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: (statusColors[row.status] || statusColors["—"]).bg, color: (statusColors[row.status] || statusColors["—"]).color }}>
                      {row.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", fontFamily: MONO }}>{row.gsm}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{row.updated}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={{ fontSize: 10, fontWeight: 700, color: ACC, background: "#FEF3EA", border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: FONT }}>Edit</button>
                    <button style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", background: "#f4f5f7", border: "none", borderRadius: 4, padding: "3px 6px", cursor: "pointer", fontFamily: FONT }}>⋯</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Status bar */}
            <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 11, color: "#9ca3af" }}>
              <span>RECORDS <span style={{ fontFamily: MONO, color: "#374151", fontWeight: 700 }}>{filtered.length}</span></span>
              <span>TOTAL <span style={{ fontFamily: MONO, color: "#374151", fontWeight: 700 }}>{rows.length}</span></span>
            </div>
          </div>
        </div>

        {/* ADD NEW FORM PANEL (slide in from right) */}
        {showAddForm && (
          <div style={{ width: 380, background: "#fff", borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>New Record</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>Add {sheet.name}</div>
              </div>
              <button onClick={() => setShowAddForm(false)} style={{ background: "#f4f5f7", border: "none", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 14, color: "#374151" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {[["Code", "Auto-generated", true], ["Name / Description", "Enter full name", false], ["Category", "Select category", false], ["Status", "Active", false], ["HSN Code", "FK → HSN Master", false], ["Supplier Code", "FK → Supplier Master", false], ["Remarks", "Optional notes", false]].map(([label, placeholder, isAuto]) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 9, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>
                    {label} {isAuto && <span style={{ color: "#9ca3af", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>(auto)</span>}
                  </label>
                  <input placeholder={placeholder} disabled={isAuto}
                    style={{ width: "100%", padding: "9px 12px", border: `1px solid ${isAuto ? "#f0f2f5" : "#d1d5db"}`, borderRadius: 6, fontSize: 12, fontFamily: FONT, background: isAuto ? "#f9fafb" : "#fff", color: isAuto ? "#9ca3af" : "#111827", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10 }}>
              <button style={{ flex: 1, padding: "10px", background: ACC, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: FONT }}>Save Record</button>
              <button onClick={() => setShowAddForm(false)} style={{ padding: "10px 16px", background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN MASTERS PAGE ─────────────────────────────────────────────────────────
export default function MastersPage() {
  const [collapsed, setCollapsed] = useState({});
  const [hovered, setHovered] = useState(null);
  const [detailView, setDetailView] = useState(null); // { sheet, group }
  const [search, setSearch] = useState("");

  const toggleCollapse = (groupKey) => {
    setCollapsed(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const openDetail = (sheet, groupKey) => {
    setDetailView({ sheet, groupKey });
  };

  const totalRecords = Object.values(MASTERS).flatMap(g => g.sheets).reduce((a, s) => a + s.count, 0);
  const totalSheets = Object.values(MASTERS).flatMap(g => g.sheets).length;

  return (
    <div style={{ fontFamily: FONT, background: "#f0f2f5", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800;6..12,900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .card-hover:hover { border-color: ${ACC} !important; box-shadow: 0 6px 20px rgba(232,105,10,0.14) !important; transform: translateY(-2px) !important; }
        .add-btn { opacity: 0; transition: opacity 0.15s; }
        .card-wrap:hover .add-btn { opacity: 1; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e4e8", padding: "16px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "#9ca3af", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>Home › Masters</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>📋 Master Data Hub</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* KPI pills */}
            <div style={{ display: "flex", gap: 8 }}>
              {[["📄 Sheets", totalSheets], ["🗂 Records", totalRecords], ["📁 Files", 3]].map(([l, v]) => (
                <div key={l} style={{ background: "#f4f5f7", border: "1px solid #e5e7eb", borderRadius: 7, padding: "6px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", fontFamily: MONO }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ width: 1, height: 36, background: "#e5e7eb" }} />
            <button style={{ padding: "8px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>📥 Import</button>
            <button style={{ padding: "8px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: FONT }}>📊 Export All</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: 14, position: "relative", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all masters..." style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontFamily: FONT, background: "#fff", color: "#111827", outline: "none", boxSizing: "border-box" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>✕</button>}
        </div>
      </div>

      {/* ── GROUPS ── */}
      <div style={{ padding: "24px 28px" }}>
        {Object.entries(MASTERS).map(([groupKey, { icon, color, badge, accentLight, sheets }]) => {
          const isCollapsed = collapsed[groupKey];
          const filteredSheets = search ? sheets.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase())) : sheets;
          if (search && filteredSheets.length === 0) return null;

          return (
            <div key={groupKey} style={{ marginBottom: 28 }}>
              {/* ── GROUP HEADER (clickable to collapse) ── */}
              <div onClick={() => toggleCollapse(groupKey)}
                style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isCollapsed ? 0 : 14, cursor: "pointer", userSelect: "none", padding: "10px 14px", background: isCollapsed ? color : "#fff", border: `1px solid ${isCollapsed ? color : "#e5e7eb"}`, borderRadius: isCollapsed ? 10 : "10px 10px 0 0", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

                {/* File badge */}
                <div style={{ background: color, color: "#fff", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span>{icon}</span> <span>{groupKey}</span>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 16, flex: 1 }}>
                  {[["Sheets", sheets.length], ["Records", sheets.reduce((a, s) => a + s.count, 0)]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", align: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: isCollapsed ? "rgba(255,255,255,0.7)" : "#9ca3af", fontWeight: 700 }}>{l}:</span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: isCollapsed ? "#fff" : "#374151", fontFamily: MONO }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Expand/collapse indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isCollapsed ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>
                    {isCollapsed ? "Click to expand" : "Click to collapse"}
                  </span>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: isCollapsed ? "rgba(255,255,255,0.15)" : "#f4f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: isCollapsed ? "#fff" : "#374151", transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
                    ▾
                  </div>
                </div>
              </div>

              {/* ── CARDS GRID ── */}
              {!isCollapsed && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "16px", animation: "fadeIn 0.2s ease" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {filteredSheets.map((s) => {
                      const cardKey = groupKey + s.name;
                      return (
                        <div key={s.name} className="card-wrap"
                          style={{ position: "relative", borderRadius: 9, overflow: "visible" }}>

                          {/* ── ADD NEW BUTTON (always visible on top of card) ── */}
                          <button className="add-btn"
                            onClick={(e) => { e.stopPropagation(); openDetail({ ...s, _openAdd: true }, groupKey); }}
                            style={{ position: "absolute", top: -11, right: 10, zIndex: 10, background: ACC, border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 10, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(232,105,10,0.3)" }}>
                            + Add New
                          </button>

                          {/* ── CARD ── */}
                          <div className="card-hover"
                            onClick={() => openDetail(s, groupKey)}
                            style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "14px 14px 12px", cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", height: "100%", boxSizing: "border-box" }}>

                            {/* Card top row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                              <div style={{ width: 38, height: 38, background: accentLight, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                                {s.icon}
                              </div>
                              <div style={{ background: badge, color: "#fff", fontSize: 11, fontWeight: 900, padding: "3px 9px", borderRadius: 20, fontFamily: MONO }}>
                                {s.count}
                              </div>
                            </div>

                            {/* Name */}
                            <div style={{ fontSize: 12, fontWeight: 900, color: "#111827", marginBottom: 4, lineHeight: 1.3 }}>{s.name}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginBottom: 10 }}>{s.desc}</div>

                            {/* Tags */}
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                              {s.tags.map(t => (
                                <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#f4f5f7", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.3 }}>{t}</span>
                              ))}
                            </div>

                            {/* Footer */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid #f0f2f5" }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: ACC }}>Open →</span>
                              <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: "auto" }}>Updated today</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DETAIL VIEW MODAL ── */}
      {detailView && (
        <DetailView
          sheet={detailView.sheet}
          allSheets={MASTERS[detailView.groupKey].sheets}
          fileColor={MASTERS[detailView.groupKey].color}
          fileBadge={MASTERS[detailView.groupKey].badge}
          fileName={detailView.groupKey}
          onClose={() => setDetailView(null)}
          onSelectSheet={(s) => setDetailView(prev => ({ ...prev, sheet: s }))}
        />
      )}

      {/* ── STATUS BAR ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#f0f2f5", borderTop: "1px solid #e5e7eb", padding: "6px 28px", display: "flex", gap: 20, fontSize: 11, color: "#9ca3af", fontFamily: MONO }}>
        <span>CC ERP</span>
        <span>·</span>
        <span>FILE-MASTERS</span>
        <span>·</span>
        <span>SHEETS <span style={{ color: "#374151", fontWeight: 700 }}>{totalSheets}</span></span>
        <span>·</span>
        <span>RECORDS <span style={{ color: "#374151", fontWeight: 700 }}>{totalRecords}</span></span>
        <span style={{ marginLeft: "auto" }}>{new Date().toLocaleDateString("en-IN")}</span>
      </div>
    </div>
  );
}
