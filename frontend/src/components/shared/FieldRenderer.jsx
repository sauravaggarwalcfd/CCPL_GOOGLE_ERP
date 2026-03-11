/**
 * CC ERP — FieldRenderer
 * File: src/components/shared/FieldRenderer.jsx
 *
 * THE core schema-driven component. Renders the correct input widget
 * for ANY field based on its iconType + renderType from the schema snapshot.
 *
 * All new CC ERP forms use this. Never hand-code field JSX again.
 *
 * Props:
 *   field      - schema field definition from getSchemaSnapshot()
 *   value      - current form value for this field
 *   onChange   - (fieldKey, newValue) => void
 *   M          - theme mode tokens (from CC ERP theme system)
 *   A          - accent tokens
 *   fz         - font size px (default 13)
 *   disabled   - force read-only
 *   error      - error string (shows below field)
 *   fkOptions  - { [fieldKey]: [{code, name}] } — FK dropdown options
 *
 * Renders by iconType:
 *   PRIMARY_KEY  → text + regex validation badge
 *   AUTO_CODE    → read-only accent badge (GAS generates)
 *   MANDATORY    → input (type from renderType) + red asterisk
 *   FK           → searchable select dropdown
 *   AUTO_DISPLAY → read-only accent tinted display
 *   CALCULATED   → read-only mono computed value
 *   SYNC         → chip multi-select panel
 *   TEXT         → plain input (type from renderType)
 *
 * renderType overrides the widget:
 *   text, textarea, number, currency, percentage,
 *   date, datetime, email, phone, gstin,
 *   url, image_url, doc_link, drive_file,
 *   boolean, radio, color_hex, rating
 */

import { useState, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MONO = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS = { fontFamily: "'Nunito Sans', sans-serif" };

const LBL_STYLE = (M, fz) => ({
  display: "block",
  fontSize: 9,
  fontWeight: 900,
  color: M.textC,
  marginBottom: 4,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  ...SANS,
});

const INPUT_BASE = (M, fz, hasError, isMandatory, A) => ({
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  border: `1px solid ${hasError ? "#ef4444" : isMandatory ? A.a + "66" : M.inputBd}`,
  background: M.inputBg,
  color: M.textA,
  fontSize: fz || 13,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s",
  ...SANS,
});

const AUTO_STYLE = (M, A) => ({
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  border: `1px solid ${A.a}44`,
  background: A.al,
  color: A.a,
  fontSize: 12,
  cursor: "not-allowed",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  ...MONO,
});

const CALC_STYLE = (M) => ({
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #06b6d433",
  background: "#06b6d411",
  color: "#06b6d4",
  fontSize: 12,
  cursor: "not-allowed",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  ...MONO,
});

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function FieldLabel({ field, M, fz, A }) {
  const isMandatory = field.mandatory;
  return (
    <span style={LBL_STYLE(M, fz)}>
      {field.displayLabel || field.label}
      {isMandatory && (
        <span style={{ color: "#ef4444", marginLeft: 3, fontSize: 10 }}>*</span>
      )}
    </span>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return (
    <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3, ...SANS }}>
      ⚠ {error}
    </div>
  );
}

function FieldHint({ hint, M }) {
  if (!hint) return null;
  return (
    <div style={{ fontSize: 10, color: M.textD, marginTop: 3, ...SANS }}>
      {hint}
    </div>
  );
}

// ─── WIDGET RENDERERS ─────────────────────────────────────────────────────────

// 🔒 Read-only: AUTO_CODE (#)
function AutoCodeWidget({ value, M, A }) {
  return (
    <div style={AUTO_STYLE(M, A)}>
      <span>{value || "Auto-generated"}</span>
      <span style={{ fontSize: 9, color: M.textD }}>🔒 GAS</span>
    </div>
  );
}

// 🔒 Read-only: AUTO_DISPLAY (←)
function AutoDisplayWidget({ value, M, A }) {
  return (
    <div style={AUTO_STYLE(M, A)}>
      <span>{value || "— Auto-filled —"}</span>
      <span style={{ fontSize: 9, color: M.textD }}>← GAS</span>
    </div>
  );
}

