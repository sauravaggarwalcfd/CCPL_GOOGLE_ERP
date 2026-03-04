import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SCHEMA_MAP } from '../../constants/masterSchemas';
import api from '../../services/api';
import SortPanel from './SortPanel';
import ColumnPanel from './ColumnPanel';
import RecordDetailModal from './RecordDetailModal';
import ViewEditModal from './ViewEditModal';

// ── Drive thumbnail URL helper ──
function driveThumbUrl(link) {
  if (!link) return null;
  const url = link.split('|')[0].trim();
  if (!url) return null;
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return `https://drive.google.com/thumbnail?id=${m1[1]}&sz=w120`;
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return `https://drive.google.com/thumbnail?id=${m2[1]}&sz=w120`;
  if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(url)) return url;
  return url;
}

// ── Mapping: raw sheet headers ↔ schema keys ──
function mapRawToSchema(rawRow, schema) {
  const mapped = {};
  for (const field of schema) {
    if (field.header && rawRow[field.header] !== undefined) {
      mapped[field.key] = rawRow[field.header];
    }
  }
  return mapped;
}

function mapSchemaToRaw(formData, schema) {
  const raw = {};
  for (const field of schema) {
    if (field.header && formData[field.key] !== undefined && formData[field.key] !== '') {
      raw[field.header] = formData[field.key];
    }
  }
  return raw;
}

// ── Status badge colours (Sheet view) ──
const STATUS_COLORS = {
  Active:      { bg: '#d1fae5', color: '#065f46' },
  Development: { bg: '#fef3c7', color: '#92400e' },
  Inactive:    { bg: '#fee2e2', color: '#991b1b' },
  Approved:    { bg: '#d1fae5', color: '#065f46' },
  Draft:       { bg: '#f3f4f6', color: '#6b7280' },
  Scheduled:   { bg: '#dbeafe', color: '#1e40af' },
  Completed:   { bg: '#d1fae5', color: '#065f46' },
  Overdue:     { bg: '#fee2e2', color: '#991b1b' },
  Maintenance: { bg: '#fef3c7', color: '#92400e' },
  Disposed:    { bg: '#f3f4f6', color: '#6b7280' },
  Blocked:     { bg: '#fee2e2', color: '#991b1b' },
  Yes:         { bg: '#d1fae5', color: '#065f46' },
  No:          { bg: '#fee2e2', color: '#991b1b' },
};
const fallbackStatus = { bg: '#f3f4f6', color: '#9ca3af' };

// ── Fallback schema ──
const FALLBACK_SCHEMA = [
  { key: 'code',     label: 'Code',     w: '140px', mono: true, auto: true },
  { key: 'name',     label: 'Name',     w: '1fr',   required: true },
  { key: 'category', label: 'Category', w: '120px' },
  { key: 'status',   label: 'Status',   w: '90px',  badge: true, type: 'select', options: ['Active', 'Inactive'] },
  { key: 'remarks',  label: 'Remarks',  w: '0',     hidden: true, type: 'textarea' },
];

// ── 12 aggregation functions ──
const AGG_FNS = [
  { id: 'none',           label: 'None' },
  { id: 'count',          label: 'Count' },
  { id: 'count_values',   label: 'Count Values' },
  { id: 'count_empty',    label: 'Count Empty' },
  { id: 'unique',         label: 'Unique' },
  { id: 'sum',            label: 'Sum' },
  { id: 'avg',            label: 'Avg' },
  { id: 'min',            label: 'Min' },
  { id: 'max',            label: 'Max' },
  { id: 'range',          label: 'Range' },
  { id: 'median',         label: 'Median' },
  { id: 'percent_filled', label: '% Filled' },
  { id: 'percent_empty',  label: '% Empty' },
];

// ── Toast accent colours ──
const TOAST_COLORS = {
  success: '#15803d',
  delete:  '#dc2626',
  view:    '#7C3AED',
  info:    '#0078D4',
};

// ── CC_RED — mandatory accent for Default pill / Add New button ──
const CC_RED = '#CC0000';

// ── System views (V2) — article-specific views + generic fallback ──
const ARTICLE_SYSTEM_VIEWS = [
  { id: 'all', name: 'All Columns', icon: '\u229E', color: '#64748b', isSystem: true,
    desc: 'Every column across all fields', cols: null },
  { id: 'overview', name: 'Article Overview', icon: '\uD83D\uDC41', color: '#E8690A', isSystem: true,
    desc: 'Key identity + status at a glance',
    cols: ['imageLink','code','desc','shortName','sketchLink','l2Category','gender','season','status','tags'] },
  { id: 'pricing', name: 'Pricing & Tax', icon: '\u20B9', color: '#15803d', isSystem: true,
    desc: 'Article code + all pricing columns',
    cols: ['code','desc','wsp','mrp','markupPct','markdownPct','hsnCode','gstPct','status'] },
  { id: 'fabric', name: 'Fabric Focus', icon: '\uD83E\uDDF5', color: '#6c3fc5', isSystem: true,
    desc: 'Fabric, colour and size columns',
    cols: ['code','desc','mainFabric','fabricName','colorCodes','sizeRange','status'] },
];
const DEFAULT_SYSTEM_VIEWS = [
  { id: 'all', name: 'All Columns', icon: '\u229E', color: '#64748b', isSystem: true,
    desc: 'Every column across all fields', cols: null },
];
function getSystemViews(sheetKey) {
  if (sheetKey === 'ARTICLE_MASTER') return ARTICLE_SYSTEM_VIEWS;
  return DEFAULT_SYSTEM_VIEWS;
}

// ── AGG accent colours (§F) ──
const AGG_COLORS = {
  count:         '#0078D4',
  count_values:  '#0078D4',
  count_empty:   '#6b7280',
  unique:        '#7C3AED',
  sum:           '#15803d',
  avg:           '#E8690A',
  min:           '#0e7490',
  max:           '#7c2d12',
  range:         '#4338ca',
  median:        '#0891b2',
  percent_filled:'#15803d',
  percent_empty: '#6b7280',
};

// ── AGG grouped list for dropdown ──
const AGG_GROUPS = [
  { label: 'Count',     color: '#0078D4', items: ['count', 'count_values', 'count_empty', 'unique'] },
  { label: 'Calculate', color: '#15803d', items: ['sum', 'avg', 'min', 'max', 'range', 'median'] },
  { label: 'Percent',   color: '#0891b2', items: ['percent_filled', 'percent_empty'] },
];

function calcAgg(fn, col, rows) {
  const vals = rows.map(r => r[col]).filter(v => v !== undefined && v !== null && v !== '');
  const nums = vals.map(v => parseFloat(v)).filter(n => !isNaN(n));
  const total = rows.length;
  const fmt = n => (Number.isInteger(n) ? n.toString() : n.toFixed(2));

  switch (fn) {
    case 'count':          return total.toString();
    case 'count_values':   return vals.length.toString();
    case 'count_empty':    return (total - vals.length).toString();
    case 'unique':         return new Set(vals).size.toString();
    case 'sum':            return nums.length ? fmt(nums.reduce((a, b) => a + b, 0)) : '\u2014';
    case 'avg':            return nums.length ? fmt(nums.reduce((a, b) => a + b, 0) / nums.length) : '\u2014';
    case 'min':            return nums.length ? fmt(Math.min(...nums)) : '\u2014';
    case 'max':            return nums.length ? fmt(Math.max(...nums)) : '\u2014';
    case 'range':          return nums.length ? fmt(Math.max(...nums) - Math.min(...nums)) : '\u2014';
    case 'median': {
      if (!nums.length) return '\u2014';
      const s = [...nums].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return fmt(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
    }
    case 'percent_filled': return total ? `${((vals.length / total) * 100).toFixed(1)}%` : '\u2014';
    case 'percent_empty':  return total ? `${(((total - vals.length) / total) * 100).toFixed(1)}%` : '\u2014';
    default: return '';
  }
}

// ── Currency-aware agg formatter ──
function fmtAgg(rawVal, field, fn) {
  if (!rawVal || rawVal === '\u2014') return rawVal;
  if (field?.type === 'currency' && ['sum', 'avg', 'min', 'max', 'range', 'median'].includes(fn)) {
    const n = parseFloat(rawVal);
    if (!isNaN(n)) return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return rawVal;
}

// ═══════════════════════════════════════════════════════════
// ADVANCED FILTER / SORT — operator-based multi-condition panel
// ═══════════════════════════════════════════════════════════
const REC_FILTER_OPS = {
  cat: ['is', 'is not'],
  txt: ['contains', 'not contains', 'starts with'],
  num: ['=', '\u2260', '>', '<', '\u2265', '\u2264'],
};
const REC_SORT_MODES = [
  { value: 'a_z',       label: 'A \u2192 Z'               },
  { value: 'z_a',       label: 'Z \u2192 A'               },
  { value: 'nil_first', label: 'Nil / Empty First'    },
  { value: 'nil_last',  label: 'Nil / Empty Last'     },
  { value: 'freq_hi',   label: 'Most Frequent First'  },
  { value: 'freq_lo',   label: 'Least Frequent First' },
  { value: 'num_lo',    label: 'Lowest \u2192 Highest'     },
  { value: 'num_hi',    label: 'Highest \u2192 Lowest'     },
  { value: 'val_first', label: 'Value is\u2026 First'      },
  { value: 'val_last',  label: 'Value is\u2026 Last'       },
];
function recAdvFieldType(f) {
  if (!f) return 'txt';
  if (f.type === 'number' || f.type === 'currency') return 'num';
  if (f.type === 'select' || f.options?.length) return 'cat';
  return 'txt';
}
function evalRecAdvFilter(row, { field, op, value }, schema) {
  const f = schema?.find(x => x.key === field);
  const fType = recAdvFieldType(f);
  const rv = row[field];
  if (fType === 'num') {
    const n = parseFloat(rv), v = parseFloat(value);
    if (isNaN(n) || isNaN(v)) return true;
    return op==='='?n===v:op==='\u2260'?n!==v:op==='>'?n>v:op==='<'?n<v:op==='\u2265'?n>=v:n<=v;
  }
  if (fType === 'txt') {
    const s = String(rv||'').toLowerCase(), v = String(value||'').toLowerCase();
    return op==='contains'?s.includes(v):op==='not contains'?!s.includes(v):s.startsWith(v);
  }
  return op === 'is' ? rv === value : rv !== value;
}
function applyRecAdvSort(arr, advSorts, freqMaps) {
  if (!advSorts.length) return arr;
  return [...arr].sort((a, b) => {
    for (const s of advSorts) {
      const av = a[s.field]??'', bv = b[s.field]??'';
      const ae = av===''||av==null, be = bv===''||bv==null;
      let cmp = 0;
      if      (s.mode==='nil_first') { if(ae!==be)cmp=ae?-1:1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='nil_last')  { if(ae!==be)cmp=ae?1:-1;  else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='freq_hi')   { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fb-fa; }
      else if (s.mode==='freq_lo')   { const fa=freqMaps[s.field]?.[String(av)]||0,fb=freqMaps[s.field]?.[String(bv)]||0; cmp=fa-fb; }
      else if (s.mode==='num_lo')    cmp=parseFloat(av||0)-parseFloat(bv||0);
      else if (s.mode==='num_hi')    cmp=parseFloat(bv||0)-parseFloat(av||0);
      else if (s.mode==='val_first') { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm)cmp=am?-1:1; else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='val_last')  { const am=String(av)===String(s.value||''),bm=String(bv)===String(s.value||''); if(am!==bm)cmp=am?1:-1;  else cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'}); }
      else if (s.mode==='z_a')       cmp=String(bv).localeCompare(String(av),undefined,{sensitivity:'base'});
      else                           cmp=String(av).localeCompare(String(bv),undefined,{sensitivity:'base'});
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

// ── Type-aware null-safe multi-sort (§E) ──
function applySort(rows, sorts, schema) {
  if (!sorts.length) return rows;
  return [...rows].sort((a, b) => {
    for (const { col, dir, type, nulls } of sorts) {
      const av = a[col];
      const bv = b[col];
      const an = av == null || av === '';
      const bn = bv == null || bv === '';
      if (an && bn) continue;
      if (an) return nulls === 'first' ? -1 : 1;
      if (bn) return nulls === 'first' ? 1 : -1;
      const field = schema?.find(f => f.key === col);
      const autoType = field?.type === 'number' || field?.type === 'currency'
        ? 'numeric'
        : field?.type === 'date' ? 'date' : 'alpha';
      const ft = !type || type === 'auto' ? autoType : type;
      let d = 0;
      if (ft === 'numeric') { d = parseFloat(av) - parseFloat(bv); if (isNaN(d)) d = 0; }
      else if (ft === 'date') { d = new Date(av) - new Date(bv); if (isNaN(d)) d = 0; }
      else if (ft === 'length') { d = String(av).length - String(bv).length; }
      else { d = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }); }
      if (d !== 0) return dir === 'asc' ? d : -d;
    }
    return 0;
  });
}

// ── Build flat render list for grouped / ungrouped view ──
function buildRenderList(sorted, groupBy, subGroupBy) {
  if (!groupBy) return sorted.map((row, i) => ({ type: 'row', row, rowIdx: i }));

  const items = [];
  const groupedData = new Map();

  for (const row of sorted) {
    const gv = row[groupBy] ?? '\u2014';
    if (!groupedData.has(gv)) groupedData.set(gv, new Map());
    if (subGroupBy) {
      const sv = row[subGroupBy] ?? '\u2014';
      if (!groupedData.get(gv).has(sv)) groupedData.get(gv).set(sv, []);
      groupedData.get(gv).get(sv).push(row);
    } else {
      if (!groupedData.get(gv).has('_rows')) groupedData.get(gv).set('_rows', []);
      groupedData.get(gv).get('_rows').push(row);
    }
  }

  let rowIdx = 0;
  for (const [gv, gData] of groupedData) {
    const totalInGroup = subGroupBy
      ? [...gData.values()].flatMap(r => r).length
      : (gData.get('_rows') || []).length;
    items.push({ type: 'group', value: gv, count: totalInGroup, key: `g-${gv}` });
    if (subGroupBy) {
      for (const [sv, sRows] of gData) {
        items.push({ type: 'subgroup', value: sv, count: sRows.length, key: `sg-${gv}-${sv}` });
        for (const row of sRows) items.push({ type: 'row', row, rowIdx: rowIdx++ });
      }
    } else {
      for (const row of (gData.get('_rows') || [])) items.push({ type: 'row', row, rowIdx: rowIdx++ });
    }
  }
  return items;
}

// ── Row height presets (Airtable-style) ──
const RH_PRESETS = {
  short:  { label: 'Short',      rowH: 28,  thumb: 20  },
  medium: { label: 'Medium',     rowH: 52,  thumb: 44  },
  tall:   { label: 'Tall',       rowH: 96,  thumb: 80  },
  xtall:  { label: 'Extra Tall', rowH: 148, thumb: 130 },
};

// ═══════════════════════════════════════════════════════════
// V2 ATOMS — StatusBadge, ImgThumb, SketchThumb, Tags, CellVal
// (accept M, A, uff as props for theme token mapping)
// ═══════════════════════════════════════════════════════════
const V2_STATUS = {
  Active:      { bg: '#dcfce7', tx: '#15803d', dot: '#22c55e' },
  Inactive:    { bg: '#f1f5f9', tx: '#475569', dot: '#94a3b8' },
  Development: { bg: '#fef3c7', tx: '#92400e', dot: '#f59e0b' },
  Discontinued:{ bg: '#fee2e2', tx: '#991b1b', dot: '#ef4444' },
};

function V2StatusBadge({ s }) {
  const st = V2_STATUS[s] || V2_STATUS.Inactive;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:9,
      fontWeight:800, padding:'2px 8px', borderRadius:10,
      background:st.bg, color:st.tx, whiteSpace:'nowrap', flexShrink:0 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:st.dot, flexShrink:0 }}/>
      {s}
    </span>
  );
}

function V2ImgThumb({ src, size=44, radius=6, M }) {
  const [err, setErr] = useState(false);
  const dimColor = M?.textD || '#d1d8e0';
  if (!src || err) return (
    <div style={{ width:size, height:size, borderRadius:radius, flexShrink:0,
      background:'#f1f5f9', border:'1px solid #e4e8ef',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size>40?16:11, color:dimColor }}>{'\uD83D\uDCF7'}</div>
  );
  return <img src={src} onError={()=>setErr(true)} alt="" style={{
    width:size, height:size, borderRadius:radius, objectFit:'cover',
    flexShrink:0, border:'1px solid #e4e8ef', display:'block' }}/>;
}

function V2SketchThumb({ src, size=38, radius=5, M }) {
  const [err, setErr] = useState(false);
  const [hov, setHov] = useState(false);
  const [pos, setPos] = useState({ x:0, y:0 });
  const dimColor = M?.textD || '#d1d8e0';
  const mutedColor = M?.textD || '#9aa5b4';
  if (!src || err) return (
    <div style={{ width:size, height:size, borderRadius:radius, flexShrink:0,
      background:'#fafafa', border:'1px dashed #d1d8e0',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:10, color:dimColor }}>{'\u270F'}</div>
  );
  return (
    <>
      <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        onMouseMove={e=>setPos({x:e.clientX,y:e.clientY})}>
        <img src={src} onError={()=>setErr(true)} alt=""
          style={{ width:size, height:size, borderRadius:radius, objectFit:'cover',
            border:'1px solid #e4e8ef', display:'block',
            filter:hov?'grayscale(0%)':'grayscale(65%)', transition:'filter .18s' }}/>
      </div>
      {hov && (
        <div style={{ position:'fixed', left:pos.x+14,
          top:Math.min(pos.y-80, window.innerHeight-200), zIndex:9999,
          background:'#fff', border:'1px solid #e4e8ef', borderRadius:10,
          padding:6, boxShadow:'0 12px 40px rgba(0,0,0,.18)', pointerEvents:'none' }}>
          <img src={src} alt="" style={{ width:160, height:160, objectFit:'cover', borderRadius:7, display:'block' }}/>
          <div style={{ fontSize:8.5, color:mutedColor, textAlign:'center', padding:'4px 0 2px', fontWeight:700 }}>
            {'\u270F'} Sketch / Tech Pack
          </div>
        </div>
      )}
    </>
  );
}

function V2Tags({ v, M }) {
  const dimColor = M?.textD || '#d1d8e0';
  if (!v) return <span style={{ color:dimColor, fontSize:10 }}>{'\u2014'}</span>;
  const parts = String(v).split(',').map(t=>t.trim()).filter(Boolean);
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
      {parts.slice(0,3).map(t=>(
        <span key={t} style={{ fontSize:7.5, padding:'2px 5px', borderRadius:7,
          background:'#f1f5f9', color:'#64748b', fontWeight:700 }}>{t}</span>
      ))}
      {parts.length>3 && <span style={{ fontSize:7.5, color:dimColor, padding:'2px 3px' }}>+{parts.length-3}</span>}
    </div>
  );
}

