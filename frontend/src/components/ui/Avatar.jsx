import { useState } from 'react';
import { ROLE_C, ROLE_K } from '../../constants/roles';
import { aColor, ini, ago } from '../../utils/helpers';

export default function Avatar({user,isSelf,M,A,uff}){
  const [hov,setHov]=useState(false);
  const dot=user.status==="active"?"#22c55e":user.status==="idle"?"#f59e0b":"#6b7280";
  return(
    <div style={{position:"relative"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{width:28,height:28,borderRadius:"50%",background:isSelf?A.a:aColor(user.email),color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,position:"relative",border:`2px solid ${isSelf?A.a:"transparent"}`,boxShadow:isSelf?`0 0 0 2px ${A.al},0 2px 8px rgba(0,0,0,.2)`:"0 1px 4px rgba(0,0,0,.18)",transform:hov?"scale(1.12)":"scale(1)",transition:"transform .15s",fontFamily:uff}}>
        {ini(user.name)}
        {!isSelf&&<div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:dot,border:`1.5px solid ${M.shellBg}`}}/>}
      </div>
      {hov&&(
        <div className="dd-anim" style={{position:"absolute",top:36,right:0,width:240,background:M.dropBg,border:`1px solid ${M.divider}`,borderRadius:8,boxShadow:M.shadow,zIndex:9999,padding:12,fontFamily:uff}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:isSelf?A.a:aColor(user.email),color:"#fff",fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ini(user.name)}</div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:12,fontWeight:800,color:M.textA}}>{user.name}</span>
                {isSelf&&<span style={{fontSize:8,fontWeight:900,background:A.a,color:"#fff",borderRadius:3,padding:"1px 5px"}}>YOU</span>}
              </div>
              <div style={{fontSize:9,color:M.textC,marginTop:1}}>{user.email}</div>
            </div>
          </div>
          <div style={{borderTop:`1px solid ${M.divider}`,paddingTop:8,display:"flex",flexDirection:"column",gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:dot}}/><span style={{fontSize:10,color:M.textB,fontWeight:600}}>{user.status==="active"?"Active now":"Idle"}</span></div>
            <div style={{fontSize:10,color:M.textC}}>{user.module} › <span style={{fontFamily:"'IBM Plex Mono',monospace",color:M.textB}}>{user.page}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
              <span style={{fontSize:8,fontWeight:900,padding:"2px 5px",borderRadius:3,background:ROLE_C[user.role]+"22",color:ROLE_C[user.role],letterSpacing:.5}}>{ROLE_K[user.role]}</span>
              <span style={{fontSize:9,color:M.textD}}>{ago(user.ts)} ago</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
