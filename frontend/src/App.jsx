import { useState, useEffect, useCallback } from 'react';
import { MODES, ACCENTS } from './constants/themes';
import { DEFAULTS, FS_MAP, PY_MAP } from './constants/defaults';
import { MODS as MODS_INIT } from './constants/modules';
import { ROLE_C, ROLE_K } from './constants/roles';
import { uiFF, dataFF } from './constants/fonts';
import { aColor, ini, ago, greet, todayStr, timeStr } from './utils/helpers';
import { Avatar } from './components/ui';
import { Tile } from './components/modules';
import { NotifPanel, CmdPalette, SettingsPanel } from './components/panels';
import Procurement from './components/procurement/Procurement';
import { Masters } from './components/masters';
import { UsersPanel } from './components/users';
import api from './services/api';

export default function App(){
  const [cfg,     setCfg]     = useState({...DEFAULTS});
  const [cfgOpen, setCfgOpen] = useState(false);
  const [sw,      setSw]      = useState(DEFAULTS.sbWidth);
  const [drag,    setDrag]    = useState(false);
  const [actMod,  setActMod]  = useState(null);
  const [hovMod,  setHovMod]  = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [notifs,      setNotifs]    = useState([]);
  const [notifOpen,   setNotifOpen] = useState(false);
  const [cmdOpen,     setCmdOpen]   = useState(false);
  const [shortcuts,   setShortcuts] = useState([]);
  const [editSC,      setEditSC]    = useState(false);

  // ─ Live data state (fetched from GAS API)
  const [me,       setMe]       = useState(null);
  const [others,   setOthers]   = useState([]);
  const [activity, setActivity] = useState([]);
  const [mods,     setMods]     = useState(MODS_INIT);
  const [dashStats,setDashStats]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(null);

  const M   = MODES[cfg.mode];
  const A   = ACCENTS[cfg.accent];
  const fz  = FS_MAP[cfg.fontSize];
  const uff = uiFF(cfg.uiFont);
  const dff = dataFF(cfg.dataFont);

  const unreadCount = notifs.filter(n=>!n.read).length;

  useEffect(()=>{ setSw(cfg.sbWidth); },[cfg.sbWidth]);

  useEffect(()=>{
    let s=document.getElementById("_scr");
    if(!s){s=document.createElement("style");s.id="_scr";document.head.appendChild(s);}
    s.textContent=`::-webkit-scrollbar-thumb{background:${M.scrollThumb}}`;
  },[cfg.mode]);

  useEffect(()=>{
    const handler = e => {
      if((e.ctrlKey||e.metaKey)&&e.key==="k"){ e.preventDefault(); setCmdOpen(o=>!o); }
      if(e.key==="Escape"){ setCmdOpen(false); setNotifOpen(false); setCfgOpen(false); }
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  // ─ Fetch all data from GAS API on mount
  useEffect(()=>{
    let cancelled = false;
    async function fetchAll(){
      try {
        const [bootstrap, onlineUsers, notifData, activityData, statsData, shortcutData] = await Promise.allSettled([
          api.getUIBootstrap(),
          api.getOnlineUsers(),
          api.getNotifications(),
          api.getActivityFeed(),
          api.getDashboardStats(),
          api.getUserShortcuts(),
        ]);
        if (cancelled) return;

        if (bootstrap.status === "fulfilled" && bootstrap.value) {
          const b = bootstrap.value;
          if (b.user) setMe(b.user);
          // Server returns preferences.theme (not config)
          const serverTheme = b.config || (b.preferences && b.preferences.theme);
          if (serverTheme) setCfg(prev => ({...prev, ...serverTheme}));
          // Merge server modules with client MODS_INIT to preserve UI properties
          // (lbl, icon emoji, badge, col, desc, stats) that the server doesn't return
          if (b.modules && Array.isArray(b.modules)) {
            setMods(prev => prev.map(clientMod => {
              const serverMod = b.modules.find(sm => sm.id === clientMod.id);
              return serverMod ? { ...clientMod, ...serverMod, icon: clientMod.icon, lbl: clientMod.lbl, col: clientMod.col, desc: clientMod.desc, badge: serverMod.badge ?? clientMod.badge, stats: clientMod.stats } : clientMod;
            }));
          }
        }
        if (onlineUsers.status === "fulfilled" && onlineUsers.value) {
          setOthers(onlineUsers.value);
        }
        if (notifData.status === "fulfilled" && notifData.value) {
          setNotifs(notifData.value);
        }
        if (activityData.status === "fulfilled" && activityData.value) {
          setActivity(activityData.value);
        }
        if (statsData.status === "fulfilled" && statsData.value) {
          const s = statsData.value;
          // Transform API object {po:{...}, grn:{...}} into card array for dashboard
          const cards = [];
          if (s.po) cards.push({lbl:"Open POs", val:String(s.po.total||0), sub:`${s.po.draft||0} draft · ${s.po.approved||0} approved`, col:"#E8690A", icon:"📦"});
          if (s.grn) cards.push({lbl:"GRN", val:String(s.grn.total||0), sub:`${s.grn.pending||0} pending · ${s.grn.accepted||0} accepted`, col:"#0078D4", icon:"📥"});
          if (s.notifications) cards.push({lbl:"Notifications", val:String(s.notifications.total||0), sub:`${s.notifications.unread||0} unread`, col:"#7C3AED", icon:"🔔"});
          cards.push({lbl:"Online", val:String(s.onlineUsers||0), sub:"Active users", col:"#15803D", icon:"👥"});
          setDashStats(cards);
          // Update module badges with real counts
          if (s.po) {
            setMods(prev => prev.map(m => {
              if (m.id === "procurement") return {...m, badge: (s.po.draft||0) + (s.po.approved||0) + (s.po.sent||0)};
              return m;
            }));
          }
        }
        if (shortcutData.status === "fulfilled" && shortcutData.value) {
          setShortcuts(shortcutData.value);
        }
        // Check if ALL calls failed (API unreachable)
        const allFailed = [bootstrap, onlineUsers, notifData, activityData, statsData, shortcutData].every(r => r.status === "rejected");
        if (allFailed) {
          setApiError("Cannot connect to GAS API. Check VITE_GAS_URL and that the GAS web app is deployed.");
        }
      } catch(err) {
        console.error("Failed to load data from API:", err);
        setApiError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  },[]);

  // ─ Refresh online users every 30s
  useEffect(()=>{
    const interval = setInterval(async () => {
      try {
        const data = await api.getOnlineUsers();
        if (data) setOthers(data);
      } catch(e) { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  },[]);

  // ─ Heartbeat
  useEffect(()=>{
    const mod = actMod || "dashboard";
    const page = actMod ? "list" : "Home";
    api.heartbeat(mod, page).catch(()=>{});
    const interval = setInterval(()=>{
      api.heartbeat(mod, page).catch(()=>{});
    }, 30000);
    return ()=>clearInterval(interval);
  },[actMod]);

  const onDragStart=useCallback(e=>{
    e.preventDefault(); setDrag(true);
    const x0=e.clientX, w0=sw;
    const mv=ev=>setSw(Math.max(200,Math.min(520,w0+(ev.clientX-x0))));
    const up=()=>{setDrag(false);window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
  },[sw]);

  const collapsed   = cfg.compactSide;
  const totalOnline = others.length+1;
  const vis         = others.slice(0,3);
  const ovfl        = others.length-3;

  const removeShortcut = id => {
    setShortcuts(sc=>sc.filter(s=>s.id!==id));
    api.removeShortcut(id).catch(()=>{});
  };

  // ─ Default user when API hasn't loaded or returns empty
  const user = (me && me.name) ? me : {name:"User",email:"user@cc.com",role:"Admin",dept:""};

  // ─ Loading screen
  if (loading) {
    return (
      <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:M.bg,fontFamily:uff}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:48,height:48,borderRadius:10,background:A.a,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 16px"}}>📦</div>
          <div style={{fontSize:16,fontWeight:900,color:A.a,marginBottom:4}}>CC ERP</div>
          <div style={{fontSize:11,color:M.textC}}>Loading…</div>
        </div>
      </div>
    );
  }

  return(
    <div className="theme-anim" style={{width:"100vw",height:"100vh",overflow:"hidden",background:M.bg,display:"flex",flexDirection:"column",fontFamily:uff}}>

      {/* SHELL BAR */}
      <div style={{height:48,flexShrink:0,background:M.shellBg,borderBottom:`1px solid ${M.shellBd}`,display:"flex",alignItems:"center",padding:"0 10px 0 0",zIndex:200,position:"relative"}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 14px",height:"100%",borderRight:`1px solid ${M.shellBd}`,flexShrink:0}}>
          <div style={{width:30,height:30,borderRadius:6,background:A.a,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>📦</div>
          <div>
            <div style={{fontSize:12,fontWeight:900,color:A.a,lineHeight:1}}>CC ERP</div>
            <div style={{fontSize:7,color:M.textD,letterSpacing:.8,textTransform:"uppercase",lineHeight:1.4}}>Confidence Clothing</div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 14px",flexShrink:0,fontSize:11}}>
          <span style={{color:A.a,fontWeight:700,cursor:"pointer"}} onClick={()=>setActMod(null)}>Home</span>
          {actMod&&<><span style={{color:M.textD}}>›</span><span style={{color:A.a,fontWeight:700,cursor:"pointer"}}>{actMod==="users"?"👥 Users & Roles":mods.find(m=>m.id===actMod)?.lbl}</span></>}
        </div>

        {/* Ctrl+K search pill */}
        <button onClick={()=>setCmdOpen(true)} style={{
          display:"flex",alignItems:"center",gap:7,padding:"5px 12px",
          borderRadius:7,border:`1px solid ${M.shellBd}`,
          background:M.surfLow,cursor:"pointer",flexShrink:0,
          color:M.textC,transition:"all .15s",fontFamily:uff,
        }}>
          <span style={{fontSize:13}}>🔍</span>
          <span style={{fontSize:11,fontWeight:600}}>Search…</span>
          <div style={{display:"flex",gap:3,marginLeft:8}}>
            <span style={{fontSize:9,fontFamily:dff,background:M.badgeBg,border:`1px solid ${M.divider}`,padding:"1px 5px",borderRadius:3,color:M.textD,fontWeight:700}}>Ctrl</span>
            <span style={{fontSize:9,fontFamily:dff,background:M.badgeBg,border:`1px solid ${M.divider}`,padding:"1px 5px",borderRadius:3,color:M.textD,fontWeight:700}}>K</span>
          </div>
        </button>

        <div style={{flex:1}}/>

        {/* Quick Theme */}
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 8px",borderRight:`1px solid ${M.shellBd}`,flexShrink:0}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Theme</span>
          <div style={{display:"flex",gap:2,background:M.surfLow,border:`1px solid ${M.shellBd}`,borderRadius:5,padding:"2px 3px"}}>
            {Object.values(MODES).map(m=>(
              <button key={m.id} onClick={()=>setCfg(c=>({...c,mode:m.id}))} title={m.name} style={{width:22,height:22,border:`2px solid ${cfg.mode===m.id?A.a:"transparent"}`,borderRadius:4,background:cfg.mode===m.id?A.al:"transparent",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>{m.lbl}</button>
            ))}
          </div>
        </div>

        {/* Quick Accent */}
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 8px",borderRight:`1px solid ${M.shellBd}`,flexShrink:0}}>
          <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:.5,textTransform:"uppercase"}}>Accent</span>
          <div style={{display:"flex",gap:4,background:M.surfLow,border:`1px solid ${M.shellBd}`,borderRadius:5,padding:"4px 6px"}}>
            {Object.values(ACCENTS).map(ac=>(
              <button key={ac.id} onClick={()=>setCfg(c=>({...c,accent:ac.id}))} title={ac.lbl} style={{width:16,height:16,borderRadius:"50%",background:ac.a,cursor:"pointer",border:`2px solid ${cfg.accent===ac.id?M.textA:"transparent"}`,transition:"all .15s",flexShrink:0}}/>
            ))}
          </div>
        </div>

        {/* Notification Bell */}
        <div style={{position:"relative",flexShrink:0}}>
          <button onClick={()=>{setNotifOpen(o=>!o);setShowAll(false);setCfgOpen(false);}} style={{
            width:34,height:34,borderRadius:6,margin:"0 4px",
            background:notifOpen?A.a:M.surfLow,
            border:`1px solid ${notifOpen?A.a:M.shellBd}`,
            color:notifOpen?"#fff":M.textB,cursor:"pointer",fontSize:16,
            display:"flex",alignItems:"center",justifyContent:"center",
            position:"relative",transition:"all .15s",
          }}>
            🔔
            {unreadCount>0&&(
              <div style={{position:"absolute",top:3,right:3,minWidth:16,height:16,borderRadius:8,
                background:"#ef4444",color:"#fff",fontSize:8,fontWeight:900,
                display:"flex",alignItems:"center",justifyContent:"center",
                padding:"0 3px",border:`2px solid ${M.shellBg}`,lineHeight:1}}>
                {unreadCount}
              </div>
            )}
          </button>
          {notifOpen&&(
            <NotifPanel
              notifs={notifs} setNotifs={setNotifs}
              M={M} A={A} uff={uff} fz={fz}
              onClose={()=>setNotifOpen(false)}
            />
          )}
        </div>

        {/* Settings */}
        <button onClick={()=>{setCfgOpen(o=>!o);setNotifOpen(false);}} style={{width:34,height:34,borderRadius:6,margin:"0 4px",background:cfgOpen?A.a:M.surfLow,border:`1px solid ${cfgOpen?A.a:M.shellBd}`,color:cfgOpen?"#fff":M.textB,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>⚙️</button>

        {/* Presence separator */}
        <div style={{width:1,height:24,background:M.divider,marginLeft:4,marginRight:8,flexShrink:0}}/>

        {/* Avatars */}
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <Avatar user={{...user,status:"active",module:"Dashboard",page:"Home",ts:Date.now()}} isSelf M={M} A={A} uff={uff}/>
          {vis.map(u=><Avatar key={u.email} user={u} isSelf={false} M={M} A={A} uff={uff}/>)}
          {ovfl>0&&(
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowAll(o=>!o)} style={{height:28,minWidth:28,padding:"0 8px",borderRadius:14,background:M.badgeBg,color:M.textB,border:`1px solid ${M.divider}`,fontSize:10,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",fontFamily:uff}}>+{ovfl}</button>
              {showAll&&(
                <div className="dd-anim" style={{position:"absolute",top:36,right:0,width:280,background:M.dropBg,border:`1px solid ${M.divider}`,borderRadius:8,boxShadow:M.shadow,zIndex:9999,overflow:"hidden"}}>
                  <div style={{padding:"7px 12px",borderBottom:`1px solid ${M.divider}`,fontSize:9,fontWeight:900,color:M.textC,textTransform:"uppercase",letterSpacing:.5}}>All Online ({totalOnline})</div>
                  {[{...user,status:"active",module:"Dashboard",page:"Home",ts:Date.now()},...others].map(u=>(
                    <div key={u.email} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:`1px solid ${M.divider}`}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:u.email===user.email?A.a:aColor(u.email),color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:uff}}>{ini(u.name)}</div>
                      <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:M.textA,display:"flex",alignItems:"center",gap:4}}>{u.name}{u.email===user.email&&<span style={{fontSize:7,background:A.a,color:"#fff",borderRadius:2,padding:"0 3px"}}>YOU</span>}</div><div style={{fontSize:9,color:M.textC}}>{u.module}</div></div>
                      <span style={{fontSize:8,fontWeight:900,padding:"2px 5px",borderRadius:3,background:ROLE_C[u.role]+"22",color:ROLE_C[u.role]}}>{ROLE_K[u.role]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.28)",fontSize:10,fontWeight:800,color:"#22c55e",flexShrink:0}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>{totalOnline} online
          </div>
        </div>
      </div>

      {/* API ERROR BANNER */}
      {apiError && (
        <div style={{background:"#fef2f2",borderBottom:"1px solid #fecaca",padding:"8px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:14}}>⚠️</span>
          <span style={{fontSize:11,fontWeight:700,color:"#991b1b",flex:1}}>{apiError}</span>
          <button onClick={()=>setApiError(null)} style={{background:"none",border:"none",color:"#991b1b",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
      )}

      {/* BODY */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* SIDEBAR */}
        <div style={{width:collapsed?46:sw,flexShrink:0,background:M.sidebarBg,borderRight:`1px solid ${M.sidebarBd}`,display:"flex",flexDirection:"column",overflow:"hidden",transition:drag?"none":"width .2s ease",zIndex:100}}>

          {!collapsed&&(
            <div style={{padding:"5px 10px",background:M.surfMid,borderBottom:`1px solid ${M.sidebarBd}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1.4,textTransform:"uppercase"}}>Navigation · {sw}px</span>
              <button onClick={()=>setCfg(c=>({...c,compactSide:true}))} style={{background:"none",border:"none",cursor:"pointer",color:M.textD,fontSize:14,padding:0,lineHeight:1}}>‹</button>
            </div>
          )}
          {collapsed&&(
            <button onClick={()=>setCfg(c=>({...c,compactSide:false}))} style={{width:"100%",padding:"11px 0",background:"none",border:"none",cursor:"pointer",color:M.textC,fontSize:16,borderBottom:`1px solid ${M.sidebarBd}`}}>›</button>
          )}

          <div style={{flex:1,overflowY:"auto"}}>

            {/* Quick Access */}
            {!collapsed&&(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px 4px",borderBottom:`1px solid ${M.divider}`}}>
                  <span style={{fontSize:9,fontWeight:900,color:M.textD,letterSpacing:1.2,textTransform:"uppercase",flex:1}}>⭐ Quick Access</span>
                  <button onClick={()=>setCmdOpen(true)} title="Add via Ctrl+K" style={{fontSize:11,background:"none",border:"none",cursor:"pointer",color:M.textD,padding:"1px 4px",borderRadius:3,lineHeight:1}}>＋</button>
                  <button onClick={()=>setEditSC(e=>!e)} title="Edit shortcuts" style={{fontSize:10,background:editSC?A.al:"none",border:editSC?`1px solid ${A.a}`:"none",cursor:"pointer",color:editSC?A.a:M.textD,padding:"1px 5px",borderRadius:3,lineHeight:1.4,fontFamily:uff}}>
                    {editSC?"Done":"Edit"}
                  </button>
                </div>
                {shortcuts.length===0&&(
                  <div style={{padding:"10px 12px",fontSize:10,color:M.textD,textAlign:"center",borderBottom:`1px solid ${M.divider}`}}>
                    No shortcuts yet.<br/><span style={{color:A.a,cursor:"pointer",fontWeight:700}} onClick={()=>setCmdOpen(true)}>Open Ctrl+K to pin items ⭐</span>
                  </div>
                )}
                {shortcuts.map(sc=>(
                  <div key={sc.id} className="sc-item" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:`1px solid ${M.divider}`,cursor:"pointer",position:"relative",background:"transparent",transition:"background .1s"}}
                    onClick={()=>{const m=mods.find(m=>m.id===sc.mod);if(m)setActMod(m.id);}}>
                    <span style={{fontSize:13,flexShrink:0}}>{sc.icon}</span>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{fontSize:fz-2,fontWeight:700,color:M.textB,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sc.label}</div>
                      <div style={{fontSize:8,color:M.textD}}>{sc.sub}</div>
                    </div>
                    {editSC&&(
                      <button className="sc-remove" onClick={e=>{e.stopPropagation();removeShortcut(sc.id);}} style={{opacity:1,width:18,height:18,borderRadius:"50%",background:"#ef4444",color:"#fff",border:"none",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>×</button>
                    )}
                  </div>
                ))}
                <div style={{height:1,background:M.divider,margin:"4px 0"}}/>
              </div>
            )}
            {collapsed&&(
              <button onClick={()=>setCmdOpen(true)} title="Quick Access (Ctrl+K)" style={{width:"100%",padding:"9px 0",background:"none",border:"none",cursor:"pointer",color:M.textD,fontSize:15,borderBottom:`1px solid ${M.sidebarBd}`,textAlign:"center"}}>⭐</button>
            )}

            {/* Module Nav */}
            {!collapsed&&(
              <div style={{padding:"5px 12px 3px",fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1.2,textTransform:"uppercase"}}>Modules</div>
            )}
            {mods.map(mod=>{
              const active=actMod===mod.id;
              return(
                <button key={mod.id} onClick={()=>setActMod(mod.id)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:9,padding:collapsed?"9px 0":"7px 12px",justifyContent:collapsed?"center":"flex-start",background:active?`${A.a}12`:"transparent",borderLeft:active?`3px solid ${A.a}`:"3px solid transparent",border:"none",cursor:"pointer",transition:"all .12s",fontFamily:uff}}>
                  <span style={{fontSize:15,flexShrink:0}}>{mod.icon}</span>
                  {!collapsed&&<>
                    <span style={{fontSize:fz-1,fontWeight:700,color:active?A.a:M.textB,flex:1}}>{mod.lbl}</span>
                    {mod.badge>0&&<span style={{fontSize:9,fontWeight:900,minWidth:18,height:18,borderRadius:9,background:"#ef4444",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{mod.badge}</span>}
                  </>}
                </button>
              );
            })}

            <div style={{height:1,background:M.divider,margin:"4px 10px"}}/>
            {[{icon:"⚙️",lbl:"Settings",fn:()=>setCfgOpen(true),act:cfgOpen},
              {icon:"👥",lbl:"Users",    fn:()=>setActMod("users"),act:actMod==="users"}].map((x,i)=>(
              <button key={i} onClick={x.fn} style={{width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:9,padding:collapsed?"9px 0":"7px 12px",justifyContent:collapsed?"center":"flex-start",background:x.act?`${A.a}12`:"transparent",borderLeft:x.act?`3px solid ${A.a}`:"3px solid transparent",border:"none",cursor:"pointer",fontFamily:uff}}>
                <span style={{fontSize:15}}>{x.icon}</span>
                {!collapsed&&<span style={{fontSize:fz-1,fontWeight:700,color:M.textC}}>{x.lbl}</span>}
              </button>
            ))}
          </div>

          {/* User card */}
          {!collapsed&&(
            <div style={{padding:"9px 10px",borderTop:`1px solid ${M.sidebarBd}`,background:M.surfMid,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:A.a,color:"#fff",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:uff}}>{ini(user.name)}</div>
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{fontSize:fz-2,fontWeight:800,color:M.textA,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
                <span style={{fontSize:8,fontWeight:900,padding:"1px 5px",borderRadius:3,background:ROLE_C[user.role]+"22",color:ROLE_C[user.role],letterSpacing:.5}}>{ROLE_K[user.role]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Drag handle */}
        {!collapsed&&(
          <div onMouseDown={onDragStart} style={{width:5,flexShrink:0,cursor:"col-resize",background:drag?`${A.a}25`:"transparent",borderLeft:drag?`1px solid ${A.a}`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
            <div style={{width:2,height:40,borderRadius:1,background:drag?A.a:M.divider,transition:"background .15s"}}/>
          </div>
        )}

        {/* MAIN CONTENT */}
        {actMod === "procurement" ? (
          <Procurement M={M} A={A} cfg={cfg} fz={fz} dff={dff} />
        ) : actMod === "masters" ? (
          <Masters M={M} A={A} cfg={cfg} fz={fz} dff={dff} />
        ) : actMod === "users" ? (
          <UsersPanel M={M} A={A} cfg={cfg} fz={fz} dff={dff} />
        ) : actMod && actMod !== "dashboard" ? (
          /* ── Placeholder for modules under development ── */
          (() => {
            const mod = mods.find(m => m.id === actMod);
            return (
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:M.bg}}>
                <div style={{height:40,flexShrink:0,background:M.surfHigh,borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",padding:"0 14px",gap:8}}>
                  <span style={{fontSize:fz,fontWeight:900,color:M.textA}}>{mod?.icon} {mod?.lbl || actMod}</span>
                  <div style={{flex:1}}/>
                  <button onClick={()=>setActMod(null)} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${M.divider}`,background:M.surfMid,color:M.textB,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:uff}}>Back to Home</button>
                </div>
                {apiError ? (
                  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{textAlign:"center",maxWidth:420,padding:40}}>
                      <div style={{width:64,height:64,borderRadius:16,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 20px",border:"1px solid #fecaca"}}>!</div>
                      <div style={{fontSize:18,fontWeight:900,color:"#991b1b",marginBottom:8,fontFamily:uff}}>Connection Error</div>
                      <div style={{fontSize:12,color:"#b91c1c",marginBottom:20,lineHeight:1.6,fontFamily:uff}}>{apiError}</div>
                      <div style={{fontSize:11,color:M.textD,lineHeight:1.6,fontFamily:uff}}>Check that the GAS web app is deployed and VITE_GAS_URL is correct.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{textAlign:"center",maxWidth:420,padding:40}}>
                      <div style={{width:72,height:72,borderRadius:18,background:`${mod?.col || A.a}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 20px",border:`1px solid ${mod?.col || A.a}30`}}>{mod?.icon || "🔧"}</div>
                      <div style={{fontSize:20,fontWeight:900,color:M.textA,marginBottom:6,fontFamily:uff}}>{mod?.lbl || actMod}</div>
                      <div style={{fontSize:12,color:M.textC,marginBottom:20,fontFamily:uff}}>{mod?.desc}</div>
                      <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 24px",background:`${mod?.col || A.a}10`,border:`1px solid ${mod?.col || A.a}30`,borderRadius:10}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:mod?.col || A.a,animation:"pulse 1.5s ease-in-out infinite"}}/>
                        <span style={{fontSize:13,fontWeight:800,color:mod?.col || A.a,fontFamily:uff}}>Working on this module</span>
                      </div>
                      <div style={{marginTop:20,fontSize:11,color:M.textD,lineHeight:1.6,fontFamily:uff}}>This module is under active development and will be available soon.</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:M.bg}}>

          {/* Sub-toolbar */}
          <div style={{height:40,flexShrink:0,background:M.surfHigh,borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",padding:"0 14px",gap:8}}>
            <span style={{fontSize:fz,fontWeight:900,color:M.textA}}>🏠 Home — Module Overview</span>
            <div style={{flex:1}}/>
            <span style={{fontSize:10,color:M.textD,fontFamily:dff}}>{timeStr()}</span>
            {["🖨️ Print","📤 Export ▾"].map(lbl=>(
              <button key={lbl} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${M.divider}`,background:M.surfMid,color:M.textB,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:uff}}>{lbl}</button>
            ))}
          </div>

          {/* Scroll area */}
          <div style={{flex:1,overflowY:"auto",padding:18}}>

            {/* Greeting */}
            <div style={{marginBottom:20}} className="fade-slide">
              <div style={{fontSize:fz+8,fontWeight:900,color:M.textA,marginBottom:3}}>{greet()}, {user.name.split(" ")[0]} 👋</div>
              <div style={{fontSize:fz-2,color:M.textC}}>{todayStr()}</div>
            </div>

            {/* Quick stats */}
            <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(dashStats.length||4,4)},1fr)`,gap:12,marginBottom:20}}>
              {(dashStats.length > 0 ? dashStats : [
                {lbl:"Open POs",  val:"0", sub:"No data yet", col:"#E8690A",icon:"📦"},
                {lbl:"GRN",       val:"0", sub:"No data yet", col:"#0078D4",icon:"📥"},
                {lbl:"Notifications",val:"0", sub:"No data yet", col:"#7C3AED",icon:"🔔"},
                {lbl:"Online",    val:"0", sub:"No data yet", col:"#15803D",icon:"👥"},
              ]).map((s,i)=>(
                <div key={i} style={{background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,padding:"13px 14px",borderLeft:`3px solid ${s.col}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><span style={{fontSize:16}}>{s.icon}</span><span style={{fontSize:9,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:.5}}>{s.lbl}</span></div>
                  <div style={{fontSize:20,fontWeight:900,color:M.textA,fontFamily:dff,marginBottom:2}}>{s.val}</div>
                  <div style={{fontSize:fz-2,color:M.textC}}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Modules */}
            <div style={{fontSize:9,fontWeight:900,color:M.textD,textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Modules</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {mods.map(mod=><Tile key={mod.id} mod={mod} M={M} A={A} fz={fz} onClick={setActMod} hov={hovMod===mod.id} onHov={setHovMod}/>)}
            </div>

            {/* Bottom row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14}}>
              {/* Activity */}
              <div style={{background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,overflow:"hidden"}}>
                <div style={{padding:"9px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:fz-1,fontWeight:900,color:M.textA}}>🕐 Recent Activity</span>
                  <span style={{fontSize:9,color:M.textD}}>Today</span>
                </div>
                {activity.length === 0 ? (
                  <div style={{padding:20,textAlign:"center",fontSize:11,color:M.textD}}>No recent activity</div>
                ) : activity.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:`${PY_MAP[cfg.density]+4}px 14px`,borderBottom:i<activity.length-1?`1px solid ${M.divider}`:"none",borderLeft:`3px solid ${a.col}`,background:i%2===0?M.tblEven:M.tblOdd}}>
                    <span style={{fontSize:15,flexShrink:0}}>{a.icon}</span>
                    <div>
                      <div style={{fontSize:fz-1,fontWeight:700,color:M.textA}}>{a.text}</div>
                      <div style={{fontSize:fz-3,color:M.textC}}>{a.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Online users */}
              <div style={{background:M.surfHigh,border:`1px solid ${M.divider}`,borderRadius:8,overflow:"hidden"}}>
                <div style={{padding:"9px 14px",borderBottom:`1px solid ${M.divider}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:fz-1,fontWeight:900,color:M.textA}}>👥 Online Now</span>
                  <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:800,color:"#22c55e",background:"rgba(34,197,94,.1)",padding:"2px 8px",borderRadius:10,border:"1px solid rgba(34,197,94,.25)"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}}/>{totalOnline}</div>
                </div>
                {[{...user,status:"active",module:"Dashboard",page:"Home",ts:Date.now()},...others].map((u,i)=>{
                  const dot=u.status==="active"?"#22c55e":"#f59e0b";
                  return(
                    <div key={u.email||i} style={{display:"flex",alignItems:"center",gap:9,padding:`${PY_MAP[cfg.density]+2}px 12px`,borderBottom:i<others.length?`1px solid ${M.divider}`:"none"}}>
                      <div style={{position:"relative",flexShrink:0}}>
                        <div style={{width:26,height:26,borderRadius:"50%",background:u.email===user.email?A.a:aColor(u.email),color:"#fff",fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:uff}}>{ini(u.name)}</div>
                        <div style={{position:"absolute",bottom:0,right:0,width:7,height:7,borderRadius:"50%",background:dot,border:`1.5px solid ${M.surfHigh}`}}/>
                      </div>
                      <div style={{flex:1,overflow:"hidden"}}>
                        <div style={{fontSize:fz-2,fontWeight:700,color:M.textA,display:"flex",alignItems:"center",gap:4}}>
                          {u.name.split(" ")[0]}
                          {u.email===user.email&&<span style={{fontSize:7,background:A.a,color:"#fff",borderRadius:2,padding:"0 3px"}}>YOU</span>}
                        </div>
                        <div style={{fontSize:fz-3,color:M.textC}}>{u.module}</div>
                      </div>
                      <span style={{fontSize:7,fontWeight:900,padding:"2px 5px",borderRadius:3,background:ROLE_C[u.role]+"22",color:ROLE_C[u.role],letterSpacing:.3,flexShrink:0}}>{ROLE_K[u.role]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status Bar */}
          {cfg.showStatusBar&&(
            <div style={{height:28,flexShrink:0,background:M.statusBg,borderTop:`1px solid ${M.sidebarBd}`,display:"flex",alignItems:"center",padding:"0 14px",gap:16,fontSize:10,fontFamily:dff}}>
              <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1,textTransform:"uppercase"}}>MODULES</span>
              <span style={{fontSize:11,fontWeight:900,color:M.textB}}>{mods.length}</span>
              <div style={{width:1,height:12,background:M.divider}}/>
              <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1,textTransform:"uppercase"}}>ONLINE</span>
              <span style={{fontSize:11,fontWeight:900,color:"#22c55e"}}>{totalOnline}</span>
              <div style={{width:1,height:12,background:M.divider}}/>
              <span style={{fontSize:8,fontWeight:900,color:M.textD,letterSpacing:1,textTransform:"uppercase"}}>PENDING</span>
              <span style={{fontSize:11,fontWeight:900,color:"#ef4444"}}>{notifs.filter(n=>!n.read).length}</span>
              <div style={{flex:1}}/>
              <span style={{fontSize:9,color:M.textD}}>CC ERP · Home · {MODES[cfg.mode].name} · {ACCENTS[cfg.accent].lbl}</span>
              <div style={{width:1,height:12,background:M.divider}}/>
              <span style={{fontSize:9,color:M.textD}}>{timeStr()}</span>
            </div>
          )}
        </div>
        )}
      </div>

      {/* SETTINGS PANEL */}
      {cfgOpen&&<SettingsPanel M={M} A={A} cfg={cfg} onApply={newCfg=>setCfg(newCfg)} onClose={()=>setCfgOpen(false)}/>}

      {/* CMD PALETTE */}
      {cmdOpen&&(
        <CmdPalette
          M={M} A={A} uff={uff} fz={fz}
          shortcuts={shortcuts} setShortcuts={setShortcuts}
          onClose={()=>setCmdOpen(false)}
          onModSelect={id=>{setActMod(id);}}
          onCfgOpen={()=>setCfgOpen(true)}
        />
      )}

      {/* Backdrop for overflow dropdown */}
      {showAll&&<div onClick={()=>setShowAll(false)} style={{position:"fixed",inset:0,zIndex:9000}}/>}
    </div>
  );
}
