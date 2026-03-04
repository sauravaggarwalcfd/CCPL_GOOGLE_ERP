import { useState, useEffect, useMemo } from 'react';
import { SCHEMA_MAP } from '../../constants/masterSchemas';
import { enrichSchema } from './helpers/enrichSchema';
import { makeDefaultViews } from './helpers/viewDefaults';
import DataEntryTab from './DataEntryTab';
import BulkEntryTab from './BulkEntryTab';
import FieldSpecsTab from './FieldSpecsTab';
import RecordsTab from './RecordsTab';
import ViewsBar from './ViewsBar';
import ViewBuilder from './ViewBuilder';
import ViewsPanel from './ViewsPanel';
import StatusBar from './StatusBar';
import ItemCategoryTab from './ItemCategoryTab';
import { ArticleMasterLayoutPanel } from './ArticleMasterTab';
import { ArticleDataEntryWrapper } from './ArticleDataEntryForm';
import { TrimMasterLayoutPanel } from './TrimMasterTab';
import api from '../../services/api';

// ── Mapping: raw → schema keys ──
function mapSchemaToRaw(formData, schema) {
  const raw = {};
  for (const field of schema) {
    if (field.header && formData[field.key] !== undefined && formData[field.key] !== '') {
      raw[field.header] = formData[field.key];
    }
  }
  return raw;
}

const FALLBACK_SCHEMA = [
  { key: "code",     label: "Code",     w: "140px", mono: true, auto: true },
  { key: "name",     label: "Name",     w: "1fr",   required: true },
  { key: "category", label: "Category", w: "120px" },
  { key: "status",   label: "Status",   w: "90px",  badge: true, type: "select", options: ["Active","Inactive"] },
  { key: "remarks",  label: "Remarks",  w: "0",     hidden: true, type: "textarea" },
];

const MAIN_TABS = [
  { id: "records", label: "Records",     icon: "📊" },
  { id: "entry",   label: "Data Entry",  icon: "✍" },
  { id: "bulk",    label: "Bulk Entry",  icon: "📑" },
  { id: "specs",   label: "Field Specs", icon: "📋" },
];

/**
 * SheetWorkspace — 3-tab workspace container.
 * Props: { sheet, fileKey, fileLabel, M, A, uff, dff, sheetCounts }
 */
