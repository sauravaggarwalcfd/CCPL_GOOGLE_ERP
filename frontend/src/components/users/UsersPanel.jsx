import { useState, useEffect, useCallback } from "react";
import { uiFF, dataFF } from '../../constants/fonts';
import api from '../../services/api';

/* ─────────────────────────────────────────────────────────────────────────────
   CC ERP — USERS & ROLES  ·  CONCEPT 2 — PROFILE CARD GRID
   Custom permission overrides per user (except Admin)
   3-state toggle: Role Default → ✅ Custom Grant → ❌ Custom Deny
───────────────────────────────────────────────────────────────────────────── */

const ROLE_DEFS = {
  Admin:       { color:"#BE123C", bg:"#fff1f2", code:"ADMIN", icon:"🔴", mods:["Procurement","Production","Inventory","Quality","Sales","Finance","Masters","Dashboard"], actions:["CREATE","EDIT","SUBMIT","APPROVE","DELETE","EXPORT_PDF","EXPORT_SHEET","EXPORT_EXCEL","VIEW_PRICES","IMPORT","USER_MGMT","SUSPEND","AUDIT"], exports:["PDF","SHEET","EXCEL","CLIPBOARD","EMAIL"] },
  Manager:     { color:"#1D4ED8", bg:"#eff6ff", code:"MGR",   icon:"🔵", mods:["Procurement","Production","Inventory","Quality","Sales","Finance","Masters","Dashboard"], actions:["CREATE","EDIT","SUBMIT","APPROVE","DELETE","EXPORT_PDF","EXPORT_SHEET","EXPORT_EXCEL","VIEW_PRICES","IMPORT","AUDIT"],                  exports:["PDF","SHEET","EXCEL","CLIPBOARD","EMAIL"] },
  Supervisor:  { color:"#7C3AED", bg:"#f5f3ff", code:"SUP",   icon:"🟣", mods:["Procurement","Production","Inventory","Quality","Sales","Dashboard"],                     actions:["CREATE","EDIT","SUBMIT","APPROVE","EXPORT_PDF","EXPORT_SHEET","VIEW_PRICES"],                                                               exports:["PDF","SHEET","CLIPBOARD"] },
  Operator:    { color:"#15803D", bg:"#f0fdf4", code:"OPR",   icon:"🟢", mods:["Procurement","Production","Inventory","Quality","Sales"],                                  actions:["CREATE","EDIT","EXPORT_PDF"],                                                                                                              exports:["PDF"] },
  "View Only": { color:"#6b7280", bg:"#f9fafb", code:"VIEW",  icon:"⚪", mods:["Procurement","Dashboard"],                                                                 actions:[],                                                                                                                                         exports:[] },
};

const ALL_MODULES = ["Procurement","Production","Inventory","Quality","Sales","Finance","Masters","Dashboard"];
const ALL_ACTIONS = ["CREATE","EDIT","SUBMIT","APPROVE","DELETE","EXPORT_PDF","EXPORT_SHEET","EXPORT_EXCEL","VIEW_PRICES","IMPORT","USER_MGMT","SUSPEND","AUDIT"];
const ALL_EXPORTS = ["PDF","SHEET","EXCEL","CLIPBOARD","EMAIL"];
const ALL_FIELDS  = ["UNIT_PRICE","SUPPLIER_PRICE","LANDED_COST","MARGIN","SALARY","BANK_DETAILS","GST_NUMBER","CREDIT_LIMIT","DISCOUNT_RATE","COST_SHEET"];

const MOD_ICONS  = { Procurement:"📦", Production:"🏭", Inventory:"🗄️", Quality:"🔬", Sales:"💼", Finance:"💰", Masters:"🗂️", Dashboard:"📈" };
const ACT_LABELS = { CREATE:"Create Records", EDIT:"Edit Records", SUBMIT:"Submit for Approval", APPROVE:"Approve Records", DELETE:"Delete Records", EXPORT_PDF:"Export PDF", EXPORT_SHEET:"Export Sheets", EXPORT_EXCEL:"Export Excel", VIEW_PRICES:"View Unit Prices", IMPORT:"Import Data", USER_MGMT:"User Management", SUSPEND:"Suspend Users", AUDIT:"Audit Logs" };
const ACT_ICONS  = { CREATE:"➕", EDIT:"✏️", SUBMIT:"📤", APPROVE:"✅", DELETE:"🗑️", EXPORT_PDF:"📄", EXPORT_SHEET:"📊", EXPORT_EXCEL:"📗", VIEW_PRICES:"💰", IMPORT:"📥", USER_MGMT:"👥", SUSPEND:"🚫", AUDIT:"🔍" };
const EXP_LABELS = { PDF:"PDF / Print", SHEET:"Google Sheets", EXCEL:"Excel (.xlsx)", CLIPBOARD:"Copy to Clipboard", EMAIL:"Email Export" };
const EXP_ICONS  = { PDF:"📄", SHEET:"📊", EXCEL:"📗", CLIPBOARD:"📋", EMAIL:"📧" };
const FLD_LABELS = { UNIT_PRICE:"Unit Prices", SUPPLIER_PRICE:"Supplier Pricing", LANDED_COST:"Landed Cost", MARGIN:"Profit Margin", SALARY:"Salary Data", BANK_DETAILS:"Bank Details", GST_NUMBER:"GST Numbers", CREDIT_LIMIT:"Credit Limits", DISCOUNT_RATE:"Discount Rates", COST_SHEET:"Cost Sheets" };

const INIT_USERS = [
  { id:"USR-001", name:"Saurav Aggarwal", initials:"SA", email:"saurav@cc.com",  role:"Admin",      status:"Active",    dept:"Management",  reportTo:"-",       lastLogin:"Now",        sessions:1240, customMods:[], extraActions:[], deniedActions:[], deniedFields:[], notes:"Owner" },
  { id:"USR-002", name:"Rajesh Kumar",    initials:"RK", email:"rajesh@cc.com",  role:"Manager",    status:"Active",    dept:"Procurement", reportTo:"USR-001", lastLogin:"2 min ago",  sessions:643,  customMods:[], extraActions:[], deniedActions:[], deniedFields:[], notes:"" },
  { id:"USR-003", name:"Priya Sharma",    initials:"PS", email:"priya@cc.com",   role:"Supervisor", status:"Active",    dept:"Quality",     reportTo:"USR-001", lastLogin:"14 min ago", sessions:422,  customMods:[], extraActions:["EXPORT_EXCEL"], deniedActions:[], deniedFields:["UNIT_PRICE"], notes:"Extra Excel access granted" },
  { id:"USR-004", name:"Amit Singh",      initials:"AS", email:"amit@cc.com",    role:"Supervisor", status:"Active",    dept:"Production",  reportTo:"USR-002", lastLogin:"1 hr ago",   sessions:387,  customMods:["Procurement","Production","Inventory","Quality","Sales","Finance","Dashboard"], extraActions:["VIEW_PRICES"], deniedActions:[], deniedFields:[], notes:"Finance module granted for budget review" },
  { id:"USR-005", name:"Ravi Verma",      initials:"RV", email:"ravi@cc.com",    role:"Operator",   status:"Active",    dept:"Inventory",   reportTo:"USR-003", lastLogin:"3 hr ago",   sessions:289,  customMods:["Inventory","Procurement"], extraActions:["SUBMIT"], deniedActions:[], deniedFields:["UNIT_PRICE","LANDED_COST"], notes:"Submit access granted" },
  { id:"USR-006", name:"Anita Kumari",    initials:"AK", email:"anita@cc.com",   role:"View Only",  status:"Active",    dept:"Finance",     reportTo:"USR-002", lastLogin:"Yesterday",  sessions:118,  customMods:["Procurement","Finance","Dashboard"], extraActions:[], deniedActions:[], deniedFields:[], notes:"Auditor" },
  { id:"USR-007", name:"Vikas Tiwari",    initials:"VT", email:"vikas@cc.com",   role:"Operator",   status:"Suspended", dept:"Production",  reportTo:"USR-004", lastLogin:"3 days ago", sessions:204,  customMods:["Production"], extraActions:[], deniedActions:["CREATE","EDIT"], deniedFields:[], notes:"On leave" },
];

