export default function Tile({mod,M,A,fz,onClick,hov,onHov}){
  return(
    <div onClick={()=>onClick(mod.id)} onMouseEnter={()=>onHov(mod.id)} onMouseLeave={()=>onHov(null)}
      style={{background:hov?M.surfMid:M.surfHigh,border:hov?`1px solid ${mod.col}50`:`1px solid ${M.divider}`,borderRadius:10,padding:"18px 18px 14px",cursor:"pointer",transition:"all .18s ease",position:"relative",boxShadow:hov?`0 6px 24px ${mod.col}20`:"none",transform:hov?"translateY(-2px)":"none"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:hov?mod.col:"transparent",borderRadius:"10px 10px 0 0",transition:"background .18s"}}/>
      {mod.badge>0&&<div style={{position:"absolute",top:11,right:11,minWidth:18,height:18,borderRadius:9,background:"#ef4444",color:"#fff",fontSize:9,fontWeight:900,padding:"0 5px",display:"flex",alignItems:"center",justifyContent:"center"}}>{mod.badge}</div>}
      <div style={{fontSize:26,marginBottom:8}}>{mod.icon}</div>
      <div style={{fontSize:fz,fontWeight:900,color:M.textA,marginBottom:2}}>{mod.lbl}</div>
      <div style={{fontSize:fz-2,color:M.textC,marginBottom:10,lineHeight:1.4}}>{mod.desc}</div>
      {mod.stats && <div style={{display:"flex",gap:10,borderTop:`1px solid ${M.divider}`,paddingTop:8}}>
        {mod.stats.pend>0&&<div style={{display:"flex",flexDirection:"column",gap:1}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Pending</span>
          <span style={{fontSize:13,fontWeight:900,color:"#ef4444",fontFamily:"'IBM Plex Mono',monospace"}}>{mod.stats.pend}</span>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:1}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Today</span>
          <span style={{fontSize:12,fontWeight:700,color:M.textB,fontFamily:"'IBM Plex Mono',monospace"}}>{mod.stats.today}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:1,marginLeft:"auto",textAlign:"right"}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Value</span>
          <span style={{fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",color:hov?mod.col:M.textB,transition:"color .18s"}}>{mod.stats.val}</span>
        </div>
      </div>}
    </div>
  );
}
