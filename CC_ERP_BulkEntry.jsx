import { useState, useEffect, useRef, useCallback, Fragment } from "react";

const MODES = {
  light:    { bg:"#f0f2f5", sh:"#fff", shBd:"#e2e4e8", sbBg:"#fff", sbBd:"#e2e4e8", hi:"#fff", mid:"#f7f8fa", lo:"#f0f2f5", hov:"#eef1f8", inBg:"#fff", inBd:"#d1d5db", div:"#e5e7eb", thd:"#f4f5f7", tev:"#fff", tod:"#fafbfc", bBg:"#e5e7eb", bTx:"#374151", tA:"#111827", tB:"#374151", tC:"#6b7280", tD:"#9ca3af", scr:"#d1d5db", shadow:"0 4px 20px rgba(0,0,0,.09)", lbl:"☀️ Light" },
  black:    { bg:"#000", sh:"#0a0a0a", shBd:"#1c1c1c", sbBg:"#0a0a0a", sbBd:"#1c1c1c", hi:"#111", mid:"#161616", lo:"#0a0a0a", hov:"#1c1c1c", inBg:"#0d0d0d", inBd:"#2a2a2a", div:"#1f1f1f", thd:"#0d0d0d", tev:"#111", tod:"#141414", bBg:"#1c1c1c", bTx:"#888", tA:"#f0f0f0", tB:"#a0a0a0", tC:"#666", tD:"#444", scr:"#2a2a2a", shadow:"0 4px 28px rgba(0,0,0,.85)", lbl:"⬛ Black" },
  midnight: { bg:"#0d1117", sh:"#161b22", shBd:"#21262d", sbBg:"#161b22", sbBd:"#21262d", hi:"#1c2128", mid:"#161b22", lo:"#0d1117", hov:"#21262d", inBg:"#0d1117", inBd:"#30363d", div:"#21262d", thd:"#161b22", tev:"#1c2128", tod:"#161b22", bBg:"#21262d", bTx:"#7d8590", tA:"#e6edf3", tB:"#8b949e", tC:"#6e7681", tD:"#484f58", scr:"#30363d", shadow:"0 4px 24px rgba(0,0,0,.6)", lbl:"🌙 Midnight" },
  warm:     { bg:"#f0ebe0", sh:"#fdf8f0", shBd:"#e4d8c4", sbBg:"#fdf8f0", sbBd:"#e4d8c4", hi:"#fdfaf4", mid:"#f5f0e8", lo:"#ede5d4", hov:"#e8dece", inBg:"#fdfaf4", inBd:"#d4c8b0", div:"#ddd0b8", thd:"#f0ebe0", tev:"#fdfaf4", tod:"#f5f0e8", bBg:"#e4d8c4", bTx:"#4a3c28", tA:"#1c1409", tB:"#5a4a34", tC:"#8a7460", tD:"#b0a090", scr:"#c8b89c", shadow:"0 4px 16px rgba(60,40,10,.12)", lbl:"🌅 Warm" },
  slate:    { bg:"#1a2030", sh:"#252d40", shBd:"#2d3654", sbBg:"#1e2433", sbBd:"#2d3654", hi:"#2a3450", mid:"#222a3e", lo:"#1a2030", hov:"#2d3654", inBg:"#1a2030", inBd:"#2d3654", div:"#2d3654", thd:"#1e2433", tev:"#222a3e", tod:"#1e2433", bBg:"#2d3654", bTx:"#8895b0", tA:"#d8e0f0", tB:"#8895b0", tC:"#5a6680", tD:"#3a4460", scr:"#2d3654", shadow:"0 4px 24px rgba(0,0,0,.5)", lbl:"🔷 Slate" },
};

const ACC = {
  orange: { a:"#E8690A", al:"rgba(232,105,10,.12)", tx:"#fff", lbl:"🟠 Orange" },
  blue:   { a:"#0078D4", al:"rgba(0,120,212,.12)",  tx:"#fff", lbl:"🔵 Blue" },
  teal:   { a:"#007C7C", al:"rgba(0,124,124,.12)",  tx:"#fff", lbl:"🩵 Teal" },
  green:  { a:"#15803D", al:"rgba(21,128,61,.12)",  tx:"#fff", lbl:"🟢 Green" },
  purple: { a:"#7C3AED", al:"rgba(124,58,237,.12)", tx:"#fff", lbl:"🟣 Purple" },
  rose:   { a:"#BE123C", al:"rgba(190,18,60,.12)",  tx:"#fff", lbl:"🌹 Rose" },
};

const VCOLS = [
  {v:"#E8690A",l:"Orange"},{v:"#0078D4",l:"Blue"},{v:"#15803D",l:"Green"},
  {v:"#7C3AED",l:"Purple"},{v:"#BE123C",l:"Rose"},{v:"#854d0e",l:"Amber"},
  {v:"#059669",l:"Teal"},{v:"#6b7280",l:"Grey"},
];
const VICONS = ["⚡","📋","₹","🧵","🏭","🔖","🎯","✅","📊","📦","🏷️","⚙️","👕","🪡","🔗","🎨","💡","📌","🔑","⚠️"];

const FK = {
  ITEM_CAT:     [{v:"TOPS-POLO",l:"Tops - Polo",l1:"Apparel"},{v:"TOPS-TEE",l:"Tops - Tee",l1:"Apparel"},{v:"SWEAT",l:"Sweatshirt",l1:"Apparel"},{v:"HOOD",l:"Hoodie",l1:"Apparel"},{v:"TRACK",l:"Tracksuit",l1:"Apparel"},{v:"BOTT",l:"Bottoms - Jogger",l1:"Apparel"}],
  RM_FAB:       [{v:"RM-FAB-001",l:"RM-FAB-001 — SJ 180GSM Cotton"},{v:"RM-FAB-002",l:"RM-FAB-002 — PIQ 220GSM"},{v:"RM-FAB-003",l:"RM-FAB-003 — Fleece 280GSM"}],
  HSN:          [{v:"6105",l:"6105 — Polo Shirts",gst:12},{v:"6109",l:"6109 — T-Shirts",gst:12},{v:"6110",l:"6110 — Sweatshirts",gst:12},{v:"6006",l:"6006 — Knit Fabric",gst:5},{v:"5205",l:"5205 — Cotton Yarn",gst:5}],
  COLOR_MASTER: [{v:"CLR-001",l:"CLR-001 — Navy Blue"},{v:"CLR-002",l:"CLR-002 — White"},{v:"CLR-003",l:"CLR-003 — Black"},{v:"CLR-004",l:"CLR-004 — Charcoal Grey"}],
  SUPPLIER:     [{v:"SUP-001",l:"SUP-001 — Rajinder Fabrics, Ludhiana"},{v:"SUP-002",l:"SUP-002 — Punjab Yarn House"},{v:"SUP-003",l:"SUP-003 — Tiruppur Knits Co."}],
  TAG_MASTER:   [{v:"TAG-001",l:"New Arrival"},{v:"TAG-002",l:"Best Seller"},{v:"TAG-003",l:"Export Quality"}],
  UOM:          [{v:"MTR",l:"MTR — Metre"},{v:"KG",l:"KG — Kilogram"},{v:"PCS",l:"PCS — Pieces"},{v:"CONE",l:"CONE — Cone"},{v:"ROLL",l:"ROLL — Roll"}],
  FAB_TYPE:     [{v:"SJ",l:"SJ — Single Jersey"},{v:"PIQ",l:"PIQ — Piqué"},{v:"FLC",l:"FLC — Fleece"},{v:"FT",l:"FT — French Terry"},{v:"RIB",l:"RIB — Rib"}],
};

const OPT_GENDER  = [{v:"Men",l:"Men"},{v:"Women",l:"Women"},{v:"Kids",l:"Kids"},{v:"Unisex",l:"Unisex"}];
const OPT_FIT     = [{v:"Regular",l:"Regular"},{v:"Slim",l:"Slim"},{v:"Relaxed",l:"Relaxed"},{v:"Oversized",l:"Oversized"}];
const OPT_NECK    = [{v:"Round",l:"Round Neck"},{v:"V-Neck",l:"V-Neck"},{v:"Collar",l:"Collar"},{v:"Hooded",l:"Hooded"}];
const OPT_SLEEVE  = [{v:"Half",l:"Half Sleeve"},{v:"Full",l:"Full Sleeve"},{v:"Sleeveless",l:"Sleeveless"},{v:"3/4",l:"3/4 Sleeve"}];
const OPT_STATUS  = [{v:"Active",l:"Active"},{v:"Inactive",l:"Inactive"},{v:"Development",l:"Development"},{v:"Discontinued",l:"Discontinued"}];
const OPT_FTYPE   = [{v:"KORA",l:"KORA"},{v:"FINISHED",l:"FINISHED"}];
const OPT_FCOL    = [{v:"KORA",l:"KORA"},{v:"COLOURED",l:"COLOURED"},{v:"DYED",l:"DYED"},{v:"MELANGE",l:"MÉLANGE"}];
const OPT_STRETCH = [{v:"Very High",l:"Very High"},{v:"High",l:"High"},{v:"Medium",l:"Medium"},{v:"Low",l:"Low"},{v:"None",l:"None"}];
const OPT_TRIM_C  = [{v:"THD",l:"THD — Thread"},{v:"LBL",l:"LBL — Label"},{v:"ELS",l:"ELS — Elastic"},{v:"ZIP",l:"ZIP — Zipper"},{v:"BUT",l:"BUT — Button"},{v:"TPE",l:"TPE — Tape"},{v:"DRW",l:"DRW — Drawstring"},{v:"OTH",l:"OTH — Other"}];
const OPT_CON_C   = [{v:"DYE",l:"DYE — Dye"},{v:"CHM",l:"CHM — Chemical"},{v:"NDL",l:"NDL — Needle"},{v:"OIL",l:"OIL — Oil"},{v:"OTH",l:"OTH — Other"}];
const OPT_PKG_C   = [{v:"PLY",l:"PLY — Polybag"},{v:"CTN",l:"CTN — Carton"},{v:"HGR",l:"HGR — Hanger"},{v:"TKT",l:"TKT — Ticket"},{v:"OTH",l:"OTH — Other"}];
const OPT_CFAM    = [{v:"Blues",l:"Blues"},{v:"Reds",l:"Reds"},{v:"Neutrals",l:"Neutrals"},{v:"Whites",l:"Whites"},{v:"Blacks",l:"Blacks"}];

function mkViews(master) {
  const allCols  = master.fields.map(f => f.col);
  const mandCols = [...new Set([allCols[0], ...master.fields.filter(f => f.req).map(f => f.col)])];
  const vs = [
    { id:`${master.id}:full`,  name:"Full Entry",  icon:"📋", color:"#6b7280", fields:allCols,  isSystem:true, desc:"Every column — complete form" },
    { id:`${master.id}:quick`, name:"Quick Entry", icon:"⚡", color:"#E8690A", fields:mandCols, isSystem:true, desc:"Mandatory fields only" },
  ];
  if (master.id === "ARTICLE_MASTER") {
    vs.push({ id:"art:price",    name:"Pricing & Tax",  icon:"₹",  color:"#854d0e", fields:["A","Q","R","S","T","U","V"],               isSystem:false, desc:"WSP · MRP · Markup · HSN · GST" });
    vs.push({ id:"art:fabric",   name:"Fabric Focus",   icon:"🧵", color:"#059669", fields:["A","B","M","N","O","P"],                   isSystem:false, desc:"Fabric, colors, size range" });
    vs.push({ id:"art:identity", name:"Item Identity",  icon:"👕", color:"#7C3AED", fields:["A","B","C","G","H","I","J","K","L","Y"],   isSystem:false, desc:"Category, gender, fit, status" });
    vs.push({ id:"art:status",   name:"Status & Tags",  icon:"🏷️", color:"#0078D4", fields:["A","B","W","X","Y","Z"],                  isSystem:false, desc:"Tags, buyer style, status" });
  }
  if (master.id === "RM_MASTER_FABRIC") {
    vs.push({ id:"fab:supply", name:"Supplier & Cost",    icon:"🏭", color:"#0078D4", fields:["A","O","P","Q","R","S","T","W","X"], isSystem:false, desc:"Supplier, season, cost, status" });
    vs.push({ id:"fab:props",  name:"Fabric Properties",  icon:"⚙️", color:"#15803D", fields:["A","C","D","F","G","H","I","J","K","L"], isSystem:false, desc:"Knit, yarn, type, GSM, UOM" });
  }
  if (master.id === "TRIM_MASTER")     vs.push({ id:"trm:core", name:"Core Identity", icon:"🔗", color:"#7C3AED", fields:["A","C","D","G","H","I","J","K","P"], isSystem:false, desc:"Name, category, colour, UOM, HSN" });
  if (master.id === "COLOR_MASTER")    vs.push({ id:"clr:hex",  name:"Hex / Pantone", icon:"🎨", color:"#BE123C", fields:["A","B","C","D","E","F"],            isSystem:false, desc:"Code, name, Pantone, hex, swatch" });
  return vs;
}

