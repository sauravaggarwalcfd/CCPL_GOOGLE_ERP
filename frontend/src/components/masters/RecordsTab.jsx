import { useState, useEffect } from 'react';
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

const FALLBACK_SCHEMA = [
  { key: "code",     label: "Code",     w: "140px", mono: true, auto: true },
  { key: "name",     label: "Name",     w: "1fr",   required: true },
  { key: "category", label: "Category", w: "120px" },
  { key: "status",   label: "Status",   w: "90px",  badge: true, type: "select", options: ["Active","Inactive"] },
  { key: "remarks",  label: "Remarks",  w: "0",     hidden: true, type: "textarea" },
];

/**
 * RecordsTab — extracted from the original SheetTable.
 * Props: { sheet, fileKey, fileLabel, M, A, uff, dff, sheetCounts }
 */
export default function RecordsTab({ sheet, fileKey, fileLabel, M, A, uff, dff, sheetCounts }) {
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

  useEffect(() => {
    setLoading(true);
    setRows([]);
    setSearch("");
    setFetchError(null);
    setShowAddForm(false);
    setEditRow(null);
    setFormData({});
    api.getMasterData(sheet.key, fileLabel)
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
      await api.saveMasterRecord(sheet.key, fileLabel, rawRecord, !!editRow);
      setToast(editRow ? "Record updated" : "Record saved");
      setShowAddForm(false);
      setEditRow(null);
      setFormData({});
      const data = await api.getMasterData(sheet.key, fileLabel);
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
      await api.deleteMasterRecord(sheet.key, fileLabel, code);
      setRows(prev => prev.filter(r => r[codeKey] !== code));
      setToast("Record deleted");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast("Error: " + err.message);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ background: M.surfMid, borderBottom: `1px solid ${M.divider}`, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, height: 44, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.5, fontFamily: uff }}>📊 RECORDS</span>
          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: M.surfHigh, color: M.textC, fontFamily: dff }}>
            {sheetCounts?.[sheet.key] ?? rows.length} records
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: M.textD }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."
              style={{ padding: "6px 10px 6px 28px", border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontFamily: uff, width: 180, outline: "none", color: M.textA, background: M.inputBg }} />
          </div>
          <button onClick={openAdd}
            style={{ padding: "6px 16px", background: A.a, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: uff }}>
            + Add New
          </button>
        </div>
      </div>

      {/* Table area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px" }}>
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
