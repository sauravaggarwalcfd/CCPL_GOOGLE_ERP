import { useState, useCallback } from "react";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       "#f0f2f6",
  surface:  "#ffffff",
  border:   "#e4e8ef",
  text:     "#1a2332",
  sub:      "#5a6a7e",
  muted:    "#9aa5b4",
  faint:    "#f4f6f9",
  row:      "#f9fafb",
  rowHov:   "#f1f4f9",
  red:      "#CC0000",
  redSoft:  "#fff0f0",
  orange:   "#E8690A",
  purple:   "#6c3fc5",
  purpleSoft:"#f0eeff",
  blue:     "#1d6fa4",
  green:    "#15803d",
  amber:    "#b45309",
  amberSoft:"#fffbeb",
  slate:    "#1e293b",
  inputBg:  "#f9fafb",
  inputBgOn:"#ffffff",
};

/* ─── DATA ───────────────────────────────────────────────────── */
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
      { key:"buyerStyle",label:"Buyer Style No", req:false, type:"text" },
    ],
  },
  {
    id:"details", icon:"👕", label:"Item Details", acc:"#059669",
    fields:[
      { key:"l1Division",label:"L1 Division",    req:false, type:"auto",  auto:true,
        hint:"Auto-set: Apparel" },
      { key:"l2Category",label:"L2 Category",    req:true,  type:"select",
        hint:"Drives L3 options, HSN & GST auto-fill",
        opts:["Tops - Polo","Tops - Tee","Sweatshirt","Tracksuit","Bottoms"] },
      { key:"l3Style",   label:"L3 Style",       req:false, type:"select",
        hint:"Cascades from L2",
        opts:["Pique","Smooth Knit","Waffle","French Terry","Fleece","Hooded"] },
      { key:"season",    label:"Season",         req:false, type:"select",
        opts:["SS25","AW25","SS26","AW26","Year Round"] },
      { key:"gender",    label:"Gender",         req:true,  type:"select",
        opts:["Men","Women","Kids","Unisex"] },
      { key:"fitType",   label:"Fit Type",       req:false, type:"select",
        opts:["Regular","Slim","Relaxed","Oversized","Athletic"] },
      { key:"neckline",  label:"Neckline",       req:false, type:"select",
        opts:["Round Neck","V-Neck","Collar","Hooded","Mock Neck"] },
      { key:"sleeveType",label:"Sleeve Type",    req:false, type:"select",
        opts:["Half Sleeve","Full Sleeve","Sleeveless","3/4 Sleeve","Raglan"] },
    ],
  },
  {
    id:"fabric", icon:"🧵", label:"Fabric & Colors", acc:C.purple,
    fields:[
      { key:"mainFabric",label:"Main Fabric",    req:false, type:"select",
        hint:"FK → RM_MASTER_FABRIC",
        opts:["RM-FAB-001 — Pique 180GSM 100% Cotton",
              "RM-FAB-002 — French Terry 260GSM 65/35",
              "RM-FAB-003 — Fleece 320GSM 80/20 CVC"],
        fk:"RM_MASTER_FABRIC" },
      { key:"fabricName",label:"Fabric Name",    req:false, type:"auto",   auto:true,
        hint:"Auto from Fabric FK" },
      { key:"colorCodes",label:"Color Code(s)",  req:false, type:"text",
        hint:"FK → COLOR_MASTER · pipe-separated" },
      { key:"sizeRange", label:"Size Range",     req:false, type:"text",
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
      { key:"hsnCode",   label:"HSN Code",        req:false, type:"select",
        hint:"Auto-suggested from L2 · FK → HSN_MASTER",
        opts:["6105","6109","6110","6112","6103"], fk:"HSN_MASTER" },
      { key:"gstPct",    label:"GST %",           req:false, type:"auto",   auto:true, mono:true,
        hint:"Auto from HSN Master" },
    ],
  },
  {
    id:"status", icon:"🏷️", label:"Status & Tags", acc:"#64748b",
    fields:[
      { key:"status",    label:"Status",          req:false, type:"select",
        hint:"Active = live · Development = not released",
        opts:["Active","Inactive","Development","Discontinued"] },
      { key:"remarks",   label:"Remarks",         req:false, type:"textarea" },
      { key:"tags",      label:"Tags",            req:false, type:"text",
        hint:"→ TAG_MASTER · comma-separated" },
    ],
  },
];

