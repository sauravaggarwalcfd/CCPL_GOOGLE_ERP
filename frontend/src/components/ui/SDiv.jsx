export default function SDiv({label,M,first}){
  return <div style={{fontSize:9,fontWeight:900,letterSpacing:1.5,textTransform:"uppercase",color:M.textD,padding:first?"0 0 8px":"16px 0 8px",borderTop:first?"none":`1px solid ${M.divider}`,fontFamily:"inherit"}}>{label}</div>;
}
