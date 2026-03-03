/**
 * dataCache.js — Session-level in-memory cache for GAS API responses.
 *
 * Prevents redundant API calls when navigating between tabs/sheets.
 * Each entry has a configurable TTL (default 5 minutes).
 * Invalidation is key-based or prefix-based for targeted cache clearing.
 */

const _cache = {};
const _timestamps = {};
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const dataCache = {
  /**
   * Get a cached value. Returns null if expired or not found.
   */
  get(key) {
    const ts = _timestamps[key];
    if (!ts || Date.now() - ts > (this._ttls?.[key] || DEFAULT_TTL)) {
      delete _cache[key];
      delete _timestamps[key];
      return null;
    }
    return _cache[key];
  },

  /**
   * Store a value in cache with optional TTL override.
   */
  set(key, data, ttl = DEFAULT_TTL) {
    _cache[key] = data;
    _timestamps[key] = Date.now();
    if (ttl !== DEFAULT_TTL) {
      if (!this._ttls) this._ttls = {};
      this._ttls[key] = ttl;
    }
  },

  /**
   * Remove a single cache entry.
   */
  invalidate(key) {
    delete _cache[key];
    delete _timestamps[key];
  },

  /**
   * Remove all cache entries whose key starts with the given prefix.
   */
  invalidatePrefix(prefix) {
    Object.keys(_cache).forEach(k => {
      if (k.startsWith(prefix)) {
        delete _cache[k];
        delete _timestamps[k];
      }
    });
  },

  /**
   * Clear all cached data.
   */
  clear() {
    Object.keys(_cache).forEach(k => {
      delete _cache[k];
      delete _timestamps[k];
    });
  }
};

export default dataCache;
