import { useState, useEffect, useRef } from 'react';
import { CMD_INDEX } from '../../constants/modules';
import { fuzzy } from '../../utils/helpers';

export default function CmdPalette({M,A,uff,fz,shortcuts,setShortcuts,onClose,onModSelect,onCfgOpen}){
  const [q, setQ]     = useState("");
  const [sel,setSel]  = useState(0);
  const inputRef      = useRef(null);

  useEffect(()=>{ inputRef.current?.focus(); },[]);

  const isPinned = id => shortcuts.some(s=>s.mod===id||s.id===id);
  const pin = (item) => {
    if(isPinned(item.id))return;
    setShortcuts(sc=>[...sc,{id:`sc${Date.now()}`,icon:item.icon,label:item.label,mod:item.id||item.mod||"",sub:item.group}]);
  };

  const filtered = CMD_INDEX.filter(c=>fuzzy(q,c.label+" "+c.sub+" "+c.group));
  const groups = [...new Set(filtered.map(c=>c.group))];

  const flat = filtered;
  const handleKey = e => {
    if(e.key==="ArrowDown"){e.preventDefault();setSel(s=>Math.min(s+1,flat.length-1));}
    if(e.key==="ArrowUp")  {e.preventDefault();setSel(s=>Math.max(s-1,0));}
    if(e.key==="Enter")    {e.preventDefault(); handleSelect(flat[sel]);}
    if(e.key==="Escape")   {onClose();}
  };
  const handleSelect = item => {
    if(!item)return;
    if(item.type==="module")  onModSelect(item.id);
    if(item.id==="open-cfg")  onCfgOpen();
    onClose();
  };

  let flatIdx = 0;

  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:800,background:"rgba(0,0,0,.5)",backdropFilter:"blur(3px)"}}/>
      <div className="cmd-anim" style={{
        position:"fixed",top:"18%",left:"50%",transform:"translateX(-50%)",
        width:580,maxWidth:"94vw",
        background:M.dropBg,borderRadius:12,border:`1px solid ${M.divider}`,
        boxShadow:`0 24px 60px rgba(0,0,0,.35)`,zIndex:801,overflow:"hidden",
        fontFamily:uff,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:`1px solid ${M.divider}`,background:M.shellBg}}>
          <span style={{fontSize:16,flexShrink:0}}>🔍</span>
          <input
            ref={inputRef}
            value={q} onChange={e=>{setQ(e.target.value);setSel(0);}}
            onKeyDown={handleKey}
            placeholder="Search modules, actions, records, settings…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",
              fontSize:fz+1,color:M.textA,fontFamily:uff,}}
          />
          <div style={{padding:"2px 7px",borderRadius:4,background:M.badgeBg,fontSize:9,fontWeight:700,color:M.textD,flexShrink:0,fontFamily:"'IBM Plex Mono',monospace"}}>ESC</div>
        </div>

        <div style={{maxHeight:380,overflowY:"auto"}}>
          {filtered.length===0&&(
            <div style={{padding:24,textAlign:"center",color:M.textD,fontSize:11}}>No results for "{q}"</div>
          )}
          {groups.map(grp=>{
            const items = filtered.filter(c=>c.group===grp);
            return(
              <div key={grp}>
                <div style={{padding:"7px 16px 4px",fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1.2,textTransform:"uppercase",borderBottom:`1px solid ${M.divider}`,background:M.surfMid}}>{grp}</div>
                {items.map(item=>{
                  const idx = flatIdx++;
                  const isSelected = idx===sel;
                  const pinned = isPinned(item.id);
                  return(
                    <div key={item.id} onClick={()=>handleSelect(item)}
                      onMouseEnter={()=>setSel(idx)}
                      style={{
                        display:"flex",alignItems:"center",gap:12,padding:"9px 16px",
                        background:isSelected?A.al:M.surfHigh,
                        borderLeft:isSelected?`3px solid ${A.a}`:"3px solid transparent",
                        cursor:"pointer",borderBottom:`1px solid ${M.divider}`,
                        transition:"background .08s",
                      }}>
                      <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:fz-1,fontWeight:700,color:isSelected?A.a:M.textA}}>{item.label}</div>
                        <div style={{fontSize:9,color:M.textC}}>{item.sub}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();pin(item);}} style={{
                        width:26,height:26,borderRadius:5,border:`1px solid ${pinned?A.a:M.divider}`,
                        background:pinned?A.al:"transparent",color:pinned?A.a:M.textD,
                        cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all .15s",flexShrink:0,
                      }} title={pinned?"Already in Quick Access":"Pin to Quick Access"}>{pinned?"⭐":"☆"}</button>
                      {isSelected&&<div style={{padding:"2px 6px",borderRadius:4,background:M.badgeBg,fontSize:9,fontWeight:700,color:M.textD,fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>↵</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{padding:"7px 16px",borderTop:`1px solid ${M.divider}`,background:M.surfMid,display:"flex",gap:14,alignItems:"center"}}>
          {[["↑↓","Navigate"],["↵","Open"],["☆","Pin to Quick Access"],["ESC","Close"]].map(([key,lbl])=>(
            <div key={key} style={{display:"flex",gap:5,alignItems:"center"}}>
              <span style={{fontSize:9,fontFamily:"'IBM Plex Mono',monospace",background:M.badgeBg,padding:"1px 5px",borderRadius:3,color:M.textB,fontWeight:700}}>{key}</span>
              <span style={{fontSize:9,color:M.textD}}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
