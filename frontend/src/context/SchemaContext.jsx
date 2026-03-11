/**
 * CC ERP — Schema Context
 * File: src/context/SchemaContext.jsx
 *
 * Caches getSchemaSnapshot() results across the app.
 * Prevents redundant GAS calls when multiple components
 * need the same sheet's schema.
 *
 * Usage:
 *   1. Wrap <App /> with <SchemaProvider>
 *   2. Use useSchema("ARTICLE_MASTER") hook anywhere
 */

import { createContext, useContext, useState, useCallback, useRef } from "react";

// ─── Context Definition ───────────────────────────────────────────────────────

const SchemaContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SchemaProvider({ children }) {
  // Map: sheetName → schema snapshot object
  const [schemas, setSchemas] = useState({});

  // Map: sheetName → loading state
  const [loading, setLoading] = useState({});

  // Map: sheetName → error string
  const [errors, setErrors] = useState({});

  // Track in-flight requests to prevent duplicate calls
  const inFlight = useRef({});

  /**
   * Store a schema snapshot for a sheet
   */
  const setSchema = useCallback((sheetName, snapshot) => {
    setSchemas(prev => ({ ...prev, [sheetName]: snapshot }));
  }, []);

  /**
   * Fetch schema for a sheet via GAS.
   * Deduplicates concurrent calls for the same sheet.
   *
   * @param {string} sheetName
   * @param {boolean} forceRefresh - bypass local cache
   */
  const fetchSchema = useCallback((sheetName, forceRefresh = false) => {
    if (!sheetName) return;

    // Already in local cache and not forcing refresh
    if (schemas[sheetName] && !forceRefresh) return;

    // Already fetching this sheet
    if (inFlight.current[sheetName]) return;

    inFlight.current[sheetName] = true;
    setLoading(prev => ({ ...prev, [sheetName]: true }));
    setErrors(prev => ({ ...prev, [sheetName]: null }));

    // GAS call
    if (window.google?.script?.run) {
      window.google.script.run
        .withSuccessHandler((snapshot) => {
          setSchemas(prev => ({ ...prev, [sheetName]: snapshot }));
          setLoading(prev => ({ ...prev, [sheetName]: false }));
          delete inFlight.current[sheetName];
        })
        .withFailureHandler((err) => {
          setErrors(prev => ({ ...prev, [sheetName]: err?.message || "Schema fetch failed" }));
          setLoading(prev => ({ ...prev, [sheetName]: false }));
          delete inFlight.current[sheetName];
        })
        .getSchemaSnapshot(sheetName, forceRefresh);
    } else {
      // Dev mode — use mock data
      import("../mocks/schemaMocks.js")
        .then(m => {
          const mock = m.MOCK_SCHEMAS[sheetName];
          if (mock) {
            setSchemas(prev => ({ ...prev, [sheetName]: mock }));
          } else {
            setErrors(prev => ({ ...prev, [sheetName]: `No mock schema for ${sheetName}` }));
          }
        })
        .catch(() => {
          setErrors(prev => ({ ...prev, [sheetName]: "Dev: schemaMocks.js not found" }));
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, [sheetName]: false }));
          delete inFlight.current[sheetName];
        });
    }
  }, [schemas]);

  /**
   * Fetch all schemas at once (for Schema Viewer)
   */
  const fetchAllSchemas = useCallback(() => {
    if (window.google?.script?.run) {
      window.google.script.run
        .withSuccessHandler((allSnapshots) => {
          setSchemas(prev => ({ ...prev, ...allSnapshots }));
          const loadingOff = {};
          Object.keys(allSnapshots).forEach(k => { loadingOff[k] = false; });
          setLoading(prev => ({ ...prev, ...loadingOff }));
        })
        .withFailureHandler((err) => {
          console.error("getAllSchemaSnapshots failed:", err);
        })
        .getAllSchemaSnapshots();
    }
  }, []);

  /**
   * Invalidate + re-fetch a single sheet's schema
   * (call after Schema Editor applies a change)
   */
  const invalidateSchema = useCallback((sheetName) => {
    setSchemas(prev => {
      const next = { ...prev };
      delete next[sheetName];
      return next;
    });
    fetchSchema(sheetName, true);
  }, [fetchSchema]);

  const value = {
    schemas,
    loading,
    errors,
    setSchema,
    fetchSchema,
    fetchAllSchemas,
    invalidateSchema,
  };

  return (
    <SchemaContext.Provider value={value}>
      {children}
    </SchemaContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the schema context.
 * Throws if used outside <SchemaProvider>.
 */
export function useSchemaContext() {
  const ctx = useContext(SchemaContext);
  if (!ctx) throw new Error("useSchemaContext must be used within <SchemaProvider>");
  return ctx;
}

export { SchemaContext };
