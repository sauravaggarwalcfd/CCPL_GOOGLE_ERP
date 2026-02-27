/**
 * ViewsBar — horizontal pill bar for switching views.
 * Shows: "All Fields" pill, system views, custom views, + New, Manage.
 * Props: { views, activeViewId, onActivate, onNew, onManage, M, A, uff, dff }
 */
export default function ViewsBar({ views, activeViewId, onActivate, onNew, onManage, M, A, uff, dff }) {
  const isNone = !activeViewId;

  return (
    <div style={{
      padding: "5px 16px", display: "flex", alignItems: "center", gap: 6,
      borderBottom: `1px solid ${M.divider}`, background: M.surfMid, flexShrink: 0, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.8, fontFamily: uff, marginRight: 4 }}>VIEWS:</span>

      {/* All Fields pill */}
      <button
        onClick={() => onActivate(null)}
        style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 9.5, fontWeight: 800, cursor: "pointer",
          border: `1.5px solid ${isNone ? A.a : M.inputBd}`,
          background: isNone ? A.a : M.inputBg,
          color: isNone ? "#fff" : M.textB,
          fontFamily: uff,
        }}
      >
        All Fields
      </button>

      {/* Separator */}
      <div style={{ width: 1, height: 16, background: M.divider }} />

      {/* View pills */}
      {views.map(v => {
        const isActive = activeViewId === v.id;
        return (
          <button key={v.id} onClick={() => onActivate(isActive ? null : v.id)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px", borderRadius: 20, fontSize: 9.5, fontWeight: 800, cursor: "pointer",
              border: `1.5px solid ${isActive ? v.color : M.inputBd}`,
              background: isActive ? v.color : M.inputBg,
              color: isActive ? "#fff" : M.textB,
              fontFamily: uff,
            }}
          >
            <span style={{ fontSize: 11 }}>{v.icon}</span>
            <span>{v.name}</span>
            {v.isSystem && <span style={{ fontSize: 7, opacity: 0.7 }}>SYS</span>}
          </button>
        );
      })}

      {/* Separator */}
      <div style={{ width: 1, height: 16, background: M.divider }} />

      {/* + New View */}
      <button onClick={onNew}
        style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 9.5, fontWeight: 800, cursor: "pointer",
          border: `1.5px dashed ${A.a}`, background: A.al, color: A.a, fontFamily: uff,
        }}
      >
        + New View
      </button>

      {/* Manage */}
      <button onClick={onManage}
        style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 9.5, fontWeight: 700, cursor: "pointer",
          border: `1px solid ${M.inputBd}`, background: M.inputBg, color: M.textC, fontFamily: uff,
        }}
      >
        Manage
      </button>
    </div>
  );
}
