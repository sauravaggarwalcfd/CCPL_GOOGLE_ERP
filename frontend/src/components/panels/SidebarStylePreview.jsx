import { useState } from 'react';
import { MODS } from '../../constants/modules';

const PREV = MODS.slice(0, 6);

/* ── Style 1: Flat Left-Rail ── */
function S1({ M, A, fz, uff }) {
  const [hov, setHov] = useState(null);
  const [act, setAct] = useState('procurement');
  const [exp, setExp] = useState('procurement');
  return (
    <div style={{ fontFamily: uff }}>
      <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 1.4, textTransform: 'uppercase' }}>Modules</div>
      {PREV.map(mod => {
        const active = act === mod.id;
        const hover = hov === mod.id;
        const expanded = exp === mod.id;
        return (
          <div key={mod.id}>
            <button
              onMouseEnter={() => setHov(mod.id)} onMouseLeave={() => setHov(null)}
              onClick={() => { setAct(mod.id); setExp(expanded ? null : mod.id); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px',
                border: 'none', borderLeft: active ? `3px solid ${A.a}` : hover ? `3px solid ${A.a}80` : '3px solid transparent',
                background: active ? `${A.a}16` : hover ? `${A.a}09` : 'transparent',
                cursor: 'pointer', fontFamily: uff, transition: 'all .15s' }}>
              <span style={{ fontSize: 9, color: expanded ? A.a : M.textD, width: 12, flexShrink: 0, transition: 'transform .15s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>
              <span style={{ fontSize: 18 }}>{mod.icon}</span>
              <span style={{ fontSize: fz + 1, fontWeight: 700, color: active ? A.a : hover ? M.textA : M.textB, flex: 1, textAlign: 'left' }}>{mod.lbl}</span>
              {mod.badge > 0 && <span style={{ fontSize: 9, minWidth: 17, height: 17, borderRadius: 9, background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{mod.badge}</span>}
            </button>
            {expanded && mod.sub && (
              <div style={{ borderLeft: `2px solid ${M.divider}`, marginLeft: 45, marginRight: 6, marginBottom: 2 }}>
                {mod.sub.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: fz - 1, color: M.textC, fontWeight: 600, cursor: 'pointer' }}>
                    <span style={{ fontSize: 12, color: M.textD }}>{s.icon}</span>{s.lbl}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Style 2: Filled Pill ── */
function S2({ M, A, fz, uff }) {
  const [hov, setHov] = useState(null);
  const [act, setAct] = useState('procurement');
  const [exp, setExp] = useState('procurement');
  return (
    <div style={{ fontFamily: uff, padding: '4px 0' }}>
      <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 1.4, textTransform: 'uppercase' }}>Modules</div>
      {PREV.map(mod => {
        const active = act === mod.id;
        const hover = hov === mod.id;
        const expanded = exp === mod.id;
        return (
          <div key={mod.id}>
            <div style={{ padding: '2px 8px' }}>
              <button
                onMouseEnter={() => setHov(mod.id)} onMouseLeave={() => setHov(null)}
                onClick={() => { setAct(mod.id); setExp(expanded ? null : mod.id); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                  border: active ? 'none' : hover ? `1px solid ${A.a}` : '1px solid transparent',
                  borderRadius: 8,
                  background: active ? A.a : hover ? `${A.a}10` : 'transparent',
                  cursor: 'pointer', fontFamily: uff, transition: 'all .15s' }}>
                <span style={{ fontSize: 9, color: active ? '#fff' : expanded ? A.a : M.textD, width: 12, flexShrink: 0, transition: 'transform .15s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>
                <span style={{ fontSize: 18 }}>{mod.icon}</span>
                <span style={{ fontSize: fz + 1, fontWeight: 700, color: active ? '#fff' : hover ? A.a : M.textB, flex: 1, textAlign: 'left' }}>{mod.lbl}</span>
                {mod.badge > 0 && <span style={{ fontSize: 9, minWidth: 17, height: 17, borderRadius: 9, background: active ? '#ffffff55' : '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{mod.badge}</span>}
              </button>
            </div>
            {expanded && mod.sub && (
              <div style={{ marginLeft: 44, marginRight: 10, marginBottom: 4 }}>
                {mod.sub.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', fontSize: fz - 1, color: M.textC, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}>
                    <span style={{ fontSize: 12, color: M.textD }}>{s.icon}</span>{s.lbl}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Style 3: Module-Colored Rows ── */
function S3({ M, fz, uff }) {
  const [hov, setHov] = useState(null);
  const [act, setAct] = useState('procurement');
  const [exp, setExp] = useState('procurement');
  return (
    <div style={{ fontFamily: uff }}>
      <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 1.4, textTransform: 'uppercase' }}>Modules</div>
      {PREV.map(mod => {
        const active = act === mod.id;
        const hover = hov === mod.id;
        const expanded = exp === mod.id;
        const col = mod.col;
        return (
          <div key={mod.id}>
            <button
              onMouseEnter={() => setHov(mod.id)} onMouseLeave={() => setHov(null)}
              onClick={() => { setAct(mod.id); setExp(expanded ? null : mod.id); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px',
                border: 'none', borderLeft: active ? `3px solid ${col}` : hover ? `3px solid ${col}80` : '3px solid transparent',
                background: active ? `${col}18` : hover ? `${col}0c` : 'transparent',
                cursor: 'pointer', fontFamily: uff, transition: 'all .15s' }}>
              <span style={{ fontSize: 9, color: expanded ? col : M.textD, width: 12, flexShrink: 0, transition: 'transform .15s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>
              <span style={{ fontSize: 18 }}>{mod.icon}</span>
              <span style={{ fontSize: fz + 1, fontWeight: 700, color: active ? col : hover ? col + 'cc' : M.textB, flex: 1, textAlign: 'left' }}>{mod.lbl}</span>
              {mod.badge > 0 && <span style={{ fontSize: 9, minWidth: 17, height: 17, borderRadius: 9, background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{mod.badge}</span>}
            </button>
            {expanded && mod.sub && (
              <div style={{ borderLeft: `2px solid ${col}40`, marginLeft: 45, marginRight: 6, marginBottom: 2 }}>
                {mod.sub.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: fz - 1, color: col + 'cc', fontWeight: 600, cursor: 'pointer' }}>
                    <span style={{ fontSize: 12, color: col + '99' }}>{s.icon}</span>{s.lbl}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Style 4: Bold Card Sections ── */
function S4({ M, fz, uff }) {
  const [hov, setHov] = useState(null);
  const [act, setAct] = useState('procurement');
  const [exp, setExp] = useState('procurement');
  return (
    <div style={{ fontFamily: uff, padding: '4px 0' }}>
      <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 1.4, textTransform: 'uppercase' }}>Modules</div>
      {PREV.map(mod => {
        const active = act === mod.id;
        const hover = hov === mod.id;
        const expanded = exp === mod.id;
        const col = mod.col;
        if (expanded && active) {
          return (
            <div key={mod.id} style={{ margin: '3px 8px', borderRadius: 8, border: `1px solid ${col}40`, overflow: 'hidden', marginBottom: 4 }}>
              <button
                onClick={() => { setAct(mod.id); setExp(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
                  border: 'none', borderBottom: `1px solid ${col}30`,
                  background: `${col}18`, cursor: 'pointer', fontFamily: uff }}>
                <span style={{ fontSize: 9, color: col, width: 12, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(90deg)' }}>▶</span>
                <span style={{ fontSize: 18 }}>{mod.icon}</span>
                <span style={{ fontSize: fz + 1, fontWeight: 900, color: col, flex: 1, textAlign: 'left', textTransform: 'uppercase', letterSpacing: .5 }}>{mod.lbl}</span>
                {mod.badge > 0 && <span style={{ fontSize: 9, minWidth: 17, height: 17, borderRadius: 9, background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{mod.badge}</span>}
              </button>
              {mod.sub && mod.sub.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', borderBottom: i < mod.sub.length - 1 ? `1px solid ${M.divider}` : 'none', cursor: 'pointer', background: M.sidebarBg }}>
                  <span style={{ fontSize: 14, color: col + '99' }}>{s.icon}</span>
                  <span style={{ fontSize: fz, fontWeight: 600, color: M.textB }}>{s.lbl}</span>
                </div>
              ))}
            </div>
          );
        }
        return (
          <button key={mod.id}
            onMouseEnter={() => setHov(mod.id)} onMouseLeave={() => setHov(null)}
            onClick={() => { setAct(mod.id); setExp(mod.id); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px',
              border: 'none', borderLeft: hover ? `3px solid ${col}80` : '3px solid transparent',
              background: hover ? `${col}0c` : 'transparent',
              cursor: 'pointer', fontFamily: uff, transition: 'all .15s' }}>
            <span style={{ fontSize: 9, color: M.textD, width: 12, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>▶</span>
            <span style={{ fontSize: 18 }}>{mod.icon}</span>
            <span style={{ fontSize: fz + 1, fontWeight: 700, color: hover ? col : M.textB, flex: 1, textAlign: 'left' }}>{mod.lbl}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Style 5: Pill Header + Card Body (merged 2+4) ── */
function S5({ M, A, fz, uff }) {
  const [hov, setHov] = useState(null);
  const [act, setAct] = useState('procurement');
  const [exp, setExp] = useState('procurement');
  return (
    <div style={{ fontFamily: uff, padding: '4px 0' }}>
      <div style={{ padding: '8px 14px 4px', fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 1.4, textTransform: 'uppercase' }}>Modules</div>
      {PREV.map(mod => {
        const active = act === mod.id;
        const hover  = hov === mod.id;
        const expanded = exp === mod.id;

        /* ── Active + expanded: pill header fused to card body ── */
        if (active && expanded) {
          return (
            <div key={mod.id} style={{ margin: '3px 8px 6px', borderRadius: 10, border: `1.5px solid ${A.a}40`, overflow: 'hidden' }}>
              {/* Pill header — solid accent, white text */}
              <button
                onClick={() => setExp(null)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
                  border: 'none', background: A.a, cursor: 'pointer', fontFamily: uff }}>
                <span style={{ fontSize: 9, color: '#ffffffaa', width: 12, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(90deg)' }}>▶</span>
                <span style={{ fontSize: 19 }}>{mod.icon}</span>
                <span style={{ fontSize: fz + 1, fontWeight: 800, color: '#fff', flex: 1, textAlign: 'left' }}>{mod.lbl}</span>
                {mod.badge > 0 && <span style={{ fontSize: 9, minWidth: 17, height: 17, borderRadius: 9, background: '#ffffff33', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '1px solid #ffffff55' }}>{mod.badge}</span>}
              </button>
              {/* Card body — sub-items with dividers */}
              {mod.sub && mod.sub.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 16px',
                  borderTop: `1px solid ${M.divider}`,
                  background: M.sidebarBg, cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, color: A.a + '99', flexShrink: 0 }}>{s.icon}</span>
                  <span style={{ fontSize: fz, fontWeight: 600, color: M.textB }}>{s.lbl}</span>
                </div>
              ))}
            </div>
          );
        }

        /* ── Inactive: ghost pill on hover ── */
        return (
          <div key={mod.id} style={{ padding: '2px 8px' }}>
            <button
              onMouseEnter={() => setHov(mod.id)} onMouseLeave={() => setHov(null)}
              onClick={() => { setAct(mod.id); setExp(mod.id); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                border: hover ? `1px solid ${A.a}` : '1px solid transparent',
                borderRadius: 8,
                background: hover ? `${A.a}10` : 'transparent',
                cursor: 'pointer', fontFamily: uff, transition: 'all .15s' }}>
              <span style={{ fontSize: 9, color: M.textD, width: 12, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>▶</span>
              <span style={{ fontSize: 19 }}>{mod.icon}</span>
              <span style={{ fontSize: fz + 1, fontWeight: 700, color: hover ? A.a : M.textB, flex: 1, textAlign: 'left' }}>{mod.lbl}</span>
              {mod.badge > 0 && <span style={{ fontSize: 9, minWidth: 17, height: 17, borderRadius: 9, background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{mod.badge}</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Preview ── */
export default function SidebarStylePreview({ M, A, fz, uff, onSelect, onClose }) {
  const options = [
    { key: 1, name: 'Flat Left-Rail',       sub: 'Accent border + tint on hover',       Component: S1 },
    { key: 2, name: 'Filled Pill',          sub: 'Solid accent pill on active',          Component: S2 },
    { key: 3, name: 'Module-Colored',       sub: 'Each module uses its own color',       Component: S3 },
    { key: 4, name: 'Bold Card Sections',   sub: 'Active module becomes a card',         Component: S4 },
    { key: 5, name: 'Pill + Card ✦ New',   sub: 'Ghost pill hover → solid pill card',   Component: S5 },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: M.bg, zIndex: 9999, display: 'flex', flexDirection: 'column', fontFamily: uff, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 24px', borderBottom: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 12, background: M.surfHigh }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: M.textA }}>Sidebar Nav Style Preview</div>
          <div style={{ fontSize: 11, color: M.textD, marginTop: 2 }}>Hover over items · Click to toggle expand · Pick your style</div>
        </div>
        <button onClick={onClose} style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${M.divider}`, background: M.surfMid, color: M.textB, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>✕ Close</button>
      </div>

      {/* 5-column preview grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, alignItems: 'start' }}>
        {options.map(o => (
          <div key={o.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Label */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: o.key === 5 ? A.a : M.textA, display: 'flex', alignItems: 'center', gap: 5 }}>{o.name}</div>
              <div style={{ fontSize: 10, color: M.textD, marginTop: 2 }}>{o.sub}</div>
            </div>
            {/* Preview box */}
            <div style={{ border: o.key === 5 ? `2px solid ${A.a}50` : `1.5px solid ${M.divider}`, borderRadius: 10, overflow: 'hidden', background: M.sidebarBg, minHeight: 300 }}>
              <o.Component M={M} A={A} fz={fz} uff={uff} />
            </div>
            {/* Select button */}
            <button onClick={() => onSelect(o.key)}
              style={{ padding: '9px 0', borderRadius: 7,
                border: `1.5px solid ${A.a}`,
                background: o.key === 5 ? A.a : 'transparent',
                color: o.key === 5 ? '#fff' : A.a,
                fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: uff, letterSpacing: .3, transition: 'all .15s' }}>
              {o.key === 5 ? '★ Use This Style' : '✓ Use This Style'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
