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
