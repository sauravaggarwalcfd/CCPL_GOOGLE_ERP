import { useState, useMemo, useCallback } from 'react';
import api from '../../services/api';

// ═══════════════════════════════════════════════════════════════
// ITEM CATEGORY TAB — Dedicated UI for ITEM_CATEGORIES sheet
// 3-Level Category Tree: L1 Division → L2 Type → L3 Style
// Cascading dropdowns, tree view, records table
// ═══════════════════════════════════════════════════════════════

// ── Theme adapter: app tokens → short tokens ──
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

// ─── L1 HIERARCHY DEFINITION (single source of truth) ───
const CATEGORY_HIERARCHY = {
  "ARTICLE": {
    l1Behavior: "SELECTABLE",
    l1Options: ["Men's Apparel", "Women's Apparel", "Kids Apparel", "Unisex Apparel"],
    l2Options: {
      "Men's Apparel":   ["Tops - Polo", "Tops - Tee", "Sweatshirt", "Tracksuit", "Bottoms"],
      "Women's Apparel": ["Tops - Tee", "Sweatshirt", "Bottoms"],
      "Kids Apparel":    ["Tops - Tee", "Sweatshirt"],
      "Unisex Apparel":  ["Tops - Tee", "Sweatshirt"],
    },
    l3Options: {
      "Tops - Polo": ["Pique Polo", "Autostriper Polo", "Jacquard Polo"],
      "Tops - Tee":  ["Round Neck Tee", "V-Neck Tee", "Henley Tee", "Crop Top", "Oversized Tee"],
      "Sweatshirt":  ["Hoodie", "Crew Neck Sweatshirt", "Quarter Zip"],
      "Tracksuit":   ["Full Tracksuit", "Track Jacket", "Track Pant"],
      "Bottoms":     ["Jogger", "Shorts"],
    },
    defaultHSN: { "Tops - Polo": "6105", "Tops - Tee": "6109", "Sweatshirt": "6110", "Tracksuit": "6112", "Bottoms": "6103" },
    icon: "👕", color: "#E8690A",
  },
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

// ─── Full seed data from ITEM_CATEGORIES sheet (xlsx) ───
const SEED_DATA = [
  { code:"CAT-001", l1:"Men's Apparel", l2:"Tops - Polo", l3:"Pique Polo", master:"ARTICLE", hsn:"6105", active:"Yes", remarks:"Classic polo", behavior:"SELECTABLE" },
  { code:"CAT-002", l1:"Men's Apparel", l2:"Tops - Polo", l3:"Autostriper Polo", master:"ARTICLE", hsn:"6105", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-003", l1:"Men's Apparel", l2:"Tops - Polo", l3:"Jacquard Polo", master:"ARTICLE", hsn:"6105", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-004", l1:"Men's Apparel", l2:"Tops - Tee", l3:"Round Neck Tee", master:"ARTICLE", hsn:"6109", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-005", l1:"Men's Apparel", l2:"Tops - Tee", l3:"V-Neck Tee", master:"ARTICLE", hsn:"6109", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-006", l1:"Men's Apparel", l2:"Tops - Tee", l3:"Henley Tee", master:"ARTICLE", hsn:"6109", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-007", l1:"Men's Apparel", l2:"Sweatshirt", l3:"Hoodie", master:"ARTICLE", hsn:"6110", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-008", l1:"Men's Apparel", l2:"Sweatshirt", l3:"Crew Neck Sweatshirt", master:"ARTICLE", hsn:"6110", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-009", l1:"Men's Apparel", l2:"Sweatshirt", l3:"Quarter Zip", master:"ARTICLE", hsn:"6110", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-010", l1:"Men's Apparel", l2:"Tracksuit", l3:"Full Tracksuit", master:"ARTICLE", hsn:"6112", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-011", l1:"Men's Apparel", l2:"Tracksuit", l3:"Track Jacket", master:"ARTICLE", hsn:"6112", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-012", l1:"Men's Apparel", l2:"Tracksuit", l3:"Track Pant", master:"ARTICLE", hsn:"6112", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-013", l1:"Men's Apparel", l2:"Bottoms", l3:"Jogger", master:"ARTICLE", hsn:"6103", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-014", l1:"Men's Apparel", l2:"Bottoms", l3:"Shorts", master:"ARTICLE", hsn:"6103", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-015", l1:"Women's Apparel", l2:"Tops - Tee", l3:"Round Neck Tee", master:"ARTICLE", hsn:"6109", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-016", l1:"Women's Apparel", l2:"Tops - Tee", l3:"Crop Top", master:"ARTICLE", hsn:"6109", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-017", l1:"Women's Apparel", l2:"Sweatshirt", l3:"Hoodie", master:"ARTICLE", hsn:"6110", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-018", l1:"Women's Apparel", l2:"Bottoms", l3:"Jogger", master:"ARTICLE", hsn:"6103", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-019", l1:"Kids Apparel", l2:"Tops - Tee", l3:"Round Neck Tee", master:"ARTICLE", hsn:"6109", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-020", l1:"Kids Apparel", l2:"Sweatshirt", l3:"Hoodie", master:"ARTICLE", hsn:"6110", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-021", l1:"Unisex Apparel", l2:"Tops - Tee", l3:"Oversized Tee", master:"ARTICLE", hsn:"6109", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-022", l1:"Unisex Apparel", l2:"Sweatshirt", l3:"Hoodie", master:"ARTICLE", hsn:"6110", active:"Yes", remarks:"", behavior:"SELECTABLE" },
  { code:"CAT-030", l1:"Raw Material", l2:"Knit Fabric", l3:"Single Jersey", master:"RM-FABRIC", hsn:"6006", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-031", l1:"Raw Material", l2:"Knit Fabric", l3:"Pique", master:"RM-FABRIC", hsn:"6006", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-032", l1:"Raw Material", l2:"Knit Fabric", l3:"Fleece", master:"RM-FABRIC", hsn:"6006", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-033", l1:"Raw Material", l2:"Knit Fabric", l3:"French Terry", master:"RM-FABRIC", hsn:"6006", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-034", l1:"Raw Material", l2:"Knit Fabric", l3:"Rib", master:"RM-FABRIC", hsn:"6006", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-035", l1:"Raw Material", l2:"Knit Fabric", l3:"Interlock", master:"RM-FABRIC", hsn:"6006", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-036", l1:"Raw Material", l2:"Knit Fabric", l3:"Lycra Jersey", master:"RM-FABRIC", hsn:"6006", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-040", l1:"Raw Material", l2:"Yarn", l3:"Cotton Combed", master:"RM-YARN", hsn:"5205", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-041", l1:"Raw Material", l2:"Yarn", l3:"Cotton Carded", master:"RM-YARN", hsn:"5205", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-042", l1:"Raw Material", l2:"Yarn", l3:"Polyester", master:"RM-YARN", hsn:"5402", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-043", l1:"Raw Material", l2:"Yarn", l3:"PC Blend", master:"RM-YARN", hsn:"5205", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-044", l1:"Raw Material", l2:"Yarn", l3:"Viscose", master:"RM-YARN", hsn:"5510", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-045", l1:"Raw Material", l2:"Yarn", l3:"Melange", master:"RM-YARN", hsn:"5205", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-050", l1:"Raw Material", l2:"Woven / Interlining", l3:"Fusible Interlining", master:"RM-WOVEN", hsn:"5903", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-051", l1:"Raw Material", l2:"Woven / Interlining", l3:"Non-Fusible Interlining", master:"RM-WOVEN", hsn:"5903", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-052", l1:"Raw Material", l2:"Woven / Interlining", l3:"Woven Fabric", master:"RM-WOVEN", hsn:"5208", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-060", l1:"Trim", l2:"Thread", l3:"Sewing Thread", master:"TRIM", hsn:"5204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-061", l1:"Trim", l2:"Thread", l3:"Overlock Thread", master:"TRIM", hsn:"5204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-062", l1:"Trim", l2:"Thread", l3:"Embroidery Thread", master:"TRIM", hsn:"5204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-063", l1:"Trim", l2:"Thread", l3:"Tacking Thread", master:"TRIM", hsn:"5204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-064", l1:"Trim", l2:"Label", l3:"Main Label", master:"TRIM", hsn:"5807", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-065", l1:"Trim", l2:"Label", l3:"Care Label", master:"TRIM", hsn:"5807", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-066", l1:"Trim", l2:"Label", l3:"Size Label", master:"TRIM", hsn:"5807", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-067", l1:"Trim", l2:"Label", l3:"Hang Tag", master:"TRIM", hsn:"5807", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-068", l1:"Trim", l2:"Label", l3:"Badge", master:"TRIM", hsn:"5807", active:"Yes", remarks:"Sub-category under LBL", behavior:"FIXED" },
  { code:"CAT-069", l1:"Trim", l2:"Elastic", l3:"Crochet Elastic", master:"TRIM", hsn:"5604", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-070", l1:"Trim", l2:"Elastic", l3:"Knitted Elastic", master:"TRIM", hsn:"5604", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-071", l1:"Trim", l2:"Elastic", l3:"Flat Elastic", master:"TRIM", hsn:"5604", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-072", l1:"Trim", l2:"Zipper", l3:"Dress Zipper", master:"TRIM", hsn:"9607", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-073", l1:"Trim", l2:"Zipper", l3:"Open-End Zipper", master:"TRIM", hsn:"9607", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-074", l1:"Trim", l2:"Zipper", l3:"Invisible Zipper", master:"TRIM", hsn:"9607", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-075", l1:"Trim", l2:"Button", l3:"Flat Button", master:"TRIM", hsn:"9606", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-076", l1:"Trim", l2:"Button", l3:"Snap Button", master:"TRIM", hsn:"9606", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-077", l1:"Trim", l2:"Button", l3:"Shank Button", master:"TRIM", hsn:"9606", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-078", l1:"Trim", l2:"Tape", l3:"Twill Tape", master:"TRIM", hsn:"5806", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-079", l1:"Trim", l2:"Tape", l3:"Herringbone Tape", master:"TRIM", hsn:"5806", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-080", l1:"Trim", l2:"Drawcord", l3:"Flat Drawcord", master:"TRIM", hsn:"5604", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-081", l1:"Trim", l2:"Drawcord", l3:"Round Drawcord", master:"TRIM", hsn:"5604", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-082", l1:"Trim", l2:"Velcro", l3:"Sew-On Velcro", master:"TRIM", hsn:"5806", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-083", l1:"Trim", l2:"Rivet / Eyelet", l3:"Metal Rivet", master:"TRIM", hsn:"8308", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-084", l1:"Trim", l2:"Rivet / Eyelet", l3:"Brass Eyelet", master:"TRIM", hsn:"8308", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-085", l1:"Trim", l2:"Neck / Shoulder Tape", l3:"Neck Tape", master:"TRIM", hsn:"5806", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-086", l1:"Trim", l2:"Other", l3:"Other Trim", master:"TRIM", hsn:"6307", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-090", l1:"Consumable", l2:"Dye", l3:"Reactive Dye", master:"CONSUMABLE", hsn:"3204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-091", l1:"Consumable", l2:"Dye", l3:"Disperse Dye", master:"CONSUMABLE", hsn:"3204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-092", l1:"Consumable", l2:"Dye", l3:"Pigment Dye", master:"CONSUMABLE", hsn:"3204", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-093", l1:"Consumable", l2:"Chemical", l3:"Softener", master:"CONSUMABLE", hsn:"3402", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-094", l1:"Consumable", l2:"Chemical", l3:"Fixing Agent", master:"CONSUMABLE", hsn:"3402", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-095", l1:"Consumable", l2:"Chemical", l3:"Levelling Agent", master:"CONSUMABLE", hsn:"3402", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-096", l1:"Consumable", l2:"Needle", l3:"Knitting Needle", master:"CONSUMABLE", hsn:"7319", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-097", l1:"Consumable", l2:"Needle", l3:"Sewing Needle", master:"CONSUMABLE", hsn:"7319", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-098", l1:"Consumable", l2:"Oil", l3:"Machine Oil", master:"CONSUMABLE", hsn:"2710", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-099", l1:"Consumable", l2:"Other", l3:"Other Consumable", master:"CONSUMABLE", hsn:"6307", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-100", l1:"Packaging", l2:"Polybag", l3:"LDPE Polybag", master:"PACKAGING", hsn:"3923", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-101", l1:"Packaging", l2:"Polybag", l3:"HM Polybag", master:"PACKAGING", hsn:"3923", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-102", l1:"Packaging", l2:"Carton", l3:"Single Wall Carton", master:"PACKAGING", hsn:"4819", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-103", l1:"Packaging", l2:"Carton", l3:"Double Wall Carton", master:"PACKAGING", hsn:"4819", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-104", l1:"Packaging", l2:"Hanger", l3:"Plastic Hanger", master:"PACKAGING", hsn:"3926", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-105", l1:"Packaging", l2:"Ticket / Tag", l3:"Price Ticket", master:"PACKAGING", hsn:"4821", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-106", l1:"Packaging", l2:"Ticket / Tag", l3:"Barcode Label", master:"PACKAGING", hsn:"4821", active:"Yes", remarks:"", behavior:"FIXED" },
  { code:"CAT-107", l1:"Packaging", l2:"Other", l3:"Tissue Paper", master:"PACKAGING", hsn:"4818", active:"Yes", remarks:"", behavior:"FIXED" },
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
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.color, color: "#fff", padding: "10px 18px", borderRadius: 8,
          fontFamily: "inherit", fontSize: 13, fontWeight: 700,
          boxShadow: "0 4px 16px rgba(0,0,0,.2)", animation: "catSlideIn .3s ease",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>✓</span> {t.msg}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// Props: { M (raw app theme), A, uff, dff }
// ═══════════════════════════════════════════════════════════════
export default function ItemCategoryTab({ M: rawM, A, uff, dff }) {
  const M = toM(rawM);
  const fz = 13;
  const { toasts, add: showToast } = useToast();

  const [data, setData] = useState(SEED_DATA);
  const [tab, setTab] = useState("tree");
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterMaster, setFilterMaster] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");

  // ─── CREATE FORM STATE ───
  const [form, setForm] = useState({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" });
  const [formErrors, setFormErrors] = useState({});

  const hierarchy = form.master ? CATEGORY_HIERARCHY[form.master] : null;

  const setMaster = (v) => {
    const h = CATEGORY_HIERARCHY[v];
    setForm({ master: v, l1: h?.l1Behavior === "FIXED" ? h.l1Fixed : "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" });
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
  const handleSave = async () => {
    const errs = {};
    if (!form.master) errs.master = "Required";
    if (!form.l1) errs.l1 = "Required";
    if (!form.l2) errs.l2 = "Required";
    if (!form.l3) errs.l3 = "Required";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const dup = data.find(d => d.l1 === form.l1 && d.l2 === form.l2 && d.l3 === form.l3 && d.master === form.master);
    if (dup && (!editItem || dup.code !== editItem.code)) {
      showToast(`Duplicate: ${dup.code} already has this combination`, "#BE123C");
      return;
    }
    if (editItem) {
      setData(prev => prev.map(d => d.code === editItem.code ? { ...d, ...form, behavior: hierarchy.l1Behavior } : d));
      showToast(`Updated ${editItem.code}`, A.a);
      // API call
      try { await api.updateCategory(editItem.code, { ...form, behavior: hierarchy.l1Behavior }); } catch {}
      setEditItem(null);
    } else {
      const newItem = { code: nextCode, ...form, behavior: hierarchy.l1Behavior };
      setData(prev => [...prev, newItem]);
      showToast(`Created ${nextCode}`, "#15803D");
      try { await api.createCategory(newItem); } catch {}
    }
    setForm({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" });
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
  const lbl = { display: "block", fontSize: 9, fontWeight: 900, color: M.tC, marginBottom: 4, fontFamily: uff, letterSpacing: .5, textTransform: "uppercase" };
  const inp = {
    width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${M.inBd}`, background: M.inBg, color: M.tA,
    fontFamily: uff, fontSize: fz, outline: "none", boxSizing: "border-box", transition: "border-color .2s",
  };
  const mono = { fontFamily: dff, fontWeight: 600, fontSize: fz - 1 };
  const btn = (bg, tx = "#fff") => ({
    padding: "8px 20px", borderRadius: 6, border: "none", background: bg, color: tx,
    fontFamily: uff, fontSize: fz, fontWeight: 700, cursor: "pointer", transition: "all .15s",
  });

  const tabBtnStyle = (active) => ({
    padding: "8px 20px", borderRadius: "6px 6px 0 0", border: `1px solid ${active ? A.a : M.div}`,
    borderBottom: active ? `2px solid ${A.a}` : `1px solid ${M.div}`,
    background: active ? A.al : "transparent", color: active ? A.a : M.tB,
    fontFamily: uff, fontSize: fz, fontWeight: active ? 800 : 600,
    cursor: "pointer", transition: "all .15s", letterSpacing: .3,
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: uff, color: M.tA }}>
      <style>{`
        @keyframes catSlideIn { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes catFadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <Toasts toasts={toasts} M={M} />

      {/* ─── HEADER ─── */}
      <div style={{
        padding: "10px 16px", background: M.hi, borderBottom: `1px solid ${M.div}`,
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <span style={{ fontSize: 18 }}>🗂</span>
        <span style={{ fontWeight: 900, fontSize: 15, color: M.tA, letterSpacing: .3 }}>ITEM CATEGORIES</span>
        <span style={{ ...mono, fontSize: 10, background: A.al, color: A.a, padding: "2px 8px", borderRadius: 4 }}>
          {data.length} categories
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ ...mono, fontSize: 9, color: M.tD }}>ITEM_CATEGORIES • FILE 1A</span>
      </div>

      {/* ─── TAB BAR ─── */}
      <div style={{ padding: "8px 16px 0", display: "flex", gap: 4, borderBottom: `1px solid ${M.div}`, flexShrink: 0 }}>
        <button onClick={() => setTab("tree")} style={tabBtnStyle(tab === "tree")}>🌳 Tree View</button>
        <button onClick={() => { setTab("create"); setEditItem(null); setForm({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" }); }} style={tabBtnStyle(tab === "create")}>
          {editItem ? "✏️ Edit" : "➕ Create"} Category
        </button>
        <button onClick={() => setTab("records")} style={tabBtnStyle(tab === "records")}>📋 Records</button>
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>

        {/* ═══ TREE VIEW ═══ */}
        {tab === "tree" && (
          <div style={{ animation: "catFadeIn .25s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {Object.entries(treeData).map(([l1, l2Map]) => {
                const masterType = Object.values(l2Map).flat()[0]?.master;
                const h = masterType ? CATEGORY_HIERARCHY[masterType] : null;
                const groupColor = h?.color || A.a;
                return (
                  <div key={l1} style={{
                    background: M.hi, border: `1px solid ${M.div}`, borderRadius: 10,
                    borderTop: `3px solid ${groupColor}`, overflow: "hidden",
                  }}>
                    <div style={{
                      padding: "12px 16px", background: M.thd, display: "flex", alignItems: "center", gap: 8,
                      borderBottom: `1px solid ${M.div}`,
                    }}>
                      <span style={{ fontSize: 18 }}>{h?.icon || "📁"}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: M.tA }}>{l1}</span>
                      <span style={{
                        ...mono, fontSize: 9, background: groupColor, color: "#fff", padding: "2px 8px",
                        borderRadius: 10, marginLeft: "auto",
                      }}>
                        {h?.l1Behavior === "FIXED" ? "FIXED" : "SELECTABLE"}
                      </span>
                    </div>
                    <div style={{ padding: 12 }}>
                      {Object.entries(l2Map).map(([l2, items]) => (
                        <div key={l2} style={{ marginBottom: 12 }}>
                          <div style={{
                            fontSize: 11, fontWeight: 800, color: groupColor, textTransform: "uppercase",
                            letterSpacing: .5, padding: "4px 0", borderBottom: `1px dashed ${M.div}`, marginBottom: 6,
                          }}>
                            {l2} <span style={{ color: M.tD, fontWeight: 500 }}>({items.length})</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 8 }}>
                            {items.map(item => (
                              <button key={item.code} onClick={() => handleEdit(item)} style={{
                                padding: "4px 10px", borderRadius: 6,
                                border: `1px solid ${item.active === "Yes" ? groupColor + "40" : M.div}`,
                                background: item.active === "Yes" ? groupColor + "10" : M.mid,
                                color: item.active === "Yes" ? M.tA : M.tD,
                                fontSize: fz - 2, fontFamily: uff, fontWeight: 600,
                                cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 4,
                                opacity: item.active === "Yes" ? 1 : .5,
                              }}>
                                <span style={{ ...mono, fontSize: 9, color: M.tC }}>{item.code}</span>
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
          <div style={{ maxWidth: 720, animation: "catFadeIn .25s ease" }}>
            <div style={{
              background: M.hi, border: `1px solid ${M.div}`, borderRadius: 10, padding: 24,
              boxShadow: M.shadow,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${M.div}` }}>
                <span style={{ fontSize: 22 }}>{editItem ? "✏️" : "➕"}</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{editItem ? `Edit ${editItem.code}` : "Create New Category"}</div>
                  <div style={{ fontSize: 11, color: M.tC }}>
                    {editItem ? "Modify existing category definition" : `Next code: `}
                    {!editItem && <span style={mono}>{nextCode}</span>}
                  </div>
                </div>
                {editItem && (
                  <button onClick={() => { setEditItem(null); setForm({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" }); }}
                    style={{ ...btn(M.bBg, M.bTx), marginLeft: "auto", fontSize: 11 }}>
                    ✕ Cancel Edit
                  </button>
                )}
              </div>

              {/* MASTER SELECTOR */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Item Master Sheet</label>
                <select value={form.master} onChange={e => setMaster(e.target.value)}
                  style={{ ...inp, cursor: "pointer", ...(formErrors.master ? { borderColor: "#BE123C" } : {}) }}>
                  <option value="">— Select Master —</option>
                  {MASTER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                {formErrors.master && <span style={{ color: "#BE123C", fontSize: 10, fontWeight: 700 }}>⚠ {formErrors.master}</span>}
              </div>

              {form.master && (
                <>
                  {/* L1 BEHAVIOR BADGE */}
                  <div style={{
                    padding: "8px 14px", borderRadius: 6, marginBottom: 16, fontSize: 11, fontWeight: 700,
                    background: hierarchy.l1Behavior === "FIXED" ? "#0078D4" + "15" : A.al,
                    color: hierarchy.l1Behavior === "FIXED" ? "#0078D4" : A.a,
                    border: `1px solid ${hierarchy.l1Behavior === "FIXED" ? "#0078D4" + "30" : A.a + "30"}`,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {hierarchy.l1Behavior === "FIXED"
                      ? <><span>🔒</span> L1 is auto-fixed to <strong style={{ marginLeft: 4 }}>"{hierarchy.l1Fixed}"</strong> for this master</>
                      : <><span>🔓</span> L1 is <strong>SELECTABLE</strong> — pick the division below</>
                    }
                  </div>

                  {/* L1 + L2 FIELDS */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={lbl}>L1 Division</label>
                      {hierarchy.l1Behavior === "FIXED" ? (
                        <div style={{
                          ...inp, background: A.al, color: A.a, fontWeight: 700, border: `1px solid ${A.a}30`,
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <span>🔒</span> {hierarchy.l1Fixed}
                        </div>
                      ) : (
                        <select value={form.l1} onChange={e => setL1(e.target.value)}
                          style={{ ...inp, cursor: "pointer", ...(formErrors.l1 ? { borderColor: "#BE123C" } : {}) }}>
                          <option value="">— Select L1 —</option>
                          {l1Opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                      {formErrors.l1 && <span style={{ color: "#BE123C", fontSize: 10, fontWeight: 700 }}>⚠ {formErrors.l1}</span>}
                    </div>
                    <div>
                      <label style={lbl}>L2 Type</label>
                      <select value={form.l2} onChange={e => setL2(e.target.value)} disabled={!form.l1}
                        style={{ ...inp, cursor: "pointer", opacity: form.l1 ? 1 : .4, ...(formErrors.l2 ? { borderColor: "#BE123C" } : {}) }}>
                        <option value="">— Select L2 —</option>
                        {l2Opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {formErrors.l2 && <span style={{ color: "#BE123C", fontSize: 10, fontWeight: 700 }}>⚠ {formErrors.l2}</span>}
                    </div>
                  </div>

                  {/* L3 + HSN */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={lbl}>L3 Style</label>
                      <select value={form.l3} onChange={e => setL3(e.target.value)} disabled={!form.l2}
                        style={{ ...inp, cursor: "pointer", opacity: form.l2 ? 1 : .4, ...(formErrors.l3 ? { borderColor: "#BE123C" } : {}) }}>
                        <option value="">— Select L3 —</option>
                        {l3Opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {formErrors.l3 && <span style={{ color: "#BE123C", fontSize: 10, fontWeight: 700 }}>⚠ {formErrors.l3}</span>}
                    </div>
                    <div>
                      <label style={lbl}>Default HSN Code</label>
                      <input value={form.hsn} onChange={e => setForm(f => ({ ...f, hsn: e.target.value }))}
                        style={{ ...inp, ...mono }} placeholder="Auto from L2 selection" />
                      <span style={{ fontSize: 9, color: M.tD }}>Auto-filled when L2 is selected. Override if needed.</span>
                    </div>
                  </div>

                  {/* ACTIVE + REMARKS */}
                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={lbl}>Active</label>
                      <select value={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.value }))}
                        style={{ ...inp, cursor: "pointer" }}>
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
                      padding: 14, borderRadius: 8, border: `1px dashed ${A.a}`, background: A.al, marginBottom: 16,
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", color: A.a, letterSpacing: .5, marginBottom: 6 }}>
                        Preview
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ ...mono, fontSize: 12, color: A.a }}>{editItem ? editItem.code : nextCode}</span>
                        <span style={{ color: M.div }}>│</span>
                        <span style={{ fontWeight: 700, color: M.tA }}>{form.l1}</span>
                        <span style={{ color: M.tD }}>›</span>
                        <span style={{ fontWeight: 600, color: M.tB }}>{form.l2}</span>
                        <span style={{ color: M.tD }}>›</span>
                        <span style={{ fontWeight: 600, color: M.tB }}>{form.l3}</span>
                        <span style={{ color: M.div }}>│</span>
                        <span style={{ ...mono, fontSize: 11, color: M.tC }}>HSN {form.hsn}</span>
                        <span style={{ color: M.div }}>│</span>
                        <span style={{ fontSize: 11, color: M.tC }}>{form.master}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${M.div}` }}>
                <button onClick={() => { setForm({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" }); setEditItem(null); setFormErrors({}); }}
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
          <div style={{ animation: "catFadeIn .25s ease" }}>
            {/* TOOLBAR */}
            <div style={{
              display: "flex", gap: 12, marginBottom: 12, alignItems: "center", flexWrap: "wrap",
              padding: "10px 14px", background: M.hi, borderRadius: 8, border: `1px solid ${M.div}`,
            }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search categories..."
                style={{ ...inp, width: 240, fontSize: fz - 1 }} />
              <select value={filterMaster} onChange={e => setFilterMaster(e.target.value)}
                style={{ ...inp, width: 180, fontSize: fz - 1, cursor: "pointer" }}>
                <option value="ALL">All Masters</option>
                {MASTER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
                style={{ ...inp, width: 120, fontSize: fz - 1, cursor: "pointer" }}>
                <option value="ALL">All Status</option>
                <option value="Yes">Active</option>
                <option value="No">Inactive</option>
              </select>
              <div style={{ flex: 1 }} />
              <span style={{ ...mono, fontSize: 10, color: M.tC }}>{filtered.length} of {data.length} records</span>
            </div>

            {/* TABLE */}
            <div style={{ borderRadius: 8, border: `1px solid ${M.div}`, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: fz - 1 }}>
                  <thead>
                    <tr style={{ background: M.thd }}>
                      {["🔑 Code", "L1 Division", "L2 Type", "L3 Style", "Master", "HSN", "Behavior", "Active", "Actions"].map(h => (
                        <th key={h} style={{
                          padding: "8px 12px", textAlign: "left", fontWeight: 900, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: .5, color: M.tC,
                          borderBottom: `2px solid ${M.div}`, whiteSpace: "nowrap",
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
                          transition: "background .1s",
                          cursor: "pointer", opacity: d.active === "Yes" ? 1 : .5,
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = M.hov}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? M.tev : M.tod}
                        >
                          <td style={{ padding: "7px 12px", ...mono, fontSize: 11, color: groupColor, whiteSpace: "nowrap" }}>{d.code}</td>
                          <td style={{ padding: "7px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>{d.l1}</td>
                          <td style={{ padding: "7px 12px", whiteSpace: "nowrap" }}>{d.l2}</td>
                          <td style={{ padding: "7px 12px", whiteSpace: "nowrap" }}>{d.l3}</td>
                          <td style={{ padding: "7px 12px" }}>
                            <span style={{ fontSize: fz - 3, background: groupColor + "15", color: groupColor, padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                              {h?.icon} {d.master}
                            </span>
                          </td>
                          <td style={{ padding: "7px 12px", ...mono, fontSize: 11 }}>{d.hsn}</td>
                          <td style={{ padding: "7px 12px" }}>
                            <span style={{
                              fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10,
                              background: d.behavior === "FIXED" ? "#0078D4" + "18" : A.al,
                              color: d.behavior === "FIXED" ? "#0078D4" : A.a,
                            }}>
                              {d.behavior === "FIXED" ? "🔒 FIXED" : "🔓 SELECT"}
                            </span>
                          </td>
                          <td style={{ padding: "7px 12px" }}>
                            <button onClick={(e) => { e.stopPropagation(); handleToggleActive(d.code); }} style={{
                              width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                              background: d.active === "Yes" ? "#15803D" : M.bBg,
                              position: "relative", transition: "background .2s",
                            }}>
                              <div style={{
                                width: 16, height: 16, borderRadius: 8, background: "#fff",
                                position: "absolute", top: 3,
                                left: d.active === "Yes" ? 21 : 3,
                                transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                              }} />
                            </button>
                          </td>
                          <td style={{ padding: "7px 12px" }}>
                            <button onClick={() => handleEdit(d)} style={{
                              background: "transparent", border: `1px solid ${A.a}30`, borderRadius: 4,
                              color: A.a, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                              fontFamily: uff,
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
              marginTop: 8, padding: "6px 14px", background: M.lo, borderRadius: 6,
              display: "flex", gap: 16, fontSize: 10, color: M.tC, fontWeight: 600,
            }}>
              <span>Total: {data.length}</span>
              <span>Visible: {filtered.length}</span>
              <span>Active: {data.filter(d => d.active === "Yes").length}</span>
              <span>Inactive: {data.filter(d => d.active === "No").length}</span>
              <span style={{ marginLeft: "auto", ...mono, fontSize: 9 }}>ITEM_CATEGORIES • FILE 1A</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
