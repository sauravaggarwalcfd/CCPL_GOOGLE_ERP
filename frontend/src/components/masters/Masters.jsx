import { useState, useEffect } from 'react';
import { uiFF } from '../../constants/fonts';
import { SCHEMA_MAP } from '../../constants/masterSchemas';
import api from '../../services/api';

// ── Mapping: raw sheet headers ↔ schema keys ──
// Backend returns data keyed by raw sheet header strings (e.g. "🔑 Article Code").
// Frontend schema defines header→key mappings. These helpers convert between them.

function mapRawToSchema(rawRow, schema) {
  const mapped = {};
  for (const field of schema) {
    if (field.header && rawRow[field.header] !== undefined) {
      mapped[field.key] = rawRow[field.header];
    }
  }
  return mapped;
}

function mapSchemaToRaw(formData, schema) {
  const raw = {};
  for (const field of schema) {
    if (field.header && formData[field.key] !== undefined && formData[field.key] !== '') {
      raw[field.header] = formData[field.key];
    }
  }
  return raw;
}

// ── Master sheet structure (defines what exists in each file) ──
const MASTER_GROUPS = {
  "FILE 1A — Items": {
    icon: "📦", color: "#1A1A2E", badge: "#3B3B6E", accentLight: "#ECEEF8",
    sheets: [
      { key: "article_master",      name: "Article Master",      icon: "👕", desc: "Finished garments",         tags: ["Active", "Core"] },
      { key: "rm_fabric",           name: "RM Fabric",           icon: "🧵", desc: "Knit fabrics",              tags: ["Active"] },
      { key: "rm_yarn",             name: "RM Yarn",             icon: "🪢", desc: "Yarn inventory",            tags: ["Active"] },
      { key: "rm_woven",            name: "RM Woven",            icon: "🪡", desc: "Woven & interlining",       tags: ["Active"] },
      { key: "trim_master",         name: "Trim Master",         icon: "🔗", desc: "All trims & accessories",   tags: ["Active", "Core"] },
      { key: "consumable_master",   name: "Consumable Master",   icon: "🧪", desc: "Dyes, chemicals",           tags: ["Active"] },
      { key: "packaging_master",    name: "Packaging Master",    icon: "📦", desc: "Poly bags, cartons",        tags: ["Active"] },
      { key: "color_master",        name: "Color Master",        icon: "🎨", desc: "Pantone + hex swatches",    tags: ["Core"] },
      { key: "hsn_master",          name: "HSN Master",          icon: "🏷️", desc: "GST HSN codes",             tags: ["Finance"] },
      { key: "uom_master",          name: "UOM Master",          icon: "📏", desc: "Units of measure",          tags: ["Core"] },
      { key: "size_master",         name: "Size Master",         icon: "📐", desc: "Size specs",                tags: ["Active"] },
      { key: "fabric_type_master",  name: "Fabric Type Master",  icon: "🔲", desc: "SJ, PIQ, FLC etc.",         tags: ["Active"] },
      { key: "tag_master",          name: "Tag Master",          icon: "🏷",  desc: "Item classification tags",  tags: ["Core"] },
      { key: "item_categories",     name: "Item Categories",     icon: "📂", desc: "3-level category tree",     tags: ["Core"] },
    ]
  },
  "FILE 1B — Factory": {
    icon: "🏭", color: "#2C3E50", badge: "#4A6278", accentLight: "#EEF2F5",
    sheets: [
      { key: "user_master",          name: "User Master",          icon: "👤", desc: "Team accounts + RBAC",       tags: ["Admin"] },
      { key: "role_master",          name: "Role Master",          icon: "🔐", desc: "Permission matrix",          tags: ["Admin"] },
      { key: "department_master",    name: "Department Master",    icon: "🏢", desc: "Company departments",        tags: ["Active"] },
      { key: "designation_master",   name: "Designation Master",   icon: "🪪", desc: "Job titles & levels",        tags: ["Admin"] },
      { key: "shift_master",         name: "Shift Master",         icon: "🕐", desc: "Factory shifts",             tags: ["Active"] },
      { key: "machine_master",       name: "Machine Master",       icon: "⚙️", desc: "Knitting machines",          tags: ["Active", "Core"] },
      { key: "machine_category",     name: "Machine Category",     icon: "🏷",  desc: "Machine types",             tags: ["Core"] },
      { key: "supplier_master_1b",   name: "Supplier Master",      icon: "🤝", desc: "All vendors (ref)",          tags: ["Active"] },
      { key: "customer_master",      name: "Customer Master",      icon: "🧑‍💼", desc: "Buyers & customers",        tags: ["Active", "Core"] },
      { key: "item_supplier_rates",  name: "Item Supplier Rates",  icon: "💱", desc: "Multi-supplier pricing",     tags: ["Active", "Finance"] },
      { key: "warehouse_master",     name: "Warehouse Master",     icon: "🏪", desc: "Storage locations",          tags: ["Active"] },
      { key: "storage_bin_master",   name: "Storage Bin Master",   icon: "📍", desc: "Bin locations",              tags: ["Active"] },
      { key: "factory_master",       name: "Factory Master",       icon: "🏗️", desc: "Factory units",              tags: ["Active", "Core"] },
      { key: "contractor_master",    name: "Contractor Master",    icon: "👷", desc: "Job work parties",           tags: ["Active"] },
      { key: "process_master",       name: "Process Master",       icon: "🔄", desc: "Production processes",       tags: ["Core"] },
      { key: "asset_master",         name: "Asset Master",         icon: "🏗",  desc: "Fixed assets",              tags: ["Active", "Finance"] },
      { key: "maintenance_schedule", name: "Maintenance Schedule", icon: "🔧", desc: "Machine maintenance",       tags: ["Active"] },
      { key: "spare_parts_master",   name: "Spare Parts Master",   icon: "🔩", desc: "Spare parts inventory",     tags: ["Active"] },
      { key: "work_center_master",   name: "Work Center Master",   icon: "🏭", desc: "Work centers",              tags: ["Core"] },
      { key: "jobwork_party_master", name: "Jobwork Party Master", icon: "🤝", desc: "Job work parties",          tags: ["Active"] },
    ]
  },
  "FILE 1C — Finance": {
    icon: "💰", color: "#1A3A4A", badge: "#2E5D72", accentLight: "#EDF3F6",
    sheets: [
      { key: "supplier_master_1c",  name: "Supplier Master",  icon: "🤝", desc: "PRIMARY supplier source",   tags: ["Core", "Finance"] },
      { key: "payment_terms",       name: "Payment Terms",    icon: "📋", desc: "Net 30, advance etc.",       tags: ["Finance"] },
      { key: "tax_master",          name: "Tax Master",       icon: "🧾", desc: "GST rates",                  tags: ["Finance"] },
      { key: "bank_master",         name: "Bank Master",      icon: "🏦", desc: "Company banks",              tags: ["Finance", "Admin"] },
      { key: "cost_center",         name: "Cost Center",      icon: "📊", desc: "Cost allocation centers",    tags: ["Finance"] },
      { key: "account_master",      name: "Account Master",   icon: "📒", desc: "Chart of accounts",          tags: ["Finance", "Core"] },
    ]
  }
};

