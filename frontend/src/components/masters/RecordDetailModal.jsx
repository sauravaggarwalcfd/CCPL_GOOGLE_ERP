import { useState } from 'react';

/**
 * RecordDetailModal — 3-layout modal: Card Grid / Inline Table / JSON Raw
 * Props: { record, schema, onClose, onEdit, M, A, uff, dff, fz }
 */
export default function RecordDetailModal({ record, schema, onClose, onEdit, M, A, uff, dff, fz = 13 }) {
  const [layout, setLayout] = useState('card'); // 'card' | 'table' | 'json'

  const codeKey = schema[0]?.key || 'code';
  const codeVal = record[codeKey] || '—';
  const visFields = schema.filter(f => !f.hidden && f.w !== '0');

  const LAYOUTS = [
    { id: 'card',  label: '▦ Card' },
    { id: 'table', label: '≡ Table' },
    { id: 'json',  label: '{ } JSON' },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)', zIndex: 1100 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 660, maxWidth: '95vw', maxHeight: '88vh',
        background: M.surfHigh, border: `1px solid ${M.divider}`,
        borderRadius: 12, zIndex: 1101, boxShadow: M.shadow,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div style={{ background: A.a, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: uff }}>Record Detail</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', fontFamily: dff }}>{codeVal}</div>
          </div>
          <div style={{ flex: 1 }} />
          {/* Layout toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,.15)', borderRadius: 6, overflow: 'hidden', gap: 1 }}>
            {LAYOUTS.map(l => (
              <button key={l.id} onClick={() => setLayout(l.id)}
                style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: 9.5, fontWeight: layout === l.id ? 900 : 600, background: layout === l.id ? 'rgba(255,255,255,.3)' : 'transparent', color: '#fff', fontFamily: uff, transition: 'all .12s' }}>
                {l.label}
              </button>
            ))}
          </div>
          {onEdit && (
            <button onClick={() => onEdit(record)} style={{ padding: '4px 14px', border: '1px solid rgba(255,255,255,.4)', borderRadius: 5, background: 'rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 800, fontFamily: uff }}>
              ✏ Edit
            </button>
          )}
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {layout === 'card' && <CardLayout visFields={visFields} record={record} codeKey={codeKey} M={M} A={A} uff={uff} dff={dff} fz={fz} />}
          {layout === 'table' && <TableLayout visFields={visFields} record={record} codeKey={codeKey} M={M} A={A} uff={uff} dff={dff} fz={fz} />}
          {layout === 'json' && <JsonLayout record={record} M={M} uff={uff} dff={dff} />}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${M.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: M.surfMid, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>
            Close
          </button>
          {onEdit && (
            <button onClick={() => { onEdit(record); onClose(); }} style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: A.a, color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>
              ✏ Edit Record
            </button>
          )}
        </div>
      </div>
    </>
  );
}


// ── Layout 1: Card Grid (2-col) ──
function CardLayout({ visFields, record, codeKey, M, A, uff, dff, fz }) {
  return (
    <div style={{ padding: '18px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
        {visFields.map(f => {
          const val    = record[f.key];
          const hasVal = val !== undefined && val !== null && val !== '';
          return (
            <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : undefined }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: uff }}>
                {f.label}{f.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
              </div>
              <div style={{
                fontSize: fz, fontWeight: f.key === codeKey ? 800 : f.badge ? 700 : 400,
                color: f.key === codeKey ? A.a : M.textA, fontFamily: f.mono ? dff : uff,
                padding: '6px 10px', background: M.surfMid, borderRadius: 5, minHeight: 28,
                display: 'flex', alignItems: 'center', border: `1px solid ${M.divider}`,
              }}>
                {hasVal ? (
                  f.badge ? (
                    <span style={{ fontSize: fz - 1, fontWeight: 800, padding: '2px 10px', borderRadius: 12, background: STATUS_BG[val] || '#f3f4f6', color: STATUS_TX[val] || '#6b7280' }}>{val}</span>
                  ) : String(val)
                ) : (
                  <span style={{ color: M.textD, fontStyle: 'italic', fontSize: fz - 2 }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Layout 2: Inline Table ──
function TableLayout({ visFields, record, codeKey, M, A, uff, dff, fz }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
        <tr style={{ background: M.tblHead }}>
          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 900, color: M.textD, borderBottom: `2px solid ${M.divider}`, fontFamily: uff, letterSpacing: 0.5 }}>FIELD</th>
          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 900, color: M.textD, borderBottom: `2px solid ${M.divider}`, fontFamily: uff, letterSpacing: 0.5 }}>VALUE</th>
        </tr>
      </thead>
      <tbody>
        {visFields.map((f, i) => {
          const val    = record[f.key];
          const hasVal = val !== undefined && val !== null && val !== '';
          return (
            <tr key={f.key} style={{ background: i % 2 === 0 ? M.tblEven : M.tblOdd, borderBottom: `1px solid ${M.divider}` }}>
              <td style={{ padding: '7px 14px', fontSize: fz - 2, fontWeight: 700, color: f.key === codeKey ? A.a : M.textC, fontFamily: uff, whiteSpace: 'nowrap', borderRight: `1px solid ${M.divider}`, width: 180 }}>
                {f.label}
                {f.required && <span style={{ color: '#ef4444', marginLeft: 3, fontSize: 9 }}>*</span>}
              </td>
              <td style={{ padding: '7px 14px', fontSize: fz - 1, color: M.textA, fontFamily: f.mono ? dff : uff }}>
                {hasVal ? (
                  f.badge ? (
                    <span style={{ fontSize: fz - 2, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: STATUS_BG[val] || '#f3f4f6', color: STATUS_TX[val] || '#6b7280' }}>{val}</span>
                  ) : String(val)
                ) : (
                  <span style={{ color: M.textD, fontStyle: 'italic', fontSize: fz - 2 }}>—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}


// ── Layout 3: JSON Raw ──
function JsonLayout({ record, M, uff, dff }) {
  const json = JSON.stringify(record, null, 2);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={handleCopy} style={{ padding: '4px 12px', border: `1px solid ${M.inputBd}`, borderRadius: 5, background: M.inputBg, color: M.textB, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>
          {copied ? '✓ Copied!' : '⧉ Copy JSON'}
        </button>
      </div>
      <pre style={{
        background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 8,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, lineHeight: 1.6,
        overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {json}
      </pre>
    </div>
  );
}


// ── Status badge colours ──
const STATUS_BG = {
  Active: '#d1fae5', Development: '#fef3c7', Inactive: '#fee2e2',
  Approved: '#d1fae5', Draft: '#f3f4f6', Scheduled: '#dbeafe',
  Completed: '#d1fae5', Overdue: '#fee2e2', Maintenance: '#fef3c7',
  Disposed: '#f3f4f6', Blocked: '#fee2e2', Yes: '#d1fae5', No: '#fee2e2',
};
const STATUS_TX = {
  Active: '#065f46', Development: '#92400e', Inactive: '#991b1b',
  Approved: '#065f46', Draft: '#6b7280', Scheduled: '#1e40af',
  Completed: '#065f46', Overdue: '#991b1b', Maintenance: '#92400e',
  Disposed: '#6b7280', Blocked: '#991b1b', Yes: '#065f46', No: '#991b1b',
};