function V2CellVal({ col, row, M, A }) {
  const accentColor = A?.a || '#E8690A';
  const textColor = M?.textA || '#1a2332';
  const dimColor = M?.textD || '#d1d8e0';
  if (col.special === 'thumb' || col.thumb)  return <V2ImgThumb src={row.imageLink || row[col.key]} size={42} radius={6} M={M}/>;
  if (col.special === 'sketch') return <V2SketchThumb src={row.sketchLink || row[col.key]} size={36} radius={5} M={M}/>;
  if (col.badge) return <V2StatusBadge s={row[col.key]}/>;
  if (col.key === 'tags') return <V2Tags v={row[col.key]} M={M}/>;
  const raw = row[col.key];
  if (raw===undefined||raw===null||raw==='') return <span style={{ color:dimColor }}>{'\u2014'}</span>;
  const isNum = col.num || col.type === 'number' || col.type === 'currency';
  const disp = isNum
    ? (col.key==='wsp'||col.key==='mrp' ? `\u20B9${raw}` : `${raw}%`)
    : String(raw);
  return (
    <span style={{ fontSize:11,
      fontFamily:col.mono?"'IBM Plex Mono',monospace":'inherit',
      fontWeight:col.bold?800:col.auto?700:400,
      color:col.key==='code'?accentColor:col.auto?'#6c3fc5'
           :(col.key==='markupPct'&&raw>=100)?'#15803d':textColor,
      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'block' }}>
      {disp}
    </span>
  );
}
// ═══════════════════════════════════════════════════════════
// V2 SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