// ── HELPERS ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#E8690A","#1D4ED8","#7C3AED","#15803D","#BE123C","#0891B2","#D97706","#4F46E5","#0F766E"];
const avatarBg = (name) => AVATAR_COLORS[[...name].reduce((a,c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

function getEffective(user) {
  const rd = ROLE_DEFS[user.role];
  if (!rd) return { mods:[], actions:[], exports:[], hiddenFields:[] };
  if (user.role === "Admin") return { mods:[...rd.mods], actions:[...rd.actions], exports:[...rd.exports], hiddenFields:[] };
  const mods    = user.customMods.length > 0 ? [...user.customMods] : [...rd.mods];
  const actions = [...new Set([...rd.actions, ...user.extraActions])].filter(a => !user.deniedActions.includes(a));
  const exports = [...rd.exports].filter(e => {
    if (e === "EXCEL" && user.deniedActions.includes("EXPORT_EXCEL")) return false;
    if (e === "SHEET" && user.deniedActions.includes("EXPORT_SHEET")) return false;
    if (e === "PDF"   && user.deniedActions.includes("EXPORT_PDF"))   return false;
    return true;
  });
  if (user.extraActions.includes("EXPORT_EXCEL") && !exports.includes("EXCEL")) exports.push("EXCEL");
  return { mods, actions, exports, hiddenFields: user.deniedFields || [] };
}

function countOverrides(user) {
  if (user.role === "Admin") return 0;
  const rd = ROLE_DEFS[user.role];
  const customModDiffs = user.customMods.length > 0
    ? user.customMods.filter(m => !rd.mods.includes(m)).length + rd.mods.filter(m => !user.customMods.includes(m)).length
    : 0;
  return customModDiffs + user.extraActions.length + user.deniedActions.length + user.deniedFields.length;
}

// ── SMALL COMPONENTS ───────────────────────────────────────────────────────
function RolePill({ role, sm }) {
  const r = ROLE_DEFS[role];
  if (!r) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3,
      padding: sm ? "2px 7px" : "3px 9px", borderRadius:20,
      background:r.bg, color:r.color, border:`1px solid ${r.color}40`,
      fontSize:sm ? 10 : 11, fontWeight:800, letterSpacing:"0.03em", whiteSpace:"nowrap" }}>
      {r.icon} {r.code}
    </span>
  );
}

function UserAvatar({ user, size=32 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:size > 40 ? 12 : 8, flexShrink:0,
      background:avatarBg(user.name), display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size * 0.36, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>
      {user.initials}
    </div>
  );
}

function StatusBubble({ status }) {
  const map = { Active:["#dcfce7","#15803d","🟢"], Suspended:["#fee2e2","#be123c","🔴"], Inactive:["#f3f4f6","#6b7280","⚫"] };
  const [bg, tx, dot] = map[status] || map.Inactive;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
      borderRadius:20, background:bg, color:tx, fontSize:10, fontWeight:800 }}>
      {dot} {status}
    </span>
  );
}

function ThreeToggle({ state, onCycle, disabled }) {
  const cfg = {
    role:    { bg:"#f3f4f6", color:"#6b7280", border:"#e5e7eb", label:"Role default" },
    granted: { bg:"#dcfce7", color:"#15803d", border:"#bbf7d0", label:"Granted ✅" },
    denied:  { bg:"#fee2e2", color:"#be123c", border:"#fecaca", label:"Denied ❌" },
    off:     { bg:"#f9fafb", color:"#d1d5db", border:"#e5e7eb", label:"No access" },
  };
  const c = cfg[state] || cfg.role;
  return (
    <button onClick={disabled ? undefined : onCycle}
      style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px",
        borderRadius:6, border:`1px solid ${c.border}`, background:c.bg, color:c.color,
        cursor:disabled ? "not-allowed" : "pointer", fontSize:11, fontWeight:700,
        opacity:disabled ? 0.5 : 1, transition:"all 0.15s", whiteSpace:"nowrap", minWidth:110 }}>
      {c.label}
      {!disabled && <span style={{ marginLeft:"auto", opacity:0.45, fontSize:10 }}>↻</span>}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PERMISSIONS PANEL
