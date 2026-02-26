import { useState, useEffect } from 'react';
import { uiFF } from '../../constants/fonts';
import { SCHEMA_MAP } from '../../constants/masterSchemas';
import api from '../../services/api';

// ── Mapping: raw sheet headers ↔ schema keys ──
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
  Scheduled:   { bg: "#dbeafe", color: "#1e40af" },
  Completed:   { bg: "#d1fae5", color: "#065f46" },
  Overdue:     { bg: "#fee2e2", color: "#991b1b" },
  Maintenance: { bg: "#fef3c7", color: "#92400e" },
  Disposed:    { bg: "#f3f4f6", color: "#6b7280" },
  Blocked:     { bg: "#fee2e2", color: "#991b1b" },
  Yes:         { bg: "#d1fae5", color: "#065f46" },
  No:          { bg: "#fee2e2", color: "#991b1b" },
};
const fallbackStatus = { bg: "#f3f4f6", color: "#9ca3af" };


// ═══════════════════════════════════════════════════════════════════════════════
//  SHEET TABLE VIEW (inline, replaces modal)
// ═══════════════════════════════════════════════════════════════════════════════
function SheetTable({ sheet, fileKey, M, A, uff, dff, sheetCounts }) {
  const file = FILES[fileKey];
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
  const formFields= schema.filter(c => c.key !== "__skip");
  const gridCols  = tableCols.map(c => c.w).join(" ") + " 80px";

  // Fetch data when sheet changes
  useEffect(() => {
    setLoading(true);
    setRows([]);
    setSearch("");
    setFetchError(null);
    setShowAddForm(false);
    setEditRow(null);
    setFormData({});
    api.getMasterData(sheet.key, file.label)
      .then(data => {
        if (Array.isArray(data)) {
          setRows(data.map(r => mapRawToSchema(r, schema)));
        }
      })
      .catch(err => {
        console.error("getMasterData:", err);
        setFetchError(err.message || "Failed to fetch data");
      })
      .finally(() => setLoading(false));
  }, [sheet.key]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r).some(v => String(v).toLowerCase().includes(q));
  });

  const codeKey = schema[0]?.key || 'code';

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
      const rawRecord = mapSchemaToRaw(formData, schema);
      await api.saveMasterRecord(sheet.key, file.label, rawRecord, !!editRow);
      setToast(editRow ? "Record updated" : "Record saved");
      setShowAddForm(false);
      setEditRow(null);
      setFormData({});
      const data = await api.getMasterData(sheet.key, file.label);
      if (Array.isArray(data)) setRows(data.map(r => mapRawToSchema(r, schema)));
    } catch (err) {
      setToast("Error: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (row) => {
    const code = row[codeKey];
    if (!confirm(`Delete record ${code}?`)) return;
    try {
      await api.deleteMasterRecord(sheet.key, file.label, code);
      setRows(prev => prev.filter(r => r[codeKey] !== code));
      setToast("Record deleted");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast("Error: " + err.message);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Sheet top bar */}
      <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 12, height: 52, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          <span style={{ fontSize: 16 }}>{file.icon}</span>
          <span style={{ fontSize: 11, color: M.textD, fontWeight: 700, fontFamily: uff }}>{file.label}</span>
          <span style={{ color: M.divider }}>›</span>
          <span style={{ fontSize: 16 }}>{sheet.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: M.textA, fontFamily: uff }}>{sheet.name}</span>
          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: M.surfMid, color: M.textC, fontFamily: dff, marginLeft: 4 }}>
            {sheetCounts[sheet.key] ?? rows.length} records
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: M.textD }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."
              style={{ padding: "6px 10px 6px 28px", border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontFamily: uff, width: 180, outline: "none", color: M.textA, background: M.inputBg }} />
          </div>
          <button style={{ padding: "6px 12px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>📥 Import</button>
          <button style={{ padding: "6px 12px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>📤 Export</button>
          <button onClick={openAdd}
            style={{ padding: "6px 16px", background: A.a, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: uff }}>
            + Add New
          </button>
        </div>
      </div>

      {/* Table area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {fetchError ? (
            <div style={{ textAlign: "center", padding: 60, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#991b1b", marginBottom: 6, fontFamily: uff }}>Failed to load data</div>
              <div style={{ fontSize: 11, color: "#b91c1c", marginBottom: 16, fontFamily: uff, maxWidth: 400, margin: "0 auto 16px" }}>{fetchError}</div>
              <div style={{ fontSize: 10, color: "#6b7280", fontFamily: uff, lineHeight: 1.6 }}>
                Check that GAS web app is deployed and VITE_GAS_URL is correct.
              </div>
            </div>
          ) : loading ? (
            <div style={{ textAlign: "center", padding: 60, color: M.textD, fontSize: 13, fontFamily: uff }}>Loading records…</div>
          ) : (
            <div style={{ background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 8, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: gridCols, padding: "8px 16px", background: M.surfMid, borderBottom: `2px solid ${M.divider}`, gap: 8 }}>
                {tableCols.map(c => (
                  <div key={c.key} style={{ fontSize: 9, fontWeight: 900, color: M.textB, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>{c.label}</div>
                ))}
                <div style={{ fontSize: 9, fontWeight: 900, color: M.textB, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>Actions</div>
              </div>
              {/* Data rows */}
              {filtered.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: M.textD, fontSize: 12, fontFamily: uff }}>
                  {rows.length === 0 ? "No records yet. Click '+ Add New' to create one." : `No results for "${search}"`}
                </div>
              ) : filtered.map((row, i) => (
                <div key={row[codeKey] || i} style={{ display: "grid", gridTemplateColumns: gridCols, padding: "9px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${M.bg}` : "none", background: i % 2 === 0 ? M.tblEven : M.tblOdd, gap: 8, alignItems: "center", transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = M.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? M.tblEven : M.tblOdd}>
                  {tableCols.map(c => {
                    const val = row[c.key] ?? "—";
                    if (c.badge) {
                      const sc = STATUS_COLORS[val] || fallbackStatus;
                      return <div key={c.key}><span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: sc.bg, color: sc.color }}>{val}</span></div>;
                    }
                    return (
                      <div key={c.key} style={{ fontSize: c.mono ? 11 : 12, fontWeight: c.key === "name" || c.key === "desc" ? 700 : 400, color: c.mono ? (c.key === codeKey ? A.a : M.textB) : M.textA, fontFamily: c.mono ? dff : uff, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
          <div style={{ marginTop: 10, fontSize: 10, color: M.textD, fontFamily: dff }}>
            SHOWING {filtered.length} OF {rows.length} RECORDS · FILE {fileKey}
          </div>
        </div>

        {/* Add / Edit form slide panel */}
        {showAddForm && (
          <div style={{ width: 380, background: M.surfHigh, borderLeft: `1px solid ${M.divider}`, display: "flex", flexDirection: "column", boxShadow: `-4px 0 24px rgba(0,0,0,0.12)`, flexShrink: 0, animation: "slideR .2s ease" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{sheet.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>{editRow ? "Edit Record" : "New Record"}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: M.textA, fontFamily: uff }}>{editRow ? `Edit ${editRow[codeKey]}` : sheet.name}</div>
              </div>
              <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }} style={{ background: M.surfMid, border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14, color: M.textB }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {formFields.map(f => {
                const isAuto = f.auto && !editRow;
                const baseStyle = { width: "100%", padding: "8px 12px", border: `1px solid ${isAuto ? M.bg : M.inputBd}`, borderRadius: 7, fontSize: 12, fontFamily: f.mono ? dff : uff, background: isAuto ? M.surfMid : M.inputBg, color: isAuto ? M.textD : M.textA, outline: "none", boxSizing: "border-box" };
                let input;
                if (f.type === "select" && f.options) {
                  input = (
                    <select disabled={isAuto} value={formData[f.key] || ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, cursor: isAuto ? "default" : "pointer" }}>
                      <option value="">— Select —</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  );
                } else if (f.type === "textarea") {
                  input = <textarea rows={3} disabled={isAuto} placeholder={f.header || `Enter ${f.label}...`} value={formData[f.key] || ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, resize: "vertical", minHeight: 60 }} />;
                } else if (f.type === "date") {
                  input = <input type="date" disabled={isAuto} value={formData[f.key] || ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                } else if (f.type === "number") {
                  input = <input type="number" disabled={isAuto} placeholder={f.header || `Enter ${f.label}...`} value={formData[f.key] ?? ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                } else {
                  input = <input type="text" disabled={isAuto} placeholder={f.header || `Enter ${f.label}...`} value={formData[f.key] || ""} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                }
                return (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 900, color: M.textC, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5, fontFamily: uff }}>
                      {f.label}
                      {f.required && <span style={{ color: "#ef4444", fontSize: 11, lineHeight: 1 }}>*</span>}
                      {f.auto && <span style={{ color: M.textD, fontWeight: 600, textTransform: "none", letterSpacing: 0, fontSize: 8 }}>(auto)</span>}
                    </label>
                    {input}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${M.divider}`, display: "flex", gap: 8 }}>
              <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }}
                style={{ flex: 1, padding: "9px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, padding: "9px", background: saving ? M.textD : A.a, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: saving ? "default" : "pointer", fontFamily: uff }}>
                {saving ? "Saving…" : (editRow ? "Update Record" : "Save Record")}
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
  const [search, setSearch]             = useState("");

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
            🔄 Retry
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
          ? <SheetTable
              sheet={activeSheet.sheet}
              fileKey={activeSheet.fileKey}
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
        .card-hover:hover { transform: translateY(-2px) !important; }
        .add-btn { opacity: 0; transition: opacity 0.15s; }
        .card-wrap:hover .add-btn { opacity: 1; }
      `}</style>
    </div>
  );
}