// ── V2 Filter Panel (right drawer) ──
function FilterPanelV2({ data, colFilters, setColFilters, visCols, allFields, onClose, M, A, uff, fz }) {
  const [local, setLocal] = useState({ ...colFilters });
  const filterableCols = visCols.filter(c => !c.thumb && !c.hidden);

  const uniqueVals = col => {
    const vals = [...new Set(data.map(r => r[col.key]).filter(v => v !== undefined && v !== ''))];
    return vals.sort((a, b) => String(a).localeCompare(String(b)));
  };

  const isTextSearch = f => !f.options && !f.badge && f.type !== 'select';
  const apply = () => { setColFilters(local); onClose(); };
  const clear = () => { setColFilters({}); onClose(); };
  const activeCount = Object.values(local).filter(v => v && v !== 'all').length;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(15,23,42,.28)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 320,
        background: M.surfHigh, boxShadow: '-10px 0 40px rgba(0,0,0,.12)',
        display: 'flex', flexDirection: 'column', animation: 'slideFromRight .22s ease' }}>

        <div style={{ padding: '13px 14px 11px', borderBottom: `1px solid ${M.divider}`,
          background: '#1e293b', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#e2e8f0', flex: 1, fontFamily: uff }}>
            {'\u229F'} Column Filters
            {activeCount > 0 && <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 6px',
              borderRadius: 8, background: A.a, color: '#fff', fontWeight: 900 }}>{activeCount} ON</span>}
          </span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 16, color: '#94a3b8', cursor: 'pointer' }}>{'\u00D7'}</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {filterableCols.map(c => {
            const vals = uniqueVals(c);
            const cur = local[c.key] || 'all';
            return (
              <div key={c.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase',
                  letterSpacing: .5, marginBottom: 5, fontFamily: uff,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {c.header}
                  {cur !== 'all' && (
                    <button onClick={() => setLocal(p => ({ ...p, [c.key]: 'all' }))} style={{
                      border: 'none', background: 'none', color: A.a,
                      fontSize: 8.5, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>{'\u00D7'} clear</button>
                  )}
                </div>

                {isTextSearch(c) ? (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 12, color: M.textD, pointerEvents: 'none' }}>{'\u2315'}</span>
                    <input value={cur === 'all' ? '' : cur}
                      onChange={e => setLocal(p => ({ ...p, [c.key]: e.target.value || 'all' }))}
                      placeholder={`Search ${(c.header || c.key).toLowerCase()}\u2026`}
                      style={{ width: '100%', padding: '6px 10px 6px 26px',
                        border: `1.5px solid ${cur !== 'all' ? A.a : M.divider}`,
                        borderRadius: 7, fontSize: 10.5, outline: 'none',
                        background: cur !== 'all' ? A.al : M.inputBg,
                        fontFamily: uff, color: M.textA }} />
                    {cur !== 'all' && (
                      <button onClick={() => setLocal(p => ({ ...p, [c.key]: 'all' }))} style={{
                        position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                        border: 'none', background: 'none', color: M.textD, cursor: 'pointer', fontSize: 13 }}>{'\u00D7'}</button>
                    )}
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <select value={cur}
                      onChange={e => setLocal(p => ({ ...p, [c.key]: e.target.value }))}
                      style={{ width: '100%', padding: '6px 24px 6px 10px',
                        border: `1.5px solid ${cur !== 'all' ? A.a : M.divider}`,
                        borderRadius: 7, fontSize: 10.5, outline: 'none',
                        appearance: 'none', cursor: 'pointer',
                        background: cur !== 'all' ? A.al : M.inputBg,
                        color: M.textA, fontFamily: uff }}>
                      <option value="all">{'\u2014'} All {'\u2014'}</option>
                      {(c.options || vals).map(v => (
                        <option key={v} value={String(v)}>{String(v)}</option>
                      ))}
                    </select>
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      color: M.textD, fontSize: 10, pointerEvents: 'none' }}>{'\u25BE'}</span>
                  </div>
                )}
              </div>
            );
          })}

          {filterableCols.length === 0 && (
            <div style={{ padding: '28px 0', textAlign: 'center', color: M.textD, fontSize: 11, fontFamily: uff }}>
              No filterable columns visible.<br />Switch to a view with more columns.
            </div>
          )}
        </div>

        <div style={{ padding: '10px 14px', borderTop: `1px solid ${M.divider}`, display: 'flex', gap: 8 }}>
          <button onClick={clear} style={{ flex: 1, padding: '7px', border: `1px solid ${M.divider}`,
            borderRadius: 7, background: M.surfMid, color: M.textB,
            fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>Clear All</button>
          <button onClick={apply} style={{ flex: 2, padding: '7px', border: 'none',
            borderRadius: 7, background: A.a, color: '#fff',
            fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}

// ── V2 Sort Panel Drawer ──
function SortPanelV2Drawer({ sorts, setSorts, allFields, onClose, M, A, uff }) {
  const sortableCols = allFields.filter(c => !c.thumb && !c.hidden);
  const [local, setLocal] = useState(sorts.length ? sorts.map(s => ({...s})) : []);
  const dragIdx = useRef(null);

  const addSort = () => {
    const used = local.map(s => s.col);
    const next = sortableCols.find(c => !used.includes(c.key));
    if (!next) return;
    setLocal(p => [...p, { col: next.key, dir: 'asc', type: 'auto', nulls: 'last' }]);
  };

  const PRESETS = [
    { l: 'Code A\u2192Z',    s: [{ col: 'code',   dir: 'asc', type: 'auto', nulls: 'last' }] },
    { l: 'Code Z\u2192A',    s: [{ col: 'code',   dir: 'desc', type: 'auto', nulls: 'last' }] },
    { l: 'Status',      s: [{ col: 'status', dir: 'asc', type: 'auto', nulls: 'last' }] },
  ];

  // Try to find common sort columns
  const hasMrp = sortableCols.find(c => c.key === 'mrp');
  const hasCat = sortableCols.find(c => c.key === 'l2Category');
  if (hasMrp) {
    PRESETS.push({ l: 'MRP Low\u2192High', s: [{ col: 'mrp', dir: 'asc', type: 'auto', nulls: 'last' }] });
    PRESETS.push({ l: 'MRP High\u2192Low', s: [{ col: 'mrp', dir: 'desc', type: 'auto', nulls: 'last' }] });
  }
  if (hasCat) {
    PRESETS.push({ l: 'Category', s: [{ col: 'l2Category', dir: 'asc', type: 'auto', nulls: 'last' }] });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(15,23,42,.28)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 340,
        background: M.surfHigh, boxShadow: '-10px 0 40px rgba(0,0,0,.12)',
        display: 'flex', flexDirection: 'column', animation: 'slideFromRight .22s ease' }}>

        <div style={{ padding: '13px 14px 11px', borderBottom: `1px solid ${M.divider}`,
          background: '#1e293b', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#e2e8f0', flex: 1, fontFamily: uff }}>{'\u2195'} Sort Columns</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 16, color: '#94a3b8', cursor: 'pointer' }}>{'\u00D7'}</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase',
            letterSpacing: .5, marginBottom: 8, fontFamily: uff }}>Quick Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {PRESETS.map(p => (
              <button key={p.l} onClick={() => setLocal(p.s.map(s => ({...s})))} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 9.5, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${M.divider}`, background: M.surfMid, color: M.textB,
                fontFamily: uff }}>{p.l}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: .5, fontFamily: uff }}>
              Sort Rules {local.length > 0 && <span style={{ color: A.a }}>({local.length})</span>}
            </div>
            <button onClick={addSort} disabled={local.length >= sortableCols.length} style={{
              padding: '3px 9px', border: `1.5px dashed ${A.a}`, borderRadius: 6,
              background: A.al, color: A.a,
              fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>+ Add Rule</button>
          </div>

          {local.length === 0 && (
            <div style={{ padding: '18px 0', textAlign: 'center', color: M.textD, fontSize: 10, fontFamily: uff }}>
              No sort rules. Add one or pick a preset.
            </div>
          )}

          {local.map((s, i) => {
            const fld = allFields.find(c => c.key === s.col);
            const isNum = fld?.type === 'number' || fld?.type === 'currency';
            return (
              <div key={i} draggable
                onDragStart={() => { dragIdx.current = i; }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx.current === null || dragIdx.current === i) return;
                  const arr = [...local]; const [item] = arr.splice(dragIdx.current, 1);
                  arr.splice(i, 0, item); setLocal(arr); dragIdx.current = null;
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
                  marginBottom: 5, borderRadius: 7, border: `1.5px solid ${M.divider}`,
                  background: M.surfHigh, cursor: 'grab',
                  boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ width: 19, height: 19, borderRadius: '50%', flexShrink: 0,
                  background: A.a, color: '#fff', fontSize: 9, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                <span style={{ fontSize: 11, color: M.textD, cursor: 'grab' }}>{'\u2807'}</span>
                <select value={s.col} onChange={e => setLocal(p => p.map((r, ri) => ri === i ? {...r, col: e.target.value} : r))}
                  style={{ flex: 1, padding: '4px 6px', border: `1px solid ${M.divider}`,
                    borderRadius: 5, fontSize: 10, outline: 'none',
                    background: M.inputBg, fontFamily: uff, color: M.textA }}>
                  {sortableCols.map(c => (
                    <option key={c.key} value={c.key}
                      disabled={local.some((ls, li) => li !== i && ls.col === c.key)}>
                      {c.header}
                    </option>
                  ))}
                </select>
                <button onClick={() => setLocal(p => p.map((r, ri) => ri === i ? {...r, dir: r.dir === 'asc' ? 'desc' : 'asc'} : r))} style={{
                  padding: '4px 9px', border: `1.5px solid ${M.divider}`,
                  borderRadius: 5, background: M.surfMid, color: M.textB,
                  fontSize: 9, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: uff }}>
                  {s.dir === 'asc' ? (isNum ? '1\u21929' : 'A\u2192Z') : (isNum ? '9\u21921' : 'Z\u2192A')}
                </button>
                <button onClick={() => setLocal(p => p.filter((_, ri) => ri !== i))} style={{
                  border: 'none', background: 'none', color: M.textD, cursor: 'pointer', fontSize: 15, padding: '0 2px' }}>{'\u00D7'}</button>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '10px 14px', borderTop: `1px solid ${M.divider}`, display: 'flex', gap: 8 }}>
          <button onClick={() => { setSorts([]); setLocal([]); onClose(); }} style={{
            flex: 1, padding: '7px', border: `1px solid ${M.divider}`,
            borderRadius: 7, background: M.surfMid, color: M.textB,
            fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>Clear All</button>
          <button onClick={() => { setSorts(local); onClose(); }} style={{
            flex: 2, padding: '7px', border: 'none',
            borderRadius: 7, background: '#1e293b', color: '#fff',
            fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>{'\u2195'} Apply Sort</button>
        </div>
      </div>
    </div>
  );
}

// ── V2 New View Modal ──
function NewViewModalV2({ allFields, existingNames, onSave, onClose, editView, M, A, uff }) {
  const isEdit = !!editView;
  const allKeys = allFields.map(f => f.key);
  const [name, setName] = useState(editView?.name || '');
  const [selCols, setSelCols] = useState(new Set(editView?.cols || allKeys));
  const [err, setErr] = useState('');

  const toggleCol = k => setSelCols(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const handleSave = () => {
    const t = name.trim();
    if (!t) { setErr('View name is required'); return; }
    if (!isEdit && existingNames.includes(t)) { setErr('Name already exists'); return; }
    if (selCols.size === 0) { setErr('Select at least one column'); return; }
    onSave({ name: t, cols: [...selCols], icon: '\uD83D\uDCCC', color: '#6c3fc5', isSystem: false,
      id: editView?.id || `cv_${Date.now()}` });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(15,23,42,.48)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: M.surfHigh, borderRadius: 13, width: 490, maxHeight: '88vh',
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${M.divider}`,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg,#faf7ff,#fff)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0eeff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\uD83D\uDCCC'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: M.textA, fontFamily: uff }}>
              {isEdit ? `Edit View \u2014 "${editView.name}"` : 'Create New Column View'}
            </div>
            <div style={{ fontSize: 9, color: M.textD, marginTop: 1, fontFamily: uff }}>Choose which columns are visible in this view</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, color: M.textD, cursor: 'pointer' }}>{'\u00D7'}</button>
        </div>

        <div style={{ padding: '12px 18px 6px' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase',
            letterSpacing: .5, marginBottom: 5, fontFamily: uff }}>View Name</div>
          <input value={name} onChange={e => { setName(e.target.value); setErr(''); }}
            placeholder="e.g. Buyer View, QC Columns, Season Check\u2026"
            style={{ width: '100%', padding: '7px 11px',
              border: `1.5px solid ${err ? CC_RED : M.divider}`,
              borderRadius: 7, fontSize: 12, outline: 'none',
              background: err ? '#fff0f0' : M.inputBg, color: M.textA, fontFamily: uff }} />
          {err && <div style={{ fontSize: 9, color: CC_RED, marginTop: 4, fontWeight: 700, fontFamily: uff }}>{'\u26A0'} {err}</div>}
        </div>

        <div style={{ padding: '4px 18px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: .5, fontFamily: uff }}>
            Columns <span style={{ color: '#6c3fc5' }}>({selCols.size} selected)</span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[
              { l: 'All', fn: () => setSelCols(new Set(allKeys)), c: M.textB },
              { l: 'Clear', fn: () => setSelCols(new Set()), c: M.textD },
            ].map(b => (
              <button key={b.l} onClick={b.fn} style={{ padding: '2px 9px',
                border: `1px solid ${M.divider}`, borderRadius: 6,
                background: M.surfMid, color: b.c, fontSize: 8.5, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>
                {b.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 16px' }}>
          {allFields.map(c => {
            const on = selCols.has(c.key);
            return (
              <button key={c.key} onClick={() => toggleCol(c.key)} style={{
                padding: '3px 9px', borderRadius: 9, fontSize: 9, fontWeight: 700,
                cursor: 'pointer', transition: 'all .12s', margin: '0 4px 4px 0',
                border: `1.5px solid ${on ? '#6c3fc570' : M.divider}`,
                background: on ? '#f0eeff' : M.surfMid,
                color: on ? '#6c3fc5' : M.textD,
                display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: uff }}>
                {c.auto && <span style={{ fontSize: 7, color: '#6c3fc5' }}>{'\u2190'}</span>}
                {c.header}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '10px 18px', borderTop: `1px solid ${M.divider}`,
          display: 'flex', alignItems: 'center', gap: 8, background: M.surfMid }}>
          <span style={{ fontSize: 9, color: M.textD, flex: 1, fontFamily: uff }}>
            {selCols.size} column{selCols.size !== 1 ? 's' : ''} selected
          </span>
          <button onClick={onClose} style={{ padding: '7px 14px',
            border: `1.5px solid ${M.divider}`, borderRadius: 7,
            background: M.surfMid, color: M.textB, fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '7px 20px', border: 'none',
            borderRadius: 7, background: '#6c3fc5', color: '#fff',
            fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>
            {isEdit ? 'Update View' : 'Create View'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── V2 Manage Panel (right drawer) ──
function ManagePanelV2({ systemViews, customViews, activeViewId, onEdit, onDelete, onDuplicate, onClose, M, A, uff }) {
  const [confirm, setConfirm] = useState(null);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(15,23,42,.3)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 370,
        background: M.surfHigh, boxShadow: '-10px 0 40px rgba(0,0,0,.14)',
        display: 'flex', flexDirection: 'column', animation: 'slideFromRight .22s ease' }}>

        <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${M.divider}`,
          background: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{'\uD83D\uDD16'}</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#e2e8f0', flex: 1, fontFamily: uff }}>Manage Views</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 16, color: '#94a3b8', cursor: 'pointer' }}>{'\u00D7'}</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: M.textD, textTransform: 'uppercase',
            letterSpacing: .8, marginBottom: 6, padding: '0 4px', fontFamily: uff }}>System Views (locked)</div>
          {systemViews.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 8, marginBottom: 4,
              background: M.surfMid, border: `1px solid ${M.divider}` }}>
              <span style={{ fontSize: 15 }}>{v.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: M.textA, fontFamily: uff }}>{v.name}</div>
                <div style={{ fontSize: 8.5, color: M.textD, marginTop: 1, fontFamily: uff }}>{v.desc}</div>
              </div>
              <span style={{ fontSize: 7.5, padding: '2px 6px', borderRadius: 5,
                background: M.surfMid, color: M.textD, fontWeight: 900, fontFamily: uff }}>LOCKED</span>
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 8px' }}>
            <div style={{ flex: 1, height: 1, background: M.divider }} />
            <span style={{ fontSize: 8, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: .8, fontFamily: uff }}>
              Custom Views ({customViews.length})
            </span>
            <div style={{ flex: 1, height: 1, background: M.divider }} />
          </div>

          {customViews.length === 0 && (
            <div style={{ padding: '28px 0', textAlign: 'center', color: M.textD }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{'\uD83D\uDCCC'}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: uff }}>No custom views yet</div>
              <div style={{ fontSize: 9, fontFamily: uff }}>Use <b style={{ color: A.a }}>+ New View</b> to create one.</div>
            </div>
          )}

          {customViews.map(v => {
            const isActive = activeViewId === v.id;
            const isDel = confirm === v.id;
            return (
              <div key={v.id} style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 5,
                border: `1.5px solid ${isActive ? '#6c3fc555' : M.divider}`,
                background: isActive ? '#f0eeff' : M.surfHigh, transition: 'all .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{v.icon || '\uD83D\uDCCC'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: isActive ? '#6c3fc5' : M.textA, fontFamily: uff }}>{v.name}</span>
                      {isActive && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 4,
                        background: '#6c3fc5', color: '#fff', fontWeight: 900 }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize: 8.5, color: M.textD, marginTop: 1, fontFamily: uff }}>{v.cols?.length || 0} columns</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => onEdit(v)} style={{ padding: '3px 8px',
                      border: `1px solid ${M.divider}`, borderRadius: 5,
                      background: M.surfMid, color: M.textB, fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>Edit</button>
                    <button onClick={() => onDuplicate(v)} style={{ padding: '3px 8px',
                      border: `1px solid ${M.divider}`, borderRadius: 5,
                      background: M.surfMid, color: M.textB, fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>{'\u29C9'}</button>
                    <button onClick={() => setConfirm(isDel ? null : v.id)} style={{ padding: '3px 8px',
                      border: `1px solid ${isDel ? '#fca5a5' : M.divider}`, borderRadius: 5,
                      background: isDel ? '#fff1f1' : M.surfMid,
                      color: isDel ? CC_RED : M.textD, fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>{'\u00D7'}</button>
                  </div>
                </div>
                {isDel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                    padding: '6px 8px', borderRadius: 7, background: '#fff1f1', border: '1px solid #fca5a5' }}>
                    <span style={{ fontSize: 9, color: CC_RED, flex: 1, fontFamily: uff }}>
                      Delete "<b>{v.name}</b>"?
                    </span>
                    <button onClick={() => { onDelete(v.id); setConfirm(null); }} style={{ padding: '3px 10px',
                      border: 'none', borderRadius: 5, background: CC_RED,
                      color: '#fff', fontSize: 9, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>Delete</button>
                    <button onClick={() => setConfirm(null)} style={{ padding: '3px 8px',
                      border: `1px solid ${M.divider}`, borderRadius: 5,
                      background: M.surfHigh, color: M.textB, fontSize: 9, cursor: 'pointer', fontFamily: uff }}>Keep</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '10px 12px', borderTop: `1px solid ${M.divider}`,
          background: M.surfMid, fontSize: 9, color: M.textD, textAlign: 'center', fontFamily: uff }}>
          {systemViews.length} system {'\u00B7'} {customViews.length} custom {'\u00B7'} {systemViews.length + customViews.length} total
        </div>
      </div>
    </div>
  );
}

// ── V2 Export Menu ──
function ExportMenuV2({ count, onClose, onToast, M, A, uff }) {
  const opts = [
    { icon: '\uD83D\uDCC4', label: 'Export as PDF', sub: 'Formatted A4 layout', col: CC_RED },
    { icon: '\uD83D\uDCCA', label: 'Export as Excel (.xlsx)', sub: 'Full sheet with all cols', col: '#15803d' },
    { icon: '\uD83D\uDCCB', label: 'Copy to Google Sheet', sub: 'Opens in new tab', col: '#1d6fa4' },
    { icon: '\uD83D\uDDA8\uFE0F', label: 'Print view', sub: 'Browser print dialog', col: M.textB },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500 }} onClick={onClose}>
      <div style={{ position: 'absolute', right: 12, top: 90,
        background: M.surfHigh, borderRadius: 10, width: 240,
        boxShadow: '0 12px 40px rgba(0,0,0,.18)', border: `1px solid ${M.divider}`,
        overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '8px 12px 6px', borderBottom: `1px solid ${M.divider}`,
          fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: .8, fontFamily: uff }}>
          Export {count} records
        </div>
        {opts.map(o => (
          <button key={o.label} onClick={() => { onToast(`${o.label}\u2026`); onClose(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', border: 'none', background: 'transparent',
              cursor: 'pointer', textAlign: 'left', transition: 'background .1s', fontFamily: uff }}
            onMouseEnter={e => e.currentTarget.style.background = M.hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{o.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: o.col }}>{o.label}</div>
              <div style={{ fontSize: 8.5, color: M.textD }}>{o.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── V2 Detail Modal ──
function V2DetailModal({ row, schema, codeKey, onClose, onEdit, M, A, uff }) {
  const [tab, setTab] = useState('details');
  const st = V2_STATUS[row.status] || V2_STATUS.Inactive;

  const detailFields = schema.filter(f => !f.hidden && f.w !== '0' && !f.thumb);
  const pricingFields = schema.filter(f => ['wsp','mrp','markupPct','markdownPct','hsnCode','gstPct'].includes(f.key));
  const fabricFields = schema.filter(f => ['mainFabric','fabricName','colorCodes','sizeRange'].includes(f.key));
  const hasPricing = pricingFields.length > 0;
  const hasFabric = fabricFields.length > 0;

  const tabs = [{ id: 'details', l: '\uD83D\uDCCB Item Details' }];
  if (hasPricing) tabs.push({ id: 'pricing', l: '\u20B9 Pricing & Tax' });
  if (hasFabric) tabs.push({ id: 'fabric', l: '\uD83E\uDDF5 Fabric' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(15,23,42,.48)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: M.bg, borderRadius: 13, width: 820, maxHeight: '88vh',
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Hero */}
        <div style={{ display: 'flex', background: M.surfHigh, borderBottom: `2px solid ${M.divider}`, flexShrink: 0 }}>
          <div style={{ width: 180, height: 180, flexShrink: 0, overflow: 'hidden' }}>
            <V2ImgThumb src={row.imageLink} size={180} radius={0} M={M}/>
          </div>
          <div style={{ width: 130, flexShrink: 0, height: 180,
            background: M.surfMid, borderLeft: `1px solid ${M.divider}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, color: M.textD, letterSpacing: .5 }}>{'\u270F'} SKETCH</span>
            <V2SketchThumb src={row.sketchLink} size={96} radius={8} M={M}/>
          </div>
          <div style={{ flex: 1, padding: '16px 18px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: A.a,
                fontFamily: "'IBM Plex Mono',monospace" }}>{row[codeKey]}</span>
              <V2StatusBadge s={row.status}/>
            </div>
            {row.shortName && <div style={{ fontSize: 9.5, color: M.textD, marginBottom: 5 }}>"{row.shortName}"</div>}
            <div style={{ fontSize: 13, fontWeight: 800, color: M.textA, lineHeight: 1.4, marginBottom: 9 }}>{row.desc}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 7 }}>
              {[row.gender, row.l2Category, row.l3Style, row.fitType, row.neckline, row.sleeveType]
                .filter(Boolean).map((v, i) => (
                <span key={i} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 8,
                  background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>{v}</span>
              ))}
              {row.season && String(row.season).split(',').map(s => (
                <span key={s} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 8,
                  background: '#dbeafe', color: '#1d6fa4', fontWeight: 700 }}>{s.trim()}</span>
              ))}
            </div>
            {row.buyerStyle && <div style={{ fontSize: 9.5, color: M.textD }}>
              Buyer Style: <b style={{ color: M.textB }}>{row.buyerStyle}</b></div>}
          </div>
          <button onClick={onClose} style={{ position: 'absolute', right: 16, top: 12,
            border: 'none', background: 'rgba(0,0,0,.06)', width: 28, height: 28,
            borderRadius: '50%', cursor: 'pointer', fontSize: 16, color: M.textB,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'\u00D7'}</button>
        </div>

        {/* Tabs */}
        <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`,
          display: 'flex', padding: '0 18px', flexShrink: 0, alignItems: 'center' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 14px', border: 'none', background: 'transparent',
              borderBottom: `2.5px solid ${tab === t.id ? A.a : 'transparent'}`,
              fontSize: 10.5, fontWeight: tab === t.id ? 900 : 700,
              color: tab === t.id ? A.a : M.textB, cursor: 'pointer', transition: 'all .15s',
              fontFamily: uff }}>{t.l}</button>
          ))}
          <div style={{ flex: 1 }}/>
          <button onClick={() => { onEdit(row); onClose(); }} style={{ padding: '5px 16px',
            border: `1.5px solid ${A.a}`, borderRadius: 6,
            background: A.al, color: A.a,
            fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>{'\u270E'} Edit Record</button>
        </div>

        {/* Tab content */}
        <div style={{ padding: '14px 18px', overflowY: 'auto' }}>
          {tab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 14px' }}>
              {detailFields.map(f => (
                <div key={f.key} style={{ background: M.surfHigh, borderRadius: 7, padding: '8px 12px',
                  border: `1px solid ${M.divider}` }}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: f.auto ? '#6c3fc5' : M.textD,
                    textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4, fontFamily: uff }}>{f.header}</div>
                  <div style={{ fontSize: 12, fontWeight: 700,
                    fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff,
                    color: f.auto ? '#6c3fc5' : (row[f.key] ? M.textA : M.textD) }}>
                    {row[f.key] || '\u2014'}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'pricing' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 14px' }}>
              {pricingFields.map(f => {
                const val = row[f.key];
                const isAuto = f.auto;
                const disp = val ? (f.key === 'wsp' || f.key === 'mrp' ? `\u20B9${val}` : f.key === 'gstPct' || f.key === 'markupPct' || f.key === 'markdownPct' ? `${val}%` : val) : '\u2014';
                return (
                  <div key={f.key} style={{ background: M.surfHigh, borderRadius: 7,
                    padding: '10px 14px', border: `1px solid ${M.divider}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
                      letterSpacing: .5, marginBottom: 5,
                      color: isAuto ? '#6c3fc5' : M.textD, fontFamily: uff }}>{f.header}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'IBM Plex Mono',monospace",
                      color: isAuto ? '#6c3fc5' : M.textA }}>{disp}</div>
                  </div>
                );
              })}
            </div>
          )}
          {tab === 'fabric' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
              {fabricFields.map(f => {
                const isAuto = f.auto;
                return (
                  <div key={f.key} style={{ background: M.surfHigh, borderRadius: 7,
                    padding: '10px 14px', border: `1px solid ${M.divider}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
                      letterSpacing: .5, marginBottom: 5,
                      color: isAuto ? '#6c3fc5' : M.textD, fontFamily: uff }}>{f.header}</div>
                    <div style={{ fontSize: 14, fontWeight: 700,
                      fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff,
                      color: isAuto ? '#6c3fc5' : M.textA }}>{row[f.key] || '\u2014'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── V2 Split View ──
function SplitViewPanel({ sorted, visCols, schema, codeKey, onEdit, M, A, uff, fz }) {
  const [sel, setSel] = useState(sorted[0] || null);
  const [tab, setTab] = useState('details');
  const [srch, setSrch] = useState('');

  const visRows = useMemo(() => {
    if (!srch) return sorted;
    const q = srch.toLowerCase();
    return sorted.filter(r => Object.values(r).some(v => String(v || '').toLowerCase().includes(q)));
  }, [sorted, srch]);

  const effSel = (sel && visRows.find(r => r[codeKey] === sel[codeKey])) ? sel : (visRows[0] || null);

  const detailFields = schema.filter(f => !f.hidden && f.w !== '0' && !f.thumb);
  const pricingFields = schema.filter(f => ['wsp','mrp','markupPct','markdownPct','hsnCode','gstPct'].includes(f.key));
  const fabricFields = schema.filter(f => ['mainFabric','fabricName','colorCodes','sizeRange'].includes(f.key));
  const hasPricing = pricingFields.length > 0;
  const hasFabric = fabricFields.length > 0;
  const tabs = [{ id: 'details', l: '\uD83D\uDCCB Details' }];
  if (hasPricing) tabs.push({ id: 'pricing', l: '\u20B9 Pricing' });
  if (hasFabric) tabs.push({ id: 'fabric', l: '\uD83E\uDDF5 Fabric' });

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* LEFT LIST */}
      <div style={{ width: 285, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: `2px solid ${M.divider}`, background: M.surfHigh }}>
        <div style={{ padding: '7px 10px', borderBottom: `1px solid ${M.divider}`, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 12, color: M.textD, pointerEvents: 'none' }}>{'\u2315'}</span>
            <input value={srch} onChange={e => setSrch(e.target.value)}
              placeholder="Search list\u2026"
              style={{ width: '100%', padding: '5px 24px', border: `1.5px solid ${M.divider}`,
                borderRadius: 6, fontSize: 10.5, outline: 'none',
                background: M.inputBg, fontFamily: uff, color: M.textA }} />
            {srch && <button onClick={() => setSrch('')} style={{ position: 'absolute', right: 7,
              top: '50%', transform: 'translateY(-50%)',
              border: 'none', background: 'none', color: M.textD, cursor: 'pointer', fontSize: 12 }}>{'\u00D7'}</button>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {visRows.map(r => {
            const on = effSel?.[codeKey] === r[codeKey];
            const st2 = V2_STATUS[r.status] || V2_STATUS.Inactive;
            const secondField = visCols.find(f => !f.thumb && f.key !== codeKey);
            return (
              <div key={r[codeKey]} onClick={() => { setSel(r); setTab('details'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderBottom: '1px solid #f1f4f9',
                  background: on ? A.al : M.surfHigh,
                  borderLeft: `3px solid ${on ? A.a : 'transparent'}`,
                  cursor: 'pointer', transition: 'background .1s' }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = M.hoverBg; }}
                onMouseLeave={e => { e.currentTarget.style.background = on ? A.al : M.surfHigh; }}>
                <V2ImgThumb src={r.imageLink} size={40} radius={7} M={M}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: A.a,
                      fontFamily: "'IBM Plex Mono',monospace" }}>{r[codeKey]}</span>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: st2.dot }}/>
                  </div>
                  {secondField && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: M.textA, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[secondField.key] || '\u2014'}</div>
                  )}
                </div>
                <V2SketchThumb src={r.sketchLink} size={28} radius={4} M={M}/>
              </div>
            );
          })}
          {visRows.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: M.textD, fontSize: 11, fontFamily: uff }}>No results</div>
          )}
        </div>
        <div style={{ padding: '5px 10px', borderTop: `1px solid ${M.divider}`,
          background: M.surfMid, fontSize: 9, color: M.textD, fontFamily: uff }}>{visRows.length} records</div>
      </div>

      {/* RIGHT DETAIL */}
      {effSel ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: M.bg }}>
          {/* Hero */}
          <div style={{ display: 'flex', background: M.surfHigh, borderBottom: `2px solid ${M.divider}`, flexShrink: 0 }}>
            <div style={{ width: 210, height: 210, flexShrink: 0, overflow: 'hidden' }}>
              <V2ImgThumb src={effSel.imageLink} size={210} radius={0} M={M}/>
            </div>
            <div style={{ width: 150, flexShrink: 0, height: 210, background: M.surfMid,
              borderLeft: `1px solid ${M.divider}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 }}>
              <span style={{ fontSize: 8.5, fontWeight: 900, color: M.textD, letterSpacing: .5 }}>{'\u270F'} SKETCH / TECH PACK</span>
              <V2SketchThumb src={effSel.sketchLink} size={112} radius={8} M={M}/>
            </div>
            <div style={{ flex: 1, padding: '18px 20px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: A.a,
                  fontFamily: "'IBM Plex Mono',monospace" }}>{effSel[codeKey]}</span>
                <V2StatusBadge s={effSel.status}/>
              </div>
              {effSel.shortName && <div style={{ fontSize: 10, color: M.textD, marginBottom: 5 }}>"{effSel.shortName}"</div>}
              <div style={{ fontSize: 14, fontWeight: 800, color: M.textA, lineHeight: 1.4, marginBottom: 9 }}>{effSel.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 7 }}>
                {[effSel.gender, effSel.l2Category, effSel.l3Style, effSel.fitType, effSel.neckline, effSel.sleeveType]
                  .filter(Boolean).map((v, i) => (
                  <span key={i} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 8,
                    background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>{v}</span>
                ))}
                {effSel.season && String(effSel.season).split(',').map(s => (
                  <span key={s} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 8,
                    background: '#dbeafe', color: '#1d6fa4', fontWeight: 700 }}>{s.trim()}</span>
                ))}
              </div>
              {effSel.buyerStyle && <div style={{ fontSize: 9.5, color: M.textD }}>
                Buyer Style: <b style={{ color: M.textB }}>{effSel.buyerStyle}</b></div>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`,
            display: 'flex', padding: '0 18px', flexShrink: 0, alignItems: 'center' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '9px 14px', border: 'none', background: 'transparent',
                borderBottom: `2.5px solid ${tab === t.id ? A.a : 'transparent'}`,
                fontSize: 10.5, fontWeight: tab === t.id ? 900 : 700,
                color: tab === t.id ? A.a : M.textB, cursor: 'pointer',
                transition: 'all .15s', fontFamily: uff }}>{t.l}</button>
            ))}
            <div style={{ flex: 1 }}/>
            <button onClick={() => onEdit(effSel)} style={{ padding: '5px 16px',
              border: `1.5px solid ${A.a}`, borderRadius: 6,
              background: A.al, color: A.a,
              fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: uff }}>{'\u270E'} Edit Record</button>
          </div>

          {/* Tab content */}
          <div style={{ padding: '14px 18px' }}>
            {tab === 'details' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 14px' }}>
                {detailFields.map(f => (
                  <div key={f.key} style={{ background: M.surfHigh, borderRadius: 7, padding: '8px 12px',
                    border: `1px solid ${M.divider}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, color: f.auto ? '#6c3fc5' : M.textD,
                      textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4, fontFamily: uff }}>{f.header}</div>
                    <div style={{ fontSize: 12, fontWeight: 700,
                      fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff,
                      color: f.auto ? '#6c3fc5' : (effSel[f.key] ? M.textA : M.textD) }}>
                      {effSel[f.key] || '\u2014'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'pricing' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 14px' }}>
                {pricingFields.map(f => {
                  const val = effSel[f.key];
                  const isAuto = f.auto;
                  const disp = val ? (f.key === 'wsp' || f.key === 'mrp' ? `\u20B9${val}` : f.key === 'gstPct' || f.key === 'markupPct' || f.key === 'markdownPct' ? `${val}%` : val) : '\u2014';
                  return (
                    <div key={f.key} style={{ background: M.surfHigh, borderRadius: 7,
                      padding: '10px 14px', border: `1px solid ${M.divider}` }}>
                      <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: .5, marginBottom: 5,
                        color: isAuto ? '#6c3fc5' : M.textD, fontFamily: uff }}>{f.header}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'IBM Plex Mono',monospace",
                        color: isAuto ? '#6c3fc5' : M.textA }}>{disp}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {tab === 'fabric' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                {fabricFields.map(f => {
                  const isAuto = f.auto;
                  return (
                    <div key={f.key} style={{ background: M.surfHigh, borderRadius: 7,
                      padding: '10px 14px', border: `1px solid ${M.divider}` }}>
                      <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: .5, marginBottom: 5,
                        color: isAuto ? '#6c3fc5' : M.textD, fontFamily: uff }}>{f.header}</div>
                      <div style={{ fontSize: 14, fontWeight: 700,
                        fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff,
                        color: isAuto ? '#6c3fc5' : M.textA }}>{effSel[f.key] || '\u2014'}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: M.textD, gap: 8 }}>
          <div style={{ fontSize: 32 }}>{'\uD83D\uDCCB'}</div>
          <div style={{ fontSize: 13, fontFamily: uff }}>Select a record to view details</div>
        </div>
      )}
    </div>
  );
}

