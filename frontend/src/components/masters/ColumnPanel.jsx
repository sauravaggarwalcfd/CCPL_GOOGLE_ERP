import { useState } from 'react';

/**
 * ColumnPanel — slide-over panel for column visibility toggle + drag reorder.
 * Props: { fields, colOrder, hiddenC, onApply, onClose, M, A, uff, fz }
 */
export default function ColumnPanel({ fields, colOrder, hiddenC, onApply, onClose, M, A, uff, fz = 13 }) {
  const [localOrder, setLocalOrder] = useState([...colOrder]);
  const [localHidden, setLocalHidden] = useState([...hiddenC]);

  const visibleCount = localOrder.length - localHidden.length;

  const toggleField = (key) => {
    setLocalHidden(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const showAll = () => setLocalHidden([]);
  const hideAll = () => setLocalHidden(localOrder.filter((_, i) => i > 0)); // always keep first col visible

  const moveUp = (key) => setLocalOrder(prev => {
    const idx = prev.indexOf(key);
    if (idx <= 0) return prev;
    const n = [...prev];
    [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
    return n;
  });

  const moveDown = (key) => setLocalOrder(prev => {
    const idx = prev.indexOf(key);
    if (idx < 0 || idx >= prev.length - 1) return prev;
    const n = [...prev];
    [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
    return n;
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(1px)', zIndex: 800 }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 320,
        background: M.surfHigh, borderLeft: `1px solid ${M.divider}`,
        zIndex: 801, display: 'flex', flexDirection: 'column', boxShadow: M.shadow,
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: M.textA, fontFamily: uff }}>⫿ Columns</span>
          <span style={{ background: M.badgeBg, color: M.textC, borderRadius: 10, padding: '1px 7px', fontSize: 9, fontWeight: 900 }}>{visibleCount} of {localOrder.length} visible</span>
          <div style={{ flex: 1 }} />
          <button onClick={showAll} style={{ fontSize: 9, fontWeight: 800, color: A.a, background: A.al, border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: uff, marginRight: 4 }}>Show All</button>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${M.inputBd}`, background: M.inputBg, cursor: 'pointer', fontSize: 14, color: M.textB, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Explanation */}
        <div style={{ padding: '7px 16px', borderBottom: `1px solid ${M.divider}`, background: M.surfMid }}>
          <div style={{ fontSize: 9.5, color: M.textC, fontFamily: uff }}>Toggle visibility · use ↑↓ to reorder columns</div>
        </div>

        {/* Fields list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {localOrder.map((key, idx) => {
            const f = fields.find(fl => fl.key === key);
            if (!f) return null;
            const isHidden = localHidden.includes(key);
            const isFirst = idx === 0;
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                borderBottom: `1px solid ${M.divider}`,
                background: isHidden ? M.surfLow || M.bg : M.surfHigh,
                opacity: isHidden ? 0.6 : 1,
                transition: 'opacity .1s',
              }}>
                {/* Visibility toggle */}
                <div
                  onClick={() => !isFirst && toggleField(key)}
                  style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: `2px solid ${isHidden ? M.inputBd : A.a}`,
                    background: isHidden ? 'transparent' : A.a,
                    cursor: isFirst ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all .1s',
                  }}
                  title={isFirst ? 'Primary key — always visible' : isHidden ? 'Show column' : 'Hide column'}
                >
                  {!isHidden && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>

                {/* Label */}
                <span style={{ flex: 1, fontSize: fz - 1, fontWeight: isFirst ? 900 : 700, color: isFirst ? A.a : M.textA, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.label}
                  {f.required && <span style={{ color: '#ef4444', fontSize: 9, marginLeft: 3 }}>*</span>}
                  {f.auto && <span style={{ fontSize: 8, color: M.textD, marginLeft: 4, fontWeight: 400 }}>(auto)</span>}
                </span>

                {/* Move up/down */}
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => moveUp(key)} disabled={idx === 0} style={{ width: 18, height: 18, border: 'none', background: M.surfLow || M.bg, borderRadius: 3, cursor: idx === 0 ? 'default' : 'pointer', color: M.textD, fontSize: 9, opacity: idx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                  <button onClick={() => moveDown(key)} disabled={idx === localOrder.length - 1} style={{ width: 18, height: 18, border: 'none', background: M.surfLow || M.bg, borderRadius: 3, cursor: idx === localOrder.length - 1 ? 'default' : 'pointer', color: M.textD, fontSize: 9, opacity: idx === localOrder.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${M.divider}`, display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>Cancel</button>
          <button onClick={() => { onApply(localOrder, localHidden); onClose(); }} style={{ flex: 2, padding: '8px', border: 'none', borderRadius: 6, background: A.a, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>
            ✓ Apply
          </button>
        </div>
      </div>
    </>
  );
}
