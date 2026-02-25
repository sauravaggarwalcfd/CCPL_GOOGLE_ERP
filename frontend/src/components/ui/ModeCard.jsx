export default function ModeCard({m,active,A,onClick}){
  return(
    <div onClick={onClick} style={{width:"100%",border:`2px solid ${active?A.a:m.divider}`,borderRadius:8,overflow:"hidden",cursor:"pointer",background:active?A.al:"transparent",transition:"all .15s"}}>
      <div style={{height:56,background:m.bg,overflow:"hidden"}}>
        <div style={{height:9,background:m.shellBg,borderBottom:`1px solid ${m.shellBd}`,display:"flex",alignItems:"center",gap:2,padding:"0 4px"}}>
          <div style={{width:6,height:4,borderRadius:1,background:A.a}}/><div style={{width:12,height:2,borderRadius:1,background:m.textD}}/>
        </div>
        <div style={{display:"flex",height:47}}>
          <div style={{width:16,background:m.sidebarBg,borderRight:`1px solid ${m.sidebarBd}`,padding:"2px",display:"flex",flexDirection:"column",gap:1}}>
            {[0,1,2,3].map(i=><div key={i} style={{height:3,borderRadius:1,background:i===0?A.a:m.textD,opacity:i===0?1:.4}}/>)}
          </div>
          <div style={{flex:1,padding:"3px 4px",display:"flex",flexDirection:"column",gap:2}}>
            <div style={{display:"flex",gap:2}}>{[0,1,2,3].map(i=><div key={i} style={{flex:1,height:7,borderRadius:2,background:m.surfHigh,border:`1px solid ${m.divider}`}}/>)}</div>
            <div style={{height:20,borderRadius:2,background:m.surfHigh,border:`1px solid ${m.divider}`}}/>
          </div>
        </div>
      </div>
      <div style={{padding:"5px 6px",background:active?A.al:m.surfMid,display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:10}}>{m.lbl}</span>
        <span style={{fontSize:9,fontWeight:700,color:active?A.a:m.textB}}>{m.name}</span>
        {active&&<span style={{marginLeft:"auto",fontSize:7,fontWeight:900,color:A.a,letterSpacing:.5}}>ACTIVE</span>}
      </div>
    </div>
  );
}
