// TrimMasterTab.jsx — Layout View for Trim Master
// §LAYOUT_VIEW rules: CC_ERP_MODULE_display_SKILL.md
// Two exports: named TrimMasterLayoutPanel (for SheetWorkspace) + default TrimMasterTab (standalone)
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ── §LAYOUT_VIEW-A: Theme adapter ──
function toM(M) {
  return {
    ...M,
    hi: M.surfHigh, mid: M.surfMid, lo: M.surfLow,
    hov: M.hoverBg, inBg: M.inputBg, inBd: M.inputBd,
    div: M.divider, thd: M.tblHead, tev: M.tblEven, tod: M.tblOdd,
    bBg: M.badgeBg, bTx: M.badgeTx, scr: M.scrollThumb,
    tA: M.textA, tB: M.textB, tC: M.textC, tD: M.textD,
  };
}

const CC_RED = '#CC0000';
const CC_PUR = '#7C3AED';

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-B: GROUPABLE_FIELDS (~6 fields for L1/L2 group-by axes)
// ════════════════════════════════════════════════════════════════════════════
const GROUPABLE_FIELDS = [
  { key: "category",    label: "Category"  },
  { key: "subCat",      label: "Sub-Cat"   },
  { key: "uom",         label: "UOM"       },
  { key: "primarySupp", label: "Supplier"  },
  { key: "hsnCode",     label: "HSN"       },
  { key: "status",      label: "Status"    },
];

// §LAYOUT_VIEW-B: PRESETS (6 quick grouping combinations)
const PRESETS = [
  { label: "Category › Status",   l1: "category",    l2: "status"      },
  { label: "Category › UOM",      l1: "category",    l2: "uom"         },
  { label: "Category › Supplier", l1: "category",    l2: "primarySupp" },
  { label: "Supplier › Category", l1: "primarySupp", l2: "category"    },
  { label: "UOM › Category",      l1: "uom",         l2: "category"    },
  { label: "Status › Category",   l1: "status",      l2: "category"    },
];

// §LAYOUT_VIEW-B: hashColor — 12-color PALETTE for unknown/dynamic values
const PALETTE = ["#E8690A","#7C3AED","#15803D","#0078D4","#DC2626","#D97706","#059669","#2563EB","#DB2777","#0891B2","#65A30D","#9333EA"];
function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// §LAYOUT_VIEW-B: Color + icon per trim category code
const CATEGORY_META = {
  THD: { color: "#E8690A", icon: "🧵" },
  LBL: { color: "#7C3AED", icon: "🏷️" },
  ELS: { color: "#15803D", icon: "〰️" },
  ZIP: { color: "#0078D4", icon: "🤐" },
  BUT: { color: "#D97706", icon: "🔘" },
  TPE: { color: "#059669", icon: "📏" },
  DRW: { color: "#2563EB", icon: "🪢" },
  VLC: { color: "#DB2777", icon: "⊞"  },
  RVT: { color: "#0891B2", icon: "🔩" },
  THP: { color: "#65A30D", icon: "🖨️" },
  OTH: { color: "#6b7280", icon: "◆"  },
};
const STATUS_META = {
  Active:   { color: "#15803D", icon: "✅" },
  Inactive: { color: "#DC2626", icon: "⛔" },
};
// Category label map
const CAT_LABEL = {
  THD:"Thread", LBL:"Label", ELS:"Elastic", ZIP:"Zipper", BUT:"Button",
  TPE:"Tape", DRW:"Drawstring", VLC:"Velcro", RVT:"Rivet", THP:"Thermal Print", OTH:"Other",
};