const MASTERS = [
  {
    id:"ARTICLE_MASTER", icon:"📦", cols:26, group:"item", codeFormat:"Manual — 5249HP", desc:"Finished article master.",
    sections:[
      {id:"identity",icon:"📋",title:"Article Identity",cols:["A","B","C","D","E","F"]},
      {id:"details", icon:"👕",title:"Item Details",    cols:["G","H","I","J","K","L"]},
      {id:"fabric",  icon:"🧵",title:"Fabric & Colors", cols:["M","N","O","P"]},
      {id:"pricing", icon:"₹", title:"Pricing & Tax",   cols:["Q","R","S","T","U","V"]},
      {id:"status",  icon:"🏷️",title:"Status & Tags",   cols:["W","X","Y","Z"]},
    ],
    fields:[
      {col:"A",ico:"K",h:"Article Code",       type:"manual",   req:true, auto:false, fk:null,         hint:"5249HP — 4-5 digits + 2 CAPS. No prefix."},
      {col:"B",ico:"M",h:"Description",        type:"text",     req:true, auto:false, fk:null,         hint:"Full description. Max 120 chars."},
      {col:"C",ico:"_",h:"Short Name",         type:"text",     req:false,auto:false, fk:null,         hint:"Max 25 chars. Used on barcodes."},
      {col:"D",ico:"_",h:"Image Link",         type:"url",      req:false,auto:false, fk:null,         hint:"Google Drive public image URL."},
      {col:"E",ico:"S",h:"Sketch Drive Links", type:"text",     req:false,auto:false, fk:null,         hint:"Pipe-separated Drive links."},
      {col:"F",ico:"A",h:"L1 Division",        type:"auto",     req:false,auto:true,  fk:null,         hint:"← Auto from ITEM_CATEGORIES."},
      {col:"G",ico:"M",h:"L2 Product Category",type:"fk",       req:true, auto:false, fk:"ITEM_CAT",   hint:"Mandatory. Controls L3 sub-categories."},
      {col:"H",ico:"_",h:"Season",             type:"text",     req:false,auto:false, fk:null,         hint:"e.g. SS25, AW26."},
      {col:"I",ico:"M",h:"Gender",             type:"dropdown", req:true, auto:false, fk:null, opts:OPT_GENDER, hint:"Men / Women / Kids / Unisex."},
      {col:"J",ico:"_",h:"Fit Type",           type:"dropdown", req:false,auto:false, fk:null, opts:OPT_FIT,    hint:"Regular / Slim / Relaxed / Oversized."},
      {col:"K",ico:"_",h:"Neckline",           type:"dropdown", req:false,auto:false, fk:null, opts:OPT_NECK,   hint:"Round / V-Neck / Collar / Hooded."},
      {col:"L",ico:"_",h:"Sleeve Type",        type:"dropdown", req:false,auto:false, fk:null, opts:OPT_SLEEVE, hint:"Half / Full / Sleeveless / 3/4."},
      {col:"M",ico:"F",h:"Main Fabric (FK)",   type:"fk",       req:false,auto:false, fk:"RM_FAB",     hint:"Stores fabric code e.g. RM-FAB-001."},
      {col:"N",ico:"A",h:"Fabric Name",        type:"auto",     req:false,auto:true,  fk:null,         hint:"← Auto from RM_MASTER_FABRIC."},
      {col:"O",ico:"S",h:"Color Code(s)",      type:"multifk",  req:false,auto:false, fk:"COLOR_MASTER",hint:"Multi-select color codes."},
      {col:"P",ico:"_",h:"Size Range",         type:"text",     req:false,auto:false, fk:null,         hint:"Display: S-M-L-XL-XXL."},
      {col:"Q",ico:"_",h:"W.S.P (Rs)",         type:"currency", req:false,auto:false, fk:null,         hint:"Wholesale selling price ex-GST."},
      {col:"R",ico:"_",h:"MRP (Rs)",           type:"currency", req:false,auto:false, fk:null,         hint:"Maximum retail price."},
      {col:"S",ico:"C",h:"Final Markup %",     type:"calc",     req:false,auto:true,  fk:null,         hint:"= (MRP-WSP)/WSP x 100. Auto-computed."},
      {col:"T",ico:"C",h:"Final Markdown %",   type:"calc",     req:false,auto:true,  fk:null,         hint:"= (MRP-WSP)/MRP x 100. Auto-computed."},
      {col:"U",ico:"F",h:"HSN Code (FK)",      type:"fk",       req:true, auto:false, fk:"HSN",        hint:"4 or 8-digit HSN. Mandatory."},
      {col:"V",ico:"A",h:"GST %",              type:"auto",     req:false,auto:true,  fk:null,         hint:"← Auto from HSN_MASTER."},
      {col:"W",ico:"S",h:"Tags",               type:"multifk",  req:false,auto:false, fk:"TAG_MASTER", hint:"Multi-select TAG_MASTER."},
      {col:"X",ico:"_",h:"Buyer Style No",     type:"text",     req:false,auto:false, fk:null,         hint:"Optional buyer reference."},
      {col:"Y",ico:"M",h:"Status",             type:"dropdown", req:true, auto:false, fk:null, opts:OPT_STATUS, hint:"Active / Inactive / Development."},
      {col:"Z",ico:"_",h:"Remarks",            type:"textarea", req:false,auto:false, fk:null,         hint:"Quality flags, buyer notes."},
    ],
    mockRecords:[
      {A:"5249HP",B:"Classic Polo Shirt Navy",G:"TOPS-POLO",I:"Men",Y:"Active",Q:"490",R:"999",V:"12%"},
      {A:"5310TR",B:"Athletic Tracksuit Black",G:"TRACK",I:"Men",Y:"Active",Q:"780",R:"1599",V:"12%"},
      {A:"5180SJ",B:"Basic Round Neck Tee",G:"TOPS-TEE",I:"Unisex",Y:"Development",Q:"190",R:"399"},
    ],
  },
  {
    id:"RM_MASTER_FABRIC", icon:"🧵", cols:25, group:"item", codeFormat:"AUTO — RM-FAB-001", desc:"Raw material fabric master.",
    sections:[
      {id:"identity",icon:"📋",title:"Fabric Identity",   cols:["A","B","C","D","E"]},
      {id:"props",   icon:"⚙️",title:"Fabric Properties", cols:["F","G","H","I","J","K","L"]},
      {id:"supply",  icon:"🏭",title:"Supplier & Costs",  cols:["M","N","O","P","Q","R","S","T"]},
      {id:"status",  icon:"🏷️",title:"Status",            cols:["W","X","Y"]},
    ],
    fields:[
      {col:"A",ico:"#",h:"RM Code",              type:"autocode", req:true, auto:true,  fk:null,       hint:"# GAS generates RM-FAB-001. LOCKED."},
      {col:"B",ico:"C",h:"Final Fabric SKU",     type:"calc",     req:false,auto:true,  fk:null,       hint:"GAS builds Knit Name + Yarn Composition."},
      {col:"C",ico:"F",h:"Knit Name/Structure",  type:"fk",       req:true, auto:false, fk:"FAB_TYPE", hint:"FK FABRIC_TYPE_MASTER. SJ/PIQ/FLC etc."},
      {col:"D",ico:"S",h:"Yarn Composition",     type:"multifk",  req:false,auto:false, fk:"RM_FAB",   hint:"Multi-select yarn codes."},
      {col:"E",ico:"A",h:"Yarn Names",           type:"auto",     req:false,auto:true,  fk:null,       hint:"← Auto from RM_MASTER_YARN."},
      {col:"F",ico:"M",h:"Fabric Type",          type:"dropdown", req:true, auto:false, fk:null, opts:OPT_FTYPE,  hint:"KORA / FINISHED."},
      {col:"G",ico:"_",h:"Colour",               type:"dropdown", req:false,auto:false, fk:null, opts:OPT_FCOL,   hint:"KORA / COLOURED / DYED / MELANGE."},
      {col:"H",ico:"_",h:"GSM",                  type:"number",   req:false,auto:false, fk:null,       hint:"Grams per sq metre. e.g. 180."},
      {col:"I",ico:"_",h:"Fabric Width (inches)",type:"number",   req:false,auto:false, fk:null,       hint:"Width in inches."},
      {col:"J",ico:"_",h:"Shrinkage %",          type:"number",   req:false,auto:false, fk:null,       hint:"Shrinkage % after wash."},
      {col:"K",ico:"_",h:"Stretchability",       type:"dropdown", req:false,auto:false, fk:null, opts:OPT_STRETCH,hint:"Very High / High / Medium / Low / None."},
      {col:"L",ico:"F",h:"UOM (FK)",             type:"fk",       req:true, auto:false, fk:"UOM",      hint:"MTR / KG. Mandatory."},
      {col:"M",ico:"F",h:"HSN Code (FK)",        type:"fk",       req:true, auto:false, fk:"HSN",      hint:"e.g. 6006 for knit fabric."},
      {col:"N",ico:"A",h:"GST %",                type:"auto",     req:false,auto:true,  fk:null,       hint:"← Auto from HSN_MASTER."},
      {col:"O",ico:"F",h:"Primary Supplier (FK)",type:"fk",       req:false,auto:false, fk:"SUPPLIER", hint:"SUP-NNN."},
      {col:"P",ico:"A",h:"Supplier Name",        type:"auto",     req:false,auto:true,  fk:null,       hint:"← Auto from SUPPLIER_MASTER."},
      {col:"Q",ico:"_",h:"Season for Cost",      type:"text",     req:false,auto:false, fk:null,       hint:"Season: SS25, AW26."},
      {col:"R",ico:"_",h:"Avg Cost excl GST",    type:"currency", req:false,auto:false, fk:null,       hint:"Average purchase cost ex-GST."},
      {col:"S",ico:"A",h:"GST % for Cost",       type:"auto",     req:false,auto:true,  fk:null,       hint:"← Auto from HSN_MASTER."},
      {col:"T",ico:"C",h:"Total Cost incl GST",  type:"calc",     req:false,auto:true,  fk:null,       hint:"= Avg Cost x (1+GST%/100). NEVER type."},
      {col:"W",ico:"M",h:"Status",               type:"dropdown", req:true, auto:false, fk:null, opts:OPT_STATUS, hint:"Active / Inactive / Development."},
      {col:"X",ico:"_",h:"Lead Time (Days)",     type:"number",   req:false,auto:false, fk:null,       hint:"Days from order to delivery."},
      {col:"Y",ico:"_",h:"Remarks",              type:"textarea", req:false,auto:false, fk:null,       hint:"Supplier notes, quality flags."},
    ],
    mockRecords:[
      {A:"RM-FAB-001",C:"SJ",F:"FINISHED",G:"COLOURED",H:"180",W:"Active"},
      {A:"RM-FAB-002",C:"PIQ",F:"FINISHED",G:"COLOURED",H:"220",W:"Active"},
    ],
  },
  {
    id:"TRIM_MASTER", icon:"🔗", cols:20, group:"item", codeFormat:"AUTO — TRM-THD-001", desc:"All trims. 10 categories.",
    sections:[
      {id:"identity",icon:"📋",title:"Trim Identity",  cols:["A","C","D","E","F"]},
      {id:"supply",  icon:"🏭",title:"Colour & Supply",cols:["G","H","I","J","K","L","N","P"]},
    ],
    fields:[
      {col:"A",ico:"#",h:"TRM Code",         type:"autocode", req:true, auto:true,  fk:null,         hint:"# GAS generates TRM-THD-001. LOCKED."},
      {col:"C",ico:"M",h:"Trim Name",        type:"text",     req:true, auto:false, fk:null,         hint:"Full name e.g. 30s Poly Thread Black."},
      {col:"D",ico:"M",h:"Trim Category",    type:"dropdown", req:true, auto:false, fk:null, opts:OPT_TRIM_C, hint:"THD/LBL/ELS/ZIP/BUT/TPE/DRW/OTH."},
      {col:"E",ico:"_",h:"Sub-Category",     type:"text",     req:false,auto:false, fk:null,         hint:"Optional sub-classification."},
      {col:"F",ico:"_",h:"Image Link",       type:"url",      req:false,auto:false, fk:null,         hint:"Google Drive image URL."},
      {col:"G",ico:"F",h:"Colour Code (FK)", type:"fk",       req:false,auto:false, fk:"COLOR_MASTER",hint:"FK COLOR_MASTER. Stores CLR-NNN."},
      {col:"H",ico:"A",h:"Color Name",       type:"auto",     req:false,auto:true,  fk:null,         hint:"← Auto from COLOR_MASTER."},
      {col:"I",ico:"M",h:"UOM",              type:"dropdown", req:true, auto:false, fk:null, opts:[{v:"CONE",l:"CONE"},{v:"MTR",l:"MTR"},{v:"PCS",l:"PCS"},{v:"KG",l:"KG"}], hint:"CONE/MTR/PCS/KG."},
      {col:"J",ico:"F",h:"HSN Code (FK)",    type:"fk",       req:true, auto:false, fk:"HSN",        hint:"Mandatory."},
      {col:"K",ico:"A",h:"GST %",            type:"auto",     req:false,auto:true,  fk:null,         hint:"← Auto from HSN_MASTER."},
      {col:"L",ico:"F",h:"Primary Supplier", type:"fk",       req:false,auto:false, fk:"SUPPLIER",   hint:"Primary supplier code."},
      {col:"N",ico:"_",h:"Lead Time (Days)", type:"number",   req:false,auto:false, fk:null,         hint:"Days from PO to delivery."},
      {col:"P",ico:"M",h:"Status",           type:"dropdown", req:true, auto:false, fk:null, opts:OPT_STATUS, hint:"Active / Inactive."},
    ],
    mockRecords:[
      {A:"TRM-THD-001",C:"30s Poly Thread Black",D:"THD",P:"Active"},
      {A:"TRM-BUT-001",C:"4-hole Button 15mm",D:"BUT",P:"Active"},
    ],
  },
  {
    id:"CONSUMABLE_MASTER", icon:"🧪", cols:20, group:"item", codeFormat:"AUTO — CON-DYE-001", desc:"Consumables: DYE/CHM/NDL/OIL.",
    sections:[
      {id:"identity",icon:"📋",title:"Consumable Identity",cols:["A","B","C","D","E","F","G"]},
      {id:"supply",  icon:"🏭",title:"Supplier & Stock",   cols:["H","I","J","K"]},
    ],
    fields:[
      {col:"A",ico:"#",h:"CON Code",             type:"autocode", req:true, auto:true,  fk:null,       hint:"# GAS generates CON-DYE-001. LOCKED."},
      {col:"B",ico:"M",h:"Consumable Name",      type:"text",     req:true, auto:false, fk:null,       hint:"e.g. Reactive Black Dye B200."},
      {col:"C",ico:"M",h:"Consumable Category",  type:"dropdown", req:true, auto:false, fk:null, opts:OPT_CON_C, hint:"DYE/CHM/NDL/OIL/OTH."},
      {col:"D",ico:"_",h:"Sub-Category",         type:"text",     req:false,auto:false, fk:null,       hint:"Free-text sub-classification."},
      {col:"E",ico:"M",h:"UOM",                  type:"fk",       req:true, auto:false, fk:"UOM",      hint:"KG/LTR/PCS/BOX."},
      {col:"F",ico:"F",h:"HSN Code (FK)",        type:"fk",       req:true, auto:false, fk:"HSN",      hint:"Mandatory."},
      {col:"G",ico:"A",h:"GST %",                type:"auto",     req:false,auto:true,  fk:null,       hint:"← Auto from HSN_MASTER."},
      {col:"H",ico:"F",h:"Primary Supplier (FK)",type:"fk",       req:false,auto:false, fk:"SUPPLIER", hint:"Primary supplier."},
      {col:"I",ico:"A",h:"Supplier Name",        type:"auto",     req:false,auto:true,  fk:null,       hint:"← Auto from SUPPLIER_MASTER."},
      {col:"J",ico:"_",h:"Reorder Level",        type:"number",   req:false,auto:false, fk:null,       hint:"Min stock threshold."},
      {col:"K",ico:"M",h:"Status",               type:"dropdown", req:true, auto:false, fk:null, opts:OPT_STATUS, hint:"Active / Inactive."},
    ],
    mockRecords:[{A:"CON-DYE-001",B:"Reactive Black Dye B200",C:"DYE",K:"Active"}],
  },
  {
    id:"PACKAGING_MASTER", icon:"📫", cols:18, group:"item", codeFormat:"AUTO — PKG-PLY-001", desc:"Packaging: PLY/CTN/HGR/TKT.",
    sections:[
      {id:"identity",icon:"📋",title:"Packaging Identity",cols:["A","B","C","D"]},
      {id:"supply",  icon:"🏭",title:"Tax & Supplier",    cols:["E","F","G","H","I","J"]},
    ],
    fields:[
      {col:"A",ico:"#",h:"PKG Code",           type:"autocode", req:true, auto:true,  fk:null,       hint:"GAS generates PKG-PLY-001. LOCKED."},
      {col:"B",ico:"M",h:"Packaging Name",     type:"text",     req:true, auto:false, fk:null,       hint:"Full name."},
      {col:"C",ico:"M",h:"Packaging Category", type:"dropdown", req:true, auto:false, fk:null, opts:OPT_PKG_C, hint:"PLY/CTN/HGR/TKT/OTH."},
      {col:"D",ico:"M",h:"UOM",                type:"fk",       req:true, auto:false, fk:"UOM",      hint:"PCS/BOX/CTN/ROLL."},
      {col:"E",ico:"F",h:"HSN Code (FK)",      type:"fk",       req:true, auto:false, fk:"HSN",      hint:"Mandatory."},
      {col:"F",ico:"A",h:"GST %",              type:"auto",     req:false,auto:true,  fk:null,       hint:"← Auto from HSN_MASTER."},
      {col:"G",ico:"F",h:"Primary Supplier",   type:"fk",       req:false,auto:false, fk:"SUPPLIER", hint:"Primary supplier code."},
      {col:"H",ico:"A",h:"Supplier Name",      type:"auto",     req:false,auto:true,  fk:null,       hint:"← Auto from SUPPLIER_MASTER."},
      {col:"I",ico:"_",h:"Reorder Level",      type:"number",   req:false,auto:false, fk:null,       hint:"Min stock threshold."},
      {col:"J",ico:"M",h:"Status",             type:"dropdown", req:true, auto:false, fk:null, opts:OPT_STATUS, hint:"Active / Inactive."},
    ],
    mockRecords:[{A:"PKG-PLY-001",B:"Polybag 4x6 inch",C:"PLY",J:"Active"}],
  },
  {
    id:"COLOR_MASTER", icon:"🎨", cols:7, group:"lookup", codeFormat:"Manual — CLR-001", desc:"Color lookup master.",
    sections:[{id:"all",icon:"📋",title:"All Fields",cols:["A","B","C","D","E","F","G"]}],
    fields:[
      {col:"A",ico:"K",h:"Color Code",   type:"manual",   req:true, auto:false, fk:null,      hint:"CLR-001 sequential. Unique."},
      {col:"B",ico:"M",h:"Color Name",   type:"text",     req:true, auto:false, fk:null,      hint:"Standard name. BE CONSISTENT."},
      {col:"C",ico:"_",h:"Pantone Code", type:"text",     req:false,auto:false, fk:null,      hint:"e.g. PMS 185 C."},
      {col:"D",ico:"_",h:"Hex Code",     type:"text",     req:false,auto:false, fk:null,      hint:"6-digit hex e.g. #FF0000."},
      {col:"E",ico:"A",h:"Color Swatch", type:"auto",     req:false,auto:true,  fk:null,      hint:"← GAS applyColorSwatch()."},
      {col:"F",ico:"_",h:"Color Family", type:"dropdown", req:false,auto:false, fk:null, opts:OPT_CFAM, hint:"Blues/Reds/Neutrals/Whites/Blacks."},
      {col:"G",ico:"_",h:"Remarks",      type:"textarea", req:false,auto:false, fk:null,      hint:"Seasonal notes."},
    ],
    mockRecords:[
      {A:"CLR-001",B:"Navy Blue",C:"PMS 289 C",D:"#001f5b",F:"Blues"},
      {A:"CLR-002",B:"White",D:"#ffffff",F:"Whites"},
    ],
  },
  {
    id:"HSN_MASTER", icon:"🏷️", cols:6, group:"lookup", codeFormat:"Manual — HSN code", desc:"HSN code lookup. Total GST auto-computed.",
    sections:[{id:"all",icon:"📋",title:"All Fields",cols:["A","B","C","D","E","F"]}],
    fields:[
      {col:"A",ico:"K",h:"HSN Code",    type:"manual",  req:true, auto:false, fk:null, hint:"4 or 8-digit HSN. Unique."},
      {col:"B",ico:"M",h:"Description", type:"text",    req:true, auto:false, fk:null, hint:"Official HSN description."},
      {col:"C",ico:"_",h:"CGST %",      type:"number",  req:true, auto:false, fk:null, hint:"Central GST rate e.g. 6."},
      {col:"D",ico:"_",h:"SGST %",      type:"number",  req:true, auto:false, fk:null, hint:"State GST rate e.g. 6."},
      {col:"E",ico:"C",h:"Total GST %", type:"calc",    req:false,auto:true,  fk:null, hint:"= CGST + SGST. NEVER type."},
      {col:"F",ico:"_",h:"Remarks",     type:"textarea",req:false,auto:false, fk:null, hint:"MRP threshold notes."},
    ],
    mockRecords:[
      {A:"6105",B:"Polo Shirts Knitted",C:"6",D:"6",E:"12%"},
      {A:"6109",B:"T-Shirts Knitted",C:"6",D:"6",E:"12%"},
    ],
  },
];

