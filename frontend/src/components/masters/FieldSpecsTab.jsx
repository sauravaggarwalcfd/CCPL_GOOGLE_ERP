import { useState } from 'react';
import { DtBadge, IcoCell } from './helpers/fieldInput';

const FILTER_TABS = ["All Fields", "Mandatory", "Auto", "FK", "Manual"];

/**
 * FieldSpecsTab — browsable specification table for all fields in a master.
 * Props: { enriched, M, A, uff, dff }
 *   enriched — from enrichSchema()
 */
export default function FieldSpecsTab({ enriched, M, A, uff, dff }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Fields");
  const [expandedCol, setExpandedCol] = useState(null);

  const fields = (enriched?.fields || []).filter(f => {
    const matchSearch = !search
      || f.label.toLowerCase().includes(search.toLowerCase())
      || f.hint.toLowerCase().includes(search.toLowerCase())
      || f.key.toLowerCase().includes(search.toLowerCase());

    const matchFilter = (() => {
      switch (filter) {
        case "Mandatory": return f.required;
        case "Auto": return f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType);
        case "FK": return !!f.fk;
        case "Manual": return !f.auto && !f.fk && !['calc', 'auto', 'autocode'].includes(f.fieldType);
        default: return true;
      }
    })();

    return matchSearch && matchFilter;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 8, background: M.surfMid, flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: M.textD }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search fields…"
            style={{ border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textA, fontSize: 11, padding: "5px 9px 5px 26px", outline: "none", width: 180, fontFamily: uff }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {FILTER_TABS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{
                padding: "3px 11px", borderRadius: 20,
                border: `1.5px solid ${filter === t ? A.a : M.inputBd}`,
                background: filter === t ? A.a : M.inputBg,
                color: filter === t ? "#fff" : M.textB,
                fontSize: 9.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: uff,
              }}>
              {t}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 10, color: M.textC, fontWeight: 700, whiteSpace: "nowrap", fontFamily: dff }}>
          {fields.length} / {enriched?.totalCols} fields
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 30 }} />
            <col style={{ width: 34 }} />
            <col />
            <col style={{ width: 118 }} />
            <col style={{ width: 58 }} />
            <col style={{ width: 60 }} />
            <col style={{ width: 140 }} />
          </colgroup>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ background: A.a }}>
              {["COL", "#", "ICON", "FIELD HEADER", "DATA TYPE", "REQ?", "AUTO?", "FK LINK"].map(h => (
                <th key={h} style={{ padding: "7px 8px", textAlign: "left", fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 0.5, borderBottom: `2px solid ${A.a}`, whiteSpace: "nowrap", fontFamily: uff }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => {
              const isExp = expandedCol === f.col;
              const rowBg = isExp ? A.al : (i % 2 === 0 ? M.tblEven : M.tblOdd);
              return (
                <tr key={f.col} style={{ cursor: "pointer" }}>
                  <td colSpan={8} style={{ padding: 0, border: "none" }}>
                    {/* Main row */}
                    <div
                      onClick={() => setExpandedCol(isExp ? null : f.col)}
                      style={{ display: "grid", gridTemplateColumns: "36px 30px 34px 1fr 118px 58px 60px 140px", background: rowBg, borderBottom: `1px solid ${M.divider}`, alignItems: "center" }}
                      onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = M.hoverBg; }}
                      onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = rowBg; }}
                    >
                      <div style={{ padding: "7px 8px", fontFamily: dff, fontSize: 9.5, fontWeight: 700, color: M.textC }}>{f.col}</div>
                      <div style={{ padding: "7px 8px", fontFamily: dff, fontSize: 9, color: M.textD, textAlign: "center" }}>{i + 1}</div>
                      <div style={{ padding: "7px 8px", textAlign: "center" }}><IcoCell ico={f.ico} A={A} /></div>
                      <div style={{ padding: "7px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isExp ? A.a : M.textA, fontFamily: uff }}>{f.label || f.key}</span>
                          <span style={{ fontSize: 9, color: M.textD }}>▾</span>
                        </div>
                      </div>
                      <div style={{ padding: "7px 8px" }}><DtBadge type={f.fieldType} /></div>
                      <div style={{ padding: "7px 8px", textAlign: "center" }}>
                        {f.required
                          ? <span style={{ color: "#ef4444", fontWeight: 900, fontSize: 9 }}>⚠ YES</span>
                          : <span style={{ color: M.textD, fontSize: 9 }}>—</span>}
                      </div>
                      <div style={{ padding: "7px 8px", textAlign: "center" }}>
                        {(f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType))
                          ? <span style={{ color: "#059669", fontWeight: 900, fontSize: 9 }}>GAS ✓</span>
                          : <span style={{ color: M.textD, fontSize: 9 }}>—</span>}
                      </div>
                      <div style={{ padding: "7px 8px" }}>
                        {f.fk
                          ? <span style={{ fontSize: 9, fontWeight: 900, color: "#2563eb", fontFamily: dff }}>{f.fk}</span>
                          : <span style={{ color: M.textD, fontSize: 9 }}>—</span>}
                      </div>
                    </div>
                    {/* Expanded hint row */}
                    {isExp && (
                      <div style={{ background: A.al, padding: "8px 14px 12px 54px", borderBottom: `2px solid ${A.a}30` }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 8.5, fontWeight: 900, color: A.a, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3, fontFamily: uff }}>ENTRY INSTRUCTIONS</div>
                            <div style={{ fontSize: 11, color: M.textA, lineHeight: 1.65, fontWeight: 600, fontFamily: uff }}>{f.hint}</div>
                          </div>
                          <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                            <span style={{ padding: "2px 7px", background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 3, fontSize: 9, color: M.textC, fontFamily: dff }}>Col {f.col}</span>
                            <DtBadge type={f.fieldType} />
                          </div>
                        </div>
                      </div>
                    )}
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