// 🔒 Read-only: CALCULATED (∑)
function CalculatedWidget({ value, M }) {
  return (
    <div style={CALC_STYLE(M)}>
      <span>{value ?? "0"}</span>
      <span style={{ fontSize: 9, color: "#06b6d4aa" }}>∑ Calc</span>
    </div>
  );
}

// → FK Dropdown
function FKDropdownWidget({ field, value, onChange, fkOptions, M, A, fz, error, disabled }) {
  const options = fkOptions?.[field.key] || [];
  return (
    <select
      value={value || ""}
      onChange={e => onChange(field.key, e.target.value)}
      disabled={disabled}
      style={{
        ...INPUT_BASE(M, fz, !!error, field.mandatory, A),
        cursor: disabled ? "not-allowed" : "pointer",
        paddingRight: 28,
      }}
    >
      <option value="">Select {field.displayLabel || field.label}…</option>
      {options.map(opt => (
        <option key={opt.code} value={opt.code}>
          {opt.code} — {opt.name}
        </option>
      ))}
    </select>
  );
}

// ⟷ Chip Multi-select (SYNC)
function ChipWidget({ field, value, onChange, fkOptions, M, A, fz, disabled }) {
  const [inputVal, setInputVal] = useState("");
  const selected = value ? String(value).split(",").map(s => s.trim()).filter(Boolean) : [];
  const options  = fkOptions?.[field.key] || [];

  const addChip = (code) => {
    if (!selected.includes(code)) {
      onChange(field.key, [...selected, code].join(", "));
    }
    setInputVal("");
  };

  const removeChip = (code) => {
    onChange(field.key, selected.filter(c => c !== code).join(", "));
  };

  const filtered = options.filter(o =>
    !selected.includes(o.code) &&
    (o.name.toLowerCase().includes(inputVal.toLowerCase()) ||
     o.code.toLowerCase().includes(inputVal.toLowerCase()))
  );

  return (
    <div style={{ border: `1px solid ${M.inputBd}`, borderRadius: 6,
      background: M.inputBg, minHeight: 38, padding: "4px 8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: selected.length ? 4 : 0 }}>
        {selected.map(code => {
          const opt = options.find(o => o.code === code);
          return (
            <span key={code} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 99,
              background: A.al, border: `1px solid ${A.a}44`,
              color: A.a, fontSize: 11, fontWeight: 700, ...SANS,
            }}>
              {opt?.name || code}
              {!disabled && (
                <button onClick={() => removeChip(code)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    color: A.a, padding: 0, fontSize: 11, lineHeight: 1 }}>
                  ✕
                </button>
              )}
            </span>
          );
        })}
        {!disabled && (
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder={selected.length ? "Add more…" : `Add ${field.displayLabel}…`}
            style={{ border: "none", background: "transparent", outline: "none",
              fontSize: fz || 13, color: M.textA, minWidth: 80, flex: 1, ...SANS }}
          />
        )}
      </div>
      {inputVal && filtered.length > 0 && (
        <div style={{ borderTop: `1px solid ${M.divider}`, marginTop: 4, paddingTop: 4 }}>
          {filtered.slice(0, 6).map(opt => (
            <div key={opt.code} onClick={() => addChip(opt.code)}
              style={{ padding: "4px 6px", cursor: "pointer", borderRadius: 4,
                fontSize: 12, color: M.textB, ...SANS,
                display: "flex", gap: 8, alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = M.hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ ...MONO, fontSize: 10, color: M.textD }}>{opt.code}</span>
              <span>{opt.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Plain text input (covers MANDATORY + TEXT + PRIMARY_KEY renderType=text)
function TextWidget({ field, value, onChange, M, A, fz, error, disabled, placeholder }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={e => onChange(field.key, e.target.value)}
      disabled={disabled}
      placeholder={placeholder || field.hint || field.description || ""}
      style={INPUT_BASE(M, fz, !!error, field.mandatory, A)}
    />
  );
}

// renderType: textarea
function TextareaWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <textarea
      value={value || ""}
      onChange={e => onChange(field.key, e.target.value)}
      disabled={disabled}
      placeholder={field.hint || field.description || ""}
      rows={3}
      style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A), resize: "vertical",
        lineHeight: 1.5 }}
    />
  );
}

// renderType: number
function NumberWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={e => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
      disabled={disabled}
      placeholder="0"
      style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A), textAlign: "right", ...MONO }}
    />
  );
}

