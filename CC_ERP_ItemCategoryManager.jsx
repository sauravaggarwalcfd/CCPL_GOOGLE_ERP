import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// CC ERP — ITEM CATEGORY MANAGER
// 3-Level Category Tree (L1 / L2 / L3) with cascading dropdowns
// Follows CC_ERP_UI_SPEC_V6.md design system
// ═══════════════════════════════════════════════════════════════

const MODES = {
  light:    { bg:"#f0f2f5", sh:"#fff", shBd:"#e2e4e8", sbBg:"#fff", sbBd:"#e2e4e8", hi:"#fff", mid:"#f7f8fa", lo:"#f0f2f5", hov:"#eef1f8", inBg:"#fff", inBd:"#d1d5db", inFc:"#E8690A", div:"#e5e7eb", thd:"#f4f5f7", tev:"#fff", tod:"#fafbfc", bBg:"#e5e7eb", bTx:"#374151", tA:"#111827", tB:"#374151", tC:"#6b7280", tD:"#9ca3af", scr:"#d1d5db", shadow:"0 4px 20px rgba(0,0,0,.09)", lbl:"☀️ Light" },
  black:    { bg:"#000", sh:"#0a0a0a", shBd:"#1c1c1c", sbBg:"#0a0a0a", sbBd:"#1c1c1c", hi:"#111", mid:"#161616", lo:"#0a0a0a", hov:"#1c1c1c", inBg:"#0d0d0d", inBd:"#2a2a2a", inFc:"#E8690A", div:"#1f1f1f", thd:"#0d0d0d", tev:"#111", tod:"#141414", bBg:"#1c1c1c", bTx:"#888", tA:"#f0f0f0", tB:"#a0a0a0", tC:"#666", tD:"#444", scr:"#2a2a2a", shadow:"0 4px 28px rgba(0,0,0,.85)", lbl:"⬛ Black" },
  midnight: { bg:"#0d1117", sh:"#161b22", shBd:"#21262d", sbBg:"#161b22", sbBd:"#21262d", hi:"#1c2128", mid:"#161b22", lo:"#0d1117", hov:"#21262d", inBg:"#0d1117", inBd:"#30363d", inFc:"#E8690A", div:"#21262d", thd:"#161b22", tev:"#1c2128", tod:"#161b22", bBg:"#21262d", bTx:"#7d8590", tA:"#e6edf3", tB:"#8b949e", tC:"#6e7681", tD:"#484f58", scr:"#30363d", shadow:"0 4px 24px rgba(0,0,0,.6)", lbl:"🌙 Midnight" },
  warm:     { bg:"#f0ebe0", sh:"#fdf8f0", shBd:"#e4d8c4", sbBg:"#fdf8f0", sbBd:"#e4d8c4", hi:"#fdfaf4", mid:"#f5f0e8", lo:"#ede5d4", hov:"#e8dece", inBg:"#fdfaf4", inBd:"#d4c8b0", inFc:"#E8690A", div:"#ddd0b8", thd:"#f0ebe0", tev:"#fdfaf4", tod:"#f5f0e8", bBg:"#e4d8c4", bTx:"#4a3c28", tA:"#1c1409", tB:"#5a4a34", tC:"#8a7460", tD:"#b0a090", scr:"#c8b89c", shadow:"0 4px 16px rgba(60,40,10,.12)", lbl:"🌅 Warm" },
  slate:    { bg:"#1a2030", sh:"#252d40", shBd:"#2d3654", sbBg:"#1e2433", sbBd:"#2d3654", hi:"#2a3450", mid:"#222a3e", lo:"#1a2030", hov:"#2d3654", inBg:"#1a2030", inBd:"#2d3654", inFc:"#E8690A", div:"#2d3654", thd:"#1e2433", tev:"#222a3e", tod:"#1e2433", bBg:"#2d3654", bTx:"#8895b0", tA:"#d8e0f0", tB:"#8895b0", tC:"#5a6680", tD:"#3a4460", scr:"#2d3654", shadow:"0 4px 24px rgba(0,0,0,.5)", lbl:"🔷 Slate" },
};

const ACC = {
  orange: { a:"#E8690A", al:"rgba(232,105,10,.12)", ad:"#b85208", tx:"#fff", lbl:"🟠 Orange" },
  blue:   { a:"#0078D4", al:"rgba(0,120,212,.12)",  ad:"#005a9e", tx:"#fff", lbl:"🔵 Blue" },
  teal:   { a:"#007C7C", al:"rgba(0,124,124,.12)",  ad:"#005f5f", tx:"#fff", lbl:"🩵 Teal" },
  green:  { a:"#15803D", al:"rgba(21,128,61,.12)",  ad:"#0f6330", tx:"#fff", lbl:"🟢 Green" },
  purple: { a:"#7C3AED", al:"rgba(124,58,237,.12)", ad:"#5b21b6", tx:"#fff", lbl:"🟣 Purple" },
  rose:   { a:"#BE123C", al:"rgba(190,18,60,.12)",  ad:"#9b0d30", tx:"#fff", lbl:"🌹 Rose" },
};

