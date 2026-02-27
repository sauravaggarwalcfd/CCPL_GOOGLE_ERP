import React, { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════
//  §3B MODES  |  §3C ACCENTS  (UI_SPEC_V6 exact hex)
// ═══════════════════════════════════════════════════════════════════════
const MODES = {
  light:     {bg:"#f0f2f5",shellBg:"#ffffff",shellBd:"#e2e4e8",sidebarBg:"#ffffff",sidebarBd:"#e2e4e8",surfHigh:"#ffffff",surfMid:"#f7f8fa",surfLow:"#f0f2f5",hoverBg:"#eef1f8",inputBg:"#ffffff",inputBd:"#d1d5db",divider:"#e5e7eb",tblHead:"#f4f5f7",tblEven:"#ffffff",tblOdd:"#fafbfc",statusBg:"#f0f2f5",badgeBg:"#e5e7eb",badgeTx:"#374151",textA:"#111827",textB:"#374151",textC:"#6b7280",textD:"#9ca3af",scrollThumb:"#d1d5db",shadow:"0 4px 20px rgba(0,0,0,.09)",label:"☀️ Light"},
  black:     {bg:"#000000",shellBg:"#0a0a0a",shellBd:"#1c1c1c",sidebarBg:"#0a0a0a",sidebarBd:"#1c1c1c",surfHigh:"#111111",surfMid:"#161616",surfLow:"#0a0a0a",hoverBg:"#1c1c1c",inputBg:"#0d0d0d",inputBd:"#2a2a2a",divider:"#1f1f1f",tblHead:"#0d0d0d",tblEven:"#111111",tblOdd:"#141414",statusBg:"#0a0a0a",badgeBg:"#1c1c1c",badgeTx:"#888888",textA:"#f0f0f0",textB:"#a0a0a0",textC:"#666666",textD:"#444444",scrollThumb:"#2a2a2a",shadow:"0 4px 28px rgba(0,0,0,.85)",label:"⬛ Black"},
  lightgrey: {bg:"#e4e7ec",shellBg:"#f2f3f5",shellBd:"#d4d6dc",sidebarBg:"#f2f3f5",sidebarBd:"#d4d6dc",surfHigh:"#f8f9fa",surfMid:"#eef0f3",surfLow:"#e4e7ec",hoverBg:"#e0e4ef",inputBg:"#f8f9fa",inputBd:"#c8cdd8",divider:"#d4d6dc",tblHead:"#ebedf0",tblEven:"#f8f9fa",tblOdd:"#f0f2f5",statusBg:"#e4e7ec",badgeBg:"#d4d6dc",badgeTx:"#3d4460",textA:"#1a1f2e",textB:"#3d4460",textC:"#6b7590",textD:"#9ba3b8",scrollThumb:"#c0c5d4",shadow:"0 4px 16px rgba(0,0,0,.08)",label:"🩶 Light Grey"},
  midnight:  {bg:"#0d1117",shellBg:"#161b22",shellBd:"#21262d",sidebarBg:"#161b22",sidebarBd:"#21262d",surfHigh:"#1c2128",surfMid:"#161b22",surfLow:"#0d1117",hoverBg:"#21262d",inputBg:"#0d1117",inputBd:"#30363d",divider:"#21262d",tblHead:"#161b22",tblEven:"#1c2128",tblOdd:"#161b22",statusBg:"#0d1117",badgeBg:"#21262d",badgeTx:"#7d8590",textA:"#e6edf3",textB:"#8b949e",textC:"#6e7681",textD:"#484f58",scrollThumb:"#30363d",shadow:"0 4px 24px rgba(0,0,0,.6)",label:"🌙 Midnight"},
  warm:      {bg:"#f0ebe0",shellBg:"#fdf8f0",shellBd:"#e4d8c4",sidebarBg:"#fdf8f0",sidebarBd:"#e4d8c4",surfHigh:"#fdfaf4",surfMid:"#f5f0e8",surfLow:"#ede5d4",hoverBg:"#e8dece",inputBg:"#fdfaf4",inputBd:"#d4c8b0",divider:"#ddd0b8",tblHead:"#f0ebe0",tblEven:"#fdfaf4",tblOdd:"#f5f0e8",statusBg:"#ede5d4",badgeBg:"#e4d8c4",badgeTx:"#4a3c28",textA:"#1c1409",textB:"#5a4a34",textC:"#8a7460",textD:"#b0a090",scrollThumb:"#c8b89c",shadow:"0 4px 16px rgba(60,40,10,.12)",label:"🌅 Warm"},
  slate:     {bg:"#1a2030",shellBg:"#252d40",shellBd:"#2d3654",sidebarBg:"#1e2433",sidebarBd:"#2d3654",surfHigh:"#2a3450",surfMid:"#222a3e",surfLow:"#1a2030",hoverBg:"#2d3654",inputBg:"#1a2030",inputBd:"#2d3654",divider:"#2d3654",tblHead:"#1e2433",tblEven:"#222a3e",tblOdd:"#1e2433",statusBg:"#1a2030",badgeBg:"#2d3654",badgeTx:"#8895b0",textA:"#d8e0f0",textB:"#8895b0",textC:"#5a6680",textD:"#3a4460",scrollThumb:"#2d3654",shadow:"0 4px 24px rgba(0,0,0,.5)",label:"🔷 Slate"},
};
const ACCENTS = {
  orange:{a:"#E8690A",al:"rgba(232,105,10,.12)",tx:"#fff",label:"🟠 Orange"},
  blue:  {a:"#0078D4",al:"rgba(0,120,212,.12)", tx:"#fff",label:"🔵 Blue"},
  teal:  {a:"#007C7C",al:"rgba(0,124,124,.12)", tx:"#fff",label:"🩵 Teal"},
  green: {a:"#15803D",al:"rgba(21,128,61,.12)", tx:"#fff",label:"🟢 Green"},
  purple:{a:"#7C3AED",al:"rgba(124,58,237,.12)",tx:"#fff",label:"🟣 Purple"},
  rose:  {a:"#BE123C",al:"rgba(190,18,60,.12)", tx:"#fff",label:"🌹 Rose"},
};
const DEFAULTS = {mode:"light",accent:"orange",density:"comfortable",fontSize:"medium",tblStyle:"striped",showStatusBar:true};
const FS={small:11,medium:13,large:15};
const PY={compact:4,comfortable:7,spacious:11};

// ═══════════════════════════════════════════════════════════════════════
//  VIEW COLOUR SWATCHES  (for view builder colour picker)
// ═══════════════════════════════════════════════════════════════════════
const VIEW_COLORS = [
  {v:"#E8690A",l:"Orange"},{v:"#0078D4",l:"Blue"},{v:"#15803D",l:"Green"},
  {v:"#7C3AED",l:"Purple"},{v:"#BE123C",l:"Rose"},{v:"#854d0e",l:"Amber"},
  {v:"#0369a1",l:"Sky"},{v:"#059669",l:"Teal"},{v:"#6b7280",l:"Grey"},{v:"#111827",l:"Black"},
];
const VIEW_ICONS = ["⚡","📋","₹","🧵","🏭","🔖","🎯","✅","🔍","📊","📦","🏷️","⚙️","📝","🔑","🎨","👕","🪡","🔗","🧪","📫","🌟","🔒","📌","💡"];

// ═══════════════════════════════════════════════════════════════════════
//  DEFAULT VIEWS generator — called once per master
// ═══════════════════════════════════════════════════════════════════════
function makeDefaultViews(master) {
  const allCols  = master.fields.map(f => f.col);
  const mandCols = [...new Set([allCols[0], ...master.fields.filter(f=>f.req).map(f=>f.col)])];
  const views = [
    {id:`${master.id}:full`,  name:"Full Entry",   icon:"📋", color:"#6b7280", fields:allCols,  isSystem:true, desc:"Every column — complete entry form", createdAt:"system"},
    {id:`${master.id}:quick`, name:"Quick Entry",  icon:"⚡", color:"#E8690A", fields:mandCols, isSystem:true, desc:"Mandatory fields only — fastest way to create a new record", createdAt:"system"},
  ];
  // Smart views per master
  if(master.id==="ARTICLE_MASTER"){
    views.push({id:"art:pricing", name:"Pricing & Tax",  icon:"₹",  color:"#854d0e", fields:["A","Q","R","S","T","U","V"],        isSystem:false, desc:"WSP · MRP · Markup % · Markdown % · HSN · GST", createdAt:"system"});
    views.push({id:"art:fabric",  name:"Fabric Focus",   icon:"🧵", color:"#059669", fields:["A","B","M","N","O","P"],             isSystem:false, desc:"Main fabric code, name, colors, size range", createdAt:"system"});
    views.push({id:"art:identity",name:"Item Identity",  icon:"👕", color:"#7C3AED", fields:["A","B","C","F","G","H","I","J","K","L","Y"], isSystem:false, desc:"Category, season, gender, fit, neckline, sleeve, status", createdAt:"system"});
    views.push({id:"art:status",  name:"Status & Tags",  icon:"🏷️", color:"#0078D4", fields:["A","B","W","X","Y","Z"],             isSystem:false, desc:"Tags, buyer style, status, remarks", createdAt:"system"});
  }
  if(master.id==="RM_MASTER_FABRIC"){
    views.push({id:"fab:supply", name:"Supplier & Cost", icon:"🏭", color:"#0078D4", fields:["A","O","P","Q","R","S","T","W","X"], isSystem:false, desc:"Supplier, season, cost, lead time, status", createdAt:"system"});
    views.push({id:"fab:props",  name:"Fabric Properties",icon:"⚙️",color:"#15803D", fields:["A","C","D","E","F","G","H","I","J","K","L"], isSystem:false, desc:"Knit, yarn, type, colour, GSM, width, shrinkage, stretch, UOM", createdAt:"system"});
  }
  if(master.id==="RM_MASTER_YARN"){
    views.push({id:"yarn:cost",  name:"Cost Entry",      icon:"₹",  color:"#854d0e", fields:["A","B","I","J","K","L","M"],         isSystem:false, desc:"Name, season, cost, GST, total cost, status", createdAt:"system"});
  }
  if(master.id==="TRIM_MASTER"){
    views.push({id:"trm:core",   name:"Core Identity",   icon:"🔗", color:"#7C3AED", fields:["A","C","D","E","G","H","I","J","K","P"], isSystem:false, desc:"Name, category, colour, UOM, HSN, GST, status", createdAt:"system"});
    views.push({id:"trm:attrs",  name:"Attributes",      icon:"⚙️", color:"#E8690A", fields:["A","C","Q","R","S","T","U","V","W","X","Y","Z","AA","AB"], isSystem:false, desc:"All 6 attribute name-value pairs for full spec entry", createdAt:"system"});
  }
  if(master.id==="CONSUMABLE_MASTER"){
    views.push({id:"con:attrs",  name:"Attributes",      icon:"⚙️", color:"#E8690A", fields:["A","B","L","M","N","O","P","Q","R","S"], isSystem:false, desc:"All 4 attribute pairs for consumable specs", createdAt:"system"});
  }
  if(master.id==="COLOR_MASTER"){
    views.push({id:"clr:hex",    name:"Hex / Pantone",   icon:"🎨", color:"#BE123C", fields:["A","B","C","D","E","F"],              isSystem:false, desc:"Color code, name, Pantone, hex, swatch, family", createdAt:"system"});
  }
  return views;
}

// ═══════════════════════════════════════════════════════════════════════
//  MOCK FK DATA  (GAS replaces via getSheetMeta() at runtime)
// ═══════════════════════════════════════════════════════════════════════
const FK = {
  ITEM_CATEGORIES:   [{v:"TOPS-POLO",l:"Tops - Polo",l1:"Apparel"},{v:"TOPS-TEE",l:"Tops - Tee",l1:"Apparel"},{v:"SWEAT",l:"Sweatshirt",l1:"Apparel"},{v:"HOOD",l:"Hoodie",l1:"Apparel"},{v:"TRACK",l:"Tracksuit",l1:"Apparel"},{v:"BOTT-JOGGER",l:"Bottoms - Jogger",l1:"Apparel"}],
  RM_MASTER_FABRIC:  [{v:"RM-FAB-001",l:"RM-FAB-001 — SJ 180GSM Cotton"},{v:"RM-FAB-002",l:"RM-FAB-002 — PIQ 220GSM Cotton"},{v:"RM-FAB-003",l:"RM-FAB-003 — Fleece 280GSM"},{v:"RM-FAB-004",l:"RM-FAB-004 — French Terry 240GSM"}],
  RM_MASTER_YARN:    [{v:"RM-YRN-001",l:"RM-YRN-001 — 30s Cotton Ring Spun"},{v:"RM-YRN-002",l:"RM-YRN-002 — 40s Combed Cotton"}],
  HSN_MASTER:        [{v:"6105",l:"6105 — Polo Shirts Knitted",gst:12},{v:"6109",l:"6109 — T-Shirts Knitted",gst:12},{v:"6110",l:"6110 — Sweatshirts Knitted",gst:12},{v:"6006",l:"6006 — Knit Fabric",gst:5},{v:"5205",l:"5205 — Cotton Yarn",gst:5}],
  COLOR_MASTER:      [{v:"CLR-001",l:"CLR-001 — Navy Blue"},{v:"CLR-002",l:"CLR-002 — White"},{v:"CLR-003",l:"CLR-003 — Black"},{v:"CLR-004",l:"CLR-004 — Charcoal Grey"}],
  SUPPLIER_MASTER:   [{v:"SUP-001",l:"SUP-001 — Rajinder Fabrics, Ludhiana"},{v:"SUP-002",l:"SUP-002 — Punjab Yarn House"},{v:"SUP-003",l:"SUP-003 — Tiruppur Knits Co."}],
  TAG_MASTER:        [{v:"TAG-001",l:"New Arrival"},{v:"TAG-002",l:"Best Seller"},{v:"TAG-003",l:"Export Quality"},{v:"TAG-004",l:"SS25 Collection"}],
  UOM_MASTER:        [{v:"MTR",l:"MTR — Metre"},{v:"KG",l:"KG — Kilogram"},{v:"PCS",l:"PCS — Pieces"},{v:"CONE",l:"CONE — Cone"},{v:"ROLL",l:"ROLL — Roll"},{v:"BOX",l:"BOX — Box"},{v:"CTN",l:"CTN — Carton"}],
  FABRIC_TYPE_MASTER:[{v:"SJ",l:"SJ — Single Jersey"},{v:"PIQ",l:"PIQ — Piqué"},{v:"FLC",l:"FLC — Fleece"},{v:"FT",l:"FT — French Terry"},{v:"RIB",l:"RIB — Rib"}],
  CON_ATTR_VALUES:   [{v:"Reactive",l:"Reactive"},{v:"Vat",l:"Vat"},{v:"Softener",l:"Softener"},{v:"Size 10",l:"Size 10"},{v:"Size 12",l:"Size 12"}],
  PKG_ATTR_VALUES:   [{v:'4"x6"',l:'4"x6"'},{v:'6"x8"',l:'6"x8"'},{v:"Matte",l:"Matte"},{v:"Gloss",l:"Gloss"},{v:"Single Wall",l:"Single Wall"}],
  TRIM_ATTR_VALUES:  [{v:"Fine",l:"Fine"},{v:"Coarse",l:"Coarse"},{v:"70D",l:"70D"},{v:"150D",l:"150D"},{v:"Metal",l:"Metal"},{v:"Nylon",l:"Nylon"}],
};
const GENDER_OPT  =[{v:"Men",l:"Men"},{v:"Women",l:"Women"},{v:"Kids",l:"Kids"},{v:"Unisex",l:"Unisex"}];
const FIT_OPT     =[{v:"Regular",l:"Regular"},{v:"Slim",l:"Slim"},{v:"Relaxed",l:"Relaxed"},{v:"Oversized",l:"Oversized"},{v:"Athletic",l:"Athletic"}];
const NECK_OPT    =[{v:"Round",l:"Round Neck"},{v:"V-Neck",l:"V-Neck"},{v:"Collar",l:"Collar"},{v:"Hooded",l:"Hooded"},{v:"Mock Neck",l:"Mock Neck"}];
const SLEEVE_OPT  =[{v:"Half",l:"Half Sleeve"},{v:"Full",l:"Full Sleeve"},{v:"Sleeveless",l:"Sleeveless"},{v:"3/4",l:"3/4 Sleeve"},{v:"Raglan",l:"Raglan"}];
const STATUS_OPT  =[{v:"Active",l:"Active"},{v:"Inactive",l:"Inactive"},{v:"Development",l:"Development"},{v:"Discontinued",l:"Discontinued"}];
const FTYPE_OPT   =[{v:"KORA",l:"KORA"},{v:"FINISHED",l:"FINISHED"}];
const FCOLOUR_OPT =[{v:"KORA",l:"KORA"},{v:"COLOURED",l:"COLOURED"},{v:"DYED",l:"DYED"},{v:"MÉLANGE",l:"MÉLANGE"}];
const STRETCH_OPT =[{v:"Very High",l:"Very High"},{v:"High",l:"High"},{v:"Medium",l:"Medium"},{v:"Low",l:"Low"},{v:"None",l:"None"}];
const CFAMILY_OPT =[{v:"Blues",l:"Blues"},{v:"Reds",l:"Reds"},{v:"Neutrals",l:"Neutrals"},{v:"Whites",l:"Whites"},{v:"Blacks",l:"Blacks"}];
const YCTYPE_OPT  =[{v:"Raw White",l:"Raw White"},{v:"Dyed",l:"Dyed"},{v:"Mélange",l:"Mélange"},{v:"Grindle",l:"Grindle"}];
const CON_CAT_OPT =[{v:"DYE",l:"DYE — Dye"},{v:"CHM",l:"CHM — Chemical"},{v:"NDL",l:"NDL — Needle"},{v:"OIL",l:"OIL"},{v:"PKG",l:"PKG"},{v:"OTH",l:"OTH — Other"}];
const PKG_CAT_OPT =[{v:"PLY",l:"PLY — Polybag"},{v:"CTN",l:"CTN — Carton"},{v:"HGR",l:"HGR — Hanger"},{v:"TKT",l:"TKT — Ticket/Tag"},{v:"STK",l:"STK — Sticker"},{v:"OTH",l:"OTH — Other"}];
const TRIM_CAT_OPT=[{v:"THD",l:"THD — Thread"},{v:"LBL",l:"LBL — Label"},{v:"ELS",l:"ELS — Elastic"},{v:"ZIP",l:"ZIP — Zipper"},{v:"BUT",l:"BUT — Button"},{v:"TPE",l:"TPE — Tape"},{v:"DRW",l:"DRW — Drawstring"},{v:"VLC",l:"VLC — Velcro"},{v:"RVT",l:"RVT — Rivet"},{v:"THP",l:"THP — Thermal Print"},{v:"OTH",l:"OTH — Other"}];

// ═══════════════════════════════════════════════════════════════════════
//  MASTER FIELD DEFINITIONS — 8 masters
// ═══════════════════════════════════════════════════════════════════════
const MASTERS = [
  {id:"ARTICLE_MASTER",icon:"📦",cols:26,group:"item",codeFormat:"Manual — 5249HP",desc:"Finished article master.",
    sections:[{id:"identity",icon:"📋",title:"Article Identity",cols:["A","B","C","D","E","F"]},{id:"details",icon:"👕",title:"Item Details",cols:["G","H","I","J","K","L"]},{id:"fabric",icon:"🧵",title:"Fabric & Colors",cols:["M","N","O","P"]},{id:"pricing",icon:"₹",title:"Pricing & Tax",cols:["Q","R","S","T","U","V"]},{id:"status",icon:"🏷️",title:"Status & Tags",cols:["W","X","Y","Z"]}],
    fields:[
      {col:"A",ico:"🔑",h:"Article Code",       type:"manual",  req:true, auto:false,fk:null,            hint:"5249HP — 4-5 digits + 2 CAPS. No prefix."},
      {col:"B",ico:"⚠", h:"Description",        type:"text",    req:true, auto:false,fk:null,            hint:"Full article description. Max 120 chars."},
      {col:"C",ico:"—", h:"Short Name",          type:"text",    req:false,auto:false,fk:null,            hint:"Max 25 chars. Used on barcodes."},
      {col:"D",ico:"—", h:"Image Link",          type:"url",     req:false,auto:false,fk:null,            hint:"Google Drive public image URL."},
      {col:"E",ico:"⟷", h:"Sketch Drive Links",  type:"text",    req:false,auto:false,fk:null,            hint:"Pipe-separated Drive links. GAS appends only."},
      {col:"F",ico:"←", h:"L1 Division",         type:"auto",    req:false,auto:true, fk:null,            hint:"← Auto-filled: 'Apparel'. GAS reads ITEM_CATEGORIES."},
      {col:"G",ico:"⚠", h:"L2 Product Category", type:"fk",      req:true, auto:false,fk:"ITEM_CATEGORIES",hint:"Controls L3 sub-categories. Mandatory."},
      {col:"H",ico:"—", h:"Season",              type:"text",    req:false,auto:false,fk:null,            hint:"e.g. SS25, AW26, Year Round (comma-sep)."},
      {col:"I",ico:"⚠", h:"Gender",              type:"dropdown",req:true, auto:false,fk:null,opts:GENDER_OPT,hint:"Men / Women / Kids / Unisex."},
      {col:"J",ico:"—", h:"Fit Type",            type:"dropdown",req:false,auto:false,fk:null,opts:FIT_OPT,hint:"Regular / Slim / Relaxed / Oversized / Athletic."},
      {col:"K",ico:"—", h:"Neckline",            type:"dropdown",req:false,auto:false,fk:null,opts:NECK_OPT,hint:"Round / V-Neck / Collar / Hooded / Mock Neck."},
      {col:"L",ico:"—", h:"Sleeve Type",         type:"dropdown",req:false,auto:false,fk:null,opts:SLEEVE_OPT,hint:"Half / Full / Sleeveless / 3/4 / Raglan."},
      {col:"M",ico:"→", h:"Main Fabric (FK)",    type:"fk",      req:false,auto:false,fk:"RM_MASTER_FABRIC",hint:"Stores fabric code e.g. RM-FAB-001."},
      {col:"N",ico:"←", h:"Fabric Name",         type:"auto",    req:false,auto:true, fk:null,            hint:"← Auto from RM_MASTER_FABRIC."},
      {col:"O",ico:"⟷", h:"Color Code(s)",       type:"multifk", req:false,auto:false,fk:"COLOR_MASTER",  hint:"Multi-select. Comma-separated color codes."},
      {col:"P",ico:"—", h:"Size Range",          type:"text",    req:false,auto:false,fk:null,            hint:"Display: S-M-L-XL-XXL."},
      {col:"Q",ico:"—", h:"W.S.P (₹)",          type:"currency",req:false,auto:false,fk:null,            hint:"Wholesale selling price ex-GST."},
      {col:"R",ico:"—", h:"MRP (₹)",            type:"currency",req:false,auto:false,fk:null,            hint:"Maximum retail price."},
      {col:"S",ico:"∑", h:"Final Markup %",     type:"calc",    req:false,auto:true, fk:null,            hint:"∑ = (MRP−WSP)÷WSP×100. Auto-computed."},
      {col:"T",ico:"∑", h:"Final Markdown %",   type:"calc",    req:false,auto:true, fk:null,            hint:"∑ = (MRP−WSP)÷MRP×100. Auto-computed."},
      {col:"U",ico:"→", h:"HSN Code (FK)",      type:"fk",      req:true, auto:false,fk:"HSN_MASTER",    hint:"4 or 8-digit HSN. Mandatory."},
      {col:"V",ico:"←", h:"GST %",              type:"auto",    req:false,auto:true, fk:null,            hint:"← Auto from HSN_MASTER (CGST+SGST)."},
      {col:"W",ico:"⟷", h:"Tags",               type:"multifk", req:false,auto:false,fk:"TAG_MASTER",    hint:"Multi-select → TAG_MASTER."},
      {col:"X",ico:"—", h:"Buyer Style No",     type:"text",    req:false,auto:false,fk:null,            hint:"Optional buyer reference number."},
      {col:"Y",ico:"⚠", h:"Status",             type:"dropdown",req:true, auto:false,fk:null,opts:STATUS_OPT,hint:"Active / Inactive / Development / Discontinued."},
      {col:"Z",ico:"—", h:"Remarks",            type:"textarea",req:false,auto:false,fk:null,            hint:"Quality flags, buyer notes."},
    ],
    mockRecords:[
      {A:"5249HP",B:"Classic Polo Shirt Navy",G:"TOPS-POLO",I:"Men",Y:"Active",Q:"490",R:"999",V:"12%"},
      {A:"5310TR",B:"Athletic Tracksuit Black",G:"TRACK",I:"Men",Y:"Active",Q:"780",R:"1599",V:"12%"},
      {A:"5180SJ",B:"Basic Round Neck Tee",G:"TOPS-TEE",I:"Unisex",Y:"Development",Q:"190",R:"399",V:"12%"},
    ],
  },
  {id:"RM_MASTER_FABRIC",icon:"🧵",cols:25,group:"item",codeFormat:"AUTO — RM-FAB-001",desc:"Raw material fabric master.",
    sections:[{id:"identity",icon:"📋",title:"Fabric Identity",cols:["A","B","C","D","E"]},{id:"props",icon:"⚙️",title:"Fabric Properties",cols:["F","G","H","I","J","K","L"]},{id:"supply",icon:"🏭",title:"Supplier & Costs",cols:["M","N","O","P","Q","R","S","T","U"]},{id:"status",icon:"🏷️",title:"Status & Tags",cols:["V","W","X","Y"]}],
    fields:[
      {col:"A",ico:"#", h:"RM Code",               type:"autocode",req:true, auto:true, fk:null,                 hint:"# GAS generates RM-FAB-001. LOCKED."},
      {col:"B",ico:"∑", h:"Final Fabric SKU",       type:"calc",    req:false,auto:true, fk:null,                 hint:"∑ GAS builds: Knit Name + Yarn Composition."},
      {col:"C",ico:"→", h:"Knit Name / Structure",  type:"fk",      req:true, auto:false,fk:"FABRIC_TYPE_MASTER", hint:"FK → FABRIC_TYPE_MASTER. SJ/PIQ/FLC etc."},
      {col:"D",ico:"⟷", h:"Yarn Composition",       type:"multifk", req:false,auto:false,fk:"RM_MASTER_YARN",     hint:"Multi-select yarn codes."},
      {col:"E",ico:"←", h:"Yarn Names",             type:"auto",    req:false,auto:true, fk:null,                 hint:"← Auto from RM_MASTER_YARN."},
      {col:"F",ico:"⚠", h:"Fabric Type",            type:"dropdown",req:true, auto:false,fk:null,opts:FTYPE_OPT,  hint:"KORA / FINISHED."},
      {col:"G",ico:"—", h:"Colour",                 type:"dropdown",req:false,auto:false,fk:null,opts:FCOLOUR_OPT,hint:"KORA / COLOURED / DYED / MÉLANGE."},
      {col:"H",ico:"—", h:"GSM",                    type:"number",  req:false,auto:false,fk:null,                 hint:"Grams per sq metre. Integer e.g. 180."},
      {col:"I",ico:"—", h:"Fabric Width (inches)",  type:"number",  req:false,auto:false,fk:null,                 hint:"Width in inches. e.g. 60, 72.5."},
      {col:"J",ico:"—", h:"Shrinkage %",            type:"number",  req:false,auto:false,fk:null,                 hint:"Shrinkage % after wash."},
      {col:"K",ico:"—", h:"Stretchability",         type:"dropdown",req:false,auto:false,fk:null,opts:STRETCH_OPT,hint:"Very High / High / Medium / Low / None."},
      {col:"L",ico:"→", h:"UOM (FK)",               type:"fk",      req:true, auto:false,fk:"UOM_MASTER",         hint:"MTR / KG / YRD. Mandatory."},
      {col:"M",ico:"→", h:"HSN Code (FK)",          type:"fk",      req:true, auto:false,fk:"HSN_MASTER",         hint:"e.g. 6006 for knit fabric."},
      {col:"N",ico:"←", h:"GST %",                  type:"auto",    req:false,auto:true, fk:null,                 hint:"← Auto from HSN_MASTER."},
      {col:"O",ico:"→", h:"Primary Supplier (FK)",  type:"fk",      req:false,auto:false,fk:"SUPPLIER_MASTER",    hint:"SUP-NNN."},
      {col:"P",ico:"←", h:"Supplier Name",          type:"auto",    req:false,auto:true, fk:null,                 hint:"← Auto from SUPPLIER_MASTER."},
      {col:"Q",ico:"—", h:"Season for Cost",        type:"text",    req:false,auto:false,fk:null,                 hint:"Season: SS25, AW26."},
      {col:"R",ico:"—", h:"Avg Cost excl GST (₹)",  type:"currency",req:false,auto:false,fk:null,                 hint:"Average purchase cost ex-GST."},
      {col:"S",ico:"←", h:"GST % for Cost",         type:"auto",    req:false,auto:true, fk:null,                 hint:"← Auto from HSN_MASTER."},
      {col:"T",ico:"∑", h:"Total Cost incl GST",    type:"calc",    req:false,auto:true, fk:null,                 hint:"∑ = Avg Cost × (1+GST%/100). NEVER type."},
      {col:"U",ico:"←", h:"Finished Fabric Cost",   type:"auto",    req:false,auto:true, fk:null,                 hint:"← Phase 3. Blank until Fabric Cost Sheet built."},
      {col:"V",ico:"⟷", h:"Tags",                   type:"multifk", req:false,auto:false,fk:"TAG_MASTER",         hint:"Two-way tag sync."},
      {col:"W",ico:"⚠", h:"Status",                 type:"dropdown",req:true, auto:false,fk:null,opts:STATUS_OPT, hint:"Active / Inactive / Development / Discontinued."},
      {col:"X",ico:"—", h:"Lead Time (Days)",       type:"number",  req:false,auto:false,fk:null,                 hint:"Days from order to delivery."},
      {col:"Y",ico:"—", h:"Remarks",                type:"textarea",req:false,auto:false,fk:null,                 hint:"Supplier notes, quality flags."},
    ],
    mockRecords:[{A:"RM-FAB-001",F:"FINISHED",G:"COLOURED",H:"180",W:"Active"},{A:"RM-FAB-002",F:"FINISHED",G:"COLOURED",H:"220",W:"Active"}],
  },
  {id:"RM_MASTER_YARN",icon:"🪡",cols:15,group:"item",codeFormat:"AUTO — RM-YRN-001",desc:"Yarn raw material master.",
    sections:[{id:"identity",icon:"📋",title:"Yarn Identity",cols:["A","B","C","D"]},{id:"tax",icon:"🏷️",title:"Tax & Supplier",cols:["E","F","G","H"]},{id:"costs",icon:"₹",title:"Costs & Status",cols:["I","J","K","L","M","N","O"]}],
    fields:[
      {col:"A",ico:"#", h:"RM Code",               type:"autocode",req:true, auto:true, fk:null,              hint:"# GAS generates RM-YRN-001. LOCKED."},
      {col:"B",ico:"⚠", h:"Yarn Name",             type:"text",    req:true, auto:false,fk:null,              hint:"e.g. '30s Cotton Ring Spun Raw White'."},
      {col:"C",ico:"—", h:"Colour Type",           type:"dropdown",req:false,auto:false,fk:null,opts:YCTYPE_OPT,hint:"Raw White / Dyed / Mélange / Grindle."},
      {col:"D",ico:"—", h:"Colour (if dyed)",      type:"text",    req:false,auto:false,fk:null,              hint:"Only fill when Colour Type = Dyed."},
      {col:"E",ico:"→", h:"HSN Code (FK)",         type:"fk",      req:true, auto:false,fk:"HSN_MASTER",      hint:"e.g. 5205 for cotton yarn."},
      {col:"F",ico:"←", h:"GST %",                 type:"auto",    req:false,auto:true, fk:null,              hint:"← Auto from HSN_MASTER."},
      {col:"G",ico:"→", h:"Supplier Code (FK)",    type:"fk",      req:false,auto:false,fk:"SUPPLIER_MASTER", hint:"Primary yarn supplier SUP-NNN."},
      {col:"H",ico:"←", h:"Supplier Name",         type:"auto",    req:false,auto:true, fk:null,              hint:"← Auto from SUPPLIER_MASTER."},
      {col:"I",ico:"—", h:"Season for Cost",       type:"text",    req:false,auto:false,fk:null,              hint:"Season: SS25, AW26."},
      {col:"J",ico:"—", h:"Avg Cost excl GST (₹)", type:"currency",req:false,auto:false,fk:null,              hint:"₹ per KG."},
      {col:"K",ico:"←", h:"GST % for Cost",        type:"auto",    req:false,auto:true, fk:null,              hint:"← Auto from HSN_MASTER."},
      {col:"L",ico:"∑", h:"Total Cost incl GST",   type:"calc",    req:false,auto:true, fk:null,              hint:"∑ = Avg Cost × (1+GST%/100). NEVER type."},
      {col:"M",ico:"⚠", h:"Status",                type:"dropdown",req:true, auto:false,fk:null,opts:STATUS_OPT,hint:"Active / Inactive / Development / Discontinued."},
      {col:"N",ico:"—", h:"Lead Time (Days)",      type:"number",  req:false,auto:false,fk:null,              hint:"Days to receive after PO."},
      {col:"O",ico:"—", h:"Remarks",               type:"textarea",req:false,auto:false,fk:null,              hint:"Blend info, spinner details."},
    ],
    mockRecords:[{A:"RM-YRN-001",B:"30s Cotton Ring Spun",C:"Raw White",M:"Active"}],
  },
  {id:"TRIM_MASTER",icon:"🔗",cols:29,group:"item",codeFormat:"AUTO — TRM-THD-001",desc:"All trims master. 10 categories + 6 attribute pairs.",
    sections:[{id:"identity",icon:"📋",title:"Trim Identity",cols:["A","B","C","D","E","F"]},{id:"supply",icon:"🏭",title:"Colour & Supply",cols:["G","H","I","J","K","L","M","N","O","P"]},{id:"attrs",icon:"⚙️",title:"Attributes (1-6)",cols:["Q","R","S","T","U","V","W","X","Y","Z","AA","AB"]},{id:"remarks",icon:"📝",title:"Remarks",cols:["AC"]}],
    fields:[
      {col:"A", ico:"#", h:"TRM Code",        type:"autocode",req:true, auto:true, fk:null,              hint:"# GAS generates e.g. TRM-THD-001. LOCKED."},
      {col:"B", ico:"→", h:"Parent Code",     type:"fk",      req:false,auto:false,fk:"TRIM_MASTER",    hint:"FK self — variant system. Base item = blank."},
      {col:"C", ico:"⚠", h:"Trim Name",       type:"text",    req:true, auto:false,fk:null,              hint:"Full name e.g. '30s Poly Thread Black'."},
      {col:"D", ico:"⚠", h:"Trim Category",   type:"dropdown",req:true, auto:false,fk:null,opts:TRIM_CAT_OPT,hint:"THD/LBL/ELS/ZIP/BUT/TPE/DRW/VLC/RVT/THP/OTH."},
      {col:"E", ico:"—", h:"Sub-Category",    type:"text",    req:false,auto:false,fk:null,              hint:"Optional sub-classification."},
      {col:"F", ico:"—", h:"Image Link",      type:"url",     req:false,auto:false,fk:null,              hint:"Google Drive image URL."},
      {col:"G", ico:"→", h:"Colour Code (FK)",type:"fk",      req:false,auto:false,fk:"COLOR_MASTER",   hint:"FK → COLOR_MASTER. Stores CLR-NNN."},
      {col:"H", ico:"←", h:"Color Name",      type:"auto",    req:false,auto:true, fk:null,              hint:"← Auto from COLOR_MASTER."},
      {col:"I", ico:"⚠", h:"UOM",            type:"dropdown",req:true, auto:false,fk:null,opts:[{v:"CONE",l:"CONE"},{v:"MTR",l:"MTR"},{v:"PCS",l:"PCS"},{v:"KG",l:"KG"},{v:"SET",l:"SET"},{v:"ROLL",l:"ROLL"}],hint:"CONE/MTR/PCS/KG/SET/ROLL."},
      {col:"J", ico:"→", h:"HSN Code (FK)",   type:"fk",      req:true, auto:false,fk:"HSN_MASTER",     hint:"Mandatory."},
      {col:"K", ico:"←", h:"GST %",           type:"auto",    req:false,auto:true, fk:null,              hint:"← Auto from HSN_MASTER."},
      {col:"L", ico:"→", h:"Primary Supplier",type:"fk",      req:false,auto:false,fk:"SUPPLIER_MASTER", hint:"Primary supplier code."},
      {col:"M", ico:"—", h:"Supplier Ref",    type:"text",    req:false,auto:false,fk:null,              hint:"Raw supplier reference code."},
      {col:"N", ico:"—", h:"Lead Time (Days)",type:"number",  req:false,auto:false,fk:null,              hint:"Days from PO to delivery."},
      {col:"O", ico:"—", h:"Reorder Level",   type:"number",  req:false,auto:false,fk:null,              hint:"Min stock before reorder trigger."},
      {col:"P", ico:"⚠", h:"Status",          type:"dropdown",req:true, auto:false,fk:null,opts:STATUS_OPT,hint:"Active / Inactive / Development / Discontinued."},
      {col:"Q", ico:"⟷", h:"Attr 1 Name",     type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Auto from TRIM_ATTR_NAMES on category select."},
      {col:"R", ico:"⟷", h:"Attr 1 Value",    type:"fk",      req:false,auto:false,fk:"TRIM_ATTR_VALUES",hint:"Dropdown from TRIM_ATTR_VALUES."},
      {col:"S", ico:"⟷", h:"Attr 2 Name",     type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Second attr name."},
      {col:"T", ico:"⟷", h:"Attr 2 Value",    type:"fk",      req:false,auto:false,fk:"TRIM_ATTR_VALUES",hint:"Dropdown."},
      {col:"U", ico:"⟷", h:"Attr 3 Name",     type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Third attr name."},
      {col:"V", ico:"⟷", h:"Attr 3 Value",    type:"fk",      req:false,auto:false,fk:"TRIM_ATTR_VALUES",hint:"Dropdown."},
      {col:"W", ico:"⟷", h:"Attr 4 Name",     type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Fourth attr name."},
      {col:"X", ico:"⟷", h:"Attr 4 Value",    type:"fk",      req:false,auto:false,fk:"TRIM_ATTR_VALUES",hint:"Dropdown."},
      {col:"Y", ico:"⟷", h:"Attr 5 Name",     type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Fifth attr name."},
      {col:"Z", ico:"⟷", h:"Attr 5 Value",    type:"fk",      req:false,auto:false,fk:"TRIM_ATTR_VALUES",hint:"Dropdown."},
      {col:"AA",ico:"⟷", h:"Attr 6 Name",     type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Sixth attr name."},
      {col:"AB",ico:"⟷", h:"Attr 6 Value",    type:"fk",      req:false,auto:false,fk:"TRIM_ATTR_VALUES",hint:"Dropdown."},
      {col:"AC",ico:"—", h:"Remarks",         type:"textarea",req:false,auto:false,fk:null,              hint:"Free text notes."},
    ],
    mockRecords:[{A:"TRM-THD-001",C:"30s Poly Thread Black",D:"THD",P:"Active"}],
  },
  {id:"CONSUMABLE_MASTER",icon:"🧪",cols:20,group:"item",codeFormat:"AUTO — CON-DYE-001",desc:"Consumables master. DYE/CHM/NDL/OIL/PKG/OTH + 4 attribute pairs.",
    sections:[{id:"identity",icon:"📋",title:"Consumable Identity",cols:["A","B","C","D","E","F","G"]},{id:"supply",icon:"🏭",title:"Supplier & Stock",cols:["H","I","J","K"]},{id:"attrs",icon:"⚙️",title:"Attributes (1-4)",cols:["L","M","N","O","P","Q","R","S"]},{id:"remarks",icon:"📝",title:"Remarks",cols:["T"]}],
    fields:[
      {col:"A",ico:"#", h:"CON Code",             type:"autocode",req:true, auto:true, fk:null,              hint:"# GAS generates CON-DYE-001. LOCKED."},
      {col:"B",ico:"⚠", h:"Consumable Name",      type:"text",    req:true, auto:false,fk:null,              hint:"e.g. 'Reactive Black Dye B200'."},
      {col:"C",ico:"⚠", h:"Consumable Category",  type:"dropdown",req:true, auto:false,fk:null,opts:CON_CAT_OPT,hint:"DYE/CHM/NDL/OIL/PKG/OTH."},
      {col:"D",ico:"—", h:"Sub-Category",         type:"text",    req:false,auto:false,fk:null,              hint:"Free-text sub-classification."},
      {col:"E",ico:"⚠", h:"UOM",                  type:"fk",      req:true, auto:false,fk:"UOM_MASTER",      hint:"KG/LTR/PCS/BOX."},
      {col:"F",ico:"→", h:"HSN Code (FK)",         type:"fk",      req:true, auto:false,fk:"HSN_MASTER",      hint:"Mandatory."},
      {col:"G",ico:"←", h:"GST %",                type:"auto",    req:false,auto:true, fk:null,              hint:"← Auto from HSN_MASTER."},
      {col:"H",ico:"→", h:"Primary Supplier (FK)", type:"fk",      req:false,auto:false,fk:"SUPPLIER_MASTER", hint:"Primary supplier."},
      {col:"I",ico:"←", h:"Supplier Name",        type:"auto",    req:false,auto:true, fk:null,              hint:"← Auto from SUPPLIER_MASTER."},
      {col:"J",ico:"—", h:"Reorder Level",        type:"number",  req:false,auto:false,fk:null,              hint:"Min stock threshold."},
      {col:"K",ico:"⚠", h:"Status",               type:"dropdown",req:true, auto:false,fk:null,opts:STATUS_OPT,hint:"Active / Inactive / Development / Discontinued."},
      {col:"L",ico:"⟷", h:"Attr 1 Name",          type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Auto from CON_ATTR_NAMES."},
      {col:"M",ico:"⟷", h:"Attr 1 Value",         type:"fk",      req:false,auto:false,fk:"CON_ATTR_VALUES", hint:"Dropdown from CON_ATTR_VALUES."},
      {col:"N",ico:"⟷", h:"Attr 2 Name",          type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Second attr name."},
      {col:"O",ico:"⟷", h:"Attr 2 Value",         type:"fk",      req:false,auto:false,fk:"CON_ATTR_VALUES", hint:"Dropdown."},
      {col:"P",ico:"⟷", h:"Attr 3 Name",          type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Third attr name."},
      {col:"Q",ico:"⟷", h:"Attr 3 Value",         type:"fk",      req:false,auto:false,fk:"CON_ATTR_VALUES", hint:"Dropdown."},
      {col:"R",ico:"⟷", h:"Attr 4 Name",          type:"auto",    req:false,auto:true, fk:null,              hint:"⟷ Fourth attr name."},
      {col:"S",ico:"⟷", h:"Attr 4 Value",         type:"fk",      req:false,auto:false,fk:"CON_ATTR_VALUES", hint:"Dropdown."},
      {col:"T",ico:"—", h:"Remarks",              type:"textarea",req:false,auto:false,fk:null,              hint:"Free text notes."},
    ],
    mockRecords:[{A:"CON-DYE-001",B:"Reactive Black Dye B200",C:"DYE",K:"Active"}],
  },
  {id:"PACKAGING_MASTER",icon:"📫",cols:18,group:"item",codeFormat:"AUTO — PKG-PLY-001",desc:"Packaging master. PLY/CTN/HGR/TKT/STK/OTH + 4 attribute pairs.",
    sections:[{id:"identity",icon:"📋",title:"Packaging Identity",cols:["A","B","C","D"]},{id:"supply",icon:"🏭",title:"Tax & Supplier",cols:["E","F","G","H","I","J"]},{id:"attrs",icon:"⚙️",title:"Attributes (1-4)",cols:["K","L","M","N","O","P","Q"]},{id:"remarks",icon:"📝",title:"Remarks",cols:["R"]}],
    fields:[
      {col:"A",ico:"#", h:"PKG Code",            type:"autocode",req:true, auto:true, fk:null,                hint:"GAS generates PKG-PLY-001. LOCKED."},
      {col:"B",ico:"⚠", h:"Packaging Name",      type:"text",    req:true, auto:false,fk:null,                hint:"Full name."},
      {col:"C",ico:"⚠", h:"Packaging Category",  type:"dropdown",req:true, auto:false,fk:null,opts:PKG_CAT_OPT,hint:"PLY/CTN/HGR/TKT/STK/OTH."},
      {col:"D",ico:"⚠", h:"UOM",                 type:"fk",      req:true, auto:false,fk:"UOM_MASTER",        hint:"PCS/BOX/CTN/ROLL."},
      {col:"E",ico:"→", h:"HSN Code (FK)",        type:"fk",      req:true, auto:false,fk:"HSN_MASTER",        hint:"Mandatory."},
      {col:"F",ico:"←", h:"GST %",               type:"auto",    req:false,auto:true, fk:null,                hint:"← Auto from HSN_MASTER."},
      {col:"G",ico:"→", h:"Primary Supplier",    type:"fk",      req:false,auto:false,fk:"SUPPLIER_MASTER",   hint:"Primary supplier code."},
      {col:"H",ico:"←", h:"Supplier Name",       type:"auto",    req:false,auto:true, fk:null,                hint:"← Auto from SUPPLIER_MASTER."},
      {col:"I",ico:"—", h:"Reorder Level",       type:"number",  req:false,auto:false,fk:null,                hint:"Min stock threshold."},
      {col:"J",ico:"⚠", h:"Status",              type:"dropdown",req:true, auto:false,fk:null,opts:STATUS_OPT, hint:"Active / Inactive."},
      {col:"K",ico:"⟷", h:"Attr 1 Name",         type:"auto",    req:false,auto:true, fk:null,                hint:"⟷ Auto from PKG_ATTR_NAMES."},
      {col:"L",ico:"⟷", h:"Attr 1 Value",        type:"fk",      req:false,auto:false,fk:"PKG_ATTR_VALUES",   hint:"Dropdown."},
      {col:"M",ico:"⟷", h:"Attr 2 Name",         type:"auto",    req:false,auto:true, fk:null,                hint:"⟷ Second attr."},
      {col:"N",ico:"⟷", h:"Attr 2 Value",        type:"fk",      req:false,auto:false,fk:"PKG_ATTR_VALUES",   hint:"Dropdown."},
      {col:"O",ico:"⟷", h:"Attr 3 Name",         type:"auto",    req:false,auto:true, fk:null,                hint:"⟷ Third attr."},
      {col:"P",ico:"⟷", h:"Attr 3 Value",        type:"fk",      req:false,auto:false,fk:"PKG_ATTR_VALUES",   hint:"Dropdown."},
      {col:"Q",ico:"⟷", h:"Attr 4 Name",         type:"auto",    req:false,auto:true, fk:null,                hint:"⟷ Fourth attr."},
      {col:"R",ico:"—", h:"Remarks",             type:"textarea",req:false,auto:false,fk:null,                hint:"Free text."},
    ],
    mockRecords:[{A:"PKG-PLY-001",B:"Polybag 4x6 inch",C:"PLY",J:"Active"}],
  },
  {id:"COLOR_MASTER",icon:"🎨",cols:7,group:"lookup",codeFormat:"Manual — CLR-001",desc:"Color lookup. Name MUST be consistent across all masters.",
    sections:[{id:"all",icon:"📋",title:"All Fields",cols:["A","B","C","D","E","F","G"]}],
    fields:[
      {col:"A",ico:"🔑",h:"Color Code",   type:"manual",  req:true, auto:false,fk:null,              hint:"CLR-001 sequential or Pantone code. Unique."},
      {col:"B",ico:"⚠", h:"Color Name",   type:"text",    req:true, auto:false,fk:null,              hint:"Standard name. BE CONSISTENT across all masters."},
      {col:"C",ico:"—", h:"Pantone Code", type:"text",    req:false,auto:false,fk:null,              hint:"e.g. PMS 185 C. Optional."},
      {col:"D",ico:"—", h:"Hex Code",     type:"text",    req:false,auto:false,fk:null,              hint:"6-digit hex e.g. #FF0000."},
      {col:"E",ico:"←", h:"Color Swatch", type:"auto",    req:false,auto:true, fk:null,              hint:"← GAS applyColorSwatch(). Cell bg = Hex Code."},
      {col:"F",ico:"—", h:"Color Family", type:"dropdown",req:false,auto:false,fk:null,opts:CFAMILY_OPT,hint:"Blues/Reds/Neutrals/Whites/Greens/Yellows/Blacks."},
      {col:"G",ico:"—", h:"Remarks",      type:"textarea",req:false,auto:false,fk:null,              hint:"Seasonal notes, alternative names."},
    ],
    mockRecords:[{A:"CLR-001",B:"Navy Blue",C:"PMS 289 C",D:"#001f5b",F:"Blues"},{A:"CLR-002",B:"White",D:"#ffffff",F:"Whites"}],
  },
  {id:"HSN_MASTER",icon:"🏷️",cols:6,group:"lookup",codeFormat:"Manual — HSN code",desc:"HSN code lookup. Total GST auto-computed.",
    sections:[{id:"all",icon:"📋",title:"All Fields",cols:["A","B","C","D","E","F"]}],
    fields:[
      {col:"A",ico:"🔑",h:"HSN Code",    type:"manual",  req:true, auto:false,fk:null,hint:"4 or 8-digit HSN e.g. 6105, 5205. Unique."},
      {col:"B",ico:"⚠", h:"Description", type:"text",    req:true, auto:false,fk:null,hint:"Official HSN description from GST tariff."},
      {col:"C",ico:"—", h:"CGST %",      type:"number",  req:true, auto:false,fk:null,hint:"Central GST rate e.g. 2.5 for 5% total."},
      {col:"D",ico:"—", h:"SGST %",      type:"number",  req:true, auto:false,fk:null,hint:"State GST rate e.g. 2.5 for 5% total."},
      {col:"E",ico:"∑", h:"Total GST %", type:"calc",    req:false,auto:true, fk:null,hint:"∑ = CGST + SGST. NEVER type."},
      {col:"F",ico:"—", h:"Remarks",     type:"textarea",req:false,auto:false,fk:null,hint:"MRP threshold notes if applicable."},
    ],
    mockRecords:[{A:"6105",B:"Polo Shirts Knitted",C:"6",D:"6",E:"12%"},{A:"6109",B:"T-Shirts Knitted",C:"6",D:"6",E:"12%"}],
  },
];

// ═══════════════════════════════════════════════════════════════════════
//  AUTO-COMPUTATION ENGINE  (mirrors GAS in preview)
// ═══════════════════════════════════════════════════════════════════════
function computeAutos(masterId,col,val,data){
  const d={...data,[col]:val};
  const n=k=>parseFloat(d[k])||0;
  if(masterId==="ARTICLE_MASTER"){
    const hsnR=(FK.HSN_MASTER||[]).find(r=>r.v===d.U);d.V=hsnR?`${hsnR.gst}%`:"";
    const fabR=(FK.RM_MASTER_FABRIC||[]).find(r=>r.v===d.M);d.N=fabR?fabR.l.split(" — ")[1]||"":"";
    const catR=(FK.ITEM_CATEGORIES||[]).find(r=>r.v===d.G);d.F=catR?catR.l1||"Apparel":"";
    const wsp=n("Q"),mrp=n("R");
    d.S=wsp>0?((mrp-wsp)/wsp*100).toFixed(2)+"%":"";
    d.T=mrp>0?((mrp-wsp)/mrp*100).toFixed(2)+"%":"";
  }
  if(masterId==="RM_MASTER_FABRIC"){
    const hsnR=(FK.HSN_MASTER||[]).find(r=>r.v===d.M);d.N=hsnR?`${hsnR.gst}%`:"";d.S=d.N;
    const avgC=n("R"),gst=parseFloat(d.N)||0;d.T=avgC>0?`₹${(avgC*(1+gst/100)).toFixed(2)}`:"";
    const supR=(FK.SUPPLIER_MASTER||[]).find(r=>r.v===d.O);d.P=supR?supR.l.split(" — ")[1]||"":"";
  }
  if(masterId==="RM_MASTER_YARN"){
    const hsnR=(FK.HSN_MASTER||[]).find(r=>r.v===d.E);d.F=hsnR?`${hsnR.gst}%`:"";d.K=d.F;
    const avgC=n("J"),gst=parseFloat(d.F)||0;d.L=avgC>0?`₹${(avgC*(1+gst/100)).toFixed(2)}`:"";
    const supR=(FK.SUPPLIER_MASTER||[]).find(r=>r.v===d.G);d.H=supR?supR.l.split(" — ")[1]||"":"";
  }
  if(masterId==="TRIM_MASTER"){const hsnR=(FK.HSN_MASTER||[]).find(r=>r.v===d.J);d.K=hsnR?`${hsnR.gst}%`:"";}
  if(masterId==="CONSUMABLE_MASTER"){const hsnR=(FK.HSN_MASTER||[]).find(r=>r.v===d.F);d.G=hsnR?`${hsnR.gst}%`:"";const supR=(FK.SUPPLIER_MASTER||[]).find(r=>r.v===d.H);d.I=supR?supR.l.split(" — ")[1]||"":"";}
  if(masterId==="PACKAGING_MASTER"){const hsnR=(FK.HSN_MASTER||[]).find(r=>r.v===d.E);d.F=hsnR?`${hsnR.gst}%`:"";const supR=(FK.SUPPLIER_MASTER||[]).find(r=>r.v===d.G);d.H=supR?supR.l.split(" — ")[1]||"":"";}
  if(masterId==="HSN_MASTER"){const c=n("C"),s=n("D");d.E=(c+s)>0?`${(c+s).toFixed(1)}%`:""; }
  return d;
}

// ═══════════════════════════════════════════════════════════════════════
//  useDrag hook
// ═══════════════════════════════════════════════════════════════════════
function useDrag(init,min,max){
  const [width,setWidth]=useState(init);
  const [dragging,setDragging]=useState(false);
  const sx=useRef(0),sw=useRef(init);
  const onMouseDown=useCallback(e=>{e.preventDefault();setDragging(true);sx.current=e.clientX;sw.current=width;document.body.style.cursor="col-resize";document.body.style.userSelect="none";},[width]);
  useEffect(()=>{
    const mv=e=>{if(!dragging)return;setWidth(Math.min(max,Math.max(min,sw.current+(e.clientX-sx.current))));};
    const up=()=>{setDragging(false);document.body.style.cursor="";document.body.style.userSelect="";};
    if(dragging){window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);}
    return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
  },[dragging,min,max]);
  return{width,dragging,onMouseDown};
}

function GlobalStyles({thumb}){return(
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Nunito Sans',sans-serif;overflow:hidden}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{border-radius:4px;background:${thumb}}@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}@keyframes slideLeft{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}@keyframes slideRight{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@keyframes themeSwap{0%{opacity:.75}100%{opacity:1}}@keyframes toast-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes progress{from{width:100%}to{width:0%}}.sp-anim{animation:slideLeft .22s ease both}.sr-anim{animation:slideRight .22s ease both}.sc-anim{animation:scaleIn .15s ease both}.theme-anim{animation:themeSwap .25s ease both}input,select,textarea{font-family:'Nunito Sans',sans-serif}`}</style>
);}
function SLabel({M,children}){return <div style={{fontSize:9,fontWeight:900,letterSpacing:1.5,textTransform:"uppercase",color:M.textD,padding:"14px 0 8px",borderTop:`1px solid ${M.divider}`}}>{children}</div>;}

// ═══════════════════════════════════════════════════════════════════════
//  DATA TYPE BADGE
// ═══════════════════════════════════════════════════════════════════════
const DT_MAP={manual:{bg:"#fff1f2",tx:"#9f1239",bd:"#fecdd3"},autocode:{bg:"#ede9fe",tx:"#6d28d9",bd:"#c4b5fd"},calc:{bg:"#fff7ed",tx:"#c2410c",bd:"#fed7aa"},auto:{bg:"#f0fdf4",tx:"#166534",bd:"#bbf7d0"},fk:{bg:"#eff6ff",tx:"#1d4ed8",bd:"#bfdbfe"},multifk:{bg:"#eef2ff",tx:"#4338ca",bd:"#c7d2fe"},dropdown:{bg:"#f0f9ff",tx:"#0369a1",bd:"#bae6fd"},text:{bg:"#fafafa",tx:"#374151",bd:"#e5e7eb"},currency:{bg:"#fefce8",tx:"#854d0e",bd:"#fde68a"},number:{bg:"#f0fdf4",tx:"#166534",bd:"#bbf7d0"},url:{bg:"#f0fdfa",tx:"#0f766e",bd:"#99f6e4"},textarea:{bg:"#fafafa",tx:"#374151",bd:"#e5e7eb"}};
const DT_LABEL={manual:"Manual",autocode:"AUTO #",calc:"∑ Calc",auto:"← Auto",fk:"→ FK",multifk:"⟷ Multi-FK",dropdown:"Dropdown",text:"Text",currency:"Currency ₹",number:"Number",url:"URL Link",textarea:"Text Area"};
function DtBadge({type}){const d=DT_MAP[type]||DT_MAP.text;return <span style={{display:"inline-block",padding:"2px 7px",borderRadius:3,background:d.bg,color:d.tx,border:`1px solid ${d.bd}`,fontSize:9,fontWeight:800,whiteSpace:"nowrap"}}>{DT_LABEL[type]||type}</span>;}

// ═══════════════════════════════════════════════════════════════════════
//  ICON CELL helper
// ═══════════════════════════════════════════════════════════════════════
function IcoCell({ico,A}){
  if(ico==="🔑")return<span>🔑</span>;
  if(ico==="⚠")return<span style={{color:"#ef4444",fontWeight:900,fontSize:13}}>⚠</span>;
  if(ico==="→")return<span style={{color:"#2563eb",fontWeight:900,fontSize:12}}>→</span>;
  if(ico==="←")return<span style={{color:"#059669",fontWeight:900,fontSize:12}}>←</span>;
  if(ico==="⟷")return<span style={{color:A.a,fontWeight:900,fontSize:12}}>⟷</span>;
  if(ico==="∑")return<span style={{color:"#c2410c",fontWeight:900,fontSize:12}}>∑</span>;
  if(ico==="#")return<span style={{color:"#6d28d9",fontWeight:900,fontSize:11}}>#</span>;
  return<span style={{color:"#9ca3af",fontSize:10}}>—</span>;
}

// ═══════════════════════════════════════════════════════════════════════
//  FIELD INPUT  (shared by Form + Inline views)
// ═══════════════════════════════════════════════════════════════════════
function FieldInput({f,val,onChange,M,A,fz,compact,hasError}){
  const isAuto=f.auto||["calc","autocode"].includes(f.type);
  const base={width:"100%",border:`1px solid ${hasError?"#ef4444":isAuto?A.a+"40":M.inputBd}`,borderRadius:4,padding:compact?"3px 8px":"5px 9px",fontSize:compact?fz-2:fz-1,outline:"none",background:isAuto?A.al:M.inputBg,color:isAuto?A.a:M.textA,fontFamily:["manual","autocode"].includes(f.type)?"'IBM Plex Mono',monospace":"'Nunito Sans',sans-serif",fontWeight:f.type==="manual"?700:400,letterSpacing:f.type==="manual"?1.5:0,cursor:isAuto?"not-allowed":"text"};
  if(isAuto)return<input style={base} readOnly value={val||""} placeholder={f.type==="autocode"?"← GAS generates code":"← GAS auto-fills"}/>;
  if(f.type==="textarea")return<textarea rows={compact?2:3} style={{...base,resize:"vertical"}} value={val||""} onChange={e=>onChange(e.target.value)} placeholder={f.hint}/>;
  if(f.type==="dropdown")return<select style={base} value={val||""} onChange={e=>onChange(e.target.value)}><option value="">— select —</option>{(f.opts||[]).map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>;
  if(f.type==="fk"||f.type==="multifk"){const opts=FK[f.fk]||[];return<select style={base} value={val||""} onChange={e=>onChange(e.target.value)}><option value="">— {f.fk} —</option>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>;}
  if(f.type==="currency")return<input type="number" step="0.01" style={base} value={val||""} onChange={e=>onChange(e.target.value)} placeholder="₹ 0.00"/>;
  if(f.type==="number")return<input type="number" style={base} value={val||""} onChange={e=>onChange(e.target.value)} placeholder="0"/>;
  return<input type="text" style={base} value={val||""} onChange={e=>onChange(e.target.value)} placeholder={f.hint}/>;
}

// ═══════════════════════════════════════════════════════════════════════
//  FORM VIEW  (Option D — grouped accordion)
// ═══════════════════════════════════════════════════════════════════════
function FormView({master,formData,onChange,errors,openSec,toggleSec,M,A,fz,pyV,visibleCols}){
  return(
    <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
      {master.sections.map(sec=>{
        const secFields=master.fields.filter(f=>sec.cols.includes(f.col)&&visibleCols.includes(f.col));
        if(secFields.length===0)return null;
        const open=openSec.includes(sec.id);
        const secErrors=secFields.filter(f=>errors[f.col]).length;
        return(
          <div key={sec.id} style={{border:`1px solid ${secErrors>0?"#ef4444":M.divider}`,borderRadius:7,overflow:"hidden"}}>
            <button onClick={()=>toggleSec(sec.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:`${pyV}px 14px`,background:open?`${A.a}08`:M.surfMid,border:"none",cursor:"pointer",borderBottom:`1px solid ${open?M.divider:"transparent"}`}}>
              <span style={{fontSize:14}}>{sec.icon}</span>
              <span style={{fontSize:11,fontWeight:900,color:open?A.a:M.textA,flex:1,textAlign:"left"}}>{sec.title}</span>
              <span style={{fontSize:9,color:M.textD,fontFamily:"'IBM Plex Mono',monospace"}}>{secFields.length} fields</span>
              {secErrors>0&&<span style={{background:"#fef2f2",color:"#ef4444",border:"1px solid #fecaca",borderRadius:3,padding:"1px 6px",fontSize:9,fontWeight:900}}>{secErrors} error{secErrors>1?"s":""}</span>}
              <span style={{fontSize:10,color:M.textD,marginLeft:4}}>{open?"▾":"▸"}</span>
            </button>
            {open&&(
              <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px"}} className="sr-anim">
                {secFields.map(f=>(
                  <div key={f.col} style={{gridColumn:f.type==="textarea"?"1 / -1":"auto"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,fontWeight:700,color:M.textD,minWidth:18}}>{f.col}</span>
                      <span style={{fontSize:9,fontWeight:900,color:errors[f.col]?"#ef4444":f.req?A.a:M.textD,flex:1}}>{f.req&&!f.auto?"⚠ ":""}{f.h}</span>
                      <DtBadge type={f.type}/>
                    </div>
                    <FieldInput f={f} val={formData[f.col]} onChange={v=>onChange(f.col,v)} M={M} A={A} fz={fz} compact={false} hasError={!!errors[f.col]}/>
                    {errors[f.col]&&<div style={{fontSize:9,color:"#ef4444",marginTop:2,fontWeight:700}}>{errors[f.col]}</div>}
                    {!errors[f.col]&&!["auto","calc","autocode"].includes(f.type)&&<div style={{fontSize:8.5,color:M.textD,marginTop:2}}>{f.hint}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  INLINE VIEW  (Option C — spec table IS the entry form)
// ═══════════════════════════════════════════════════════════════════════
function InlineView({master,formData,onChange,errors,M,A,fz,pyV,tblStyle,visibleCols}){
  const [activeCol,setActiveCol]=useState(null);
  const [search,setSearch]=useState("");
  const orderedFields=visibleCols.map(c=>master.fields.find(f=>f.col===c)).filter(Boolean).filter(f=>!search||f.h.toLowerCase().includes(search.toLowerCase()));
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"6px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",gap:8,background:M.surfMid,flexShrink:0}}>
        <div style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:.5}}>⚡ INLINE ENTRY</div>
        <div style={{width:1,height:14,background:M.divider}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter fields…" style={{border:`1px solid ${M.inputBd}`,borderRadius:4,background:M.inputBg,color:M.textA,fontSize:fz-2,padding:"3px 8px",outline:"none",width:180}}/>
        <div style={{marginLeft:"auto",fontSize:9,color:M.textC,fontWeight:700}}>
          {orderedFields.filter(f=>formData[f.col]&&!f.auto&&f.type!=="calc"&&f.type!=="autocode").length} / {orderedFields.filter(f=>!f.auto&&f.type!=="calc"&&f.type!=="autocode").length} filled
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
          <colgroup><col style={{width:36}}/><col style={{width:30}}/><col style={{width:34}}/><col/><col style={{width:108}}/><col/><col style={{width:50}}/></colgroup>
          <thead style={{position:"sticky",top:0,zIndex:10}}>
            <tr style={{background:"#CC0000"}}>
              {["COL","#","ICON","FIELD HEADER","DATA TYPE","ENTER VALUE HERE","STATUS"].map(h=>(
                <th key={h} style={{padding:`${pyV}px 8px`,textAlign:"left",fontSize:9,fontWeight:900,color:"#fff",letterSpacing:.5,borderBottom:"2px solid #aa0000",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedFields.map((f,i)=>{
              const isActive=activeCol===f.col;
              const isAuto=f.auto||["calc","autocode"].includes(f.type);
              const filled=!!formData[f.col]&&!isAuto;
              const hasErr=!!errors[f.col];
              const rowBg=isActive?A.al:hasErr?"#fef2f2":tblStyle==="striped"?(i%2===0?M.tblEven:M.tblOdd):M.surfHigh;
              return(
                <tr key={f.col} onClick={()=>!isAuto&&setActiveCol(f.col)}
                  style={{background:rowBg,borderBottom:`1px solid ${M.divider}`,cursor:isAuto?"default":"pointer",borderLeft:`3px solid ${isActive?A.a:hasErr?"#ef4444":isAuto?A.a+"20":"transparent"}`}}
                  onMouseEnter={e=>{if(!isActive&&!isAuto)e.currentTarget.style.background=M.hoverBg;}}
                  onMouseLeave={e=>{if(!isActive&&!isAuto)e.currentTarget.style.background=rowBg;}}>
                  <td style={{padding:`${pyV}px 8px`,fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,fontWeight:700,color:M.textC}}>{f.col}</td>
                  <td style={{padding:`${pyV}px 8px`,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:M.textD,textAlign:"center"}}>{i+1}</td>
                  <td style={{padding:`${pyV}px 8px`,textAlign:"center"}}><IcoCell ico={f.ico} A={A}/></td>
                  <td style={{padding:`${pyV}px 8px`}}>
                    <div style={{fontSize:fz-2,fontWeight:700,color:isActive?A.a:M.textA}}>{f.h}</div>
                    {!isActive&&<div style={{fontSize:8,color:M.textD,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.hint}</div>}
                  </td>
                  <td style={{padding:`${pyV}px 8px`}}><DtBadge type={f.type}/></td>
                  <td style={{padding:`${pyV-1}px 8px`}}>
                    {isActive?(
                      <FieldInput f={f} val={formData[f.col]} onChange={v=>onChange(f.col,v)} M={M} A={A} fz={fz} compact={true} hasError={hasErr}/>
                    ):isAuto?(
                      <div style={{fontSize:fz-2,color:A.a,background:A.al,border:`1px solid ${A.a}30`,borderRadius:3,padding:"3px 8px",fontWeight:700,fontFamily:"'IBM Plex Mono',monospace"}}>{formData[f.col]||<span style={{opacity:.6}}>← auto</span>}</div>
                    ):formData[f.col]?(
                      <div style={{fontSize:fz-2,color:M.textA,fontWeight:600,padding:"3px 2px"}}>{formData[f.col]}</div>
                    ):(
                      <div style={{fontSize:fz-2,color:M.textD,padding:"3px 2px",fontStyle:"italic",borderBottom:`1px dashed ${M.inputBd}`}}>{f.req?"⚠ required — click":"click to enter…"}</div>
                    )}
                    {hasErr&&<div style={{fontSize:8,color:"#ef4444",marginTop:1,fontWeight:700}}>{errors[f.col]}</div>}
                  </td>
                  <td style={{padding:`${pyV}px 8px`,textAlign:"center"}}>
                    {isAuto?<span style={{color:"#059669",fontSize:9,fontWeight:900}}>AUTO</span>:filled?<span style={{color:"#059669",fontSize:12}}>✓</span>:hasErr?<span style={{color:"#ef4444",fontSize:9,fontWeight:900}}>!!</span>:f.req?<span style={{color:"#f59e0b",fontSize:9,fontWeight:900}}>req</span>:<span style={{color:M.textD,fontSize:9}}>opt</span>}
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

// ═══════════════════════════════════════════════════════════════════════
//  SPEC TABLE  (Field Specs tab)
// ═══════════════════════════════════════════════════════════════════════
function SpecTable({master,M,A,fz,pyV,tblStyle}){
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All Fields");
  const [exp,setExp]=useState(null);
  const FTABS=["All Fields","⚠ Mandatory","# / ← Auto","→ FK Links","✍ Manual Entry"];
  const fields=(master?.fields||[]).filter(f=>{
    const ms=!search||f.h.toLowerCase().includes(search.toLowerCase())||f.hint.toLowerCase().includes(search.toLowerCase());
    const mf=(()=>{switch(filter){case"⚠ Mandatory":return f.req;case"# / ← Auto":return f.auto||f.ico==="#";case"→ FK Links":return!!f.fk;case"✍ Manual Entry":return!f.auto&&f.ico!=="#"&&!f.fk&&!["calc","auto","autocode"].includes(f.type);default:return true;}})();
    return ms&&mf;
  });
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"8px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",gap:8,background:M.surfMid,flexShrink:0,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fields…" style={{border:`1px solid ${M.inputBd}`,borderRadius:4,background:M.inputBg,color:M.textA,fontSize:fz-2,padding:"4px 9px",outline:"none",width:180}}/>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {FTABS.map(t=>(
            <button key={t} onClick={()=>setFilter(t)} style={{padding:"3px 11px",borderRadius:20,border:`1.5px solid ${filter===t?A.a:M.inputBd}`,background:filter===t?A.a:M.inputBg,color:filter===t?A.tx:M.textB,fontSize:9.5,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>{t}</button>
          ))}
        </div>
        <span style={{marginLeft:"auto",fontSize:10,color:M.textC,fontWeight:700,whiteSpace:"nowrap"}}>{fields.length} / {master?.cols} fields</span>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
          <colgroup><col style={{width:36}}/><col style={{width:30}}/><col style={{width:34}}/><col/><col style={{width:118}}/><col style={{width:58}}/><col style={{width:60}}/><col style={{width:140}}/></colgroup>
          <thead style={{position:"sticky",top:0,zIndex:10}}>
            <tr style={{background:"#CC0000"}}>
              {["COL","#","ICON","FIELD HEADER","DATA TYPE","REQ?","AUTO?","FK LINK"].map(h=>(
                <th key={h} style={{padding:`${pyV}px 8px`,textAlign:"left",fontSize:9,fontWeight:900,color:"#fff",letterSpacing:.5,borderBottom:"2px solid #aa0000",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f,i)=>{
              const isExp=exp===f.col;
              const rowBg=isExp?A.al:tblStyle==="striped"?(i%2===0?M.tblEven:M.tblOdd):M.surfHigh;
              return(
                <React.Fragment key={f.col}>
                  <tr onClick={()=>setExp(isExp?null:f.col)} style={{background:rowBg,cursor:"pointer",borderBottom:`1px solid ${M.divider}`}} onMouseEnter={e=>{if(!isExp)e.currentTarget.style.background=M.hoverBg;}} onMouseLeave={e=>{if(!isExp)e.currentTarget.style.background=rowBg;}}>
                    <td style={{padding:`${pyV}px 8px`,fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,fontWeight:700,color:M.textC}}>{f.col}</td>
                    <td style={{padding:`${pyV}px 8px`,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:M.textD,textAlign:"center"}}>{i+1}</td>
                    <td style={{padding:`${pyV}px 8px`,textAlign:"center"}}><IcoCell ico={f.ico} A={A}/></td>
                    <td style={{padding:`${pyV}px 8px`}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:fz-2,fontWeight:700,color:isExp?A.a:M.textA}}>{f.h}</span><span style={{fontSize:9,color:M.textD}}>▾</span></div></td>
                    <td style={{padding:`${pyV}px 8px`}}><DtBadge type={f.type}/></td>
                    <td style={{padding:`${pyV}px 8px`,textAlign:"center"}}>{f.req?<span style={{color:"#ef4444",fontWeight:900,fontSize:9}}>⚠ YES</span>:<span style={{color:M.textD,fontSize:9}}>—</span>}</td>
                    <td style={{padding:`${pyV}px 8px`,textAlign:"center"}}>{(f.auto||f.ico==="#")?<span style={{color:"#059669",fontWeight:900,fontSize:9}}>GAS ✓</span>:<span style={{color:M.textD,fontSize:9}}>—</span>}</td>
                    <td style={{padding:`${pyV}px 8px`}}>{f.fk?<span style={{fontSize:9,fontWeight:900,color:"#2563eb",fontFamily:"'IBM Plex Mono',monospace"}}>{f.fk}</span>:<span style={{color:M.textD,fontSize:9}}>—</span>}</td>
                  </tr>
                  {isExp&&(
                    <tr style={{background:A.al}}>
                      <td colSpan={8} style={{padding:"8px 14px 12px 54px",borderBottom:`2px solid ${A.a}30`}}>
                        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                          <div style={{flex:1}}><div style={{fontSize:8.5,fontWeight:900,color:A.a,letterSpacing:.8,textTransform:"uppercase",marginBottom:3}}>GAS RULE / ENTRY INSTRUCTIONS</div><div style={{fontSize:11,color:M.textA,lineHeight:1.65,fontWeight:600}}>{f.hint}</div></div>
                          <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}><span style={{padding:"2px 7px",background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:3,fontSize:9,color:M.textC}}>Col {f.col}</span><DtBadge type={f.type}/></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  RECORDS TABLE  (Records tab)
// ═══════════════════════════════════════════════════════════════════════
function RecordsTab({master,M,A,fz,pyV,onLoad}){
  const [search,setSearch]=useState("");
  const records=master.mockRecords||[];
  const previewFields=master.fields.filter(f=>!f.auto&&f.type!=="calc"&&f.type!=="autocode").slice(0,6);
  const filtered=records.filter(r=>!search||Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase()));
  const statusCol=master.fields.find(f=>f.h==="Status")?.col;
  const SC={"Active":{bg:"#dcfce7",tx:"#15803d"},"Development":{bg:"#fef3c7",tx:"#d97706"},"Inactive":{bg:"#f1f5f9",tx:"#64748b"},"Discontinued":{bg:"#fef2f2",tx:"#991b1b"}};
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"8px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",gap:8,background:M.surfMid,flexShrink:0}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search records…" style={{border:`1px solid ${M.inputBd}`,borderRadius:4,background:M.inputBg,color:M.textA,fontSize:fz-1,padding:"5px 10px",outline:"none",width:220}}/>
        <span style={{fontSize:10,color:M.textC}}>{filtered.length} records (mock — GAS loads live)</span>
        <button style={{marginLeft:"auto",padding:"5px 14px",background:A.a,border:"none",borderRadius:4,color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>+ New Record</button>
      </div>
      {filtered.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><div style={{fontSize:32}}>📭</div><div style={{fontSize:12,color:M.textC}}>No records found</div></div>:(
        <div style={{flex:1,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead style={{position:"sticky",top:0,zIndex:10}}>
              <tr style={{background:M.tblHead}}>
                <th style={{padding:`${pyV}px 10px`,fontSize:9,fontWeight:900,color:M.textD,borderBottom:`1px solid ${M.divider}`,letterSpacing:.6}}>#</th>
                {previewFields.map(f=><th key={f.col} style={{padding:`${pyV}px 10px`,fontSize:9,fontWeight:900,color:M.textD,borderBottom:`1px solid ${M.divider}`,textAlign:"left",letterSpacing:.6,whiteSpace:"nowrap"}}>{f.h}</th>)}
                <th style={{padding:`${pyV}px 10px`,fontSize:9,fontWeight:900,color:M.textD,borderBottom:`1px solid ${M.divider}`,letterSpacing:.6}}>STATUS</th>
                <th style={{padding:`${pyV}px 10px`,borderBottom:`1px solid ${M.divider}`}}/>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>{
                const sv=statusCol?r[statusCol]:"";const sc=SC[sv]||{bg:M.badgeBg,tx:M.badgeTx};
                return(
                  <tr key={i} style={{background:i%2===0?M.tblEven:M.tblOdd,borderBottom:`1px solid ${M.divider}`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?M.tblEven:M.tblOdd}>
                    <td style={{padding:`${pyV}px 10px`,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:M.textD}}>{String(i+1).padStart(2,"0")}</td>
                    {previewFields.map(f=>(
                      <td key={f.col} style={{padding:`${pyV}px 10px`,fontSize:fz-2,color:f.col===previewFields[0].col?A.a:M.textA,fontWeight:f.col===previewFields[0].col?700:400,fontFamily:["manual","autocode"].includes(f.type)?"'IBM Plex Mono',monospace":"inherit",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {r[f.col]||<span style={{color:M.textD,fontStyle:"italic"}}>—</span>}
                      </td>
                    ))}
                    <td style={{padding:`${pyV}px 10px`}}>{sv&&<span style={{background:sc.bg,color:sc.tx,borderRadius:3,padding:"2px 8px",fontSize:9,fontWeight:800}}>{sv}</span>}</td>
                    <td style={{padding:`${pyV}px 10px`}}><button onClick={()=>onLoad&&onLoad(r)} style={{padding:"3px 10px",background:M.surfLow,border:`1px solid ${M.inputBd}`,borderRadius:3,color:M.textB,fontSize:9,fontWeight:800,cursor:"pointer"}}>✏️ Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  BULK MASTER ENTRY  (Spreadsheet-style grid tab)
// ═══════════════════════════════════════════════════════════════════════
function BulkMasterEntry({master,M,A,fz,pyV,visibleCols}){
  const [rows,setRows]           = useState(()=>(master.mockRecords||[]).map((r,i)=>({...r,_id:i})));
  const [sortCol,setSortCol]     = useState(null);
  const [sortDir,setSortDir]     = useState("asc");
  const [editCell,setEditCell]   = useState(null);
  const [selectedRows,setSelected]= useState(new Set());

  const fields = visibleCols.map(c=>master.fields.find(f=>f.col===c)).filter(Boolean);

  const TYPE_BADGE={
    manual:  {bg:"#e0f2fe",tx:"#0369a1",label:"Manual"},
    autocode:{bg:"#fff7ed",tx:"#c2410c",label:"Manual"},
    text:    {bg:"#f1f5f9",tx:"#475569",label:"Text"},
    textarea:{bg:"#f1f5f9",tx:"#475569",label:"Text"},
    url:     {bg:"#dcfce7",tx:"#15803d",label:"URL"},
    auto:    {bg:"#fff7ed",tx:"#c2410c",label:"Auto"},
    calc:    {bg:"#faf5ff",tx:"#7c3aed",label:"∑ Calc"},
    fk:      {bg:"#eff6ff",tx:"#2563eb",label:"FK"},
    multifk: {bg:"#f5f3ff",tx:"#6d28d9",label:"Multi-FK"},
    dropdown:{bg:"#f0fdf4",tx:"#15803d",label:"Select"},
    number:  {bg:"#f8fafc",tx:"#475569",label:"Num"},
    currency:{bg:"#fefce8",tx:"#a16207",label:"₹"},
  };

  const addRow=()=>setRows(prev=>[...prev,{_id:Date.now()}]);
  const handleCell=(id,col,val)=>setRows(prev=>prev.map(r=>r._id===id?{...r,[col]:val}:r));
  const toggleRow=(id)=>setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>setSelected(selectedRows.size===rows.length?new Set():new Set(rows.map(r=>r._id)));

  const sorted=[...rows].sort((a,b)=>{
    if(!sortCol)return 0;
    const av=a[sortCol]||"",bv=b[sortCol]||"";
    return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);
  });

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>

      {/* ── Toolbar ── */}
      <div style={{padding:"8px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",gap:8,background:M.surfMid,flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={addRow} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",background:A.a,border:"none",borderRadius:5,color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>
          <span style={{fontSize:15,lineHeight:1}}>+</span> Add Row
        </button>
        <div style={{width:1,height:20,background:M.divider}}/>
        <button style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:M.inputBg,border:`1px solid ${M.inputBd}`,borderRadius:5,color:M.textB,fontSize:10,fontWeight:700,cursor:"pointer"}}>
          🔍 Filter
        </button>
        <button style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:M.inputBg,border:`1px solid ${M.inputBd}`,borderRadius:5,color:M.textB,fontSize:10,fontWeight:700,cursor:"pointer"}}>
          ↕ Sort
        </button>
        <div style={{display:"flex",alignItems:"center",background:M.inputBg,border:`1px solid ${M.inputBd}`,borderRadius:5,overflow:"hidden"}}>
          <select style={{padding:"5px 26px 5px 10px",background:"transparent",border:"none",color:M.textB,fontSize:10,fontWeight:700,cursor:"pointer",outline:"none",appearance:"none",WebkitAppearance:"none"}}>
            <option value="">Group by...</option>
            {fields.filter(f=>["fk","dropdown"].includes(f.type)).map(f=>(
              <option key={f.col} value={f.col}>{f.h}</option>
            ))}
          </select>
          <span style={{marginLeft:-22,pointerEvents:"none",fontSize:9,color:M.textD,paddingRight:8}}>▾</span>
        </div>
        <button style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:M.inputBg,border:`1px solid ${M.inputBd}`,borderRadius:5,color:M.textB,fontSize:10,fontWeight:700,cursor:"pointer"}}>
          ⊞ Columns
        </button>
        <div style={{flex:1}}/>
        <span style={{fontSize:9,color:M.textD,fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>{rows.length} rows · {master.cols} cols</span>
      </div>

      {/* ── Views bar ── */}
      <div style={{padding:"5px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",gap:8,background:M.surfHigh,flexShrink:0}}>
        <span style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:.8,textTransform:"uppercase"}}>VIEWS:</span>
        <div style={{display:"flex",alignItems:"center",gap:0,background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:4,overflow:"hidden"}}>
          <span style={{padding:"3px 10px",fontSize:9.5,fontWeight:900,color:"#dc2626",display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#dc2626",display:"inline-block",flexShrink:0}}/>
            Default
          </span>
          <span style={{padding:"2px 8px",background:"#dc2626",color:"#fff",fontSize:7.5,fontWeight:900,letterSpacing:.8,lineHeight:"20px"}}>LOCKED</span>
        </div>
        <button style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",background:M.inputBg,border:`1px dashed ${M.inputBd}`,borderRadius:4,color:M.textB,fontSize:9.5,fontWeight:700,cursor:"pointer"}}>
          + Save View
        </button>
      </div>

      {/* ── Spreadsheet Grid ── */}
      <div style={{flex:1,overflow:"auto"}}>
        <table style={{borderCollapse:"collapse",tableLayout:"fixed",minWidth:"100%"}}>
          <colgroup>
            <col style={{width:32}}/>
            <col style={{width:36}}/>
            {fields.map(f=>(
              <col key={f.col} style={{width:
                f.type==="url"||f.type==="multifk" ? 160 :
                f.type==="textarea" ? 200 :
                f.type==="manual"||f.type==="autocode" ? 120 :
                f.type==="text"&&f.h.length>15 ? 180 :
                150
              }}/>
            ))}
          </colgroup>

          {/* ── Column Headers ── */}
          <thead style={{position:"sticky",top:0,zIndex:10}}>
            <tr style={{background:M.tblHead}}>
              {/* Checkbox */}
              <th style={{padding:`${pyV}px 8px`,borderBottom:`2px solid ${M.divider}`,borderRight:`1px solid ${M.divider}`,textAlign:"center"}}>
                <div onClick={toggleAll} style={{width:15,height:15,borderRadius:3,border:`2px solid ${selectedRows.size===rows.length&&rows.length>0?A.a:M.inputBd}`,background:selectedRows.size===rows.length&&rows.length>0?A.a:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",transition:"all .1s"}}>
                  {selectedRows.size===rows.length&&rows.length>0&&<span style={{color:"#fff",fontSize:9,fontWeight:900,lineHeight:1}}>✓</span>}
                </div>
              </th>
              {/* # */}
              <th style={{padding:`${pyV}px 6px`,borderBottom:`2px solid ${M.divider}`,borderRight:`1px solid ${M.divider}`,fontSize:9,fontWeight:900,color:M.textD,textAlign:"center"}}>#</th>
              {/* Field headers */}
              {fields.map((f,fi)=>{
                const tb=TYPE_BADGE[f.type]||TYPE_BADGE.text;
                const isSort=sortCol===f.col;
                const isFirst=fi===0;
                return(
                  <th key={f.col}
                    onClick={()=>{setSortCol(f.col);setSortDir(p=>isSort&&p==="asc"?"desc":"asc");}}
                    style={{padding:`${pyV}px 8px`,borderBottom:`2px solid ${M.divider}`,borderRight:`1px solid ${M.divider}`,textAlign:"left",cursor:"pointer",userSelect:"none",background:M.tblHead,whiteSpace:"nowrap"}}
                    onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg}
                    onMouseLeave={e=>e.currentTarget.style.background=M.tblHead}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      {f.req&&<span style={{color:"#ef4444",fontSize:8,fontWeight:900,flexShrink:0}}>⚠</span>}
                      <span style={{fontSize:fz-2,fontWeight:700,color:isFirst?A.a:M.textA,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:110}}>{f.h}</span>
                      <span style={{background:tb.bg,color:tb.tx,borderRadius:3,padding:"1px 5px",fontSize:7,fontWeight:900,whiteSpace:"nowrap",flexShrink:0,letterSpacing:.3}}>{tb.label}</span>
                      <span style={{fontSize:9,color:isSort?A.a:M.textD,flexShrink:0}}>{isSort?(sortDir==="asc"?"↑":"↓"):"↕"}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── Rows ── */}
          <tbody>
            {sorted.map((row,i)=>(
              <tr key={row._id}
                style={{background:selectedRows.has(row._id)?A.al:i%2===0?M.tblEven:M.tblOdd,borderBottom:`1px solid ${M.divider}`}}
                onMouseEnter={e=>{if(!selectedRows.has(row._id))e.currentTarget.style.background=M.hoverBg;}}
                onMouseLeave={e=>{if(!selectedRows.has(row._id))e.currentTarget.style.background=i%2===0?M.tblEven:M.tblOdd;}}>
                {/* Checkbox */}
                <td style={{padding:`${pyV}px 8px`,borderRight:`1px solid ${M.divider}`,textAlign:"center"}}>
                  <div onClick={()=>toggleRow(row._id)} style={{width:15,height:15,borderRadius:3,border:`2px solid ${selectedRows.has(row._id)?A.a:M.inputBd}`,background:selectedRows.has(row._id)?A.a:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",transition:"all .1s"}}>
                    {selectedRows.has(row._id)&&<span style={{color:"#fff",fontSize:9,fontWeight:900,lineHeight:1}}>✓</span>}
                  </div>
                </td>
                {/* Row # */}
                <td style={{padding:`${pyV}px 6px`,borderRight:`1px solid ${M.divider}`,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:M.textD,textAlign:"center"}}>{String(i+1).padStart(2,"0")}</td>
                {/* Data cells */}
                {fields.map((f,fi)=>{
                  const isAuto=f.auto||["calc","autocode"].includes(f.type);
                  const val=row[f.col];
                  const isEditing=editCell?.rowId===row._id&&editCell?.col===f.col;
                  const isFirst=fi===0;
                  return(
                    <td key={f.col}
                      onClick={()=>!isAuto&&setEditCell({rowId:row._id,col:f.col})}
                      style={{padding:`${pyV-1}px 8px`,borderRight:`1px solid ${M.divider}`,cursor:isAuto?"default":"text",maxWidth:200,overflow:"hidden"}}>
                      {isAuto?(
                        <span style={{display:"inline-block",background:A.al,color:A.a,borderRadius:3,padding:"2px 8px",fontSize:fz-3,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace"}}>{val||"auto"}</span>
                      ):isEditing?(
                        <input autoFocus defaultValue={val||""}
                          onBlur={e=>{handleCell(row._id,f.col,e.target.value);setEditCell(null);}}
                          onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape"){handleCell(row._id,f.col,e.target.value);setEditCell(null);}}}
                          style={{width:"100%",border:`1.5px solid ${A.a}`,borderRadius:3,padding:"2px 6px",fontSize:fz-2,outline:"none",background:M.inputBg,color:M.textA,fontFamily:["manual","autocode"].includes(f.type)?"'IBM Plex Mono',monospace":"inherit"}}/>
                      ):val?(
                        <span style={{fontSize:fz-2,color:isFirst?A.a:M.textA,fontWeight:isFirst?700:400,fontFamily:["manual","autocode"].includes(f.type)?"'IBM Plex Mono',monospace":"inherit",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</span>
                      ):(
                        <span style={{fontSize:fz-3,color:M.textD,fontStyle:"italic"}}>{f.req?"⚠ required":"—"}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Add new row */}
            <tr>
              <td colSpan={fields.length+2} style={{padding:`${pyV}px 14px`,borderBottom:`1px solid ${M.divider}`}}>
                <button onClick={addRow} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",border:"none",color:M.textC,fontSize:11,fontWeight:700,cursor:"pointer",padding:"2px 0"}}>
                  <span style={{fontSize:14,lineHeight:1,color:M.textC}}>+</span> Add new row
                </button>
              </td>
            </tr>
          </tbody>

          {/* ── AGG Footer ── */}
          <tfoot>
            <tr style={{background:M.surfMid,borderTop:`2px solid ${M.divider}`}}>
              <td style={{padding:`${pyV}px 8px`,borderRight:`1px solid ${M.divider}`,textAlign:"center"}}>
                <span style={{fontSize:10,fontWeight:900,color:M.textD}}>Σ</span>
              </td>
              <td style={{padding:`${pyV}px 6px`,borderRight:`1px solid ${M.divider}`,fontSize:8,fontWeight:900,color:M.textD,textAlign:"center",whiteSpace:"nowrap"}}>AGG</td>
              {fields.map(f=>(
                <td key={f.col} style={{padding:`${pyV-1}px 4px`,borderRight:`1px solid ${M.divider}`}}>
                  <button style={{fontSize:8.5,color:M.textD,background:"transparent",border:`1px dashed ${M.inputBd}`,borderRadius:3,padding:"2px 8px",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>+ Calculate</button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  VIEW BUILDER MODAL  (create / edit a view)
// ═══════════════════════════════════════════════════════════════════════
function ViewBuilder({master,editView,onSave,onCancel,M,A,fz}){
  const allCols=master.fields.map(f=>f.col);
  const [name,setName]         = useState(editView?.name||"");
  const [icon,setIcon]         = useState(editView?.icon||"⚡");
  const [color,setColor]       = useState(editView?.color||A.a);
  const [desc,setDesc]         = useState(editView?.desc||"");
  const [selected,setSelected] = useState(editView?.fields?[...editView.fields]:allCols.filter(c=>{const f=master.fields.find(x=>x.col===c);return f&&f.req;}));
  const [pickFilter,setPickFilter] = useState("All");
  const [showIconPicker,setShowIconPicker] = useState(false);

  const PICK_FILTERS=[
    {id:"All",label:"All"},
    {id:"Mandatory",label:"⚠ Mand."},
    {id:"FK",label:"→ FK"},
    {id:"Auto",label:"← Auto"},
    {id:"Manual",label:"✍ Manual"},
    {id:"Pricing",label:"₹ Pricing"},
  ];
  const visibleForPick=master.fields.filter(f=>{
    if(pickFilter==="Mandatory") return f.req;
    if(pickFilter==="FK") return!!f.fk;
    if(pickFilter==="Auto") return f.auto||f.ico==="#";
    if(pickFilter==="Manual") return!f.auto&&f.ico!=="#"&&!f.fk&&!["calc","auto","autocode"].includes(f.type);
    if(pickFilter==="Pricing") return["Q","R","S","T","U","V","C","D","E"].includes(f.col);
    return true;
  });

  const toggle=(col)=>setSelected(p=>p.includes(col)?p.filter(c=>c!==col):[...p,col]);
  const selectAll=()=>setSelected(allCols);
  const clearAll=()=>setSelected([]);
  const selectFiltered=()=>setSelected(prev=>{const toAdd=visibleForPick.map(f=>f.col);return[...new Set([...prev,...toAdd])];});
  const clearFiltered=()=>setSelected(prev=>prev.filter(c=>!visibleForPick.map(f=>f.col).includes(c)));

  // Move selected field up/down in custom order
  const moveUp=(col)=>setSelected(prev=>{const i=prev.indexOf(col);if(i<=0)return prev;const n=[...prev];[n[i-1],n[i]]=[n[i],n[i-1]];return n;});
  const moveDown=(col)=>setSelected(prev=>{const i=prev.indexOf(col);if(i<0||i>=prev.length-1)return prev;const n=[...prev];[n[i],n[i+1]]=[n[i+1],n[i]];return n;});

  const canSave=name.trim().length>0&&selected.length>0;

  return(
    <>
      <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",zIndex:1100}}/>
      <div className="sc-anim" style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:760,maxHeight:"88vh",background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:12,zIndex:1101,boxShadow:M.shadow,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        
        {/* Header */}
        <div style={{background:color,padding:"12px 18px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:20}}>{icon}</span>
          <div><div style={{fontSize:14,fontWeight:900,color:"#fff"}}>{editView?"Edit View":"Create New View"}</div><div style={{fontSize:10,color:"rgba(255,255,255,.75)"}}>Select fields, set a name, and save to {master.id}</div></div>
          <button onClick={onCancel} style={{marginLeft:"auto",width:28,height:28,borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",cursor:"pointer",fontSize:14}}>×</button>
        </div>

        <div style={{flex:1,overflowY:"auto",display:"flex",gap:0}}>
          
          {/* LEFT — Meta */}
          <div style={{width:280,borderRight:`1px solid ${M.divider}`,padding:18,flexShrink:0,display:"flex",flexDirection:"column",gap:14}}>
            
            {/* Name */}
            <div>
              <div style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:.8,textTransform:"uppercase",marginBottom:5}}>View Name *</div>
              <div style={{display:"flex",gap:6}}>
                {/* Icon button */}
                <div style={{position:"relative"}}>
                  <button onClick={()=>setShowIconPicker(p=>!p)} style={{width:36,height:36,borderRadius:6,border:`1.5px solid ${showIconPicker?color:M.inputBd}`,background:M.inputBg,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</button>
                  {showIconPicker&&(
                    <div style={{position:"absolute",top:40,left:0,zIndex:10,background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,padding:8,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,boxShadow:M.shadow,width:180}}>
                      {VIEW_ICONS.map(ic=><button key={ic} onClick={()=>{setIcon(ic);setShowIconPicker(false);}} style={{width:30,height:30,borderRadius:5,border:icon===ic?`2px solid ${color}`:"2px solid transparent",background:icon===ic?`${color}20`:M.surfLow,cursor:"pointer",fontSize:15}}>{ic}</button>)}
                    </div>
                  )}
                </div>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="View name…" style={{flex:1,border:`1.5px solid ${M.inputBd}`,borderRadius:6,background:M.inputBg,color:M.textA,fontSize:fz,padding:"6px 10px",outline:"none",fontWeight:700}}/>
              </div>
            </div>

            {/* Color */}
            <div>
              <div style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:.8,textTransform:"uppercase",marginBottom:8}}>View Color</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {VIEW_COLORS.map(c=>(
                  <button key={c.v} onClick={()=>setColor(c.v)} title={c.l} style={{width:24,height:24,borderRadius:5,background:c.v,border:color===c.v?`3px solid ${M.textA}`:"3px solid transparent",cursor:"pointer",boxShadow:color===c.v?`0 0 0 1px ${c.v}`:"none"}}/>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:.8,textTransform:"uppercase",marginBottom:5}}>Description</div>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="What is this view for?" style={{width:"100%",border:`1.5px solid ${M.inputBd}`,borderRadius:6,background:M.inputBg,color:M.textA,fontSize:fz-2,padding:"6px 10px",outline:"none",resize:"none"}}/>
            </div>

            {/* Selected fields ordered list */}
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:.8,textTransform:"uppercase"}}>Field Order</div>
                <span style={{marginLeft:6,background:selected.length>0?color:M.badgeBg,color:selected.length>0?"#fff":M.badgeTx,borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:900}}>{selected.length}</span>
              </div>
              <div style={{maxHeight:160,overflowY:"auto",border:`1px solid ${M.divider}`,borderRadius:6,background:M.surfLow}}>
                {selected.length===0?(
                  <div style={{padding:"20px 12px",textAlign:"center",fontSize:10,color:M.textD,fontStyle:"italic"}}>No fields selected yet</div>
                ):(
                  selected.map((col,idx)=>{
                    const f=master.fields.find(x=>x.col===col);if(!f)return null;
                    return(
                      <div key={col} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderBottom:`1px solid ${M.divider}`,background:M.surfHigh}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,fontWeight:700,color:M.textD,width:22}}>{col}</span>
                        <span style={{flex:1,fontSize:9.5,fontWeight:700,color:M.textA,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.h}</span>
                        <button onClick={()=>moveUp(col)} disabled={idx===0} style={{width:18,height:18,borderRadius:3,border:"none",background:M.surfLow,cursor:idx===0?"default":"pointer",color:M.textD,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===0?.3:1}}>↑</button>
                        <button onClick={()=>moveDown(col)} disabled={idx===selected.length-1} style={{width:18,height:18,borderRadius:3,border:"none",background:M.surfLow,cursor:idx===selected.length-1?"default":"pointer",color:M.textD,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===selected.length-1?.3:1}}>↓</button>
                        <button onClick={()=>toggle(col)} style={{width:18,height:18,borderRadius:3,border:"none",background:"#fef2f2",cursor:"pointer",color:"#ef4444",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Field picker */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${M.divider}`,background:M.surfMid,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:.8,textTransform:"uppercase"}}>Field Picker</div>
                <span style={{fontSize:9,color:M.textC}}>— check to include, drag arrows to reorder</span>
              </div>
              {/* Filter tabs */}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                {PICK_FILTERS.map(pf=>(
                  <button key={pf.id} onClick={()=>setPickFilter(pf.id)} style={{padding:"3px 10px",borderRadius:20,border:`1.5px solid ${pickFilter===pf.id?color:M.inputBd}`,background:pickFilter===pf.id?color:M.inputBg,color:pickFilter===pf.id?"#fff":M.textB,fontSize:9.5,fontWeight:800,cursor:"pointer"}}>{pf.label}</button>
                ))}
                <span style={{flex:1}}/>
                <button onClick={selectAll} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${M.inputBd}`,background:M.inputBg,color:M.textB,fontSize:9,fontWeight:700,cursor:"pointer"}}>Select All</button>
                <button onClick={clearAll} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${M.inputBd}`,background:M.inputBg,color:M.textB,fontSize:9,fontWeight:700,cursor:"pointer"}}>Clear All</button>
                <button onClick={selectFiltered} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${color}`,background:`${color}10`,color:color,fontSize:9,fontWeight:700,cursor:"pointer"}}>+ Filter</button>
                <button onClick={clearFiltered} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${M.inputBd}`,background:M.inputBg,color:M.textB,fontSize:9,fontWeight:700,cursor:"pointer"}}>− Filter</button>
              </div>
              <div style={{fontSize:8.5,color:M.textD}}>{visibleForPick.length} fields shown · {selected.length} of {master.cols} selected</div>
            </div>
            
            {/* Field list */}
            <div style={{flex:1,overflowY:"auto"}}>
              {visibleForPick.map((f,i)=>{
                const isSel=selected.includes(f.col);
                const isAuto=f.auto||["calc","autocode"].includes(f.type);
                return(
                  <div key={f.col} onClick={()=>toggle(f.col)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"7px 14px",borderBottom:`1px solid ${M.divider}`,cursor:"pointer",background:isSel?`${color}08`:i%2===0?M.tblEven:M.tblOdd,borderLeft:`3px solid ${isSel?color:"transparent"}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=isSel?`${color}15`:M.hoverBg}
                    onMouseLeave={e=>e.currentTarget.style.background=isSel?`${color}08`:i%2===0?M.tblEven:M.tblOdd}>
                    {/* Checkbox */}
                    <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${isSel?color:M.inputBd}`,background:isSel?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .1s"}}>
                      {isSel&&<span style={{color:"#fff",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
                    </div>
                    {/* Col */}
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:M.textD,width:22,flexShrink:0}}>{f.col}</span>
                    {/* Icon */}
                    <span style={{width:20,textAlign:"center",flexShrink:0}}><IcoCell ico={f.ico} A={{a:color}}/></span>
                    {/* Name */}
                    <span style={{flex:1,fontSize:fz-2,fontWeight:isSel?700:400,color:isSel?M.textA:M.textB}}>{f.h}</span>
                    {/* Badges */}
                    <DtBadge type={f.type}/>
                    {f.req&&<span style={{background:"#fef2f2",color:"#ef4444",borderRadius:3,padding:"1px 6px",fontSize:8,fontWeight:900}}>MAND</span>}
                    {isAuto&&<span style={{background:A.al,color:A.a,borderRadius:3,padding:"1px 6px",fontSize:8,fontWeight:900}}>AUTO</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:"12px 18px",borderTop:`1px solid ${M.divider}`,display:"flex",alignItems:"center",gap:8,background:M.surfMid,flexShrink:0}}>
          {!canSave&&<span style={{fontSize:10,color:"#f59e0b",fontWeight:700}}>⚠ Enter a name and select at least 1 field</span>}
          <div style={{flex:1}}/>
          <button onClick={onCancel} style={{padding:"8px 18px",border:`1px solid ${M.inputBd}`,borderRadius:6,background:M.inputBg,color:M.textB,fontSize:11,fontWeight:800,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>canSave&&onSave({name:name.trim(),icon,color,desc,fields:selected})} disabled={!canSave} style={{padding:"8px 22px",border:"none",borderRadius:6,background:canSave?color:M.badgeBg,color:canSave?"#fff":M.textD,fontSize:11,fontWeight:900,cursor:canSave?"pointer":"default",opacity:canSave?1:.7}}>
            {editView?"💾 Save Changes":"✨ Create View"}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  VIEWS PANEL  (slide-in right panel — Notion-style view switcher)
// ═══════════════════════════════════════════════════════════════════════
function ViewsPanel({master,views,activeId,onActivate,onEdit,onDuplicate,onDelete,onNew,onClose,M,A,fz}){
  const [hoverId,setHoverId]=useState(null);
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",backdropFilter:"blur(1px)",zIndex:800}}/>
      <div className="sp-anim" style={{position:"fixed",right:0,top:0,bottom:0,width:340,background:M.surfHigh,borderLeft:`1px solid ${M.divider}`,zIndex:801,display:"flex",flexDirection:"column",boxShadow:M.shadow}}>
        {/* Header */}
        <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"flex-start",gap:8}}>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:M.textA}}>🔖 Saved Views</div>
            <div style={{fontSize:9.5,color:M.textC,marginTop:2}}>{master.id} · {views.length} view{views.length!==1?"s":""}</div>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto",width:28,height:28,borderRadius:6,border:`1px solid ${M.inputBd}`,background:M.inputBg,cursor:"pointer",fontSize:13,color:M.textB}}>×</button>
        </div>

        {/* Explanation */}
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${M.divider}`,background:A.al}}>
          <div style={{fontSize:10,color:M.textA,lineHeight:1.55}}>
            <span style={{fontWeight:900}}>Views</span> save a custom selection of fields for this master. Switch views to show only the fields relevant to a specific entry task — like Notion database views.
          </div>
        </div>

        {/* View list */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {views.map(v=>{
            const isActive=activeId===v.id;
            const isHover=hoverId===v.id;
            const fieldCount=v.fields.length;
            const sysLabel=v.isSystem?"SYSTEM":"CUSTOM";
            return(
              <div key={v.id}
                onMouseEnter={()=>setHoverId(v.id)}
                onMouseLeave={()=>setHoverId(null)}
                style={{padding:"10px 16px",borderBottom:`1px solid ${M.divider}`,background:isActive?`${v.color}10`:isHover?M.hoverBg:M.surfHigh,borderLeft:`4px solid ${isActive?v.color:"transparent"}`,cursor:"pointer",transition:"all .12s"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}} onClick={()=>onActivate(isActive?null:v.id)}>
                  <span style={{fontSize:20}}>{v.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:12,fontWeight:isActive?900:700,color:isActive?v.color:M.textA}}>{v.name}</span>
                      {isActive&&<span style={{background:v.color,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:8.5,fontWeight:900}}>ACTIVE</span>}
                      <span style={{background:v.isSystem?"#e0f2fe":"#ede9fe",color:v.isSystem?"#0369a1":"#6d28d9",borderRadius:3,padding:"1px 5px",fontSize:7.5,fontWeight:900,marginLeft:"auto"}}>{sysLabel}</span>
                    </div>
                    {v.desc&&<div style={{fontSize:9.5,color:M.textC,marginTop:1,lineHeight:1.4}}>{v.desc}</div>}
                    <div style={{display:"flex",gap:8,marginTop:3,alignItems:"center"}}>
                      <span style={{display:"inline-block",width:10,height:10,borderRadius:2,background:v.color,flexShrink:0}}/>
                      <span style={{fontSize:9,color:M.textD,fontFamily:"'IBM Plex Mono',monospace"}}>{fieldCount} field{fieldCount!==1?"s":""}</span>
                      {/* Field mini-preview */}
                      <div style={{display:"flex",gap:2,flex:1,overflow:"hidden"}}>
                        {v.fields.slice(0,6).map(c=>{
                          const f=master.fields.find(x=>x.col===c);
                          return f?<span key={c} style={{fontSize:7.5,background:M.badgeBg,color:M.badgeTx,borderRadius:2,padding:"1px 4px",whiteSpace:"nowrap",fontFamily:"'IBM Plex Mono',monospace"}}>{c}</span>:null;
                        })}
                        {v.fields.length>6&&<span style={{fontSize:7.5,color:M.textD}}>+{v.fields.length-6}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action buttons on hover */}
                {isHover&&(
                  <div style={{display:"flex",gap:4,marginTop:8,paddingTop:6,borderTop:`1px solid ${M.divider}`}}>
                    <button onClick={e=>{e.stopPropagation();onActivate(isActive?null:v.id);}} style={{flex:2,padding:"4px 8px",border:`1px solid ${isActive?"#ef4444":v.color}`,borderRadius:4,background:isActive?"#fef2f2":`${v.color}15`,color:isActive?"#ef4444":v.color,fontSize:9,fontWeight:900,cursor:"pointer"}}>{isActive?"✕ Deactivate":"✓ Activate"}</button>
                    <button onClick={e=>{e.stopPropagation();onEdit(v);}} style={{flex:1,padding:"4px 8px",border:`1px solid ${M.inputBd}`,borderRadius:4,background:M.inputBg,color:M.textB,fontSize:9,fontWeight:800,cursor:"pointer"}}>✏ Edit</button>
                    <button onClick={e=>{e.stopPropagation();onDuplicate(v);}} style={{flex:1,padding:"4px 8px",border:`1px solid ${M.inputBd}`,borderRadius:4,background:M.inputBg,color:M.textB,fontSize:9,fontWeight:800,cursor:"pointer"}}>⧉ Dup</button>
                    {!v.isSystem&&<button onClick={e=>{e.stopPropagation();onDelete(v.id);}} style={{width:30,padding:"4px",border:"1px solid #fecaca",borderRadius:4,background:"#fef2f2",color:"#ef4444",fontSize:9,fontWeight:800,cursor:"pointer"}}>🗑</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{padding:"12px 16px",borderTop:`1px solid ${M.divider}`,background:M.surfMid}}>
          <button onClick={onNew} style={{width:"100%",padding:"9px",border:`2px dashed ${A.a}`,borderRadius:7,background:A.al,color:A.a,fontSize:11,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span style={{fontSize:16}}>+</span> Create New View
          </button>
          <div style={{fontSize:8.5,color:M.textD,textAlign:"center",marginTop:6}}>Views are saved per master. In production, GAS syncs views to a config sheet.</div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════════════
export default function App(){
  const [cfg,setCfg]     = useState({...DEFAULTS});
  const [draft,setDraft] = useState({...DEFAULTS});
  const [showSP,setShowSP]   = useState(false);
  const [sel,setSel]         = useState("ARTICLE_MASTER");
  const [mainTab,setMainTab] = useState("entry");
  const [entryMode,setEntryMode] = useState("form");
  const [openSec,setOpenSec] = useState(["identity","all"]);
  const [formData,setFormData] = useState({});
  const [errors,setErrors]   = useState({});
  const [isDirty,setIsDirty] = useState(false);
  const [showPrev,setShowPrev]  = useState(false);
  const [toast,setToast]        = useState(null);

  // ── Views state ──────────────────────────────────────────────────────
  const [views,setViews]             = useState(()=>{ const v={}; MASTERS.forEach(m=>{v[m.id]=makeDefaultViews(m);}); return v; });
  const [activeViewId,setActiveViewId] = useState({});   // { masterId → viewId | null }
  const [showViewsPanel,setShowViewsPanel] = useState(false);
  const [showViewBuilder,setShowViewBuilder] = useState(false);
  const [editingView,setEditingView]   = useState(null);  // view object being edited, or null for create

  const M  = MODES[cfg.mode];
  const A  = ACCENTS[cfg.accent];
  const fz = FS[cfg.fontSize];
  const pyV= PY[cfg.density];
  const {width:sbW,dragging:sbDrag,onMouseDown:onSbDrag} = useDrag(200,160,320);
  const master = MASTERS.find(m=>m.id===sel);

  // Current view
  const masterViews    = views[sel]||[];
  const curViewId      = activeViewId[sel]||null;
  const currentView    = curViewId ? masterViews.find(v=>v.id===curViewId) : null;
  const visibleCols    = currentView ? currentView.fields : (master?.fields||[]).map(f=>f.col);

  useEffect(()=>{
    setFormData({}); setErrors({}); setIsDirty(false);
    setOpenSec(master?.sections?.map(s=>s.id)||["all"]);
  },[sel]);

  const handleField=(col,val)=>{ setIsDirty(true); setErrors(p=>{const e={...p};delete e[col];return e;}); setFormData(prev=>computeAutos(sel,col,val,prev)); };
  const toggleSec=(id)=>setOpenSec(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const validate=()=>{
    const errs={};
    (master?.fields||[]).filter(f=>f.req).forEach(f=>{
      const v=formData[f.col];
      if(!v||String(v).trim()==="") errs[f.col]=`${f.h} is required`;
      if(f.type==="manual"&&f.col==="A"&&sel==="ARTICLE_MASTER"){ if(!/^\d{4,5}[A-Z]{2}$/.test(v||"")) errs[f.col]="Format: 5249HP"; }
    });
    if(Object.keys(errs).length>0){ setErrors(errs); const errCols=Object.keys(errs); const toOpen=(master?.sections||[]).filter(s=>s.cols.some(c=>errCols.includes(c))).map(s=>s.id); setOpenSec(p=>[...new Set([...p,...toOpen])]); return false; }
    return true;
  };
  const handleSave=()=>{ if(validate())setShowPrev(true); };
  const handleConfirmSave=()=>{ setShowPrev(false); setToast(`✅ ${formData[master?.fields?.[0]?.col]||"Record"} saved to ${sel}`); setFormData({}); setErrors({}); setIsDirty(false); setTimeout(()=>setToast(null),4000); };
  const loadRecord=(rec)=>{ setFormData(rec); setErrors({}); setIsDirty(true); setMainTab("entry"); };

  // ── View CRUD ─────────────────────────────────────────────────────────
  const activateView=(id)=>setActiveViewId(p=>({...p,[sel]:id}));

  const saveView=(vdata)=>{
    const ts=Date.now();
    if(editingView){
      setViews(prev=>({...prev,[sel]:prev[sel].map(v=>v.id===editingView.id?{...v,...vdata}:v)}));
      setToast(`💾 View "${vdata.name}" updated`);
    } else {
      const newV={...vdata,id:`custom-${ts}`,masterId:sel,isSystem:false,createdAt:new Date().toLocaleDateString("en-IN")};
      setViews(prev=>({...prev,[sel]:[...prev[sel],newV]}));
      setActiveViewId(p=>({...p,[sel]:`custom-${ts}`}));
      setToast(`✨ View "${vdata.name}" created & activated`);
    }
    setShowViewBuilder(false); setEditingView(null); setTimeout(()=>setToast(null),4000);
  };

  const duplicateView=(v)=>{
    const ts=Date.now();
    const dup={...v,id:`dup-${ts}`,name:`${v.name} (copy)`,isSystem:false,fields:[...v.fields],createdAt:new Date().toLocaleDateString("en-IN")};
    setViews(prev=>({...prev,[sel]:[...prev[sel],dup]}));
    setToast(`⧉ "${v.name}" duplicated`); setTimeout(()=>setToast(null),3000);
  };

  const deleteView=(id)=>{
    setViews(prev=>({...prev,[sel]:prev[sel].filter(v=>v.id!==id)}));
    if(activeViewId[sel]===id) setActiveViewId(p=>({...p,[sel]:null}));
    setToast("🗑 View deleted"); setTimeout(()=>setToast(null),3000);
  };

  const openEdit=(v)=>{ setEditingView(v); setShowViewBuilder(true); setShowViewsPanel(false); };
  const openNew=()=>{ setEditingView(null); setShowViewBuilder(true); setShowViewsPanel(false); };

  const stats={
    mandatory:(master?.fields||[]).filter(f=>f.req).length,
    auto:(master?.fields||[]).filter(f=>f.auto||f.ico==="#").length,
    fk:(master?.fields||[]).filter(f=>f.fk).length,
    filled:Object.keys(formData).filter(k=>formData[k]).length,
  };

  const MAIN_TABS=[
    {id:"entry",   label:"✍ Data Entry",       badge:isDirty?"●":null},
    {id:"specs",   label:"📋 Field Specs",      badge:`${master?.cols}`},
    {id:"records", label:"📊 Records",          badge:`${(master?.mockRecords||[]).length}`},
    {id:"bulk",    label:"⚡ Bulk Master Entry", badge:null},
  ];

  const EntryFooter=()=>(
    <div style={{padding:"8px 14px",borderTop:`1px solid ${M.divider}`,display:"flex",alignItems:"center",gap:8,background:M.surfMid,flexShrink:0}}>
      {isDirty&&<span style={{fontSize:9,color:"#f59e0b",fontWeight:900}}>● Unsaved changes</span>}
      <div style={{flex:1}}/>
      <button onClick={()=>{setFormData({});setErrors({});setIsDirty(false);}} style={{padding:"6px 14px",border:`1px solid ${M.inputBd}`,borderRadius:5,background:M.inputBg,color:M.textB,fontSize:10,fontWeight:800,cursor:"pointer"}}>↺ Clear</button>
      <button style={{padding:"6px 14px",border:`1px solid ${A.a}`,borderRadius:5,background:M.inputBg,color:A.a,fontSize:10,fontWeight:800,cursor:"pointer"}}>💾 Save Draft</button>
      <button onClick={handleSave} style={{padding:"6px 20px",border:"none",borderRadius:5,background:A.a,color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>✓ Confirm & Save to Sheet</button>
    </div>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────
  return(
    <div className="theme-anim" style={{width:"100vw",height:"100vh",overflow:"hidden",display:"flex",flexDirection:"column",background:M.bg,fontFamily:"'Nunito Sans',sans-serif"}}>
      <GlobalStyles thumb={M.scrollThumb}/>

      {/* ══ SHELL BAR ══ */}
      <div style={{height:48,background:M.shellBg,borderBottom:`1px solid ${M.shellBd}`,display:"flex",alignItems:"center",padding:"0 14px",gap:10,flexShrink:0,zIndex:200,boxShadow:M.shadow}}>
        <div style={{display:"flex",alignItems:"center",gap:8,paddingRight:12,borderRight:`1px solid ${M.divider}`,flexShrink:0}}>
          <div style={{width:30,height:30,background:A.a,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🗂️</div>
          <div><div style={{fontSize:12,fontWeight:900,color:A.a,lineHeight:1}}>CC ERP</div><div style={{fontSize:7.5,color:M.textD,letterSpacing:.5,lineHeight:1.2}}>CONFIDENCE CLOTHING</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
          <span style={{color:M.textC}}>Home</span><span style={{color:M.textD}}>›</span>
          <span style={{color:M.textC}}>FILE 1A</span><span style={{color:M.textD}}>›</span>
          <span style={{color:A.a,fontWeight:700}}>Master Data Entry{isDirty?" ●":""}</span>
        </div>
        <div style={{flex:1}}/>
        <div style={{background:A.a,color:A.tx,borderRadius:5,padding:"4px 12px",fontSize:10,fontWeight:900}}>{MASTERS.length} MASTERS — FILE 1A</div>
        <div style={{display:"flex",flexDirection:"column",gap:1}}>
          <div style={{fontSize:7.5,fontWeight:900,color:M.textD,letterSpacing:.8,textTransform:"uppercase"}}>THEME</div>
          <div style={{display:"flex",background:M.surfLow,border:`1px solid ${M.shellBd}`,borderRadius:5,padding:2,gap:1}}>
            {Object.entries(MODES).map(([id,mo])=>(
              <button key={id} onClick={()=>{setCfg(p=>({...p,mode:id}));setDraft(p=>({...p,mode:id}));}} title={mo.label} style={{width:22,height:22,borderRadius:3,border:cfg.mode===id?`2px solid ${A.a}`:"2px solid transparent",background:cfg.mode===id?A.al:"transparent",cursor:"pointer",fontSize:12}}>{mo.label.split(" ")[0]}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:1}}>
          <div style={{fontSize:7.5,fontWeight:900,color:M.textD,letterSpacing:.8,textTransform:"uppercase"}}>ACCENT</div>
          <div style={{display:"flex",background:M.surfLow,border:`1px solid ${M.shellBd}`,borderRadius:5,padding:"4px 5px",gap:4}}>
            {Object.entries(ACCENTS).map(([id,ac])=>(
              <button key={id} onClick={()=>{setCfg(p=>({...p,accent:id}));setDraft(p=>({...p,accent:id}));}} title={ac.label} style={{width:14,height:14,borderRadius:"50%",background:ac.a,border:cfg.accent===id?`2px solid ${M.textA}`:"2px solid transparent",cursor:"pointer"}}/>
            ))}
          </div>
        </div>
        <button onClick={()=>{setShowSP(!showSP);setDraft({...cfg});}} style={{width:34,height:34,borderRadius:6,border:"none",cursor:"pointer",fontSize:16,background:showSP?A.a:M.surfLow,color:showSP?A.tx:M.textB}}>⚙️</button>
        <div style={{display:"flex",alignItems:"center"}}>
          {["SA","MK","RD"].map((init,i)=>(
            <div key={init} style={{width:26,height:26,borderRadius:"50%",background:[A.a,"#2563eb","#7c3aed"][i],color:"#fff",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${M.shellBg}`,marginLeft:i>0?-6:0}}>{init}</div>
          ))}
          <span style={{fontSize:9,color:M.textC,marginLeft:8}}>3 online</span>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── LEFT NAVIGATOR ── */}
        <div style={{width:sbW,background:M.sidebarBg,borderRight:`1px solid ${M.sidebarBd}`,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
          <div style={{padding:"6px 12px",background:M.surfMid,borderBottom:`1px solid ${M.sidebarBd}`,flexShrink:0}}>
            <div style={{fontSize:8.5,fontWeight:900,color:M.textD,letterSpacing:1.4,textTransform:"uppercase"}}>ITEM MASTERS</div>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {MASTERS.filter(m=>m.group==="item").map(m=>{
              const active=sel===m.id;
              const mv=activeViewId[m.id];
              const mViews=views[m.id]||[];
              const vCount=mViews.length;
              return(
                <button key={m.id} onClick={()=>setSel(m.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:`${pyV+1}px 12px`,background:active?`${A.a}15`:"transparent",borderLeft:`3px solid ${active?A.a:"transparent"}`,borderBottom:`1px solid ${M.sidebarBd}`,border:"none",cursor:"pointer"}}>
                  <span style={{fontSize:15,flexShrink:0}}>{m.icon}</span>
                  <div style={{flex:1,textAlign:"left",overflow:"hidden"}}>
                    <div style={{fontSize:9.5,fontWeight:900,color:active?A.a:M.textA,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.id}</div>
                    <div style={{fontSize:7.5,color:M.textD,fontFamily:"'IBM Plex Mono',monospace",marginTop:1}}>
                      {mv&&mViews.find(v=>v.id===mv)?<span style={{color:mViews.find(v=>v.id===mv).color}}>🔖 {mViews.find(v=>v.id===mv).name}</span>:m.codeFormat}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                    <span style={{fontSize:8.5,fontWeight:900,color:active?A.a:M.textD,background:active?A.al:M.surfLow,borderRadius:10,padding:"2px 6px"}}>{m.cols}</span>
                    <span style={{fontSize:7.5,color:M.textD}}>🔖{vCount}</span>
                  </div>
                </button>
              );
            })}
            <div style={{padding:"5px 12px 3px",background:M.surfMid,borderBottom:`1px solid ${M.sidebarBd}`,borderTop:`1px solid ${M.sidebarBd}`}}>
              <div style={{fontSize:8.5,fontWeight:900,color:M.textD,letterSpacing:1.4,textTransform:"uppercase"}}>LOOKUP MASTERS</div>
            </div>
            {MASTERS.filter(m=>m.group==="lookup").map(m=>{
              const active=sel===m.id;
              return(
                <button key={m.id} onClick={()=>setSel(m.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:`${pyV+1}px 12px`,background:active?`${A.a}15`:"transparent",borderLeft:`3px solid ${active?A.a:"transparent"}`,borderBottom:`1px solid ${M.sidebarBd}`,border:"none",cursor:"pointer"}}>
                  <span style={{fontSize:15,flexShrink:0}}>{m.icon}</span>
                  <div style={{flex:1,textAlign:"left",overflow:"hidden"}}>
                    <div style={{fontSize:9.5,fontWeight:900,color:active?A.a:M.textA,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.id}</div>
                    <div style={{fontSize:7.5,color:M.textD,fontFamily:"'IBM Plex Mono',monospace",marginTop:1}}>{m.codeFormat}</div>
                  </div>
                  <span style={{fontSize:8.5,fontWeight:900,color:active?A.a:M.textD,background:active?A.al:M.surfLow,borderRadius:10,padding:"2px 6px"}}>{m.cols}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DRAG HANDLE ── */}
        <div onMouseDown={onSbDrag} style={{width:5,cursor:"col-resize",background:sbDrag?`${A.a}25`:"transparent",borderLeft:`1px solid ${sbDrag?A.a:M.sidebarBd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <div style={{width:2,height:60,background:sbDrag?A.a:M.sidebarBd,borderRadius:2}}/>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Master header */}
          <div style={{padding:"10px 16px 0",background:M.surfHigh,borderBottom:`1px solid ${M.divider}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{fontSize:18,fontWeight:900,color:M.textA}}>{master?.id}</span>
              <span style={{background:A.al,border:`1px solid ${A.a}40`,color:A.a,borderRadius:4,padding:"2px 9px",fontSize:10,fontWeight:900,fontFamily:"'IBM Plex Mono',monospace"}}>{master?.cols} COLS</span>
              <span style={{background:M.badgeBg,color:M.badgeTx,borderRadius:4,padding:"2px 9px",fontSize:10,fontWeight:700}}>{master?.codeFormat}</span>
              <span style={{fontSize:10,color:M.textC}}>{master?.desc}</span>
              <div style={{marginLeft:"auto",display:"flex",gap:5}}>
                {[{l:"MANDATORY",v:stats.mandatory,c:"#ef4444"},{l:"AUTO/GAS",v:stats.auto,c:A.a},{l:"FK",v:stats.fk,c:"#2563eb"},{l:"FILLED",v:stats.filled,c:"#15803d"}].map(s=>(
                  <div key={s.l} style={{background:M.surfLow,border:`1px solid ${M.divider}`,borderRadius:5,padding:"4px 10px",textAlign:"center",minWidth:44}}>
                    <div style={{fontSize:14,fontWeight:900,color:s.c,fontFamily:"'IBM Plex Mono',monospace"}}>{s.v}</div>
                    <div style={{fontSize:7.5,fontWeight:900,color:M.textD,letterSpacing:.6,textTransform:"uppercase"}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── TAB BAR ── */}
            <div style={{display:"flex",alignItems:"flex-end",gap:0,borderBottom:`1px solid ${M.divider}`,marginBottom:0}}>
              {MAIN_TABS.map(t=>{
                const active=mainTab===t.id;
                return(
                  <button key={t.id} onClick={()=>setMainTab(t.id)} style={{padding:"8px 18px",border:"none",cursor:"pointer",background:active?M.surfHigh:M.surfLow,borderTop:`2px solid ${active?A.a:"transparent"}`,borderRight:`1px solid ${active?M.divider:"transparent"}`,borderLeft:`1px solid ${active?M.divider:"transparent"}`,borderBottom:`1px solid ${active?M.surfHigh:M.divider}`,marginBottom:active?-1:0,borderRadius:"5px 5px 0 0",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:11,fontWeight:active?900:700,color:active?A.a:M.textC}}>{t.label}</span>
                    {t.badge&&<span style={{background:active?A.a:M.badgeBg,color:active?A.tx:M.badgeTx,borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:900}}>{t.badge}</span>}
                  </button>
                );
              })}

              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,paddingBottom:6,paddingRight:2}}>
                {/* Views button */}
                <button onClick={()=>setShowViewsPanel(true)} style={{
                  display:"flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:5,
                  border:`1.5px solid ${currentView?currentView.color:M.inputBd}`,
                  background:currentView?`${currentView.color}15`:M.inputBg,
                  color:currentView?currentView.color:M.textB,
                  fontSize:10,fontWeight:900,cursor:"pointer",height:28,
                }}>
                  <span style={{fontSize:13}}>{currentView?currentView.icon:"🔖"}</span>
                  <span>{currentView?currentView.name:"Views"}</span>
                  <span style={{background:currentView?currentView.color:M.badgeBg,color:currentView?"#fff":M.badgeTx,borderRadius:10,padding:"1px 6px",fontSize:8.5,fontWeight:900}}>{masterViews.length}</span>
                </button>

                {/* Entry mode toggle */}
                {mainTab==="entry"&&(
                  <>
                    <div style={{width:1,height:16,background:M.divider}}/>
                    <div style={{display:"flex",background:M.surfLow,border:`1px solid ${M.inputBd}`,borderRadius:5,overflow:"hidden"}}>
                      {[{id:"form",label:"📋 Form"},{id:"inline",label:"⚡ Inline"}].map(v=>(
                        <button key={v.id} onClick={()=>setEntryMode(v.id)} style={{padding:"4px 12px",border:"none",cursor:"pointer",fontSize:9.5,fontWeight:entryMode===v.id?900:700,background:entryMode===v.id?A.a:M.surfLow,color:entryMode===v.id?A.tx:M.textC,transition:"all .15s"}}>{v.label}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── ACTIVE VIEW BANNER ── */}
          {currentView&&(
            <div style={{padding:"5px 16px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${M.divider}`,background:`${currentView.color}09`,flexShrink:0}}>
              <div style={{width:3,height:14,background:currentView.color,borderRadius:2,flexShrink:0}}/>
              <span style={{fontSize:10,fontWeight:900,color:currentView.color}}>🔖 VIEW:</span>
              <span style={{fontSize:12}}>{currentView.icon}</span>
              <span style={{fontSize:10,fontWeight:900,color:M.textA}}>{currentView.name}</span>
              {currentView.desc&&<span style={{fontSize:9.5,color:M.textC}}>— {currentView.desc}</span>}
              <span style={{background:currentView.color,color:"#fff",borderRadius:10,padding:"1px 8px",fontSize:9,fontWeight:900}}>{currentView.fields.length} of {master?.cols} fields</span>
              <div style={{flex:1}}/>
              <button onClick={()=>openEdit(currentView)} style={{padding:"3px 10px",border:`1px solid ${currentView.color}`,borderRadius:4,background:`${currentView.color}10`,color:currentView.color,fontSize:9,fontWeight:800,cursor:"pointer"}}>✏ Edit</button>
              <button onClick={()=>activateView(null)} style={{padding:"3px 10px",border:"1px solid #ef4444",borderRadius:4,background:"#fef2f2",color:"#ef4444",fontSize:9,fontWeight:800,cursor:"pointer"}}>✕ Clear view</button>
            </div>
          )}

          {/* ── TAB CONTENT ── */}
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            {mainTab==="entry"&&(
              <>
                <div style={{flex:1,overflowY:"auto"}}>
                  {entryMode==="form"
                    ?<FormView master={master} formData={formData} onChange={handleField} errors={errors} openSec={openSec} toggleSec={toggleSec} M={M} A={A} fz={fz} pyV={pyV} visibleCols={visibleCols}/>
                    :<InlineView master={master} formData={formData} onChange={handleField} errors={errors} M={M} A={A} fz={fz} pyV={pyV} tblStyle={cfg.tblStyle} visibleCols={visibleCols}/>
                  }
                </div>
                <EntryFooter/>
              </>
            )}
            {mainTab==="specs"&&<SpecTable master={master} M={M} A={A} fz={fz} pyV={pyV} tblStyle={cfg.tblStyle}/>}
            {mainTab==="records"&&<RecordsTab master={master} M={M} A={A} fz={fz} pyV={pyV} onLoad={loadRecord}/>}
            {mainTab==="bulk"&&<BulkMasterEntry master={master} M={M} A={A} fz={fz} pyV={pyV} visibleCols={visibleCols}/>}
          </div>

          {/* STATUS BAR */}
          {cfg.showStatusBar&&(
            <div style={{background:M.statusBg,borderTop:`1px solid ${M.sidebarBd}`,padding:"4px 16px",display:"flex",alignItems:"center",gap:18,flexShrink:0}}>
              {[{l:"MASTER",v:master?.id},{l:"COLS",v:master?.cols},{l:"VIEW",v:currentView?currentView.name:"All Fields"},{l:"SHOWING",v:`${visibleCols.length} fields`},{l:"TAB",v:mainTab.toUpperCase()},{l:"MODE",v:mainTab==="entry"?entryMode.toUpperCase():"-"},{l:"FILLED",v:`${stats.filled}`},{l:"MAND",v:stats.mandatory}].map(s=>(
                <div key={s.l} style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:7.5,fontWeight:900,color:M.textD,letterSpacing:1,textTransform:"uppercase"}}>{s.l}</span>
                  <span style={{fontSize:10,fontWeight:900,color:M.textB,fontFamily:"'IBM Plex Mono',monospace"}}>{s.v}</span>
                </div>
              ))}
              <div style={{flex:1,textAlign:"right",fontSize:8.5,color:M.textD,fontFamily:"'IBM Plex Mono',monospace"}}>CC ERP · FILE 1A · {MODES[cfg.mode].label} · {new Date().toLocaleDateString("en-IN")}</div>
            </div>
          )}
        </div>
      </div>

      {/* ══ VIEWS PANEL ══ */}
      {showViewsPanel&&(
        <ViewsPanel master={master} views={masterViews} activeId={curViewId}
          onActivate={id=>{activateView(id);setShowViewsPanel(false);}}
          onEdit={openEdit} onDuplicate={duplicateView} onDelete={deleteView}
          onNew={openNew} onClose={()=>setShowViewsPanel(false)}
          M={M} A={A} fz={fz}/>
      )}

      {/* ══ VIEW BUILDER ══ */}
      {showViewBuilder&&(
        <ViewBuilder master={master} editView={editingView}
          onSave={saveView} onCancel={()=>{setShowViewBuilder(false);setEditingView(null);}}
          M={M} A={A} fz={fz}/>
      )}

      {/* ══ SETTINGS PANEL ══ */}
      {showSP&&(<>
        <div onClick={()=>setShowSP(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(2px)",zIndex:900}}/>
        <div className="sp-anim" style={{position:"fixed",right:0,top:0,bottom:0,width:420,background:M.surfHigh,borderLeft:`1px solid ${M.divider}`,zIndex:901,display:"flex",flexDirection:"column",boxShadow:M.shadow}}>
          <div style={{padding:"14px 18px 10px",borderBottom:`1px solid ${M.divider}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontSize:15,fontWeight:900,color:M.textA}}>⚙ Workspace Settings</div><div style={{fontSize:10,color:M.textC}}>Personalise your CC ERP interface</div></div>
            <button onClick={()=>setShowSP(false)} style={{width:30,height:30,borderRadius:6,border:`1px solid ${M.inputBd}`,background:M.inputBg,cursor:"pointer",fontSize:14,color:M.textB}}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
            <SLabel M={M}>Color Mode</SLabel>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:4}}>
              {Object.entries(MODES).map(([id,mo])=>(
                <button key={id} onClick={()=>setDraft(p=>({...p,mode:id}))} style={{border:`2px solid ${draft.mode===id?A.a:M.inputBd}`,borderRadius:6,background:draft.mode===id?A.al:M.inputBg,cursor:"pointer",padding:6}}>
                  <div style={{height:26,borderRadius:3,background:mo.bg,border:`1px solid ${mo.shellBd}`,marginBottom:4}}><div style={{height:7,background:mo.shellBg,borderRadius:"3px 3px 0 0",borderBottom:`1px solid ${mo.shellBd}`}}/></div>
                  <div style={{fontSize:9,fontWeight:800,color:draft.mode===id?A.a:M.textB}}>{mo.label}</div>
                </button>
              ))}
            </div>
            <SLabel M={M}>Accent Color</SLabel>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {Object.entries(ACCENTS).map(([id,ac])=>(
                <button key={id} onClick={()=>setDraft(p=>({...p,accent:id}))} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",border:`1.5px solid ${draft.accent===id?ac.a:M.inputBd}`,borderRadius:20,background:draft.accent===id?`${ac.a}15`:M.inputBg,cursor:"pointer"}}>
                  <div style={{width:11,height:11,borderRadius:"50%",background:ac.a}}/><span style={{fontSize:10,fontWeight:700,color:draft.accent===id?ac.a:M.textB}}>{ac.label.split(" ")[1]}</span>
                </button>
              ))}
            </div>
            <SLabel M={M}>Typography & Density</SLabel>
            <div style={{fontSize:9,fontWeight:700,color:M.textC,marginBottom:4}}>FONT SIZE</div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {["small","medium","large"].map(s=>{const a=draft.fontSize===s;return<button key={s} onClick={()=>setDraft(p=>({...p,fontSize:s}))} style={{padding:"4px 12px",border:`1.5px solid ${a?A.a:M.inputBd}`,borderRadius:20,background:a?A.a:M.inputBg,color:a?A.tx:M.textB,fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{s}</button>;})}
            </div>
            <div style={{fontSize:9,fontWeight:700,color:M.textC,marginBottom:4}}>ROW DENSITY</div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {["compact","comfortable","spacious"].map(s=>{const a=draft.density===s;return<button key={s} onClick={()=>setDraft(p=>({...p,density:s}))} style={{padding:"4px 12px",border:`1.5px solid ${a?A.a:M.inputBd}`,borderRadius:20,background:a?A.a:M.inputBg,color:a?A.tx:M.textB,fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{s}</button>;})}
            </div>
            <SLabel M={M}>Table Style</SLabel>
            <div style={{display:"flex",gap:6}}>
              {["striped","bordered","clean"].map(s=>{const a=draft.tblStyle===s;return<button key={s} onClick={()=>setDraft(p=>({...p,tblStyle:s}))} style={{padding:"4px 12px",border:`1.5px solid ${a?A.a:M.inputBd}`,borderRadius:20,background:a?A.a:M.inputBg,color:a?A.tx:M.textB,fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{s}</button>;})}
            </div>
            <SLabel M={M}>Display</SLabel>
            {[["showStatusBar","Status Bar"]].map(([key,label])=>(
              <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:11,color:M.textB,fontWeight:700}}>{label}</span>
                <button onClick={()=>setDraft(p=>({...p,[key]:!p[key]}))} style={{width:40,height:22,borderRadius:99,border:"none",cursor:"pointer",position:"relative",background:draft[key]?A.a:M.inputBd,transition:"background .2s"}}>
                  <div style={{position:"absolute",top:2,left:draft[key]?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </button>
              </div>
            ))}
          </div>
          <div style={{padding:"12px 18px",borderTop:`1px solid ${M.divider}`,display:"flex",gap:8}}>
            <button onClick={()=>setDraft({...DEFAULTS})} style={{flex:1,padding:"8px",border:`1px solid ${M.inputBd}`,borderRadius:5,background:M.inputBg,color:M.textB,fontSize:11,fontWeight:800,cursor:"pointer"}}>↩ Reset</button>
            <button onClick={()=>{setCfg({...draft});setShowSP(false);}} style={{flex:2,padding:"8px",border:"none",borderRadius:5,background:A.a,color:A.tx,fontSize:11,fontWeight:900,cursor:"pointer"}}>✓ Apply & Close</button>
          </div>
        </div>
      </>)}

      {/* ══ SAVE PREVIEW MODAL ══ */}
      {showPrev&&(<>
        <div onClick={()=>setShowPrev(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",zIndex:950}}/>
        <div className="sc-anim" style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:640,background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:10,zIndex:951,boxShadow:M.shadow,overflow:"hidden"}}>
          <div style={{background:"#CC0000",padding:"12px 18px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{color:"#fff",fontSize:14,fontWeight:900}}>💾 CONFIRM SAVE — {sel}</span>
            <button onClick={()=>setShowPrev(false)} style={{marginLeft:"auto",width:26,height:26,borderRadius:5,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",cursor:"pointer",fontSize:14}}>×</button>
          </div>
          <div style={{padding:18}}>
            <div style={{background:`${A.a}0a`,border:`1px solid ${A.a}20`,borderRadius:6,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontSize:9,fontWeight:900,color:A.a,letterSpacing:.5,marginBottom:8}}>RECORD SUMMARY</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px"}}>
                {master?.fields?.filter(f=>formData[f.col]).slice(0,10).map(f=>(
                  <div key={f.col} style={{display:"flex",gap:6}}>
                    <span style={{fontSize:9,fontWeight:900,color:M.textD,minWidth:80}}>{f.h}:</span>
                    <span style={{fontSize:9,fontWeight:700,color:M.textA}}>{formData[f.col]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,padding:"8px 12px",marginBottom:14}}>
              <div style={{fontSize:10,color:"#991b1b",fontWeight:700}}>⚠️ Saving writes one row to {sel} (FILE 1A). Edit directly in Google Sheets to undo.</div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowPrev(false)} style={{padding:"8px 18px",border:`1px solid ${M.inputBd}`,borderRadius:5,background:M.inputBg,color:M.textB,fontSize:11,fontWeight:800,cursor:"pointer"}}>← Edit</button>
              <button style={{padding:"8px 18px",border:`1px solid ${A.a}`,borderRadius:5,background:M.inputBg,color:A.a,fontSize:11,fontWeight:800,cursor:"pointer"}}>💾 Save Draft</button>
              <button onClick={handleConfirmSave} style={{padding:"8px 24px",border:"none",borderRadius:5,background:A.a,color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>✅ Confirm & Save to Sheet</button>
            </div>
          </div>
        </div>
      </>)}

      {/* ══ TOAST ══ */}
      {toast&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:9999}}>
          <div style={{background:"#15803d",color:"#fff",borderRadius:8,padding:"10px 18px",fontSize:12,fontWeight:800,boxShadow:"0 8px 32px rgba(0,0,0,.25)",animation:"toast-in .3s ease"}}>{toast}</div>
          <div style={{height:3,background:"rgba(255,255,255,.4)",borderRadius:2,marginTop:3,animation:"progress 4s linear forwards"}}/>
        </div>
      )}
    </div>
  );
}
