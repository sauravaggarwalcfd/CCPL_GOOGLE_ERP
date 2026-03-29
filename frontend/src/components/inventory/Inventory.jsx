/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CC_ERP_Inventory_Module.jsx                                         ║
 * ║  Version: 2.0  |  Mar 2026 — V4 Features Merged                      ║
 * ║  FILE 3: INVENTORY — Stock Ledger · Movements · Transfer · Adjust    ║
 * ║                                                                       ║
 * ║  V2 ADDITIONS:                                                        ║
 * ║  • Thumbnail + hover preview in Records table + Record Detail header  ║
 * ║  • Clickable Item Code → full Notion-style Record Detail page         ║
 * ║  • 13 Linked Database Tables (all clickable → child detail pages)     ║
 * ║  • ABC Classification + Days Remaining + Smart Reorder Card + Tags    ║
 * ║  • Stock Trend Sparkline (30-day SVG) + Cost Trend Chart              ║
 * ║  • Batch/Lot Traceability Tree with clickable timeline                ║
 * ║  • Comments & Activity Panel (Notion-style @mentions, threads)        ║
 * ║                                                                       ║
 * ║  4 Sub-Modules:                                                       ║
 * ║  📊 STOCK_LEDGER      — 22 fields, current balance per item+location ║
 * ║  🔄 STOCK_MOVEMENTS   — 20 fields, immutable IN/OUT transaction log  ║
 * ║  🚛 STOCK_TRANSFER    — 20 fields, inter-warehouse transfer orders   ║
 * ║  📋 STOCK_ADJUSTMENTS — 19 fields, physical count reconciliation     ║
 * ║                                                                       ║
 * ║  12 FK Relations: REL-055 → REL-066                                   ║
 * ║  Poly-FK routing: FABRIC/YARN/WOVEN/TRIM/CONSUMABLE/PACKAGING/ARTICLE║
 * ║  Cross-file: WAREHOUSE_MASTER (1B), STORAGE_BIN_MASTER (1B),         ║
 * ║              PO_MASTER (FILE 2)                                       ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, Component } from "react";
import StockIssueTabNew from './StockIssue';

const CC_RED = "#CC0000";

// ═══════════════════════════════════════════════════════════
//  THEME & ACCENT TOKENS  — never hardcode elsewhere
// ═══════════════════════════════════════════════════════════
const MODES = {
  light:    { bg:"#f0f2f5", sh:"#fff", shBd:"#e2e4e8", sbBg:"#fff", sbBd:"#e2e4e8", hi:"#fff", mid:"#f7f8fa", lo:"#f0f2f5", hov:"#eef1f8", inBg:"#fff", inBd:"#d1d5db", div:"#e5e7eb", thd:"#f4f5f7", tev:"#fff", tod:"#fafbfc", bBg:"#e5e7eb", bTx:"#374151", tA:"#111827", tB:"#374151", tC:"#6b7280", tD:"#9ca3af", scr:"#d1d5db", shadow:"0 4px 20px rgba(0,0,0,.09)", lbl:"☀️ Light" },
  black:    { bg:"#000", sh:"#0a0a0a", shBd:"#1c1c1c", sbBg:"#0a0a0a", sbBd:"#1c1c1c", hi:"#111", mid:"#161616", lo:"#0a0a0a", hov:"#1c1c1c", inBg:"#0d0d0d", inBd:"#2a2a2a", div:"#1f1f1f", thd:"#0d0d0d", tev:"#111", tod:"#141414", bBg:"#1c1c1c", bTx:"#888", tA:"#f0f0f0", tB:"#a0a0a0", tC:"#666", tD:"#444", scr:"#2a2a2a", shadow:"0 4px 28px rgba(0,0,0,.85)", lbl:"⬛ Black" },
  midnight: { bg:"#0d1117", sh:"#161b22", shBd:"#21262d", sbBg:"#161b22", sbBd:"#21262d", hi:"#1c2128", mid:"#161b22", lo:"#0d1117", hov:"#21262d", inBg:"#0d1117", inBd:"#30363d", div:"#21262d", thd:"#161b22", tev:"#1c2128", tod:"#161b22", bBg:"#21262d", bTx:"#7d8590", tA:"#e6edf3", tB:"#8b949e", tC:"#6e7681", tD:"#484f58", scr:"#30363d", shadow:"0 4px 24px rgba(0,0,0,.6)", lbl:"🌙 Midnight" },
  warm:     { bg:"#f0ebe0", sh:"#fdf8f0", shBd:"#e4d8c4", sbBg:"#fdf8f0", sbBd:"#e4d8c4", hi:"#fdfaf4", mid:"#f5f0e8", lo:"#ede5d4", hov:"#e8dece", inBg:"#fdfaf4", inBd:"#d4c8b0", div:"#ddd0b8", thd:"#f0ebe0", tev:"#fdfaf4", tod:"#f5f0e8", bBg:"#e4d8c4", bTx:"#4a3c28", tA:"#1c1409", tB:"#5a4a34", tC:"#8a7460", tD:"#b0a090", scr:"#c8b89c", shadow:"0 4px 16px rgba(60,40,10,.12)", lbl:"🌅 Warm" },
  slate:    { bg:"#1a2030", sh:"#252d40", shBd:"#2d3654", sbBg:"#1e2433", sbBd:"#2d3654", hi:"#2a3450", mid:"#222a3e", lo:"#1a2030", hov:"#2d3654", inBg:"#1a2030", inBd:"#2d3654", div:"#2d3654", thd:"#1e2433", tev:"#222a3e", tod:"#1e2433", bBg:"#2d3654", bTx:"#8895b0", tA:"#d8e0f0", tB:"#8895b0", tC:"#5a6680", tD:"#3a4460", scr:"#2d3654", shadow:"0 4px 24px rgba(0,0,0,.5)", lbl:"🔷 Slate" },
};
const ACC = {
  orange: { a:"#E8690A", al:"rgba(232,105,10,.12)",  tx:"#fff", lbl:"🟠 Orange" },
  blue:   { a:"#0078D4", al:"rgba(0,120,212,.12)",   tx:"#fff", lbl:"🔵 Blue"   },
  teal:   { a:"#007C7C", al:"rgba(0,124,124,.12)",   tx:"#fff", lbl:"🩵 Teal"   },
  green:  { a:"#15803D", al:"rgba(21,128,61,.12)",   tx:"#fff", lbl:"🟢 Green"  },
  purple: { a:"#7C3AED", al:"rgba(124,58,237,.12)",  tx:"#fff", lbl:"🟣 Purple" },
  rose:   { a:"#BE123C", al:"rgba(190,18,60,.12)",   tx:"#fff", lbl:"🌹 Rose"   },
};
// View builder icon/color pickers
const VCOLS = [
  {v:"#E8690A",l:"Orange"},{v:"#0078D4",l:"Blue"},{v:"#15803D",l:"Green"},
  {v:"#7C3AED",l:"Purple"},{v:"#BE123C",l:"Rose"},{v:"#854d0e",l:"Amber"},
  {v:"#059669",l:"Teal"},  {v:"#6b7280",l:"Grey"},
];
const VICONS = ["⚡","📋","₹","🧵","🏭","🔖","🎯","✅","📊","📦","🏷️","⚙️","👕","🪡","🔗","🎨","💡","📌","🔑","⚠️"];

// ═══════════════════════════════════════════════════════════
//  FK data sources for Inventory module (mock — replace with GAS)
// ═══════════════════════════════════════════════════════════
const FK = {
  ITEM_MASTER: [
    {v:"FABRIC",     l:"FABRIC — Raw Material Fabric"},
    {v:"YARN",       l:"YARN — Raw Material Yarn"},
    {v:"WOVEN",      l:"WOVEN — Woven/Interlining"},
    {v:"TRIM",       l:"TRIM — All Trims"},
    {v:"CONSUMABLE", l:"CONSUMABLE — Dyes/Chemicals"},
    {v:"PACKAGING",  l:"PACKAGING — Polybags/Cartons"},
    {v:"ARTICLE",    l:"ARTICLE — Finished Garments"},
  ],
  ITEM: [
    {v:"RM-FAB-001", l:"RM-FAB-001 — 100% Cotton Single Jersey",  master:"FABRIC",     uom:"KG",  hsn:"5209", gst:5,  uomP:"KG",   uomC:"KG",   cf:1},
    {v:"RM-FAB-002", l:"RM-FAB-002 — CVC Pique 220 GSM",         master:"FABRIC",     uom:"KG",  hsn:"5209", gst:5,  uomP:"KG",   uomC:"KG",   cf:1},
    {v:"RM-FAB-003", l:"RM-FAB-003 — Poly Fleece 280 GSM",       master:"FABRIC",     uom:"KG",  hsn:"5515", gst:5,  uomP:"KG",   uomC:"KG",   cf:1},
    {v:"RM-YRN-001", l:"RM-YRN-001 — 30s Combed Cotton",         master:"YARN",       uom:"KG",  hsn:"5205", gst:5,  uomP:"KG",   uomC:"CONE", cf:4},
    {v:"RM-YRN-002", l:"RM-YRN-002 — 2/40s CVC 60/40",          master:"YARN",       uom:"KG",  hsn:"5205", gst:5,  uomP:"KG",   uomC:"CONE", cf:3.33},
    {v:"TRM-THD-001",l:"TRM-THD-001 — Coats Epic 120 White",     master:"TRIM",       uom:"CONE",hsn:"5401", gst:12, uomP:"CONE", uomC:"CONE", cf:1},
    {v:"TRM-THD-002",l:"TRM-THD-002 — Coats Epic 120 Black",     master:"TRIM",       uom:"CONE",hsn:"5401", gst:12, uomP:"CONE", uomC:"CONE", cf:1},
    {v:"TRM-LBL-001",l:"TRM-LBL-001 — Main Label Woven",        master:"TRIM",       uom:"PCS", hsn:"5807", gst:12, uomP:"PACK", uomC:"PCS",  cf:1000},
    {v:"TRM-ZIP-001",l:"TRM-ZIP-001 — YKK Nylon 6\" Black",     master:"TRIM",       uom:"PCS", hsn:"9607", gst:18, uomP:"PACK", uomC:"PCS",  cf:50},
    {v:"CON-DYE-001",l:"CON-DYE-001 — Reactive Black HE-B",     master:"CONSUMABLE", uom:"KG",  hsn:"3204", gst:18, uomP:"KG",   uomC:"KG",   cf:1},
    {v:"PKG-PLY-001",l:"PKG-PLY-001 — Poly Bag 12×14 Clear",    master:"PACKAGING",  uom:"PCS", hsn:"3923", gst:18, uomP:"PACK", uomC:"PCS",  cf:100},
    {v:"5249HP",     l:"5249HP — Polo T-shirt CVC Pique",        master:"ARTICLE",    uom:"PCS", hsn:"6105", gst:12, uomP:"PCS",  uomC:"PCS",  cf:1},
    {v:"54568HR",    l:"54568HR — Hoodie Fleece Pullover",        master:"ARTICLE",    uom:"PCS", hsn:"6110", gst:12, uomP:"PCS",  uomC:"PCS",  cf:1},
  ],
  WAREHOUSE: [
    {v:"WH-FAB",   l:"WH-FAB — Fabric Godown"},
    {v:"WH-TRIM",  l:"WH-TRIM — Trim Store"},
    {v:"WH-FG",    l:"WH-FG — Finished Goods Store"},
    {v:"WH-PKG",   l:"WH-PKG — Packaging Store"},
    {v:"WH-CON",   l:"WH-CON — Chemical Store"},
    {v:"WH-REJ",   l:"WH-REJ — Rejection Godown"},
    {v:"WH-TRANS", l:"WH-TRANS — Transit / In-Process"},
  ],
  BIN: [
    {v:"BIN-FAB-R1-L1", l:"BIN-FAB-R1-L1 — Fabric Row1 Level1"},
    {v:"BIN-FAB-R1-L2", l:"BIN-FAB-R1-L2 — Fabric Row1 Level2"},
    {v:"BIN-FAB-R2-L1", l:"BIN-FAB-R2-L1 — Fabric Row2 Level1"},
    {v:"BIN-TRIM-R1-L1",l:"BIN-TRIM-R1-L1 — Trim Row1 Level1"},
    {v:"BIN-FG-R1-L1",  l:"BIN-FG-R1-L1 — FG Row1 Level1"},
  ],
  PO: [
    {v:"PO-2026-0001", l:"PO-2026-0001 — Rajinder Fabrics (Fabric)"},
    {v:"PO-2026-0002", l:"PO-2026-0002 — Coats India (Thread)"},
    {v:"PO-2026-0003", l:"PO-2026-0003 — YKK India (Zipper)"},
  ],
  MOV_TYPE: [
    {v:"GRN Receipt",       l:"GRN Receipt"},
    {v:"Production Issue",  l:"Production Issue"},
    {v:"Production Return", l:"Production Return"},
    {v:"FG Receipt",        l:"FG Receipt"},
    {v:"Sale Dispatch",     l:"Sale Dispatch"},
    {v:"Adjustment IN",     l:"Adjustment IN"},
    {v:"Adjustment OUT",    l:"Adjustment OUT"},
    {v:"Transfer IN",       l:"Transfer IN"},
    {v:"Transfer OUT",      l:"Transfer OUT"},
    {v:"Opening Balance",   l:"Opening Balance"},
  ],
  REF_TYPE: [
    {v:"GRN",        l:"GRN"},
    {v:"Work Order", l:"Work Order"},
    {v:"Dispatch",   l:"Dispatch"},
    {v:"Adjustment", l:"Adjustment"},
    {v:"Transfer",   l:"Transfer"},
    {v:"Manual",     l:"Manual"},
  ],
};

// ═══════════════════════════════════════════════════════════
//  DUAL UOM — conversion helpers
// ═══════════════════════════════════════════════════════════
function getItemUOM(itemCode) {
  const item = FK.ITEM.find(i => i.v === itemCode);
  if (!item) return { uomP:"—", uomC:"—", cf:1, hasDualUOM:false };
  const hasDualUOM = item.uomP !== item.uomC;
  return { uomP: item.uomP, uomC: item.uomC, cf: item.cf, hasDualUOM };
}
function convertQty(qty, itemCode, direction="P2C") {
  const { cf } = getItemUOM(itemCode);
  if (direction === "P2C") return +(qty * cf).toFixed(2);
  return +(qty / cf).toFixed(4);
}

// ═══════════════════════════════════════════════════════════
//  MIP — Material In Purchase (pending PO qty per item)
// ═══════════════════════════════════════════════════════════
const MIP_DATA = {
  "RM-FAB-001": { totalMIP: 500, pos: [
    { po:"PO-2026-0010", supplier:"Rajinder Fabrics", qty:300, received:0, pending:300, expDate:"02-Apr-2026", status:"Open" },
    { po:"PO-2026-0012", supplier:"Punjab Textiles",  qty:200, received:0, pending:200, expDate:"08-Apr-2026", status:"Open" },
  ]},
  "RM-FAB-002": { totalMIP: 800, pos: [
    { po:"PO-2026-0011", supplier:"Rajinder Fabrics", qty:800, received:0, pending:800, expDate:"05-Apr-2026", status:"Open" },
  ]},
  "RM-FAB-003": { totalMIP: 1000, pos: [
    { po:"PO-2026-0013", supplier:"Punjab Textiles",  qty:1000, received:0, pending:1000, expDate:"01-Apr-2026", status:"Open" },
  ]},
  "RM-YRN-001": { totalMIP: 200, pos: [
    { po:"PO-2026-0014", supplier:"Vardhman Yarns",   qty:200, received:0, pending:200, expDate:"10-Apr-2026", status:"Open" },
  ]},
  "TRM-THD-001": { totalMIP: 0, pos: [] },
  "TRM-ZIP-001": { totalMIP: 150, pos: [
    { po:"PO-2026-0015", supplier:"YKK India",        qty:200, received:50, pending:150, expDate:"28-Mar-2026", status:"Partial" },
  ]},
  "PKG-PLY-001": { totalMIP: 0, pos: [] },
  "5249HP":      { totalMIP: 0, pos: [] },
  "CON-DYE-001": { totalMIP: 50, pos: [
    { po:"PO-2026-0016", supplier:"Atul Ltd",          qty:50, received:0, pending:50, expDate:"15-Apr-2026", status:"Open" },
  ]},
  "54568HR":     { totalMIP: 0, pos: [] },
};
function getMIP(itemCode) { return MIP_DATA[itemCode] || { totalMIP:0, pos:[] }; }

// ═══════════════════════════════════════════════════════════
//  ALLOCATION — Stock reserved against WO / SO / JW
//  In production: GAS computes from open WO_BOM + SO_LINES + JW_ORDERS
// ═══════════════════════════════════════════════════════════
const ALLOC_TYPE_COLORS = {
  WO: { bg:"#eff6ff", tx:"#1d4ed8", bd:"#bfdbfe", icon:"🏭", label:"Work Order" },
  SO: { bg:"#f0fdf4", tx:"#15803d", bd:"#bbf7d0", icon:"📦", label:"Sale Order" },
  JW: { bg:"#faf5ff", tx:"#7C3AED", bd:"#c4b5fd", icon:"🔄", label:"Job Work" },
};
const ALLOC_DATA = {
  "RM-FAB-001": { totalAlloc: 400, items: [
    { type:"WO", ref:"WO-2026-0001", desc:"Polo T-shirt — Cutting Batch 1", qty:200, date:"20-Mar-2026", status:"In Progress", article:"5249HP" },
    { type:"WO", ref:"WO-2026-0003", desc:"Round Neck Tee — Cutting Batch 3", qty:200, date:"22-Mar-2026", status:"Planned", article:"54568HR" },
  ]},
  "RM-FAB-002": { totalAlloc: 300, items: [
    { type:"JW", ref:"JW-2026-0008", desc:"Dyeing at Punjab Dyeing — CVC Pique lot", qty:300, date:"18-Mar-2026", status:"Fabric Received", article:"5249HP" },
  ]},
  "RM-FAB-003": { totalAlloc: 0, items: [] },
  "RM-YRN-001": { totalAlloc: 0, items: [] },
  "TRM-THD-001": { totalAlloc: 20, items: [
    { type:"WO", ref:"WO-2026-0001", desc:"Polo Stitching — Thread alloc", qty:20, date:"20-Mar-2026", status:"In Progress", article:"5249HP" },
  ]},
  "TRM-ZIP-001": { totalAlloc: 50, items: [
    { type:"SO", ref:"SO-2026-0045", desc:"Myntra Order — Hoodie Zippers", qty:50, date:"25-Mar-2026", status:"Confirmed", article:"54568HR" },
  ]},
  "PKG-PLY-001": { totalAlloc: 500, items: [
    { type:"SO", ref:"SO-2026-0044", desc:"Myntra Dispatch — Polo packing", qty:300, date:"15-Mar-2026", status:"Confirmed", article:"5249HP" },
    { type:"SO", ref:"SO-2026-0045", desc:"Myntra Dispatch — Hoodie packing", qty:200, date:"25-Mar-2026", status:"Confirmed", article:"54568HR" },
  ]},
  "5249HP": { totalAlloc: 200, items: [
    { type:"SO", ref:"SO-2026-0044", desc:"Myntra Order — 200 Polo CVC Pique", qty:200, date:"15-Mar-2026", status:"Ready to Dispatch", article:"5249HP" },
  ]},
  "54568HR": { totalAlloc: 0, items: [] },
  "CON-DYE-001": { totalAlloc: 10, items: [
    { type:"JW", ref:"JW-2026-0010", desc:"Black dyeing batch — Punjab Dyeing", qty:10, date:"24-Mar-2026", status:"Planned", article:"5249HP" },
  ]},
};
function getAlloc(itemCode) { return ALLOC_DATA[itemCode] || { totalAlloc:0, items:[] }; }

// ═══════════════════════════════════════════════════════════
//  Direction auto-mapping for movement types
// ═══════════════════════════════════════════════════════════
const DIR_MAP = {
  "GRN Receipt":"IN","Production Issue":"OUT","Production Return":"IN",
  "FG Receipt":"IN","Sale Dispatch":"OUT","Adjustment IN":"IN",
  "Adjustment OUT":"OUT","Transfer IN":"IN","Transfer OUT":"OUT","Opening Balance":"IN",
};

// ═══════════════════════════════════════════════════════════
//  STOCK_LEDGER — 22 fields, current balance per item+location
// ═══════════════════════════════════════════════════════════
const STK_LEDGER_FIELDS = [
  {col:"A", ico:"#", h:"Stock Ledger ID",        type:"autocode", req:false, auto:true,  fk:null,        hint:"AUTO. STK-00001"},
  {col:"B", ico:"M", h:"Item Code",              type:"fk",       req:true,  auto:false, fk:"ITEM",      hint:"Item from any master. e.g. RM-FAB-001"},
  {col:"C", ico:"M", h:"Item Master",            type:"fk",       req:true,  auto:false, fk:"ITEM_MASTER",hint:"FABRIC/YARN/WOVEN/TRIM/CONSUMABLE/PACKAGING/ARTICLE"},
  {col:"D", ico:"A", h:"Item Name (Auto)",       type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Code + Master"},
  {col:"E", ico:"A", h:"Item Category (Auto)",   type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills category from item master"},
  {col:"F", ico:"F", h:"Location Code",          type:"fk",       req:true,  auto:false, fk:"WAREHOUSE", hint:"FK → WAREHOUSE_MASTER (FILE 1B)"},
  {col:"G", ico:"A", h:"Location Name (Auto)",   type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Location Code"},
  {col:"H", ico:"F", h:"Bin Code",               type:"fk",       req:false, auto:false, fk:"BIN",       hint:"FK → STORAGE_BIN_MASTER. Optional sub-location."},
  {col:"I", ico:"A", h:"UOM (Auto)",             type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Master. KG/MTR/PCS"},
  {col:"J", ico:"_", h:"Opening Stock",          type:"number",   req:false, auto:false, fk:null,        hint:"Manual entry for migration. Stock at start of period."},
  {col:"K", ico:"C", h:"∑ Total Received",       type:"calc",     req:false, auto:true,  fk:null,        hint:"Sum of all IN movements. GAS auto-sums."},
  {col:"L", ico:"C", h:"∑ Total Issued",         type:"calc",     req:false, auto:true,  fk:null,        hint:"Sum of all OUT movements. GAS auto-sums."},
  {col:"M", ico:"C", h:"∑ Stock On Hand",        type:"calc",     req:false, auto:true,  fk:null,        hint:"=Opening+Received−Issued. GAS formula."},
  {col:"N", ico:"_", h:"Reorder Level",          type:"number",   req:false, auto:false, fk:null,        hint:"Min stock → triggers reorder alert."},
  {col:"O", ico:"_", h:"Reorder Qty",            type:"number",   req:false, auto:false, fk:null,        hint:"Suggested reorder quantity."},
  {col:"P", ico:"C", h:"∑ Stock Alert",          type:"calc",     req:false, auto:true,  fk:null,        hint:"REORDER/OK/EXCESS/CRITICAL. GAS auto."},
  {col:"Q", ico:"A", h:"Last Receipt Date",      type:"auto",     req:false, auto:true,  fk:null,        hint:"← Date of most recent IN movement."},
  {col:"R", ico:"A", h:"Last Issue Date",        type:"auto",     req:false, auto:true,  fk:null,        hint:"← Date of most recent OUT movement."},
  {col:"S", ico:"A", h:"Last GRN No (Auto)",     type:"auto",     req:false, auto:true,  fk:null,        hint:"← Most recent GRN ref number."},
  {col:"T", ico:"C", h:"∑ Stock Value (₹)",      type:"calc",     req:false, auto:true,  fk:null,        hint:"=Stock On Hand × Avg Unit Cost."},
  {col:"U", ico:"_", h:"Avg Unit Cost (₹)",      type:"currency", req:false, auto:false, fk:null,        hint:"Weighted average cost from receipts."},
  {col:"V", ico:"_", h:"Remarks",                type:"textarea", req:false, auto:false, fk:null,        hint:"Stock-specific notes."},
  {col:"W", ico:"A", h:"UOM Purchase (Auto)",    type:"auto",     req:false, auto:true,  fk:null,        hint:"← UOM used for buying. From Item Master."},
  {col:"X", ico:"C", h:"Conv. Factor",           type:"calc",     req:false, auto:true,  fk:null,        hint:"1 Purchase UOM = X × Consumption UOM."},
  {col:"Y", ico:"C", h:"∑ MIP Qty",              type:"calc",     req:false, auto:true,  fk:null,        hint:"Material In Purchase — pending PO qty. Click for breakdown."},
  {col:"Z", ico:"C", h:"∑ Allocated",            type:"calc",     req:false, auto:true,  fk:null,        hint:"Reserved for WO/SO/JW. Click for breakdown. Can be released."},
  {col:"AA",ico:"C", h:"∑ Free Stock",           type:"calc",     req:false, auto:true,  fk:null,        hint:"=On Hand − Allocated. What you can actually use today."},
  {col:"AB",ico:"C", h:"∑ Projected",            type:"calc",     req:false, auto:true,  fk:null,        hint:"=Free Stock + MIP. Total usable including pipeline."},
];

// ═══════════════════════════════════════════════════════════
//  STOCK_MOVEMENTS — 20 fields, immutable IN/OUT log
// ═══════════════════════════════════════════════════════════
const STK_MOVEMENTS_FIELDS = [
  {col:"A", ico:"#", h:"Movement ID",            type:"autocode", req:false, auto:true,  fk:null,        hint:"AUTO. MOV-YYYY-NNNNN"},
  {col:"B", ico:"M", h:"Movement Date",          type:"text",     req:true,  auto:false, fk:null,        hint:"Date of physical movement. DD-MMM-YYYY"},
  {col:"C", ico:"M", h:"Movement Type",          type:"fk",       req:true,  auto:false, fk:"MOV_TYPE",  hint:"GRN Receipt / Production Issue / Transfer etc."},
  {col:"D", ico:"A", h:"Direction (Auto)",        type:"auto",     req:false, auto:true,  fk:null,        hint:"IN/OUT. Auto-set from Movement Type."},
  {col:"E", ico:"M", h:"Item Code",              type:"fk",       req:true,  auto:false, fk:"ITEM",      hint:"Item code from any master."},
  {col:"F", ico:"M", h:"Item Master",            type:"fk",       req:true,  auto:false, fk:"ITEM_MASTER",hint:"FABRIC/YARN/TRIM/CONSUMABLE/PACKAGING/ARTICLE"},
  {col:"G", ico:"A", h:"Item Name (Auto)",       type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS auto-fills from Item Code + Master."},
  {col:"H", ico:"A", h:"UOM (Auto)",             type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Master."},
  {col:"I", ico:"F", h:"From Location",          type:"fk",       req:false, auto:false, fk:"WAREHOUSE", hint:"FK → WAREHOUSE_MASTER. Source for issues/transfers."},
  {col:"J", ico:"F", h:"To Location",            type:"fk",       req:false, auto:false, fk:"WAREHOUSE", hint:"FK → WAREHOUSE_MASTER. Destination for receipts."},
  {col:"K", ico:"M", h:"Quantity",               type:"number",   req:true,  auto:false, fk:null,        hint:"Always positive. Direction determines stock effect."},
  {col:"L", ico:"_", h:"Unit Cost (₹)",          type:"currency", req:false, auto:false, fk:null,        hint:"Cost per UOM at time of movement."},
  {col:"M", ico:"C", h:"∑ Total Value (₹)",      type:"calc",     req:false, auto:true,  fk:null,        hint:"=Qty × Unit Cost. GAS formula."},
  {col:"N", ico:"_", h:"Reference Type",         type:"fk",       req:false, auto:false, fk:"REF_TYPE",  hint:"GRN / Work Order / Dispatch / Adjustment / Manual"},
  {col:"O", ico:"_", h:"Reference No",           type:"text",     req:false, auto:false, fk:null,        hint:"Document no. e.g. GRN-2026-0045"},
  {col:"P", ico:"F", h:"PO Number",              type:"fk",       req:false, auto:false, fk:"PO",        hint:"FK → PO_MASTER (FILE 2). For GRN receipts."},
  {col:"Q", ico:"_", h:"Batch / Lot No",         type:"text",     req:false, auto:false, fk:null,        hint:"Supplier batch/lot for traceability."},
  {col:"R", ico:"#", h:"Created By (Auto)",      type:"autocode", req:false, auto:true,  fk:null,        hint:"Google email. GAS auto-captures."},
  {col:"S", ico:"#", h:"Created Date (Auto)",    type:"autocode", req:false, auto:true,  fk:null,        hint:"GAS auto-sets timestamp."},
  {col:"T", ico:"_", h:"Remarks",                type:"textarea", req:false, auto:false, fk:null,        hint:"Movement notes."},
];

// ═══════════════════════════════════════════════════════════
//  STOCK_TRANSFER — 20 fields, inter-warehouse transfer
// ═══════════════════════════════════════════════════════════
const STK_TRANSFER_FIELDS = [
  {col:"A", ico:"#", h:"Transfer No",            type:"autocode", req:false, auto:true,  fk:null,        hint:"AUTO. TRF-YYYY-NNNN"},
  {col:"B", ico:"M", h:"Transfer Date",          type:"text",     req:true,  auto:false, fk:null,        hint:"Date transfer initiated. DD-MMM-YYYY"},
  {col:"C", ico:"M", h:"Item Code",              type:"fk",       req:true,  auto:false, fk:"ITEM",      hint:"Item from any master."},
  {col:"D", ico:"M", h:"Item Master",            type:"fk",       req:true,  auto:false, fk:"ITEM_MASTER",hint:"FABRIC/YARN/TRIM etc."},
  {col:"E", ico:"A", h:"Item Name (Auto)",       type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Code + Master."},
  {col:"F", ico:"A", h:"UOM (Auto)",             type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Master."},
  {col:"G", ico:"M", h:"From Location",          type:"fk",       req:true,  auto:false, fk:"WAREHOUSE", hint:"FK → WAREHOUSE_MASTER. Source warehouse."},
  {col:"H", ico:"A", h:"From Location Name",     type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from From Location."},
  {col:"I", ico:"M", h:"To Location",            type:"fk",       req:true,  auto:false, fk:"WAREHOUSE", hint:"FK → WAREHOUSE_MASTER. Destination warehouse."},
  {col:"J", ico:"A", h:"To Location Name",       type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from To Location."},
  {col:"K", ico:"M", h:"Transfer Qty",           type:"number",   req:true,  auto:false, fk:null,        hint:"Quantity in item UOM."},
  {col:"L", ico:"_", h:"Received Qty",           type:"number",   req:false, auto:false, fk:null,        hint:"Actual qty received at destination."},
  {col:"M", ico:"C", h:"∑ Variance",             type:"calc",     req:false, auto:true,  fk:null,        hint:"=Transfer Qty − Received Qty."},
  {col:"N", ico:"_", h:"Transfer Status",        type:"dropdown", req:true,  auto:false, fk:null,        hint:"Lifecycle status.",
    opts:[{v:"Draft",l:"Draft"},{v:"In Transit",l:"In Transit"},{v:"Received",l:"Received"},{v:"Cancelled",l:"Cancelled"}]},
  {col:"O", ico:"_", h:"Received Date",          type:"text",     req:false, auto:false, fk:null,        hint:"Date destination confirmed. DD-MMM-YYYY"},
  {col:"P", ico:"_", h:"Transferred By",         type:"text",     req:false, auto:false, fk:null,        hint:"Person who initiated transfer."},
  {col:"Q", ico:"_", h:"Received By",            type:"text",     req:false, auto:false, fk:null,        hint:"Person who confirmed receipt."},
  {col:"R", ico:"#", h:"Created By (Auto)",      type:"autocode", req:false, auto:true,  fk:null,        hint:"Google email. GAS auto."},
  {col:"S", ico:"#", h:"Created Date (Auto)",    type:"autocode", req:false, auto:true,  fk:null,        hint:"GAS auto timestamp."},
  {col:"T", ico:"_", h:"Remarks",                type:"textarea", req:false, auto:false, fk:null,        hint:"Transfer notes. e.g. Urgent, for WO-2026-0015."},
];

// ═══════════════════════════════════════════════════════════
//  STOCK_ADJUSTMENTS — 19 fields, physical count reconciliation
// ═══════════════════════════════════════════════════════════
const STK_ADJUSTMENTS_FIELDS = [
  {col:"A", ico:"#", h:"Adj No",                 type:"autocode", req:false, auto:true,  fk:null,        hint:"AUTO. ADJ-YYYY-NNNN"},
  {col:"B", ico:"M", h:"Adj Date",               type:"text",     req:true,  auto:false, fk:null,        hint:"Date of physical count. DD-MMM-YYYY"},
  {col:"C", ico:"M", h:"Adj Type",               type:"dropdown", req:true,  auto:false, fk:null,        hint:"Reason for adjustment.",
    opts:[{v:"Physical Count",l:"Physical Count"},{v:"Damage Write-off",l:"Damage Write-off"},{v:"Excess Found",l:"Excess Found"},{v:"Return from Production",l:"Return from Production"},{v:"Expired",l:"Expired"},{v:"Sample Usage",l:"Sample Usage"},{v:"Other",l:"Other"}]},
  {col:"D", ico:"M", h:"Item Code",              type:"fk",       req:true,  auto:false, fk:"ITEM",      hint:"Item being adjusted."},
  {col:"E", ico:"M", h:"Item Master",            type:"fk",       req:true,  auto:false, fk:"ITEM_MASTER",hint:"FABRIC/YARN/TRIM etc."},
  {col:"F", ico:"A", h:"Item Name (Auto)",       type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Code + Master."},
  {col:"G", ico:"A", h:"UOM (Auto)",             type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Master."},
  {col:"H", ico:"M", h:"Location Code",          type:"fk",       req:true,  auto:false, fk:"WAREHOUSE", hint:"FK → WAREHOUSE_MASTER. Where counted."},
  {col:"I", ico:"A", h:"Location Name (Auto)",   type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Location Code."},
  {col:"J", ico:"A", h:"System Stock (Auto)",    type:"auto",     req:false, auto:true,  fk:null,        hint:"← Current balance from STOCK_LEDGER."},
  {col:"K", ico:"M", h:"Physical Count",         type:"number",   req:true,  auto:false, fk:null,        hint:"Actual counted stock."},
  {col:"L", ico:"C", h:"∑ Difference",           type:"calc",     req:false, auto:true,  fk:null,        hint:"=Physical−System. +ve=Excess, −ve=Shortage."},
  {col:"M", ico:"C", h:"∑ Value Impact (₹)",     type:"calc",     req:false, auto:true,  fk:null,        hint:"=Difference × Avg Unit Cost."},
  {col:"N", ico:"_", h:"Adj Status",             type:"dropdown", req:true,  auto:false, fk:null,        hint:"Approval status.",
    opts:[{v:"Draft",l:"Draft"},{v:"Pending Approval",l:"Pending Approval"},{v:"Approved",l:"Approved"},{v:"Rejected",l:"Rejected"}]},
  {col:"O", ico:"_", h:"Approved By",            type:"text",     req:false, auto:false, fk:null,        hint:"Manager who approved."},
  {col:"P", ico:"_", h:"Approval Date",          type:"text",     req:false, auto:false, fk:null,        hint:"DD-MMM-YYYY"},
  {col:"Q", ico:"#", h:"Created By (Auto)",      type:"autocode", req:false, auto:true,  fk:null,        hint:"Google email. GAS auto."},
  {col:"R", ico:"#", h:"Created Date (Auto)",    type:"autocode", req:false, auto:true,  fk:null,        hint:"GAS auto timestamp."},
  {col:"S", ico:"_", h:"Remarks",                type:"textarea", req:false, auto:false, fk:null,        hint:"Reason for variance."},
];

// ═══════════════════════════════════════════════════════════
//  STOCK_ISSUE — dynamic fields: common + type-specific + category-specific
// ═══════════════════════════════════════════════════════════
const STK_ISSUE_FIELDS = [
  {col:"A", ico:"#", h:"Issue No",                type:"autocode", req:false, auto:true,  fk:null,        hint:"AUTO. ISS-YYYY-NNNN. Immutable."},
  {col:"B", ico:"M", h:"Issue Date",              type:"text",     req:true,  auto:false, fk:null,        hint:"Date material issued. DD-MMM-YYYY"},
  {col:"C", ico:"M", h:"Issue Type",              type:"dropdown", req:true,  auto:false, fk:null,        hint:"Nature of issue — drives type-specific fields.",
    opts:[{v:"Production Issue",l:"🏭 Production Issue"},{v:"Sample Issue",l:"🧪 Sample Issue"},{v:"Job Work Issue",l:"🏗️ Job Work Issue"},{v:"Wastage / Scrap",l:"🗑️ Wastage / Scrap"},{v:"Sale / Dispatch",l:"🚚 Sale / Dispatch"},{v:"Inter-Warehouse Transfer",l:"🔄 Inter-Warehouse Transfer"},{v:"Return to Supplier",l:"↩️ Return to Supplier"}]},
  {col:"D", ico:"M", h:"Item Code",               type:"fk",       req:true,  auto:false, fk:"ITEM",      hint:"FK → Item Masters. Drives category-specific fields."},
  {col:"E", ico:"A", h:"Item Name (Auto)",         type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Code + Master."},
  {col:"F", ico:"A", h:"Item Master (Auto)",       type:"auto",     req:false, auto:true,  fk:null,        hint:"← FABRIC/YARN/TRIM etc. Determines category fields."},
  {col:"G", ico:"A", h:"Item Category (Auto)",     type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Master."},
  {col:"H", ico:"A", h:"UOM (Auto)",               type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Item Master."},
  {col:"I", ico:"F", h:"From Location",            type:"fk",       req:true,  auto:false, fk:"WAREHOUSE", hint:"FK → WAREHOUSE_MASTER. Source warehouse."},
  {col:"J", ico:"A", h:"From Location Name (Auto)",type:"auto",     req:false, auto:true,  fk:null,        hint:"← GAS fills from Location Code."},
  {col:"K", ico:"M", h:"Issue Qty",                type:"number",   req:true,  auto:false, fk:null,        hint:"Quantity being issued. Always positive."},
  {col:"L", ico:"C", h:"Rate / Unit Cost (Auto)",  type:"calc",     req:false, auto:true,  fk:null,        hint:"← Avg unit cost from Stock Ledger."},
  {col:"M", ico:"C", h:"∑ Issue Value (Auto)",     type:"calc",     req:false, auto:true,  fk:null,        hint:"= Qty × Rate. Auto-calculated."},
  {col:"N", ico:"_", h:"Batch / Lot No",           type:"text",     req:false, auto:false, fk:null,        hint:"Lot/batch/dye-lot for traceability."},
  {col:"O", ico:"_", h:"Issue Status",             type:"dropdown", req:true,  auto:false, fk:null,        hint:"Workflow status.",
    opts:[{v:"Draft",l:"Draft"},{v:"Confirmed",l:"Confirmed"},{v:"Partially Returned",l:"Partially Returned"},{v:"Closed",l:"Closed"},{v:"Cancelled",l:"Cancelled"}]},
  {col:"P", ico:"#", h:"Issued By (Auto)",         type:"autocode", req:false, auto:true,  fk:null,        hint:"Google email. GAS auto."},
  {col:"Q", ico:"#", h:"Created Date (Auto)",      type:"autocode", req:false, auto:true,  fk:null,        hint:"GAS auto timestamp."},
  {col:"R", ico:"_", h:"Remarks",                  type:"textarea", req:false, auto:false, fk:null,        hint:"Issue notes."},
];

// ═══════════════════════════════════════════════════════════
//  STOCK ISSUE — Type-specific & Category-specific field configs
// ═══════════════════════════════════════════════════════════
const ISSUE_TYPE_FIELDS = {
  "Production Issue": [
    {id:"t1",h:"Work Order No",type:"fk",fk:"WORK_ORDER",hint:"FK → WORK_ORDERS"},
    {id:"t2",h:"BOM Reference",type:"fk",fk:"BOM",hint:"FK → BOM_MASTER"},
    {id:"t3",h:"Production Stage",type:"dropdown",opts:["Cutting","Sewing","Finishing","Packing","Washing"],hint:"Stage of production"},
    {id:"t4",h:"Issued To (Dept)",type:"text",hint:"Department receiving material"},
    {id:"t5",h:"Expected Return Qty",type:"number",hint:"If partially returnable"},
  ],
  "Sample Issue": [
    {id:"t1",h:"Sample Ref No",type:"text",hint:"SMP-YYYY-NNN"},
    {id:"t2",h:"Buyer / Party",type:"fk",fk:"SUPPLIER",hint:"FK → SUPPLIER_MASTER or buyer"},
    {id:"t3",h:"Sample Type",type:"dropdown",opts:["Counter","Fit","Pre-production","Lab Dip","Wash Test","Size Set","Salesman"],hint:"Type of sample"},
    {id:"t4",h:"Purpose / Remarks",type:"textarea",hint:"Why this sample is needed"},
    {id:"t5",h:"Returnable?",type:"dropdown",opts:["Yes","No"],hint:"Will material be returned?"},
  ],
  "Job Work Issue": [
    {id:"t1",h:"JW Order No",type:"fk",fk:"JOBWORK",hint:"FK → JOB_WORK_ORDERS"},
    {id:"t2",h:"Job Worker Party",type:"fk",fk:"SUPPLIER",hint:"FK → SUPPLIER_MASTER (job worker)"},
    {id:"t3",h:"Process Type",type:"dropdown",opts:["Dyeing","Printing","Embroidery","Washing","Compacting","Stentering","Calendering"],hint:"Type of processing"},
    {id:"t4",h:"Expected Return Date",type:"text",hint:"DD-MMM-YYYY"},
    {id:"t5",h:"Challan / DC No",type:"text",hint:"Outward delivery challan"},
    {id:"t6",h:"Vehicle No",type:"text",hint:"Transport vehicle number"},
  ],
  "Wastage / Scrap": [
    {id:"t1",h:"Waste Reason",type:"dropdown",opts:["Fabric Defect","Expired Shelf Life","Contamination","Shrinkage Loss","Cutting Waste","Rat Damage","Water Damage","Other"],hint:"Why material is wasted"},
    {id:"t2",h:"QC Report Ref",type:"fk",fk:"QC",hint:"Link to quality check report"},
    {id:"t3",h:"Approved By",type:"text",hint:"Manager who approved write-off"},
    {id:"t4",h:"Disposal Method",type:"dropdown",opts:["Sold as Jhoot","Recycled","Destroyed","Returned to Supplier"],hint:"How waste was disposed"},
    {id:"t5",h:"Scrap Value (if sold)",type:"number",hint:"₹ amount recovered from scrap sale"},
  ],
  "Sale / Dispatch": [
    {id:"t1",h:"Sale Order No",type:"fk",fk:"SALE_ORDER",hint:"FK → SALE_ORDERS"},
    {id:"t2",h:"Delivery Challan No",type:"fk",fk:"DC",hint:"FK → DELIVERY_CHALLANS"},
    {id:"t3",h:"Invoice No",type:"fk",fk:"INVOICE",hint:"FK → INVOICES"},
    {id:"t4",h:"Buyer / Party",type:"fk",fk:"SUPPLIER",hint:"Customer receiving goods"},
    {id:"t5",h:"Transporter",type:"text",hint:"Transport company name"},
    {id:"t6",h:"LR / AWB No",type:"text",hint:"Lorry receipt or airway bill"},
    {id:"t7",h:"Vehicle No",type:"text",hint:"Transport vehicle number"},
  ],
  "Inter-Warehouse Transfer": [
    {id:"t1",h:"To Location Code",type:"fk",fk:"WAREHOUSE",hint:"FK → WAREHOUSE_MASTER"},
    {id:"t2",h:"To Location Name (Auto)",type:"auto",hint:"← GAS fills from To Location Code"},
    {id:"t3",h:"Transfer Reason",type:"dropdown",opts:["Post-GRN Staging","Production Floor","Overflow","Re-organization","Quality Hold"],hint:"Why transferring"},
    {id:"t4",h:"Approved By",type:"text",hint:"Person approving transfer"},
  ],
  "Return to Supplier": [
    {id:"t1",h:"Original PO No",type:"fk",fk:"PO",hint:"FK → PO_MASTER"},
    {id:"t2",h:"Original GRN No",type:"fk",fk:"GRN",hint:"FK → GRN_MASTER"},
    {id:"t3",h:"Supplier",type:"fk",fk:"SUPPLIER",hint:"FK → SUPPLIER_MASTER"},
    {id:"t4",h:"Return Reason",type:"dropdown",opts:["Quality Reject","Excess Quantity","Wrong Item","Damaged in Transit","Expired"],hint:"Why returning"},
    {id:"t5",h:"Debit Note No",type:"text",hint:"Debit note reference"},
    {id:"t6",h:"Supplier Credit",type:"number",hint:"₹ credit amount from supplier"},
  ],
};

const ISSUE_CAT_FIELDS = {
  YARN: [
    {id:"c1",h:"Lot / Dye-Lot No"},{id:"c2",h:"Yarn Count (Ne)"},{id:"c3",h:"Yarn Type",type:"dropdown",opts:["Ring Spun Combed","Ring Spun Carded","Open End","Compact","Vortex"]},
    {id:"c4",h:"No of Cones"},{id:"c5",h:"Weight per Cone (kg)"},{id:"c6",h:"Color / Shade"},{id:"c7",h:"Dye Batch Ref"},{id:"c8",h:"Moisture %"},
  ],
  FABRIC: [
    {id:"c1",h:"Roll No(s)"},{id:"c2",h:"No of Rolls"},{id:"c3",h:"Total Weight (kg)"},{id:"c4",h:"Total Length (mtrs)"},
    {id:"c5",h:"GSM"},{id:"c6",h:"Width (inch)"},{id:"c7",h:"Shrinkage % (L×W)"},{id:"c8",h:"Fabric Type",type:"dropdown",opts:["Single Jersey","Pique","Interlock","Rib","Fleece","Terry","Lycra"]},
    {id:"c9",h:"Color / Shade"},{id:"c10",h:"Dye Lot Ref"},
  ],
  TRIM: [
    {id:"c1",h:"Trim Type",type:"dropdown",opts:["Thread","Zipper","Button","Label","Elastic","Drawcord","Velcro","Tape"]},
    {id:"c2",h:"Color / Shade"},{id:"c3",h:"Size / Specification"},{id:"c4",h:"Brand"},{id:"c5",h:"Pack Qty"},{id:"c6",h:"Match Card Ref"},
  ],
  CONSUMABLE: [
    {id:"c1",h:"Chemical Name"},{id:"c2",h:"Batch No"},{id:"c3",h:"Expiry Date"},{id:"c4",h:"Hazard Class",type:"dropdown",opts:["None","Class 1 — Explosive","Class 2 — Gas","Class 3 — Flammable","Class 4 — Solid","Class 8 — Corrosive","Class 9 — Misc"]},
    {id:"c5",h:"MSDS Ref"},{id:"c6",h:"Storage Condition"},{id:"c7",h:"Purity / Concentration"},
  ],
  PACKAGING: [
    {id:"c1",h:"Size / Dimension"},{id:"c2",h:"Material Type",type:"dropdown",opts:["LDPE","HDPE","PP","Corrugated","Duplex","Kraft"]},
    {id:"c3",h:"Print / Branding"},{id:"c4",h:"GSM / Thickness"},{id:"c5",h:"Qty per Bundle"},{id:"c6",h:"Buyer-Specific?"},{id:"c7",h:"Barcode / SKU"},
  ],
  ARTICLE: [
    {id:"c1",h:"Style / Article Code"},{id:"c2",h:"Size Breakdown"},{id:"c3",h:"Color"},
    {id:"c4",h:"Buyer",type:"fk",fk:"SUPPLIER"},{id:"c5",h:"Season"},{id:"c6",h:"Packed Carton No(s)"},
    {id:"c7",h:"Total Cartons"},{id:"c8",h:"Barcode / EAN"},{id:"c9",h:"MRP Label"},{id:"c10",h:"Wash Care Label?"},
  ],
};

// ═══════════════════════════════════════════════════════════
//  SUB-MODULE REGISTRY — maps sidebar items to field arrays
// ═══════════════════════════════════════════════════════════
const SUB_MODULES = [
  {id:"ledger",   icon:"📊", lbl:"Stock Ledger",      desc:"Current balance per item+location",    fields: STK_LEDGER_FIELDS,     color:"#1B7A3D"},
  {id:"movement", icon:"🔄", lbl:"Stock Movements",   desc:"Immutable IN/OUT transaction log",     fields: STK_MOVEMENTS_FIELDS,  color:"#0E6655"},
  {id:"issue",    icon:"📤", lbl:"Stock Issue",        desc:"Issue material — 7 types × 6 categories",fields: STK_ISSUE_FIELDS,    color:"#BE123C"},
  {id:"transfer", icon:"🚛", lbl:"Stock Transfer",     desc:"Inter-warehouse transfer orders",      fields: STK_TRANSFER_FIELDS,   color:"#0E6655"},
  {id:"adjust",   icon:"📋", lbl:"Stock Adjustments",  desc:"Physical count reconciliation",        fields: STK_ADJUSTMENTS_FIELDS,color:"#7D3C98"},
];

// Active fields pointer (resolved in ModuleApp)
let MODULE_FIELDS = STK_LEDGER_FIELDS;

// ═══════════════════════════════════════════════════════════
//  Section groupings for Form view (per sub-module)
// ═══════════════════════════════════════════════════════════
const SECTIONS_MAP = {
  ledger: [
    {id:"item",    icon:"📦", title:"Item Identity",         cols:["A","B","C","D","E"]},
    {id:"loc",     icon:"🏭", title:"Location",               cols:["F","G","H"]},
    {id:"uom",     icon:"⚖️", title:"UOM & Conversion",       cols:["I","W","X"]},
    {id:"stock",   icon:"📊", title:"Stock Balances",         cols:["J","K","L","M"]},
    {id:"alloc",   icon:"🔒", title:"Allocation & Pipeline",  cols:["Z","AA","Y","AB"]},
    {id:"reorder", icon:"🔔", title:"Reorder Settings",       cols:["N","O","P"]},
    {id:"audit",   icon:"📅", title:"Audit & Value",          cols:["Q","R","S","T","U"]},
    {id:"notes",   icon:"📝", title:"Notes",                  cols:["V"]},
  ],
  movement: [
    {id:"header",  icon:"📋", title:"Movement Header",   cols:["A","B","C","D"]},
    {id:"item",    icon:"📦", title:"Item Details",       cols:["E","F","G","H"]},
    {id:"loc",     icon:"🏭", title:"Locations",          cols:["I","J"]},
    {id:"qty",     icon:"🔢", title:"Quantity & Value",   cols:["K","L","M"]},
    {id:"ref",     icon:"🔗", title:"Reference",          cols:["N","O","P","Q"]},
    {id:"audit",   icon:"📅", title:"Audit",              cols:["R","S"]},
    {id:"notes",   icon:"📝", title:"Notes",              cols:["T"]},
  ],
  transfer: [
    {id:"header",  icon:"📋", title:"Transfer Header",   cols:["A","B"]},
    {id:"item",    icon:"📦", title:"Item Details",       cols:["C","D","E","F"]},
    {id:"route",   icon:"🚛", title:"From → To",          cols:["G","H","I","J"]},
    {id:"qty",     icon:"🔢", title:"Quantities",         cols:["K","L","M"]},
    {id:"status",  icon:"⚙️", title:"Status & People",    cols:["N","O","P","Q"]},
    {id:"audit",   icon:"📅", title:"Audit",              cols:["R","S"]},
    {id:"notes",   icon:"📝", title:"Notes",              cols:["T"]},
  ],
  adjust: [
    {id:"header",  icon:"📋", title:"Adjustment Header", cols:["A","B","C"]},
    {id:"item",    icon:"📦", title:"Item Details",       cols:["D","E","F","G"]},
    {id:"loc",     icon:"🏭", title:"Location",           cols:["H","I"]},
    {id:"count",   icon:"🔢", title:"Count & Variance",   cols:["J","K","L","M"]},
    {id:"approval",icon:"✅", title:"Approval",           cols:["N","O","P"]},
    {id:"audit",   icon:"📅", title:"Audit",              cols:["Q","R"]},
    {id:"notes",   icon:"📝", title:"Notes",              cols:["S"]},
  ],
  issue: [
    {id:"header",  icon:"📤", title:"Issue Header",      cols:["A","B","C"]},
    {id:"item",    icon:"📦", title:"Item Details",       cols:["D","E","F","G","H"]},
    {id:"loc",     icon:"🏭", title:"Location & Qty",     cols:["I","J","K","L","M"]},
    {id:"batch",   icon:"🔗", title:"Batch & Status",     cols:["N","O"]},
    {id:"audit",   icon:"📅", title:"Audit",              cols:["P","Q"]},
    {id:"notes",   icon:"📝", title:"Notes",              cols:["R"]},
  ],
};
const MODULE_SECTIONS = SECTIONS_MAP.ledger;

// ═══════════════════════════════════════════════════════════
//  Mock records per sub-module
// ═══════════════════════════════════════════════════════════
const MOCK_MAP = {
  ledger: [
    {A:"STK-00001",B:"RM-FAB-001",C:"FABRIC",D:"100% Cotton SJ",E:"Fabric",F:"WH-FAB",G:"Fabric Godown",H:"",I:"KG",J:0,K:2500,L:800,M:1700,N:500,O:1000,P:"OK",Q:"15-Mar-2026",R:"12-Mar-2026",S:"GRN-2026-0003",T:"₹4,25,000",U:250,V:"", W:"KG",X:1,Y:500,Z:400,AA:1300,AB:1800},
    {A:"STK-00002",B:"RM-FAB-002",C:"FABRIC",D:"CVC Pique 220",E:"Fabric",F:"WH-FAB",G:"Fabric Godown",H:"BIN-FAB-R1-L1",I:"KG",J:100,K:1800,L:1500,M:400,N:500,O:800,P:"REORDER",Q:"10-Mar-2026",R:"14-Mar-2026",S:"GRN-2026-0002",T:"₹1,40,000",U:350,V:"Low stock — PO raised", W:"KG",X:1,Y:800,Z:300,AA:100,AB:900},
    {A:"STK-00003",B:"TRM-THD-001",C:"TRIM",D:"Coats Epic 120 White",E:"Thread",F:"WH-TRIM",G:"Trim Store",H:"BIN-TRIM-R1-L1",I:"CONE",J:50,K:200,L:180,M:70,N:30,O:50,P:"OK",Q:"08-Mar-2026",R:"11-Mar-2026",S:"GRN-2026-0001",T:"₹10,500",U:150,V:"", W:"CONE",X:1,Y:0,Z:20,AA:50,AB:50},
    {A:"STK-00004",B:"TRM-ZIP-001",C:"TRIM",D:"YKK Nylon 6\" Black",E:"Zipper",F:"WH-TRIM",G:"Trim Store",H:"",I:"PCS",J:0,K:500,L:420,M:80,N:100,O:200,P:"REORDER",Q:"05-Mar-2026",R:"13-Mar-2026",S:"GRN-2026-0001",T:"₹2,400",U:30,V:"", W:"PACK",X:50,Y:150,Z:50,AA:30,AB:180},
    {A:"STK-00005",B:"PKG-PLY-001",C:"PACKAGING",D:"Poly Bag 12×14",E:"Packaging",F:"WH-PKG",G:"Packaging Store",H:"",I:"PCS",J:1000,K:5000,L:3500,M:2500,N:500,O:2000,P:"OK",Q:"12-Mar-2026",R:"14-Mar-2026",S:"GRN-2026-0003",T:"₹12,500",U:5,V:"", W:"PACK",X:100,Y:0,Z:500,AA:2000,AB:2000},
    {A:"STK-00006",B:"5249HP",C:"ARTICLE",D:"Polo T-shirt CVC",E:"Finished Goods",F:"WH-FG",G:"FG Store",H:"BIN-FG-R1-L1",I:"PCS",J:0,K:1200,L:800,M:400,N:100,O:300,P:"OK",Q:"14-Mar-2026",R:"15-Mar-2026",S:"",T:"₹2,40,000",U:600,V:"Season SS26", W:"PCS",X:1,Y:0,Z:200,AA:200,AB:200},
    {A:"STK-00007",B:"CON-DYE-001",C:"CONSUMABLE",D:"Reactive Black HE-B",E:"Dye",F:"WH-CON",G:"Chemical Store",H:"",I:"KG",J:20,K:100,L:95,M:25,N:20,O:50,P:"OK",Q:"01-Mar-2026",R:"10-Mar-2026",S:"GRN-2026-0001",T:"₹37,500",U:1500,V:"", W:"KG",X:1,Y:50,Z:10,AA:15,AB:65},
    {A:"STK-00008",B:"RM-FAB-003",C:"FABRIC",D:"Poly Fleece 280",E:"Fabric",F:"WH-FAB",G:"Fabric Godown",H:"BIN-FAB-R2-L1",I:"KG",J:0,K:600,L:590,M:10,N:200,O:500,P:"CRITICAL",Q:"02-Mar-2026",R:"14-Mar-2026",S:"GRN-2026-0002",T:"₹5,000",U:500,V:"Urgent reorder needed", W:"KG",X:1,Y:1000,Z:0,AA:10,AB:1010},
  ],
  movement: [
    {A:"MOV-2026-00001",B:"01-Mar-2026",C:"GRN Receipt",D:"IN",E:"RM-FAB-001",F:"FABRIC",G:"100% Cotton SJ",H:"KG",I:"",J:"WH-FAB",K:500,L:250,M:"₹1,25,000",N:"GRN",O:"GRN-2026-0001",P:"PO-2026-0001",Q:"LOT-FAB-001",R:"store@ccpl.in",S:"01-Mar-2026 09:15",T:"First fabric receipt"},
    {A:"MOV-2026-00002",B:"03-Mar-2026",C:"Production Issue",D:"OUT",E:"RM-FAB-001",F:"FABRIC",G:"100% Cotton SJ",H:"KG",I:"WH-FAB",J:"WH-TRANS",K:200,L:250,M:"₹50,000",N:"Work Order",O:"WO-2026-0001",P:"",Q:"",R:"factory@ccpl.in",S:"03-Mar-2026 10:30",T:"Issued to cutting"},
    {A:"MOV-2026-00003",B:"05-Mar-2026",C:"GRN Receipt",D:"IN",E:"TRM-THD-001",F:"TRIM",G:"Coats Epic White",H:"CONE",I:"",J:"WH-TRIM",K:100,L:150,M:"₹15,000",N:"GRN",O:"GRN-2026-0002",P:"PO-2026-0002",Q:"LOT-THD-001",R:"store@ccpl.in",S:"05-Mar-2026 14:00",T:"Thread delivery"},
    {A:"MOV-2026-00004",B:"08-Mar-2026",C:"FG Receipt",D:"IN",E:"5249HP",F:"ARTICLE",G:"Polo CVC",H:"PCS",I:"WH-TRANS",J:"WH-FG",K:300,L:600,M:"₹1,80,000",N:"Work Order",O:"WO-2026-0001",P:"",Q:"",R:"factory@ccpl.in",S:"08-Mar-2026 16:45",T:"FG from sewing"},
    {A:"MOV-2026-00005",B:"10-Mar-2026",C:"Sale Dispatch",D:"OUT",E:"5249HP",F:"ARTICLE",G:"Polo CVC",H:"PCS",I:"WH-FG",J:"",K:200,L:800,M:"₹1,60,000",N:"Dispatch",O:"DC-2026-0001",P:"",Q:"",R:"sales@ccpl.in",S:"10-Mar-2026 11:00",T:"Customer dispatch"},
    {A:"MOV-2026-00006",B:"12-Mar-2026",C:"Transfer OUT",D:"OUT",E:"TRM-LBL-001",F:"TRIM",G:"Main Label Woven",H:"PCS",I:"WH-TRIM",J:"WH-TRANS",K:500,L:8,M:"₹4,000",N:"Transfer",O:"TRF-2026-0001",P:"",Q:"",R:"store@ccpl.in",S:"12-Mar-2026 09:00",T:"Labels to sewing floor"},
  ],
  transfer: [
    {A:"TRF-2026-0001",B:"12-Mar-2026",C:"TRM-LBL-001",D:"TRIM",E:"Main Label Woven",F:"PCS",G:"WH-TRIM",H:"Trim Store",I:"WH-TRANS",J:"Transit",K:500,L:500,M:0,N:"Received",O:"12-Mar-2026",P:"store@ccpl.in",Q:"floor@ccpl.in",R:"store@ccpl.in",S:"12-Mar-2026",T:"Labels for WO-2026-0002"},
    {A:"TRF-2026-0002",B:"14-Mar-2026",C:"RM-FAB-001",D:"FABRIC",E:"100% Cotton SJ",F:"KG",G:"WH-FAB",H:"Fabric Godown",I:"WH-TRANS",J:"Transit",K:300,L:0,M:300,N:"In Transit",O:"",P:"store@ccpl.in",Q:"",R:"store@ccpl.in",S:"14-Mar-2026",T:"Fabric for cutting room 2"},
    {A:"TRF-2026-0003",B:"15-Mar-2026",C:"PKG-PLY-001",D:"PACKAGING",E:"Poly Bag 12×14",F:"PCS",G:"WH-PKG",H:"Packaging Store",I:"WH-FG",J:"FG Store",K:1000,L:1000,M:0,N:"Received",O:"15-Mar-2026",P:"store@ccpl.in",Q:"packer@ccpl.in",R:"store@ccpl.in",S:"15-Mar-2026",T:"Polybags for packing"},
  ],
  adjust: [
    {A:"ADJ-2026-0001",B:"10-Mar-2026",C:"Physical Count",D:"RM-FAB-002",E:"FABRIC",F:"CVC Pique 220",G:"KG",H:"WH-FAB",I:"Fabric Godown",J:450,K:440,L:-10,M:"₹-3,500",N:"Approved",O:"saurav@ccpl.in",P:"11-Mar-2026",Q:"store@ccpl.in",R:"10-Mar-2026",S:"Monthly physical count — slight shortage"},
    {A:"ADJ-2026-0002",B:"12-Mar-2026",C:"Damage Write-off",D:"RM-FAB-003",E:"FABRIC",F:"Poly Fleece 280",G:"KG",H:"WH-FAB",I:"Fabric Godown",J:50,K:0,L:-50,M:"₹-25,000",N:"Approved",O:"saurav@ccpl.in",P:"12-Mar-2026",Q:"store@ccpl.in",R:"12-Mar-2026",S:"Water damage from leak — written off"},
    {A:"ADJ-2026-0003",B:"14-Mar-2026",C:"Excess Found",D:"TRM-THD-002",E:"TRIM",F:"Coats Epic Black",G:"CONE",H:"WH-TRIM",I:"Trim Store",J:40,K:45,L:5,M:"₹750",N:"Pending Approval",O:"",P:"",Q:"store@ccpl.in",R:"14-Mar-2026",S:"5 extra cones found in back shelf"},
  ],
  issue: [
    {A:"ISS-2026-0001",B:"05-Mar-2026",C:"Production Issue",D:"RM-FAB-001",E:"100% Cotton SJ",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:200,L:250,M:"₹50,000",N:"LOT-FAB-001",O:"Confirmed",P:"factory@ccpl.in",Q:"05-Mar-2026",R:"Issued to cutting — WO-2026-0001"},
    {A:"ISS-2026-0002",B:"07-Mar-2026",C:"Sample Issue",D:"RM-FAB-002",E:"CVC Pique 220",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:5,L:350,M:"₹1,750",N:"",O:"Confirmed",P:"design@ccpl.in",Q:"07-Mar-2026",R:"Hand-feel sample for H&M buyer visit"},
    {A:"ISS-2026-0003",B:"10-Mar-2026",C:"Job Work Issue",D:"RM-FAB-001",E:"100% Cotton SJ",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:500,L:250,M:"₹1,25,000",N:"LOT-FAB-002",O:"Confirmed",P:"store@ccpl.in",Q:"10-Mar-2026",R:"Sent to Punjab Dyeing — JW-2026-008"},
    {A:"ISS-2026-0004",B:"12-Mar-2026",C:"Wastage / Scrap",D:"RM-FAB-003",E:"Poly Fleece 280",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:15,L:500,M:"₹7,500",N:"",O:"Confirmed",P:"store@ccpl.in",Q:"12-Mar-2026",R:"Water damage — sold as jhoot ₹2500"},
    {A:"ISS-2026-0005",B:"14-Mar-2026",C:"Sale / Dispatch",D:"5249HP",E:"Polo T-shirt CVC",F:"ARTICLE",G:"Finished Goods",H:"PCS",I:"WH-FG",J:"FG Store",K:200,L:800,M:"₹1,60,000",N:"",O:"Confirmed",P:"sales@ccpl.in",Q:"14-Mar-2026",R:"Myntra order — DC-2026-0001"},
    {A:"ISS-2026-0006",B:"15-Mar-2026",C:"Production Issue",D:"TRM-THD-001",E:"Coats Epic 120 White",F:"TRIM",G:"Thread",H:"CONE",I:"WH-TRIM",J:"Trim Store",K:20,L:150,M:"₹3,000",N:"LOT-THD-001",O:"Confirmed",P:"factory@ccpl.in",Q:"15-Mar-2026",R:"Thread for WO-2026-0003"},
    {A:"ISS-2026-0007",B:"16-Mar-2026",C:"Return to Supplier",D:"RM-FAB-002",E:"CVC Pique 220",F:"FABRIC",G:"Fabric",H:"KG",I:"WH-FAB",J:"Fabric Godown",K:50,L:350,M:"₹17,500",N:"LOT-CVC-001",O:"Draft",P:"store@ccpl.in",Q:"16-Mar-2026",R:"Quality reject — holes found, DN-2026-012"},
    {A:"ISS-2026-0008",B:"18-Mar-2026",C:"Production Issue",D:"CON-DYE-001",E:"Reactive Black HE-B",F:"CONSUMABLE",G:"Dye",H:"KG",I:"WH-CON",J:"Chemical Store",K:10,L:1500,M:"₹15,000",N:"CHM-B-034",O:"Confirmed",P:"dye@ccpl.in",Q:"18-Mar-2026",R:"Dyeing batch DB-2026-015"},
  ],
};
const MODULE_MOCK_RECORDS = MOCK_MAP.ledger;

// ═══════════════════════════════════════════════════════════
//  V4 FEATURES — Image Map, Linked Data, ABC, Best Supplier
// ═══════════════════════════════════════════════════════════
const IMG_MAP = {
  "RM-FAB-001":[
    {src:"https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop",label:"Front"},
    {src:"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200&h=200&fit=crop",label:"Texture"},
    {src:"https://images.unsplash.com/photo-1562157873-818bc0726f68?w=200&h=200&fit=crop",label:"Swatch"},
  ],
  "RM-FAB-002":[
    {src:"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200&h=200&fit=crop",label:"Front"},
    {src:"https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop",label:"Close-up"},
  ],
  "RM-FAB-003":[
    {src:"https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=200&h=200&fit=crop",label:"Front"},
    {src:"https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=200&h=200&fit=crop",label:"Swatch"},
    {src:"https://images.unsplash.com/photo-1562157873-818bc0726f68?w=200&h=200&fit=crop",label:"Texture"},
    {src:"https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop",label:"Test Report"},
  ],
  "TRM-THD-001":[
    {src:"https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&h=200&fit=crop",label:"Cone"},
  ],
  "TRM-ZIP-001":[
    {src:"https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=200&h=200&fit=crop",label:"Front"},
    {src:"https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&h=200&fit=crop",label:"Pack"},
  ],
  "PKG-PLY-001":[
    {src:"https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=200&h=200&fit=crop",label:"Pack"},
  ],
  "5249HP":[
    {src:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop",label:"Front"},
    {src:"https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&h=200&fit=crop",label:"Back"},
    {src:"https://images.unsplash.com/photo-1562157873-818bc0726f68?w=200&h=200&fit=crop",label:"Detail"},
    {src:"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop",label:"On Model"},
    {src:"https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=200&h=200&fit=crop",label:"Packaging"},
  ],
  "CON-DYE-001":[
    {src:"https://images.unsplash.com/photo-1611117775350-ac3950990b70?w=200&h=200&fit=crop",label:"Container"},
  ],
};
function getImgs(code) { const arr = IMG_MAP[code]; if (!arr) return []; return Array.isArray(arr) ? arr : [{src:arr,label:"Image"}]; }
function getFirstImg(code) { const imgs = getImgs(code); return imgs.length > 0 ? imgs[0].src : null; }
const CAT_EMOJI = {FABRIC:"🧵",YARN:"🧶",TRIM:"🪡",CONSUMABLE:"🧪",PACKAGING:"📦",ARTICLE:"👕",WOVEN:"🔲"};
const GRP_PALETTE = [
  {c:"#15803d",bg:"#f0fdf4",grad:"linear-gradient(135deg,#15803d,#0d5c2b)"},
  {c:"#7C3AED",bg:"#faf5ff",grad:"linear-gradient(135deg,#7C3AED,#5b21b6)"},
  {c:"#E8690A",bg:"#fff7ed",grad:"linear-gradient(135deg,#E8690A,#c2560a)"},
  {c:"#0078D4",bg:"#eff6ff",grad:"linear-gradient(135deg,#0078D4,#005a9e)"},
  {c:"#854d0e",bg:"#fffbeb",grad:"linear-gradient(135deg,#854d0e,#6b3d0a)"},
  {c:"#BE123C",bg:"#fff1f2",grad:"linear-gradient(135deg,#BE123C,#9f1239)"},
  {c:"#059669",bg:"#ecfdf5",grad:"linear-gradient(135deg,#059669,#047857)"},
  {c:"#6d28d9",bg:"#f5f3ff",grad:"linear-gradient(135deg,#6d28d9,#5b21b6)"},
];
const GRP_EMOJI_MAP = {"FABRIC":"🧵","TRIM":"🪡","ARTICLE":"👕","CONSUMABLE":"🧪","PACKAGING":"📦","YARN":"🧶","WOVEN":"🔲","Thread":"🪡","Zipper":"🪡","Dye":"🧪","Fabric":"🧵","Finished Goods":"👕","Packaging":"📦"};
const ALERT_COLORS = {OK:{bg:"#dcfce7",c:"#15803d"},REORDER:{bg:"#fef3c7",c:"#92400e"},CRITICAL:{bg:"#fef2f2",c:"#991b1b"},EXCESS:{bg:"#eff6ff",c:"#1d4ed8"}};
const ABC_COLORS = {A:{bg:"#fef2f2",c:"#991b1b",l:"A — High Value"},B:{bg:"#fef3c7",c:"#92400e",l:"B — Medium"},C:{bg:"#f0f9ff",c:"#0369a1",l:"C — Low Value"}};
const BEST_SUP = {"RM-FAB-001":{name:"Rajinder Fabrics",rate:250,lead:7},"RM-FAB-002":{name:"Rajinder Fabrics",rate:350,lead:7},"RM-FAB-003":{name:"Punjab Textiles",rate:500,lead:10},"TRM-THD-001":{name:"Coats India",rate:150,lead:5},"TRM-ZIP-001":{name:"YKK India",rate:30,lead:14},"PKG-PLY-001":{name:"Ludhiana Poly",rate:5,lead:3},"CON-DYE-001":{name:"Atul Ltd",rate:1500,lead:10}};

function calcABC(records) {
  const sorted = [...records].sort((a, b) => {
    const va = parseFloat(String(a.T || a.value || 0).replace(/[₹,]/g, "")) || 0;
    const vb = parseFloat(String(b.T || b.value || 0).replace(/[₹,]/g, "")) || 0;
    return vb - va;
  });
  const total = sorted.reduce((s, r) => s + (parseFloat(String(r.T || r.value || 0).replace(/[₹,]/g, "")) || 0), 0);
  let cum = 0;
  return sorted.map(r => {
    cum += parseFloat(String(r.T || r.value || 0).replace(/[₹,]/g, "")) || 0;
    const pct = total > 0 ? cum / total : 1;
    return { ...r, _abc: pct <= 0.7 ? "A" : pct <= 0.9 ? "B" : "C" };
  });
}
function calcDaysRemaining(r) {
  const issue = parseFloat(r.L || r.issue || 0) || 0;
  const onHand = parseFloat(r.M || r.onHand || 0) || 0;
  const days = parseFloat(r.daysActive || 45) || 45;
  const dailyRate = days > 0 ? issue / days : 0;
  return dailyRate > 0 ? Math.round(onHand / dailyRate) : 999;
}
function Rupee(v) { return typeof v === "number" ? "₹" + v.toLocaleString("en-IN") : v; }

/* ── V4 Linked Data for RM-FAB-001 (demo — others get empty) ── */
const V4_LINKED = {
  "RM-FAB-001": {
    stockTrend:[0,0,0,500,500,500,300,300,1300,1300,1300,1300,1100,1100,1100,1100,900,900,900,1900,1900,1900,1900,1900,1500,1500,1500,1500,1700,1700],
    trendDates:["14F","15F","16F","17F","18F","19F","20F","21F","22F","23F","24F","25F","26F","27F","28F","1M","2M","3M","4M","5M","6M","7M","8M","9M","10M","11M","12M","13M","14M","15M"],
    costTrend:[{date:"Nov-25",rate:235},{date:"Dec-25",rate:240},{date:"Feb-26",rate:250},{date:"Mar-26",rate:250},{date:"Mar-26",rate:250}],
    movements:[[" MOV-00001","01-Mar","GRN Receipt","IN",500,"KG","—","WH-FAB","GRN-0001","₹250"],["MOV-00005","03-Mar","Prod Issue","OUT",200,"KG","WH-FAB","WH-TRANS","WO-0001","₹250"],["MOV-00012","08-Mar","GRN Receipt","IN",1000,"KG","—","WH-FAB","GRN-0002","₹250"],["MOV-00018","12-Mar","Prod Issue","OUT",400,"KG","WH-FAB","WH-TRANS","WO-0003","₹250"],["MOV-00025","15-Mar","GRN Receipt","IN",1000,"KG","—","WH-FAB","GRN-0003","₹250"]],
    pos:[["PO-0001","25-Feb","Rajinder",500,"₹250","₹1,25,000","Fully Received"],["PO-0005","05-Mar","Rajinder",1000,"₹250","₹2,50,000","Fully Received"],["PO-0009","12-Mar","Rajinder",1000,"₹250","₹2,50,000","Fully Received"]],
    grns:[["GRN-0001","01-Mar","PO-0001",500,500,0,"LOT-001","Pass"],["GRN-0002","08-Mar","PO-0005",1000,980,20,"LOT-002","Partial Pass"],["GRN-0003","15-Mar","PO-0009",1000,1000,0,"LOT-003","Pass"]],
    transfers:[["TRF-0002","14-Mar","WH-FAB","WH-TRANS",300,"—","In Transit"]],
    qc:[["QC-001","01-Mar","GRN-0001","LOT-001",158,"4.2%","Pass","Within spec"],["QC-002","08-Mar","GRN-0002","LOT-002",162,"5.1%","Partial","GSM over"],["QC-003","15-Mar","GRN-0003","LOT-003",156,"3.9%","Pass","Good lot"]],
    isr:[["ISR-001","Rajinder Fabrics","Cotton SJ 160","₹250","Primary"],["ISR-012","Tirupur Mills","SJ 155 Combed","₹270","Secondary"]],
    returns:[["PRN-001","09-Mar","GRN-0002",20,"Shade variation","Credit Received"]],
    workOrders:[["WO-0001","03-Mar","5249HP Polo",200,"Completed"],["WO-0003","12-Mar","5249HP Polo",400,"In Progress"]],
    bom:[["BOM-5249HP","5249HP Polo CVC",0.28,"KG","5%"]],
    jobwork:[["JW-001","04-Mar","Ravi Dyeing","Dyeing",200,195,5,"Completed"]],
    dispatches:[],adjustments:[],
    comments:[
      {id:"C14",ts:"15-Mar 16:30",user:"Ravi (Store)",av:"RS",col:"#15803d",text:"GRN-0003 received — 1,000 KG good quality.",reacts:["👍"],replies:[]},
      {id:"C11",ts:"09-Mar 11:15",user:"Ankit (QC)",av:"AQ",col:"#7C3AED",text:"@saurav LOT-FAB-002 shade variation — 20 KG rejected. PRN raised.",reacts:["👀","⚠️"],replies:[
        {id:"C11R1",ts:"09-Mar 14:20",user:"Saurav (MD)",av:"SA",col:"#E8690A",text:"Approved return. Ask Rajinder for credit note."},
        {id:"C11R2",ts:"10-Mar 09:00",user:"Ravi (Store)",av:"RS",col:"#15803d",text:"Credit note CN-0001 received. PRN closed."},
      ]},
      {id:"C08",ts:"03-Mar 08:45",user:"Gurpreet (Prod)",av:"GP",col:"#0078D4",text:"Issued 200 KG for WO-0001 (Polo White). Cutting started.",reacts:["✅"],replies:[]},
    ],
    batches:{
      "LOT-FAB-001":[
        {step:"Purchase Order",ref:"PO-0001",date:"25-Feb",detail:"500 KG @ ₹250 from Rajinder",status:"Received",color:"#E8690A",icon:"📦"},
        {step:"GRN Receipt",ref:"GRN-0001",date:"01-Mar",detail:"500 KG received",status:"Pass",color:"#0078D4",icon:"📥"},
        {step:"QC Check",ref:"QC-001",date:"01-Mar",detail:"GSM 158, Shrink 4.2%",status:"Pass",color:"#7C3AED",icon:"🔬"},
        {step:"Stock Inward",ref:"MOV-00001",date:"01-Mar",detail:"500 KG → WH-FAB",status:"IN",color:"#15803d",icon:"📊"},
        {step:"Production",ref:"WO-0001",date:"03-Mar",detail:"200 KG → Polo White Line 1",status:"Completed",color:"#0078D4",icon:"🏭"},
      ],
      "LOT-FAB-002":[
        {step:"Purchase Order",ref:"PO-0005",date:"05-Mar",detail:"1,000 KG @ ₹250",status:"Received",color:"#E8690A",icon:"📦"},
        {step:"GRN",ref:"GRN-0002",date:"08-Mar",detail:"1,000 KG, 20 KG shade var",status:"Partial Pass",color:"#0078D4",icon:"📥"},
        {step:"QC",ref:"QC-002",date:"08-Mar",detail:"GSM 162 (over)",status:"Partial",color:"#7C3AED",icon:"🔬"},
        {step:"Return",ref:"PRN-001",date:"09-Mar",detail:"20 KG returned, CN-0001",status:"Credit Received",color:"#dc2626",icon:"↩️"},
        {step:"Production",ref:"WO-0003",date:"12-Mar",detail:"400 KG → Polo Navy Line 2",status:"In Progress",color:"#0078D4",icon:"🏭"},
      ],
    },
  },
"5249HP":{
  stockTrend:[0,0,0,0,0,0,100,200,300,300,400,400,500,500,600,700,800,800,900,900,1000,1000,1100,1200,1200,800,600,500,400,400],
  trendDates:["14F","15F","16F","17F","18F","19F","20F","21F","22F","23F","24F","25F","26F","27F","28F","1M","2M","3M","4M","5M","6M","7M","8M","9M","10M","11M","12M","13M","14M","15M"],
  costTrend:[{date:"Oct-25",rate:580},{date:"Nov-25",rate:590},{date:"Jan-26",rate:600},{date:"Feb-26",rate:600},{date:"Mar-26",rate:600}],
  movements:[["MOV-00030","08-Mar","FG Receipt","IN",300,"PCS","WH-TRANS","WH-FG","WO-0001","₹600"],["MOV-00035","10-Mar","Sale Dispatch","OUT",200,"PCS","WH-FG","—","DC-0001","₹800"],["MOV-00040","12-Mar","FG Receipt","IN",500,"PCS","WH-TRANS","WH-FG","WO-0002","₹600"],["MOV-00045","14-Mar","FG Receipt","IN",400,"PCS","WH-TRANS","WH-FG","WO-0003","₹600"],["MOV-00048","15-Mar","Sale Dispatch","OUT",600,"PCS","WH-FG","—","DC-0002","₹800"]],
  pos:[],grns:[],transfers:[],qc:[["QC-FG-001","08-Mar","—","BATCH-FG-001","—","—","Pass","AQL passed"]],
  isr:[],returns:[],
  workOrders:[["WO-0001","01-Mar","5249HP Polo White",400,"Completed"],["WO-0002","06-Mar","5249HP Polo Navy",500,"Completed"],["WO-0003","10-Mar","5249HP Polo Black",400,"In Progress"]],
  bom:[["BOM-5249HP","5249HP Polo CVC",1,"PCS","—"]],jobwork:[],
  dispatches:[["DC-0001","10-Mar","Aditya Traders","5249HP Polo",200,"₹800","₹1,60,000","Dispatched"],["DC-0002","15-Mar","Mehra Fashion","5249HP Polo",600,"₹800","₹4,80,000","Dispatched"]],
  adjustments:[],
  comments:[
    {id:"C20",ts:"15-Mar 17:00",user:"Sales (Team)",av:"ST",col:"#15803d",text:"DC-0002 dispatched to Mehra Fashion — 600 PCS. SS26 order complete.",reacts:["🎉"],replies:[]},
    {id:"C15",ts:"10-Mar 11:00",user:"Saurav (MD)",av:"SA",col:"#E8690A",text:"First dispatch done! 200 PCS to Aditya Traders. Good margins.",reacts:["💰"],replies:[{id:"C15R1",ts:"10-Mar 14:00",user:"Sales (Team)",av:"ST",col:"#15803d",text:"Aditya confirmed receipt. Reorder expected next week."}]},
  ],
  batches:{},
},
"RM-FAB-002":{
  stockTrend:[100,100,200,400,600,800,800,700,600,500,500,1500,1400,1300,1200,1100,1000,900,800,700,600,500,500,400,400,400,400,400,400,400],
  trendDates:["14F","15F","16F","17F","18F","19F","20F","21F","22F","23F","24F","25F","26F","27F","28F","1M","2M","3M","4M","5M","6M","7M","8M","9M","10M","11M","12M","13M","14M","15M"],
  costTrend:[{date:"Oct-25",rate:320},{date:"Dec-25",rate:330},{date:"Jan-26",rate:340},{date:"Feb-26",rate:350},{date:"Mar-26",rate:350}],
  movements:[["MOV-00002","20-Feb","GRN Receipt","IN",800,"KG","—","WH-FAB","GRN-0004","₹340"],["MOV-00015","05-Mar","Prod Issue","OUT",600,"KG","WH-FAB","WH-TRANS","WO-0002","₹350"],["MOV-00020","10-Mar","Prod Issue","OUT",500,"KG","WH-FAB","WH-TRANS","WO-0004","₹350"]],
  pos:[["PO-0002","15-Feb","Rajinder",800,"₹340","₹2,72,000","Fully Received"],["PO-0004","22-Feb","Rajinder",1000,"₹350","₹3,50,000","Fully Received"]],
  grns:[["GRN-0004","20-Feb","PO-0002",800,800,0,"LOT-CVC-001","Pass"],["GRN-0005","25-Feb","PO-0004",1000,1000,0,"LOT-CVC-002","Pass"]],
  transfers:[],qc:[["QC-CVC-001","20-Feb","GRN-0004","LOT-CVC-001",222,"3.8%","Pass","Good"]],
  isr:[["ISR-002","Rajinder Fabrics","CVC Pique 220","₹350","Primary"]],
  returns:[],workOrders:[["WO-0002","05-Mar","5249HP Polo Navy",600,"Completed"],["WO-0004","10-Mar","5249HP Polo Grey",500,"Completed"]],
  bom:[["BOM-5249HP","5249HP Polo CVC",0.28,"KG","5%"]],jobwork:[],dispatches:[],adjustments:[],
  comments:[
    {id:"C22",ts:"14-Mar 16:00",user:"Ravi (Store)",av:"RS",col:"#f59e0b",text:"Stock at 400 KG — below reorder level 500. PO needed urgently.",reacts:["⚠️"],replies:[{id:"C22R1",ts:"14-Mar 17:00",user:"Saurav (MD)",av:"SA",col:"#E8690A",text:"Raise PO for 800 KG from Rajinder. Same rate ₹350."}]},
  ],
  batches:{},
},
"RM-FAB-003":{
  stockTrend:[0,0,100,200,300,400,500,600,600,550,500,450,400,350,300,250,200,150,100,80,60,50,40,30,25,20,15,12,10,10],
  trendDates:["14F","15F","16F","17F","18F","19F","20F","21F","22F","23F","24F","25F","26F","27F","28F","1M","2M","3M","4M","5M","6M","7M","8M","9M","10M","11M","12M","13M","14M","15M"],
  costTrend:[{date:"Sep-25",rate:480},{date:"Nov-25",rate:490},{date:"Jan-26",rate:500},{date:"Feb-26",rate:500},{date:"Mar-26",rate:500}],
  movements:[["MOV-00003","18-Feb","GRN Receipt","IN",600,"KG","—","WH-FAB","GRN-0006","₹500"],["MOV-00014","08-Mar","Prod Issue","OUT",300,"KG","WH-FAB","WH-TRANS","WO-0007","₹500"],["MOV-00021","14-Mar","Prod Issue","OUT",90,"KG","WH-FAB","WH-TRANS","WO-0008","₹500"]],
  pos:[["PO-0003","10-Feb","Punjab Textiles",600,"₹500","₹3,00,000","Fully Received"]],
  grns:[["GRN-0006","18-Feb","PO-0003",600,600,0,"LOT-FLC-001","Pass"]],
  transfers:[],qc:[["QC-FLC-001","18-Feb","GRN-0006","LOT-FLC-001",282,"3.5%","Pass","Good fleece"]],
  isr:[["ISR-003","Punjab Textiles","Poly Fleece 280","₹500","Primary"]],
  returns:[],workOrders:[["WO-0007","08-Mar","54568HR Hoodie",300,"Completed"],["WO-0008","14-Mar","54568HR Hoodie",90,"In Progress"]],
  bom:[["BOM-54568HR","54568HR Hoodie Fleece",0.45,"KG","6%"]],jobwork:[],dispatches:[],adjustments:[],
  comments:[
    {id:"C25",ts:"14-Mar 18:00",user:"Ravi (Store)",av:"RS",col:"#dc2626",text:"⚠️ CRITICAL: Poly Fleece at 10 KG only! Urgent PO required!",reacts:["🚨"],replies:[{id:"C25R1",ts:"14-Mar 18:30",user:"Saurav (MD)",av:"SA",col:"#E8690A",text:"Emergency PO for 500 KG from Punjab Textiles. 7-day delivery."}]},
  ],
  batches:{},
},
"TRM-THD-001":{stockTrend:[50,50,80,100,120,150,150,140,130,120,110,100,90,80,80,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70],trendDates:["14F","15F","16F","17F","18F","19F","20F","21F","22F","23F","24F","25F","26F","27F","28F","1M","2M","3M","4M","5M","6M","7M","8M","9M","10M","11M","12M","13M","14M","15M"],costTrend:[{date:"Oct-25",rate:140},{date:"Dec-25",rate:145},{date:"Feb-26",rate:150},{date:"Mar-26",rate:150}],movements:[["MOV-00006","28-Feb","GRN Receipt","IN",100,"CONE","—","WH-TRIM","GRN-0007","₹150"],["MOV-00016","05-Mar","Prod Issue","OUT",80,"CONE","WH-TRIM","WH-TRANS","WO-0001","₹150"]],pos:[["PO-0006","20-Feb","Coats India",200,"₹150","₹30,000","Fully Received"]],grns:[["GRN-0007","28-Feb","PO-0006",100,100,0,"LOT-THD-001","Pass"]],transfers:[],qc:[],isr:[["ISR-004","Coats India","Epic 120 White","₹150","Primary"]],returns:[],workOrders:[],bom:[],jobwork:[],dispatches:[],adjustments:[],
  comments:[{id:"C30",ts:"08-Mar 09:00",user:"Ravi (Store)",av:"RS",col:"#15803d",text:"Thread stock stable at 70 cones. Sufficient for current WOs.",reacts:["👍"],replies:[]}],batches:{}},
"TRM-ZIP-001":{stockTrend:[],trendDates:[],costTrend:[],movements:[],pos:[],grns:[],transfers:[],qc:[],isr:[["ISR-005","YKK India","Nylon 6\" Black","₹30","Primary"]],returns:[],workOrders:[],bom:[],jobwork:[],dispatches:[],adjustments:[],
  comments:[{id:"C32",ts:"13-Mar 10:00",user:"Ravi (Store)",av:"RS",col:"#f59e0b",text:"Zipper stock at 80 PCS — below reorder 100. PO needed for YKK.",reacts:["⚠️"],replies:[]}],batches:{}},
"PKG-PLY-001":{stockTrend:[],trendDates:[],costTrend:[],movements:[],pos:[],grns:[],transfers:[],qc:[],isr:[["ISR-006","Ludhiana Poly","Poly Bag 12x14","₹5","Primary"]],returns:[],workOrders:[],bom:[],jobwork:[],dispatches:[],adjustments:[],
  comments:[{id:"C33",ts:"14-Mar 15:00",user:"Ravi (Store)",av:"RS",col:"#15803d",text:"Poly bags well stocked at 2,500 PCS. No action needed.",reacts:[],replies:[]}],batches:{}},
"CON-DYE-001":{stockTrend:[],trendDates:[],costTrend:[],movements:[],pos:[],grns:[],transfers:[],qc:[],isr:[["ISR-007","Atul Ltd","Reactive Black HE-B","₹1,500","Primary"]],returns:[],workOrders:[],bom:[],jobwork:[],dispatches:[],adjustments:[],
  comments:[{id:"C34",ts:"10-Mar 11:00",user:"Ravi (Store)",av:"RS",col:"#15803d",text:"Dye stock at 25 KG. Next dyeing batch scheduled next week.",reacts:[],replies:[]}],batches:{}},
};
function getV4Linked(code) { return V4_LINKED[code] || {stockTrend:[],trendDates:[],costTrend:[],movements:[],pos:[],grns:[],transfers:[],qc:[],isr:[],returns:[],workOrders:[],bom:[],jobwork:[],dispatches:[],adjustments:[],comments:[],batches:{}}; }

// ═══════════════════════════════════════════════════════════
//  Custom views per sub-module (beyond Full + Quick)
// ═══════════════════════════════════════════════════════════
function mkModuleViews(fields, subId) {
  const allCols  = fields.map(f => f.col);
  const mandCols = [...new Set([allCols[0], ...fields.filter(f => f.req && !f.auto).map(f => f.col)])];
  const views = [
    { id:"mod:full",  name:"Full Entry",  icon:"📋", color:"#6b7280", fields:allCols,  isSystem:true,  desc:"Every column — complete form" },
    { id:"mod:quick", name:"Quick Entry", icon:"⚡",  color:"#E8690A", fields:mandCols, isSystem:true,  desc:"Mandatory fields only" },
  ];
  // Sub-module-specific custom views
  if (subId === "ledger") {
    views.push(
      { id:"inv:alerts",    name:"Reorder Alerts",  icon:"🔔", color:"#dc2626", fields:["A","B","D","F","I","M","N","O","P"], isSystem:false, desc:"Items at or below reorder level" },
      { id:"inv:valuation", name:"Stock Valuation",  icon:"₹",  color:"#854d0e", fields:["A","B","D","F","I","M","U","T"],    isSystem:false, desc:"Stock value summary" },
    );
  }
  if (subId === "movement") {
    views.push(
      { id:"inv:grn",       name:"GRN Receipts",     icon:"📥", color:"#15803d", fields:["A","B","C","E","G","J","K","O","P","Q"], isSystem:false, desc:"Only GRN Receipt movements" },
      { id:"inv:issues",    name:"Production Issues", icon:"🏭", color:"#0078D4", fields:["A","B","C","E","G","I","K","O"],         isSystem:false, desc:"Material issued to production" },
    );
  }
  if (subId === "transfer") {
    views.push(
      { id:"inv:transit",   name:"In Transit",        icon:"🚛", color:"#f59e0b", fields:["A","B","C","E","G","I","K","L","M","N"], isSystem:false, desc:"Transfers not yet received" },
    );
  }
  if (subId === "adjust") {
    views.push(
      { id:"inv:pending",   name:"Pending Approval",  icon:"⏳", color:"#f59e0b", fields:["A","B","C","D","F","H","J","K","L","N"], isSystem:false, desc:"Adjustments awaiting MD approval" },
    );
  }
  return views;
}

// ═══════════════════════════════════════════════════════════
//  Auto-compute cascade rules for all inventory sub-modules
// ═══════════════════════════════════════════════════════════
function computeAutos(col, val, data, subId) {
  const d = { ...data, [col]: val };
  const n = k => parseFloat(d[k]) || 0;

  // ── Item Code → auto-fill Name, UOM, Category from FK.ITEM ──
  const itemResolve = (codeCol, masterCol, nameCol, uomCol, catCol) => {
    if (col === codeCol) {
      const item = FK.ITEM?.find(i => i.v === val);
      if (item) {
        d[nameCol] = item.l.split(" — ")[1] || "";
        if (uomCol) d[uomCol] = item.uom || "";
        if (catCol) d[catCol] = item.master || "";
      } else {
        d[nameCol] = "";
        if (uomCol) d[uomCol] = "";
        if (catCol) d[catCol] = "";
      }
    }
    if (col === masterCol && !d[nameCol]) {
      const item = FK.ITEM?.find(i => i.v === d[codeCol]);
      if (item) d[nameCol] = item.l.split(" — ")[1] || "";
    }
  };

  // ── Warehouse → auto-fill Location Name ──
  const locResolve = (locCol, nameCol) => {
    if (col === locCol) {
      const wh = FK.WAREHOUSE?.find(w => w.v === val);
      d[nameCol] = wh ? wh.l.split(" — ")[1] || "" : "";
    }
  };

  if (subId === "ledger") {
    itemResolve("B", "C", "D", "I", "E");
    locResolve("F", "G");
    // Stock On Hand = Opening + Received - Issued
    if (["J","K","L"].includes(col)) {
      d["M"] = (n("J") + n("K") - n("L")).toString();
    }
    // Stock Alert logic
    if (["M","N"].includes(col) || (col === "J" || col === "K" || col === "L")) {
      const onHand = n("J") + n("K") - n("L");
      const reorder = n("N");
      if (reorder > 0) {
        if (onHand <= 0) d["P"] = "CRITICAL";
        else if (onHand <= reorder) d["P"] = "REORDER";
        else if (onHand > reorder * 3) d["P"] = "EXCESS";
        else d["P"] = "OK";
      } else d["P"] = "OK";
    }
    // Stock Value = On Hand × Avg Cost
    if (["M","U","J","K","L"].includes(col)) {
      const onHand = n("J") + n("K") - n("L");
      d["T"] = n("U") > 0 ? "₹" + (onHand * n("U")).toLocaleString("en-IN") : "";
    }
  }

  if (subId === "movement") {
    itemResolve("E", "F", "G", "H", null);
    locResolve("I", ""); // From has no auto-name col in this layout
    // Direction from Movement Type
    if (col === "C") {
      d["D"] = DIR_MAP[val] || "";
    }
    // Total Value = Qty × Unit Cost
    if (["K","L"].includes(col)) {
      d["M"] = n("K") > 0 && n("L") > 0 ? "₹" + (n("K") * n("L")).toLocaleString("en-IN") : "";
    }
  }

  if (subId === "transfer") {
    itemResolve("C", "D", "E", "F", null);
    locResolve("G", "H");
    locResolve("I", "J");
    // Variance = Transfer Qty - Received Qty
    if (["K","L"].includes(col)) {
      d["M"] = (n("K") - n("L")).toString();
    }
  }

  if (subId === "adjust") {
    itemResolve("D", "E", "F", "G", null);
    locResolve("H", "I");
    // Difference = Physical - System
    if (["J","K"].includes(col)) {
      d["L"] = (n("K") - n("J")).toString();
    }
    // Value Impact (approximate — uses a dummy avg cost for demo)
    if (["J","K","L"].includes(col)) {
      const diff = n("K") - n("J");
      d["M"] = diff !== 0 ? "₹" + (diff * 250).toLocaleString("en-IN") : "₹0";
    }
  }

  return d;
}

// ═══════════════════════════════════════════════════════════
//  V4 VISUAL COMPONENTS — Sparkline, Charts, Batch, Comments, Record Detail
// ═══════════════════════════════════════════════════════════
function StatusPill({v}) {
  if (!v || v === "—") return (<span style={{color:"#9ca3af"}}>—</span>);
  const s = String(v);
  const green = ["Pass","Fully Received","Completed","Credit Received","OK","IN","Received"];
  const amber = ["Partial","Partial Pass","In Transit","In Progress","Pending","Secondary"];
  const red = ["Fail","Rejected","CRITICAL","OUT"];
  if (s === "IN") return (<span style={{padding:"2px 7px",borderRadius:3,fontSize:9,fontWeight:800,background:"#dcfce7",color:"#15803d"}}>▲ IN</span>);
  if (s === "OUT") return (<span style={{padding:"2px 7px",borderRadius:3,fontSize:9,fontWeight:800,background:"#fef2f2",color:"#991b1b"}}>▼ OUT</span>);
  if (green.includes(s)) return (<span style={{padding:"2px 7px",borderRadius:3,fontSize:9,fontWeight:800,background:"#dcfce7",color:"#15803d"}}>{s}</span>);
  if (amber.includes(s)) return (<span style={{padding:"2px 7px",borderRadius:3,fontSize:9,fontWeight:800,background:"#fef3c7",color:"#92400e"}}>{s}</span>);
  if (red.includes(s)) return (<span style={{padding:"2px 7px",borderRadius:3,fontSize:9,fontWeight:800,background:"#fef2f2",color:"#991b1b"}}>{s}</span>);
  return (<span style={{padding:"2px 7px",borderRadius:3,fontSize:9,fontWeight:800,background:"#f3f4f6",color:"#374151"}}>{s}</span>);
}
function V4AlertBadge({v}) { const s = ALERT_COLORS[v] || ALERT_COLORS.OK; return (<span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:900,background:s.bg,color:s.c}}>{v}</span>); }
function V4ABCBadge({v}) { const s = ABC_COLORS[v] || ABC_COLORS.C; return (<span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:900,background:s.bg,color:s.c}}>{s.l}</span>); }

function ImgPreview({code, pos, M, A}) {
  const imgs = getImgs(code); const rec = MOCK_MAP.ledger.find(x => x.B === code);
  if (imgs.length === 0 || !pos) return null;
  const isSingle = imgs.length === 1;
  return (
    <div style={{position:"fixed",zIndex:9999,top:pos.top,left:pos.left,width:isSingle?280:320,background:M.hi,border:`1.5px solid ${A.a}`,borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,.35)",overflow:"hidden",pointerEvents:"none"}}>
      {isSingle ? (
        <img src={imgs[0].src} alt="" style={{width:"100%",height:180,objectFit:"cover",display:"block"}}/>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:imgs.length===2?"1fr 1fr":imgs.length<=4?"1fr 1fr":"1fr 1fr 1fr",gap:2,padding:2,background:M.div}}>
          {imgs.slice(0,6).map((im,i) => (
            <div key={i} style={{position:"relative",overflow:"hidden"}}>
              <img src={im.src} alt="" style={{width:"100%",height:imgs.length<=2?120:imgs.length<=4?90:70,objectFit:"cover",display:"block"}}/>
              <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.6))",padding:"2px 5px"}}>
                <span style={{fontSize:7,fontWeight:800,color:"#fff"}}>{im.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{padding:"8px 12px",borderTop:`2px solid ${A.a}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{fontSize:12,fontWeight:900,color:M.tA,flex:1}}>{rec?.D || code}</div>
          <span style={{fontSize:8,fontWeight:800,color:A.a,background:A.al,padding:"2px 6px",borderRadius:3}}>📸 {imgs.length} {imgs.length===1?"image":"images"}</span>
        </div>
        <div style={{display:"flex",gap:6,marginTop:3}}>
          <span style={{fontFamily:"monospace",fontSize:10,fontWeight:800,color:A.a,background:A.al,padding:"2px 6px",borderRadius:3}}>{code}</span>
          <span style={{fontSize:9,fontWeight:800,color:M.tC,padding:"2px 6px",borderRadius:3,background:M.mid}}>{rec?.C || ""}</span>
        </div>
      </div>
    </div>
  );
}

function Sparkline({data, dates, width=256, height=55, color="#007C7C", reorderLvl, M}) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, reorderLvl || 0) * 1.1 || 1;
  const pts = data.map((v, i) => `${(i/(data.length-1))*width},${height-((v/max)*height)}`).join(" ");
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  const ry = reorderLvl ? height - ((reorderLvl/max)*height) : null;
  const last = data[data.length-1]; const ly = height - ((last/max)*height);
  return (
    <svg width={width} height={height+16} style={{display:"block"}}>
      <defs><linearGradient id="sparkG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0.02"/></linearGradient></defs>
      <polygon points={fillPts} fill="url(#sparkG)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {ry !== null && <line x1="0" y1={ry} x2={width} y2={ry} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" opacity=".7"/>}
      {ry !== null && <text x={width-2} y={ry-3} textAnchor="end" fontSize="7" fill="#f59e0b" fontWeight="700">Reorder: {reorderLvl}</text>}
      <circle cx={width} cy={ly} r="3.5" fill={color} stroke="#fff" strokeWidth="1.5"/>
      <text x={width-6} y={ly-6} textAnchor="end" fontSize="8" fill={color} fontWeight="900">{last.toLocaleString("en-IN")}</text>
      <text x="0" y={height+12} fontSize="7" fill={M.tD}>{dates?.[0]||""}</text>
      <text x={width} y={height+12} textAnchor="end" fontSize="7" fill={M.tD}>{dates?.[dates.length-1]||""}</text>
    </svg>
  );
}

function CostTrend({data, width=256, height=50, M}) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.rate)) * 1.15;
  const bw = Math.min(36, width/data.length - 6);
  const gap = (width - bw*data.length) / (data.length+1);
  return (
    <svg width={width} height={height+18} style={{display:"block"}}>
      {data.map((d, i) => {
        const bh = (d.rate/max)*height; const x = gap + (bw+gap)*i; const y = height - bh; const isLast = i === data.length-1;
        return (<g key={i}><rect x={x} y={y} width={bw} height={bh} rx="3" fill={isLast?"#007C7C":"#007C7C40"}/><text x={x+bw/2} y={y-3} textAnchor="middle" fontSize="8" fill={isLast?"#007C7C":M.tD} fontWeight={isLast?900:700}>₹{d.rate}</text><text x={x+bw/2} y={height+10} textAnchor="middle" fontSize="7" fill={M.tD}>{d.date}</text></g>);
      })}
    </svg>
  );
}

function LinkedDetailTable({title, icon, color, headers, rows, onClick, open, M, A}) {
  const [o, setO] = useState(open !== false);
  return (
    <div style={{border:`1px solid ${M.div}`,borderRadius:8,overflow:"hidden",marginBottom:10}}>
      <button onClick={() => setO(!o)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",border:"none",background:o?`${color}10`:M.mid,cursor:"pointer",borderBottom:o?`2px solid ${color}`:"none",fontFamily:"inherit"}}>
        <span style={{fontSize:8,color,transform:o?"rotate(90deg)":"none",display:"inline-block",transition:"transform .15s"}}>▶</span>
        <span style={{fontSize:14}}>{icon}</span>
        <span style={{fontSize:11,fontWeight:900,color:M.tA}}>{title}</span>
        <span style={{fontSize:9,fontWeight:900,color:"#fff",background:color,borderRadius:10,padding:"1px 8px"}}>{rows.length}</span>
        <span style={{fontSize:9,color,marginLeft:"auto",fontWeight:800}}>View All →</span>
      </button>
      {o && (
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr>{headers.map(h => <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:9,fontWeight:900,color:M.tC,borderBottom:`1px solid ${M.div}`,background:M.thd,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{rows.length === 0 ? <tr><td colSpan={headers.length} style={{padding:20,textAlign:"center",color:M.tD}}>No records</td></tr> : rows.map((cells, i) => (
              <tr key={i} onClick={() => onClick?.(cells)} style={{cursor:onClick?"pointer":"default",borderBottom:`1px solid ${M.div}`,background:i%2===0?M.tev:M.tod}} onMouseEnter={e => e.currentTarget.style.background=`${color}08`} onMouseLeave={e => e.currentTarget.style.background=i%2===0?M.tev:M.tod}>
                {cells.map((v, j) => (<td key={j} style={{padding:"6px 10px",whiteSpace:"nowrap",color:j===0?A.a:M.tB,fontWeight:j===0?700:400,fontFamily:j===0?"monospace":"inherit"}}>{typeof v === "number" ? v.toLocaleString("en-IN") : <StatusPill v={String(v)}/>}</td>))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BatchTree({batches, onStepClick, M, A}) {
  const [activeLot, setActiveLot] = useState(null);
  const lots = Object.keys(batches || {});
  if (lots.length === 0) return null;
  const chain = activeLot ? batches[activeLot] : null;
  return (
    <div style={{border:`1px solid ${M.div}`,borderRadius:8,overflow:"hidden",marginBottom:10}}>
      <div style={{padding:"10px 14px",background:"#854d0e10",borderBottom:"2px solid #854d0e",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:14}}>🔗</span>
        <span style={{fontSize:11,fontWeight:900,color:M.tA}}>Batch / Lot Traceability</span>
        <span style={{fontSize:9,fontWeight:900,color:"#fff",background:"#854d0e",borderRadius:10,padding:"1px 8px"}}>{lots.length} lots</span>
      </div>
      <div style={{padding:"10px 14px",display:"flex",gap:6,flexWrap:"wrap",borderBottom:activeLot?`1px solid ${M.div}`:"none"}}>
        {lots.map(lot => (
          <button key={lot} onClick={() => setActiveLot(activeLot===lot?null:lot)} style={{padding:"5px 14px",borderRadius:6,border:`1.5px solid ${activeLot===lot?"#854d0e":M.inBd}`,background:activeLot===lot?"#854d0e":"transparent",color:activeLot===lot?"#fff":M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>📦 {lot}</button>
        ))}
      </div>
      {chain && (
        <div style={{padding:"14px 20px 14px 30px"}}>
          {chain.map((step, i) => (
            <div key={i} style={{display:"flex",gap:12,position:"relative",paddingBottom:i<chain.length-1?16:0}}>
              {i < chain.length-1 && <div style={{position:"absolute",left:15,top:28,bottom:0,width:2,background:`${step.color}30`}}/>}
              <div style={{width:30,height:30,borderRadius:"50%",background:step.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,zIndex:1,border:"2px solid #fff",boxShadow:`0 0 0 2px ${step.color}30`}}>{step.icon}</div>
              <div onClick={() => onStepClick?.(step)} style={{flex:1,cursor:"pointer",padding:"6px 12px",borderRadius:6,border:`1px solid ${M.div}`,background:M.hi}} onMouseEnter={e => e.currentTarget.style.borderColor=step.color} onMouseLeave={e => e.currentTarget.style.borderColor=M.div}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontSize:10,fontWeight:900,color:step.color}}>{step.step}</span>
                  <span style={{fontFamily:"monospace",fontSize:9,fontWeight:800,color:A.a}}>{step.ref}</span>
                  <span style={{fontSize:8,color:M.tD,marginLeft:"auto"}}>{step.date}</span>
                </div>
                <div style={{fontSize:10,color:M.tB,lineHeight:1.4}}>{step.detail}</div>
                <div style={{marginTop:3}}><StatusPill v={step.status}/></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsPanel({comments, M, A}) {
  const [newComment, setNewComment] = useState("");
  if (!comments || comments.length === 0) return null;
  return (
    <div style={{border:`1px solid ${M.div}`,borderRadius:8,overflow:"hidden",marginBottom:10}}>
      <div style={{padding:"10px 14px",background:"#7C3AED10",borderBottom:"2px solid #7C3AED",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:14}}>💬</span>
        <span style={{fontSize:11,fontWeight:900,color:M.tA}}>Comments & Activity</span>
        <span style={{fontSize:9,fontWeight:900,color:"#fff",background:"#7C3AED",borderRadius:10,padding:"1px 8px"}}>{comments.length}</span>
      </div>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${M.div}`,display:"flex",gap:8,alignItems:"flex-start"}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:A.a,color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>You</div>
        <div style={{flex:1}}>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment… @name to mention" style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${M.inBd}`,borderRadius:6,background:M.inBg,color:M.tA,fontSize:11,resize:"vertical",minHeight:36,outline:"none",fontFamily:"inherit"}}/>
          {newComment.trim() && <div style={{marginTop:6,display:"flex",gap:6,justifyContent:"flex-end"}}>
            <button onClick={() => setNewComment("")} style={{padding:"4px 12px",borderRadius:5,border:`1px solid ${M.inBd}`,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Cancel</button>
            <button onClick={() => setNewComment("")} style={{padding:"4px 14px",borderRadius:5,border:"none",background:"#7C3AED",color:"#fff",fontSize:9,fontWeight:900,cursor:"pointer"}}>💬 Post</button>
          </div>}
        </div>
      </div>
      {comments.map(c => (
        <div key={c.id} style={{borderBottom:`1px solid ${M.div}`,padding:"12px 14px"}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:c.col,color:"#fff",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{c.av}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><span style={{fontSize:11,fontWeight:800,color:M.tA}}>{c.user}</span><span style={{fontSize:9,color:M.tD}}>{c.ts}</span></div>
              <div style={{fontSize:11,color:M.tB,lineHeight:1.5}}>{c.text.split(/(@\w+)/g).map((part, i) => part.startsWith("@") ? <span key={i} style={{background:"#7C3AED20",color:"#7C3AED",padding:"0 3px",borderRadius:2,fontWeight:800}}>{part}</span> : <span key={i}>{part}</span>)}</div>
              {c.reacts?.length > 0 && <div style={{display:"flex",gap:4,marginTop:4}}>{c.reacts.map((r, i) => <span key={i} style={{padding:"1px 6px",borderRadius:10,background:M.mid,border:`1px solid ${M.div}`,fontSize:11,cursor:"pointer"}}>{r}</span>)}</div>}
              {c.replies?.length > 0 && (
                <div style={{marginTop:8,marginLeft:10,borderLeft:`2px solid ${M.div}`,paddingLeft:12}}>
                  {c.replies.map(rp => (
                    <div key={rp.id} style={{marginBottom:8,display:"flex",gap:6,alignItems:"flex-start"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:rp.col,color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{rp.av}</div>
                      <div><div style={{display:"flex",gap:5}}><span style={{fontSize:10,fontWeight:800,color:M.tA}}>{rp.user}</span><span style={{fontSize:8,color:M.tD}}>{rp.ts}</span></div><div style={{fontSize:10,color:M.tB,lineHeight:1.4,marginTop:1}}>{rp.text}</div></div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{marginTop:4,display:"flex",gap:8}}>
                <button style={{background:"none",border:"none",fontSize:9,color:M.tD,cursor:"pointer",fontWeight:700}}>Reply</button>
                <button style={{background:"none",border:"none",fontSize:9,color:M.tD,cursor:"pointer",fontWeight:700}}>React</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   V4 RECORD DETAIL PAGE — Full Notion-style with all features
   Click any item code in Records tab → opens this page
   ═══════════════════════════════════════════════════════════ */
function InventoryRecordDetail({record, onBack, M, A, fz}) {
  const [childView, setChildView] = useState(null);
  const [hdrHover, setHdrHover] = useState(false);
  const [hdrPos, setHdrPos] = useState(null);
  const [galleryCode, setGalleryCode] = useState(null);
  const code = record.B || record.code || "";
  const name = record.D || record.name || "";
  const master = record.C || record.master || "";
  const cat = record.E || record.cat || "";
  const loc = record.F || record.loc || "";
  const locName = record.G || record.locName || "";
  const bin = record.H || record.bin || "—";
  const uom = record.I || record.uom || "";
  const onHand = parseFloat(record.M || record.onHand || 0) || 0;
  const recv = parseFloat(record.K || record.recv || 0) || 0;
  const issue = parseFloat(record.L || record.issue || 0) || 0;
  const reorderLvl = parseFloat(record.N || record.reorderLvl || 0) || 0;
  const reorderQty = parseFloat(record.O || record.reorderQty || 0) || 0;
  const alert = record.P || record.alert || "OK";
  const avgCost = parseFloat(record.U || record.avgCost || 0) || 0;
  const value = parseFloat(String(record.T || record.value || 0).replace(/[₹,]/g, "")) || 0;
  const lastRecv = record.Q || record.lastRecv || "—";
  const lastIssue = record.R || record.lastIssue || "—";
  const stkId = record.A || record.id || "";
  const tags = record.tags || ["Stock Item"];
  const abc = record._abc || "C";
  const days = calcDaysRemaining(record);
  const linked = getV4Linked(code);
  const img = getFirstImg(code);
  const imgs = getImgs(code);
  const emoji = CAT_EMOJI[master] || "📦";
  const isReorder = alert === "REORDER" || alert === "CRITICAL";
  const isFG = master === "ARTICLE";
  const sup = BEST_SUP[code];

  const drill = (type, icon, color) => (cells) => setChildView({type, code: String(cells?.[0] || ""), icon, color});
  const batchDrill = (step) => setChildView({type: step.step, code: step.ref, icon: step.icon, color: step.color});

  if (childView) {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
        <div style={{padding:"8px 16px",borderBottom:`2px solid ${CC_RED}`,display:"flex",alignItems:"center",gap:10,background:M.sh,flexShrink:0}}>
          <button onClick={() => setChildView(null)} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${M.inBd}`,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>← Back to {code}</button>
          <span style={{padding:"3px 8px",borderRadius:4,background:childView.color+"15",color:childView.color,fontSize:10,fontWeight:900}}>{childView.icon} {childView.type}</span>
          <span style={{fontFamily:"monospace",fontSize:13,fontWeight:900,color:A.a}}>{childView.code}</span>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          <div style={{background:M.hi,border:`1px solid ${M.div}`,borderRadius:10,padding:24,boxShadow:M.shadow}}>
            <div style={{fontSize:16,fontWeight:900,color:A.a,marginBottom:8}}>{childView.code}</div>
            <div style={{fontSize:12,color:M.tB,lineHeight:1.8}}>Full detail page for <strong style={{color:A.a}}>{childView.code}</strong> ({childView.type}). In production: complete record + linked tables + comments + audit.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* TOOLBAR WITH THUMBNAIL */}
      <div style={{padding:"8px 16px",borderBottom:`2px solid ${CC_RED}`,display:"flex",alignItems:"center",gap:10,background:M.sh,flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${M.inBd}`,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>← Back to Ledger</button>
        <div style={{width:1,height:20,background:M.div}}/>
        <div onClick={() => setGalleryCode(code)} onMouseEnter={e => {const b=e.currentTarget.getBoundingClientRect();setHdrHover(true);setHdrPos({top:b.bottom+10,left:Math.min(b.left-40,window.innerWidth-300)});}} onMouseLeave={() => {setHdrHover(false);setHdrPos(null);}}
          style={{width:36,height:36,borderRadius:6,overflow:"hidden",border:`2px solid ${img?A.a:M.div}`,cursor:"pointer",background:img?undefined:A.al,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,transition:"transform .15s,box-shadow .15s",transform:hdrHover?"scale(1.1)":"scale(1)",boxShadow:hdrHover?`0 0 0 3px ${A.a}40`:"none"}}>
          {img ? <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : emoji}
        </div>
        <span style={{fontFamily:"monospace",fontSize:13,fontWeight:900,color:A.a}}>{code}</span>
        <span style={{fontSize:12,fontWeight:700,color:M.tA}}>{name}</span>
        <div style={{flex:1}}/>
        <V4ABCBadge v={abc}/> <V4AlertBadge v={alert}/>
        {days < 999 && <span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:900,background:days<=7?"#fef2f2":days<=21?"#fef3c7":"#dcfce7",color:days<=7?"#991b1b":days<=21?"#92400e":"#15803d"}}>⏱️ {days}d</span>}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:16}}>
        {/* HERO + SPARKLINES */}
        <div style={{display:"flex",gap:14,marginBottom:14}}>
          <div style={{flex:1,display:"flex",flexDirection:"column",background:M.hi,border:`1px solid ${M.div}`,borderRadius:10,overflow:"hidden",boxShadow:M.shadow}}>
            <div style={{display:"flex"}}>
              {/* Main image */}
              <div onClick={() => setGalleryCode(code)} style={{width:180,minHeight:160,flexShrink:0,borderRight:`3px solid ${A.a}`,overflow:"hidden",background:img?undefined:A.al,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                {img ? <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:48}}>{emoji}</span>}
              </div>
              <div style={{flex:1,padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px 20px"}}>
                {[["Ledger ID",stkId,"#6d28d9"],["Item Code",code,A.a],["Master",master,"#0078D4"],["Category",cat,"#7C3AED"],["Location",`${loc} — ${locName}`,"#15803d"],["Bin",bin,"#6b7280"],["UOM",uom,"#854d0e"],["Received",recv.toLocaleString("en-IN"),"#15803d"],["Issued",issue.toLocaleString("en-IN"),"#dc2626"],["On Hand",onHand.toLocaleString("en-IN"),A.a],["Avg Cost",Rupee(avgCost),"#854d0e"],["ABC",abc,ABC_COLORS[abc]?.c]].map(([l,v,c],i) => (
                  <div key={i}><div style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginBottom:2}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:c,fontFamily:i<3?"monospace":"inherit"}}>{v}</div></div>
                ))}
              </div>
            </div>
            {/* Multi-image gallery strip */}
            {imgs.length > 1 && (
              <div style={{borderTop:`1px solid ${M.div}`,padding:"8px 12px",background:M.mid,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.5,textTransform:"uppercase",flexShrink:0}}>📸 {imgs.length} IMAGES:</span>
                <div style={{display:"flex",gap:6,overflowX:"auto",flex:1}}>
                  {imgs.map((im, idx) => (
                    <div key={idx} onClick={() => setGalleryCode(code)} style={{position:"relative",width:48,height:48,borderRadius:6,overflow:"hidden",border:`2px solid ${idx===0?A.a:M.div}`,flexShrink:0,cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e => e.currentTarget.style.borderColor=A.a} onMouseLeave={e => {if(idx!==0)e.currentTarget.style.borderColor=M.div;}}>
                      <img src={im.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.7))",padding:"1px 3px"}}>
                        <span style={{fontSize:6,fontWeight:800,color:"#fff"}}>{im.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {linked.stockTrend.length > 0 && (
            <div style={{width:280,flexShrink:0,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{background:M.hi,border:`1px solid ${M.div}`,borderRadius:10,padding:"10px 12px",flex:1}}>
                <div style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>📈 Stock trend (30 days)</div>
                <Sparkline data={linked.stockTrend} dates={linked.trendDates} reorderLvl={reorderLvl} M={M}/>
              </div>
              <div style={{background:M.hi,border:`1px solid ${M.div}`,borderRadius:10,padding:"10px 12px",flex:1}}>
                <div style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>💰 Cost trend (last 5 POs)</div>
                <CostTrend data={linked.costTrend} M={M}/>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
          <span style={{fontSize:8,fontWeight:900,color:M.tD}}>🏷️ TAGS:</span>
          {tags.map(t => <span key={t} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:800,background:t.includes("Urgent")?"#fef2f2":A.al,color:t.includes("Urgent")?"#dc2626":A.a,border:`1px solid ${t.includes("Urgent")?"#fecaca":M.div}`}}>{t}</span>)}
        </div>

        {/* Rollup cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:14}}>
          {[{l:"On hand",v:onHand.toLocaleString("en-IN")+" "+uom,c:"#007C7C",i:"📊"},{l:"Value",v:Rupee(value),c:"#854d0e",i:"💰"},{l:"Days left",v:days>=999?"∞":days+"d",c:days<=7?"#991b1b":days<=21?"#92400e":"#15803d",i:"⏱️"},{l:"Reorder",v:reorderLvl.toLocaleString("en-IN"),c:"#f59e0b",i:"🔔"},{l:"Suppliers",v:String(linked.isr.length),c:"#854d0e",i:"🏢"}].map((x, i) => (
            <div key={i} style={{background:M.hi,border:`1px solid ${M.div}`,borderRadius:8,padding:"10px 12px",borderLeft:`4px solid ${x.c}`}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{fontSize:12}}>{x.i}</span><span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase"}}>{x.l}</span></div><div style={{fontSize:14,fontWeight:900,color:x.c,fontFamily:"monospace"}}>{x.v}</div></div>
          ))}
        </div>

        {/* Smart Reorder */}
        {isReorder && sup && (
          <div style={{background:alert==="CRITICAL"?"#fef2f2":"#fffbeb",border:`2px solid ${alert==="CRITICAL"?"#fecaca":"#fde68a"}`,borderRadius:10,padding:"14px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:10,background:alert==="CRITICAL"?"#dc2626":"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🔔</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:900,color:alert==="CRITICAL"?"#991b1b":"#92400e",marginBottom:3}}>{alert==="CRITICAL"?"⚠️ CRITICAL":"🔔 Reorder Suggested"}</div>
            <div style={{fontSize:11,color:M.tB,lineHeight:1.5}}>Suggested: <strong>{reorderQty.toLocaleString("en-IN")} {uom}</strong> from <strong style={{color:A.a}}>{sup.name}</strong> @ <strong>{Rupee(sup.rate)}/{uom}</strong> · Est: <strong>{Rupee(reorderQty*sup.rate)}</strong></div></div>
            <button style={{padding:"9px 18px",borderRadius:8,border:"none",background:alert==="CRITICAL"?"#dc2626":"#f59e0b",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer",flexShrink:0}}>➕ Create PO</button>
          </div>
        )}

        {/* DIVIDER */}
        <div style={{fontSize:9,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:16,height:2,background:M.div}}/>LINKED RECORDS + BATCH TRACE + COMMENTS<span style={{flex:1,height:2,background:M.div}}/>
        </div>

        {/* 13 LINKED TABLES */}
        <LinkedDetailTable M={M} A={A} title="Current stock balance" icon="📊" color="#007C7C" open={true} headers={["Location","On Hand","UOM","Last Recv","Last Issue","Alert"]} rows={[[loc,onHand,uom,lastRecv,lastIssue,alert]]}/>
        <LinkedDetailTable M={M} A={A} title="Stock movements" icon="🔄" color="#0E6655" open={true} headers={["ID","Date","Type","Dir","Qty","UOM","From","To","Ref","Cost"]} rows={linked.movements} onClick={drill("Movement","🔄","#0E6655")}/>
        <LinkedDetailTable M={M} A={A} title="Purchase orders" icon="📦" color="#E8690A" open={true} headers={["PO","Date","Supplier","Qty","Rate","Total","Status"]} rows={linked.pos} onClick={drill("PO","📦","#E8690A")}/>
        <LinkedDetailTable M={M} A={A} title="GRN details" icon="📥" color="#0078D4" open={true} headers={["GRN","Date","PO","Recv","Accept","Reject","Lot","QC"]} rows={linked.grns} onClick={drill("GRN","📥","#0078D4")}/>
        <LinkedDetailTable M={M} A={A} title="Stock transfers" icon="🚛" color="#7D3C98" open={false} headers={["Transfer","Date","From","To","Qty","Recv","Status"]} rows={linked.transfers} onClick={drill("Transfer","🚛","#7D3C98")}/>
        <LinkedDetailTable M={M} A={A} title="Quality check" icon="🔬" color="#7C3AED" open={false} headers={["QC","Date","GRN","Lot","GSM","Shrink","Result","Remark"]} rows={linked.qc} onClick={drill("QC","🔬","#7C3AED")}/>
        <LinkedDetailTable M={M} A={A} title="Item supplier rates" icon="🏢" color="#854d0e" open={false} headers={["Code","Supplier","Item","Rate","Priority"]} rows={linked.isr} onClick={drill("ISR","🏢","#854d0e")}/>
        <LinkedDetailTable M={M} A={A} title="Purchase returns" icon="↩️" color="#dc2626" open={false} headers={["PRN","Date","GRN","Qty","Reason","Status"]} rows={linked.returns} onClick={drill("Return","↩️","#dc2626")}/>
        <LinkedDetailTable M={M} A={A} title="Work orders" icon="🏭" color="#0078D4" open={false} headers={["WO","Date","Article","Consumed","Status"]} rows={linked.workOrders} onClick={drill("WO","🏭","#0078D4")}/>
        <LinkedDetailTable M={M} A={A} title="BOM usage" icon="📋" color="#7C3AED" open={false} headers={["BOM","Article","Qty/Pc","UOM","Waste"]} rows={linked.bom} onClick={drill("BOM","📋","#7C3AED")}/>
        <LinkedDetailTable M={M} A={A} title="Jobwork orders" icon="🏗️" color="#059669" open={false} headers={["JW","Date","Party","Process","Sent","Returned","Loss","Status"]} rows={linked.jobwork} onClick={drill("JW","🏗️","#059669")}/>
        {isFG && <LinkedDetailTable M={M} A={A} title="Sale dispatches" icon="🧾" color="#15803D" open={false} headers={["DC","Date","Customer","Qty","Status"]} rows={linked.dispatches}/>}
        <LinkedDetailTable M={M} A={A} title="Adjustment history" icon="📋" color="#f59e0b" open={false} headers={["Adj","Date","Type","System","Physical","Diff","Status"]} rows={linked.adjustments} onClick={drill("Adjustment","📋","#f59e0b")}/>

        {/* BATCH TRACEABILITY */}
        <BatchTree batches={linked.batches} onStepClick={batchDrill} M={M} A={A}/>

        {/* COMMENTS */}
        <CommentsPanel comments={linked.comments} M={M} A={A}/>

        <div style={{height:40}}/>
      </div>
      {hdrHover && hdrPos && img && !galleryCode && <ImgPreview code={code} pos={hdrPos} M={M} A={A}/>}
      {galleryCode && <GalleryModal code={galleryCode} onClose={() => setGalleryCode(null)} M={M} A={A}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GALLERY MODAL — Click thumbnail → opens full popup gallery
   ═══════════════════════════════════════════════════════════ */
function GalleryModal({code, onClose, M, A}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const imgs = getImgs(code);
  const rec = MOCK_MAP.ledger.find(x => x.B === code);
  if (imgs.length === 0) return null;
  const active = imgs[activeIdx] || imgs[0];
  const prev = () => setActiveIdx(i => i > 0 ? i - 1 : imgs.length - 1);
  const next = () => setActiveIdx(i => i < imgs.length - 1 ? i + 1 : 0);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div onClick={e => e.stopPropagation()} style={{width:520,maxWidth:"92vw",background:M.hi,borderRadius:14,overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,.5)",border:`2px solid ${A.a}`}}>
        {/* Header */}
        <div style={{padding:"10px 16px",borderBottom:`2px solid ${A.a}`,display:"flex",alignItems:"center",gap:8,background:M.sh}}>
          <span style={{fontFamily:"monospace",fontSize:13,fontWeight:900,color:A.a}}>{code}</span>
          <span style={{fontSize:12,fontWeight:700,color:M.tA}}>{rec?.D || ""}</span>
          <span style={{fontSize:9,fontWeight:800,color:A.a,background:A.al,padding:"2px 8px",borderRadius:10}}>📸 {imgs.length} image{imgs.length>1?"s":""}</span>
          <div style={{flex:1}}/>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:6,border:`1px solid ${M.inBd}`,background:M.inBg,color:M.tB,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {/* Main image */}
        <div style={{position:"relative",background:"#000"}}>
          <img src={active.src} alt="" style={{width:"100%",height:320,objectFit:"contain",display:"block"}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.7))",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:12,fontWeight:800,color:"#fff"}}>{active.label}</span>
            <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.7)"}}>{activeIdx + 1} / {imgs.length}</span>
          </div>
          {imgs.length > 1 && (
            <>
              <button onClick={prev} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.85)",color:"#111",fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
              <button onClick={next} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.85)",color:"#111",fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
            </>
          )}
        </div>
        {imgs.length > 1 && (
          <div style={{padding:"10px 16px",borderTop:`1px solid ${M.div}`,background:M.mid,display:"flex",gap:8,overflowX:"auto",alignItems:"center"}}>
            {imgs.map((im, idx) => (
              <div key={idx} onClick={() => setActiveIdx(idx)}
                style={{width:56,height:56,borderRadius:7,overflow:"hidden",border:`2.5px solid ${idx===activeIdx?A.a:"transparent"}`,flexShrink:0,cursor:"pointer",opacity:idx===activeIdx?1:.6,transition:"all .15s",position:"relative"}}>
                <img src={im.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.7))",padding:"1px 4px"}}>
                  <span style={{fontSize:7,fontWeight:800,color:"#fff"}}>{im.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   V4 STOCK LEDGER LIST VIEW — matches V4 standalone table
   Thumbnails + ABC + Days + clickable codes + hover preview
   ═══════════════════════════════════════════════════════════ */
function StockLedgerListView({mockRecords, onOpenRecord, M, A, fz, pyV}) {
  const [search, setSearch] = useState("");
  const [hoverImg, setHoverImg] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [galleryCode, setGalleryCode] = useState(null);

  // Compute ABC + Days for all records
  const enriched = calcABC(mockRecords).map(r => ({
    ...r,
    _days: calcDaysRemaining(r),
    _val: parseFloat(String(r.T || r.value || 0).replace(/[₹,]/g, "")) || 0,
  }));

  const filtered = enriched.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.A||"").toLowerCase().includes(s) || (r.B||"").toLowerCase().includes(s) || (r.D||"").toLowerCase().includes(s) || (r.C||"").toLowerCase().includes(s) || (r.E||"").toLowerCase().includes(s) || (r.P||"").toLowerCase().includes(s);
  });

  const thumbHover = (code, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverImg(code);
    setHoverPos({top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 300)});
  };

  const COLS = [
    {k:"A",h:"ID",w:80,mono:true,c:"#6d28d9"},
    {k:"B",h:"Item Code",w:140,mono:true,link:true},
    {k:"_thumb",h:"Thumb",w:44},
    {k:"C",h:"Master",w:100},
    {k:"D",h:"Item Name",w:180,heroName:true},
    {k:"E",h:"Category",w:100,badge:true},
    {k:"F",h:"Loc",w:70,mono:true},
    {k:"G",h:"Loc Name",w:110,italic:true,green:true},
    {k:"H",h:"Bin",w:100,mono:true,muted:true},
    {k:"I",h:"UOM",w:55,bold:true,amber:true},
    {k:"M",h:"On Hand",w:90,mono:true,accent:true,right:true,heroNum:true},
    {k:"N",h:"Reorder",w:70,mono:true,muted:true,right:true},
    {k:"P",h:"Alert",w:80,alert:true},
    {k:"_abc",h:"ABC",w:70,abcBadge:true},
    {k:"_days",h:"Days",w:55,daysBadge:true},
    {k:"T",h:"Value",w:90,mono:true,amber:true,right:true},
    {k:"Q",h:"Last Recv",w:80,green:true},
    {k:"R",h:"Last Issue",w:80,red:true},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>
      {/* Toolbar */}
      <div style={{padding:"6px 12px",display:"flex",alignItems:"center",gap:8,background:M.mid,borderBottom:`1px solid ${M.div}`,flexShrink:0}}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code, name, category, alert…" style={{padding:"5px 10px",border:`1px solid ${M.inBd}`,borderRadius:5,background:M.inBg,color:M.tA,fontSize:10,outline:"none",width:260}}/>
        <span style={{fontSize:10,color:M.tC,fontWeight:700}}>{filtered.length} of {enriched.length} records</span>
        <div style={{flex:1}}/>
        <span style={{fontSize:8,fontWeight:700,color:M.tD}}>💡 Click any Item Code → record detail with sparklines + batch trace + comments</span>
      </div>
      {/* Views bar */}
      <div style={{padding:"5px 12px",borderBottom:`1px solid ${M.div}`,display:"flex",alignItems:"center",gap:6,background:M.lo,flexShrink:0}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase"}}>VIEWS:</span>
        <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:5,border:`1.5px solid ${CC_RED}`,background:`${CC_RED}08`,fontSize:9,fontWeight:900,color:CC_RED}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:CC_RED}}/>Default
          <span style={{padding:"1px 5px",fontSize:7,background:"#ececec",color:"#9ca3af",borderRadius:"0 3px 3px 0",fontWeight:900,marginLeft:4}}>LOCKED</span>
        </span>
        <span style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid #c4b5fd",background:"#fdf4ff",color:"#7C3AED",fontSize:9,fontWeight:900,cursor:"pointer"}}>+ Save View</span>
      </div>
      {/* Table */}
      <div style={{flex:1,overflowX:"auto",overflowY:"auto"}}>
        <table style={{borderCollapse:"collapse",minWidth:"100%"}}>
          <thead style={{position:"sticky",top:0,zIndex:20}}>
            <tr>
              {COLS.map(col => (
                <th key={col.k} style={{padding:"6px 8px",textAlign:col.right?"right":"left",fontSize:10,fontWeight:900,color:"#fff",background:"#1a2744",borderBottom:`3px solid ${CC_RED}`,whiteSpace:"nowrap",minWidth:col.w,letterSpacing:".4px"}}>{col.h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const code = r.B || "";
              const img = getFirstImg(code);
              const imgCount = getImgs(code).length;
              const emoji = CAT_EMOJI[r.C] || "📦";
              const days = r._days;
              const abc = r._abc || "C";
              const abcS = ABC_COLORS[abc] || ABC_COLORS.C;
              const alertS = ALERT_COLORS[r.P] || ALERT_COLORS.OK;
              return (
                <tr key={r.A || i} style={{height:40,borderBottom:`1px solid ${M.div}`,background:i%2===0?M.tev:M.tod}}>
                  {COLS.map(col => {
                    const v = r[col.k] || "";
                    // Thumbnail column
                    if (col.k === "_thumb") return (
                      <td key={col.k} style={{padding:"3px 4px",width:36}}>
                        <div
                          onClick={() => {setHoverImg(null);setHoverPos(null);setGalleryCode(code);}}
                          onMouseEnter={e => thumbHover(code, e)} onMouseLeave={() => {setHoverImg(null);setHoverPos(null);}}
                          style={{position:"relative",width:26,height:26,cursor:"pointer",flexShrink:0}}>
                          {imgCount > 1 && <div style={{position:"absolute",top:2,left:2,width:(_ts||{w:24}).w,height:(_ts||{h:24}).h,borderRadius:(_ts||{r:4}).r,border:`1px solid ${M.div}`,background:M.mid}}/>}
                          {imgCount > 2 && <div style={{position:"absolute",top:4,left:4,width:(_ts||{w:24}).w,height:(_ts||{h:24}).h,borderRadius:(_ts||{r:4}).r,border:`1px solid ${M.div}`,background:M.lo}}/>}
                          <div style={{position:"relative",width:24,height:24,borderRadius:4,overflow:"hidden",border:`1px solid ${img?A.a+"40":M.div}`,background:img?undefined:A.al,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>
                            {img ? <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : emoji}
                          </div>
                          {imgCount > 1 && (
                            <div style={{position:"absolute",top:-4,right:-6,minWidth:14,height:14,borderRadius:7,background:"#E8690A",color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:"1.5px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}>{imgCount}</div>
                          )}
                        </div>
                      </td>
                    );
                    // Clickable code column — large centered rounded pill, hover lifts UP, active presses DOWN
                    if (col.link) return (
                      <td key={col.k} style={{padding:"5px 6px",textAlign:"center"}}>
                        <button onClick={() => onOpenRecord?.(r)}
                          onMouseEnter={e => {e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,.18)";e.currentTarget.style.borderColor="#E8690A";}}
                          onMouseLeave={e => {e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,.08)";e.currentTarget.style.borderColor="#d1d5db";}}
                          onMouseDown={e => {e.currentTarget.style.transform="translateY(1px)";e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,.1)";}}
                          onMouseUp={e => {e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,.18)";}}
                          style={{background:"#fff",border:"1.5px solid #d1d5db",borderRadius:8,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:800,color:"#111827",padding:"6px 16px",transition:"all .15s ease",display:"block",width:"100%",boxShadow:"0 2px 6px rgba(0,0,0,.08)",whiteSpace:"nowrap",letterSpacing:".2px"}}>{v}</button>
                      </td>
                    );
                    // Alert badge
                    if (col.alert) return (<td key={col.k} style={{padding:"4px 6px"}}><V4AlertBadge v={v}/></td>);
                    // ABC badge
                    if (col.abcBadge) return (<td key={col.k} style={{padding:"4px 6px"}}><V4ABCBadge v={abc}/></td>);
                    // Days badge
                    if (col.daysBadge) return (
                      <td key={col.k} style={{padding:"4px 6px"}}>
                        <span style={{padding:"2px 6px",borderRadius:3,fontSize:9,fontWeight:800,background:days<=7?"#fef2f2":days<=21?"#fef3c7":"#dcfce7",color:days<=7?"#991b1b":days<=21?"#92400e":"#15803d"}}>{days>=999?"∞":days+"d"}</span>
                      </td>
                    );
                    // Category badge
                    if (col.badge) return (
                      <td key={col.k} style={{padding:"4px 6px"}}>
                        <span style={{background:A.al,color:A.a,padding:"1px 6px",borderRadius:3,fontSize:9,fontWeight:800}}>{v}</span>
                      </td>
                    );
                    // Standard cell — compact
                    const num = typeof v === "number" ? v.toLocaleString("en-IN") : v;
                    return (
                      <td key={col.k} style={{
                        padding:"4px 8px",
                        fontFamily:col.mono?"monospace":"inherit",
                        fontSize:col.heroName?13:col.heroNum?14:col.big?fz:fz-2,
                        fontWeight:col.heroName?900:col.heroNum?900:col.big?900:col.bold?800:col.c?700:400,
                        color:col.heroName?M.tA:col.c||col.accent?A.a:col.green?"#15803d":col.red?"#dc2626":col.amber?"#854d0e":col.muted?M.tC:M.tB,
                        fontStyle:"normal",
                        textAlign:col.right?"right":"left",
                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:col.w+60,
                      }}>{num || <span style={{color:M.tD}}>—</span>}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Status bar */}
      <div style={{padding:"4px 12px",borderTop:`1px solid ${M.div}`,background:M.mid,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{fontSize:9,color:M.tD,fontWeight:700}}>Total: {enriched.length} · Visible: {filtered.length} · 📊 Stock Ledger</span>
      </div>
      {/* Hover preview */}
      {hoverImg && hoverPos && !galleryCode && getFirstImg(hoverImg) && (
        <ImgPreview code={hoverImg} pos={hoverPos} M={M} A={A}/>
      )}
      {/* Gallery modal — click thumbnail opens this */}
      {galleryCode && (
        <GalleryModal code={galleryCode} onClose={() => setGalleryCode(null)} M={M} A={A}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DATA TYPE BADGE — used in all 4 tab types
// ═══════════════════════════════════════════════════════════
const DT_MAP = {
  manual:   {bg:"#fff1f2",tx:"#9f1239",bd:"#fecdd3"},
  autocode: {bg:"#ede9fe",tx:"#6d28d9",bd:"#c4b5fd"},
  calc:     {bg:"#fff7ed",tx:"#c2410c",bd:"#fed7aa"},
  auto:     {bg:"#f0fdf4",tx:"#166534",bd:"#bbf7d0"},
  fk:       {bg:"#eff6ff",tx:"#1d4ed8",bd:"#bfdbfe"},
  multifk:  {bg:"#eef2ff",tx:"#4338ca",bd:"#c7d2fe"},
  dropdown: {bg:"#f0f9ff",tx:"#0369a1",bd:"#bae6fd"},
  text:     {bg:"#fafafa",tx:"#374151",bd:"#e5e7eb"},
  currency: {bg:"#fefce8",tx:"#854d0e",bd:"#fde68a"},
  number:   {bg:"#f0fdf4",tx:"#166534",bd:"#bbf7d0"},
  url:      {bg:"#f0fdfa",tx:"#0f766e",bd:"#99f6e4"},
  textarea: {bg:"#fafafa",tx:"#374151",bd:"#e5e7eb"},
};
const DT_LABEL = {
  manual:"Manual", autocode:"AUTO #", calc:"Calc", auto:"Auto", fk:"FK",
  multifk:"Multi-FK", dropdown:"Dropdown", text:"Text", currency:"Rs",
  number:"Number", url:"URL", textarea:"Text Area",
};
function DtBadge({ type }) {
  const d = DT_MAP[type] || DT_MAP.text;
  return (
    <span style={{display:"inline-block",padding:"2px 6px",borderRadius:3,background:d.bg,color:d.tx,border:"1px solid "+d.bd,fontSize:9,fontWeight:800,whiteSpace:"nowrap"}}>
      {DT_LABEL[type] || type}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
//  ICON LABELS — field role indicators
// ═══════════════════════════════════════════════════════════
function IcoLabel({ ico, A }) {
  if (ico === "K") return <span title="Primary Key">🔑</span>;
  if (ico === "M") return <span style={{color:"#ef4444",fontWeight:900}}>⚠</span>;
  if (ico === "F") return <span style={{color:"#2563eb",fontWeight:900}}>→</span>;
  if (ico === "A") return <span style={{color:"#059669",fontWeight:900}}>←</span>;
  if (ico === "S") return <span style={{color:A.a,fontWeight:900}}>⟷</span>;
  if (ico === "C") return <span style={{color:"#c2410c",fontWeight:900}}>∑</span>;
  if (ico === "#") return <span style={{color:"#6d28d9",fontWeight:900}}>#</span>;
  return <span style={{color:"#9ca3af",fontSize:10}}>—</span>;
}

// ═══════════════════════════════════════════════════════════
//  FIELD INPUT — single-form mode input renderer
// ═══════════════════════════════════════════════════════════
function FieldInput({ f, val, onChange, M, A, fz, compact, hasError }) {
  const isAuto = f.auto || ["calc","autocode"].includes(f.type);
  const isMono = ["manual","autocode"].includes(f.type);
  const base = {
    width:"100%", borderRadius:4, outline:"none",
    padding: compact ? "3px 7px" : "5px 9px",
    fontSize: compact ? fz - 2 : fz - 1,
    border: "1px solid " + (hasError ? "#ef4444" : isAuto ? A.a+"40" : M.inBd),
    background: isAuto ? A.al : M.inBg,
    color: isAuto ? A.a : M.tA,
    fontFamily: isMono ? "monospace" : "inherit",
    fontWeight: f.type === "manual" ? 700 : 400,
    cursor: isAuto ? "not-allowed" : "text",
  };
  if (isAuto) return <input style={base} readOnly value={val || ""} placeholder={f.type === "autocode" ? "← GAS generates" : "← GAS auto-fills"} />;
  if (f.type === "textarea") return <textarea rows={compact ? 2 : 3} style={{...base, resize:"vertical"}} value={val || ""} onChange={e => onChange(e.target.value)} placeholder={f.hint} />;
  if (f.type === "dropdown") return (
    <select style={base} value={val || ""} onChange={e => onChange(e.target.value)}>
      <option value="">— select —</option>
      {(f.opts || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  if (f.type === "fk" || f.type === "multifk") return (
    <select style={base} value={val || ""} onChange={e => onChange(e.target.value)}>
      <option value="">— {f.fk} —</option>
      {(FK[f.fk] || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  if (f.type === "currency") return <input type="number" step="0.01" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder="Rs 0.00" />;
  if (f.type === "number")   return <input type="number" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder="0" />;
  return <input type="text" style={base} value={val || ""} onChange={e => onChange(e.target.value)} placeholder={f.hint} />;
}

// ═══════════════════════════════════════════════════════════
//  BULK CELL — inline cell editor for Bulk Entry grid
// ═══════════════════════════════════════════════════════════
function BulkCell({ f, val, onChange, onBlur, M, A, fz }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const base = {width:"100%",border:"2px solid "+A.a,borderRadius:4,background:M.inBg,color:M.tA,fontSize:fz-2,padding:"3px 6px",outline:"none",fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit"};
  if (f?.type === "dropdown" || f?.type === "fk" || f?.type === "multifk") {
    const opts = f.opts || FK[f.fk] || [];
    return (
      <select ref={ref} value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={{...base, cursor:"pointer"}}>
        <option value="">— select —</option>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    );
  }
  if (f?.type === "currency" || f?.type === "number") return <input ref={ref} type="number" value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={base} />;
  return <input ref={ref} type="text" value={val} onChange={e => onChange(e.target.value)} onBlur={onBlur} style={base} />;
}

// ═══════════════════════════════════════════════════════════
//  DRAG HOOK — resizable sidebar / panels
// ═══════════════════════════════════════════════════════════
function useDrag(init, min, max) {
  const [w, setW] = useState(init);
  const [drag, setDrag] = useState(false);
  const sx = useRef(0), sw = useRef(init);
  const onMouseDown = useCallback(e => {
    e.preventDefault(); setDrag(true); sx.current = e.clientX; sw.current = w;
  }, [w]);
  useEffect(() => {
    const mv = e => { if (!drag) return; setW(Math.min(max, Math.max(min, sw.current + (e.clientX - sx.current)))); };
    const up = () => setDrag(false);
    if (drag) { window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up); }
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, [drag, min, max]);
  return { w, drag, onMouseDown };
}

// ═══════════════════════════════════════════════════════════════════
//  Σ AGG ENGINE — 12 aggregation functions (shared by Records+Bulk)
// ═══════════════════════════════════════════════════════════════════
const AGG_OPTIONS = [
  { v:"none",           l:"—",               grp:""          },
  { v:"count",          l:"Count all",        grp:"Count"     },
  { v:"count_values",   l:"Count values",     grp:"Count"     },
  { v:"count_empty",    l:"Count empty",      grp:"Count"     },
  { v:"unique",         l:"Unique values",    grp:"Count"     },
  { v:"sum",            l:"Sum",              grp:"Calculate" },
  { v:"avg",            l:"Average",          grp:"Calculate" },
  { v:"min",            l:"Min",              grp:"Calculate" },
  { v:"max",            l:"Max",              grp:"Calculate" },
  { v:"range",          l:"Range (max−min)",  grp:"Calculate" },
  { v:"median",         l:"Median",           grp:"Calculate" },
  { v:"percent_filled", l:"% Filled",         grp:"Percent"   },
  { v:"percent_empty",  l:"% Empty",          grp:"Percent"   },
];
const AGG_COLORS = {
  count:"#0078D4", count_values:"#0078D4", count_empty:"#6b7280", unique:"#7C3AED",
  sum:"#15803d",   avg:"#E8690A",          min:"#0e7490",         max:"#7c2d12",
  range:"#4338ca", median:"#0891b2",       percent_filled:"#15803d", percent_empty:"#6b7280",
};
function computeAgg(fn, rows, col, allFields) {
  const f       = allFields.find(x => x.col === col);
  const vals    = rows.map(r => r[col]);
  const nonempty = vals.filter(v => v != null && v !== "");
  const nums    = nonempty.map(v => parseFloat(v)).filter(n => !isNaN(n));
  switch(fn) {
    case "none":           return null;
    case "count":          return rows.length;
    case "count_values":   return nonempty.length;
    case "count_empty":    return vals.length - nonempty.length;
    case "unique":         return new Set(nonempty.map(v => String(v))).size;
    case "sum":            return nums.length ? nums.reduce((a,b)=>a+b,0) : null;
    case "avg":            return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null;
    case "min":            return nums.length ? Math.min(...nums) : (nonempty.length ? nonempty.sort()[0] : null);
    case "max":            return nums.length ? Math.max(...nums) : (nonempty.length ? nonempty.sort().slice(-1)[0] : null);
    case "range":          return nums.length >= 2 ? Math.max(...nums) - Math.min(...nums) : null;
    case "median": {
      if (!nums.length) return null;
      const s = [...nums].sort((a,b)=>a-b), m = Math.floor(s.length/2);
      return s.length % 2 ? s[m] : (s[m-1]+s[m])/2;
    }
    case "percent_filled": return rows.length ? (nonempty.length/rows.length)*100 : null;
    case "percent_empty":  return rows.length ? ((rows.length-nonempty.length)/rows.length)*100 : null;
    default: return null;
  }
}
function fmtAgg(fn, val, allFields, col) {
  if (val === null || val === undefined) return "—";
  const f = allFields.find(x => x.col === col);
  const isCur = f?.type === "currency";
  if (["percent_filled","percent_empty"].includes(fn)) return val.toFixed(1) + "%";
  if (typeof val === "number") {
    return isCur
      ? "₹" + val.toLocaleString("en-IN", {maximumFractionDigits:2})
      : val % 1 === 0 ? val.toLocaleString("en-IN") : val.toLocaleString("en-IN",{maximumFractionDigits:2});
  }
  return String(val);
}

// ══ AggDropdown — fixed sibling OUTSIDE table (never inside tfoot) ══
function AggDropdown({ openInfo, aggState, setAggState, visRows, allFields, onClose, M, A }) {
  if (!openInfo) return null;
  const { col, top, left } = openInfo;
  const fn    = aggState?.[col] || "none";
  const val   = fn === "none" ? null : computeAgg(fn, visRows, col, allFields);
  const fmted = fmtAgg(fn, val, allFields, col);
  const handlePick = v => { setAggState(p => ({...p, [col]:v})); onClose(); };
  const grps = [...new Set(AGG_OPTIONS.filter(o=>o.grp).map(o=>o.grp))];
  return (
    <div onMouseDown={e => e.stopPropagation()} style={{
      position:"fixed", top, left, width:224, zIndex:9999,
      background:M.hi, border:"1.5px solid #c4b5fd", borderRadius:10,
      boxShadow:"0 16px 48px rgba(0,0,0,.32)", overflow:"hidden", maxHeight:400,
      display:"flex", flexDirection:"column",
    }}>
      <div style={{padding:"9px 12px",background:"#1e293b",borderBottom:"1px solid #2d3654"}}>
        <div style={{fontSize:11,fontWeight:900,color:"#e2e8f0"}}>{allFields.find(f=>f.col===col)?.h||col}</div>
        <div style={{fontSize:8,color:"#94a3b8",marginTop:1,fontFamily:"monospace"}}>[{col}]{fn!=="none"?" · "+fmted:""}</div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {/* None */}
        <button onClick={() => handlePick("none")} style={{display:"flex",width:"100%",padding:"7px 12px",border:"none",background:fn==="none"?M.hov:M.hi,color:M.tB,fontSize:10,fontWeight:fn==="none"?900:700,cursor:"pointer",textAlign:"left",borderLeft:"3px solid "+(fn==="none"?"#94a3b8":"transparent")}}>—</button>
        {grps.map(grp => (
          <div key={grp}>
            <div style={{padding:"4px 12px",fontSize:8,fontWeight:900,color:"#94a3b8",letterSpacing:.8,textTransform:"uppercase",background:M.mid,borderTop:"1px solid "+M.div,borderBottom:"1px solid "+M.div}}>{grp}</div>
            {AGG_OPTIONS.filter(o=>o.grp===grp).map(o => {
              const isActive = fn === o.v;
              const clr = AGG_COLORS[o.v] || M.tB;
              const ov = isActive ? fmtAgg(o.v, computeAgg(o.v, visRows, col, allFields), allFields, col) : null;
              return (
                <button key={o.v} onClick={() => handlePick(o.v)} style={{display:"flex",alignItems:"center",width:"100%",padding:"7px 12px",border:"none",background:isActive?(clr+"0f"):M.hi,color:isActive?clr:M.tB,fontSize:10,fontWeight:isActive?900:700,cursor:"pointer",textAlign:"left",borderLeft:"3px solid "+(isActive?clr:"transparent")}}>
                  {isActive && <span style={{width:6,height:6,borderRadius:"50%",background:clr,marginRight:6,flexShrink:0}}/>}
                  <span style={{flex:1}}>{o.l}</span>
                  {isActive && ov && <span style={{fontSize:9,background:clr+"20",color:clr,borderRadius:3,padding:"1px 6px",fontFamily:"monospace"}}>{ov}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{padding:"8px 12px",borderTop:"1px solid "+M.div,display:"flex",gap:6,background:M.mid}}>
        {fn !== "none" && <button onClick={() => handlePick("none")} style={{flex:1,padding:"5px",border:"1px solid #fecaca",borderRadius:5,background:"#fef2f2",color:"#dc2626",fontSize:9,fontWeight:900,cursor:"pointer"}}>✕ Remove</button>}
        <button onClick={onClose} style={{flex:1,padding:"5px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Close</button>
      </div>
    </div>
  );
}

// ══ AggFooter — pure tfoot row, no dropdowns ══
function AggFooter({ visRows, visCols, allFields, aggState, openCol, onCellClick, hasCheckbox, extraCols=0, M, A }) {
  const PURPLE = "#7C3AED";
  return (
    <tfoot>
      <tr style={{borderTop:"2px solid "+PURPLE}}>
        {hasCheckbox && <td style={{background:"#ede9fe",borderRight:"1px solid "+M.div}}/>}
        {Array.from({length:extraCols},(_,i)=><td key={"x"+i} style={{background:"#ede9fe",borderRight:"1px solid "+M.div}}/>)}
        <td style={{padding:"6px 10px",background:"#ede9fe",borderRight:"1px solid "+M.div,fontWeight:900,fontSize:9,color:PURPLE,whiteSpace:"nowrap",textAlign:"center",letterSpacing:.5}}>Σ AGG</td>
        {visCols.map(col => {
          const fn   = aggState?.[col] || "none";
          const isOpen = openCol === col;
          const clr  = fn !== "none" ? (AGG_COLORS[col] || PURPLE) : M.tD;
          const val  = fn !== "none" ? computeAgg(fn, visRows, col, allFields) : null;
          const fmted = fn !== "none" ? fmtAgg(fn, val, allFields, col) : null;
          return (
            <td key={col} style={{padding:"3px 4px",background:"#ede9fe",borderRight:"1px solid "+M.div,textAlign:"center"}}>
              <button
                onClick={e => onCellClick(col, e.currentTarget)}
                style={{width:"100%",minHeight:22,padding:"2px 4px",border:`1.5px solid ${isOpen?"#7C3AED":fn!=="none"?(AGG_COLORS[col]||PURPLE)+"40":M.div}`,borderRadius:4,background:fn!=="none"?(AGG_COLORS[col]||PURPLE)+"0a":isOpen?"#ede9fe":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}
              >
                {fn === "none"
                  ? <><span style={{fontSize:11,opacity:.3}}>+</span><span style={{fontSize:7.5,opacity:.3}}>Calculate</span></>
                  : <><span style={{fontFamily:"monospace",fontSize:10,color:clr}}>{fmted}</span><span style={{fontSize:7,opacity:.6,marginLeft:2,color:clr}}>{AGG_OPTIONS.find(o=>o.v===fn)?.l}</span></>
                }
              </button>
            </td>
          );
        })}
        <td style={{background:"#ede9fe"}}/>
      </tr>
    </tfoot>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SORT PANEL — Notion-style multi-level slide-over
//  Shared by RecordsTab and BulkEntry — one component, two uses
// ═══════════════════════════════════════════════════════════════════
const TYPE_OPTIONS = [
  {v:"auto",    l:"Auto-detect"},
  {v:"alpha",   l:"Text (A→Z)"},
  {v:"numeric", l:"Number"},
  {v:"date",    l:"Date"},
  {v:"length",  l:"Text length"},
];
function SortPanel({ sorts, setSorts, allFields, M, A, onClose }) {
  const [dragIdx,  setDragIdx]  = useState(null);
  const [overIdx,  setOverIdx]  = useState(null);
  const [expanded, setExpanded] = useState({});

  const fieldType = col => {
    const f = allFields.find(x => x.col === col);
    if (!f) return "alpha";
    if (["currency","number","calc"].includes(f.type)) return "numeric";
    if (f.type === "date") return "date";
    return "alpha";
  };
  const dirLabel = (type, dir) => {
    if (type === "numeric") return dir === "asc" ? "1 → 9"   : "9 → 1";
    if (type === "date")    return dir === "asc" ? "Oldest"   : "Newest";
    if (type === "length")  return dir === "asc" ? "Shortest" : "Longest";
    return dir === "asc" ? "A → Z" : "Z → A";
  };
  const addSort    = col => { if (!col || sorts.find(s => s.col === col)) return; setSorts(p => [...p, {col, dir:"asc", type:"auto", nulls:"last"}]); };
  const updateSort = (idx, patch) => setSorts(p => p.map((s,i) => i===idx ? {...s,...patch} : s));
  const removeSort = idx => setSorts(p => p.filter((_,i) => i!==idx));
  const moveSort   = (from, to) => { if (from===to) return; setSorts(p => { const a=[...p],[item]=a.splice(from,1); a.splice(to,0,item); return a; }); };

  const onDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed="move"; };
  const onDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const onDrop      = (e, i) => { e.preventDefault(); moveSort(dragIdx, i); setDragIdx(null); setOverIdx(null); };
  const onDragEnd   = () => { setDragIdx(null); setOverIdx(null); };

  const resolvedType = s => s.type === "auto" ? fieldType(s.col) : s.type;
  const available    = allFields.filter(f => !sorts.find(s => s.col === f.col));
  const presets      = [
    {lbl:"Name A→Z",  sorts:[{col:allFields[0]?.col||"A", dir:"asc",  type:"auto", nulls:"last"}]},
    {lbl:"Name Z→A",  sorts:[{col:allFields[0]?.col||"A", dir:"desc", type:"auto", nulls:"last"}]},
    {lbl:"Clear All", sorts:[]},
  ];

  return (
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",pointerEvents:"none"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.18)",pointerEvents:"all"}} />
      <div style={{position:"relative",pointerEvents:"all",width:440,maxHeight:"100%",overflowY:"auto",background:M.hi,borderLeft:"2px solid #7C3AED",boxShadow:"-4px 0 24px rgba(0,0,0,.18)",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:8,background:"#7C3AED",flexShrink:0}}>
          <span style={{fontSize:14}}>↕</span>
          <span style={{fontSize:12,fontWeight:900,color:"#fff",letterSpacing:.3}}>Sort</span>
          <span style={{background:"rgba(255,255,255,.25)",color:"#fff",borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:900}}>{sorts.length} rule{sorts.length!==1?"s":""}</span>
          <div style={{flex:1}} />
          {sorts.length>0 && <button onClick={() => setSorts([])} style={{padding:"4px 10px",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:5,background:"transparent",color:"#fff",fontSize:9,fontWeight:800,cursor:"pointer"}}>✕ Clear all</button>}
          <button onClick={onClose} style={{padding:"4px 8px",border:"none",borderRadius:5,background:"rgba(255,255,255,.15)",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>✕</button>
        </div>
        {/* Quick Presets */}
        <div style={{padding:"8px 14px",borderBottom:"1px solid "+M.div,display:"flex",gap:5,flexWrap:"wrap",flexShrink:0,background:M.mid}}>
          <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",alignSelf:"center",marginRight:4}}>QUICK:</span>
          {presets.map((p, pi) => (
            <button key={pi} onClick={() => setSorts(p.sorts)} style={{padding:"3px 10px",borderRadius:5,border:"1.5px solid "+(pi===presets.length-1?"#fecaca":"#c4b5fd"),background:pi===presets.length-1?"#fef2f2":"#f5f3ff",color:pi===presets.length-1?"#dc2626":"#7C3AED",fontSize:9,fontWeight:800,cursor:"pointer"}}>
              {p.lbl}
            </button>
          ))}
        </div>
        {/* Empty state */}
        {sorts.length===0 && <div style={{padding:"32px 16px",textAlign:"center",color:M.tD}}><div style={{fontSize:28,marginBottom:8}}>↕</div><div style={{fontSize:12,fontWeight:700,color:M.tB,marginBottom:4}}>No sort rules</div><div style={{fontSize:10}}>Add a column below to sort</div></div>}
        {/* Rules */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {sorts.map((s, idx) => {
            const f = allFields.find(x => x.col === s.col);
            const rtype = resolvedType(s);
            const isExp  = expanded[idx];
            const isDrag = dragIdx === idx;
            const isOver = overIdx === idx && dragIdx !== idx;
            return (
              <div key={s.col+idx} draggable onDragStart={e=>onDragStart(e,idx)} onDragOver={e=>onDragOver(e,idx)} onDrop={e=>onDrop(e,idx)} onDragEnd={onDragEnd}
                style={{margin:"2px 10px",borderRadius:8,border:"1.5px solid "+(isOver?"#7C3AED":isDrag?"#c4b5fd":M.div),background:isOver?"#ede9fe":isDrag?"#f5f3ff":M.hi,opacity:isDrag?.5:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px"}}>
                  <span style={{cursor:"grab",fontSize:14,color:M.tD,userSelect:"none"}}>⠿</span>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#7C3AED",color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{idx+1}</div>
                  {idx>0 && <span style={{fontSize:8,fontWeight:700,color:M.tD}}>then by</span>}
                  <select value={s.col} onChange={e=>{if(!e.target.value||sorts.find((x,i)=>x.col===e.target.value&&i!==idx))return; updateSort(idx,{col:e.target.value,type:"auto"});}} style={{flex:1,padding:"5px 8px",border:"1.5px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tA,fontSize:10,fontWeight:700,cursor:"pointer",outline:"none"}}>
                    <option value={s.col}>{f?.h||s.col} [{s.col}]</option>
                    {available.map(af=><option key={af.col} value={af.col}>{af.h} [{af.col}]</option>)}
                  </select>
                  <button onClick={()=>updateSort(idx,{dir:s.dir==="asc"?"desc":"asc"})} style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid #c4b5fd",background:"#f5f3ff",color:"#6d28d9",fontSize:9,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>
                    {dirLabel(rtype,s.dir)}{s.dir==="asc"?" ↑":" ↓"}
                  </button>
                  <button onClick={()=>setExpanded(p=>({...p,[idx]:!p[idx]}))} style={{padding:"4px 6px",borderRadius:5,border:"1px solid "+M.div,background:isExp?"#ede9fe":M.inBg,color:isExp?"#7C3AED":M.tD,fontSize:10,cursor:"pointer"}}>{isExp?"▲":"▼"}</button>
                  <button onClick={()=>{removeSort(idx);setExpanded(p=>{const n={...p};delete n[idx];return n;});}} style={{width:22,height:22,borderRadius:4,border:"1px solid #fecaca",background:"#fef2f2",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:900}}>×</button>
                </div>
                {isExp && (
                  <div style={{borderTop:"1px dashed "+M.div,padding:"8px 10px 10px 42px",background:M.mid,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6}}>Sort type</span>
                      <select value={s.type} onChange={e=>updateSort(idx,{type:e.target.value})} style={{padding:"4px 7px",border:"1px solid #c4b5fd",borderRadius:5,background:"#f5f3ff",color:"#6d28d9",fontSize:9,fontWeight:700,cursor:"pointer",outline:"none"}}>
                        {TYPE_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6}}>Empty values</span>
                      <div style={{display:"flex",borderRadius:5,overflow:"hidden",border:"1px solid #c4b5fd"}}>
                        {["last","first"].map(v=>(
                          <button key={v} onClick={()=>updateSort(idx,{nulls:v})} style={{padding:"4px 10px",border:"none",background:s.nulls===v?"#7C3AED":"#f5f3ff",color:s.nulls===v?"#fff":"#6d28d9",fontSize:9,fontWeight:s.nulls===v?900:700,cursor:"pointer"}}>
                            {v==="last"?"Nulls last":"Nulls first"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6}}>Priority</span>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>idx>0&&moveSort(idx,idx-1)} disabled={idx===0} style={{padding:"4px 8px",borderRadius:5,border:"1px solid "+M.inBd,background:M.inBg,color:idx===0?M.tD:M.tB,fontSize:10,cursor:idx===0?"default":"pointer",opacity:idx===0?.4:1}}>↑</button>
                        <button onClick={()=>idx<sorts.length-1&&moveSort(idx,idx+1)} disabled={idx===sorts.length-1} style={{padding:"4px 8px",borderRadius:5,border:"1px solid "+M.inBd,background:M.inBg,color:idx===sorts.length-1?M.tD:M.tB,fontSize:10,cursor:idx===sorts.length-1?"default":"pointer",opacity:idx===sorts.length-1?.4:1}}>↓</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Add sort */}
        <div style={{padding:"10px 14px",borderTop:"1px solid "+M.div,flexShrink:0,background:M.mid}}>
          <select value="" onChange={e=>{addSort(e.target.value);e.target.value="";}} style={{width:"100%",padding:"8px 12px",border:"2px dashed #c4b5fd",borderRadius:7,background:"#f5f3ff",color:"#7C3AED",fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
            <option value="">+ Pick a column to sort by…</option>
            {available.map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
          </select>
        </div>
        {/* Summary strip */}
        {sorts.length>0 && (
          <div style={{padding:"6px 14px",borderTop:"1px solid "+M.div,background:M.lo,flexShrink:0}}>
            <div style={{fontSize:8,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.6,marginBottom:3}}>Active sort order</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {sorts.map((s,i)=>(
                <span key={i} style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:4,padding:"2px 7px",fontSize:8,fontWeight:800,color:"#6d28d9",display:"flex",alignItems:"center",gap:3}}>
                  <span style={{background:"#7C3AED",color:"#fff",borderRadius:"50%",width:12,height:12,fontSize:7,fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{i+1}</span>
                  {allFields.find(x=>x.col===s.col)?.h||s.col}
                  <span style={{opacity:.7}}>{s.dir==="asc"?"↑":"↓"}</span>
                  {s.nulls==="first"&&<span style={{opacity:.5,fontSize:7}}>∅↑</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  VIEW EDIT MODAL — 4-tab editor (Columns / Sort / Filter / Group)
//  Used by both RecordsTab and BulkEntry
// ═══════════════════════════════════════════════════════════════════
function ViewEditModal({ allFields, allCols, initial, isDup, existingNames, onSave, onCancel, M, A, fz }) {
  const [name,       setName]       = useState(initial.name);
  const [hiddenC,    setHiddenC]    = useState([...(initial.hiddenC||[])]);
  const [colOrder,   setColOrder]   = useState([...(initial.colOrder||allCols)]);
  const [sorts,      setSorts]      = useState([...(initial.sorts||[])]);
  const [filters,    setFilters]    = useState({...(initial.filters||{})});
  const [groupBy,    setGroupBy]    = useState(initial.groupBy||null);
  const [subGroupBy, setSubGroupBy] = useState(initial.subGroupBy||null);
  const [activeTab,  setActiveTab]  = useState("columns");

  const nameConflict = existingNames.includes(name.trim());
  const canSave = name.trim().length > 0 && !nameConflict;

  const toggleHide   = col => setHiddenC(p => p.includes(col) ? p.filter(c=>c!==col) : [...p,col]);
  const moveColUp    = col => setColOrder(p => { const a=[...p],i=a.indexOf(col); if(i<=0)return a; [a[i-1],a[i]]=[a[i],a[i-1]]; return a; });
  const moveColDown  = col => setColOrder(p => { const a=[...p],i=a.indexOf(col); if(i<0||i>=a.length-1)return a; [a[i],a[i+1]]=[a[i+1],a[i]]; return a; });

  const TAB_STYLE = t => ({padding:"6px 14px",border:"none",cursor:"pointer",fontSize:10,fontWeight:activeTab===t?900:700,borderBottom:"2px solid "+(activeTab===t?"#7C3AED":"transparent"),background:"transparent",color:activeTab===t?"#7C3AED":M.tC});

  return (
    <>
      <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(3px)",zIndex:2000}} />
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:660,maxHeight:"85vh",background:M.hi,border:"1px solid #c4b5fd",borderRadius:12,zIndex:2001,boxShadow:"0 8px 40px rgba(0,0,0,.4)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:"#7C3AED",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:18}}>{isDup?"⧉":"✏"}</span>
          <div>
            <div style={{fontSize:13,fontWeight:900,color:"#fff"}}>{isDup?"Duplicate View — Edit Before Saving":"Edit Saved View"}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.75)"}}>Change name, columns, sort, filters, group — then Save</div>
          </div>
          <button onClick={onCancel} style={{marginLeft:"auto",width:28,height:28,borderRadius:6,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",cursor:"pointer",fontSize:16}}>×</button>
        </div>
        {/* Name */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid "+M.div,background:M.mid,flexShrink:0,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,flexShrink:0}}>VIEW NAME *</span>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter view name…"
            style={{flex:1,border:"2px solid "+(nameConflict?"#ef4444":name.trim()?"#7C3AED":M.inBd),borderRadius:6,background:M.inBg,color:M.tA,fontSize:13,padding:"6px 10px",outline:"none",fontWeight:700}} />
          {nameConflict && <span style={{fontSize:10,color:"#ef4444",fontWeight:700,flexShrink:0}}>{name.trim().toLowerCase()==="default"?'⚠ "Default" is reserved':'⚠ Name already exists'}</span>}
          {!nameConflict && name.trim() && <span style={{fontSize:10,color:"#15803d",fontWeight:700,flexShrink:0}}>✓ OK</span>}
        </div>
        {/* Sub-tabs */}
        <div style={{display:"flex",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0}}>
          {[
            {id:"columns", lbl:"⊟ Columns", badge: hiddenC.length > 0 ? `${hiddenC.length} hidden` : `${colOrder.length}`},
            {id:"sort",    lbl:"↕ Sort",    badge: sorts.length > 0 ? `${sorts.length} active` : null},
            {id:"filter",  lbl:"🔍 Filter",  badge: Object.values(filters).filter(v=>v.trim()).length > 0 ? `${Object.values(filters).filter(v=>v.trim()).length} active` : null},
            {id:"group",   lbl:"⊞ Group",   badge: groupBy ? allFields.find(f=>f.col===groupBy)?.h?.slice(0,12)||groupBy : null},
          ].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={TAB_STYLE(t.id)}>
              {t.lbl}
              {t.badge && <span style={{marginLeft:5,background:activeTab===t.id?"#7C3AED":"#e0e7ef",color:activeTab===t.id?"#fff":"#374151",borderRadius:10,padding:"1px 6px",fontSize:8,fontWeight:900}}>{t.badge}</span>}
            </button>
          ))}
        </div>
        {/* Tab body */}
        <div style={{flex:1,overflowY:"auto"}}>
          {/* COLUMNS */}
          {activeTab==="columns" && (
            <div style={{padding:12}}>
              <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
                <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Toggle visibility · ↑↓ reorder</span>
                <button onClick={()=>setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:"auto"}}>Show All</button>
              </div>
              <div style={{border:"1px solid "+M.div,borderRadius:7,overflow:"hidden"}}>
                {colOrder.map((col,idx) => {
                  const f = allFields.find(x=>x.col===col);
                  const isHidden = hiddenC.includes(col);
                  return (
                    <div key={col} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderBottom:"1px solid "+M.div,background:isHidden?M.lo:M.hi,opacity:isHidden?.55:1}}>
                      <button onClick={()=>toggleHide(col)} style={{width:28,height:18,borderRadius:9,border:"none",cursor:"pointer",background:isHidden?"#d1d5db":"#7C3AED",position:"relative",flexShrink:0}}>
                        <span style={{position:"absolute",top:2,width:14,height:14,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.3)",left:isHidden?2:12}} />
                      </button>
                      <span style={{fontFamily:"monospace",fontSize:8,fontWeight:700,color:M.tD,width:20,flexShrink:0}}>{col}</span>
                      <span style={{flex:1,fontSize:fz-2,fontWeight:700,color:isHidden?M.tD:M.tA}}>{f?.h||col}</span>
                      {f && <DtBadge type={f.type} />}
                      <button onClick={()=>moveColUp(col)} disabled={idx===0} style={{width:18,height:18,borderRadius:3,border:"none",background:idx===0?M.lo:M.mid,color:idx===0?M.tD:M.tB,cursor:idx===0?"default":"pointer",fontSize:10}}>↑</button>
                      <button onClick={()=>moveColDown(col)} disabled={idx===colOrder.length-1} style={{width:18,height:18,borderRadius:3,border:"none",background:idx===colOrder.length-1?M.lo:M.mid,color:idx===colOrder.length-1?M.tD:M.tB,cursor:idx===colOrder.length-1?"default":"pointer",fontSize:10}}>↓</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* SORT */}
          {activeTab==="sort" && (
            <div style={{padding:12}}>
              <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Multi-level sort — first rule wins</span>
                {sorts.length>0 && <button onClick={()=>setSorts([])} style={{marginLeft:"auto",padding:"3px 9px",border:"1px solid #c4b5fd",borderRadius:4,background:"#ede9fe",color:"#6d28d9",fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>}
              </div>
              {sorts.length===0 && <div style={{padding:"20px",textAlign:"center",fontSize:11,color:M.tD,background:M.lo,borderRadius:7}}>No sorts — add a column below</div>}
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                {sorts.map((s,i) => {
                  const f = allFields.find(x=>x.col===s.col);
                  return (
                    <div key={s.col} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:7}}>
                      <span style={{fontSize:11,fontWeight:900,color:"#6d28d9",minWidth:18}}>{i+1}.</span>
                      <span style={{flex:1,fontSize:11,fontWeight:700,color:M.tA}}>{f?.h||s.col}</span>
                      <button onClick={()=>setSorts(p=>p.map(x=>x.col===s.col?{...x,dir:x.dir==="asc"?"desc":"asc"}:x))} style={{padding:"4px 12px",border:"1.5px solid #7C3AED",borderRadius:5,background:"#fff",color:"#7C3AED",fontSize:10,fontWeight:900,cursor:"pointer"}}>
                        {s.dir==="asc"?"↑ A → Z":"↓ Z → A"}
                      </button>
                      <button onClick={()=>setSorts(p=>p.filter(x=>x.col!==s.col))} style={{width:24,height:24,borderRadius:5,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",cursor:"pointer",fontSize:13,fontWeight:900}}>×</button>
                    </div>
                  );
                })}
              </div>
              <select onChange={e=>{if(e.target.value){setSorts(p=>[...p,{col:e.target.value,dir:"asc",type:"auto",nulls:"last"}]);}e.target.value="";}} value="" style={{padding:"6px 10px",border:"1.5px solid #c4b5fd",borderRadius:6,background:"#fdf4ff",color:"#7C3AED",fontSize:10,fontWeight:900,outline:"none",cursor:"pointer",width:"100%"}}>
                <option value="">+ Add sort column…</option>
                {allFields.filter(f=>!sorts.find(s=>s.col===f.col)).map(f=><option key={f.col} value={f.col}>{f.h} [{f.col}]</option>)}
              </select>
            </div>
          )}
          {/* FILTER */}
          {activeTab==="filter" && (
            <div style={{padding:12}}>
              <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Per-column text filters</span>
                <button onClick={()=>setFilters({})} style={{marginLeft:"auto",padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {allFields.filter(f=>!f.auto&&!["calc","autocode"].includes(f.type)).map(f => (
                  <div key={f.col} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:M.lo,border:"1px solid "+(filters[f.col]?.trim()?A.a:M.div),borderRadius:6}}>
                    <span style={{fontFamily:"monospace",fontSize:8,fontWeight:700,color:M.tD,width:20,flexShrink:0}}>{f.col}</span>
                    <span style={{fontSize:10,fontWeight:700,color:M.tB,flex:1}}>{f.h}</span>
                    <input value={filters[f.col]||""} onChange={e=>setFilters(p=>({...p,[f.col]:e.target.value}))} placeholder="Filter value…"
                      style={{border:"1px solid "+(filters[f.col]?.trim()?A.a:M.inBd),borderRadius:4,background:M.inBg,color:M.tA,fontSize:10,padding:"3px 8px",outline:"none",width:160}} />
                    {filters[f.col]?.trim() && <button onClick={()=>setFilters(p=>{const n={...p};delete n[f.col];return n;})} style={{border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:12}}>×</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* GROUP */}
          {activeTab==="group" && (
            <div style={{padding:12}}>
              <div style={{marginBottom:8,fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8}}>Primary Group</div>
              <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:16}}>
                <label style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:groupBy===null?A.al:M.lo,border:"1px solid "+(groupBy===null?A.a:M.div),borderRadius:6,cursor:"pointer"}}>
                  <input type="radio" checked={groupBy===null} onChange={()=>{setGroupBy(null);setSubGroupBy(null);}} style={{margin:0}} />
                  <span style={{fontSize:10,fontWeight:groupBy===null?900:700,color:groupBy===null?A.a:M.tB}}>No grouping</span>
                </label>
                {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)).map(f=>(
                  <label key={f.col} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:groupBy===f.col?A.al:M.lo,border:"1px solid "+(groupBy===f.col?A.a:M.div),borderRadius:6,cursor:"pointer"}}>
                    <input type="radio" checked={groupBy===f.col} onChange={()=>{setGroupBy(f.col);setSubGroupBy(null);}} style={{margin:0}} />
                    <span style={{fontFamily:"monospace",fontSize:8,color:M.tD,width:20}}>{f.col}</span>
                    <span style={{fontSize:10,fontWeight:groupBy===f.col?900:700,color:groupBy===f.col?A.a:M.tB}}>{f.h}</span>
                    <DtBadge type={f.type} />
                  </label>
                ))}
              </div>
              {groupBy && <>
                <div style={{borderTop:"2px dashed #c4b5fd",paddingTop:12,marginBottom:8,fontSize:9,fontWeight:900,color:"#6d28d9",textTransform:"uppercase",letterSpacing:.8}}>Sub-Group (within each group)</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:subGroupBy===null?"#ede9fe":M.lo,border:"1px solid "+(subGroupBy===null?"#7C3AED":M.div),borderRadius:6,cursor:"pointer"}}>
                    <input type="radio" checked={subGroupBy===null} onChange={()=>setSubGroupBy(null)} style={{margin:0}} />
                    <span style={{fontSize:10,fontWeight:subGroupBy===null?900:700,color:subGroupBy===null?"#6d28d9":M.tB}}>No sub-grouping</span>
                  </label>
                  {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)&&f.col!==groupBy).map(f=>(
                    <label key={f.col} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:subGroupBy===f.col?"#ede9fe":M.lo,border:"1px solid "+(subGroupBy===f.col?"#7C3AED":M.div),borderRadius:6,cursor:"pointer"}}>
                      <input type="radio" checked={subGroupBy===f.col} onChange={()=>setSubGroupBy(f.col)} style={{margin:0}} />
                      <span style={{fontFamily:"monospace",fontSize:8,color:M.tD,width:20}}>{f.col}</span>
                      <span style={{fontSize:10,fontWeight:subGroupBy===f.col?900:700,color:subGroupBy===f.col?"#6d28d9":M.tB}}>{f.h}</span>
                    </label>
                  ))}
                </div>
              </>}
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{padding:"10px 16px",borderTop:"1px solid "+M.div,display:"flex",alignItems:"center",gap:8,background:M.mid,flexShrink:0}}>
          <div style={{flex:1,fontSize:9,color:M.tC}}>{`${colOrder.filter(c=>!hiddenC.includes(c)).length} visible · ${sorts.length} sort(s) · ${Object.values(filters).filter(v=>v.trim()).length} filter(s)${groupBy?" · grouped":""}${subGroupBy?" · sub-grouped":""}`}</div>
          {!canSave && <span style={{fontSize:10,color:"#ef4444",fontWeight:700}}>{nameConflict?"⚠ Name already taken":"⚠ Enter a name"}</span>}
          <button onClick={onCancel} style={{padding:"7px 16px",border:"1px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tB,fontSize:11,fontWeight:800,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>canSave&&onSave({name:name.trim(),colOrder,hiddenC,sorts,filters,groupBy,subGroupBy})} disabled={!canSave}
            style={{padding:"7px 22px",border:"none",borderRadius:6,background:canSave?"#7C3AED":M.bBg,color:canSave?"#fff":M.tD,fontSize:11,fontWeight:900,cursor:canSave?"pointer":"default",opacity:canSave?1:.6}}>
            💾 Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SHARED VIEW HELPERS — used in both RecordsTab and BulkEntry
// ═══════════════════════════════════════════════════════════════════
function buildViewState(vs, allCols) {
  const savedOrder  = vs?.colOrder ? vs.colOrder.filter(c => allCols.includes(c)) : [];
  const missingCols = allCols.filter(c => !savedOrder.includes(c));
  return {
    colOrder:       savedOrder.length > 0 ? [...savedOrder, ...missingCols] : allCols,
    hiddenC:        vs?.hiddenC        ?? [],
    sorts:          vs?.sorts          ?? [],
    filters:        vs?.filters        ?? {},
    groupBy:        vs?.groupBy        ?? null,
    subGroupBy:     vs?.subGroupBy     ?? null,
    activeViewName: vs?.activeViewName ?? "Default",
  };
}
function buildGrouped(visRows, groupBy, subGroupBy) {
  if (!groupBy) return [{key:null, sub:[{subKey:null, rows:visRows}]}];
  const map = {};
  visRows.forEach(r => { const k = String(r[groupBy]||"(blank)"); if(!map[k]) map[k]=[]; map[k].push(r); });
  return Object.entries(map).map(([key, rows]) => {
    if (!subGroupBy || subGroupBy===groupBy) return {key, sub:[{subKey:null, rows}]};
    const smap = {};
    rows.forEach(r => { const sk=String(r[subGroupBy]||"(blank)"); if(!smap[sk]) smap[sk]=[]; smap[sk].push(r); });
    return {key, sub:Object.entries(smap).map(([subKey,rows])=>({subKey,rows}))};
  });
}
function applySortFilter(rows, sorts, filters, allFields) {
  let rs = [...rows];
  Object.entries(filters).forEach(([col,val]) => {
    if (!val?.trim()) return;
    rs = rs.filter(r => String(r[col]||"").toLowerCase().includes(val.trim().toLowerCase()));
  });
  if (sorts.length > 0) {
    rs.sort((a,b) => {
      for (const {col,dir,type,nulls} of sorts) {
        const av=a[col], bv=b[col];
        const an=av==null||av==="", bn=bv==null||bv==="";
        if(an&&bn) continue;
        if(an) return nulls==="first"?-1:1;
        if(bn) return nulls==="first"?1:-1;
        const ft=type==="auto"||!type?(()=>{const f=allFields.find(x=>x.col===col);return ["currency","number","calc"].includes(f?.type)?"numeric":f?.type==="date"?"date":"alpha";})():type;
        let d=0;
        if(ft==="numeric"){d=parseFloat(av)-parseFloat(bv);if(isNaN(d))d=0;}
        else if(ft==="date"){d=new Date(av)-new Date(bv);if(isNaN(d))d=0;}
        else if(ft==="length"){d=String(av).length-String(bv).length;}
        else{d=String(av).localeCompare(String(bv),undefined,{sensitivity:"base"});}
        if(d!==0) return dir==="asc"?d:-d;
      }
      return 0;
    });
  }
  return rs;
}

// ═══════════════════════════════════════════════════════════════════
//  RECORDS TAB — read-only browser with full view system
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//  CATEGORY-SPECIFIC ATTRIBUTES — data + strip component
// ═══════════════════════════════════════════════════════════
const CAT_COLORS = {
  FABRIC:{bg:"#fef2f2",bd:"#CC0000",tx:"#991b1b",hi:"#CC000018"},
  YARN:{bg:"#eff6ff",bd:"#1d4ed8",tx:"#1e3a8a",hi:"#1d4ed818"},
  TRIM:{bg:"#faf5ff",bd:"#7C3AED",tx:"#5b21b6",hi:"#7C3AED18"},
  CONSUMABLE:{bg:"#f0fdf4",bd:"#15803d",tx:"#14532d",hi:"#15803d18"},
  PACKAGING:{bg:"#fff7ed",bd:"#E8690A",tx:"#9a3412",hi:"#E8690A18"},
  ARTICLE:{bg:"#fdf4ff",bd:"#BE123C",tx:"#831843",hi:"#BE123C18"},
};
const LEDGER_CAT_DATA = {
  "RM-FAB-001":{c1:"R-001..05",c2:"5",c3:"250",c4:"1,400",c5:"180",c6:"72\"",c7:"5×3",c8:"Single Jersey",c9:"White",c10:"DL-2026-001"},
  "RM-FAB-002":{c1:"R-010..18",c2:"9",c3:"180",c4:"820",c5:"220",c6:"68\"",c7:"4×2",c8:"Pique",c9:"Natural",c10:"DL-2026-003"},
  "RM-FAB-003":{c1:"R-020..22",c2:"3",c3:"15",c4:"54",c5:"280",c6:"66\"",c7:"3×2",c8:"Fleece",c9:"Grey Melange",c10:"DL-2026-005"},
  "TRM-THD-001":{c1:"Thread",c2:"White",c3:"120 Tex",c4:"Coats",c5:"200",c6:"MC-2026-001"},
  "TRM-ZIP-001":{c1:"Zipper",c2:"Black",c3:"6\" Nylon",c4:"YKK",c5:"50",c6:"MC-2026-002"},
  "CON-DYE-001":{c1:"Reactive Black HE-B",c2:"B-042",c3:"15-Jun-2026",c4:"Class 2",c5:"MSDS-042",c6:"Cool & Dry",c7:"99.5%"},
  "PKG-PLY-001":{c1:"12×14\"",c2:"LDPE",c3:"None",c4:"40 micron",c5:"100",c6:"No",c7:"8901234567890"},
  "5249HP":{c1:"5249HP",c2:"S-M-L-XL-XXL",c3:"White/Navy/Black",c4:"Myntra",c5:"SS26",c6:"CTN-001..010",c7:"10",c8:"8901234500001",c9:"₹599",c10:"Yes"},
  "54568HR":{c1:"54568HR",c2:"M-L-XL-XXL",c3:"Charcoal/Black",c4:"Amazon",c5:"AW26",c6:"CTN-050..058",c7:"9",c8:"8901234500002",c9:"₹899",c10:"Yes"},
};
function CategoryAttributeStrip({itemCode,category,M,A}){
  const fields=ISSUE_CAT_FIELDS[category]||[];
  const data=LEDGER_CAT_DATA[itemCode]||{};
  const cc=CAT_COLORS[category]||CAT_COLORS.FABRIC;
  const emoji=CAT_EMOJI[category]||"📦";
  if(!fields.length)return null;
  return(
    <div style={{background:cc.bg,borderLeft:`4px solid ${cc.bd}`,padding:"7px 12px 7px 14px"}}>
      <div style={{fontSize:11,fontWeight:900,color:cc.tx,marginBottom:5,display:"flex",alignItems:"center",gap:5}}>
        <span style={{fontSize:13}}>{emoji}</span>
        {category} ATTRIBUTES
        <span style={{fontSize:9,fontWeight:600,color:cc.bd,background:cc.hi,padding:"2px 6px",borderRadius:3}}>{fields.length} fields</span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {fields.map(f=>{const val=data[f.id]||"—";return(
          <div key={f.id} style={{background:M.sh||"#fff",borderRadius:6,padding:"8px 14px",border:`1px solid ${cc.bd}30`,minWidth:0,flex:"0 0 auto",maxWidth:200}}>
            <div style={{fontSize:11,fontWeight:800,color:cc.bd,textTransform:"uppercase",letterSpacing:.4,lineHeight:1.2,marginBottom:3}}>{f.h}</div>
            <div style={{fontSize:15,fontWeight:800,color:M.tA||"#111",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.3}}>{val}</div>
          </div>
        );})}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MIP POPUP — PO breakdown when clicking MIP qty
// ═══════════════════════════════════════════════════════════
function MIPPopup({ itemCode, itemName, onClose, M, A }) {
  const mip = getMIP(itemCode);
  const uom = getItemUOM(itemCode);
  if (!mip || mip.totalMIP === 0) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:M.sh,border:"2px solid "+A.a,borderRadius:12,width:560,maxHeight:"80vh",overflow:"auto",boxShadow:M.shadow}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:M.tA}}>📦 Material In Purchase — Pipeline Stock</div>
            <div style={{fontSize:11,color:M.tC,marginTop:2}}>{itemCode} — {itemName}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:M.tC,padding:4}}>✕</button>
        </div>
        <div style={{display:"flex",gap:12,padding:"12px 18px",background:M.lo}}>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:A.a}}>{mip.totalMIP.toLocaleString("en-IN")}</div>
            <div style={{fontSize:10,color:M.tC}}>Total MIP ({uom.uomC})</div>
          </div>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:"#15803d"}}>{mip.pos.length}</div>
            <div style={{fontSize:10,color:M.tC}}>Open POs</div>
          </div>
          {uom.hasDualUOM && <div style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:"#7C3AED"}}>{convertQty(mip.totalMIP, itemCode, "C2P").toLocaleString("en-IN")}</div>
            <div style={{fontSize:10,color:M.tC}}>In {uom.uomP} (buy UOM)</div>
          </div>}
        </div>
        <div style={{padding:"12px 18px"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:CC_RED,color:"#fff"}}>
              {["PO No","Supplier","Ordered","Received","Pending","Exp. Date","Status"].map((h,i)=><th key={i} style={{padding:"6px 8px",textAlign:i>1&&i<5?"right":"left",fontWeight:700,fontSize:10}}>{h}</th>)}
            </tr></thead>
            <tbody>{mip.pos.map((p,i)=>(
              <tr key={i} style={{borderBottom:"1px solid "+M.div,background:i%2===0?M.tev:M.tod}}>
                <td style={{padding:"6px 8px",fontFamily:"monospace",fontWeight:700,color:A.a}}>{p.po}</td>
                <td style={{padding:"6px 8px",color:M.tB}}>{p.supplier}</td>
                <td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace"}}>{p.qty}</td>
                <td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace",color:"#15803d"}}>{p.received}</td>
                <td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace",fontWeight:700,color:"#E8690A"}}>{p.pending}</td>
                <td style={{padding:"6px 8px",fontFamily:"monospace",fontSize:11,color:M.tC}}>{p.expDate}</td>
                <td style={{padding:"6px 8px",textAlign:"center"}}><span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:800,background:p.status==="Open"?"#fef3c7":"#dcfce7",color:p.status==="Open"?"#92400e":"#15803d"}}>{p.status}</span></td>
              </tr>))}</tbody>
          </table>
        </div>
        {uom.hasDualUOM && <div style={{padding:"10px 18px",borderTop:"1px solid "+M.div,background:M.lo,fontSize:11,color:M.tC,display:"flex",alignItems:"center",gap:6}}>
          <span style={{background:"#7C3AED",color:"#fff",padding:"2px 6px",borderRadius:3,fontSize:9,fontWeight:800}}>UOM</span>
          Buy: {uom.uomP} → Issue: {uom.uomC} | Factor: 1 {uom.uomP} = {uom.cf} {uom.uomC}
        </div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ALLOC POPUP — WO/SO/JW breakdown when clicking Allocated
// ═══════════════════════════════════════════════════════════
function AllocPopup({ itemCode, itemName, onClose, M, A }) {
  const alloc = getAlloc(itemCode);
  const mip = getMIP(itemCode);
  const onHand = MOCK_MAP?.ledger?.find(r => r.B === itemCode)?.M || 0;
  const freeStock = onHand - alloc.totalAlloc;
  const projected = freeStock + mip.totalMIP;
  if (!alloc || alloc.totalAlloc === 0) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:M.sh,border:"2px solid #BE123C",borderRadius:12,width:620,maxHeight:"85vh",overflow:"auto",boxShadow:M.shadow}}>
        <div style={{padding:"14px 18px",borderBottom:"2px solid #BE123C",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,#BE123C,#9f1239)",borderRadius:"10px 10px 0 0"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>🔒 Stock Allocation — Reserved Material</div>
            <div style={{fontSize:11,color:"#fecdd3",marginTop:2}}>{itemCode} — {itemName}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.2)",border:"none",fontSize:14,cursor:"pointer",color:"#fff",padding:"4px 10px",borderRadius:6}}>✕</button>
        </div>
        <div style={{display:"flex",gap:8,padding:"14px 18px",background:M.lo,flexWrap:"wrap"}}>
          {[
            {label:"On Hand",value:onHand,color:M.tA,suffix:getItemUOM(itemCode).uomC},
            {label:"Allocated",value:alloc.totalAlloc,color:"#BE123C",suffix:"reserved"},
            {label:"Free Stock",value:freeStock,color:freeStock>0?"#15803d":"#991b1b",suffix:"usable now"},
            {label:"MIP Pipeline",value:mip.totalMIP,color:"#E8690A",suffix:"incoming"},
            {label:"Projected",value:projected,color:"#0078D4",suffix:"total available"},
          ].map((c,i)=>(
            <div key={i} style={{flex:"1 1 100px",textAlign:"center",padding:"8px 6px",borderRadius:8,border:"1px solid "+M.div,background:M.sh}}>
              <div style={{fontSize:18,fontWeight:700,color:c.color}}>{(typeof c.value==="number"?c.value:0).toLocaleString("en-IN")}</div>
              <div style={{fontSize:9,color:M.tC,marginTop:1}}>{c.label}</div>
              <div style={{fontSize:8,color:M.tD}}>{c.suffix}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 18px"}}>
          <div style={{fontSize:11,fontWeight:700,color:M.tB,marginBottom:8}}>ALLOCATION BREAKDOWN — {alloc.items.length} reservation{alloc.items.length!==1?"s":""}</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#1A1A2E",color:"#fff"}}>
              {["Type","Ref No","Description","Article","Qty","Date","Status",""].map((h,i)=><th key={i} style={{padding:"7px 8px",textAlign:i===4?"right":"left",fontWeight:700,fontSize:10}}>{h}</th>)}
            </tr></thead>
            <tbody>{alloc.items.map((a,i)=>{
              const tc = ALLOC_TYPE_COLORS[a.type]||ALLOC_TYPE_COLORS.WO;
              return(
              <tr key={i} style={{borderBottom:"1px solid "+M.div,background:i%2===0?M.tev:M.tod}}>
                <td style={{padding:"7px 8px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:800,background:tc.bg,color:tc.tx,border:"1px solid "+tc.bd}}>{tc.icon} {a.type}</span></td>
                <td style={{padding:"7px 8px",fontFamily:"monospace",fontWeight:700,color:A.a,fontSize:11}}>{a.ref}</td>
                <td style={{padding:"7px 8px",color:M.tB,fontSize:11,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.desc}</td>
                <td style={{padding:"7px 8px",fontFamily:"monospace",fontSize:10,fontWeight:700,color:"#7C3AED"}}>{a.article}</td>
                <td style={{padding:"7px 8px",textAlign:"right",fontFamily:"monospace",fontWeight:800,fontSize:13,color:"#BE123C"}}>{a.qty.toLocaleString("en-IN")}</td>
                <td style={{padding:"7px 8px",fontFamily:"monospace",fontSize:10,color:M.tC}}>{a.date}</td>
                <td style={{padding:"7px 8px"}}><span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:800,
                  background:a.status.includes("Progress")?"#eff6ff":a.status.includes("Confirm")||a.status.includes("Ready")?"#dcfce7":a.status.includes("Received")?"#faf5ff":"#fef3c7",
                  color:a.status.includes("Progress")?"#1d4ed8":a.status.includes("Confirm")||a.status.includes("Ready")?"#15803d":a.status.includes("Received")?"#7C3AED":"#92400e",
                }}>{a.status}</span></td>
                <td style={{padding:"7px 4px"}}><button title="Release this allocation" style={{background:"none",border:"1px solid #fecdd3",borderRadius:4,color:"#BE123C",fontSize:9,fontWeight:800,padding:"3px 6px",cursor:"pointer"}} onClick={e=>{e.stopPropagation();alert(`Release ${a.qty} ${getItemUOM(itemCode).uomC} from ${a.ref}?\n\nThis would free stock for other use.\n(Not wired to GAS yet — mock only)`)}}>Release</button></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
        <div style={{padding:"10px 18px",borderTop:"1px solid "+M.div,background:"#fff7ed",fontSize:11,color:"#92400e",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>⚠️</span>
          <span><strong>Emergency override:</strong> Click "Release" on any row to free allocated stock for immediate use. Released qty moves back to Free Stock.</span>
        </div>
      </div>
    </div>
  );
}

function UOMBadge({ itemCode }) {
  const u = getItemUOM(itemCode);
  if (!u.hasDualUOM) return null;
  return (
    <span title={`Buy: ${u.uomP} → Issue: ${u.uomC} (1 ${u.uomP} = ${u.cf} ${u.uomC})`}
      style={{display:"inline-block",marginLeft:4,padding:"1px 5px",borderRadius:3,fontSize:8,fontWeight:800,
        background:"#f3e8ff",color:"#7C3AED",border:"1px solid #c4b5fd",cursor:"help",verticalAlign:"middle"}}>
      {u.uomP}→{u.uomC}
    </span>
  );
}

function RecordsTab({ allFields, mockRecords, M, A, fz, pyV, viewState, setViewState, templates, onSaveTemplate, onDeleteTemplate, onOpenRecord, showThumb, renderMode, ts, onOpenMIP, onOpenAlloc }) {
  const _ts = ts || {w:24,h:24,rw:26,rh:26,r:4}; // default small
  const isListMode = renderMode === "list";
  const [galleryCode, setGalleryCode] = useState(null);
  const [hoverThumb, setHoverThumb] = useState(null);
  const [hoverThumbPos, setHoverThumbPos] = useState(null);
  const [collapsedGrps, setCollapsedGrps] = useState({});
  const [collapsedSubs, setCollapsedSubs] = useState({});
  const toggleGrp = (key) => setCollapsedGrps(p => ({...p, [key]: !p[key]}));
  const toggleSub = (key) => setCollapsedSubs(p => ({...p, [key]: !p[key]}));
  // ── Expandable category attribute rows ──
  const [expandedRows, setExpandedRows] = useState(new Set());
  const toggleExpand = (itemCode) => setExpandedRows(prev => { const n = new Set(prev); if(n.has(itemCode)) n.delete(itemCode); else n.add(itemCode); return n; });

  // GRP_PALETTE and GRP_EMOJI_MAP are module-level constants (above)
  const allCols = allFields.map(f => f.col);
  const DEFAULT_VIEW = {name:"Default",__builtin:true,colOrder:allCols,hiddenC:[],sorts:[],filters:{},groupBy:null,subGroupBy:null};

  const {colOrder,hiddenC,sorts,filters,groupBy,subGroupBy,activeViewName} = buildViewState(viewState, allCols);
  const setColOrder      = v => setViewState(p=>({...(p||{}),colOrder:      typeof v==="function"?v((p||{}).colOrder??allCols):v}));
  const setHiddenC       = v => setViewState(p=>({...(p||{}),hiddenC:       typeof v==="function"?v((p||{}).hiddenC??[]):v}));
  const setSorts         = v => setViewState(p=>({...(p||{}),sorts:         typeof v==="function"?v((p||{}).sorts??[]):v}));
  const setFilters       = v => setViewState(p=>({...(p||{}),filters:       typeof v==="function"?v((p||{}).filters??{}):v}));
  const setGroupBy       = v => setViewState(p=>({...(p||{}),groupBy:       typeof v==="function"?v((p||{}).groupBy??null):v}));
  const setSubGroupBy    = v => setViewState(p=>({...(p||{}),subGroupBy:    typeof v==="function"?v((p||{}).subGroupBy??null):v}));
  const setActiveViewName= v => setViewState(p=>({...(p||{}),activeViewName:typeof v==="function"?v((p||{}).activeViewName??"Default"):v}));

  const [search,        setSearch]        = useState("");
  const [showFP,        setShowFP]        = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [showCM,        setShowCM]        = useState(false);
  const [aggState,      setAggState]      = useState({});
  const [aggOpenInfo,   setAggOpenInfo]   = useState(null);
  const [showSave,      setShowSave]      = useState(false);
  const [tplName,       setTplName]       = useState("");
  const [renamingTpl,   setRenamingTpl]   = useState(null);
  const [editingTpl,    setEditingTpl]    = useState(null);
  const [viewSwitchGuard,setViewSwitchGuard]=useState(null);
  const [dragCol,       setDragCol]       = useState(null);
  const [dropCol,       setDropCol]       = useState(null);
  const [exportMenu,    setExportMenu]    = useState(false);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, color="#15803d") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };

  const visCols = colOrder.filter(c => !hiddenC.includes(c) && allCols.includes(c));
  const activeFilters = Object.values(filters).filter(v=>v.trim()).length;

  let visRows = applySortFilter(
    search.trim() ? mockRecords.filter(r => Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase())) : mockRecords,
    sorts, filters, allFields
  );
  const grouped = buildGrouped(visRows, groupBy, subGroupBy);

  const aggCellClick = (col, el) => {
    if (aggOpenInfo?.col===col) { setAggOpenInfo(null); return; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAggOpenInfo({col, top:Math.max(8,r.top-410), left:Math.min(r.left,window.innerWidth-230)});
  };

  const getViewDirty = () => {
    if (activeViewName==="Default") return !(JSON.stringify(colOrder)===JSON.stringify(allCols)&&hiddenC.length===0&&sorts.length===0&&Object.values(filters).every(v=>!v.trim())&&groupBy===null&&subGroupBy===null);
    const saved=templates.find(t=>t.name===activeViewName);
    if(!saved) return false;
    return JSON.stringify(colOrder)!==JSON.stringify((saved.colOrder||allCols).filter(c=>allCols.includes(c)))||JSON.stringify(hiddenC)!==JSON.stringify(saved.hiddenC||[])||JSON.stringify(sorts)!==JSON.stringify(saved.sorts||[])||JSON.stringify(filters)!==JSON.stringify(saved.filters||{})||groupBy!==(saved.groupBy||null)||subGroupBy!==(saved.subGroupBy||null);
  };
  const viewDirty = getViewDirty();

  const loadTemplate = tpl => {
    setColOrder((tpl.colOrder||allCols).filter(c=>allCols.includes(c)));
    setHiddenC(tpl.hiddenC||[]); setSorts(tpl.sorts||[]); setFilters(tpl.filters||{});
    setGroupBy(tpl.groupBy||null); setSubGroupBy(tpl.subGroupBy||null);
    setActiveViewName(tpl.name);
    showToast(`📂 View "${tpl.name}" loaded`,"#7C3AED");
  };
  const tryLoadTemplate = tpl => {
    if (viewDirty && tpl.name !== activeViewName) setViewSwitchGuard({pendingTpl:tpl});
    else loadTemplate(tpl);
  };
  const updateCurrentView = () => {
    if (activeViewName==="Default") return;
    onSaveTemplate({name:activeViewName,colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy});
    showToast(`✅ View "${activeViewName}" updated`);
  };
  const saveTemplate = () => {
    if (!tplName.trim()) return;
    if (tplName.trim().toLowerCase()==="default") { showToast('⚠ "Default" is reserved',"#dc2626"); return; }
    if (templates.find(t=>t.name===tplName.trim())) { showToast(`⚠ "${tplName.trim()}" already exists`,"#dc2626"); return; }
    onSaveTemplate({name:tplName.trim(),colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy});
    setActiveViewName(tplName.trim()); setTplName(""); setShowSave(false);
    showToast(`💾 View "${tplName.trim()}" saved`);
  };
  const deleteTemplate = name => {
    onDeleteTemplate(name);
    if (activeViewName===name) setActiveViewName("Default");
    showToast(`🗑 View "${name}" deleted`,"#dc2626");
  };
  const renameTemplate = (oldName, newName) => {
    if (!newName.trim()||newName.trim()===oldName) { setRenamingTpl(null); return; }
    if (newName.trim().toLowerCase()==="default") { showToast('⚠ Reserved name',"#dc2626"); setRenamingTpl(null); return; }
    if (templates.find(t=>t.name===newName.trim())) { showToast(`⚠ Already exists`,"#dc2626"); return; }
    const tpl=templates.find(t=>t.name===oldName); if(!tpl) return;
    onDeleteTemplate(oldName); onSaveTemplate({...tpl,name:newName.trim()});
    if (activeViewName===oldName) setActiveViewName(newName.trim());
    showToast(`✏ Renamed to "${newName.trim()}"`,"#0078D4");
    setRenamingTpl(null);
  };
  const editTemplate = tpl => setEditingTpl({tpl:{...tpl,colOrder:[...tpl.colOrder],hiddenC:[...tpl.hiddenC],sorts:[...tpl.sorts],filters:{...tpl.filters}},originalName:tpl.name});
  const dupTemplate  = tpl => {
    let dupName=tpl.name+" (copy)"; let i=1;
    while(templates.find(t=>t.name===dupName)||dupName.toLowerCase()==="default") dupName=tpl.name+` (copy ${++i})`;
    setEditingTpl({tpl:{...tpl,name:dupName},originalName:null});
  };
  const commitTplEdit = updated => {
    if (updated.name.toLowerCase()==="default") { showToast('⚠ "Default" is reserved',"#dc2626"); return; }
    if (editingTpl.originalName&&editingTpl.originalName!==updated.name) onDeleteTemplate(editingTpl.originalName);
    onSaveTemplate(updated); setActiveViewName(updated.name);
    showToast(`✅ View "${updated.name}" ${editingTpl.originalName?"updated":"created"}`);
    setEditingTpl(null);
  };

  const colW = col => { const f=allFields.find(x=>x.col===col); if(!f) return 110; if(f.type==="textarea") return 160; if(["currency","number"].includes(f.type)) return 80; if(["manual","autocode"].includes(f.type)) return 100; return 120; };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>
      {/* ── Toolbar Row 1 ── */}
      <div style={{padding:"6px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{position:"relative",display:"flex",alignItems:"center"}}>
          <span style={{position:"absolute",left:8,fontSize:11,color:M.tD}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search all fields…"
            style={{border:"1.5px solid "+(search?A.a:M.inBd),borderRadius:5,background:M.inBg,color:M.tA,fontSize:fz-1,padding:"5px 10px 5px 26px",outline:"none",width:210}} />
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:6,border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:12,padding:0}}>×</button>}
        </div>
        <span style={{fontSize:10,color:M.tC,fontWeight:700}}>{visRows.length} of {mockRecords.length} records</span>
        <div style={{width:1,height:22,background:M.div,margin:"0 2px"}} />
        <button onClick={()=>{setShowFP(p=>!p);setShowSortPanel(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showFP||activeFilters>0?A.a:M.inBd),background:showFP||activeFilters>0?A.al:M.inBg,color:showFP||activeFilters>0?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          🔍 Filter {activeFilters>0&&<span style={{background:A.a,color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{activeFilters}</span>}
        </button>
        <button onClick={()=>{setShowSortPanel(true);setShowFP(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showSortPanel||sorts.length>0?"#7C3AED":M.inBd),background:showSortPanel||sorts.length>0?"#ede9fe":M.inBg,color:showSortPanel||sorts.length>0?"#6d28d9":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ↕ Sort {sorts.length>0&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{sorts.length}</span>}
        </button>
        <select value={groupBy||""} onChange={e=>{setGroupBy(e.target.value||null);if(!e.target.value)setSubGroupBy(null);}} style={{padding:"5px 8px",border:"1.5px solid "+(groupBy?"#059669":M.inBd),borderRadius:5,background:groupBy?"#f0fdf4":M.inBg,color:groupBy?"#15803d":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">⊞ Group by…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>
        {groupBy&&<select value={subGroupBy||""} onChange={e=>setSubGroupBy(e.target.value||null)} style={{padding:"5px 8px",border:"1.5px solid "+(subGroupBy?"#7C3AED":"#bbf7d0"),borderRadius:5,background:subGroupBy?"#ede9fe":"#f0fdf4",color:subGroupBy?"#6d28d9":"#15803d",fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">↳ Sub-group…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)&&f.col!==groupBy).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>}
        <button onClick={()=>{setShowCM(p=>!p);setShowFP(false);setShowSortPanel(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showCM||hiddenC.length>0?"#0078D4":M.inBd),background:showCM||hiddenC.length>0?"#eff6ff":M.inBg,color:showCM||hiddenC.length>0?"#1d4ed8":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          ⊟ Cols {hiddenC.length>0&&<span style={{background:"#0078D4",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{hiddenC.length}</span>}
        </button>
        <div style={{flex:1}} />
        {/* Export */}
        <div style={{position:"relative"}}>
          <button onClick={()=>setExportMenu(p=>!p)} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(exportMenu?"#059669":M.inBd),background:exportMenu?"#f0fdf4":M.inBg,color:exportMenu?"#15803d":M.tB,fontSize:10,fontWeight:900,cursor:"pointer"}}>↓ Export ▾</button>
          {exportMenu&&<div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:34,right:0,background:M.hi,border:"1px solid "+M.div,borderRadius:7,boxShadow:"0 8px 24px rgba(0,0,0,.18)",zIndex:500,minWidth:180,overflow:"hidden"}}>
            {[{k:"pdf",l:"📄 Export as PDF",c:"#dc2626"},{k:"excel",l:"📊 Export as Excel",c:"#15803d"},{k:"gsheet",l:"📗 Open in Google Sheets",c:"#0078D4"},{k:"print",l:"🖨 Print",c:"#374151"}].map(x=>(
              <button key={x.k} onClick={()=>{setExportMenu(false);showToast("Exporting as "+x.k+"…","#0078D4");}} style={{display:"block",width:"100%",padding:"9px 14px",border:"none",background:"transparent",color:x.c,fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left",borderBottom:"1px solid "+M.div}}>{x.l}</button>
            ))}
          </div>}
        </div>
      </div>
      {/* ── Views Bar Row 2 ── */}
      <div style={{padding:"5px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:5,background:M.lo,flexShrink:0,flexWrap:"wrap",minHeight:32}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",flexShrink:0,marginRight:4}}>VIEWS:</span>
        {/* Default */}
        {(()=>{const isActive=activeViewName==="Default",isModified=isActive&&viewDirty;return(
          <div style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fff7ed":"#CC000015"):"#f5f5f5",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":CC_RED):"#d1d5db"),borderRadius:5,overflow:"hidden"}}>
            <button onClick={()=>tryLoadTemplate(DEFAULT_VIEW)} style={{padding:"4px 10px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":CC_RED):"#374151",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              {isActive&&<span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":CC_RED,display:"inline-block",flexShrink:0}}/>}
              🏠 Default
              {isModified&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}
            </button>
            <div style={{padding:"2px 6px",fontSize:7,fontWeight:900,color:"#9ca3af",letterSpacing:.5,background:"#ececec",borderLeft:"1px solid #d1d5db",height:"100%",display:"flex",alignItems:"center"}}>LOCKED</div>
          </div>
        );})()}
        {/* User saved views */}
        {templates.map(t => {
          const isActive=activeViewName===t.name,isModified=isActive&&viewDirty;
          return(
            <div key={t.name} style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fffbeb":"#ede9fe"):"#f5f3ff",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":"#7C3AED"):isModified?"#fcd34d":"#c4b5fd"),borderRadius:5,overflow:"hidden"}}>
              {renamingTpl?.name===t.name ? (
                <input autoFocus value={renamingTpl.tempName} onChange={e=>setRenamingTpl(p=>({...p,tempName:e.target.value}))}
                  onKeyDown={e=>{if(e.key==="Enter")renameTemplate(t.name,renamingTpl.tempName);if(e.key==="Escape")setRenamingTpl(null);}}
                  onBlur={()=>renameTemplate(t.name,renamingTpl.tempName)}
                  style={{padding:"3px 8px",border:"none",background:"#fff",color:"#6d28d9",fontSize:10,fontWeight:800,outline:"2px solid #7C3AED",width:130}} />
              ):(
                <button onClick={()=>tryLoadTemplate(t)} style={{padding:"4px 9px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":"#6d28d9"):"#7c3aed",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                  {isActive&&<span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":"#7C3AED",display:"inline-block",flexShrink:0}}/>}
                  📂 {t.name}
                  {isModified&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}
                </button>
              )}
              {isActive&&isModified&&<><div style={{width:1,height:16,background:"#fcd34d"}}/><button onClick={updateCurrentView} style={{padding:"4px 9px",border:"none",background:"#f59e0b",color:"#fff",fontSize:9,cursor:"pointer",fontWeight:900,whiteSpace:"nowrap"}}>💾 Update View</button></>}
              <div style={{width:1,height:16,background:"#c4b5fd"}}/>
              <button onClick={()=>setRenamingTpl(renamingTpl?.name===t.name?null:{name:t.name,tempName:t.name})} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#f59e0b",fontSize:10,cursor:"pointer",fontWeight:900}}>✎</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}}/>
              <button onClick={()=>editTemplate(t)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#0078D4",fontSize:10,cursor:"pointer",fontWeight:900}}>✏</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}}/>
              <button onClick={()=>dupTemplate(t)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#059669",fontSize:10,cursor:"pointer",fontWeight:900}}>⧉</button>
              <div style={{width:1,height:16,background:"#c4b5fd"}}/>
              <button onClick={()=>deleteTemplate(t.name)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#dc2626",fontSize:10,cursor:"pointer",fontWeight:900}}>×</button>
            </div>
          );
        })}
        <button onClick={()=>setShowSave(p=>!p)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid #c4b5fd",background:showSave?"#7C3AED":"#fdf4ff",color:showSave?"#fff":"#7C3AED",fontSize:9,fontWeight:900,cursor:"pointer"}}>+ Save View</button>
      </div>
      {/* Panels */}
      {showFP&&<div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,marginRight:4}}>FILTER BY:</span>
        {visCols.map(col=>{const f=allFields.find(x=>x.col===col);if(!f||f.auto||["calc","autocode"].includes(f.type))return null;return(<div key={col} style={{display:"flex",alignItems:"center",gap:4,background:M.lo,border:"1px solid "+M.inBd,borderRadius:5,padding:"3px 6px"}}><span style={{fontSize:8,fontWeight:900,color:M.tD,fontFamily:"monospace"}}>{col}</span><input value={filters[col]||""} onChange={e=>setFilters(p=>({...p,[col]:e.target.value}))} placeholder={f.h} style={{border:"none",background:"transparent",color:M.tA,fontSize:10,outline:"none",width:100}}/>{filters[col]&&<button onClick={()=>setFilters(p=>{const n={...p};delete n[col];return n;})} style={{border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:10,padding:0}}>×</button>}</div>);})}
        <button onClick={()=>setFilters({})} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button>
      </div>}
      {showCM&&<div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,marginRight:4}}>COLUMNS:</span>
        {allCols.map(col=>{const f=allFields.find(x=>x.col===col);const hidden=hiddenC.includes(col);return(<button key={col} onClick={()=>setHiddenC(p=>hidden?p.filter(c=>c!==col):[...p,col])} style={{padding:"3px 8px",borderRadius:4,border:"1.5px solid "+(hidden?M.div:A.a),background:hidden?M.lo:A.al,color:hidden?M.tD:A.a,fontSize:9,fontWeight:hidden?700:900,cursor:"pointer",textDecoration:hidden?"line-through":"none"}}>{col} {f?.h}</button>);})}
        <button onClick={()=>setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:4}}>Show All</button>
      </div>}
      {showSave&&<div style={{padding:"8px 12px",borderBottom:"1px solid "+M.div,background:"#fdfbff",flexShrink:0,display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:9,fontWeight:900,color:"#6d28d9",textTransform:"uppercase",letterSpacing:.8}}>SAVE VIEW:</span>
        <input value={tplName} onChange={e=>setTplName(e.target.value)} placeholder="View name…" style={{border:"1.5px solid #c4b5fd",borderRadius:5,background:"#fff",color:"#1a1a1a",fontSize:11,padding:"4px 9px",outline:"none",width:200}}/>
        <button onClick={saveTemplate} style={{padding:"5px 14px",border:"none",borderRadius:5,background:"#7C3AED",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>💾 Save</button>
        <button onClick={()=>setShowSave(false)} style={{padding:"5px 10px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>Cancel</button>
      </div>}
      {showSortPanel&&<SortPanel sorts={sorts} setSorts={setSorts} allFields={allFields} M={M} A={A} onClose={()=>setShowSortPanel(false)}/>}
      {/* Table */}
      <div style={{flex:1,overflowX:"auto",overflowY:"auto"}}>
        <table style={{borderCollapse:"collapse",minWidth:"100%"}}>
          <thead style={{position:"sticky",top:0,zIndex:20}}>
            <tr>
              <th style={{padding:isListMode?"6px 4px":"4px 6px",background:isListMode?"#1a2744":M.thd,borderBottom:isListMode?"3px solid "+CC_RED:"2px solid "+CC_RED,borderRight:isListMode?"none":"1px solid "+M.div,fontSize:isListMode?10:9,fontWeight:900,color:isListMode?"#fff":M.tB,width:28,textAlign:"center"}}>S.No</th>
              {(showThumb||isListMode) && <th style={{padding:isListMode?"6px 4px":"4px 6px",background:isListMode?"#1a2744":M.thd,borderBottom:isListMode?"3px solid "+CC_RED:"2px solid "+CC_RED,borderRight:isListMode?"none":"1px solid "+M.div,fontSize:isListMode?10:9,fontWeight:900,color:isListMode?"#fff":M.tB,width:_ts.rw+12}}>📷</th>}
              {visCols.map((col,ci)=>{const f=allFields.find(x=>x.col===col);const curSort=sorts.find(s=>s.col===col);return(
                <th key={col} draggable onDragStart={()=>setDragCol(col)} onDragOver={e=>{e.preventDefault();setDropCol(col);}} onDrop={()=>{if(dragCol&&dropCol&&dragCol!==dropCol){setColOrder(p=>{const a=[...p],fi=a.indexOf(dragCol),ti=a.indexOf(dropCol);if(fi<0||ti<0)return a;a.splice(fi,1);a.splice(ti,0,dragCol);return a;});}setDragCol(null);setDropCol(null);}} onClick={()=>{setSorts(p=>{const ex=p.find(s=>s.col===col);if(!ex)return[...p,{col,dir:"asc",type:"auto",nulls:"last"}];if(ex.dir==="asc")return p.map(s=>s.col===col?{...s,dir:"desc"}:s);return p.filter(s=>s.col!==col);});}}
                  style={{minWidth:colW(col),padding:isListMode?"6px 8px":pyV+"px 10px",background:isListMode?"#1a2744":M.thd,borderBottom:isListMode?"3px solid "+CC_RED:"2px solid "+CC_RED,borderRight:isListMode?"none":"1px solid "+M.div,textAlign:(f?.type==="number"||col==="M"||col==="N"||col==="T")?"right":"left",fontSize:isListMode?10:9,fontWeight:900,color:isListMode?(curSort?"#fbbf24":"#fff"):(curSort?CC_RED:M.tB),cursor:"pointer",whiteSpace:"nowrap",userSelect:"none",borderLeft:dropCol===col?"3px solid #f59e0b":"3px solid transparent",transition:"border-color .1s",letterSpacing:isListMode?".4px":"normal"}}>
                  {!isListMode&&<span style={{fontFamily:"monospace",fontSize:8,color:M.tD,marginRight:4}}>{col}</span>}
                  {f?.h||col}
                  {curSort&&<span style={{marginLeft:4,color:isListMode?"#fbbf24":CC_RED}}>{curSort.dir==="asc"?"↑":"↓"}</span>}
                </th>
              );})}
            </tr>
          </thead>
          <tbody>
            {grouped.map((grp,gi) => {
              const grpColor = GRP_PALETTE[gi % GRP_PALETTE.length];
              const grpEmoji = GRP_EMOJI_MAP[grp.key] || "📁";
              const grpCount = grp.sub.reduce((acc,s) => acc+s.rows.length, 0);
              const grpCollapsed = collapsedGrps[grp.key||gi];
              let serialNum = 0; // serial counter within group
              return (
              <React.Fragment key={gi}>
                {grp.key!==null && (
                  /* ── Group header ── */
                  <tr><td colSpan={visCols.length+((showThumb||isListMode)?1:0)+1} style={{padding:0,border:"none"}}>
                    <div onClick={() => toggleGrp(grp.key||gi)} style={{margin:gi>0?"10px 0 0":"0",borderRadius:grpCollapsed?"10px":"10px 10px 0 0",border:`1.5px solid ${grpColor.c}`,borderBottom:grpCollapsed?undefined:"none",overflow:"hidden",cursor:"pointer"}}>
                      <div style={{padding:"9px 14px",background:grpColor.grad,display:"flex",alignItems:"center",gap:9}}>
                        <span style={{fontSize:10,fontWeight:900,color:"#fff",transform:grpCollapsed?"rotate(0deg)":"rotate(90deg)",transition:"transform .2s",display:"inline-block"}}>▶</span>
                        <span style={{fontSize:15}}>{grpEmoji}</span>
                        <span style={{fontSize:13,fontWeight:900,color:"#fff"}}>{grp.key}</span>
                        <span style={{fontSize:9,fontWeight:900,padding:"2px 9px",borderRadius:10,background:"rgba(255,255,255,.25)",color:"#fff"}}>{grpCount} item{grpCount!==1?"s":""}</span>
                        <span style={{fontSize:8,fontWeight:800,padding:"2px 8px",borderRadius:4,background:"rgba(255,255,255,.15)",color:"rgba(255,255,255,.85)"}}>{allFields.find(f=>f.col===groupBy)?.h||groupBy}</span>
                        <span style={{marginLeft:"auto",fontSize:8,color:"rgba(255,255,255,.5)"}}>{grpCollapsed?"▶ expand":"▼ collapse"}</span>
                      </div>
                    </div>
                  </td></tr>
                )}
                {!grpCollapsed && grp.sub.map((sub,si)=>{
                  const subKey = `${grp.key||gi}-${sub.subKey||si}`;
                  const subCollapsed = collapsedSubs[subKey];
                  // Compute summary for sub-group
                  const subAlert = sub.rows.some(r=>(r.P||"").toUpperCase()==="CRITICAL");
                  const subReorder = sub.rows.some(r=>(r.P||"").toUpperCase()==="REORDER");
                  const cardColor = subAlert ? "#dc2626" : grpColor.c;
                  const cardBg = subAlert ? "#fef2f2" : grpColor.bg;
                  const subOnHand = sub.rows.reduce((s,r) => s+(parseFloat(r.M)||0),0);
                  const subValue = sub.rows.reduce((s,r) => s+(parseFloat(String(r.T||"0").replace(/[₹,]/g,""))||0),0);
                  const subUom = sub.rows[0]?.I || "";
                  return (
                  <React.Fragment key={si}>
                    {sub.subKey!==null && (
                      /* ── Sub-group card with left strip ── */
                      <tr><td colSpan={visCols.length+((showThumb||isListMode)?1:0)+1} style={{padding:grp.key!==null?"0 8px":"0",border:"none"}}>
                        <div style={{display:"flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:`1.5px solid ${cardColor}40`,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
                          {/* Left color strip */}
                          <div style={{width:5,background:cardColor,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            {/* Sub-header with serial, code, name, summary */}
                            <div onClick={() => toggleSub(subKey)} style={{padding:"5px 10px",background:cardBg,borderBottom:`1px solid ${cardColor}25`,display:"flex",alignItems:"center",gap:7,cursor:"pointer",flexWrap:"wrap"}}>
                              <span style={{fontSize:9,fontWeight:900,color:cardColor,transform:subCollapsed?"rotate(0deg)":"rotate(90deg)",transition:"transform .2s",display:"inline-block"}}>▶</span>
                              <div style={{width:18,height:18,borderRadius:"50%",background:cardColor,color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{si+1}</div>
                              <span style={{fontSize:10,fontWeight:900,color:cardColor,fontFamily:"monospace"}}>{sub.subKey}</span>
                              <span style={{fontSize:9,color:subAlert?"#991b1b":"#6b7280",fontStyle:"italic"}}>{sub.rows[0]?.D||""}</span>
                              <span style={{fontSize:8,fontWeight:900,padding:"1px 7px",borderRadius:8,background:cardColor,color:"#fff"}}>{sub.rows.length}</span>
                              <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                                {subOnHand>0&&<span style={{fontSize:8,fontWeight:800,color:subAlert?"#991b1b":grpColor.c,fontFamily:"monospace"}}>📊 {subOnHand.toLocaleString("en-IN")} {subUom}</span>}
                                {subValue>0&&<span style={{fontSize:8,fontWeight:800,color:"#854d0e",fontFamily:"monospace"}}>💰 ₹{subValue.toLocaleString("en-IN")}</span>}
                                {subAlert&&<span style={{padding:"1px 6px",borderRadius:3,fontSize:7,fontWeight:900,background:"#fef2f2",color:"#991b1b"}}>🔴 CRITICAL</span>}
                                {subReorder&&!subAlert&&<span style={{padding:"1px 6px",borderRadius:3,fontSize:7,fontWeight:900,background:"#fef3c7",color:"#92400e"}}>⚠ REORDER</span>}
                              </div>
                            </div>
                            {/* Section column headers */}
                            {!subCollapsed && (
                              <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
                                <th style={{padding:"3px 6px",background:cardBg+"08",borderBottom:`1.5px solid ${cardColor}`,fontSize:8,fontWeight:900,color:cardColor,width:28}}>S.No</th>
                                {(showThumb||isListMode) && <th style={{padding:"3px 6px",background:cardBg+"08",borderBottom:`1.5px solid ${cardColor}`,fontSize:8,fontWeight:900,color:cardColor,width:_ts.rw+12}}>📷</th>}
                                {visCols.map(col => {const f=allFields.find(x=>x.col===col);return(
                                  <th key={col} style={{padding:"3px 7px",background:cardBg+"08",borderBottom:`1.5px solid ${cardColor}`,fontSize:8,fontWeight:900,color:cardColor,textAlign:(f?.type==="number"||col==="M"||col==="T")?"right":"left",whiteSpace:"nowrap"}}>{!isListMode&&<span style={{fontFamily:"monospace",fontSize:7,color:cardColor+"90",marginRight:2}}>{col}</span>}{f?.h||col}</th>
                                );})}
                                {groupBy==="C"&&(ISSUE_CAT_FIELDS[sub.rows[0]?.C]||[]).map((cf,ci)=>{const _catCc=CAT_COLORS[sub.rows[0]?.C]||CAT_COLORS.FABRIC;return(
                                  <th key={"cat_"+cf.id} style={{padding:"3px 7px",background:_catCc.bg,borderBottom:`2px solid ${_catCc.bd}`,borderLeft:ci===0?`3px solid ${_catCc.bd}`:"none",fontSize:8,fontWeight:900,color:_catCc.tx,whiteSpace:"nowrap"}}>{cf.h}</th>
                                );})}
                              </tr></thead><tbody>
                              {sub.rows.map((row,ri)=>{
                                serialNum++;
                                const _thumbCode = (showThumb||isListMode) ? (row.B||"") : "";
                                const _thumbImg = (showThumb||isListMode) ? getFirstImg(_thumbCode) : null;
                                const _thumbCount = (showThumb||isListMode) ? getImgs(_thumbCode).length : 0;
                                const _thumbEmoji = (showThumb||isListMode) ? (CAT_EMOJI[row.C]||"📦") : "";
                                const _isExp1=expandedRows.has(row.B);const _cc1=CAT_COLORS[row.C]||CAT_COLORS.FABRIC;
                                return[
                                <tr key={ri} style={{height:isListMode?Math.max(40,_ts.rh+14):undefined,borderBottom:_isExp1?"none":("1px solid "+M.div),background:_isExp1?_cc1.bg:(ri%2===0?M.tev:M.tod)}}>
                                  <td style={{padding:"3px 4px",width:44}}><div style={{display:"flex",alignItems:"center",gap:2}}><button onClick={e=>{e.stopPropagation();toggleExpand(row.B);}} style={{width:16,height:16,borderRadius:3,border:`1px solid ${_isExp1?_cc1.bd:M.inBd}`,background:_isExp1?_cc1.bd:"transparent",color:_isExp1?"#fff":M.tD,fontSize:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s",transform:_isExp1?"rotate(90deg)":"none",padding:0,flexShrink:0}}>▶</button><div style={{width:18,height:18,borderRadius:4,background:cardColor,color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{serialNum}</div></div></td>
                                  {(showThumb||isListMode) && (
                                    <td style={{padding:"3px 4px",width:(_ts||{rw:26}).rw+12}}>
                                      <div onClick={() => {setHoverThumb(null);setGalleryCode(_thumbCode);}}
                                        onMouseEnter={e => {if(!galleryCode){const b=e.currentTarget.getBoundingClientRect();setHoverThumb(_thumbCode);setHoverThumbPos({top:b.bottom+8,left:Math.min(b.left,window.innerWidth-300)});}}}
                                        onMouseLeave={() => {setHoverThumb(null);setHoverThumbPos(null);}}
                                        style={{position:"relative",width:(_ts||{rw:26}).rw,height:(_ts||{rh:26}).rh,cursor:"pointer"}}>
                                        {_thumbCount > 1 && <div style={{position:"absolute",top:2,left:2,width:(_ts||{w:24}).w,height:(_ts||{h:24}).h,borderRadius:(_ts||{r:4}).r,border:`1px solid ${M.div}`,background:M.mid}}/>}
                                        {_thumbCount > 2 && <div style={{position:"absolute",top:4,left:4,width:(_ts||{w:24}).w,height:(_ts||{h:24}).h,borderRadius:(_ts||{r:4}).r,border:`1px solid ${M.div}`,background:M.lo}}/>}
                                        <div style={{position:"relative",width:_ts.w,height:_ts.h,borderRadius:_ts.r,overflow:"hidden",border:`1px solid ${_thumbImg?A.a+"40":M.div}`,background:_thumbImg?undefined:A.al,display:"flex",alignItems:"center",justifyContent:"center",fontSize:_ts.w>30?14:11}}>
                                          {_thumbImg ? <img src={_thumbImg} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : _thumbEmoji}
                                        </div>
                                        {_thumbCount > 1 && <div style={{position:"absolute",top:-4,right:-6,minWidth:14,height:14,borderRadius:7,background:"#E8690A",color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:"1.5px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}>{_thumbCount}</div>}
                                      </div>
                                    </td>
                                  )}
                        {visCols.map(col=>{const f=allFields.find(x=>x.col===col);const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");const v=row[col]||"";
                          /* ── LIST MODE cell rendering ── */
                          if(isListMode){
                            const isCode=col==="B";const isName=col==="D";const isOnHand=col==="M";const isAlert=col==="P";const isCat=col==="E";const isID=col==="A";const isValue=col==="T";const isLoc=col==="F";const isLocName=col==="G";const isUOM=col==="I";const isMIP=col==="Y";const isAlloc=col==="Z";const isFree=col==="AA";const isProj=col==="AB";const isCF=col==="X";const isUomP=col==="W";
                            // Item Code → pill button
                            if(isCode) return(
                              <td key={col} style={{padding:"5px 6px",textAlign:"center"}}>
                                <button onClick={()=>onOpenRecord?.(row)}
                                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,.18)";e.currentTarget.style.borderColor="#E8690A";}}
                                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,.08)";e.currentTarget.style.borderColor="#d1d5db";}}
                                  onMouseDown={e=>{e.currentTarget.style.transform="translateY(1px)";e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,.1)";}}
                                  onMouseUp={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,.18)";}}
                                  style={{background:"#fff",border:"1.5px solid #d1d5db",borderRadius:8,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:800,color:"#111827",padding:"6px 14px",transition:"all .15s ease",display:"block",width:"100%",boxShadow:"0 2px 6px rgba(0,0,0,.08)",whiteSpace:"nowrap"}}>{v}</button>
                              </td>);
                            // Item Name → 13px bold
                            if(isName) return(<td key={col} style={{padding:"4px 8px",fontSize:13,fontWeight:900,color:M.tA,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>{v||"—"}</td>);
                            // On Hand → 14px bold teal
                            if(isOnHand){const numV=parseFloat(v)||0;const alertV=row.P||"";return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:14,fontWeight:900,color:alertV==="CRITICAL"?"#991b1b":A.a,textAlign:"right"}}>{numV.toLocaleString("en-IN")}</td>);}
                            // Alert → badge
                            if(isAlert) return(<td key={col} style={{padding:"4px 6px"}}><V4AlertBadge v={v}/></td>);
                            // Category → chip badge
                            if(isCat) return(<td key={col} style={{padding:"4px 6px"}}><span style={{background:A.al,color:A.a,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:800}}>{v}</span></td>);
                            // ID → purple mono
                            if(isID) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#6d28d9"}}>{v}</td>);
                            // Value → amber mono
                            if(isValue) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#854d0e",textAlign:"right"}}>{v}</td>);
                            // Location code → mono bold
                            if(isLoc) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:M.tB}}>{v}</td>);
                            // Location name → green italic
                            if(isLocName) return(<td key={col} style={{padding:"4px 8px",fontSize:12,fontStyle:"italic",color:"#15803d"}}>{v}</td>);
                            // UOM → bold amber
                            if(isUOM) return(<td key={col} style={{padding:"4px 8px",fontWeight:800,fontSize:12,color:"#854d0e"}}>{v}</td>);
                            // UOM Purchase → purple
                            if(isUomP){const u=getItemUOM(row.B);return(<td key={col} style={{padding:"4px 8px",fontSize:10,color:"#7C3AED",fontWeight:700}}>{v}{u.hasDualUOM&&<span style={{marginLeft:3,fontSize:8,color:"#9ca3af"}}>→{row.I}</span>}</td>);}
                            // Conversion Factor
                            if(isCF){const u=getItemUOM(row.B);return(<td key={col} style={{padding:"4px 8px",fontSize:10,fontFamily:"monospace",color:u.hasDualUOM?"#7C3AED":"#9ca3af"}}>{u.hasDualUOM?`×${v}`:"—"}</td>);}
                            // MIP → clickable orange badge
                            if(isMIP){const mipV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 6px"}}>{mipV>0?<button onClick={(e)=>{e.stopPropagation();onOpenMIP?.(row.B,row.D);}} style={{background:"#fff7ed",color:"#E8690A",border:"1.5px solid #fed7aa",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:800,fontFamily:"monospace",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#E8690A";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff7ed";e.currentTarget.style.color="#E8690A";}}>{mipV.toLocaleString("en-IN")} ⓘ</button>:<span style={{color:"#9ca3af",fontSize:10}}>—</span>}</td>);}
                            // Allocated → clickable red badge with lock icon
                            if(isAlloc){const allocV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 6px"}}>{allocV>0?<button onClick={(e)=>{e.stopPropagation();onOpenAlloc?.(row.B,row.D);}} style={{background:"#fef2f2",color:"#BE123C",border:"1.5px solid #fecdd3",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:800,fontFamily:"monospace",cursor:"pointer",transition:"all .15s",boxShadow:"inset 0 0 0 1px rgba(190,18,60,.1)"}} onMouseEnter={e=>{e.currentTarget.style.background="#BE123C";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#BE123C";}}> 🔒 {allocV.toLocaleString("en-IN")}</button>:<span style={{color:"#9ca3af",fontSize:10}}>—</span>}</td>);}
                            // Free Stock → bold, red if zero/negative
                            if(isFree){const freeV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:13,fontWeight:800,color:freeV<=0?"#991b1b":freeV<100?"#92400e":"#15803d",textAlign:"right",background:freeV<=0?"#fef2f2":"transparent",borderRadius:freeV<=0?4:0}}>{freeV.toLocaleString("en-IN")}</td>);}
                            // Projected → bold blue
                            if(isProj){const projV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:13,fontWeight:800,color:"#0078D4",textAlign:"right"}}>{projV.toLocaleString("en-IN")}</td>);}
                            // Other → standard compact
                            return(<td key={col} style={{padding:"4px 8px",fontSize:Math.max(fz,12),color:isAuto?A.a:M.tB,fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:colW(col)+40}}>{isAuto?<span style={{color:A.a,background:A.al,borderRadius:3,padding:"1px 5px",fontFamily:"monospace",fontSize:Math.max(fz-1,11)}}>{v||"auto"}</span>:v||<span style={{color:M.tD}}>—</span>}</td>);
                          }
                          /* ── TABLE MODE cell rendering (original) ── */
                          return(
                          <td key={col} style={{padding:pyV+"px 10px",fontSize:Math.max(fz,12),color:col===visCols[0]?A.a:M.tB,fontWeight:col===visCols[0]?700:400,fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit",borderRight:"1px solid "+M.div,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:colW(col)+40}}>
                            {col===visCols[0]&&onOpenRecord?<button onClick={()=>onOpenRecord(row)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"monospace",fontSize:Math.max(fz,12),fontWeight:800,color:A.a,padding:0,borderBottom:`1px dashed ${A.a}60`}}>{v||"—"}</button>:isAuto?<span style={{color:A.a,background:A.al,borderRadius:3,padding:"1px 5px",fontFamily:"monospace",fontSize:Math.max(fz-1,11)}}>{v||"auto"}</span>:v||<span style={{color:M.tD,fontStyle:"italic"}}>—</span>}
                          </td>
                        );})}
                        {groupBy==="C"&&(ISSUE_CAT_FIELDS[row.C]||[]).map((cf,ci)=>{const _catD=LEDGER_CAT_DATA[row.B]||{};const _catCc=CAT_COLORS[row.C]||CAT_COLORS.FABRIC;return(
                          <td key={"cat_"+cf.id} style={{padding:"4px 8px",fontSize:11,fontWeight:600,color:M.tA,background:_catCc.hi,borderLeft:ci===0?`3px solid ${_catCc.bd}`:"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:120}}>{_catD[cf.id]||<span style={{color:M.tD}}>—</span>}</td>
                        );})}
                      </tr>,
                      _isExp1 && <tr key={ri+"_exp"}><td colSpan={visCols.length+((showThumb||isListMode)?1:0)+1+(groupBy==="C"?(ISSUE_CAT_FIELDS[row.C]||[]).length:0)} style={{padding:0,borderBottom:"1px solid "+M.div}}><CategoryAttributeStrip itemCode={row.B} category={row.C} M={M} A={A}/></td></tr>,
                    ];})}
                    </tbody></table>
                    )}
                    {/* Close card */}
                          </div>
                        </div>
                      </td></tr>
                    )}
                    {/* ── NO sub-group: flat rows with serial + section headers ── */}
                    {sub.subKey===null && grp.key!==null && si===0 && (
                      <tr><td colSpan={visCols.length+((showThumb||isListMode)?1:0)+1} style={{padding:grp.key!==null?"0 8px":"0",border:"none"}}>
                        <div style={{display:"flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:`1.5px solid ${grpColor.c}40`,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
                          <div style={{width:5,background:grpColor.c,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
                              <th style={{padding:"3px 6px",background:grpColor.bg+"08",borderBottom:`1.5px solid ${grpColor.c}`,fontSize:8,fontWeight:900,color:grpColor.c,width:28}}>S.No</th>
                              {(showThumb||isListMode) && <th style={{padding:"3px 6px",background:grpColor.bg+"08",borderBottom:`1.5px solid ${grpColor.c}`,fontSize:8,fontWeight:900,color:grpColor.c,width:_ts.rw+12}}>📷</th>}
                              {visCols.map(col => {const f=allFields.find(x=>x.col===col);return(
                                <th key={col} style={{padding:"3px 7px",background:grpColor.bg+"08",borderBottom:`1.5px solid ${grpColor.c}`,fontSize:8,fontWeight:900,color:grpColor.c,textAlign:(f?.type==="number"||col==="M"||col==="T")?"right":"left",whiteSpace:"nowrap"}}>{!isListMode&&<span style={{fontFamily:"monospace",fontSize:7,color:grpColor.c+"90",marginRight:2}}>{col}</span>}{f?.h||col}</th>
                              );})}
                              {groupBy==="C"&&(ISSUE_CAT_FIELDS[sub.rows[0]?.C]||[]).map((cf,ci)=>{const _catCc=CAT_COLORS[sub.rows[0]?.C]||CAT_COLORS.FABRIC;return(
                                <th key={"cat_"+cf.id} style={{padding:"3px 7px",background:_catCc.bg,borderBottom:`2px solid ${_catCc.bd}`,borderLeft:ci===0?`3px solid ${_catCc.bd}`:"none",fontSize:8,fontWeight:900,color:_catCc.tx,whiteSpace:"nowrap"}}>{cf.h}</th>
                              );})}
                            </tr></thead><tbody>
                            {sub.rows.map((row,ri)=>{
                              serialNum++;
                              const _thumbCode = (showThumb||isListMode) ? (row.B||"") : "";
                              const _thumbImg = (showThumb||isListMode) ? getFirstImg(_thumbCode) : null;
                              const _thumbCount = (showThumb||isListMode) ? getImgs(_thumbCode).length : 0;
                              const _thumbEmoji = (showThumb||isListMode) ? (CAT_EMOJI[row.C]||"📦") : "";
                              const _isExp2=expandedRows.has(row.B);const _cc2=CAT_COLORS[row.C]||CAT_COLORS.FABRIC;
                              return[
                              <tr key={ri} style={{height:isListMode?Math.max(40,_ts.rh+14):undefined,borderBottom:_isExp2?"none":("1px solid "+M.div),background:_isExp2?_cc2.bg:(ri%2===0?M.tev:M.tod)}}>
                                <td style={{padding:"3px 4px",width:44}}><div style={{display:"flex",alignItems:"center",gap:2}}><button onClick={e=>{e.stopPropagation();toggleExpand(row.B);}} style={{width:16,height:16,borderRadius:3,border:`1px solid ${_isExp2?_cc2.bd:M.inBd}`,background:_isExp2?_cc2.bd:"transparent",color:_isExp2?"#fff":M.tD,fontSize:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s",transform:_isExp2?"rotate(90deg)":"none",padding:0,flexShrink:0}}>▶</button><div style={{width:18,height:18,borderRadius:4,background:grpColor.c,color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{serialNum}</div></div></td>
                                {(showThumb||isListMode) && (
                                  <td style={{padding:"3px 4px",width:(_ts||{rw:26}).rw+12}}>
                                    <div onClick={() => {setHoverThumb(null);setGalleryCode(_thumbCode);}}
                                      onMouseEnter={e => {if(!galleryCode){const b=e.currentTarget.getBoundingClientRect();setHoverThumb(_thumbCode);setHoverThumbPos({top:b.bottom+8,left:Math.min(b.left,window.innerWidth-300)});}}}
                                      onMouseLeave={() => {setHoverThumb(null);setHoverThumbPos(null);}}
                                      style={{position:"relative",width:(_ts||{rw:26}).rw,height:(_ts||{rh:26}).rh,cursor:"pointer"}}>
                                      {_thumbCount > 1 && <div style={{position:"absolute",top:2,left:2,width:(_ts||{w:24}).w,height:(_ts||{h:24}).h,borderRadius:(_ts||{r:4}).r,border:`1px solid ${M.div}`,background:M.mid}}/>}
                                      {_thumbCount > 2 && <div style={{position:"absolute",top:4,left:4,width:(_ts||{w:24}).w,height:(_ts||{h:24}).h,borderRadius:(_ts||{r:4}).r,border:`1px solid ${M.div}`,background:M.lo}}/>}
                                      <div style={{position:"relative",width:_ts.w,height:_ts.h,borderRadius:_ts.r,overflow:"hidden",border:`1px solid ${_thumbImg?A.a+"40":M.div}`,background:_thumbImg?undefined:A.al,display:"flex",alignItems:"center",justifyContent:"center",fontSize:_ts.w>30?14:11}}>
                                        {_thumbImg ? <img src={_thumbImg} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : _thumbEmoji}
                                      </div>
                                      {_thumbCount > 1 && <div style={{position:"absolute",top:-4,right:-6,minWidth:14,height:14,borderRadius:7,background:"#E8690A",color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:"1.5px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}>{_thumbCount}</div>}
                                    </div>
                                  </td>
                                )}
                                {visCols.map(col=>{const f=allFields.find(x=>x.col===col);const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");const v=row[col]||"";
                                  if(isListMode){
                                    const isCode=col==="B";const isName=col==="D";const isOnHand=col==="M";const isAlert=col==="P";const isCat=col==="E";const isID=col==="A";const isValue=col==="T";const isLoc=col==="F";const isLocName=col==="G";const isUOM=col==="I";const isMIP=col==="Y";const isAlloc=col==="Z";const isFree=col==="AA";const isProj=col==="AB";const isCF=col==="X";const isUomP=col==="W";
                                    if(isCode) return(<td key={col} style={{padding:"5px 6px",textAlign:"center"}}><button onClick={()=>onOpenRecord?.(row)} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,.18)";e.currentTarget.style.borderColor="#E8690A";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,.08)";e.currentTarget.style.borderColor="#d1d5db";}} style={{background:"#fff",border:"1.5px solid #d1d5db",borderRadius:8,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:800,color:"#111827",padding:"6px 14px",transition:"all .15s ease",display:"block",width:"100%",boxShadow:"0 2px 6px rgba(0,0,0,.08)",whiteSpace:"nowrap"}}>{v}</button></td>);
                                    if(isName) return(<td key={col} style={{padding:"4px 8px",fontSize:13,fontWeight:900,color:M.tA,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>{v||"—"}</td>);
                                    if(isOnHand){const numV=parseFloat(v)||0;const alertV=row.P||"";return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:14,fontWeight:900,color:alertV==="CRITICAL"?"#991b1b":A.a,textAlign:"right"}}>{numV.toLocaleString("en-IN")}</td>);}
                                    if(isAlert) return(<td key={col} style={{padding:"4px 6px"}}><V4AlertBadge v={v}/></td>);
                                    if(isCat) return(<td key={col} style={{padding:"4px 6px"}}><span style={{background:A.al,color:A.a,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:800}}>{v}</span></td>);
                                    if(isID) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#6d28d9"}}>{v}</td>);
                                    if(isValue) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#854d0e",textAlign:"right"}}>{v}</td>);
                                    if(isLoc) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:M.tB}}>{v}</td>);
                                    if(isLocName) return(<td key={col} style={{padding:"4px 8px",fontSize:12,fontStyle:"italic",color:"#15803d"}}>{v}</td>);
                                    if(isUOM) return(<td key={col} style={{padding:"4px 8px",fontWeight:800,fontSize:12,color:"#854d0e"}}>{v}</td>);
                            // UOM Purchase → purple
                            if(isUomP){const u=getItemUOM(row.B);return(<td key={col} style={{padding:"4px 8px",fontSize:10,color:"#7C3AED",fontWeight:700}}>{v}{u.hasDualUOM&&<span style={{marginLeft:3,fontSize:8,color:"#9ca3af"}}>→{row.I}</span>}</td>);}
                            // Conversion Factor
                            if(isCF){const u=getItemUOM(row.B);return(<td key={col} style={{padding:"4px 8px",fontSize:10,fontFamily:"monospace",color:u.hasDualUOM?"#7C3AED":"#9ca3af"}}>{u.hasDualUOM?`×${v}`:"—"}</td>);}
                            // MIP → clickable orange badge
                            if(isMIP){const mipV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 6px"}}>{mipV>0?<button onClick={(e)=>{e.stopPropagation();onOpenMIP?.(row.B,row.D);}} style={{background:"#fff7ed",color:"#E8690A",border:"1.5px solid #fed7aa",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:800,fontFamily:"monospace",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#E8690A";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff7ed";e.currentTarget.style.color="#E8690A";}}>{mipV.toLocaleString("en-IN")} ⓘ</button>:<span style={{color:"#9ca3af",fontSize:10}}>—</span>}</td>);}
                            // Allocated → clickable red badge with lock icon
                            if(isAlloc){const allocV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 6px"}}>{allocV>0?<button onClick={(e)=>{e.stopPropagation();onOpenAlloc?.(row.B,row.D);}} style={{background:"#fef2f2",color:"#BE123C",border:"1.5px solid #fecdd3",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:800,fontFamily:"monospace",cursor:"pointer",transition:"all .15s",boxShadow:"inset 0 0 0 1px rgba(190,18,60,.1)"}} onMouseEnter={e=>{e.currentTarget.style.background="#BE123C";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#BE123C";}}> 🔒 {allocV.toLocaleString("en-IN")}</button>:<span style={{color:"#9ca3af",fontSize:10}}>—</span>}</td>);}
                            // Free Stock → bold, red if zero/negative
                            if(isFree){const freeV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:13,fontWeight:800,color:freeV<=0?"#991b1b":freeV<100?"#92400e":"#15803d",textAlign:"right",background:freeV<=0?"#fef2f2":"transparent",borderRadius:freeV<=0?4:0}}>{freeV.toLocaleString("en-IN")}</td>);}
                            // Projected → bold blue
                            if(isProj){const projV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:13,fontWeight:800,color:"#0078D4",textAlign:"right"}}>{projV.toLocaleString("en-IN")}</td>);}
                                    return(<td key={col} style={{padding:"4px 8px",fontSize:Math.max(fz,12),color:isAuto?A.a:M.tB,fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:colW(col)+40}}>{isAuto?<span style={{color:A.a,background:A.al,borderRadius:3,padding:"1px 5px",fontFamily:"monospace",fontSize:Math.max(fz-1,11)}}>{v||"auto"}</span>:v||<span style={{color:M.tD}}>—</span>}</td>);
                                  }
                                  return(<td key={col} style={{padding:pyV+"px 10px",fontSize:Math.max(fz,12),color:col===visCols[0]?A.a:M.tB,fontWeight:col===visCols[0]?700:400,fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit",borderRight:"1px solid "+M.div,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:colW(col)+40}}>{col===visCols[0]&&onOpenRecord?<button onClick={()=>onOpenRecord(row)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"monospace",fontSize:Math.max(fz,12),fontWeight:800,color:A.a,padding:0,borderBottom:`1px dashed ${A.a}60`}}>{v||"—"}</button>:isAuto?<span style={{color:A.a,background:A.al,borderRadius:3,padding:"1px 5px",fontFamily:"monospace",fontSize:Math.max(fz-1,11)}}>{v||"auto"}</span>:v||<span style={{color:M.tD,fontStyle:"italic"}}>—</span>}</td>);
                                })}
                                {groupBy==="C"&&(ISSUE_CAT_FIELDS[row.C]||[]).map((cf,ci)=>{const _catD=LEDGER_CAT_DATA[row.B]||{};const _catCc=CAT_COLORS[row.C]||CAT_COLORS.FABRIC;return(
                                  <td key={"cat_"+cf.id} style={{padding:"4px 8px",fontSize:11,fontWeight:600,color:M.tA,background:_catCc.hi,borderLeft:ci===0?`3px solid ${_catCc.bd}`:"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:120}}>{_catD[cf.id]||<span style={{color:M.tD}}>—</span>}</td>
                                );})}
                              </tr>,
                              _isExp2 && <tr key={ri+"_exp"}><td colSpan={visCols.length+((showThumb||isListMode)?1:0)+1+(groupBy==="C"?(ISSUE_CAT_FIELDS[row.C]||[]).length:0)} style={{padding:0,borderBottom:"1px solid "+M.div}}><CategoryAttributeStrip itemCode={row.B} category={row.C} M={M} A={A}/></td></tr>,
                            ];})}
                            </tbody></table>
                          </div>
                        </div>
                      </td></tr>
                    )}
                    {/* ── NO group at all: flat rows ── */}
                    {sub.subKey===null && grp.key===null && sub.rows.map((row,ri)=>{
                      const _thumbCode = (showThumb||isListMode) ? (row.B||"") : "";
                      const _thumbImg = (showThumb||isListMode) ? getFirstImg(_thumbCode) : null;
                      const _thumbCount = (showThumb||isListMode) ? getImgs(_thumbCode).length : 0;
                      const _thumbEmoji = (showThumb||isListMode) ? (CAT_EMOJI[row.C]||"📦") : "";
                      const _isExp3 = expandedRows.has(row.B);
                      const _cc3 = CAT_COLORS[row.C]||CAT_COLORS.FABRIC;
                      return[
                      <tr key={ri} style={{height:isListMode?Math.max(40,_ts.rh+14):undefined,borderBottom:_isExp3?"none":("1px solid "+M.div),background:_isExp3?_cc3.bg:(ri%2===0?M.tev:M.tod)}}>
                        <td style={{padding:"3px 4px",width:44,textAlign:"center"}}><div style={{display:"flex",alignItems:"center",gap:2}}><button onClick={e=>{e.stopPropagation();toggleExpand(row.B);}} style={{width:16,height:16,borderRadius:3,border:`1px solid ${_isExp3?_cc3.bd:M.inBd}`,background:_isExp3?_cc3.bd:"transparent",color:_isExp3?"#fff":M.tD,fontSize:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s",transform:_isExp3?"rotate(90deg)":"none",padding:0,flexShrink:0}}>▶</button><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:4,background:A.a,color:"#fff",fontSize:9,fontWeight:900,fontFamily:"monospace"}}>{ri+1}</span></div></td>
                        {(showThumb||isListMode) && (
                          <td style={{padding:"3px 4px",width:(_ts||{rw:26}).rw+12}}>
                            <div onClick={() => {setHoverThumb(null);setGalleryCode(_thumbCode);}}
                              onMouseEnter={e => {if(!galleryCode){const b=e.currentTarget.getBoundingClientRect();setHoverThumb(_thumbCode);setHoverThumbPos({top:b.bottom+8,left:Math.min(b.left,window.innerWidth-300)});}}}
                              onMouseLeave={() => {setHoverThumb(null);setHoverThumbPos(null);}}
                              style={{position:"relative",width:(_ts||{rw:26}).rw,height:(_ts||{rh:26}).rh,cursor:"pointer"}}>
                              {_thumbCount > 1 && <div style={{position:"absolute",top:2,left:2,width:(_ts||{w:24}).w,height:(_ts||{h:24}).h,borderRadius:(_ts||{r:4}).r,border:`1px solid ${M.div}`,background:M.mid}}/>}
                              {_thumbCount > 2 && <div style={{position:"absolute",top:4,left:4,width:(_ts||{w:24}).w,height:(_ts||{h:24}).h,borderRadius:(_ts||{r:4}).r,border:`1px solid ${M.div}`,background:M.lo}}/>}
                              <div style={{position:"relative",width:_ts.w,height:_ts.h,borderRadius:_ts.r,overflow:"hidden",border:`1px solid ${_thumbImg?A.a+"40":M.div}`,background:_thumbImg?undefined:A.al,display:"flex",alignItems:"center",justifyContent:"center",fontSize:_ts.w>30?14:11}}>
                                {_thumbImg ? <img src={_thumbImg} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : _thumbEmoji}
                              </div>
                              {_thumbCount > 1 && <div style={{position:"absolute",top:-4,right:-6,minWidth:14,height:14,borderRadius:7,background:"#E8690A",color:"#fff",fontSize:8,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:"1.5px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}>{_thumbCount}</div>}
                            </div>
                          </td>
                        )}
                        {visCols.map(col=>{const f=allFields.find(x=>x.col===col);const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");const v=row[col]||"";
                          if(isListMode){
                            const isCode=col==="B";const isName=col==="D";const isOnHand=col==="M";const isAlert=col==="P";const isCat=col==="E";const isID=col==="A";const isValue=col==="T";const isLoc=col==="F";const isLocName=col==="G";const isUOM=col==="I";const isMIP=col==="Y";const isAlloc=col==="Z";const isFree=col==="AA";const isProj=col==="AB";const isCF=col==="X";const isUomP=col==="W";
                            if(isCode) return(<td key={col} style={{padding:"5px 6px",textAlign:"center"}}><button onClick={()=>onOpenRecord?.(row)} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,.18)";e.currentTarget.style.borderColor="#E8690A";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,.08)";e.currentTarget.style.borderColor="#d1d5db";}} style={{background:"#fff",border:"1.5px solid #d1d5db",borderRadius:8,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:800,color:"#111827",padding:"6px 14px",transition:"all .15s ease",display:"block",width:"100%",boxShadow:"0 2px 6px rgba(0,0,0,.08)",whiteSpace:"nowrap"}}>{v}</button></td>);
                            if(isName) return(<td key={col} style={{padding:"4px 8px",fontSize:13,fontWeight:900,color:M.tA,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>{v||"—"}</td>);
                            if(isOnHand){const numV=parseFloat(v)||0;const alertV=row.P||"";return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:14,fontWeight:900,color:alertV==="CRITICAL"?"#991b1b":A.a,textAlign:"right"}}>{numV.toLocaleString("en-IN")}</td>);}
                            if(isAlert) return(<td key={col} style={{padding:"4px 6px"}}><V4AlertBadge v={v}/></td>);
                            if(isCat) return(<td key={col} style={{padding:"4px 6px"}}><span style={{background:A.al,color:A.a,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:800}}>{v}</span></td>);
                            if(isID) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#6d28d9"}}>{v}</td>);
                            if(isValue) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#854d0e",textAlign:"right"}}>{v}</td>);
                            if(isLoc) return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:M.tB}}>{v}</td>);
                            if(isLocName) return(<td key={col} style={{padding:"4px 8px",fontSize:12,fontStyle:"italic",color:"#15803d"}}>{v}</td>);
                            if(isUOM) return(<td key={col} style={{padding:"4px 8px",fontWeight:800,fontSize:12,color:"#854d0e"}}>{v}</td>);
                            // UOM Purchase → purple
                            if(isUomP){const u=getItemUOM(row.B);return(<td key={col} style={{padding:"4px 8px",fontSize:10,color:"#7C3AED",fontWeight:700}}>{v}{u.hasDualUOM&&<span style={{marginLeft:3,fontSize:8,color:"#9ca3af"}}>→{row.I}</span>}</td>);}
                            // Conversion Factor
                            if(isCF){const u=getItemUOM(row.B);return(<td key={col} style={{padding:"4px 8px",fontSize:10,fontFamily:"monospace",color:u.hasDualUOM?"#7C3AED":"#9ca3af"}}>{u.hasDualUOM?`×${v}`:"—"}</td>);}
                            // MIP → clickable orange badge
                            if(isMIP){const mipV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 6px"}}>{mipV>0?<button onClick={(e)=>{e.stopPropagation();onOpenMIP?.(row.B,row.D);}} style={{background:"#fff7ed",color:"#E8690A",border:"1.5px solid #fed7aa",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:800,fontFamily:"monospace",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#E8690A";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff7ed";e.currentTarget.style.color="#E8690A";}}>{mipV.toLocaleString("en-IN")} ⓘ</button>:<span style={{color:"#9ca3af",fontSize:10}}>—</span>}</td>);}
                            // Allocated → clickable red badge with lock icon
                            if(isAlloc){const allocV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 6px"}}>{allocV>0?<button onClick={(e)=>{e.stopPropagation();onOpenAlloc?.(row.B,row.D);}} style={{background:"#fef2f2",color:"#BE123C",border:"1.5px solid #fecdd3",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:800,fontFamily:"monospace",cursor:"pointer",transition:"all .15s",boxShadow:"inset 0 0 0 1px rgba(190,18,60,.1)"}} onMouseEnter={e=>{e.currentTarget.style.background="#BE123C";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#BE123C";}}> 🔒 {allocV.toLocaleString("en-IN")}</button>:<span style={{color:"#9ca3af",fontSize:10}}>—</span>}</td>);}
                            // Free Stock → bold, red if zero/negative
                            if(isFree){const freeV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:13,fontWeight:800,color:freeV<=0?"#991b1b":freeV<100?"#92400e":"#15803d",textAlign:"right",background:freeV<=0?"#fef2f2":"transparent",borderRadius:freeV<=0?4:0}}>{freeV.toLocaleString("en-IN")}</td>);}
                            // Projected → bold blue
                            if(isProj){const projV=parseFloat(v)||0;return(<td key={col} style={{padding:"4px 8px",fontFamily:"monospace",fontSize:13,fontWeight:800,color:"#0078D4",textAlign:"right"}}>{projV.toLocaleString("en-IN")}</td>);}
                            return(<td key={col} style={{padding:"4px 8px",fontSize:Math.max(fz,12),color:isAuto?A.a:M.tB,fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:colW(col)+40}}>{isAuto?<span style={{color:A.a,background:A.al,borderRadius:3,padding:"1px 5px",fontFamily:"monospace",fontSize:Math.max(fz-1,11)}}>{v||"auto"}</span>:v||<span style={{color:M.tD}}>—</span>}</td>);
                          }
                          return(<td key={col} style={{padding:pyV+"px 10px",fontSize:Math.max(fz,12),color:col===visCols[0]?A.a:M.tB,fontWeight:col===visCols[0]?700:400,fontFamily:["manual","autocode"].includes(f?.type)?"monospace":"inherit",borderRight:"1px solid "+M.div,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:colW(col)+40}}>{col===visCols[0]&&onOpenRecord?<button onClick={()=>onOpenRecord(row)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"monospace",fontSize:Math.max(fz,12),fontWeight:800,color:A.a,padding:0,borderBottom:`1px dashed ${A.a}60`}}>{v||"—"}</button>:isAuto?<span style={{color:A.a,background:A.al,borderRadius:3,padding:"1px 5px",fontFamily:"monospace",fontSize:Math.max(fz-1,11)}}>{v||"auto"}</span>:v||<span style={{color:M.tD,fontStyle:"italic"}}>—</span>}</td>);
                        })}
                      </tr>,
                      _isExp3 && <tr key={ri+"_exp"}><td colSpan={visCols.length+((showThumb||isListMode)?1:0)+1} style={{padding:0,borderBottom:"1px solid "+M.div}}><CategoryAttributeStrip itemCode={row.B} category={row.C} M={M} A={A}/></td></tr>,
                      ];
                    })}
                  </React.Fragment>
                );})}
              </React.Fragment>
            );})}
          </tbody>
          <AggFooter visRows={visRows} visCols={visCols} allFields={allFields} aggState={aggState} openCol={aggOpenInfo?.col||null} onCellClick={aggCellClick} hasCheckbox={false} extraCols={1} M={M} A={A}/>
        </table>
      </div>
      {aggOpenInfo&&<><div onClick={()=>setAggOpenInfo(null)} style={{position:"fixed",inset:0,zIndex:9998}}/><AggDropdown openInfo={aggOpenInfo} aggState={aggState} setAggState={setAggState} visRows={visRows} allFields={allFields} onClose={()=>setAggOpenInfo(null)} M={M} A={A}/></>}
      {/* Status bar */}
      <div style={{padding:"4px 12px",borderTop:"1px solid "+M.div,background:M.mid,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{fontSize:9,color:M.tD,fontWeight:700}}>Total: {mockRecords.length} · Visible: {visRows.length} · Cols: {visCols.length}</span>
        {sorts.length>0&&<span style={{fontSize:9,color:"#6d28d9"}}>↕ sorted by {sorts.map(s=>s.col).join(", ")}</span>}
        {activeFilters>0&&<span style={{fontSize:9,color:A.a}}>🔍 {activeFilters} filter(s)</span>}
        {groupBy&&<span style={{fontSize:9,color:"#059669"}}>⊞ grouped by {allFields.find(f=>f.col===groupBy)?.h||groupBy}</span>}
      </div>
      {/* View switch guard */}
      {viewSwitchGuard&&<><div onClick={()=>setViewSwitchGuard(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(2px)",zIndex:2100}}/><div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:M.hi,border:"1px solid #fcd34d",borderRadius:10,zIndex:2101,boxShadow:"0 8px 32px rgba(0,0,0,.3)",overflow:"hidden"}}><div style={{background:"#f59e0b",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>⚠️</span><div><div style={{color:"#fff",fontSize:13,fontWeight:900}}>Unsaved View Changes</div><div style={{color:"rgba(255,255,255,.85)",fontSize:10}}>"{activeViewName}" has unsaved modifications</div></div></div><div style={{padding:"16px 20px"}}><div style={{display:"flex",flexDirection:"column",gap:8}}><button onClick={()=>{updateCurrentView();loadTemplate(viewSwitchGuard.pendingTpl);setViewSwitchGuard(null);}} style={{padding:"9px 16px",border:"none",borderRadius:6,background:"#15803d",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer",textAlign:"left"}}>💾 Save changes to "{activeViewName}" — then switch</button><button onClick={()=>{loadTemplate(viewSwitchGuard.pendingTpl);setViewSwitchGuard(null);}} style={{padding:"9px 16px",border:"1px solid #fcd34d",borderRadius:6,background:"#fffbeb",color:"#92400e",fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left"}}>↩ Discard changes — switch to "{viewSwitchGuard.pendingTpl.name}"</button><button onClick={()=>setViewSwitchGuard(null)} style={{padding:"9px 16px",border:"1px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tB,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"left"}}>← Stay on "{activeViewName}"</button></div></div></div></>}
      {editingTpl&&<ViewEditModal allFields={allFields} allCols={allCols} initial={editingTpl.tpl} isDup={!editingTpl.originalName} existingNames={["Default",...templates.map(t=>t.name).filter(n=>n!==editingTpl.originalName)]} onSave={commitTplEdit} onCancel={()=>setEditingTpl(null)} M={M} A={A} fz={fz}/>}
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toast.color||"#15803d",color:"#fff",borderRadius:8,padding:"10px 18px",fontSize:12,fontWeight:800,boxShadow:"0 8px 32px rgba(0,0,0,.25)"}}>{toast.msg}</div>}
      {/* Thumbnail hover preview */}
      {(showThumb||isListMode) && hoverThumb && hoverThumbPos && !galleryCode && getFirstImg(hoverThumb) && (
        <ImgPreview code={hoverThumb} pos={hoverThumbPos} M={M} A={A}/>
      )}
      {/* Gallery modal */}
      {(showThumb||isListMode) && galleryCode && (
        <GalleryModal code={galleryCode} onClose={() => setGalleryCode(null)} M={M} A={A}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COLUMN VIEW — Miller Columns / Finder-style hierarchical navigation
   L1 (Item Master) → L2 (Item Category) → Records
   ═══════════════════════════════════════════════════════════════════ */
function ColumnView({mockRecords, allFields, onOpenRecord, M, A, fz, ts}) {
  const _ts = ts || {w:40,h:40,r:6};
  const [selL1, setSelL1] = useState(null);
  const [selL2, setSelL2] = useState(null);
  const [galleryCode, setGalleryCode] = useState(null);
  const [groupByL1, setGroupByL1] = useState("C"); // C = Item Master
  const [groupByL2, setGroupByL2] = useState("E"); // E = Item Category

  // Build hierarchy from records
  const hierarchy = useMemo(() => {
    const map = {};
    mockRecords.forEach(r => {
      const k1 = r[groupByL1] || "(blank)";
      if (!map[k1]) map[k1] = {};
      const k2 = r[groupByL2] || "(blank)";
      if (!map[k1][k2]) map[k1][k2] = [];
      map[k1][k2].push(r);
    });
    return Object.entries(map).map(([l1, l2map]) => ({
      label: l1,
      icon: GRP_EMOJI_MAP[l1] || "📁",
      color: GRP_PALETTE[Object.keys(map).indexOf(l1) % GRP_PALETTE.length],
      count: Object.values(l2map).flat().length,
      l2s: Object.entries(l2map).map(([l2, recs]) => ({
        label: l2,
        icon: GRP_EMOJI_MAP[l2] || "📂",
        count: recs.length,
        records: recs,
      })),
    }));
  }, [mockRecords, groupByL1, groupByL2]);

  // Auto-select first L1
  useEffect(() => {
    if (!selL1 && hierarchy.length > 0) setSelL1(hierarchy[0].label);
  }, [hierarchy]);

  const activeL1 = hierarchy.find(h => h.label === selL1);
  const activeL2 = activeL1?.l2s.find(l => l.label === selL2);
  const records = activeL2?.records || [];

  // Group-by field options
  const groupableFields = allFields.filter(f => ["dropdown","fk","manual","text"].includes(f.type));
  const l1Field = allFields.find(f => f.col === groupByL1);
  const l2Field = allFields.find(f => f.col === groupByL2);

  const colStyle = {borderRight:`1px solid ${M.div}`,overflowY:"auto",flexShrink:0};
  const itemHover = (active, color) => ({
    padding:"8px 12px",cursor:"pointer",
    borderBottom:`1px solid ${M.div}`,
    background:active?color.bg:"transparent",
    borderLeft:active?`3px solid ${color.c}`:"3px solid transparent",
    display:"flex",alignItems:"center",gap:8,
    transition:"all .12s",
  });

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Group-by selector bar */}
      <div style={{padding:"5px 12px",borderBottom:`1px solid ${M.div}`,background:M.mid,display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1}}>GROUP BY:</span>
        <select value={groupByL1} onChange={e=>{setGroupByL1(e.target.value);setSelL1(null);setSelL2(null);}} style={{padding:"4px 8px",border:`1.5px solid ${A.a}`,borderRadius:5,background:A.al,color:A.a,fontSize:10,fontWeight:900}}>
          {groupableFields.map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>
        <span style={{fontSize:9,color:M.tD}}>→</span>
        <select value={groupByL2} onChange={e=>{setGroupByL2(e.target.value);setSelL2(null);}} style={{padding:"4px 8px",border:`1.5px solid #7C3AED`,borderRadius:5,background:"#faf5ff",color:"#7C3AED",fontSize:10,fontWeight:900}}>
          {groupableFields.filter(f=>f.col!==groupByL1).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>
        <div style={{flex:1}}/>
        <span style={{fontSize:9,color:M.tD,fontWeight:700}}>
          {hierarchy.length} groups · {mockRecords.length} records
        </span>
      </div>

      {/* 3-column layout */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── COLUMN 1: L1 Groups ── */}
        <div style={{...colStyle,width:240,minWidth:200}}>
          <div style={{padding:"6px 12px",background:M.thd,borderBottom:`2px solid ${A.a}`,position:"sticky",top:0,zIndex:5}}>
            <div style={{fontSize:10,fontWeight:900,color:A.a,letterSpacing:.5,textTransform:"uppercase"}}>{l1Field?.h || "Groups"}</div>
            <div style={{fontSize:8,color:M.tD}}>{hierarchy.length} groups</div>
          </div>
          {hierarchy.map((h,hi) => {
            const active = selL1 === h.label;
            return (
              <div key={h.label} onClick={()=>{setSelL1(h.label);setSelL2(null);}}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.background=h.color.bg;}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}
                style={itemHover(active, h.color)}>
                <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:4,background:h.color.c,color:"#fff",fontSize:9,fontWeight:900,fontFamily:"monospace",flexShrink:0}}>{hi+1}</span>
                <span style={{fontSize:16}}>{h.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:active?900:700,color:active?h.color.c:M.tA}}>{h.label}</div>
                  <div style={{fontSize:9,color:M.tC}}>{h.count} item{h.count!==1?"s":""} · {h.l2s.length} {l2Field?.h||"sub-groups"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{padding:"2px 8px",borderRadius:8,fontSize:9,fontWeight:800,background:h.color.c+"20",color:h.color.c}}>{h.count}</span>
                  {active && <span style={{color:h.color.c,fontSize:12,fontWeight:900}}>▶</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── COLUMN 2: L2 Sub-categories ── */}
        <div style={{...colStyle,width:220,minWidth:180,background:activeL1?activeL1.color.bg+"40":"transparent"}}>
          {activeL1 ? (
            <>
              <div style={{padding:"6px 12px",background:activeL1.color.bg,borderBottom:`2px solid ${activeL1.color.c}`,position:"sticky",top:0,zIndex:5}}>
                <div style={{fontSize:10,fontWeight:900,color:activeL1.color.c,letterSpacing:.5,textTransform:"uppercase"}}>
                  {activeL1.icon} {activeL1.label} — {activeL1.l2s.length} {l2Field?.h||"categories"}
                </div>
              </div>
              {activeL1.l2s.map((l2,li) => {
                const active = selL2 === l2.label;
                return (
                  <div key={l2.label} onClick={()=>setSelL2(l2.label)}
                    onMouseEnter={e=>{if(!active)e.currentTarget.style.background=activeL1.color.bg;}}
                    onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}
                    style={{...itemHover(active, activeL1.color),borderLeft:active?`3px solid ${activeL1.color.c}`:"3px solid transparent"}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:18,height:18,borderRadius:4,background:activeL1.color.c,color:"#fff",fontSize:8,fontWeight:900,fontFamily:"monospace",flexShrink:0}}>{li+1}</span>
                    <span style={{fontSize:13}}>{l2.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:active?900:700,color:active?activeL1.color.c:M.tA}}>{l2.label}</div>
                      <div style={{fontSize:8,color:M.tC}}>{l2.count} item{l2.count!==1?"s":""}</div>
                    </div>
                    <span style={{padding:"2px 7px",borderRadius:8,fontSize:8,fontWeight:800,background:activeL1.color.c,color:"#fff"}}>{l2.count}</span>
                    {active && <span style={{color:activeL1.color.c,fontSize:11,fontWeight:900}}>▶</span>}
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{padding:20,textAlign:"center",color:M.tD,fontSize:11}}>← Select a group</div>
          )}
        </div>

        {/* ── COLUMN 3: Records ── */}
        <div style={{flex:1,overflowY:"auto",background:M.hi}}>
          {activeL2 ? (
            <>
              <div style={{padding:"6px 12px",background:activeL1.color.bg,borderBottom:`2px solid ${activeL1.color.c}`,position:"sticky",top:0,zIndex:5,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,fontWeight:900,color:activeL1.color.c,letterSpacing:.3,textTransform:"uppercase"}}>
                  {activeL1.icon} {activeL1.label} › {activeL2.label} — {records.length} item{records.length!==1?"s":""}
                </span>
              </div>
              {records.map((r, i) => {
                const code = r.B || "";
                const img = getFirstImg(code);
                const imgCount = getImgs(code).length;
                const emoji = CAT_EMOJI[r.C] || "📦";
                const alert = r.P || "";
                const onHand = parseFloat(r.M) || 0;
                return (
                  <div key={r.A||i} onClick={()=>onOpenRecord?.(r)}
                    onMouseEnter={e=>{e.currentTarget.style.background=activeL1.color.bg;e.currentTarget.style.borderLeftColor=activeL1.color.c;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}
                    style={{padding:"10px 14px",borderBottom:`1px solid ${M.div}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,borderLeft:"3px solid transparent",transition:"all .12s"}}>
                    {/* S.No */}
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:5,background:activeL1.color.c,color:"#fff",fontSize:10,fontWeight:900,fontFamily:"monospace",flexShrink:0}}>{i+1}</span>
                    {/* Thumbnail */}
                    <div onClick={e=>{e.stopPropagation();setGalleryCode(code);}} style={{position:"relative",width:_ts.w+8,height:_ts.h+8,borderRadius:_ts.r+1,overflow:"hidden",border:`1.5px solid ${img?activeL1.color.c+"50":M.div}`,background:img?undefined:A.al,display:"flex",alignItems:"center",justifyContent:"center",fontSize:_ts.w>36?18:_ts.w>28?14:11,flexShrink:0,cursor:"pointer"}}>
                      {img ? <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : emoji}
                      {imgCount > 1 && <div style={{position:"absolute",top:-3,right:-3,minWidth:14,height:14,borderRadius:7,background:"#E8690A",color:"#fff",fontSize:7,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:"1.5px solid #fff"}}>{imgCount}</div>}
                    </div>
                    {/* Details */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontFamily:"monospace",fontSize:11,fontWeight:900,color:activeL1.color.c}}>{code}</span>
                        <span style={{fontSize:13,fontWeight:900,color:M.tA}}>{r.D || ""}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"monospace",fontSize:9,color:"#6d28d9",fontWeight:700}}>{r.A}</span>
                        <span style={{fontSize:9,color:M.tC}}>{r.C}</span>
                        <span style={{fontSize:9,fontWeight:800,color:"#854d0e"}}>{r.I}</span>
                        <span style={{fontSize:9,color:"#15803d",fontStyle:"italic"}}>{r.F} · {r.G}</span>
                      </div>
                    </div>
                    {/* Right side: On Hand + Alert */}
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"monospace",fontSize:16,fontWeight:900,color:alert==="CRITICAL"?"#991b1b":A.a}}>{onHand.toLocaleString("en-IN")}</div>
                      <div style={{fontSize:9,fontWeight:800,color:"#854d0e"}}>{r.I}</div>
                    </div>
                    {alert && (
                      <span style={{padding:"3px 8px",borderRadius:4,fontSize:9,fontWeight:900,flexShrink:0,
                        background:alert==="CRITICAL"?"#fef2f2":alert==="REORDER"?"#fef3c7":"#dcfce7",
                        color:alert==="CRITICAL"?"#991b1b":alert==="REORDER"?"#92400e":"#15803d"
                      }}>{alert}</span>
                    )}
                  </div>
                );
              })}
            </>
          ) : activeL1 ? (
            <div style={{padding:30,textAlign:"center",color:M.tD,fontSize:12}}>← Select a {l2Field?.h||"category"} from <b style={{color:activeL1.color.c}}>{activeL1.label}</b></div>
          ) : (
            <div style={{padding:30,textAlign:"center",color:M.tD,fontSize:12}}>← Select a group to browse</div>
          )}
        </div>

      </div>
      {/* Gallery modal */}
      {galleryCode && <GalleryModal code={galleryCode} onClose={()=>setGalleryCode(null)} M={M} A={A}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STOCK ISSUE TAB — replaced by StockIssue.jsx (470 lines, 7×6 dynamic form + line items)
   Original inline version removed. Import from separate file.
   ═══════════════════════════════════════════════════════════════════ */
function StockIssueTab_OLD({mockRecords, allFields, M, A, fz, pyV, viewState, setViewState, templates, onSaveTemplate, onDeleteTemplate}) {
  const [tab, setTab] = useState("records"); // "records" | "new"
  const [issueType, setIssueType] = useState("Production Issue");
  const [itemCat, setItemCat] = useState("FABRIC");
  const [formData, setFormData] = useState({});

  const ISSUE_TYPES = [
    {v:"Production Issue",icon:"🏭",c:"#15803d"},
    {v:"Sample Issue",icon:"🧪",c:"#7C3AED"},
    {v:"Job Work Issue",icon:"🏗️",c:"#0078D4"},
    {v:"Wastage / Scrap",icon:"🗑️",c:"#dc2626"},
    {v:"Sale / Dispatch",icon:"🚚",c:"#E8690A"},
    {v:"Inter-Warehouse Transfer",icon:"🔄",c:"#059669"},
    {v:"Return to Supplier",icon:"↩️",c:"#854d0e"},
  ];
  const ITEM_CATS = [
    {v:"YARN",icon:"🧶",c:"#854d0e"},{v:"FABRIC",icon:"🧵",c:"#15803d"},{v:"TRIM",icon:"🪡",c:"#7C3AED"},
    {v:"CONSUMABLE",icon:"🧪",c:"#0078D4"},{v:"PACKAGING",icon:"📦",c:"#E8690A"},{v:"ARTICLE",icon:"👕",c:"#BE123C"},
  ];

  const typeFields = ISSUE_TYPE_FIELDS[issueType] || [];
  const catFields = ISSUE_CAT_FIELDS[itemCat] || [];
  const activeTypeColor = ISSUE_TYPES.find(t=>t.v===issueType)?.c || A.a;
  const activeCatColor = ITEM_CATS.find(c=>c.v===itemCat)?.c || "#E8690A";
  const totalFields = allFields.length + typeFields.length + catFields.length;

  const handleField = (key, val) => setFormData(p => ({...p, [key]: val}));

  // --- Field renderer ---
  const renderField = (f, color, prefix) => {
    const key = prefix + (f.id||f.col);
    const val = formData[key] || "";
    const isAuto = f.type==="auto"||f.type==="autocode"||f.type==="calc";
    const isFk = f.type==="fk";
    const isDD = f.type==="dropdown" && f.opts;
    return (
      <div key={key} style={{display:"flex",flexDirection:"column",gap:3}}>
        <label style={{fontSize:10,fontWeight:800,color:color||M.tC,letterSpacing:".3px",textTransform:"uppercase"}}>
          {f.req&&<span style={{color:"#dc2626",marginRight:2}}>*</span>}{f.h}
          {isAuto&&<span style={{fontSize:8,color:A.a,marginLeft:4}}>← auto</span>}
          {isFk&&<span style={{fontSize:8,color:"#E8690A",marginLeft:4}}>→ {f.fk}</span>}
        </label>
        {isAuto ? (
          <div style={{padding:"6px 10px",fontSize:12,fontWeight:700,color:A.a,background:A.al,borderRadius:6,border:`1px solid ${A.a}30`,fontFamily:f.ico==="#"?"monospace":"inherit"}}>{f.hint||"auto-generated"}</div>
        ) : isDD ? (
          <select value={val} onChange={e=>handleField(key,e.target.value)} style={{padding:"6px 10px",fontSize:12,border:`1.5px solid ${M.inBd}`,borderRadius:6,background:M.inBg,color:M.tA,borderLeft:`3px solid ${color||M.inBd}`}}>
            <option value="">— select —</option>
            {(Array.isArray(f.opts)?f.opts.map(o=>typeof o==="string"?{v:o,l:o}:o):f.opts||[]).map(o=>(
              <option key={o.v||o} value={o.v||o}>{o.l||o.v||o}</option>
            ))}
          </select>
        ) : (
          <input value={val} onChange={e=>handleField(key,e.target.value)} placeholder={f.hint||""} style={{padding:"6px 10px",fontSize:12,border:`1.5px solid ${M.inBd}`,borderRadius:6,background:M.inBg,color:M.tA,borderLeft:`3px solid ${isFk?"#E8690A":f.req?A.a:color||"transparent"}`}}/>
        )}
      </div>
    );
  };

  // --- Issue type summary for records view badge ---
  const issueTypeCounts = {};
  mockRecords.forEach(r => {const t=r.C||"";issueTypeCounts[t]=(issueTypeCounts[t]||0)+1;});

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Tab toggle */}
      <div style={{padding:"6px 12px",borderBottom:`1px solid ${M.div}`,background:M.mid,display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        {[{id:"records",icon:"📋",label:"Issue Records"},{id:"new",icon:"➕",label:"New Stock Issue"}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"5px 14px",borderRadius:6,border:`1.5px solid ${tab===t.id?"#BE123C":M.inBd}`,background:tab===t.id?"rgba(190,18,60,.08)":"transparent",color:tab===t.id?"#BE123C":M.tB,fontSize:11,fontWeight:tab===t.id?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:13}}>{t.icon}</span>{t.label}
          </button>
        ))}
        <div style={{flex:1}}/>
        {/* Type summary badges */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {ISSUE_TYPES.map(t => {
            const cnt = issueTypeCounts[t.v]||0;
            if(cnt===0) return null;
            return <span key={t.v} style={{padding:"2px 8px",borderRadius:10,fontSize:8,fontWeight:800,background:t.c+"15",color:t.c}}>{t.icon} {cnt}</span>;
          })}
        </div>
      </div>

      {tab==="records" ? (
        <RecordsTab
          allFields={allFields}
          mockRecords={mockRecords}
          M={M} A={A} fz={fz} pyV={pyV}
          viewState={viewState} setViewState={setViewState}
          templates={templates} onSaveTemplate={onSaveTemplate} onDeleteTemplate={onDeleteTemplate}
          showThumb={true}
          renderMode="table"
        />
      ) : (
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {/* ── AXIS 1: Issue Type selector ── */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Step 1 — Select issue type</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {ISSUE_TYPES.map(t => (
                <button key={t.v} onClick={()=>setIssueType(t.v)}
                  style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${issueType===t.v?t.c:M.inBd}`,background:issueType===t.v?t.c+"12":"transparent",color:issueType===t.v?t.c:M.tB,fontSize:11,fontWeight:issueType===t.v?900:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}>
                  <span style={{fontSize:14}}>{t.icon}</span>{t.v}
                  <span style={{fontSize:8,fontWeight:800,padding:"1px 6px",borderRadius:6,background:issueType===t.v?t.c+"20":M.mid,color:issueType===t.v?t.c:M.tD}}>{(ISSUE_TYPE_FIELDS[t.v]||[]).length}f</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── AXIS 2: Item Category selector ── */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Step 2 — Select item category</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {ITEM_CATS.map(c => (
                <button key={c.v} onClick={()=>setItemCat(c.v)}
                  style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${itemCat===c.v?c.c:M.inBd}`,background:itemCat===c.v?c.c+"12":"transparent",color:itemCat===c.v?c.c:M.tB,fontSize:11,fontWeight:itemCat===c.v?900:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}>
                  <span style={{fontSize:14}}>{c.icon}</span>{c.v}
                  <span style={{fontSize:8,fontWeight:800,padding:"1px 6px",borderRadius:6,background:itemCat===c.v?c.c+"20":M.mid,color:itemCat===c.v?c.c:M.tD}}>{(ISSUE_CAT_FIELDS[c.v]||[]).length}f</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── FIELD COUNT SUMMARY ── */}
          <div style={{padding:"8px 14px",background:M.mid,borderRadius:8,border:`1px solid ${M.div}`,marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:900,color:M.tD}}>TOTAL FIELDS:</span>
            <span style={{fontSize:14,fontWeight:900,color:M.tA}}>{totalFields}</span>
            <span style={{fontSize:9,color:M.tC}}>=</span>
            <span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:800,background:A.al,color:A.a}}>{allFields.length} common</span>
            <span style={{fontSize:9,color:M.tC}}>+</span>
            <span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:800,background:activeTypeColor+"15",color:activeTypeColor}}>{typeFields.length} {issueType}</span>
            <span style={{fontSize:9,color:M.tC}}>+</span>
            <span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:800,background:activeCatColor+"15",color:activeCatColor}}>{catFields.length} {itemCat}</span>
          </div>

          {/* ── LAYER 1: Common fields ── */}
          <div style={{background:M.hi,border:`1px solid ${M.div}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:900,color:A.a,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:13}}>📋</span> Common fields
              <span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:A.al,color:A.a}}>{allFields.length}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {allFields.map(f => renderField(f, A.a, "common_"))}
            </div>
          </div>

          {/* ── LAYER 2: Type-specific fields ── */}
          <div style={{background:M.hi,border:`1.5px solid ${activeTypeColor}30`,borderRadius:10,padding:16,marginBottom:12,borderLeft:`4px solid ${activeTypeColor}`}}>
            <div style={{fontSize:11,fontWeight:900,color:activeTypeColor,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:13}}>{ISSUE_TYPES.find(t=>t.v===issueType)?.icon}</span> {issueType} — type-specific
              <span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:activeTypeColor+"15",color:activeTypeColor}}>{typeFields.length}</span>
            </div>
            {typeFields.length > 0 ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {typeFields.map(f => renderField(f, activeTypeColor, "type_"))}
              </div>
            ) : (
              <div style={{fontSize:11,color:M.tD,fontStyle:"italic"}}>No type-specific fields for this issue type.</div>
            )}
          </div>

          {/* ── LAYER 3: Category-specific fields ── */}
          <div style={{background:M.hi,border:`1.5px solid ${activeCatColor}30`,borderRadius:10,padding:16,marginBottom:16,borderLeft:`4px solid ${activeCatColor}`}}>
            <div style={{fontSize:11,fontWeight:900,color:activeCatColor,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:13}}>{ITEM_CATS.find(c=>c.v===itemCat)?.icon}</span> {itemCat} — category-specific
              <span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:activeCatColor+"15",color:activeCatColor}}>{catFields.length}</span>
            </div>
            {catFields.length > 0 ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {catFields.map(f => renderField(f, activeCatColor, "cat_"))}
              </div>
            ) : (
              <div style={{fontSize:11,color:M.tD,fontStyle:"italic"}}>No category-specific fields for this item type.</div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <button style={{padding:"10px 24px",border:"none",borderRadius:8,background:"#BE123C",color:"#fff",fontSize:12,fontWeight:900,cursor:"pointer"}}>📤 Save Issue</button>
            <button style={{padding:"10px 24px",border:"none",borderRadius:8,background:"#059669",color:"#fff",fontSize:12,fontWeight:900,cursor:"pointer"}}>📤 Save & Print Challan</button>
            <button onClick={()=>{setFormData({});}} style={{padding:"10px 24px",border:`1px solid ${M.inBd}`,borderRadius:8,background:M.inBg,color:M.tB,fontSize:12,fontWeight:700,cursor:"pointer"}}>↺ Clear Form</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  DATA ENTRY TAB — form entry with Views Bar (Entry tab only)
// ═══════════════════════════════════════════════════════════════════
function DataEntryTab({ allFields, sections, views, activeViewId, onActivateView, onSaveView, onDeleteView, formData, onChange, errors, M, A, fz, pyV, onSave, onClear }) {
  const [eMode, setEMode]   = useState("form"); // "form" | "inline"
  const [openSec, setOpenSec] = useState(sections.map(s => s.id));
  const [showVP, setShowVP]   = useState(false);
  const [editingV, setEditingV] = useState(null);
  const [toast, setToast]     = useState(null);
  const showToast = (msg, color="#15803d") => { setToast(msg); setTimeout(()=>setToast(null),2500); };

  const curView = activeViewId ? views.find(v=>v.id===activeViewId) : null;
  const visibleCols = curView ? curView.fields : allFields.map(f=>f.col);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>
      {/* Tab bar with Form/Inline toggle */}
      <div style={{padding:"6px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0}}>
        <span style={{fontSize:10,fontWeight:900,color:M.tA}}>✏ Data Entry</span>
        <div style={{flex:1}}/>
        <div style={{display:"flex",background:M.lo,borderRadius:6,padding:2,gap:1}}>
          {[{k:"form",l:"▤ Form"},{k:"inline",l:"☰ Inline"}].map(m=>(
            <button key={m.k} onClick={()=>setEMode(m.k)} style={{padding:"4px 10px",border:"none",borderRadius:4,background:eMode===m.k?A.a:"transparent",color:eMode===m.k?"#fff":M.tC,fontSize:9,fontWeight:eMode===m.k?900:700,cursor:"pointer"}}>{m.l}</button>
          ))}
        </div>
      </div>
      {/* ── Views Bar — ENTRY TAB ONLY ── */}
      <div style={{padding:"5px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:5,background:M.lo,flexShrink:0,flexWrap:"wrap",minHeight:32}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",flexShrink:0,marginRight:4}}>VIEWS:</span>
        {/* All Fields pill */}
        <button onClick={()=>onActivateView(activeViewId?null:null)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid "+(activeViewId===null?A.a:M.inBd),background:activeViewId===null?A.al:M.inBg,color:activeViewId===null?A.a:M.tB,fontSize:9,fontWeight:activeViewId===null?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          {activeViewId===null&&<span style={{width:6,height:6,borderRadius:"50%",background:A.a,display:"inline-block"}}/>}
          All Fields <span style={{opacity:.5,fontSize:8}}>({allFields.length})</span>
        </button>
        {/* System + Custom views */}
        {views.map(v=>{
          const isAct=activeViewId===v.id;
          return(
            <div key={v.id} style={{display:"flex",alignItems:"center",gap:0,background:isAct?(v.color+"10"):"transparent",border:"1.5px solid "+(isAct?v.color:v.isSystem?"#d1d5db":"#c4b5fd"),borderRadius:5,overflow:"hidden"}}>
              <button onClick={()=>onActivateView(isAct?null:v.id)} style={{padding:"4px 10px",border:"none",background:"transparent",color:isAct?v.color:M.tB,fontSize:9,fontWeight:isAct?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                {isAct&&<span style={{width:6,height:6,borderRadius:"50%",background:v.color,display:"inline-block"}}/>}
                {v.icon} {v.name}
              </button>
              {!v.isSystem&&<><div style={{width:1,height:14,background:"#c4b5fd"}}/><button onClick={()=>setEditingV(v)} style={{padding:"3px 6px",border:"none",background:"transparent",color:"#7C3AED",fontSize:9,cursor:"pointer"}}>✏</button></>}
            </div>
          );
        })}
        {/* Description chip */}
        {curView&&<div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"3px 8px",background:curView.color+"10",border:"1px solid "+curView.color+"30",borderRadius:5}}>
          <span style={{fontSize:11}}>{curView.icon}</span>
          <span style={{fontSize:9,color:curView.color,fontWeight:700}}>{curView.desc}</span>
          <span style={{fontSize:8,color:M.tD}}>· {curView.fields.length} of {allFields.length} fields</span>
        </div>}
        <button onClick={()=>setShowVP(true)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid "+M.inBd,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>🔖 Manage</button>
      </div>
      {/* Form body */}
      <div style={{flex:1,overflowY:"auto"}}>
        {eMode==="form" ? (
          <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
            {sections.map(sec=>{
              const secFields=allFields.filter(f=>sec.cols.includes(f.col)&&visibleCols.includes(f.col));
              if(secFields.length===0) return null;
              const open=openSec.includes(sec.id);
              const errs=secFields.filter(f=>errors[f.col]).length;
              return(
                <div key={sec.id} style={{border:"1px solid "+(errs>0?"#ef4444":M.div),borderRadius:7,overflow:"hidden"}}>
                  <button onClick={()=>setOpenSec(p=>p.includes(sec.id)?p.filter(x=>x!==sec.id):[...p,sec.id])} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:pyV+"px 14px",background:open?(A.a+"08"):M.mid,border:"none",cursor:"pointer",borderBottom:"1px solid "+(open?M.div:"transparent")}}>
                    <span style={{fontSize:14}}>{sec.icon}</span>
                    <span style={{fontSize:11,fontWeight:900,color:open?A.a:M.tA,flex:1,textAlign:"left"}}>{sec.title}</span>
                    <span style={{fontSize:9,color:M.tD}}>{secFields.length} fields</span>
                    {errs>0&&<span style={{background:"#fef2f2",color:"#ef4444",border:"1px solid #fecaca",borderRadius:3,padding:"1px 6px",fontSize:9,fontWeight:900}}>{errs} err</span>}
                    <span style={{fontSize:10,color:M.tD}}>{open?"▾":"▸"}</span>
                  </button>
                  {open&&<div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px"}}>
                    {secFields.map(f=>(
                      <div key={f.col} style={{gridColumn:f.type==="textarea"?"1 / -1":"auto"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                          <span style={{fontFamily:"monospace",fontSize:8,fontWeight:700,color:M.tD,minWidth:16}}>{f.col}</span>
                          <span style={{fontSize:9,fontWeight:900,color:errors[f.col]?"#ef4444":f.req?A.a:M.tD,flex:1}}>{f.req&&!f.auto?"⚠ ":""}{f.h}</span>
                          <DtBadge type={f.type}/>
                        </div>
                        <FieldInput f={f} val={formData[f.col]} onChange={v=>onChange(f.col,v)} M={M} A={A} fz={fz} compact={false} hasError={!!errors[f.col]}/>
                        {errors[f.col]&&<div style={{fontSize:9,color:"#ef4444",marginTop:2,fontWeight:700}}>{errors[f.col]}</div>}
                        {!errors[f.col]&&!["auto","calc","autocode"].includes(f.type)&&<div style={{fontSize:8,color:M.tD,marginTop:2}}>{f.hint}</div>}
                      </div>
                    ))}
                  </div>}
                </div>
              );
            })}
          </div>
        ) : (
          /* Inline mode */
          <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
            <colgroup><col style={{width:34}}/><col style={{width:28}}/><col style={{width:30}}/><col/><col style={{width:90}}/><col/><col style={{width:46}}/></colgroup>
            <thead style={{position:"sticky",top:0,zIndex:10}}>
              <tr style={{background:CC_RED}}>
                {["COL","#","ICO","FIELD","TYPE","VALUE","STS"].map(h=><th key={h} style={{padding:pyV+"px 7px",textAlign:"left",fontSize:9,fontWeight:900,color:"#fff",borderBottom:"2px solid #aa0000"}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {allFields.filter(f=>visibleCols.includes(f.col)).map((f,i)=>{
                const isAuto=f.auto||["calc","autocode"].includes(f.type);
                const filled=!!formData[f.col]&&!isAuto;
                const hasErr=!!errors[f.col];
                const rowBg=hasErr?"#fef2f2":i%2===0?M.tev:M.tod;
                return(
                  <tr key={f.col} style={{background:rowBg,borderBottom:"1px solid "+M.div,borderLeft:"3px solid "+(hasErr?"#ef4444":"transparent")}}>
                    <td style={{padding:pyV+"px 7px",fontFamily:"monospace",fontSize:9,fontWeight:700,color:M.tC}}>{f.col}</td>
                    <td style={{padding:pyV+"px 7px",fontFamily:"monospace",fontSize:9,color:M.tD,textAlign:"center"}}>{i+1}</td>
                    <td style={{padding:pyV+"px 7px",textAlign:"center"}}><IcoLabel ico={f.ico} A={A}/></td>
                    <td style={{padding:pyV+"px 7px"}}><div style={{fontSize:fz-2,fontWeight:700,color:M.tA}}>{f.h}</div><div style={{fontSize:8,color:M.tD,marginTop:1}}>{f.hint}</div></td>
                    <td style={{padding:pyV+"px 7px"}}><DtBadge type={f.type}/></td>
                    <td style={{padding:(pyV-1)+"px 7px"}}><FieldInput f={f} val={formData[f.col]} onChange={v=>onChange(f.col,v)} M={M} A={A} fz={fz} compact={true} hasError={hasErr}/></td>
                    <td style={{padding:pyV+"px 7px",textAlign:"center"}}>
                      {isAuto?<span style={{color:"#059669",fontSize:8,fontWeight:900}}>AUTO</span>:filled?<span style={{color:"#059669",fontSize:12}}>✓</span>:hasErr?<span style={{color:"#ef4444",fontSize:8,fontWeight:900}}>!!</span>:f.req?<span style={{color:"#f59e0b",fontSize:8,fontWeight:900}}>req</span>:<span style={{color:M.tD,fontSize:8}}>opt</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Footer */}
      <div style={{padding:"10px 14px",borderTop:"1px solid "+M.div,display:"flex",alignItems:"center",gap:8,background:M.mid,flexShrink:0}}>
        <button onClick={onClear} style={{padding:"7px 16px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>↺ Clear</button>
        <div style={{flex:1}}/>
        <button onClick={onSave} style={{padding:"8px 24px",border:"none",borderRadius:5,background:CC_RED,color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>✓ Save to Sheet</button>
      </div>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#15803d",color:"#fff",borderRadius:8,padding:"10px 18px",fontSize:12,fontWeight:800}}>{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  BULK ENTRY TAB — spreadsheet grid with row state flags
// ═══════════════════════════════════════════════════════════════════
const EMPTY_ROW = (fields, id) => {
  const r = {__id:id, __new:true, __dirty:false};
  fields.forEach(f => { r[f.col] = ""; });
  return r;
};

function BulkEntryTab({ allFields, M, A, fz, pyV, rows, setRows, viewState, setViewState, templates, onSaveTemplate, onDeleteTemplate }) {
  const allCols = allFields.map(f => f.col);
  const DEFAULT_VIEW = {name:"Default",__builtin:true,colOrder:allCols,hiddenC:[],sorts:[],filters:{},groupBy:null,subGroupBy:null};

  const {colOrder,hiddenC,sorts,filters,groupBy,subGroupBy,activeViewName} = buildViewState(viewState, allCols);
  const setColOrder      = v => setViewState(p=>({...(p||{}),colOrder:typeof v==="function"?v((p||{}).colOrder??allCols):v}));
  const setHiddenC       = v => setViewState(p=>({...(p||{}),hiddenC:typeof v==="function"?v((p||{}).hiddenC??[]):v}));
  const setSorts         = v => setViewState(p=>({...(p||{}),sorts:typeof v==="function"?v((p||{}).sorts??[]):v}));
  const setFilters       = v => setViewState(p=>({...(p||{}),filters:typeof v==="function"?v((p||{}).filters??{}):v}));
  const setGroupBy       = v => setViewState(p=>({...(p||{}),groupBy:typeof v==="function"?v((p||{}).groupBy??null):v}));
  const setSubGroupBy    = v => setViewState(p=>({...(p||{}),subGroupBy:typeof v==="function"?v((p||{}).subGroupBy??null):v}));
  const setActiveViewName= v => setViewState(p=>({...(p||{}),activeViewName:typeof v==="function"?v((p||{}).activeViewName??"Default"):v}));

  const [selRows,      setSelRows]      = useState(new Set());
  const [editCell,     setEditCell]     = useState(null);
  const [rowErrors,    setRowErrors]    = useState({});
  const [showFP,       setShowFP]       = useState(false);
  const [showSortPanel,setShowSortPanel]= useState(false);
  const [showCM,       setShowCM]       = useState(false);
  const [aggState,     setAggState]     = useState({});
  const [aggOpenInfo,  setAggOpenInfo]  = useState(null);
  const [showSave,     setShowSave]     = useState(false);
  const [tplName,      setTplName]      = useState("");
  const [renamingTpl,  setRenamingTpl]  = useState(null);
  const [editingTpl,   setEditingTpl]   = useState(null);
  const [viewSwitchGuard,setViewSwitchGuard]=useState(null);
  const [dragCol,      setDragCol]      = useState(null);
  const [dropCol,      setDropCol]      = useState(null);
  const [toast,        setToast]        = useState(null);
  const nextId = useRef(Date.now());

  const showToast = (msg,color="#15803d") => { setToast({msg,color}); setTimeout(()=>setToast(null),3000); };
  const visCols = colOrder.filter(c => !hiddenC.includes(c) && allCols.includes(c));
  const activeFilters = Object.values(filters).filter(v=>v.trim()).length;
  const visRows = applySortFilter(rows, sorts, filters, allFields);
  const grouped = buildGrouped(visRows, groupBy, subGroupBy);
  const dirtyCount = rows.filter(r=>r.__dirty||r.__new).length;

  const aggCellClick = (col, el) => {
    if (aggOpenInfo?.col===col) { setAggOpenInfo(null); return; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAggOpenInfo({col, top:Math.max(8,r.top-410), left:Math.min(r.left,window.innerWidth-230)});
  };

  const getViewDirty = () => {
    if (activeViewName==="Default") return !(JSON.stringify(colOrder)===JSON.stringify(allCols)&&hiddenC.length===0&&sorts.length===0&&Object.values(filters).every(v=>!v.trim())&&groupBy===null&&subGroupBy===null);
    const saved=templates.find(t=>t.name===activeViewName);
    if(!saved) return false;
    return JSON.stringify(colOrder)!==JSON.stringify((saved.colOrder||allCols).filter(c=>allCols.includes(c)))||JSON.stringify(hiddenC)!==JSON.stringify(saved.hiddenC||[])||JSON.stringify(sorts)!==JSON.stringify(saved.sorts||[])||JSON.stringify(filters)!==JSON.stringify(saved.filters||{})||groupBy!==(saved.groupBy||null)||subGroupBy!==(saved.subGroupBy||null);
  };
  const viewDirty = getViewDirty();

  const loadTemplate = tpl => {
    setColOrder((tpl.colOrder||allCols).filter(c=>allCols.includes(c)));
    setHiddenC(tpl.hiddenC||[]); setSorts(tpl.sorts||[]); setFilters(tpl.filters||{});
    setGroupBy(tpl.groupBy||null); setSubGroupBy(tpl.subGroupBy||null);
    setActiveViewName(tpl.name); showToast(`📂 View "${tpl.name}" loaded`,"#7C3AED");
  };
  const tryLoadTemplate = tpl => {
    if (viewDirty&&tpl.name!==activeViewName) setViewSwitchGuard({pendingTpl:tpl});
    else loadTemplate(tpl);
  };
  const updateCurrentView = () => {
    if (activeViewName==="Default") return;
    onSaveTemplate({name:activeViewName,colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy});
    showToast(`✅ View "${activeViewName}" updated`);
  };
  const saveTemplate = () => {
    if (!tplName.trim()) return;
    if (tplName.trim().toLowerCase()==="default") { showToast('⚠ "Default" is reserved',"#dc2626"); return; }
    if (templates.find(t=>t.name===tplName.trim())) { showToast(`⚠ Already exists`,"#dc2626"); return; }
    onSaveTemplate({name:tplName.trim(),colOrder:[...colOrder],hiddenC:[...hiddenC],sorts:[...sorts],filters:{...filters},groupBy,subGroupBy});
    setActiveViewName(tplName.trim()); setTplName(""); setShowSave(false);
    showToast(`💾 View "${tplName.trim()}" saved`);
  };
  const deleteTemplate = name => { onDeleteTemplate(name); if(activeViewName===name) setActiveViewName("Default"); showToast(`🗑 View "${name}" deleted`,"#dc2626"); };
  const renameTemplate = (oldName, newName) => {
    if (!newName.trim()||newName.trim()===oldName) { setRenamingTpl(null); return; }
    if (newName.trim().toLowerCase()==="default") { showToast('⚠ Reserved',"#dc2626"); setRenamingTpl(null); return; }
    if (templates.find(t=>t.name===newName.trim())) { showToast(`⚠ Already exists`,"#dc2626"); return; }
    const tpl=templates.find(t=>t.name===oldName); if(!tpl) return;
    onDeleteTemplate(oldName); onSaveTemplate({...tpl,name:newName.trim()});
    if(activeViewName===oldName) setActiveViewName(newName.trim());
    showToast(`✏ Renamed`,"#0078D4"); setRenamingTpl(null);
  };
  const editTemplate = tpl => setEditingTpl({tpl:{...tpl,colOrder:[...tpl.colOrder],hiddenC:[...tpl.hiddenC],sorts:[...tpl.sorts],filters:{...tpl.filters}},originalName:tpl.name});
  const dupTemplate  = tpl => { let dupName=tpl.name+" (copy)"; let i=1; while(templates.find(t=>t.name===dupName)||dupName.toLowerCase()==="default") dupName=tpl.name+` (copy ${++i})`; setEditingTpl({tpl:{...tpl,name:dupName},originalName:null}); };
  const commitTplEdit = updated => {
    if(updated.name.toLowerCase()==="default"){showToast('⚠ "Default" is reserved',"#dc2626");return;}
    if(editingTpl.originalName&&editingTpl.originalName!==updated.name) onDeleteTemplate(editingTpl.originalName);
    onSaveTemplate(updated); setActiveViewName(updated.name);
    showToast(`✅ View "${updated.name}" ${editingTpl.originalName?"updated":"created"}`); setEditingTpl(null);
  };

  const addRow = () => { const id=nextId.current++; setRows(prev=>[...prev,EMPTY_ROW(allFields,id)]); showToast("+ New row added","#0078D4"); };
  const deleteSelected = () => { setRows(prev=>prev.filter(r=>!selRows.has(r.__id))); setSelRows(new Set()); showToast(`🗑 ${selRows.size} row(s) removed`,"#dc2626"); };
  const updateCell = (rowId, col, val) => {
    setRows(prev=>prev.map(r=>{
      if(r.__id!==rowId) return r;
      const updated={...r,[col]:val,__dirty:true};
      // Run auto-compute cascade:
      return Object.assign(updated, computeAutos(col, val, updated));
    }));
  };
  const saveDirty = () => {
    const mandFields = allFields.filter(f=>f.req&&!f.auto);
    const errs = {};
    rows.forEach(r=>{
      if(!r.__dirty&&!r.__new) return;
      const missing=mandFields.filter(f=>!r[f.col]?.trim()).map(f=>f.col);
      if(missing.length>0) errs[r.__id]=missing;
    });
    if(Object.keys(errs).length>0) { setRowErrors(errs); showToast(`⚠ ${Object.keys(errs).length} row(s) have missing required fields`,"#dc2626"); return; }
    // ─── Call GAS here ───
    showToast(`✅ ${dirtyCount} row(s) queued for GAS save`);
    setRows(prev=>prev.map(r=>({...r,__new:false,__dirty:false})));
  };

  const colW = col => { const f=allFields.find(x=>x.col===col); if(!f) return 100; if(["textarea","text"].includes(f.type)) return 160; if(["fk","multifk","dropdown"].includes(f.type)) return 140; if(f.type==="currency"||f.type==="number") return 90; return 110; };
  const allSel = selRows.size===visRows.length&&visRows.length>0;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",position:"relative"}}>
      {/* Toolbar Row 1 */}
      <div style={{padding:"6px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={addRow} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",border:"none",borderRadius:5,background:CC_RED,color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}><span style={{fontSize:13}}>+</span> Add Row</button>
        {selRows.size>0&&<button onClick={deleteSelected} style={{padding:"5px 12px",border:"1px solid #fecaca",borderRadius:5,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:900,cursor:"pointer"}}>🗑 Delete {selRows.size}</button>}
        {dirtyCount>0&&<button onClick={saveDirty} style={{padding:"5px 14px",border:"none",borderRadius:5,background:"#15803d",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>✓ Save {dirtyCount} Changes</button>}
        <div style={{width:1,height:22,background:M.div,margin:"0 4px"}}/>
        <button onClick={()=>{setShowFP(p=>!p);setShowSortPanel(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showFP||activeFilters>0?A.a:M.inBd),background:showFP||activeFilters>0?A.al:M.inBg,color:showFP||activeFilters>0?A.a:M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>🔍 Filter {activeFilters>0&&<span style={{background:A.a,color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{activeFilters}</span>}</button>
        <button onClick={()=>{setShowSortPanel(true);setShowFP(false);setShowCM(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showSortPanel||sorts.length>0?"#7C3AED":M.inBd),background:showSortPanel||sorts.length>0?"#ede9fe":M.inBg,color:showSortPanel||sorts.length>0?"#6d28d9":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>↕ Sort {sorts.length>0&&<span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{sorts.length}</span>}</button>
        <select value={groupBy||""} onChange={e=>{setGroupBy(e.target.value||null);if(!e.target.value)setSubGroupBy(null);}} style={{padding:"5px 8px",border:"1.5px solid "+(groupBy?"#059669":M.inBd),borderRadius:5,background:groupBy?"#f0fdf4":M.inBg,color:groupBy?"#15803d":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">⊞ Group by…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>
        {groupBy&&<select value={subGroupBy||""} onChange={e=>setSubGroupBy(e.target.value||null)} style={{padding:"5px 8px",border:"1.5px solid "+(subGroupBy?"#7C3AED":"#bbf7d0"),borderRadius:5,background:subGroupBy?"#ede9fe":"#f0fdf4",color:subGroupBy?"#6d28d9":"#15803d",fontSize:10,fontWeight:900,cursor:"pointer",outline:"none"}}>
          <option value="">↳ Sub-group…</option>
          {allFields.filter(f=>["dropdown","fk","manual"].includes(f.type)&&f.col!==groupBy).map(f=><option key={f.col} value={f.col}>{f.col} — {f.h}</option>)}
        </select>}
        <button onClick={()=>{setShowCM(p=>!p);setShowFP(false);setShowSortPanel(false);}} style={{padding:"5px 10px",borderRadius:5,border:"1.5px solid "+(showCM||hiddenC.length>0?"#0078D4":M.inBd),background:showCM||hiddenC.length>0?"#eff6ff":M.inBg,color:showCM||hiddenC.length>0?"#1d4ed8":M.tB,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>⊟ Cols {hiddenC.length>0&&<span style={{background:"#0078D4",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:8}}>{hiddenC.length}</span>}</button>
        <div style={{flex:1}}/><span style={{fontSize:9,color:M.tC,fontWeight:700}}>{visRows.length} rows · {visCols.length} cols</span>
      </div>
      {/* Views Bar Row 2 — same pattern as Records */}
      <div style={{padding:"5px 12px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:5,background:M.lo,flexShrink:0,flexWrap:"wrap",minHeight:32}}>
        <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase",flexShrink:0,marginRight:4}}>VIEWS:</span>
        {(()=>{const isActive=activeViewName==="Default",isModified=isActive&&viewDirty;return(<div style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fff7ed":"#CC000015"):"#f5f5f5",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":CC_RED):"#d1d5db"),borderRadius:5,overflow:"hidden"}}><button onClick={()=>tryLoadTemplate(DEFAULT_VIEW)} style={{padding:"4px 10px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":CC_RED):"#374151",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{isActive&&<span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":CC_RED,display:"inline-block"}}/>}🏠 Default{isModified&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}</button><div style={{padding:"2px 6px",fontSize:7,fontWeight:900,color:"#9ca3af",letterSpacing:.5,background:"#ececec",borderLeft:"1px solid #d1d5db",height:"100%",display:"flex",alignItems:"center"}}>LOCKED</div></div>);})()}
        {templates.map(t=>{const isActive=activeViewName===t.name,isModified=isActive&&viewDirty;return(<div key={t.name} style={{display:"flex",alignItems:"center",gap:0,background:isActive?(isModified?"#fffbeb":"#ede9fe"):"#f5f3ff",border:"1.5px solid "+(isActive?(isModified?"#f59e0b":"#7C3AED"):isModified?"#fcd34d":"#c4b5fd"),borderRadius:5,overflow:"hidden"}}>{renamingTpl?.name===t.name?<input autoFocus value={renamingTpl.tempName} onChange={e=>setRenamingTpl(p=>({...p,tempName:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")renameTemplate(t.name,renamingTpl.tempName);if(e.key==="Escape")setRenamingTpl(null);}} onBlur={()=>renameTemplate(t.name,renamingTpl.tempName)} style={{padding:"3px 8px",border:"none",background:"#fff",color:"#6d28d9",fontSize:10,fontWeight:800,outline:"2px solid #7C3AED",width:130}}/>:<button onClick={()=>tryLoadTemplate(t)} style={{padding:"4px 9px",border:"none",background:"transparent",color:isActive?(isModified?"#92400e":"#6d28d9"):"#7c3aed",fontSize:9,fontWeight:isActive?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{isActive&&<span style={{width:6,height:6,borderRadius:"50%",background:isModified?"#f59e0b":"#7C3AED",display:"inline-block"}}/>}📂 {t.name}{isModified&&<span style={{fontSize:7,fontWeight:900,color:"#92400e",background:"#fef3c7",borderRadius:3,padding:"1px 4px",marginLeft:2}}>MODIFIED</span>}</button>}{isActive&&isModified&&<><div style={{width:1,height:16,background:"#fcd34d"}}/><button onClick={updateCurrentView} style={{padding:"4px 9px",border:"none",background:"#f59e0b",color:"#fff",fontSize:9,cursor:"pointer",fontWeight:900,whiteSpace:"nowrap"}}>💾 Update View</button></>}<div style={{width:1,height:16,background:"#c4b5fd"}}/><button onClick={()=>setRenamingTpl(renamingTpl?.name===t.name?null:{name:t.name,tempName:t.name})} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#f59e0b",fontSize:10,cursor:"pointer",fontWeight:900}}>✎</button><div style={{width:1,height:16,background:"#c4b5fd"}}/><button onClick={()=>editTemplate(t)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#0078D4",fontSize:10,cursor:"pointer",fontWeight:900}}>✏</button><div style={{width:1,height:16,background:"#c4b5fd"}}/><button onClick={()=>dupTemplate(t)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#059669",fontSize:10,cursor:"pointer",fontWeight:900}}>⧉</button><div style={{width:1,height:16,background:"#c4b5fd"}}/><button onClick={()=>deleteTemplate(t.name)} style={{padding:"4px 6px",border:"none",background:"transparent",color:"#dc2626",fontSize:10,cursor:"pointer",fontWeight:900}}>×</button></div>);})}
        <button onClick={()=>setShowSave(p=>!p)} style={{padding:"4px 10px",borderRadius:5,border:"1.5px solid #c4b5fd",background:showSave?"#7C3AED":"#fdf4ff",color:showSave?"#fff":"#7C3AED",fontSize:9,fontWeight:900,cursor:"pointer"}}>+ Save View</button>
      </div>
      {/* Panels */}
      {showFP&&<div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,marginRight:4}}>FILTER BY:</span>{visCols.map(col=>{const f=allFields.find(x=>x.col===col);if(!f||f.auto||["calc","autocode"].includes(f.type))return null;return(<div key={col} style={{display:"flex",alignItems:"center",gap:4,background:M.lo,border:"1px solid "+M.inBd,borderRadius:5,padding:"3px 6px"}}><span style={{fontSize:8,fontWeight:900,color:M.tD,fontFamily:"monospace"}}>{col}</span><input value={filters[col]||""} onChange={e=>setFilters(p=>({...p,[col]:e.target.value}))} placeholder={f.h} style={{border:"none",background:"transparent",color:M.tA,fontSize:10,outline:"none",width:100}}/>{filters[col]&&<button onClick={()=>setFilters(p=>{const n={...p};delete n[col];return n;})} style={{border:"none",background:"none",cursor:"pointer",color:M.tD,fontSize:10,padding:0}}>×</button>}</div>);})} <button onClick={()=>setFilters({})} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>Clear All</button></div>}
      {showCM&&<div style={{padding:"10px 12px",borderBottom:"1px solid "+M.div,background:M.hi,flexShrink:0,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:9,fontWeight:900,color:M.tD,textTransform:"uppercase",letterSpacing:.8,marginRight:4}}>COLUMNS:</span>{allCols.map(col=>{const f=allFields.find(x=>x.col===col);const hidden=hiddenC.includes(col);return(<button key={col} onClick={()=>setHiddenC(p=>hidden?p.filter(c=>c!==col):[...p,col])} style={{padding:"3px 8px",borderRadius:4,border:"1.5px solid "+(hidden?M.div:A.a),background:hidden?M.lo:A.al,color:hidden?M.tD:A.a,fontSize:9,fontWeight:hidden?700:900,cursor:"pointer",textDecoration:hidden?"line-through":"none"}}>{col} {f?.h}</button>);})}<button onClick={()=>setHiddenC([])} style={{padding:"3px 9px",border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tB,fontSize:9,fontWeight:800,cursor:"pointer",marginLeft:4}}>Show All</button></div>}
      {showSave&&<div style={{padding:"8px 12px",borderBottom:"1px solid "+M.div,background:"#fdfbff",flexShrink:0,display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:9,fontWeight:900,color:"#6d28d9",textTransform:"uppercase",letterSpacing:.8}}>SAVE VIEW:</span><input value={tplName} onChange={e=>setTplName(e.target.value)} placeholder="View name…" style={{border:"1.5px solid #c4b5fd",borderRadius:5,background:"#fff",color:"#1a1a1a",fontSize:11,padding:"4px 9px",outline:"none",width:200}}/><button onClick={saveTemplate} style={{padding:"5px 14px",border:"none",borderRadius:5,background:"#7C3AED",color:"#fff",fontSize:10,fontWeight:900,cursor:"pointer"}}>💾 Save</button><button onClick={()=>setShowSave(false)} style={{padding:"5px 10px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:10,fontWeight:800,cursor:"pointer"}}>Cancel</button></div>}
      {showSortPanel&&<SortPanel sorts={sorts} setSorts={setSorts} allFields={allFields} M={M} A={A} onClose={()=>setShowSortPanel(false)}/>}
      {/* Grid */}
      <div style={{flex:1,overflowX:"auto",overflowY:"auto"}}>
        <table style={{borderCollapse:"collapse",minWidth:"100%"}}>
          <thead style={{position:"sticky",top:0,zIndex:20}}>
            <tr>
              <th style={{width:32,padding:"0 6px",background:M.thd,borderBottom:"2px solid "+CC_RED,borderRight:"1px solid "+M.div}}>
                <input type="checkbox" checked={allSel} onChange={()=>setSelRows(allSel?new Set():new Set(visRows.map(r=>r.__id)))} style={{cursor:"pointer"}}/>
              </th>
              <th style={{width:36,padding:pyV+"px 8px",background:M.thd,borderBottom:"2px solid "+CC_RED,borderRight:"1px solid "+M.div,fontSize:9,fontWeight:900,color:M.tD}}>#</th>
              {visCols.map((col,ci)=>{const f=allFields.find(x=>x.col===col);return(
                <th key={col} draggable onDragStart={()=>setDragCol(col)} onDragOver={e=>{e.preventDefault();setDropCol(col);}} onDrop={()=>{if(dragCol&&dropCol&&dragCol!==dropCol){setColOrder(p=>{const a=[...p],fi=a.indexOf(dragCol),ti=a.indexOf(dropCol);if(fi<0||ti<0)return a;a.splice(fi,1);a.splice(ti,0,dragCol);return a;});}setDragCol(null);setDropCol(null);}}
                  style={{minWidth:colW(col),padding:pyV+"px 8px",background:M.thd,borderBottom:"2px solid "+CC_RED,borderRight:"1px solid "+M.div,textAlign:"left",fontSize:9,fontWeight:900,color:M.tB,whiteSpace:"nowrap",cursor:"grab",userSelect:"none",borderLeft:dropCol===col?"3px solid #f59e0b":"3px solid transparent"}}>
                  <span style={{fontFamily:"monospace",fontSize:8,color:M.tD,marginRight:3}}>{col}</span>{f?.h||col}
                </th>
              );})}
              <th style={{width:28,background:M.thd,borderBottom:"2px solid "+CC_RED}}/>
            </tr>
          </thead>
          <tbody>
            {grouped.map((grp,gi)=>(
              <React.Fragment key={gi}>
                {grp.key!==null&&<tr><td colSpan={visCols.length+3} style={{padding:"6px 12px",background:"#1e293b",color:"#fff",fontWeight:900,fontSize:11}}><span style={{opacity:.7,marginRight:6}}>⊞</span>{allFields.find(f=>f.col===groupBy)?.h}: <span style={{color:"#f59e0b"}}>{grp.key}</span><span style={{background:"#dc2626",color:"#fff",borderRadius:10,padding:"1px 8px",fontSize:9,fontWeight:900,marginLeft:8}}>{grp.sub.reduce((acc,s)=>acc+s.rows.length,0)}</span></td></tr>}
                {grp.sub.map((sub,si)=>(
                  <React.Fragment key={si}>
                    {sub.subKey!==null&&<tr><td colSpan={visCols.length+3} style={{padding:"5px 12px 5px 40px",background:"#334155",color:"#e2e8f0",fontWeight:700,fontSize:10}}>↳ {allFields.find(f=>f.col===subGroupBy)?.h}: <span style={{color:"#c4b5fd"}}>{sub.subKey}</span><span style={{background:"#7C3AED",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:8,fontWeight:900,marginLeft:6}}>{sub.rows.length}</span></td></tr>}
                    {sub.rows.map((row,ri)=>{
                      const isSel=selRows.has(row.__id);
                      const rowErrCols=rowErrors[row.__id]||[];
                      const rowBg=row.__new?"rgba(0,120,212,.04)":row.__dirty?"rgba(245,158,11,.04)":"inherit";
                      const leftBorder=rowErrCols.length>0?"3px solid #dc2626":row.__new?"3px solid #0078D4":row.__dirty?"3px solid #f59e0b":"3px solid transparent";
                      return(
                        <tr key={row.__id} style={{borderBottom:"1px solid "+M.div,background:isSel?A.al:rowBg,borderLeft:leftBorder}}>
                          <td style={{padding:"0 6px",textAlign:"center"}}><input type="checkbox" checked={isSel} onChange={()=>setSelRows(p=>{const n=new Set(p);isSel?n.delete(row.__id):n.add(row.__id);return n;})} style={{cursor:"pointer"}}/></td>
                          <td style={{padding:pyV+"px 8px",fontSize:9,color:M.tD,textAlign:"center",fontFamily:"monospace"}}>{ri+1}</td>
                          {visCols.map(col=>{
                            const f=allFields.find(x=>x.col===col);
                            const isAuto=f?.auto||["calc","autocode"].includes(f?.type||"");
                            const isEdit=editCell?.rowId===row.__id&&editCell?.col===col;
                            const val=row[col]||"";
                            const isMissing=rowErrCols.includes(col);
                            return(
                              <td key={col} onClick={()=>{if(!isAuto)setEditCell({rowId:row.__id,col});}} onBlur={()=>setEditCell(null)}
                                style={{padding:"2px 4px",maxWidth:colW(col)+40,cursor:isAuto?"default":"pointer",borderRight:"1px solid "+M.div,background:isMissing?"#fff0f0":"inherit"}}>
                                {isAuto?<div style={{fontSize:fz-2,color:A.a,fontFamily:"monospace",padding:"3px 5px",background:A.al,borderRadius:3}}>{val||<span style={{opacity:.5}}>auto</span>}</div>
                                :isEdit?<BulkCell f={f} val={val} onChange={v=>updateCell(row.__id,col,v)} onBlur={()=>setEditCell(null)} M={M} A={A} fz={fz}/>
                                :<div style={{fontSize:fz-2,color:M.tA,padding:"3px 5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",borderBottom:"1px dashed "+(isMissing?"#ef4444":val?"transparent":M.inBd),minHeight:20}}>
                                  {val||isMissing?<span style={{color:"#dc2626",fontWeight:900,fontSize:fz-3}}>⚠ required</span>:<span style={{color:M.tD,fontStyle:"italic",fontSize:fz-3}}>{f?.req?"fill required":"—"}</span>}
                                </div>}
                              </td>
                            );
                          })}
                          <td style={{padding:"2px 4px",textAlign:"center"}}><button onClick={()=>setRows(p=>p.filter(r=>r.__id!==row.__id))} style={{width:20,height:20,borderRadius:3,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",cursor:"pointer",fontSize:11}}>×</button></td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
            <tr><td colSpan={visCols.length+3} style={{padding:"6px 12px"}}><button onClick={addRow} style={{display:"flex",alignItems:"center",gap:6,color:M.tD,background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:700}}><span style={{fontSize:16,color:A.a}}>+</span> Add new row</button></td></tr>
          </tbody>
          <AggFooter visRows={visRows} visCols={visCols} allFields={allFields} aggState={aggState} openCol={aggOpenInfo?.col||null} onCellClick={aggCellClick} hasCheckbox={true} M={M} A={A}/>
        </table>
      </div>
      {aggOpenInfo&&<><div onClick={()=>setAggOpenInfo(null)} style={{position:"fixed",inset:0,zIndex:9998}}/><AggDropdown openInfo={aggOpenInfo} aggState={aggState} setAggState={setAggState} visRows={visRows} allFields={allFields} onClose={()=>setAggOpenInfo(null)} M={M} A={A}/></>}
      {/* Status bar */}
      <div style={{padding:"4px 12px",borderTop:"1px solid "+M.div,background:M.mid,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{fontSize:9,color:M.tD,fontWeight:700}}>{rows.length} total · {visRows.length} visible</span>
        {dirtyCount>0&&<span style={{fontSize:9,color:"#f59e0b",fontWeight:900}}>● {dirtyCount} unsaved</span>}
        {selRows.size>0&&<span style={{fontSize:9,color:A.a,fontWeight:900}}>{selRows.size} selected</span>}
        {sorts.length>0&&<span style={{fontSize:9,color:"#6d28d9"}}>↕ {sorts.map(s=>s.col).join(", ")}</span>}
        {activeFilters>0&&<span style={{fontSize:9,color:A.a}}>🔍 {activeFilters} filter(s)</span>}
        {groupBy&&<span style={{fontSize:9,color:"#059669"}}>⊞ {allFields.find(f=>f.col===groupBy)?.h||groupBy}</span>}
        <div style={{flex:1}}/><span style={{fontSize:8,color:M.tD,fontFamily:"monospace"}}>⬅ drag headers · click cell to edit · tab to move</span>
      </div>
      {/* Modals */}
      {viewSwitchGuard&&<><div onClick={()=>setViewSwitchGuard(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(2px)",zIndex:1500}}/><div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:M.hi,border:"1px solid #fcd34d",borderRadius:10,zIndex:1501,boxShadow:"0 8px 32px rgba(0,0,0,.3)",overflow:"hidden"}}><div style={{background:"#f59e0b",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>⚠️</span><div><div style={{color:"#fff",fontSize:13,fontWeight:900}}>Unsaved View Changes</div><div style={{color:"rgba(255,255,255,.85)",fontSize:10}}>"{activeViewName}" has unsaved modifications</div></div></div><div style={{padding:"16px 20px"}}><div style={{display:"flex",flexDirection:"column",gap:8}}><button onClick={()=>{updateCurrentView();loadTemplate(viewSwitchGuard.pendingTpl);setViewSwitchGuard(null);}} style={{padding:"9px 16px",border:"none",borderRadius:6,background:"#15803d",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer",textAlign:"left"}}>💾 Save changes — then switch</button><button onClick={()=>{loadTemplate(viewSwitchGuard.pendingTpl);setViewSwitchGuard(null);}} style={{padding:"9px 16px",border:"1px solid #fcd34d",borderRadius:6,background:"#fffbeb",color:"#92400e",fontSize:11,fontWeight:800,cursor:"pointer",textAlign:"left"}}>↩ Discard — switch to "{viewSwitchGuard.pendingTpl.name}"</button><button onClick={()=>setViewSwitchGuard(null)} style={{padding:"9px 16px",border:"1px solid "+M.inBd,borderRadius:6,background:M.inBg,color:M.tB,fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"left"}}>← Stay on "{activeViewName}"</button></div></div></div></>}
      {editingTpl&&<ViewEditModal allFields={allFields} allCols={allCols} initial={editingTpl.tpl} isDup={!editingTpl.originalName} existingNames={["Default",...templates.map(t=>t.name).filter(n=>n!==editingTpl.originalName)]} onSave={commitTplEdit} onCancel={()=>setEditingTpl(null)} M={M} A={A} fz={fz}/>}
      {toast&&<div style={{position:"absolute",bottom:40,right:16,zIndex:999,background:toast.color||"#15803d",color:"#fff",borderRadius:7,padding:"8px 16px",fontSize:11,fontWeight:800,boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>{toast.msg}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FIELD SPECS TAB — read-only field reference table
// ═══════════════════════════════════════════════════════════════════
function FieldSpecsTab({ allFields, M, A, fz, pyV }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const TABS = ["All","Mandatory","Auto/GAS","FK Links","Manual Entry"];
  const fields = allFields.filter(f => {
    const ms = !search || f.h.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="Mandatory"?f.req:filter==="Auto/GAS"?(f.auto||f.ico==="#"):filter==="FK Links"?!!f.fk:filter==="Manual Entry"?(!f.auto&&f.ico!=="#"&&!f.fk&&!["calc","auto","autocode"].includes(f.type)):true;
    return ms && mf;
  });
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"8px 14px",borderBottom:"1px solid "+M.div,display:"flex",alignItems:"center",gap:6,background:M.mid,flexShrink:0,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fields…" style={{border:"1px solid "+M.inBd,borderRadius:4,background:M.inBg,color:M.tA,fontSize:fz-2,padding:"4px 8px",outline:"none",width:160}}/>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {TABS.map(t=><button key={t} onClick={()=>setFilter(t)} style={{padding:"3px 10px",borderRadius:20,border:"1.5px solid "+(filter===t?A.a:M.inBd),background:filter===t?A.a:M.inBg,color:filter===t?A.tx:M.tB,fontSize:9,fontWeight:800,cursor:"pointer"}}>{t}</button>)}
        </div>
        <span style={{marginLeft:"auto",fontSize:10,color:M.tC,fontWeight:700}}>{fields.length}/{allFields.length}</span>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead style={{position:"sticky",top:0,zIndex:10}}>
            <tr style={{background:CC_RED}}>
              {["COL","ICO","FIELD HEADER","DATA TYPE","REQ?","AUTO?","FK LINK"].map(h=><th key={h} style={{padding:pyV+"px 8px",textAlign:"left",fontSize:9,fontWeight:900,color:"#fff",borderBottom:"2px solid #aa0000",whiteSpace:"nowrap"}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {fields.map((f,i)=>(
              <tr key={f.col} style={{background:i%2===0?M.tev:M.tod,borderBottom:"1px solid "+M.div}}>
                <td style={{padding:pyV+"px 8px",fontFamily:"monospace",fontSize:9,fontWeight:700,color:M.tC}}>{f.col}</td>
                <td style={{padding:pyV+"px 8px",textAlign:"center"}}><IcoLabel ico={f.ico} A={A}/></td>
                <td style={{padding:pyV+"px 8px"}}><div style={{fontSize:fz-2,fontWeight:700,color:M.tA}}>{f.h}</div><div style={{fontSize:8,color:M.tD,marginTop:1}}>{f.hint}</div></td>
                <td style={{padding:pyV+"px 8px"}}><DtBadge type={f.type}/></td>
                <td style={{padding:pyV+"px 8px",textAlign:"center"}}>{f.req?<span style={{color:"#ef4444",fontWeight:900,fontSize:9}}>YES</span>:<span style={{color:M.tD,fontSize:9}}>—</span>}</td>
                <td style={{padding:pyV+"px 8px",textAlign:"center"}}>{(f.auto||f.ico==="#")?<span style={{color:"#059669",fontWeight:900,fontSize:9}}>GAS</span>:<span style={{color:M.tD,fontSize:9}}>—</span>}</td>
                <td style={{padding:pyV+"px 8px"}}>{f.fk?<span style={{fontSize:9,fontWeight:900,color:"#2563eb",fontFamily:"monospace"}}>{f.fk}</span>:<span style={{color:M.tD,fontSize:9}}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  INVENTORY MODULE — Multi-sub-module wrapper with sidebar navigation
//  📊 Stock Ledger | 🔄 Movements | 🚛 Transfer | 📋 Adjustments
// ═══════════════════════════════════════════════════════════════════
class InvErrorBoundary extends Component{constructor(p){super(p);this.state={err:null,info:null};}static getDerivedStateFromError(e){return{err:e};}componentDidCatch(e,info){this.setState({info});console.error("INVENTORY_ERROR:",e?.message,e?.stack?.split("\n").slice(0,5).join("\n"));}render(){if(this.state.err)return(<div style={{padding:30,background:"#fef2f2",border:"2px solid #dc2626",borderRadius:12,margin:20,fontFamily:"monospace"}}><h2 style={{color:"#dc2626",margin:"0 0 8px"}}>Inventory Module Error</h2><pre style={{color:"#991b1b",fontSize:12,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{this.state.err?.message}{"\n"}{this.state.err?.stack?.split("\n").slice(0,8).join("\n")}</pre></div>);return this.props.children;}}
export default function ModuleAppWrapped(props){return <InvErrorBoundary><ModuleApp {...props}/></InvErrorBoundary>;}
function ModuleApp({ activeSub: externalSub, onSubChange }) {
  // ── Theme & density ──
  const [modeKey,  setModeKey]  = useState("light");
  const [accKey,   setAccKey]   = useState("teal");
  const [density,  setDensity]  = useState("comfortable");
  const [fzKey,    setFzKey]    = useState("medium");
  const M   = MODES[modeKey];
  const A   = ACC[accKey];
  const fz  = {small:11, medium:13, large:15}[fzKey];
  const pyV = {compact:4, comfortable:7, spacious:11}[density];

  // ── Active sub-module (driven by sidebar prop, fallback to internal) ──
  const [activeSub, setActiveSubInternal] = useState(externalSub || "ledger");
  const setActiveSub = (v) => { setActiveSubInternal(v); if (onSubChange) onSubChange(v); };
  const sub = SUB_MODULES.find(s => s.id === activeSub);
  const activeFields   = sub.fields;
  const activeSections = SECTIONS_MAP[activeSub] || [];
  const activeMocks    = MOCK_MAP[activeSub] || [];

  // ── Tab state ──
  const [tab, setTab] = useState("records");

  // ── V4: Record detail view state ──
  const [detailRecord, setDetailRecord] = useState(null);
  const [ledgerViewMode, setLedgerViewMode] = useState("list"); // "list" | "table"
  const [thumbPx, setThumbPx] = useState(28);
  const thumbDrag = useRef(false), thumbSx = useRef(0), thumbSw = useRef(28);
  const onThumbDragStart = useCallback(e => { e.preventDefault(); thumbDrag.current = true; thumbSx.current = e.clientX; thumbSw.current = thumbPx; const mv = ev => { if (!thumbDrag.current) return; setThumbPx(Math.min(96, Math.max(20, thumbSw.current + (ev.clientX - thumbSx.current)))); }; const up = () => { thumbDrag.current = false; window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); }; window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up); }, [thumbPx]);
  const ts = {w:thumbPx, h:thumbPx, rw:thumbPx+2, rh:thumbPx+2, r:Math.max(4, Math.round(thumbPx/7))};
  const thumbPreset = (px) => setThumbPx(px);

  // ── Data Entry form state ──
  const [formData, setFormData] = useState({});
  const [errors,   setErrors]   = useState({});
  const [dirty,    setDirty]    = useState(false);
  const [guardModal, setGuardModal] = useState(null);

  // ── Data Entry views ──
  const [views,   setViews]   = useState(() => mkModuleViews(activeFields, activeSub));
  const [activeV, setActiveV] = useState(null);

  // ── Records view persistence ──
  const [recViewState, setRecViewState] = useState(null);
  const [recTpls,      setRecTpls]      = useState([]);

  // ── Bulk Entry state ──
  const [bulkRows,      setBulkRows]      = useState(() => Array.from({length:3},(_,i) => EMPTY_ROW(activeFields, i+1)));
  const [bulkViewState, setBulkViewState] = useState(null);
  const [bulkTpls,      setBulkTpls]      = useState([]);

  // ── Sidebar resize ──
  const { w:sbW, onMouseDown:onSbDrag } = useDrag(230, 160, 340);

  // ── MIP + Allocation popups (at top level to avoid overflow:hidden clipping) ──
  const [mipPopup,   setMipPopup]   = useState(null);
  const [allocPopup, setAllocPopup] = useState(null);

  // ── Sub-module switch → reset state ──
  const switchSub = (newSub) => {
    if (dirty) { setGuardModal({action:"sub", payload:newSub, type:"entry"}); return; }
    if (tab==="bulk" && bulkRows.some(r=>r.__dirty||r.__new)) { setGuardModal({action:"sub", payload:newSub, type:"bulk"}); return; }
    setActiveSub(newSub);
    setDetailRecord(null);
    const s = SUB_MODULES.find(x=>x.id===newSub);
    setViews(mkModuleViews(s.fields, newSub));
    setActiveV(null);
    setFormData({}); setErrors({}); setDirty(false);
    setBulkRows(Array.from({length:3},(_,i)=>EMPTY_ROW(s.fields,i+1)));
    setRecViewState(null); setRecTpls([]);
    setBulkViewState(null); setBulkTpls([]);
    setTab("records");
  };

  // ── Sync sub-module from sidebar prop ──
  useEffect(() => { if (externalSub && externalSub !== activeSub) { switchSub(externalSub); } }, [externalSub]);

  // ── Guard: intercept navigation ──
  const bulkDirty = bulkRows.some(r => r.__dirty || r.__new);
  const tryTab = newTab => {
    if (dirty && newTab !== "entry") setGuardModal({action:"tab", payload:newTab, type:"entry"});
    else if (tab==="bulk" && bulkDirty && newTab !== "bulk") setGuardModal({action:"tab", payload:newTab, type:"bulk"});
    else setTab(newTab);
  };
  const guardDiscard = () => {
    const g = guardModal; setGuardModal(null);
    if (g.type==="entry") { setFormData({}); setErrors({}); setDirty(false); }
    if (g.type==="bulk")  { setBulkRows(prev=>prev.filter(r=>!r.__dirty&&!r.__new)); }
    if (g.action === "tab") setTab(g.payload);
    if (g.action === "sub") switchSub(g.payload);
  };

  // ── Form handlers ──
  const handleField = (col, val) => {
    setDirty(true);
    setErrors(p => { const e={...p}; delete e[col]; return e; });
    setFormData(prev => computeAutos(col, val, prev, activeSub));
  };
  const validate = () => {
    const errs = {};
    activeFields.filter(f => f.req && !f.auto).forEach(f => {
      if (!formData[f.col]?.toString().trim()) errs[f.col] = `${f.h} is required`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSave = () => {
    if (!validate()) return;
    console.log(`Saving ${activeSub} to GAS:`, formData);
    setFormData({}); setErrors({}); setDirty(false);
  };
  const handleClear = () => { setFormData({}); setErrors({}); setDirty(false); };

  // ── Template handlers ──
  const onSaveRecTpl = tpl => setRecTpls(p => { const ex=p.find(t=>t.name===tpl.name); return ex ? p.map(t=>t.name===tpl.name?tpl:t) : [...p,tpl]; });
  const onDeleteRecTpl = name => setRecTpls(p => p.filter(t=>t.name!==name));
  const onSaveBulkTpl = tpl => setBulkTpls(p => { const ex=p.find(t=>t.name===tpl.name); return ex ? p.map(t=>t.name===tpl.name?tpl:t) : [...p,tpl]; });
  const onDeleteBulkTpl = name => setBulkTpls(p => p.filter(t=>t.name!==name));

  const TABS = [
    {k:"records", l:"📋 Records"},
    {k:"entry",   l:"✏ Entry"},
    {k:"bulk",    l:"⊞ Bulk Entry"},
    {k:"specs",   l:"⚙ Field Specs"},
  ];

  return (
    <div style={{display:"flex",flex:1,background:M.bg,color:M.tA,fontFamily:"'Nunito Sans',system-ui,sans-serif",fontSize:fz,overflow:"hidden"}}>
      {/* ── SIDEBAR (hidden when driven by app sidebar) ── */}
      {!externalSub && (<div style={{width:sbW,flexShrink:0,background:M.sbBg,borderRight:"1px solid "+M.sbBd,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Module header */}
        <div style={{padding:"14px 14px 10px",borderBottom:"1px solid "+M.sbBd}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:32,height:32,borderRadius:8,background:"#007C7C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🗄️</div>
            <div>
              <div style={{fontSize:13,fontWeight:900,color:M.tA}}>Inventory</div>
              <div style={{fontSize:9,color:M.tC}}>CC ERP · FILE 3 · 4 sub-modules</div>
            </div>
          </div>
        </div>
        {/* Sub-module selector */}
        <div style={{padding:"8px 0",borderBottom:"1px solid "+M.sbBd}}>
          <div style={{padding:"0 14px 4px",fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase"}}>Sub-Modules</div>
          {SUB_MODULES.map(s=>(
            <button key={s.id} onClick={()=>switchSub(s.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 14px",border:"none",background:activeSub===s.id?A.al:"transparent",color:activeSub===s.id?A.a:M.tB,cursor:"pointer",borderLeft:"3px solid "+(activeSub===s.id?s.color:"transparent"),transition:"all .15s"}}>
              <span style={{fontSize:14}}>{s.icon}</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:10,fontWeight:activeSub===s.id?900:700}}>{s.lbl}</div>
                <div style={{fontSize:8,color:activeSub===s.id?A.a+"99":M.tD}}>{s.fields.length} fields</div>
              </div>
              {activeSub===s.id && <span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:s.color}}/>}
            </button>
          ))}
        </div>
        {/* Tab navigation */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          <div style={{padding:"0 14px 4px",fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase"}}>Views</div>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>tryTab(t.k)} style={{display:"block",width:"100%",padding:"8px 14px",border:"none",background:tab===t.k?A.al:"transparent",color:tab===t.k?A.a:M.tB,fontSize:10,fontWeight:tab===t.k?900:700,cursor:"pointer",textAlign:"left",borderLeft:"3px solid "+(tab===t.k?A.a:"transparent")}}>
              {t.l}
            </button>
          ))}
        </div>
        {/* Sub-module stats card */}
        <div style={{padding:"10px 14px",borderTop:"1px solid "+M.sbBd,background:M.lo}}>
          <div style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>Active: {sub.lbl}</div>
          <div style={{fontSize:9,color:M.tC,lineHeight:1.4}}>{sub.desc}</div>
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            <span style={{fontSize:8,padding:"2px 6px",borderRadius:3,background:sub.color+"20",color:sub.color,fontWeight:800}}>{sub.fields.length} fields</span>
            <span style={{fontSize:8,padding:"2px 6px",borderRadius:3,background:"#ede9fe",color:"#6d28d9",fontWeight:800}}>{activeMocks.length} records</span>
          </div>
        </div>
        {/* Theme controls */}
        <div style={{padding:"10px 14px",borderTop:"1px solid "+M.sbBd,background:M.lo}}>
          <div style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>Theme</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
            {Object.keys(MODES).map(k=><button key={k} onClick={()=>setModeKey(k)} title={MODES[k].lbl} style={{padding:"3px 7px",borderRadius:4,border:"1.5px solid "+(modeKey===k?A.a:M.inBd),background:modeKey===k?A.al:M.inBg,color:modeKey===k?A.a:M.tB,fontSize:8,fontWeight:modeKey===k?900:700,cursor:"pointer"}}>{MODES[k].lbl.split(" ")[0]}</button>)}
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {Object.keys(ACC).map(k=><button key={k} onClick={()=>setAccKey(k)} title={ACC[k].lbl} style={{width:18,height:18,borderRadius:4,background:ACC[k].a,border:accKey===k?"3px solid "+M.tA:"3px solid transparent",cursor:"pointer"}}/>)}
          </div>
        </div>
      </div>)}

      {/* ── Resize handle (only when internal sidebar visible) ── */}
      {!externalSub && (<div onMouseDown={onSbDrag} style={{width:4,cursor:"col-resize",background:"transparent",flexShrink:0}} />)}

      {/* ── MAIN CONTENT ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Tab header bar with sub-module indicator */}
        <div style={{padding:"0 12px",borderBottom:"2px solid "+CC_RED,display:"flex",alignItems:"center",gap:2,background:M.sh,flexShrink:0}}>
          <span style={{fontSize:12,marginRight:4}}>{sub.icon}</span>
          <span style={{fontSize:10,fontWeight:900,color:sub.color,marginRight:8}}>{sub.lbl}</span>
          <div style={{width:1,height:20,background:M.div,margin:"0 4px"}}/>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>tryTab(t.k)} style={{padding:"10px 16px",border:"none",background:"transparent",color:tab===t.k?CC_RED:M.tC,fontSize:10,fontWeight:tab===t.k?900:700,cursor:"pointer",borderBottom:"2px solid "+(tab===t.k?CC_RED:"transparent"),marginBottom:-2}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {tab==="records" && detailRecord && activeSub==="ledger" ? (
            <InventoryRecordDetail
              record={detailRecord}
              onBack={()=>setDetailRecord(null)}
              M={M} A={A} fz={fz}
            />
          ) : tab==="records" && activeSub==="ledger" ? (
            <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
              {/* View mode toggle bar */}
              <div style={{padding:"4px 12px",borderBottom:`1px solid ${M.div}`,background:M.mid,display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:1,textTransform:"uppercase"}}>VIEW MODE:</span>
                {[{id:"list",icon:"☰",label:"List View"},{id:"table",icon:"⊞",label:"Table View"},{id:"column",icon:"≡",label:"Column View"}].map(vm => (
                  <button key={vm.id} onClick={() => setLedgerViewMode(vm.id)}
                    style={{padding:"4px 12px",borderRadius:5,border:`1.5px solid ${ledgerViewMode===vm.id?A.a:M.inBd}`,background:ledgerViewMode===vm.id?A.al:M.inBg,color:ledgerViewMode===vm.id?A.a:M.tB,fontSize:10,fontWeight:ledgerViewMode===vm.id?900:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4,transition:"all .15s"}}>
                    <span style={{fontSize:12}}>{vm.icon}</span>{vm.label}
                  </button>
                ))}
                <div style={{width:1,height:20,background:M.div,margin:"0 4px"}}/>
                <span style={{fontSize:8,fontWeight:900,color:M.tD,letterSpacing:.5}}>📷</span>
                {[{px:28,label:"S"},{px:44,label:"M"},{px:64,label:"L"}].map(sz=>(
                  <button key={sz.label} onClick={()=>thumbPreset(sz.px)}
                    style={{width:24,height:22,borderRadius:4,border:`1.5px solid ${thumbPx===sz.px?"#7C3AED":M.inBd}`,background:thumbPx===sz.px?"#f5f3ff":M.inBg,color:thumbPx===sz.px?"#7C3AED":M.tC,fontSize:9,fontWeight:thumbPx===sz.px?900:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>{sz.label}</button>
                ))}
                <div onMouseDown={onThumbDragStart} title="Drag to resize thumbnails" style={{width:6,height:20,borderRadius:3,background:M.div,cursor:"col-resize",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                  <div style={{width:2,height:12,borderLeft:`1px solid ${M.tD}`,borderRight:`1px solid ${M.tD}`}}/>
                </div>
                <span style={{fontSize:8,color:M.tD,fontFamily:"monospace",minWidth:22}}>{thumbPx}px</span>
                <div style={{flex:1}}/>
                <span style={{fontSize:8,color:M.tD,fontWeight:700}}>
                  {ledgerViewMode==="list"?"☰ List: pill codes · bold names · dark headers · compact":ledgerViewMode==="column"?"≡ Column: Miller columns · hierarchical browse · thumbnails":"⊞ Table: column codes · auto badges · border grid · agg footer"} · All features shared
                </span>
              </div>
              {/* Render active view */}
              <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                {ledgerViewMode==="column" ? (
                  <ColumnView
                    mockRecords={activeMocks}
                    allFields={activeFields}
                    onOpenRecord={(row) => setDetailRecord(row)}
                    M={M} A={A} fz={fz} ts={ts}
                  />
                ) : (
                <RecordsTab
                  allFields={activeFields}
                  mockRecords={activeMocks}
                  M={M} A={A} fz={fz} pyV={pyV}
                  viewState={recViewState} setViewState={setRecViewState}
                  templates={recTpls} onSaveTemplate={onSaveRecTpl} onDeleteTemplate={onDeleteRecTpl}
                  onOpenRecord={(row) => setDetailRecord(row)}
                  showThumb={true}
                  renderMode={ledgerViewMode}
                  ts={ts}
                  onOpenMIP={(itemCode,itemName)=>setMipPopup({itemCode,itemName})}
                  onOpenAlloc={(itemCode,itemName)=>setAllocPopup({itemCode,itemName})}
                />
                )}
              </div>
            </div>
          ) : tab==="records" && activeSub==="issue" ? (
            <StockIssueTabNew
              mockRecords={activeMocks}
              allFields={activeFields}
              M={M} A={A} fz={fz} pyV={pyV}
              viewState={recViewState} setViewState={setRecViewState}
              templates={recTpls} onSaveTemplate={onSaveRecTpl} onDeleteTemplate={onDeleteRecTpl}
              RecordsTab={RecordsTab}
              getFirstImg={getFirstImg}
            />
          ) : tab==="records" && (
            <RecordsTab
              allFields={activeFields}
              mockRecords={activeMocks}
              M={M} A={A} fz={fz} pyV={pyV}
              viewState={recViewState} setViewState={setRecViewState}
              templates={recTpls} onSaveTemplate={onSaveRecTpl} onDeleteTemplate={onDeleteRecTpl}
              ts={ts}
            />
          )}
          {tab==="entry" && (
            <DataEntryTab
              allFields={activeFields}
              sections={activeSections}
              views={views}
              activeViewId={activeV}
              onActivateView={setActiveV}
              onSaveView={v=>setViews(p=>[...p,v])}
              onDeleteView={id=>setViews(p=>p.filter(v=>v.id!==id))}
              formData={formData}
              onChange={handleField}
              errors={errors}
              M={M} A={A} fz={fz} pyV={pyV}
              onSave={handleSave}
              onClear={handleClear}
            />
          )}
          {tab==="bulk" && (
            <BulkEntryTab
              allFields={activeFields}
              M={M} A={A} fz={fz} pyV={pyV}
              rows={bulkRows} setRows={setBulkRows}
              viewState={bulkViewState} setViewState={setBulkViewState}
              templates={bulkTpls} onSaveTemplate={onSaveBulkTpl} onDeleteTemplate={onDeleteBulkTpl}
            />
          )}
          {tab==="specs" && (
            <FieldSpecsTab allFields={activeFields} M={M} A={A} fz={fz} pyV={pyV} />
          )}
        </div>
      </div>

      {/* ── Unsaved changes guard ── */}
      {guardModal && (() => {
        const isBulk = guardModal.type==="bulk";
        const dirtyBulkCount = bulkRows.filter(r=>r.__dirty||r.__new).length;
        return(
          <><div onClick={()=>setGuardModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",zIndex:1200}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:460,background:M.hi,border:"1px solid #fecaca",borderRadius:10,zIndex:1201,boxShadow:M.shadow,overflow:"hidden"}}>
            <div style={{background:"#dc2626",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>⚠️</span><div><div style={{color:"#fff",fontSize:13,fontWeight:900}}>Unsaved Changes</div>{isBulk&&<div style={{color:"rgba(255,255,255,.8)",fontSize:10}}>{dirtyBulkCount} row(s) with unsaved data in Bulk Entry</div>}</div></div>
            <div style={{padding:"18px 20px"}}>
              <div style={{fontSize:13,color:M.tA,fontWeight:700,marginBottom:14}}>{guardModal.action==="tab"?"Switching tabs will discard all unsaved data.":"Switching sub-modules will discard all unsaved data."}</div>
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,padding:"8px 12px",marginBottom:18}}><div style={{fontSize:10,color:"#991b1b",fontWeight:700}}>{isBulk?"💡 Fill mandatory fields (⚠) and click ✓ Save Changes first.":"💡 Click ✓ Save to Sheet first to commit your record."}</div></div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>setGuardModal(null)} style={{padding:"8px 18px",border:"1px solid "+M.inBd,borderRadius:5,background:M.inBg,color:M.tB,fontSize:11,fontWeight:800,cursor:"pointer"}}>← Stay & Keep Editing</button>
                <button onClick={guardDiscard} style={{padding:"8px 20px",border:"none",borderRadius:5,background:"#dc2626",color:"#fff",fontSize:11,fontWeight:900,cursor:"pointer"}}>🗑 Discard & Continue</button>
              </div>
            </div>
          </div></>
        );
      })()}

      {/* ── MIP + Allocation Popups (at top level for z-index) ── */}
      {mipPopup && <MIPPopup itemCode={mipPopup.itemCode} itemName={mipPopup.itemName} onClose={()=>setMipPopup(null)} M={M} A={A} />}
      {allocPopup && <AllocPopup itemCode={allocPopup.itemCode} itemName={allocPopup.itemName} onClose={()=>setAllocPopup(null)} M={M} A={A} />}
    </div>
  );
}
