/**
 * CC ERP — SchemaEditor.jsx
 * File: src/components/schema/SchemaEditor.jsx
 *
 * Combined Schema Editor — 4 tabs, one shared state.
 *
 * Tab 1: Edit Fields    — drag reorder, inline edit, icon type change + safety
 * Tab 2: Field Types    — 20-type catalogue + assign renderType to any field
 * Tab 3: Review Changes — staged diff, risk badges, discard/apply to Sheets
 * Tab 4: Form Preview   — live form reflecting ALL pending changes in real-time
 *
 * Replaces: SchemaEditorV2.jsx + FieldTypeCatalogue.jsx (use only this file)
 */

import { useState, useCallback } from "react";
import { SCHEMA_MAP } from "../../constants/masterSchemas";
import { FIELD_META } from "../../constants/masterFieldMeta";
import api from "../../services/api";

// ─── THEME TOKENS — CC ERP UI_SPEC_V6 ────────────────────────────────────────
const THEMES = {
  midnight: {
    bg:"#0d1117", sh:"#161b22", shBd:"#21262d",
    hi:"#1c2128", mid:"#161b22", lo:"#0d1117",
    hov:"#21262d", inBg:"#0d1117", inBd:"#30363d",
    div:"#21262d", tA:"#e6edf3", tB:"#8b949e",
    tC:"#6e7681", tD:"#484f58", shadow:"0 4px 24px rgba(0,0,0,.6)"
  },
  light: {
    bg:"#f0f2f5", sh:"#ffffff", shBd:"#e2e4e8",
    hi:"#ffffff", mid:"#f7f8fa", lo:"#f0f2f5",
    hov:"#eef1f8", inBg:"#ffffff", inBd:"#d1d5db",
    div:"#e5e7eb", tA:"#111827", tB:"#374151",
    tC:"#6b7280", tD:"#9ca3af", shadow:"0 4px 20px rgba(0,0,0,.09)"
  }
};
const ACC_DEFAULT = { a:"#E8690A", al:"rgba(232,105,10,.10)", ad:"#b85208", tx:"#fff" };

// ─── Adapter: map parent MODES tokens → internal short tokens ────────────────
function toLocalM(pm) {
  if (!pm) return null;
  return {
    bg:pm.bg, sh:pm.shellBg, shBd:pm.shellBd,
    hi:pm.surfHigh, mid:pm.surfMid, lo:pm.surfLow,
    hov:pm.hoverBg, inBg:pm.inputBg, inBd:pm.inputBd,
    div:pm.divider, tA:pm.textA, tB:pm.textB,
    tC:pm.textC, tD:pm.textD, shadow:pm.shadow
  };
}
const MONO = { fontFamily:"'IBM Plex Mono',monospace" };
const SANS = { fontFamily:"'Nunito Sans',sans-serif" };

// ─── ICON TYPES — LOCKED (GAS behaviour) ─────────────────────────────────────
const ICON_TYPES = {
  "🔑":{ id:"PRIMARY_KEY",  label:"Primary Key",  color:"#f59e0b", gasOwned:false,
         desc:"Unique identifier. Manual or auto per master." },
  "#": { id:"AUTO_CODE",    label:"Auto Code",    color:"#8b5cf6", gasOwned:true,
         desc:"GAS generates on save. User cannot edit." },
  "⚠": { id:"MANDATORY",   label:"Required",     color:"#ef4444", gasOwned:false,
         desc:"Must fill. Blocks save if blank." },
  "→": { id:"FK",           label:"FK Dropdown",  color:"#3b82f6", gasOwned:false,
         desc:"Links to another master via MASTER_RELATIONS." },
  "←": { id:"AUTO_DISPLAY", label:"Auto Display", color:"#10b981", gasOwned:true,
         desc:"GAS fills from adjacent FK. Read-only." },
  "⟷": { id:"SYNC",         label:"Multi-select", color:"#ec4899", gasOwned:false,
         desc:"Chip panel. Two-way sync with FK sheet." },
  "∑": { id:"CALCULATED",   label:"Calculated",   color:"#06b6d4", gasOwned:true,
         desc:"GAS computes. Never manually editable." },
  "":  { id:"TEXT",          label:"Plain Text",   color:"#64748b", gasOwned:false,
         desc:"Simple text. No special GAS behaviour." }
};

// ─── RENDER TYPES — React widget catalogue (20 types, 8 groups) ──────────────
const RT_GROUPS = ["Text","Number","Date & Time","Contact","Link","Boolean","Selection","Visual"];
const RENDER_TYPES = {
  text:      { g:"Text",        ico:"T",   c:"#64748b", label:"Plain Text",        ex:"Any text",            stored:"string" },
  textarea:  { g:"Text",        ico:"¶",   c:"#64748b", label:"Long Text / Notes", ex:"Multi-line notes",    stored:"string" },
  number:    { g:"Number",      ico:"№",   c:"#06b6d4", label:"Number",            ex:"12, 3.5, 100",        stored:"number" },
  currency:  { g:"Number",      ico:"₹",   c:"#10b981", label:"Currency (₹)",     ex:"₹ 4,500.00",          stored:"number" },
  percentage:{ g:"Number",      ico:"%",   c:"#8b5cf6", label:"Percentage %",      ex:"18%, 5%",             stored:"number" },
  date:      { g:"Date & Time", ico:"📅",  c:"#3b82f6", label:"Date",             ex:"2026-03-06",           stored:"ISO date" },
  datetime:  { g:"Date & Time", ico:"🕐",  c:"#3b82f6", label:"Date + Time",      ex:"2026-03-06 14:30",    stored:"ISO datetime" },
  email:     { g:"Contact",     ico:"@",   c:"#ec4899", label:"Email Address",     ex:"vendor@abc.com",      stored:"string",  val:true },
  phone:     { g:"Contact",     ico:"📞",  c:"#ec4899", label:"Phone / Mobile",    ex:"9876543210",          stored:"10-digit",val:true },
  gstin:     { g:"Contact",     ico:"GST", c:"#10b981", label:"GSTIN",            ex:"22AAAAA0000A1Z5",      stored:"15-char", val:true },
  url:       { g:"Link",        ico:"🔗",  c:"#3b82f6", label:"Web URL",           ex:"https://supplier.com",stored:"URL" },
  image_url: { g:"Link",        ico:"🖼",  c:"#f59e0b", label:"Image URL",         ex:"Product photo",       stored:"image URL" },
  doc_link:  { g:"Link",        ico:"📄",  c:"#3b82f6", label:"Document Link",     ex:"Test report, PDF",    stored:"Drive/URL" },
  drive_file:{ g:"Link",        ico:"🗂",  c:"#10b981", label:"Google Drive File", ex:"Spec sheet, PO",      stored:"Drive file ID" },
  boolean:   { g:"Boolean",     ico:"✓",   c:"#10b981", label:"Yes / No Toggle",   ex:"Is Active",           stored:"Yes/No" },
  radio:     { g:"Selection",   ico:"◎",   c:"#8b5cf6", label:"Single Choice",     ex:"Season: SS/AW/FW",    stored:"one value" },
  color_hex: { g:"Visual",      ico:"🎨",  c:"#f97316", label:"Color Hex Swatch",  ex:"#FF6B35",             stored:"#RRGGBB" },
  rating:    { g:"Visual",      ico:"⭐",  c:"#f59e0b", label:"Star Rating (1–5)", ex:"Quality score",       stored:"1-5" },
};

// ─── CHANGE SAFETY MATRIX ────────────────────────────────────────────────────
const CHANGE_SAFETY = {
  "MANDATORY→FK":         { ok:true,  risk:"medium", warn:"Existing text may not match FK codes." },
  "MANDATORY→SYNC":       { ok:true,  risk:"medium", warn:"Existing values become comma-separated." },
  "MANDATORY→TEXT":       { ok:true,  risk:"low",    warn:"Removes mandatory validation. Data safe." },
  "TEXT→MANDATORY":       { ok:true,  risk:"low",    warn:"Adds mandatory validation. Empty rows show errors." },
  "TEXT→FK":              { ok:true,  risk:"medium", warn:"Existing values must match FK codes." },
  "FK→MANDATORY":         { ok:true,  risk:"medium", warn:"Removes FK dropdown. Codes become plain text." },
  "PRIMARY_KEY→MANDATORY":{ ok:true,  risk:"high",   warn:"PK removed — uniqueness no longer enforced." },
  "AUTO_CODE→MANDATORY":  { ok:false, risk:"critical",warn:"Cannot convert auto-code. Delete and recreate." },
  "AUTO_DISPLAY→FK":      { ok:false, risk:"critical",warn:"GAS-managed column. Cannot change type." },
  "CALCULATED→MANDATORY": { ok:false, risk:"critical",warn:"GAS-managed column. Cannot change type." },
};
const RISK = {
  low:     { c:"#10b981", bg:"#10b98115", label:"Safe" },
  medium:  { c:"#f59e0b", bg:"#f59e0b15", label:"Review" },
  high:    { c:"#f97316", bg:"#f9731615", label:"High Risk" },
  critical:{ c:"#ef4444", bg:"#ef444415", label:"Blocked" },
};
function safety(fromIcon, toIcon) {
  const f = ICON_TYPES[fromIcon]?.id||"TEXT", t = ICON_TYPES[toIcon]?.id||"TEXT";
  if (f===t) return null;
  return CHANGE_SAFETY[`${f}→${t}`]||{ ok:true, risk:"low", warn:"Verify in test sheet first." };
}

