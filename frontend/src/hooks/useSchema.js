/**
 * CC ERP — useSchema Hook
 * File: src/hooks/useSchema.js
 *
 * Fetches + caches the schema snapshot for a single sheet.
 * Auto-fetches on mount. Returns schema, loading, error states.
 *
 * Usage:
 *   const { schema, loading, error } = useSchema("ARTICLE_MASTER");
 *
 * With force refresh:
 *   const { schema } = useSchema("ARTICLE_MASTER", { forceRefresh: true });
 *
 * Manual refresh:
 *   const { schema, refresh } = useSchema("ARTICLE_MASTER");
 *   <button onClick={refresh}>🔄 Refresh</button>
 */

import { useEffect, useCallback } from "react";
import { useSchemaContext } from "../context/SchemaContext";

/**
 * @param {string} sheetName - Google Sheet tab name e.g. "ARTICLE_MASTER"
 * @param {object} options
 * @param {boolean} options.forceRefresh - bypass cache on mount
 * @param {boolean} options.skip - don't fetch (useful for conditional hooks)
 * @returns {{ schema, loading, error, refresh }}
 */
export function useSchema(sheetName, options = {}) {
  const { forceRefresh = false, skip = false } = options;
  const { schemas, loading, errors, fetchSchema } = useSchemaContext();

  // Auto-fetch on mount (or when sheetName changes)
  useEffect(() => {
    if (!skip && sheetName) {
      fetchSchema(sheetName, forceRefresh);
    }
  }, [sheetName, skip]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh function
  const refresh = useCallback(() => {
    if (sheetName) fetchSchema(sheetName, true);
  }, [sheetName, fetchSchema]);

  return {
    schema:  schemas[sheetName]  || null,
    loading: loading[sheetName]  || false,
    error:   errors[sheetName]   || null,
    refresh,
  };
}

/**
 * useSchemaFields — shortcut to get just the fields array
 *
 * Usage:
 *   const { fields, loading } = useSchemaFields("ARTICLE_MASTER");
 */
export function useSchemaFields(sheetName, options = {}) {
  const { schema, loading, error, refresh } = useSchema(sheetName, options);
  return {
    fields:  schema?.fields || [],
    schema,
    loading,
    error,
    refresh,
  };
}

/**
 * useFieldDef — get one field's definition by key
 *
 * Usage:
 *   const articleCodeField = useFieldDef("ARTICLE_MASTER", "Article Code");
 */
export function useFieldDef(sheetName, fieldKey) {
  const { schema } = useSchema(sheetName);
  if (!schema?.fields) return null;
  return schema.fields.find(f => f.key === fieldKey) || null;
}