/**
 * RecordsTab — full-featured data table with sort, grouping, column management,
 * aggregation footer, views system, record detail modal.
 * 3 view modes: Sheet (existing full table), Table (V2 styled), Split (V2 styled)
 *
 * Props: { sheet, fileKey, fileLabel, M, A, uff, dff, fz, pyV, sheetCounts }
 */
export default function RecordsTab({ sheet, fileKey, fileLabel, M, A, uff, dff, fz = 13, pyV = 7, sheetCounts }) {
  // === DATA ===
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch]       = useState('');

  // === FORM (add / edit) ===
  const [showAddForm, setShowAddForm] = useState(false);
  const [editRow, setEditRow]         = useState(null);
  const [formData, setFormData]       = useState({});
  const [saving, setSaving]           = useState(false);

  // === VIEW STATE ===
  const [sorts, setSorts]           = useState([]);
  const [colOrder, setColOrder]     = useState([]);
  const [hiddenC, setHiddenC]       = useState([]);
  const [groupBy, setGroupBy]       = useState(null);
  const [subGroupBy, setSubGroupBy] = useState(null);
  const [aggs, setAggs]             = useState({});
  const [filters, setFilters]       = useState({});  // per-column text filters
  const [selectedRows, setSelectedRows] = useState(new Set());

  // === VIEWS SYSTEM ===
  const [savedViews, setSavedViews]     = useState([]);
  const [activeViewName, setActiveViewName] = useState('Default');
  const [showViewEdit, setShowViewEdit] = useState(null); // {mode, view} | null
  const [switchGuard, setSwitchGuard]   = useState(null); // {targetViewName} | null

  // === PANELS ===
  const [showSortPanel, setShowSortPanel]   = useState(false);
  const [showColPanel, setShowColPanel]     = useState(false);
  const [aggAnchor, setAggAnchor]           = useState(null); // {col, rect}
  const [detailRow, setDetailRow]           = useState(null);
  const [toast, setToast]                   = useState(null);

  // === COLUMN DRAG ===
  const [colDragIdx, setColDragIdx] = useState(null);
  const [colDropIdx, setColDropIdx] = useState(null);

  // === COLUMN / ROW RESIZE ===
  const [colWidths, setColWidths] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${fileKey}_rec_colW`) || '{}'); } catch { return {}; }
  });
  const [rowHeights, setRowHeights] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${fileKey}_rec_rowH`) || '{}'); } catch { return {}; }
  });
  const _colWRef = useRef({});
  const _rowHRef = useRef({});

  // === ROW HEIGHT MODE (global preset) ===
  const [rowHeightMode, setRowHeightMode] = useState(() =>
    localStorage.getItem(`${fileKey}_rec_rhMode`) || 'short'
  );
  const [showRowHeightMenu, setShowRowHeightMenu] = useState(false);

  // === INLINE PANELS ===
  const [showFP, setShowFP]                 = useState(false);   // filter panel
  const [showCM, setShowCM]                 = useState(false);   // column pills
  const [showExportMenu, setShowExportMenu] = useState(false);   // export dropdown
  const [renamingView, setRenamingView]     = useState(null);    // view name being renamed
  const [renameVal, setRenameVal]           = useState('');
  const [showInlineSave, setShowInlineSave] = useState(false);
  const [inlineSaveName, setInlineSaveName] = useState('');

  // === ADVANCED FILTER / SORT (Layout View style) ===
  const [advFilters,     setAdvFilters]    = useState([]);
  const [advSorts,       setAdvSorts]      = useState([]);
  const [showAdvFilters, setShowAdvFilters] = useState(false);
  const [showAdvSorts,   setShowAdvSorts]   = useState(false);

  // === V2 STATE ===
  const [sysViewId, setSysViewId] = useState('all');
  const [viewMode, setViewMode] = useState('sheet');   // 'sheet' | 'table' | 'split'
  const [showFiltPnl, setShowFiltPnl] = useState(false);
  const [colFilters, setColFilters] = useState({});
  const [showNewViewV2, setShowNewViewV2] = useState(false);
  const [editingViewV2, setEditingViewV2] = useState(null);
  const [showManageV2, setShowManageV2] = useState(false);
  const [showExportV2, setShowExportV2] = useState(false);
  const [customViewsV2, setCustomViewsV2] = useState([]);
  const [v2DetailRow, setV2DetailRow] = useState(null);
  const [showSortDrawerV2, setShowSortDrawerV2] = useState(false);

  const systemViews = getSystemViews(sheet.key);
  const allViewsV2 = useMemo(() => [...systemViews, ...customViewsV2], [systemViews, customViewsV2]);
  const activeViewV2 = allViewsV2.find(v => v.id === sysViewId) || systemViews[0];
  const sysVisKeys = activeViewV2?.cols || null; // null = show all

  const schema     = SCHEMA_MAP[sheet.key] || FALLBACK_SCHEMA;
  const codeKey    = schema[0]?.key || 'code';
  const allFields  = schema.filter(c => !c.hidden && c.w !== '0');
  const formFields = schema.filter(c => c.key !== '__skip');

  // ── Reset view state when sheet changes ──
  useEffect(() => {
    const initOrder = allFields.map(f => f.key);
    setColOrder(initOrder);
    setHiddenC([]);
    setSorts([]);
    setAggs({});
    setFilters({});
    setGroupBy(null);
    setSubGroupBy(null);
    setSelectedRows(new Set());
    setSavedViews([]);
    setActiveViewName('Default');
  }, [sheet.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch data ──
  const dataVersionRef = useRef('0');
  useEffect(() => {
    setLoading(true);
    setRows([]);
    setSearch('');
    setFetchError(null);
    setShowAddForm(false);
    setEditRow(null);
    setFormData({});
    dataVersionRef.current = '0';
    api.getMasterData(sheet.key, fileLabel)
      .then(data => {
        if (Array.isArray(data)) setRows(data.map(r => mapRawToSchema(r, schema)));
      })
      .catch(err => {
        console.error('getMasterData:', err);
        setFetchError(err.message || 'Failed to fetch data');
      })
      .finally(() => setLoading(false));
  }, [sheet.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Background auto-refresh: poll every 60s for changes ──
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const resp = await api.getDataSince(sheet.key, dataVersionRef.current);
        if (resp && !resp.unchanged && resp.rows && resp.rows.length) {
          setRows(resp.rows.map(r => mapRawToSchema(r, schema)));
          dataVersionRef.current = resp.version || '0';
        } else if (resp && resp.version) {
          dataVersionRef.current = resp.version;
        }
      } catch (_) { /* silent */ }
    }, 60000);
    return () => clearInterval(interval);
  }, [sheet.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: visible columns ──
  const visCols = useMemo(() => {
    const order = colOrder.length > 0 ? colOrder : allFields.map(f => f.key);
    return order
      .filter(k => !hiddenC.includes(k))
      .filter(k => !sysVisKeys || sysVisKeys.includes(k))
      .map(k => allFields.find(f => f.key === k))
      .filter(Boolean);
  }, [colOrder, hiddenC, allFields, sysVisKeys]);

  // ── Derived: filtered -> sorted -> render list ──
  const filtered = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    for (const [col, val] of Object.entries(filters)) {
      if (val) {
        const q = val.toLowerCase();
        result = result.filter(r => String(r[col] ?? '').toLowerCase().includes(q));
      }
    }
    // V2 column filters (from FilterPanelV2)
    Object.entries(colFilters).forEach(([k, v]) => {
      if (!v || v === 'all') return;
      const f = allFields.find(c => c.key === k);
      const isEnum = f?.type === 'select' || f?.badge || f?.options;
      if (isEnum) {
        result = result.filter(r => String(r[k] || '') === v);
      } else {
        result = result.filter(r => String(r[k] || '').toLowerCase().includes(v.toLowerCase()));
      }
    });
    // Advanced operator-based filters
    advFilters.forEach(fil => {
      if (fil.value !== '' || recAdvFieldType(schema.find(x => x.key === fil.field)) === 'num')
        result = result.filter(r => evalRecAdvFilter(r, fil, schema));
    });
    return result;
  }, [rows, search, filters, colFilters, advFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => {
    const base = applySort(filtered, sorts, schema);
    if (!advSorts.length) return base;
    const fMaps = {};
    allFields.forEach(f => {
      const counts = {};
      rows.forEach(r => { const v = String(r[f.key]??''); counts[v] = (counts[v]||0) + 1; });
      fMaps[f.key] = counts;
    });
    return applyRecAdvSort(base, advSorts, fMaps);
  }, [filtered, sorts, advSorts]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderList = useMemo(() => buildRenderList(sorted, groupBy, subGroupBy), [sorted, groupBy, subGroupBy]);

  // ── Advanced filter / sort helpers ──
  const addAdvFilter    = () => setAdvFilters(p => [...p, { id: Date.now(), field: allFields[0]?.key || '', op: 'is', value: '' }]);
  const removeAdvFilter = (id) => setAdvFilters(p => p.filter(f => f.id !== id));
  const updateAdvFilter = (id, patch) => setAdvFilters(p => p.map(f => {
    if (f.id !== id) return f;
    const merged = { ...f, ...patch };
    if (patch.field && patch.field !== f.field) {
      const ft = recAdvFieldType(schema.find(x => x.key === patch.field));
      merged.op = REC_FILTER_OPS[ft]?.[0] || 'is'; merged.value = '';
    }
    return merged;
  }));
  const addAdvSort    = () => setAdvSorts(p => [...p, { id: Date.now(), field: allFields[0]?.key || '', mode: 'a_z', value: '' }]);
  const removeAdvSort = (id) => setAdvSorts(p => p.length > 1 ? p.filter(s => s.id !== id) : p);
  const updateAdvSort = (id, patch) => setAdvSorts(p => p.map(s => s.id === id ? { ...s, ...patch } : s));
  const activeAdvFilterCount = advFilters.filter(f => f.value !== '').length;
  const isAdvSortActive = advSorts.length > 0;

  // ── Toast helper ──
  const showToast = (msg, colorKey = 'info', delay = 2500) => {
    setToast({ msg, color: TOAST_COLORS[colorKey] || TOAST_COLORS.info });
    setTimeout(() => setToast(null), delay);
  };

  // ── CRUD handlers ──
  const openEdit = (row) => { setEditRow(row); setFormData({ ...row }); setShowAddForm(true); };
  const openAdd  = () => { setEditRow(null); setFormData({}); setShowAddForm(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rawRecord = mapSchemaToRaw(formData, schema);
      await api.saveMasterRecord(sheet.key, fileLabel, rawRecord, !!editRow);
      showToast(editRow ? '\u2713 Record updated' : '\u2713 Record saved', 'success');
      setShowAddForm(false);
      if (editRow) {
        setRows(prev => prev.map(r =>
          r[codeKey] === editRow[codeKey] ? { ...r, ...formData } : r
        ));
      } else {
        setRows(prev => [...prev, { ...formData }]);
      }
      setEditRow(null);
      setFormData({});
    } catch (err) {
      showToast('Error: ' + err.message, 'delete');
      try {
        const data = await api.getMasterData(sheet.key, fileLabel);
        if (Array.isArray(data)) setRows(data.map(r => mapRawToSchema(r, schema)));
      } catch (_) { /* silent fallback */ }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const code = row[codeKey];
    if (!confirm(`Delete record ${code}?`)) return;
    try {
      await api.deleteMasterRecord(sheet.key, fileLabel, code);
      setRows(prev => prev.filter(r => r[codeKey] !== code));
      showToast('\u2713 Record deleted', 'delete');
    } catch (err) {
      showToast('Error: ' + err.message, 'delete');
    }
  };

  // ── Selection ──
  const toggleRow = (id) => setSelectedRows(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const allSelected = sorted.length > 0 && selectedRows.size === sorted.length;
  const toggleAll   = () => setSelectedRows(allSelected ? new Set() : new Set(sorted.map(r => r[codeKey])));

  // ── Quick sort on header click (full shape) ──
  const handleHeaderClick = (colKey) => {
    const existing = sorts.find(s => s.col === colKey);
    if (existing) {
      if (existing.dir === 'asc') {
        setSorts(prev => prev.map(s => s.col === colKey ? { ...s, dir: 'desc' } : s));
      } else {
        setSorts(prev => prev.filter(s => s.col !== colKey));
      }
    } else {
      setSorts(prev => [...prev, { col: colKey, dir: 'asc', type: 'auto', nulls: 'last' }]);
    }
  };

  // ── Column width helper ──
  const colW = (f) => {
    if (colWidths[f.key]) return colWidths[f.key];
    if (f.w === '1fr') return 220;
    const n = parseInt(f.w);
    return isNaN(n) ? 140 : n;
  };

  const startColResize = (e, key, curW) => {
    e.stopPropagation(); e.preventDefault();
    _colWRef.current = { ...colWidths };
    const startX = e.clientX;
    const onMove = me => {
      const w = Math.max(48, curW + me.clientX - startX);
      _colWRef.current = { ..._colWRef.current, [key]: w };
      setColWidths(p => ({ ...p, [key]: w }));
    };
    const onUp = () => {
      localStorage.setItem(`${fileKey}_rec_colW`, JSON.stringify(_colWRef.current));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const startRowResize = (e, rowId, curH) => {
    e.stopPropagation(); e.preventDefault();
    _rowHRef.current = { ...rowHeights };
    const startY = e.clientY;
    const onMove = me => {
      const h = Math.max(28, curH + me.clientY - startY);
      _rowHRef.current = { ..._rowHRef.current, [rowId]: h };
      setRowHeights(p => ({ ...p, [rowId]: h }));
    };
    const onUp = () => {
      localStorage.setItem(`${fileKey}_rec_rowH`, JSON.stringify(_rowHRef.current));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Summary labels ──
  const sortLabel = sorts.length > 0 ? `\u21C5 ${sorts.length} sort${sorts.length > 1 ? 's' : ''}` : '\u21C5 Sort';
  const colLabel  = hiddenC.length > 0 ? `\u2AFF ${hiddenC.length} hidden` : '\u2AFF Columns';
  const grpLabel  = groupBy ? `\u229E ${allFields.find(f => f.key === groupBy)?.header || groupBy}` : '\u229E Group';

  // ── Group by toggle ──
  const handleGroupToggle = () => {
    if (!groupBy) {
      const first = allFields.find(f => f.type === 'select' || f.badge);
      setGroupBy(first?.key || allFields[1]?.key || null);
    } else if (!subGroupBy) {
      const next = allFields.find(f => f.key !== groupBy && (f.type === 'select' || f.badge));
      if (next) setSubGroupBy(next.key);
      else { setGroupBy(null); setSubGroupBy(null); }
    } else {
      setGroupBy(null);
      setSubGroupBy(null);
    }
  };

  // ── Column header drag-to-reorder (§G) ──
  const onColDragStart = (i) => setColDragIdx(i);
  const onColDragOver  = (e, i) => { e.preventDefault(); setColDropIdx(i); };
  const onColDrop      = (i) => {
    if (colDragIdx === null || colDragIdx === i) { setColDragIdx(null); setColDropIdx(null); return; }
    const order = [...(colOrder.length > 0 ? colOrder : allFields.map(f => f.key))];
    const fromKey = visCols[colDragIdx]?.key;
    const toKey   = visCols[i]?.key;
    if (!fromKey || !toKey) { setColDragIdx(null); setColDropIdx(null); return; }
    const fi = order.indexOf(fromKey);
    const ti = order.indexOf(toKey);
    if (fi < 0 || ti < 0) { setColDragIdx(null); setColDropIdx(null); return; }
    const [mv] = order.splice(fi, 1);
    order.splice(ti, 0, mv);
    setColOrder(order);
    setColDragIdx(null);
    setColDropIdx(null);
  };

  // ── Views system ──
  const getViewDirty = () => {
    const allCols = allFields.map(f => f.key);
    if (activeViewName === 'Default') {
      return !(
        JSON.stringify(colOrder.length > 0 ? colOrder : allCols) === JSON.stringify(allCols) &&
        hiddenC.length === 0 &&
        sorts.length === 0 &&
        Object.values(filters).every(v => !v) &&
        groupBy === null &&
        subGroupBy === null
      );
    }
    const saved = savedViews.find(v => v.name === activeViewName);
    if (!saved) return false;
    return (
      JSON.stringify(colOrder) !== JSON.stringify(saved.colOrder) ||
      JSON.stringify(hiddenC)  !== JSON.stringify(saved.hiddenC) ||
      JSON.stringify(sorts)    !== JSON.stringify(saved.sorts) ||
      JSON.stringify(filters)  !== JSON.stringify(saved.filters || {}) ||
      groupBy    !== saved.groupBy ||
      subGroupBy !== (saved.subGroupBy || null)
    );
  };

  const loadView = (view) => {
    if (view.name === 'Default') {
      const allCols = allFields.map(f => f.key);
      setColOrder(allCols);
      setHiddenC([]);
      setSorts([]);
      setFilters({});
      setGroupBy(null);
      setSubGroupBy(null);
    } else {
      setColOrder(view.colOrder || allFields.map(f => f.key));
      setHiddenC(view.hiddenC || []);
      setSorts(view.sorts || []);
      setFilters(view.filters || {});
      setGroupBy(view.groupBy || null);
      setSubGroupBy(view.subGroupBy || null);
    }
    setActiveViewName(view.name);
  };

  const handleViewClick = (viewName) => {
    if (viewName === activeViewName) return;
    if (getViewDirty()) {
      setSwitchGuard({ targetViewName: viewName });
    } else {
      if (viewName === 'Default') {
        loadView({ name: 'Default' });
      } else {
        const view = savedViews.find(v => v.name === viewName);
        if (view) loadView(view);
      }
    }
  };

  const getCurrentViewSnapshot = () => ({
    colOrder: colOrder.length > 0 ? colOrder : allFields.map(f => f.key),
    hiddenC:  [...hiddenC],
    sorts:    [...sorts],
    filters:  { ...filters },
    groupBy,
    subGroupBy,
  });

  const handleViewSave = (viewData) => {
    const mode = showViewEdit?.mode || 'create';
    if (mode === 'edit') {
      setSavedViews(prev => prev.map(v => v.name === viewData.name ? { ...v, ...viewData } : v));
      if (activeViewName === viewData.name) loadView(viewData);
    } else {
      setSavedViews(prev => [...prev, viewData]);
      loadView(viewData);
    }
    setShowViewEdit(null);
    showToast(`\u2713 View "${viewData.name}" saved`, 'view');
  };

  const handleUpdateView = () => {
    if (activeViewName === 'Default') return;
    const snap = getCurrentViewSnapshot();
    setSavedViews(prev => prev.map(v => v.name === activeViewName ? { ...v, ...snap } : v));
    showToast(`\u2713 View "${activeViewName}" updated`, 'view');
  };

  const handleDeleteView = (viewName) => {
    setSavedViews(prev => prev.filter(v => v.name !== viewName));
    if (activeViewName === viewName) loadView({ name: 'Default' });
    showToast(`View "${viewName}" deleted`, 'delete');
  };

  const viewDirty = getViewDirty();

  // ── V2 View CRUD ──
  const handleSaveViewV2 = (vd) => {
    if (editingViewV2) {
      setCustomViewsV2(p => p.map(v => v.id === vd.id ? vd : v));
    } else {
      setCustomViewsV2(p => [...p, vd]);
      setSysViewId(vd.id);
    }
    setShowNewViewV2(false);
    setEditingViewV2(null);
  };
  const handleDeleteViewV2 = (id) => { setCustomViewsV2(p => p.filter(v => v.id !== id)); if (sysViewId === id) setSysViewId('all'); };
  const handleDuplicateViewV2 = (v) => setCustomViewsV2(p => [...p, { ...v, id: `cv_${Date.now()}`, name: `${v.name} (copy)`, isSystem: false }]);
  const existingViewNames = allViewsV2.map(v => v.name);
  const hasColFilter = Object.values(colFilters).some(v => v && v !== 'all');

  // ── Render a data row (Sheet view) ──
  const renderDataRow = (row, rowIdx) => {
    const isSelected = selectedRows.has(row[codeKey]);
    return (
      <tr key={row[codeKey] || rowIdx}
        style={{
          background: isSelected ? A.al : rowIdx % 2 === 0 ? M.tblEven : M.tblOdd,
          borderBottom: `1px solid ${M.divider}`,
          transition: 'background .1s',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = M.hoverBg; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = rowIdx % 2 === 0 ? M.tblEven : M.tblOdd; }}
      >
        {/* Checkbox */}
        <td style={{ padding: `${pyV}px 8px`, borderRight: `1px solid ${M.divider}`, textAlign: 'center' }}>
          <div onClick={() => toggleRow(row[codeKey])} style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${isSelected ? A.a : M.inputBd}`, background: isSelected ? A.a : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'all .1s' }}>
            {isSelected && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>{'\u2713'}</span>}
          </div>
        </td>
        {/* Row # */}
        <td style={{ padding: `${pyV}px 6px`, borderRight: `1px solid ${M.divider}`, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: M.textD, textAlign: 'center', position: 'relative', height: rowHeights[row[codeKey]] || RH_PRESETS[rowHeightMode]?.rowH || undefined, verticalAlign: 'middle' }}>
          {String(rowIdx + 1).padStart(2, '0')}
          <div
            onMouseDown={e => startRowResize(e, row[codeKey], rowHeights[row[codeKey]] || RH_PRESETS[rowHeightMode]?.rowH || pyV * 2 + 16)}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, cursor: 'row-resize', zIndex: 2, background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          />
        </td>
        {/* Data cells */}
        {visCols.map((f, fi) => {
          const val = row[f.key];
          const hasVal = val !== undefined && val !== null && val !== '';
          return (
            <td key={f.key}
              onClick={() => openEdit(row)}
              style={{ padding: `${f.thumb ? 3 : pyV - 1}px 8px`, borderRight: `1px solid ${M.divider}`, maxWidth: 240, overflow: 'hidden', cursor: 'pointer', verticalAlign: 'middle' }}
            >
              {f.badge ? (
                (() => {
                  const sc = STATUS_COLORS[val] || fallbackStatus;
                  return <span style={{ fontSize: fz - 2, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>{hasVal ? String(val) : '\u2014'}</span>;
                })()
              ) : f.thumb && hasVal ? (
                (() => {
                  const tsz = RH_PRESETS[rowHeightMode]?.thumb || 36;
                  const br = tsz <= 24 ? 3 : tsz <= 50 ? 4 : 6;
                  if (f.multi) {
                    return (
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                        {String(val).split('|').map(s => s.trim()).filter(Boolean).slice(0, 3).map((link, li) => {
                          const src = driveThumbUrl(link);
                          return src ? (
                            <a key={li} href={link} target="_blank" rel="noreferrer" title={link}>
                              <img src={src} alt="" style={{ width: tsz, height: tsz, objectFit: 'cover', borderRadius: br, border: '1px solid #e2e8f0', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                            </a>
                          ) : null;
                        })}
                      </div>
                    );
                  }
                  const src = driveThumbUrl(String(val));
                  return src ? (
                    <a href={String(val)} target="_blank" rel="noreferrer" title={String(val)} onClick={e => e.stopPropagation()}>
                      <img src={src} alt="" style={{ width: tsz, height: tsz, objectFit: 'cover', borderRadius: br, border: '1px solid #e2e8f0', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    </a>
                  ) : null;
                })()
              ) : hasVal ? (
                <span style={{ fontSize: fz - 2, color: fi === 0 ? A.a : M.textA, fontWeight: fi === 0 ? 700 : 400, fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {String(val)}
                </span>
              ) : (
                <span style={{ fontSize: fz - 3, color: M.textD, fontStyle: 'italic' }}>
                  {f.required ? '\u26A0 required' : '\u2014'}
                </span>
              )}
            </td>
          );
        })}
        {/* Actions */}
        <td style={{ padding: `${pyV}px 6px`, textAlign: 'center', whiteSpace: 'nowrap' }}>
          <button onClick={e => { e.stopPropagation(); openEdit(row); }} style={{ fontSize: 9, fontWeight: 700, color: A.a, background: A.al, border: 'none', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontFamily: uff, marginRight: 3 }}>Edit</button>
          <button onClick={e => { e.stopPropagation(); handleDelete(row); }} style={{ fontSize: 9, fontWeight: 700, color: M.textD, background: M.surfMid, border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', fontFamily: uff }}>{'\u2715'}</button>
        </td>
      </tr>
    );
  };

  // ── 3-way view mode switcher component ──
  const ViewModeSwitcher = () => (
    <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden', border: `1.5px solid ${M.divider}`, flexShrink: 0 }}>
      {[
        { id: 'sheet', icon: '\uD83D\uDCCA', label: 'Sheet' },
        { id: 'table', icon: '\u229F', label: 'Table' },
        { id: 'split', icon: '\u25EB', label: 'Split' },
      ].map(v => (
        <button key={v.id} onClick={() => setViewMode(v.id)} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '5px 11px', border: 'none', cursor: 'pointer',
          background: viewMode === v.id ? '#1e293b' : M.surfMid,
          color: viewMode === v.id ? '#fff' : M.textB,
          fontSize: fz - 3, fontWeight: 900, transition: 'all .15s',
          borderRight: v.id !== 'split' ? `1px solid ${M.divider}` : 'none',
          fontFamily: uff }}>
          <span style={{ fontSize: 12 }}>{v.icon}</span>{v.label}
        </button>
      ))}
    </div>
  );

  // =====================================================================
  //  RENDER
  // =====================================================================
  const isV2Mode = viewMode === 'table' || viewMode === 'split';

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .v2trow:hover td { background: #f5f8ff !important; }
      `}</style>

      {/* ════════════════════════════════════════════════════════════
          TABLE / SPLIT MODE (V2 UI)
         ════════════════════════════════════════════════════════════ */}
      {isV2Mode && (
        <>
          {/* V2 Views Bar */}
          <div style={{ background: M.surfHigh, borderBottom: `2px solid ${M.divider}`,
            flexShrink: 0, padding: '0 12px',
            display: 'flex', alignItems: 'center', gap: 4,
            minHeight: 40, overflowX: 'auto' }}>

            <span style={{ fontSize: 8, fontWeight: 900, color: M.textD, letterSpacing: 1,
              textTransform: 'uppercase', flexShrink: 0, marginRight: 4, fontFamily: uff }}>VIEWS:</span>

            {allViewsV2.map(v => {
              const isActive = sysViewId === v.id;
              return (
                <button key={v.id}
                  onClick={() => setSysViewId(isActive ? 'all' : v.id)}
                  title={v.desc ? `${v.name} \u2014 ${v.desc}` : v.name}
                  style={{ display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px', borderRadius: 8, flexShrink: 0, cursor: 'pointer',
                    transition: 'all .15s', fontFamily: uff,
                    border: `1.5px solid ${isActive ? v.color : M.divider}`,
                    background: isActive ? v.color + '18' : M.surfMid }}>
                  <span style={{ fontSize: 11 }}>{v.icon}</span>
                  <span style={{ fontSize: 9.5, fontWeight: isActive ? 900 : 700,
                    color: isActive ? v.color : M.textB, whiteSpace: 'nowrap' }}>{v.name}</span>
                  {isActive ? (
                    <>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 6,
                        background: v.color + '22', color: v.color, fontWeight: 900 }}>
                        {visCols.length}c
                      </span>
                    </>
                  ) : v.isSystem ? (
                    <span style={{ fontSize: 7, padding: '0 3px', borderRadius: 3,
                      background: M.surfMid, color: M.textD, fontWeight: 900 }}>SYS</span>
                  ) : null}
                </button>
              );
            })}

            <div style={{ width: 1, height: 22, background: M.divider, flexShrink: 0, margin: '0 3px' }} />

            {/* Filter */}
            <button onClick={() => setShowFiltPnl(true)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
              borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: uff,
              border: `1.5px solid ${hasColFilter ? A.a : M.divider}`,
              background: hasColFilter ? A.al : M.surfMid,
              color: hasColFilter ? A.a : M.textB,
              fontSize: 9.5, fontWeight: 800, transition: 'all .15s' }}>
              {'\u229F'} Filter
              {hasColFilter && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 8,
                background: A.a, color: '#fff', fontWeight: 900 }}>ON</span>}
            </button>

            {/* Sort */}
            <button onClick={() => setShowSortDrawerV2(true)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
              borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: uff,
              border: `1.5px solid ${sorts.length > 0 ? '#1e293b' : M.divider}`,
              background: sorts.length > 0 ? '#1e293b' : M.surfMid,
              color: sorts.length > 0 ? '#fff' : M.textB,
              fontSize: 9.5, fontWeight: 800, transition: 'all .15s' }}>
              {'\u2195'} Sort
              {sorts.length > 0 && <span style={{ fontSize: 7.5, padding: '1px 5px', borderRadius: 8,
                background: 'rgba(255,255,255,.25)', color: '#fff', fontWeight: 900 }}>{sorts.length}</span>}
            </button>

            <div style={{ flex: 1 }} />

            {/* + New View */}
            <button onClick={() => { setEditingViewV2(null); setShowNewViewV2(true); }} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
              borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: uff,
              border: `1.5px dashed ${A.a}`,
              background: A.al, color: A.a,
              fontSize: 9.5, fontWeight: 900, transition: 'all .15s' }}>
              + New View
            </button>

            {/* Manage */}
            <button onClick={() => setShowManageV2(true)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
              borderRadius: 8, cursor: 'pointer', flexShrink: 0, fontFamily: uff,
              border: `1.5px solid ${M.divider}`,
              background: M.surfMid, color: M.textB,
              fontSize: 9.5, fontWeight: 800, transition: 'all .15s' }}>
              Manage
            </button>
          </div>

          {/* V2 Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px', background: M.surfHigh,
            borderBottom: `1.5px solid ${M.divider}`, flexShrink: 0 }}>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: M.textD, pointerEvents: 'none' }}>{'\u2315'}</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${rows.length} records\u2026`}
                style={{ padding: '6px 28px', border: `1.5px solid ${M.divider}`,
                  borderRadius: 7, fontSize: 11, outline: 'none', width: 210,
                  background: M.inputBg, fontFamily: uff, color: M.textA }}
                onFocus={e => e.target.style.borderColor = A.a}
                onBlur={e => e.target.style.borderColor = M.divider} />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8,
                  top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'none', color: M.textD, cursor: 'pointer', fontSize: 13 }}>{'\u00D7'}</button>
              )}
            </div>

            {/* Column toggle */}
            <button onClick={() => setShowCM(p => !p)} style={{ padding: '5px 10px',
              border: `1.5px solid ${showCM ? '#6c3fc5' : M.divider}`,
              borderRadius: 6, background: showCM ? '#f0eeff' : M.surfMid,
              color: showCM ? '#6c3fc5' : M.textB,
              fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>
              {'\u229F'} Columns ({visCols.length})
            </button>

            <div style={{ flex: 1 }} />

            <span style={{ fontSize: 9, color: M.textD, fontWeight: 700, fontFamily: uff }}>
              {sorted.length}<span style={{ color: M.textD }}>/{rows.length}</span> records
            </span>

            {/* 3-way switcher */}
            <ViewModeSwitcher />

            {/* Export */}
            <button onClick={() => setShowExportV2(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
              border: `1.5px solid ${M.divider}`, borderRadius: 7,
              background: M.surfMid, color: M.textB,
              fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: uff,
              transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#15803d'; e.currentTarget.style.color = '#15803d'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = M.divider; e.currentTarget.style.color = M.textB; }}>
              {'\u2B07'} Export
            </button>

            {/* Add New */}
            <button onClick={openAdd} style={{ padding: '5px 14px', background: CC_RED, border: 'none', borderRadius: 6, fontSize: fz - 2, fontWeight: 900, color: '#fff', cursor: 'pointer', fontFamily: uff, flexShrink: 0 }}>
              + Add New
            </button>
          </div>

          {/* V2 active filter chips */}
          {hasColFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              padding: '5px 12px', borderBottom: `1px solid ${M.divider}`,
              background: A.al, flexShrink: 0 }}>
              <span style={{ fontSize: 8.5, fontWeight: 900, color: A.a, fontFamily: uff }}>{'\u229F'} Active filters:</span>
              {Object.entries(colFilters).filter(([, v]) => v && v !== 'all').map(([k, v]) => {
                const col = allFields.find(c => c.key === k);
                return (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 8.5, padding: '2px 8px', borderRadius: 8,
                    background: A.a + '18', color: A.a, fontWeight: 700, fontFamily: uff }}>
                    <b>{col?.header || k}</b>: {v}
                    <button onClick={() => setColFilters(p => ({ ...p, [k]: 'all' }))} style={{
                      border: 'none', background: 'none', color: A.a,
                      cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}>{'\u00D7'}</button>
                  </span>
                );
              })}
              <button onClick={() => setColFilters({})} style={{ padding: '2px 8px', border: 'none',
                background: 'transparent', color: M.textD, fontSize: 8.5, cursor: 'pointer', fontWeight: 700, fontFamily: uff }}>
                Clear all
              </button>
            </div>
          )}

          {/* V2 Column Pills */}
          {showCM && (
            <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#6c3fc5', fontFamily: uff, marginRight: 4 }}>{'\u2AFF'} COLUMNS:</span>
              {allFields.map(f => {
                const isHidden = hiddenC.includes(f.key);
                return (
                  <button key={f.key}
                    onClick={() => setHiddenC(prev => isHidden ? prev.filter(k => k !== f.key) : [...prev, f.key])}
                    style={{ padding: '2px 9px', border: `1px solid ${isHidden ? M.inputBd : '#6c3fc5'}`, borderRadius: 12, background: isHidden ? M.surfMid : '#f0eeff', color: isHidden ? M.textD : '#6c3fc5', fontSize: 9, fontWeight: isHidden ? 400 : 700, cursor: 'pointer', fontFamily: uff }}>
                    {isHidden ? '\u25CB ' : '\u25CF '}{f.header}
                  </button>
                );
              })}
              <button onClick={() => setHiddenC([])} style={{ fontSize: 8.5, color: M.textD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff }}>Show all</button>
            </div>
          )}

          {/* V2 Sort strip */}
          {sorts.length > 0 && (
            <div style={{ background: 'rgba(124,58,237,.06)', borderBottom: '1px solid rgba(124,58,237,.2)', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: uff }}>SORTED BY:</span>
              {sorts.map((s, i) => {
                const f = allFields.find(fl => fl.key === s.col);
                return (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: M.surfHigh, border: '1px solid rgba(124,58,237,.3)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: '#7C3AED', fontFamily: uff }}>
                    {f?.header || s.col} {s.dir === 'asc' ? '\u2191' : '\u2193'}
                    <span onClick={() => setSorts(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1 }}>{'\u00D7'}</span>
                  </span>
                );
              })}
              <button onClick={() => setSorts([])} style={{ fontSize: 9, color: M.textD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, marginLeft: 4 }}>Clear all</button>
            </div>
          )}

          {/* V2 Content: Table or Split */}
          {viewMode === 'split' ? (
            <SplitViewPanel sorted={sorted} visCols={visCols} schema={schema} codeKey={codeKey}
              onEdit={openEdit} M={M} A={A} uff={uff} fz={fz} />
          ) : (
            /* V2 Table View */
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
                {fetchError ? (
                  <div style={{ margin: 16, textAlign: 'center', padding: 60, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>{'\u26A0\uFE0F'}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 6, fontFamily: uff }}>Failed to load data</div>
                    <div style={{ fontSize: 11, color: '#b91c1c', fontFamily: uff }}>{fetchError}</div>
                  </div>
                ) : loading ? (
                  <div style={{ textAlign: 'center', padding: 60, color: M.textD, fontSize: 13, fontFamily: uff }}>Loading records\u2026</div>
                ) : (
                  <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed',
                    minWidth: visCols.reduce((a, c) => a + (c.w === '1fr' ? 200 : (parseInt(c.w) || 140)), 0) + 76 }}>
                    <colgroup>
                      {visCols.map(c => <col key={c.key} style={{ width: c.w === '1fr' ? 200 : (parseInt(c.w) || 140) }} />)}
                      <col style={{ width: 76 }} />
                    </colgroup>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr style={{ background: '#1e293b' }}>
                        {visCols.map(c => {
                          const activeSort = sorts.find(s => s.col === c.key);
                          const sortIdx = sorts.findIndex(s => s.col === c.key);
                          return (
                            <th key={c.key}
                              onClick={() => handleHeaderClick(c.key)}
                              style={{ padding: '8px 9px', textAlign: 'left',
                                fontSize: 8.5, fontWeight: 900,
                                color: c.auto ? '#a78bfa' : (activeSort ? A.a : '#94a3b8'),
                                borderRight: `1px solid #253347`,
                                whiteSpace: 'nowrap', letterSpacing: .4, textTransform: 'uppercase',
                                background: activeSort ? '#253347' : c.auto ? '#1e1a35' : 'transparent',
                                cursor: 'pointer', userSelect: 'none', fontFamily: uff }}>
                              {c.header}
                              {activeSort && sortIdx === 0 && (
                                <span style={{ marginLeft: 3, color: A.a }}>
                                  {activeSort.dir === 'asc' ? '\u2191' : '\u2193'}
                                </span>
                              )}
                              {sortIdx > 0 && (
                                <span style={{ marginLeft: 2, fontSize: 7, color: '#64748b',
                                  verticalAlign: 'super' }}>
                                  {sortIdx + 1}
                                </span>
                              )}
                            </th>
                          );
                        })}
                        <th style={{ padding: '8px 9px', fontSize: 8.5, fontWeight: 900,
                          color: '#94a3b8', textAlign: 'center',
                          textTransform: 'uppercase', letterSpacing: .4, fontFamily: uff }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((row, ri) => (
                        <tr key={row[codeKey] || ri} className="v2trow"
                          onClick={() => setV2DetailRow(row)}
                          style={{ cursor: 'pointer', transition: 'background .08s',
                            borderLeft: '3px solid transparent',
                            borderBottom: '1px solid #f1f4f9' }}>
                          {visCols.map(c => (
                            <td key={c.key} style={{ padding: c.thumb || c.special === 'thumb' || c.special === 'sketch' ? '5px 8px' : '4px 9px',
                              overflow: 'hidden', verticalAlign: 'middle',
                              background: c.auto ? '#faf7ff' : 'transparent',
                              borderRight: '1px solid #f5f7fb' }}>
                              <V2CellVal col={c} row={row} M={M} A={A} />
                            </td>
                          ))}
                          <td style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle',
                            background: ri % 2 === 0 ? M.surfHigh : M.surfMid }}>
                            <button onClick={e => { e.stopPropagation(); openEdit(row); }} style={{
                              padding: '3px 11px',
                              border: `1px solid ${A.a}`, borderRadius: 5,
                              background: A.al, color: A.a,
                              fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>{'\u270E'} Edit</button>
                          </td>
                        </tr>
                      ))}
                      {sorted.length === 0 && (
                        <tr><td colSpan={visCols.length + 1} style={{ padding: 48,
                          textAlign: 'center', color: M.textD, fontSize: 12, fontFamily: uff }}>
                          {rows.length === 0 ? "No records yet. Click '+ Add New' to create one." : `No results for "${search}"`}
                          {(search || hasColFilter) && (
                            <button onClick={() => { setSearch(''); setColFilters({}); }} style={{
                              marginLeft: 10, padding: '4px 12px',
                              border: `1px solid ${A.a}`, borderRadius: 6,
                              background: A.al, color: A.a,
                              fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>Clear all</button>
                          )}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Add / Edit form panel (shared across all modes) */}
              {showAddForm && (
                <div style={{ width: 380, background: M.surfHigh, borderLeft: `1px solid ${M.divider}`, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,.12)', flexShrink: 0 }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{sheet.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: uff }}>{editRow ? 'Edit Record' : 'New Record'}</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: M.textA, fontFamily: uff }}>{editRow ? `Edit ${editRow[codeKey]}` : sheet.name}</div>
                    </div>
                    <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }} style={{ background: M.surfMid, border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: M.textB, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'\u2715'}</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {formFields.map(f => {
                      const isAuto = f.auto && !editRow;
                      const baseStyle = { width: '100%', padding: '8px 12px', border: `1px solid ${isAuto ? M.bg : M.inputBd}`, borderRadius: 7, fontSize: fz - 1, fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff, background: isAuto ? M.surfMid : M.inputBg, color: isAuto ? M.textD : M.textA, outline: 'none', boxSizing: 'border-box' };
                      let input;
                      if (f.type === 'select' && f.options) {
                        input = (
                          <select disabled={isAuto} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, cursor: isAuto ? 'default' : 'pointer' }}>
                            <option value="">{'\u2014'} Select {'\u2014'}</option>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        );
                      } else if (f.type === 'textarea') {
                        input = <textarea rows={3} disabled={isAuto} placeholder={`Enter ${f.header}\u2026`} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, resize: 'vertical', minHeight: 60 }} />;
                      } else if (f.type === 'date') {
                        input = <input type="date" disabled={isAuto} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                      } else if (f.type === 'number') {
                        input = <input type="number" disabled={isAuto} placeholder={`Enter ${f.header}\u2026`} value={formData[f.key] ?? ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                      } else {
                        input = <input type="text" disabled={isAuto} placeholder={`Enter ${f.header}\u2026`} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                      }
                      return (
                        <div key={f.key} style={{ marginBottom: 14 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 900, color: M.textC, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, fontFamily: uff }}>
                            {f.header}
                            {f.required && <span style={{ color: '#ef4444', fontSize: 11, lineHeight: 1 }}>*</span>}
                            {f.auto && <span style={{ color: M.textD, fontWeight: 600, textTransform: 'none', letterSpacing: 0, fontSize: 8 }}>(auto)</span>}
                          </label>
                          {input}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: '14px 20px', borderTop: `1px solid ${M.divider}`, display: 'flex', gap: 8 }}>
                    <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }} style={{ flex: 1, padding: '9px', background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: M.textB, cursor: 'pointer', fontFamily: uff }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '9px', background: saving ? M.textD : A.a, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 900, color: '#fff', cursor: saving ? 'default' : 'pointer', fontFamily: uff }}>
                      {saving ? 'Saving\u2026' : editRow ? 'Update Record' : 'Save Record'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* V2 Status bar */}
          <div style={{ background: M.surfMid, borderTop: `1px solid ${M.divider}`, padding: '3px 16px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: M.textD, fontFamily: uff }}>
              {sorted.length} records {'\u00B7'} {visCols.length} cols
              {sorts.length > 0 && <> {'\u00B7'} sorted by <b style={{ color: M.textB }}>{allFields.find(f => f.key === sorts[0]?.col)?.header}</b> {sorts[0]?.dir === 'asc' ? '\u2191' : '\u2193'}</>}
              {sorts.length > 1 && <span style={{ color: M.textD }}> +{sorts.length - 1} more</span>}
            </span>
            {sysViewId !== 'all' && (
              <span style={{ fontSize: 8.5, padding: '2px 8px', borderRadius: 8,
                background: activeViewV2.color + '18', color: activeViewV2.color, fontWeight: 800, fontFamily: uff }}>
                {activeViewV2.icon} {activeViewV2.name}
              </span>
            )}
            {hasColFilter && <span style={{ fontSize: 8.5, color: A.a, fontWeight: 800, fontFamily: uff }}>{'\u229F'} Filtered</span>}
            <div style={{ flex: 1, textAlign: 'right', fontSize: 8.5, color: M.textD, fontFamily: "'IBM Plex Mono',monospace" }}>
              {sheet.name} {'\u00B7'} FILE {fileKey}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          SHEET MODE (existing full-featured table)
         ════════════════════════════════════════════════════════════ */}
      {viewMode === 'sheet' && (
        <>
          {/* ── Sheet Toolbar ── */}
          <div style={{ background: M.surfMid, borderBottom: `1px solid ${M.divider}`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 7, minHeight: 44, flexShrink: 0, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.5, fontFamily: uff, flexShrink: 0 }}>{'\uD83D\uDCCA'} RECORDS</span>
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: M.surfHigh, color: M.textC, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>
              {sheetCounts?.[sheet.key] ?? rows.length}
            </span>

            {/* Advanced Filter + Sort buttons */}
            <div style={{ width: 1, height: 16, background: M.divider, flexShrink: 0 }} />
            <button onClick={() => { const op = !showAdvFilters; setShowAdvFilters(op); setShowAdvSorts(false); if (op && advFilters.length === 0) addAdvFilter(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: `1px solid ${showAdvFilters || activeAdvFilterCount > 0 ? A.a : M.inputBd}`, borderRadius: 6, background: showAdvFilters || activeAdvFilterCount > 0 ? A.al : M.inputBg, color: showAdvFilters || activeAdvFilterCount > 0 ? A.a : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {'\uFF0B'} Filter
              {activeAdvFilterCount > 0 && <span style={{ background: A.a, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 8.5, fontWeight: 900, lineHeight: 1 }}>{activeAdvFilterCount}</span>}
            </button>
            <button onClick={() => { const op = !showAdvSorts; setShowAdvSorts(op); setShowAdvFilters(false); if (op && advSorts.length === 0) addAdvSort(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: `1px solid ${showAdvSorts || isAdvSortActive ? '#7C3AED' : M.inputBd}`, borderRadius: 6, background: showAdvSorts || isAdvSortActive ? 'rgba(124,58,237,.1)' : M.inputBg, color: showAdvSorts || isAdvSortActive ? '#7C3AED' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {'\u2191'} Sort
              {isAdvSortActive && <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 8.5, fontWeight: 900, lineHeight: 1 }}>{advSorts.length}</span>}
            </button>
            {(activeAdvFilterCount > 0 || isAdvSortActive) && (
              <button onClick={() => { setAdvFilters([]); setAdvSorts([]); setShowAdvFilters(false); setShowAdvSorts(false); }}
                style={{ padding: '5px 9px', border: '1px solid #fecaca', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>{'\u2715'} Reset</button>
            )}

            <div style={{ flex: 1, minWidth: 8 }} />

            {/* Search */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: M.textD }}>{'\uD83D\uDD0D'}</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search\u2026"
                style={{ padding: '5px 10px 5px 28px', border: `1px solid ${M.divider}`, borderRadius: 6, fontSize: fz - 2, fontFamily: uff, width: 130, outline: 'none', color: M.textA, background: M.inputBg }} />
            </div>

            {/* Sort */}
            <button onClick={() => setShowSortPanel(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: `1px solid ${sorts.length > 0 ? '#7C3AED' : M.inputBd}`, borderRadius: 6, background: sorts.length > 0 ? 'rgba(124,58,237,.1)' : M.inputBg, color: sorts.length > 0 ? '#7C3AED' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {'\u21C5'} Sort
              {sorts.length > 0 && <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 8.5, fontWeight: 900, lineHeight: 1 }}>{sorts.length}</span>}
            </button>

            {/* Filter panel toggle */}
            <button onClick={() => setShowFP(p => !p)} style={{ padding: '5px 11px', border: `1px solid ${showFP || Object.values(filters).some(v => v) ? '#7C3AED' : M.inputBd}`, borderRadius: 6, background: showFP || Object.values(filters).some(v => v) ? 'rgba(124,58,237,.1)' : M.inputBg, color: showFP || Object.values(filters).some(v => v) ? '#7C3AED' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {'\u26A1'} Filter
            </button>

            {/* Columns */}
            <button
              onClick={() => setShowCM(p => !p)}
              onContextMenu={e => { e.preventDefault(); setShowColPanel(true); }}
              title="Click to toggle column pills \u00B7 Right-click to open column panel"
              style={{ padding: '5px 11px', border: `1px solid ${hiddenC.length > 0 || showCM ? '#7C3AED' : M.inputBd}`, borderRadius: 6, background: hiddenC.length > 0 || showCM ? 'rgba(124,58,237,.1)' : M.inputBg, color: hiddenC.length > 0 || showCM ? '#7C3AED' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {colLabel}
            </button>

            {/* Row Height picker */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowRowHeightMenu(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: `1px solid ${showRowHeightMenu || rowHeightMode !== 'short' ? '#0891B2' : M.inputBd}`, borderRadius: 6, background: showRowHeightMenu || rowHeightMode !== 'short' ? 'rgba(8,145,178,.1)' : M.inputBg, color: showRowHeightMenu || rowHeightMode !== 'short' ? '#0891B2' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap' }}
              >
                {'\u2195'} {RH_PRESETS[rowHeightMode]?.label || 'Row Height'}
              </button>
              {showRowHeightMenu && (
                <>
                  <div onClick={() => setShowRowHeightMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 300 }} />
                  <div style={{ position: 'absolute', top: 36, left: 0, zIndex: 301, background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.18)', width: 200, padding: '12px 0 8px', overflow: 'hidden' }}>
                    <div style={{ padding: '0 14px 10px', borderBottom: `1px solid ${M.divider}` }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: M.textA, fontFamily: uff, letterSpacing: 0.4, textTransform: 'uppercase' }}>Row Height</div>
                      <div style={{ fontSize: 9, color: M.textD, fontFamily: uff, marginTop: 2 }}>Controls thumbnail preview size</div>
                    </div>
                    {Object.entries(RH_PRESETS).map(([key, preset]) => {
                      const isActive = rowHeightMode === key;
                      const swatchH = key === 'short' ? 6 : key === 'medium' ? 14 : key === 'tall' ? 22 : 30;
                      return (
                        <div key={key}
                          onClick={() => { setRowHeightMode(key); setRowHeights({}); localStorage.setItem(`${fileKey}_rec_rhMode`, key); localStorage.removeItem(`${fileKey}_rec_rowH`); setShowRowHeightMenu(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', cursor: 'pointer', background: isActive ? 'rgba(8,145,178,.08)' : 'transparent' }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = M.hoverBg; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ width: 36, height: 30, borderRadius: 5, border: `1.5px solid ${isActive ? '#0891B2' : M.divider}`, background: M.bg, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 3, flexShrink: 0, overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: swatchH, borderRadius: 2, background: isActive ? '#0891B2' : M.surfMid }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? '#0891B2' : M.textA, fontFamily: uff }}>{preset.label}</div>
                            <div style={{ fontSize: 9, color: M.textD, fontFamily: uff }}>Thumb: {preset.thumb}px</div>
                          </div>
                          {isActive && <span style={{ fontSize: 13, color: '#0891B2' }}>{'\u2713'}</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Group by select */}
            <select value={groupBy || ''} onChange={e => { setGroupBy(e.target.value || null); setSubGroupBy(null); }}
              style={{ padding: '4px 7px', border: `1px solid ${groupBy ? '#f59e0b' : M.inputBd}`, borderRadius: 6, background: groupBy ? 'rgba(245,158,11,.1)' : M.inputBg, color: groupBy ? '#f59e0b' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, outline: 'none', flexShrink: 0 }}>
              <option value="">{'\u229E'} Group by\u2026</option>
              {allFields.map(f => <option key={f.key} value={f.key}>{f.header}</option>)}
            </select>

            {/* Sub-group select */}
            {groupBy && (
              <select value={subGroupBy || ''} onChange={e => setSubGroupBy(e.target.value || null)}
                style={{ padding: '4px 7px', border: `1px solid ${subGroupBy ? '#f59e0b' : M.inputBd}`, borderRadius: 6, background: subGroupBy ? 'rgba(245,158,11,.1)' : M.inputBg, color: subGroupBy ? '#f59e0b' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, outline: 'none', flexShrink: 0 }}>
                <option value="">{'\u21B3'} Sub-group\u2026</option>
                {allFields.filter(f => f.key !== groupBy).map(f => <option key={f.key} value={f.key}>{f.header}</option>)}
              </select>
            )}

            {/* 3-way view mode switcher */}
            <ViewModeSwitcher />

            {/* Export dropdown */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setShowExportMenu(p => !p)} style={{ padding: '5px 11px', border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap' }}>
                {'\u2193'} Export {'\u25BE'}
              </button>
              {showExportMenu && (
                <>
                  <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
                  <div style={{ position: 'absolute', top: 36, right: 0, zIndex: 201, background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.15)', width: 155, overflow: 'hidden' }}>
                    {[
                      { icon: '\uD83D\uDCC4', label: 'PDF' },
                      { icon: '\uD83D\uDCCA', label: 'Excel (.xlsx)' },
                      { icon: '\uD83D\uDFE2', label: 'Google Sheet' },
                      { icon: '\uD83D\uDDA8', label: 'Print' },
                    ].map(opt => (
                      <button key={opt.label}
                        onClick={() => { setShowExportMenu(false); showToast(`Export as ${opt.label} \u2014 coming soon`, 'info'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: M.surfHigh, color: M.textA, fontSize: fz - 3, fontWeight: 700, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = M.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = M.surfHigh}
                      >
                        <span>{opt.icon}</span><span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Add New */}
            <button onClick={openAdd} style={{ padding: '5px 14px', background: CC_RED, border: 'none', borderRadius: 6, fontSize: fz - 2, fontWeight: 900, color: '#fff', cursor: 'pointer', fontFamily: uff, flexShrink: 0 }}>
              + Add New
            </button>
          </div>

          {/* Sheet: sort strip */}
          {sorts.length > 0 && (
            <div style={{ background: 'rgba(124,58,237,.06)', borderBottom: '1px solid rgba(124,58,237,.2)', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: uff }}>SORTED BY:</span>
              {sorts.map((s, i) => {
                const f = allFields.find(fl => fl.key === s.col);
                return (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: M.surfHigh, border: '1px solid rgba(124,58,237,.3)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: '#7C3AED', fontFamily: uff }}>
                    {f?.header || s.col} {s.dir === 'asc' ? '\u2191' : '\u2193'}
                    <span onClick={() => setSorts(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1 }}>{'\u00D7'}</span>
                  </span>
                );
              })}
              <button onClick={() => setSorts([])} style={{ fontSize: 9, color: M.textD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, marginLeft: 4 }}>Clear all</button>
            </div>
          )}

          {/* Sheet: group strip */}
          {groupBy && (
            <div style={{ background: 'rgba(245,158,11,.06)', borderBottom: '1px solid rgba(245,158,11,.2)', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', fontFamily: uff }}>GROUPED BY:</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: M.textA, fontFamily: uff }}>{allFields.find(f => f.key === groupBy)?.header || groupBy}</span>
              {subGroupBy && (
                <>
                  <span style={{ fontSize: 9, color: M.textD, fontFamily: uff }}>then by</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M.textA, fontFamily: uff }}>{allFields.find(f => f.key === subGroupBy)?.header || subGroupBy}</span>
                </>
              )}
              <button onClick={() => { setGroupBy(null); setSubGroupBy(null); }} style={{ fontSize: 9, color: '#f59e0b', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, marginLeft: 4 }}>{'\u00D7'} Clear</button>
            </div>
          )}

          {/* Sheet: Inline Filter Panel */}
          {showFP && (
            <div style={{ background: M.surfHigh, borderBottom: '1px solid rgba(124,58,237,.2)', padding: '6px 16px', display: 'flex', alignItems: 'flex-end', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: uff, marginRight: 4, paddingBottom: 2 }}>{'\uD83D\uDD0D'} FILTERS:</span>
              {visCols.map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 7.5, fontWeight: 900, color: M.textD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.header}</span>
                  <input value={filters[f.key] || ''} onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder="Filter\u2026"
                    style={{ width: 88, padding: '3px 6px', border: `1px solid ${filters[f.key] ? '#7C3AED' : M.inputBd}`, borderRadius: 4, fontSize: fz - 3, fontFamily: uff, outline: 'none', background: M.inputBg, color: M.textA }} />
                </div>
              ))}
              <button onClick={() => setFilters({})} style={{ fontSize: 8.5, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, paddingBottom: 4 }}>{'\u00D7'} Clear</button>
            </div>
          )}

          {/* Sheet: Advanced Filter Panel */}
          {showAdvFilters && (
            <div style={{ padding: '10px 14px 12px', borderBottom: `1px solid ${M.divider}`, background: M.surfHigh, flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {advFilters.map((fil, fi) => {
                  const f = schema.find(x => x.key === fil.field);
                  const fType = recAdvFieldType(f);
                  const ops = REC_FILTER_OPS[fType] || REC_FILTER_OPS.txt;
                  const catOpts = fType === 'cat' && f?.options ? f.options : null;
                  const isAct = fil.value !== '';
                  const ctrlSel = { fontSize: 10, border: `1px solid ${M.divider}`, borderRadius: 5, padding: '3px 7px', background: M.inputBg, color: M.textA, cursor: 'pointer', outline: 'none', fontFamily: uff };
                  return (
                    <div key={fil.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, color: M.textD, minWidth: 34, textAlign: 'right', fontWeight: 600, fontFamily: uff }}>{fi === 0 ? 'Where' : 'And'}</span>
                      <select value={fil.field} onChange={e => updateAdvFilter(fil.id, { field: e.target.value })}
                        style={{ ...ctrlSel, fontWeight: 700, color: '#0e7490', borderColor: '#0891B270', background: '#f0fdfa' }}>
                        {allFields.map(fd => <option key={fd.key} value={fd.key}>{fd.header}</option>)}
                      </select>
                      <select value={fil.op} onChange={e => updateAdvFilter(fil.id, { op: e.target.value })} style={ctrlSel}>
                        {ops.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                      {fType === 'cat' && catOpts ? (
                        <select value={fil.value} onChange={e => updateAdvFilter(fil.id, { value: e.target.value })}
                          style={{ ...ctrlSel, minWidth: 110, fontWeight: 700, borderColor: isAct ? '#0891B270' : M.divider, color: isAct ? '#0e7490' : M.textA }}>
                          <option value="">Select value\u2026</option>
                          {catOpts.map(v => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
                        </select>
                      ) : (
                        <input value={fil.value} onChange={e => updateAdvFilter(fil.id, { value: e.target.value })}
                          placeholder={fType === 'num' ? 'Enter number\u2026' : 'Enter text\u2026'}
                          type={fType === 'num' ? 'number' : 'text'}
                          style={{ ...ctrlSel, minWidth: 110, fontWeight: 700, borderColor: isAct ? '#0891B270' : M.divider, color: isAct ? '#0e7490' : M.textA }} />
                      )}
                      <button onClick={() => removeAdvFilter(fil.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 3px', fontWeight: 900 }}>{'\u00D7'}</button>
                    </div>
                  );
                })}
                <button onClick={addAdvFilter} style={{ alignSelf: 'flex-start', marginLeft: 40, border: 'none', background: 'transparent', color: '#0e7490', fontSize: 9, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: uff }}>
                  {'\uFF0B'} Add another filter
                </button>
              </div>
            </div>
          )}

          {/* Sheet: Advanced Sort Panel */}
          {showAdvSorts && (
            <div style={{ padding: '10px 14px 12px', borderBottom: `1px solid ${M.divider}`, background: M.surfHigh, flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {advSorts.map((srt, si) => {
                  const f = schema.find(x => x.key === srt.field);
                  const fType = recAdvFieldType(f);
                  const needVal = srt.mode === 'val_first' || srt.mode === 'val_last';
                  const catOpts = needVal && fType === 'cat' && f?.options ? f.options : null;
                  const ctrlSel = { fontSize: 10, border: `1px solid ${M.divider}`, borderRadius: 5, padding: '3px 7px', background: M.inputBg, color: M.textA, cursor: 'pointer', outline: 'none', fontFamily: uff };
                  return (
                    <div key={srt.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, color: M.textD, minWidth: 34, textAlign: 'right', fontWeight: 600, fontFamily: uff }}>{si === 0 ? 'Sort' : 'Then'}</span>
                      <select value={srt.field} onChange={e => updateAdvSort(srt.id, { field: e.target.value, value: '' })}
                        style={{ ...ctrlSel, fontWeight: 700, color: '#6d28d9', borderColor: '#7c3aed70', background: '#7c3aed10' }}>
                        {allFields.map(fd => <option key={fd.key} value={fd.key}>{fd.header}</option>)}
                      </select>
                      <select value={srt.mode} onChange={e => updateAdvSort(srt.id, { mode: e.target.value, value: '' })} style={ctrlSel}>
                        {REC_SORT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      {needVal && (catOpts ? (
                        <select value={srt.value} onChange={e => updateAdvSort(srt.id, { value: e.target.value })}
                          style={{ ...ctrlSel, minWidth: 120, fontWeight: 700 }}>
                          <option value="">Pick value\u2026</option>
                          {catOpts.map(v => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
                        </select>
                      ) : (
                        <input value={srt.value} onChange={e => updateAdvSort(srt.id, { value: e.target.value })}
                          placeholder="Enter value\u2026" style={{ ...ctrlSel, minWidth: 120, fontWeight: 700 }} />
                      ))}
                      {advSorts.length > 1 && (
                        <button onClick={() => removeAdvSort(srt.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 3px', fontWeight: 900 }}>{'\u00D7'}</button>
                      )}
                    </div>
                  );
                })}
                <button onClick={addAdvSort} style={{ alignSelf: 'flex-start', marginLeft: 40, border: 'none', background: 'transparent', color: '#6d28d9', fontSize: 9, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: uff }}>
                  {'\uFF0B'} Add another sort
                </button>
              </div>
            </div>
          )}

          {/* Sheet: Inline Column Pills */}
          {showCM && (
            <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: A.a, fontFamily: uff, marginRight: 4 }}>{'\u2AFF'} COLUMNS:</span>
              {allFields.map(f => {
                const isHidden = hiddenC.includes(f.key);
                return (
                  <button key={f.key}
                    onClick={() => setHiddenC(prev => isHidden ? prev.filter(k => k !== f.key) : [...prev, f.key])}
                    style={{ padding: '2px 9px', border: `1px solid ${isHidden ? M.inputBd : A.a}`, borderRadius: 12, background: isHidden ? M.surfMid : A.al, color: isHidden ? M.textD : A.a, fontSize: 9, fontWeight: isHidden ? 400 : 700, cursor: 'pointer', fontFamily: uff }}>
                    {isHidden ? '\u25CB ' : '\u25CF '}{f.header}
                  </button>
                );
              })}
              <button onClick={() => setHiddenC([])} style={{ fontSize: 8.5, color: M.textD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff }}>Show all</button>
            </div>
          )}

          {/* Sheet: Filter + Sort Summary Strip */}
          {(() => {
            const colEntries = Object.entries(filters).filter(([, v]) => v);
            const anyFilter = colEntries.length > 0 || activeAdvFilterCount > 0;
            if (!anyFilter && !isAdvSortActive) return null;
            const chipF = { display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(8,145,178,.08)', border: '1px solid rgba(8,145,178,.3)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#0e7490', fontFamily: uff, flexShrink: 0 };
            const chipS = { display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.3)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#7C3AED', fontFamily: uff, flexShrink: 0 };
            return (
              <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                {anyFilter && (
                  <>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#0891B2', fontFamily: uff, flexShrink: 0 }}>FILTERED:</span>
                    {colEntries.map(([key, val]) => {
                      const fd = allFields.find(x => x.key === key);
                      return (
                        <span key={'col_' + key} style={chipF}>
                          {fd?.header || key} <span style={{ fontWeight: 400, color: '#0891B2' }}>contains</span> <strong>{val}</strong>
                          <span onClick={() => setFilters(p => { const n = { ...p }; delete n[key]; return n; })} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>{'\u00D7'}</span>
                        </span>
                      );
                    })}
                    {advFilters.filter(f => f.value !== '').map(fil => {
                      const fd = allFields.find(x => x.key === fil.field);
                      return (
                        <span key={fil.id} style={chipF}>
                          {fd?.header || fil.field} <span style={{ fontWeight: 400, color: '#0891B2' }}>{fil.op}</span> <strong>{fil.value}</strong>
                          <span onClick={() => removeAdvFilter(fil.id)} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>{'\u00D7'}</span>
                        </span>
                      );
                    })}
                  </>
                )}
                {anyFilter && isAdvSortActive && (
                  <div style={{ width: 1, height: 14, background: M.divider, flexShrink: 0 }} />
                )}
                {isAdvSortActive && (
                  <>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: uff, flexShrink: 0 }}>SORT:</span>
                    {advSorts.map(srt => {
                      const fd = allFields.find(x => x.key === srt.field);
                      const mLabel = REC_SORT_MODES.find(m => m.value === srt.mode)?.label || srt.mode;
                      return (
                        <span key={srt.id} style={chipS}>
                          {fd?.header || srt.field} <span style={{ fontWeight: 400, color: '#9333ea' }}>{mLabel}</span>{srt.value ? <> <strong>{srt.value}</strong></> : null}
                          {advSorts.length > 1 && <span onClick={() => removeAdvSort(srt.id)} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>{'\u00D7'}</span>}
                        </span>
                      );
                    })}
                  </>
                )}
                <div style={{ flex: 1 }} />
                <button onClick={() => { setFilters({}); setAdvFilters([]); setAdvSorts([]); }} style={{ fontSize: 9, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, flexShrink: 0 }}>{'\u2715'} Clear all</button>
              </div>
            );
          })()}

          {/* Sheet: Table area */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
              {fetchError ? (
                <div style={{ margin: 16, textAlign: 'center', padding: 60, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{'\u26A0\uFE0F'}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 6, fontFamily: uff }}>Failed to load data</div>
                  <div style={{ fontSize: 11, color: '#b91c1c', marginBottom: 16, fontFamily: uff, maxWidth: 400, margin: '0 auto 16px' }}>{fetchError}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', fontFamily: uff, lineHeight: 1.6 }}>Check that GAS web app is deployed and VITE_GAS_URL is correct.</div>
                </div>
              ) : loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: M.textD, fontSize: 13, fontFamily: uff }}>Loading records\u2026</div>
              ) : (
                <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%', width: 'max-content' }}>
                  <colgroup>
                    <col style={{ width: 32 }} />
                    <col style={{ width: 36 }} />
                    {visCols.map(f => <col key={f.key} style={{ width: colW(f) }} />)}
                    <col style={{ width: 80 }} />
                  </colgroup>

                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ background: M.tblHead }}>
                      <th style={{ padding: `${pyV}px 8px`, borderBottom: `2px solid ${M.divider}`, borderRight: `1px solid ${M.divider}`, textAlign: 'center' }}>
                        <div onClick={toggleAll} style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${allSelected ? A.a : M.inputBd}`, background: allSelected ? A.a : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'all .1s' }}>
                          {allSelected && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>{'\u2713'}</span>}
                        </div>
                      </th>
                      <th style={{ padding: `${pyV}px 6px`, borderBottom: `2px solid ${M.divider}`, borderRight: `1px solid ${M.divider}`, fontSize: 9, fontWeight: 900, color: M.textD, textAlign: 'center' }}>#</th>
                      {visCols.map((f, fi) => {
                        const activeSort = sorts.find(s => s.col === f.key);
                        const isDropTgt = colDropIdx === fi && colDragIdx !== null && colDragIdx !== fi;
                        return (
                          <th key={f.key} draggable
                            onDragStart={() => onColDragStart(fi)} onDragOver={e => onColDragOver(e, fi)}
                            onDrop={() => onColDrop(fi)} onDragEnd={() => { setColDragIdx(null); setColDropIdx(null); }}
                            onClick={() => handleHeaderClick(f.key)}
                            style={{
                              padding: `${pyV}px 8px`, borderBottom: `2px solid ${M.divider}`, borderRight: `1px solid ${M.divider}`,
                              borderLeft: isDropTgt ? '3px solid #f59e0b' : undefined,
                              textAlign: 'left', cursor: 'pointer', userSelect: 'none',
                              background: activeSort ? 'rgba(124,58,237,.08)' : M.tblHead,
                              opacity: colDragIdx === fi ? 0.45 : 1, whiteSpace: 'nowrap', position: 'relative',
                            }}
                            onMouseEnter={e => { if (colDragIdx === null) e.currentTarget.style.background = M.hoverBg; }}
                            onMouseLeave={e => { if (colDragIdx === null) e.currentTarget.style.background = activeSort ? 'rgba(124,58,237,.08)' : M.tblHead; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {f.required && <span style={{ color: '#ef4444', fontSize: 8, fontWeight: 900 }}>{'\u26A0'}</span>}
                              <span style={{ fontSize: fz - 2, fontWeight: 700, color: fi === 0 ? A.a : activeSort ? '#7C3AED' : M.textA, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: colW(f) - 30 }}>{f.header}</span>
                              <span style={{ fontSize: 9, color: activeSort ? '#7C3AED' : M.textD, flexShrink: 0 }}>
                                {activeSort ? (activeSort.dir === 'asc' ? '\u2191' : '\u2193') : '\u2195'}
                              </span>
                            </div>
                            <div onMouseDown={e => startColResize(e, f.key, colW(f))} onClick={e => e.stopPropagation()}
                              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, cursor: 'col-resize', zIndex: 2, background: 'transparent' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,.35)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} />
                          </th>
                        );
                      })}
                      <th style={{ padding: `${pyV}px 6px`, borderBottom: `2px solid ${M.divider}`, fontSize: 9, fontWeight: 900, color: M.textD, textAlign: 'center' }}>ACT</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sorted.length === 0 ? (
                      <tr>
                        <td colSpan={visCols.length + 3} style={{ padding: 32, textAlign: 'center', color: M.textD, fontSize: 12, fontFamily: uff }}>
                          {rows.length === 0 ? "No records yet. Click '+ Add New' to create one." : `No results for "${search}"`}
                        </td>
                      </tr>
                    ) : renderList.map(item => {
                      if (item.type === 'group') {
                        return (
                          <tr key={item.key} style={{ background: '#1e293b' }}>
                            <td colSpan={visCols.length + 3} style={{ padding: `${pyV}px 12px`, fontWeight: 900, fontSize: fz - 2, color: '#e2e8f0', fontFamily: uff }}>
                              <span style={{ marginRight: 6 }}>{allFields.find(f => f.key === groupBy)?.header}:</span>
                              <span style={{ color: '#cbd5e1' }}>{item.value}</span>
                              <span style={{ marginLeft: 10, fontSize: 8.5, fontWeight: 900, padding: '1px 6px', borderRadius: 8, background: '#CC0000', color: '#fff' }}>{item.count}</span>
                            </td>
                          </tr>
                        );
                      }
                      if (item.type === 'subgroup') {
                        return (
                          <tr key={item.key} style={{ background: '#334155' }}>
                            <td colSpan={visCols.length + 3} style={{ padding: `${pyV}px 12px`, paddingLeft: 28, fontWeight: 700, fontSize: fz - 3, color: '#cbd5e1', fontFamily: uff }}>
                              <span style={{ marginRight: 5, color: '#94a3b8' }}>{'\u21B3'}</span>
                              <span style={{ marginRight: 6 }}>{allFields.find(f => f.key === subGroupBy)?.header}:</span>
                              <span style={{ color: '#94a3b8' }}>{item.value}</span>
                              <span style={{ marginLeft: 8, fontSize: 8.5, fontWeight: 900, padding: '1px 6px', borderRadius: 8, background: '#7C3AED', color: '#fff' }}>{item.count}</span>
                            </td>
                          </tr>
                        );
                      }
                      return renderDataRow(item.row, item.rowIdx);
                    })}
                  </tbody>

                  {/* AGG Footer */}
                  <tfoot>
                    <tr style={{ background: M.surfMid, borderTop: `2px solid ${M.divider}` }}>
                      <td style={{ padding: `${pyV}px 8px`, borderRight: `1px solid ${M.divider}`, textAlign: 'center', background: '#ede9fe' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#7C3AED' }}>{'\u03A3'}</span>
                      </td>
                      <td style={{ padding: `${pyV}px 6px`, borderRight: `1px solid ${M.divider}`, fontSize: 8, fontWeight: 900, color: '#7C3AED', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", background: '#ede9fe' }}>AGG</td>
                      {visCols.map(f => {
                        const fn = aggs[f.key];
                        const hasAgg = fn && fn !== 'none';
                        const rawVal = hasAgg ? calcAgg(fn, f.key, sorted) : null;
                        const val = hasAgg ? fmtAgg(rawVal, f, fn) : null;
                        const lbl = hasAgg ? AGG_FNS.find(a => a.id === fn)?.label : '+ Calc';
                        const col = hasAgg ? (AGG_COLORS[fn] || A.a) : M.textD;
                        return (
                          <td key={f.key} style={{ padding: `${pyV - 1}px 4px`, borderRight: `1px solid ${M.divider}` }}>
                            <button onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setAggAnchor({ col: f.key, rect }); }}
                              style={{ width: '100%', textAlign: 'left', fontSize: 8.5, fontWeight: hasAgg ? 700 : 400, color: col, background: hasAgg ? `${col}15` : 'transparent', border: `1px dashed ${hasAgg ? col : M.inputBd}`, borderRadius: 3, padding: '2px 6px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono',monospace" }}>
                              {val ? `${lbl}: ${val}` : lbl}
                            </button>
                          </td>
                        );
                      })}
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Sheet: Add / Edit form panel */}
            {showAddForm && (
              <div style={{ width: 380, background: M.surfHigh, borderLeft: `1px solid ${M.divider}`, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,.12)', flexShrink: 0 }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{sheet.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: uff }}>{editRow ? 'Edit Record' : 'New Record'}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: M.textA, fontFamily: uff }}>{editRow ? `Edit ${editRow[codeKey]}` : sheet.name}</div>
                  </div>
                  <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }} style={{ background: M.surfMid, border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: M.textB, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'\u2715'}</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                  {formFields.map(f => {
                    const isAuto = f.auto && !editRow;
                    const baseStyle = { width: '100%', padding: '8px 12px', border: `1px solid ${isAuto ? M.bg : M.inputBd}`, borderRadius: 7, fontSize: fz - 1, fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff, background: isAuto ? M.surfMid : M.inputBg, color: isAuto ? M.textD : M.textA, outline: 'none', boxSizing: 'border-box' };
                    let input;
                    if (f.type === 'select' && f.options) {
                      input = (
                        <select disabled={isAuto} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, cursor: isAuto ? 'default' : 'pointer' }}>
                          <option value="">{'\u2014'} Select {'\u2014'}</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      );
                    } else if (f.type === 'textarea') {
                      input = <textarea rows={3} disabled={isAuto} placeholder={`Enter ${f.header}\u2026`} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, resize: 'vertical', minHeight: 60 }} />;
                    } else if (f.type === 'date') {
                      input = <input type="date" disabled={isAuto} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                    } else if (f.type === 'number') {
                      input = <input type="number" disabled={isAuto} placeholder={`Enter ${f.header}\u2026`} value={formData[f.key] ?? ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                    } else {
                      input = <input type="text" disabled={isAuto} placeholder={`Enter ${f.header}\u2026`} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                    }
                    return (
                      <div key={f.key} style={{ marginBottom: 14 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 900, color: M.textC, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, fontFamily: uff }}>
                          {f.header}
                          {f.required && <span style={{ color: '#ef4444', fontSize: 11, lineHeight: 1 }}>*</span>}
                          {f.auto && <span style={{ color: M.textD, fontWeight: 600, textTransform: 'none', letterSpacing: 0, fontSize: 8 }}>(auto)</span>}
                        </label>
                        {input}
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: '14px 20px', borderTop: `1px solid ${M.divider}`, display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }} style={{ flex: 1, padding: '9px', background: M.surfMid, border: `1px solid ${M.divider}`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: M.textB, cursor: 'pointer', fontFamily: uff }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '9px', background: saving ? M.textD : A.a, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 900, color: '#fff', cursor: saving ? 'default' : 'pointer', fontFamily: uff }}>
                    {saving ? 'Saving\u2026' : editRow ? 'Update Record' : 'Save Record'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sheet: Status bar */}
          <div style={{ background: M.surfMid, borderTop: `1px solid ${M.divider}`, padding: '3px 16px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            {[
              { l: 'RECORDS',  v: rows.length },
              { l: 'FILTERED', v: filtered.length },
              { l: 'SELECTED', v: selectedRows.size },
              { l: 'SORTS',    v: sorts.length },
              { l: 'COLS',     v: `${visCols.length}/${allFields.length}` },
              { l: 'VIEW',     v: activeViewName + (viewDirty ? '*' : '') },
            ].map(s => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 7.5, fontWeight: 900, color: M.textD, letterSpacing: 1, textTransform: 'uppercase', fontFamily: uff }}>{s.l}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: M.textB, fontFamily: "'IBM Plex Mono',monospace" }}>{s.v}</span>
              </div>
            ))}
            <div style={{ flex: 1, textAlign: 'right', fontSize: 8.5, color: M.textD, fontFamily: "'IBM Plex Mono',monospace" }}>
              {sheet.name} {'\u00B7'} FILE {fileKey}
            </div>
          </div>
        </>
      )}

      {/* ── AGG DROPDOWN (sibling outside table, opens UPWARD) ── */}
      {aggAnchor && (
        <>
          <div onMouseDown={() => setAggAnchor(null)} style={{ position: 'fixed', inset: 0, zIndex: 500 }} />
          <div
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: window.innerHeight - aggAnchor.rect.top + 4,
              left: Math.max(8, Math.min(aggAnchor.rect.left, window.innerWidth - 190)),
              zIndex: 501,
              background: M.surfHigh,
              border: '1.5px solid #c4b5fd',
              borderRadius: 8,
              boxShadow: '0 -4px 24px rgba(0,0,0,.18)',
              width: 185,
              overflow: 'hidden',
            }}
          >
            {/* Dark header */}
            <div style={{ background: '#1e293b', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#e2e8f0', fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {allFields.find(f => f.key === aggAnchor.col)?.header || aggAnchor.col}
              </span>
              <span onClick={() => setAggAnchor(null)} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 12, lineHeight: 1 }}>{'\u00D7'}</span>
            </div>

            {/* Grouped options */}
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {AGG_GROUPS.map(grp => (
                <div key={grp.label}>
                  <div style={{ padding: '5px 12px 3px', fontSize: 8, fontWeight: 900, color: grp.color, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: uff, borderTop: `1px solid ${M.divider}` }}>
                    {grp.label}
                  </div>
                  {grp.items.map(fnId => {
                    const fn      = AGG_FNS.find(a => a.id === fnId);
                    const isActive = aggs[aggAnchor.col] === fnId;
                    const fnColor  = AGG_COLORS[fnId] || M.textA;
                    const colField = allFields.find(f => f.key === aggAnchor.col);
                    const rawV     = isActive ? calcAgg(fnId, aggAnchor.col, sorted) : null;
                    const val      = isActive ? fmtAgg(rawV, colField, fnId) : null;
                    return (
                      <button key={fnId}
                        onClick={() => { setAggs(prev => ({ ...prev, [aggAnchor.col]: fnId })); setAggAnchor(null); }}
                        style={{
                          display: 'flex', width: '100%', textAlign: 'left', alignItems: 'center',
                          padding: '6px 12px', border: 'none',
                          borderLeft: isActive ? `3px solid ${fnColor}` : '3px solid transparent',
                          background: isActive ? `${fnColor}12` : M.surfHigh,
                          color: isActive ? fnColor : M.textA,
                          fontSize: fz - 2, fontWeight: isActive ? 900 : 400,
                          cursor: 'pointer', fontFamily: uff,
                        }}
                      >
                        <span style={{ flex: 1 }}>{fn?.label}</span>
                        {isActive && val && (
                          <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 5px', background: fnColor, color: '#fff', borderRadius: 4 }}>{val}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer: None + Close */}
            <div style={{ padding: '6px 10px', borderTop: `1px solid ${M.divider}`, display: 'flex', gap: 6 }}>
              <button onClick={() => { setAggs(prev => ({ ...prev, [aggAnchor.col]: 'none' })); setAggAnchor(null); }}
                style={{ flex: 1, padding: '4px 8px', border: '1px solid #fecaca', borderRadius: 4, background: '#fef2f2', color: '#ef4444', fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>
                Remove
              </button>
              <button onClick={() => setAggAnchor(null)}
                style={{ flex: 1, padding: '4px 8px', border: `1px solid ${M.inputBd}`, borderRadius: 4, background: M.inputBg, color: M.textB, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: uff }}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Sort Panel (imported component, Sheet mode) ── */}
      {showSortPanel && (
        <SortPanel
          fields={allFields}
          sorts={sorts}
          onSorts={setSorts}
          onClose={() => setShowSortPanel(false)}
          M={M} A={A} uff={uff} fz={fz}
        />
      )}

      {/* ── Column Panel (imported component, Sheet mode) ── */}
      {showColPanel && (
        <ColumnPanel
          fields={allFields}
          colOrder={colOrder.length > 0 ? colOrder : allFields.map(f => f.key)}
          hiddenC={hiddenC}
          onApply={(newOrder, newHidden) => { setColOrder(newOrder); setHiddenC(newHidden); }}
          onClose={() => setShowColPanel(false)}
          M={M} A={A} uff={uff} fz={fz}
        />
      )}

      {/* ── Record Detail Modal (Sheet mode) ── */}
      {detailRow && (
        <RecordDetailModal
          record={detailRow}
          schema={schema}
          onClose={() => setDetailRow(null)}
          onEdit={(row) => { setDetailRow(null); openEdit(row); }}
          M={M} A={A} uff={uff} dff={dff} fz={fz}
        />
      )}

      {/* ── View Edit Modal (create / edit / duplicate, Sheet mode) ── */}
      {showViewEdit && (
        <ViewEditModal
          view={showViewEdit.view}
          mode={showViewEdit.mode}
          allFields={allFields}
          existingNames={['Default', ...savedViews.map(v => v.name)]}
          onSave={handleViewSave}
          onCancel={() => setShowViewEdit(null)}
          M={M} A={A} uff={uff} fz={fz}
        />
      )}

      {/* ── View Switch Guard Modal ── */}
      {switchGuard && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)', zIndex: 1200 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 360, background: M.surfHigh, borderRadius: 12, border: `1px solid ${M.divider}`,
            zIndex: 1201, boxShadow: M.shadow, overflow: 'hidden',
          }}>
            <div style={{ background: '#f59e0b', padding: '14px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: uff }}>Unsaved Changes</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.85)', fontFamily: uff, marginTop: 3 }}>
                View "{activeViewName}" has been modified
              </div>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Save + Switch */}
              {activeViewName !== 'Default' && (
                <button onClick={() => {
                  handleUpdateView();
                  const t = switchGuard.targetViewName;
                  setSwitchGuard(null);
                  if (t === 'Default') loadView({ name: 'Default' });
                  else { const v = savedViews.find(sv => sv.name === t); if (v) loadView(v); }
                }} style={{ padding: '9px 14px', border: 'none', borderRadius: 7, background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}>
                  Save changes {'\u2192'} switch to "{switchGuard.targetViewName}"
                </button>
              )}
              {/* Discard + Switch */}
              <button onClick={() => {
                const t = switchGuard.targetViewName;
                setSwitchGuard(null);
                if (t === 'Default') loadView({ name: 'Default' });
                else { const v = savedViews.find(sv => sv.name === t); if (v) loadView(v); }
              }} style={{ padding: '9px 14px', border: `1px solid ${M.inputBd}`, borderRadius: 7, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}>
                Discard {'\u2192'} switch to "{switchGuard.targetViewName}"
              </button>
              {/* Stay */}
              <button onClick={() => setSwitchGuard(null)} style={{ padding: '9px 14px', border: 'none', borderRadius: 7, background: M.surfMid, color: M.textA, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}>
                {'\u2190'} Stay on "{activeViewName}"
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── V2 Filter Panel ── */}
      {showFiltPnl && (
        <FilterPanelV2 data={rows} colFilters={colFilters} setColFilters={setColFilters}
          visCols={visCols} allFields={allFields} onClose={() => setShowFiltPnl(false)}
          M={M} A={A} uff={uff} fz={fz} />
      )}

      {/* ── V2 New View Modal ── */}
      {showNewViewV2 && (
        <NewViewModalV2 allFields={allFields}
          existingNames={existingViewNames}
          editView={editingViewV2}
          onSave={handleSaveViewV2}
          onClose={() => { setShowNewViewV2(false); setEditingViewV2(null); }}
          M={M} A={A} uff={uff} />
      )}

      {/* ── V2 Manage Panel ── */}
      {showManageV2 && (
        <ManagePanelV2 systemViews={systemViews} customViews={customViewsV2} activeViewId={sysViewId}
          onEdit={v => { setEditingViewV2(v); setShowManageV2(false); setShowNewViewV2(true); }}
          onDelete={handleDeleteViewV2} onDuplicate={handleDuplicateViewV2}
          onClose={() => setShowManageV2(false)}
          M={M} A={A} uff={uff} />
      )}

      {/* ── V2 Export Menu ── */}
      {showExportV2 && (
        <ExportMenuV2 count={sorted.length}
          onClose={() => setShowExportV2(false)}
          onToast={(msg) => showToast(msg, 'info')}
          M={M} A={A} uff={uff} />
      )}

      {/* ── V2 Detail Modal ── */}
      {v2DetailRow && (
        <V2DetailModal row={v2DetailRow} visCols={visCols} schema={schema}
          onClose={() => setV2DetailRow(null)}
          onEdit={row => { setV2DetailRow(null); openEdit(row); }}
          M={M} A={A} uff={uff} fz={fz} />
      )}

      {/* ── V2 Sort Panel Drawer ── */}
      {showSortDrawerV2 && (
        <SortPanelV2Drawer
          fields={allFields}
          sorts={sorts}
          onSorts={setSorts}
          onClose={() => setShowSortDrawerV2(false)}
          M={M} A={A} uff={uff} fz={fz} />
      )}

      {/* ── Toast — bottom:24 right:24, color-aware ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.color || '#0078D4', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: uff, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 340 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
