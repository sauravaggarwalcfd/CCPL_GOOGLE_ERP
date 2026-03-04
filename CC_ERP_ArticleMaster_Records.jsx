import { useState, useMemo, useCallback } from "react";

/* ─── DESIGN TOKENS ──────────────────────────────────────────── */
const C = {
  red:       "#CC0000",
  orange:    "#E8690A",
  orangeSoft:"#fff5ee",
  purple:    "#6c3fc5",
  purpleSoft:"#f0eeff",
  blue:      "#1d6fa4",
  blueSoft:  "#e8f3fb",
  green:     "#15803d",
  slate:     "#1e293b",
  slate2:    "#253347",
  slate3:    "#2d3f50",
  bg:        "#f0f2f6",
  surface:   "#ffffff",
  border:    "#e2e8ef",
  faint:     "#f6f8fb",
  text:      "#1a2332",
  sub:       "#5a6a7e",
  muted:     "#9aa5b4",
  dim:       "#d1d8e0",
};

const STATUS = {
  Active:      { bg:"#dcfce7", tx:"#15803d", dot:"#22c55e" },
  Inactive:    { bg:"#f1f5f9", tx:"#475569", dot:"#94a3b8" },
  Development: { bg:"#fef3c7", tx:"#92400e", dot:"#f59e0b" },
  Discontinued:{ bg:"#fee2e2", tx:"#991b1b", dot:"#ef4444" },
};

