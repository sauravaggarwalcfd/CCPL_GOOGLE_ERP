import { SCHEMA_MAP } from '../../../constants/masterSchemas';
import { FIELD_META } from '../../../constants/masterFieldMeta';

const FALLBACK_SCHEMA = [
  { key: "code",     label: "Code",     w: "140px", mono: true, auto: true },
  { key: "name",     label: "Name",     w: "1fr",   required: true },
  { key: "category", label: "Category", w: "120px" },
  { key: "status",   label: "Status",   w: "90px",  badge: true, type: "select", options: ["Active","Inactive"] },
  { key: "remarks",  label: "Remarks",  w: "0",     hidden: true, type: "textarea" },
];

/** Convert 0-based index to Excel-style column letter (0→A, 25→Z, 26→AA) */
function colLetter(i) {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

/** Infer a richer field type from basic SCHEMA_MAP properties */
function inferFieldType(field) {
  if (field.auto) return 'auto';
  if (field.type === 'select') return 'dropdown';
  if (field.type === 'number') return 'number';
  if (field.type === 'date') return 'date';
  if (field.type === 'textarea') return 'textarea';
  return 'text';
}

/**
 * Merge SCHEMA_MAP schema with optional FIELD_META enrichment.
 * Returns { id, fields[], sections[], totalCols }.
 * Schemas without FIELD_META gracefully degrade to a single flat section.
 */
export function enrichSchema(sheetKey) {
  const schema = SCHEMA_MAP[sheetKey] || FALLBACK_SCHEMA;
  const meta = FIELD_META[sheetKey] || null;

  const enrichedFields = schema.map((field, i) => {
    const col = colLetter(i);
    const fm = meta?.fields?.[field.key] || {};
    return {
      ...field,
      col,
      ico: fm.ico || (field.auto ? '←' : field.required ? '⚠' : '—'),
      fk: fm.fk || null,
      hint: fm.hint || field.header || `Enter ${field.label}`,
      fieldType: fm.fieldType || inferFieldType(field),
    };
  });

  // Build sections from meta or fallback to single section
  const sections = meta?.sections
    ? meta.sections.map(sec => ({
        id: sec.id,
        icon: sec.icon,
        title: sec.title,
        cols: sec.keys
          .map(key => { const f = enrichedFields.find(ef => ef.key === key); return f ? f.col : null; })
          .filter(Boolean),
      }))
    : [{ id: 'all', icon: '📋', title: 'All Fields', cols: enrichedFields.map(f => f.col) }];

  return {
    id: sheetKey,
    fields: enrichedFields,
    sections,
    totalCols: enrichedFields.length,
  };
}
