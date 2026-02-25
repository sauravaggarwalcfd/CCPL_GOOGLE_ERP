export const ROLE_C = {Admin:"#BE123C",Manager:"#1D4ED8",Supervisor:"#7C3AED",Operator:"#15803D","View Only":"#6b7280"};
export const ROLE_K = {Admin:"ADMIN",Manager:"MGR",Supervisor:"SUP",Operator:"OPR","View Only":"VIEW"};

export const NOTIF_C = {action:"#ef4444",warning:"#f59e0b",info:"#0078D4",system:"#6b7280"};
export const NOTIF_BG = {action:"rgba(239,68,68,.08)",warning:"rgba(245,158,11,.08)",info:"rgba(0,120,212,.08)",system:"rgba(107,114,128,.06)"};

export const ME = {name:"Saurav Aggarwal",email:"saurav@confidenceclothing.com",role:"Admin",dept:"Management"};

export const OTHERS = [
  {name:"Rajesh Kumar", email:"rajesh@cc.com",role:"Manager",   module:"Procurement",page:"PO-2026-0041",ts:Date.now()-18000, status:"active"},
  {name:"Amit Singh",   email:"amit@cc.com",  role:"Manager",   module:"Production", page:"WO-0089",     ts:Date.now()-5000,  status:"active"},
  {name:"Priya Sharma", email:"priya@cc.com", role:"Supervisor",module:"Quality",    page:"QC-0012",     ts:Date.now()-62000, status:"idle"},
  {name:"Ravi Verma",   email:"ravi@cc.com",  role:"Operator",  module:"Inventory",  page:"STK-0034",    ts:Date.now()-130000,status:"idle"},
  {name:"Anita Kaur",   email:"anita@cc.com", role:"View Only", module:"Dashboard",  page:"Home",        ts:Date.now()-22000, status:"active"},
];

export const NOTIF_INIT = [
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
