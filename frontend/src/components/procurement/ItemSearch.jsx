import { useState, useEffect, useRef } from 'react';
import { ITEMS, ITEM_IMGS, CAT_ICON, CAT_CLR } from '../../constants/procurement';

export default function ItemSearch({ value, onChange, M, A, fz, py: pyV, showThumbs }) {
  const [q, setQ]       = useState("");
  const [open, setOpen] = useState(false);
  const [errs, setErrs] = useState({});
  const ref = useRef(null);
  const selItem = ITEMS.find(i => i.code === value);
  const filtered = q.length >= 1
    ? ITEMS.filter(i => i.code.toLowerCase().includes(q.toLowerCase()) || i.name.toLowerCase().includes(q.toLowerCase()))
    : ITEMS;
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const imgOf = code => ITEM_IMGS[code] && !errs[code];
  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", border:`1px solid ${open ? A.a : M.inputBd}`, borderRadius:3, background:M.inputBg, overflow:"hidden", transition:"border-color .15s", boxShadow: open ? `0 0 0 2px ${A.al}` : "none" }}>
        {showThumbs && selItem && !open && (
          <div style={{ width:28, height:28, flexShrink:0, borderRight:`1px solid ${M.divider}`, overflow:"hidden", background:M.surfMid, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {imgOf(selItem.code) ? <img src={ITEM_IMGS[selItem.code]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setErrs(p=>({...p,[selItem.code]:true}))} /> : <span style={{ fontSize:14 }}>{CAT_ICON[selItem.cat]}</span>}
          </div>
        )}
        <input
          style={{ flex:1, padding:`${pyV}px 9px`, border:"none", background:"transparent", color:M.textA, fontSize:fz, fontFamily:"'Nunito Sans',sans-serif", outline:"none" }}
          placeholder={selItem && !open ? selItem.name : "Search code / name\u2026"}
          value={open ? q : ""}
          onFocus={() => setOpen(true)}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
        />
        {value && !open && <button onClick={() => { onChange(""); setQ(""); }} style={{ border:"none", background:"none", color:M.textD, cursor:"pointer", padding:"0 8px", fontSize:16, lineHeight:1 }}>&times;</button>}
        <button onClick={() => setOpen(o => !o)} style={{ border:"none", background:M.surfMid, color:M.textC, cursor:"pointer", padding:"0 10px", height:"100%", fontSize:10, borderLeft:`1px solid ${M.divider}` }}>&blacktriangledown;</button>
      </div>
      {open && (
        <div className="dd-anim" style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:9999, background:M.dropBg, border:`1px solid ${M.inputBd}`, borderRadius:4, boxShadow:M.shadow, maxHeight:300, overflowY:"auto" }}>
          {filtered.length === 0
            ? <div style={{ padding:14, color:M.textD, fontSize:12 }}>No items match "{q}"</div>
            : filtered.map(it => (
              <div key={it.code} onClick={() => { onChange(it.code); setQ(""); setOpen(false); }}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 12px", cursor:"pointer", borderBottom:`1px solid ${M.divider}`, background:M.dropBg, transition:"background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = M.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = M.dropBg}>
                {showThumbs && (
                  <div style={{ width:34, height:34, borderRadius:3, overflow:"hidden", flexShrink:0, background:M.surfMid, border:`1px solid ${M.divider}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {imgOf(it.code) ? <img src={ITEM_IMGS[it.code]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"} /> : <span style={{ fontSize:18 }}>{CAT_ICON[it.cat]}</span>}
                  </div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:fz-1, fontWeight:700, color:M.textA, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{it.name}</div>
                  <div style={{ fontSize:10, color:M.textC, marginTop:1 }}>{it.code} &middot; {it.uom} &middot; HSN {it.hsn} &middot; GST {it.gst}%</div>
                </div>
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99, background:`${CAT_CLR[it.cat]}20`, color:CAT_CLR[it.cat], fontWeight:800, flexShrink:0 }}>{it.cat}</span>
              </div>
            ))}
        </div>
      )}
      {selItem && !open && (
        <div className="sc-anim" style={{ marginTop:5, display:"flex", alignItems:"center", gap:9, padding:"7px 10px", background:A.al, border:`1px solid ${A.a}40`, borderRadius:3, borderLeft:`3px solid ${A.a}` }}>
          {showThumbs && (
            <div style={{ width:38, height:38, borderRadius:3, overflow:"hidden", flexShrink:0, background:M.surfMid, border:`1px solid ${M.divider}` }}>
              {imgOf(selItem.code) ? <img src={ITEM_IMGS[selItem.code]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={()=>setErrs(p=>({...p,[selItem.code]:true}))} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{CAT_ICON[selItem.cat]}</div>}
            </div>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:fz-1, fontWeight:800, color:M.textA }}>{selItem.name}</div>
            <div style={{ fontSize:10, color:M.textB, marginTop:1 }}>{selItem.code} &middot; {selItem.uom} &middot; HSN {selItem.hsn} &middot; GST {selItem.gst}%</div>
          </div>
          <span style={{ fontSize:9, padding:"2px 8px", borderRadius:99, background:CAT_CLR[selItem.cat], color:"#fff", fontWeight:800 }}>{selItem.cat}</span>
        </div>
      )}
    </div>
  );
}
