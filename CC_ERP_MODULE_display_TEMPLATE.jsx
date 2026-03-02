/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CC_ERP_MODULE_display_TEMPLATE.jsx                                  ║
 * ║  Version: 1.0  |  Created: Mar 2026                                  ║
 * ║                                                                       ║
 * ║  HOW TO USE THIS FILE                                                 ║
 * ║  1. Copy this entire file and rename it for your module               ║
 * ║     e.g.  CC_ERP_PO_Module.jsx                                        ║
 * ║  2. Search for all TODO blocks — fill in module-specific config only   ║
 * ║  3. All shared components (SortPanel, AggFooter, ViewEditModal etc.)  ║
 * ║     are pre-built and ready — do NOT touch them                       ║
 * ║  4. Read CC_ERP_MODULE_display_SKILL.md for rules & checklists        ║
 * ║                                                                       ║
 * ║  TODO SECTIONS IN THIS FILE:                                          ║
 * ║  [TODO-FK]              FK data sources for this module               ║
 * ║  [TODO-FIELDS]          Field definitions array                       ║
 * ║  [TODO-SECTIONS]        Section groupings for form view               ║
 * ║  [TODO-RECORDS]         Mock records for Records tab                  ║
 * ║  [TODO-VIEWS]           Custom views beyond Full Entry + Quick Entry  ║
 * ║  [TODO-AUTOS]           Auto-compute cascade rules                    ║
 * ║  [TODO-MODULE]          Module-level wiring in App                    ║
 * ║  [TODO-LV-GROUPABLE]    Layout View: groupable fields                 ║
 * ║  [TODO-LV-PRESETS]      Layout View: group presets                    ║
 * ║  [TODO-LV-META]         Layout View: group color/icon metadata        ║
 * ║  [TODO-LV-SCHEMA]       Layout View: detail modal field schema        ║
 * ║  [TODO-LV-INIT-VIEWS]   Layout View: initial locked views             ║
 * ║  [TODO-LV-DISPLAY]      Layout View: display options defaults         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";

const CC_RED = "#CC0000";

// ═══════════════════════════════════════════════════════════
//  THEME & ACCENT TOKENS  — never hardcode elsewhere
// ═══════════════════════════════════════════════════════════
const MODES = {
  light:    { bg:"#f0f2f5", sh:"#fff", shBd:"#e2e4e8", sbBg:"#fff", sbBd:"#e2e4e8", hi:"#fff", mid:"#f7f8fa", lo:"#f0f2f5", hov:"#eef1f8", inBg:"#fff", inBd:"#d1d5db", div:"#e5e7eb", thd:"#f4f5f7", tev:"#fff", tod:"#fafbfc", bBg:"#e5e7eb", bTx:"#374151", tA:"#111827", tB:"#374151", tC:"#6b7280", tD:"#9ca3af", scr:"#d1d5db", shadow:"0 4px 20px rgba(0,0,0,.09)", lbl:"☀️ Light" },
  black:    { bg:"#000", sh:"#0a0a0a", shBd:"#1c1c1c", sbBg:"#0a0a0a", sbBd:"#1c1c1c", hi:"#111", mid:"#161616", lo:"#0a0a0a", hov:"#1c1c1c", inBg:"#0d0d0d", inBd:"#2a2a2a", div:"#1f1f1f", thd:"#0d0d0d", tev:"#111", tod:"#141414", bBg:"#1c1c1c", bTx:"#888", tA:"#f0f0f0", tB:"#a0a0a0", tC:"#666", tD:"#444", scr:"#2a2a2a", shadow:"0 4px 28px rgba(0,0,0,.85)", lbl:"⬛ Black" },
  midnight: { bg:"#0d1117", sh:"#161b22", shBd:"#21262d", sbBg:"#161b22", sbBd:"#21262d", hi:"#1c2128", mid:"#161b22", lo:"#0d1117", hov:"#21262d", inBg:"#0d1117", inBd:"#30363d", div:"#21262d", thd:"#161b22", tev:"#1c2128", tod:"#161b22", bBg:"#21262d", bTx:"#7d8590", tA:"#e6edf3", tB:"#8b949e", tC:"#6e7681", tD:"#484f58", scr:"#30363d", shadow:"0 4px 24px rgba(0,0,0,.6)", lbl:"🌙 Midnight" },
  warm:     { bg:"#f0ebe0", sh:"#fdf8f0", shBd:"#e4d8c4", sbBg:"#fdf8f0", sbBd:"#e4d8c4", hi:"#fdfaf4", mid:"#f5f0e8", lo:"#ede5d4", hov:"#e8dece", inBg:"#fdfaf4", inBd:"#d4c8b0", div:"#ddd0b8", thd:"#f0ebe0", tev:"#fdfaf4", tod:"#f5f0e8", bBg:"#e4d8c4", bTx:"#4a3c28", tA:"#1c1409", tB:"#5a4a34", tC:"#8a7460", tD:"#b0a090", scr:"#c8b89c", shadow:"0 4px 16px rgba(60,40,10,.12)", lbl:"🌅 Warm" },
  slate:    { bg:"#1a2030", sh:"#252d40", shBd:"#2d3654", sbBg:"#1e2433", sbBd:"#2d3654", hi:"#2a3450", mid:"#222a3e", lo:"#1a2030", hov:"#2d3654", inBg:"#1a2030", inBd:"#2d3654", div:"#2d3654", thd:"#1e2433", tev:"#222a3e", tod:"#1e2433", bBg:"#2d3654", bTx:"#8895b0", tA:"#d8e0f0", tB:"#8895b0", tC:"#5a6680", tD:"#3a4460", scr:"#2d3654", shadow:"0 4px 24px rgba(0,0,0,.5)", lbl:"🔷 Slate" },
};
const ACC = {
  orange: { a:"#E8690A", al:"rgba(232,105,10,.12)",  tx:"#fff", lbl:"🟠 Orange" },
  blue:   { a:"#0078D4", al:"rgba(0,120,212,.12)",   tx:"#fff", lbl:"🔵 Blue"   },
  teal:   { a:"#007C7C", al:"rgba(0,124,124,.12)",   tx:"#fff", lbl:"🩵 Teal"   },
  green:  { a:"#15803D", al:"rgba(21,128,61,.12)",   tx:"#fff", lbl:"🟢 Green"  },
  purple: { a:"#7C3AED", al:"rgba(124,58,237,.12)",  tx:"#fff", lbl:"🟣 Purple" },
  rose:   { a:"#BE123C", al:"rgba(190,18,60,.12)",   tx:"#fff", lbl:"🌹 Rose"   },
};
// View builder icon/color pickers
const VCOLS = [
  {v:"#E8690A",l:"Orange"},{v:"#0078D4",l:"Blue"},{v:"#15803D",l:"Green"},
  {v:"#7C3AED",l:"Purple"},{v:"#BE123C",l:"Rose"},{v:"#854d0e",l:"Amber"},
  {v:"#059669",l:"Teal"},  {v:"#6b7280",l:"Grey"},
];
const VICONS = ["⚡","📋","₹","🧵","🏭","🔖","🎯","✅","📊","📦","🏷️","⚙️","👕","🪡","🔗","🎨","💡","📌","🔑","⚠️"];

// ═══════════════════════════════════════════════════════════
//  [TODO-FK]  Foreign-key data sources for THIS module
//  Replace / extend with actual FK arrays from GAS or mock
// ═══════════════════════════════════════════════════════════
const FK = {
  // EXAMPLE — replace with real FK sources for your module:
  // SUPPLIER: [{v:"SUP-001", l:"SUP-001 — Rajinder Fabrics"}],
  // HSN:      [{v:"6105", l:"6105 — Polo Shirts", gst:12}],
  // UOM:      [{v:"MTR", l:"MTR — Metre"}, {v:"KG", l:"KG — Kilogram"}],
};

// ═══════════════════════════════════════════════════════════
//  [TODO-FIELDS]  Field definitions for this module
//  Shape: { col, ico, h, type, req, auto, fk, opts?, hint }
//  ico: K=PrimaryKey M=Mandatory F=FK A=Auto S=Sync C=Calc #=AutoCode _=Optional
//  type: manual|autocode|calc|auto|fk|multifk|dropdown|text|currency|number|url|textarea
// ═══════════════════════════════════════════════════════════
const MODULE_FIELDS = [
  // Replace this with actual fields. Example:
  // {col:"A", ico:"K", h:"Record Code",   type:"manual",   req:true,  auto:false, fk:null,       hint:"Unique code for this record."},
  // {col:"B", ico:"M", h:"Name",          type:"text",     req:true,  auto:false, fk:null,       hint:"Full descriptive name."},
  // {col:"C", ico:"F", h:"Supplier (FK)", type:"fk",       req:false, auto:false, fk:"SUPPLIER", hint:"Link to SUPPLIER_MASTER."},
  // {col:"D", ico:"A", h:"Supplier Name", type:"auto",     req:false, auto:true,  fk:null,       hint:"← GAS auto-fills from SUPPLIER_MASTER."},
  // {col:"E", ico:"_", h:"Status",        type:"dropdown", req:true,  auto:false, fk:null,       hint:"Active / Inactive.", opts:[{v:"Active",l:"Active"},{v:"Inactive",l:"Inactive"}]},
];

// ═══════════════════════════════════════════════════════════
//  [TODO-SECTIONS]  Section groupings for the Form view
//  Each section groups a set of col letters
// ═══════════════════════════════════════════════════════════
const MODULE_SECTIONS = [
  // {id:"identity", icon:"📋", title:"Record Identity", cols:["A","B","C"]},
  // {id:"details",  icon:"⚙️", title:"Details",         cols:["D","E","F"]},
];

// ═══════════════════════════════════════════════════════════
//  [TODO-RECORDS]  Mock records for Records/Reports tab
//  Each object key = col letter, value = cell value
// ═══════════════════════════════════════════════════════════
const MODULE_MOCK_RECORDS = [
  // {A:"CODE-001", B:"Sample Record One",  E:"Active"},
  // {A:"CODE-002", B:"Sample Record Two",  E:"Inactive"},
];

// ═══════════════════════════════════════════════════════════
//  [TODO-VIEWS]  Custom Data Entry views beyond system ones
//  isSystem:false views appear as custom purple pills
// ═══════════════════════════════════════════════════════════
function mkModuleViews(fields) {
  const allCols  = fields.map(f => f.col);
  const mandCols = [...new Set([allCols[0], ...fields.filter(f => f.req && !f.auto).map(f => f.col)])];
  const views = [
    { id:"mod:full",  name:"Full Entry",  icon:"📋", color:"#6b7280", fields:allCols,  isSystem:true,  desc:"Every column — complete form" },
    { id:"mod:quick", name:"Quick Entry", icon:"⚡",  color:"#E8690A", fields:mandCols, isSystem:true,  desc:"Mandatory fields only" },
    // Add custom views here:
    // { id:"mod:custom1", name:"Core Details", icon:"🎯", color:"#7C3AED", fields:["A","B","C"], isSystem:false, desc:"Key fields only" },
  ];
  return views;
}

// ═══════════════════════════════════════════════════════════
//  [TODO-AUTOS]  Auto-compute cascade rules
//  Called on every field change in Entry and Bulk tabs
//  Returns a fully updated data object with auto fields filled
// ═══════════════════════════════════════════════════════════
function computeAutos(col, val, data) {
  const d = { ...data, [col]: val };
  // const n = k => parseFloat(d[k]) || 0;

  // Examples:
  // FK change → auto-fill linked field:
  // if (col === "C") {
  //   const sup = FK.SUPPLIER?.find(s => s.v === val);
  //   d["D"] = sup ? sup.l.split(" — ")[1] || "" : "";
  // }
  // Calculated field:
  // if (col === "Q" || col === "R") {
  //   const wsp = n("Q"), mrp = n("R");
  //   d["S"] = wsp > 0 ? ((mrp - wsp) / wsp * 100).toFixed(2) + "%" : "";
  // }

  return d;
}

