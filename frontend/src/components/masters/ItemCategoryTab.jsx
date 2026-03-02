import { useState, useMemo, useCallback } from 'react';
import api from '../../services/api';

// ═══════════════════════════════════════════════════════════════
// ITEM CATEGORY TAB — Full-featured UI for ITEM_CATEGORIES sheet
// 4-Tab Workspace: Records, Data Entry, Tree View, Field Specs
// Sorting, filtering, delete, inline edit, stats, status bar
// ═══════════════════════════════════════════════════════════════

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

// ─── Full seed data ───
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

function Toasts({ toasts }) {
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
          <span>{t.color === "#BE123C" || t.color === "#ef4444" ? "✕" : "✓"}</span> {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Column schema definition for records table ───
const TABLE_COLS = [
  { key: "code",     label: "Code",        w: "100px", mono: true,  sortable: true },
  { key: "l1",       label: "L1 Division",  w: "140px", sortable: true },
  { key: "l2",       label: "L2 Type",      w: "140px", sortable: true },
  { key: "l3",       label: "L3 Style",     w: "1fr",   sortable: true },
  { key: "master",   label: "Master",       w: "110px", sortable: true },
  { key: "hsn",      label: "HSN",          w: "70px",  mono: true, sortable: true },
  { key: "behavior", label: "Behavior",     w: "90px",  sortable: true },
  { key: "active",   label: "Active",       w: "70px",  sortable: true },
];

// ─── Field specs schema for field specs tab ───
const FIELD_SPECS = [
  { col: "A", key: "code",     label: "Category Code",  fieldType: "autocode", required: false, auto: true,  hint: "Auto-generated code (CAT-001 to CAT-999). Sequential within master range.", fk: null, ico: "#" },
  { col: "B", key: "l1",       label: "L1 Division",    fieldType: "dropdown", required: true,  auto: false, hint: "Top-level classification. FIXED for RM/TRIM/CONSUMABLE/PACKAGING. SELECTABLE for ARTICLE.", fk: null, ico: "⚠" },
  { col: "C", key: "l2",       label: "L2 Type",        fieldType: "dropdown", required: true,  auto: false, hint: "Sub-classification under L1. Cascading from L1 selection.", fk: null, ico: "⚠" },
  { col: "D", key: "l3",       label: "L3 Style",       fieldType: "dropdown", required: true,  auto: false, hint: "Specific item style under L2. Cascading from L2 selection.", fk: null, ico: "⚠" },
  { col: "E", key: "master",   label: "Item Master",    fieldType: "dropdown", required: true,  auto: false, hint: "Which master sheet this category belongs to (ARTICLE, RM-FABRIC, etc.).", fk: null, ico: "→" },
  { col: "F", key: "hsn",      label: "Default HSN",    fieldType: "text",     required: false, auto: false, hint: "HSN/SAC code auto-filled from L2. Can be overridden manually.", fk: "hsn_master", ico: "←" },
  { col: "G", key: "behavior", label: "L1 Behavior",    fieldType: "auto",     required: false, auto: true,  hint: "FIXED or SELECTABLE, determined by the selected master.", fk: null, ico: "←" },
  { col: "H", key: "active",   label: "Active",         fieldType: "dropdown", required: false, auto: false, hint: "Whether this category is active (Yes) or inactive (No).", fk: null, ico: "_" },
  { col: "I", key: "remarks",  label: "Remarks",        fieldType: "textarea", required: false, auto: false, hint: "Optional notes about this category entry.", fk: null, ico: "_" },
];

// ─── Tab definitions ───
const MAIN_TABS = [
  { id: "records", label: "Records",     icon: "📊" },
  { id: "entry",   label: "Data Entry",  icon: "✍" },
  { id: "tree",    label: "Tree View",   icon: "🌳" },
  { id: "specs",   label: "Field Specs", icon: "📋" },
];

// ─── DtBadge for field specs ───
const DT_MAP = {
  autocode: { bg: "#ede9fe", tx: "#6d28d9", bd: "#c4b5fd" },
  auto:     { bg: "#f0fdf4", tx: "#166534", bd: "#bbf7d0" },
  dropdown: { bg: "#f0f9ff", tx: "#0369a1", bd: "#bae6fd" },
  text:     { bg: "#fafafa", tx: "#374151", bd: "#e5e7eb" },
  textarea: { bg: "#fafafa", tx: "#374151", bd: "#e5e7eb" },
};
const DT_LABEL = { autocode: "AUTO #", auto: "Auto", dropdown: "Dropdown", text: "Text", textarea: "Text Area" };
function DtBadge({ type }) {
  const d = DT_MAP[type] || DT_MAP.text;
  return (
    <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: 3, background: d.bg, color: d.tx, border: "1px solid " + d.bd, fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>
      {DT_LABEL[type] || type}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ItemCategoryTab({ M, A, uff, dff }) {
  const { toasts, add: showToast } = useToast();

  // ── Data state ──
  const [data, setData] = useState(SEED_DATA);

  // ── Tab state ──
  const [mainTab, setMainTab] = useState("records");
  const [entryMode, setEntryMode] = useState("form");

  // ── Records state ──
  const [search, setSearch] = useState("");
  const [filterMaster, setFilterMaster] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");
  const [filterBehavior, setFilterBehavior] = useState("ALL");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"
  const [editPanel, setEditPanel] = useState(null); // row being edited in panel
  const [editForm, setEditForm] = useState({});

  // ── Data Entry state ──
  const [form, setForm] = useState({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" });
  const [formErrors, setFormErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Custom hierarchy additions (session-level; persists until page reload) ──
  // Structure: { [master]: { l1: [], l2: { [l1Val]: [] }, l3: { [l2Val]: [] } } }
  const [extraOpts, setExtraOpts] = useState({});
  const [addingLevel, setAddingLevel] = useState(null);  // 'l1' | 'l2' | 'l3' | null (entry form)
  const [newOptVal, setNewOptVal]   = useState('');
  const [editAddingLevel, setEditAddingLevel] = useState(null); // same for edit panel
  const [editNewOptVal, setEditNewOptVal]     = useState('');

  // ── Field Specs state ──
  const [specsSearch, setSpecsSearch] = useState("");
  const [specsFilter, setSpecsFilter] = useState("All Fields");
  const [expandedSpec, setExpandedSpec] = useState(null);

  // ── Hierarchy helpers ──
  const hierarchy = form.master ? CATEGORY_HIERARCHY[form.master] : null;
  const editHierarchy = editForm.master ? CATEGORY_HIERARCHY[editForm.master] : null;

  // ── Stats ──
  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter(d => d.active === "Yes").length,
    inactive: data.filter(d => d.active === "No").length,
    fixed: data.filter(d => d.behavior === "FIXED").length,
    selectable: data.filter(d => d.behavior === "SELECTABLE").length,
    masters: [...new Set(data.map(d => d.master))].length,
  }), [data]);

  // ── Next code generator ──
  const nextCode = useMemo(() => {
    const nums = data.map(d => parseInt(d.code.replace("CAT-", ""), 10)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `CAT-${String(max + 1).padStart(3, "0")}`;
  }, [data]);

  // ── Cascading dropdown helpers (Data Entry) ──
  const setMaster = (v) => {
    const h = CATEGORY_HIERARCHY[v];
    setForm({ master: v, l1: h?.l1Behavior === "FIXED" ? h.l1Fixed : "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" });
    setFormErrors({});
    setIsDirty(true);
  };
  const setL1 = (v) => { setForm(f => ({ ...f, l1: v, l2: "", l3: "", hsn: "" })); setFormErrors({}); setIsDirty(true); };
  const setL2 = (v) => {
    const hsn = hierarchy?.defaultHSN?.[v] || "";
    setForm(f => ({ ...f, l2: v, l3: "", hsn }));
    setFormErrors({});
    setIsDirty(true);
  };
  const setL3 = (v) => { setForm(f => ({ ...f, l3: v })); setIsDirty(true); };

  // ── Shared: push a new option into extraOpts ──
  const _pushExtra = (master, level, parentKey, val) => {
    setExtraOpts(prev => {
      const m = { l1: [], l2: {}, l3: {}, ...(prev[master] || {}) };
      if (level === 'l1') {
        if (!m.l1.includes(val)) m.l1 = [...m.l1, val];
      } else if (level === 'l2') {
        const existing = m.l2[parentKey] || [];
        if (!existing.includes(val)) m.l2 = { ...m.l2, [parentKey]: [...existing, val] };
      } else {
        const existing = m.l3[parentKey] || [];
        if (!existing.includes(val)) m.l3 = { ...m.l3, [parentKey]: [...existing, val] };
      }
      return { ...prev, [master]: m };
    });
  };

  // ── Entry form: confirm adding a new option ──
  const confirmAddLevel = (level) => {
    const val = newOptVal.trim();
    if (!val || !form.master) { setAddingLevel(null); setNewOptVal(''); return; }
    _pushExtra(form.master, level, level === 'l2' ? form.l1 : form.l2, val);
    if      (level === 'l1') setL1(val);
    else if (level === 'l2') setL2(val);
    else                     setL3(val);
    setAddingLevel(null);
    setNewOptVal('');
  };

  // ── Edit panel: confirm adding a new option ──
  const confirmEditAddLevel = (level) => {
    const val = editNewOptVal.trim();
    if (!val || !editForm.master) { setEditAddingLevel(null); setEditNewOptVal(''); return; }
    _pushExtra(editForm.master, level, level === 'l2' ? editForm.l1 : editForm.l2, val);
    if (level === 'l1') {
      setEditForm(f => ({ ...f, l1: val, l2: '', l3: '', hsn: '' }));
    } else if (level === 'l2') {
      const hsn = editHierarchy?.defaultHSN?.[val] || '';
      setEditForm(f => ({ ...f, l2: val, l3: '', hsn }));
    } else {
      setEditForm(f => ({ ...f, l3: val }));
    }
    setEditAddingLevel(null);
    setEditNewOptVal('');
  };

  // Merge base hierarchy options with any user-added extras for this session
  const masterExtra     = form.master     ? (extraOpts[form.master]     || {}) : {};
  const editMasterExtra = editForm.master ? (extraOpts[editForm.master] || {}) : {};

  const l1Opts = hierarchy ? [
    ...(hierarchy.l1Behavior === "FIXED" ? [hierarchy.l1Fixed] : hierarchy.l1Options),
    ...(masterExtra.l1 || []),
  ] : [];
  const l2Opts = hierarchy && form.l1 ? [
    ...(hierarchy.l2Options[form.l1] || []),
    ...((masterExtra.l2 || {})[form.l1] || []),
  ] : [];
  const l3Opts = hierarchy && form.l2 ? [
    ...(hierarchy.l3Options[form.l2] || []),
    ...((masterExtra.l3 || {})[form.l2] || []),
  ] : [];

  // ── Edit panel dropdown options (also merged with extras) ──
  const editL1Opts = editHierarchy ? [
    ...(editHierarchy.l1Behavior === "FIXED" ? [editHierarchy.l1Fixed] : editHierarchy.l1Options),
    ...(editMasterExtra.l1 || []),
  ] : [];
  const editL2Opts = editHierarchy && editForm.l1 ? [
    ...(editHierarchy.l2Options[editForm.l1] || []),
    ...((editMasterExtra.l2 || {})[editForm.l1] || []),
  ] : [];
  const editL3Opts = editHierarchy && editForm.l2 ? [
    ...(editHierarchy.l3Options[editForm.l2] || []),
    ...((editMasterExtra.l3 || {})[editForm.l2] || []),
  ] : [];

  // ─── FILTERING + SORTING ───
  const filtered = useMemo(() => {
    let result = data.filter(d => {
      if (filterMaster !== "ALL" && d.master !== filterMaster) return false;
      if (filterActive !== "ALL" && d.active !== filterActive) return false;
      if (filterBehavior !== "ALL" && d.behavior !== filterBehavior) return false;
      if (search) {
        const s = search.toLowerCase();
        return [d.code, d.l1, d.l2, d.l3, d.master, d.hsn, d.remarks].some(v => v?.toLowerCase().includes(s));
      }
      return true;
    });
    if (sortCol) {
      result = [...result].sort((a, b) => {
        const va = (a[sortCol] || "").toLowerCase();
        const vb = (b[sortCol] || "").toLowerCase();
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, filterMaster, filterActive, filterBehavior, search, sortCol, sortDir]);

  // ── Sort handler ──
  const handleSort = (col) => {
    if (sortCol === col) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortCol(null); setSortDir("asc"); }
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  // ── Tree Data ──
  const treeData = useMemo(() => {
    const tree = {};
    data.forEach(d => {
      if (!tree[d.l1]) tree[d.l1] = {};
      if (!tree[d.l1][d.l2]) tree[d.l1][d.l2] = [];
      tree[d.l1][d.l2].push(d);
    });
    return tree;
  }, [data]);

  // ── Data Entry: Save ──
  const handleEntrySave = async () => {
    const errs = {};
    if (!form.master) errs.master = "Required";
    if (!form.l1) errs.l1 = "Required";
    if (!form.l2) errs.l2 = "Required";
    if (!form.l3) errs.l3 = "Required";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const dup = data.find(d => d.l1 === form.l1 && d.l2 === form.l2 && d.l3 === form.l3 && d.master === form.master);
    if (dup) {
      showToast(`Duplicate: ${dup.code} already has this combination`, "#BE123C");
      return;
    }
    setSaving(true);
    const newItem = { code: nextCode, ...form, behavior: hierarchy.l1Behavior };
    setData(prev => [...prev, newItem]);
    showToast(`Created ${nextCode}`);
    try { await api.createCategory(newItem); } catch {}
    setForm({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" });
    setFormErrors({});
    setIsDirty(false);
    setSaving(false);
  };

  // ── Data Entry: Clear ──
  const handleEntryClear = () => {
    setForm({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" });
    setFormErrors({});
    setIsDirty(false);
  };

  // ── Records: Open Edit Panel ──
  const openEditPanel = (row) => {
    setEditPanel(row);
    setEditForm({ master: row.master, l1: row.l1, l2: row.l2, l3: row.l3, hsn: row.hsn, active: row.active, remarks: row.remarks });
  };

  // ── Records: Save Edit ──
  const handleEditSave = async () => {
    if (!editPanel) return;
    const errs = {};
    if (!editForm.master) errs.master = "Required";
    if (!editForm.l1) errs.l1 = "Required";
    if (!editForm.l2) errs.l2 = "Required";
    if (!editForm.l3) errs.l3 = "Required";
    if (Object.keys(errs).length) return;
    const dup = data.find(d => d.l1 === editForm.l1 && d.l2 === editForm.l2 && d.l3 === editForm.l3 && d.master === editForm.master && d.code !== editPanel.code);
    if (dup) {
      showToast(`Duplicate: ${dup.code} already exists`, "#BE123C");
      return;
    }
    setSaving(true);
    setData(prev => prev.map(d => d.code === editPanel.code ? { ...d, ...editForm, behavior: editHierarchy.l1Behavior } : d));
    showToast(`Updated ${editPanel.code}`, A.a);
    try { await api.updateCategory(editPanel.code, { ...editForm, behavior: editHierarchy.l1Behavior }); } catch {}
    setEditPanel(null);
    setEditForm({});
    setSaving(false);
  };

  // ── Records: Delete ──
  const handleDelete = (row) => {
    if (!confirm(`Delete category ${row.code}?\n${row.l1} > ${row.l2} > ${row.l3}`)) return;
    setData(prev => prev.filter(d => d.code !== row.code));
    showToast(`Deleted ${row.code}`, "#ef4444");
    if (editPanel?.code === row.code) { setEditPanel(null); setEditForm({}); }
  };

  // ── Records: Toggle Active ──
  const handleToggleActive = (code) => {
    setData(prev => prev.map(d => d.code === code ? { ...d, active: d.active === "Yes" ? "No" : "Yes" } : d));
  };

  // ── Clear filters ──
  const clearFilters = () => {
    setSearch("");
    setFilterMaster("ALL");
    setFilterActive("ALL");
    setFilterBehavior("ALL");
    setSortCol(null);
    setSortDir("asc");
  };
  const hasFilters = search || filterMaster !== "ALL" || filterActive !== "ALL" || filterBehavior !== "ALL" || sortCol;

  // ── Shared styles ──
  const inp = (err) => ({
    width: "100%", padding: "8px 12px", borderRadius: 6,
    border: `1px solid ${err ? "#BE123C" : M.inputBd}`,
    background: M.inputBg, color: M.textA, fontFamily: uff, fontSize: 12,
    outline: "none", boxSizing: "border-box",
  });
  const lbl = { display: "block", fontSize: 9, fontWeight: 900, color: M.textC, marginBottom: 4, fontFamily: uff, letterSpacing: .5, textTransform: "uppercase" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: uff, color: M.textA }}>
      <style>{`
        @keyframes catSlideIn { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes catFadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideR { from { transform:translateX(100%); } to { transform:translateX(0); } }
      `}</style>
      <Toasts toasts={toasts} />

      {/* ═══ HEADER ═══ */}
      <div style={{ padding: "10px 16px 0", background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16 }}>🗂</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: M.textA, fontFamily: uff }}>Item Categories</span>
          <span style={{ background: A.al, border: `1px solid ${A.a}40`, color: A.a, borderRadius: 4, padding: "2px 9px", fontSize: 10, fontWeight: 900, fontFamily: dff }}>9 COLS</span>
          <span style={{ fontSize: 10, color: M.textC, fontFamily: uff }}>3-Level Category Hierarchy (L1 › L2 › L3)</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
            {[
              { l: "TOTAL", v: stats.total, c: M.textB },
              { l: "ACTIVE", v: stats.active, c: "#15803d" },
              { l: "FIXED", v: stats.fixed, c: "#0078D4" },
              { l: "SELECT", v: stats.selectable, c: "#E8690A" },
              { l: "MASTERS", v: stats.masters, c: "#7C3AED" },
            ].map(s => (
              <div key={s.l} style={{ background: M.surfLow || M.bg, border: `1px solid ${M.divider}`, borderRadius: 5, padding: "3px 8px", textAlign: "center", minWidth: 36 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: s.c, fontFamily: dff }}>{s.v}</div>
                <div style={{ fontSize: 7, fontWeight: 900, color: M.textD, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: uff }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
          {MAIN_TABS.map(t => {
            const active = mainTab === t.id;
            return (
              <button key={t.id} onClick={() => setMainTab(t.id)} style={{
                padding: "8px 18px", border: "none", cursor: "pointer",
                background: active ? M.surfHigh : M.surfLow || M.bg,
                borderTop: `2px solid ${active ? A.a : "transparent"}`,
                borderRight: `1px solid ${active ? M.divider : "transparent"}`,
                borderLeft: `1px solid ${active ? M.divider : "transparent"}`,
                borderBottom: `1px solid ${active ? M.surfHigh : M.divider}`,
                marginBottom: active ? -1 : 0, borderRadius: "5px 5px 0 0",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 11, fontWeight: active ? 900 : 700, color: active ? A.a : M.textC, fontFamily: uff }}>{t.icon} {t.label}</span>
                {t.id === "entry" && isDirty && <span style={{ background: "#f59e0b", width: 6, height: 6, borderRadius: "50%" }} />}
                {t.id === "records" && (
                  <span style={{ background: active ? A.a : M.surfMid, color: active ? "#fff" : M.textD, borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 900 }}>
                    {data.length}
                  </span>
                )}
                {t.id === "specs" && (
                  <span style={{ background: active ? A.a : M.surfMid, color: active ? "#fff" : M.textD, borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 900 }}>
                    {FIELD_SPECS.length}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, paddingBottom: 6, paddingRight: 2 }}>
            {mainTab === "entry" && (
              <div style={{ display: "flex", background: M.surfLow || M.bg, border: `1px solid ${M.inputBd}`, borderRadius: 5, overflow: "hidden" }}>
                {[{ id: "form", label: "📋 Form" }, { id: "inline", label: "⚡ Inline" }].map(v => (
                  <button key={v.id} onClick={() => setEntryMode(v.id)} style={{
                    padding: "4px 12px", border: "none", cursor: "pointer", fontSize: 9.5,
                    fontWeight: entryMode === v.id ? 900 : 700,
                    background: entryMode === v.id ? A.a : M.surfLow || M.bg,
                    color: entryMode === v.id ? "#fff" : M.textC,
                    fontFamily: uff, transition: "all .15s",
                  }}>{v.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ════════════ RECORDS TAB ════════════ */}
        {mainTab === "records" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{ background: M.surfMid, borderBottom: `1px solid ${M.divider}`, padding: "0 16px", display: "flex", alignItems: "center", gap: 8, height: 44, flexShrink: 0, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.5, fontFamily: uff }}>📊 RECORDS</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: M.surfHigh, color: M.textC, fontFamily: dff }}>
                {filtered.length} of {data.length}
              </span>
              <div style={{ width: 1, height: 18, background: M.divider }} />
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: M.textD }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..."
                  style={{ padding: "6px 10px 6px 28px", border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontFamily: uff, width: 180, outline: "none", color: M.textA, background: M.inputBg }} />
              </div>
              <select value={filterMaster} onChange={e => setFilterMaster(e.target.value)}
                style={{ padding: "5px 8px", border: `1px solid ${M.divider}`, borderRadius: 6, fontSize: 10, fontFamily: uff, background: M.inputBg, color: M.textA, cursor: "pointer" }}>
                <option value="ALL">All Masters</option>
                {MASTER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
                style={{ padding: "5px 8px", border: `1px solid ${M.divider}`, borderRadius: 6, fontSize: 10, fontFamily: uff, background: M.inputBg, color: M.textA, cursor: "pointer" }}>
                <option value="ALL">All Status</option>
                <option value="Yes">Active</option>
                <option value="No">Inactive</option>
              </select>
              <select value={filterBehavior} onChange={e => setFilterBehavior(e.target.value)}
                style={{ padding: "5px 8px", border: `1px solid ${M.divider}`, borderRadius: 6, fontSize: 10, fontFamily: uff, background: M.inputBg, color: M.textA, cursor: "pointer" }}>
                <option value="ALL">All Behavior</option>
                <option value="FIXED">Fixed</option>
                <option value="SELECTABLE">Selectable</option>
              </select>
              {hasFilters && (
                <button onClick={clearFilters} style={{ padding: "4px 10px", border: `1px solid #ef4444`, borderRadius: 5, background: "#fef2f2", color: "#ef4444", fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>
                  ✕ Clear Filters
                </button>
              )}
              <div style={{ flex: 1 }} />
              {sortCol && (
                <span style={{ fontSize: 9, color: A.a, fontWeight: 800, fontFamily: uff }}>
                  Sort: {TABLE_COLS.find(c => c.key === sortCol)?.label} {sortDir === "asc" ? "↑" : "↓"}
                </span>
              )}
              <button onClick={() => { setEditPanel(null); setMainTab("entry"); }}
                style={{ padding: "6px 16px", background: A.a, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: uff }}>
                + Add New
              </button>
            </div>

            {/* Table + Edit panel */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Table area */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                <div style={{ background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 8, overflow: "hidden" }}>
                  {/* Header row */}
                  <div style={{ display: "grid", gridTemplateColumns: TABLE_COLS.map(c => c.w).join(" ") + " 100px", padding: "0 16px", background: M.surfMid, borderBottom: `2px solid ${M.divider}`, gap: 8 }}>
                    {TABLE_COLS.map(c => (
                      <div key={c.key}
                        onClick={() => c.sortable && handleSort(c.key)}
                        style={{
                          padding: "8px 0", fontSize: 9, fontWeight: 900, color: sortCol === c.key ? A.a : M.textB,
                          textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff,
                          cursor: c.sortable ? "pointer" : "default", userSelect: "none",
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                        {c.label}
                        {c.sortable && (
                          <span style={{ fontSize: 8, color: sortCol === c.key ? A.a : M.textD }}>
                            {sortCol === c.key ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                          </span>
                        )}
                      </div>
                    ))}
                    <div style={{ padding: "8px 0", fontSize: 9, fontWeight: 900, color: M.textB, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>Actions</div>
                  </div>
                  {/* Data rows */}
                  {filtered.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center", color: M.textD, fontSize: 12, fontFamily: uff }}>
                      {data.length === 0 ? "No categories yet." : `No results matching filters`}
                    </div>
                  ) : filtered.map((d, i) => {
                    const h = CATEGORY_HIERARCHY[d.master];
                    const groupColor = h?.color || M.textC;
                    const isSelected = editPanel?.code === d.code;
                    const rowBg = isSelected ? A.al : (i % 2 === 0 ? M.tblEven : M.tblOdd);
                    return (
                      <div key={d.code}
                        style={{
                          display: "grid", gridTemplateColumns: TABLE_COLS.map(c => c.w).join(" ") + " 100px",
                          padding: "0 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${M.bg}` : "none",
                          background: rowBg, gap: 8, alignItems: "center", transition: "background .1s",
                          opacity: d.active === "Yes" ? 1 : .55,
                          borderLeft: isSelected ? `3px solid ${A.a}` : "3px solid transparent",
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = M.hoverBg; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = rowBg; }}
                      >
                        {/* Code */}
                        <div style={{ padding: "8px 0", fontSize: 11, fontWeight: 700, color: groupColor, fontFamily: dff }}>{d.code}</div>
                        {/* L1 */}
                        <div style={{ padding: "8px 0", fontSize: 11, fontWeight: 700, color: M.textA, fontFamily: uff, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.l1}</div>
                        {/* L2 */}
                        <div style={{ padding: "8px 0", fontSize: 11, color: M.textA, fontFamily: uff, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.l2}</div>
                        {/* L3 */}
                        <div style={{ padding: "8px 0", fontSize: 11, fontWeight: 600, color: M.textA, fontFamily: uff, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.l3}</div>
                        {/* Master */}
                        <div style={{ padding: "8px 0" }}>
                          <span style={{ fontSize: 9, background: groupColor + "15", color: groupColor, padding: "2px 7px", borderRadius: 4, fontWeight: 700, fontFamily: uff }}>
                            {h?.icon} {d.master}
                          </span>
                        </div>
                        {/* HSN */}
                        <div style={{ padding: "8px 0", fontSize: 11, color: M.textB, fontFamily: dff }}>{d.hsn}</div>
                        {/* Behavior */}
                        <div style={{ padding: "8px 0" }}>
                          <span style={{
                            fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 10,
                            background: d.behavior === "FIXED" ? "#0078D418" : A.al,
                            color: d.behavior === "FIXED" ? "#0078D4" : A.a,
                          }}>
                            {d.behavior === "FIXED" ? "🔒 FIXED" : "🔓 SELECT"}
                          </span>
                        </div>
                        {/* Active toggle */}
                        <div style={{ padding: "8px 0" }}>
                          <button onClick={(e) => { e.stopPropagation(); handleToggleActive(d.code); }} style={{
                            width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                            background: d.active === "Yes" ? "#15803D" : M.badgeBg,
                            position: "relative", transition: "background .2s",
                          }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: 7, background: "#fff",
                              position: "absolute", top: 3,
                              left: d.active === "Yes" ? 19 : 3,
                              transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                            }} />
                          </button>
                        </div>
                        {/* Actions */}
                        <div style={{ padding: "8px 0", display: "flex", gap: 4 }}>
                          <button onClick={() => openEditPanel(d)}
                            style={{ fontSize: 10, fontWeight: 700, color: A.a, background: A.al, border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: uff }}>Edit</button>
                          <button onClick={() => handleDelete(d)}
                            style={{ fontSize: 10, fontWeight: 700, color: M.textD, background: M.surfMid, border: "none", borderRadius: 4, padding: "3px 6px", cursor: "pointer", fontFamily: uff }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: M.textD, fontFamily: dff }}>
                  SHOWING {filtered.length} OF {data.length} CATEGORIES · ITEM_CATEGORIES · FILE 1A
                </div>
              </div>

              {/* Edit slide panel */}
              {editPanel && (
                <div style={{ width: 380, background: M.surfHigh, borderLeft: `1px solid ${M.divider}`, display: "flex", flexDirection: "column", boxShadow: `-4px 0 24px rgba(0,0,0,0.12)`, flexShrink: 0, animation: "slideR .2s ease" }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>✏️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: uff }}>Edit Category</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: M.textA, fontFamily: uff }}>Edit {editPanel.code}</div>
                    </div>
                    <button onClick={() => { setEditPanel(null); setEditForm({}); }} style={{ background: M.surfMid, border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14, color: M.textB }}>✕</button>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Code (readonly) */}
                    <div>
                      <label style={lbl}>Category Code</label>
                      <div style={{ ...inp(false), background: M.surfMid, color: M.textD, fontFamily: dff, fontWeight: 700 }}>{editPanel.code}</div>
                    </div>
                    {/* Master */}
                    <div>
                      <label style={lbl}>Item Master *</label>
                      <select value={editForm.master || ""} onChange={e => {
                        const v = e.target.value;
                        const h = CATEGORY_HIERARCHY[v];
                        setEditForm({ master: v, l1: h?.l1Behavior === "FIXED" ? h.l1Fixed : "", l2: "", l3: "", hsn: "", active: editForm.active, remarks: editForm.remarks });
                      }} style={{ ...inp(false), cursor: "pointer" }}>
                        <option value="">— Select —</option>
                        {MASTER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                    {editHierarchy && (
                      <>
                        {/* L1 */}
                        <div>
                          <label style={lbl}>L1 Division *</label>
                          {editHierarchy.l1Behavior === "FIXED" ? (
                            <div style={{ ...inp(false), background: A.al, color: A.a, fontWeight: 700 }}>🔒 {editHierarchy.l1Fixed}</div>
                          ) : (
                            <>
                              <select value={editForm.l1 || ""} onChange={e => e.target.value === '__NEW__' ? (setEditAddingLevel('l1'), setEditNewOptVal('')) : setEditForm(f => ({ ...f, l1: e.target.value, l2: "", l3: "", hsn: "" }))} style={{ ...inp(false), cursor: "pointer" }}>
                                <option value="">— Select L1 —</option>
                                {editL1Opts.map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="__NEW__">➕ Add new L1...</option>
                              </select>
                              {editAddingLevel === 'l1' && (
                                <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                                  <input autoFocus value={editNewOptVal} onChange={e => setEditNewOptVal(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') confirmEditAddLevel('l1'); if (e.key === 'Escape') { setEditAddingLevel(null); setEditNewOptVal(''); } }}
                                    placeholder="Type new L1 value..." style={{ flex: 1, padding: "5px 8px", border: `1px solid ${A.a}`, borderRadius: 5, fontSize: 11, fontFamily: uff, outline: "none", color: M.textA, background: M.inputBg }} />
                                  <button onClick={() => confirmEditAddLevel('l1')} style={{ padding: "5px 10px", background: A.a, border: "none", borderRadius: 5, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>✓</button>
                                  <button onClick={() => { setEditAddingLevel(null); setEditNewOptVal(''); }} style={{ padding: "5px 8px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 5, color: M.textB, fontSize: 11, cursor: "pointer" }}>✕</button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {/* L2 */}
                        <div>
                          <label style={lbl}>L2 Type *</label>
                          <select value={editForm.l2 || ""} onChange={e => {
                            if (e.target.value === '__NEW__') { setEditAddingLevel('l2'); setEditNewOptVal(''); return; }
                            const v = e.target.value;
                            const hsn = editHierarchy?.defaultHSN?.[v] || "";
                            setEditForm(f => ({ ...f, l2: v, l3: "", hsn }));
                          }} disabled={!editForm.l1} style={{ ...inp(false), cursor: "pointer", opacity: editForm.l1 ? 1 : .4 }}>
                            <option value="">— Select L2 —</option>
                            {editL2Opts.map(o => <option key={o} value={o}>{o}</option>)}
                            {editForm.l1 && <option value="__NEW__">➕ Add new L2...</option>}
                          </select>
                          {editAddingLevel === 'l2' && (
                            <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                              <input autoFocus value={editNewOptVal} onChange={e => setEditNewOptVal(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') confirmEditAddLevel('l2'); if (e.key === 'Escape') { setEditAddingLevel(null); setEditNewOptVal(''); } }}
                                placeholder="Type new L2 value..." style={{ flex: 1, padding: "5px 8px", border: `1px solid ${A.a}`, borderRadius: 5, fontSize: 11, fontFamily: uff, outline: "none", color: M.textA, background: M.inputBg }} />
                              <button onClick={() => confirmEditAddLevel('l2')} style={{ padding: "5px 10px", background: A.a, border: "none", borderRadius: 5, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>✓</button>
                              <button onClick={() => { setEditAddingLevel(null); setEditNewOptVal(''); }} style={{ padding: "5px 8px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 5, color: M.textB, fontSize: 11, cursor: "pointer" }}>✕</button>
                            </div>
                          )}
                        </div>
                        {/* L3 */}
                        <div>
                          <label style={lbl}>L3 Style *</label>
                          <select value={editForm.l3 || ""} onChange={e => e.target.value === '__NEW__' ? (setEditAddingLevel('l3'), setEditNewOptVal('')) : setEditForm(f => ({ ...f, l3: e.target.value }))}
                            disabled={!editForm.l2} style={{ ...inp(false), cursor: "pointer", opacity: editForm.l2 ? 1 : .4 }}>
                            <option value="">— Select L3 —</option>
                            {editL3Opts.map(o => <option key={o} value={o}>{o}</option>)}
                            {editForm.l2 && <option value="__NEW__">➕ Add new L3...</option>}
                          </select>
                          {editAddingLevel === 'l3' && (
                            <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                              <input autoFocus value={editNewOptVal} onChange={e => setEditNewOptVal(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') confirmEditAddLevel('l3'); if (e.key === 'Escape') { setEditAddingLevel(null); setEditNewOptVal(''); } }}
                                placeholder="Type new L3 value..." style={{ flex: 1, padding: "5px 8px", border: `1px solid ${A.a}`, borderRadius: 5, fontSize: 11, fontFamily: uff, outline: "none", color: M.textA, background: M.inputBg }} />
                              <button onClick={() => confirmEditAddLevel('l3')} style={{ padding: "5px 10px", background: A.a, border: "none", borderRadius: 5, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>✓</button>
                              <button onClick={() => { setEditAddingLevel(null); setEditNewOptVal(''); }} style={{ padding: "5px 8px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 5, color: M.textB, fontSize: 11, cursor: "pointer" }}>✕</button>
                            </div>
                          )}
                        </div>
                        {/* HSN */}
                        <div>
                          <label style={lbl}>Default HSN Code</label>
                          <input value={editForm.hsn || ""} onChange={e => setEditForm(f => ({ ...f, hsn: e.target.value }))} style={{ ...inp(false), fontFamily: dff }} placeholder="Auto from L2" />
                        </div>
                        {/* Active */}
                        <div>
                          <label style={lbl}>Active</label>
                          <select value={editForm.active || "Yes"} onChange={e => setEditForm(f => ({ ...f, active: e.target.value }))} style={{ ...inp(false), cursor: "pointer" }}>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        {/* Remarks */}
                        <div>
                          <label style={lbl}>Remarks</label>
                          <textarea rows={3} value={editForm.remarks || ""} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))} style={{ ...inp(false), resize: "vertical", minHeight: 60 }} placeholder="Optional notes" />
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ padding: "14px 20px", borderTop: `1px solid ${M.divider}`, display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditPanel(null); setEditForm({}); }}
                      style={{ flex: 1, padding: "9px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: M.textB, cursor: "pointer", fontFamily: uff }}>Cancel</button>
                    <button onClick={handleEditSave} disabled={saving}
                      style={{ flex: 2, padding: "9px", background: saving ? M.textD : A.a, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 900, color: "#fff", cursor: saving ? "default" : "pointer", fontFamily: uff }}>
                      {saving ? "Saving..." : "Update Category"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════ DATA ENTRY TAB ════════════ */}
        {mainTab === "entry" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {entryMode === "form" ? (
                /* ── Form View ── */
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, animation: "catFadeIn .25s ease" }}>
                  {/* Section: Identity */}
                  <EntrySection title="Identity" icon="🔑" fieldCount={2} M={M} A={A} uff={uff} defaultOpen>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
                      <div>
                        <FieldLabel col="A" label="Category Code" type="autocode" required={false} M={M} A={A} uff={uff} dff={dff} />
                        <div style={{ ...inp(false), background: A.al, color: A.a, fontFamily: dff, fontWeight: 700, border: `1px solid ${A.a}30` }}>
                          {nextCode} <span style={{ fontSize: 9, color: M.textD, fontWeight: 500 }}>(auto)</span>
                        </div>
                      </div>
                      <div>
                        <FieldLabel col="E" label="Item Master" type="dropdown" required M={M} A={A} uff={uff} dff={dff} />
                        <select value={form.master} onChange={e => setMaster(e.target.value)}
                          style={{ ...inp(!!formErrors.master), cursor: "pointer" }}>
                          <option value="">— Select Master —</option>
                          {MASTER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                        {formErrors.master && <div style={{ fontSize: 9, color: "#ef4444", marginTop: 2, fontWeight: 700, fontFamily: uff }}>{formErrors.master}</div>}
                      </div>
                    </div>
                  </EntrySection>

                  {/* Section: Hierarchy */}
                  <EntrySection title="Category Hierarchy" icon="📂" fieldCount={form.master ? 3 : 0} M={M} A={A} uff={uff} defaultOpen>
                    {!form.master ? (
                      <div style={{ padding: 16, textAlign: "center", color: M.textD, fontSize: 11, fontFamily: uff }}>
                        Select an Item Master above to unlock hierarchy fields
                      </div>
                    ) : (
                      <>
                        {/* L1 Behavior badge */}
                        <div style={{
                          padding: "8px 14px", borderRadius: 6, marginBottom: 12, fontSize: 11, fontWeight: 700,
                          background: hierarchy.l1Behavior === "FIXED" ? "#0078D415" : A.al,
                          color: hierarchy.l1Behavior === "FIXED" ? "#0078D4" : A.a,
                          border: `1px solid ${hierarchy.l1Behavior === "FIXED" ? "#0078D430" : A.a + "30"}`,
                          display: "flex", alignItems: "center", gap: 8,
                        }}>
                          {hierarchy.l1Behavior === "FIXED"
                            ? <><span>🔒</span> L1 auto-fixed to <strong style={{ marginLeft: 4 }}>"{hierarchy.l1Fixed}"</strong></>
                            : <><span>🔓</span> L1 is <strong>SELECTABLE</strong> — pick the division below</>
                          }
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
                          <div>
                            <FieldLabel col="B" label="L1 Division" type="dropdown" required M={M} A={A} uff={uff} dff={dff} />
                            {hierarchy.l1Behavior === "FIXED" ? (
                              <div style={{ ...inp(false), background: A.al, color: A.a, fontWeight: 700, border: `1px solid ${A.a}30`, display: "flex", alignItems: "center", gap: 6 }}>
                                🔒 {hierarchy.l1Fixed}
                              </div>
                            ) : (
                              <>
                                <select value={form.l1} onChange={e => e.target.value === '__NEW__' ? (setAddingLevel('l1'), setNewOptVal('')) : setL1(e.target.value)} style={{ ...inp(!!formErrors.l1), cursor: "pointer" }}>
                                  <option value="">— Select L1 —</option>
                                  {l1Opts.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="__NEW__">➕ Add new L1...</option>
                                </select>
                                {addingLevel === 'l1' && (
                                  <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                                    <input autoFocus value={newOptVal} onChange={e => setNewOptVal(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') confirmAddLevel('l1'); if (e.key === 'Escape') { setAddingLevel(null); setNewOptVal(''); } }}
                                      placeholder="Type new L1 value..." style={{ flex: 1, padding: "5px 8px", border: `1px solid ${A.a}`, borderRadius: 5, fontSize: 11, fontFamily: uff, outline: "none", color: M.textA, background: M.inputBg }} />
                                    <button onClick={() => confirmAddLevel('l1')} style={{ padding: "5px 10px", background: A.a, border: "none", borderRadius: 5, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>✓</button>
                                    <button onClick={() => { setAddingLevel(null); setNewOptVal(''); }} style={{ padding: "5px 8px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 5, color: M.textB, fontSize: 11, cursor: "pointer" }}>✕</button>
                                  </div>
                                )}
                              </>
                            )}
                            {formErrors.l1 && <div style={{ fontSize: 9, color: "#ef4444", marginTop: 2, fontWeight: 700, fontFamily: uff }}>{formErrors.l1}</div>}
                          </div>
                          <div>
                            <FieldLabel col="C" label="L2 Type" type="dropdown" required M={M} A={A} uff={uff} dff={dff} />
                            <select value={form.l2} onChange={e => e.target.value === '__NEW__' ? (setAddingLevel('l2'), setNewOptVal('')) : setL2(e.target.value)}
                              disabled={!form.l1} style={{ ...inp(!!formErrors.l2), cursor: "pointer", opacity: form.l1 ? 1 : .4 }}>
                              <option value="">— Select L2 —</option>
                              {l2Opts.map(o => <option key={o} value={o}>{o}</option>)}
                              {form.l1 && <option value="__NEW__">➕ Add new L2...</option>}
                            </select>
                            {addingLevel === 'l2' && (
                              <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                                <input autoFocus value={newOptVal} onChange={e => setNewOptVal(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') confirmAddLevel('l2'); if (e.key === 'Escape') { setAddingLevel(null); setNewOptVal(''); } }}
                                  placeholder="Type new L2 value..." style={{ flex: 1, padding: "5px 8px", border: `1px solid ${A.a}`, borderRadius: 5, fontSize: 11, fontFamily: uff, outline: "none", color: M.textA, background: M.inputBg }} />
                                <button onClick={() => confirmAddLevel('l2')} style={{ padding: "5px 10px", background: A.a, border: "none", borderRadius: 5, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>✓</button>
                                <button onClick={() => { setAddingLevel(null); setNewOptVal(''); }} style={{ padding: "5px 8px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 5, color: M.textB, fontSize: 11, cursor: "pointer" }}>✕</button>
                              </div>
                            )}
                            {formErrors.l2 && <div style={{ fontSize: 9, color: "#ef4444", marginTop: 2, fontWeight: 700, fontFamily: uff }}>{formErrors.l2}</div>}
                          </div>
                          <div>
                            <FieldLabel col="D" label="L3 Style" type="dropdown" required M={M} A={A} uff={uff} dff={dff} />
                            <select value={form.l3} onChange={e => e.target.value === '__NEW__' ? (setAddingLevel('l3'), setNewOptVal('')) : setL3(e.target.value)}
                              disabled={!form.l2} style={{ ...inp(!!formErrors.l3), cursor: "pointer", opacity: form.l2 ? 1 : .4 }}>
                              <option value="">— Select L3 —</option>
                              {l3Opts.map(o => <option key={o} value={o}>{o}</option>)}
                              {form.l2 && <option value="__NEW__">➕ Add new L3...</option>}
                            </select>
                            {addingLevel === 'l3' && (
                              <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                                <input autoFocus value={newOptVal} onChange={e => setNewOptVal(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') confirmAddLevel('l3'); if (e.key === 'Escape') { setAddingLevel(null); setNewOptVal(''); } }}
                                  placeholder="Type new L3 value..." style={{ flex: 1, padding: "5px 8px", border: `1px solid ${A.a}`, borderRadius: 5, fontSize: 11, fontFamily: uff, outline: "none", color: M.textA, background: M.inputBg }} />
                                <button onClick={() => confirmAddLevel('l3')} style={{ padding: "5px 10px", background: A.a, border: "none", borderRadius: 5, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>✓</button>
                                <button onClick={() => { setAddingLevel(null); setNewOptVal(''); }} style={{ padding: "5px 8px", background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 5, color: M.textB, fontSize: 11, cursor: "pointer" }}>✕</button>
                              </div>
                            )}
                            {formErrors.l3 && <div style={{ fontSize: 9, color: "#ef4444", marginTop: 2, fontWeight: 700, fontFamily: uff }}>{formErrors.l3}</div>}
                          </div>
                          <div>
                            <FieldLabel col="F" label="Default HSN Code" type="text" required={false} M={M} A={A} uff={uff} dff={dff} />
                            <input value={form.hsn} onChange={e => { setForm(f => ({ ...f, hsn: e.target.value })); setIsDirty(true); }}
                              style={{ ...inp(false), fontFamily: dff }} placeholder="Auto from L2 selection" />
                            <span style={{ fontSize: 8.5, color: M.textD, fontFamily: uff }}>Auto-filled from L2. Override if needed.</span>
                          </div>
                        </div>
                      </>
                    )}
                  </EntrySection>

                  {/* Section: Status & Notes */}
                  <EntrySection title="Status & Notes" icon="📝" fieldCount={2} M={M} A={A} uff={uff} defaultOpen>
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "10px 14px" }}>
                      <div>
                        <FieldLabel col="H" label="Active" type="dropdown" required={false} M={M} A={A} uff={uff} dff={dff} />
                        <select value={form.active} onChange={e => { setForm(f => ({ ...f, active: e.target.value })); setIsDirty(true); }}
                          style={{ ...inp(false), cursor: "pointer" }}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel col="I" label="Remarks" type="textarea" required={false} M={M} A={A} uff={uff} dff={dff} />
                        <input value={form.remarks} onChange={e => { setForm(f => ({ ...f, remarks: e.target.value })); setIsDirty(true); }}
                          style={inp(false)} placeholder="Optional notes" />
                      </div>
                    </div>
                  </EntrySection>

                  {/* Preview card */}
                  {form.l3 && (
                    <div style={{ padding: 14, borderRadius: 8, border: `1px dashed ${A.a}`, background: A.al }}>
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", color: A.a, letterSpacing: .5, marginBottom: 6, fontFamily: uff }}>Preview</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: A.a, fontFamily: dff, fontWeight: 700 }}>{nextCode}</span>
                        <span style={{ color: M.divider }}>|</span>
                        <span style={{ fontWeight: 700, color: M.textA }}>{form.l1}</span>
                        <span style={{ color: M.textD }}>›</span>
                        <span style={{ fontWeight: 600, color: M.textB }}>{form.l2}</span>
                        <span style={{ color: M.textD }}>›</span>
                        <span style={{ fontWeight: 600, color: M.textB }}>{form.l3}</span>
                        <span style={{ color: M.divider }}>|</span>
                        <span style={{ fontSize: 11, color: M.textC, fontFamily: dff }}>HSN {form.hsn}</span>
                        <span style={{ color: M.divider }}>|</span>
                        <span style={{ fontSize: 11, color: M.textC }}>{form.master}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Inline View ── */
                <InlineEntryView
                  form={form} formErrors={formErrors} hierarchy={hierarchy}
                  nextCode={nextCode} l1Opts={l1Opts} l2Opts={l2Opts} l3Opts={l3Opts}
                  setMaster={setMaster} setL1={setL1} setL2={setL2} setL3={setL3}
                  setForm={setForm} setIsDirty={setIsDirty}
                  M={M} A={A} uff={uff} dff={dff}
                />
              )}
            </div>
            {/* Entry Footer */}
            <div style={{ padding: "8px 14px", borderTop: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 8, background: M.surfMid, flexShrink: 0 }}>
              {isDirty && <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 900, fontFamily: uff }}>● Unsaved changes</span>}
              <div style={{ flex: 1 }} />
              <button onClick={handleEntryClear} style={{ padding: "6px 14px", border: `1px solid ${M.inputBd}`, borderRadius: 5, background: M.inputBg, color: M.textB, fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>↺ Clear</button>
              <button onClick={handleEntrySave} disabled={saving}
                style={{ padding: "6px 20px", border: "none", borderRadius: 5, background: saving ? M.textD : A.a, color: "#fff", fontSize: 10, fontWeight: 900, cursor: saving ? "default" : "pointer", fontFamily: uff }}>
                {saving ? "Saving..." : "✓ Save to Sheet"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════ TREE VIEW TAB ════════════ */}
        {mainTab === "tree" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16, animation: "catFadeIn .25s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {Object.entries(treeData).map(([l1, l2Map]) => {
                const masterType = Object.values(l2Map).flat()[0]?.master;
                const h = masterType ? CATEGORY_HIERARCHY[masterType] : null;
                const groupColor = h?.color || A.a;
                return (
                  <div key={l1} style={{ background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 10, borderTop: `3px solid ${groupColor}`, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", background: M.tblHead, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${M.divider}` }}>
                      <span style={{ fontSize: 18 }}>{h?.icon || "📁"}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: M.textA, fontFamily: uff }}>{l1}</span>
                      <span style={{ fontSize: 9, background: groupColor, color: "#fff", padding: "2px 8px", borderRadius: 10, marginLeft: "auto", fontFamily: dff, fontWeight: 700 }}>
                        {h?.l1Behavior === "FIXED" ? "FIXED" : "SELECTABLE"}
                      </span>
                    </div>
                    <div style={{ padding: 12 }}>
                      {Object.entries(l2Map).map(([l2, items]) => (
                        <div key={l2} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: groupColor, textTransform: "uppercase", letterSpacing: .5, padding: "4px 0", borderBottom: `1px dashed ${M.divider}`, marginBottom: 6, fontFamily: uff }}>
                            {l2} <span style={{ color: M.textD, fontWeight: 500 }}>({items.length})</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 8 }}>
                            {items.map(item => (
                              <button key={item.code} onClick={() => { openEditPanel(item); setMainTab("records"); }} style={{
                                padding: "4px 10px", borderRadius: 6,
                                border: `1px solid ${item.active === "Yes" ? groupColor + "40" : M.divider}`,
                                background: item.active === "Yes" ? groupColor + "10" : M.surfMid,
                                color: item.active === "Yes" ? M.textA : M.textD,
                                fontSize: 11, fontFamily: uff, fontWeight: 600,
                                cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 4,
                                opacity: item.active === "Yes" ? 1 : .5,
                              }}>
                                <span style={{ fontFamily: dff, fontSize: 9, color: M.textC }}>{item.code}</span>
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

        {/* ════════════ FIELD SPECS TAB ════════════ */}
        {mainTab === "specs" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{ padding: "8px 14px", borderBottom: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 8, background: M.surfMid, flexShrink: 0, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: M.textD }}>🔍</span>
                <input value={specsSearch} onChange={e => setSpecsSearch(e.target.value)} placeholder="Search fields..."
                  style={{ border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textA, fontSize: 11, padding: "5px 9px 5px 26px", outline: "none", width: 180, fontFamily: uff }} />
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["All Fields", "Mandatory", "Auto", "Manual"].map(t => (
                  <button key={t} onClick={() => setSpecsFilter(t)} style={{
                    padding: "3px 11px", borderRadius: 20,
                    border: `1.5px solid ${specsFilter === t ? A.a : M.inputBd}`,
                    background: specsFilter === t ? A.a : M.inputBg,
                    color: specsFilter === t ? "#fff" : M.textB,
                    fontSize: 9.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: uff,
                  }}>{t}</button>
                ))}
              </div>
              <span style={{ marginLeft: "auto", fontSize: 10, color: M.textC, fontWeight: 700, whiteSpace: "nowrap", fontFamily: dff }}>
                {FIELD_SPECS.filter(f => {
                  if (specsFilter === "Mandatory") return f.required;
                  if (specsFilter === "Auto") return f.auto;
                  if (specsFilter === "Manual") return !f.auto && f.fieldType !== "autocode";
                  return true;
                }).filter(f => !specsSearch || f.label.toLowerCase().includes(specsSearch.toLowerCase())).length} / {FIELD_SPECS.length} fields
              </span>
            </div>
            {/* Table */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 36 }} />
                  <col style={{ width: 30 }} />
                  <col />
                  <col style={{ width: 118 }} />
                  <col style={{ width: 58 }} />
                  <col style={{ width: 60 }} />
                  <col style={{ width: 140 }} />
                </colgroup>
                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ background: A.a }}>
                    {["COL", "#", "FIELD HEADER", "DATA TYPE", "REQ?", "AUTO?", "FK LINK"].map(h => (
                      <th key={h} style={{ padding: "7px 8px", textAlign: "left", fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 0.5, whiteSpace: "nowrap", fontFamily: uff }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIELD_SPECS.filter(f => {
                    const matchSearch = !specsSearch || f.label.toLowerCase().includes(specsSearch.toLowerCase()) || f.key.toLowerCase().includes(specsSearch.toLowerCase());
                    const matchFilter = (() => {
                      switch (specsFilter) {
                        case "Mandatory": return f.required;
                        case "Auto": return f.auto;
                        case "Manual": return !f.auto && f.fieldType !== "autocode";
                        default: return true;
                      }
                    })();
                    return matchSearch && matchFilter;
                  }).map((f, i) => {
                    const isExp = expandedSpec === f.col;
                    const rowBg = isExp ? A.al : (i % 2 === 0 ? M.tblEven : M.tblOdd);
                    return (
                      <tr key={f.col} style={{ cursor: "pointer" }}>
                        <td colSpan={7} style={{ padding: 0, border: "none" }}>
                          <div onClick={() => setExpandedSpec(isExp ? null : f.col)}
                            style={{ display: "grid", gridTemplateColumns: "36px 30px 1fr 118px 58px 60px 140px", background: rowBg, borderBottom: `1px solid ${M.divider}`, alignItems: "center" }}
                            onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = M.hoverBg; }}
                            onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = rowBg; }}>
                            <div style={{ padding: "7px 8px", fontFamily: dff, fontSize: 9.5, fontWeight: 700, color: M.textC }}>{f.col}</div>
                            <div style={{ padding: "7px 8px", fontFamily: dff, fontSize: 9, color: M.textD, textAlign: "center" }}>{i + 1}</div>
                            <div style={{ padding: "7px 8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isExp ? A.a : M.textA, fontFamily: uff }}>{f.label}</span>
                                <span style={{ fontSize: 9, color: M.textD }}>▾</span>
                              </div>
                            </div>
                            <div style={{ padding: "7px 8px" }}><DtBadge type={f.fieldType} /></div>
                            <div style={{ padding: "7px 8px", textAlign: "center" }}>
                              {f.required ? <span style={{ color: "#ef4444", fontWeight: 900, fontSize: 9 }}>⚠ YES</span> : <span style={{ color: M.textD, fontSize: 9 }}>—</span>}
                            </div>
                            <div style={{ padding: "7px 8px", textAlign: "center" }}>
                              {f.auto ? <span style={{ color: "#059669", fontWeight: 900, fontSize: 9 }}>GAS ✓</span> : <span style={{ color: M.textD, fontSize: 9 }}>—</span>}
                            </div>
                            <div style={{ padding: "7px 8px" }}>
                              {f.fk ? <span style={{ fontSize: 9, fontWeight: 900, color: "#2563eb", fontFamily: dff }}>{f.fk}</span> : <span style={{ color: M.textD, fontSize: 9 }}>—</span>}
                            </div>
                          </div>
                          {isExp && (
                            <div style={{ background: A.al, padding: "8px 14px 12px 54px", borderBottom: `2px solid ${A.a}30` }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 8.5, fontWeight: 900, color: A.a, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3, fontFamily: uff }}>ENTRY INSTRUCTIONS</div>
                                  <div style={{ fontSize: 11, color: M.textA, lineHeight: 1.65, fontWeight: 600, fontFamily: uff }}>{f.hint}</div>
                                </div>
                                <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                                  <span style={{ padding: "2px 7px", background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 3, fontSize: 9, color: M.textC, fontFamily: dff }}>Col {f.col}</span>
                                  <DtBadge type={f.fieldType} />
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div style={{
        background: M.surfMid, borderTop: `1px solid ${M.divider}`, padding: "4px 16px",
        display: "flex", alignItems: "center", gap: 18, flexShrink: 0,
      }}>
        {[
          { l: "MASTER", v: "ITEM_CATEGORIES" },
          { l: "COLS", v: 9 },
          { l: "TAB", v: mainTab.toUpperCase() },
          { l: "TOTAL", v: stats.total },
          { l: "ACTIVE", v: stats.active },
          { l: "INACTIVE", v: stats.inactive },
        ].map(s => (
          <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 7.5, fontWeight: 900, color: M.textD, letterSpacing: 1, textTransform: "uppercase", fontFamily: uff }}>{s.l}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: M.textB, fontFamily: dff }}>{s.v}</span>
          </div>
        ))}
        <div style={{ flex: 1, textAlign: "right", fontSize: 8.5, color: M.textD, fontFamily: dff }}>
          CC ERP · FILE 1A · {new Date().toLocaleDateString("en-IN")}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── Collapsible Section for Data Entry Form ──
function EntrySection({ title, icon, fieldCount, M, A, uff, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div style={{ border: `1px solid ${M.divider}`, borderRadius: 7, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 14px",
        background: open ? `${A.a}08` : M.surfMid, border: "none", cursor: "pointer",
        borderBottom: `1px solid ${open ? M.divider : "transparent"}`,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 900, color: open ? A.a : M.textA, flex: 1, textAlign: "left", fontFamily: uff }}>{title}</span>
        <span style={{ fontSize: 9, color: M.textD, fontFamily: uff }}>{fieldCount} fields</span>
        <span style={{ fontSize: 10, color: M.textD, marginLeft: 4 }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && <div style={{ padding: "12px 14px" }}>{children}</div>}
    </div>
  );
}

// ── Field Label with type badge (matching DataEntryTab pattern) ──
function FieldLabel({ col, label, type, required, M, A, uff, dff }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
      <span style={{ fontFamily: dff, fontSize: 8.5, fontWeight: 700, color: M.textD, minWidth: 18 }}>{col}</span>
      <span style={{ fontSize: 9, fontWeight: 900, color: required ? A.a : M.textD, flex: 1, fontFamily: uff }}>
        {required ? "⚠ " : ""}{label}
      </span>
      <DtBadge type={type} />
    </div>
  );
}

// ── Inline Entry View (dense table-style) ──
function InlineEntryView({ form, formErrors, hierarchy, nextCode, l1Opts, l2Opts, l3Opts, setMaster, setL1, setL2, setL3, setForm, setIsDirty, M, A, uff, dff }) {
  const [activeKey, setActiveKey] = useState(null);
  const [search, setSearch] = useState("");

  const fields = [
    { key: "code",     col: "A", label: "Category Code",  fieldType: "autocode", auto: true,  required: false, hint: "Auto-generated" },
    { key: "master",   col: "E", label: "Item Master",    fieldType: "dropdown", auto: false, required: true,  hint: "Which master sheet" },
    { key: "l1",       col: "B", label: "L1 Division",    fieldType: "dropdown", auto: false, required: true,  hint: "Top-level classification" },
    { key: "l2",       col: "C", label: "L2 Type",        fieldType: "dropdown", auto: false, required: true,  hint: "Sub-classification" },
    { key: "l3",       col: "D", label: "L3 Style",       fieldType: "dropdown", auto: false, required: true,  hint: "Specific item style" },
    { key: "hsn",      col: "F", label: "Default HSN",    fieldType: "text",     auto: false, required: false, hint: "HSN/SAC code" },
    { key: "behavior", col: "G", label: "L1 Behavior",    fieldType: "auto",     auto: true,  required: false, hint: "FIXED or SELECTABLE" },
    { key: "active",   col: "H", label: "Active",         fieldType: "dropdown", auto: false, required: false, hint: "Yes/No status" },
    { key: "remarks",  col: "I", label: "Remarks",        fieldType: "text",     auto: false, required: false, hint: "Optional notes" },
  ];

  const visible = fields.filter(f => !search || f.label.toLowerCase().includes(search.toLowerCase()));
  const manualFields = fields.filter(f => !f.auto);
  const filledCount = manualFields.filter(f => form[f.key]).length;

  const getVal = (key) => {
    if (key === "code") return nextCode;
    if (key === "behavior") return hierarchy?.l1Behavior || "";
    return form[key] || "";
  };

  const renderInput = (f) => {
    const style = { width: "100%", padding: "4px 8px", border: `1px solid ${M.inputBd}`, borderRadius: 4, fontSize: 11, fontFamily: uff, background: M.inputBg, color: M.textA, outline: "none" };
    if (f.key === "master") {
      return (
        <select value={form.master} onChange={e => setMaster(e.target.value)} style={{ ...style, cursor: "pointer" }}>
          <option value="">— Select —</option>
          {MASTER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      );
    }
    if (f.key === "l1") {
      if (hierarchy?.l1Behavior === "FIXED") return <div style={{ ...style, background: A.al, color: A.a, fontWeight: 700 }}>🔒 {hierarchy.l1Fixed}</div>;
      return (
        <select value={form.l1} onChange={e => setL1(e.target.value)} disabled={!form.master} style={{ ...style, cursor: "pointer" }}>
          <option value="">— Select —</option>
          {l1Opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.key === "l2") {
      return (
        <select value={form.l2} onChange={e => setL2(e.target.value)} disabled={!form.l1} style={{ ...style, cursor: "pointer" }}>
          <option value="">— Select —</option>
          {l2Opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.key === "l3") {
      return (
        <select value={form.l3} onChange={e => setL3(e.target.value)} disabled={!form.l2} style={{ ...style, cursor: "pointer" }}>
          <option value="">— Select —</option>
          {l3Opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.key === "active") {
      return (
        <select value={form.active} onChange={e => { setForm(prev => ({ ...prev, active: e.target.value })); setIsDirty(true); }} style={{ ...style, cursor: "pointer" }}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    }
    if (f.key === "hsn") {
      return <input value={form.hsn} onChange={e => { setForm(prev => ({ ...prev, hsn: e.target.value })); setIsDirty(true); }} style={{ ...style, fontFamily: dff }} placeholder="Auto from L2" />;
    }
    if (f.key === "remarks") {
      return <input value={form.remarks || ""} onChange={e => { setForm(prev => ({ ...prev, remarks: e.target.value })); setIsDirty(true); }} style={style} placeholder="Optional notes" />;
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ padding: "6px 14px", borderBottom: `1px solid ${M.divider}`, display: "flex", alignItems: "center", gap: 8, background: M.surfMid, flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.5, fontFamily: uff }}>⚡ INLINE ENTRY</div>
        <div style={{ width: 1, height: 14, background: M.divider }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter fields..."
          style={{ border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textA, fontSize: 11, padding: "3px 8px", outline: "none", width: 180, fontFamily: uff }} />
        <div style={{ marginLeft: "auto", fontSize: 9, color: M.textC, fontWeight: 700, fontFamily: uff }}>
          {filledCount} / {manualFields.length} filled
        </div>
      </div>
      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 30 }} />
            <col />
            <col style={{ width: 100 }} />
            <col />
            <col style={{ width: 50 }} />
          </colgroup>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ background: A.a }}>
              {["COL", "#", "FIELD", "TYPE", "VALUE", "STATUS"].map(h => (
                <th key={h} style={{ padding: "7px 8px", textAlign: "left", fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 0.5, whiteSpace: "nowrap", fontFamily: uff }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((f, i) => {
              const isActive = activeKey === f.key;
              const isAuto = f.auto;
              const filled = !!getVal(f.key) && !isAuto;
              const hasErr = !!formErrors[f.key];
              const rowBg = isActive ? A.al : hasErr ? "#fef2f2" : (i % 2 === 0 ? M.tblEven : M.tblOdd);
              return (
                <tr key={f.key}
                  onClick={() => !isAuto && setActiveKey(f.key)}
                  style={{
                    background: rowBg, borderBottom: `1px solid ${M.divider}`,
                    cursor: isAuto ? "default" : "pointer",
                    borderLeft: `3px solid ${isActive ? A.a : hasErr ? "#ef4444" : isAuto ? A.a + "20" : "transparent"}`,
                  }}
                  onMouseEnter={e => { if (!isActive && !isAuto) e.currentTarget.style.background = M.hoverBg; }}
                  onMouseLeave={e => { if (!isActive && !isAuto) e.currentTarget.style.background = rowBg; }}
                >
                  <td style={{ padding: "7px 8px", fontFamily: dff, fontSize: 9.5, fontWeight: 700, color: M.textC }}>{f.col}</td>
                  <td style={{ padding: "7px 8px", fontFamily: dff, fontSize: 9, color: M.textD, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ padding: "7px 8px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? A.a : M.textA, fontFamily: uff }}>{f.label}</div>
                    {!isActive && <div style={{ fontSize: 8, color: M.textD, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: uff }}>{f.hint}</div>}
                  </td>
                  <td style={{ padding: "7px 8px" }}><DtBadge type={f.fieldType} /></td>
                  <td style={{ padding: "6px 8px" }}>
                    {isActive && !isAuto ? (
                      renderInput(f)
                    ) : isAuto ? (
                      <div style={{ fontSize: 11, color: A.a, background: A.al, border: `1px solid ${A.a}30`, borderRadius: 3, padding: "3px 8px", fontWeight: 700, fontFamily: dff }}>
                        {getVal(f.key) || <span style={{ opacity: 0.6 }}>← auto</span>}
                      </div>
                    ) : getVal(f.key) ? (
                      <div style={{ fontSize: 11, color: M.textA, fontWeight: 600, padding: "3px 2px", fontFamily: uff }}>{getVal(f.key)}</div>
                    ) : (
                      <div style={{ fontSize: 11, color: M.textD, padding: "3px 2px", fontStyle: "italic", borderBottom: `1px dashed ${M.inputBd}`, fontFamily: uff }}>
                        {f.required ? "⚠ required — click" : "click to enter..."}
                      </div>
                    )}
                    {hasErr && <div style={{ fontSize: 8, color: "#ef4444", marginTop: 1, fontWeight: 700, fontFamily: uff }}>{formErrors[f.key]}</div>}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "center" }}>
                    {isAuto
                      ? <span style={{ color: "#059669", fontSize: 9, fontWeight: 900 }}>AUTO</span>
                      : filled
                        ? <span style={{ color: "#059669", fontSize: 12 }}>✓</span>
                        : hasErr
                          ? <span style={{ color: "#ef4444", fontSize: 9, fontWeight: 900 }}>!!</span>
                          : f.required
                            ? <span style={{ color: "#f59e0b", fontSize: 9, fontWeight: 900 }}>req</span>
                            : <span style={{ color: M.textD, fontSize: 9 }}>opt</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
