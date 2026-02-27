/**
 * Shared field rendering components: FieldInput, DtBadge, IcoCell
 * Adapted from reference to work with enriched SCHEMA_MAP fields.
 */

// ── Data Type Badge ──────────────────────────────────────────────────────────
const DT_MAP = {
  manual:   { bg: "#fff1f2", tx: "#9f1239", bd: "#fecdd3" },
  autocode: { bg: "#ede9fe", tx: "#6d28d9", bd: "#c4b5fd" },
  calc:     { bg: "#fff7ed", tx: "#c2410c", bd: "#fed7aa" },
  auto:     { bg: "#f0fdf4", tx: "#166534", bd: "#bbf7d0" },
  fk:       { bg: "#eff6ff", tx: "#1d4ed8", bd: "#bfdbfe" },
  multifk:  { bg: "#eef2ff", tx: "#4338ca", bd: "#c7d2fe" },
  dropdown: { bg: "#f0f9ff", tx: "#0369a1", bd: "#bae6fd" },
  text:     { bg: "#fafafa", tx: "#374151", bd: "#e5e7eb" },
  currency: { bg: "#fefce8", tx: "#854d0e", bd: "#fde68a" },
  number:   { bg: "#f0fdf4", tx: "#166534", bd: "#bbf7d0" },
  url:      { bg: "#f0fdfa", tx: "#0f766e", bd: "#99f6e4" },
  textarea: { bg: "#fafafa", tx: "#374151", bd: "#e5e7eb" },
  date:     { bg: "#fefce8", tx: "#854d0e", bd: "#fde68a" },
  select:   { bg: "#f0f9ff", tx: "#0369a1", bd: "#bae6fd" },
};

const DT_LABEL = {
  manual: "Manual", autocode: "AUTO #", calc: "∑ Calc", auto: "← Auto",
  fk: "→ FK", multifk: "⟷ Multi-FK", dropdown: "Dropdown", text: "Text",
  currency: "Currency ₹", number: "Number", url: "URL Link", textarea: "Text Area",
  date: "Date", select: "Dropdown",
};

export function DtBadge({ type }) {
  const d = DT_MAP[type] || DT_MAP.text;
  return (
    <span style={{
      display: "inline-block", padding: "2px 7px", borderRadius: 3,
      background: d.bg, color: d.tx, border: `1px solid ${d.bd}`,
      fontSize: 9, fontWeight: 800, whiteSpace: "nowrap",
    }}>
      {DT_LABEL[type] || type}
    </span>
  );
}

// ── Icon Cell ────────────────────────────────────────────────────────────────
export function IcoCell({ ico, A }) {
  if (ico === "🔑") return <span>🔑</span>;
  if (ico === "⚠") return <span style={{ color: "#ef4444", fontWeight: 900, fontSize: 13 }}>⚠</span>;
  if (ico === "→") return <span style={{ color: "#2563eb", fontWeight: 900, fontSize: 12 }}>→</span>;
  if (ico === "←") return <span style={{ color: "#059669", fontWeight: 900, fontSize: 12 }}>←</span>;
  if (ico === "⟷") return <span style={{ color: A?.a || "#E8690A", fontWeight: 900, fontSize: 12 }}>⟷</span>;
  if (ico === "∑") return <span style={{ color: "#c2410c", fontWeight: 900, fontSize: 12 }}>∑</span>;
  if (ico === "#") return <span style={{ color: "#6d28d9", fontWeight: 900, fontSize: 11 }}>#</span>;
  return <span style={{ color: "#9ca3af", fontSize: 10 }}>—</span>;
}

// ── Field Input ──────────────────────────────────────────────────────────────
/**
 * Render a form input for an enriched field.
 * Props: { field, val, onChange, M, A, uff, dff, compact, hasError }
 *   field  — enriched field object from enrichSchema
 *   val    — current value
 *   onChange — (newVal) => void
 */
export function FieldInput({ field, val, onChange, M, A, uff, dff, compact, hasError }) {
  const f = field;
  const isAuto = f.auto || ['calc', 'autocode', 'auto'].includes(f.fieldType);

  const base = {
    width: "100%",
    border: `1px solid ${hasError ? "#ef4444" : isAuto ? (A.a + "40") : M.inputBd}`,
    borderRadius: 4,
    padding: compact ? "3px 8px" : "5px 9px",
    fontSize: compact ? 11 : 12,
    outline: "none",
    background: isAuto ? A.al : M.inputBg,
    color: isAuto ? A.a : M.textA,
    fontFamily: f.mono ? (dff || "'IBM Plex Mono', monospace") : (uff || "'Nunito Sans', sans-serif"),
    fontWeight: f.mono ? 700 : 400,
    cursor: isAuto ? "not-allowed" : "text",
    boxSizing: "border-box",
  };

  // Auto / computed fields: read-only
  if (isAuto) {
    return (
      <input
        style={base}
        readOnly
        value={val || ""}
        placeholder={f.fieldType === "autocode" ? "← GAS generates code" : "← GAS auto-fills"}
      />
    );
  }

  // Textarea
  if (f.type === "textarea" || f.fieldType === "textarea") {
    return (
      <textarea
        rows={compact ? 2 : 3}
        style={{ ...base, resize: "vertical", minHeight: compact ? 40 : 60 }}
        value={val || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={f.hint || `Enter ${f.label}...`}
      />
    );
  }

  // Select / dropdown
  if (f.type === "select" && f.options) {
    return (
      <select style={{ ...base, cursor: "pointer" }} value={val || ""} onChange={e => onChange(e.target.value)}>
        <option value="">— Select —</option>
        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  // FK field (Phase 1: text input with FK label)
  if (f.fk) {
    return (
      <div style={{ position: "relative" }}>
        <input
          type="text"
          style={{ ...base, paddingRight: 60 }}
          value={val || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={f.hint || `FK: ${f.fk}`}
        />
        <span style={{
          position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
          fontSize: 8, fontWeight: 900, color: "#2563eb", background: "#eff6ff",
          border: "1px solid #bfdbfe", borderRadius: 3, padding: "1px 5px",
        }}>
          FK
        </span>
      </div>
    );
  }

  // Date
  if (f.type === "date") {
    return <input type="date" style={base} value={val || ""} onChange={e => onChange(e.target.value)} />;
  }

  // Number
  if (f.type === "number") {
    return <input type="number" style={base} value={val ?? ""} onChange={e => onChange(e.target.value)} placeholder="0" />;
  }

  // Default: text
  return (
    <input
      type="text"
      style={base}
      value={val || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={f.hint || `Enter ${f.label}...`}
    />
  );
}
