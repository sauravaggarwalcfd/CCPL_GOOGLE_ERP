import { useState, useEffect, useRef, useCallback, Fragment } from "react";

// ── Theme token adapter: maps app tokens → short keys used internally ──
function toM(M) {
  return {
    ...M, bg: M.bg,
    hi: M.surfHigh, mid: M.surfMid, lo: M.surfLow,
    hov: M.hoverBg, inBg: M.inputBg, inBd: M.inputBd,
    div: M.divider, thd: M.tblHead, tev: M.tblEven, tod: M.tblOdd,
    tA: M.textA, tB: M.textB, tC: M.textC, tD: M.textD,
    bBg: M.badgeBg, bTx: M.badgeTx, scr: M.scrollThumb,
  };
}

// ── Build master object from enriched schema ──
function adaptMaster(enriched, sheet) {
  return {
    id: enriched.id || sheet?.key || "master",
    label: sheet?.name || enriched.id || "Master",
    desc: sheet?.desc || "",
    icon: sheet?.icon || "📋",
    fields: enriched.fields.map(f => ({
      col: f.col,
      h: f.label || f.header || f.key,
      type: f.fieldType || f.type || "text",
      req: !!f.required,
      auto: !!f.auto || ["calc", "autocode", "auto"].includes(f.fieldType),
      opts: f.opts || (f.options ? f.options.map(o => typeof o === "string" ? { v: o, l: o } : o) : null),
      fk: f.fk || null,
      fkData: f.fkData || null,
      hint: f.hint || "",
      ico: f.ico || "_",
    })),
    mockRecords: [],
  };
}

// ── Build FK lookup map from enriched fields ──
function buildFKMap(enriched) {
  const map = {};
  enriched.fields.forEach(f => {
    if (f.fk && f.fkData && f.fkData.length > 0) {
      map[f.fk] = f.fkData;
    }
  });
  return map;
}

// ── Field type badges ──
const DT_MAP = {
  manual:   { bg: "#fff1f2", tx: "#9f1239", bd: "#fecdd3" },
  autocode: { bg: "#ede9fe", tx: "#6d28d9", bd: "#c4b5fd" },
  calc:     { bg: "#fff7ed", tx: "#c2410c", bd: "#fed7aa" },
  auto:     { bg: "#f0fdf4", tx: "#166534", bd: "#bbf7d0" },
  fk:       { bg: "#eff6ff", tx: "#1d4ed8", bd: "#bfdbfe" },
  multifk:  { bg: "#eef2ff", tx: "#4338ca", bd: "#c7d2fe" },
  dropdown: { bg: "#f0f9ff", tx: "#0369a1", bd: "#bae6fd" },
  text:     { bg: "#fafafa", tx: "#374151", bd: "#e5e7eb" },
  currency: { bg: "#fefce8", tx: "#854d0e", bd: "#fde68a" },
  number:   { bg: "#f0fdf4", tx: "#166534", bd: "#bbf7d0" },
  url:      { bg: "#f0fdfa", tx: "#0f766e", bd: "#99f6e4" },
  textarea: { bg: "#fafafa", tx: "#374151", bd: "#e5e7eb" },
};
const DT_LABEL = {
  manual: "Manual", autocode: "AUTO #", calc: "Calc", auto: "Auto", fk: "FK",
  multifk: "Multi-FK", dropdown: "Dropdown", text: "Text", currency: "Rs",
  number: "Number", url: "URL", textarea: "Text Area",
};