// §LAYOUT_VIEW-B: getGroupMeta(field, value) → { color, icon }
function getGroupMeta(field, value) {
  if (field === "category")    return CATEGORY_META[value] || { color: hashColor(value), icon: "📦" };
  if (field === "status")      return STATUS_META[value]   || { color: hashColor(value), icon: "●"  };
  if (field === "uom")         return { color: hashColor(value), icon: "📐" };
  if (field === "primarySupp") return { color: hashColor(value), icon: "🏭" };
  if (field === "hsnCode")     return { color: hashColor(value), icon: "🏷"  };
  if (field === "subCat")      return { color: hashColor(value), icon: "📂" };
  return { color: hashColor(String(value)), icon: "◆" };
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-I: Filter / Sort engine
// ════════════════════════════════════════════════════════════════════════════
const CARD_FIELDS = [
  { key: "category",    type: "cat" },
  { key: "subCat",      type: "txt" },
  { key: "uom",         type: "cat" },
  { key: "status",      type: "cat" },
  { key: "primarySupp", type: "txt" },
  { key: "hsnCode",     type: "txt" },
  { key: "name",        type: "txt" },
  { key: "code",        type: "txt" },
  { key: "leadTime",    type: "num" },
  { key: "reorderLevel",type: "num" },
];

// §LAYOUT_VIEW-I: cat filter ops include 'contains' and 'starts with' (per §LAYOUT_VIEW-I fix)
const FILTER_OPS = {
  cat: ['is', 'is not', 'contains', 'starts with'],
  txt: ['contains', 'not contains', 'starts with'],
  num: ['=', '≠', '>', '<', '≥', '≤'],
};

function evalFilter(trim, { field, op, value }) {
  const fMeta  = CARD_FIELDS.find(f => f.key === field);
  const tVal   = trim[field];
  if (fMeta?.type === 'num') {
    const n = parseFloat(tVal), v = parseFloat(value);
    if (isNaN(n) || isNaN(v)) return true;
    return op==='='?n===v:op==='≠'?n!==v:op==='>'?n>v:op==='<'?n<v:op==='≥'?n>=v:n<=v;
  }
  if (fMeta?.type === 'txt' || op === 'contains' || op === 'not contains' || op === 'starts with') {
    const s = String(tVal||'').toLowerCase(), v = String(value||'').toLowerCase();
    return op==='contains'?s.includes(v):op==='not contains'?!s.includes(v):s.startsWith(v);
  }
  // cat: 'is' / 'is not'
  return op === 'is' ? tVal === value : tVal !== value;
}

// §LAYOUT_VIEW-I: 10 sort modes
const SORT_MODES = [
  { value: 'a_z',       label: 'A → Z'               },
  { value: 'z_a',       label: 'Z → A'               },
  { value: 'nil_first', label: 'Nil / Empty First'    },
  { value: 'nil_last',  label: 'Nil / Empty Last'     },
  { value: 'freq_hi',   label: 'Most Frequent First'  },
  { value: 'freq_lo',   label: 'Least Frequent First' },
  { value: 'num_lo',    label: 'Lowest → Highest'     },
  { value: 'num_hi',    label: 'Highest → Lowest'     },
  { value: 'val_first', label: 'Value is… First'      },
  { value: 'val_last',  label: 'Value is… Last'       },
];

function applyMultiSort(arr, sorts, freqMaps) {
  if (!sorts.length) return arr;
  return [...arr].sort((a, b) => {
    for (const s of sorts) {
      const av = a[s.field] ?? '', bv = b[s.field] ?? '';
      const ae = av === '' || av == null, be = bv === '' || bv == null;
      let cmp = 0;
      if      (s.mode==='nil_first') { if(ae!==be){cmp=ae?-1:1;} else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='nil_last')  { if(ae!==be){cmp=ae?1:-1;} else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='freq_hi')   { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fb-fa; }
      else if (s.mode==='freq_lo')   { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fa-fb; }
      else if (s.mode==='num_lo')    cmp=parseFloat(av||0)-parseFloat(bv||0);
      else if (s.mode==='num_hi')    cmp=parseFloat(bv||0)-parseFloat(av||0);
      else if (s.mode==='val_first') { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm)cmp=am?-1:1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='val_last')  { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm)cmp=am?1:-1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='z_a')       cmp=String(bv).localeCompare(String(av),undefined,{sensitivity:'base'});
      else                           cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'});
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-B: TRM_SCHEMA — detail modal field definitions
//   Flags: mono | badge | required | full (span both cols in Card layout)
// ════════════════════════════════════════════════════════════════════════════
const TRM_SCHEMA = [
  { key: "code",          label: "Trim Code",     mono: true, required: true  },
  { key: "name",          label: "Trim Name",     required: true, full: true   },
  { key: "category",      label: "Category",      badge: true                  },
  { key: "subCat",        label: "Sub-Category"                                },
  { key: "uom",           label: "UOM"                                         },
  { key: "colourCode",    label: "Colour Code",   mono: true                  },
  { key: "colourName",    label: "Shade Name"                                  },
  { key: "hsnCode",       label: "HSN Code",      mono: true                  },
  { key: "gstPct",        label: "GST %"                                       },
  { key: "primarySupp",   label: "Supplier",      mono: true                  },
  { key: "leadTime",      label: "Lead Days"                                   },
  { key: "reorderLevel",  label: "Reorder Lvl"                                 },
  { key: "status",        label: "Status",        badge: true                  },
  { key: "remarks",       label: "Remarks",       full: true                   },
];

// §LAYOUT_VIEW-B: DISPLAY_FIELDS used in ViewOptionsPanel
const DISPLAY_FIELDS = [
  { key: "code",         label: "Trim Code"    },
  { key: "category",     label: "Category"     },
  { key: "subCat",       label: "Sub-Cat"      },
  { key: "uom",          label: "UOM"          },
  { key: "colourCode",   label: "Colour Code"  },
  { key: "hsnCode",      label: "HSN Code"     },
  { key: "gstPct",       label: "GST %"        },
  { key: "primarySupp",  label: "Supplier"     },
  { key: "leadTime",     label: "Lead Days"    },
  { key: "reorderLevel", label: "Reorder Lvl"  },
  { key: "status",       label: "Status"       },
];
const INIT_SHOW_FIELDS = Object.fromEntries(
  DISPLAY_FIELDS.map(f => [f.key, ["code","category","uom","status"].includes(f.key)])
);
const INIT_DISPLAY_OPTS = { thumbnail: false, thumbSize: "md", density: "summary", showFields: INIT_SHOW_FIELDS };

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-B: STATUS_BG / STATUS_TX for detail modal badge coloring
// ════════════════════════════════════════════════════════════════════════════
const STATUS_BG = { Active: "#d1fae5", Inactive: "#fee2e2" };
const STATUS_TX = { Active: "#065f46", Inactive: "#991b1b" };

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-B: TRM_DATA — 15 seed records covering all 11 categories
// ════════════════════════════════════════════════════════════════════════════
const TRM_DATA = [
  // THD — Thread (2)
  { code:"TRM-THD-001", name:"30s Poly Thread Black",      category:"THD", subCat:"Polyester", uom:"CONE", colourCode:"CLR-001", colourName:"Black",       hsnCode:"5204", gstPct:"5%",  primarySupp:"SUP-001", leadTime:7,  reorderLevel:50,  status:"Active"   },
  { code:"TRM-THD-002", name:"40s Poly Thread White",      category:"THD", subCat:"Polyester", uom:"CONE", colourCode:"CLR-002", colourName:"White",       hsnCode:"5204", gstPct:"5%",  primarySupp:"SUP-001", leadTime:7,  reorderLevel:50,  status:"Active"   },
  // LBL — Label (1)
  { code:"TRM-LBL-001", name:"Main Brand Woven Label",     category:"LBL", subCat:"Woven",     uom:"PCS",  colourCode:"",        colourName:"",            hsnCode:"5807", gstPct:"12%", primarySupp:"SUP-002", leadTime:14, reorderLevel:500, status:"Active"   },
  // ELS — Elastic (2)
  { code:"TRM-ELS-001", name:"25mm Waistband Elastic",     category:"ELS", subCat:"Waistband", uom:"MTR",  colourCode:"CLR-002", colourName:"White",       hsnCode:"5604", gstPct:"5%",  primarySupp:"SUP-001", leadTime:10, reorderLevel:100, status:"Active"   },
  { code:"TRM-ELS-002", name:"10mm Flat Elastic Black",    category:"ELS", subCat:"Flat",      uom:"MTR",  colourCode:"CLR-001", colourName:"Black",       hsnCode:"5604", gstPct:"5%",  primarySupp:"SUP-001", leadTime:10, reorderLevel:200, status:"Active"   },
  // ZIP — Zipper (2)
  { code:"TRM-ZIP-001", name:"Brass Jeans Zipper 17cm",    category:"ZIP", subCat:"Metal",     uom:"PCS",  colourCode:"CLR-004", colourName:"Antique Brass",hsnCode:"9607", gstPct:"18%", primarySupp:"SUP-002", leadTime:21, reorderLevel:200, status:"Active"   },
  { code:"TRM-ZIP-002", name:"Nylon Coil Zipper 35cm",     category:"ZIP", subCat:"Nylon",     uom:"PCS",  colourCode:"CLR-001", colourName:"Black",       hsnCode:"9607", gstPct:"18%", primarySupp:"SUP-002", leadTime:14, reorderLevel:300, status:"Active"   },
  // BUT — Button (1)
  { code:"TRM-BUT-001", name:"4-Hole Shirt Button 15mm",   category:"BUT", subCat:"Poly",      uom:"PCS",  colourCode:"CLR-002", colourName:"White",       hsnCode:"9606", gstPct:"18%", primarySupp:"SUP-003", leadTime:10, reorderLevel:1000,status:"Active"   },
  // TPE — Tape (1)
  { code:"TRM-TPE-001", name:"Herringbone Tape 15mm",      category:"TPE", subCat:"Woven",     uom:"MTR",  colourCode:"CLR-001", colourName:"Black",       hsnCode:"5806", gstPct:"12%", primarySupp:"SUP-001", leadTime:7,  reorderLevel:300, status:"Active"   },
  // DRW — Drawstring (1)
  { code:"TRM-DRW-001", name:"6mm Flat Drawcord Natural",  category:"DRW", subCat:"Cotton",    uom:"MTR",  colourCode:"CLR-003", colourName:"Off-White",   hsnCode:"5606", gstPct:"5%",  primarySupp:"SUP-001", leadTime:10, reorderLevel:150, status:"Active"   },
  // VLC — Velcro (1)
  { code:"TRM-VLC-001", name:"Hook & Loop Tape 25mm",      category:"VLC", subCat:"Standard",  uom:"MTR",  colourCode:"CLR-002", colourName:"White",       hsnCode:"5811", gstPct:"12%", primarySupp:"SUP-002", leadTime:14, reorderLevel:50,  status:"Active"   },
  // RVT — Rivet (1)
  { code:"TRM-RVT-001", name:"Copper Tack Button 10mm",    category:"RVT", subCat:"Copper",    uom:"SET",  colourCode:"CLR-004", colourName:"Copper",      hsnCode:"8308", gstPct:"18%", primarySupp:"SUP-003", leadTime:21, reorderLevel:500, status:"Active"   },
  // THP — Thermal Print (1)
  { code:"TRM-THP-001", name:"Care Label Thermal Transfer", category:"THP", subCat:"Transfer",  uom:"PCS",  colourCode:"",        colourName:"",            hsnCode:"4817", gstPct:"12%", primarySupp:"SUP-002", leadTime:7,  reorderLevel:200, status:"Inactive" },
  // OTH — Other (2)
  { code:"TRM-OTH-001", name:"Pocket Bag Fabric White",    category:"OTH", subCat:"Fabric",    uom:"MTR",  colourCode:"CLR-002", colourName:"White",       hsnCode:"5208", gstPct:"5%",  primarySupp:"SUP-001", leadTime:14, reorderLevel:100, status:"Active"   },
  { code:"TRM-OTH-002", name:"Bar Tack Stitching Label",   category:"OTH", subCat:"Label",     uom:"PCS",  colourCode:"",        colourName:"",            hsnCode:"5807", gstPct:"12%", primarySupp:"SUP-003", leadTime:21, reorderLevel:300, status:"Inactive" },
];

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-N: ToggleSwitch
// ════════════════════════════════════════════════════════════════════════════
function ToggleSwitch({ on, onChange, A }) {
  return (
    <div onClick={onChange} title={on ? "On" : "Off"}
      style={{ width:30, height:16, borderRadius:8, background:on?A.a:'#aaa', cursor:'pointer', position:'relative', transition:'background .15s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left:on?16:2, width:12, height:12, borderRadius:6, background:'#fff', transition:'left .15s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-N: TrmThumbnail — initials avatar or image
// ════════════════════════════════════════════════════════════════════════════
function TrmThumbnail({ trim, size, color, cover = false }) {
  const initials = (trim.name || trim.code || "TR").slice(0, 2).toUpperCase();
  if (cover) {
    const h = size === "sm" ? 60 : size === "lg" ? 120 : 88;
    return trim.imageLink
      ? <img src={trim.imageLink} alt="" style={{ width:'100%', height:h, objectFit:'cover', display:'block' }} />
      : <div style={{ width:'100%', height:h, background:`linear-gradient(135deg,${color}28,${color}0c)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', flexShrink:0 }}>
          <span style={{ fontSize:h*0.36, fontWeight:900, color:color+'55', fontFamily:'monospace', letterSpacing:4 }}>{initials}</span>
          <span style={{ position:'absolute', right:7, bottom:5, fontSize:8, fontWeight:900, color, background:color+'18', padding:'1px 5px', borderRadius:4, fontFamily:'monospace' }}>{trim.code}</span>
        </div>;
  }
  const sz = size === "sm" ? 28 : size === "lg" ? 54 : 40;
  const fs = size === "sm" ? 9 : size === "lg" ? 17 : 13;
  return trim.imageLink
    ? <img src={trim.imageLink} alt="" style={{ width:sz, height:sz, objectFit:'cover', borderRadius:size==="sm"?4:7, flexShrink:0 }} />
    : <div style={{ width:sz, height:sz, borderRadius:size==="sm"?4:7, background:color+'1a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${color}30` }}>
        <span style={{ fontSize:fs, fontWeight:900, color, fontFamily:'monospace' }}>{initials}</span>
      </div>;
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-N: StatusBadge — colored pill
// ════════════════════════════════════════════════════════════════════════════
function StatusBadge({ status }) {
  const bg = STATUS_BG[status] || '#f3f4f6';
  const tx = STATUS_TX[status] || '#6b7280';
  return (
    <span style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:10, background:bg, color:tx, whiteSpace:'nowrap', flexShrink:0 }}>{status}</span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-N: TrmListRow — list row for Classic/Hierarchy/Column views
// ════════════════════════════════════════════════════════════════════════════
function TrmListRow({ trim, displayOpts, color, M, A, uff, dff, fz }) {
  const { thumbnail, thumbSize, density, showFields: sf } = displayOpts;
  const det = density === "detail";
  return (
    <div style={{ display:'flex', alignItems:thumbnail&&thumbSize!=="sm"?'flex-start':'center', gap:10 }}>
      {thumbnail && <TrmThumbnail trim={trim} size={thumbSize} color={color} />}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Line 1: code + name + status */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'nowrap', overflow:'hidden' }}>
          {sf.code    && <span style={{ fontSize:9, fontWeight:900, color, fontFamily:dff, flexShrink:0 }}>{trim.code}</span>}
          <span style={{ fontSize:fz-1, fontWeight:700, color:M.tA, fontFamily:uff, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{trim.name}</span>
          {sf.status  && <StatusBadge status={trim.status} />}
        </div>
        {/* Line 2: category + UOM pills */}
        {(sf.category || sf.uom || (det && (sf.subCat || sf.hsnCode || sf.primarySupp))) && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:2 }}>
            {sf.category   && trim.category    && <span style={{ fontSize:7.5, padding:'1px 5px', borderRadius:6, background:color+'14', color, fontFamily:uff, fontWeight:700 }}>{CAT_LABEL[trim.category]||trim.category}</span>}
            {sf.uom        && trim.uom          && <span style={{ fontSize:7.5, padding:'1px 5px', borderRadius:6, background:M.mid, color:M.tC, fontFamily:uff, fontWeight:700 }}>{trim.uom}</span>}
            {det && sf.subCat     && trim.subCat     && <span style={{ fontSize:7.5, padding:'1px 5px', borderRadius:6, background:color+'12', color, fontFamily:uff }}>{trim.subCat}</span>}
            {det && sf.primarySupp&& trim.primarySupp&& <span style={{ fontSize:7.5, padding:'1px 5px', borderRadius:6, background:M.mid, color:M.tD, fontFamily:uff }}>{trim.primarySupp}</span>}
          </div>
        )}
        {/* Line 3: detail meta */}
        {det && (sf.hsnCode || sf.gstPct || sf.leadTime || sf.reorderLevel || sf.colourCode) && (
          <div style={{ display:'flex', gap:10, marginTop:2, flexWrap:'wrap' }}>
            {sf.hsnCode     && trim.hsnCode     && <span style={{ fontSize:8, color:M.tD, fontFamily:uff }}><b>HSN</b> {trim.hsnCode}</span>}
            {sf.gstPct      && trim.gstPct      && <span style={{ fontSize:8, color:M.tD, fontFamily:uff }}><b>GST</b> {trim.gstPct}</span>}
            {sf.leadTime    && trim.leadTime     && <span style={{ fontSize:8, color:M.tD, fontFamily:uff }}><b>Lead</b> {trim.leadTime}d</span>}
            {sf.reorderLevel&& trim.reorderLevel && <span style={{ fontSize:8, color:M.tD, fontFamily:uff }}><b>ROL</b> {trim.reorderLevel}</span>}
            {sf.colourCode  && trim.colourName   && <span style={{ fontSize:8, color:M.tD, fontFamily:uff }}><b>Colour</b> {trim.colourName}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-N: TrmCoverCard — card for Cards view
// ════════════════════════════════════════════════════════════════════════════
function TrmCoverCard({ trim, displayOpts, color, M, A, uff, dff, fz, onClick }) {
  const { thumbSize } = displayOpts;
  const minW = thumbSize === 'sm' ? 110 : thumbSize === 'lg' ? 200 : 150;
  return (
    <div onClick={onClick}
      style={{ background:M.hi, border:`1.5px solid ${M.div}`, borderRadius:10, overflow:'hidden', transition:'all .15s', boxShadow:'0 1px 4px rgba(0,0,0,.06)', minWidth:minW, cursor:onClick?'pointer':'default' }}
      onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 4px 16px ${color}28`; e.currentTarget.style.borderColor=color; }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'; e.currentTarget.style.borderColor=M.div; }}>
      <TrmThumbnail trim={trim} size={thumbSize} color={color} cover />
      <div style={{ padding:'7px 9px 9px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:4, marginBottom:3 }}>
          <span style={{ fontSize:8.5, fontWeight:900, color, fontFamily:dff, flexShrink:0 }}>{trim.code}</span>
          <StatusBadge status={trim.status} />
        </div>
        <div style={{ fontSize:fz-1, fontWeight:800, color:M.tA, fontFamily:uff, lineHeight:1.3, marginBottom:4 }}>{trim.name}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
          {trim.category && <span style={{ fontSize:7.5, padding:'1px 5px', borderRadius:6, background:`${color}14`, color, fontFamily:uff, fontWeight:700 }}>{CAT_LABEL[trim.category]||trim.category}</span>}
          {trim.uom      && <span style={{ fontSize:7.5, padding:'1px 5px', borderRadius:6, background:M.mid, color:M.tC, fontFamily:uff, fontWeight:700 }}>{trim.uom}</span>}
        </div>
        {(trim.leadTime||trim.reorderLevel) && (
          <div style={{ marginTop:5, paddingTop:5, borderTop:`1px solid ${M.div}`, display:'flex', gap:8 }}>
            {trim.leadTime     && <span style={{ fontSize:8, color:M.tD, fontFamily:uff }}><b style={{color:M.tB}}>Lead</b> {trim.leadTime}d</span>}
            {trim.reorderLevel && <span style={{ fontSize:8, color:M.tD, fontFamily:uff }}><b style={{color:M.tB}}>ROL</b> {trim.reorderLevel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-J: ViewOptionsPanel — floating Properties panel
// ════════════════════════════════════════════════════════════════════════════
function ViewOptionsPanel({ displayOpts, setDisplayOpts, onClose, M, A, uff }) {
  const panelRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const setOpt      = (key, val) => setDisplayOpts(p => ({ ...p, [key]: val }));
  const toggleField = (key)      => setDisplayOpts(p => ({ ...p, showFields: { ...p.showFields, [key]: !p.showFields[key] } }));
  const allOn  = () => setDisplayOpts(p => ({ ...p, showFields: Object.fromEntries(DISPLAY_FIELDS.map(f => [f.key, true]))  }));
  const allOff = () => setDisplayOpts(p => ({ ...p, showFields: Object.fromEntries(DISPLAY_FIELDS.map(f => [f.key, false])) }));

  const rowS = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0' };
  const secS = { padding:'10px 14px', borderBottom:`1px solid ${M.div}` };
  const lblS = { fontSize:10, fontWeight:700, color:M.tB, fontFamily:uff };
  const pill = (active) => ({ flex:1, padding:'3px 0', border:`1px solid ${active?A.a:M.div}`, borderRadius:5, background:active?A.al:'transparent', color:active?A.a:M.tC, fontSize:9, fontWeight:active?800:500, cursor:'pointer', fontFamily:uff });

  return (
    <div ref={panelRef} style={{ position:'absolute', right:0, top:34, zIndex:950, width:248, background:M.hi, border:`1px solid ${M.div}`, borderRadius:10, boxShadow:'0 8px 32px rgba(0,0,0,.20)', overflow:'hidden' }}>
      <div style={{ padding:'9px 14px', borderBottom:`1px solid ${M.div}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:M.thd }}>
        <span style={{ fontSize:11, fontWeight:900, color:M.tA, fontFamily:uff }}>⚙ View Options</span>
        <button onClick={onClose} style={{ border:'none', background:'transparent', color:M.tD, cursor:'pointer', fontSize:16, lineHeight:1 }}>×</button>
      </div>
      {/* Thumbnail */}
      <div style={secS}>
        <div style={rowS}>
          <span style={lblS}>🖼 Thumbnail</span>
          <ToggleSwitch on={displayOpts.thumbnail} onChange={() => setOpt('thumbnail', !displayOpts.thumbnail)} A={A} />
        </div>
        {displayOpts.thumbnail && (
          <>
            <div style={{ fontSize:9, color:M.tD, fontFamily:uff, marginTop:6, marginBottom:4 }}>Size</div>
            <div style={{ display:'flex', gap:4, marginTop:4 }}>
              {[['sm','Small'],['md','Medium'],['lg','Large']].map(([v,l]) => (
                <button key={v} onClick={() => setOpt('thumbSize', v)} style={pill(displayOpts.thumbSize===v)}>{l}</button>
              ))}
            </div>
            <div style={{ fontSize:9, color:M.tD, fontFamily:uff, marginTop:6, marginBottom:4 }}>Display style</div>
            <div style={{ display:'flex', gap:4, marginTop:4 }}>
              {[['icon','Icon'],['cover','Cover']].map(([v,l]) => (
                <button key={v} onClick={() => setOpt('thumbMode', v)} style={pill((displayOpts.thumbMode||'icon')===v)}>{l}</button>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Detail Level */}
      <div style={secS}>
        <div style={{ ...lblS, marginBottom:7 }}>Detail Level</div>
        <div style={{ display:'flex', gap:4 }}>
          {[['summary','Summary'],['detail','Detail']].map(([v,l]) => (
            <button key={v} onClick={() => setOpt('density', v)} style={pill(displayOpts.density===v)}>{l}</button>
          ))}
        </div>
      </div>
      {/* Fields */}
      <div style={{ padding:'10px 14px', maxHeight:260, overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:9, fontWeight:900, color:M.tD, fontFamily:uff, textTransform:'uppercase', letterSpacing:.6 }}>Properties</span>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={allOn}  style={{ fontSize:8, color:A.a,  background:'none', border:'none', cursor:'pointer', fontFamily:uff, fontWeight:700 }}>All on</button>
            <button onClick={allOff} style={{ fontSize:8, color:M.tD, background:'none', border:'none', cursor:'pointer', fontFamily:uff }}>All off</button>
          </div>
        </div>
        {DISPLAY_FIELDS.map((f,fi) => (
          <div key={f.key} style={{ ...rowS, borderBottom:fi<DISPLAY_FIELDS.length-1?`1px solid ${M.div}28`:'none' }}>
            <span style={{ fontSize:10, color:displayOpts.showFields[f.key]?M.tA:M.tD, fontFamily:uff }}>{f.label}</span>
            <ToggleSwitch on={!!displayOpts.showFields[f.key]} onChange={() => toggleField(f.key)} A={A} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-K: TrmDetailModal — 3-layout popup (Card / Table / JSON)
// ════════════════════════════════════════════════════════════════════════════
function TrmDetailModal({ trim, onClose, onPrev, onNext, trimIndex, totalTrims, onEdit, canEdit, M, A, uff, dff, fz }) {
  const [layout, setLayout] = useState('card');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onPrev();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onNext();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, onPrev, onNext]);

  const copyJSON = () => {
    const clean = Object.fromEntries(Object.entries(trim));
    navigator.clipboard.writeText(JSON.stringify(clean, null, 2)).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };

  const lBtn = (id, icon, label) => ({
    onClick: () => setLayout(id),
    style: { padding:'4px 10px', border:`1px solid ${layout===id?A.a:M.div}`, borderRadius:5, background:layout===id?A.al:'transparent', color:layout===id?A.a:M.tB, fontSize:10, fontWeight:layout===id?800:500, cursor:'pointer', fontFamily:uff, display:'flex', alignItems:'center', gap:4 }
  });

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:680, maxWidth:'95vw', maxHeight:'88vh', display:'flex', flexDirection:'column', background:M.hi, borderRadius:14, overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,.35)' }}>

        {/* Header */}
        <div style={{ background:A.a, padding:'12px 18px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ fontSize:13, fontWeight:900, color:'#fff', fontFamily:uff, flex:1 }}>📋 Record Detail</span>
          <div style={{ display:'flex', gap:5 }}>
            <button {...lBtn('card',  '▦','Card'  )}><span>▦</span>Card</button>
            <button {...lBtn('table', '≡','Table' )}><span>≡</span>Table</button>
            <button {...lBtn('json',  '{}','JSON'  )}><span style={{fontFamily:'monospace'}}>{'{ }'}</span>JSON</button>
          </div>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,.3)', margin:'0 4px' }}/>
          {canEdit && onEdit
            ? <button onClick={() => onEdit(trim)} style={{ padding:'4px 12px', border:'none', borderRadius:5, background:'rgba(255,255,255,.15)', color:'#fff', fontSize:10, fontWeight:800, cursor:'pointer', fontFamily:uff }}>✏ Edit</button>
            : <span style={{ fontSize:9, color:'rgba(255,255,255,.65)', fontFamily:uff }}>🔒 Read Only</span>}
          <button onClick={onClose} style={{ border:'none', background:'rgba(255,255,255,.12)', color:'#fff', borderRadius:5, width:26, height:26, cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Subtitle */}
        <div style={{ background:A.a+'dd', padding:'5px 18px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,.75)', fontFamily:dff, fontWeight:700 }}>{trim.code}</span>
          <StatusBadge status={trim.status} />
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:layout==='json'?0:undefined }}>
          {layout === 'card' && (
            <div style={{ padding:'18px 20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 20px' }}>
                {TRM_SCHEMA.map(f => {
                  const val = trim[f.key];
                  const hasVal = val !== undefined && val !== null && val !== '';
                  return (
                    <div key={f.key} style={f.full ? { gridColumn:'1 / -1' } : undefined}>
                      <div style={{ fontSize:8.5, fontWeight:900, color:M.tD, textTransform:'uppercase', letterSpacing:.5, marginBottom:4, fontFamily:uff }}>
                        {f.label}{f.required && <span style={{ color:'#ef4444', marginLeft:3 }}>*</span>}
                      </div>
                      <div style={{ fontSize:fz, fontWeight:f.key==='code'?800:400, color:f.key==='code'?A.a:M.tA, fontFamily:f.mono?dff:uff, padding:'6px 10px', background:M.mid, borderRadius:5, minHeight:28, display:'flex', alignItems:'center', border:`1px solid ${M.div}` }}>
                        {hasVal
                          ? f.badge ? <StatusBadge status={String(val)} /> : String(val)
                          : <span style={{ color:M.tD, fontStyle:'italic', fontSize:fz-2 }}>—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {layout === 'table' && (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                <tr>
                  <th style={{ padding:'8px 16px', background:M.thd, textAlign:'left', fontSize:9, fontWeight:900, color:M.tD, textTransform:'uppercase', letterSpacing:.6, fontFamily:uff, borderBottom:`2px solid ${M.div}` }}>Field</th>
                  <th style={{ padding:'8px 16px', background:M.thd, textAlign:'left', fontSize:9, fontWeight:900, color:M.tD, textTransform:'uppercase', letterSpacing:.6, fontFamily:uff, borderBottom:`2px solid ${M.div}` }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {TRM_SCHEMA.map((f,fi) => {
                  const val = trim[f.key];
                  const hasVal = val !== undefined && val !== null && val !== '';
                  return (
                    <tr key={f.key} style={{ background:fi%2===0?M.tev:M.tod }}>
                      <td style={{ padding:'7px 16px', fontSize:10, fontWeight:700, color:M.tB, fontFamily:uff, whiteSpace:'nowrap', borderBottom:`1px solid ${M.div}` }}>{f.label}</td>
                      <td style={{ padding:'7px 16px', fontSize:fz-1, color:M.tA, fontFamily:f.mono?dff:uff, borderBottom:`1px solid ${M.div}` }}>
                        {hasVal
                          ? f.badge ? <StatusBadge status={String(val)} /> : String(val)
                          : <span style={{ color:M.tD, fontStyle:'italic' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {layout === 'json' && (
            <div style={{ position:'relative' }}>
              <button onClick={copyJSON} style={{ position:'absolute', top:12, right:12, padding:'4px 10px', border:'none', borderRadius:5, background:copied?'#15803d':'#334155', color:'#fff', fontSize:9, fontWeight:700, cursor:'pointer', zIndex:10 }}>
                {copied ? '✓ Copied!' : '⧉ Copy JSON'}
              </button>
              <pre style={{ margin:0, padding:'18px 20px', background:'#0f172a', color:'#e2e8f0', fontSize:12, lineHeight:1.7, fontFamily:'monospace', whiteSpace:'pre-wrap', wordBreak:'break-word', minHeight:240 }}>
                {JSON.stringify(trim, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'10px 18px', borderTop:`1px solid ${M.div}`, display:'flex', alignItems:'center', gap:8, flexShrink:0, background:M.mid }}>
          <button onClick={onPrev} style={{ padding:'5px 12px', border:`1px solid ${M.div}`, borderRadius:5, background:M.hi, color:M.tB, fontSize:11, cursor:'pointer' }}>‹</button>
          <span style={{ fontSize:9, color:M.tD, fontFamily:uff }}>{trimIndex+1} / {totalTrims}</span>
          <button onClick={onNext} style={{ padding:'5px 12px', border:`1px solid ${M.div}`, borderRadius:5, background:M.hi, color:M.tB, fontSize:11, cursor:'pointer' }}>›</button>
          <div style={{ width:1, height:18, background:M.div, margin:'0 4px' }}/>
          <button onClick={() => window.print()} style={{ padding:'5px 10px', border:`1px solid ${M.div}`, borderRadius:5, background:M.hi, color:M.tB, fontSize:10, cursor:'pointer', fontFamily:uff }}>🖨 Print</button>
          <button style={{ padding:'5px 10px', border:`1px solid ${M.div}`, borderRadius:5, background:M.hi, color:M.tB, fontSize:10, cursor:'pointer', fontFamily:uff }}>⬇ Export</button>
          <div style={{ flex:1 }}/>
          <button onClick={onClose} style={{ padding:'5px 14px', border:`1px solid ${M.div}`, borderRadius:5, background:M.hi, color:M.tB, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:uff }}>Close</button>
          {canEdit && onEdit
            ? <button onClick={() => { onEdit(trim); onClose(); }} style={{ padding:'5px 14px', border:'none', borderRadius:5, background:A.a, color:'#fff', fontSize:10, fontWeight:900, cursor:'pointer', fontFamily:uff }}>✏ Edit Record</button>
            : <span style={{ fontSize:9, color:M.tD, fontFamily:uff, padding:'5px 0' }}>🔒 No Edit Rights — Contact Admin</span>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-N: LayoutViewSaveModal — name + icon + color picker
// ════════════════════════════════════════════════════════════════════════════
const LV_VICONS = ["⚡","📋","▦","⊞","🌳","⟁","≡","🎯","✅","📊","📦","🔗","⚙","🔑"];
const LV_VCOLORS = ["#E8690A","#0078D4","#15803D","#7C3AED","#BE123C","#854d0e","#059669","#6b7280"];

function LayoutViewSaveModal({ onSave, onClose, M, A, uff }) {
  const [name,  setName]  = useState("");
  const [icon,  setIcon]  = useState("📋");
  const [color, setColor] = useState("#7C3AED");
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2500, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:340, background:M.hi, borderRadius:12, overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,.3)' }}>
        <div style={{ padding:'14px 18px', background:A.a, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, fontWeight:900, color:'#fff', fontFamily:uff }}>💾 Save View</span>
          <button onClick={onClose} style={{ border:'none', background:'transparent', color:'rgba(255,255,255,.7)', fontSize:18, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'18px' }}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:900, color:M.tD, textTransform:'uppercase', letterSpacing:.6, fontFamily:uff, marginBottom:5 }}>View Name</div>
            <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&name.trim()&&onSave({name:name.trim(),icon,color})} placeholder="e.g. My ZIP View…" style={{ width:'100%', padding:'7px 10px', border:`1.5px solid ${M.inBd}`, borderRadius:6, background:M.inBg, color:M.tA, fontSize:12, fontFamily:uff, outline:'none', boxSizing:'border-box' }}/>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:900, color:M.tD, textTransform:'uppercase', letterSpacing:.6, fontFamily:uff, marginBottom:5 }}>Icon</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {LV_VICONS.map(ic => <button key={ic} onClick={()=>setIcon(ic)} style={{ width:28, height:28, fontSize:15, border:`1.5px solid ${icon===ic?A.a:M.div}`, borderRadius:5, background:icon===ic?A.al:'transparent', cursor:'pointer' }}>{ic}</button>)}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:9, fontWeight:900, color:M.tD, textTransform:'uppercase', letterSpacing:.6, fontFamily:uff, marginBottom:5 }}>Color</div>
            <div style={{ display:'flex', gap:6 }}>
              {LV_VCOLORS.map(c => <button key={c} onClick={()=>setColor(c)} style={{ width:22, height:22, borderRadius:'50%', background:c, border:`2px solid ${color===c?M.tA:'transparent'}`, cursor:'pointer' }}/>)}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => name.trim() && onSave({ name: name.trim(), icon, color })} disabled={!name.trim()} style={{ flex:1, padding:'8px', border:'none', borderRadius:6, background:name.trim()?A.a:'#ccc', color:'#fff', fontSize:11, fontWeight:900, cursor:name.trim()?'pointer':'default', fontFamily:uff }}>💾 Save View</button>
            <button onClick={onClose} style={{ padding:'8px 14px', border:`1px solid ${M.div}`, borderRadius:6, background:M.hi, color:M.tB, fontSize:10, cursor:'pointer', fontFamily:uff }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-E: PROPS_VIEWS — tabs that support Properties panel (not matrix)
// ════════════════════════════════════════════════════════════════════════════
const PROPS_VIEWS = ["classic","hierarchy","column","cards"];

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-N: 5 Layout Sub-Views
// ════════════════════════════════════════════════════════════════════════════

// ── TrmClassicView — zoom + horizontal columns per L1 + expand/collapse (matches AM_ClassicTree) ──
function TrmClassicView({ data, groupByL1, groupByL2, displayOpts, M, A, uff, dff, fz, onSelect }) {
  const [zoom,      setZoom]      = useState(100);
  const [collapsed, setCollapsed] = useState({});

  const hierarchy = useMemo(() => {
    const map = {};
    data.forEach(t => {
      const k1 = t[groupByL1] || '(blank)';
      if (!map[k1]) map[k1] = {};
      const k2 = t[groupByL2] || '(blank)';
      if (!map[k1][k2]) map[k1][k2] = [];
      map[k1][k2].push(t);
    });
    return Object.entries(map).map(([l1, l2map]) => {
      const meta = getGroupMeta(groupByL1, l1);
      return { label: l1, color: meta.color, icon: meta.icon, l2s: l2map };
    });
  }, [data, groupByL1, groupByL2]);

  const toggle      = key => setCollapsed(p => ({ ...p, [key]: !p[key] }));
  const expandAll   = () => setCollapsed({});
  const collapseAll = () => {
    const all = {};
    hierarchy.forEach(l1 => {
      all[l1.label] = true;
      Object.keys(l1.l2s).forEach(l2 => { all[`${l1.label}|${l2}`] = true; });
    });
    setCollapsed(all);
  };

  const zBtnS    = { width: 26, height: 26, border: `1px solid ${M.inBd}`, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: uff };
  const ctrlBtnS = { padding: '3px 10px', border: `1px solid ${M.inBd}`, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff };

  if (!data.length) return <div style={{ padding: 40, textAlign: 'center', color: M.tD, fontFamily: uff, fontSize: 13 }}>No records match your filters</div>;

  return (
    <div style={{ padding: '8px 20px 0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: M.tD, fontFamily: uff, letterSpacing: 0.5 }}>ZOOM</span>
        <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={zBtnS}>−</button>
        <button onClick={() => setZoom(z => Math.min(150, z + 10))} style={zBtnS}>+</button>
        <span style={{ fontSize: 10, fontWeight: 900, color: A.a, fontFamily: dff, minWidth: 38 }}>{zoom}%</span>
        <button onClick={() => setZoom(100)} style={ctrlBtnS}>Reset</button>
        <div style={{ width: 1, height: 16, background: M.div }} />
        <button onClick={expandAll}   style={ctrlBtnS}>▾ Expand All</button>
        <button onClick={collapseAll} style={ctrlBtnS}>▶ Collapse All</button>
        <div style={{ marginLeft: 'auto', fontSize: 9, color: M.tD, fontFamily: uff }}>
          {hierarchy.length} groups · {data.length} trims
        </div>
      </div>

      {/* Horizontal scroll — each column scrolls independently */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', display: 'flex', gap: 10, flexWrap: 'nowrap', alignItems: 'flex-start', minWidth: 'max-content', height: '100%' }}>
          {hierarchy.map(l1Node => {
            const l1Key  = l1Node.label;
            const l1Col  = collapsed[l1Key];
            const l2list = Object.entries(l1Node.l2s);
            const total  = l2list.reduce((a, [, v]) => a + v.length, 0);
            return (
              <div key={l1Key} style={{ minWidth: 320, maxWidth: 420, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* L1 header — pinned */}
                <div onClick={() => toggle(l1Key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 10, background: `${l1Node.color}18`, border: `2px solid ${l1Node.color}60`, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
                  <span style={{ fontSize: 24 }}>{l1Node.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: fz + 2, fontWeight: 900, color: l1Node.color, fontFamily: uff }}>{l1Node.label}</div>
                    <div style={{ fontSize: 10, color: M.tD, fontFamily: uff }}>{l2list.length} sub-groups · {total} trims</div>
                  </div>
                  <span style={{ fontSize: 13, color: l1Node.color, fontWeight: 900, fontFamily: uff }}>{l1Col ? '▶' : '▾'}</span>
                </div>

                {/* L2 + trims — independently scrollable */}
                {!l1Col && (
                  <div style={{ flex: 1, overflowY: 'auto', marginLeft: 20, borderLeft: `2px solid ${l1Node.color}40`, paddingLeft: 14, marginTop: 8 }}>
                    {l2list.map(([l2, trims], l2i) => {
                      const l2Key  = `${l1Key}|${l2}`;
                      const l2Col  = collapsed[l2Key];
                      return (
                        <div key={l2} style={{ marginTop: l2i === 0 ? 0 : 8 }}>
                          {/* L2 node */}
                          <div onClick={() => toggle(l2Key)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: M.mid, border: `1px solid ${M.div}`, cursor: 'pointer', userSelect: 'none', marginTop: 5 }}>
                            <span style={{ fontSize: 11, color: l1Node.color, fontWeight: 900 }}>{l2Col ? '▶' : '▾'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: fz, fontWeight: 800, color: M.tA, fontFamily: uff }}>{l2}</div>
                              <div style={{ fontSize: 10, color: M.tD, fontFamily: uff }}>{trims.length} trim{trims.length !== 1 ? 's' : ''}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 900, color: l1Node.color, fontFamily: dff }}>{trims.length}</span>
                          </div>

                          {/* Trim items */}
                          {!l2Col && (
                            displayOpts?.thumbnail && displayOpts?.thumbMode === 'cover' ? (
                              <div style={{ marginLeft: 16, paddingLeft: 12, marginTop: 6 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${displayOpts.thumbSize === 'sm' ? 110 : displayOpts.thumbSize === 'lg' ? 210 : 155}px, 1fr))`, gap: 8 }}>
                                  {trims.map(t => (
                                    <TrmCoverCard key={t.code} trim={t} displayOpts={displayOpts} color={l1Node.color} M={M} A={A} uff={uff} dff={dff} fz={fz} onClick={() => onSelect(t)} />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{ marginLeft: 16, borderLeft: `2px solid ${M.div}`, paddingLeft: 12, marginTop: 3 }}>
                                {trims.map((t, ti) => (
                                  <div key={t.code} onClick={() => onSelect(t)}
                                    style={{ padding: displayOpts?.thumbnail && displayOpts?.thumbSize !== 'sm' ? '8px 10px' : '7px 10px', borderRadius: 6, marginTop: ti === 0 ? 4 : 3, background: M.tev, border: `1px solid ${M.div}`, cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = l1Node.color}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = M.div}>
                                    <TrmListRow trim={t} displayOpts={displayOpts || INIT_DISPLAY_OPTS} color={l1Node.color} M={M} A={A} uff={uff} dff={dff} fz={fz} />
                                  </div>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── TrmHierarchyView — flow diagram: L1 selector pills + zoom + tree (matches AM_FlowDiagram) ──
function TrmHierarchyView({ data, groupByL1, groupByL2, displayOpts, M, A, uff, dff, fz, onSelect }) {
  const hierarchy = useMemo(() => {
    const map = {};
    data.forEach(t => {
      const k1 = t[groupByL1] || '(blank)';
      if (!map[k1]) map[k1] = {};
      const k2 = t[groupByL2] || '(blank)';
      if (!map[k1][k2]) map[k1][k2] = [];
      map[k1][k2].push(t);
    });
    return Object.entries(map).map(([l1, l2map]) => {
      const meta = getGroupMeta(groupByL1, l1);
      return { label: l1, color: meta.color, icon: meta.icon, l2s: l2map };
    });
  }, [data, groupByL1, groupByL2]);

  const [activeMaster, setActiveMaster] = useState(null);
  const [zoom, setZoom] = useState(100);

  const isCover = displayOpts?.thumbnail && displayOpts?.thumbMode === 'cover';
  const isIcon  = displayOpts?.thumbnail && displayOpts?.thumbMode !== 'cover';
  const thumbSz = displayOpts?.thumbSize || 'sm';
  const NW = isCover ? (thumbSz === 'lg' ? 210 : thumbSz === 'sm' ? 130 : 170) : isIcon ? 160 : 140;
  const HG = 12;

  const l1Node = hierarchy.find(h => h.label === activeMaster) || hierarchy[0] || null;

  const zBtnS = { width: 26, height: 26, border: `1px solid ${M.inBd}`, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: uff };

  if (!data.length) return <div style={{ padding: 40, textAlign: 'center', color: M.tD, fontFamily: uff }}>No records match your filters</div>;

  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%' }}>
      {/* L1 selector pills + zoom */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {hierarchy.map(l1 => (
          <div key={l1.label} onClick={() => setActiveMaster(l1.label)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 20, border: `2px solid ${(activeMaster || hierarchy[0]?.label) === l1.label ? l1.color : l1.color + '35'}`, background: (activeMaster || hierarchy[0]?.label) === l1.label ? `${l1.color}20` : `${l1.color}08`, cursor: 'pointer', transition: 'all .12s' }}>
            <span style={{ fontSize: 14 }}>{l1.icon}</span>
            <span style={{ fontSize: 10, fontWeight: (activeMaster || hierarchy[0]?.label) === l1.label ? 900 : 600, color: l1.color, fontFamily: uff }}>{l1.label}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: M.tD, fontFamily: dff }}>({Object.values(l1.l2s).reduce((a, v) => a + v.length, 0)})</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={zBtnS}>−</button>
          <span style={{ fontSize: 10, fontWeight: 900, color: A.a, fontFamily: dff, minWidth: 38, textAlign: 'center' }}>{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(150, z + 10))} style={zBtnS}>+</button>
          <button onClick={() => setZoom(100)} style={{ padding: '3px 10px', border: `1px solid ${M.inBd}`, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 9.5, cursor: 'pointer', fontFamily: uff }}>Reset</button>
        </div>
      </div>

      {/* Flow tree */}
      {l1Node && (() => {
        const l2entries = Object.entries(l1Node.l2s);
        const n         = l2entries.length;
        const totalW    = n * NW + (n - 1) * HG;
        const lineC     = l1Node.color + '80';
        return (
          <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: totalW, paddingBottom: 40 }}>
              {/* L1 root node */}
              <div style={{ padding: '12px 28px', borderRadius: 12, background: `${l1Node.color}20`, border: `2px solid ${l1Node.color}`, display: 'inline-flex', alignItems: 'center', gap: 12, boxShadow: `0 4px 16px ${l1Node.color}30` }}>
                <span style={{ fontSize: 22 }}>{l1Node.icon}</span>
                <div>
                  <div style={{ fontSize: fz + 1, fontWeight: 900, color: l1Node.color, fontFamily: uff }}>{l1Node.label}</div>
                  <div style={{ fontSize: 9, color: M.tD, fontFamily: uff }}>
                    {l2entries.length} sub-groups · {l2entries.reduce((a, [, v]) => a + v.length, 0)} trims
                  </div>
                </div>
              </div>
              {/* Vertical stem */}
              <div style={{ width: 2, height: 32, background: lineC }} />
              {/* L2 row */}
              <div style={{ position: 'relative', display: 'flex', gap: 0, width: totalW, alignItems: 'flex-start' }}>
                {n > 1 && <div style={{ position: 'absolute', top: 0, left: NW / 2, width: (n - 1) * (NW + HG), height: 2, background: lineC }} />}
                {l2entries.map(([l2, trims], i) => (
                  <div key={l2} style={{ width: NW, marginLeft: i > 0 ? HG : 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 2, height: 32, background: lineC }} />
                    {/* L2 node */}
                    <div style={{ width: NW, padding: '8px 10px', borderRadius: 9, background: M.mid, border: `1.5px solid ${l1Node.color}60`, textAlign: 'center', boxShadow: `0 2px 8px ${l1Node.color}15` }}>
                      <div style={{ fontSize: fz - 1, fontWeight: 900, color: l1Node.color, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l2}</div>
                      <div style={{ fontSize: 8, color: M.tD, fontFamily: uff, marginTop: 1 }}>{trims.length} trim{trims.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ width: 2, height: 20, background: lineC }} />
                    {/* Trim chips */}
                    <div style={{ width: NW + 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {trims.map(t => {
                        const chipColor = t.status === 'Active' ? l1Node.color : '#9ca3af';
                        const chipBg    = t.status === 'Active' ? `${l1Node.color}14` : '#f9fafb';
                        const chipBd    = t.status === 'Active' ? l1Node.color + '40' : '#e5e7eb';
                        return isCover ? (
                          <div key={t.code} onClick={() => onSelect(t)} style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${l1Node.color}40`, boxShadow: '0 1px 4px rgba(0,0,0,.06)', cursor: 'pointer' }}>
                            <TrmThumbnail trim={t} size={thumbSz} color={l1Node.color} cover />
                            <div style={{ padding: '4px 8px 6px', background: chipBg }}>
                              <div style={{ fontSize: 8.5, fontWeight: 800, color: chipColor, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                              <div style={{ fontSize: 7.5, color: M.tD, fontFamily: dff, marginTop: 1 }}>{t.code}</div>
                            </div>
                          </div>
                        ) : (
                          <div key={t.code} onClick={() => onSelect(t)} title={`${t.code}  ·  ${t.uom || ''}  ·  ${t.primarySupp || ''}`}
                            style={{ padding: '5px 9px', borderRadius: 7, background: chipBg, border: `1px solid ${chipBd}`, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            {isIcon && <TrmThumbnail trim={t} size="sm" color={l1Node.color} />}
                            <div style={{ flex: 1, minWidth: 0, textAlign: isIcon ? 'left' : 'center' }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: chipColor, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                              <div style={{ fontSize: 7.5, color: M.tD, fontFamily: dff, marginTop: 1 }}>{t.code}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── TrmColumnView — 3-column Miller navigation: L1 → L2 → records (matches AM_ColumnNav) ──
function TrmColumnView({ data, groupByL1, groupByL2, displayOpts, M, A, uff, dff, fz, onSelect }) {
  const hierarchy = useMemo(() => {
    const map = {};
    data.forEach(t => {
      const k1 = t[groupByL1] || '(blank)';
      if (!map[k1]) map[k1] = {};
      const k2 = t[groupByL2] || '(blank)';
      if (!map[k1][k2]) map[k1][k2] = [];
      map[k1][k2].push(t);
    });
    return Object.entries(map).map(([l1, l2map]) => {
      const meta = getGroupMeta(groupByL1, l1);
      return { label: l1, color: meta.color, icon: meta.icon, l2s: l2map };
    });
  }, [data, groupByL1, groupByL2]);

  const [selL1, setSelL1] = useState(hierarchy[0]?.label || null);
  const [selL2, setSelL2] = useState(null);

  const l1Node    = hierarchy.find(h => h.label === selL1) || null;
  const l2entries = l1Node ? Object.entries(l1Node.l2s) : [];
  const trims     = (selL2 && l1Node) ? (l1Node.l2s[selL2] || []) : [];

  useMemo(() => {
    if (l2entries.length > 0) setSelL2(l2entries[0][0]);
    else setSelL2(null);
  }, [selL1]); // eslint-disable-line

  useMemo(() => {
    setSelL1(hierarchy[0]?.label || null);
    setSelL2(null);
  }, [hierarchy]); // eslint-disable-line

  const l1Label = GROUPABLE_FIELDS.find(f => f.key === groupByL1)?.label || groupByL1;
  const l2Label = GROUPABLE_FIELDS.find(f => f.key === groupByL2)?.label || groupByL2;

  const colHd = { padding: '8px 14px', borderBottom: `1px solid ${M.div}`, fontSize: 8, fontWeight: 900, color: M.tD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.6, background: M.thd, position: 'sticky', top: 0, zIndex: 2 };

  if (!data.length) return <div style={{ padding: 40, textAlign: 'center', color: M.tD, fontFamily: uff }}>No records match your filters</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 260px)', minHeight: 440 }}>
      {/* Col 1: L1 groups */}
      <div style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${M.div}`, overflowY: 'auto', background: M.mid }}>
        <div style={colHd}>{l1Label}s ({hierarchy.length})</div>
        {hierarchy.map(l1 => {
          const isA = selL1 === l1.label;
          const cnt = Object.values(l1.l2s).reduce((a, v) => a + v.length, 0);
          return (
            <div key={l1.label} onClick={() => setSelL1(l1.label)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderLeft: `3px solid ${isA ? l1.color : 'transparent'}`, background: isA ? `${l1.color}15` : 'transparent', cursor: 'pointer', borderBottom: `1px solid ${M.div}` }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{l1.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: fz - 1, fontWeight: isA ? 900 : 600, color: isA ? l1.color : M.tA, fontFamily: uff, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l1.label}</div>
                <div style={{ fontSize: 8, color: M.tD, fontFamily: uff }}>{cnt} trims · {Object.keys(l1.l2s).length} {l2Label.toLowerCase()}s</div>
              </div>
              <span style={{ fontSize: 10, color: isA ? l1.color : M.tD }}>{isA ? '▶' : '›'}</span>
            </div>
          );
        })}
      </div>

      {/* Col 2: L2 groups */}
      <div style={{ width: 230, flexShrink: 0, borderRight: `1px solid ${M.div}`, overflowY: 'auto' }}>
        {l1Node ? (
          <>
            <div style={{ ...colHd, background: `${l1Node.color}18`, color: l1Node.color, borderBottom: `2px solid ${l1Node.color}40` }}>
              {l1Node.label} — {l2entries.length} {l2Label.toLowerCase()}s
            </div>
            {l2entries.map(([l2, trimList]) => {
              const isA = selL2 === l2;
              return (
                <div key={l2} onClick={() => setSelL2(l2)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderLeft: `3px solid ${isA ? l1Node.color : 'transparent'}`, background: isA ? M.hi : 'transparent', cursor: 'pointer', borderBottom: `1px solid ${M.div}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: fz - 1, fontWeight: isA ? 800 : 600, color: isA ? l1Node.color : M.tA, fontFamily: uff }}>{l2}</div>
                    <div style={{ fontSize: 8, color: M.tD, fontFamily: uff }}>{trimList.length} trims</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, padding: '1px 7px', borderRadius: 10, background: `${l1Node.color}20`, color: l1Node.color, fontFamily: dff }}>{trimList.length}</span>
                  <span style={{ fontSize: 10, color: isA ? l1Node.color : M.tD }}>{isA ? '▶' : '›'}</span>
                </div>
              );
            })}
          </>
        ) : <div style={{ padding: 20, color: M.tD, fontFamily: uff, fontSize: 11 }}>← Select a {l1Label.toLowerCase()}</div>}
      </div>

      {/* Col 3: Trims */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {l1Node && selL2 ? (
          <>
            <div style={{ ...colHd, background: `${l1Node.color}10`, color: l1Node.color, borderBottom: `2px solid ${l1Node.color}30` }}>
              {selL1} › {selL2} — {trims.length} trims
            </div>
            {displayOpts?.thumbnail && displayOpts?.thumbMode === 'cover' ? (
              <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${displayOpts.thumbSize === 'sm' ? 110 : displayOpts.thumbSize === 'lg' ? 210 : 155}px, 1fr))`, gap: 10 }}>
                {trims.map(t => (
                  <TrmCoverCard key={t.code} trim={t} displayOpts={displayOpts} color={l1Node.color} M={M} A={A} uff={uff} dff={dff} fz={fz} onClick={() => onSelect(t)} />
                ))}
              </div>
            ) : (
              trims.map((t, i) => (
                <div key={t.code} onClick={() => onSelect(t)}
                  style={{ padding: displayOpts?.thumbnail && displayOpts?.thumbSize !== 'sm' ? '10px 18px' : '9px 18px', borderBottom: `1px solid ${M.div}`, background: i % 2 === 0 ? M.tev : M.tod, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = M.hov}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? M.tev : M.tod}>
                  <TrmListRow trim={t} displayOpts={displayOpts || INIT_DISPLAY_OPTS} color={l1Node.color} M={M} A={A} uff={uff} dff={dff} fz={fz} />
                </div>
              ))
            )}
          </>
        ) : <div style={{ padding: 20, color: M.tD, fontFamily: uff, fontSize: 11 }}>← Select a {l2Label.toLowerCase()}</div>}
      </div>
    </div>
  );
}

// ── TrmCardsView — groups of TrmCoverCard tiles ──
function TrmCardsView({ data, cardsGroupBy, cardsSubGroupBy, setCardsGroupBy, setCardsSubGroupBy, displayOpts, M, A, uff, dff, fz, onSelect }) {
  const grouped = useMemo(() => {
    if (!cardsGroupBy) return [{ key: null, items: data }];
    const map = {};
    data.forEach(t => { const k = t[cardsGroupBy]||'(blank)'; if(!map[k])map[k]=[]; map[k].push(t); });
    return Object.entries(map).map(([key, items]) => ({ key, items }));
  }, [data, cardsGroupBy]);

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 32px' }}>
      {/* Cards group-by controls (own — separate from toolbar) */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
        <span style={{ fontSize:9, fontWeight:900, color:M.tD, fontFamily:uff, textTransform:'uppercase', letterSpacing:.6 }}>Group:</span>
        <select value={cardsGroupBy||""} onChange={e=>setCardsGroupBy(e.target.value||"")} style={{ fontSize:10, padding:'4px 8px', border:`1px solid ${M.inBd}`, borderRadius:5, background:M.inBg, color:M.tA, cursor:'pointer', outline:'none' }}>
          <option value="">None</option>
          {GROUPABLE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        {cardsGroupBy && <>
          <span style={{ fontSize:9, color:M.tD }}>›</span>
          <select value={cardsSubGroupBy||""} onChange={e=>setCardsSubGroupBy(e.target.value||"")} style={{ fontSize:10, padding:'4px 8px', border:`1px solid ${M.inBd}`, borderRadius:5, background:M.inBg, color:M.tA, cursor:'pointer', outline:'none' }}>
            <option value="">Sub-group…</option>
            {GROUPABLE_FIELDS.filter(f=>f.key!==cardsGroupBy).map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </>}
      </div>

      {!data.length && <div style={{ padding:40, textAlign:'center', color:M.tD, fontFamily:uff }}>No records match your filters</div>}

      {grouped.map(({ key, items }) => {
        const meta = key ? getGroupMeta(cardsGroupBy, key) : { color: A.a, icon: "📦" };
        return (
          <div key={key||"__all"} style={{ marginBottom:20 }}>
            {key && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, paddingBottom:6, borderBottom:`2px solid ${meta.color}` }}>
                <span style={{ fontSize:15 }}>{meta.icon}</span>
                <span style={{ fontSize:13, fontWeight:900, color:meta.color, fontFamily:uff }}>{key}</span>
                <span style={{ fontSize:9, background:meta.color, color:'#fff', borderRadius:10, padding:'1px 7px', fontWeight:700 }}>{items.length}</span>
              </div>
            )}
            <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
              {items.map(t => (
                <TrmCoverCard key={t.code} trim={t} displayOpts={displayOpts} color={meta.color} M={M} A={A} uff={uff} dff={dff} fz={fz} onClick={() => onSelect(t)}/>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TrmMatrixView — L1 rows × L2 columns count grid ──
function TrmMatrixView({ data, groupByL1, groupByL2, M, A, uff, dff, fz }) {
  const { rows, cols, matrix, totals } = useMemo(() => {
    const rSet = new Set(), cSet = new Set();
    data.forEach(t => { rSet.add(t[groupByL1]||'(blank)'); cSet.add(t[groupByL2]||'(blank)'); });
    const rows = [...rSet], cols = [...cSet];
    const matrix = {};
    data.forEach(t => {
      const r = t[groupByL1]||'(blank)', c = t[groupByL2]||'(blank)';
      if (!matrix[r]) matrix[r] = {};
      matrix[r][c] = (matrix[r][c]||0) + 1;
    });
    const totals = {};
    rows.forEach(r => { totals[r] = cols.reduce((s,c) => s+(matrix[r]?.[c]||0), 0); });
    return { rows, cols, matrix, totals };
  }, [data, groupByL1, groupByL2]);

  if (!data.length) return <div style={{ padding:40, textAlign:'center', color:M.tD, fontFamily:uff }}>No records match your filters</div>;

  return (
    <div style={{ flex:1, overflowX:'auto', overflowY:'auto', padding:'12px 16px' }}>
      <table style={{ borderCollapse:'collapse', fontSize:11, fontFamily:uff }}>
        <thead style={{ position:'sticky', top:0, zIndex:10 }}>
          <tr>
            <th style={{ padding:'4px 10px', background:M.thd, borderBottom:`2px solid ${A.a}`, borderRight:`1px solid ${M.div}`, textAlign:'left', fontSize:8, fontWeight:900, color:M.tD, fontFamily:uff, whiteSpace:'nowrap', minWidth:90 }}>
              {GROUPABLE_FIELDS.find(f=>f.key===groupByL1)?.label||groupByL1} ╲ {GROUPABLE_FIELDS.find(f=>f.key===groupByL2)?.label||groupByL2}
            </th>
            {cols.map(c => {
              const meta = getGroupMeta(groupByL2, c);
              return (
                <th key={c} style={{ padding:'4px 8px', background:M.thd, borderBottom:`2px solid ${meta.color}`, borderRight:`1px solid ${M.div}`, textAlign:'center', fontSize:8, fontWeight:900, color:meta.color, fontFamily:uff, whiteSpace:'nowrap', minWidth:56 }}>
                  {meta.icon} {c}
                </th>
              );
            })}
            <th style={{ padding:'4px 8px', background:M.thd, borderBottom:`2px solid ${A.a}`, textAlign:'center', fontSize:8, fontWeight:900, color:A.a, fontFamily:uff, whiteSpace:'nowrap', minWidth:44 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,ri) => {
            const rMeta = getGroupMeta(groupByL1, r);
            return (
              <tr key={r} style={{ background:ri%2===0?M.tev:M.tod }}>
                <td style={{ padding:'4px 10px', borderRight:`1px solid ${M.div}`, borderBottom:`1px solid ${M.div}28`, fontFamily:uff, fontWeight:700, fontSize:10, color:rMeta.color, whiteSpace:'nowrap' }}>
                  <span style={{ fontSize:12, marginRight:5 }}>{rMeta.icon}</span>{r}
                </td>
                {cols.map(c => {
                  const v = matrix[r]?.[c] || 0;
                  const cMeta = getGroupMeta(groupByL2, c);
                  return (
                    <td key={c} style={{ padding:'4px 8px', borderRight:`1px solid ${M.div}28`, borderBottom:`1px solid ${M.div}28`, textAlign:'center', fontSize:13, fontWeight:v>0?900:400, color:v>0?cMeta.color:M.tD, fontFamily:dff, background:v>0?cMeta.color+'12':undefined }}>
                      {v > 0 ? v : <span style={{ color:M.tD, fontSize:9, opacity:.5 }}>–</span>}
                    </td>
                  );
                })}
                <td style={{ padding:'4px 8px', borderBottom:`1px solid ${M.div}28`, borderLeft:`1px solid ${M.div}`, textAlign:'center', fontSize:13, fontWeight:900, color:A.a, fontFamily:dff, background:A.a+'0d' }}>{totals[r]}</td>
              </tr>
            );
          })}
          {/* Totals row */}
          <tr style={{ background:M.thd, borderTop:`2px solid ${A.a}` }}>
            <td style={{ padding:'4px 10px', borderRight:`1px solid ${M.div}`, fontSize:8, fontWeight:900, color:M.tD, fontFamily:uff, textTransform:'uppercase', letterSpacing:.6 }}>TOTAL</td>
            {cols.map(c => {
              const total = rows.reduce((s,r) => s+(matrix[r]?.[c]||0), 0);
              return <td key={c} style={{ padding:'4px 8px', borderRight:`1px solid ${M.div}28`, textAlign:'center', fontSize:12, fontWeight:900, color:A.a, fontFamily:dff }}>{total||<span style={{ color:M.tD, fontSize:9, opacity:.5 }}>–</span>}</td>;
            })}
            <td style={{ padding:'4px 8px', textAlign:'center', fontSize:13, fontWeight:900, color:A.a, fontFamily:dff, background:A.a+'18', borderLeft:`1px solid ${M.div}` }}>{data.length}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-A: Main export — TrimMasterLayoutPanel
// Props: { M: rawM, A, uff, dff, canEdit = true, onEditRecord }
// ════════════════════════════════════════════════════════════════════════════
export function TrimMasterLayoutPanel({ M: rawM, A, uff, dff, canEdit = true, onEditRecord }) {
  const M  = toM(rawM);
  const fz = 13;

  // §LAYOUT_VIEW-C: All required states
  const [layoutTab,   setLayoutTab]   = useState("classic");
  const [groupByL1,   setGroupByL1]   = useState("category");
  const [groupByL2,   setGroupByL2]   = useState("status");
  const [displayOpts, setDisplayOpts] = useState(INIT_DISPLAY_OPTS);
  const [showPanel,   setShowPanel]   = useState(false);

  const [filters,     setFilters]     = useState([]);
  const [sorts,       setSorts]       = useState([{ id:1, field:'code', mode:'a_z', value:'' }]);
  const [search,      setSearch]      = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSorts,   setShowSorts]   = useState(false);

  const [cardsGroupBy,    setCardsGroupBy]    = useState('');
  const [cardsSubGroupBy, setCardsSubGroupBy] = useState('');

  // §LAYOUT_VIEW-B: INIT_VIEWS (3 locked: default/classic, cards, matrix)
  const INIT_VIEWS = [
    { id:'v_default', name:'Default', icon:'🌳', color:'#0078D4', locked:true,
      layoutTab:'classic', groupByL1:'category', groupByL2:'status',
      filters:[], sorts:[{id:1,field:'code',mode:'a_z',value:''}], search:'',
      displayOpts:INIT_DISPLAY_OPTS, cardsGroupBy:'', cardsSubGroupBy:'' },
    { id:'v_cards', name:'Cards', icon:'▦', color:'#7C3AED', locked:true,
      layoutTab:'cards', groupByL1:'category', groupByL2:'status',
      filters:[], sorts:[{id:1,field:'code',mode:'a_z',value:''}], search:'',
      displayOpts:INIT_DISPLAY_OPTS, cardsGroupBy:'category', cardsSubGroupBy:'status' },
    { id:'v_matrix', name:'Matrix', icon:'⊞', color:'#E8690A', locked:true,
      layoutTab:'matrix', groupByL1:'category', groupByL2:'uom',
      filters:[], sorts:[{id:1,field:'code',mode:'a_z',value:''}], search:'',
      displayOpts:INIT_DISPLAY_OPTS, cardsGroupBy:'', cardsSubGroupBy:'' },
  ];
  const [layoutViews,   setLayoutViews]   = useState(INIT_VIEWS);
  const [activeViewId,  setActiveViewId]  = useState('v_default');
  const [selectedTrim,  setSelectedTrim]  = useState(null);
  const [showExport,    setShowExport]    = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isMaxView,     setIsMaxView]     = useState(false);

  // §LAYOUT_VIEW-C: isViewDirty memo
  const isViewDirty = useMemo(() => {
    const av = layoutViews.find(v => v.id === activeViewId);
    if (!av) return false;
    const cur   = JSON.stringify({ layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts:JSON.stringify(displayOpts), cardsGroupBy, cardsSubGroupBy });
    const saved = JSON.stringify({ layoutTab:av.layoutTab, groupByL1:av.groupByL1, groupByL2:av.groupByL2, filters:av.filters, sorts:av.sorts, search:av.search, displayOpts:JSON.stringify(av.displayOpts), cardsGroupBy:av.cardsGroupBy||'', cardsSubGroupBy:av.cardsSubGroupBy||'' });
    return cur !== saved;
  }, [layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy, layoutViews, activeViewId]);

  // §LAYOUT_VIEW-C: processedData memo — search → filters → multi-sort
  const processedData = useMemo(() => {
    let d = [...TRM_DATA];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      d = d.filter(t => Object.values(t).some(v => String(v||'').toLowerCase().includes(q)));
    }
    filters.forEach(fil => { if (fil.value) d = d.filter(t => evalFilter(t, fil)); });
    if (sorts.length) {
      const fMaps = {};
      CARD_FIELDS.forEach(f => { const c={}; d.forEach(t=>{const v=String(t[f.key]??'');c[v]=(c[v]||0)+1;}); fMaps[f.key]=c; });
      d = applyMultiSort(d, sorts, fMaps);
    }
    return d;
  }, [search, filters, sorts]);

  // §LAYOUT_VIEW-C: orgHierarchy memo — grouped tree for count display
  const orgHierarchy = useMemo(() => {
    if (layoutTab === 'cards') return [];
    const map = {};
    processedData.forEach(t => { const k = t[groupByL1]||'(blank)'; if(!map[k])map[k]=[]; map[k].push(t); });
    return Object.entries(map).map(([l1, items]) => ({ l1, items }));
  }, [processedData, groupByL1, layoutTab]);

  // §LAYOUT_VIEW-D: View helpers (all useCallback)
  const switchToView = useCallback((viewId) => {
    const v = layoutViews.find(lv => lv.id === viewId);
    if (!v) return;
    setActiveViewId(viewId);
    setLayoutTab(v.layoutTab); setGroupByL1(v.groupByL1); setGroupByL2(v.groupByL2);
    setFilters(v.filters); setSorts(v.sorts); setSearch(v.search);
    setDisplayOpts(v.displayOpts);
    setCardsGroupBy(v.cardsGroupBy||''); setCardsSubGroupBy(v.cardsSubGroupBy||'');
    setShowFilters(false); setShowSorts(false);
  }, [layoutViews]);

  const saveCurrentToView = useCallback(() => {
    setLayoutViews(prev => prev.map(v => v.id === activeViewId
      ? { ...v, layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy }
      : v));
  }, [activeViewId, layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy]);

  const addNewView = useCallback(({ name, icon, color }) => {
    const id = `v_${Date.now()}`;
    const newV = { id, name, icon, color, locked:false, layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy };
    setLayoutViews(prev => [...prev, newV]);
    setActiveViewId(id);
    setShowSaveModal(false);
  }, [layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy]);

  const deleteView = useCallback((viewId) => {
    setLayoutViews(prev => {
      const v = prev.find(lv => lv.id === viewId);
      if (!v || v.locked) return prev;
      if (activeViewId === viewId) switchToView('v_default');
      return prev.filter(lv => lv.id !== viewId);
    });
  }, [activeViewId, switchToView]);

  // §LAYOUT_VIEW-D: Escape exits Max View (only when no modal open)
  useEffect(() => {
    const h = (e) => {
      if (!isMaxView || selectedTrim) return;
      if (e.key === 'Escape') setIsMaxView(false);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isMaxView, selectedTrim]);

  // Filter / sort helpers
  const addFilter = () => {
    const f = CARD_FIELDS[0];
    setFilters(p => [...p, { id:Date.now(), field:f.key, op:FILTER_OPS[f.type][0], value:'' }]);
    setShowFilters(true);
  };
  const updateFilter = (id, patch) => setFilters(p => p.map(f => {
    if (f.id !== id) return f;
    const m = { ...f, ...patch };
    if (patch.field && patch.field !== f.field) {
      const ft = CARD_FIELDS.find(cf=>cf.key===patch.field)?.type||'txt';
      m.op = FILTER_OPS[ft][0]; m.value = '';
    }
    return m;
  }));
  const removeFilter = (id) => setFilters(p => p.filter(f => f.id !== id));

  const addSort = () => { setShowSorts(true); setSorts(p => [...p, { id:Date.now(), field:CARD_FIELDS[0].key, mode:'a_z', value:'' }]); };
  const updateSort = (id, patch) => setSorts(p => p.map(s => s.id===id?{...s,...patch}:s));
  const removeSort = (id) => setSorts(p => p.length>1?p.filter(s=>s.id!==id):p);

  const resetAll = () => { setFilters([]); setSorts([{id:1,field:'code',mode:'a_z',value:''}]); setSearch(''); };

  // §LAYOUT_VIEW-M: canEdit guard
  const handleEdit = (trim) => {
    if (!canEdit) return;
    if (onEditRecord) onEditRecord(trim);
  };

  // Selected trim navigation helpers
  const selIdx    = selectedTrim ? processedData.findIndex(t => t.code === selectedTrim.code) : -1;
  const goPrev    = () => { if (selIdx > 0) setSelectedTrim(processedData[selIdx-1]); };
  const goNext    = () => { if (selIdx < processedData.length-1) setSelectedTrim(processedData[selIdx+1]); };

  // Sub-tab button style helper
  const layoutBtnS = (active) => ({
    padding:'6px 14px', border:`1px solid ${active?A.a:M.div}`, borderRadius:6,
    background:active?A.al:'transparent', color:active?A.a:M.tB,
    fontSize:11, fontWeight:active?900:600, cursor:'pointer', fontFamily:uff,
    display:'flex', alignItems:'center', gap:5, transition:'all .12s', whiteSpace:'nowrap',
  });

  const l1Label = GROUPABLE_FIELDS.find(f => f.key === groupByL1)?.label || groupByL1;

  // ── §LAYOUT_VIEW-F: ROW ORDER — sub-tab bar → views bar → toolbar → content ──
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', position:'relative', ...(isMaxView?{position:'fixed',inset:0,zIndex:1200,background:M.hi}:{}) }}>

      {/* ── ROW 1: Sub-tab bar (§LAYOUT_VIEW-G) ── */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:M.thd, borderBottom:`1px solid ${M.div}`, flexShrink:0, flexWrap:'wrap' }}>
        {/* §LAYOUT_VIEW-E: 5 mandatory layout tabs */}
        {[['classic','🌳','Classic'],['hierarchy','⟁','Hierarchy'],['column','≡','Column'],['cards','▦','Cards'],['matrix','⊞','Matrix']].map(([id,icon,label]) => (
          <button key={id} onClick={() => { setLayoutTab(id); if(!PROPS_VIEWS.includes(id)) setShowPanel(false); }} style={layoutBtnS(layoutTab===id)}>
            <span>{icon}</span>{label}
          </button>
        ))}

        {/* Right side: Export / Print / Max View / Properties */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          {/* Export dropdown */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowExport(p=>!p)} style={{ ...layoutBtnS(showExport), borderColor:showExport?A.a:M.div }}>↓ Export ▾</button>
            {showExport && (
              <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', top:34, right:0, background:M.hi, border:`1px solid ${M.div}`, borderRadius:7, boxShadow:'0 8px 24px rgba(0,0,0,.18)', zIndex:500, minWidth:190, overflow:'hidden' }}>
                {[{k:'csv',l:'📋 Export CSV'},{k:'excel',l:'📊 Export Excel'},{k:'pdf',l:'📄 Export PDF'}].map(x => (
                  <button key={x.k} onClick={() => setShowExport(false)} style={{ display:'block', width:'100%', padding:'9px 14px', border:'none', background:'transparent', color:M.tA, fontSize:11, fontWeight:700, cursor:'pointer', textAlign:'left', borderBottom:`1px solid ${M.div}`, fontFamily:uff }}>{x.l}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => window.print()} style={layoutBtnS(false)}>🖨 Print</button>
          {/* §LAYOUT_VIEW-L: Max View toggle */}
          <button onClick={() => setIsMaxView(p=>!p)} style={{ ...layoutBtnS(isMaxView), borderColor:isMaxView?A.a:M.div, background:isMaxView?A.al:'transparent', color:isMaxView?A.a:M.tB }}>
            {isMaxView ? '⊡ Restore' : '⛶ Max View'}
          </button>
          {/* §LAYOUT_VIEW-J: Properties button (only for supported tabs) */}
          {PROPS_VIEWS.includes(layoutTab) && (
            <div style={{ position:'relative' }}>
              <button onClick={() => setShowPanel(p=>!p)} style={{ ...layoutBtnS(showPanel), position:'relative' }}>
                ⚙ Properties
                {(displayOpts.thumbnail || displayOpts.density !== 'summary') && (
                  <span style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:A.a }} />
                )}
              </button>
              {showPanel && <ViewOptionsPanel displayOpts={displayOpts} setDisplayOpts={setDisplayOpts} onClose={() => setShowPanel(false)} M={M} A={A} uff={uff}/>}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2: Views Bar (§LAYOUT_VIEW-H) ── */}
      <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 14px', background:'#ffffff', borderBottom:`1px solid ${M.div}`, flexShrink:0, flexWrap:'wrap', minHeight:32 }}>
        <span style={{ fontSize:8.5, fontWeight:900, color:M.tD, letterSpacing:.8, textTransform:'uppercase', flexShrink:0, marginRight:4, fontFamily:uff }}>VIEWS:</span>
        {layoutViews.map(v => {
          const isActive  = activeViewId === v.id;
          const isDefault = v.locked;
          const isDirty   = isActive && isViewDirty;
          return (
            <div key={v.id} style={{ display:'flex', alignItems:'center', gap:0, background:isActive?(isDefault?'#fff0f0':'#f5f3ff'):'transparent', border:`1.5px solid ${isActive?(isDefault?CC_RED:CC_PUR):isDefault?CC_RED+'55':'#c4b5fd'}`, borderStyle:isDefault||isActive?'solid':'dashed', borderRadius:5, overflow:'hidden' }}>
              <button onClick={() => switchToView(v.id)} style={{ padding:'4px 10px', border:'none', background:'transparent', color:isActive?(isDefault?CC_RED:CC_PUR):M.tB, fontSize:9, fontWeight:isActive?900:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:uff }}>
                {isActive && <span style={{ width:6, height:6, borderRadius:'50%', background:isDefault?CC_RED:CC_PUR, display:'inline-block', flexShrink:0 }}/>}
                {v.icon} {v.name}
                {isDirty && <span style={{ fontSize:7, fontWeight:900, color:'#92400e', background:'#fef3c7', borderRadius:3, padding:'1px 4px', marginLeft:2 }}>MODIFIED</span>}
              </button>
              {isDefault && <div style={{ padding:'2px 6px', fontSize:7, fontWeight:900, color:'#9ca3af', letterSpacing:.5, background:'#ececec', borderLeft:`1px solid ${M.div}`, height:'100%', display:'flex', alignItems:'center', fontFamily:uff }}>LOCKED</div>}
              {isActive && isDirty && !isDefault && (
                <>
                  <div style={{ width:1, height:16, background:'#fcd34d' }}/>
                  <button onClick={saveCurrentToView} style={{ padding:'4px 9px', border:'none', background:'#f59e0b', color:'#fff', fontSize:9, cursor:'pointer', fontWeight:900, whiteSpace:'nowrap', fontFamily:uff }}>💾 Update View</button>
                </>
              )}
              {!isDefault && (
                <>
                  <div style={{ width:1, height:16, background:'#c4b5fd' }}/>
                  <button onClick={() => deleteView(v.id)} style={{ padding:'4px 6px', border:'none', background:'transparent', color:'#dc2626', fontSize:11, cursor:'pointer', fontWeight:900, width:22, height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                </>
              )}
            </div>
          );
        })}
        <button onClick={() => setShowSaveModal(true)} style={{ padding:'4px 10px', borderRadius:5, border:'1.5px dashed #c4b5fd', background:'#fdf4ff', color:CC_PUR, fontSize:9, fontWeight:900, cursor:'pointer', fontFamily:uff }}>+ New View</button>
      </div>

      {/* ── ROW 3: Unified Toolbar (§LAYOUT_VIEW-I — ONE row only) ── */}
      <div style={{ padding:'7px 14px', background:M.hi, borderBottom:`1px solid ${M.div}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          {/* Left: Search + Filter + Sort + Reset */}
          <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
            <span style={{ position:'absolute', left:8, fontSize:11, color:M.tD }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search trims…"
              style={{ border:`1.5px solid ${search?A.a:M.inBd}`, borderRadius:5, background:M.inBg, color:M.tA, fontSize:11, padding:'5px 10px 5px 26px', outline:'none', width:190, fontFamily:uff }}/>
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:7, border:'none', background:'none', cursor:'pointer', color:M.tD, fontSize:12, padding:0 }}>×</button>}
          </div>

          <button onClick={() => { setShowFilters(p=>!p); if(!showFilters&&filters.length===0)addFilter(); }}
            style={{ padding:'5px 10px', borderRadius:5, border:`1.5px solid ${showFilters||filters.length>0?'#0891B2':M.inBd}`, background:showFilters||filters.length>0?'rgba(8,145,178,.1)':M.inBg, color:showFilters||filters.length>0?'#0e7490':M.tB, fontSize:10, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:uff }}>
            ⊞ Filter {filters.filter(f=>f.value).length > 0 && <span style={{ background:'#0891B2', color:'#fff', borderRadius:10, padding:'0 5px', fontSize:8 }}>{filters.filter(f=>f.value).length}</span>}
          </button>

          <button onClick={() => { setShowSorts(p=>!p); if(!showSorts&&sorts.length===0)addSort(); }}
            style={{ padding:'5px 10px', borderRadius:5, border:`1.5px solid ${showSorts?'#7C3AED':M.inBd}`, background:showSorts?'rgba(124,58,237,.1)':M.inBg, color:showSorts?'#7C3AED':M.tB, fontSize:10, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:uff }}>
            ↕ Sort {sorts.length > 0 && <span style={{ background:'#7C3AED', color:'#fff', borderRadius:10, padding:'0 5px', fontSize:8 }}>{sorts.length}</span>}
          </button>

          {(search || filters.some(f=>f.value) || sorts.length > 0) && (
            <button onClick={resetAll} style={{ padding:'5px 9px', borderRadius:5, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:10, fontWeight:900, cursor:'pointer', fontFamily:uff }}>✕ Reset</button>
          )}

          {/* Divider */}
          <div style={{ width:1, height:18, background:M.div, margin:'0 4px', flexShrink:0 }}/>

          {/* Right: Group By (hidden on Cards tab — cards manage own grouping) */}
          {layoutTab !== 'cards' && (
            <>
              <span style={{ fontSize:9, fontWeight:900, color:M.tD, textTransform:'uppercase', letterSpacing:.5, flexShrink:0, fontFamily:uff }}>⊞ Group By</span>
              <select value={groupByL1} onChange={e=>setGroupByL1(e.target.value)}
                style={{ fontSize:10, padding:'5px 8px', border:`1.5px solid ${A.a}`, borderRadius:5, background:A.al, color:A.a, cursor:'pointer', outline:'none', fontFamily:uff, fontWeight:700 }}>
                {GROUPABLE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <span style={{ fontSize:11, color:M.tD, fontWeight:700, flexShrink:0 }}>›</span>
              <select value={groupByL2} onChange={e=>setGroupByL2(e.target.value)}
                style={{ fontSize:10, padding:'5px 8px', border:`1.5px solid ${CC_PUR}`, borderRadius:5, background:'#f5f3ff', color:CC_PUR, cursor:'pointer', outline:'none', fontFamily:uff, fontWeight:700 }}>
                {GROUPABLE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <div style={{ width:1, height:18, background:M.div, margin:'0 2px', flexShrink:0 }}/>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => { setGroupByL1(p.l1); setGroupByL2(p.l2); }}
                  style={{ padding:'3px 8px', borderRadius:4, border:`1px solid ${groupByL1===p.l1&&groupByL2===p.l2?A.a:M.div}`, background:groupByL1===p.l1&&groupByL2===p.l2?A.al:'transparent', color:groupByL1===p.l1&&groupByL2===p.l2?A.a:M.tC, fontSize:8.5, fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:uff }}>
                  {p.label}
                </button>
              ))}
            </>
          )}

          {/* Count — §LAYOUT_VIEW-I: "N groups · M / T records" */}
          <span style={{ marginLeft:'auto', fontSize:9, color:M.tD, fontFamily:uff, fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>
            {layoutTab !== 'cards' && `${orgHierarchy.length} groups · `}
            {processedData.length} / {TRM_DATA.length} records
          </span>
        </div>

        {/* §LAYOUT_VIEW-I: Expandable filter rows */}
        {showFilters && (
          <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${M.div}`, display:'flex', flexDirection:'column', gap:5 }}>
            {filters.map((fil, fi) => {
              const cf   = CARD_FIELDS.find(f => f.key === fil.field);
              const ops  = FILTER_OPS[cf?.type || 'txt'];
              const isAct = fil.value !== '';
              const cs   = { fontSize:10, border:`1px solid ${M.div}`, borderRadius:5, padding:'3px 7px', background:M.inBg, color:M.tA, cursor:'pointer', outline:'none', fontFamily:uff };
              return (
                <div key={fil.id} style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:9, color:M.tD, minWidth:34, textAlign:'right', fontWeight:600, fontFamily:uff }}>{fi===0?'Where':'And'}</span>
                  <select value={fil.field} onChange={e=>updateFilter(fil.id,{field:e.target.value})} style={{ ...cs, fontWeight:700, color:'#0e7490', borderColor:'#0891B270', background:'#f0fdfa' }}>
                    {CARD_FIELDS.map(f => <option key={f.key} value={f.key}>{GROUPABLE_FIELDS.find(g=>g.key===f.key)?.label || f.key}</option>)}
                  </select>
                  <select value={fil.op} onChange={e=>updateFilter(fil.id,{op:e.target.value})} style={cs}>
                    {ops.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input value={fil.value} onChange={e=>updateFilter(fil.id,{value:e.target.value})} placeholder="Enter value…"
                    style={{ ...cs, minWidth:110, fontWeight:700, borderColor:isAct?'#0891B270':M.div, color:isAct?'#0e7490':M.tA }}/>
                  <button onClick={()=>removeFilter(fil.id)} style={{ border:'none', background:'transparent', color:'#dc2626', cursor:'pointer', fontSize:15, lineHeight:1, padding:'0 3px', fontWeight:900 }}>×</button>
                </div>
              );
            })}
            <button onClick={addFilter} style={{ alignSelf:'flex-start', marginLeft:40, border:'none', background:'transparent', color:'#0e7490', fontSize:9, fontWeight:700, cursor:'pointer', padding:0, fontFamily:uff }}>＋ Add another filter</button>
          </div>
        )}

        {/* §LAYOUT_VIEW-I: Expandable sort rows */}
        {showSorts && (
          <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${M.div}`, display:'flex', flexDirection:'column', gap:5 }}>
            {sorts.map((srt, si) => {
              const needVal = srt.mode === 'val_first' || srt.mode === 'val_last';
              const cs = { fontSize:10, border:`1px solid ${M.div}`, borderRadius:5, padding:'3px 7px', background:M.inBg, color:M.tA, cursor:'pointer', outline:'none', fontFamily:uff };
              return (
                <div key={srt.id} style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:9, color:M.tD, minWidth:34, textAlign:'right', fontWeight:600, fontFamily:uff }}>{si===0?'Sort':'Then'}</span>
                  <select value={srt.field} onChange={e=>updateSort(srt.id,{field:e.target.value,value:''})} style={{ ...cs, fontWeight:700, color:'#6d28d9', borderColor:'#7c3aed70', background:'#7c3aed10' }}>
                    {CARD_FIELDS.map(f => <option key={f.key} value={f.key}>{GROUPABLE_FIELDS.find(g=>g.key===f.key)?.label || f.key}</option>)}
                  </select>
                  <select value={srt.mode} onChange={e=>updateSort(srt.id,{mode:e.target.value,value:''})} style={cs}>
                    {SORT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  {needVal && <input value={srt.value} onChange={e=>updateSort(srt.id,{value:e.target.value})} placeholder="Enter value…" style={{ ...cs, minWidth:110, fontWeight:700 }}/>}
                  {sorts.length > 1 && <button onClick={()=>removeSort(srt.id)} style={{ border:'none', background:'transparent', color:'#dc2626', cursor:'pointer', fontSize:15, lineHeight:1, padding:'0 3px', fontWeight:900 }}>×</button>}
                </div>
              );
            })}
            <button onClick={addSort} style={{ alignSelf:'flex-start', marginLeft:40, border:'none', background:'transparent', color:'#6d28d9', fontSize:9, fontWeight:700, cursor:'pointer', padding:0, fontFamily:uff }}>＋ Add another sort</button>
          </div>
        )}
      </div>

      {/* ── ROW 4: Content Area (§LAYOUT_VIEW-E: 5 sub-views) ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
        {layoutTab === 'classic' && (
          <TrmClassicView data={processedData} groupByL1={groupByL1} groupByL2={groupByL2} displayOpts={displayOpts} M={M} A={A} uff={uff} dff={dff} fz={fz} onSelect={setSelectedTrim}/>
        )}
        {layoutTab === 'hierarchy' && (
          <TrmHierarchyView data={processedData} groupByL1={groupByL1} groupByL2={groupByL2} displayOpts={displayOpts} M={M} A={A} uff={uff} dff={dff} fz={fz} onSelect={setSelectedTrim}/>
        )}
        {layoutTab === 'column' && (
          <TrmColumnView data={processedData} groupByL1={groupByL1} groupByL2={groupByL2} displayOpts={displayOpts} M={M} A={A} uff={uff} dff={dff} fz={fz} onSelect={setSelectedTrim}/>
        )}
        {layoutTab === 'cards' && (
          <TrmCardsView data={processedData} cardsGroupBy={cardsGroupBy} cardsSubGroupBy={cardsSubGroupBy} setCardsGroupBy={setCardsGroupBy} setCardsSubGroupBy={setCardsSubGroupBy} displayOpts={displayOpts} M={M} A={A} uff={uff} dff={dff} fz={fz} onSelect={setSelectedTrim}/>
        )}
        {layoutTab === 'matrix' && (
          <TrmMatrixView data={processedData} groupByL1={groupByL1} groupByL2={groupByL2} M={M} A={A} uff={uff} dff={dff} fz={fz}/>
        )}
        {!processedData.length && layoutTab !== 'classic' && layoutTab !== 'hierarchy' && layoutTab !== 'column' && (
          <div style={{ padding:40, textAlign:'center', color:M.tD, fontFamily:uff, fontSize:13 }}>No records match your filters</div>
        )}
      </div>

      {/* §LAYOUT_VIEW-K: Detail Modal */}
      {selectedTrim && (
        <TrmDetailModal
          trim={selectedTrim}
          onClose={() => setSelectedTrim(null)}
          onPrev={goPrev}
          onNext={goNext}
          trimIndex={selIdx}
          totalTrims={processedData.length}
          onEdit={handleEdit}
          canEdit={canEdit}
          M={M} A={A} uff={uff} dff={dff} fz={fz}
        />
      )}

      {/* Save View modal */}
      {showSaveModal && (
        <LayoutViewSaveModal onSave={addNewView} onClose={() => setShowSaveModal(false)} M={M} A={A} uff={uff}/>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §LAYOUT_VIEW-A: Default export — TrimMasterTab (standalone screen)
// ════════════════════════════════════════════════════════════════════════════
export default function TrimMasterTab({ M: rawM, A, uff, dff, canEdit = true }) {
  return <TrimMasterLayoutPanel M={rawM} A={A} uff={uff} dff={dff} canEdit={canEdit} />;
}
