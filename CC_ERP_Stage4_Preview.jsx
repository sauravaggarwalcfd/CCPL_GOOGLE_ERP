import { useState, useEffect, useCallback, useRef } from "react";

// ─── FONTS ──────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800;6..12,900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');`;

// ─── THEME TOKENS ───────────────────────────────────────
const MODES = {
  light: { bg:"#f0f2f5",shellBg:"#ffffff",shellBd:"#e2e4e8",sidebarBg:"#ffffff",sidebarBd:"#e2e4e8",surfHigh:"#ffffff",surfMid:"#f7f8fa",surfLow:"#f0f2f5",hoverBg:"#eef1f8",inputBg:"#ffffff",inputBd:"#d1d5db",dropBg:"#ffffff",dropHover:"#f0f4ff",divider:"#e5e7eb",tblHead:"#f4f5f7",tblEven:"#ffffff",tblOdd:"#fafbfc",statusBg:"#f0f2f5",badgeBg:"#e5e7eb",badgeTx:"#374151",textA:"#111827",textB:"#374151",textC:"#6b7280",textD:"#9ca3af",shadow:"0 4px 20px rgba(0,0,0,.09)" },
  dark: { bg:"#0d1117",shellBg:"#161b22",shellBd:"#21262d",sidebarBg:"#161b22",sidebarBd:"#21262d",surfHigh:"#1c2128",surfMid:"#161b22",surfLow:"#0d1117",hoverBg:"#21262d",inputBg:"#0d1117",inputBd:"#30363d",dropBg:"#161b22",dropHover:"#21262d",divider:"#21262d",tblHead:"#161b22",tblEven:"#1c2128",tblOdd:"#161b22",statusBg:"#0d1117",badgeBg:"#21262d",badgeTx:"#7d8590",textA:"#e6edf3",textB:"#8b949e",textC:"#6e7681",textD:"#484f58",shadow:"0 4px 24px rgba(0,0,0,.6)" },
};
const ACCENT = { a:"#E8690A", al:"rgba(232,105,10,.1)", ad:"#b85208", tx:"#fff" };

const STATUS_COLORS = { "Draft":"#6b7280","Pending":"#f59e0b","Approved":"#0078D4","Partial":"#8b5cf6","Received":"#15803D","Closed":"#374151","Cancelled":"#ef4444" };
const STATUS_GROUPS = { "Not Started":["Draft","Pending"], "In Progress":["Approved","Partial"], "Complete":["Received","Closed","Cancelled"] };

// ─── SAMPLE DATA ────────────────────────────────────────
const PO_DATA = [
  { code:"PO-2026-0042",date:"15-Feb-26",supplier:"Coats India",supplierCode:"SUP-003",type:"Trim",amount:124500,status:"Approved",season:"SS26" },
  { code:"PO-2026-0045",date:"18-Feb-26",supplier:"Vardhman Textiles",supplierCode:"SUP-001",type:"Fabric",amount:245000,status:"Draft",season:"SS26" },
  { code:"PO-2026-0038",date:"08-Feb-26",supplier:"Coats India",supplierCode:"SUP-003",type:"Trim",amount:89200,status:"Received",season:"SS26" },
  { code:"PO-2026-0041",date:"12-Feb-26",supplier:"Raymond Threads",supplierCode:"SUP-005",type:"Yarn",amount:215000,status:"Approved",season:"SS26" },
  { code:"PO-2026-0021",date:"22-Jan-26",supplier:"Raymond Threads",supplierCode:"SUP-005",type:"Trim",amount:178000,status:"Received",season:"AW25" },
  { code:"PO-2026-0039",date:"10-Feb-26",supplier:"Nahar Group",supplierCode:"SUP-002",type:"Fabric",amount:312000,status:"Partial",season:"SS26" },
  { code:"PO-2026-0044",date:"17-Feb-26",supplier:"Birla Yarns",supplierCode:"SUP-007",type:"Yarn",amount:45200,status:"Draft",season:"SS26" },
  { code:"PO-2026-0035",date:"01-Feb-26",supplier:"Coats India",supplierCode:"SUP-003",type:"Trim",amount:67800,status:"Closed",season:"AW25" },
  { code:"PO-2026-0040",date:"11-Feb-26",supplier:"Vardhman Textiles",supplierCode:"SUP-001",type:"Fabric",amount:189000,status:"Pending",season:"SS26" },
  { code:"PO-2026-0043",date:"16-Feb-26",supplier:"Nahar Group",supplierCode:"SUP-002",type:"Fabric",amount:156000,status:"Pending",season:"SS26" },
];

const LINE_ITEMS = [
  { line:1,itemCode:"TRM-THD-001",name:"Polyester Thread 40s",qty:500,uom:"CONE",rate:45,gst:12 },
  { line:2,itemCode:"TRM-LBL-002",name:"Woven Main Label",qty:2000,uom:"PCS",rate:0.80,gst:12 },
  { line:3,itemCode:"TRM-LBL-005",name:"Wash Care Label",qty:2000,uom:"PCS",rate:0.65,gst:12 },
  { line:4,itemCode:"TRM-TAG-001",name:"Hang Tag Printed",qty:1000,uom:"PCS",rate:3.50,gst:18 },
];

const GRN_DATA = [
  { code:"GRN-2026-0019",date:"12-Feb-26",po:"PO-2026-0042",qty:"500 CON",qc:"✅ Pass",status:"Accepted" },
  { code:"GRN-2026-0014",date:"28-Jan-26",po:"PO-2026-0042",qty:"800 CON",qc:"✅ Pass",status:"Accepted" },
  { code:"GRN-2026-0013",date:"26-Jan-26",po:"PO-2026-0042",qty:"400 CON",qc:"⚠ Partial",status:"Partial" },
];

const ISR_DATA = [
  { itemCode:"TRM-THD-001",name:"Polyester Thread 40s",rate:"₹45/CON",uom:"CONE",priority:"Primary" },
  { itemCode:"TRM-THD-003",name:"Cotton Thread 60s",rate:"₹62/CON",uom:"CONE",priority:"Primary" },
  { itemCode:"TRM-LBL-002",name:"Woven Main Label",rate:"₹0.80/PC",uom:"PCS",priority:"Secondary" },
];

const COMMENTS = [
  { author:"Saurav Aggarwal",avatar:"SA",time:"14-Feb 3:42pm",text:"Supplier confirmed delivery by 20th Feb. Rate locked at ₹45/cone." },
  { author:"Rajesh Kumar",avatar:"RK",time:"15-Feb 10:15am",text:"@saurav Rate increased by ₹2/cone for Thread 60s — need approval before next PO." },
  { author:"Amit Sharma",avatar:"AS",time:"15-Feb 2:30pm",text:"QC passed on GRN-2026-0019. All 500 cones accepted. Quality grade: A." },
];

const NOTIFICATIONS = [
  { type:"action",title:"PO-2026-0045 needs approval",detail:"Draft PO from Vardhman Textiles — ₹2,45,000",time:"2 min ago",read:false },
  { type:"warning",title:"Low stock: RM-FAB-003",detail:"Current: 120 KG | Reorder: 200 KG",time:"15 min ago",read:false },
  { type:"info",title:"GRN-2026-0019 accepted",detail:"QC passed. 500 CONE received.",time:"1 hr ago",read:true },
];

const TEMPLATES = [
  { name:"Fabric PO — Domestic",desc:"Type=Fabric, Terms=30 Days, GST=5%",icon:"🧵" },
  { name:"Trim PO — Import",desc:"Type=Trim, Terms=LC, Currency=USD",icon:"✂️" },
  { name:"Repeat PO from Supplier",desc:"Copy last PO, update quantities",icon:"📋" },
  { name:"Blank PO",desc:"Empty form, fill everything manually",icon:"📄" },
];