// renderType: currency
function CurrencyWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <span style={{ padding: "6px 10px", background: M.surfMid,
        border: `1px solid ${M.inputBd}`, borderRight: "none",
        borderRadius: "6px 0 0 6px", color: "#10b981", fontWeight: 800,
        fontSize: fz || 13, display: "flex", alignItems: "center", ...MONO }}>₹</span>
      <input
        type="number"
        step="0.01"
        value={value ?? ""}
        onChange={e => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
        disabled={disabled}
        placeholder="0.00"
        style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A),
          borderRadius: "0 6px 6px 0", textAlign: "right", flex: 1, ...MONO }}
      />
    </div>
  );
}

// renderType: percentage
function PercentageWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <input
        type="number"
        min={0} max={100} step="0.1"
        value={value ?? ""}
        onChange={e => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
        disabled={disabled}
        placeholder="0"
        style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A),
          borderRadius: "6px 0 0 6px", textAlign: "right", flex: 1, ...MONO }}
      />
      <span style={{ padding: "6px 10px", background: M.surfMid,
        border: `1px solid ${M.inputBd}`, borderLeft: "none",
        borderRadius: "0 6px 6px 0", color: "#8b5cf6", fontWeight: 800,
        fontSize: fz || 13, display: "flex", alignItems: "center", ...MONO }}>%</span>
    </div>
  );
}

// renderType: date
function DateWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <input
      type="date"
      value={value || ""}
      onChange={e => onChange(field.key, e.target.value)}
      disabled={disabled}
      style={INPUT_BASE(M, fz, !!error, field.mandatory, A)}
    />
  );
}

// renderType: datetime
function DateTimeWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <input
      type="datetime-local"
      value={value || ""}
      onChange={e => onChange(field.key, e.target.value)}
      disabled={disabled}
      style={INPUT_BASE(M, fz, !!error, field.mandatory, A)}
    />
  );
}

// renderType: email
function EmailWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <span style={{ padding: "6px 10px", background: M.surfMid,
        border: `1px solid ${M.inputBd}`, borderRight: "none",
        borderRadius: "6px 0 0 6px", color: "#ec4899", fontWeight: 800,
        fontSize: fz || 13, display: "flex", alignItems: "center" }}>@</span>
      <input
        type="email"
        value={value || ""}
        onChange={e => onChange(field.key, e.target.value)}
        disabled={disabled}
        placeholder="name@domain.com"
        style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A),
          borderRadius: "0 6px 6px 0", flex: 1 }}
      />
    </div>
  );
}

// renderType: phone
function PhoneWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <span style={{ padding: "6px 10px", background: M.surfMid,
        border: `1px solid ${M.inputBd}`, borderRight: "none",
        borderRadius: "6px 0 0 6px", color: "#ec4899", fontSize: 11,
        display: "flex", alignItems: "center", ...MONO }}>+91</span>
      <input
        type="tel"
        value={value || ""}
        onChange={e => onChange(field.key, e.target.value.replace(/\D/g, "").slice(0, 10))}
        disabled={disabled}
        placeholder="9876543210"
        maxLength={10}
        style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A),
          borderRadius: "0 6px 6px 0", flex: 1, letterSpacing: 1, ...MONO }}
      />
    </div>
  );
}

