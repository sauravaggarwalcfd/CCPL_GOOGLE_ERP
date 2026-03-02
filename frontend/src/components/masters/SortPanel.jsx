import { useState } from 'react';

const SORT_TYPES = [
  { id: 'auto',    label: 'Auto'    },
  { id: 'alpha',   label: 'A→Z'     },
  { id: 'numeric', label: '#'       },
  { id: 'date',    label: 'Date'    },
  { id: 'length',  label: 'Len'     },
];

function dirLabel(field, dir) {
  const t = field?.type;
  if (t === 'number' || t === 'currency') return dir === 'asc' ? '1 → 9' : '9 → 1';
  if (t === 'date')                       return dir === 'asc' ? 'Oldest' : 'Newest';
  return dir === 'asc' ? 'A → Z' : 'Z → A';
}

/**
 * SortPanel — Notion-style sort rules slide-over.
 * Spec: §E — purple header, quick presets, drag-to-reorder, advanced row,
 *             active summary strip, full {col, dir, type, nulls} shape.
 *
 * Props: { fields, sorts, onSorts, onClose, M, A, uff, fz }
 */
export default function SortPanel({ fields, sorts, onSorts, onClose, M, A, uff, fz = 13 }) {
  // Seed with full shape (fill defaults for old {col,dir} entries)
  const [local, setLocal] = useState(
    sorts.map(s => ({ type: 'auto', nulls: 'last', ...s }))
  );
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);

  // ── Helpers ──
  const addSort = (colKey) => {
    const used = local.map(s => s.col);
    const key  = colKey || fields.find(f => !used.includes(f.key))?.key;
    if (!key) return;
    setLocal(p => [...p, { col: key, dir: 'asc', type: 'auto', nulls: 'last' }]);
  };
  const removeSort  = (i) => setLocal(p => p.filter((_,j) => j !== i));
  const clearAll    = () => setLocal([]);
  const updateSort  = (i, patch) => setLocal(p => p.map((s,j) => j===i ? {...s,...patch} : s));
  const moveUp      = (i) => setLocal(p => { if (i===0) return p; const n=[...p]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; });
  const moveDown    = (i) => setLocal(p => { if (i>=p.length-1) return p; const n=[...p]; [n[i],n[i+1]]=[n[i+1],n[i]]; return n; });

  // ── Drag-to-reorder ──
  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => { e.preventDefault(); setDropIdx(i); };
  const onDrop      = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDropIdx(null); return; }
    const n = [...local];
    const [mv] = n.splice(dragIdx, 1);
    n.splice(i, 0, mv);
    setLocal(n);
    setDragIdx(null);
    setDropIdx(null);
  };

  // ── Quick presets (find first "name"-ish and "code"-ish fields) ──
  const nameField = fields.find(f => ['name','item_name','description','desc'].includes(f.key.toLowerCase()) || f.label?.toLowerCase() === 'name') || fields[1];
  const codeField = fields[0];

  const applyPreset = (colKey, dir) => {
    setLocal(p => {
      const without = p.filter(s => s.col !== colKey);
      return [{ col: colKey, dir, type: 'auto', nulls: 'last' }, ...without];
    });
  };

  const availableCols = fields.filter(f => !local.map(s => s.col).includes(f.key));

  const apply = () => { onSorts(local); onClose(); };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(1px)', zIndex: 800 }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 440,
        background: M.surfHigh, borderLeft: `1px solid ${M.divider}`,
        zIndex: 801, display: 'flex', flexDirection: 'column', boxShadow: M.shadow,
      }}>

        {/* ── Header: purple bg ── */}
        <div style={{ background: '#7C3AED', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: uff }}>⇅ Sort Rules</span>
          {local.length > 0 && (
            <span style={{ background: 'rgba(255,255,255,.25)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 9, fontWeight: 900 }}>{local.length}</span>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={clearAll} style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.9)', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: uff }}>✕ Clear All</button>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 5, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* ── Quick Presets bar ── */}
        <div style={{ padding: '7px 14px', borderBottom: `1px solid ${M.divider}`, background: M.surfMid, display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, color: M.textD, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: uff }}>QUICK:</span>
          {nameField && (
            <>
              <button onClick={() => applyPreset(nameField.key, 'asc')} style={{ padding: '3px 8px', border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>Name A→Z</button>
              <button onClick={() => applyPreset(nameField.key, 'desc')} style={{ padding: '3px 8px', border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>Name Z→A</button>
            </>
          )}
          {codeField && (
            <button onClick={() => applyPreset(codeField.key, 'asc')} style={{ padding: '3px 8px', border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>Code ↑</button>
          )}
          <button onClick={clearAll} style={{ padding: '3px 8px', border: '1px solid #fecaca', borderRadius: 4, background: '#fef2f2', color: '#ef4444', fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>✕ Clear</button>
        </div>

        {/* ── Rules list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {local.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: M.textD, fontFamily: uff }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>⇅</div>
              <div style={{ fontSize: 12, fontStyle: 'italic' }}>No sort rules yet.</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Use quick presets above or click "+ Add Sort" below.</div>
            </div>
          )}

          {local.map((s, idx) => {
            const field = fields.find(f => f.key === s.col);
            const isDragging  = dragIdx === idx;
            const isDropTarget = dropIdx === idx && dragIdx !== null && dragIdx !== idx;
            return (
              <div key={idx}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={e => onDragOver(e, idx)}
                onDrop={() => onDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                style={{
                  background: M.surfMid,
                  border: `1px solid ${isDropTarget ? '#f59e0b' : isDragging ? '#7C3AED' : M.divider}`,
                  borderLeft: `3px solid ${isDropTarget ? '#f59e0b' : '#7C3AED'}`,
                  borderRadius: 8, padding: '8px 10px',
                  opacity: isDragging ? 0.45 : 1,
                  transition: 'opacity .1s, border-color .1s',
                  cursor: 'grab',
                }}
              >
                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, color: M.textD, cursor: 'grab', flexShrink: 0, lineHeight: 1 }}>⠿</span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: "'IBM Plex Mono',monospace", minWidth: 20 }}>#{idx + 1}</span>
                  {idx > 0 && <span style={{ fontSize: 9, color: M.textD, fontFamily: uff }}>then by</span>}
                  <select value={s.col} onChange={e => updateSort(idx, { col: e.target.value })} style={{ flex: 1, padding: '4px 6px', border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textA, fontSize: fz - 2, fontFamily: uff, outline: 'none', cursor: 'pointer' }}>
                    {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <button
                    onClick={() => updateSort(idx, { dir: s.dir === 'asc' ? 'desc' : 'asc' })}
                    style={{ padding: '4px 8px', border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap' }}
                  >
                    {dirLabel(field, s.dir)}
                  </button>
                  <button onClick={() => removeSort(idx)} style={{ width: 22, height: 22, border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 4, cursor: 'pointer', color: '#ef4444', fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>

                {/* ▼ Advanced row: type + nulls + ↑↓ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7, paddingTop: 7, borderTop: `1px dashed ${M.divider}`, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 8.5, color: M.textD, fontFamily: uff }}>Type:</span>
                  {SORT_TYPES.map(t => (
                    <button key={t.id} onClick={() => updateSort(idx, { type: t.id })} style={{ padding: '2px 6px', border: `1px solid ${(s.type || 'auto') === t.id ? '#7C3AED' : M.inputBd}`, borderRadius: 3, background: (s.type || 'auto') === t.id ? 'rgba(124,58,237,.1)' : M.inputBg, color: (s.type || 'auto') === t.id ? '#7C3AED' : M.textB, fontSize: 8.5, fontWeight: (s.type || 'auto') === t.id ? 900 : 400, cursor: 'pointer', fontFamily: uff }}>{t.label}</button>
                  ))}
                  <span style={{ fontSize: 8.5, color: M.textD, fontFamily: uff, marginLeft: 4 }}>∅:</span>
                  {[{ id: 'last', label: 'Last' }, { id: 'first', label: 'First' }].map(n => (
                    <button key={n.id} onClick={() => updateSort(idx, { nulls: n.id })} style={{ padding: '2px 6px', border: `1px solid ${(s.nulls || 'last') === n.id ? '#7C3AED' : M.inputBd}`, borderRadius: 3, background: (s.nulls || 'last') === n.id ? 'rgba(124,58,237,.1)' : M.inputBg, color: (s.nulls || 'last') === n.id ? '#7C3AED' : M.textB, fontSize: 8.5, fontWeight: (s.nulls || 'last') === n.id ? 900 : 400, cursor: 'pointer', fontFamily: uff }}>{n.label}</button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ width: 18, height: 18, border: 'none', background: M.surfLow || M.bg, borderRadius: 3, cursor: idx === 0 ? 'default' : 'pointer', color: M.textD, opacity: idx === 0 ? 0.3 : 1, fontSize: 9 }}>↑</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === local.length - 1} style={{ width: 18, height: 18, border: 'none', background: M.surfLow || M.bg, borderRadius: 3, cursor: idx === local.length - 1 ? 'default' : 'pointer', color: M.textD, opacity: idx === local.length - 1 ? 0.3 : 1, fontSize: 9 }}>↓</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Active sort summary strip ── */}
        {local.length > 0 && (
          <div style={{ padding: '6px 14px', borderTop: `1px solid ${M.divider}`, background: 'rgba(124,58,237,.06)', display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, color: '#7C3AED', fontFamily: uff }}>ACTIVE:</span>
            {local.map((s, i) => {
              const f = fields.find(fl => fl.key === s.col);
              return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.3)', borderRadius: 10, padding: '2px 7px', fontSize: 8.5, fontWeight: 800, color: '#7C3AED', fontFamily: uff }}>
                  {i + 1} {f?.label || s.col} {s.dir === 'asc' ? '↑' : '↓'} {s.nulls === 'first' ? '∅↑' : ''}
                </span>
              );
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${M.divider}`, display: 'flex', gap: 8, flexShrink: 0 }}>
          {availableCols.length > 0 && (
            <button onClick={() => addSort()} style={{ flex: 1, padding: '7px', border: '2px dashed #7C3AED', borderRadius: 6, background: 'rgba(124,58,237,.06)', color: '#7C3AED', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>
              + Add Sort
            </button>
          )}
          <button onClick={onClose} style={{ padding: '7px 14px', border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>Cancel</button>
          <button onClick={apply} style={{ flex: 2, padding: '7px', border: 'none', borderRadius: 6, background: '#7C3AED', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>✓ Apply</button>
        </div>
      </div>
    </>
  );
}
