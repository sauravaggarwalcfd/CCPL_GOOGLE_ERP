export const ITEM_IMGS = {
  "RM-FAB-001":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop&q=80",
  "RM-FAB-002":"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=80&h=80&fit=crop&q=80",
  "RM-FAB-003":"https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=80&h=80&fit=crop&q=80",
  "RM-FAB-004":"https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=80&h=80&fit=crop&q=80",
  "TRM-THD-001":"https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=80&h=80&fit=crop&q=80",
  "TRM-ZIP-001":"https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=80&h=80&fit=crop&q=80",
  "TRM-LBL-001":"https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=80&h=80&fit=crop&q=80",
  "CON-DYE-001":"https://images.unsplash.com/photo-1558618047-3b61c4b9c8d4?w=80&h=80&fit=crop&q=80",
  "PKG-PLY-001":"https://images.unsplash.com/photo-1605732562742-3023a888e56e?w=80&h=80&fit=crop&q=80",
};

export const CAT_ICON = { Fabric:"🧵", Trim:"🪡", Chemical:"🧪", Packaging:"📦", Label:"🏷️" };
export const CAT_CLR  = { Fabric:"#2563eb", Trim:"#7c3aed", Chemical:"#dc2626", Packaging:"#ea580c", Label:"#059669" };

export const ITEMS = [
  { code:"RM-FAB-001", name:"Single Jersey 180 GSM 100% Cotton",  uom:"KG",   hsn:"6006", gst:12, cat:"Fabric" },
  { code:"RM-FAB-002", name:"Pique Fabric 220 GSM 65/35 PC",      uom:"KG",   hsn:"6006", gst:12, cat:"Fabric" },
  { code:"RM-FAB-003", name:"French Terry 280 GSM 100% Cotton",   uom:"KG",   hsn:"6006", gst:12, cat:"Fabric" },
  { code:"RM-FAB-004", name:"Fleece 320 GSM Poly Cotton",         uom:"KG",   hsn:"6006", gst:12, cat:"Fabric" },
  { code:"TRM-THD-001",name:"Coats Astra Sewing Thread 120/2",    uom:"CONE", hsn:"5402", gst:12, cat:"Trim" },
  { code:"TRM-ZIP-001",name:"YKK Nylon Zipper 6 inch Black",      uom:"PCS",  hsn:"9607", gst:18, cat:"Trim" },
  { code:"TRM-LBL-001",name:"Woven Main Label 5×3 cm",            uom:"PCS",  hsn:"5807", gst:12, cat:"Label" },
  { code:"CON-DYE-001",name:"Reactive Dye Red HE-3B",             uom:"KG",   hsn:"3204", gst:18, cat:"Chemical" },
  { code:"PKG-PLY-001",name:"Poly Bag 12×16 inch 40 Micron",      uom:"PCS",  hsn:"3923", gst:18, cat:"Packaging" },
];

export const SUPPLIERS = [
  { code:"SUP-001", name:"Coats India Pvt Ltd",        city:"Bengaluru", gstin:"29AABCC1234F1Z5", credit:30, rating:5 },
  { code:"SUP-002", name:"YKK India Pvt Ltd",          city:"Mumbai",    gstin:"27AABCY5678G1Z2", credit:45, rating:5 },
  { code:"SUP-003", name:"Madura Fashion & Lifestyle", city:"Chennai",   gstin:"33AABCM9012H1Z8", credit:30, rating:4 },
  { code:"SUP-004", name:"Vardhman Textiles Ltd",      city:"Ludhiana",  gstin:"03AABCV3456I1Z1", credit:60, rating:4 },
  { code:"SUP-005", name:"Alok Industries Ltd",        city:"Surat",     gstin:"27AABCA7890J1Z4", credit:45, rating:3 },
];

export const WH_LIST   = ["WH-FABRIC","WH-TRIM","WH-PKG","WH-CHEM","WH-FG"];
export const SEASONS   = ["SS25","AW25","SS26","AW26","Year Round"];
export const PO_TYPES  = ["Fabric","Trim","Packaging","Chemicals","Services","Assets"];
export const PAY_TERMS = ["30 Days Credit","45 Days Credit","60 Days Credit","Advance 100%","50% Adv + 50% Del","Against LC"];

export const OPEN_POS  = [
  { po:"PO-2026-0041", sup:"SUP-001", items:3, date:"18 Feb 2026" },
  { po:"PO-2026-0039", sup:"SUP-002", items:2, date:"15 Feb 2026" },
  { po:"PO-2026-0037", sup:"SUP-004", items:5, date:"12 Feb 2026" },
];

export const DEMO_PO_LIST = [
  {id:"PO-2026-0042",supplier:"SUP-001",supName:"Coats India Pvt Ltd",date:"24 Feb 2026",type:"Trim",items:3,base:112500,gst:13500,total:126000,status:"Pending"},
  {id:"PO-2026-0041",supplier:"SUP-004",supName:"Vardhman Textiles Ltd",date:"18 Feb 2026",type:"Fabric",items:5,base:287000,gst:34440,total:321440,status:"Approved"},
  {id:"PO-2026-0040",supplier:"SUP-002",supName:"YKK India Pvt Ltd",date:"15 Feb 2026",type:"Trim",items:2,base:45000,gst:8100,total:53100,status:"Approved"},
  {id:"PO-2026-0039",supplier:"SUP-003",supName:"Madura Fashion",date:"12 Feb 2026",type:"Fabric",items:4,base:198000,gst:23760,total:221760,status:"Received"},
  {id:"PO-2026-0038",supplier:"SUP-005",supName:"Alok Industries Ltd",date:"10 Feb 2026",type:"Fabric",items:3,base:155000,gst:18600,total:173600,status:"Draft"},
];

export const DEMO_GRN_LIST = [
  {id:"GRN-2026-0018",po:"PO-2026-0041",supplier:"SUP-004",supName:"Vardhman Textiles",date:"22 Feb 2026",items:5,recQty:520,accQty:510,status:"Accepted"},
  {id:"GRN-2026-0017",po:"PO-2026-0040",supplier:"SUP-002",supName:"YKK India",date:"20 Feb 2026",items:2,recQty:1000,accQty:985,status:"Partial"},
  {id:"GRN-2026-0016",po:"PO-2026-0039",supplier:"SUP-003",supName:"Madura Fashion",date:"18 Feb 2026",items:4,recQty:340,accQty:340,status:"Accepted"},
];