// renderType: gstin
function GSTINWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  const isValid = value && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value);
  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={value || ""}
        onChange={e => onChange(field.key, e.target.value.toUpperCase().slice(0, 15))}
        disabled={disabled}
        placeholder="22AAAAA0000A1Z5"
        maxLength={15}
        style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A),
          textTransform: "uppercase", letterSpacing: 1, paddingRight: 60, ...MONO }}
      />
      {value && (
        <span style={{ position: "absolute", right: 8, top: "50%",
          transform: "translateY(-50%)", fontSize: 9, fontWeight: 800,
          color: isValid ? "#10b981" : "#ef4444" }}>
          {isValid ? "✓ VALID" : `${15 - (value?.length || 0)} left`}
        </span>
      )}
    </div>
  );
}

// renderType: url
function URLWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <input
        type="url"
        value={value || ""}
        onChange={e => onChange(field.key, e.target.value)}
        disabled={disabled}
        placeholder="https://…"
        style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A), flex: 1 }}
      />
      {value && (
        <a href={value} target="_blank" rel="noreferrer"
          style={{ padding: "6px 10px", borderRadius: 6,
            background: "#3b82f611", border: "1px solid #3b82f633",
            color: "#3b82f6", fontSize: 12, textDecoration: "none",
            display: "flex", alignItems: "center" }}>↗</a>
      )}
    </div>
  );
}

// renderType: image_url
function ImageURLWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  const [preview, setPreview] = useState(false);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      {/* Thumbnail */}
      <div onClick={() => value && setPreview(!preview)}
        style={{ width: 48, height: 48, borderRadius: 6, flexShrink: 0,
          background: value ? "transparent" : M.surfMid,
          border: `1px solid ${M.inputBd}`, overflow: "hidden",
          cursor: value ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
        {value
          ? <img src={value} alt="preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.style.display = "none"; }}/>
          : <span style={{ fontSize: 20 }}>🖼</span>
        }
      </div>
      {/* URL input + actions */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <input
          type="url"
          value={value || ""}
          onChange={e => onChange(field.key, e.target.value)}
          disabled={disabled}
          placeholder="https://drive.google.com/… or image URL"
          style={INPUT_BASE(M, fz, !!error, field.mandatory, A)}
        />
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => navigator.clipboard?.readText?.().then(t => onChange(field.key, t))}
            style={{ flex: 1, padding: "3px 0", borderRadius: 4, fontSize: 10,
              background: A.al, border: `1px solid ${A.a}33`,
              color: A.a, cursor: "pointer", fontWeight: 700, ...SANS }}>
            📎 Paste URL
          </button>
          {value && (
            <button onClick={() => setPreview(!preview)}
              style={{ flex: 1, padding: "3px 0", borderRadius: 4, fontSize: 10,
                background: M.surfMid, border: `1px solid ${M.inputBd}`,
                color: M.textC, cursor: "pointer", ...SANS }}>
              {preview ? "Hide" : "🔍 Preview"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// renderType: doc_link
function DocLinkWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ width: 34, height: 34, borderRadius: 5, flexShrink: 0,
          background: "#3b82f622", border: "1px solid #3b82f633",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {value ? "📄" : "📄"}
        </div>
        <input
          type="url"
          value={value || ""}
          onChange={e => onChange(field.key, e.target.value)}
          disabled={disabled}
          placeholder="https://drive.google.com/file/… or PDF URL"
          style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A), flex: 1 }}
        />
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {["📎 Paste Link", "📁 Google Drive", value && "↗ Open"].filter(Boolean).map(a => (
          <button key={String(a)}
            onClick={() => {
              if (String(a).includes("Open") && value) window.open(value, "_blank");
            }}
            style={{ flex: 1, padding: "3px 0", borderRadius: 4, fontSize: 10,
              background: M.surfMid, border: `1px solid ${M.inputBd}`,
              color: M.textC, cursor: "pointer", ...SANS }}>{a}</button>
        ))}
      </div>
    </div>
  );
}