// ─── HELP CONTENT DATA (13 Pages) ──────────────────────
const HELP_PAGES = [
  { id:"HLP-001",category:"Getting Started",icon:"👋",title:"Welcome to CC ERP",tags:"welcome,intro,overview",audience:"All",module:"All",
    content:"## Welcome to Confidence Clothing ERP\n\nYour complete garment manufacturing management system.\n\n### Quick Start\n1. Use the **sidebar** to navigate between modules\n2. Press **Ctrl+K** to open the command palette for quick search\n3. Click any record code (orange) to open its detail view\n4. Use **View Switcher** to toggle Table / Kanban / Calendar / Gallery\n\n### Key Features\n- **Procurement** — PO, GRN, Purchase Returns\n- **Inventory** — Stock levels, movements, reorder alerts\n- **Production** — Work orders, BOM, quality checks\n- **Finance** — Invoices, payments, GST reports" },
  { id:"HLP-002",category:"Getting Started",icon:"⌨️",title:"Keyboard Shortcuts",tags:"shortcuts,keyboard,ctrl-k",audience:"All",module:"All",
    content:"## Keyboard Shortcuts\n\n| Shortcut | Action |\n|---|---|\n| **Ctrl+K** | Command Palette — search anything |\n| **/** | Slash menu — quick actions in forms |\n| **Esc** | Close any modal/panel |\n| **←** | Go back from record detail |\n| **N** | New record (when in list view) |\n| **F** | Focus filter bar |\n| **?** | Open Help panel |" },
  { id:"HLP-003",category:"Getting Started",icon:"🏷️",title:"Understanding Status Badges",tags:"status,workflow,badges,colors",audience:"All",module:"All",
    content:"## Status Badges\n\nEvery record has a colored status badge showing its current state.\n\n### Stage Groups\n- **Not Started** — Draft (grey), Pending (amber)\n- **In Progress** — Approved (blue), Partial (purple)\n- **Complete** — Received (green), Closed (dark), Cancelled (red)\n\n### Transitions\nStatuses follow a defined workflow. You can only move to the next allowed status. Drag cards on Kanban view to change status." },
  { id:"HLP-004",category:"Module Setup",icon:"📦",title:"Purchase Order — How It Works",tags:"PO,purchase,order,procurement",audience:"All",module:"Procurement",
    content:"## Purchase Orders\n\n### Creating a PO\n1. Click **+ New PO** → choose a template or start blank\n2. Select **Supplier** (FK → Supplier Master)\n3. Add **Line Items** — item codes auto-pull UOM, HSN, GST\n4. Set terms, delivery date, payment terms\n5. Submit for approval\n\n### Rollup Cards\n- GRN Received count\n- Total PO value\n- Delivery due date\n- QC pass rate\n\n### Linked Views\n- **Goods Receipts** — all GRNs against this PO\n- **Items Supplied** — supplier rates for items on this PO" },
  { id:"HLP-005",category:"Module Setup",icon:"📥",title:"Goods Receipt Note — How It Works",tags:"GRN,goods,receipt,receiving",audience:"All",module:"Procurement",
    content:"## Goods Receipt Notes\n\n### Creating a GRN\n1. Select the **PO** being received\n2. Enter vehicle details (DC No, Gate Pass)\n3. For each line: enter **Received Qty**, **Accepted Qty**, **Rejected Qty**\n4. Assign **Batch/Lot** numbers\n5. Record roll-wise data if fabric\n6. QC team marks Pass/Fail\n\n### Auto-Updates\n- PO status auto-updates to Partial/Received based on quantities\n- Inventory stock auto-increments on GRN acceptance" },
  { id:"HLP-006",category:"Config Guide",icon:"🔗",title:"How to Add a Linked Database View",tags:"linked,view,embedded,config",audience:"Admin",module:"All",
    content:"## Adding a Linked Database View\n\n### 3 Ways to Configure\n\n**Path 1 — Manual:** Open EMBEDDED_VIEWS sheet → add row:\n```\nEMB-xxx | Parent Sheet | FK Column | Source Sheet | Display Cols | Sort | Max Rows\n```\n\n**Path 2 — Ask Claude:** Tell Claude: \"Add a linked view on CUSTOMER_MASTER showing their invoices\"\n\n**Path 3 — Admin UI (Phase 3C):** Click **+ Add Linked View** on any record → fill the modal → Save\n\n### Example\nTo show all POs for a supplier on SUPPLIER_MASTER:\n- Source: PO_MASTER\n- FK: → Supplier Code\n- Display: PO Code, Date, Amount, Status" },
  { id:"HLP-007",category:"Config Guide",icon:"📊",title:"How to Add a Rollup Summary Card",tags:"rollup,summary,card,aggregate",audience:"Admin",module:"All",
    content:"## Adding Rollup Summary Cards\n\nRollup cards show aggregate data at the top of record detail pages.\n\n### Configuration\nAdd a row to ROLLUP_CONFIG:\n```\nRUP-xxx | Parent | FK Col | Source | Agg Col | Function | Label | Format\n```\n\n### Functions Available\n- **COUNT** — number of child records\n- **SUM** — total of a numeric column\n- **AVG** — average value\n- **MIN / MAX** — minimum or maximum\n- **LAST** — most recent value" },
  { id:"HLP-008",category:"Config Guide",icon:"⚙️",title:"How to Edit Status Workflows",tags:"workflow,status,transitions,admin",audience:"Admin",module:"All",
    content:"## Editing Status Workflows\n\n**Admin only** — Managers can view but not edit.\n\n### STATUS_WORKFLOW Sheet\nEach row = one status in a module's workflow.\n\nColumns: Module, Status Code, Status Label, Color, Stage Group, Sort Order, Allowed Next (comma-separated), Required Role, Auto Actions, Active\n\n### Rules\n- Stage Groups enforce flow: Not Started → In Progress → Complete\n- Cannot delete a status if active records use it\n- Color must be a valid hex code" },
  { id:"HLP-009",category:"Config Guide",icon:"📋",title:"How to Create Record Templates",tags:"template,pre-fill,create,new",audience:"Admin",module:"All",
    content:"## Creating Record Templates\n\nTemplates pre-fill forms when creating new records.\n\n### Example PO Templates\n- 🧵 Fabric PO — Domestic (Type=Fabric, Terms=30 Days)\n- ✂️ Trim PO — Import (Type=Trim, Currency=USD)\n- 📋 Repeat PO (Copy last PO for same supplier)\n\n### How to Add\n1. Open TEMPLATES sheet in FILE 2\n2. Add row with TPL-xxx ID\n3. Set Module, Template Name, Pre-fill JSON\n4. Or use Admin UI → Manage Templates" },
  { id:"HLP-010",category:"Config Guide",icon:"⚡",title:"How to Set Up Automations",tags:"automation,trigger,rule,notify",audience:"Admin",module:"All",
    content:"## Setting Up Automation Rules\n\n**Admin only** — automatic actions triggered by events.\n\n### Trigger Types\n- **status_change** — when a record changes status\n- **record_create** — when a new record is created\n- **field_update** — when a specific field changes\n- **threshold** — when a value exceeds a limit\n\n### Action Types\n- Send notification to a role\n- Update a field value\n- Create a linked record\n- Send email alert" },
  { id:"HLP-011",category:"Config Guide",icon:"🏗️",title:"How to Set Up a New Module (Checklist)",tags:"module,setup,checklist,new",audience:"Admin",module:"All",
    content:"## New Module Setup Checklist\n\n1. ☐ Define master sheet(s) with R1/R2/R3 structure\n2. ☐ Add FK relations to MASTER_RELATIONS\n3. ☐ Add status workflow rows to STATUS_WORKFLOW\n4. ☐ Add rollup configs to ROLLUP_CONFIG\n5. ☐ Add linked views to EMBEDDED_VIEWS\n6. ☐ Create record templates in TEMPLATES\n7. ☐ Add automation rules to AUTOMATION_RULES\n8. ☐ Create help pages in HELP_CONTENT\n9. ☐ Set up access control in USER_MASTER\n10. ☐ Test all FK dropdowns and auto-display" },
  { id:"HLP-012",category:"Troubleshooting",icon:"🔄",title:"Data Not Showing / Stale Data",tags:"cache,stale,refresh,data,missing",audience:"All",module:"All",
    content:"## Data Not Showing or Stale\n\n### Quick Fix\n1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)\n2. **Clear cache**: Menu → Tools → Clear Cache\n3. **Wait 30 seconds** — cache auto-refreshes every 6 hours\n\n### Why It Happens\n- Layer 1 cache (CacheService) caches FK data for 6 hours\n- If someone added a new supplier, your dropdown might not show it yet\n- Cross-file data (Layer 2) refreshes at 7am daily\n\n### Still Not Working?\nAsk Admin to run: Menu → Admin → Force Cache Refresh" },
  { id:"HLP-013",category:"Troubleshooting",icon:"🔒",title:"Permission Denied / Cannot See Button",tags:"permission,access,denied,role,button",audience:"All",module:"All",
    content:"## Permission Denied\n\n### Check Your Role\nYour access level determines what you can see and do:\n\n| Role | Can Edit | Read Only |\n|---|---|---|\n| Admin | All masters | — |\n| Purchase Mgr | Supplier, ISR | Item masters |\n| Production Mgr | Process, Machine | Item masters |\n| Store Keeper | Warehouse, Bins | Item masters |\n| Accounts | Finance masters | Item masters |\n\n### Common Issues\n- **Can't see a sheet?** — it may be hidden for your role\n- **Can't edit a cell?** — it may be auto-generated (# or ← icon)\n- **Button missing?** — feature may require higher role level" },
];

const HELP_CATEGORIES = ["Getting Started","Module Setup","Config Guide","Troubleshooting"];

// ─── WORKFLOW DATA (for WorkflowEditor preview) ────────
const WORKFLOW_STATUSES = [
  { code:"DRAFT",label:"Draft",color:"#6b7280",stage:"Not Started",next:["PENDING","CANCELLED"],role:"Operator" },
  { code:"PENDING",label:"Pending",color:"#f59e0b",stage:"Not Started",next:["APPROVED","CANCELLED"],role:"Operator" },
  { code:"APPROVED",label:"Approved",color:"#0078D4",stage:"In Progress",next:["PARTIAL","RECEIVED","CANCELLED"],role:"Manager" },
  { code:"PARTIAL",label:"Partial",color:"#8b5cf6",stage:"In Progress",next:["RECEIVED","CANCELLED"],role:"Manager" },
  { code:"RECEIVED",label:"Received",color:"#15803D",stage:"Complete",next:["CLOSED"],role:"Manager" },
  { code:"CLOSED",label:"Closed",color:"#374151",stage:"Complete",next:[],role:"Admin" },
  { code:"CANCELLED",label:"Cancelled",color:"#ef4444",stage:"Complete",next:[],role:"Admin" },
];

const uf = "'Nunito Sans',sans-serif";
const df = "'IBM Plex Mono',monospace";
const fmt = (n) => "₹" + n.toLocaleString("en-IN");