// ─── REAL DATA — from masterSchemas + masterFieldMeta ─────────────────────────
const SHEETS = Object.keys(SCHEMA_MAP);
const FK_SHEETS = SHEETS; // any sheet can be an FK target

// Map fieldType from FIELD_META → internal icon
const FT_TO_ICON = {
  manual:"🔑", auto:"←", fk:"→", calc:"∑", multifk:"⟷",
};
// Map schema type → internal render type
const TYPE_TO_RT = {
  text:"text", textarea:"textarea", number:"number", date:"date",
  select:"text", url:"image_url",
};
// fieldType → render type overrides
const FT_TO_RT = {
  currency:"currency", url:"image_url", auto:"text", calc:"percentage",
  fk:"text", multifk:"text", dropdown:"text", manual:"text",
};

function buildFields(sheetKey) {
  const schema = SCHEMA_MAP[sheetKey] || [];
  const meta = FIELD_META[sheetKey]?.fields || {};
  return schema.map((f, i) => {
    const fm = meta[f.key] || {};
    const ico = fm.ico || (f.auto ? "←" : f.required ? "⚠" : "");
    const icon = FT_TO_ICON[fm.fieldType] || ico || "";
    const rt = FT_TO_RT[fm.fieldType] || TYPE_TO_RT[f.type] || "text";
    return {
      id: i + 1,
      key: f.key,
      icon,
      rt,
      label: f.header || f.label,
      hint: fm.hint || "",
      fk: fm.fk || "",
      mand: !!f.required,
      on: !f.hidden,
    };
  });
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const IS   = (M,A,err,mand) => ({
  padding:"6px 10px", borderRadius:6, width:"100%", boxSizing:"border-box",
  border:`1px solid ${err?"#ef4444":mand?A.a+"55":M.inBd}`,
  background:M.inBg, color:M.tA, fontSize:12, outline:"none", ...SANS
});
const BTN  = (bg,col,bd) => ({
  padding:"6px 13px", borderRadius:6, border:bd||"none",
  background:bg, color:col, cursor:"pointer", fontSize:12, fontWeight:700, ...SANS
});
const LBL  = (M) => ({
  display:"block", fontSize:9, fontWeight:900, color:M.tC,
  marginBottom:3, letterSpacing:.7, textTransform:"uppercase", ...SANS
});
const AUTO = (M,A) => ({
  padding:"6px 10px", borderRadius:6, border:`1px solid ${A.a}33`,
  background:A.al, color:A.a, fontSize:12, display:"flex",
  alignItems:"center", justifyContent:"space-between", ...MONO
});
const CALC = (M) => ({
  padding:"6px 10px", borderRadius:6, border:"1px solid #06b6d433",
  background:"#06b6d411", color:"#06b6d4", fontSize:12, display:"flex",
  alignItems:"center", justifyContent:"space-between", ...MONO
});

function Pill({c, children, sm}) {
  return <span style={{ fontSize:sm?8:9, fontWeight:800, padding:sm?"1px 5px":"2px 7px",
    borderRadius:99, background:c+"20", color:c, letterSpacing:.4,
    whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:2 }}>{children}</span>;
}
function Toggle({on, set, disabled}) {
  return (
    <button onClick={()=>!disabled&&set(!on)} disabled={disabled}
      style={{ width:34, height:18, borderRadius:9, border:"none",
        background:on?"#10b981":"#475569", cursor:disabled?"not-allowed":"pointer",
        position:"relative", transition:"background .2s", opacity:disabled?.4:1, flexShrink:0 }}>
      <span style={{ position:"absolute", width:14, height:14, borderRadius:7,
        background:"#fff", top:2, left:on?18:2, transition:"left .2s" }}/>
    </button>
  );
}

// ─── PREVIEW WIDGET (used in Tab 2 cards + Tab 4 form) ───────────────────────
function PW({ field, M, A, bv, setBv, rv, setRv }) {
  const { icon, rt } = field;
  const GAS  = ["←","#","∑"].includes(icon);
  const FK   = icon === "→";
  const SYNC = icon === "⟷";
  if (GAS) return (
    <div style={icon==="∑"?CALC(M):AUTO(M,A)}>
      <span>{icon==="∑"?"0.00":icon==="#"?"Auto-generated":"— Auto —"}</span>
      <span style={{ fontSize:9, color:icon==="∑"?"#06b6d4aa":A.ad }}>🔒 GAS</span>
    </div>
  );
  if (FK) return (
    <select style={{ ...IS(M,A,false,field.mand), cursor:"pointer" }}>
      <option>Select {field.label}…</option>
      <option>Option A — CODE-001</option><option>Option B — CODE-002</option>
    </select>
  );
  if (SYNC) return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap", padding:"3px 0" }}>
      {["Tag A","Tag B"].map(t=>(
        <span key={t} style={{ padding:"2px 8px", borderRadius:99,
          background:A.al, color:A.a, fontSize:11, fontWeight:700 }}>✕ {t}</span>
      ))}
      <span style={{ padding:"2px 8px", borderRadius:99, fontSize:11,
        border:`1px dashed ${M.div}`, color:M.tC, cursor:"pointer" }}>+ Add</span>
    </div>
  );
  const i = IS(M,A,false,field.mand);
  switch(rt) {
    case "textarea":
      return <textarea rows={2} placeholder={field.hint} readOnly
        style={{ ...i, resize:"none", lineHeight:1.5 }}/>;
    case "number":
      return <input type="number" placeholder="0" readOnly
        style={{ ...i, textAlign:"right", ...MONO }}/>;
    case "currency":
      return <div style={{ display:"flex" }}>
        <span style={{ padding:"6px 10px", background:M.mid, border:`1px solid ${M.inBd}`,
          borderRight:"none", borderRadius:"6px 0 0 6px",
          color:"#10b981", fontWeight:800, fontSize:12, ...MONO }}>₹</span>
        <input type="number" placeholder="0.00" readOnly
          style={{ ...i, borderRadius:"0 6px 6px 0", textAlign:"right", ...MONO, flex:1 }}/>
      </div>;
    case "percentage":
      return <div style={{ display:"flex" }}>
        <input type="number" placeholder="0" readOnly
          style={{ ...i, borderRadius:"6px 0 0 6px", textAlign:"right", ...MONO, flex:1 }}/>
        <span style={{ padding:"6px 10px", background:M.mid, border:`1px solid ${M.inBd}`,
          borderLeft:"none", borderRadius:"0 6px 6px 0",
          color:"#8b5cf6", fontWeight:800, fontSize:12 }}>%</span>
      </div>;
    case "date":      return <input type="date" style={i}/>;
    case "datetime":  return <input type="datetime-local" style={i}/>;
    case "email":
      return <div style={{ display:"flex" }}>
        <span style={{ padding:"6px 10px", background:M.mid, border:`1px solid ${M.inBd}`,
          borderRight:"none", borderRadius:"6px 0 0 6px", color:"#ec4899" }}>@</span>
        <input type="email" placeholder="name@domain.com" readOnly
          style={{ ...i, borderRadius:"0 6px 6px 0", flex:1 }}/>
      </div>;
    case "phone":
      return <div style={{ display:"flex" }}>
        <span style={{ padding:"6px 10px", background:M.mid, border:`1px solid ${M.inBd}`,
          borderRight:"none", borderRadius:"6px 0 0 6px",
          color:"#ec4899", fontSize:10, ...MONO }}>+91</span>
        <input type="tel" placeholder="9876543210" maxLength={10} readOnly
          style={{ ...i, borderRadius:"0 6px 6px 0", flex:1, ...MONO, letterSpacing:1 }}/>
      </div>;
    case "gstin":
      return <div style={{ position:"relative" }}>
        <input type="text" placeholder="22AAAAA0000A1Z5" readOnly
          style={{ ...i, ...MONO, letterSpacing:1, textTransform:"uppercase", paddingRight:60 }}/>
        <span style={{ position:"absolute", right:8, top:"50%",
          transform:"translateY(-50%)", fontSize:9, color:"#10b981", fontWeight:800 }}>15 CHAR</span>
      </div>;
    case "url":
      return <div style={{ display:"flex", gap:5 }}>
        <input type="url" placeholder="https://…" readOnly style={{ ...i, flex:1 }}/>
        <button style={{ padding:"6px 9px", borderRadius:5,
          background:"#3b82f611", border:"1px solid #3b82f633",
          color:"#3b82f6", fontSize:11, cursor:"pointer" }}>↗</button>
      </div>;
    case "image_url":
      return <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ width:42, height:42, borderRadius:6, flexShrink:0,
          background:"linear-gradient(135deg,#f59e0b22,#f9731655)",
          border:"1px solid #f59e0b44", display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:18 }}>🖼</div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:3 }}>
          <input type="url" placeholder="https://…/image.jpg" readOnly style={i}/>
          <div style={{ display:"flex", gap:3 }}>
            {["📎 Paste URL","🔍 Preview"].map(a=>(
              <button key={a} style={{ flex:1, padding:"2px 0", borderRadius:4, fontSize:9,
                background:M.mid, border:`1px solid ${M.div}`,
                color:M.tC, cursor:"pointer" }}>{a}</button>
            ))}
          </div>
        </div>
      </div>;
    case "doc_link":
      return <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <div style={{ width:30, height:30, borderRadius:5, flexShrink:0,
            background:"#3b82f611", border:"1px solid #3b82f633",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📄</div>
          <input type="url" placeholder="https://drive.google.com/…" readOnly
            style={{ ...i, flex:1 }}/>
        </div>
        <div style={{ display:"flex", gap:3 }}>
          {["📎 Paste","📁 Drive","↗ Open"].map(a=>(
            <button key={a} style={{ flex:1, padding:"2px 0", borderRadius:4, fontSize:9,
              background:M.mid, border:`1px solid ${M.div}`,
              color:M.tC, cursor:"pointer" }}>{a}</button>
          ))}
        </div>
      </div>;
    case "drive_file":
      return <div style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 10px",
        borderRadius:6, border:`1px solid ${M.inBd}`, background:M.inBg, cursor:"pointer" }}>
        <span style={{ fontSize:18 }}>🗂</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, color:M.tD }}>No file attached</div>
          <div style={{ fontSize:10, color:M.tD }}>Click to browse Google Drive</div>
        </div>
        <span style={{ fontSize:11, color:"#10b981", fontWeight:700 }}>Browse →</span>
      </div>;
    case "boolean": {
      const id = field.id; const on = bv?.[id]||false;
      return <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <button onClick={()=>setBv(p=>({...p,[id]:!on}))}
          style={{ width:38, height:22, borderRadius:11, border:"none",
            background:on?"#10b981":M.div, cursor:"pointer", position:"relative",
            transition:"background .2s", flexShrink:0 }}>
          <span style={{ position:"absolute", width:18, height:18, borderRadius:9,
            background:"#fff", top:2, left:on?18:2, transition:"left .2s" }}/>
        </button>
        <span style={{ fontSize:12, fontWeight:700,
          color:on?"#10b981":M.tC }}>{on?"Yes":"No"}</span>
      </div>;
    }
    case "radio":
      return <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {["Option A","Option B","Option C"].map(o=>(
          <label key={o} style={{ display:"flex", alignItems:"center", gap:4,
            padding:"4px 9px", borderRadius:5, cursor:"pointer", fontSize:11,
            border:`1px solid ${M.inBd}`, background:M.inBg }}>
            <input type="radio" name={`r${field.id}`} style={{ accentColor:A.a }}/>{o}
          </label>
        ))}
      </div>;
    case "color_hex":
      return <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ width:32, height:32, borderRadius:5, flexShrink:0,
          background:"#E8690A", border:`1px solid ${M.inBd}` }}/>
        <input type="text" placeholder="#RRGGBB" readOnly
          style={{ ...i, ...MONO, letterSpacing:1, flex:1 }}/>
        <span style={{ fontSize:9, ...MONO, color:M.tD,
          background:M.mid, padding:"3px 6px", borderRadius:4,
          border:`1px solid ${M.div}` }}>#E8690A</span>
      </div>;
    case "rating": {
      const id = field.id; const s = rv?.[id]||0;
      return <div style={{ display:"flex", gap:1 }}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>setRv(p=>({...p,[id]:n}))}
            style={{ fontSize:22, background:"transparent", border:"none",
              cursor:"pointer", lineHeight:1, padding:"0 1px",
              color:n<=s?"#f59e0b":M.div }}>★</button>
        ))}
      </div>;
    }
    default:
      return <input type="text" placeholder={field.hint||"Enter value…"} style={i}/>;
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SchemaEditor({ themeM, accentA }={}) {
  const hosted = !!themeM;                            // true when embedded in SettingsPanel
  const [theme,  setTheme]  = useState("midnight");
  const [sheet,  setSheet]  = useState("article_master");
  const [fields, setFields] = useState(() => buildFields("article_master"));
  const [pend,   setPend]   = useState([]);          // staged changes
  const [tab,    setTab]    = useState("edit");       // edit|types|diff|preview
  const [toast,  setToast]  = useState(null);
  const [applied,setApplied]= useState(0);

  // Tab 1 state
  const [editId, setEditId] = useState(null);
  const [draft,  setDraft]  = useState({});
  const [modal,  setModal]  = useState(null);        // safety confirm modal
  const [dragId, setDragId] = useState(null);
  const [dragOv, setDragOv] = useState(null);
  const [addOpen,setAddOpen]= useState(false);
  const [newF,   setNewF]   = useState({ icon:"⚠", rt:"text", label:"", hint:"", fk:"", mand:false });

  // Tab 2 state
  const [rtGroup,setRtGroup]= useState("All");
  const [assignF,setAssignF]= useState(null);        // field.id being assigned

  // Tab 4 state
  const [bv, setBv] = useState({});   // boolean values
  const [rv, setRv] = useState({});   // rating values

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const M   = hosted ? toLocalM(themeM) : THEMES[theme];
  const ACC = hosted ? accentA : ACC_DEFAULT;

  // Rebuild fields when sheet changes
  const switchSheet = useCallback((key) => {
    setSheet(key);
    setFields(buildFields(key));
    setPend([]);
    setEditId(null); setDraft({}); setModal(null);
    setAddOpen(false); setAssignF(null);
  }, []);

  const showToast = useCallback((msg, c="#15803d") => {
    setToast({msg,c}); setTimeout(()=>setToast(null), 3000);
  }, []);

  // ── Stage a change (deduplicates same field+type) ───────────────────────────
  const stage = useCallback((fid, type, old, nw, lbl) => {
    setPend(p => [
      ...p.filter(x=>!(x.fid===fid&&x.type===type)),
      { id:`${fid}_${type}_${Date.now()}`, fid, type, old, nw, lbl }
    ]);
  }, []);

  // ── Apply all staged changes (local state only) ─────────────────────────────
  const applyLocal = useCallback(() => {
    setFields(prev => {
      let next = [...prev];
      pend.forEach(ch => {
        const i = next.findIndex(f=>f.id===ch.fid);
        if (i<0 && ch.type!=="add") return;
        if (ch.type==="icon")  next[i]={...next[i],icon:ch.nw};
        if (ch.type==="label") next[i]={...next[i],label:ch.nw};
        if (ch.type==="mand")  next[i]={...next[i],mand:ch.nw};
        if (ch.type==="fk")    next[i]={...next[i],fk:ch.nw};
        if (ch.type==="hint")  next[i]={...next[i],hint:ch.nw};
        if (ch.type==="on")    next[i]={...next[i],on:ch.nw};
        if (ch.type==="rt")    next[i]={...next[i],rt:ch.nw};
        if (ch.type==="add")   next.push({...ch.nw,id:ch.fid});
      });
      return next;
    });
    const n = pend.length;
    setApplied(c=>c+n);
    setPend([]);
    setTab("edit");
  }, [pend]);

  // ── Push changes to Google Sheets via GAS API ──────────────────────────────
  const applyToSheets = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Map staged changes: translate field labels for header matching
      const changes = pend.map(ch => {
        const field = fields.find(f => f.id === ch.fid);
        return {
          type: ch.type,
          fid: ch.fid,
          old: ch.old,
          nw: ch.nw,
          lbl: field?.label || ch.lbl || ''
        };
      });
      const result = await api.updateSchemaFields(sheet, changes);
      // Apply locally after successful API call
      applyLocal();
      setConfirmModal(false);
      const errMsg = result.errors?.length ? ` (${result.errors.length} warning${result.errors.length>1?'s':''})` : '';
      showToast(`✅ ${result.applied}/${result.total} changes saved to ${result.sheetName}${errMsg}`);
      if (result.errors?.length) {
        console.warn('Schema update warnings:', result.errors);
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to save to Google Sheets');
      showToast('❌ ' + (err.message || 'Failed to save'), '#ef4444');
    } finally {
      setSaving(false);
    }
  }, [pend, fields, sheet, applyLocal, showToast]);

  // ── Show confirmation before applying ──────────────────────────────────────
  const applyAll = useCallback(() => {
    setConfirmModal(true);
    setSaveError(null);
  }, []);

  // ── Commit inline field edit ─────────────────────────────────────────────────
  const commit = () => {
    const orig = fields.find(f=>f.id===draft.id);
    if (!orig) { setEditId(null); return; }
    if (orig.icon !== draft.icon) {
      const s = safety(orig.icon, draft.icon);
      if (s && !s.ok)  { setModal({s,orig,to:draft.icon}); return; }
      if (s && s.risk!=="low") {
        setModal({ s, orig, to:draft.icon, onOk:()=>{
          stage(draft.id,"icon",orig.icon,draft.icon,orig.label);
          done(); setModal(null);
        }});
        return;
      }
      if (s) stage(draft.id,"icon",orig.icon,draft.icon,orig.label);
    }
    if (orig.label!==draft.label) stage(draft.id,"label",orig.label,draft.label,orig.label);
    if (orig.mand !==draft.mand)  stage(draft.id,"mand", orig.mand, draft.mand, orig.label);
    if (orig.fk   !==draft.fk)    stage(draft.id,"fk",   orig.fk,   draft.fk,   orig.label);
    if (orig.hint !==draft.hint)  stage(draft.id,"hint", orig.hint, draft.hint, orig.label);
    if (orig.rt   !==draft.rt)    stage(draft.id,"rt",   orig.rt,   draft.rt,   orig.label);
    done();
  };
  const done = () => { setEditId(null); setDraft({}); };

  // ── Drag reorder ─────────────────────────────────────────────────────────────
  const drop = (tid) => {
    if (dragId===tid) { setDragId(null); setDragOv(null); return; }
    setFields(prev => {
      const a=[...prev], fi=a.findIndex(f=>f.id===dragId), ti=a.findIndex(f=>f.id===tid);
      const [mv]=a.splice(fi,1); a.splice(ti,0,mv); return a;
    });
    stage(dragId,"reorder",null,tid,fields.find(f=>f.id===dragId)?.label);
    setDragId(null); setDragOv(null);
    showToast("Column reordered — staged","#8b5cf6");
  };

  // ── Add field ────────────────────────────────────────────────────────────────
  const addField = () => {
    if (!newF.label.trim()) { showToast("Enter a field name","#ef4444"); return; }
    const id = Date.now();
    const f = {...newF, id, on:true, label:newF.label.trim()};
    setFields(p=>[...p,f]);
    stage(id,"add",null,f,newF.label);
    setAddOpen(false);
    setNewF({ icon:"⚠", rt:"text", label:"", hint:"", fk:"", mand:false });
    showToast(`"${f.label}" added — staged`,"#3b82f6");
  };

  // ── Effective field (pending overrides already applied, used in Tab 4) ───────
  const eff = (f) => {
    const ov={};
    pend.filter(c=>c.fid===f.id).forEach(c=>{
      if(c.type==="icon")  ov.icon=c.nw;
      if(c.type==="label") ov.label=c.nw;
      if(c.type==="mand")  ov.mand=c.nw;
      if(c.type==="rt")    ov.rt=c.nw;
    });
    return {...f,...ov};
  };

  const pendFor = (id) => pend.filter(c=>c.fid===id);

  const tabS = (id) => ({
    padding:"11px 15px", border:"none", cursor:"pointer",
    background:"transparent", fontSize:12, fontWeight:tab===id?800:500,
    color:tab===id?ACC.a:M.tB, ...SANS,
    borderBottom:tab===id?`2px solid ${ACC.a}`:"2px solid transparent"
  });

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...SANS, background:M.bg, minHeight:"100%", color:M.tA, fontSize:13 }}>

      {/* ── SHELL (hidden when hosted inside SettingsPanel) ────────────── */}
      {!hosted ? (
      <div style={{ height:48, background:M.sh, borderBottom:`1px solid ${M.shBd}`,
        display:"flex", alignItems:"center", padding:"0 18px", gap:10,
        position:"sticky", top:0, zIndex:100, boxShadow:M.shadow }}>
        <div style={{ width:30, height:30, borderRadius:6, background:ACC.a,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, color:"#fff", fontSize:14 }}>C</div>
        <span style={{ fontWeight:900, fontSize:13, color:ACC.a, letterSpacing:.3 }}>CC ERP</span>
        <span style={{ color:M.tD, fontSize:12 }}>›</span>
        <span style={{ fontSize:12, color:M.tB }}>Settings</span>
        <span style={{ color:M.tD, fontSize:12 }}>›</span>
        <span style={{ fontSize:12, color:ACC.a, fontWeight:800 }}>Schema Editor</span>
        <div style={{ flex:1 }}/>
        <select value={sheet} onChange={e=>switchSheet(e.target.value)}
          style={{ ...IS(M,ACC,false,false), width:180, padding:"5px 9px", fontSize:12 }}>
          {SHEETS.map(s=><option key={s}>{s}</option>)}
        </select>
        {pend.length>0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
            background:"#f59e0b15", border:"1px solid #f59e0b44", borderRadius:7 }}>
            <span style={{ width:7,height:7,borderRadius:99,
              background:"#f59e0b",boxShadow:"0 0 6px #f59e0b" }}/>
            <span style={{ fontSize:11, fontWeight:700, color:"#f59e0b" }}>
              {pend.length} unsaved
            </span>
          </div>
        )}
        <button onClick={()=>setTheme(t=>t==="midnight"?"light":"midnight")}
          style={{ ...BTN(M.hi,M.tB,`1px solid ${M.div}`), padding:"5px 9px", fontSize:11 }}>
          {theme==="midnight"?"☀":"🌙"}
        </button>
      </div>
      ) : (
      <div style={{ display:"flex", alignItems:"center", padding:"10px 18px", gap:10,
        background:M.sh, borderBottom:`1px solid ${M.shBd}` }}>
        <select value={sheet} onChange={e=>switchSheet(e.target.value)}
          style={{ ...IS(M,ACC,false,false), width:200, padding:"5px 9px", fontSize:12 }}>
          {SHEETS.map(s=><option key={s}>{s}</option>)}
        </select>
        {pend.length>0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
            background:"#f59e0b15", border:"1px solid #f59e0b44", borderRadius:7 }}>
            <span style={{ width:7,height:7,borderRadius:99,
              background:"#f59e0b",boxShadow:"0 0 6px #f59e0b" }}/>
            <span style={{ fontSize:11, fontWeight:700, color:"#f59e0b" }}>
              {pend.length} unsaved
            </span>
          </div>
        )}
      </div>
      )}

      {/* ── TAB BAR ────────────────────────────────────────────────────────── */}
      <div style={{ background:M.sh, borderBottom:`1px solid ${M.shBd}`,
        display:"flex", alignItems:"center", padding:"0 18px" }}>
        <button style={tabS("edit")}  onClick={()=>setTab("edit")}>✏ Edit Fields</button>
        <button style={tabS("types")} onClick={()=>setTab("types")}>
          🧩 Field Types
          {assignF && <span style={{ marginLeft:5, fontSize:9, fontWeight:900,
            padding:"1px 5px", borderRadius:99, background:ACC.al, color:ACC.a }}>
            assigning
          </span>}
        </button>
        <button style={tabS("diff")} onClick={()=>setTab("diff")}>
          ⚖ Review Changes
          {pend.length>0 && <span style={{ marginLeft:5, width:17, height:17,
            borderRadius:99, background:"#f59e0b", color:"#000", fontSize:9,
            fontWeight:900, display:"inline-flex",
            alignItems:"center", justifyContent:"center" }}>{pend.length}</span>}
        </button>
        <button style={tabS("preview")} onClick={()=>setTab("preview")}>👁 Form Preview</button>
        <div style={{ flex:1 }}/>
        {pend.length>0 && (
          <div style={{ display:"flex", gap:6, padding:"7px 0" }}>
            <button onClick={()=>{setPend([]);showToast("Discarded","#ef4444");}}
              style={{ ...BTN(M.hi,M.tC,`1px solid ${M.div}`), fontSize:11 }}>Discard All</button>
            <button onClick={applyAll}
              style={{ ...BTN(ACC.a,"#fff"), display:"flex", alignItems:"center", gap:5 }}>
              ⚡ Apply {pend.length} to Sheets
            </button>
          </div>
        )}
      </div>

      <div style={{ padding:18 }}>

        {/* ════ TAB 1: EDIT FIELDS ════ */}
        {tab==="edit" && (
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {/* Info bar */}
            <div style={{ display:"flex", gap:8, alignItems:"center", padding:"8px 12px",
              background:M.hi, border:`1px solid ${M.div}`, borderRadius:8 }}>
              <span style={{ fontSize:17 }}>🗄️</span>
              <span style={{ fontWeight:800, fontSize:13 }}>{sheet}</span>
              <span style={{ color:M.tC, fontSize:11 }}>
                {fields.filter(f=>f.on).length} active · {fields.filter(f=>!f.on).length} hidden
              </span>
              {applied>0 && <Pill c="#3b82f6">{applied} applied</Pill>}
              <div style={{ flex:1 }}/>
              {Object.entries(ICON_TYPES).filter(([k])=>k).map(([icon,cfg])=>(
                <div key={icon} style={{ display:"flex", alignItems:"center", gap:3,
                  padding:"2px 6px", borderRadius:4,
                  background:cfg.color+"11", border:`1px solid ${cfg.color}22` }}>
                  <span style={{ fontSize:11 }}>{icon}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
                </div>
              ))}
            </div>

            {/* Field rows */}
            {fields.map((field,idx)=>{
              const isEd = editId===field.id;
              const cfg  = ICON_TYPES[field.icon]||ICON_TYPES[""];
              const fp   = pendFor(field.id);
              const rt   = RENDER_TYPES[field.rt]||RENDER_TYPES.text;
              const isDg = dragId===field.id;
              const isDt = dragOv===field.id;
              return (
                <div key={field.id}
                  draggable
                  onDragStart={()=>setDragId(field.id)}
                  onDragOver={e=>{e.preventDefault();setDragOv(field.id);}}
                  onDrop={()=>drop(field.id)}
                  onDragEnd={()=>{setDragId(null);setDragOv(null);}}
                  style={{ background:isDt?M.hov:field.on?M.hi:M.mid,
                    border:`1px solid ${isDt?ACC.a:fp.length>0?"#f59e0b44":M.div}`,
                    borderRadius:8, overflow:"hidden",
                    opacity:isDg?0.3:field.on?1:0.55,
                    outline:isDt?`2px dashed ${ACC.a}`:"none",
                    transition:"border-color .12s,opacity .12s" }}>

                  {/* Row */}
                  {!isEd && (
                    <div style={{ display:"flex", alignItems:"center",
                      padding:"9px 13px", gap:10 }}>
                      <span style={{ color:M.tD, cursor:"grab", fontSize:13,
                        userSelect:"none" }}>⠿</span>
                      <span style={{ ...MONO, fontSize:10, color:M.tD,
                        width:16, textAlign:"center", flexShrink:0 }}>{idx+1}</span>
                      <span style={{ fontSize:13, width:22, textAlign:"center",
                        color:cfg.color, flexShrink:0 }}>{field.icon||"·"}</span>
                      <Pill c={cfg.color} sm>{cfg.label}</Pill>
                      <span style={{ flex:1, fontWeight:700, fontSize:13,
                        color:field.on?M.tA:M.tC }}>{field.label}</span>
                      {/* renderType */}
                      <div style={{ display:"flex", alignItems:"center", gap:4,
                        padding:"2px 7px", borderRadius:5,
                        background:rt.c+"11", border:`1px solid ${rt.c}22` }}>
                        <span style={{ fontSize:11 }}>{rt.ico}</span>
                        <span style={{ fontSize:9, fontWeight:700, color:rt.c }}>{rt.label}</span>
                      </div>
                      {field.fk && (
                        <span style={{ fontSize:10, color:"#3b82f6", ...MONO }}>→ {field.fk}</span>
                      )}
                      {field.mand && <Pill c="#ef4444" sm>req</Pill>}
                      {fp.length>0 && (
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <span style={{ width:6,height:6,borderRadius:3,background:"#f59e0b" }}/>
                          <span style={{ fontSize:10, color:"#f59e0b", fontWeight:700 }}>
                            {fp.length}
                          </span>
                        </div>
                      )}
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={()=>{setEditId(field.id);setDraft({...field});}}
                          style={{ ...BTN(M.hov,M.tB,`1px solid ${M.div}`),
                            padding:"3px 9px", fontSize:11 }}>✏ Edit</button>
                        <button onClick={()=>{
                            stage(field.id,"on",field.on,!field.on,field.label);
                            setFields(p=>p.map(f=>f.id===field.id?{...f,on:!f.on}:f));
                            showToast(field.on?`"${field.label}" hidden`:`"${field.label}" shown`,"#8b5cf6");
                          }}
                          style={{ ...BTN(M.hov,field.on?"#ef4444":M.tB,`1px solid ${M.div}`),
                            padding:"3px 9px", fontSize:11 }}>
                          {field.on?"Hide":"Show"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline edit */}
                  {isEd && (
                    <div style={{ padding:14 }}>
                      <div style={{ fontWeight:800, fontSize:12, color:M.tB,
                        marginBottom:11, display:"flex", alignItems:"center", gap:8 }}>
                        <span>✏ Editing:</span>
                        <span style={{ color:ACC.a }}>{field.label}</span>
                        <div style={{ flex:1 }}/>
                        <button onClick={done}
                          style={{ ...BTN("transparent",M.tC), padding:"2px 6px",
                            fontSize:11 }}>✕</button>
                      </div>

                      <div style={{ display:"grid",
                        gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:9 }}>
                        {/* Label */}
                        <div>
                          <label style={LBL(M)}>Display Label</label>
                          <input value={draft.label||""}
                            onChange={e=>setDraft(d=>({...d,label:e.target.value}))}
                            style={IS(M,ACC,false,false)}/>
                          <div style={{ fontSize:9,color:M.tD,marginTop:2 }}>
                            React form only (not Sheet header)
                          </div>
                        </div>
                        {/* Icon */}
                        <div>
                          <label style={LBL(M)}>Icon (GAS type)</label>
                          <select value={draft.icon||""}
                            onChange={e=>setDraft(d=>({...d,icon:e.target.value}))}
                            style={IS(M,ACC,false,false)}>
                            {Object.entries(ICON_TYPES).map(([k,v])=>{
                              const s=safety(field.icon,k);
                              return <option key={k} value={k}
                                disabled={s&&!s.ok}>
                                {k||"(none)"} {v.label}{s&&!s.ok?" ⛔":""}
                              </option>;
                            })}
                          </select>
                          {draft.icon!==field.icon&&(()=>{
                            const s=safety(field.icon,draft.icon);
                            if(!s)return null;
                            const rc=RISK[s.risk];
                            return <div style={{ marginTop:3,padding:"3px 7px",borderRadius:4,
                              background:rc.bg,border:`1px solid ${rc.c}33`,
                              fontSize:9,color:rc.c }}>{s.ok?"⚠":"⛔"} {s.warn}</div>;
                          })()}
                        </div>
                        {/* Render type */}
                        <div>
                          <label style={LBL(M)}>Render Type (React widget)</label>
                          <select value={draft.rt||"text"}
                            disabled={["←","#","∑"].includes(draft.icon||field.icon)}
                            onChange={e=>setDraft(d=>({...d,rt:e.target.value}))}
                            style={{ ...IS(M,ACC,false,false),
                              opacity:["←","#","∑"].includes(draft.icon||field.icon)?.4:1 }}>
                            {Object.entries(RENDER_TYPES).map(([k,v])=>(
                              <option key={k} value={k}>{v.ico} {v.label}</option>
                            ))}
                          </select>
                          <button onClick={()=>{setAssignF(field.id);setTab("types");}}
                            style={{ ...BTN("transparent",ACC.a), padding:"3px 0",
                              fontSize:9, marginTop:3 }}>🧩 Browse all types →</button>
                        </div>
                        {/* FK */}
                        <div>
                          <label style={LBL(M)}>FK Target Sheet</label>
                          <select value={draft.fk||""}
                            disabled={!["→","⟷"].includes(draft.icon||"")}
                            onChange={e=>setDraft(d=>({...d,fk:e.target.value}))}
                            style={{ ...IS(M,ACC,false,false),
                              opacity:["→","⟷"].includes(draft.icon||"")?1:.4 }}>
                            <option value="">— None —</option>
                            {FK_SHEETS.map(s=><option key={s}>{s}</option>)}
                          </select>
                        </div>
                        {/* Hint */}
                        <div>
                          <label style={LBL(M)}>Hint / Placeholder</label>
                          <input value={draft.hint||""}
                            onChange={e=>setDraft(d=>({...d,hint:e.target.value}))}
                            style={IS(M,ACC,false,false)}
                            placeholder="e.g. 5249HP format"/>
                        </div>
                        {/* Mandatory */}
                        <div style={{ display:"flex", alignItems:"flex-end",
                          paddingBottom:3 }}>
                          <div>
                            <label style={LBL(M)}>Mandatory</label>
                            <div style={{ display:"flex", alignItems:"center",
                              gap:8, marginTop:5 }}>
                              <Toggle on={draft.mand||false}
                                set={v=>setDraft(d=>({...d,mand:v}))}
                                disabled={["←","#","∑"].includes(draft.icon||field.icon)}/>
                              <span style={{ fontSize:12,
                                color:draft.mand?"#ef4444":M.tC }}>
                                {draft.mand?"Required":"Optional"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {["←","#","∑"].includes(field.icon) && (
                        <div style={{ marginTop:9,padding:"6px 9px",
                          background:"#ef444411",border:"1px solid #ef444422",
                          borderRadius:5,fontSize:10,color:"#ef4444",
                          display:"flex",gap:5 }}>
                          🔒 GAS-owned — label + hint editable only. Icon, type, mandatory locked.
                        </div>
                      )}

                      <div style={{ display:"flex", gap:6, marginTop:11,
                        justifyContent:"flex-end" }}>
                        <button onClick={done}
                          style={BTN(M.mid,M.tC,`1px solid ${M.div}`)}>Cancel</button>
                        <button onClick={commit}
                          style={{ ...BTN(ACC.a,"#fff"),
                            display:"flex", alignItems:"center", gap:5 }}>
                          Stage Changes
                          <span style={{ fontSize:9, background:"#ffffff33",
                            padding:"1px 5px", borderRadius:99 }}>→ Diff</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add field */}
            {!addOpen
              ? <button onClick={()=>setAddOpen(true)}
                  style={{ ...BTN("transparent",M.tC,`2px dashed ${M.div}`),
                    width:"100%", padding:11, borderRadius:8, fontSize:12 }}>
                  + Add New Column (append to end of sheet)
                </button>
              : <div style={{ background:M.hi,
                  border:`2px dashed ${ACC.a}44`,
                  borderRadius:8, padding:14 }}>
                  <div style={{ fontWeight:800,fontSize:12,color:ACC.a,marginBottom:10 }}>
                    ✦ New Column
                  </div>
                  <div style={{ display:"grid",
                    gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:8, marginBottom:9 }}>
                    <div>
                      <label style={LBL(M)}>Name *</label>
                      <input value={newF.label}
                        onChange={e=>setNewF(n=>({...n,label:e.target.value}))}
                        style={IS(M,ACC,!newF.label,false)}
                        placeholder="Field name"/>
                    </div>
                    <div>
                      <label style={LBL(M)}>Icon Type</label>
                      <select value={newF.icon}
                        onChange={e=>setNewF(n=>({...n,icon:e.target.value}))}
                        style={IS(M,ACC,false,false)}>
                        {Object.entries(ICON_TYPES)
                          .filter(([k])=>!["←","∑","#"].includes(k))
                          .map(([k,v])=>(
                            <option key={k} value={k}>{k||"(none)"} {v.label}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label style={LBL(M)}>Render Type</label>
                      <select value={newF.rt}
                        onChange={e=>setNewF(n=>({...n,rt:e.target.value}))}
                        style={IS(M,ACC,false,false)}>
                        {Object.entries(RENDER_TYPES).map(([k,v])=>(
                          <option key={k} value={k}>{v.ico} {v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={LBL(M)}>FK Sheet</label>
                      <select value={newF.fk}
                        disabled={newF.icon!=="→"}
                        onChange={e=>setNewF(n=>({...n,fk:e.target.value}))}
                        style={{ ...IS(M,ACC,false,false),
                          opacity:newF.icon==="→"?1:.4 }}>
                        <option value="">— None —</option>
                        {FK_SHEETS.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={LBL(M)}>Hint</label>
                      <input value={newF.hint}
                        onChange={e=>setNewF(n=>({...n,hint:e.target.value}))}
                        style={IS(M,ACC,false,false)}
                        placeholder="Helper text"/>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                    <button onClick={()=>setAddOpen(false)}
                      style={BTN(M.mid,M.tC,`1px solid ${M.div}`)}>Cancel</button>
                    <button onClick={addField}
                      style={BTN(ACC.a,"#fff")}>Add Column →</button>
                  </div>
                </div>
            }
          </div>
        )}

        {/* ════ TAB 2: FIELD TYPES ════ */}
        {tab==="types" && (
          <div style={{ display:"flex", gap:16 }}>
            {/* Left filter */}
            <div style={{ width:160, flexShrink:0 }}>
              {assignF && (()=>{
                const f=fields.find(x=>x.id===assignF);
                if(!f) return null;
                const curr=RENDER_TYPES[f.rt]||RENDER_TYPES.text;
                return (
                  <div style={{ marginBottom:11, padding:"8px 10px",
                    background:ACC.al, border:`1px solid ${ACC.a}44`,
                    borderRadius:8 }}>
                    <div style={{ fontSize:10, fontWeight:900,
                      color:ACC.a, marginBottom:3 }}>🧩 Assigning to:</div>
                    <div style={{ fontSize:12, fontWeight:700, color:M.tA }}>{f.label}</div>
                    <div style={{ fontSize:10, color:M.tC, marginTop:2 }}>
                      Current: {curr.ico} {curr.label}
                    </div>
                    <button onClick={()=>{setAssignF(null);setTab("edit");}}
                      style={{ ...BTN(M.hi,M.tC,`1px solid ${M.div}`),
                        marginTop:7, fontSize:10, padding:"3px 8px",
                        width:"100%", boxSizing:"border-box" }}>✕ Cancel</button>
                  </div>
                );
              })()}
              <div style={{ fontSize:9, fontWeight:900, color:M.tC,
                letterSpacing:.7, textTransform:"uppercase",
                marginBottom:5 }}>Filter</div>
              {["All",...RT_GROUPS].map(g=>(
                <button key={g} onClick={()=>setRtGroup(g)}
                  style={{ width:"100%", textAlign:"left", padding:"6px 9px",
                    borderRadius:5, border:"none", cursor:"pointer", fontSize:12,
                    background:rtGroup===g?ACC.al:"transparent",
                    color:rtGroup===g?ACC.a:M.tB,
                    fontWeight:rtGroup===g?800:500, marginBottom:2 }}>
                  {g}
                  <span style={{ float:"right", fontSize:10, color:M.tC }}>
                    {g==="All"
                      ? Object.keys(RENDER_TYPES).length
                      : Object.values(RENDER_TYPES).filter(v=>v.g===g).length}
                  </span>
                </button>
              ))}
              <div style={{ marginTop:12, padding:"9px 10px",
                background:"#3b82f611", border:"1px solid #3b82f633",
                borderRadius:7, fontSize:10, color:"#3b82f6", lineHeight:1.6 }}>
                <div style={{ fontWeight:900, marginBottom:3 }}>⚡ Two-layer</div>
                <code style={MONO}>icon</code> = GAS<br/>
                <code style={MONO}>renderType</code> = React<br/><br/>
                Sheet stores raw.<br/>React renders richly.
              </div>
            </div>

            {/* Cards */}
            <div style={{ flex:1 }}>
              {assignF && (
                <div style={{ marginBottom:10, padding:"6px 11px",
                  background:"#f59e0b11", border:"1px solid #f59e0b33",
                  borderRadius:7, fontSize:11, color:"#f59e0b" }}>
                  Click a card to assign its render type to <strong>
                  {fields.find(f=>f.id===assignF)?.label}</strong>
                </div>
              )}
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))", gap:8 }}>
                {Object.entries(RENDER_TYPES)
                  .filter(([,v])=>rtGroup==="All"||v.g===rtGroup)
                  .map(([key,cfg])=>{
                    const isCurr = assignF &&
                      fields.find(f=>f.id===assignF)?.rt===key;
                    return (
                      <div key={key}
                        onClick={()=>{
                          if(!assignF) return;
                          const f=fields.find(x=>x.id===assignF);
                          if(!f) return;
                          stage(assignF,"rt",f.rt,key,f.label);
                          setFields(p=>p.map(x=>x.id===assignF?{...x,rt:key}:x));
                          showToast(`"${f.label}" → ${cfg.label}`,cfg.c);
                          setAssignF(null); setTab("edit");
                        }}
                        style={{ background:M.hi,
                          border:`1px solid ${isCurr?ACC.a+"88":M.div}`,
                          borderRadius:9, overflow:"hidden",
                          cursor:assignF?"pointer":"default",
                          boxShadow:isCurr?`0 0 0 2px ${ACC.a}22`:"none",
                          transition:"border-color .12s" }}>
                        {/* Card header */}
                        <div style={{ padding:"10px 12px",
                          borderBottom:`1px solid ${M.div}`,
                          display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:6,
                            background:cfg.c+"20", border:`1px solid ${cfg.c}33`,
                            display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:14,
                            flexShrink:0 }}>{cfg.ico}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:800, fontSize:13,
                              color:M.tA }}>{cfg.label}</div>
                            <div style={{ fontSize:10, color:M.tC }}>{cfg.ex}</div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column",
                            gap:3, alignItems:"flex-end" }}>
                            <Pill c={cfg.c} sm>{cfg.g}</Pill>
                            {isCurr && <Pill c={ACC.a} sm>current</Pill>}
                          </div>
                        </div>
                        {/* Live widget preview */}
                        <div style={{ padding:"9px 12px" }}>
                          <div style={{ fontSize:9, fontWeight:900, color:M.tC,
                            letterSpacing:.6, textTransform:"uppercase",
                            marginBottom:5 }}>Preview</div>
                          <PW field={{ id:`cat_${key}`, icon:"⚠", rt:key,
                            label:cfg.label, hint:cfg.ex, mand:false, on:true }}
                            M={M} A={ACC} bv={bv} setBv={setBv}
                            rv={rv} setRv={setRv}/>
                        </div>
                        {/* Footer */}
                        <div style={{ padding:"4px 12px 9px",
                          display:"flex", alignItems:"center", gap:5 }}>
                          <span style={{ fontSize:9, color:M.tC, ...MONO }}>
                            Stored: <span style={{ color:M.tB }}>{cfg.stored}</span>
                          </span>
                          {cfg.val && <Pill c="#10b981" sm>validated</Pill>}
                          {assignF && !isCurr && (
                            <span style={{ marginLeft:"auto", fontSize:9,
                              fontWeight:800, color:ACC.a }}>Click →</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 3: REVIEW CHANGES ════ */}
        {tab==="diff" && (
          <div style={{ maxWidth:880 }}>
            <div style={{ fontWeight:900, fontSize:14, color:M.tA, marginBottom:3 }}>
              ⚖ Review Changes Before Applying
            </div>
            <div style={{ fontSize:12, color:M.tC, marginBottom:13 }}>
              Nothing touches Google Sheets until you click Apply.
            </div>
            {pend.length===0
              ? <div style={{ padding:44, textAlign:"center",
                  background:M.hi, border:`1px solid ${M.div}`,
                  borderRadius:10, color:M.tC }}>
                  <div style={{ fontSize:34, marginBottom:9 }}>✅</div>
                  <div style={{ fontWeight:800, fontSize:13, color:M.tB,
                    marginBottom:3 }}>No pending changes</div>
                  <div style={{ fontSize:12 }}>
                    Use Edit Fields or Field Types tabs to make changes.
                  </div>
                </div>
              : <>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {pend.map(ch=>{
                      const s = ch.type==="icon"?safety(ch.old,ch.nw):null;
                      const rc = s?RISK[s.risk]:RISK.low;
                      const tc = {
                        icon:"#8b5cf6",label:"#3b82f6",mand:"#ef4444",
                        rt:ACC.a,fk:"#10b981",hint:"#64748b",
                        on:"#ec4899",add:"#10b981",reorder:"#f59e0b"
                      }[ch.type]||"#64748b";

                      const fmt = (v,t) => {
                        if(v===null||v===undefined) return "—";
                        if(t==="icon") return `${v||"(none)"} ${ICON_TYPES[v]?.label||"Text"}`;
                        if(t==="mand") return v?"Required":"Optional";
                        if(t==="on")   return v?"Visible":"Hidden";
                        if(t==="rt")   return RENDER_TYPES[v]?.label||v;
                        if(t==="add")  return "New column";
                        if(t==="reorder") return "Repositioned";
                        return String(v);
                      };

                      return (
                        <div key={ch.id} style={{ background:M.hi,
                          border:`1px solid ${M.div}`,
                          borderRadius:8, overflow:"hidden" }}>
                          <div style={{ display:"flex", alignItems:"center",
                            padding:"10px 13px", gap:11 }}>
                            <Pill c={tc}>{ch.type.toUpperCase()}</Pill>
                            <span style={{ fontWeight:700, color:M.tA,
                              minWidth:150 }}>{ch.lbl}</span>
                            <div style={{ flex:1, display:"flex",
                              alignItems:"center", gap:7 }}>
                              <div style={{ padding:"2px 8px", borderRadius:4,
                                background:"#ef444411",
                                border:"1px solid #ef444422",
                                fontSize:11, color:"#ef4444", ...MONO }}>
                                {fmt(ch.old,ch.type)}
                              </div>
                              <span style={{ color:M.tD }}>→</span>
                              <div style={{ padding:"2px 8px", borderRadius:4,
                                background:"#10b98111",
                                border:"1px solid #10b98122",
                                fontSize:11, color:"#10b981", ...MONO }}>
                                {fmt(ch.nw,ch.type)}
                              </div>
                            </div>
                            {s && <Pill c={rc.c} sm>{rc.label}</Pill>}
                            <button
                              onClick={()=>setPend(p=>p.filter(x=>x.id!==ch.id))}
                              style={{ ...BTN(M.mid,"#ef4444",`1px solid #ef444433`),
                                padding:"3px 8px", fontSize:11 }}>✕</button>
                          </div>
                          {s && s.risk!=="low" && (
                            <div style={{ padding:"6px 13px",
                              background:rc.bg,
                              borderTop:`1px solid ${rc.c}22`,
                              fontSize:10, color:rc.c,
                              display:"flex", gap:5 }}>
                              {s.ok?"⚠":"⛔"} {s.warn}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Apply bar */}
                  <div style={{ marginTop:11, background:M.hi,
                    border:`1px solid ${ACC.a}44`,
                    borderRadius:8, padding:"12px 14px",
                    display:"flex", alignItems:"center", gap:11 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:13, color:M.tA }}>
                        Ready to apply?
                      </div>
                      <div style={{ fontSize:11, color:M.tC, marginTop:1 }}>
                        GAS: update PropertiesService → clear 6hr schema cache →
                        React auto-reloads on next form open
                      </div>
                    </div>
                    <button onClick={()=>{setPend([]);showToast("All discarded","#ef4444");}}
                      style={BTN(M.mid,M.tC,`1px solid ${M.div}`)}>Discard All</button>
                    <button onClick={applyAll}
                      style={{ ...BTN(ACC.a,"#fff"),
                        display:"flex", alignItems:"center", gap:5,
                        padding:"9px 16px", fontSize:13 }}>
                      ⚡ Apply {pend.length} Change{pend.length>1?"s":""} to Sheets
                    </button>
                  </div>
                </>
            }
          </div>
        )}

        {/* ════ TAB 4: FORM PREVIEW ════ */}
        {tab==="preview" && (
          <div style={{ display:"flex", gap:16 }}>
            <div style={{ flex:1, maxWidth:660 }}>
              <div style={{ fontWeight:900, fontSize:14, color:M.tA, marginBottom:3 }}>
                👁 Live Form Preview — {sheet}
              </div>
              <div style={{ fontSize:12, color:M.tC, marginBottom:13 }}>
                Reflects ALL pending changes. This is exactly how the data entry form renders.
              </div>
              <div style={{ background:M.hi, border:`1px solid ${M.div}`,
                borderRadius:9, padding:17 }}>
                <div style={{ fontWeight:900, fontSize:13, color:M.tA,
                  marginBottom:13, paddingBottom:9,
                  borderBottom:`1px solid ${M.div}`,
                  display:"flex", alignItems:"center", gap:8 }}>
                  📦 New Record — {sheet}
                  <span style={{ marginLeft:"auto", fontSize:10, padding:"2px 7px",
                    borderRadius:99, background:ACC.al, color:ACC.a,
                    fontWeight:700 }}>Schema-Driven ✦</span>
                  {pend.length>0 && <Pill c="#f59e0b">↻ {pend.length} pending</Pill>}
                </div>
                {/* 200px label + flex input */}
                <div style={{ display:"grid",
                  gridTemplateColumns:"200px 1fr", gap:"9px 0" }}>
                  {fields.filter(f=>f.on).map(f=>{
                    const ef = eff(f);
                    const cfg = ICON_TYPES[ef.icon]||ICON_TYPES[""];
                    return (
                      <div key={f.id} style={{ display:"contents" }}>
                        <div style={{ padding:"7px 11px 7px 0",
                          display:"flex", alignItems:"flex-start", gap:4,
                          paddingTop:["textarea","image_url","doc_link","drive_file"]
                            .includes(ef.rt)?9:7 }}>
                          <span style={{ fontSize:12, color:cfg.color,
                            marginTop:1, flexShrink:0 }}>{ef.icon||"·"}</span>
                          <span style={{ fontSize:9, fontWeight:900, color:M.tC,
                            letterSpacing:.5, textTransform:"uppercase",
                            lineHeight:1.3 }}>
                            {ef.label}
                            {ef.mand && <span style={{ color:"#ef4444" }}> *</span>}
                          </span>
                        </div>
                        <div style={{ padding:"3px 0" }}>
                          <PW field={ef} M={M} A={ACC}
                            bv={bv} setBv={setBv}
                            rv={rv} setRv={setRv}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:"flex", gap:6, marginTop:16,
                  justifyContent:"flex-end",
                  borderTop:`1px solid ${M.div}`, paddingTop:12 }}>
                  <button style={BTN(M.mid,M.tC,`1px solid ${M.div}`)}>Cancel</button>
                  <button style={BTN(ACC.a,"#fff")}>Save Record →</button>
                </div>
              </div>
            </div>

            {/* Side */}
            <div style={{ width:240, flexShrink:0,
              display:"flex", flexDirection:"column", gap:9 }}>
              {/* Field list */}
              <div style={{ background:M.hi, border:`1px solid ${M.div}`,
                borderRadius:8, padding:12 }}>
                <div style={{ fontWeight:800, fontSize:11, color:M.tA,
                  marginBottom:8 }}>Fields in this form</div>
                {fields.filter(f=>f.on).map(f=>{
                  const ef=eff(f);
                  const cfg=ICON_TYPES[ef.icon]||ICON_TYPES[""];
                  const rt=RENDER_TYPES[ef.rt]||RENDER_TYPES.text;
                  return (
                    <div key={f.id} style={{ display:"flex", gap:6,
                      marginBottom:6, alignItems:"center" }}>
                      <span style={{ fontSize:12, color:cfg.color,
                        width:18, textAlign:"center", flexShrink:0 }}>
                        {ef.icon||"·"}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:M.tA,
                          whiteSpace:"nowrap", overflow:"hidden",
                          textOverflow:"ellipsis" }}>{ef.label}</div>
                        <div style={{ fontSize:9, color:rt.c }}>
                          {rt.ico} {rt.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {pend.length>0 && (
                <div style={{ background:"#f59e0b11",
                  border:"1px solid #f59e0b33",
                  borderRadius:8, padding:10 }}>
                  <div style={{ fontWeight:800, fontSize:11,
                    color:"#f59e0b", marginBottom:4 }}>
                    ↻ Includes pending changes
                  </div>
                  <div style={{ fontSize:10, color:M.tC, lineHeight:1.5 }}>
                    {pend.length} change{pend.length>1?"s":""} visible here.
                    Apply them in Review tab.
                  </div>
                  <button onClick={()=>setTab("diff")}
                    style={{ ...BTN(M.hi,M.tB,`1px solid ${M.div}`),
                      marginTop:7, fontSize:10, padding:"4px 8px", width:"100%",
                      boxSizing:"border-box" }}>
                    ⚖ Review Changes →
                  </button>
                </div>
              )}

              {/* Icon reference */}
              <div style={{ background:M.hi, border:`1px solid ${M.div}`,
                borderRadius:8, padding:12 }}>
                <div style={{ fontWeight:800, fontSize:11, color:M.tA,
                  marginBottom:8 }}>GAS Icon → Widget</div>
                {Object.entries(ICON_TYPES).filter(([k])=>k).map(([icon,cfg])=>(
                  <div key={icon} style={{ display:"flex", gap:7,
                    marginBottom:5, alignItems:"flex-start" }}>
                    <span style={{ fontSize:12, width:18, textAlign:"center",
                      flexShrink:0, color:cfg.color }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:10, fontWeight:800,
                        color:cfg.color }}>{cfg.label}</div>
                      <div style={{ fontSize:9, color:M.tC,
                        lineHeight:1.3 }}>{cfg.desc.split(".")[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SAFETY MODAL ─────────────────────────────────────────────────────── */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"#00000088",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:500 }}>
          <div style={{ background:M.sh, border:`1px solid ${M.shBd}`,
            borderRadius:11, padding:24, maxWidth:400, width:"90%",
            boxShadow:M.shadow }}>
            <div style={{ fontWeight:900, fontSize:14, marginBottom:4,
              color:M.tA, display:"flex", alignItems:"center", gap:8 }}>
              {modal.s.ok?"⚠️":"⛔"}
              {modal.s.ok?"Confirm Type Change":"Not Allowed"}
            </div>
            <div style={{ fontSize:12, color:M.tB, marginBottom:11 }}>
              <strong>{modal.orig.label}</strong>:&nbsp;
              {ICON_TYPES[modal.orig.icon]?.label} → {ICON_TYPES[modal.to]?.label}
            </div>
            {(()=>{
              const rc=RISK[modal.s.risk];
              return <div style={{ background:rc.bg,
                border:`1px solid ${rc.c}44`, borderRadius:6,
                padding:"8px 11px", marginBottom:13,
                fontSize:12, color:rc.c }}>
                <strong>{rc.label}:</strong> {modal.s.warn}
              </div>;
            })()}
            <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
              <button onClick={()=>setModal(null)}
                style={BTN(M.mid,M.tB,`1px solid ${M.div}`)}>Cancel</button>
              {modal.s.ok && modal.onOk && (
                <button onClick={modal.onOk}
                  style={BTN("#f59e0b","#000")}>I Understand — Stage</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM APPLY MODAL ──────────────────────────────────────────────── */}
      {confirmModal && (
        <div style={{ position:"fixed", inset:0, background:"#00000088",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:500 }}>
          <div style={{ background:M.sh, border:`1px solid ${M.shBd}`,
            borderRadius:11, padding:24, maxWidth:480, width:"92%",
            boxShadow:M.shadow }}>
            <div style={{ fontWeight:900, fontSize:15, marginBottom:6,
              color:M.tA, display:"flex", alignItems:"center", gap:8 }}>
              ⚠ Confirm — Apply to Google Sheets
            </div>
            <div style={{ fontSize:12, color:M.tB, marginBottom:12 }}>
              This will <strong>permanently modify</strong> the live <strong>{sheet.toUpperCase()}</strong> sheet.
              {pend.length} change{pend.length>1?"s":""} will be applied:
            </div>
            <div style={{ background:M.bg, border:`1px solid ${M.div}`, borderRadius:7,
              padding:10, marginBottom:12, maxHeight:200, overflowY:"auto" }}>
              {pend.map((ch,i) => {
                const f = fields.find(x=>x.id===ch.fid);
                const typeColors = { label:"#3b82f6", add:"#10b981", hint:"#64748b",
                  mand:"#f59e0b", on:"#8b5cf6", icon:"#ec4899", rt:"#06b6d4",
                  fk:"#3b82f6", reorder:"#f97316" };
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
                    padding:"4px 0", borderBottom:i<pend.length-1?`1px solid ${M.div}`:"none" }}>
                    <span style={{ fontSize:9, fontWeight:800, padding:"2px 6px",
                      borderRadius:4, background:(typeColors[ch.type]||"#64748b")+"20",
                      color:typeColors[ch.type]||"#64748b", textTransform:"uppercase",
                      whiteSpace:"nowrap" }}>{ch.type}</span>
                    <span style={{ fontSize:12, color:M.tA, fontWeight:600 }}>
                      {f?.label || ch.lbl || `Field #${ch.fid}`}
                    </span>
                    {ch.type==="label" && <span style={{ fontSize:10, color:M.tC }}>
                      "{ch.old}" → "{ch.nw}"
                    </span>}
                  </div>
                );
              })}
            </div>
            {saveError && (
              <div style={{ background:"#ef444415", border:"1px solid #ef444444",
                borderRadius:6, padding:"8px 11px", marginBottom:10,
                fontSize:12, color:"#ef4444" }}>
                {saveError}
              </div>
            )}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={()=>{setConfirmModal(false);setSaveError(null);}}
                disabled={saving}
                style={BTN(M.mid,M.tB,`1px solid ${M.div}`)}>Cancel</button>
              <button onClick={applyToSheets} disabled={saving}
                style={{ ...BTN(saving?"#6b7280":ACC.a,"#fff"),
                  padding:"9px 18px", fontSize:13, fontWeight:900,
                  opacity:saving?.7:1, cursor:saving?"wait":"pointer" }}>
                {saving ? "Saving..." : `Apply ${pend.length} Change${pend.length>1?"s":""} to Sheet`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:"fixed", bottom:20, left:"50%",
          transform:"translateX(-50%)",
          background:toast.c, color:"#fff",
          padding:"8px 18px", borderRadius:8,
          fontSize:12, fontWeight:700, zIndex:600,
          boxShadow:"0 4px 20px #00000055",
          maxWidth:460, textAlign:"center", ...SANS }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