// ─── L1 HIERARCHY DEFINITION ───
// This is the single source of truth for category hierarchy
const CATEGORY_HIERARCHY = {
  // APPAREL — L1 is SELECTABLE by user
  "ARTICLE": {
    l1Behavior: "SELECTABLE",
    l1Options: ["Men's Apparel", "Women's Apparel", "Kids Apparel", "Unisex Apparel"],
    l2Options: {
      "Men's Apparel":    ["Tops - Polo", "Tops - Tee", "Sweatshirt", "Tracksuit", "Bottoms"],
      "Women's Apparel":  ["Tops - Tee", "Sweatshirt", "Bottoms"],
      "Kids Apparel":     ["Tops - Tee", "Sweatshirt"],
      "Unisex Apparel":   ["Tops - Tee", "Sweatshirt"],
    },
    l3Options: {
      "Tops - Polo":  ["Pique Polo", "Autostriper Polo", "Jacquard Polo"],
      "Tops - Tee":   ["Round Neck Tee", "V-Neck Tee", "Henley Tee", "Crop Top", "Oversized Tee"],
      "Sweatshirt":   ["Hoodie", "Crew Neck Sweatshirt", "Quarter Zip"],
      "Tracksuit":    ["Full Tracksuit", "Track Jacket", "Track Pant"],
      "Bottoms":      ["Jogger", "Shorts"],
    },
    defaultHSN: { "Tops - Polo": "6105", "Tops - Tee": "6109", "Sweatshirt": "6110", "Tracksuit": "6112", "Bottoms": "6103" },
    icon: "👕", color: "#E8690A",
  },
  // RAW MATERIAL — L1 FIXED
  "RM-FABRIC": {
    l1Behavior: "FIXED", l1Fixed: "Raw Material",
    l2Options: { "Raw Material": ["Knit Fabric"] },
    l3Options: { "Knit Fabric": ["Single Jersey", "Pique", "Fleece", "French Terry", "Rib", "Interlock", "Lycra Jersey"] },
    defaultHSN: { "Knit Fabric": "6006" },
    icon: "🧵", color: "#0078D4",
  },
  "RM-YARN": {
    l1Behavior: "FIXED", l1Fixed: "Raw Material",
    l2Options: { "Raw Material": ["Yarn"] },
    l3Options: { "Yarn": ["Cotton Combed", "Cotton Carded", "Polyester", "PC Blend", "Viscose", "Melange"] },
    defaultHSN: { "Yarn": "5205" },
    icon: "🧶", color: "#0078D4",
  },
  "RM-WOVEN": {
    l1Behavior: "FIXED", l1Fixed: "Raw Material",
    l2Options: { "Raw Material": ["Woven / Interlining"] },
    l3Options: { "Woven / Interlining": ["Fusible Interlining", "Non-Fusible Interlining", "Woven Fabric"] },
    defaultHSN: { "Woven / Interlining": "5903" },
    icon: "🪡", color: "#0078D4",
  },
  // TRIM — L1 FIXED
  "TRIM": {
    l1Behavior: "FIXED", l1Fixed: "Trim",
    l2Options: { "Trim": ["Thread", "Label", "Elastic", "Zipper", "Button", "Tape", "Drawcord", "Velcro", "Rivet / Eyelet", "Neck / Shoulder Tape", "Other"] },
    l3Options: {
      "Thread":     ["Sewing Thread", "Overlock Thread", "Embroidery Thread", "Tacking Thread"],
      "Label":      ["Main Label", "Care Label", "Size Label", "Hang Tag", "Badge"],
      "Elastic":    ["Crochet Elastic", "Knitted Elastic", "Flat Elastic"],
      "Zipper":     ["Dress Zipper", "Open-End Zipper", "Invisible Zipper", "Metal Zipper"],
      "Button":     ["Flat Button", "Snap Button", "Shank Button"],
      "Tape":       ["Twill Tape", "Herringbone Tape", "Reflective Tape"],
      "Drawcord":   ["Flat Drawcord", "Round Drawcord", "Woven Drawcord"],
      "Velcro":     ["Sew-On Velcro", "Self-Adhesive Velcro"],
      "Rivet / Eyelet": ["Metal Rivet", "Brass Eyelet"],
      "Neck / Shoulder Tape": ["Neck Tape", "Shoulder Tape"],
      "Other":      ["Other Trim"],
    },
    defaultHSN: { "Thread": "5204", "Label": "5807", "Elastic": "5604", "Zipper": "9607", "Button": "9606", "Tape": "5806", "Drawcord": "5604", "Velcro": "5806", "Rivet / Eyelet": "8308", "Neck / Shoulder Tape": "5806", "Other": "6307" },
    icon: "🔗", color: "#7C3AED",
  },
  // CONSUMABLE — L1 FIXED
  "CONSUMABLE": {
    l1Behavior: "FIXED", l1Fixed: "Consumable",
    l2Options: { "Consumable": ["Dye", "Chemical", "Needle", "Oil", "Adhesive", "Other"] },
    l3Options: {
      "Dye":      ["Reactive Dye", "Disperse Dye", "Pigment Dye", "Acid Dye"],
      "Chemical": ["Softener", "Fixing Agent", "Levelling Agent", "Anti-Creasing Agent"],
      "Needle":   ["Knitting Needle", "Sewing Needle"],
      "Oil":      ["Machine Oil", "Silicone Oil"],
      "Adhesive": ["Fusing Adhesive", "Spray Adhesive"],
      "Other":    ["Other Consumable"],
    },
    defaultHSN: { "Dye": "3204", "Chemical": "3402", "Needle": "7319", "Oil": "2710", "Adhesive": "3506", "Other": "6307" },
    icon: "⚗️", color: "#15803D",
  },
  // PACKAGING — L1 FIXED
  "PACKAGING": {
    l1Behavior: "FIXED", l1Fixed: "Packaging",
    l2Options: { "Packaging": ["Polybag", "Carton", "Hanger", "Ticket / Tag", "Other"] },
    l3Options: {
      "Polybag":      ["LDPE Polybag", "HM Polybag", "Printed Polybag"],
      "Carton":       ["Single Wall Carton", "Double Wall Carton", "Inner Carton"],
      "Hanger":       ["Plastic Hanger", "Wire Hanger"],
      "Ticket / Tag": ["Price Ticket", "Barcode Label", "Season Tag"],
      "Other":        ["Tissue Paper", "Sticker Tape", "Foam Sheet"],
    },
    defaultHSN: { "Polybag": "3923", "Carton": "4819", "Hanger": "3926", "Ticket / Tag": "4821", "Other": "4818" },
    icon: "📦", color: "#BE123C",
  },
};