// ─── MAIN APP ───────────────────────────────────────────
export default function CCERPPreview() {
  const [mode, setMode] = useState("light");
  const [view, setView] = useState("table");
  const [activeModule, setActiveModule] = useState("procurement");
  const [selectedPO, setSelectedPO] = useState(null);
  const [sidebarW] = useState(280);
  const [activeFilter, setActiveFilter] = useState("All POs");
  const [showNotif, setShowNotif] = useState(false);
  const [showCtrlK, setShowCtrlK] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [collSections, setCollSections] = useState({ logistics:true, pricing:true, notes:true });
  const [linkedExpanded, setLinkedExpanded] = useState({ grn:true, isr:true });
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  // ★ NEW V7: Help System state
  const [showHelp, setShowHelp] = useState(false);
  const [helpPage, setHelpPage] = useState(null);
  const [helpSearch, setHelpSearch] = useState("");
  const [helpCollapsed, setHelpCollapsed] = useState({});
  // ★ NEW V7: Configurator state
  const [showConfigurator, setShowConfigurator] = useState(null); // "linkedView" | "rollup" | "workflow" | "template" | "automation" | null
  const [configForm, setConfigForm] = useState({});

  const M = MODES[mode];
  const A = ACCENT;

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setShowCtrlK(true); }
      if (e.key === "Escape") { setShowCtrlK(false); setShowTemplate(false); setShowSlash(false); setShowNotif(false); setShowHelp(false); setShowConfigurator(null); setHelpPage(null); }
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT") { e.preventDefault(); setShowHelp(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const lbl = { display:"block",fontSize:9,fontWeight:900,color:M.textD,marginBottom:3,fontFamily:uf,letterSpacing:.5,textTransform:"uppercase" };
  const mono = { fontFamily:df,fontWeight:600 };

  // ─── STATUS BADGE ─────────────────────────────────────
  const StatusBadge = ({ status, small }) => (
    <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:small?"2px 8px":"3px 10px",borderRadius:10,fontSize:small?9:10,fontWeight:700,fontFamily:uf,background:`${STATUS_COLORS[status]}18`,color:STATUS_COLORS[status],border:`1px solid ${STATUS_COLORS[status]}30` }}>
      <span style={{ width:6,height:6,borderRadius:3,background:STATUS_COLORS[status] }}/>
      {status}
    </span>
  );

  // ─── SHELL BAR ────────────────────────────────────────
  const ShellBar = () => (
    <div style={{ height:48,background:M.shellBg,borderBottom:`1px solid ${M.shellBd}`,display:"flex",alignItems:"center",padding:"0 16px",gap:12,zIndex:200,position:"relative" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,borderRight:`1px solid ${M.divider}`,paddingRight:14 }}>
        <div style={{ width:28,height:28,borderRadius:5,background:A.a,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>📦</div>
        <div><div style={{ fontSize:11,fontWeight:900,color:A.a,fontFamily:uf }}>CC ERP</div><div style={{ fontSize:7,color:M.textD,letterSpacing:.5,fontFamily:uf }}>CONFIDENCE CLOTHING</div></div>
      </div>
      <div style={{ fontSize:11,fontFamily:uf,color:M.textC }}>
        <span style={{ cursor:"pointer" }} onClick={() => setSelectedPO(null)}>Home</span>
        <span style={{ color:M.textD }}> › </span>
        <span style={{ color:A.a,fontWeight:700 }}>Procurement</span>
        {selectedPO && <><span style={{ color:M.textD }}> › </span><span style={{ color:A.a,fontWeight:700,fontFamily:df }}>{selectedPO.code}</span></>}
      </div>
      <div style={{ flex:1 }}/>
      <div onClick={() => setShowCtrlK(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 14px",background:M.surfLow,border:`1px solid ${M.divider}`,borderRadius:6,cursor:"pointer",fontSize:11,color:M.textC,fontFamily:uf }}>
        🔍 Search… <span style={{ ...mono,fontSize:9,background:M.badgeBg,padding:"1px 5px",borderRadius:3,color:M.badgeTx }}>Ctrl K</span>
      </div>
      {/* Theme toggle */}
      <div style={{ display:"flex",gap:4,background:M.surfLow,padding:3,borderRadius:6,border:`1px solid ${M.divider}` }}>
        {[["light","☀️"],["dark","🌙"]].map(([id,em]) => (
          <div key={id} onClick={() => setMode(id)} style={{ width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4,cursor:"pointer",fontSize:12,border:mode===id?`2px solid ${A.a}`:"2px solid transparent",background:mode===id?A.al:"transparent" }}>{em}</div>
        ))}
      </div>
      {/* Notification bell */}
      <div style={{ position:"relative",cursor:"pointer" }} onClick={() => setShowNotif(!showNotif)}>
        <span style={{ fontSize:18 }}>🔔</span>
        <span style={{ position:"absolute",top:-4,right:-6,background:"#ef4444",color:"#fff",fontSize:8,fontWeight:800,borderRadius:8,padding:"1px 4px",fontFamily:uf }}>3</span>
      </div>
      {/* ★ HELP BUTTON — NEW V7 */}
      <div style={{ position:"relative",cursor:"pointer" }} onClick={() => { setShowHelp(!showHelp); setHelpPage(null); setHelpSearch(""); }}>
        <div style={{ width:26,height:26,borderRadius:13,background:showHelp?A.a:M.surfLow,color:showHelp?A.tx:M.textC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,fontFamily:uf,border:`1.5px solid ${showHelp?A.a:M.divider}`,transition:"all .2s" }}>?</div>
        <span style={{ position:"absolute",top:-3,right:-4,background:"#15803D",color:"#fff",fontSize:7,fontWeight:800,borderRadius:6,padding:"1px 4px",fontFamily:uf }}>New</span>
      </div>
      {/* Presence avatars */}
      <div style={{ display:"flex",gap:-4 }}>
        {[{i:"SA",c:"#E8690A"},{i:"RK",c:"#0078D4"},{i:"AS",c:"#15803D"}].map((u,i) => (
          <div key={i} style={{ width:26,height:26,borderRadius:13,background:u.c,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,fontFamily:uf,border:`2px solid ${M.shellBg}`,marginLeft:i>0?-6:0 }}>{u.i}</div>
        ))}
      </div>
      <span style={{ fontSize:16,cursor:"pointer",color:M.textC }}>⚙️</span>
    </div>
  );

  // ─── SIDEBAR ──────────────────────────────────────────
  const Sidebar = () => (
    <div style={{ width:sidebarW,background:M.sidebarBg,borderRight:`1px solid ${M.sidebarBd}`,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ padding:"12px 14px 8px",borderBottom:`1px solid ${M.divider}` }}>
        <div style={{ ...lbl,fontSize:9,letterSpacing:1.2,marginBottom:8 }}>⭐ QUICK ACCESS</div>
        {[{icon:"📦",label:"New PO",sub:"Procurement"},{icon:"📥",label:"GRN-2026-0019",sub:"Goods Receipt"},{icon:"🏭",label:"Coats India",sub:"Supplier"}].map((s,i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:5,cursor:"pointer",marginBottom:2 }} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{ fontSize:13 }}>{s.icon}</span>
            <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,fontWeight:700,color:M.textB,fontFamily:uf,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.label}</div><div style={{ fontSize:8,color:M.textD,fontFamily:uf }}>{s.sub}</div></div>
          </div>
        ))}
      </div>
      <div style={{ padding:"8px 14px",borderBottom:`1px solid ${M.divider}` }}>
        <div style={{ ...lbl,fontSize:9,letterSpacing:1.2,marginBottom:6 }}>🕐 RECENT</div>
        {[{icon:"📦",label:"PO-2026-0042",sub:"Coats India"},{icon:"📦",label:"PO-2026-0039",sub:"Nahar Group"}].map((s,i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:5,cursor:"pointer",marginBottom:1 }} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{ fontSize:12 }}>{s.icon}</span>
            <div><div style={{ fontSize:11,fontWeight:600,color:M.textB,fontFamily:df }}>{s.label}</div><div style={{ fontSize:8,color:M.textD,fontFamily:uf }}>{s.sub}</div></div>
          </div>
        ))}
      </div>
      <div style={{ flex:1,overflow:"auto",padding:"8px 14px" }}>
        <div style={{ ...lbl,fontSize:9,letterSpacing:1.2,marginBottom:6 }}>MODULES</div>
        {[{icon:"📦",label:"Procurement",count:3,active:true},{icon:"🏭",label:"Production",count:1},{icon:"📊",label:"Inventory"},{icon:"🔬",label:"Quality"},{icon:"👥",label:"HR & Factory"},{icon:"💰",label:"Finance"},{icon:"📋",label:"BOM"},{icon:"⚙️",label:"Settings"}].map((m,i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:6,cursor:"pointer",marginBottom:2,background:m.active?A.al:"transparent",border:m.active?`1px solid ${A.a}20`:"1px solid transparent" }} onMouseEnter={e=>{if(!m.active)e.currentTarget.style.background=M.hoverBg}} onMouseLeave={e=>{if(!m.active)e.currentTarget.style.background="transparent"}}>
            <span style={{ fontSize:14 }}>{m.icon}</span>
            <span style={{ flex:1,fontSize:12,fontWeight:m.active?800:600,color:m.active?A.a:M.textB,fontFamily:uf }}>{m.label}</span>
            {m.count && <span style={{ background:m.active?A.a:M.badgeBg,color:m.active?"#fff":M.badgeTx,fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:8,fontFamily:df }}>{m.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── VIEW SWITCHER ────────────────────────────────────
  const ViewSwitcher = () => (
    <div style={{ display:"flex",gap:2,background:M.surfLow,padding:2,borderRadius:6,border:`1px solid ${M.divider}` }}>
      {[["table","▤ Table"],["kanban","◫ Kanban"],["calendar","📅 Calendar"],["gallery","▦ Gallery"]].map(([id,label]) => (
        <div key={id} onClick={() => setView(id)} style={{ padding:"5px 12px",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:view===id?700:500,fontFamily:uf,background:view===id?A.a:"transparent",color:view===id?A.tx:M.textB,transition:"all .15s" }}>{label}</div>
      ))}
    </div>
  );

  // ─── SAVED FILTER TABS ────────────────────────────────
  const SavedFilterTabs = () => (
    <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
      {["All POs","My Pending","Fabric Orders","This Month","Coats India"].map(f => (
        <div key={f} onClick={() => setActiveFilter(f)} style={{ padding:"4px 12px",borderRadius:12,cursor:"pointer",fontSize:10,fontWeight:activeFilter===f?700:500,fontFamily:uf,background:activeFilter===f?A.al:M.surfMid,color:activeFilter===f?A.a:M.textC,border:`1px solid ${activeFilter===f?A.a+"40":M.divider}`,transition:"all .15s" }}>{f}</div>
      ))}
      <div style={{ padding:"4px 10px",borderRadius:12,cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:uf,color:A.a,border:`1px dashed ${A.a}40` }}>+ Save View</div>
    </div>
  );

  // ─── FILTER BAR ───────────────────────────────────────
  const FilterBar = () => (
    <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
      {[{label:"Status",value:"Open"},{label:"Type",value:"Trim"}].map((f,i) => (
        <div key={i} style={{ display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:6,fontSize:10,fontFamily:uf,background:A.al,color:A.a,border:`1px solid ${A.a}30` }}>
          <span style={{ fontWeight:400,color:M.textC }}>{f.label}:</span>
          <span style={{ fontWeight:700 }}>{f.value}</span>
          <span style={{ cursor:"pointer",fontWeight:900,fontSize:12 }}>✕</span>
        </div>
      ))}
      <div style={{ fontSize:10,color:A.a,cursor:"pointer",fontFamily:uf,fontWeight:600 }}>+ Filter</div>
    </div>
  );

  // ─── TABLE VIEW ───────────────────────────────────────
  const TableView = () => (
    <div style={{ borderRadius:8,border:`1px solid ${M.divider}`,overflow:"hidden" }}>
      <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:uf }}>
        <thead><tr style={{ background:M.tblHead }}>
          {["PO Code","Date","Supplier","Type","Amount","Status","Season"].map(h => (
            <th key={h} style={{ padding:"8px 12px",textAlign:"left",fontSize:9,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:.5,borderBottom:`1px solid ${M.divider}` }}>{h} ↕</th>
          ))}
        </tr></thead>
        <tbody>{PO_DATA.map((po,i) => (
          <tr key={i} onClick={() => setSelectedPO(po)} style={{ background:i%2===0?M.tblEven:M.tblOdd,cursor:"pointer",transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?M.tblEven:M.tblOdd}>
            <td style={{ padding:"7px 12px",...mono,color:A.a,fontSize:11 }}>{po.code}</td>
            <td style={{ padding:"7px 12px",...mono,fontSize:11,color:M.textB }}>{po.date}</td>
            <td style={{ padding:"7px 12px",fontWeight:600,color:M.textA }}>{po.supplier}</td>
            <td style={{ padding:"7px 12px",color:M.textB }}>{po.type}</td>
            <td style={{ padding:"7px 12px",...mono,fontSize:11,color:M.textA,textAlign:"right" }}>{fmt(po.amount)}</td>
            <td style={{ padding:"7px 12px" }}><StatusBadge status={po.status} small/></td>
            <td style={{ padding:"7px 12px",...mono,fontSize:10,color:M.textC }}>{po.season}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  // ─── KANBAN VIEW ──────────────────────────────────────
  const KanbanView = () => {
    const groups = Object.entries(STATUS_GROUPS);
    return (
      <div style={{ display:"flex",gap:12,overflow:"auto",paddingBottom:8 }}>
        {groups.map(([group,statuses]) => (
          <div key={group} style={{ flex:1,minWidth:180 }}>
            <div style={{ fontSize:8,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:1,fontFamily:uf,marginBottom:6 }}>{group}</div>
            {statuses.map(status => {
              const cards = PO_DATA.filter(p => p.status === status);
              return cards.length > 0 && (
                <div key={status} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6 }}>
                    <span style={{ width:8,height:8,borderRadius:4,background:STATUS_COLORS[status] }}/>
                    <span style={{ fontSize:10,fontWeight:800,color:STATUS_COLORS[status],fontFamily:uf }}>{status}</span>
                    <span style={{ fontSize:9,color:M.textD,fontFamily:df }}>({cards.length})</span>
                  </div>
                  {cards.map((po,i) => (
                    <div key={i} onClick={() => setSelectedPO(po)} style={{ background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",borderLeft:`3px solid ${STATUS_COLORS[status]}`,transition:"box-shadow .15s" }} onMouseEnter={e=>e.currentTarget.style.boxShadow=M.shadow} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                        <span style={{ ...mono,fontSize:11,color:A.a }}>{po.code}</span>
                        <span style={{ ...mono,fontSize:10,color:M.textA,fontWeight:700 }}>{fmt(po.amount)}</span>
                      </div>
                      <div style={{ fontSize:11,fontWeight:600,color:M.textA,fontFamily:uf,marginBottom:2 }}>{po.supplier}</div>
                      <div style={{ display:"flex",justifyContent:"space-between" }}>
                        <span style={{ fontSize:9,color:M.textC,fontFamily:uf }}>{po.type}</span>
                        <span style={{ fontSize:9,color:M.textD,fontFamily:df }}>{po.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ─── CALENDAR VIEW ────────────────────────────────────
  const CalendarView = () => {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const weeks = [[10,11,12,13,14,15,16],[17,18,19,20,21,22,23]];
    const poByDate = { 15:[PO_DATA[0]], 18:[PO_DATA[1]], 8:[PO_DATA[2]], 12:[PO_DATA[3]], 22:[PO_DATA[4]], 10:[PO_DATA[5]], 17:[PO_DATA[6]], 11:[PO_DATA[8]], 16:[PO_DATA[9]] };
    return (
      <div style={{ borderRadius:8,border:`1px solid ${M.divider}`,overflow:"hidden" }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)" }}>
          {days.map(d => <div key={d} style={{ padding:"8px 4px",textAlign:"center",fontSize:9,fontWeight:900,color:M.textD,background:M.tblHead,borderBottom:`1px solid ${M.divider}`,fontFamily:uf,textTransform:"uppercase" }}>{d}</div>)}
          {weeks.flat().map(day => (
            <div key={day} style={{ minHeight:72,padding:4,borderBottom:`1px solid ${M.divider}`,borderRight:`1px solid ${M.divider}`,background:M.surfHigh }}>
              <div style={{ fontSize:10,fontWeight:700,color:day===18?A.a:M.textC,fontFamily:df,marginBottom:3 }}>{day}</div>
              {(poByDate[day]||[]).map((po,i) => (
                <div key={i} onClick={() => setSelectedPO(po)} style={{ fontSize:8,padding:"2px 4px",borderRadius:3,background:`${STATUS_COLORS[po.status]}18`,color:STATUS_COLORS[po.status],fontWeight:700,fontFamily:df,cursor:"pointer",marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{po.code}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── COLLAPSIBLE SECTION ──────────────────────────────
  const CollSection = ({ id,icon,title,defaultOpen,children }) => {
    const isCollapsed = collSections[id] ?? !defaultOpen;
    return (
      <div style={{ marginBottom:8 }}>
        <div onClick={() => setCollSections(p => ({...p,[id]:!isCollapsed}))} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:M.surfMid,borderRadius:6,cursor:"pointer",userSelect:"none" }}>
          <span style={{ fontSize:10,color:M.textC,fontFamily:df,transition:"transform .2s",transform:isCollapsed?"rotate(-90deg)":"rotate(0)" }}>▼</span>
          <span style={{ fontSize:12 }}>{icon}</span>
          <span style={{ fontSize:11,fontWeight:800,color:M.textA,fontFamily:uf }}>{title}</span>
        </div>
        {!isCollapsed && <div style={{ padding:"10px 14px",background:M.surfHigh,borderRadius:"0 0 6px 6px",border:`1px solid ${M.divider}`,borderTop:"none" }}>{children}</div>}
      </div>
    );
  };

  // ─── FIELD DISPLAY ────────────────────────────────────
  const Field = ({ label,value,isMono,accent }) => (
    <div style={{ marginBottom:10 }}>
      <div style={lbl}>{label}</div>
      <div style={{ fontSize:12,fontWeight:600,color:accent?A.a:M.textA,fontFamily:isMono?df:uf }}>{value}</div>
    </div>
  );

  // ─── LINKED DATABASE VIEW ─────────────────────────────
  const LinkedDBView = ({ id,icon,title,count,columns,rows }) => {
    const exp = linkedExpanded[id] ?? true;
    return (
      <div style={{ marginBottom:10,border:`1px solid ${M.divider}`,borderRadius:8,overflow:"hidden" }}>
        <div onClick={() => setLinkedExpanded(p => ({...p,[id]:!exp}))} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:M.surfMid,cursor:"pointer" }}>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ fontSize:10,color:M.textC,fontFamily:df }}>{exp?"▼":"▶"}</span>
            <span style={{ fontSize:12 }}>{icon}</span>
            <span style={{ fontSize:11,fontWeight:700,color:M.textA,fontFamily:uf }}>{title}</span>
            <span style={{ fontSize:10,color:M.textC,fontFamily:df }}>({count})</span>
          </div>
          <span style={{ fontSize:10,color:A.a,fontWeight:600,fontFamily:uf,cursor:"pointer" }}>View All →</span>
        </div>
        {exp && (
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:uf }}>
            <thead><tr style={{ background:M.tblHead }}>
              {columns.map(c => <th key={c} style={{ padding:"6px 10px",textAlign:"left",fontSize:8,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:.3,borderBottom:`1px solid ${M.divider}` }}>{c}</th>)}
            </tr></thead>
            <tbody>{rows.map((r,i) => (
              <tr key={i} style={{ background:i%2===0?M.tblEven:M.tblOdd,cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?M.tblEven:M.tblOdd}>
                {Object.values(r).map((v,j) => <td key={j} style={{ padding:"5px 10px",color:j===0?A.a:M.textB,fontFamily:j===0?df:uf,fontWeight:j===0?600:400,fontSize:11 }}>{v}</td>)}
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    );
  };

  // ─── RECORD DETAIL VIEW ───────────────────────────────
  const RecordDetail = () => {
    const po = selectedPO;
    return (
      <div style={{ padding:16,overflow:"auto",height:"100%" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span onClick={() => setSelectedPO(null)} style={{ fontSize:18,cursor:"pointer",color:M.textC }}>←</span>
            <span style={{ fontSize:16,fontWeight:900,fontFamily:df,color:A.a }}>{po.code}</span>
            <span style={{ fontSize:13,fontWeight:600,color:M.textB,fontFamily:uf }}>— {po.supplier}</span>
            <StatusBadge status={po.status}/>
          </div>
          <div style={{ display:"flex",gap:6 }}>
            {/* ★ Context help button */}
            <span style={{ fontSize:14,cursor:"pointer",color:M.textC,opacity:.7 }} onClick={() => { setShowHelp(true); setHelpPage(HELP_PAGES.find(p => p.id==="HLP-004")); }} title="Help: Purchase Orders">❓</span>
            <span style={{ fontSize:18,cursor:"pointer" }} title="Star this record">☆</span>
            <span style={{ fontSize:16,cursor:"pointer" }}>🖨️</span>
            <span style={{ fontSize:16,cursor:"pointer" }}>📤</span>
          </div>
        </div>

        {/* Rollup Summary Cards */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14 }}>
          {[
            {icon:"📥",label:"GRN RECEIVED",value:"2 of 3",color:"#0078D4"},
            {icon:"₹",label:"TOTAL VALUE",value:fmt(po.amount),color:"#15803D"},
            {icon:"📅",label:"DELIVERY DUE",value:"20-Feb-2026",color:"#f59e0b"},
            {icon:"📊",label:"QC PASS RATE",value:"92%",color:"#8b5cf6"},
          ].map((c,i) => (
            <div key={i} style={{ background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,padding:"10px 12px",borderLeft:`3px solid ${c.color}` }}>
              <div style={{ fontSize:8,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:.5,fontFamily:uf,marginBottom:4 }}>{c.icon} {c.label}</div>
              <div style={{ fontSize:15,fontWeight:800,color:M.textA,fontFamily:df }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* ★ Configurator Buttons — V7 */}
        <div style={{ display:"flex",gap:6,marginBottom:12 }}>
          <div onClick={() => setShowConfigurator("linkedView")} style={{ padding:"4px 10px",borderRadius:5,fontSize:9,fontWeight:700,fontFamily:uf,color:A.a,border:`1px dashed ${A.a}40`,cursor:"pointer",background:A.al }}>+ Add Linked View</div>
          <div onClick={() => setShowConfigurator("rollup")} style={{ padding:"4px 10px",borderRadius:5,fontSize:9,fontWeight:700,fontFamily:uf,color:A.a,border:`1px dashed ${A.a}40`,cursor:"pointer",background:A.al }}>+ Add Rollup</div>
          <div onClick={() => setShowConfigurator("workflow")} style={{ padding:"4px 10px",borderRadius:5,fontSize:9,fontWeight:700,fontFamily:uf,color:"#0078D4",border:`1px dashed #0078D430`,cursor:"pointer",background:"#0078D408" }}>⚙ Edit Workflow</div>
        </div>

        <CollSection id="docinfo" icon="📋" title="DOCUMENT INFO" defaultOpen>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10 }}>
            <Field label="PO Code" value={po.code} isMono accent/><Field label="Date" value={po.date} isMono/><Field label="Type" value={po.type}/><Field label="Season" value={po.season} isMono/>
          </div>
        </CollSection>
        <CollSection id="supplier" icon="🏭" title="SUPPLIER" defaultOpen>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
            <Field label="Supplier Code" value={po.supplierCode} isMono accent/><Field label="Supplier Name" value={po.supplier}/><Field label="GST No." value="03AABCT1234A1ZA" isMono/>
          </div>
        </CollSection>
        <CollSection id="logistics" icon="📅" title="TERMS & LOGISTICS">
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10 }}>
            <Field label="Payment Terms" value="30 Days"/><Field label="Expected Delivery" value="20-Feb-2026" isMono/><Field label="Freight" value="Supplier"/><Field label="Vehicle No." value="PB-10-AK-4521" isMono/>
          </div>
        </CollSection>
        <CollSection id="pricing" icon="₹" title="PRICING & GST">
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10 }}>
            <Field label="Base Amount" value={fmt(po.amount)} isMono/><Field label="GST %" value="12%" isMono/><Field label="GST Amount" value={fmt(Math.round(po.amount*0.12))} isMono/><Field label="Grand Total" value={fmt(Math.round(po.amount*1.12))} isMono/>
          </div>
        </CollSection>

        {/* Line Items */}
        <div style={{ marginTop:12,marginBottom:12 }}>
          <div style={{ ...lbl,fontSize:10,marginBottom:8 }}>📋 LINE ITEMS ({LINE_ITEMS.length})</div>
          <div style={{ borderRadius:8,border:`1px solid ${M.divider}`,overflow:"hidden" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:uf }}>
              <thead><tr style={{ background:M.tblHead }}>
                {["","#","Item Code","Item Name","Qty","UOM","Rate","GST%","Amount"].map(h => (
                  <th key={h} style={{ padding:"6px 8px",textAlign:h==="Rate"||h==="Amount"||h==="Qty"?"right":"left",fontSize:8,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:.3,borderBottom:`1px solid ${M.divider}` }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{LINE_ITEMS.map((li,i) => (
                <tr key={i} style={{ background:i%2===0?M.tblEven:M.tblOdd }}>
                  <td style={{ padding:"5px 6px",cursor:"grab",color:M.textD,fontSize:12 }}>☰</td>
                  <td style={{ padding:"5px 8px",...mono,fontSize:10,color:M.textC }}>{li.line}</td>
                  <td style={{ padding:"5px 8px",...mono,fontSize:10,color:A.a }}>{li.itemCode}</td>
                  <td style={{ padding:"5px 8px",fontWeight:600,color:M.textA }}>{li.name}</td>
                  <td style={{ padding:"5px 8px",...mono,fontSize:11,textAlign:"right",color:M.textA }}>{li.qty}</td>
                  <td style={{ padding:"5px 8px",fontSize:10,color:M.textC }}>{li.uom}</td>
                  <td style={{ padding:"5px 8px",...mono,fontSize:11,textAlign:"right",color:M.textA }}>{fmt(li.rate)}</td>
                  <td style={{ padding:"5px 8px",...mono,fontSize:10,textAlign:"right",color:M.textC }}>{li.gst}%</td>
                  <td style={{ padding:"5px 8px",...mono,fontSize:11,textAlign:"right",fontWeight:700,color:M.textA }}>{fmt(li.qty * li.rate)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        {/* LINKED DB VIEWS */}
        <div style={{ ...lbl,fontSize:10,marginBottom:8,marginTop:16 }}>🔗 LINKED DATABASE VIEWS</div>
        <LinkedDBView id="grn" icon="📥" title="GOODS RECEIPTS" count={3} columns={["GRN Code","Date","Qty","QC","Status"]} rows={GRN_DATA.map(g => ({ code:g.code,date:g.date,qty:g.qty,qc:g.qc,status:g.status }))}/>
        <LinkedDBView id="isr" icon="🧵" title="ITEMS SUPPLIED" count={3} columns={["Item Code","Name","Rate","UOM","Priority"]} rows={ISR_DATA.map(r => ({ code:r.itemCode,name:r.name,rate:r.rate,uom:r.uom,priority:r.priority }))}/>

        {/* COMMENTS */}
        <div style={{ marginTop:12 }}>
          <div onClick={() => setCommentsExpanded(!commentsExpanded)} style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",marginBottom:8 }}>
            <span style={{ fontSize:10,color:M.textC,fontFamily:df }}>{commentsExpanded?"▼":"▶"}</span>
            <span style={{ ...lbl,marginBottom:0 }}>💬 COMMENTS ({COMMENTS.length})</span>
          </div>
          {commentsExpanded && (
            <div style={{ border:`1px solid ${M.divider}`,borderRadius:8,overflow:"hidden" }}>
              {COMMENTS.map((c,i) => (
                <div key={i} style={{ padding:"10px 14px",borderBottom:`1px solid ${M.divider}`,background:M.surfHigh }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                    <div style={{ width:24,height:24,borderRadius:12,background:i===0?A.a:i===1?"#0078D4":"#15803D",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,fontFamily:uf }}>{c.avatar}</div>
                    <span style={{ fontSize:11,fontWeight:700,color:M.textA,fontFamily:uf }}>{c.author}</span>
                    <span style={{ fontSize:9,color:M.textD,fontFamily:df }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize:12,color:M.textB,fontFamily:uf,paddingLeft:32 }}>{c.text.split("@saurav").map((part,j) => j > 0 ? <span key={j}><span style={{ color:A.a,fontWeight:700 }}>@saurav</span>{part}</span> : part)}</div>
                </div>
              ))}
              <div style={{ padding:"10px 14px",display:"flex",gap:8,background:M.surfMid }}>
                <input placeholder="Type a comment... @mention" style={{ flex:1,padding:"8px 12px",borderRadius:6,border:`1.5px solid ${M.divider}`,background:M.inputBg,fontSize:12,fontFamily:uf,color:M.textA,outline:"none" }} onFocus={e => e.target.style.borderColor=A.a} onBlur={e => e.target.style.borderColor=M.divider}/>
                <div style={{ padding:"8px 16px",borderRadius:6,background:A.a,color:A.tx,fontSize:11,fontWeight:700,fontFamily:uf,cursor:"pointer",display:"flex",alignItems:"center" }}>Send ↵</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── MODULE LIST VIEW ─────────────────────────────────
  const ModuleListView = () => (
    <div style={{ padding:16,overflow:"auto",height:"100%" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:16 }}>📦</span>
          <span style={{ fontSize:16,fontWeight:900,color:M.textA,fontFamily:uf }}>Purchase Orders</span>
          <span style={{ ...mono,fontSize:11,color:M.textC }}>({PO_DATA.length})</span>
          {/* ★ Contextual help icon */}
          <span style={{ fontSize:12,cursor:"pointer",color:M.textD }} onClick={() => { setShowHelp(true); setHelpPage(HELP_PAGES.find(p=>p.id==="HLP-004")); }} title="Help: Purchase Orders">❓</span>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <ViewSwitcher/>
          <div onClick={() => setShowTemplate(true)} style={{ padding:"6px 16px",borderRadius:6,background:A.a,color:A.tx,fontSize:11,fontWeight:700,fontFamily:uf,cursor:"pointer" }}>+ New PO</div>
        </div>
      </div>
      <div style={{ marginBottom:10 }}><SavedFilterTabs/></div>
      <div style={{ marginBottom:12 }}><FilterBar/></div>
      {view === "table" && <TableView/>}
      {view === "kanban" && <KanbanView/>}
      {view === "calendar" && <CalendarView/>}
      {view === "gallery" && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
          {PO_DATA.slice(0,6).map((po,i) => (
            <div key={i} onClick={() => setSelectedPO(po)} style={{ background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:10,padding:14,cursor:"pointer",borderTop:`3px solid ${STATUS_COLORS[po.status]}` }} onMouseEnter={e=>e.currentTarget.style.boxShadow=M.shadow} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <span style={{ ...mono,fontSize:12,color:A.a }}>{po.code}</span>
                <StatusBadge status={po.status} small/>
              </div>
              <div style={{ fontSize:13,fontWeight:700,color:M.textA,fontFamily:uf,marginBottom:4 }}>{po.supplier}</div>
              <div style={{ display:"flex",justifyContent:"space-between" }}>
                <span style={{ fontSize:10,color:M.textC,fontFamily:uf }}>{po.type} · {po.season}</span>
                <span style={{ ...mono,fontSize:13,fontWeight:700,color:M.textA }}>{fmt(po.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── CTRL+K PALETTE ───────────────────────────────────
  const CtrlKPalette = () => showCtrlK && (
    <div style={{ position:"fixed",inset:0,zIndex:900,display:"flex",justifyContent:"center",paddingTop:"16vh" }} onClick={() => setShowCtrlK(false)}>
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(3px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{ width:540,maxHeight:420,background:M.dropBg,borderRadius:12,border:`1px solid ${M.divider}`,boxShadow:"0 24px 60px rgba(0,0,0,.35)",zIndex:901,overflow:"hidden" }}>
        <div style={{ padding:"14px 16px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:16 }}>🔍</span>
          <input autoFocus placeholder="Search modules, actions, records, settings…" style={{ flex:1,border:"none",background:"transparent",fontSize:14,fontFamily:uf,color:M.textA,outline:"none" }}/>
          <span style={{ ...mono,fontSize:9,background:M.badgeBg,padding:"2px 6px",borderRadius:3,color:M.badgeTx }}>ESC</span>
        </div>
        <div style={{ padding:8,overflow:"auto",maxHeight:340 }}>
          <div style={{ ...lbl,padding:"4px 8px" }}>MODULES</div>
          {[{icon:"📦",label:"Procurement",sub:"PO · GRN · Returns"},{icon:"🏭",label:"Production",sub:"Work Orders · BOM"},{icon:"📊",label:"Inventory",sub:"Stock · Movements"}].map((m,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,cursor:"pointer",background:i===0?A.al:"transparent",borderLeft:i===0?`3px solid ${A.a}`:"3px solid transparent" }} onMouseEnter={e=>{if(i!==0)e.currentTarget.style.background=M.hoverBg}} onMouseLeave={e=>{if(i!==0)e.currentTarget.style.background="transparent"}}>
              <span style={{ fontSize:14 }}>{m.icon}</span>
              <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:i===0?A.a:M.textA,fontFamily:uf }}>{m.label}</div><div style={{ fontSize:9,color:M.textC }}>{m.sub}</div></div>
              <span style={{ fontSize:14,cursor:"pointer",opacity:.5 }}>☆</span>
              {i===0 && <span style={{ ...mono,fontSize:9,background:M.badgeBg,padding:"1px 5px",borderRadius:3,color:M.badgeTx }}>↵</span>}
            </div>
          ))}
          <div style={{ ...lbl,padding:"8px 8px 4px" }}>QUICK ACTIONS</div>
          {[{icon:"➕",label:"New Purchase Order",sub:"Procurement → PO"},{icon:"📥",label:"New GRN",sub:"Procurement → GRN"},{icon:"❓",label:"Open Help",sub:"? or click Help button"}].map((a,i) => (
            <div key={i} onClick={() => { if(i===2) { setShowCtrlK(false); setShowHelp(true); }}} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:14 }}>{a.icon}</span>
              <div><div style={{ fontSize:12,fontWeight:600,color:M.textA,fontFamily:uf }}>{a.label}</div><div style={{ fontSize:9,color:M.textC }}>{a.sub}</div></div>
              <div style={{ flex:1 }}/><span style={{ fontSize:14,cursor:"pointer",opacity:.5 }}>☆</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── TEMPLATE PICKER ──────────────────────────────────
  const TemplatePicker = () => showTemplate && (
    <div style={{ position:"fixed",inset:0,zIndex:900,display:"flex",justifyContent:"center",paddingTop:"20vh" }} onClick={() => setShowTemplate(false)}>
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(2px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{ width:440,background:M.dropBg,borderRadius:12,border:`1px solid ${M.divider}`,boxShadow:"0 20px 50px rgba(0,0,0,.3)",zIndex:901,overflow:"hidden" }}>
        <div style={{ padding:"16px 20px",borderBottom:`1px solid ${M.divider}` }}>
          <div style={{ fontSize:14,fontWeight:900,color:M.textA,fontFamily:uf }}>📋 Choose Template</div>
          <div style={{ fontSize:11,color:M.textC,fontFamily:uf,marginTop:2 }}>Select a template to pre-fill your new PO</div>
        </div>
        <div style={{ padding:12 }}>
          {TEMPLATES.map((t,i) => (
            <div key={i} onClick={() => setShowTemplate(false)} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:8,cursor:"pointer",marginBottom:4,border:`1px solid ${M.divider}` }} onMouseEnter={e=>{e.currentTarget.style.background=A.al;e.currentTarget.style.borderColor=A.a+"40"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=M.divider}}>
              <span style={{ fontSize:22 }}>{t.icon}</span>
              <div><div style={{ fontSize:12,fontWeight:700,color:M.textA,fontFamily:uf }}>{t.name}</div><div style={{ fontSize:10,color:M.textC,fontFamily:uf }}>{t.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── NOTIFICATION PANEL ───────────────────────────────
  const NotifPanel = () => showNotif && (
    <div style={{ position:"absolute",top:48,right:100,width:380,background:M.dropBg,borderRadius:10,border:`1px solid ${M.divider}`,boxShadow:"0 16px 48px rgba(0,0,0,.25)",zIndex:500,overflow:"hidden" }}>
      <div style={{ padding:"12px 16px",borderBottom:`1px solid ${M.divider}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:13,fontWeight:900,color:M.textA,fontFamily:uf }}>🔔 Notifications</span>
        <span style={{ fontSize:10,color:A.a,fontWeight:600,fontFamily:uf,cursor:"pointer" }}>Mark all read</span>
      </div>
      {NOTIFICATIONS.map((n,i) => {
        const colors = { action:"#ef4444",warning:"#f59e0b",info:"#0078D4" };
        return (
          <div key={i} style={{ padding:"10px 16px",borderBottom:`1px solid ${M.divider}`,borderLeft:`3px solid ${colors[n.type]}`,background:n.read?M.surfHigh:`${colors[n.type]}08` }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
              <span style={{ fontSize:11,fontWeight:n.read?600:800,color:M.textA,fontFamily:uf }}>{n.title}</span>
              {!n.read && <span style={{ width:6,height:6,borderRadius:3,background:colors[n.type] }}/>}
            </div>
            <div style={{ fontSize:10,color:M.textC,fontFamily:uf }}>{n.detail}</div>
            <div style={{ fontSize:9,color:M.textD,fontFamily:df,marginTop:3 }}>{n.time}</div>
            {n.type === "action" && (
              <div style={{ display:"flex",gap:6,marginTop:6 }}>
                <div style={{ padding:"3px 10px",borderRadius:4,background:"#15803D",color:"#fff",fontSize:9,fontWeight:700,fontFamily:uf,cursor:"pointer" }}>✅ Approve</div>
                <div style={{ padding:"3px 10px",borderRadius:4,background:"#ef4444",color:"#fff",fontSize:9,fontWeight:700,fontFamily:uf,cursor:"pointer" }}>❌ Reject</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── ★ HELP PANEL — NEW V7 ────────────────────────────
  const HelpPanel = () => {
    if (!showHelp) return null;
    const filtered = helpSearch ? HELP_PAGES.filter(p => (p.title+p.tags+p.content).toLowerCase().includes(helpSearch.toLowerCase())) : HELP_PAGES;
    const contextual = HELP_PAGES.filter(p => p.module === "Procurement" || p.module === "All");
    const cats = HELP_CATEGORIES.filter(c => filtered.some(p => p.category === c));

    // Simple markdown renderer
    const renderMD = (md) => {
      const lines = md.split("\n");
      return lines.map((line, i) => {
        if (line.startsWith("## ")) return <div key={i} style={{ fontSize:15,fontWeight:900,color:M.textA,fontFamily:uf,marginBottom:8,marginTop:i>0?12:0 }}>{line.slice(3)}</div>;
        if (line.startsWith("### ")) return <div key={i} style={{ fontSize:12,fontWeight:800,color:M.textA,fontFamily:uf,marginBottom:4,marginTop:8 }}>{line.slice(4)}</div>;
        if (line.startsWith("| ") && line.includes("|")) {
          const cells = line.split("|").filter(c => c.trim()).map(c => c.trim());
          if (cells.every(c => /^[-:]+$/.test(c))) return null;
          const isHeader = lines[i+1]?.includes("---");
          return <div key={i} style={{ display:"flex",gap:0 }}>{cells.map((c,j) => <div key={j} style={{ flex:1,padding:"3px 6px",fontSize:10,fontWeight:isHeader?800:400,fontFamily:isHeader?uf:uf,color:isHeader?M.textA:M.textB,background:isHeader?M.tblHead:"transparent",borderBottom:`1px solid ${M.divider}` }}>{c.replace(/\*\*/g,"")}</div>)}</div>;
        }
        if (line.startsWith("```")) return <div key={i} style={{ height:2 }}/>;
        if (line.startsWith("- ") || line.match(/^\d+\.\s/)) {
          const bullet = line.startsWith("- ");
          const text = bullet ? line.slice(2) : line.replace(/^\d+\.\s/, "");
          return <div key={i} style={{ fontSize:11,color:M.textB,fontFamily:uf,paddingLeft:12,marginBottom:3 }}>{bullet?"•":"→"} {text.split("**").map((s,si) => si%2===1?<b key={si} style={{color:M.textA}}>{s}</b>:s)}</div>;
        }
        if (line.trim() === "") return <div key={i} style={{ height:4 }}/>;
        return <div key={i} style={{ fontSize:11,color:M.textB,fontFamily:uf,marginBottom:4 }}>{line.split("**").map((s,si) => si%2===1?<b key={si} style={{color:M.textA}}>{s}</b>:s)}</div>;
      });
    };

    return (
      <div style={{ width:420,height:"100%",background:M.surfHigh,borderLeft:`1px solid ${M.divider}`,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"-4px 0 20px rgba(0,0,0,.1)",zIndex:300 }}>
        {/* Header */}
        <div style={{ padding:"12px 16px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:M.shellBg }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            {helpPage && <span onClick={() => setHelpPage(null)} style={{ cursor:"pointer",fontSize:14,color:M.textC }}>←</span>}
            <span style={{ fontSize:14 }}>📖</span>
            <span style={{ fontSize:13,fontWeight:900,color:M.textA,fontFamily:uf }}>{helpPage ? helpPage.title : "Help & Instructions"}</span>
          </div>
          <span onClick={() => { setShowHelp(false); setHelpPage(null); }} style={{ cursor:"pointer",fontSize:16,color:M.textC,fontWeight:900 }}>✕</span>
        </div>

        {helpPage ? (
          /* ★ HELP PAGE RENDERER */
          <div style={{ flex:1,overflow:"auto",padding:16 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:12 }}>
              <span style={{ fontSize:18 }}>{helpPage.icon}</span>
              <div>
                <div style={{ fontSize:9,fontWeight:800,color:A.a,fontFamily:uf,textTransform:"uppercase",letterSpacing:.5 }}>{helpPage.category}</div>
                <div style={{ fontSize:8,color:M.textD,fontFamily:df }}>{helpPage.id} · {helpPage.audience}</div>
              </div>
            </div>
            {renderMD(helpPage.content)}
          </div>
        ) : (
          /* ★ HELP INDEX */
          <div style={{ flex:1,overflow:"auto" }}>
            {/* Search */}
            <div style={{ padding:"10px 16px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:6,border:`1.5px solid ${helpSearch?A.a:M.divider}`,background:M.inputBg,transition:"border .2s" }}>
                <span style={{ fontSize:13 }}>🔍</span>
                <input value={helpSearch} onChange={e => setHelpSearch(e.target.value)} placeholder="Search help…" style={{ flex:1,border:"none",background:"transparent",fontSize:12,fontFamily:uf,color:M.textA,outline:"none" }}/>
                {helpSearch && <span onClick={() => setHelpSearch("")} style={{ cursor:"pointer",fontSize:12,color:M.textD }}>✕</span>}
              </div>
            </div>

            {/* Contextual help — shows when not searching */}
            {!helpSearch && (
              <div style={{ padding:"0 16px 8px" }}>
                <div style={{ background:`${A.a}08`,border:`1px solid ${A.a}20`,borderRadius:8,padding:"8px 12px" }}>
                  <div style={{ fontSize:9,fontWeight:800,color:A.a,fontFamily:uf,marginBottom:6 }}>💡 RELEVANT TO THIS PAGE</div>
                  {contextual.filter(p=>p.module==="Procurement").map(p => (
                    <div key={p.id} onClick={() => setHelpPage(p)} style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 6px",borderRadius:4,cursor:"pointer",marginBottom:2 }} onMouseEnter={e=>e.currentTarget.style.background=A.al} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontSize:12 }}>{p.icon}</span>
                      <span style={{ fontSize:11,fontWeight:600,color:M.textA,fontFamily:uf }}>{p.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {cats.map(cat => {
              const pages = filtered.filter(p => p.category === cat);
              const isCol = helpCollapsed[cat] ?? false;
              return (
                <div key={cat} style={{ marginBottom:4 }}>
                  <div onClick={() => setHelpCollapsed(p => ({...p,[cat]:!isCol}))} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 16px",cursor:"pointer",background:M.surfMid }}>
                    <span style={{ fontSize:9,color:M.textC,fontFamily:df }}>{isCol?"▶":"▼"}</span>
                    <span style={{ fontSize:11,fontWeight:800,color:M.textA,fontFamily:uf }}>{cat}</span>
                    <span style={{ fontSize:9,color:M.textD,fontFamily:df }}>({pages.length})</span>
                  </div>
                  {!isCol && pages.map(p => (
                    <div key={p.id} onClick={() => setHelpPage(p)} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 16px 7px 32px",cursor:"pointer",borderBottom:`1px solid ${M.divider}08` }} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontSize:13 }}>{p.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11,fontWeight:600,color:M.textA,fontFamily:uf }}>{p.title}</div>
                        <div style={{ fontSize:8,color:M.textD,fontFamily:df }}>{p.id} · {p.audience}</div>
                      </div>
                      <span style={{ fontSize:10,color:M.textD }}>→</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding:"8px 16px",borderTop:`1px solid ${M.divider}`,background:M.surfMid }}>
          <div style={{ fontSize:9,color:M.textD,fontFamily:uf,textAlign:"center" }}>CC ERP Help · 13 pages · Press <b>?</b> to toggle · <span style={{ color:A.a,cursor:"pointer" }}>Feedback</span></div>
        </div>
      </div>
    );
  };

  // ─── ★ CONFIGURATOR MODALS — NEW V7 ──────────────────
  const ConfiguratorModal = () => {
    if (!showConfigurator) return null;
    const close = () => setShowConfigurator(null);

    // Embedded View Configurator
    if (showConfigurator === "linkedView") return (
      <div style={{ position:"fixed",inset:0,zIndex:900,display:"flex",justifyContent:"center",paddingTop:"14vh" }} onClick={close}>
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(3px)" }}/>
        <div onClick={e => e.stopPropagation()} style={{ width:520,background:M.dropBg,borderRadius:12,border:`1px solid ${M.divider}`,boxShadow:"0 24px 60px rgba(0,0,0,.3)",zIndex:901,overflow:"hidden" }}>
          <div style={{ padding:"16px 20px",borderBottom:`1px solid ${M.divider}`,display:"flex",justifyContent:"space-between" }}>
            <div><div style={{ fontSize:14,fontWeight:900,color:M.textA,fontFamily:uf }}>🔗 Add Linked View</div><div style={{ fontSize:10,color:M.textC,fontFamily:uf,marginTop:2 }}>Show related records on this page</div></div>
            <span onClick={close} style={{ cursor:"pointer",fontSize:16,color:M.textC }}>✕</span>
          </div>
          <div style={{ padding:20 }}>
            {[
              { label:"Show data from",val:"GRN_MASTER",type:"select" },
              { label:"Where (FK column)",val:"→ PO Code",type:"select" },
              { label:"Display columns",val:"☑ GRN Code  ☑ Date  ☑ Qty  ☑ QC Status",type:"chips" },
              { label:"Sort by",val:"GRN Date",type:"select" },
              { label:"Max rows",val:"5",type:"select" },
            ].map((f,i) => (
              <div key={i} style={{ marginBottom:14 }}>
                <div style={{ fontSize:9,fontWeight:800,color:M.textD,textTransform:"uppercase",letterSpacing:.5,fontFamily:uf,marginBottom:4 }}>{f.label}</div>
                <div style={{ padding:"8px 12px",borderRadius:6,border:`1.5px solid ${M.divider}`,background:M.inputBg,fontSize:12,fontFamily:f.type==="select"?df:uf,color:M.textA,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <span>{f.val}</span>
                  {f.type==="select" && <span style={{ color:M.textD }}>▼</span>}
                </div>
              </div>
            ))}
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:8 }}>
              <div onClick={close} style={{ padding:"8px 20px",borderRadius:6,border:`1px solid ${M.divider}`,fontSize:11,fontWeight:600,fontFamily:uf,color:M.textC,cursor:"pointer" }}>Cancel</div>
              <div onClick={close} style={{ padding:"8px 20px",borderRadius:6,background:A.a,color:A.tx,fontSize:11,fontWeight:700,fontFamily:uf,cursor:"pointer" }}>Save View</div>
            </div>
          </div>
        </div>
      </div>
    );

    // Rollup Configurator
    if (showConfigurator === "rollup") return (
      <div style={{ position:"fixed",inset:0,zIndex:900,display:"flex",justifyContent:"center",paddingTop:"16vh" }} onClick={close}>
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(3px)" }}/>
        <div onClick={e => e.stopPropagation()} style={{ width:480,background:M.dropBg,borderRadius:12,border:`1px solid ${M.divider}`,boxShadow:"0 24px 60px rgba(0,0,0,.3)",zIndex:901,overflow:"hidden" }}>
          <div style={{ padding:"16px 20px",borderBottom:`1px solid ${M.divider}` }}>
            <div style={{ fontSize:14,fontWeight:900,color:M.textA,fontFamily:uf }}>📊 Add Rollup Card</div>
            <div style={{ fontSize:10,color:M.textC,fontFamily:uf,marginTop:2 }}>Show aggregate data on record detail</div>
          </div>
          <div style={{ padding:20 }}>
            {[
              { label:"Data from",val:"PO_LINE_ITEMS" },
              { label:"Link column",val:"→ PO Code" },
              { label:"Aggregate column",val:"∑ Amount" },
              { label:"Function",val:"SUM" },
              { label:"Display label",val:"Total Line Value" },
              { label:"Format",val:"₹##,###" },
            ].map((f,i) => (
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ fontSize:9,fontWeight:800,color:M.textD,textTransform:"uppercase",letterSpacing:.5,fontFamily:uf,marginBottom:4 }}>{f.label}</div>
                <div style={{ padding:"7px 12px",borderRadius:6,border:`1.5px solid ${M.divider}`,background:M.inputBg,fontSize:12,fontFamily:df,color:M.textA,display:"flex",justifyContent:"space-between" }}><span>{f.val}</span><span style={{ color:M.textD }}>▼</span></div>
              </div>
            ))}
            {/* Preview */}
            <div style={{ background:M.surfMid,border:`1px solid ${M.divider}`,borderRadius:6,padding:"8px 12px",marginBottom:12,borderLeft:"3px solid #15803D" }}>
              <div style={{ fontSize:8,fontWeight:900,color:M.textD,textTransform:"uppercase",fontFamily:uf }}>PREVIEW</div>
              <div style={{ fontSize:14,fontWeight:800,color:M.textA,fontFamily:df }}>₹1,24,500</div>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <div onClick={close} style={{ padding:"8px 20px",borderRadius:6,border:`1px solid ${M.divider}`,fontSize:11,fontWeight:600,fontFamily:uf,color:M.textC,cursor:"pointer" }}>Cancel</div>
              <div onClick={close} style={{ padding:"8px 20px",borderRadius:6,background:A.a,color:A.tx,fontSize:11,fontWeight:700,fontFamily:uf,cursor:"pointer" }}>Save Rollup</div>
            </div>
          </div>
        </div>
      </div>
    );

    // Workflow Editor
    if (showConfigurator === "workflow") return (
      <div style={{ position:"fixed",inset:0,zIndex:900,display:"flex",justifyContent:"center",paddingTop:"8vh" }} onClick={close}>
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(3px)" }}/>
        <div onClick={e => e.stopPropagation()} style={{ width:620,maxHeight:"80vh",background:M.dropBg,borderRadius:12,border:`1px solid ${M.divider}`,boxShadow:"0 24px 60px rgba(0,0,0,.3)",zIndex:901,overflow:"hidden",display:"flex",flexDirection:"column" }}>
          <div style={{ padding:"16px 20px",borderBottom:`1px solid ${M.divider}`,display:"flex",justifyContent:"space-between" }}>
            <div><div style={{ fontSize:14,fontWeight:900,color:M.textA,fontFamily:uf }}>⚙️ Workflow: Procurement-PO</div><div style={{ fontSize:10,color:M.textC,fontFamily:uf,marginTop:2 }}>Admin only · Visual status flow editor</div></div>
            <span onClick={close} style={{ cursor:"pointer",fontSize:16,color:M.textC }}>✕</span>
          </div>
          <div style={{ flex:1,overflow:"auto",padding:20 }}>
            {/* Visual flow */}
            <div style={{ background:M.surfLow,borderRadius:8,padding:16,marginBottom:16,border:`1px solid ${M.divider}` }}>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",justifyContent:"center" }}>
                {WORKFLOW_STATUSES.map((ws,i) => (
                  <div key={ws.code} style={{ display:"flex",alignItems:"center",gap:4 }}>
                    <div style={{ padding:"6px 14px",borderRadius:8,background:`${ws.color}18`,border:`2px solid ${ws.color}`,color:ws.color,fontSize:11,fontWeight:800,fontFamily:uf,cursor:"pointer",position:"relative" }}>
                      {ws.label}
                      <div style={{ fontSize:7,color:M.textD,textAlign:"center",marginTop:2,fontFamily:df }}>{ws.stage}</div>
                    </div>
                    {i < WORKFLOW_STATUSES.length - 1 && ws.next.length > 0 && <span style={{ color:M.textD,fontSize:12 }}>→</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Status list */}
            <div style={{ ...lbl,marginBottom:8 }}>STATUS DEFINITIONS ({WORKFLOW_STATUSES.length})</div>
            {WORKFLOW_STATUSES.map((ws,i) => (
              <div key={ws.code} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,border:`1px solid ${M.divider}`,marginBottom:4,background:M.surfHigh }}>
                <div style={{ width:14,height:14,borderRadius:4,background:ws.color }}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:M.textA,fontFamily:uf }}>{ws.label}</span>
                  <span style={{ fontSize:9,color:M.textD,fontFamily:df,marginLeft:6 }}>{ws.code}</span>
                </div>
                <span style={{ fontSize:9,color:M.textC,fontFamily:uf }}>{ws.stage}</span>
                <span style={{ fontSize:9,color:M.textC,fontFamily:df }}>→ {ws.next.join(", ") || "—"}</span>
                <span style={{ fontSize:9,color:M.textD,fontFamily:uf }}>{ws.role}+</span>
              </div>
            ))}

            <div style={{ display:"flex",gap:8,marginTop:12 }}>
              <div style={{ padding:"6px 14px",borderRadius:6,border:`1px dashed ${A.a}40`,fontSize:10,fontWeight:700,fontFamily:uf,color:A.a,cursor:"pointer" }}>+ Add Status</div>
            </div>
          </div>
          <div style={{ padding:"12px 20px",borderTop:`1px solid ${M.divider}`,display:"flex",justifyContent:"flex-end",gap:8 }}>
            <div onClick={close} style={{ padding:"8px 20px",borderRadius:6,border:`1px solid ${M.divider}`,fontSize:11,fontWeight:600,fontFamily:uf,color:M.textC,cursor:"pointer" }}>Cancel</div>
            <div onClick={close} style={{ padding:"8px 20px",borderRadius:6,background:A.a,color:A.tx,fontSize:11,fontWeight:700,fontFamily:uf,cursor:"pointer" }}>Save Workflow</div>
          </div>
        </div>
      </div>
    );

    return null;
  };

  // ─── STATUS BAR ───────────────────────────────────────
  const StatusBar = () => {
    const total = PO_DATA.reduce((s,p) => s + p.amount, 0);
    const gst = Math.round(total * 0.12);
    return (
      <div style={{ height:28,background:M.statusBg,borderTop:`1px solid ${M.sidebarBd}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",fontSize:10,fontFamily:df,color:M.textC }}>
        <div style={{ display:"flex",gap:16 }}>
          <span>ROWS: <b style={{ color:M.textA }}>{PO_DATA.length}</b></span>
          <span>BASE: <b style={{ color:M.textA }}>{fmt(total)}</b></span>
          <span>GST: <b style={{ color:M.textA }}>{fmt(gst)}</b></span>
          <span>TOTAL: <b style={{ color:A.a }}>{fmt(total + gst)}</b></span>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <span>Procurement · Purchase Orders · {new Date().toLocaleDateString("en-IN")} · {mode}</span>
          <span style={{ color:A.a,fontWeight:600 }}>V7 · 56 sheets · 16 modules</span>
        </div>
      </div>
    );
  };

  // ─── MAIN LAYOUT ──────────────────────────────────────
  return (
    <div style={{ width:"100vw",height:"100vh",display:"flex",flexDirection:"column",background:M.bg,fontFamily:uf,overflow:"hidden" }}>
      <style>{FONTS}</style>
      <ShellBar/>
      <div style={{ flex:1,display:"flex",overflow:"hidden",position:"relative" }}>
        <Sidebar/>
        <div style={{ width:5,background:M.bg,cursor:"col-resize",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ width:2,height:50,background:M.divider,borderRadius:1 }}/>
        </div>
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
            <div style={{ flex:1,overflow:"auto",background:M.bg }}>
              {selectedPO ? <RecordDetail/> : <ModuleListView/>}
            </div>
            {/* ★ HELP PANEL — slides in from right */}
            <HelpPanel/>
          </div>
          <StatusBar/>
        </div>
        <NotifPanel/>
      </div>
      <CtrlKPalette/>
      <TemplatePicker/>
      <ConfiguratorModal/>
    </div>
  );
}
