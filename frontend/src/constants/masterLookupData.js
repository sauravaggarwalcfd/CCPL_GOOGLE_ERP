/**
 * Master FK lookup data + dropdown options.
 * Mirrors the data from CC_ERP_MasterDataEntry.jsx for use in the dashboard.
 * At runtime, GAS replaces these via getSheetMeta().
 *
 * V10: item_categories split into level-specific FK keys per master
 *      to prevent mixed L1/L2/L3 data in dropdowns.
 */

// ── FK Lookup Tables ──────────────────────────────────────────────────────────
export const FK_DATA = {
  // ─ Article L1/L2/L3 — separate FK keys for each level ─
  article_l1: [
    { v: "Men's Apparel",   l: "👔 Men's Apparel" },
    { v: "Women's Apparel", l: "👗 Women's Apparel" },
    { v: "Kids Apparel",    l: "🧒 Kids Apparel" },
    { v: "Unisex Apparel",  l: "👕 Unisex Apparel" },
  ],
  article_l2: [
    { v: "Tops - Polo", l: "Tops - Polo" },
    { v: "Tops - Tee",  l: "Tops - Tee" },
    { v: "Sweatshirt",  l: "Sweatshirt" },
    { v: "Tracksuit",   l: "Tracksuit" },
    { v: "Bottoms",     l: "Bottoms" },
  ],
  article_l3: [
    { v: "Pique Polo",            l: "Pique Polo" },
    { v: "Autostriper Polo",      l: "Autostriper Polo" },
    { v: "Jacquard Polo",         l: "Jacquard Polo" },
    { v: "Round Neck Tee",        l: "Round Neck Tee" },
    { v: "V-Neck Tee",            l: "V-Neck Tee" },
    { v: "Henley Tee",            l: "Henley Tee" },
    { v: "Crop Top",              l: "Crop Top" },
    { v: "Oversized Tee",         l: "Oversized Tee" },
    { v: "Hoodie",                l: "Hoodie" },
    { v: "Crew Neck Sweatshirt",  l: "Crew Neck Sweatshirt" },
    { v: "Quarter Zip",           l: "Quarter Zip" },
    { v: "Full Tracksuit",        l: "Full Tracksuit" },
    { v: "Track Jacket",          l: "Track Jacket" },
    { v: "Track Pant",            l: "Track Pant" },
    { v: "Jogger",                l: "Jogger" },
    { v: "Shorts",                l: "Shorts" },
  ],
  // Legacy alias — kept for backwards compat
  item_categories: [
    { v: "Men's Apparel",   l: "👔 Men's Apparel" },
    { v: "Women's Apparel", l: "👗 Women's Apparel" },
    { v: "Kids Apparel",    l: "🧒 Kids Apparel" },
    { v: "Unisex Apparel",  l: "👕 Unisex Apparel" },
  ],
  rm_fabric: [
    { v: "RM-FAB-001", l: "RM-FAB-001 — SJ 180GSM Cotton" },
    { v: "RM-FAB-002", l: "RM-FAB-002 — PIQ 220GSM Cotton" },
    { v: "RM-FAB-003", l: "RM-FAB-003 — Fleece 280GSM" },
    { v: "RM-FAB-004", l: "RM-FAB-004 — French Terry 240GSM" },
  ],
  rm_yarn: [
    { v: "30s Cotton Ring Spun", l: "30s Cotton Ring Spun — RM-YRN-001" },
    { v: "40s Combed Cotton", l: "40s Combed Cotton — RM-YRN-002" },
  ],
  hsn_master: [
    { v: "6105", l: "6105 — Tops - Polo", gst: 5 },
    { v: "6109", l: "6109 — Tops - Tee", gst: 5 },
    { v: "6110", l: "6110 — Sweatshirt", gst: 12 },
    { v: "6112", l: "6112 — Tracksuit", gst: 12 },
    { v: "6103", l: "6103 — Bottoms", gst: 5 },
    { v: "6006", l: "6006 — Knit Fabric", gst: 5 },
    { v: "5205", l: "5205 — Cotton Yarn", gst: 5 },
  ],
  color_master: [
    { v: "CLR-001", l: "CLR-001 — Navy Blue" },
    { v: "CLR-002", l: "CLR-002 — White" },
    { v: "CLR-003", l: "CLR-003 — Black" },
    { v: "CLR-004", l: "CLR-004 — Charcoal Grey" },
  ],
  supplier_master_1c: [
    { v: "SUP-001", l: "SUP-001 — Rajinder Fabrics, Ludhiana" },
    { v: "SUP-002", l: "SUP-002 — Punjab Yarn House" },
    { v: "SUP-003", l: "SUP-003 — Tiruppur Knits Co." },
  ],
  tag_master: [
    { v: "TAG-001", l: "New Arrival" },
    { v: "TAG-002", l: "Best Seller" },
    { v: "TAG-003", l: "Export Quality" },
    { v: "TAG-004", l: "SS25 Collection" },
  ],
  uom_master: [
    { v: "MTR",  l: "MTR — Metre" },
    { v: "KG",   l: "KG — Kilogram" },
    { v: "PCS",  l: "PCS — Pieces" },
    { v: "CONE", l: "CONE — Cone" },
    { v: "ROLL", l: "ROLL — Roll" },
    { v: "BOX",  l: "BOX — Box" },
    { v: "CTN",  l: "CTN — Carton" },
  ],
  fabric_type_master: [
    { v: "SJ",  l: "SJ — Single Jersey" },
    { v: "PIQ", l: "PIQ — Piqué" },
    { v: "FLC", l: "FLC — Fleece" },
    { v: "FT",  l: "FT — French Terry" },
    { v: "RIB", l: "RIB — Rib" },
  ],
  trim_master: [
    { v: "TRM-THD-001", l: "TRM-THD-001 — 30s Poly Thread Black" },
  ],
  con_attr_values: [
    { v: "Reactive", l: "Reactive" },
    { v: "Vat",      l: "Vat" },
    { v: "Softener", l: "Softener" },
    { v: "Size 10",  l: "Size 10" },
    { v: "Size 12",  l: "Size 12" },
  ],
  pkg_attr_values: [
    { v: '4"x6"',       l: '4"x6"' },
    { v: '6"x8"',       l: '6"x8"' },
    { v: "Matte",        l: "Matte" },
    { v: "Gloss",        l: "Gloss" },
    { v: "Single Wall",  l: "Single Wall" },
  ],
  trim_attr_values: [
    { v: "Fine",   l: "Fine" },
    { v: "Coarse", l: "Coarse" },
    { v: "70D",    l: "70D" },
    { v: "150D",   l: "150D" },
    { v: "Metal",  l: "Metal" },
    { v: "Nylon",  l: "Nylon" },
  ],
};

