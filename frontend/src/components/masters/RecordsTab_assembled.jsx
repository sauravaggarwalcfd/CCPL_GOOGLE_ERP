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
