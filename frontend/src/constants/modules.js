export const MODS = [
  {id:"procurement",icon:"📦",lbl:"Procurement", badge:0, desc:"PO · GRN · Returns",       col:"#E8690A",stats:null},
  {id:"production", icon:"🏭",lbl:"Production",  badge:0, desc:"Work Orders · BOM · JW",   col:"#0078D4",stats:null},
  {id:"inventory",  icon:"🗄️",lbl:"Inventory",   badge:0, desc:"Stock · Transfer · Alerts", col:"#007C7C",stats:null},
  {id:"quality",    icon:"🔬",lbl:"Quality",      badge:0, desc:"Fabric · Inline · AQL",     col:"#7C3AED",stats:null},
  {id:"sales",      icon:"💼",lbl:"Sales",        badge:0, desc:"Orders · DC · Invoice",     col:"#15803D",stats:null},
  {id:"finance",    icon:"💰",lbl:"Finance",      badge:0, desc:"Payments · GST · Reports",  col:"#BE123C",stats:null},
  {id:"masters",    icon:"🗂️",lbl:"Masters",      badge:0, desc:"Items · Suppliers · Setup", col:"#B45309",stats:null},
  {id:"dashboard",  icon:"📈",lbl:"Dashboard",    badge:0, desc:"Reports · Analytics",      col:"#0E7490",stats:null},
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
