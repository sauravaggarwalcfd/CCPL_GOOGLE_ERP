export const MODS = [
  {id:"dashboard",  icon:"📈",lbl:"Dashboard",    badge:0, desc:"Reports · Analytics",      col:"#0E7490",stats:null, sub:[{icon:"📊",lbl:"Reports"},{icon:"📉",lbl:"Analytics"}]},
  {id:"masters",    icon:"🗂️",lbl:"Masters",      badge:0, desc:"Items · Suppliers · Setup", col:"#B45309",stats:null, sub:[{icon:"📦",lbl:"Items"},{icon:"🏢",lbl:"Suppliers"},{icon:"⚙️",lbl:"Setup"}]},
  {id:"procurement",icon:"📦",lbl:"Procurement", badge:0, desc:"PO · GRN · Returns",       col:"#E8690A",stats:null, sub:[{icon:"🗒️",lbl:"Purchase Orders"},{icon:"📥",lbl:"Goods Receipt"},{icon:"↩️",lbl:"Returns"}]},
  {id:"production", icon:"🏭",lbl:"Production",  badge:0, desc:"Work Orders · BOM · JW",   col:"#0078D4",stats:null, sub:[{icon:"📋",lbl:"Work Orders"},{icon:"🔩",lbl:"BOM"},{icon:"🏗️",lbl:"Job Work"}]},
  {id:"inventory",  icon:"🗄️",lbl:"Inventory",   badge:0, desc:"Stock · Transfer · Alerts", col:"#007C7C",stats:null, sub:[{icon:"📊",lbl:"Stock"},{icon:"🔄",lbl:"Transfer"},{icon:"🔔",lbl:"Alerts"}]},
  {id:"quality",    icon:"🔬",lbl:"Quality",      badge:0, desc:"Fabric · Inline · AQL",     col:"#7C3AED",stats:null, sub:[{icon:"🧵",lbl:"Fabric"},{icon:"📐",lbl:"Inline"},{icon:"✅",lbl:"AQL"}]},
  {id:"sales",      icon:"💼",lbl:"Sales",        badge:0, desc:"Orders · DC · Invoice",     col:"#15803D",stats:null, sub:[{icon:"🛒",lbl:"Orders"},{icon:"🚚",lbl:"Delivery Challan"},{icon:"🧾",lbl:"Invoice"}]},
  {id:"finance",    icon:"💰",lbl:"Finance",      badge:0, desc:"Payments · GST · Reports",  col:"#BE123C",stats:null, sub:[{icon:"💳",lbl:"Payments"},{icon:"📑",lbl:"GST"},{icon:"📊",lbl:"Reports"}]},
];

export const CMD_INDEX = [
  ...MODS.map(m=>({icon:m.icon,label:m.lbl,sub:m.desc,       group:"Modules",      id:m.id,  type:"module"})),
  {icon:"➕",label:"New Purchase Order",    sub:"Procurement → PO", group:"Quick Actions",id:"new-po",  type:"action"},
  {icon:"➕",label:"New Work Order",         sub:"Production → WO",  group:"Quick Actions",id:"new-wo",  type:"action"},
  {icon:"➕",label:"New GRN",               sub:"Procurement → GRN",group:"Quick Actions",id:"new-grn", type:"action"},
  {icon:"➕",label:"New Fabric Inspection", sub:"Quality → Fabric", group:"Quick Actions",id:"new-qc",  type:"action"},
  {icon:"🔍",label:"Search Suppliers",      sub:"Masters → Supplier",group:"Quick Actions",id:"sup-srch",type:"action"},
  {icon:"🔍",label:"Search Items",          sub:"Masters → Items",  group:"Quick Actions",id:"itm-srch",type:"action"},
  {icon:"⚙️",label:"Open Settings",         sub:"Workspace preferences",group:"Settings",id:"open-cfg",  type:"setting"},
  {icon:"🩶",label:"Switch to Light Grey",  sub:"Theme · Light Grey",   group:"Settings",id:"mode-lg",   type:"setting"},
  {icon:"🌙",label:"Switch to Midnight",    sub:"Theme · Midnight",     group:"Settings",id:"mode-mid",  type:"setting"},
  {icon:"🔷",label:"Switch to Slate",       sub:"Theme · Slate",        group:"Settings",id:"mode-slate",type:"setting"},
];

export const ACTIVITY = [];

export const SHORTCUTS_INIT = [];