/* ─── 26-COL SCHEMA (matches Google Sheet exactly) ───────────── */
const COLS = [
  { key:"imageLink",   label:"📷",           w:54,  special:"thumb"  },
  { key:"code",        label:"Article Code",  w:100, mono:true, bold:true, sortable:true },
  { key:"desc",        label:"Description",   w:205, sortable:true },
  { key:"shortName",   label:"Short Name",    w:108, sortable:true },
  { key:"sketchLink",  label:"✏ Sketch",      w:58,  special:"sketch" },
  { key:"buyerStyle",  label:"Buyer Style",   w:96,  sortable:true },
  { key:"l1Division",  label:"Division",      w:80,  sortable:true },
  { key:"l2Category",  label:"L2 Category",   w:118, sortable:true },
  { key:"l3Style",     label:"L3 Style",      w:100, sortable:true },
  { key:"season",      label:"Season",        w:98,  sortable:true },
  { key:"gender",      label:"Gender",        w:72,  sortable:true },
  { key:"fitType",     label:"Fit Type",      w:82,  sortable:true },
  { key:"neckline",    label:"Neckline",      w:96,  sortable:true },
  { key:"sleeveType",  label:"Sleeve Type",   w:96,  sortable:true },
  { key:"mainFabric",  label:"Fabric →",      w:100, mono:true, sortable:true },
  { key:"fabricName",  label:"← Fabric Name", w:155, auto:true },
  { key:"colorCodes",  label:"Colors →",      w:115, mono:true, sortable:true },
  { key:"sizeRange",   label:"Size Range",    w:100, sortable:true },
  { key:"wsp",         label:"WSP ₹",         w:76,  mono:true, num:true, sortable:true },
  { key:"mrp",         label:"MRP ₹",         w:76,  mono:true, num:true, sortable:true },
  { key:"markupPct",   label:"∑ Markup %",    w:80,  mono:true, auto:true, num:true },
  { key:"markdownPct", label:"∑ Markdown %",  w:86,  mono:true, auto:true, num:true },
  { key:"hsnCode",     label:"HSN Code →",    w:76,  mono:true, sortable:true },
  { key:"gstPct",      label:"← GST %",       w:62,  mono:true, auto:true },
  { key:"status",      label:"Status",        w:112, badge:true, sortable:true },
  { key:"tags",        label:"⟷ Tags",        w:148 },
  { key:"remarks",     label:"Remarks",       w:165 },
];

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const MOCK = [
  { code:"5249HP", desc:"Classic Pique Polo Shirt Regular Fit",
    shortName:"Classic Pique", imageLink:"https://picsum.photos/seed/polo1/300/300",
    sketchLink:"https://picsum.photos/seed/sk1/300/300", buyerStyle:"BS-2249",
    l1Division:"Apparel", l2Category:"Tops - Polo", l3Style:"Pique",
    season:"SS25, AW25", gender:"Men", fitType:"Regular", neckline:"Collar", sleeveType:"Half Sleeve",
    mainFabric:"RM-FAB-001", fabricName:"Pique 180GSM 100% Cotton",
    colorCodes:"CLR-001|CLR-007|CLR-023", sizeRange:"S-M-L-XL-XXL",
    wsp:490, mrp:999, markupPct:103.9, markdownPct:50.9,
    hsnCode:"6105", gstPct:5, status:"Active", tags:"polo,summer,men", remarks:"" },
  { code:"5250HP", desc:"French Terry Sweatshirt Oversized Drop Shoulder",
    shortName:"FT Sweatshirt OVS", imageLink:"https://picsum.photos/seed/sw2/300/300",
    sketchLink:"https://picsum.photos/seed/sk2/300/300", buyerStyle:"BS-2250",
    l1Division:"Apparel", l2Category:"Sweatshirt", l3Style:"French Terry",
    season:"AW25, AW26", gender:"Unisex", fitType:"Oversized", neckline:"Round Neck", sleeveType:"Full Sleeve",
    mainFabric:"RM-FAB-002", fabricName:"French Terry 260GSM 65/35 CVC",
    colorCodes:"CLR-012|CLR-019", sizeRange:"XS-S-M-L-XL",
    wsp:720, mrp:1499, markupPct:108.2, markdownPct:52.0,
    hsnCode:"6110", gstPct:12, status:"Active", tags:"sweatshirt,winter,unisex", remarks:"Top seller AW25" },
  { code:"5231HP", desc:"Brushed Fleece Hoodie with Kangaroo Pocket",
    shortName:"Brushed Hoodie", imageLink:"https://picsum.photos/seed/hd3/300/300",
    sketchLink:"https://picsum.photos/seed/sk3/300/300", buyerStyle:"",
    l1Division:"Apparel", l2Category:"Sweatshirt", l3Style:"Hooded",
    season:"AW25", gender:"Men", fitType:"Relaxed", neckline:"Hooded", sleeveType:"Full Sleeve",
    mainFabric:"RM-FAB-003", fabricName:"Fleece 320GSM 80/20 CVC Brushed",
    colorCodes:"CLR-003|CLR-011|CLR-022", sizeRange:"S-M-L-XL-XXL-3XL",
    wsp:850, mrp:1799, markupPct:111.6, markdownPct:52.8,
    hsnCode:"6110", gstPct:12, status:"Development", tags:"hoodie,winter,men", remarks:"Pending QC sign-off" },
  { code:"5198KD", desc:"Kids Tracksuit Bottom Tapered Fit Elastic Waist",
    shortName:"Kids Track Bottom", imageLink:"https://picsum.photos/seed/tk4/300/300",
    sketchLink:"https://picsum.photos/seed/sk4/300/300", buyerStyle:"BS-KD01",
    l1Division:"Apparel", l2Category:"Tracksuit", l3Style:"",
    season:"Year Round", gender:"Kids", fitType:"Regular", neckline:"", sleeveType:"",
    mainFabric:"RM-FAB-002", fabricName:"French Terry 260GSM 65/35 CVC",
    colorCodes:"CLR-004|CLR-009", sizeRange:"4Y-6Y-8Y-10Y-12Y",
    wsp:320, mrp:699, markupPct:118.4, markdownPct:54.2,
    hsnCode:"6112", gstPct:12, status:"Active", tags:"kids,tracksuit,yearround", remarks:"" },
  { code:"5310WM", desc:"Women's V-Neck Slim Tee Premium 100% Cotton",
    shortName:"Slim V-Tee WM", imageLink:"https://picsum.photos/seed/wt5/300/300",
    sketchLink:"https://picsum.photos/seed/sk5/300/300", buyerStyle:"BS-WM10",
    l1Division:"Apparel", l2Category:"Tops - Tee", l3Style:"Smooth Knit",
    season:"SS25, SS26", gender:"Women", fitType:"Slim", neckline:"V-Neck", sleeveType:"Half Sleeve",
    mainFabric:"RM-FAB-004", fabricName:"Single Jersey 160GSM 100% Cotton",
    colorCodes:"CLR-002|CLR-007|CLR-014|CLR-020", sizeRange:"XS-S-M-L-XL",
    wsp:280, mrp:599, markupPct:113.9, markdownPct:53.3,
    hsnCode:"6109", gstPct:5, status:"Active", tags:"women,tee,slim,summer", remarks:"" },
  { code:"5188HP", desc:"Polo Shirt Waffle Texture Half Sleeve Men",
    shortName:"Waffle Polo HP", imageLink:"https://picsum.photos/seed/wp6/300/300",
    sketchLink:"https://picsum.photos/seed/sk6/300/300", buyerStyle:"",
    l1Division:"Apparel", l2Category:"Tops - Polo", l3Style:"Waffle",
    season:"SS26", gender:"Men", fitType:"Regular", neckline:"Collar", sleeveType:"Half Sleeve",
    mainFabric:"RM-FAB-005", fabricName:"Waffle Knit 200GSM 100% Cotton",
    colorCodes:"CLR-005|CLR-016", sizeRange:"S-M-L-XL",
    wsp:520, mrp:1099, markupPct:111.3, markdownPct:52.7,
    hsnCode:"6105", gstPct:5, status:"Discontinued", tags:"polo,waffle,men", remarks:"Colour blocked — season end" },
  { code:"5420WM", desc:"Women's Oversized Drop-Shoulder Sweatshirt AW",
    shortName:"OS Drop Sweat WM", imageLink:"https://picsum.photos/seed/ds7/300/300",
    sketchLink:"https://picsum.photos/seed/sk7/300/300", buyerStyle:"BS-WM22",
    l1Division:"Apparel", l2Category:"Sweatshirt", l3Style:"French Terry",
    season:"AW26", gender:"Women", fitType:"Oversized", neckline:"Round Neck", sleeveType:"Full Sleeve",
    mainFabric:"RM-FAB-002", fabricName:"French Terry 260GSM 65/35 CVC",
    colorCodes:"CLR-008|CLR-015|CLR-021", sizeRange:"XS-S-M-L-XL",
    wsp:680, mrp:1399, markupPct:105.7, markdownPct:51.4,
    hsnCode:"6110", gstPct:12, status:"Development", tags:"women,sweatshirt,oversized", remarks:"" },
];

