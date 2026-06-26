'use strict';

// In-process KV store — replaces Upstash Redis.
// State persists across requests while the Edge function instance is warm.
// API is a drop-in replacement for kv.js.

const strings = new Map();
const lists   = new Map();
const hashes  = new Map();

module.exports = {
  async get(key) {
    return strings.get(key) ?? null;
  },
  async set(key, value) {
    strings.set(key, value);
  },

  async listPush(key, ...items) {
    if (!lists.has(key)) lists.set(key, []);
    lists.get(key).push(...items);
  },
  async listRange(key, start = 0, end = -1) {
    const arr = lists.get(key) || [];
    return end === -1 ? arr.slice(start) : arr.slice(start, end + 1);
  },
  async listSet(key, index, value) {
    if (!lists.has(key)) lists.set(key, []);
    lists.get(key)[index] = value;
  },
  async listLen(key) {
    return (lists.get(key) || []).length;
  },
  async del(key) {
    strings.delete(key);
    lists.delete(key);
    hashes.delete(key);
  },

  async hset(key, field, value) {
    if (!hashes.has(key)) hashes.set(key, new Map());
    hashes.get(key).set(field, value);
  },
  async hexists(key, field) {
    return hashes.has(key) && hashes.get(key).has(field);
  },
  async hkeys(key) {
    return hashes.has(key) ? [...hashes.get(key).keys()] : [];
  },
};
