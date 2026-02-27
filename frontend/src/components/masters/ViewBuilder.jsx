import { useState } from 'react';
import { DtBadge, IcoCell } from './helpers/fieldInput';
import { VIEW_COLORS, VIEW_ICONS } from './helpers/viewDefaults';

/**
 * ViewBuilder — modal for creating / editing a view.
 * Props: { enriched, editView, onSave, onCancel, M, A, uff, dff }
 */
export default function ViewBuilder({ enriched, editView, onSave, onCancel, M, A, uff, dff }) {
  const allKeys = enriched.fields.map(f => f.key);
  const [name, setName]         = useState(editView?.name || "");
  const [icon, setIcon]         = useState(editView?.icon || "⚡");
  const [color, setColor]       = useState(editView?.color || A.a);
  const [desc, setDesc]         = useState(editView?.desc || "");
  const [selected, setSelected] = useState(
    editView?.fields ? [...editView.fields] : enriched.fields.filter(f => f.required).map(f => f.key)
  );
  const [pickFilter, setPickFilter] = useState("All");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const PICK_FILTERS = [
    { id: "All", label: "All" },
    { id: "Mandatory", label: "⚠ Mand." },
    { id: "FK", label: "→ FK" },
    { id: "Auto", label: "← Auto" },
    { id: "Manual", label: "✍ Manual" },
  ];

  const visibleForPick = enriched.fields.filter(f => {
    if (pickFilter === "Mandatory") return f.required;
    if (pickFilter === "FK") return !!f.fk;
    if (pickFilter === "Auto") return f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType);
    if (pickFilter === "Manual") return !f.auto && !f.fk && !['calc', 'auto', 'autocode'].includes(f.fieldType);
    return true;
  });

  const toggle = (key) => setSelected(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);
  const selectAll = () => setSelected(allKeys);
  const clearAll = () => setSelected([]);
  const selectFiltered = () => setSelected(prev => [...new Set([...prev, ...visibleForPick.map(f => f.key)])]);
  const clearFiltered = () => { const fkeys = visibleForPick.map(f => f.key); setSelected(prev => prev.filter(k => !fkeys.includes(k))); };

  const moveUp = (key) => setSelected(prev => {
    const i = prev.indexOf(key); if (i <= 0) return prev;
    const n = [...prev]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n;
  });
  const moveDown = (key) => setSelected(prev => {
    const i = prev.indexOf(key); if (i < 0 || i >= prev.length - 1) return prev;
    const n = [...prev]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n;
  });

  const canSave = name.trim().length > 0 && selected.length > 0;

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)", zIndex: 1100 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 760, maxHeight: "88vh", background: M.surfHigh, border: `1px solid ${M.divider}`,
        borderRadius: 12, zIndex: 1101, boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "scaleIn .15s ease both",
      }}>
        {/* Header */}
        <div style={{ background: color, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", fontFamily: uff }}>{editView ? "Edit View" : "Create New View"}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.75)", fontFamily: uff }}>Select fields, set a name, and save</div>
          </div>
          <button onClick={onCancel} style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(255,255,255,.2)", color: "#fff", cursor: "pointer", fontSize: 14 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", gap: 0 }}>
          {/* LEFT — Meta */}
          <div style={{ width: 280, borderRight: `1px solid ${M.divider}`, padding: 18, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5, fontFamily: uff }}>View Name *</div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowIconPicker(p => !p)} style={{ width: 36, height: 36, borderRadius: 6, border: `1.5px solid ${showIconPicker ? color : M.inputBd}`, background: M.inputBg, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</button>
                  {showIconPicker && (
                    <div style={{ position: "absolute", top: 40, left: 0, zIndex: 10, background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 8, padding: 8, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, boxShadow: "0 4px 16px rgba(0,0,0,.15)", width: 180 }}>
                      {VIEW_ICONS.map(ic => (
                        <button key={ic} onClick={() => { setIcon(ic); setShowIconPicker(false); }} style={{ width: 30, height: 30, borderRadius: 5, border: icon === ic ? `2px solid ${color}` : "2px solid transparent", background: icon === ic ? `${color}20` : M.surfLow, cursor: "pointer", fontSize: 15 }}>{ic}</button>
                      ))}
                    </div>
                  )}
                </div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="View name…"
                  style={{ flex: 1, border: `1.5px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textA, fontSize: 12, padding: "6px 10px", outline: "none", fontWeight: 700, fontFamily: uff }} />
              </div>
            </div>

            {/* Color */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, fontFamily: uff }}>View Color</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {VIEW_COLORS.map(c => (
                  <button key={c.v} onClick={() => setColor(c.v)} title={c.l} style={{ width: 24, height: 24, borderRadius: 5, background: c.v, border: color === c.v ? `3px solid ${M.textA}` : "3px solid transparent", cursor: "pointer" }} />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5, fontFamily: uff }}>Description</div>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="What is this view for?"
                style={{ width: "100%", border: `1.5px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textA, fontSize: 11, padding: "6px 10px", outline: "none", resize: "none", fontFamily: uff, boxSizing: "border-box" }} />
            </div>

            {/* Selected fields ordered list */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: uff }}>Field Order</div>
                <span style={{ marginLeft: 6, background: selected.length > 0 ? color : M.surfMid, color: selected.length > 0 ? "#fff" : M.textD, borderRadius: 10, padding: "1px 7px", fontSize: 9, fontWeight: 900 }}>{selected.length}</span>
              </div>
              <div style={{ maxHeight: 160, overflowY: "auto", border: `1px solid ${M.divider}`, borderRadius: 6, background: M.surfLow }}>
                {selected.length === 0 ? (
                  <div style={{ padding: "20px 12px", textAlign: "center", fontSize: 10, color: M.textD, fontStyle: "italic", fontFamily: uff }}>No fields selected yet</div>
                ) : selected.map((key, idx) => {
                  const f = enriched.fields.find(x => x.key === key);
                  if (!f) return null;
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderBottom: `1px solid ${M.divider}`, background: M.surfHigh }}>
                      <span style={{ fontFamily: dff, fontSize: 8.5, fontWeight: 700, color: M.textD, width: 22 }}>{f.col}</span>
                      <span style={{ flex: 1, fontSize: 9.5, fontWeight: 700, color: M.textA, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: uff }}>{f.label}</span>
                      <button onClick={() => moveUp(key)} disabled={idx === 0} style={{ width: 18, height: 18, borderRadius: 3, border: "none", background: M.surfLow, cursor: idx === 0 ? "default" : "pointer", color: M.textD, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                      <button onClick={() => moveDown(key)} disabled={idx === selected.length - 1} style={{ width: 18, height: 18, borderRadius: 3, border: "none", background: M.surfLow, cursor: idx === selected.length - 1 ? "default" : "pointer", color: M.textD, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === selected.length - 1 ? 0.3 : 1 }}>↓</button>
                      <button onClick={() => toggle(key)} style={{ width: 18, height: 18, borderRadius: 3, border: "none", background: "#fef2f2", cursor: "pointer", color: "#ef4444", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Field picker */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${M.divider}`, background: M.surfMid, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: uff }}>Field Picker</div>
                <span style={{ fontSize: 9, color: M.textC, fontFamily: uff }}>— check to include</span>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {PICK_FILTERS.map(pf => (
                  <button key={pf.id} onClick={() => setPickFilter(pf.id)} style={{ padding: "3px 10px", borderRadius: 20, border: `1.5px solid ${pickFilter === pf.id ? color : M.inputBd}`, background: pickFilter === pf.id ? color : M.inputBg, color: pickFilter === pf.id ? "#fff" : M.textB, fontSize: 9.5, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>{pf.label}</button>
                ))}
                <span style={{ flex: 1 }} />
                <button onClick={selectAll} style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${M.inputBd}`, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: uff }}>Select All</button>
                <button onClick={clearAll} style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${M.inputBd}`, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: uff }}>Clear All</button>
                <button onClick={selectFiltered} style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${color}`, background: `${color}10`, color, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: uff }}>+ Filter</button>
                <button onClick={clearFiltered} style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${M.inputBd}`, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: uff }}>− Filter</button>
              </div>
              <div style={{ fontSize: 8.5, color: M.textD, fontFamily: dff }}>{visibleForPick.length} fields shown · {selected.length} of {enriched.totalCols} selected</div>
            </div>

            {/* Field list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {visibleForPick.map((f, i) => {
                const isSel = selected.includes(f.key);
                const isAuto = f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType);
                return (
                  <div key={f.key} onClick={() => toggle(f.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 14px",
                      borderBottom: `1px solid ${M.divider}`, cursor: "pointer",
                      background: isSel ? `${color}08` : i % 2 === 0 ? M.tblEven : M.tblOdd,
                      borderLeft: `3px solid ${isSel ? color : "transparent"}`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isSel ? `${color}15` : M.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = isSel ? `${color}08` : i % 2 === 0 ? M.tblEven : M.tblOdd}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${isSel ? color : M.inputBd}`, background: isSel ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isSel && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontFamily: dff, fontSize: 9, fontWeight: 700, color: M.textD, width: 22, flexShrink: 0 }}>{f.col}</span>
                    <span style={{ width: 20, textAlign: "center", flexShrink: 0 }}><IcoCell ico={f.ico} A={{ a: color }} /></span>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: isSel ? 700 : 400, color: isSel ? M.textA : M.textB, fontFamily: uff }}>{f.label}</span>
                    <DtBadge type={f.fieldType} />
                    {f.required && <span style={{ background: "#fef2f2", color: "#ef4444", borderRadius: 3, padding: "1px 6px", fontSize: 8, fontWeight: 900 }}>MAND</span>}
                    {isAuto && <span style={{ background: A.al, color: A.a, borderRadius: 3, padding: "1px 6px", fontSize: 8, fontWeight: 900 }}>AUTO</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 8, background: M.surfMid, flexShrink: 0 }}>
          {!canSave && <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, fontFamily: uff }}>⚠ Enter a name and select at least 1 field</span>}
          <div style={{ flex: 1 }} />
          <button onClick={onCancel} style={{ padding: "8px 18px", border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>Cancel</button>
          <button onClick={() => canSave && onSave({ name: name.trim(), icon, color, desc, fields: selected })} disabled={!canSave}
            style={{ padding: "8px 22px", border: "none", borderRadius: 6, background: canSave ? color : M.surfMid, color: canSave ? "#fff" : M.textD, fontSize: 11, fontWeight: 900, cursor: canSave ? "pointer" : "default", opacity: canSave ? 1 : 0.7, fontFamily: uff }}>
            {editView ? "Save Changes" : "Create View"}
          </button>
        </div>
      </div>
    </>
  );
}