/* ─── SHARED ATOMS ───────────────────────────────────────────── */
function StatusBadge({ s }) {
  const st = STATUS[s] || STATUS.Inactive;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:10,
      background:st.bg, color:st.tx, whiteSpace:"nowrap", flexShrink:0,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:st.dot, flexShrink:0 }}/>
      {s}
    </span>
  );
}

function ImgThumb({ src, size=44, radius=6, fallbackIcon="📷" }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div style={{
      width:size, height:size, borderRadius:radius, flexShrink:0,
      background:"#f1f5f9", border:"1px solid #e4e8ef",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size > 40 ? 16 : 11, color:C.dim,
    }}>{size > 30 ? fallbackIcon : "—"}</div>
  );
  return (
    <img src={src} onError={() => setErr(true)} alt=""
      style={{
        width:size, height:size, borderRadius:radius, objectFit:"cover",
        flexShrink:0, border:"1px solid #e4e8ef", display:"block",
      }}/>
  );
}

function SketchThumb({ src, size=38, radius=5 }) {
  const [err, setErr]   = useState(false);
  const [hov, setHov]   = useState(false);
  const [pos, setPos]   = useState({ x:0, y:0 });

  const handleMove = e => setPos({ x: e.clientX, y: e.clientY });

  if (!src || err) return (
    <div style={{
      width:size, height:size, borderRadius:radius, flexShrink:0,
      background:"#fafafa", border:"1px dashed #d1d8e0",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:10, color:C.dim,
    }}>✏</div>
  );

  return (
    <>
      <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onMouseMove={handleMove}>
        <img src={src} onError={() => setErr(true)} alt=""
          style={{
            width:size, height:size, borderRadius:radius, objectFit:"cover",
            border:"1px solid #e4e8ef", display:"block",
            filter: hov ? "grayscale(0%)" : "grayscale(65%)",
            transition:"filter .18s",
          }}/>
      </div>
      {hov && (
        <div style={{
          position:"fixed",
          left: pos.x + 14,
          top:  Math.min(pos.y - 80, window.innerHeight - 200),
          zIndex:9999,
          background:"#fff",
          border:"1px solid #e4e8ef",
          borderRadius:10,
          padding:6,
          boxShadow:"0 12px 40px rgba(0,0,0,.18)",
          pointerEvents:"none",
        }}>
          <img src={src} alt="" style={{ width:160, height:160, objectFit:"cover", borderRadius:7, display:"block" }}/>
          <div style={{ fontSize:8.5, color:C.muted, textAlign:"center", padding:"4px 0 2px", fontWeight:700 }}>
            ✏ Sketch / Tech Pack
          </div>
        </div>
      )}
    </>
  );
}

function Tags({ v }) {
  if (!v) return <span style={{ color:C.dim, fontSize:10 }}>—</span>;
  const parts = String(v).split(",").map(t => t.trim()).filter(Boolean);
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
      {parts.slice(0, 3).map(t => (
        <span key={t} style={{
          fontSize:7.5, padding:"2px 5px", borderRadius:7,
          background:"#f1f5f9", color:"#64748b", fontWeight:700,
        }}>{t}</span>
      ))}
      {parts.length > 3 && (
        <span style={{ fontSize:7.5, color:C.muted, padding:"2px 3px" }}>+{parts.length - 3}</span>
      )}
    </div>
  );
}

function CellVal({ col, row, fz=11 }) {
  if (col.special === "thumb")  return <ImgThumb  src={row.imageLink}  size={42}  radius={6}/>;
  if (col.special === "sketch") return <SketchThumb src={row.sketchLink} size={36}  radius={5}/>;
  if (col.badge)  return <StatusBadge s={row[col.key]}/>;
  if (col.key === "tags") return <Tags v={row[col.key]}/>;
  const raw = row[col.key];
  if (raw === undefined || raw === null || raw === "") return <span style={{ color:C.dim }}>—</span>;
  const disp = col.num
    ? (col.key === "wsp" || col.key === "mrp" ? `₹${raw}` : `${raw}%`)
    : String(raw);
  return (
    <span style={{
      fontSize: fz,
      fontFamily: col.mono ? "'IBM Plex Mono',monospace" : "inherit",
      fontWeight: col.bold ? 800 : col.auto ? 700 : 400,
      color: col.key === "code"   ? C.orange
           : col.auto             ? C.purple
           : (col.key === "markupPct" && raw >= 100) ? C.green
           : C.text,
      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"block",
    }}>{disp}</span>
  );
}