function computeAutos(mId, col, val, data) {
  const d = {...data, [col]:val};
  const n = k => parseFloat(d[k]) || 0;
  if (mId === "ARTICLE_MASTER") {
    const hsnR = FK.HSN.find(r => r.v === d.U);
    d.V = hsnR ? (hsnR.gst + "%") : "";
    const fabR = FK.RM_FAB.find(r => r.v === d.M);
    d.N = fabR ? (fabR.l.split(" — ")[1] || "") : "";
    const catR = FK.ITEM_CAT.find(r => r.v === d.G);
    d.F = catR ? (catR.l1 || "Apparel") : "";
    const wsp = n("Q"), mrp = n("R");
    d.S = wsp > 0 ? ((mrp - wsp) / wsp * 100).toFixed(2) + "%" : "";
    d.T = mrp > 0 ? ((mrp - wsp) / mrp * 100).toFixed(2) + "%" : "";
  }
  if (mId === "RM_MASTER_FABRIC") {
    const hsnR = FK.HSN.find(r => r.v === d.M);
    d.N = hsnR ? (hsnR.gst + "%") : "";
    d.S = d.N;
    const avgC = n("R"), gst = parseFloat(d.N) || 0;
    d.T = avgC > 0 ? ("Rs " + (avgC * (1 + gst / 100)).toFixed(2)) : "";
    const supR = FK.SUPPLIER.find(r => r.v === d.O);
    d.P = supR ? (supR.l.split(" — ")[1] || "") : "";
  }
  if (mId === "TRIM_MASTER") {
    const hsnR = FK.HSN.find(r => r.v === d.J);
    d.K = hsnR ? (hsnR.gst + "%") : "";
    const colR = FK.COLOR_MASTER.find(r => r.v === d.G);
    d.H = colR ? (colR.l.split(" — ")[1] || "") : "";
  }
  if (mId === "CONSUMABLE_MASTER") {
    const hsnR = FK.HSN.find(r => r.v === d.F);
    d.G = hsnR ? (hsnR.gst + "%") : "";
    const supR = FK.SUPPLIER.find(r => r.v === d.H);
    d.I = supR ? (supR.l.split(" — ")[1] || "") : "";
  }
  if (mId === "PACKAGING_MASTER") {
    const hsnR = FK.HSN.find(r => r.v === d.E);
    d.F = hsnR ? (hsnR.gst + "%") : "";
    const supR = FK.SUPPLIER.find(r => r.v === d.G);
    d.H = supR ? (supR.l.split(" — ")[1] || "") : "";
  }
  if (mId === "HSN_MASTER") {
    const c = n("C"), s = n("D");
    d.E = (c + s) > 0 ? ((c + s).toFixed(1) + "%") : "";
  }
  return d;
}

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
  if (f.type === "fk" || f.type === "multifk") {
    const opts = FK[f.fk] || [];
    return (
      <select style={base} value={val || ""} onChange={e => onChange(e.target.value)}>
        <option value="">— {f.fk} —</option>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    );
  }
  if (f.type === "currency") return <input type="number" step="0.01" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder="Rs 0.00" />;
  if (f.type === "number")   return <input type="number" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder="0" />;
  return <input type="text" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder={f.hint} />;
}

// ═══════════════════════════════════════════════════════════════════════
//  AggFooter — sticky tfoot row with per-column aggregation pickers
//  aggState: { [col]: "none"|"count"|"count_empty"|"count_values"|"sum"|
//              "avg"|"min"|"max"|"range"|"median"|"percent_filled"|
//              "percent_empty"|"unique" }
//  Only renders inside a <table> — called as <AggFooter ... />
// ═══════════════════════════════════════════════════════════════════════
const AGG_OPTIONS = [
  { v:"none",          l:"—",              grp:"" },
  { v:"count",         l:"Count all",      grp:"Count" },
  { v:"count_values",  l:"Count values",   grp:"Count" },
  { v:"count_empty",   l:"Count empty",    grp:"Count" },
  { v:"unique",        l:"Unique values",  grp:"Count" },
  { v:"sum",           l:"Sum",            grp:"Calculate" },
  { v:"avg",           l:"Average",        grp:"Calculate" },
  { v:"min",           l:"Min",            grp:"Calculate" },
  { v:"max",           l:"Max",            grp:"Calculate" },
  { v:"range",         l:"Range (max−min)",grp:"Calculate" },
  { v:"median",        l:"Median",         grp:"Calculate" },
  { v:"percent_filled",l:"% Filled",       grp:"Percent" },
  { v:"percent_empty", l:"% Empty",        grp:"Percent" },
];

function computeAgg(fn, rows, col, allFields) {
  const f = allFields.find(x => x.col === col);
  const isNum = ["currency","number","calc"].includes(f?.type||"");
  const vals  = rows.map(r => r[col]);
  const nonempty = vals.filter(v => v != null && v !== "");
  const nums = nonempty.map(v => parseFloat(v)).filter(n => !isNaN(n));

  switch(fn) {
    case "none":          return null;
    case "count":         return rows.length;
    case "count_values":  return nonempty.length;
    case "count_empty":   return vals.length - nonempty.length;
    case "unique":        return new Set(nonempty.map(v=>String(v))).size;
    case "sum":           return nums.length ? nums.reduce((a,b)=>a+b,0) : null;
    case "avg":           return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null;
    case "min":           return nums.length ? Math.min(...nums) : (nonempty.length ? nonempty.sort()[0] : null);
    case "max":           return nums.length ? Math.max(...nums) : (nonempty.length ? nonempty.sort().slice(-1)[0] : null);
    case "range":         return nums.length >= 2 ? Math.max(...nums)-Math.min(...nums) : null;
    case "median": {
      if (!nums.length) return null;
      const s=[...nums].sort((a,b)=>a-b), m=Math.floor(s.length/2);
      return s.length%2?s[m]:(s[m-1]+s[m])/2;
    }
    case "percent_filled":return rows.length ? ((nonempty.length/rows.length)*100) : null;
    case "percent_empty": return rows.length ? (((rows.length-nonempty.length)/rows.length)*100) : null;
    default: return null;
  }
}

function fmtAgg(fn, val, allFields, col) {
  if (val === null || val === undefined) return "—";
  const f = allFields.find(x => x.col === col);
  const isCur = f?.type === "currency";
  if (["percent_filled","percent_empty"].includes(fn)) return val.toFixed(1)+"%";
  if (["avg","median","range"].includes(fn) || (["sum","min","max"].includes(fn))) {
    if (typeof val === "number") {
      return isCur ? "₹"+val.toLocaleString("en-IN",{maximumFractionDigits:2})
                   : val % 1 === 0 ? val.toLocaleString("en-IN")
                   : val.toLocaleString("en-IN",{maximumFractionDigits:2});
    }
  }
  return String(val);
}

const AGG_COLORS = {
  count:"#0078D4", count_values:"#0078D4", count_empty:"#6b7280", unique:"#7C3AED",
  sum:"#15803d", avg:"#E8690A", min:"#0e7490", max:"#7c2d12",
  range:"#4338ca", median:"#0891b2", percent_filled:"#15803d", percent_empty:"#6b7280",
};

