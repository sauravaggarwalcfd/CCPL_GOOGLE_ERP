import { useState, useMemo, useCallback, useRef } from 'react';
import api from '../../services/api';
import SortPanel    from './SortPanel';
import ColumnPanel  from './ColumnPanel';
import ViewEditModal from './ViewEditModal';
import RecordDetailModal from './RecordDetailModal';

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

// ─── CC_RED + Toast colours ───
const CC_RED = '#CC0000';
const TOAST_COLORS = { success: '#15803d', delete: '#dc2626', view: '#7C3AED', info: '#0078D4' };

// ─── Item Category field schema (for records table / sort / column mgmt) ───
const CAT_FIELDS = [
  { key: 'code',     label: 'Code',       w: 100, mono: true },
  { key: 'l1',       label: 'L1 Division', w: 160 },
  { key: 'l2',       label: 'L2 Type',    w: 150 },
  { key: 'l3',       label: 'L3 Style',   w: 160 },
  { key: 'master',   label: 'Master',     w: 120 },
  { key: 'hsn',      label: 'HSN',        w: 72, mono: true },
  { key: 'behavior', label: 'Behavior',   w: 90 },
  { key: 'active',   label: 'Active',     w: 72, badge: true, type: 'select', options: ['Yes', 'No'] },
  { key: 'remarks',  label: 'Remarks',    w: 200 },
];
// Schema shape compatible with RecordDetailModal / SortPanel / ColumnPanel
const CAT_SCHEMA = CAT_FIELDS.map(f => ({ ...f, hidden: false }));

// ─── AGG colours ───
const AGG_COLORS = {
  count: '#0078D4', count_values: '#0078D4', count_empty: '#6b7280',
  unique: '#7C3AED', sum: '#15803d', avg: '#E8690A',
  min: '#0e7490', max: '#7c2d12', range: '#4338ca', median: '#0891b2',
  percent_filled: '#15803d', percent_empty: '#6b7280',
};
const AGG_GROUPS = [
  { label: 'Count',     color: '#0078D4', items: ['count', 'count_values', 'count_empty', 'unique'] },
  { label: 'Calculate', color: '#15803d', items: ['sum', 'avg', 'min', 'max', 'range', 'median'] },
  { label: 'Percent',   color: '#0891b2', items: ['percent_filled', 'percent_empty'] },
];
const AGG_FNS = [
  { id: 'none', label: 'None' }, { id: 'count', label: 'Count' },
  { id: 'count_values', label: 'Count Values' }, { id: 'count_empty', label: 'Count Empty' },
  { id: 'unique', label: 'Unique' }, { id: 'sum', label: 'Sum' },
  { id: 'avg', label: 'Avg' }, { id: 'min', label: 'Min' }, { id: 'max', label: 'Max' },
  { id: 'range', label: 'Range' }, { id: 'median', label: 'Median' },
  { id: 'percent_filled', label: '% Filled' }, { id: 'percent_empty', label: '% Empty' },
];

function calcAgg(fn, col, rows) {
  const vals  = rows.map(r => r[col]).filter(v => v !== undefined && v !== null && v !== '');
  const nums  = vals.map(v => parseFloat(v)).filter(n => !isNaN(n));
  const total = rows.length;
  const fmt   = n => Number.isInteger(n) ? n.toString() : n.toFixed(2);
  switch (fn) {
    case 'count':          return total.toString();
    case 'count_values':   return vals.length.toString();
    case 'count_empty':    return (total - vals.length).toString();
    case 'unique':         return new Set(vals).size.toString();
    case 'sum':            return nums.length ? fmt(nums.reduce((a,b) => a+b, 0)) : '—';
    case 'avg':            return nums.length ? fmt(nums.reduce((a,b) => a+b, 0) / nums.length) : '—';
    case 'min':            return nums.length ? fmt(Math.min(...nums)) : '—';
    case 'max':            return nums.length ? fmt(Math.max(...nums)) : '—';
    case 'range':          return nums.length ? fmt(Math.max(...nums) - Math.min(...nums)) : '—';
    case 'median': {
      if (!nums.length) return '—';
      const s = [...nums].sort((a,b) => a-b); const m = Math.floor(s.length/2);
      return fmt(s.length % 2 ? s[m] : (s[m-1]+s[m])/2);
    }
    case 'percent_filled': return total ? `${((vals.length/total)*100).toFixed(1)}%` : '—';
    case 'percent_empty':  return total ? `${(((total-vals.length)/total)*100).toFixed(1)}%` : '—';
    default: return '';
  }
}

function applySort(rows, sorts) {
  if (!sorts.length) return rows;
  return [...rows].sort((a, b) => {
    for (const { col, dir, type, nulls } of sorts) {
      const av = a[col], bv = b[col];
      const an = av == null || av === '', bn = bv == null || bv === '';
      if (an && bn) continue;
      if (an) return nulls === 'first' ? -1 : 1;
      if (bn) return nulls === 'first' ? 1 : -1;
      const ft = !type || type === 'auto' ? 'alpha' : type;
      let d = 0;
      if (ft === 'numeric') { d = parseFloat(av) - parseFloat(bv); if (isNaN(d)) d = 0; }
      else if (ft === 'date') { d = new Date(av) - new Date(bv); if (isNaN(d)) d = 0; }
      else if (ft === 'length') { d = String(av).length - String(bv).length; }
      else { d = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }); }
      if (d !== 0) return dir === 'asc' ? d : -d;
    }
    return 0;
  });
}

function buildRenderList(sorted, groupBy, subGroupBy) {
  if (!groupBy) return sorted.map((row, i) => ({ type: 'row', row, rowIdx: i }));
  const items = [], gMap = new Map();
  for (const row of sorted) {
    const gv = row[groupBy] ?? '—';
    if (!gMap.has(gv)) gMap.set(gv, new Map());
    if (subGroupBy) {
      const sv = row[subGroupBy] ?? '—';
      if (!gMap.get(gv).has(sv)) gMap.get(gv).set(sv, []);
      gMap.get(gv).get(sv).push(row);
    } else {
      if (!gMap.get(gv).has('_r')) gMap.get(gv).set('_r', []);
      gMap.get(gv).get('_r').push(row);
    }
  }
  let ri = 0;
  for (const [gv, gd] of gMap) {
    const cnt = subGroupBy ? [...gd.values()].flatMap(r => r).length : (gd.get('_r') || []).length;
    items.push({ type: 'group', value: gv, count: cnt, key: `g-${gv}` });
    if (subGroupBy) {
      for (const [sv, sr] of gd) {
        items.push({ type: 'subgroup', value: sv, count: sr.length, key: `sg-${gv}-${sv}` });
        for (const row of sr) items.push({ type: 'row', row, rowIdx: ri++ });
      }
    } else {
      for (const row of (gd.get('_r') || [])) items.push({ type: 'row', row, rowIdx: ri++ });
    }
  }
  return items;
}