const MASTER_OPTIONS = Object.keys(CATEGORY_HIERARCHY).map(k => ({ v: k, l: `${CATEGORY_HIERARCHY[k].icon} ${k}` }));

// ─── Mock data simulating current ITEM_CATEGORIES sheet ───
const INITIAL_DATA = [
  { code:"CAT-001", l1:"Men's Apparel", l2:"Tops - Polo", l3:"Pique Polo", master:"ARTICLE", hsn:"6105", active:"Yes", remarks:"Classic polo", behavior:"SELECTABLE" },
  { code:"CAT-004", l1:"Men's Apparel", l2:"Tops - Tee", l3:"Round Neck Tee", master:"ARTICLE", hsn:"6109", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-007", l1:"Men's Apparel", l2:"Sweatshirt", l3:"Hoodie", master:"ARTICLE", hsn:"6110", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-030", l1:"Raw Material", l2:"Knit Fabric", l3:"Single Jersey", master:"RM-FABRIC", hsn:"6006", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-040", l1:"Raw Material", l2:"Yarn", l3:"Cotton Combed", master:"RM-YARN", hsn:"5205", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-060", l1:"Trim", l2:"Thread", l3:"Sewing Thread", master:"TRIM", hsn:"5204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-064", l1:"Trim", l2:"Label", l3:"Main Label", master:"TRIM", hsn:"5807", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-090", l1:"Consumable", l2:"Dye", l3:"Reactive Dye", master:"CONSUMABLE", hsn:"3204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-100", l1:"Packaging", l2:"Polybag", l3:"LDPE Polybag", master:"PACKAGING", hsn:"3923", active:"Yes", remarks:"", behavior:"FIXED" },
];

// ─── Toast System ───
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, color = "#15803D") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, color }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, add };
}

