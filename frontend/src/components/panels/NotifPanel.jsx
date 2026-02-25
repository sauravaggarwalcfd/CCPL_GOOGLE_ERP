import { useState } from 'react';
import { NOTIF_C, NOTIF_BG } from '../../constants/roles';
import { ago } from '../../utils/helpers';
import api from '../../services/api';

export default function NotifPanel({notifs,setNotifs,M,A,uff,fz,onClose}){
  const [replyId,  setReplyId]  = useState(null);
  const [replyTxt, setReplyTxt] = useState("");
  const [expanded, setExpanded] = useState(null);

  const unread = notifs.filter(n=>!n.read).length;

  const markRead  = id => { setNotifs(ns=>ns.map(n=>n.id===id?{...n,read:true,status:"read"}:n)); api.markNotificationRead(id).catch(()=>{}); };
  const dismiss   = id => { setNotifs(ns=>ns.filter(n=>n.id!==id)); api.dismissNotification(id).catch(()=>{}); };
  const approve   = id => { setNotifs(ns=>ns.map(n=>n.id===id?{...n,read:true,status:"actioned",actionTaken:"approve"}:n)); api.markNotificationRead(id).catch(()=>{}); };
  const reject    = id => { setNotifs(ns=>ns.map(n=>n.id===id?{...n,read:true,status:"actioned",actionTaken:"reject"}:n)); api.markNotificationRead(id).catch(()=>{}); };
  const sendReply = id => { if(!replyTxt.trim())return; setNotifs(ns=>ns.map(n=>n.id===id?{...n,read:true,status:"actioned",actionTaken:"reply",replyText:replyTxt}:n)); api.markNotificationRead(id).catch(()=>{}); setReplyId(null); setReplyTxt(""); };
  const markAllRead = () => { setNotifs(ns=>ns.map(n=>({...n,read:true,status:n.status==="unread"?"read":n.status}))); notifs.filter(n=>!n.read).forEach(n=>api.markNotificationRead(n.id).catch(()=>{})); };

  const TYPE_L = {action:"ACTION REQUIRED",warning:"WARNING",info:"INFO",system:"SYSTEM"};

  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:498}}/>
      <div className="dd-anim" style={{
        position:"absolute",top:52,right:0,width:420,maxHeight:"calc(100vh - 80px)",
        background:M.dropBg,border:`1px solid ${M.divider}`,borderRadius:10,
        boxShadow:M.shadow,zIndex:499,display:"flex",flexDirection:"column",
        fontFamily:uff,overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${M.divider}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:fz,fontWeight:900,color:M.textA}}>🔔 Notifications</span>
              {unread>0&&<div style={{minWidth:20,height:20,borderRadius:10,background:"#ef4444",color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{unread}</div>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {unread>0&&<button onClick={markAllRead} style={{fontSize:9,fontWeight:700,color:A.a,background:"none",border:"none",cursor:"pointer",fontFamily:uff}}>Mark all read</button>}
              <button onClick={onClose} style={{width:26,height:26,borderRadius:5,border:`1px solid ${M.divider}`,background:M.surfMid,color:M.textC,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
          </div>
          {/* Filter tabs */}
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {[["All",notifs.length],["Unread",unread],["Action",notifs.filter(n=>n.type==="action").length]].map(([lbl,cnt])=>(
              <div key={lbl} style={{fontSize:9,fontWeight:700,color:M.textC,background:M.surfMid,border:`1px solid ${M.divider}`,borderRadius:12,padding:"2px 8px",cursor:"pointer",display:"flex",gap:4,alignItems:"center"}}>
                {lbl} {cnt>0&&<span style={{fontSize:8,fontWeight:900,color:M.textD}}>{cnt}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{overflowY:"auto",flex:1}}>
          {notifs.length===0&&(
            <div style={{padding:32,textAlign:"center",color:M.textD}}>
              <div style={{fontSize:32,marginBottom:8}}>🎉</div>
              <div style={{fontSize:12,fontWeight:700}}>All caught up!</div>
              <div style={{fontSize:10,marginTop:4}}>No notifications</div>
            </div>
          )}
          {notifs.map((n)=>{
            const isExp   = expanded===n.id;
            const isReply = replyId===n.id;
            const actioned= n.status==="actioned";
            const tc = NOTIF_C[n.type];
            const tbg= NOTIF_BG[n.type];
            return(
              <div key={n.id} style={{
                borderBottom:`1px solid ${M.divider}`,
                borderLeft:`3px solid ${actioned?M.divider:tc}`,
                background:n.read?M.surfHigh:tbg,
                opacity:actioned?.7:1,
                transition:"all .18s",
              }}>
                {/* Main row */}
                <div style={{padding:"11px 14px 8px",cursor:"pointer"}}
                  onClick={()=>{setExpanded(isExp?null:n.id);if(!n.read)markRead(n.id);}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:actioned?M.textD:tc,flexShrink:0,marginTop:3}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontSize:8,fontWeight:900,letterSpacing:.5,
                          background:actioned?M.badgeBg:tc+"20",color:actioned?M.textD:tc,
                          padding:"1px 5px",borderRadius:3,textTransform:"uppercase",flexShrink:0}}>
                          {actioned?`✓ ${n.actionTaken?.toUpperCase()||"DONE"}`:TYPE_L[n.type]}
                        </span>
                        <span style={{fontSize:8,fontFamily:"'IBM Plex Mono',monospace",color:M.textD,marginLeft:"auto",flexShrink:0}}>{ago(n.ts)}</span>
                        {!n.read&&<div style={{width:6,height:6,borderRadius:"50%",background:tc,flexShrink:0}}/>}
                      </div>
                      <div style={{fontSize:fz-1,fontWeight:n.read?600:800,color:M.textA,marginBottom:2,lineHeight:1.3}}>{n.title}</div>
                      <div style={{fontSize:9,color:M.textC}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",color:A.a,fontWeight:600}}>{n.module}</span>
                        {n.ref&&<> · <span style={{fontFamily:"'IBM Plex Mono',monospace"}}>{n.ref}</span></>}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExp&&(
                    <div style={{marginTop:8,padding:"8px 10px",background:M.surfMid,borderRadius:6,border:`1px solid ${M.divider}`,fontSize:11,color:M.textB,lineHeight:1.6}}>
                      {n.detail}
                      {n.replyText&&(
                        <div style={{marginTop:6,padding:"6px 8px",background:A.al,borderRadius:4,borderLeft:`2px solid ${A.a}`,fontSize:10,color:M.textA}}>
                          💬 <strong>Your reply:</strong> {n.replyText}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons row */}
                {!actioned&&(
                  <div style={{padding:"0 14px 10px",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    {n.actions.includes("approve")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();approve(n.id);}} style={{
                        padding:"4px 12px",borderRadius:5,border:"none",
                        background:"#15803D",color:"#fff",fontSize:10,fontWeight:800,
                        cursor:"pointer",fontFamily:uff,display:"flex",alignItems:"center",gap:4,transition:"filter .15s"
                      }}>✅ Approve</button>
                    )}
                    {n.actions.includes("reject")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();reject(n.id);}} style={{
                        padding:"4px 12px",borderRadius:5,border:"none",
                        background:"#ef4444",color:"#fff",fontSize:10,fontWeight:800,
                        cursor:"pointer",fontFamily:uff,display:"flex",alignItems:"center",gap:4,transition:"filter .15s"
                      }}>❌ Reject</button>
                    )}
                    {n.actions.includes("reply")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();setReplyId(isReply?null:n.id);setReplyTxt("");}} style={{
                        padding:"4px 12px",borderRadius:5,border:`1px solid ${M.divider}`,
                        background:isReply?A.al:M.surfMid,color:isReply?A.a:M.textB,fontSize:10,fontWeight:700,
                        cursor:"pointer",fontFamily:uff,display:"flex",alignItems:"center",gap:4,transition:"all .15s"
                      }}>💬 Reply</button>
                    )}
                    {n.actions.includes("view")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();markRead(n.id);setExpanded(n.id);}} style={{
                        padding:"4px 12px",borderRadius:5,border:`1px solid ${M.divider}`,
                        background:M.surfMid,color:M.textC,fontSize:10,fontWeight:700,
                        cursor:"pointer",fontFamily:uff,transition:"filter .15s"
                      }}>👁 View</button>
                    )}
                    {n.ref&&(
                      <button className="notif-action-btn"
                        onClick={e=>{
                          e.stopPropagation();
                          markRead(n.id);
                          alert(`GAS will open:\n\nModule: ${n.module}\nRecord: ${n.ref}\n\nIn live ERP → opens Google Sheet file, scrolls to row for ${n.ref}`);
                        }}
                        style={{
                          padding:"4px 12px",borderRadius:5,
                          border:`1.5px solid ${A.a}`,
                          background:A.al,color:A.a,fontSize:10,fontWeight:800,
                          cursor:"pointer",fontFamily:uff,
                          display:"flex",alignItems:"center",gap:5,
                          transition:"filter .15s",marginLeft:"auto",
                        }}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>{n.ref}</span>
                        <span>→ Open Record</span>
                      </button>
                    )}
                    {n.actions.includes("dismiss")&&(
                      <button className="notif-action-btn" onClick={e=>{e.stopPropagation();dismiss(n.id);}} style={{
                        padding:"4px 10px",borderRadius:5,border:`1px solid ${M.divider}`,
                        background:"transparent",color:M.textD,fontSize:10,fontWeight:700,
                        cursor:"pointer",fontFamily:uff,marginLeft:"auto",transition:"filter .15s"
                      }}>✕ Dismiss</button>
                    )}
                  </div>
                )}

                {/* Reply input */}
                {isReply&&!actioned&&(
                  <div style={{padding:"0 14px 12px",display:"flex",gap:8,alignItems:"flex-end"}}>
                    <div style={{flex:1,background:M.inputBg,border:`1.5px solid ${A.a}`,borderRadius:7,padding:"7px 10px"}}>
                      <textarea
                        autoFocus
                        value={replyTxt}
                        onChange={e=>setReplyTxt(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendReply(n.id);}if(e.key==="Escape"){setReplyId(null);}}}
                        placeholder="Type your reply… (Enter to send, Shift+Enter for newline)"
                        style={{width:"100%",resize:"none",background:"transparent",border:"none",outline:"none",fontSize:11,color:M.textA,fontFamily:uff,lineHeight:1.5,minHeight:52}}
                      />
                    </div>
                    <button onClick={()=>sendReply(n.id)} style={{
                      padding:"8px 14px",borderRadius:7,border:"none",
                      background:A.a,color:"#fff",fontSize:11,fontWeight:800,
                      cursor:"pointer",fontFamily:uff,flexShrink:0,
                    }}>Send ↵</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{padding:"8px 16px",borderTop:`1px solid ${M.divider}`,background:M.surfMid,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:9,color:M.textD,fontFamily:"'IBM Plex Mono',monospace"}}>NTF sheet · FILE 1B · GAS-managed</span>
          <button style={{fontSize:10,fontWeight:700,color:A.a,background:"none",border:"none",cursor:"pointer",fontFamily:uff}}>View All →</button>
        </div>
      </div>
    </>
  );
}
