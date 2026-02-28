/**
 * Master sheet schemas — defines exact columns for each sheet.
 *
 * Each field:
 *   key      — JS key (used in API data objects)
 *   header   — exact Google Sheet column header
 *   label    — short label for table / form
 *   w        — grid column width for table
 *   auto     — true = auto-calculated, readonly in form
 *   hidden   — true = don't show in table (still in form for context)
 *   mono     — true = monospace font in table
 *   badge    — true = render as status badge
 *   required — true = required field marker
 *   type     — "text" | "select" | "date" | "number" | "textarea"
 *   options  — for select type
 */

// ─── FILE 1A — Items ─────────────────────────────────────────────────────────

export const SCHEMA_ARTICLE_MASTER = [
  { key:"code",       header:"🔑 Article Code",         label:"Article Code",  w:"130px", mono:true, auto:true },
  { key:"desc",       header:"Article Description",     label:"Description",   w:"1fr",   required:true },
  { key:"shortName",  header:"Short Name",              label:"Short Name",    w:"110px" },
  { key:"imageLink",  header:"IMAGE LINK",              label:"Image Link",    w:"0",     hidden:true },
  { key:"sketchLink", header:"⟷ SKETCH DRIVE LINKS",   label:"Sketch Link",   w:"0",     hidden:true },
  { key:"buyerStyle", header:"Buyer Style No",          label:"Buyer Style",   w:"110px" },
  { key:"l1Division", header:"L1 Division",             label:"Division",      w:"100px" },
  { key:"l2Category", header:"L2 Product Category",     label:"Category",      w:"120px" },
  { key:"season",     header:"Season",                  label:"Season",        w:"80px" },
  { key:"gender",     header:"Gender",                  label:"Gender",        w:"70px",  type:"select", options:["Men","Women","Unisex","Kids"] },
  { key:"fitType",    header:"Fit Type",                label:"Fit",           w:"80px" },
  { key:"neckline",   header:"Neckline",                label:"Neckline",      w:"80px" },
  { key:"sleeveType", header:"Sleeve Type",             label:"Sleeve",        w:"80px" },
  { key:"mainFabric", header:"→ MAIN FABRIC USED",      label:"Main Fabric",   w:"120px" },
  { key:"fabricName", header:"← Fabric Name (Auto)",    label:"Fabric Name",   w:"0",     hidden:true, auto:true },
  { key:"colorCodes", header:"Color Code(s)",           label:"Colors",        w:"100px" },
  { key:"sizeRange",  header:"Size Range",              label:"Sizes",         w:"90px" },
  { key:"markupPct",  header:"∑ FINAL MARKUP %",        label:"Markup %",      w:"80px",  type:"number", auto:true },
  { key:"markdownPct",header:"∑ FINAL MARKDOWN %",      label:"Markdown %",    w:"80px",  type:"number", auto:true },
  { key:"wsp",        header:"W.S.P (Rs)",              label:"WSP ₹",         w:"80px",  type:"number" },
  { key:"mrp",        header:"MRP (Rs)",                label:"MRP ₹",         w:"80px",  type:"number" },
  { key:"hsnCode",    header:"→ HSN Code",              label:"HSN",           w:"80px" },
  { key:"gstPct",     header:"← GST % (Auto)",          label:"GST %",         w:"60px",  auto:true },
  { key:"status",     header:"Status",                  label:"Status",        w:"90px",  badge:true, type:"select", options:["Active","Development","Inactive"] },
  { key:"remarks",    header:"Remarks",                 label:"Remarks",       w:"0",     hidden:true, type:"textarea" },
  { key:"tags",       header:"⟷ Tags",                  label:"Tags",          w:"100px" },
];

export const SCHEMA_RM_FABRIC = [
  { key:"code",         header:"# RM Code",              label:"RM Code",       w:"120px", mono:true, auto:true },
  { key:"fabricSku",    header:"∑ FINAL FABRIC SKU",     label:"Fabric SKU",    w:"130px", auto:true },
  { key:"knitName",     header:"KNIT NAME / STRUCTURE",  label:"Knit Name",     w:"1fr",   required:true },
  { key:"yarnComp",     header:"⟷ YARN COMPOSITION",     label:"Yarn Comp",     w:"120px" },
  { key:"yarnNames",    header:"← Yarn Names (Auto)",    label:"Yarn Names",    w:"0",     hidden:true, auto:true },
  { key:"fabricType",   header:"FABRIC TYPE",            label:"Type",          w:"80px" },
  { key:"colour",       header:"COLOUR",                 label:"Colour",        w:"80px" },
  { key:"gsmMin",       header:"GSM (Min)",              label:"GSM Min",       w:"70px",  type:"number" },
  { key:"gsmMax",       header:"GSM (Max)",              label:"GSM Max",       w:"70px",  type:"number" },
  { key:"width",        header:"Width (inches)",         label:"Width″",        w:"70px",  type:"number" },
  { key:"uom",          header:"UOM",                    label:"UOM",           w:"60px" },
  { key:"hsnCode",      header:"→ HSN Code",             label:"HSN",           w:"70px" },
  { key:"gstPct",       header:"← GST % (Auto)",         label:"GST %",         w:"60px",  auto:true },
  { key:"primarySupp",  header:"→ Primary Supplier",     label:"Supplier",      w:"100px" },
  { key:"suppCode",     header:"Supplier Code",          label:"Supp Code",     w:"0",     hidden:true },
  { key:"suppName",     header:"← Supplier Name (Auto)", label:"Supp Name",     w:"0",     hidden:true, auto:true },
  { key:"leadTime",     header:"Lead Time (Days)",       label:"Lead Days",     w:"70px",  type:"number" },
  { key:"reorderLevel", header:"Reorder Level",          label:"Reorder",       w:"70px",  type:"number" },
  { key:"moq",          header:"Min Order Qty",          label:"MOQ",           w:"60px",  type:"number" },
  { key:"costPerUom",   header:"Cost per UOM",           label:"Cost/UOM",      w:"80px",  type:"number" },
  { key:"season",       header:"Season",                 label:"Season",        w:"70px" },
  { key:"status",       header:"Status",                 label:"Status",        w:"80px",  badge:true, type:"select", options:["Active","Development","Inactive"] },
  { key:"remarks",      header:"Remarks",                label:"Remarks",       w:"0",     hidden:true, type:"textarea" },
  { key:"finCost",      header:"← FINISHED FABRIC COST (Auto)", label:"Fin. Cost", w:"0", hidden:true, auto:true },
  { key:"tags",         header:"⟷ Tags",                 label:"Tags",          w:"80px" },
];