// renderType: drive_file
function DriveFileWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center",
      padding: "8px 10px", borderRadius: 6,
      border: `1px solid ${error ? "#ef4444" : M.inputBd}`,
      background: M.inputBg, cursor: disabled ? "not-allowed" : "pointer",
      minHeight: 40 }}>
      <span style={{ fontSize: 20 }}>🗂</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: value ? M.textA : M.textD,
          fontWeight: value ? 600 : 400, ...SANS }}>
          {value || "No file attached"}
        </div>
        {!value && (
          <div style={{ fontSize: 10, color: M.textD, ...SANS }}>
            Click to browse Google Drive
          </div>
        )}
      </div>
      {!disabled && (
        <span style={{ fontSize: 11, color: A.a, fontWeight: 700, ...SANS }}>Browse →</span>
      )}
    </div>
  );
}

// renderType: boolean
function BooleanWidget({ field, value, onChange, M, A, disabled }) {
  const isOn = value === true || value === "Yes" || value === "TRUE";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={() => !disabled && onChange(field.key, !isOn ? "Yes" : "No")}
        disabled={disabled}
        style={{ width: 38, height: 22, borderRadius: 11, border: "none",
          background: isOn ? "#10b981" : M.divider, cursor: disabled ? "not-allowed" : "pointer",
          position: "relative", transition: "background .2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", width: 18, height: 18, borderRadius: 9,
          background: "#fff", top: 2, transition: "left .2s",
          left: isOn ? 18 : 2 }}/>
      </button>
      <span style={{ fontSize: 13, fontWeight: 700, ...SANS,
        color: isOn ? "#10b981" : M.textC }}>
        {isOn ? "Yes" : "No"}
      </span>
    </div>
  );
}

// renderType: radio (single choice from fkOptions)
function RadioWidget({ field, value, onChange, fkOptions, M, A, fz, disabled }) {
  const options = fkOptions?.[field.key] || [];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(opt => {
        const isSelected = value === opt.code;
        return (
          <label key={opt.code}
            style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
              padding: "4px 10px", borderRadius: 6,
              border: `1px solid ${isSelected ? A.a : M.inputBd}`,
              background: isSelected ? A.al : M.inputBg, fontSize: fz || 13, ...SANS }}>
            <input type="radio" name={field.key} value={opt.code}
              checked={isSelected}
              onChange={() => !disabled && onChange(field.key, opt.code)}
              style={{ accentColor: A.a }}/>
            {opt.name}
          </label>
        );
      })}
    </div>
  );
}

// renderType: color_hex
function ColorHexWidget({ field, value, onChange, M, A, fz, error, disabled }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: 6, flexShrink: 0,
        background: value || "#cccccc",
        border: `2px solid ${M.inputBd}`, overflow: "hidden" }}>
        <input type="color" value={value || "#cccccc"}
          onChange={e => !disabled && onChange(field.key, e.target.value.toUpperCase())}
          disabled={disabled}
          style={{ width: "100%", height: "100%", border: "none",
            padding: 0, cursor: disabled ? "not-allowed" : "pointer", background: "none" }}/>
      </div>
      <input
        type="text"
        value={value || ""}
        onChange={e => {
          const v = e.target.value.toUpperCase();
          onChange(field.key, v);
        }}
        disabled={disabled}
        placeholder="#RRGGBB"
        maxLength={7}
        style={{ ...INPUT_BASE(M, fz, !!error, field.mandatory, A),
          ...MONO, letterSpacing: 1, textTransform: "uppercase", flex: 1 }}
      />
      {value && (
        <span style={{ fontSize: 10, ...MONO, color: M.textD,
          background: M.surfMid, padding: "4px 8px", borderRadius: 4,
          border: `1px solid ${M.divider}` }}>
          {value}
        </span>
      )}
    </div>
  );
}

// renderType: rating
function RatingWidget({ field, value, onChange, M, disabled }) {
  const num = Number(value) || 0;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n}
          onClick={() => !disabled && onChange(field.key, n)}
          disabled={disabled}
          style={{ fontSize: 22, background: "transparent", border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            lineHeight: 1, padding: "0 2px", transition: "color .1s",
            color: n <= num ? "#f59e0b" : M.divider }}>
          ★
        </button>
      ))}
      {num > 0 && (
        <span style={{ fontSize: 11, color: M.textC, marginLeft: 6,
          alignSelf: "center", ...SANS }}>{num}/5</span>
      )}
    </div>
  );
}

