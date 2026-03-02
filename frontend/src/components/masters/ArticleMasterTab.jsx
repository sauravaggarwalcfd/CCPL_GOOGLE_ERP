import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import api from '../../services/api';

// ═══════════════════════════════════════════════════════════════
// ARTICLE MASTER TAB — Dedicated UI for ARTICLE_MASTER sheet
// Layout views: Classic · Hierarchy · Column · Matrix · Cards
// ═══════════════════════════════════════════════════════════════

// ── Theme adapter ──
function toM(M) {
  return {
    ...M,
    sh: M.shellBg || M.surfHigh, shBd: M.shellBd || M.divider,
    hi: M.surfHigh, mid: M.surfMid, lo: M.surfLow,
    hov: M.hoverBg, inBg: M.inputBg, inBd: M.inputBd,
    div: M.divider, thd: M.tblHead, tev: M.tblEven, tod: M.tblOdd,
    bBg: M.badgeBg, bTx: M.badgeTx,
    tA: M.textA, tB: M.textB, tC: M.textC, tD: M.textD,
    scr: M.scrollThumb, shadow: M.shadow,
  };
}

// ── Division metadata (color + icon per L1 division) ──
const DIVISION_META = {
  "Men's Apparel":   { color: "#E8690A", icon: "👔" },
  "Women's Apparel": { color: "#7C3AED", icon: "👗" },
  "Kids Apparel":    { color: "#15803D", icon: "🧒" },
  "Unisex Apparel":  { color: "#0078D4", icon: "👕" },
};

const DIVISIONS = ["Men's Apparel", "Women's Apparel", "Kids Apparel", "Unisex Apparel"];

const L2_BY_DIV = {
  "Men's Apparel":   ["Tops - Polo", "Tops - Tee", "Sweatshirt", "Tracksuit", "Bottoms"],
  "Women's Apparel": ["Tops - Tee", "Sweatshirt", "Bottoms"],
  "Kids Apparel":    ["Tops - Tee", "Sweatshirt"],
  "Unisex Apparel":  ["Tops - Tee", "Sweatshirt"],
};

const L2_HSN = {
  "Tops - Polo": "6105", "Tops - Tee": "6109",
  "Sweatshirt":  "6110", "Tracksuit":  "6112", "Bottoms": "6103",
};

const FIT_OPTS     = ["Regular", "Slim", "Relaxed", "Oversized", "Crop"];
const NECK_OPTS    = ["Round Neck", "V-Neck", "Polo", "Henley", "Hood", "Crew Neck", "Quarter Zip"];
const SLEEVE_OPTS  = ["Half Sleeve", "Full Sleeve", "Sleeveless", "Cap Sleeve"];
const GENDER_OPTS  = ["Men", "Women", "Unisex", "Kids"];
const STATUS_OPTS  = ["Active", "Development", "Inactive"];

// ── Seed data — 23 sample Article Master records ──
const AM_SEED_DATA = [
  { code:"ART-001", desc:"Classic Pique Polo",        shortName:"Pique Polo",   l1Division:"Men's Apparel",   l2Category:"Tops - Polo", gender:"Men",    fitType:"Regular",   neckline:"Polo",        sleeveType:"Half Sleeve", season:"SS2024", wsp:450,  mrp:899,  hsnCode:"6105", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-002", desc:"Autostriper Polo",           shortName:"Stripe Polo",  l1Division:"Men's Apparel",   l2Category:"Tops - Polo", gender:"Men",    fitType:"Slim",      neckline:"Polo",        sleeveType:"Half Sleeve", season:"SS2024", wsp:520,  mrp:999,  hsnCode:"6105", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-003", desc:"Jacquard Polo",              shortName:"JQ Polo",      l1Division:"Men's Apparel",   l2Category:"Tops - Polo", gender:"Men",    fitType:"Regular",   neckline:"Polo",        sleeveType:"Half Sleeve", season:"AW2024", wsp:580,  mrp:1099, hsnCode:"6105", status:"Development", buyerStyle:"",   tags:"" },
  { code:"ART-004", desc:"Round Neck Regular Tee",     shortName:"RN Tee",       l1Division:"Men's Apparel",   l2Category:"Tops - Tee",  gender:"Men",    fitType:"Regular",   neckline:"Round Neck",  sleeveType:"Half Sleeve", season:"SS2024", wsp:280,  mrp:549,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-005", desc:"V-Neck Tee",                 shortName:"VN Tee",       l1Division:"Men's Apparel",   l2Category:"Tops - Tee",  gender:"Men",    fitType:"Slim",      neckline:"V-Neck",      sleeveType:"Half Sleeve", season:"SS2024", wsp:300,  mrp:599,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-006", desc:"Oversized Tee",              shortName:"OS Tee",       l1Division:"Men's Apparel",   l2Category:"Tops - Tee",  gender:"Men",    fitType:"Oversized", neckline:"Round Neck",  sleeveType:"Half Sleeve", season:"SS2024", wsp:320,  mrp:649,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-007", desc:"Pullover Hoodie",            shortName:"Hoodie",       l1Division:"Men's Apparel",   l2Category:"Sweatshirt",  gender:"Men",    fitType:"Regular",   neckline:"Hood",        sleeveType:"Full Sleeve", season:"AW2024", wsp:720,  mrp:1399, hsnCode:"6110", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-008", desc:"Crew Neck Sweatshirt",       shortName:"CNS",          l1Division:"Men's Apparel",   l2Category:"Sweatshirt",  gender:"Men",    fitType:"Regular",   neckline:"Crew Neck",   sleeveType:"Full Sleeve", season:"AW2024", wsp:680,  mrp:1299, hsnCode:"6110", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-009", desc:"Quarter Zip Sweatshirt",     shortName:"QZ Sweat",     l1Division:"Men's Apparel",   l2Category:"Sweatshirt",  gender:"Men",    fitType:"Regular",   neckline:"Quarter Zip", sleeveType:"Full Sleeve", season:"AW2024", wsp:750,  mrp:1449, hsnCode:"6110", status:"Development", buyerStyle:"",   tags:"" },
  { code:"ART-010", desc:"Jogger Pants",               shortName:"Jogger",       l1Division:"Men's Apparel",   l2Category:"Bottoms",     gender:"Men",    fitType:"Regular",   neckline:"",            sleeveType:"",            season:"AW2024", wsp:420,  mrp:799,  hsnCode:"6103", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-011", desc:"Athletic Shorts",            shortName:"Shorts",       l1Division:"Men's Apparel",   l2Category:"Bottoms",     gender:"Men",    fitType:"Regular",   neckline:"",            sleeveType:"",            season:"SS2024", wsp:320,  mrp:599,  hsnCode:"6103", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-012", desc:"Full Tracksuit",             shortName:"Tracksuit",    l1Division:"Men's Apparel",   l2Category:"Tracksuit",   gender:"Men",    fitType:"Regular",   neckline:"",            sleeveType:"Full Sleeve", season:"AW2024", wsp:1200, mrp:2299, hsnCode:"6112", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-013", desc:"Women Round Neck Tee",       shortName:"W RN Tee",     l1Division:"Women's Apparel", l2Category:"Tops - Tee",  gender:"Women",  fitType:"Regular",   neckline:"Round Neck",  sleeveType:"Half Sleeve", season:"SS2024", wsp:280,  mrp:549,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-014", desc:"Women Crop Top",             shortName:"Crop Top",     l1Division:"Women's Apparel", l2Category:"Tops - Tee",  gender:"Women",  fitType:"Crop",      neckline:"Round Neck",  sleeveType:"Half Sleeve", season:"SS2024", wsp:250,  mrp:499,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-015", desc:"Women Oversized Tee",        shortName:"W OS Tee",     l1Division:"Women's Apparel", l2Category:"Tops - Tee",  gender:"Women",  fitType:"Oversized", neckline:"Round Neck",  sleeveType:"Half Sleeve", season:"SS2024", wsp:300,  mrp:599,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-016", desc:"Women Hoodie",               shortName:"W Hoodie",     l1Division:"Women's Apparel", l2Category:"Sweatshirt",  gender:"Women",  fitType:"Regular",   neckline:"Hood",        sleeveType:"Full Sleeve", season:"AW2024", wsp:680,  mrp:1299, hsnCode:"6110", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-017", desc:"Women Crew Neck Sweatshirt", shortName:"W CNS",        l1Division:"Women's Apparel", l2Category:"Sweatshirt",  gender:"Women",  fitType:"Regular",   neckline:"Crew Neck",   sleeveType:"Full Sleeve", season:"AW2024", wsp:650,  mrp:1249, hsnCode:"6110", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-018", desc:"Women Jogger",               shortName:"W Jogger",     l1Division:"Women's Apparel", l2Category:"Bottoms",     gender:"Women",  fitType:"Regular",   neckline:"",            sleeveType:"",            season:"AW2024", wsp:380,  mrp:749,  hsnCode:"6103", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-019", desc:"Kids Round Neck Tee",        shortName:"K RN Tee",     l1Division:"Kids Apparel",    l2Category:"Tops - Tee",  gender:"Kids",   fitType:"Regular",   neckline:"Round Neck",  sleeveType:"Half Sleeve", season:"SS2024", wsp:220,  mrp:449,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-020", desc:"Kids Graphic Tee",           shortName:"K Graphic",    l1Division:"Kids Apparel",    l2Category:"Tops - Tee",  gender:"Kids",   fitType:"Regular",   neckline:"Round Neck",  sleeveType:"Half Sleeve", season:"SS2024", wsp:240,  mrp:499,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-021", desc:"Kids Hoodie",                shortName:"K Hoodie",     l1Division:"Kids Apparel",    l2Category:"Sweatshirt",  gender:"Kids",   fitType:"Regular",   neckline:"Hood",        sleeveType:"Full Sleeve", season:"AW2024", wsp:520,  mrp:999,  hsnCode:"6110", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-022", desc:"Unisex Oversized Tee",       shortName:"U OS Tee",     l1Division:"Unisex Apparel",  l2Category:"Tops - Tee",  gender:"Unisex", fitType:"Oversized", neckline:"Round Neck",  sleeveType:"Half Sleeve", season:"SS2024", wsp:340,  mrp:699,  hsnCode:"6109", status:"Active",      buyerStyle:"",   tags:"" },
  { code:"ART-023", desc:"Unisex Hoodie",              shortName:"U Hoodie",     l1Division:"Unisex Apparel",  l2Category:"Sweatshirt",  gender:"Unisex", fitType:"Regular",   neckline:"Hood",        sleeveType:"Full Sleeve", season:"AW2024", wsp:720,  mrp:1399, hsnCode:"6110", status:"Active",      buyerStyle:"",   tags:"" },
];

// ── Enrich each article with derived l1Category (first segment of l2Category) ──
const AM_DATA = AM_SEED_DATA.map(r => ({
  ...r,
  l1Category: r.l2Category?.split(' - ')[0] || '',
}));

const CC_RED = '#CC0000';
const TOAST_COLORS = { success: '#15803d', delete: '#dc2626', view: '#7C3AED', info: '#0078D4' };

// ── Fields schema for records table ──
const AM_FIELDS = [
  { key: 'code',       label: 'Art Code',   w: 90,  mono: true },
  { key: 'desc',       label: 'Description',w: 200 },
  { key: 'l1Division', label: 'Division',   w: 130 },
  { key: 'l2Category', label: 'Category',   w: 120 },
  { key: 'gender',     label: 'Gender',     w: 75 },
  { key: 'season',     label: 'Season',     w: 75 },
  { key: 'wsp',        label: 'WSP ₹',      w: 75,  type: 'number' },
  { key: 'mrp',        label: 'MRP ₹',      w: 75,  type: 'number' },
  { key: 'hsnCode',    label: 'HSN',        w: 65,  mono: true },
  { key: 'status',     label: 'Status',     w: 90,  badge: true },
];

// ── Toast system ──
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, color = TOAST_COLORS.success) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, color }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  }, []);
  return { toasts, add };
}
function Toasts({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.color, color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 12, fontWeight: 800, boxShadow: "0 4px 20px rgba(0,0,0,.25)", animation: "amSlideIn .3s ease" }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── divColor helper ──
const divColor = (l1) => DIVISION_META[l1]?.color || '#0078D4';
const divIcon  = (l1) => DIVISION_META[l1]?.icon  || '👕';

// ── Dynamic grouping constants ──
const GROUPABLE_FIELDS = [
  { key: "l1Division", label: "Division"    },
  { key: "l1Category", label: "L1 Category" },
  { key: "l2Category", label: "L2 Category" },
  { key: "gender",     label: "Gender"    },
  { key: "season",     label: "Season"    },
  { key: "fitType",    label: "Fit Type"  },
  { key: "neckline",   label: "Neckline"  },
  { key: "sleeveType", label: "Sleeve"    },
  { key: "status",     label: "Status"    },
];

const PRESETS = [
  { label: "Div › Category",   l1: "l1Division", l2: "l2Category" },
  { label: "Gender › Category", l1: "gender",    l2: "l2Category" },
  { label: "Season › Category", l1: "season",    l2: "l2Category" },
  { label: "Category › Fit",   l1: "l2Category", l2: "fitType"    },
  { label: "Gender › Fit",     l1: "gender",     l2: "fitType"    },
  { label: "Status › Div",     l1: "status",     l2: "l1Division" },
];

const PALETTE = ["#E8690A","#7C3AED","#15803D","#0078D4","#DC2626","#D97706","#059669","#2563EB","#DB2777","#0891B2","#65A30D","#9333EA"];
function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const GENDER_META   = { Men:{ color:"#0078D4",icon:"👔" }, Women:{ color:"#7C3AED",icon:"👗" }, Kids:{ color:"#15803D",icon:"🧒" }, Unisex:{ color:"#D97706",icon:"👕" } };
const SEASON_META   = { SS2024:{ color:"#0891B2",icon:"☀️" }, AW2024:{ color:"#7C3AED",icon:"🍂" }, SS2025:{ color:"#059669",icon:"🌱" }, AW2025:{ color:"#DC2626",icon:"❄️" } };
const STATUS_META   = { Active:{ color:"#15803D",icon:"✅" }, Development:{ color:"#D97706",icon:"🔧" }, Inactive:{ color:"#DC2626",icon:"⛔" } };
const FIT_META      = { Regular:{ color:"#0078D4",icon:"👤" }, Slim:{ color:"#7C3AED",icon:"◁" }, Relaxed:{ color:"#059669",icon:"◻" }, Oversized:{ color:"#D97706",icon:"⬜" }, Crop:{ color:"#DB2777",icon:"✂️" } };
const SLEEVE_META   = { "Half Sleeve":{ color:"#0891B2",icon:"💪" }, "Full Sleeve":{ color:"#2563EB",icon:"🧥" }, "Sleeveless":{ color:"#D97706",icon:"🏋️" }, "Cap Sleeve":{ color:"#DB2777",icon:"💅" } };

function getGroupMeta(field, value) {
  if (field === "l1Division") return { color: divColor(value), icon: divIcon(value) };
  if (field === "l2Category") return { color: hashColor(value), icon: "📂" };
  if (field === "gender")     return GENDER_META[value]   || { color: hashColor(value), icon: "👤" };
  if (field === "season")     return SEASON_META[value]   || { color: hashColor(value), icon: "📅" };
  if (field === "status")     return STATUS_META[value]   || { color: hashColor(value), icon: "●"  };
  if (field === "fitType")    return FIT_META[value]      || { color: hashColor(value), icon: "👔" };
  if (field === "sleeveType") return SLEEVE_META[value]   || { color: hashColor(value), icon: "💪" };
  if (field === "neckline")   return { color: hashColor(value), icon: "🔵" };
  return { color: hashColor(value), icon: "◆" };
}

// ── Status badge ──
function StatusBadge({ status }) {
  const cfg = {
    Active:      { bg: '#d1fae5', color: '#065f46' },
    Development: { bg: '#fef3c7', color: '#92400e' },
    Inactive:    { bg: '#fee2e2', color: '#991b1b' },
  }[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.color }}>
      {status || '—'}
    </span>
  );
}