export const SCHEMA_RM_YARN = [
  { key:"code",       header:"# RM Code",           label:"RM Code",      w:"120px", mono:true, auto:true },
  { key:"name",       header:"Yarn Name",           label:"Yarn Name",    w:"1fr",   required:true },
  { key:"colourType", header:"Colour Type",         label:"Colour Type",  w:"100px" },
  { key:"colour",     header:"Colour (if dyed)",    label:"Colour",       w:"90px" },
  { key:"hsnCode",    header:"→ HSN Code",          label:"HSN",          w:"80px" },
  { key:"gstPct",     header:"← GST % (Auto)",      label:"GST %",        w:"60px",  auto:true },
  { key:"suppCode",   header:"→ Supplier Code",     label:"Supplier",     w:"100px" },
  { key:"primarySupp",header:"← Primary Supplier",  label:"Primary Supp", w:"0",     hidden:true, auto:true },
  { key:"suppName",   header:"← Supplier Name (Auto)", label:"Supp Name", w:"0",    hidden:true, auto:true },
  { key:"season",     header:"Season for Cost",     label:"Season",       w:"80px" },
  { key:"avgCost",    header:"Avg Cost (excl GST)", label:"Cost",         w:"80px",  type:"number" },
  { key:"gstForCost", header:"GST % for Cost",      label:"GST Cost%",    w:"70px",  type:"number" },
  { key:"totalCost",  header:"∑ Total Cost (incl GST)", label:"Total",    w:"80px",  auto:true },
  { key:"status",     header:"Status",              label:"Status",       w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"remarks",    header:"Remarks",             label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_TRIM_MASTER = [
  { key:"code",       header:"# TRM Code",           label:"Trim Code",    w:"120px", mono:true, auto:true },
  { key:"parentCode", header:"Parent Code",           label:"Parent",       w:"100px" },
  { key:"name",       header:"⚠ Trim Name",           label:"Trim Name",    w:"1fr",   required:true },
  { key:"category",   header:"⚠ Trim Category",       label:"Category",     w:"100px", required:true },
  { key:"subCat",     header:"Trim Sub-Category",     label:"Sub-Cat",      w:"90px" },
  { key:"imageLink",  header:"IMAGE LINK",            label:"Image",        w:"0",     hidden:true },
  { key:"colourCode", header:"→ COLOUR CODE",          label:"Colour",       w:"80px" },
  { key:"colourName", header:"← Color/Shade Name (Auto)", label:"Shade",   w:"0",     hidden:true, auto:true },
  { key:"uom",        header:"UOM",                   label:"UOM",          w:"60px" },
  { key:"hsnCode",    header:"→ HSN Code",             label:"HSN",          w:"70px" },
  { key:"gstPct",     header:"← GST % (Auto)",         label:"GST %",        w:"60px",  auto:true },
  { key:"primarySupp",header:"→ Primary Supplier",     label:"Supplier",     w:"100px" },
  { key:"suppCode",   header:"Supplier Code",          label:"Supp Code",    w:"0",     hidden:true },
  { key:"leadTime",   header:"Lead Time (Days)",       label:"Lead Days",    w:"70px",  type:"number" },
  { key:"reorderLevel",header:"Reorder Level",          label:"Reorder",      w:"70px",  type:"number" },
  { key:"status",     header:"Status",                 label:"Status",       w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"remarks",    header:"Remarks",                label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_CONSUMABLE_MASTER = [
  { key:"code",        header:"# CON Code",            label:"CON Code",     w:"120px", mono:true, auto:true },
  { key:"parentCode",  header:"Parent Code",           label:"Parent",       w:"100px" },
  { key:"name",        header:"⚠ Consumable Name",     label:"Name",         w:"1fr",   required:true },
  { key:"category",    header:"⚠ Category",             label:"Category",     w:"100px", required:true },
  { key:"subCat",      header:"Sub-Category",          label:"Sub-Cat",      w:"90px" },
  { key:"uom",         header:"UOM",                   label:"UOM",          w:"60px" },
  { key:"hsnCode",     header:"→ HSN Code",             label:"HSN",          w:"70px" },
  { key:"gstPct",      header:"← GST % (Auto)",         label:"GST %",        w:"60px",  auto:true },
  { key:"primarySupp", header:"→ Primary Supplier",     label:"Supplier",     w:"100px" },
  { key:"suppName",    header:"← Supplier Name (Auto)", label:"Supp Name",   w:"0",     hidden:true, auto:true },
  { key:"costPerUom",  header:"Cost per UOM",           label:"Cost/UOM",     w:"80px",  type:"number" },
  { key:"reorderLevel",header:"Reorder Level",           label:"Reorder",      w:"70px",  type:"number" },
  { key:"status",      header:"Status",                 label:"Status",       w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"remarks",     header:"Remarks",                label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_PACKAGING_MASTER = [
  { key:"code",        header:"# PKG Code",            label:"PKG Code",     w:"120px", mono:true, auto:true },
  { key:"parentCode",  header:"Parent Code",           label:"Parent",       w:"100px" },
  { key:"name",        header:"⚠ Packaging Name",      label:"Name",         w:"1fr",   required:true },
  { key:"category",    header:"⚠ Category",             label:"Category",     w:"100px", required:true },
  { key:"subCat",      header:"Sub-Category",          label:"Sub-Cat",      w:"90px" },
  { key:"uom",         header:"UOM",                   label:"UOM",          w:"60px" },
  { key:"hsnCode",     header:"→ HSN Code",             label:"HSN",          w:"70px" },
  { key:"gstPct",      header:"← GST % (Auto)",         label:"GST %",        w:"60px",  auto:true },
  { key:"primarySupp", header:"→ Primary Supplier",     label:"Supplier",     w:"100px" },
  { key:"suppName",    header:"← Supplier Name (Auto)", label:"Supp Name",   w:"0",     hidden:true, auto:true },
  { key:"costPerUom",  header:"Cost per UOM",           label:"Cost/UOM",     w:"80px",  type:"number" },
  { key:"reorderLevel",header:"Reorder Level",           label:"Reorder",      w:"70px",  type:"number" },
  { key:"status",      header:"Status",                 label:"Status",       w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"remarks",     header:"Remarks",                label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_COLOR_MASTER = [
  { key:"code",      header:"Color Code",          label:"Color Code",   w:"110px", mono:true },
  { key:"name",      header:"Color Name",          label:"Color Name",   w:"1fr",   required:true },
  { key:"pantone",   header:"Pantone Reference",   label:"Pantone",      w:"120px" },
  { key:"hex",       header:"Hex Code",            label:"Hex",          w:"90px",  mono:true },
  { key:"swatch",    header:"Color Swatch",        label:"Swatch",       w:"80px" },
  { key:"family",    header:"Color Family",        label:"Family",       w:"100px" },
  { key:"active",    header:"Active",              label:"Active",       w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_HSN_MASTER = [
  { key:"code",   header:"HSN Code",        label:"HSN Code",     w:"120px", mono:true, required:true },
  { key:"desc",   header:"HSN Description", label:"Description",  w:"1fr" },
  { key:"gstPct", header:"GST %",           label:"GST %",        w:"80px",  type:"number", required:true },
  { key:"category",header:"Category",       label:"Category",     w:"120px" },
  { key:"active", header:"Active",          label:"Active",       w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_UOM_MASTER = [
  { key:"code",   header:"UOM Code",    label:"UOM Code",    w:"120px", mono:true, required:true },
  { key:"name",   header:"UOM Name",    label:"UOM Name",    w:"1fr",   required:true },
  { key:"desc",   header:"Description", label:"Description",  w:"1fr" },
  { key:"active", header:"Active",      label:"Active",       w:"80px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_SIZE_MASTER = [
  { key:"code",     header:"Size Code",        label:"Size Code",  w:"100px", mono:true, required:true },
  { key:"label",    header:"Size Label",       label:"Label",      w:"80px",  required:true },
  { key:"chest",    header:"Chest (inches)",   label:"Chest″",     w:"80px",  type:"number" },
  { key:"length",   header:"Length (inches)",  label:"Length″",    w:"80px",  type:"number" },
  { key:"shoulder", header:"Shoulder (inches)",label:"Shoulder″",  w:"80px",  type:"number" },
  { key:"sleeve",   header:"Sleeve (inches)",  label:"Sleeve″",   w:"80px",  type:"number" },
  { key:"category", header:"Category",         label:"Category",   w:"100px" },
  { key:"gender",   header:"Gender",           label:"Gender",     w:"80px",  type:"select", options:["Men","Women","Unisex","Kids"] },
  { key:"active",   header:"Active",           label:"Active",     w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_FABRIC_TYPE = [
  { key:"code",      header:"Fabric Type Code",   label:"Type Code",    w:"130px", mono:true, required:true },
  { key:"knitConst", header:"Knit Construction",  label:"Construction", w:"1fr",   required:true },
  { key:"shortCode", header:"Short Code",         label:"Short",        w:"80px" },
  { key:"desc",      header:"Description",        label:"Description",  w:"1fr" },
  { key:"commonUse", header:"Common Use",         label:"Common Use",   w:"120px" },
  { key:"active",    header:"Active",             label:"Active",       w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_TAG_MASTER = [
  { key:"code",      header:"Tag Code",    label:"Tag Code",    w:"110px", mono:true, required:true },
  { key:"name",      header:"Tag Name",    label:"Tag Name",    w:"1fr",   required:true },
  { key:"appliesTo", header:"Applies To",  label:"Applies To",  w:"120px" },
  { key:"active",    header:"Active",      label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"color",     header:"Color",       label:"Color",       w:"80px" },
  { key:"desc",      header:"Description", label:"Description", w:"1fr" },
];

export const SCHEMA_RM_WOVEN = [
  { key:"code",        header:"# RM Code",              label:"RM Code",      w:"120px", mono:true, auto:true },
  { key:"name",        header:"Woven/Interlining Name", label:"Name",         w:"1fr",   required:true },
  { key:"type",        header:"Type",                   label:"Type",         w:"100px", type:"select", options:["Woven","Interlining","Fusing"] },
  { key:"composition", header:"Composition",            label:"Composition",  w:"120px" },
  { key:"width",       header:"Width (inches)",         label:"Width″",       w:"70px",  type:"number" },
  { key:"weight",      header:"Weight (GSM)",           label:"GSM",          w:"70px",  type:"number" },
  { key:"uom",         header:"UOM",                    label:"UOM",          w:"60px" },
  { key:"hsnCode",     header:"→ HSN Code",             label:"HSN",          w:"70px" },
  { key:"gstPct",      header:"← GST % (Auto)",         label:"GST %",        w:"60px",  auto:true },
  { key:"primarySupp", header:"→ Primary Supplier",     label:"Supplier",     w:"100px" },
  { key:"suppName",    header:"← Supplier Name (Auto)", label:"Supp Name",    w:"0",     hidden:true, auto:true },
  { key:"costPerUom",  header:"Cost per UOM",           label:"Cost/UOM",     w:"80px",  type:"number" },
  { key:"reorderLevel",header:"Reorder Level",           label:"Reorder",      w:"70px",  type:"number" },
  { key:"status",      header:"Status",                 label:"Status",       w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"remarks",     header:"Remarks",                label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_ITEM_CATEGORIES = [
  { key:"code",      header:"Category Code",       label:"Code",        w:"100px", mono:true, auto:true },
  { key:"l1",        header:"L1 Division",          label:"Division",    w:"140px", required:true },
  { key:"l2",        header:"L2 Type",              label:"Type",        w:"1fr",   required:true },
  { key:"l3",        header:"L3 Style",             label:"Style",       w:"1fr",   required:true },
  { key:"master",    header:"Item Master Sheet",    label:"Master",      w:"130px", required:true, type:"select", options:["ARTICLE","RM-FABRIC","RM-YARN","RM-WOVEN","TRIM","CONSUMABLE","PACKAGING"] },
  { key:"hsn",       header:"Default HSN",          label:"HSN",         w:"80px" },
  { key:"active",    header:"Active",               label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"remarks",   header:"Remarks",              label:"Remarks",     w:"0",     hidden:true, type:"textarea" },
  { key:"behavior",  header:"L1 Behavior",          label:"Behavior",    w:"90px",  auto:true },
];


// ─── FILE 1B — Factory ───────────────────────────────────────────────────────

export const SCHEMA_USER_MASTER = [
  { key:"code",       header:"# User ID",              label:"User ID",      w:"100px", mono:true, auto:true },
  { key:"name",       header:"Full Name",              label:"Full Name",    w:"1fr",   required:true },
  { key:"email",      header:"Email (Google)",         label:"Email",        w:"180px", required:true },
  { key:"phone",      header:"Phone",                  label:"Phone",        w:"110px" },
  { key:"deptCode",   header:"→ Department",            label:"Dept",         w:"100px" },
  { key:"deptName",   header:"← Dept Name (Auto)",     label:"Dept Name",    w:"0",     hidden:true, auto:true },
  { key:"desigCode",  header:"→ Designation",           label:"Designation",  w:"100px" },
  { key:"desigName",  header:"← Designation Name (Auto)", label:"Desig Name", w:"0",   hidden:true, auto:true },
  { key:"role",       header:"Role",                   label:"Role",         w:"90px",  type:"select", options:["Admin","Manager","Supervisor","Operator","View Only"] },
  { key:"reportingTo",header:"Reporting To",            label:"Reports To",   w:"100px" },
  { key:"dateJoined", header:"Date Joined",             label:"Joined",       w:"100px", type:"date" },
  { key:"status",     header:"Status",                  label:"Status",       w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"remarks",    header:"Remarks",                 label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_ROLE_MASTER = [
  { key:"code",  header:"# Role Code",  label:"Role Code",   w:"120px", mono:true, required:true },
  { key:"name",  header:"Role Name",    label:"Role Name",   w:"1fr",   required:true },
  { key:"desc",  header:"Description",  label:"Description", w:"1fr" },
  { key:"level", header:"Level",        label:"Level",       w:"80px",  type:"number" },
  { key:"active",header:"Active",       label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_DEPARTMENT_MASTER = [
  { key:"code",     header:"# Dept Code",       label:"Dept Code",   w:"120px", mono:true, auto:true },
  { key:"name",     header:"Department Name",   label:"Department",  w:"1fr",   required:true },
  { key:"head",     header:"Head of Department",label:"HOD",         w:"140px" },
  { key:"location", header:"Location",          label:"Location",    w:"120px" },
  { key:"active",   header:"Active",            label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"notes",    header:"Notes",             label:"Notes",       w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_MACHINE_MASTER = [
  { key:"code",       header:"# Machine Code",          label:"Machine Code",  w:"120px", mono:true, auto:true },
  { key:"name",       header:"⚠ Machine Name",           label:"Machine Name",  w:"1fr",   required:true },
  { key:"catCode",    header:"→ Machine Category",       label:"Category",      w:"100px" },
  { key:"catName",    header:"← Category Name (Auto)",   label:"Cat Name",      w:"0",     hidden:true, auto:true },
  { key:"make",       header:"Make / Brand",             label:"Make",          w:"100px" },
  { key:"model",      header:"Model",                    label:"Model",         w:"90px" },
  { key:"serialNo",   header:"Serial No",                label:"Serial No",     w:"100px", mono:true },
  { key:"diameter",   header:"Diameter (inches)",        label:"Dia″",          w:"70px",  type:"number" },
  { key:"gauge",      header:"Gauge",                    label:"Gauge",         w:"70px",  type:"number" },
  { key:"feeders",    header:"No. of Feeders",           label:"Feeders",       w:"70px",  type:"number" },
  { key:"yearInst",   header:"Year Installed",           label:"Year",          w:"70px" },
  { key:"factCode",   header:"→ Factory Code",           label:"Factory",       w:"90px" },
  { key:"factName",   header:"← Factory Name (Auto)",    label:"Factory Name",  w:"0",     hidden:true, auto:true },
  { key:"locationInFactory", header:"Location in Factory", label:"Location",   w:"100px" },
  { key:"status",     header:"Status",                   label:"Status",        w:"80px",  badge:true, type:"select", options:["Active","Maintenance","Inactive"] },
  { key:"tags",       header:"⟷ Tags",                   label:"Tags",          w:"80px" },
  { key:"remarks",    header:"Remarks",                  label:"Remarks",       w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_SUPPLIER_MASTER_1B = [
  { key:"code",     header:"# Supplier Code",  label:"Supp Code",  w:"120px", mono:true, auto:true },
  { key:"name",     header:"⚠ Supplier Name",   label:"Name",       w:"1fr",   required:true },
  { key:"contact",  header:"Contact Person",   label:"Contact",    w:"120px" },
  { key:"phone",    header:"Phone",            label:"Phone",      w:"110px" },
  { key:"email",    header:"Email",            label:"Email",      w:"150px" },
  { key:"city",     header:"City",             label:"City",       w:"90px" },
  { key:"state",    header:"State",            label:"State",      w:"90px" },
  { key:"gstNo",    header:"GST No",           label:"GSTIN",      w:"140px", mono:true },
  { key:"status",   header:"Status",           label:"Status",     w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"remarks",  header:"Remarks",          label:"Remarks",    w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_ITEM_SUPPLIER_RATES = [
  { key:"code",       header:"# Rate Code",             label:"Rate Code",   w:"110px", mono:true, auto:true },
  { key:"itemCode",   header:"⚠ Item Code",              label:"Item Code",   w:"110px", required:true },
  { key:"itemMaster", header:"Item Master",              label:"Item Master", w:"90px" },
  { key:"itemName",   header:"← Item Name (Auto)",       label:"Item Name",   w:"1fr",   auto:true },
  { key:"suppCode",   header:"→ Supplier Code",          label:"Supplier",    w:"100px", required:true },
  { key:"suppName",   header:"← Supplier Name (Auto)",   label:"Supp Name",   w:"0",     hidden:true, auto:true },
  { key:"unitPrice",  header:"Unit Price (excl GST)",    label:"Price",       w:"90px",  type:"number", required:true },
  { key:"gstPct",     header:"GST %",                    label:"GST %",       w:"60px",  type:"number" },
  { key:"priceInclGst",header:"∑ Price incl GST (Auto)", label:"Price+GST",   w:"90px",  auto:true },
  { key:"uom",        header:"UOM",                      label:"UOM",         w:"60px" },
  { key:"moq",        header:"MOQ",                      label:"MOQ",         w:"60px",  type:"number" },
  { key:"leadTime",   header:"Lead Time (Days)",         label:"Lead",        w:"60px",  type:"number" },
  { key:"priority",   header:"Priority",                 label:"Priority",    w:"70px",  type:"number" },
  { key:"active",     header:"Active",                   label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_WAREHOUSE_MASTER = [
  { key:"code",     header:"# Warehouse Code",   label:"WH Code",     w:"120px", mono:true, auto:true },
  { key:"name",     header:"⚠ Warehouse Name",    label:"WH Name",     w:"1fr",   required:true },
  { key:"type",     header:"Type",                label:"Type",        w:"100px", type:"select", options:["Raw Material","Finished Goods","Trim","Chemical","General"] },
  { key:"address",  header:"Address",             label:"Address",     w:"0",     hidden:true },
  { key:"manager",  header:"Manager",             label:"Manager",     w:"120px" },
  { key:"capacity", header:"Capacity",            label:"Capacity",    w:"80px",  type:"number" },
  { key:"capUom",   header:"Capacity UOM",        label:"Cap UOM",     w:"80px" },
  { key:"active",   header:"Active",              label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"remarks",  header:"Remarks",             label:"Remarks",     w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_CONTRACTOR_MASTER = [
  { key:"code",       header:"# Contractor Code",          label:"Code",        w:"120px", mono:true, auto:true },
  { key:"name",       header:"⚠ Contractor Name",           label:"Name",        w:"1fr",   required:true },
  { key:"contact",    header:"Contact Person",             label:"Contact",     w:"120px" },
  { key:"phone",      header:"Phone",                      label:"Phone",       w:"110px" },
  { key:"email",      header:"Email",                      label:"Email",       w:"0",     hidden:true },
  { key:"processType",header:"Process Type",               label:"Process",     w:"100px" },
  { key:"city",       header:"City",                       label:"City",        w:"90px" },
  { key:"state",      header:"State",                      label:"State",       w:"90px" },
  { key:"gstNo",      header:"GST No",                     label:"GSTIN",       w:"120px", mono:true },
  { key:"payTerms",   header:"→ Payment Terms",             label:"Pay Terms",   w:"100px" },
  { key:"payTermsName",header:"← Payment Terms Name (Auto)",label:"PT Name",    w:"0",     hidden:true, auto:true },
  { key:"rateBasis",  header:"Rate Basis",                 label:"Rate Basis",  w:"80px" },
  { key:"rateAmt",    header:"Rate Amount (₹)",            label:"Rate ₹",      w:"80px",  type:"number" },
  { key:"leadTime",   header:"Lead Time (Days)",           label:"Lead",        w:"60px",  type:"number" },
  { key:"active",     header:"Active",                     label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"remarks",    header:"Remarks",                    label:"Remarks",     w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_PROCESS_MASTER = [
  { key:"code",       header:"# Process Code",        label:"Process Code",  w:"120px", mono:true, auto:true },
  { key:"name",       header:"⚠ Process Name",         label:"Process Name",  w:"1fr",   required:true },
  { key:"type",       header:"Process Type",           label:"Type",          w:"100px" },
  { key:"deptCode",   header:"→ Department",            label:"Dept",          w:"90px" },
  { key:"deptName",   header:"← Dept Name (Auto)",     label:"Dept Name",     w:"0",     hidden:true, auto:true },
  { key:"sequence",   header:"Sequence",               label:"Seq",           w:"60px",  type:"number" },
  { key:"stdTime",    header:"Standard Time (min)",    label:"Std Time",      w:"80px",  type:"number" },
  { key:"uom",        header:"UOM",                    label:"UOM",           w:"60px" },
  { key:"active",     header:"Active",                 label:"Active",        w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"notes",      header:"Notes",                  label:"Notes",         w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_DESIGNATION_MASTER = [
  { key:"code",     header:"# Designation Code",  label:"Desig Code",  w:"120px", mono:true, auto:true },
  { key:"name",     header:"Designation Name",     label:"Designation", w:"1fr",   required:true },
  { key:"level",    header:"Level",                label:"Level",       w:"80px",  type:"number" },
  { key:"deptCode", header:"→ Department",          label:"Dept",        w:"100px" },
  { key:"deptName", header:"← Dept Name (Auto)",   label:"Dept Name",   w:"0",     hidden:true, auto:true },
  { key:"active",   header:"Active",               label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"notes",    header:"Notes",                label:"Notes",       w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_SHIFT_MASTER = [
  { key:"code",      header:"# Shift Code",      label:"Shift Code",  w:"110px", mono:true, auto:true },
  { key:"name",      header:"Shift Name",         label:"Shift Name",  w:"1fr",   required:true },
  { key:"startTime", header:"Start Time",         label:"Start",       w:"80px" },
  { key:"endTime",   header:"End Time",           label:"End",         w:"80px" },
  { key:"breakMin",  header:"Break (Minutes)",    label:"Break",       w:"70px",  type:"number" },
  { key:"workHrs",   header:"Working Hours",      label:"Work Hrs",    w:"80px",  type:"number" },
  { key:"active",    header:"Active",             label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"notes",     header:"Notes",              label:"Notes",       w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_CUSTOMER_MASTER = [
  { key:"code",         header:"# Customer Code",              label:"Cust Code",   w:"120px", mono:true, auto:true },
  { key:"name",         header:"⚠ Customer Name",               label:"Name",        w:"1fr",   required:true },
  { key:"contact",      header:"Contact Person",               label:"Contact",     w:"120px" },
  { key:"phone",        header:"Phone",                        label:"Phone",       w:"110px" },
  { key:"email",        header:"Email",                        label:"Email",       w:"0",     hidden:true },
  { key:"address",      header:"Address",                      label:"Address",     w:"0",     hidden:true },
  { key:"city",         header:"City",                         label:"City",        w:"90px" },
  { key:"state",        header:"State",                        label:"State",       w:"80px" },
  { key:"gstNo",        header:"GST No",                       label:"GSTIN",       w:"140px", mono:true },
  { key:"pan",          header:"PAN",                          label:"PAN",         w:"100px", mono:true },
  { key:"payTerms",     header:"→ Payment Terms",               label:"Pay Terms",   w:"100px" },
  { key:"payTermsName", header:"← Payment Terms Name (Auto)",  label:"PT Name",     w:"0",     hidden:true, auto:true },
  { key:"creditLimit",  header:"Credit Limit (₹)",             label:"Credit ₹",    w:"90px",  type:"number" },
  { key:"creditDays",   header:"Credit Period (Days)",         label:"Credit Days",  w:"80px",  type:"number" },
  { key:"status",       header:"Status",                       label:"Status",      w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"tags",         header:"⟷ Tags",                       label:"Tags",        w:"80px" },
  { key:"remarks",      header:"Remarks",                      label:"Remarks",     w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_STORAGE_BIN_MASTER = [
  { key:"code",     header:"# Bin Code",                 label:"Bin Code",   w:"110px", mono:true, auto:true },
  { key:"whCode",   header:"→ Warehouse Code",           label:"Warehouse",  w:"100px" },
  { key:"whName",   header:"← Warehouse Name (Auto)",    label:"WH Name",    w:"0",     hidden:true, auto:true },
  { key:"name",     header:"Bin Name / Label",           label:"Bin Name",   w:"1fr",   required:true },
  { key:"zone",     header:"Zone",                       label:"Zone",       w:"80px" },
  { key:"rack",     header:"Rack",                       label:"Rack",       w:"70px" },
  { key:"level",    header:"Level",                      label:"Level",      w:"70px" },
  { key:"itemType", header:"Item Type",                  label:"Item Type",  w:"100px" },
  { key:"active",   header:"Active",                     label:"Active",     w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"notes",    header:"Notes",                      label:"Notes",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_FACTORY_MASTER = [
  { key:"code",    header:"# Factory Code",   label:"Factory Code", w:"120px", mono:true, auto:true },
  { key:"name",    header:"⚠ Factory Name",    label:"Factory Name", w:"1fr",   required:true },
  { key:"address", header:"Address",           label:"Address",      w:"0",     hidden:true },
  { key:"city",    header:"City",              label:"City",         w:"90px" },
  { key:"state",   header:"State",             label:"State",        w:"80px" },
  { key:"pinCode", header:"Pin Code",          label:"Pin",          w:"70px" },
  { key:"gstNo",   header:"GST No",            label:"GSTIN",        w:"140px", mono:true },
  { key:"pan",     header:"PAN",               label:"PAN",          w:"100px", mono:true },
  { key:"contact", header:"Contact Person",    label:"Contact",      w:"120px" },
  { key:"phone",   header:"Phone",             label:"Phone",        w:"110px" },
  { key:"email",   header:"Email",             label:"Email",        w:"0",     hidden:true },
  { key:"active",  header:"Active",            label:"Active",       w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"remarks", header:"Remarks",           label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_MACHINE_CATEGORY = [
  { key:"code",   header:"# Category Code", label:"Cat Code",    w:"120px", mono:true, auto:true },
  { key:"name",   header:"Category Name",   label:"Cat Name",    w:"1fr",   required:true },
  { key:"desc",   header:"Description",     label:"Description", w:"1fr" },
  { key:"active", header:"Active",          label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_ASSET_MASTER = [
  { key:"code",        header:"# Asset Code",             label:"Asset Code",   w:"120px", mono:true, auto:true },
  { key:"name",        header:"⚠ Asset Name",              label:"Asset Name",   w:"1fr",   required:true },
  { key:"category",    header:"Category",                  label:"Category",     w:"100px" },
  { key:"factCode",    header:"→ Factory Code",            label:"Factory",      w:"90px" },
  { key:"factName",    header:"← Factory Name (Auto)",     label:"Factory Name", w:"0",     hidden:true, auto:true },
  { key:"location",    header:"Location",                  label:"Location",     w:"100px" },
  { key:"purchDate",   header:"Purchase Date",             label:"Purchased",    w:"100px", type:"date" },
  { key:"purchValue",  header:"Purchase Value (₹)",        label:"Value ₹",      w:"90px",  type:"number" },
  { key:"depreciation",header:"Depreciation % / Year",     label:"Depr %",       w:"70px",  type:"number" },
  { key:"currentVal",  header:"∑ Current Value (₹)",       label:"Current ₹",    w:"90px",  auto:true },
  { key:"warranty",    header:"Warranty Expiry",           label:"Warranty",     w:"100px", type:"date" },
  { key:"status",      header:"Status",                    label:"Status",       w:"80px",  badge:true, type:"select", options:["Active","Maintenance","Disposed"] },
  { key:"remarks",     header:"Remarks",                   label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_MAINTENANCE_SCHEDULE = [
  { key:"code",       header:"# Schedule Code",          label:"Sched Code",   w:"120px", mono:true, auto:true },
  { key:"machCode",   header:"→ Machine Code",           label:"Machine",      w:"100px" },
  { key:"machName",   header:"← Machine Name (Auto)",    label:"Machine Name", w:"0",     hidden:true, auto:true },
  { key:"maintType",  header:"Maintenance Type",         label:"Type",         w:"100px" },
  { key:"frequency",  header:"Frequency",                label:"Frequency",    w:"90px" },
  { key:"lastDone",   header:"Last Done Date",           label:"Last Done",    w:"100px", type:"date" },
  { key:"nextDue",    header:"Next Due Date",            label:"Next Due",     w:"100px", type:"date" },
  { key:"assignedTo", header:"Assigned To",              label:"Assigned",     w:"100px" },
  { key:"spares",     header:"→ Spare Parts Used",       label:"Spares",       w:"0",     hidden:true },
  { key:"estCost",    header:"Estimated Cost (₹)",       label:"Est Cost ₹",   w:"90px",  type:"number" },
  { key:"status",     header:"Status",                   label:"Status",       w:"80px",  badge:true, type:"select", options:["Scheduled","Completed","Overdue"] },
  { key:"notes",      header:"Notes",                    label:"Notes",        w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_SPARE_PARTS_MASTER = [
  { key:"code",         header:"# Spare Code",              label:"Spare Code",  w:"120px", mono:true, auto:true },
  { key:"name",         header:"⚠ Spare Part Name",          label:"Part Name",   w:"1fr",   required:true },
  { key:"compatible",   header:"Compatible Machines",       label:"Machines",    w:"120px" },
  { key:"partNo",       header:"Part Number",               label:"Part No",     w:"100px", mono:true },
  { key:"uom",          header:"UOM",                       label:"UOM",         w:"60px" },
  { key:"reorderLevel", header:"Reorder Level",             label:"Reorder",     w:"70px",  type:"number" },
  { key:"currentStock", header:"Current Stock",             label:"Stock",       w:"70px",  type:"number" },
  { key:"suppCode",     header:"→ Supplier Code",           label:"Supplier",    w:"100px" },
  { key:"suppName",     header:"← Supplier Name (Auto)",    label:"Supp Name",   w:"0",     hidden:true, auto:true },
  { key:"costPerUnit",  header:"Cost per Unit (₹)",         label:"Cost ₹",      w:"80px",  type:"number" },
  { key:"leadTime",     header:"Lead Time (Days)",          label:"Lead",        w:"60px",  type:"number" },
  { key:"status",       header:"Status",                    label:"Status",      w:"80px",  badge:true, type:"select", options:["Active","Inactive"] },
  { key:"remarks",      header:"Remarks",                   label:"Remarks",     w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_WORK_CENTER_MASTER = [
  { key:"code",        header:"# Work Center Code",       label:"WC Code",      w:"120px", mono:true, auto:true },
  { key:"name",        header:"⚠ Work Center Name",        label:"WC Name",      w:"1fr",   required:true },
  { key:"procCode",    header:"→ Process Code",            label:"Process",      w:"100px" },
  { key:"procName",    header:"← Process Name (Auto)",     label:"Process Name", w:"0",     hidden:true, auto:true },
  { key:"factCode",    header:"→ Factory Code",            label:"Factory",      w:"90px" },
  { key:"factName",    header:"← Factory Name (Auto)",     label:"Factory Name", w:"0",     hidden:true, auto:true },
  { key:"location",    header:"Location",                  label:"Location",     w:"100px" },
  { key:"capPerShift", header:"Capacity per Shift",        label:"Cap/Shift",    w:"80px",  type:"number" },
  { key:"capUom",      header:"Capacity UOM",              label:"Cap UOM",      w:"80px" },
  { key:"active",      header:"Active",                    label:"Active",       w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"remarks",     header:"Remarks",                   label:"Remarks",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_JOBWORK_PARTY_MASTER = [
  { key:"code",         header:"# JW Party Code",                label:"JW Code",    w:"120px", mono:true, auto:true },
  { key:"name",         header:"⚠ Party Name",                    label:"Party Name", w:"1fr",   required:true },
  { key:"contact",      header:"Contact Person",                 label:"Contact",    w:"120px" },
  { key:"phone",        header:"Phone",                          label:"Phone",      w:"110px" },
  { key:"email",        header:"Email",                          label:"Email",      w:"0",     hidden:true },
  { key:"address",      header:"Address",                        label:"Address",    w:"0",     hidden:true },
  { key:"city",         header:"City",                           label:"City",       w:"90px" },
  { key:"state",        header:"State",                          label:"State",      w:"80px" },
  { key:"gstNo",        header:"GST No",                         label:"GSTIN",      w:"120px", mono:true },
  { key:"processTypes", header:"Process Types",                  label:"Processes",  w:"120px" },
  { key:"payTerms",     header:"→ Payment Terms",                 label:"Pay Terms",  w:"100px" },
  { key:"payTermsName", header:"← Payment Terms Name (Auto)",    label:"PT Name",    w:"0",     hidden:true, auto:true },
  { key:"rateBasis",    header:"Rate Basis",                     label:"Rate Basis", w:"80px" },
  { key:"rateAmt",      header:"Rate Amount (₹)",                label:"Rate ₹",     w:"80px",  type:"number" },
  { key:"leadTime",     header:"Lead Time (Days)",               label:"Lead",       w:"60px",  type:"number" },
  { key:"qualRating",   header:"Quality Rating",                 label:"Rating",     w:"70px" },
  { key:"active",       header:"Active",                         label:"Active",     w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"remarks",      header:"Remarks",                        label:"Remarks",    w:"0",     hidden:true, type:"textarea" },
];


// ─── FILE 1C — Finance ───────────────────────────────────────────────────────

export const SCHEMA_SUPPLIER_MASTER_1C = [
  { key:"code",        header:"# Supplier Code",          label:"Supp Code",   w:"120px", mono:true, auto:true },
  { key:"name",        header:"⚠ Supplier Name",           label:"Name",        w:"1fr",   required:true },
  { key:"contact",     header:"Contact Person",           label:"Contact",     w:"120px" },
  { key:"phone",       header:"Phone",                    label:"Phone",       w:"110px" },
  { key:"email",       header:"Email",                    label:"Email",       w:"0",     hidden:true },
  { key:"address",     header:"Address",                  label:"Address",     w:"0",     hidden:true },
  { key:"city",        header:"City",                     label:"City",        w:"90px" },
  { key:"state",       header:"State",                    label:"State",       w:"80px" },
  { key:"pinCode",     header:"Pin Code",                 label:"Pin",         w:"70px" },
  { key:"gstNo",       header:"GST No",                   label:"GSTIN",       w:"140px", mono:true },
  { key:"pan",         header:"PAN",                      label:"PAN",         w:"100px", mono:true },
  { key:"msme",        header:"MSME Registration",        label:"MSME",        w:"0",     hidden:true },
  { key:"payTerms",    header:"→ Payment Terms",           label:"Pay Terms",   w:"100px" },
  { key:"payTermsName",header:"← Payment Terms Name (Auto)", label:"PT Name",  w:"0",     hidden:true, auto:true },
  { key:"bankName",    header:"Bank Name",                label:"Bank",        w:"0",     hidden:true },
  { key:"accountNo",   header:"Account No",               label:"Account",     w:"0",     hidden:true },
  { key:"ifsc",        header:"IFSC Code",                label:"IFSC",        w:"0",     hidden:true, mono:true },
  { key:"creditDays",  header:"Credit Period (Days)",     label:"Credit Days", w:"80px",  type:"number" },
  { key:"supplyCat",   header:"Supply Category",          label:"Supply Cat",  w:"100px" },
  { key:"status",      header:"Status",                   label:"Status",      w:"80px",  badge:true, type:"select", options:["Active","Inactive","Blocked"] },
  { key:"tags",        header:"⟷ Tags",                   label:"Tags",        w:"80px" },
  { key:"remarks",     header:"Remarks",                  label:"Remarks",     w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_PAYMENT_TERMS = [
  { key:"code",       header:"# PT Code",            label:"PT Code",     w:"110px", mono:true, auto:true },
  { key:"name",       header:"⚠ Payment Terms Name",  label:"Terms Name",  w:"1fr",   required:true },
  { key:"creditDays", header:"Credit Days",           label:"Credit Days", w:"90px",  type:"number", required:true },
  { key:"advancePct", header:"Advance %",             label:"Advance %",   w:"90px",  type:"number" },
  { key:"balancePct", header:"Balance %",             label:"Balance %",   w:"90px",  type:"number" },
  { key:"desc",       header:"Description",           label:"Description", w:"1fr" },
  { key:"active",     header:"Active",                label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_TAX_MASTER = [
  { key:"code",    header:"# Tax Code",       label:"Tax Code",    w:"110px", mono:true, auto:true },
  { key:"name",    header:"⚠ Tax Name",        label:"Tax Name",    w:"1fr",   required:true },
  { key:"taxType", header:"Tax Type",          label:"Type",        w:"100px", type:"select", options:["GST","IGST","CGST","SGST","Cess"] },
  { key:"ratePct", header:"Rate %",            label:"Rate %",      w:"80px",  type:"number", required:true },
  { key:"from",    header:"Applicable From",   label:"From",        w:"110px", type:"date" },
  { key:"desc",    header:"Description",       label:"Description", w:"1fr" },
  { key:"active",  header:"Active",            label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
];

export const SCHEMA_BANK_MASTER = [
  { key:"code",       header:"# Bank Code",     label:"Bank Code",  w:"110px", mono:true, auto:true },
  { key:"name",       header:"⚠ Bank Name",      label:"Bank Name",  w:"1fr",   required:true },
  { key:"branch",     header:"Branch",           label:"Branch",     w:"120px" },
  { key:"accountNo",  header:"Account No",       label:"Account No", w:"140px", mono:true },
  { key:"ifsc",       header:"IFSC Code",        label:"IFSC",       w:"110px", mono:true },
  { key:"accType",    header:"Account Type",     label:"Type",       w:"100px", type:"select", options:["Current","Savings","OD","CC"] },
  { key:"openBal",    header:"Opening Balance (₹)", label:"Opening ₹", w:"100px", type:"number" },
  { key:"contact",    header:"Contact Person",   label:"Contact",    w:"120px" },
  { key:"phone",      header:"Phone",            label:"Phone",      w:"100px" },
  { key:"active",     header:"Active",           label:"Active",     w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"remarks",    header:"Remarks",          label:"Remarks",    w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_COST_CENTER = [
  { key:"code",     header:"# Cost Center Code",   label:"CC Code",    w:"120px", mono:true, auto:true },
  { key:"name",     header:"⚠ Cost Center Name",    label:"CC Name",    w:"1fr",   required:true },
  { key:"deptCode", header:"→ Department",           label:"Dept",       w:"100px" },
  { key:"deptName", header:"← Dept Name (Auto)",    label:"Dept Name",  w:"0",     hidden:true, auto:true },
  { key:"manager",  header:"Manager",               label:"Manager",    w:"120px" },
  { key:"budget",   header:"Budget Amount (₹)",     label:"Budget ₹",   w:"100px", type:"number" },
  { key:"active",   header:"Active",                label:"Active",     w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"notes",    header:"Notes",                  label:"Notes",      w:"0",     hidden:true, type:"textarea" },
];

export const SCHEMA_ACCOUNT_MASTER = [
  { key:"code",       header:"# Account Code",   label:"Acct Code",   w:"120px", mono:true, auto:true },
  { key:"name",       header:"⚠ Account Name",    label:"Account Name",w:"1fr",   required:true },
  { key:"group",      header:"Account Group",     label:"Group",       w:"120px" },
  { key:"type",       header:"Account Type",      label:"Type",        w:"100px", type:"select", options:["Asset","Liability","Income","Expense","Equity"] },
  { key:"parentAcct", header:"Parent Account",    label:"Parent",      w:"110px" },
  { key:"openBal",    header:"Opening Balance (₹)", label:"Opening ₹", w:"100px", type:"number" },
  { key:"active",     header:"Active",            label:"Active",      w:"70px",  badge:true, type:"select", options:["Yes","No"] },
  { key:"notes",      header:"Notes",              label:"Notes",       w:"0",     hidden:true, type:"textarea" },
];


// ═══════════════════════════════════════════════════════════════════════════════
//  SCHEMA MAP — maps sheet key → schema
// ═══════════════════════════════════════════════════════════════════════════════

export const SCHEMA_MAP = {
  // FILE 1A
  article_master:     SCHEMA_ARTICLE_MASTER,
  rm_fabric:          SCHEMA_RM_FABRIC,
  rm_yarn:            SCHEMA_RM_YARN,
  rm_woven:           SCHEMA_RM_WOVEN,
  trim_master:        SCHEMA_TRIM_MASTER,
  consumable_master:  SCHEMA_CONSUMABLE_MASTER,
  packaging_master:   SCHEMA_PACKAGING_MASTER,
  color_master:       SCHEMA_COLOR_MASTER,
  hsn_master:         SCHEMA_HSN_MASTER,
  uom_master:         SCHEMA_UOM_MASTER,
  size_master:        SCHEMA_SIZE_MASTER,
  fabric_type_master: SCHEMA_FABRIC_TYPE,
  tag_master:         SCHEMA_TAG_MASTER,
  item_categories:    SCHEMA_ITEM_CATEGORIES,

  // FILE 1B
  user_master:          SCHEMA_USER_MASTER,
  role_master:          SCHEMA_ROLE_MASTER,
  department_master:    SCHEMA_DEPARTMENT_MASTER,
  designation_master:   SCHEMA_DESIGNATION_MASTER,
  shift_master:         SCHEMA_SHIFT_MASTER,
  machine_master:       SCHEMA_MACHINE_MASTER,
  machine_category:     SCHEMA_MACHINE_CATEGORY,
  supplier_master_1b:   SCHEMA_SUPPLIER_MASTER_1B,
  customer_master:      SCHEMA_CUSTOMER_MASTER,
  item_supplier_rates:  SCHEMA_ITEM_SUPPLIER_RATES,
  warehouse_master:     SCHEMA_WAREHOUSE_MASTER,
  storage_bin_master:   SCHEMA_STORAGE_BIN_MASTER,
  factory_master:       SCHEMA_FACTORY_MASTER,
  contractor_master:    SCHEMA_CONTRACTOR_MASTER,
  process_master:       SCHEMA_PROCESS_MASTER,
  asset_master:         SCHEMA_ASSET_MASTER,
  maintenance_schedule: SCHEMA_MAINTENANCE_SCHEDULE,
  spare_parts_master:   SCHEMA_SPARE_PARTS_MASTER,
  work_center_master:   SCHEMA_WORK_CENTER_MASTER,
  jobwork_party_master: SCHEMA_JOBWORK_PARTY_MASTER,

  // FILE 1C
  supplier_master_1c:  SCHEMA_SUPPLIER_MASTER_1C,
  payment_terms:       SCHEMA_PAYMENT_TERMS,
  tax_master:          SCHEMA_TAX_MASTER,
  bank_master:         SCHEMA_BANK_MASTER,
  cost_center:         SCHEMA_COST_CENTER,
  account_master:      SCHEMA_ACCOUNT_MASTER,
};