// ═══════════════════════════════════════════════════════════
//  DATA TYPE BADGE — used in all 4 tab types
// ═══════════════════════════════════════════════════════════
const DT_MAP = {
  manual:   {bg:"#fff1f2",tx:"#9f1239",bd:"#fecdd3"},
  autocode: {bg:"#ede9fe",tx:"#6d28d9",bd:"#c4b5fd"},
  calc:     {bg:"#fff7ed",tx:"#c2410c",bd:"#fed7aa"},
  auto:     {bg:"#f0fdf4",tx:"#166534",bd:"#bbf7d0"},
  fk:       {bg:"#eff6ff",tx:"#1d4ed8",bd:"#bfdbfe"},
  multifk:  {bg:"#eef2ff",tx:"#4338ca",bd:"#c7d2fe"},
  dropdown: {bg:"#f0f9ff",tx:"#0369a1",bd:"#bae6fd"},
  text:     {bg:"#fafafa",tx:"#374151",bd:"#e5e7eb"},
  currency: {bg:"#fefce8",tx:"#854d0e",bd:"#fde68a"},
  number:   {bg:"#f0fdf4",tx:"#166534",bd:"#bbf7d0"},
  url:      {bg:"#f0fdfa",tx:"#0f766e",bd:"#99f6e4"},
  textarea: {bg:"#fafafa",tx:"#374151",bd:"#e5e7eb"},
};
const DT_LABEL = {
  manual:"Manual", autocode:"AUTO #", calc:"Calc", auto:"Auto", fk:"FK",
  multifk:"Multi-FK", dropdown:"Dropdown", text:"Text", currency:"Rs",
  number:"Number", url:"URL", textarea:"Text Area",
};
function DtBadge({ type }) {
  const d = DT_MAP[type] || DT_MAP.text;
  return (
    <span style={{display:"inline-block",padding:"2px 6px",borderRadius:3,background:d.bg,color:d.tx,border:"1px solid "+d.bd,fontSize:9,fontWeight:800,whiteSpace:"nowrap"}}>
      {DT_LABEL[type] || type}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
//  ICON LABELS — field role indicators
// ═══════════════════════════════════════════════════════════
function IcoLabel({ ico, A }) {
  if (ico === "K") return <span title="Primary Key">🔑</span>;
  if (ico === "M") return <span style={{color:"#ef4444",fontWeight:900}}>⚠</span>;
  if (ico === "F") return <span style={{color:"#2563eb",fontWeight:900}}>→</span>;
  if (ico === "A") return <span style={{color:"#059669",fontWeight:900}}>←</span>;
  if (ico === "S") return <span style={{color:A.a,fontWeight:900}}>⟷</span>;
  if (ico === "C") return <span style={{color:"#c2410c",fontWeight:900}}>∑</span>;
  if (ico === "#") return <span style={{color:"#6d28d9",fontWeight:900}}>#</span>;
  return <span style={{color:"#9ca3af",fontSize:10}}>—</span>;
}

// ═══════════════════════════════════════════════════════════
//  FIELD INPUT — single-form mode input renderer
// ═══════════════════════════════════════════════════════════
function FieldInput({ f, val, onChange, M, A, fz, compact, hasError }) {
  const isAuto = f.auto || ["calc","autocode"].includes(f.type);
  const isMono = ["manual","autocode"].includes(f.type);
  const base = {
    width:"100%", borderRadius:4, outline:"none",
    padding: compact ? "3px 7px" : "5px 9px",
    fontSize: compact ? fz - 2 : fz - 1,
    border: "1px solid " + (hasError ? "#ef4444" : isAuto ? A.a+"40" : M.inBd),
    background: isAuto ? A.al : M.inBg,
    color: isAuto ? A.a : M.tA,
    fontFamily: isMono ? "monospace" : "inherit",
    fontWeight: f.type === "manual" ? 700 : 400,
    cursor: isAuto ? "not-allowed" : "text",
  };
  if (isAuto) return <input style={base} readOnly value={val || ""} placeholder={f.type === "autocode" ? "← GAS generates" : "← GAS auto-fills"} />;
  if (f.type === "textarea") return <textarea rows={compact ? 2 : 3} style={{...base, resize:"vertical"}} value={val || ""} onChange={e => onChange(e.target.value)} placeholder={f.hint} />;
  if (f.type === "dropdown") return (
    <select style={base} value={val || ""} onChange={e => onChange(e.target.value)}>
      <option value="">— select —</option>
      {(f.opts || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  if (f.type === "fk" || f.type === "multifk") return (
    <select style={base} value={val || ""} onChange={e => onChange(e.target.value)}>
      <option value="">— {f.fk} —</option>
      {(FK[f.fk] || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  if (f.type === "currency") return <input type="number" step="0.01" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder="Rs 0.00" />;
  if (f.type === "number")   return <input type="number" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder="0" />;
  return <input type="text" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder={f.hint} />;
}

// ═══════════════════════════════════════════════════════════
//  BULK CELL — inline cell editor for Bulk Entry grid
// ═══════════════════════════════════════════════════════════
function BulkCell({ f, val, onChange, onBlur, M, A, fz }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const base = {width:"100%",border:"2px solid "+A.a,borderRadius:4,background:M.inBg,color:M.tA,fontSize:fz-2,padding:"3px 6px",outline:"none",fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit"};
  if (f?.type === "dropdown" || f?.type === "fk" || f?.type === "multifk") {
    const opts = f.opts || FK[f.fk] || [];
    return (
      <select ref={ref} value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={{...base, cursor:"pointer"}}>
        <option value="">— select —</option>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    );
  }
  if (f?.type === "currency" || f?.type === "number") return <input ref={ref} type="number" value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={base} />;
  return <input ref={ref} type="text" value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={base} />;
}

// ═══════════════════════════════════════════════════════════
//  DRAG HOOK — resizable sidebar / panels
// ═══════════════════════════════════════════════════════════
function useDrag(init, min, max) {
  const [w, setW] = useState(init);
  const [drag, setDrag] = useState(false);
  const sx = useRef(0), sw = useRef(init);
  const onMouseDown = useCallback(e => {
    e.preventDefault(); setDrag(true); sx.current = e.clientX; sw.current = w;
  }, [w]);
  useEffect(() => {
    const mv = e => { if (!drag) return; setW(Math.min(max, Math.max(min, sw.current + (e.clientX - sx.current)))); };
    const up = () => setDrag(false);
    if (drag) { window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up); }
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, [drag, min, max]);
  return { w, drag, onMouseDown };
}

// ═══════════════════════════════════════════════════════════════════
//  Σ AGG ENGINE — 12 aggregation functions (shared by Records+Bulk)
// ═══════════════════════════════════════════════════════════════════
const AGG_OPTIONS = [
  { v:"none",           l:"—",               grp:""          },
  { v:"count",          l:"Count all",        grp:"Count"     },
  { v:"count_values",   l:"Count values",     grp:"Count"     },
  { v:"count_empty",    l:"Count empty",      grp:"Count"     },
  { v:"unique",         l:"Unique values",    grp:"Count"     },
  { v:"sum",            l:"Sum",              grp:"Calculate" },
  { v:"avg",            l:"Average",          grp:"Calculate" },
  { v:"min",            l:"Min",              grp:"Calculate" },
  { v:"max",            l:"Max",              grp:"Calculate" },
  { v:"range",          l:"Range (max−min)",  grp:"Calculate" },
  { v:"median",         l:"Median",           grp:"Calculate" },
  { v:"percent_filled", l:"% Filled",         grp:"Percent"   },
  { v:"percent_empty",  l:"% Empty",          grp:"Percent"   },
];
const AGG_COLORS = {
  count:"#0078D4", count_values:"#0078D4", count_empty:"#6b7280", unique:"#7C3AED",
  sum:"#15803d",   avg:"#E8690A",          min:"#0e7490",         max:"#7c2d12",
  range:"#4338ca", median:"#0891b2",       percent_filled:"#15803d", percent_empty:"#6b7280",
};
function computeAgg(fn, rows, col, allFields) {
  const f       = allFields.find(x => x.col === col);
  const vals    = rows.map(r => r[col]);
  const nonempty = vals.filter(v => v != null && v !== "");
  const nums    = nonempty.map(v => parseFloat(v)).filter(n => !isNaN(n));
  switch(fn) {
    case "none":           return null;
    case "count":          return rows.length;
    case "count_values":   return nonempty.length;
    case "count_empty":    return vals.length - nonempty.length;
    case "unique":         return new Set(nonempty.map(v => String(v))).size;
    case "sum":            return nums.length ? nums.reduce((a,b)=>a+b,0) : null;
    case "avg":            return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null;
    case "min":            return nums.length ? Math.min(...nums) : (nonempty.length ? nonempty.sort()[0] : null);
    case "max":            return nums.length ? Math.max(...nums) : (nonempty.length ? nonempty.sort().slice(-1)[0] : null);
    case "range":          return nums.length >= 2 ? Math.max(...nums) - Math.min(...nums) : null;
    case "median": {
      if (!nums.length) return null;
      const s = [...nums].sort((a,b)=>a-b), m = Math.floor(s.length/2);
      return s.length % 2 ? s[m] : (s[m-1]+s[m])/2;
    }
    case "percent_filled": return rows.length ? (nonempty.length/rows.length)*100 : null;
    case "percent_empty":  return rows.length ? ((rows.length-nonempty.length)/rows.length)*100 : null;
    default: return null;
  }
}
function fmtAgg(fn, val, allFields, col) {
  if (val === null || val === undefined) return "—";
  const f = allFields.find(x => x.col === col);
  const isCur = f?.type === "currency";
  if (["percent_filled","percent_empty"].includes(fn)) return val.toFixed(1) + "%";
  if (typeof val === "number") {
    return isCur
      ? "₹" + val.toLocaleString("en-IN", {maximumFractionDigits:2})
      : val % 1 === 0 ? val.toLocaleString("en-IN") : val.toLocaleString("en-IN",{maximumFractionDigits:2});
  }
  return String(val);
}

// ══ AggDropdown — fixed sibling OUTSIDE table (never inside tfoot) ══
function AggDropdown({ openInfo, aggState, setAggState, visRows, allFields, onClose, M, A }) {
  if (!openInfo) return null;
  const { col, top, left } = openInfo;
  const fn    = aggState?.[col] || "none";
  const val   = fn === "none" ? null : computeAgg(fn, visRows, col, allFields);
  const fmted = fmtAgg(fn, val, allFields, col);
  const handlePick = v => { setAggState(p => ({...p, [col]:v})); onClose(); };
  const grps = [...new Set(AGG_OPTIONS.filter(o=>o.grp).map(o=>o.grp))];
  return (
    <div onMouseDown={e => e.stopPropagation()} style={{
      position:"fixed", top, left, width:224, zIndex:9999,
      background:M.hi, border:"1.5px solid #c4b5fd", borderRadius:10,
      boxShadow:"0 16px 48px rgba(0,0,0,.32)", overflow:"hidden", maxHeight:400,
      display:"flex", flexDirection:"column",
    }}>
      <div style={{padding:"9px 12px",background:"#1e293b",borderBottom:"1px solid #2d3654"}}>
        <div style={{fontSize:11,fontWeight:900,color:"#e2e8f0"}}>{allFields.find(f=>f.col===col)?.h||col}</div>
        <div style={{fontSize:8,color:"#94a3b8",marginTop:1,fontFamily:"monospace"}}>[{col}]{fn!=="none"?" · "+fmted:""}</div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {/* None */}
        <button onClick={() => handlePick("none")} style={{display:"flex",width:"100%",padding:"7px 12px",border:"none",background:fn==="none"?M.hov:M.hi,color:M.tB,fontSize:10,fontWeight:fn==="none"?900:700,cursor:"pointer",textAlign:"left",borderLeft:"3px solid "+(fn==="none"?"#94a3b8":"transparent")}}>—</button>
        {grps.map(grp => (
          <div key={grp}>
            <div style={{padding:"4px 12px",fontSize:8,fontWeight:900,color:"#94a3b8",letterSpacing:.8,textTransform:"uppercase",background:M.mid,borderTop:"1px solid "+M.div,borderBottom:"1px solid "+M.div}}>{grp}</div>
            {AGG_OPTIONS.filter(o=>o.grp===grp).map(o => {
              const isActive = fn === o.v;
              const clr = AGG_COLORS[o.v] || M.tB;
              const ov = isActive ? fmtAgg(o.v, computeAgg(o.v, visRows, col, allFields), allFields, col) : null;
              return (
                <button key={o.v} onClick={() => handlePick(o.v)} style={{display:"flex",alignItems:"center",width:"100%",padding:"7px 12px",border:"none",background:isActive?(clr+"0f"):M.hi,color:isActive?clr:M.tB,fontSize:10,fontWeight:isActive?900:700,cursor:"pointer",textAlign:"left",borderLeft:"3px solid "+(isActive?clr:"transparent")}}>
                  {isActive && <span style={{width:6,height:6,borderRadius:"50%",background:clr,marginRight:6,flexShrink:0}}/>}
                  <span style={{flex:1}}>{o.l}</span>
                  {isActive && ov && <span style={{fontSize:9,background:clr+"20",color:clr,borderRadius:3,padding:"1px 6px",fontFamily:"monospace"}}>{ov}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{padding:"8px 12px",borderTop:"1px solid "+M.div,display:"flex",gap:6,background:M.mid}}>
        {fn !== "none" && <button onClick={() => handlePick("none")} style={{flex:1,padding:"5px",border:"1px solid #fecaca",borderRadius:5,background:"#fef2f2",color:"#dc2626",fontSize:9,fontWeight:900,cursor:"pointer"}}>✕ Remove</button>}
        <button onClick={onClose} style={{flex:1,padding:"5px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Close</button>
      </div>
    </div>
  );
}

// ══ AggFooter — pure tfoot row, no dropdowns ══
function AggFooter({ visRows, visCols, allFields, aggState, openCol, onCellClick, hasCheckbox, M, A }) {
  const PURPLE = "#7C3AED";
  return (
    <tfoot>
      <tr style={{borderTop:"2px solid "+PURPLE}}>
        {hasCheckbox && <td style={{background:"#ede9fe",borderRight:"1px solid "+M.div}}/>}
        <td style={{padding:"6px 10px",background:"#ede9fe",borderRight:"1px solid "+M.div,fontWeight:900,fontSize:9,color:PURPLE,whiteSpace:"nowrap",textAlign:"center",letterSpacing:.5}}>Σ AGG</td>
        {visCols.map(col => {
          const fn   = aggState?.[col] || "none";
          const isOpen = openCol === col;
          const clr  = fn !== "none" ? (AGG_COLORS[col] || PURPLE) : M.tD;
          const val  = fn !== "none" ? computeAgg(fn, visRows, col, allFields) : null;
          const fmted = fn !== "none" ? fmtAgg(fn, val, allFields, col) : null;
          return (
            <td key={col} style={{padding:"3px 4px",background:"#ede9fe",borderRight:"1px solid "+M.div,textAlign:"center"}}>
              <button
                onClick={e => onCellClick(col, e.currentTarget)}
                style={{width:"100%",minHeight:22,padding:"2px 4px",border:`1.5px solid ${isOpen?"#7C3AED":fn!=="none"?(AGG_COLORS[col]||PURPLE)+"40":M.div}`,borderRadius:4,background:fn!=="none"?(AGG_COLORS[col]||PURPLE)+"0a":isOpen?"#ede9fe":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}
              >
                {fn === "none"
                  ? <><span style={{fontSize:11,opacity:.3}}>+</span><span style={{fontSize:7.5,opacity:.3}}>Calculate</span></>
                  : <><span style={{fontFamily:"monospace",fontSize:10,color:clr}}>{fmted}</span><span style={{fontSize:7,opacity:.6,marginLeft:2,color:clr}}>{AGG_OPTIONS.find(o=>o.v===fn)?.l}</span></>
                }
              </button>
            </td>
          );
        })}
        <td style={{background:"#ede9fe"}}/>
      </tr>
    </tfoot>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SORT PANEL — Notion-style multi-level slide-over
//  Shared by RecordsTab and BulkEntry — one component, two uses
// ═══════════════════════════════════════════════════════════════════
const TYPE_OPTIONS = [
  {v:"auto",    l:"Auto-detect"},
  {v:"alpha",   l:"Text (A→Z)"},
  {v:"numeric", l:"Number"},
  {v:"date",    l:"Date"},
  {v:"length",  l:"Text length"},
];
function SortPanel({ sorts, setSorts, allFields, M, A, onClose }) {
  const [dragIdx,  setDragIdx]  = useState(null);
  const [overIdx,  setOverIdx]  = useState(null);
  const [expanded, setExpanded] = useState({});

  const fieldType = col => {
    const f = allFields.find(x => x.col === col);
    if (!f) return "alpha";
    if (["currency","number","calc"].includes(f.type)) return "numeric";
    if (f.type === "date") return "date";
    return "alpha";
  };
  const dirLabel = (type, dir) => {
    if (type === "numeric") return dir === "asc" ? "1 → 9"   : "9 → 1";
    if (type === "date")    return dir === "asc" ? "Oldest"   : "Newest";
    if (type === "length")  return dir === "asc" ? "Shortest" : "Longest";
    return dir === "asc" ? "A → Z" : "Z → A";
  };
  const addSort    = col => { if (!col || sorts.find(s => s.col === col)) return; setSorts(p => [...p, {col, dir:"asc", type:"auto", nulls:"last"}]); };
  const updateSort = (idx, patch) => setSorts(p => p.map((s,i) => i===idx ? {...s,...patch} : s));
  const removeSort = idx => setSorts(p => p.filter((_,i) => i!==idx));
  const moveSort   = (from, to) => { if (from===to) return; setSorts(p => { const a=[...p],[item]=a.splice(from,1); a.splice(to,0,item); return a; }); };

  const onDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed="move"; };
  const onDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const onDrop      = (e, i) => { e.preventDefault(); moveSort(dragIdx, i); setDragIdx(null); setOverIdx(null); };
  const onDragEnd   = () => { setDragIdx(null); setOverIdx(null); };

  const resolvedType = s => s.type === "auto" ? fieldType(s.col) : s.type;
  const available    = allFields.filter(f => !sorts.find(s => s.col === f.col));
  const presets      = [
    {lbl:"Name A→Z",  sorts:[{col:allFields[0]?.col||"A", dir:"asc",  type:"auto", nulls:"last"}]},
    {lbl:"Name Z→A",  sorts:[{col:allFields[0]?.col||"A", dir:"desc", type:"auto", nulls:"last"}]},
    {lbl:"Clear All", sorts:[]},
  ];

  return (
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",pointerEvents:"none"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.18)",pointerEvents:"all"}} />
      <div style={{position:"relative",pointerEvents:"all",width:440,maxHeight:"100%",overflowY:"auto",background:M.hi,borderLeft:"2px solid #7C3AED",boxShadow:"-4px 0 24px rgba(0,0,0,.18)",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:8,background:"#7C3AED",flexShrink:0}}>
          <span style={{fontSize:14}}>↕</span>
          <span style={{fontSize:12,fontWeight:900,color:"#fff",letterSpacing:.3}}>Sort</span>
          <span style={{background:"rgba(255,255,255,.25)",color:"#fff",borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:900}}>{sorts.length} rule{sorts.length!==1?"s":""}</span>
          <div style={{flex:1}} />
          {sorts.length>0 && <button onClick={() => setSorts([])} style={{padding:"4px 10px",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:5,background:"transparent",color:"#fff",fontSize:9,fontWeight:800,cursor:"pointer"}}>✕ Clear all</button>}
          <button onClick={onClose} style={{padding:"4px 8px",border:"none",borderRadius:5,background:"rgba(255,255,255,.15)",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>✕</button>
        </div>
        {/* Quick Presets */}
        <div style={{padding:"8px 14px",borderBottom:"1px solid "+M.div,display:"flex",gap:5,flexWrap:"wrap",flexShrink:0,background:M.mid}}>
          <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",alignSelf:"center",marginRight:4}}>QUICK:</span>
          {presets.map((p, pi) => (
            <button key={pi} onClick={() => setSorts(p.sorts)} style={{padding:"3px 10px",borderRadius:5,border:"1.5px solid "+(pi===presets.length-1?"#fecaca":"#c4b5fd"),background:pi===presets.length-1?"#fef2f2":"#f5f3ff",color:pi===presets.length-1?"#dc2626":"#7C3AED",fontSize:9,fontWeight:800,cursor:"pointer"}}>
              {p.lbl}
            </button>
          ))}
        </div>
        {/* Empty state */}
        {sorts.length===0 && <div style={{padding:"32px 16px",textAlign:"center",color:M.tD}}><div style={{fontSize:28,marginBottom:8}}>↕</div><div style={{fontSize:12,fontWeight:700,color:M.tB,marginBottom:4}}>No sort rules</div><div style={{fontSize:10}}>Add a column below to sort</div></div>}
        {/* Rules */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {sorts.map((s, idx) => {
            const f = allFields.find(x => x.col === s.col);
            const rtype = resolvedType(s);
            const isExp  = expanded[idx];
            const isDrag = dragIdx === idx;
            const isOver = overIdx === idx && dragIdx !== idx;
            return (
              <div key={s.col+idx} draggable onDragStart={e=>onDragStart(e,idx)} onDragOver={e=>onDragOver(e,idx)} onDrop={e=>onDrop(e,idx)} onDragEnd={onDragEnd}
                style={{margin:"2px 10px",borderRadius:8,border:"1.5px solid "+(isOver?"#7C3AED":isDrag?"#c4b5fd":M.div),background:isOver?"#ede9fe":isDrag?"#f5f3ff":M.hi,opacity:isDrag?.5:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px"}}>
                  <span style={{cursor:"grab",fontSize:14,color:M.tD,userSelect:"none"}}>⠿</span>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#7C3AED",color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{idx+1}</div>
                  {idx>0 && <span style={{fontSize:8,fontWeight:700,color:M.tD}}>then by</span>}
                  <select value={s.col} onChange={e=>{if(!e.target.value||sorts.find((x,i)=>x.col===e.target.value&&i!==idx))return; updateSort(idx,{col:e.target.value,type:"auto"});}} style={{flex:1,padding:"5px 8px",border:"1.5px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tA,fontSize:10,fontWeight:700,cursor:"pointer",outline:"none"}}>
                    <option value={s.col}>{f?.h||s.col} [{s.col}]</option>
                    {available.map(af=><option key={af.col} value={af.col}>{af.h} [{af.col}]</option>)}
                  </select>
                  <button onClick={()=>updateSort(idx,{dir:s.dir==="asc"?"desc":"asc"})} style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid #c4b5fd",background:"#f5f3ff",color:"#6d28d9",fontSize:9,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>
                    {dirLabel(rtype,s.dir)}{s.dir==="asc"?" ↑":" ↓"}
                  </button>
                  <button onClick={()=>setExpanded(p=>({...p,[idx]:!p[idx]}))} style={{padding:"4px 6px",borderRadius:5,border:"1px solid "+M.div,background:isExp?"#ede9fe":M.inBg,color:isExp?"#7C3AED":M.tD,fontSize:10,cursor:"pointer"}}>{isExp?"▲":"▼"}</button>
                  <button onClick={()=>{removeSort(idx);setExpanded(p=>{const n={...p};delete n[idx];return n;});}} style={{width:22,height:22,borderRadius:4,border:"1px solid #fecaca",background:"#fef2f2",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:900}}>×</button>
                </div>
                {isExp && (
                  <div style={{borderTop:"1px dashed "+M.div,padding:"8px 10px 10px 42px",background:M.mid,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6}}>Sort type</span>
                      <select value={s.type} onChange={e=>updateSort(idx,{type:e.target.value})} style={{padding:"4px 7px",border:"1px solid #c4b5fd",borderRadius:5,background:"#f5f3ff",color:"#6d28d9",fontSize:9,fontWeight:700,cursor:"pointer",outline:"none"}}>
                        {TYPE_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6}}>Empty values</span>
                      <div style={{display:"flex",borderRadius:5,overflow:"hidden",border:"1px solid #c4b5fd"}}>
                        {["last","first"].map(v=>(
                          <button key={v} onClick={()=>updateSort(idx,{nulls:v})} style={{padding:"4px 10px",border:"none",background:s.nulls===v?"#7C3AED":"#f5f3ff",color:s.nulls===v?"#fff":"#6d28d9",fontSize:9,fontWeight:s.nulls===v?900:700,cursor:"pointer"}}>
                            {v==="last"?"Nulls last":"Nulls first"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6}}>Priority</span>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>idx>0&&moveSort(idx,idx-1)} disabled={idx===0} style={{padding:"4px 8px",borderRadius:5,border:"1px solid "+M.inBd,background:M.inBg,color:idx===0?M.tD:M.tB,fontSize:10,cursor:idx===0?"default":"pointer",opacity:idx===0?.4:1}}>↑</button>
                        <button onClick={()=>idx<sorts.length-1&&moveSort(idx,idx+1)} disabled={idx===sorts.length-1} style={{padding:"4px 8px",borderRadius:5,border:"1px solid "+M.inBd,background:M.inBg,color:idx===sorts.length-1?M.tD:M.tB,fontSize:10,cursor:idx===sorts.length-1?"default":"pointer",opacity:idx===sorts.length-1?.4:1}}>↓</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Add sort */}
        <div style={{padding:"10px 14px",borderTop:"1px solid "+M.div,flexShrink:0,background:M.mid}}>
          <select value="" onChange={e=>{addSort(e.target.value);e.target.value="";}} style={{width:"100%",padding:"8px 12px",border:"2px dashed #c4b5fd",borderRadius:7,background:"#f5f3ff",color:"#7C3AED",fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
            <option value="">+ Pick a column to sort by…</option>
            {available.map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
          </select>
        </div>
        {/* Summary strip */}
        {sorts.length>0 && (
          <div style={{padding:"6px 14px",borderTop:"1px solid "+M.div,background:M.lo,flexShrink:0}}>
            <div style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6,marginBottom:3}}>Active sort order</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {sorts.map((s,i)=>(
                <span key={i} style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:4,padding:"2px 7px",fontSize:8,fontWeight:800,color:"#6d28d9",display:"flex",alignItems:"center",gap:3}}>
                  <span style={{background:"#7C3AED",color:"#fff",borderRadius:"50%",width:12,height:12,fontSize:7,fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{i+1}</span>
                  {allFields.find(x=>x.col===s.col)?.h||s.col}
                  <span style={{opacity:.7}}>{s.dir==="asc"?"↑":"↓"}</span>
                  {s.nulls==="first"&&<span style={{opacity:.5,fontSize:7}}>∅↑</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  VIEW EDIT MODAL — 4-tab editor (Columns / Sort / Filter / Group)
//  Used by both RecordsTab and BulkEntry
// ═══════════════════════════════════════════════════════════════════
function ViewEditModal({ allFields, allCols, initial, isDup, existingNames, onSave, onCancel, M, A, fz }) {
  const [name,       setName]       = useState(initial.name);
  const [hiddenC,    setHiddenC]    = useState([...(initial.hiddenC||[])]);
  const [colOrder,   setColOrder]   = useState([...(initial.colOrder||allCols)]);
  const [sorts,      setSorts]      = useState([...(initial.sorts||[])]);
  const [filters,    setFilters]    = useState({...(initial.filters||{})});
  const [groupBy,    setGroupBy]    = useState(initial.groupBy||null);
  const [subGroupBy, setSubGroupBy] = useState(initial.subGroupBy||null);
  const [activeTab,  setActiveTab]  = useState("columns");

  const nameConflict = existingNames.includes(name.trim());
  const canSave = name.trim().length > 0 && !nameConflict;

  const toggleHide   = col => setHiddenC(p => p.includes(col) ? p.filter(c=>c!==col) : [...p,col]);
  const moveColUp    = col => setColOrder(p => { const a=[...p],i=a.indexOf(col); if(i<=0)return a; [a[i-1],a[i]]=[a[i],a[i-1]]; return a; });
  const moveColDown  = col => setColOrder(p => { const a=[...p],i=a.indexOf(col); if(i<0||i>=a.length-1)return a; [a[i],a[i+1]]=[a[i+1],a[i]]; return a; });

  const TAB_STYLE = t => ({padding:"6px 14px",border:"none",cursor:"pointer",fontSize:10,fontWeight:activeTab===t?900:700,borderBottom:"2px solid "+(activeTab===t?"#7C3AED":"transparent"),background:"transparent",color:activeTab===t?"#7C3AED":M.tC});

  return (
    <>
      <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(3px)",zIndex:2000}} />
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:660,maxHeight:"85vh",background:M.hi,border:"1px solid #c4b5fd",borderRadius:12,zIndex:2001,boxShadow:"0 8px 40px rgba(0,0,0,.4)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:"#7C3AED",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:18}}>{isDup?"⧉":"✏"}</span>
          <div>
            <div style={{fontSize:13,fontWeight:900,color:"#fff"}}>{isDup?"Duplicate View — Edit Before Saving":"Edit Saved View"}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.75)"}}>Change name, columns, sort, filters, group — then Save</div>
          </div>
          <button onClick={onCancel} style={{marginLeft:"auto",width:28,height:28,borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",cursor:"pointer",fontSize:16}}>×</button>
        </div>
        {/* Name */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid "+M.div,background:M.mid,flexShrink:0,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,flexShrink:0}}>VIEW NAME *</span>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter view name…"
            style={{flex:1,border:"2px solid "+(nameConflict?"#ef4444":name.trim()?"#7C3AED":M.inBd),borderRadius:6,background:M.inBg,color:M.tA,fontSize:13,padding:"6px 10px",outline:"none",fontWeight:700}} />
          {nameConflict && <span style={{fontSize:10,color:"#ef4444",fontWeight:700,flexShrink:0}}>{name.trim().toLowerCase()==="default"?'⚠ "Default" is reserved':'⚠ Name already exists'}</span>}
          {!nameConflict && name.trim() && <span style={{fontSize:10,color:"#15803d",fontWeight:700,flexShrink:0}}>✓ OK</span>}
        </div>
        {/* Sub-tabs */}
        <div style={{display:"flex",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0}}>
          {[
            {id:"columns", lbl:"⊟ Columns", badge: hiddenC.length > 0 ? `${hiddenC.length} hidden` : `${colOrder.length}`},
            {id:"sort",    lbl:"↕ Sort",    badge: sorts.length > 0 ? `${sorts.length} active` : null},
            {id:"filter",  lbl:"🔍 Filter",  badge: Object.values(filters).filter(v=>v.trim()).length > 0 ? `${Object.values(filters).filter(v=>v.trim()).length} active` : null},
            {id:"group",   lbl:"⊞ Group",   badge: groupBy ? allFields.find(f=>f.col===groupBy)?.h?.slice(0,12)||groupBy : null},
          ].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={TAB_STYLE(t.id)}>
              {t.lbl}
              {t.badge && <span style={{marginLeft:5,background:activeTab===t.id?"#7C3AED":"#e0e7ef",color:activeTab===t.id?"#fff":"#374151",borderRadius:10,padding:"1px 6px",fontSize:8,fontWeight:900}}>{t.badge}</span>}
            </button>
          ))}
        </div>
        {/* Tab body */}
        <div style={{flex:1,overflowY:"auto"}}>
          {/* COLUMNS */}
          {activeTab==="columns" && (
            <div style={{padding:12}}>
              <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
                <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Toggle visibility · ↑↓ reorder</span>
                <button onClick={()=>setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:"auto"}}>Show All</button>
              </div>
              <div style={{border:"1px solid "+M.div,borderRadius:7,overflow:"hidden"}}>
                {colOrder.map((col,idx) => {
                  const f = allFields.find(x=>x.col===col);
                  const isHidden = hiddenC.includes(col);
                  return (
                    <div key={col} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderBottom:"1px solid "+M.div,background:isHidden?M.lo:M.hi,opacity:isHidden?.55:1}}>
                      <button onClick={()=>toggleHide(col)} style={{width:28,height:18,borderRadius:9,border:"none",cursor:"pointer",background:isHidden?"#d1d5db":"#7C3AED",position:"relative",flexShrink:0}}>
                        <span style={{position:"absolute",top:2,width:14,height:14,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.3)",left:isHidden?2:12}} />
                      </button>
                      <span style={{fontFamily:"monospace",fontSize:8,fontWeight:700,color:M.tD,width:20,flexShrink:0}}>{col}</span>
                      <span style={{flex:1,fontSize:fz-2,fontWeight:700,color:isHidden?M.tD:M.tA}}>{f?.h||col}</span>
                      {f && <DtBadge type={f.type} />}
                      <button onClick={()=>moveColUp(col)} disabled={idx===0} style={{width:18,height:18,borderRadius:3,border:"none",background:idx===0?M.lo:M.mid,color:idx===0?M.tD:M.tB,cursor:idx===0?"default":"pointer",fontSize:10}}>↑</button>
                      <button onClick={()=>moveColDown(col)} disabled={idx===colOrder.length-1} style={{width:18,height:18,borderRadius:3,border:"none",background:idx===colOrder.length-1?M.lo:M.mid,color:idx===colOrder.length-1?M.tD:M.tB,cursor:idx===colOrder.length-1?"default":"pointer",fontSize:10}}>↓</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* SORT */}
          {activeTab==="sort" && (
            <div style={{padding:12}}>
              <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Multi-level sort — first rule wins</span>
                {sorts.length>0 && <button onClick={()=>setSorts([])} style={{marginLeft:"auto",padding:"3px 9px",border:"1px solid #c4b5fd",borderRadius:4,background:"#ede9fe",color:"#6d28d9",fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>}
              </div>
              {sorts.length===0 && <div style={{padding:"20px",textAlign:"center",fontSize:11,color:M.tD,background:M.lo,borderRadius:7}}>No sorts — add a column below</div>}
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                {sorts.map((s,i) => {
                  const f = allFields.find(x=>x.col===s.col);
                  return (
                    <div key={s.col} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:7}}>
                      <span style={{fontSize:11,fontWeight:900,color:"#6d28d9",minWidth:18}}>{i+1}.</span>
                      <span style={{flex:1,fontSize:11,fontWeight:700,color:M.tA}}>{f?.h||s.col}</span>
                      <button onClick={()=>setSorts(p=>p.map(x=>x.col===s.col?{...x,dir:x.dir==="asc"?"desc":"asc"}:x))} style={{padding:"4px 12px",border:"1.5px solid #7C3AED",borderRadius:5,background:"#fff",color:"#7C3AED",fontSize:10,fontWeight:900,cursor:"pointer"}}>
                        {s.dir==="asc"?"↑ A → Z":"↓ Z → A"}
                      </button>
                      <button onClick={()=>setSorts(p=>p.filter(x=>x.col!==s.col))} style={{width:24,height:24,borderRadius:5,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",cursor:"pointer",fontSize:13,fontWeight:900}}>×</button>
                    </div>
                  );
                })}
              </div>
              <select onChange={e=>{if(e.target.value){setSorts(p=>[...p,{col:e.target.value,dir:"asc",type:"auto",nulls:"last"}]);}e.target.value="";}} value="" style={{padding:"6px 10px",border:"1.5px solid #c4b5fd",borderRadius:6,background:"#fdf4ff",color:"#7C3AED",fontSize:10,fontWeight:900,outline:"none",cursor:"pointer",width:"100%"}}>
                <option value="">+ Add sort column…</option>
                {allFields.filter(f=>!sorts.find(s=>s.col===f.col)).map(f=><option key={f.col} value={f.col}>{f.h} [{f.col}]</option>)}
              </select>
            </div>
          )}
          {/* FILTER */}
          {activeTab==="filter" && (
            <div style={{padding:12}}>
              <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Per-column text filters</span>
                <button onClick={()=>setFilters({})} style={{marginLeft:"auto",padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {allFields.filter(f=>!f.auto&&!["calc","autocode"].includes(f.type)).map(f => (
                  <div key={f.col} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:M.lo,border:"1px solid "+(filters[f.col]?.trim()?A.a:M.div),borderRadius:6}}>
                    <span style={{fontFamily:"monospace",fontSize:8,fontWeight:700,color:M.tD,width:20,flexShrink:0}}>{f.col}</span>
                    <span style={{fontSize:10,fontWeight:700,color:M.tB,flex:1}}>{f.h}</span>
                    <input value={filters[f.col]||""} onChange={e=>setFilters(p=>({...p,[f.col]:e.target.value}))} placeholder="Filter value…"
                      style={{border:"1px solid "+(filters[f.col]?.trim()?A.a:M.inBd),borderRadius:4,background:M.inBg,color:M.tA,fontSize:10,padding:"3px 8px",outline:"none",width:160}} />
                    {filters[f.col]?.trim() && <button onClick={()=>setFilters(p=>{const n={...p};delete n[f.col];return n;})} style={{border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:12}}>×</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* GROUP */}
          {activeTab==="group" && (
            <div style={{padding:12}}>
              <div style={{marginBottom:8,fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Primary Group</div>
              <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:16}}>
                <label style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:groupBy===null?A.al:M.lo,border:"1px solid "+(groupBy===null?A.a:M.div),borderRadius:6,cursor:"pointer"}}>
                  <input type="radio" checked={groupBy===null} onChange={()=>{setGroupBy(null);setSubGroupBy(null);}} style={{margin:0}} />
                  <span style={{fontSize:10,fontWeight:groupBy===null?900:700,color:groupBy===null?A.a:M.tB}}>No grouping</span>
                </label>
                {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)).map(f=>(
                  <label key={f.col} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:groupBy===f.col?A.al:M.lo,border:"1px solid "+(groupBy===f.col?A.a:M.div),borderRadius:6,cursor:"pointer"}}>
                    <input type="radio" checked={groupBy===f.col} onChange={()=>{setGroupBy(f.col);setSubGroupBy(null);}} style={{margin:0}} />
                    <span style={{fontFamily:"monospace",fontSize:8,color:M.tD,width:20}}>{f.col}</span>
                    <span style={{fontSize:10,fontWeight:groupBy===f.col?900:700,color:groupBy===f.col?A.a:M.tB}}>{f.h}</span>
                    <DtBadge type={f.type} />
                  </label>
                ))}
              </div>
              {groupBy && <>
                <div style={{borderTop:"2px dashed #c4b5fd",paddingTop:12,marginBottom:8,fontSize:9,fontWeight:900,color:"#6d28d9",textTransform:"uppercase",letterSpacing:.8}}>Sub-Group (within each group)</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:subGroupBy===null?"#ede9fe":M.lo,border:"1px solid "+(subGroupBy===null?"#7C3AED":M.div),borderRadius:6,cursor:"pointer"}}>
                    <input type="radio" checked={subGroupBy===null} onChange={()=>setSubGroupBy(null)} style={{margin:0}} />
                    <span style={{fontSize:10,fontWeight:subGroupBy===null?900:700,color:subGroupBy===null?"#6d28d9":M.tB}}>No sub-grouping</span>
                  </label>
                  {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)&&f.col!==groupBy).map(f=>(
                    <label key={f.col} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:subGroupBy===f.col?"#ede9fe":M.lo,border:"1px solid "+(subGroupBy===f.col?"#7C3AED":M.div),borderRadius:6,cursor:"pointer"}}>
                      <input type="radio" checked={subGroupBy===f.col} onChange={()=>setSubGroupBy(f.col)} style={{margin:0}} />
                      <span style={{fontFamily:"monospace",fontSize:8,color:M.tD,width:20}}>{f.col}</span>
                      <span style={{fontSize:10,fontWeight:subGroupBy===f.col?900:700,color:subGroupBy===f.col?"#6d28d9":M.tB}}>{f.h}</span>
                    </label>
                  ))}
                </div>
              </>}
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{padding:"10px 16px",borderTop:"1px solid "+M.div,display:"flex",alignItems:"center",gap:8,background:M.mid,flexShrink:0}}>
          <div style={{flex:1,fontSize:9,color:M.tC}}>{`${colOrder.filter(c=>!hiddenC.includes(c)).length} visible · ${sorts.length} sort(s) · ${Object.values(filters).filter(v=>v.trim()).length} filter(s)${groupBy?" · grouped":""}${subGroupBy?" · sub-grouped":""}`}</div>
          {!canSave && <span style={{fontSize:10,color:"#ef4444",fontWeight:700}}>{nameConflict?"⚠ Name already taken":"⚠ Enter a name"}</span>}
          <button onClick={onCancel} style={{padding:"7px 16px",border:"1px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tB,fontSize:11,fontWeight:800,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>canSave&&onSave({name:name.trim(),colOrder,hiddenC,sorts,filters,groupBy,subGroupBy})} disabled={!canSave}
            style={{padding:"7px 22px",border:"none",borderRadius:6,background:canSave?"#7C3AED":M.bBg,color:canSave?"#fff":M.tD,fontSize:11,fontWeight:900,cursor:canSave?"pointer":"default",opacity:canSave?1:.6}}>
            💾 Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ADVANCED FILTER / SORT — operator-based, Layout View style
//  Used by both RecordsTab and BulkEntryTab (§RECORDS-G/H/I, §BULK_ENTRY-J/K/L)
// ═══════════════════════════════════════════════════════════════════
const ADV_FILTER_OPS = {
  cat: ['is', 'is not'],
  txt: ['contains', 'not contains', 'starts with'],
  num: ['=', '≠', '>', '<', '≥', '≤'],
};
const ADV_SORT_MODES = [
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
function advFieldType(f) {
  if (!f) return 'txt';
  if (f.type==='number'||f.type==='currency'||f.type==='calc') return 'num';
  if (f.type==='select'||f.options?.length||f.opts?.length||['fk','multifk','dropdown'].includes(f.type)) return 'cat';
  return 'txt';
}
function evalAdvFilter(row, { field, op, value }, fields) {
  const f = fields?.find(x => (x.key||x.col) === field);
  const fType = advFieldType(f);
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
function applyAdvSort(arr, advSorts, freqMaps) {
  if (!advSorts.length) return arr;
  return [...arr].sort((a, b) => {
    for (const s of advSorts) {
      const av = a[s.field]??'', bv = b[s.field]??'';
      const ae = av===''||av==null, be = bv===''||bv==null;
      let cmp = 0;
      if      (s.mode==='nil_first') { if(ae!==be) cmp=ae?-1:1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='nil_last')  { if(ae!==be) cmp=ae?1:-1;  else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='freq_hi')   { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fb-fa; }
      else if (s.mode==='freq_lo')   { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fa-fb; }
      else if (s.mode==='num_lo')    cmp=parseFloat(av||0)-parseFloat(bv||0);
      else if (s.mode==='num_hi')    cmp=parseFloat(bv||0)-parseFloat(av||0);
      else if (s.mode==='val_first') { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm) cmp=am?-1:1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='val_last')  { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm) cmp=am?1:-1;  else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='z_a')       cmp=String(bv).localeCompare(String(av),undefined,{sensitivity:'base'});
      else                           cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'});
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

// ═══════════════════════════════════════════════════════════════════
//  SHARED VIEW HELPERS — used in both RecordsTab and BulkEntry
// ═══════════════════════════════════════════════════════════════════
function buildViewState(vs, allCols) {
  const savedOrder  = vs?.colOrder ? vs.colOrder.filter(c => allCols.includes(c)) : [];
  const missingCols = allCols.filter(c => !savedOrder.includes(c));
  return {
    colOrder:       savedOrder.length > 0 ? [...savedOrder, ...missingCols] : allCols,
    hiddenC:        vs?.hiddenC        ?? [],
    sorts:          vs?.sorts          ?? [],
    filters:        vs?.filters        ?? {},
    groupBy:        vs?.groupBy        ?? null,
    subGroupBy:     vs?.subGroupBy     ?? null,
    activeViewName: vs?.activeViewName ?? "Default",
  };
}
function buildGrouped(visRows, groupBy, subGroupBy) {
  if (!groupBy) return [{key:null, sub:[{subKey:null, rows:visRows}]}];
  const map = {};
  visRows.forEach(r => { const k = String(r[groupBy]||"(blank)"); if(!map[k]) map[k]=[]; map[k].push(r); });
  return Object.entries(map).map(([key, rows]) => {
    if (!subGroupBy || subGroupBy===groupBy) return {key, sub:[{subKey:null, rows}]};
    const smap = {};
    rows.forEach(r => { const sk=String(r[subGroupBy]||"(blank)"); if(!smap[sk]) smap[sk]=[]; smap[sk].push(r); });
    return {key, sub:Object.entries(smap).map(([subKey,rows])=>({subKey,rows}))};
  });
}
function applySortFilter(rows, sorts, filters, allFields) {
  let rs = [...rows];
  Object.entries(filters).forEach(([col,val]) => {
    if (!val?.trim()) return;
    rs = rs.filter(r => String(r[col]||"").toLowerCase().includes(val.trim().toLowerCase()));
  });
  if (sorts.length > 0) {
    rs.sort((a,b) => {
      for (const {col,dir,type,nulls} of sorts) {
        const av=a[col], bv=b[col];
        const an=av==null||av==="", bn=bv==null||bv==="";
        if(an&&bn) continue;
        if(an) return nulls==="first"?-1:1;
        if(bn) return nulls==="first"?1:-1;
        const ft=type==="auto"||!type?(()=>{const f=allFields.find(x=>x.col===col);return ["currency","number","calc"].includes(f?.type)?"numeric":f?.type==="date"?"date":"alpha";})():type;
        let d=0;
        if(ft==="numeric"){d=parseFloat(av)-parseFloat(bv);if(isNaN(d))d=0;}
        else if(ft==="date"){d=new Date(av)-new Date(bv);if(isNaN(d))d=0;}
        else if(ft==="length"){d=String(av).length-String(bv).length;}
        else{d=String(av).localeCompare(String(bv),undefined,{sensitivity:"base"});}
        if(d!==0) return dir==="asc"?d:-d;
      }
      return 0;
    });
  }
  return rs;
}

// ═══════════════════════════════════════════════════════════════════
//  RECORDS TAB — read-only browser with full view system
// ═══════════════════════════════════════════════════════════════════
function RecordsTab({ allFields, mockRecords, M, A, fz, pyV, viewState, setViewState, templates, onSaveTemplate, onDeleteTemplate }) {
  const allCols = allFields.map(f => f.col);
  const DEFAULT_VIEW = {name:"Default",__builtin:true,colOrder:allCols,hiddenC:[],sorts:[],filters:{},groupBy:null,subGroupBy:null};

  const {colOrder,hiddenC,sorts,filters,groupBy,subGroupBy,activeViewName} = buildViewState(viewState, allCols);
  const setColOrder      = v => setViewState(p=>({...(p||{}),colOrder:      typeof v==="function"?v((p||{}).colOrder??allCols):v}));
  const setHiddenC       = v => setViewState(p=>({...(p||{}),hiddenC:       typeof v==="function"?v((p||{}).hiddenC??[]):v}));
  const setSorts         = v => setViewState(p=>({...(p||{}),sorts:         typeof v==="function"?v((p||{}).sorts??[]):v}));
  const setFilters       = v => setViewState(p=>({...(p||{}),filters:       typeof v==="function"?v((p||{}).filters??{}):v}));
  const setGroupBy       = v => setViewState(p=>({...(p||{}),groupBy:       typeof v==="function"?v((p||{}).groupBy??null):v}));
  const setSubGroupBy    = v => setViewState(p=>({...(p||{}),subGroupBy:    typeof v==="function"?v((p||{}).subGroupBy??null):v}));
  const setActiveViewName= v => setViewState(p=>({...(p||{}),activeViewName:typeof v==="function"?v((p||{}).activeViewName??"Default"):v}));

  const [search,        setSearch]        = useState("");
  const [showFP,        setShowFP]        = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [showCM,        setShowCM]        = useState(false);
  const [aggState,      setAggState]      = useState({});
  const [aggOpenInfo,   setAggOpenInfo]   = useState(null);
  const [showSave,      setShowSave]      = useState(false);
  const [tplName,       setTplName]       = useState("");
  const [renamingTpl,   setRenamingTpl]   = useState(null);
  const [editingTpl,    setEditingTpl]    = useState(null);
  const [viewSwitchGuard,setViewSwitchGuard]=useState(null);
  const [dragCol,       setDragCol]       = useState(null);
  const [dropCol,       setDropCol]       = useState(null);
  const [exportMenu,    setExportMenu]    = useState(false);
  const [toast,         setToast]         = useState(null);
  // §RECORDS-G/H: Advanced filter + sort (Layout View style)
  const [advFilters,     setAdvFilters]    = useState([]);
  const [advSorts,       setAdvSorts]      = useState([]);
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [showAdvSorts,   setShowAdvSorts]   = useState(false);

  const showToast = (msg, color="#15803d") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };

  const visCols = colOrder.filter(c => !hiddenC.includes(c) && allCols.includes(c));
  const activeFilters = Object.values(filters).filter(v=>v.trim()).length;
  const activeAdvFilterCount = advFilters.filter(f => f.value !== "").length;
  const isAdvSortActive = advSorts.length > 0;

  // Advanced filter/sort helpers
  const addAdvFilter    = () => { setAdvFilters(p=>[...p,{id:Date.now(),field:allFields[0]?.col||"",op:"is",value:""}]); };
  const removeAdvFilter = id  => setAdvFilters(p=>p.filter(f=>f.id!==id));
  const updateAdvFilter = (id,patch) => setAdvFilters(p=>p.map(f=>{if(f.id!==id)return f;const m={...f,...patch};if(patch.field&&patch.field!==f.field){const ft=advFieldType(allFields.find(x=>x.col===patch.field));m.op=ADV_FILTER_OPS[ft]?.[0]||"is";m.value="";}return m;}));
  const addAdvSort    = () => setAdvSorts(p=>[...p,{id:Date.now(),field:allFields[0]?.col||"",mode:"a_z",value:""}]);
  const removeAdvSort = id  => setAdvSorts(p=>p.length>1?p.filter(s=>s.id!==id):p);
  const updateAdvSort = (id,patch) => setAdvSorts(p=>p.map(s=>s.id===id?{...s,...patch}:s));

  // Build frequency maps for freq_hi / freq_lo sort modes
  const freqMaps = {};
  allFields.forEach(f=>{const c={};mockRecords.forEach(r=>{const v=String(r[f.col]??"");c[v]=(c[v]||0)+1;});freqMaps[f.col]=c;});

  let visRows = applySortFilter(
    search.trim() ? mockRecords.filter(r => Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase())) : mockRecords,
    sorts, filters, allFields
  );
  // Apply advanced filters
  advFilters.forEach(fil => { if(fil.value!=="") visRows=visRows.filter(r=>evalAdvFilter(r,fil,allFields)); });
  // Apply advanced sorts after column-click sorts
  if (isAdvSortActive) visRows = applyAdvSort(visRows, advSorts, freqMaps);

  const grouped = buildGrouped(visRows, groupBy, subGroupBy);

  const aggCellClick = (col, el) => {
    if (aggOpenInfo?.col===col) { setAggOpenInfo(null); return; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAggOpenInfo({col, top:Math.max(8,r.top-410), left:Math.min(r.left,window.innerWidth-230)});
  };

  const getViewDirty = () => {
    if (activeViewName==="Default") return !(JSON.stringify(colOrder)===JSON.stringify(allCols)&&hiddenC.length===0&&sorts.length===0&&Object.values(filters).every(v=>!v.trim())&&groupBy===null&&subGroupBy===null);
    const saved=templates.find(t=>t.name===activeViewName);
    if(!saved) return false;
    return JSON.stringify(colOrder)!==JSON.stringify((saved.colOrder||allCols).filter(c=>allCols.includes(c)))||JSON.stringify(hiddenC)!==JSON.stringify(saved.hiddenC||[])||JSON.stringify(sorts)!==JSON.stringify(saved.sorts||[])||JSON.stringify(filters)!==JSON.stringify(saved.filters||{})||groupBy!==(saved.groupBy||null)||subGroupBy!==(saved.subGroupBy||null);
  };
  const viewDirty = getViewDirty();

  const loadTemplate = tpl => {
    setColOrder((tpl.colOrder||allCols).filter(c=>allCols.includes(c)));
    setHiddenC(tpl.hiddenC||[]); setSorts(tpl.sorts||[]); setFilters(tpl.filters||{});
    setGroupBy(tpl.groupBy||null); setSubGroupBy(tpl.subGroupBy||null);
    setActiveViewName(tpl.name);
    showToast(`📂 View "${tpl.name}" loaded`,"#7C3AED");
  };
  const tryLoadTemplate = tpl => {
    if (viewDirty && tpl.name !== activeViewName) setViewSwitchGuard({pendingTpl:tpl});
    else loadTemplate(tpl);
  };
  const updateCurrentView = () => {
    if (activeViewName==="Default") return;
    onSaveTemplate({name:activeViewName,colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy});
    showToast(`✅ View "${activeViewName}" updated`);
  };
  const saveTemplate = () => {
    if (!tplName.trim()) return;
    if (tplName.trim().toLowerCase()==="default") { showToast('⚠ "Default" is reserved',"#dc2626"); return; }
    if (templates.find(t=>t.name===tplName.trim())) { showToast(`⚠ "${tplName.trim()}" already exists`,"#dc2626"); return; }
    onSaveTemplate({name:tplName.trim(),colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy});
    setActiveViewName(tplName.trim()); setTplName(""); setShowSave(false);
    showToast(`💾 View "${tplName.trim()}" saved`);
  };
  const deleteTemplate = name => {
    onDeleteTemplate(name);
    if (activeViewName===name) setActiveViewName("Default");
    showToast(`🗑 View "${name}" deleted`,"#dc2626");
  };
  const renameTemplate = (oldName, newName) => {
    if (!newName.trim()||newName.trim()===oldName) { setRenamingTpl(null); return; }
    if (newName.trim().toLowerCase()==="default") { showToast('⚠ Reserved name',"#dc2626"); setRenamingTpl(null); return; }
    if (templates.find(t=>t.name===newName.trim())) { showToast(`⚠ Already exists`,"#dc2626"); return; }
    const tpl=templates.find(t=>t.name===oldName); if(!tpl) return;
    onDeleteTemplate(oldName); onSaveTemplate({...tpl,name:newName.trim()});
    if (activeViewName===oldName) setActiveViewName(newName.trim());
    showToast(`✏ Renamed to "${newName.trim()}"`,"#0078D4");
    setRenamingTpl(null);
  };
  const editTemplate = tpl => setEditingTpl({tpl:{...tpl,colOrder:[...tpl.colOrder],hiddenC:[...tpl.hiddenC],sorts:[...tpl.sorts],filters:{...tpl.filters}},originalName:tpl.name});
  const dupTemplate  = tpl => {
    let dupName=tpl.name+" (copy)"; let i=1;
    while(templates.find(t=>t.name===dupName)||dupName.toLowerCase()==="default") dupName=tpl.name+` (copy ${++i})`;
    setEditingTpl({tpl:{...tpl,name:dupName},originalName:null});
  };
  const commitTplEdit = updated => {
    if (updated.name.toLowerCase()==="default") { showToast('⚠ "Default" is reserved',"#dc2626"); return; }
    if (editingTpl.originalName&&editingTpl.originalName!==updated.name) onDeleteTemplate(editingTpl.originalName);
    onSaveTemplate(updated); setActiveViewName(updated.name);
    showToast(`✅ View "${updated.name}" ${editingTpl.originalName?"updated":"created"}`);
    setEditingTpl(null);
  };

  const colW = col => { const f=allFields.find(x=>x.col===col); if(!f) return 110; if(f.type==="textarea") return 160; if(["currency","number"].includes(f.type)) return 80; if(["manual","autocode"].includes(f.type)) return 100; return 120; };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>
      {/* ── Toolbar Row 1 ── */}
      <div style={{padding:"6px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
        {/* §RECORDS-G/H: Advanced Filter + Sort — LEFT of toolbar, always visible */}
        <button onClick={()=>{const op=!showAdvFilters;setShowAdvFilters(op);setShowAdvSorts(false);if(op&&advFilters.length===0)addAdvFilter();}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showAdvFilters||activeAdvFilterCount>0?"#0891B2":M.inBd),background:showAdvFilters||activeAdvFilterCount>0?"rgba(8,145,178,.1)":M.inBg,color:showAdvFilters||activeAdvFilterCount>0?"#0e7490":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          ＋ Filter {activeAdvFilterCount>0&&<span style={{background:"#0891B2",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{activeAdvFilterCount}</span>}
        </button>
        <button onClick={()=>{const op=!showAdvSorts;setShowAdvSorts(op);setShowAdvFilters(false);if(op&&advSorts.length===0)addAdvSort();}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showAdvSorts||isAdvSortActive?"#7C3AED":M.inBd),background:showAdvSorts||isAdvSortActive?"rgba(124,58,237,.1)":M.inBg,color:showAdvSorts||isAdvSortActive?"#7C3AED":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          ↑ Sort {isAdvSortActive&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{advSorts.length}</span>}
        </button>
        {(activeAdvFilterCount>0||isAdvSortActive)&&<button onClick={()=>{setAdvFilters([]);setAdvSorts([]);}} style={{padding:"5px 9px",borderRadius:5,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:900,cursor:"pointer",flexShrink:0}}>✕ Reset</button>}
        <div style={{width:1,height:22,background:M.div,margin:"0 2px",flexShrink:0}} />
        <div style={{position:"relative",display:"flex",alignItems:"center"}}>
          <span style={{position:"absolute",left:8,fontSize:11,color:M.tD}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search all fields…"
            style={{border:"1.5px solid "+(search?A.a:M.inBd),borderRadius:5,background:M.inBg,color:M.tA,fontSize:fz-1,padding:"5px 10px 5px 26px",outline:"none",width:210}} />
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:6,border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:12,padding:0}}>×</button>}
        </div>
        <span style={{fontSize:10,color:M.tC,fontWeight:700}}>{visRows.length} of {mockRecords.length} records</span>
        <div style={{width:1,height:22,background:M.div,margin:"0 2px"}} />
        <button onClick={()=>{setShowFP(p=>!p);setShowSortPanel(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showFP||activeFilters>0?A.a:M.inBd),background:showFP||activeFilters>0?A.al:M.inBg,color:showFP||activeFilters>0?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ⚡ Filter {activeFilters>0&&<span style={{background:A.a,color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{activeFilters}</span>}
        </button>
        <button onClick={()=>{setShowSortPanel(true);setShowFP(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showSortPanel||sorts.length>0?"#7C3AED":M.inBd),background:showSortPanel||sorts.length>0?"#ede9fe":M.inBg,color:showSortPanel||sorts.length>0?"#6d28d9":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ⇅ Sort {sorts.length>0&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{sorts.length}</span>}
        </button>
        <select value={groupBy||""} onChange={e=>{setGroupBy(e.target.value||null);if(!e.target.value)setSubGroupBy(null);}} style={{padding:"5px 8px",border:"1.5px solid "+(groupBy?"#059669":M.inBd),borderRadius:5,background:groupBy?"#f0fdf4":M.inBg,color:groupBy?"#15803d":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">⊞ Group by…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>
        {groupBy&&<select value={subGroupBy||""} onChange={e=>setSubGroupBy(e.target.value||null)} style={{padding:"5px 8px",border:"1.5px solid "+(subGroupBy?"#7C3AED":"#bbf7d0"),borderRadius:5,background:subGroupBy?"#ede9fe":"#f0fdf4",color:subGroupBy?"#6d28d9":"#15803d",fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">↳ Sub-group…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)&&f.col!==groupBy).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>}
        <button onClick={()=>{setShowCM(p=>!p);setShowFP(false);setShowSortPanel(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showCM||hiddenC.length>0?"#0078D4":M.inBd),background:showCM||hiddenC.length>0?"#eff6ff":M.inBg,color:showCM||hiddenC.length>0?"#1d4ed8":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ⊟ Cols {hiddenC.length>0&&<span style={{background:"#0078D4",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{hiddenC.length}</span>}
        </button>
        <div style={{flex:1}} />
        {/* Export */}
        <div style={{position:"relative"}}>
          <button onClick={()=>setExportMenu(p=>!p)} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(exportMenu?"#059669":M.inBd),background:exportMenu?"#f0fdf4":M.inBg,color:exportMenu?"#15803d":M.tB,fontSize:10,fontWeight:900,cursor:"pointer"}}>↓ Export ▾</button>
          {exportMenu&&<div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:34,right:0,background:M.hi,border:"1px solid "+M.div,borderRadius:7,boxShadow:"0 8px 24px rgba(0,0,0,.18)",zIndex:500,minWidth:180,overflow:"hidden"}}>
            {[{k:"pdf",l:"📄 Export as PDF",c:"#dc2626"},{k:"excel",l:"📊 Export as Excel",c:"#15803d"},{k:"gsheet",l:"📗 Open in Google Sheets",c:"#0078D4"},{k:"print",l:"🖨 Print",c:"#374151"}].map(x=>(
              <button key={x.k} onClick={()=>{setExportMenu(false);showToast("Exporting as "+x.k+"…","#0078D4");}} style={{display:"block",width:"100%",padding:"9px 14px",border:"none",background:"transparent",color:x.c,fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left",borderBottom:"1px solid "+M.div}}>{x.l}</button>
            ))}
          </div>}
        </div>
      </div>
      {/* ── Views Bar Row 2 ── */}
      <div style={{padding:"5px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:5,background:M.lo,flexShrink:0,flexWrap:"wrap",minHeight:32}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",flexShrink:0,marginRight:4}}>VIEWS:</span>
        {/* Default */}
        {(()=>{const isActive=activeViewName==="Default",isModified=isActive&&viewDirty;return(
          <div style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fff7ed":"#CC000015"):"#f5f5f5",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":CC_RED):"#d1d5db"),borderRadius:5,overflow:"hidden"}}>
            <button onClick={()=>tryLoadTemplate(DEFAULT_VIEW)} style={{padding:"4px 10px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":CC_RED):"#374151",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              {isActive&&<span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":CC_RED,display:"inline-block",flexShrink:0}}/>}
              🏠 Default
              {isModified&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}
            </button>
            <div style={{padding:"2px 6px",fontSize:7,fontWeight:900,color:"#9ca3af",letterSpacing:.5,background:"#ececec",borderLeft:"1px solid #d1d5db",height:"100%",display:"flex",alignItems:"center"}}>LOCKED</div>
          </div>
        );})()}
        {/* User saved views */}
        {templates.map(t => {
          const isActive=activeViewName===t.name,isModified=isActive&&viewDirty;
          return(
            <div key={t.name} style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fffbeb":"#ede9fe"):"#f5f3ff",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":"#7C3AED"):isModified?"#fcd34d":"#c4b5fd"),borderRadius:5,overflow:"hidden"}}>
              {renamingTpl?.name===t.name ? (
                <input autoFocus value={renamingTpl.tempName} onChange={e=>setRenamingTpl(p=>({...p,tempName:e.target.value}))}
                  onKeyDown={e=>{if(e.key==="Enter")renameTemplate(t.name,renamingTpl.tempName);if(e.key==="Escape")setRenamingTpl(null);}}
                  onBlur={()=>renameTemplate(t.name,renamingTpl.tempName)}
                  style={{padding:"3px 8px",border:"none",background:"#fff",color:"#6d28d9",fontSize:10,fontWeight:800,outline:"2px solid #7C3AED",width:130}} />
              ):(
                <button onClick={()=>tryLoadTemplate(t)} style={{padding:"4px 9px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":"#6d28d9"):"#7c3aed",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                  {isActive&&<span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":"#7C3AED",display:"inline-block",flexShrink:0}}/>}
                  📂 {t.name}
                  {isModified&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}
                </button>
              )}
              {isActive&&isModified&&<><div style={{width:1,height:16,background:"#fcd34d"}}/><button onClick={updateCurrentView} style={{padding:"4px 9px",border:"none",background:"#f59e0b",color:"#fff",fontSize:9,cursor:"pointer",fontWeight:900,whiteSpace:"nowrap"}}>💾 Update View</button></>}
              <div style={{width:1,height:16,background:"#c4b5fd"}}/>
              <button onClick={()=>setRenamingTpl(renamingTpl?.name===t.name?null:{name:t.name,tempName:t.name})} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#f59e0b",fontSize:10,cursor:"pointer",fontWeight:900}}>✎</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}}/>
              <button onClick={()=>editTemplate(t)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#0078D4",fontSize:10,cursor:"pointer",fontWeight:900}}>✏</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}}/>
              <button onClick={()=>dupTemplate(t)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#059669",fontSize:10,cursor:"pointer",fontWeight:900}}>⧉</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}}/>
              <button onClick={()=>deleteTemplate(t.name)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#dc2626",fontSize:10,cursor:"pointer",fontWeight:900}}>×</button>
            </div>
          );
        })}
        <button onClick={()=>setShowSave(p=>!p)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid #c4b5fd",background:showSave?"#7C3AED":"#fdf4ff",color:showSave?"#fff":"#7C3AED",fontSize:9,fontWeight:900,cursor:"pointer"}}>+ Save View</button>
      </div>
      {/* Panels */}
      {showFP&&<div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,marginRight:4}}>FILTER BY:</span>
        {visCols.map(col=>{const f=allFields.find(x=>x.col===col);if(!f||f.auto||["calc","autocode"].includes(f.type))return null;return(<div key={col} style={{display:"flex",alignItems:"center",gap:4,background:M.lo,border:"1px solid "+M.inBd,borderRadius:5,padding:"3px 6px"}}><span style={{fontSize:8,fontWeight:900,color:M.tD,fontFamily:"monospace"}}>{col}</span><input value={filters[col]||""} onChange={e=>setFilters(p=>({...p,[col]:e.target.value}))} placeholder={f.h} style={{border:"none",background:"transparent",color:M.tA,fontSize:10,outline:"none",width:100}}/>{filters[col]&&<button onClick={()=>setFilters(p=>{const n={...p};delete n[col];return n;})} style={{border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:10,padding:0}}>×</button>}</div>);})}
        <button onClick={()=>setFilters({})} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>
      </div>}
      {showCM&&<div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,marginRight:4}}>COLUMNS:</span>
        {allCols.map(col=>{const f=allFields.find(x=>x.col===col);const hidden=hiddenC.includes(col);return(<button key={col} onClick={()=>setHiddenC(p=>hidden?p.filter(c=>c!==col):[...p,col])} style={{padding:"3px 8px",borderRadius:4,border:"1.5px solid "+(hidden?M.div:A.a),background:hidden?M.lo:A.al,color:hidden?M.tD:A.a,fontSize:9,fontWeight:hidden?700:900,cursor:"pointer",textDecoration:hidden?"line-through":"none"}}>{col} {f?.h}</button>);})}
        <button onClick={()=>setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:4}}>Show All</button>
      </div>}
      {showSave&&<div style={{padding:"8px 12px",borderBottom:"1px solid "+M.div,background:"#fdfbff",flexShrink:0,display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:9,fontWeight:900,color:"#6d28d9",textTransform:"uppercase",letterSpacing:.8}}>SAVE VIEW:</span>
        <input value={tplName} onChange={e=>setTplName(e.target.value)} placeholder="View name…" style={{border:"1.5px solid #c4b5fd",borderRadius:5,background:"#fff",color:"#1a1a1a",fontSize:11,padding:"4px 9px",outline:"none",width:200}}/>
        <button onClick={saveTemplate} style={{padding:"5px 14px",border:"none",borderRadius:5,background:"#7C3AED",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>💾 Save</button>
        <button onClick={()=>setShowSave(false)} style={{padding:"5px 10px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>Cancel</button>
      </div>}
      {showSortPanel&&<SortPanel sorts={sorts} setSorts={setSorts} allFields={allFields} M={M} A={A} onClose={()=>setShowSortPanel(false)}/>}
      {/* §RECORDS-G: Advanced Filter Panel */}
      {showAdvFilters&&<div style={{padding:"10px 12px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0}}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {advFilters.map((fil,fi)=>{const f=allFields.find(x=>x.col===fil.field);const ft=advFieldType(f);const ops=ADV_FILTER_OPS[ft]||ADV_FILTER_OPS.txt;const catOpts=ft==="cat"&&(f?.options||f?.opts)??(null);const isAct=fil.value!=="";const cs={fontSize:10,border:"1px solid "+M.div,borderRadius:5,padding:"3px 7px",background:M.inBg,color:M.tA,cursor:"pointer",outline:"none"};return(
            <div key={fil.id} style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:9,color:M.tD,minWidth:34,textAlign:"right",fontWeight:600}}>{fi===0?"Where":"And"}</span>
              <select value={fil.field} onChange={e=>updateAdvFilter(fil.id,{field:e.target.value})} style={{...cs,fontWeight:700,color:"#0e7490",borderColor:"#0891B270",background:"#f0fdfa"}}>{allFields.map(fd=><option key={fd.col} value={fd.col}>{fd.h}</option>)}</select>
              <select value={fil.op} onChange={e=>updateAdvFilter(fil.id,{op:e.target.value})} style={cs}>{ops.map(op=><option key={op} value={op}>{op}</option>)}</select>
              {ft==="cat"&&catOpts?<select value={fil.value} onChange={e=>updateAdvFilter(fil.id,{value:e.target.value})} style={{...cs,minWidth:110,fontWeight:700,borderColor:isAct?"#0891B270":M.div,color:isAct?"#0e7490":M.tA}}><option value="">Select value…</option>{catOpts.map(v=><option key={v} value={v}>{v}</option>)}</select>:<input value={fil.value} onChange={e=>updateAdvFilter(fil.id,{value:e.target.value})} placeholder={ft==="num"?"Enter number…":"Enter text…"} type={ft==="num"?"number":"text"} style={{...cs,minWidth:110,fontWeight:700,borderColor:isAct?"#0891B270":M.div,color:isAct?"#0e7490":M.tA}}/>}
              <button onClick={()=>removeAdvFilter(fil.id)} style={{border:"none",background:"transparent",color:"#dc2626",cursor:"pointer",fontSize:15,lineHeight:1,padding:"0 3px",fontWeight:900}}>×</button>
            </div>);})}
          <button onClick={addAdvFilter} style={{alignSelf:"flex-start",marginLeft:40,border:"none",background:"transparent",color:"#0e7490",fontSize:9,fontWeight:700,cursor:"pointer",padding:0}}>＋ Add another filter</button>
        </div>
      </div>}
      {/* §RECORDS-H: Advanced Sort Panel */}
      {showAdvSorts&&<div style={{padding:"10px 12px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0}}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {advSorts.map((srt,si)=>{const f=allFields.find(x=>x.col===srt.field);const ft=advFieldType(f);const needVal=srt.mode==="val_first"||srt.mode==="val_last";const catOpts=needVal&&ft==="cat"&&(f?.options||f?.opts)??(null);const cs={fontSize:10,border:"1px solid "+M.div,borderRadius:5,padding:"3px 7px",background:M.inBg,color:M.tA,cursor:"pointer",outline:"none"};return(
            <div key={srt.id} style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:9,color:M.tD,minWidth:34,textAlign:"right",fontWeight:600}}>{si===0?"Sort":"Then"}</span>
              <select value={srt.field} onChange={e=>updateAdvSort(srt.id,{field:e.target.value,value:""})} style={{...cs,fontWeight:700,color:"#6d28d9",borderColor:"#7c3aed70",background:"#7c3aed10"}}>{allFields.map(fd=><option key={fd.col} value={fd.col}>{fd.h}</option>)}</select>
              <select value={srt.mode} onChange={e=>updateAdvSort(srt.id,{mode:e.target.value,value:""})} style={cs}>{ADV_SORT_MODES.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select>
              {needVal&&(catOpts?<select value={srt.value} onChange={e=>updateAdvSort(srt.id,{value:e.target.value})} style={{...cs,minWidth:120,fontWeight:700}}><option value="">Pick value…</option>{catOpts.map(v=><option key={v} value={v}>{v}</option>)}</select>:<input value={srt.value} onChange={e=>updateAdvSort(srt.id,{value:e.target.value})} placeholder="Enter value…" style={{...cs,minWidth:120,fontWeight:700}}/>)}
              {advSorts.length>1&&<button onClick={()=>removeAdvSort(srt.id)} style={{border:"none",background:"transparent",color:"#dc2626",cursor:"pointer",fontSize:15,lineHeight:1,padding:"0 3px",fontWeight:900}}>×</button>}
            </div>);})}
          <button onClick={addAdvSort} style={{alignSelf:"flex-start",marginLeft:40,border:"none",background:"transparent",color:"#6d28d9",fontSize:9,fontWeight:700,cursor:"pointer",padding:0}}>＋ Add another sort</button>
        </div>
      </div>}
      {/* §RECORDS-I: Combined Filter + Sort Summary Strip — always visible when active */}
      {(()=>{const colEnt=Object.entries(filters).filter(([,v])=>v);const anyF=colEnt.length>0||activeAdvFilterCount>0;if(!anyF&&!isAdvSortActive)return null;const cF={display:"inline-flex",alignItems:"center",gap:3,background:"rgba(8,145,178,.08)",border:"1px solid rgba(8,145,178,.3)",borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,color:"#0e7490",flexShrink:0};const cS={display:"inline-flex",alignItems:"center",gap:3,background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.3)",borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,color:"#7C3AED",flexShrink:0};return(<div style={{background:M.hi,borderBottom:"1px solid "+M.div,padding:"4px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0,flexWrap:"wrap"}}>{anyF&&<><span style={{fontSize:9,fontWeight:900,color:"#0891B2",flexShrink:0}}>FILTERED:</span>{colEnt.map(([k,v])=>{const fd=allFields.find(x=>x.col===k);return(<span key={"c_"+k} style={cF}>{fd?.h||k} <span style={{fontWeight:400,color:"#0891B2"}}>contains</span> <strong>{v}</strong><span onClick={()=>setFilters(p=>{const n={...p};delete n[k];return n;})} style={{cursor:"pointer",color:M.tD,fontSize:11,lineHeight:1,marginLeft:1}}>×</span></span>);})} {advFilters.filter(f=>f.value!=="").map(fil=>{const fd=allFields.find(x=>x.col===fil.field);return(<span key={fil.id} style={cF}>{fd?.h||fil.field} <span style={{fontWeight:400,color:"#0891B2"}}>{fil.op}</span> <strong>{fil.value}</strong><span onClick={()=>removeAdvFilter(fil.id)} style={{cursor:"pointer",color:M.tD,fontSize:11,lineHeight:1,marginLeft:1}}>×</span></span>);})}</>}{anyF&&isAdvSortActive&&<div style={{width:1,height:14,background:M.div,flexShrink:0}}/>}{isAdvSortActive&&<><span style={{fontSize:9,fontWeight:900,color:"#7C3AED",flexShrink:0}}>SORT:</span>{advSorts.map(srt=>{const fd=allFields.find(x=>x.col===srt.field);const ml=ADV_SORT_MODES.find(m=>m.value===srt.mode)?.label||srt.mode;return(<span key={srt.id} style={cS}>{fd?.h||srt.field} <span style={{fontWeight:400,color:"#9333ea"}}>{ml}</span>{srt.value?<> <strong>{srt.value}</strong></>:null}{advSorts.length>1&&<span onClick={()=>removeAdvSort(srt.id)} style={{cursor:"pointer",color:M.tD,fontSize:11,lineHeight:1,marginLeft:1}}>×</span>}</span>);})}</>}<div style={{flex:1}}/><button onClick={()=>{setFilters({});setAdvFilters([]);setAdvSorts([]);}} style={{fontSize:9,color:"#dc2626",background:"transparent",border:"none",cursor:"pointer",flexShrink:0}}>✕ Clear all</button></div>);})()}
      {/* Table */}
      <div style={{flex:1,overflowX:"auto",overflowY:"auto"}}>
        <table style={{borderCollapse:"collapse",minWidth:"100%"}}>
          <thead style={{position:"sticky",top:0,zIndex:20}}>
            <tr>
              {visCols.map((col,ci)=>{const f=allFields.find(x=>x.col===col);const curSort=sorts.find(s=>s.col===col);return(
                <th key={col} draggable onDragStart={()=>setDragCol(col)} onDragOver={e=>{e.preventDefault();setDropCol(col);}} onDrop={()=>{if(dragCol&&dropCol&&dragCol!==dropCol){setColOrder(p=>{const a=[...p],fi=a.indexOf(dragCol),ti=a.indexOf(dropCol);if(fi<0||ti<0)return a;a.splice(fi,1);a.splice(ti,0,dragCol);return a;});}setDragCol(null);setDropCol(null);}} onClick={()=>{setSorts(p=>{const ex=p.find(s=>s.col===col);if(!ex)return[...p,{col,dir:"asc",type:"auto",nulls:"last"}];if(ex.dir==="asc")return p.map(s=>s.col===col?{...s,dir:"desc"}:s);return p.filter(s=>s.col!==col);});}}
                  style={{minWidth:colW(col),padding:pyV+"px 10px",background:M.thd,borderBottom:"2px solid "+CC_RED,borderRight:"1px solid "+M.div,textAlign:"left",fontSize:9,fontWeight:900,color:curSort?CC_RED:M.tB,cursor:"pointer",whiteSpace:"nowrap",userSelect:"none",borderLeft:dropCol===col?"3px solid #f59e0b":"3px solid transparent",transition:"border-color .1s"}}>
                  <span style={{fontFamily:"monospace",fontSize:8,color:M.tD,marginRight:4}}>{col}</span>
                  {f?.h||col}
                  {curSort&&<span style={{marginLeft:4,color:CC_RED}}>{curSort.dir==="asc"?"↑":"↓"}</span>}
                </th>
              );})}
            </tr>
          </thead>
          <tbody>
            {grouped.map((grp,gi) => (
              <React.Fragment key={gi}>
                {grp.key!==null&&<tr><td colSpan={visCols.length} style={{padding:"6px 12px",background:"#1e293b",color:"#fff",fontWeight:900,fontSize:11}}><span style={{opacity:.7,marginRight:6}}>⊞</span>{allFields.find(f=>f.col===groupBy)?.h}: <span style={{color:"#f59e0b"}}>{grp.key}</span><span style={{background:"#dc2626",color:"#fff",borderRadius:10,padding:"1px 8px",fontSize:9,fontWeight:900,marginLeft:8}}>{grp.sub.reduce((acc,s)=>acc+s.rows.length,0)}</span></td></tr>}
                {grp.sub.map((sub,si)=>(
                  <React.Fragment key={si}>
                    {sub.subKey!==null&&<tr><td colSpan={visCols.length} style={{padding:"5px 12px 5px 40px",background:"#334155",color:"#e2e8f0",fontWeight:700,fontSize:10}}>↳ {allFields.find(f=>f.col===subGroupBy)?.h}: <span style={{color:"#c4b5fd"}}>{sub.subKey}</span><span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:8,fontWeight:900,marginLeft:6}}>{sub.rows.length}</span></td></tr>}
                    {sub.rows.map((row,ri)=>(
                      <tr key={ri} style={{borderBottom:"1px solid "+M.div,background:ri%2===0?M.tev:M.tod}}>
                        {visCols.map(col=>{const f=allFields.find(x=>x.col===col);const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");const v=row[col]||"";return(
                          <td key={col} style={{padding:pyV+"px 10px",fontSize:fz-2,color:col===visCols[0]?A.a:M.tB,fontWeight:col===visCols[0]?700:400,fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit",borderRight:"1px solid "+M.div,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:colW(col)+40}}>
                            {isAuto?<span style={{color:A.a,background:A.al,borderRadius:3,padding:"1px 5px",fontFamily:"monospace",fontSize:fz-3}}>{v||"auto"}</span>:v||<span style={{color:M.tD,fontStyle:"italic"}}>—</span>}
                          </td>
                        );})}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
          <AggFooter visRows={visRows} visCols={visCols} allFields={allFields} aggState={aggState} openCol={aggOpenInfo?.col||null} onCellClick={aggCellClick} hasCheckbox={false} M={M} A={A}/>
        </table>
      </div>
      {aggOpenInfo&&<><div onClick={()=>setAggOpenInfo(null)} style={{position:"fixed",inset:0,zIndex:9998}}/><AggDropdown openInfo={aggOpenInfo} aggState={aggState} setAggState={setAggState} visRows={visRows} allFields={allFields} onClose={()=>setAggOpenInfo(null)} M={M} A={A}/></>}
      {/* Status bar */}
      <div style={{padding:"4px 12px",borderTop:"1px solid "+M.div,background:M.mid,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{fontSize:9,color:M.tD,fontWeight:700}}>Total: {mockRecords.length} · Visible: {visRows.length} · Cols: {visCols.length}</span>
        {sorts.length>0&&<span style={{fontSize:9,color:"#6d28d9"}}>↕ sorted by {sorts.map(s=>s.col).join(", ")}</span>}
        {activeFilters>0&&<span style={{fontSize:9,color:A.a}}>🔍 {activeFilters} filter(s)</span>}
        {groupBy&&<span style={{fontSize:9,color:"#059669"}}>⊞ grouped by {allFields.find(f=>f.col===groupBy)?.h||groupBy}</span>}
      </div>
      {/* View switch guard */}
      {viewSwitchGuard&&<><div onClick={()=>setViewSwitchGuard(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(2px)",zIndex:2100}}/><div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:M.hi,border:"1px solid #fcd34d",borderRadius:10,zIndex:2101,boxShadow:"0 8px 32px rgba(0,0,0,.3)",overflow:"hidden"}}><div style={{background:"#f59e0b",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>⚠️</span><div><div style={{color:"#fff",fontSize:13,fontWeight:900}}>Unsaved View Changes</div><div style={{color:"rgba(255,255,255,.85)",fontSize:10}}>"{activeViewName}" has unsaved modifications</div></div></div><div style={{padding:"16px 20px"}}><div style={{display:"flex",flexDirection:"column",gap:8}}><button onClick={()=>{updateCurrentView();loadTemplate(viewSwitchGuard.pendingTpl);setViewSwitchGuard(null);}} style={{padding:"9px 16px",border:"none",borderRadius:6,background:"#15803d",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer",textAlign:"left"}}>💾 Save changes to "{activeViewName}" — then switch</button><button onClick={()=>{loadTemplate(viewSwitchGuard.pendingTpl);setViewSwitchGuard(null);}} style={{padding:"9px 16px",border:"1px solid #fcd34d",borderRadius:6,background:"#fffbeb",color:"#92400e",fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left"}}>↩ Discard changes — switch to "{viewSwitchGuard.pendingTpl.name}"</button><button onClick={()=>setViewSwitchGuard(null)} style={{padding:"9px 16px",border:"1px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tB,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"left"}}>← Stay on "{activeViewName}"</button></div></div></div></>}
      {editingTpl&&<ViewEditModal allFields={allFields} allCols={allCols} initial={editingTpl.tpl} isDup={!editingTpl.originalName} existingNames={["Default",...templates.map(t=>t.name).filter(n=>n!==editingTpl.originalName)]} onSave={commitTplEdit} onCancel={()=>setEditingTpl(null)} M={M} A={A} fz={fz}/>}
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toast.color||"#15803d",color:"#fff",borderRadius:8,padding:"10px 18px",fontSize:12,fontWeight:800,boxShadow:"0 8px 32px rgba(0,0,0,.25)"}}>{toast.msg}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  DATA ENTRY TAB — form entry with Views Bar (Entry tab only)
// ═══════════════════════════════════════════════════════════════════
function DataEntryTab({ allFields, sections, views, activeViewId, onActivateView, onSaveView, onDeleteView, formData, onChange, errors, M, A, fz, pyV, onSave, onClear }) {
  const [eMode, setEMode]   = useState("form"); // "form" | "inline"
  const [openSec, setOpenSec] = useState(sections.map(s => s.id));
  const [showVP, setShowVP]   = useState(false);
  const [editingV, setEditingV] = useState(null);
  const [toast, setToast]     = useState(null);
  const showToast = (msg, color="#15803d") => { setToast(msg); setTimeout(()=>setToast(null),2500); };

  const curView = activeViewId ? views.find(v=>v.id===activeViewId) : null;
  const visibleCols = curView ? curView.fields : allFields.map(f=>f.col);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>
      {/* Tab bar with Form/Inline toggle */}
      <div style={{padding:"6px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0}}>
        <span style={{fontSize:10,fontWeight:900,color:M.tA}}>✏ Data Entry</span>
        <div style={{flex:1}}/>
        <div style={{display:"flex",background:M.lo,borderRadius:6,padding:2,gap:1}}>
          {[{k:"form",l:"▤ Form"},{k:"inline",l:"☰ Inline"}].map(m=>(
            <button key={m.k} onClick={()=>setEMode(m.k)} style={{padding:"4px 10px",border:"none",borderRadius:4,background:eMode===m.k?A.a:"transparent",color:eMode===m.k?"#fff":M.tC,fontSize:9,fontWeight:eMode===m.k?900:700,cursor:"pointer"}}>{m.l}</button>
          ))}
        </div>
      </div>
      {/* ── Views Bar — ENTRY TAB ONLY ── */}
      <div style={{padding:"5px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:5,background:M.lo,flexShrink:0,flexWrap:"wrap",minHeight:32}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",flexShrink:0,marginRight:4}}>VIEWS:</span>
        {/* All Fields pill */}
        <button onClick={()=>onActivateView(activeViewId?null:null)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid "+(activeViewId===null?A.a:M.inBd),background:activeViewId===null?A.al:M.inBg,color:activeViewId===null?A.a:M.tB,fontSize:9,fontWeight:activeViewId===null?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          {activeViewId===null&&<span style={{width:6,height:6,borderRadius:"50%",background:A.a,display:"inline-block"}}/>}
          All Fields <span style={{opacity:.5,fontSize:8}}>({allFields.length})</span>
        </button>
        {/* System + Custom views */}
        {views.map(v=>{
          const isAct=activeViewId===v.id;
          return(
            <div key={v.id} style={{display:"flex",alignItems:"center",gap:0,background:isAct?(v.color+"10"):"transparent",border:"1.5px solid "+(isAct?v.color:v.isSystem?"#d1d5db":"#c4b5fd"),borderRadius:5,overflow:"hidden"}}>
              <button onClick={()=>onActivateView(isAct?null:v.id)} style={{padding:"4px 10px",border:"none",background:"transparent",color:isAct?v.color:M.tB,fontSize:9,fontWeight:isAct?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                {isAct&&<span style={{width:6,height:6,borderRadius:"50%",background:v.color,display:"inline-block"}}/>}
                {v.icon} {v.name}
              </button>
              {!v.isSystem&&<><div style={{width:1,height:14,background:"#c4b5fd"}}/><button onClick={()=>setEditingV(v)} style={{padding:"3px 6px",border:"none",background:"transparent",color:"#7C3AED",fontSize:9,cursor:"pointer"}}>✏</button></>}
            </div>
          );
        })}
        {/* Description chip */}
        {curView&&<div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"3px 8px",background:curView.color+"10",border:"1px solid "+curView.color+"30",borderRadius:5}}>
          <span style={{fontSize:11}}>{curView.icon}</span>
          <span style={{fontSize:9,color:curView.color,fontWeight:700}}>{curView.desc}</span>
          <span style={{fontSize:8,color:M.tD}}>· {curView.fields.length} of {allFields.length} fields</span>
        </div>}
        <button onClick={()=>setShowVP(true)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid "+M.inBd,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>🔖 Manage</button>
      </div>
      {/* Form body */}
      <div style={{flex:1,overflowY:"auto"}}>
        {eMode==="form" ? (
          <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
            {sections.map(sec=>{
              const secFields=allFields.filter(f=>sec.cols.includes(f.col)&&visibleCols.includes(f.col));
              if(secFields.length===0) return null;
              const open=openSec.includes(sec.id);
              const errs=secFields.filter(f=>errors[f.col]).length;
              return(
                <div key={sec.id} style={{border:"1px solid "+(errs>0?"#ef4444":M.div),borderRadius:7,overflow:"hidden"}}>
                  <button onClick={()=>setOpenSec(p=>p.includes(sec.id)?p.filter(x=>x!==sec.id):[...p,sec.id])} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:pyV+"px 14px",background:open?(A.a+"08"):M.mid,border:"none",cursor:"pointer",borderBottom:"1px solid "+(open?M.div:"transparent")}}>
                    <span style={{fontSize:14}}>{sec.icon}</span>
                    <span style={{fontSize:11,fontWeight:900,color:open?A.a:M.tA,flex:1,textAlign:"left"}}>{sec.title}</span>
                    <span style={{fontSize:9,color:M.tD}}>{secFields.length} fields</span>
                    {errs>0&&<span style={{background:"#fef2f2",color:"#ef4444",border:"1px solid #fecaca",borderRadius:3,padding:"1px 6px",fontSize:9,fontWeight:900}}>{errs} err</span>}
                    <span style={{fontSize:10,color:M.tD}}>{open?"▾":"▸"}</span>
                  </button>
                  {open&&<div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px"}}>
                    {secFields.map(f=>(
                      <div key={f.col} style={{gridColumn:f.type==="textarea"?"1 / -1":"auto"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                          <span style={{fontFamily:"monospace",fontSize:8,fontWeight:700,color:M.tD,minWidth:16}}>{f.col}</span>
                          <span style={{fontSize:9,fontWeight:900,color:errors[f.col]?"#ef4444":f.req?A.a:M.tD,flex:1}}>{f.req&&!f.auto?"⚠ ":""}{f.h}</span>
                          <DtBadge type={f.type}/>
                        </div>
                        <FieldInput f={f} val={formData[f.col]} onChange={v=>onChange(f.col,v)} M={M} A={A} fz={fz} compact={false} hasError={!!errors[f.col]}/>
                        {errors[f.col]&&<div style={{fontSize:9,color:"#ef4444",marginTop:2,fontWeight:700}}>{errors[f.col]}</div>}
                        {!errors[f.col]&&!["auto","calc","autocode"].includes(f.type)&&<div style={{fontSize:8,color:M.tD,marginTop:2}}>{f.hint}</div>}
                      </div>
                    ))}
                  </div>}
                </div>
              );
            })}
          </div>
        ) : (
          /* Inline mode */
          <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
            <colgroup><col style={{width:34}}/><col style={{width:28}}/><col style={{width:30}}/><col/><col style={{width:90}}/><col/><col style={{width:46}}/></colgroup>
            <thead style={{position:"sticky",top:0,zIndex:10}}>
              <tr style={{background:CC_RED}}>
                {["COL","#","ICO","FIELD","TYPE","VALUE","STS"].map(h=><th key={h} style={{padding:pyV+"px 7px",textAlign:"left",fontSize:9,fontWeight:900,color:"#fff",borderBottom:"2px solid #aa0000"}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {allFields.filter(f=>visibleCols.includes(f.col)).map((f,i)=>{
                const isAuto=f.auto||["calc","autocode"].includes(f.type);
                const filled=!!formData[f.col]&&!isAuto;
                const hasErr=!!errors[f.col];
                const rowBg=hasErr?"#fef2f2":i%2===0?M.tev:M.tod;
                return(
                  <tr key={f.col} style={{background:rowBg,borderBottom:"1px solid "+M.div,borderLeft:"3px solid "+(hasErr?"#ef4444":"transparent")}}>
                    <td style={{padding:pyV+"px 7px",fontFamily:"monospace",fontSize:9,fontWeight:700,color:M.tC}}>{f.col}</td>
                    <td style={{padding:pyV+"px 7px",fontFamily:"monospace",fontSize:9,color:M.tD,textAlign:"center"}}>{i+1}</td>
                    <td style={{padding:pyV+"px 7px",textAlign:"center"}}><IcoLabel ico={f.ico} A={A}/></td>
                    <td style={{padding:pyV+"px 7px"}}><div style={{fontSize:fz-2,fontWeight:700,color:M.tA}}>{f.h}</div><div style={{fontSize:8,color:M.tD,marginTop:1}}>{f.hint}</div></td>
                    <td style={{padding:pyV+"px 7px"}}><DtBadge type={f.type}/></td>
                    <td style={{padding:(pyV-1)+"px 7px"}}><FieldInput f={f} val={formData[f.col]} onChange={v=>onChange(f.col,v)} M={M} A={A} fz={fz} compact={true} hasError={hasErr}/></td>
                    <td style={{padding:pyV+"px 7px",textAlign:"center"}}>
                      {isAuto?<span style={{color:"#059669",fontSize:8,fontWeight:900}}>AUTO</span>:filled?<span style={{color:"#059669",fontSize:12}}>✓</span>:hasErr?<span style={{color:"#ef4444",fontSize:8,fontWeight:900}}>!!</span>:f.req?<span style={{color:"#f59e0b",fontSize:8,fontWeight:900}}>req</span>:<span style={{color:M.tD,fontSize:8}}>opt</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Footer */}
      <div style={{padding:"10px 14px",borderTop:"1px solid "+M.div,display:"flex",alignItems:"center",gap:8,background:M.mid,flexShrink:0}}>
        <button onClick={onClear} style={{padding:"7px 16px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>↺ Clear</button>
        <div style={{flex:1}}/>
        <button onClick={onSave} style={{padding:"8px 24px",border:"none",borderRadius:5,background:CC_RED,color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>✓ Save to Sheet</button>
      </div>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#15803d",color:"#fff",borderRadius:8,padding:"10px 18px",fontSize:12,fontWeight:800}}>{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  BULK ENTRY TAB — spreadsheet grid with row state flags
// ═══════════════════════════════════════════════════════════════════
const EMPTY_ROW = (fields, id) => {
  const r = {__id:id, __new:true, __dirty:false};
  fields.forEach(f => { r[f.col] = ""; });
  return r;
};

function BulkEntryTab({ allFields, M, A, fz, pyV, rows, setRows, viewState, setViewState, templates, onSaveTemplate, onDeleteTemplate }) {
  const allCols = allFields.map(f => f.col);
  const DEFAULT_VIEW = {name:"Default",__builtin:true,colOrder:allCols,hiddenC:[],sorts:[],filters:{},groupBy:null,subGroupBy:null};

  const {colOrder,hiddenC,sorts,filters,groupBy,subGroupBy,activeViewName} = buildViewState(viewState, allCols);
  const setColOrder      = v => setViewState(p=>({...(p||{}),colOrder:typeof v==="function"?v((p||{}).colOrder??allCols):v}));
  const setHiddenC       = v => setViewState(p=>({...(p||{}),hiddenC:typeof v==="function"?v((p||{}).hiddenC??[]):v}));
  const setSorts         = v => setViewState(p=>({...(p||{}),sorts:typeof v==="function"?v((p||{}).sorts??[]):v}));
  const setFilters       = v => setViewState(p=>({...(p||{}),filters:typeof v==="function"?v((p||{}).filters??{}):v}));
  const setGroupBy       = v => setViewState(p=>({...(p||{}),groupBy:typeof v==="function"?v((p||{}).groupBy??null):v}));
  const setSubGroupBy    = v => setViewState(p=>({...(p||{}),subGroupBy:typeof v==="function"?v((p||{}).subGroupBy??null):v}));
  const setActiveViewName= v => setViewState(p=>({...(p||{}),activeViewName:typeof v==="function"?v((p||{}).activeViewName??"Default"):v}));

  const [selRows,      setSelRows]      = useState(new Set());
  const [editCell,     setEditCell]     = useState(null);
  const [rowErrors,    setRowErrors]    = useState({});
  const [showFP,       setShowFP]       = useState(false);
  const [showSortPanel,setShowSortPanel]= useState(false);
  const [showCM,       setShowCM]       = useState(false);
  const [aggState,     setAggState]     = useState({});
  const [aggOpenInfo,  setAggOpenInfo]  = useState(null);
  const [showSave,     setShowSave]     = useState(false);
  const [tplName,      setTplName]      = useState("");
  const [renamingTpl,  setRenamingTpl]  = useState(null);
  const [editingTpl,   setEditingTpl]   = useState(null);
  const [viewSwitchGuard,setViewSwitchGuard]=useState(null);
  const [dragCol,      setDragCol]      = useState(null);
  const [dropCol,      setDropCol]      = useState(null);
  const [toast,        setToast]        = useState(null);
  const nextId = useRef(Date.now());

  // ── §BULK_ENTRY-J/K: Advanced filter / sort ──
  const [advFilters,     setAdvFilters]    = useState([]);
  const [advSorts,       setAdvSorts]      = useState([]);
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [showAdvSorts,   setShowAdvSorts]   = useState(false);

  const showToast = (msg,color="#15803d") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };
  const visCols = colOrder.filter(c => !hiddenC.includes(c) && allCols.includes(c));
  const activeFilters = Object.values(filters).filter(v=>v.trim()).length;

  // §BULK_ENTRY-J: field defs for adv filter/sort (exclude auto/calc)
  const advFieldDefs = allFields.filter(f=>!f.auto&&!["calc","autocode"].includes(f.type)).map(f=>({key:f.col,label:f.h||f.col,type:advFieldType(f),opts:f.opts||null}));
  const activeAdvFilterCount = advFilters.filter(f=>f.value!=="").length;
  const isAdvSortActive = advSorts.length > 0;

  const addAdvFilter = () => { const fi=advFieldDefs[0]; const ft=fi?advFieldType(allFields.find(x=>x.col===fi.key)):"txt"; setAdvFilters(p=>[...p,{id:Date.now(),field:fi?.key||"",op:ADV_FILTER_OPS[ft]?.[0]||"is",value:""}]); };
  const removeAdvFilter = id => setAdvFilters(p=>p.filter(f=>f.id!==id));
  const updateAdvFilter = (id,patch) => setAdvFilters(p=>p.map(f=>{if(f.id!==id)return f;const m={...f,...patch};if(patch.field&&patch.field!==f.field){const ft=advFieldType(allFields.find(x=>x.col===patch.field));m.op=ADV_FILTER_OPS[ft]?.[0]||"is";m.value="";}return m;}));
  const addAdvSort = () => { const fi=advFieldDefs[0]; setAdvSorts(p=>[...p,{id:Date.now(),field:fi?.key||"",mode:"a_z",value:""}]); };
  const removeAdvSort = id => setAdvSorts(p=>p.length>1?p.filter(s=>s.id!==id):p);
  const updateAdvSort = (id,patch) => setAdvSorts(p=>p.map(s=>s.id===id?{...s,...patch}:s));

  // §BULK_ENTRY-K: frequency maps for sort modes
  const freqMapsB = {};
  advFieldDefs.forEach(f=>{const counts={};rows.forEach(r=>{const v=String(r[f.key]??"");counts[v]=(counts[v]||0)+1;});freqMapsB[f.key]=counts;});

  // §BULK_ENTRY-J/K: visRows applies per-col filters → advFilters → per-col sorts → advSorts
  const visRows = (()=>{
    let rs=[...rows];
    Object.entries(filters).forEach(([col,val])=>{if(!val.trim())return;rs=rs.filter(r=>String(r[col]||"").toLowerCase().includes(val.trim().toLowerCase()));});
    advFilters.forEach(fil=>{if(fil.value!==""||advFieldType(allFields.find(x=>x.col===fil.field))==="num")rs=rs.filter(r=>evalAdvFilter(r,fil,allFields));});
    rs=applySortFilter(rs,[...sorts],{},allFields);
    if(isAdvSortActive)rs=applyAdvSort(rs,advSorts,freqMapsB);
    return rs;
  })();
  const grouped = buildGrouped(visRows, groupBy, subGroupBy);
  const dirtyCount = rows.filter(r=>r.__dirty||r.__new).length;

  const aggCellClick = (col, el) => {
    if (aggOpenInfo?.col===col) { setAggOpenInfo(null); return; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAggOpenInfo({col, top:Math.max(8,r.top-410), left:Math.min(r.left,window.innerWidth-230)});
  };

  const getViewDirty = () => {
    if (activeViewName==="Default") return !(JSON.stringify(colOrder)===JSON.stringify(allCols)&&hiddenC.length===0&&sorts.length===0&&Object.values(filters).every(v=>!v.trim())&&groupBy===null&&subGroupBy===null);
    const saved=templates.find(t=>t.name===activeViewName);
    if(!saved) return false;
    return JSON.stringify(colOrder)!==JSON.stringify((saved.colOrder||allCols).filter(c=>allCols.includes(c)))||JSON.stringify(hiddenC)!==JSON.stringify(saved.hiddenC||[])||JSON.stringify(sorts)!==JSON.stringify(saved.sorts||[])||JSON.stringify(filters)!==JSON.stringify(saved.filters||{})||groupBy!==(saved.groupBy||null)||subGroupBy!==(saved.subGroupBy||null);
  };
  const viewDirty = getViewDirty();

  const loadTemplate = tpl => {
    setColOrder((tpl.colOrder||allCols).filter(c=>allCols.includes(c)));
    setHiddenC(tpl.hiddenC||[]); setSorts(tpl.sorts||[]); setFilters(tpl.filters||{});
    setGroupBy(tpl.groupBy||null); setSubGroupBy(tpl.subGroupBy||null);
    setActiveViewName(tpl.name); showToast(`📂 View "${tpl.name}" loaded`,"#7C3AED");
  };
  const tryLoadTemplate = tpl => {
    if (viewDirty&&tpl.name!==activeViewName) setViewSwitchGuard({pendingTpl:tpl});
    else loadTemplate(tpl);
  };
  const updateCurrentView = () => {
    if (activeViewName==="Default") return;
    onSaveTemplate({name:activeViewName,colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy});
    showToast(`✅ View "${activeViewName}" updated`);
  };
  const saveTemplate = () => {
    if (!tplName.trim()) return;
    if (tplName.trim().toLowerCase()==="default") { showToast('⚠ "Default" is reserved',"#dc2626"); return; }
    if (templates.find(t=>t.name===tplName.trim())) { showToast(`⚠ Already exists`,"#dc2626"); return; }
    onSaveTemplate({name:tplName.trim(),colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy});
    setActiveViewName(tplName.trim()); setTplName(""); setShowSave(false);
    showToast(`💾 View "${tplName.trim()}" saved`);
  };
  const deleteTemplate = name => { onDeleteTemplate(name); if(activeViewName===name) setActiveViewName("Default"); showToast(`🗑 View "${name}" deleted`,"#dc2626"); };
  const renameTemplate = (oldName, newName) => {
    if (!newName.trim()||newName.trim()===oldName) { setRenamingTpl(null); return; }
    if (newName.trim().toLowerCase()==="default") { showToast('⚠ Reserved',"#dc2626"); setRenamingTpl(null); return; }
    if (templates.find(t=>t.name===newName.trim())) { showToast(`⚠ Already exists`,"#dc2626"); return; }
    const tpl=templates.find(t=>t.name===oldName); if(!tpl) return;
    onDeleteTemplate(oldName); onSaveTemplate({...tpl,name:newName.trim()});
    if(activeViewName===oldName) setActiveViewName(newName.trim());
    showToast(`✏ Renamed`,"#0078D4"); setRenamingTpl(null);
  };
  const editTemplate = tpl => setEditingTpl({tpl:{...tpl,colOrder:[...tpl.colOrder],hiddenC:[...tpl.hiddenC],sorts:[...tpl.sorts],filters:{...tpl.filters}},originalName:tpl.name});
  const dupTemplate  = tpl => { let dupName=tpl.name+" (copy)"; let i=1; while(templates.find(t=>t.name===dupName)||dupName.toLowerCase()==="default") dupName=tpl.name+` (copy ${++i})`; setEditingTpl({tpl:{...tpl,name:dupName},originalName:null}); };
  const commitTplEdit = updated => {
    if(updated.name.toLowerCase()==="default"){showToast('⚠ "Default" is reserved',"#dc2626");return;}
    if(editingTpl.originalName&&editingTpl.originalName!==updated.name) onDeleteTemplate(editingTpl.originalName);
    onSaveTemplate(updated); setActiveViewName(updated.name);
    showToast(`✅ View "${updated.name}" ${editingTpl.originalName?"updated":"created"}`); setEditingTpl(null);
  };

  const addRow = () => { const id=nextId.current++; setRows(prev=>[...prev,EMPTY_ROW(allFields,id)]); showToast("+ New row added","#0078D4"); };
  const deleteSelected = () => { setRows(prev=>prev.filter(r=>!selRows.has(r.__id))); setSelRows(new Set()); showToast(`🗑 ${selRows.size} row(s) removed`,"#dc2626"); };
  const updateCell = (rowId, col, val) => {
    setRows(prev=>prev.map(r=>{
      if(r.__id!==rowId) return r;
      const updated={...r,[col]:val,__dirty:true};
      // Run auto-compute cascade:
      return Object.assign(updated, computeAutos(col, val, updated));
    }));
  };
  const saveDirty = () => {
    const mandFields = allFields.filter(f=>f.req&&!f.auto);
    const errs = {};
    rows.forEach(r=>{
      if(!r.__dirty&&!r.__new) return;
      const missing=mandFields.filter(f=>!r[f.col]?.trim()).map(f=>f.col);
      if(missing.length>0) errs[r.__id]=missing;
    });
    if(Object.keys(errs).length>0) { setRowErrors(errs); showToast(`⚠ ${Object.keys(errs).length} row(s) have missing required fields`,"#dc2626"); return; }
    // ─── Call GAS here ───
    showToast(`✅ ${dirtyCount} row(s) queued for GAS save`);
    setRows(prev=>prev.map(r=>({...r,__new:false,__dirty:false})));
  };

  const colW = col => { const f=allFields.find(x=>x.col===col); if(!f) return 100; if(["textarea","text"].includes(f.type)) return 160; if(["fk","multifk","dropdown"].includes(f.type)) return 140; if(f.type==="currency"||f.type==="number") return 90; return 110; };
  const allSel = selRows.size===visRows.length&&visRows.length>0;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>
      {/* Toolbar Row 1 */}
      <div style={{padding:"6px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={addRow} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",border:"none",borderRadius:5,background:CC_RED,color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}><span style={{fontSize:13}}>+</span> Add Row</button>
        {selRows.size>0&&<button onClick={deleteSelected} style={{padding:"5px 12px",border:"1px solid #fecaca",borderRadius:5,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:900,cursor:"pointer"}}>🗑 Delete {selRows.size}</button>}
        {dirtyCount>0&&<button onClick={saveDirty} style={{padding:"5px 14px",border:"none",borderRadius:5,background:"#15803d",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>✓ Save {dirtyCount} Changes</button>}
        <div style={{width:1,height:22,background:M.div,margin:"0 4px"}}/>
        <button onClick={()=>{setShowFP(p=>!p);setShowSortPanel(false);setShowCM(false);setShowAdvFilters(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showFP||activeFilters>0?A.a:M.inBd),background:showFP||activeFilters>0?A.al:M.inBg,color:showFP||activeFilters>0?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>Col Filter {activeFilters>0&&<span style={{background:A.a,color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{activeFilters}</span>}</button>
        <button onClick={()=>{const op=!showAdvFilters;setShowAdvFilters(op);setShowFP(false);setShowCM(false);setShowAdvSorts(false);if(op&&advFilters.length===0)addAdvFilter();}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showAdvFilters||activeAdvFilterCount>0?"#0891B2":M.inBd),background:showAdvFilters||activeAdvFilterCount>0?"rgba(8,145,178,.1)":M.inBg,color:showAdvFilters||activeAdvFilterCount>0?"#0e7490":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          ＋ Filter {activeAdvFilterCount>0&&<span style={{background:"#0891B2",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{activeAdvFilterCount}</span>}
        </button>
        <button onClick={()=>{setShowSortPanel(true);setShowFP(false);setShowCM(false);setShowAdvSorts(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showSortPanel||sorts.length>0?"#7C3AED":M.inBd),background:showSortPanel||sorts.length>0?"#ede9fe":M.inBg,color:showSortPanel||sorts.length>0?"#6d28d9":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>Col Sort {sorts.length>0&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{sorts.length}</span>}</button>
        <button onClick={()=>{const op=!showAdvSorts;setShowAdvSorts(op);setShowSortPanel(false);setShowFP(false);setShowAdvFilters(false);if(op&&advSorts.length===0)addAdvSort();}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showAdvSorts||isAdvSortActive?"#7C3AED":M.inBd),background:showAdvSorts||isAdvSortActive?"rgba(124,58,237,.1)":M.inBg,color:showAdvSorts||isAdvSortActive?"#7C3AED":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          ↑ Sort {isAdvSortActive&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{advSorts.length}</span>}
        </button>
        <select value={groupBy||""} onChange={e=>{setGroupBy(e.target.value||null);if(!e.target.value)setSubGroupBy(null);}} style={{padding:"5px 8px",border:"1.5px solid "+(groupBy?"#059669":M.inBd),borderRadius:5,background:groupBy?"#f0fdf4":M.inBg,color:groupBy?"#15803d":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">⊞ Group by…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>
        {groupBy&&<select value={subGroupBy||""} onChange={e=>setSubGroupBy(e.target.value||null)} style={{padding:"5px 8px",border:"1.5px solid "+(subGroupBy?"#7C3AED":"#bbf7d0"),borderRadius:5,background:subGroupBy?"#ede9fe":"#f0fdf4",color:subGroupBy?"#6d28d9":"#15803d",fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">↳ Sub-group…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)&&f.col!==groupBy).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>}
        <button onClick={()=>{setShowCM(p=>!p);setShowFP(false);setShowSortPanel(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showCM||hiddenC.length>0?"#0078D4":M.inBd),background:showCM||hiddenC.length>0?"#eff6ff":M.inBg,color:showCM||hiddenC.length>0?"#1d4ed8":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>⊟ Cols {hiddenC.length>0&&<span style={{background:"#0078D4",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{hiddenC.length}</span>}</button>
        <div style={{flex:1}}/><span style={{fontSize:9,color:M.tC,fontWeight:700}}>{visRows.length} rows · {visCols.length} cols</span>
      </div>
      {/* Views Bar Row 2 — same pattern as Records */}
      <div style={{padding:"5px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:5,background:M.lo,flexShrink:0,flexWrap:"wrap",minHeight:32}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",flexShrink:0,marginRight:4}}>VIEWS:</span>
        {(()=>{const isActive=activeViewName==="Default",isModified=isActive&&viewDirty;return(<div style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fff7ed":"#CC000015"):"#f5f5f5",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":CC_RED):"#d1d5db"),borderRadius:5,overflow:"hidden"}}><button onClick={()=>tryLoadTemplate(DEFAULT_VIEW)} style={{padding:"4px 10px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":CC_RED):"#374151",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{isActive&&<span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":CC_RED,display:"inline-block"}}/>}🏠 Default{isModified&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}</button><div style={{padding:"2px 6px",fontSize:7,fontWeight:900,color:"#9ca3af",letterSpacing:.5,background:"#ececec",borderLeft:"1px solid #d1d5db",height:"100%",display:"flex",alignItems:"center"}}>LOCKED</div></div>);})()}
        {templates.map(t=>{const isActive=activeViewName===t.name,isModified=isActive&&viewDirty;return(<div key={t.name} style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fffbeb":"#ede9fe"):"#f5f3ff",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":"#7C3AED"):isModified?"#fcd34d":"#c4b5fd"),borderRadius:5,overflow:"hidden"}}>{renamingTpl?.name===t.name?<input autoFocus value={renamingTpl.tempName} onChange={e=>setRenamingTpl(p=>({...p,tempName:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")renameTemplate(t.name,renamingTpl.tempName);if(e.key==="Escape")setRenamingTpl(null);}} onBlur={()=>renameTemplate(t.name,renamingTpl.tempName)} style={{padding:"3px 8px",border:"none",background:"#fff",color:"#6d28d9",fontSize:10,fontWeight:800,outline:"2px solid #7C3AED",width:130}}/>:<button onClick={()=>tryLoadTemplate(t)} style={{padding:"4px 9px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":"#6d28d9"):"#7c3aed",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{isActive&&<span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":"#7C3AED",display:"inline-block"}}/>}📂 {t.name}{isModified&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}</button>}{isActive&&isModified&&<><div style={{width:1,height:16,background:"#fcd34d"}}/><button onClick={updateCurrentView} style={{padding:"4px 9px",border:"none",background:"#f59e0b",color:"#fff",fontSize:9,cursor:"pointer",fontWeight:900,whiteSpace:"nowrap"}}>💾 Update View</button></>}<div style={{width:1,height:16,background:"#c4b5fd"}}/><button onClick={()=>setRenamingTpl(renamingTpl?.name===t.name?null:{name:t.name,tempName:t.name})} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#f59e0b",fontSize:10,cursor:"pointer",fontWeight:900}}>✎</button><div style={{width:1,height:16,background:"#c4b5fd"}}/><button onClick={()=>editTemplate(t)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#0078D4",fontSize:10,cursor:"pointer",fontWeight:900}}>✏</button><div style={{width:1,height:16,background:"#c4b5fd"}}/><button onClick={()=>dupTemplate(t)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#059669",fontSize:10,cursor:"pointer",fontWeight:900}}>⧉</button><div style={{width:1,height:16,background:"#c4b5fd"}}/><button onClick={()=>deleteTemplate(t.name)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#dc2626",fontSize:10,cursor:"pointer",fontWeight:900}}>×</button></div>);})}
        <button onClick={()=>setShowSave(p=>!p)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid #c4b5fd",background:showSave?"#7C3AED":"#fdf4ff",color:showSave?"#fff":"#7C3AED",fontSize:9,fontWeight:900,cursor:"pointer"}}>+ Save View</button>
      </div>
      {/* Panels */}
      {showFP&&<div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,marginRight:4}}>FILTER BY:</span>{visCols.map(col=>{const f=allFields.find(x=>x.col===col);if(!f||f.auto||["calc","autocode"].includes(f.type))return null;return(<div key={col} style={{display:"flex",alignItems:"center",gap:4,background:M.lo,border:"1px solid "+M.inBd,borderRadius:5,padding:"3px 6px"}}><span style={{fontSize:8,fontWeight:900,color:M.tD,fontFamily:"monospace"}}>{col}</span><input value={filters[col]||""} onChange={e=>setFilters(p=>({...p,[col]:e.target.value}))} placeholder={f.h} style={{border:"none",background:"transparent",color:M.tA,fontSize:10,outline:"none",width:100}}/>{filters[col]&&<button onClick={()=>setFilters(p=>{const n={...p};delete n[col];return n;})} style={{border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:10,padding:0}}>×</button>}</div>);})} <button onClick={()=>setFilters({})} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button></div>}
      {showCM&&<div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,marginRight:4}}>COLUMNS:</span>{allCols.map(col=>{const f=allFields.find(x=>x.col===col);const hidden=hiddenC.includes(col);return(<button key={col} onClick={()=>setHiddenC(p=>hidden?p.filter(c=>c!==col):[...p,col])} style={{padding:"3px 8px",borderRadius:4,border:"1.5px solid "+(hidden?M.div:A.a),background:hidden?M.lo:A.al,color:hidden?M.tD:A.a,fontSize:9,fontWeight:hidden?700:900,cursor:"pointer",textDecoration:hidden?"line-through":"none"}}>{col} {f?.h}</button>);})}<button onClick={()=>setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:4}}>Show All</button></div>}
      {showSave&&<div style={{padding:"8px 12px",borderBottom:"1px solid "+M.div,background:"#fdfbff",flexShrink:0,display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:9,fontWeight:900,color:"#6d28d9",textTransform:"uppercase",letterSpacing:.8}}>SAVE VIEW:</span><input value={tplName} onChange={e=>setTplName(e.target.value)} placeholder="View name…" style={{border:"1.5px solid #c4b5fd",borderRadius:5,background:"#fff",color:"#1a1a1a",fontSize:11,padding:"4px 9px",outline:"none",width:200}}/><button onClick={saveTemplate} style={{padding:"5px 14px",border:"none",borderRadius:5,background:"#7C3AED",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>💾 Save</button><button onClick={()=>setShowSave(false)} style={{padding:"5px 10px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>Cancel</button></div>}
      {showSortPanel&&<SortPanel sorts={sorts} setSorts={setSorts} allFields={allFields} M={M} A={A} onClose={()=>setShowSortPanel(false)}/>}
      {/* §BULK_ENTRY-J: Advanced Operator Filter Panel */}
      {showAdvFilters&&<div style={{padding:"10px 12px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0}}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {advFilters.map((fil,fi)=>{const f=allFields.find(x=>x.col===fil.field);const ft=advFieldType(f);const ops=ADV_FILTER_OPS[ft]||ADV_FILTER_OPS.txt;const catOpts=ft==="cat"&&(f?.options||f?.opts)??(null);const isAct=fil.value!=="";const cs={fontSize:10,border:"1px solid "+M.div,borderRadius:5,padding:"3px 7px",background:M.inBg,color:M.tA,cursor:"pointer",outline:"none"};return(
            <div key={fil.id} style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:9,color:M.tD,minWidth:34,textAlign:"right",fontWeight:600}}>{fi===0?"Where":"And"}</span>
              <select value={fil.field} onChange={e=>updateAdvFilter(fil.id,{field:e.target.value})} style={{...cs,fontWeight:700,color:"#0e7490",borderColor:"#0891B270",background:"#f0fdfa"}}>{allFields.map(fd=><option key={fd.col} value={fd.col}>{fd.h}</option>)}</select>
              <select value={fil.op} onChange={e=>updateAdvFilter(fil.id,{op:e.target.value})} style={cs}>{ops.map(op=><option key={op} value={op}>{op}</option>)}</select>
              {ft==="cat"&&catOpts?<select value={fil.value} onChange={e=>updateAdvFilter(fil.id,{value:e.target.value})} style={{...cs,minWidth:110,fontWeight:700,borderColor:isAct?"#0891B270":M.div,color:isAct?"#0e7490":M.tA}}><option value="">Select value…</option>{catOpts.map(v=><option key={v} value={v}>{v}</option>)}</select>:<input value={fil.value} onChange={e=>updateAdvFilter(fil.id,{value:e.target.value})} placeholder={ft==="num"?"Enter number…":"Enter text…"} type={ft==="num"?"number":"text"} style={{...cs,minWidth:110,fontWeight:700,borderColor:isAct?"#0891B270":M.div,color:isAct?"#0e7490":M.tA}}/>}
              <button onClick={()=>removeAdvFilter(fil.id)} style={{border:"none",background:"transparent",color:"#dc2626",cursor:"pointer",fontSize:15,lineHeight:1,padding:"0 3px",fontWeight:900}}>×</button>
            </div>);})}
          <button onClick={addAdvFilter} style={{alignSelf:"flex-start",marginLeft:40,border:"none",background:"transparent",color:"#0e7490",fontSize:9,fontWeight:700,cursor:"pointer",padding:0}}>＋ Add another filter</button>
        </div>
      </div>}
      {/* §BULK_ENTRY-K: Advanced Multi-Mode Sort Panel */}
      {showAdvSorts&&<div style={{padding:"10px 12px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0}}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {advSorts.map((srt,si)=>{const f=allFields.find(x=>x.col===srt.field);const ft=advFieldType(f);const needVal=srt.mode==="val_first"||srt.mode==="val_last";const catOpts=needVal&&ft==="cat"&&(f?.options||f?.opts)??(null);const cs={fontSize:10,border:"1px solid "+M.div,borderRadius:5,padding:"3px 7px",background:M.inBg,color:M.tA,cursor:"pointer",outline:"none"};return(
            <div key={srt.id} style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:9,color:M.tD,minWidth:34,textAlign:"right",fontWeight:600}}>{si===0?"Sort":"Then"}</span>
              <select value={srt.field} onChange={e=>updateAdvSort(srt.id,{field:e.target.value,value:""})} style={{...cs,fontWeight:700,color:"#6d28d9",borderColor:"#7c3aed70",background:"#7c3aed10"}}>{allFields.map(fd=><option key={fd.col} value={fd.col}>{fd.h}</option>)}</select>
              <select value={srt.mode} onChange={e=>updateAdvSort(srt.id,{mode:e.target.value,value:""})} style={cs}>{ADV_SORT_MODES.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select>
              {needVal&&(catOpts?<select value={srt.value} onChange={e=>updateAdvSort(srt.id,{value:e.target.value})} style={{...cs,minWidth:120,fontWeight:700}}><option value="">Pick value…</option>{catOpts.map(v=><option key={v} value={v}>{v}</option>)}</select>:<input value={srt.value} onChange={e=>updateAdvSort(srt.id,{value:e.target.value})} placeholder="Enter value…" style={{...cs,minWidth:120,fontWeight:700}}/>)}
              {advSorts.length>1&&<button onClick={()=>removeAdvSort(srt.id)} style={{border:"none",background:"transparent",color:"#dc2626",cursor:"pointer",fontSize:15,lineHeight:1,padding:"0 3px",fontWeight:900}}>×</button>}
            </div>);})}
          <button onClick={addAdvSort} style={{alignSelf:"flex-start",marginLeft:40,border:"none",background:"transparent",color:"#6d28d9",fontSize:9,fontWeight:700,cursor:"pointer",padding:0}}>＋ Add another sort</button>
        </div>
      </div>}
      {/* §BULK_ENTRY-L: Combined Filter + Sort Summary Strip */}
      {(()=>{const colEnt=Object.entries(filters).filter(([,v])=>v);const anyF=colEnt.length>0||activeAdvFilterCount>0;if(!anyF&&!isAdvSortActive)return null;const cF={display:"inline-flex",alignItems:"center",gap:3,background:"rgba(8,145,178,.08)",border:"1px solid rgba(8,145,178,.3)",borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,color:"#0e7490",flexShrink:0};const cS={display:"inline-flex",alignItems:"center",gap:3,background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.3)",borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,color:"#7C3AED",flexShrink:0};return(<div style={{background:M.hi,borderBottom:"1px solid "+M.div,padding:"4px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0,flexWrap:"wrap"}}>{anyF&&<><span style={{fontSize:9,fontWeight:900,color:"#0891B2",flexShrink:0}}>FILTERED:</span>{colEnt.map(([k,v])=>{const fd=allFields.find(x=>x.col===k);return(<span key={"c_"+k} style={cF}>{fd?.h||k} <span style={{fontWeight:400,color:"#0891B2"}}>contains</span> <strong>{v}</strong><span onClick={()=>setFilters(p=>{const n={...p};delete n[k];return n;})} style={{cursor:"pointer",color:M.tD,fontSize:11,lineHeight:1,marginLeft:1}}>×</span></span>);})} {advFilters.filter(f=>f.value!=="").map(fil=>{const fd=allFields.find(x=>x.col===fil.field);return(<span key={fil.id} style={cF}>{fd?.h||fil.field} <span style={{fontWeight:400,color:"#0891B2"}}>{fil.op}</span> <strong>{fil.value}</strong><span onClick={()=>removeAdvFilter(fil.id)} style={{cursor:"pointer",color:M.tD,fontSize:11,lineHeight:1,marginLeft:1}}>×</span></span>);})}</>}{anyF&&isAdvSortActive&&<div style={{width:1,height:14,background:M.div,flexShrink:0}}/>}{isAdvSortActive&&<><span style={{fontSize:9,fontWeight:900,color:"#7C3AED",flexShrink:0}}>SORT:</span>{advSorts.map(srt=>{const fd=allFields.find(x=>x.col===srt.field);const ml=ADV_SORT_MODES.find(m=>m.value===srt.mode)?.label||srt.mode;return(<span key={srt.id} style={cS}>{fd?.h||srt.field} <span style={{fontWeight:400,color:"#9333ea"}}>{ml}</span>{srt.value?<> <strong>{srt.value}</strong></>:null}{advSorts.length>1&&<span onClick={()=>removeAdvSort(srt.id)} style={{cursor:"pointer",color:M.tD,fontSize:11,lineHeight:1,marginLeft:1}}>×</span>}</span>);})}</>}<div style={{flex:1}}/><button onClick={()=>{setFilters({});setAdvFilters([]);setAdvSorts([]);}} style={{fontSize:9,color:"#dc2626",background:"transparent",border:"none",cursor:"pointer",flexShrink:0}}>✕ Clear all</button></div>);})()}
      {/* Grid */}
      <div style={{flex:1,overflowX:"auto",overflowY:"auto"}}>
        <table style={{borderCollapse:"collapse",minWidth:"100%"}}>
          <thead style={{position:"sticky",top:0,zIndex:20}}>
            <tr>
              <th style={{width:32,padding:"0 6px",background:M.thd,borderBottom:"2px solid "+CC_RED,borderRight:"1px solid "+M.div}}>
                <input type="checkbox" checked={allSel} onChange={()=>setSelRows(allSel?new Set():new Set(visRows.map(r=>r.__id)))} style={{cursor:"pointer"}}/>
              </th>
              <th style={{width:36,padding:pyV+"px 8px",background:M.thd,borderBottom:"2px solid "+CC_RED,borderRight:"1px solid "+M.div,fontSize:9,fontWeight:900,color:M.tD}}>#</th>
              {visCols.map((col,ci)=>{const f=allFields.find(x=>x.col===col);return(
                <th key={col} draggable onDragStart={()=>setDragCol(col)} onDragOver={e=>{e.preventDefault();setDropCol(col);}} onDrop={()=>{if(dragCol&&dropCol&&dragCol!==dropCol){setColOrder(p=>{const a=[...p],fi=a.indexOf(dragCol),ti=a.indexOf(dropCol);if(fi<0||ti<0)return a;a.splice(fi,1);a.splice(ti,0,dragCol);return a;});}setDragCol(null);setDropCol(null);}}
                  style={{minWidth:colW(col),padding:pyV+"px 8px",background:M.thd,borderBottom:"2px solid "+CC_RED,borderRight:"1px solid "+M.div,textAlign:"left",fontSize:9,fontWeight:900,color:M.tB,whiteSpace:"nowrap",cursor:"grab",userSelect:"none",borderLeft:dropCol===col?"3px solid #f59e0b":"3px solid transparent"}}>
                  <span style={{fontFamily:"monospace",fontSize:8,color:M.tD,marginRight:3}}>{col}</span>{f?.h||col}
                </th>
              );})}
              <th style={{width:28,background:M.thd,borderBottom:"2px solid "+CC_RED}}/>
            </tr>
          </thead>
          <tbody>
            {grouped.map((grp,gi)=>(
              <React.Fragment key={gi}>
                {grp.key!==null&&<tr><td colSpan={visCols.length+3} style={{padding:"6px 12px",background:"#1e293b",color:"#fff",fontWeight:900,fontSize:11}}><span style={{opacity:.7,marginRight:6}}>⊞</span>{allFields.find(f=>f.col===groupBy)?.h}: <span style={{color:"#f59e0b"}}>{grp.key}</span><span style={{background:"#dc2626",color:"#fff",borderRadius:10,padding:"1px 8px",fontSize:9,fontWeight:900,marginLeft:8}}>{grp.sub.reduce((acc,s)=>acc+s.rows.length,0)}</span></td></tr>}
                {grp.sub.map((sub,si)=>(
                  <React.Fragment key={si}>
                    {sub.subKey!==null&&<tr><td colSpan={visCols.length+3} style={{padding:"5px 12px 5px 40px",background:"#334155",color:"#e2e8f0",fontWeight:700,fontSize:10}}>↳ {allFields.find(f=>f.col===subGroupBy)?.h}: <span style={{color:"#c4b5fd"}}>{sub.subKey}</span><span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:8,fontWeight:900,marginLeft:6}}>{sub.rows.length}</span></td></tr>}
                    {sub.rows.map((row,ri)=>{
                      const isSel=selRows.has(row.__id);
                      const rowErrCols=rowErrors[row.__id]||[];
                      const rowBg=row.__new?"rgba(0,120,212,.04)":row.__dirty?"rgba(245,158,11,.04)":"inherit";
                      const leftBorder=rowErrCols.length>0?"3px solid #dc2626":row.__new?"3px solid #0078D4":row.__dirty?"3px solid #f59e0b":"3px solid transparent";
                      return(
                        <tr key={row.__id} style={{borderBottom:"1px solid "+M.div,background:isSel?A.al:rowBg,borderLeft:leftBorder}}>
                          <td style={{padding:"0 6px",textAlign:"center"}}><input type="checkbox" checked={isSel} onChange={()=>setSelRows(p=>{const n=new Set(p);isSel?n.delete(row.__id):n.add(row.__id);return n;})} style={{cursor:"pointer"}}/></td>
                          <td style={{padding:pyV+"px 8px",fontSize:9,color:M.tD,textAlign:"center",fontFamily:"monospace"}}>{ri+1}</td>
                          {visCols.map(col=>{
                            const f=allFields.find(x=>x.col===col);
                            const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");
                            const isEdit=editCell?.rowId===row.__id&&editCell?.col===col;
                            const val=row[col]||"";
                            const isMissing=rowErrCols.includes(col);
                            return(
                              <td key={col} onClick={()=>{if(!isAuto)setEditCell({rowId:row.__id,col});}} onBlur={()=>setEditCell(null)}
                                style={{padding:"2px 4px",maxWidth:colW(col)+40,cursor:isAuto?"default":"pointer",borderRight:"1px solid "+M.div,background:isMissing?"#fff0f0":"inherit"}}>
                                {isAuto?<div style={{fontSize:fz-2,color:A.a,fontFamily:"monospace",padding:"3px 5px",background:A.al,borderRadius:3}}>{val||<span style={{opacity:.5}}>auto</span>}</div>
                                :isEdit?<BulkCell f={f} val={val} onChange={v=>updateCell(row.__id,col,v)} onBlur={()=>setEditCell(null)} M={M} A={A} fz={fz}/>
                                :<div style={{fontSize:fz-2,color:M.tA,padding:"3px 5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",borderBottom:"1px dashed "+(isMissing?"#ef4444":val?"transparent":M.inBd),minHeight:20}}>
                                  {val||isMissing?<span style={{color:"#dc2626",fontWeight:900,fontSize:fz-3}}>⚠ required</span>:<span style={{color:M.tD,fontStyle:"italic",fontSize:fz-3}}>{f?.req?"fill required":"—"}</span>}
                                </div>}
                              </td>
                            );
                          })}
                          <td style={{padding:"2px 4px",textAlign:"center"}}><button onClick={()=>setRows(p=>p.filter(r=>r.__id!==row.__id))} style={{width:20,height:20,borderRadius:3,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",cursor:"pointer",fontSize:11}}>×</button></td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
            <tr><td colSpan={visCols.length+3} style={{padding:"6px 12px"}}><button onClick={addRow} style={{display:"flex",alignItems:"center",gap:6,color:M.tD,background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:700}}><span style={{fontSize:16,color:A.a}}>+</span> Add new row</button></td></tr>
          </tbody>
          <AggFooter visRows={visRows} visCols={visCols} allFields={allFields} aggState={aggState} openCol={aggOpenInfo?.col||null} onCellClick={aggCellClick} hasCheckbox={true} M={M} A={A}/>
        </table>
      </div>
      {aggOpenInfo&&<><div onClick={()=>setAggOpenInfo(null)} style={{position:"fixed",inset:0,zIndex:9998}}/><AggDropdown openInfo={aggOpenInfo} aggState={aggState} setAggState={setAggState} visRows={visRows} allFields={allFields} onClose={()=>setAggOpenInfo(null)} M={M} A={A}/></>}
      {/* Status bar */}
      <div style={{padding:"4px 12px",borderTop:"1px solid "+M.div,background:M.mid,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{fontSize:9,color:M.tD,fontWeight:700}}>{rows.length} total · {visRows.length} visible</span>
        {dirtyCount>0&&<span style={{fontSize:9,color:"#f59e0b",fontWeight:900}}>● {dirtyCount} unsaved</span>}
        {selRows.size>0&&<span style={{fontSize:9,color:A.a,fontWeight:900}}>{selRows.size} selected</span>}
        {sorts.length>0&&<span style={{fontSize:9,color:"#6d28d9"}}>↕ {sorts.map(s=>s.col).join(", ")}</span>}
        {activeFilters>0&&<span style={{fontSize:9,color:A.a}}>🔍 {activeFilters} filter(s)</span>}
        {groupBy&&<span style={{fontSize:9,color:"#059669"}}>⊞ {allFields.find(f=>f.col===groupBy)?.h||groupBy}</span>}
        <div style={{flex:1}}/><span style={{fontSize:8,color:M.tD,fontFamily:"monospace"}}>⬅ drag headers · click cell to edit · tab to move</span>
      </div>
      {/* Modals */}
      {viewSwitchGuard&&<><div onClick={()=>setViewSwitchGuard(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(2px)",zIndex:1500}}/><div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:M.hi,border:"1px solid #fcd34d",borderRadius:10,zIndex:1501,boxShadow:"0 8px 32px rgba(0,0,0,.3)",overflow:"hidden"}}><div style={{background:"#f59e0b",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>⚠️</span><div><div style={{color:"#fff",fontSize:13,fontWeight:900}}>Unsaved View Changes</div><div style={{color:"rgba(255,255,255,.85)",fontSize:10}}>"{activeViewName}" has unsaved modifications</div></div></div><div style={{padding:"16px 20px"}}><div style={{display:"flex",flexDirection:"column",gap:8}}><button onClick={()=>{updateCurrentView();loadTemplate(viewSwitchGuard.pendingTpl);setViewSwitchGuard(null);}} style={{padding:"9px 16px",border:"none",borderRadius:6,background:"#15803d",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer",textAlign:"left"}}>💾 Save changes — then switch</button><button onClick={()=>{loadTemplate(viewSwitchGuard.pendingTpl);setViewSwitchGuard(null);}} style={{padding:"9px 16px",border:"1px solid #fcd34d",borderRadius:6,background:"#fffbeb",color:"#92400e",fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left"}}>↩ Discard — switch to "{viewSwitchGuard.pendingTpl.name}"</button><button onClick={()=>setViewSwitchGuard(null)} style={{padding:"9px 16px",border:"1px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tB,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"left"}}>← Stay on "{activeViewName}"</button></div></div></div></>}
      {editingTpl&&<ViewEditModal allFields={allFields} allCols={allCols} initial={editingTpl.tpl} isDup={!editingTpl.originalName} existingNames={["Default",...templates.map(t=>t.name).filter(n=>n!==editingTpl.originalName)]} onSave={commitTplEdit} onCancel={()=>setEditingTpl(null)} M={M} A={A} fz={fz}/>}
      {toast&&<div style={{position:"absolute",bottom:40,right:16,zIndex:999,background:toast.color||"#15803d",color:"#fff",borderRadius:7,padding:"8px 16px",fontSize:11,fontWeight:800,boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>{toast.msg}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FIELD SPECS TAB — read-only field reference table
// ═══════════════════════════════════════════════════════════════════
function FieldSpecsTab({ allFields, M, A, fz, pyV }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const TABS = ["All","Mandatory","Auto/GAS","FK Links","Manual Entry"];
  const fields = allFields.filter(f => {
    const ms = !search || f.h.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="Mandatory"?f.req:filter==="Auto/GAS"?(f.auto||f.ico==="#"):filter==="FK Links"?!!f.fk:filter==="Manual Entry"?(!f.auto&&f.ico!=="#"&&!f.fk&&!["calc","auto","autocode"].includes(f.type)):true;
    return ms && mf;
  });
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"8px 14px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fields…" style={{border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tA,fontSize:fz-2,padding:"4px 8px",outline:"none",width:160}}/>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {TABS.map(t=><button key={t} onClick={()=>setFilter(t)} style={{padding:"3px 10px",borderRadius:20,border:"1.5px solid "+(filter===t?A.a:M.inBd),background:filter===t?A.a:M.inBg,color:filter===t?A.tx:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>{t}</button>)}
        </div>
        <span style={{marginLeft:"auto",fontSize:10,color:M.tC,fontWeight:700}}>{fields.length}/{allFields.length}</span>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead style={{position:"sticky",top:0,zIndex:10}}>
            <tr style={{background:CC_RED}}>
              {["COL","ICO","FIELD HEADER","DATA TYPE","REQ?","AUTO?","FK LINK"].map(h=><th key={h} style={{padding:pyV+"px 8px",textAlign:"left",fontSize:9,fontWeight:900,color:"#fff",borderBottom:"2px solid #aa0000",whiteSpace:"nowrap"}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {fields.map((f,i)=>(
              <tr key={f.col} style={{background:i%2===0?M.tev:M.tod,borderBottom:"1px solid "+M.div}}>
                <td style={{padding:pyV+"px 8px",fontFamily:"monospace",fontSize:9,fontWeight:700,color:M.tC}}>{f.col}</td>
                <td style={{padding:pyV+"px 8px",textAlign:"center"}}><IcoLabel ico={f.ico} A={A}/></td>
                <td style={{padding:pyV+"px 8px"}}><div style={{fontSize:fz-2,fontWeight:700,color:M.tA}}>{f.h}</div><div style={{fontSize:8,color:M.tD,marginTop:1}}>{f.hint}</div></td>
                <td style={{padding:pyV+"px 8px"}}><DtBadge type={f.type}/></td>
                <td style={{padding:pyV+"px 8px",textAlign:"center"}}>{f.req?<span style={{color:"#ef4444",fontWeight:900,fontSize:9}}>YES</span>:<span style={{color:M.tD,fontSize:9}}>—</span>}</td>
                <td style={{padding:pyV+"px 8px",textAlign:"center"}}>{(f.auto||f.ico==="#")?<span style={{color:"#059669",fontWeight:900,fontSize:9}}>GAS</span>:<span style={{color:M.tD,fontSize:9}}>—</span>}</td>
                <td style={{padding:pyV+"px 8px"}}>{f.fk?<span style={{fontSize:9,fontWeight:900,color:"#2563eb",fontFamily:"monospace"}}>{f.fk}</span>:<span style={{color:M.tD,fontSize:9}}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  LAYOUT VIEW — §LAYOUT_VIEW  (CC_ERP_MODULE_display_SKILL.md)
//  Full rules: CC_ERP_LAYOUT_VIEW_RULES.md
//  Source reference: ArticleMasterTab.jsx → ArticleMasterLayoutPanel
// ════════════════════════════════════════════════════════════════════════

// ── Theme adapter (required — run rawM through this before any use) ──
function toM(M) {
  return {
    ...M,
    sh:M.shellBg||M.surfHigh, shBd:M.shellBd||M.divider,
    hi:M.surfHigh, mid:M.surfMid, lo:M.surfLow,
    hov:M.hoverBg, inBg:M.inputBg, inBd:M.inputBd,
    div:M.divider, thd:M.tblHead, tev:M.tblEven, tod:M.tblOdd,
    bBg:M.badgeBg, bTx:M.badgeTx,
    tA:M.textA, tB:M.textB, tC:M.textC, tD:M.textD,
    scr:M.scrollThumb, shadow:M.shadow,
  };
}

// ═══════════════════════════════════════════════════════════
//  [TODO-LV-GROUPABLE]  Fields that can be used as Group By L1 / L2
//  ~9 fields, always include primary dimension + category + status
// ═══════════════════════════════════════════════════════════
const LV_GROUPABLE_FIELDS = [
  // { key: "l1Division", label: "Division"   },
  // { key: "l2Category", label: "Category"   },
  // { key: "gender",     label: "Gender"     },
  // { key: "season",     label: "Season"     },
  // { key: "status",     label: "Status"     },
  // { key: "fitType",    label: "Fit Type"   },
  // Add module-specific groupable fields here
];

// ═══════════════════════════════════════════════════════════
//  [TODO-LV-PRESETS]  Quick grouping preset combinations (5–6)
// ═══════════════════════════════════════════════════════════
const LV_PRESETS = [
  // { label: "Div › Category",    l1: "l1Division", l2: "l2Category" },
  // { label: "Gender › Category", l1: "gender",     l2: "l2Category" },
  // { label: "Season › Category", l1: "season",     l2: "l2Category" },
  // { label: "Status › Div",      l1: "status",     l2: "l1Division" },
];

// ═══════════════════════════════════════════════════════════
//  [TODO-LV-META]  Color + icon per group value
//  Define maps for each groupable dimension.
//  Use hashColor() for unknown/dynamic values.
// ═══════════════════════════════════════════════════════════
const LV_PALETTE = ["#E8690A","#7C3AED","#15803D","#0078D4","#DC2626","#D97706","#059669","#2563EB","#DB2777","#0891B2","#65A30D","#9333EA"];
function lvHashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return LV_PALETTE[h % LV_PALETTE.length];
}
// Example metadata maps — replace with module-specific values:
// const LV_DIVISION_META = {
//   "Men's Apparel":   { color: "#E8690A", icon: "👔" },
//   "Women's Apparel": { color: "#7C3AED", icon: "👗" },
// };
// const LV_STATUS_META = {
//   Active:      { color: "#15803D", icon: "✅" },
//   Inactive:    { color: "#DC2626", icon: "⛔" },
//   Development: { color: "#D97706", icon: "🔧" },
// };
function lvGetGroupMeta(field, value) {
  // TODO: return { color, icon } for field/value — use metadata maps above
  // Example:
  // if (field === "l1Division") return LV_DIVISION_META[value] || { color: lvHashColor(value), icon: "📂" };
  // if (field === "status")     return LV_STATUS_META[value]   || { color: lvHashColor(value), icon: "●"  };
  return { color: lvHashColor(String(value)), icon: "◆" };
}

// ═══════════════════════════════════════════════════════════
//  [TODO-LV-SCHEMA]  Detail modal field schema
//  Used by LayoutViewDetailModal to display record fields
//  Flags: mono (dff font) | badge (status pill) | required (red *) | full (span full width in Card layout)
// ═══════════════════════════════════════════════════════════
const LV_SCHEMA = [
  // { key: "code",   label: "Record Code",  mono: true, required: true },
  // { key: "desc",   label: "Description",              required: true, full: true },
  // { key: "status", label: "Status",        badge: true               },
  // { key: "tags",   label: "Tags",                                     full: true },
  // Add all display fields here
];

// ═══════════════════════════════════════════════════════════
//  [TODO-LV-DISPLAY]  Display options — which fields default ON
// ═══════════════════════════════════════════════════════════
const LV_DISPLAY_FIELDS = LV_SCHEMA.map(f => ({ key: f.key, label: f.label }));
const LV_INIT_SHOW_FIELDS = Object.fromEntries(
  LV_DISPLAY_FIELDS.map(f => [f.key, ["code","status"].includes(f.key)])
  // TODO: set true for the fields you want shown by default (code + status always true)
);
const LV_INIT_DISPLAY_OPTS = {
  thumbnail: false,
  thumbSize: "md",      // "sm" | "md" | "lg"
  density:   "summary", // "summary" | "detail"
  showFields: LV_INIT_SHOW_FIELDS,
};

// ═══════════════════════════════════════════════════════════
//  [TODO-LV-INIT-VIEWS]  Initial locked views (2–3 recommended)
//  locked: true  = cannot be renamed/deleted (Default, and type presets)
//  Always include at minimum: v_default
// ═══════════════════════════════════════════════════════════
const LV_INIT_VIEWS = [
  { id: "v_default", name: "Default", icon: "🌳", color: "#0078D4", locked: true,
    layoutTab: "classic",
    groupByL1: LV_GROUPABLE_FIELDS[0]?.key || "",
    groupByL2: LV_GROUPABLE_FIELDS[1]?.key || "",
    filters: [], sorts: [{ id: 1, field: LV_SCHEMA[0]?.key || "code", mode: "a_z", value: "" }],
    search: "", displayOpts: LV_INIT_DISPLAY_OPTS, cardsGroupBy: "", cardsSubGroupBy: "" },
  // Add 1–2 more locked views for common layouts:
  // { id: "v_cards",  name: "Cards",  icon: "▦", color: "#7C3AED", locked: true, layoutTab: "cards",  ... },
  // { id: "v_matrix", name: "Matrix", icon: "⊞", color: "#E8690A", locked: true, layoutTab: "matrix", ... },
];

// ── Status badge colors (extend for module-specific statuses) ──
const LV_STATUS_BG = {
  Active: "#d1fae5", Development: "#fef3c7", Inactive: "#fee2e2",
  Approved: "#d1fae5", Draft: "#f3f4f6", Completed: "#d1fae5",
  Overdue: "#fee2e2", Blocked: "#fee2e2", Yes: "#d1fae5", No: "#fee2e2",
};
const LV_STATUS_TX = {
  Active: "#065f46", Development: "#92400e", Inactive: "#991b1b",
  Approved: "#065f46", Draft: "#6b7280", Completed: "#065f46",
  Overdue: "#991b1b", Blocked: "#991b1b", Yes: "#065f46", No: "#991b1b",
};

// ── Filter operator sets ──
const LV_FILTER_OPS = {
  cat: ["is", "is not", "contains", "starts with"],
  num: ["=", "≠", ">", "<", "≥", "≤"],
  txt: ["contains", "starts with", "is", "is not"],
};
const LV_SORT_MODES = [
  { value: "a_z",    label: "A → Z"          },
  { value: "z_a",    label: "Z → A"          },
  { value: "freq_h", label: "Most frequent"  },
  { value: "freq_l", label: "Least frequent" },
  { value: "num_h",  label: "High → Low"     },
  { value: "num_l",  label: "Low → High"     },
];

// ── Layout View toggle switch ──
function LvToggleSwitch({ on, onChange, A }) {
  return (
    <div onClick={onChange} style={{ width:30, height:16, borderRadius:8, background:on?A.a:"#aaa", cursor:"pointer", position:"relative", transition:"background .15s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:2, left:on?16:2, width:12, height:12, borderRadius:6, background:"#fff", transition:"left .15s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
    </div>
  );
}

// ── Layout View Save-View Modal ──
const LV_VICONS = ["⚡","📋","▦","⊞","🌳","⟁","≡","🎯","✅","📊","📦","🏷️","⚙️","🔑"];
const LV_VCOLORS = ["#E8690A","#0078D4","#15803D","#7C3AED","#BE123C","#854d0e","#059669","#6b7280"];
function LvSaveViewModal({ onSave, onClose, M, A, uff }) {
  const [name,  setName]  = useState("");
  const [icon,  setIcon]  = useState("📋");
  const [color, setColor] = useState("#7C3AED");
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.3)", zIndex:3000 }} />
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:320, background:M.hi, borderRadius:12, border:`1px solid ${M.div}`, zIndex:3001, overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,.3)" }}>
        <div style={{ padding:"11px 16px", borderBottom:`1px solid ${M.div}`, background:M.thd, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:900, color:M.tA, fontFamily:uff }}>💾 Save View As</span>
          <button onClick={onClose} style={{ border:"none", background:"transparent", color:M.tD, fontSize:18, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:16 }}>
          <div style={{ fontSize:9, fontWeight:800, color:M.tD, fontFamily:uff, marginBottom:4, textTransform:"uppercase" }}>View Name</div>
          <input value={name} onChange={e=>setName(e.target.value)} autoFocus placeholder="e.g. My Custom View"
            style={{ width:"100%", padding:"7px 10px", border:`1.5px solid ${A.a}`, borderRadius:6, background:M.inBg, color:M.tA, fontSize:12, fontFamily:uff, outline:"none", boxSizing:"border-box", marginBottom:12 }} />
          <div style={{ fontSize:9, fontWeight:800, color:M.tD, fontFamily:uff, marginBottom:6, textTransform:"uppercase" }}>Icon</div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:12 }}>
            {LV_VICONS.map(ic => (
              <button key={ic} onClick={()=>setIcon(ic)} style={{ width:28, height:28, border:`1.5px solid ${icon===ic?A.a:M.div}`, borderRadius:6, background:icon===ic?A.al:"transparent", cursor:"pointer", fontSize:14 }}>{ic}</button>
            ))}
          </div>
          <div style={{ fontSize:9, fontWeight:800, color:M.tD, fontFamily:uff, marginBottom:6, textTransform:"uppercase" }}>Color</div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:16 }}>
            {LV_VCOLORS.map(c => (
              <button key={c} onClick={()=>setColor(c)} style={{ width:22, height:22, borderRadius:"50%", background:c, border:`2.5px solid ${color===c?M.tA:"transparent"}`, cursor:"pointer" }} />
            ))}
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ padding:"7px 16px", border:`1px solid ${M.div}`, borderRadius:6, background:"transparent", color:M.tB, fontSize:11, cursor:"pointer", fontFamily:uff }}>Cancel</button>
            <button onClick={()=>name.trim()&&onSave({name:name.trim(),icon,color})}
              style={{ padding:"7px 16px", border:"none", borderRadius:6, background:name.trim()?A.a:M.bBg, color:name.trim()?"#fff":M.tD, fontSize:11, fontWeight:800, cursor:name.trim()?"pointer":"default", fontFamily:uff }}>
              Save View
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Layout View Detail Modal (3-layout: Card / Table / JSON) ──
function LayoutViewDetailModal({ record, onClose, onPrev, onNext, recIndex, totalRecs, onEdit, canEdit = true, M, A, uff, dff, fz = 13 }) {
  const [layout, setLayout] = useState("card"); // "card" | "table" | "json"
  const codeKey = LV_SCHEMA[0]?.key || "code";
  const codeVal = record[codeKey] || "—";
  const LAYOUTS = [{ id:"card", label:"▦ Card" }, { id:"table", label:"≡ Table" }, { id:"json", label:"{ } JSON" }];

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", backdropFilter:"blur(3px)", zIndex:1100 }} />
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:660, maxWidth:"95vw", maxHeight:"88vh", background:M.hi, border:`1px solid ${M.div}`, borderRadius:12, zIndex:1101, boxShadow:M.shadow, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* ── Header (A.a accent — MANDATORY) ── */}
        <div style={{ background:A.a, padding:"12px 18px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:16 }}>📋</span>
          <div>
            <div style={{ fontSize:13, fontWeight:900, color:"#fff", fontFamily:uff }}>Record Detail</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.75)", fontFamily:dff }}>{codeVal}</div>
          </div>
          <div style={{ flex:1 }} />
          {/* Layout toggle */}
          <div style={{ display:"flex", background:"rgba(255,255,255,.15)", borderRadius:6, overflow:"hidden", gap:1 }}>
            {LAYOUTS.map(l => (
              <button key={l.id} onClick={()=>setLayout(l.id)}
                style={{ padding:"4px 10px", border:"none", cursor:"pointer", fontSize:9.5, fontWeight:layout===l.id?900:600, background:layout===l.id?"rgba(255,255,255,.3)":"transparent", color:"#fff", fontFamily:uff }}>
                {l.label}
              </button>
            ))}
          </div>
          {canEdit && <span style={{ fontSize:9, color:"rgba(255,255,255,.6)", fontFamily:uff }}>Read Only</span>}
          {!canEdit && <span style={{ fontSize:9, color:"rgba(255,255,255,.6)", fontFamily:uff, background:"rgba(0,0,0,.2)", padding:"2px 7px", borderRadius:4 }}>🔒 Read Only</span>}
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:"none", background:"rgba(255,255,255,.2)", color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        {/* ── Body ── */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {layout === "card" && (
            <div style={{ padding:"18px 20px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 24px" }}>
                {LV_SCHEMA.map(f => {
                  const val = record[f.key];
                  const hasVal = val !== undefined && val !== null && val !== "";
                  return (
                    <div key={f.key} style={{ gridColumn:(f.full||f.type==="textarea")?"1 / -1":undefined }}>
                      <div style={{ fontSize:8.5, fontWeight:900, color:M.tD, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4, fontFamily:uff }}>
                        {f.label}{f.required&&<span style={{ color:"#ef4444", marginLeft:3 }}>*</span>}
                      </div>
                      <div style={{ fontSize:fz, fontWeight:f.key===codeKey?800:f.badge?700:400, color:f.key===codeKey?A.a:M.tA, fontFamily:f.mono?dff:uff, padding:"6px 10px", background:M.mid, borderRadius:5, minHeight:28, display:"flex", alignItems:"center", border:`1px solid ${M.div}` }}>
                        {hasVal ? (
                          f.badge
                            ? <span style={{ fontSize:fz-1, fontWeight:800, padding:"2px 10px", borderRadius:12, background:LV_STATUS_BG[val]||"#f3f4f6", color:LV_STATUS_TX[val]||"#6b7280" }}>{val}</span>
                            : String(val)
                        ) : <span style={{ color:M.tD, fontStyle:"italic", fontSize:fz-2 }}>—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {layout === "table" && (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead style={{ position:"sticky", top:0, zIndex:2 }}>
                <tr style={{ background:M.thd }}>
                  <th style={{ padding:"8px 14px", textAlign:"left", fontSize:9, fontWeight:900, color:M.tD, borderBottom:`2px solid ${M.div}`, fontFamily:uff, letterSpacing:0.5 }}>FIELD</th>
                  <th style={{ padding:"8px 14px", textAlign:"left", fontSize:9, fontWeight:900, color:M.tD, borderBottom:`2px solid ${M.div}`, fontFamily:uff, letterSpacing:0.5 }}>VALUE</th>
                </tr>
              </thead>
              <tbody>
                {LV_SCHEMA.map((f, i) => {
                  const val = record[f.key];
                  const hasVal = val !== undefined && val !== null && val !== "";
                  return (
                    <tr key={f.key} style={{ background:i%2===0?M.tev:M.tod, borderBottom:`1px solid ${M.div}` }}>
                      <td style={{ padding:"7px 14px", fontSize:fz-2, fontWeight:700, color:f.key===codeKey?A.a:M.tC, fontFamily:uff, whiteSpace:"nowrap", borderRight:`1px solid ${M.div}`, width:180 }}>
                        {f.label}{f.required&&<span style={{ color:"#ef4444", marginLeft:3, fontSize:9 }}>*</span>}
                      </td>
                      <td style={{ padding:"7px 14px", fontSize:fz-1, color:M.tA, fontFamily:f.mono?dff:uff }}>
                        {hasVal ? (
                          f.badge
                            ? <span style={{ fontSize:fz-2, fontWeight:700, padding:"2px 8px", borderRadius:12, background:LV_STATUS_BG[val]||"#f3f4f6", color:LV_STATUS_TX[val]||"#6b7280" }}>{val}</span>
                            : String(val)
                        ) : <span style={{ color:M.tD, fontStyle:"italic", fontSize:fz-2 }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {layout === "json" && (() => {
            const json = JSON.stringify(record, null, 2);
            const [copied, setCopied] = useState(false);
            return (
              <div style={{ padding:16 }}>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:8 }}>
                  <button onClick={()=>{navigator.clipboard?.writeText(json).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});}}
                    style={{ padding:"4px 12px", border:`1px solid ${M.inBd}`, borderRadius:5, background:M.inBg, color:M.tB, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:uff }}>
                    {copied?"✓ Copied!":"⧉ Copy JSON"}
                  </button>
                </div>
                <pre style={{ background:"#0f172a", color:"#e2e8f0", padding:16, borderRadius:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:11.5, lineHeight:1.6, overflowX:"auto", margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                  {json}
                </pre>
              </div>
            );
          })()}
        </div>
        {/* ── Footer ── */}
        <div style={{ padding:"10px 18px", borderTop:`1px solid ${M.div}`, display:"flex", alignItems:"center", gap:6, background:M.mid, flexShrink:0 }}>
          {/* Prev / Next navigation */}
          <button onClick={onPrev} disabled={recIndex===0}
            style={{ padding:"5px 10px", border:`1px solid ${M.div}`, borderRadius:5, background:"transparent", color:recIndex===0?M.tD:M.tB, fontSize:10, fontWeight:700, cursor:recIndex===0?"default":"pointer", opacity:recIndex===0?.4:1 }}>‹ Prev</button>
          <span style={{ fontSize:9, color:M.tD, minWidth:40, textAlign:"center" }}>{recIndex+1} / {totalRecs}</span>
          <button onClick={onNext} disabled={recIndex===totalRecs-1}
            style={{ padding:"5px 10px", border:`1px solid ${M.div}`, borderRadius:5, background:"transparent", color:recIndex===totalRecs-1?M.tD:M.tB, fontSize:10, fontWeight:700, cursor:recIndex===totalRecs-1?"default":"pointer", opacity:recIndex===totalRecs-1?.4:1 }}>Next ›</button>
          <button onClick={()=>window.print()}
            style={{ padding:"5px 10px", border:`1px solid ${M.div}`, borderRadius:5, background:"transparent", color:M.tB, fontSize:10, fontWeight:600, cursor:"pointer" }}>🖨 Print</button>
          <div style={{ flex:1 }} />
          <button onClick={onClose}
            style={{ padding:"6px 18px", border:`1px solid ${M.inBd}`, borderRadius:6, background:M.inBg, color:M.tB, fontSize:11, fontWeight:700, cursor:"pointer" }}>Close</button>
          {canEdit && onEdit
            ? <button onClick={()=>{onEdit(record);onClose();}}
                style={{ padding:"6px 18px", border:"none", borderRadius:6, background:A.a, color:"#fff", fontSize:11, fontWeight:900, cursor:"pointer" }}>✏ Edit Record</button>
            : <span style={{ fontSize:9, color:"#991b1b", background:"#fee2e2", border:"1px solid #fecaca", borderRadius:5, padding:"4px 10px", fontWeight:700 }}>🔒 No Edit Rights — Contact Admin</span>
          }
        </div>
      </div>
    </>
  );
}

// ── Layout View Properties Panel ──
function LvPropertiesPanel({ displayOpts, setDisplayOpts, onClose, M, A, uff }) {
  const panelRef = useRef(null);
  useEffect(() => {
    const h = e => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const { thumbnail, thumbSize, density, showFields } = displayOpts;
  return (
    <div ref={panelRef} style={{ position:"absolute", right:0, top:38, width:240, background:M.hi, border:`1px solid ${M.div}`, borderRadius:10, boxShadow:"0 8px 28px rgba(0,0,0,.2)", zIndex:500, overflow:"hidden" }}>
      <div style={{ padding:"10px 14px", borderBottom:`1px solid ${M.div}`, background:M.thd }}>
        <span style={{ fontSize:11, fontWeight:900, color:M.tA, fontFamily:uff }}>⚙ Properties</span>
      </div>
      <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:14 }}>
        {/* Thumbnail */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:800, color:M.tB, fontFamily:uff }}>Thumbnail</span>
            <LvToggleSwitch on={thumbnail} onChange={()=>setDisplayOpts(p=>({...p,thumbnail:!p.thumbnail}))} A={A} />
          </div>
          {thumbnail && (
            <div style={{ display:"flex", gap:3 }}>
              {["sm","md","lg"].map(s => (
                <button key={s} onClick={()=>setDisplayOpts(p=>({...p,thumbSize:s}))}
                  style={{ flex:1, padding:"4px", border:`1.5px solid ${thumbSize===s?A.a:M.div}`, borderRadius:5, background:thumbSize===s?A.al:"transparent", color:thumbSize===s?A.a:M.tB, fontSize:9, fontWeight:thumbSize===s?900:600, cursor:"pointer", fontFamily:uff }}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Density */}
        <div>
          <div style={{ fontSize:10, fontWeight:800, color:M.tB, fontFamily:uff, marginBottom:6 }}>Density</div>
          <div style={{ display:"flex", borderRadius:5, overflow:"hidden", border:`1px solid ${M.div}` }}>
            {[{v:"summary",l:"Summary"},{v:"detail",l:"Detail"}].map(d => (
              <button key={d.v} onClick={()=>setDisplayOpts(p=>({...p,density:d.v}))}
                style={{ flex:1, padding:"5px", border:"none", background:density===d.v?A.a:"transparent", color:density===d.v?"#fff":M.tB, fontSize:9, fontWeight:density===d.v?900:600, cursor:"pointer", fontFamily:uff }}>
                {d.l}
              </button>
            ))}
          </div>
        </div>
        {/* Fields */}
        <div>
          <div style={{ fontSize:10, fontWeight:800, color:M.tB, fontFamily:uff, marginBottom:6 }}>Fields</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:160, overflowY:"auto" }}>
            {LV_DISPLAY_FIELDS.map(f => (
              <div key={f.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:9.5, color:M.tB, fontFamily:uff }}>{f.label}</span>
                <LvToggleSwitch on={!!showFields[f.key]} onChange={()=>setDisplayOpts(p=>({...p,showFields:{...p.showFields,[f.key]:!p.showFields[f.key]}}))} A={A} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  LayoutViewPanel — NAMED EXPORT
//  Inject into SheetWorkspace or any host as an extra tab.
//  Props: { M: rawM, A, uff, dff, canEdit, onEditRecord }
//
//  RULES (mandatory — §LAYOUT_VIEW in CC_ERP_MODULE_display_SKILL.md):
//  Row 1: Sub-tab bar (Classic/Hierarchy/Column/Cards/Matrix + Export/Print/MaxView/Properties)
//  Row 2: Views Bar  (white bg — CC Red for locked, Purple for user views)
//  Row 3: Unified Toolbar (Search + Filter + Sort | Group By + Presets | count)
//  Row 4: Content Area
// ════════════════════════════════════════════════════════════════════════
export function LayoutViewPanel({ M: rawM, A, uff, dff, canEdit = true, onEditRecord }) {
  const M  = toM(rawM);
  const fz = 13;

  // ── Layout & group state ──
  const [layoutTab,   setLayoutTab]   = useState("classic");
  const [groupByL1,   setGroupByL1]   = useState(LV_GROUPABLE_FIELDS[0]?.key || "");
  const [groupByL2,   setGroupByL2]   = useState(LV_GROUPABLE_FIELDS[1]?.key || "");
  const [displayOpts, setDisplayOpts] = useState(LV_INIT_DISPLAY_OPTS);
  const [showPanel,   setShowPanel]   = useState(false);
  const [isMaxView,   setIsMaxView]   = useState(false);

  // ── Filter / sort / search ──
  const [filters,     setFilters]     = useState([]);
  const [sorts,       setSorts]       = useState([{ id:1, field:LV_SCHEMA[0]?.key||"code", mode:"a_z", value:"" }]);
  const [search,      setSearch]      = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSorts,   setShowSorts]   = useState(false);

  // ── Cards own grouping (lifted so views can capture it) ──
  const [cardsGroupBy,    setCardsGroupBy]    = useState("");
  const [cardsSubGroupBy, setCardsSubGroupBy] = useState("");

  // ── Views system ──
  const [layoutViews,   setLayoutViews]   = useState(LV_INIT_VIEWS);
  const [activeViewId,  setActiveViewId]  = useState(LV_INIT_VIEWS[0]?.id || "v_default");
  const [selectedRec,   setSelectedRec]   = useState(null);
  const [showExport,    setShowExport]    = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // ── Derived: is current config different from saved view? ──
  const isViewDirty = useMemo(() => {
    const av = layoutViews.find(v => v.id === activeViewId);
    if (!av) return false;
    const cur   = JSON.stringify({ layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts:JSON.stringify(displayOpts), cardsGroupBy, cardsSubGroupBy });
    const saved = JSON.stringify({ layoutTab:av.layoutTab, groupByL1:av.groupByL1, groupByL2:av.groupByL2, filters:av.filters, sorts:av.sorts, search:av.search, displayOpts:JSON.stringify(av.displayOpts), cardsGroupBy:av.cardsGroupBy||"", cardsSubGroupBy:av.cardsSubGroupBy||"" });
    return cur !== saved;
  }, [layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy, layoutViews, activeViewId]);

  // ── View helpers ──
  const switchToView = useCallback((viewId) => {
    const v = layoutViews.find(lv => lv.id === viewId);
    if (!v) return;
    setActiveViewId(viewId);
    setLayoutTab(v.layoutTab);
    setGroupByL1(v.groupByL1);
    setGroupByL2(v.groupByL2);
    setFilters(v.filters);
    setSorts(v.sorts);
    setSearch(v.search);
    setDisplayOpts(v.displayOpts);
    setCardsGroupBy(v.cardsGroupBy || "");
    setCardsSubGroupBy(v.cardsSubGroupBy || "");
    setShowFilters(false);
    setShowSorts(false);
  }, [layoutViews]);

  const saveCurrentToView = useCallback(() => {
    setLayoutViews(prev => prev.map(v => v.id === activeViewId
      ? { ...v, layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy }
      : v));
  }, [activeViewId, layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy]);

  const addNewView = useCallback(({ name, icon, color }) => {
    const id = `v_${Date.now()}`;
    setLayoutViews(prev => [...prev, { id, name, icon, color, locked:false, layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy }]);
    setActiveViewId(id);
    setShowSaveModal(false);
  }, [layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy]);

  const deleteView = useCallback((viewId) => {
    const v = layoutViews.find(lv => lv.id === viewId);
    if (!v || v.locked) return;
    setLayoutViews(prev => prev.filter(lv => lv.id !== viewId));
    if (activeViewId === viewId) switchToView(LV_INIT_VIEWS[0]?.id || "v_default");
  }, [layoutViews, activeViewId, switchToView]);

  // ── Escape exits Max View (only when no modal open) ──
  useEffect(() => {
    if (!isMaxView || selectedRec) return;
    const h = e => { if (e.key === "Escape") setIsMaxView(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isMaxView, selectedRec]);

  // ── Data processing — apply search → filters → sort ──
  // TODO: replace MODULE_MOCK_RECORDS with your module's data source
  const processedData = useMemo(() => {
    let r = MODULE_MOCK_RECORDS;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(d => Object.values(d).some(v => String(v||"").toLowerCase().includes(q)));
    }
    // TODO: apply LV filters and sorts here (wire evalFilter + applyMultiSort)
    return r;
  }, [search, filters, sorts]);

  // ── Group By hierarchy ──
  const orgHierarchy = useMemo(() => {
    const h = {};
    processedData.forEach(r => {
      const l1val = r[groupByL1] || "(blank)";
      const l2val = r[groupByL2] || "(blank)";
      if (!h[l1val]) { const { color, icon } = lvGetGroupMeta(groupByL1, l1val); h[l1val] = { label:l1val, color, icon, l2s:{} }; }
      if (!h[l1val].l2s[l2val]) h[l1val].l2s[l2val] = [];
      h[l1val].l2s[l2val].push(r);
    });
    return Object.keys(h).sort().map(k => h[k]);
  }, [processedData, groupByL1, groupByL2]);

  const PROPS_VIEWS = ["classic","hierarchy","column","cards"];
  const propsSupported = PROPS_VIEWS.includes(layoutTab);

  const layoutBtnS = (active) => ({
    padding:"4px 13px", border:`1px solid ${active?A.a:M.div}`,
    borderRadius:5, background:active?A.al:"transparent",
    color:active?A.a:M.tB, fontSize:10, fontWeight:active?900:600,
    cursor:"pointer", fontFamily:uff, outline:"none",
  });

  return (
    <div style={isMaxView
      ? { position:"fixed", inset:0, zIndex:1200, background:M.hi, display:"flex", flexDirection:"column", overflow:"hidden" }
      : { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ══ ROW 1: Sub-tab bar ══ */}
      <div style={{ padding:"6px 16px", display:"flex", gap:4, borderBottom:`1px solid ${M.div}`, background:M.thd, flexShrink:0, flexWrap:"wrap", alignItems:"center" }}>
        {[
          { id:"classic",   label:"🌳 Classic"  },
          { id:"hierarchy", label:"⟁ Hierarchy" },
          { id:"column",    label:"≡ Column"    },
          { id:"cards",     label:"▦ Cards"     },
          { id:"matrix",    label:"⊞ Matrix"    },
        ].map(({ id, label }) => (
          <button key={id} onClick={()=>{ setLayoutTab(id); if(!PROPS_VIEWS.includes(id)) setShowPanel(false); }}
            style={layoutBtnS(layoutTab===id)}>{label}</button>
        ))}
        {/* Right-side controls */}
        <div style={{ marginLeft:"auto", display:"flex", gap:6, alignItems:"center" }}>
          {/* Export */}
          <div style={{ position:"relative" }}>
            {showExport && <div onClick={()=>setShowExport(false)} style={{ position:"fixed", inset:0, zIndex:499 }} />}
            <button onClick={()=>setShowExport(v=>!v)}
              style={{ padding:"4px 11px", border:`1px solid ${showExport?A.a:M.div}`, borderRadius:5, background:showExport?A.al:"transparent", color:showExport?A.a:M.tB, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:uff }}>
              ⬇ Export
            </button>
            {showExport && (
              <div style={{ position:"absolute", right:0, top:30, zIndex:500, background:M.hi, border:`1px solid ${M.div}`, borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,.18)", minWidth:160, overflow:"hidden" }}>
                {[
                  { label:"📄 Export CSV",  fn:()=>{ /* TODO: exportAsCsv(processedData) */ } },
                  { label:"🖨 Print / PDF", fn:()=>window.print() },
                ].map(({ label, fn }) => (
                  <button key={label} onClick={()=>{ fn(); setShowExport(false); }}
                    style={{ display:"block", width:"100%", padding:"8px 14px", border:"none", background:"transparent", color:M.tA, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:uff, textAlign:"left" }}
                    onMouseEnter={e=>e.currentTarget.style.background=M.mid}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Print */}
          <button onClick={()=>window.print()}
            style={{ padding:"4px 10px", border:`1px solid ${M.div}`, borderRadius:5, background:"transparent", color:M.tB, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:uff }}>
            🖨 Print
          </button>
          {/* Max View */}
          <button onClick={()=>setIsMaxView(v=>!v)} title={isMaxView?"Restore (Esc)":"Expand to full page"}
            style={{ padding:"4px 10px", border:`1px solid ${isMaxView?A.a:M.div}`, borderRadius:5, background:isMaxView?A.al:"transparent", color:isMaxView?A.a:M.tB, fontSize:10, fontWeight:isMaxView?800:600, cursor:"pointer", fontFamily:uff, whiteSpace:"nowrap" }}>
            {isMaxView?"⊡ Restore":"⛶ Max View"}
          </button>
          {/* Properties */}
          {propsSupported && (
            <div style={{ position:"relative" }}>
              <button onClick={()=>setShowPanel(p=>!p)}
                style={{ padding:"4px 12px", border:`1px solid ${showPanel?A.a:M.div}`, borderRadius:5, background:showPanel?A.al:"transparent", color:showPanel?A.a:M.tB, fontSize:10, fontWeight:showPanel?800:600, cursor:"pointer", fontFamily:uff, display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontSize:12 }}>⚙</span> Properties
                {(displayOpts.thumbnail||displayOpts.density!=="summary") && (
                  <span style={{ width:6, height:6, borderRadius:3, background:A.a, flexShrink:0 }} />
                )}
              </button>
              {showPanel && <LvPropertiesPanel displayOpts={displayOpts} setDisplayOpts={setDisplayOpts} onClose={()=>setShowPanel(false)} M={M} A={A} uff={uff} />}
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 2: Views Bar — bg #ffffff ALWAYS ══ */}
      <div style={{ padding:"5px 12px", display:"flex", gap:5, alignItems:"center", borderBottom:`1px solid ${M.div}`, background:"#ffffff", flexShrink:0, flexWrap:"nowrap", overflowX:"auto" }}>
        <span style={{ fontSize:8.5, fontWeight:900, color:M.tD, textTransform:"uppercase", letterSpacing:0.8, fontFamily:uff, flexShrink:0, marginRight:2 }}>VIEWS:</span>
        {layoutViews.map(v => {
          const isActive  = v.id === activeViewId;
          const isDirty   = isActive && isViewDirty;
          const isDefault = !!v.locked;
          const CC_RED    = "#CC0000";
          const CC_PUR    = "#7C3AED";
          const borderStyle = isDefault
            ? `1.5px solid ${isActive?CC_RED:"#CC000055"}`
            : isActive ? `1.5px solid ${CC_PUR}` : `1.5px dashed #c4b5fd`;
          const pillBg = isActive ? (isDefault?"#fff0f0":"#f5f3ff") : "transparent";
          return (
            <div key={v.id} style={{ display:"flex", alignItems:"center", gap:0, flexShrink:0 }}>
              <button onClick={()=>switchToView(v.id)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", border:borderStyle, borderRadius:6, background:pillBg, color:isActive?(isDefault?CC_RED:CC_PUR):M.tB, fontSize:10, fontWeight:isActive?900:600, cursor:"pointer", fontFamily:uff, whiteSpace:"nowrap" }}>
                <span>{v.icon}</span>
                <span>{v.name}</span>
                {isDefault && <span style={{ fontSize:7, fontWeight:900, padding:"1px 5px", borderRadius:4, background:"#f3f4f6", color:"#6b7280", letterSpacing:0.3 }}>LOCKED</span>}
                {isDirty   && <span style={{ fontSize:7, fontWeight:900, padding:"1px 5px", borderRadius:4, background:"#fef3c7", color:"#92400e", letterSpacing:0.3 }}>MODIFIED</span>}
              </button>
              {!isDefault && isActive && isDirty && (
                <button onClick={saveCurrentToView}
                  style={{ padding:"3px 8px", border:`1px solid ${CC_PUR}`, borderRadius:"0 5px 5px 0", background:"#f5f3ff", color:CC_PUR, fontSize:9, fontWeight:800, cursor:"pointer", fontFamily:uff, whiteSpace:"nowrap", marginLeft:1 }}>
                  💾 Update View
                </button>
              )}
              {!isDefault && (
                <button onClick={()=>deleteView(v.id)} title="Delete view"
                  style={{ width:14, height:14, borderRadius:3, border:"none", background:"transparent", color:M.tD, cursor:"pointer", fontSize:10, lineHeight:"14px", textAlign:"center", marginLeft:1 }}>×</button>
              )}
            </div>
          );
        })}
        {/* + New View — purple dashed */}
        <button onClick={()=>setShowSaveModal(true)}
          style={{ padding:"3px 10px", border:"1.5px dashed #c4b5fd", borderRadius:6, background:"#fdf4ff", color:"#7C3AED", fontSize:9.5, fontWeight:700, cursor:"pointer", fontFamily:uff, flexShrink:0, whiteSpace:"nowrap" }}>
          ＋ New View
        </button>
      </div>

      {/* ══ ROW 3: Unified Toolbar — ONE row ══ */}
      <div style={{ padding:"5px 14px", borderBottom:`1px solid ${M.div}`, background:M.hi, flexShrink:0 }}>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
          {/* Search */}
          <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
            <span style={{ position:"absolute", left:7, fontSize:10, color:M.tD }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
              style={{ border:`1px solid ${search?A.a:M.div}`, borderRadius:5, background:M.inBg, color:M.tA, fontSize:10, padding:"3px 8px 3px 22px", outline:"none", width:150, fontFamily:uff }} />
            {search && <button onClick={()=>setSearch("")} style={{ position:"absolute", right:5, border:"none", background:"none", cursor:"pointer", color:M.tD, fontSize:11 }}>×</button>}
          </div>
          {/* Filter */}
          <button onClick={()=>setShowFilters(v=>!v)}
            style={{ padding:"3px 10px", border:`1px solid ${showFilters||filters.filter(f=>f.value!=="").length>0?A.a:M.div}`, borderRadius:5, background:showFilters||filters.filter(f=>f.value!=="").length>0?A.al:"transparent", color:showFilters||filters.filter(f=>f.value!=="").length>0?A.a:M.tB, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:uff, display:"flex", alignItems:"center", gap:4 }}>
            ⊞ Filter {filters.filter(f=>f.value!=="").length>0 && <span style={{ background:A.a, color:"#fff", borderRadius:8, padding:"0 5px", fontSize:8 }}>{filters.filter(f=>f.value!=="").length}</span>}
          </button>
          {/* Sort */}
          <button onClick={()=>setShowSorts(v=>!v)}
            style={{ padding:"3px 10px", border:`1px solid ${showSorts||sorts.some(s=>s.mode!=="a_z")?"#7C3AED":M.div}`, borderRadius:5, background:showSorts||sorts.some(s=>s.mode!=="a_z")?"#ede9fe":"transparent", color:showSorts||sorts.some(s=>s.mode!=="a_z")?"#6d28d9":M.tB, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:uff }}>
            ↕ Sort
          </button>
          {/* Reset */}
          <button onClick={()=>{ setFilters([]); setSorts([{id:1,field:LV_SCHEMA[0]?.key||"code",mode:"a_z",value:""}]); setSearch(""); setShowFilters(false); setShowSorts(false); }}
            style={{ padding:"3px 9px", border:`1px solid ${M.div}`, borderRadius:5, background:"transparent", color:M.tC, fontSize:9.5, cursor:"pointer", fontFamily:uff }}>
            ✕ Reset
          </button>
          {/* Divider + Group By (hidden in Cards) */}
          {layoutTab !== "cards" && <>
            <div style={{ width:1, height:16, background:M.div, flexShrink:0 }} />
            <span style={{ fontSize:9, fontWeight:900, color:M.tD, textTransform:"uppercase", letterSpacing:0.5, fontFamily:uff, flexShrink:0 }}>⊞ Group By</span>
            <select value={groupByL1} onChange={e=>setGroupByL1(e.target.value)}
              style={{ fontSize:10, border:`1px solid ${M.div}`, borderRadius:5, padding:"3px 7px", background:M.inBg, color:M.tA, fontFamily:uff, cursor:"pointer", outline:"none" }}>
              {LV_GROUPABLE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <span style={{ color:M.tD, fontSize:11 }}>›</span>
            <select value={groupByL2} onChange={e=>setGroupByL2(e.target.value)}
              style={{ fontSize:10, border:`1px solid ${M.div}`, borderRadius:5, padding:"3px 7px", background:M.inBg, color:M.tA, fontFamily:uff, cursor:"pointer", outline:"none" }}>
              {LV_GROUPABLE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            {LV_PRESETS.length > 0 && <>
              <div style={{ width:1, height:14, background:M.div }} />
              {LV_PRESETS.map(p => {
                const active = p.l1===groupByL1 && p.l2===groupByL2;
                return (
                  <button key={p.label} onClick={()=>{ setGroupByL1(p.l1); setGroupByL2(p.l2); }}
                    style={{ padding:"2px 8px", border:`1px solid ${active?A.a:M.div}`, borderRadius:4, background:active?A.al:"transparent", color:active?A.a:M.tC, fontSize:9, fontWeight:active?800:600, cursor:"pointer", fontFamily:uff, whiteSpace:"nowrap" }}>
                    {p.label}
                  </button>
                );
              })}
            </>}
          </>}
          {/* Count */}
          <span style={{ fontSize:9, color:M.tD, fontFamily:uff, marginLeft:"auto" }}>
            {orgHierarchy.length} groups · {processedData.length} records
          </span>
        </div>
        {/* Expandable filter rows */}
        {showFilters && (
          <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:4 }}>
            {filters.map(fil => (
              <div key={fil.id} style={{ display:"flex", gap:4, alignItems:"center" }}>
                <select value={fil.field} onChange={e=>setFilters(p=>p.map(f=>f.id===fil.id?{...f,field:e.target.value,value:""}:f))}
                  style={{ fontSize:10, border:`1px solid ${M.div}`, borderRadius:4, padding:"2px 6px", background:M.inBg, color:M.tA, fontFamily:uff, outline:"none" }}>
                  {LV_SCHEMA.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
                <select value={fil.op} onChange={e=>setFilters(p=>p.map(f=>f.id===fil.id?{...f,op:e.target.value}:f))}
                  style={{ fontSize:10, border:`1px solid ${M.div}`, borderRadius:4, padding:"2px 6px", background:M.inBg, color:M.tA, fontFamily:uff, outline:"none" }}>
                  {LV_FILTER_OPS.cat.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <input value={fil.value} onChange={e=>setFilters(p=>p.map(f=>f.id===fil.id?{...f,value:e.target.value}:f))}
                  style={{ flex:1, fontSize:10, border:`1px solid ${M.div}`, borderRadius:4, padding:"2px 8px", background:M.inBg, color:M.tA, fontFamily:uff, outline:"none" }} placeholder="value…" />
                <button onClick={()=>setFilters(p=>p.filter(f=>f.id!==fil.id))} style={{ border:"none", background:"transparent", color:M.tD, cursor:"pointer", fontSize:13 }}>×</button>
              </div>
            ))}
            <button onClick={()=>setFilters(p=>[...p,{id:Date.now(),field:LV_SCHEMA[0]?.key||"code",op:"contains",value:""}])}
              style={{ alignSelf:"flex-start", padding:"2px 9px", border:`1px dashed ${A.a}`, borderRadius:4, background:A.al, color:A.a, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:uff }}>
              + Add Filter
            </button>
          </div>
        )}
        {/* Expandable sort rows */}
        {showSorts && (
          <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:4 }}>
            {sorts.map(s => (
              <div key={s.id} style={{ display:"flex", gap:4, alignItems:"center" }}>
                <select value={s.field} onChange={e=>setSorts(p=>p.map(x=>x.id===s.id?{...x,field:e.target.value}:x))}
                  style={{ fontSize:10, border:`1px solid ${M.div}`, borderRadius:4, padding:"2px 6px", background:M.inBg, color:M.tA, fontFamily:uff, outline:"none" }}>
                  {LV_SCHEMA.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
                <select value={s.mode} onChange={e=>setSorts(p=>p.map(x=>x.id===s.id?{...x,mode:e.target.value}:x))}
                  style={{ fontSize:10, border:`1px solid ${M.div}`, borderRadius:4, padding:"2px 6px", background:M.inBg, color:M.tA, fontFamily:uff, outline:"none" }}>
                  {LV_SORT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {sorts.length > 1 && <button onClick={()=>setSorts(p=>p.filter(x=>x.id!==s.id))} style={{ border:"none", background:"transparent", color:M.tD, cursor:"pointer", fontSize:13 }}>×</button>}
              </div>
            ))}
            <button onClick={()=>setSorts(p=>[...p,{id:Date.now(),field:LV_SCHEMA[0]?.key||"code",mode:"a_z",value:""}])}
              style={{ alignSelf:"flex-start", padding:"2px 9px", border:`1px dashed #7C3AED`, borderRadius:4, background:"#f5f3ff", color:"#7C3AED", fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:uff }}>
              + Add Sort
            </button>
          </div>
        )}
      </div>

      {/* ══ ROW 4: Content Area ══ */}
      {/* TODO: Replace this placeholder with module-specific layout views */}
      {/* Reference: ArticleMasterTab.jsx for Classic/Hierarchy/Column/Cards/Matrix implementations */}
      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        {processedData.length === 0
          ? <div style={{ textAlign:"center", padding:40, color:M.tD, fontFamily:uff, fontSize:12 }}>No records match the current filters</div>
          : orgHierarchy.map(grp => (
              <div key={grp.label} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:M.thd, borderRadius:6, marginBottom:8, borderLeft:`3px solid ${grp.color}` }}>
                  <span>{grp.icon}</span>
                  <span style={{ fontSize:11, fontWeight:900, color:grp.color, fontFamily:uff }}>{grp.label}</span>
                  <span style={{ fontSize:9, color:"#fff", background:grp.color, borderRadius:10, padding:"1px 8px", fontWeight:900 }}>{Object.values(grp.l2s).flat().length}</span>
                </div>
                {/* Implement Classic/Hierarchy/Column/Cards/Matrix rendering here */}
              </div>
            ))
        }
      </div>

      {/* Detail Modal */}
      {selectedRec && (() => {
        const idx = processedData.findIndex(r => r === selectedRec);
        return (
          <LayoutViewDetailModal
            record={selectedRec}
            onClose={()=>setSelectedRec(null)}
            onPrev={()=>setSelectedRec(processedData[Math.max(0,idx-1)])}
            onNext={()=>setSelectedRec(processedData[Math.min(processedData.length-1,idx+1)])}
            recIndex={idx}
            totalRecs={processedData.length}
            onEdit={canEdit&&onEditRecord?r=>{onEditRecord(r);setSelectedRec(null);}:null}
            canEdit={canEdit}
            M={M} A={A} uff={uff} dff={dff} fz={fz}
          />
        );
      })()}

      {/* Save View Modal */}
      {showSaveModal && <LvSaveViewModal onSave={addNewView} onClose={()=>setShowSaveModal(false)} M={M} A={A} uff={uff} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  [TODO-MODULE]  MODULE APP WRAPPER
//  This is the top-level component for your module.
//  Wire it to your parent App or render standalone.
// ═══════════════════════════════════════════════════════════════════
export default function ModuleApp() {
  // ── Theme & density ──
  const [modeKey,  setModeKey]  = useState("light");
  const [accKey,   setAccKey]   = useState("orange");
  const [density,  setDensity]  = useState("comfortable");
  const [fzKey,    setFzKey]    = useState("medium");
  const M   = MODES[modeKey];
  const A   = ACC[accKey];
  const fz  = {small:11, medium:13, large:15}[fzKey];
  const pyV = {compact:4, comfortable:7, spacious:11}[density];

  // ── Tab state ──
  const [tab, setTab] = useState("records"); // "records" | "entry" | "bulk" | "specs"

  // ── Data Entry form state ──
  const [formData, setFormData] = useState({});
  const [errors,   setErrors]   = useState({});
  const [dirty,    setDirty]    = useState(false);
  const [guardModal, setGuardModal] = useState(null);

  // ── Data Entry views ──
  const [views,   setViews]   = useState(() => mkModuleViews(MODULE_FIELDS));
  const [activeV, setActiveV] = useState(null);

  // ── Records view persistence ──
  const [recViewState, setRecViewState] = useState(null);
  const [recTpls,      setRecTpls]      = useState([]);

  // ── Bulk Entry state ──
  const [bulkRows,      setBulkRows]      = useState(() => Array.from({length:3},(_,i) => EMPTY_ROW(MODULE_FIELDS, i+1)));
  const [bulkViewState, setBulkViewState] = useState(null);
  const [bulkTpls,      setBulkTpls]      = useState([]);

  // ── Sidebar resize ──
  const { w:sbW, onMouseDown:onSbDrag } = useDrag(220, 160, 320);

  // ── Guard: intercept navigation when form is dirty ──
  const bulkDirty = bulkRows.some(r => r.__dirty || r.__new);
  const tryTab = newTab => {
    if (dirty && newTab !== "entry") setGuardModal({action:"tab", payload:newTab, type:"entry"});
    else if (tab==="bulk" && bulkDirty && newTab !== "bulk") setGuardModal({action:"tab", payload:newTab, type:"bulk"});
    else setTab(newTab);
  };
  const guardDiscard = () => {
    const g = guardModal; setGuardModal(null);
    if (g.type==="entry") { setFormData({}); setErrors({}); setDirty(false); }
    if (g.type==="bulk")  { setBulkRows(prev=>prev.filter(r=>!r.__dirty&&!r.__new)); }
    setTab(g.payload);
  };

  // ── Form handlers ──
  const handleField = (col, val) => {
    setDirty(true);
    setErrors(p => { const e={...p}; delete e[col]; return e; });
    setFormData(prev => computeAutos(col, val, prev));
  };
  const validate = () => {
    const errs = {};
    MODULE_FIELDS.filter(f => f.req && !f.auto).forEach(f => {
      if (!formData[f.col]?.trim()) errs[f.col] = `${f.h} is required`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSave = () => {
    if (!validate()) return;
    // ─── Call GAS here: google.script.run.saveRecord(formData) ───
    console.log("Saving to GAS:", formData);
    setFormData({}); setErrors({}); setDirty(false);
  };
  const handleClear = () => { setFormData({}); setErrors({}); setDirty(false); };

  // ── Records template handlers ──
  const onSaveRecTpl = tpl => setRecTpls(p => { const ex=p.find(t=>t.name===tpl.name); return ex ? p.map(t=>t.name===tpl.name?tpl:t) : [...p,tpl]; });
  const onDeleteRecTpl = name => setRecTpls(p => p.filter(t=>t.name!==name));

  // ── Bulk template handlers ──
  const onSaveBulkTpl = tpl => setBulkTpls(p => { const ex=p.find(t=>t.name===tpl.name); return ex ? p.map(t=>t.name===tpl.name?tpl:t) : [...p,tpl]; });
  const onDeleteBulkTpl = name => setBulkTpls(p => p.filter(t=>t.name!==name));

  const TABS = [
    {k:"records", l:"📋 Records"},
    {k:"entry",   l:"✏ Entry"},
    {k:"bulk",    l:"⊞ Bulk Entry"},
    {k:"specs",   l:"⚙ Field Specs"},
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:M.bg,color:M.tA,fontFamily:"'Nunito Sans',system-ui,sans-serif",fontSize:fz}}>
      {/* ── SIDEBAR ── */}
      <div style={{width:sbW,flexShrink:0,background:M.sbBg,borderRight:"1px solid "+M.sbBd,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Module header */}
        <div style={{padding:"14px 14px 10px",borderBottom:"1px solid "+M.sbBd}}>
          {/* [TODO-MODULE] Change icon, title, subtitle */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:32,height:32,borderRadius:8,background:A.a,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>📦</div>
            <div>
              <div style={{fontSize:13,fontWeight:900,color:M.tA}}>Module Name</div>
              <div style={{fontSize:9,color:M.tC}}>CC ERP · {MODULE_FIELDS.length} fields</div>
            </div>
          </div>
        </div>
        {/* Nav tabs in sidebar */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>tryTab(t.k)} style={{display:"block",width:"100%",padding:"8px 14px",border:"none",background:tab===t.k?A.al:"transparent",color:tab===t.k?A.a:M.tB,fontSize:10,fontWeight:tab===t.k?900:700,cursor:"pointer",textAlign:"left",borderLeft:"3px solid "+(tab===t.k?A.a:"transparent")}}>
              {t.l}
            </button>
          ))}
        </div>
        {/* Theme controls */}
        <div style={{padding:"10px 14px",borderTop:"1px solid "+M.sbBd,background:M.lo}}>
          <div style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>Theme</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
            {Object.keys(MODES).map(k=><button key={k} onClick={()=>setModeKey(k)} title={MODES[k].lbl} style={{padding:"3px 7px",borderRadius:4,border:"1.5px solid "+(modeKey===k?A.a:M.inBd),background:modeKey===k?A.al:M.inBg,color:modeKey===k?A.a:M.tB,fontSize:8,fontWeight:modeKey===k?900:700,cursor:"pointer"}}>{MODES[k].lbl.split(" ")[0]}</button>)}
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {Object.keys(ACC).map(k=><button key={k} onClick={()=>setAccKey(k)} title={ACC[k].lbl} style={{width:18,height:18,borderRadius:4,background:ACC[k].a,border:accKey===k?"3px solid "+M.tA:"3px solid transparent",cursor:"pointer"}}/>)}
          </div>
        </div>
      </div>

      {/* ── Resize handle ── */}
      <div onMouseDown={onSbDrag} style={{width:4,cursor:"col-resize",background:"transparent",flexShrink:0}} />

      {/* ── MAIN CONTENT ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Tab header bar */}
        <div style={{padding:"0 12px",borderBottom:"2px solid "+CC_RED,display:"flex",alignItems:"center",gap:2,background:M.sh,flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>tryTab(t.k)} style={{padding:"10px 16px",border:"none",background:"transparent",color:tab===t.k?CC_RED:M.tC,fontSize:10,fontWeight:tab===t.k?900:700,cursor:"pointer",borderBottom:"2px solid "+(tab===t.k?CC_RED:"transparent"),marginBottom:-2}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {tab==="records" && (
            <RecordsTab
              allFields={MODULE_FIELDS}
              mockRecords={MODULE_MOCK_RECORDS}
              M={M} A={A} fz={fz} pyV={pyV}
              viewState={recViewState} setViewState={setRecViewState}
              templates={recTpls} onSaveTemplate={onSaveRecTpl} onDeleteTemplate={onDeleteRecTpl}
            />
          )}
          {tab==="entry" && (
            <DataEntryTab
              allFields={MODULE_FIELDS}
              sections={MODULE_SECTIONS}
              views={views}
              activeViewId={activeV}
              onActivateView={setActiveV}
              onSaveView={v=>setViews(p=>[...p,v])}
              onDeleteView={id=>setViews(p=>p.filter(v=>v.id!==id))}
              formData={formData}
              onChange={handleField}
              errors={errors}
              M={M} A={A} fz={fz} pyV={pyV}
              onSave={handleSave}
              onClear={handleClear}
            />
          )}
          {tab==="bulk" && (
            <BulkEntryTab
              allFields={MODULE_FIELDS}
              M={M} A={A} fz={fz} pyV={pyV}
              rows={bulkRows} setRows={setBulkRows}
              viewState={bulkViewState} setViewState={setBulkViewState}
              templates={bulkTpls} onSaveTemplate={onSaveBulkTpl} onDeleteTemplate={onDeleteBulkTpl}
            />
          )}
          {tab==="specs" && (
            <FieldSpecsTab allFields={MODULE_FIELDS} M={M} A={A} fz={fz} pyV={pyV} />
          )}
        </div>
      </div>

      {/* ── Unsaved changes guard ── */}
      {guardModal && (() => {
        const isBulk = guardModal.type==="bulk";
        const dirtyBulkCount = bulkRows.filter(r=>r.__dirty||r.__new).length;
        return(
          <><div onClick={()=>setGuardModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",zIndex:1200}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:460,background:M.hi,border:"1px solid #fecaca",borderRadius:10,zIndex:1201,boxShadow:M.shadow,overflow:"hidden"}}>
            <div style={{background:"#dc2626",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>⚠️</span><div><div style={{color:"#fff",fontSize:13,fontWeight:900}}>Unsaved Changes</div>{isBulk&&<div style={{color:"rgba(255,255,255,.8)",fontSize:10}}>{dirtyBulkCount} row(s) with unsaved data in Bulk Entry</div>}</div></div>
            <div style={{padding:"18px 20px"}}>
              <div style={{fontSize:13,color:M.tA,fontWeight:700,marginBottom:14}}>{guardModal.action==="tab"?"Switching tabs will discard all unsaved data.":"Switching masters will discard all unsaved data."}</div>
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,padding:"8px 12px",marginBottom:18}}><div style={{fontSize:10,color:"#991b1b",fontWeight:700}}>{isBulk?"💡 Fill mandatory fields (⚠) and click ✓ Save Changes first.":"💡 Click ✓ Save to Sheet first to commit your record."}</div></div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setGuardModal(null)} style={{padding:"8px 18px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:11,fontWeight:800,cursor:"pointer"}}>← Stay & Keep Editing</button>
                <button onClick={guardDiscard} style={{padding:"8px 20px",border:"none",borderRadius:5,background:"#dc2626",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>🗑 Discard & Continue</button>
              </div>
            </div>
          </div></>
        );
      })()}
    </div>
  );
}