// ─── MAIN FIELD RENDERER ──────────────────────────────────────────────────────

/**
 * FieldRenderer — renders the correct widget for any schema field
 */
export function FieldRenderer({
  field,
  value,
  onChange,
  M,
  A,
  fz = 13,
  disabled = false,
  error = null,
  fkOptions = {},
}) {
  if (!field) return null;

  const { iconType, renderType } = field;
  const isDisabled = disabled || field.autoGenerated || !field.editable;

  // ── GAS-owned: never editable ──────────────────────────────────────────────
  if (iconType === "AUTO_CODE") {
    return <AutoCodeWidget value={value} M={M} A={A} />;
  }

  if (iconType === "AUTO_DISPLAY") {
    return <AutoDisplayWidget value={value} M={M} A={A} />;
  }

  if (iconType === "CALCULATED") {
    return <CalculatedWidget value={value} M={M} />;
  }

  // ── FK Dropdown (→) ────────────────────────────────────────────────────────
  if (iconType === "FK") {
    if (renderType === "radio") {
      return <RadioWidget field={field} value={value} onChange={onChange}
        fkOptions={fkOptions} M={M} A={A} fz={fz} disabled={isDisabled} />;
    }
    return <FKDropdownWidget field={field} value={value} onChange={onChange}
      fkOptions={fkOptions} M={M} A={A} fz={fz} error={error} disabled={isDisabled} />;
  }

  // ── Chip Multi-select (⟷) ─────────────────────────────────────────────────
  if (iconType === "SYNC") {
    return <ChipWidget field={field} value={value} onChange={onChange}
      fkOptions={fkOptions} M={M} A={A} fz={fz} disabled={isDisabled} />;
  }

  // ── Editable fields — renderType picks the widget ──────────────────────────

  const props = { field, value, onChange, M, A, fz, error, disabled: isDisabled };

  switch (renderType) {
    case "textarea":    return <TextareaWidget   {...props} />;
    case "number":      return <NumberWidget     {...props} />;
    case "currency":    return <CurrencyWidget   {...props} />;
    case "percentage":  return <PercentageWidget {...props} />;
    case "date":        return <DateWidget       {...props} />;
    case "datetime":    return <DateTimeWidget   {...props} />;
    case "email":       return <EmailWidget      {...props} />;
    case "phone":       return <PhoneWidget      {...props} />;
    case "gstin":       return <GSTINWidget      {...props} />;
    case "url":         return <URLWidget        {...props} />;
    case "image_url":   return <ImageURLWidget   {...props} />;
    case "doc_link":    return <DocLinkWidget    {...props} />;
    case "drive_file":  return <DriveFileWidget  {...props} />;
    case "boolean":     return <BooleanWidget    {...props} />;
    case "radio":       return <RadioWidget      {...props} fkOptions={fkOptions} />;
    case "color_hex":   return <ColorHexWidget   {...props} />;
    case "rating":      return <RatingWidget     {...props} />;
    default:            return <TextWidget       {...props} />;
  }
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
/**
 * FieldWrapper — renders label + widget + error/hint as a complete form row.
 * Use this for standard form layouts.
 *
 * Usage:
 *   <FieldWrapper field={field} value={form[field.key]}
 *     onChange={handleChange} M={M} A={A} fz={fz}
 *     error={errors[field.key]} fkOptions={fkOptions} />
 */
export function FieldWrapper({
  field, value, onChange, M, A, fz = 13,
  disabled = false, error = null, fkOptions = {},
}) {
  if (!field) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FieldLabel field={field} M={M} fz={fz} A={A} />
      <FieldRenderer
        field={field} value={value} onChange={onChange}
        M={M} A={A} fz={fz} disabled={disabled}
        error={error} fkOptions={fkOptions}
      />
      <FieldError error={error} />
      {!error && <FieldHint hint={field.hint || field.description} M={M} />}
    </div>
  );
}

export default FieldRenderer;
