import { useState } from 'react';

// Trimmed data for the preview panels (not all 51 sheets — just enough to demo)
const PV_FILES = {
  "1A": {
    key: "1A", label: "FILE 1A — Items", short: "1A",
    icon: "📦", color: "#1A1A2E", badge: "#3B3B6E", accent: "#ECEEF8",
    sheets: [
      { key: "article_master",   name: "Article Master",  icon: "👕", desc: "Finished garments", tags: ["Core"] },
      { key: "rm_fabric",        name: "RM Fabric",       icon: "🧵", desc: "Knit fabrics",      tags: ["Active"] },
      { key: "trim_master",      name: "Trim Master",     icon: "🔗", desc: "Trims & accessories",tags: ["Core"] },
      { key: "color_master",     name: "Color Master",    icon: "🎨", desc: "Pantone swatches",   tags: ["Core"] },
    ]
  },
  "1B": {
    key: "1B", label: "FILE 1B — Factory", short: "1B",
    icon: "🏭", color: "#1C3A2E", badge: "#2E5C47", accent: "#EBF5F0",
    sheets: [
      { key: "customer_master",  name: "Customer Master", icon: "🛍", desc: "Buyers & brands",   tags: ["Core"] },
      { key: "machine_master",   name: "Machine Master",  icon: "⚙️", desc: "Knitting machines",  tags: ["Core"] },
      { key: "user_master",      name: "User Master",     icon: "👤", desc: "Team accounts",      tags: ["Admin"] },
    ]
  },
  "1C": {
    key: "1C", label: "FILE 1C — Finance", short: "1C",
    icon: "💰", color: "#1A3A4A", badge: "#2E5D72", accent: "#EDF3F6",
    sheets: [
      { key: "supplier_master",  name: "Supplier Master", icon: "🤝", desc: "Primary suppliers",  tags: ["Core"] },
      { key: "tax_master",       name: "Tax Master",      icon: "🧾", desc: "GST rates",           tags: ["Finance"] },
    ]
  }
};

const PV_NAV = [
  { id: "dashboard",   icon: "📈", lbl: "Dashboard" },
  { id: "masters",     icon: "🗂️", lbl: "Masters" },
  { id: "procurement", icon: "📦", lbl: "Procurement" },
  { id: "production",  icon: "🏭", lbl: "Production" },
  { id: "inventory",   icon: "🗄️", lbl: "Inventory" },
];

const ACC = "#E8690A";

