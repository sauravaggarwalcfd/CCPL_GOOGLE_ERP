export const UI_FONTS = [
  {id:"nunito",   name:"Nunito Sans",       family:"'Nunito Sans', sans-serif",      tag:"DEFAULT · Warm & Rounded"},
  {id:"inter",    name:"Inter",             family:"'Inter', sans-serif",            tag:"Clean · Neutral"},
  {id:"dm",       name:"DM Sans",           family:"'DM Sans', sans-serif",          tag:"Modern · Geometric"},
  {id:"jakarta",  name:"Plus Jakarta Sans", family:"'Plus Jakarta Sans', sans-serif",tag:"Professional · Crisp"},
  {id:"outfit",   name:"Outfit",            family:"'Outfit', sans-serif",           tag:"Minimal · Contemporary"},
  {id:"source",   name:"Source Sans 3",     family:"'Source Sans 3', sans-serif",    tag:"Editorial · Readable"},
];

export const DATA_FONTS = [
  {id:"ibmplex",  name:"IBM Plex Mono",   family:"'IBM Plex Mono', monospace",  tag:"DEFAULT · Technical"},
  {id:"jetbrains",name:"JetBrains Mono",  family:"'JetBrains Mono', monospace", tag:"Dev-Friendly · Sharp"},
  {id:"fira",     name:"Fira Code",       family:"'Fira Code', monospace",      tag:"Ligatures · Elegant"},
  {id:"roboto",   name:"Roboto Mono",     family:"'Roboto Mono', monospace",    tag:"Neutral · Clean"},
  {id:"space",    name:"Space Mono",      family:"'Space Mono', monospace",     tag:"Distinctive · Retro"},
];

export const uiFF  = id => UI_FONTS.find(f=>f.id===id)?.family  || UI_FONTS[0].family;
export const dataFF = id => DATA_FONTS.find(f=>f.id===id)?.family || DATA_FONTS[0].family;
