export function aColor(e){
  const P=["#E8690A","#0078D4","#007C7C","#15803D","#7C3AED","#BE123C","#B45309","#0E7490","#6D28D9","#047857","#C2410C","#1D4ED8"];
  let h=0;
  for(let i=0;i<e.length;i++) h=e.charCodeAt(i)+((h<<5)-h);
  return P[Math.abs(h)%P.length];
}

export function ini(n){
  const p=n.trim().split(" ");
  return(p[0][0]+(p[1]?.[0]||p[0][1]||"")).toUpperCase();
}

export function ago(ts){
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<60)return`${s}s`;
  if(s<3600)return`${Math.floor(s/60)}m`;
  if(s<86400)return`${Math.floor(s/3600)}h`;
  return`${Math.floor(s/86400)}d`;
}

export function greet(){
  const h=new Date().getHours();
  return h<12?"Good morning":h<17?"Good afternoon":"Good evening";
}

export function todayStr(){
  return new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}

export function timeStr(){
  return new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
}

export function fuzzy(q,s){
  if(!q)return true;
  return s.toLowerCase().includes(q.toLowerCase());
}

export const uid = () => Math.random().toString(36).slice(2,9);

export const mLine = () => ({ id:uid(), itemCode:"", qty:"", price:"", disc:"0", recQty:"", accQty:"", rolls:"", lot:"" });

export const fmtINR = v => `₹ ${v.toLocaleString("en-IN",{minimumFractionDigits:2})}`;
