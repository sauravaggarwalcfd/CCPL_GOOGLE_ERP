import { useState } from 'react';

const SORT_TYPES = [
  { id: 'auto',    label: 'Auto-detect' },
  { id: 'alpha',   label: 'Text (A→Z)'  },
  { id: 'numeric', label: 'Number'       },
  { id: 'date',    label: 'Date'         },
  { id: 'length',  label: 'Text length'  },
];

/**
 * ViewEditModal — 4-tab modal for creating / editing / duplicating a Records-tab saved view.
 *
 * Props:
 *   view          — existing view object | null (null = create new)
 *   mode          — 'create' | 'edit' | 'duplicate'
 *   allFields     — schema field array [{key, label, type, ...}]
 *   existingNames — string[] of names already taken (always includes "Default")
 *   onSave(data)  — called with { name, colOrder, hiddenC, sorts, filters, groupBy, subGroupBy }
 *   onCancel()
 *   M, A, uff, fz
 */
export default function ViewEditModal({
  view, mode = 'create', allFields, existingNames,
  onSave, onCancel, M, A, uff, fz = 13,
}) {
  const [tab, setTab] = useState('columns');

  // ── Name ──
  const initName = mode === 'duplicate' ? `${view?.name || ''} (copy)` : (view?.name || '');
  const [name, setName] = useState(initName);

  const RESERVED = ['Default', ...existingNames.filter(n => mode === 'edit' ? n !== view?.name : true)];
  const nameError = !name.trim()
    ? 'Name is required'
    : name.trim() === 'Default'
    ? '"Default" is reserved and cannot be used'
    : (mode !== 'edit' && existingNames.includes(name.trim()))
    ? `"${name.trim()}" already exists`
    : null;

  // ── Column state ──
  const initColOrder = view?.colOrder?.length ? [...view.colOrder] : allFields.map(f => f.key);
  const initHiddenC  = view?.hiddenC ? [...view.hiddenC] : [];
  const [colOrder, setColOrder] = useState(initColOrder);
  const [hiddenC,  setHiddenC]  = useState(initHiddenC);

  const toggleField   = (key, idx) => { if (idx === 0) return; setHiddenC(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]); };
  const showAllCols   = () => setHiddenC([]);
  const moveColUp     = (key) => setColOrder(p => { const i = p.indexOf(key); if (i <= 0) return p; const n = [...p]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; });
  const moveColDown   = (key) => setColOrder(p => { const i = p.indexOf(key); if (i >= p.length-1) return p; const n = [...p]; [n[i],n[i+1]]=[n[i+1],n[i]]; return n; });

  // ── Sort state ──
  const initSorts = view?.sorts ? view.sorts.map(s => ({ type: 'auto', nulls: 'last', ...s })) : [];
  const [sorts, setSorts] = useState(initSorts);

  const addSort     = () => { const used = sorts.map(s=>s.col); const next = allFields.find(f => !used.includes(f.key)); if (!next) return; setSorts(p => [...p, { col: next.key, dir: 'asc', type: 'auto', nulls: 'last' }]); };
  const removeSort  = (i) => setSorts(p => p.filter((_,j) => j !== i));
  const updateSort  = (i, patch) => setSorts(p => p.map((s,j) => j===i ? {...s,...patch} : s));
  const moveSortUp  = (i) => setSorts(p => { if (i===0) return p; const n=[...p]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; });
  const moveSortDown= (i) => setSorts(p => { if (i>=p.length-1) return p; const n=[...p]; [n[i],n[i+1]]=[n[i+1],n[i]]; return n; });

  // ── Filter state ──
  const [filters, setFilters] = useState(view?.filters ? { ...view.filters } : {});
  const clearFilter = (key) => setFilters(p => { const n={...p}; delete n[key]; return n; });
  const clearAllFilters = () => setFilters({});
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Group state ──
  const [groupBy,    setGroupBy]    = useState(view?.groupBy    || null);
  const [subGroupBy, setSubGroupBy] = useState(view?.subGroupBy || null);

  // ── Save ──
  const canSave = !nameError;
  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name:      name.trim(),
      colOrder:  [...colOrder],
      hiddenC:   [...hiddenC],
      sorts:     sorts.map(s => ({ ...s })),
      filters:   { ...filters },
      groupBy:   groupBy   || null,
      subGroupBy: subGroupBy || null,
    });
  };

  const TABS = [
    { id: 'columns', label: '⊟ Columns' },
    { id: 'sort',    label: '↕ Sort' },
    { id: 'filter',  label: `🔍 Filter${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}` },
    { id: 'group',   label: '⊞ Group' },
  ];

  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)', zIndex: 1100 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 700, maxWidth: '96vw', maxHeight: '90vh',
        background: M.surfHigh, border: `1px solid ${M.divider}`,
        borderRadius: 12, zIndex: 1101, boxShadow: M.shadow,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ background: '#7C3AED', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>🔖</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: uff }}>
              {mode === 'create' ? 'Save New View' : mode === 'duplicate' ? 'Duplicate View' : 'Edit View'}
            </div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.7)', fontFamily: uff }}>
              {mode === 'edit' ? `Editing: ${view?.name}` : 'Capture current table state into a named view'}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onCancel} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* ── View Name ── */}
        <div style={{ padding: '10px 18px', borderBottom: `1px solid ${M.divider}`, background: M.surfMid, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: uff, flexShrink: 0 }}>View Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='e.g. "Active Items Only"'
            style={{ flex: 1, padding: '6px 10px', border: `1.5px solid ${nameError ? '#ef4444' : M.inputBd}`, borderRadius: 6, fontSize: fz, fontFamily: uff, background: M.inputBg, color: M.textA, outline: 'none' }}
          />
          {nameError && <span style={{ fontSize: 9.5, color: '#ef4444', fontFamily: uff, whiteSpace: 'nowrap' }}>{nameError}</span>}
        </div>

        {/* ── Sub-tabs ── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${M.divider}`, background: M.surfMid, flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 11,
              fontWeight: tab === t.id ? 900 : 700, fontFamily: uff,
              background: tab === t.id ? M.surfHigh : 'transparent',
              color: tab === t.id ? '#7C3AED' : M.textC,
              borderBottom: `2px solid ${tab === t.id ? '#7C3AED' : 'transparent'}`,
              borderRadius: '4px 4px 0 0',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* COLUMNS */}
          {tab === 'columns' && (
            <div>
              <div style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${M.divider}`, background: M.surfMid }}>
                <span style={{ fontSize: 9, color: M.textC, fontFamily: uff }}>Check to show · ↑↓ to reorder · first column always visible</span>
                <div style={{ flex: 1 }} />
                <button onClick={showAllCols} style={{ fontSize: 9, fontWeight: 800, color: A.a, background: A.al, border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: uff }}>Show All</button>
              </div>
              {colOrder.map((key, idx) => {
                const f = allFields.find(fl => fl.key === key);
                if (!f) return null;
                const isHidden = hiddenC.includes(key);
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderBottom: `1px solid ${M.divider}`, background: isHidden ? M.surfLow || M.bg : M.surfHigh }}>
                    <div onClick={() => toggleField(key, idx)} style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${isHidden ? M.inputBd : A.a}`, background: isHidden ? 'transparent' : A.a, cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .1s' }}>
                      {!isHidden && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: fz - 1, fontWeight: 700, color: isHidden ? M.textD : M.textA, fontFamily: uff, textDecoration: isHidden ? 'line-through' : 'none' }}>
                      {f.label}
                      {f.required && <span style={{ color: '#ef4444', marginLeft: 3, fontSize: 9 }}>*</span>}
                      {idx === 0 && <span style={{ fontSize: 8, color: M.textD, marginLeft: 5, fontWeight: 400 }}>(primary key)</span>}
                    </span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button onClick={() => moveColUp(key)} disabled={idx === 0} style={{ width: 18, height: 18, border: 'none', background: M.surfLow || M.bg, borderRadius: 3, cursor: idx === 0 ? 'default' : 'pointer', color: M.textD, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                      <button onClick={() => moveColDown(key)} disabled={idx === colOrder.length - 1} style={{ width: 18, height: 18, border: 'none', background: M.surfLow || M.bg, borderRadius: 3, cursor: idx === colOrder.length - 1 ? 'default' : 'pointer', color: M.textD, opacity: idx === colOrder.length - 1 ? 0.3 : 1 }}>↓</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SORT */}
          {tab === 'sort' && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sorts.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: M.textD, fontSize: 12, fontFamily: uff, fontStyle: 'italic' }}>
                  No sort rules. Click "+ Add Sort Rule" below.
                </div>
              )}
              {sorts.map((s, idx) => {
                const field = allFields.find(f => f.key === s.col);
                const isNum = field?.type === 'number';
                return (
                  <div key={idx} style={{ background: M.surfMid, border: `1px solid ${M.divider}`, borderLeft: '3px solid #7C3AED', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: "'IBM Plex Mono',monospace", minWidth: 20 }}>#{idx + 1}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button onClick={() => moveSortUp(idx)} disabled={idx === 0} style={{ width: 18, height: 18, border: 'none', background: M.surfLow || M.bg, borderRadius: 3, cursor: idx === 0 ? 'default' : 'pointer', color: M.textD, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                        <button onClick={() => moveSortDown(idx)} disabled={idx === sorts.length - 1} style={{ width: 18, height: 18, border: 'none', background: M.surfLow || M.bg, borderRadius: 3, cursor: idx === sorts.length - 1 ? 'default' : 'pointer', color: M.textD, opacity: idx === sorts.length - 1 ? 0.3 : 1 }}>↓</button>
                      </div>
                      {idx > 0 && <span style={{ fontSize: 9, color: M.textD, fontFamily: uff }}>then by</span>}
                      <select value={s.col} onChange={e => updateSort(idx, { col: e.target.value })} style={{ flex: 1, padding: '4px 6px', border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textA, fontSize: fz - 2, fontFamily: uff, outline: 'none' }}>
                        {allFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                      <select value={s.dir} onChange={e => updateSort(idx, { dir: e.target.value })} style={{ width: 74, padding: '4px 6px', border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textA, fontSize: fz - 3, fontFamily: uff, outline: 'none' }}>
                        <option value="asc">{isNum ? '0→9' : 'A→Z'}</option>
                        <option value="desc">{isNum ? '9→0' : 'Z→A'}</option>
                      </select>
                      <button onClick={() => removeSort(idx)} style={{ width: 22, height: 22, border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 4, cursor: 'pointer', color: '#ef4444', fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                    {/* Advanced row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, paddingTop: 7, borderTop: `1px dashed ${M.divider}`, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 8.5, color: M.textD, fontFamily: uff }}>Type:</span>
                      {SORT_TYPES.map(t => (
                        <button key={t.id} onClick={() => updateSort(idx, { type: t.id })} style={{ padding: '2px 6px', border: `1px solid ${(s.type || 'auto') === t.id ? '#7C3AED' : M.inputBd}`, borderRadius: 3, background: (s.type || 'auto') === t.id ? 'rgba(124,58,237,.1)' : M.inputBg, color: (s.type || 'auto') === t.id ? '#7C3AED' : M.textB, fontSize: 8.5, fontWeight: (s.type || 'auto') === t.id ? 900 : 400, cursor: 'pointer', fontFamily: uff }}>{t.label}</button>
                      ))}
                      <span style={{ fontSize: 8.5, color: M.textD, fontFamily: uff, marginLeft: 6 }}>Nulls:</span>
                      {[{ id: 'last', label: 'Last' }, { id: 'first', label: 'First' }].map(n => (
                        <button key={n.id} onClick={() => updateSort(idx, { nulls: n.id })} style={{ padding: '2px 6px', border: `1px solid ${(s.nulls || 'last') === n.id ? '#7C3AED' : M.inputBd}`, borderRadius: 3, background: (s.nulls || 'last') === n.id ? 'rgba(124,58,237,.1)' : M.inputBg, color: (s.nulls || 'last') === n.id ? '#7C3AED' : M.textB, fontSize: 8.5, fontWeight: (s.nulls || 'last') === n.id ? 900 : 400, cursor: 'pointer', fontFamily: uff }}>{n.label}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button onClick={addSort} disabled={sorts.length >= allFields.length} style={{ padding: '7px', border: '2px dashed #7C3AED', borderRadius: 6, background: 'rgba(124,58,237,.06)', color: '#7C3AED', fontSize: 11, fontWeight: 900, cursor: sorts.length >= allFields.length ? 'default' : 'pointer', fontFamily: uff, opacity: sorts.length >= allFields.length ? 0.5 : 1 }}>+ Add Sort Rule</button>
            </div>
          )}

          {/* FILTER */}
          {tab === 'filter' && (
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: M.textC, fontFamily: uff }}>Per-column text filters — rows must match ALL active filters.</span>
                {activeFilterCount > 0 && <button onClick={clearAllFilters} style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: uff }}>Clear All ({activeFilterCount})</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allFields.map(f => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: fz - 2, fontWeight: 700, color: M.textB, fontFamily: uff, minWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        value={filters[f.key] || ''}
                        onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={`Filter by ${f.label}…`}
                        style={{ width: '100%', padding: '5px 26px 5px 8px', border: `1px solid ${filters[f.key] ? '#7C3AED' : M.inputBd}`, borderRadius: 5, fontSize: fz - 2, fontFamily: uff, background: M.inputBg, color: M.textA, outline: 'none', boxSizing: 'border-box' }}
                      />
                      {filters[f.key] && (
                        <button onClick={() => clearFilter(f.key)} style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: M.textD, fontSize: 12 }}>×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP */}
          {tab === 'group' && (
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 10, color: M.textC, fontFamily: uff, marginBottom: 12 }}>Group rows by a column value. Select primary grouping, then optionally add a sub-group.</div>
              {/* Primary */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: uff, marginBottom: 8 }}>Primary Group</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[{ key: null, label: 'None (no grouping)' }, ...allFields].map(f => (
                    <label key={f.key ?? '__none'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 5, background: groupBy === f.key ? A.al : M.surfMid, border: `1px solid ${groupBy === f.key ? A.a : M.divider}`, cursor: 'pointer' }}>
                      <input type="radio" checked={groupBy === f.key} onChange={() => { setGroupBy(f.key); if (f.key === null) setSubGroupBy(null); if (subGroupBy === f.key) setSubGroupBy(null); }} style={{ accentColor: A.a }} />
                      <span style={{ fontSize: fz - 1, fontWeight: 700, color: groupBy === f.key ? A.a : M.textB, fontFamily: uff }}>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Sub-group */}
              {groupBy && (
                <>
                  <div style={{ borderTop: '2px dashed #c4b5fd', margin: '12px 0' }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: uff, marginBottom: 8 }}>Sub-Group (optional)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[{ key: null, label: 'None' }, ...allFields.filter(f => f.key !== groupBy)].map(f => (
                        <label key={f.key ?? '__none'} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 5, background: subGroupBy === f.key ? 'rgba(124,58,237,.08)' : M.surfMid, border: `1px solid ${subGroupBy === f.key ? '#7C3AED' : M.divider}`, cursor: 'pointer' }}>
                          <input type="radio" checked={subGroupBy === f.key} onChange={() => setSubGroupBy(f.key)} style={{ accentColor: '#7C3AED' }} />
                          <span style={{ fontSize: fz - 1, fontWeight: 700, color: subGroupBy === f.key ? '#7C3AED' : M.textB, fontFamily: uff }}>{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 8, background: M.surfMid, flexShrink: 0 }}>
          {nameError && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, fontFamily: uff }}>⚠ {nameError}</span>}
          <div style={{ flex: 1 }} />
          <button onClick={onCancel} style={{ padding: '8px 18px', border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave} style={{ padding: '8px 22px', border: 'none', borderRadius: 6, background: canSave ? '#7C3AED' : M.badgeBg, color: canSave ? '#fff' : M.textD, fontSize: 11, fontWeight: 900, cursor: canSave ? 'pointer' : 'default', fontFamily: uff }}>
            {mode === 'create' ? '💾 Save View' : mode === 'duplicate' ? '⧉ Save Copy' : '💾 Update View'}
          </button>
        </div>
      </div>
    </>
  );
}
