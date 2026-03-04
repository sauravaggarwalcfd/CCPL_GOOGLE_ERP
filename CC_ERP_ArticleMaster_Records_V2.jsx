import { useState, useMemo, useCallback, useRef } from "react";

/* ─── DESIGN TOKENS ──────────────────────────────────────────── */
const C = {
  red:       "#CC0000",   redSoft:    "#fff0f0",
  orange:    "#E8690A",   orangeSoft: "#fff5ee",
  purple:    "#6c3fc5",   purpleSoft: "#f0eeff",
  blue:      "#1d6fa4",   blueSoft:   "#e8f3fb",
  green:     "#15803d",
  slate:     "#1e293b",   slate2:     "#253347",   slate3:     "#2d3f50",
  bg:        "#f0f2f6",   surface:    "#ffffff",
  border:    "#e2e8ef",   faint:      "#f6f8fb",
  text:      "#1a2332",   sub:        "#5a6a7e",
  muted:     "#9aa5b4",   dim:        "#d1d8e0",
};

const STATUS = {
  Active:      { bg:"#dcfce7", tx:"#15803d", dot:"#22c55e" },
  Inactive:    { bg:"#f1f5f9", tx:"#475569", dot:"#94a3b8" },
  Development: { bg:"#fef3c7", tx:"#92400e", dot:"#f59e0b" },
  Discontinued:{ bg:"#fee2e2", tx:"#991b1b", dot:"#ef4444" },
};

/* ─── COLUMN DEFINITIONS ─────────────────────────────────────── */
const COLS = [
  { key:"imageLink",    label:"📷",             w:54,  special:"thumb"  },
  { key:"code",         label:"Article Code",   w:100, mono:true, bold:true,  sortable:true, filterable:true },
  { key:"desc",         label:"Description",    w:200, sortable:true, filterable:true },
  { key:"shortName",    label:"Short Name",     w:108, sortable:true, filterable:true },
  { key:"sketchLink",   label:"✏ Sketch",       w:56,  special:"sketch" },
  { key:"buyerStyle",   label:"Buyer Style",    w:96,  sortable:true, filterable:true },
  { key:"l1Division",   label:"Division",       w:80,  sortable:true, filterable:true },
  { key:"l2Category",   label:"L2 Category",    w:118, sortable:true, filterable:true },
  { key:"l3Style",      label:"L3 Style",       w:100, sortable:true, filterable:true },
  { key:"season",       label:"Season",         w:98,  sortable:true, filterable:true },
  { key:"gender",       label:"Gender",         w:72,  sortable:true, filterable:true },
  { key:"fitType",      label:"Fit Type",       w:82,  sortable:true, filterable:true },
  { key:"neckline",     label:"Neckline",       w:96,  sortable:true, filterable:true },
  { key:"sleeveType",   label:"Sleeve Type",    w:96,  sortable:true, filterable:true },
  { key:"mainFabric",   label:"Fabric →",       w:100, mono:true, sortable:true, filterable:true },
  { key:"fabricName",   label:"← Fabric Name",  w:155, auto:true },
  { key:"colorCodes",   label:"Colors →",       w:115, mono:true, sortable:true },
  { key:"sizeRange",    label:"Size Range",     w:100, sortable:true, filterable:true },
  { key:"wsp",          label:"WSP ₹",          w:76,  mono:true, num:true, sortable:true },
  { key:"mrp",          label:"MRP ₹",          w:76,  mono:true, num:true, sortable:true },
  { key:"markupPct",    label:"∑ Markup %",     w:80,  mono:true, auto:true, num:true },
  { key:"markdownPct",  label:"∑ Markdown %",   w:86,  mono:true, auto:true, num:true },
  { key:"hsnCode",      label:"HSN Code →",     w:76,  mono:true, sortable:true, filterable:true },
  { key:"gstPct",       label:"← GST %",        w:62,  mono:true, auto:true },
  { key:"status",       label:"Status",         w:112, badge:true, sortable:true, filterable:true },
  { key:"tags",         label:"⟷ Tags",         w:148, filterable:true },
  { key:"remarks",      label:"Remarks",        w:165 },
];

/* ─── SYSTEM VIEWS (control visible columns) ─────────────────── */
const ALL_KEYS = COLS.map(c => c.key);
const SYSTEM_VIEWS = [
  { id:"all",      name:"All Columns",     icon:"⊞", color:"#64748b", isSystem:true,
    desc:"Every column across all 27 fields",
    cols: ALL_KEYS },
  { id:"overview", name:"Article Overview",icon:"👁", color:C.orange,  isSystem:true,
    desc:"Key identity + status at a glance",
    cols:["imageLink","code","desc","shortName","sketchLink","l2Category","gender","season","status","tags"] },
  { id:"pricing",  name:"Pricing & Tax",   icon:"₹",  color:C.green,   isSystem:true,
    desc:"Article code + all pricing columns",
    cols:["code","desc","wsp","mrp","markupPct","markdownPct","hsnCode","gstPct","status"] },
  { id:"fabric",   name:"Fabric Focus",    icon:"🧵", color:C.purple,   isSystem:true,
    desc:"Fabric, colour and size columns",
    cols:["code","desc","mainFabric","fabricName","colorCodes","sizeRange","status"] },
];

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const MOCK = [
  { code:"5249HP", desc:"Classic Pique Polo Shirt Regular Fit",
    shortName:"Classic Pique", imageLink:"https://picsum.photos/seed/polo1/300/300",
    sketchLink:"https://picsum.photos/seed/sk1/300/300", buyerStyle:"BS-2249",
    l1Division:"Apparel", l2Category:"Tops - Polo", l3Style:"Pique",
    season:"SS25, AW25", gender:"Men", fitType:"Regular", neckline:"Collar", sleeveType:"Half Sleeve",
    mainFabric:"RM-FAB-001", fabricName:"Pique 180GSM 100% Cotton",
    colorCodes:"CLR-001|CLR-007|CLR-023", sizeRange:"S-M-L-XL-XXL",
    wsp:490, mrp:999, markupPct:103.9, markdownPct:50.9,
    hsnCode:"6105", gstPct:5, status:"Active", tags:"polo,summer,men", remarks:"" },
  { code:"5250HP", desc:"French Terry Sweatshirt Oversized Drop Shoulder",
    shortName:"FT Sweatshirt OVS", imageLink:"https://picsum.photos/seed/sw2/300/300",
    sketchLink:"https://picsum.photos/seed/sk2/300/300", buyerStyle:"BS-2250",
    l1Division:"Apparel", l2Category:"Sweatshirt", l3Style:"French Terry",
    season:"AW25, AW26", gender:"Unisex", fitType:"Oversized", neckline:"Round Neck", sleeveType:"Full Sleeve",
    mainFabric:"RM-FAB-002", fabricName:"French Terry 260GSM 65/35 CVC",
    colorCodes:"CLR-012|CLR-019", sizeRange:"XS-S-M-L-XL",
    wsp:720, mrp:1499, markupPct:108.2, markdownPct:52.0,
    hsnCode:"6110", gstPct:12, status:"Active", tags:"sweatshirt,winter,unisex", remarks:"Top seller AW25" },
  { code:"5231HP", desc:"Brushed Fleece Hoodie with Kangaroo Pocket",
    shortName:"Brushed Hoodie", imageLink:"https://picsum.photos/seed/hd3/300/300",
    sketchLink:"https://picsum.photos/seed/sk3/300/300", buyerStyle:"",
    l1Division:"Apparel", l2Category:"Sweatshirt", l3Style:"Hooded",
    season:"AW25", gender:"Men", fitType:"Relaxed", neckline:"Hooded", sleeveType:"Full Sleeve",
    mainFabric:"RM-FAB-003", fabricName:"Fleece 320GSM 80/20 CVC Brushed",
    colorCodes:"CLR-003|CLR-011|CLR-022", sizeRange:"S-M-L-XL-XXL-3XL",
    wsp:850, mrp:1799, markupPct:111.6, markdownPct:52.8,
    hsnCode:"6110", gstPct:12, status:"Development", tags:"hoodie,winter,men", remarks:"Pending QC sign-off" },
  { code:"5198KD", desc:"Kids Tracksuit Bottom Tapered Fit Elastic Waist",
    shortName:"Kids Track Bottom", imageLink:"https://picsum.photos/seed/tk4/300/300",
    sketchLink:"https://picsum.photos/seed/sk4/300/300", buyerStyle:"BS-KD01",
    l1Division:"Apparel", l2Category:"Tracksuit", l3Style:"",
    season:"Year Round", gender:"Kids", fitType:"Regular", neckline:"", sleeveType:"",
    mainFabric:"RM-FAB-002", fabricName:"French Terry 260GSM 65/35 CVC",
    colorCodes:"CLR-004|CLR-009", sizeRange:"4Y-6Y-8Y-10Y-12Y",
    wsp:320, mrp:699, markupPct:118.4, markdownPct:54.2,
    hsnCode:"6112", gstPct:12, status:"Active", tags:"kids,tracksuit,yearround", remarks:"" },
  { code:"5310WM", desc:"Women's V-Neck Slim Tee Premium 100% Cotton",
    shortName:"Slim V-Tee WM", imageLink:"https://picsum.photos/seed/wt5/300/300",
    sketchLink:"https://picsum.photos/seed/sk5/300/300", buyerStyle:"BS-WM10",
    l1Division:"Apparel", l2Category:"Tops - Tee", l3Style:"Smooth Knit",
    season:"SS25, SS26", gender:"Women", fitType:"Slim", neckline:"V-Neck", sleeveType:"Half Sleeve",
    mainFabric:"RM-FAB-004", fabricName:"Single Jersey 160GSM 100% Cotton",
    colorCodes:"CLR-002|CLR-007|CLR-014|CLR-020", sizeRange:"XS-S-M-L-XL",
    wsp:280, mrp:599, markupPct:113.9, markdownPct:53.3,
    hsnCode:"6109", gstPct:5, status:"Active", tags:"women,tee,slim,summer", remarks:"" },
  { code:"5188HP", desc:"Polo Shirt Waffle Texture Half Sleeve Men",
    shortName:"Waffle Polo HP", imageLink:"https://picsum.photos/seed/wp6/300/300",
    sketchLink:"https://picsum.photos/seed/sk6/300/300", buyerStyle:"",
    l1Division:"Apparel", l2Category:"Tops - Polo", l3Style:"Waffle",
    season:"SS26", gender:"Men", fitType:"Regular", neckline:"Collar", sleeveType:"Half Sleeve",
    mainFabric:"RM-FAB-005", fabricName:"Waffle Knit 200GSM 100% Cotton",
    colorCodes:"CLR-005|CLR-016", sizeRange:"S-M-L-XL",
    wsp:520, mrp:1099, markupPct:111.3, markdownPct:52.7,
    hsnCode:"6105", gstPct:5, status:"Discontinued", tags:"polo,waffle,men", remarks:"Colour blocked — season end" },
  { code:"5420WM", desc:"Women's Oversized Drop-Shoulder Sweatshirt AW",
    shortName:"OS Drop Sweat WM", imageLink:"https://picsum.photos/seed/ds7/300/300",
    sketchLink:"https://picsum.photos/seed/sk7/300/300", buyerStyle:"BS-WM22",
    l1Division:"Apparel", l2Category:"Sweatshirt", l3Style:"French Terry",
    season:"AW26", gender:"Women", fitType:"Oversized", neckline:"Round Neck", sleeveType:"Full Sleeve",
    mainFabric:"RM-FAB-002", fabricName:"French Terry 260GSM 65/35 CVC",
    colorCodes:"CLR-008|CLR-015|CLR-021", sizeRange:"XS-S-M-L-XL",
    wsp:680, mrp:1399, markupPct:105.7, markdownPct:51.4,
    hsnCode:"6110", gstPct:12, status:"Development", tags:"women,sweatshirt,oversized", remarks:"" },
];

