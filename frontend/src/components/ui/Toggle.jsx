export default function Toggle({on,onChange,A,M}){
  return <div onClick={()=>onChange(!on)} style={{width:40,height:22,borderRadius:11,background:on?A.a:M.inputBd,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
    <div style={{position:"absolute",top:2,left:on?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
  </div>;
}
