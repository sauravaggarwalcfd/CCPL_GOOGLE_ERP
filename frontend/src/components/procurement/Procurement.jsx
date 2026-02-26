import { useState, useEffect, useCallback, useRef } from 'react';
import { SEASONS, PO_TYPES, PAY_TERMS, WH_LIST, CAT_ICON, CAT_CLR, ITEM_IMGS } from '../../constants/procurement';
import { PY_MAP } from '../../constants/defaults';
import { uiFF } from '../../constants/fonts';
import { uid, mLine, fmtINR } from '../../utils/helpers';
import ItemSearch from './ItemSearch';
import api from '../../services/api';

// ── Status colors & workflow ──
const STATUS_COLORS = { Draft:"#6b7280", Pending:"#f59e0b", Approved:"#0078D4", Partial:"#8b5cf6", Received:"#15803D", Closed:"#374151", Cancelled:"#ef4444", Accepted:"#15803D" };
const STATUS_GROUPS = { "Not Started":["Draft","Pending"], "In Progress":["Approved","Partial"], "Complete":["Received","Closed","Cancelled","Accepted"] };
const WORKFLOW_STATUSES = [
  { code:"DRAFT", label:"Draft", color:"#6b7280", stage:"Not Started", next:["PENDING","CANCELLED"], role:"Operator" },
  { code:"PENDING", label:"Pending", color:"#f59e0b", stage:"Not Started", next:["APPROVED","CANCELLED"], role:"Manager" },
  { code:"APPROVED", label:"Approved", color:"#0078D4", stage:"In Progress", next:["PARTIAL","RECEIVED","CANCELLED"], role:"Admin" },
  { code:"PARTIAL", label:"Partial", color:"#8b5cf6", stage:"In Progress", next:["RECEIVED","CANCELLED"], role:"Operator" },
  { code:"RECEIVED", label:"Received", color:"#15803D", stage:"Complete", next:["CLOSED"], role:"Manager" },
  { code:"CLOSED", label:"Closed", color:"#374151", stage:"Complete", next:[], role:"Admin" },
  { code:"CANCELLED", label:"Cancelled", color:"#ef4444", stage:"Complete", next:[], role:"Admin" },
];

// ── Help content (13 pages from V7) ──
const HELP_PAGES = [
  { id:"HLP-001",category:"Getting Started",icon:"👋",title:"Welcome to CC ERP",tags:"welcome,intro,overview",audience:"All",module:"All",
    content:"## Welcome to Confidence Clothing ERP\n\nYour complete garment manufacturing management system.\n\n### Quick Start\n1. Use the **sidebar** to navigate between modules\n2. Press **Ctrl+K** to open the command palette\n3. Click any record code (orange) to open its detail view\n4. Use **View Switcher** to toggle Table / Kanban / Calendar / Gallery\n\n### Key Features\n- **Procurement** — PO, GRN, Purchase Returns\n- **Inventory** — Stock levels, movements, reorder alerts\n- **Production** — Work orders, BOM, quality checks\n- **Finance** — Invoices, payments, GST reports" },
  { id:"HLP-002",category:"Getting Started",icon:"⌨️",title:"Keyboard Shortcuts",tags:"shortcuts,keyboard,ctrl-k",audience:"All",module:"All",
    content:"## Keyboard Shortcuts\n\n| Shortcut | Action |\n|---|---|\n| **Ctrl+K** | Command Palette |\n| **Esc** | Close any modal/panel |\n| **←** | Go back from record detail |\n| **N** | New record (list view) |\n| **F** | Focus filter bar |\n| **?** | Open Help panel |" },
  { id:"HLP-003",category:"Getting Started",icon:"🏷️",title:"Understanding Status Badges",tags:"status,workflow,badges,colors",audience:"All",module:"All",
    content:"## Status Badges\n\nEvery record has a colored status badge.\n\n### Stage Groups\n- **Not Started** — Draft (grey), Pending (amber)\n- **In Progress** — Approved (blue), Partial (purple)\n- **Complete** — Received (green), Closed (dark), Cancelled (red)\n\n### Transitions\nStatuses follow a defined workflow. You can only move to the next allowed status." },
  { id:"HLP-004",category:"Module Setup",icon:"📦",title:"Purchase Order — How It Works",tags:"PO,purchase,order,procurement",audience:"All",module:"Procurement",
    content:"## Purchase Orders\n\n### Creating a PO\n1. Click **+ New PO** or choose a template\n2. Select **Supplier** (FK → Supplier Master)\n3. Add **Line Items** — item codes auto-pull UOM, HSN, GST\n4. Set terms, delivery date, payment terms\n5. Submit for approval\n\n### Rollup Cards\n- GRN Received count\n- Total PO value\n- Delivery due date\n- QC pass rate\n\n### Linked Views\n- **Goods Receipts** — all GRNs against this PO\n- **Items Supplied** — supplier rates for items" },
  { id:"HLP-005",category:"Module Setup",icon:"📥",title:"Goods Receipt Note — How It Works",tags:"GRN,goods,receipt",audience:"All",module:"Procurement",
    content:"## Goods Receipt Notes\n\n### Creating a GRN\n1. Select the **PO** being received\n2. Enter vehicle details (DC No, Gate Pass)\n3. For each line: enter **Received Qty**, **Accepted Qty**, **Rejected Qty**\n4. Assign **Batch/Lot** numbers\n5. QC team marks Pass/Fail\n\n### Auto-Updates\n- PO status updates to Partial/Received based on quantities\n- Inventory stock auto-increments on GRN acceptance" },
  { id:"HLP-006",category:"Config Guide",icon:"🔗",title:"How to Add a Linked Database View",tags:"linked,view,embedded,config",audience:"Admin",module:"All",
    content:"## Adding a Linked Database View\n\n### 3 Ways to Configure\n\n**Path 1 — Manual:** Open EMBEDDED_VIEWS → add row\n\n**Path 2 — Ask Claude:** \"Add a linked view on CUSTOMER_MASTER showing their invoices\"\n\n**Path 3 — Admin UI:** Click **+ Add Linked View** on record → fill modal → Save\n\n### Example\nShow all POs for a supplier:\n- Source: PO_MASTER\n- FK: → Supplier Code\n- Display: PO Code, Date, Amount, Status" },
  { id:"HLP-007",category:"Config Guide",icon:"📊",title:"How to Add a Rollup Summary Card",tags:"rollup,summary,card",audience:"Admin",module:"All",
    content:"## Rollup Summary Cards\n\nShow aggregate data at the top of record detail pages.\n\n### Functions Available\n- **COUNT** — number of child records\n- **SUM** — total of a numeric column\n- **AVG** — average value\n- **MIN / MAX** — minimum or maximum\n- **LAST** — most recent value" },
  { id:"HLP-008",category:"Config Guide",icon:"⚙️",title:"How to Edit Status Workflows",tags:"workflow,status,transitions",audience:"Admin",module:"All",
    content:"## Editing Status Workflows\n\n**Admin only** — Managers can view but not edit.\n\n### STATUS_WORKFLOW Sheet\nEach row = one status in a module's workflow.\n\n### Rules\n- Stage Groups enforce flow: Not Started → In Progress → Complete\n- Cannot delete a status if active records use it\n- Color must be a valid hex code" },
  { id:"HLP-009",category:"Config Guide",icon:"📋",title:"How to Create Record Templates",tags:"template,pre-fill",audience:"Admin",module:"All",
    content:"## Creating Record Templates\n\nTemplates pre-fill forms when creating new records.\n\n### Example PO Templates\n- 🧵 Fabric PO — Domestic (Type=Fabric, Terms=30 Days)\n- ✂️ Trim PO — Import (Type=Trim, Currency=USD)\n- 📋 Repeat PO (Copy last PO for same supplier)" },
  { id:"HLP-010",category:"Config Guide",icon:"⚡",title:"How to Set Up Automations",tags:"automation,trigger,rule",audience:"Admin",module:"All",
    content:"## Automation Rules\n\n### Trigger Types\n- **status_change** — when a record changes status\n- **record_create** — when a new record is created\n- **field_update** — when a specific field changes\n- **threshold** — when a value exceeds a limit\n\n### Action Types\n- Send notification to a role\n- Update a field value\n- Create a linked record\n- Send email alert" },
  { id:"HLP-011",category:"Config Guide",icon:"🏗️",title:"New Module Setup Checklist",tags:"module,setup,checklist",audience:"Admin",module:"All",
    content:"## New Module Setup Checklist\n\n1. Define master sheet(s) with R1/R2/R3 structure\n2. Add FK relations to MASTER_RELATIONS\n3. Add status workflow rows\n4. Add rollup configs\n5. Add linked views\n6. Create record templates\n7. Add automation rules\n8. Create help pages\n9. Set up access control\n10. Test all FK dropdowns" },
  { id:"HLP-012",category:"Troubleshooting",icon:"🔄",title:"Data Not Showing / Stale Data",tags:"cache,stale,refresh",audience:"All",module:"All",
    content:"## Data Not Showing\n\n### Quick Fix\n1. **Hard refresh**: Ctrl+Shift+R\n2. **Clear cache**: Menu → Tools → Clear Cache\n3. **Wait 30 seconds** — cache auto-refreshes\n\n### Why It Happens\n- Layer 1 cache caches FK data for 6 hours\n- Cross-file data refreshes at 7am daily" },
  { id:"HLP-013",category:"Troubleshooting",icon:"🔒",title:"Permission Denied",tags:"permission,access,denied",audience:"All",module:"All",
    content:"## Permission Denied\n\n### Check Your Role\n\n| Role | Can Edit | Read Only |\n|---|---|---|\n| Admin | All masters | — |\n| Purchase Mgr | Supplier, ISR | Item masters |\n| Production Mgr | Process, Machine | Item masters |\n| Store Keeper | Warehouse, Bins | Item masters |\n| Accounts | Finance masters | Item masters |" },
];
const HELP_CATEGORIES = ["Getting Started","Module Setup","Config Guide","Troubleshooting"];

