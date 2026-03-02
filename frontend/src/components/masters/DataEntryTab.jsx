import { useState } from 'react';
import { FieldInput, DtBadge, IcoCell } from './helpers/fieldInput';

// CC_RED — mandatory for Save to Sheet button and inline mode header
const CC_RED = '#CC0000';

// ── UI PREVIEW OPTIONS (A / B / C) ──────────────────────────────────────────
// Remove the PREVIEW_OPTS switcher once the user has picked a design.
const PREVIEW_OPTS = [
  { id: 'A', label: 'Card Sections', icon: '🗂' },
  { id: 'B', label: 'Wizard Steps',  icon: '🧭' },
  { id: 'C', label: 'Single Column', icon: '☰'  },
];

/**
 * DataEntryTab — Form + Inline entry modes for a master sheet.
 * Props: {
 *   enriched, formData, onChange, errors, isDirty,
 *   entryMode, visibleKeys, onClear, onSave, saving,
 *   M, A, uff, dff
 * }
 */
export default function DataEntryTab({
  enriched, formData, onChange, errors, isDirty,
  entryMode, visibleKeys, onClear, onSave, saving,
  M, A, uff, dff,
}) {
  const [showConfirm, setShowConfirm]   = useState(false);
  const [formLayout, setFormLayout]     = useState('A');   // 'A' | 'B' | 'C'

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => { setShowConfirm(false); onSave(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Preview Switcher Bar ── */}
      {entryMode === 'form' && (
        <div style={{
          padding: '5px 14px', borderBottom: `1px solid ${M.divider}`,
          display: 'flex', alignItems: 'center', gap: 6,
          background: M.surfHigh, flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: .8, textTransform: 'uppercase', fontFamily: uff }}>
            Form Layout:
          </span>
          {PREVIEW_OPTS.map(o => (
            <button key={o.id} onClick={() => setFormLayout(o.id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 5, cursor: 'pointer',
              border: `1.5px solid ${formLayout === o.id ? A.a : M.inputBd}`,
              background: formLayout === o.id ? A.al : M.inputBg,
              color: formLayout === o.id ? A.a : M.textB,
              fontSize: 10, fontWeight: formLayout === o.id ? 900 : 700,
              fontFamily: uff, transition: 'all .15s',
            }}>
              <span>{o.icon}</span>
              <span>{o.label}</span>
              {formLayout === o.id && (
                <span style={{
                  background: A.a, color: '#fff', borderRadius: 10,
                  padding: '1px 6px', fontSize: 8, fontWeight: 900,
                }}>Active</span>
              )}
            </button>
          ))}
          <span style={{ fontSize: 9, color: M.textD, fontFamily: uff, marginLeft: 8, fontStyle: 'italic' }}>
            Preview only — pick your favourite, then we'll lock it in.
          </span>
        </div>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {entryMode === 'form' ? (
          formLayout === 'A' ? (
            <FormViewA enriched={enriched} formData={formData} onChange={onChange} errors={errors} visibleKeys={visibleKeys} M={M} A={A} uff={uff} dff={dff} />
          ) : formLayout === 'B' ? (
            <FormViewB enriched={enriched} formData={formData} onChange={onChange} errors={errors} visibleKeys={visibleKeys} M={M} A={A} uff={uff} dff={dff} />
          ) : (
            <FormViewC enriched={enriched} formData={formData} onChange={onChange} errors={errors} visibleKeys={visibleKeys} M={M} A={A} uff={uff} dff={dff} />
          )
        ) : (
          <InlineView enriched={enriched} formData={formData} onChange={onChange} errors={errors} visibleKeys={visibleKeys} M={M} A={A} uff={uff} dff={dff} />
        )}
      </div>

      {/* ── Entry Footer ── */}
      <div style={{ padding: '8px 14px', borderTop: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 8, background: M.surfMid, flexShrink: 0 }}>
        {isDirty && <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 900, fontFamily: uff }}>● Unsaved changes</span>}
        <div style={{ flex: 1 }} />
        <button onClick={onClear} style={{ padding: '6px 14px', border: `1px solid ${M.inputBd}`, borderRadius: 5, background: M.inputBg, color: M.textB, fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>↺ Clear</button>
        <button onClick={handleSaveClick} disabled={saving}
          style={{ padding: '6px 20px', border: 'none', borderRadius: 5, background: saving ? M.textD : CC_RED, color: '#fff', fontSize: 10, fontWeight: 900, cursor: saving ? 'default' : 'pointer', fontFamily: uff }}>
          {saving ? 'Saving…' : '✓ Save to Sheet'}
        </button>
      </div>

      {/* ── Confirm Save Modal ── */}
      {showConfirm && (
        <ConfirmSaveModal
          enriched={enriched} formData={formData} visibleKeys={visibleKeys}
          onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)}
          M={M} A={A} uff={uff} dff={dff}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  OPTION A — Card Sections (accordion 2-col grid)
// ═══════════════════════════════════════════════════════════════════════════════
function FormViewA({ enriched, formData, onChange, errors, visibleKeys, M, A, uff, dff }) {
  const [openSec, setOpenSec] = useState(() => enriched.sections.map(s => s.id));
  const toggleSec = (id) => setOpenSec(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // filled / total stats
  const totalFields  = enriched.fields.filter(f => visibleKeys.includes(f.key) && !f.auto && !['calc','autocode','auto'].includes(f.fieldType));
  const filledCount  = totalFields.filter(f => formData[f.key]).length;
  const errCount     = Object.keys(errors).length;

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Mini progress bar */}
      <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 10, background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, flexShrink: 0 }}>
        <div style={{ flex: 1, height: 5, background: M.divider, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalFields.length ? (filledCount / totalFields.length) * 100 : 0}%`, background: errCount ? '#ef4444' : A.a, borderRadius: 4, transition: 'width .3s' }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 900, color: M.textD, fontFamily: uff, whiteSpace: 'nowrap' }}>
          {filledCount} / {totalFields.length} filled
        </span>
        {errCount > 0 && (
          <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 3, padding: '1px 7px', fontSize: 9, fontWeight: 900, fontFamily: uff }}>
            {errCount} error{errCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {enriched.sections.map(sec => {
          const secFields = enriched.fields.filter(f => sec.cols.includes(f.col) && visibleKeys.includes(f.key));
          if (secFields.length === 0) return null;
          const open = openSec.includes(sec.id);
          const secErrors = secFields.filter(f => errors[f.key]).length;
          const secFilled = secFields.filter(f => formData[f.key]).length;

          return (
            <div key={sec.id} style={{
              border: `1px solid ${secErrors > 0 ? '#ef4444' : open ? A.a + '40' : M.divider}`,
              borderRadius: 8, overflow: 'hidden',
              boxShadow: open ? `0 2px 8px ${A.a}10` : 'none',
              transition: 'box-shadow .2s',
            }}>
              {/* Section header */}
              <button onClick={() => toggleSec(sec.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px',
                background: open ? `${A.a}10` : M.surfMid,
                border: 'none', cursor: 'pointer',
                borderBottom: `1px solid ${open ? A.a + '20' : 'transparent'}`,
              }}>
                <span style={{ fontSize: 16 }}>{sec.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: open ? A.a : M.textA, flex: 1, textAlign: 'left', fontFamily: uff }}>{sec.title}</span>
                {/* Progress dot row */}
                <span style={{ fontSize: 9, color: M.textC, fontFamily: uff }}>{secFilled}/{secFields.length}</span>
                {secErrors > 0 && (
                  <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 3, padding: '1px 7px', fontSize: 9, fontWeight: 900 }}>
                    {secErrors} err
                  </span>
                )}
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: open ? A.a : M.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                  <span style={{ fontSize: 9, color: open ? '#fff' : M.textD, fontWeight: 900 }}>{open ? '▾' : '▸'}</span>
                </span>
              </button>

              {/* Section body */}
              {open && (
                <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', background: M.bg || M.surfLow }}>
                  {secFields.map(f => {
                    const isAuto = f.auto || ['calc','autocode','auto'].includes(f.fieldType);
                    return (
                      <div key={f.key} style={{ gridColumn: (f.type === 'textarea' || f.fieldType === 'textarea') ? '1 / -1' : 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <span style={{ fontFamily: dff, fontSize: 8, fontWeight: 700, color: M.textD, background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 3, padding: '1px 5px', minWidth: 22, textAlign: 'center' }}>{f.col}</span>
                          <span style={{ fontSize: 10, fontWeight: 900, color: errors[f.key] ? '#ef4444' : f.required && !isAuto ? A.a : M.textB, flex: 1, fontFamily: uff }}>
                            {f.required && !isAuto ? '⚠ ' : ''}{f.label}
                          </span>
                          <DtBadge type={f.fieldType} />
                        </div>
                        <FieldInput field={f} val={formData[f.key]} onChange={v => onChange(f.key, v)} M={M} A={A} uff={uff} dff={dff} compact={false} hasError={!!errors[f.key]} />
                        {errors[f.key] && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 3, fontWeight: 700, fontFamily: uff }}>{errors[f.key]}</div>}
                        {!errors[f.key] && !isAuto && f.hint && <div style={{ fontSize: 8.5, color: M.textD, marginTop: 3, fontFamily: uff }}>{f.hint}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  OPTION B — Wizard Steps (left nav + one section at a time)
// ═══════════════════════════════════════════════════════════════════════════════
function FormViewB({ enriched, formData, onChange, errors, visibleKeys, M, A, uff, dff }) {
  const sections = enriched.sections.filter(s => {
    const secFields = enriched.fields.filter(f => s.cols.includes(f.col) && visibleKeys.includes(f.key));
    return secFields.length > 0;
  });

  const [step, setStep] = useState(0);
  const currentSec = sections[step];
  if (!currentSec) return null;

  const secFields = enriched.fields.filter(f => currentSec.cols.includes(f.col) && visibleKeys.includes(f.key));
  const secFilled = secFields.filter(f => formData[f.key]).length;
  const secErrors = secFields.filter(f => errors[f.key]).length;
  const progress  = Math.round(((step + 1) / sections.length) * 100);

  // Per-section completion for sidebar dots
  const getSectionStatus = (s) => {
    const sf = enriched.fields.filter(f => s.cols.includes(f.col) && visibleKeys.includes(f.key));
    const errs = sf.filter(f => errors[f.key]).length;
    const filled = sf.filter(f => formData[f.key]).length;
    const req = sf.filter(f => f.required && !f.auto && !['calc','autocode','auto'].includes(f.fieldType)).length;
    const filledReq = sf.filter(f => f.required && !f.auto && !['calc','autocode','auto'].includes(f.fieldType) && formData[f.key]).length;
    if (errs) return 'error';
    if (req > 0 && filledReq === req) return 'done';
    if (filled > 0) return 'partial';
    return 'empty';
  };

  const STATUS_STYLE = {
    error:   { bg: '#fef2f2', tx: '#ef4444', dot: '#ef4444', border: '#fecaca' },
    done:    { bg: '#f0fdf4', tx: '#15803d', dot: '#22c55e', border: '#bbf7d0' },
    partial: { bg: '#fff7ed', tx: '#c2410c', dot: '#f59e0b', border: '#fed7aa' },
    empty:   { bg: 'transparent', tx: M.textC,  dot: M.divider, border: 'transparent' },
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Left Sidebar ── */}
      <div style={{ width: 180, borderRight: `1px solid ${M.divider}`, background: M.surfHigh, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Progress summary */}
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${M.divider}` }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: .6, fontFamily: uff, marginBottom: 6, textTransform: 'uppercase' }}>
            Step {step + 1} of {sections.length}
          </div>
          <div style={{ height: 4, background: M.divider, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: A.a, borderRadius: 3, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 8.5, color: M.textD, marginTop: 4, fontFamily: uff }}>{progress}% complete</div>
        </div>

        {/* Section list */}
        <div style={{ padding: '8px 0', flex: 1 }}>
          {sections.map((s, i) => {
            const status = getSectionStatus(s);
            const ss = STATUS_STYLE[status];
            const isActive = i === step;
            return (
              <button key={s.id} onClick={() => setStep(i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: isActive ? A.al : ss.bg,
                borderLeft: `3px solid ${isActive ? A.a : ss.dot}`,
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 10, fontWeight: isActive ? 900 : 700, color: isActive ? A.a : ss.tx, fontFamily: uff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ fontSize: 8, color: M.textD, fontFamily: uff, marginTop: 1 }}>
                    {enriched.fields.filter(f => s.cols.includes(f.col) && visibleKeys.includes(f.key)).length} fields
                  </div>
                </div>
                {status === 'done'    && <span style={{ fontSize: 11, color: '#22c55e' }}>✓</span>}
                {status === 'error'   && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 900 }}>!</span>}
                {status === 'partial' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Current Section ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Section header */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${M.divider}`, background: M.surfHigh, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{currentSec.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: M.textA, fontFamily: uff }}>{currentSec.title}</div>
              <div style={{ fontSize: 9.5, color: M.textC, fontFamily: uff, marginTop: 2 }}>
                {secFilled} of {secFields.length} fields filled
                {secErrors > 0 && <span style={{ marginLeft: 10, color: '#ef4444', fontWeight: 700 }}>· {secErrors} error{secErrors > 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {secFields.map(f => {
            const isAuto = f.auto || ['calc','autocode','auto'].includes(f.fieldType);
            return (
              <div key={f.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: dff, fontSize: 9, fontWeight: 700, color: M.textD, background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 3, padding: '1px 6px' }}>{f.col}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: errors[f.key] ? '#ef4444' : f.required && !isAuto ? A.a : M.textA, flex: 1, fontFamily: uff }}>
                    {f.required && !isAuto ? '⚠ ' : ''}{f.label}
                  </span>
                  <DtBadge type={f.fieldType} />
                  {f.fk && (
                    <span style={{ fontSize: 8, fontWeight: 900, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 3, padding: '1px 5px' }}>
                      FK: {f.fk}
                    </span>
                  )}
                </div>
                <FieldInput field={f} val={formData[f.key]} onChange={v => onChange(f.key, v)} M={M} A={A} uff={uff} dff={dff} compact={false} hasError={!!errors[f.key]} />
                {errors[f.key] && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontWeight: 700, fontFamily: uff }}>⚠ {errors[f.key]}</div>}
                {!errors[f.key] && !isAuto && f.hint && <div style={{ fontSize: 9, color: M.textD, marginTop: 4, fontFamily: uff }}>{f.hint}</div>}
              </div>
            );
          })}
        </div>

        {/* Prev / Next */}
        <div style={{ padding: '10px 20px', borderTop: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 8, background: M.surfMid, flexShrink: 0 }}>
          <button onClick={() => setStep(p => Math.max(0, p - 1))} disabled={step === 0}
            style={{ padding: '6px 16px', border: `1px solid ${M.inputBd}`, borderRadius: 5, background: M.inputBg, color: step === 0 ? M.textD : M.textB, fontSize: 11, fontWeight: 700, cursor: step === 0 ? 'default' : 'pointer', fontFamily: uff }}>
            ← Prev
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 9, color: M.textD, fontFamily: uff }}>
            {step + 1} / {sections.length}
          </div>
          {step < sections.length - 1 ? (
            <button onClick={() => setStep(p => Math.min(sections.length - 1, p + 1))}
              style={{ padding: '6px 16px', border: 'none', borderRadius: 5, background: A.a, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>
              Next →
            </button>
          ) : (
            <span style={{ fontSize: 9, color: '#15803d', fontWeight: 900, fontFamily: uff }}>✓ All sections done</span>
          )}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  OPTION C — Single Column Panel (flat, searchable, full-width)
// ═══════════════════════════════════════════════════════════════════════════════
function FormViewC({ enriched, formData, onChange, errors, visibleKeys, M, A, uff, dff }) {
  const [search, setSearch]         = useState('');
  const [showOnlyReq, setShowOnlyReq] = useState(false);

  const allFields = enriched.fields.filter(f => visibleKeys.includes(f.key));
  const filtered  = allFields
    .filter(f => !showOnlyReq || (f.required && !f.auto && !['calc','autocode','auto'].includes(f.fieldType)))
    .filter(f => !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.col.toLowerCase().includes(search.toLowerCase()));

  const manualCount  = allFields.filter(f => !f.auto && !['calc','autocode','auto'].includes(f.fieldType)).length;
  const filledCount  = allFields.filter(f => !f.auto && !['calc','autocode','auto'].includes(f.fieldType) && formData[f.key]).length;
  const errCount     = Object.keys(errors).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 8, background: M.surfHigh, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: M.inputBg, border: `1px solid ${M.inputBd}`, borderRadius: 5, overflow: 'hidden' }}>
          <span style={{ padding: '0 8px', fontSize: 12, color: M.textD }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter fields…"
            style={{ border: 'none', background: 'transparent', color: M.textA, fontSize: 11, padding: '5px 8px 5px 0', outline: 'none', width: 170, fontFamily: uff }} />
        </div>
        <button onClick={() => setShowOnlyReq(p => !p)} style={{
          padding: '4px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: uff,
          border: `1.5px solid ${showOnlyReq ? '#ef4444' : M.inputBd}`,
          background: showOnlyReq ? '#fef2f2' : M.inputBg,
          color: showOnlyReq ? '#ef4444' : M.textB,
        }}>
          ⚠ Required only
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: errCount ? '#ef4444' : M.textD, fontWeight: errCount ? 900 : 400, fontFamily: uff }}>
          {filledCount}/{manualCount} filled{errCount > 0 ? ` · ${errCount} errors` : ''}
        </span>
        {/* Progress bar */}
        <div style={{ width: 80, height: 4, background: M.divider, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${manualCount ? (filledCount / manualCount) * 100 : 0}%`, background: errCount ? '#ef4444' : A.a, borderRadius: 3, transition: 'width .3s' }} />
        </div>
      </div>

      {/* Field list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: M.textD, fontSize: 12, fontFamily: uff }}>No fields match "{search}"</div>
        ) : filtered.map((f, i) => {
          const isAuto = f.auto || ['calc','autocode','auto'].includes(f.fieldType);
          const filled = !!formData[f.key];
          const hasErr = !!errors[f.key];
          const isWide = f.type === 'textarea' || f.fieldType === 'textarea';

          return (
            <div key={f.key} style={{
              display: 'flex', alignItems: isWide ? 'flex-start' : 'center',
              gap: 0, padding: '0', borderBottom: `1px solid ${M.divider}`,
              background: hasErr ? '#fef2f240' : isAuto ? `${A.a}06` : i % 2 === 0 ? M.tblEven : M.tblOdd,
              borderLeft: `3px solid ${hasErr ? '#ef4444' : isAuto ? A.a + '30' : filled ? '#22c55e' : 'transparent'}`,
            }}>
              {/* Left: col letter + label + type */}
              <div style={{ width: 220, padding: '10px 14px', flexShrink: 0, borderRight: `1px solid ${M.divider}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: dff, fontSize: 8.5, fontWeight: 700, color: M.textD, background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 3, padding: '1px 5px', minWidth: 20, textAlign: 'center' }}>{f.col}</span>
                  {f.required && !isAuto && <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 900 }}>⚠</span>}
                  <DtBadge type={f.fieldType} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: hasErr ? '#ef4444' : isAuto ? A.a : M.textA, fontFamily: uff, lineHeight: 1.3 }}>{f.label}</div>
                {f.hint && !hasErr && <div style={{ fontSize: 8.5, color: M.textD, marginTop: 3, fontFamily: uff, lineHeight: 1.3 }}>{f.hint}</div>}
                {hasErr && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 3, fontWeight: 700, fontFamily: uff }}>{errors[f.key]}</div>}
              </div>

              {/* Right: input */}
              <div style={{ flex: 1, padding: '8px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <FieldInput field={f} val={formData[f.key]} onChange={v => onChange(f.key, v)} M={M} A={A} uff={uff} dff={dff} compact={true} hasError={hasErr} />
              </div>

              {/* Status indicator */}
              <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', flexShrink: 0 }}>
                {isAuto ? (
                  <span style={{ fontSize: 8.5, color: '#059669', fontWeight: 900, fontFamily: uff }}>AUTO</span>
                ) : filled ? (
                  <span style={{ fontSize: 14, color: '#22c55e' }}>✓</span>
                ) : hasErr ? (
                  <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 900 }}>!!</span>
                ) : f.required ? (
                  <span style={{ fontSize: 8, color: '#f59e0b', fontWeight: 900, fontFamily: uff }}>REQ</span>
                ) : (
                  <span style={{ fontSize: 8, color: M.textD, fontFamily: uff }}>opt</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  CONFIRM SAVE MODAL — 2-col summary, warning, ← Edit / ✅ Confirm & Save
// ═══════════════════════════════════════════════════════════════════════════════
function ConfirmSaveModal({ enriched, formData, visibleKeys, onConfirm, onCancel, M, A, uff, dff }) {
  const visFields    = enriched.fields.filter(f => visibleKeys.includes(f.key) && !f.hidden);
  const filledFields = visFields.filter(f => formData[f.key]);
  const emptyRequired = visFields.filter(f => f.required && !formData[f.key]);

  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)', zIndex: 1300 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 560, maxWidth: '95vw', maxHeight: '85vh',
        background: M.surfHigh, border: `1px solid ${M.divider}`,
        borderRadius: 12, zIndex: 1301, boxShadow: M.shadow,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: CC_RED, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: uff }}>Confirm Save to Sheet</div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.8)', fontFamily: uff, marginTop: 2 }}>Review the record before it is written to the Google Sheet</div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onCancel} style={{ width: 26, height: 26, borderRadius: 5, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Warning banner if required fields empty */}
        {emptyRequired.length > 0 && (
          <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#92400e', fontFamily: uff }}>
              {emptyRequired.length} required field{emptyRequired.length > 1 ? 's' : ''} not filled: {emptyRequired.map(f => f.label).join(', ')}
            </span>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          {/* Warning notice (spec §DATA_ENTRY-D) */}
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>ℹ️</span>
            <span style={{ fontSize: 10, color: '#c2410c', fontWeight: 700, fontFamily: uff }}>
              Saving writes one new row to the Google Sheet. To undo, edit directly in Google Sheets.
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
            {filledFields.map(f => (
              <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : undefined }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3, fontFamily: uff }}>
                  {f.label}{f.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
                </div>
                <div style={{ fontSize: 12, fontWeight: f.auto ? 600 : 700, color: f.auto ? A.a : M.textA, fontFamily: f.mono ? dff : uff, padding: '5px 9px', background: M.surfMid, borderRadius: 4, border: `1px solid ${M.divider}`, wordBreak: 'break-word' }}>
                  {String(formData[f.key])}
                </div>
              </div>
            ))}
          </div>
          {filledFields.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: M.textD, fontSize: 12, fontFamily: uff }}>No fields filled yet.</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${M.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: M.surfMid, flexShrink: 0 }}>
          <button onClick={onCancel} style={{ padding: '8px 20px', border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>
            ← Edit
          </button>
          <button onClick={onConfirm} style={{ padding: '8px 24px', border: 'none', borderRadius: 6, background: CC_RED, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>
            ✅ Confirm & Save
          </button>
        </div>
      </div>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  INLINE VIEW — dense table-style entry (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
function InlineView({ enriched, formData, onChange, errors, visibleKeys, M, A, uff, dff }) {
  const [activeKey, setActiveKey] = useState(null);
  const [search, setSearch] = useState('');

  const orderedFields = enriched.fields
    .filter(f => visibleKeys.includes(f.key))
    .filter(f => !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.key.toLowerCase().includes(search.toLowerCase()));

  const manualCount = orderedFields.filter(f => !f.auto && !['calc','autocode','auto'].includes(f.fieldType));
  const filledCount = manualCount.filter(f => formData[f.key]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '6px 14px', borderBottom: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 8, background: CC_RED, flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: 0.5, fontFamily: uff }}>⚡ INLINE ENTRY</div>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,.3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter fields…"
          style={{ border: '1px solid rgba(255,255,255,.4)', borderRadius: 4, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 11, padding: '3px 8px', outline: 'none', width: 180, fontFamily: uff }} />
        <div style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,.85)', fontWeight: 700, fontFamily: uff }}>
          {filledCount} / {manualCount.length} filled
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 36 }} /><col style={{ width: 30 }} />
            <col style={{ width: 34 }} /><col />
            <col style={{ width: 108 }} /><col />
            <col style={{ width: 50 }} />
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: CC_RED }}>
              {['COL','#','ICON','FIELD','TYPE','VALUE','STATUS'].map(h => (
                <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: 0.5, whiteSpace: 'nowrap', fontFamily: uff }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedFields.map((f, i) => {
              const isActive = activeKey === f.key;
              const isAuto = f.auto || ['calc','autocode','auto'].includes(f.fieldType);
              const filled = !!formData[f.key] && !isAuto;
              const hasErr = !!errors[f.key];
              const rowBg = isActive ? A.al : hasErr ? '#fef2f2' : (i % 2 === 0 ? M.tblEven : M.tblOdd);
              return (
                <tr key={f.key} onClick={() => !isAuto && setActiveKey(f.key)}
                  style={{ background: rowBg, borderBottom: `1px solid ${M.divider}`, cursor: isAuto ? 'default' : 'pointer', borderLeft: `3px solid ${isActive ? A.a : hasErr ? '#ef4444' : isAuto ? A.a + '20' : 'transparent'}` }}
                  onMouseEnter={e => { if (!isActive && !isAuto) e.currentTarget.style.background = M.hoverBg; }}
                  onMouseLeave={e => { if (!isActive && !isAuto) e.currentTarget.style.background = rowBg; }}>
                  <td style={{ padding: '7px 8px', fontFamily: dff, fontSize: 9.5, fontWeight: 700, color: M.textC }}>{f.col}</td>
                  <td style={{ padding: '7px 8px', fontFamily: dff, fontSize: 9, color: M.textD, textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center' }}><IcoCell ico={f.ico} A={A} /></td>
                  <td style={{ padding: '7px 8px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? A.a : M.textA, fontFamily: uff }}>{f.label}</div>
                    {!isActive && <div style={{ fontSize: 8, color: M.textD, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: uff }}>{f.hint}</div>}
                  </td>
                  <td style={{ padding: '7px 8px' }}><DtBadge type={f.fieldType} /></td>
                  <td style={{ padding: '6px 8px' }}>
                    {isActive ? (
                      <FieldInput field={f} val={formData[f.key]} onChange={v => onChange(f.key, v)} M={M} A={A} uff={uff} dff={dff} compact={true} hasError={hasErr} />
                    ) : isAuto ? (
                      <div style={{ fontSize: 11, color: A.a, background: A.al, border: `1px solid ${A.a}30`, borderRadius: 3, padding: '3px 8px', fontWeight: 700, fontFamily: dff }}>
                        {formData[f.key] || <span style={{ opacity: 0.6 }}>← auto</span>}
                      </div>
                    ) : formData[f.key] ? (
                      <div style={{ fontSize: 11, color: M.textA, fontWeight: 600, padding: '3px 2px', fontFamily: uff }}>{formData[f.key]}</div>
                    ) : (
                      <div style={{ fontSize: 11, color: M.textD, padding: '3px 2px', fontStyle: 'italic', borderBottom: `1px dashed ${M.inputBd}`, fontFamily: uff }}>
                        {f.required ? '⚠ required — click' : 'click to enter…'}
                      </div>
                    )}
                    {hasErr && <div style={{ fontSize: 8, color: '#ef4444', marginTop: 1, fontWeight: 700, fontFamily: uff }}>{errors[f.key]}</div>}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                    {isAuto ? <span style={{ color: '#059669', fontSize: 9, fontWeight: 900 }}>AUTO</span>
                      : filled ? <span style={{ color: '#059669', fontSize: 12 }}>✓</span>
                      : hasErr ? <span style={{ color: '#ef4444', fontSize: 9, fontWeight: 900 }}>!!</span>
                      : f.required ? <span style={{ color: '#f59e0b', fontSize: 9, fontWeight: 900 }}>req</span>
                      : <span style={{ color: M.textD, fontSize: 9 }}>opt</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
