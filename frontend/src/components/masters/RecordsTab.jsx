import { useState, useEffect, useMemo } from 'react';
import { SCHEMA_MAP } from '../../constants/masterSchemas';
import api from '../../services/api';
import SortPanel from './SortPanel';
import ColumnPanel from './ColumnPanel';
import RecordDetailModal from './RecordDetailModal';
import ViewEditModal from './ViewEditModal';

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

// ── Status badge colours ──
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
    case 'sum':            return nums.length ? fmt(nums.reduce((a, b) => a + b, 0)) : '—';
    case 'avg':            return nums.length ? fmt(nums.reduce((a, b) => a + b, 0) / nums.length) : '—';
    case 'min':            return nums.length ? fmt(Math.min(...nums)) : '—';
    case 'max':            return nums.length ? fmt(Math.max(...nums)) : '—';
    case 'range':          return nums.length ? fmt(Math.max(...nums) - Math.min(...nums)) : '—';
    case 'median': {
      if (!nums.length) return '—';
      const s = [...nums].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return fmt(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
    }
    case 'percent_filled': return total ? `${((vals.length / total) * 100).toFixed(1)}%` : '—';
    case 'percent_empty':  return total ? `${(((total - vals.length) / total) * 100).toFixed(1)}%` : '—';
    default: return '';
  }
}

