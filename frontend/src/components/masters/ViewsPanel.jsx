import { useState } from 'react';

/**
 * ViewsPanel — slide-in right panel for browsing/managing views.
 * Props: { enriched, views, activeId, onActivate, onEdit, onDuplicate, onDelete, onNew, onClose, M, A, uff, dff }
 */
export default function ViewsPanel({ enriched, views, activeId, onActivate, onEdit, onDuplicate, onDelete, onNew, onClose, M, A, uff, dff }) {
  const [hoverId, setHoverId] = useState(null);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", backdropFilter: "blur(1px)", zIndex: 800 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0, width: 340, background: M.surfHigh,
        borderLeft: `1px solid ${M.divider}`, zIndex: 801, display: "flex", flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0,0,0,.2)", animation: "slideR .2s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${M.divider}`, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: M.textA, fontFamily: uff }}>Saved Views</div>
            <div style={{ fontSize: 9.5, color: M.textC, marginTop: 2, fontFamily: uff }}>{enriched.id} · {views.length} view{views.length !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 6, border: `1px solid ${M.inputBd}`, background: M.inputBg, cursor: "pointer", fontSize: 13, color: M.textB }}>×</button>
        </div>

        {/* Explanation */}
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${M.divider}`, background: A.al }}>
          <div style={{ fontSize: 10, color: M.textA, lineHeight: 1.55, fontFamily: uff }}>
            <span style={{ fontWeight: 900 }}>Views</span> save a custom selection of fields for this master. Switch views to show only the fields relevant to a specific entry task.
          </div>
        </div>

        {/* View list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {views.map(v => {
            const isActive = activeId === v.id;
            const isHover = hoverId === v.id;
            const fieldCount = v.fields.length;
            const sysLabel = v.isSystem ? "SYSTEM" : "CUSTOM";
            return (
              <div key={v.id}
                onMouseEnter={() => setHoverId(v.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  padding: "10px 16px", borderBottom: `1px solid ${M.divider}`,
                  background: isActive ? `${v.color}10` : isHover ? M.hoverBg : M.surfHigh,
                  borderLeft: `4px solid ${isActive ? v.color : "transparent"}`,
                  cursor: "pointer", transition: "all .12s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={() => onActivate(isActive ? null : v.id)}>
                  <span style={{ fontSize: 20 }}>{v.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: isActive ? 900 : 700, color: isActive ? v.color : M.textA, fontFamily: uff }}>{v.name}</span>
                      {isActive && <span style={{ background: v.color, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 8.5, fontWeight: 900 }}>ACTIVE</span>}
                      <span style={{ background: v.isSystem ? "#e0f2fe" : "#ede9fe", color: v.isSystem ? "#0369a1" : "#6d28d9", borderRadius: 3, padding: "1px 5px", fontSize: 7.5, fontWeight: 900, marginLeft: "auto" }}>{sysLabel}</span>
                    </div>
                    {v.desc && <div style={{ fontSize: 9.5, color: M.textC, marginTop: 1, lineHeight: 1.4, fontFamily: uff }}>{v.desc}</div>}
                    <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: v.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: M.textD, fontFamily: dff }}>{fieldCount} field{fieldCount !== 1 ? "s" : ""}</span>
                      <div style={{ display: "flex", gap: 2, flex: 1, overflow: "hidden" }}>
                        {v.fields.slice(0, 6).map(key => {
                          const f = enriched.fields.find(x => x.key === key);
                          return f ? <span key={key} style={{ fontSize: 7.5, background: M.surfMid, color: M.textC, borderRadius: 2, padding: "1px 4px", whiteSpace: "nowrap", fontFamily: dff }}>{f.col}</span> : null;
                        })}
                        {v.fields.length > 6 && <span style={{ fontSize: 7.5, color: M.textD }}>+{v.fields.length - 6}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action buttons on hover */}
                {isHover && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8, paddingTop: 6, borderTop: `1px solid ${M.divider}` }}>
                    <button onClick={e => { e.stopPropagation(); onActivate(isActive ? null : v.id); }} style={{ flex: 2, padding: "4px 8px", border: `1px solid ${isActive ? "#ef4444" : v.color}`, borderRadius: 4, background: isActive ? "#fef2f2" : `${v.color}15`, color: isActive ? "#ef4444" : v.color, fontSize: 9, fontWeight: 900, cursor: "pointer", fontFamily: uff }}>{isActive ? "✕ Deactivate" : "✓ Activate"}</button>
                    <button onClick={e => { e.stopPropagation(); onEdit(v); }} style={{ flex: 1, padding: "4px 8px", border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>Edit</button>
                    <button onClick={e => { e.stopPropagation(); onDuplicate(v); }} style={{ flex: 1, padding: "4px 8px", border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>Dup</button>
                    {!v.isSystem && (
                      <button onClick={e => { e.stopPropagation(); onDelete(v.id); }} style={{ width: 30, padding: "4px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", color: "#ef4444", fontSize: 9, fontWeight: 800, cursor: "pointer" }}>✕</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${M.divider}`, background: M.surfMid }}>
          <button onClick={onNew} style={{
            width: "100%", padding: "9px", border: `2px dashed ${A.a}`, borderRadius: 7,
            background: A.al, color: A.a, fontSize: 11, fontWeight: 900, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: uff,
          }}>
            <span style={{ fontSize: 16 }}>+</span> Create New View
          </button>
          <div style={{ fontSize: 8.5, color: M.textD, textAlign: "center", marginTop: 6, fontFamily: uff }}>Views are stored in-memory. Future: persist via API.</div>
        </div>
      </div>
    </>
  );
}
