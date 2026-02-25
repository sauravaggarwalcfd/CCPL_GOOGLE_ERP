export default function Chip({label,active,onClick,A,M}){
  return <button onClick={onClick} style={{padding:"5px 13px",border:`1.5px solid ${active?A.a:M.inputBd}`,borderRadius:20,background:active?A.a:M.inputBg,color:active?A.tx:M.textB,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>{label}</button>;
}
