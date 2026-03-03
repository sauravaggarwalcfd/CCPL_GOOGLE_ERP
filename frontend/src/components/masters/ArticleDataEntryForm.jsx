import { useState, useMemo, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// ArticleDataEntryForm — Rich data entry UI for ARTICLE_MASTER
// Collapsible sections · Progress rings · Live preview panel
// ═══════════════════════════════════════════════════════════════

const CC_RED = '#CC0000';
const PURPLE = '#7C3AED';

// ─── SECTIONS — field labels = exact `header` from SCHEMA_ARTICLE_MASTER (Rule 2.1) ───
const SECTIONS = [
  {
    id: 'identity', icon: '📋', label: 'Article Identity', acc: '#1d6fa4',
    fields: [
      { key: 'code',       header: '🔑 Article Code',       type: 'code',     req: true,  mono: true, hint: '4–5 digits + 2 CAPS · e.g. 5249HP' },
      { key: 'desc',       header: 'Article Description',   type: 'auto',     req: true,  auto: true, hint: 'Auto from L1 › L2 › L3' },
      { key: 'shortName',  header: 'Short Name',            type: 'text',     hint: 'Max 25 chars — barcode & hang tag' },
      { key: 'imageLink',  header: 'IMAGE LINK',            type: 'text',     hint: 'Google Drive public share URL' },
      { key: 'sketchLink', header: '⟷ SKETCH DRIVE LINKS',  type: 'text',     hint: 'Drive folder URL' },
      { key: 'buyerStyle', header: 'Buyer Style No',        type: 'text' },
    ],
  },
  {
    id: 'details', icon: '👕', label: 'Item Details', acc: '#059669',
    fields: [
      { key: 'l1Division',  header: 'L1 Division',           type: 'select', req: true },
      { key: 'l2Category',  header: 'L2 Product Category',   type: 'select', req: true, hint: 'Drives L3, HSN & GST auto-fill' },
      { key: 'l3Style',     header: 'L3 Style',              type: 'select', hint: 'Cascades from L2' },
      { key: 'season',      header: 'Season',                type: 'select' },
      { key: 'gender',      header: 'Gender',                type: 'select', req: true },
      { key: 'fitType',     header: 'Fit Type',              type: 'select' },
      { key: 'neckline',    header: 'Neckline',              type: 'select' },
      { key: 'sleeveType',  header: 'Sleeve Type',           type: 'select' },
    ],
  },
  {
    id: 'fabric', icon: '🧵', label: 'Fabric & Colors', acc: PURPLE,
    fields: [
      { key: 'mainFabric',  header: '→ MAIN FABRIC USED',    type: 'select', fk: true, hint: 'FK → RM_MASTER_FABRIC' },
      { key: 'fabricName',  header: '← Fabric Name (Auto)',  type: 'auto',   auto: true, hint: 'Auto from Fabric FK' },
      { key: 'colorCodes',  header: 'Colour Name(s)',        type: 'select', hint: 'FK → COLOR_MASTER' },
      { key: 'sizeRange',   header: 'Size Range',            type: 'select' },
    ],
  },
  {
    id: 'pricing', icon: '₹', label: 'Pricing & Tax', acc: null, // uses A.a at runtime
    fields: [
      { key: 'wsp',         header: 'W.S.P (Rs)',            type: 'number', mono: true, hint: 'Wholesale price per piece' },
      { key: 'mrp',         header: 'MRP (Rs)',              type: 'number', mono: true, hint: 'Maximum retail price' },
      { key: 'markupPct',   header: '∑ FINAL MARKUP %',      type: 'auto',   auto: true, mono: true, hint: '(MRP − WSP) ÷ WSP × 100' },
      { key: 'markdownPct', header: '∑ FINAL MARKDOWN %',    type: 'auto',   auto: true, mono: true, hint: '(MRP − WSP) ÷ MRP × 100' },
      { key: 'hsnCode',     header: '→ HSN Code',            type: 'select', fk: true,   hint: 'Auto-suggested from L2 · FK → HSN_MASTER' },
      { key: 'gstPct',      header: '← GST % (Auto)',        type: 'auto',   auto: true, mono: true, hint: 'Auto from HSN Master' },
    ],
  },
  {
    id: 'status', icon: '🏷️', label: 'Status & Tags', acc: '#64748b',
    fields: [
      { key: 'status',   header: 'Status',   type: 'select',   hint: 'Active = live · Development = not released' },
      { key: 'remarks',  header: 'Remarks',  type: 'textarea' },
      { key: 'tags',     header: '⟷ Tags',   type: 'text',     hint: '→ TAG_MASTER · comma-separated' },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap(s => s.fields);
const MANUAL_FIELDS = ALL_FIELDS.filter(f => !f.auto);
const REQUIRED_FIELDS = ALL_FIELDS.filter(f => f.req && !f.auto);

const STATUS_COLORS = {
  Active:       { dot: '#22c55e' },
  Inactive:     { dot: '#94a3b8' },
  Development:  { dot: '#f59e0b' },
  Discontinued: { dot: '#ef4444' },
};

/* ─── Progress Ring ─── */
function Ring({ pct, color, size = 26, track = '#e9ecef' }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .4s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

/* ─── Field Input ─── */
function Inp({ f, val, onChange, onFocus, onBlur, focused, acc, M, uff, editItem, opts, disabled }) {
  const base = {
    width: '100%', fontSize: 12, outline: 'none', boxSizing: 'border-box',
    fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff,
    transition: 'all .15s',
    background: focused ? M.hi : val ? M.hi : M.inBg,
    color: f.auto ? PURPLE : M.tA,
    fontWeight: f.auto ? 700 : 500,
    border: `1.5px solid ${focused ? acc : val ? `${M.div}cc` : M.div}`,
    boxShadow: focused ? `0 0 0 3px ${acc}18` : 'none',
    borderRadius: 6, padding: '6px 9px', display: 'block',
  };

  // Auto field — purple readonly
  if (f.auto) return (
    <div style={{ ...base, cursor: 'not-allowed', minHeight: 32, display: 'flex', alignItems: 'center',
      background: `${PURPLE}08`, border: `1.5px solid ${PURPLE}22`, boxShadow: 'none', color: PURPLE }}>
      {val || <span style={{ color: `${PURPLE}66`, fontSize: 10, fontStyle: 'italic' }}>GAS auto-fills</span>}
    </div>
  );

  // Code field — readonly in edit mode
  if (f.type === 'code' && editItem) return (
    <div style={{ ...base, cursor: 'default', background: M.lo, fontWeight: 700, minHeight: 32,
      display: 'flex', alignItems: 'center', fontFamily: "'IBM Plex Mono',monospace" }}>
      {val}
    </div>
  );

  // Select field
  if (f.type === 'select') return (
    <div style={{ position: 'relative' }}>
      <select value={val || ''} onChange={e => onChange(e.target.value)}
        onFocus={onFocus} onBlur={onBlur} disabled={disabled}
        style={{ ...base, appearance: 'none', paddingRight: 26,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
        <option value="">—</option>
        {(opts || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        color: M.tC, fontSize: 10, pointerEvents: 'none' }}>▾</span>
    </div>
  );

  // Textarea
  if (f.type === 'textarea') return (
    <textarea value={val || ''} onChange={e => onChange(e.target.value)}
      onFocus={onFocus} onBlur={onBlur} rows={2}
      style={{ ...base, resize: 'vertical', minHeight: 48 }} />
  );

  // Text / number / code
  return (
    <input type={f.type === 'number' ? 'number' : 'text'}
      value={val || ''}
      onChange={e => onChange(f.type === 'code' ? e.target.value.toUpperCase() : e.target.value)}
      onFocus={onFocus} onBlur={onBlur}
      placeholder={f.type === 'code' ? 'e.g. 5249HP' : ''}
      maxLength={f.type === 'code' ? 7 : undefined}
      style={base} />
  );
}

/* ─── Preview Panel (always dark) ─── */
function Preview({ form, A, uff }) {
  const filled = MANUAL_FIELDS.filter(f => form[f.key]).length;
  const pct = Math.round(filled / MANUAL_FIELDS.length * 100);
  const markup = form.wsp && form.mrp ? Math.round((+form.mrp - +form.wsp) / +form.wsp * 100) : null;
  const st = form.status ? STATUS_COLORS[form.status] : null;

  return (
    <div style={{
      width: 220, flexShrink: 0, background: '#1e293b',
      borderLeft: '1px solid #2d3f50',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* header */}
      <div style={{ padding: '10px 13px 8px', borderBottom: '1px solid #2d3f50',
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 8.5, fontWeight: 900, color: '#64748b', letterSpacing: 1,
          textTransform: 'uppercase', flex: 1, fontFamily: uff }}>Live Preview</span>
        <Ring pct={pct} color={A.a} size={24} track="#2d3f50" />
        <span style={{ fontSize: 9, fontWeight: 900, color: A.a }}>{pct}%</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex',
        flexDirection: 'column', gap: 8 }}>

        {/* Image card */}
        <div style={{ height: 120, borderRadius: 9, background: 'linear-gradient(135deg,#253347,#1a2839)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '1px dashed #3d5166', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>👕</div>
          <div style={{ fontSize: 8, color: '#4d6070' }}>No image linked</div>
          {st && (
            <div style={{ position: 'absolute', top: 7, right: 7, display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 10, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot }} />
              <span style={{ fontSize: 8, fontWeight: 900, color: '#fff' }}>{form.status}</span>
            </div>
          )}
          {form.code && (
            <div style={{ position: 'absolute', bottom: 7, left: 8,
              padding: '2px 7px', borderRadius: 4, background: 'rgba(0,0,0,.6)',
              fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, fontWeight: 900, color: A.a }}>
              {form.code}
            </div>
          )}
        </div>

        {/* Name block */}
        {(form.desc || form.shortName || form.buyerStyle) ? (
          <div>
            {form.desc && <div style={{ fontSize: 12, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 2 }}>{form.desc}</div>}
            {form.shortName && <div style={{ fontSize: 9, color: '#64748b' }}>"{form.shortName}"</div>}
            {form.buyerStyle && <div style={{ fontSize: 8, color: '#4d6070', marginTop: 1 }}>Buyer: {form.buyerStyle}</div>}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#3d5166', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>No description yet</div>
        )}

        {/* Attribute chips */}
        {(form.gender || form.l2Category || form.l3Style || form.fitType || form.season) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[
              form.gender     && [form.gender,     '#1e3a5f', '#7dd3fc'],
              form.l2Category && [form.l2Category,  '#14291a', '#86efac'],
              form.l3Style    && [form.l3Style,     '#251c35', '#c4b5fd'],
              form.fitType    && [form.fitType,     '#2a1e0a', '#fcd34d'],
              form.season     && [form.season,      '#1a2a3a', '#93c5fd'],
              form.neckline   && [form.neckline,    '#1e1e2e', '#a5b4fc'],
              form.sleeveType && [form.sleeveType,  '#1a1a1a', '#d4d4d8'],
            ].filter(Boolean).map(([lbl, bg, tx], i) => (
              <span key={i} style={{ fontSize: 7.5, fontWeight: 700, padding: '2px 6px',
                borderRadius: 8, background: bg, color: tx }}>{lbl}</span>
            ))}
          </div>
        )}

        {/* Fabric card */}
        {(form.mainFabric || form.colorCodes || form.sizeRange) && (
          <div style={{ background: '#253347', borderRadius: 6, padding: '7px 9px', border: '1px solid #2d3f50' }}>
            <div style={{ fontSize: 7.5, fontWeight: 900, color: '#4d6070', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4 }}>Fabric</div>
            {form.mainFabric && <div style={{ fontSize: 9, color: '#c4b5fd', marginBottom: 1 }}>🧵 {form.mainFabric.split('—')[1]?.trim() || form.mainFabric}</div>}
            {form.colorCodes && <div style={{ fontSize: 9, color: '#a5b4fc', marginBottom: 1 }}>🎨 {form.colorCodes}</div>}
            {form.sizeRange && <div style={{ fontSize: 9, color: '#94a3b8' }}>📏 {form.sizeRange}</div>}
          </div>
        )}

        {/* Pricing card */}
        {(form.wsp || form.mrp) && (
          <div style={{ background: '#1a2030', borderRadius: 6, padding: '8px 9px', border: '1px solid #2a3545' }}>
            <div style={{ fontSize: 7.5, fontWeight: 900, color: '#4d6070', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 5 }}>Pricing</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: (form.hsnCode || form.gstPct) ? 6 : 0 }}>
              {form.wsp && <div style={{ flex: 1 }}>
                <div style={{ fontSize: 7.5, color: '#4d6070' }}>WSP</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#e2e8f0', fontFamily: "'IBM Plex Mono',monospace" }}>₹{form.wsp}</div>
              </div>}
              {form.mrp && <div style={{ flex: 1 }}>
                <div style={{ fontSize: 7.5, color: '#4d6070' }}>MRP</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#e2e8f0', fontFamily: "'IBM Plex Mono',monospace" }}>₹{form.mrp}</div>
              </div>}
              {markup !== null && <div style={{ flex: 1 }}>
                <div style={{ fontSize: 7.5, color: '#4d6070' }}>Markup</div>
                <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "'IBM Plex Mono',monospace",
                  color: markup >= 80 ? '#4ade80' : markup >= 40 ? '#fcd34d' : '#f87171' }}>{markup}%</div>
              </div>}
            </div>
            {(form.hsnCode || form.gstPct) && (
              <div style={{ display: 'flex', gap: 5, paddingTop: 5, borderTop: '1px solid #2a3545' }}>
                {form.hsnCode && <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3,
                  background: '#1e3a5f', color: '#7dd3fc', fontFamily: 'monospace' }}>HSN {form.hsnCode}</span>}
                {form.gstPct && <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3,
                  background: '#14291a', color: '#86efac' }}>GST {form.gstPct}%</span>}
              </div>
            )}
          </div>
        )}

        {/* Barcode */}
        {form.code && (
          <div style={{ background: '#fff', borderRadius: 6, padding: '7px 9px', textAlign: 'center',
            border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              gap: 1.5, height: 28, marginBottom: 3 }}>
              {Array.from({ length: 26 }).map((_, i) => {
                const ch = form.code[i % form.code.length];
                const w = ch?.match(/[0-9]/) ? ((parseInt(ch) % 3) + 1) * 1.5 : 2.2;
                return <div key={i} style={{ width: w, height: i % 4 === 0 ? 28 : i % 3 === 0 ? 22 : 25,
                  background: '#1e293b', borderRadius: .5 }} />;
              })}
            </div>
            <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace",
              fontWeight: 900, color: '#1e293b', letterSpacing: 2 }}>{form.code}</div>
            {form.shortName && <div style={{ fontSize: 7.5, color: '#9aa5b4', marginTop: 1 }}>{form.shortName}</div>}
          </div>
        )}

        {/* Empty state */}
        {!form.code && !form.desc && !form.wsp && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 5 }}>✦</div>
            <div style={{ fontSize: 9.5, color: '#3d5166', lineHeight: 1.6 }}>
              Start filling fields<br />to see a live preview
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ArticleDataEntryForm({
  M, A, uff, dff,
  form, setForm,
  editItem,
  formErrors, setFormErrors,
  handleSave, handleClear,
  divisions, l2ByDiv, l3ByL2, l2Hsn,
  genderOpts, fitOpts, neckOpts, sleeveOpts, statusOpts, seasonOpts,
  sizeRangeOpts, colourOpts,
  setL1Division, setL2Category, setL3Style,
  HSN_GST_MAP, data,
}) {
  const [open, setOpen] = useState({ identity: true, details: true, fabric: false, pricing: false, status: false });
  const [focus, setFocus] = useState(null);
  const [shake, setShake] = useState(false);

  // Inject CSS animations
  useEffect(() => {
    const id = 'cc-data-entry-anim';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        @keyframes ccShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
        @keyframes ccFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
      `;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  const toggle = useCallback(id => setOpen(p => ({ ...p, [id]: !p[id] })), []);

  // Resolve accent color per section (pricing uses A.a)
  const getAcc = useCallback(sec => sec.acc || A.a, [A.a]);

  // Computed auto values
  const markupVal = useMemo(() => {
    const w = parseFloat(form.wsp), m = parseFloat(form.mrp);
    if (w > 0 && m > 0) return ((m - w) / w * 100).toFixed(1);
    return '';
  }, [form.wsp, form.mrp]);

  const markdownVal = useMemo(() => {
    const w = parseFloat(form.wsp), m = parseFloat(form.mrp);
    if (w > 0 && m > 0) return ((m - w) / m * 100).toFixed(1);
    return '';
  }, [form.wsp, form.mrp]);

  // Get display value for a field
  const getVal = useCallback((key) => {
    if (key === 'markupPct') return markupVal;
    if (key === 'markdownPct') return markdownVal;
    return form[key];
  }, [form, markupVal, markdownVal]);

  // Resolve dropdown options for a field
  const resolveOpts = useCallback((key) => {
    switch (key) {
      case 'l1Division':  return divisions;
      case 'l2Category':  return l2ByDiv[form.l1Division] || [];
      case 'l3Style':     return l3ByL2[form.l2Category] || [];
      case 'gender':      return genderOpts;
      case 'fitType':     return fitOpts;
      case 'neckline':    return neckOpts;
      case 'sleeveType':  return sleeveOpts;
      case 'season':      return seasonOpts;
      case 'colorCodes':  return colourOpts;
      case 'sizeRange':   return sizeRangeOpts;
      case 'status':      return statusOpts;
      case 'hsnCode':     return Object.keys(HSN_GST_MAP);
      case 'mainFabric':  return [];
      default:            return null;
    }
  }, [divisions, l2ByDiv, l3ByL2, form.l1Division, form.l2Category,
      genderOpts, fitOpts, neckOpts, sleeveOpts, statusOpts, seasonOpts,
      sizeRangeOpts, colourOpts, HSN_GST_MAP]);

  // onChange routing — L1/L2/L3 use cascade handlers
  const handleChange = useCallback((key, value) => {
    setFormErrors({});
    if (key === 'l1Division') return setL1Division(value);
    if (key === 'l2Category') return setL2Category(value);
    if (key === 'l3Style') return setL3Style(value);
    if (key === 'code') return setForm(f => ({ ...f, code: value.toUpperCase() }));
    setForm(f => ({ ...f, [key]: value }));
  }, [setL1Division, setL2Category, setL3Style, setForm, setFormErrors]);

  // Disabled logic for cascade selects
  const isDisabled = useCallback((key) => {
    if (key === 'l2Category') return !form.l1Division;
    if (key === 'l3Style') return !form.l2Category;
    return false;
  }, [form.l1Division, form.l2Category]);

  // Progress stats
  const filled = MANUAL_FIELDS.filter(f => form[f.key]).length;
  const reqLeft = REQUIRED_FIELDS.filter(f => !form[f.key]);

  // Save wrapper — adds shake animation on validation failure
  const onSave = useCallback(() => {
    if (reqLeft.length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    handleSave();
  }, [reqLeft.length, handleSave]);

  // ─── RENDER ───
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', fontFamily: uff }}>

      {/* ── SECTION TAB STRIP ── */}
      <div style={{ background: M.hi, borderBottom: `2px solid ${M.div}`, flexShrink: 0,
        padding: '0 12px', display: 'flex', alignItems: 'center', gap: 0 }}>
        {SECTIONS.map(sec => {
          const acc = getAcc(sec);
          const mf = sec.fields.filter(f => !f.auto);
          const done = mf.filter(f => form[f.key]).length;
          const miss = sec.fields.filter(f => f.req && !f.auto && !form[f.key]).length;
          const isOn = open[sec.id];
          const all = miss === 0 && done > 0 && done === mf.length;
          return (
            <button key={sec.id} onClick={() => toggle(sec.id)} style={{
              padding: '9px 11px 8px', border: 'none', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              borderBottom: `3px solid ${isOn ? acc : 'transparent'}`,
              transition: 'all .15s', fontFamily: uff,
            }}>
              <span style={{ fontSize: 12 }}>{sec.icon}</span>
              <span style={{ fontSize: 9.5, fontWeight: isOn ? 900 : 700,
                color: isOn ? acc : M.tB, whiteSpace: 'nowrap' }}>{sec.label}</span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                background: miss > 0 ? '#f59e0b' : all ? '#22c55e' : done > 0 ? acc : M.div,
                transition: 'background .2s' }} />
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {reqLeft.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            background: '#fffbeb', border: '1px solid #fde68a',
            animation: shake ? 'ccShake .5s ease' : 'none' }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: '#b45309' }}>⚠ {reqLeft.length}:</span>
            {reqLeft.slice(0, 3).map(f => (
              <button key={f.key} onClick={() => {
                const sec = SECTIONS.find(s => s.fields.find(x => x.key === f.key));
                if (sec) setOpen(p => ({ ...p, [sec.id]: true }));
                setTimeout(() => setFocus(f.key), 60);
              }} style={{ fontSize: 7.5, padding: '1px 6px', borderRadius: 8,
                border: 'none', background: '#fde68a', color: '#b45309', fontWeight: 800,
                cursor: 'pointer', fontFamily: uff }}>
                {f.header.replace(/^[🔑←→⟷∑#⚠\s]+/, '')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── FORM AREA ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 7, background: M.bg }}>

          {/* Title */}
          <div style={{ padding: '4px 4px 0', fontSize: 13, fontWeight: 900, color: M.tA, fontFamily: uff }}>
            {editItem ? `✏️ Editing ${editItem.code}` : '➕ New Article'}
          </div>

          {SECTIONS.map(sec => {
            const acc = getAcc(sec);
            const isOn = open[sec.id];
            const mf = sec.fields.filter(f => !f.auto);
            const done = mf.filter(f => form[f.key]).length;
            const miss = sec.fields.filter(f => f.req && !f.auto && !form[f.key]).length;
            const pct = mf.length > 0 ? Math.round(done / mf.length * 100) : 100;

            return (
              <div key={sec.id} style={{
                background: M.hi,
                border: `1.5px solid ${isOn ? acc + '35' : M.div}`,
                borderRadius: 9, overflow: 'hidden',
                boxShadow: isOn ? `0 1px 8px ${acc}10` : 'none',
                transition: 'all .2s',
              }}>
                {/* Section header */}
                <button onClick={() => toggle(sec.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 13px', width: '100%', border: 'none', cursor: 'pointer',
                  background: isOn ? acc + '09' : M.hi,
                  borderBottom: isOn ? `1px solid ${acc}18` : 'none',
                  transition: 'background .15s', fontFamily: uff, textAlign: 'left',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: acc + '16', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14 }}>{sec.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 900,
                      color: isOn ? acc : M.tA, lineHeight: 1 }}>{sec.label}</div>
                    <div style={{ fontSize: 8.5, color: M.tC, marginTop: 1 }}>
                      {sec.fields.length} fields
                      {miss > 0 && <span style={{ color: '#d97706', fontWeight: 800 }}> · ⚠ {miss} required</span>}
                      {miss === 0 && done === mf.length && done > 0 && <span style={{ color: '#15803d', fontWeight: 800 }}> · ✓ Complete</span>}
                    </div>
                  </div>
                  <Ring pct={pct} color={miss > 0 ? '#f59e0b' : pct === 100 && done > 0 ? '#22c55e' : acc} track={M.div} />
                  <span style={{ fontSize: 9, color: M.tC, marginLeft: 2,
                    transform: isOn ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform .2s', display: 'inline-block' }}>▼</span>
                </button>

                {/* Fields */}
                {isOn && (
                  <div>
                    {sec.fields.map((f, fi) => {
                      const isFoc = focus === f.key;
                      const val = getVal(f.key);
                      const hasErr = formErrors[f.key];
                      const isLast = fi === sec.fields.length - 1;

                      return (
                        <div key={f.key} style={{
                          display: 'grid', gridTemplateColumns: '200px 1fr',
                          alignItems: f.type === 'textarea' ? 'flex-start' : 'center',
                          borderBottom: isLast ? 'none' : `1px solid ${M.lo}`,
                          background: isFoc ? acc + '05' : 'transparent',
                          transition: 'background .12s',
                        }}>
                          {/* Label cell */}
                          <div style={{ padding: f.type === 'textarea' ? '9px 12px 9px 14px' : '7px 12px 7px 14px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: 11, fontWeight: 800, lineHeight: 1.2,
                                color: f.req && !f.auto ? CC_RED : f.auto ? PURPLE : M.tA,
                              }}>
                                {f.req && !f.auto && <span style={{ color: CC_RED, marginRight: 1 }}>✱</span>}
                                {f.header}
                              </span>
                              {f.auto && (
                                <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 3,
                                  background: '#ede9fe', color: PURPLE, fontWeight: 900,
                                  fontFamily: "'IBM Plex Mono',monospace" }}>← AUTO</span>
                              )}
                              {!f.auto && f.fk && (
                                <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 3,
                                  background: '#e0f0fb', color: '#1d6fa4', fontWeight: 900,
                                  fontFamily: "'IBM Plex Mono',monospace" }}>→ FK</span>
                              )}
                              {!f.auto && !f.fk && f.req && (
                                <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 3,
                                  background: '#fff0f0', color: CC_RED, fontWeight: 900,
                                  fontFamily: "'IBM Plex Mono',monospace" }}>REQ</span>
                              )}
                            </div>
                            <div style={{
                              fontSize: 8, fontFamily: "'IBM Plex Mono',monospace",
                              color: isFoc ? acc + '99' : M.div, marginTop: 1,
                              transition: 'color .15s',
                            }}>{f.key}</div>
                          </div>

                          {/* Input cell */}
                          <div style={{ padding: f.type === 'textarea' ? '7px 14px 7px 0' : '5px 14px 5px 0' }}>
                            {f.hint && (
                              <div style={{ fontSize: 8.5, color: isFoc ? M.tB : M.tC,
                                marginBottom: 3, lineHeight: 1.3, transition: 'color .15s' }}>{f.hint}</div>
                            )}
                            <Inp f={f} val={val} onChange={v => handleChange(f.key, v)}
                              focused={isFoc} acc={acc} M={M} uff={uff} editItem={editItem}
                              opts={resolveOpts(f.key)} disabled={isDisabled(f.key)}
                              onFocus={() => setFocus(f.key)} onBlur={() => setFocus(null)} />
                            {hasErr && (
                              <div style={{ fontSize: 9, color: '#ef4444', marginTop: 3, fontWeight: 600 }}>{hasErr}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ height: 12 }} />
        </div>

        {/* ── PREVIEW ── */}
        <Preview form={form} A={A} uff={uff} />
      </div>

      {/* ── FOOTER ── */}
      <div style={{ flexShrink: 0, background: M.hi, borderTop: `1.5px solid ${M.div}`,
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Section dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {SECTIONS.map(sec => {
            const acc = getAcc(sec);
            const mf = sec.fields.filter(f => !f.auto);
            const done = mf.filter(f => form[f.key]).length;
            const miss = sec.fields.filter(f => f.req && !f.auto && !form[f.key]).length;
            return (
              <div key={sec.id} title={sec.label} style={{
                height: 4, width: open[sec.id] ? 20 : 12, borderRadius: 2,
                background: miss > 0 ? '#fde68a' : done > 0 ? acc : M.div,
                transition: 'all .3s',
              }} />
            );
          })}
        </div>
        <span style={{ fontSize: 9, color: M.tC, fontWeight: 700 }}>
          {filled}/{MANUAL_FIELDS.length} · {REQUIRED_FIELDS.length - reqLeft.length}/{REQUIRED_FIELDS.length} req
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={handleClear} style={{
          padding: '6px 13px', border: `1.5px solid ${M.div}`, borderRadius: 6,
          background: M.lo, color: M.tB, fontSize: 10, fontWeight: 800,
          cursor: 'pointer', fontFamily: uff }}>↺ Clear</button>
        <button onClick={onSave} style={{
          padding: '6px 20px', border: 'none', borderRadius: 6,
          background: reqLeft.length > 0 ? '#94a3b8' : CC_RED,
          color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer',
          animation: shake ? 'ccShake .5s ease' : 'none',
          transition: 'background .2s', fontFamily: uff }}>
          {editItem ? '💾 Update Article' : reqLeft.length > 0 ? `⚠ ${reqLeft.length} required` : '✓ Save to Sheet'}
        </button>
      </div>
    </div>
  );
}
