import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ── THEME + ACCENT ──────────────────────────────────────────────────────────
const MODES={
  light:   {bg:"#f0f2f5",sh:"#fff",shBd:"#e2e4e8",hi:"#fff",mid:"#f7f8fa",lo:"#f0f2f5",hov:"#eef1f8",inBg:"#fff",inBd:"#d1d5db",div:"#e5e7eb",thd:"#f4f5f7",tev:"#fff",tod:"#fafbfc",bBg:"#e5e7eb",bTx:"#374151",tA:"#111827",tB:"#374151",tC:"#6b7280",tD:"#9ca3af",scr:"#d1d5db",shadow:"0 4px 20px rgba(0,0,0,.09)"},
  black:   {bg:"#000",sh:"#0a0a0a",shBd:"#1c1c1c",hi:"#111",mid:"#161616",lo:"#0a0a0a",hov:"#1c1c1c",inBg:"#0d0d0d",inBd:"#2a2a2a",div:"#1f1f1f",thd:"#0d0d0d",tev:"#111",tod:"#141414",bBg:"#1c1c1c",bTx:"#888",tA:"#f0f0f0",tB:"#a0a0a0",tC:"#666",tD:"#444",scr:"#2a2a2a",shadow:"0 4px 28px rgba(0,0,0,.85)"},
  midnight:{bg:"#0d1117",sh:"#161b22",shBd:"#21262d",hi:"#1c2128",mid:"#161b22",lo:"#0d1117",hov:"#21262d",inBg:"#0d1117",inBd:"#30363d",div:"#21262d",thd:"#161b22",tev:"#1c2128",tod:"#161b22",bBg:"#21262d",bTx:"#7d8590",tA:"#e6edf3",tB:"#8b949e",tC:"#6e7681",tD:"#484f58",scr:"#30363d",shadow:"0 4px 24px rgba(0,0,0,.6)"},
  warm:    {bg:"#f0ebe0",sh:"#fdf8f0",shBd:"#e4d8c4",hi:"#fdfaf4",mid:"#f5f0e8",lo:"#ede5d4",hov:"#e8dece",inBg:"#fdfaf4",inBd:"#d4c8b0",div:"#ddd0b8",thd:"#f0ebe0",tev:"#fdfaf4",tod:"#f5f0e8",bBg:"#e4d8c4",bTx:"#4a3c28",tA:"#1c1409",tB:"#5a4a34",tC:"#8a7460",tD:"#b0a090",scr:"#c8b89c",shadow:"0 4px 16px rgba(60,40,10,.12)"},
  slate:   {bg:"#1a2030",sh:"#252d40",shBd:"#2d3654",hi:"#2a3450",mid:"#222a3e",lo:"#1a2030",hov:"#2d3654",inBg:"#1a2030",inBd:"#2d3654",div:"#2d3654",thd:"#1e2433",tev:"#222a3e",tod:"#1e2433",bBg:"#2d3654",bTx:"#8895b0",tA:"#d8e0f0",tB:"#8895b0",tC:"#5a6680",tD:"#3a4460",scr:"#2d3654",shadow:"0 4px 24px rgba(0,0,0,.5)"},
};
const ACC={
  orange:{a:"#E8690A",al:"rgba(232,105,10,.12)",tx:"#fff"},
  blue:  {a:"#0078D4",al:"rgba(0,120,212,.12)",  tx:"#fff"},
  teal:  {a:"#007C7C",al:"rgba(0,124,124,.12)",  tx:"#fff"},
  green: {a:"#15803D",al:"rgba(21,128,61,.12)",  tx:"#fff"},
  purple:{a:"#7C3AED",al:"rgba(124,58,237,.12)", tx:"#fff"},
  rose:  {a:"#BE123C",al:"rgba(190,18,60,.12)",  tx:"#fff"},
};
const CC_RED="#CC0000";

// ── DATA ────────────────────────────────────────────────────────────────────
const SUPPLIERS=[
  {v:"SUP-001",l:"Rajinder Fabrics",city:"Ludhiana"},
  {v:"SUP-002",l:"Punjab Yarn House",city:"Ludhiana"},
  {v:"SUP-003",l:"Tiruppur Knits Co.",city:"Tiruppur"},
  {v:"SUP-004",l:"Coats India Ltd.",city:"Mumbai"},
];
const ITEMS=[
  {v:"RM-FAB-001",l:"SJ 180GSM 100% Cotton",   master:"RM_MASTER_FABRIC",uom:"KG",  hsn:"6006",gst:5, price:240},
  {v:"RM-FAB-002",l:"Piqué 220GSM Cotton",      master:"RM_MASTER_FABRIC",uom:"KG",  hsn:"6006",gst:5, price:310},
  {v:"RM-FAB-003",l:"Fleece 280GSM Cotton",     master:"RM_MASTER_FABRIC",uom:"KG",  hsn:"6006",gst:5, price:420},
  {v:"TRM-THD-001",l:"Thread — Coats Duet 120/2",master:"TRIM_MASTER",  uom:"CONE",hsn:"5204",gst:12,price:45},
  {v:"TRM-ELS-002",l:"Elastic 1\" Flat White",  master:"TRIM_MASTER",  uom:"MTR",  hsn:"5604",gst:12,price:18},
  {v:"TRM-LBL-003",l:"Label — Woven Brand Main",master:"TRIM_MASTER",  uom:"PCS",  hsn:"5807",gst:12,price:4},
  {v:"YRN-001",    l:"Cotton Yarn 30s Combed",  master:"YARN_MASTER",  uom:"KG",   hsn:"5205",gst:5, price:190},
  {v:"PKG-PLY-001",l:"Polybag 12×18 LDPE",     master:"PACKAGING_MASTER",uom:"PCS",hsn:"3923",gst:18,price:2.5},
];

// Line item field spec — exact pattern as master fields
const LF=[
  {col:"LN", h:"Line Code",    type:"autocode",auto:true, req:false,ico:"#"},
  {col:"IC", h:"Item Code",    type:"manual",  auto:false,req:true, ico:"K"},
  {col:"IN", h:"Item Name",    type:"auto",    auto:true, req:false,ico:"A"},
  {col:"MS", h:"Item Master",  type:"auto",    auto:true, req:false,ico:"A"},
  {col:"UM", h:"UOM",          type:"auto",    auto:true, req:false,ico:"A"},
  {col:"HS", h:"HSN Code",     type:"auto",    auto:true, req:false,ico:"A"},
  {col:"GS", h:"GST %",        type:"auto",    auto:true, req:false,ico:"A"},
  {col:"QT", h:"Quantity",     type:"number",  auto:false,req:true, ico:"_"},
  {col:"UP", h:"Unit Price ₹", type:"currency",auto:false,req:true, ico:"_"},
  {col:"DC", h:"Discount %",   type:"number",  auto:false,req:false,ico:"_"},
  {col:"LV", h:"∑ Line Value", type:"calc",    auto:true, req:false,ico:"C"},
  {col:"LG", h:"∑ Line GST",   type:"calc",    auto:true, req:false,ico:"C"},
  {col:"LT", h:"∑ Line Total", type:"calc",    auto:true, req:false,ico:"C"},
  {col:"ST", h:"Status",       type:"dropdown",auto:false,req:false,ico:"_",opts:["Pending","Received","Partial","Cancelled"]},
  {col:"NT", h:"Notes",        type:"textarea",auto:false,req:false,ico:"_"},
];
const ALL_COLS=LF.map(f=>f.col);

const SC={
  Pending:  {bg:"rgba(107,114,128,.13)",tx:"#6b7280",bd:"#6b728040"},
  Received: {bg:"rgba(21,128,61,.13)", tx:"#15803D",bd:"#15803D40"},
  Partial:  {bg:"rgba(245,158,11,.13)",tx:"#b45309",bd:"#b4530940"},
  Cancelled:{bg:"rgba(220,38,38,.13)", tx:"#dc2626",bd:"#dc262640"},
};

const DT_MAP={
  manual:  {bg:"#fff1f2",tx:"#9f1239",bd:"#fecdd3"},autocode:{bg:"#ede9fe",tx:"#6d28d9",bd:"#c4b5fd"},
  calc:    {bg:"#fff7ed",tx:"#c2410c",bd:"#fed7aa"},auto:    {bg:"#f0fdf4",tx:"#166534",bd:"#bbf7d0"},
  fk:      {bg:"#eff6ff",tx:"#1d4ed8",bd:"#bfdbfe"},dropdown:{bg:"#f0f9ff",tx:"#0369a1",bd:"#bae6fd"},
  text:    {bg:"#fafafa",tx:"#374151",bd:"#e5e7eb"},currency:{bg:"#fefce8",tx:"#854d0e",bd:"#fde68a"},
  number:  {bg:"#f0fdf4",tx:"#166534",bd:"#bbf7d0"},textarea:{bg:"#fafafa",tx:"#374151",bd:"#e5e7eb"},
};
function DtBadge({type}){const d=DT_MAP[type]||DT_MAP.text;return<span style={{display:"inline-block",padding:"1px 5px",borderRadius:3,background:d.bg,color:d.tx,border:"1px solid "+d.bd,fontSize:8,fontWeight:800,whiteSpace:"nowrap"}}>{type}</span>;}

const fmt=n=>(parseFloat(n)||0).toLocaleString("en-IN");
const colW=col=>{const f=LF.find(x=>x.col===col);if(!f)return 110;if(f.type==="textarea")return 140;if(["currency","number","calc"].includes(f.type))return 90;if(["manual","autocode"].includes(f.type))return 110;return 120;};

const mkSeeds=()=>[
  {__id:1,__new:false,__dirty:false,LN:"POL-00001",IC:"RM-FAB-001",IN:"SJ 180GSM 100% Cotton",MS:"RM_MASTER_FABRIC",UM:"KG",HS:"6006",GS:"5%",QT:"500",UP:"240",DC:"0",LV:"120000",LG:"6000",LT:"126000",ST:"Pending",NT:""},
  {__id:2,__new:false,__dirty:false,LN:"POL-00002",IC:"RM-FAB-002",IN:"Piqué 220GSM Cotton",MS:"RM_MASTER_FABRIC",UM:"KG",HS:"6006",GS:"5%",QT:"200",UP:"310",DC:"2",LV:"60760",LG:"3038",LT:"63798",ST:"Pending",NT:"Premium grade"},
  {__id:3,__new:false,__dirty:false,LN:"POL-00003",IC:"TRM-THD-001",IN:"Thread — Coats Duet 120/2",MS:"TRIM_MASTER",UM:"CONE",HS:"5204",GS:"12%",QT:"300",UP:"45",DC:"0",LV:"13500",LG:"1620",LT:"15120",ST:"Pending",NT:""},
  {__id:4,__new:false,__dirty:false,LN:"POL-00004",IC:"TRM-ELS-002",IN:"Elastic 1\" Flat White",MS:"TRIM_MASTER",UM:"MTR",HS:"5604",GS:"12%",QT:"1000",UP:"18",DC:"5",LV:"17100",LG:"2052",LT:"19152",ST:"Cancelled",NT:"May substitute"},
  {__id:5,__new:false,__dirty:false,LN:"POL-00005",IC:"YRN-001",IN:"Cotton Yarn 30s Combed",MS:"YARN_MASTER",UM:"KG",HS:"5205",GS:"5%",QT:"150",UP:"190",DC:"0",LV:"28500",LG:"1425",LT:"29925",ST:"Pending",NT:""},
];

const MOCK_PO_LIST=[
  {id:"PO-2025-001",supplierName:"Rajinder Fabrics",supplier:"SUP-001",date:"01-Jan-2025",delivDate:"15-Jan-2025",type:"Fabric",season:"SS25",status:"Acknowledged",grnStatus:"Partial",lines:3,grand:"1,63,800"},
  {id:"PO-2025-002",supplierName:"Punjab Yarn House",supplier:"SUP-002",date:"05-Jan-2025",delivDate:"20-Jan-2025",type:"Yarn",season:"SS25",status:"Fully Received",grnStatus:"Complete",lines:2,grand:"93,870"},
  {id:"PO-2025-003",supplierName:"Coats India Ltd.",supplier:"SUP-004",date:"10-Jan-2025",delivDate:"25-Jan-2025",type:"Trim",season:"SS25",status:"Draft",grnStatus:"Pending",lines:4,grand:"14,112"},
  {id:"PO-2025-004",supplierName:"Rajinder Fabrics",supplier:"SUP-001",date:"14-Jan-2025",delivDate:"28-Jan-2025",type:"Fabric",season:"SS25",status:"Sent",grnStatus:"Pending",lines:2,grand:"2,52,000"},
  {id:"PO-2025-005",supplierName:"Tiruppur Knits Co.",supplier:"SUP-003",date:"18-Jan-2025",delivDate:"05-Feb-2025",type:"Fabric",season:"AW25",status:"Submitted",grnStatus:"Pending",lines:5,grand:"3,99,000"},
];