// ══════════════════════════════════════════════════════════════════════════
function PermissionsPanel({ user, onSave, onClose, M, A, uff, dff }) {
  const isAdmin = user.role === "Admin";
  const rd = ROLE_DEFS[user.role];

  const [draft, setDraft] = useState({
    customMods:    [...(user.customMods    || [])],
    extraActions:  [...(user.extraActions  || [])],
    deniedActions: [...(user.deniedActions || [])],
    deniedFields:  [...(user.deniedFields  || [])],
  });
  const [tab, setTab] = useState("modules");

  const cycleModule = (mod) => {
    if (isAdmin) return;
    setDraft(d => {
      const cur = d.customMods;
      if (cur.length === 0) {
        return { ...d, customMods: rd.mods.includes(mod) ? rd.mods.filter(m => m !== mod) : [...rd.mods, mod] };
      }
      if (cur.includes(mod)) return { ...d, customMods: cur.filter(m => m !== mod) };
      return { ...d, customMods: [...cur, mod] };
    });
  };

  const cycleAction = (action) => {
    if (isAdmin) return;
    const inRole   = rd.actions.includes(action);
    const isExtra  = draft.extraActions.includes(action);
    const isDenied = draft.deniedActions.includes(action);
    setDraft(d => {
      if (inRole) {
        if (!isDenied) return { ...d, deniedActions:[...d.deniedActions, action], extraActions:d.extraActions.filter(a=>a!==action) };
        return { ...d, deniedActions:d.deniedActions.filter(a=>a!==action) };
      } else {
        if (!isExtra) return { ...d, extraActions:[...d.extraActions, action], deniedActions:d.deniedActions.filter(a=>a!==action) };
        return { ...d, extraActions:d.extraActions.filter(a=>a!==action) };
      }
    });
  };

  const cycleField = (field) => {
    if (isAdmin) return;
    setDraft(d => ({
      ...d,
      deniedFields: d.deniedFields.includes(field) ? d.deniedFields.filter(f=>f!==field) : [...d.deniedFields, field]
    }));
  };

  const getModState = (mod) => {
    if (isAdmin) return "role";
    if (draft.customMods.length === 0) return rd.mods.includes(mod) ? "role" : "off";
    return draft.customMods.includes(mod)
      ? (rd.mods.includes(mod) ? "role" : "granted")
      : (rd.mods.includes(mod) ? "denied" : "off");
  };

  const getActState = (action) => {
    if (isAdmin) return "role";
    if (draft.extraActions.includes(action))  return "granted";
    if (draft.deniedActions.includes(action)) return "denied";
    return rd.actions.includes(action) ? "role" : "off";
  };

  const getFldState = (field) => draft.deniedFields.includes(field) ? "denied" : "role";

  const totalOverrides = (draft.customMods.length > 0
    ? draft.customMods.filter(m => !rd.mods.includes(m)).length + rd.mods.filter(m => !draft.customMods.includes(m)).length
    : 0) + draft.extraActions.length + draft.deniedActions.length + draft.deniedFields.length;

  const TABS = [
    { id:"modules", label:"📦 Modules" },
    { id:"actions", label:"⚡ Actions" },
    { id:"exports", label:"📤 Exports" },
    { id:"fields",  label:"🔒 Fields" },
  ];

  const ACTION_GROUPS = [
    { group:"Record Actions",   items:["CREATE","EDIT","SUBMIT","APPROVE","DELETE"] },
    { group:"Exports & Import", items:["EXPORT_PDF","EXPORT_SHEET","EXPORT_EXCEL","IMPORT"] },
    { group:"Data Visibility",  items:["VIEW_PRICES"] },
    { group:"Administration",   items:["USER_MGMT","SUSPEND","AUDIT"] },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:400,
      display:"flex", justifyContent:"flex-end", animation:"fadeIn 0.15s" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:540, height:"100vh", background:M.surfHigh, display:"flex",
        flexDirection:"column", boxShadow:"-6px 0 28px rgba(0,0,0,0.14)", animation:"slideInRight 0.22s", fontFamily:uff }}>

        {/* Header */}
        <div style={{ padding:"16px 20px 14px", borderBottom:`1px solid ${M.divider}`,
          background:M.surfMid, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <UserAvatar user={user} size={40} />
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:M.textA }}>{user.name}</div>
                <div style={{ fontSize:11, color:M.textC, fontFamily:dff }}>{user.email}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:6,
              border:`1px solid ${M.divider}`, background:M.surfLow, cursor:"pointer", fontSize:18, lineHeight:1, fontFamily:uff }}>×</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
            <RolePill role={user.role} />
            <StatusBubble status={user.status} />
            {isAdmin ? (
              <span style={{ fontSize:11, color:A.a, fontWeight:700, padding:"3px 10px",
                borderRadius:20, background:A.al, border:`1px solid ${A.a}30` }}>
                🔒 Admin permissions are locked
              </span>
            ) : totalOverrides > 0 ? (
              <span style={{ fontSize:11, color:"#7C3AED", fontWeight:700, padding:"3px 10px",
                borderRadius:20, background:"#f5f3ff", border:"1px solid #ddd6fe" }}>
                ⚡ {totalOverrides} custom override{totalOverrides !== 1 ? "s" : ""}
              </span>
            ) : (
              <span style={{ fontSize:11, color:M.textC, fontWeight:600, padding:"3px 10px",
                borderRadius:20, background:M.surfLow }}>Using role defaults</span>
            )}
          </div>
        </div>

        {/* Legend */}
        {!isAdmin && (
          <div style={{ padding:"7px 20px", borderBottom:`1px solid ${M.divider}`,
            display:"flex", gap:8, alignItems:"center", background:M.surfMid, flexShrink:0 }}>
            <span style={{ fontSize:9, fontWeight:900, color:M.textD, letterSpacing:"0.08em" }}>LEGEND</span>
            {[["Role default","#6b7280","#f3f4f6"],["Custom grant ✅","#15803d","#dcfce7"],["Custom deny ❌","#be123c","#fee2e2"]].map(([l,c,b]) => (
              <span key={l} style={{ fontSize:10, fontWeight:700, color:c, background:b,
                borderRadius:5, padding:"2px 7px" }}>{l}</span>
            ))}
            <span style={{ fontSize:10, color:M.textD, marginLeft:"auto" }}>Click to cycle</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${M.divider}`, background:M.surfHigh, flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:"10px 16px", fontSize:12, fontWeight:700, cursor:"pointer",
                border:"none", background:"none", color: tab===t.id ? A.a : M.textC,
                borderBottom: tab===t.id ? `2px solid ${A.a}` : "2px solid transparent", fontFamily:uff }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

          {tab === "modules" && (
            <div>
              <p style={{ fontSize:11, color:M.textC, marginBottom:14, lineHeight:1.6 }}>
                Override which modules this user can access, independent of their role defaults.
                {isAdmin && " Admin always has all modules — cannot be changed."}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {ALL_MODULES.map(mod => {
                  const st    = getModState(mod);
                  const rdHas = rd.mods.includes(mod);
                  return (
                    <div key={mod} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"10px 14px", borderRadius:8, transition:"all 0.15s",
                      border:`1px solid ${st==="granted"?"#bbf7d0":st==="denied"?"#fecaca":M.divider}`,
                      background:st==="granted"?"#f0fdf4":st==="denied"?"#fff8f8":M.surfHigh }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:7, background:M.surfMid,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>
                          {MOD_ICONS[mod]}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:M.textA }}>{mod}</div>
                          <div style={{ fontSize:10, color:M.textC }}>
                            {rdHas ? "Included in role" : "Not in role"}
                            {st==="granted" ? " · ✅ Custom granted" : st==="denied" ? " · ❌ Custom denied" : ""}
                          </div>
                        </div>
                      </div>
                      <ThreeToggle state={st} onCycle={() => cycleModule(mod)} disabled={isAdmin} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "actions" && (
            <div>
              <p style={{ fontSize:11, color:M.textC, marginBottom:14, lineHeight:1.6 }}>
                Grant extra actions beyond the role, or deny actions the role normally allows.
              </p>
              {ACTION_GROUPS.map(({ group, items }) => (
                <div key={group} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, fontWeight:900, textTransform:"uppercase",
                    letterSpacing:"0.1em", color:M.textD, marginBottom:7 }}>{group}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {items.map(action => {
                      const st     = getActState(action);
                      const inRole = rd.actions.includes(action);
                      return (
                        <div key={action} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                          padding:"9px 14px", borderRadius:8, transition:"all 0.15s",
                          border:`1px solid ${st==="granted"?"#bbf7d0":st==="denied"?"#fecaca":M.divider}`,
                          background:st==="granted"?"#f0fdf4":st==="denied"?"#fff8f8":M.surfHigh }}>
                          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                            <span style={{ fontSize:18 }}>{ACT_ICONS[action]}</span>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:M.textA }}>{ACT_LABELS[action]}</div>
                              <div style={{ fontSize:10, color:M.textC, fontFamily:dff }}>
                                {action} · {inRole ? "In role" : "Not in role"}
                                {st==="granted" ? " · ✅ Custom" : st==="denied" ? " · ❌ Denied" : ""}
                              </div>
                            </div>
                          </div>
                          <ThreeToggle state={st} onCycle={() => cycleAction(action)} disabled={isAdmin} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "exports" && (
            <div>
              <p style={{ fontSize:11, color:M.textC, marginBottom:14, lineHeight:1.6 }}>
                Export permissions are derived from action toggles in the Actions tab.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {ALL_EXPORTS.map(exp => {
                  const actionKey = exp==="PDF"?"EXPORT_PDF":exp==="SHEET"?"EXPORT_SHEET":exp==="EXCEL"?"EXPORT_EXCEL":null;
                  const st = actionKey ? getActState(actionKey) : (rd.exports.includes(exp) ? "role" : "off");
                  return (
                    <div key={exp} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"10px 14px", borderRadius:8, transition:"all 0.15s",
                      border:`1px solid ${st==="granted"?"#bbf7d0":st==="denied"?"#fecaca":M.divider}`,
                      background:st==="granted"?"#f0fdf4":st==="denied"?"#fff8f8":M.surfHigh }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:20 }}>{EXP_ICONS[exp]}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:M.textA }}>{EXP_LABELS[exp]}</div>
                          <div style={{ fontSize:10, color:M.textC }}>
                            {actionKey ? "Controlled via Actions tab" : "Role default"}
                          </div>
                        </div>
                      </div>
                      <ThreeToggle state={st}
                        onCycle={() => actionKey ? cycleAction(actionKey) : null}
                        disabled={isAdmin || !actionKey} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "fields" && (
            <div>
              <p style={{ fontSize:11, color:M.textC, marginBottom:14, lineHeight:1.6 }}>
                Hidden fields render as <strong style={{ fontFamily:dff }}>🔒 ——</strong> in all forms and tables.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {ALL_FIELDS.map(field => {
                  const st = getFldState(field);
                  return (
                    <div key={field} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"9px 14px", borderRadius:8, transition:"all 0.15s",
                      border:`1px solid ${st==="denied"?"#fecaca":M.divider}`,
                      background:st==="denied"?"#fff8f8":M.surfHigh }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <span style={{ fontSize:18, opacity:st==="denied"?1:0.3 }}>🔒</span>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:M.textA }}>{FLD_LABELS[field]}</div>
                          <div style={{ fontSize:10, color:M.textC, fontFamily:dff }}>
                            {field} · {st==="denied" ? "Hidden → renders as 🔒 ——" : "Visible (default)"}
                          </div>
                        </div>
                      </div>
                      <ThreeToggle state={st} onCycle={() => cycleField(field)} disabled={isAdmin} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 20px", borderTop:`1px solid ${M.divider}`, background:M.surfMid,
          display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          {!isAdmin && totalOverrides > 0 && (
            <button onClick={() => setDraft({ customMods:[], extraActions:[], deniedActions:[], deniedFields:[] })}
              style={{ padding:"7px 14px", borderRadius:6, border:`1px solid ${M.divider}`,
                background:M.surfLow, color:M.textC, cursor:"pointer", fontSize:12, fontWeight:600,
                marginRight:"auto", fontFamily:uff }}>↩ Reset to Role Defaults</button>
          )}
          <button onClick={onClose} style={{ padding:"7px 16px", borderRadius:6,
            border:`1px solid ${M.divider}`, background:M.surfLow, color:M.textB,
            cursor:"pointer", fontSize:13, fontWeight:600, marginLeft:totalOverrides===0?"auto":0, fontFamily:uff }}>Cancel</button>
          <button onClick={() => onSave(draft)}
            style={{ padding:"7px 20px", borderRadius:6, border:"none",
              background:A.a, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:uff }}>
            ✅ Save Permissions
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// EDIT USER PANEL
// ══════════════════════════════════════════════════════════════════════════
function EditPanel({ user, users, onSave, onClose, onDeactivate, M, A, uff, dff }) {
  const isNew = !user;
  const [form, setForm] = useState(user ? { ...user } : {
    name:"", initials:"", email:"", role:"Operator", status:"Active",
    dept:"", reportTo:"-", notes:"",
    customMods:[], extraActions:[], deniedActions:[], deniedFields:[],
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]:v }));

  useEffect(() => {
    const parts = form.name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) upd("initials", (parts[0][0] + parts[1][0]).toUpperCase());
    else if (parts.length === 1) upd("initials", parts[0].slice(0,2).toUpperCase());
  }, [form.name]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:400,
      display:"flex", justifyContent:"flex-end", animation:"fadeIn 0.15s" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:420, height:"100vh", background:M.surfHigh, display:"flex",
        flexDirection:"column", boxShadow:"-6px 0 28px rgba(0,0,0,0.10)", animation:"slideInRight 0.22s", fontFamily:uff }}>

        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${M.divider}`,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background:M.surfMid, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:M.textA }}>{isNew ? "✨ Add New User" : "✏️ Edit User"}</div>
            <div style={{ fontSize:11, color:M.textC }}>FILE 1C › USER_MASTER</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:6,
            border:`1px solid ${M.divider}`, background:M.surfLow, cursor:"pointer", fontSize:18, lineHeight:1, fontFamily:uff }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"18px 20px" }}>
          {/* Role banner */}
          <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:18,
            background:ROLE_DEFS[form.role]?.bg || M.surfMid,
            border:`1px solid ${ROLE_DEFS[form.role]?.color || M.divider}30`,
            display:"flex", alignItems:"center", gap:8 }}>
            <RolePill role={form.role} />
            <span style={{ fontSize:11, color:ROLE_DEFS[form.role]?.color || M.textC, fontWeight:600 }}>
              {form.role==="Admin"?"Full system access":form.role==="Manager"?"All modules + reports":
               form.role==="Supervisor"?"Core ops modules":form.role==="Operator"?"Assigned modules only":"Read-only access"}
            </span>
          </div>

          {/* Fields */}
          {[{ k:"name", l:"Full Name *", t:"text", p:"e.g. Rajesh Kumar" },
            { k:"email", l:"Email (Google Account) *", t:"email", p:"e.g. rajesh@cc.com" }].map(({ k, l, t, p }) => (
            <div key={k} style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:10, fontWeight:900, textTransform:"uppercase",
                letterSpacing:"0.1em", color:M.textC, marginBottom:5 }}>{l}</label>
              <input type={t} value={form[k] || ""} onChange={e => upd(k, e.target.value)} placeholder={p}
                style={{ width:"100%", padding:"8px 10px", border:`1px solid ${M.divider}`, borderRadius:6,
                  fontSize:13, color:M.textA, background:M.surfLow, fontFamily:uff, boxSizing:"border-box" }} />
            </div>
          ))}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            {[
              { k:"role",   l:"Role",   opts:Object.keys(ROLE_DEFS) },
              { k:"status", l:"Status", opts:["Active","Inactive","Suspended"] },
            ].map(({ k, l, opts }) => (
              <div key={k}>
                <label style={{ display:"block", fontSize:10, fontWeight:900, textTransform:"uppercase",
                  letterSpacing:"0.1em", color:M.textC, marginBottom:5 }}>{l}</label>
                <select value={form[k]} onChange={e => upd(k, e.target.value)}
                  style={{ width:"100%", padding:"8px 10px", border:`1px solid ${M.divider}`, borderRadius:6,
                    fontSize:13, color:M.textA, background:M.surfLow, cursor:"pointer", fontFamily:uff, boxSizing:"border-box" }}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:900, textTransform:"uppercase",
                letterSpacing:"0.1em", color:M.textC, marginBottom:5 }}>Department</label>
              <input value={form.dept || ""} onChange={e => upd("dept", e.target.value)} placeholder="e.g. Procurement"
                style={{ width:"100%", padding:"8px 10px", border:`1px solid ${M.divider}`, borderRadius:6,
                  fontSize:13, color:M.textA, background:M.surfLow, fontFamily:uff, boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:900, textTransform:"uppercase",
                letterSpacing:"0.1em", color:M.textC, marginBottom:5 }}>Reports To</label>
              <select value={form.reportTo || "-"} onChange={e => upd("reportTo", e.target.value)}
                style={{ width:"100%", padding:"8px 10px", border:`1px solid ${M.divider}`, borderRadius:6,
                  fontSize:13, color:M.textA, background:M.surfLow, cursor:"pointer", fontFamily:uff, boxSizing:"border-box" }}>
                <option value="-">— None —</option>
                {users.filter(u => u.id !== form.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:900, textTransform:"uppercase",
              letterSpacing:"0.1em", color:M.textC, marginBottom:5 }}>Notes</label>
            <textarea value={form.notes || ""} onChange={e => upd("notes", e.target.value)}
              placeholder="Admin notes about this user…" rows={3}
              style={{ width:"100%", padding:"8px 10px", border:`1px solid ${M.divider}`, borderRadius:6,
                fontSize:13, color:M.textA, background:M.surfLow, resize:"vertical", fontFamily:uff, boxSizing:"border-box" }} />
          </div>

          {!isNew && (
            <div style={{ padding:"10px 12px", borderRadius:7, background:A.al,
              border:`1px solid ${A.a}25`, fontSize:12, color:A.a, fontWeight:600 }}>
              💡 Use the <strong>🔑 Permissions</strong> button on the user card to manage custom access overrides.
            </div>
          )}
        </div>

        <div style={{ padding:"14px 20px", borderTop:`1px solid ${M.divider}`, background:M.surfMid,
          display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          {!isNew && (
            <button onClick={() => { onClose(); onDeactivate(user); }}
              style={{ padding:"7px 14px", borderRadius:6, border:"1px solid #fecaca",
              background:"#fff1f2", color:"#be123c", cursor:"pointer", fontSize:12,
              fontWeight:700, marginRight:"auto", fontFamily:uff }}>
              {user.status === "Suspended" ? "✅ Reactivate" : "🗑 Deactivate"}
            </button>
          )}
          <button onClick={onClose} style={{ padding:"7px 14px", borderRadius:6,
            border:`1px solid ${M.divider}`, background:M.surfLow, color:M.textB,
            cursor:"pointer", fontSize:13, fontWeight:600, marginLeft:isNew?"auto":0, fontFamily:uff }}>Cancel</button>
          <button onClick={() => onSave(form)}
            style={{ padding:"7px 18px", borderRadius:6, border:"none",
              background:A.a, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:uff }}>✅ Save User</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PERMISSION TABLE VIEW — Users × Permissions matrix with 3-state cells
// ══════════════════════════════════════════════════════════════════════════
const PERM_COLUMNS = [
  ...ALL_MODULES.map(m => ({ key: m, type: "mod", icon: MOD_ICONS[m], label: m })),
  ...ALL_ACTIONS.map(a => ({ key: a, type: "act", icon: ACT_ICONS[a], label: ACT_LABELS[a] })),
  ...ALL_EXPORTS.map(e => ({ key: e, type: "exp", icon: EXP_ICONS[e], label: EXP_LABELS[e] })),
  ...ALL_FIELDS.map(f =>  ({ key: f, type: "fld", icon: "🔒", label: FLD_LABELS[f] })),
];

const GROUP_RANGES = [
  { label: "MODULES", color: "#1D4ED8", count: ALL_MODULES.length },
  { label: "ACTIONS", color: "#7C3AED", count: ALL_ACTIONS.length },
  { label: "EXPORTS", color: "#15803D", count: ALL_EXPORTS.length },
  { label: "FIELDS",  color: "#BE123C", count: ALL_FIELDS.length },
];

function getCellState(user, col) {
  const rd = ROLE_DEFS[user.role];
  if (!rd) return "off";
  if (user.role === "Admin") return "admin";
  if (col.type === "mod") {
    if (user.customMods.length === 0) return rd.mods.includes(col.key) ? "role" : "off";
    return user.customMods.includes(col.key)
      ? (rd.mods.includes(col.key) ? "role" : "granted")
      : (rd.mods.includes(col.key) ? "denied" : "off");
  }
  if (col.type === "act") {
    if (user.extraActions.includes(col.key)) return "granted";
    if (user.deniedActions.includes(col.key)) return "denied";
    return rd.actions.includes(col.key) ? "role" : "off";
  }
  if (col.type === "exp") {
    const eff = getEffective(user);
    return eff.exports.includes(col.key) ? "role" : "off";
  }
  if (col.type === "fld") {
    return user.deniedFields.includes(col.key) ? "denied" : "role";
  }
  return "off";
}

const CELL_STYLES = {
  admin:   { bg: "#f3f4f6", color: "#9ca3af", symbol: "✓", cursor: "not-allowed" },
  role:    { bg: "#ffffff", color: "#9ca3af", symbol: "✓", cursor: "pointer" },
  granted: { bg: "#dcfce7", color: "#15803d", symbol: "✓", cursor: "pointer" },
  denied:  { bg: "#fee2e2", color: "#be123c", symbol: "✗", cursor: "pointer" },
  off:     { bg: "#ffffff", color: "#e5e7eb", symbol: "",  cursor: "pointer" },
};

function cyclePermission(user, col, setUsers) {
  if (user.role === "Admin") return;
  const rd = ROLE_DEFS[user.role];

  setUsers(prev => prev.map(u => {
    if (u.id !== user.id) return u;
    const next = { ...u, customMods: [...u.customMods], extraActions: [...u.extraActions], deniedActions: [...u.deniedActions], deniedFields: [...u.deniedFields] };

    if (col.type === "mod") {
      const inRole = rd.mods.includes(col.key);
      if (next.customMods.length === 0) {
        // first click: fork from role defaults
        next.customMods = inRole ? rd.mods.filter(m => m !== col.key) : [...rd.mods, col.key];
      } else if (next.customMods.includes(col.key)) {
        next.customMods = next.customMods.filter(m => m !== col.key);
      } else {
        next.customMods = [...next.customMods, col.key];
      }
      // if customMods matches role defaults exactly, reset to empty
      if (next.customMods.length === rd.mods.length && rd.mods.every(m => next.customMods.includes(m))) {
        next.customMods = [];
      }
    } else if (col.type === "act") {
      const inRole = rd.actions.includes(col.key);
      const isExtra = next.extraActions.includes(col.key);
      const isDenied = next.deniedActions.includes(col.key);
      if (inRole) {
        if (!isDenied) { next.deniedActions.push(col.key); next.extraActions = next.extraActions.filter(a => a !== col.key); }
        else { next.deniedActions = next.deniedActions.filter(a => a !== col.key); }
      } else {
        if (!isExtra) { next.extraActions.push(col.key); next.deniedActions = next.deniedActions.filter(a => a !== col.key); }
        else { next.extraActions = next.extraActions.filter(a => a !== col.key); }
      }
    } else if (col.type === "fld") {
      if (next.deniedFields.includes(col.key)) next.deniedFields = next.deniedFields.filter(f => f !== col.key);
      else next.deniedFields.push(col.key);
    }
    return next;
  }));
}

function PermissionTable({ users, setUsers, M, A, uff, dff, onEditUser, onPermUser }) {
  return (
    <div style={{ flex: 1, overflow: "auto", background: M.bg }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: 11, fontFamily: dff, width: "max-content", minWidth: "100%" }}>
        {/* Group header row */}
        <thead>
          <tr>
            <th colSpan={4} style={{ position: "sticky", left: 0, zIndex: 4, background: M.surfHigh, borderBottom: `2px solid ${M.divider}` }} />
            {GROUP_RANGES.map(g => (
              <th key={g.label} colSpan={g.count} style={{ padding: "5px 0", fontSize: 9, fontWeight: 900,
                letterSpacing: "0.1em", color: g.color, background: M.surfHigh,
                borderBottom: `2px solid ${g.color}40`, borderLeft: `2px solid ${M.divider}`, textAlign: "center" }}>
                {g.label}
              </th>
            ))}
          </tr>
          {/* Icon header row */}
          <tr>
            <th style={{ position: "sticky", left: 0, zIndex: 4, background: M.surfMid, padding: "6px 12px",
              textAlign: "left", fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: "0.08em",
              borderBottom: `1px solid ${M.divider}`, minWidth: 160 }}>USER</th>
            <th style={{ position: "sticky", left: 160, zIndex: 4, background: M.surfMid, padding: "6px 8px",
              fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: "0.08em",
              borderBottom: `1px solid ${M.divider}`, minWidth: 70 }}>ROLE</th>
            <th style={{ position: "sticky", left: 230, zIndex: 4, background: M.surfMid, padding: "6px 4px",
              fontSize: 9, fontWeight: 900, color: M.textD, borderBottom: `1px solid ${M.divider}`, minWidth: 28, textAlign: "center" }}>ST</th>
            <th style={{ position: "sticky", left: 258, zIndex: 4, background: M.surfMid, padding: "6px 4px",
              borderBottom: `1px solid ${M.divider}`, borderRight: `2px solid ${M.divider}`, minWidth: 36 }} />
            {PERM_COLUMNS.map((col, i) => {
              const isGroupStart = i === 0 || col.type !== PERM_COLUMNS[i - 1].type;
              return (
                <th key={col.key} title={col.label}
                  style={{ padding: "5px 2px", textAlign: "center", fontSize: 13, cursor: "default",
                    background: M.surfMid, borderBottom: `1px solid ${M.divider}`, minWidth: 34,
                    borderLeft: isGroupStart ? `2px solid ${M.divider}` : `1px solid ${M.divider}20` }}>
                  {col.icon}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {users.map((u, ri) => {
            const r = ROLE_DEFS[u.role];
            const isAdmin = u.role === "Admin";
            const overrides = countOverrides(u);
            return (
              <tr key={u.id} style={{ background: ri % 2 === 0 ? M.surfHigh : M.surfMid }}>
                {/* Frozen: Name */}
                <td style={{ position: "sticky", left: 0, zIndex: 2, background: ri % 2 === 0 ? M.surfHigh : M.surfMid,
                  padding: "7px 12px", borderBottom: `1px solid ${M.divider}`, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UserAvatar user={u} size={26} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: M.textA, fontFamily: uff }}>{u.name}</div>
                      <div style={{ fontSize: 9, color: M.textD, fontFamily: dff }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                {/* Frozen: Role */}
                <td style={{ position: "sticky", left: 160, zIndex: 2, background: ri % 2 === 0 ? M.surfHigh : M.surfMid,
                  padding: "4px 8px", borderBottom: `1px solid ${M.divider}` }}>
                  <RolePill role={u.role} sm />
                </td>
                {/* Frozen: Status */}
                <td style={{ position: "sticky", left: 230, zIndex: 2, background: ri % 2 === 0 ? M.surfHigh : M.surfMid,
                  padding: "4px", borderBottom: `1px solid ${M.divider}`, textAlign: "center" }}>
                  <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%",
                    background: u.status === "Active" ? "#22c55e" : u.status === "Suspended" ? "#ef4444" : "#9ca3af" }} />
                </td>
                {/* Frozen: Actions */}
                <td style={{ position: "sticky", left: 258, zIndex: 2, background: ri % 2 === 0 ? M.surfHigh : M.surfMid,
                  padding: "2px 4px", borderBottom: `1px solid ${M.divider}`, borderRight: `2px solid ${M.divider}` }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => onEditUser(u)} title="Edit user"
                      style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${M.divider}`,
                        background: M.surfLow, cursor: "pointer", fontSize: 10, padding: 0 }}>✏️</button>
                  </div>
                </td>
                {/* Permission cells */}
                {PERM_COLUMNS.map((col, i) => {
                  const state = getCellState(u, col);
                  const cs = CELL_STYLES[state];
                  const isGroupStart = i === 0 || col.type !== PERM_COLUMNS[i - 1].type;
                  return (
                    <td key={col.key}
                      onClick={() => state !== "admin" && cyclePermission(u, col, setUsers)}
                      title={`${u.name}: ${col.label} — ${state}`}
                      style={{ padding: 0, borderBottom: `1px solid ${M.divider}`,
                        borderLeft: isGroupStart ? `2px solid ${M.divider}` : `1px solid ${M.divider}20`,
                        textAlign: "center", cursor: cs.cursor, userSelect: "none" }}>
                      <div style={{ width: 32, height: 28, display: "flex", alignItems: "center",
                        justifyContent: "center", background: cs.bg, color: cs.color,
                        fontSize: 13, fontWeight: 800, transition: "background 0.1s",
                        margin: "0 auto" }}>
                        {cs.symbol}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE — Users & Roles (receives M, A, cfg, fz, dff from App)
// ══════════════════════════════════════════════════════════════════════════
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UsersPanel({ M, A, cfg, fz, dff }) {
  const uff = uiFF(cfg.uiFont);

  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [roleFilter, setRoleFilter]   = useState("All");
  const [search, setSearch]           = useState("");
  const [editUser, setEditUser]       = useState(null);  // null = closed, false = new, object = editing
  const [permUser, setPermUser]       = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [toast, setToast]             = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null); // user object for confirm dialog
  const [deactivateReason, setDeactivateReason] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"

  const showToast = (msg, type="ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch users from Google Sheet ──
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      if (data && Array.isArray(data) && data.length > 0) {
        // Normalize data from Sheet: ensure arrays for permission fields
        const normalized = data.map(u => ({
          ...u,
          customMods:   Array.isArray(u.customMods)   ? u.customMods   : u.customMods   ? String(u.customMods).split(",").map(s=>s.trim()).filter(Boolean) : [],
          extraActions: Array.isArray(u.extraActions)  ? u.extraActions  : u.extraActions  ? String(u.extraActions).split(",").map(s=>s.trim()).filter(Boolean) : [],
          deniedActions:Array.isArray(u.deniedActions) ? u.deniedActions : u.deniedActions ? String(u.deniedActions).split(",").map(s=>s.trim()).filter(Boolean) : [],
          deniedFields: Array.isArray(u.deniedFields)  ? u.deniedFields  : u.deniedFields  ? String(u.deniedFields).split(",").map(s=>s.trim()).filter(Boolean) : [],
          sessions:     Number(u.sessions) || 0,
          initials:     u.initials || (u.name ? u.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "??"),
        }));
        setUsers(normalized);
      } else {
        // Fallback to demo data if API returns empty
        setUsers(INIT_USERS);
      }
    } catch (err) {
      console.warn("Users API unavailable, using demo data:", err.message);
      setUsers(INIT_USERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const matchRole   = roleFilter === "All" || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const handleSaveUser = async (form) => {
    if (!form.name || !form.email) { showToast("Name and email are required", "error"); return; }
    if (!EMAIL_RE.test(form.email)) { showToast("Please enter a valid email address", "error"); return; }
    try {
      if (form.id) {
        await api.updateUser(form.id, form);
        setUsers(us => us.map(u => u.id === form.id ? { ...u, ...form } : u));
        showToast(`${form.name} updated successfully`);
      } else {
        const id = `USR-${String(users.length + 1).padStart(3,"0")}`;
        const newUser = { ...form, id, sessions:0, lastLogin:"Never",
          customMods:[], extraActions:[], deniedActions:[], deniedFields:[] };
        await api.saveUser(newUser);
        setUsers(us => [...us, newUser]);
        showToast(`${form.name} added`);
      }
      setEditUser(null);
    } catch (err) {
      showToast(`Save failed: ${err.message}`, "error");
    }
  };

  const handleSavePerms = async (draft) => {
    try {
      await api.updateUserPermissions(permUser.id, draft);
      setUsers(us => us.map(u => u.id === permUser.id ? { ...u, ...draft } : u));
      showToast(`Permissions saved for ${permUser.name}`);
      setPermUser(null);
    } catch (err) {
      showToast(`Permission save failed: ${err.message}`, "error");
    }
  };

  const handleDeactivateUser = async () => {
    if (!deactivateTarget) return;
    const u = deactivateTarget;
    const updatedStatus = u.status === "Suspended" ? "Active" : "Suspended";
    try {
      await api.updateUser(u.id, { ...u, status: updatedStatus, notes: u.notes ? `${u.notes} | ${updatedStatus}: ${deactivateReason}` : `${updatedStatus}: ${deactivateReason}` });
      setUsers(us => us.map(x => x.id === u.id ? { ...x, status: updatedStatus, notes: x.notes ? `${x.notes} | ${updatedStatus}: ${deactivateReason}` : `${updatedStatus}: ${deactivateReason}` } : x));
      showToast(`${u.name} ${updatedStatus === "Suspended" ? "deactivated" : "reactivated"}`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, "error");
    }
    setDeactivateTarget(null);
    setDeactivateReason("");
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    const rows = filtered.map(u => ({
      ID: u.id, Name: u.name, Email: u.email, Role: u.role, Status: u.status,
      Department: u.dept || "", ReportsTo: u.reportTo || "", LastLogin: u.lastLogin,
      Sessions: u.sessions, Overrides: countOverrides(u), Notes: u.notes || "",
    }));
    if (format === "clipboard") {
      const header = Object.keys(rows[0]).join("\t");
      const body = rows.map(r => Object.values(r).join("\t")).join("\n");
      navigator.clipboard.writeText(header + "\n" + body).then(
        () => showToast(`${rows.length} users copied to clipboard`),
        () => showToast("Clipboard copy failed", "error"),
      );
    } else if (format === "csv") {
      const header = Object.keys(rows[0]).join(",");
      const body = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
      const blob = new Blob([header + "\n" + body], { type: "text/csv" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `CC_ERP_Users_${new Date().toISOString().slice(0,10)}.csv`; a.click();
      showToast(`Exported ${rows.length} users as CSV`);
    } else {
      showToast(`${format.toUpperCase()} export coming soon`, "error");
    }
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:M.bg, fontFamily:uff }}>

      {/* Sub-toolbar */}
      <div style={{ background:M.surfHigh, borderBottom:`1px solid ${M.divider}`,
        padding:"0 24px", display:"flex", alignItems:"center", gap:10, height:46, flexShrink:0 }}>
        <div style={{ fontSize:15, fontWeight:800, color:M.textA }}>👥 Users & Roles</div>
        <div style={{ flex:1 }} />
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:12, color:M.textD }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            style={{ padding:"5px 10px 5px 26px", border:`1px solid ${M.divider}`, borderRadius:6,
              fontSize:12, width:200, color:M.textA, background:M.surfLow, fontFamily:uff, outline:"none" }} />
        </div>
        <div style={{ display:"flex", border:`1px solid ${M.divider}`, borderRadius:6, overflow:"hidden" }}>
          {[["cards","🃏"],["table","📊"]].map(([mode, icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} title={mode === "cards" ? "Card View" : "Permission Table"}
              style={{ padding:"5px 10px", border:"none", fontSize:14, cursor:"pointer", fontFamily:uff,
                background: viewMode === mode ? A.a : M.surfLow,
                color: viewMode === mode ? "#fff" : M.textC,
                transition:"all 0.12s" }}>
              {icon}
            </button>
          ))}
        </div>
        <div style={{ position:"relative" }}>
          <button onClick={() => setShowExportMenu(v => !v)} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${M.divider}`,
            background: showExportMenu ? A.al : M.surfLow, color: showExportMenu ? A.a : M.textB,
            cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:uff }}>📤 Export ▾</button>
          {showExportMenu && (
            <div style={{ position:"absolute", top:"100%", right:0, marginTop:4, background:M.surfHigh,
              border:`1px solid ${M.divider}`, borderRadius:8, boxShadow:"0 6px 24px rgba(0,0,0,0.12)",
              zIndex:100, minWidth:180, overflow:"hidden", animation:"scaleUp 0.12s" }}>
              {[["clipboard","📋 Copy to Clipboard"],["csv","📊 Download CSV"],["pdf","📄 Export PDF"],["excel","📗 Export Excel"]].map(([fmt, label]) => (
                <button key={fmt} onClick={() => handleExport(fmt)}
                  style={{ display:"block", width:"100%", padding:"9px 16px", border:"none",
                    background:"transparent", color:M.textA, cursor:"pointer", fontSize:12,
                    fontWeight:600, textAlign:"left", fontFamily:uff }}
                  onMouseEnter={e => e.currentTarget.style.background = M.surfMid}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setEditUser(false)}
          style={{ padding:"6px 18px", borderRadius:6, border:"none",
            background:A.a, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:uff }}>+ Add User</button>
      </div>

      {/* Role filter tabs */}
      <div style={{ background:M.surfHigh, borderBottom:`1px solid ${M.divider}`,
        padding:"10px 24px", display:"flex", gap:7, flexShrink:0, flexWrap:"wrap", alignItems:"center" }}>
        {[{ label:"All", color:A.a }, ...Object.entries(ROLE_DEFS).map(([r, d]) => ({ label:r, color:d.color }))].map(({ label, color }) => {
          const count  = label === "All" ? users.length : users.filter(u => u.role === label).length;
          const active = roleFilter === label;
          return (
            <button key={label} onClick={() => setRoleFilter(label)} style={{
              padding:"5px 14px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700,
              border: active ? "none" : `1px solid ${M.divider}`,
              background: active ? color : M.surfLow,
              color: active ? "#fff" : M.textB, transition:"all 0.15s",
              display:"flex", alignItems:"center", gap:5, fontFamily:uff }}>
              {label}
              <span style={{ padding:"1px 6px", borderRadius:9, fontSize:10, fontWeight:900,
                background: active ? "rgba(255,255,255,0.22)" : M.surfMid,
                color: active ? "#fff" : M.textC }}>{count}</span>
            </button>
          );
        })}
        <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center" }}>
          {[["Active","#22c55e"],["Suspended","#ef4444"]].map(([s, c]) => (
            <span key={s} style={{ fontSize:11, fontWeight:600, color:M.textC }}>
              <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:c, marginRight:4 }} />
              {s}: <span style={{ color:M.textA, fontFamily:dff, fontSize:11, fontWeight:700 }}>
                {users.filter(u => u.status === s).length}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Content area — Cards or Table */}
      {loading ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
          <div style={{ fontSize:28, animation:"spin 1s linear infinite" }}>⏳</div>
          <div style={{ fontSize:13, color:M.textC, fontFamily:uff, fontWeight:700 }}>Loading users from Google Sheet…</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : viewMode === "table" ? (
        <PermissionTable users={filtered} setUsers={setUsers} M={M} A={A} uff={uff} dff={dff}
          onEditUser={u => setEditUser(u)} onPermUser={u => setPermUser(u)} />
      ) : (
        <div style={{ flex:1, overflow:"auto", padding:"20px 24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:14 }}>
          {filtered.map(u => {
            const r         = ROLE_DEFS[u.role];
            const eff       = getEffective(u);
            const overrides = countOverrides(u);
            const isSel     = selectedCard === u.id;
            const isAdmin   = u.role === "Admin";

            return (
              <div key={u.id} onClick={() => setSelectedCard(isSel ? null : u.id)}
                style={{ background:M.surfHigh, borderRadius:12, overflow:"hidden",
                  border:`1px solid ${isSel ? A.a : M.divider}`,
                  boxShadow: isSel ? `0 0 0 2px ${A.a}40, ${M.shadow}` : M.shadow,
                  cursor:"pointer", transition:"all 0.15s",
                  borderTop:`3px solid ${r.color}` }}>

                {/* Card header */}
                <div style={{ padding:"14px 16px 10px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ position:"relative" }}>
                      <UserAvatar user={u} size={44} />
                      <div style={{ position:"absolute", bottom:1, right:1, width:11, height:11, borderRadius:"50%",
                        border:`2px solid ${M.surfHigh}`,
                        background: u.status==="Active" ? "#22c55e" : u.status==="Suspended" ? "#ef4444" : "#9ca3af" }} />
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                      <RolePill role={u.role} sm />
                      {overrides > 0 && !isAdmin && (
                        <span style={{ fontSize:9, fontWeight:900, background:"#f5f3ff", color:"#7C3AED",
                          borderRadius:10, padding:"1px 7px", border:"1px solid #ddd6fe" }}>
                          ⚡ {overrides} custom
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize:14, fontWeight:800, color:M.textA, marginBottom:2 }}>{u.name}</div>
                  <div style={{ fontSize:11, color:M.textC, fontFamily:dff,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:10 }}>
                    {u.email}
                  </div>

                  {/* Module dots */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
                    {ALL_MODULES.map(mod => {
                      const has           = eff.mods.includes(mod);
                      const isCustomGrant = !ROLE_DEFS[u.role].mods.includes(mod) && has;
                      const isCustomDeny  = ROLE_DEFS[u.role].mods.includes(mod) && !has;
                      return (
                        <span key={mod} title={`${mod}${isCustomGrant?" (custom grant)":isCustomDeny?" (custom deny)":""}`}
                          style={{ width:24, height:24, borderRadius:6, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:12, transition:"all 0.1s",
                            opacity: has ? 1 : 0.25,
                            background: isCustomGrant ? "#dcfce7" : isCustomDeny ? "#fee2e2" : has ? r.bg : M.surfMid,
                            border: `1.5px solid ${isCustomGrant?"#bbf7d0":isCustomDeny?"#fecaca":has?r.color+"30":M.divider}` }}>
                          {MOD_ICONS[mod]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Card footer */}
                <div style={{ padding:"9px 16px", borderTop:`1px solid ${M.divider}`,
                  background:M.surfMid, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:9, color:M.textD, fontWeight:700, textTransform:"uppercase",
                      letterSpacing:"0.08em" }}>Last login</div>
                    <div style={{ fontSize:11, fontWeight:700, color:M.textB, fontFamily:dff }}>{u.lastLogin}</div>
                  </div>
                  <div style={{ display:"flex", gap:5 }} onClick={e => e.stopPropagation()}>
                    {!isAdmin && (
                      <button onClick={() => setPermUser(u)}
                        style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:700,
                          border:`1px solid ${overrides > 0 ? "#ddd6fe" : M.divider}`,
                          background: overrides > 0 ? "#f5f3ff" : M.surfLow,
                          color: overrides > 0 ? "#7C3AED" : M.textB, transition:"all 0.15s",
                          whiteSpace:"nowrap", fontFamily:uff }}>
                        🔑 {overrides > 0 ? `${overrides} overrides` : "Permissions"}
                      </button>
                    )}
                    <button onClick={() => setEditUser(u)}
                      style={{ padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11,
                        fontWeight:600, border:`1px solid ${M.divider}`, background:M.surfLow, color:M.textB, fontFamily:uff }}>✏️</button>
                  </div>
                </div>

                {/* Expanded section */}
                {isSel && (
                  <div style={{ padding:"12px 16px", borderTop:`1px solid ${M.divider}`,
                    background:M.surfMid, animation:"scaleUp 0.15s" }}>
                    <div style={{ fontSize:9, fontWeight:900, textTransform:"uppercase",
                      letterSpacing:"0.1em", color:M.textD, marginBottom:7 }}>Effective Permissions</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                      {eff.actions.slice(0,6).map(a => (
                        <span key={a} style={{ padding:"2px 7px", borderRadius:4, fontSize:9, fontWeight:800,
                          background:"#dcfce7", color:"#15803d", border:"1px solid #bbf7d0" }}>
                          {ACT_ICONS[a]} {a.replace(/_/g," ")}
                        </span>
                      ))}
                      {eff.actions.length > 6 && (
                        <span style={{ padding:"2px 7px", borderRadius:4, fontSize:9, fontWeight:700,
                          background:M.surfLow, color:M.textC }}>+{eff.actions.length - 6} more</span>
                      )}
                    </div>
                    {eff.hiddenFields.length > 0 && (
                      <div style={{ fontSize:10, color:"#be123c", fontWeight:700, marginBottom:4 }}>
                        🔒 Hidden: {eff.hiddenFields.map(f => FLD_LABELS[f]).join(", ")}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:12, marginTop:6 }}>
                      <span style={{ fontSize:10, color:M.textC }}>
                        <span style={{ fontFamily:dff, fontWeight:700, color:M.textB }}>{u.id}</span>
                        {u.dept && <span> · {u.dept}</span>}
                      </span>
                      <span style={{ fontSize:10, color:M.textC }}>
                        Sessions: <span style={{ fontFamily:dff, fontWeight:700, color:M.textB }}>{u.sessions}</span>
                      </span>
                    </div>
                    {u.notes && (
                      <div style={{ fontSize:10, color:M.textC, fontStyle:"italic", marginTop:4 }}>💬 {u.notes}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
              <div style={{ fontSize:14, color:M.textC }}>No users match your filter</div>
            </div>
          )}
        </div>
      )}

      {/* Status bar */}
      {cfg.showStatusBar && (
        <div style={{ height:28, background:M.statusBg, borderTop:`1px solid ${M.divider}`,
          display:"flex", alignItems:"center", padding:"0 20px", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", gap:20 }}>
            {[["USERS", users.length],["SHOWING", filtered.length],
              ["WITH OVERRIDES", users.filter(u => countOverrides(u) > 0).length]].map(([l, v]) => (
              <span key={l} style={{ fontSize:9, fontWeight:900, color:M.textD, letterSpacing:"0.1em" }}>
                {l} <span style={{ fontFamily:dff, color:M.textB, fontSize:10 }}>{v}</span>
              </span>
            ))}
          </div>
          <span style={{ fontSize:9, color:M.textD, fontFamily:dff }}>
            CC ERP · FILE-1C · USER_MASTER · {new Date().toLocaleDateString("en-IN")}
          </span>
        </div>
      )}

      {/* PANELS */}
      {editUser !== null && (
        <EditPanel
          user={editUser === false ? null : editUser}
          users={users}
          onSave={handleSaveUser}
          onClose={() => setEditUser(null)}
          onDeactivate={u => setDeactivateTarget(u)}
          M={M} A={A} uff={uff} dff={dff}
        />
      )}
      {permUser !== null && (
        <PermissionsPanel
          user={permUser}
          onSave={handleSavePerms}
          onClose={() => setPermUser(null)}
          M={M} A={A} uff={uff} dff={dff}
        />
      )}

      {/* Deactivate Confirm Dialog */}
      {deactivateTarget && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:500,
          display:"flex", alignItems:"center", justifyContent:"center", animation:"fadeIn 0.12s" }}
          onClick={e => { if (e.target === e.currentTarget) { setDeactivateTarget(null); setDeactivateReason(""); } }}>
          <div style={{ width:400, background:M.surfHigh, borderRadius:14, overflow:"hidden",
            boxShadow:"0 12px 40px rgba(0,0,0,0.2)", animation:"scaleUp 0.15s", fontFamily:uff }}>
            <div style={{ padding:"18px 22px 14px", borderBottom:`1px solid ${M.divider}` }}>
              <div style={{ fontSize:15, fontWeight:800, color:M.textA }}>
                {deactivateTarget.status === "Suspended" ? "✅ Reactivate User" : "🗑 Deactivate User"}
              </div>
              <div style={{ fontSize:12, color:M.textC, marginTop:4 }}>
                {deactivateTarget.status === "Suspended"
                  ? `Reactivate ${deactivateTarget.name}? They will regain access.`
                  : `Suspend ${deactivateTarget.name}? They will lose all access immediately.`}
              </div>
            </div>
            <div style={{ padding:"16px 22px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <UserAvatar user={deactivateTarget} size={36} />
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:M.textA }}>{deactivateTarget.name}</div>
                  <div style={{ fontSize:11, color:M.textC, fontFamily:dff }}>{deactivateTarget.email} · {deactivateTarget.role}</div>
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:M.textB, marginBottom:4 }}>Reason (optional)</div>
              <textarea value={deactivateReason} onChange={e => setDeactivateReason(e.target.value)}
                placeholder="e.g. On leave, resigned, policy violation…"
                rows={2} style={{ width:"100%", padding:"8px 10px", borderRadius:6, border:`1px solid ${M.divider}`,
                  fontSize:12, fontFamily:uff, resize:"vertical", background:M.surfLow, color:M.textA, outline:"none" }} />
            </div>
            <div style={{ padding:"12px 22px 16px", display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => { setDeactivateTarget(null); setDeactivateReason(""); }}
                style={{ padding:"7px 16px", borderRadius:6, border:`1px solid ${M.divider}`,
                  background:M.surfLow, color:M.textB, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:uff }}>Cancel</button>
              <button onClick={handleDeactivateUser}
                style={{ padding:"7px 18px", borderRadius:6, border:"none", cursor:"pointer",
                  fontSize:12, fontWeight:700, fontFamily:uff,
                  background: deactivateTarget.status === "Suspended" ? "#15803d" : "#be123c", color:"#fff" }}>
                {deactivateTarget.status === "Suspended" ? "✅ Reactivate" : "🗑 Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close export menu on outside click */}
      {showExportMenu && (
        <div style={{ position:"fixed", inset:0, zIndex:50 }} onClick={() => setShowExportMenu(false)} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)",
          zIndex:999, padding:"10px 22px", borderRadius:8, fontSize:13, fontWeight:700,
          color:"#fff", background: toast.type==="error" ? "#be123c" : A.a,
          boxShadow:"0 4px 20px rgba(0,0,0,0.18)", display:"flex", alignItems:"center", gap:8,
          animation:"scaleUp 0.15s", fontFamily:uff }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleUp{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
      `}</style>
    </div>
  );
}