// ── Template data ──
const TEMPLATES = [
  { name:"Fabric PO — Domestic", desc:"Type=Fabric, Terms=30 Days, GST=5%", icon:"🧵", prefill:{ type:"Fabric", payTerms:"30 Days Credit" } },
  { name:"Trim PO — Import",     desc:"Type=Trim, Terms=LC, Currency=USD", icon:"✂️", prefill:{ type:"Trim", payTerms:"Against LC" } },
  { name:"Repeat PO from Supplier", desc:"Copy last PO, update quantities", icon:"📋", prefill:{} },
  { name:"Blank PO",             desc:"Empty form, fill everything manually", icon:"📄", prefill:{} },
];

// ── Saved filter tabs ──
const FILTER_TABS = [
  { id:"all", label:"All POs" },
  { id:"draft", label:"Drafts", filter:{ status:"Draft" } },
  { id:"pending", label:"Pending Approval", filter:{ status:"Pending" } },
  { id:"active", label:"Active", filter:{ statuses:["Approved","Partial"] } },
  { id:"completed", label:"Completed", filter:{ statuses:["Received","Closed"] } },
];

const fmt = v => `₹${Number(v||0).toLocaleString("en-IN")}`;

export default function Procurement({ M, A, cfg, fz, dff }) {
  const uff = uiFF(cfg.uiFont);
  const pyV = PY_MAP[cfg.density];

  // ── State ──
  const [view, setView] = useState("table");      // table | kanban | calendar | gallery
  const [sub, setSub] = useState("PO");            // PO | GRN
  const [selectedPO, setSelectedPO] = useState(null);
  const [formMode, setFormMode] = useState(null);  // null | "create" | "edit"
  const [activeTab, setActiveTab] = useState("all");

  // API data
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [poList, setPoList] = useState([]);
  const [grnList, setGrnList] = useState([]);
  const [openPOs, setOpenPOs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Form state
  const [lines, setLines] = useState([mLine(), mLine()]);
  const [supplier, setSupplier] = useState("");
  const [season, setSeason] = useState("SS26");
  const [poType, setPoType] = useState("");
  const [payTerms, setPayTerms] = useState("");
  const [delivDate, setDelivDate] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [openSec, setOpenSec] = useState(["header","lines"]);

  // UI state
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [toastMsg, setToastMsg] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpPage, setHelpPage] = useState(null);
  const [helpSearch, setHelpSearch] = useState("");
  const [helpCollapsed, setHelpCollapsed] = useState({});
  const [showConfigurator, setShowConfigurator] = useState(null);
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [linkedCollapsed, setLinkedCollapsed] = useState({});

  // ── Fetch data ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ir, sr, pr, gr, or] = await Promise.allSettled([
          api.getItems(), api.getSuppliers(), api.getPOList(), api.getGRNList(), api.getOpenPOs(),
        ]);
        if (cancelled) return;
        if (ir.status === "fulfilled" && ir.value) setItems(ir.value);
        if (sr.status === "fulfilled" && sr.value) setSuppliers(sr.value);
        if (pr.status === "fulfilled" && pr.value) setPoList(pr.value);
        if (gr.status === "fulfilled" && gr.value) setGrnList(gr.value);
        if (or.status === "fulfilled" && or.value) setOpenPOs(or.value);
      } catch(e) { console.error("Procurement fetch:", e); }
      finally { if (!cancelled) setDataLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Keyboard: ? for help, Esc to close
  useEffect(() => {
    const h = e => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault(); setShowHelp(v => !v);
      }
      if (e.key === "Escape") { setShowHelp(false); setShowTemplate(false); setShowConfigurator(null); setHelpPage(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const toast = msg => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const toggleSec = id => setOpenSec(o => o.includes(id) ? o.filter(x=>x!==id) : [...o, id]);

  // ── Filter logic ──
  const rawList = sub === "PO" ? poList : grnList;
  const tabFilter = FILTER_TABS.find(t => t.id === activeTab);
  let filtered = rawList.filter(r => {
    if (tabFilter?.filter) {
      if (tabFilter.filter.status && r.status !== tabFilter.filter.status) return false;
      if (tabFilter.filter.statuses && !tabFilter.filter.statuses.includes(r.status)) return false;
    }
    if (filterStatus && r.status !== filterStatus) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (r.id||r.code||"").toLowerCase().includes(q) || (r.supName||r.supplier||"").toLowerCase().includes(q);
    }
    return true;
  });
  if (sortBy) {
    filtered = [...filtered].sort((a,b) => {
      const va = a[sortBy], vb = b[sortBy];
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  // ── Totals for form ──
  const tBase = lines.reduce((s,l) => s + (parseFloat(l.qty)||0)*(parseFloat(l.price)||0)*(1-(parseFloat(l.disc)||0)/100), 0);
  const tGst = lines.reduce((s,l) => { const it=items.find(i=>i.code===l.itemCode); return s+(it?(parseFloat(l.qty)||0)*(parseFloat(l.price)||0)*(1-(parseFloat(l.disc)||0)/100)*(it.gst/100):0); }, 0);

  // ── Styles ──
  const lbl = { fontSize:9, fontWeight:800, color:M.textD, textTransform:"uppercase", letterSpacing:.5, fontFamily:uff, marginBottom:4 };
  const mono = { fontFamily:dff };

  // ── Save PO ──
  const handleSavePO = async () => {
    try {
      const poData = { supplier, type:poType, season, payTerms, delivDate, poDate };
      const lineItems = lines.filter(l => l.itemCode).map(l => ({
        itemCode:l.itemCode, qty:parseFloat(l.qty)||0, rate:parseFloat(l.price)||0, disc:parseFloat(l.disc)||0
      }));
      await api.savePO(poData, lineItems);
      toast("PO saved successfully");
      setFormMode(null);
      const res = await api.getPOList();
      if (res) setPoList(res);
    } catch(e) { toast("Error: " + e.message); }
  };

  // ────────────────────────────────────────────────
  // STATUS BADGE
  // ────────────────────────────────────────────────
  const StatusBadge = ({ status, small }) => {
    const c = STATUS_COLORS[status] || "#6b7280";
    return (
      <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:small?"2px 8px":"3px 10px", borderRadius:20, background:`${c}18`, border:`1px solid ${c}40`, fontSize:small?9:10, fontWeight:800, color:c, fontFamily:uff, letterSpacing:.3 }}>
        <span style={{ width:small?5:6, height:small?5:6, borderRadius:"50%", background:c }}/>
        {status}
      </span>
    );
  };

  // ────────────────────────────────────────────────
  // VIEW SWITCHER
  // ────────────────────────────────────────────────
  const ViewSwitcher = () => (
    <div style={{ display:"flex", gap:2, background:M.surfLow, border:`1px solid ${M.divider}`, borderRadius:6, padding:2 }}>
      {[{id:"table",icon:"☰"},{id:"kanban",icon:"▥"},{id:"calendar",icon:"📅"},{id:"gallery",icon:"▦"}].map(v => (
        <button key={v.id} onClick={() => setView(v.id)} style={{ padding:"4px 10px", border:"none", borderRadius:4, cursor:"pointer", background:view===v.id?A.a:"transparent", color:view===v.id?A.tx:M.textC, fontSize:11, fontWeight:700, fontFamily:uff, transition:"all .15s" }} title={v.id}>{v.icon}</button>
      ))}
    </div>
  );

  // ────────────────────────────────────────────────
  // SAVED FILTER TABS
  // ────────────────────────────────────────────────
  const SavedFilterTabs = () => (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
      {FILTER_TABS.map(t => (
        <button key={t.id} onClick={() => { setActiveTab(t.id); setFilterStatus(null); }} style={{ padding:"4px 12px", borderRadius:20, border:`1px solid ${activeTab===t.id?A.a+"60":M.divider}`, background:activeTab===t.id?A.al:"transparent", color:activeTab===t.id?A.a:M.textC, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:uff, transition:"all .15s" }}>{t.label}</button>
      ))}
    </div>
  );

  // ────────────────────────────────────────────────
  // FILTER BAR
  // ────────────────────────────────────────────────
  const FilterBar = () => {
    const statuses = [...new Set(rawList.map(r => r.status))];
    return (
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, border:`1.5px solid ${searchQ?A.a:M.divider}`, borderRadius:6, padding:"5px 10px", background:M.inputBg, flex:1, maxWidth:260, transition:"border .2s" }}>
          <span style={{ fontSize:13, color:M.textD }}>🔍</span>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={`Search ${sub}s…`} style={{ flex:1, border:"none", background:"transparent", fontSize:12, fontFamily:uff, color:M.textA, outline:"none" }}/>
          {searchQ && <span onClick={()=>setSearchQ("")} style={{ cursor:"pointer", fontSize:11, color:M.textD }}>✕</span>}
        </div>
        <div style={{ display:"flex", gap:3 }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(filterStatus===s?null:s)} style={{ padding:"3px 9px", borderRadius:4, border:`1px solid ${filterStatus===s?STATUS_COLORS[s]+"60":M.divider}`, background:filterStatus===s?`${STATUS_COLORS[s]}14`:"transparent", color:filterStatus===s?STATUS_COLORS[s]:M.textC, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:uff }}>{s}</button>
          ))}
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // TABLE VIEW
  // ────────────────────────────────────────────────
  const TableView = () => {
    const cols = sub === "PO"
      ? [{ k:"id",l:"PO Code",w:130 },{ k:"date",l:"Date",w:95 },{ k:"supName",l:"Supplier" },{ k:"type",l:"Type",w:80 },{ k:"items",l:"Items",w:50,r:true },{ k:"total",l:"Amount",w:110,r:true },{ k:"status",l:"Status",w:100 }]
      : [{ k:"id",l:"GRN Code",w:130 },{ k:"po",l:"PO Ref",w:130 },{ k:"date",l:"Date",w:95 },{ k:"supName",l:"Supplier" },{ k:"recQty",l:"Rec Qty",w:70,r:true },{ k:"status",l:"Status",w:100 }];

    const handleSort = k => { if (sortBy===k) setSortDir(d=>d==="asc"?"desc":"asc"); else { setSortBy(k); setSortDir("asc"); } };

    return (
      <div style={{ overflow:"auto", border:`1px solid ${M.divider}`, borderRadius:8, background:M.surfHigh }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr>{cols.map(c => (
              <th key={c.k} onClick={()=>handleSort(c.k)} style={{ padding:"8px 10px", textAlign:c.r?"right":"left", fontSize:10, fontWeight:900, color:M.textC, fontFamily:uff, letterSpacing:.3, background:M.tblHead, borderBottom:`2px solid ${A.a}50`, cursor:"pointer", whiteSpace:"nowrap", width:c.w }}>
                {c.l} {sortBy===c.k && (sortDir==="asc"?"↑":"↓")}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={cols.length} style={{ padding:40, textAlign:"center", color:M.textD, fontSize:12, fontFamily:uff }}>No {sub}s found</td></tr>
            ) : filtered.map((r,i) => (
              <tr key={r.id||r.code||i} onClick={() => { if (sub==="PO") setSelectedPO(r); }} style={{ cursor:"pointer", background:i%2===0?M.tblEven:M.tblOdd, borderBottom:`1px solid ${M.divider}`, transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?M.tblEven:M.tblOdd}>
                {cols.map(c => (
                  <td key={c.k} style={{ padding:"7px 10px", textAlign:c.r?"right":"left", fontFamily:c.k==="id"||c.k==="po"||c.k==="total"?dff:uff, fontWeight:c.k==="id"?700:400, color:c.k==="id"?A.a:c.k==="total"?M.textA:M.textB, fontSize:12, whiteSpace:"nowrap" }}>
                    {c.k === "status" ? <StatusBadge status={r[c.k]} small/> : c.k === "total" || c.k === "base" ? fmt(r[c.k]) : r[c.k]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // KANBAN VIEW
  // ────────────────────────────────────────────────
  const KanbanView = () => {
    const groups = Object.entries(STATUS_GROUPS);
    return (
      <div style={{ display:"flex", gap:12, overflow:"auto", paddingBottom:8 }}>
        {groups.map(([stage, statuses]) => {
          const cards = filtered.filter(r => statuses.includes(r.status));
          return (
            <div key={stage} style={{ minWidth:260, flex:1, background:M.surfLow, borderRadius:10, border:`1px solid ${M.divider}`, overflow:"hidden" }}>
              <div style={{ padding:"10px 14px", borderBottom:`1px solid ${M.divider}`, background:M.surfMid, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, fontWeight:900, color:M.textA, fontFamily:uff }}>{stage}</span>
                <span style={{ fontSize:10, fontWeight:700, color:M.textC, fontFamily:dff }}>{cards.length}</span>
              </div>
              <div style={{ padding:8, display:"flex", flexDirection:"column", gap:6, maxHeight:"60vh", overflow:"auto" }}>
                {cards.length === 0 ? (
                  <div style={{ padding:20, textAlign:"center", fontSize:10, color:M.textD }}>No items</div>
                ) : cards.map((r,i) => (
                  <div key={r.id||i} onClick={() => { if(sub==="PO") setSelectedPO(r); }} style={{ background:M.surfHigh, border:`1px solid ${M.divider}`, borderRadius:8, padding:"10px 12px", cursor:"pointer", borderLeft:`3px solid ${STATUS_COLORS[r.status]}`, transition:"box-shadow .15s" }} onMouseEnter={e=>e.currentTarget.style.boxShadow=M.shadow} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ ...mono, fontSize:11, fontWeight:700, color:A.a }}>{r.id||r.code}</span>
                      <StatusBadge status={r.status} small/>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:M.textA, fontFamily:uff, marginBottom:4 }}>{r.supName||r.supplier}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:M.textC, fontFamily:uff }}>{r.type||""} · {r.date}</span>
                      {r.total && <span style={{ ...mono, fontSize:12, fontWeight:700, color:M.textA }}>{fmt(r.total)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // CALENDAR VIEW
  // ────────────────────────────────────────────────
  const CalendarView = () => {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let week = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

    const getEntries = d => {
      if (!d) return [];
      const ds = String(d).padStart(2,"0");
      const ms = String(month+1).padStart(2,"0");
      return filtered.filter(r => {
        const rd = r.date || "";
        return rd.includes(`${ds}`) && (rd.includes(`${ms}-`) || rd.includes(` ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month]} `));
      }).slice(0,3);
    };

    return (
      <div style={{ border:`1px solid ${M.divider}`, borderRadius:8, overflow:"hidden", background:M.surfHigh }}>
        <div style={{ padding:"10px 14px", background:M.surfMid, borderBottom:`1px solid ${M.divider}`, textAlign:"center" }}>
          <span style={{ fontSize:13, fontWeight:900, color:M.textA, fontFamily:uff }}>
            {now.toLocaleDateString("en-IN", { month:"long", year:"numeric" })}
          </span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ padding:"6px 0", textAlign:"center", fontSize:9, fontWeight:900, color:M.textD, fontFamily:uff, borderBottom:`1px solid ${M.divider}`, background:M.tblHead }}>{d}</div>
          ))}
          {weeks.flat().map((d,i) => {
            const entries = getEntries(d);
            const isToday = d === now.getDate();
            return (
              <div key={i} style={{ minHeight:72, padding:4, borderRight:i%7<6?`1px solid ${M.divider}`:"none", borderBottom:`1px solid ${M.divider}`, background:d?M.surfHigh:`${M.divider}20` }}>
                {d && (
                  <>
                    <div style={{ fontSize:10, fontWeight:isToday?900:600, color:isToday?A.a:M.textB, fontFamily:dff, marginBottom:2, textAlign:"right", padding:"0 2px" }}>{d}</div>
                    {entries.map((e,j) => (
                      <div key={j} onClick={() => { if(sub==="PO") setSelectedPO(e); }} style={{ padding:"2px 4px", borderRadius:3, background:`${STATUS_COLORS[e.status]}14`, borderLeft:`2px solid ${STATUS_COLORS[e.status]}`, marginBottom:2, cursor:"pointer", fontSize:8, fontWeight:700, color:M.textB, fontFamily:uff, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{e.id||e.code}</div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // GALLERY VIEW
  // ────────────────────────────────────────────────
  const GalleryView = () => (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
      {filtered.slice(0,12).map((r,i) => (
        <div key={r.id||i} onClick={() => { if(sub==="PO") setSelectedPO(r); }} style={{ background:M.surfHigh, border:`1px solid ${M.divider}`, borderRadius:10, padding:14, cursor:"pointer", borderTop:`3px solid ${STATUS_COLORS[r.status]}`, transition:"box-shadow .15s" }} onMouseEnter={e=>e.currentTarget.style.boxShadow=M.shadow} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ ...mono, fontSize:12, color:A.a, fontWeight:700 }}>{r.id||r.code}</span>
            <StatusBadge status={r.status} small/>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:M.textA, fontFamily:uff, marginBottom:4 }}>{r.supName||r.supplier}</div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:10, color:M.textC, fontFamily:uff }}>{r.type||""} · {r.date}</span>
            {r.total && <span style={{ ...mono, fontSize:13, fontWeight:700, color:M.textA }}>{fmt(r.total)}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  // ────────────────────────────────────────────────
  // LINKED DB VIEW (reusable)
  // ────────────────────────────────────────────────
  const LinkedDBView = ({ id, icon, title, count, columns, rows, onConfig }) => {
    const collapsed = linkedCollapsed[id];
    return (
      <div style={{ border:`1px solid ${M.divider}`, borderRadius:8, overflow:"hidden", marginBottom:8 }}>
        <div onClick={() => setLinkedCollapsed(p => ({...p,[id]:!collapsed}))} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:M.surfMid, cursor:"pointer", borderBottom:collapsed?"none":`1px solid ${M.divider}` }}>
          <span style={{ fontSize:9, color:M.textD }}>{collapsed?"▶":"▼"}</span>
          <span style={{ fontSize:12 }}>{icon}</span>
          <span style={{ fontSize:11, fontWeight:800, color:M.textA, fontFamily:uff, flex:1 }}>{title}</span>
          <span style={{ ...mono, fontSize:10, color:M.textC }}>({count})</span>
          {onConfig && <span onClick={e=>{e.stopPropagation();onConfig();}} style={{ fontSize:10, cursor:"pointer", color:M.textD }} title="Configure">⚙️</span>}
        </div>
        {!collapsed && rows.length > 0 && (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>{columns.map(c => (
                <th key={c} style={{ padding:"5px 10px", textAlign:"left", fontSize:9, fontWeight:800, color:M.textD, fontFamily:uff, background:M.tblHead, borderBottom:`1px solid ${M.divider}` }}>{c}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((r,i) => (
                <tr key={i} style={{ background:i%2===0?M.tblEven:M.tblOdd }}>
                  {Object.values(r).map((v,j) => (
                    <td key={j} style={{ padding:"5px 10px", fontSize:11, color:j===0?A.a:M.textB, fontWeight:j===0?700:400, fontFamily:j===0?dff:uff, borderBottom:`1px solid ${M.divider}` }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!collapsed && rows.length === 0 && (
          <div style={{ padding:16, textAlign:"center", fontSize:10, color:M.textD }}>No linked records</div>
        )}
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // COLLAPSIBLE SECTION
  // ────────────────────────────────────────────────
  const Section = ({ id, icon, title, badge, children }) => {
    const isOpen = openSec.includes(id);
    return (
      <div style={{ marginBottom:8 }}>
        <div onClick={() => toggleSec(id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:M.surfMid, borderRadius:isOpen?"8px 8px 0 0":"8px", border:`1px solid ${M.divider}`, cursor:"pointer" }}>
          <span style={{ fontSize:9, color:M.textD }}>{isOpen?"▼":"▶"}</span>
          <span style={{ fontSize:12 }}>{icon}</span>
          <span style={{ fontSize:11, fontWeight:800, color:isOpen?A.a:M.textA, fontFamily:uff, flex:1 }}>{title}</span>
          {badge && <span style={{ fontSize:9, padding:"1px 7px", borderRadius:9, background:M.badgeBg, color:M.textC, fontWeight:700 }}>{badge}</span>}
        </div>
        {isOpen && <div style={{ padding:12, border:`1px solid ${M.divider}`, borderTop:"none", borderRadius:"0 0 8px 8px", background:M.surfHigh }}>{children}</div>}
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // RECORD DETAIL VIEW (Notion-style)
  // ────────────────────────────────────────────────
  const RecordDetail = () => {
    const po = selectedPO;
    if (!po) return null;

    // Rollup data (computed from available data)
    const poGRNs = grnList.filter(g => g.po === (po.id||po.code));
    const rollups = [
      { label:"GRN Received", value:String(poGRNs.length), icon:"📥", color:"#0078D4" },
      { label:"Total PO Value", value:fmt(po.total||po.amount||0), icon:"💰", color:"#15803D" },
      { label:"Line Items", value:String(po.items||0), icon:"📋", color:"#7C3AED" },
      { label:"QC Pass Rate", value:poGRNs.length > 0 ? Math.round(poGRNs.filter(g=>g.status==="Accepted").length/poGRNs.length*100)+"%":"—", icon:"✅", color:"#059669" },
    ];

    // Linked ISR data (mock for demo, real from API)
    const isrRows = items.filter(it => (po.type||"").toLowerCase().includes(it.cat?.toLowerCase()||"")).slice(0,3).map(it => ({
      code:it.code, name:it.name, rate:`₹${it.gst||0}/unit`, uom:it.uom, priority:"Primary"
    }));

    return (
      <div style={{ padding:16, overflow:"auto", height:"100%" }}>
        {/* Back & Header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <button onClick={() => setSelectedPO(null)} style={{ padding:"4px 12px", border:`1px solid ${M.divider}`, borderRadius:6, background:M.surfMid, color:M.textB, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:uff }}>← Back</button>
          <span style={{ ...mono, fontSize:16, fontWeight:900, color:A.a }}>{po.id||po.code}</span>
          <StatusBadge status={po.status}/>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:12, cursor:"pointer", color:M.textD }} onClick={() => { setShowHelp(true); setHelpPage(HELP_PAGES.find(p=>p.id==="HLP-004")); }} title="Help: Purchase Orders">❓</span>
          {/* Config buttons (Admin) */}
          <button onClick={() => setShowConfigurator("linkedView")} style={{ padding:"3px 8px", borderRadius:4, border:`1px dashed ${A.a}40`, fontSize:9, fontWeight:700, color:A.a, cursor:"pointer", fontFamily:uff, background:"transparent" }}>+ Linked View</button>
          <button onClick={() => setShowConfigurator("rollup")} style={{ padding:"3px 8px", borderRadius:4, border:`1px dashed ${A.a}40`, fontSize:9, fontWeight:700, color:A.a, cursor:"pointer", fontFamily:uff, background:"transparent" }}>+ Rollup</button>
          <button onClick={() => setShowConfigurator("workflow")} style={{ padding:"3px 8px", borderRadius:4, border:`1px dashed ${A.a}40`, fontSize:9, fontWeight:700, color:A.a, cursor:"pointer", fontFamily:uff, background:"transparent" }}>⚙ Workflow</button>
        </div>

        {/* ROLLUP CARDS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
          {rollups.map((r,i) => (
            <div key={i} style={{ background:M.surfHigh, border:`1px solid ${M.divider}`, borderRadius:8, padding:"10px 12px", borderLeft:`3px solid ${r.color}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <span style={{ fontSize:13 }}>{r.icon}</span>
                <span style={{ ...lbl, marginBottom:0 }}>{r.label}</span>
              </div>
              <div style={{ ...mono, fontSize:18, fontWeight:900, color:M.textA }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* COLLAPSIBLE SECTIONS */}
        <Section id="header" icon="📦" title="PO Header" badge={`${Object.keys(po).length} fields`}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {[
              { l:"Supplier", v:po.supName||po.supplier },
              { l:"Type", v:po.type },
              { l:"Season", v:po.season },
              { l:"Date", v:po.date },
              { l:"Payment Terms", v:po.payTerms||"30 Days Credit" },
              { l:"Status", v:po.status },
              { l:"Base Amount", v:fmt(po.base||po.amount||0) },
              { l:"GST", v:fmt(po.gst||0) },
              { l:"Total", v:fmt(po.total||po.amount||0) },
            ].map((f,i) => (
              <div key={i}>
                <div style={lbl}>{f.l}</div>
                <div style={{ fontSize:12, fontWeight:600, color:M.textA, fontFamily:f.l.includes("Amount")||f.l==="GST"||f.l==="Total"?dff:uff }}>{f.v||"—"}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="lines" icon="📋" title="Line Items" badge={`${po.items||0} items`}>
          <div style={{ overflow:"auto", border:`1px solid ${M.divider}`, borderRadius:6 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead>
                <tr>{["#","Item Code","Name","Qty","UOM","Rate","GST%","Amount"].map(h => (
                  <th key={h} style={{ padding:"6px 8px", textAlign:["Qty","Rate","GST%","Amount"].includes(h)?"right":"left", fontSize:9, fontWeight:800, color:M.textD, fontFamily:uff, background:M.tblHead, borderBottom:`1px solid ${M.divider}` }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {/* Show demo line items if no real data */}
                {[
                  { line:1, code:"TRM-THD-001", name:"Polyester Thread 40s", qty:500, uom:"CONE", rate:45, gst:12 },
                  { line:2, code:"TRM-LBL-002", name:"Woven Main Label", qty:2000, uom:"PCS", rate:0.80, gst:12 },
                  { line:3, code:"TRM-TAG-001", name:"Hang Tag Printed", qty:1000, uom:"PCS", rate:3.50, gst:18 },
                ].map((l,i) => (
                  <tr key={i} style={{ background:i%2===0?M.tblEven:M.tblOdd }}>
                    <td style={{ padding:"5px 8px", ...mono, fontSize:10, color:M.textD, borderBottom:`1px solid ${M.divider}` }}>{l.line}</td>
                    <td style={{ padding:"5px 8px", ...mono, fontSize:11, color:A.a, fontWeight:700, borderBottom:`1px solid ${M.divider}` }}>{l.code}</td>
                    <td style={{ padding:"5px 8px", fontSize:11, color:M.textB, fontFamily:uff, borderBottom:`1px solid ${M.divider}` }}>{l.name}</td>
                    <td style={{ padding:"5px 8px", ...mono, textAlign:"right", borderBottom:`1px solid ${M.divider}` }}>{l.qty.toLocaleString()}</td>
                    <td style={{ padding:"5px 8px", fontSize:10, color:M.textC, textAlign:"right", borderBottom:`1px solid ${M.divider}` }}>{l.uom}</td>
                    <td style={{ padding:"5px 8px", ...mono, textAlign:"right", borderBottom:`1px solid ${M.divider}` }}>₹{l.rate}</td>
                    <td style={{ padding:"5px 8px", ...mono, textAlign:"right", color:M.textC, borderBottom:`1px solid ${M.divider}` }}>{l.gst}%</td>
                    <td style={{ padding:"5px 8px", ...mono, textAlign:"right", fontWeight:700, borderBottom:`1px solid ${M.divider}` }}>₹{(l.qty*l.rate).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* LINKED DB VIEWS */}
        <div style={{ ...lbl, fontSize:10, marginBottom:8, marginTop:16 }}>🔗 LINKED DATABASE VIEWS</div>
        <LinkedDBView id="grn" icon="📥" title="GOODS RECEIPTS" count={poGRNs.length} columns={["GRN Code","Date","Rec Qty","QC","Status"]}
          rows={poGRNs.map(g => ({ code:g.id||g.code, date:g.date, qty:g.recQty||g.items, qc:g.status==="Accepted"?"✅ Pass":"⚠ Partial", status:g.status }))}
          onConfig={() => setShowConfigurator("linkedView")}
        />
        <LinkedDBView id="isr" icon="🧵" title="ITEMS SUPPLIED" count={isrRows.length} columns={["Item Code","Name","Rate","UOM","Priority"]}
          rows={isrRows}
          onConfig={() => setShowConfigurator("linkedView")}
        />

        {/* COMMENTS */}
        <div style={{ marginTop:12 }}>
          <div onClick={() => setCommentsExpanded(!commentsExpanded)} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", marginBottom:8 }}>
            <span style={{ fontSize:10, color:M.textC }}>{commentsExpanded?"▼":"▶"}</span>
            <span style={{ ...lbl, marginBottom:0 }}>💬 COMMENTS ({comments.length})</span>
          </div>
          {commentsExpanded && (
            <div style={{ border:`1px solid ${M.divider}`, borderRadius:8, overflow:"hidden" }}>
              {comments.length === 0 ? (
                <div style={{ padding:16, textAlign:"center", fontSize:11, color:M.textD }}>No comments yet</div>
              ) : comments.map((c,i) => (
                <div key={i} style={{ padding:"10px 14px", borderBottom:`1px solid ${M.divider}`, background:M.surfHigh }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <div style={{ width:24, height:24, borderRadius:12, background:A.a, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, fontFamily:uff }}>{(c.author||"U")[0]}</div>
                    <span style={{ fontSize:11, fontWeight:700, color:M.textA, fontFamily:uff }}>{c.author||"You"}</span>
                    <span style={{ fontSize:9, color:M.textD }}>{c.time||"just now"}</span>
                  </div>
                  <div style={{ fontSize:12, color:M.textB, fontFamily:uff, paddingLeft:32 }}>{c.text}</div>
                </div>
              ))}
              <div style={{ padding:"10px 14px", display:"flex", gap:8, background:M.surfMid }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Type a comment... @mention" style={{ flex:1, padding:"8px 12px", borderRadius:6, border:`1.5px solid ${M.divider}`, background:M.inputBg, fontSize:12, fontFamily:uff, color:M.textA, outline:"none" }} onFocus={e=>e.target.style.borderColor=A.a} onBlur={e=>e.target.style.borderColor=M.divider} onKeyDown={e => { if (e.key==="Enter" && commentText.trim()) { setComments(p=>[...p,{author:"You",time:"just now",text:commentText}]); setCommentText(""); }}}/>
                <div onClick={() => { if (commentText.trim()) { setComments(p=>[...p,{author:"You",time:"just now",text:commentText}]); setCommentText(""); }}} style={{ padding:"8px 16px", borderRadius:6, background:A.a, color:A.tx, fontSize:11, fontWeight:700, fontFamily:uff, cursor:"pointer", display:"flex", alignItems:"center" }}>Send</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // CREATE/EDIT FORM
  // ────────────────────────────────────────────────
  const FormView = () => {
    const inp = { border:`1px solid ${M.inputBd}`, borderRadius:5, background:M.inputBg, color:M.textA, fontSize:12, fontFamily:uff, padding:"7px 10px", width:"100%", outline:"none" };
    const selS = { ...inp, cursor:"pointer" };

    return (
      <div style={{ padding:16, overflow:"auto", height:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <button onClick={() => setFormMode(null)} style={{ padding:"4px 12px", border:`1px solid ${M.divider}`, borderRadius:6, background:M.surfMid, color:M.textB, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:uff }}>← Back</button>
          <span style={{ fontSize:15, fontWeight:900, color:M.textA, fontFamily:uff }}>📦 New Purchase Order</span>
          <div style={{ flex:1 }}/>
          <button onClick={handleSavePO} style={{ padding:"6px 18px", borderRadius:6, background:A.a, color:A.tx, border:"none", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:uff }}>Save PO</button>
        </div>

        <Section id="header" icon="📋" title="PO Header">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <div>
              <div style={lbl}>Supplier</div>
              <select value={supplier} onChange={e=>setSupplier(e.target.value)} style={selS}>
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <div style={lbl}>PO Type</div>
              <select value={poType} onChange={e=>setPoType(e.target.value)} style={selS}>
                <option value="">Select type…</option>
                {PO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={lbl}>Season</div>
              <select value={season} onChange={e=>setSeason(e.target.value)} style={selS}>
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={lbl}>PO Date</div>
              <input type="date" value={poDate} onChange={e=>setPoDate(e.target.value)} style={inp}/>
            </div>
            <div>
              <div style={lbl}>Payment Terms</div>
              <select value={payTerms} onChange={e=>setPayTerms(e.target.value)} style={selS}>
                <option value="">Select terms…</option>
                {PAY_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={lbl}>Delivery Date</div>
              <input type="date" value={delivDate} onChange={e=>setDelivDate(e.target.value)} style={inp}/>
            </div>
          </div>
        </Section>

        <Section id="lines" icon="📋" title="Line Items" badge={`${lines.filter(l=>l.itemCode).length} items`}>
          <div style={{ overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead>
                <tr>{["#","Item","Qty","Rate","Disc%","Amount",""].map(h => (
                  <th key={h} style={{ padding:"6px 8px", textAlign:h==="Qty"||h==="Rate"||h==="Disc%"||h==="Amount"?"right":"left", fontSize:9, fontWeight:800, color:M.textD, fontFamily:uff, background:M.tblHead, borderBottom:`1px solid ${M.divider}` }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {lines.map((l,i) => {
                  const it = items.find(x=>x.code===l.itemCode);
                  const amt = (parseFloat(l.qty)||0)*(parseFloat(l.price)||0)*(1-(parseFloat(l.disc)||0)/100);
                  return (
                    <tr key={l.id} style={{ background:i%2===0?M.tblEven:M.tblOdd }}>
                      <td style={{ padding:"5px 8px", ...mono, fontSize:10, color:M.textD, borderBottom:`1px solid ${M.divider}`, width:30 }}>{i+1}</td>
                      <td style={{ padding:"5px 4px", borderBottom:`1px solid ${M.divider}`, minWidth:200 }}>
                        <ItemSearch M={M} A={A} fz={fz} dff={dff} items={items} value={l.itemCode} onChange={v=>{
                          const nl = [...lines]; nl[i] = {...nl[i], itemCode:v}; setLines(nl);
                        }}/>
                      </td>
                      <td style={{ padding:"5px 4px", borderBottom:`1px solid ${M.divider}`, width:80 }}>
                        <input value={l.qty} onChange={e=>{const nl=[...lines];nl[i]={...nl[i],qty:e.target.value};setLines(nl);}} style={{...inp,textAlign:"right",width:70}} placeholder="0"/>
                      </td>
                      <td style={{ padding:"5px 4px", borderBottom:`1px solid ${M.divider}`, width:90 }}>
                        <input value={l.price} onChange={e=>{const nl=[...lines];nl[i]={...nl[i],price:e.target.value};setLines(nl);}} style={{...inp,textAlign:"right",width:80}} placeholder="0.00"/>
                      </td>
                      <td style={{ padding:"5px 4px", borderBottom:`1px solid ${M.divider}`, width:60 }}>
                        <input value={l.disc} onChange={e=>{const nl=[...lines];nl[i]={...nl[i],disc:e.target.value};setLines(nl);}} style={{...inp,textAlign:"right",width:50}} placeholder="0"/>
                      </td>
                      <td style={{ padding:"5px 8px", ...mono, textAlign:"right", fontWeight:700, borderBottom:`1px solid ${M.divider}`, width:100 }}>{fmt(amt)}</td>
                      <td style={{ padding:"5px 4px", borderBottom:`1px solid ${M.divider}`, width:30 }}>
                        <span onClick={()=>setLines(ls=>ls.filter(x=>x.id!==l.id))} style={{ cursor:"pointer", fontSize:14, color:"#ef4444" }}>✕</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
            <button onClick={()=>setLines(l=>[...l,mLine()])} style={{ padding:"5px 12px", border:`1px dashed ${A.a}40`, borderRadius:5, background:"transparent", color:A.a, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:uff }}>+ Add Line</button>
            <div style={{ display:"flex", gap:16, fontSize:12, fontFamily:dff }}>
              <span>Base: <b style={{ color:M.textA }}>{fmt(tBase)}</b></span>
              <span>GST: <b style={{ color:M.textA }}>{fmt(tGst)}</b></span>
              <span>Total: <b style={{ color:A.a, fontSize:14 }}>{fmt(tBase+tGst)}</b></span>
            </div>
          </div>
        </Section>
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // MODULE LIST VIEW (main PO/GRN list)
  // ────────────────────────────────────────────────
  const ModuleListView = () => (
    <div style={{ padding:16, overflow:"auto", height:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* PO/GRN toggle */}
          <div style={{ display:"flex", gap:2, background:M.surfLow, border:`1px solid ${M.divider}`, borderRadius:6, padding:2 }}>
            {[{id:"PO",l:"Purchase Orders",icon:"📦"},{id:"GRN",l:"Goods Receipt",icon:"📥"}].map(m => (
              <button key={m.id} onClick={() => { setSub(m.id); setActiveTab("all"); setFilterStatus(null); setSearchQ(""); }} style={{ padding:"5px 14px", border:"none", borderRadius:4, cursor:"pointer", background:sub===m.id?A.a:"transparent", color:sub===m.id?A.tx:M.textB, fontSize:11, fontWeight:800, fontFamily:uff, transition:"all .15s", display:"flex", alignItems:"center", gap:4 }}>
                <span>{m.icon}</span>{m.l}
              </button>
            ))}
          </div>
          <span style={{ ...mono, fontSize:11, color:M.textC }}>({filtered.length})</span>
          <span style={{ fontSize:12, cursor:"pointer", color:M.textD }} onClick={() => { setShowHelp(true); setHelpPage(HELP_PAGES.find(p=>p.id==="HLP-004")); }} title="Help">❓</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <ViewSwitcher/>
          <button onClick={() => setShowTemplate(true)} style={{ padding:"6px 16px", borderRadius:6, background:A.a, color:A.tx, fontSize:11, fontWeight:700, fontFamily:uff, cursor:"pointer", border:"none" }}>+ New {sub}</button>
        </div>
      </div>
      <div style={{ marginBottom:10 }}><SavedFilterTabs/></div>
      <div style={{ marginBottom:12 }}><FilterBar/></div>
      {dataLoading ? (
        <div style={{ padding:60, textAlign:"center" }}>
          <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
          <div style={{ fontSize:12, color:M.textC, fontFamily:uff }}>Loading procurement data…</div>
        </div>
      ) : (
        <>
          {view === "table" && <TableView/>}
          {view === "kanban" && <KanbanView/>}
          {view === "calendar" && <CalendarView/>}
          {view === "gallery" && <GalleryView/>}
        </>
      )}
    </div>
  );

  // ────────────────────────────────────────────────
  // TEMPLATE PICKER MODAL
  // ────────────────────────────────────────────────
  const TemplatePicker = () => showTemplate && (
    <div style={{ position:"fixed", inset:0, zIndex:900, display:"flex", justifyContent:"center", paddingTop:"20vh" }} onClick={() => setShowTemplate(false)}>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", backdropFilter:"blur(2px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{ width:440, background:M.surfHigh, borderRadius:12, border:`1px solid ${M.divider}`, boxShadow:"0 20px 50px rgba(0,0,0,.3)", zIndex:901, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${M.divider}` }}>
          <div style={{ fontSize:14, fontWeight:900, color:M.textA, fontFamily:uff }}>📋 Choose Template</div>
          <div style={{ fontSize:11, color:M.textC, fontFamily:uff, marginTop:2 }}>Select a template to pre-fill your new {sub}</div>
        </div>
        <div style={{ padding:12 }}>
          {TEMPLATES.map((t,i) => (
            <div key={i} onClick={() => { setShowTemplate(false); setFormMode("create"); if(t.prefill.type) setPoType(t.prefill.type); if(t.prefill.payTerms) setPayTerms(t.prefill.payTerms); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:8, cursor:"pointer", marginBottom:4, border:`1px solid ${M.divider}` }} onMouseEnter={e=>{e.currentTarget.style.background=A.al;e.currentTarget.style.borderColor=A.a+"40";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=M.divider;}}>
              <span style={{ fontSize:22 }}>{t.icon}</span>
              <div><div style={{ fontSize:12, fontWeight:700, color:M.textA, fontFamily:uff }}>{t.name}</div><div style={{ fontSize:10, color:M.textC, fontFamily:uff }}>{t.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────
  // HELP PANEL (420px slide-in)
  // ────────────────────────────────────────────────
  const HelpPanel = () => {
    if (!showHelp) return null;
    const hlpFiltered = helpSearch ? HELP_PAGES.filter(p => (p.title+p.tags+p.content).toLowerCase().includes(helpSearch.toLowerCase())) : HELP_PAGES;
    const contextual = HELP_PAGES.filter(p => p.module === "Procurement" || p.module === "All");
    const cats = HELP_CATEGORIES.filter(c => hlpFiltered.some(p => p.category === c));

    const renderMD = md => {
      const lines = md.split("\n");
      return lines.map((line, i) => {
        if (line.startsWith("## ")) return <div key={i} style={{ fontSize:15, fontWeight:900, color:M.textA, fontFamily:uff, marginBottom:8, marginTop:i>0?12:0 }}>{line.slice(3)}</div>;
        if (line.startsWith("### ")) return <div key={i} style={{ fontSize:12, fontWeight:800, color:M.textA, fontFamily:uff, marginBottom:4, marginTop:8 }}>{line.slice(4)}</div>;
        if (line.startsWith("| ") && line.includes("|")) {
          const cells = line.split("|").filter(c => c.trim()).map(c => c.trim());
          if (cells.every(c => /^[-:]+$/.test(c))) return null;
          const isHeader = lines[i+1]?.includes("---");
          return <div key={i} style={{ display:"flex", gap:0 }}>{cells.map((c,j) => <div key={j} style={{ flex:1, padding:"3px 6px", fontSize:10, fontWeight:isHeader?800:400, fontFamily:uff, color:isHeader?M.textA:M.textB, background:isHeader?M.tblHead:"transparent", borderBottom:`1px solid ${M.divider}` }}>{c.replace(/\*\*/g,"")}</div>)}</div>;
        }
        if (line.startsWith("```")) return <div key={i} style={{ height:2 }}/>;
        if (line.startsWith("- ") || line.match(/^\d+\.\s/)) {
          const bullet = line.startsWith("- ");
          const text = bullet ? line.slice(2) : line.replace(/^\d+\.\s/, "");
          return <div key={i} style={{ fontSize:11, color:M.textB, fontFamily:uff, paddingLeft:12, marginBottom:3 }}>{bullet?"•":"→"} {text.split("**").map((s,si) => si%2===1?<b key={si} style={{color:M.textA}}>{s}</b>:s)}</div>;
        }
        if (line.trim() === "") return <div key={i} style={{ height:4 }}/>;
        return <div key={i} style={{ fontSize:11, color:M.textB, fontFamily:uff, marginBottom:4 }}>{line.split("**").map((s,si) => si%2===1?<b key={si} style={{color:M.textA}}>{s}</b>:s)}</div>;
      });
    };

    return (
      <div style={{ width:420, height:"100%", background:M.surfHigh, borderLeft:`1px solid ${M.divider}`, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"-4px 0 20px rgba(0,0,0,.1)", zIndex:300, flexShrink:0 }}>
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${M.divider}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:M.surfMid }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {helpPage && <span onClick={() => setHelpPage(null)} style={{ cursor:"pointer", fontSize:14, color:M.textC }}>←</span>}
            <span style={{ fontSize:14 }}>📖</span>
            <span style={{ fontSize:13, fontWeight:900, color:M.textA, fontFamily:uff }}>{helpPage ? helpPage.title : "Help & Instructions"}</span>
          </div>
          <span onClick={() => { setShowHelp(false); setHelpPage(null); }} style={{ cursor:"pointer", fontSize:16, color:M.textC, fontWeight:900 }}>✕</span>
        </div>
        {helpPage ? (
          <div style={{ flex:1, overflow:"auto", padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
              <span style={{ fontSize:18 }}>{helpPage.icon}</span>
              <div>
                <div style={{ fontSize:9, fontWeight:800, color:A.a, fontFamily:uff, textTransform:"uppercase", letterSpacing:.5 }}>{helpPage.category}</div>
                <div style={{ fontSize:8, color:M.textD }}>{helpPage.id} · {helpPage.audience}</div>
              </div>
            </div>
            {renderMD(helpPage.content)}
          </div>
        ) : (
          <div style={{ flex:1, overflow:"auto" }}>
            <div style={{ padding:"10px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:6, border:`1.5px solid ${helpSearch?A.a:M.divider}`, background:M.inputBg, transition:"border .2s" }}>
                <span style={{ fontSize:13 }}>🔍</span>
                <input value={helpSearch} onChange={e => setHelpSearch(e.target.value)} placeholder="Search help…" style={{ flex:1, border:"none", background:"transparent", fontSize:12, fontFamily:uff, color:M.textA, outline:"none" }}/>
                {helpSearch && <span onClick={() => setHelpSearch("")} style={{ cursor:"pointer", fontSize:12, color:M.textD }}>✕</span>}
              </div>
            </div>
            {!helpSearch && (
              <div style={{ padding:"0 16px 8px" }}>
                <div style={{ background:`${A.a}08`, border:`1px solid ${A.a}20`, borderRadius:8, padding:"8px 12px" }}>
                  <div style={{ fontSize:9, fontWeight:800, color:A.a, fontFamily:uff, marginBottom:6 }}>💡 RELEVANT TO THIS PAGE</div>
                  {contextual.filter(p=>p.module==="Procurement").map(p => (
                    <div key={p.id} onClick={() => setHelpPage(p)} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 6px", borderRadius:4, cursor:"pointer", marginBottom:2 }} onMouseEnter={e=>e.currentTarget.style.background=A.al} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontSize:12 }}>{p.icon}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:M.textA, fontFamily:uff }}>{p.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cats.map(cat => {
              const pages = hlpFiltered.filter(p => p.category === cat);
              const isCol = helpCollapsed[cat] ?? false;
              return (
                <div key={cat} style={{ marginBottom:4 }}>
                  <div onClick={() => setHelpCollapsed(p => ({...p,[cat]:!isCol}))} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", cursor:"pointer", background:M.surfMid }}>
                    <span style={{ fontSize:9, color:M.textC }}>{isCol?"▶":"▼"}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:M.textA, fontFamily:uff }}>{cat}</span>
                    <span style={{ fontSize:9, color:M.textD }}>({pages.length})</span>
                  </div>
                  {!isCol && pages.map(p => (
                    <div key={p.id} onClick={() => setHelpPage(p)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 16px 7px 32px", cursor:"pointer", borderBottom:`1px solid ${M.divider}08` }} onMouseEnter={e=>e.currentTarget.style.background=M.hoverBg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontSize:13 }}>{p.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:M.textA, fontFamily:uff }}>{p.title}</div>
                        <div style={{ fontSize:8, color:M.textD }}>{p.id} · {p.audience}</div>
                      </div>
                      <span style={{ fontSize:10, color:M.textD }}>→</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ padding:"8px 16px", borderTop:`1px solid ${M.divider}`, background:M.surfMid }}>
          <div style={{ fontSize:9, color:M.textD, fontFamily:uff, textAlign:"center" }}>CC ERP Help · 13 pages · Press <b>?</b> to toggle</div>
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // CONFIGURATOR MODALS (Admin V7)
  // ────────────────────────────────────────────────
  const ConfiguratorModal = () => {
    if (!showConfigurator) return null;
    const close = () => setShowConfigurator(null);

    if (showConfigurator === "linkedView") return (
      <div style={{ position:"fixed", inset:0, zIndex:900, display:"flex", justifyContent:"center", paddingTop:"14vh" }} onClick={close}>
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(3px)" }}/>
        <div onClick={e => e.stopPropagation()} style={{ width:520, background:M.surfHigh, borderRadius:12, border:`1px solid ${M.divider}`, boxShadow:"0 24px 60px rgba(0,0,0,.3)", zIndex:901, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${M.divider}`, display:"flex", justifyContent:"space-between" }}>
            <div><div style={{ fontSize:14, fontWeight:900, color:M.textA, fontFamily:uff }}>🔗 Add Linked View</div><div style={{ fontSize:10, color:M.textC, fontFamily:uff, marginTop:2 }}>Show related records on this page</div></div>
            <span onClick={close} style={{ cursor:"pointer", fontSize:16, color:M.textC }}>✕</span>
          </div>
          <div style={{ padding:20 }}>
            {[
              { label:"Show data from", val:"GRN_MASTER", type:"select" },
              { label:"Where (FK column)", val:"→ PO Code", type:"select" },
              { label:"Display columns", val:"☑ GRN Code  ☑ Date  ☑ Qty  ☑ QC Status", type:"chips" },
              { label:"Sort by", val:"GRN Date", type:"select" },
              { label:"Max rows", val:"5", type:"select" },
            ].map((f,i) => (
              <div key={i} style={{ marginBottom:14 }}>
                <div style={lbl}>{f.label}</div>
                <div style={{ padding:"8px 12px", borderRadius:6, border:`1.5px solid ${M.divider}`, background:M.inputBg, fontSize:12, fontFamily:dff, color:M.textA, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span>{f.val}</span>
                  {f.type==="select" && <span style={{ color:M.textD }}>▼</span>}
                </div>
              </div>
            ))}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
              <div onClick={close} style={{ padding:"8px 20px", borderRadius:6, border:`1px solid ${M.divider}`, fontSize:11, fontWeight:600, fontFamily:uff, color:M.textC, cursor:"pointer" }}>Cancel</div>
              <div onClick={() => { close(); toast("Linked view saved"); }} style={{ padding:"8px 20px", borderRadius:6, background:A.a, color:A.tx, fontSize:11, fontWeight:700, fontFamily:uff, cursor:"pointer" }}>Save View</div>
            </div>
          </div>
        </div>
      </div>
    );

    if (showConfigurator === "rollup") return (
      <div style={{ position:"fixed", inset:0, zIndex:900, display:"flex", justifyContent:"center", paddingTop:"16vh" }} onClick={close}>
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(3px)" }}/>
        <div onClick={e => e.stopPropagation()} style={{ width:480, background:M.surfHigh, borderRadius:12, border:`1px solid ${M.divider}`, boxShadow:"0 24px 60px rgba(0,0,0,.3)", zIndex:901, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${M.divider}` }}>
            <div style={{ fontSize:14, fontWeight:900, color:M.textA, fontFamily:uff }}>📊 Add Rollup Card</div>
            <div style={{ fontSize:10, color:M.textC, fontFamily:uff, marginTop:2 }}>Show aggregate data on record detail</div>
          </div>
          <div style={{ padding:20 }}>
            {[
              { label:"Data from", val:"PO_LINE_ITEMS" },
              { label:"Link column", val:"→ PO Code" },
              { label:"Aggregate column", val:"∑ Amount" },
              { label:"Function", val:"SUM" },
              { label:"Display label", val:"Total Line Value" },
              { label:"Format", val:"₹##,###" },
            ].map((f,i) => (
              <div key={i} style={{ marginBottom:12 }}>
                <div style={lbl}>{f.label}</div>
                <div style={{ padding:"7px 12px", borderRadius:6, border:`1.5px solid ${M.divider}`, background:M.inputBg, fontSize:12, fontFamily:dff, color:M.textA, display:"flex", justifyContent:"space-between" }}><span>{f.val}</span><span style={{ color:M.textD }}>▼</span></div>
              </div>
            ))}
            <div style={{ background:M.surfMid, border:`1px solid ${M.divider}`, borderRadius:6, padding:"8px 12px", marginBottom:12, borderLeft:"3px solid #15803D" }}>
              <div style={{ fontSize:8, fontWeight:900, color:M.textD, textTransform:"uppercase", fontFamily:uff }}>PREVIEW</div>
              <div style={{ fontSize:14, fontWeight:800, color:M.textA, fontFamily:dff }}>₹1,24,500</div>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <div onClick={close} style={{ padding:"8px 20px", borderRadius:6, border:`1px solid ${M.divider}`, fontSize:11, fontWeight:600, fontFamily:uff, color:M.textC, cursor:"pointer" }}>Cancel</div>
              <div onClick={() => { close(); toast("Rollup card saved"); }} style={{ padding:"8px 20px", borderRadius:6, background:A.a, color:A.tx, fontSize:11, fontWeight:700, fontFamily:uff, cursor:"pointer" }}>Save Rollup</div>
            </div>
          </div>
        </div>
      </div>
    );

    if (showConfigurator === "workflow") return (
      <div style={{ position:"fixed", inset:0, zIndex:900, display:"flex", justifyContent:"center", paddingTop:"8vh" }} onClick={close}>
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(3px)" }}/>
        <div onClick={e => e.stopPropagation()} style={{ width:620, maxHeight:"80vh", background:M.surfHigh, borderRadius:12, border:`1px solid ${M.divider}`, boxShadow:"0 24px 60px rgba(0,0,0,.3)", zIndex:901, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${M.divider}`, display:"flex", justifyContent:"space-between" }}>
            <div><div style={{ fontSize:14, fontWeight:900, color:M.textA, fontFamily:uff }}>⚙️ Workflow: Procurement-PO</div><div style={{ fontSize:10, color:M.textC, fontFamily:uff, marginTop:2 }}>Admin only · Visual status flow editor</div></div>
            <span onClick={close} style={{ cursor:"pointer", fontSize:16, color:M.textC }}>✕</span>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:20 }}>
            <div style={{ background:M.surfLow, borderRadius:8, padding:16, marginBottom:16, border:`1px solid ${M.divider}` }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", justifyContent:"center" }}>
                {WORKFLOW_STATUSES.map((ws,i) => (
                  <div key={ws.code} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ padding:"6px 14px", borderRadius:8, background:`${ws.color}18`, border:`2px solid ${ws.color}`, color:ws.color, fontSize:11, fontWeight:800, fontFamily:uff, cursor:"pointer", position:"relative" }}>
                      {ws.label}
                      <div style={{ fontSize:7, color:M.textD, textAlign:"center", marginTop:2 }}>{ws.stage}</div>
                    </div>
                    {i < WORKFLOW_STATUSES.length - 1 && ws.next.length > 0 && <span style={{ color:M.textD, fontSize:12 }}>→</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...lbl, marginBottom:8 }}>STATUS DEFINITIONS ({WORKFLOW_STATUSES.length})</div>
            {WORKFLOW_STATUSES.map((ws) => (
              <div key={ws.code} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:6, border:`1px solid ${M.divider}`, marginBottom:4, background:M.surfHigh }}>
                <div style={{ width:14, height:14, borderRadius:4, background:ws.color }}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:M.textA, fontFamily:uff }}>{ws.label}</span>
                  <span style={{ fontSize:9, color:M.textD, marginLeft:6 }}>{ws.code}</span>
                </div>
                <span style={{ fontSize:9, color:M.textC, fontFamily:uff }}>{ws.stage}</span>
                <span style={{ fontSize:9, color:M.textC }}> → {ws.next.join(", ") || "—"}</span>
                <span style={{ fontSize:9, color:M.textD, fontFamily:uff }}>{ws.role}+</span>
              </div>
            ))}
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <div style={{ padding:"6px 14px", borderRadius:6, border:`1px dashed ${A.a}40`, fontSize:10, fontWeight:700, fontFamily:uff, color:A.a, cursor:"pointer" }}>+ Add Status</div>
            </div>
          </div>
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${M.divider}`, display:"flex", justifyContent:"flex-end", gap:8 }}>
            <div onClick={close} style={{ padding:"8px 20px", borderRadius:6, border:`1px solid ${M.divider}`, fontSize:11, fontWeight:600, fontFamily:uff, color:M.textC, cursor:"pointer" }}>Cancel</div>
            <div onClick={() => { close(); toast("Workflow saved"); }} style={{ padding:"8px 20px", borderRadius:6, background:A.a, color:A.tx, fontSize:11, fontWeight:700, fontFamily:uff, cursor:"pointer" }}>Save Workflow</div>
          </div>
        </div>
      </div>
    );

    return null;
  };

  // ────────────────────────────────────────────────
  // STATUS BAR
  // ────────────────────────────────────────────────
  const StatusBar = () => {
    const total = rawList.reduce((s,r) => s + (r.total||r.amount||0), 0);
    return (
      <div style={{ height:28, background:M.statusBg||M.surfMid, borderTop:`1px solid ${M.divider}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", fontSize:10, fontFamily:dff, color:M.textC, flexShrink:0 }}>
        <div style={{ display:"flex", gap:16 }}>
          <span>ROWS: <b style={{ color:M.textA }}>{filtered.length}</b></span>
          <span>TOTAL: <b style={{ color:A.a }}>{fmt(total)}</b></span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <span>Procurement · {sub === "PO" ? "Purchase Orders" : "Goods Receipts"} · {view}</span>
          <span style={{ color:A.a, fontWeight:600 }}>V7</span>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:M.bg }}>
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
            <div style={{ flex:1, overflow:"auto", background:M.bg }}>
              {formMode ? <FormView/> : selectedPO ? <RecordDetail/> : <ModuleListView/>}
            </div>
            <HelpPanel/>
          </div>
          <StatusBar/>
        </div>
      </div>

      {/* Modals */}
      <TemplatePicker/>
      <ConfiguratorModal/>

      {/* Toast */}
      {toastMsg && (
        <div style={{ position:"fixed", bottom:40, left:"50%", transform:"translateX(-50%)", padding:"10px 24px", borderRadius:8, background:"#111827", color:"#fff", fontSize:12, fontWeight:700, fontFamily:uff, boxShadow:"0 8px 24px rgba(0,0,0,.3)", zIndex:999, display:"flex", alignItems:"center", gap:8 }}>
          <span>✓</span> {toastMsg}
        </div>
      )}
    </div>
  );
}