const ALL = SECTIONS.flatMap(s => s.fields);
const MAN = ALL.filter(f => !f.auto);
const REQ = ALL.filter(f => f.req && !f.auto);

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
function Inp({ f, val, onChange, onFocus, onBlur, focused, acc }) {
  const base = {
    width:"100%", fontSize:12, outline:"none",
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

  if (f.type === "select") return (
    <div style={{ position:"relative" }}>
      <select value={val||""} onChange={e=>onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
        style={{ ...base, appearance:"none", paddingRight:26, cursor:"pointer" }}>
        <option value="">—</option>
        {(f.opts||[]).map(o => <option key={o} value={o}>{o}</option>)}
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
      onChange={e=>onChange(e.target.value)}
      onFocus={onFocus} onBlur={onBlur}
      placeholder={f.type==="code" ? "e.g. 5249HP" : ""}
      style={base}/>
  );
}

/* ─── PREVIEW PANEL ──────────────────────────────────────────── */
function Preview({ fd }) {
  const filled = MAN.filter(f => fd[f.key]).length;
  const pct    = Math.round(filled / MAN.length * 100);
  const markup = fd.wsp && fd.mrp ? Math.round((+fd.mrp - +fd.wsp) / +fd.wsp * 100) : null;
  const st     = fd.status ? STATUS_COLORS[fd.status] : null;

  return (
    <div style={{
      width:220, flexShrink:0, background:C.slate,
      borderLeft:"1px solid #2d3f50",
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* header */}
      <div style={{ padding:"10px 13px 8px", borderBottom:"1px solid #2d3f50",
        display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:8.5, fontWeight:900, color:"#64748b", letterSpacing:1, textTransform:"uppercase", flex:1 }}>Live Preview</span>
        <Ring pct={pct} color={C.orange} size={24}/>
        <span style={{ fontSize:9, fontWeight:900, color:C.orange }}>{pct}%</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:8 }}>

        {/* Image card */}
        <div style={{ height:120, borderRadius:9, background:"linear-gradient(135deg,#253347,#1a2839)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          border:"1px dashed #3d5166", position:"relative", overflow:"hidden" }}>
          <div style={{ fontSize:28, marginBottom:4 }}>👕</div>
          <div style={{ fontSize:8, color:"#4d6070" }}>No image linked</div>

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
        {(fd.gender||fd.l2Category||fd.l3Style||fd.fitType||fd.season) && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
            {[
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
          <div style={{ background:"#253347", borderRadius:6, padding:"7px 9px",
            border:"1px solid #2d3f50" }}>
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

/* ─── MAIN ───────────────────────────────────────────────────── */
export default function App() {
  const [fd,    setFd]   = useState({ status:"Active" });
  const [open,  setOpen] = useState({ identity:true, details:true, fabric:false, pricing:false, status:false });
  const [focus, setFoc]  = useState(null);
  const [shake, setShk]  = useState(false);
  const [ok,    setOk]   = useState(false);

  const set    = useCallback((k,v) => setFd(p=>({...p,[k]:v})), []);
  const toggle = id => setOpen(p=>({...p,[id]:!p[id]}));

  const filled  = MAN.filter(f => fd[f.key]).length;
  const reqLeft = REQ.filter(f => !fd[f.key]);
  const isDirty = filled > 0;

  const handleSave = () => {
    if (reqLeft.length > 0) { setShk(true); setTimeout(()=>setShk(false),600); return; }
    setOk(true); setTimeout(()=>setOk(false),2500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#d1d8e0;border-radius:10px}
        select option{background:#fff;color:#1a2332}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
        @keyframes fade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .frow{transition:background .12s}
        .frow:hover{background:#f5f7fb}
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", height:"100vh",
        fontFamily:"'Nunito Sans',sans-serif", background:C.bg, color:C.text }}>

        {/* ── SHELL ── */}
        <div style={{ height:44, flexShrink:0, background:C.slate,
          display:"flex", alignItems:"center", padding:"0 14px", gap:8,
          borderBottom:"1px solid #2d3f50" }}>
          <div style={{ width:24,height:24,borderRadius:5,background:C.red,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}>👕</div>
          <span style={{ fontSize:10.5,fontWeight:900,color:"#e2e8f0" }}>CC ERP</span>
          <span style={{ color:"#2d3f50" }}>›</span>
          <span style={{ fontSize:9.5,color:"#64748b" }}>ARTICLE_MASTER</span>
          <span style={{ color:"#2d3f50" }}>›</span>
          <span style={{ fontSize:9.5,fontWeight:900,color:C.orange }}>Data Entry</span>
          <div style={{ flex:1 }}/>
          <div style={{ display:"flex",alignItems:"center",gap:6,
            padding:"3px 9px",borderRadius:20,background:"#253347",border:"1px solid #2d3f50" }}>
            <div style={{ width:56,height:4,background:"#1e293b",borderRadius:2,overflow:"hidden" }}>
              <div style={{ height:"100%",borderRadius:2,background:C.orange,
                width:(filled/MAN.length*100)+"%",transition:"width .3s" }}/>
            </div>
            <span style={{ fontSize:8.5,fontWeight:800,color:"#94a3b8" }}>
              {filled}<span style={{ color:"#4d6070" }}>/{MAN.length}</span>
            </span>
          </div>
          {isDirty && <span style={{ fontSize:8,color:"#f59e0b",fontWeight:900 }}>● Unsaved</span>}
        </div>

        {/* ── SECTION TAB STRIP ── */}
        <div style={{ background:C.surface, borderBottom:`2px solid ${C.border}`,
          flexShrink:0, padding:"0 12px", display:"flex", alignItems:"center", gap:0 }}>
          {SECTIONS.map(s => {
            const mf   = s.fields.filter(f=>!f.auto);
            const done = mf.filter(f=>fd[f.key]).length;
            const miss = s.fields.filter(f=>f.req&&!f.auto&&!fd[f.key]).length;
            const isOn = open[s.id];
            const all  = miss===0 && done>0 && done===mf.length;
            return (
              <button key={s.id} onClick={()=>toggle(s.id)} style={{
                padding:"9px 11px 8px", border:"none", background:"transparent",
                cursor:"pointer", display:"flex", alignItems:"center", gap:5,
                borderBottom:`3px solid ${isOn ? s.acc : "transparent"}`,
                transition:"all .15s",
              }}>
                <span style={{ fontSize:12 }}>{s.icon}</span>
                <span style={{ fontSize:9.5, fontWeight:isOn?900:700,
                  color:isOn?s.acc:C.sub, whiteSpace:"nowrap" }}>{s.label}</span>
                <div style={{ width:5,height:5,borderRadius:"50%",flexShrink:0,
                  background: miss>0?"#f59e0b":all?"#22c55e":done>0?s.acc:C.border,
                  transition:"background .2s" }}/>
              </button>
            );
          })}
          <div style={{ flex:1 }}/>
          {reqLeft.length>0 && (
            <div style={{ display:"flex",alignItems:"center",gap:4,
              padding:"3px 8px",borderRadius:6,
              background:C.amberSoft,border:"1px solid #fde68a",
              animation:shake?"shake .5s ease":"none" }}>
              <span style={{ fontSize:8,fontWeight:900,color:C.amber }}>⚠ {reqLeft.length}:</span>
              {reqLeft.slice(0,3).map(f=>(
                <button key={f.key} onClick={()=>{
                  const sec=SECTIONS.find(s=>s.fields.find(x=>x.key===f.key));
                  if(sec) setOpen(p=>({...p,[sec.id]:true}));
                  setTimeout(()=>setFoc(f.key),60);
                }} style={{ fontSize:7.5,padding:"1px 6px",borderRadius:8,
                  border:"none",background:"#fde68a",color:C.amber,fontWeight:800,cursor:"pointer" }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* ── FORM AREA ── */}
          <div style={{ flex:1, overflowY:"auto", padding:"10px 12px",
            display:"flex", flexDirection:"column", gap:7 }}>

            {SECTIONS.map(sec => {
              const isOn = open[sec.id];
              const mf   = sec.fields.filter(f=>!f.auto);
              const done = mf.filter(f=>fd[f.key]).length;
              const miss = sec.fields.filter(f=>f.req&&!f.auto&&!fd[f.key]).length;
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
                  }}>
                    <div style={{ width:28,height:28,borderRadius:7,flexShrink:0,
                      background:sec.acc+"16",display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:14 }}>{sec.icon}</div>
                    <div style={{ flex:1, textAlign:"left" }}>
                      <div style={{ fontSize:11,fontWeight:900,
                        color:isOn?sec.acc:C.text, lineHeight:1 }}>{sec.label}</div>
                      <div style={{ fontSize:8.5,color:C.muted,marginTop:1 }}>
                        {sec.fields.length} fields
                        {miss>0 && <span style={{ color:"#d97706",fontWeight:800 }}> · ⚠ {miss} required</span>}
                        {miss===0 && done===mf.length && done>0 && <span style={{ color:"#15803d",fontWeight:800 }}> · ✓ Complete</span>}
                      </div>
                    </div>
                    <Ring pct={pct} color={miss>0?"#f59e0b":pct===100&&done>0?"#22c55e":sec.acc} />
                    <span style={{ fontSize:9,color:C.muted,marginLeft:2,
                      transform:isOn?"rotate(180deg)":"rotate(0)",
                      transition:"transform .2s", display:"inline-block" }}>▼</span>
                  </button>

                  {/* ── FIELDS ── */}
                  {isOn && (
                    <div>
                      {sec.fields.map((f, fi) => {
                        const isFoc = focus===f.key;
                        const hasV  = !!fd[f.key];
                        const isLast= fi===sec.fields.length-1;

                        // Only show hint if it's meaningfully different from the label
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
                              {/* Label + badges in one row */}
                              <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                                <span style={{
                                  fontSize:11, fontWeight:800, lineHeight:1.2,
                                  color: f.req&&!f.auto ? C.red : f.auto ? C.purple : C.text,
                                }}>
                                  {f.req&&!f.auto && <span style={{ color:C.red, marginRight:1 }}>✱</span>}
                                  {f.label}
                                </span>
                                {/* Type badges — only one, most meaningful */}
                                {f.auto && (
                                  <span style={{ fontSize:7.5,padding:"1px 5px",borderRadius:3,
                                    background:"#ede9fe",color:C.purple,fontWeight:900,
                                    fontFamily:"'IBM Plex Mono',monospace" }}>← AUTO</span>
                                )}
                                {!f.auto && f.fk && (
                                  <span style={{ fontSize:7.5,padding:"1px 5px",borderRadius:3,
                                    background:"#e0f0fb",color:C.blue,fontWeight:900,
                                    fontFamily:"'IBM Plex Mono',monospace" }}>→ FK</span>
                                )}
                                {!f.auto && !f.fk && f.req && (
                                  <span style={{ fontSize:7.5,padding:"1px 5px",borderRadius:3,
                                    background:C.redSoft,color:C.red,fontWeight:900,
                                    fontFamily:"'IBM Plex Mono',monospace" }}>REQ</span>
                                )}
                              </div>
                              {/* field key */}
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
                              {/* Hint above input — only if it adds info */}
                              {showHint && (
                                <div style={{
                                  fontSize:8.5, color: isFoc ? C.sub : C.muted,
                                  marginBottom:3, lineHeight:1.3,
                                  transition:"color .15s",
                                }}>{f.hint}</div>
                              )}
                              <Inp f={f} val={fd[f.key]} onChange={v=>set(f.key,v)}
                                focused={isFoc} acc={sec.acc}
                                onFocus={()=>setFoc(f.key)}
                                onBlur={()=>setFoc(null)}/>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ height:12 }}/>
          </div>

          {/* ── PREVIEW ── */}
          <Preview fd={fd}/>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ flexShrink:0, background:C.surface,
          borderTop:`1.5px solid ${C.border}`,
          padding:"8px 14px", display:"flex", alignItems:"center", gap:10 }}>
          {/* Section dots */}
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {SECTIONS.map(s => {
              const mf  = s.fields.filter(f=>!f.auto);
              const done= mf.filter(f=>fd[f.key]).length;
              const miss= s.fields.filter(f=>f.req&&!f.auto&&!fd[f.key]).length;
              return (
                <div key={s.id} title={s.label} style={{
                  height:4, width: open[s.id] ? 20 : 12,
                  borderRadius:2,
                  background: miss>0?"#fde68a":done>0?s.acc:C.border,
                  transition:"all .3s",
                }}/>
              );
            })}
          </div>
          <span style={{ fontSize:9,color:C.muted,fontWeight:700 }}>
            {filled}/{MAN.length} · {REQ.length-reqLeft.length}/{REQ.length} req
          </span>
          {ok && <span style={{ fontSize:10,color:C.green,fontWeight:900,
            animation:"fade .3s ease" }}>✓ Saved to ARTICLE_MASTER</span>}
          <div style={{ flex:1 }}/>
          <button onClick={()=>setFd({status:"Active"})} style={{
            padding:"6px 13px", border:`1.5px solid ${C.border}`,
            borderRadius:6, background:C.faint, color:C.sub,
            fontSize:10, fontWeight:800, cursor:"pointer" }}>↺ Clear</button>
          <button onClick={handleSave} style={{
            padding:"6px 20px", border:"none", borderRadius:6,
            background: reqLeft.length>0 ? "#94a3b8" : C.red,
            color:"#fff", fontSize:10, fontWeight:900, cursor:"pointer",
            animation:shake?"shake .5s ease":"none",
            transition:"background .2s" }}>
            {reqLeft.length>0 ? `⚠ ${reqLeft.length} required` : "✓ Save to Sheet"}
          </button>
        </div>
      </div>
    </>
  );
}
