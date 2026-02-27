/**
 * StatusBar — bottom bar showing contextual master info.
 * Props: { enriched, currentView, visibleKeys, mainTab, entryMode, formData, M, A, uff, dff }
 */
export default function StatusBar({ enriched, currentView, visibleKeys, mainTab, entryMode, formData, M, A, uff, dff }) {
  const fields = enriched?.fields || [];
  const mandatory = fields.filter(f => f.required).length;
  const auto = fields.filter(f => f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType)).length;
  const fk = fields.filter(f => f.fk).length;
  const filled = Object.keys(formData || {}).filter(k => formData[k]).length;

  const items = [
    { l: "MASTER", v: enriched?.id || "—" },
    { l: "COLS", v: enriched?.totalCols || 0 },
    { l: "VIEW", v: currentView ? currentView.name : "All Fields" },
    { l: "SHOWING", v: `${visibleKeys?.length || 0} fields` },
    { l: "TAB", v: (mainTab || "entry").toUpperCase() },
    { l: "MODE", v: mainTab === "entry" ? (entryMode || "form").toUpperCase() : "—" },
    { l: "FILLED", v: filled },
    { l: "MAND", v: mandatory },
  ];

  return (
    <div style={{
      background: M.surfMid, borderTop: `1px solid ${M.divider}`, padding: "4px 16px",
      display: "flex", alignItems: "center", gap: 18, flexShrink: 0,
    }}>
      {items.map(s => (
        <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 7.5, fontWeight: 900, color: M.textD, letterSpacing: 1, textTransform: "uppercase", fontFamily: uff }}>{s.l}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: M.textB, fontFamily: dff }}>{s.v}</span>
        </div>
      ))}
      <div style={{ flex: 1, textAlign: "right", fontSize: 8.5, color: M.textD, fontFamily: dff }}>
        CC ERP · {new Date().toLocaleDateString("en-IN")}
      </div>
    </div>
  );
}