// ══════════════════════════════════════════════════════════════
// DISPLAY OPTIONS — Notion-style field / thumbnail / density
// ══════════════════════════════════════════════════════════════
const DISPLAY_FIELDS = [
  { key: "code",       label: "Art Code"     },
  { key: "shortName",  label: "Short Name"   },
  { key: "gender",     label: "Gender"       },
  { key: "season",     label: "Season"       },
  { key: "fitType",    label: "Fit Type"     },
  { key: "neckline",   label: "Neckline"     },
  { key: "sleeveType", label: "Sleeve Type"  },
  { key: "wsp",        label: "WSP ₹"        },
  { key: "mrp",        label: "MRP ₹"        },
  { key: "hsnCode",    label: "HSN Code"     },
  { key: "status",     label: "Status"       },
  { key: "buyerStyle", label: "Buyer Style"  },
  { key: "tags",       label: "Tags"         },
];
const INIT_SHOW_FIELDS = Object.fromEntries(
  DISPLAY_FIELDS.map(f => [f.key, ["code","gender","season","fitType","wsp","mrp","status"].includes(f.key)])
);
const INIT_DISPLAY_OPTS = { thumbnail: false, thumbSize: "md", density: "summary", showFields: INIT_SHOW_FIELDS };

// ── Toggle switch pill ──
function ToggleSwitch({ on, onChange, A }) {
  return (
    <div onClick={onChange} title={on ? "On" : "Off"}
      style={{ width: 30, height: 16, borderRadius: 8, background: on ? A.a : '#aaa', cursor: 'pointer', position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 12, height: 12, borderRadius: 6, background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </div>
  );
}

// ── Thumbnail placeholder (initials avatar or real img) ──
function ArtThumbnail({ art, size, color, cover = false }) {
  const initials = (art.shortName || art.desc || art.code || "AX").slice(0, 2).toUpperCase();
  if (cover) {
    const h = size === "sm" ? 62 : size === "lg" ? 128 : 90;
    return art.imageLink
      ? <img src={art.imageLink} alt="" style={{ width: '100%', height: h, objectFit: 'cover', display: 'block' }} />
      : <div style={{ width: '100%', height: h, background: `linear-gradient(135deg,${color}28,${color}0c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <span style={{ fontSize: h * 0.38, fontWeight: 900, color: color + '55', fontFamily: 'monospace', letterSpacing: 4 }}>{initials}</span>
          <span style={{ position: 'absolute', right: 8, bottom: 6, fontSize: 8, fontWeight: 900, color, background: color + '18', padding: '1px 6px', borderRadius: 5, fontFamily: 'monospace' }}>{art.code}</span>
        </div>;
  }
  const sz = size === "sm" ? 30 : size === "lg" ? 58 : 42;
  const fs = size === "sm" ? 9 : size === "lg" ? 18 : 13;
  return art.imageLink
    ? <img src={art.imageLink} alt="" style={{ width: sz, height: sz, objectFit: 'cover', borderRadius: size === "sm" ? 4 : 8, flexShrink: 0 }} />
    : <div style={{ width: sz, height: sz, borderRadius: size === "sm" ? 4 : 8, background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${color}30` }}>
        <span style={{ fontSize: fs, fontWeight: 900, color, fontFamily: 'monospace' }}>{initials}</span>
      </div>;
}

// ── Shared article row renderer (Classic + Column views) ──
function ArtListRow({ art, displayOpts, color, M, A, uff, dff, fz }) {
  const { thumbnail, thumbSize, density, showFields: sf } = displayOpts;
  const det = density === "detail";
  return (
    <div style={{ display: 'flex', alignItems: thumbnail && thumbSize !== "sm" ? 'flex-start' : 'center', gap: 10 }}>
      {thumbnail && <ArtThumbnail art={art} size={thumbSize} color={color} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Line 1: code + title + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {sf.code && <span style={{ fontSize: 9, fontWeight: 900, color, fontFamily: dff, flexShrink: 0 }}>{art.code}</span>}
          <span style={{ fontSize: fz - 1, fontWeight: 700, color: M.tA, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{art.desc}</span>
          {sf.status && <StatusBadge status={art.status} />}
        </div>
        {/* Line 2: tag pills */}
        {(sf.gender || sf.season || (det && (sf.fitType || sf.neckline || sf.sleeveType))) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
            {sf.gender    && art.gender    && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6, background: color + '14', color, fontFamily: uff, fontWeight: 700 }}>{art.gender}</span>}
            {sf.season    && art.season    && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6, background: M.mid, color: M.tC, fontFamily: uff, fontWeight: 700 }}>{art.season}</span>}
            {det && sf.fitType    && art.fitType    && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6, background: color + '12', color, fontFamily: uff }}>{art.fitType}</span>}
            {det && sf.neckline   && art.neckline   && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6, background: color + '12', color, fontFamily: uff }}>{art.neckline}</span>}
            {det && sf.sleeveType && art.sleeveType && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6, background: color + '12', color, fontFamily: uff }}>{art.sleeveType}</span>}
          </div>
        )}
        {/* Line 3: pricing + meta (detail only) */}
        {det && (sf.wsp || sf.mrp || sf.hsnCode || sf.shortName || sf.buyerStyle) && (
          <div style={{ display: 'flex', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
            {sf.shortName  && art.shortName  && <span style={{ fontSize: 8, color: M.tD, fontFamily: uff }}>"{art.shortName}"</span>}
            {sf.wsp        && art.wsp        && <span style={{ fontSize: 8, color: M.tD, fontFamily: uff }}><b>WSP</b> ₹{art.wsp}</span>}
            {sf.mrp        && art.mrp        && <span style={{ fontSize: 8, color: M.tD, fontFamily: uff }}><b>MRP</b> ₹{art.mrp}</span>}
            {sf.hsnCode    && art.hsnCode    && <span style={{ fontSize: 8, color: M.tD, fontFamily: uff }}><b>HSN</b> {art.hsnCode}</span>}
            {sf.buyerStyle && art.buyerStyle && <span style={{ fontSize: 8, color: M.tD, fontFamily: uff }}><b>Style</b> {art.buyerStyle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cover-card renderer for Classic / Column / Hierarchy gallery mode ──
function ArtCoverCard({ art, displayOpts, color, M, A, uff, dff, fz, onClick }) {
  const { thumbSize } = displayOpts;
  const minW = thumbSize === 'sm' ? 110 : thumbSize === 'lg' ? 210 : 155;
  return (
    <div onClick={onClick} style={{ background: M.hi, border: `1.5px solid ${M.div}`, borderRadius: 10, overflow: 'hidden', transition: 'all .15s', boxShadow: '0 1px 4px rgba(0,0,0,.06)', minWidth: minW, cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${color}28`; e.currentTarget.style.borderColor = color; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'; e.currentTarget.style.borderColor = M.div; }}>
      <ArtThumbnail art={art} size={thumbSize} color={color} cover />
      <div style={{ padding: '7px 9px 9px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, color, fontFamily: dff, flexShrink: 0 }}>{art.code}</span>
          <StatusBadge status={art.status} />
        </div>
        <div style={{ fontSize: fz - 1, fontWeight: 800, color: M.tA, fontFamily: uff, lineHeight: 1.3, marginBottom: 4 }}>{art.desc}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {art.gender && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6, background: `${color}14`, color, fontFamily: uff, fontWeight: 700 }}>{art.gender}</span>}
          {art.season && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6, background: M.mid, color: M.tC, fontFamily: uff, fontWeight: 700 }}>{art.season}</span>}
        </div>
        {(art.wsp || art.mrp) && (
          <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px solid ${M.div}`, display: 'flex', gap: 8 }}>
            {art.wsp && <span style={{ fontSize: 8, color: M.tD, fontFamily: uff }}><b style={{ color: M.tB }}>WSP</b> ₹{art.wsp}</span>}
            {art.mrp && <span style={{ fontSize: 8, color: M.tD, fontFamily: uff }}><b style={{ color: M.tB }}>MRP</b> ₹{art.mrp}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notion-style View Options floating panel ──
function ViewOptionsPanel({ displayOpts, setDisplayOpts, onClose, M, A, uff }) {
  const panelRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const setOpt      = (key, val) => setDisplayOpts(p => ({ ...p, [key]: val }));
  const toggleField = (key)      => setDisplayOpts(p => ({ ...p, showFields: { ...p.showFields, [key]: !p.showFields[key] } }));
  const allOn  = () => setDisplayOpts(p => ({ ...p, showFields: Object.fromEntries(DISPLAY_FIELDS.map(f => [f.key, true])) }));
  const allOff = () => setDisplayOpts(p => ({ ...p, showFields: Object.fromEntries(DISPLAY_FIELDS.map(f => [f.key, false])) }));

  const rowS = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' };
  const sectionS = { padding: '10px 14px', borderBottom: `1px solid ${M.div}` };
  const labelS = { fontSize: 10, fontWeight: 700, color: M.tB, fontFamily: uff };
  const pillRow = { display: 'flex', gap: 4, marginTop: 7 };
  const pill = (active) => ({
    flex: 1, padding: '3px 0', border: `1px solid ${active ? A.a : M.div}`,
    borderRadius: 5, background: active ? A.al : 'transparent',
    color: active ? A.a : M.tC, fontSize: 9, fontWeight: active ? 800 : 500,
    cursor: 'pointer', fontFamily: uff,
  });

  return (
    <div ref={panelRef}
      style={{ position: 'absolute', right: 0, top: 34, zIndex: 950, width: 252, background: M.hi, border: `1px solid ${M.div}`, borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.20)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '9px 14px', borderBottom: `1px solid ${M.div}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: M.thd }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: M.tA, fontFamily: uff }}>⚙ View Options</span>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: M.tD, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>

      {/* Thumbnail */}
      <div style={sectionS}>
        <div style={rowS}>
          <span style={labelS}>🖼 Thumbnail</span>
          <ToggleSwitch on={displayOpts.thumbnail} onChange={() => setOpt('thumbnail', !displayOpts.thumbnail)} A={A} />
        </div>
        {displayOpts.thumbnail && (
          <>
            <div style={{ fontSize: 9, color: M.tD, fontFamily: uff, marginTop: 6, marginBottom: 4 }}>Size</div>
            <div style={pillRow}>
              {[['sm','Small'],['md','Medium'],['lg','Large']].map(([v, l]) => (
                <button key={v} onClick={() => setOpt('thumbSize', v)} style={pill(displayOpts.thumbSize === v)}>{l}</button>
              ))}
            </div>
            <div style={{ fontSize: 9, color: M.tD, fontFamily: uff, marginTop: 6, marginBottom: 4 }}>Display style</div>
            <div style={pillRow}>
              {[['icon','Icon'],['cover','Cover']].map(([v, l]) => (
                <button key={v} onClick={() => setOpt('thumbMode', v)} style={pill((displayOpts.thumbMode || 'icon') === v)}>{l}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Level */}
      <div style={sectionS}>
        <div style={{ ...labelS, marginBottom: 7 }}>Detail Level</div>
        <div style={pillRow}>
          {[['summary','Summary'],['detail','Detail']].map(([v, l]) => (
            <button key={v} onClick={() => setOpt('density', v)} style={pill(displayOpts.density === v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Properties */}
      <div style={{ padding: '10px 14px', maxHeight: 268, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.6 }}>Properties</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={allOn}  style={{ fontSize: 8, color: A.a, background: 'none', border: 'none', cursor: 'pointer', fontFamily: uff, fontWeight: 700 }}>All on</button>
            <button onClick={allOff} style={{ fontSize: 8, color: M.tD, background: 'none', border: 'none', cursor: 'pointer', fontFamily: uff }}>All off</button>
          </div>
        </div>
        {DISPLAY_FIELDS.map((f, fi) => (
          <div key={f.key} style={{ ...rowS, borderBottom: fi < DISPLAY_FIELDS.length - 1 ? `1px solid ${M.div}28` : 'none' }}>
            <span style={{ fontSize: 10, color: displayOpts.showFields[f.key] ? M.tA : M.tD, fontFamily: uff }}>{f.label}</span>
            <ToggleSwitch on={!!displayOpts.showFields[f.key]} onChange={() => toggleField(f.key)} A={A} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ArticleMasterTab({ M: rawM, A, uff, dff, canEdit = true }) {
  const M  = toM(rawM);
  const fz = 13;
  const { toasts, add: addToast } = useToast();
  const showToast = (msg, colorKey = 'success') =>
    addToast(msg, TOAST_COLORS[colorKey] || colorKey || TOAST_COLORS.success);

  const [data,        setData]       = useState(AM_DATA);
  const [tab,         setTab]        = useState("layout");
  const [layoutTab,   setLayoutTab]  = useState("classic");
  const [editItem,    setEditItem]   = useState(null);
  const [selectedArt, setSelectedArt] = useState(null);

  // ─── ORG HIERARCHY (l1Division → l2Category → articles) ───
  const orgHierarchy = useMemo(() => {
    const h = {};
    data.forEach(r => {
      const l1 = r.l1Division;
      if (!h[l1]) {
        h[l1] = { label: l1, color: divColor(l1), icon: divIcon(l1), l2s: {} };
      }
      if (!h[l1].l2s[r.l2Category]) h[l1].l2s[r.l2Category] = [];
      h[l1].l2s[r.l2Category].push(r);
    });
    // Preserve DIVISIONS order
    return DIVISIONS.map(d => h[d]).filter(Boolean);
  }, [data]);

  // ─── AUDIT LOG ───
  const [auditLog, setAuditLog] = useState([
    { id: 3, type: 'IMPORT', user: 'System', ts: '01 Jan 2026 09:00', msg: 'Imported 23 articles from initial seed data', detail: null },
    { id: 2, type: 'ADD',    user: 'Admin',  ts: '15 Jan 2026 11:30', msg: 'Added ART-022 "Unisex Oversized Tee"', detail: null },
    { id: 1, type: 'EDIT',   user: 'Admin',  ts: '01 Feb 2026 14:20', msg: 'Updated ART-003 status: Active → Development', detail: { before: { status: 'Active' }, after: { status: 'Development' } } },
  ]);
  const addLog = useCallback((type, msg, detail = null) => {
    const ts = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setAuditLog(prev => [{ id: Date.now(), type, user: 'Admin', ts, msg, detail }, ...prev]);
  }, []);

  // ─── CREATE FORM STATE ───
  const emptyForm = { desc: "", shortName: "", l1Division: "", l2Category: "", gender: "", fitType: "", neckline: "", sleeveType: "", season: "", wsp: "", mrp: "", hsnCode: "", buyerStyle: "", status: "Active", tags: "" };
  const [form, setForm]           = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const setL1Division = (v) => {
    setForm(f => ({ ...f, l1Division: v, l2Category: "", hsnCode: "" }));
    setFormErrors({});
  };
  const setL2Category = (v) => {
    setForm(f => ({ ...f, l2Category: v, hsnCode: L2_HSN[v] || "" }));
    setFormErrors({});
  };

  const l2Opts = form.l1Division ? (L2_BY_DIV[form.l1Division] || []) : [];

  // ─── Next code ───
  const nextCode = useMemo(() => {
    const nums = data.map(d => parseInt(d.code.replace("ART-", ""), 10)).filter(n => !isNaN(n));
    const max  = nums.length ? Math.max(...nums) : 0;
    return `ART-${String(max + 1).padStart(3, "0")}`;
  }, [data]);

  // ─── Save handler ───
  const handleSave = async () => {
    const errs = {};
    if (!form.desc.trim())   errs.desc       = "Required";
    if (!form.l1Division)    errs.l1Division = "Required";
    if (!form.l2Category)    errs.l2Category = "Required";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    if (editItem) {
      const before = { desc: editItem.desc, l1Division: editItem.l1Division, l2Category: editItem.l2Category, status: editItem.status };
      const after  = { desc: form.desc,     l1Division: form.l1Division,     l2Category: form.l2Category,     status: form.status };
      setData(prev => prev.map(d => d.code === editItem.code ? { ...d, ...form } : d));
      showToast(`✓ Updated ${editItem.code}`, 'success');
      addLog('EDIT', `Updated ${editItem.code} — ${form.desc}`, { before, after });
      try { await api.updateMasterRecord('article_master', editItem.code, { ...form }); } catch {}
      setEditItem(null);
    } else {
      const newItem = { code: nextCode, ...form };
      setData(prev => [...prev, newItem]);
      showToast(`✓ Created ${nextCode}`, 'success');
      addLog('ADD', `Added ${nextCode} — ${form.desc} in ${form.l1Division} › ${form.l2Category}`, null);
      try { await api.saveMasterRecord('article_master', 'FILE 1A — Items', { ...form, code: nextCode }, false); } catch {}
    }
    setForm(emptyForm);
    setFormErrors({});
  };

  const handleEdit = (item) => {
    if (!canEdit) return; // guard — blocked if user has no edit rights
    setEditItem(item);
    setForm({
      desc: item.desc || "", shortName: item.shortName || "",
      l1Division: item.l1Division || "", l2Category: item.l2Category || "",
      gender: item.gender || "", fitType: item.fitType || "",
      neckline: item.neckline || "", sleeveType: item.sleeveType || "",
      season: item.season || "", wsp: item.wsp || "", mrp: item.mrp || "",
      hsnCode: item.hsnCode || "", buyerStyle: item.buyerStyle || "",
      status: item.status || "Active", tags: item.tags || "",
    });
    setTab("create");
  };

  // ─── Style helpers ───
  const tabBtnStyle = (active) => ({
    padding: "8px 16px", border: "none", cursor: "pointer",
    background: active ? M.hi : M.mid,
    borderTop: `2px solid ${active ? A.a : "transparent"}`,
    borderRight: `1px solid ${active ? M.div : "transparent"}`,
    borderLeft: `1px solid ${active ? M.div : "transparent"}`,
    borderBottom: `1px solid ${active ? M.hi : M.div}`,
    marginBottom: active ? -1 : 0, borderRadius: "5px 5px 0 0",
    fontSize: 11, fontWeight: active ? 900 : 600,
    color: active ? A.a : M.tC, fontFamily: uff,
  });
  const layoutBtnS = (active) => ({
    padding: "4px 13px", border: `1px solid ${active ? A.a : M.div}`,
    borderRadius: 5, background: active ? A.al : "transparent",
    color: active ? A.a : M.tB, fontSize: 10, fontWeight: active ? 900 : 600,
    cursor: "pointer", fontFamily: uff,
  });
  const inp  = { padding: "7px 10px", border: `1px solid ${M.inBd}`, borderRadius: 6, background: M.inBg, color: M.tA, fontSize: fz - 1, fontFamily: uff, width: "100%", boxSizing: "border-box", outline: "none" };
  const lbl  = { fontSize: 9.5, fontWeight: 800, color: M.tD, fontFamily: uff, textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 };
  const btn  = (bg, c) => ({ padding: "8px 18px", border: "none", borderRadius: 6, background: bg, color: c, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: uff });

  // ─── RENDER ───
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: uff }}>

      {/* ── MAIN TAB BAR ── */}
      <div style={{ padding: "8px 16px 0", display: "flex", gap: 4, borderBottom: `1px solid ${M.div}`, flexShrink: 0 }}>
        <button onClick={() => { setTab("create"); setEditItem(null); setForm(emptyForm); setFormErrors({}); }}
          style={tabBtnStyle(tab === "create")}>
          {editItem ? "✏️ Edit" : "➕ Create"} Article
        </button>
        <button onClick={() => setTab("records")}  style={tabBtnStyle(tab === "records")}>📋 Records</button>
        <button onClick={() => setTab("layout")}   style={tabBtnStyle(tab === "layout")}>🖼 Layout View</button>
        <button onClick={() => setTab("auditlog")} style={tabBtnStyle(tab === "auditlog")}>📋 Audit Logs</button>
      </div>

      {/* ── LAYOUT SUB-TAB BAR ── */}
      {tab === "layout" && (
        <div style={{ padding: "6px 16px", display: "flex", gap: 4, borderBottom: `1px solid ${M.div}`, background: M.thd, flexShrink: 0, flexWrap: "wrap" }}>
          {[
            { id: "classic",   label: "🌳 Classic View"   },
            { id: "hierarchy", label: "⟁ Hierarchy View"  },
            { id: "column",    label: "≡ Column View"     },
            { id: "matrix",    label: "⊞ Matrix View"     },
            { id: "cards",     label: "▦ Cards View"      },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setLayoutTab(id)} style={layoutBtnS(layoutTab === id)}>{label}</button>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 9, color: M.tD, fontFamily: uff, alignSelf: "center" }}>
            {orgHierarchy.length} divisions · {data.length} articles
          </div>
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div style={{ flex: 1, overflow: tab === "layout" ? "hidden" : "auto", display: "flex", flexDirection: "column" }}>

        {/* ═══ CREATE / EDIT FORM ═══ */}
        {tab === "create" && (
          <div style={{ padding: 24, maxWidth: 780, overflowY: "auto" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: M.tA, fontFamily: uff, marginBottom: 20 }}>
              {editItem ? `✏️ Editing ${editItem.code}` : "➕ New Article"}
            </div>

            {/* Row 1: Description + Short Name */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Description *</label>
                <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                  style={{ ...inp, borderColor: formErrors.desc ? '#ef4444' : M.inBd }}
                  placeholder="e.g. Classic Pique Polo" />
                {formErrors.desc && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 3 }}>{formErrors.desc}</div>}
              </div>
              <div>
                <label style={lbl}>Short Name</label>
                <input value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
                  style={inp} placeholder="e.g. Pique Polo" />
              </div>
            </div>

            {/* Row 2: L1 Division + L2 Category + HSN */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 110px", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>L1 Division *</label>
                <select value={form.l1Division} onChange={e => setL1Division(e.target.value)}
                  style={{ ...inp, borderColor: formErrors.l1Division ? '#ef4444' : M.inBd }}>
                  <option value="">Select Division…</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>{divIcon(d)} {d}</option>)}
                </select>
                {formErrors.l1Division && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 3 }}>{formErrors.l1Division}</div>}
              </div>
              <div>
                <label style={lbl}>L2 Category *</label>
                <select value={form.l2Category} onChange={e => setL2Category(e.target.value)}
                  disabled={!form.l1Division}
                  style={{ ...inp, borderColor: formErrors.l2Category ? '#ef4444' : M.inBd, opacity: form.l1Division ? 1 : 0.5 }}>
                  <option value="">Select Category…</option>
                  {l2Opts.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {formErrors.l2Category && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 3 }}>{formErrors.l2Category}</div>}
              </div>
              <div>
                <label style={lbl}>HSN Code</label>
                <input value={form.hsnCode} onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))}
                  style={inp} placeholder="Auto" />
              </div>
            </div>

            {/* Row 3: Gender + Fit Type + Neckline + Sleeve */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Gender</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={inp}>
                  <option value="">—</option>
                  {GENDER_OPTS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Fit Type</label>
                <select value={form.fitType} onChange={e => setForm(f => ({ ...f, fitType: e.target.value }))} style={inp}>
                  <option value="">—</option>
                  {FIT_OPTS.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Neckline</label>
                <select value={form.neckline} onChange={e => setForm(f => ({ ...f, neckline: e.target.value }))} style={inp}>
                  <option value="">—</option>
                  {NECK_OPTS.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Sleeve Type</label>
                <select value={form.sleeveType} onChange={e => setForm(f => ({ ...f, sleeveType: e.target.value }))} style={inp}>
                  <option value="">—</option>
                  {SLEEVE_OPTS.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4: Season + WSP + MRP + Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Season</label>
                <input value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
                  style={inp} placeholder="e.g. SS2024" />
              </div>
              <div>
                <label style={lbl}>WSP (₹)</label>
                <input type="number" value={form.wsp} onChange={e => setForm(f => ({ ...f, wsp: e.target.value }))}
                  style={inp} placeholder="0" />
              </div>
              <div>
                <label style={lbl}>MRP (₹)</label>
                <input type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                  style={inp} placeholder="0" />
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Row 5: Buyer Style + Tags */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Buyer Style No</label>
                <input value={form.buyerStyle} onChange={e => setForm(f => ({ ...f, buyerStyle: e.target.value }))}
                  style={inp} placeholder="Optional" />
              </div>
              <div>
                <label style={lbl}>Tags</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  style={inp} placeholder="e.g. New, Featured" />
              </div>
            </div>

            {/* Preview */}
            {form.desc && form.l1Division && form.l2Category && (
              <div style={{ padding: 14, borderRadius: 8, border: `1px dashed ${A.a}`, background: A.al, marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", color: A.a, letterSpacing: 0.5, marginBottom: 6 }}>Preview</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: divColor(form.l1Division) }}>{editItem ? editItem.code : nextCode}</span>
                  <span style={{ color: M.div }}>│</span>
                  <span style={{ fontWeight: 700, color: M.tA }}>{form.l1Division}</span>
                  <span style={{ color: M.tD }}>›</span>
                  <span style={{ fontWeight: 600, color: M.tB }}>{form.l2Category}</span>
                  <span style={{ color: M.div }}>│</span>
                  <span style={{ fontWeight: 800, color: M.tA }}>{form.desc}</span>
                  {form.hsnCode && <><span style={{ color: M.div }}>│</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: M.tC }}>HSN {form.hsnCode}</span></>}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${M.div}` }}>
              <button onClick={() => { setForm(emptyForm); setEditItem(null); setFormErrors({}); }} style={btn(M.bBg, M.bTx)}>↺ Clear</button>
              <button onClick={handleSave} style={btn(A.a, A.tx)}>
                {editItem ? "💾 Update Article" : "✚ Save Article"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ RECORDS ═══ */}
        {tab === "records" && (
          <AM_RecordsView data={data} onEdit={handleEdit} showToast={showToast} M={M} A={A} uff={uff} dff={dff} fz={fz} />
        )}

        {/* ═══ LAYOUT VIEWS ═══ */}
        {tab === "layout" && layoutTab === "classic"   && <AM_ClassicTree   hierarchy={orgHierarchy} data={data} M={M} A={A} uff={uff} dff={dff} fz={fz} onArtClick={art => setSelectedArt(art)} />}
        {tab === "layout" && layoutTab === "hierarchy" && <AM_FlowDiagram   hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} onArtClick={art => setSelectedArt(art)} />}
        {tab === "layout" && layoutTab === "column"    && <AM_ColumnNav     hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} onArtClick={art => setSelectedArt(art)} />}
        {tab === "layout" && layoutTab === "cards"     && <AM_CardsView     data={data} hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} onArtClick={art => setSelectedArt(art)} />}
        {tab === "layout" && layoutTab === "matrix"    && <AM_MatrixView    data={data} M={M} A={A} uff={uff} dff={dff} fz={fz} onArtClick={art => setSelectedArt(art)} />}

        {/* ═══ AUDIT LOGS ═══ */}
        {tab === "auditlog" && (
          <AM_AuditLogView auditLog={auditLog} M={M} A={A} uff={uff} dff={dff} fz={fz} />
        )}
      </div>

      {/* ── Article detail popup (Layout View) ── */}
      {selectedArt && (() => {
        const idx = data.findIndex(a => a.code === selectedArt.code);
        return (
          <ArtDetailModal
            art={selectedArt}
            onClose={() => setSelectedArt(null)}
            onPrev={idx > 0 ? () => setSelectedArt(data[idx - 1]) : null}
            onNext={idx < data.length - 1 ? () => setSelectedArt(data[idx + 1]) : null}
            artIndex={idx} totalArts={data.length}
            canEdit={canEdit}
            onEdit={canEdit ? (item) => { handleEdit(item); setSelectedArt(null); } : null}
            M={M} A={A} uff={uff} dff={dff} fz={fz}
          />
        );
      })()}

      <Toasts toasts={toasts} />
      <style>{`@keyframes amSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// AM RECORDS VIEW — sortable table of all Article Master records
// ════════════════════════════════════════════════════════════════
function AM_RecordsView({ data, onEdit, showToast, M, A, uff, dff, fz = 13 }) {
  const [search,  setSearch]  = useState('');
  const [sortCol, setSortCol] = useState('code');
  const [sortDir, setSortDir] = useState('asc');
  const [filterDiv, setFilterDiv] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = useMemo(() => {
    let r = data;
    if (filterDiv !== 'ALL') r = r.filter(d => d.l1Division === filterDiv);
    if (filterStatus !== 'ALL') r = r.filter(d => d.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(d => [d.code, d.desc, d.l1Division, d.l2Category, d.gender, d.season, d.hsnCode].some(v => String(v || '').toLowerCase().includes(q)));
    }
    return r;
  }, [data, search, filterDiv, filterStatus]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
      const d  = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? d : -d;
    });
  }, [filtered, sortCol, sortDir]);

  const handleHeaderClick = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
  };

  const thStyle = (key) => ({
    padding: '8px 12px', textAlign: 'left', fontSize: fz - 3, fontWeight: 900,
    color: sortCol === key ? A.a : M.tD, fontFamily: uff, letterSpacing: 0.4,
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    borderRight: `1px solid ${M.div}`,
  });

  const colW = { code: 90, desc: 200, l1Division: 130, l2Category: 120, gender: 70, season: 72, wsp: 72, mrp: 72, hsnCode: 62, status: 90 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ background: M.mid, borderBottom: `1px solid ${M.div}`, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, height: 44, flexShrink: 0, flexWrap: 'nowrap', overflowX: 'auto' }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, letterSpacing: 0.5, fontFamily: uff, flexShrink: 0 }}>📊 ARTICLES</span>
        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 12, background: M.hi, color: M.tC, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>{sorted.length}</span>
        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: M.tD }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ padding: '5px 8px 5px 26px', border: `1px solid ${M.div}`, borderRadius: 6, fontSize: fz - 2, fontFamily: uff, width: 130, outline: 'none', color: M.tA, background: M.inBg }} />
        </div>

        {/* Division filter */}
        <select value={filterDiv} onChange={e => setFilterDiv(e.target.value)}
          style={{ padding: '4px 7px', border: `1px solid ${filterDiv !== 'ALL' ? A.a : M.inBd}`, borderRadius: 6, background: M.inBg, color: filterDiv !== 'ALL' ? A.a : M.tB, fontSize: fz - 3, fontWeight: 700, cursor: 'pointer', fontFamily: uff, outline: 'none', flexShrink: 0 }}>
          <option value="ALL">All Divisions</option>
          {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '4px 7px', border: `1px solid ${filterStatus !== 'ALL' ? A.a : M.inBd}`, borderRadius: 6, background: M.inBg, color: filterStatus !== 'ALL' ? A.a : M.tB, fontSize: fz - 3, fontWeight: 700, cursor: 'pointer', fontFamily: uff, outline: 'none', flexShrink: 0 }}>
          <option value="ALL">All Status</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Add New */}
        <button onClick={() => showToast('Use "➕ Create Article" tab to add a new article', 'info')}
          style={{ padding: '5px 13px', background: CC_RED, border: 'none', borderRadius: 6, fontSize: fz - 2, fontWeight: 900, color: '#fff', cursor: 'pointer', fontFamily: uff, flexShrink: 0 }}>
          + Add New
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr style={{ background: M.thd }}>
              {AM_FIELDS.map(f => (
                <th key={f.key} style={{ ...thStyle(f.key), width: colW[f.key] || 120 }} onClick={() => handleHeaderClick(f.key)}>
                  {f.label}{sortCol === f.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
              <th style={{ ...thStyle('_act'), width: 70, cursor: 'default' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => (
              <tr key={row.code} style={{ background: ri % 2 === 0 ? M.tev : M.tod, borderBottom: `1px solid ${M.div}` }}
                onMouseEnter={e => { e.currentTarget.style.background = M.hov; }}
                onMouseLeave={e => { e.currentTarget.style.background = ri % 2 === 0 ? M.tev : M.tod; }}>
                {AM_FIELDS.map(f => (
                  <td key={f.key} style={{ padding: '7px 12px', fontSize: fz - 2, borderRight: `1px solid ${M.div}` }}>
                    {f.key === 'code'
                      ? <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: fz - 3, fontWeight: 700, color: divColor(row.l1Division) }}>{row[f.key]}</span>
                      : f.key === 'status'
                        ? <StatusBadge status={row.status} />
                        : f.key === 'l1Division'
                          ? <span style={{ fontSize: fz - 2, fontWeight: 700, color: divColor(row.l1Division) }}>{divIcon(row.l1Division)} {row.l1Division}</span>
                          : f.key === 'wsp' || f.key === 'mrp'
                            ? <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: fz - 2, color: M.tB }}>₹{row[f.key] || '—'}</span>
                            : <span style={{ color: M.tB }}>{row[f.key] || '—'}</span>
                    }
                  </td>
                ))}
                <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                  <button onClick={() => onEdit(row)}
                    style={{ padding: '3px 9px', border: `1px solid ${A.a}`, borderRadius: 5, background: A.al, color: A.a, fontSize: 9.5, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>
                    ✎ Edit
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={AM_FIELDS.length + 1} style={{ padding: 40, textAlign: 'center', color: M.tD, fontFamily: uff, fontSize: 12 }}>No articles found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// AM_ClassicTree — Horizontal scroll, sticky L1 headers
// L1 Division cards → L2 Category groups → individual articles
// ════════════════════════════════════════════════════════════════
function AM_ClassicTree({ hierarchy, data, M, A, uff, dff, fz, displayOpts, l1Label, l2Label, onArtClick }) {
  const [zoom,      setZoom]      = useState(100);
  const [collapsed, setCollapsed] = useState({});

  const toggle      = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));
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
          {hierarchy.length} {(l1Label || 'division').toLowerCase()}s · {data.length} articles
        </div>
      </div>

      {/* Horizontal scroll container — each column scrolls independently */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', display: 'flex', gap: 10, flexWrap: 'nowrap', alignItems: 'flex-start', minWidth: 'max-content', height: '100%' }}>
          {hierarchy.map(l1Node => {
            const l1Key  = l1Node.label;
            const l1Col  = collapsed[l1Key];
            const l2list = Object.entries(l1Node.l2s);
            const total  = l2list.reduce((a, [, v]) => a + v.length, 0);
            return (
              <div key={l1Key} style={{ minWidth: 320, maxWidth: 420, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* L1 header — pinned (flexShrink:0) */}
                <div onClick={() => toggle(l1Key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 10, background: `${l1Node.color}18`, border: `2px solid ${l1Node.color}60`, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
                  <span style={{ fontSize: 24 }}>{l1Node.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: fz + 2, fontWeight: 900, color: l1Node.color, fontFamily: uff }}>{l1Node.label}</div>
                    <div style={{ fontSize: 10, color: M.tD, fontFamily: uff }}>{l2list.length} categories · {total} articles</div>
                  </div>
                  <span style={{ fontSize: 13, color: l1Node.color, fontWeight: 900, fontFamily: uff }}>{l1Col ? '▶' : '▾'}</span>
                </div>

                {/* L2 + articles — independently scrollable */}
                {!l1Col && (
                  <div style={{ flex: 1, overflowY: 'auto', marginLeft: 20, borderLeft: `2px solid ${l1Node.color}40`, paddingLeft: 14, marginTop: 8 }}>
                    {l2list.map(([l2, articles], l2i) => {
                      const l2Key = `${l1Key}|${l2}`;
                      const l2Col = collapsed[l2Key];
                      return (
                        <div key={l2} style={{ marginTop: l2i === 0 ? 0 : 8 }}>
                          {/* L2 node */}
                          <div onClick={() => toggle(l2Key)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: M.mid, border: `1px solid ${M.div}`, cursor: 'pointer', userSelect: 'none', marginTop: 5 }}>
                            <span style={{ fontSize: 11, color: l1Node.color, fontWeight: 900 }}>{l2Col ? '▶' : '▾'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: fz, fontWeight: 800, color: M.tA, fontFamily: uff }}>{l2}</div>
                              <div style={{ fontSize: 10, color: M.tD, fontFamily: uff }}>{articles.length} article{articles.length !== 1 ? 's' : ''}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 900, color: l1Node.color, fontFamily: dff }}>{articles.length}</span>
                          </div>

                          {/* Articles (leaf items) */}
                          {!l2Col && (
                            displayOpts?.thumbnail && displayOpts?.thumbMode === 'cover' ? (
                              <div style={{ marginLeft: 16, paddingLeft: 12, marginTop: 6 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${displayOpts.thumbSize === 'sm' ? 110 : displayOpts.thumbSize === 'lg' ? 210 : 155}px, 1fr))`, gap: 8 }}>
                                  {articles.map(art => (
                                    <ArtCoverCard key={art.code} art={art} displayOpts={displayOpts} color={l1Node.color} M={M} A={A} uff={uff} dff={dff} fz={fz} onClick={() => onArtClick?.(art)} />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{ marginLeft: 16, borderLeft: `2px solid ${M.div}`, paddingLeft: 12, marginTop: 3 }}>
                                {articles.map((art, ai) => (
                                  <div key={art.code} onClick={() => onArtClick?.(art)}
                                    style={{ padding: displayOpts?.thumbnail && displayOpts?.thumbSize !== "sm" ? '8px 10px' : '7px 10px', borderRadius: 6, marginTop: ai === 0 ? 4 : 3, background: M.tev, border: `1px solid ${M.div}`, cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = l1Node.color}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = M.div}>
                                    <ArtListRow art={art} displayOpts={displayOpts || INIT_DISPLAY_OPTS} color={l1Node.color} M={M} A={A} uff={uff} dff={dff} fz={fz} />
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


// ════════════════════════════════════════════════════════════════
// AM_FlowDiagram — Hierarchy View: top-down tree with CSS lines
// Select division pill → L1 root → L2 branches → article chips
// ════════════════════════════════════════════════════════════════
function AM_FlowDiagram({ hierarchy, M, A, uff, dff, fz, displayOpts, onArtClick }) {
  const [activeMaster, setActiveMaster] = useState(hierarchy[0]?.label || null);
  const [zoom, setZoom] = useState(100);

  const isCover  = displayOpts?.thumbnail && displayOpts?.thumbMode === 'cover';
  const isIcon   = displayOpts?.thumbnail && displayOpts?.thumbMode !== 'cover';
  const thumbSz  = displayOpts?.thumbSize || 'sm';
  const NW = isCover ? (thumbSz === 'lg' ? 210 : thumbSz === 'sm' ? 130 : 170) : isIcon ? 160 : 140;
  const NH = 52, HG = 12, VG = 48;
  const l1Node = hierarchy.find(h => h.label === activeMaster) || null;

  const zBtnS = { width: 26, height: 26, border: `1px solid ${M.inBd}`, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: uff };

  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%' }}>
      {/* Division selector + zoom */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {hierarchy.map(l1 => (
          <div key={l1.label} onClick={() => setActiveMaster(l1.label)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 20, border: `2px solid ${activeMaster === l1.label ? l1.color : l1.color + '35'}`, background: activeMaster === l1.label ? `${l1.color}20` : `${l1.color}08`, cursor: 'pointer', transition: 'all .12s' }}>
            <span style={{ fontSize: 14 }}>{l1.icon}</span>
            <span style={{ fontSize: 10, fontWeight: activeMaster === l1.label ? 900 : 600, color: l1.color, fontFamily: uff }}>{l1.label}</span>
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
                    {l2entries.length} categories · {l2entries.reduce((a, [, v]) => a + v.length, 0)} articles
                  </div>
                </div>
              </div>

              {/* Vertical stem */}
              <div style={{ width: 2, height: 32, background: lineC }} />

              {/* L2 row */}
              <div style={{ position: 'relative', display: 'flex', gap: 0, width: totalW, alignItems: 'flex-start' }}>
                {n > 1 && <div style={{ position: 'absolute', top: 0, left: NW / 2, width: (n - 1) * (NW + HG), height: 2, background: lineC }} />}

                {l2entries.map(([l2, articles], i) => (
                  <div key={l2} style={{ width: NW, marginLeft: i > 0 ? HG : 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 2, height: 32, background: lineC }} />

                    {/* L2 category node */}
                    <div style={{ width: NW, padding: '8px 10px', borderRadius: 9, background: M.mid, border: `1.5px solid ${l1Node.color}60`, textAlign: 'center', boxShadow: `0 2px 8px ${l1Node.color}15` }}>
                      <div style={{ fontSize: fz - 1, fontWeight: 900, color: l1Node.color, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l2}</div>
                      <div style={{ fontSize: 8, color: M.tD, fontFamily: uff, marginTop: 1 }}>{articles.length} article{articles.length !== 1 ? 's' : ''}</div>
                    </div>

                    <div style={{ width: 2, height: 20, background: lineC }} />

                    {/* Article chips */}
                    <div style={{ width: NW + 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {articles.map(art => {
                        const chipColor = art.status === 'Active' ? l1Node.color : art.status === 'Development' ? '#92400e' : '#9ca3af';
                        const chipBg    = art.status === 'Active' ? `${l1Node.color}14` : art.status === 'Development' ? '#fef3c710' : '#f9fafb';
                        const chipBd    = art.status === 'Active' ? l1Node.color + '40' : art.status === 'Development' ? '#f59e0b50' : '#e5e7eb';
                        return isCover ? (
                          <div key={art.code} onClick={() => onArtClick?.(art)} style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${l1Node.color}40`, boxShadow: '0 1px 4px rgba(0,0,0,.06)', cursor: 'pointer' }}>
                            <ArtThumbnail art={art} size={thumbSz} color={l1Node.color} cover />
                            <div style={{ padding: '4px 8px 6px', background: chipBg }}>
                              <div style={{ fontSize: 8.5, fontWeight: 800, color: chipColor, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.desc}</div>
                              <div style={{ fontSize: 7.5, color: M.tD, fontFamily: dff, marginTop: 1 }}>{art.code}</div>
                            </div>
                          </div>
                        ) : (
                          <div key={art.code} onClick={() => onArtClick?.(art)} title={`${art.code}  ·  ${art.gender || ''}  ·  ₹${art.mrp || ''}`}
                            style={{ padding: '5px 9px', borderRadius: 7, background: chipBg, border: `1px solid ${chipBd}`, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            {isIcon && <ArtThumbnail art={art} size="sm" color={l1Node.color} />}
                            <div style={{ flex: 1, minWidth: 0, textAlign: isIcon ? 'left' : 'center' }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: chipColor, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.desc}</div>
                              <div style={{ fontSize: 7.5, color: M.tD, fontFamily: dff, marginTop: 1 }}>{art.code}</div>
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


// ════════════════════════════════════════════════════════════════
// AM_ColumnNav — Column View: Finder-style 3-column navigator
// Col 1: Divisions  Col 2: Categories  Col 3: Articles
// ════════════════════════════════════════════════════════════════
function AM_ColumnNav({ hierarchy, M, A, uff, dff, fz, l1Label = "Division", l2Label = "Category", displayOpts, onArtClick }) {
  const [selL1, setSelL1] = useState(hierarchy[0]?.label || null);
  const [selL2, setSelL2] = useState(null);

  const l1Node    = hierarchy.find(h => h.label === selL1) || null;
  const l2entries = l1Node ? Object.entries(l1Node.l2s) : [];
  const articles  = (selL2 && l1Node) ? (l1Node.l2s[selL2] || []) : [];

  useMemo(() => {
    if (l2entries.length > 0) setSelL2(l2entries[0][0]);
    else setSelL2(null);
  }, [selL1]); // eslint-disable-line

  // Re-initialize when hierarchy changes (group-by changed)
  useMemo(() => {
    setSelL1(hierarchy[0]?.label || null);
    setSelL2(null);
  }, [hierarchy]); // eslint-disable-line

  const colHd = { padding: '8px 14px', borderBottom: `1px solid ${M.div}`, fontSize: 8, fontWeight: 900, color: M.tD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.6, background: M.thd, position: 'sticky', top: 0, zIndex: 2 };

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
                <div style={{ fontSize: 8, color: M.tD, fontFamily: uff }}>{cnt} articles · {Object.keys(l1.l2s).length} {l2Label.toLowerCase()}s</div>
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
            {l2entries.map(([l2, arts]) => {
              const isA = selL2 === l2;
              return (
                <div key={l2} onClick={() => setSelL2(l2)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderLeft: `3px solid ${isA ? l1Node.color : 'transparent'}`, background: isA ? M.hi : 'transparent', cursor: 'pointer', borderBottom: `1px solid ${M.div}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: fz - 1, fontWeight: isA ? 800 : 600, color: isA ? l1Node.color : M.tA, fontFamily: uff }}>{l2}</div>
                    <div style={{ fontSize: 8, color: M.tD, fontFamily: uff }}>{arts.length} articles</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, padding: '1px 7px', borderRadius: 10, background: `${l1Node.color}20`, color: l1Node.color, fontFamily: dff }}>{arts.length}</span>
                  <span style={{ fontSize: 10, color: isA ? l1Node.color : M.tD }}>{isA ? '▶' : '›'}</span>
                </div>
              );
            })}
          </>
        ) : <div style={{ padding: 20, color: M.tD, fontFamily: uff, fontSize: 11 }}>← Select a {l1Label.toLowerCase()}</div>}
      </div>

      {/* Col 3: Articles */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {l1Node && selL2 ? (
          <>
            <div style={{ ...colHd, background: `${l1Node.color}10`, color: l1Node.color, borderBottom: `2px solid ${l1Node.color}30` }}>
              {selL1} › {selL2} — {articles.length} articles
            </div>
            {displayOpts?.thumbnail && displayOpts?.thumbMode === 'cover' ? (
              <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${displayOpts.thumbSize === 'sm' ? 110 : displayOpts.thumbSize === 'lg' ? 210 : 155}px, 1fr))`, gap: 10 }}>
                {articles.map(art => (
                  <ArtCoverCard key={art.code} art={art} displayOpts={displayOpts} color={l1Node.color} M={M} A={A} uff={uff} dff={dff} fz={fz} onClick={() => onArtClick?.(art)} />
                ))}
              </div>
            ) : (
              articles.map((art, i) => (
                <div key={art.code} onClick={() => onArtClick?.(art)}
                  style={{ padding: displayOpts?.thumbnail && displayOpts?.thumbSize !== "sm" ? '10px 18px' : '9px 18px', borderBottom: `1px solid ${M.div}`, background: i % 2 === 0 ? M.tev : M.tod, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = M.hov}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? M.tev : M.tod}>
                  <ArtListRow art={art} displayOpts={displayOpts || INIT_DISPLAY_OPTS} color={l1Node.color} M={M} A={A} uff={uff} dff={dff} fz={fz} />
                </div>
              ))
            )}
          </>
        ) : <div style={{ padding: 20, color: M.tD, fontFamily: uff, fontSize: 11 }}>← Select a {l2Label.toLowerCase()}</div>}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// AM_CardsView — Cards grid with filter / group / sort controls
// ════════════════════════════════════════════════════════════════

// ── Filterable / groupable / sortable field definitions ──
const CARD_FIELDS = [
  { key: 'l1Division', label: 'Division',    type: 'cat' },
  { key: 'l1Category', label: 'L1 Category', type: 'cat' },
  { key: 'l2Category', label: 'L2 Category', type: 'cat' },
  { key: 'gender',     label: 'Gender',      type: 'cat' },
  { key: 'season',     label: 'Season',      type: 'cat' },
  { key: 'fitType',    label: 'Fit Type',    type: 'cat' },
  { key: 'neckline',   label: 'Neckline',    type: 'cat' },
  { key: 'sleeveType', label: 'Sleeve',      type: 'cat' },
  { key: 'status',     label: 'Status',      type: 'cat' },
  { key: 'wsp',        label: 'WSP ₹',      type: 'num' },
  { key: 'mrp',        label: 'MRP ₹',      type: 'num' },
  { key: 'hsnCode',    label: 'HSN Code',    type: 'cat' },
  { key: 'code',       label: 'Art Code',    type: 'txt' },
  { key: 'desc',       label: 'Description', type: 'txt' },
];
const FILTER_OPS = {
  cat: ['is', 'is not'],
  txt: ['contains', 'not contains', 'starts with'],
  num: ['=', '≠', '>', '<', '≥', '≤'],
};
function evalFilter(art, { field, op, value }) {
  const fMeta  = CARD_FIELDS.find(f => f.key === field);
  const artVal = art[field];
  if (fMeta?.type === 'num') {
    const n = parseFloat(artVal), v = parseFloat(value);
    if (isNaN(n) || isNaN(v)) return true;
    return op==='=' ? n===v : op==='≠' ? n!==v : op==='>' ? n>v : op==='<' ? n<v : op==='≥' ? n>=v : n<=v;
  }
  if (fMeta?.type === 'txt') {
    const s = String(artVal||'').toLowerCase(), v = String(value||'').toLowerCase();
    return op==='contains' ? s.includes(v) : op==='not contains' ? !s.includes(v) : s.startsWith(v);
  }
  // cat
  return op === 'is' ? artVal === value : artVal !== value;
}

// ── Sort mode definitions ──
const SORT_MODES = [
  { value: 'a_z',       label: 'A → Z'              },
  { value: 'z_a',       label: 'Z → A'              },
  { value: 'nil_first', label: 'Nil / Empty First'   },
  { value: 'nil_last',  label: 'Nil / Empty Last'    },
  { value: 'freq_hi',   label: 'Most Frequent First' },
  { value: 'freq_lo',   label: 'Least Frequent First'},
  { value: 'num_lo',    label: 'Lowest → Highest'    },
  { value: 'num_hi',    label: 'Highest → Lowest'    },
  { value: 'val_first', label: 'Value is… First'     },
  { value: 'val_last',  label: 'Value is… Last'      },
];
function applyMultiSort(arr, sorts, freqMaps) {
  if (!sorts.length) return arr;
  return [...arr].sort((a, b) => {
    for (const s of sorts) {
      const av     = a[s.field] ?? '';
      const bv     = b[s.field] ?? '';
      const aEmpty = av === '' || av == null;
      const bEmpty = bv === '' || bv == null;
      let cmp = 0;
      switch (s.mode) {
        case 'nil_first':
          if (aEmpty !== bEmpty) { cmp = aEmpty ? -1 : 1; break; }
          cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }); break;
        case 'nil_last':
          if (aEmpty !== bEmpty) { cmp = aEmpty ? 1 : -1; break; }
          cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }); break;
        case 'freq_hi': {
          const fa = freqMaps[s.field]?.[String(av)] || 0;
          const fb = freqMaps[s.field]?.[String(bv)] || 0;
          cmp = fb - fa; break;
        }
        case 'freq_lo': {
          const fa = freqMaps[s.field]?.[String(av)] || 0;
          const fb = freqMaps[s.field]?.[String(bv)] || 0;
          cmp = fa - fb; break;
        }
        case 'num_lo':  cmp = parseFloat(av || 0) - parseFloat(bv || 0); break;
        case 'num_hi':  cmp = parseFloat(bv || 0) - parseFloat(av || 0); break;
        case 'val_first': {
          const am = String(av) === String(s.value || '');
          const bm = String(bv) === String(s.value || '');
          if (am !== bm) { cmp = am ? -1 : 1; break; }
          cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }); break;
        }
        case 'val_last': {
          const am = String(av) === String(s.value || '');
          const bm = String(bv) === String(s.value || '');
          if (am !== bm) { cmp = am ? 1 : -1; break; }
          cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }); break;
        }
        case 'z_a':
          cmp = String(bv).localeCompare(String(av), undefined, { sensitivity: 'base' }); break;
        default: // a_z
          cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }); break;
      }
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

function AM_CardsView({ data, hierarchy, M, A, uff, dff, fz, displayOpts: dOpts, onArtClick,
  groupBy = '', setGroupBy, subGroupBy = '', setSubGroupBy }) {
  // ── groupBy / subGroupBy are CONTROLLED by parent (ArticleMasterLayoutPanel) ──
  // Provide local fallbacks so the component still works when used standalone
  const [_localGroupBy,    _setLocalGroupBy]    = useState('');
  const [_localSubGroupBy, _setLocalSubGroupBy] = useState('');
  const activeGroupBy      = setGroupBy    ? groupBy    : _localGroupBy;
  const activeSubGroupBy   = setSubGroupBy ? subGroupBy : _localSubGroupBy;
  const onSetGroupBy    = setGroupBy    || _setLocalGroupBy;
  const onSetSubGroupBy = setSubGroupBy || _setLocalSubGroupBy;

  const [collapsed,  setCollapsed]  = useState({});
  const toggleCollapse = (k) => setCollapsed(p => ({ ...p, [k]: !p[k] }));

  // ── Grouped structure ──
  const grouped = useMemo(() => {
    if (!activeGroupBy) return [{ key: '__all__', label: null, subGroups: null, items: data }];
    const gmap = {};
    data.forEach(art => {
      const gk = String(art[activeGroupBy] || '(blank)');
      if (!gmap[gk]) gmap[gk] = activeSubGroupBy ? {} : [];
      if (activeSubGroupBy) {
        const sk = String(art[activeSubGroupBy] || '(blank)');
        if (!gmap[gk][sk]) gmap[gk][sk] = [];
        gmap[gk][sk].push(art);
      } else {
        gmap[gk].push(art);
      }
    });
    return Object.keys(gmap).sort().map(gk => ({
      key: gk, label: gk,
      items:     activeSubGroupBy ? null : gmap[gk],
      subGroups: activeSubGroupBy ? Object.keys(gmap[gk]).sort().map(sk => ({ key: sk, label: sk, items: gmap[gk][sk] })) : null,
    }));
  }, [data, activeGroupBy, activeSubGroupBy]);

  // ── Display options ──
  const sf        = dOpts?.showFields || {};
  const thumb     = dOpts?.thumbnail  || false;
  const thumbSize = dOpts?.thumbSize  || 'md';
  const thumbMode = dOpts?.thumbMode  || 'icon';
  const det       = dOpts?.density === 'detail';
  const isCover   = thumb && thumbMode === 'cover';
  const isIcon    = thumb && thumbMode === 'icon';
  const minCardW  = isCover && thumbSize === 'lg' ? 280 : det ? 250 : 220;

  // ── Style helpers ──
  const ctrlSel = {
    fontSize: 10, border: `1px solid ${M.div}`, borderRadius: 5,
    padding: '3px 7px', background: M.inBg, color: M.tA,
    fontFamily: uff, cursor: 'pointer', outline: 'none',
  };
  const ctrlBtn = (on) => ({
    padding: '3px 10px', border: `1px solid ${on ? A.a : M.div}`,
    borderRadius: 5, background: on ? A.al : 'transparent',
    color: on ? A.a : M.tB, fontSize: 10, fontWeight: on ? 800 : 600,
    cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap',
  });

  // ── Card renderer ──
  const renderCard = (art) => {
    const color = divColor(art.l1Division);
    return (
      <div key={art.code} onClick={() => onArtClick?.(art)}
        style={{ background: M.hi, border: `1.5px solid ${M.div}`, borderRadius: 10, overflow: 'hidden', transition: 'all .15s', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderTop: isCover ? 'none' : `3px solid ${color}`, cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${color}28`; e.currentTarget.style.borderColor = color; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'; e.currentTarget.style.borderColor = M.div; }}>
        {isCover && <ArtThumbnail art={art} size={thumbSize} color={color} cover />}
        <div style={{ padding: '11px 13px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              {isIcon && <ArtThumbnail art={art} size={thumbSize} color={color} />}
              <span style={{ fontSize: 9.5, fontWeight: 900, color, fontFamily: dff, flexShrink: 0 }}>{art.code}</span>
              {sf.shortName && art.shortName && <span style={{ fontSize: 7.5, color: M.tD, fontFamily: uff }}>{art.shortName}</span>}
            </div>
            <StatusBadge status={art.status} />
          </div>
          <div style={{ fontSize: fz, fontWeight: 900, color: M.tA, fontFamily: uff, marginBottom: 4, lineHeight: 1.3 }}>{art.desc}</div>
          <div style={{ fontSize: 8.5, fontWeight: 700, color, fontFamily: uff, marginBottom: 6 }}>
            {divIcon(art.l1Division)} {art.l1Division} › {art.l2Category}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
            {art.gender    && (sf.gender    ?? true) && <span style={{ fontSize: 7.5, padding: '1px 6px', borderRadius: 8, background: `${color}12`, color, fontFamily: uff, fontWeight: 700 }}>{art.gender}</span>}
            {art.season    && (sf.season    ?? true) && <span style={{ fontSize: 7.5, padding: '1px 6px', borderRadius: 8, background: M.mid, color: M.tC, fontFamily: uff, fontWeight: 700 }}>{art.season}</span>}
            {det && sf.fitType    && art.fitType    && <span style={{ fontSize: 7.5, padding: '1px 6px', borderRadius: 8, background: `${color}10`, color, fontFamily: uff }}>{art.fitType}</span>}
            {det && sf.neckline   && art.neckline   && <span style={{ fontSize: 7.5, padding: '1px 6px', borderRadius: 8, background: `${color}10`, color, fontFamily: uff }}>{art.neckline}</span>}
            {det && sf.sleeveType && art.sleeveType && <span style={{ fontSize: 7.5, padding: '1px 6px', borderRadius: 8, background: `${color}10`, color, fontFamily: uff }}>{art.sleeveType}</span>}
          </div>
          {((sf.wsp ?? true) || (sf.mrp ?? true)) && (art.wsp || art.mrp) && (
            <div style={{ paddingTop: 6, borderTop: `1px solid ${M.div}`, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(sf.wsp ?? true) && art.wsp && <span style={{ fontSize: 8.5, color: M.tD, fontFamily: uff }}><b style={{ color: M.tB }}>WSP</b> ₹{art.wsp}</span>}
              {(sf.mrp ?? true) && art.mrp && <span style={{ fontSize: 8.5, color: M.tD, fontFamily: uff }}><b style={{ color: M.tB }}>MRP</b> ₹{art.mrp}</span>}
              {det && sf.hsnCode && art.hsnCode && <span style={{ fontSize: 8.5, color: M.tD, fontFamily: uff }}><b style={{ color: M.tB }}>HSN</b> {art.hsnCode}</span>}
            </div>
          )}
          {det && sf.tags && art.tags && <div style={{ marginTop: 5, fontSize: 8, color: M.tD, fontFamily: uff }}># {art.tags}</div>}
        </div>
      </div>
    );
  };

  // ── Group section header ──
  const renderGrpHeader = (label, count, level, colKey) => {
    const field = level === 1 ? activeGroupBy : activeSubGroupBy;
    const meta  = getGroupMeta(field, label);
    const isCol = !!collapsed[colKey];
    return (
      <div onClick={() => toggleCollapse(colKey)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', padding: level === 1 ? '10px 0 7px' : '6px 0 5px', borderBottom: `2px solid ${meta.color}35`, marginBottom: 10 }}>
        <span style={{ fontSize: level === 1 ? 18 : 13 }}>{meta.icon}</span>
        <span style={{ fontSize: level === 1 ? fz + 1 : fz - 1, fontWeight: 900, color: meta.color, fontFamily: uff }}>{label}</span>
        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 8px', borderRadius: 10, background: `${meta.color}18`, color: meta.color, fontFamily: dff }}>{count}</span>
        <div style={{ flex: 1, height: 1, background: `${meta.color}22`, marginLeft: 4 }} />
        {level === 1 && <span style={{ fontSize: 8, color: M.tD, fontFamily: uff }}>{isCol ? 'expand' : 'collapse'}</span>}
        <span style={{ fontSize: 10, color: meta.color, fontWeight: 900 }}>{isCol ? '▶' : '▾'}</span>
      </div>
    );
  };

  const cardGrid = (items) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${minCardW}px, 1fr))`, gap: 12 }}>
      {items.map(renderCard)}
    </div>
  );

  return (
    <div style={{ padding: '14px 20px 20px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>

      {/* ══ Cards Group Panel (filter/sort/search live in the shared bar above) ══ */}
      <div style={{ background: M.mid, border: `1px solid ${M.div}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Group By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: M.tD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.5 }}>Group</span>
            <select value={activeGroupBy} onChange={e => { onSetGroupBy(e.target.value); onSetSubGroupBy(''); setCollapsed({}); }} style={ctrlSel}>
              <option value="">None</option>
              {CARD_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          {/* Sub Group */}
          {activeGroupBy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: M.tD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.5 }}>↳ Sub</span>
              <select value={activeSubGroupBy} onChange={e => { onSetSubGroupBy(e.target.value); setCollapsed({}); }} style={ctrlSel}>
                <option value="">None</option>
                {CARD_FIELDS.filter(f => f.key !== activeGroupBy).map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
          )}
          {activeGroupBy && (
            <>
              <div style={{ width: 1, height: 18, background: M.div, flexShrink: 0 }} />
              <button onClick={() => { onSetGroupBy(''); onSetSubGroupBy(''); setCollapsed({}); }}
                style={{ ...ctrlBtn(false), color: '#dc2626', borderColor: '#dc262640', fontSize: 9 }}>✕ Clear Group</button>
            </>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 9, color: M.tD, fontFamily: uff }}>{data.length} articles</div>
        </div>

        {/* Active grouping breadcrumb */}
        {activeGroupBy && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${M.div}`, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 8.5, color: M.tD, fontFamily: uff, fontWeight: 600 }}>Grouped by:</span>
            <span style={{ fontSize: 8.5, fontWeight: 800, padding: '1px 8px', borderRadius: 8, background: `${A.a}15`, color: A.a, fontFamily: uff }}>
              {CARD_FIELDS.find(f => f.key === activeGroupBy)?.label}
            </span>
            {activeSubGroupBy && (
              <>
                <span style={{ fontSize: 10, color: M.tD }}>↳</span>
                <span style={{ fontSize: 8.5, fontWeight: 800, padding: '1px 8px', borderRadius: 8, background: `${A.a}10`, color: A.a, fontFamily: uff }}>
                  {CARD_FIELDS.find(f => f.key === activeSubGroupBy)?.label}
                </span>
              </>
            )}
            <span style={{ fontSize: 8.5, color: M.tD, fontFamily: uff }}>· {grouped.length} groups</span>
          </div>
        )}
      </div>

      {/* ══ Cards area ══ */}
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', color: M.tD, fontFamily: uff, fontSize: 12, padding: 48 }}>
          No articles match the current filters
        </div>
      ) : (
        <div>
          {grouped.map(group => {
            const totalInGroup = group.subGroups
              ? group.subGroups.reduce((a, sg) => a + sg.items.length, 0)
              : group.items?.length || 0;
            const isRootCollapsed = !!collapsed[group.key];
            return (
              <div key={group.key} style={{ marginBottom: group.label ? 24 : 0 }}>
                {/* Primary group header */}
                {group.label && renderGrpHeader(group.label, totalInGroup, 1, group.key)}

                {/* Content */}
                {!isRootCollapsed && (
                  group.subGroups ? (
                    group.subGroups.map(sg => {
                      const sgKey  = `${group.key}||${sg.key}`;
                      const isSgCo = !!collapsed[sgKey];
                      return (
                        <div key={sg.key} style={{ marginBottom: 16, marginLeft: 18, borderLeft: `2px solid ${M.div}`, paddingLeft: 14 }}>
                          {renderGrpHeader(sg.label, sg.items.length, 2, sgKey)}
                          {!isSgCo && cardGrid(sg.items)}
                        </div>
                      );
                    })
                  ) : cardGrid(group.items)
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// AM_MatrixView — Pivot grid: L1 Division × L2 Category
// Cells = article count; click to drill down
// ════════════════════════════════════════════════════════════════
function AM_MatrixView({ data, hierarchy, M, A, uff, dff, fz = 13, l1Label = "Division", l2Label = "Category", onArtClick }) {
  const [drillCell, setDrillCell] = useState(null);

  // Use hierarchy for ordered l1 list with color/icon metadata
  const l1Nodes = useMemo(() => hierarchy, [hierarchy]);

  // Collect all l2 keys in order from hierarchy
  const l2List = useMemo(() => {
    const seen = new Set();
    hierarchy.forEach(n => Object.keys(n.l2s).forEach(k => seen.add(k)));
    return [...seen];
  }, [hierarchy]);

  // Build matrix from hierarchy (already pre-grouped)
  const matrix = useMemo(() => {
    const m = {};
    hierarchy.forEach(l1Node => {
      m[l1Node.label] = {};
      Object.entries(l1Node.l2s).forEach(([l2key, arts]) => {
        m[l1Node.label][l2key] = arts;
      });
    });
    return m;
  }, [hierarchy]);

  const maxCount = useMemo(() => {
    let max = 0;
    l1Nodes.forEach(n => l2List.forEach(l2 => { const c = matrix[n.label]?.[l2]?.length || 0; if (c > max) max = c; }));
    return max;
  }, [matrix, l1Nodes, l2List]);

  const statItems = [
    { l: l1Label.toUpperCase() + 'S', v: l1Nodes.length },
    { l: l2Label.toUpperCase() + 'S', v: l2List.length  },
    { l: 'ARTICLES',                   v: data.length    },
    { l: 'FILLED CELLS',               v: l1Nodes.reduce((a, n) => a + l2List.filter(l2 => matrix[n.label]?.[l2]?.length).length, 0) },
  ];

  return (
    <div style={{ padding: 20, overflowX: 'auto' }}>
      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        {statItems.map(s => (
          <div key={s.l} style={{ padding: '8px 16px', background: M.mid, borderRadius: 8, border: `1px solid ${M.div}`, textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: A.a, fontFamily: dff, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 8.5, fontWeight: 800, color: M.tD, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: uff, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 9, color: M.tD, fontFamily: uff, alignSelf: 'center', fontStyle: 'italic' }}>Click any cell to drill down</div>
      </div>

      {/* Matrix table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${M.div}` }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: l2List.length * 110 + 200 }}>
          <thead>
            <tr style={{ background: M.thd }}>
              <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 900, color: M.tD, fontFamily: uff, letterSpacing: 0.5, borderRight: `2px solid ${M.div}`, minWidth: 160, position: 'sticky', left: 0, background: M.thd, zIndex: 2 }}>
                {l1Label} ↓ / {l2Label} →
              </th>
              {l2List.map(l2 => (
                <th key={l2} style={{ padding: '7px 8px', textAlign: 'center', fontSize: 8, fontWeight: 800, color: M.tC, fontFamily: uff, borderRight: `1px solid ${M.div}`, whiteSpace: 'nowrap', maxWidth: 110 }}>
                  {l2}
                </th>
              ))}
              <th style={{ padding: '7px 10px', textAlign: 'center', fontSize: 9, fontWeight: 900, color: M.tD, fontFamily: uff, borderLeft: `2px solid ${M.div}` }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {l1Nodes.map((l1Node, ri) => {
              const mc       = l1Node.color;
              const rowTotal = l2List.reduce((a, l2) => a + (matrix[l1Node.label]?.[l2]?.length || 0), 0);
              return (
                <tr key={l1Node.label} style={{ background: ri % 2 === 0 ? M.tev : M.tod, borderBottom: `1px solid ${M.div}` }}>
                  <td style={{ padding: '7px 14px', fontSize: fz - 2, fontWeight: 800, color: mc, fontFamily: uff, borderRight: `2px solid ${M.div}`, position: 'sticky', left: 0, background: ri % 2 === 0 ? M.tev : M.tod, zIndex: 1, whiteSpace: 'nowrap' }}>
                    {l1Node.icon} {l1Node.label}
                  </td>
                  {l2List.map(l2 => {
                    const items = matrix[l1Node.label]?.[l2] || [];
                    const cnt   = items.length;
                    const alpha = cnt > 0 ? Math.round((cnt / (maxCount || 1)) * 30 + 12) : 0;
                    return (
                      <td key={l2} onClick={() => cnt && setDrillCell({ l1Node, l2, items })}
                        style={{ padding: '6px 8px', textAlign: 'center', borderRight: `1px solid ${M.div}`, cursor: cnt ? 'pointer' : 'default', background: cnt ? `${mc}${alpha.toString(16).padStart(2, '0')}` : 'transparent', transition: 'filter .12s' }}>
                        {cnt > 0 ? (
                          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: fz, fontWeight: 900, color: mc }}>{cnt}</span>
                            <span style={{ fontSize: 7, color: M.tD, fontFamily: uff }}>art{cnt !== 1 ? 's' : ''}</span>
                          </span>
                        ) : <span style={{ color: M.tD, fontSize: fz - 3 }}>—</span>}
                      </td>
                    );
                  })}
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: fz, fontWeight: 900, color: mc, fontFamily: dff, borderLeft: `2px solid ${M.div}` }}>{rowTotal}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: M.thd, borderTop: `2px solid ${M.div}` }}>
              <td style={{ padding: '8px 14px', fontSize: 9, fontWeight: 900, color: M.tD, fontFamily: uff, letterSpacing: 0.5, borderRight: `2px solid ${M.div}`, position: 'sticky', left: 0, background: M.thd, zIndex: 1 }}>TOTAL</td>
              {l2List.map(l2 => {
                const cnt = l1Nodes.reduce((a, n) => a + (matrix[n.label]?.[l2]?.length || 0), 0);
                return (
                  <td key={l2} style={{ padding: '8px 8px', textAlign: 'center', fontSize: fz - 1, fontWeight: 900, color: cnt ? A.a : M.tD, fontFamily: dff, borderRight: `1px solid ${M.div}` }}>
                    {cnt || '—'}
                  </td>
                );
              })}
              <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: fz, fontWeight: 900, color: A.a, fontFamily: dff, borderLeft: `2px solid ${M.div}` }}>{data.length}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Drill-down modal */}
      {drillCell && (
        <>
          <div onClick={() => setDrillCell(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(2px)', zIndex: 1100 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 520, maxHeight: '80vh', background: M.hi, borderRadius: 12, border: `1px solid ${M.div}`, zIndex: 1101, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: drillCell.l1Node.color, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: uff }}>{drillCell.l1Node.label} › {drillCell.l2}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.8)', fontFamily: uff }}>{drillCell.items.length} articles</div>
              </div>
              <button onClick={() => setDrillCell(null)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {drillCell.items.map(art => (
                  <div key={art.code} onClick={() => onArtClick?.(art)}
                    style={{ padding: '8px 12px', borderRadius: 8, background: M.mid, border: `1px solid ${M.div}`, minWidth: 160, maxWidth: 200, cursor: onArtClick ? 'pointer' : 'default' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = drillCell.l1Node.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = M.div}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: drillCell.l1Node.color, fontFamily: dff, marginBottom: 2 }}>{art.code}</div>
                    <div style={{ fontSize: fz - 1, fontWeight: 700, color: M.tA, fontFamily: uff, marginBottom: 4 }}>{art.desc}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {art.gender && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 6, background: `${drillCell.l1Node.color}20`, color: drillCell.l1Node.color, fontFamily: uff }}>{art.gender}</span>}
                      {art.season && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 6, background: M.hi, color: M.tC, fontFamily: uff }}>{art.season}</span>}
                      <StatusBadge status={art.status} />
                    </div>
                    {(art.wsp || art.mrp) && (
                      <div style={{ fontSize: 8.5, color: M.tD, fontFamily: uff, marginTop: 4 }}>
                        {art.wsp ? `WSP ₹${art.wsp}` : ''}{art.wsp && art.mrp ? ' · ' : ''}{art.mrp ? `MRP ₹${art.mrp}` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// AM_AuditLogView — Timeline of article add/edit/delete events
// ════════════════════════════════════════════════════════════════
function AM_AuditLogView({ auditLog, M, A, uff, dff, fz = 13 }) {
  const [filterType, setFilterType] = useState('ALL');

  const TYPE_META = {
    ADD:    { icon: '●', color: '#15803d', bg: '#d1fae5' },
    EDIT:   { icon: '✎', color: '#0078D4', bg: '#dbeafe' },
    DELETE: { icon: '✕', color: '#dc2626', bg: '#fee2e2' },
    IMPORT: { icon: '⬆', color: '#7C3AED', bg: '#ede9fe' },
    TOGGLE: { icon: '⇄', color: '#E8690A', bg: '#fef3c7' },
  };

  const filtered = useMemo(() => {
    if (filterType === 'ALL') return auditLog;
    return auditLog.filter(e => e.type === filterType);
  }, [auditLog, filterType]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: M.tA, fontFamily: uff, letterSpacing: 0.3 }}>CHANGE HISTORY — Article Master</div>
        <div style={{ flex: 1 }} />
        {['ALL', 'ADD', 'EDIT', 'DELETE', 'IMPORT'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            style={{ padding: '3px 10px', border: `1px solid ${filterType === t ? A.a : M.inBd}`, borderRadius: 14, background: filterType === t ? A.al : M.inBg, color: filterType === t ? A.a : M.tB, fontSize: 8.5, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>
            {t}
          </button>
        ))}
        <div style={{ fontSize: 9.5, color: M.tD, fontFamily: uff }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: M.tD, fontFamily: uff, fontSize: 12, padding: 40 }}>No events yet</div>
        ) : filtered.map((e, i) => {
          const tm = TYPE_META[e.type] || TYPE_META.ADD;
          const diffKeys = e.detail ? Object.keys(e.detail.before || {}).filter(k => String(e.detail.before[k]) !== String(e.detail.after[k])) : [];
          return (
            <div key={e.id} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < filtered.length - 1 ? `1px solid ${M.div}` : 'none' }}>
              <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: tm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: tm.color, marginTop: 1 }}>
                {tm.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 8.5, fontWeight: 900, padding: '2px 8px', borderRadius: 10, background: tm.bg, color: tm.color, fontFamily: uff }}>{e.type}</span>
                  <span style={{ fontSize: fz - 2, fontWeight: 700, color: M.tA, fontFamily: uff }}>{e.msg}</span>
                </div>
                <div style={{ fontSize: 9, color: M.tD, fontFamily: uff }}>{e.user} · {e.ts}</div>
                {diffKeys.length > 0 && (
                  <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, background: M.mid, border: `1px solid ${M.div}`, fontSize: 9, fontFamily: dff, color: M.tC, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {diffKeys.map(k => (
                      <div key={k}>
                        <span style={{ color: M.tD, fontWeight: 700 }}>{k}:</span>
                        {' '}<span style={{ color: '#dc2626' }}>{String(e.detail.before[k] || '—')}</span>
                        {' → '}
                        <span style={{ color: '#15803d' }}>{String(e.detail.after[k] || '—')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// EXPORT HELPER
// ════════════════════════════════════════════════════════════════
function exportAsCsv(data, filename = 'article_master.csv') {
  const cols = ['code','desc','shortName','l1Division','l2Category','l1Category','gender','season',
                'fitType','neckline','sleeveType','wsp','mrp','hsnCode','status','buyerStyle','tags'];
  const header = cols.join(',');
  const rows = data.map(r => cols.map(c => {
    const v = String(r[c] ?? '');
    return (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(','));
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Article Master field schema (drives Card / Table / JSON layouts) ──
const AM_SCHEMA = [
  { key: 'code',       label: 'Article Code',  mono: true,  required: true  },
  { key: 'desc',       label: 'Description',                required: true  },
  { key: 'shortName',  label: 'Short Name'                                  },
  { key: 'buyerStyle', label: 'Buyer Style'                                 },
  { key: 'l1Division', label: 'Division'                                    },
  { key: 'l2Category', label: 'Category'                                    },
  { key: 'l1Category', label: 'L1 Category'                                 },
  { key: 'season',     label: 'Season'                                      },
  { key: 'gender',     label: 'Gender'                                      },
  { key: 'fitType',    label: 'Fit'                                         },
  { key: 'neckline',   label: 'Neckline'                                    },
  { key: 'sleeveType', label: 'Sleeve'                                      },
  { key: 'wsp',        label: 'WSP ₹',         mono: true                  },
  { key: 'mrp',        label: 'MRP ₹',         mono: true                  },
  { key: 'hsnCode',    label: 'HSN Code',       mono: true                  },
  { key: 'status',     label: 'Status',         badge: true                 },
  { key: 'tags',       label: 'Tags'                                        },
];

// ════════════════════════════════════════════════════════════════
// ArtDetailModal — Record Detail popup matching CC ERP standard
//   Header: accent bg · "📋 Record Detail" · ▦Card/≡Table/{}JSON
//   Body:   3 switchable layouts
//   Footer: Prev/Next · Print/Export · Close · Edit Record
// ════════════════════════════════════════════════════════════════
function ArtDetailModal({ art, onClose, onPrev, onNext, artIndex, totalArts, onEdit, canEdit = true, M, A, uff, dff, fz }) {
  const [layout, setLayout] = useState('card'); // 'card' | 'table' | 'json'

  // Keyboard: Esc=close, ←/↑=prev, →/↓=next
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && onPrev) onPrev();
      else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && onNext) onNext();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, onPrev, onNext]);

  // Print single record in a new window
  const printRecord = () => {
    const color = divColor(art.l1Division);
    const rows  = AM_SCHEMA.filter(f => art[f.key] !== undefined && art[f.key] !== null && art[f.key] !== '');
    const w = window.open('', '_blank', 'width=640,height=780');
    w.document.write(`<html><head><title>${art.code} — ${art.desc}</title>
    <style>body{font-family:sans-serif;padding:28px;color:#111}h2{color:${color};margin:0 0 4px}p{margin:0 0 14px;color:#555;font-size:13px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.cell{padding:8px 12px;border-radius:7px;border:1px solid #e2e8f0}.lbl{font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.6px;color:#888;margin-bottom:3px}.val{font-size:12px;font-weight:700}</style>
    </head><body>
    <h2>${art.code} — ${art.desc}</h2>
    <p>${art.l1Division} › ${art.l2Category}${art.gender ? ' · ' + art.gender : ''}${art.season ? ' · ' + art.season : ''} · ${art.status}</p>
    <div class="grid">${rows.map(f => `<div class="cell"><div class="lbl">${f.label}</div><div class="val">${art[f.key]}</div></div>`).join('')}</div>
    </body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  const LAYOUTS = [
    { id: 'card',  label: '▦ Card'   },
    { id: 'table', label: '≡ Table'  },
    { id: 'json',  label: '{ } JSON' },
  ];

  const navBtnS = (enabled) => ({
    padding: '7px 12px', border: `1px solid ${M.div}`, borderRadius: 6,
    background: 'transparent', color: enabled ? M.tA : M.tD, fontSize: 10.5,
    fontWeight: 700, cursor: enabled ? 'pointer' : 'default', fontFamily: uff,
  });
  const footBtnS = (accent) => ({
    padding: '7px 16px', border: `1px solid ${accent ? A.a : M.div}`,
    borderRadius: 6, background: accent ? A.a : M.inBg,
    color: accent ? '#fff' : M.tB, fontSize: 11, fontWeight: accent ? 900 : 700,
    cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap',
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)', zIndex: 2000 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 660, maxWidth: '95vw', maxHeight: '90vh',
        background: M.hi, border: `1px solid ${M.div}`,
        borderRadius: 12, zIndex: 2001, boxShadow: '0 24px 64px rgba(0,0,0,.45)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header (accent color — matches RecordDetailModal standard) ── */}
        <div style={{ background: A.a, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: uff }}>Record Detail</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', fontFamily: dff }}>{art.code}</div>
          </div>
          <div style={{ flex: 1 }} />
          {/* Layout toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,.15)', borderRadius: 6, overflow: 'hidden', gap: 1 }}>
            {LAYOUTS.map(l => (
              <button key={l.id} onClick={() => setLayout(l.id)}
                style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: 9.5, fontWeight: layout === l.id ? 900 : 600, background: layout === l.id ? 'rgba(255,255,255,.3)' : 'transparent', color: '#fff', fontFamily: uff, transition: 'all .12s' }}>
                {l.label}
              </button>
            ))}
          </div>
          {/* Edit button — only for users with edit rights */}
          {canEdit && onEdit ? (
            <button onClick={() => { onEdit(art); onClose(); }}
              style={{ padding: '4px 14px', border: '1px solid rgba(255,255,255,.4)', borderRadius: 5, background: 'rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 800, fontFamily: uff }}>
              ← Edit
            </button>
          ) : !canEdit ? (
            <div style={{ padding: '4px 10px', border: '1px solid rgba(255,255,255,.25)', borderRadius: 5, background: 'rgba(0,0,0,.2)', color: 'rgba(255,255,255,.45)', fontSize: 9.5, fontWeight: 700, fontFamily: uff, display: 'flex', alignItems: 'center', gap: 4 }}>
              🔒 Read Only
            </div>
          ) : null}
          {/* Close */}
          <button onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {layout === 'card'  && <ArtCardLayout  art={art} M={M} A={A} uff={uff} dff={dff} fz={fz} />}
          {layout === 'table' && <ArtTableLayout art={art} M={M} A={A} uff={uff} dff={dff} fz={fz} />}
          {layout === 'json'  && <ArtJsonLayout  art={art} M={M} uff={uff} dff={dff} />}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${M.div}`, display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, background: M.thd, flexWrap: 'wrap' }}>
          {/* Prev / position / Next */}
          <button onClick={onPrev} disabled={!onPrev} style={navBtnS(!!onPrev)}>‹ Prev</button>
          {totalArts > 0 && (
            <span style={{ fontSize: 9, color: M.tD, fontFamily: dff, minWidth: 38, textAlign: 'center' }}>
              {(artIndex ?? 0) + 1} / {totalArts}
            </span>
          )}
          <button onClick={onNext} disabled={!onNext} style={navBtnS(!!onNext)}>Next ›</button>
          <div style={{ width: 1, height: 18, background: M.div }} />
          {/* Print & Export */}
          <button onClick={printRecord} style={navBtnS(true)}>🖨 Print</button>
          <button onClick={() => exportAsCsv([art], `${art.code}.csv`)} style={navBtnS(true)}>⬇ Export</button>
          <div style={{ flex: 1 }} />
          {/* Close & Edit (conditional on canEdit) */}
          <button onClick={onClose} style={footBtnS(false)}>Close</button>
          {canEdit && onEdit ? (
            <button onClick={() => { onEdit(art); onClose(); }} style={footBtnS(true)}>✏ Edit Record</button>
          ) : !canEdit ? (
            <div style={{ padding: '7px 14px', border: `1px solid ${M.div}`, borderRadius: 6, background: M.lo || M.mid, color: M.tD, fontSize: 10.5, fontWeight: 700, fontFamily: uff, display: 'flex', alignItems: 'center', gap: 5 }}>
              🔒 No Edit Rights — Contact Admin
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ── Card layout: 2-col grid showing ALL AM fields ──
function ArtCardLayout({ art, M, A, uff, dff, fz }) {
  return (
    <div style={{ padding: '18px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
        {AM_SCHEMA.map(f => {
          const val    = art[f.key];
          const hasVal = val !== undefined && val !== null && val !== '';
          return (
            <div key={f.key}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: M.tD, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: uff }}>
                {f.label}{f.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
              </div>
              <div style={{ fontSize: fz, fontWeight: f.key === 'code' ? 800 : 400, color: f.key === 'code' ? A.a : M.tA, fontFamily: f.mono ? dff : uff, padding: '6px 10px', background: M.mid, borderRadius: 5, minHeight: 28, display: 'flex', alignItems: 'center', border: `1px solid ${M.div}` }}>
                {hasVal ? (
                  f.badge ? <StatusBadge status={String(val)} /> : String(val)
                ) : (
                  <span style={{ color: M.tD, fontStyle: 'italic', fontSize: fz - 2 }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Table layout: FIELD | VALUE rows ──
function ArtTableLayout({ art, M, A, uff, dff, fz }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
        <tr style={{ background: M.thd }}>
          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 900, color: M.tD, borderBottom: `2px solid ${M.div}`, fontFamily: uff, letterSpacing: 0.5, width: 160 }}>FIELD</th>
          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 900, color: M.tD, borderBottom: `2px solid ${M.div}`, fontFamily: uff, letterSpacing: 0.5 }}>VALUE</th>
        </tr>
      </thead>
      <tbody>
        {AM_SCHEMA.map((f, i) => {
          const val    = art[f.key];
          const hasVal = val !== undefined && val !== null && val !== '';
          return (
            <tr key={f.key} style={{ background: i % 2 === 0 ? M.tev : M.tod, borderBottom: `1px solid ${M.div}` }}>
              <td style={{ padding: '7px 14px', fontSize: fz - 2, fontWeight: 700, color: f.key === 'code' ? A.a : M.tC, fontFamily: uff, whiteSpace: 'nowrap', borderRight: `1px solid ${M.div}` }}>
                {f.label}{f.required && <span style={{ color: '#ef4444', marginLeft: 3, fontSize: 9 }}>*</span>}
              </td>
              <td style={{ padding: '7px 14px', fontSize: fz - 1, color: M.tA, fontFamily: f.mono ? dff : uff }}>
                {hasVal ? (
                  f.badge ? <StatusBadge status={String(val)} /> : String(val)
                ) : (
                  <span style={{ color: M.tD, fontStyle: 'italic', fontSize: fz - 2 }}>—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── JSON layout: raw JSON with copy button ──
function ArtJsonLayout({ art, M, uff }) {
  const json = JSON.stringify(art, null, 2);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={handleCopy}
          style={{ padding: '4px 12px', border: `1px solid ${M.div}`, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>
          {copied ? '✓ Copied!' : '⧉ Copy JSON'}
        </button>
      </div>
      <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, lineHeight: 1.6, overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {json}
      </pre>
    </div>
  );
}

// ── View icon / color palettes for saved views ──
const VICONS  = ['🌳','⟁','≡','▦','⊞','📌','⭐','🔎','📊','📋','🎨','💡','🗂','🔖','📁','🌐','⚡','🧩','🔷','🔶'];
const VCOLORS = ['#0078D4','#7C3AED','#15803D','#E8690A','#DC2626','#D97706','#059669','#DB2777','#0891B2','#9333EA'];

// ── LayoutViewSaveModal — name / icon / color picker when saving a view ──
function LayoutViewSaveModal({ onSave, onClose, M, A, uff }) {
  const [name,  setName]  = useState('My View');
  const [icon,  setIcon]  = useState('⭐');
  const [color, setColor] = useState('#0078D4');
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 3000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 320, background: M.hi, borderRadius: 12, border: `1px solid ${M.div}`, zIndex: 3001, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,.3)' }}>
        <div style={{ padding: '11px 16px', borderBottom: `1px solid ${M.div}`, background: M.thd, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: M.tA, fontFamily: uff }}>💾 Save View As</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: M.tD, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: M.tD, fontFamily: uff, marginBottom: 4, textTransform: 'uppercase' }}>View Name</div>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus
            style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${A.a}`, borderRadius: 6, background: M.inBg, color: M.tA, fontSize: 12, fontFamily: uff, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
          <div style={{ fontSize: 9, fontWeight: 800, color: M.tD, fontFamily: uff, marginBottom: 6, textTransform: 'uppercase' }}>Icon</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {VICONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{ width: 28, height: 28, border: `1.5px solid ${icon === ic ? A.a : M.div}`, borderRadius: 6, background: icon === ic ? A.al : 'transparent', cursor: 'pointer', fontSize: 14 }}>{ic}</button>
            ))}
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, color: M.tD, fontFamily: uff, marginBottom: 6, textTransform: 'uppercase' }}>Color</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
            {VCOLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `2.5px solid ${color === c ? M.tA : 'transparent'}`, cursor: 'pointer' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '7px 16px', border: `1px solid ${M.div}`, borderRadius: 6, background: 'transparent', color: M.tB, fontSize: 11, cursor: 'pointer', fontFamily: uff }}>Cancel</button>
            <button onClick={() => name.trim() && onSave({ name: name.trim(), icon, color })}
              style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: A.a, color: A.tx || '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>Save View</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// ArticleMasterLayoutPanel — named export
// Used by SheetWorkspace to inject Layout View as an EXTRA tab
// alongside the existing Records / Data Entry / Bulk / Field Specs tabs.
// Manages its own layoutTab state + orgHierarchy from AM_SEED_DATA.
// ════════════════════════════════════════════════════════════════
export function ArticleMasterLayoutPanel({ M: rawM, A, uff, dff, canEdit = true, onEditRecord }) {
  const M  = toM(rawM);
  const fz = 13;

  const [layoutTab,   setLayoutTab]   = useState("classic");
  const [groupByL1,   setGroupByL1]   = useState("l1Division");
  const [groupByL2,   setGroupByL2]   = useState("l2Category");
  const [displayOpts, setDisplayOpts] = useState(INIT_DISPLAY_OPTS);
  const [showPanel,   setShowPanel]   = useState(false);
  const propsBtnRef = useRef(null);

  // ── Shared filter / sort / search ──
  const [filters,     setFilters]     = useState([]);
  const [sorts,       setSorts]       = useState([{ id: 1, field: 'code', mode: 'a_z', value: '' }]);
  const [search,      setSearch]      = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSorts,   setShowSorts]   = useState(false);

  // ── Cards view own grouping (controlled at panel level so views can capture it) ──
  const [cardsGroupBy,    setCardsGroupBy]    = useState('');
  const [cardsSubGroupBy, setCardsSubGroupBy] = useState('');

  // ── Views system ──
  const INIT_VIEWS = [
    { id: 'v_default', name: 'Default', icon: '🌳', color: '#0078D4', locked: true,
      layoutTab: 'classic', groupByL1: 'l1Division', groupByL2: 'l2Category',
      filters: [], sorts: [{ id: 1, field: 'code', mode: 'a_z', value: '' }], search: '',
      displayOpts: INIT_DISPLAY_OPTS, cardsGroupBy: '', cardsSubGroupBy: '' },
    { id: 'v_cards', name: 'Cards', icon: '▦', color: '#7C3AED', locked: true,
      layoutTab: 'cards', groupByL1: 'l1Division', groupByL2: 'l2Category',
      filters: [], sorts: [{ id: 1, field: 'code', mode: 'a_z', value: '' }], search: '',
      displayOpts: INIT_DISPLAY_OPTS, cardsGroupBy: '', cardsSubGroupBy: '' },
    { id: 'v_matrix', name: 'Matrix', icon: '⊞', color: '#E8690A', locked: true,
      layoutTab: 'matrix', groupByL1: 'l1Division', groupByL2: 'l2Category',
      filters: [], sorts: [{ id: 1, field: 'code', mode: 'a_z', value: '' }], search: '',
      displayOpts: INIT_DISPLAY_OPTS, cardsGroupBy: '', cardsSubGroupBy: '' },
  ];
  const [layoutViews,   setLayoutViews]   = useState(INIT_VIEWS);
  const [activeViewId,  setActiveViewId]  = useState('v_default');
  const [selectedArt,   setSelectedArt]   = useState(null);
  const [showExport,    setShowExport]    = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isMaxView,     setIsMaxView]     = useState(false);

  // ── isViewDirty — true when current config differs from the active saved view ──
  const isViewDirty = useMemo(() => {
    const av = layoutViews.find(v => v.id === activeViewId);
    if (!av) return false;
    const cur = JSON.stringify({ layoutTab, groupByL1, groupByL2, filters, sorts, search,
      displayOpts: JSON.stringify(displayOpts), cardsGroupBy, cardsSubGroupBy });
    const saved = JSON.stringify({ layoutTab: av.layoutTab, groupByL1: av.groupByL1, groupByL2: av.groupByL2,
      filters: av.filters, sorts: av.sorts, search: av.search,
      displayOpts: JSON.stringify(av.displayOpts),
      cardsGroupBy: av.cardsGroupBy || '', cardsSubGroupBy: av.cardsSubGroupBy || '' });
    return cur !== saved;
  }, [layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts,
      cardsGroupBy, cardsSubGroupBy, layoutViews, activeViewId]);

  // ── View helpers ──
  const switchToView = useCallback((viewId) => {
    const v = layoutViews.find(lv => lv.id === viewId);
    if (!v) return;
    setActiveViewId(viewId);
    setLayoutTab(v.layoutTab);
    setGroupByL1(v.groupByL1);
    setGroupByL2(v.groupByL2);
    setFilters(v.filters);
    setSorts(v.sorts);
    setSearch(v.search);
    setDisplayOpts(v.displayOpts);
    setCardsGroupBy(v.cardsGroupBy || '');
    setCardsSubGroupBy(v.cardsSubGroupBy || '');
    setShowFilters(false);
    setShowSorts(false);
  }, [layoutViews]);

  const saveCurrentToView = useCallback(() => {
    setLayoutViews(prev => prev.map(v => v.id === activeViewId
      ? { ...v, layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy }
      : v));
  }, [activeViewId, layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy]);

  const addNewView = useCallback(({ name, icon, color }) => {
    const id = `v_${Date.now()}`;
    setLayoutViews(prev => [...prev, { id, name, icon, color, locked: false,
      layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy }]);
    setActiveViewId(id);
    setShowSaveModal(false);
  }, [layoutTab, groupByL1, groupByL2, filters, sorts, search, displayOpts, cardsGroupBy, cardsSubGroupBy]);

  const deleteView = useCallback((viewId) => {
    const v = layoutViews.find(lv => lv.id === viewId);
    if (!v || v.locked) return;
    setLayoutViews(prev => prev.filter(lv => lv.id !== viewId));
    if (activeViewId === viewId) switchToView('v_default');
  }, [layoutViews, activeViewId, switchToView]);

  const onArtClick = useCallback((art) => setSelectedArt(art), []);

  // Escape exits max view only when no article modal is open
  useEffect(() => {
    if (!isMaxView || selectedArt) return;
    const h = (e) => { if (e.key === 'Escape') setIsMaxView(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isMaxView, selectedArt]);

  const fieldVals = useMemo(() => {
    const m = {};
    CARD_FIELDS.filter(f => f.type === 'cat').forEach(f => {
      m[f.key] = [...new Set(AM_DATA.map(d => d[f.key]).filter(Boolean))].sort();
    });
    return m;
  }, []);

  const freqMaps = useMemo(() => {
    const m = {};
    CARD_FIELDS.forEach(f => {
      const counts = {};
      AM_DATA.forEach(d => { const v = String(d[f.key] ?? ''); counts[v] = (counts[v] || 0) + 1; });
      m[f.key] = counts;
    });
    return m;
  }, []);

  const processedData = useMemo(() => {
    let r = AM_DATA;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(d => [d.code, d.desc, d.shortName, d.season, d.gender, d.l1Division, d.l2Category]
        .some(v => String(v || '').toLowerCase().includes(q)));
    }
    filters.forEach(fil => {
      if (fil.value !== '' || CARD_FIELDS.find(x => x.key === fil.field)?.type === 'num')
        r = r.filter(art => evalFilter(art, fil));
    });
    return applyMultiSort(r, sorts, freqMaps);
  }, [search, filters, sorts, freqMaps]);

  const addFilter    = () => setFilters(p => [...p, { id: Date.now(), field: 'l1Division', op: 'is', value: '' }]);
  const removeFilter = (id) => setFilters(p => p.filter(f => f.id !== id));
  const updateFilter = (id, patch) => setFilters(p => p.map(f => {
    if (f.id !== id) return f;
    const merged = { ...f, ...patch };
    if (patch.field && patch.field !== f.field) {
      const newType = CARD_FIELDS.find(x => x.key === patch.field)?.type || 'cat';
      merged.op = FILTER_OPS[newType][0]; merged.value = '';
    }
    return merged;
  }));
  const addSort    = () => setSorts(p => [...p, { id: Date.now(), field: 'code', mode: 'a_z', value: '' }]);
  const removeSort = (id) => setSorts(p => p.length > 1 ? p.filter(s => s.id !== id) : p);
  const updateSort = (id, patch) => setSorts(p => p.map(s => s.id === id ? { ...s, ...patch } : s));
  const resetAll   = () => { setFilters([]); setSorts([{ id: 1, field: 'code', mode: 'a_z', value: '' }]); setSearch(''); setShowFilters(false); setShowSorts(false); };
  const activeFilterCount = filters.filter(f => f.value !== '').length;
  const isSortActive = sorts.some(s => s.mode !== 'a_z' || s.field !== 'code');

  // Style helpers shared by FilterSortBar
  const ctrlSel = { fontSize: 10, border: `1px solid ${M.div}`, borderRadius: 5, padding: '3px 7px', background: M.inBg, color: M.tA, fontFamily: uff, cursor: 'pointer', outline: 'none' };
  const ctrlBtn = (on) => ({ padding: '3px 10px', border: `1px solid ${on ? A.a : M.div}`, borderRadius: 5, background: on ? A.al : 'transparent', color: on ? A.a : M.tB, fontSize: 10, fontWeight: on ? 800 : 600, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap' });

  // Close panel when switching to a view that doesn't support it
  const PROPS_VIEWS = ["classic", "hierarchy", "column", "cards"];
  const propsSupported = PROPS_VIEWS.includes(layoutTab);

  // Dynamic hierarchy — rebuilt from filtered data
  const orgHierarchy = useMemo(() => {
    const h = {};
    processedData.forEach(r => {
      const l1val = r[groupByL1] || "(blank)";
      const l2val = r[groupByL2] || "(blank)";
      if (!h[l1val]) {
        const { color, icon } = getGroupMeta(groupByL1, l1val);
        h[l1val] = { label: l1val, color, icon, l2s: {} };
      }
      if (!h[l1val].l2s[l2val]) h[l1val].l2s[l2val] = [];
      h[l1val].l2s[l2val].push(r);
    });
    if (groupByL1 === "l1Division") return DIVISIONS.map(d => h[d]).filter(Boolean);
    return Object.keys(h).sort().map(k => h[k]);
  }, [processedData, groupByL1, groupByL2]);

  const l1Label = GROUPABLE_FIELDS.find(f => f.key === groupByL1)?.label || groupByL1;
  const l2Label = GROUPABLE_FIELDS.find(f => f.key === groupByL2)?.label || groupByL2;

  const layoutBtnS = (active) => ({
    padding: "4px 13px", border: `1px solid ${active ? A.a : M.div}`,
    borderRadius: 5, background: active ? A.al : "transparent",
    color: active ? A.a : M.tB, fontSize: 10, fontWeight: active ? 900 : 600,
    cursor: "pointer", fontFamily: uff,
  });
  const selS = {
    fontSize: 10, border: `1px solid ${M.div}`, borderRadius: 4,
    padding: "2px 6px", background: M.inBg, color: M.tA,
    fontFamily: uff, cursor: "pointer", outline: "none",
  };

  return (
    <div style={isMaxView
      ? { position: 'fixed', inset: 0, zIndex: 1200, background: M.hi, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      : { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Sub-tab bar + right-side controls */}
      <div style={{ padding: "6px 16px", display: "flex", gap: 4, borderBottom: `1px solid ${M.div}`, background: M.thd, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { id: "classic",   label: "🌳 Classic"  },
          { id: "hierarchy", label: "⟁ Hierarchy" },
          { id: "column",    label: "≡ Column"    },
          { id: "cards",     label: "▦ Cards"     },
          { id: "matrix",    label: "⊞ Matrix"    },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => { setLayoutTab(id); if (!PROPS_VIEWS.includes(id)) setShowPanel(false); }}
            style={layoutBtnS(layoutTab === id)}>{label}</button>
        ))}

        {/* Right-side controls: Export | Print | Properties */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {/* Export dropdown */}
          <div style={{ position: "relative" }}>
            {showExport && <div onClick={() => setShowExport(false)} style={{ position: "fixed", inset: 0, zIndex: 499 }} />}
            <button onClick={() => setShowExport(v => !v)}
              style={{ padding: "4px 11px", border: `1px solid ${showExport ? A.a : M.div}`, borderRadius: 5, background: showExport ? A.al : "transparent", color: showExport ? A.a : M.tB, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: uff }}>
              ⬇ Export
            </button>
            {showExport && (
              <div style={{ position: "absolute", right: 0, top: 30, zIndex: 500, background: M.hi, border: `1px solid ${M.div}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.18)", minWidth: 160, overflow: "hidden" }}>
                {[
                  { label: "📄 Export CSV",      fn: () => exportAsCsv(processedData) },
                  { label: "🖨 Print / PDF",      fn: () => window.print() },
                ].map(({ label, fn }) => (
                  <button key={label} onClick={() => { fn(); setShowExport(false); }}
                    style={{ display: "block", width: "100%", padding: "8px 14px", border: "none", background: "transparent", color: M.tA, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: uff, textAlign: "left" }}
                    onMouseEnter={e => e.currentTarget.style.background = M.mid}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Print */}
          <button onClick={() => window.print()} title="Print current view"
            style={{ padding: "4px 10px", border: `1px solid ${M.div}`, borderRadius: 5, background: "transparent", color: M.tB, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: uff }}>
            🖨 Print
          </button>
          {/* Max View / Restore */}
          <button onClick={() => setIsMaxView(v => !v)}
            title={isMaxView ? "Restore view (Esc)" : "Expand to full page"}
            style={{ padding: "4px 10px", border: `1px solid ${isMaxView ? A.a : M.div}`, borderRadius: 5, background: isMaxView ? A.al : "transparent", color: isMaxView ? A.a : M.tB, fontSize: 10, fontWeight: isMaxView ? 800 : 600, cursor: "pointer", fontFamily: uff, whiteSpace: "nowrap" }}>
            {isMaxView ? "⊡ Restore" : "⛶ Max View"}
          </button>
          {/* Properties */}
          {propsSupported && (
            <div style={{ position: "relative" }} ref={propsBtnRef}>
              <button onClick={() => setShowPanel(p => !p)}
                style={{ padding: "4px 12px", border: `1px solid ${showPanel ? A.a : M.div}`, borderRadius: 5, background: showPanel ? A.al : "transparent", color: showPanel ? A.a : M.tB, fontSize: 10, fontWeight: showPanel ? 800 : 600, cursor: "pointer", fontFamily: uff, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>⚙</span> Properties
                {(displayOpts.thumbnail || displayOpts.density !== "summary") && (
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: A.a, flexShrink: 0 }} />
                )}
              </button>
              {showPanel && (
                <ViewOptionsPanel displayOpts={displayOpts} setDisplayOpts={setDisplayOpts} onClose={() => setShowPanel(false)} M={M} A={A} uff={uff} />
              )}
            </div>
          )}
          {!propsSupported && (
            <span style={{ fontSize: 9, color: M.tD, fontFamily: uff }}>
              {orgHierarchy.length} {l1Label.toLowerCase()}s · {AM_DATA.length} articles
            </span>
          )}
        </div>
      </div>

      {/* ── Views Bar ── */}
      <div style={{ padding: "5px 12px", display: "flex", gap: 5, alignItems: "center", borderBottom: `1px solid ${M.div}`, background: "#ffffff", flexShrink: 0, flexWrap: "nowrap", overflowX: "auto" }}>
        {/* VIEWS: label */}
        <span style={{ fontSize: 8.5, fontWeight: 900, color: M.tD, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: uff, flexShrink: 0, marginRight: 2 }}>VIEWS:</span>

        {layoutViews.map(v => {
          const isActive  = v.id === activeViewId;
          const isDirty   = isActive && isViewDirty;
          const isDefault = !!v.locked;
          // Color scheme: CC Red for Default, Purple for user views
          const CC_RED    = "#CC0000";
          const CC_PUR    = "#7C3AED";
          const borderStyle = isDefault
            ? `1.5px solid ${isActive ? CC_RED : "#CC000055"}`
            : isActive
              ? `1.5px solid ${CC_PUR}`
              : `1.5px dashed #c4b5fd`;
          const pillBg = isActive
            ? isDefault ? "#fff0f0" : "#f5f3ff"
            : "transparent";
          return (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
              <button onClick={() => switchToView(v.id)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px",
                  border: borderStyle, borderRadius: 6,
                  background: pillBg,
                  color: isActive ? (isDefault ? CC_RED : CC_PUR) : M.tB,
                  fontSize: 10, fontWeight: isActive ? 900 : 600,
                  cursor: "pointer", fontFamily: uff, whiteSpace: "nowrap" }}>
                <span>{v.icon}</span>
                <span>{v.name}</span>
                {isDefault && (
                  <span style={{ fontSize: 7, fontWeight: 900, padding: "1px 5px", borderRadius: 4, background: "#f3f4f6", color: "#6b7280", letterSpacing: 0.3 }}>LOCKED</span>
                )}
                {isDirty && (
                  <span style={{ fontSize: 7, fontWeight: 900, padding: "1px 5px", borderRadius: 4, background: "#fef3c7", color: "#92400e", letterSpacing: 0.3 }}>MODIFIED</span>
                )}
              </button>
              {!isDefault && isActive && isDirty && (
                <button onClick={saveCurrentToView} title="Save changes to this view"
                  style={{ padding: "3px 8px", border: `1px solid ${CC_PUR}`, borderRadius: "0 5px 5px 0", background: "#f5f3ff", color: CC_PUR, fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff, whiteSpace: "nowrap", marginLeft: 1 }}>
                  💾 Update View
                </button>
              )}
              {!isDefault && (
                <button onClick={() => deleteView(v.id)} title="Delete view"
                  style={{ width: 14, height: 14, borderRadius: 3, border: "none", background: "transparent", color: M.tD, cursor: "pointer", fontSize: 10, lineHeight: "14px", textAlign: "center", marginLeft: 1, paddingBottom: 1 }}>×</button>
              )}
            </div>
          );
        })}

        {/* + New View — purple dashed border like Records "+Save View" */}
        <button onClick={() => setShowSaveModal(true)}
          style={{ padding: "3px 10px", border: "1.5px dashed #c4b5fd", borderRadius: 6, background: "#fdf4ff", color: "#7C3AED", fontSize: 9.5, fontWeight: 700, cursor: "pointer", fontFamily: uff, flexShrink: 0, whiteSpace: "nowrap" }}>
          ＋ New View
        </button>
      </div>

      {/* ── Unified toolbar: Search / Filter / Sort + Group By (one row) ── */}
      <div style={{ padding: '5px 14px', borderBottom: `1px solid ${M.div}`, background: M.hi, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* ── Search ── */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: M.tD }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles…"
              style={{ padding: '4px 8px 4px 24px', border: `1px solid ${search ? A.a : M.div}`, borderRadius: 6, fontSize: 10, fontFamily: uff, width: 150, outline: 'none', color: M.tA, background: M.inBg }} />
          </div>

          {/* ── Filter + Sort + Reset ── */}
          <div style={{ width: 1, height: 16, background: M.div, flexShrink: 0 }} />
          <button onClick={() => setShowFilters(v => !v)} style={ctrlBtn(showFilters || activeFilterCount > 0)}>
            ＋ Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          <button onClick={() => setShowSorts(v => !v)} style={ctrlBtn(showSorts || isSortActive)}>
            ↑ Sort ({sorts.length})
          </button>
          {(filters.length > 0 || isSortActive || search) && (
            <button onClick={resetAll} style={{ ...ctrlBtn(false), color: '#dc2626', borderColor: '#dc262640', fontSize: 9 }}>✕ Reset</button>
          )}

          {/* ── Group By (hidden in Cards — Cards has its own) ── */}
          {layoutTab !== "cards" && <>
            <div style={{ width: 1, height: 16, background: M.div, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, fontFamily: uff, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>⊞ Group By</span>
            <select value={groupByL1} onChange={e => setGroupByL1(e.target.value)} style={selS}>
              {GROUPABLE_FIELDS.filter(f => f.key !== groupByL2).map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: M.tD, flexShrink: 0 }}>›</span>
            <select value={groupByL2} onChange={e => setGroupByL2(e.target.value)} style={selS}>
              {GROUPABLE_FIELDS.filter(f => f.key !== groupByL1).map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <div style={{ width: 1, height: 14, background: M.div, flexShrink: 0 }} />
            {PRESETS.map(p => {
              const isActive = groupByL1 === p.l1 && groupByL2 === p.l2;
              return (
                <button key={p.label} onClick={() => { setGroupByL1(p.l1); setGroupByL2(p.l2); }}
                  style={{ padding: "2px 8px", borderRadius: 10, border: `1px solid ${isActive ? A.a : M.div}`, background: isActive ? A.al : "transparent", color: isActive ? A.a : M.tC, fontSize: 9, fontWeight: isActive ? 800 : 500, cursor: "pointer", fontFamily: uff, flexShrink: 0 }}>
                  {p.label}
                </button>
              );
            })}
          </>}

          {/* ── Right: article count ── */}
          <div style={{ marginLeft: 'auto', fontSize: 9, color: M.tD, fontFamily: uff, flexShrink: 0 }}>
            {layoutTab !== "cards" && `${orgHierarchy.length} ${l1Label.toLowerCase()}s · `}
            {processedData.length} / {AM_DATA.length} articles
          </div>
        </div>

        {/* Row 2 — Filter rows */}
        {showFilters && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${M.div}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filters.map((fil, fi) => {
              const fMeta = CARD_FIELDS.find(f => f.key === fil.field);
              const ops   = FILTER_OPS[fMeta?.type || 'cat'];
              const vals  = fieldVals[fil.field];
              const isAct = fil.value !== '';
              return (
                <div key={fil.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: M.tD, fontFamily: uff, minWidth: 34, textAlign: 'right', fontWeight: 600 }}>{fi === 0 ? 'Where' : 'And'}</span>
                  <select value={fil.field} onChange={e => updateFilter(fil.id, { field: e.target.value })}
                    style={{ ...ctrlSel, fontWeight: 700, color: A.a, borderColor: `${A.a}70`, background: A.al }}>
                    {CARD_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <select value={fil.op} onChange={e => updateFilter(fil.id, { op: e.target.value })} style={ctrlSel}>
                    {ops.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  {fMeta?.type === 'cat' && vals ? (
                    <select value={fil.value} onChange={e => updateFilter(fil.id, { value: e.target.value })}
                      style={{ ...ctrlSel, minWidth: 110, fontWeight: 700, borderColor: isAct ? `${A.a}70` : M.div, color: isAct ? A.a : M.tA }}>
                      <option value="">Select value…</option>
                      {vals.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input value={fil.value} onChange={e => updateFilter(fil.id, { value: e.target.value })}
                      placeholder={fMeta?.type === 'num' ? 'Enter number…' : 'Enter text…'}
                      type={fMeta?.type === 'num' ? 'number' : 'text'}
                      style={{ ...ctrlSel, minWidth: 110, fontWeight: 700, borderColor: isAct ? `${A.a}70` : M.div, color: isAct ? A.a : M.tA }} />
                  )}
                  <button onClick={() => removeFilter(fil.id)}
                    style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 3px', fontWeight: 900 }}>×</button>
                </div>
              );
            })}
            <button onClick={addFilter}
              style={{ alignSelf: 'flex-start', marginLeft: 40, border: 'none', background: 'transparent', color: A.a, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff, padding: 0 }}>
              ＋ Add another filter
            </button>
          </div>
        )}

        {/* Row 3 — Sort rules */}
        {showSorts && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${M.div}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sorts.map((srt, si) => {
              const fMeta   = CARD_FIELDS.find(f => f.key === srt.field);
              const needVal = srt.mode === 'val_first' || srt.mode === 'val_last';
              const catVals = needVal && fMeta?.type === 'cat' ? fieldVals[srt.field] : null;
              return (
                <div key={srt.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: M.tD, fontFamily: uff, minWidth: 34, textAlign: 'right', fontWeight: 600 }}>{si === 0 ? 'Sort' : 'Then'}</span>
                  <select value={srt.field} onChange={e => updateSort(srt.id, { field: e.target.value, value: '' })}
                    style={{ ...ctrlSel, fontWeight: 700, color: '#7c3aed', borderColor: '#7c3aed70', background: '#7c3aed10' }}>
                    {CARD_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <select value={srt.mode} onChange={e => updateSort(srt.id, { mode: e.target.value, value: '' })} style={ctrlSel}>
                    {SORT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  {needVal && (catVals ? (
                    <select value={srt.value} onChange={e => updateSort(srt.id, { value: e.target.value })}
                      style={{ ...ctrlSel, minWidth: 120, fontWeight: 700 }}>
                      <option value="">Pick value…</option>
                      {catVals.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input value={srt.value} onChange={e => updateSort(srt.id, { value: e.target.value })}
                      placeholder="Enter value…" style={{ ...ctrlSel, minWidth: 120, fontWeight: 700 }} />
                  ))}
                  {sorts.length > 1 && (
                    <button onClick={() => removeSort(srt.id)}
                      style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 3px', fontWeight: 900 }}>×</button>
                  )}
                </div>
              );
            })}
            <button onClick={addSort}
              style={{ alignSelf: 'flex-start', marginLeft: 40, border: 'none', background: 'transparent', color: '#7c3aed', fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff, padding: 0 }}>
              ＋ Add another sort
            </button>
          </div>
        )}
      </div>

      {/* View content */}
      <div style={{ flex: 1, overflow: layoutTab === "column" ? "hidden" : "auto", display: "flex", flexDirection: "column" }}>
        {layoutTab === "classic"   && <AM_ClassicTree   hierarchy={orgHierarchy} data={processedData} M={M} A={A} uff={uff} dff={dff} fz={fz} l1Label={l1Label} l2Label={l2Label} displayOpts={displayOpts} onArtClick={onArtClick} />}
        {layoutTab === "hierarchy" && <AM_FlowDiagram   hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} l1Label={l1Label} l2Label={l2Label} displayOpts={displayOpts} onArtClick={onArtClick} />}
        {layoutTab === "column"    && <AM_ColumnNav     hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} l1Label={l1Label} l2Label={l2Label} displayOpts={displayOpts} onArtClick={onArtClick} />}
        {layoutTab === "cards"     && <AM_CardsView     data={processedData} hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} l1Label={l1Label} l2Label={l2Label} displayOpts={displayOpts} onArtClick={onArtClick} groupBy={cardsGroupBy} setGroupBy={setCardsGroupBy} subGroupBy={cardsSubGroupBy} setSubGroupBy={setCardsSubGroupBy} />}
        {layoutTab === "matrix"    && <AM_MatrixView    data={processedData} hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} l1Label={l1Label} l2Label={l2Label} onArtClick={onArtClick} />}
      </div>

      {/* ── Modals ── */}
      {selectedArt && (() => {
        const idx = processedData.findIndex(a => a.code === selectedArt.code);
        return (
          <ArtDetailModal
            art={selectedArt}
            onClose={() => setSelectedArt(null)}
            onPrev={idx > 0 ? () => setSelectedArt(processedData[idx - 1]) : null}
            onNext={idx < processedData.length - 1 ? () => setSelectedArt(processedData[idx + 1]) : null}
            artIndex={idx} totalArts={processedData.length}
            canEdit={canEdit}
            onEdit={canEdit && onEditRecord ? (art) => { onEditRecord(art); setSelectedArt(null); } : null}
            M={M} A={A} uff={uff} dff={dff} fz={fz}
          />
        );
      })()}
      {showSaveModal && (
        <LayoutViewSaveModal onSave={addNewView} onClose={() => setShowSaveModal(false)} M={M} A={A} uff={uff} />
      )}
    </div>
  );
}