// ─── Toast System — bottom:24 right:24 ───
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
        <div key={t.id} style={{
          background: t.color, color: "#fff", padding: "10px 20px", borderRadius: 8,
          fontSize: 12, fontWeight: 800, boxShadow: "0 4px 20px rgba(0,0,0,.25)",
          animation: "catSlideIn .3s ease", display: "flex", alignItems: "center", gap: 8,
        }}>
          {t.msg}
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
  const M    = toM(rawM);
  const fz   = 13;
  const { toasts, add: addToast } = useToast();
  const showToast = (msg, colorKey = 'success') =>
    addToast(msg, TOAST_COLORS[colorKey] || colorKey || TOAST_COLORS.success);

  const [data, setData] = useState(SEED_DATA);
  const [tab, setTab] = useState("layout");
  const [layoutTab, setLayoutTab] = useState("classic");

  // ─── ORG HIERARCHY (used by Column / Classic / Flow tabs) ───
  const orgHierarchy = useMemo(() => {
    const h = {};
    data.forEach(r => {
      if (!h[r.l1]) {
        const entry = Object.values(CATEGORY_HIERARCHY).find(v => v.l1Fixed === r.l1 || (v.l1Options && v.l1Options.includes(r.l1)));
        h[r.l1] = { label: r.l1, master: r.master, color: entry?.color || A.a, icon: entry?.icon || '📁', l2s: {} };
      }
      if (!h[r.l1].l2s[r.l2]) h[r.l1].l2s[r.l2] = [];
      if (!h[r.l1].l2s[r.l2].find(x => x.code === r.code)) h[r.l1].l2s[r.l2].push(r);
    });
    return Object.values(h);
  }, [data]);

  // ─── AUDIT LOG ───
  const [auditLog, setAuditLog] = useState([
    { id: 9, type: 'IMPORT', user: 'System',  ts: '01 Jan 2026 09:00', msg: 'Imported 83 categories from initial seed data', detail: null },
    { id: 8, type: 'ADD',    user: 'Admin',   ts: '15 Jan 2026 10:22', msg: 'Added CAT-083 "Flat Elastic" in Trim › Elastic', detail: null },
    { id: 7, type: 'EDIT',   user: 'Admin',   ts: '22 Jan 2026 14:30', msg: 'Updated CAT-021 "Oversized Tee"', detail: { before: { behavior: 'SELECTABLE' }, after: { behavior: 'FIXED' } } },
    { id: 6, type: 'ADD',    user: 'Admin',   ts: '25 Jan 2026 09:15', msg: 'Added CAT-085 "Neck Tape" in Trim › Neck / Shoulder Tape', detail: null },
    { id: 5, type: 'TOGGLE', user: 'Admin',   ts: '28 Jan 2026 16:45', msg: 'Toggled CAT-099 active: Yes → No', detail: null },
    { id: 4, type: 'ADD',    user: 'Admin',   ts: '30 Jan 2026 11:10', msg: 'Added CAT-086 "Other Trim" in Trim › Other', detail: null },
    { id: 3, type: 'EDIT',   user: 'Admin',   ts: '01 Feb 2026 13:00', msg: 'Updated HSN for CAT-042 "Polyester"', detail: { before: { hsn: '5205' }, after: { hsn: '5402' } } },
    { id: 2, type: 'ADD',    user: 'Admin',   ts: '14 Feb 2026 10:00', msg: 'Added CAT-084 "Brass Eyelet" in Trim › Rivet / Eyelet', detail: null },
    { id: 1, type: 'EDIT',   user: 'Admin',   ts: '20 Feb 2026 15:30', msg: 'Updated remarks for CAT-001 "Pique Polo"', detail: { before: { remarks: '' }, after: { remarks: 'Classic polo' } } },
  ]);
  const addLog = useCallback((type, msg, detail = null) => {
    const ts = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setAuditLog(prev => [{ id: Date.now(), type, user: 'Admin', ts, msg, detail }, ...prev]);
  }, []);
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
      showToast(`Duplicate: ${dup.code} already has this combination`, 'delete');
      return;
    }
    if (editItem) {
      const before = { l1: editItem.l1, l2: editItem.l2, l3: editItem.l3, master: editItem.master, hsn: editItem.hsn, active: editItem.active, remarks: editItem.remarks };
      const after  = { l1: form.l1,     l2: form.l2,     l3: form.l3,     master: form.master,     hsn: form.hsn,     active: form.active,     remarks: form.remarks };
      setData(prev => prev.map(d => d.code === editItem.code ? { ...d, ...form, behavior: hierarchy.l1Behavior } : d));
      showToast(`✓ Updated ${editItem.code}`, 'success');
      addLog('EDIT', `Updated ${editItem.code} — ${form.l3}`, { before, after });
      // API call
      try { await api.updateCategory(editItem.code, { ...form, behavior: hierarchy.l1Behavior }); } catch {}
      setEditItem(null);
    } else {
      const newItem = { code: nextCode, ...form, behavior: hierarchy.l1Behavior };
      setData(prev => [...prev, newItem]);
      showToast(`✓ Created ${nextCode}`, 'success');
      addLog('ADD', `Added ${nextCode} — ${form.l3} in ${form.l1} › ${form.l2}`, null);
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
    const item = data.find(d => d.code === code);
    const newActive = item?.active === 'Yes' ? 'No' : 'Yes';
    setData(prev => prev.map(d => d.code === code ? { ...d, active: newActive } : d));
    if (item) addLog('TOGGLE', `Toggled ${code} "${item.l3}" active: ${item.active} → ${newActive}`, null);
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

      {/* ─── MAIN TAB BAR ─── */}
      <div style={{ padding: "8px 16px 0", display: "flex", gap: 4, borderBottom: `1px solid ${M.div}`, flexShrink: 0 }}>
        <button onClick={() => { setTab("create"); setEditItem(null); setForm({ master: "", l1: "", l2: "", l3: "", hsn: "", active: "Yes", remarks: "" }); }} style={tabBtnStyle(tab === "create")}>
          {editItem ? "✏️ Edit" : "➕ Create"} Category
        </button>
        <button onClick={() => setTab("records")}  style={tabBtnStyle(tab === "records")}>📋 Records</button>
        <button onClick={() => setTab("layout")}   style={tabBtnStyle(tab === "layout")}>🖼 Layout View</button>
        <button onClick={() => setTab("auditlog")} style={tabBtnStyle(tab === "auditlog")}>📋 Audit Logs</button>
      </div>

      {/* ─── LAYOUT SUB-TAB BAR (visible only when Layout View is active) ─── */}
      {tab === "layout" && (
        <div style={{ padding: "6px 16px", display: "flex", gap: 4, borderBottom: `1px solid ${M.div}`, background: M.thd, flexShrink: 0, flexWrap: "wrap" }}>
          {[
            { id: "classic",   label: "🌳 Classic View" },
            { id: "hierarchy", label: "⟁ Hierarchy View" },
            { id: "column",    label: "≡ Column View" },
            { id: "cards",     label: "▦ Cards View" },
            { id: "matrix",    label: "▦ Matrix View" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setLayoutTab(id)} style={{
              padding: "5px 14px", borderRadius: "5px 5px 0 0",
              border: `1px solid ${layoutTab === id ? A.a : M.div}`,
              borderBottom: layoutTab === id ? `2px solid ${A.a}` : `1px solid ${M.div}`,
              background: layoutTab === id ? A.al : "transparent",
              color: layoutTab === id ? A.a : M.tC,
              fontFamily: uff, fontSize: fz - 1, fontWeight: layoutTab === id ? 800 : 600,
              cursor: "pointer", transition: "all .15s", letterSpacing: .2,
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* ─── CONTENT ─── */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>

        {/* ═══ CARDS VIEW (Layout sub-tab) ═══ */}
        {tab === "layout" && layoutTab === "cards" && (
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

        {/* ═══ RECORDS — full spec-compliant view ═══ */}
        {tab === "records" && (
          <CatRecordsView
            data={data}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            showToast={showToast}
            M={M} A={A} uff={uff} dff={dff} fz={fz}
          />
        )}

        {/* ═══ LAYOUT VIEW — sub-tabs ═══ */}
        {tab === "layout" && layoutTab === "classic"   && <OC_ClassicTree hierarchy={orgHierarchy} data={data} M={M} A={A} uff={uff} dff={dff} fz={fz} />}
        {tab === "layout" && layoutTab === "hierarchy" && <OC_FlowDiagram hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} />}
        {tab === "layout" && layoutTab === "column"    && <OC_ColumnNav   hierarchy={orgHierarchy} M={M} A={A} uff={uff} dff={dff} fz={fz} />}
        {tab === "layout" && layoutTab === "matrix"    && <MatrixView     data={data} M={M} A={A} uff={uff} dff={dff} fz={fz} />}

        {/* ═══ AUDIT LOGS ═══ */}
        {tab === "auditlog" && (
          <AuditLogView auditLog={auditLog} M={M} A={A} uff={uff} dff={dff} fz={fz} />
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// CAT RECORDS VIEW — Full spec-compliant records table for Item Categories
// ═══════════════════════════════════════════════════════════════════════
function CatRecordsView({ data, onEdit, onToggleActive, showToast, M, A, uff, dff, fz = 13 }) {
  const pyV = 6;

  // ── VIEW STATE ──
  const [search, setSearch]           = useState('');
  const [sorts, setSorts]             = useState([]);
  const [colOrder, setColOrder]       = useState(CAT_FIELDS.map(f => f.key));
  const [hiddenC, setHiddenC]         = useState([]);
  const [groupBy, setGroupBy]         = useState(null);
  const [subGroupBy, setSubGroupBy]   = useState(null);
  const [aggs, setAggs]               = useState({});
  const [filters, setFilters]         = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());

  // ── VIEWS SYSTEM ──
  const [savedViews, setSavedViews]           = useState([]);
  const [activeViewName, setActiveViewName]   = useState('Default');
  const [showViewEdit, setShowViewEdit]       = useState(null);
  const [switchGuard, setSwitchGuard]         = useState(null);

  // ── PANELS ──
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [showColPanel, setShowColPanel]   = useState(false);
  const [showFP, setShowFP]               = useState(false);
  const [showCM, setShowCM]               = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [aggAnchor, setAggAnchor]         = useState(null);
  const [detailRow, setDetailRow]         = useState(null);

  // ── INLINE VIEWS ──
  const [renamingView, setRenamingView]     = useState(null);
  const [renameVal, setRenameVal]           = useState('');
  const [showInlineSave, setShowInlineSave] = useState(false);
  const [inlineSaveName, setInlineSaveName] = useState('');

  // ── COLUMN DRAG ──
  const [colDragIdx, setColDragIdx] = useState(null);
  const [colDropIdx, setColDropIdx] = useState(null);

  // ── DERIVED ──
  const visCols = useMemo(() => {
    return colOrder.filter(k => !hiddenC.includes(k))
      .map(k => CAT_FIELDS.find(f => f.key === k)).filter(Boolean);
  }, [colOrder, hiddenC]);

  const filtered = useMemo(() => {
    let r = data;
    if (search) { const q = search.toLowerCase(); r = r.filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(q))); }
    for (const [col, val] of Object.entries(filters)) {
      if (val) { const q = val.toLowerCase(); r = r.filter(d => String(d[col] ?? '').toLowerCase().includes(q)); }
    }
    return r;
  }, [data, search, filters]);

  const sorted      = useMemo(() => applySort(filtered, sorts), [filtered, sorts]);
  const renderList  = useMemo(() => buildRenderList(sorted, groupBy, subGroupBy), [sorted, groupBy, subGroupBy]);

  // ── VIEWS HELPERS ──
  const getCurrentSnap = () => ({
    colOrder: [...colOrder], hiddenC: [...hiddenC], sorts: [...sorts],
    filters: { ...filters }, groupBy, subGroupBy,
  });

  const getViewDirty = () => {
    const allC = CAT_FIELDS.map(f => f.key);
    if (activeViewName === 'Default') {
      return !(JSON.stringify(colOrder) === JSON.stringify(allC) && hiddenC.length === 0 &&
        sorts.length === 0 && Object.values(filters).every(v => !v) && !groupBy && !subGroupBy);
    }
    const saved = savedViews.find(v => v.name === activeViewName);
    if (!saved) return false;
    return JSON.stringify(colOrder) !== JSON.stringify(saved.colOrder) ||
      JSON.stringify(hiddenC) !== JSON.stringify(saved.hiddenC) ||
      JSON.stringify(sorts) !== JSON.stringify(saved.sorts) ||
      JSON.stringify(filters) !== JSON.stringify(saved.filters || {}) ||
      groupBy !== saved.groupBy || subGroupBy !== (saved.subGroupBy || null);
  };

  const loadView = (view) => {
    if (view.name === 'Default') {
      setColOrder(CAT_FIELDS.map(f => f.key)); setHiddenC([]); setSorts([]);
      setFilters({}); setGroupBy(null); setSubGroupBy(null);
    } else {
      setColOrder(view.colOrder || CAT_FIELDS.map(f => f.key));
      setHiddenC(view.hiddenC || []); setSorts(view.sorts || []);
      setFilters(view.filters || {}); setGroupBy(view.groupBy || null);
      setSubGroupBy(view.subGroupBy || null);
    }
    setActiveViewName(view.name);
  };

  const handleViewClick = (name) => {
    if (name === activeViewName) return;
    if (getViewDirty()) { setSwitchGuard({ targetViewName: name }); return; }
    if (name === 'Default') loadView({ name: 'Default' });
    else { const v = savedViews.find(sv => sv.name === name); if (v) loadView(v); }
  };

  const handleViewSave = (vd) => {
    const mode = showViewEdit?.mode || 'create';
    if (mode === 'edit') {
      setSavedViews(prev => prev.map(v => v.name === vd.name ? { ...v, ...vd } : v));
      if (activeViewName === vd.name) loadView(vd);
    } else {
      setSavedViews(prev => [...prev, vd]); loadView(vd);
    }
    setShowViewEdit(null);
    showToast(`✓ View "${vd.name}" saved`, 'view');
  };

  const handleUpdateView = () => {
    if (activeViewName === 'Default') return;
    const snap = getCurrentSnap();
    setSavedViews(prev => prev.map(v => v.name === activeViewName ? { ...v, ...snap } : v));
    showToast(`✓ View "${activeViewName}" updated`, 'view');
  };

  const handleDeleteView = (name) => {
    setSavedViews(prev => prev.filter(v => v.name !== name));
    if (activeViewName === name) loadView({ name: 'Default' });
    showToast(`View "${name}" deleted`, 'delete');
  };

  const viewDirty = getViewDirty();

  // ── SELECTION ──
  const allSelected = sorted.length > 0 && selectedRows.size === sorted.length;
  const toggleAll   = () => setSelectedRows(allSelected ? new Set() : new Set(sorted.map(r => r.code)));
  const toggleRow   = (code) => setSelectedRows(prev => {
    const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n;
  });

  // ── SORT ──
  const handleHeaderClick = (key) => {
    const ex = sorts.find(s => s.col === key);
    if (ex) {
      if (ex.dir === 'asc') setSorts(prev => prev.map(s => s.col === key ? { ...s, dir: 'desc' } : s));
      else setSorts(prev => prev.filter(s => s.col !== key));
    } else {
      setSorts(prev => [...prev, { col: key, dir: 'asc', type: 'auto', nulls: 'last' }]);
    }
  };

  // ── COLUMN DRAG ──
  const onColDragStart = (i)     => setColDragIdx(i);
  const onColDragOver  = (e, i)  => { e.preventDefault(); setColDropIdx(i); };
  const onColDrop      = (i)     => {
    if (colDragIdx === null || colDragIdx === i) { setColDragIdx(null); setColDropIdx(null); return; }
    const order   = [...colOrder];
    const fromKey = visCols[colDragIdx]?.key;
    const toKey   = visCols[i]?.key;
    if (!fromKey || !toKey) { setColDragIdx(null); setColDropIdx(null); return; }
    const fi = order.indexOf(fromKey), ti = order.indexOf(toKey);
    if (fi < 0 || ti < 0) { setColDragIdx(null); setColDropIdx(null); return; }
    const [mv] = order.splice(fi, 1); order.splice(ti, 0, mv);
    setColOrder(order); setColDragIdx(null); setColDropIdx(null);
  };

  // ── HELPERS ──
  const colW     = (f) => typeof f.w === 'number' ? f.w : (parseInt(f.w) || 140);
  const colLabel = hiddenC.length > 0 ? `⫿ ${hiddenC.length} hidden` : '⫿ Columns';

  // ── MASTER COLOR ──
  const masterColor = (masterKey) => CATEGORY_HIERARCHY[masterKey]?.color || A.a;
  const masterIcon  = (masterKey) => CATEGORY_HIERARCHY[masterKey]?.icon || '📁';

  // ── CELL RENDERER ──
  const renderCell = (f, val) => {
    if (f.key === 'code') {
      return <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: fz - 2, fontWeight: 700, color: masterColor('') }}>{val || '—'}</span>;
    }
    if (f.key === 'master') {
      const c = masterColor(val), ic = masterIcon(val);
      return <span style={{ fontSize: fz - 3, background: c + '15', color: c, padding: '2px 8px', borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap' }}>{ic} {val || '—'}</span>;
    }
    if (f.key === 'behavior') {
      const isFixed = val === 'FIXED';
      return <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: isFixed ? '#0078D415' : A.al, color: isFixed ? '#0078D4' : A.a }}>{isFixed ? '🔒 FIXED' : '🔓 SELECT'}</span>;
    }
    if (f.key === 'active') {
      const yes = val === 'Yes';
      return <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: yes ? '#d1fae5' : '#fee2e2', color: yes ? '#065f46' : '#991b1b' }}>{val || '—'}</span>;
    }
    if (f.key === 'hsn') {
      return <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: fz - 2 }}>{val || '—'}</span>;
    }
    const hasVal = val !== undefined && val !== null && val !== '';
    return hasVal ? <span style={{ fontSize: fz - 2 }}>{String(val)}</span> : <span style={{ fontSize: fz - 2, color: M.tD, fontStyle: 'italic' }}>—</span>;
  };

  // ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', animation: 'catFadeIn .25s ease' }}>

      {/* ── TOOLBAR ── */}
      <div style={{ background: M.mid, borderBottom: `1px solid ${M.div}`, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 7, height: 44, flexShrink: 0, flexWrap: 'nowrap', overflowX: 'auto' }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: M.tD, letterSpacing: 0.5, fontFamily: uff, flexShrink: 0 }}>📊 RECORDS</span>
        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 12, background: M.hi, color: M.tC, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>{sorted.length}</span>
        <div style={{ flex: 1, minWidth: 8 }} />

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: M.tD }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ padding: '5px 8px 5px 26px', border: `1px solid ${M.div}`, borderRadius: 6, fontSize: fz - 2, fontFamily: uff, width: 120, outline: 'none', color: M.tA, background: M.inBg }} />
        </div>

        {/* Sort — count badge */}
        <button onClick={() => setShowSortPanel(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: `1px solid ${sorts.length > 0 ? '#7C3AED' : M.inBd}`, borderRadius: 6, background: sorts.length > 0 ? 'rgba(124,58,237,.1)' : M.inBg, color: sorts.length > 0 ? '#7C3AED' : M.tB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
          ⇅ Sort
          {sorts.length > 0 && <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 10, padding: '1px 5px', fontSize: 8, fontWeight: 900 }}>{sorts.length}</span>}
        </button>

        {/* Filter toggle */}
        <button onClick={() => setShowFP(p => !p)} style={{ padding: '5px 10px', border: `1px solid ${showFP || Object.values(filters).some(v => v) ? '#7C3AED' : M.inBd}`, borderRadius: 6, background: showFP || Object.values(filters).some(v => v) ? 'rgba(124,58,237,.1)' : M.inBg, color: showFP || Object.values(filters).some(v => v) ? '#7C3AED' : M.tB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
          ⚡ Filter
        </button>

        {/* Columns */}
        <button onClick={() => setShowCM(p => !p)} onContextMenu={e => { e.preventDefault(); setShowColPanel(true); }}
          title="Click: column pills  ·  Right-click: column panel"
          style={{ padding: '5px 10px', border: `1px solid ${hiddenC.length > 0 || showCM ? '#7C3AED' : M.inBd}`, borderRadius: 6, background: hiddenC.length > 0 || showCM ? 'rgba(124,58,237,.1)' : M.inBg, color: hiddenC.length > 0 || showCM ? '#7C3AED' : M.tB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {colLabel}
        </button>

        {/* Group by */}
        <select value={groupBy || ''} onChange={e => { setGroupBy(e.target.value || null); setSubGroupBy(null); }}
          style={{ padding: '4px 6px', border: `1px solid ${groupBy ? '#f59e0b' : M.inBd}`, borderRadius: 6, background: groupBy ? 'rgba(245,158,11,.1)' : M.inBg, color: groupBy ? '#f59e0b' : M.tB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, outline: 'none', flexShrink: 0 }}>
          <option value="">⊞ Group by…</option>
          {CAT_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        {groupBy && (
          <select value={subGroupBy || ''} onChange={e => setSubGroupBy(e.target.value || null)}
            style={{ padding: '4px 6px', border: `1px solid ${subGroupBy ? '#f59e0b' : M.inBd}`, borderRadius: 6, background: subGroupBy ? 'rgba(245,158,11,.1)' : M.inBg, color: subGroupBy ? '#f59e0b' : M.tB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, outline: 'none', flexShrink: 0 }}>
            <option value="">↳ Sub-group…</option>
            {CAT_FIELDS.filter(f => f.key !== groupBy).map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        )}

        {/* Export */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowExportMenu(p => !p)} style={{ padding: '5px 10px', border: `1px solid ${M.inBd}`, borderRadius: 6, background: M.inBg, color: M.tB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap' }}>
            ↓ Export ▾
          </button>
          {showExportMenu && (
            <>
              <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
              <div style={{ position: 'absolute', top: 36, right: 0, zIndex: 201, background: M.hi, border: `1px solid ${M.div}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.15)', width: 150, overflow: 'hidden' }}>
                {[{ icon: '📄', label: 'PDF' }, { icon: '📊', label: 'Excel (.xlsx)' }, { icon: '🟢', label: 'Google Sheet' }, { icon: '🖨', label: 'Print' }].map(opt => (
                  <button key={opt.label} onClick={() => { setShowExportMenu(false); showToast(`Export as ${opt.label} — coming soon`, 'info'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: M.hi, color: M.tA, fontSize: fz - 3, fontWeight: 700, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = M.hov}
                    onMouseLeave={e => e.currentTarget.style.background = M.hi}>
                    <span>{opt.icon}</span><span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add New — CC_RED */}
        <button onClick={() => showToast('Use "➕ Create Category" tab to add a new category', 'info')}
          style={{ padding: '5px 13px', background: CC_RED, border: 'none', borderRadius: 6, fontSize: fz - 2, fontWeight: 900, color: '#fff', cursor: 'pointer', fontFamily: uff, flexShrink: 0 }}>
          + Add New
        </button>
      </div>

      {/* ── VIEWS BAR ── */}
      <div style={{ background: M.hi, borderBottom: `1px solid ${M.div}`, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, flexWrap: 'wrap', minHeight: 34 }}>
        <span style={{ fontSize: 8, fontWeight: 900, color: M.tD, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: uff, marginRight: 2 }}>VIEWS:</span>

        {/* Default pill — CC_RED when active */}
        <div onClick={() => handleViewClick('Default')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 14, border: `1px solid ${activeViewName === 'Default' ? CC_RED : M.inBd}`, background: activeViewName === 'Default' ? '#CC000015' : M.mid, cursor: 'pointer', fontSize: 9, fontWeight: 800, color: activeViewName === 'Default' ? CC_RED : M.tB, fontFamily: uff }}>
          {activeViewName === 'Default' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: CC_RED, flexShrink: 0 }} />}
          Default
          <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 4, background: M.tD, color: '#fff' }}>LOCKED</span>
          {activeViewName === 'Default' && viewDirty && (
            <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 4, background: '#f59e0b', color: '#fff' }}>MODIFIED</span>
          )}
        </div>

        {/* Saved view pills */}
        {savedViews.map(view => {
          const isActive   = activeViewName === view.name;
          const isRenaming = renamingView === view.name;
          return (
            <div key={view.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 14, border: `1px solid ${isActive ? A.a : M.inBd}`, background: isActive ? A.al : M.mid, fontSize: 9, fontWeight: 700, color: isActive ? A.a : M.tB, fontFamily: uff }}>
              {isRenaming ? (
                <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const n = renameVal.trim();
                      if (n && n !== view.name && !savedViews.some(v => v.name === n) && n !== 'Default') {
                        setSavedViews(prev => prev.map(v => v.name === view.name ? { ...v, name: n } : v));
                        if (activeViewName === view.name) setActiveViewName(n);
                        showToast(`View renamed to "${n}"`, 'view');
                      }
                      setRenamingView(null);
                    }
                    if (e.key === 'Escape') setRenamingView(null);
                  }}
                  onBlur={() => setRenamingView(null)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 80, fontSize: 9, padding: '1px 4px', border: `1px solid ${A.a}`, borderRadius: 4, fontFamily: uff, outline: 'none', background: M.inBg, color: M.tA }}
                />
              ) : (
                <span onClick={() => handleViewClick(view.name)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: A.a, flexShrink: 0 }} />}
                  {view.name}
                  {isActive && viewDirty && <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 4, background: '#f59e0b', color: '#fff' }}>MODIFIED</span>}
                </span>
              )}
              {!isRenaming && (
                <>
                  <span onClick={e => { e.stopPropagation(); setRenamingView(view.name); setRenameVal(view.name); }} title="Rename" style={{ cursor: 'pointer', fontSize: 10, color: M.tD, padding: '0 2px' }}>✎</span>
                  <span onClick={e => { e.stopPropagation(); setShowViewEdit({ mode: 'duplicate', view }); }} title="Duplicate" style={{ cursor: 'pointer', fontSize: 10, color: M.tD, padding: '0 2px' }}>⧉</span>
                  <span onClick={e => { e.stopPropagation(); handleDeleteView(view.name); }} title="Delete" style={{ cursor: 'pointer', fontSize: 11, color: '#ef4444', padding: '0 2px' }}>×</span>
                  {isActive && viewDirty && (
                    <span onClick={e => { e.stopPropagation(); handleUpdateView(); }} style={{ cursor: 'pointer', fontSize: 8, fontWeight: 900, padding: '1px 5px', background: '#f59e0b', color: '#fff', borderRadius: 4, marginLeft: 2 }}>💾 Update</span>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Inline save view */}
        {showInlineSave ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input autoFocus value={inlineSaveName} onChange={e => setInlineSaveName(e.target.value)}
              placeholder="View name…"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const n = inlineSaveName.trim();
                  if (n && n !== 'Default' && !savedViews.some(v => v.name === n)) {
                    handleViewSave({ name: n, ...getCurrentSnap() });
                  }
                  setShowInlineSave(false); setInlineSaveName('');
                }
                if (e.key === 'Escape') { setShowInlineSave(false); setInlineSaveName(''); }
              }}
              onBlur={() => { setShowInlineSave(false); setInlineSaveName(''); }}
              style={{ width: 100, fontSize: 9, padding: '3px 6px', border: '1px solid #7C3AED', borderRadius: 10, fontFamily: uff, outline: 'none', background: M.inBg, color: M.tA }}
            />
            <span style={{ fontSize: 8.5, color: M.tD, fontFamily: uff }}>↵ Enter</span>
          </div>
        ) : (
          <button onClick={() => { setShowInlineSave(true); setInlineSaveName(''); }}
            style={{ padding: '3px 9px', border: '1px dashed #7C3AED', borderRadius: 14, background: 'rgba(124,58,237,.05)', color: '#7C3AED', fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>
            + Save View
          </button>
        )}
      </div>

      {/* ── SORT STRIP ── */}
      {sorts.length > 0 && (
        <div style={{ background: 'rgba(124,58,237,.06)', borderBottom: '1px solid rgba(124,58,237,.2)', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: uff }}>SORTED BY:</span>
          {sorts.map((s, i) => {
            const f = CAT_FIELDS.find(fl => fl.key === s.col);
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: M.hi, border: '1px solid rgba(124,58,237,.3)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: '#7C3AED', fontFamily: uff }}>
                {f?.label || s.col} {s.dir === 'asc' ? '↑' : '↓'}
                <span onClick={() => setSorts(prev => prev.filter((_,j) => j !== i))} style={{ cursor: 'pointer', color: M.tD, fontSize: 11 }}>×</span>
              </span>
            );
          })}
          <button onClick={() => setSorts([])} style={{ fontSize: 9, color: M.tD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff }}>Clear all</button>
        </div>
      )}

      {/* ── GROUP STRIP ── */}
      {groupBy && (
        <div style={{ background: 'rgba(245,158,11,.06)', borderBottom: '1px solid rgba(245,158,11,.2)', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', fontFamily: uff }}>GROUPED BY:</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: M.tA, fontFamily: uff }}>{CAT_FIELDS.find(f => f.key === groupBy)?.label || groupBy}</span>
          {subGroupBy && (
            <><span style={{ fontSize: 9, color: M.tD, fontFamily: uff }}>then by</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: M.tA, fontFamily: uff }}>{CAT_FIELDS.find(f => f.key === subGroupBy)?.label || subGroupBy}</span></>
          )}
          <button onClick={() => { setGroupBy(null); setSubGroupBy(null); }} style={{ fontSize: 9, color: '#f59e0b', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff }}>× Clear</button>
        </div>
      )}

      {/* ── FILTER PANEL ── */}
      {showFP && (
        <div style={{ background: M.hi, borderBottom: '1px solid rgba(124,58,237,.2)', padding: '6px 14px', display: 'flex', alignItems: 'flex-end', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: uff, marginRight: 4, paddingBottom: 2 }}>🔍 FILTERS:</span>
          {visCols.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 7.5, fontWeight: 900, color: M.tD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</span>
              <input value={filters[f.key] || ''} onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder="Filter…"
                style={{ width: 84, padding: '3px 6px', border: `1px solid ${filters[f.key] ? '#7C3AED' : M.inBd}`, borderRadius: 4, fontSize: fz - 3, fontFamily: uff, outline: 'none', background: M.inBg, color: M.tA }} />
            </div>
          ))}
          <button onClick={() => setFilters({})} style={{ fontSize: 8.5, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, paddingBottom: 4 }}>× Clear</button>
        </div>
      )}

      {/* ── COLUMN PILLS ── */}
      {showCM && (
        <div style={{ background: M.hi, borderBottom: `1px solid ${M.div}`, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: A.a, fontFamily: uff, marginRight: 4 }}>⫿ COLUMNS:</span>
          {CAT_FIELDS.map(f => {
            const isHidden = hiddenC.includes(f.key);
            return (
              <button key={f.key} onClick={() => setHiddenC(prev => isHidden ? prev.filter(k => k !== f.key) : [...prev, f.key])}
                style={{ padding: '2px 9px', border: `1px solid ${isHidden ? M.inBd : A.a}`, borderRadius: 12, background: isHidden ? M.mid : A.al, color: isHidden ? M.tD : A.a, fontSize: 9, fontWeight: isHidden ? 400 : 700, cursor: 'pointer', fontFamily: uff }}>
                {isHidden ? '○ ' : '● '}{f.label}
              </button>
            );
          })}
          <button onClick={() => setHiddenC([])} style={{ fontSize: 8.5, color: M.tD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff }}>Show all</button>
        </div>
      )}

      {/* ── TABLE AREA ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%', width: 'max-content' }}>
          <colgroup>
            <col style={{ width: 32 }} />{/* checkbox */}
            <col style={{ width: 36 }} />{/* # */}
            {visCols.map(f => <col key={f.key} style={{ width: colW(f) }} />)}
            <col style={{ width: 80 }} />{/* actions */}
          </colgroup>

          {/* ── HEADERS ── */}
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: M.thd }}>
              <th style={{ padding: `${pyV}px 8px`, borderBottom: `2px solid ${M.div}`, borderRight: `1px solid ${M.div}`, textAlign: 'center' }}>
                <div onClick={toggleAll} style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allSelected ? A.a : M.inBd}`, background: allSelected ? A.a : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  {allSelected && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900 }}>✓</span>}
                </div>
              </th>
              <th style={{ padding: `${pyV}px 6px`, borderBottom: `2px solid ${M.div}`, borderRight: `1px solid ${M.div}`, fontSize: 9, fontWeight: 900, color: M.tD, textAlign: 'center' }}>#</th>
              {visCols.map((f, fi) => {
                const activeSort = sorts.find(s => s.col === f.key);
                const isDropTgt  = colDropIdx === fi && colDragIdx !== null && colDragIdx !== fi;
                return (
                  <th key={f.key} draggable onDragStart={() => onColDragStart(fi)} onDragOver={e => onColDragOver(e, fi)} onDrop={() => onColDrop(fi)} onDragEnd={() => { setColDragIdx(null); setColDropIdx(null); }}
                    onClick={() => handleHeaderClick(f.key)}
                    style={{ padding: `${pyV}px 8px`, borderBottom: `2px solid ${M.div}`, borderRight: `1px solid ${M.div}`, borderLeft: isDropTgt ? '3px solid #f59e0b' : undefined, textAlign: 'left', cursor: 'pointer', userSelect: 'none', background: activeSort ? 'rgba(124,58,237,.08)' : M.thd, opacity: colDragIdx === fi ? 0.45 : 1, whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { if (colDragIdx === null) e.currentTarget.style.background = M.hov; }}
                    onMouseLeave={e => { if (colDragIdx === null) e.currentTarget.style.background = activeSort ? 'rgba(124,58,237,.08)' : M.thd; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: fz - 2, fontWeight: 700, color: fi === 0 ? A.a : activeSort ? '#7C3AED' : M.tA }}>{f.label}</span>
                      <span style={{ fontSize: 9, color: activeSort ? '#7C3AED' : M.tD }}>{activeSort ? (activeSort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </div>
                  </th>
                );
              })}
              <th style={{ padding: `${pyV}px 6px`, borderBottom: `2px solid ${M.div}`, fontSize: 9, fontWeight: 900, color: M.tD, textAlign: 'center' }}>ACT</th>
            </tr>
          </thead>

          {/* ── ROWS ── */}
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={visCols.length + 3} style={{ padding: 32, textAlign: 'center', color: M.tD, fontSize: 12, fontFamily: uff }}>
                {data.length === 0 ? 'No categories found.' : `No results for "${search}"`}
              </td></tr>
            ) : renderList.map(item => {
              if (item.type === 'group') {
                return (
                  <tr key={item.key} style={{ background: '#1e293b' }}>
                    <td colSpan={visCols.length + 3} style={{ padding: `${pyV}px 12px`, fontWeight: 900, fontSize: fz - 2, color: '#e2e8f0', fontFamily: uff }}>
                      <span style={{ marginRight: 6 }}>{CAT_FIELDS.find(f => f.key === groupBy)?.label}:</span>
                      <span style={{ color: '#cbd5e1' }}>{item.value}</span>
                      <span style={{ marginLeft: 10, fontSize: 8.5, fontWeight: 900, padding: '1px 6px', borderRadius: 8, background: CC_RED, color: '#fff' }}>{item.count}</span>
                    </td>
                  </tr>
                );
              }
              if (item.type === 'subgroup') {
                return (
                  <tr key={item.key} style={{ background: '#334155' }}>
                    <td colSpan={visCols.length + 3} style={{ padding: `${pyV}px 12px`, paddingLeft: 28, fontWeight: 700, fontSize: fz - 3, color: '#cbd5e1', fontFamily: uff }}>
                      <span style={{ marginRight: 5, color: '#94a3b8' }}>↳</span>
                      <span style={{ marginRight: 6 }}>{CAT_FIELDS.find(f => f.key === subGroupBy)?.label}:</span>
                      <span style={{ color: '#94a3b8' }}>{item.value}</span>
                      <span style={{ marginLeft: 8, fontSize: 8.5, fontWeight: 900, padding: '1px 6px', borderRadius: 8, background: '#7C3AED', color: '#fff' }}>{item.count}</span>
                    </td>
                  </tr>
                );
              }
              const { row, rowIdx } = item;
              const isSelected = selectedRows.has(row.code);
              const mc = masterColor(row.master);
              return (
                <tr key={row.code}
                  style={{ background: isSelected ? A.al : rowIdx % 2 === 0 ? M.tev : M.tod, borderBottom: `1px solid ${M.div}`, opacity: row.active === 'Yes' ? 1 : 0.55, transition: 'background .1s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = M.hov; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = rowIdx % 2 === 0 ? M.tev : M.tod; }}
                >
                  <td style={{ padding: `${pyV}px 8px`, borderRight: `1px solid ${M.div}`, textAlign: 'center' }}>
                    <div onClick={() => toggleRow(row.code)} style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${isSelected ? A.a : M.inBd}`, background: isSelected ? A.a : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900 }}>✓</span>}
                    </div>
                  </td>
                  <td style={{ padding: `${pyV}px 6px`, borderRight: `1px solid ${M.div}`, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: M.tD, textAlign: 'center' }}>{String(rowIdx + 1).padStart(2, '0')}</td>
                  {visCols.map((f, fi) => (
                    <td key={f.key} onClick={() => setDetailRow(row)}
                      style={{ padding: `${pyV}px 8px`, borderRight: `1px solid ${M.div}`, cursor: 'pointer', overflow: 'hidden', maxWidth: colW(f) }}>
                      {f.key === 'code'
                        ? <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: fz - 2, fontWeight: 700, color: mc }}>{row.code}</span>
                        : renderCell(f, row[f.key])}
                    </td>
                  ))}
                  <td style={{ padding: `${pyV}px 6px`, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button onClick={e => { e.stopPropagation(); onEdit(row); }} style={{ fontSize: 9, fontWeight: 700, color: A.a, background: A.al, border: 'none', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontFamily: uff, marginRight: 3 }}>Edit</button>
                    <button onClick={e => { e.stopPropagation(); onToggleActive(row.code); }} title={row.active === 'Yes' ? 'Deactivate' : 'Activate'}
                      style={{ width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', background: row.active === 'Yes' ? '#15803D' : M.inBd, position: 'relative', transition: 'background .2s' }}>
                      <div style={{ width: 12, height: 12, borderRadius: 6, background: '#fff', position: 'absolute', top: 3, left: row.active === 'Yes' ? 17 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── AGG FOOTER ── */}
          <tfoot>
            <tr style={{ background: M.mid, borderTop: `2px solid ${M.div}` }}>
              <td style={{ padding: `${pyV}px 8px`, borderRight: `1px solid ${M.div}`, textAlign: 'center', background: '#ede9fe' }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#7C3AED' }}>Σ</span>
              </td>
              <td style={{ padding: `${pyV}px 6px`, borderRight: `1px solid ${M.div}`, fontSize: 8, fontWeight: 900, color: '#7C3AED', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", background: '#ede9fe' }}>AGG</td>
              {visCols.map(f => {
                const fn     = aggs[f.key];
                const hasAgg = fn && fn !== 'none';
                const val    = hasAgg ? calcAgg(fn, f.key, sorted) : null;
                const lbl    = hasAgg ? AGG_FNS.find(a => a.id === fn)?.label : '+ Calc';
                const col    = hasAgg ? (AGG_COLORS[fn] || A.a) : M.tD;
                return (
                  <td key={f.key} style={{ padding: `${pyV - 1}px 4px`, borderRight: `1px solid ${M.div}` }}>
                    <button onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setAggAnchor({ col: f.key, rect }); }}
                      style={{ width: '100%', textAlign: 'left', fontSize: 8.5, fontWeight: hasAgg ? 700 : 400, color: col, background: hasAgg ? `${col}15` : 'transparent', border: `1px dashed ${hasAgg ? col : M.inBd}`, borderRadius: 3, padding: '2px 6px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono',monospace" }}>
                      {val ? `${lbl}: ${val}` : lbl}
                    </button>
                  </td>
                );
              })}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── STATUS BAR ── */}
      <div style={{ background: M.mid, borderTop: `1px solid ${M.div}`, padding: '3px 14px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        {[
          { l: 'RECORDS',  v: data.length },
          { l: 'FILTERED', v: filtered.length },
          { l: 'SELECTED', v: selectedRows.size },
          { l: 'SORTS',    v: sorts.length },
          { l: 'COLS',     v: `${visCols.length}/${CAT_FIELDS.length}` },
          { l: 'VIEW',     v: activeViewName + (viewDirty ? '*' : '') },
        ].map(s => (
          <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 7.5, fontWeight: 900, color: M.tD, letterSpacing: 1, textTransform: 'uppercase', fontFamily: uff }}>{s.l}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: M.tB, fontFamily: "'IBM Plex Mono',monospace" }}>{s.v}</span>
          </div>
        ))}
        <div style={{ flex: 1, textAlign: 'right', fontSize: 8.5, color: M.tD, fontFamily: "'IBM Plex Mono',monospace" }}>ITEM_CATEGORIES · FILE 1A</div>
      </div>

      {/* ── AGG DROPDOWN (upward, 1.5px #c4b5fd) ── */}
      {aggAnchor && (
        <>
          <div onMouseDown={() => setAggAnchor(null)} style={{ position: 'fixed', inset: 0, zIndex: 500 }} />
          <div onMouseDown={e => e.stopPropagation()} style={{ position: 'fixed', bottom: window.innerHeight - aggAnchor.rect.top + 4, left: Math.max(8, Math.min(aggAnchor.rect.left, window.innerWidth - 190)), zIndex: 501, background: M.hi, border: '1.5px solid #c4b5fd', borderRadius: 8, boxShadow: '0 -4px 24px rgba(0,0,0,.18)', width: 185, overflow: 'hidden' }}>
            <div style={{ background: '#1e293b', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#e2e8f0', fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.5 }}>{CAT_FIELDS.find(f => f.key === aggAnchor.col)?.label || aggAnchor.col}</span>
              <span onClick={() => setAggAnchor(null)} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}>×</span>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {AGG_GROUPS.map(grp => (
                <div key={grp.label}>
                  <div style={{ padding: '5px 12px 3px', fontSize: 8, fontWeight: 900, color: grp.color, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: uff, borderTop: `1px solid ${M.div}` }}>{grp.label}</div>
                  {grp.items.map(fnId => {
                    const fn = AGG_FNS.find(a => a.id === fnId);
                    const isActive = aggs[aggAnchor.col] === fnId;
                    const fnColor  = AGG_COLORS[fnId] || M.tA;
                    const val      = isActive ? calcAgg(fnId, aggAnchor.col, sorted) : null;
                    return (
                      <button key={fnId} onClick={() => { setAggs(prev => ({ ...prev, [aggAnchor.col]: fnId })); setAggAnchor(null); }}
                        style={{ display: 'flex', width: '100%', textAlign: 'left', alignItems: 'center', padding: '6px 12px', border: 'none', borderLeft: isActive ? `3px solid ${fnColor}` : '3px solid transparent', background: isActive ? `${fnColor}12` : M.hi, color: isActive ? fnColor : M.tA, fontSize: fz - 2, fontWeight: isActive ? 900 : 400, cursor: 'pointer', fontFamily: uff }}>
                        <span style={{ flex: 1 }}>{fn?.label}</span>
                        {isActive && val && <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 5px', background: fnColor, color: '#fff', borderRadius: 4 }}>{val}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ padding: '6px 10px', borderTop: `1px solid ${M.div}`, display: 'flex', gap: 6 }}>
              <button onClick={() => { setAggs(prev => ({ ...prev, [aggAnchor.col]: 'none' })); setAggAnchor(null); }} style={{ flex: 1, padding: '4px 8px', border: '1px solid #fecaca', borderRadius: 4, background: '#fef2f2', color: '#ef4444', fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>Remove</button>
              <button onClick={() => setAggAnchor(null)} style={{ flex: 1, padding: '4px 8px', border: `1px solid ${M.inBd}`, borderRadius: 4, background: M.inBg, color: M.tB, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* ── SORT PANEL ── */}
      {showSortPanel && (
        <SortPanel fields={CAT_FIELDS} sorts={sorts} onSorts={setSorts} onClose={() => setShowSortPanel(false)} M={M} A={A} uff={uff} fz={fz} />
      )}

      {/* ── COLUMN PANEL ── */}
      {showColPanel && (
        <ColumnPanel fields={CAT_FIELDS} colOrder={colOrder} hiddenC={hiddenC} onApply={(o, h) => { setColOrder(o); setHiddenC(h); }} onClose={() => setShowColPanel(false)} M={M} A={A} uff={uff} fz={fz} />
      )}

      {/* ── RECORD DETAIL MODAL ── */}
      {detailRow && (
        <RecordDetailModal record={detailRow} schema={CAT_SCHEMA} onClose={() => setDetailRow(null)} onEdit={row => { setDetailRow(null); onEdit(row); }} M={M} A={A} uff={uff} dff={dff} fz={fz} />
      )}

      {/* ── VIEW EDIT MODAL ── */}
      {showViewEdit && (
        <ViewEditModal view={showViewEdit.view} mode={showViewEdit.mode} allFields={CAT_FIELDS} existingNames={['Default', ...savedViews.map(v => v.name)]} onSave={handleViewSave} onCancel={() => setShowViewEdit(null)} M={M} A={A} uff={uff} fz={fz} />
      )}

      {/* ── SWITCH GUARD MODAL ── */}
      {switchGuard && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', zIndex: 1200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 360, background: M.hi, borderRadius: 12, border: `1px solid ${M.div}`, zIndex: 1201, boxShadow: M.shadow, overflow: 'hidden' }}>
            <div style={{ background: '#f59e0b', padding: '14px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: uff }}>Unsaved Changes</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.85)', fontFamily: uff, marginTop: 3 }}>View "{activeViewName}" has been modified</div>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeViewName !== 'Default' && (
                <button onClick={() => { handleUpdateView(); const t = switchGuard.targetViewName; setSwitchGuard(null); if (t === 'Default') loadView({ name: 'Default' }); else { const v = savedViews.find(sv => sv.name === t); if (v) loadView(v); } }}
                  style={{ padding: '9px 14px', border: 'none', borderRadius: 7, background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}>
                  💾 Save → switch to "{switchGuard.targetViewName}"
                </button>
              )}
              <button onClick={() => { const t = switchGuard.targetViewName; setSwitchGuard(null); if (t === 'Default') loadView({ name: 'Default' }); else { const v = savedViews.find(sv => sv.name === t); if (v) loadView(v); } }}
                style={{ padding: '9px 14px', border: `1px solid ${M.inBd}`, borderRadius: 7, background: M.inBg, color: M.tB, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}>
                Discard → switch to "{switchGuard.targetViewName}"
              </button>
              <button onClick={() => setSwitchGuard(null)} style={{ padding: '9px 14px', border: 'none', borderRadius: 7, background: M.mid, color: M.tA, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}>
                ← Stay on "{activeViewName}"
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════
// MATRIX VIEW — Pivot grid: L1 rows × L2 columns, cells = L3 count
// ══════════════════════════════════════════════════════════════════════
function MatrixView({ data, M, A, uff, dff, fz = 13 }) {
  const [drillCell, setDrillCell] = useState(null);

  const l1List = useMemo(() => [...new Set(data.map(r => r.l1))], [data]);
  const l2List = useMemo(() => [...new Set(data.map(r => r.l2))], [data]);

  const matrix = useMemo(() => {
    const m = {};
    data.forEach(r => {
      if (!m[r.l1]) m[r.l1] = {};
      if (!m[r.l1][r.l2]) m[r.l1][r.l2] = [];
      m[r.l1][r.l2].push(r);
    });
    return m;
  }, [data]);

  const maxCount = useMemo(() => {
    let max = 0;
    l1List.forEach(l1 => l2List.forEach(l2 => { const c = matrix[l1]?.[l2]?.length || 0; if (c > max) max = c; }));
    return max;
  }, [matrix, l1List, l2List]);

  const masterColor = (l1) => {
    const entry = Object.values(CATEGORY_HIERARCHY).find(h => h.l1Fixed === l1 || (h.l1Options && h.l1Options.includes(l1)));
    return entry?.color || A.a;
  };

  const statItems = [
    { l: 'MASTERS',      v: l1List.length },
    { l: 'SUB-GROUPS',   v: l2List.length },
    { l: 'TOTAL CATS',   v: data.length },
    { l: 'FILLED CELLS', v: l1List.reduce((a, l1) => a + l2List.filter(l2 => matrix[l1]?.[l2]?.length).length, 0) },
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
              <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 900, color: M.tD, fontFamily: uff, letterSpacing: 0.5, borderRight: `2px solid ${M.div}`, minWidth: 180, position: 'sticky', left: 0, background: M.thd, zIndex: 2 }}>
                L1 ↓ / L2 →
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
            {l1List.map((l1, ri) => {
              const mc = masterColor(l1);
              const rowTotal = l2List.reduce((a, l2) => a + (matrix[l1]?.[l2]?.length || 0), 0);
              return (
                <tr key={l1} style={{ background: ri % 2 === 0 ? M.tev : M.tod, borderBottom: `1px solid ${M.div}` }}>
                  <td style={{ padding: '7px 14px', fontSize: fz - 2, fontWeight: 800, color: mc, fontFamily: uff, borderRight: `2px solid ${M.div}`, position: 'sticky', left: 0, background: ri % 2 === 0 ? M.tev : M.tod, zIndex: 1, whiteSpace: 'nowrap' }}>
                    {l1}
                  </td>
                  {l2List.map(l2 => {
                    const items = matrix[l1]?.[l2] || [];
                    const cnt   = items.length;
                    const alpha = cnt > 0 ? Math.round((cnt / maxCount) * 30 + 12) : 0;
                    return (
                      <td key={l2} onClick={() => cnt && setDrillCell({ l1, l2, items })}
                        style={{ padding: '6px 8px', textAlign: 'center', borderRight: `1px solid ${M.div}`, cursor: cnt ? 'pointer' : 'default', background: cnt ? `${mc}${alpha.toString(16).padStart(2, '0')}` : 'transparent', transition: 'filter .12s' }}>
                        {cnt > 0 ? (
                          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: fz, fontWeight: 900, color: mc }}>{cnt}</span>
                            <span style={{ fontSize: 7, color: M.tD, fontFamily: uff }}>items</span>
                          </span>
                        ) : <span style={{ color: M.tD, fontSize: fz - 3 }}>—</span>}
                      </td>
                    );
                  })}
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: fz, fontWeight: 900, color: mc, fontFamily: dff, borderLeft: `2px solid ${M.div}` }}>
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: M.thd, borderTop: `2px solid ${M.div}` }}>
              <td style={{ padding: '8px 14px', fontSize: 9, fontWeight: 900, color: M.tD, fontFamily: uff, letterSpacing: 0.5, borderRight: `2px solid ${M.div}`, position: 'sticky', left: 0, background: M.thd, zIndex: 1 }}>TOTAL</td>
              {l2List.map(l2 => {
                const cnt = l1List.reduce((a, l1) => a + (matrix[l1]?.[l2]?.length || 0), 0);
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
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 460, maxHeight: '80vh', background: M.hi, borderRadius: 12, border: `1px solid ${M.div}`, zIndex: 1101, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: masterColor(drillCell.l1), display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontFamily: uff }}>{drillCell.l1} › {drillCell.l2}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.8)', fontFamily: uff }}>{drillCell.items.length} items</div>
              </div>
              <button onClick={() => setDrillCell(null)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {drillCell.items.map(item => (
                  <div key={item.code} style={{ padding: '7px 12px', borderRadius: 8, background: M.mid, border: `1px solid ${M.div}`, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: masterColor(drillCell.l1), fontFamily: dff }}>{item.code}</span>
                    <span style={{ fontSize: fz - 1, fontWeight: 700, color: M.tA, fontFamily: uff }}>{item.l3}</span>
                    <span style={{ fontSize: 8.5, color: M.tD, fontFamily: uff }}>HSN: {item.hsn}</span>
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


// ══════════════════════════════════════════════════════════════════════
// TREEMAP VIEW — Proportional CSS blocks, click master to drill L2
// ══════════════════════════════════════════════════════════════════════
function TreemapView({ data, M, A, uff, dff, fz = 13 }) {
  const [drillMaster, setDrillMaster] = useState(null);

  const masterGroups = useMemo(() => {
    const g = {};
    data.forEach(r => {
      if (!g[r.master]) {
        const h = CATEGORY_HIERARCHY[r.master];
        g[r.master] = { master: r.master, l1: r.l1, count: 0, items: [], color: h?.color || A.a, icon: h?.icon || '📁', l2s: {} };
      }
      g[r.master].count++;
      g[r.master].items.push(r);
      if (!g[r.master].l2s[r.l2]) g[r.master].l2s[r.l2] = 0;
      g[r.master].l2s[r.l2]++;
    });
    return Object.values(g).sort((a, b) => b.count - a.count);
  }, [data]);

  const total = data.length;
  const drillData = drillMaster ? masterGroups.find(g => g.master === drillMaster) : null;

  return (
    <div style={{ padding: 20 }}>
      {/* Legend pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {masterGroups.map(g => (
          <div key={g.master} onClick={() => setDrillMaster(drillMaster === g.master ? null : g.master)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 16, background: drillMaster === g.master ? `${g.color}30` : `${g.color}14`, border: `1.5px solid ${drillMaster === g.master ? g.color : g.color + '40'}`, cursor: 'pointer', transition: 'all .12s' }}>
            <span style={{ fontSize: 11 }}>{g.icon}</span>
            <span style={{ fontSize: 8.5, fontWeight: 900, color: g.color, fontFamily: uff }}>{g.master}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: M.tD, fontFamily: dff, marginLeft: 2 }}>{g.count}</span>
          </div>
        ))}
        {drillMaster && (
          <button onClick={() => setDrillMaster(null)} style={{ marginLeft: 'auto', padding: '4px 12px', border: `1px solid ${M.inBd}`, borderRadius: 6, background: M.inBg, color: M.tB, fontSize: 9.5, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>
            ← All Masters
          </button>
        )}
      </div>

      {!drillData ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 420, alignContent: 'flex-start' }}>
          {masterGroups.map(g => {
            const pct = (g.count / total) * 100;
            return (
              <div key={g.master} onClick={() => setDrillMaster(g.master)}
                style={{ flex: `${pct} ${pct} ${Math.max(pct * 9, 130)}px`, minHeight: 130, maxHeight: 250, background: `${g.color}15`, border: `2px solid ${g.color}55`, borderRadius: 12, cursor: 'pointer', padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'transform .13s, box-shadow .13s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${g.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ fontSize: 22 }}>{g.icon}</div>
                <div style={{ fontSize: fz - 1, fontWeight: 900, color: g.color, fontFamily: uff, marginTop: 6 }}>{g.l1 || g.master}</div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: M.tC, fontFamily: uff }}>{g.master}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: `${g.color}35`, fontFamily: dff, position: 'absolute', bottom: 6, right: 10, lineHeight: 1 }}>{g.count}</div>
                <div style={{ marginTop: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap', paddingBottom: 4 }}>
                  {Object.entries(g.l2s).slice(0, 4).map(([l2, cnt]) => (
                    <span key={l2} style={{ fontSize: 7.5, padding: '1px 6px', borderRadius: 8, background: `${g.color}22`, color: g.color, fontFamily: uff, fontWeight: 700 }}>
                      {l2.length > 13 ? l2.slice(0, 13) + '…' : l2} ({cnt})
                    </span>
                  ))}
                  {Object.keys(g.l2s).length > 4 && <span style={{ fontSize: 7.5, color: M.tD, fontFamily: uff }}>+{Object.keys(g.l2s).length - 4} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 900, color: drillData.color, fontFamily: uff, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{drillData.icon}</span>
            {drillData.l1 || drillData.master}
            <span style={{ fontSize: 10, fontWeight: 700, color: M.tD, fontFamily: uff }}>— {drillData.count} categories · {Object.keys(drillData.l2s).length} sub-groups</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 300, alignContent: 'flex-start' }}>
            {Object.entries(drillData.l2s).sort((a, b) => b[1] - a[1]).map(([l2, cnt]) => {
              const pct = (cnt / drillData.count) * 100;
              const l3items = drillData.items.filter(r => r.l2 === l2);
              return (
                <div key={l2} style={{ flex: `${pct} ${pct} ${Math.max(pct * 7, 140)}px`, minHeight: 110, background: `${drillData.color}15`, border: `2px solid ${drillData.color}55`, borderRadius: 10, padding: 12, overflow: 'hidden' }}>
                  <div style={{ fontSize: fz - 1, fontWeight: 900, color: drillData.color, fontFamily: uff, marginBottom: 3 }}>{l2}</div>
                  <div style={{ fontSize: 9, color: M.tD, fontFamily: uff, marginBottom: 8 }}>{cnt} item{cnt !== 1 ? 's' : ''}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {l3items.map(item => (
                      <div key={item.code} style={{ fontSize: 9.5, color: M.tB, fontFamily: uff, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 8, color: M.tD, fontFamily: dff }}>{item.code}</span>
                        <span style={{ color: M.tD }}>·</span>
                        <span>{item.l3}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════
// AUDIT LOG VIEW — Timeline of add/edit/delete/toggle events
// ══════════════════════════════════════════════════════════════════════
function AuditLogView({ auditLog, M, A, uff, dff, fz = 13 }) {
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
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: M.tA, fontFamily: uff, letterSpacing: 0.3 }}>CHANGE HISTORY</div>
        <div style={{ flex: 1 }} />
        {['ALL', 'ADD', 'EDIT', 'DELETE', 'IMPORT', 'TOGGLE'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            style={{ padding: '3px 10px', border: `1px solid ${filterType === t ? A.a : M.inBd}`, borderRadius: 14, background: filterType === t ? A.al : M.inBg, color: filterType === t ? A.a : M.tB, fontSize: 8.5, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>
            {t}
          </button>
        ))}
        <div style={{ fontSize: 9.5, color: M.tD, fontFamily: uff }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Timeline */}
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


// ───────────────────────────────────────────────────────────────
// OC Layout 1 — Column Navigator (Finder / macOS-style)
// 3 linked columns: Masters → Sub-groups → Items
// ───────────────────────────────────────────────────────────────
function OC_ColumnNav({ hierarchy, M, A, uff, dff, fz }) {
  const [selL1, setSelL1] = useState(hierarchy[0]?.label || null);
  const [selL2, setSelL2] = useState(null);

  const l1Node    = hierarchy.find(h => h.label === selL1) || null;
  const l2entries = l1Node ? Object.entries(l1Node.l2s) : [];
  const l3items   = (selL2 && l1Node) ? (l1Node.l2s[selL2] || []) : [];

  useMemo(() => {
    if (l2entries.length > 0) setSelL2(l2entries[0][0]);
    else setSelL2(null);
  }, [selL1]);  // eslint-disable-line

  const colHd = { padding: '8px 14px', borderBottom: `1px solid ${M.div}`, fontSize: 8, fontWeight: 900, color: M.tD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.6, background: M.thd, position: 'sticky', top: 0, zIndex: 2 };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 220px)', minHeight: 480 }}>
      {/* ── Col 1: L1 Masters ── */}
      <div style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${M.div}`, overflowY: 'auto', background: M.mid }}>
        <div style={colHd}>Masters ({hierarchy.length})</div>
        {hierarchy.map(l1 => {
          const isA = selL1 === l1.label;
          const cnt = Object.values(l1.l2s).flat().length;
          return (
            <div key={l1.label} onClick={() => setSelL1(l1.label)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderLeft: `3px solid ${isA ? l1.color : 'transparent'}`, background: isA ? `${l1.color}15` : 'transparent', cursor: 'pointer', borderBottom: `1px solid ${M.div}` }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{l1.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: fz - 1, fontWeight: isA ? 900 : 600, color: isA ? l1.color : M.tA, fontFamily: uff, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l1.label}</div>
                <div style={{ fontSize: 8, color: M.tD, fontFamily: uff }}>{cnt} items · {Object.keys(l1.l2s).length} groups</div>
              </div>
              <span style={{ fontSize: 10, color: isA ? l1.color : M.tD, flexShrink: 0 }}>{isA ? '▶' : '›'}</span>
            </div>
          );
        })}
      </div>

      {/* ── Col 2: L2 Sub-groups ── */}
      <div style={{ width: 230, flexShrink: 0, borderRight: `1px solid ${M.div}`, overflowY: 'auto' }}>
        {l1Node ? (
          <>
            <div style={{ ...colHd, background: `${l1Node.color}18`, color: l1Node.color, borderBottom: `2px solid ${l1Node.color}40` }}>
              {l1Node.label} — {l2entries.length} sub-groups
            </div>
            {l2entries.map(([l2, items]) => {
              const isA = selL2 === l2;
              return (
                <div key={l2} onClick={() => setSelL2(l2)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderLeft: `3px solid ${isA ? l1Node.color : 'transparent'}`, background: isA ? M.hi : 'transparent', cursor: 'pointer', borderBottom: `1px solid ${M.div}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: fz - 1, fontWeight: isA ? 800 : 600, color: isA ? l1Node.color : M.tA, fontFamily: uff }}>{l2}</div>
                    <div style={{ fontSize: 8, color: M.tD, fontFamily: uff }}>{items.length} items</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, padding: '1px 7px', borderRadius: 10, background: `${l1Node.color}20`, color: l1Node.color, fontFamily: dff }}>{items.length}</span>
                  <span style={{ fontSize: 10, color: isA ? l1Node.color : M.tD }}>{isA ? '▶' : '›'}</span>
                </div>
              );
            })}
          </>
        ) : <div style={{ padding: 20, color: M.tD, fontFamily: uff, fontSize: 11 }}>← Select a master</div>}
      </div>

      {/* ── Col 3: L3 Items ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {l1Node && selL2 ? (
          <>
            <div style={{ ...colHd, background: `${l1Node.color}10`, color: l1Node.color, borderBottom: `2px solid ${l1Node.color}30` }}>
              {selL1} › {selL2} — {l3items.length} items
            </div>
            {l3items.map((item, i) => (
              <div key={item.code} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px', borderBottom: `1px solid ${M.div}`, background: i % 2 === 0 ? M.tev : M.tod }}>
                <span style={{ fontSize: 9.5, fontWeight: 900, color: l1Node.color, fontFamily: dff, flexShrink: 0, minWidth: 70 }}>{item.code}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fz, fontWeight: 700, color: M.tA, fontFamily: uff }}>{item.l3}</div>
                  <div style={{ fontSize: 8.5, color: M.tD, fontFamily: uff }}>HSN: {item.hsn} · {item.behavior}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 9px', borderRadius: 10, background: item.active === 'Yes' ? '#d1fae5' : '#fee2e2', color: item.active === 'Yes' ? '#065f46' : '#991b1b', fontFamily: uff, flexShrink: 0 }}>
                  {item.active === 'Yes' ? '● Active' : '○ Inactive'}
                </span>
              </div>
            ))}
          </>
        ) : <div style={{ padding: 20, color: M.tD, fontFamily: uff, fontSize: 11 }}>← Select a sub-group</div>}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// OC Layout 2 — Classic Tree (original default — collapsible grid)
// L1 master cards, collapsible L2 sub-groups, L3 leaf items
// Zoom controls + Expand All / Collapse All
// ───────────────────────────────────────────────────────────────
function OC_ClassicTree({ hierarchy, data, M, A, uff, dff, fz }) {
  const [zoom, setZoom]           = useState(100);
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

  const zBtnS = { width: 26, height: 26, border: `1px solid ${M.inBd}`, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: uff };
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
        <div style={{ marginLeft: 'auto', fontSize: 9, color: M.tD, fontFamily: uff }}>{hierarchy.length} masters · {data.length} categories</div>
      </div>

      {/* Tree cards — horizontal scroll only; each column has its own vertical scroll */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', display: 'flex', gap: 10, flexWrap: 'nowrap', alignItems: 'flex-start', minWidth: 'max-content', height: '100%' }}>
        {hierarchy.map(l1Node => {
          const l1Key  = l1Node.label;
          const l1Col  = collapsed[l1Key];
          const l2list = Object.entries(l1Node.l2s);
          const total  = l2list.reduce((a, [, v]) => a + v.length, 0);
          return (
            <div key={l1Key} style={{ minWidth: 320, maxWidth: 400, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* L1 node — pinned header */}
              <div onClick={() => toggle(l1Key)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 10, background: `${l1Node.color}18`, border: `2px solid ${l1Node.color}60`, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
                <span style={{ fontSize: 24 }}>{l1Node.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fz + 2, fontWeight: 900, color: l1Node.color, fontFamily: uff }}>{l1Node.label}</div>
                  <div style={{ fontSize: 10, color: M.tD, fontFamily: uff }}>{l2list.length} groups · {total} items</div>
                </div>
                <span style={{ fontSize: 13, color: l1Node.color, fontWeight: 900, fontFamily: uff }}>{l1Col ? '▶' : '▾'}</span>
              </div>

              {/* L2 children — independently scrollable so L1 header stays locked */}
              {!l1Col && (
                <div style={{ flex: 1, overflowY: 'auto', marginLeft: 20, borderLeft: `2px solid ${l1Node.color}40`, paddingLeft: 14, marginTop: 8 }}>
                  {l2list.map(([l2, l3items], l2i) => {
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
                            <div style={{ fontSize: 10, color: M.tD, fontFamily: uff }}>{l3items.length} item{l3items.length !== 1 ? 's' : ''}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 900, color: l1Node.color, fontFamily: dff }}>{l3items.length}</span>
                        </div>

                        {/* L3 leaf items */}
                        {!l2Col && (
                          <div style={{ marginLeft: 16, borderLeft: `2px solid ${M.div}`, paddingLeft: 12, marginTop: 3 }}>
                            {l3items.map((item, l3i) => (
                              <div key={item.code}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, marginTop: l3i === 0 ? 4 : 3, background: M.tev, border: `1px solid ${M.div}` }}>
                                <span style={{ fontSize: 10, color: M.tD, fontFamily: dff, flexShrink: 0 }}>{item.code}</span>
                                <span style={{ fontSize: fz, fontWeight: 700, color: M.tB, fontFamily: uff, flex: 1 }}>{item.l3}</span>
                                <span style={{ fontSize: 11, fontWeight: 900, color: item.active === 'Yes' ? '#15803d' : '#dc2626', flexShrink: 0 }}>
                                  {item.active === 'Yes' ? '●' : '○'}
                                </span>
                              </div>
                            ))}
                          </div>
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

// ───────────────────────────────────────────────────────────────
// OC Layout 3 — Flow Diagram (top-down tree with connecting lines)
// Select a master pill → see full L1→L2→L3 tree with CSS lines
// ───────────────────────────────────────────────────────────────
function OC_FlowDiagram({ hierarchy, M, A, uff, dff, fz }) {
  const [activeMaster, setActiveMaster] = useState(hierarchy[0]?.label || null);
  const [zoom, setZoom] = useState(100);

  const NW = 130, NH = 52, HG = 16, VG = 52;
  const l1Node = hierarchy.find(h => h.label === activeMaster) || null;

  const zBtnS = { width: 26, height: 26, border: `1px solid ${M.inBd}`, borderRadius: 5, background: M.inBg, color: M.tB, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: uff };

  return (
    <div style={{ padding: 20 }}>
      {/* Master selector + zoom controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {hierarchy.map(l1 => (
          <div key={l1.label} onClick={() => setActiveMaster(l1.label)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 20, border: `2px solid ${activeMaster === l1.label ? l1.color : l1.color + '35'}`, background: activeMaster === l1.label ? `${l1.color}20` : `${l1.color}08`, cursor: 'pointer', transition: 'all .12s' }}>
            <span style={{ fontSize: 14 }}>{l1.icon}</span>
            <span style={{ fontSize: 10, fontWeight: activeMaster === l1.label ? 900 : 600, color: l1.color, fontFamily: uff }}>{l1.label}</span>
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
          <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 20 }}>
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: totalW, paddingBottom: 40 }}>

              {/* L1 root */}
              <div style={{ padding: '12px 28px', borderRadius: 12, background: `${l1Node.color}20`, border: `2px solid ${l1Node.color}`, display: 'inline-flex', alignItems: 'center', gap: 12, boxShadow: `0 4px 16px ${l1Node.color}30` }}>
                <span style={{ fontSize: 22 }}>{l1Node.icon}</span>
                <div>
                  <div style={{ fontSize: fz + 1, fontWeight: 900, color: l1Node.color, fontFamily: uff }}>{l1Node.label}</div>
                  <div style={{ fontSize: 9, color: M.tD, fontFamily: uff }}>{l1Node.master} · {l2entries.reduce((a, [, v]) => a + v.length, 0)} total items</div>
                </div>
              </div>

              {/* Vertical stem */}
              <div style={{ width: 2, height: 32, background: lineC }} />

              {/* L2 row */}
              <div style={{ position: 'relative', display: 'flex', gap: 0, width: totalW, alignItems: 'flex-start' }}>
                {/* Horizontal bridge */}
                {n > 1 && <div style={{ position: 'absolute', top: 0, left: NW / 2, width: (n - 1) * (NW + HG), height: 2, background: lineC }} />}

                {l2entries.map(([l2, l3items], i) => (
                  <div key={l2} style={{ width: NW, marginLeft: i > 0 ? HG : 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Vertical drop to L2 */}
                    <div style={{ width: 2, height: 32, background: lineC }} />

                    {/* L2 node */}
                    <div style={{ width: NW, padding: '8px 10px', borderRadius: 9, background: M.mid, border: `1.5px solid ${l1Node.color}60`, textAlign: 'center', boxShadow: `0 2px 8px ${l1Node.color}15` }}>
                      <div style={{ fontSize: fz - 1, fontWeight: 900, color: l1Node.color, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l2}</div>
                      <div style={{ fontSize: 8, color: M.tD, fontFamily: uff, marginTop: 1 }}>{l3items.length} item{l3items.length !== 1 ? 's' : ''}</div>
                    </div>

                    {/* Vertical drop to L3 */}
                    <div style={{ width: 2, height: 20, background: lineC }} />

                    {/* L3 chips column */}
                    <div style={{ width: NW + 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {l3items.map(item => (
                        <div key={item.code} title={`${item.code}  ·  HSN: ${item.hsn}`}
                          style={{ padding: '5px 9px', borderRadius: 7, background: item.active === 'Yes' ? `${l1Node.color}14` : '#f9fafb', border: `1px solid ${item.active === 'Yes' ? l1Node.color + '40' : '#e5e7eb'}`, textAlign: 'center', cursor: 'default' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: item.active === 'Yes' ? l1Node.color : '#9ca3af', fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.l3}</div>
                          <div style={{ fontSize: 7.5, color: M.tD, fontFamily: dff, marginTop: 1 }}>{item.code}</div>
                        </div>
                      ))}
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
