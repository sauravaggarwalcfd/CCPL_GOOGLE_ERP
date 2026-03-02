import { useState } from 'react';
import { FieldInput, DtBadge, IcoCell } from './helpers/fieldInput';

// CC_RED — mandatory for Save to Sheet button and inline mode header
const CC_RED = '#CC0000';

/**
 * DataEntryTab — Form + Inline entry modes for a master sheet.
 * Props: {
 *   enriched, formData, onChange, errors, isDirty,
 *   entryMode, visibleKeys, onClear, onSave, saving,
 *   M, A, uff, dff
 * }
 */
export default function DataEntryTab({
  enriched, formData, onChange, errors, isDirty,
  entryMode, visibleKeys, onClear, onSave, saving,
  M, A, uff, dff,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveClick = () => {
    // Show confirm modal before actually saving
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    setShowConfirm(false);
    onSave();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {entryMode === "form"
          ? <FormView enriched={enriched} formData={formData} onChange={onChange} errors={errors} visibleKeys={visibleKeys} M={M} A={A} uff={uff} dff={dff} />
          : <InlineView enriched={enriched} formData={formData} onChange={onChange} errors={errors} visibleKeys={visibleKeys} M={M} A={A} uff={uff} dff={dff} />
        }
      </div>

      {/* Entry Footer */}
      <div style={{ padding: "8px 14px", borderTop: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 8, background: M.surfMid, flexShrink: 0 }}>
        {isDirty && <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 900, fontFamily: uff }}>● Unsaved changes</span>}
        <div style={{ flex: 1 }} />
        <button onClick={onClear} style={{ padding: "6px 14px", border: `1px solid ${M.inputBd}`, borderRadius: 5, background: M.inputBg, color: M.textB, fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>↺ Clear</button>
        {/* Save to Sheet — CC_RED per spec */}
        <button onClick={handleSaveClick} disabled={saving}
          style={{ padding: "6px 20px", border: "none", borderRadius: 5, background: saving ? M.textD : CC_RED, color: "#fff", fontSize: 10, fontWeight: 900, cursor: saving ? "default" : "pointer", fontFamily: uff }}>
          {saving ? "Saving…" : "✓ Save to Sheet"}
        </button>
      </div>

      {/* ── Confirm Save Modal ── */}
      {showConfirm && (
        <ConfirmSaveModal
          enriched={enriched}
          formData={formData}
          visibleKeys={visibleKeys}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
          M={M} A={A} uff={uff} dff={dff}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  CONFIRM SAVE MODAL — 2-col summary, warning, ← Edit / ✅ Confirm & Save
// ═══════════════════════════════════════════════════════════════════════════════
function ConfirmSaveModal({ enriched, formData, visibleKeys, onConfirm, onCancel, M, A, uff, dff }) {
  const visFields = enriched.fields.filter(f => visibleKeys.includes(f.key) && !f.hidden);
  const filledFields = visFields.filter(f => formData[f.key]);
  const emptyRequired = visFields.filter(f => f.required && !formData[f.key]);

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)", zIndex: 1300 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 560, maxWidth: "95vw", maxHeight: "85vh",
        background: M.surfHigh, border: `1px solid ${M.divider}`,
        borderRadius: 12, zIndex: 1301, boxShadow: M.shadow,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: CC_RED, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", fontFamily: uff }}>Confirm Save to Sheet</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.8)", fontFamily: uff, marginTop: 2 }}>Review the record before it is written to the Google Sheet</div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onCancel} style={{ width: 26, height: 26, borderRadius: 5, border: "none", background: "rgba(255,255,255,.2)", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Warning banner if required fields empty */}
        {emptyRequired.length > 0 && (
          <div style={{ background: "#fef3c7", borderBottom: "1px solid #fde68a", padding: "8px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#92400e", fontFamily: uff }}>
              {emptyRequired.length} required field{emptyRequired.length > 1 ? "s" : ""} not filled: {emptyRequired.map(f => f.label).join(", ")}
            </span>
          </div>
        )}

        {/* Body — 2-col grid of fields */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
            {filledFields.map(f => (
              <div key={f.key} style={{ gridColumn: f.type === "textarea" ? "1 / -1" : undefined }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, color: M.textD, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3, fontFamily: uff }}>
                  {f.label}{f.required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
                </div>
                <div style={{ fontSize: 12, fontWeight: f.auto ? 600 : 700, color: f.auto ? A.a : M.textA, fontFamily: f.mono ? dff : uff, padding: "5px 9px", background: M.surfMid, borderRadius: 4, border: `1px solid ${M.divider}`, wordBreak: "break-word" }}>
                  {String(formData[f.key])}
                </div>
              </div>
            ))}
          </div>
          {filledFields.length === 0 && (
            <div style={{ textAlign: "center", padding: 24, color: M.textD, fontSize: 12, fontFamily: uff }}>No fields filled yet.</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${M.divider}`, display: "flex", justifyContent: "flex-end", gap: 8, background: M.surfMid, flexShrink: 0 }}>
          <button onClick={onCancel} style={{ padding: "8px 20px", border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: uff }}>
            ← Edit
          </button>
          <button onClick={onConfirm} style={{ padding: "8px 24px", border: "none", borderRadius: 6, background: CC_RED, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer", fontFamily: uff }}>
            ✅ Confirm & Save
          </button>
        </div>
      </div>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  FORM VIEW — grouped accordion with 2-column responsive grid
// ═══════════════════════════════════════════════════════════════════════════════
function FormView({ enriched, formData, onChange, errors, visibleKeys, M, A, uff, dff }) {
  const [openSec, setOpenSec] = useState(() => enriched.sections.map(s => s.id));
  const toggleSec = (id) => setOpenSec(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {enriched.sections.map(sec => {
        // Filter to fields in this section that are visible in the current view
        const secFields = enriched.fields.filter(f =>
          sec.cols.includes(f.col) && visibleKeys.includes(f.key)
        );
        if (secFields.length === 0) return null;

        const open = openSec.includes(sec.id);
        const secErrors = secFields.filter(f => errors[f.key]).length;

        return (
          <div key={sec.id} style={{ border: `1px solid ${secErrors > 0 ? "#ef4444" : M.divider}`, borderRadius: 7, overflow: "hidden" }}>
            {/* Section header */}
            <button onClick={() => toggleSec(sec.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 14px",
              background: open ? `${A.a}08` : M.surfMid, border: "none", cursor: "pointer",
              borderBottom: `1px solid ${open ? M.divider : "transparent"}`,
            }}>
              <span style={{ fontSize: 14 }}>{sec.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: open ? A.a : M.textA, flex: 1, textAlign: "left", fontFamily: uff }}>{sec.title}</span>
              <span style={{ fontSize: 9, color: M.textD, fontFamily: dff }}>{secFields.length} fields</span>
              {secErrors > 0 && <span style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 3, padding: "1px 6px", fontSize: 9, fontWeight: 900 }}>{secErrors} error{secErrors > 1 ? "s" : ""}</span>}
              <span style={{ fontSize: 10, color: M.textD, marginLeft: 4 }}>{open ? "▾" : "▸"}</span>
            </button>
            {/* Section body */}
            {open && (
              <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
                {secFields.map(f => {
                  const isAuto = f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType);
                  return (
                    <div key={f.key} style={{ gridColumn: (f.type === "textarea" || f.fieldType === "textarea") ? "1 / -1" : "auto" }}>
                      {/* Field label */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        <span style={{ fontFamily: dff, fontSize: 8.5, fontWeight: 700, color: M.textD, minWidth: 18 }}>{f.col}</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color: errors[f.key] ? "#ef4444" : f.required ? A.a : M.textD, flex: 1, fontFamily: uff }}>
                          {f.required && !isAuto ? "⚠ " : ""}{f.label}
                        </span>
                        <DtBadge type={f.fieldType} />
                        {f.fk && (
                          <span style={{ fontSize: 7.5, fontWeight: 900, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 3, padding: "1px 4px" }}>
                            FK: {f.fk}
                          </span>
                        )}
                      </div>
                      {/* Field input */}
                      <FieldInput field={f} val={formData[f.key]} onChange={v => onChange(f.key, v)} M={M} A={A} uff={uff} dff={dff} compact={false} hasError={!!errors[f.key]} />
                      {/* Error / hint */}
                      {errors[f.key] && <div style={{ fontSize: 9, color: "#ef4444", marginTop: 2, fontWeight: 700, fontFamily: uff }}>{errors[f.key]}</div>}
                      {!errors[f.key] && !isAuto && <div style={{ fontSize: 8.5, color: M.textD, marginTop: 2, fontFamily: uff }}>{f.hint}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  INLINE VIEW — dense table-style entry
// ═══════════════════════════════════════════════════════════════════════════════
function InlineView({ enriched, formData, onChange, errors, visibleKeys, M, A, uff, dff }) {
  const [activeKey, setActiveKey] = useState(null);
  const [search, setSearch] = useState("");

  const orderedFields = enriched.fields
    .filter(f => visibleKeys.includes(f.key))
    .filter(f => !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.key.toLowerCase().includes(search.toLowerCase()));

  const manualCount = orderedFields.filter(f => !f.auto && !['calc', 'autocode', 'auto'].includes(f.fieldType));
  const filledCount = manualCount.filter(f => formData[f.key]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Inline toolbar — CC_RED header */}
      <div style={{ padding: "6px 14px", borderBottom: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 8, background: CC_RED, flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 0.5, fontFamily: uff }}>⚡ INLINE ENTRY</div>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,.3)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter fields…"
          style={{ border: "1px solid rgba(255,255,255,.4)", borderRadius: 4, background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, padding: "3px 8px", outline: "none", width: 180, fontFamily: uff }} />
        <div style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,.85)", fontWeight: 700, fontFamily: uff }}>
          {filledCount} / {manualCount.length} filled
        </div>
      </div>

      {/* Inline table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 30 }} />
            <col style={{ width: 34 }} />
            <col />
            <col style={{ width: 108 }} />
            <col />
            <col style={{ width: 50 }} />
          </colgroup>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ background: CC_RED }}>
              {["COL", "#", "ICON", "FIELD", "TYPE", "VALUE", "STATUS"].map(h => (
                <th key={h} style={{ padding: "7px 8px", textAlign: "left", fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 0.5, whiteSpace: "nowrap", fontFamily: uff }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedFields.map((f, i) => {
              const isActive = activeKey === f.key;
              const isAuto = f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType);
              const filled = !!formData[f.key] && !isAuto;
              const hasErr = !!errors[f.key];
              const rowBg = isActive ? A.al : hasErr ? "#fef2f2" : (i % 2 === 0 ? M.tblEven : M.tblOdd);

              return (
                <tr key={f.key}
                  onClick={() => !isAuto && setActiveKey(f.key)}
                  style={{
                    background: rowBg, borderBottom: `1px solid ${M.divider}`,
                    cursor: isAuto ? "default" : "pointer",
                    borderLeft: `3px solid ${isActive ? A.a : hasErr ? "#ef4444" : isAuto ? A.a + "20" : "transparent"}`,
                  }}
                  onMouseEnter={e => { if (!isActive && !isAuto) e.currentTarget.style.background = M.hoverBg; }}
                  onMouseLeave={e => { if (!isActive && !isAuto) e.currentTarget.style.background = rowBg; }}
                >
                  <td style={{ padding: "7px 8px", fontFamily: dff, fontSize: 9.5, fontWeight: 700, color: M.textC }}>{f.col}</td>
                  <td style={{ padding: "7px 8px", fontFamily: dff, fontSize: 9, color: M.textD, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ padding: "7px 8px", textAlign: "center" }}><IcoCell ico={f.ico} A={A} /></td>
                  <td style={{ padding: "7px 8px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? A.a : M.textA, fontFamily: uff }}>{f.label}</div>
                    {!isActive && <div style={{ fontSize: 8, color: M.textD, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: uff }}>{f.hint}</div>}
                  </td>
                  <td style={{ padding: "7px 8px" }}><DtBadge type={f.fieldType} /></td>
                  <td style={{ padding: "6px 8px" }}>
                    {isActive ? (
                      <FieldInput field={f} val={formData[f.key]} onChange={v => onChange(f.key, v)} M={M} A={A} uff={uff} dff={dff} compact={true} hasError={hasErr} />
                    ) : isAuto ? (
                      <div style={{ fontSize: 11, color: A.a, background: A.al, border: `1px solid ${A.a}30`, borderRadius: 3, padding: "3px 8px", fontWeight: 700, fontFamily: dff }}>
                        {formData[f.key] || <span style={{ opacity: 0.6 }}>← auto</span>}
                      </div>
                    ) : formData[f.key] ? (
                      <div style={{ fontSize: 11, color: M.textA, fontWeight: 600, padding: "3px 2px", fontFamily: uff }}>{formData[f.key]}</div>
                    ) : (
                      <div style={{ fontSize: 11, color: M.textD, padding: "3px 2px", fontStyle: "italic", borderBottom: `1px dashed ${M.inputBd}`, fontFamily: uff }}>
                        {f.required ? "⚠ required — click" : "click to enter…"}
                      </div>
                    )}
                    {hasErr && <div style={{ fontSize: 8, color: "#ef4444", marginTop: 1, fontWeight: 700, fontFamily: uff }}>{errors[f.key]}</div>}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "center" }}>
                    {isAuto
                      ? <span style={{ color: "#059669", fontSize: 9, fontWeight: 900 }}>AUTO</span>
                      : filled
                        ? <span style={{ color: "#059669", fontSize: 12 }}>✓</span>
                        : hasErr
                          ? <span style={{ color: "#ef4444", fontSize: 9, fontWeight: 900 }}>!!</span>
                          : f.required
                            ? <span style={{ color: "#f59e0b", fontSize: 9, fontWeight: 900 }}>req</span>
                            : <span style={{ color: M.textD, fontSize: 9 }}>opt</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
