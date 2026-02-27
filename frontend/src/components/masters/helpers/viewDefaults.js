/**
 * Generate default views for a given enriched schema.
 * Returns an array of view objects: Full Entry, Quick Entry, + smart views for key masters.
 */

const VIEW_COLORS = [
  { v: "#E8690A", l: "Orange" }, { v: "#0078D4", l: "Blue" }, { v: "#15803D", l: "Green" },
  { v: "#7C3AED", l: "Purple" }, { v: "#BE123C", l: "Rose" }, { v: "#854d0e", l: "Amber" },
  { v: "#0369a1", l: "Sky" }, { v: "#059669", l: "Teal" }, { v: "#6b7280", l: "Grey" }, { v: "#111827", l: "Black" },
];

const VIEW_ICONS = [
  "⚡","📋","₹","🧵","🏭","🔖","🎯","✅","🔍","📊",
  "📦","🏷️","⚙️","📝","🔑","🎨","👕","🪡","🔗","🧪",
  "📫","🌟","🔒","📌","💡",
];

export { VIEW_COLORS, VIEW_ICONS };

export function makeDefaultViews(enriched) {
  const allKeys = enriched.fields.map(f => f.key);
  const mandKeys = [...new Set([
    allKeys[0],
    ...enriched.fields.filter(f => f.required).map(f => f.key),
  ])];

  const views = [
    {
      id: `${enriched.id}:full`,
      name: "Full Entry",
      icon: "📋",
      color: "#6b7280",
      fields: allKeys,
      isSystem: true,
      desc: "Every column — complete entry form",
    },
    {
      id: `${enriched.id}:quick`,
      name: "Quick Entry",
      icon: "⚡",
      color: "#E8690A",
      fields: mandKeys,
      isSystem: true,
      desc: "Mandatory fields only — fastest way to create a new record",
    },
  ];

  // Smart views per master
  if (enriched.id === "article_master") {
    views.push({
      id: "art:pricing", name: "Pricing & Tax", icon: "₹", color: "#854d0e",
      fields: ["code", "wsp", "mrp", "markupPct", "markdownPct", "hsnCode", "gstPct"],
      isSystem: false, desc: "WSP · MRP · Markup % · Markdown % · HSN · GST",
    });
    views.push({
      id: "art:fabric", name: "Fabric Focus", icon: "🧵", color: "#059669",
      fields: ["code", "desc", "mainFabric", "fabricName", "colorCodes", "sizeRange"],
      isSystem: false, desc: "Main fabric code, name, colors, size range",
    });
    views.push({
      id: "art:identity", name: "Item Identity", icon: "👕", color: "#7C3AED",
      fields: ["code", "desc", "shortName", "l2Category", "season", "gender", "fitType", "neckline", "sleeveType", "status"],
      isSystem: false, desc: "Category, season, gender, fit, neckline, sleeve, status",
    });
  }

  if (enriched.id === "rm_fabric") {
    views.push({
      id: "fab:supply", name: "Supplier & Cost", icon: "🏭", color: "#0078D4",
      fields: ["code", "knitName", "primarySupp", "suppName", "season", "costPerUom", "status"],
      isSystem: false, desc: "Supplier, season, cost, status",
    });
    views.push({
      id: "fab:props", name: "Fabric Properties", icon: "⚙️", color: "#15803D",
      fields: ["code", "knitName", "fabricType", "colour", "gsmMin", "gsmMax", "width", "uom"],
      isSystem: false, desc: "Knit, type, colour, GSM, width, UOM",
    });
  }

  if (enriched.id === "trim_master") {
    views.push({
      id: "trm:core", name: "Core Identity", icon: "🔗", color: "#7C3AED",
      fields: ["code", "name", "category", "colourCode", "uom", "hsnCode", "gstPct", "status"],
      isSystem: false, desc: "Name, category, colour, UOM, HSN, GST, status",
    });
  }

  if (enriched.id === "color_master") {
    views.push({
      id: "clr:hex", name: "Hex / Pantone", icon: "🎨", color: "#BE123C",
      fields: ["code", "name", "pantone", "hex", "swatch", "family"],
      isSystem: false, desc: "Color code, name, Pantone, hex, swatch, family",
    });
  }

  return views;
}