function Toasts({ toasts, M }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:t.color, color:"#fff", padding:"10px 18px", borderRadius:8,
          fontFamily:"'Nunito Sans',sans-serif", fontSize:13, fontWeight:700,
          boxShadow:"0 4px 16px rgba(0,0,0,.2)", animation:"slideIn .3s ease",
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span>✓</span> {t.msg}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ItemCategoryManager() {
  const [mode, setMode] = useState("midnight");
  const [accent, setAccent] = useState("orange");
  const [fz, setFz] = useState(13);
  const M = MODES[mode];
  const A = ACC[accent];
  const { toasts, add: showToast } = useToast();

  const [data, setData] = useState(INITIAL_DATA);
  const [tab, setTab] = useState("tree");       // tree | create | records
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterMaster, setFilterMaster] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");

  // ─── CREATE FORM STATE ───
  const [form, setForm] = useState({ master:"", l1:"", l2:"", l3:"", hsn:"", active:"Yes", remarks:"" });
  const [formErrors, setFormErrors] = useState({});

  const hierarchy = form.master ? CATEGORY_HIERARCHY[form.master] : null;

  // Cascading: when master changes, reset L1/L2/L3
  const setMaster = (v) => {
    const h = CATEGORY_HIERARCHY[v];
    setForm({
      master: v,
      l1: h?.l1Behavior === "FIXED" ? h.l1Fixed : "",
      l2: "", l3: "", hsn: "", active: "Yes", remarks: "",
    });
    setFormErrors({});
  };

  const setL1 = (v) => { setForm(f => ({ ...f, l1: v, l2: "", l3: "", hsn: "" })); setFormErrors({}); };
  const setL2 = (v) => {
    const hsn = hierarchy?.defaultHSN?.[v] || "";
    setForm(f => ({ ...f, l2: v, l3: "", hsn }));
    setFormErrors({});
  };
  const setL3 = (v) => setForm(f => ({ ...f, l3: v }));

  const l1Opts = hierarchy ? (hierarchy.l1Behavior === "FIXED" ? [hierarchy.l1Fixed] : hierarchy.l1Options) : [];
  const l2Opts = hierarchy && form.l1 ? (hierarchy.l2Options[form.l1] || []) : [];
  const l3Opts = hierarchy && form.l2 ? (hierarchy.l3Options[form.l2] || []) : [];

  // Generate next code
  const nextCode = useMemo(() => {
    const nums = data.map(d => parseInt(d.code.replace("CAT-", ""), 10)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `CAT-${String(max + 1).padStart(3, "0")}`;
  }, [data]);

  // Validate + Save
  const handleSave = () => {
    const errs = {};
    if (!form.master) errs.master = "Required";
    if (!form.l1) errs.l1 = "Required";
    if (!form.l2) errs.l2 = "Required";
    if (!form.l3) errs.l3 = "Required";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    // Check duplicate
    const dup = data.find(d => d.l1 === form.l1 && d.l2 === form.l2 && d.l3 === form.l3 && d.master === form.master);
    if (dup && (!editItem || dup.code !== editItem.code)) {
      showToast(`Duplicate: ${dup.code} already has this combination`, "#BE123C");
      return;
    }
    if (editItem) {
      setData(prev => prev.map(d => d.code === editItem.code ? { ...d, ...form, behavior: hierarchy.l1Behavior } : d));
      showToast(`Updated ${editItem.code}`, A.a);
      setEditItem(null);
    } else {
      const newItem = { code: nextCode, ...form, behavior: hierarchy.l1Behavior };
      setData(prev => [...prev, newItem]);
      showToast(`Created ${nextCode}`, "#15803D");
    }
    setForm({ master:"", l1:"", l2:"", l3:"", hsn:"", active:"Yes", remarks:"" });
    setFormErrors({});
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ master: item.master, l1: item.l1, l2: item.l2, l3: item.l3, hsn: item.hsn, active: item.active, remarks: item.remarks });
    setTab("create");
  };

  const handleToggleActive = (code) => {
    setData(prev => prev.map(d => d.code === code ? { ...d, active: d.active === "Yes" ? "No" : "Yes" } : d));
  };

  // ─── FILTERED DATA ───
  const filtered = useMemo(() => {
    return data.filter(d => {
      if (filterMaster !== "ALL" && d.master !== filterMaster) return false;
      if (filterActive !== "ALL" && d.active !== filterActive) return false;
      if (search) {
        const s = search.toLowerCase();
        return [d.code, d.l1, d.l2, d.l3, d.master, d.hsn].some(v => v?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [data, filterMaster, filterActive, search]);

  // ─── TREE DATA ───
  const treeData = useMemo(() => {
    const tree = {};
    data.forEach(d => {
      if (!tree[d.l1]) tree[d.l1] = {};
      if (!tree[d.l1][d.l2]) tree[d.l1][d.l2] = [];
      tree[d.l1][d.l2].push(d);
    });
    return tree;
  }, [data]);

  // ─── STYLES ───
  const lbl = { display:"block", fontSize:9, fontWeight:900, color:M.tC, marginBottom:4, fontFamily:"'Nunito Sans',sans-serif", letterSpacing:.5, textTransform:"uppercase" };
  const inp = {
    width:"100%", padding:"8px 12px", borderRadius:6, border:`1px solid ${M.inBd}`, background:M.inBg, color:M.tA,
    fontFamily:"'Nunito Sans',sans-serif", fontSize:fz, outline:"none", boxSizing:"border-box", transition:"border-color .2s",
  };
  const inpFocus = { borderColor: A.a, boxShadow: `0 0 0 2px ${A.al}` };
  const mono = { fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, fontSize:fz - 1 };
  const btn = (bg, tx = "#fff") => ({
    padding:"8px 20px", borderRadius:6, border:"none", background:bg, color:tx,
    fontFamily:"'Nunito Sans',sans-serif", fontSize:fz, fontWeight:700, cursor:"pointer", transition:"all .15s",
  });

  const tabBtnStyle = (active) => ({
    padding:"8px 20px", borderRadius:"6px 6px 0 0", border:`1px solid ${active ? A.a : M.div}`,
    borderBottom: active ? `2px solid ${A.a}` : `1px solid ${M.div}`,
    background: active ? A.al : "transparent", color: active ? A.a : M.tB,
    fontFamily:"'Nunito Sans',sans-serif", fontSize:fz, fontWeight: active ? 800 : 600,
    cursor:"pointer", transition:"all .15s", letterSpacing:.3,
  });

  return (
    <div style={{ background:M.bg, minHeight:"100vh", fontFamily:"'Nunito Sans',sans-serif", color:M.tA }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,600;6..12,700;6..12,800;6..12,900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; }
        input:focus, select:focus, textarea:focus { border-color:${A.a} !important; box-shadow:0 0 0 2px ${A.al} !important; outline:none; }
        @keyframes slideIn { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width:8px; height:8px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${M.scr}; border-radius:4px; }
      `}</style>
      <Toasts toasts={toasts} M={M} />

      {/* ─── TOP SHELL BAR ─── */}
      <div style={{
        height:48, background:M.sh, borderBottom:`1px solid ${M.shBd}`,
        display:"flex", alignItems:"center", padding:"0 20px", gap:16,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>📂</span>
          <span style={{ fontWeight:900, fontSize:15, color:M.tA, letterSpacing:.3 }}>ITEM CATEGORIES</span>
          <span style={{ ...mono, fontSize:10, background:A.al, color:A.a, padding:"2px 8px", borderRadius:4, marginLeft:4 }}>
            {data.length} categories
          </span>
        </div>
        <div style={{ flex:1 }} />
        {/* Theme switcher */}
        <div style={{ display:"flex", gap:4 }}>
          {Object.entries(MODES).map(([k, v]) => (
            <button key={k} onClick={() => setMode(k)} title={v.lbl} style={{
              width:20, height:20, borderRadius:10, border: mode === k ? `2px solid ${A.a}` : `1px solid ${M.div}`,
              background:v.bg, cursor:"pointer", transition:"all .15s",
            }} />
          ))}
        </div>
        <div style={{ width:1, height:24, background:M.div }} />
        <div style={{ display:"flex", gap:4 }}>
          {Object.entries(ACC).map(([k, v]) => (
            <button key={k} onClick={() => setAccent(k)} title={v.lbl} style={{
              width:20, height:20, borderRadius:10, border: accent === k ? `2px solid ${M.tA}` : `1px solid ${M.div}`,
              background:v.a, cursor:"pointer", transition:"all .15s",
            }} />
          ))}
        </div>
      </div>

      {/* ─── TAB BAR ─── */}
      <div style={{ padding:"12px 20px 0", display:"flex", gap:4, borderBottom:`1px solid ${M.div}` }}>
        <button onClick={() => setTab("tree")} style={tabBtnStyle(tab === "tree")}>🌳 Tree View</button>
        <button onClick={() => { setTab("create"); setEditItem(null); setForm({ master:"", l1:"", l2:"", l3:"", hsn:"", active:"Yes", remarks:"" }); }} style={tabBtnStyle(tab === "create")}>
          {editItem ? "✏️ Edit" : "➕ Create"} Category
        </button>
        <button onClick={() => setTab("records")} style={tabBtnStyle(tab === "records")}>📋 Records</button>
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ padding:20 }}>

        {/* ═══ TREE VIEW ═══ */}
        {tab === "tree" && (
          <div style={{ animation:"fadeIn .25s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:16 }}>
              {Object.entries(treeData).map(([l1, l2Map]) => {
                const masterType = Object.values(l2Map).flat()[0]?.master;
                const h = masterType ? CATEGORY_HIERARCHY[masterType] : null;
                const groupColor = h?.color || A.a;
                return (
                  <div key={l1} style={{
                    background:M.hi, border:`1px solid ${M.div}`, borderRadius:10,
                    borderTop:`3px solid ${groupColor}`, overflow:"hidden",
                  }}>
                    <div style={{
                      padding:"12px 16px", background:M.thd, display:"flex", alignItems:"center", gap:8,
                      borderBottom:`1px solid ${M.div}`,
                    }}>
                      <span style={{ fontSize:18 }}>{h?.icon || "📁"}</span>
                      <span style={{ fontWeight:800, fontSize:14, color:M.tA }}>{l1}</span>
                      <span style={{
                        ...mono, fontSize:9, background:groupColor, color:"#fff", padding:"2px 8px",
                        borderRadius:10, marginLeft:"auto",
                      }}>
                        {h?.l1Behavior === "FIXED" ? "FIXED" : "SELECTABLE"}
                      </span>
                    </div>
                    <div style={{ padding:12 }}>
                      {Object.entries(l2Map).map(([l2, items]) => (
                        <div key={l2} style={{ marginBottom:12 }}>
                          <div style={{
                            fontSize:11, fontWeight:800, color:groupColor, textTransform:"uppercase",
                            letterSpacing:.5, padding:"4px 0", borderBottom:`1px dashed ${M.div}`, marginBottom:6,
                          }}>
                            {l2} <span style={{ color:M.tD, fontWeight:500 }}>({items.length})</span>
                          </div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, paddingLeft:8 }}>
                            {items.map(item => (
                              <button key={item.code} onClick={() => handleEdit(item)} style={{
                                padding:"4px 10px", borderRadius:6,
                                border:`1px solid ${item.active === "Yes" ? groupColor + "40" : M.div}`,
                                background: item.active === "Yes" ? groupColor + "10" : M.mid,
                                color: item.active === "Yes" ? M.tA : M.tD,
                                fontSize:fz - 2, fontFamily:"'Nunito Sans',sans-serif", fontWeight:600,
                                cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", gap:4,
                                opacity: item.active === "Yes" ? 1 : .5,
                              }}>
                                <span style={{ ...mono, fontSize:9, color:M.tC }}>{item.code}</span>
                                {item.l3}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CREATE / EDIT FORM ═══ */}
        {tab === "create" && (
          <div style={{ maxWidth:720, animation:"fadeIn .25s ease" }}>
            <div style={{
              background:M.hi, border:`1px solid ${M.div}`, borderRadius:10, padding:24,
              boxShadow:M.shadow,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, paddingBottom:12, borderBottom:`1px solid ${M.div}` }}>
                <span style={{ fontSize:22 }}>{editItem ? "✏️" : "➕"}</span>
                <div>
                  <div style={{ fontWeight:900, fontSize:16 }}>{editItem ? `Edit ${editItem.code}` : "Create New Category"}</div>
                  <div style={{ fontSize:11, color:M.tC }}>
                    {editItem ? "Modify existing category definition" : `Next code: `}
                    {!editItem && <span style={mono}>{nextCode}</span>}
                  </div>
                </div>
                {editItem && (
                  <button onClick={() => { setEditItem(null); setForm({ master:"", l1:"", l2:"", l3:"", hsn:"", active:"Yes", remarks:"" }); }}
                    style={{ ...btn(M.bBg, M.bTx), marginLeft:"auto", fontSize:11 }}>
                    ✕ Cancel Edit
                  </button>
                )}
              </div>

              {/* MASTER SELECTOR */}
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>⚠ Item Master Sheet</label>
                <select value={form.master} onChange={e => setMaster(e.target.value)}
                  style={{ ...inp, cursor:"pointer", ...(formErrors.master ? { borderColor:"#BE123C" } : {}) }}>
                  <option value="">— Select Master —</option>
                  {MASTER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                {formErrors.master && <span style={{ color:"#BE123C", fontSize:10, fontWeight:700 }}>⚠ {formErrors.master}</span>}
              </div>

              {form.master && (
                <>
                  {/* L1 BEHAVIOR BADGE */}
                  <div style={{
                    padding:"8px 14px", borderRadius:6, marginBottom:16, fontSize:11, fontWeight:700,
                    background: hierarchy.l1Behavior === "FIXED" ? "#0078D4" + "15" : A.al,
                    color: hierarchy.l1Behavior === "FIXED" ? "#0078D4" : A.a,
                    border: `1px solid ${hierarchy.l1Behavior === "FIXED" ? "#0078D4" + "30" : A.a + "30"}`,
                    display:"flex", alignItems:"center", gap:8,
                  }}>
                    {hierarchy.l1Behavior === "FIXED"
                      ? <><span>🔒</span> L1 is auto-fixed to <strong style={{ marginLeft:4 }}>"{hierarchy.l1Fixed}"</strong> for this master</>
                      : <><span>🔓</span> L1 is <strong>SELECTABLE</strong> — pick the division below</>
                    }
                  </div>

                  {/* L1 FIELD */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                    <div>
                      <label style={lbl}>⚠ L1 Division</label>
                      {hierarchy.l1Behavior === "FIXED" ? (
                        <div style={{
                          ...inp, background:A.al, color:A.a, fontWeight:700, border:`1px solid ${A.a}30`,
                          display:"flex", alignItems:"center", gap:6,
                        }}>
                          <span>🔒</span> {hierarchy.l1Fixed}
                        </div>
                      ) : (
                        <select value={form.l1} onChange={e => setL1(e.target.value)}
                          style={{ ...inp, cursor:"pointer", ...(formErrors.l1 ? { borderColor:"#BE123C" } : {}) }}>
                          <option value="">— Select L1 —</option>
                          {l1Opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                      {formErrors.l1 && <span style={{ color:"#BE123C", fontSize:10, fontWeight:700 }}>⚠ {formErrors.l1}</span>}
                    </div>

                    {/* L2 FIELD */}
                    <div>
                      <label style={lbl}>⚠ L2 Type</label>
                      <select value={form.l2} onChange={e => setL2(e.target.value)} disabled={!form.l1}
                        style={{ ...inp, cursor:"pointer", opacity: form.l1 ? 1 : .4, ...(formErrors.l2 ? { borderColor:"#BE123C" } : {}) }}>
                        <option value="">— Select L2 —</option>
                        {l2Opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {formErrors.l2 && <span style={{ color:"#BE123C", fontSize:10, fontWeight:700 }}>⚠ {formErrors.l2}</span>}
                    </div>
                  </div>

                  {/* L3 + HSN */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                    <div>
                      <label style={lbl}>⚠ L3 Style</label>
                      <select value={form.l3} onChange={e => setL3(e.target.value)} disabled={!form.l2}
                        style={{ ...inp, cursor:"pointer", opacity: form.l2 ? 1 : .4, ...(formErrors.l3 ? { borderColor:"#BE123C" } : {}) }}>
                        <option value="">— Select L3 —</option>
                        {l3Opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {formErrors.l3 && <span style={{ color:"#BE123C", fontSize:10, fontWeight:700 }}>⚠ {formErrors.l3}</span>}
                    </div>
                    <div>
                      <label style={lbl}>Default HSN Code</label>
                      <input value={form.hsn} onChange={e => setForm(f => ({ ...f, hsn: e.target.value }))}
                        style={{ ...inp, ...mono }} placeholder="Auto from L2 selection" />
                      <span style={{ fontSize:9, color:M.tD }}>← Auto-filled when L2 is selected. Override if needed.</span>
                    </div>
                  </div>

                  {/* ACTIVE + REMARKS */}
                  <div style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:16, marginBottom:20 }}>
                    <div>
                      <label style={lbl}>Active</label>
                      <select value={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.value }))}
                        style={{ ...inp, cursor:"pointer" }}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Remarks</label>
                      <input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                        style={inp} placeholder="Optional notes" />
                    </div>
                  </div>

                  {/* PREVIEW CARD */}
                  {form.l3 && (
                    <div style={{
                      padding:14, borderRadius:8, border:`1px dashed ${A.a}`, background:A.al, marginBottom:16,
                    }}>
                      <div style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", color:A.a, letterSpacing:.5, marginBottom:6 }}>
                        Preview
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ ...mono, fontSize:12, color:A.a }}>{editItem ? editItem.code : nextCode}</span>
                        <span style={{ color:M.div }}>│</span>
                        <span style={{ fontWeight:700, color:M.tA }}>{form.l1}</span>
                        <span style={{ color:M.tD }}>›</span>
                        <span style={{ fontWeight:600, color:M.tB }}>{form.l2}</span>
                        <span style={{ color:M.tD }}>›</span>
                        <span style={{ fontWeight:600, color:M.tB }}>{form.l3}</span>
                        <span style={{ color:M.div }}>│</span>
                        <span style={{ ...mono, fontSize:11, color:M.tC }}>HSN {form.hsn}</span>
                        <span style={{ color:M.div }}>│</span>
                        <span style={{ fontSize:11, color:M.tC }}>{form.master}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:12, borderTop:`1px solid ${M.div}` }}>
                <button onClick={() => { setForm({ master:"", l1:"", l2:"", l3:"", hsn:"", active:"Yes", remarks:"" }); setEditItem(null); setFormErrors({}); }}
                  style={btn(M.bBg, M.bTx)}>
                  ↺ Clear
                </button>
                <button onClick={handleSave} style={btn(A.a, A.tx)}>
                  {editItem ? "💾 Update Category" : "✚ Save Category"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RECORDS TABLE ═══ */}
        {tab === "records" && (
          <div style={{ animation:"fadeIn .25s ease" }}>
            {/* TOOLBAR */}
            <div style={{
              display:"flex", gap:12, marginBottom:12, alignItems:"center", flexWrap:"wrap",
              padding:"10px 14px", background:M.hi, borderRadius:8, border:`1px solid ${M.div}`,
            }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search categories..."
                style={{ ...inp, width:240, fontSize:fz - 1 }} />
              <select value={filterMaster} onChange={e => setFilterMaster(e.target.value)}
                style={{ ...inp, width:180, fontSize:fz - 1, cursor:"pointer" }}>
                <option value="ALL">All Masters</option>
                {MASTER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
                style={{ ...inp, width:120, fontSize:fz - 1, cursor:"pointer" }}>
                <option value="ALL">All Status</option>
                <option value="Yes">Active</option>
                <option value="No">Inactive</option>
              </select>
              <div style={{ flex:1 }} />
              <span style={{ ...mono, fontSize:10, color:M.tC }}>{filtered.length} of {data.length} records</span>
            </div>

            {/* TABLE */}
            <div style={{ borderRadius:8, border:`1px solid ${M.div}`, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:fz - 1 }}>
                  <thead>
                    <tr style={{ background:M.thd }}>
                      {["🔑 Code", "L1 Division", "L2 Type", "L3 Style", "Master", "HSN", "Behavior", "Active", "Actions"].map(h => (
                        <th key={h} style={{
                          padding:"8px 12px", textAlign:"left", fontWeight:900, fontSize:9,
                          textTransform:"uppercase", letterSpacing:.5, color:M.tC,
                          borderBottom:`2px solid ${M.div}`, whiteSpace:"nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => {
                      const h = CATEGORY_HIERARCHY[d.master];
                      const groupColor = h?.color || M.tC;
                      return (
                        <tr key={d.code} style={{
                          background: i % 2 === 0 ? M.tev : M.tod,
                          transition:"background .1s",
                          cursor:"pointer", opacity: d.active === "Yes" ? 1 : .5,
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = M.hov}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? M.tev : M.tod}
                        >
                          <td style={{ padding:"7px 12px", ...mono, fontSize:11, color:groupColor, whiteSpace:"nowrap" }}>{d.code}</td>
                          <td style={{ padding:"7px 12px", fontWeight:700, whiteSpace:"nowrap" }}>{d.l1}</td>
                          <td style={{ padding:"7px 12px", whiteSpace:"nowrap" }}>{d.l2}</td>
                          <td style={{ padding:"7px 12px", whiteSpace:"nowrap" }}>{d.l3}</td>
                          <td style={{ padding:"7px 12px" }}>
                            <span style={{ fontSize:fz - 3, background:groupColor + "15", color:groupColor, padding:"2px 8px", borderRadius:4, fontWeight:700 }}>
                              {h?.icon} {d.master}
                            </span>
                          </td>
                          <td style={{ padding:"7px 12px", ...mono, fontSize:11 }}>{d.hsn}</td>
                          <td style={{ padding:"7px 12px" }}>
                            <span style={{
                              fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:10,
                              background: d.behavior === "FIXED" ? "#0078D4" + "18" : A.al,
                              color: d.behavior === "FIXED" ? "#0078D4" : A.a,
                            }}>
                              {d.behavior === "FIXED" ? "🔒 FIXED" : "🔓 SELECT"}
                            </span>
                          </td>
                          <td style={{ padding:"7px 12px" }}>
                            <button onClick={(e) => { e.stopPropagation(); handleToggleActive(d.code); }} style={{
                              width:40, height:22, borderRadius:11, border:"none", cursor:"pointer",
                              background: d.active === "Yes" ? "#15803D" : M.bBg,
                              position:"relative", transition:"background .2s",
                            }}>
                              <div style={{
                                width:16, height:16, borderRadius:8, background:"#fff",
                                position:"absolute", top:3,
                                left: d.active === "Yes" ? 21 : 3,
                                transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)",
                              }} />
                            </button>
                          </td>
                          <td style={{ padding:"7px 12px" }}>
                            <button onClick={() => handleEdit(d)} style={{
                              background:"transparent", border:`1px solid ${A.a}30`, borderRadius:4,
                              color:A.a, padding:"3px 10px", fontSize:11, fontWeight:700, cursor:"pointer",
                              fontFamily:"'Nunito Sans',sans-serif",
                            }}>
                              ✏ Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STATUS BAR */}
            <div style={{
              marginTop:8, padding:"6px 14px", background:M.lo, borderRadius:6,
              display:"flex", gap:16, fontSize:10, color:M.tC, fontWeight:600,
            }}>
              <span>Total: {data.length}</span>
              <span>Visible: {filtered.length}</span>
              <span>Active: {data.filter(d => d.active === "Yes").length}</span>
              <span>Inactive: {data.filter(d => d.active === "No").length}</span>
              <span style={{ marginLeft:"auto", ...mono, fontSize:9 }}>ITEM_CATEGORIES • FILE 1A</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