const ST_CFG={
  Draft:{c:"#6b7280",bg:"rgba(107,114,128,.12)"},Submitted:{c:"#0078D4",bg:"rgba(0,120,212,.12)"},
  Approved:{c:"#7C3AED",bg:"rgba(124,58,237,.12)"},Sent:{c:"#E8690A",bg:"rgba(232,105,10,.12)"},
  Acknowledged:{c:"#059669",bg:"rgba(5,150,105,.12)"},"Fully Received":{c:"#15803D",bg:"rgba(21,128,61,.12)"},
  Cancelled:{c:"#dc2626",bg:"rgba(220,38,38,.12)"},Pending:{c:"#6b7280",bg:"rgba(107,114,128,.12)"},
  Partial:{c:"#f59e0b",bg:"rgba(245,158,11,.12)"},Complete:{c:"#15803D",bg:"rgba(21,128,61,.12)"},
};
function StatusBadge({s}){const c=ST_CFG[s]||{c:"#6b7280",bg:"rgba(107,114,128,.12)"};return<span style={{display:"inline-block",fontSize:9.5,fontWeight:800,padding:"2px 8px",borderRadius:20,color:c.c,background:c.bg,border:`1px solid ${c.c}30`}}>{s}</span>;}

// ── AGG ──────────────────────────────────────────────────────────────────────
const AGG_COLORS={count:"#0078D4",sum:"#15803d",avg:"#E8690A",min:"#0e7490",max:"#7c2d12",none:"transparent"};
const AGG_LABELS={none:"—",count:"Count",sum:"Sum",avg:"Avg",min:"Min",max:"Max"};
const NUM_COLS=["QT","UP","DC","LV","LG","LT"];
function computeAgg(fn,rows,col){
  const vals=rows.map(r=>parseFloat(r[col])||0);
  if(fn==="sum") return vals.reduce((a,b)=>a+b,0);
  if(fn==="avg") return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
  if(fn==="count") return rows.length;
  if(fn==="min") return vals.length?Math.min(...vals):0;
  if(fn==="max") return vals.length?Math.max(...vals):0;
  return null;
}
function fmtAgg(fn,val,col){
  if(val===null)return"—";
  if(fn==="count")return String(val);
  if(["LV","LG","LT"].includes(col))return`₹${fmt(val)}`;
  return val.toLocaleString("en-IN",{maximumFractionDigits:2});
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function Toast({toasts}){return<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>{toasts.map(t=><div key={t.id} style={{padding:"10px 16px",borderRadius:8,background:t.color||"#15803D",color:"#fff",fontSize:11,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.3)",animation:"slideIn .2s ease"}}>{t.msg}</div>)}</div>;}

// ── SORT PANEL (full Masters port) ────────────────────────────────────────────
function SortPanel({sorts,setSorts,onClose,M,A}){
  const[exp,setExp]=useState({});
  const[dragIdx,setDragIdx]=useState(null);
  const[overIdx,setOverIdx]=useState(null);
  const ft=col=>{const f=LF.find(x=>x.col===col);if(!f)return"alpha";if(["currency","number","calc"].includes(f.type))return"numeric";return"alpha";};
  const dirLbl=(type,dir)=>{if(type==="numeric")return dir==="asc"?"1→9":"9→1";return dir==="asc"?"A→Z":"Z→A";};
  const add=col=>{if(!col||sorts.find(s=>s.col===col))return;setSorts(p=>[...p,{col,dir:"asc",type:"auto",nulls:"last"}]);};
  const upd=(i,p)=>setSorts(s=>s.map((x,j)=>j===i?{...x,...p}:x));
  const rem=i=>setSorts(s=>s.filter((_,j)=>j!==i));
  const move=(f,t)=>{setSorts(p=>{const a=[...p];const[it]=a.splice(f,1);a.splice(t,0,it);return a;});};
  const avail=LF.filter(f=>!sorts.find(s=>s.col===f.col));
  const presets=[{l:"Code ↑",s:[{col:"IC",dir:"asc",type:"alpha",nulls:"last"}]},{l:"Total ↑",s:[{col:"LT",dir:"asc",type:"numeric",nulls:"last"}]},{l:"Total ↓",s:[{col:"LT",dir:"desc",type:"numeric",nulls:"last"}]},{l:"✕ Clear",s:[]}];

  return(
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:300,display:"flex",justifyContent:"flex-end",pointerEvents:"none"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.18)",pointerEvents:"all"}}/>
      <div style={{position:"relative",pointerEvents:"all",width:440,maxHeight:"100%",overflowY:"auto",background:M.hi,borderLeft:"2px solid #7C3AED",boxShadow:"-4px 0 24px rgba(0,0,0,.2)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid "+M.div,background:"#7C3AED",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <span style={{fontSize:13}}>↕</span>
          <span style={{fontSize:12,fontWeight:900,color:"#fff"}}>Sort — Line Items</span>
          <span style={{background:"rgba(255,255,255,.25)",color:"#fff",borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:900}}>{sorts.length} rule{sorts.length!==1?"s":""}</span>
          <div style={{flex:1}}/>
          {sorts.length>0&&<button onClick={()=>setSorts([])} style={{padding:"4px 10px",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:5,background:"transparent",color:"#fff",fontSize:9,fontWeight:800,cursor:"pointer"}}>✕ Clear all</button>}
          <button onClick={onClose} style={{padding:"4px 8px",border:"none",borderRadius:5,background:"rgba(255,255,255,.15)",color:"#fff",fontSize:11,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"8px 14px",borderBottom:"1px solid "+M.div,display:"flex",gap:5,flexWrap:"wrap",background:M.mid,flexShrink:0}}>
          <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,alignSelf:"center",marginRight:4}}>QUICK:</span>
          {presets.map((p,pi)=><button key={pi} onClick={()=>setSorts(p.s)} style={{padding:"3px 10px",borderRadius:5,border:"1.5px solid "+(pi===3?"#fecaca":"#c4b5fd"),background:pi===3?"#fef2f2":"#f5f3ff",color:pi===3?"#dc2626":"#7C3AED",fontSize:9,fontWeight:800,cursor:"pointer"}}>{p.l}</button>)}
        </div>
        {sorts.length===0&&<div style={{padding:"32px",textAlign:"center",color:M.tD}}><div style={{fontSize:28,marginBottom:8}}>↕</div><div style={{fontSize:11,fontWeight:700,color:M.tB}}>No sort rules</div><div style={{fontSize:9,marginTop:4}}>Add column below to sort</div></div>}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {sorts.map((s,idx)=>{
            const f=LF.find(x=>x.col===s.col);const rtype=s.type==="auto"?ft(s.col):s.type;
            const isDrag=dragIdx===idx,isOver=overIdx===idx&&dragIdx!==idx;
            return(
              <div key={s.col+idx} draggable onDragStart={e=>{setDragIdx(idx);e.dataTransfer.effectAllowed="move";}} onDragOver={e=>{e.preventDefault();setOverIdx(idx);}} onDrop={e=>{e.preventDefault();move(dragIdx,idx);setDragIdx(null);setOverIdx(null);}} onDragEnd={()=>{setDragIdx(null);setOverIdx(null);}} style={{margin:"2px 10px",borderRadius:8,border:"1.5px solid "+(isOver?"#7C3AED":isDrag?"#c4b5fd":M.div),background:isOver?"#ede9fe":isDrag?"#f5f3ff":M.hi,opacity:isDrag?.5:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px"}}>
                  <span style={{cursor:"grab",fontSize:14,color:M.tD,userSelect:"none"}}>⠿</span>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#7C3AED",color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{idx+1}</div>
                  {idx>0&&<span style={{fontSize:8,fontWeight:700,color:M.tD}}>then by</span>}
                  <select value={s.col} onChange={e=>{if(!e.target.value)return;upd(idx,{col:e.target.value,type:"auto"});}} style={{flex:1,padding:"5px 8px",border:"1.5px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tA,fontSize:10,fontWeight:700,cursor:"pointer",outline:"none"}}>
                    <option value={s.col}>{f?.h||s.col} [{s.col}]</option>
                    {avail.map(af=><option key={af.col} value={af.col}>{af.h} [{af.col}]</option>)}
                  </select>
                  <button onClick={()=>upd(idx,{dir:s.dir==="asc"?"desc":"asc"})} style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid #c4b5fd",background:"#f5f3ff",color:"#6d28d9",fontSize:9,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>{dirLbl(rtype,s.dir)} {s.dir==="asc"?"↑":"↓"}</button>
                  <button onClick={()=>setExp(p=>({...p,[idx]:!p[idx]}))} style={{padding:"4px 6px",borderRadius:5,border:"1px solid "+M.div,background:exp[idx]?"#ede9fe":M.inBg,color:exp[idx]?"#7C3AED":M.tD,fontSize:10,cursor:"pointer"}}>{exp[idx]?"▲":"▼"}</button>
                  <button onClick={()=>rem(idx)} style={{width:22,height:22,borderRadius:4,border:"1px solid #fecaca",background:"#fef2f2",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
                {exp[idx]&&<div style={{borderTop:"1px dashed "+M.div,padding:"8px 10px 10px 42px",background:M.mid,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6}}>Sort type</span>
                    <select value={s.type} onChange={e=>upd(idx,{type:e.target.value})} style={{padding:"4px 7px",border:"1px solid #c4b5fd",borderRadius:5,background:"#f5f3ff",color:"#6d28d9",fontSize:9,cursor:"pointer",outline:"none"}}>
                      {["auto","alpha","numeric","date","length"].map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6}}>Empty values</span>
                    <div style={{display:"flex",borderRadius:5,overflow:"hidden",border:"1px solid #c4b5fd"}}>
                      {["last","first"].map(v=><button key={v} onClick={()=>upd(idx,{nulls:v})} style={{padding:"4px 10px",border:"none",background:s.nulls===v?"#7C3AED":"#f5f3ff",color:s.nulls===v?"#fff":"#6d28d9",fontSize:9,cursor:"pointer"}}>{v==="last"?"Nulls last":"Nulls first"}</button>)}
                    </div>
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
        <div style={{padding:"10px 14px",borderTop:"1px solid "+M.div,flexShrink:0,background:M.mid}}>
          <select value="" onChange={e=>{add(e.target.value);e.target.value="";}} style={{width:"100%",padding:"8px 12px",border:"2px dashed #c4b5fd",borderRadius:7,background:"#f5f3ff",color:"#7C3AED",fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
            <option value="">+ Pick column to sort by…</option>
            {avail.map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
          </select>
        </div>
        {sorts.length>0&&<div style={{padding:"6px 14px",borderTop:"1px solid "+M.div,background:M.lo,flexShrink:0,fontSize:9,color:M.tC}}>
          Sorted by: {sorts.map((s,i)=><span key={i} style={{background:"#f5f3ff",color:"#7C3AED",borderRadius:3,padding:"1px 6px",marginLeft:4,fontWeight:800}}>{LF.find(f=>f.col===s.col)?.h||s.col} {s.dir==="asc"?"↑":"↓"}</span>)}
        </div>}
      </div>
    </div>
  );
}

// ── VIEWS BAR (Records-style — exactly from Masters) ──────────────────────────
function ViewsBar({templates,activeViewName,viewDirty,onLoad,onSave,onUpdate,onDelete,visCols,M,A}){
  const[showSave,setShowSave]=useState(false);
  const[tplName,setTplName]=useState("");
  const[renaming,setRenaming]=useState(null);
  const save=()=>{if(!tplName.trim()||tplName.toLowerCase()==="default")return;onSave(tplName.trim());setTplName("");setShowSave(false);};
  return(
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,overflowX:"auto",minHeight:34,flexWrap:"nowrap"}}>
      <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",marginRight:4,whiteSpace:"nowrap"}}>VIEWS:</span>
      {/* Default LOCKED */}
      {(()=>{const isA=activeViewName==="Default",isM=isA&&viewDirty;return(
        <div style={{display:"flex",alignItems:"center",background:isA?(isM?"#fff7ed":"#CC000015"):"#f5f5f5",border:"1.5px solid "+(isA?(isM?"#f59e0b":"#CC0000"):"#d1d5db"),borderRadius:5,overflow:"hidden"}}>
          <button onClick={()=>onLoad("Default")} style={{padding:"4px 10px",border:"none",background:"transparent",color:isA?(isM?"#92400e":"#CC0000"):"#374151",fontSize:9,fontWeight:isA?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            {isA&&<span style={{width:6,height:6,borderRadius:"50%",background:isM?"#f59e0b":"#CC0000",display:"inline-block"}}/>}
            🏠 Default
            {isM&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}
          </button>
          <div style={{padding:"2px 6px",fontSize:7,fontWeight:900,color:"#9ca3af",letterSpacing:.5,background:"#ececec",borderLeft:"1px solid #d1d5db",height:"100%",display:"flex",alignItems:"center"}}>LOCKED</div>
        </div>
      );})()}
      {/* User saved views */}
      {templates.map(t=>{
        const isA=activeViewName===t.name,isM=isA&&viewDirty;
        return(
          <div key={t.name} style={{display:"flex",alignItems:"center",background:isA?(isM?"#fffbeb":"#ede9fe"):"#f5f3ff",border:"1.5px solid "+(isA?(isM?"#f59e0b":"#7C3AED"):"#c4b5fd"),borderRadius:5,overflow:"hidden"}}>
            {renaming===t.name?(
              <input autoFocus defaultValue={t.name} onKeyDown={e=>{if(e.key==="Enter"){const v=e.target.value.trim();if(v&&v.toLowerCase()!=="default")onSave(v,t.name);setRenaming(null);}if(e.key==="Escape")setRenaming(null);}} onBlur={e=>{const v=e.target.value.trim();if(v&&v.toLowerCase()!=="default")onSave(v,t.name);setRenaming(null);}} style={{padding:"3px 8px",border:"none",background:"#fff",color:"#6d28d9",fontSize:10,fontWeight:800,outline:"2px solid #7C3AED",width:120}}/>
            ):(
              <button onClick={()=>onLoad(t.name)} style={{padding:"4px 9px",border:"none",background:"transparent",color:isA?(isM?"#92400e":"#6d28d9"):"#7c3aed",fontSize:9,fontWeight:isA?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                {isA&&<span style={{width:6,height:6,borderRadius:"50%",background:isM?"#f59e0b":"#7C3AED",display:"inline-block"}}/>}
                📂 {t.name}
                {isM&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}
              </button>
            )}
            {isA&&isM&&<><div style={{width:1,height:16,background:"#fcd34d"}}/><button onClick={onUpdate} style={{padding:"4px 9px",border:"none",background:"#f59e0b",color:"#fff",fontSize:9,cursor:"pointer",fontWeight:900,whiteSpace:"nowrap"}}>💾 Update View</button></>}
            <div style={{width:1,height:16,background:"#c4b5fd"}}/>
            <button onClick={()=>setRenaming(t.name)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#f59e0b",fontSize:10,cursor:"pointer",fontWeight:900}}>✎</button>
            <div style={{width:1,height:16,background:"#c4b5fd"}}/>
            <button onClick={()=>onDelete(t.name)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#dc2626",fontSize:10,cursor:"pointer",fontWeight:900}}>×</button>
          </div>
        );
      })}
      <button onClick={()=>setShowSave(p=>!p)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid #c4b5fd",background:showSave?"#7C3AED":"#fdf4ff",color:showSave?"#fff":"#7C3AED",fontSize:9,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>+ Save View</button>
      {showSave&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 8px",background:M.hi,border:"1.5px solid #c4b5fd",borderRadius:5}}>
        <input autoFocus value={tplName} onChange={e=>setTplName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")save();if(e.key==="Escape"){setShowSave(false);setTplName("");};}} placeholder="View name…" style={{border:"1px solid "+M.inBd,borderRadius:3,padding:"3px 7px",fontSize:9,background:M.inBg,color:M.tA,outline:"none",width:120}}/>
        <button onClick={save} style={{padding:"3px 9px",border:"none",borderRadius:3,background:"#7C3AED",color:"#fff",fontSize:9,fontWeight:900,cursor:"pointer"}}>Save</button>
        <button onClick={()=>{setShowSave(false);setTplName("");}} style={{padding:"3px 6px",border:"none",borderRadius:3,background:M.lo,color:M.tB,fontSize:9,cursor:"pointer"}}>✕</button>
      </div>}
      <div style={{marginLeft:"auto",fontSize:9,color:M.tD,whiteSpace:"nowrap",fontWeight:700}}>{visCols.length}/{ALL_COLS.length} cols · {activeViewName}</div>
    </div>
  );
}

// ── AGG FOOTER (tfoot) ────────────────────────────────────────────────────────
function AggFooter({visRows,visCols,aggState,openCol,onCellClick,hasCheckbox,M,A}){
  return(
    <tfoot>
      <tr style={{background:M.thd,borderTop:"2px solid #7C3AED20"}}>
        {hasCheckbox&&<td style={{padding:"4px 8px",width:32}}/>}
        <td style={{padding:"4px 8px",fontSize:8,fontWeight:900,color:"#7C3AED",width:30,textAlign:"center"}}>Σ</td>
        {visCols.map(col=>{
          const fn=aggState[col]||"none";
          const isNum=NUM_COLS.includes(col);
          const val=fn!=="none"?computeAgg(fn,visRows,col):null;
          const color=AGG_COLORS[fn]||M.tD;
          return(
            <td key={col} style={{padding:"4px 8px",borderLeft:"1px solid "+M.div+"60",textAlign:isNum?"right":"left"}} onClick={e=>isNum&&onCellClick(col,e.currentTarget)}>
              {fn!=="none"&&val!==null?<span style={{fontSize:9,fontWeight:900,color,background:color+"15",borderRadius:3,padding:"1px 6px",cursor:"pointer"}}>{fmtAgg(fn,val,col)}</span>:isNum?<span style={{fontSize:8,color:M.tD,cursor:"pointer",opacity:.5}}>∑</span>:<span/>}
            </td>
          );
        })}
        <td/>
      </tr>
    </tfoot>
  );
}

function AggDropdown({openInfo,aggState,setAggState,visRows,onClose,M,A}){
  const col=openInfo.col;const cur=aggState[col]||"none";
  const opts=["none","count","sum","avg","min","max"];
  return(
    <div onMouseDown={e=>e.stopPropagation()} style={{position:"fixed",top:openInfo.top,left:openInfo.left,zIndex:9999,background:M.sh,border:"1.5px solid #7C3AED",borderRadius:8,boxShadow:"0 8px 32px rgba(0,0,0,.3)",width:200,overflow:"hidden"}}>
      <div style={{padding:"8px 12px",background:"#1e293b",color:"#fff",fontSize:9,fontWeight:900,letterSpacing:.5}}>{col} — {LF.find(f=>f.col===col)?.h}</div>
      {opts.map(fn=>{const isA=cur===fn;const c=AGG_COLORS[fn]||M.tD;const v=fn!=="none"?computeAgg(fn,visRows,col):null;return(
        <div key={fn} onClick={()=>{setAggState(p=>({...p,[col]:fn}));onClose();}} style={{display:"flex",alignItems:"center",padding:"7px 12px",cursor:"pointer",background:isA?c+"12":"transparent",borderLeft:isA?"3px solid "+c:"3px solid transparent"}}
          onMouseEnter={e=>e.currentTarget.style.background=isA?c+"20":M.hov} onMouseLeave={e=>e.currentTarget.style.background=isA?c+"12":"transparent"}>
          <span style={{flex:1,fontSize:10,fontWeight:isA?900:600,color:isA?c:M.tB}}>{AGG_LABELS[fn]}</span>
          {isA&&v!==null&&<span style={{fontSize:9,color:c,fontWeight:900,background:c+"20",borderRadius:3,padding:"1px 6px"}}>{fmtAgg(fn,v,col)}</span>}
        </div>
      );})}
    </div>
  );
}

// ── LINE ITEM RECALC ─────────────────────────────────────────────────────────
function recalcLine(l){
  const qty=parseFloat(l.QT)||0,price=parseFloat(l.UP)||0,disc=parseFloat(l.DC)||0;
  const gstPct=parseFloat(String(l.GS).replace("%",""))||0;
  const lv=qty*price*(1-disc/100);const lg=lv*gstPct/100;
  return{...l,LV:lv.toFixed(0),LG:lg.toFixed(0),LT:(lv+lg).toFixed(0)};
}

// ── SHARED LINES STATE HOOK ───────────────────────────────────────────────────
function useLinesState(){
  const[rows,setRows]=useState(mkSeeds());
  const nextId=useRef(10);

  // View state — persisted across tab switches
  const[colOrder,setColOrder]=useState(ALL_COLS);
  const[hiddenC,setHiddenC]=useState(["LN","MS"]);
  const[sorts,setSorts]=useState([]);
  const[filters,setFilters]=useState({});
  const[groupBy,setGroupBy]=useState(null);
  const[subGroupBy,setSubGroupBy]=useState(null);
  const[activeViewName,setActiveViewName]=useState("Default");
  const[templates,setTemplates]=useState([]);
  const[aggState,setAggState]=useState({LV:"sum",LG:"sum",LT:"sum"});

  const visCols=useMemo(()=>colOrder.filter(c=>!hiddenC.includes(c)),[colOrder,hiddenC]);

  const sortedRows=useMemo(()=>{
    if(!sorts.length)return[...rows];
    return[...rows].sort((a,b)=>{
      for(const s of sorts){
        const av=a[s.col]||"",bv=b[s.col]||"";
        const f=LF.find(x=>x.col===s.col);
        const isNum=["currency","number","calc"].includes(f?.type||"");
        let cmp=isNum?(parseFloat(av)||0)-(parseFloat(bv)||0):String(av).localeCompare(String(bv));
        if(cmp!==0)return s.dir==="asc"?cmp:-cmp;
      }return 0;
    });
  },[rows,sorts]);

  const visRows=useMemo(()=>sortedRows.filter(r=>{
    for(const[col,val] of Object.entries(filters)){if(val&&!String(r[col]||"").toLowerCase().includes(val.toLowerCase()))return false;}
    return true;
  }),[sortedRows,filters]);

  const grouped=useMemo(()=>{
    if(!groupBy)return[{key:null,sub:[{subKey:null,rows:visRows}]}];
    const gm={};visRows.forEach(r=>{const k=r[groupBy]||"(empty)";if(!gm[k])gm[k]=[];gm[k].push(r);});
    return Object.entries(gm).map(([key,grows])=>{
      if(!subGroupBy)return{key,sub:[{subKey:null,rows:grows}]};
      const sm={};grows.forEach(r=>{const sk=r[subGroupBy]||"(empty)";if(!sm[sk])sm[sk]=[];sm[sk].push(r);});
      return{key,sub:Object.entries(sm).map(([subKey,rows])=>({subKey,rows}))};
    });
  },[visRows,groupBy,subGroupBy]);

  const DEFAULT_STATE={colOrder:ALL_COLS,hiddenC:[],sorts:[],filters:{},groupBy:null,subGroupBy:null};
  const getViewDirty=()=>{
    if(activeViewName==="Default")return!(JSON.stringify(colOrder)===JSON.stringify(ALL_COLS)&&!hiddenC.length&&!sorts.length&&!Object.values(filters).some(v=>v)&&!groupBy&&!subGroupBy);
    const saved=templates.find(t=>t.name===activeViewName);
    if(!saved)return false;
    return JSON.stringify({colOrder,hiddenC,sorts,filters,groupBy,subGroupBy})!==JSON.stringify({colOrder:saved.colOrder,hiddenC:saved.hiddenC,sorts:saved.sorts,filters:saved.filters,groupBy:saved.groupBy,subGroupBy:saved.subGroupBy});
  };
  const viewDirty=getViewDirty();

  const loadView=name=>{
    if(name==="Default"){setColOrder(ALL_COLS);setHiddenC([]);setSorts([]);setFilters({});setGroupBy(null);setSubGroupBy(null);setActiveViewName("Default");return;}
    const t=templates.find(x=>x.name===name);if(!t)return;
    setColOrder(t.colOrder);setHiddenC(t.hiddenC);setSorts(t.sorts);setFilters(t.filters);setGroupBy(t.groupBy||null);setSubGroupBy(t.subGroupBy||null);setActiveViewName(name);
  };
  const saveView=(name,oldName)=>{
    const tpl={name,colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy};
    if(oldName){setTemplates(p=>p.map(t=>t.name===oldName?tpl:t));}
    else{setTemplates(p=>p.some(t=>t.name===name)?p.map(t=>t.name===name?tpl:t):[...p,tpl]);}
    setActiveViewName(name);
  };
  const updateView=()=>{if(activeViewName==="Default")return;saveView(activeViewName,activeViewName);};
  const deleteView=name=>{setTemplates(p=>p.filter(t=>t.name!==name));if(activeViewName===name)setActiveViewName("Default");};

  const addRow=()=>{const id=++nextId.current;setRows(p=>[...p,{__id:id,__new:true,__dirty:false,LN:`POL-${String(p.length+1).padStart(5,"0")}`,IC:"",IN:"",MS:"",UM:"",HS:"",GS:"",QT:"",UP:"",DC:"",LV:"",LG:"",LT:"",ST:"Pending",NT:""}]);};
  const delRow=id=>setRows(p=>p.filter(r=>r.__id!==id));
  const updCell=(id,col,val)=>setRows(p=>p.map(r=>{if(r.__id!==id)return r;const u={...r,[col]:val,__dirty:true};return["QT","UP","DC"].includes(col)?recalcLine(u):u;}));
  const selectItem=(id,item)=>setRows(p=>p.map(r=>{if(r.__id!==id)return r;return recalcLine({...r,IC:item.v,IN:item.l,MS:item.master,UM:item.uom,HS:item.hsn,GS:item.gst+"%",UP:String(item.price),__dirty:true});}));

  const baseTotal=rows.reduce((s,r)=>s+(parseFloat(r.LV)||0),0);
  const gstTotal=rows.reduce((s,r)=>s+(parseFloat(r.LG)||0),0);
  const grandTotal=baseTotal+gstTotal;

  return{rows,visRows,grouped,visCols,colOrder,setColOrder,hiddenC,setHiddenC,sorts,setSorts,filters,setFilters,groupBy,setGroupBy,subGroupBy,setSubGroupBy,templates,activeViewName,viewDirty,loadView,saveView,updateView,deleteView,aggState,setAggState,addRow,delRow,updCell,selectItem,baseTotal,gstTotal,grandTotal,activeFilters:Object.values(filters).filter(v=>v).length};
}

// ── TOOLBAR (shared between Entry + Bulk tabs) ─────────────────────────────
function LinesToolbar({ls,M,A,fz,showSort,setShowSort,showFP,setShowFP,showCM,setShowCM,showSearch,search,setSearch}){
  return(
    <div style={{padding:"6px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
      {showSearch!==false&&(
        <div style={{position:"relative",display:"flex",alignItems:"center"}}>
          <span style={{position:"absolute",left:8,fontSize:11,color:M.tD}}>🔍</span>
          <input value={search||""} onChange={e=>setSearch&&setSearch(e.target.value)} placeholder="Search line items…" style={{border:"1.5px solid "+(search?A.a:M.inBd),borderRadius:5,background:M.inBg,color:M.tA,fontSize:fz-1,padding:"5px 10px 5px 26px",outline:"none",width:200}}/>
          {search&&<button onClick={()=>setSearch&&setSearch("")} style={{position:"absolute",right:6,border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:12,padding:0}}>×</button>}
        </div>
      )}
      <span style={{fontSize:9,color:M.tC,fontWeight:700}}>{ls.visRows.length} of {ls.rows.length} items</span>
      <div style={{width:1,height:22,background:M.div}}/>
      <button onClick={()=>{setShowFP(p=>!p);setShowSort(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showFP||ls.activeFilters>0?A.a:M.inBd),background:showFP||ls.activeFilters>0?A.al:M.inBg,color:showFP||ls.activeFilters>0?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
        🔽 Filter {ls.activeFilters>0&&<span style={{background:A.a,color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{ls.activeFilters}</span>}
      </button>
      <button onClick={()=>{setShowSort(true);setShowFP(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(ls.sorts.length>0?"#7C3AED":M.inBd),background:ls.sorts.length>0?"#ede9fe":M.inBg,color:ls.sorts.length>0?"#6d28d9":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
        ↕ Sort {ls.sorts.length>0&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{ls.sorts.length}</span>}
      </button>
      <select value={ls.groupBy||""} onChange={e=>{ls.setGroupBy(e.target.value||null);if(!e.target.value)ls.setSubGroupBy(null);}} style={{padding:"5px 9px",borderRadius:5,border:"1.5px solid "+(ls.groupBy?"#059669":M.inBd),background:ls.groupBy?"rgba(5,150,105,.1)":M.inBg,color:ls.groupBy?"#059669":M.tB,fontSize:10,fontWeight:ls.groupBy?900:600,cursor:"pointer",outline:"none"}}>
        <option value="">⊞ Group by…</option>
        {LF.filter(f=>!f.auto&&f.type!=="textarea").map(f=><option key={f.col} value={f.col}>{f.h}</option>)}
      </select>
      <button onClick={()=>{setShowCM(p=>!p);setShowFP(false);setShowSort(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showCM?A.a:M.inBd),background:showCM?A.al:M.inBg,color:showCM?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer"}}>⊟ Columns</button>
      <div style={{flex:1}}/>
      <button onClick={ls.addRow} style={{padding:"5px 14px",borderRadius:6,border:"none",background:A.a,color:A.tx,fontSize:10,fontWeight:800,cursor:"pointer"}}>+ Add Item</button>
    </div>
  );
}

function FilterPanel({ls,M,A}){
  return(
    <div style={{padding:"8px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:9,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginRight:4}}>FILTER BY:</span>
      {ls.visCols.map(col=>{
        const f=LF.find(x=>x.col===col);
        if(!f||f.auto||["calc","autocode"].includes(f.type))return null;
        return(
          <div key={col} style={{display:"flex",alignItems:"center",gap:4,background:M.lo,border:"1px solid "+(ls.filters[col]?A.a:M.inBd),borderRadius:5,padding:"3px 6px"}}>
            <span style={{fontSize:8,fontWeight:900,color:M.tD,fontFamily:"monospace"}}>{col}</span>
            <input value={ls.filters[col]||""} onChange={e=>ls.setFilters(p=>({...p,[col]:e.target.value}))} placeholder={f.h} style={{border:"none",background:"transparent",color:M.tA,fontSize:9,outline:"none",width:80}}/>
            {ls.filters[col]&&<button onClick={()=>ls.setFilters(p=>{const n={...p};delete n[col];return n;})} style={{border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:10,padding:0}}>×</button>}
          </div>
        );
      })}
      <button onClick={()=>ls.setFilters({})} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>
    </div>
  );
}

function ColManager({ls,M,A}){
  return(
    <div style={{padding:"8px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:9,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginRight:4}}>COLUMNS:</span>
      {ls.colOrder.map(col=>{
        const hidden=ls.hiddenC.includes(col);const f=LF.find(x=>x.col===col);
        return<button key={col} onClick={()=>ls.setHiddenC(p=>hidden?p.filter(c=>c!==col):[...p,col])} style={{padding:"3px 8px",borderRadius:4,border:"1.5px solid "+(hidden?M.div:A.a),background:hidden?M.lo:A.al,color:hidden?M.tD:A.a,fontSize:9,fontWeight:hidden?700:900,cursor:"pointer",textDecoration:hidden?"line-through":"none"}}>{col} <span style={{fontSize:8,opacity:.7}}>{f?.h}</span></button>;
      })}
      <button onClick={()=>ls.setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:4}}>Show All</button>
    </div>
  );
}

// ── STATUS BAR (same as Masters) ─────────────────────────────────────────────
function StatusBar({ls,M,A}){
  return(
    <div style={{padding:"3px 12px",borderTop:"1px solid "+M.div,background:M.mid,display:"flex",gap:14,fontSize:8.5,color:M.tD,flexShrink:0}}>
      <span>{ls.rows.length} total · {ls.visRows.length} visible · {ls.visCols.length} cols shown</span>
      {ls.groupBy&&<span>grouped by <strong style={{color:M.tB}}>{LF.find(f=>f.col===ls.groupBy)?.h}</strong>{ls.subGroupBy&&<> → <strong style={{color:M.tB}}>{LF.find(f=>f.col===ls.subGroupBy)?.h}</strong></>}</span>}
      {ls.sorts.length>0&&<span>sorted by {ls.sorts.map(s=>`${LF.find(f=>f.col===s.col)?.h||s.col} ${s.dir==="asc"?"↑":"↓"}`).join(", ")}</span>}
      <span style={{marginLeft:"auto"}}>← drag headers to reorder · click header to sort · click Σ to aggregate</span>
    </div>
  );
}

// ── ENTRY TAB — individual form + line items table ────────────────────────────
function EntryTab({ls,poData,setPOData,M,A,fz,pyV,showToast}){
  const[showSort,setShowSort]=useState(false);
  const[showFP,setShowFP]=useState(false);
  const[showCM,setShowCM]=useState(false);
  const[aggOpenInfo,setAggOpenInfo]=useState(null);
  const[dragCol,setDragCol]=useState(null);
  const[dropCol,setDropCol]=useState(null);
  const[itemSearchId,setItemSearchId]=useState(null);
  const[itemQ,setItemQ]=useState("");

  const aggCellClick=(col,el)=>{if(aggOpenInfo?.col===col){setAggOpenInfo(null);return;}const r=el.getBoundingClientRect();setAggOpenInfo({col,top:Math.max(8,r.top-300),left:Math.min(r.left,window.innerWidth-210)});};

  const filteredItems=ITEMS.filter(i=>!itemQ||i.v.toLowerCase().includes(itemQ.toLowerCase())||i.l.toLowerCase().includes(itemQ.toLowerCase()));

  const PO_FIELDS=[
    {k:"poCode",l:"PO Code",type:"autocode"},{k:"date",l:"PO Date ⚠",type:"date",req:true},
    {k:"supplier",l:"Supplier (FK) ⚠",type:"fk",req:true},{k:"supName",l:"Supplier Name",type:"auto"},
    {k:"poType",l:"PO Type ⚠",type:"select",req:true,opts:["Fabric","Yarn","Trim","Consumable","Packaging"]},
    {k:"season",l:"Season",type:"select",opts:["SS25","AW25","SS26","AW26"]},
    {k:"delivDate",l:"Delivery Date",type:"date"},{k:"payTerms",l:"Payment Terms",type:"select",opts:["Advance","7 Days","15 Days","30 Days","45 Days","60 Days"]},
    {k:"currency",l:"Currency",type:"select",opts:["INR","USD","EUR"]},
    {k:"delivLoc",l:"Delivery Location",type:"text"},{k:"physLink",l:"Physical PO Link",type:"text"},
    {k:"notes",l:"Notes",type:"textarea"},
  ];

  const inp={width:"100%",border:`1px solid ${M.inBd}`,borderRadius:4,padding:"5px 9px",background:M.inBg,color:M.tA,fontSize:10,fontFamily:"inherit",outline:"none"};

  return(
    <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>
      {/* Sidebar */}
      <div style={{width:300,flexShrink:0,display:"flex",flexDirection:"column",background:M.sh,borderRight:`1.5px solid ${M.div}`,overflow:"hidden"}}>
        <div style={{padding:"9px 14px",borderBottom:`1px solid ${M.div}`,background:M.thd,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:9,fontWeight:900,color:M.tD,letterSpacing:.6,textTransform:"uppercase"}}>📄 PO Header — 12 Fields</span>
          <span style={{marginLeft:"auto",fontSize:8,color:M.tD}}>⚠ = mandatory · ← = auto</span>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
          {PO_FIELDS.map(f=>(
            <div key={f.k} style={f.type==="textarea"?{}:{}}>
              <label style={{display:"block",fontSize:8,fontWeight:800,color:f.type==="auto"?"#059669":f.req?A.a:M.tC,marginBottom:3,letterSpacing:.3}}>
                {f.type==="auto"&&<span style={{fontSize:7,opacity:.6,marginRight:2}}>←</span>}
                {f.l.toUpperCase()}
              </label>
              {f.type==="autocode"&&<div style={{...inp,display:"flex",alignItems:"center",gap:5,color:A.a,fontWeight:900,fontFamily:"monospace",fontSize:10,background:A.al,border:`1px solid ${A.a}40`}}># AUTO-GENERATE<span style={{marginLeft:"auto",fontSize:8,color:M.tD}}>🔒</span></div>}
              {f.type==="auto"&&<div style={{...inp,background:M.mid,color:A.a,fontStyle:"italic",border:`1px solid ${M.div}`}}>{poData[f.k]||"← GAS auto-fills"}</div>}
              {f.type==="fk"&&<select value={poData[f.k]||""} onChange={e=>{const s=SUPPLIERS.find(x=>x.v===e.target.value);setPOData(p=>({...p,[f.k]:e.target.value,supName:s?.l||""}));}} style={inp}><option value="">— Select —</option>{SUPPLIERS.map(s=><option key={s.v} value={s.v}>{s.v} — {s.l}</option>)}</select>}
              {f.type==="select"&&<select value={poData[f.k]||""} onChange={e=>setPOData(p=>({...p,[f.k]:e.target.value}))} style={inp}><option value="">—</option>{f.opts.map(o=><option key={o}>{o}</option>)}</select>}
              {f.type==="date"&&<input type="date" value={poData[f.k]||""} onChange={e=>setPOData(p=>({...p,[f.k]:e.target.value}))} style={inp}/>}
              {f.type==="text"&&<input value={poData[f.k]||""} onChange={e=>setPOData(p=>({...p,[f.k]:e.target.value}))} style={inp}/>}
              {f.type==="textarea"&&<textarea value={poData[f.k]||""} onChange={e=>setPOData(p=>({...p,[f.k]:e.target.value}))} rows={2} style={{...inp,resize:"vertical"}}/>}
            </div>
          ))}
        </div>
        {/* Totals */}
        <div style={{padding:"12px 14px",borderTop:`1px solid ${M.div}`,background:M.thd,flexShrink:0}}>
          {[{l:"∑ Base Amount",v:`₹${fmt(ls.baseTotal)}`,c:M.tB},{l:"∑ Total GST",v:`₹${fmt(ls.gstTotal)}`,c:"#f59e0b"},{l:"∑ Grand Total",v:`₹${fmt(ls.grandTotal)}`,c:A.a,big:true}].map(t=>(
            <div key={t.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${M.div}40`}}>
              <span style={{fontSize:t.big?9.5:8.5,color:M.tD,fontWeight:t.big?900:700}}>{t.l}</span>
              <span style={{fontSize:t.big?14:11,fontWeight:900,color:t.c,fontFamily:"monospace"}}>{t.v}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={()=>showToast("✓ Draft saved","#6b7280")} style={{flex:1,padding:"7px",borderRadius:7,border:`1.5px solid ${M.inBd}`,background:M.lo,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>💾 Draft</button>
            <button onClick={()=>showToast("✓ Submitted for approval","#0078D4")} style={{flex:2,padding:"7px",borderRadius:7,border:"none",background:A.a,color:A.tx,fontSize:10,fontWeight:900,cursor:"pointer"}}>✓ Submit</button>
          </div>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <button style={{flex:1,padding:"6px",borderRadius:6,border:`1px solid ${M.inBd}`,background:M.lo,color:M.tC,fontSize:9.5,cursor:"pointer"}}>📄 PDF Preview</button>
            <button style={{flex:1,padding:"6px",borderRadius:6,border:`1px solid ${M.inBd}`,background:M.lo,color:M.tC,fontSize:9.5,cursor:"pointer"}}>📤 Export ▾</button>
          </div>
        </div>
      </div>

      {/* Main — Line Items */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
        {/* Line items header */}
        <div style={{padding:"8px 14px",borderBottom:`1px solid ${M.div}`,background:M.thd,display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <span style={{fontSize:10,fontWeight:900,color:M.tA}}>📦 Line Items</span>
          <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:A.al,color:A.a,fontWeight:800,border:`1px solid ${A.a}30`}}>{ls.rows.filter(r=>r.IC).length} items</span>
          <span style={{fontSize:9,color:M.tD}}>poly-FK → routes to correct item master automatically</span>
        </div>

        <LinesToolbar ls={ls} M={M} A={A} fz={fz} showSort={showSort} setShowSort={setShowSort} showFP={showFP} setShowFP={setShowFP} showCM={showCM} setShowCM={setShowCM}/>
        {showFP&&<FilterPanel ls={ls} M={M} A={A}/>}
        {showCM&&<ColManager ls={ls} M={M} A={A}/>}
        {showSort&&<SortPanel sorts={ls.sorts} setSorts={ls.setSorts} onClose={()=>setShowSort(false)} M={M} A={A}/>}

        {/* Table */}
        <div style={{flex:1,overflow:"auto",position:"relative"}} onClick={()=>{setItemSearchId(null);setItemQ("");}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:fz-1}}>
            <thead style={{position:"sticky",top:0,zIndex:10}}>
              <tr style={{background:M.thd}}>
                <th style={{padding:pyV+"px 8px",fontSize:8.5,fontWeight:900,color:M.tD,borderBottom:"2px solid "+CC_RED,width:28,textAlign:"center"}}>#</th>
                {ls.visCols.map(col=>{
                  const f=LF.find(x=>x.col===col);const ss=ls.sorts.find(s=>s.col===col);
                  const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");
                  const isNum=NUM_COLS.includes(col);
                  const isDrop=dropCol===col&&dragCol!==col;
                  return(
                    <th key={col} draggable
                      onDragStart={()=>setDragCol(col)} onDragOver={e=>{e.preventDefault();setDropCol(col);}}
                      onDrop={()=>{ls.setColOrder(p=>{const a=[...p],fi=a.indexOf(dragCol),ti=a.indexOf(dropCol);a.splice(fi,1);a.splice(ti,0,dragCol);return a;});setDragCol(null);setDropCol(null);}}
                      onDragEnd={()=>{setDragCol(null);setDropCol(null);}}
                      onClick={()=>ls.setSorts(p=>{const ex=p.find(s=>s.col===col);if(!ex)return[{col,dir:"asc",type:"auto",nulls:"last"},...p];if(ex.dir==="asc")return p.map(s=>s.col===col?{...s,dir:"desc"}:s);return p.filter(s=>s.col!==col);})}
                      style={{padding:pyV+"px 8px",fontSize:9,fontWeight:900,color:ss?"#7C3AED":isAuto?"#059669":M.tD,borderBottom:"2px solid "+CC_RED,borderLeft:isDrop?"3px solid #f59e0b":"3px solid transparent",textAlign:isNum?"right":"left",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none",background:ss?"#f5f3ff40":M.thd,minWidth:colW(col)}}>
                      {isAuto&&<span style={{color:"#059669",fontSize:8,marginRight:2}}>←</span>}
                      <span style={{fontFamily:"monospace",fontSize:8,opacity:.7,marginRight:3}}>{col}</span>
                      <span style={{fontWeight:400,opacity:.8}}>{f?.h}</span>
                      {ss&&<span style={{marginLeft:4,fontSize:10}}>{ss.dir==="asc"?"↑":"↓"}</span>}
                    </th>
                  );
                })}
                <th style={{padding:pyV+"px 8px",borderBottom:"2px solid "+CC_RED,width:36}}/>
              </tr>
            </thead>
            <tbody>
              {ls.grouped.map((group,gi)=>(
                <React.Fragment key={gi}>
                  {group.key!==null&&<tr><td colSpan={ls.visCols.length+2} style={{padding:"6px 12px",background:"#1e293b",borderBottom:"2px solid "+M.div,fontSize:10,fontWeight:900,color:"#f1f5f9"}}><span style={{background:A.a,color:"#fff",borderRadius:3,padding:"2px 8px",fontSize:9,fontWeight:900,marginRight:8,fontFamily:"monospace"}}>{group.sub.reduce((n,sg)=>n+sg.rows.length,0)}</span><span style={{opacity:.6,marginRight:4}}>{LF.find(f=>f.col===ls.groupBy)?.h}:</span><strong>{group.key}</strong></td></tr>}
                  {group.sub.map((sg,sgi)=>(
                    <React.Fragment key={sgi}>
                      {sg.subKey!==null&&<tr><td colSpan={ls.visCols.length+2} style={{padding:"4px 12px 4px 28px",background:"#334155",borderBottom:"1px solid "+M.div,fontSize:9,fontWeight:800,color:"#cbd5e1"}}><span style={{background:"#7C3AED",color:"#fff",borderRadius:3,padding:"1px 6px",fontSize:8,fontWeight:900,marginRight:7}}>{sg.rows.length}</span><span style={{opacity:.6,marginRight:4}}>↳ {LF.find(f=>f.col===ls.subGroupBy)?.h}:</span><strong>{sg.subKey}</strong></td></tr>}
                      {sg.rows.map((row,ri)=>{
                        const st=SC[row.ST]||SC.Pending;
                        return(
                          <tr key={row.__id} style={{background:row.__new?"rgba(0,120,212,.04)":row.__dirty?"rgba(245,158,11,.04)":ri%2===0?M.tev:M.tod,borderBottom:"1px solid "+M.div,borderLeft:row.__new?"3px solid #0078D4":row.__dirty?"3px solid #f59e0b":"3px solid transparent"}}
                            onMouseEnter={e=>e.currentTarget.style.background=M.hov} onMouseLeave={e=>e.currentTarget.style.background=row.__new?"rgba(0,120,212,.04)":row.__dirty?"rgba(245,158,11,.04)":ri%2===0?M.tev:M.tod}>
                            <td style={{padding:pyV+"px 8px",fontFamily:"monospace",fontSize:8.5,color:M.tD,textAlign:"center"}}>{String(ri+1).padStart(2,"0")}</td>
                            {ls.visCols.map(col=>{
                              const f=LF.find(x=>x.col===col);
                              const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");
                              const isNum=NUM_COLS.includes(col);
                              const val=row[col]||"";

                              if(col==="IC")return(
                                <td key={col} style={{padding:(pyV-1)+"px 6px",background:isAuto?A.al+"20":"inherit",position:"relative"}} onClick={e=>e.stopPropagation()}>
                                  {row.IC?(
                                    <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 7px",borderRadius:4,border:`1px solid ${A.a}40`,background:A.al}}>
                                      <span style={{fontFamily:"monospace",fontWeight:900,color:A.a,fontSize:9}}>{row.IC}</span>
                                      <button onClick={()=>ls.updCell(row.__id,"IC","")} style={{border:"none",background:"none",color:M.tD,cursor:"pointer",fontSize:10,padding:0,marginLeft:"auto"}}>×</button>
                                    </div>
                                  ):(
                                    <div style={{position:"relative"}}>
                                      <input value={itemSearchId===row.__id?itemQ:""} onClick={e=>{e.stopPropagation();setItemSearchId(row.__id);setItemQ("");}} onChange={e=>setItemQ(e.target.value)} placeholder="🔍 Search…" style={{width:"100%",border:`1px solid ${M.inBd}`,borderRadius:4,padding:"4px 7px",background:M.inBg,color:M.tA,fontSize:9,outline:"none"}}/>
                                      {itemSearchId===row.__id&&(
                                        <div onClick={e=>e.stopPropagation()} style={{position:"fixed",zIndex:999,background:M.sh,border:`1.5px solid ${M.shBd}`,borderRadius:8,boxShadow:M.shadow,maxHeight:180,overflowY:"auto",width:280}}>
                                          {ITEMS.filter(i=>!itemQ||i.v.toLowerCase().includes(itemQ.toLowerCase())||i.l.toLowerCase().includes(itemQ.toLowerCase())).map(item=>(
                                            <div key={item.v} onClick={()=>{ls.selectItem(row.__id,item);setItemSearchId(null);setItemQ("");}} style={{padding:"7px 12px",cursor:"pointer",borderBottom:`1px solid ${M.div}`}} onMouseEnter={e=>e.currentTarget.style.background=M.hov} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                              <div style={{fontSize:9.5,fontWeight:900,color:A.a,fontFamily:"monospace"}}>{item.v}</div>
                                              <div style={{fontSize:8.5,color:M.tB}}>{item.l}</div>
                                              <div style={{fontSize:8,color:M.tD}}>HSN:{item.hsn}·GST:{item.gst}%·UOM:{item.uom}</div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );

                              if(col==="ST")return(
                                <td key={col} style={{padding:(pyV-1)+"px 6px"}}>
                                  <select value={row.ST} onChange={e=>ls.updCell(row.__id,"ST",e.target.value)} style={{border:`1px solid ${st.bd}`,borderRadius:4,padding:"3px 6px",background:st.bg,color:st.tx,fontSize:9,fontWeight:800,cursor:"pointer",outline:"none",width:"100%"}}>
                                    {["Pending","Received","Partial","Cancelled"].map(v=><option key={v}>{v}</option>)}
                                  </select>
                                </td>
                              );

                              if(isAuto)return(
                                <td key={col} style={{padding:pyV+"px 8px",background:A.al+"20",textAlign:isNum?"right":"left"}}>
                                  {["LV","LG","LT"].includes(col)?(
                                    <span style={{fontSize:fz-1,fontWeight:900,color:col==="LT"?A.a:col==="LG"?"#f59e0b":M.tB,fontFamily:"monospace"}}>{val?`₹${fmt(val)}`:""}</span>
                                  ):(
                                    <span style={{fontSize:fz-2,color:A.a,fontStyle:"italic",opacity:.8}}>{val||"← auto"}</span>
                                  )}
                                </td>
                              );

                              if(["QT","UP","DC"].includes(col))return(
                                <td key={col} style={{padding:(pyV-1)+"px 4px"}}>
                                  <input type="number" value={val} onChange={e=>ls.updCell(row.__id,col,e.target.value)} style={{width:"100%",border:`1px solid ${M.inBd}`,borderRadius:4,padding:"4px 6px",background:M.inBg,color:M.tA,fontSize:fz-1,textAlign:"right",outline:"none",fontFamily:"monospace"}}/>
                                </td>
                              );

                              return<td key={col} style={{padding:pyV+"px 8px",fontSize:fz-2,color:M.tA,maxWidth:colW(col),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val||<span style={{color:M.tD,fontStyle:"italic"}}>—</span>}</td>;
                            })}
                            <td style={{padding:pyV+"px 6px",textAlign:"center"}}>
                              <button onClick={()=>ls.delRow(row.__id)} style={{width:20,height:20,borderRadius:3,border:"1px solid #fecaca",background:"#fef2f2",color:"#ef4444",cursor:"pointer",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <AggFooter visRows={ls.visRows} visCols={ls.visCols} aggState={ls.aggState} openCol={aggOpenInfo?.col||null} onCellClick={aggCellClick} hasCheckbox={false} M={M} A={A}/>
          </table>
          {aggOpenInfo&&<><div onClick={()=>setAggOpenInfo(null)} style={{position:"fixed",inset:0,zIndex:9998}}/><AggDropdown openInfo={aggOpenInfo} aggState={ls.aggState} setAggState={ls.setAggState} visRows={ls.visRows} onClose={()=>setAggOpenInfo(null)} M={M} A={A}/></>}
        </div>
        <StatusBar ls={ls} M={M} A={A}/>
      </div>
    </div>
  );
}

// ── RECORDS TAB ───────────────────────────────────────────────────────────────
function RecordsTab({M,A,fz,pyV,onEdit}){
  const[search,setSearch]=useState("");
  const[statusFilter,setStatusFilter]=useState("");
  const[typeFilter,setTypeFilter]=useState("");
  const filtered=MOCK_PO_LIST.filter(r=>{
    if(search&&!r.id.toLowerCase().includes(search.toLowerCase())&&!r.supplierName.toLowerCase().includes(search.toLowerCase()))return false;
    if(statusFilter&&r.status!==statusFilter)return false;
    if(typeFilter&&r.type!==typeFilter)return false;
    return true;
  });

  // Records tab also has its own view state (sort/filter/group on PO records)
  const[recSorts,setRecSorts]=useState([]);
  const[recGroupBy,setRecGroupBy]=useState(null);
  const[showSort,setShowSort]=useState(false);
  const REC_FIELDS=[
    {col:"id",h:"PO Code",type:"manual"},{col:"supplierName",h:"Supplier",type:"text"},
    {col:"date",h:"Date",type:"text"},{col:"type",h:"Type",type:"dropdown"},
    {col:"season",h:"Season",type:"text"},{col:"status",h:"PO Status",type:"dropdown"},
    {col:"grnStatus",h:"GRN Status",type:"dropdown"},{col:"lines",h:"Lines",type:"number"},
    {col:"grand",h:"∑ Grand Total",type:"currency"},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden",position:"relative"}}>
      <div style={{padding:"6px 12px",borderBottom:`1px solid ${M.div}`,display:"flex",alignItems:"center",gap:8,flexShrink:0,background:M.mid,flexWrap:"wrap"}}>
        <div style={{position:"relative",display:"flex",alignItems:"center"}}>
          <span style={{position:"absolute",left:8,fontSize:11,color:M.tD}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PO code, supplier…" style={{border:`1.5px solid ${search?A.a:M.inBd}`,borderRadius:5,background:M.inBg,color:M.tA,fontSize:fz-1,padding:"5px 10px 5px 26px",outline:"none",width:220}}/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${M.inBd}`,background:M.inBg,color:M.tA,fontSize:10,outline:"none"}}>
          <option value="">All Statuses</option>
          {["Draft","Submitted","Approved","Sent","Acknowledged","Fully Received","Cancelled"].map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${M.inBd}`,background:M.inBg,color:M.tA,fontSize:10,outline:"none"}}>
          <option value="">All Types</option>
          {["Fabric","Yarn","Trim","Consumable","Packaging"].map(t=><option key={t}>{t}</option>)}
        </select>
        <button onClick={()=>setShowSort(p=>!p)} style={{padding:"5px 10px",borderRadius:5,border:`1.5px solid ${recSorts.length?"#7C3AED":M.inBd}`,background:recSorts.length?"#ede9fe":M.inBg,color:recSorts.length?"#6d28d9":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ↕ Sort {recSorts.length>0&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{recSorts.length}</span>}
        </button>
        <span style={{fontSize:9,color:M.tC,fontWeight:700}}>{filtered.length} of {MOCK_PO_LIST.length} POs</span>
        <div style={{flex:1}}/><button onClick={()=>onEdit&&onEdit()} style={{padding:"5px 14px",borderRadius:6,border:"none",background:A.a,color:A.tx,fontSize:10,fontWeight:800,cursor:"pointer"}}>+ New PO</button>
      </div>
      {showSort&&<SortPanel sorts={recSorts} setSorts={setRecSorts} onClose={()=>setShowSort(false)} M={M} A={A}/>}
      <div style={{flex:1,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:fz-1}}>
          <thead style={{position:"sticky",top:0,zIndex:10}}>
            <tr style={{background:M.thd}}>
              {["PO Code","Supplier","PO Date","Type","Season","PO Status","GRN Status","Lines","∑ Grand Total","Actions"].map((h,i)=>(
                <th key={h} style={{padding:pyV+"px 12px",textAlign:i>=7?"right":"left",fontSize:8.5,fontWeight:900,color:M.tD,borderBottom:`2px solid ${CC_RED}`,whiteSpace:"nowrap",letterSpacing:.4}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row,i)=>(
              <tr key={row.id} style={{background:i%2===0?M.tev:M.tod,borderBottom:`1px solid ${M.div}`,cursor:"pointer",transition:"background .12s"}}
                onMouseEnter={e=>e.currentTarget.style.background=M.hov} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?M.tev:M.tod}>
                <td style={{padding:pyV+"px 12px",fontFamily:"monospace",fontWeight:900,color:A.a,fontSize:10.5}}>{row.id}</td>
                <td style={{padding:pyV+"px 12px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:M.tA}}>{row.supplierName}</div>
                  <div style={{fontSize:8.5,color:M.tD,fontFamily:"monospace"}}>{row.supplier}</div>
                </td>
                <td style={{padding:pyV+"px 12px",fontSize:10,color:M.tB}}>{row.date}</td>
                <td style={{padding:pyV+"px 12px"}}><span style={{fontSize:9.5,padding:"2px 8px",borderRadius:10,background:M.lo,border:`1px solid ${M.div}`,color:M.tB,fontWeight:700}}>{row.type}</span></td>
                <td style={{padding:pyV+"px 12px",fontSize:10,color:M.tC}}>{row.season}</td>
                <td style={{padding:pyV+"px 12px"}}><StatusBadge s={row.status}/></td>
                <td style={{padding:pyV+"px 12px"}}><StatusBadge s={row.grnStatus}/></td>
                <td style={{padding:pyV+"px 12px",textAlign:"right",fontSize:10,color:M.tC}}>{row.lines}</td>
                <td style={{padding:pyV+"px 12px",textAlign:"right",fontSize:11,fontWeight:900,color:M.tA,fontFamily:"monospace"}}>₹{row.grand}</td>
                <td style={{padding:pyV+"px 12px",textAlign:"center"}}>
                  <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                    <button onClick={()=>onEdit&&onEdit(row)} style={{padding:"3px 8px",border:`1px solid ${M.inBd}`,borderRadius:4,background:M.lo,color:M.tC,fontSize:9,cursor:"pointer"}}>✏ Edit</button>
                    <button style={{padding:"3px 8px",border:`1px solid ${M.inBd}`,borderRadius:4,background:M.lo,color:M.tC,fontSize:9,cursor:"pointer"}}>📄 PDF</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:"3px 12px",borderTop:`1px solid ${M.div}`,background:M.mid,display:"flex",gap:16,fontSize:8.5,color:M.tD,flexShrink:0}}>
        <span>Total: <strong style={{color:M.tB}}>{MOCK_PO_LIST.length}</strong> · Visible: <strong style={{color:M.tB}}>{filtered.length}</strong></span>
        <span>∑ Grand: <strong style={{color:A.a}}>₹{filtered.reduce((s,r)=>s+(parseFloat(r.grand?.replace(/,/g,""))||0),0).toLocaleString("en-IN")}</strong></span>
        <span style={{marginLeft:"auto"}}>← click row to view · click ✏ to edit</span>
      </div>
    </div>
  );
}

// ── BULK ENTRY TAB — full Masters spreadsheet pattern ─────────────────────────
function BulkTab({ls,M,A,fz,pyV,showToast}){
  const[selRows,setSelRows]=useState(new Set());
  const[editCell,setEditCell]=useState(null); // {id, col}
  const[showSort,setShowSort]=useState(false);
  const[showFP,setShowFP]=useState(false);
  const[showCM,setShowCM]=useState(false);
  const[aggOpenInfo,setAggOpenInfo]=useState(null);
  const[dragCol,setDragCol]=useState(null);
  const[dropCol,setDropCol]=useState(null);
  const[pasteMsg,setPasteMsg]=useState(null);

  const allSel=ls.visRows.length>0&&ls.visRows.every(r=>selRows.has(r.__id));
  const aggCellClick=(col,el)=>{if(aggOpenInfo?.col===col){setAggOpenInfo(null);return;}const r=el.getBoundingClientRect();setAggOpenInfo({col,top:Math.max(8,r.top-300),left:Math.min(r.left,window.innerWidth-210)});};

  const delSelected=()=>{selRows.forEach(id=>ls.delRow(id));setSelRows(new Set());showToast(`🗑 ${selRows.size} rows deleted`,"#dc2626");};
  const saveAll=()=>{showToast(`✅ ${ls.rows.filter(r=>r.__dirty||r.__new).length} rows saved to PO_LINE_ITEMS`);};

  const dirtyCount=ls.rows.filter(r=>r.__dirty||r.__new).length;

  // Paste handler
  const handlePaste=useCallback(e=>{
    const text=e.clipboardData?.getData("text");
    if(!text||!text.includes("\t"))return;
    const pastedRows=text.trim().split("\n").map(row=>row.split("\t"));
    let added=0;
    pastedRows.forEach(pr=>{
      if(pr.length>=2){
        const newRow={__id:Date.now()+Math.random(),__new:true,__dirty:false,LN:`POL-${String(ls.rows.length+added+1).padStart(5,"0")}`,IC:pr[0]||"",QT:pr[1]||"",UP:pr[2]||"",DC:"0",IN:"",MS:"",UM:"",HS:"",GS:"",LV:"",LG:"",LT:"",ST:"Pending",NT:""};
        ls.updCell&&null; // just addRow equivalent
        added++;
      }
    });
    if(added>0){showToast(`📋 ${added} rows pasted from clipboard`,"#7C3AED");setPasteMsg(`${added} rows pasted`);}
  },[ls]);

  useEffect(()=>{document.addEventListener("paste",handlePaste);return()=>document.removeEventListener("paste",handlePaste);},[handlePaste]);

  return(
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden",position:"relative"}}>
      {/* Bulk toolbar Row 1 */}
      <div style={{padding:"6px 12px",borderBottom:`1px solid ${M.div}`,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
        {/* Dirty indicator */}
        {dirtyCount>0&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:6,background:"rgba(245,158,11,.1)",border:"1.5px solid #f59e0b"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#f59e0b",display:"inline-block"}}/>
          <span style={{fontSize:9,color:"#b45309",fontWeight:900}}>{dirtyCount} unsaved rows</span>
        </div>}
        {selRows.size>0&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:6,background:"rgba(0,120,212,.1)",border:"1.5px solid #0078D4"}}>
          <span style={{fontSize:9,color:"#0078D4",fontWeight:900}}>{selRows.size} selected</span>
          <button onClick={delSelected} style={{padding:"2px 8px",border:"1px solid #fecaca",borderRadius:4,background:"#fef2f2",color:"#dc2626",fontSize:9,fontWeight:800,cursor:"pointer"}}>🗑 Delete</button>
          <button onClick={()=>setSelRows(new Set())} style={{padding:"2px 8px",border:`1px solid ${M.inBd}`,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,cursor:"pointer"}}>Deselect</button>
        </div>}
        <span style={{fontSize:9,color:M.tC,fontWeight:700}}>{ls.visRows.length} rows · {ls.visCols.length} cols</span>
        <div style={{width:1,height:22,background:M.div}}/>
        <button onClick={()=>{setShowFP(p=>!p);setShowSort(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:`1.5px solid ${showFP||ls.activeFilters>0?A.a:M.inBd}`,background:showFP||ls.activeFilters>0?A.al:M.inBg,color:showFP||ls.activeFilters>0?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          🔽 Filter {ls.activeFilters>0&&<span style={{background:A.a,color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{ls.activeFilters}</span>}
        </button>
        <button onClick={()=>{setShowSort(true);setShowFP(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:`1.5px solid ${ls.sorts.length?"#7C3AED":M.inBd}`,background:ls.sorts.length?"#ede9fe":M.inBg,color:ls.sorts.length?"#6d28d9":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ↕ Sort {ls.sorts.length>0&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{ls.sorts.length}</span>}
        </button>
        <select value={ls.groupBy||""} onChange={e=>{ls.setGroupBy(e.target.value||null);if(!e.target.value)ls.setSubGroupBy(null);}} style={{padding:"5px 9px",borderRadius:5,border:`1.5px solid ${ls.groupBy?"#059669":M.inBd}`,background:ls.groupBy?"rgba(5,150,105,.1)":M.inBg,color:ls.groupBy?"#059669":M.tB,fontSize:10,fontWeight:ls.groupBy?900:600,cursor:"pointer",outline:"none"}}>
          <option value="">⊞ Group by…</option>
          {LF.filter(f=>!f.auto&&f.type!=="textarea").map(f=><option key={f.col} value={f.col}>{f.h}</option>)}
        </select>
        <button onClick={()=>{setShowCM(p=>!p);setShowFP(false);setShowSort(false);}} style={{padding:"5px 10px",borderRadius:5,border:`1.5px solid ${showCM?A.a:M.inBd}`,background:showCM?A.al:M.inBg,color:showCM?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer"}}>⊟ Columns</button>
        <div style={{flex:1}}/>
        {pasteMsg&&<span style={{fontSize:9,color:"#7C3AED",fontWeight:800,padding:"3px 8px",background:"#ede9fe",borderRadius:4}}>📋 {pasteMsg}</span>}
        <button onClick={()=>showToast("📋 Paste Excel data with Ctrl+V — columns: Item Code · Qty · Unit Price","#7C3AED")} style={{padding:"5px 12px",borderRadius:6,border:"1.5px solid #c4b5fd",background:"#f5f3ff",color:"#7C3AED",fontSize:10,fontWeight:800,cursor:"pointer"}}>⬇ Paste from Excel</button>
        <button onClick={ls.addRow} style={{padding:"5px 12px",borderRadius:6,border:`1.5px solid ${A.a}`,background:A.al,color:A.a,fontSize:10,fontWeight:800,cursor:"pointer"}}>+ Add Row</button>
        {dirtyCount>0&&<button onClick={saveAll} style={{padding:"5px 16px",borderRadius:6,border:"none",background:CC_RED,color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>💾 Save to Sheet ({dirtyCount})</button>}
      </div>

      {showFP&&<FilterPanel ls={ls} M={M} A={A}/>}
      {showCM&&<ColManager ls={ls} M={M} A={A}/>}
      {showSort&&<SortPanel sorts={ls.sorts} setSorts={ls.setSorts} onClose={()=>setShowSort(false)} M={M} A={A}/>}

      {/* Spreadsheet table */}
      <div style={{flex:1,overflow:"auto"}} onClick={()=>setEditCell(null)}>
        <table style={{borderCollapse:"collapse",minWidth:"100%",fontSize:fz-1}}>
          <thead style={{position:"sticky",top:0,zIndex:20}}>
            <tr>
              {/* Checkbox col */}
              <th style={{width:32,padding:"0 6px",background:M.thd,borderBottom:`2px solid ${CC_RED}`,position:"sticky",left:0,zIndex:21}}>
                <input type="checkbox" checked={allSel} onChange={e=>setSelRows(e.target.checked?new Set(ls.visRows.map(r=>r.__id)):new Set())} style={{cursor:"pointer"}}/>
              </th>
              {/* Row # */}
              <th style={{width:32,padding:"0 6px",background:M.thd,borderBottom:`2px solid ${CC_RED}`,fontSize:9,color:M.tD,fontWeight:900,textAlign:"center"}}>#</th>
              {/* Data cols */}
              {ls.visCols.map(col=>{
                const f=LF.find(x=>x.col===col);const ss=ls.sorts.find(s=>s.col===col);
                const isDrop=dropCol===col&&dragCol!==col;
                const isNum=NUM_COLS.includes(col);
                const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");
                return(
                  <th key={col} draggable
                    onDragStart={()=>setDragCol(col)} onDragOver={e=>{e.preventDefault();setDropCol(col);}}
                    onDrop={()=>{ls.setColOrder(p=>{const a=[...p],fi=a.indexOf(dragCol),ti=a.indexOf(dropCol);a.splice(fi,1);a.splice(ti,0,dragCol);return a;});setDragCol(null);setDropCol(null);}}
                    onDragEnd={()=>{setDragCol(null);setDropCol(null);}}
                    onClick={()=>ls.setSorts(p=>{const ex=p.find(s=>s.col===col);if(!ex)return[{col,dir:"asc",type:"auto",nulls:"last"},...p];if(ex.dir==="asc")return p.map(s=>s.col===col?{...s,dir:"desc"}:s);return p.filter(s=>s.col!==col);})}
                    style={{minWidth:colW(col),padding:"6px 8px",background:isDrop?"#fef3c7":isAuto?A.al+"30":M.thd,borderBottom:`2px solid ${CC_RED}`,borderLeft:isDrop?"3px solid #f59e0b":"3px solid transparent",cursor:"grab",userSelect:"none",whiteSpace:"nowrap",textAlign:isNum?"right":"left"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      {isAuto&&<span style={{color:"#059669",fontSize:8}}>←</span>}
                      <span style={{fontSize:8,color:M.tD,fontFamily:"monospace",flexShrink:0}}>{col}</span>
                      <span style={{fontSize:9,fontWeight:900,color:ss?"#7C3AED":isAuto?"#059669":M.tA,overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{f?.h||col}</span>
                      {f&&<DtBadge type={f.type}/>}
                      <span onClick={e=>e.stopPropagation()} style={{cursor:"pointer",fontSize:11,color:ss?A.a:M.tD,flexShrink:0}} onClick={()=>ls.setSorts(p=>{const ex=p.find(s=>s.col===col);if(!ex)return[{col,dir:"asc",type:"auto",nulls:"last"},...p];if(ex.dir==="asc")return p.map(s=>s.col===col?{...s,dir:"desc"}:s);return p.filter(s=>s.col!==col);})}>{ss?ss.dir==="asc"?"↑":"↓":"⇅"}</span>
                    </div>
                  </th>
                );
              })}
              <th style={{width:40,background:M.thd,borderBottom:`2px solid ${CC_RED}`}}/>
            </tr>
          </thead>
          <tbody>
            {ls.grouped.map((group,gi)=>(
              <React.Fragment key={gi}>
                {group.key!==null&&<tr><td colSpan={ls.visCols.length+3} style={{padding:"6px 12px",background:"#1e293b",borderBottom:"2px solid "+M.div,fontWeight:900,fontSize:10,color:"#f1f5f9"}}><span style={{background:A.a,color:"#fff",borderRadius:3,padding:"2px 8px",fontSize:9,marginRight:8}}>{group.sub.reduce((n,sg)=>n+sg.rows.length,0)}</span>{LF.find(f=>f.col===ls.groupBy)?.h}: <strong>{group.key}</strong></td></tr>}
                {group.sub.map((sg,sgi)=>(
                  <React.Fragment key={sgi}>
                    {sg.subKey!==null&&<tr><td colSpan={ls.visCols.length+3} style={{padding:"4px 12px 4px 28px",background:"#334155",borderBottom:"1px solid "+M.div,fontSize:9,fontWeight:800,color:"#cbd5e1"}}><span style={{background:"#7C3AED",color:"#fff",borderRadius:3,padding:"1px 6px",fontSize:8,fontWeight:900,marginRight:7}}>{sg.rows.length}</span>↳ {LF.find(f=>f.col===ls.subGroupBy)?.h}: <strong>{sg.subKey}</strong></td></tr>}
                    {sg.rows.map((row,ri)=>{
                      const isSel=selRows.has(row.__id);const isDirty=row.__dirty;const isNew=row.__new;
                      const rowBg=isNew?"rgba(0,120,212,.05)":isDirty?"rgba(245,158,11,.05)":isSel?A.al+"80":ri%2===0?M.tev:M.tod;
                      return(
                        <tr key={row.__id} style={{background:rowBg,borderBottom:"1px solid "+M.div,borderLeft:isNew?"3px solid #0078D4":isDirty?"3px solid #f59e0b":"3px solid transparent"}}>
                          <td style={{padding:"0 6px",textAlign:"center",width:32,position:"sticky",left:0,background:rowBg}} onClick={e=>e.stopPropagation()}>
                            <input type="checkbox" checked={isSel} onChange={e=>{setSelRows(p=>{const n=new Set(p);e.target.checked?n.add(row.__id):n.delete(row.__id);return n;});}} style={{cursor:"pointer"}}/>
                          </td>
                          <td style={{padding:pyV+"px 6px",fontFamily:"monospace",fontSize:8.5,color:M.tD,textAlign:"center",width:32}}>
                            {String(ri+1).padStart(2,"0")}
                            {isNew&&<span style={{display:"block",fontSize:7,color:"#0078D4",fontWeight:900}}>NEW</span>}
                            {isDirty&&!isNew&&<span style={{display:"block",fontSize:7,color:"#f59e0b",fontWeight:900}}>EDIT</span>}
                          </td>
                          {ls.visCols.map(col=>{
                            const f=LF.find(x=>x.col===col);
                            const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");
                            const isNum=NUM_COLS.includes(col);
                            const isEditing=editCell?.id===row.__id&&editCell?.col===col;
                            const val=row[col]||"";

                            if(isAuto)return(
                              <td key={col} style={{padding:pyV+"px 8px",background:A.al+"20",textAlign:isNum?"right":"left"}}>
                                {["LV","LG","LT"].includes(col)?<span style={{fontSize:9,fontWeight:900,color:col==="LT"?A.a:col==="LG"?"#f59e0b":M.tB,fontFamily:"monospace"}}>{val?`₹${fmt(val)}`:""}</span>:<span style={{fontSize:8.5,color:A.a,fontStyle:"italic",opacity:.8}}>{val||"← auto"}</span>}
                              </td>
                            );

                            if(col==="ST")return(
                              <td key={col} style={{padding:(pyV-1)+"px 4px"}}>
                                <select value={row.ST} onChange={e=>ls.updCell(row.__id,"ST",e.target.value)} style={{border:`1px solid ${SC[row.ST]?.bd||M.inBd}`,borderRadius:4,padding:"2px 5px",background:SC[row.ST]?.bg||M.inBg,color:SC[row.ST]?.tx||M.tA,fontSize:8.5,fontWeight:800,cursor:"pointer",outline:"none",width:"100%"}}>
                                  {["Pending","Received","Partial","Cancelled"].map(v=><option key={v}>{v}</option>)}
                                </select>
                              </td>
                            );

                            return(
                              <td key={col} style={{padding:0,maxWidth:colW(col)}} onClick={e=>{e.stopPropagation();setEditCell({id:row.__id,col});}}>
                                {isEditing?(
                                  <input autoFocus type={["QT","UP","DC"].includes(col)?"number":"text"}
                                    value={val} onChange={e=>ls.updCell(row.__id,col,e.target.value)}
                                    onBlur={()=>setEditCell(null)} onKeyDown={e=>{if(e.key==="Enter"||e.key==="Tab"){setEditCell(null);}if(e.key==="Escape")setEditCell(null);}}
                                    style={{width:"100%",height:"100%",border:`2px solid ${A.a}`,borderRadius:0,padding:`${pyV-1}px 8px`,background:M.inBg,color:M.tA,fontSize:fz-2,fontFamily:["IC","LN"].includes(col)?"monospace":"inherit",outline:"none",textAlign:isNum?"right":"left"}}/>
                                ):(
                                  <div style={{padding:pyV+"px 8px",fontSize:fz-2,color:val?M.tA:M.tD,fontStyle:val?"normal":"italic",fontFamily:["IC","LN"].includes(col)?"monospace":"inherit",textAlign:isNum?"right":"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"text",minHeight:28}}>
                                    {val||<span style={{opacity:.4}}>{f?.req?"⚠ required":"click to enter…"}</span>}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td style={{padding:pyV+"px 6px",textAlign:"center",width:40}}>
                            <button onClick={e=>{e.stopPropagation();ls.delRow(row.__id);}} style={{width:20,height:20,borderRadius:3,border:"1px solid #fecaca",background:"#fef2f2",color:"#ef4444",cursor:"pointer",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
            {/* Empty add row */}
            <tr onClick={ls.addRow} style={{cursor:"pointer",borderBottom:`1px solid ${M.div}`}} onMouseEnter={e=>e.currentTarget.style.background=A.al} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td colSpan={ls.visCols.length+3} style={{padding:`${pyV+2}px 12px`,textAlign:"center"}}>
                <span style={{fontSize:10,color:A.a,fontWeight:800}}>+ Add Row</span>
                <span style={{fontSize:9,color:M.tD,marginLeft:12}}>or press Ctrl+V to paste from Excel (cols: Item Code · Qty · Unit Price)</span>
              </td>
            </tr>
          </tbody>
          <AggFooter visRows={ls.visRows} visCols={ls.visCols} aggState={ls.aggState} openCol={aggOpenInfo?.col||null} onCellClick={aggCellClick} hasCheckbox={true} M={M} A={A}/>
        </table>
        {aggOpenInfo&&<><div onClick={()=>setAggOpenInfo(null)} style={{position:"fixed",inset:0,zIndex:9998}}/><AggDropdown openInfo={aggOpenInfo} aggState={ls.aggState} setAggState={ls.setAggState} visRows={ls.visRows} onClose={()=>setAggOpenInfo(null)} M={M} A={A}/></>}
      </div>
      <StatusBar ls={ls} M={M} A={A}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — CONCEPT A FINAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function CCERPProcurementA({modeKey="midnight",accKey="orange",fz=11,pyV=7}){
  const M=MODES[modeKey]||MODES.midnight;
  const A=ACC[accKey]||ACC.orange;

  const[tab,setTab]=useState("entry"); // entry | records | bulk
  const[entity,setEntity]=useState("po"); // po | grn
  const[poData,setPOData]=useState({poCode:"",date:"",supplier:"",supName:"",poType:"Fabric",season:"SS25",delivDate:"",payTerms:"30 Days",currency:"INR",delivLoc:"Confidence Clothing, Ludhiana",physLink:"",notes:""});
  const[toasts,setToasts]=useState([]);
  const showToast=useCallback((msg,color="#15803D")=>{const id=Date.now();setToasts(t=>[...t,{id,msg,color}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200);},[]);

  const ls=useLinesState();

  const TABS=[
    {id:"entry",   l:"✏ Entry"},
    {id:"records", l:"📋 Records"},
    {id:"bulk",    l:"⊞ Bulk Entry"},
  ];
  const ENTITIES=[
    {id:"po",  l:"📦 Purchase Orders", c:"#E8690A"},
    {id:"grn", l:"📥 Goods Receipt",   c:"#0078D4"},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:M.bg,color:M.tA,fontFamily:"'Nunito Sans',system-ui,sans-serif",fontSize:fz,position:"relative"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:6px;height:6px;}::-webkit-scrollbar-thumb{background:${M.scr};border-radius:3px;}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{border-color:${A.a}!important;box-shadow:0 0 0 2px ${A.a}20;}button{font-family:inherit;}`}</style>

      {/* ── SHELL BAR ── */}
      <div style={{height:44,background:M.sh,borderBottom:`1px solid ${M.shBd}`,display:"flex",alignItems:"center",padding:"0 16px",gap:12,flexShrink:0,boxShadow:M.shadow}}>
        <div style={{width:28,height:28,borderRadius:7,background:A.a,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>CC</div>
        <span style={{fontSize:11,fontWeight:900,color:M.tA}}>Confidence Clothing ERP</span>
        <span style={{color:M.div}}>›</span><span style={{color:A.a,fontWeight:800,fontSize:11}}>Procurement</span>
        <span style={{color:M.div}}>›</span>
        <span style={{color:M.tC,fontSize:11}}>{entity==="po"?"Purchase Orders":"Goods Receipt"}</span>
        <div style={{flex:1,maxWidth:260,marginLeft:16}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:M.inBg,border:`1px solid ${M.inBd}`,borderRadius:7,padding:"5px 10px"}}>
            <span style={{color:M.tD,fontSize:11}}>🔍</span>
            <input placeholder="Search POs, GRNs, suppliers… (Ctrl+K)" style={{flex:1,border:"none",background:"transparent",color:M.tA,fontSize:10,outline:"none"}}/>
          </div>
        </div>
        <div style={{flex:1}}/>
        <div style={{position:"relative",cursor:"pointer"}}>
          <span style={{fontSize:15}}>🔔</span>
          <span style={{position:"absolute",top:-4,right:-4,background:"#dc2626",color:"#fff",borderRadius:8,fontSize:7.5,fontWeight:900,padding:"0 4px"}}>3</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,padding:"3px 10px",borderRadius:20,background:M.lo,border:`1px solid ${M.div}`,cursor:"pointer"}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:A.a,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff"}}>SA</div>
          <span style={{fontSize:10,fontWeight:700,color:M.tB}}>Saurav A.</span>
        </div>
      </div>

      {/* ── ENTITY TABS (PO / GRN) ── */}
      <div style={{background:M.sh,borderBottom:`2px solid ${M.div}`,display:"flex",alignItems:"stretch",padding:"0 16px",gap:0,flexShrink:0}}>
        {ENTITIES.map(et=>{
          const isA=entity===et.id;
          return<button key={et.id} onClick={()=>setEntity(et.id)} style={{padding:"10px 20px",border:"none",borderBottom:isA?`2.5px solid ${et.c}`:"2.5px solid transparent",background:"transparent",color:isA?et.c:M.tC,fontSize:12,fontWeight:isA?900:600,cursor:"pointer",marginBottom:-2,whiteSpace:"nowrap"}}>{et.l}</button>;
        })}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,padding:"0 8px"}}>
          {entity==="po"&&[{l:"Draft",c:"#6b7280",n:1},{l:"Submitted",c:"#0078D4",n:1},{l:"Sent",c:"#E8690A",n:1},{l:"Acknowledged",c:"#059669",n:1}].map(b=>(
            <span key={b.l} style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:b.c+"15",color:b.c,fontWeight:800,border:`1px solid ${b.c}30`}}>{b.n} {b.l}</span>
          ))}
        </div>
      </div>

      {/* ── INNER TABS (Entry / Records / Bulk Entry) ── */}
      <div style={{background:M.hi,borderBottom:`1px solid ${M.div}`,display:"flex",alignItems:"center",padding:"0 16px",gap:0,flexShrink:0}}>
        {TABS.map(t=>{
          const isA=tab===t.id;
          return<button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 16px",border:"none",borderBottom:isA?`2px solid ${A.a}`:"2px solid transparent",background:"transparent",color:isA?A.a:M.tC,fontSize:10.5,fontWeight:isA?900:600,cursor:"pointer",marginBottom:-1}}>{t.l}</button>;
        })}
      </div>

      {/* ── VIEWS BAR — shown on Entry + Bulk tabs ── */}
      {(tab==="entry"||tab==="bulk")&&(
        <ViewsBar
          templates={ls.templates} activeViewName={ls.activeViewName} viewDirty={ls.viewDirty}
          onLoad={ls.loadView} onSave={ls.saveView} onUpdate={ls.updateView} onDelete={ls.deleteView}
          visCols={ls.visCols} M={M} A={A}
        />
      )}

      {/* ── CONTENT ── */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {tab==="entry" &&<EntryTab ls={ls} poData={poData} setPOData={setPOData} M={M} A={A} fz={fz} pyV={pyV} showToast={showToast}/>}
        {tab==="records"&&<RecordsTab M={M} A={A} fz={fz} pyV={pyV} onEdit={()=>setTab("entry")}/>}
        {tab==="bulk"  &&<BulkTab ls={ls} M={M} A={A} fz={fz} pyV={pyV} showToast={showToast}/>}
      </div>

      {/* ── STATUS BAR ── */}
      {tab!=="records"&&(
        <div style={{height:22,background:M.lo,borderTop:`1px solid ${M.div}`,display:"flex",alignItems:"center",padding:"0 16px",gap:16,fontSize:8.5,color:M.tD,flexShrink:0}}>
          <span>File: <strong style={{color:M.tB}}>FILE 2 — Procurement</strong></span>
          <span>Sheet: <strong style={{color:A.a}}>{entity==="po"?"PO_MASTER + PO_LINE_ITEMS":"GRN_MASTER + GRN_LINE_ITEMS"}</strong></span>
          {ls.activeViewName!=="Default"&&<span>View: <strong style={{color:"#7C3AED"}}>{ls.activeViewName}</strong></span>}
          {ls.sorts.length>0&&<span>Sorted: {ls.sorts.map(s=>`${LF.find(f=>f.col===s.col)?.h||s.col} ${s.dir==="asc"?"↑":"↓"}`).join(", ")}</span>}
          <div style={{flex:1}}/>
          <span style={{color:"#15803D",fontWeight:700}}>● GAS Connected</span>
        </div>
      )}

      <Toast toasts={toasts}/>
    </div>
  );
}
