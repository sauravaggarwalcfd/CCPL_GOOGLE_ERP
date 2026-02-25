import { useState } from 'react';
import { MODES, ACCENTS } from '../../constants/themes';
import { DEFAULTS, SW_PRESETS } from '../../constants/defaults';
import { UI_FONTS, DATA_FONTS } from '../../constants/fonts';
import Chip from '../ui/Chip';
import Toggle from '../ui/Toggle';
import ModeCard from '../ui/ModeCard';
import SDiv from '../ui/SDiv';

export default function SettingsPanel({M,A,cfg,onApply,onClose}){
  const [draft,setDraft]=useState({...cfg});
  const set=(k,v)=>setDraft(d=>({...d,[k]:v}));
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:498,background:"rgba(0,0,0,.45)",backdropFilter:"blur(2px)"}}/>
      <div className="sp-anim" style={{position:"fixed",top:0,right:0,width:420,height:"100vh",background:M.dropBg,borderLeft:`1px solid ${M.divider}`,boxShadow:M.shadow,zIndex:499,display:"flex",flexDirection:"column",fontFamily:"inherit"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${M.divider}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:15,fontWeight:900,color:M.textA}}>⚙ Workspace Settings</div>
              <div style={{fontSize:10,color:M.textC,marginTop:2}}>Personalise your ERP interface</div>
            </div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:6,border:`1px solid ${M.divider}`,background:M.surfMid,color:M.textC,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"4px 20px 20px"}}>
          {/* Colour Mode */}
          <SDiv label="Colour Mode" M={M} first/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:4}}>
            {Object.values(MODES).map(m=><ModeCard key={m.id} m={m} active={draft.mode===m.id} A={ACCENTS[draft.accent]} onClick={()=>set("mode",m.id)}/>)}
          </div>
          {/* Accent */}
          <SDiv label="Accent Colour" M={M}/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {Object.values(ACCENTS).map(ac=>(
              <button key={ac.id} onClick={()=>set("accent",ac.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",border:`2px solid ${draft.accent===ac.id?ac.a:M.divider}`,borderRadius:7,background:draft.accent===ac.id?ac.al:M.surfMid,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:ac.a,flexShrink:0,border:`2px solid ${draft.accent===ac.id?M.textA:"transparent"}`,transition:"border .15s"}}/>
                <span style={{fontSize:11,fontWeight:700,color:M.textB,flex:1}}>{ac.lbl}</span>
                <div style={{width:40,height:12,borderRadius:6,background:ac.a,opacity:.25}}/>
                {draft.accent===ac.id&&<span style={{fontSize:8,fontWeight:900,color:ac.a,letterSpacing:.5}}>ACTIVE</span>}
              </button>
            ))}
          </div>
          {/* Typography & Density */}
          <SDiv label="Typography & Density" M={M}/>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:9,fontWeight:900,color:M.textC,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Font Size</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["small","Small (11px)"],["medium","Medium (13px)"],["large","Large (15px)"]].map(([v,l])=><Chip key={v} label={l} active={draft.fontSize===v} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("fontSize",v)}/>)}</div>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:900,color:M.textC,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Row Density</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["compact","Compact"],["comfortable","Comfortable"],["spacious","Spacious"]].map(([v,l])=><Chip key={v} label={l} active={draft.density===v} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("density",v)}/>)}</div>
          </div>
          {/* Font Family */}
          <SDiv label="Font Family" M={M}/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:900,color:M.textC,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>UI Body Font</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {UI_FONTS.map(f=>{const ac=ACCENTS[draft.accent];const active=draft.uiFont===f.id;return(
                <button key={f.id} onClick={()=>set("uiFont",f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:`2px solid ${active?ac.a:M.divider}`,borderRadius:7,background:active?ac.al:M.surfMid,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:f.family,fontSize:14,fontWeight:700,color:active?ac.a:M.textA,lineHeight:1.2}}>{f.name}</div>
                    <div style={{fontFamily:f.family,fontSize:10,color:M.textC,marginTop:2}}>The quick brown fox — ERP data entry</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:8,fontWeight:800,color:M.textD,letterSpacing:.5}}>{f.tag}</div>
                    {active&&<div style={{fontSize:8,fontWeight:900,color:ac.a,marginTop:2,letterSpacing:.5}}>ACTIVE</div>}
                  </div>
                </button>
              );})}
            </div>
          </div>
          <div style={{marginBottom:4}}>
            <div style={{fontSize:9,fontWeight:900,color:M.textC,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>Data & Codes Font (Monospace)</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {DATA_FONTS.map(f=>{const ac=ACCENTS[draft.accent];const active=draft.dataFont===f.id;return(
                <button key={f.id} onClick={()=>set("dataFont",f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:`2px solid ${active?ac.a:M.divider}`,borderRadius:7,background:active?ac.al:M.surfMid,cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:f.family,fontSize:13,fontWeight:600,color:active?ac.a:M.textA,lineHeight:1.2}}>{f.name}</div>
                    <div style={{fontFamily:f.family,fontSize:10,color:M.textC,marginTop:2}}>PO-2026-0042 · Rs.48,500 · GST 18%</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:8,fontWeight:800,color:M.textD,letterSpacing:.5}}>{f.tag}</div>
                    {active&&<div style={{fontSize:8,fontWeight:900,color:ac.a,marginTop:2,letterSpacing:.5}}>ACTIVE</div>}
                  </div>
                </button>
              );})}
            </div>
          </div>
          {/* Table Style */}
          <SDiv label="Table Style" M={M}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["striped","Striped"],["bordered","Bordered"],["clean","Clean"]].map(([v,l])=><Chip key={v} label={l} active={draft.tblStyle===v} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("tblStyle",v)}/>)}</div>
          <div style={{marginTop:10,border:`1px solid ${M.divider}`,borderRadius:5,overflow:"hidden"}}>
            {["Header","Row 1","Row 2","Row 3"].map((lbl,i)=>{
              const isH=i===0; const bg=isH?M.tblHead:draft.tblStyle==="striped"?(i%2===1?M.tblEven:M.tblOdd):M.surfHigh;
              return <div key={i} style={{padding:"5px 10px",background:bg,borderBottom:`1px solid ${M.divider}`,display:"flex",gap:8,alignItems:"center"}}>
                <div style={{width:24,height:4,borderRadius:2,background:isH?ACCENTS[draft.accent].a:M.textD,opacity:.4}}/>
                <div style={{flex:1,height:4,borderRadius:2,background:M.textD,opacity:.3}}/>
                <div style={{width:40,height:4,borderRadius:2,background:M.textD,opacity:.25}}/>
              </div>;
            })}
          </div>
          {/* Line Item View */}
          <SDiv label="Line Item View" M={M}/>
          <div style={{display:"flex",gap:6}}>{[["table","📋 Table"],["cards","🃏 Cards"]].map(([v,l])=><Chip key={v} label={l} active={draft.lineView===v} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("lineView",v)}/>)}</div>
          {/* Sidebar Width */}
          <SDiv label="Sidebar Width" M={M}/>
          <div style={{display:"flex",gap:6}}>{SW_PRESETS.map(w=><Chip key={w} label={`${w}px`} active={draft.sbWidth===w} A={ACCENTS[draft.accent]} M={M} onClick={()=>set("sbWidth",w)}/>)}</div>
          <div style={{marginTop:8,fontSize:10,color:M.textC}}>Drag the sidebar edge to resize manually.</div>
          {/* Display Toggles */}
          <SDiv label="Display Toggles" M={M}/>
          {[["showStatusBar","Show Status Bar","Totals bar at the bottom of every module"],["showThumbs","Show Thumbnails","Item image thumbnails in search dropdowns & tables"],["showRowNums","Show Row Numbers","# column with sequential row numbers in tables"],["showCatBadge","Show Category Badges","Coloured category pills on item rows"],["compactSide","Compact Sidebar","Show icons only — no labels (saves space)"]].map(([key,label,sub],i,arr)=>(
            <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${M.divider}`:"none"}}>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:M.textA}}>{label}</div><div style={{fontSize:10,color:M.textC,marginTop:2}}>{sub}</div></div>
              <Toggle on={!!draft[key]} onChange={v=>set(key,v)} A={ACCENTS[draft.accent]} M={M}/>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{padding:"14px 20px",borderTop:`1px solid ${M.divider}`,background:M.surfMid,flexShrink:0,display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>setDraft({...DEFAULTS})} style={{width:"100%",padding:"8px",borderRadius:6,border:`1px solid ${M.divider}`,background:"transparent",color:M.textC,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>↩ Reset Defaults</button>
          <button onClick={()=>{onApply(draft);onClose();}} style={{width:"100%",padding:"9px",borderRadius:6,border:"none",background:ACCENTS[draft.accent].a,color:"#fff",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>✓ Apply & Close</button>
        </div>
      </div>
    </>
  );
}
