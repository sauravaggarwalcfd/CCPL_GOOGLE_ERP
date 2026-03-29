/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CC ERP — STOCK ISSUE MODULE (Standalone)
 *  File: CC_ERP_StockIssue.jsx
 *  Date: 23-Mar-2026
 *  
 *  SELF-CONTAINED component for Stock Issue with:
 *  - 7 Issue Types × 6 Item Categories = 42 combinations
 *  - 3-layer dynamic header fields (Common + Type + Category)
 *  - Dynamic line items table (columns change per category)
 *  - 6 pre-defined templates (no locking, pre-fill only)
 *  - Summary cards, stock validation, add/delete rows
 *
 *  ═══ INTEGRATION ═══
 *  1. Copy this file to: frontend/src/components/inventory/StockIssue.jsx
 *  2. In your Inventory module, import and use:
 *       import StockIssueTab from './StockIssue';
 *       // or: import { StockIssueTab, STK_ISSUE_FIELDS, ISSUE_TYPE_FIELDS, ISSUE_CAT_FIELDS } from './StockIssue';
 *  3. Render inside your routing:
 *       {activeSub === "issue" && tab === "records" && (
 *         <StockIssueTab
 *           mockRecords={MOCK_ISSUE_RECORDS}  // or live data from GAS
 *           allFields={STK_ISSUE_FIELDS}
 *           M={M} A={A} fz={fz} pyV={pyV}
 *           viewState={recViewState} setViewState={setRecViewState}
 *           templates={recTpls} onSaveTemplate={onSaveRecTpl} onDeleteTemplate={onDeleteRecTpl}
 *         />
 *       )}
 *  4. Add to SUB_MODULES array:
 *       {id:"issue", icon:"📤", lbl:"Stock Issue", desc:"Issue material — 7 types × 6 categories", fields: STK_ISSUE_FIELDS, color:"#BE123C"}
 *  5. Add to SECTIONS_MAP:
 *       issue: [
 *         {id:"header", icon:"📤", title:"Issue Header",  cols:["A","B","C"]},
 *         {id:"item",   icon:"📦", title:"Item Details",   cols:["D","E","F","G","H"]},
 *         {id:"loc",    icon:"🏭", title:"Location & Qty", cols:["I","J","K","L","M"]},
 *         {id:"batch",  icon:"🔗", title:"Batch & Status", cols:["N","O"]},
 *         {id:"audit",  icon:"📅", title:"Audit",          cols:["P","Q"]},
 *         {id:"notes",  icon:"📝", title:"Notes",          cols:["R"]},
 *       ]
 *
 *  ═══ DEPENDENCIES ═══
 *  - React (useState, useEffect)
 *  - RecordsTab component (from your existing module — for Issue Records tab)
 *  - Theme objects M (mode) and A (accent) passed as props
 *  - CC_RED constant (#CC0000)
 *  - CAT_EMOJI map
 *  - getFirstImg() helper (for thumbnails in line items)
 *  
 *  All dependencies are either included below or clearly marked for import.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
//  CONSTANTS — import these from your main module OR use below
// ═══════════════════════════════════════════════════════════
const CC_RED = "#CC0000";
const CAT_EMOJI = {FABRIC:"🧵",YARN:"🧶",TRIM:"🪡",CONSUMABLE:"🧪",PACKAGING:"📦",ARTICLE:"👕",WOVEN:"🔲"};

// getFirstImg is passed as a prop from parent module
// Fallback stub if not provided:
function _getFirstImgStub(code) { return null; }

// ── Allocation lookup (mock — in production, GAS provides this) ──
const ISSUE_ALLOC = {
  "RM-FAB-001":{alloc:400,free:1300,items:[{ref:"WO-2026-0001",desc:"Polo Cutting Batch 1",qty:200},{ref:"WO-2026-0003",desc:"Round Neck Cutting",qty:200}]},
  "RM-FAB-002":{alloc:300,free:100,items:[{ref:"JW-2026-0008",desc:"Dyeing — CVC Pique",qty:300}]},
  "RM-FAB-003":{alloc:0,free:10,items:[]},
  "RM-YRN-001":{alloc:0,free:1250,items:[]},
  "RM-YRN-002":{alloc:0,free:890,items:[]},
  "RM-YRN-003":{alloc:0,free:45,items:[]},
  "TRM-THD-001":{alloc:20,free:50,items:[{ref:"WO-2026-0001",desc:"Polo Stitching",qty:20}]},
  "TRM-ZIP-001":{alloc:50,free:30,items:[{ref:"SO-2026-0045",desc:"Myntra Hoodie Zippers",qty:50}]},
  "CON-DYE-001":{alloc:10,free:15,items:[{ref:"JW-2026-0010",desc:"Black dyeing batch",qty:10}]},
  "PKG-PLY-001":{alloc:500,free:2000,items:[{ref:"SO-2026-0044",desc:"Myntra Polo packing",qty:300},{ref:"SO-2026-0045",desc:"Myntra Hoodie packing",qty:200}]},
  "5249HP":{alloc:200,free:200,items:[{ref:"SO-2026-0044",desc:"Myntra Order — 200 Polo",qty:200}]},
};
function getIssueAlloc(code){return ISSUE_ALLOC[code]||{alloc:0,free:0,items:[]};}

// ═══════════════════════════════════════════════════════════
//  STOCK ISSUE — 18 Common Sheet Fields (Google Sheets cols A-R)
// ═══════════════════════════════════════════════════════════
export const STK_ISSUE_FIELDS = [
  {col:"A", ico:"#", h:"Issue No",                type:"autocode", req:false, auto:true,  fk:null,        hint:"AUTO. ISS-YYYY-NNNN. Immutable."},
  {col:"B", ico:"M", h:"Issue Date",              type:"text",     req:true,  auto:false, fk:null,        hint:"Date material issued. DD-MMM-YYYY"},
  {col:"C", ico:"M", h:"Issue Type",              type:"dropdown", req:true,  auto:false, fk:null,        hint:"Nature of issue — drives type-specific fields.",
    opts:[{v:"Production Issue",l:"🏭 Production Issue"},{v:"Sample Issue",l:"🧪 Sample Issue"},{v:"Job Work Issue",l:"🏗️ Job Work Issue"},{v:"Wastage / Scrap",l:"🗑️ Wastage / Scrap"},{v:"Sale / Dispatch",l:"🚚 Sale / Dispatch"},{v:"Inter-Warehouse Transfer",l:"🔄 Inter-Warehouse Transfer"},{v:"Return to Supplier",l:"↩️ Return to Supplier"}]},
  {col:"D", ico:"M", h:"Item Code",               type:"fk",       req:true,  auto:false, fk:"ITEM",      hint:"FK → Item Masters."},
  {col:"E", ico:"A", h:"Item Name (Auto)",         type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Code + Master."},
  {col:"F", ico:"A", h:"Item Master (Auto)",       type:"auto",     req:false, auto:true,  fk:null,        hint:"← FABRIC/YARN/TRIM etc."},
  {col:"G", ico:"A", h:"Item Category (Auto)",     type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Master."},
  {col:"H", ico:"A", h:"UOM (Auto)",               type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Master."},
  {col:"I", ico:"F", h:"From Location",            type:"fk",       req:true,  auto:false, fk:"WAREHOUSE", hint:"FK → WAREHOUSE_MASTER."},
  {col:"J", ico:"A", h:"From Location Name (Auto)",type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Location Code."},
  {col:"K", ico:"M", h:"Issue Qty",                type:"number",   req:true,  auto:false, fk:null,        hint:"Quantity being issued."},
  {col:"L", ico:"C", h:"Rate / Unit Cost (Auto)",  type:"calc",     req:false, auto:true,  fk:null,        hint:"← Avg unit cost from Stock Ledger."},
  {col:"M", ico:"C", h:"∑ Issue Value (Auto)",     type:"calc",     req:false, auto:true,  fk:null,        hint:"= Qty × Rate."},
  {col:"N", ico:"_", h:"Batch / Lot No",           type:"text",     req:false, auto:false, fk:null,        hint:"Lot/batch/dye-lot for traceability."},
  {col:"O", ico:"_", h:"Issue Status",             type:"dropdown", req:true,  auto:false, fk:null,        hint:"Workflow status.",
    opts:[{v:"Draft",l:"Draft"},{v:"Confirmed",l:"Confirmed"},{v:"Partially Returned",l:"Partially Returned"},{v:"Closed",l:"Closed"},{v:"Cancelled",l:"Cancelled"}]},
  {col:"P", ico:"#", h:"Issued By (Auto)",         type:"autocode", req:false, auto:true,  fk:null,        hint:"Google email. GAS auto."},
  {col:"Q", ico:"#", h:"Created Date (Auto)",      type:"autocode", req:false, auto:true,  fk:null,        hint:"GAS auto timestamp."},
  {col:"R", ico:"_", h:"Remarks",                  type:"textarea", req:false, auto:false, fk:null,        hint:"Issue notes."},
];

// ═══════════════════════════════════════════════════════════
//  TYPE-SPECIFIC FIELDS — 7 issue types
// ═══════════════════════════════════════════════════════════
export const ISSUE_TYPE_FIELDS = {
  "Production Issue": [
    {id:"t1",h:"Work Order No",type:"fk",fk:"WORK_ORDER",hint:"FK → WORK_ORDERS"},
    {id:"t2",h:"BOM Reference",type:"fk",fk:"BOM",hint:"FK → BOM_MASTER"},
    {id:"t3",h:"Production Stage",type:"dropdown",opts:["Cutting","Sewing","Finishing","Packing","Washing"],hint:"Stage of production"},
    {id:"t4",h:"Issued To (Dept)",type:"text",hint:"Department receiving material"},
    {id:"t5",h:"Expected Return Qty",type:"number",hint:"If partially returnable"},
  ],
  "Sample Issue": [
    {id:"t1",h:"Sample Ref No",type:"text",hint:"SMP-YYYY-NNN"},
    {id:"t2",h:"Buyer / Party",type:"fk",fk:"SUPPLIER",hint:"FK → SUPPLIER_MASTER"},
    {id:"t3",h:"Sample Type",type:"dropdown",opts:["Counter","Fit","Pre-production","Lab Dip","Wash Test","Size Set","Salesman"],hint:"Type of sample"},
    {id:"t4",h:"Purpose / Remarks",type:"textarea",hint:"Why this sample is needed"},
    {id:"t5",h:"Returnable?",type:"dropdown",opts:["Yes","No"],hint:"Will material be returned?"},
  ],
  "Job Work Issue": [
    {id:"t1",h:"JW Order No",type:"fk",fk:"JOBWORK",hint:"FK → JOB_WORK_ORDERS"},
    {id:"t2",h:"Job Worker Party",type:"fk",fk:"SUPPLIER",hint:"FK → SUPPLIER_MASTER"},
    {id:"t3",h:"Process Type",type:"dropdown",opts:["Dyeing","Printing","Embroidery","Washing","Compacting","Stentering","Calendering"],hint:"Type of processing"},
    {id:"t4",h:"Expected Return Date",type:"text",hint:"DD-MMM-YYYY"},
    {id:"t5",h:"Challan / DC No",type:"text",hint:"Outward delivery challan"},
    {id:"t6",h:"Vehicle No",type:"text",hint:"Transport vehicle number"},
  ],
  "Wastage / Scrap": [
    {id:"t1",h:"Waste Reason",type:"dropdown",opts:["Fabric Defect","Expired Shelf Life","Contamination","Shrinkage Loss","Cutting Waste","Rat Damage","Water Damage","Other"],hint:"Why material is wasted"},
    {id:"t2",h:"QC Report Ref",type:"fk",fk:"QC",hint:"Link to quality check report"},
    {id:"t3",h:"Approved By",type:"text",hint:"Manager who approved write-off"},
    {id:"t4",h:"Disposal Method",type:"dropdown",opts:["Sold as Jhoot","Recycled","Destroyed","Returned to Supplier"],hint:"How waste was disposed"},
    {id:"t5",h:"Scrap Value (if sold)",type:"number",hint:"₹ amount recovered"},
  ],
  "Sale / Dispatch": [
    {id:"t1",h:"Sale Order No",type:"fk",fk:"SALE_ORDER",hint:"FK → SALE_ORDERS"},
    {id:"t2",h:"Delivery Challan No",type:"fk",fk:"DC",hint:"FK → DELIVERY_CHALLANS"},
    {id:"t3",h:"Invoice No",type:"fk",fk:"INVOICE",hint:"FK → INVOICES"},
    {id:"t4",h:"Buyer / Party",type:"fk",fk:"SUPPLIER",hint:"Customer receiving goods"},
    {id:"t5",h:"Transporter",type:"text",hint:"Transport company name"},
    {id:"t6",h:"LR / AWB No",type:"text",hint:"Lorry receipt or airway bill"},
    {id:"t7",h:"Vehicle No",type:"text",hint:"Transport vehicle number"},
  ],
  "Inter-Warehouse Transfer": [
    {id:"t1",h:"To Location Code",type:"fk",fk:"WAREHOUSE",hint:"FK → WAREHOUSE_MASTER"},
    {id:"t2",h:"To Location Name (Auto)",type:"auto",hint:"← GAS fills"},
    {id:"t3",h:"Transfer Reason",type:"dropdown",opts:["Post-GRN Staging","Production Floor","Overflow","Re-organization","Quality Hold"],hint:"Why transferring"},
    {id:"t4",h:"Approved By",type:"text",hint:"Person approving transfer"},
  ],
  "Return to Supplier": [
    {id:"t1",h:"Original PO No",type:"fk",fk:"PO",hint:"FK → PO_MASTER"},
    {id:"t2",h:"Original GRN No",type:"fk",fk:"GRN",hint:"FK → GRN_MASTER"},
    {id:"t3",h:"Supplier",type:"fk",fk:"SUPPLIER",hint:"FK → SUPPLIER_MASTER"},
    {id:"t4",h:"Return Reason",type:"dropdown",opts:["Quality Reject","Excess Quantity","Wrong Item","Damaged in Transit","Expired"],hint:"Why returning"},
    {id:"t5",h:"Debit Note No",type:"text",hint:"Debit note reference"},
    {id:"t6",h:"Supplier Credit",type:"number",hint:"₹ credit amount from supplier"},
  ],
};

// ═══════════════════════════════════════════════════════════
//  CATEGORY-SPECIFIC FIELDS — 6 item categories
// ═══════════════════════════════════════════════════════════
export const ISSUE_CAT_FIELDS = {
  YARN: [{id:"c1",h:"Lot / Dye-Lot No"},{id:"c2",h:"Yarn Count (Ne)"},{id:"c3",h:"Yarn Type",type:"dropdown",opts:["Ring Spun Combed","Ring Spun Carded","Open End","Compact","Vortex"]},{id:"c4",h:"No of Cones"},{id:"c5",h:"Weight per Cone (kg)"},{id:"c6",h:"Color / Shade"},{id:"c7",h:"Dye Batch Ref"},{id:"c8",h:"Moisture %"}],
  FABRIC: [{id:"c1",h:"Roll No(s)"},{id:"c2",h:"No of Rolls"},{id:"c3",h:"Total Weight (kg)"},{id:"c4",h:"Total Length (mtrs)"},{id:"c5",h:"GSM"},{id:"c6",h:"Width (inch)"},{id:"c7",h:"Shrinkage % (L×W)"},{id:"c8",h:"Fabric Type",type:"dropdown",opts:["Single Jersey","Pique","Interlock","Rib","Fleece","Terry","Lycra"]},{id:"c9",h:"Color / Shade"},{id:"c10",h:"Dye Lot Ref"}],
  TRIM: [{id:"c1",h:"Trim Type",type:"dropdown",opts:["Thread","Zipper","Button","Label","Elastic","Drawcord","Velcro","Tape"]},{id:"c2",h:"Color / Shade"},{id:"c3",h:"Size / Specification"},{id:"c4",h:"Brand"},{id:"c5",h:"Pack Qty"},{id:"c6",h:"Match Card Ref"}],
  CONSUMABLE: [{id:"c1",h:"Chemical Name"},{id:"c2",h:"Batch No"},{id:"c3",h:"Expiry Date"},{id:"c4",h:"Hazard Class",type:"dropdown",opts:["None","Class 3 — Flammable","Class 8 — Corrosive","Class 9 — Misc"]},{id:"c5",h:"MSDS Ref"},{id:"c6",h:"Storage Condition"},{id:"c7",h:"Purity / Concentration"}],
  PACKAGING: [{id:"c1",h:"Size / Dimension"},{id:"c2",h:"Material Type",type:"dropdown",opts:["LDPE","HDPE","PP","Corrugated","Duplex","Kraft"]},{id:"c3",h:"Print / Branding"},{id:"c4",h:"GSM / Thickness"},{id:"c5",h:"Qty per Bundle"},{id:"c6",h:"Buyer-Specific?"},{id:"c7",h:"Barcode / SKU"}],
  ARTICLE: [{id:"c1",h:"Style / Article Code"},{id:"c2",h:"Size Breakdown"},{id:"c3",h:"Color"},{id:"c4",h:"Buyer",type:"fk",fk:"SUPPLIER"},{id:"c5",h:"Season"},{id:"c6",h:"Packed Carton No(s)"},{id:"c7",h:"Total Cartons"},{id:"c8",h:"Barcode / EAN"},{id:"c9",h:"MRP Label"},{id:"c10",h:"Wash Care Label?"}],
};

// ═══════════════════════════════════════════════════════════
//  MOCK ISSUE RECORDS — 8 sample records for testing
// ═══════════════════════════════════════════════════════════
export const MOCK_ISSUE_RECORDS = [
  {A:"ISS-2026-0001",B:"05-Mar-2026",C:"Production Issue",D:"RM-FAB-001",E:"100% Cotton SJ",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:200,L:250,M:"₹50,000",N:"LOT-FAB-001",O:"Confirmed",P:"factory@ccpl.in",Q:"05-Mar-2026",R:"Issued to cutting — WO-2026-0001"},
  {A:"ISS-2026-0002",B:"07-Mar-2026",C:"Sample Issue",D:"RM-FAB-002",E:"CVC Pique 220",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:5,L:350,M:"₹1,750",N:"",O:"Confirmed",P:"design@ccpl.in",Q:"07-Mar-2026",R:"Hand-feel sample for H&M buyer visit"},
  {A:"ISS-2026-0003",B:"10-Mar-2026",C:"Job Work Issue",D:"RM-FAB-001",E:"100% Cotton SJ",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:500,L:250,M:"₹1,25,000",N:"LOT-FAB-002",O:"Confirmed",P:"store@ccpl.in",Q:"10-Mar-2026",R:"Sent to Punjab Dyeing — JW-2026-008"},
  {A:"ISS-2026-0004",B:"12-Mar-2026",C:"Wastage / Scrap",D:"RM-FAB-003",E:"Poly Fleece 280",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:15,L:500,M:"₹7,500",N:"",O:"Confirmed",P:"store@ccpl.in",Q:"12-Mar-2026",R:"Water damage — sold as jhoot ₹2500"},
  {A:"ISS-2026-0005",B:"14-Mar-2026",C:"Sale / Dispatch",D:"5249HP",E:"Polo T-shirt CVC",F:"ARTICLE",G:"Finished Goods",H:"PCS",I:"WH-FG",J:"FG Store",K:200,L:800,M:"₹1,60,000",N:"",O:"Confirmed",P:"sales@ccpl.in",Q:"14-Mar-2026",R:"Myntra order — DC-2026-0001"},
  {A:"ISS-2026-0006",B:"15-Mar-2026",C:"Production Issue",D:"TRM-THD-001",E:"Coats Epic 120 White",F:"TRIM",G:"Thread",H:"CONE",I:"WH-TRIM",J:"Trim Store",K:20,L:150,M:"₹3,000",N:"LOT-THD-001",O:"Confirmed",P:"factory@ccpl.in",Q:"15-Mar-2026",R:"Thread for WO-2026-0003"},
  {A:"ISS-2026-0007",B:"16-Mar-2026",C:"Return to Supplier",D:"RM-FAB-002",E:"CVC Pique 220",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:50,L:350,M:"₹17,500",N:"LOT-CVC-001",O:"Draft",P:"store@ccpl.in",Q:"16-Mar-2026",R:"Quality reject — holes found, DN-2026-012"},
  {A:"ISS-2026-0008",B:"18-Mar-2026",C:"Production Issue",D:"CON-DYE-001",E:"Reactive Black HE-B",F:"CONSUMABLE",G:"Dye",H:"KG",I:"WH-CON",J:"Chemical Store",K:10,L:1500,M:"₹15,000",N:"CHM-B-034",O:"Confirmed",P:"dye@ccpl.in",Q:"18-Mar-2026",R:"Dyeing batch DB-2026-015"},
];

// ═══════════════════════════════════════════════════════════
//  STOCK ISSUE TAB — Main Component
//  Props:
//    mockRecords  — array of issue records (or MOCK_ISSUE_RECORDS)
//    allFields    — STK_ISSUE_FIELDS array
//    M, A         — theme mode + accent objects
//    fz, pyV      — font size, vertical padding
//    viewState, setViewState  — for RecordsTab
//    templates, onSaveTemplate, onDeleteTemplate  — for RecordsTab
//    RecordsTabComponent — pass your RecordsTab if external
// ═══════════════════════════════════════════════════════════
function StockIssueTab({mockRecords, allFields, M, A, fz, pyV, viewState, setViewState, templates, onSaveTemplate, onDeleteTemplate, RecordsTab, getFirstImg: getFirstImgProp}) {
  const getFirstImg = getFirstImgProp || _getFirstImgStub;
  const [tab, setTab] = useState("records");
  // RecordsTab must be passed as prop from parent module
  if(!RecordsTab) RecordsTab = ({mockRecords}) => <div style={{padding:20,color:"#6b7280"}}>RecordsTab not provided — pass it as prop. {mockRecords.length} records available.</div>;
  const [hoverImg, setHoverImg] = useState(null); // {src, name, code, top, left}
  const [openImg, setOpenImg] = useState(null);   // {src, name, code}
  const [lineMaxView, setLineMaxView] = useState(false);
  useEffect(()=>{if(!lineMaxView)return;const h=e=>{if(e.key==="Escape")setLineMaxView(false);};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[lineMaxView]);
  const [accOpen, setAccOpen] = useState({common:true, type:true, cat:true});
  const toggleAcc = (key) => setAccOpen(p=>({...p,[key]:!p[key]}));
  const [issueType, setIssueType] = useState("Production Issue");
  const [itemCat, setItemCat] = useState("YARN");
  const [headerData, setHeaderData] = useState({});
  const [lineItems, setLineItems] = useState([{_id:1},{_id:2},{_id:3}]);
  const [nextId, setNextId] = useState(4);

  const ISSUE_TYPES = [
    {v:"Production Issue",icon:"🏭",c:"#15803d"},{v:"Sample Issue",icon:"🧪",c:"#7C3AED"},
    {v:"Job Work Issue",icon:"🏗️",c:"#0078D4"},{v:"Wastage / Scrap",icon:"🗑️",c:"#dc2626"},
    {v:"Sale / Dispatch",icon:"🚚",c:"#E8690A"},{v:"Inter-Warehouse Transfer",icon:"🔄",c:"#059669"},
    {v:"Return to Supplier",icon:"↩️",c:"#854d0e"},
  ];
  const ITEM_CATS = [
    {v:"YARN",icon:"🧶",c:"#854d0e"},{v:"FABRIC",icon:"🧵",c:"#15803d"},{v:"TRIM",icon:"🪡",c:"#7C3AED"},
    {v:"CONSUMABLE",icon:"🧪",c:"#0078D4"},{v:"PACKAGING",icon:"📦",c:"#E8690A"},{v:"ARTICLE",icon:"👕",c:"#BE123C"},
  ];
  const TPLS = [
    {id:"blank",name:"Blank Issue",icon:"📝",desc:"Choose yourself",type:null,cat:null},
    {id:"prod-yarn",name:"Production — Yarn",icon:"🏭🧶",desc:"Yarn cones to production",type:"Production Issue",cat:"YARN"},
    {id:"prod-fabric",name:"Production — Fabric",icon:"🏭🧵",desc:"Fabric rolls to cutting",type:"Production Issue",cat:"FABRIC"},
    {id:"jw-fabric",name:"Job Work — Fabric",icon:"🏗️🧵",desc:"Fabric to processor",type:"Job Work Issue",cat:"FABRIC"},
    {id:"dispatch-fg",name:"Dispatch — FG",icon:"🚚👕",desc:"Ship garments",type:"Sale / Dispatch",cat:"ARTICLE"},
    {id:"waste-fabric",name:"Wastage — Fabric",icon:"🗑️🧵",desc:"Write off fabric",type:"Wastage / Scrap",cat:"FABRIC"},
  ];

  // ── Type-specific header fields ──
  const TYPE_HDR = {
    "Production Issue":[{id:"wo",h:"Work Order No",req:true,fk:"WO"},{id:"bom",h:"BOM Reference",fk:"BOM"},{id:"stage",h:"Production Stage",req:true,dd:["Knitting","Dyeing","Cutting","Sewing","Finishing","Packing","Winding"]},{id:"dept",h:"Issued To (Dept)",req:true},{id:"joFK",h:"Job Order FK"},{id:"joStat",h:"Job Order Status",dd:["In Progress","Completed","On Hold"]},{id:"retQty",h:"Expected Return Qty"},{id:"recptNo",h:"Receipt No"}],
    "Sample Issue":[{id:"smpRef",h:"Sample Ref No"},{id:"buyer",h:"Buyer / Party",fk:"SUP"},{id:"smpType",h:"Sample Type",dd:["Counter","Fit","Pre-production","Lab Dip","Wash Test","Size Set"]},{id:"purpose",h:"Purpose"},{id:"returnable",h:"Returnable?",dd:["Yes","No"]}],
    "Job Work Issue":[{id:"jwNo",h:"JW Order No",fk:"JW"},{id:"jwParty",h:"Job Worker",fk:"SUP"},{id:"procType",h:"Process Type",req:true,dd:["Dyeing","Printing","Embroidery","Washing","Compacting","Stentering"]},{id:"retDate",h:"Expected Return Date"},{id:"dcNo",h:"Challan / DC No"},{id:"vehicle",h:"Vehicle No"}],
    "Wastage / Scrap":[{id:"reason",h:"Waste Reason",req:true,dd:["Fabric Defect","Expired","Contamination","Shrinkage Loss","Cutting Waste","Rat Damage","Water Damage","Other"]},{id:"qcRef",h:"QC Report Ref",fk:"QC"},{id:"approvedBy",h:"Approved By",req:true},{id:"disposal",h:"Disposal Method",dd:["Sold as Jhoot","Recycled","Destroyed","Returned to Supplier"]},{id:"scrapVal",h:"Scrap Value (₹)"}],
    "Sale / Dispatch":[{id:"soNo",h:"Sale Order No",fk:"SO"},{id:"dcNo",h:"Delivery Challan",fk:"DC"},{id:"invNo",h:"Invoice No",fk:"INV"},{id:"buyer",h:"Buyer",fk:"SUP"},{id:"transporter",h:"Transporter"},{id:"lrAwb",h:"LR / AWB No"},{id:"vehicle",h:"Vehicle No"}],
    "Inter-Warehouse Transfer":[{id:"toLoc",h:"To Location",req:true,fk:"WH"},{id:"toLocName",h:"To Location Name",auto:true},{id:"reason",h:"Transfer Reason",dd:["Post-GRN Staging","Production Floor","Overflow","Re-organization"]},{id:"approvedBy",h:"Approved By"}],
    "Return to Supplier":[{id:"origPO",h:"Original PO",fk:"PO"},{id:"origGRN",h:"Original GRN",fk:"GRN"},{id:"supplier",h:"Supplier",fk:"SUP"},{id:"retReason",h:"Return Reason",req:true,dd:["Quality Reject","Excess Qty","Wrong Item","Damaged","Expired"]},{id:"dnNo",h:"Debit Note No"},{id:"supCredit",h:"Supplier Credit (₹)"}],
  };

  // ── Category-specific header fields ──
  const CAT_HDR = {
    YARN:[{id:"yarnNe",h:"Yarn Count (Ne)",req:true},{id:"yarnType",h:"Yarn Type",req:true,dd:["Ring Spun Combed","Ring Spun Carded","Open End","Compact","Vortex"]},{id:"shade",h:"Color / Shade",req:true},{id:"dyeBatch",h:"Dye Batch Ref",req:true},{id:"moisture",h:"Moisture %"},{id:"twist",h:"Twist Direction",dd:["Z-twist","S-twist"]},{id:"blend",h:"Blend Composition"},{id:"supLot",h:"Supplier Lot Ref"}],
    FABRIC:[{id:"rollNos",h:"Roll No(s)"},{id:"numRolls",h:"No of Rolls"},{id:"totWt",h:"Total Weight (kg)"},{id:"totLen",h:"Total Length (mtrs)"},{id:"gsm",h:"GSM"},{id:"width",h:"Width (inch)"},{id:"shrink",h:"Shrinkage % (L×W)"},{id:"fabType",h:"Fabric Type",dd:["Single Jersey","Pique","Interlock","Rib","Fleece","Terry","Lycra"]},{id:"shade",h:"Color / Shade"},{id:"dyeLot",h:"Dye Lot Ref"}],
    TRIM:[{id:"trimType",h:"Trim Type",dd:["Thread","Zipper","Button","Label","Elastic","Drawcord","Velcro","Tape"]},{id:"shade",h:"Color / Shade"},{id:"spec",h:"Size / Spec"},{id:"brand",h:"Brand"},{id:"packQty",h:"Pack Qty"},{id:"matchCard",h:"Match Card Ref"}],
    CONSUMABLE:[{id:"chemName",h:"Chemical Name"},{id:"batchNo",h:"Batch No"},{id:"expiry",h:"Expiry Date"},{id:"hazard",h:"Hazard Class",dd:["None","Class 3","Class 8","Class 9"]},{id:"msds",h:"MSDS Ref"},{id:"storage",h:"Storage Condition"},{id:"purity",h:"Purity / Concentration"}],
    PACKAGING:[{id:"sizeDim",h:"Size / Dimension"},{id:"matType",h:"Material Type",dd:["LDPE","HDPE","PP","Corrugated","Duplex","Kraft"]},{id:"print",h:"Print / Branding"},{id:"gsmThk",h:"GSM / Thickness"},{id:"bundleQty",h:"Qty per Bundle"},{id:"buyerSpec",h:"Buyer-Specific?",dd:["Yes","No"]},{id:"barcode",h:"Barcode / SKU"}],
    ARTICLE:[{id:"style",h:"Style / Article Code"},{id:"sizeBreak",h:"Size Breakdown"},{id:"color",h:"Color"},{id:"buyer",h:"Buyer",fk:"SUP"},{id:"season",h:"Season"},{id:"cartonNos",h:"Packed Carton No(s)"},{id:"totCartons",h:"Total Cartons"},{id:"ean",h:"Barcode / EAN"},{id:"mrp",h:"MRP Label"},{id:"washCare",h:"Wash Care?",dd:["Yes","No"]}],
  };

  // ── Category-specific LINE ITEM columns ──
  const LINE_CAT = {
    YARN:[{id:"lot",h:"Lot/Dye-Lot",w:95},{id:"cones",h:"Cones",w:50,num:true},{id:"wtCone",h:"Wt/Cone",w:55,num:true,amber:true}],
    FABRIC:[{id:"lot",h:"Lot/Dye-Lot",w:90},{id:"rollNos",h:"Roll No(s)",w:85},{id:"numRolls",h:"Rolls",w:45,num:true},{id:"gsm",h:"GSM",w:42,num:true},{id:"widthIn",h:"Width",w:45,num:true}],
    TRIM:[{id:"lot",h:"Lot No",w:75},{id:"trimType",h:"Trim Type",w:70,dd:["Thread","Zipper","Button","Label","Elastic"]},{id:"spec",h:"Size/Spec",w:70}],
    CONSUMABLE:[{id:"lot",h:"Lot No",w:75},{id:"batchNo",h:"Batch No",w:75},{id:"expiry",h:"Expiry",w:70},{id:"hazard",h:"Hazard",w:65,dd:["None","Class 3","Class 8","Class 9"]}],
    PACKAGING:[{id:"lot",h:"Lot No",w:70},{id:"sizeDim",h:"Size/Dim",w:70},{id:"gsmThk",h:"GSM/Thick",w:55}],
    ARTICLE:[{id:"lot",h:"Lot No",w:65},{id:"sizeBreak",h:"Size Breakdown",w:125},{id:"color",h:"Color",w:60},{id:"cartonNos",h:"Carton(s)",w:80}],
  };

  // ── Derived ──
  const TC = ISSUE_TYPES.find(t=>t.v===issueType)||ISSUE_TYPES[0];
  const CC_CAT = ITEM_CATS.find(c=>c.v===itemCat)||ITEM_CATS[0];
  const typeHdr = TYPE_HDR[issueType]||[];
  const catHdr = CAT_HDR[itemCat]||[];
  const catLineCols = LINE_CAT[itemCat]||[];
  const catUnitLabel = {YARN:"cones",FABRIC:"rolls",TRIM:"packs",CONSUMABLE:"batches",PACKAGING:"bundles",ARTICLE:"cartons"}[itemCat]||"items";

  // ── Mock line data ──
  const MOCK_LINES = {
    YARN:[{_id:1,code:"RM-YRN-001",name:"30s Combed Cotton Grey Melange",brand:"Vardhman",lot:"LOT-DL-4520",cones:120,wtCone:"2.08",uom:"KG",inHand:1250,issueQty:250,rate:380},{_id:2,code:"RM-YRN-002",name:"30s Combed Cotton White",brand:"Nahar",lot:"LOT-DL-4521",cones:72,wtCone:"2.08",uom:"KG",inHand:890,issueQty:150,rate:350},{_id:3,code:"RM-YRN-003",name:"20s CVC Yarn Natural",brand:"Bansal",lot:"LOT-DL-4525",cones:48,wtCone:"2.50",uom:"KG",inHand:45,issueQty:100,rate:420}],
    FABRIC:[{_id:1,code:"RM-FAB-001",name:"100% Cotton SJ",brand:"Rajinder",lot:"LOT-FAB-001",rollNos:"R-001,R-002",numRolls:2,gsm:180,widthIn:72,uom:"KG",inHand:1700,issueQty:250,rate:250},{_id:2,code:"RM-FAB-002",name:"CVC Pique 220",brand:"Rajinder",lot:"LOT-CVC-001",rollNos:"R-010",numRolls:1,gsm:220,widthIn:68,uom:"KG",inHand:400,issueQty:150,rate:350}],
  };
  useEffect(()=>{const m=MOCK_LINES[itemCat];if(m){setLineItems(m);setNextId(m.length+1);}else{setLineItems([{_id:1}]);setNextId(2);}},[itemCat]);

  const addLine=()=>{setLineItems(p=>[...p,{_id:nextId}]);setNextId(n=>n+1);};
  const removeLine=(id)=>{if(lineItems.length>1)setLineItems(p=>p.filter(r=>r._id!==id));};
  const updateLine=(id,k,v)=>{setLineItems(p=>p.map(r=>r._id===id?{...r,[k]:v}:r));};
  const selectTemplate=(tpl)=>{if(tpl.type)setIssueType(tpl.type);if(tpl.cat)setItemCat(tpl.cat);};

  // ── Totals ──
  const totalQty=lineItems.reduce((s,r)=>s+(parseFloat(r.issueQty)||0),0);
  const totalValue=lineItems.reduce((s,r)=>s+((parseFloat(r.issueQty)||0)*(parseFloat(r.rate)||0)),0);
  const totalCatUnit=itemCat==="YARN"?lineItems.reduce((s,r)=>s+(parseFloat(r.cones)||0),0):itemCat==="FABRIC"?lineItems.reduce((s,r)=>s+(parseFloat(r.numRolls)||0),0):lineItems.length;
  const warnings=lineItems.filter(r=>(parseFloat(r.issueQty)||0)>(parseFloat(r.inHand)||0)&&(parseFloat(r.inHand)||0)>0).length;
  const uom=lineItems[0]?.uom||"";
  const issueTypeCounts={};mockRecords.forEach(r=>{const t=r.C||"";issueTypeCounts[t]=(issueTypeCounts[t]||0)+1;});

  // ── Field renderer ──
  const renderF=(f,color,prefix)=>{
    const key=prefix+f.id;const val=headerData[key]||"";
    return(<div key={key}>
      <div style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:".4px",textTransform:"uppercase",marginBottom:3}}>
        {f.req&&<span style={{color:"#dc2626",marginRight:1}}>*</span>}
        {f.auto&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:A.al,color:A.a,marginRight:3}}>AUTO</span>}
        {f.fk&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:"#E8690A15",color:"#E8690A",marginRight:3}}>FK</span>}
        {f.h}
      </div>
      {f.auto?<input readOnly value={val||f.h} style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${A.a}30`,borderRadius:5,background:A.al,color:A.a,fontWeight:600,width:"100%"}}/>
      :f.dd?<select value={val} onChange={e=>setHeaderData(p=>({...p,[key]:e.target.value}))} style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${M.inBd}`,borderRadius:5,background:M.inBg,color:M.tA,borderLeft:`3px solid ${color}`,width:"100%"}}><option value="">— select —</option>{f.dd.map(o=><option key={o} value={o}>{o}</option>)}</select>
      :<input value={val} onChange={e=>setHeaderData(p=>({...p,[key]:e.target.value}))} placeholder={f.h} style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${M.inBd}`,borderRadius:5,background:M.inBg,color:M.tA,borderLeft:f.fk?`3px solid #E8690A`:f.req?`3px solid ${A.a}`:"none",width:"100%"}}/>}
    </div>);
  };

  return(
  <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    {/* Tab bar */}
    <div style={{padding:"8px 14px",borderBottom:`2px solid ${CC_RED}`,background:M.sh,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <button onClick={()=>setTab("records")}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=tab==="records"?"0 6px 16px rgba(0,0,0,.2)":"0 4px 12px rgba(0,0,0,.15)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=tab==="records"?"0 3px 8px rgba(0,0,0,.15), inset 0 -2px 0 rgba(0,0,0,.1)":"0 2px 4px rgba(0,0,0,.08), inset 0 -2px 0 rgba(0,0,0,.06)";}}
        onMouseDown={e=>{e.currentTarget.style.transform="translateY(1px)";e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,.1), inset 0 1px 0 rgba(0,0,0,.05)";}}
        onMouseUp={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
        style={{padding:"9px 20px",borderRadius:8,border:tab==="records"?`2px solid ${A.a}`:`1.5px solid ${M.inBd}`,background:tab==="records"?`linear-gradient(180deg,${A.al},${A.a}15)`:`linear-gradient(180deg,#fff,#f3f4f6)`,color:tab==="records"?A.a:M.tB,fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:tab==="records"?"0 3px 8px rgba(0,0,0,.15), inset 0 -2px 0 rgba(0,0,0,.1)":"0 2px 4px rgba(0,0,0,.08), inset 0 -2px 0 rgba(0,0,0,.06)",transition:"transform .1s"}}>
        <span style={{fontSize:15}}>📋</span>Issue Records
      </button>
      <button onClick={()=>setTab("new")}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 16px rgba(21,128,61,.3)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=tab==="new"?"0 3px 10px rgba(21,128,61,.25), inset 0 -2px 0 rgba(0,0,0,.15)":"0 2px 6px rgba(21,128,61,.15), inset 0 -2px 0 rgba(0,0,0,.1)";}}
        onMouseDown={e=>{e.currentTarget.style.transform="translateY(1px)";e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,.1), inset 0 1px 0 rgba(0,0,0,.1)";}}
        onMouseUp={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
        style={{padding:"9px 22px",borderRadius:8,border:tab==="new"?"2px solid #15803d":"1.5px solid #86efac",background:tab==="new"?"linear-gradient(180deg,#22c55e,#15803d)":"linear-gradient(180deg,#f0fdf4,#dcfce7)",color:tab==="new"?"#fff":"#15803d",fontSize:13,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:tab==="new"?"0 3px 10px rgba(21,128,61,.25), inset 0 -2px 0 rgba(0,0,0,.15)":"0 2px 6px rgba(21,128,61,.15), inset 0 -2px 0 rgba(0,0,0,.1)",transition:"transform .1s"}}>
        <span style={{fontSize:15}}>➕</span>New Stock Issue
      </button>
      <div style={{flex:1}}/>
      <div style={{display:"flex",gap:5}}>{ISSUE_TYPES.map(t=>{const cnt=issueTypeCounts[t.v]||0;if(!cnt)return null;return<span key={t.v} style={{padding:"3px 9px",borderRadius:10,fontSize:9,fontWeight:800,background:t.c+"15",color:t.c,border:`1px solid ${t.c}30`}}>{t.icon} {cnt}</span>;})}</div>
    </div>

    {tab==="records"?(
      <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
        {/* Issue Records header */}
        <div style={{padding:"8px 14px",background:M.mid,borderBottom:`1px solid ${M.div}`,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:15}}>📋</span>
          <span style={{fontSize:14,fontWeight:900,color:M.tA}}>Issue Records</span>
          <span style={{padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:800,background:CC_RED+"12",color:CC_RED,border:`1px solid ${CC_RED}30`}}>{mockRecords.length} records</span>
          <div style={{flex:1}}/>
          <div style={{display:"flex",gap:5}}>{ISSUE_TYPES.map(t=>{const cnt=issueTypeCounts[t.v]||0;if(!cnt)return null;return<span key={t.v} style={{padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:800,background:t.c+"12",color:t.c}}>{t.icon} {t.v.split(" ")[0]} ({cnt})</span>;})}</div>
        </div>
        <RecordsTab allFields={allFields} mockRecords={mockRecords} M={M} A={A} fz={fz} pyV={pyV} viewState={viewState} setViewState={setViewState} templates={templates} onSaveTemplate={onSaveTemplate} onDeleteTemplate={onDeleteTemplate} showThumb={true} renderMode="table"/>
      </div>
    ):(
    <div style={{flex:1,overflowY:"auto"}}>

      {/* STEP 0: Templates */}
      <div style={{padding:"8px 14px",background:M.mid,borderBottom:`1px solid ${M.div}`}}>
        <div style={{fontSize:10,fontWeight:900,color:M.tD,letterSpacing:1,marginBottom:5}}>STEP 0 — SELECT TEMPLATE (OPTIONAL, PRE-FILLS TYPE + CATEGORY)</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{TPLS.map(tpl=>(
          <button key={tpl.id} onClick={()=>selectTemplate(tpl)} style={{padding:"6px 12px",borderRadius:7,border:`1.5px solid ${(tpl.type===issueType&&tpl.cat===itemCat)?A.a:(!tpl.type&&!tpl.cat)?M.inBd:M.inBd}`,background:(tpl.type===issueType&&tpl.cat===itemCat)?A.al:"transparent",color:(tpl.type===issueType&&tpl.cat===itemCat)?A.a:M.tB,fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:13}}>{tpl.icon}</span><div style={{textAlign:"left"}}><div style={{fontWeight:800}}>{tpl.name}</div><div style={{fontSize:8,color:M.tD}}>{tpl.desc}</div></div>
          </button>))}</div>
      </div>

      {/* STEP 1 + 2 */}
      <div style={{padding:"8px 14px",borderBottom:`1px solid ${M.div}`,display:"flex",gap:20}}>
        <div style={{flex:1}}>
          <div style={{fontSize:10,fontWeight:900,color:M.tD,letterSpacing:1,marginBottom:5}}>STEP 1 — ISSUE TYPE</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{ISSUE_TYPES.map(t=>(
            <button key={t.v} onClick={()=>setIssueType(t.v)} style={{padding:"6px 12px",borderRadius:7,border:`1.5px solid ${issueType===t.v?t.c:M.inBd}`,background:issueType===t.v?t.c+"12":"transparent",color:issueType===t.v?t.c:M.tB,fontSize:12,fontWeight:issueType===t.v?900:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:14}}>{t.icon}</span>{t.v}<span style={{fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:5,background:issueType===t.v?t.c+"20":M.mid,color:issueType===t.v?t.c:M.tD}}>{(TYPE_HDR[t.v]||[]).length}f</span>
            </button>))}</div>
        </div>
        <div style={{width:1,background:M.div,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:10,fontWeight:900,color:M.tD,letterSpacing:1,marginBottom:5}}>STEP 2 — ITEM CATEGORY</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{ITEM_CATS.map(c=>(
            <button key={c.v} onClick={()=>setItemCat(c.v)} style={{padding:"6px 12px",borderRadius:7,border:`1.5px solid ${itemCat===c.v?c.c:M.inBd}`,background:itemCat===c.v?c.c+"12":"transparent",color:itemCat===c.v?c.c:M.tB,fontSize:12,fontWeight:itemCat===c.v?900:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:14}}>{c.icon}</span>{c.v}<span style={{fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:5,background:itemCat===c.v?c.c+"20":M.mid,color:itemCat===c.v?c.c:M.tD}}>{(CAT_HDR[c.v]||[]).length}f</span>
            </button>))}</div>
        </div>
      </div>

      {/* ── Header sections (collapse when line items expanded) ── */}
      {!lineMaxView && <>
      {/* Field count */}
      <div style={{padding:"6px 14px",borderBottom:`1px solid ${M.div}`,background:M.mid,display:"flex",alignItems:"center",gap:8,fontSize:10,color:M.tC}}>
        <span style={{fontWeight:900,color:M.tD}}>FIELDS:</span>
        <span style={{fontSize:14,fontWeight:900,color:M.tA}}>{8+typeHdr.length+catHdr.length}</span> header +
        <span style={{fontSize:14,fontWeight:900,color:M.tA}}>{12+catLineCols.length}</span> line cols =
        <span style={{padding:"2px 8px",borderRadius:4,background:A.al,color:A.a,fontWeight:800}}>8 common</span>
        <span style={{padding:"2px 8px",borderRadius:4,background:TC.c+"15",color:TC.c,fontWeight:800}}>{typeHdr.length} {issueType}</span>
        <span style={{padding:"2px 8px",borderRadius:4,background:CC_CAT.c+"15",color:CC_CAT.c,fontWeight:800}}>{catHdr.length} {itemCat}</span>
      </div>

      {/* LAYER 1: Common */}
      <div style={{borderBottom:`1px solid ${M.div}`,borderLeft:`4px solid ${A.a}`}}>
        <div onClick={()=>toggleAcc("common")} style={{fontSize:13,fontWeight:900,color:A.a,display:"flex",alignItems:"center",gap:5,background:A.al,padding:"8px 14px",cursor:"pointer",borderBottom:accOpen.common?`1.5px solid ${A.a}30`:"none"}}>
          <span style={{fontSize:10,fontWeight:900,transform:accOpen.common?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span>
          <span style={{fontSize:15}}>📋</span> Issue header — common <span style={{padding:"2px 7px",borderRadius:6,fontSize:10,fontWeight:800,background:A.a+"15",color:A.a}}>8</span>
          <span style={{marginLeft:"auto",fontSize:9,color:A.a+"80"}}>{accOpen.common?"click to collapse":"click to expand"}</span>
        </div>
        {accOpen.common && <div style={{padding:"10px 14px",background:A.al+"40"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          <div><div style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:".4px",textTransform:"uppercase",marginBottom:3}}><span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:A.al,color:A.a,marginRight:3}}>AUTO</span>ISSUE NO</div><input readOnly value="ISS-2026-0009" style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${A.a}30`,borderRadius:5,background:A.al,color:A.a,fontWeight:600,width:"100%",fontFamily:"monospace"}}/></div>
          {renderF({id:"date",h:"Issue Date",req:true},A.a,"c_")}
          <div><div style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:".4px",textTransform:"uppercase",marginBottom:3}}>ISSUE TYPE</div><input readOnly value={issueType} style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${TC.c}30`,borderRadius:5,background:TC.c+"10",color:TC.c,fontWeight:700,width:"100%"}}/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:".4px",textTransform:"uppercase",marginBottom:3}}><span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:A.al,color:A.a,marginRight:3}}>AUTO</span>TIMESTAMP</div><input readOnly value={new Date().toLocaleString("en-IN")} style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${A.a}30`,borderRadius:5,background:A.al,color:A.a,fontWeight:600,width:"100%"}}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:8}}>
          {renderF({id:"person",h:"Concern Person",req:true},A.a,"c_")}
          {renderF({id:"fromLoc",h:"From Location",req:true,fk:"WH"},A.a,"c_")}
          {renderF({id:"fromLocName",h:"Location Name",auto:true},A.a,"c_")}
          {renderF({id:"status",h:"Issue Status",req:true,dd:["Draft","Confirmed","Partially Returned","Closed","Cancelled"]},A.a,"c_")}
        </div>
      </div>}
      </div>

      {/* LAYER 2: Type-specific */}
      <div style={{borderBottom:`1px solid ${M.div}`,borderLeft:`4px solid ${TC.c}`}}>
        <div onClick={()=>toggleAcc("type")} style={{fontSize:13,fontWeight:900,color:TC.c,display:"flex",alignItems:"center",gap:5,background:TC.c+"12",padding:"8px 14px",cursor:"pointer",borderBottom:accOpen.type?`1.5px solid ${TC.c}30`:"none"}}>
          <span style={{fontSize:10,fontWeight:900,transform:accOpen.type?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span>
          <span style={{fontSize:15}}>{TC.icon}</span> {issueType} — type-specific <span style={{padding:"2px 7px",borderRadius:6,fontSize:10,fontWeight:800,background:TC.c+"15",color:TC.c}}>{typeHdr.length}</span>
          <span style={{marginLeft:"auto",fontSize:9,color:TC.c+"80"}}>{accOpen.type?"click to collapse":"click to expand"}</span>
        </div>
        {accOpen.type && <div style={{padding:"10px 14px",background:TC.c+"08"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>{typeHdr.map(f=>renderF(f,TC.c,"t_"))}</div></div>}
      </div>

      {/* LAYER 3: Category-specific */}
      <div style={{borderBottom:`1px solid ${M.div}`,borderLeft:`4px solid ${CC_CAT.c}`}}>
        <div onClick={()=>toggleAcc("cat")} style={{fontSize:13,fontWeight:900,color:CC_CAT.c,display:"flex",alignItems:"center",gap:5,background:CC_CAT.c+"12",padding:"8px 14px",cursor:"pointer",borderBottom:accOpen.cat?`1.5px solid ${CC_CAT.c}30`:"none"}}>
          <span style={{fontSize:10,fontWeight:900,transform:accOpen.cat?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span>
          <span style={{fontSize:15}}>{CC_CAT.icon}</span> {itemCat} — category-specific <span style={{padding:"2px 7px",borderRadius:6,fontSize:10,fontWeight:800,background:CC_CAT.c+"15",color:CC_CAT.c}}>{catHdr.length}</span>
          <span style={{marginLeft:"auto",fontSize:9,color:CC_CAT.c+"80"}}>{accOpen.cat?"click to collapse":"click to expand"}</span>
        </div>
        {accOpen.cat && <div style={{padding:"10px 14px",background:CC_CAT.c+"08"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>{catHdr.map(f=>renderF(f,CC_CAT.c,"cat_"))}</div></div>}
      </div>
      </>}

      {/* ── Key fields summary strip (visible only when line items expanded) ── */}
      {lineMaxView && (
        <div style={{padding:"8px 14px",borderBottom:`1.5px solid ${M.div}`,background:M.mid,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",flexShrink:0}}>
          {[
            {label:"ISSUE NO",value:"ISS-2026-0009",color:A.a},
            {label:"TYPE",value:issueType,color:TC.c},
            {label:"CATEGORY",value:itemCat,color:CC_CAT.c,icon:CC_CAT.icon},
            {label:"FROM",value:headerData.c_fromLoc||"—",color:"#15803d"},
            {label:"WORK ORDER",value:headerData.t_t1||"—",color:"#0078D4"},
            {label:"STATUS",value:headerData.c_status||"Draft",color:"#E8690A"},
            {label:"PERSON",value:headerData.c_person||"—",color:M.tC},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:5,background:M.sh,border:`1px solid ${M.div}`}}>
              <span style={{fontSize:9,fontWeight:700,color:M.tD,textTransform:"uppercase"}}>{f.label}:</span>
              {f.icon&&<span style={{fontSize:11}}>{f.icon}</span>}
              <span style={{fontSize:12,fontWeight:800,color:f.value==="—"?M.tD:f.color}}>{f.value}</span>
            </div>
          ))}
          <button onClick={()=>setLineMaxView(false)} style={{marginLeft:"auto",padding:"5px 14px",borderRadius:6,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",background:"#dc2626",border:"none",display:"flex",alignItems:"center",gap:4}}>▼ Show All Headers</button>
        </div>
      )}

      {/* ── LINE ITEMS TABLE ── */}
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${M.div}`}}>
        <div onClick={()=>setLineMaxView(v=>!v)} style={{marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:8,background:CC_CAT.c+"12",border:`1.5px solid ${CC_CAT.c}40`,borderLeft:`5px solid ${CC_CAT.c}`,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=CC_CAT.c+"20";e.currentTarget.style.borderColor=CC_CAT.c;}}
          onMouseLeave={e=>{e.currentTarget.style.background=CC_CAT.c+"12";e.currentTarget.style.borderColor=CC_CAT.c+"40";}}>
          <span style={{fontSize:16}}>📦</span>
          <span style={{fontSize:14,fontWeight:900,color:CC_CAT.c}}>Line Items — {itemCat.toLowerCase()} issued</span>
          <span style={{padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:800,background:"#fff",color:A.a,border:`1px solid ${A.a}30`}}>{lineItems.length} items</span>
          <span style={{padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:800,background:"#fff",color:CC_CAT.c,border:`1px solid ${CC_CAT.c}30`}}>{totalQty.toLocaleString("en-IN")} {uom}</span>
          <span style={{padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:800,background:"#fff",color:CC_CAT.c,border:`1px solid ${CC_CAT.c}30`}}>{totalCatUnit} {catUnitLabel}</span>
          <button onClick={e=>{e.stopPropagation();setLineMaxView(v=>!v);}} style={{marginLeft:"auto",padding:"6px 16px",borderRadius:6,fontSize:11,fontWeight:800,background:lineMaxView?"#dc2626":"#1a2744",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,boxShadow:"0 2px 6px rgba(0,0,0,.15)"}}>
            <span style={{fontSize:13}}>{lineMaxView?"▼":"▲"}</span>
            {lineMaxView?"Collapse Table":"Expand Table — Hide Headers"}
          </button>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",minWidth:"100%"}}>
            <thead><tr>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,width:24}}>S.No</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,width:32}}>Img</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`}}>Item Code</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`}}>Item Name</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`}}>Brand</th>
              {catLineCols.map((col,ci)=>(<th key={col.id} style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fbbf24",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,borderLeft:ci===0?`2px solid ${CC_CAT.c}60`:"none",minWidth:col.w}}>{col.h}</th>))}
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`}}>UOM</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,textAlign:"right"}}>In-Hand</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fca5a5",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,textAlign:"right"}}>Alloc</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#86efac",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,textAlign:"right"}}>Free</th>
              <th style={{padding:"5px 6px",fontSize:9,fontWeight:700,color:"#c4b5fd",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`}}>Source</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#5eead4",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,textAlign:"right"}}>Issue Qty</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,textAlign:"right"}}>Rate</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,textAlign:"right"}}>Value</th>
              <th style={{padding:"5px 6px",fontSize:10,fontWeight:700,color:"#fff",background:"#1a2744",borderBottom:`2px solid ${CC_RED}`,width:20}}/>
            </tr></thead>
            <tbody>
              {lineItems.map((row,ri)=>{
                const iq=parseFloat(row.issueQty)||0;const ih=parseFloat(row.inHand)||0;const over=iq>ih&&ih>0;const val=iq*(parseFloat(row.rate)||0);
                const emoji=CAT_EMOJI[itemCat]||"📦";const img=getFirstImg(row.code||"");
                return(<tr key={row._id} style={{borderBottom:`1px solid ${M.div}`,background:ri%2===0?M.tev:M.tod}}>
                  <td style={{padding:"5px 6px"}}><div style={{width:20,height:20,borderRadius:"50%",background:over?"#dc2626":CC_CAT.c,color:"#fff",fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{ri+1}</div></td>
                  <td style={{padding:"4px"}}>
                    <div
                      onClick={()=>{if(img)setOpenImg({src:img,name:row.name||"",code:row.code||""});}}
                      onMouseEnter={e=>{if(img){const b=e.currentTarget.getBoundingClientRect();setHoverImg({src:img,name:row.name||"",code:row.code||"",top:b.bottom+6,left:Math.min(b.left,window.innerWidth-220)});}}}
                      onMouseLeave={()=>setHoverImg(null)}
                      style={{width:34,height:34,borderRadius:5,border:`1.5px solid ${img?A.a+"60":M.inBd}`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,background:img?undefined:A.al,cursor:img?"pointer":"default",boxShadow:img?"0 1px 4px rgba(0,0,0,.1)":"none",transition:"transform .12s,box-shadow .12s"}}
                      onMouseOver={e=>{if(img){e.currentTarget.style.transform="scale(1.15)";e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.2)";}}}
                      onMouseOut={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=img?"0 1px 4px rgba(0,0,0,.1)":"none";}}
                    >{img?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:emoji}</div>
                  </td>
                  <td style={{padding:"5px 6px"}}><input value={row.code||""} onChange={e=>updateLine(row._id,"code",e.target.value)} placeholder="Item code" style={{padding:"4px 8px",fontSize:12,border:`1.5px solid ${M.inBd}`,borderRadius:4,borderLeft:"3px solid #E8690A",width:100,fontFamily:"monospace",fontWeight:700}}/></td>
                  <td style={{padding:"5px 6px",fontSize:13,fontWeight:700,maxWidth:170,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.name||<span style={{color:M.tD,fontStyle:"italic"}}>auto</span>}</td>
                  <td style={{padding:"5px 6px",fontSize:12}}>{row.brand||""}</td>
                  {catLineCols.map((col,ci)=>(<td key={col.id} style={{padding:"5px 6px",borderLeft:ci===0?`2px solid ${CC_CAT.c}20`:"none"}}>
                    {col.dd?<select value={row[col.id]||""} onChange={e=>updateLine(row._id,col.id,e.target.value)} style={{padding:"4px 6px",fontSize:12,borderRadius:3,border:`1px solid ${M.inBd}`,borderLeft:`2px solid ${CC_CAT.c}`,width:col.w}}><option value="">—</option>{col.dd.map(o=><option key={o} value={o}>{o}</option>)}</select>
                    :<input value={row[col.id]||""} onChange={e=>updateLine(row._id,col.id,e.target.value)} style={{padding:"4px 6px",fontSize:12,borderRadius:3,border:`1px solid ${M.inBd}`,borderLeft:`2px solid ${CC_CAT.c}`,width:col.w,textAlign:col.num?"right":"left",fontWeight:col.amber?"700":"400",color:col.amber?"#854d0e":"inherit",fontFamily:col.num?"monospace":"inherit"}}/>}
                  </td>))}
                  <td style={{padding:"5px 6px",fontWeight:800,color:"#854d0e",fontSize:12}}>{row.uom||""}</td>
                  <td style={{padding:"5px 6px",textAlign:"right",fontFamily:"monospace",fontWeight:700,fontSize:13,color:over?"#dc2626":ih>0?"#15803d":M.tD}}>{ih>0?ih.toLocaleString("en-IN"):"—"}</td>
                  {(()=>{const al=getIssueAlloc(row.code);const hasAlloc=al.alloc>0;const fromAlloc=hasAlloc&&headerData.t_t1&&al.items.some(a=>a.ref===headerData.t_t1);return(<>
                  <td style={{padding:"5px 6px",textAlign:"right",fontFamily:"monospace",fontWeight:700,fontSize:12,color:hasAlloc?"#BE123C":M.tD}}>{hasAlloc?<span title={al.items.map(a=>`${a.ref}: ${a.qty} (${a.desc})`).join('\n')}>🔒 {al.alloc.toLocaleString("en-IN")}</span>:"—"}</td>
                  <td style={{padding:"5px 6px",textAlign:"right",fontFamily:"monospace",fontWeight:800,fontSize:13,color:al.free<=0?"#991b1b":al.free<100?"#92400e":"#15803d",background:al.free<=0?"#fef2f2":"transparent",borderRadius:al.free<=0?3:0}}>{al.free>0?al.free.toLocaleString("en-IN"):<span style={{fontWeight:900}}>0</span>}</td>
                  <td style={{padding:"5px 4px"}}>{fromAlloc?<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,fontWeight:800,background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",whiteSpace:"nowrap"}}>📋 Alloc</span>:hasAlloc?<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,fontWeight:800,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",whiteSpace:"nowrap"}}>✅ Free</span>:<span style={{color:M.tD,fontSize:9}}>Free</span>}</td>
                  </>);})()}
                  <td style={{padding:"5px 6px",textAlign:"right"}}><input type="number" value={row.issueQty||""} onChange={e=>updateLine(row._id,"issueQty",e.target.value)} style={{padding:"4px 6px",fontSize:13,borderRadius:3,border:`1.5px solid ${over?"#dc2626":A.a}`,color:over?"#dc2626":A.a,fontWeight:700,width:65,textAlign:"right",fontFamily:"monospace"}}/></td>
                  <td style={{padding:"5px 6px",textAlign:"right",fontFamily:"monospace",fontSize:12,color:"#854d0e"}}>{row.rate?`₹${row.rate}`:""}</td>
                  <td style={{padding:"5px 6px",textAlign:"right",fontFamily:"monospace",fontSize:12,fontWeight:700}}>{val>0?`₹${val.toLocaleString("en-IN")}`:""}</td>
                  <td style={{padding:"5px 6px",textAlign:"center",color:"#dc2626",cursor:"pointer",fontWeight:700,fontSize:12}} onClick={()=>removeLine(row._id)}>✕</td>
                </tr>);
              })}
              <tr style={{background:M.mid}}>
                <td colSpan={5+catLineCols.length+4} style={{textAlign:"right",padding:"6px 10px",fontSize:9,fontWeight:700,color:M.tD,borderTop:`2px solid ${CC_RED}`}}>TOTAL:</td>
                <td style={{borderTop:`2px solid ${CC_RED}`}}/>
                <td style={{textAlign:"right",padding:"6px",fontFamily:"monospace",fontSize:12,fontWeight:900,color:A.a,borderTop:`2px solid ${CC_RED}`}}>{totalQty.toLocaleString("en-IN")} {uom}</td>
                <td style={{borderTop:`2px solid ${CC_RED}`}}/>
                <td style={{textAlign:"right",padding:"6px",fontFamily:"monospace",fontSize:12,fontWeight:900,color:"#854d0e",borderTop:`2px solid ${CC_RED}`}}>₹{totalValue.toLocaleString("en-IN")}</td>
                <td style={{borderTop:`2px solid ${CC_RED}`}}/>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
          <button onClick={addLine} style={{padding:"6px 14px",border:"none",borderRadius:5,background:A.a,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>+ Add Item</button>
          <button onClick={()=>removeLine(lineItems[lineItems.length-1]?._id)} style={{padding:"6px 14px",border:`1.5px solid #dc2626`,borderRadius:5,background:"#fff",color:"#dc2626",fontSize:10,fontWeight:700,cursor:"pointer"}}>− Delete Last</button>
          <div style={{flex:1}}/>
          {warnings>0&&<span style={{padding:"4px 10px",borderRadius:5,fontSize:10,fontWeight:800,background:"#fef2f2",color:"#991b1b"}}>{warnings} row{warnings>1?"s":""}: qty exceeds in-hand</span>}
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{padding:"8px 14px",borderBottom:`1px solid ${M.div}`,background:M.mid}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:8}}>
          <div style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${M.div}`,background:M.hi}}><div style={{fontSize:8,color:M.tD}}>Items</div><div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:"#1a2744"}}>{lineItems.length}</div></div>
          <div style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${M.div}`,background:M.hi}}><div style={{fontSize:8,color:CC_CAT.c}}>Total {catUnitLabel}</div><div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:CC_CAT.c}}>{totalCatUnit}</div></div>
          <div style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${M.div}`,background:M.hi}}><div style={{fontSize:8,color:A.a}}>Total qty</div><div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:A.a}}>{totalQty.toLocaleString("en-IN")} {uom}</div></div>
          <div style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${M.div}`,background:M.hi}}><div style={{fontSize:8,color:"#854d0e"}}>Total value</div><div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:"#854d0e"}}>₹{totalValue.toLocaleString("en-IN")}</div></div>
          <div style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${warnings>0?"#dc2626":M.div}`,background:M.hi}}><div style={{fontSize:8,color:warnings>0?"#dc2626":M.tD}}>Warnings</div><div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:warnings>0?"#dc2626":"#15803d"}}>{warnings}</div></div>
        </div>
      </div>

      {/* AUDIT + ACTIONS */}
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${M.div}`}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div><div style={{fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",marginBottom:3}}><span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:A.al,color:A.a,marginRight:3}}>AUTO</span>ISSUED BY</div><input readOnly value="store@ccpl.in" style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${A.a}30`,borderRadius:5,background:A.al,color:A.a,fontWeight:600,width:"100%"}}/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",marginBottom:3}}><span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:A.al,color:A.a,marginRight:3}}>AUTO</span>CREATED DATE</div><input readOnly value={new Date().toLocaleString("en-IN")} style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${A.a}30`,borderRadius:5,background:A.al,color:A.a,fontWeight:600,width:"100%"}}/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",marginBottom:3}}>REMARKS</div><input value={headerData.remarks||""} onChange={e=>setHeaderData(p=>({...p,remarks:e.target.value}))} placeholder="Issue notes..." style={{padding:"6px 10px",fontSize:13,border:`1.5px solid ${M.inBd}`,borderRadius:5,width:"100%"}}/></div>
        </div>
      </div>
      <div style={{padding:"10px 14px",display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>{setHeaderData({});setLineItems([{_id:1}]);setNextId(2);}} style={{padding:"8px 18px",border:`1.5px solid ${M.inBd}`,borderRadius:6,background:M.inBg,color:M.tB,fontSize:11,fontWeight:700,cursor:"pointer"}}>↺ Reset</button>
        <button style={{padding:"8px 18px",border:"none",borderRadius:6,background:"#E8690A",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Save as Draft</button>
        <button style={{padding:"8px 18px",border:"none",borderRadius:6,background:A.a,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Confirm + Create Movement</button>
        <button style={{padding:"8px 18px",border:"none",borderRadius:6,background:"#15803d",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Save + Print Challan</button>
      </div>

    </div>
    )}
    {/* Hover preview popup */}
    {hoverImg && !openImg && (
      <div style={{position:"fixed",top:hoverImg.top,left:hoverImg.left,zIndex:9999,pointerEvents:"none",animation:"fadeIn .12s"}}>
        <div style={{width:180,background:M.hi||"#fff",border:`2px solid ${A.a}`,borderRadius:10,boxShadow:"0 8px 28px rgba(0,0,0,.18)",overflow:"hidden"}}>
          <img src={hoverImg.src} alt="" style={{width:"100%",height:140,objectFit:"cover",display:"block"}}/>
          <div style={{padding:"6px 8px",borderTop:`1px solid ${M.div||"#e5e7eb"}`}}>
            <div style={{fontSize:10,fontWeight:800,color:M.tA||"#111",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{hoverImg.name}</div>
            <div style={{fontSize:8,fontFamily:"monospace",color:A.a,fontWeight:700}}>{hoverImg.code}</div>
          </div>
        </div>
      </div>
    )}
    {/* Lightbox modal */}
    {openImg && (
      <div onClick={()=>setOpenImg(null)} style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:M.hi||"#fff",borderRadius:14,overflow:"hidden",maxWidth:480,width:"90%",boxShadow:"0 16px 48px rgba(0,0,0,.3)",cursor:"default"}}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${M.div||"#e5e7eb"}`,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>{CAT_EMOJI[itemCat]||"📦"}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:900,color:M.tA||"#111"}}>{openImg.name}</div>
              <div style={{fontSize:10,fontFamily:"monospace",color:A.a,fontWeight:700}}>{openImg.code}</div>
            </div>
            <button onClick={()=>setOpenImg(null)} style={{width:28,height:28,borderRadius:6,border:`1px solid ${M.div||"#e5e7eb"}`,background:"transparent",color:M.tC||"#6b7280",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <img src={openImg.src} alt="" style={{width:"100%",maxHeight:400,objectFit:"contain",display:"block",background:"#000"}}/>
          <div style={{padding:"8px 14px",textAlign:"center",fontSize:9,color:M.tD||"#9ca3af"}}>Click outside or ✕ to close</div>
        </div>
      </div>
    )}
  </div>);
}

export default StockIssueTab;
