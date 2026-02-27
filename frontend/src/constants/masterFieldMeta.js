/**
 * Optional enrichment metadata for key master schemas.
 * Merged by enrichSchema() with SCHEMA_MAP fields.
 *
 * Each entry:
 *   sections — groupings of fields (by SCHEMA_MAP key) for the accordion form view
 *   fields   — per-key metadata: ico, fk (FK target key), hint, fieldType, opts (dropdown key)
 *
 * Schemas without an entry here still work — they get a single "All Fields" section
 * and basic inferred types.
 */

export const FIELD_META = {

  // ═══════════════════════════════════════════════════════════════════════════
  //  ARTICLE MASTER — 26 fields
  // ═══════════════════════════════════════════════════════════════════════════
  article_master: {
    sections: [
      { id: "identity", icon: "📋", title: "Article Identity",  keys: ["code", "desc", "shortName", "imageLink", "sketchLink", "buyerStyle"] },
      { id: "details",  icon: "👕", title: "Item Details",      keys: ["l1Division", "l2Category", "season", "gender", "fitType", "neckline", "sleeveType"] },
      { id: "fabric",   icon: "🧵", title: "Fabric & Colors",   keys: ["mainFabric", "fabricName", "colorCodes", "sizeRange"] },
      { id: "pricing",  icon: "₹",  title: "Pricing & Tax",     keys: ["wsp", "mrp", "markupPct", "markdownPct", "hsnCode", "gstPct"] },
      { id: "status",   icon: "🏷️", title: "Status & Tags",     keys: ["status", "remarks", "tags"] },
    ],
    fields: {
      code:        { ico: "🔑", hint: "5249HP — 4-5 digits + 2 CAPS. No prefix.", fieldType: "manual" },
      desc:        { ico: "⚠",  hint: "Full article description. Max 120 chars." },
      shortName:   { ico: "—",  hint: "Max 25 chars. Used on barcodes." },
      imageLink:   { ico: "—",  hint: "Google Drive public image URL.", fieldType: "url" },
      sketchLink:  { ico: "⟷",  hint: "Pipe-separated Drive links." },
      buyerStyle:  { ico: "—",  hint: "Optional buyer reference number." },
      l1Division:  { ico: "←",  hint: "← Auto-filled: 'Apparel'. GAS reads ITEM_CATEGORIES.", fieldType: "auto" },
      l2Category:  { ico: "⚠",  fk: "item_categories", hint: "Controls L3 sub-categories. Mandatory.", fieldType: "fk" },
      season:      { ico: "—",  hint: "e.g. SS25, AW26, Year Round." },
      gender:      { ico: "⚠",  hint: "Men / Women / Kids / Unisex.", fieldType: "dropdown", opts: "gender" },
      fitType:     { ico: "—",  hint: "Regular / Slim / Relaxed / Oversized.", fieldType: "dropdown", opts: "fit" },
      neckline:    { ico: "—",  hint: "Round / V-Neck / Collar / Hooded.", fieldType: "dropdown", opts: "neckline" },
      sleeveType:  { ico: "—",  hint: "Half / Full / Sleeveless / 3/4.", fieldType: "dropdown", opts: "sleeve" },
      mainFabric:  { ico: "→",  fk: "rm_fabric", hint: "Stores fabric code e.g. RM-FAB-001.", fieldType: "fk" },
      fabricName:  { ico: "←",  hint: "← Auto from RM_MASTER_FABRIC.", fieldType: "auto" },
      colorCodes:  { ico: "⟷",  fk: "color_master", hint: "Multi-select. Comma-separated color codes.", fieldType: "multifk" },
      sizeRange:   { ico: "—",  hint: "Display: S-M-L-XL-XXL." },
      markupPct:   { ico: "∑",  hint: "∑ = (MRP−WSP)÷WSP×100. Auto-computed.", fieldType: "calc" },
      markdownPct: { ico: "∑",  hint: "∑ = (MRP−WSP)÷MRP×100. Auto-computed.", fieldType: "calc" },
      wsp:         { ico: "—",  hint: "Wholesale selling price ex-GST.", fieldType: "currency" },
      mrp:         { ico: "—",  hint: "Maximum retail price.", fieldType: "currency" },
      hsnCode:     { ico: "→",  fk: "hsn_master", hint: "4 or 8-digit HSN. Mandatory.", fieldType: "fk" },
      gstPct:      { ico: "←",  hint: "← Auto from HSN_MASTER.", fieldType: "auto" },
      status:      { ico: "⚠",  hint: "Active / Development / Inactive.", fieldType: "dropdown", opts: "status" },
      remarks:     { ico: "—",  hint: "Quality flags, buyer notes." },
      tags:        { ico: "⟷",  fk: "tag_master", hint: "Multi-select → TAG_MASTER.", fieldType: "multifk" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  RM FABRIC — 25 fields
  // ═══════════════════════════════════════════════════════════════════════════
  rm_fabric: {
    sections: [
      { id: "identity", icon: "📋", title: "Fabric Identity",   keys: ["code", "fabricSku", "knitName", "yarnComp", "yarnNames"] },
      { id: "props",    icon: "⚙️", title: "Fabric Properties",  keys: ["fabricType", "colour", "gsmMin", "gsmMax", "width", "uom"] },
      { id: "supply",   icon: "🏭", title: "Supplier & Costs",   keys: ["hsnCode", "gstPct", "primarySupp", "suppCode", "suppName", "season", "costPerUom", "moq"] },
      { id: "status",   icon: "🏷️", title: "Status & Logistics", keys: ["leadTime", "reorderLevel", "status", "remarks", "finCost", "tags"] },
    ],
    fields: {
      code:         { ico: "#",  hint: "GAS generates RM-FAB-001. LOCKED.", fieldType: "autocode" },
      fabricSku:    { ico: "∑",  hint: "∑ GAS builds: Knit Name + Yarn Composition.", fieldType: "calc" },
      knitName:     { ico: "→",  fk: "fabric_type_master", hint: "FK → FABRIC_TYPE_MASTER. SJ/PIQ/FLC etc.", fieldType: "fk" },
      yarnComp:     { ico: "⟷",  fk: "rm_yarn", hint: "Multi-select yarn codes.", fieldType: "multifk" },
      yarnNames:    { ico: "←",  hint: "← Auto from RM_MASTER_YARN.", fieldType: "auto" },
      fabricType:   { ico: "⚠",  hint: "KORA / FINISHED.", fieldType: "dropdown", opts: "fabricType" },
      colour:       { ico: "—",  hint: "KORA / COLOURED / DYED / MÉLANGE.", fieldType: "dropdown", opts: "fabricColour" },
      gsmMin:       { ico: "—",  hint: "Grams per sq metre (min)." },
      gsmMax:       { ico: "—",  hint: "Grams per sq metre (max)." },
      width:        { ico: "—",  hint: "Width in inches. e.g. 60, 72.5." },
      uom:          { ico: "→",  fk: "uom_master", hint: "MTR / KG / YRD. Mandatory.", fieldType: "fk" },
      hsnCode:      { ico: "→",  fk: "hsn_master", hint: "e.g. 6006 for knit fabric.", fieldType: "fk" },
      gstPct:       { ico: "←",  hint: "← Auto from HSN_MASTER.", fieldType: "auto" },
      primarySupp:  { ico: "→",  fk: "supplier_master_1c", hint: "SUP-NNN.", fieldType: "fk" },
      suppCode:     { ico: "—",  hint: "Supplier code." },
      suppName:     { ico: "←",  hint: "← Auto from SUPPLIER_MASTER.", fieldType: "auto" },
      season:       { ico: "—",  hint: "Season: SS25, AW26." },
      costPerUom:   { ico: "—",  hint: "Average purchase cost ex-GST.", fieldType: "currency" },
      moq:          { ico: "—",  hint: "Minimum order quantity." },
      leadTime:     { ico: "—",  hint: "Days from order to delivery." },
      reorderLevel: { ico: "—",  hint: "Min stock before reorder trigger." },
      status:       { ico: "⚠",  hint: "Active / Development / Inactive.", fieldType: "dropdown", opts: "status" },
      remarks:      { ico: "—",  hint: "Supplier notes, quality flags." },
      finCost:      { ico: "←",  hint: "← Phase 3. Blank until Fabric Cost Sheet built.", fieldType: "auto" },
      tags:         { ico: "⟷",  fk: "tag_master", hint: "Two-way tag sync.", fieldType: "multifk" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  RM YARN — 15 fields
  // ═══════════════════════════════════════════════════════════════════════════
  rm_yarn: {
    sections: [
      { id: "identity", icon: "📋", title: "Yarn Identity",     keys: ["code", "name", "colourType", "colour"] },
      { id: "tax",      icon: "🏷️", title: "Tax & Supplier",    keys: ["hsnCode", "gstPct", "suppCode", "primarySupp", "suppName"] },
      { id: "costs",    icon: "₹",  title: "Costs & Status",    keys: ["season", "avgCost", "gstForCost", "totalCost", "status", "remarks"] },
    ],
    fields: {
      code:        { ico: "#",  hint: "GAS generates RM-YRN-001. LOCKED.", fieldType: "autocode" },
      name:        { ico: "⚠",  hint: "e.g. '30s Cotton Ring Spun Raw White'." },
      colourType:  { ico: "—",  hint: "Raw White / Dyed / Mélange / Grindle.", fieldType: "dropdown", opts: "yarnColourType" },
      colour:      { ico: "—",  hint: "Only fill when Colour Type = Dyed." },
      hsnCode:     { ico: "→",  fk: "hsn_master", hint: "e.g. 5205 for cotton yarn.", fieldType: "fk" },
      gstPct:      { ico: "←",  hint: "← Auto from HSN_MASTER.", fieldType: "auto" },
      suppCode:    { ico: "→",  fk: "supplier_master_1c", hint: "Primary yarn supplier SUP-NNN.", fieldType: "fk" },
      primarySupp: { ico: "←",  hint: "← Auto from SUPPLIER_MASTER.", fieldType: "auto" },
      suppName:    { ico: "←",  hint: "← Auto from SUPPLIER_MASTER.", fieldType: "auto" },
      season:      { ico: "—",  hint: "Season: SS25, AW26." },
      avgCost:     { ico: "—",  hint: "₹ per KG.", fieldType: "currency" },
      gstForCost:  { ico: "←",  hint: "← Auto from HSN_MASTER.", fieldType: "auto" },
      totalCost:   { ico: "∑",  hint: "∑ = Avg Cost × (1+GST%/100). NEVER type.", fieldType: "calc" },
      status:      { ico: "⚠",  hint: "Active / Inactive.", fieldType: "dropdown", opts: "status" },
      remarks:     { ico: "—",  hint: "Blend info, spinner details." },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  TRIM MASTER — 17 fields
  // ═══════════════════════════════════════════════════════════════════════════
  trim_master: {
    sections: [
      { id: "identity", icon: "📋", title: "Trim Identity",   keys: ["code", "parentCode", "name", "category", "subCat", "imageLink"] },
      { id: "supply",   icon: "🏭", title: "Supply & Tax",     keys: ["colourCode", "colourName", "uom", "hsnCode", "gstPct", "primarySupp", "suppCode", "leadTime", "reorderLevel"] },
      { id: "status",   icon: "🏷️", title: "Status",           keys: ["status", "remarks"] },
    ],
    fields: {
      code:        { ico: "#",  hint: "GAS generates TRM-THD-001. LOCKED.", fieldType: "autocode" },
      parentCode:  { ico: "→",  fk: "trim_master", hint: "FK self — variant system. Base item = blank.", fieldType: "fk" },
      name:        { ico: "⚠",  hint: "Full name e.g. '30s Poly Thread Black'." },
      category:    { ico: "⚠",  hint: "THD/LBL/ELS/ZIP/BUT/TPE/DRW/VLC/RVT/THP/OTH.", fieldType: "dropdown", opts: "trimCat" },
      subCat:      { ico: "—",  hint: "Optional sub-classification." },
      imageLink:   { ico: "—",  hint: "Google Drive image URL.", fieldType: "url" },
      colourCode:  { ico: "→",  fk: "color_master", hint: "FK → COLOR_MASTER. Stores CLR-NNN.", fieldType: "fk" },
      colourName:  { ico: "←",  hint: "← Auto from COLOR_MASTER.", fieldType: "auto" },
      uom:         { ico: "⚠",  hint: "CONE/MTR/PCS/KG/SET/ROLL.", fieldType: "dropdown", opts: "trimUom" },
      hsnCode:     { ico: "→",  fk: "hsn_master", hint: "Mandatory.", fieldType: "fk" },
      gstPct:      { ico: "←",  hint: "← Auto from HSN_MASTER.", fieldType: "auto" },
      primarySupp: { ico: "→",  fk: "supplier_master_1c", hint: "Primary supplier code.", fieldType: "fk" },
      suppCode:    { ico: "—",  hint: "Raw supplier reference code." },
      leadTime:    { ico: "—",  hint: "Days from PO to delivery." },
      reorderLevel:{ ico: "—",  hint: "Min stock before reorder trigger." },
      status:      { ico: "⚠",  hint: "Active / Inactive.", fieldType: "dropdown", opts: "status" },
      remarks:     { ico: "—",  hint: "Free text notes." },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONSUMABLE MASTER — 14 fields
  // ═══════════════════════════════════════════════════════════════════════════
  consumable_master: {
    sections: [
      { id: "identity", icon: "📋", title: "Consumable Identity", keys: ["code", "parentCode", "name", "category", "subCat"] },
      { id: "supply",   icon: "🏭", title: "Supply & Tax",         keys: ["uom", "hsnCode", "gstPct", "primarySupp", "suppName", "costPerUom", "reorderLevel"] },
      { id: "status",   icon: "🏷️", title: "Status",               keys: ["status", "remarks"] },
    ],
    fields: {
      code:        { ico: "#",  hint: "GAS generates CON-DYE-001. LOCKED.", fieldType: "autocode" },
      parentCode:  { ico: "→",  hint: "Parent code for variant linking." },
      name:        { ico: "⚠",  hint: "e.g. 'Reactive Black Dye B200'." },
      category:    { ico: "⚠",  hint: "DYE/CHM/NDL/OIL/PKG/OTH.", fieldType: "dropdown", opts: "consumableCat" },
      subCat:      { ico: "—",  hint: "Free-text sub-classification." },
      uom:         { ico: "→",  fk: "uom_master", hint: "KG/LTR/PCS/BOX.", fieldType: "fk" },
      hsnCode:     { ico: "→",  fk: "hsn_master", hint: "Mandatory.", fieldType: "fk" },
      gstPct:      { ico: "←",  hint: "← Auto from HSN_MASTER.", fieldType: "auto" },
      primarySupp: { ico: "→",  fk: "supplier_master_1c", hint: "Primary supplier.", fieldType: "fk" },
      suppName:    { ico: "←",  hint: "← Auto from SUPPLIER_MASTER.", fieldType: "auto" },
      costPerUom:  { ico: "—",  hint: "Cost per unit.", fieldType: "currency" },
      reorderLevel:{ ico: "—",  hint: "Min stock threshold." },
      status:      { ico: "⚠",  hint: "Active / Inactive.", fieldType: "dropdown", opts: "status" },
      remarks:     { ico: "—",  hint: "Free text notes." },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  PACKAGING MASTER — 14 fields
  // ═══════════════════════════════════════════════════════════════════════════
  packaging_master: {
    sections: [
      { id: "identity", icon: "📋", title: "Packaging Identity", keys: ["code", "parentCode", "name", "category", "subCat"] },
      { id: "supply",   icon: "🏭", title: "Supply & Tax",        keys: ["uom", "hsnCode", "gstPct", "primarySupp", "suppName", "costPerUom", "reorderLevel"] },
      { id: "status",   icon: "🏷️", title: "Status",              keys: ["status", "remarks"] },
    ],
    fields: {
      code:        { ico: "#",  hint: "GAS generates PKG-PLY-001. LOCKED.", fieldType: "autocode" },
      parentCode:  { ico: "→",  hint: "Parent code for variant linking." },
      name:        { ico: "⚠",  hint: "Full name." },
      category:    { ico: "⚠",  hint: "PLY/CTN/HGR/TKT/STK/OTH.", fieldType: "dropdown", opts: "packagingCat" },
      subCat:      { ico: "—",  hint: "Sub-classification." },
      uom:         { ico: "→",  fk: "uom_master", hint: "PCS/BOX/CTN/ROLL.", fieldType: "fk" },
      hsnCode:     { ico: "→",  fk: "hsn_master", hint: "Mandatory.", fieldType: "fk" },
      gstPct:      { ico: "←",  hint: "← Auto from HSN_MASTER.", fieldType: "auto" },
      primarySupp: { ico: "→",  fk: "supplier_master_1c", hint: "Primary supplier code.", fieldType: "fk" },
      suppName:    { ico: "←",  hint: "← Auto from SUPPLIER_MASTER.", fieldType: "auto" },
      costPerUom:  { ico: "—",  hint: "Cost per unit.", fieldType: "currency" },
      reorderLevel:{ ico: "—",  hint: "Min stock threshold." },
      status:      { ico: "⚠",  hint: "Active / Inactive.", fieldType: "dropdown", opts: "status" },
      remarks:     { ico: "—",  hint: "Free text." },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  COLOR MASTER — 7 fields
  // ═══════════════════════════════════════════════════════════════════════════
  color_master: {
    sections: [
      { id: "all", icon: "🎨", title: "Color Details", keys: ["code", "name", "pantone", "hex", "swatch", "family", "active"] },
    ],
    fields: {
      code:    { ico: "🔑", hint: "CLR-001 sequential or Pantone code. Unique.", fieldType: "manual" },
      name:    { ico: "⚠",  hint: "Standard name. BE CONSISTENT across all masters." },
      pantone: { ico: "—",  hint: "e.g. PMS 185 C. Optional." },
      hex:     { ico: "—",  hint: "6-digit hex e.g. #FF0000." },
      swatch:  { ico: "←",  hint: "← GAS applyColorSwatch(). Cell bg = Hex Code.", fieldType: "auto" },
      family:  { ico: "—",  hint: "Blues/Reds/Neutrals/Whites/Blacks.", fieldType: "dropdown", opts: "colorFamily" },
      active:  { ico: "—",  hint: "Yes / No.", fieldType: "dropdown", opts: "yesNo" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  HSN MASTER — 5 fields
  // ═══════════════════════════════════════════════════════════════════════════
  hsn_master: {
    sections: [
      { id: "all", icon: "🏷️", title: "HSN Details", keys: ["code", "desc", "gstPct", "category", "active"] },
    ],
    fields: {
      code:     { ico: "🔑", hint: "4 or 8-digit HSN e.g. 6105, 5205. Unique.", fieldType: "manual" },
      desc:     { ico: "⚠",  hint: "Official HSN description from GST tariff." },
      gstPct:   { ico: "—",  hint: "Total GST rate e.g. 5, 12, 18." },
      category: { ico: "—",  hint: "HSN category." },
      active:   { ico: "—",  hint: "Yes / No.", fieldType: "dropdown", opts: "yesNo" },
    },
  },
};