// ── Generic fallback schema ──
const FALLBACK_SCHEMA = [
  { key: "code",     label: "Code",     w: "140px", mono: true, auto: true },
  { key: "name",     label: "Name",     w: "1fr",   required: true },
  { key: "category", label: "Category", w: "120px" },
  { key: "status",   label: "Status",   w: "90px",  badge: true, type: "select", options: ["Active","Inactive"] },
  { key: "remarks",  label: "Remarks",  w: "0",     hidden: true, type: "textarea" },
];

const STATUS_COLORS = {
  Active:      { bg: "#d1fae5", color: "#065f46" },
  Development: { bg: "#fef3c7", color: "#92400e" },
  Inactive:    { bg: "#fee2e2", color: "#991b1b" },
  Approved:    { bg: "#d1fae5", color: "#065f46" },
  Draft:       { bg: "#f3f4f6", color: "#6b7280" },
};
const fallbackStatus = { bg: "#f3f4f6", color: "#9ca3af" };


// ═══════════════════════════════════════════════════════════════════════════════
//  DETAIL VIEW (full-screen modal)
// ═══════════════════════════════════════════════════════════════════════════════
function DetailView({ sheet, allSheets, fileColor, fileName, onClose, onSelectSheet, M, A, uff, dff, fz }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch]   = useState("");
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving]   = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [toast, setToast]     = useState(null);

  const schema    = SCHEMA_MAP[sheet.key] || FALLBACK_SCHEMA;
  const tableCols = schema.filter(c => !c.hidden && c.w !== "0");
  const formFields= schema.filter(c => c.key !== "__skip");  // all fields appear in form
  const gridCols  = tableCols.map(c => c.w).join(" ") + " 80px";

  // Fetch data when sheet changes
  useEffect(() => {
    setLoading(true);
    setRows([]);
    setSearch("");
    setFetchError(null);
    api.getMasterData(sheet.key, fileName)
      .then(data => {
        if (Array.isArray(data)) {
          // Map raw header-keyed objects to schema-keyed objects
          setRows(data.map(r => mapRawToSchema(r, schema)));
        }
      })
      .catch(err => {
        console.error("getMasterData:", err);
        setFetchError(err.message || "Failed to fetch data");
      })
      .finally(() => setLoading(false));
  }, [sheet.key, fileName]);

  // Auto-open add form if _openAdd flag
  useEffect(() => {
    if (sheet._openAdd) setShowAddForm(true);
  }, [sheet._openAdd]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r).some(v => String(v).toLowerCase().includes(q));
  });

  const openEdit = (row) => {
    setEditRow(row);
    setFormData({ ...row });
    setShowAddForm(true);
  };

  const openAdd = () => {
    setEditRow(null);
    setFormData({});
    setShowAddForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert schema-keyed form data back to raw header-keyed for the backend
      const rawRecord = mapSchemaToRaw(formData, schema);
      await api.saveMasterRecord(sheet.key, fileName, rawRecord, !!editRow);
      setToast(editRow ? "Record updated" : "Record saved");
      setShowAddForm(false);
      setEditRow(null);
      setFormData({});
      // Refresh data
      const data = await api.getMasterData(sheet.key, fileName);
      if (Array.isArray(data)) setRows(data.map(r => mapRawToSchema(r, schema)));
    } catch (err) {
      setToast("Error: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const codeKey = schema[0]?.key || 'code';  // first field is always the code/ID

  const handleDelete = async (row) => {
    const code = row[codeKey];
    if (!confirm(`Delete record ${code}?`)) return;
    try {
      await api.deleteMasterRecord(sheet.key, fileName, code);
      setRows(prev => prev.filter(r => r[codeKey] !== code));
      setToast("Record deleted");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast("Error: " + err.message);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "stretch" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", height: "100%", display: "flex", background: M.bg, animation: "slideIn 0.2s ease" }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: 240, background: M.surfHigh, borderRight: `1px solid ${M.divider}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ background: fileColor, padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.6)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4, fontFamily: uff }}>Masters</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", fontFamily: uff }}>{fileName}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2, fontFamily: uff }}>{allSheets.length} sheets</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {allSheets.map(s => {
              const isActive = s.key === sheet.key;
              return (
                <div key={s.key} onClick={() => onSelectSheet(s)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", cursor: "pointer", background: isActive ? A.al : "transparent", borderLeft: `3px solid ${isActive ? A.a : "transparent"}`, transition: "all 0.1s" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: isActive ? 900 : 700, color: isActive ? A.a : M.textB, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: uff }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: M.textD, fontWeight: 700, fontFamily: dff }}>{s.count ?? "—"} records</div>
                  </div>
                  {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: A.a, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top bar */}
          <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 24 }}>{sheet.icon}</span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: uff }}>Masters › {fileName}</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: M.textA, fontFamily: uff }}>{sheet.name}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, color: M.textD, fontFamily: dff, fontWeight: 700 }}>{rows.length} records</div>
              <button onClick={openAdd}
                style={{ padding: "8px 18px", background: A.a, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: uff, display: "flex", alignItems: "center", gap: 6 }}>
                + Add New
              </button>
              <button onClick={onClose}
                style={{ padding: "8px 14px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 12, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>
                ✕ Close
              </button>
            </div>
          </div>

          {/* Controls */}
          <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.bg}`, padding: "10px 24px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: M.textD, fontSize: 12 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${sheet.name}...`}
                style={{ padding: "7px 12px 7px 30px", border: `1px solid ${M.inputBd}`, borderRadius: 6, fontSize: 12, fontFamily: uff, width: 240, outline: "none", color: M.textA, background: M.inputBg }} />
            </div>
            {["⚙ Filter", "↕ Sort", "📥 Import", "📊 Export"].map(lbl => (
              <button key={lbl} style={{ padding: "7px 12px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>{lbl}</button>
            ))}
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {fetchError ? (
              <div style={{ textAlign: "center", padding: 60, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#991b1b", marginBottom: 6, fontFamily: uff }}>Failed to load data</div>
                <div style={{ fontSize: 11, color: "#b91c1c", marginBottom: 16, fontFamily: uff, maxWidth: 400, margin: "0 auto 16px" }}>{fetchError}</div>
                <div style={{ fontSize: 10, color: "#6b7280", fontFamily: uff, lineHeight: 1.6 }}>
                  Check that GAS web app is deployed and VITE_GAS_URL is correct.<br/>
                  Open browser console for more details.
                </div>
              </div>
            ) : loading ? (
              <div style={{ textAlign: "center", padding: 60, color: M.textD, fontSize: 13, fontFamily: uff }}>Loading records…</div>
            ) : (
              <div style={{ background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 8, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: gridCols, background: M.surfMid, borderBottom: `1px solid ${M.divider}`, padding: "9px 16px", gap: 8 }}>
                  {tableCols.map(c => (
                    <div key={c.key} style={{ fontSize: 9, fontWeight: 900, color: M.textB, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>{c.label}</div>
                  ))}
                  <div style={{ fontSize: 9, fontWeight: 900, color: M.textB, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>Actions</div>
                </div>
                {/* Rows */}
                {filtered.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: M.textD, fontSize: 12, fontFamily: uff }}>
                    {rows.length === 0 ? "No records yet. Click '+ Add New' to create one." : `No results for "${search}"`}
                  </div>
                ) : filtered.map((row, i) => (
                  <div key={row[codeKey] || i} style={{ display: "grid", gridTemplateColumns: gridCols, padding: "10px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${M.bg}` : "none", background: i % 2 === 0 ? M.tblEven : M.tblOdd, gap: 8, alignItems: "center", transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = M.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? M.tblEven : M.tblOdd}>
                    {tableCols.map(c => {
                      const val = row[c.key] ?? "—";
                      if (c.badge) {
                        const sc = STATUS_COLORS[val] || fallbackStatus;
                        return <div key={c.key}><span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.color }}>{val}</span></div>;
                      }
                      return (
                        <div key={c.key} style={{ fontSize: c.mono ? 11 : 12, fontWeight: c.key === "name" || c.key === "desc" ? 700 : 400, color: c.mono ? M.textB : M.textA, fontFamily: c.mono ? dff : uff, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {val}
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => openEdit(row)} style={{ fontSize: 10, fontWeight: 700, color: A.a, background: A.al, border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: uff }}>Edit</button>
                      <button onClick={() => handleDelete(row)} style={{ fontSize: 10, fontWeight: 700, color: M.textD, background: M.surfMid, border: "none", borderRadius: 4, padding: "3px 6px", cursor: "pointer", fontFamily: uff }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status bar */}
            <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 11, color: M.textD, fontFamily: dff }}>
              <span>RECORDS <span style={{ color: M.textB, fontWeight: 700 }}>{filtered.length}</span></span>
              <span>TOTAL <span style={{ color: M.textB, fontWeight: 700 }}>{rows.length}</span></span>
            </div>
          </div>
        </div>

        {/* ADD / EDIT FORM PANEL */}
        {showAddForm && (
          <div style={{ width: 380, background: M.surfHigh, borderLeft: `1px solid ${M.divider}`, display: "flex", flexDirection: "column", boxShadow: `-4px 0 24px rgba(0,0,0,0.12)` }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${M.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>{editRow ? "Edit Record" : "New Record"}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: M.textA, fontFamily: uff }}>{editRow ? `Edit ${editRow.code}` : `Add ${sheet.name}`}</div>
              </div>
              <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }} style={{ background: M.surfMid, border: "none", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 14, color: M.textB }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {formFields.map(f => {
                const isAuto = f.auto && !editRow;
                const baseStyle = { width: "100%", padding: "9px 12px", border: `1px solid ${isAuto ? M.bg : M.inputBd}`, borderRadius: 6, fontSize: 12, fontFamily: f.mono ? dff : uff, background: isAuto ? M.surfMid : M.inputBg, color: isAuto ? M.textD : M.textA, outline: "none", boxSizing: "border-box" };

                let input;
                if (f.type === "select" && f.options) {
                  input = (
                    <select disabled={isAuto} value={formData[f.key] || ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, cursor: isAuto ? "default" : "pointer" }}>
                      <option value="">— Select —</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  );
                } else if (f.type === "textarea") {
                  input = (
                    <textarea rows={3} disabled={isAuto} placeholder={f.header} value={formData[f.key] || ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, resize: "vertical", minHeight: 60 }} />
                  );
                } else if (f.type === "date") {
                  input = (
                    <input type="date" disabled={isAuto} value={formData[f.key] || ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />
                  );
                } else if (f.type === "number") {
                  input = (
                    <input type="number" disabled={isAuto} placeholder={f.header} value={formData[f.key] ?? ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />
                  );
                } else {
                  input = (
                    <input type="text" disabled={isAuto} placeholder={f.header} value={formData[f.key] || ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />
                  );
                }

                return (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 900, color: M.textC, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, fontFamily: uff }}>
                      {f.label}
                      {f.required && <span style={{ color: "#ef4444", fontSize: 11, lineHeight: 1 }}>*</span>}
                      {f.auto && <span style={{ color: M.textD, fontWeight: 600, textTransform: "none", letterSpacing: 0, fontSize: 8 }}>(auto)</span>}
                      {f.hidden && <span style={{ color: M.textD, fontWeight: 600, textTransform: "none", letterSpacing: 0, fontSize: 8 }}>(hidden in table)</span>}
                    </label>
                    {input}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${M.divider}`, display: "flex", gap: 10 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "10px", background: saving ? M.textD : A.a, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: saving ? "default" : "pointer", fontFamily: uff }}>
                {saving ? "Saving…" : (editRow ? "Update Record" : "Save Record")}
              </button>
              <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }}
                style={{ padding: "10px 16px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 12, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", background: M.textA, color: M.bg, padding: "10px 24px", borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: uff, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN MASTERS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Masters({ M, A, cfg, fz, dff }) {
  const uff = uiFF(cfg.uiFont);
  const [collapsed, setCollapsed] = useState({});
  const [detailView, setDetailView] = useState(null);
  const [search, setSearch]       = useState("");
  const [sheetCounts, setSheetCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState(null);

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

  const toggleCollapse = (groupKey) => {
    setCollapsed(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const openDetail = (sheet, groupKey) => {
    setDetailView({ sheet, groupKey });
  };

  // Merge API counts into sheet definitions
  const getSheetWithCount = (sheet) => ({
    ...sheet,
    count: sheetCounts[sheet.key] ?? sheet.count ?? 0,
  });

  const allSheets = Object.values(MASTER_GROUPS).flatMap(g => g.sheets);
  const totalRecords = allSheets.reduce((a, s) => a + (sheetCounts[s.key] || 0), 0);
  const totalSheets  = allSheets.length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: M.bg, fontFamily: uff }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: "16px 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>Home › Masters</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: M.textA }}>📋 Master Data Hub</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[["📄 Sheets", totalSheets], ["🗂 Records", totalRecords], ["📁 Files", 3]].map(([l, v]) => (
                <div key={l} style={{ background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, padding: "6px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: M.textA, fontFamily: dff }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ width: 1, height: 36, background: M.divider }} />
            <button style={{ padding: "8px 14px", background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 12, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>📥 Import</button>
            <button style={{ padding: "8px 14px", background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 12, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>📊 Export All</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: 14, position: "relative", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: M.textD }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all masters..."
            style={{ width: "100%", padding: "9px 12px 9px 34px", border: `1px solid ${M.inputBd}`, borderRadius: 8, fontSize: 13, fontFamily: uff, background: M.inputBg, color: M.textA, outline: "none", boxSizing: "border-box" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: M.textD, fontSize: 14 }}>✕</button>}
        </div>
      </div>

      {/* ── API STATUS ── */}
      {countsError && (
        <div style={{ background: "#fef2f2", borderBottom: `1px solid #fecaca`, padding: "10px 28px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#991b1b", fontFamily: uff }}>API Connection Failed</div>
            <div style={{ fontSize: 10, color: "#b91c1c", fontFamily: uff }}>{countsError}</div>
          </div>
          <button onClick={() => { setCountsError(null); setCountsLoading(true); api.getMasterSheetCounts().then(data => { if (data) setSheetCounts(data); setCountsError(null); }).catch(err => setCountsError(err.message)).finally(() => setCountsLoading(false)); }}
            style={{ padding: "6px 14px", background: "#dc2626", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: uff }}>
            🔄 Retry
          </button>
        </div>
      )}
      {countsLoading && !countsError && (
        <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: "8px 28px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12 }}>⏳</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: M.textC, fontFamily: uff }}>Loading sheet counts from Google Sheets...</span>
        </div>
      )}

      {/* ── GROUPS ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {Object.entries(MASTER_GROUPS).map(([groupKey, { icon, color, badge, accentLight, sheets }]) => {
          const isCollapsed = collapsed[groupKey];
          const enrichedSheets = sheets.map(getSheetWithCount);
          const filteredSheets = search
            ? enrichedSheets.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()))
            : enrichedSheets;
          if (search && filteredSheets.length === 0) return null;

          const groupRecords = enrichedSheets.reduce((a, s) => a + (s.count || 0), 0);

          return (
            <div key={groupKey} style={{ marginBottom: 28 }}>
              {/* GROUP HEADER */}
              <div onClick={() => toggleCollapse(groupKey)}
                style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isCollapsed ? 0 : 14, cursor: "pointer", userSelect: "none", padding: "10px 14px", background: isCollapsed ? color : M.surfHigh, border: `1px solid ${isCollapsed ? color : M.divider}`, borderRadius: isCollapsed ? 10 : "10px 10px 0 0", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

                <div style={{ background: color, color: "#fff", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontFamily: uff }}>
                  <span>{icon}</span> <span>{groupKey}</span>
                </div>

                <div style={{ display: "flex", gap: 16, flex: 1 }}>
                  {[["Sheets", sheets.length], ["Records", groupRecords]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: isCollapsed ? "rgba(255,255,255,0.7)" : M.textD, fontWeight: 700, fontFamily: uff }}>{l}:</span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: isCollapsed ? "#fff" : M.textB, fontFamily: dff }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isCollapsed ? "rgba(255,255,255,0.7)" : M.textD, fontFamily: uff }}>
                    {isCollapsed ? "Click to expand" : "Click to collapse"}
                  </span>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: isCollapsed ? "rgba(255,255,255,0.15)" : M.surfMid, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: isCollapsed ? "#fff" : M.textB, transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</div>
                </div>
              </div>

              {/* CARDS GRID */}
              {!isCollapsed && (
                <div style={{ background: M.surfHigh, border: `1px solid ${M.divider}`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {filteredSheets.map((s) => (
                      <div key={s.key} className="card-wrap" style={{ position: "relative", borderRadius: 9, overflow: "visible" }}>

                        {/* Add button (visible on hover via CSS) */}
                        <button className="add-btn"
                          onClick={(e) => { e.stopPropagation(); openDetail({ ...s, _openAdd: true }, groupKey); }}
                          style={{ position: "absolute", top: -11, right: 10, zIndex: 10, background: A.a, border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 10, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: uff, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", boxShadow: `0 2px 8px ${A.a}50` }}>
                          + Add New
                        </button>

                        {/* Card */}
                        <div className="card-hover"
                          onClick={() => openDetail(s, groupKey)}
                          style={{ background: M.surfHigh, border: `1.5px solid ${M.divider}`, borderRadius: 9, padding: "14px 14px 12px", cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", height: "100%", boxSizing: "border-box" }}>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ width: 38, height: 38, background: accentLight, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
                            <div style={{ background: badge, color: "#fff", fontSize: 11, fontWeight: 900, padding: "3px 9px", borderRadius: 20, fontFamily: dff }}>{s.count}</div>
                          </div>

                          <div style={{ fontSize: 12, fontWeight: 900, color: M.textA, marginBottom: 4, lineHeight: 1.3, fontFamily: uff }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: M.textD, fontWeight: 600, marginBottom: 10, fontFamily: uff }}>{s.desc}</div>

                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                            {s.tags.map(t => (
                              <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: M.surfMid, color: M.textC, textTransform: "uppercase", letterSpacing: 0.3, fontFamily: uff }}>{t}</span>
                            ))}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: `1px solid ${M.bg}` }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: A.a, fontFamily: uff }}>Open →</span>
                            <span style={{ fontSize: 10, color: M.textD, marginLeft: "auto", fontFamily: uff }}>Updated today</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
          sheet={getSheetWithCount(detailView.sheet)}
          allSheets={MASTER_GROUPS[detailView.groupKey].sheets.map(getSheetWithCount)}
          fileColor={MASTER_GROUPS[detailView.groupKey].color}
          fileName={detailView.groupKey}
          onClose={() => setDetailView(null)}
          onSelectSheet={(s) => setDetailView(prev => ({ ...prev, sheet: s }))}
          M={M} A={A} uff={uff} dff={dff} fz={fz}
        />
      )}

      {/* CSS for hover effects */}
      <style>{`
        .card-hover:hover { border-color: ${A.a} !important; box-shadow: 0 6px 20px ${A.a}24 !important; transform: translateY(-2px) !important; }
        .add-btn { opacity: 0; transition: opacity 0.15s; }
        .card-wrap:hover .add-btn { opacity: 1; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