// ── Currency-aware agg formatter ──
function fmtAgg(rawVal, field, fn) {
  if (!rawVal || rawVal === '—') return rawVal;
  if (field?.type === 'currency' && ['sum', 'avg', 'min', 'max', 'range', 'median'].includes(fn)) {
    const n = parseFloat(rawVal);
    if (!isNaN(n)) return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return rawVal;
}

// ═══════════════════════════════════════════════════════════
// ADVANCED FILTER / SORT — operator-based multi-condition panel
// ═══════════════════════════════════════════════════════════
const REC_FILTER_OPS = {
  cat: ['is', 'is not'],
  txt: ['contains', 'not contains', 'starts with'],
  num: ['=', '≠', '>', '<', '≥', '≤'],
};
const REC_SORT_MODES = [
  { value: 'a_z',       label: 'A → Z'               },
  { value: 'z_a',       label: 'Z → A'               },
  { value: 'nil_first', label: 'Nil / Empty First'    },
  { value: 'nil_last',  label: 'Nil / Empty Last'     },
  { value: 'freq_hi',   label: 'Most Frequent First'  },
  { value: 'freq_lo',   label: 'Least Frequent First' },
  { value: 'num_lo',    label: 'Lowest → Highest'     },
  { value: 'num_hi',    label: 'Highest → Lowest'     },
  { value: 'val_first', label: 'Value is… First'      },
  { value: 'val_last',  label: 'Value is… Last'       },
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
    return op==='='?n===v:op==='≠'?n!==v:op==='>'?n>v:op==='<'?n<v:op==='≥'?n>=v:n<=v;
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
    const gv = row[groupBy] ?? '—';
    if (!groupedData.has(gv)) groupedData.set(gv, new Map());
    if (subGroupBy) {
      const sv = row[subGroupBy] ?? '—';
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

/**
 * RecordsTab — full-featured data table with sort, grouping, column management,
 * aggregation footer, views system, record detail modal.
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
  useEffect(() => {
    setLoading(true);
    setRows([]);
    setSearch('');
    setFetchError(null);
    setShowAddForm(false);
    setEditRow(null);
    setFormData({});
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

  // ── Derived: visible columns ──
  const visCols = useMemo(() => {
    const order = colOrder.length > 0 ? colOrder : allFields.map(f => f.key);
    return order.filter(k => !hiddenC.includes(k)).map(k => allFields.find(f => f.key === k)).filter(Boolean);
  }, [colOrder, hiddenC, allFields]);

  // ── Derived: filtered → sorted → render list ──
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
    // Advanced operator-based filters
    advFilters.forEach(fil => {
      if (fil.value !== '' || recAdvFieldType(schema.find(x => x.key === fil.field)) === 'num')
        result = result.filter(r => evalRecAdvFilter(r, fil, schema));
    });
    return result;
  }, [rows, search, filters, advFilters]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Toast helper — colorKey: 'success'|'delete'|'view'|'info' ──
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
      showToast(editRow ? '✓ Record updated' : '✓ Record saved', 'success');
      setShowAddForm(false);
      setEditRow(null);
      setFormData({});
      const data = await api.getMasterData(sheet.key, fileLabel);
      if (Array.isArray(data)) setRows(data.map(r => mapRawToSchema(r, schema)));
    } catch (err) {
      showToast('Error: ' + err.message, 'delete');
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
      showToast('✓ Record deleted', 'delete');
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
    if (f.w === '1fr') return 220;
    const n = parseInt(f.w);
    return isNaN(n) ? 140 : n;
  };

  // ── Summary labels ──
  const sortLabel = sorts.length > 0 ? `⇅ ${sorts.length} sort${sorts.length > 1 ? 's' : ''}` : '⇅ Sort';
  const colLabel  = hiddenC.length > 0 ? `⫿ ${hiddenC.length} hidden` : '⫿ Columns';
  const grpLabel  = groupBy ? `⊞ ${allFields.find(f => f.key === groupBy)?.label || groupBy}` : '⊞ Group';

  // ── Group by toggle (cycle: none → first groupable col → next → clear) ──
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
    // We're dragging among visCols but need to remap to full colOrder
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
    showToast(`✓ View "${viewData.name}" saved`, 'view');
  };

  const handleUpdateView = () => {
    if (activeViewName === 'Default') return;
    const snap = getCurrentViewSnapshot();
    setSavedViews(prev => prev.map(v => v.name === activeViewName ? { ...v, ...snap } : v));
    showToast(`✓ View "${activeViewName}" updated`, 'view');
  };

  const handleDeleteView = (viewName) => {
    setSavedViews(prev => prev.filter(v => v.name !== viewName));
    if (activeViewName === viewName) loadView({ name: 'Default' });
    showToast(`View "${viewName}" deleted`, 'delete');
  };

  const viewDirty = getViewDirty();

  // ── Render a data row ──
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
            {isSelected && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
        </td>
        {/* Row # */}
        <td style={{ padding: `${pyV}px 6px`, borderRight: `1px solid ${M.divider}`, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: M.textD, textAlign: 'center' }}>
          {String(rowIdx + 1).padStart(2, '0')}
        </td>
        {/* Data cells */}
        {visCols.map((f, fi) => {
          const val = row[f.key];
          const hasVal = val !== undefined && val !== null && val !== '';
          return (
            <td key={f.key}
              onClick={() => setDetailRow(row)}
              style={{ padding: `${pyV - 1}px 8px`, borderRight: `1px solid ${M.divider}`, maxWidth: 240, overflow: 'hidden', cursor: 'pointer' }}
            >
              {f.badge ? (
                (() => {
                  const sc = STATUS_COLORS[val] || fallbackStatus;
                  return <span style={{ fontSize: fz - 2, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>{hasVal ? String(val) : '—'}</span>;
                })()
              ) : hasVal ? (
                <span style={{ fontSize: fz - 2, color: fi === 0 ? A.a : M.textA, fontWeight: fi === 0 ? 700 : 400, fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {String(val)}
                </span>
              ) : (
                <span style={{ fontSize: fz - 3, color: M.textD, fontStyle: 'italic' }}>
                  {f.required ? '⚠ required' : '—'}
                </span>
              )}
            </td>
          );
        })}
        {/* Actions */}
        <td style={{ padding: `${pyV}px 6px`, textAlign: 'center', whiteSpace: 'nowrap' }}>
          <button onClick={e => { e.stopPropagation(); openEdit(row); }} style={{ fontSize: 9, fontWeight: 700, color: A.a, background: A.al, border: 'none', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontFamily: uff, marginRight: 3 }}>Edit</button>
          <button onClick={e => { e.stopPropagation(); handleDelete(row); }} style={{ fontSize: 9, fontWeight: 700, color: M.textD, background: M.surfMid, border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', fontFamily: uff }}>✕</button>
        </td>
      </tr>
    );
  };

  // =====================================================================
  //  RENDER
  // =====================================================================
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{ background: M.surfMid, borderBottom: `1px solid ${M.divider}`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 7, minHeight: 44, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: M.textD, letterSpacing: 0.5, fontFamily: uff, flexShrink: 0 }}>📊 RECORDS</span>
        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: M.surfHigh, color: M.textC, fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>
          {sheetCounts?.[sheet.key] ?? rows.length}
        </span>

        {/* ── Advanced Filter + Sort buttons — LEFT, always visible ── */}
        <div style={{ width: 1, height: 16, background: M.divider, flexShrink: 0 }} />
        <button onClick={() => { const op = !showAdvFilters; setShowAdvFilters(op); setShowAdvSorts(false); if (op && advFilters.length === 0) addAdvFilter(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: `1px solid ${showAdvFilters || activeAdvFilterCount > 0 ? A.a : M.inputBd}`, borderRadius: 6, background: showAdvFilters || activeAdvFilterCount > 0 ? A.al : M.inputBg, color: showAdvFilters || activeAdvFilterCount > 0 ? A.a : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
          ＋ Filter
          {activeAdvFilterCount > 0 && <span style={{ background: A.a, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 8.5, fontWeight: 900, lineHeight: 1 }}>{activeAdvFilterCount}</span>}
        </button>
        <button onClick={() => { const op = !showAdvSorts; setShowAdvSorts(op); setShowAdvFilters(false); if (op && advSorts.length === 0) addAdvSort(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: `1px solid ${showAdvSorts || isAdvSortActive ? '#7C3AED' : M.inputBd}`, borderRadius: 6, background: showAdvSorts || isAdvSortActive ? 'rgba(124,58,237,.1)' : M.inputBg, color: showAdvSorts || isAdvSortActive ? '#7C3AED' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
          ↑ Sort
          {isAdvSortActive && <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 8.5, fontWeight: 900, lineHeight: 1 }}>{advSorts.length}</span>}
        </button>
        {(activeAdvFilterCount > 0 || isAdvSortActive) && (
          <button onClick={() => { setAdvFilters([]); setAdvSorts([]); setShowAdvFilters(false); setShowAdvSorts(false); }}
            style={{ padding: '5px 9px', border: '1px solid #fecaca', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>✕ Reset</button>
        )}

        <div style={{ flex: 1, minWidth: 8 }} />

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: M.textD }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ padding: '5px 10px 5px 28px', border: `1px solid ${M.divider}`, borderRadius: 6, fontSize: fz - 2, fontFamily: uff, width: 130, outline: 'none', color: M.textA, background: M.inputBg }} />
        </div>

        {/* Sort — with count badge */}
        <button onClick={() => setShowSortPanel(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: `1px solid ${sorts.length > 0 ? '#7C3AED' : M.inputBd}`, borderRadius: 6, background: sorts.length > 0 ? 'rgba(124,58,237,.1)' : M.inputBg, color: sorts.length > 0 ? '#7C3AED' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
          ⇅ Sort
          {sorts.length > 0 && <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 8.5, fontWeight: 900, lineHeight: 1 }}>{sorts.length}</span>}
        </button>

        {/* Filter panel toggle */}
        <button onClick={() => setShowFP(p => !p)} style={{ padding: '5px 11px', border: `1px solid ${showFP || Object.values(filters).some(v => v) ? '#7C3AED' : M.inputBd}`, borderRadius: 6, background: showFP || Object.values(filters).some(v => v) ? 'rgba(124,58,237,.1)' : M.inputBg, color: showFP || Object.values(filters).some(v => v) ? '#7C3AED' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
          ⚡ Filter
        </button>

        {/* Columns — quick toggle pills inline, long-click opens panel */}
        <button
          onClick={() => setShowCM(p => !p)}
          onContextMenu={e => { e.preventDefault(); setShowColPanel(true); }}
          title="Click to toggle column pills · Right-click to open column panel"
          style={{ padding: '5px 11px', border: `1px solid ${hiddenC.length > 0 || showCM ? '#7C3AED' : M.inputBd}`, borderRadius: 6, background: hiddenC.length > 0 || showCM ? 'rgba(124,58,237,.1)' : M.inputBg, color: hiddenC.length > 0 || showCM ? '#7C3AED' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {colLabel}
        </button>

        {/* Group by select */}
        <select value={groupBy || ''} onChange={e => { setGroupBy(e.target.value || null); setSubGroupBy(null); }}
          style={{ padding: '4px 7px', border: `1px solid ${groupBy ? '#f59e0b' : M.inputBd}`, borderRadius: 6, background: groupBy ? 'rgba(245,158,11,.1)' : M.inputBg, color: groupBy ? '#f59e0b' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, outline: 'none', flexShrink: 0 }}>
          <option value="">⊞ Group by…</option>
          {allFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>

        {/* Sub-group select */}
        {groupBy && (
          <select value={subGroupBy || ''} onChange={e => setSubGroupBy(e.target.value || null)}
            style={{ padding: '4px 7px', border: `1px solid ${subGroupBy ? '#f59e0b' : M.inputBd}`, borderRadius: 6, background: subGroupBy ? 'rgba(245,158,11,.1)' : M.inputBg, color: subGroupBy ? '#f59e0b' : M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, outline: 'none', flexShrink: 0 }}>
            <option value="">↳ Sub-group…</option>
            {allFields.filter(f => f.key !== groupBy).map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        )}

        {/* Export dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowExportMenu(p => !p)} style={{ padding: '5px 11px', border: `1px solid ${M.inputBd}`, borderRadius: 6, background: M.inputBg, color: M.textB, fontSize: fz - 3, fontWeight: 800, cursor: 'pointer', fontFamily: uff, whiteSpace: 'nowrap' }}>
            ↓ Export ▾
          </button>
          {showExportMenu && (
            <>
              <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
              <div style={{ position: 'absolute', top: 36, right: 0, zIndex: 201, background: M.surfHigh, border: `1px solid ${M.divider}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.15)', width: 155, overflow: 'hidden' }}>
                {[
                  { icon: '📄', label: 'PDF' },
                  { icon: '📊', label: 'Excel (.xlsx)' },
                  { icon: '🟢', label: 'Google Sheet' },
                  { icon: '🖨', label: 'Print' },
                ].map(opt => (
                  <button key={opt.label}
                    onClick={() => { setShowExportMenu(false); showToast(`Export as ${opt.label} — coming soon`, 'info'); }}
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

        {/* Add New — CC_RED */}
        <button onClick={openAdd} style={{ padding: '5px 14px', background: CC_RED, border: 'none', borderRadius: 6, fontSize: fz - 2, fontWeight: 900, color: '#fff', cursor: 'pointer', fontFamily: uff, flexShrink: 0 }}>
          + Add New
        </button>
      </div>

      {/* ── Views Bar (§C) ── */}
      <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, flexWrap: 'wrap', minHeight: 34 }}>
        <span style={{ fontSize: 8, fontWeight: 900, color: M.textD, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: uff, marginRight: 2 }}>VIEWS:</span>

        {/* Default pill — CC_RED when active */}
        <div
          onClick={() => handleViewClick('Default')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 14,
            border: `1px solid ${activeViewName === 'Default' ? CC_RED : M.inputBd}`,
            background: activeViewName === 'Default' ? '#CC000015' : M.surfMid,
            cursor: 'pointer', fontSize: 9, fontWeight: 800,
            color: activeViewName === 'Default' ? CC_RED : M.textB, fontFamily: uff,
          }}
        >
          {activeViewName === 'Default' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: CC_RED, flexShrink: 0 }} />}
          Default
          <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 4, background: M.textD, color: '#fff' }}>LOCKED</span>
          {activeViewName === 'Default' && viewDirty && (
            <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 4, background: '#f59e0b', color: '#fff' }}>MODIFIED</span>
          )}
        </div>

        {/* Saved view pills */}
        {savedViews.map(view => {
          const isActive    = activeViewName === view.name;
          const isRenaming  = renamingView === view.name;
          return (
            <div key={view.name}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', borderRadius: 14,
                border: `1px solid ${isActive ? A.a : M.inputBd}`,
                background: isActive ? A.al : M.surfMid,
                fontSize: 9, fontWeight: 700,
                color: isActive ? A.a : M.textB, fontFamily: uff,
              }}
            >
              {/* Inline rename input or label */}
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const n = renameVal.trim();
                      if (n && n !== view.name && !savedViews.some(v => v.name === n) && n !== 'Default') {
                        setSavedViews(prev => prev.map(v => v.name === view.name ? { ...v, name: n } : v));
                        if (activeViewName === view.name) setActiveViewName(n);
                        showToast(`View renamed to "${n}"`, 'view');
                      }
                      setRenamingView(null);
                    }
                    if (e.key === 'Escape') setRenamingView(null);
                  }}
                  onBlur={() => setRenamingView(null)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 80, fontSize: 9, padding: '1px 4px', border: `1px solid ${A.a}`, borderRadius: 4, fontFamily: uff, outline: 'none', background: M.inputBg, color: M.textA }}
                />
              ) : (
                <span onClick={() => handleViewClick(view.name)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: A.a, flexShrink: 0 }} />}
                  {view.name}
                  {isActive && viewDirty && (
                    <span style={{ fontSize: 7.5, fontWeight: 900, padding: '1px 4px', borderRadius: 4, background: '#f59e0b', color: '#fff' }}>MODIFIED</span>
                  )}
                </span>
              )}
              {!isRenaming && (
                <>
                  {/* Inline rename ✎ */}
                  <span
                    onClick={e => { e.stopPropagation(); setRenamingView(view.name); setRenameVal(view.name); }}
                    title="Rename view" style={{ cursor: 'pointer', fontSize: 10, color: M.textD, padding: '0 2px' }}>✎</span>
                  {/* Duplicate */}
                  <span
                    onClick={e => { e.stopPropagation(); setShowViewEdit({ mode: 'duplicate', view }); }}
                    title="Duplicate view" style={{ cursor: 'pointer', fontSize: 10, color: M.textD, padding: '0 2px' }}>⧉</span>
                  {/* Delete */}
                  <span
                    onClick={e => { e.stopPropagation(); handleDeleteView(view.name); }}
                    title="Delete view" style={{ cursor: 'pointer', fontSize: 11, color: '#ef4444', padding: '0 2px' }}>×</span>
                  {/* Update if active + dirty */}
                  {isActive && viewDirty && (
                    <span
                      onClick={e => { e.stopPropagation(); handleUpdateView(); }}
                      title="Save changes to this view"
                      style={{ cursor: 'pointer', fontSize: 8, fontWeight: 900, padding: '1px 5px', background: '#f59e0b', color: '#fff', borderRadius: 4, marginLeft: 2 }}>💾 Update</span>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* + Save View — inline text input row */}
        {showInlineSave ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input
              autoFocus
              value={inlineSaveName}
              onChange={e => setInlineSaveName(e.target.value)}
              placeholder="View name…"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const n = inlineSaveName.trim();
                  if (n && n !== 'Default' && !savedViews.some(v => v.name === n)) {
                    handleViewSave({ name: n, ...getCurrentViewSnapshot() });
                  }
                  setShowInlineSave(false); setInlineSaveName('');
                }
                if (e.key === 'Escape') { setShowInlineSave(false); setInlineSaveName(''); }
              }}
              onBlur={() => { setShowInlineSave(false); setInlineSaveName(''); }}
              style={{ width: 100, fontSize: 9, padding: '3px 6px', border: '1px solid #7C3AED', borderRadius: 10, fontFamily: uff, outline: 'none', background: M.inputBg, color: M.textA }}
            />
            <span style={{ fontSize: 8.5, color: M.textD, fontFamily: uff }}>↵ Enter</span>
          </div>
        ) : (
          <button
            onClick={() => { setShowInlineSave(true); setInlineSaveName(''); }}
            style={{ padding: '3px 9px', border: '1px dashed #7C3AED', borderRadius: 14, background: 'rgba(124,58,237,.05)', color: '#7C3AED', fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: uff }}>
            + Save View
          </button>
        )}
      </div>

      {/* ── Active sort strip ── */}
      {sorts.length > 0 && (
        <div style={{ background: 'rgba(124,58,237,.06)', borderBottom: '1px solid rgba(124,58,237,.2)', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: uff }}>SORTED BY:</span>
          {sorts.map((s, i) => {
            const f = allFields.find(fl => fl.key === s.col);
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: M.surfHigh, border: '1px solid rgba(124,58,237,.3)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 800, color: '#7C3AED', fontFamily: uff }}>
                {f?.label || s.col} {s.dir === 'asc' ? '↑' : '↓'}
                <span onClick={() => setSorts(prev => prev.filter((_, j) => j !== i))} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1 }}>×</span>
              </span>
            );
          })}
          <button onClick={() => setSorts([])} style={{ fontSize: 9, color: M.textD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, marginLeft: 4 }}>Clear all</button>
        </div>
      )}

      {/* ── Active group strip ── */}
      {groupBy && (
        <div style={{ background: 'rgba(245,158,11,.06)', borderBottom: '1px solid rgba(245,158,11,.2)', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', fontFamily: uff }}>GROUPED BY:</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: M.textA, fontFamily: uff }}>{allFields.find(f => f.key === groupBy)?.label || groupBy}</span>
          {subGroupBy && (
            <>
              <span style={{ fontSize: 9, color: M.textD, fontFamily: uff }}>then by</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: M.textA, fontFamily: uff }}>{allFields.find(f => f.key === subGroupBy)?.label || subGroupBy}</span>
            </>
          )}
          <button onClick={() => { setGroupBy(null); setSubGroupBy(null); }} style={{ fontSize: 9, color: '#f59e0b', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, marginLeft: 4 }}>× Clear</button>
        </div>
      )}

      {/* ── Inline Filter Panel (showFP) ── */}
      {showFP && (
        <div style={{ background: M.surfHigh, borderBottom: '1px solid rgba(124,58,237,.2)', padding: '6px 16px', display: 'flex', alignItems: 'flex-end', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#7C3AED', fontFamily: uff, marginRight: 4, paddingBottom: 2 }}>🔍 FILTERS:</span>
          {visCols.map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 7.5, fontWeight: 900, color: M.textD, fontFamily: uff, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</span>
              <input
                value={filters[f.key] || ''}
                onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder="Filter…"
                style={{ width: 88, padding: '3px 6px', border: `1px solid ${filters[f.key] ? '#7C3AED' : M.inputBd}`, borderRadius: 4, fontSize: fz - 3, fontFamily: uff, outline: 'none', background: M.inputBg, color: M.textA }}
              />
            </div>
          ))}
          <button onClick={() => setFilters({})} style={{ fontSize: 8.5, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, paddingBottom: 4 }}>
            × Clear
          </button>
        </div>
      )}

      {/* ── ADVANCED FILTER PANEL (operator-based, Layout View style) ── */}
      {showAdvFilters && (
        <div style={{ padding: '10px 14px 12px', borderBottom: `1px solid ${M.divider}`, background: M.surfHigh, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {advFilters.map((fil, fi) => {
              const f       = schema.find(x => x.key === fil.field);
              const fType   = recAdvFieldType(f);
              const ops     = REC_FILTER_OPS[fType] || REC_FILTER_OPS.txt;
              const catOpts = fType === 'cat' && f?.options ? f.options : null;
              const isAct   = fil.value !== '';
              const ctrlSel = { fontSize: 10, border: `1px solid ${M.divider}`, borderRadius: 5, padding: '3px 7px', background: M.inputBg, color: M.textA, cursor: 'pointer', outline: 'none', fontFamily: uff };
              return (
                <div key={fil.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: M.textD, minWidth: 34, textAlign: 'right', fontWeight: 600, fontFamily: uff }}>{fi === 0 ? 'Where' : 'And'}</span>
                  <select value={fil.field} onChange={e => updateAdvFilter(fil.id, { field: e.target.value })}
                    style={{ ...ctrlSel, fontWeight: 700, color: '#0e7490', borderColor: '#0891B270', background: '#f0fdfa' }}>
                    {allFields.map(fd => <option key={fd.key} value={fd.key}>{fd.label}</option>)}
                  </select>
                  <select value={fil.op} onChange={e => updateAdvFilter(fil.id, { op: e.target.value })} style={ctrlSel}>
                    {ops.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  {fType === 'cat' && catOpts ? (
                    <select value={fil.value} onChange={e => updateAdvFilter(fil.id, { value: e.target.value })}
                      style={{ ...ctrlSel, minWidth: 110, fontWeight: 700, borderColor: isAct ? '#0891B270' : M.divider, color: isAct ? '#0e7490' : M.textA }}>
                      <option value="">Select value…</option>
                      {catOpts.map(v => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
                    </select>
                  ) : (
                    <input value={fil.value} onChange={e => updateAdvFilter(fil.id, { value: e.target.value })}
                      placeholder={fType === 'num' ? 'Enter number…' : 'Enter text…'}
                      type={fType === 'num' ? 'number' : 'text'}
                      style={{ ...ctrlSel, minWidth: 110, fontWeight: 700, borderColor: isAct ? '#0891B270' : M.divider, color: isAct ? '#0e7490' : M.textA }} />
                  )}
                  <button onClick={() => removeAdvFilter(fil.id)}
                    style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 3px', fontWeight: 900 }}>×</button>
                </div>
              );
            })}
            <button onClick={addAdvFilter}
              style={{ alignSelf: 'flex-start', marginLeft: 40, border: 'none', background: 'transparent', color: '#0e7490', fontSize: 9, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: uff }}>
              ＋ Add another filter
            </button>
          </div>
        </div>
      )}

      {/* ── ADVANCED SORT PANEL (multi-mode, Layout View style) ── */}
      {showAdvSorts && (
        <div style={{ padding: '10px 14px 12px', borderBottom: `1px solid ${M.divider}`, background: M.surfHigh, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {advSorts.map((srt, si) => {
              const f       = schema.find(x => x.key === srt.field);
              const fType   = recAdvFieldType(f);
              const needVal = srt.mode === 'val_first' || srt.mode === 'val_last';
              const catOpts = needVal && fType === 'cat' && f?.options ? f.options : null;
              const ctrlSel = { fontSize: 10, border: `1px solid ${M.divider}`, borderRadius: 5, padding: '3px 7px', background: M.inputBg, color: M.textA, cursor: 'pointer', outline: 'none', fontFamily: uff };
              return (
                <div key={srt.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: M.textD, minWidth: 34, textAlign: 'right', fontWeight: 600, fontFamily: uff }}>{si === 0 ? 'Sort' : 'Then'}</span>
                  <select value={srt.field} onChange={e => updateAdvSort(srt.id, { field: e.target.value, value: '' })}
                    style={{ ...ctrlSel, fontWeight: 700, color: '#6d28d9', borderColor: '#7c3aed70', background: '#7c3aed10' }}>
                    {allFields.map(fd => <option key={fd.key} value={fd.key}>{fd.label}</option>)}
                  </select>
                  <select value={srt.mode} onChange={e => updateAdvSort(srt.id, { mode: e.target.value, value: '' })} style={ctrlSel}>
                    {REC_SORT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  {needVal && (catOpts ? (
                    <select value={srt.value} onChange={e => updateAdvSort(srt.id, { value: e.target.value })}
                      style={{ ...ctrlSel, minWidth: 120, fontWeight: 700 }}>
                      <option value="">Pick value…</option>
                      {catOpts.map(v => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
                    </select>
                  ) : (
                    <input value={srt.value} onChange={e => updateAdvSort(srt.id, { value: e.target.value })}
                      placeholder="Enter value…" style={{ ...ctrlSel, minWidth: 120, fontWeight: 700 }} />
                  ))}
                  {advSorts.length > 1 && (
                    <button onClick={() => removeAdvSort(srt.id)}
                      style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 3px', fontWeight: 900 }}>×</button>
                  )}
                </div>
              );
            })}
            <button onClick={addAdvSort}
              style={{ alignSelf: 'flex-start', marginLeft: 40, border: 'none', background: 'transparent', color: '#6d28d9', fontSize: 9, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: uff }}>
              ＋ Add another sort
            </button>
          </div>
        </div>
      )}

      {/* ── Inline Column Pills (showCM) ── */}
      {showCM && (
        <div style={{ background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: A.a, fontFamily: uff, marginRight: 4 }}>⫿ COLUMNS:</span>
          {allFields.map(f => {
            const isHidden = hiddenC.includes(f.key);
            return (
              <button key={f.key}
                onClick={() => setHiddenC(prev => isHidden ? prev.filter(k => k !== f.key) : [...prev, f.key])}
                style={{ padding: '2px 9px', border: `1px solid ${isHidden ? M.inputBd : A.a}`, borderRadius: 12, background: isHidden ? M.surfMid : A.al, color: isHidden ? M.textD : A.a, fontSize: 9, fontWeight: isHidden ? 400 : 700, cursor: 'pointer', fontFamily: uff }}>
                {isHidden ? '○ ' : '● '}{f.label}
              </button>
            );
          })}
          <button onClick={() => setHiddenC([])} style={{ fontSize: 8.5, color: M.textD, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff }}>Show all</button>
        </div>
      )}

      {/* ── Filter + Sort Summary Strip — single combined row ── */}
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
                {/* Per-column filter chips */}
                {colEntries.map(([key, val]) => {
                  const fd = allFields.find(x => x.key === key);
                  return (
                    <span key={'col_' + key} style={chipF}>
                      {fd?.label || key} <span style={{ fontWeight: 400, color: '#0891B2' }}>contains</span> <strong>{val}</strong>
                      <span onClick={() => setFilters(p => { const n = { ...p }; delete n[key]; return n; })} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>×</span>
                    </span>
                  );
                })}
                {/* Advanced filter chips */}
                {advFilters.filter(f => f.value !== '').map(fil => {
                  const fd = allFields.find(x => x.key === fil.field);
                  return (
                    <span key={fil.id} style={chipF}>
                      {fd?.label || fil.field} <span style={{ fontWeight: 400, color: '#0891B2' }}>{fil.op}</span> <strong>{fil.value}</strong>
                      <span onClick={() => removeAdvFilter(fil.id)} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>×</span>
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
                      {fd?.label || srt.field} <span style={{ fontWeight: 400, color: '#9333ea' }}>{mLabel}</span>{srt.value ? <> <strong>{srt.value}</strong></> : null}
                      {advSorts.length > 1 && <span onClick={() => removeAdvSort(srt.id)} style={{ cursor: 'pointer', color: M.textD, fontSize: 11, lineHeight: 1, marginLeft: 1 }}>×</span>}
                    </span>
                  );
                })}
              </>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={() => { setFilters({}); setAdvFilters([]); setAdvSorts([]); }} style={{ fontSize: 9, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: uff, flexShrink: 0 }}>✕ Clear all</button>
          </div>
        );
      })()}

      {/* ── Table area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          {fetchError ? (
            <div style={{ margin: 16, textAlign: 'center', padding: 60, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 6, fontFamily: uff }}>Failed to load data</div>
              <div style={{ fontSize: 11, color: '#b91c1c', marginBottom: 16, fontFamily: uff, maxWidth: 400, margin: '0 auto 16px' }}>{fetchError}</div>
              <div style={{ fontSize: 10, color: '#6b7280', fontFamily: uff, lineHeight: 1.6 }}>Check that GAS web app is deployed and VITE_GAS_URL is correct.</div>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: M.textD, fontSize: 13, fontFamily: uff }}>Loading records…</div>
          ) : (
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%', width: 'max-content' }}>
              <colgroup>
                <col style={{ width: 32 }} />
                <col style={{ width: 36 }} />
                {visCols.map(f => <col key={f.key} style={{ width: colW(f) }} />)}
                <col style={{ width: 80 }} />
              </colgroup>

              {/* ── Column Headers ── */}
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: M.tblHead }}>
                  {/* Checkbox all */}
                  <th style={{ padding: `${pyV}px 8px`, borderBottom: `2px solid ${M.divider}`, borderRight: `1px solid ${M.divider}`, textAlign: 'center' }}>
                    <div onClick={toggleAll} style={{ width: 15, height: 15, borderRadius: 3, border: `2px solid ${allSelected ? A.a : M.inputBd}`, background: allSelected ? A.a : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'all .1s' }}>
                      {allSelected && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>
                  </th>
                  {/* # */}
                  <th style={{ padding: `${pyV}px 6px`, borderBottom: `2px solid ${M.divider}`, borderRight: `1px solid ${M.divider}`, fontSize: 9, fontWeight: 900, color: M.textD, textAlign: 'center' }}>#</th>
                  {/* Field headers — draggable (§G) */}
                  {visCols.map((f, fi) => {
                    const activeSort  = sorts.find(s => s.col === f.key);
                    const isDropTgt   = colDropIdx === fi && colDragIdx !== null && colDragIdx !== fi;
                    return (
                      <th key={f.key}
                        draggable
                        onDragStart={() => onColDragStart(fi)}
                        onDragOver={e => onColDragOver(e, fi)}
                        onDrop={() => onColDrop(fi)}
                        onDragEnd={() => { setColDragIdx(null); setColDropIdx(null); }}
                        onClick={() => handleHeaderClick(f.key)}
                        style={{
                          padding: `${pyV}px 8px`,
                          borderBottom: `2px solid ${M.divider}`,
                          borderRight: `1px solid ${M.divider}`,
                          borderLeft: isDropTgt ? '3px solid #f59e0b' : undefined,
                          textAlign: 'left', cursor: 'pointer', userSelect: 'none',
                          background: activeSort ? 'rgba(124,58,237,.08)' : M.tblHead,
                          opacity: colDragIdx === fi ? 0.45 : 1,
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { if (colDragIdx === null) e.currentTarget.style.background = M.hoverBg; }}
                        onMouseLeave={e => { if (colDragIdx === null) e.currentTarget.style.background = activeSort ? 'rgba(124,58,237,.08)' : M.tblHead; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {f.required && <span style={{ color: '#ef4444', fontSize: 8, fontWeight: 900 }}>⚠</span>}
                          <span style={{ fontSize: fz - 2, fontWeight: 700, color: fi === 0 ? A.a : activeSort ? '#7C3AED' : M.textA, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: colW(f) - 30 }}>{f.label}</span>
                          <span style={{ fontSize: 9, color: activeSort ? '#7C3AED' : M.textD, flexShrink: 0 }}>
                            {activeSort ? (activeSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  {/* Actions col */}
                  <th style={{ padding: `${pyV}px 6px`, borderBottom: `2px solid ${M.divider}`, fontSize: 9, fontWeight: 900, color: M.textD, textAlign: 'center' }}>ACT</th>
                </tr>
              </thead>

              {/* ── Rows ── */}
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
                          <span style={{ marginRight: 6 }}>{allFields.find(f => f.key === groupBy)?.label}:</span>
                          <span style={{ color: '#cbd5e1' }}>{item.value}</span>
                          <span style={{
                            marginLeft: 10, fontSize: 8.5, fontWeight: 900,
                            padding: '1px 6px', borderRadius: 8,
                            background: '#CC0000', color: '#fff',
                          }}>{item.count}</span>
                        </td>
                      </tr>
                    );
                  }
                  if (item.type === 'subgroup') {
                    return (
                      <tr key={item.key} style={{ background: '#334155' }}>
                        <td colSpan={visCols.length + 3} style={{ padding: `${pyV}px 12px`, paddingLeft: 28, fontWeight: 700, fontSize: fz - 3, color: '#cbd5e1', fontFamily: uff }}>
                          <span style={{ marginRight: 5, color: '#94a3b8' }}>↳</span>
                          <span style={{ marginRight: 6 }}>{allFields.find(f => f.key === subGroupBy)?.label}:</span>
                          <span style={{ color: '#94a3b8' }}>{item.value}</span>
                          <span style={{
                            marginLeft: 8, fontSize: 8.5, fontWeight: 900,
                            padding: '1px 6px', borderRadius: 8,
                            background: '#7C3AED', color: '#fff',
                          }}>{item.count}</span>
                        </td>
                      </tr>
                    );
                  }
                  return renderDataRow(item.row, item.rowIdx);
                })}
              </tbody>

              {/* ── Σ Aggregation Footer ── */}
              <tfoot>
                <tr style={{ background: M.surfMid, borderTop: `2px solid ${M.divider}` }}>
                  {/* Σ cell — purple (§F) */}
                  <td style={{ padding: `${pyV}px 8px`, borderRight: `1px solid ${M.divider}`, textAlign: 'center', background: '#ede9fe' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#7C3AED' }}>Σ</span>
                  </td>
                  {/* AGG label cell — purple */}
                  <td style={{ padding: `${pyV}px 6px`, borderRight: `1px solid ${M.divider}`, fontSize: 8, fontWeight: 900, color: '#7C3AED', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", background: '#ede9fe' }}>AGG</td>
                  {visCols.map(f => {
                    const fn     = aggs[f.key];
                    const hasAgg = fn && fn !== 'none';
                    const rawVal = hasAgg ? calcAgg(fn, f.key, sorted) : null;
                    const val    = hasAgg ? fmtAgg(rawVal, f, fn) : null;
                    const lbl    = hasAgg ? AGG_FNS.find(a => a.id === fn)?.label : '+ Calc';
                    const col    = hasAgg ? (AGG_COLORS[fn] || A.a) : M.textD;
                    return (
                      <td key={f.key} style={{ padding: `${pyV - 1}px 4px`, borderRight: `1px solid ${M.divider}` }}>
                        <button
                          onClick={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setAggAnchor({ col: f.key, rect });
                          }}
                          style={{
                            width: '100%', textAlign: 'left',
                            fontSize: 8.5, fontWeight: hasAgg ? 700 : 400,
                            color: col,
                            background: hasAgg ? `${col}15` : 'transparent',
                            border: `1px dashed ${hasAgg ? col : M.inputBd}`,
                            borderRadius: 3, padding: '2px 6px', cursor: 'pointer',
                            whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono',monospace",
                          }}
                        >
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

        {/* ── Add / Edit form panel ── */}
        {showAddForm && (
          <div style={{ width: 380, background: M.surfHigh, borderLeft: `1px solid ${M.divider}`, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,.12)', flexShrink: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${M.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{sheet.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: M.textD, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: uff }}>{editRow ? 'Edit Record' : 'New Record'}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: M.textA, fontFamily: uff }}>{editRow ? `Edit ${editRow[codeKey]}` : sheet.name}</div>
              </div>
              <button onClick={() => { setShowAddForm(false); setEditRow(null); setFormData({}); }} style={{ background: M.surfMid, border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: M.textB, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {formFields.map(f => {
                const isAuto = f.auto && !editRow;
                const baseStyle = { width: '100%', padding: '8px 12px', border: `1px solid ${isAuto ? M.bg : M.inputBd}`, borderRadius: 7, fontSize: fz - 1, fontFamily: f.mono ? "'IBM Plex Mono',monospace" : uff, background: isAuto ? M.surfMid : M.inputBg, color: isAuto ? M.textD : M.textA, outline: 'none', boxSizing: 'border-box' };
                let input;
                if (f.type === 'select' && f.options) {
                  input = (
                    <select disabled={isAuto} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, cursor: isAuto ? 'default' : 'pointer' }}>
                      <option value="">— Select —</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  );
                } else if (f.type === 'textarea') {
                  input = <textarea rows={3} disabled={isAuto} placeholder={f.header || `Enter ${f.label}…`} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ ...baseStyle, resize: 'vertical', minHeight: 60 }} />;
                } else if (f.type === 'date') {
                  input = <input type="date" disabled={isAuto} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                } else if (f.type === 'number') {
                  input = <input type="number" disabled={isAuto} placeholder={f.header || `Enter ${f.label}…`} value={formData[f.key] ?? ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                } else {
                  input = <input type="text" disabled={isAuto} placeholder={f.header || `Enter ${f.label}…`} value={formData[f.key] || ''} onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))} style={baseStyle} />;
                }
                return (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 900, color: M.textC, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, fontFamily: uff }}>
                      {f.label}
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
                {saving ? 'Saving…' : editRow ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
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
          {sheet.name} · FILE {fileKey}
        </div>
      </div>

      {/* ── AGG DROPDOWN (sibling outside table, opens UPWARD §F) ── */}
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
                {allFields.find(f => f.key === aggAnchor.col)?.label || aggAnchor.col}
              </span>
              <span onClick={() => setAggAnchor(null)} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 12, lineHeight: 1 }}>×</span>
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

      {/* ── Sort Panel ── */}
      {showSortPanel && (
        <SortPanel
          fields={allFields}
          sorts={sorts}
          onSorts={setSorts}
          onClose={() => setShowSortPanel(false)}
          M={M} A={A} uff={uff} fz={fz}
        />
      )}

      {/* ── Column Panel ── */}
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

      {/* ── Record Detail Modal ── */}
      {detailRow && (
        <RecordDetailModal
          record={detailRow}
          schema={schema}
          onClose={() => setDetailRow(null)}
          onEdit={(row) => { setDetailRow(null); openEdit(row); }}
          M={M} A={A} uff={uff} dff={dff} fz={fz}
        />
      )}

      {/* ── View Edit Modal (create / edit / duplicate) ── */}
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

      {/* ── View Switch Guard Modal (§C) ── */}
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
                  💾 Save changes → switch to "{switchGuard.targetViewName}"
                </button>
              )}
              {/* Discard + Switch */}
              <button onClick={() => {
                const t = switchGuard.targetViewName;
                setSwitchGuard(null);
                if (t === 'Default') loadView({ name: 'Default' });
                else { const v = savedViews.find(sv => sv.name === t); if (v) loadView(v); }
              }} style={{ padding: '9px 14px', border: `1px solid ${M.inputBd}`, borderRadius: 7, background: M.inputBg, color: M.textB, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}>
                Discard → switch to "{switchGuard.targetViewName}"
              </button>
              {/* Stay */}
              <button onClick={() => setSwitchGuard(null)} style={{ padding: '9px 14px', border: 'none', borderRadius: 7, background: M.surfMid, color: M.textA, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: uff, textAlign: 'left' }}>
                ← Stay on "{activeViewName}"
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Toast — bottom:24 right:24, color-aware (§COMMON) ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.color || '#0078D4', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: uff, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 340 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