/* ─── ATOMS ──────────────────────────────────────────────────── */
function StatusBadge({ s }) {
  const st = STATUS[s] || STATUS.Inactive;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9,
      fontWeight:800, padding:"2px 8px", borderRadius:10,
      background:st.bg, color:st.tx, whiteSpace:"nowrap", flexShrink:0 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:st.dot, flexShrink:0 }}/>
      {s}
    </span>
  );
}

function ImgThumb({ src, size=44, radius=6 }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div style={{ width:size, height:size, borderRadius:radius, flexShrink:0,
      background:"#f1f5f9", border:"1px solid #e4e8ef",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size>40?16:11, color:C.dim }}>📷</div>
  );
  return <img src={src} onError={()=>setErr(true)} alt="" style={{
    width:size, height:size, borderRadius:radius, objectFit:"cover",
    flexShrink:0, border:"1px solid #e4e8ef", display:"block" }}/>;
}

function SketchThumb({ src, size=38, radius=5 }) {
  const [err, setErr] = useState(false);
  const [hov, setHov] = useState(false);
  const [pos, setPos] = useState({ x:0, y:0 });
  if (!src || err) return (
    <div style={{ width:size, height:size, borderRadius:radius, flexShrink:0,
      background:"#fafafa", border:"1px dashed #d1d8e0",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:10, color:C.dim }}>✏</div>
  );
  return (
    <>
      <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        onMouseMove={e=>setPos({x:e.clientX,y:e.clientY})}>
        <img src={src} onError={()=>setErr(true)} alt=""
          style={{ width:size, height:size, borderRadius:radius, objectFit:"cover",
            border:"1px solid #e4e8ef", display:"block",
            filter:hov?"grayscale(0%)":"grayscale(65%)", transition:"filter .18s" }}/>
      </div>
      {hov && (
        <div style={{ position:"fixed", left:pos.x+14,
          top:Math.min(pos.y-80, window.innerHeight-200), zIndex:9999,
          background:"#fff", border:"1px solid #e4e8ef", borderRadius:10,
          padding:6, boxShadow:"0 12px 40px rgba(0,0,0,.18)", pointerEvents:"none" }}>
          <img src={src} alt="" style={{ width:160, height:160, objectFit:"cover", borderRadius:7, display:"block" }}/>
          <div style={{ fontSize:8.5, color:C.muted, textAlign:"center", padding:"4px 0 2px", fontWeight:700 }}>
            ✏ Sketch / Tech Pack
          </div>
        </div>
      )}
    </>
  );
}

function Tags({ v }) {
  if (!v) return <span style={{ color:C.dim, fontSize:10 }}>—</span>;
  const parts = String(v).split(",").map(t=>t.trim()).filter(Boolean);
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
      {parts.slice(0,3).map(t=>(
        <span key={t} style={{ fontSize:7.5, padding:"2px 5px", borderRadius:7,
          background:"#f1f5f9", color:"#64748b", fontWeight:700 }}>{t}</span>
      ))}
      {parts.length>3 && <span style={{ fontSize:7.5, color:C.muted, padding:"2px 3px" }}>+{parts.length-3}</span>}
    </div>
  );
}

