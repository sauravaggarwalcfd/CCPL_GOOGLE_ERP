export const MODS = [
  {id:"procurement",icon:"📦",lbl:"Procurement", badge:3, desc:"PO · GRN · Returns",       col:"#E8690A",stats:{pend:3,today:12,val:"₹4.2L"}},
  {id:"production", icon:"🏭",lbl:"Production",  badge:1, desc:"Work Orders · BOM · JW",   col:"#0078D4",stats:{pend:1,today:5, val:"8 WOs"}},
  {id:"inventory",  icon:"🗄️",lbl:"Inventory",   badge:0, desc:"Stock · Transfer · Alerts", col:"#007C7C",stats:{pend:0,today:8, val:"142 SKUs"}},
  {id:"quality",    icon:"🔬",lbl:"Quality",      badge:2, desc:"Fabric · Inline · AQL",     col:"#7C3AED",stats:{pend:2,today:6, val:"94.2%"}},
  {id:"sales",      icon:"💼",lbl:"Sales",        badge:0, desc:"Orders · DC · Invoice",     col:"#15803D",stats:{pend:0,today:3, val:"₹8.7L"}},
  {id:"finance",    icon:"💰",lbl:"Finance",      badge:4, desc:"Payments · GST · Reports",  col:"#BE123C",stats:{pend:4,today:9, val:"₹2.1L"}},
  {id:"masters",    icon:"🗂️",lbl:"Masters",      badge:0, desc:"Items · Suppliers · Setup", col:"#B45309",stats:{pend:0,today:0, val:"52 sheets"}},
  {id:"dashboard",  icon:"📈",lbl:"Dashboard",    badge:0, desc:"Reports · Analytics",      col:"#0E7490",stats:{pend:0,today:0, val:"Live"}},
];

export const CMD_INDEX = [
  ...MODS.map(m=>({icon:m.icon,label:m.lbl,sub:m.desc,       group:"Modules",      id:m.id,  type:"module"})),
  {icon:"➕",label:"New Purchase Order",    sub:"Procurement → PO", group:"Quick Actions",id:"new-po",  type:"action"},
  {icon:"➕",label:"New Work Order",         sub:"Production → WO",  group:"Quick Actions",id:"new-wo",  type:"action"},
  {icon:"➕",label:"New GRN",               sub:"Procurement → GRN",group:"Quick Actions",id:"new-grn", type:"action"},
  {icon:"➕",label:"New Fabric Inspection", sub:"Quality → Fabric", group:"Quick Actions",id:"new-qc",  type:"action"},
  {icon:"🔍",label:"Search Suppliers",      sub:"Masters → Supplier",group:"Quick Actions",id:"sup-srch",type:"action"},
  {icon:"🔍",label:"Search Items",          sub:"Masters → Items",  group:"Quick Actions",id:"itm-srch",type:"action"},
  {icon:"🧾",label:"PO-2026-0042",sub:"Coats India · ₹1,24,500 · Pending",    group:"Recent Records",id:"rec1",type:"record"},
  {icon:"🔧",label:"WO-0089",     sub:"5249HP · 240 pcs · Completed",          group:"Recent Records",id:"rec2",type:"record"},
  {icon:"🧪",label:"QC-0012",     sub:"LOT-089 · Fabric · Failed",             group:"Recent Records",id:"rec3",type:"record"},
  {icon:"📋",label:"STK-0034",    sub:"RM-FAB-007 · Transfer · Approved",      group:"Recent Records",id:"rec4",type:"record"},
  {icon:"⚙️",label:"Open Settings",         sub:"Workspace preferences",group:"Settings",id:"open-cfg",  type:"setting"},
  {icon:"🩶",label:"Switch to Light Grey",  sub:"Theme · Light Grey",   group:"Settings",id:"mode-lg",   type:"setting"},
  {icon:"🌙",label:"Switch to Midnight",    sub:"Theme · Midnight",     group:"Settings",id:"mode-mid",  type:"setting"},
  {icon:"🔷",label:"Switch to Slate",       sub:"Theme · Slate",        group:"Settings",id:"mode-slate",type:"setting"},
];

export const ACTIVITY = [
  {icon:"📦",text:"PO-2026-0042 submitted to Coats India",  sub:"Rajesh Kumar · 14:08", col:"#E8690A"},
  {icon:"🔬",text:"Fabric QC failed — Lot LOT-089",         sub:"Priya Sharma · 13:45", col:"#BE123C"},
  {icon:"🏭",text:"Work Order WO-0089 started",             sub:"Amit Singh · 13:30",   col:"#0078D4"},
  {icon:"🗄️",text:"Stock transfer ST-0034 approved",       sub:"Ravi Verma · 12:55",   col:"#007C7C"},
  {icon:"💰",text:"Payment ₹45,000 approved",               sub:"Saurav · 12:00",       col:"#15803D"},
];

export const SHORTCUTS_INIT = [
  {id:"sc1",icon:"📦",label:"New PO",        mod:"procurement",sub:"Procurement"},
  {id:"sc2",icon:"🏭",label:"WO-0089",       mod:"production", sub:"Production"},
  {id:"sc3",icon:"🏭",label:"Coats India",   mod:"masters",    sub:"Supplier"},
  {id:"sc4",icon:"🔬",label:"Pending QC",    mod:"quality",    sub:"Quality"},
];
