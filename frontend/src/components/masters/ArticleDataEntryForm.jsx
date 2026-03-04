import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import api from '../../services/api';
import { SEED_DATA as CAT_SEED, CATEGORY_HIERARCHY } from './ItemCategoryTab';

// ═══════════════════════════════════════════════════════════════
// ArticleDataEntryForm — V3: Views Bar + Filter/Sort + Live Preview
// ═══════════════════════════════════════════════════════════════

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       "#f0f2f6",
  surface:  "#ffffff",
  border:   "#e4e8ef",
  text:     "#1a2332",
  sub:      "#5a6a7e",
  muted:    "#9aa5b4",
  faint:    "#f4f6f9",
  red:      "#CC0000",
  redSoft:  "#fff0f0",
  orange:   "#E8690A",
  orangeSoft:"#fff5ee",
  purple:   "#6c3fc5",
  purpleSoft:"#f0eeff",
  blue:     "#1d6fa4",
  blueSoft: "#e8f3fb",
  green:    "#15803d",
  amber:    "#b45309",
  amberSoft:"#fffbeb",
  slate:    "#1e293b",
  slate2:   "#253347",
  slate3:   "#2d3f50",
  inputBg:  "#f9fafb",
  inputBgOn:"#ffffff",
};

/* ─── Drive link → direct image URL ─── */
function driveThumbUrl(link) {
  if (!link) return null;
  var url = link.split('|')[0].trim();
  if (!url) return null;
  var m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return 'https://drive.google.com/thumbnail?id=' + m1[1] + '&sz=w400';
  var m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return 'https://drive.google.com/thumbnail?id=' + m2[1] + '&sz=w400';
  if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(url)) return url;
  return url;
}

/* ─── SECTIONS ───────────────────────────────────────────────── */
const SECTIONS = [
  {
    id:"identity", icon:"📋", label:"Article Identity", acc:C.blue,
    fields:[
      { key:"code",      label:"Article Code",   req:true,  type:"code",   mono:true,
        hint:"4–5 digits + 2 CAPS · e.g. 5249HP" },
      { key:"desc",      label:"Description",    req:true,  type:"textarea",
        hint:"Full name with construction · max 120 chars" },
      { key:"shortName", label:"Short Name",     req:false, type:"text",
        hint:"Max 25 chars — used on barcode & hang tag" },
      { key:"imageLink", label:"Image Link",     req:false, type:"text",
        hint:"Google Drive public share URL" },
      { key:"sketchLink",label:"Sketch Links",   req:false, type:"text",
        hint:"Google Drive links · pipe-separated" },
      { key:"buyerStyle",label:"Buyer Style No", req:false, type:"text" },
    ],
  },
  {
    id:"details", icon:"👕", label:"Item Details", acc:"#059669",
    fields:[
      { key:"l1Division",label:"L1 Division",    req:true,  type:"select",
        hint:"Apparel division" },
      { key:"l2Category",label:"L2 Category",    req:true,  type:"select",
        hint:"Drives L3 options, HSN & GST auto-fill" },
      { key:"l3Style",   label:"L3 Style",       req:false, type:"select",
        hint:"Cascades from L2" },
      { key:"season",    label:"Season",         req:false, type:"select" },
      { key:"gender",    label:"Gender",         req:true,  type:"select" },
      { key:"fitType",   label:"Fit Type",       req:false, type:"select" },
      { key:"neckline",  label:"Neckline",       req:false, type:"select" },
      { key:"sleeveType",label:"Sleeve Type",    req:false, type:"select" },
    ],
  },
  {
    id:"fabric", icon:"🧵", label:"Fabric & Colors", acc:C.purple,
    fields:[
      { key:"mainFabric",label:"Main Fabric",    req:false, type:"select", fk:true,
        hint:"FK → RM_MASTER_FABRIC" },
      { key:"fabricName",label:"Fabric Name",    req:false, type:"auto",   auto:true,
        hint:"Auto from Fabric FK" },
      { key:"colorCodes",label:"Color Code(s)",  req:false, type:"select",
        hint:"FK → COLOR_MASTER" },
      { key:"sizeRange", label:"Size Range",     req:false, type:"select",
        hint:"e.g. S-M-L-XL-XXL" },
    ],
  },
  {
    id:"pricing", icon:"₹", label:"Pricing & Tax", acc:C.orange,
    fields:[
      { key:"wsp",       label:"W.S.P (Rs)",     req:false, type:"number", mono:true,
        hint:"Wholesale price per piece" },
      { key:"mrp",       label:"MRP (Rs)",        req:false, type:"number", mono:true,
        hint:"Maximum retail price" },
      { key:"markupPct", label:"Final Markup %",  req:false, type:"auto",   auto:true, mono:true,
        hint:"(MRP − WSP) ÷ WSP × 100" },
      { key:"markdownPct",label:"Final Markdown %",req:false,type:"auto",  auto:true, mono:true,
        hint:"(MRP − WSP) ÷ MRP × 100" },
      { key:"hsnCode",   label:"HSN Code",        req:false, type:"select", fk:true,
        hint:"Auto-suggested from L2 · FK → HSN_MASTER" },
      { key:"gstPct",    label:"GST %",           req:false, type:"auto",   auto:true, mono:true,
        hint:"Auto from HSN Master" },
    ],
  },
  {
    id:"status", icon:"🏷️", label:"Status & Tags", acc:"#64748b",
    fields:[
      { key:"status",    label:"Status",          req:false, type:"select",
        hint:"Active = live · Development = not released" },
      { key:"remarks",   label:"Remarks",         req:false, type:"textarea" },
      { key:"tags",      label:"Tags",            req:false, type:"text",
        hint:"→ TAG_MASTER · comma-separated" },
    ],
  },
];

const ALL = SECTIONS.flatMap(s => s.fields);
const MAN = ALL.filter(f => !f.auto);
const REQ = ALL.filter(f => f.req && !f.auto);

/* ─── SYSTEM VIEWS ───────────────────────────────────────────── */
const SYSTEM_VIEWS = [
  { id:"all",     name:"All Fields",    icon:"⊞", color:"#64748b", isSystem:true,
    desc:"Every field across all 5 sections",
    fields: ALL.map(f => f.key) },
  { id:"quick",   name:"Quick Entry",   icon:"⚡", color:C.orange,  isSystem:true,
    desc:"Required fields only — fastest possible entry",
    fields: ["code","desc","l1Division","l2Category","gender","status"] },
  { id:"pricing", name:"Pricing & Tax", icon:"₹",  color:C.green,   isSystem:true,
    desc:"Article code + all pricing, HSN, GST fields",
    fields: ["code","desc","wsp","mrp","markupPct","markdownPct","hsnCode","gstPct"] },
  { id:"fabric",  name:"Fabric Focus",  icon:"🧵", color:C.purple,   isSystem:true,
    desc:"Article code + all fabric & colour fields",
    fields: ["code","desc","mainFabric","fabricName","colorCodes","sizeRange"] },
];

const STATUS_COLORS = {
  Active:      { bg:"#dcfce7", tx:"#15803d", dot:"#22c55e" },
  Inactive:    { bg:"#f1f5f9", tx:"#475569", dot:"#94a3b8" },
  Development: { bg:"#fef3c7", tx:"#92400e", dot:"#f59e0b" },
  Discontinued:{ bg:"#fee2e2", tx:"#991b1b", dot:"#ef4444" },
};

/* ─── MINI RING ──────────────────────────────────────────────── */
function Ring({ pct, color, size = 26 }) {
  const r = (size - 4) / 2;
  const c2 = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e9ecef" strokeWidth={3}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${(pct/100)*c2} ${c2}`} strokeLinecap="round"
        style={{ transition:"stroke-dasharray .4s cubic-bezier(.4,0,.2,1)" }}/>
    </svg>
  );
}