// ── Dropdown Option Sets ──────────────────────────────────────────────────────
export const DROPDOWN_OPTS = {
  gender:    [{ v: "Men", l: "Men" }, { v: "Women", l: "Women" }, { v: "Kids", l: "Kids" }, { v: "Unisex", l: "Unisex" }],
  fit:       [{ v: "Regular", l: "Regular" }, { v: "Slim", l: "Slim" }, { v: "Relaxed", l: "Relaxed" }, { v: "Oversized", l: "Oversized" }, { v: "Athletic", l: "Athletic" }, { v: "Crop", l: "Crop" }],
  neckline:  [{ v: "Round Neck", l: "Round Neck" }, { v: "V-Neck", l: "V-Neck" }, { v: "Polo", l: "Polo" }, { v: "Henley", l: "Henley" }, { v: "Hood", l: "Hood" }, { v: "Crew Neck", l: "Crew Neck" }, { v: "Quarter Zip", l: "Quarter Zip" }, { v: "Mock Neck", l: "Mock Neck" }],
  sleeve:    [{ v: "Half Sleeve", l: "Half Sleeve" }, { v: "Full Sleeve", l: "Full Sleeve" }, { v: "Sleeveless", l: "Sleeveless" }, { v: "Cap Sleeve", l: "Cap Sleeve" }, { v: "3/4 Sleeve", l: "3/4 Sleeve" }, { v: "Raglan", l: "Raglan" }],
  status:    [{ v: "Active", l: "Active" }, { v: "Inactive", l: "Inactive" }, { v: "Development", l: "Development" }, { v: "Discontinued", l: "Discontinued" }],
  season:    [{ v: "SS2024", l: "SS2024" }, { v: "AW2024", l: "AW2024" }, { v: "SS2025", l: "SS2025" }, { v: "AW2025", l: "AW2025" }, { v: "SS2026", l: "SS2026" }, { v: "AW2026", l: "AW2026" }, { v: "Year Round", l: "Year Round" }],
  fabricType:[{ v: "KORA", l: "KORA" }, { v: "FINISHED", l: "FINISHED" }],
  fabricColour: [{ v: "KORA", l: "KORA" }, { v: "COLOURED", l: "COLOURED" }, { v: "DYED", l: "DYED" }, { v: "MÉLANGE", l: "MÉLANGE" }],
  stretch:   [{ v: "Very High", l: "Very High" }, { v: "High", l: "High" }, { v: "Medium", l: "Medium" }, { v: "Low", l: "Low" }, { v: "None", l: "None" }],
  colorFamily: [{ v: "Blues", l: "Blues" }, { v: "Reds", l: "Reds" }, { v: "Neutrals", l: "Neutrals" }, { v: "Whites", l: "Whites" }, { v: "Blacks", l: "Blacks" }],
  yarnColourType: [{ v: "Raw White", l: "Raw White" }, { v: "Dyed", l: "Dyed" }, { v: "Mélange", l: "Mélange" }, { v: "Grindle", l: "Grindle" }],
  consumableCat: [{ v: "DYE", l: "DYE — Dye" }, { v: "CHM", l: "CHM — Chemical" }, { v: "NDL", l: "NDL — Needle" }, { v: "OIL", l: "OIL" }, { v: "PKG", l: "PKG" }, { v: "OTH", l: "OTH — Other" }],
  packagingCat:  [{ v: "PLY", l: "PLY — Polybag" }, { v: "CTN", l: "CTN — Carton" }, { v: "HGR", l: "HGR — Hanger" }, { v: "TKT", l: "TKT — Ticket/Tag" }, { v: "STK", l: "STK — Sticker" }, { v: "OTH", l: "OTH — Other" }],
  trimCat:       [{ v: "THD", l: "THD — Thread" }, { v: "LBL", l: "LBL — Label" }, { v: "ELS", l: "ELS — Elastic" }, { v: "ZIP", l: "ZIP — Zipper" }, { v: "BUT", l: "BUT — Button" }, { v: "TPE", l: "TPE — Tape" }, { v: "DRW", l: "DRW — Drawstring" }, { v: "VLC", l: "VLC — Velcro" }, { v: "RVT", l: "RVT — Rivet" }, { v: "THP", l: "THP — Thermal Print" }, { v: "OTH", l: "OTH — Other" }],
  trimUom:       [{ v: "CONE", l: "CONE" }, { v: "MTR", l: "MTR" }, { v: "PCS", l: "PCS" }, { v: "KG", l: "KG" }, { v: "SET", l: "SET" }, { v: "ROLL", l: "ROLL" }],
  colorNames:    [{ v: "Navy Blue", l: "Navy Blue" }, { v: "White", l: "White" }, { v: "Black", l: "Black" }, { v: "Charcoal Grey", l: "Charcoal Grey" }, { v: "Red", l: "Red" }, { v: "Royal Blue", l: "Royal Blue" }, { v: "Olive Green", l: "Olive Green" }, { v: "Maroon", l: "Maroon" }, { v: "Bottle Green", l: "Bottle Green" }, { v: "Sky Blue", l: "Sky Blue" }, { v: "Yellow", l: "Yellow" }, { v: "Pink", l: "Pink" }, { v: "Orange", l: "Orange" }, { v: "Beige", l: "Beige" }, { v: "Cream", l: "Cream" }, { v: "Grey Melange", l: "Grey Melange" }],
  sizeRange:     [{ v: "S-M-L-XL-XXL", l: "S-M-L-XL-XXL" }, { v: "S-M-L-XL", l: "S-M-L-XL" }, { v: "M-L-XL-XXL", l: "M-L-XL-XXL" }, { v: "XS-S-M-L-XL", l: "XS-S-M-L-XL" }, { v: "S-M-L", l: "S-M-L" }, { v: "M-L-XL-XXL-3XL", l: "M-L-XL-XXL-3XL" }, { v: "Free Size", l: "Free Size" }, { v: "XS-S-M-L-XL-XXL-3XL", l: "XS-S-M-L-XL-XXL-3XL" }],
  yesNo:         [{ v: "Yes", l: "Yes" }, { v: "No", l: "No" }],
};