// ── AggDropdown — rendered as sibling to the table, position:fixed ──
function AggDropdown({ openInfo, aggState, setAggState, visRows, allFields, onClose, M, A }) {
  if (!openInfo) return null;
  const { col, top, left } = openInfo;
  const fn    = aggState?.[col] || "none";
  const val   = fn === "none" ? null : computeAgg(fn, visRows, col, allFields);
  const fmted = fmtAgg(fn, val, allFields, col);

  const handlePick = (v) => { setAggState(p=>({...p,[col]:v})); onClose(); };

  return (
    <div onMouseDown={e=>e.stopPropagation()} style={{
      position:"fixed", top, left, width:224, zIndex:9999,
      background:M.hi, border:"1.5px solid #c4b5fd", borderRadius:10,
      boxShadow:"0 16px 48px rgba(0,0,0,.32)", overflow:"hidden",
      display:"flex", flexDirection:"column", maxHeight:400,
    }}>
      {/* header */}
      <div style={{padding:"8px 12px",background:"#1e293b",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,fontWeight:900,color:"#f1f5f9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {allFields.find(f=>f.col===col)?.h||col}
          </div>
          <div style={{fontSize:7.5,color:"#64748b",fontFamily:"monospace",marginTop:1}}>{col}</div>
        </div>
        {fn!=="none"&&val!==null&&(
          <span style={{background:AGG_COLORS[fn]||"#7C3AED",color:"#fff",borderRadius:5,padding:"2px 8px",fontSize:9,fontWeight:900,fontFamily:"monospace"}}>{fmted}</span>
        )}
        <button onClick={onClose} style={{marginLeft:4,padding:"2px 6px",border:"none",background:"rgba(255,255,255,.15)",color:"#fff",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:900}}>✕</button>
      </div>

      {/* options */}
      <div style={{overflowY:"auto",flex:1}}>
        {["","Count","Calculate","Percent"].map(grp=>{
          const opts=AGG_OPTIONS.filter(o=>o.grp===grp);
          return (
            <Fragment key={grp}>
              {grp&&<div style={{padding:"6px 12px 3px",fontSize:8,fontWeight:900,color:"#7C3AED",letterSpacing:1,textTransform:"uppercase",borderTop:"1px solid #e8e0fb",background:"#f9f7ff"}}>{grp}</div>}
              {opts.map(opt=>{
                const isAct=fn===opt.v; const oc=AGG_COLORS[opt.v];
                return(
                  <button key={opt.v} onClick={()=>handlePick(opt.v)} style={{
                    display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 14px",border:"none",
                    background:isAct?(oc||"#7C3AED")+"18":"transparent",
                    color:isAct?(oc||"#7C3AED"):M.tB,
                    fontSize:10.5,fontWeight:isAct?900:500,cursor:"pointer",textAlign:"left",
                    borderLeft:isAct?"3px solid "+(oc||"#7C3AED"):"3px solid transparent",
                  }}>
                    <span style={{width:8,height:8,borderRadius:"50%",flexShrink:0,
                      background:isAct?(oc||"#7C3AED"):"#e5e7eb",border:isAct?"none":"1px solid #d1d5db"}}/>
                    <span style={{flex:1}}>{opt.l}</span>
                    {isAct&&val!==null&&<span style={{fontFamily:"monospace",fontSize:9,color:oc||"#7C3AED",background:(oc||"#7C3AED")+"18",borderRadius:4,padding:"1px 5px"}}>{fmted}</span>}
                  </button>
                );
              })}
            </Fragment>
          );
        })}
      </div>

      {/* footer */}
      <div style={{padding:"6px 10px",borderTop:"1px solid #e8e0fb",background:"#f5f3ff",display:"flex",gap:6,flexShrink:0}}>
        {fn!=="none"&&<button onClick={()=>handlePick("none")} style={{flex:1,padding:"5px 0",border:"1px solid #fecaca",borderRadius:5,background:"#fef2f2",color:"#dc2626",fontSize:9,fontWeight:700,cursor:"pointer"}}>✕ Remove</button>}
        <button onClick={onClose} style={{flex:1,padding:"5px 0",border:"1px solid #c4b5fd",borderRadius:5,background:"#ede9fe",color:"#7C3AED",fontSize:9,fontWeight:700,cursor:"pointer"}}>Close</button>
      </div>
    </div>
  );
}

// ── AggFooter — pure tfoot row, calls onCellClick with (col, DOMElement) ──
function AggFooter({ visRows, visCols, allFields, aggState, openCol, onCellClick, hasCheckbox, M, A }) {
  const btnRefs = useRef({});

  return (
    <tfoot>
      <tr style={{background:M.mid, borderTop:"2px solid "+M.div}}>
        {hasCheckbox && <td style={{padding:"4px 6px",borderRight:"1px solid "+M.div}}/>}
        <td style={{padding:"4px 8px",borderRight:"1px solid "+M.div,fontSize:8,fontWeight:900,
          color:"#7C3AED",letterSpacing:.5,textTransform:"uppercase",whiteSpace:"nowrap",
          verticalAlign:"middle",background:"#ede9fe"}}>
          Σ AGG
        </td>
        {visCols.map(col => {
          const fn    = aggState?.[col] || "none";
          const val   = fn === "none" ? null : computeAgg(fn, visRows, col, allFields);
          const fmted = fmtAgg(fn, val, allFields, col);
          const color = AGG_COLORS[fn] || "#9ca3af";
          const isOpen = openCol === col;
          return (
            <td key={col} style={{padding:"2px 4px",borderRight:"1px solid "+M.div,verticalAlign:"middle",minWidth:80}}>
              <button
                ref={el=>{ if(el) btnRefs.current[col]=el; }}
                onClick={()=>onCellClick(col, btnRefs.current[col])}
                style={{
                  width:"100%",padding:"3px 6px",borderRadius:4,cursor:"pointer",
                  border:"1.5px solid "+(fn!=="none"?color:"#e5e7eb"),
                  background:fn!=="none"?(color+"18"):"transparent",
                  color:fn!=="none"?color:"#9ca3af",
                  fontSize:9,fontWeight:fn!=="none"?900:500,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:3,
                  whiteSpace:"nowrap",
                  outline:isOpen?"2px solid "+(fn!=="none"?color:"#7C3AED"):"none",
                  outlineOffset:1,
                }}>
                {fn==="none"
                  ? <><span style={{fontSize:11,opacity:.35}}>+</span><span style={{fontSize:7.5,opacity:.35}}>Calculate</span></>
                  : <><span style={{fontFamily:"monospace",fontSize:10}}>{fmted}</span>
                    <span style={{fontSize:7,opacity:.6,marginLeft:2}}>{AGG_OPTIONS.find(o=>o.v===fn)?.l}</span></>
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

// ═══════════════════════════════════════════════════════════════
//  SortPanel — Notion-style multi-level sort with drag reorder
//  sort shape: { col, dir, type, nulls }
//    dir:   "asc" | "desc"
//    type:  "auto" | "alpha" | "numeric" | "date" | "length"
//    nulls: "last" | "first"
// ═══════════════════════════════════════════════════════════════
function SortPanel({ sorts, setSorts, allFields, M, A, onClose }) {
  const [dragIdx, setDragIdx]   = useState(null);
  const [overIdx, setOverIdx]   = useState(null);
  const [expanded, setExpanded] = useState({}); // {idx: bool} — advanced row open

  // ── helpers ──
  const fieldType = col => {
    const f = allFields.find(x => x.col === col);
    if (!f) return "alpha";
    if (["currency","number","calc"].includes(f.type)) return "numeric";
    if (f.type === "date") return "date";
    return "alpha";
  };

  const dirLabel = (type, dir) => {
    if (type === "numeric") return dir === "asc" ? "1 → 9"    : "9 → 1";
    if (type === "date")    return dir === "asc" ? "Oldest"    : "Newest";
    if (type === "length")  return dir === "asc" ? "Shortest"  : "Longest";
    return dir === "asc" ? "A → Z" : "Z → A";
  };

  const addSort = col => {
    if (!col || sorts.find(s => s.col === col)) return;
    const t = fieldType(col);
    setSorts(p => [...p, { col, dir:"asc", type:"auto", nulls:"last" }]);
  };

  const updateSort = (idx, patch) =>
    setSorts(p => p.map((s,i) => i===idx ? {...s,...patch} : s));

  const removeSort = idx => setSorts(p => p.filter((_,i) => i!==idx));

  const moveSort = (from, to) => {
    if (from === to) return;
    setSorts(p => {
      const a = [...p];
      const [item] = a.splice(from, 1);
      a.splice(to, 0, item);
      return a;
    });
  };

  // ── drag handlers ──
  const onDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed="move"; };
  const onDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const onDrop      = (e, i) => { e.preventDefault(); moveSort(dragIdx,i); setDragIdx(null); setOverIdx(null); };
  const onDragEnd   = ()     => { setDragIdx(null); setOverIdx(null); };

  // ── quick preset rows ──
  const presets = [
    { lbl:"Name A→Z",   icon:"🔤", sorts:[{col:allFields[0]?.col||"A",dir:"asc",type:"auto",nulls:"last"}] },
    { lbl:"Name Z→A",   icon:"🔤", sorts:[{col:allFields[0]?.col||"A",dir:"desc",type:"auto",nulls:"last"}] },
    { lbl:"Code ↑",     icon:"🔢", sorts:[{col:allFields.find(f=>f.type==="autocode"||f.type==="manual")?.col||allFields[0]?.col,dir:"asc",type:"alpha",nulls:"last"}] },
    { lbl:"Clear All",  icon:"✕",  sorts:[] },
  ];

  const resolvedType = s => s.type === "auto" ? fieldType(s.col) : s.type;

  const TYPE_OPTIONS = [
    { v:"auto",    l:"Auto-detect" },
    { v:"alpha",   l:"Text (A→Z)"  },
    { v:"numeric", l:"Number"      },
    { v:"date",    l:"Date"        },
    { v:"length",  l:"Text length" },
  ];

  const available = allFields.filter(f => !sorts.find(s=>s.col===f.col));

  return (
    <div style={{
      position:"absolute", top:0, left:0, right:0, bottom:0,
      zIndex:300, display:"flex", alignItems:"flex-start", justifyContent:"flex-end",
      pointerEvents:"none"
    }}>
      {/* backdrop */}
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.18)",pointerEvents:"all"}}/>
      {/* panel */}
      <div style={{
        position:"relative", pointerEvents:"all",
        width:440, maxHeight:"100%", overflowY:"auto",
        background:M.hi, borderLeft:"2px solid #7C3AED",
        boxShadow:"-4px 0 24px rgba(0,0,0,.18)",
        display:"flex", flexDirection:"column"
      }}>
        {/* ── Header ── */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:8,background:"#7C3AED",flexShrink:0}}>
          <span style={{fontSize:14}}>↕</span>
          <span style={{fontSize:12,fontWeight:900,color:"#fff",letterSpacing:.3}}>Sort</span>
          <span style={{background:"rgba(255,255,255,.25)",color:"#fff",borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:900}}>{sorts.length} rule{sorts.length!==1?"s":""}</span>
          <div style={{flex:1}}/>
          {sorts.length>0&&<button onClick={()=>setSorts([])} style={{padding:"4px 10px",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:5,background:"transparent",color:"#fff",fontSize:9,fontWeight:800,cursor:"pointer"}}>✕ Clear all</button>}
          <button onClick={onClose} style={{padding:"4px 8px",border:"none",borderRadius:5,background:"rgba(255,255,255,.15)",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>✕</button>
        </div>

        {/* ── Quick Presets ── */}
        <div style={{padding:"8px 14px",borderBottom:"1px solid "+M.div,display:"flex",gap:5,flexWrap:"wrap",flexShrink:0,background:M.mid}}>
          <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",alignSelf:"center",marginRight:4}}>QUICK:</span>
          {presets.map((p,pi) => (
            <button key={pi} onClick={()=>setSorts(p.sorts)}
              style={{padding:"3px 10px",borderRadius:5,border:"1.5px solid "+(pi===presets.length-1?"#fecaca":"#c4b5fd"),
                background:pi===presets.length-1?"#fef2f2":"#f5f3ff",
                color:pi===presets.length-1?"#dc2626":"#7C3AED",fontSize:9,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <span>{p.icon}</span>{p.lbl}
            </button>
          ))}
        </div>

        {/* ── Empty state ── */}
        {sorts.length === 0 && (
          <div style={{padding:"32px 16px",textAlign:"center",color:M.tD}}>
            <div style={{fontSize:28,marginBottom:8}}>↕</div>
            <div style={{fontSize:12,fontWeight:700,color:M.tB,marginBottom:4}}>No sort rules</div>
            <div style={{fontSize:10,color:M.tD}}>Add a column below to sort your records</div>
          </div>
        )}

        {/* ── Sort rules list ── */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {sorts.map((s, idx) => {
            const f     = allFields.find(x => x.col === s.col);
            const rtype = resolvedType(s);
            const isExp = expanded[idx];
            const isDrag = dragIdx === idx;
            const isOver = overIdx === idx && dragIdx !== idx;
            return (
              <div key={s.col+idx}
                draggable onDragStart={e=>onDragStart(e,idx)} onDragOver={e=>onDragOver(e,idx)}
                onDrop={e=>onDrop(e,idx)} onDragEnd={onDragEnd}
                style={{
                  margin:"2px 10px", borderRadius:8,
                  border:"1.5px solid "+(isOver?"#7C3AED":isDrag?"#c4b5fd":M.div),
                  background:isOver?"#ede9fe":isDrag?"#f5f3ff":M.hi,
                  opacity:isDrag?.5:1,
                  transition:"border-color .1s, background .1s"
                }}>
                {/* Main row */}
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px"}}>
                  {/* drag handle */}
                  <span title="Drag to reorder" style={{cursor:"grab",fontSize:14,color:M.tD,userSelect:"none",flexShrink:0}}>⠿</span>

                  {/* priority badge */}
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#7C3AED",color:"#fff",fontSize:8,fontWeight:900,
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {idx+1}
                  </div>

                  {/* label for 2nd+ rules */}
                  {idx>0 && <span style={{fontSize:8,fontWeight:700,color:M.tD,flexShrink:0}}>then by</span>}

                  {/* column picker */}
                  <select value={s.col}
                    onChange={e=>{
                      const newCol = e.target.value;
                      if (!newCol || sorts.find((x,i)=>x.col===newCol&&i!==idx)) return;
                      updateSort(idx,{col:newCol, type:"auto"});
                    }}
                    style={{flex:1,padding:"5px 8px",border:"1.5px solid "+M.inBd,borderRadius:6,background:M.inBg,
                      color:M.tA,fontSize:10,fontWeight:700,cursor:"pointer",outline:"none",minWidth:0}}>
                    <option value={s.col}>{f?.h || s.col} [{s.col}]</option>
                    {available.map(af=><option key={af.col} value={af.col}>{af.h} [{af.col}]</option>)}
                  </select>

                  {/* direction toggle */}
                  <button onClick={()=>updateSort(idx,{dir:s.dir==="asc"?"desc":"asc"})}
                    style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid #c4b5fd",
                      background:"#f5f3ff",color:"#6d28d9",fontSize:9,fontWeight:900,cursor:"pointer",
                      whiteSpace:"nowrap",flexShrink:0}}>
                    {dirLabel(rtype, s.dir)}
                    <span style={{marginLeft:4}}>{s.dir==="asc"?"↑":"↓"}</span>
                  </button>

                  {/* expand advanced */}
                  <button onClick={()=>setExpanded(p=>({...p,[idx]:!p[idx]}))}
                    title="Advanced options"
                    style={{padding:"4px 6px",borderRadius:5,border:"1px solid "+M.div,background:isExp?"#ede9fe":M.inBg,
                      color:isExp?"#7C3AED":M.tD,fontSize:10,cursor:"pointer",flexShrink:0}}>
                    {isExp?"▲":"▼"}
                  </button>

                  {/* remove */}
                  <button onClick={()=>{removeSort(idx);setExpanded(p=>{const n={...p};delete n[idx];return n;});}}
                    style={{width:22,height:22,borderRadius:4,border:"1px solid #fecaca",background:"#fef2f2",
                      color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:900,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    ×
                  </button>
                </div>

                {/* ── Advanced row ── */}
                {isExp && (
                  <div style={{borderTop:"1px dashed "+M.div,padding:"8px 10px 10px 42px",
                    background:M.mid,borderRadius:"0 0 7px 7px",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>

                    {/* Sort type */}
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.6,textTransform:"uppercase"}}>Sort type</span>
                      <select value={s.type} onChange={e=>updateSort(idx,{type:e.target.value})}
                        style={{padding:"4px 7px",border:"1px solid #c4b5fd",borderRadius:5,background:"#f5f3ff",
                          color:"#6d28d9",fontSize:9,fontWeight:700,cursor:"pointer",outline:"none"}}>
                        {TYPE_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>

                    {/* Null handling */}
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.6,textTransform:"uppercase"}}>Empty values</span>
                      <div style={{display:"flex",borderRadius:5,overflow:"hidden",border:"1px solid #c4b5fd"}}>
                        {["last","first"].map(v=>(
                          <button key={v} onClick={()=>updateSort(idx,{nulls:v})}
                            style={{padding:"4px 10px",border:"none",background:s.nulls===v?"#7C3AED":"#f5f3ff",
                              color:s.nulls===v?"#fff":"#6d28d9",fontSize:9,fontWeight:s.nulls===v?900:700,cursor:"pointer"}}>
                            {v==="last"?"Nulls last":"Nulls first"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Move up/down */}
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.6,textTransform:"uppercase"}}>Priority</span>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>idx>0&&moveSort(idx,idx-1)} disabled={idx===0}
                          style={{padding:"4px 8px",borderRadius:5,border:"1px solid "+M.inBd,background:M.inBg,
                            color:idx===0?M.tD:M.tB,fontSize:10,cursor:idx===0?"default":"pointer",opacity:idx===0?.4:1}}>↑</button>
                        <button onClick={()=>idx<sorts.length-1&&moveSort(idx,idx+1)} disabled={idx===sorts.length-1}
                          style={{padding:"4px 8px",borderRadius:5,border:"1px solid "+M.inBd,background:M.inBg,
                            color:idx===sorts.length-1?M.tD:M.tB,fontSize:10,cursor:idx===sorts.length-1?"default":"pointer",opacity:idx===sorts.length-1?.4:1}}>↓</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Add sort rule ── */}
        <div style={{padding:"10px 14px",borderTop:"1px solid "+M.div,flexShrink:0,background:M.mid}}>
          <select value="" onChange={e=>{addSort(e.target.value);e.target.value="";}}
            style={{width:"100%",padding:"8px 12px",border:"2px dashed #c4b5fd",borderRadius:7,
              background:"#f5f3ff",color:"#7C3AED",fontSize:10,fontWeight:900,cursor:"pointer",
              outline:"none",textAlign:"left"}}>
            <option value="">+ Pick a column to sort by…</option>
            {available.map(f=>(
              <option key={f.col} value={f.col}>
                {f.col} — {f.h}{["currency","number","calc"].includes(f.type)?" (Number)":f.type==="date"?" (Date)":""}
              </option>
            ))}
          </select>
        </div>

        {/* ── Active sort summary ── */}
        {sorts.length>0&&(
          <div style={{padding:"6px 14px",borderTop:"1px solid "+M.div,background:M.lo,flexShrink:0}}>
            <div style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.6,textTransform:"uppercase",marginBottom:3}}>Active sort order</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {sorts.map((s,i)=>{
                const rt=resolvedType(s);
                return(
                  <span key={i} style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:4,
                    padding:"2px 7px",fontSize:8,fontWeight:800,color:"#6d28d9",display:"flex",alignItems:"center",gap:3}}>
                    <span style={{background:"#7C3AED",color:"#fff",borderRadius:"50%",width:12,height:12,fontSize:7,
                      fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{i+1}</span>
                    {allFields.find(x=>x.col===s.col)?.h||s.col}
                    <span style={{opacity:.7}}>{dirLabel(rt,s.dir)}</span>
                    {s.nulls==="first"&&<span style={{opacity:.5,fontSize:7}}>∅↑</span>}
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

const EMPTY_ROW = (master, id) => {
  const r = { __id: id, __new: true, __dirty: false };
  (master?.fields || []).forEach(f => { r[f.col] = ""; });
  return r;
};

function BulkEntry({ master, M, A, fz, pyV, rows, setRows, viewState, setViewState, templates, onSaveTemplate, onDeleteTemplate }) {
  const allFields   = master?.fields || [];
  const allCols     = allFields.map(f => f.col);
  const mandFields  = allFields.filter(f => f.req && !f.auto);

  // ── built-in default view (indestructible) ──
  const DEFAULT_VIEW = { name:"Default", __builtin:true, colOrder:allCols, hiddenC:[], sorts:[], filters:{}, groupBy:null, subGroupBy:null };

  // ── derive persisted view state (falls back to defaults on first load) ──
  const vs            = viewState || {};
  const savedOrder    = vs.colOrder ? vs.colOrder.filter(c => allCols.includes(c)) : [];
  const missingCols   = allCols.filter(c => !savedOrder.includes(c));
  const colOrder      = savedOrder.length > 0 ? [...savedOrder, ...missingCols] : allCols;
  const hiddenC       = vs.hiddenC        ?? [];
  const sorts         = vs.sorts          ?? [];
  const filters       = vs.filters        ?? {};
  const groupBy       = vs.groupBy        ?? null;
  const subGroupBy    = vs.subGroupBy     ?? null;
  const activeViewName = vs.activeViewName ?? "Default";

  // ── setters that persist to App ──
  const setColOrder      = v => setViewState(p => ({...(p||{}), colOrder:      typeof v==="function"?v((p||{}).colOrder??allCols):v }));
  const setHiddenC       = v => setViewState(p => ({...(p||{}), hiddenC:       typeof v==="function"?v((p||{}).hiddenC??[]):v }));
  const setSorts         = v => setViewState(p => ({...(p||{}), sorts:         typeof v==="function"?v((p||{}).sorts??[]):v }));
  const setFilters       = v => setViewState(p => ({...(p||{}), filters:       typeof v==="function"?v((p||{}).filters??{}):v }));
  const setGroupBy       = v => setViewState(p => ({...(p||{}), groupBy:       typeof v==="function"?v((p||{}).groupBy??null):v }));
  const setSubGroupBy    = v => setViewState(p => ({...(p||{}), subGroupBy:    typeof v==="function"?v((p||{}).subGroupBy??null):v }));
  const setActiveViewName= v => setViewState(p => ({...(p||{}), activeViewName:typeof v==="function"?v((p||{}).activeViewName??"Default"):v }));

  // ── local-only UI state (ephemeral, resets on remount) ──
  const [selRows,   setSelRows]   = useState(new Set());
  const [editCell,  setEditCell]  = useState(null);
  const [rowErrors, setRowErrors] = useState({});      // { rowId: [colList] }
  const [dragCol,   setDragCol]   = useState(null);
  const [dropCol,   setDropCol]   = useState(null);
  const [showCM,    setShowCM]    = useState(false);
  const [showFP,    setShowFP]    = useState(false);
  const [showSP,    setShowSP]    = useState(false);
  const [showSortPanel,setShowSortPanel] = useState(false);
  const [aggState,  setAggState]  = useState({});
  const [aggOpenInfo, setAggOpenInfo] = useState(null);
  const aggCellClick = (col, el) => {
    if (aggOpenInfo?.col===col) { setAggOpenInfo(null); return; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = Math.max(8, r.top - 410);
    const left = Math.min(r.left, window.innerWidth - 230);
    setAggOpenInfo({ col, top, left });
  };
  const [showSave,  setShowSave]  = useState(false);
  const [tplName,   setTplName]   = useState("");
  const [renamingTpl, setRenamingTpl] = useState(null); // {name, tempName}
  const [toast,     setToast]     = useState(null);
  const nextId = useRef(1000);

  // reset only ephemeral UI state when master changes (view settings persist in App via viewState)
  useEffect(() => {
    setSelRows(new Set()); setEditCell(null); setRowErrors({});
  }, [master?.id]);

  const showToast = (msg, color="#15803d") => { setToast({msg, color}); setTimeout(() => setToast(null), 3000); };

  // ── derived: visible cols (ordered, not hidden) ──
  const visCols = colOrder.filter(c => !hiddenC.includes(c) && allCols.includes(c));

  // ── sort + filter rows ──
  const visRows = (() => {
    let rs = [...rows];
    // filter
    Object.entries(filters).forEach(([col, val]) => {
      if (!val.trim()) return;
      rs = rs.filter(r => String(r[col]||"").toLowerCase().includes(val.trim().toLowerCase()));
    });
    // sort (Notion-style: type-aware, null-safe)
    if (sorts.length > 0) {
      rs.sort((a, b) => {
        for (const {col, dir, type, nulls} of sorts) {
          const av=a[col], bv=b[col];
          const an=av==null||av==="", bn=bv==null||bv==="";
          if(an&&bn) continue;
          if(an) return nulls==="first"?-1:1;
          if(bn) return nulls==="first"?1:-1;
          const ft=type==="auto"||!type?(()=>{const f=allFields.find(x=>x.col===col);return ["currency","number","calc"].includes(f?.type)?"numeric":f?.type==="date"?"date":"alpha";})():type;
          let d=0;
          if(ft==="numeric"){ d=parseFloat(av)-parseFloat(bv); if(isNaN(d))d=0; }
          else if(ft==="date"){ d=new Date(av)-new Date(bv); if(isNaN(d))d=0; }
          else if(ft==="length"){ d=String(av).length-String(bv).length; }
          else { d=String(av).localeCompare(String(bv),undefined,{sensitivity:"base"}); }
          if(d!==0) return dir==="asc"?d:-d;
        }
        return 0;
      });
    }
    return rs;
  })();

  // ── group ──
  const grouped = (() => {
    if (!groupBy) return [{key:"__all", sub:[{subKey:null, rows: visRows}]}];
    const map = {};
    visRows.forEach(r => {
      const k = r[groupBy] || "(blank)";
      if (!map[k]) map[k] = [];
      map[k].push(r);
    });
    return Object.entries(map).map(([key, rows]) => {
      if (!subGroupBy || subGroupBy===groupBy) return {key, sub:[{subKey:null, rows}]};
      const smap={};
      rows.forEach(r=>{ const sk=String(r[subGroupBy]||"(blank)"); if(!smap[sk]) smap[sk]=[]; smap[sk].push(r); });
      return {key, sub:Object.entries(smap).map(([subKey,rows])=>({subKey,rows}))};
    });
  })();

  // ── cell update ──
  const updateCell = (rowId, col, val) => {
    setRowErrors(p => {
      if (!p[rowId]) return p;
      const cols = p[rowId].filter(c => c !== col);
      const n = {...p};
      cols.length > 0 ? n[rowId] = cols : delete n[rowId];
      return n;
    });
    setRows(prev => prev.map(r => {
      if (r.__id !== rowId) return r;
      const updated = {...r, [col]: val, __dirty: true};
      // auto-fields
      const field = allFields.find(f => f.col === col);
      if (field?.fk === "HSN" || col === "U" || col === "M" || col === "F" || col === "E" || col === "J") {
        const hsnR = FK.HSN.find(x => x.v === val);
        const gstCols = {U:"V", M:"N", F:"G", E:"F", J:"K"};
        if (hsnR && gstCols[col]) updated[gstCols[col]] = hsnR.gst + "%";
      }
      if (col === "Q" || col === "R") {
        const wsp = parseFloat(updated["Q"]||0), mrp = parseFloat(updated["R"]||0);
        if (wsp > 0) updated["S"] = ((mrp-wsp)/wsp*100).toFixed(1)+"%";
        if (mrp > 0) updated["T"] = ((mrp-wsp)/mrp*100).toFixed(1)+"%";
      }
      return updated;
    }));
  };

  // ── add new row ──
  const addRow = () => {
    const id = nextId.current++;
    setRows(prev => [...prev, EMPTY_ROW(master, id)]);
    showToast("+ New row added — click cell to enter data", "#0078D4");
  };

  // ── delete selected ──
  const deleteSelected = () => {
    setRows(prev => prev.filter(r => !selRows.has(r.__id)));
    setSelRows(new Set());
    showToast(`🗑 ${selRows.size} row(s) removed`, "#dc2626");
  };

  // ── save dirty rows (with mandatory validation) ──
  const saveDirty = () => {
    const dirtyRows = rows.filter(r => r.__dirty || r.__new);
    const errs = {};
    dirtyRows.forEach(r => {
      const missing = mandFields.filter(f => !String(r[f.col]||"").trim()).map(f => f.col);
      if (missing.length > 0) errs[r.__id] = missing;
    });
    if (Object.keys(errs).length > 0) {
      setRowErrors(errs);
      const totalMissing = Object.values(errs).reduce((a,b)=>a+b.length,0);
      showToast(`⚠ ${Object.keys(errs).length} row(s) missing ${totalMissing} mandatory field(s) — highlighted in red`, "#dc2626");
      return;
    }
    const n = dirtyRows.length;
    setRows(prev => prev.map(r => ({...r, __dirty:false, __new:false})));
    setRowErrors({});
    showToast(`✅ ${n} row(s) saved to sheet`);
  };

  // ── sort helpers ──
  const toggleSort = col => {
    setSorts(prev => {
      const ex = prev.find(s => s.col === col);
      if (!ex) return [{col, dir:"asc"}, ...prev.filter(s=>s.col!==col)];
      if (ex.dir === "asc") return prev.map(s => s.col===col ? {...s, dir:"desc"} : s);
      return prev.filter(s => s.col !== col);
    });
  };
  const sortDir = col => sorts.find(s => s.col === col)?.dir || null;

  // ── drag-drop columns ──
  const onDragStart = col => setDragCol(col);
  const onDragOver  = (e, col) => { e.preventDefault(); setDropCol(col); };
  const onDrop      = col => {
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

  const [editingTpl, setEditingTpl] = useState(null); // {tpl, originalName} — null = closed

  // ── save template ──
  const saveTemplate = () => {
    if (!tplName.trim()) return;
    if (tplName.trim().toLowerCase() === "default") { showToast('⚠ "Default" is a reserved view name', "#dc2626"); return; }
    const tpl = { name:tplName.trim(), colOrder:[...colOrder], hiddenC:[...hiddenC], sorts:[...sorts], filters:{...filters}, groupBy, subGroupBy };
    onSaveTemplate(tpl);
    setActiveViewName(tpl.name);
    showToast(`💾 View "${tpl.name}" saved`);
    setTplName(""); setShowSave(false);
  };
  const loadTemplate = tpl => {
    setColOrder((tpl.colOrder||allCols).filter(c => allCols.includes(c)));
    setHiddenC(tpl.hiddenC||[]); setSorts(tpl.sorts||[]);
    setFilters(tpl.filters||{}); setGroupBy(tpl.groupBy||null); setSubGroupBy(tpl.subGroupBy||null);
    setActiveViewName(tpl.name);
    showToast(`📂 View "${tpl.name}" loaded`, "#7C3AED");
  };

  // ── detect if current state differs from the active saved view ──
  const getViewDirty = () => {
    if (activeViewName === "Default") {
      // compare against default snapshot
      const sameOrder = JSON.stringify(colOrder) === JSON.stringify(allCols);
      const sameHidden = hiddenC.length === 0;
      const sameSorts = sorts.length === 0;
      const sameFilters = Object.values(filters).every(v => !v.trim());
      const sameGroup = groupBy === null;
      const sameSub   = subGroupBy === null;
      return !(sameOrder && sameHidden && sameSorts && sameFilters && sameGroup && sameSub);
    }
    const saved = templates.find(t => t.name === activeViewName);
    if (!saved) return false;
    return (
      JSON.stringify(colOrder) !== JSON.stringify((saved.colOrder||allCols).filter(c=>allCols.includes(c))) ||
      JSON.stringify(hiddenC)  !== JSON.stringify(saved.hiddenC||[]) ||
      JSON.stringify(sorts)    !== JSON.stringify(saved.sorts||[]) ||
      JSON.stringify(filters)  !== JSON.stringify(saved.filters||{}) ||
      groupBy !== (saved.groupBy||null) ||
      subGroupBy !== (saved.subGroupBy||null)
    );
  };
  const viewDirty = getViewDirty();

  // ── save changes back into the active view ──
  const updateCurrentView = () => {
    if (activeViewName === "Default") return; // default is locked
    const updated = { name:activeViewName, colOrder:[...colOrder], hiddenC:[...hiddenC], sorts:[...sorts], filters:{...filters}, groupBy, subGroupBy };
    onSaveTemplate(updated);
    showToast(`✅ View "${activeViewName}" updated`, "#15803d");
  };

  // ── guard: when switching views, warn if current view has unsaved changes ──
  const [viewSwitchGuard, setViewSwitchGuard] = useState(null); // {pendingTpl}
  const tryLoadTemplate = tpl => {
    if (viewDirty && tpl.name !== activeViewName) {
      setViewSwitchGuard({ pendingTpl: tpl });
    } else {
      loadTemplate(tpl);
    }
  };
  // ⧉ Duplicate → open edit modal pre-filled with copy name + same settings
  const dupTemplate = tpl => {
    let dupName = tpl.name + " (copy)";
    let i = 1;
    while (templates.find(t => t.name === dupName) || dupName.toLowerCase() === "default") dupName = tpl.name + ` (copy ${++i})`;
    setEditingTpl({ tpl: { ...tpl, name: dupName }, originalName: null });
  };
  // ✏ Edit → open modal with original name tracked so Save updates in-place
  const editTemplate = tpl => {
    setEditingTpl({ tpl: { ...tpl, colOrder:[...tpl.colOrder], hiddenC:[...tpl.hiddenC], sorts:[...tpl.sorts], filters:{...tpl.filters} }, originalName: tpl.name });
  };
  // Called by modal on Save Changes
  const commitTplEdit = (updated) => {
    if (updated.name.toLowerCase() === "default") { showToast('⚠ "Default" is a reserved view name', "#dc2626"); return; }
    if (editingTpl.originalName && editingTpl.originalName !== updated.name) {
      onDeleteTemplate(editingTpl.originalName);
    }
    onSaveTemplate(updated);
    setActiveViewName(updated.name);
    showToast(`✅ View "${updated.name}" ${editingTpl.originalName ? "updated" : "created"}`, "#15803d");
    setEditingTpl(null);
  };
  const deleteTemplate = name => {
    onDeleteTemplate(name);
    if (activeViewName === name) setActiveViewName("Default");
    showToast(`🗑 View "${name}" deleted`, "#dc2626");
  };
  const renameTemplate = (oldName, newName) => {
    if (!newName.trim() || newName.trim() === oldName) { setRenamingTpl(null); return; }
    if (newName.trim().toLowerCase() === "default") { showToast('⚠ "Default" is a reserved name', "#dc2626"); setRenamingTpl(null); return; }
    if (templates.find(t => t.name === newName.trim())) {
      showToast(`⚠ "${newName.trim()}" already exists`, "#dc2626"); return;
    }
    const tpl = templates.find(t => t.name === oldName);
    if (!tpl) return;
    onDeleteTemplate(oldName);
    onSaveTemplate({...tpl, name: newName.trim()});
    if (activeViewName === oldName) setActiveViewName(newName.trim());
    showToast(`✏ Renamed to "${newName.trim()}"`, "#0078D4");
    setRenamingTpl(null);
  };

  const activeFilters = Object.values(filters).filter(v => v.trim()).length;
  const dirtyCount    = rows.filter(r => r.__dirty || r.__new).length;
  const allSel        = selRows.size === visRows.length && visRows.length > 0;

  const colW = (col) => {
    const f = allFields.find(x => x.col === col);
    if (!f) return 100;
    if (["textarea","text"].includes(f.type)) return 160;
    if (["fk","multifk","dropdown"].includes(f.type)) return 140;
    if (f.type === "currency" || f.type === "number") return 90;
    if (f.type === "manual" || f.type === "autocode") return 100;
    return 110;
  };

  const CC_RED = "#CC0000";

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>

      {/* ── TOOLBAR ROW 1: Actions + Controls ── */}
      <div style={{padding:"6px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
        {/* Actions */}
        <button onClick={addRow} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",border:"none",borderRadius:5,background:CC_RED,color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>
          <span style={{fontSize:13}}>+</span> Add Row
        </button>
        {selRows.size > 0 && (
          <button onClick={deleteSelected} style={{padding:"5px 12px",border:"1px solid #fecaca",borderRadius:5,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:900,cursor:"pointer"}}>
            🗑 Delete {selRows.size}
          </button>
        )}
        {dirtyCount > 0 && (
          <button onClick={saveDirty} style={{padding:"5px 14px",border:"none",borderRadius:5,background:"#15803d",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>
            ✓ Save {dirtyCount} Changes
          </button>
        )}
        <div style={{width:1,height:22,background:M.div,margin:"0 4px"}} />
        {/* Filter */}
        <button onClick={() => {setShowFP(p=>!p);setShowSP(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showFP||activeFilters>0?A.a:M.inBd),background:showFP||activeFilters>0?A.al:M.inBg,color:showFP||activeFilters>0?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          🔍 Filter {activeFilters > 0 && <span style={{background:A.a,color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{activeFilters}</span>}
        </button>
        {/* Sort */}
        <button onClick={() => {setShowSortPanel(true);setShowFP(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showSortPanel||sorts.length>0?"#7C3AED":M.inBd),background:showSortPanel||sorts.length>0?"#ede9fe":M.inBg,color:showSortPanel||sorts.length>0?"#6d28d9":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ↕ Sort {sorts.length > 0 && <span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{sorts.length}</span>}
        </button>
        {/* Group */}
        <select value={groupBy||""} onChange={e=>{setGroupBy(e.target.value||null);if(!e.target.value)setSubGroupBy(null);}} style={{padding:"5px 8px",border:"1.5px solid "+(groupBy?"#059669":M.inBd),borderRadius:5,background:groupBy?"#f0fdf4":M.inBg,color:groupBy?"#15803d":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">⊞ Group by…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)).map(f=>(
            <option key={f.col} value={f.col}>{f.col} — {f.h}</option>
          ))}
        </select>
        {groupBy&&(
          <select value={subGroupBy||""} onChange={e=>setSubGroupBy(e.target.value||null)} title="Sub-group within each group" style={{padding:"5px 8px",border:"1.5px solid "+(subGroupBy?"#7C3AED":"#bbf7d0"),borderRadius:5,background:subGroupBy?"#ede9fe":"#f0fdf4",color:subGroupBy?"#6d28d9":"#15803d",fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
            <option value="">↳ Sub-group by…</option>
            {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)&&f.col!==groupBy).map(f=>(
              <option key={f.col} value={f.col}>{f.col} — {f.h}</option>
            ))}
          </select>
        )}
        {/* Columns */}
        <button onClick={() => {setShowCM(p=>!p);setShowFP(false);setShowSP(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showCM||hiddenC.length>0?"#0078D4":M.inBd),background:showCM||hiddenC.length>0?"#eff6ff":M.inBg,color:showCM||hiddenC.length>0?"#1d4ed8":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ⊟ Columns {hiddenC.length > 0 && <span style={{background:"#0078D4",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{hiddenC.length} hidden</span>}
        </button>
        <div style={{flex:1}} />
        <span style={{fontSize:9,color:M.tC,fontWeight:700}}>{visRows.length} rows · {visCols.length} cols</span>
        {(sorts.length > 0 || activeFilters > 0 || groupBy || subGroupBy) && (
          <button onClick={() => {setSorts([]); setFilters({}); setGroupBy(null); setSubGroupBy(null);}} style={{padding:"4px 9px",border:"1px solid #fecaca",borderRadius:4,background:"#fef2f2",color:"#dc2626",fontSize:9,fontWeight:800,cursor:"pointer"}}>✕ Clear All</button>
        )}
      </div>

      {/* ── TOOLBAR ROW 2: Views bar (always separate line) ── */}
      <div style={{padding:"5px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:5,background:M.lo,flexShrink:0,flexWrap:"wrap",minHeight:32}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",flexShrink:0,marginRight:4}}>VIEWS:</span>

        {/* ── DEFAULT (indestructible) ── */}
        {(() => {
          const isActive = activeViewName === "Default";
          const isModified = isActive && viewDirty;
          return (
            <div style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fff7ed":"#CC000015"):"#f5f5f5",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":"#CC0000"):"#d1d5db"),borderRadius:5,overflow:"hidden"}}>
              <button onClick={()=>tryLoadTemplate(DEFAULT_VIEW)} title="Load Default view"
                style={{padding:"4px 10px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":"#CC0000"):"#374151",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                {isActive && <span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":"#CC0000",display:"inline-block",flexShrink:0}} />}
                🏠 Default
                {isModified && <span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}
              </button>
              <div style={{padding:"2px 6px",fontSize:7,fontWeight:900,color:"#9ca3af",letterSpacing:.5,background:"#ececec",borderLeft:"1px solid #d1d5db",height:"100%",display:"flex",alignItems:"center"}}>LOCKED</div>
            </div>
          );
        })()}

        {/* ── USER SAVED VIEWS ── */}
        {templates.map(t => {
          const isActive = activeViewName === t.name;
          const isModified = isActive && viewDirty;
          return (
            <div key={t.name} style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fffbeb":"#ede9fe"):isModified?"#fffbeb":"#f5f3ff",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":"#7C3AED"):isModified?"#fcd34d":"#c4b5fd"),borderRadius:5,overflow:"hidden"}}>
              {renamingTpl?.name === t.name ? (
                <input autoFocus value={renamingTpl.tempName}
                  onChange={e=>setRenamingTpl(p=>({...p,tempName:e.target.value}))}
                  onKeyDown={e=>{if(e.key==="Enter")renameTemplate(t.name,renamingTpl.tempName);if(e.key==="Escape")setRenamingTpl(null);}}
                  onBlur={()=>renameTemplate(t.name,renamingTpl.tempName)}
                  style={{padding:"3px 8px",border:"none",background:"#fff",color:"#6d28d9",fontSize:10,fontWeight:800,outline:"2px solid #7C3AED",width:130}} />
              ) : (
                <button onClick={()=>tryLoadTemplate(t)} title="Load this view"
                  style={{padding:"4px 9px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":"#6d28d9"):"#7c3aed",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                  {isActive && <span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":"#7C3AED",display:"inline-block",flexShrink:0}} />}
                  📂 {t.name}
                  {isModified && <span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}
                </button>
              )}
              {/* ── UPDATE VIEW button — only on active+modified ── */}
              {isActive && isModified && <>
                <div style={{width:1,height:16,background:"#fcd34d"}} />
                <button onClick={updateCurrentView} title="Save changes into this view"
                  style={{padding:"4px 9px",border:"none",background:"#f59e0b",color:"#fff",fontSize:9,cursor:"pointer",fontWeight:900,display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>
                  💾 Update View
                </button>
              </>}
              <div style={{width:1,height:16,background:"#c4b5fd"}} />
              <button onClick={()=>setRenamingTpl(renamingTpl?.name===t.name?null:{name:t.name,tempName:t.name})} title="Rename view"
                style={{padding:"4px 6px",border:"none",background:renamingTpl?.name===t.name?"#7C3AED":"transparent",color:renamingTpl?.name===t.name?"#fff":"#f59e0b",fontSize:10,cursor:"pointer",fontWeight:900}}>✎</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}} />
              <button onClick={()=>editTemplate(t)} title="Edit view settings"
                style={{padding:"4px 6px",border:"none",background:"transparent",color:"#0078D4",fontSize:10,cursor:"pointer",fontWeight:900}}>✏</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}} />
              <button onClick={()=>dupTemplate(t)} title="Duplicate view"
                style={{padding:"4px 6px",border:"none",background:"transparent",color:"#059669",fontSize:10,cursor:"pointer",fontWeight:900}}>⧉</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}} />
              <button onClick={()=>deleteTemplate(t.name)} title="Delete view"
                style={{padding:"4px 6px",border:"none",background:"transparent",color:"#dc2626",fontSize:10,cursor:"pointer",fontWeight:900}}>×</button>
            </div>
          );
        })}

        {/* ── Save new view ── */}
        <button onClick={()=>setShowSave(p=>!p)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid #c4b5fd",background:showSave?"#7C3AED":"#fdf4ff",color:showSave?"#fff":"#7C3AED",fontSize:9,fontWeight:900,cursor:"pointer"}}>+ Save View</button>
      </div>

      {/* ── VIEW SWITCH GUARD MODAL ── */}
      {viewSwitchGuard && (
        <>
          <div onClick={()=>setViewSwitchGuard(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(2px)",zIndex:1500}} />
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:M.hi,border:"1px solid #fcd34d",borderRadius:10,zIndex:1501,boxShadow:"0 8px 32px rgba(0,0,0,.3)",overflow:"hidden"}}>
            <div style={{background:"#f59e0b",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>⚠️</span>
              <div>
                <div style={{color:"#fff",fontSize:13,fontWeight:900}}>Unsaved View Changes</div>
                <div style={{color:"rgba(255,255,255,.85)",fontSize:10}}>
                  Current view <strong>"{activeViewName}"</strong> has unsaved modifications
                </div>
              </div>
            </div>
            <div style={{padding:"16px 20px"}}>
              <div style={{fontSize:12,color:M.tA,marginBottom:16,lineHeight:1.6}}>
                You changed columns, sort, filter, or grouping in <span style={{fontWeight:900,color:"#92400e"}}>"{activeViewName}"</span> but haven't saved them. What do you want to do?
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button onClick={()=>{ updateCurrentView(); loadTemplate(viewSwitchGuard.pendingTpl); setViewSwitchGuard(null); }}
                  style={{padding:"9px 16px",border:"none",borderRadius:6,background:"#15803d",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer",textAlign:"left"}}>
                  💾 Save changes to "{activeViewName}" — then switch
                </button>
                <button onClick={()=>{ loadTemplate(viewSwitchGuard.pendingTpl); setViewSwitchGuard(null); }}
                  style={{padding:"9px 16px",border:"1px solid #fcd34d",borderRadius:6,background:"#fffbeb",color:"#92400e",fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left"}}>
                  ↩ Discard changes — switch to "{viewSwitchGuard.pendingTpl.name}"
                </button>
                <button onClick={()=>setViewSwitchGuard(null)}
                  style={{padding:"9px 16px",border:"1px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tB,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"left"}}>
                  ← Stay on "{activeViewName}" and keep editing
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FILTER PANEL ── */}
      {showFP && (
        <div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginRight:4}}>FILTER BY:</span>
          {visCols.map(col => {
            const f = allFields.find(x=>x.col===col);
            if (!f || f.auto || ["calc","autocode"].includes(f.type)) return null;
            return (
              <div key={col} style={{display:"flex",alignItems:"center",gap:4,background:M.lo,border:"1px solid "+M.inBd,borderRadius:5,padding:"3px 6px"}}>
                <span style={{fontSize:8,fontWeight:900,color:M.tD,fontFamily:"monospace"}}>{col}</span>
                <input value={filters[col]||""} onChange={e=>setFilters(p=>({...p,[col]:e.target.value}))}
                  placeholder={f.h} style={{border:"none",background:"transparent",color:M.tA,fontSize:10,outline:"none",width:100}} />
                {filters[col] && <button onClick={()=>setFilters(p=>{const n={...p};delete n[col];return n;})} style={{border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:10,padding:0}}>×</button>}
              </div>
            );
          })}
          <button onClick={() => setFilters({})} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>
        </div>
      )}



      {/* ── SORT PANEL OVERLAY ── */}
      {showSortPanel&&(
        <SortPanel sorts={sorts} setSorts={setSorts} allFields={allFields} M={M} A={A} onClose={()=>setShowSortPanel(false)}/>
      )}

      {/* ── COLUMN MANAGER ── */}
      {showCM && (
        <div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginRight:4}}>COLUMNS:</span>
          {allCols.map(col => {
            const f = allFields.find(x=>x.col===col);
            const hidden = hiddenC.includes(col);
            return (
              <button key={col} onClick={()=>setHiddenC(p=>hidden?p.filter(c=>c!==col):[...p,col])} style={{padding:"3px 8px",borderRadius:4,border:"1.5px solid "+(hidden?M.div:A.a),background:hidden?M.lo:A.al,color:hidden?M.tD:A.a,fontSize:9,fontWeight:hidden?700:900,cursor:"pointer",textDecoration:hidden?"line-through":"none"}}>
                {col} {f?.h}
              </button>
            );
          })}
          <button onClick={()=>setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:4}}>Show All</button>
        </div>
      )}

      {/* ── SAVE TEMPLATE ── */}
      {showSave && (
        <div style={{padding:"8px 12px",borderBottom:"1px solid "+M.div,background:"#fdfbff",flexShrink:0,display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:900,color:"#6d28d9",letterSpacing:.8,textTransform:"uppercase"}}>SAVE VIEW TEMPLATE:</span>
          <input value={tplName} onChange={e=>setTplName(e.target.value)} placeholder="Template name…" style={{border:"1.5px solid #c4b5fd",borderRadius:5,background:"#fff",color:"#1a1a1a",fontSize:11,padding:"4px 9px",outline:"none",width:200}} />
          <button onClick={saveTemplate} style={{padding:"5px 14px",border:"none",borderRadius:5,background:"#7C3AED",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>💾 Save</button>
          <button onClick={()=>setShowSave(false)} style={{padding:"5px 10px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>Cancel</button>
          <span style={{fontSize:9,color:"#6d28d9",marginLeft:4}}>Saves current column order, visibility, sort & filter state</span>
        </div>
      )}

      {/* ── TABLE ── */}
      <div style={{flex:1,overflowX:"auto",overflowY:"auto"}}>
        <table style={{borderCollapse:"collapse",minWidth:"100%"}}>
          <thead style={{position:"sticky",top:0,zIndex:20}}>
            <tr>
              {/* checkbox col */}
              <th style={{width:32,padding:"0 6px",background:M.thd,borderBottom:"2px solid "+CC_RED,position:"sticky",left:0,zIndex:21}}>
                <input type="checkbox" checked={allSel} onChange={e => setSelRows(e.target.checked ? new Set(visRows.map(r=>r.__id)) : new Set())} style={{cursor:"pointer"}} />
              </th>
              {/* row # */}
              <th style={{width:34,padding:"0 6px",background:M.thd,borderBottom:"2px solid "+CC_RED,fontSize:9,color:M.tD,fontWeight:900}}>#</th>
              {/* data cols */}
              {visCols.map(col => {
                const f  = allFields.find(x=>x.col===col);
                const sd = sortDir(col);
                const isDrop = dropCol === col && dragCol !== col;
                return (
                  <th key={col}
                    draggable onDragStart={()=>onDragStart(col)} onDragOver={e=>onDragOver(e,col)} onDrop={()=>onDrop(col)} onDragEnd={()=>{setDragCol(null);setDropCol(null);}}
                    style={{minWidth:colW(col),maxWidth:colW(col)+40,padding:"6px 8px",background:isDrop?"#fef3c7":M.thd,borderBottom:"2px solid "+CC_RED,borderLeft:isDrop?"3px solid #f59e0b":"3px solid transparent",cursor:"grab",userSelect:"none",whiteSpace:"nowrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:8,color:M.tD,fontFamily:"monospace",flexShrink:0}}>{col}</span>
                      <span style={{fontSize:9,fontWeight:900,color:M.tA,overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{f?.h||col}</span>
                      {f && <span style={{flexShrink:0}}><DtBadge type={f.type} /></span>}
                      <button onClick={()=>toggleSort(col)} style={{border:"none",background:"none",cursor:"pointer",fontSize:12,color:sd?A.a:M.tD,padding:"0 2px",flexShrink:0}}>{sd==="asc"?"↑":sd==="desc"?"↓":"⇅"}</button>
                    </div>
                  </th>
                );
              })}
              {/* action col */}
              <th style={{width:40,background:M.thd,borderBottom:"2px solid "+CC_RED}} />
            </tr>
          </thead>
          <tbody>
            {grouped.map((group,gi) => (
              <Fragment key={gi}>
                {/* group header */}
                {group.key!=="__all"&&(
                  <tr>
                    <td colSpan={visCols.length+3} style={{padding:"6px 12px",background:"#1e293b",borderBottom:"2px solid "+M.div,fontWeight:900,fontSize:11,color:"#f1f5f9",letterSpacing:.3}}>
                      <span style={{background:A.a,color:"#fff",borderRadius:3,padding:"2px 8px",fontSize:9,fontWeight:900,marginRight:8,fontFamily:"monospace"}}>{group.sub.reduce((n,sg)=>n+sg.rows.length,0)}</span>
                      <span style={{opacity:.6,marginRight:4}}>{allFields.find(f=>f.col===groupBy)?.h||groupBy}:</span>
                      <strong>{group.key}</strong>
                    </td>
                  </tr>
                )}
                {/* sub-groups + data rows */}
                {group.sub.map((sg,sgi)=>(
                  <Fragment key={sgi}>
                    {sg.subKey!==null&&(
                      <tr><td colSpan={visCols.length+3} style={{padding:"4px 12px 4px 28px",background:"#334155",borderBottom:"1px solid "+M.div,fontSize:9,fontWeight:800,color:"#cbd5e1"}}>
                        <span style={{background:"#7C3AED",color:"#fff",borderRadius:3,padding:"1px 6px",fontSize:8,fontWeight:900,marginRight:7,fontFamily:"monospace"}}>{sg.rows.length}</span>
                        <span style={{opacity:.6,marginRight:4}}>↳ {allFields.find(f=>f.col===subGroupBy)?.h||subGroupBy}:</span>
                        <strong>{sg.subKey}</strong>
                      </td></tr>
                    )}
                {sg.rows.map((row, ri) => {
                  const isSel      = selRows.has(row.__id);
                  const isDirty    = row.__dirty || row.__new;
                  const rowErrCols = rowErrors[row.__id] || [];
                  const hasRowErr  = rowErrCols.length > 0;
                  const rowBg      = isSel ? A.al : hasRowErr ? "#fff5f5" : isDirty ? "#fffbeb" : ri%2===0 ? M.tev : M.tod;
                  return (
                    <tr key={row.__id} style={{background:rowBg,borderBottom:"1px solid "+M.div,borderLeft:"3px solid "+(hasRowErr?"#dc2626":row.__new?"#0078D4":isDirty?"#f59e0b":isSel?A.a:"transparent")}}>
                      {/* checkbox */}
                      <td style={{padding:"0 6px",textAlign:"center",position:"sticky",left:0,background:rowBg,zIndex:5}}>
                        <input type="checkbox" checked={isSel} onChange={e=>{setSelRows(prev=>{const n=new Set(prev);e.target.checked?n.add(row.__id):n.delete(row.__id);return n;});}} style={{cursor:"pointer"}} />
                      </td>
                      {/* row # */}
                      <td style={{padding:"3px 6px",fontFamily:"monospace",fontSize:9,color:M.tD,textAlign:"center"}}>
                        {row.__new ? <span style={{color:"#0078D4",fontSize:8,fontWeight:900}}>NEW</span> : String(ri+1).padStart(2,"0")}
                      </td>
                      {/* cells */}
                      {visCols.map(col => {
                        const f         = allFields.find(x=>x.col===col);
                        const isAuto    = f?.auto || ["calc","autocode"].includes(f?.type||"");
                        const isEdit    = editCell?.rowId===row.__id && editCell?.col===col;
                        const val       = row[col]||"";
                        const isFirst   = col === visCols[0];
                        const isMissing = rowErrCols.includes(col);
                        return (
                          <td key={col}
                            onClick={()=>{ if(!isAuto){setEditCell({rowId:row.__id, col}); setRowErrors(p=>{const n={...p};if(n[row.__id])n[row.__id]=n[row.__id].filter(c=>c!==col);return n;});} }}
                            onBlur={()=>setEditCell(null)}
                            style={{padding:"2px 4px",maxWidth:colW(col)+40,cursor:isAuto?"default":"pointer",borderRight:"1px solid "+M.div,background:isMissing?"#fff0f0":"inherit"}}>
                            {isAuto ? (
                              <div style={{fontSize:fz-2,color:A.a,fontFamily:"monospace",padding:"3px 5px",background:A.al,borderRadius:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{val || <span style={{opacity:.5}}>auto</span>}</div>
                            ) : isEdit ? (
                              <BulkCell f={f} val={val} onChange={v=>updateCell(row.__id, col, v)} onBlur={()=>setEditCell(null)} M={M} A={A} fz={fz} />
                            ) : (
                              <div style={{fontSize:fz-2,color:isFirst?A.a:M.tA,fontWeight:isFirst?700:400,fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit",padding:"3px 5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",borderBottom:"1px dashed "+(isMissing?"#ef4444":val?"transparent":M.inBd),minHeight:20}}>
                                {val
                                  ? val
                                  : isMissing
                                    ? <span style={{color:"#dc2626",fontWeight:900,fontSize:fz-3}}>⚠ required</span>
                                    : <span style={{color:M.tD,fontStyle:"italic",fontFamily:"inherit",fontSize:fz-3}}>{f?.req?"fill required":"—"}</span>
                                }
                              </div>
                            )}
                          </td>
                        );
                      })}
                      {/* delete btn */}
                      <td style={{padding:"2px 4px",textAlign:"center"}}>
                        <button onClick={()=>{setRows(p=>p.filter(r=>r.__id!==row.__id));}} style={{width:20,height:20,borderRadius:3,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",cursor:"pointer",fontSize:11,lineHeight:1}}>×</button>
                      </td>
                    </tr>
                  );
                })}
                  </Fragment>
                ))}
              </Fragment>
            ))}
            {/* ── Add row footer ── */}
            <tr style={{borderBottom:"1px solid "+M.div}}>
              <td colSpan={visCols.length+3} style={{padding:"6px 12px"}}>
                <button onClick={addRow} style={{display:"flex",alignItems:"center",gap:6,color:M.tD,background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:700}}>
                  <span style={{fontSize:16,color:A.a}}>+</span> Add new row
                </button>
              </td>
            </tr>
          </tbody>
            <AggFooter visRows={visRows} visCols={visCols} allFields={allFields}
              aggState={aggState} openCol={aggOpenInfo?.col||null}
              onCellClick={aggCellClick}
              hasCheckbox={true} M={M} A={A} />
        </table>
      </div>

      {/* ── AGG DROPDOWN ── */}
      {aggOpenInfo&&(
        <>
          <div onClick={()=>setAggOpenInfo(null)} style={{position:"fixed",inset:0,zIndex:9998}}/>
          <AggDropdown openInfo={aggOpenInfo} aggState={aggState} setAggState={setAggState}
            visRows={visRows} allFields={allFields} onClose={()=>setAggOpenInfo(null)} M={M} A={A}/>
        </>
      )}

      {/* ── BOTTOM BAR ── */}
      <div style={{padding:"4px 12px",borderTop:"1px solid "+M.div,background:M.mid,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{fontSize:9,color:M.tD,fontWeight:700}}>{rows.length} total · {visRows.length} visible</span>
        {dirtyCount > 0 && <span style={{fontSize:9,color:"#f59e0b",fontWeight:900}}>● {dirtyCount} unsaved</span>}
        {selRows.size > 0 && <span style={{fontSize:9,color:A.a,fontWeight:900}}>{selRows.size} selected</span>}
        {sorts.length > 0 && <span style={{fontSize:9,color:"#6d28d9"}}>↕ sorted by {sorts.map(s=>s.col).join(", ")}</span>}
        {activeFilters > 0 && <span style={{fontSize:9,color:A.a}}>🔍 {activeFilters} filter(s) active</span>}
        {groupBy && <span style={{fontSize:9,color:"#059669"}}>⊞ grouped by {allFields.find(f=>f.col===groupBy)?.h||groupBy}{subGroupBy&&<> ↳ {allFields.find(f=>f.col===subGroupBy)?.h||subGroupBy}</>}</span>}
        <div style={{flex:1}} />
        <span style={{fontSize:8,color:M.tD,fontFamily:"monospace"}}>⬅ drag headers to reorder · click cell to edit · ⇅ to sort</span>
      </div>

      {/* ── VIEW EDIT MODAL ── */}
      {editingTpl && (
        <ViewEditModal
          allFields={allFields}
          allCols={allCols}
          initial={editingTpl.tpl}
          isNew={!editingTpl.originalName}
          isDup={!editingTpl.originalName}
          existingNames={["Default", ...templates.map(t=>t.name).filter(n => n !== editingTpl.originalName)]}
          onSave={commitTplEdit}
          onCancel={()=>setEditingTpl(null)}
          M={M} A={A} fz={fz}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div style={{position:"absolute",bottom:40,right:16,zIndex:999,background:toast.color||"#15803d",color:"#fff",borderRadius:7,padding:"8px 16px",fontSize:11,fontWeight:800,boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ViewEditModal({ allFields, allCols, initial, isNew, isDup, existingNames, onSave, onCancel, M, A, fz }) {
  const [name,     setName]     = useState(initial.name);
  const [hiddenC,  setHiddenC]  = useState([...(initial.hiddenC||[])]);
  const [colOrder, setColOrder] = useState([...(initial.colOrder||allCols)]);
  const [sorts,    setSorts]    = useState([...(initial.sorts||[])]);
  const [filters,  setFilters]  = useState({...(initial.filters||{})});
  const [groupBy,  setGroupBy]  = useState(initial.groupBy||null);
  const [subGroupBy,setSubGroupBy]= useState(initial.subGroupBy||null);
  const [activeTab,setActiveTab]= useState("columns"); // columns | sort | filter | group

  const nameConflict = existingNames.includes(name.trim());
  const canSave = name.trim().length > 0 && !nameConflict;

  const toggleHide = col => setHiddenC(p => p.includes(col) ? p.filter(c=>c!==col) : [...p,col]);
  const moveColUp   = col => setColOrder(p=>{const a=[...p],i=a.indexOf(col);if(i<=0)return a;[a[i-1],a[i]]=[a[i],a[i-1]];return a;});
  const moveColDown = col => setColOrder(p=>{const a=[...p],i=a.indexOf(col);if(i<0||i>=a.length-1)return a;[a[i],a[i+1]]=[a[i+1],a[i]];return a;});
  const toggleSort  = col => setSorts(p=>{const ex=p.find(s=>s.col===col);if(!ex)return[{col,dir:"asc",type:"auto",nulls:"last"},...p];if(ex.dir==="asc")return p.map(s=>s.col===col?{...s,dir:"desc"}:s);return p.filter(s=>s.col!==col);});

  const TAB_STYLE = (t) => ({
    padding:"6px 14px", border:"none", cursor:"pointer", fontSize:10, fontWeight:activeTab===t?900:700,
    borderBottom:"2px solid "+(activeTab===t?"#7C3AED":"transparent"),
    background:"transparent", color:activeTab===t?"#7C3AED":M.tC,
  });

  return (
    <>
      <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(3px)",zIndex:2000}} />
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:660,maxHeight:"85vh",background:M.hi,border:"1px solid #c4b5fd",borderRadius:12,zIndex:2001,boxShadow:"0 8px 40px rgba(0,0,0,.4)",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header */}
        <div style={{background:"#7C3AED",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:18}}>{isDup?"⧉":"✏"}</span>
          <div>
            <div style={{fontSize:13,fontWeight:900,color:"#fff"}}>{isDup?"Duplicate View — Edit Before Saving":"Edit Saved View"}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.75)"}}>Change name, columns, sorts, filters, group — then Save Changes</div>
          </div>
          <button onClick={onCancel} style={{marginLeft:"auto",width:28,height:28,borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",cursor:"pointer",fontSize:16}}>×</button>
        </div>

        {/* Name row */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid "+M.div,background:M.mid,flexShrink:0,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,flexShrink:0}}>VIEW NAME *</span>
          <input
            value={name} onChange={e=>setName(e.target.value)} placeholder="Enter view name…"
            style={{flex:1,border:"2px solid "+(nameConflict?"#ef4444":name.trim()?"#7C3AED":M.inBd),borderRadius:6,background:M.inBg,color:M.tA,fontSize:13,padding:"6px 10px",outline:"none",fontWeight:700}}
          />
          {nameConflict && <span style={{fontSize:10,color:"#ef4444",fontWeight:700,flexShrink:0}}>{name.trim().toLowerCase()==="default"?'⚠ "Default" is reserved':'⚠ Name already exists'}</span>}
          {!nameConflict && name.trim() && <span style={{fontSize:10,color:"#15803d",fontWeight:700,flexShrink:0}}>✓ OK</span>}
        </div>

        {/* Sub-tabs */}
        <div style={{display:"flex",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0}}>
          {[
            {id:"columns", lbl:"⊟ Columns", badge: hiddenC.length > 0 ? `${hiddenC.length} hidden`  : `${colOrder.length}`},
            {id:"sort",    lbl:"↕ Sort",    badge: sorts.length > 0   ? `${sorts.length} active`   : null},
            {id:"filter",  lbl:"🔍 Filter",  badge: Object.values(filters).filter(v=>v.trim()).length > 0 ? `${Object.values(filters).filter(v=>v.trim()).length} active` : null},
            {id:"group",   lbl:"⊞ Group",   badge: groupBy            ? allFields.find(f=>f.col===groupBy)?.h?.slice(0,12)||groupBy : null},
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={TAB_STYLE(t.id)}>
              {t.lbl}
              {t.badge && <span style={{marginLeft:5,background:activeTab===t.id?"#7C3AED":"#e0e7ef",color:activeTab===t.id?"#fff":"#374151",borderRadius:10,padding:"1px 6px",fontSize:8,fontWeight:900}}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{flex:1,overflowY:"auto"}}>

          {/* COLUMNS */}
          {activeTab==="columns" && (
            <div style={{padding:12}}>
              <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Toggle visibility · drag to reorder</span>
                <button onClick={()=>setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:"auto"}}>Show All</button>
                <button onClick={()=>setHiddenC([...allCols])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Hide All</button>
              </div>
              <div style={{border:"1px solid "+M.div,borderRadius:7,overflow:"hidden"}}>
                {colOrder.map((col,idx)=>{
                  const f = allFields.find(x=>x.col===col);
                  const isHidden = hiddenC.includes(col);
                  return (
                    <div key={col} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderBottom:"1px solid "+M.div,background:isHidden?M.lo:M.hi,opacity:isHidden?.55:1}}>
                      {/* visibility toggle */}
                      <button onClick={()=>toggleHide(col)} style={{width:28,height:18,borderRadius:9,border:"none",cursor:"pointer",background:isHidden?"#d1d5db":"#7C3AED",position:"relative",flexShrink:0,transition:"background .2s"}}>
                        <span style={{position:"absolute",top:2,width:14,height:14,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.3)",transition:"left .2s",left:isHidden?2:12}} />
                      </button>
                      <span style={{fontFamily:"monospace",fontSize:8,fontWeight:700,color:M.tD,width:20,flexShrink:0}}>{col}</span>
                      <span style={{flex:1,fontSize:fz-2,fontWeight:700,color:isHidden?M.tD:M.tA}}>{f?.h||col}</span>
                      {f && <DtBadge type={f.type} />}
                      {/* reorder */}
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
                {sorts.map((s,i)=>{
                  const f=allFields.find(x=>x.col===s.col);
                  return (
                    <div key={s.col} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:7}}>
                      <span style={{fontSize:11,fontWeight:900,color:"#6d28d9",minWidth:18}}>{i+1}.</span>
                      <span style={{flex:1,fontSize:11,fontWeight:700,color:M.tA}}>{f?.h||s.col} <span style={{fontFamily:"monospace",fontSize:8,color:M.tD}}>({s.col})</span></span>
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
                {allFields.filter(f=>!sorts.find(s=>s.col===f.col)).map(f=>(
                  <option key={f.col} value={f.col}>{f.col} — {f.h}</option>
                ))}
              </select>
            </div>
          )}

          {/* FILTER */}
          {activeTab==="filter" && (
            <div style={{padding:12}}>
              <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Filter values — text match per column</span>
                {Object.values(filters).some(v=>v.trim()) && <button onClick={()=>setFilters({})} style={{marginLeft:"auto",padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {allFields.filter(f=>!f.auto&&!["calc","autocode"].includes(f.type)).map(f=>(
                  <div key={f.col} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",border:"1px solid "+(filters[f.col]?.trim()?A.a:M.div),borderRadius:7,background:filters[f.col]?.trim()?A.al:M.hi}}>
                    <span style={{fontFamily:"monospace",fontSize:8,fontWeight:900,color:M.tD,width:22,flexShrink:0}}>{f.col}</span>
                    <span style={{fontSize:fz-2,fontWeight:700,color:M.tB,width:130,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.h}</span>
                    <DtBadge type={f.type} />
                    <input value={filters[f.col]||""} onChange={e=>setFilters(p=>({...p,[f.col]:e.target.value}))} placeholder="contains…"
                      style={{flex:1,border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tA,fontSize:10,padding:"4px 8px",outline:"none"}} />
                    {filters[f.col] && <button onClick={()=>setFilters(p=>{const n={...p};delete n[f.col];return n;})} style={{width:20,height:20,borderRadius:4,border:"none",background:"#fef2f2",color:"#dc2626",cursor:"pointer",fontSize:12,fontWeight:900}}>×</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP */}
          {activeTab==="group" && (
            <div style={{padding:12}}>
              <div style={{marginBottom:10,fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Group rows by a column</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div onClick={()=>setGroupBy(null)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"2px solid "+(groupBy===null?A.a:M.div),borderRadius:7,cursor:"pointer",background:groupBy===null?A.al:M.hi}}>
                  <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid "+(groupBy===null?A.a:M.inBd),background:groupBy===null?A.a:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {groupBy===null && <span style={{color:"#fff",fontSize:9,fontWeight:900}}>●</span>}
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:groupBy===null?A.a:M.tB}}>No grouping — show flat list</span>
                </div>
                {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)).map(f=>(
                  <div key={f.col} onClick={()=>setGroupBy(f.col)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"2px solid "+(groupBy===f.col?A.a:M.div),borderRadius:7,cursor:"pointer",background:groupBy===f.col?A.al:M.hi}}>
                    <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid "+(groupBy===f.col?A.a:M.inBd),background:groupBy===f.col?A.a:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {groupBy===f.col && <span style={{color:"#fff",fontSize:9,fontWeight:900}}>●</span>}
                    </div>
                    <span style={{fontFamily:"monospace",fontSize:9,fontWeight:700,color:M.tD,flexShrink:0}}>{f.col}</span>
                    <span style={{flex:1,fontSize:11,fontWeight:700,color:groupBy===f.col?A.a:M.tB}}>{f.h}</span>
                    <DtBadge type={f.type} />
                  </div>
                ))}
              </div>

              {/* ── Sub-group section ── */}
              {groupBy&&(
                <div style={{marginTop:14,paddingTop:12,borderTop:"2px dashed #c4b5fd"}}>
                  <div style={{marginBottom:8,fontSize:9,fontWeight:900,color:"#7C3AED",textTransform:"uppercase",letterSpacing:.8,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12}}>↳</span> Sub-group within each group (optional)
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <div onClick={()=>setSubGroupBy(null)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:"2px solid "+(subGroupBy===null?"#7C3AED":M.div),borderRadius:7,cursor:"pointer",background:subGroupBy===null?"#ede9fe":M.hi}}>
                      <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+(subGroupBy===null?"#7C3AED":M.inBd),background:subGroupBy===null?"#7C3AED":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {subGroupBy===null&&<span style={{color:"#fff",fontSize:8,fontWeight:900}}>●</span>}
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:subGroupBy===null?"#6d28d9":M.tB}}>No sub-grouping</span>
                    </div>
                    {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)&&f.col!==groupBy).map(f=>(
                      <div key={f.col} onClick={()=>setSubGroupBy(f.col)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:"2px solid "+(subGroupBy===f.col?"#7C3AED":M.div),borderRadius:7,cursor:"pointer",background:subGroupBy===f.col?"#ede9fe":M.hi}}>
                        <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+(subGroupBy===f.col?"#7C3AED":M.inBd),background:subGroupBy===f.col?"#7C3AED":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {subGroupBy===f.col&&<span style={{color:"#fff",fontSize:8,fontWeight:900}}>●</span>}
                        </div>
                        <span style={{fontFamily:"monospace",fontSize:9,fontWeight:700,color:M.tD,flexShrink:0}}>{f.col}</span>
                        <span style={{flex:1,fontSize:10,fontWeight:700,color:subGroupBy===f.col?"#6d28d9":M.tB}}>{f.h}</span>
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
        <div style={{padding:"10px 16px",borderTop:"1px solid "+M.div,display:"flex",alignItems:"center",gap:8,background:M.mid,flexShrink:0}}>
          <div style={{flex:1,fontSize:9,color:M.tC}}>
            {`${colOrder.filter(c=>!hiddenC.includes(c)).length} visible · ${sorts.length} sort(s) · ${Object.values(filters).filter(v=>v.trim()).length} filter(s)${groupBy?" · grouped":""}${subGroupBy?" · sub-grouped":""}` }
          </div>
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

function BulkCell({ f, val, onChange, onBlur, M, A, fz }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const base = {width:"100%",border:"2px solid "+A.a,borderRadius:4,background:M.inBg,color:M.tA,fontSize:fz-2,padding:"3px 6px",outline:"none",fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit"};
  if (f?.type === "dropdown" || f?.type === "fk" || f?.type === "multifk") {
    const opts = f.opts || FK[f.fk] || [];
    return (
      <select ref={ref} value={val} onChange={e=>onChange(e.target.value)} onBlur={onBlur} style={{...base,cursor:"pointer"}}>
        <option value="">— select —</option>
        {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    );
  }
  if (f?.type === "textarea") return <input ref={ref} value={val} onChange={e=>onChange(e.target.value)} onBlur={onBlur} style={base} />;
  if (f?.type === "currency" || f?.type === "number") return <input ref={ref} type="number" value={val} onChange={e=>onChange(e.target.value)} onBlur={onBlur} style={base} />;
  return <input ref={ref} type="text" value={val} onChange={e=>onChange(e.target.value)} onBlur={onBlur} style={base} />;
}


// ═══════════════════════════════════════════════════════════════════════
//  STANDALONE APP — wraps BulkEntry with all required state
// ═══════════════════════════════════════════════════════════════════════
const { useState, useEffect, useRef, useCallback } = React;

export default function App() {
  // ── Theme & Accent state ──
  const [modeKey, setModeKey] = useState("light");
  const [accKey,  setAccKey]  = useState("orange");
  const [fz,      setFz]      = useState(13);
  const [pyV,     setPyV]     = useState(6);
  const M = MODES[modeKey];
  const A = ACC[accKey];

  // ── Master selection ──
  const [selId, setSelId] = useState(MASTERS[0].id);
  const master = MASTERS.find(m => m.id === selId) || MASTERS[0];

  // ── Bulk Entry state (keyed by masterId) ──
  const initRows = (m) => m.mockRecords
    ? m.mockRecords.map((r,i) => ({ ...r, __id:i+1, __new:false, __dirty:false }))
    : [];

  const [bulkRows,      setBulkRows]      = useState(() => {
    const r = {}; MASTERS.forEach(m => { r[m.id] = initRows(m); }); return r;
  });
  const [bulkViewState, setBulkViewState] = useState({});
  const [bulkTpls,      setBulkTpls]      = useState({});

  // ── Guard modal ──
  const [guardModal,  setGuardModal]  = useState(null);
  const [toastMsg,    setToastMsg]    = useState(null);

  const showToast = (msg, color="#15803d") => {
    setToastMsg({ msg, color });
    setTimeout(() => setToastMsg(null), 2800);
  };

  const bulkDirty = (bulkRows[selId]||[]).some(r => r.__dirty || r.__new);

  const trySetMaster = (newId) => {
    if (bulkDirty) {
      setGuardModal({ newId });
    } else {
      setSelId(newId);
    }
  };

  // ── Props proxies ──
  const getRows    = () => bulkRows[selId] ?? initRows(master);
  const setRows    = (rs) => setBulkRows(prev => ({
    ...prev,
    [selId]: typeof rs === "function" ? rs(prev[selId] ?? initRows(master)) : rs
  }));
  const getVS      = () => bulkViewState[selId] || null;
  const setVS      = (vs) => setBulkViewState(prev => ({
    ...prev,
    [selId]: typeof vs === "function" ? vs(prev[selId] || null) : vs
  }));
  const getTpls    = () => bulkTpls[selId] || [];
  const saveTpl    = (tpl) => setBulkTpls(prev => ({
    ...prev,
    [selId]: [...(prev[selId]||[]).filter(t => t.name !== tpl.name), tpl]
  }));
  const delTpl     = (name) => setBulkTpls(prev => ({
    ...prev,
    [selId]: (prev[selId]||[]).filter(t => t.name !== name)
  }));

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Nunito Sans', sans-serif",
      background:M.bg, color:M.tB, fontSize:fz, overflow:"hidden" }}>

      {/* ── Sidebar ── */}
      <div style={{ width:200, flexShrink:0, background:M.mid, borderRight:"1px solid "+M.div,
        display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"10px 12px 6px", borderBottom:"1px solid "+M.div }}>
          <div style={{ fontSize:11, fontWeight:900, color:A.a, letterSpacing:.5 }}>CC ERP</div>
          <div style={{ fontSize:8, color:M.tD }}>CONFIDENCE CLOTHING</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
          {MASTERS.map(m => (
            <button key={m.id} onClick={() => trySetMaster(m.id)} style={{
              display:"block", width:"100%", textAlign:"left",
              padding:"6px 12px", border:"none", background:"transparent",
              color: selId===m.id ? A.a : M.tB, cursor:"pointer",
              borderLeft: selId===m.id ? "3px solid "+A.a : "3px solid transparent",
              fontWeight: selId===m.id ? 900 : 500, fontSize:11,
            }}>
              {m.label}
              <span style={{ float:"right", fontSize:9, color:M.tD }}>{m.fields?.length||0}</span>
            </button>
          ))}
        </div>

        {/* Theme + Settings row */}
        <div style={{ padding:"8px 10px", borderTop:"1px solid "+M.div, display:"flex", gap:6, flexWrap:"wrap" }}>
          {Object.keys(MODES).map(k => (
            <button key={k} onClick={() => setModeKey(k)} title={k} style={{
              width:16, height:16, borderRadius:3, border:"2px solid "+(modeKey===k?"#CC0000":"#ccc"),
              background:MODES[k].bg, cursor:"pointer", padding:0
            }}/>
          ))}
        </div>
        <div style={{ padding:"4px 10px 8px", display:"flex", gap:4, flexWrap:"wrap" }}>
          {Object.entries(ACC).map(([k,v]) => (
            <button key={k} onClick={() => setAccKey(k)} title={k} style={{
              width:16, height:16, borderRadius:"50%", border:"2px solid "+(accKey===k?"#1e293b":"transparent"),
              background:v.a, cursor:"pointer", padding:0
            }}/>
          ))}
        </div>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"8px 16px", borderBottom:"1px solid "+M.div,
          background:M.hi, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:13, fontWeight:900, color:A.a }}>{master.label}</div>
          <div style={{ fontSize:9, color:M.tD }}>{master.desc}</div>
        </div>

        {/* BulkEntry fills remaining space */}
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <BulkEntry
            key={selId}
            master={master}
            M={M} A={A} fz={fz} pyV={pyV}
            rows={getRows()}
            setRows={setRows}
            viewState={getVS()}
            setViewState={setVS}
            templates={getTpls()}
            onSaveTemplate={saveTpl}
            onDeleteTemplate={delTpl}
          />
        </div>
      </div>

      {/* ── Guard Modal ── */}
      {guardModal && (
        <div style={{ position:"fixed", inset:0, zIndex:1000,
          background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:M.hi, borderRadius:10, padding:24, width:320,
            boxShadow:"0 8px 32px rgba(0,0,0,.24)", border:"1px solid "+M.div }}>
            <div style={{ fontWeight:900, fontSize:13, marginBottom:8 }}>Unsaved Changes</div>
            <div style={{ fontSize:11, color:M.tD, marginBottom:20 }}>
              This master has unsaved rows. What would you like to do?
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={() => {
                setBulkRows(prev => ({...prev, [selId]: (prev[selId]||[]).filter(r => !r.__dirty && !r.__new)}));
                setSelId(guardModal.newId); setGuardModal(null);
              }} style={{ padding:"8px 16px", background:"#fef2f2", border:"1px solid #fecaca",
                color:"#dc2626", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:11 }}>
                Discard Changes → Switch
              </button>
              <button onClick={() => { setSelId(guardModal.newId); setGuardModal(null); }}
                style={{ padding:"8px 16px", background:M.lo, border:"1px solid "+M.div,
                color:M.tB, borderRadius:6, cursor:"pointer", fontSize:11 }}>
                Keep Changes (go back)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)",
          background:toastMsg.color, color:"#fff", padding:"7px 18px", borderRadius:8,
          fontSize:11, fontWeight:700, zIndex:2000, boxShadow:"0 4px 16px rgba(0,0,0,.2)" }}>
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}
