import { useState, useEffect, useCallback, useRef } from "react";

// ─── FONTS ────────────────────────────────────────────────────────────────────
const _f = document.createElement("link");
_f.rel = "stylesheet";
_f.href = "https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,600;6..12,700;6..12,800;6..12,900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@300;400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&family=Plus+Jakarta+Sans:wght@300;400;600;700;800;900&family=Outfit:wght@300;400;600;700;800;900&family=Source+Sans+3:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Fira+Code:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap";
document.head.appendChild(_f);

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const _s = document.createElement("style");
_s.textContent = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Nunito Sans',sans-serif;overflow:hidden}
  @keyframes ddAnim   {from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideLeft{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes scaleIn  {from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes themeSwap{0%{opacity:.7}100%{opacity:1}}
  @keyframes cmdIn    {from{opacity:0;transform:translateY(-20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  .dd-anim  {animation:ddAnim    .16s ease}
  .sp-anim  {animation:slideLeft .22s ease}
  .sc-anim  {animation:scaleIn   .15s ease}
  .fade-slide{animation:fadeSlide .25s ease both}
  .theme-anim{animation:themeSwap .25s ease}
  .cmd-anim {animation:cmdIn     .18s cubic-bezier(.2,.8,.3,1)}
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{border-radius:3px}
  .notif-action-btn:hover{filter:brightness(1.12)}
  .sc-item:hover .sc-remove{opacity:1!important}
`;
document.head.appendChild(_s);

// ─── FONT CATALOGUES ──────────────────────────────────────────────────────────
const UI_FONTS = [
  {id:"nunito",   name:"Nunito Sans",       family:"'Nunito Sans', sans-serif",      tag:"DEFAULT · Warm & Rounded"},
  {id:"inter",    name:"Inter",             family:"'Inter', sans-serif",            tag:"Clean · Neutral"},
  {id:"dm",       name:"DM Sans",           family:"'DM Sans', sans-serif",          tag:"Modern · Geometric"},
  {id:"jakarta",  name:"Plus Jakarta Sans", family:"'Plus Jakarta Sans', sans-serif",tag:"Professional · Crisp"},
  {id:"outfit",   name:"Outfit",            family:"'Outfit', sans-serif",           tag:"Minimal · Contemporary"},
  {id:"source",   name:"Source Sans 3",     family:"'Source Sans 3', sans-serif",    tag:"Editorial · Readable"},
];
const DATA_FONTS = [
  {id:"ibmplex",  name:"IBM Plex Mono",   family:"'IBM Plex Mono', monospace",  tag:"DEFAULT · Technical"},
  {id:"jetbrains",name:"JetBrains Mono",  family:"'JetBrains Mono', monospace", tag:"Dev-Friendly · Sharp"},
  {id:"fira",     name:"Fira Code",       family:"'Fira Code', monospace",      tag:"Ligatures · Elegant"},
  {id:"roboto",   name:"Roboto Mono",     family:"'Roboto Mono', monospace",    tag:"Neutral · Clean"},
  {id:"space",    name:"Space Mono",      family:"'Space Mono', monospace",     tag:"Distinctive · Retro"},
];
const uiFF  = id => UI_FONTS.find(f=>f.id===id)?.family  || UI_FONTS[0].family;
const dataFF= id => DATA_FONTS.find(f=>f.id===id)?.family || DATA_FONTS[0].family;

// ─── COLOUR SYSTEM ────────────────────────────────────────────────────────────
const MODES = {
  light:    {id:"light",    lbl:"☀️", name:"Light",      bg:"#f0f2f5",shellBg:"#ffffff",shellBd:"#e2e4e8",sidebarBg:"#ffffff",sidebarBd:"#e2e4e8",surfHigh:"#ffffff",surfMid:"#f7f8fa",surfLow:"#f0f2f5",hoverBg:"#eef1f8",inputBg:"#ffffff",inputBd:"#d1d5db",dropBg:"#ffffff",divider:"#e5e7eb",tblHead:"#f4f5f7",tblEven:"#ffffff",tblOdd:"#fafbfc",statusBg:"#f0f2f5",badgeBg:"#e5e7eb",badgeTx:"#374151",textA:"#111827",textB:"#374151",textC:"#6b7280",textD:"#9ca3af",scrollThumb:"#d1d5db",shadow:"0 4px 20px rgba(0,0,0,.09)"},
  black:    {id:"black",    lbl:"⬛", name:"Black",      bg:"#000000",shellBg:"#0a0a0a",shellBd:"#1c1c1c",sidebarBg:"#0a0a0a",sidebarBd:"#1c1c1c",surfHigh:"#111111",surfMid:"#161616",surfLow:"#0a0a0a",hoverBg:"#1c1c1c",inputBg:"#0d0d0d",inputBd:"#2a2a2a",dropBg:"#111111",divider:"#1f1f1f",tblHead:"#0d0d0d",tblEven:"#111111",tblOdd:"#141414",statusBg:"#0a0a0a",badgeBg:"#1c1c1c",badgeTx:"#888888",textA:"#f0f0f0",textB:"#a0a0a0",textC:"#666666",textD:"#444444",scrollThumb:"#2a2a2a",shadow:"0 4px 28px rgba(0,0,0,.85)"},
  lightgrey:{id:"lightgrey",lbl:"🩶", name:"Light Grey", bg:"#e4e7ec",shellBg:"#f2f3f5",shellBd:"#d4d6dc",sidebarBg:"#f2f3f5",sidebarBd:"#d4d6dc",surfHigh:"#f8f9fa",surfMid:"#eef0f3",surfLow:"#e4e7ec",hoverBg:"#e0e4ef",inputBg:"#f8f9fa",inputBd:"#c8cdd8",dropBg:"#f8f9fa",divider:"#d4d6dc",tblHead:"#ebedf0",tblEven:"#f8f9fa",tblOdd:"#f0f2f5",statusBg:"#e4e7ec",badgeBg:"#d4d6dc",badgeTx:"#3d4460",textA:"#1a1f2e",textB:"#3d4460",textC:"#6b7590",textD:"#9ba3b8",scrollThumb:"#c0c5d4",shadow:"0 4px 16px rgba(0,0,0,.08)"},
  midnight: {id:"midnight", lbl:"🌙", name:"Midnight",   bg:"#0d1117",shellBg:"#161b22",shellBd:"#21262d",sidebarBg:"#161b22",sidebarBd:"#21262d",surfHigh:"#1c2128",surfMid:"#161b22",surfLow:"#0d1117",hoverBg:"#21262d",inputBg:"#0d1117",inputBd:"#30363d",dropBg:"#161b22",divider:"#21262d",tblHead:"#161b22",tblEven:"#1c2128",tblOdd:"#161b22",statusBg:"#0d1117",badgeBg:"#21262d",badgeTx:"#7d8590",textA:"#e6edf3",textB:"#8b949e",textC:"#6e7681",textD:"#484f58",scrollThumb:"#30363d",shadow:"0 4px 24px rgba(0,0,0,.6)"},
  warm:     {id:"warm",     lbl:"🌅", name:"Warm Ivory", bg:"#f0ebe0",shellBg:"#fdf8f0",shellBd:"#e4d8c4",sidebarBg:"#fdf8f0",sidebarBd:"#e4d8c4",surfHigh:"#fdfaf4",surfMid:"#f5f0e8",surfLow:"#ede5d4",hoverBg:"#e8dece",inputBg:"#fdfaf4",inputBd:"#d4c8b0",dropBg:"#fdfaf4",divider:"#ddd0b8",tblHead:"#f0ebe0",tblEven:"#fdfaf4",tblOdd:"#f5f0e8",statusBg:"#ede5d4",badgeBg:"#e4d8c4",badgeTx:"#4a3c28",textA:"#1c1409",textB:"#5a4a34",textC:"#8a7460",textD:"#b0a090",scrollThumb:"#c8b89c",shadow:"0 4px 16px rgba(60,40,10,.12)"},
  slate:    {id:"slate",    lbl:"🔷", name:"Slate",      bg:"#1a2030",shellBg:"#252d40",shellBd:"#2d3654",sidebarBg:"#1e2433",sidebarBd:"#2d3654",surfHigh:"#2a3450",surfMid:"#222a3e",surfLow:"#1a2030",hoverBg:"#2d3654",inputBg:"#1a2030",inputBd:"#2d3654",dropBg:"#222a3e",divider:"#2d3654",tblHead:"#1e2433",tblEven:"#222a3e",tblOdd:"#1e2433",statusBg:"#1a2030",badgeBg:"#2d3654",badgeTx:"#8895b0",textA:"#d8e0f0",textB:"#8895b0",textC:"#5a6680",textD:"#3a4460",scrollThumb:"#2d3654",shadow:"0 4px 24px rgba(0,0,0,.5)"},
};
const ACCENTS = {
  orange:{id:"orange",lbl:"Oracle Orange",a:"#E8690A",al:"rgba(232,105,10,.1)",ad:"#b85208",tx:"#fff"},
  blue:  {id:"blue",  lbl:"Azure Blue",   a:"#0078D4",al:"rgba(0,120,212,.1)", ad:"#005a9e",tx:"#fff"},
  teal:  {id:"teal",  lbl:"Deep Teal",    a:"#007C7C",al:"rgba(0,124,124,.1)", ad:"#005f5f",tx:"#fff"},
  green: {id:"green", lbl:"Emerald",      a:"#15803D",al:"rgba(21,128,61,.1)", ad:"#0f6330",tx:"#fff"},
  purple:{id:"purple",lbl:"Violet",       a:"#7C3AED",al:"rgba(124,58,237,.1)",ad:"#5b21b6",tx:"#fff"},
  rose:  {id:"rose",  lbl:"Rose Red",     a:"#BE123C",al:"rgba(190,18,60,.1)", ad:"#9b0d30",tx:"#fff"},
};

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  mode:"light", accent:"orange",
  density:"comfortable", fontSize:"medium",
  tblStyle:"striped", lineView:"table",
  sbWidth:340, showStatusBar:true,
  showThumbs:true, showRowNums:true,
  showCatBadge:true, compactSide:false,
  uiFont:"nunito", dataFont:"ibmplex",
};
const FS_MAP = {small:11,medium:13,large:15};
const PY_MAP = {compact:4,comfortable:7,spacious:12};
const SW_PRESETS = [260,340,440];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ROLE_C = {Admin:"#BE123C",Manager:"#1D4ED8",Supervisor:"#7C3AED",Operator:"#15803D","View Only":"#6b7280"};
const ROLE_K = {Admin:"ADMIN",Manager:"MGR",Supervisor:"SUP",Operator:"OPR","View Only":"VIEW"};
const ME = {name:"Saurav Aggarwal",email:"saurav@confidenceclothing.com",role:"Admin",dept:"Management"};

const OTHERS = [
  {name:"Rajesh Kumar", email:"rajesh@cc.com",role:"Manager",   module:"Procurement",page:"PO-2026-0041",ts:Date.now()-18000, status:"active"},
  {name:"Amit Singh",   email:"amit@cc.com",  role:"Manager",   module:"Production", page:"WO-0089",     ts:Date.now()-5000,  status:"active"},
  {name:"Priya Sharma", email:"priya@cc.com", role:"Supervisor",module:"Quality",    page:"QC-0012",     ts:Date.now()-62000, status:"idle"},
  {name:"Ravi Verma",   email:"ravi@cc.com",  role:"Operator",  module:"Inventory",  page:"STK-0034",    ts:Date.now()-130000,status:"idle"},
  {name:"Anita Kaur",   email:"anita@cc.com", role:"View Only", module:"Dashboard",  page:"Home",        ts:Date.now()-22000, status:"active"},
];

const MODS = [
  {id:"procurement",icon:"📦",lbl:"Procurement", badge:3, desc:"PO · GRN · Returns",       col:"#E8690A",stats:{pend:3,today:12,val:"₹4.2L"}},
  {id:"production", icon:"🏭",lbl:"Production",  badge:1, desc:"Work Orders · BOM · JW",   col:"#0078D4",stats:{pend:1,today:5, val:"8 WOs"}},
  {id:"inventory",  icon:"🗄️",lbl:"Inventory",   badge:0, desc:"Stock · Transfer · Alerts", col:"#007C7C",stats:{pend:0,today:8, val:"142 SKUs"}},
  {id:"quality",    icon:"🔬",lbl:"Quality",      badge:2, desc:"Fabric · Inline · AQL",     col:"#7C3AED",stats:{pend:2,today:6, val:"94.2%"}},
  {id:"sales",      icon:"💼",lbl:"Sales",        badge:0, desc:"Orders · DC · Invoice",     col:"#15803D",stats:{pend:0,today:3, val:"₹8.7L"}},
  {id:"finance",    icon:"💰",lbl:"Finance",      badge:4, desc:"Payments · GST · Reports",  col:"#BE123C",stats:{pend:4,today:9, val:"₹2.1L"}},
  {id:"masters",    icon:"🗂️",lbl:"Masters",      badge:0, desc:"Items · Suppliers · Setup", col:"#B45309",stats:{pend:0,today:0, val:"52 sheets"}},
  {id:"dashboard",  icon:"📈",lbl:"Dashboard",    badge:0, desc:"Reports · Analytics",      col:"#0E7490",stats:{pend:0,today:0, val:"Live"}},
];

// ─── NOTIFICATION DATA ────────────────────────────────────────────────────────
// type: action(red) | warning(amber) | info(blue) | system(grey)
const NOTIF_INIT = [
  {id:"NTF-00001",type:"action", icon:"🔴",title:"PO-2026-0042 awaiting approval",
   detail:"Rajesh Kumar submitted PO to Coats India — ₹1,24,500 for 8 items. Requires Admin approval before dispatch.",
   module:"Procurement",ref:"PO-2026-0042",ts:Date.now()-900000,
   actions:["approve","reject","reply"],read:false,status:"unread"},
  {id:"NTF-00002",type:"warning",icon:"🟠",title:"RM-FAB-007 stock below reorder level",
   detail:"Current: 42 MTR · Reorder level: 100 MTR. Primary supplier: Vardhman Textiles. Lead time: 7 days.",
   module:"Inventory",ref:"RM-FAB-007",ts:Date.now()-7200000,
   actions:["view","reply"],read:false,status:"unread"},
  {id:"NTF-00003",type:"action", icon:"🔴",title:"Payment approval needed — ₹45,000",
   detail:"Invoice INV-0034 from Shree Enterprises. Due: 25-Feb-2026. Flagged by Finance for Admin approval.",
   module:"Finance",ref:"INV-0034",ts:Date.now()-86400000,
   actions:["approve","reject","reply"],read:false,status:"unread"},
  {id:"NTF-00004",type:"info",   icon:"🔵",title:"Work Order WO-0089 completed",
   detail:"Amit Singh marked WO-0089 complete. 240 pcs Polo Style 5249HP. Quality check pending assignment.",
   module:"Production",ref:"WO-0089",ts:Date.now()-9000000,
   actions:["view","reply"],read:true,status:"read"},
  {id:"NTF-00005",type:"system", icon:"⚪",title:"Daily GAS cache refresh complete",
   detail:"PropertiesService refreshed all 46 FK relations at 07:00. No errors. Next refresh: tomorrow 07:00.",
   module:"System",ref:"",ts:Date.now()-28800000,
   actions:["dismiss"],read:true,status:"read"},
];

const NOTIF_C = {action:"#ef4444",warning:"#f59e0b",info:"#0078D4",system:"#6b7280"};
const NOTIF_BG= {action:"rgba(239,68,68,.08)",warning:"rgba(245,158,11,.08)",info:"rgba(0,120,212,.08)",system:"rgba(107,114,128,.06)"};

// ─── DEFAULT SHORTCUTS (per-user, PropertiesService in GAS) ──────────────────
const SHORTCUTS_INIT = [
  {id:"sc1",icon:"📦",label:"New PO",        mod:"procurement",sub:"Procurement"},
  {id:"sc2",icon:"🏭",label:"WO-0089",       mod:"production", sub:"Production"},
  {id:"sc3",icon:"🏭",label:"Coats India",   mod:"masters",    sub:"Supplier"},
  {id:"sc4",icon:"🔬",label:"Pending QC",    mod:"quality",    sub:"Quality"},
];

// ─── CMD PALETTE SEARCH INDEX ─────────────────────────────────────────────────
const CMD_INDEX = [
  // Modules
  ...MODS.map(m=>({icon:m.icon,label:m.lbl,sub:m.desc,       group:"Modules",      id:m.id,  type:"module"})),
  // Quick actions
  {icon:"➕",label:"New Purchase Order",    sub:"Procurement → PO", group:"Quick Actions",id:"new-po",  type:"action"},
  {icon:"➕",label:"New Work Order",         sub:"Production → WO",  group:"Quick Actions",id:"new-wo",  type:"action"},
  {icon:"➕",label:"New GRN",               sub:"Procurement → GRN",group:"Quick Actions",id:"new-grn", type:"action"},
  {icon:"➕",label:"New Fabric Inspection", sub:"Quality → Fabric", group:"Quick Actions",id:"new-qc",  type:"action"},
  {icon:"🔍",label:"Search Suppliers",      sub:"Masters → Supplier",group:"Quick Actions",id:"sup-srch",type:"action"},
  {icon:"🔍",label:"Search Items",          sub:"Masters → Items",  group:"Quick Actions",id:"itm-srch",type:"action"},
  // Recent records
  {icon:"🧾",label:"PO-2026-0042",sub:"Coats India · ₹1,24,500 · Pending",    group:"Recent Records",id:"rec1",type:"record"},
  {icon:"🔧",label:"WO-0089",     sub:"5249HP · 240 pcs · Completed",          group:"Recent Records",id:"rec2",type:"record"},
  {icon:"🧪",label:"QC-0012",     sub:"LOT-089 · Fabric · Failed",             group:"Recent Records",id:"rec3",type:"record"},
  {icon:"📋",label:"STK-0034",    sub:"RM-FAB-007 · Transfer · Approved",      group:"Recent Records",id:"rec4",type:"record"},
  // Settings
  {icon:"⚙️",label:"Open Settings",         sub:"Workspace preferences",group:"Settings",id:"open-cfg",  type:"setting"},
  {icon:"🩶",label:"Switch to Light Grey",  sub:"Theme · Light Grey",   group:"Settings",id:"mode-lg",   type:"setting"},
  {icon:"🌙",label:"Switch to Midnight",    sub:"Theme · Midnight",     group:"Settings",id:"mode-mid",  type:"setting"},
  {icon:"🔷",label:"Switch to Slate",       sub:"Theme · Slate",        group:"Settings",id:"mode-slate",type:"setting"},
];

const ACTIVITY = [
  {icon:"📦",text:"PO-2026-0042 submitted to Coats India",  sub:"Rajesh Kumar · 14:08", col:"#E8690A"},
  {icon:"🔬",text:"Fabric QC failed — Lot LOT-089",         sub:"Priya Sharma · 13:45", col:"#BE123C"},
  {icon:"🏭",text:"Work Order WO-0089 started",             sub:"Amit Singh · 13:30",   col:"#0078D4"},
  {icon:"🗄️",text:"Stock transfer ST-0034 approved",       sub:"Ravi Verma · 12:55",   col:"#007C7C"},
  {icon:"💰",text:"Payment ₹45,000 approved",               sub:"Saurav · 12:00",       col:"#15803D"},
];

// ─── PROCUREMENT DATA ─────────────────────────────────────────────────────
const ITEM_IMGS = {
  "RM-FAB-001":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop&q=80",
  "RM-FAB-002":"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=80&h=80&fit=crop&q=80",
  "RM-FAB-003":"https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=80&h=80&fit=crop&q=80",
  "RM-FAB-004":"https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=80&h=80&fit=crop&q=80",
  "TRM-THD-001":"https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=80&h=80&fit=crop&q=80",
  "TRM-ZIP-001":"https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=80&h=80&fit=crop&q=80",
  "TRM-LBL-001":"https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=80&h=80&fit=crop&q=80",
  "CON-DYE-001":"https://images.unsplash.com/photo-1558618047-3b61c4b9c8d4?w=80&h=80&fit=crop&q=80",
  "PKG-PLY-001":"https://images.unsplash.com/photo-1605732562742-3023a888e56e?w=80&h=80&fit=crop&q=80",
};
const CAT_ICON = { Fabric:"🧵", Trim:"🪡", Chemical:"🧪", Packaging:"📦", Label:"🏷️" };
const CAT_CLR  = { Fabric:"#2563eb", Trim:"#7c3aed", Chemical:"#dc2626", Packaging:"#ea580c", Label:"#059669" };

const ITEMS = [
  { code:"RM-FAB-001", name:"Single Jersey 180 GSM 100% Cotton",  uom:"KG",   hsn:"6006", gst:12, cat:"Fabric" },
  { code:"RM-FAB-002", name:"Pique Fabric 220 GSM 65/35 PC",      uom:"KG",   hsn:"6006", gst:12, cat:"Fabric" },
  { code:"RM-FAB-003", name:"French Terry 280 GSM 100% Cotton",   uom:"KG",   hsn:"6006", gst:12, cat:"Fabric" },
  { code:"RM-FAB-004", name:"Fleece 320 GSM Poly Cotton",         uom:"KG",   hsn:"6006", gst:12, cat:"Fabric" },
  { code:"TRM-THD-001",name:"Coats Astra Sewing Thread 120/2",    uom:"CONE", hsn:"5402", gst:12, cat:"Trim" },
  { code:"TRM-ZIP-001",name:"YKK Nylon Zipper 6 inch Black",      uom:"PCS",  hsn:"9607", gst:18, cat:"Trim" },
  { code:"TRM-LBL-001",name:"Woven Main Label 5×3 cm",            uom:"PCS",  hsn:"5807", gst:12, cat:"Label" },
  { code:"CON-DYE-001",name:"Reactive Dye Red HE-3B",             uom:"KG",   hsn:"3204", gst:18, cat:"Chemical" },
  { code:"PKG-PLY-001",name:"Poly Bag 12×16 inch 40 Micron",      uom:"PCS",  hsn:"3923", gst:18, cat:"Packaging" },
];
const SUPPLIERS = [
  { code:"SUP-001", name:"Coats India Pvt Ltd",        city:"Bengaluru", gstin:"29AABCC1234F1Z5", credit:30, rating:5 },
  { code:"SUP-002", name:"YKK India Pvt Ltd",          city:"Mumbai",    gstin:"27AABCY5678G1Z2", credit:45, rating:5 },
  { code:"SUP-003", name:"Madura Fashion & Lifestyle", city:"Chennai",   gstin:"33AABCM9012H1Z8", credit:30, rating:4 },
  { code:"SUP-004", name:"Vardhman Textiles Ltd",      city:"Ludhiana",  gstin:"03AABCV3456I1Z1", credit:60, rating:4 },
  { code:"SUP-005", name:"Alok Industries Ltd",        city:"Surat",     gstin:"27AABCA7890J1Z4", credit:45, rating:3 },
];
const WH_LIST   = ["WH-FABRIC","WH-TRIM","WH-PKG","WH-CHEM","WH-FG"];
const SEASONS   = ["SS25","AW25","SS26","AW26","Year Round"];
const PO_TYPES  = ["Fabric","Trim","Packaging","Chemicals","Services","Assets"];
const PAY_TERMS = ["30 Days Credit","45 Days Credit","60 Days Credit","Advance 100%","50% Adv + 50% Del","Against LC"];
const OPEN_POS  = [
  { po:"PO-2026-0041", sup:"SUP-001", items:3, date:"18 Feb 2026" },
  { po:"PO-2026-0039", sup:"SUP-002", items:2, date:"15 Feb 2026" },
  { po:"PO-2026-0037", sup:"SUP-004", items:5, date:"12 Feb 2026" },
];
const DEMO_PO_LIST = [
  {id:"PO-2026-0042",supplier:"SUP-001",supName:"Coats India Pvt Ltd",date:"24 Feb 2026",type:"Trim",items:3,base:112500,gst:13500,total:126000,status:"Pending"},
  {id:"PO-2026-0041",supplier:"SUP-004",supName:"Vardhman Textiles Ltd",date:"18 Feb 2026",type:"Fabric",items:5,base:287000,gst:34440,total:321440,status:"Approved"},
  {id:"PO-2026-0040",supplier:"SUP-002",supName:"YKK India Pvt Ltd",date:"15 Feb 2026",type:"Trim",items:2,base:45000,gst:8100,total:53100,status:"Approved"},
  {id:"PO-2026-0039",supplier:"SUP-003",supName:"Madura Fashion",date:"12 Feb 2026",type:"Fabric",items:4,base:198000,gst:23760,total:221760,status:"Received"},
  {id:"PO-2026-0038",supplier:"SUP-005",supName:"Alok Industries Ltd",date:"10 Feb 2026",type:"Fabric",items:3,base:155000,gst:18600,total:173600,status:"Draft"},
];
const DEMO_GRN_LIST = [
  {id:"GRN-2026-0018",po:"PO-2026-0041",supplier:"SUP-004",supName:"Vardhman Textiles",date:"22 Feb 2026",items:5,recQty:520,accQty:510,status:"Accepted"},
  {id:"GRN-2026-0017",po:"PO-2026-0040",supplier:"SUP-002",supName:"YKK India",date:"20 Feb 2026",items:2,recQty:1000,accQty:985,status:"Partial"},
  {id:"GRN-2026-0016",po:"PO-2026-0039",supplier:"SUP-003",supName:"Madura Fashion",date:"18 Feb 2026",items:4,recQty:340,accQty:340,status:"Accepted"},
];

const uid = () => Math.random().toString(36).slice(2,9);
const mLine = () => ({ id:uid(), itemCode:"", qty:"", price:"", disc:"0", recQty:"", accQty:"", rolls:"", lot:"" });

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function aColor(e){const P=["#E8690A","#0078D4","#007C7C","#15803D","#7C3AED","#BE123C","#B45309","#0E7490","#6D28D9","#047857","#C2410C","#1D4ED8"];let h=0;for(let i=0;i<e.length;i++)h=e.charCodeAt(i)+((h<<5)-h);return P[Math.abs(h)%P.length];}
function ini(n){const p=n.trim().split(" ");return(p[0][0]+(p[1]?.[0]||p[0][1]||"")).toUpperCase();}
function ago(ts){const s=Math.floor((Date.now()-ts)/1000);if(s<60)return`${s}s`;if(s<3600)return`${Math.floor(s/60)}m`;if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`;}
function greet(){const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";}
function todayStr(){return new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}
function timeStr(){return new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});}
function fuzzy(q,s){if(!q)return true;return s.toLowerCase().includes(q.toLowerCase());}

// ─── CHIP ─────────────────────────────────────────────────────────────────────
function Chip({label,active,onClick,A,M}){
  return <button onClick={onClick} style={{padding:"5px 13px",border:`1.5px solid ${active?A.a:M.inputBd}`,borderRadius:20,background:active?A.a:M.inputBg,color:active?A.tx:M.textB,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>{label}</button>;
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
function Toggle({on,onChange,A,M}){
  return <div onClick={()=>onChange(!on)} style={{width:40,height:22,borderRadius:11,background:on?A.a:M.inputBd,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
    <div style={{position:"absolute",top:2,left:on?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
  </div>;
}

// ─── MODE PREVIEW CARD ────────────────────────────────────────────────────────
function ModeCard({m,active,A,onClick}){
  return(
    <div onClick={onClick} style={{width:"100%",border:`2px solid ${active?A.a:m.divider}`,borderRadius:8,overflow:"hidden",cursor:"pointer",background:active?A.al:"transparent",transition:"all .15s"}}>
      <div style={{height:56,background:m.bg,overflow:"hidden"}}>
        <div style={{height:9,background:m.shellBg,borderBottom:`1px solid ${m.shellBd}`,display:"flex",alignItems:"center",gap:2,padding:"0 4px"}}>
          <div style={{width:6,height:4,borderRadius:1,background:A.a}}/><div style={{width:12,height:2,borderRadius:1,background:m.textD}}/>
        </div>
        <div style={{display:"flex",height:47}}>
          <div style={{width:16,background:m.sidebarBg,borderRight:`1px solid ${m.sidebarBd}`,padding:"2px",display:"flex",flexDirection:"column",gap:1}}>
            {[0,1,2,3].map(i=><div key={i} style={{height:3,borderRadius:1,background:i===0?A.a:m.textD,opacity:i===0?1:.4}}/>)}
          </div>
          <div style={{flex:1,padding:"3px 4px",display:"flex",flexDirection:"column",gap:2}}>
            <div style={{display:"flex",gap:2}}>{[0,1,2,3].map(i=><div key={i} style={{flex:1,height:7,borderRadius:2,background:m.surfHigh,border:`1px solid ${m.divider}`}}/>)}</div>
            <div style={{height:20,borderRadius:2,background:m.surfHigh,border:`1px solid ${m.divider}`}}/>
          </div>
        </div>
      </div>
      <div style={{padding:"5px 6px",background:active?A.al:m.surfMid,display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:10}}>{m.lbl}</span>
        <span style={{fontSize:9,fontWeight:700,color:active?A.a:m.textB}}>{m.name}</span>
        {active&&<span style={{marginLeft:"auto",fontSize:7,fontWeight:900,color:A.a,letterSpacing:.5}}>ACTIVE</span>}
      </div>
    </div>
  );
}

function SDiv({label,M,first}){
  return <div style={{fontSize:9,fontWeight:900,letterSpacing:1.5,textTransform:"uppercase",color:M.textD,padding:first?"0 0 8px":"16px 0 8px",borderTop:first?"none":`1px solid ${M.divider}`,fontFamily:"inherit"}}>{label}</div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── NOTIFICATION PANEL ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function NotifPanel({notifs,setNotifs,M,A,uff,fz,onClose}){
  const [replyId,  setReplyId]  = useState(null);
  const [replyTxt, setReplyTxt] = useState("");
  const [expanded, setExpanded] = useState(null);

  const unread = notifs.filter(n=>!n.read).length;

  const markRead  = id => setNotifs(ns=>ns.map(n=>n.id===id?{...n,read:true,status:"read"}:n));
  const dismiss   = id => setNotifs(ns=>ns.filter(n=>n.id!==id));
  const approve   = id => { setNotifs(ns=>ns.map(n=>n.id===id?{...n,read:true,status:"actioned",actionTaken:"approve"}:n)); };
  const reject    = id => { setNotifs(ns=>ns.map(n=>n.id===id?{...n,read:true,status:"actioned",actionTaken:"reject"}:n)); };
  const sendReply = id => { if(!replyTxt.trim())return; setNotifs(ns=>ns.map(n=>n.id===id?{...n,read:true,status:"actioned",actionTaken:"reply",replyText:replyTxt}:n)); setReplyId(null); setReplyTxt(""); };
  const markAllRead = () => setNotifs(ns=>ns.map(n=>({...n,read:true,status:n.status==="unread"?"read":n.status})));

  const TYPE_L = {action:"ACTION REQUIRED",warning:"WARNING",info:"INFO",system:"SYSTEM"};

  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:498}}/>
      <div className="dd-anim" style={{
        position:"absolute",top:52,right:0,width:420,maxHeight:"calc(100vh - 80px)",
        background:M.dropBg,border:`1px solid ${M.divider}`,borderRadius:10,
        boxShadow:M.shadow,zIndex:499,display:"flex",flexDirection:"column",
        fontFamily:uff,overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${M.divider}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:fz,fontWeight:900,color:M.textA}}>🔔 Notifications</span>
              {unread>0&&<div style={{minWidth:20,height:20,borderRadius:10,background:"#ef4444",color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{unread}</div>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {unread>0&&<button onClick={markAllRead} style={{fontSize:9,fontWeight:700,color:A.a,background:"none",border:"none",cursor:"pointer",fontFamily:uff}}>Mark all read</button>}
              <button onClick={onClose} style={{width:26,height:26,borderRadius:5,border:`1px solid ${M.divider}`,background:M.surfMid,color:M.textC,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
          </div>
          {/* Filter tabs */}
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {[["All",notifs.length],["Unread",unread],["Action",notifs.filter(n=>n.type==="action").length]].map(([lbl,cnt])=>(
              <div key={lbl} style={{fontSize:9,fontWeight:700,color:M.textC,background:M.surfMid,border:`1px solid ${M.divider}`,borderRadius:12,padding:"2px 8px",cursor:"pointer",display:"flex",gap:4,alignItems:"center"}}>
                {lbl} {cnt>0&&<span style={{fontSize:8,fontWeight:900,color:M.textD}}>{cnt}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{overflowY:"auto",flex:1}}>
          {notifs.length===0&&(
            <div style={{padding:32,textAlign:"center",color:M.textD}}>
              <div style={{fontSize:32,marginBottom:8}}>🎉</div>
              <div style={{fontSize:12,fontWeight:700}}>All caught up!</div>
              <div style={{fontSize:10,marginTop:4}}>No notifications</div>
            </div>
          )}
          {notifs.map((n,i)=>{
            const isExp   = expanded===n.id;
            const isReply = replyId===n.id;
            const actioned= n.status==="actioned";
            const tc = NOTIF_C[n.type];
            const tbg= NOTIF_BG[n.type];
            return(
              <div key={n.id} style={{
                borderBottom:`1px solid ${M.divider}`,
                borderLeft:`3px solid ${actioned?M.divider:tc}`,
                background:n.read?M.surfHigh:tbg,
                opacity:actioned?.7:1,
                transition:"all .18s",
              }}>
                {/* Main row */}
                <div style={{padding:"11px 14px 8px",cursor:"pointer"}}
                  onClick={()=>{setExpanded(isExp?null:n.id);if(!n.read)markRead(n.id);}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
                    {/* Type dot */}
                    <div style={{width:8,height:8,borderRadius:"50%",background:actioned?M.textD:tc,flexShrink:0,marginTop:3}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:8,fontWeight:900,letterSpacing:.5,
                          background:actioned?M.badgeBg:tc+"20",color:actioned?M.textD:tc,
                          padding:"1px 5px",borderRadius:3,textTransform:"uppercase",flexShrink:0}}>
                          {actioned?`✓ ${n.actionTaken?.toUpperCase()||"DONE"}`:TYPE_L[n.type]}
                        </span>
                        <span style={{fontSize:8,fontFamily:"'IBM Plex Mono',monospace",color:M.textD,marginLeft:"auto",flexShrink:0}}>{ago(n.ts)}</span>
                        {!n.read&&<div style={{width:6,height:6,borderRadius:"50%",background:tc,flexShrink:0}}/>}
                      </div>
                      <div style={{fontSize:fz-1,fontWeight:n.read?600:800,color:M.textA,marginBottom:2,lineHeight:1.3}}>{n.title}</div>
                      <div style={{fontSize:9,color:M.textC}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",color:A.a,fontWeight:600}}>{n.module}</span>
                        {n.ref&&<> · <span style={{fontFamily:"'IBM Plex Mono',monospace"}}>{n.ref}</span></>}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExp&&(
                    <div style={{marginTop:8,padding:"8px 10px",background:M.surfMid,borderRadius:6,border:`1px solid ${M.divider}`,fontSize:11,color:M.textB,lineHeight:1.6}}>
                      {n.detail}
                      {n.replyText&&(
                        <div style={{marginTop:6,padding:"6px 8px",background:A.al,borderRadius:4,borderLeft:`2px solid ${A.a}`,fontSize:10,color:M.textA}}>
                          💬 <strong>Your reply:</strong> {n.replyText}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons row */}
                {!actioned&&(
                  <div style={{padding:"0 14px 10px",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    {n.actions.includes("approve")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();approve(n.id);}} style={{
                        padding:"4px 12px",borderRadius:5,border:"none",
                        background:"#15803D",color:"#fff",fontSize:10,fontWeight:800,
                        cursor:"pointer",fontFamily:uff,display:"flex",alignItems:"center",gap:4,transition:"filter .15s"
                      }}>✅ Approve</button>
                    )}
                    {n.actions.includes("reject")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();reject(n.id);}} style={{
                        padding:"4px 12px",borderRadius:5,border:"none",
                        background:"#ef4444",color:"#fff",fontSize:10,fontWeight:800,
                        cursor:"pointer",fontFamily:uff,display:"flex",alignItems:"center",gap:4,transition:"filter .15s"
                      }}>❌ Reject</button>
                    )}
                    {n.actions.includes("reply")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();setReplyId(isReply?null:n.id);setReplyTxt("");}} style={{
                        padding:"4px 12px",borderRadius:5,border:`1px solid ${M.divider}`,
                        background:isReply?A.al:M.surfMid,color:isReply?A.a:M.textB,fontSize:10,fontWeight:700,
                        cursor:"pointer",fontFamily:uff,display:"flex",alignItems:"center",gap:4,transition:"all .15s"
                      }}>💬 Reply</button>
                    )}
                    {n.actions.includes("view")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();markRead(n.id);setExpanded(n.id);}} style={{
                        padding:"4px 12px",borderRadius:5,border:`1px solid ${M.divider}`,
                        background:M.surfMid,color:M.textC,fontSize:10,fontWeight:700,
                        cursor:"pointer",fontFamily:uff,transition:"filter .15s"
                      }}>👁 View</button>
                    )}
                    {/* Open Record → deep link to actual sheet/record */}
                    {n.ref&&(
                      <button className="notif-action-btn"
                        onClick={e=>{
                          e.stopPropagation();
                          markRead(n.id);
                          // GAS: google.script.run.openRecord(n.module, n.ref, n.url)
                          // Prototype: show alert with target
                          alert(`GAS will open:\n\nModule: ${n.module}\nRecord: ${n.ref}\n\nIn live ERP → opens Google Sheet file, scrolls to row for ${n.ref}`);
                        }}
                        style={{
                          padding:"4px 12px",borderRadius:5,
                          border:`1.5px solid ${A.a}`,
                          background:A.al,color:A.a,fontSize:10,fontWeight:800,
                          cursor:"pointer",fontFamily:uff,
                          display:"flex",alignItems:"center",gap:5,
                          transition:"filter .15s",marginLeft:"auto",
                        }}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>{n.ref}</span>
                        <span>→ Open Record</span>
                      </button>
                    )}
                    {n.actions.includes("dismiss")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();dismiss(n.id);}} style={{
                        padding:"4px 10px",borderRadius:5,border:`1px solid ${M.divider}`,
                        background:"transparent",color:M.textD,fontSize:10,fontWeight:700,
                        cursor:"pointer",fontFamily:uff,marginLeft:"auto",transition:"filter .15s"
                      }}>✕ Dismiss</button>
                    )}
                  </div>
                )}

                {/* Reply input */}
                {isReply&&!actioned&&(
                  <div style={{padding:"0 14px 12px",display:"flex",gap:8,alignItems:"flex-end"}}>
                    <div style={{flex:1,background:M.inputBg,border:`1.5px solid ${A.a}`,borderRadius:7,padding:"7px 10px"}}>
                      <textarea
                        autoFocus
                        value={replyTxt}
                        onChange={e=>setReplyTxt(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendReply(n.id);}if(e.key==="Escape"){setReplyId(null);}}}
                        placeholder="Type your reply… (Enter to send, Shift+Enter for newline)"
                        style={{width:"100%",resize:"none",background:"transparent",border:"none",outline:"none",fontSize:11,color:M.textA,fontFamily:uff,lineHeight:1.5,minHeight:52}}
                      />
                    </div>
                    <button onClick={()=>sendReply(n.id)} style={{
                      padding:"8px 14px",borderRadius:7,border:"none",
                      background:A.a,color:"#fff",fontSize:11,fontWeight:800,
                      cursor:"pointer",fontFamily:uff,flexShrink:0,
                    }}>Send ↵</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{padding:"8px 16px",borderTop:`1px solid ${M.divider}`,background:M.surfMid,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:9,color:M.textD,fontFamily:"'IBM Plex Mono',monospace"}}>NTF sheet · FILE 1B · GAS-managed</span>
          <button style={{fontSize:10,fontWeight:700,color:A.a,background:"none",border:"none",cursor:"pointer",fontFamily:uff}}>View All →</button>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── CMD PALETTE (Ctrl+K) ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function CmdPalette({M,A,uff,fz,shortcuts,setShortcuts,onClose,onModSelect,onCfgOpen}){
  const [q, setQ]     = useState("");
  const [sel,setSel]  = useState(0);
  const inputRef      = useRef(null);

  useEffect(()=>{ inputRef.current?.focus(); },[]);

  const isPinned = id => shortcuts.some(s=>s.mod===id||s.id===id);
  const pin = (item) => {
    if(isPinned(item.id))return;
    setShortcuts(sc=>[...sc,{id:`sc${Date.now()}`,icon:item.icon,label:item.label,mod:item.id||item.mod||"",sub:item.group}]);
  };

  // Build filtered results grouped
  const filtered = CMD_INDEX.filter(c=>fuzzy(q,c.label+" "+c.sub+" "+c.group));
  const groups = [...new Set(filtered.map(c=>c.group))];

  // Flat index for keyboard nav
  const flat = filtered;
  const handleKey = e => {
    if(e.key==="ArrowDown"){e.preventDefault();setSel(s=>Math.min(s+1,flat.length-1));}
    if(e.key==="ArrowUp")  {e.preventDefault();setSel(s=>Math.max(s-1,0));}
    if(e.key==="Enter")    {e.preventDefault(); handleSelect(flat[sel]);}
    if(e.key==="Escape")   {onClose();}
  };
  const handleSelect = item => {
    if(!item)return;
    if(item.type==="module")  onModSelect(item.id);
    if(item.id==="open-cfg")  onCfgOpen();
    if(item.id.startsWith("mode-")) {} // theme switching could be wired here
    onClose();
  };

  let flatIdx = 0;

  return(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:800,background:"rgba(0,0,0,.5)",backdropFilter:"blur(3px)"}}/>
      {/* Palette */}
      <div className="cmd-anim" style={{
        position:"fixed",top:"18%",left:"50%",transform:"translateX(-50%)",
        width:580,maxWidth:"94vw",
        background:M.dropBg,borderRadius:12,border:`1px solid ${M.divider}`,
        boxShadow:`0 24px 60px rgba(0,0,0,.35)`,zIndex:801,overflow:"hidden",
        fontFamily:uff,
      }}>
        {/* Search input */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:`1px solid ${M.divider}`,background:M.shellBg}}>
          <span style={{fontSize:16,flexShrink:0}}>🔍</span>
          <input
            ref={inputRef}
            value={q} onChange={e=>{setQ(e.target.value);setSel(0);}}
            onKeyDown={handleKey}
            placeholder="Search modules, actions, records, settings…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",
              fontSize:fz+1,color:M.textA,fontFamily:uff,}}
          />
          <div style={{padding:"2px 7px",borderRadius:4,background:M.badgeBg,fontSize:9,fontWeight:700,color:M.textD,flexShrink:0,fontFamily:"'IBM Plex Mono',monospace"}}>ESC</div>
        </div>

        {/* Results */}
        <div style={{maxHeight:380,overflowY:"auto"}}>
          {filtered.length===0&&(
            <div style={{padding:24,textAlign:"center",color:M.textD,fontSize:11}}>No results for "{q}"</div>
          )}
          {groups.map(grp=>{
            const items = filtered.filter(c=>c.group===grp);
            return(
              <div key={grp}>
                <div style={{padding:"7px 16px 4px",fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1.2,textTransform:"uppercase",borderBottom:`1px solid ${M.divider}`,background:M.surfMid}}>{grp}</div>
                {items.map(item=>{
                  const idx = flatIdx++;
                  const isSelected = idx===sel;
                  const pinned = isPinned(item.id);
                  return(
                    <div key={item.id} onClick={()=>handleSelect(item)}
                      onMouseEnter={()=>setSel(idx)}
                      style={{
                        display:"flex",alignItems:"center",gap:12,padding:"9px 16px",
                        background:isSelected?A.al:M.surfHigh,
                        borderLeft:isSelected?`3px solid ${A.a}`:"3px solid transparent",
                        cursor:"pointer",borderBottom:`1px solid ${M.divider}`,
                        transition:"background .08s",
                      }}>
                      <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:fz-1,fontWeight:700,color:isSelected?A.a:M.textA}}>{item.label}</div>
                        <div style={{fontSize:9,color:M.textC}}>{item.sub}</div>
                      </div>
                      {/* Pin button */}
                      <button onClick={e=>{e.stopPropagation();pin(item);}} style={{
                        width:26,height:26,borderRadius:5,border:`1px solid ${pinned?A.a:M.divider}`,
                        background:pinned?A.al:"transparent",color:pinned?A.a:M.textD,
                        cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all .15s",flexShrink:0,
                      }} title={pinned?"Already in Quick Access":"Pin to Quick Access"}>{pinned?"⭐":"☆"}</button>
                      {isSelected&&<div style={{padding:"2px 6px",borderRadius:4,background:M.badgeBg,fontSize:9,fontWeight:700,color:M.textD,fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>↵</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{padding:"7px 16px",borderTop:`1px solid ${M.divider}`,background:M.surfMid,display:"flex",gap:14,alignItems:"center"}}>
          {[["↑↓","Navigate"],["↵","Open"],["☆","Pin to Quick Access"],["ESC","Close"]].map(([key,lbl])=>(
            <div key={key} style={{display:"flex",gap:5,alignItems:"center"}}>
              <span style={{fontSize:9,fontFamily:"'IBM Plex Mono',monospace",background:M.badgeBg,padding:"1px 5px",borderRadius:3,color:M.textB,fontWeight:700}}>{key}</span>
              <span style={{fontSize:9,color:M.textD}}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── SETTINGS PANEL (§11 — full spec) ────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function SettingsPanel({M,A,cfg,onApply,onClose}){
  const [draft,setDraft]=useState({...cfg});
  const set=(k,v)=>setDraft(d=>({...d,[k]:v}));
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:498,background:"rgba(0,0,0,.45)",backdropFilter:"blur(2px)"}}/>
      <div className="sp-anim" style={{position:"fixed",top:0,right:0,width:420,height:"100vh",background:M.dropBg,borderLeft:`1px solid ${M.divider}`,boxShadow:M.shadow,zIndex:499,display:"flex",flexDirection:"column",fontFamily:"inherit"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${M.divider}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:15,fontWeight:900,color:M.textA}}>⚙ Workspace Settings</div>
              <div style={{fontSize:10,color:M.textC,marginTop:2}}>Personalise your ERP interface</div>
            </div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:6,border:`1px solid ${M.divider}`,background:M.surfMid,color:M.textC,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"4px 20px 20px"}}>
          {/* Colour Mode */}
          <SDiv label="Colour Mode" M={M} first/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:4}}>
            {Object.values(MODES).map(m=><ModeCard key={m.id} m={m} active={draft.mode===m.id} A={ACCENTS[draft.accent]} onClick={()=>set("mode",m.id)}/>)}
          </div>
          {/* Accent */}
          <SDiv label="Accent Colour" M={M}/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {Object.values(ACCENTS).map(ac=>(
              <button key={ac.id} onClick={()=>set("accent",ac.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",border:`2px solid ${draft.accent===ac.id?ac.a:M.divider}`,borderRadius:7,background:draft.accent===ac.id?ac.al:M.surfMid,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:ac.a,flexShrink:0,border:`2px solid ${draft.accent===ac.id?M.textA:"transparent"}`,transition:"border .15s"}}/>
                <span style={{fontSize:11,fontWeight:700,color:M.textB,flex:1}}>{ac.lbl}</span>
                <div style={{width:40,height:12,borderRadius:6,background:ac.a,opacity:.25}}/>
                {draft.accent===ac.id&&<span style={{fontSize:8,fontWeight:900,color:ac.a,letterSpacing:.5}}>ACTIVE</span>}
              </button>
            ))}
          </div>
          {/* Typography & Density */}
          <SDiv label="Typography & Density" M={M}/>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:9,fontWeight:900,color:M.textC,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Font Size</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["small","Small (11px)"],["medium","Medium (13px)"],["large","Large (15px)"]].map(([v,l])=><Chip key={v} label={l} active={draft.fontSize===v} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("fontSize",v)}/>)}</div>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:900,color:M.textC,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Row Density</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["compact","Compact"],["comfortable","Comfortable"],["spacious","Spacious"]].map(([v,l])=><Chip key={v} label={l} active={draft.density===v} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("density",v)}/>)}</div>
          </div>
          {/* Font Family */}
          <SDiv label="Font Family" M={M}/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:900,color:M.textC,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>UI Body Font</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {UI_FONTS.map(f=>{const ac=ACCENTS[draft.accent];const active=draft.uiFont===f.id;return(
                <button key={f.id} onClick={()=>set("uiFont",f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:`2px solid ${active?ac.a:M.divider}`,borderRadius:7,background:active?ac.al:M.surfMid,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:f.family,fontSize:14,fontWeight:700,color:active?ac.a:M.textA,lineHeight:1.2}}>{f.name}</div>
                    <div style={{fontFamily:f.family,fontSize:10,color:M.textC,marginTop:2}}>The quick brown fox — ERP data entry</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:8,fontWeight:800,color:M.textD,letterSpacing:.5}}>{f.tag}</div>
                    {active&&<div style={{fontSize:8,fontWeight:900,color:ac.a,marginTop:2,letterSpacing:.5}}>ACTIVE</div>}
                  </div>
                </button>
              );})}
            </div>
          </div>
          <div style={{marginBottom:4}}>
            <div style={{fontSize:9,fontWeight:900,color:M.textC,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>Data & Codes Font (Monospace)</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {DATA_FONTS.map(f=>{const ac=ACCENTS[draft.accent];const active=draft.dataFont===f.id;return(
                <button key={f.id} onClick={()=>set("dataFont",f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:`2px solid ${active?ac.a:M.divider}`,borderRadius:7,background:active?ac.al:M.surfMid,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:f.family,fontSize:13,fontWeight:600,color:active?ac.a:M.textA,lineHeight:1.2}}>{f.name}</div>
                    <div style={{fontFamily:f.family,fontSize:10,color:M.textC,marginTop:2}}>PO-2026-0042 · Rs.48,500 · GST 18%</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:8,fontWeight:800,color:M.textD,letterSpacing:.5}}>{f.tag}</div>
                    {active&&<div style={{fontSize:8,fontWeight:900,color:ac.a,marginTop:2,letterSpacing:.5}}>ACTIVE</div>}
                  </div>
                </button>
              );})}
            </div>
          </div>
          {/* Table Style */}
          <SDiv label="Table Style" M={M}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["striped","Striped"],["bordered","Bordered"],["clean","Clean"]].map(([v,l])=><Chip key={v} label={l} active={draft.tblStyle===v} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("tblStyle",v)}/>)}</div>
          <div style={{marginTop:10,border:`1px solid ${M.divider}`,borderRadius:5,overflow:"hidden"}}>
            {["Header","Row 1","Row 2","Row 3"].map((lbl,i)=>{
              const isH=i===0; const bg=isH?M.tblHead:draft.tblStyle==="striped"?(i%2===1?M.tblEven:M.tblOdd):M.surfHigh;
              return <div key={i} style={{padding:"5px 10px",background:bg,borderBottom:`1px solid ${M.divider}`,display:"flex",gap:8,alignItems:"center"}}>
                <div style={{width:24,height:4,borderRadius:2,background:isH?ACCENTS[draft.accent].a:M.textD,opacity:.4}}/>
                <div style={{flex:1,height:4,borderRadius:2,background:M.textD,opacity:.3}}/>
                <div style={{width:40,height:4,borderRadius:2,background:M.textD,opacity:.25}}/>
              </div>;
            })}
          </div>
          {/* Line Item View */}
          <SDiv label="Line Item View" M={M}/>
          <div style={{display:"flex",gap:6}}>{[["table","📋 Table"],["cards","🃏 Cards"]].map(([v,l])=><Chip key={v} label={l} active={draft.lineView===v} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("lineView",v)}/>)}</div>
          {/* Sidebar Width */}
          <SDiv label="Sidebar Width" M={M}/>
          <div style={{display:"flex",gap:6}}>{SW_PRESETS.map(w=><Chip key={w} label={`${w}px`} active={draft.sbWidth===w} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("sbWidth",w)}/>)}</div>
          <div style={{marginTop:8,fontSize:10,color:M.textC}}>Drag the sidebar edge to resize manually.</div>
          {/* Display Toggles */}
          <SDiv label="Display Toggles" M={M}/>
          {[["showStatusBar","Show Status Bar","Totals bar at the bottom of every module"],["showThumbs","Show Thumbnails","Item image thumbnails in search dropdowns & tables"],["showRowNums","Show Row Numbers","# column with sequential row numbers in tables"],["showCatBadge","Show Category Badges","Coloured category pills on item rows"],["compactSide","Compact Sidebar","Show icons only — no labels (saves space)"]].map(([key,label,sub],i,arr)=>(
            <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${M.divider}`:"none"}}>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:M.textA}}>{label}</div><div style={{fontSize:10,color:M.textC,marginTop:2}}>{sub}</div></div>
              <Toggle on={!!draft[key]} onChange={v=>set(key,v)} A={ACCENTS[draft.accent]} M={M}/>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{padding:"14px 20px",borderTop:`1px solid ${M.divider}`,background:M.surfMid,flexShrink:0,display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>setDraft({...DEFAULTS})} style={{width:"100%",padding:"8px",borderRadius:6,border:`1px solid ${M.divider}`,background:"transparent",color:M.textC,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>↩ Reset Defaults</button>
          <button onClick={()=>{onApply(draft);onClose();}} style={{width:"100%",padding:"9px",borderRadius:6,border:"none",background:ACCENTS[draft.accent].a,color:"#fff",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>✓ Apply & Close</button>
        </div>
      </div>
    </>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Av({user,isSelf,M,A,uff}){
  const [hov,setHov]=useState(false);
  const dot=user.status==="active"?"#22c55e":user.status==="idle"?"#f59e0b":"#6b7280";
  return(
    <div style={{position:"relative"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{width:28,height:28,borderRadius:"50%",background:isSelf?A.a:aColor(user.email),color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,position:"relative",border:`2px solid ${isSelf?A.a:"transparent"}`,boxShadow:isSelf?`0 0 0 2px ${A.al},0 2px 8px rgba(0,0,0,.2)`:"0 1px 4px rgba(0,0,0,.18)",transform:hov?"scale(1.12)":"scale(1)",transition:"transform .15s",fontFamily:uff}}>
        {ini(user.name)}
        {!isSelf&&<div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:dot,border:`1.5px solid ${M.shellBg}`}}/>}
      </div>
      {hov&&(
        <div className="dd-anim" style={{position:"absolute",top:36,right:0,width:240,background:M.dropBg,border:`1px solid ${M.divider}`,borderRadius:8,boxShadow:M.shadow,zIndex:9999,padding:12,fontFamily:uff}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:isSelf?A.a:aColor(user.email),color:"#fff",fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ini(user.name)}</div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:12,fontWeight:800,color:M.textA}}>{user.name}</span>
                {isSelf&&<span style={{fontSize:8,fontWeight:900,background:A.a,color:"#fff",borderRadius:3,padding:"1px 5px"}}>YOU</span>}
              </div>
              <div style={{fontSize:9,color:M.textC,marginTop:1}}>{user.email}</div>
            </div>
          </div>
          <div style={{borderTop:`1px solid ${M.divider}`,paddingTop:8,display:"flex",flexDirection:"column",gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:dot}}/><span style={{fontSize:10,color:M.textB,fontWeight:600}}>{user.status==="active"?"Active now":"Idle"}</span></div>
            <div style={{fontSize:10,color:M.textC}}>{user.module} › <span style={{fontFamily:"'IBM Plex Mono',monospace",color:M.textB}}>{user.page}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
              <span style={{fontSize:8,fontWeight:900,padding:"2px 5px",borderRadius:3,background:ROLE_C[user.role]+"22",color:ROLE_C[user.role],letterSpacing:.5}}>{ROLE_K[user.role]}</span>
              <span style={{fontSize:9,color:M.textD}}>{ago(user.ts)} ago</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ─── ITEM SEARCH (inline in table rows) ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function ItemSearch({ value, onChange, M, A, fz, py:pyV, showThumbs }) {
  const [q, setQ]       = useState("");
  const [open, setOpen] = useState(false);
  const [errs, setErrs] = useState({});
  const ref = useRef(null);
  const selItem = ITEMS.find(i => i.code === value);
  const filtered = q.length >= 1
    ? ITEMS.filter(i => i.code.toLowerCase().includes(q.toLowerCase()) || i.name.toLowerCase().includes(q.toLowerCase()))
    : ITEMS;
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const imgOf = code => ITEM_IMGS[code] && !errs[code];
  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", border:`1px solid ${open ? A.a : M.inputBd}`, borderRadius:3, background:M.inputBg, overflow:"hidden", transition:"border-color .15s", boxShadow: open ? `0 0 0 2px ${A.al}` : "none" }}>
        {showThumbs && selItem && !open && (
          <div style={{ width:28, height:28, flexShrink:0, borderRight:`1px solid ${M.divider}`, overflow:"hidden", background:M.surfMid, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {imgOf(selItem.code) ? <img src={ITEM_IMGS[selItem.code]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setErrs(p=>({...p,[selItem.code]:true}))} /> : <span style={{ fontSize:14 }}>{CAT_ICON[selItem.cat]}</span>}
          </div>
        )}
        <input
          style={{ flex:1, padding:`${pyV}px 9px`, border:"none", background:"transparent", color:M.textA, fontSize:fz, fontFamily:"'Nunito Sans',sans-serif", outline:"none" }}
          placeholder={selItem && !open ? selItem.name : "Search code / name…"}
          value={open ? q : ""}
          onFocus={() => setOpen(true)}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
        />
        {value && !open && <button onClick={() => { onChange(""); setQ(""); }} style={{ border:"none", background:"none", color:M.textD, cursor:"pointer", padding:"0 8px", fontSize:16, lineHeight:1 }}>×</button>}
        <button onClick={() => setOpen(o => !o)} style={{ border:"none", background:M.surfMid, color:M.textC, cursor:"pointer", padding:"0 10px", height:"100%", fontSize:10, borderLeft:`1px solid ${M.divider}` }}>▾</button>
      </div>
      {open && (
        <div className="dd-anim" style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:9999, background:M.dropBg, border:`1px solid ${M.inputBd}`, borderRadius:4, boxShadow:M.shadow, maxHeight:300, overflowY:"auto" }}>
          {filtered.length === 0
            ? <div style={{ padding:14, color:M.textD, fontSize:12 }}>No items match "{q}"</div>
            : filtered.map(it => (
              <div key={it.code} onClick={() => { onChange(it.code); setQ(""); setOpen(false); }}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 12px", cursor:"pointer", borderBottom:`1px solid ${M.divider}`, background:M.dropBg, transition:"background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = M.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = M.dropBg}>
                {showThumbs && (
                  <div style={{ width:34, height:34, borderRadius:3, overflow:"hidden", flexShrink:0, background:M.surfMid, border:`1px solid ${M.divider}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {imgOf(it.code) ? <img src={ITEM_IMGS[it.code]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"} /> : <span style={{ fontSize:18 }}>{CAT_ICON[it.cat]}</span>}
                  </div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:fz-1, fontWeight:700, color:M.textA, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{it.name}</div>
                  <div style={{ fontSize:10, color:M.textC, marginTop:1 }}>{it.code} · {it.uom} · HSN {it.hsn} · GST {it.gst}%</div>
                </div>
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99, background:`${CAT_CLR[it.cat]}20`, color:CAT_CLR[it.cat], fontWeight:800, flexShrink:0 }}>{it.cat}</span>
              </div>
            ))}
        </div>
      )}
      {selItem && !open && (
        <div className="sc-anim" style={{ marginTop:5, display:"flex", alignItems:"center", gap:9, padding:"7px 10px", background:A.al, border:`1px solid ${A.a}40`, borderRadius:3, borderLeft:`3px solid ${A.a}` }}>
          {showThumbs && (
            <div style={{ width:38, height:38, borderRadius:3, overflow:"hidden", flexShrink:0, background:M.surfMid, border:`1px solid ${M.divider}` }}>
              {imgOf(selItem.code) ? <img src={ITEM_IMGS[selItem.code]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={()=>setErrs(p=>({...p,[selItem.code]:true}))} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{CAT_ICON[selItem.cat]}</div>}
            </div>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:fz-1, fontWeight:800, color:M.textA }}>{selItem.name}</div>
            <div style={{ fontSize:10, color:M.textB, marginTop:1 }}>{selItem.code} · {selItem.uom} · HSN {selItem.hsn} · GST {selItem.gst}%</div>
          </div>
          <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:CAT_CLR[selItem.cat], color:"#fff", fontWeight:800 }}>{selItem.cat}</span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ─── PROCUREMENT MODULE ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function Procurement({ M, A, cfg, fz, dff }) {
  const uff = uiFF(cfg.uiFont);
  const pyV = PY_MAP[cfg.density];
  const sp  = cfg.compactSide ? pyV - 2 : pyV;

  // ─ View state
  const [view, setView]   = useState("list");  // list | form
  const [sub, setSub]     = useState("PO");    // PO | GRN
  const [editId, setEditId] = useState(null);

  // ─ Form state
  const [lines, setLines] = useState([mLine(), mLine()]);
  const [supplier, setSupplier] = useState("");
  const [season, setSeason]     = useState("SS26");
  const [poType, setPoType]     = useState("");
  const [payTerms, setPayTerms] = useState("");
  const [delivDate, setDelivDate] = useState("");
  const [poDate, setPoDate]     = useState(new Date().toISOString().split("T")[0]);
  const [grnDate, setGrnDate]   = useState(new Date().toISOString().split("T")[0]);
  const [vehicle, setVehicle]   = useState("");
  const [dcNo, setDcNo]         = useState("");
  const [wh, setWh]             = useState("");
  const [poRef, setPoRef]       = useState("");
  const [openSec, setOpenSec]   = useState(["doc","supplier","terms"]);
  const [isDirty, setIsDirty]   = useState(false);

  // ─ List state
  const [sortBy, setSortBy]     = useState(null);
  const [sortDir, setSortDir]   = useState("desc");
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchQ, setSearchQ]   = useState("");

  // ─ Modals
  const [showSavePreview, setShowSavePreview] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showExport, setShowExport]   = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [toastMsg, setToastMsg]       = useState(null);

  // ─ Command Panel drag
  const [cpW, setCpW]       = useState(340);
  const [cpDrag, setCpDrag] = useState(false);
  const onCpDragStart = useCallback(e => {
    e.preventDefault(); setCpDrag(true);
    const x0 = e.clientX, w0 = cpW;
    const mv = ev => setCpW(Math.max(220, Math.min(580, w0 + (ev.clientX - x0))));
    const up = () => { setCpDrag(false); window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
  }, [cpW]);

  const sup = SUPPLIERS.find(s => s.code === supplier);
  const toggleSec = id => setOpenSec(o => o.includes(id) ? o.filter(x=>x!==id) : [...o, id]);

  // ─ Line operations
  const addLine = () => { setLines(l => [...l, mLine()]); setIsDirty(true); };
  const remLine = id  => { setLines(l => l.filter(x => x.id !== id)); setIsDirty(true); };
  const updLine = (id, f, v) => { setLines(l => l.map(x => x.id === id ? {...x, [f]:v} : x)); setIsDirty(true); };

  // ─ Totals
  const tBase = lines.reduce((s,l) => s + (parseFloat(l.qty)||0)*(parseFloat(l.price)||0)*(1-(parseFloat(l.disc)||0)/100), 0);
  const tGst  = lines.reduce((s,l) => { const it=ITEMS.find(i=>i.code===l.itemCode); return s+(it?(parseFloat(l.qty)||0)*(parseFloat(l.price)||0)*(1-(parseFloat(l.disc)||0)/100)*(it.gst/100):0); }, 0);
  const fmtINR = v => `₹ ${v.toLocaleString("en-IN",{minimumFractionDigits:2})}`;

  // ─ Input styles
  const inp = { border:`1px solid ${M.inputBd}`, borderRadius:3, background:M.inputBg, color:M.textA, fontSize:fz, fontFamily:"'Nunito Sans',sans-serif", padding:`${sp}px 9px`, width:"100%", outline:"none", transition:"border-color .15s" };
  const selS = { ...inp, cursor:"pointer" };
  const lbl = { display:"block", fontSize:9, fontWeight:900, color:M.textC, marginBottom:4, fontFamily:"'Nunito Sans',sans-serif", letterSpacing:.5, textTransform:"uppercase" };

  // ─ New PO / GRN
  const handleNew = () => {
    if (isDirty) { setShowUnsaved(true); return; }
    setView("form"); setEditId(null); setLines([mLine(), mLine()]);
    setSupplier(""); setPoType(""); setPayTerms(""); setDelivDate(""); setVehicle(""); setDcNo(""); setWh(""); setPoRef("");
    setPoDate(new Date().toISOString().split("T")[0]);
    setGrnDate(new Date().toISOString().split("T")[0]);
    setIsDirty(false);
  };
  const handleBack = () => {
    if (isDirty) { setShowUnsaved(true); return; }
    setView("list"); setEditId(null); setIsDirty(false);
  };

  // ─ Toast helper
  const toast = msg => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  // ─ Filtered list
  const listData = sub === "PO" ? DEMO_PO_LIST : DEMO_GRN_LIST;
  let filtered = listData.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return r.id.toLowerCase().includes(q) || (r.supName||"").toLowerCase().includes(q);
    }
    return true;
  });
  if (sortBy) {
    filtered = [...filtered].sort((a,b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const STATUS_C = { Pending:"#f59e0b", Approved:"#22c55e", Received:"#0078D4", Draft:"#6b7280", Accepted:"#22c55e", Partial:"#f59e0b" };

  // ─ Accordion sub-component
  const Accordion = ({ id, icon, title, badge, children }) => {
    const isOpen = openSec.includes(id);
    return (
      <div style={{ borderBottom:`1px solid ${M.sidebarBd}` }}>
        <button onClick={() => toggleSec(id)} style={{ width:"100%", padding:`${sp+2}px 16px`, border:"none", background: isOpen ? `${A.a}12` : M.sidebarBg, display:"flex", alignItems:"center", gap:8, cursor:"pointer", borderLeft:`3px solid ${isOpen ? A.a : "transparent"}`, transition:"all .15s" }}>
          <span style={{ fontSize:14 }}>{icon}</span>
          <span style={{ flex:1, textAlign:"left", fontSize:fz-1, fontWeight:800, color: isOpen ? A.a : M.textB, fontFamily:uff }}>{title}</span>
          {badge && <span style={{ fontSize:9, padding:"1px 7px", borderRadius:9, background:M.badgeBg, color: isOpen ? A.a : M.textC, fontWeight:700 }}>{badge}</span>}
          <span style={{ fontSize:9, color:M.textD, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition:"transform .2s", display:"inline-block" }}>▾</span>
        </button>
        {isOpen && <div className="dd-anim" style={{ padding:`${sp}px 16px ${sp+6}px`, background:M.surfHigh }}>{children}</div>}
      </div>
    );
  };

  // ─ Table header cell
  const TH = ({ children, right, w }) => (
    <th style={{ padding:`${pyV}px 8px`, textAlign:right?"right":"left", fontSize:10, fontWeight:900, color:M.textC, fontFamily:uff, letterSpacing:.4, whiteSpace:"nowrap", borderBottom:`2px solid ${A.a}50`, background:M.tblHead, width:w }}>{children}</th>
  );

  // ─ Auto-filled cell
  const autoCell = (val, hasItem) => (
    <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top", paddingTop:pyV+4 }}>
      <div style={{ padding:"3px 8px", background: hasItem ? A.al : M.surfMid, color: hasItem ? A.a : M.textD, borderRadius:3, fontSize:10, fontWeight:700, textAlign:"center", border:`1px solid ${hasItem ? `${A.a}30` : M.divider}`, fontFamily:dff, whiteSpace:"nowrap" }}>{val}</div>
    </td>
  );

  // ═══════════════════════════════════════════════════════════════
  // ─── LIST VIEW ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (view === "list") {
    const statuses = [...new Set(listData.map(r => r.status))];
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:M.bg }}>
        {/* Sub-toolbar */}
        <div style={{ height:44, flexShrink:0, background:M.surfHigh, borderBottom:`1px solid ${M.divider}`, display:"flex", alignItems:"center", padding:"0 14px", gap:8 }}>
          {/* PO/GRN toggle */}
          <div style={{ display:"flex", gap:2, background:M.surfLow, border:`1px solid ${M.divider}`, borderRadius:5, padding:2 }}>
            {[{id:"PO",l:"Purchase Orders"},{id:"GRN",l:"Goods Receipt"}].map(m => (
              <button key={m.id} onClick={() => { setSub(m.id); setFilterStatus(null); setSearchQ(""); }} style={{ padding:"4px 11px", border:"none", borderRadius:4, cursor:"pointer", background: sub===m.id ? A.a : "transparent", color: sub===m.id ? A.tx : M.textB, fontSize:10, fontWeight:800, fontFamily:uff, transition:"all .15s" }}>{m.l}</button>
            ))}
          </div>
          <div style={{flex:1}}/>
          {/* Search */}
          <div style={{ display:"flex", alignItems:"center", border:`1px solid ${M.inputBd}`, borderRadius:5, background:M.inputBg, overflow:"hidden", width:200 }}>
            <span style={{ padding:"0 8px", fontSize:12, color:M.textD }}>🔍</span>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={`Search ${sub}s…`} style={{ flex:1, border:"none", background:"transparent", color:M.textA, fontSize:fz-1, padding:"5px 8px 5px 0", outline:"none", fontFamily:uff }} />
          </div>
          <button onClick={handleNew} style={{ padding:"5px 14px", border:`1.5px solid ${A.a}`, borderRadius:5, background:A.al, color:A.a, fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:uff }}>
            + New {sub}
          </button>
        </div>

        {/* Table control bar */}
        <div style={{ padding:"6px 14px", background:M.surfMid, borderBottom:`1px solid ${M.divider}`, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          {/* Filter pills */}
          <span style={{ fontSize:9, fontWeight:900, color:M.textD, letterSpacing:.5 }}>🔽 FILTER</span>
          <div style={{ display:"flex", gap:4 }}>
            <button onClick={() => setFilterStatus(null)} style={{ padding:"3px 9px", borderRadius:12, border:`1px solid ${!filterStatus?A.a:M.inputBd}`, background:!filterStatus?A.a:M.inputBg, color:!filterStatus?A.tx:M.textB, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:uff }}>All ({listData.length})</button>
            {statuses.map(st => (
              <button key={st} onClick={() => setFilterStatus(filterStatus===st?null:st)} style={{ padding:"3px 9px", borderRadius:12, border:`1px solid ${filterStatus===st?STATUS_C[st]:M.inputBd}`, background:filterStatus===st?`${STATUS_C[st]}18`:M.inputBg, color:filterStatus===st?STATUS_C[st]:M.textB, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:uff }}>{st} ({listData.filter(r=>r.status===st).length})</button>
            ))}
          </div>
          <div style={{ width:1, height:16, background:M.divider }}/>
          {/* Sort */}
          <span style={{ fontSize:9, fontWeight:900, color:M.textD, letterSpacing:.5 }}>↕️ SORT</span>
          <select value={sortBy||""} onChange={e=>setSortBy(e.target.value||null)} style={{ padding:"3px 8px", borderRadius:4, border:`1px solid ${M.inputBd}`, background:M.inputBg, color:M.textB, fontSize:9, fontWeight:700, fontFamily:uff, cursor:"pointer" }}>
            <option value="">None</option>
            <option value="date">Date</option>
            <option value="total">Total</option>
            <option value="status">Status</option>
          </select>
          {sortBy && <button onClick={() => setSortDir(d => d==="asc"?"desc":"asc")} style={{ padding:"3px 6px", borderRadius:4, border:`1px solid ${M.inputBd}`, background:M.inputBg, color:M.textB, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:uff }}>{sortDir==="asc"?"↑ Asc":"↓ Desc"}</button>}
          <div style={{flex:1}}/>
          <span style={{ fontSize:10, color:M.textC, fontFamily:dff }}>{filtered.length} record{filtered.length!==1?"s":""}</span>
        </div>

        {/* Table */}
        <div style={{ flex:1, overflowY:"auto", overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
            <thead>
              <tr>
                <th style={{ padding:`${pyV}px 12px`, textAlign:"left", fontSize:10, fontWeight:900, color:M.textC, letterSpacing:.4, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff, width:40 }}>#</th>
                <th style={{ padding:`${pyV}px 8px`, textAlign:"left", fontSize:10, fontWeight:900, color:M.textC, letterSpacing:.4, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>{sub} No</th>
                {sub==="GRN"&&<th style={{ padding:`${pyV}px 8px`, textAlign:"left", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Against PO</th>}
                <th style={{ padding:`${pyV}px 8px`, textAlign:"left", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Supplier</th>
                <th style={{ padding:`${pyV}px 8px`, textAlign:"left", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Date</th>
                {sub==="PO"&&<th style={{ padding:`${pyV}px 8px`, textAlign:"left", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Type</th>}
                <th style={{ padding:`${pyV}px 8px`, textAlign:"center", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Items</th>
                {sub==="PO"&&<th style={{ padding:`${pyV}px 8px`, textAlign:"right", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Total</th>}
                {sub==="GRN"&&<>
                  <th style={{ padding:`${pyV}px 8px`, textAlign:"right", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Received</th>
                  <th style={{ padding:`${pyV}px 8px`, textAlign:"right", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Accepted</th>
                </>}
                <th style={{ padding:`${pyV}px 8px`, textAlign:"center", fontSize:10, fontWeight:900, color:M.textC, borderBottom:`2px solid ${A.a}50`, background:M.tblHead, fontFamily:uff }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const rowBg = cfg.tblStyle==="striped" ? (i%2===0 ? M.tblEven : M.tblOdd) : M.surfHigh;
                return (
                  <tr key={r.id} style={{ background:rowBg, cursor:"pointer", transition:"background .1s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg}
                    onMouseLeave={e=>e.currentTarget.style.background=rowBg}
                    onClick={() => { setEditId(r.id); setView("form"); }}>
                    <td style={{ padding:`${pyV+2}px 12px`, borderBottom:`1px solid ${M.divider}`, color:A.a, fontWeight:900, fontSize:11, fontFamily:dff }}>{String(i+1).padStart(2,"0")}</td>
                    <td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, fontWeight:800, color:M.textA, fontFamily:dff, fontSize:fz-1 }}>{r.id}</td>
                    {sub==="GRN"&&<td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, fontFamily:dff, fontSize:fz-1, color:M.textB }}>{r.po}</td>}
                    <td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, fontSize:fz-1, color:M.textB }}>{r.supName}</td>
                    <td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, fontSize:fz-2, color:M.textC }}>{r.date}</td>
                    {sub==="PO"&&<td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}` }}>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99, background:M.badgeBg, color:M.textB, fontWeight:700 }}>{r.type}</span>
                    </td>}
                    <td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, textAlign:"center", fontFamily:dff, fontWeight:700, color:M.textB, fontSize:fz-1 }}>{r.items}</td>
                    {sub==="PO"&&<td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, textAlign:"right", fontFamily:dff, fontWeight:800, color:M.textA, fontSize:fz-1 }}>{fmtINR(r.total)}</td>}
                    {sub==="GRN"&&<>
                      <td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, textAlign:"right", fontFamily:dff, fontWeight:700, color:M.textB, fontSize:fz-1 }}>{r.recQty}</td>
                      <td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, textAlign:"right", fontFamily:dff, fontWeight:700, color:r.accQty<r.recQty?"#ef4444":M.textB, fontSize:fz-1 }}>{r.accQty}</td>
                    </>}
                    <td style={{ padding:`${pyV+2}px 8px`, borderBottom:`1px solid ${M.divider}`, textAlign:"center" }}>
                      <span style={{ fontSize:9, padding:"2px 8px", borderRadius:10, background:`${STATUS_C[r.status]}18`, color:STATUS_C[r.status], fontWeight:800, border:`1px solid ${STATUS_C[r.status]}40` }}>{r.status}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={12} style={{ padding:60, textAlign:"center", color:M.textD, fontSize:13 }}>No {sub}s match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Status bar */}
        {cfg.showStatusBar && (
          <div style={{ height:28, flexShrink:0, background:M.statusBg, borderTop:`1px solid ${M.sidebarBd}`, display:"flex", alignItems:"center", padding:"0 14px", gap:16, fontSize:10, fontFamily:dff }}>
            <span style={{ fontSize:8, fontWeight:900, color:M.textD, letterSpacing:1 }}>RECORDS</span>
            <span style={{ fontSize:11, fontWeight:900, color:M.textB }}>{filtered.length}</span>
            <div style={{ width:1, height:12, background:M.divider }}/>
            {sub==="PO"&&<>
              <span style={{ fontSize:8, fontWeight:900, color:M.textD, letterSpacing:1 }}>TOTAL VALUE</span>
              <span style={{ fontSize:11, fontWeight:900, color:A.a }}>{fmtINR(listData.reduce((s,r)=>s+(r.total||0),0))}</span>
              <div style={{ width:1, height:12, background:M.divider }}/>
            </>}
            <span style={{ fontSize:8, fontWeight:900, color:M.textD, letterSpacing:1 }}>PENDING</span>
            <span style={{ fontSize:11, fontWeight:900, color:"#f59e0b" }}>{listData.filter(r=>r.status==="Pending"||r.status==="Draft").length}</span>
            <div style={{flex:1}}/>
            <span style={{ fontSize:9, color:M.textD }}>CC ERP · FILE-02 · PROCUREMENT · {sub} LIST · {new Date().toLocaleDateString("en-IN")}</span>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ─── FORM VIEW ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

      {/* ── COMMAND PANEL ──────────────────────────────────────── */}
      <div style={{ width:cpW, minWidth:cpW, maxWidth:cpW, display:"flex", flexDirection:"column", background:M.sidebarBg, borderRight:`1px solid ${M.sidebarBd}`, overflow:"hidden", flexShrink:0, transition:cpDrag?"none":"width .2s" }}>

        {/* Panel label */}
        <div style={{ padding:"5px 16px", background:M.surfMid, borderBottom:`1px solid ${M.sidebarBd}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:9, fontWeight:900, letterSpacing:1.5, color:M.textD, textTransform:"uppercase" }}>Command Panel · {sub}</span>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:9, color:M.textD }}>{cpW}px</span>
            <button onClick={handleBack} style={{ padding:"2px 8px", borderRadius:3, border:`1px solid ${M.inputBd}`, background:M.inputBg, color:M.textC, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:uff }}>← Back</button>
          </div>
        </div>

        {/* PO/GRN toggle */}
        <div style={{ padding:"8px 16px", borderBottom:`1px solid ${M.sidebarBd}`, display:"flex", gap:4 }}>
          {[{id:"PO",l:"Purchase Order"},{id:"GRN",l:"Goods Receipt"}].map(m => (
            <button key={m.id} onClick={() => { if (isDirty) { setShowUnsaved(true); return; } setSub(m.id); setLines([mLine(),mLine()]); setIsDirty(false); }} style={{ flex:1, padding:"5px", border:"none", borderRadius:4, cursor:"pointer", background: sub===m.id ? A.a : M.surfMid, color: sub===m.id ? A.tx : M.textB, fontSize:10, fontWeight:800, fontFamily:uff, transition:"all .15s" }}>{m.l}</button>
          ))}
        </div>

        {/* Accordion sections */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {/* Doc Info */}
          <Accordion id="doc" icon="📋" title="Document Info">
            <div style={{ display:"grid", gap:9 }}>
              <div>
                <span style={lbl}>Reference #</span>
                <input style={{ ...inp, color:A.a, background:A.al, cursor:"not-allowed", fontFamily:dff, fontSize:11 }} value={editId || "⟳ Auto on save"} readOnly />
              </div>
              <div>
                <span style={lbl}>{sub==="PO"?"PO Date":"GRN Date"} *</span>
                <input type="date" style={{ ...inp, borderColor:A.a }} value={sub==="PO"?poDate:grnDate} onChange={e => { sub==="PO"?setPoDate(e.target.value):setGrnDate(e.target.value); setIsDirty(true); }} />
              </div>
              {sub === "PO" ? <>
                <div><span style={lbl}>Season</span>
                  <select style={selS} value={season} onChange={e=>{setSeason(e.target.value);setIsDirty(true);}}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <div><span style={lbl}>PO Type *</span>
                  <select style={selS} value={poType} onChange={e=>{setPoType(e.target.value);setIsDirty(true);}}><option value="">— Select —</option>{PO_TYPES.map(t=><option key={t}>{t}</option>)}</select>
                </div>
              </> : <>
                <div><span style={lbl}>Against PO *</span>
                  <select style={{ ...selS, borderColor:A.a }} value={poRef} onChange={e=>{setPoRef(e.target.value);setIsDirty(true);}}>
                    <option value="">— Select open PO —</option>
                    {OPEN_POS.map(p=><option key={p.po} value={p.po}>{p.po} · {p.date}</option>)}
                  </select>
                </div>
                <div><span style={lbl}>Vehicle No</span><input style={inp} placeholder="PB-10-AB-1234" value={vehicle} onChange={e=>{setVehicle(e.target.value);setIsDirty(true);}} /></div>
                <div><span style={lbl}>DC Number</span><input style={inp} value={dcNo} onChange={e=>{setDcNo(e.target.value);setIsDirty(true);}} /></div>
              </>}
            </div>
          </Accordion>

          {/* Supplier */}
          <Accordion id="supplier" icon="🏭" title="Supplier" badge={sup ? sup.code : undefined}>
            <div style={{ display:"grid", gap:9 }}>
              <div><span style={lbl}>Select Supplier *</span>
                <select style={{ ...selS, borderColor: supplier ? A.a : M.inputBd }} value={supplier} onChange={e=>{setSupplier(e.target.value);setIsDirty(true);}}>
                  <option value="">— Select supplier —</option>
                  {SUPPLIERS.map(s=><option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}
                </select>
              </div>
              {sup && (
                <div style={{ background:A.al, borderRadius:4, padding:"11px 12px", border:`1px solid ${A.a}35`, borderLeft:`3px solid ${A.a}` }}>
                  <div style={{ fontWeight:900, fontSize:fz, color:M.textA, marginBottom:8 }}>{sup.name}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {[["City",sup.city],["Credit",`${sup.credit} Days`],["Rating","★".repeat(sup.rating)+"☆".repeat(5-sup.rating)],["GSTIN",sup.gstin]].map(([k,v])=>(
                      <div key={k}>
                        <div style={{ fontSize:8, fontWeight:900, color:M.textD, letterSpacing:.5 }}>{k}</div>
                        <div style={{ fontSize:10, fontWeight:700, color:M.textA, marginTop:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Accordion>

          {/* Terms / Logistics */}
          {sub === "PO"
            ? <Accordion id="terms" icon="📅" title="Payment & Delivery">
                <div style={{ display:"grid", gap:9 }}>
                  <div><span style={lbl}>Payment Terms *</span>
                    <select style={selS} value={payTerms} onChange={e=>{setPayTerms(e.target.value);setIsDirty(true);}}><option value="">— Select —</option>{PAY_TERMS.map(t=><option key={t}>{t}</option>)}</select>
                  </div>
                  <div><span style={lbl}>Delivery By</span><input type="date" style={inp} value={delivDate} onChange={e=>{setDelivDate(e.target.value);setIsDirty(true);}} /></div>
                  <div><span style={lbl}>Delivery Address</span><input style={inp} placeholder="Factory, Phase-8, Ludhiana" onChange={()=>setIsDirty(true)} /></div>
                  <div><span style={lbl}>Remarks</span><textarea style={{ ...inp, height:54, resize:"vertical" }} placeholder="Special instructions…" onChange={()=>setIsDirty(true)} /></div>
                </div>
              </Accordion>
            : <Accordion id="logistics" icon="🚛" title="Logistics Details">
                <div style={{ display:"grid", gap:9 }}>
                  <div><span style={lbl}>DC Date</span><input type="date" style={inp} onChange={()=>setIsDirty(true)} /></div>
                  <div><span style={lbl}>Store to Warehouse *</span>
                    <select style={{ ...selS, borderColor: wh ? A.a : M.inputBd }} value={wh} onChange={e=>{setWh(e.target.value);setIsDirty(true);}}><option value="">— Select —</option>{WH_LIST.map(w=><option key={w}>{w}</option>)}</select>
                  </div>
                  <div><span style={lbl}>Received By</span><input style={inp} placeholder="Name" onChange={()=>setIsDirty(true)} /></div>
                  <div><span style={lbl}>Notes</span><textarea style={{ ...inp, height:54, resize:"vertical" }} placeholder="Inspection notes…" onChange={()=>setIsDirty(true)} /></div>
                </div>
              </Accordion>
          }

          {/* Totals (PO) */}
          {sub === "PO" && (
            <Accordion id="totals" icon="₹" title="Order Totals">
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {[["Line Items", `${lines.length} item${lines.length!==1?"s":""}`],["Base Value",fmtINR(tBase)],["Total GST",fmtINR(tGst)]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:`${sp+1}px 0`, borderBottom:`1px solid ${M.divider}` }}>
                    <span style={{ fontSize:fz-1, color:M.textB }}>{k}</span>
                    <span style={{ fontSize:fz-1, fontWeight:800, color:M.textA }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop:12, background:A.a, borderRadius:5, padding:"13px 14px" }}>
                  <div style={{ color:`${A.tx}bb`, fontSize:9, fontWeight:900, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>Grand Total (incl. GST)</div>
                  <div style={{ color:A.tx, fontSize:20, fontWeight:900, fontFamily:dff }}>{fmtINR(tBase+tGst)}</div>
                </div>
              </div>
            </Accordion>
          )}

          {/* Open POs (GRN) */}
          {sub === "GRN" && (
            <Accordion id="openpos" icon="📄" title="Open POs" badge={`${OPEN_POS.length}`}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {OPEN_POS.map(p => {
                  const s = SUPPLIERS.find(x => x.code === p.sup);
                  const active = poRef === p.po;
                  return (
                    <div key={p.po} onClick={() => { setPoRef(p.po); setIsDirty(true); }} style={{ padding:"9px 11px", background: active ? A.al : M.surfMid, border:`1px solid ${active ? A.a : M.divider}`, borderRadius:4, cursor:"pointer", borderLeft:`3px solid ${active ? A.a : "transparent"}`, transition:"all .15s" }}>
                      <div style={{ fontSize:11, fontWeight:800, color: active ? A.a : M.textA, fontFamily:dff }}>{p.po}</div>
                      <div style={{ fontSize:10, color:M.textC, marginTop:2 }}>{s?.name} · {p.items} items · {p.date}</div>
                    </div>
                  );
                })}
              </div>
            </Accordion>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding:`${sp+2}px 16px`, borderTop:`1px solid ${M.sidebarBd}`, background:M.surfMid, display:"flex", gap:7, flexShrink:0 }}>
          <button onClick={() => { toast("Draft saved ✓"); setIsDirty(false); }} style={{ flex:1, padding:`${sp+1}px`, border:`1px solid ${M.inputBd}`, borderRadius:4, background:M.inputBg, color:M.textB, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:uff }}>💾 Draft</button>
          <button onClick={() => setShowSavePreview(true)} style={{ flex:2.2, padding:`${sp+1}px`, border:"none", borderRadius:4, background:A.a, color:A.tx, fontSize:11, fontWeight:900, cursor:"pointer", fontFamily:uff, letterSpacing:.3 }}>
            {sub === "PO" ? "▶ Submit PO" : "▶ Confirm GRN"}
          </button>
        </div>
      </div>

      {/* ── DRAG HANDLE ──────────────────────────────────────── */}
      <div onMouseDown={onCpDragStart} style={{ width:5, cursor:"col-resize", flexShrink:0, background: cpDrag ? `${A.a}25` : "transparent", borderLeft:`1px solid ${cpDrag ? A.a : M.sidebarBd}`, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
        <div style={{ width:2, height:60, background: cpDrag ? A.a : M.sidebarBd, borderRadius:2 }} />
      </div>

      {/* ── MAIN CONTENT (line items) ──────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Content toolbar */}
        <div style={{ padding:`${pyV}px 16px`, background:M.surfHigh, borderBottom:`1px solid ${M.divider}`, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div>
            <span style={{ fontSize:14, fontWeight:900, color:M.textA }}>📋 Line Items</span>
            <span style={{ fontSize:11, color:M.textC, marginLeft:10 }}>
              {sub==="PO" ? "Qty · Price · Discount · GST auto-filled" : "Received · Accepted · Rejection tracking"}
            </span>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {tBase > 0 && sub === "PO" && (
              <span style={{ fontSize:12, fontWeight:900, color:A.a, fontFamily:dff, background:A.al, padding:"3px 10px", borderRadius:4, border:`1px solid ${A.a}40` }}>{fmtINR(tBase+tGst)}</span>
            )}
            <span style={{ fontSize:11, padding:"3px 10px", borderRadius:10, background:M.badgeBg, color:M.badgeTx, fontWeight:700 }}>{lines.length} {lines.length===1?"row":"rows"}</span>
            <button onClick={addLine} style={{ padding:`${pyV-1}px 14px`, border:`1.5px solid ${A.a}`, borderRadius:4, background:A.al, color:A.a, fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:uff }}>+ Add Row</button>
            <button onClick={() => setShowPrintPreview(true)} style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${M.divider}`, background:M.surfMid, color:M.textB, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:uff }}>🖨️ Print</button>
            <div style={{ position:"relative" }}>
              <button onClick={() => setShowExport(o=>!o)} style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${M.divider}`, background:M.surfMid, color:M.textB, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:uff }}>📤 Export ▾</button>
              {showExport && (
                <>
                  <div onClick={() => setShowExport(false)} style={{ position:"fixed", inset:0, zIndex:998 }}/>
                  <div className="dd-anim" style={{ position:"absolute", top:"calc(100% + 4px)", right:0, width:180, background:M.dropBg, border:`1px solid ${M.divider}`, borderRadius:6, boxShadow:M.shadow, zIndex:999, overflow:"hidden" }}>
                    {[["📄","Export PDF"],["📊","Google Sheets"],["📗","Excel (.xlsx)"],["📋","Copy to Clipboard"]].map(([ic,lbl2]) => (
                      <button key={lbl2} onClick={() => { toast(`${lbl2} exported ✓`); setShowExport(false); }} style={{ width:"100%", padding:"8px 12px", display:"flex", alignItems:"center", gap:8, border:"none", background:"transparent", color:M.textB, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:uff, textAlign:"left", borderBottom:`1px solid ${M.divider}` }}
                        onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span>{ic}</span>{lbl2}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table control bar */}
        <div style={{ padding:"5px 16px", background:M.surfMid, borderBottom:`1px solid ${M.divider}`, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <span style={{ fontSize:9, fontWeight:900, color:M.textD, letterSpacing:.5 }}>🔽 Filters (0)</span>
          <div style={{ width:1, height:14, background:M.divider }}/>
          <span style={{ fontSize:9, fontWeight:900, color:M.textD, letterSpacing:.5 }}>↕️ Sort: None</span>
          <div style={{ width:1, height:14, background:M.divider }}/>
          <span style={{ fontSize:9, fontWeight:900, color:M.textD, letterSpacing:.5 }}>📁 Group: None</span>
          <div style={{flex:1}}/>
          <span style={{ fontSize:9, color:M.textD }}>📄 Sub: {sub}</span>
        </div>

        {/* Line items table */}
        <div style={{ flex:1, overflowY:"auto", overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:760 }}>
            <thead>
              <tr>
                {cfg.showRowNums && <TH w={38}>#</TH>}
                <TH w={cfg.showThumbs ? 290 : 260}>Item</TH>
                <TH w={62}>UOM</TH>
                <TH w={64}>HSN</TH>
                <TH w={58}>GST%</TH>
                {sub === "PO" ? <>
                  <TH w={82} right>Qty</TH>
                  <TH w={100} right>Unit Price</TH>
                  <TH w={62} right>Disc%</TH>
                  <TH w={110} right>Line Total</TH>
                </> : <>
                  <TH w={90} right>Received</TH>
                  <TH w={90} right>Accepted</TH>
                  <TH w={76} right>Rejected</TH>
                  <TH w={70}>Rolls</TH>
                  <TH w={100}>Lot No</TH>
                </>}
                <TH w={30}></TH>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const it = ITEMS.find(i => i.code === line.itemCode);
                const qty=parseFloat(line.qty)||0, price=parseFloat(line.price)||0, disc=parseFloat(line.disc)||0;
                const base=qty*price*(1-disc/100), gstAmt=it?base*(it.gst/100):0;
                const rcv=parseFloat(line.recQty)||0, acc=parseFloat(line.accQty)||0;
                const rowBg = cfg.tblStyle==="striped" ? (idx%2===0 ? M.tblEven : M.tblOdd) : M.surfHigh;
                return (
                  <tr key={line.id} style={{ background:rowBg, transition:"background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = M.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                    {cfg.showRowNums && (
                      <td style={{ padding:`${pyV}px 8px`, borderBottom:`1px solid ${M.divider}`, textAlign:"center", color:A.a, fontWeight:900, fontSize:11, fontFamily:dff, verticalAlign:"top", paddingTop:pyV+7 }}>
                        {String(idx+1).padStart(2,"0")}
                      </td>
                    )}
                    <td style={{ padding:`${pyV}px 8px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top", minWidth:cfg.showThumbs?280:240 }}>
                      <ItemSearch value={line.itemCode} onChange={v=>updLine(line.id,"itemCode",v)} M={M} A={A} fz={fz} py={pyV} showThumbs={cfg.showThumbs} />
                    </td>
                    {autoCell(it?.uom||"—", !!it)}
                    {autoCell(it?.hsn||"—", !!it)}
                    {autoCell(it ? `${it.gst}%` : "—", !!it)}
                    {sub === "PO" ? <>
                      <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top" }}>
                        <input type="number" style={{ ...inp, width:78, textAlign:"right" }} placeholder="0" value={line.qty} onChange={e=>updLine(line.id,"qty",e.target.value)} />
                      </td>
                      <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top" }}>
                        <input type="number" style={{ ...inp, width:94, textAlign:"right" }} placeholder="₹ 0" value={line.price} onChange={e=>updLine(line.id,"price",e.target.value)} />
                      </td>
                      <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top" }}>
                        <input type="number" style={{ ...inp, width:56, textAlign:"right" }} placeholder="0" value={line.disc} onChange={e=>updLine(line.id,"disc",e.target.value)} />
                      </td>
                      <td style={{ padding:`${pyV}px 8px`, borderBottom:`1px solid ${M.divider}`, textAlign:"right", verticalAlign:"top", paddingTop:pyV+7 }}>
                        <span style={{ fontSize:fz, fontWeight:900, color:(it&&base>0)?A.a:M.textD, fontFamily:dff }}>{it && base > 0 ? fmtINR(base+gstAmt) : "—"}</span>
                      </td>
                    </> : <>
                      <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top" }}>
                        <input type="number" style={{ ...inp, width:80, textAlign:"right" }} placeholder="0" value={line.recQty} onChange={e=>updLine(line.id,"recQty",e.target.value)} />
                      </td>
                      <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top" }}>
                        <input type="number" style={{ ...inp, width:80, textAlign:"right" }} placeholder="0" value={line.accQty} onChange={e=>updLine(line.id,"accQty",e.target.value)} />
                      </td>
                      <td style={{ padding:`${pyV}px 8px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top", paddingTop:pyV+7 }}>
                        {rcv-acc > 0
                          ? <span style={{ fontSize:11, fontWeight:900, color:"#ef4444", fontFamily:dff }}>⚠ {rcv-acc}</span>
                          : <span style={{ fontSize:11, color:M.textD }}>—</span>}
                      </td>
                      <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top" }}>
                        <input type="number" style={{ ...inp, width:62 }} value={line.rolls} onChange={e=>updLine(line.id,"rolls",e.target.value)} />
                      </td>
                      <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top" }}>
                        <input style={{ ...inp, width:92 }} placeholder="LOT-###" value={line.lot} onChange={e=>updLine(line.id,"lot",e.target.value)} />
                      </td>
                    </>}
                    <td style={{ padding:`${pyV}px 6px`, borderBottom:`1px solid ${M.divider}`, verticalAlign:"top", paddingTop:pyV+6 }}>
                      <button onClick={() => remLine(line.id)} style={{ background:"transparent", border:`1px solid ${M.divider}`, color:"#f87171", width:24, height:24, cursor:"pointer", borderRadius:3, fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr><td colSpan={14} style={{ padding:60, textAlign:"center", color:M.textD, fontSize:13 }}>
                  No line items yet. Click <strong style={{ color:A.a }}>+ Add Row</strong> to begin.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Status bar */}
        {cfg.showStatusBar && (
          <div style={{ padding:"5px 16px", background:M.statusBg, borderTop:`1px solid ${M.sidebarBd}`, display:"flex", gap:20, alignItems:"center", flexShrink:0 }}>
            {[["ROWS", lines.length], ["BASE", fmtINR(tBase)], ["GST", fmtINR(tGst)], ["GRAND TOTAL", fmtINR(tBase+tGst)]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", gap:6, alignItems:"baseline" }}>
                <span style={{ fontSize:8, fontWeight:900, color:M.textD, letterSpacing:1 }}>{k}</span>
                <span style={{ fontSize:11, fontWeight:900, color: k==="GRAND TOTAL" ? A.a : M.textB, fontFamily:dff }}>{v}</span>
              </div>
            ))}
            <div style={{ marginLeft:"auto", fontSize:8, color:M.textD, fontFamily:dff }}>CC ERP · FILE-02 · PROCUREMENT · {sub} · {new Date().toLocaleDateString("en-IN")}</div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ════════════════════════════════════════════ */}

      {/* Save Preview Modal */}
      {showSavePreview && (
        <>
          <div onClick={() => setShowSavePreview(false)} style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,.5)", backdropFilter:"blur(3px)" }}/>
          <div className="sc-anim" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:520, background:M.dropBg, border:`1px solid ${M.divider}`, borderRadius:12, boxShadow:M.shadow, zIndex:901, overflow:"hidden", fontFamily:uff }}>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${M.divider}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:15, fontWeight:900, color:M.textA }}>📋 Save Preview — {sub}</span>
              <button onClick={() => setShowSavePreview(false)} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${M.divider}`, background:M.surfMid, color:M.textC, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>
            <div style={{ padding:20, maxHeight:"60vh", overflowY:"auto" }}>
              {/* Validation */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:900, color:M.textD, letterSpacing:.5, marginBottom:6, textTransform:"uppercase" }}>Validation</div>
                {[
                  [!!supplier, "Supplier selected", "Supplier is required"],
                  [sub==="PO"?!!poType:!!poRef, sub==="PO"?"PO Type selected":"Against PO selected", sub==="PO"?"PO Type is required":"Against PO is required"],
                  [lines.some(l=>l.itemCode), "At least 1 line item", "Add line items"],
                ].map(([ok, pass, fail], i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", fontSize:11, color: ok ? "#22c55e" : "#ef4444" }}>
                    <span>{ok ? "✅" : "❌"}</span> {ok ? pass : fail}
                  </div>
                ))}
              </div>
              {/* Summary */}
              <div style={{ background:M.surfMid, borderRadius:6, padding:12, border:`1px solid ${M.divider}`, marginBottom:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[["Supplier", sup?.name||"—"],["Date", sub==="PO"?poDate:grnDate],[sub==="PO"?"Type":"Against PO", sub==="PO"?poType||"—":poRef||"—"],["Lines",`${lines.filter(l=>l.itemCode).length} items`]].map(([k,v])=>(
                    <div key={k}><div style={{ fontSize:8, fontWeight:900, color:M.textD, letterSpacing:.5 }}>{k}</div><div style={{ fontSize:11, fontWeight:700, color:M.textA, marginTop:1 }}>{v}</div></div>
                  ))}
                </div>
              </div>
              {sub==="PO" && (
                <div style={{ background:A.a, borderRadius:6, padding:"12px 14px" }}>
                  <div style={{ color:`${A.tx}bb`, fontSize:9, fontWeight:900, letterSpacing:1 }}>GRAND TOTAL</div>
                  <div style={{ color:A.tx, fontSize:22, fontWeight:900, fontFamily:dff }}>{fmtINR(tBase+tGst)}</div>
                </div>
              )}
            </div>
            <div style={{ padding:"12px 20px", borderTop:`1px solid ${M.divider}`, background:M.surfMid, display:"flex", gap:8 }}>
              <button onClick={() => setShowSavePreview(false)} style={{ flex:1, padding:9, border:`1px solid ${M.inputBd}`, borderRadius:5, background:M.inputBg, color:M.textB, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:uff }}>Cancel</button>
              <button onClick={() => {
                setShowSavePreview(false); setIsDirty(false);
                toast(sub==="PO" ? "PO submitted successfully ✓" : "GRN confirmed ✓");
                setTimeout(() => setView("list"), 800);
              }} style={{ flex:2, padding:9, border:"none", borderRadius:5, background:A.a, color:A.tx, fontSize:11, fontWeight:900, cursor:"pointer", fontFamily:uff }}>
                ✓ Confirm & {sub==="PO"?"Submit":"Save"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Print Preview */}
      {showPrintPreview && (
        <>
          <div onClick={() => setShowPrintPreview(false)} style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,.65)", backdropFilter:"blur(4px)" }}/>
          <div className="sc-anim" style={{ position:"fixed", inset:40, background:"#e5e7eb", borderRadius:12, boxShadow:"0 20px 60px rgba(0,0,0,.4)", zIndex:901, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"10px 20px", background:M.shellBg, borderBottom:`1px solid ${M.divider}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:900, color:M.textA }}>🖨️ Print Preview</span>
              <div style={{ display:"flex", gap:6 }}>
                <button style={{ padding:"5px 14px", borderRadius:5, border:"none", background:A.a, color:A.tx, fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:uff }}>🖨️ Print</button>
                <button onClick={() => setShowPrintPreview(false)} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${M.divider}`, background:M.surfMid, color:M.textC, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
              </div>
            </div>
            <div style={{ flex:1, overflow:"auto", display:"flex", justifyContent:"center", padding:30 }}>
              <div style={{ width:794, minHeight:1123, background:"#fff", borderRadius:4, boxShadow:"0 2px 20px rgba(0,0,0,.15)", padding:"40px 50px", color:"#111" }}>
                {/* Company header */}
                <div style={{ display:"flex", justifyContent:"space-between", borderBottom:"2px solid #E8690A", paddingBottom:14, marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:900, color:"#E8690A" }}>CONFIDENCE CLOTHING</div>
                    <div style={{ fontSize:10, color:"#666", marginTop:2 }}>Phase-8, Industrial Area, Ludhiana, Punjab</div>
                    <div style={{ fontSize:10, color:"#666" }}>GSTIN: 03AABCC1234F1Z5</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:16, fontWeight:900, color:"#333" }}>{sub === "PO" ? "PURCHASE ORDER" : "GOODS RECEIPT NOTE"}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#E8690A", marginTop:4, fontFamily:"'IBM Plex Mono',monospace" }}>{editId || "NEW"}</div>
                    <div style={{ fontSize:10, color:"#666", marginTop:2 }}>Date: {sub==="PO"?poDate:grnDate}</div>
                  </div>
                </div>
                {/* Supplier */}
                {sup && (
                  <div style={{ background:"#f8f9fa", border:"1px solid #e5e7eb", borderRadius:6, padding:14, marginBottom:20 }}>
                    <div style={{ fontSize:9, fontWeight:900, color:"#999", letterSpacing:1, marginBottom:4 }}>SUPPLIER</div>
                    <div style={{ fontSize:13, fontWeight:800, color:"#111" }}>{sup.name}</div>
                    <div style={{ fontSize:10, color:"#666", marginTop:2 }}>{sup.city} · GSTIN: {sup.gstin}</div>
                  </div>
                )}
                {/* Lines preview */}
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                  <thead>
                    <tr style={{ background:"#f4f5f7" }}>
                      <th style={{ padding:"6px 8px", textAlign:"left", borderBottom:"1px solid #d1d5db", fontWeight:900 }}>#</th>
                      <th style={{ padding:"6px 8px", textAlign:"left", borderBottom:"1px solid #d1d5db", fontWeight:900 }}>Item</th>
                      <th style={{ padding:"6px 8px", textAlign:"center", borderBottom:"1px solid #d1d5db", fontWeight:900 }}>UOM</th>
                      <th style={{ padding:"6px 8px", textAlign:"right", borderBottom:"1px solid #d1d5db", fontWeight:900 }}>Qty</th>
                      {sub==="PO"&&<th style={{ padding:"6px 8px", textAlign:"right", borderBottom:"1px solid #d1d5db", fontWeight:900 }}>Rate</th>}
                      {sub==="PO"&&<th style={{ padding:"6px 8px", textAlign:"right", borderBottom:"1px solid #d1d5db", fontWeight:900 }}>Amount</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.filter(l=>l.itemCode).map((l,i) => {
                      const it = ITEMS.find(x=>x.code===l.itemCode);
                      const q2=parseFloat(l.qty)||0, p2=parseFloat(l.price)||0, d2=parseFloat(l.disc)||0;
                      return (
                        <tr key={l.id} style={{ borderBottom:"1px solid #e5e7eb" }}>
                          <td style={{ padding:"6px 8px" }}>{i+1}</td>
                          <td style={{ padding:"6px 8px" }}>{it?.name||l.itemCode}</td>
                          <td style={{ padding:"6px 8px", textAlign:"center" }}>{it?.uom}</td>
                          <td style={{ padding:"6px 8px", textAlign:"right" }}>{sub==="PO"?q2:(parseFloat(l.recQty)||0)}</td>
                          {sub==="PO"&&<td style={{ padding:"6px 8px", textAlign:"right" }}>₹{p2.toFixed(2)}</td>}
                          {sub==="PO"&&<td style={{ padding:"6px 8px", textAlign:"right", fontWeight:700 }}>₹{(q2*p2*(1-d2/100)).toFixed(2)}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sub==="PO" && (
                  <div style={{ marginTop:20, textAlign:"right" }}>
                    <div style={{ fontSize:11, color:"#666" }}>Base: {fmtINR(tBase)} | GST: {fmtINR(tGst)}</div>
                    <div style={{ fontSize:18, fontWeight:900, color:"#E8690A", marginTop:4 }}>Grand Total: {fmtINR(tBase+tGst)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Unsaved Changes Guard */}
      {showUnsaved && (
        <>
          <div onClick={() => setShowUnsaved(false)} style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,.5)" }}/>
          <div className="sc-anim" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:380, background:M.dropBg, border:`1px solid ${M.divider}`, borderRadius:10, boxShadow:M.shadow, zIndex:901, overflow:"hidden", fontFamily:uff }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${M.divider}` }}>
              <div style={{ fontSize:14, fontWeight:900, color:M.textA }}>⚠️ Unsaved Changes</div>
              <div style={{ fontSize:11, color:M.textC, marginTop:4 }}>You have unsaved changes. What would you like to do?</div>
            </div>
            <div style={{ padding:"12px 20px", display:"flex", gap:8 }}>
              <button onClick={() => { setShowUnsaved(false); toast("Draft saved ✓"); setIsDirty(false); }} style={{ flex:1, padding:8, border:`1px solid ${M.inputBd}`, borderRadius:5, background:M.inputBg, color:M.textB, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:uff }}>💾 Save Draft</button>
              <button onClick={() => { setShowUnsaved(false); setIsDirty(false); setView("list"); }} style={{ flex:1, padding:8, border:`1px solid #ef4444`, borderRadius:5, background:"rgba(239,68,68,.08)", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:uff }}>🗑 Discard</button>
              <button onClick={() => setShowUnsaved(false)} style={{ flex:1, padding:8, border:`1px solid ${A.a}`, borderRadius:5, background:A.al, color:A.a, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:uff }}>← Keep Editing</button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position:"fixed", bottom:60, left:"50%", transform:"translateX(-50%)", padding:"10px 24px", background:A.a, color:A.tx, borderRadius:8, fontSize:12, fontWeight:800, fontFamily:uff, boxShadow:"0 8px 30px rgba(0,0,0,.3)", zIndex:9999, animation:"fadeSlide .3s ease" }}>{toastMsg}</div>
      )}
    </div>
  );
}

// ─── MODULE TILE ──────────────────────────────────────────────────────────────
function Tile({mod,M,A,fz,onClick,hov,onHov}){
  return(
    <div onClick={()=>onClick(mod.id)} onMouseEnter={()=>onHov(mod.id)} onMouseLeave={()=>onHov(null)}
      style={{background:hov?M.surfMid:M.surfHigh,border:hov?`1px solid ${mod.col}50`:`1px solid ${M.divider}`,borderRadius:10,padding:"18px 18px 14px",cursor:"pointer",transition:"all .18s ease",position:"relative",boxShadow:hov?`0 6px 24px ${mod.col}20`:"none",transform:hov?"translateY(-2px)":"none"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:hov?mod.col:"transparent",borderRadius:"10px 10px 0 0",transition:"background .18s"}}/>
      {mod.badge>0&&<div style={{position:"absolute",top:11,right:11,minWidth:18,height:18,borderRadius:9,background:"#ef4444",color:"#fff",fontSize:9,fontWeight:900,padding:"0 5px",display:"flex",alignItems:"center",justifyContent:"center"}}>{mod.badge}</div>}
      <div style={{fontSize:26,marginBottom:8}}>{mod.icon}</div>
      <div style={{fontSize:fz,fontWeight:900,color:M.textA,marginBottom:2}}>{mod.lbl}</div>
      <div style={{fontSize:fz-2,color:M.textC,marginBottom:10,lineHeight:1.4}}>{mod.desc}</div>
      <div style={{display:"flex",gap:10,borderTop:`1px solid ${M.divider}`,paddingTop:8}}>
        {mod.stats.pend>0&&<div style={{display:"flex",flexDirection:"column",gap:1}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Pending</span>
          <span style={{fontSize:13,fontWeight:900,color:"#ef4444",fontFamily:"'IBM Plex Mono',monospace"}}>{mod.stats.pend}</span>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:1}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Today</span>
          <span style={{fontSize:12,fontWeight:700,color:M.textB,fontFamily:"'IBM Plex Mono',monospace"}}>{mod.stats.today}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:1,marginLeft:"auto",textAlign:"right"}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Value</span>
          <span style={{fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",color:hov?mod.col:M.textB,transition:"color .18s"}}>{mod.stats.val}</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function CCERP(){
  const [cfg,     setCfg]     = useState({...DEFAULTS});
  const [cfgOpen, setCfgOpen] = useState(false);
  const [sw,      setSw]      = useState(DEFAULTS.sbWidth);
  const [drag,    setDrag]    = useState(false);
  const [actMod,  setActMod]  = useState(null);
  const [hovMod,  setHovMod]  = useState(null);
  const [showAll, setShowAll] = useState(false);
  // Notifications
  const [notifs,      setNotifs]    = useState(NOTIF_INIT);
  const [notifOpen,   setNotifOpen] = useState(false);
  // Command palette
  const [cmdOpen,     setCmdOpen]   = useState(false);
  // Quick Access shortcuts
  const [shortcuts,   setShortcuts] = useState(SHORTCUTS_INIT);
  const [editSC,      setEditSC]    = useState(false);

  const M   = MODES[cfg.mode];
  const A   = ACCENTS[cfg.accent];
  const fz  = FS_MAP[cfg.fontSize];
  const uff = uiFF(cfg.uiFont);
  const dff = dataFF(cfg.dataFont);

  const unreadCount = notifs.filter(n=>!n.read).length;

  // Sync sidebar width
  useEffect(()=>{ setSw(cfg.sbWidth); },[cfg.sbWidth]);

  // Scrollbar colour
  useEffect(()=>{
    let s=document.getElementById("_scr");
    if(!s){s=document.createElement("style");s.id="_scr";document.head.appendChild(s);}
    s.textContent=`::-webkit-scrollbar-thumb{background:${M.scrollThumb}}`;
  },[cfg.mode]);

  // Ctrl+K listener
  useEffect(()=>{
    const handler = e => {
      if((e.ctrlKey||e.metaKey)&&e.key==="k"){ e.preventDefault(); setCmdOpen(o=>!o); }
      if(e.key==="Escape"){ setCmdOpen(false); setNotifOpen(false); setCfgOpen(false); }
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  // Sidebar drag
  const onDragStart=useCallback(e=>{
    e.preventDefault(); setDrag(true);
    const x0=e.clientX, w0=sw;
    const mv=ev=>setSw(Math.max(200,Math.min(520,w0+(ev.clientX-x0))));
    const up=()=>{setDrag(false);window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
  },[sw]);

  const collapsed   = cfg.compactSide;
  const totalOnline = OTHERS.length+1;
  const vis         = OTHERS.slice(0,3);
  const ovfl        = OTHERS.length-3;

  const removeShortcut = id => setShortcuts(sc=>sc.filter(s=>s.id!==id));

  return(
    <div className="theme-anim" style={{width:"100vw",height:"100vh",overflow:"hidden",background:M.bg,display:"flex",flexDirection:"column",fontFamily:uff}}>

      {/* ══ SHELL BAR ══════════════════════════════════════════════════════════ */}
      <div style={{height:48,flexShrink:0,background:M.shellBg,borderBottom:`1px solid ${M.shellBd}`,display:"flex",alignItems:"center",padding:"0 10px 0 0",zIndex:200,position:"relative"}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 14px",height:"100%",borderRight:`1px solid ${M.shellBd}`,flexShrink:0}}>
          <div style={{width:30,height:30,borderRadius:6,background:A.a,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>📦</div>
          <div>
            <div style={{fontSize:12,fontWeight:900,color:A.a,lineHeight:1}}>CC ERP</div>
            <div style={{fontSize:7,color:M.textD,letterSpacing:.8,textTransform:"uppercase",lineHeight:1.4}}>Confidence Clothing</div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 14px",flexShrink:0,fontSize:11}}>
          <span style={{color:A.a,fontWeight:700,cursor:"pointer"}} onClick={()=>setActMod(null)}>Home</span>
          {actMod&&<><span style={{color:M.textD}}>›</span><span style={{color:actMod==="procurement"?A.a:M.textB,fontWeight:actMod==="procurement"?700:600,cursor:"pointer"}} onClick={()=>{}}>{MODS.find(m=>m.id===actMod)?.lbl}</span></>}
        </div>

        {/* ─── Ctrl+K search pill ─────────────────────── */}
        <button onClick={()=>setCmdOpen(true)} style={{
          display:"flex",alignItems:"center",gap:7,padding:"5px 12px",
          borderRadius:7,border:`1px solid ${M.shellBd}`,
          background:M.surfLow,cursor:"pointer",flexShrink:0,
          color:M.textC,transition:"all .15s",fontFamily:uff,
        }}>
          <span style={{fontSize:13}}>🔍</span>
          <span style={{fontSize:11,fontWeight:600}}>Search…</span>
          <div style={{display:"flex",gap:3,marginLeft:8}}>
            <span style={{fontSize:9,fontFamily:dff,background:M.badgeBg,border:`1px solid ${M.divider}`,padding:"1px 5px",borderRadius:3,color:M.textD,fontWeight:700}}>Ctrl</span>
            <span style={{fontSize:9,fontFamily:dff,background:M.badgeBg,border:`1px solid ${M.divider}`,padding:"1px 5px",borderRadius:3,color:M.textD,fontWeight:700}}>K</span>
          </div>
        </button>

        <div style={{flex:1}}/>

        {/* Quick Theme */}
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 8px",borderRight:`1px solid ${M.shellBd}`,flexShrink:0}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Theme</span>
          <div style={{display:"flex",gap:2,background:M.surfLow,border:`1px solid ${M.shellBd}`,borderRadius:5,padding:"2px 3px"}}>
            {Object.values(MODES).map(m=>(
              <button key={m.id} onClick={()=>setCfg(c=>({...c,mode:m.id}))} title={m.name} style={{width:22,height:22,border:`2px solid ${cfg.mode===m.id?A.a:"transparent"}`,borderRadius:4,background:cfg.mode===m.id?A.al:"transparent",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>{m.lbl}</button>
            ))}
          </div>
        </div>

        {/* Quick Accent */}
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 8px",borderRight:`1px solid ${M.shellBd}`,flexShrink:0}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Accent</span>
          <div style={{display:"flex",gap:4,background:M.surfLow,border:`1px solid ${M.shellBd}`,borderRadius:5,padding:"4px 6px"}}>
            {Object.values(ACCENTS).map(ac=>(
              <button key={ac.id} onClick={()=>setCfg(c=>({...c,accent:ac.id}))} title={ac.lbl} style={{width:16,height:16,borderRadius:"50%",background:ac.a,cursor:"pointer",border:`2px solid ${cfg.accent===ac.id?M.textA:"transparent"}`,transition:"all .15s",flexShrink:0}}/>
            ))}
          </div>
        </div>

        {/* 🔔 Notification Bell */}
        <div style={{position:"relative",flexShrink:0}}>
          <button onClick={()=>{setNotifOpen(o=>!o);setShowAll(false);setCfgOpen(false);}} style={{
            width:34,height:34,borderRadius:6,margin:"0 4px",
            background:notifOpen?A.a:M.surfLow,
            border:`1px solid ${notifOpen?A.a:M.shellBd}`,
            color:notifOpen?"#fff":M.textB,cursor:"pointer",fontSize:16,
            display:"flex",alignItems:"center",justifyContent:"center",
            position:"relative",transition:"all .15s",
          }}>
            🔔
            {unreadCount>0&&(
              <div style={{position:"absolute",top:3,right:3,minWidth:16,height:16,borderRadius:8,
                background:"#ef4444",color:"#fff",fontSize:8,fontWeight:900,
                display:"flex",alignItems:"center",justifyContent:"center",
                padding:"0 3px",border:`2px solid ${M.shellBg}`,lineHeight:1}}>
                {unreadCount}
              </div>
            )}
          </button>
          {notifOpen&&(
            <NotifPanel
              notifs={notifs} setNotifs={setNotifs}
              M={M} A={A} uff={uff} fz={fz}
              onClose={()=>setNotifOpen(false)}
            />
          )}
        </div>

        {/* ⚙️ Settings */}
        <button onClick={()=>{setCfgOpen(o=>!o);setNotifOpen(false);}} style={{width:34,height:34,borderRadius:6,margin:"0 4px",background:cfgOpen?A.a:M.surfLow,border:`1px solid ${cfgOpen?A.a:M.shellBd}`,color:cfgOpen?"#fff":M.textB,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>⚙️</button>

        {/* Presence separator */}
        <div style={{width:1,height:24,background:M.divider,marginLeft:4,marginRight:8,flexShrink:0}}/>

        {/* Avatars */}
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <Av user={{...ME,status:"active",module:"Dashboard",page:"Home",ts:Date.now()}} isSelf M={M} A={A} uff={uff}/>
          {vis.map(u=><Av key={u.email} user={u} isSelf={false} M={M} A={A} uff={uff}/>)}
          {ovfl>0&&(
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowAll(o=>!o)} style={{height:28,minWidth:28,padding:"0 8px",borderRadius:14,background:M.badgeBg,color:M.textB,border:`1px solid ${M.divider}`,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",fontFamily:uff}}>+{ovfl}</button>
              {showAll&&(
                <div className="dd-anim" style={{position:"absolute",top:36,right:0,width:280,background:M.dropBg,border:`1px solid ${M.divider}`,borderRadius:8,boxShadow:M.shadow,zIndex:9999,overflow:"hidden"}}>
                  <div style={{padding:"7px 12px",borderBottom:`1px solid ${M.divider}`,fontSize:9,fontWeight:900,color:M.textC,textTransform:"uppercase",letterSpacing:.5}}>All Online ({totalOnline})</div>
                  {[{...ME,status:"active",module:"Dashboard",page:"Home",ts:Date.now()},...OTHERS].map(u=>(
                    <div key={u.email} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:`1px solid ${M.divider}`}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:u.email===ME.email?A.a:aColor(u.email),color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:uff}}>{ini(u.name)}</div>
                      <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:M.textA,display:"flex",alignItems:"center",gap:4}}>{u.name}{u.email===ME.email&&<span style={{fontSize:7,background:A.a,color:"#fff",borderRadius:2,padding:"0 3px"}}>YOU</span>}</div><div style={{fontSize:9,color:M.textC}}>{u.module}</div></div>
                      <span style={{fontSize:8,fontWeight:900,padding:"2px 5px",borderRadius:3,background:ROLE_C[u.role]+"22",color:ROLE_C[u.role]}}>{ROLE_K[u.role]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.28)",fontSize:10,fontWeight:800,color:"#22c55e",flexShrink:0}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>{totalOnline} online
          </div>
        </div>
      </div>

      {/* ══ BODY ═══════════════════════════════════════════════════════════════ */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
        <div style={{width:collapsed?46:sw,flexShrink:0,background:M.sidebarBg,borderRight:`1px solid ${M.sidebarBd}`,display:"flex",flexDirection:"column",overflow:"hidden",transition:drag?"none":"width .2s ease",zIndex:100}}>

          {/* Panel label */}
          {!collapsed&&(
            <div style={{padding:"5px 10px",background:M.surfMid,borderBottom:`1px solid ${M.sidebarBd}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1.4,textTransform:"uppercase"}}>Navigation · {sw}px</span>
              <button onClick={()=>setCfg(c=>({...c,compactSide:true}))} style={{background:"none",border:"none",cursor:"pointer",color:M.textD,fontSize:14,padding:0,lineHeight:1}}>‹</button>
            </div>
          )}
          {collapsed&&(
            <button onClick={()=>setCfg(c=>({...c,compactSide:false}))} style={{width:"100%",padding:"11px 0",background:"none",border:"none",cursor:"pointer",color:M.textC,fontSize:16,borderBottom:`1px solid ${M.sidebarBd}`}}>›</button>
          )}

          <div style={{flex:1,overflowY:"auto"}}>

            {/* ── ⭐ QUICK ACCESS SECTION ───────────────────────────────────── */}
            {!collapsed&&(
              <div>
                {/* Section header */}
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px 4px",borderBottom:`1px solid ${M.divider}`}}>
                  <span style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:1.2,textTransform:"uppercase",flex:1}}>⭐ Quick Access</span>
                  <button onClick={()=>setCmdOpen(true)} title="Add via Ctrl+K" style={{fontSize:11,background:"none",border:"none",cursor:"pointer",color:M.textD,padding:"1px 4px",borderRadius:3,lineHeight:1}}>＋</button>
                  <button onClick={()=>setEditSC(e=>!e)} title="Edit shortcuts" style={{fontSize:10,background:editSC?A.al:"none",border:editSC?`1px solid ${A.a}`:"none",cursor:"pointer",color:editSC?A.a:M.textD,padding:"1px 5px",borderRadius:3,lineHeight:1.4,fontFamily:uff}}>
                    {editSC?"Done":"Edit"}
                  </button>
                </div>
                {/* Shortcut items */}
                {shortcuts.length===0&&(
                  <div style={{padding:"10px 12px",fontSize:10,color:M.textD,textAlign:"center",borderBottom:`1px solid ${M.divider}`}}>
                    No shortcuts yet.<br/><span style={{color:A.a,cursor:"pointer",fontWeight:700}} onClick={()=>setCmdOpen(true)}>Open Ctrl+K to pin items ⭐</span>
                  </div>
                )}
                {shortcuts.map(sc=>(
                  <div key={sc.id} className="sc-item" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:`1px solid ${M.divider}`,cursor:"pointer",position:"relative",background:"transparent",transition:"background .1s"}}
                    onClick={()=>{const m=MODS.find(m=>m.id===sc.mod);if(m)setActMod(m.id);}}>
                    <span style={{fontSize:13,flexShrink:0}}>{sc.icon}</span>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{fontSize:fz-2,fontWeight:700,color:M.textB,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sc.label}</div>
                      <div style={{fontSize:8,color:M.textD}}>{sc.sub}</div>
                    </div>
                    {editSC&&(
                      <button className="sc-remove" onClick={e=>{e.stopPropagation();removeShortcut(sc.id);}} style={{opacity:1,width:18,height:18,borderRadius:"50%",background:"#ef4444",color:"#fff",border:"none",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>×</button>
                    )}
                  </div>
                ))}
                <div style={{height:1,background:M.divider,margin:"4px 0"}}/>
              </div>
            )}
            {/* Collapsed star icon */}
            {collapsed&&(
              <button onClick={()=>setCmdOpen(true)} title="Quick Access (Ctrl+K)" style={{width:"100%",padding:"9px 0",background:"none",border:"none",cursor:"pointer",color:M.textD,fontSize:15,borderBottom:`1px solid ${M.sidebarBd}`,textAlign:"center"}}>⭐</button>
            )}

            {/* ── MODULE NAV ───────────────────────────────────────────────── */}
            {!collapsed&&(
              <div style={{padding:"5px 12px 3px",fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1.2,textTransform:"uppercase"}}>Modules</div>
            )}
            {MODS.map(mod=>{
              const active=actMod===mod.id;
              return(
                <button key={mod.id} onClick={()=>setActMod(mod.id)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:9,padding:collapsed?"9px 0":"7px 12px",justifyContent:collapsed?"center":"flex-start",background:active?`${A.a}12`:"transparent",borderLeft:active?`3px solid ${A.a}`:"3px solid transparent",border:"none",cursor:"pointer",transition:"all .12s",fontFamily:uff}}>
                  <span style={{fontSize:15,flexShrink:0}}>{mod.icon}</span>
                  {!collapsed&&<>
                    <span style={{fontSize:fz-1,fontWeight:700,color:active?A.a:M.textB,flex:1}}>{mod.lbl}</span>
                    {mod.badge>0&&<span style={{fontSize:9,fontWeight:900,minWidth:18,height:18,borderRadius:9,background:"#ef4444",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{mod.badge}</span>}
                  </>}
                </button>
              );
            })}

            <div style={{height:1,background:M.divider,margin:"4px 10px"}}/>
            {[{icon:"⚙️",lbl:"Settings",fn:()=>setCfgOpen(true),act:cfgOpen},
              {icon:"👥",lbl:"Users",    fn:()=>{},              act:false}].map((x,i)=>(
              <button key={i} onClick={x.fn} style={{width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:9,padding:collapsed?"9px 0":"7px 12px",justifyContent:collapsed?"center":"flex-start",background:x.act?`${A.a}12`:"transparent",borderLeft:x.act?`3px solid ${A.a}`:"3px solid transparent",border:"none",cursor:"pointer",fontFamily:uff}}>
                <span style={{fontSize:15}}>{x.icon}</span>
                {!collapsed&&<span style={{fontSize:fz-1,fontWeight:700,color:M.textC}}>{x.lbl}</span>}
              </button>
            ))}
          </div>

          {/* User card */}
          {!collapsed&&(
            <div style={{padding:"9px 10px",borderTop:`1px solid ${M.sidebarBd}`,background:M.surfMid,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:A.a,color:"#fff",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:uff}}>{ini(ME.name)}</div>
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{fontSize:fz-2,fontWeight:800,color:M.textA,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ME.name}</div>
                <span style={{fontSize:8,fontWeight:900,padding:"1px 5px",borderRadius:3,background:ROLE_C[ME.role]+"22",color:ROLE_C[ME.role],letterSpacing:.5}}>{ROLE_K[ME.role]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Drag handle */}
        {!collapsed&&(
          <div onMouseDown={onDragStart} style={{width:5,flexShrink:0,cursor:"col-resize",background:drag?`${A.a}25`:"transparent",borderLeft:drag?`1px solid ${A.a}`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
            <div style={{width:2,height:40,borderRadius:1,background:drag?A.a:M.divider,transition:"background .15s"}}/>
          </div>
        )}

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        {actMod === "procurement" ? (
          <Procurement M={M} A={A} cfg={cfg} fz={fz} dff={dff} />
        ) : (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:M.bg}}>

          {/* Sub-toolbar */}
          <div style={{height:40,flexShrink:0,background:M.surfHigh,borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",padding:"0 14px",gap:8}}>
            <span style={{fontSize:fz,fontWeight:900,color:M.textA}}>🏠 Home — Module Overview</span>
            <div style={{flex:1}}/>
            <span style={{fontSize:10,color:M.textD,fontFamily:dff}}>{timeStr()}</span>
            {["🖨️ Print","📤 Export ▾"].map(lbl=>(
              <button key={lbl} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${M.divider}`,background:M.surfMid,color:M.textB,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:uff}}>{lbl}</button>
            ))}
          </div>

          {/* Scroll area */}
          <div style={{flex:1,overflowY:"auto",padding:18}}>

            {/* Greeting */}
            <div style={{marginBottom:20}} className="fade-slide">
              <div style={{fontSize:fz+8,fontWeight:900,color:M.textA,marginBottom:3}}>{greet()}, {ME.name.split(" ")[0]} 👋</div>
              <div style={{fontSize:fz-2,color:M.textC}}>{todayStr()}</div>
            </div>

            {/* Quick stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {[
                {lbl:"Open POs",  val:"3",     sub:"₹4.2L value",   col:"#E8690A",icon:"📦"},
                {lbl:"Active WOs",val:"5",     sub:"8 on floor",    col:"#0078D4",icon:"🏭"},
                {lbl:"Pending QC",val:"2",     sub:"Lot 089 failed",col:"#7C3AED",icon:"🔬"},
                {lbl:"Due Pmts",  val:"₹2.1L", sub:"4 invoices",    col:"#BE123C",icon:"💰"},
              ].map((s,i)=>(
                <div key={i} style={{background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,padding:"13px 14px",borderLeft:`3px solid ${s.col}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><span style={{fontSize:16}}>{s.icon}</span><span style={{fontSize:9,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:.5}}>{s.lbl}</span></div>
                  <div style={{fontSize:20,fontWeight:900,color:M.textA,fontFamily:dff,marginBottom:2}}>{s.val}</div>
                  <div style={{fontSize:fz-2,color:M.textC}}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Section label */}
            <div style={{fontSize:9,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Modules</div>

            {/* Module tiles */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {MODS.map(mod=><Tile key={mod.id} mod={mod} M={M} A={A} fz={fz} onClick={setActMod} hov={hovMod===mod.id} onHov={setHovMod}/>)}
            </div>

            {/* Bottom row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14}}>
              {/* Activity */}
              <div style={{background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,overflow:"hidden"}}>
                <div style={{padding:"9px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:fz-1,fontWeight:900,color:M.textA}}>🕐 Recent Activity</span>
                  <span style={{fontSize:9,color:M.textD}}>Today</span>
                </div>
                {ACTIVITY.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:`${PY_MAP[cfg.density]+4}px 14px`,borderBottom:i<ACTIVITY.length-1?`1px solid ${M.divider}`:"none",borderLeft:`3px solid ${a.col}`,background:i%2===0?M.tblEven:M.tblOdd}}>
                    <span style={{fontSize:15,flexShrink:0}}>{a.icon}</span>
                    <div>
                      <div style={{fontSize:fz-1,fontWeight:700,color:M.textA}}>{a.text}</div>
                      <div style={{fontSize:fz-3,color:M.textC}}>{a.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Online users */}
              <div style={{background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,overflow:"hidden"}}>
                <div style={{padding:"9px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:fz-1,fontWeight:900,color:M.textA}}>👥 Online Now</span>
                  <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:800,color:"#22c55e",background:"rgba(34,197,94,.1)",padding:"2px 8px",borderRadius:10,border:"1px solid rgba(34,197,94,.25)"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}}/>{totalOnline}</div>
                </div>
                {[{...ME,status:"active",module:"Dashboard",page:"Home",ts:Date.now()},...OTHERS].map((u,i)=>{
                  const dot=u.status==="active"?"#22c55e":"#f59e0b";
                  return(
                    <div key={u.email} style={{display:"flex",alignItems:"center",gap:9,padding:`${PY_MAP[cfg.density]+2}px 12px`,borderBottom:i<OTHERS.length?`1px solid ${M.divider}`:"none"}}>
                      <div style={{position:"relative",flexShrink:0}}>
                        <div style={{width:26,height:26,borderRadius:"50%",background:u.email===ME.email?A.a:aColor(u.email),color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:uff}}>{ini(u.name)}</div>
                        <div style={{position:"absolute",bottom:0,right:0,width:7,height:7,borderRadius:"50%",background:dot,border:`1.5px solid ${M.surfHigh}`}}/>
                      </div>
                      <div style={{flex:1,overflow:"hidden"}}>
                        <div style={{fontSize:fz-2,fontWeight:700,color:M.textA,display:"flex",alignItems:"center",gap:4}}>
                          {u.name.split(" ")[0]}
                          {u.email===ME.email&&<span style={{fontSize:7,background:A.a,color:"#fff",borderRadius:2,padding:"0 3px"}}>YOU</span>}
                        </div>
                        <div style={{fontSize:fz-3,color:M.textC}}>{u.module}</div>
                      </div>
                      <span style={{fontSize:7,fontWeight:900,padding:"2px 5px",borderRadius:3,background:ROLE_C[u.role]+"22",color:ROLE_C[u.role],letterSpacing:.3,flexShrink:0}}>{ROLE_K[u.role]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status Bar */}
          {cfg.showStatusBar&&(
            <div style={{height:28,flexShrink:0,background:M.statusBg,borderTop:`1px solid ${M.sidebarBd}`,display:"flex",alignItems:"center",padding:"0 14px",gap:16,fontSize:10,fontFamily:dff}}>
              <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1,textTransform:"uppercase"}}>MODULES</span>
              <span style={{fontSize:11,fontWeight:900,color:M.textB}}>8</span>
              <div style={{width:1,height:12,background:M.divider}}/>
              <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1,textTransform:"uppercase"}}>ONLINE</span>
              <span style={{fontSize:11,fontWeight:900,color:"#22c55e"}}>{totalOnline}</span>
              <div style={{width:1,height:12,background:M.divider}}/>
              <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1,textTransform:"uppercase"}}>PENDING</span>
              <span style={{fontSize:11,fontWeight:900,color:"#ef4444"}}>{notifs.filter(n=>!n.read).length+9}</span>
              <div style={{flex:1}}/>
              <span style={{fontSize:9,color:M.textD}}>CC ERP · Home · {MODES[cfg.mode].name} · {ACCENTS[cfg.accent].lbl}</span>
              <div style={{width:1,height:12,background:M.divider}}/>
              <span style={{fontSize:9,color:M.textD}}>{timeStr()}</span>
            </div>
          )}
        </div>
        )}
      </div>

      {/* ── SETTINGS PANEL ─────────────────────────────────────────────────── */}
      {cfgOpen&&<SettingsPanel M={M} A={A} cfg={cfg} onApply={newCfg=>setCfg(newCfg)} onClose={()=>setCfgOpen(false)}/>}

      {/* ── CMD PALETTE ────────────────────────────────────────────────────── */}
      {cmdOpen&&(
        <CmdPalette
          M={M} A={A} uff={uff} fz={fz}
          shortcuts={shortcuts} setShortcuts={setShortcuts}
          onClose={()=>setCmdOpen(false)}
          onModSelect={id=>{setActMod(id);}}
          onCfgOpen={()=>setCfgOpen(true)}
        />
      )}

      {/* Backdrop for overflow dropdown */}
      {showAll&&<div onClick={()=>setShowAll(false)} style={{position:"fixed",inset:0,zIndex:9000}}/>}
    </div>
  );
}
