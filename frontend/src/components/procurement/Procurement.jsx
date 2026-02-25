import { useState, useEffect, useCallback } from 'react';
import { SEASONS, PO_TYPES, PAY_TERMS, WH_LIST, CAT_ICON, CAT_CLR, ITEM_IMGS } from '../../constants/procurement';
import { PY_MAP } from '../../constants/defaults';
import { uiFF } from '../../constants/fonts';
import { uid, mLine, fmtINR } from '../../utils/helpers';
import ItemSearch from './ItemSearch';
import api from '../../services/api';

export default function Procurement({ M, A, cfg, fz, dff }) {
  const uff = uiFF(cfg.uiFont);
  const pyV = PY_MAP[cfg.density];
  const sp  = cfg.compactSide ? pyV - 2 : pyV;

  // ─ View state
  const [view, setView]   = useState("list");  // list | form
  const [sub, setSub]     = useState("PO");    // PO | GRN
  const [editId, setEditId] = useState(null);

  // ─ API data (fetched from Google Sheets via GAS)
  const [items, setItems]         = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [poList, setPoList]       = useState([]);
  const [grnList, setGrnList]     = useState([]);
  const [openPOs, setOpenPOs]     = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(()=>{
    let cancelled = false;
    async function fetchData(){
      try {
        const [itemsRes, suppRes, poRes, grnRes, openRes] = await Promise.allSettled([
          api.getItems(),
          api.getSuppliers(),
          api.getPOList(),
          api.getGRNList(),
          api.getOpenPOs(),
        ]);
        if (cancelled) return;
        if (itemsRes.status === "fulfilled" && itemsRes.value) setItems(itemsRes.value);
        if (suppRes.status === "fulfilled" && suppRes.value) setSuppliers(suppRes.value);
        if (poRes.status === "fulfilled" && poRes.value) setPoList(poRes.value);
        if (grnRes.status === "fulfilled" && grnRes.value) setGrnList(grnRes.value);
        if (openRes.status === "fulfilled" && openRes.value) setOpenPOs(openRes.value);
      } catch(err) {
        console.error("Procurement data fetch failed:", err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  },[]);

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

  const sup = suppliers.find(s => s.code === supplier);
  const toggleSec = id => setOpenSec(o => o.includes(id) ? o.filter(x=>x!==id) : [...o, id]);

  // ─ Line operations
  const addLine = () => { setLines(l => [...l, mLine()]); setIsDirty(true); };
  const remLine = id  => { setLines(l => l.filter(x => x.id !== id)); setIsDirty(true); };
  const updLine = (id, f, v) => { setLines(l => l.map(x => x.id === id ? {...x, [f]:v} : x)); setIsDirty(true); };

  // ─ Totals
  const tBase = lines.reduce((s,l) => s + (parseFloat(l.qty)||0)*(parseFloat(l.price)||0)*(1-(parseFloat(l.disc)||0)/100), 0);
  const tGst  = lines.reduce((s,l) => { const it=items.find(i=>i.code===l.itemCode); return s+(it?(parseFloat(l.qty)||0)*(parseFloat(l.price)||0)*(1-(parseFloat(l.disc)||0)/100)*(it.gst/100):0); }, 0);

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
  const listData = sub === "PO" ? poList : grnList;
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
                    {openPOs.map(p=><option key={p.po} value={p.po}>{p.po} · {p.date}</option>)}
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
                  {suppliers.map(s=><option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}
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
            <Accordion id="openpos" icon="📄" title="Open POs" badge={`${openPOs.length}`}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {openPOs.map(p => {
                  const s = suppliers.find(x => x.code === p.sup);
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
                const it = items.find(i => i.code === line.itemCode);
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
                      <ItemSearch value={line.itemCode} onChange={v=>updLine(line.id,"itemCode",v)} items={items} M={M} A={A} fz={fz} py={pyV} showThumbs={cfg.showThumbs} />
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
                      const it = items.find(x=>x.code===l.itemCode);
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