/* ─── FIELD INPUT ────────────────────────────────────────────── */
function Inp({ f, val, onChange, onFocus, onBlur, focused, acc, opts, disabled, editItem }) {
  const base = {
    width:"100%", fontSize:12, outline:"none", boxSizing:"border-box",
    fontFamily: f.mono ? "'IBM Plex Mono',monospace" : "'Nunito Sans',sans-serif",
    transition:"all .15s",
    background: focused ? C.inputBgOn : val ? C.inputBgOn : C.inputBg,
    color: f.auto ? C.purple : C.text,
    fontWeight: f.auto ? 700 : 500,
    border: `1.5px solid ${focused ? acc : val ? "#c9d3df" : C.border}`,
    boxShadow: focused ? `0 0 0 3px ${acc}18` : "none",
    borderRadius: 6, padding:"6px 9px", display:"block",
  };

  if (f.auto) return (
    <div style={{ ...base, cursor:"not-allowed", minHeight:32, display:"flex", alignItems:"center",
      background:"#f5f0ff", border:`1.5px solid ${C.purple}22`, boxShadow:"none", color:C.purple }}>
      {val || <span style={{ color:"#c4b5fd", fontSize:10, fontStyle:"italic" }}>GAS auto-fills</span>}
    </div>
  );

  if (f.type === 'code' && editItem) return (
    <div style={{ ...base, cursor:'default', background:C.faint, fontWeight:700, minHeight:32,
      display:'flex', alignItems:'center', fontFamily:"'IBM Plex Mono',monospace" }}>
      {val}
    </div>
  );

  if (f.type === "select") return (
    <div style={{ position:"relative" }}>
      <select value={val||""} onChange={e=>onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
        disabled={disabled}
        style={{ ...base, appearance:"none", paddingRight:26,
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
        <option value="">—</option>
        {(opts||[]).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
        color:C.muted, fontSize:10, pointerEvents:"none" }}>▾</span>
    </div>
  );

  if (f.type === "textarea") return (
    <textarea value={val||""} onChange={e=>onChange(e.target.value)}
      onFocus={onFocus} onBlur={onBlur}
      rows={2}
      style={{ ...base, resize:"vertical", minHeight:48 }}/>
  );

  return (
    <input type={f.type==="number"?"number":"text"} value={val||""}
      onChange={e=>onChange(f.type==="code" ? e.target.value.toUpperCase() : e.target.value)}
      onFocus={onFocus} onBlur={onBlur}
      placeholder={f.type==="code" ? "e.g. 5249HP" : ""}
      maxLength={f.type==="code" ? 7 : undefined}
      style={base}/>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEW VIEW MODAL — create or edit a custom view
═══════════════════════════════════════════════════════════════ */
function NewViewModal({ existingNames, onSave, onClose, editView = null }) {
  const isEdit = !!editView;
  const [name, setName] = useState(editView?.name || "");
  const [selFields, setSelFields] = useState(new Set(editView?.fields || ALL.map(f=>f.key)));
  const [err, setErr] = useState("");

  const RESERVED = ["Default","All Fields","Quick Entry","Pricing & Tax","Fabric Focus"];

  const toggleField = k => setSelFields(p => { const n=new Set(p); n.has(k)?n.delete(k):n.add(k); return n; });
  const toggleSec = sec => {
    const keys = sec.fields.map(f=>f.key);
    const allOn = keys.every(k=>selFields.has(k));
    setSelFields(p => { const n=new Set(p); keys.forEach(k=>allOn?n.delete(k):n.add(k)); return n; });
  };

  const handleSave = () => {
    const t = name.trim();
    if (!t)                            { setErr("View name is required"); return; }
    if (RESERVED.includes(t))          { setErr(`"${t}" is a reserved name`); return; }
    if (!isEdit && existingNames.includes(t)) { setErr("Name already exists"); return; }
    if (selFields.size === 0)          { setErr("Select at least one field"); return; }
    onSave({ name:t, fields:[...selFields], icon:"📌", color:"#6c3fc5", isSystem:false,
      id: editView?.id || `cv_${Date.now()}` });
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300,
      background:"rgba(15,23,42,.48)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff", borderRadius:13, width:490, maxHeight:"88vh",
        boxShadow:"0 24px 64px rgba(0,0,0,.22)",
        display:"flex", flexDirection:"column", overflow:"hidden",
        animation:"ccModalIn .22s cubic-bezier(.34,1.56,.64,1)" }}>

        {/* Header */}
        <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", gap:10,
          background:"linear-gradient(135deg,#faf7ff,#fff)" }}>
          <div style={{ width:32, height:32, borderRadius:8, background:C.purpleSoft,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📌</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:900, color:C.text }}>
              {isEdit ? `Edit View — "${editView.name}"` : "Create New View"}
            </div>
            <div style={{ fontSize:9, color:C.muted, marginTop:1 }}>
              Name it and pick exactly which fields to show
            </div>
          </div>
          <button onClick={onClose} style={{ border:"none", background:"none",
            fontSize:18, color:C.muted, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>

        {/* Name */}
        <div style={{ padding:"12px 18px 8px" }}>
          <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase",
            letterSpacing:.5, marginBottom:5 }}>View Name</div>
          <input value={name} onChange={e=>{setName(e.target.value);setErr("");}}
            placeholder="e.g. Buyer Fields, Weekend Entry, Style Focus…"
            style={{ width:"100%", padding:"7px 11px",
              border:`1.5px solid ${err?C.red:C.border}`,
              borderRadius:7, fontSize:12, outline:"none", fontFamily:"inherit",
              background:err?C.redSoft:"#f9fafb", color:C.text,
              transition:"border-color .15s" }}/>
          {err && <div style={{ fontSize:9, color:C.red, marginTop:4, fontWeight:700 }}>⚠ {err}</div>}
        </div>

        {/* Field picker header */}
        <div style={{ padding:"2px 18px 8px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase", letterSpacing:.5 }}>
            Fields to Include
            <span style={{ color:C.purple, marginLeft:4 }}>({selFields.size} selected)</span>
          </div>
          <div style={{ display:"flex", gap:5 }}>
            {[
              { l:"All",      fn:()=>setSelFields(new Set(ALL.map(f=>f.key))), c:C.sub },
              { l:"Req only", fn:()=>setSelFields(new Set(REQ.map(f=>f.key))), c:C.orange },
              { l:"Clear",    fn:()=>setSelFields(new Set()),                  c:C.muted },
            ].map(b=>(
              <button key={b.l} onClick={b.fn} style={{ padding:"2px 9px",
                border:`1px solid ${C.border}`, borderRadius:6,
                background:C.faint, color:b.c, fontSize:8.5, fontWeight:800, cursor:"pointer" }}>
                {b.l}
              </button>
            ))}
          </div>
        </div>

        {/* Sections scroll */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 18px 16px" }}>
          {SECTIONS.map(sec => {
            const allOn  = sec.fields.every(f=>selFields.has(f.key));
            const someOn = sec.fields.some(f=>selFields.has(f.key));
            const cnt    = sec.fields.filter(f=>selFields.has(f.key)).length;
            return (
              <div key={sec.id} style={{ marginBottom:9, border:`1px solid ${C.border}`,
                borderRadius:9, overflow:"hidden" }}>
                <div onClick={()=>toggleSec(sec)} style={{
                  padding:"7px 12px", cursor:"pointer",
                  background:allOn?sec.acc+"10":someOn?"#fafafa":"#f8f9fb",
                  display:"flex", alignItems:"center", gap:8,
                  borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:17, height:17, borderRadius:4, flexShrink:0,
                    border:`2px solid ${allOn?sec.acc:someOn?sec.acc+"80":C.border}`,
                    background:allOn?sec.acc:"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {allOn  && <span style={{ fontSize:9, color:"#fff" }}>✓</span>}
                    {!allOn && someOn && <span style={{ width:6, height:2, background:sec.acc, borderRadius:1, display:"block" }}/>}
                  </div>
                  <span style={{ fontSize:12 }}>{sec.icon}</span>
                  <span style={{ fontSize:10.5, fontWeight:800, color:allOn?sec.acc:C.text, flex:1 }}>
                    {sec.label}
                  </span>
                  <span style={{ fontSize:8.5, color:C.muted }}>{cnt}/{sec.fields.length}</span>
                </div>
                <div style={{ padding:"7px 12px 9px", display:"flex", flexWrap:"wrap", gap:5 }}>
                  {sec.fields.map(f => {
                    const on = selFields.has(f.key);
                    return (
                      <button key={f.key} onClick={()=>toggleField(f.key)} style={{
                        padding:"3px 9px", borderRadius:9, fontSize:9, fontWeight:700,
                        cursor:"pointer", transition:"all .12s",
                        border:`1.5px solid ${on?sec.acc+"70":C.border}`,
                        background:on?sec.acc+"12":"#f9fafb",
                        color:on?sec.acc:C.muted,
                        display:"flex", alignItems:"center", gap:4 }}>
                        {f.auto && <span style={{ fontSize:7, color:C.purple }}>←</span>}
                        {f.req && !f.auto && <span style={{ fontSize:7, color:C.red }}>✱</span>}
                        {f.fk  && !f.auto && <span style={{ fontSize:7, color:C.blue }}>→</span>}
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:"10px 18px", borderTop:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", gap:8,
          background:"#fafafa" }}>
          <span style={{ fontSize:9, color:C.muted, flex:1 }}>
            {selFields.size} field{selFields.size!==1?"s":""} · {
              SECTIONS.filter(s=>s.fields.some(f=>selFields.has(f.key))).length
            } section{SECTIONS.filter(s=>s.fields.some(f=>selFields.has(f.key))).length!==1?"s":""}
          </span>
          <button onClick={onClose} style={{ padding:"7px 14px",
            border:`1.5px solid ${C.border}`, borderRadius:7,
            background:C.faint, color:C.sub, fontSize:10, fontWeight:800, cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding:"7px 20px", border:"none",
            borderRadius:7, background:C.purple, color:"#fff",
            fontSize:10, fontWeight:900, cursor:"pointer" }}>
            {isEdit ? "💾 Update View" : "✚ Create View"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MANAGE VIEWS PANEL — right-side drawer
═══════════════════════════════════════════════════════════════ */
function ManagePanel({ customViews, activeViewId, onEdit, onDelete, onDuplicate, onClose }) {
  const [confirm, setConfirm] = useState(null);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300,
      background:"rgba(15,23,42,.3)", backdropFilter:"blur(2px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:370,
        background:"#fff", boxShadow:"-10px 0 40px rgba(0,0,0,.14)",
        display:"flex", flexDirection:"column",
        animation:"ccSlideRight .22s ease" }}>

        <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${C.border}`,
          background:C.slate, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16 }}>🔖</span>
          <span style={{ fontSize:11, fontWeight:900, color:"#e2e8f0", flex:1 }}>Manage Views</span>
          <button onClick={onClose} style={{ border:"none", background:"none",
            fontSize:16, color:"#94a3b8", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
          <div style={{ fontSize:8, fontWeight:900, color:C.muted, textTransform:"uppercase",
            letterSpacing:.8, marginBottom:6, padding:"0 4px" }}>System Views (locked)</div>
          {SYSTEM_VIEWS.map(v => (
            <div key={v.id} style={{ display:"flex", alignItems:"center", gap:9,
              padding:"8px 10px", borderRadius:8, marginBottom:4,
              background:C.faint, border:`1px solid ${C.border}` }}>
              <span style={{ fontSize:15 }}>{v.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10.5, fontWeight:800, color:C.text }}>{v.name}</div>
                <div style={{ fontSize:8.5, color:C.muted, marginTop:1 }}>
                  {v.desc} · <b>{v.fields.length}</b> fields
                </div>
              </div>
              <span style={{ fontSize:7.5, padding:"2px 6px", borderRadius:5,
                background:"#f1f5f9", color:"#94a3b8", fontWeight:900 }}>LOCKED</span>
            </div>
          ))}

          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"14px 0 8px" }}>
            <div style={{ flex:1, height:1, background:C.border }}/>
            <span style={{ fontSize:8, fontWeight:900, color:C.muted, textTransform:"uppercase",
              letterSpacing:.8 }}>Custom Views ({customViews.length})</span>
            <div style={{ flex:1, height:1, background:C.border }}/>
          </div>

          {customViews.length === 0 && (
            <div style={{ padding:"28px 0", textAlign:"center", color:C.muted }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📌</div>
              <div style={{ fontSize:11, fontWeight:700, marginBottom:4 }}>No custom views yet</div>
              <div style={{ fontSize:9 }}>Use <b style={{ color:C.orange }}>+ New View</b> to create one.</div>
            </div>
          )}

          {customViews.map(v => {
            const isActive = activeViewId === v.id;
            const isDel    = confirm === v.id;
            return (
              <div key={v.id} style={{ padding:"8px 10px", borderRadius:8, marginBottom:5,
                border:`1.5px solid ${isActive?C.purple+"55":C.border}`,
                background:isActive?C.purpleSoft:"#fff",
                transition:"all .15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>{v.icon||"📌"}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10.5, fontWeight:800,
                        color:isActive?C.purple:C.text }}>{v.name}</span>
                      {isActive && <span style={{ fontSize:7, padding:"1px 5px", borderRadius:4,
                        background:C.purple, color:"#fff", fontWeight:900 }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize:8.5, color:C.muted, marginTop:1 }}>
                      {v.fields.length} fields selected
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>onEdit(v)} style={{ padding:"3px 8px",
                      border:`1px solid ${C.border}`, borderRadius:5,
                      background:C.faint, color:C.sub,
                      fontSize:9, fontWeight:800, cursor:"pointer" }}>✎ Edit</button>
                    <button onClick={()=>onDuplicate(v)} title="Duplicate" style={{ padding:"3px 8px",
                      border:`1px solid ${C.border}`, borderRadius:5,
                      background:C.faint, color:C.sub,
                      fontSize:9, fontWeight:800, cursor:"pointer" }}>⧉</button>
                    <button onClick={()=>setConfirm(isDel?null:v.id)} style={{ padding:"3px 8px",
                      border:`1px solid ${isDel?"#fca5a5":C.border}`, borderRadius:5,
                      background:isDel?"#fff1f1":C.faint,
                      color:isDel?C.red:C.muted,
                      fontSize:9, fontWeight:800, cursor:"pointer" }}>×</button>
                  </div>
                </div>
                {isDel && (
                  <div style={{ display:"flex", alignItems:"center", gap:6,
                    marginTop:8, padding:"6px 8px", borderRadius:7,
                    background:"#fff1f1", border:"1px solid #fca5a5" }}>
                    <span style={{ fontSize:9, color:C.red, flex:1 }}>
                      Delete "<b>{v.name}</b>"? This cannot be undone.
                    </span>
                    <button onClick={()=>{onDelete(v.id);setConfirm(null);}} style={{
                      padding:"3px 10px", border:"none", borderRadius:5,
                      background:C.red, color:"#fff", fontSize:9, fontWeight:900, cursor:"pointer" }}>
                      Delete
                    </button>
                    <button onClick={()=>setConfirm(null)} style={{ padding:"3px 8px",
                      border:`1px solid ${C.border}`, borderRadius:5,
                      background:"#fff", color:C.sub, fontSize:9, cursor:"pointer" }}>Keep</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}`,
          background:C.faint, fontSize:9, color:C.muted, textAlign:"center" }}>
          {SYSTEM_VIEWS.length} system · {customViews.length} custom ·{" "}
          {SYSTEM_VIEWS.length + customViews.length} total views
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FILTER PANEL — field-level filtering
═══════════════════════════════════════════════════════════════ */
function FilterPanel({ filters, setFilters, onClose }) {
  const [search,  setSearch]  = useState(filters.search  || "");
  const [secFilt, setSecFilt] = useState(filters.section || "all");
  const [typFilt, setTypFilt] = useState(filters.type    || "all");

  const apply = () => { setFilters({ search, section:secFilt, type:typFilt }); onClose(); };
  const clear  = () => { setFilters({}); onClose(); };

  const TYPE_OPTS = [
    { v:"all",      l:"All Fields"   },
    { v:"required", l:"✱ Required"   },
    { v:"auto",     l:"← Auto only"  },
    { v:"fk",       l:"→ FK fields"  },
    { v:"text",     l:"Text fields"  },
    { v:"number",   l:"Number only"  },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300,
      background:"rgba(15,23,42,.28)", backdropFilter:"blur(2px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:300,
        background:"#fff", boxShadow:"-10px 0 40px rgba(0,0,0,.12)",
        display:"flex", flexDirection:"column",
        animation:"ccSlideRight .22s ease" }}>

        <div style={{ padding:"13px 14px 11px", borderBottom:`1px solid ${C.border}`,
          background:C.slate, display:"flex", alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:900, color:"#e2e8f0", flex:1 }}>⊟ Filter Fields</span>
          <button onClick={onClose} style={{ border:"none", background:"none",
            fontSize:16, color:"#94a3b8", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase",
              letterSpacing:.5, marginBottom:6 }}>Search Fields</div>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)",
                fontSize:13, color:C.muted, pointerEvents:"none" }}>⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Field name or key…"
                style={{ width:"100%", padding:"6px 28px", border:`1.5px solid ${C.border}`,
                  borderRadius:7, fontSize:11, outline:"none", background:"#f9fafb",
                  fontFamily:"inherit", color:C.text }}/>
              {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",
                right:8, top:"50%", transform:"translateY(-50%)",
                border:"none", background:"none", color:C.muted, cursor:"pointer", fontSize:13 }}>×</button>}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase",
              letterSpacing:.5, marginBottom:7 }}>Section</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {[{v:"all",l:"All Sections"}, ...SECTIONS.map(s=>({v:s.id,l:`${s.icon} ${s.label}`}))].map(o=>(
                <label key={o.v} style={{ display:"flex", alignItems:"center", gap:8,
                  padding:"6px 9px", borderRadius:6, cursor:"pointer",
                  background:secFilt===o.v?C.faint:"transparent" }}>
                  <input type="radio" checked={secFilt===o.v} onChange={()=>setSecFilt(o.v)}
                    style={{ accentColor:C.orange }}/>
                  <span style={{ fontSize:10.5, color:secFilt===o.v?C.text:C.sub,
                    fontWeight:secFilt===o.v?700:400 }}>{o.l}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase",
              letterSpacing:.5, marginBottom:7 }}>Field Type</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {TYPE_OPTS.map(o=>(
                <button key={o.v} onClick={()=>setTypFilt(o.v)} style={{
                  padding:"4px 10px", borderRadius:9, fontSize:9.5, fontWeight:700,
                  cursor:"pointer", transition:"all .12s",
                  border:`1.5px solid ${typFilt===o.v?C.orange:C.border}`,
                  background:typFilt===o.v?C.orangeSoft:"#f9fafb",
                  color:typFilt===o.v?C.orange:C.muted }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`,
          display:"flex", gap:8 }}>
          <button onClick={clear} style={{ flex:1, padding:"7px", border:`1px solid ${C.border}`,
            borderRadius:7, background:C.faint, color:C.sub,
            fontSize:10, fontWeight:800, cursor:"pointer" }}>Clear</button>
          <button onClick={apply} style={{ flex:2, padding:"7px", border:"none",
            borderRadius:7, background:C.orange, color:"#fff",
            fontSize:10, fontWeight:900, cursor:"pointer" }}>Apply Filter</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SORT PANEL — multi-rule sort with drag reorder
═══════════════════════════════════════════════════════════════ */
function SortPanel({ sorts, setSorts, onClose }) {
  const sortable = ALL.filter(f => !f.auto);
  const [local, setLocal] = useState(sorts.length ? sorts.map(s=>({...s})) : []);
  const dragIdx = useRef(null);

  const addSort    = () => { const used=local.map(s=>s.field); const next=sortable.find(f=>!used.includes(f.key)); if(!next) return; setLocal(p=>[...p,{id:Date.now(),field:next.key,dir:"asc"}]); };
  const removeSort = id  => setLocal(p=>p.filter(s=>s.id!==id));
  const updateSort = (id,patch) => setLocal(p=>p.map(s=>s.id===id?{...s,...patch}:s));

  const PRESETS = [
    { l:"Code A→Z",   s:[{id:1,field:"code",  dir:"asc"}] },
    { l:"Code Z→A",   s:[{id:1,field:"code",  dir:"desc"}] },
    { l:"Status",     s:[{id:1,field:"status",dir:"asc"}] },
    { l:"MRP ↑",      s:[{id:1,field:"mrp",   dir:"asc"}] },
    { l:"MRP ↓",      s:[{id:1,field:"mrp",   dir:"desc"}] },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300,
      background:"rgba(15,23,42,.28)", backdropFilter:"blur(2px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:340,
        background:"#fff", boxShadow:"-10px 0 40px rgba(0,0,0,.12)",
        display:"flex", flexDirection:"column",
        animation:"ccSlideRight .22s ease" }}>

        <div style={{ padding:"13px 14px 11px", borderBottom:`1px solid ${C.border}`,
          background:C.slate, display:"flex", alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:900, color:"#e2e8f0", flex:1 }}>↕ Sort Fields</span>
          <button onClick={onClose} style={{ border:"none", background:"none",
            fontSize:16, color:"#94a3b8", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase",
              letterSpacing:.5, marginBottom:8 }}>Quick Presets</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {PRESETS.map(p=>(
                <button key={p.l} onClick={()=>setLocal(p.s.map((s,i)=>({...s,id:Date.now()+i})))} style={{
                  padding:"4px 10px", borderRadius:8, fontSize:9.5, fontWeight:700,
                  cursor:"pointer", border:`1.5px solid ${C.border}`,
                  background:"#f9fafb", color:C.sub, transition:"all .12s",
                  fontFamily:"inherit" }}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase", letterSpacing:.5 }}>
              Sort Rules {local.length>0&&<span style={{ color:C.orange }}>({local.length})</span>}
            </div>
            <button onClick={addSort} disabled={local.length>=sortable.length} style={{
              padding:"3px 9px", border:`1.5px dashed ${C.orange}`, borderRadius:6,
              background:C.orangeSoft, color:C.orange,
              fontSize:9, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
              + Add Rule
            </button>
          </div>

          {local.length === 0 && (
            <div style={{ padding:"18px 0", textAlign:"center", color:C.muted, fontSize:10 }}>
              No sort rules. Add one above or pick a preset.
            </div>
          )}

          {local.map((s,i) => {
            const fObj = ALL.find(f=>f.key===s.field);
            return (
              <div key={s.id} draggable
                onDragStart={()=>{ dragIdx.current=i; }}
                onDragOver={e=>e.preventDefault()}
                onDrop={()=>{
                  if(dragIdx.current===null||dragIdx.current===i) return;
                  const arr=[...local]; const [item]=arr.splice(dragIdx.current,1);
                  arr.splice(i,0,item); setLocal(arr); dragIdx.current=null;
                }}
                style={{ display:"flex", alignItems:"center", gap:6,
                  padding:"7px 10px", marginBottom:5, borderRadius:7,
                  border:`1.5px solid ${C.border}`, background:"#fff",
                  cursor:"grab", transition:"box-shadow .12s",
                  boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ width:19,height:19,borderRadius:"50%",flexShrink:0,
                  background:C.orange,color:"#fff",fontSize:9,fontWeight:900,
                  display:"flex",alignItems:"center",justifyContent:"center" }}>{i+1}</div>
                <span style={{ fontSize:11, color:C.muted, cursor:"grab" }}>⠿</span>
                <select value={s.field} onChange={e=>updateSort(s.id,{field:e.target.value})}
                  style={{ flex:1, padding:"4px 6px", border:`1px solid ${C.border}`,
                    borderRadius:5, fontSize:10, outline:"none",
                    background:"#f9fafb", fontFamily:"inherit" }}>
                  {sortable.map(f=>(
                    <option key={f.key} value={f.key}
                      disabled={local.some(ls=>ls.id!==s.id&&ls.field===f.key)}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <button onClick={()=>updateSort(s.id,{dir:s.dir==="asc"?"desc":"asc"})} style={{
                  padding:"4px 9px", border:`1.5px solid ${C.border}`,
                  borderRadius:5, background:"#f9fafb", color:C.sub,
                  fontSize:9, fontWeight:800, cursor:"pointer",
                  whiteSpace:"nowrap", fontFamily:"inherit" }}>
                  {s.dir==="asc"
                    ? (fObj?.type==="number"?"1→9":"A→Z")
                    : (fObj?.type==="number"?"9→1":"Z→A")}
                </button>
                <button onClick={()=>removeSort(s.id)} style={{ border:"none", background:"none",
                  color:C.muted, cursor:"pointer", fontSize:15, padding:"0 2px" }}>×</button>
              </div>
            );
          })}
        </div>

        <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`,
          display:"flex", gap:8 }}>
          <button onClick={()=>{setSorts([]);setLocal([]);onClose();}} style={{
            flex:1, padding:"7px", border:`1px solid ${C.border}`,
            borderRadius:7, background:C.faint, color:C.sub,
            fontSize:10, fontWeight:800, cursor:"pointer" }}>Clear All</button>
          <button onClick={()=>{setSorts(local);onClose();}} style={{
            flex:2, padding:"7px", border:"none",
            borderRadius:7, background:C.slate, color:"#fff",
            fontSize:10, fontWeight:900, cursor:"pointer" }}>↕ Apply Sort</button>
        </div>
      </div>
    </div>
  );
}

/* ─── PREVIEW PANEL ──────────────────────────────────────────── */
function Preview({ fd }) {
  const filled = MAN.filter(f => fd[f.key]).length;
  const pct    = Math.round(filled / MAN.length * 100);
  const markup = fd.wsp && fd.mrp ? Math.round((+fd.mrp - +fd.wsp) / +fd.wsp * 100) : null;
  const st     = fd.status ? STATUS_COLORS[fd.status] : null;
  const imgSrc = driveThumbUrl(fd.imageLink);

  return (
    <div style={{
      width:220, flexShrink:0, minHeight:0, background:C.slate,
      borderLeft:`1px solid ${C.slate3}`,
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      <div style={{ padding:"10px 13px 8px", borderBottom:`1px solid ${C.slate3}`,
        display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:8.5, fontWeight:900, color:"#64748b", letterSpacing:1, textTransform:"uppercase", flex:1 }}>Live Preview</span>
        <Ring pct={pct} color={C.orange} size={24}/>
        <span style={{ fontSize:9, fontWeight:900, color:C.orange }}>{pct}%</span>
      </div>

      <div style={{ flex:1, minHeight:0, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:8 }}>

        {/* Image card */}
        <div style={{ height:120, borderRadius:9,
          background: imgSrc ? '#0e1620' : "linear-gradient(135deg,#253347,#1a2839)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          border: imgSrc ? `1px solid ${C.slate3}` : "1px dashed #3d5166",
          position:"relative", overflow:"hidden" }}>
          {imgSrc
            ? <img src={imgSrc} alt="" referrerPolicy="no-referrer"
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                onError={e => { e.target.style.display='none'; }} />
            : <>
                <div style={{ fontSize:28, marginBottom:4 }}>👕</div>
                <div style={{ fontSize:8, color:"#4d6070" }}>No image linked</div>
              </>
          }
          {st && (
            <div style={{ position:"absolute", top:7, right:7, display:"flex", alignItems:"center", gap:3,
              padding:"2px 7px", borderRadius:10, background:"rgba(0,0,0,.55)", backdropFilter:"blur(4px)" }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:st.dot }}/>
              <span style={{ fontSize:8, fontWeight:900, color:"#fff" }}>{fd.status}</span>
            </div>
          )}
          {fd.code && (
            <div style={{ position:"absolute", bottom:7, left:8,
              padding:"2px 7px", borderRadius:4, background:"rgba(0,0,0,.6)",
              fontFamily:"'IBM Plex Mono',monospace", fontSize:9.5, fontWeight:900, color:C.orange }}>
              {fd.code}
            </div>
          )}
        </div>

        {/* Sketch thumbnails */}
        {fd.sketchLink && (() => {
          const links = fd.sketchLink.split('|').map(s => s.trim()).filter(Boolean);
          const thumbs = links.map(l => driveThumbUrl(l)).filter(Boolean);
          if (!thumbs.length) return null;
          return (
            <div style={{ background:C.slate2, borderRadius:6, padding:"7px 9px", border:`1px solid ${C.slate3}` }}>
              <div style={{ fontSize:7.5, fontWeight:900, color:"#4d6070", textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>
                Sketch{thumbs.length > 1 ? 'es' : ''}
              </div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {thumbs.map((src, i) => (
                  <img key={i} src={src} alt={'Sketch '+(i+1)} referrerPolicy="no-referrer"
                    style={{ width:56, height:56, objectFit:"cover", borderRadius:5, border:"1px solid #3d5166" }}
                    onError={e => { e.target.style.display='none'; }} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Name block */}
        {(fd.desc || fd.shortName || fd.buyerStyle) ? (
          <div>
            {fd.desc && <div style={{ fontSize:12, fontWeight:800, color:"#e2e8f0", lineHeight:1.4, marginBottom:2 }}>{fd.desc}</div>}
            {fd.shortName && <div style={{ fontSize:9, color:"#64748b" }}>"{fd.shortName}"</div>}
            {fd.buyerStyle && <div style={{ fontSize:8, color:"#4d6070", marginTop:1 }}>Buyer: {fd.buyerStyle}</div>}
          </div>
        ) : (
          <div style={{ fontSize:10, color:"#3d5166", fontStyle:"italic", textAlign:"center", padding:"4px 0" }}>No description yet</div>
        )}

        {/* Attribute chips */}
        {(fd.l1Division||fd.gender||fd.l2Category||fd.l3Style||fd.fitType||fd.season) && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
            {[
              fd.l1Division  && [fd.l1Division,"#1a1e2e","#f97316"],
              fd.gender      && [fd.gender,    "#1e3a5f","#7dd3fc"],
              fd.l2Category  && [fd.l2Category,"#14291a","#86efac"],
              fd.l3Style     && [fd.l3Style,   "#251c35","#c4b5fd"],
              fd.fitType     && [fd.fitType,   "#2a1e0a","#fcd34d"],
              fd.season      && [fd.season,    "#1a2a3a","#93c5fd"],
              fd.neckline    && [fd.neckline,  "#1e1e2e","#a5b4fc"],
              fd.sleeveType  && [fd.sleeveType,"#1a1a1a","#d4d4d8"],
            ].filter(Boolean).map(([lbl,bg,tx],i)=>(
              <span key={i} style={{ fontSize:7.5, fontWeight:700, padding:"2px 6px",
                borderRadius:8, background:bg, color:tx }}>{lbl}</span>
            ))}
          </div>
        )}

        {/* Fabric */}
        {(fd.mainFabric||fd.colorCodes||fd.sizeRange) && (
          <div style={{ background:C.slate2, borderRadius:6, padding:"7px 9px",
            border:`1px solid ${C.slate3}` }}>
            <div style={{ fontSize:7.5, fontWeight:900, color:"#4d6070", textTransform:"uppercase", letterSpacing:.8, marginBottom:4 }}>Fabric</div>
            {fd.mainFabric && <div style={{ fontSize:9, color:"#c4b5fd", marginBottom:1 }}>🧵 {fd.mainFabric.split("—")[1]?.trim()||fd.mainFabric}</div>}
            {fd.colorCodes && <div style={{ fontSize:9, color:"#a5b4fc", marginBottom:1 }}>🎨 {fd.colorCodes}</div>}
            {fd.sizeRange  && <div style={{ fontSize:9, color:"#94a3b8" }}>📏 {fd.sizeRange}</div>}
          </div>
        )}

        {/* Pricing */}
        {(fd.wsp||fd.mrp) && (
          <div style={{ background:"#1a2030", borderRadius:6, padding:"8px 9px",
            border:"1px solid #2a3545" }}>
            <div style={{ fontSize:7.5, fontWeight:900, color:"#4d6070", textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Pricing</div>
            <div style={{ display:"flex", gap:8, marginBottom: (fd.hsnCode||fd.gstPct) ? 6 : 0 }}>
              {fd.wsp && <div style={{ flex:1 }}>
                <div style={{ fontSize:7.5, color:"#4d6070" }}>WSP</div>
                <div style={{ fontSize:14, fontWeight:900, color:"#e2e8f0", fontFamily:"'IBM Plex Mono',monospace" }}>₹{fd.wsp}</div>
              </div>}
              {fd.mrp && <div style={{ flex:1 }}>
                <div style={{ fontSize:7.5, color:"#4d6070" }}>MRP</div>
                <div style={{ fontSize:14, fontWeight:900, color:"#e2e8f0", fontFamily:"'IBM Plex Mono',monospace" }}>₹{fd.mrp}</div>
              </div>}
              {markup !== null && <div style={{ flex:1 }}>
                <div style={{ fontSize:7.5, color:"#4d6070" }}>Markup</div>
                <div style={{ fontSize:14, fontWeight:900, fontFamily:"'IBM Plex Mono',monospace",
                  color: markup >= 80 ? "#4ade80" : markup >= 40 ? "#fcd34d" : "#f87171" }}>{markup}%</div>
              </div>}
            </div>
            {(fd.hsnCode||fd.gstPct) && (
              <div style={{ display:"flex", gap:5, paddingTop:5, borderTop:"1px solid #2a3545" }}>
                {fd.hsnCode && <span style={{ fontSize:8, padding:"2px 6px", borderRadius:3, background:"#1e3a5f", color:"#7dd3fc", fontFamily:"monospace" }}>HSN {fd.hsnCode}</span>}
                {fd.gstPct  && <span style={{ fontSize:8, padding:"2px 6px", borderRadius:3, background:"#14291a", color:"#86efac" }}>GST {fd.gstPct}%</span>}
              </div>
            )}
          </div>
        )}

        {/* Barcode */}
        {fd.code && (
          <div style={{ background:"#fff", borderRadius:6, padding:"7px 9px", textAlign:"center",
            border:"1px solid #e2e8f0" }}>
            <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-end",
              gap:1.5, height:28, marginBottom:3 }}>
              {Array.from({length:26}).map((_,i)=>{
                const ch = fd.code[i%fd.code.length];
                const w  = ch?.match(/[0-9]/) ? ((parseInt(ch)%3)+1)*1.5 : 2.2;
                return <div key={i} style={{ width:w, height:i%4===0?28:i%3===0?22:25,
                  background:C.slate, borderRadius:.5 }}/>;
              })}
            </div>
            <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono',monospace",
              fontWeight:900, color:C.slate, letterSpacing:2 }}>{fd.code}</div>
            {fd.shortName && <div style={{ fontSize:7.5, color:C.muted, marginTop:1 }}>{fd.shortName}</div>}
          </div>
        )}

        {/* Empty state */}
        {!fd.code && !fd.desc && !fd.wsp && (
          <div style={{ padding:"16px 0", textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:5 }}>✦</div>
            <div style={{ fontSize:9.5, color:"#3d5166", lineHeight:1.6 }}>
              Start filling fields<br/>to see a live preview
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — ArticleDataEntryForm V3
═══════════════════════════════════════════════════════════════ */
export default function ArticleDataEntryForm({
  M, A, uff, dff,
  form, setForm,
  editItem,
  formErrors, setFormErrors,
  handleSave, handleClear,
  divisions, l2ByDiv, l3ByL2, l2Hsn,
  genderOpts, fitOpts, neckOpts, sleeveOpts, statusOpts, seasonOpts,
  sizeRangeOpts, colourOpts,
  setL1Division, setL2Category, setL3Style,
  HSN_GST_MAP, data,
}) {
  const [open,  setOpen]  = useState({ identity:true, details:true, fabric:true, pricing:true, status:true });
  const [focus, setFoc]   = useState(null);
  const [shake, setShk]   = useState(false);
  const [ok,    setOk]    = useState(false);

  /* ── Views state ── */
  const [activeViewId,  setActiveViewId] = useState("all");
  const [customViews,   setCustomViews]  = useState([
    { id:"cv_buyer", name:"Buyer Entry", icon:"🏷️", color:"#0891b2", isSystem:false,
      fields:["code","desc","shortName","buyerStyle","l1Division","l2Category","gender","season","status"] },
  ]);
  const [showNewView,  setShowNewView]  = useState(false);
  const [editingView,  setEditingView]  = useState(null);
  const [showManage,   setShowManage]   = useState(false);
  const [showFilter,   setShowFilter]   = useState(false);
  const [showSort,     setShowSort]     = useState(false);
  const [fieldFilters, setFieldFilters] = useState({});
  const [sorts,        setSorts]        = useState([]);

  // Inject CSS
  useEffect(() => {
    const id = 'cc-data-entry-v3-css';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        @keyframes ccShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
        @keyframes ccFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ccModalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes ccSlideRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        .frow{transition:background .12s}
        .frow:hover{background:#f5f7fb}
        .vpill:hover{opacity:.85}
        select option{background:#fff;color:#1a2332}
      `;
      document.head.appendChild(style);
    }
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  const toggle = useCallback(id => setOpen(p => ({ ...p, [id]: !p[id] })), []);

  /* ── Derived: views ── */
  const allViews   = useMemo(()=>[...SYSTEM_VIEWS,...customViews],[customViews]);
  const activeView = allViews.find(v=>v.id===activeViewId)||SYSTEM_VIEWS[0];

  const visibleFieldKeys = useMemo(()=>{
    let keys = [...activeView.fields];
    const { section, type, search } = fieldFilters;
    if (section && section !== "all") {
      const sec = SECTIONS.find(s=>s.id===section);
      keys = keys.filter(k => sec?.fields.some(f=>f.key===k));
    }
    if (type && type !== "all") {
      keys = keys.filter(k => {
        const f = ALL.find(x=>x.key===k); if(!f) return false;
        if(type==="required") return f.req && !f.auto;
        if(type==="auto")     return f.auto;
        if(type==="fk")       return f.fk && !f.auto;
        if(type==="text")     return ["text","code","textarea"].includes(f.type) && !f.auto;
        if(type==="number")   return f.type==="number";
        return true;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      keys = keys.filter(k => {
        const f = ALL.find(x=>x.key===k);
        return f && (f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q));
      });
    }
    return new Set(keys);
  },[activeView,fieldFilters]);

  const hasFilter = !!(fieldFilters.section || fieldFilters.type || fieldFilters.search);
  const hasSort   = sorts.length > 0;
  const existingNames = allViews.map(v=>v.name);

  /* ── View CRUD ── */
  const handleSaveView = vd => {
    if(editingView) setCustomViews(p=>p.map(v=>v.id===vd.id?vd:v));
    else { setCustomViews(p=>[...p,vd]); setActiveViewId(vd.id); }
    setShowNewView(false); setEditingView(null);
  };
  const handleDeleteView    = id => { setCustomViews(p=>p.filter(v=>v.id!==id)); if(activeViewId===id) setActiveViewId("all"); };
  const handleDuplicateView = v  => setCustomViews(p=>[...p,{...v,id:`cv_${Date.now()}`,name:`${v.name} (copy)`,isSystem:false}]);

  // Computed auto values
  const markupVal = useMemo(() => {
    const w = parseFloat(form.wsp), m = parseFloat(form.mrp);
    if (w > 0 && m > 0) return ((m - w) / w * 100).toFixed(1);
    return '';
  }, [form.wsp, form.mrp]);

  const markdownVal = useMemo(() => {
    const w = parseFloat(form.wsp), m = parseFloat(form.mrp);
    if (w > 0 && m > 0) return ((m - w) / m * 100).toFixed(1);
    return '';
  }, [form.wsp, form.mrp]);

  const getVal = useCallback((key) => {
    if (key === 'markupPct') return markupVal;
    if (key === 'markdownPct') return markdownVal;
    return form[key];
  }, [form, markupVal, markdownVal]);

  // Resolve dropdown options
  const resolveOpts = useCallback((key) => {
    switch (key) {
      case 'l1Division':  return divisions;
      case 'l2Category':  return l2ByDiv[form.l1Division] || [];
      case 'l3Style':     return l3ByL2[form.l2Category] || [];
      case 'gender':      return genderOpts;
      case 'fitType':     return fitOpts;
      case 'neckline':    return neckOpts;
      case 'sleeveType':  return sleeveOpts;
      case 'season':      return seasonOpts;
      case 'colorCodes':  return colourOpts;
      case 'sizeRange':   return sizeRangeOpts;
      case 'status':      return statusOpts;
      case 'hsnCode':     return Object.keys(HSN_GST_MAP);
      case 'mainFabric':  return [];
      default:            return null;
    }
  }, [divisions, l2ByDiv, l3ByL2, form.l1Division, form.l2Category,
      genderOpts, fitOpts, neckOpts, sleeveOpts, statusOpts, seasonOpts,
      sizeRangeOpts, colourOpts, HSN_GST_MAP]);

  // onChange routing — L1/L2/L3 cascade
  const handleChange = useCallback((key, value) => {
    setFormErrors({});
    if (key === 'l1Division') return setL1Division(value);
    if (key === 'l2Category') return setL2Category(value);
    if (key === 'l3Style') return setL3Style(value);
    if (key === 'code') return setForm(f => ({ ...f, code: value.toUpperCase() }));
    setForm(f => ({ ...f, [key]: value }));
  }, [setL1Division, setL2Category, setL3Style, setForm, setFormErrors]);

  // Disabled logic for cascade selects
  const isDisabled = useCallback((key) => {
    if (key === 'l2Category') return !form.l1Division;
    if (key === 'l3Style') return !form.l2Category;
    return false;
  }, [form.l1Division, form.l2Category]);

  // Progress
  const filled  = MAN.filter(f => form[f.key]).length;
  const reqLeft = REQ.filter(f => !form[f.key]);
  const isDirty = filled > 0;
  const visibleAll = ALL.filter(f => visibleFieldKeys.has(f.key));

  // Save wrapper — awaits GAS call, shows ok only on success
  const onSave = useCallback(async () => {
    if (reqLeft.length > 0) { setShk(true); setTimeout(()=>setShk(false),600); return; }
    try {
      await handleSave();
      setOk(true); setTimeout(()=>setOk(false),2500);
    } catch {
      // handleSave already set formErrors; shake to signal failure
      setShk(true); setTimeout(()=>setShk(false),600);
    }
  }, [reqLeft.length, handleSave]);

  // Clear wrapper
  const onClear = useCallback(() => {
    handleClear();
    setOk(false);
  }, [handleClear]);

  // ─── RENDER ───
  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0, overflow:"hidden",
      fontFamily:"'Nunito Sans',sans-serif", background:C.bg, color:C.text }}>

      {/* ══ SINGLE VIEWS BAR ══ */}
      <div style={{ background:C.surface, borderBottom:`2px solid ${C.border}`,
        flexShrink:0, padding:"0 12px",
        display:"flex", alignItems:"center", gap:4,
        minHeight:40, overflowX:"auto" }}>

        <span style={{ fontSize:8, fontWeight:900, color:C.muted, letterSpacing:1,
          textTransform:"uppercase", flexShrink:0, marginRight:4 }}>VIEWS:</span>

        {allViews.map(v => {
          const isActive = activeViewId === v.id;
          return (
            <button key={v.id} className="vpill"
              onClick={()=>setActiveViewId(isActive?"all":v.id)}
              title={v.desc ? `${v.name} — ${v.desc} · ${v.fields.length} fields` : `${v.name} · ${v.fields.length} fields`}
              style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"5px 11px", borderRadius:8, flexShrink:0,
                cursor:"pointer", transition:"all .15s",
                border:`1.5px solid ${isActive?v.color:C.border}`,
                background:isActive?v.color+"18":"#f9fafb",
                fontFamily:"inherit",
              }}>
              <span style={{ fontSize:11 }}>{v.icon}</span>
              <span style={{ fontSize:9.5, fontWeight:isActive?900:700,
                color:isActive?v.color:C.sub, whiteSpace:"nowrap" }}>
                {v.name}
              </span>
              {isActive && (
                <>
                  <span style={{ width:5, height:5, borderRadius:"50%",
                    background:v.color, flexShrink:0 }}/>
                  <span style={{ fontSize:7.5, padding:"1px 5px", borderRadius:6,
                    background:v.color+"22", color:v.color, fontWeight:900,
                    whiteSpace:"nowrap" }}>
                    {v.fields.length}f
                  </span>
                </>
              )}
              {v.isSystem && !isActive && (
                <span style={{ fontSize:7, padding:"0 3px", borderRadius:3,
                  background:"#f1f5f9", color:"#b0bac5", fontWeight:900 }}>SYS</span>
              )}
            </button>
          );
        })}

        <div style={{ width:1, height:22, background:C.border, flexShrink:0, margin:"0 3px" }}/>

        <button onClick={()=>setShowFilter(true)} style={{
          display:"flex", alignItems:"center", gap:4, padding:"5px 10px",
          borderRadius:8, cursor:"pointer", flexShrink:0, fontFamily:"inherit",
          border:`1.5px solid ${hasFilter?C.orange:C.border}`,
          background:hasFilter?C.orangeSoft:"#f9fafb",
          color:hasFilter?C.orange:C.sub,
          fontSize:9.5, fontWeight:800, transition:"all .15s" }}>
          ⊟ Filter
          {hasFilter && <span style={{ fontSize:7.5, padding:"1px 5px", borderRadius:8,
            background:C.orange, color:"#fff", fontWeight:900 }}>ON</span>}
        </button>

        <button onClick={()=>setShowSort(true)} style={{
          display:"flex", alignItems:"center", gap:4, padding:"5px 10px",
          borderRadius:8, cursor:"pointer", flexShrink:0, fontFamily:"inherit",
          border:`1.5px solid ${hasSort?C.slate:C.border}`,
          background:hasSort?C.slate:"#f9fafb",
          color:hasSort?"#fff":C.sub,
          fontSize:9.5, fontWeight:800, transition:"all .15s" }}>
          ↕ Sort
          {hasSort && <span style={{ fontSize:7.5, padding:"1px 5px", borderRadius:8,
            background:"rgba(255,255,255,.25)", color:"#fff", fontWeight:900 }}>{sorts.length}</span>}
        </button>

        <div style={{ flex:1 }}/>

        <button onClick={()=>{setEditingView(null);setShowNewView(true);}} style={{
          display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
          borderRadius:8, cursor:"pointer", flexShrink:0, fontFamily:"inherit",
          border:`1.5px dashed ${C.orange}`,
          background:C.orangeSoft, color:C.orange,
          fontSize:9.5, fontWeight:900, transition:"all .15s" }}>
          + New View
        </button>

        <button onClick={()=>setShowManage(true)} style={{
          display:"flex", alignItems:"center", gap:4, padding:"5px 12px",
          borderRadius:8, cursor:"pointer", flexShrink:0, fontFamily:"inherit",
          border:`1.5px solid ${C.border}`,
          background:"#f9fafb", color:C.sub,
          fontSize:9.5, fontWeight:800, transition:"all .15s" }}>
          Manage
        </button>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ flex:1, minHeight:0, display:"flex", overflow:"hidden" }}>

        {/* ── FORM AREA (scroll wrapper) ── */}
        <div style={{ flex:1, minHeight:0, overflowY:"auto" }}>
        {/* inner column — grows to content, does NOT have a height constraint */}
        <div style={{ display:"flex", flexDirection:"column", gap:7, padding:"10px 12px", paddingBottom:24 }}>

          {/* Required field warning bar */}
          {reqLeft.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6,
              padding:"6px 10px", borderRadius:7,
              background:C.amberSoft, border:"1px solid #fde68a",
              flexShrink:0, animation:shake?"ccShake .5s ease":"none",
              flexWrap:"wrap" }}>
              <span style={{ fontSize:8.5, fontWeight:900, color:C.amber }}>
                ⚠ {reqLeft.length} required field{reqLeft.length!==1?"s":""} missing:
              </span>
              {reqLeft.slice(0,4).map(f => (
                <button key={f.key} onClick={()=>{
                  const sec=SECTIONS.find(s=>s.fields.find(x=>x.key===f.key));
                  if(sec) setOpen(p=>({...p,[sec.id]:true}));
                  setTimeout(()=>setFoc(f.key),60);
                }} style={{ fontSize:8, padding:"2px 8px", borderRadius:9,
                  border:"none", background:"#fde68a", color:C.amber,
                  fontWeight:800, cursor:"pointer" }}>
                  {f.label}
                </button>
              ))}
              {reqLeft.length>4 && <span style={{ fontSize:8,color:C.amber }}>+{reqLeft.length-4} more</span>}
            </div>
          )}

          {/* Section accordion cards */}
          {SECTIONS.map(sec => {
            const secVisible = sec.fields.filter(f=>visibleFieldKeys.has(f.key));
            if (secVisible.length === 0) return null;

            const isOn = open[sec.id];
            const mf   = secVisible.filter(f=>!f.auto);
            const done = mf.filter(f=>form[f.key]).length;
            const miss = secVisible.filter(f=>f.req&&!f.auto&&!form[f.key]).length;
            const pct  = mf.length>0 ? Math.round(done/mf.length*100) : 100;

            return (
              <div key={sec.id} style={{
                background:C.surface,
                border:`1.5px solid ${isOn ? sec.acc+"35" : C.border}`,
                borderRadius:9,
                overflow:"hidden",
                boxShadow: isOn ? `0 1px 8px ${sec.acc}10` : "none",
                transition:"all .2s",
              }}>

                {/* ── SECTION HEADER ── */}
                <button onClick={()=>toggle(sec.id)} style={{
                  display:"flex", alignItems:"center", gap:9,
                  padding:"9px 13px", width:"100%", border:"none",
                  cursor:"pointer",
                  background: isOn ? sec.acc+"09" : "#fff",
                  borderBottom: isOn ? `1px solid ${sec.acc}18` : "none",
                  transition:"background .15s",
                  fontFamily:"'Nunito Sans',sans-serif", textAlign:"left",
                }}>
                  <div style={{ width:28, height:28, borderRadius:7, flexShrink:0,
                    background:sec.acc+"16", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:14 }}>{sec.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:900,
                      color:isOn?sec.acc:C.text, lineHeight:1 }}>{sec.label}</div>
                    <div style={{ fontSize:8.5, color:C.muted, marginTop:1 }}>
                      {secVisible.length} field{secVisible.length!==1?"s":""} visible
                      {miss>0 && <span style={{ color:"#d97706", fontWeight:800 }}> · ⚠ {miss} required</span>}
                      {miss===0 && done===mf.length && done>0 && <span style={{ color:"#15803d", fontWeight:800 }}> · ✓ Complete</span>}
                    </div>
                  </div>
                  <Ring pct={pct} color={miss>0?"#f59e0b":pct===100&&done>0?"#22c55e":sec.acc} />
                  <span style={{ fontSize:9, color:C.muted, marginLeft:2,
                    transform:isOn?"rotate(180deg)":"rotate(0)",
                    transition:"transform .2s", display:"inline-block" }}>▼</span>
                </button>

                {/* ── FIELDS ── */}
                {isOn && (
                  <div>
                    {secVisible.map((f, fi) => {
                      const isFoc = focus===f.key;
                      const val   = getVal(f.key);
                      const hasErr = formErrors[f.key];
                      const isLast = fi===secVisible.length-1;

                      const showHint = f.hint && f.hint.toLowerCase().split("·")[0].trim()
                        .replace(/[^a-z]/g,"") !== f.label.toLowerCase().replace(/[^a-z]/g,"");

                      return (
                        <div key={f.key} className="frow" style={{
                          display:"grid",
                          gridTemplateColumns:"200px 1fr",
                          alignItems: f.type==="textarea" ? "flex-start" : "center",
                          borderBottom: isLast ? "none" : `1px solid ${C.faint}`,
                          padding:"0",
                          background: isFoc ? sec.acc+"05" : "transparent",
                          transition:"background .12s",
                        }}>

                          {/* ── LABEL CELL ── */}
                          <div style={{
                            padding: f.type==="textarea" ? "9px 12px 9px 14px" : "7px 12px 7px 14px",
                            display:"flex", flexDirection:"column", justifyContent:"center",
                          }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                              <span style={{
                                fontSize:11, fontWeight:800, lineHeight:1.2,
                                color: f.req&&!f.auto ? C.red : f.auto ? C.purple : C.text,
                              }}>
                                {f.req&&!f.auto && <span style={{ color:C.red, marginRight:1 }}>✱</span>}
                                {f.label}
                              </span>
                              {f.auto && (
                                <span style={{ fontSize:7.5, padding:"1px 5px", borderRadius:3,
                                  background:"#ede9fe", color:C.purple, fontWeight:900,
                                  fontFamily:"'IBM Plex Mono',monospace" }}>← AUTO</span>
                              )}
                              {!f.auto && f.fk && (
                                <span style={{ fontSize:7.5, padding:"1px 5px", borderRadius:3,
                                  background:C.blueSoft, color:C.blue, fontWeight:900,
                                  fontFamily:"'IBM Plex Mono',monospace" }}>→ FK</span>
                              )}
                              {!f.auto && !f.fk && f.req && (
                                <span style={{ fontSize:7.5, padding:"1px 5px", borderRadius:3,
                                  background:C.redSoft, color:C.red, fontWeight:900,
                                  fontFamily:"'IBM Plex Mono',monospace" }}>REQ</span>
                              )}
                            </div>
                            <div style={{
                              fontSize:8, fontFamily:"'IBM Plex Mono',monospace",
                              color: isFoc ? sec.acc+"99" : "#c9d3df",
                              marginTop:1, transition:"color .15s",
                            }}>{f.key}</div>
                          </div>

                          {/* ── INPUT CELL ── */}
                          <div style={{
                            padding: f.type==="textarea" ? "7px 14px 7px 0" : "5px 14px 5px 0",
                          }}>
                            {showHint && (
                              <div style={{
                                fontSize:8.5, color: isFoc ? C.sub : C.muted,
                                marginBottom:3, lineHeight:1.3,
                                transition:"color .15s",
                              }}>{f.hint}</div>
                            )}
                            <Inp f={f} val={val} onChange={v=>handleChange(f.key,v)}
                              focused={isFoc} acc={sec.acc} editItem={editItem}
                              opts={resolveOpts(f.key)} disabled={isDisabled(f.key)}
                              onFocus={()=>setFoc(f.key)}
                              onBlur={()=>setFoc(null)}/>
                            {hasErr && (
                              <div style={{ fontSize:9, color:'#ef4444', marginTop:3, fontWeight:600 }}>{hasErr}</div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* No fields visible state */}
          {visibleAll.length === 0 && (
            <div style={{ padding:"48px 0", textAlign:"center", color:C.muted }}>
              <div style={{ fontSize:30, marginBottom:8 }}>⊟</div>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:6 }}>No fields match your filter</div>
              <button onClick={()=>setFieldFilters({})} style={{ padding:"6px 16px",
                border:`1.5px solid ${C.orange}`, borderRadius:7,
                background:C.orangeSoft, color:C.orange,
                fontSize:10, fontWeight:800, cursor:"pointer" }}>
                Clear Filter
              </button>
            </div>
          )}
        </div>{/* end inner column */}
        </div>{/* end scroll wrapper */}

        {/* ── PREVIEW ── */}
        <Preview fd={form}/>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{ flexShrink:0, background:C.surface,
        borderTop:`1.5px solid ${C.border}`,
        padding:"8px 14px", display:"flex", alignItems:"center", gap:10 }}>
        {/* Section progress dots */}
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {SECTIONS.map(s => {
            const mf  = s.fields.filter(f=>!f.auto);
            const done= mf.filter(f=>form[f.key]).length;
            const miss= s.fields.filter(f=>f.req&&!f.auto&&!form[f.key]).length;
            return (
              <div key={s.id} title={s.label} style={{
                height:4, width: open[s.id] ? 20 : 12,
                borderRadius:2,
                background: miss>0?"#fde68a":done>0?s.acc:C.border,
                transition:"all .3s", cursor:"pointer",
              }}
              onClick={()=>toggle(s.id)}/>
            );
          })}
        </div>
        <span style={{ fontSize:9, color:C.muted, fontWeight:700 }}>
          {filled}/{MAN.length} · {REQ.length-reqLeft.length}/{REQ.length} req
        </span>
        {/* Active view chip */}
        {activeViewId!=="all" && (
          <span style={{ fontSize:9, padding:"2px 8px", borderRadius:8, flexShrink:0,
            background:activeView.color+"18", color:activeView.color, fontWeight:800 }}>
            {activeView.icon} {activeView.name}
          </span>
        )}
        {/* Active filters / sorts chips */}
        {hasFilter && <span style={{ fontSize:8.5, color:C.orange, fontWeight:800 }}>⊟ Filtered</span>}
        {hasSort   && <span style={{ fontSize:8.5, color:C.sub,    fontWeight:800 }}>↕ {sorts.length} sort{sorts.length!==1?"s":""}</span>}
        {ok && <span style={{ fontSize:10,color:C.green,fontWeight:900,animation:"ccFade .3s ease" }}>
          ✓ Saved to ARTICLE_MASTER
        </span>}
        <div style={{ flex:1 }}/>
        <button onClick={onClear} style={{
          padding:"6px 13px", border:`1.5px solid ${C.border}`,
          borderRadius:6, background:C.faint, color:C.sub,
          fontSize:10, fontWeight:800, cursor:"pointer" }}>↺ Clear</button>
        <button onClick={onSave} style={{
          padding:"6px 20px", border:"none", borderRadius:6,
          background: reqLeft.length>0 ? "#94a3b8" : C.red,
          color:"#fff", fontSize:10, fontWeight:900, cursor:"pointer",
          animation:shake?"ccShake .5s ease":"none",
          transition:"background .2s" }}>
          {editItem ? '💾 Update Article' : reqLeft.length>0 ? `⚠ ${reqLeft.length} required` : "✓ Save to Sheet"}
        </button>
      </div>

      {/* ══ MODALS & PANELS ══ */}
      {showNewView && (
        <NewViewModal
          existingNames={existingNames}
          editView={editingView}
          onSave={handleSaveView}
          onClose={()=>{ setShowNewView(false); setEditingView(null); }}/>
      )}
      {showManage && (
        <ManagePanel
          customViews={customViews}
          activeViewId={activeViewId}
          onEdit={v=>{ setEditingView(v); setShowManage(false); setShowNewView(true); }}
          onDelete={handleDeleteView}
          onDuplicate={handleDuplicateView}
          onClose={()=>setShowManage(false)}/>
      )}
      {showFilter && (
        <FilterPanel
          filters={fieldFilters}
          setFilters={setFieldFilters}
          onClose={()=>setShowFilter(false)}/>
      )}
      {showSort && (
        <SortPanel
          sorts={sorts}
          setSorts={setSorts}
          onClose={()=>setShowSort(false)}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SELF-CONTAINED WRAPPER — used by SheetWorkspace for article_master
   Manages its own form state + GAS fetching. No props required.
═══════════════════════════════════════════════════════════════ */

// Derive initial dropdown data from seed (same logic as ArticleMasterTab)
const _artCats = CAT_SEED.filter(c => c.master === "ARTICLE" && c.active === "Yes");
const _INIT_DIVISIONS = [...new Set(_artCats.map(c => c.l1))];
const _INIT_L2_BY_DIV = {}, _INIT_L3_BY_L2 = {}, _INIT_L2_HSN = {};
for (const c of _artCats) {
  if (!_INIT_L2_BY_DIV[c.l1]) _INIT_L2_BY_DIV[c.l1] = [];
  if (!_INIT_L2_BY_DIV[c.l1].includes(c.l2)) _INIT_L2_BY_DIV[c.l1].push(c.l2);
  if (!_INIT_L3_BY_L2[c.l2]) _INIT_L3_BY_L2[c.l2] = [];
  if (c.l3 && !_INIT_L3_BY_L2[c.l2].includes(c.l3)) _INIT_L3_BY_L2[c.l2].push(c.l3);
  if (c.hsn && !_INIT_L2_HSN[c.l2]) _INIT_L2_HSN[c.l2] = c.hsn;
}
const _HSN_GST_MAP = { "6105": 5, "6109": 5, "6110": 12, "6112": 12, "6103": 5 };
const _EMPTY_FORM = {
  code:"", desc:"", shortName:"", imageLink:"", sketchLink:"", buyerStyle:"",
  l1Division:"", l2Category:"", l3Style:"", season:"", gender:"",
  fitType:"", neckline:"", sleeveType:"",
  mainFabric:"", fabricName:"", colorCodes:"", sizeRange:"",
  wsp:"", mrp:"", markupPct:"", markdownPct:"", hsnCode:"", gstPct:"",
  status:"Active", remarks:"", tags:"",
};
const _GARBAGE = new Set([
  'Gender','Fit Type','Neckline','Sleeve Type','Status','Season','Size Range',
  'Men/Women/Kids/Unisex','Regular/Slim/Relaxed/Oversized',
  'Round Neck/V-Neck/Collar etc.','Half/Full/Sleeveless etc.',
  'Active/Inactive/Development','SS25/AW26 examples','S-M-L-XL-XXL etc.',
]);

export function ArticleDataEntryWrapper({ M, A, uff, dff }) {
  const [form,       setForm]       = useState({ ..._EMPTY_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [editItem,   setEditItem]   = useState(null);
  const [data,       setData]       = useState([]);

  // Dropdown state — seeded from local data, refreshed from GAS
  const [divisions,    setDivisions]    = useState(_INIT_DIVISIONS);
  const [l2ByDiv,      setL2ByDiv]      = useState(_INIT_L2_BY_DIV);
  const [l3ByL2,       setL3ByL2]       = useState(_INIT_L3_BY_L2);
  const [l2Hsn,        setL2Hsn]        = useState(_INIT_L2_HSN);
  const [genderOpts,   setGenderOpts]   = useState(["Men","Women","Unisex","Kids"]);
  const [fitOpts,      setFitOpts]      = useState(["Regular","Slim","Relaxed","Oversized","Crop"]);
  const [neckOpts,     setNeckOpts]     = useState(["Round Neck","V-Neck","Polo","Henley","Hood","Crew Neck"]);
  const [sleeveOpts,   setSleeveOpts]   = useState(["Half Sleeve","Full Sleeve","Sleeveless","Cap Sleeve"]);
  const [statusOpts,   setStatusOpts]   = useState(["Active","Development","Inactive"]);
  const [seasonOpts,   setSeasonOpts]   = useState(["SS2024","AW2024","SS2025","AW2025","SS2026","AW2026","Year Round"]);
  const [sizeRangeOpts,setSizeRangeOpts]= useState(["S-M-L-XL-XXL","S-M-L-XL","M-L-XL-XXL","XS-S-M-L-XL","Free Size"]);
  const [colourOpts,   setColourOpts]   = useState(["Navy Blue","White","Black","Charcoal Grey","Red","Royal Blue","Olive Green"]);

  // Fetch live data from GAS on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await api.getItemCategories();
        if (!cancelled && Array.isArray(cats) && cats.length > 0) {
          const artCats = cats.filter(c => c.master === 'ARTICLE');
          if (artCats.length > 0) {
            const newDiv = [...new Set(artCats.map(c => c.l1))];
            const newL2 = {}, newL3 = {}, newHsn = {};
            for (const c of artCats) {
              if (!newL2[c.l1]) newL2[c.l1] = [];
              if (!newL2[c.l1].includes(c.l2)) newL2[c.l1].push(c.l2);
              if (!newL3[c.l2]) newL3[c.l2] = [];
              if (c.l3 && !newL3[c.l2].includes(c.l3)) newL3[c.l2].push(c.l3);
              if (c.hsn && !newHsn[c.l2]) newHsn[c.l2] = c.hsn;
            }
            const h = CATEGORY_HIERARCHY['ARTICLE'];
            if (h?.defaultHSN) Object.assign(newHsn, h.defaultHSN);
            if (!cancelled) { setDivisions(newDiv); setL2ByDiv(newL2); setL3ByL2(newL3); setL2Hsn(newHsn); }
          }
        }
      } catch (e) { console.warn('GAS categories fetch failed:', e); }

      try {
        const dd = await api.getArticleDropdowns();
        if (!cancelled && dd) {
          const clean = arr => (arr || []).filter(v => v && !_GARBAGE.has(v));
          const g  = clean(dd.gender);    if (g.length)  setGenderOpts(g);
          const f  = clean(dd.fit);       if (f.length)  setFitOpts(f);
          const n  = clean(dd.neckline);  if (n.length)  setNeckOpts(n);
          const sl = clean(dd.sleeve);    if (sl.length) setSleeveOpts(sl);
          const st = clean(dd.status);    if (st.length) setStatusOpts(st);
          const sn = clean(dd.season);    if (sn.length) setSeasonOpts(sn);
          const sr = clean(dd.sizeRange); if (sr.length) setSizeRangeOpts(sr);
        }
      } catch (e) { console.warn('GAS dropdowns fetch failed:', e); }
    })();
    return () => { cancelled = true; };
  }, []);

  // L1/L2/L3 cascade handlers (auto-fill HSN/GST on L2 change)
  const setL1Division = useCallback(v => {
    setFormErrors({});
    setForm(f => ({ ...f, l1Division: v, l2Category: "", l3Style: "" }));
  }, []);

  const setL2Category = useCallback(v => {
    setFormErrors({});
    const hsn = l2Hsn[v] || "";
    const gst = hsn ? (_HSN_GST_MAP[hsn] ?? "") : "";
    setForm(f => ({ ...f, l2Category: v, l3Style: "", hsnCode: hsn, gstPct: gst ? String(gst) : "" }));
  }, [l2Hsn]);

  const setL3Style = useCallback(v => {
    setFormErrors({});
    setForm(f => ({ ...f, l3Style: v }));
  }, []);

  // Save handler — posts to GAS. Throws on failure so ArticleDataEntryForm.onSave can react.
  const handleSave = useCallback(async () => {
    const errs = {};
    if (!form.code?.trim()) errs.code = "Required";
    if (!form.l1Division)   errs.l1Division = "Required";
    if (!form.l2Category)   errs.l2Category = "Required";
    if (!form.desc?.trim()) errs.desc = "Required";
    if (Object.keys(errs).length) { setFormErrors(errs); throw new Error('validation'); }
    await api.saveMasterRecord('article_master', 'FILE 1A — Items', { ...form, code: form.code.trim() }, false);
    setData(prev => [...prev, { ...form, code: form.code.trim() }]);
  }, [form]);

  const handleClear = useCallback(() => {
    setForm({ ..._EMPTY_FORM });
    setFormErrors({});
    setEditItem(null);
  }, []);

  return (
    <ArticleDataEntryForm
      M={M} A={A} uff={uff} dff={dff}
      form={form} setForm={setForm}
      editItem={editItem}
      formErrors={formErrors} setFormErrors={setFormErrors}
      handleSave={handleSave} handleClear={handleClear}
      divisions={divisions} l2ByDiv={l2ByDiv} l3ByL2={l3ByL2} l2Hsn={l2Hsn}
      genderOpts={genderOpts} fitOpts={fitOpts} neckOpts={neckOpts}
      sleeveOpts={sleeveOpts} statusOpts={statusOpts} seasonOpts={seasonOpts}
      sizeRangeOpts={sizeRangeOpts} colourOpts={colourOpts}
      setL1Division={setL1Division} setL2Category={setL2Category} setL3Style={setL3Style}
      HSN_GST_MAP={_HSN_GST_MAP} data={data}
    />
  );
}
