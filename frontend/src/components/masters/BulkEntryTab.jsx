import { useState, useCallback } from 'react';

/**
 * BulkEntryTab — Multi-row spreadsheet grid for entering multiple records at once.
 * Props: {
 *   enriched, visibleKeys,
 *   onSaveBulk, saving,
 *   M, A, uff, dff
 * }
 */
export default function BulkEntryTab({
  enriched, visibleKeys, onSaveBulk, saving,
  M, A, uff, dff,
}) {
  const [rows, setRows] = useState(() => [makeEmptyRow()]);
  const [activeCell, setActiveCell] = useState(null);   // { row, col }
  const [toast, setToast] = useState(null);

  // Only show manually-enterable fields (not auto/calc/autocode)
  const entryFields = enriched.fields
    .filter(f => visibleKeys.includes(f.key))
    .filter(f => !f.auto && !['calc', 'autocode', 'auto'].includes(f.fieldType));

  function makeEmptyRow() {
    return { _id: Date.now() + Math.random(), _data: {} };
  }

  const addRow = () => setRows(prev => [...prev, makeEmptyRow()]);

  const addMultipleRows = (count) => {
    const newRows = Array.from({ length: count }, () => makeEmptyRow());
    setRows(prev => [...prev, ...newRows]);
  };

  const removeRow = (idx) => {
    if (rows.length <= 1) {
      setRows([makeEmptyRow()]);
      return;
    }
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCell = (rowIdx, key, val) => {
    setRows(prev => prev.map((r, i) =>
      i === rowIdx ? { ...r, _data: { ...r._data, [key]: val } } : r
    ));
  };

  const clearAll = () => {
    setRows([makeEmptyRow()]);
    setActiveCell(null);
  };

  // Count how many rows have at least one filled field
  const filledRows = rows.filter(r => Object.values(r._data).some(v => v && String(v).trim()));

  // Handle paste from clipboard (tab-separated)
  const handlePaste = useCallback((e) => {
    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;

    const pastedRows = text.split('\n').filter(line => line.trim());
    if (pastedRows.length <= 1 && !text.includes('\t')) return; // not a grid paste

    e.preventDefault();

    const newRows = pastedRows.map(line => {
      const cells = line.split('\t');
      const rowData = {};
      cells.forEach((val, ci) => {
        if (ci < entryFields.length && val.trim()) {
          rowData[entryFields[ci].key] = val.trim();
        }
      });
      return { _id: Date.now() + Math.random(), _data: rowData };
    });

    if (newRows.length > 0) {
      setRows(prev => {
        // Replace empty rows, append to existing ones with data
        const hasData = prev.filter(r => Object.values(r._data).some(v => v && String(v).trim()));
        return [...hasData, ...newRows];
      });
      setToast(`Pasted ${newRows.length} rows from clipboard`);
      setTimeout(() => setToast(null), 3000);
    }
  }, [entryFields]);

  const handleSave = () => {
    const validRows = rows
      .map(r => r._data)
      .filter(d => Object.values(d).some(v => v && String(v).trim()));

    if (validRows.length === 0) {
      setToast("No data to save — enter at least one row");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (onSaveBulk) {
      onSaveBulk(validRows);
    }
  };

  // Render dropdown/select for field
  const renderCellInput = (field, val, onChange) => {
    const f = field;
    const isDropdown = (f.fieldType === "dropdown" && f.opts) || (f.type === "select" && f.options);
    const isFK = (f.fieldType === "fk" || f.fieldType === "multifk") && f.fkData && f.fkData.length > 0;

    const base = {
      width: "100%", border: "none", outline: "none", padding: "4px 6px",
      fontSize: 11, background: "transparent", color: M.textA,
      fontFamily: f.mono ? (dff || "'IBM Plex Mono', monospace") : (uff || "'Nunito Sans', sans-serif"),
      boxSizing: "border-box",
    };

    if (isDropdown && f.opts) {
      return (
        <select style={{ ...base, cursor: "pointer" }} value={val || ""} onChange={e => onChange(e.target.value)}>
          <option value="">—</option>
          {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      );
    }
    if (f.type === "select" && f.options) {
      return (
        <select style={{ ...base, cursor: "pointer" }} value={val || ""} onChange={e => onChange(e.target.value)}>
          <option value="">—</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (isFK) {
      return (
        <select style={{ ...base, cursor: "pointer" }} value={val || ""} onChange={e => onChange(e.target.value)}>
          <option value="">—</option>
          {f.fkData.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      );
    }
    if (f.fieldType === "currency") {
      return <input type="number" step="0.01" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder="₹" />;
    }
    if (f.type === "number") {
      return <input type="number" style={base} value={val ?? ""} onChange={e => onChange(e.target.value)} placeholder="0" />;
    }
    return <input type="text" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder="..." />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }} onPaste={handlePaste}>
      {/* Toolbar */}
      <div style={{
        padding: "6px 14px", borderBottom: `1px solid ${M.divider}`,
        display: "flex", alignItems: "center", gap: 8, background: M.surfMid, flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: A.a, letterSpacing: 0.5, fontFamily: uff }}>
          BULK ENTRY
        </div>
        <div style={{ width: 1, height: 14, background: M.divider }} />
        <button onClick={addRow} style={{
          padding: "3px 10px", border: `1px solid ${A.a}40`, borderRadius: 4,
          background: A.al, color: A.a, fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff,
        }}>+ Add Row</button>
        <button onClick={() => addMultipleRows(5)} style={{
          padding: "3px 10px", border: `1px solid ${M.inputBd}`, borderRadius: 4,
          background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff,
        }}>+ Add 5 Rows</button>
        <button onClick={() => addMultipleRows(10)} style={{
          padding: "3px 10px", border: `1px solid ${M.inputBd}`, borderRadius: 4,
          background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff,
        }}>+ Add 10 Rows</button>
        <div style={{ width: 1, height: 14, background: M.divider }} />
        <span style={{ fontSize: 9, color: M.textC, fontWeight: 700, fontFamily: uff }}>
          {filledRows.length} / {rows.length} rows with data
        </span>
        <span style={{ fontSize: 8.5, color: M.textD, fontFamily: uff }}>
          Tip: Paste from Excel/Sheets (Ctrl+V)
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 9, color: M.textD, fontWeight: 700, fontFamily: uff,
        }}>
          {entryFields.length} fields per row
        </span>
      </div>

      {/* Spreadsheet Grid */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: entryFields.length * 130 + 80 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ background: A.a }}>
              <th style={{
                padding: "6px 8px", fontSize: 9, fontWeight: 900, color: "#fff",
                letterSpacing: 0.5, whiteSpace: "nowrap", fontFamily: uff,
                width: 36, textAlign: "center", position: "sticky", left: 0, background: A.a, zIndex: 11,
              }}>#</th>
              {entryFields.map(f => (
                <th key={f.key} style={{
                  padding: "6px 8px", fontSize: 9, fontWeight: 900, color: "#fff",
                  letterSpacing: 0.3, whiteSpace: "nowrap", fontFamily: uff,
                  textAlign: "left", minWidth: 110,
                  borderLeft: `1px solid rgba(255,255,255,0.15)`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ opacity: 0.7, fontSize: 8 }}>{f.col}</span>
                    <span>{f.label}</span>
                    {f.required && <span style={{ color: "#fbbf24" }}>*</span>}
                  </div>
                </th>
              ))}
              <th style={{
                padding: "6px 8px", fontSize: 9, fontWeight: 900, color: "#fff",
                width: 36, textAlign: "center", fontFamily: uff,
              }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const hasData = Object.values(row._data).some(v => v && String(v).trim());
              return (
                <tr key={row._id} style={{
                  background: ri % 2 === 0 ? M.tblEven : M.tblOdd,
                  borderBottom: `1px solid ${M.divider}`,
                }}>
                  <td style={{
                    padding: "4px 8px", fontFamily: dff, fontSize: 9, color: M.textD,
                    textAlign: "center", position: "sticky", left: 0,
                    background: ri % 2 === 0 ? M.tblEven : M.tblOdd,
                    borderRight: `1px solid ${M.divider}`,
                  }}>
                    {ri + 1}
                  </td>
                  {entryFields.map(f => {
                    const isActive = activeCell?.row === ri && activeCell?.col === f.key;
                    return (
                      <td
                        key={f.key}
                        onClick={() => setActiveCell({ row: ri, col: f.key })}
                        style={{
                          padding: 0, borderLeft: `1px solid ${M.divider}`,
                          background: isActive ? A.al : "transparent",
                          borderBottom: isActive ? `2px solid ${A.a}` : undefined,
                          minWidth: 110,
                        }}
                      >
                        {renderCellInput(f, row._data[f.key], (val) => updateCell(ri, f.key, val))}
                      </td>
                    );
                  })}
                  <td style={{
                    padding: "4px 4px", textAlign: "center",
                    borderLeft: `1px solid ${M.divider}`,
                  }}>
                    <button
                      onClick={() => removeRow(ri)}
                      style={{
                        border: "none", background: "transparent", color: M.textD,
                        fontSize: 11, cursor: "pointer", padding: "2px 4px", borderRadius: 3,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = M.textD; e.currentTarget.style.background = "transparent"; }}
                      title="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 14px", borderTop: `1px solid ${M.divider}`,
        display: "flex", alignItems: "center", gap: 8, background: M.surfMid, flexShrink: 0,
      }}>
        {filledRows.length > 0 && (
          <span style={{ fontSize: 9, color: A.a, fontWeight: 900, fontFamily: uff }}>
            {filledRows.length} record{filledRows.length > 1 ? "s" : ""} ready to save
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={clearAll} style={{
          padding: "6px 14px", border: `1px solid ${M.inputBd}`, borderRadius: 5,
          background: M.inputBg, color: M.textB, fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: uff,
        }}>
          ↺ Clear All
        </button>
        <button onClick={addRow} style={{
          padding: "6px 14px", border: `1px solid ${A.a}40`, borderRadius: 5,
          background: A.al, color: A.a, fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: uff,
        }}>
          + Add Row
        </button>
        <button onClick={handleSave} disabled={saving || filledRows.length === 0}
          style={{
            padding: "6px 20px", border: "none", borderRadius: 5,
            background: saving || filledRows.length === 0 ? M.textD : A.a,
            color: "#fff", fontSize: 10, fontWeight: 900,
            cursor: saving || filledRows.length === 0 ? "default" : "pointer", fontFamily: uff,
          }}>
          {saving ? "Saving…" : `✓ Save ${filledRows.length} Record${filledRows.length !== 1 ? "s" : ""}`}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)",
          background: M.textA, color: M.bg, padding: "10px 24px", borderRadius: 8,
          fontSize: 12, fontWeight: 800, fontFamily: uff, zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