function CellVal({ col, row }) {
  if (col.special === "thumb")  return <ImgThumb src={row.imageLink} size={42} radius={6}/>;
  if (col.special === "sketch") return <SketchThumb src={row.sketchLink} size={36} radius={5}/>;
  if (col.badge) return <StatusBadge s={row[col.key]}/>;
  if (col.key === "tags") return <Tags v={row[col.key]}/>;
  const raw = row[col.key];
  if (raw===undefined||raw===null||raw==="") return <span style={{ color:C.dim }}>—</span>;
  const disp = col.num
    ? (col.key==="wsp"||col.key==="mrp" ? `₹${raw}` : `${raw}%`)
    : String(raw);
  return (
    <span style={{ fontSize:11,
      fontFamily:col.mono?"'IBM Plex Mono',monospace":"inherit",
      fontWeight:col.bold?800:col.auto?700:400,
      color:col.key==="code"?C.orange:col.auto?C.purple
           :(col.key==="markupPct"&&raw>=100)?C.green:C.text,
      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"block" }}>
      {disp}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEW VIEW MODAL
═══════════════════════════════════════════════════════════════ */
function NewViewModal({ existingNames, onSave, onClose, editView=null }) {
  const isEdit = !!editView;
  const [name,   setName]   = useState(editView?.name  || "");
  const [selCols, setSelCols] = useState(new Set(editView?.cols || ALL_KEYS));
  const [err,    setErr]    = useState("");

  const RESERVED = ["All Columns","Article Overview","Pricing & Tax","Fabric Focus"];
  const toggleCol = k => setSelCols(p=>{ const n=new Set(p); n.has(k)?n.delete(k):n.add(k); return n; });

  const handleSave = () => {
    const t = name.trim();
    if (!t)                            { setErr("View name is required"); return; }
    if (RESERVED.includes(t))          { setErr(`"${t}" is reserved`); return; }
    if (!isEdit && existingNames.includes(t)) { setErr("Name already exists"); return; }
    if (selCols.size === 0)            { setErr("Select at least one column"); return; }
    onSave({ name:t, cols:[...selCols], icon:"📌", color:C.purple, isSystem:false,
      id:editView?.id||`cv_${Date.now()}` });
  };

  // Group cols by category for picker
  const groups = [
    { label:"📋 Identity",    keys:["imageLink","code","desc","shortName","sketchLink","buyerStyle"] },
    { label:"👕 Item Details",keys:["l1Division","l2Category","l3Style","season","gender","fitType","neckline","sleeveType"] },
    { label:"🧵 Fabric",      keys:["mainFabric","fabricName","colorCodes","sizeRange"] },
    { label:"₹ Pricing",      keys:["wsp","mrp","markupPct","markdownPct","hsnCode","gstPct"] },
    { label:"🏷️ Status",      keys:["status","tags","remarks"] },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(15,23,42,.48)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff", borderRadius:13, width:490, maxHeight:"88vh",
        boxShadow:"0 24px 64px rgba(0,0,0,.22)",
        display:"flex", flexDirection:"column", overflow:"hidden",
        animation:"modalIn .22s cubic-bezier(.34,1.56,.64,1)" }}>

        <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", gap:10,
          background:"linear-gradient(135deg,#faf7ff,#fff)" }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#f0eeff",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📌</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:900, color:C.text }}>
              {isEdit?`Edit View — "${editView.name}"`:"Create New Column View"}
            </div>
            <div style={{ fontSize:9, color:C.muted, marginTop:1 }}>Choose which columns are visible in this view</div>
          </div>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:18, color:C.muted, cursor:"pointer" }}>×</button>
        </div>

        {/* Name */}
        <div style={{ padding:"12px 18px 6px" }}>
          <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase",
            letterSpacing:.5, marginBottom:5 }}>View Name</div>
          <input value={name} onChange={e=>{setName(e.target.value);setErr("");}}
            placeholder="e.g. Buyer View, QC Columns, Season Check…"
            style={{ width:"100%", padding:"7px 11px",
              border:`1.5px solid ${err?C.red:C.border}`,
              borderRadius:7, fontSize:12, outline:"none",
              background:err?"#fff0f0":"#f9fafb", color:C.text, fontFamily:"inherit" }}/>
          {err && <div style={{ fontSize:9, color:C.red, marginTop:4, fontWeight:700 }}>⚠ {err}</div>}
        </div>

        {/* Column picker header */}
        <div style={{ padding:"4px 18px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase", letterSpacing:.5 }}>
            Columns <span style={{ color:C.purple }}>({selCols.size} selected)</span>
          </div>
          <div style={{ display:"flex", gap:5 }}>
            {[
              { l:"All",   fn:()=>setSelCols(new Set(ALL_KEYS)),      c:C.sub    },
              { l:"Key",   fn:()=>setSelCols(new Set(["imageLink","code","desc","status","l2Category","gender"])), c:C.orange },
              { l:"Clear", fn:()=>setSelCols(new Set()),               c:C.muted  },
            ].map(b=>(
              <button key={b.l} onClick={b.fn} style={{ padding:"2px 9px",
                border:`1px solid ${C.border}`, borderRadius:6,
                background:"#f6f8fb", color:b.c, fontSize:8.5, fontWeight:800, cursor:"pointer" }}>
                {b.l}
              </button>
            ))}
          </div>
        </div>

        {/* Groups scroll */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 18px 16px" }}>
          {groups.map(g => {
            const gCols  = g.keys.map(k=>COLS.find(c=>c.key===k)).filter(Boolean);
            const allOn  = gCols.every(c=>selCols.has(c.key));
            const someOn = gCols.some(c=>selCols.has(c.key));
            return (
              <div key={g.label} style={{ marginBottom:8, border:`1px solid ${C.border}`, borderRadius:9, overflow:"hidden" }}>
                <div onClick={()=>{
                  const allOnNow = gCols.every(c=>selCols.has(c.key));
                  setSelCols(p=>{ const n=new Set(p); gCols.forEach(c=>allOnNow?n.delete(c.key):n.add(c.key)); return n; });
                }} style={{ padding:"7px 12px", cursor:"pointer",
                  background:allOn?"#f0eeff":someOn?"#fafafa":"#f8f9fb",
                  display:"flex", alignItems:"center", gap:8,
                  borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:17, height:17, borderRadius:4, flexShrink:0,
                    border:`2px solid ${allOn?C.purple:someOn?C.purple+"60":C.border}`,
                    background:allOn?C.purple:"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {allOn && <span style={{ fontSize:9, color:"#fff" }}>✓</span>}
                    {!allOn&&someOn && <span style={{ width:6,height:2,background:C.purple,borderRadius:1,display:"block" }}/>}
                  </div>
                  <span style={{ fontSize:10.5, fontWeight:800, flex:1,
                    color:allOn?C.purple:C.text }}>{g.label}</span>
                  <span style={{ fontSize:8.5, color:C.muted }}>
                    {gCols.filter(c=>selCols.has(c.key)).length}/{gCols.length}
                  </span>
                </div>
                <div style={{ padding:"7px 12px 9px", display:"flex", flexWrap:"wrap", gap:5 }}>
                  {gCols.map(c=>{
                    const on=selCols.has(c.key);
                    return (
                      <button key={c.key} onClick={()=>toggleCol(c.key)} style={{
                        padding:"3px 9px", borderRadius:9, fontSize:9, fontWeight:700,
                        cursor:"pointer", transition:"all .12s",
                        border:`1.5px solid ${on?C.purple+"70":C.border}`,
                        background:on?C.purpleSoft:"#f9fafb",
                        color:on?C.purple:C.muted,
                        display:"flex", alignItems:"center", gap:4 }}>
                        {c.auto && <span style={{ fontSize:7, color:C.purple }}>←</span>}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding:"10px 18px", borderTop:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", gap:8, background:"#fafafa" }}>
          <span style={{ fontSize:9, color:C.muted, flex:1 }}>
            {selCols.size} column{selCols.size!==1?"s":""} selected
          </span>
          <button onClick={onClose} style={{ padding:"7px 14px",
            border:`1.5px solid ${C.border}`, borderRadius:7,
            background:"#f6f8fb", color:C.sub, fontSize:10, fontWeight:800, cursor:"pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ padding:"7px 20px", border:"none",
            borderRadius:7, background:C.purple, color:"#fff",
            fontSize:10, fontWeight:900, cursor:"pointer" }}>
            {isEdit?"💾 Update View":"✚ Create View"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MANAGE VIEWS PANEL
═══════════════════════════════════════════════════════════════ */
function ManagePanel({ customViews, activeViewId, onEdit, onDelete, onDuplicate, onClose }) {
  const [confirm, setConfirm] = useState(null);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(15,23,42,.3)", backdropFilter:"blur(2px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:370,
        background:"#fff", boxShadow:"-10px 0 40px rgba(0,0,0,.14)",
        display:"flex", flexDirection:"column", animation:"slideFromRight .22s ease" }}>

        <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${C.border}`,
          background:C.slate, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16 }}>🔖</span>
          <span style={{ fontSize:11, fontWeight:900, color:"#e2e8f0", flex:1 }}>Manage Views</span>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:16, color:"#94a3b8", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
          <div style={{ fontSize:8, fontWeight:900, color:C.muted, textTransform:"uppercase",
            letterSpacing:.8, marginBottom:6, padding:"0 4px" }}>System Views (locked)</div>
          {SYSTEM_VIEWS.map(v=>(
            <div key={v.id} style={{ display:"flex", alignItems:"center", gap:9,
              padding:"8px 10px", borderRadius:8, marginBottom:4,
              background:"#f6f8fb", border:`1px solid ${C.border}` }}>
              <span style={{ fontSize:15 }}>{v.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10.5, fontWeight:800, color:C.text }}>{v.name}</div>
                <div style={{ fontSize:8.5, color:C.muted, marginTop:1 }}>{v.desc} · <b>{v.cols.length}</b> cols</div>
              </div>
              <span style={{ fontSize:7.5, padding:"2px 6px", borderRadius:5,
                background:"#f1f5f9", color:"#94a3b8", fontWeight:900 }}>LOCKED</span>
            </div>
          ))}

          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"14px 0 8px" }}>
            <div style={{ flex:1, height:1, background:C.border }}/>
            <span style={{ fontSize:8, fontWeight:900, color:C.muted, textTransform:"uppercase", letterSpacing:.8 }}>
              Custom Views ({customViews.length})
            </span>
            <div style={{ flex:1, height:1, background:C.border }}/>
          </div>

          {customViews.length===0 && (
            <div style={{ padding:"28px 0", textAlign:"center", color:C.muted }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📌</div>
              <div style={{ fontSize:11, fontWeight:700, marginBottom:4 }}>No custom views yet</div>
              <div style={{ fontSize:9 }}>Use <b style={{ color:C.orange }}>+ New View</b> to create one.</div>
            </div>
          )}

          {customViews.map(v=>{
            const isActive = activeViewId===v.id;
            const isDel    = confirm===v.id;
            return (
              <div key={v.id} style={{ padding:"8px 10px", borderRadius:8, marginBottom:5,
                border:`1.5px solid ${isActive?C.purple+"55":C.border}`,
                background:isActive?C.purpleSoft:"#fff", transition:"all .15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>{v.icon||"📌"}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ fontSize:10.5, fontWeight:800, color:isActive?C.purple:C.text }}>{v.name}</span>
                      {isActive && <span style={{ fontSize:7, padding:"1px 5px", borderRadius:4,
                        background:C.purple, color:"#fff", fontWeight:900 }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize:8.5, color:C.muted, marginTop:1 }}>{v.cols.length} columns</div>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>onEdit(v)} style={{ padding:"3px 8px",
                      border:`1px solid ${C.border}`, borderRadius:5,
                      background:"#f6f8fb", color:C.sub, fontSize:9, fontWeight:800, cursor:"pointer" }}>✎ Edit</button>
                    <button onClick={()=>onDuplicate(v)} style={{ padding:"3px 8px",
                      border:`1px solid ${C.border}`, borderRadius:5,
                      background:"#f6f8fb", color:C.sub, fontSize:9, fontWeight:800, cursor:"pointer" }}>⧉</button>
                    <button onClick={()=>setConfirm(isDel?null:v.id)} style={{ padding:"3px 8px",
                      border:`1px solid ${isDel?"#fca5a5":C.border}`, borderRadius:5,
                      background:isDel?"#fff1f1":"#f6f8fb",
                      color:isDel?C.red:C.muted, fontSize:9, fontWeight:800, cursor:"pointer" }}>×</button>
                  </div>
                </div>
                {isDel && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8,
                    padding:"6px 8px", borderRadius:7, background:"#fff1f1", border:"1px solid #fca5a5" }}>
                    <span style={{ fontSize:9, color:C.red, flex:1 }}>
                      Delete "<b>{v.name}</b>"?
                    </span>
                    <button onClick={()=>{onDelete(v.id);setConfirm(null);}} style={{ padding:"3px 10px",
                      border:"none", borderRadius:5, background:C.red,
                      color:"#fff", fontSize:9, fontWeight:900, cursor:"pointer" }}>Delete</button>
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
          background:"#f6f8fb", fontSize:9, color:C.muted, textAlign:"center" }}>
          {SYSTEM_VIEWS.length} system · {customViews.length} custom · {SYSTEM_VIEWS.length+customViews.length} total
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COLUMN FILTER PANEL — per-column dropdowns
═══════════════════════════════════════════════════════════════ */
function FilterPanel({ data, colFilters, setColFilters, visCols, onClose }) {
  const [local, setLocal] = useState({ ...colFilters });
  const filterableCols    = visCols.filter(c => c.filterable && !c.special);

  const uniqueVals = col => {
    const vals = [...new Set(data.map(r=>r[col.key]).filter(v=>v!==undefined&&v!==""))];
    return vals.sort((a,b)=>String(a).localeCompare(String(b)));
  };

  const apply = () => { setColFilters(local); onClose(); };
  const clear  = () => { setColFilters({}); onClose(); };
  const activeCount = Object.values(local).filter(v=>v&&v!=="all").length;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(15,23,42,.28)", backdropFilter:"blur(2px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:320,
        background:"#fff", boxShadow:"-10px 0 40px rgba(0,0,0,.12)",
        display:"flex", flexDirection:"column", animation:"slideFromRight .22s ease" }}>

        <div style={{ padding:"13px 14px 11px", borderBottom:`1px solid ${C.border}`,
          background:C.slate, display:"flex", alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:900, color:"#e2e8f0", flex:1 }}>
            ⊟ Column Filters
            {activeCount>0 && <span style={{ marginLeft:6, fontSize:9, padding:"1px 6px",
              borderRadius:8, background:C.orange, color:"#fff", fontWeight:900 }}>{activeCount} ON</span>}
          </span>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:16, color:"#94a3b8", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"12px 14px" }}>
          {filterableCols.map(c => {
            const vals = uniqueVals(c);
            const cur  = local[c.key] || "all";
            return (
              <div key={c.key} style={{ marginBottom:14 }}>
                <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase",
                  letterSpacing:.5, marginBottom:5,
                  display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  {c.label}
                  {cur!=="all" && (
                    <button onClick={()=>setLocal(p=>({...p,[c.key]:"all"}))} style={{
                      border:"none", background:"none", color:C.orange,
                      fontSize:8.5, fontWeight:800, cursor:"pointer" }}>× clear</button>
                  )}
                </div>

                {/* Text search for high-cardinality cols (code, desc, shortName, buyerStyle, colorCodes, tags) */}
                {["code","desc","shortName","buyerStyle","colorCodes","tags","remarks"].includes(c.key) ? (
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)",
                      fontSize:12, color:C.muted, pointerEvents:"none" }}>⌕</span>
                    <input value={cur==="all"?"":cur}
                      onChange={e=>setLocal(p=>({...p,[c.key]:e.target.value||"all"}))}
                      placeholder={`Search ${c.label.toLowerCase()}…`}
                      style={{ width:"100%", padding:"6px 10px 6px 26px",
                        border:`1.5px solid ${cur!=="all"?C.orange:C.border}`,
                        borderRadius:7, fontSize:10.5, outline:"none",
                        background:cur!=="all"?C.orangeSoft:"#f9fafb",
                        fontFamily:"inherit", color:C.text }}/>
                    {cur!=="all" && (
                      <button onClick={()=>setLocal(p=>({...p,[c.key]:"all"}))} style={{
                        position:"absolute", right:7, top:"50%", transform:"translateY(-50%)",
                        border:"none", background:"none", color:C.muted, cursor:"pointer", fontSize:13 }}>×</button>
                    )}
                  </div>
                ) : (
                  /* Dropdown for low-cardinality cols */
                  <div style={{ position:"relative" }}>
                    <select value={cur}
                      onChange={e=>setLocal(p=>({...p,[c.key]:e.target.value}))}
                      style={{ width:"100%", padding:"6px 24px 6px 10px",
                        border:`1.5px solid ${cur!=="all"?C.orange:C.border}`,
                        borderRadius:7, fontSize:10.5, outline:"none",
                        appearance:"none", cursor:"pointer",
                        background:cur!=="all"?C.orangeSoft:"#f9fafb",
                        color:C.text, fontFamily:"inherit" }}>
                      <option value="all">— All —</option>
                      {vals.map(v=>(
                        <option key={v} value={String(v)}>{String(v)}</option>
                      ))}
                    </select>
                    <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                      color:C.muted, fontSize:10, pointerEvents:"none" }}>▾</span>
                  </div>
                )}
              </div>
            );
          })}

          {filterableCols.length===0 && (
            <div style={{ padding:"28px 0", textAlign:"center", color:C.muted, fontSize:11 }}>
              No filterable columns visible.<br/>Switch to a view with more columns.
            </div>
          )}
        </div>

        <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8 }}>
          <button onClick={clear} style={{ flex:1, padding:"7px", border:`1px solid ${C.border}`,
            borderRadius:7, background:"#f6f8fb", color:C.sub,
            fontSize:10, fontWeight:800, cursor:"pointer" }}>Clear All</button>
          <button onClick={apply} style={{ flex:2, padding:"7px", border:"none",
            borderRadius:7, background:C.orange, color:"#fff",
            fontSize:10, fontWeight:900, cursor:"pointer" }}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SORT PANEL — multi-column sort
═══════════════════════════════════════════════════════════════ */
function SortPanel({ sorts, setSorts, onClose }) {
  const sortableCols = COLS.filter(c=>c.sortable);
  const [local, setLocal] = useState(sorts.length?sorts.map(s=>({...s})):[]);
  const dragIdx = useRef(null);

  const addSort = () => {
    const used=local.map(s=>s.key);
    const next=sortableCols.find(c=>!used.includes(c.key));
    if(!next) return;
    setLocal(p=>[...p,{id:Date.now(),key:next.key,dir:"asc"}]);
  };

  const PRESETS = [
    { l:"Code A→Z",   s:[{id:1,key:"code",   dir:"asc" }] },
    { l:"Code Z→A",   s:[{id:1,key:"code",   dir:"desc"}] },
    { l:"MRP Low→High",s:[{id:1,key:"mrp",   dir:"asc" }] },
    { l:"MRP High→Low",s:[{id:1,key:"mrp",   dir:"desc"}] },
    { l:"Status",     s:[{id:1,key:"status", dir:"asc" }] },
    { l:"Category",   s:[{id:1,key:"l2Category",dir:"asc"}] },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(15,23,42,.28)", backdropFilter:"blur(2px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:340,
        background:"#fff", boxShadow:"-10px 0 40px rgba(0,0,0,.12)",
        display:"flex", flexDirection:"column", animation:"slideFromRight .22s ease" }}>

        <div style={{ padding:"13px 14px 11px", borderBottom:`1px solid ${C.border}`,
          background:C.slate, display:"flex", alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:900, color:"#e2e8f0", flex:1 }}>↕ Sort Columns</span>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:16, color:"#94a3b8", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>
          <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase",
            letterSpacing:.5, marginBottom:8 }}>Quick Presets</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:16 }}>
            {PRESETS.map(p=>(
              <button key={p.l} onClick={()=>setLocal(p.s.map((s,i)=>({...s,id:Date.now()+i})))} style={{
                padding:"4px 10px", borderRadius:8, fontSize:9.5, fontWeight:700, cursor:"pointer",
                border:`1.5px solid ${C.border}`, background:"#f9fafb", color:C.sub,
                fontFamily:"inherit" }}>{p.l}</button>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase", letterSpacing:.5 }}>
              Sort Rules {local.length>0&&<span style={{ color:C.orange }}>({local.length})</span>}
            </div>
            <button onClick={addSort} disabled={local.length>=sortableCols.length} style={{
              padding:"3px 9px", border:`1.5px dashed ${C.orange}`, borderRadius:6,
              background:C.orangeSoft, color:C.orange,
              fontSize:9, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>+ Add Rule</button>
          </div>

          {local.length===0 && (
            <div style={{ padding:"18px 0", textAlign:"center", color:C.muted, fontSize:10 }}>
              No sort rules. Add one or pick a preset.
            </div>
          )}

          {local.map((s,i)=>{
            const col=COLS.find(c=>c.key===s.key);
            return (
              <div key={s.id} draggable
                onDragStart={()=>{ dragIdx.current=i; }}
                onDragOver={e=>e.preventDefault()}
                onDrop={()=>{
                  if(dragIdx.current===null||dragIdx.current===i) return;
                  const arr=[...local]; const [item]=arr.splice(dragIdx.current,1);
                  arr.splice(i,0,item); setLocal(arr); dragIdx.current=null;
                }}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 10px",
                  marginBottom:5, borderRadius:7, border:`1.5px solid ${C.border}`,
                  background:"#fff", cursor:"grab",
                  boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ width:19,height:19,borderRadius:"50%",flexShrink:0,
                  background:C.orange,color:"#fff",fontSize:9,fontWeight:900,
                  display:"flex",alignItems:"center",justifyContent:"center" }}>{i+1}</div>
                <span style={{ fontSize:11, color:C.muted, cursor:"grab" }}>⠿</span>
                <select value={s.key} onChange={e=>setLocal(p=>p.map(r=>r.id===s.id?{...r,key:e.target.value}:r))}
                  style={{ flex:1, padding:"4px 6px", border:`1px solid ${C.border}`,
                    borderRadius:5, fontSize:10, outline:"none",
                    background:"#f9fafb", fontFamily:"inherit" }}>
                  {sortableCols.map(c=>(
                    <option key={c.key} value={c.key}
                      disabled={local.some(ls=>ls.id!==s.id&&ls.key===c.key)}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button onClick={()=>setLocal(p=>p.map(r=>r.id===s.id?{...r,dir:r.dir==="asc"?"desc":"asc"}:r))} style={{
                  padding:"4px 9px", border:`1.5px solid ${C.border}`,
                  borderRadius:5, background:"#f9fafb", color:C.sub,
                  fontSize:9, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>
                  {s.dir==="asc"?(col?.num?"1→9":"A→Z"):(col?.num?"9→1":"Z→A")}
                </button>
                <button onClick={()=>setLocal(p=>p.filter(r=>r.id!==s.id))} style={{
                  border:"none", background:"none", color:C.muted, cursor:"pointer", fontSize:15, padding:"0 2px" }}>×</button>
              </div>
            );
          })}
        </div>

        <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8 }}>
          <button onClick={()=>{setSorts([]);setLocal([]);onClose();}} style={{
            flex:1, padding:"7px", border:`1px solid ${C.border}`,
            borderRadius:7, background:"#f6f8fb", color:C.sub,
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

/* ═══════════════════════════════════════════════════════════════
   EXPORT MENU
═══════════════════════════════════════════════════════════════ */
function ExportMenu({ count, onClose, onToast }) {
  const opts = [
    { icon:"📄", label:"Export as PDF",         sub:"Formatted A4 layout",      col:C.red    },
    { icon:"📊", label:"Export as Excel (.xlsx)",sub:"Full sheet with all cols",  col:C.green  },
    { icon:"📋", label:"Copy to Google Sheet",   sub:"Opens in new tab",          col:C.blue   },
    { icon:"🖨️", label:"Print view",            sub:"Browser print dialog",      col:C.sub    },
  ];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:500 }} onClick={onClose}>
      <div style={{ position:"absolute", right:12, top:90,
        background:"#fff", borderRadius:10, width:240,
        boxShadow:"0 12px 40px rgba(0,0,0,.18)", border:`1px solid ${C.border}`,
        overflow:"hidden", animation:"modalIn .15s ease" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"8px 12px 6px", borderBottom:`1px solid ${C.border}`,
          fontSize:9, fontWeight:900, color:C.muted, textTransform:"uppercase", letterSpacing:.8 }}>
          Export {count} records
        </div>
        {opts.map(o=>(
          <button key={o.label} onClick={()=>{ onToast(`${o.label}…`); onClose(); }}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"9px 14px", border:"none", background:"transparent",
              cursor:"pointer", textAlign:"left", transition:"background .1s", fontFamily:"inherit" }}
            onMouseEnter={e=>e.currentTarget.style.background="#f8f9fb"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{ fontSize:18, flexShrink:0 }}>{o.icon}</span>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:o.col }}>{o.label}</div>
              <div style={{ fontSize:8.5, color:C.muted }}>{o.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECORD DETAIL MODAL  (click row)
═══════════════════════════════════════════════════════════════ */
function DetailModal({ row, onClose, onEdit }) {
  const [tab, setTab] = useState("details");
  const st = STATUS[row.status] || STATUS.Inactive;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(15,23,42,.48)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.bg, borderRadius:13, width:820, maxHeight:"88vh",
        boxShadow:"0 24px 64px rgba(0,0,0,.22)",
        display:"flex", flexDirection:"column", overflow:"hidden",
        animation:"modalIn .22s cubic-bezier(.34,1.56,.64,1)" }}>

        {/* Hero */}
        <div style={{ display:"flex", background:C.surface, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ width:180, height:180, flexShrink:0, overflow:"hidden" }}>
            <ImgThumb src={row.imageLink} size={180} radius={0}/>
          </div>
          <div style={{ width:130, flexShrink:0, height:180,
            background:"#f6f8fb", borderLeft:`1px solid ${C.border}`,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:7, padding:10 }}>
            <span style={{ fontSize:8.5, fontWeight:900, color:C.muted, letterSpacing:.5 }}>✏ SKETCH</span>
            <SketchThumb src={row.sketchLink} size={96} radius={8}/>
            <button style={{ fontSize:8.5, padding:"3px 11px",
              border:`1px solid ${C.border}`, borderRadius:5,
              background:C.surface, color:C.sub, cursor:"pointer" }}>↗ Open link</button>
          </div>
          <div style={{ flex:1, padding:"16px 18px", minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:22, fontWeight:900, color:C.orange,
                fontFamily:"'IBM Plex Mono',monospace" }}>{row.code}</span>
              <StatusBadge s={row.status}/>
            </div>
            {row.shortName && <div style={{ fontSize:9.5, color:C.muted, marginBottom:5 }}>"{row.shortName}"</div>}
            <div style={{ fontSize:13, fontWeight:800, color:C.text, lineHeight:1.4, marginBottom:9 }}>{row.desc}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:7 }}>
              {[row.gender,row.l2Category,row.l3Style,row.fitType,row.neckline,row.sleeveType]
                .filter(Boolean).map((v,i)=>(
                <span key={i} style={{ fontSize:9, padding:"3px 8px", borderRadius:8,
                  background:"#f1f5f9", color:"#475569", fontWeight:700 }}>{v}</span>
              ))}
              {row.season && String(row.season).split(",").map(s=>(
                <span key={s} style={{ fontSize:9, padding:"3px 8px", borderRadius:8,
                  background:"#dbeafe", color:C.blue, fontWeight:700 }}>{s.trim()}</span>
              ))}
            </div>
            {row.buyerStyle && <div style={{ fontSize:9.5, color:C.muted }}>
              Buyer Style: <b style={{ color:C.sub }}>{row.buyerStyle}</b></div>}
          </div>
          <button onClick={onClose} style={{ position:"absolute", right:16, top:12,
            border:"none", background:"rgba(0,0,0,.06)", width:28, height:28,
            borderRadius:"50%", cursor:"pointer", fontSize:16, color:C.sub,
            display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`,
          display:"flex", padding:"0 18px", flexShrink:0, alignItems:"center" }}>
          {[{id:"details",l:"📋 Item Details"},{id:"pricing",l:"₹ Pricing & Tax"},{id:"fabric",l:"🧵 Fabric"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"9px 14px", border:"none", background:"transparent",
              borderBottom:`2.5px solid ${tab===t.id?C.orange:"transparent"}`,
              fontSize:10.5, fontWeight:tab===t.id?900:700,
              color:tab===t.id?C.orange:C.sub, cursor:"pointer", transition:"all .15s" }}>{t.l}</button>
          ))}
          <div style={{ flex:1 }}/>
          <button onClick={()=>{onEdit(row);onClose();}} style={{ padding:"5px 16px",
            border:`1.5px solid ${C.orange}`, borderRadius:6,
            background:C.orangeSoft, color:C.orange,
            fontSize:10, fontWeight:900, cursor:"pointer" }}>✎ Edit Record</button>
        </div>

        {/* Tab content */}
        <div style={{ padding:"14px 18px", overflowY:"auto" }}>
          {tab==="details" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px 14px" }}>
              {[
                {l:"L1 Division",v:row.l1Division},{l:"L2 Category",v:row.l2Category},{l:"L3 Style",v:row.l3Style},
                {l:"Gender",v:row.gender},{l:"Fit Type",v:row.fitType},{l:"Neckline",v:row.neckline},
                {l:"Sleeve Type",v:row.sleeveType},{l:"Size Range",v:row.sizeRange},
                {l:"⟷ Tags",v:row.tags,wide:true},{l:"Remarks",v:row.remarks,wide:true},
              ].map(f=>(
                <div key={f.l} style={{ gridColumn:f.wide?"1/-1":"auto",
                  background:C.surface, borderRadius:7, padding:"8px 12px",
                  border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:8, fontWeight:900, color:C.muted,
                    textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>{f.l}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:f.v?C.text:C.dim }}>{f.v||"—"}</div>
                </div>
              ))}
            </div>
          )}
          {tab==="pricing" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px 14px" }}>
              {[
                {l:"W.S.P",v:row.wsp?`₹${row.wsp}`:"—",mono:true},
                {l:"MRP",v:row.mrp?`₹${row.mrp}`:"—",mono:true},
                {l:"∑ Final Markup %",v:row.markupPct?`${row.markupPct}%`:"—",mono:true,auto:true},
                {l:"∑ Final Markdown %",v:row.markdownPct?`${row.markdownPct}%`:"—",mono:true,auto:true},
                {l:"HSN Code →",v:row.hsnCode||"—",mono:true},
                {l:"← GST %",v:row.gstPct?`${row.gstPct}%`:"—",mono:true,auto:true},
              ].map(f=>(
                <div key={f.l} style={{ background:C.surface, borderRadius:7,
                  padding:"10px 14px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:8, fontWeight:900, textTransform:"uppercase",
                    letterSpacing:.5, marginBottom:5,
                    color:f.auto?C.purple:C.muted }}>{f.l}</div>
                  <div style={{ fontSize:22, fontWeight:900, fontFamily:"'IBM Plex Mono',monospace",
                    color:f.auto?C.purple:C.text }}>{f.v}</div>
                </div>
              ))}
            </div>
          )}
          {tab==="fabric" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 14px" }}>
              {[
                {l:"Main Fabric Code →",v:row.mainFabric||"—",mono:true},
                {l:"← Fabric Name",v:row.fabricName||"—",auto:true},
                {l:"Color Code(s) →",v:row.colorCodes||"—",mono:true},
                {l:"Size Range",v:row.sizeRange||"—"},
              ].map(f=>(
                <div key={f.l} style={{ background:C.surface, borderRadius:7,
                  padding:"10px 14px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:8, fontWeight:900, textTransform:"uppercase",
                    letterSpacing:.5, marginBottom:5,
                    color:f.auto?C.purple:C.muted }}>{f.l}</div>
                  <div style={{ fontSize:14, fontWeight:700,
                    fontFamily:f.mono?"'IBM Plex Mono',monospace":"inherit",
                    color:f.auto?C.purple:C.text }}>{f.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   SPLIT VIEW  (◫)
═══════════════════════════════════════════════════════════════ */
function SplitView({ sorted, onEdit, onDetail }) {
  const [sel, setSel]   = useState(sorted[0] || null);
  const [tab, setTab]   = useState("details");
  const [srch, setSrch] = useState("");

  // keep selection valid when sorted changes
  const visRows = useMemo(()=>{
    if (!srch) return sorted;
    const q=srch.toLowerCase();
    return sorted.filter(r=>String(r.code+r.desc+r.l2Category+r.gender).toLowerCase().includes(q));
  },[sorted,srch]);

  // if selected row no longer in list, fallback to first
  const effSel = (sel && visRows.find(r=>r.code===sel.code)) ? sel : (visRows[0]||null);
  const st = effSel ? (STATUS[effSel.status]||STATUS.Inactive) : null;

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* ── LEFT LIST ── */}
      <div style={{ width:285, flexShrink:0, display:"flex", flexDirection:"column",
        borderRight:`2px solid ${C.border}`, background:C.surface }}>
        {/* list search */}
        <div style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)",
              fontSize:12, color:C.muted, pointerEvents:"none" }}>⌕</span>
            <input value={srch} onChange={e=>setSrch(e.target.value)}
              placeholder="Search list…"
              style={{ width:"100%", padding:"5px 24px", border:`1.5px solid ${C.border}`,
                borderRadius:6, fontSize:10.5, outline:"none",
                background:"#f9fafb", fontFamily:"inherit", color:C.text }}/>
            {srch && <button onClick={()=>setSrch("")} style={{ position:"absolute", right:7,
              top:"50%", transform:"translateY(-50%)",
              border:"none", background:"none", color:C.muted, cursor:"pointer", fontSize:12 }}>×</button>}
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {visRows.map(r=>{
            const s=STATUS[r.status]||STATUS.Inactive;
            const on=effSel?.code===r.code;
            return (
              <div key={r.code} onClick={()=>{setSel(r);setTab("details");}}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                  borderBottom:`1px solid #f1f4f9`,
                  background:on?"#fff7f0":C.surface,
                  borderLeft:`3px solid ${on?C.orange:"transparent"}`,
                  cursor:"pointer", transition:"background .1s" }}
                onMouseEnter={e=>{if(!on) e.currentTarget.style.background="#f8f9ff";}}
                onMouseLeave={e=>{e.currentTarget.style.background=on?"#fff7f0":C.surface;}}>
                <ImgThumb src={r.imageLink} size={40} radius={7}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                    <span style={{ fontSize:10, fontWeight:900, color:C.orange,
                      fontFamily:"'IBM Plex Mono',monospace" }}>{r.code}</span>
                    <span style={{ width:5,height:5,borderRadius:"50%",background:s.dot }}/>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:C.text, lineHeight:1.3,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.desc}</div>
                  <div style={{ fontSize:8.5, color:C.muted, marginTop:1 }}>
                    {r.l2Category}{r.gender?` · ${r.gender}`:""}
                  </div>
                </div>
                <SketchThumb src={r.sketchLink} size={28} radius={4}/>
              </div>
            );
          })}
          {visRows.length===0 && (
            <div style={{ padding:32, textAlign:"center", color:C.muted, fontSize:11 }}>No results</div>
          )}
        </div>
        <div style={{ padding:"5px 10px", borderTop:`1px solid ${C.border}`,
          background:C.faint, fontSize:9, color:C.muted }}>{visRows.length} articles</div>
      </div>

      {/* ── RIGHT DETAIL ── */}
      {effSel ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflowY:"auto", background:C.bg }}>
          {/* Hero */}
          <div style={{ display:"flex", background:C.surface,
            borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ width:210, height:210, flexShrink:0, overflow:"hidden" }}>
              <ImgThumb src={effSel.imageLink} size={210} radius={0}/>
            </div>
            <div style={{ width:150, flexShrink:0, height:210, background:C.faint,
              borderLeft:`1px solid ${C.border}`,
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:8, padding:10 }}>
              <span style={{ fontSize:8.5, fontWeight:900, color:C.muted, letterSpacing:.5 }}>✏ SKETCH / TECH PACK</span>
              <SketchThumb src={effSel.sketchLink} size={112} radius={8}/>
              <button style={{ fontSize:8.5, padding:"3px 11px",
                border:`1px solid ${C.border}`, borderRadius:5,
                background:C.surface, color:C.sub, cursor:"pointer" }}>↗ Open link</button>
            </div>
            <div style={{ flex:1, padding:"18px 20px", minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <span style={{ fontSize:24, fontWeight:900, color:C.orange,
                  fontFamily:"'IBM Plex Mono',monospace" }}>{effSel.code}</span>
                <StatusBadge s={effSel.status}/>
              </div>
              {effSel.shortName && <div style={{ fontSize:10, color:C.muted, marginBottom:5 }}>"{effSel.shortName}"</div>}
              <div style={{ fontSize:14, fontWeight:800, color:C.text,
                lineHeight:1.4, marginBottom:9 }}>{effSel.desc}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:7 }}>
                {[effSel.gender,effSel.l2Category,effSel.l3Style,effSel.fitType,effSel.neckline,effSel.sleeveType]
                  .filter(Boolean).map((v,i)=>(
                  <span key={i} style={{ fontSize:9, padding:"3px 8px", borderRadius:8,
                    background:"#f1f5f9", color:"#475569", fontWeight:700 }}>{v}</span>
                ))}
                {effSel.season && String(effSel.season).split(",").map(s=>(
                  <span key={s} style={{ fontSize:9, padding:"3px 8px", borderRadius:8,
                    background:"#dbeafe", color:C.blue, fontWeight:700 }}>{s.trim()}</span>
                ))}
              </div>
              {effSel.buyerStyle && <div style={{ fontSize:9.5, color:C.muted }}>
                Buyer Style: <b style={{ color:C.sub }}>{effSel.buyerStyle}</b></div>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`,
            display:"flex", padding:"0 18px", flexShrink:0, alignItems:"center" }}>
            {[{id:"details",l:"📋 Item Details"},{id:"pricing",l:"₹ Pricing & Tax"},{id:"fabric",l:"🧵 Fabric"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                padding:"9px 14px", border:"none", background:"transparent",
                borderBottom:`2.5px solid ${tab===t.id?C.orange:"transparent"}`,
                fontSize:10.5, fontWeight:tab===t.id?900:700,
                color:tab===t.id?C.orange:C.sub, cursor:"pointer",
                transition:"all .15s" }}>{t.l}</button>
            ))}
            <div style={{ flex:1 }}/>
            <button onClick={()=>onEdit(effSel)} style={{ padding:"5px 16px",
              border:`1.5px solid ${C.orange}`, borderRadius:6,
              background:C.orangeSoft, color:C.orange,
              fontSize:10, fontWeight:900, cursor:"pointer" }}>✎ Edit Record</button>
          </div>

          {/* Tab content */}
          <div style={{ padding:"14px 18px" }}>
            {tab==="details" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px 14px" }}>
                {[{l:"L1 Division",v:effSel.l1Division},{l:"L2 Category",v:effSel.l2Category},{l:"L3 Style",v:effSel.l3Style},
                  {l:"Gender",v:effSel.gender},{l:"Fit Type",v:effSel.fitType},{l:"Neckline",v:effSel.neckline},
                  {l:"Sleeve Type",v:effSel.sleeveType},{l:"Size Range",v:effSel.sizeRange},
                  {l:"⟷ Tags",v:effSel.tags,wide:true},{l:"Remarks",v:effSel.remarks,wide:true}
                ].map(f=>(
                  <div key={f.l} style={{ gridColumn:f.wide?"1/-1":"auto",
                    background:C.surface, borderRadius:7, padding:"8px 12px",
                    border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:8, fontWeight:900, color:C.muted,
                      textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>{f.l}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:f.v?C.text:C.dim }}>{f.v||"—"}</div>
                  </div>
                ))}
              </div>
            )}
            {tab==="pricing" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px 14px" }}>
                {[{l:"W.S.P",v:effSel.wsp?`₹${effSel.wsp}`:"—",mono:true},
                  {l:"MRP",v:effSel.mrp?`₹${effSel.mrp}`:"—",mono:true},
                  {l:"∑ Final Markup %",v:effSel.markupPct?`${effSel.markupPct}%`:"—",mono:true,auto:true},
                  {l:"∑ Final Markdown %",v:effSel.markdownPct?`${effSel.markdownPct}%`:"—",mono:true,auto:true},
                  {l:"HSN Code →",v:effSel.hsnCode||"—",mono:true},
                  {l:"← GST %",v:effSel.gstPct?`${effSel.gstPct}%`:"—",mono:true,auto:true}
                ].map(f=>(
                  <div key={f.l} style={{ background:C.surface, borderRadius:7,
                    padding:"10px 14px", border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:8, fontWeight:900, textTransform:"uppercase",
                      letterSpacing:.5, marginBottom:5, color:f.auto?C.purple:C.muted }}>{f.l}</div>
                    <div style={{ fontSize:22, fontWeight:900, fontFamily:"'IBM Plex Mono',monospace",
                      color:f.auto?C.purple:C.text }}>{f.v}</div>
                  </div>
                ))}
              </div>
            )}
            {tab==="fabric" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 14px" }}>
                {[{l:"Main Fabric Code →",v:effSel.mainFabric||"—",mono:true},
                  {l:"← Fabric Name",v:effSel.fabricName||"—",auto:true},
                  {l:"Color Code(s) →",v:effSel.colorCodes||"—",mono:true},
                  {l:"Size Range",v:effSel.sizeRange||"—"}
                ].map(f=>(
                  <div key={f.l} style={{ background:C.surface, borderRadius:7,
                    padding:"10px 14px", border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:8, fontWeight:900, textTransform:"uppercase",
                      letterSpacing:.5, marginBottom:5, color:f.auto?C.purple:C.muted }}>{f.l}</div>
                    <div style={{ fontSize:14, fontWeight:700,
                      fontFamily:f.mono?"'IBM Plex Mono',monospace":"inherit",
                      color:f.auto?C.purple:C.text }}>{f.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", color:C.muted, gap:8 }}>
          <div style={{ fontSize:32 }}>👕</div>
          <div style={{ fontSize:13 }}>Select an article to view details</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // ── Table / Split view switcher ──
  const [viewMode, setViewMode] = useState("table");  // "table" | "split"

  // ── Global search ──
  const [search, setSearch] = useState("");

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = useCallback(msg => { setToast(msg); setTimeout(()=>setToast(null),2300); },[]);

  // ── Detail modal ──
  const [detailRow, setDetailRow] = useState(null);

  // ── Column sort (multi-level, driven by Sort Panel) ──
  const [sorts, setSorts] = useState([{ id:1, key:"code", dir:"asc" }]);
  const [colMgr, setColMgr] = useState(false);

  // ── Column filter panel ──
  const [showFilter, setShowFilter] = useState(false);
  const [colFilters, setColFilters] = useState({});

  // ── Sort panel ──
  const [showSort, setShowSort] = useState(false);

  // ── Export menu ──
  const [showExport, setShowExport] = useState(false);

  // ── Views ──
  const [activeViewId,  setActiveViewId]  = useState("all");
  const [customViews,   setCustomViews]   = useState([]);
  const [showNewView,   setShowNewView]   = useState(false);
  const [editingView,   setEditingView]   = useState(null);
  const [showManage,    setShowManage]    = useState(false);

  // ── Derived views ──
  const allViews   = useMemo(()=>[...SYSTEM_VIEWS,...customViews],[customViews]);
  const activeView = allViews.find(v=>v.id===activeViewId)||SYSTEM_VIEWS[0];

  // ── Visible columns ──
  const visCols = useMemo(()=>
    COLS.filter(c=>activeView.cols.includes(c.key)),
    [activeView]
  );

  // ── Hidden cols for column manager (within visible) ──
  const [manualHidden, setManualHidden] = useState([]);
  const finalCols = useMemo(()=>
    visCols.filter(c=>!manualHidden.includes(c.key)),
    [visCols, manualHidden]
  );

  // ── Filter data ──
  const filtered = useMemo(()=>{
    let rows = MOCK;
    // Global search
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r=>Object.values(r).some(v=>String(v||"").toLowerCase().includes(q)));
    }
    // Column filters
    Object.entries(colFilters).forEach(([k,v])=>{
      if (!v||v==="all") return;
      const col=COLS.find(c=>c.key===k);
      if (["code","desc","shortName","buyerStyle","colorCodes","tags","remarks"].includes(k)) {
        rows=rows.filter(r=>String(r[k]||"").toLowerCase().includes(v.toLowerCase()));
      } else {
        rows=rows.filter(r=>String(r[k]||"")=== v);
      }
    });
    return rows;
  },[search, colFilters]);

  // ── Sort data (multi-level) ──
  const sorted = useMemo(()=>{
    if (!sorts.length) return filtered;
    return [...filtered].sort((a,b)=>{
      for (const s of sorts) {
        const col=COLS.find(c=>c.key===s.key);
        let av=a[s.key],bv=b[s.key];
        let cmp=0;
        if (col?.num) { cmp=(+(av||0))-(+(bv||0)); }
        else           { cmp=String(av||"").localeCompare(String(bv||"")); }
        if (cmp!==0) return s.dir==="asc"?cmp:-cmp;
      }
      return 0;
    });
  },[filtered, sorts]);

  // ── Primary sort key (for column header indicator) ──
  const primarySort = sorts[0] || null;

  // ── Col header click ─ adds/toggles primary sort ──
  const handleColSort = col => {
    if (!col.sortable) return;
    setSorts(prev=>{
      if (prev.length>0 && prev[0].key===col.key) {
        return [{ ...prev[0], dir:prev[0].dir==="asc"?"desc":"asc" }, ...prev.slice(1)];
      }
      return [{ id:Date.now(), key:col.key, dir:"asc" }, ...prev.filter(s=>s.key!==col.key)];
    });
  };

  // ── View CRUD ──
  const handleSaveView = vd => {
    if (editingView) setCustomViews(p=>p.map(v=>v.id===vd.id?vd:v));
    else { setCustomViews(p=>[...p,vd]); setActiveViewId(vd.id); }
    setShowNewView(false); setEditingView(null);
  };
  const handleDeleteView    = id => { setCustomViews(p=>p.filter(v=>v.id!==id)); if(activeViewId===id) setActiveViewId("all"); };
  const handleDuplicateView = v  => setCustomViews(p=>[...p,{...v,id:`cv_${Date.now()}`,name:`${v.name} (copy)`,isSystem:false}]);

  const existingNames = allViews.map(v=>v.name);
  const hasFilter     = Object.values(colFilters).some(v=>v&&v!=="all");
  const hasSort       = sorts.length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;0,900&family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Nunito Sans',sans-serif}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#c9d3df;border-radius:10px}
        ::-webkit-scrollbar-track{background:transparent}
        select option{background:#fff;color:#1a2332}
        @keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes slideFromRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        .trow:hover td{background:#f5f8ff!important}
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", height:"100vh",
        fontFamily:"'Nunito Sans',sans-serif", background:C.bg, color:C.text, overflow:"hidden" }}>

        {/* ══ SHELL BAR ══ */}
        <div style={{ height:44, flexShrink:0, background:C.slate,
          display:"flex", alignItems:"center", padding:"0 14px", gap:8,
          borderBottom:`1px solid ${C.slate3}` }}>
          <div style={{ width:26, height:26, borderRadius:6, background:C.red,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, flexShrink:0 }}>👕</div>
          <span style={{ fontSize:11, fontWeight:900, color:"#e2e8f0" }}>CC ERP</span>
          <span style={{ color:C.slate3, fontSize:12 }}>›</span>
          <span style={{ fontSize:9.5, color:"#64748b" }}>FILE 1A</span>
          <span style={{ color:C.slate3, fontSize:12 }}>›</span>
          <span style={{ fontSize:9.5, color:"#94a3b8" }}>ARTICLE_MASTER</span>
          <span style={{ color:C.slate3, fontSize:12 }}>›</span>
          <span style={{ fontSize:9.5, fontWeight:900, color:C.orange }}>Records</span>
          <div style={{ flex:1 }}/>
          {[{s:"Active",c:"#22c55e"},{s:"Development",c:"#f59e0b"},{s:"Discontinued",c:"#ef4444"},{s:"Inactive",c:"#94a3b8"}].map(({s,c})=>{
            const n=MOCK.filter(d=>d.status===s).length;
            return n>0?(
              <div key={s} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:c }}/>
                <span style={{ fontSize:9, color:"#64748b", fontWeight:700 }}>{n} {s}</span>
              </div>
            ):null;
          })}
          <div style={{ width:1, height:20, background:C.slate3, margin:"0 6px" }}/>
          {[{c:C.orange,l:"Manual"},{c:C.purple,l:"← Auto GAS"},{c:C.blue,l:"→ FK"}].map(i=>(
            <div key={i.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:i.c }}/>
              <span style={{ fontSize:8.5, color:"#64748b" }}>{i.l}</span>
            </div>
          ))}
        </div>

        {/* ══ SINGLE VIEWS BAR ══ */}
        <div style={{ background:C.surface, borderBottom:`2px solid ${C.border}`,
          flexShrink:0, padding:"0 12px",
          display:"flex", alignItems:"center", gap:4,
          minHeight:40, overflowX:"auto" }}>

          <span style={{ fontSize:8, fontWeight:900, color:C.muted, letterSpacing:1,
            textTransform:"uppercase", flexShrink:0, marginRight:4 }}>VIEWS:</span>

          {allViews.map(v=>{
            const isActive=activeViewId===v.id;
            return (
              <button key={v.id}
                onClick={()=>setActiveViewId(isActive?"all":v.id)}
                title={v.desc?`${v.name} — ${v.desc} · ${v.cols.length} cols`:`${v.name} · ${v.cols.length} cols`}
                style={{ display:"flex", alignItems:"center", gap:5,
                  padding:"5px 11px", borderRadius:8, flexShrink:0, cursor:"pointer",
                  transition:"all .15s", fontFamily:"inherit",
                  border:`1.5px solid ${isActive?v.color:C.border}`,
                  background:isActive?v.color+"18":"#f9fafb" }}>
                <span style={{ fontSize:11 }}>{v.icon}</span>
                <span style={{ fontSize:9.5, fontWeight:isActive?900:700,
                  color:isActive?v.color:C.sub, whiteSpace:"nowrap" }}>{v.name}</span>
                {isActive ? (
                  <>
                    <span style={{ width:5,height:5,borderRadius:"50%",background:v.color,flexShrink:0 }}/>
                    <span style={{ fontSize:7.5, padding:"1px 5px", borderRadius:6,
                      background:v.color+"22", color:v.color, fontWeight:900 }}>
                      {finalCols.length}c
                    </span>
                  </>
                ) : v.isSystem ? (
                  <span style={{ fontSize:7, padding:"0 3px", borderRadius:3,
                    background:"#f1f5f9", color:"#b0bac5", fontWeight:900 }}>SYS</span>
                ) : null}
              </button>
            );
          })}

          <div style={{ width:1, height:22, background:C.border, flexShrink:0, margin:"0 3px" }}/>

          {/* Filter */}
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

          {/* Sort */}
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

          {/* + New View */}
          <button onClick={()=>{setEditingView(null);setShowNewView(true);}} style={{
            display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
            borderRadius:8, cursor:"pointer", flexShrink:0, fontFamily:"inherit",
            border:`1.5px dashed ${C.orange}`,
            background:C.orangeSoft, color:C.orange,
            fontSize:9.5, fontWeight:900, transition:"all .15s" }}>
            + New View
          </button>

          {/* Manage */}
          <button onClick={()=>setShowManage(true)} style={{
            display:"flex", alignItems:"center", gap:4, padding:"5px 12px",
            borderRadius:8, cursor:"pointer", flexShrink:0, fontFamily:"inherit",
            border:`1.5px solid ${C.border}`,
            background:"#f9fafb", color:C.sub,
            fontSize:9.5, fontWeight:800, transition:"all .15s" }}>
            Manage
          </button>
        </div>

        {/* ══ TOOLBAR ══ */}
        <div style={{ display:"flex", alignItems:"center", gap:8,
          padding:"7px 12px", background:C.surface,
          borderBottom:`1.5px solid ${C.border}`, flexShrink:0 }}>

          {/* Search */}
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)",
              fontSize:13, color:C.muted, pointerEvents:"none" }}>⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={`Search ${MOCK.length} articles…`}
              style={{ padding:"6px 28px", border:`1.5px solid ${C.border}`,
                borderRadius:7, fontSize:11, outline:"none", width:210,
                background:"#f9fafb", fontFamily:"inherit", color:C.text }}
              onFocus={e=>e.target.style.borderColor=C.orange}
              onBlur={e=>e.target.style.borderColor=C.border}/>
            {search && (
              <button onClick={()=>setSearch("")} style={{ position:"absolute", right:8,
                top:"50%", transform:"translateY(-50%)",
                border:"none", background:"none", color:C.muted, cursor:"pointer", fontSize:13 }}>×</button>
            )}
          </div>

          {/* Column manager toggle */}
          <button onClick={()=>setColMgr(p=>!p)} style={{ padding:"5px 10px",
            border:`1.5px solid ${colMgr?C.purple:C.border}`,
            borderRadius:6, background:colMgr?C.purpleSoft:"#f9fafb",
            color:colMgr?C.purple:C.sub,
            fontSize:10, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
            ⊟ Columns ({finalCols.length})
          </button>

          <div style={{ flex:1 }}/>

          <span style={{ fontSize:9, color:C.muted, fontWeight:700 }}>
            {sorted.length}<span style={{ color:C.dim }}>/{MOCK.length}</span> records
          </span>

          {/* Table / Split switcher */}
          <div style={{ display:"flex", borderRadius:7, overflow:"hidden",
            border:`1.5px solid ${C.border}`, flexShrink:0 }}>
            {[{id:"table",icon:"⊟",label:"Table"},{id:"split",icon:"◫",label:"Split"}].map(v=>(
              <button key={v.id} onClick={()=>setViewMode(v.id)} style={{
                display:"flex", alignItems:"center", gap:4,
                padding:"5px 11px", border:"none", cursor:"pointer",
                background:viewMode===v.id?C.slate:"#f9fafb",
                color:viewMode===v.id?"#fff":C.sub,
                fontSize:10, fontWeight:900, transition:"all .15s",
                borderRight:v.id==="table"?`1px solid ${C.border}`:"none",
                fontFamily:"inherit" }}>
                <span style={{ fontSize:12 }}>{v.icon}</span>{v.label}
              </button>
            ))}
          </div>

          {/* Export */}
          <button onClick={()=>setShowExport(p=>!p)} style={{
            display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
            border:`1.5px solid ${C.border}`, borderRadius:7,
            background:"#f9fafb", color:C.sub,
            fontSize:10, fontWeight:800, cursor:"pointer", fontFamily:"inherit",
            transition:"all .15s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.green;e.currentTarget.style.color=C.green;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.sub;}}>
            ⬇ Export
          </button>
        </div>

        {/* Column manager strip */}
        {colMgr && (
          <div style={{ padding:"7px 12px", borderBottom:`1px solid ${C.border}`,
            background:"#fafafa", display:"flex", flexWrap:"wrap", gap:4, flexShrink:0 }}>
            {visCols.filter(c=>!c.special).map(c=>{
              const off=manualHidden.includes(c.key);
              return (
                <button key={c.key}
                  onClick={()=>setManualHidden(p=>off?p.filter(x=>x!==c.key):[...p,c.key])}
                  style={{ padding:"2px 9px", borderRadius:10, fontSize:9, fontWeight:700, cursor:"pointer",
                    border:`1.5px solid ${off?C.border:C.purple+"55"}`,
                    background:off?"#f9fafb":C.purpleSoft,
                    color:off?C.muted:C.purple,
                    textDecoration:off?"line-through":"none" }}>
                  {c.label}
                </button>
              );
            })}
            {manualHidden.length>0 && (
              <button onClick={()=>setManualHidden([])} style={{ padding:"2px 9px",
                borderRadius:10, fontSize:9, fontWeight:800, cursor:"pointer",
                border:`1px solid ${C.orange}`, background:C.orangeSoft, color:C.orange }}>
                Show all
              </button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {hasFilter && (
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap",
            padding:"5px 12px", borderBottom:`1px solid ${C.border}`,
            background:"#fffcf8", flexShrink:0 }}>
            <span style={{ fontSize:8.5, fontWeight:900, color:C.orange }}>⊟ Active filters:</span>
            {Object.entries(colFilters).filter(([,v])=>v&&v!=="all").map(([k,v])=>{
              const col=COLS.find(c=>c.key===k);
              return (
                <span key={k} style={{ display:"inline-flex", alignItems:"center", gap:4,
                  fontSize:8.5, padding:"2px 8px", borderRadius:8,
                  background:C.orange+"18", color:C.orange, fontWeight:700 }}>
                  <b>{col?.label}</b>: {v}
                  <button onClick={()=>setColFilters(p=>({...p,[k]:"all"}))} style={{
                    border:"none", background:"none", color:C.orange,
                    cursor:"pointer", fontSize:12, lineHeight:1, padding:0 }}>×</button>
                </span>
              );
            })}
            <button onClick={()=>setColFilters({})} style={{ padding:"2px 8px", border:"none",
              background:"transparent", color:C.muted, fontSize:8.5, cursor:"pointer", fontWeight:700 }}>
              Clear all
            </button>
          </div>
        )}

        {/* ══ CONTENT: TABLE or SPLIT ══ */}
        {viewMode === "split" ? (
          <SplitView sorted={sorted} onEdit={r=>showToast(`Opening editor for ${r.code}…`)} onDetail={setDetailRow}/>
        ) : null}
        <div style={{ flex:1, overflow:"auto", display:viewMode==="split"?"none":"block" }}>
          <table style={{ borderCollapse:"collapse", tableLayout:"fixed",
            minWidth:finalCols.reduce((a,c)=>a+c.w,0)+76 }}>
            <colgroup>
              {finalCols.map(c=><col key={c.key} style={{ width:c.w }}/>)}
              <col style={{ width:76 }}/>
            </colgroup>
            <thead style={{ position:"sticky", top:0, zIndex:10 }}>
              <tr style={{ background:C.slate }}>
                {finalCols.map(c=>(
                  <th key={c.key}
                    onClick={()=>handleColSort(c)}
                    title={c.sortable?"Click to sort":""}
                    style={{ padding:"8px 9px", textAlign:"left",
                      fontSize:8.5, fontWeight:900,
                      color:c.auto?"#a78bfa":(primarySort?.key===c.key?C.orange:"#94a3b8"),
                      borderRight:`1px solid ${C.slate3}`,
                      whiteSpace:"nowrap", letterSpacing:.4, textTransform:"uppercase",
                      background:primarySort?.key===c.key?C.slate2:c.auto?"#1e1a35":"transparent",
                      cursor:c.sortable?"pointer":"default", userSelect:"none" }}>
                    {c.label}
                    {c.sortable && primarySort?.key===c.key && (
                      <span style={{ marginLeft:3, color:C.orange }}>
                        {primarySort.dir==="asc"?"↑":"↓"}
                      </span>
                    )}
                    {sorts.findIndex(s=>s.key===c.key)>0 && (
                      <span style={{ marginLeft:2, fontSize:7, color:"#64748b",
                        verticalAlign:"super" }}>
                        {sorts.findIndex(s=>s.key===c.key)+1}
                      </span>
                    )}
                  </th>
                ))}
                <th style={{ padding:"8px 9px", fontSize:8.5, fontWeight:900,
                  color:"#94a3b8", textAlign:"center",
                  textTransform:"uppercase", letterSpacing:.4 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row,ri)=>(
                <tr key={row.code} className="trow"
                  onClick={()=>setDetailRow(row)}
                  style={{ cursor:"pointer", transition:"background .08s",
                    borderLeft:`3px solid transparent`,
                    borderBottom:"1px solid #f1f4f9" }}>
                  {finalCols.map(c=>(
                    <td key={c.key} style={{ padding:c.special?"5px 8px":"4px 9px",
                      overflow:"hidden", verticalAlign:"middle",
                      background:c.auto?"#faf7ff":"transparent",
                      borderRight:"1px solid #f5f7fb" }}>
                      <CellVal col={c} row={row}/>
                    </td>
                  ))}
                  <td style={{ padding:"4px 8px", textAlign:"center", verticalAlign:"middle",
                    background:ri%2===0?"#fff":"#fafbfd" }}>
                    <button onClick={e=>{ e.stopPropagation(); showToast(`Opening editor for ${row.code}…`); }} style={{
                      padding:"3px 11px",
                      border:`1px solid ${C.orange}`, borderRadius:5,
                      background:C.orangeSoft, color:C.orange,
                      fontSize:9, fontWeight:800, cursor:"pointer" }}>✎ Edit</button>
                  </td>
                </tr>
              ))}
              {sorted.length===0 && (
                <tr><td colSpan={finalCols.length+1} style={{ padding:48,
                  textAlign:"center", color:C.muted, fontSize:12 }}>
                  No articles match your search or filters.
                  {(search||hasFilter) && (
                    <button onClick={()=>{setSearch("");setColFilters({});}} style={{
                      marginLeft:10, padding:"4px 12px",
                      border:`1px solid ${C.orange}`, borderRadius:6,
                      background:C.orangeSoft, color:C.orange,
                      fontSize:10, fontWeight:800, cursor:"pointer" }}>Clear all</button>
                  )}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ══ STATUS BAR ══ */}
        <div style={{ padding:"4px 12px", borderTop:`1px solid ${C.border}`,
          background:C.faint, display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
          <span style={{ fontSize:9, color:C.muted }}>
            {sorted.length} records · {finalCols.length} cols
            {primarySort && <> · sorted by <b style={{ color:C.sub }}>{COLS.find(c=>c.key===primarySort.key)?.label}</b> {primarySort.dir==="asc"?"↑":"↓"}</>}
            {sorts.length>1 && <span style={{ color:C.muted }}> +{sorts.length-1} more</span>}
          </span>
          {/* Active view chip */}
          {activeViewId!=="all" && (
            <span style={{ fontSize:8.5, padding:"2px 8px", borderRadius:8,
              background:activeView.color+"18", color:activeView.color, fontWeight:800 }}>
              {activeView.icon} {activeView.name}
            </span>
          )}
          {hasFilter && <span style={{ fontSize:8.5, color:C.orange, fontWeight:800 }}>⊟ Filtered</span>}
          <div style={{ flex:1 }}/>
          {[{s:"Active",c:"#22c55e"},{s:"Development",c:"#f59e0b"},{s:"Discontinued",c:"#ef4444"},{s:"Inactive",c:"#94a3b8"}].map(({s,c})=>{
            const n=MOCK.filter(d=>d.status===s).length;
            return n>0?(
              <span key={s} style={{ display:"flex", alignItems:"center", gap:4, fontSize:8.5 }}>
                <span style={{ width:6,height:6,borderRadius:"50%",background:c }}/>
                <span style={{ color:C.sub, fontWeight:700 }}>{n}</span>
                <span style={{ color:C.muted }}>{s}</span>
              </span>
            ):null;
          })}
        </div>
      </div>

      {/* ══ MODALS & PANELS ══ */}
      {detailRow && (
        <DetailModal row={detailRow} onClose={()=>setDetailRow(null)}
          onEdit={row=>showToast(`Opening editor for ${row.code}…`)}/>
      )}
      {showNewView && (
        <NewViewModal existingNames={existingNames} editView={editingView}
          onSave={handleSaveView}
          onClose={()=>{ setShowNewView(false); setEditingView(null); }}/>
      )}
      {showManage && (
        <ManagePanel customViews={customViews} activeViewId={activeViewId}
          onEdit={v=>{ setEditingView(v); setShowManage(false); setShowNewView(true); }}
          onDelete={handleDeleteView} onDuplicate={handleDuplicateView}
          onClose={()=>setShowManage(false)}/>
      )}
      {showFilter && (
        <FilterPanel data={MOCK} colFilters={colFilters} setColFilters={setColFilters}
          visCols={finalCols} onClose={()=>setShowFilter(false)}/>
      )}
      {showSort && (
        <SortPanel sorts={sorts} setSorts={setSorts} onClose={()=>setShowSort(false)}/>
      )}
      {showExport && (
        <ExportMenu count={sorted.length}
          onClose={()=>setShowExport(false)}
          onToast={showToast}/>
      )}

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)",
          padding:"9px 20px", background:C.slate, color:"#fff",
          borderRadius:8, fontSize:11, fontWeight:700,
          boxShadow:"0 8px 28px rgba(0,0,0,.22)",
          animation:"toastIn .25s ease", zIndex:9999 }}>{toast}</div>
      )}
    </>
  );
}