function DtBadge({ type }) {
  const d = DT_MAP[type] || DT_MAP.text;
  return (
    <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: 3, background: d.bg, color: d.tx, border: "1px solid " + d.bd, fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>
      {DT_LABEL[type] || type}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Aggregation
// ═══════════════════════════════════════════════════════════════
const AGG_OPTIONS = [
  { v: "none",           l: "—",              grp: "" },
  { v: "count",          l: "Count all",      grp: "Count" },
  { v: "count_values",   l: "Count values",   grp: "Count" },
  { v: "count_empty",    l: "Count empty",    grp: "Count" },
  { v: "unique",         l: "Unique values",  grp: "Count" },
  { v: "sum",            l: "Sum",            grp: "Calculate" },
  { v: "avg",            l: "Average",        grp: "Calculate" },
  { v: "min",            l: "Min",            grp: "Calculate" },
  { v: "max",            l: "Max",            grp: "Calculate" },
  { v: "range",          l: "Range (max−min)", grp: "Calculate" },
  { v: "median",         l: "Median",         grp: "Calculate" },
  { v: "percent_filled", l: "% Filled",       grp: "Percent" },
  { v: "percent_empty",  l: "% Empty",        grp: "Percent" },
];

function computeAgg(fn, rows, col, allFields) {
  const vals = rows.map(r => r[col]);
  const nonempty = vals.filter(v => v != null && v !== "");
  const nums = nonempty.map(v => parseFloat(v)).filter(n => !isNaN(n));
  switch (fn) {
    case "none": return null;
    case "count": return rows.length;
    case "count_values": return nonempty.length;
    case "count_empty": return vals.length - nonempty.length;
    case "unique": return new Set(nonempty.map(v => String(v))).size;
    case "sum": return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
    case "avg": return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    case "min": return nums.length ? Math.min(...nums) : (nonempty.length ? nonempty.sort()[0] : null);
    case "max": return nums.length ? Math.max(...nums) : (nonempty.length ? nonempty.sort().slice(-1)[0] : null);
    case "range": return nums.length >= 2 ? Math.max(...nums) - Math.min(...nums) : null;
    case "median": {
      if (!nums.length) return null;
      const s = [...nums].sort((a, b) => a - b), m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    case "percent_filled": return rows.length ? ((nonempty.length / rows.length) * 100) : null;
    case "percent_empty": return rows.length ? (((rows.length - nonempty.length) / rows.length) * 100) : null;
    default: return null;
  }
}

function fmtAgg(fn, val, allFields, col) {
  if (val === null || val === undefined) return "—";
  const f = allFields.find(x => x.col === col);
  const isCur = f?.type === "currency";
  if (["percent_filled", "percent_empty"].includes(fn)) return val.toFixed(1) + "%";
  if (typeof val === "number") {
    return isCur ? "₹" + val.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : val % 1 === 0 ? val.toLocaleString("en-IN")
        : val.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return String(val);
}

const AGG_COLORS = {
  count: "#0078D4", count_values: "#0078D4", count_empty: "#6b7280", unique: "#7C3AED",
  sum: "#15803d", avg: "#E8690A", min: "#0e7490", max: "#7c2d12",
  range: "#4338ca", median: "#0891b2", percent_filled: "#15803d", percent_empty: "#6b7280",
};

// ── AggDropdown — fixed position, sibling to table ──
function AggDropdown({ openInfo, aggState, setAggState, visRows, allFields, onClose, M }) {
  if (!openInfo) return null;
  const { col, top, left } = openInfo;
  const fn = aggState?.[col] || "none";
  const val = fn === "none" ? null : computeAgg(fn, visRows, col, allFields);
  const fmted = fmtAgg(fn, val, allFields, col);
  const handlePick = (v) => { setAggState(p => ({ ...p, [col]: v })); onClose(); };

  return (
    <div onMouseDown={e => e.stopPropagation()} style={{
      position: "fixed", top, left, width: 224, zIndex: 9999,
      background: M.hi, border: "1.5px solid #c4b5fd", borderRadius: 10,
      boxShadow: "0 16px 48px rgba(0,0,0,.32)", overflow: "hidden",
      display: "flex", flexDirection: "column", maxHeight: 400,
    }}>
      <div style={{ padding: "8px 12px", background: "#1e293b", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {allFields.find(f => f.col === col)?.h || col}
          </div>
          <div style={{ fontSize: 7.5, color: "#64748b", fontFamily: "monospace", marginTop: 1 }}>{col}</div>
        </div>
        {fn !== "none" && val !== null && (
          <span style={{ background: AGG_COLORS[fn] || "#7C3AED", color: "#fff", borderRadius: 5, padding: "2px 8px", fontSize: 9, fontWeight: 900, fontFamily: "monospace" }}>{fmted}</span>
        )}
        <button onClick={onClose} style={{ marginLeft: 4, padding: "2px 6px", border: "none", background: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 900 }}>✕</button>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {["", "Count", "Calculate", "Percent"].map(grp => {
          const opts = AGG_OPTIONS.filter(o => o.grp === grp);
          return (
            <Fragment key={grp}>
              {grp && <div style={{ padding: "6px 12px 3px", fontSize: 8, fontWeight: 900, color: "#7C3AED", letterSpacing: 1, textTransform: "uppercase", borderTop: "1px solid #e8e0fb", background: "#f9f7ff" }}>{grp}</div>}
              {opts.map(opt => {
                const isAct = fn === opt.v; const oc = AGG_COLORS[opt.v];
                return (
                  <button key={opt.v} onClick={() => handlePick(opt.v)} style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 14px", border: "none",
                    background: isAct ? (oc || "#7C3AED") + "18" : "transparent",
                    color: isAct ? (oc || "#7C3AED") : M.tB,
                    fontSize: 10.5, fontWeight: isAct ? 900 : 500, cursor: "pointer", textAlign: "left",
                    borderLeft: isAct ? "3px solid " + (oc || "#7C3AED") : "3px solid transparent",
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: isAct ? (oc || "#7C3AED") : "#e5e7eb", border: isAct ? "none" : "1px solid #d1d5db" }} />
                    <span style={{ flex: 1 }}>{opt.l}</span>
                    {isAct && val !== null && <span style={{ fontFamily: "monospace", fontSize: 9, color: oc || "#7C3AED", background: (oc || "#7C3AED") + "18", borderRadius: 4, padding: "1px 5px" }}>{fmted}</span>}
                  </button>
                );
              })}
            </Fragment>
          );
        })}
      </div>
      <div style={{ padding: "6px 10px", borderTop: "1px solid #e8e0fb", background: "#f5f3ff", display: "flex", gap: 6, flexShrink: 0 }}>
        {fn !== "none" && <button onClick={() => handlePick("none")} style={{ flex: 1, padding: "5px 0", border: "1px solid #fecaca", borderRadius: 5, background: "#fef2f2", color: "#dc2626", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>✕ Remove</button>}
        <button onClick={onClose} style={{ flex: 1, padding: "5px 0", border: "1px solid #c4b5fd", borderRadius: 5, background: "#ede9fe", color: "#7C3AED", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}

// ── AggFooter — pure tfoot row ──
function AggFooter({ visRows, visCols, allFields, aggState, openCol, onCellClick, hasCheckbox, M }) {
  const btnRefs = useRef({});
  return (
    <tfoot>
      <tr style={{ background: M.mid, borderTop: "2px solid " + M.div }}>
        {hasCheckbox && <td style={{ padding: "4px 6px", borderRight: "1px solid " + M.div }} />}
        <td style={{ padding: "4px 8px", borderRight: "1px solid " + M.div, fontSize: 8, fontWeight: 900, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", whiteSpace: "nowrap", verticalAlign: "middle", background: "#ede9fe" }}>
          Σ AGG
        </td>
        {visCols.map(col => {
          const fn = aggState?.[col] || "none";
          const val = fn === "none" ? null : computeAgg(fn, visRows, col, allFields);
          const fmted = fmtAgg(fn, val, allFields, col);
          const color = AGG_COLORS[fn] || "#9ca3af";
          const isOpen = openCol === col;
          return (
            <td key={col} style={{ padding: "2px 4px", borderRight: "1px solid " + M.div, verticalAlign: "middle", minWidth: 80 }}>
              <button
                ref={el => { if (el) btnRefs.current[col] = el; }}
                onClick={() => onCellClick(col, btnRefs.current[col])}
                style={{
                  width: "100%", padding: "3px 6px", borderRadius: 4, cursor: "pointer",
                  border: "1.5px solid " + (fn !== "none" ? color : "#e5e7eb"),
                  background: fn !== "none" ? (color + "18") : "transparent",
                  color: fn !== "none" ? color : "#9ca3af",
                  fontSize: 9, fontWeight: fn !== "none" ? 900 : 500,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                  whiteSpace: "nowrap",
                  outline: isOpen ? "2px solid " + (fn !== "none" ? color : "#7C3AED") : "none",
                  outlineOffset: 1,
                }}>
                {fn === "none"
                  ? <><span style={{ fontSize: 11, opacity: .35 }}>+</span><span style={{ fontSize: 7.5, opacity: .35 }}>Calculate</span></>
                  : <><span style={{ fontFamily: "monospace", fontSize: 10 }}>{fmted}</span>
                    <span style={{ fontSize: 7, opacity: .6, marginLeft: 2 }}>{AGG_OPTIONS.find(o => o.v === fn)?.l}</span></>
                }
              </button>
            </td>
          );
        })}
        <td style={{ background: "#ede9fe" }} />
      </tr>
    </tfoot>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SortPanel — Notion-style multi-level sort with drag reorder
// ═══════════════════════════════════════════════════════════════
function SortPanel({ sorts, setSorts, allFields, M, A, onClose }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [expanded, setExpanded] = useState({});

  const fieldType = col => {
    const f = allFields.find(x => x.col === col);
    if (!f) return "alpha";
    if (["currency", "number", "calc"].includes(f.type)) return "numeric";
    if (f.type === "date") return "date";
    return "alpha";
  };

  const dirLabel = (type, dir) => {
    if (type === "numeric") return dir === "asc" ? "1 → 9" : "9 → 1";
    if (type === "date") return dir === "asc" ? "Oldest" : "Newest";
    if (type === "length") return dir === "asc" ? "Shortest" : "Longest";
    return dir === "asc" ? "A → Z" : "Z → A";
  };

  const addSort = col => {
    if (!col || sorts.find(s => s.col === col)) return;
    setSorts(p => [...p, { col, dir: "asc", type: "auto", nulls: "last" }]);
  };
  const updateSort = (idx, patch) => setSorts(p => p.map((s, i) => i === idx ? { ...s, ...patch } : s));
  const removeSort = idx => setSorts(p => p.filter((_, i) => i !== idx));
  const moveSort = (from, to) => {
    if (from === to) return;
    setSorts(p => { const a = [...p]; const [item] = a.splice(from, 1); a.splice(to, 0, item); return a; });
  };

  const onDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const onDrop = (e, i) => { e.preventDefault(); moveSort(dragIdx, i); setDragIdx(null); setOverIdx(null); };
  const onDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  const presets = [
    { lbl: "Name A→Z", icon: "🔤", sorts: [{ col: allFields[0]?.col || "A", dir: "asc", type: "auto", nulls: "last" }] },
    { lbl: "Name Z→A", icon: "🔤", sorts: [{ col: allFields[0]?.col || "A", dir: "desc", type: "auto", nulls: "last" }] },
    { lbl: "Code ↑", icon: "🔢", sorts: [{ col: allFields.find(f => f.type === "autocode" || f.type === "manual")?.col || allFields[0]?.col, dir: "asc", type: "alpha", nulls: "last" }] },
    { lbl: "Clear All", icon: "✕", sorts: [] },
  ];

  const resolvedType = s => s.type === "auto" ? fieldType(s.col) : s.type;
  const TYPE_OPTIONS = [
    { v: "auto", l: "Auto-detect" }, { v: "alpha", l: "Text (A→Z)" },
    { v: "numeric", l: "Number" }, { v: "date", l: "Date" }, { v: "length", l: "Text length" },
  ];
  const available = allFields.filter(f => !sorts.find(s => s.col === f.col));

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", pointerEvents: "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.18)", pointerEvents: "all" }} />
      <div style={{ position: "relative", pointerEvents: "all", width: 440, maxHeight: "100%", overflowY: "auto", background: M.hi, borderLeft: "2px solid #7C3AED", boxShadow: "-4px 0 24px rgba(0,0,0,.18)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid " + M.div, display: "flex", alignItems: "center", gap: 8, background: "#7C3AED", flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>↕</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: .3 }}>Sort</span>
          <span style={{ background: "rgba(255,255,255,.25)", color: "#fff", borderRadius: 8, padding: "1px 7px", fontSize: 9, fontWeight: 900 }}>{sorts.length} rule{sorts.length !== 1 ? "s" : ""}</span>
          <div style={{ flex: 1 }} />
          {sorts.length > 0 && <button onClick={() => setSorts([])} style={{ padding: "4px 10px", border: "1.5px solid rgba(255,255,255,.4)", borderRadius: 5, background: "transparent", color: "#fff", fontSize: 9, fontWeight: 800, cursor: "pointer" }}>✕ Clear all</button>}
          <button onClick={onClose} style={{ padding: "4px 8px", border: "none", borderRadius: 5, background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>✕</button>
        </div>
        {/* Quick Presets */}
        <div style={{ padding: "8px 14px", borderBottom: "1px solid " + M.div, display: "flex", gap: 5, flexWrap: "wrap", flexShrink: 0, background: M.mid }}>
          <span style={{ fontSize: 8, fontWeight: 900, color: M.tD, letterSpacing: .8, textTransform: "uppercase", alignSelf: "center", marginRight: 4 }}>QUICK:</span>
          {presets.map((p, pi) => (
            <button key={pi} onClick={() => setSorts(p.sorts)}
              style={{ padding: "3px 10px", borderRadius: 5, border: "1.5px solid " + (pi === presets.length - 1 ? "#fecaca" : "#c4b5fd"), background: pi === presets.length - 1 ? "#fef2f2" : "#f5f3ff", color: pi === presets.length - 1 ? "#dc2626" : "#7C3AED", fontSize: 9, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{p.icon}</span>{p.lbl}
            </button>
          ))}
        </div>
        {/* Empty state */}
        {sorts.length === 0 && (
          <div style={{ padding: "32px 16px", textAlign: "center", color: M.tD }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>↕</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: M.tB, marginBottom: 4 }}>No sort rules</div>
            <div style={{ fontSize: 10, color: M.tD }}>Add a column below to sort your records</div>
          </div>
        )}
        {/* Rules list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {sorts.map((s, idx) => {
            const f = allFields.find(x => x.col === s.col);
            const rtype = resolvedType(s);
            const isExp = expanded[idx];
            const isDrag = dragIdx === idx;
            const isOver = overIdx === idx && dragIdx !== idx;
            return (
              <div key={s.col + idx} draggable onDragStart={e => onDragStart(e, idx)} onDragOver={e => onDragOver(e, idx)} onDrop={e => onDrop(e, idx)} onDragEnd={onDragEnd}
                style={{ margin: "2px 10px", borderRadius: 8, border: "1.5px solid " + (isOver ? "#7C3AED" : isDrag ? "#c4b5fd" : M.div), background: isOver ? "#ede9fe" : isDrag ? "#f5f3ff" : M.hi, opacity: isDrag ? .5 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px" }}>
                  <span title="Drag to reorder" style={{ cursor: "grab", fontSize: 14, color: M.tD, userSelect: "none", flexShrink: 0 }}>⠿</span>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#7C3AED", color: "#fff", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{idx + 1}</div>
                  {idx > 0 && <span style={{ fontSize: 8, fontWeight: 700, color: M.tD, flexShrink: 0 }}>then by</span>}
                  <select value={s.col} onChange={e => { const nc = e.target.value; if (!nc || sorts.find((x, i) => x.col === nc && i !== idx)) return; updateSort(idx, { col: nc, type: "auto" }); }}
                    style={{ flex: 1, padding: "5px 8px", border: "1.5px solid " + M.inBd, borderRadius: 6, background: M.inBg, color: M.tA, fontSize: 10, fontWeight: 700, cursor: "pointer", outline: "none", minWidth: 0 }}>
                    <option value={s.col}>{f?.h || s.col} [{s.col}]</option>
                    {available.map(af => <option key={af.col} value={af.col}>{af.h} [{af.col}]</option>)}
                  </select>
                  <button onClick={() => updateSort(idx, { dir: s.dir === "asc" ? "desc" : "asc" })}
                    style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #c4b5fd", background: "#f5f3ff", color: "#6d28d9", fontSize: 9, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {dirLabel(rtype, s.dir)}<span style={{ marginLeft: 4 }}>{s.dir === "asc" ? "↑" : "↓"}</span>
                  </button>
                  <button onClick={() => setExpanded(p => ({ ...p, [idx]: !p[idx] }))} title="Advanced options"
                    style={{ padding: "4px 6px", borderRadius: 5, border: "1px solid " + M.div, background: isExp ? "#ede9fe" : M.inBg, color: isExp ? "#7C3AED" : M.tD, fontSize: 10, cursor: "pointer", flexShrink: 0 }}>
                    {isExp ? "▲" : "▼"}
                  </button>
                  <button onClick={() => { removeSort(idx); setExpanded(p => { const n = { ...p }; delete n[idx]; return n; }); }}
                    style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 900, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
                {isExp && (
                  <div style={{ borderTop: "1px dashed " + M.div, padding: "8px 10px 10px 42px", background: M.mid, borderRadius: "0 0 7px 7px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: M.tD, letterSpacing: .6, textTransform: "uppercase" }}>Sort type</span>
                      <select value={s.type} onChange={e => updateSort(idx, { type: e.target.value })}
                        style={{ padding: "4px 7px", border: "1px solid #c4b5fd", borderRadius: 5, background: "#f5f3ff", color: "#6d28d9", fontSize: 9, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                        {TYPE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: M.tD, letterSpacing: .6, textTransform: "uppercase" }}>Empty values</span>
                      <div style={{ display: "flex", borderRadius: 5, overflow: "hidden", border: "1px solid #c4b5fd" }}>
                        {["last", "first"].map(v => (
                          <button key={v} onClick={() => updateSort(idx, { nulls: v })}
                            style={{ padding: "4px 10px", border: "none", background: s.nulls === v ? "#7C3AED" : "#f5f3ff", color: s.nulls === v ? "#fff" : "#6d28d9", fontSize: 9, fontWeight: s.nulls === v ? 900 : 700, cursor: "pointer" }}>
                            {v === "last" ? "Nulls last" : "Nulls first"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: M.tD, letterSpacing: .6, textTransform: "uppercase" }}>Priority</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => idx > 0 && moveSort(idx, idx - 1)} disabled={idx === 0}
                          style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid " + M.inBd, background: M.inBg, color: idx === 0 ? M.tD : M.tB, fontSize: 10, cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? .4 : 1 }}>↑</button>
                        <button onClick={() => idx < sorts.length - 1 && moveSort(idx, idx + 1)} disabled={idx === sorts.length - 1}
                          style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid " + M.inBd, background: M.inBg, color: idx === sorts.length - 1 ? M.tD : M.tB, fontSize: 10, cursor: idx === sorts.length - 1 ? "default" : "pointer", opacity: idx === sorts.length - 1 ? .4 : 1 }}>↓</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Add sort rule */}
        <div style={{ padding: "10px 14px", borderTop: "1px solid " + M.div, flexShrink: 0, background: M.mid }}>
          <select value="" onChange={e => { addSort(e.target.value); e.target.value = ""; }}
            style={{ width: "100%", padding: "8px 12px", border: "2px dashed #c4b5fd", borderRadius: 7, background: "#f5f3ff", color: "#7C3AED", fontSize: 10, fontWeight: 900, cursor: "pointer", outline: "none", textAlign: "left" }}>
            <option value="">+ Pick a column to sort by…</option>
            {available.map(f => (
              <option key={f.col} value={f.col}>{f.col} — {f.h}{["currency", "number", "calc"].includes(f.type) ? " (Number)" : f.type === "date" ? " (Date)" : ""}</option>
            ))}
          </select>
        </div>
        {/* Active sort summary */}
        {sorts.length > 0 && (
          <div style={{ padding: "6px 14px", borderTop: "1px solid " + M.div, background: M.lo, flexShrink: 0 }}>
            <div style={{ fontSize: 8, fontWeight: 900, color: M.tD, letterSpacing: .6, textTransform: "uppercase", marginBottom: 3 }}>Active sort order</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {sorts.map((s, i) => {
                const rt = resolvedType(s);
                return (
                  <span key={i} style={{ background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 4, padding: "2px 7px", fontSize: 8, fontWeight: 800, color: "#6d28d9", display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ background: "#7C3AED", color: "#fff", borderRadius: "50%", width: 12, height: 12, fontSize: 7, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    {allFields.find(x => x.col === s.col)?.h || s.col}
                    <span style={{ opacity: .7 }}>{dirLabel(rt, s.dir)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ViewEditModal — 4-tab view settings editor ──
function ViewEditModal({ allFields, allCols, initial, isNew, isDup, existingNames, onSave, onCancel, M, fz }) {
  const [name, setName] = useState(initial.name);
  const [hiddenC, setHiddenC] = useState([...(initial.hiddenC || [])]);
  const [colOrder, setColOrder] = useState([...(initial.colOrder || allCols)]);
  const [sorts, setSorts] = useState([...(initial.sorts || [])]);
  const [filters, setFilters] = useState({ ...(initial.filters || {}) });
  const [groupBy, setGroupBy] = useState(initial.groupBy || null);
  const [subGroupBy, setSubGroupBy] = useState(initial.subGroupBy || null);
  const [activeTab, setActiveTab] = useState("columns");

  const nameConflict = existingNames.includes(name.trim());
  const canSave = name.trim().length > 0 && !nameConflict;

  const toggleHide = col => setHiddenC(p => p.includes(col) ? p.filter(c => c !== col) : [...p, col]);
  const moveColUp = col => setColOrder(p => { const a = [...p], i = a.indexOf(col); if (i <= 0) return a; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; });
  const moveColDown = col => setColOrder(p => { const a = [...p], i = a.indexOf(col); if (i < 0 || i >= a.length - 1) return a; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a; });

  const TAB_STYLE = (t) => ({
    padding: "6px 14px", border: "none", cursor: "pointer", fontSize: 10, fontWeight: activeTab === t ? 900 : 700,
    borderBottom: "2px solid " + (activeTab === t ? "#7C3AED" : "transparent"),
    background: "transparent", color: activeTab === t ? "#7C3AED" : M.tC,
  });

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(3px)", zIndex: 2000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 660, maxHeight: "85vh", background: M.hi, border: "1px solid #c4b5fd", borderRadius: 12, zIndex: 2001, boxShadow: "0 8px 40px rgba(0,0,0,.4)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "#7C3AED", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>{isDup ? "⧉" : "✏"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{isDup ? "Duplicate View" : "Edit Saved View"}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.75)" }}>Change name, columns, sorts, filters, group</div>
          </div>
          <button onClick={onCancel} style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(255,255,255,.2)", color: "#fff", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
        {/* Name row */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid " + M.div, background: M.mid, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, textTransform: "uppercase", letterSpacing: .8, flexShrink: 0 }}>VIEW NAME *</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter view name…"
            style={{ flex: 1, border: "2px solid " + (nameConflict ? "#ef4444" : name.trim() ? "#7C3AED" : M.inBd), borderRadius: 6, background: M.inBg, color: M.tA, fontSize: 13, padding: "6px 10px", outline: "none", fontWeight: 700 }} />
          {nameConflict && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>{name.trim().toLowerCase() === "default" ? '"Default" is reserved' : "Name already exists"}</span>}
        </div>
        {/* Sub-tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid " + M.div, background: M.hi, flexShrink: 0 }}>
          {[
            { id: "columns", lbl: "⊟ Columns", badge: hiddenC.length > 0 ? `${hiddenC.length} hidden` : `${colOrder.length}` },
            { id: "sort", lbl: "↕ Sort", badge: sorts.length > 0 ? `${sorts.length} active` : null },
            { id: "filter", lbl: "🔍 Filter", badge: Object.values(filters).filter(v => v.trim()).length > 0 ? `${Object.values(filters).filter(v => v.trim()).length} active` : null },
            { id: "group", lbl: "⊞ Group", badge: groupBy ? allFields.find(f => f.col === groupBy)?.h?.slice(0, 12) || groupBy : null },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={TAB_STYLE(t.id)}>
              {t.lbl}
              {t.badge && <span style={{ marginLeft: 5, background: activeTab === t.id ? "#7C3AED" : "#e0e7ef", color: activeTab === t.id ? "#fff" : "#374151", borderRadius: 10, padding: "1px 6px", fontSize: 8, fontWeight: 900 }}>{t.badge}</span>}
            </button>
          ))}
        </div>
        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* COLUMNS */}
          {activeTab === "columns" && (
            <div style={{ padding: 12 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, textTransform: "uppercase", letterSpacing: .8 }}>Toggle visibility</span>
                <button onClick={() => setHiddenC([])} style={{ padding: "3px 9px", border: "1px solid " + M.inBd, borderRadius: 4, background: M.inBg, color: M.tB, fontSize: 9, fontWeight: 800, cursor: "pointer", marginLeft: "auto" }}>Show All</button>
                <button onClick={() => setHiddenC([...allCols])} style={{ padding: "3px 9px", border: "1px solid " + M.inBd, borderRadius: 4, background: M.inBg, color: M.tB, fontSize: 9, fontWeight: 800, cursor: "pointer" }}>Hide All</button>
              </div>
              <div style={{ border: "1px solid " + M.div, borderRadius: 7, overflow: "hidden" }}>
                {colOrder.map((col, idx) => {
                  const f = allFields.find(x => x.col === col);
                  const isHidden = hiddenC.includes(col);
                  return (
                    <div key={col} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderBottom: "1px solid " + M.div, background: isHidden ? M.lo : M.hi, opacity: isHidden ? .55 : 1 }}>
                      <button onClick={() => toggleHide(col)} style={{ width: 28, height: 18, borderRadius: 9, border: "none", cursor: "pointer", background: isHidden ? "#d1d5db" : "#7C3AED", position: "relative", flexShrink: 0 }}>
                        <span style={{ position: "absolute", top: 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", left: isHidden ? 2 : 12 }} />
                      </button>
                      <span style={{ fontFamily: "monospace", fontSize: 8, fontWeight: 700, color: M.tD, width: 20, flexShrink: 0 }}>{col}</span>
                      <span style={{ flex: 1, fontSize: fz - 2, fontWeight: 700, color: isHidden ? M.tD : M.tA }}>{f?.h || col}</span>
                      {f && <DtBadge type={f.type} />}
                      <button onClick={() => moveColUp(col)} disabled={idx === 0} style={{ width: 18, height: 18, borderRadius: 3, border: "none", background: idx === 0 ? M.lo : M.mid, color: idx === 0 ? M.tD : M.tB, cursor: idx === 0 ? "default" : "pointer", fontSize: 10 }}>↑</button>
                      <button onClick={() => moveColDown(col)} disabled={idx === colOrder.length - 1} style={{ width: 18, height: 18, borderRadius: 3, border: "none", background: idx === colOrder.length - 1 ? M.lo : M.mid, color: idx === colOrder.length - 1 ? M.tD : M.tB, cursor: idx === colOrder.length - 1 ? "default" : "pointer", fontSize: 10 }}>↓</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* SORT */}
          {activeTab === "sort" && (
            <div style={{ padding: 12 }}>
              <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, textTransform: "uppercase", letterSpacing: .8 }}>Multi-level sort</span>
                {sorts.length > 0 && <button onClick={() => setSorts([])} style={{ marginLeft: "auto", padding: "3px 9px", border: "1px solid #c4b5fd", borderRadius: 4, background: "#ede9fe", color: "#6d28d9", fontSize: 9, fontWeight: 800, cursor: "pointer" }}>Clear All</button>}
              </div>
              {sorts.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 11, color: M.tD, background: M.lo, borderRadius: 7 }}>No sorts — add a column below</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {sorts.map((s, i) => {
                  const f = allFields.find(x => x.col === s.col);
                  return (
                    <div key={s.col} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 7 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: "#6d28d9", minWidth: 18 }}>{i + 1}.</span>
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: M.tA }}>{f?.h || s.col} <span style={{ fontFamily: "monospace", fontSize: 8, color: M.tD }}>({s.col})</span></span>
                      <button onClick={() => setSorts(p => p.map(x => x.col === s.col ? { ...x, dir: x.dir === "asc" ? "desc" : "asc" } : x))} style={{ padding: "4px 12px", border: "1.5px solid #7C3AED", borderRadius: 5, background: "#fff", color: "#7C3AED", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
                        {s.dir === "asc" ? "↑ A → Z" : "↓ Z → A"}
                      </button>
                      <button onClick={() => setSorts(p => p.filter(x => x.col !== s.col))} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 13, fontWeight: 900 }}>×</button>
                    </div>
                  );
                })}
              </div>
              <select onChange={e => { if (e.target.value) { setSorts(p => [...p, { col: e.target.value, dir: "asc", type: "auto", nulls: "last" }]); } e.target.value = ""; }} value=""
                style={{ padding: "6px 10px", border: "1.5px solid #c4b5fd", borderRadius: 6, background: "#fdf4ff", color: "#7C3AED", fontSize: 10, fontWeight: 900, outline: "none", cursor: "pointer", width: "100%" }}>
                <option value="">+ Add sort column…</option>
                {allFields.filter(f => !sorts.find(s => s.col === f.col)).map(f => (
                  <option key={f.col} value={f.col}>{f.col} — {f.h}</option>
                ))}
              </select>
            </div>
          )}
          {/* FILTER */}
          {activeTab === "filter" && (
            <div style={{ padding: 12 }}>
              <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, textTransform: "uppercase", letterSpacing: .8 }}>Filter values — text match per column</span>
                {Object.values(filters).some(v => v.trim()) && <button onClick={() => setFilters({})} style={{ marginLeft: "auto", padding: "3px 9px", border: "1px solid " + M.inBd, borderRadius: 4, background: M.inBg, color: M.tB, fontSize: 9, fontWeight: 800, cursor: "pointer" }}>Clear All</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {allFields.filter(f => !f.auto && !["calc", "autocode"].includes(f.type)).map(f => (
                  <div key={f.col} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid " + (filters[f.col]?.trim() ? "#7C3AED" : M.div), borderRadius: 7, background: filters[f.col]?.trim() ? "#ede9fe" : M.hi }}>
                    <span style={{ fontFamily: "monospace", fontSize: 8, fontWeight: 900, color: M.tD, width: 22, flexShrink: 0 }}>{f.col}</span>
                    <span style={{ fontSize: fz - 2, fontWeight: 700, color: M.tB, width: 130, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.h}</span>
                    <DtBadge type={f.type} />
                    <input value={filters[f.col] || ""} onChange={e => setFilters(p => ({ ...p, [f.col]: e.target.value }))} placeholder="contains…"
                      style={{ flex: 1, border: "1px solid " + M.inBd, borderRadius: 5, background: M.inBg, color: M.tA, fontSize: 10, padding: "4px 8px", outline: "none" }} />
                    {filters[f.col] && <button onClick={() => setFilters(p => { const n = { ...p }; delete n[f.col]; return n; })} style={{ width: 20, height: 20, borderRadius: 4, border: "none", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 900 }}>×</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* GROUP */}
          {activeTab === "group" && (
            <div style={{ padding: 12 }}>
              <div style={{ marginBottom: 10, fontSize: 9, fontWeight: 900, color: M.tD, textTransform: "uppercase", letterSpacing: .8 }}>Group rows by a column</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div onClick={() => setGroupBy(null)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "2px solid " + (groupBy === null ? "#7C3AED" : M.div), borderRadius: 7, cursor: "pointer", background: groupBy === null ? "#ede9fe" : M.hi }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid " + (groupBy === null ? "#7C3AED" : M.inBd), background: groupBy === null ? "#7C3AED" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {groupBy === null && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>●</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: groupBy === null ? "#6d28d9" : M.tB }}>No grouping — show flat list</span>
                </div>
                {allFields.filter(f => ["dropdown", "fk", "manual"].includes(f.type)).map(f => (
                  <div key={f.col} onClick={() => setGroupBy(f.col)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "2px solid " + (groupBy === f.col ? "#7C3AED" : M.div), borderRadius: 7, cursor: "pointer", background: groupBy === f.col ? "#ede9fe" : M.hi }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid " + (groupBy === f.col ? "#7C3AED" : M.inBd), background: groupBy === f.col ? "#7C3AED" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {groupBy === f.col && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>●</span>}
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: M.tD, flexShrink: 0 }}>{f.col}</span>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: groupBy === f.col ? "#6d28d9" : M.tB }}>{f.h}</span>
                    <DtBadge type={f.type} />
                  </div>
                ))}
              </div>
              {groupBy && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "2px dashed #c4b5fd" }}>
                  <div style={{ marginBottom: 8, fontSize: 9, fontWeight: 900, color: "#7C3AED", textTransform: "uppercase", letterSpacing: .8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12 }}>↳</span> Sub-group within each group (optional)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div onClick={() => setSubGroupBy(null)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "2px solid " + (subGroupBy === null ? "#7C3AED" : M.div), borderRadius: 7, cursor: "pointer", background: subGroupBy === null ? "#ede9fe" : M.hi }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid " + (subGroupBy === null ? "#7C3AED" : M.inBd), background: subGroupBy === null ? "#7C3AED" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {subGroupBy === null && <span style={{ color: "#fff", fontSize: 8, fontWeight: 900 }}>●</span>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: subGroupBy === null ? "#6d28d9" : M.tB }}>No sub-grouping</span>
                    </div>
                    {allFields.filter(f => ["dropdown", "fk", "manual"].includes(f.type) && f.col !== groupBy).map(f => (
                      <div key={f.col} onClick={() => setSubGroupBy(f.col)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "2px solid " + (subGroupBy === f.col ? "#7C3AED" : M.div), borderRadius: 7, cursor: "pointer", background: subGroupBy === f.col ? "#ede9fe" : M.hi }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid " + (subGroupBy === f.col ? "#7C3AED" : M.inBd), background: subGroupBy === f.col ? "#7C3AED" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {subGroupBy === f.col && <span style={{ color: "#fff", fontSize: 8, fontWeight: 900 }}>●</span>}
                        </div>
                        <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: M.tD, flexShrink: 0 }}>{f.col}</span>
                        <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: subGroupBy === f.col ? "#6d28d9" : M.tB }}>{f.h}</span>
                        <DtBadge type={f.type} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid " + M.div, display: "flex", alignItems: "center", gap: 8, background: M.mid, flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 9, color: M.tC }}>
            {`${colOrder.filter(c => !hiddenC.includes(c)).length} visible · ${sorts.length} sort(s) · ${Object.values(filters).filter(v => v.trim()).length} filter(s)${groupBy ? " · grouped" : ""}${subGroupBy ? " · sub-grouped" : ""}`}
          </div>
          {!canSave && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>{nameConflict ? "Name already taken" : "Enter a name"}</span>}
          <button onClick={onCancel} style={{ padding: "7px 16px", border: "1px solid " + M.inBd, borderRadius: 6, background: M.inBg, color: M.tB, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => canSave && onSave({ name: name.trim(), colOrder, hiddenC, sorts, filters, groupBy, subGroupBy })} disabled={!canSave}
            style={{ padding: "7px 22px", border: "none", borderRadius: 6, background: canSave ? "#7C3AED" : M.bBg, color: canSave ? "#fff" : M.tD, fontSize: 11, fontWeight: 900, cursor: canSave ? "pointer" : "default", opacity: canSave ? 1 : .6 }}>
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

// ── BulkCell — inline editable cell ──
function BulkCell({ f, val, onChange, onBlur, M, A, fz, fkMap }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const base = { width: "100%", border: "2px solid " + A.a, borderRadius: 4, background: M.inBg, color: M.tA, fontSize: fz - 2, padding: "3px 6px", outline: "none", fontFamily: ["manual", "autocode"].includes(f?.type) ? "monospace" : "inherit" };
  if (f?.type === "dropdown" || f?.type === "fk" || f?.type === "multifk") {
    const opts = f.opts || f.fkData || (fkMap && f.fk ? fkMap[f.fk] : null) || [];
    return (
      <select ref={ref} value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={{ ...base, cursor: "pointer" }}>
        <option value="">— select —</option>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    );
  }
  if (f?.type === "textarea") return <input ref={ref} value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={base} />;
  if (f?.type === "currency" || f?.type === "number") return <input ref={ref} type="number" value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={base} />;
  return <input ref={ref} type="text" value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={base} />;
}

// ── Empty row factory ──
const EMPTY_ROW = (master, id) => {
  const r = { __id: id, __new: true, __dirty: false };
  (master?.fields || []).forEach(f => { r[f.col] = ""; });
  return r;
};

// ═══════════════════════════════════════════════════════════════
// ADVANCED FILTER / SORT — operator-based multi-condition panel
// Same pattern as Layout View; reused here for Records & BulkEntry
// ═══════════════════════════════════════════════════════════════
const BULK_FILTER_OPS = {
  cat: ['is', 'is not'],
  txt: ['contains', 'not contains', 'starts with'],
  num: ['=', '≠', '>', '<', '≥', '≤'],
};
const BULK_SORT_MODES = [
  { value: 'a_z',       label: 'A → Z'               },
  { value: 'z_a',       label: 'Z → A'               },
  { value: 'nil_first', label: 'Nil / Empty First'    },
  { value: 'nil_last',  label: 'Nil / Empty Last'     },
  { value: 'freq_hi',   label: 'Most Frequent First'  },
  { value: 'freq_lo',   label: 'Least Frequent First' },
  { value: 'num_lo',    label: 'Lowest → Highest'     },
  { value: 'num_hi',    label: 'Highest → Lowest'     },
  { value: 'val_first', label: 'Value is… First'      },
  { value: 'val_last',  label: 'Value is… Last'       },
];
function bulkAdvFieldType(f) {
  if (!f) return 'txt';
  if (['currency', 'number', 'calc'].includes(f.type)) return 'num';
  if (f.opts?.length || ['fk', 'multifk', 'dropdown'].includes(f.type)) return 'cat';
  return 'txt';
}
function evalBulkAdvFilter(row, { field, op, value }, allFields) {
  const f = allFields.find(x => x.col === field);
  const fType = bulkAdvFieldType(f);
  const rv = row[field];
  if (fType === 'num') {
    const n = parseFloat(rv), v = parseFloat(value);
    if (isNaN(n) || isNaN(v)) return true;
    return op==='='?n===v:op==='≠'?n!==v:op==='>'?n>v:op==='<'?n<v:op==='≥'?n>=v:n<=v;
  }
  if (fType === 'txt') {
    const s = String(rv||'').toLowerCase(), v = String(value||'').toLowerCase();
    return op==='contains'?s.includes(v):op==='not contains'?!s.includes(v):s.startsWith(v);
  }
  return op === 'is' ? rv === value : rv !== value;
}
function applyBulkAdvSort(arr, advSorts, freqMaps) {
  if (!advSorts.length) return arr;
  return [...arr].sort((a, b) => {
    for (const s of advSorts) {
      const av = a[s.field]??'', bv = b[s.field]??'';
      const ae = av===''||av==null, be = bv===''||bv==null;
      let cmp = 0;
      if      (s.mode==='nil_first') { if(ae!==be){cmp=ae?-1:1;} else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='nil_last')  { if(ae!==be){cmp=ae?1:-1;} else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='freq_hi')  { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fb-fa; }
      else if (s.mode==='freq_lo')  { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fa-fb; }
      else if (s.mode==='num_lo')   cmp=parseFloat(av||0)-parseFloat(bv||0);
      else if (s.mode==='num_hi')   cmp=parseFloat(bv||0)-parseFloat(av||0);
      else if (s.mode==='val_first'){ const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm)cmp=am?-1:1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='val_last') { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm)cmp=am?1:-1;  else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='z_a')      cmp=String(bv).localeCompare(String(av),undefined,{sensitivity:'base'});
      else                          cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'});
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

// ═══════════════════════════════════════════════════════════════
//  BulkEntryTab — Main export, replaces old simple BulkEntryTab
// ═══════════════════════════════════════════════════════════════
export default function BulkEntryTab({ enriched, sheet, onSaveBulk, saving, M: rawM, A, uff, dff }) {
  const M = toM(rawM);
  const fz = 13;
  const master = adaptMaster(enriched, sheet);
  const fkMap = buildFKMap(enriched);

  const allFields = master.fields;
  const allCols = allFields.map(f => f.col);
  const mandFields = allFields.filter(f => f.req && !f.auto);

  // ── View state (internal) ──
  const DEFAULT_VIEW = { name: "Default", __builtin: true, colOrder: allCols, hiddenC: [], sorts: [], filters: {}, groupBy: null, subGroupBy: null };

  const [viewState, setViewState] = useState(null);
  const [templates, setTemplates] = useState([]);

  const vs = viewState || {};
  const savedOrder = vs.colOrder ? vs.colOrder.filter(c => allCols.includes(c)) : [];
  const missingCols = allCols.filter(c => !savedOrder.includes(c));
  const colOrder = savedOrder.length > 0 ? [...savedOrder, ...missingCols] : allCols;
  const hiddenC = vs.hiddenC ?? [];
  const sorts = vs.sorts ?? [];
  const filters = vs.filters ?? {};
  const groupBy = vs.groupBy ?? null;
  const subGroupBy = vs.subGroupBy ?? null;
  const activeViewName = vs.activeViewName ?? "Default";

  const setColOrder = v => setViewState(p => ({ ...(p || {}), colOrder: typeof v === "function" ? v((p || {}).colOrder ?? allCols) : v }));
  const setHiddenC = v => setViewState(p => ({ ...(p || {}), hiddenC: typeof v === "function" ? v((p || {}).hiddenC ?? []) : v }));
  const setSorts = v => setViewState(p => ({ ...(p || {}), sorts: typeof v === "function" ? v((p || {}).sorts ?? []) : v }));
  const setFilters = v => setViewState(p => ({ ...(p || {}), filters: typeof v === "function" ? v((p || {}).filters ?? {}) : v }));
  const setGroupBy = v => setViewState(p => ({ ...(p || {}), groupBy: typeof v === "function" ? v((p || {}).groupBy ?? null) : v }));
  const setSubGroupBy = v => setViewState(p => ({ ...(p || {}), subGroupBy: typeof v === "function" ? v((p || {}).subGroupBy ?? null) : v }));
  const setActiveViewName = v => setViewState(p => ({ ...(p || {}), activeViewName: typeof v === "function" ? v((p || {}).activeViewName ?? "Default") : v }));

  // ── Rows state ──
  const [rows, setRows] = useState([]);
  const nextId = useRef(1000);

  // ── UI state ──
  const [selRows, setSelRows] = useState(new Set());
  const [editCell, setEditCell] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [dragCol, setDragCol] = useState(null);
  const [dropCol, setDropCol] = useState(null);
  const [showCM, setShowCM] = useState(false);
  const [showFP, setShowFP] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [aggState, setAggState] = useState({});
  const [aggOpenInfo, setAggOpenInfo] = useState(null);
  const [showSave, setShowSave] = useState(false);
  const [tplName, setTplName] = useState("");
  const [renamingTpl, setRenamingTpl] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingTpl, setEditingTpl] = useState(null);
  const [viewSwitchGuard, setViewSwitchGuard] = useState(null);

  // ── Advanced filter / sort (Layout View style) ──
  const [advFilters,     setAdvFilters]    = useState([]);
  const [advSorts,       setAdvSorts]      = useState([]);
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [showAdvSorts,   setShowAdvSorts]   = useState(false);

  // Derived field defs for adv filter/sort (exclude auto-computed fields)
  const advFieldDefs = allFields.filter(f => !f.auto && !['calc','autocode'].includes(f.type)).map(f => ({
    key: f.col, label: f.h || f.col, type: bulkAdvFieldType(f), opts: f.opts || null,
  }));
  const activeAdvFilterCount = advFilters.filter(f => f.value !== '').length;
  const isAdvSortActive = advSorts.length > 0;

  const addAdvFilter = () => {
    const first = advFieldDefs[0];
    const ft = first ? bulkAdvFieldType(allFields.find(x => x.col === first.key)) : 'txt';
    setAdvFilters(p => [...p, { id: Date.now(), field: first?.key || '', op: BULK_FILTER_OPS[ft]?.[0] || 'is', value: '' }]);
  };
  const removeAdvFilter = (id) => setAdvFilters(p => p.filter(f => f.id !== id));
  const updateAdvFilter = (id, patch) => setAdvFilters(p => p.map(f => {
    if (f.id !== id) return f;
    const merged = { ...f, ...patch };
    if (patch.field && patch.field !== f.field) {
      const ft = bulkAdvFieldType(allFields.find(x => x.col === patch.field));
      merged.op = BULK_FILTER_OPS[ft]?.[0] || 'is'; merged.value = '';
    }
    return merged;
  }));
  const addAdvSort = () => {
    const first = advFieldDefs[0];
    setAdvSorts(p => [...p, { id: Date.now(), field: first?.key || '', mode: 'a_z', value: '' }]);
  };
  const removeAdvSort = (id) => setAdvSorts(p => p.length > 1 ? p.filter(s => s.id !== id) : p);
  const updateAdvSort = (id, patch) => setAdvSorts(p => p.map(s => s.id === id ? { ...s, ...patch } : s));

  // Reset when enriched changes
  useEffect(() => {
    setSelRows(new Set()); setEditCell(null); setRowErrors({});
    setRows([]); setViewState(null); setTemplates([]);
  }, [enriched.id]);

  const showToast = (msg, color = "#15803d") => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };

  const aggCellClick = (col, el) => {
    if (aggOpenInfo?.col === col) { setAggOpenInfo(null); return; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAggOpenInfo({ col, top: Math.max(8, r.top - 410), left: Math.min(r.left, window.innerWidth - 230) });
  };

  // ── Derived ──
  const visCols = colOrder.filter(c => !hiddenC.includes(c) && allCols.includes(c));

  const visRows = (() => {
    let rs = [...rows];
    // ── Existing per-column text filters (kept) ──
    Object.entries(filters).forEach(([col, val]) => {
      if (!val.trim()) return;
      rs = rs.filter(r => String(r[col] || "").toLowerCase().includes(val.trim().toLowerCase()));
    });
    // ── Advanced operator-based filters (new) ──
    advFilters.forEach(fil => {
      if (fil.value !== '' || bulkAdvFieldType(allFields.find(x => x.col === fil.field)) === 'num')
        rs = rs.filter(r => evalBulkAdvFilter(r, fil, allFields));
    });
    // ── Existing column-click sorts (kept) ──
    if (sorts.length > 0) {
      rs.sort((a, b) => {
        for (const { col, dir, type, nulls } of sorts) {
          const av = a[col], bv = b[col];
          const an = av == null || av === "", bn = bv == null || bv === "";
          if (an && bn) continue;
          if (an) return nulls === "first" ? -1 : 1;
          if (bn) return nulls === "first" ? 1 : -1;
          const ft = type === "auto" || !type ? (() => { const f = allFields.find(x => x.col === col); return ["currency", "number", "calc"].includes(f?.type) ? "numeric" : f?.type === "date" ? "date" : "alpha"; })() : type;
          let d = 0;
          if (ft === "numeric") { d = parseFloat(av) - parseFloat(bv); if (isNaN(d)) d = 0; }
          else if (ft === "date") { d = new Date(av) - new Date(bv); if (isNaN(d)) d = 0; }
          else if (ft === "length") { d = String(av).length - String(bv).length; }
          else { d = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" }); }
          if (d !== 0) return dir === "asc" ? d : -d;
        }
        return 0;
      });
    }
    // ── Advanced multi-mode sorts (new, applied after column sorts) ──
    if (advSorts.length > 0) {
      const fMaps = {};
      advFieldDefs.forEach(f => {
        const counts = {};
        rows.forEach(r => { const v = String(r[f.key]??''); counts[v] = (counts[v]||0) + 1; });
        fMaps[f.key] = counts;
      });
      rs = applyBulkAdvSort(rs, advSorts, fMaps);
    }
    return rs;
  })();

  // ── Grouping ──
  const grouped = (() => {
    if (!groupBy) return [{ key: "__all", sub: [{ subKey: null, rows: visRows }] }];
    const map = {};
    visRows.forEach(r => { const k = r[groupBy] || "(blank)"; if (!map[k]) map[k] = []; map[k].push(r); });
    return Object.entries(map).map(([key, gRows]) => {
      if (!subGroupBy || subGroupBy === groupBy) return { key, sub: [{ subKey: null, rows: gRows }] };
      const smap = {};
      gRows.forEach(r => { const sk = String(r[subGroupBy] || "(blank)"); if (!smap[sk]) smap[sk] = []; smap[sk].push(r); });
      return { key, sub: Object.entries(smap).map(([subKey, sRows]) => ({ subKey, rows: sRows })) };
    });
  })();

  // ── Cell update ──
  const updateCell = (rowId, col, val) => {
    setRowErrors(p => {
      if (!p[rowId]) return p;
      const cols = p[rowId].filter(c => c !== col);
      const n = { ...p };
      cols.length > 0 ? n[rowId] = cols : delete n[rowId];
      return n;
    });
    setRows(prev => prev.map(r => {
      if (r.__id !== rowId) return r;
      return { ...r, [col]: val, __dirty: true };
    }));
  };

  // ── Add row ──
  const addRow = () => {
    const id = nextId.current++;
    setRows(prev => [...prev, EMPTY_ROW(master, id)]);
    showToast("+ New row added", "#0078D4");
  };

  // ── Delete selected ──
  const deleteSelected = () => {
    setRows(prev => prev.filter(r => !selRows.has(r.__id)));
    showToast(`${selRows.size} row(s) removed`, "#dc2626");
    setSelRows(new Set());
  };

  // ── Save dirty rows ──
  const saveDirty = () => {
    const dirtyRows = rows.filter(r => r.__dirty || r.__new);
    const errs = {};
    dirtyRows.forEach(r => {
      const missing = mandFields.filter(f => !String(r[f.col] || "").trim()).map(f => f.col);
      if (missing.length > 0) errs[r.__id] = missing;
    });
    if (Object.keys(errs).length > 0) {
      setRowErrors(errs);
      showToast(`${Object.keys(errs).length} row(s) missing mandatory fields`, "#dc2626");
      return;
    }
    // Call onSaveBulk if provided
    if (onSaveBulk) {
      const rowsToSave = dirtyRows.map(r => {
        const data = {};
        allFields.forEach(f => { if (r[f.col]) data[f.col] = r[f.col]; });
        return data;
      });
      onSaveBulk(rowsToSave);
    }
    setRows(prev => prev.map(r => ({ ...r, __dirty: false, __new: false })));
    setRowErrors({});
    showToast(`${dirtyRows.length} row(s) saved`);
  };

  // ── Sort helpers ──
  const toggleSort = col => {
    setSorts(prev => {
      const ex = prev.find(s => s.col === col);
      if (!ex) return [{ col, dir: "asc", type: "auto", nulls: "last" }, ...prev.filter(s => s.col !== col)];
      if (ex.dir === "asc") return prev.map(s => s.col === col ? { ...s, dir: "desc" } : s);
      return prev.filter(s => s.col !== col);
    });
  };
  const sortDir = col => sorts.find(s => s.col === col)?.dir || null;

  // ── Column drag-drop ──
  const onDragStart = col => setDragCol(col);
  const onDragOver = (e, col) => { e.preventDefault(); setDropCol(col); };
  const onDrop = col => {
    if (!dragCol || dragCol === col) { setDragCol(null); setDropCol(null); return; }
    setColOrder(prev => {
      const arr = [...prev];
      const fi = arr.indexOf(dragCol), ti = arr.indexOf(col);
      if (fi < 0 || ti < 0) return arr;
      arr.splice(fi, 1); arr.splice(ti, 0, dragCol);
      return arr;
    });
    setDragCol(null); setDropCol(null);
  };

  // ── Template CRUD ──
  const onSaveTemplate = (tpl) => setTemplates(prev => [...prev.filter(t => t.name !== tpl.name), tpl]);
  const onDeleteTemplate = (name) => setTemplates(prev => prev.filter(t => t.name !== name));

  const saveTemplate = () => {
    if (!tplName.trim()) return;
    if (tplName.trim().toLowerCase() === "default") { showToast('"Default" is reserved', "#dc2626"); return; }
    const tpl = { name: tplName.trim(), colOrder: [...colOrder], hiddenC: [...hiddenC], sorts: [...sorts], filters: { ...filters }, groupBy, subGroupBy };
    onSaveTemplate(tpl);
    setActiveViewName(tpl.name);
    showToast(`View "${tpl.name}" saved`);
    setTplName(""); setShowSave(false);
  };

  const loadTemplate = tpl => {
    setColOrder((tpl.colOrder || allCols).filter(c => allCols.includes(c)));
    setHiddenC(tpl.hiddenC || []); setSorts(tpl.sorts || []);
    setFilters(tpl.filters || {}); setGroupBy(tpl.groupBy || null); setSubGroupBy(tpl.subGroupBy || null);
    setActiveViewName(tpl.name);
  };

  const getViewDirty = () => {
    if (activeViewName === "Default") {
      return !(JSON.stringify(colOrder) === JSON.stringify(allCols) && hiddenC.length === 0 && sorts.length === 0 && Object.values(filters).every(v => !v.trim()) && groupBy === null && subGroupBy === null);
    }
    const saved = templates.find(t => t.name === activeViewName);
    if (!saved) return false;
    return (
      JSON.stringify(colOrder) !== JSON.stringify((saved.colOrder || allCols).filter(c => allCols.includes(c))) ||
      JSON.stringify(hiddenC) !== JSON.stringify(saved.hiddenC || []) ||
      JSON.stringify(sorts) !== JSON.stringify(saved.sorts || []) ||
      JSON.stringify(filters) !== JSON.stringify(saved.filters || {}) ||
      groupBy !== (saved.groupBy || null) || subGroupBy !== (saved.subGroupBy || null)
    );
  };
  const viewDirty = getViewDirty();

  const updateCurrentView = () => {
    if (activeViewName === "Default") return;
    onSaveTemplate({ name: activeViewName, colOrder: [...colOrder], hiddenC: [...hiddenC], sorts: [...sorts], filters: { ...filters }, groupBy, subGroupBy });
    showToast(`View "${activeViewName}" updated`, "#15803d");
  };

  const tryLoadTemplate = tpl => {
    if (viewDirty && tpl.name !== activeViewName) {
      setViewSwitchGuard({ pendingTpl: tpl });
    } else {
      loadTemplate(tpl);
    }
  };

  const dupTemplate = tpl => {
    let dupName = tpl.name + " (copy)";
    let i = 1;
    while (templates.find(t => t.name === dupName) || dupName.toLowerCase() === "default") dupName = tpl.name + ` (copy ${++i})`;
    setEditingTpl({ tpl: { ...tpl, name: dupName }, originalName: null });
  };
  const editTemplate = tpl => {
    setEditingTpl({ tpl: { ...tpl, colOrder: [...tpl.colOrder], hiddenC: [...tpl.hiddenC], sorts: [...tpl.sorts], filters: { ...tpl.filters } }, originalName: tpl.name });
  };
  const commitTplEdit = (updated) => {
    if (updated.name.toLowerCase() === "default") { showToast('"Default" is reserved', "#dc2626"); return; }
    if (editingTpl.originalName && editingTpl.originalName !== updated.name) onDeleteTemplate(editingTpl.originalName);
    onSaveTemplate(updated);
    setActiveViewName(updated.name);
    showToast(`View "${updated.name}" ${editingTpl.originalName ? "updated" : "created"}`, "#15803d");
    setEditingTpl(null);
  };
  const deleteTemplate = name => {
    onDeleteTemplate(name);
    if (activeViewName === name) setActiveViewName("Default");
    showToast(`View "${name}" deleted`, "#dc2626");
  };
  const renameTemplate = (oldName, newName) => {
    if (!newName.trim() || newName.trim() === oldName) { setRenamingTpl(null); return; }
    if (newName.trim().toLowerCase() === "default") { showToast('"Default" is reserved', "#dc2626"); setRenamingTpl(null); return; }
    if (templates.find(t => t.name === newName.trim())) { showToast(`"${newName.trim()}" already exists`, "#dc2626"); return; }
    const tpl = templates.find(t => t.name === oldName);
    if (!tpl) return;
    onDeleteTemplate(oldName);
    onSaveTemplate({ ...tpl, name: newName.trim() });
    if (activeViewName === oldName) setActiveViewName(newName.trim());
    setRenamingTpl(null);
  };

  const activeFilters = Object.values(filters).filter(v => v.trim()).length;
  const dirtyCount = rows.filter(r => r.__dirty || r.__new).length;
  const allSel = selRows.size === visRows.length && visRows.length > 0;

  const colW = (col) => {
    const f = allFields.find(x => x.col === col);
    if (!f) return 100;
    if (["textarea", "text"].includes(f.type)) return 160;
    if (["fk", "multifk", "dropdown"].includes(f.type)) return 140;
    if (f.type === "currency" || f.type === "number") return 90;
    if (f.type === "manual" || f.type === "autocode") return 100;
    return 110;
  };

  const CC_RED = "#CC0000";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>
      {/* ── TOOLBAR ROW 1 ── */}
      <div style={{ padding: "6px 12px", borderBottom: "1px solid " + M.div, display: "flex", alignItems: "center", gap: 6, background: M.mid, flexShrink: 0, flexWrap: "wrap" }}>
        <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: "none", borderRadius: 5, background: CC_RED, color: "#fff", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
          <span style={{ fontSize: 13 }}>+</span> Add Row
        </button>
        {selRows.size > 0 && (
          <button onClick={deleteSelected} style={{ padding: "5px 12px", border: "1px solid #fecaca", borderRadius: 5, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
            Delete {selRows.size}
          </button>
        )}
        {dirtyCount > 0 && (
          <button onClick={saveDirty} disabled={saving} style={{ padding: "5px 14px", border: "none", borderRadius: 5, background: saving ? M.tD : "#15803d", color: "#fff", fontSize: 10, fontWeight: 900, cursor: saving ? "default" : "pointer" }}>
            {saving ? "Saving…" : `Save ${dirtyCount} Changes`}
          </button>
        )}
        <div style={{ width: 1, height: 22, background: M.div, margin: "0 4px" }} />
        <button onClick={() => { setShowFP(p => !p); setShowCM(false); setShowAdvFilters(false); }} style={{ padding: "5px 10px", borderRadius: 5, border: "1.5px solid " + (showFP || activeFilters > 0 ? A.a : M.inBd), background: showFP || activeFilters > 0 ? A.al : M.inBg, color: showFP || activeFilters > 0 ? A.a : M.tB, fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          Col Filter {activeFilters > 0 && <span style={{ background: A.a, color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 8 }}>{activeFilters}</span>}
        </button>
        <button onClick={() => { setShowAdvFilters(p => !p); setShowFP(false); setShowCM(false); setShowAdvSorts(false); }} style={{ padding: "5px 10px", borderRadius: 5, border: "1.5px solid " + (showAdvFilters || activeAdvFilterCount > 0 ? "#0891B2" : M.inBd), background: showAdvFilters || activeAdvFilterCount > 0 ? "#f0fdfa" : M.inBg, color: showAdvFilters || activeAdvFilterCount > 0 ? "#0e7490" : M.tB, fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          ＋ Filter {activeAdvFilterCount > 0 && <span style={{ background: "#0891B2", color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 8 }}>{activeAdvFilterCount}</span>}
        </button>
        <button onClick={() => { setShowSortPanel(true); setShowFP(false); setShowCM(false); }} style={{ padding: "5px 10px", borderRadius: 5, border: "1.5px solid " + (showSortPanel || sorts.length > 0 ? "#7C3AED" : M.inBd), background: showSortPanel || sorts.length > 0 ? "#ede9fe" : M.inBg, color: showSortPanel || sorts.length > 0 ? "#6d28d9" : M.tB, fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          Col Sort {sorts.length > 0 && <span style={{ background: "#7C3AED", color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 8 }}>{sorts.length}</span>}
        </button>
        <button onClick={() => { setShowAdvSorts(p => !p); setShowSortPanel(false); setShowFP(false); setShowAdvFilters(false); }} style={{ padding: "5px 10px", borderRadius: 5, border: "1.5px solid " + (showAdvSorts || isAdvSortActive ? "#7C3AED" : M.inBd), background: showAdvSorts || isAdvSortActive ? "#ede9fe" : M.inBg, color: showAdvSorts || isAdvSortActive ? "#6d28d9" : M.tB, fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          ↑ Sort {isAdvSortActive && <span style={{ background: "#7C3AED", color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 8 }}>{advSorts.length}</span>}
        </button>
        <select value={groupBy || ""} onChange={e => { setGroupBy(e.target.value || null); if (!e.target.value) setSubGroupBy(null); }} style={{ padding: "5px 8px", border: "1.5px solid " + (groupBy ? "#059669" : M.inBd), borderRadius: 5, background: groupBy ? "#f0fdf4" : M.inBg, color: groupBy ? "#15803d" : M.tB, fontSize: 10, fontWeight: 900, cursor: "pointer", outline: "none" }}>
          <option value="">Group by…</option>
          {allFields.filter(f => ["dropdown", "fk", "manual"].includes(f.type)).map(f => (
            <option key={f.col} value={f.col}>{f.col} — {f.h}</option>
          ))}
        </select>
        {groupBy && (
          <select value={subGroupBy || ""} onChange={e => setSubGroupBy(e.target.value || null)} style={{ padding: "5px 8px", border: "1.5px solid " + (subGroupBy ? "#7C3AED" : "#bbf7d0"), borderRadius: 5, background: subGroupBy ? "#ede9fe" : "#f0fdf4", color: subGroupBy ? "#6d28d9" : "#15803d", fontSize: 10, fontWeight: 900, cursor: "pointer", outline: "none" }}>
            <option value="">Sub-group…</option>
            {allFields.filter(f => ["dropdown", "fk", "manual"].includes(f.type) && f.col !== groupBy).map(f => (
              <option key={f.col} value={f.col}>{f.col} — {f.h}</option>
            ))}
          </select>
        )}
        <button onClick={() => { setShowCM(p => !p); setShowFP(false); }} style={{ padding: "5px 10px", borderRadius: 5, border: "1.5px solid " + (showCM || hiddenC.length > 0 ? "#0078D4" : M.inBd), background: showCM || hiddenC.length > 0 ? "#eff6ff" : M.inBg, color: showCM || hiddenC.length > 0 ? "#1d4ed8" : M.tB, fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          Columns {hiddenC.length > 0 && <span style={{ background: "#0078D4", color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 8 }}>{hiddenC.length} hidden</span>}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: M.tC, fontWeight: 700 }}>{visRows.length} rows · {visCols.length} cols</span>
        {(sorts.length > 0 || activeFilters > 0 || activeAdvFilterCount > 0 || isAdvSortActive || groupBy) && (
          <button onClick={() => { setSorts([]); setFilters({}); setAdvFilters([]); setAdvSorts([]); setGroupBy(null); setSubGroupBy(null); setShowAdvFilters(false); setShowAdvSorts(false); }} style={{ padding: "4px 9px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", color: "#dc2626", fontSize: 9, fontWeight: 800, cursor: "pointer" }}>Clear All</button>
        )}
      </div>

      {/* ── TOOLBAR ROW 2: Views bar ── */}
      <div style={{ padding: "5px 12px", borderBottom: "1px solid " + M.div, display: "flex", alignItems: "center", gap: 5, background: M.lo, flexShrink: 0, flexWrap: "wrap", minHeight: 32 }}>
        <span style={{ fontSize: 8, fontWeight: 900, color: M.tD, letterSpacing: 1, textTransform: "uppercase", flexShrink: 0, marginRight: 4 }}>VIEWS:</span>
        {/* DEFAULT */}
        {(() => {
          const isActive = activeViewName === "Default";
          const isModified = isActive && viewDirty;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 0, background: isActive ? (isModified ? "#fff7ed" : "#CC000015") : "#f5f5f5", border: "1.5px solid " + (isActive ? (isModified ? "#f59e0b" : "#CC0000") : "#d1d5db"), borderRadius: 5, overflow: "hidden" }}>
              <button onClick={() => tryLoadTemplate(DEFAULT_VIEW)} style={{ padding: "4px 10px", border: "none", background: "transparent", color: isActive ? (isModified ? "#92400e" : "#CC0000") : "#374151", fontSize: 9, fontWeight: isActive ? 900 : 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: isModified ? "#f59e0b" : "#CC0000", display: "inline-block", flexShrink: 0 }} />}
                Default
                {isModified && <span style={{ fontSize: 7, fontWeight: 900, color: "#92400e", background: "#fef3c7", borderRadius: 3, padding: "1px 4px", marginLeft: 2 }}>MODIFIED</span>}
              </button>
              <div style={{ padding: "2px 6px", fontSize: 7, fontWeight: 900, color: "#9ca3af", letterSpacing: .5, background: "#ececec", borderLeft: "1px solid #d1d5db", height: "100%", display: "flex", alignItems: "center" }}>LOCKED</div>
            </div>
          );
        })()}
        {/* USER SAVED VIEWS */}
        {templates.map(t => {
          const isActive = activeViewName === t.name;
          const isModified = isActive && viewDirty;
          return (
            <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 0, background: isActive ? (isModified ? "#fffbeb" : "#ede9fe") : "#f5f3ff", border: "1.5px solid " + (isActive ? (isModified ? "#f59e0b" : "#7C3AED") : "#c4b5fd"), borderRadius: 5, overflow: "hidden" }}>
              {renamingTpl?.name === t.name ? (
                <input autoFocus value={renamingTpl.tempName}
                  onChange={e => setRenamingTpl(p => ({ ...p, tempName: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") renameTemplate(t.name, renamingTpl.tempName); if (e.key === "Escape") setRenamingTpl(null); }}
                  onBlur={() => renameTemplate(t.name, renamingTpl.tempName)}
                  style={{ padding: "3px 8px", border: "none", background: "#fff", color: "#6d28d9", fontSize: 10, fontWeight: 800, outline: "2px solid #7C3AED", width: 130 }} />
              ) : (
                <button onClick={() => tryLoadTemplate(t)} style={{ padding: "4px 9px", border: "none", background: "transparent", color: isActive ? (isModified ? "#92400e" : "#6d28d9") : "#7c3aed", fontSize: 9, fontWeight: isActive ? 900 : 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  {isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: isModified ? "#f59e0b" : "#7C3AED", display: "inline-block", flexShrink: 0 }} />}
                  {t.name}
                  {isModified && <span style={{ fontSize: 7, fontWeight: 900, color: "#92400e", background: "#fef3c7", borderRadius: 3, padding: "1px 4px", marginLeft: 2 }}>MODIFIED</span>}
                </button>
              )}
              {isActive && isModified && <>
                <div style={{ width: 1, height: 16, background: "#fcd34d" }} />
                <button onClick={updateCurrentView} style={{ padding: "4px 9px", border: "none", background: "#f59e0b", color: "#fff", fontSize: 9, cursor: "pointer", fontWeight: 900, whiteSpace: "nowrap" }}>Update</button>
              </>}
              <div style={{ width: 1, height: 16, background: "#c4b5fd" }} />
              <button onClick={() => setRenamingTpl(renamingTpl?.name === t.name ? null : { name: t.name, tempName: t.name })} style={{ padding: "4px 6px", border: "none", background: "transparent", color: "#f59e0b", fontSize: 10, cursor: "pointer", fontWeight: 900 }}>✎</button>
              <div style={{ width: 1, height: 16, background: "#c4b5fd" }} />
              <button onClick={() => editTemplate(t)} style={{ padding: "4px 6px", border: "none", background: "transparent", color: "#0078D4", fontSize: 10, cursor: "pointer", fontWeight: 900 }}>✏</button>
              <div style={{ width: 1, height: 16, background: "#c4b5fd" }} />
              <button onClick={() => dupTemplate(t)} style={{ padding: "4px 6px", border: "none", background: "transparent", color: "#059669", fontSize: 10, cursor: "pointer", fontWeight: 900 }}>⧉</button>
              <div style={{ width: 1, height: 16, background: "#c4b5fd" }} />
              <button onClick={() => deleteTemplate(t.name)} style={{ padding: "4px 6px", border: "none", background: "transparent", color: "#dc2626", fontSize: 10, cursor: "pointer", fontWeight: 900 }}>×</button>
            </div>
          );
        })}
        <button onClick={() => setShowSave(p => !p)} style={{ padding: "4px 10px", borderRadius: 5, border: "1.5px solid #c4b5fd", background: showSave ? "#7C3AED" : "#fdf4ff", color: showSave ? "#fff" : "#7C3AED", fontSize: 9, fontWeight: 900, cursor: "pointer" }}>+ Save View</button>
      </div>

      {/* ── VIEW SWITCH GUARD MODAL ── */}
      {viewSwitchGuard && (
        <>
          <div onClick={() => setViewSwitchGuard(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)", zIndex: 1500 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, background: M.hi, border: "1px solid #fcd34d", borderRadius: 10, zIndex: 1501, boxShadow: "0 8px 32px rgba(0,0,0,.3)", overflow: "hidden" }}>
            <div style={{ background: "#f59e0b", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>Unsaved View Changes</div>
                <div style={{ color: "rgba(255,255,255,.85)", fontSize: 10 }}>Current view has unsaved modifications</div>
              </div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => { updateCurrentView(); loadTemplate(viewSwitchGuard.pendingTpl); setViewSwitchGuard(null); }}
                  style={{ padding: "9px 16px", border: "none", borderRadius: 6, background: "#15803d", color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer", textAlign: "left" }}>
                  Save changes then switch
                </button>
                <button onClick={() => { loadTemplate(viewSwitchGuard.pendingTpl); setViewSwitchGuard(null); }}
                  style={{ padding: "9px 16px", border: "1px solid #fcd34d", borderRadius: 6, background: "#fffbeb", color: "#92400e", fontSize: 11, fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
                  Discard changes and switch
                </button>
                <button onClick={() => setViewSwitchGuard(null)}
                  style={{ padding: "9px 16px", border: "1px solid " + M.inBd, borderRadius: 6, background: M.inBg, color: M.tB, fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                  Stay on current view
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FILTER PANEL ── */}
      {showFP && (
        <div style={{ padding: "10px 12px", borderBottom: "1px solid " + M.div, background: M.hi, flexShrink: 0, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, letterSpacing: .8, textTransform: "uppercase", marginRight: 4 }}>FILTER BY:</span>
          {visCols.map(col => {
            const f = allFields.find(x => x.col === col);
            if (!f || f.auto || ["calc", "autocode"].includes(f.type)) return null;
            return (
              <div key={col} style={{ display: "flex", alignItems: "center", gap: 4, background: M.lo, border: "1px solid " + M.inBd, borderRadius: 5, padding: "3px 6px" }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: M.tD, fontFamily: "monospace" }}>{col}</span>
                <input value={filters[col] || ""} onChange={e => setFilters(p => ({ ...p, [col]: e.target.value }))}
                  placeholder={f.h} style={{ border: "none", background: "transparent", color: M.tA, fontSize: 10, outline: "none", width: 100 }} />
                {filters[col] && <button onClick={() => setFilters(p => { const n = { ...p }; delete n[col]; return n; })} style={{ border: "none", background: "none", cursor: "pointer", color: M.tD, fontSize: 10, padding: 0 }}>×</button>}
              </div>
            );
          })}
          <button onClick={() => setFilters({})} style={{ padding: "3px 9px", border: "1px solid " + M.inBd, borderRadius: 4, background: M.inBg, color: M.tB, fontSize: 9, fontWeight: 800, cursor: "pointer" }}>Clear All</button>
        </div>
      )}

      {/* ── SORT PANEL ── */}
      {showSortPanel && <SortPanel sorts={sorts} setSorts={setSorts} allFields={allFields} M={M} A={A} onClose={() => setShowSortPanel(false)} />}

      {/* ── ADVANCED FILTER PANEL (operator-based, Layout View style) ── */}
      {showAdvFilters && (
        <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid " + M.div, background: M.hi, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {advFilters.map((fil, fi) => {
              const f      = allFields.find(x => x.col === fil.field);
              const fType  = bulkAdvFieldType(f);
              const ops    = BULK_FILTER_OPS[fType] || BULK_FILTER_OPS.txt;
              const catOpts = fType === 'cat' && f?.opts ? f.opts.map(o => typeof o === 'string' ? o : o.v) : null;
              const isAct  = fil.value !== '';
              const ctrlSel = { fontSize: 10, border: "1px solid " + M.div, borderRadius: 5, padding: "3px 7px", background: M.inBg, color: M.tA, cursor: "pointer", outline: "none" };
              return (
                <div key={fil.id} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, color: M.tD, minWidth: 34, textAlign: "right", fontWeight: 600 }}>{fi === 0 ? "Where" : "And"}</span>
                  <select value={fil.field} onChange={e => updateAdvFilter(fil.id, { field: e.target.value })}
                    style={{ ...ctrlSel, fontWeight: 700, color: "#0e7490", borderColor: "#0891B270", background: "#f0fdfa" }}>
                    {advFieldDefs.map(fd => <option key={fd.key} value={fd.key}>{fd.label}</option>)}
                  </select>
                  <select value={fil.op} onChange={e => updateAdvFilter(fil.id, { op: e.target.value })} style={ctrlSel}>
                    {ops.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  {fType === 'cat' && catOpts ? (
                    <select value={fil.value} onChange={e => updateAdvFilter(fil.id, { value: e.target.value })}
                      style={{ ...ctrlSel, minWidth: 110, fontWeight: 700, borderColor: isAct ? "#0891B270" : M.div, color: isAct ? "#0e7490" : M.tA }}>
                      <option value="">Select value…</option>
                      {catOpts.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input value={fil.value} onChange={e => updateAdvFilter(fil.id, { value: e.target.value })}
                      placeholder={fType === 'num' ? 'Enter number…' : 'Enter text…'}
                      type={fType === 'num' ? 'number' : 'text'}
                      style={{ ...ctrlSel, minWidth: 110, fontWeight: 700, borderColor: isAct ? "#0891B270" : M.div, color: isAct ? "#0e7490" : M.tA }} />
                  )}
                  <button onClick={() => removeAdvFilter(fil.id)}
                    style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 3px", fontWeight: 900 }}>×</button>
                </div>
              );
            })}
            <button onClick={addAdvFilter}
              style={{ alignSelf: "flex-start", marginLeft: 40, border: "none", background: "transparent", color: "#0e7490", fontSize: 9, fontWeight: 700, cursor: "pointer", padding: 0 }}>
              ＋ Add another filter
            </button>
          </div>
        </div>
      )}

      {/* ── ADVANCED SORT PANEL (multi-mode, Layout View style) ── */}
      {showAdvSorts && (
        <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid " + M.div, background: M.hi, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {advSorts.map((srt, si) => {
              const f       = allFields.find(x => x.col === srt.field);
              const fType   = bulkAdvFieldType(f);
              const needVal = srt.mode === 'val_first' || srt.mode === 'val_last';
              const catOpts = needVal && fType === 'cat' && f?.opts ? f.opts.map(o => typeof o === 'string' ? o : o.v) : null;
              const ctrlSel = { fontSize: 10, border: "1px solid " + M.div, borderRadius: 5, padding: "3px 7px", background: M.inBg, color: M.tA, cursor: "pointer", outline: "none" };
              return (
                <div key={srt.id} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, color: M.tD, minWidth: 34, textAlign: "right", fontWeight: 600 }}>{si === 0 ? "Sort" : "Then"}</span>
                  <select value={srt.field} onChange={e => updateAdvSort(srt.id, { field: e.target.value, value: "" })}
                    style={{ ...ctrlSel, fontWeight: 700, color: "#6d28d9", borderColor: "#7c3aed70", background: "#7c3aed10" }}>
                    {advFieldDefs.map(fd => <option key={fd.key} value={fd.key}>{fd.label}</option>)}
                  </select>
                  <select value={srt.mode} onChange={e => updateAdvSort(srt.id, { mode: e.target.value, value: "" })} style={ctrlSel}>
                    {BULK_SORT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  {needVal && (catOpts ? (
                    <select value={srt.value} onChange={e => updateAdvSort(srt.id, { value: e.target.value })}
                      style={{ ...ctrlSel, minWidth: 120, fontWeight: 700 }}>
                      <option value="">Pick value…</option>
                      {catOpts.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input value={srt.value} onChange={e => updateAdvSort(srt.id, { value: e.target.value })}
                      placeholder="Enter value…" style={{ ...ctrlSel, minWidth: 120, fontWeight: 700 }} />
                  ))}
                  {advSorts.length > 1 && (
                    <button onClick={() => removeAdvSort(srt.id)}
                      style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 3px", fontWeight: 900 }}>×</button>
                  )}
                </div>
              );
            })}
            <button onClick={addAdvSort}
              style={{ alignSelf: "flex-start", marginLeft: 40, border: "none", background: "transparent", color: "#6d28d9", fontSize: 9, fontWeight: 700, cursor: "pointer", padding: 0 }}>
              ＋ Add another sort
            </button>
          </div>
        </div>
      )}

      {/* ── COLUMN MANAGER ── */}
      {showCM && (
        <div style={{ padding: "10px 12px", borderBottom: "1px solid " + M.div, background: M.hi, flexShrink: 0, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, letterSpacing: .8, textTransform: "uppercase", marginRight: 4 }}>COLUMNS:</span>
          {allCols.map(col => {
            const f = allFields.find(x => x.col === col);
            const hidden = hiddenC.includes(col);
            return (
              <button key={col} onClick={() => setHiddenC(p => hidden ? p.filter(c => c !== col) : [...p, col])} style={{ padding: "3px 8px", borderRadius: 4, border: "1.5px solid " + (hidden ? M.div : A.a), background: hidden ? M.lo : A.al, color: hidden ? M.tD : A.a, fontSize: 9, fontWeight: hidden ? 700 : 900, cursor: "pointer", textDecoration: hidden ? "line-through" : "none" }}>
                {col} {f?.h}
              </button>
            );
          })}
          <button onClick={() => setHiddenC([])} style={{ padding: "3px 9px", border: "1px solid " + M.inBd, borderRadius: 4, background: M.inBg, color: M.tB, fontSize: 9, fontWeight: 800, cursor: "pointer", marginLeft: 4 }}>Show All</button>
        </div>
      )}

      {/* ── SAVE TEMPLATE ── */}
      {showSave && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid " + M.div, background: "#fdfbff", flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: "#6d28d9", letterSpacing: .8, textTransform: "uppercase" }}>SAVE VIEW:</span>
          <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="View name…" style={{ border: "1.5px solid #c4b5fd", borderRadius: 5, background: "#fff", color: "#1a1a1a", fontSize: 11, padding: "4px 9px", outline: "none", width: 200 }} />
          <button onClick={saveTemplate} style={{ padding: "5px 14px", border: "none", borderRadius: 5, background: "#7C3AED", color: "#fff", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>Save</button>
          <button onClick={() => setShowSave(false)} style={{ padding: "5px 10px", border: "1px solid " + M.inBd, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 10, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      {/* ── Filter + Sort Summary Strip — single combined row ── */}
      {(() => {
        const colEntries = Object.entries(filters).filter(([, v]) => v);
        const anyFilter = colEntries.length > 0 || activeAdvFilterCount > 0;
        if (!anyFilter && !isAdvSortActive) return null;
        const chipF = { display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(8,145,178,.08)", border: "1px solid rgba(8,145,178,.3)", borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: "#0e7490", flexShrink: 0 };
        const chipS = { display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.3)", borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: "#7C3AED", flexShrink: 0 };
        return (
          <div style={{ background: M.hi, borderBottom: "1px solid " + M.div, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
            {anyFilter && (
              <>
                <span style={{ fontSize: 9, fontWeight: 900, color: "#0891B2", flexShrink: 0 }}>FILTERED:</span>
                {/* Per-column filter chips */}
                {colEntries.map(([key, val]) => {
                  const fd = advFieldDefs.find(x => x.key === key);
                  return (
                    <span key={"col_" + key} style={chipF}>
                      {fd?.label || key} <span style={{ fontWeight: 400, color: "#0891B2" }}>contains</span> <strong>{val}</strong>
                      <span onClick={() => setFilters(p => { const n = { ...p }; delete n[key]; return n; })} style={{ cursor: "pointer", color: M.tD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>×</span>
                    </span>
                  );
                })}
                {/* Advanced filter chips */}
                {advFilters.filter(f => f.value !== '').map(fil => {
                  const fd = advFieldDefs.find(x => x.key === fil.field);
                  return (
                    <span key={fil.id} style={chipF}>
                      {fd?.label || fil.field} <span style={{ fontWeight: 400, color: "#0891B2" }}>{fil.op}</span> <strong>{fil.value}</strong>
                      <span onClick={() => removeAdvFilter(fil.id)} style={{ cursor: "pointer", color: M.tD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>×</span>
                    </span>
                  );
                })}
              </>
            )}
            {anyFilter && isAdvSortActive && (
              <div style={{ width: 1, height: 14, background: M.div, flexShrink: 0 }} />
            )}
            {isAdvSortActive && (
              <>
                <span style={{ fontSize: 9, fontWeight: 900, color: "#7C3AED", flexShrink: 0 }}>SORT:</span>
                {advSorts.map(srt => {
                  const fd = advFieldDefs.find(x => x.key === srt.field);
                  const mLabel = BULK_SORT_MODES.find(m => m.value === srt.mode)?.label || srt.mode;
                  return (
                    <span key={srt.id} style={chipS}>
                      {fd?.label || srt.field} <span style={{ fontWeight: 400, color: "#9333ea" }}>{mLabel}</span>{srt.value ? <> <strong>{srt.value}</strong></> : null}
                      {advSorts.length > 1 && <span onClick={() => removeAdvSort(srt.id)} style={{ cursor: "pointer", color: M.tD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>×</span>}
                    </span>
                  );
                })}
              </>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={() => { setFilters({}); setAdvFilters([]); setAdvSorts([]); }} style={{ fontSize: 9, color: "#dc2626", background: "transparent", border: "none", cursor: "pointer", flexShrink: 0 }}>✕ Clear all</button>
          </div>
        );
      })()}

      {/* ── TABLE ── */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 20 }}>
            <tr>
              <th style={{ width: 32, padding: "0 6px", background: M.thd, borderBottom: "2px solid " + CC_RED, position: "sticky", left: 0, zIndex: 21 }}>
                <input type="checkbox" checked={allSel} onChange={e => setSelRows(e.target.checked ? new Set(visRows.map(r => r.__id)) : new Set())} style={{ cursor: "pointer" }} />
              </th>
              <th style={{ width: 34, padding: "0 6px", background: M.thd, borderBottom: "2px solid " + CC_RED, fontSize: 9, color: M.tD, fontWeight: 900 }}>#</th>
              {visCols.map(col => {
                const f = allFields.find(x => x.col === col);
                const sd = sortDir(col);
                const isDrop = dropCol === col && dragCol !== col;
                return (
                  <th key={col} draggable onDragStart={() => onDragStart(col)} onDragOver={e => onDragOver(e, col)} onDrop={() => onDrop(col)} onDragEnd={() => { setDragCol(null); setDropCol(null); }}
                    style={{ minWidth: colW(col), maxWidth: colW(col) + 40, padding: "6px 8px", background: isDrop ? "#fef3c7" : M.thd, borderBottom: "2px solid " + CC_RED, borderLeft: isDrop ? "3px solid #f59e0b" : "3px solid transparent", cursor: "grab", userSelect: "none", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 8, color: M.tD, fontFamily: "monospace", flexShrink: 0 }}>{col}</span>
                      <span style={{ fontSize: 9, fontWeight: 900, color: M.tA, overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{f?.h || col}</span>
                      {f && <span style={{ flexShrink: 0 }}><DtBadge type={f.type} /></span>}
                      <button onClick={() => toggleSort(col)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: sd ? A.a : M.tD, padding: "0 2px", flexShrink: 0 }}>{sd === "asc" ? "↑" : sd === "desc" ? "↓" : "⇅"}</button>
                    </div>
                  </th>
                );
              })}
              <th style={{ width: 40, background: M.thd, borderBottom: "2px solid " + CC_RED }} />
            </tr>
          </thead>
          <tbody>
            {grouped.map((group, gi) => (
              <Fragment key={gi}>
                {group.key !== "__all" && (
                  <tr>
                    <td colSpan={visCols.length + 3} style={{ padding: "6px 12px", background: "#1e293b", borderBottom: "2px solid " + M.div, fontWeight: 900, fontSize: 11, color: "#f1f5f9", letterSpacing: .3 }}>
                      <span style={{ background: CC_RED, color: "#fff", borderRadius: 3, padding: "2px 8px", fontSize: 9, fontWeight: 900, marginRight: 8, fontFamily: "monospace" }}>{group.sub.reduce((n, sg) => n + sg.rows.length, 0)}</span>
                      <span style={{ opacity: .6, marginRight: 4 }}>{allFields.find(f => f.col === groupBy)?.h || groupBy}:</span>
                      <strong>{group.key}</strong>
                    </td>
                  </tr>
                )}
                {group.sub.map((sg, sgi) => (
                  <Fragment key={sgi}>
                    {sg.subKey !== null && (
                      <tr><td colSpan={visCols.length + 3} style={{ padding: "4px 12px 4px 28px", background: "#334155", borderBottom: "1px solid " + M.div, fontSize: 9, fontWeight: 800, color: "#cbd5e1" }}>
                        <span style={{ background: "#7C3AED", color: "#fff", borderRadius: 3, padding: "1px 6px", fontSize: 8, fontWeight: 900, marginRight: 7, fontFamily: "monospace" }}>{sg.rows.length}</span>
                        <span style={{ opacity: .6, marginRight: 4 }}>↳ {allFields.find(f => f.col === subGroupBy)?.h || subGroupBy}:</span>
                        <strong>{sg.subKey}</strong>
                      </td></tr>
                    )}
                    {sg.rows.map((row, ri) => {
                      const isSel = selRows.has(row.__id);
                      const isDirty = row.__dirty || row.__new;
                      const rowErrCols = rowErrors[row.__id] || [];
                      const hasRowErr = rowErrCols.length > 0;
                      const rowBg = isSel ? A.al : hasRowErr ? "#fff5f5" : isDirty ? "#fffbeb" : ri % 2 === 0 ? M.tev : M.tod;
                      return (
                        <tr key={row.__id} style={{ background: rowBg, borderBottom: "1px solid " + M.div, borderLeft: "3px solid " + (hasRowErr ? "#dc2626" : row.__new ? "#0078D4" : isDirty ? "#f59e0b" : isSel ? A.a : "transparent") }}>
                          <td style={{ padding: "0 6px", textAlign: "center", position: "sticky", left: 0, background: rowBg, zIndex: 5 }}>
                            <input type="checkbox" checked={isSel} onChange={e => { setSelRows(prev => { const n = new Set(prev); e.target.checked ? n.add(row.__id) : n.delete(row.__id); return n; }); }} style={{ cursor: "pointer" }} />
                          </td>
                          <td style={{ padding: "3px 6px", fontFamily: "monospace", fontSize: 9, color: M.tD, textAlign: "center" }}>
                            {row.__new ? <span style={{ color: "#0078D4", fontSize: 8, fontWeight: 900 }}>NEW</span> : String(ri + 1).padStart(2, "0")}
                          </td>
                          {visCols.map(col => {
                            const f = allFields.find(x => x.col === col);
                            const isAuto = f?.auto || ["calc", "autocode"].includes(f?.type || "");
                            const isEdit = editCell?.rowId === row.__id && editCell?.col === col;
                            const val = row[col] || "";
                            const isFirst = col === visCols[0];
                            const isMissing = rowErrCols.includes(col);
                            return (
                              <td key={col}
                                onClick={() => { if (!isAuto) { setEditCell({ rowId: row.__id, col }); setRowErrors(p => { const n = { ...p }; if (n[row.__id]) n[row.__id] = n[row.__id].filter(c => c !== col); return n; }); } }}
                                onBlur={() => setEditCell(null)}
                                style={{ padding: "2px 4px", maxWidth: colW(col) + 40, cursor: isAuto ? "default" : "pointer", borderRight: "1px solid " + M.div, background: isMissing ? "#fff0f0" : "inherit" }}>
                                {isAuto ? (
                                  <div style={{ fontSize: fz - 2, color: A.a, fontFamily: "monospace", padding: "3px 5px", background: A.al, borderRadius: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{val || <span style={{ opacity: .5 }}>auto</span>}</div>
                                ) : isEdit ? (
                                  <BulkCell f={f} val={val} onChange={v => updateCell(row.__id, col, v)} onBlur={() => setEditCell(null)} M={M} A={A} fz={fz} fkMap={fkMap} />
                                ) : (
                                  <div style={{ fontSize: fz - 2, color: isFirst ? A.a : M.tA, fontWeight: isFirst ? 700 : 400, fontFamily: ["manual", "autocode"].includes(f?.type) ? "monospace" : "inherit", padding: "3px 5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", borderBottom: "1px dashed " + (isMissing ? "#ef4444" : val ? "transparent" : M.inBd), minHeight: 20 }}>
                                    {val
                                      ? val
                                      : isMissing
                                        ? <span style={{ color: "#dc2626", fontWeight: 900, fontSize: fz - 3 }}>required</span>
                                        : <span style={{ color: M.tD, fontStyle: "italic", fontSize: fz - 3 }}>{f?.req ? "fill required" : "—"}</span>
                                    }
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td style={{ padding: "2px 4px", textAlign: "center" }}>
                            <button onClick={() => { setRows(p => p.filter(r => r.__id !== row.__id)); }} style={{ width: 20, height: 20, borderRadius: 3, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 11, lineHeight: 1 }}>×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </Fragment>
            ))}
            <tr style={{ borderBottom: "1px solid " + M.div }}>
              <td colSpan={visCols.length + 3} style={{ padding: "6px 12px" }}>
                <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 6, color: M.tD, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  <span style={{ fontSize: 16, color: A.a }}>+</span> Add new row
                </button>
              </td>
            </tr>
          </tbody>
          <AggFooter visRows={visRows} visCols={visCols} allFields={allFields} aggState={aggState} openCol={aggOpenInfo?.col || null} onCellClick={aggCellClick} hasCheckbox={true} M={M} />
        </table>
      </div>

      {/* ── AGG DROPDOWN ── */}
      {aggOpenInfo && (
        <>
          <div onClick={() => setAggOpenInfo(null)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />
          <AggDropdown openInfo={aggOpenInfo} aggState={aggState} setAggState={setAggState} visRows={visRows} allFields={allFields} onClose={() => setAggOpenInfo(null)} M={M} />
        </>
      )}

      {/* ── BOTTOM BAR ── */}
      <div style={{ padding: "4px 12px", borderTop: "1px solid " + M.div, background: M.mid, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: M.tD, fontWeight: 700 }}>{rows.length} total · {visRows.length} visible</span>
        {dirtyCount > 0 && <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 900 }}>{dirtyCount} unsaved</span>}
        {selRows.size > 0 && <span style={{ fontSize: 9, color: A.a, fontWeight: 900 }}>{selRows.size} selected</span>}
        {sorts.length > 0 && <span style={{ fontSize: 9, color: "#6d28d9" }}>sorted by {sorts.map(s => s.col).join(", ")}</span>}
        {activeFilters > 0 && <span style={{ fontSize: 9, color: A.a }}>{activeFilters} filter(s)</span>}
        {groupBy && <span style={{ fontSize: 9, color: "#059669" }}>grouped by {allFields.find(f => f.col === groupBy)?.h || groupBy}{subGroupBy && <> → {allFields.find(f => f.col === subGroupBy)?.h || subGroupBy}</>}</span>}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 8, color: M.tD, fontFamily: "monospace" }}>drag headers to reorder · click cell to edit</span>
      </div>

      {/* ── VIEW EDIT MODAL ── */}
      {editingTpl && (
        <ViewEditModal
          allFields={allFields}
          allCols={allCols}
          initial={editingTpl.tpl}
          isNew={!editingTpl.originalName}
          isDup={!editingTpl.originalName}
          existingNames={["Default", ...templates.map(t => t.name).filter(n => n !== editingTpl.originalName)]}
          onSave={commitTplEdit}
          onCancel={() => setEditingTpl(null)}
          M={M} A={A} fz={fz}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "absolute", bottom: 40, right: 16, zIndex: 999, background: toast.color || "#15803d", color: "#fff", borderRadius: 7, padding: "8px 16px", fontSize: 11, fontWeight: 800, boxShadow: "0 4px 20px rgba(0,0,0,.3)" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