// ─── Small reusable file-group row ───────────────────────────────────────────
function FileSideGroup({ file, expandedFile, setExpandedFile, activeSheet, onSelectSheet, compact }) {
  const isExp = expandedFile === file.key;
  return (
    <div>
      <div onClick={() => setExpandedFile(isExp ? null : file.key)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", cursor: "pointer",
          background: isExp ? file.color : "#fff", borderBottom: "1px solid #e5e7eb",
          transition: "background .15s", userSelect: "none" }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>{file.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: isExp ? "#fff" : "#111827",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {compact ? file.short : file.label}
          </div>
          <div style={{ fontSize: 8, color: isExp ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>
            {file.sheets.length} sheets
          </div>
        </div>
        <span style={{ fontSize: 9, color: isExp ? "rgba(255,255,255,0.7)" : "#9ca3af",
          transform: isExp ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block",
          transition: "transform .2s" }}>▾</span>
      </div>
      {isExp && (
        <div style={{ borderBottom: "2px solid #e5e7eb" }}>
          {file.sheets.map(sheet => {
            const isAct = activeSheet?.fileKey === file.key && activeSheet?.sheet?.key === sheet.key;
            return (
              <div key={sheet.key} onClick={() => onSelectSheet(file.key, sheet)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 18px",
                  cursor: "pointer", background: isAct ? "#FEF3EA" : "transparent",
                  borderLeft: `2px solid ${isAct ? ACC : "transparent"}`,
                  transition: "background .1s", whiteSpace: "nowrap" }}
                onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = "#f5f5f7"; }}
                onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = isAct ? "#FEF3EA" : "transparent"; }}>
                <span style={{ fontSize: 11, flexShrink: 0 }}>{sheet.icon}</span>
                <span style={{ fontSize: 9, fontWeight: isAct ? 900 : 700,
                  color: isAct ? ACC : "#374151", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sheet.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Card grid (shared between panels) ───────────────────────────────────────
function CardGrid({ onSelectSheet }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
      {Object.values(PV_FILES).map(file => (
        <div key={file.key} style={{ marginBottom: 12 }}>
          <div style={{ background: file.color, borderRadius: 6, padding: "6px 10px", marginBottom: 7,
            display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 12 }}>{file.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 900, color: "#fff" }}>{file.label}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            {file.sheets.map(sheet => (
              <div key={sheet.key} onClick={() => onSelectSheet(file.key, sheet)}
                style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 6,
                  padding: "8px 9px", cursor: "pointer", transition: "border-color .15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = file.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}>
                <div style={{ fontSize: 14, marginBottom: 3 }}>{sheet.icon}</div>
                <div style={{ fontSize: 8, fontWeight: 900, color: "#111827", lineHeight: 1.2 }}>{sheet.name}</div>
                <div style={{ fontSize: 7, color: "#9ca3af", marginTop: 2 }}>{sheet.desc}</div>
                <div style={{ marginTop: 5, fontSize: 7, fontWeight: 800, color: ACC }}>Open →</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BEFORE Panel ────────────────────────────────────────────────────────────
function BeforePanel() {
  const [activeSheet, setActiveSheet] = useState(null);
  const [expandedFile, setExpandedFile] = useState("1A");

  function selectSheet(fileKey, sheet) {
    setActiveSheet({ fileKey, sheet });
    setExpandedFile(fileKey);
  }

  const showSidebar = !!activeSheet;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "2px solid #f87171",
      borderRadius: 10, overflow: "hidden", background: "#f0f2f5", minWidth: 0 }}>

      {/* Label bar */}
      <div style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 900,
        padding: "5px 12px", letterSpacing: 0.8, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span>BEFORE</span>
        <span style={{ fontSize: 8, fontWeight: 700, opacity: 0.75 }}>Current behaviour — click a card to see</span>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* App sidebar — ALWAYS FULL WIDTH (never collapses) */}
        <div style={{ width: 110, background: "#fff", borderRight: "1px solid #e2e4e8",
          display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "6px 0", flex: 1 }}>
            <div style={{ padding: "3px 10px 5px", fontSize: 7, fontWeight: 900, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: 0.5 }}>MODULES</div>
            {PV_NAV.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px",
                background: m.id === "masters" ? "#FEF3EA" : "transparent",
                borderLeft: `3px solid ${m.id === "masters" ? ACC : "transparent"}` }}>
                <span style={{ fontSize: 11 }}>{m.icon}</span>
                <span style={{ fontSize: 8, fontWeight: m.id === "masters" ? 900 : 700,
                  color: m.id === "masters" ? ACC : "#374151" }}>{m.lbl}</span>
              </div>
            ))}
          </div>
          {/* Status indicator */}
          <div style={{ padding: "7px 10px", borderTop: "1px solid #f0f2f5" }}>
            <div style={{ fontSize: 7, color: "#9ca3af", fontWeight: 700 }}>Always 110px wide</div>
            <div style={{ fontSize: 7, color: "#dc2626", fontWeight: 800 }}>Never collapses ✗</div>
          </div>
        </div>

        {/* Masters area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Content header */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "7px 12px",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 7, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase" }}>
                {activeSheet ? `${PV_FILES[activeSheet.fileKey].label} ›` : "Masters"}{" "}
                {activeSheet ? activeSheet.sheet.name : "Data Hub"}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#111827" }}>
                {activeSheet ? activeSheet.sheet.name : "📋 Master Data Hub"}
              </div>
            </div>
            {activeSheet ? (
              <button onClick={() => setActiveSheet(null)}
                style={{ padding: "3px 8px", background: "#f4f5f7", border: "1px solid #e5e7eb",
                  borderRadius: 5, fontSize: 8, fontWeight: 800, color: "#374151", cursor: "pointer" }}>
                ← Back to Hub
              </button>
            ) : (
              <div style={{ display: "flex", gap: 4 }}>
                {Object.values(PV_FILES).map(f => (
                  <button key={f.key} onClick={() => selectSheet(f.key, f.sheets[0])}
                    style={{ padding: "3px 7px", background: f.accent, border: `1.5px solid ${f.badge}`,
                      borderRadius: 4, fontSize: 8, fontWeight: 800, color: f.color, cursor: "pointer" }}>
                    {f.icon} {f.short}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* File sidebar — ONLY shows when sheet is active */}
            {showSidebar && (
              <div style={{ width: 130, background: "#fafbfc", borderRight: "1px solid #e2e4e8",
                display: "flex", flexDirection: "column", flexShrink: 0 }}>
                <div style={{ padding: "6px 10px", borderBottom: "1px solid #e5e7eb",
                  display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 8, fontWeight: 900, color: "#374151", flex: 1 }}>All Masters</span>
                  <button onClick={() => setActiveSheet(null)}
                    style={{ width: 16, height: 16, borderRadius: 3, background: "#f4f5f7",
                      border: "1px solid #e5e7eb", cursor: "pointer", fontSize: 8, color: "#6b7280" }}>✕</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {Object.values(PV_FILES).map(file => (
                    <FileSideGroup key={file.key} file={file} expandedFile={expandedFile}
                      setExpandedFile={setExpandedFile} activeSheet={activeSheet}
                      onSelectSheet={selectSheet} compact />
                  ))}
                </div>
                <div style={{ padding: "6px 10px", borderTop: "1px solid #e5e7eb", background: "#fff" }}>
                  <div style={{ fontSize: 7, color: "#dc2626", fontWeight: 800 }}>Appears only on card click ✗</div>
                </div>
              </div>
            )}

            {/* Main area */}
            {activeSheet ? (
              <div style={{ flex: 1, padding: "10px 12px", overflowY: "auto", background: "#f0f2f5" }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{activeSheet.sheet.icon}</span>
                    <div>
                      <div style={{ fontSize: 7, color: "#9ca3af", fontWeight: 700 }}>
                        {PV_FILES[activeSheet.fileKey].label}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "#111827" }}>
                        {activeSheet.sheet.name}
                      </div>
                    </div>
                  </div>
                  {/* Mock table */}
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ background: "#f4f5f7", padding: "5px 8px", display: "grid",
                      gridTemplateColumns: "80px 1fr 60px", gap: 6, borderBottom: "1px solid #e5e7eb" }}>
                      {["Code", "Name", "Status"].map(h => (
                        <div key={h} style={{ fontSize: 7, fontWeight: 900, color: "#374151", textTransform: "uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {[["5249HP", "Heavy Polo Pique SS26", "Active"], ["5248TR", "Classic Tracksuit", "Active"]].map(([a, b, c], i) => (
                      <div key={i} style={{ padding: "5px 8px", display: "grid",
                        gridTemplateColumns: "80px 1fr 60px", gap: 6,
                        background: i % 2 === 0 ? "#fff" : "#fafbfc",
                        borderBottom: i === 0 ? "1px solid #f0f2f5" : "none" }}>
                        <div style={{ fontSize: 7, fontWeight: 700, color: ACC, fontFamily: "monospace" }}>{a}</div>
                        <div style={{ fontSize: 7, color: "#111827" }}>{b}</div>
                        <div style={{ fontSize: 7 }}>
                          <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 8,
                            padding: "1px 5px", fontWeight: 800 }}>{c}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, padding: "6px 0", borderTop: "1px solid #f0f2f5",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 7, color: "#9ca3af" }}>No search bar here ✗</div>
                    <div style={{ fontSize: 7, color: "#dc2626", fontWeight: 800 }}>No Add New button ✗</div>
                  </div>
                </div>
              </div>
            ) : (
              <CardGrid onSelectSheet={selectSheet} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AFTER Panel ─────────────────────────────────────────────────────────────
function AfterPanel() {
  const [activeSheet,   setActiveSheet]   = useState(null);
  const [fileSideOpen,  setFileSideOpen]  = useState(false);
  const [expandedFile,  setExpandedFile]  = useState("1A");
  const [mainCollapsed, setMainCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  function selectSheet(fileKey, sheet) {
    setActiveSheet({ fileKey, sheet });
    setExpandedFile(fileKey);
    setFileSideOpen(true);
    setMainCollapsed(true);  // ← KEY CHANGE: app sidebar auto-collapses
  }

  function closeSidebar() {
    setFileSideOpen(false);
    setActiveSheet(null);
    setMainCollapsed(false); // ← restores sidebar
  }

  const MAIN_W = mainCollapsed ? 36 : 110;
  const FILE_W = fileSideOpen  ? 130 : 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "2px solid #22c55e",
      borderRadius: 10, overflow: "hidden", background: "#f0f2f5", minWidth: 0 }}>

      {/* Label bar */}
      <div style={{ background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 900,
        padding: "5px 12px", letterSpacing: 0.8, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span>AFTER</span>
        <span style={{ fontSize: 8, fontWeight: 700, opacity: 0.75 }}>v2 upgraded — click a card to see the difference</span>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* App sidebar — ANIMATES TO ICON-ONLY when sheet selected */}
        <div style={{ width: MAIN_W, background: "#fff", borderRight: "1px solid #e2e4e8",
          display: "flex", flexDirection: "column", flexShrink: 0,
          transition: "width 0.25s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>
          <div style={{ padding: "6px 0", flex: 1 }}>
            {!mainCollapsed && (
              <div style={{ padding: "3px 10px 5px", fontSize: 7, fontWeight: 900, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>MODULES</div>
            )}
            {PV_NAV.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center",
                gap: mainCollapsed ? 0 : 7,
                padding: mainCollapsed ? "7px 0" : "6px 10px",
                justifyContent: mainCollapsed ? "center" : "flex-start",
                background: m.id === "masters" ? "#FEF3EA" : "transparent",
                borderLeft: mainCollapsed ? "none" : `3px solid ${m.id === "masters" ? ACC : "transparent"}` }}>
                <span style={{ fontSize: 11 }} title={m.lbl}>{m.icon}</span>
                {!mainCollapsed && (
                  <span style={{ fontSize: 8, fontWeight: m.id === "masters" ? 900 : 700,
                    color: m.id === "masters" ? ACC : "#374151", whiteSpace: "nowrap" }}>{m.lbl}</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: "7px 0", borderTop: "1px solid #f0f2f5", textAlign: "center" }}>
            <div style={{ fontSize: 7, color: "#9ca3af", textAlign: mainCollapsed ? "center" : "left",
              padding: mainCollapsed ? 0 : "0 10px", whiteSpace: "nowrap", overflow: "hidden" }}>
              {mainCollapsed ? "⟵" : "Auto-collapses ✓"}
            </div>
          </div>
        </div>

        {/* File sidebar — ANIMATED SLIDE IN (always available) */}
        <div style={{ width: FILE_W, background: "#fafbfc",
          borderRight: FILE_W > 0 ? "1px solid #e2e4e8" : "none",
          display: "flex", flexDirection: "column", flexShrink: 0,
          transition: "width 0.25s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>
          {FILE_W > 0 && (
            <>
              <div style={{ padding: "6px 10px", borderBottom: "1px solid #e5e7eb",
                display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: "#374151", flex: 1 }}>All Masters</span>
                <button onClick={closeSidebar}
                  style={{ width: 16, height: 16, borderRadius: 3, background: "#f4f5f7",
                    border: "1px solid #e5e7eb", cursor: "pointer", fontSize: 8, color: "#6b7280" }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {Object.values(PV_FILES).map(file => (
                  <FileSideGroup key={file.key} file={file} expandedFile={expandedFile}
                    setExpandedFile={setExpandedFile} activeSheet={activeSheet}
                    onSelectSheet={selectSheet} compact />
                ))}
              </div>
              <div style={{ padding: "6px 10px", borderTop: "1px solid #e5e7eb", background: "#fff" }}>
                <div style={{ fontSize: 7, color: "#16a34a", fontWeight: 800, whiteSpace: "nowrap" }}>Slides in on selection ✓</div>
              </div>
            </>
          )}
        </div>

        {/* Masters content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Content header — HAS SEARCH BAR */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "7px 12px",
            display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 7, fontWeight: 900, color: "#9ca3af", textTransform: "uppercase" }}>
                {activeSheet ? `${PV_FILES[activeSheet.fileKey].label} ›` : "Masters"}{" "}
                {activeSheet ? activeSheet.sheet.name : "Data Hub"}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#111827" }}>
                {activeSheet ? activeSheet.sheet.name : "📋 Master Data Hub"}
              </div>
            </div>
            {/* Search — always present */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
                fontSize: 8, color: "#9ca3af" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search masters…"
                style={{ padding: "3px 7px 3px 18px", border: "1px solid #e5e7eb", borderRadius: 5,
                  fontSize: 8, width: 100, outline: "none", color: "#374151" }} />
            </div>
            {!activeSheet && (
              <div style={{ display: "flex", gap: 4 }}>
                {Object.values(PV_FILES).map(f => (
                  <button key={f.key}
                    onClick={() => { setExpandedFile(f.key); setFileSideOpen(true); setMainCollapsed(true); }}
                    style={{ padding: "3px 7px", background: f.accent, border: `1.5px solid ${f.badge}`,
                      borderRadius: 4, fontSize: 8, fontWeight: 800, color: f.color, cursor: "pointer" }}>
                    {f.icon} {f.short}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          {activeSheet ? (
            <div style={{ flex: 1, padding: "10px 12px", overflowY: "auto", background: "#f0f2f5" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 12px" }}>
                {/* Sheet toolbar */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                  paddingBottom: 8, borderBottom: "1px solid #f0f2f5" }}>
                  <span style={{ fontSize: 14 }}>{activeSheet.sheet.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 7, color: "#9ca3af" }}>
                      {PV_FILES[activeSheet.fileKey].label}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: "#111827" }}>
                      {activeSheet.sheet.name}
                    </div>
                  </div>
                  <button style={{ padding: "3px 8px", background: "#f4f5f7", border: "1px solid #e5e7eb",
                    borderRadius: 4, fontSize: 8, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
                    📤 Export
                  </button>
                  <button style={{ padding: "3px 9px", background: ACC, border: "none",
                    borderRadius: 4, fontSize: 8, fontWeight: 900, color: "#fff", cursor: "pointer" }}>
                    + Add New
                  </button>
                </div>
                {/* Mock table */}
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ background: "#f4f5f7", padding: "5px 8px", display: "grid",
                    gridTemplateColumns: "80px 1fr 60px 50px", gap: 6, borderBottom: "1px solid #e5e7eb" }}>
                    {["Code", "Name", "Status", ""].map(h => (
                      <div key={h} style={{ fontSize: 7, fontWeight: 900, color: "#374151", textTransform: "uppercase" }}>{h}</div>
                    ))}
                  </div>
                  {[["5249HP", "Heavy Polo Pique SS26", "Active"], ["5248TR", "Classic Tracksuit", "Active"]].map(([a, b, c], i) => (
                    <div key={i} style={{ padding: "5px 8px", display: "grid",
                      gridTemplateColumns: "80px 1fr 60px 50px", gap: 6,
                      background: i % 2 === 0 ? "#fff" : "#fafbfc",
                      borderBottom: i === 0 ? "1px solid #f0f2f5" : "none", alignItems: "center" }}>
                      <div style={{ fontSize: 7, fontWeight: 700, color: ACC, fontFamily: "monospace" }}>{a}</div>
                      <div style={{ fontSize: 7, color: "#111827" }}>{b}</div>
                      <div style={{ fontSize: 7 }}>
                        <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 8,
                          padding: "1px 5px", fontWeight: 800 }}>{c}</span>
                      </div>
                      <button style={{ fontSize: 7, fontWeight: 700, color: ACC, background: "#FEF3EA",
                        border: "none", borderRadius: 3, padding: "2px 6px", cursor: "pointer" }}>Edit</button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 7, color: "#16a34a", fontWeight: 800 }}>
                  ✓ Search bar in header · ✓ Add New button · ✓ Edit per row
                </div>
              </div>
            </div>
          ) : (
            <CardGrid onSelectSheet={selectSheet} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHANGE LIST ─────────────────────────────────────────────────────────────
const CHANGES = [
  { icon: "⟵", label: "App sidebar auto-collapses to icon-only when a sheet is opened",       col: "#22c55e" },
  { icon: "▶",  label: "File sidebar slides in (0 → 260px animated) and stays visible",        col: "#22c55e" },
  { icon: "🔍", label: "Global search bar always present in the Masters content header",        col: "#22c55e" },
  { icon: "+",  label: "Add New button + Export in sheet toolbar; Edit button per row",         col: "#22c55e" },
  { icon: "✕",  label: "Closing file sidebar restores app sidebar and returns to Hub",         col: "#22c55e" },
  { icon: "📋", label: "sheetName field added per sheet for real API calls",                    col: "#60a5fa" },
];

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function MastersUpgradePreview({ onConfirm, onCancel, M, A, uff }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 2000,
      display: "flex", flexDirection: "column", padding: "20px", fontFamily: uff || "sans-serif" }}>

      {/* ── Title row ── */}
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 14, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Masters Module — Upgrade Preview</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
            Interact with both panels to see the behaviour difference, then confirm or cancel below.
          </div>
        </div>
        <button onClick={onCancel}
          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
      </div>

      {/* ── Two interactive panels ── */}
      <div style={{ flex: 1, display: "flex", gap: 14, overflow: "hidden", minHeight: 0 }}>
        <BeforePanel />
        <AfterPanel />
      </div>

      {/* ── Changes + Confirm row ── */}
      <div style={{ marginTop: 14, background: "rgba(255,255,255,0.07)", borderRadius: 10,
        padding: "13px 18px", display: "flex", alignItems: "flex-start", gap: 20, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#fff", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            What will be implemented:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 20px" }}>
            {CHANGES.map(c => (
              <div key={c.label} style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                <span style={{ fontSize: 10, color: c.col, fontWeight: 900, flexShrink: 0 }}>{c.icon}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexShrink: 0, alignSelf: "center" }}>
          <button onClick={onCancel}
            style={{ padding: "8px 18px", background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, fontSize: 11,
              fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: uff }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ padding: "8px 22px", background: "#16a34a", border: "none", borderRadius: 7,
              fontSize: 11, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: uff,
              boxShadow: "0 2px 12px rgba(22,163,74,0.5)" }}>
            ✅ Confirm — Implement Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