export default function SheetWorkspace({ sheet, fileKey, fileLabel, M, A, uff, dff, fz = 13, pyV = 7, sheetCounts, canEdit = true }) {
  // ── Tab state ──
  const [mainTab, setMainTab] = useState("records");
  const [entryMode, setEntryMode] = useState("form");

  // ── Entry form state ──
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Views state ──
  const [viewsMap, setViewsMap] = useState({});
  const [activeViewId, setActiveViewId] = useState(null);
  const [showViewsPanel, setShowViewsPanel] = useState(false);
  const [showViewBuilder, setShowViewBuilder] = useState(false);
  const [editingView, setEditingView] = useState(null);

  // ── Enriched schema (memoized) ──
  const enrichedStatic = useMemo(() => enrichSchema(sheet.key), [sheet.key]);
  const schema = SCHEMA_MAP[sheet.key] || FALLBACK_SCHEMA;

  // ── LIVE DROPDOWN DATA from GAS API (article_master only) ──
  const [liveOpts, setLiveOpts] = useState(null);

  useEffect(() => {
    if (sheet.key !== 'article_master') { setLiveOpts(null); return; }
    let cancelled = false;
    async function fetchLiveDropdowns() {
      try {
        const [cats, dd] = await Promise.all([
          api.getItemCategories(),
          api.getArticleDropdowns(),
        ]);
        if (cancelled) return;
        const ov = {};
        // Header/description garbage from old GAS deployments
        const GARBAGE = new Set([
          'Gender', 'Fit Type', 'Neckline', 'Sleeve Type', 'Status', 'Season', 'Size Range',
          'Men/Women/Kids/Unisex', 'Regular/Slim/Relaxed/Oversized',
          'Round Neck/V-Neck/Collar etc.', 'Half/Full/Sleeveless etc.',
          'Active/Inactive/Development', 'SS25/AW26 examples', 'S-M-L-XL-XXL etc.',
        ]);
        const clean = (arr) => (arr || []).filter(v => v && !GARBAGE.has(v));
        const toVL  = (arr) => clean(arr).map(v => ({ v, l: v }));
        // L1/L2/L3 from ITEM_CATEGORIES
        if (Array.isArray(cats) && cats.length > 0) {
          const artCats = cats.filter(c => c.master === 'ARTICLE' && c.l1);
          const l1s = [...new Set(artCats.map(c => c.l1))];
          const l2s = [...new Set(artCats.map(c => c.l2).filter(Boolean))];
          const l3s = [...new Set(artCats.map(c => c.l3).filter(Boolean))];
          if (l1s.length) ov.article_l1 = l1s.map(v => ({ v, l: v }));
          if (l2s.length) ov.article_l2 = l2s.map(v => ({ v, l: v }));
          if (l3s.length) ov.article_l3 = l3s.map(v => ({ v, l: v }));
        }
        // Dropdowns from ARTICLE_DROPDOWNS sheet
        if (dd) {
          if (dd.gender)    ov.gender    = toVL(dd.gender);
          if (dd.fit)       ov.fit       = toVL(dd.fit);
          if (dd.neckline)  ov.neckline  = toVL(dd.neckline);
          if (dd.sleeve)    ov.sleeve    = toVL(dd.sleeve);
          if (dd.status)    ov.status    = toVL(dd.status);
          if (dd.season)    ov.season    = toVL(dd.season);
          if (dd.sizeRange) ov.sizeRange = toVL(dd.sizeRange);
        }
        setLiveOpts(ov);
      } catch (err) {
        console.warn('[SheetWorkspace] Failed to fetch live dropdowns:', err);
      }
    }
    fetchLiveDropdowns();
    return () => { cancelled = true; };
  }, [sheet.key]);

  // ── Merge live data into enriched schema ──
  const enriched = useMemo(() => {
    if (!liveOpts || sheet.key !== 'article_master') return enrichedStatic;
    return {
      ...enrichedStatic,
      fields: enrichedStatic.fields.map(f => {
        // Override FK data (l1Division→article_l1, l2Category→article_l2, etc.)
        if (f.fk && liveOpts[f.fk]) {
          return { ...f, fkData: liveOpts[f.fk] };
        }
        // Override dropdown opts (gender, fit, neckline, sleeve, status, season, sizeRange, colorNames)
        const metaOpts = f._optsKey; // we'll need to carry the opts key through
        if (f._optsKey && liveOpts[f._optsKey]) {
          return { ...f, opts: liveOpts[f._optsKey] };
        }
        return f;
      }),
    };
  }, [enrichedStatic, liveOpts, sheet.key]);

  // ── Initialize views when sheet changes ──
  useEffect(() => {
    setFormData({});
    setErrors({});
    setIsDirty(false);
    setActiveViewId(null);
    setMainTab("records");
    // Initialize views for this sheet if not already done
    setViewsMap(prev => {
      if (prev[sheet.key]) return prev;
      return { ...prev, [sheet.key]: makeDefaultViews(enriched) };
    });
  }, [sheet.key, enriched]);

  // ── Current views ──
  const currentViews = viewsMap[sheet.key] || [];
  const currentView = activeViewId ? currentViews.find(v => v.id === activeViewId) : null;
  const visibleKeys = currentView
    ? currentView.fields
    : enriched.fields.map(f => f.key);

  // ── HSN → GST% map for article_master auto-fill ──
  const HSN_GST = { "6105": "5", "6109": "5", "6110": "12", "6112": "12", "6103": "5" };
  const L2_HSN  = { "Tops - Polo": "6105", "Tops - Tee": "6109", "Sweatshirt": "6110", "Tracksuit": "6112", "Bottoms": "6103" };

  // ── Field change handler ──
  const handleFieldChange = (key, val) => {
    setIsDirty(true);
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
    // Article Master: auto-fill HSN + GST% when L2 changes
    if (sheet.key === 'article_master' && key === 'l2Category') {
      const hsn = L2_HSN[val] || '';
      const gst = hsn ? (HSN_GST[hsn] || '') : '';
      setFormData(prev => ({ ...prev, [key]: val, hsnCode: hsn, gstPct: gst }));
    } else {
      setFormData(prev => ({ ...prev, [key]: val }));
    }
  };

  // ── Validate ──
  const validate = () => {
    const errs = {};
    enriched.fields.filter(f => f.required).forEach(f => {
      const v = formData[f.key];
      if (!v || String(v).trim() === "") errs[f.key] = `${f.label} is required`;
    });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    return true;
  };

  // ── Save handler ──
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const rawRecord = mapSchemaToRaw(formData, schema);
      await api.saveMasterRecord(sheet.key, fileLabel, rawRecord, false);
      setToast("Record saved to sheet");
      setFormData({});
      setErrors({});
      setIsDirty(false);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast("Error: " + err.message);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  // ── Clear handler ──
  const handleClear = () => {
    setFormData({});
    setErrors({});
    setIsDirty(false);
  };

  // ── Edit from Layout Panel → pre-load DataEntry form and switch tab ──
  const handleEditFromLayout = (art) => {
    if (!canEdit) return;
    const fd = {};
    enriched.fields.forEach(f => {
      if (art[f.key] !== undefined) fd[f.key] = art[f.key];
    });
    setFormData(fd);
    setErrors({});
    setIsDirty(false);
    setMainTab("entry");
    setEntryMode("form");
  };

  // ── Bulk save handler ──
  const handleBulkSave = async (rowsData) => {
    setSaving(true);
    let saved = 0;
    try {
      for (const row of rowsData) {
        const rawRecord = mapSchemaToRaw(row, schema);
        await api.saveMasterRecord(sheet.key, fileLabel, rawRecord, false);
        saved++;
      }
      setToast(`${saved} record${saved > 1 ? "s" : ""} saved to sheet`);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(`Saved ${saved} records. Error: ${err.message}`);
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // ── View CRUD ──
  const activateView = (id) => {
    setActiveViewId(id);
    if (id) setShowViewsPanel(false);
  };

  const saveView = (vdata) => {
    const ts = Date.now();
    if (editingView) {
      setViewsMap(prev => ({
        ...prev,
        [sheet.key]: prev[sheet.key].map(v => v.id === editingView.id ? { ...v, ...vdata } : v),
      }));
      setToast(`View "${vdata.name}" updated`);
    } else {
      const newV = { ...vdata, id: `custom-${ts}`, isSystem: false };
      setViewsMap(prev => ({
        ...prev,
        [sheet.key]: [...(prev[sheet.key] || []), newV],
      }));
      setActiveViewId(`custom-${ts}`);
      setToast(`View "${vdata.name}" created`);
    }
    setShowViewBuilder(false);
    setEditingView(null);
    setTimeout(() => setToast(null), 3000);
  };

  const duplicateView = (v) => {
    const dup = { ...v, id: `dup-${Date.now()}`, name: `${v.name} (copy)`, isSystem: false, fields: [...v.fields] };
    setViewsMap(prev => ({
      ...prev,
      [sheet.key]: [...(prev[sheet.key] || []), dup],
    }));
    setToast(`"${v.name}" duplicated`);
    setTimeout(() => setToast(null), 3000);
  };

  const deleteView = (id) => {
    setViewsMap(prev => ({
      ...prev,
      [sheet.key]: (prev[sheet.key] || []).filter(v => v.id !== id),
    }));
    if (activeViewId === id) setActiveViewId(null);
    setToast("View deleted");
    setTimeout(() => setToast(null), 3000);
  };

  const openEditView = (v) => { setEditingView(v); setShowViewBuilder(true); setShowViewsPanel(false); };
  const openNewView = () => { setEditingView(null); setShowViewBuilder(true); setShowViewsPanel(false); };

  // ── Stats ──
  const stats = {
    mandatory: enriched.fields.filter(f => f.required).length,
    auto: enriched.fields.filter(f => f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType)).length,
    fk: enriched.fields.filter(f => f.fk).length,
    filled: Object.keys(formData).filter(k => formData[k]).length,
  };

  // ── Dedicated UI for Item Categories ──
  if (sheet.key === "item_categories") {
    return <ItemCategoryTab M={M} A={A} uff={uff} dff={dff} />;
  }

  // ── Extra tabs for Article Master + Trim Master (Layout View appended to existing tabs) ──
  const isArticleMaster = sheet.key === "article_master";
  const isTrimMaster    = sheet.key === "trim_master";
  const displayTabs = (isArticleMaster || isTrimMaster)
    ? [...MAIN_TABS, { id: "layout", label: "Layout View", icon: "🖼" }]
    : MAIN_TABS;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Master Header ── */}
      <div style={{ padding: "10px 16px 0", background: M.surfHigh, borderBottom: `1px solid ${M.divider}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16 }}>{sheet.icon}</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: M.textA, fontFamily: uff }}>{sheet.name}</span>
          <span style={{ background: A.al, border: `1px solid ${A.a}40`, color: A.a, borderRadius: 4, padding: "2px 9px", fontSize: 10, fontWeight: 900, fontFamily: dff }}>{enriched.totalCols} COLS</span>
          <span style={{ fontSize: 10, color: M.textC, fontFamily: uff }}>{sheet.desc}</span>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
          {displayTabs.map(t => {
            const active = mainTab === t.id;
            return (
              <button key={t.id} onClick={() => setMainTab(t.id)} style={{
                padding: "8px 18px", border: "none", cursor: "pointer",
                background: active ? M.surfHigh : M.surfLow || M.bg,
                borderTop: `2px solid ${active ? A.a : "transparent"}`,
                borderRight: `1px solid ${active ? M.divider : "transparent"}`,
                borderLeft: `1px solid ${active ? M.divider : "transparent"}`,
                borderBottom: `1px solid ${active ? M.surfHigh : M.divider}`,
                marginBottom: active ? -1 : 0, borderRadius: "5px 5px 0 0",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 11, fontWeight: active ? 900 : 700, color: active ? A.a : M.textC, fontFamily: uff }}>{t.icon} {t.label}</span>
                {(t.id === "entry" || t.id === "bulk") && isDirty && <span style={{ background: "#f59e0b", width: 6, height: 6, borderRadius: "50%" }} />}
                {t.id === "records" && (
                  <span style={{ background: active ? A.a : M.surfMid, color: active ? "#fff" : M.textD, borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 900 }}>
                    {sheetCounts?.[sheet.key] ?? "—"}
                  </span>
                )}
                {t.id === "specs" && (
                  <span style={{ background: active ? A.a : M.surfMid, color: active ? "#fff" : M.textD, borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 900 }}>
                    {enriched.totalCols}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, paddingBottom: 6, paddingRight: 2 }}>
            {/* Entry mode toggle */}
            {mainTab === "entry" && (
              <>
                <div style={{ width: 1, height: 16, background: M.divider }} />
                <div style={{ display: "flex", background: M.surfLow || M.bg, border: `1px solid ${M.inputBd}`, borderRadius: 5, overflow: "hidden" }}>
                  {[{ id: "form", label: "📋 Form" }, { id: "inline", label: "⚡ Inline" }].map(v => (
                    <button key={v.id} onClick={() => setEntryMode(v.id)} style={{
                      padding: "4px 12px", border: "none", cursor: "pointer", fontSize: 9.5,
                      fontWeight: entryMode === v.id ? 900 : 700,
                      background: entryMode === v.id ? A.a : M.surfLow || M.bg,
                      color: entryMode === v.id ? "#fff" : M.textC,
                      fontFamily: uff, transition: "all .15s",
                    }}>{v.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Active View Banner ── */}
      {currentView && mainTab === "entry" && !isArticleMaster && (
        <div style={{ padding: "5px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${M.divider}`, background: `${currentView.color}09`, flexShrink: 0 }}>
          <div style={{ width: 3, height: 14, background: currentView.color, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 900, color: currentView.color, fontFamily: uff }}>VIEW:</span>
          <span style={{ fontSize: 12 }}>{currentView.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: M.textA, fontFamily: uff }}>{currentView.name}</span>
          {currentView.desc && <span style={{ fontSize: 9.5, color: M.textC, fontFamily: uff }}>— {currentView.desc}</span>}
          <span style={{ background: currentView.color, color: "#fff", borderRadius: 10, padding: "1px 8px", fontSize: 9, fontWeight: 900 }}>{currentView.fields.length} of {enriched.totalCols} fields</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => openEditView(currentView)} style={{ padding: "3px 10px", border: `1px solid ${currentView.color}`, borderRadius: 4, background: `${currentView.color}10`, color: currentView.color, fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>Edit</button>
          <button onClick={() => activateView(null)} style={{ padding: "3px 10px", border: "1px solid #ef4444", borderRadius: 4, background: "#fef2f2", color: "#ef4444", fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: uff }}>✕ Clear</button>
        </div>
      )}

      {/* ── Views Bar (Data Entry tab only — Bulk tab has its own views) ── */}
      {mainTab === "entry" && !isArticleMaster && (
        <ViewsBar
          views={currentViews}
          activeViewId={activeViewId}
          onActivate={activateView}
          onNew={openNewView}
          onManage={() => setShowViewsPanel(true)}
          M={M} A={A} uff={uff} dff={dff}
        />
      )}

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {mainTab === "entry" && isArticleMaster && (
          <ArticleDataEntryWrapper M={M} A={A} uff={uff} dff={dff} />
        )}
        {mainTab === "entry" && !isArticleMaster && (
          <DataEntryTab
            enriched={enriched}
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            isDirty={isDirty}
            entryMode={entryMode}
            visibleKeys={visibleKeys}
            onClear={handleClear}
            onSave={handleSave}
            saving={saving}
            M={M} A={A} uff={uff} dff={dff}
          />
        )}
        {mainTab === "bulk" && (
          <BulkEntryTab
            enriched={enriched}
            sheet={sheet}
            onSaveBulk={handleBulkSave}
            saving={saving}
            M={M} A={A} uff={uff} dff={dff}
          />
        )}
        {mainTab === "specs" && (
          <FieldSpecsTab
            enriched={enriched}
            M={M} A={A} uff={uff} dff={dff}
          />
        )}
        {mainTab === "records" && (
          <RecordsTab
            sheet={sheet}
            fileKey={fileKey}
            fileLabel={fileLabel}
            M={M} A={A} uff={uff} dff={dff} fz={fz} pyV={pyV}
            sheetCounts={sheetCounts}
          />
        )}
        {mainTab === "layout" && isArticleMaster && (
          <ArticleMasterLayoutPanel M={M} A={A} uff={uff} dff={dff} canEdit={canEdit} onEditRecord={handleEditFromLayout} />
        )}
        {mainTab === "layout" && isTrimMaster && (
          <TrimMasterLayoutPanel M={M} A={A} uff={uff} dff={dff} canEdit={canEdit} onEditRecord={handleEditFromLayout} />
        )}
      </div>

      {/* ── Status Bar ── */}
      <StatusBar
        enriched={enriched}
        currentView={currentView}
        visibleKeys={visibleKeys}
        mainTab={mainTab}
        entryMode={entryMode}
        formData={formData}
        M={M} A={A} uff={uff} dff={dff}
      />

      {/* ── Views Panel ── */}
      {showViewsPanel && (
        <ViewsPanel
          enriched={enriched}
          views={currentViews}
          activeId={activeViewId}
          onActivate={id => { activateView(id); setShowViewsPanel(false); }}
          onEdit={openEditView}
          onDuplicate={duplicateView}
          onDelete={deleteView}
          onNew={openNewView}
          onClose={() => setShowViewsPanel(false)}
          M={M} A={A} uff={uff} dff={dff}
        />
      )}

      {/* ── View Builder ── */}
      {showViewBuilder && (
        <ViewBuilder
          enriched={enriched}
          editView={editingView}
          onSave={saveView}
          onCancel={() => { setShowViewBuilder(false); setEditingView(null); }}
          M={M} A={A} uff={uff} dff={dff}
        />
      )}

      {/* ── Toast — bottom:24 right:24 (§COMMON) ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#0078D4", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: uff, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", maxWidth: 340 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