/* ─── TOOLBAR (shared) ───────────────────────────────────────── */
function Toolbar({ search, onSearch, total, visible, view, onView, extra }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      padding:"8px 12px",
      background:C.surface,
      borderBottom:`1.5px solid ${C.border}`,
      flexShrink:0,
    }}>
      {/* Search */}
      <div style={{ position:"relative" }}>
        <span style={{
          position:"absolute", left:9, top:"50%", transform:"translateY(-50%)",
          fontSize:13, color:C.muted, pointerEvents:"none",
        }}>⌕</span>
        <input value={search} onChange={e => onSearch(e.target.value)}
          placeholder={`Search ${total} articles…`}
          style={{
            padding:"6px 28px", border:`1.5px solid ${C.border}`,
            borderRadius:7, fontSize:11, outline:"none", width:215,
            background:"#f9fafb", fontFamily:"inherit", color:C.text,
            transition:"border-color .15s",
          }}
          onFocus={e => e.target.style.borderColor = C.orange}
          onBlur={e  => e.target.style.borderColor = C.border}/>
        {search && (
          <button onClick={() => onSearch("")} style={{
            position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
            border:"none", background:"none", color:C.muted, cursor:"pointer", fontSize:13,
          }}>×</button>
        )}
      </div>

      {extra}

      <div style={{ flex:1 }}/>

      <span style={{ fontSize:9, color:C.muted, fontWeight:700 }}>
        {visible}<span style={{ color:C.dim }}>/{total}</span> records
      </span>

      {/* View switcher — top-right */}
      <div style={{
        display:"flex", borderRadius:8, overflow:"hidden",
        border:`1.5px solid ${C.border}`,
      }}>
        {[
          { id:"table", icon:"⊟", label:"Table" },
          { id:"split", icon:"◫", label:"Split"  },
        ].map(v => (
          <button key={v.id} onClick={() => onView(v.id)} style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"5px 12px", border:"none", cursor:"pointer",
            background: view === v.id ? C.slate : "#f9fafb",
            color:       view === v.id ? "#fff"    : C.sub,
            fontSize:10, fontWeight:900,
            transition:"all .15s",
            borderRight: v.id === "table" ? `1px solid ${C.border}` : "none",
          }}>
            <span style={{ fontSize:13 }}>{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TABLE VIEW  (Concept A)
═══════════════════════════════════════════════════════════════ */
function TableView({ rows, allData, search, onSearch, view, onView, onEdit }) {
  const [sk, setSk]           = useState("code");
  const [sd, setSd]           = useState("asc");
  const [hidden, setHidden]   = useState(["buyerStyle","remarks"]);
  const [colMgr, setColMgr]   = useState(false);
  const [selRow, setSelRow]   = useState(null);

  const sorted = useMemo(() => [...rows].sort((a,b) =>
    sd === "asc"
      ? String(a[sk]||"").localeCompare(String(b[sk]||""))
      : String(b[sk]||"").localeCompare(String(a[sk]||""))
  ), [rows, sk, sd]);

  const visCols = COLS.filter(c => !hidden.includes(c.key));
  const sort = k => { if (sk===k) setSd(d=>d==="asc"?"desc":"asc"); else { setSk(k); setSd("asc"); } };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <Toolbar
        search={search} onSearch={onSearch}
        total={allData.length} visible={rows.length}
        view={view} onView={onView}
        extra={
          <button onClick={() => setColMgr(p=>!p)} style={{
            padding:"5px 10px",
            border:`1.5px solid ${colMgr ? C.purple : C.border}`,
            borderRadius:6,
            background: colMgr ? C.purpleSoft : "#f9fafb",
            color: colMgr ? C.purple : C.sub,
            fontSize:10, fontWeight:800, cursor:"pointer",
          }}>⊟ Columns ({visCols.length})</button>
        }
      />

      {/* Column manager */}
      {colMgr && (
        <div style={{
          padding:"7px 12px", borderBottom:`1px solid ${C.border}`,
          background:"#fafafa", display:"flex", flexWrap:"wrap", gap:4, flexShrink:0,
        }}>
          {COLS.filter(c => !c.special).map(c => {
            const off = hidden.includes(c.key);
            return (
              <button key={c.key}
                onClick={() => setHidden(p => off ? p.filter(x=>x!==c.key) : [...p,c.key])}
                style={{
                  padding:"2px 9px", borderRadius:10, fontSize:9, fontWeight:700, cursor:"pointer",
                  border:`1.5px solid ${off ? C.border : C.purple+"55"}`,
                  background: off ? "#f9fafb" : C.purpleSoft,
                  color:       off ? C.muted   : C.purple,
                  textDecoration: off ? "line-through" : "none",
                }}>{c.label}</button>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div style={{ flex:1, overflow:"auto" }}>
        <table style={{
          borderCollapse:"collapse", tableLayout:"fixed",
          minWidth: visCols.reduce((a,c)=>a+c.w,0) + 76,
        }}>
          <colgroup>
            {visCols.map(c => <col key={c.key} style={{ width:c.w }}/>)}
            <col style={{ width:76 }}/>
          </colgroup>
          <thead style={{ position:"sticky", top:0, zIndex:10 }}>
            <tr style={{ background:C.slate }}>
              {visCols.map(c => (
                <th key={c.key}
                  onClick={() => c.sortable ? sort(c.key) : null}
                  style={{
                    padding:"8px 9px", textAlign:"left",
                    fontSize:8.5, fontWeight:900,
                    color: c.auto ? "#a78bfa" : sk===c.key ? C.orange : "#94a3b8",
                    borderRight:`1px solid ${C.slate3}`,
                    whiteSpace:"nowrap", letterSpacing:.4, textTransform:"uppercase",
                    background: sk===c.key ? C.slate2 : c.auto ? "#1e1a35" : "transparent",
                    cursor: c.sortable ? "pointer" : "default",
                    userSelect:"none",
                  }}>
                  {c.label}
                  {c.sortable && sk===c.key && (
                    <span style={{ marginLeft:3, color:C.orange }}>{sd==="asc"?"↑":"↓"}</span>
                  )}
                </th>
              ))}
              <th style={{
                padding:"8px 9px", fontSize:8.5, fontWeight:900,
                color:"#94a3b8", textAlign:"center",
                textTransform:"uppercase", letterSpacing:.4,
              }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => {
              const isSel = selRow === row.code;
              return (
                <tr key={row.code}
                  onClick={() => setSelRow(isSel ? null : row.code)}
                  style={{
                    background: isSel ? "#fff7f0" : ri%2===0 ? "#fff" : "#fafbfd",
                    borderBottom:`1px solid #f1f4f9`,
                    borderLeft:`3px solid ${isSel ? C.orange : "transparent"}`,
                    cursor:"pointer", transition:"background .08s",
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background="#f8f9ff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSel?"#fff7f0":ri%2===0?"#fff":"#fafbfd"; }}>
                  {visCols.map(c => (
                    <td key={c.key} style={{
                      padding: c.special ? "5px 8px" : "4px 9px",
                      overflow:"hidden",
                      background: c.auto ? "#faf7ff" : "transparent",
                      verticalAlign:"middle",
                      borderRight:`1px solid #f5f7fb`,
                    }}>
                      <CellVal col={c} row={row}/>
                    </td>
                  ))}
                  <td style={{ padding:"4px 8px", textAlign:"center", verticalAlign:"middle" }}>
                    <button onClick={e=>{ e.stopPropagation(); onEdit(row); }} style={{
                      padding:"3px 11px",
                      border:`1px solid ${C.orange}`,
                      borderRadius:5,
                      background:C.orangeSoft, color:C.orange,
                      fontSize:9, fontWeight:800, cursor:"pointer",
                    }}>✎ Edit</button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={visCols.length+1} style={{
                padding:48, textAlign:"center", color:C.muted, fontSize:12,
              }}>No articles match "{search}"</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div style={{
        padding:"4px 12px", borderTop:`1px solid ${C.border}`,
        background:C.faint, display:"flex", alignItems:"center", gap:14, flexShrink:0,
      }}>
        <span style={{ fontSize:9, color:C.muted }}>
          {sorted.length} records · {visCols.length} cols · sorted by <b style={{ color:C.sub }}>{sk}</b> {sd==="asc"?"↑":"↓"}
        </span>
        <div style={{ flex:1 }}/>
        {[
          { s:"Active",      c:"#22c55e" },
          { s:"Development", c:"#f59e0b" },
          { s:"Discontinued",c:"#ef4444" },
          { s:"Inactive",    c:"#94a3b8" },
        ].map(({ s, c }) => {
          const n = allData.filter(d => d.status===s).length;
          return n > 0 ? (
            <span key={s} style={{ display:"flex", alignItems:"center", gap:4, fontSize:8.5 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:c }}/>
              <span style={{ color:C.sub, fontWeight:700 }}>{n}</span>
              <span style={{ color:C.muted }}>{s}</span>
            </span>
          ) : null;
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPLIT VIEW  (Concept C)
═══════════════════════════════════════════════════════════════ */
function SplitView({ rows, allData, search, onSearch, view, onView, onEdit }) {
  const [sel, setSel]   = useState(rows[0] || null);
  const [tab, setTab]   = useState("details");

  // Keep sel valid when search filters change
  useMemo(() => {
    if (sel && !rows.find(r => r.code === sel.code)) setSel(rows[0] || null);
  }, [rows]);

  const st = sel ? (STATUS[sel.status] || STATUS.Inactive) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <Toolbar
        search={search} onSearch={onSearch}
        total={allData.length} visible={rows.length}
        view={view} onView={onView}
      />

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── LEFT LIST ── */}
        <div style={{
          width:284, flexShrink:0,
          display:"flex", flexDirection:"column",
          borderRight:`2px solid ${C.border}`,
          background:C.surface,
        }}>
          <div style={{ flex:1, overflowY:"auto" }}>
            {rows.map((r, i) => {
              const s   = STATUS[r.status] || STATUS.Inactive;
              const on  = sel?.code === r.code;
              return (
                <div key={r.code} onClick={() => { setSel(r); setTab("details"); }}
                  style={{
                    display:"flex", alignItems:"center", gap:9,
                    padding:"8px 10px",
                    borderBottom:`1px solid #f1f4f9`,
                    background: on ? "#fff7f0" : C.surface,
                    borderLeft:`3px solid ${on ? C.orange : "transparent"}`,
                    cursor:"pointer", transition:"background .1s",
                  }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background="#f8f9ff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = on ? "#fff7f0" : C.surface; }}>

                  <ImgThumb src={r.imageLink} size={40} radius={7}/>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                      <span style={{
                        fontSize:10, fontWeight:900, color:C.orange,
                        fontFamily:"'IBM Plex Mono',monospace",
                      }}>{r.code}</span>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot }}/>
                    </div>
                    <div style={{
                      fontSize:11, fontWeight:700, color:C.text, lineHeight:1.3,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    }}>{r.desc}</div>
                    <div style={{ fontSize:8.5, color:C.muted, marginTop:1 }}>
                      {r.l2Category}{r.gender ? ` · ${r.gender}` : ""}
                    </div>
                  </div>

                  <SketchThumb src={r.sketchLink} size={28} radius={4}/>
                </div>
              );
            })}
            {rows.length === 0 && (
              <div style={{ padding:32, textAlign:"center", color:C.muted, fontSize:11 }}>
                No results
              </div>
            )}
          </div>

          <div style={{
            padding:"5px 10px", borderTop:`1px solid ${C.border}`,
            background:C.faint, fontSize:9, color:C.muted,
          }}>{rows.length} articles</div>
        </div>

        {/* ── RIGHT DETAIL ── */}
        {sel ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflowY:"auto", background:C.bg }}>

            {/* Hero */}
            <div style={{
              display:"flex", background:C.surface,
              borderBottom:`2px solid ${C.border}`, flexShrink:0,
            }}>
              {/* Main image */}
              <div style={{ width:210, height:210, flexShrink:0, overflow:"hidden" }}>
                <ImgThumb src={sel.imageLink} size={210} radius={0}/>
              </div>

              {/* Sketch panel */}
              <div style={{
                width:150, flexShrink:0, height:210,
                background:C.faint, borderLeft:`1px solid ${C.border}`,
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:8, padding:10,
              }}>
                <span style={{ fontSize:8.5, fontWeight:900, color:C.muted, letterSpacing:.5 }}>
                  ✏ SKETCH / TECH PACK
                </span>
                <SketchThumb src={sel.sketchLink} size={112} radius={8}/>
                <button style={{
                  fontSize:8.5, padding:"3px 11px",
                  border:`1px solid ${C.border}`, borderRadius:5,
                  background:C.surface, color:C.sub, cursor:"pointer",
                }}>↗ Open link</button>
              </div>

              {/* Header info */}
              <div style={{ flex:1, padding:"18px 20px", minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <span style={{
                    fontSize:24, fontWeight:900, color:C.orange,
                    fontFamily:"'IBM Plex Mono',monospace", lineHeight:1,
                  }}>{sel.code}</span>
                  <StatusBadge s={sel.status}/>
                </div>

                {sel.shortName && (
                  <div style={{ fontSize:10, color:C.muted, marginBottom:6 }}>"{sel.shortName}"</div>
                )}

                <div style={{
                  fontSize:14, fontWeight:800, color:C.text,
                  lineHeight:1.4, marginBottom:10,
                }}>{sel.desc}</div>

                {/* Attribute chips */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                  {[sel.gender, sel.l2Category, sel.l3Style, sel.fitType, sel.neckline, sel.sleeveType]
                    .filter(Boolean).map((v,i) => (
                    <span key={i} style={{
                      fontSize:9, padding:"3px 8px", borderRadius:8,
                      background:"#f1f5f9", color:"#475569", fontWeight:700,
                    }}>{v}</span>
                  ))}
                  {sel.season && String(sel.season).split(",").map(s => (
                    <span key={s} style={{
                      fontSize:9, padding:"3px 8px", borderRadius:8,
                      background:"#dbeafe", color:C.blue, fontWeight:700,
                    }}>{s.trim()}</span>
                  ))}
                </div>

                {sel.buyerStyle && (
                  <div style={{ fontSize:9.5, color:C.muted }}>
                    Buyer Style: <b style={{ color:C.sub }}>{sel.buyerStyle}</b>
                  </div>
                )}
              </div>
            </div>

            {/* Detail tabs */}
            <div style={{
              background:C.surface, borderBottom:`1px solid ${C.border}`,
              display:"flex", padding:"0 18px", flexShrink:0, alignItems:"center",
            }}>
              {[
                { id:"details", label:"📋 Item Details" },
                { id:"pricing", label:"₹ Pricing & Tax" },
                { id:"fabric",  label:"🧵 Fabric"       },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding:"9px 14px", border:"none", background:"transparent",
                  borderBottom:`2.5px solid ${tab===t.id ? C.orange : "transparent"}`,
                  fontSize:10.5, fontWeight:tab===t.id ? 900 : 700,
                  color:tab===t.id ? C.orange : C.sub,
                  cursor:"pointer", transition:"all .15s",
                }}>{t.label}</button>
              ))}
              <div style={{ flex:1 }}/>
              <button onClick={() => onEdit(sel)} style={{
                padding:"5px 16px",
                border:`1.5px solid ${C.orange}`, borderRadius:6,
                background:C.orangeSoft, color:C.orange,
                fontSize:10, fontWeight:900, cursor:"pointer",
              }}>✎ Edit Record</button>
            </div>

            {/* Tab content */}
            <div style={{ padding:"14px 18px" }}>

              {tab === "details" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px 14px" }}>
                  {[
                    { l:"L1 Division",  v:sel.l1Division  },
                    { l:"L2 Category",  v:sel.l2Category  },
                    { l:"L3 Style",     v:sel.l3Style     },
                    { l:"Gender",       v:sel.gender      },
                    { l:"Fit Type",     v:sel.fitType     },
                    { l:"Neckline",     v:sel.neckline    },
                    { l:"Sleeve Type",  v:sel.sleeveType  },
                    { l:"Size Range",   v:sel.sizeRange   },
                    { l:"⟷ Tags",       v:sel.tags, wide:true },
                    { l:"Remarks",      v:sel.remarks, wide:true },
                  ].map(f => (
                    <div key={f.l} style={{
                      gridColumn:f.wide ? "1/-1" : "auto",
                      background:C.surface, borderRadius:7,
                      padding:"8px 12px", border:`1px solid ${C.border}`,
                    }}>
                      <div style={{
                        fontSize:8, fontWeight:900, color:C.muted,
                        textTransform:"uppercase", letterSpacing:.5, marginBottom:4,
                      }}>{f.l}</div>
                      <div style={{
                        fontSize:12, fontWeight:700,
                        color:f.v ? C.text : C.dim,
                      }}>{f.v || "—"}</div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "pricing" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px 14px" }}>
                  {[
                    { l:"W.S.P",            v:sel.wsp        ? `₹${sel.wsp}`          : "—", mono:true },
                    { l:"MRP",              v:sel.mrp        ? `₹${sel.mrp}`          : "—", mono:true },
                    { l:"∑ Final Markup %", v:sel.markupPct  ? `${sel.markupPct}%`    : "—", mono:true, auto:true },
                    { l:"∑ Final Markdown %",v:sel.markdownPct?`${sel.markdownPct}%`  : "—", mono:true, auto:true },
                    { l:"HSN Code →",       v:sel.hsnCode    || "—",                         mono:true },
                    { l:"← GST %",          v:sel.gstPct     ? `${sel.gstPct}%`       : "—", mono:true, auto:true },
                  ].map(f => (
                    <div key={f.l} style={{
                      background:C.surface, borderRadius:7,
                      padding:"10px 14px", border:`1px solid ${C.border}`,
                    }}>
                      <div style={{
                        fontSize:8, fontWeight:900,
                        color:f.auto ? C.purple : C.muted,
                        textTransform:"uppercase", letterSpacing:.5, marginBottom:5,
                      }}>{f.l}</div>
                      <div style={{
                        fontSize:22, fontWeight:900,
                        fontFamily:"'IBM Plex Mono',monospace",
                        color:f.auto ? C.purple : C.text,
                      }}>{f.v}</div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "fabric" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 14px" }}>
                  {[
                    { l:"Main Fabric Code →", v:sel.mainFabric  || "—", mono:true },
                    { l:"← Fabric Name",      v:sel.fabricName  || "—", auto:true },
                    { l:"Color Code(s) →",    v:sel.colorCodes  || "—", mono:true },
                    { l:"Size Range",          v:sel.sizeRange   || "—" },
                  ].map(f => (
                    <div key={f.l} style={{
                      background:C.surface, borderRadius:7,
                      padding:"10px 14px", border:`1px solid ${C.border}`,
                    }}>
                      <div style={{
                        fontSize:8, fontWeight:900,
                        color:f.auto ? C.purple : C.muted,
                        textTransform:"uppercase", letterSpacing:.5, marginBottom:5,
                      }}>{f.l}</div>
                      <div style={{
                        fontSize:14, fontWeight:700,
                        fontFamily:f.mono ? "'IBM Plex Mono',monospace" : "inherit",
                        color:f.auto ? C.purple : C.text,
                      }}>{f.v}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        ) : (
          <div style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            color:C.muted, gap:8,
          }}>
            <div style={{ fontSize:32 }}>👕</div>
            <div style={{ fontSize:13 }}>Select an article to view details</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [view,   setView]   = useState("table");   // "table" | "split"
  const [search, setSearch] = useState("");
  const [toast,  setToast]  = useState(null);

  const rows = useMemo(() =>
    MOCK.filter(r => !search ||
      Object.values(r).some(v =>
        String(v||"").toLowerCase().includes(search.toLowerCase())
      )
    ), [search]
  );

  const handleEdit = useCallback(row => {
    setToast(`Opening editor for ${row.code}…`);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const sharedProps = {
    rows, allData:MOCK, search, onSearch:setSearch,
    view, onView:setView, onEdit:handleEdit,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;0,900&family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Nunito Sans',sans-serif; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:#c9d3df; border-radius:10px; }
        ::-webkit-scrollbar-track { background:transparent; }
        select option { background:#fff; color:#1a2332; }
        @keyframes toastIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div style={{
        display:"flex", flexDirection:"column", height:"100vh",
        fontFamily:"'Nunito Sans',sans-serif",
        background:C.bg, color:C.text, overflow:"hidden",
      }}>

        {/* ── SHELL BAR ── */}
        <div style={{
          height:44, flexShrink:0,
          background:C.slate,
          display:"flex", alignItems:"center",
          padding:"0 14px", gap:8,
          borderBottom:`1px solid ${C.slate3}`,
        }}>
          <div style={{
            width:26, height:26, borderRadius:6,
            background:C.red,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, flexShrink:0,
          }}>👕</div>
          <span style={{ fontSize:11, fontWeight:900, color:"#e2e8f0" }}>CC ERP</span>
          <span style={{ color:C.slate3, fontSize:12 }}>›</span>
          <span style={{ fontSize:9.5, color:"#64748b" }}>FILE 1A</span>
          <span style={{ color:C.slate3, fontSize:12 }}>›</span>
          <span style={{ fontSize:9.5, color:"#94a3b8" }}>ARTICLE_MASTER</span>
          <span style={{ color:C.slate3, fontSize:12 }}>›</span>
          <span style={{ fontSize:9.5, fontWeight:900, color:C.orange }}>Records</span>

          <div style={{ flex:1 }}/>

          {/* Status counters */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {[
              { s:"Active",       c:"#22c55e" },
              { s:"Development",  c:"#f59e0b" },
              { s:"Discontinued", c:"#ef4444" },
              { s:"Inactive",     c:"#94a3b8" },
            ].map(({ s, c }) => {
              const n = MOCK.filter(d => d.status===s).length;
              return n > 0 ? (
                <div key={s} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:c }}/>
                  <span style={{ fontSize:9, color:"#64748b", fontWeight:700 }}>{n} {s}</span>
                </div>
              ) : null;
            })}
          </div>

          <div style={{ width:1, height:20, background:C.slate3, margin:"0 6px" }}/>

          {/* Column legend */}
          {[
            { c:C.orange, l:"Manual" },
            { c:C.purple, l:"← Auto (GAS)" },
            { c:C.blue,   l:"→ FK" },
          ].map(i => (
            <div key={i.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:i.c }}/>
              <span style={{ fontSize:8.5, color:"#64748b" }}>{i.l}</span>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT (view-switched) ── */}
        <div style={{ flex:1, overflow:"hidden" }}>
          {view === "table"
            ? <TableView key="table" {...sharedProps}/>
            : <SplitView key="split" {...sharedProps}/>
          }
        </div>

        {/* ── TOAST ── */}
        {toast && (
          <div style={{
            position:"fixed", bottom:20, left:"50%",
            transform:"translateX(-50%)",
            padding:"9px 20px",
            background:C.slate, color:"#fff",
            borderRadius:8, fontSize:11, fontWeight:700,
            boxShadow:"0 8px 28px rgba(0,0,0,.22)",
            animation:"toastIn .25s ease",
            zIndex:9999,
          }}>{toast}</div>
        )}
      </div>
    </>
  );
}
