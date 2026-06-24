// Upstash Redis KV adapter — replaces Twilio Sync
// Uses Upstash Redis REST API (HTTP, works from any edge runtime).
// Docs: https://upstash.com/docs/redis/features/restapi
//
// Twilio Sync → Redis mapping:
//   SyncList     → Redis List   (RPUSH / LRANGE / LSET)
//   SyncMap      → Redis Hash   (HSET / HEXISTS / HKEYS)
//   SyncDocument → Redis String (SET / GET)

const redisUrl = () => process.env.UPSTASH_REDIS_URL;
const redisToken = () => process.env.UPSTASH_REDIS_TOKEN;

async function cmd(...args) {
  const r = await fetch(redisUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const d = await r.json();
  if (d.error) throw new Error('Redis: ' + d.error);
  return d.result;
}

module.exports = {
  // String / Document operations
  async get(key) {
    const v = await cmd('GET', key);
    return v ? JSON.parse(v) : null;
  },
  async set(key, value) {
    await cmd('SET', key, JSON.stringify(value));
  },

  // List operations (contact_queue, call_log)
  async listPush(key, ...items) {
    for (const item of items) await cmd('RPUSH', key, JSON.stringify(item));
  },
  async listRange(key, start = 0, end = -1) {
    const items = await cmd('LRANGE', key, start, end);
    return (items || []).map(i => JSON.parse(i));
  },
  async listSet(key, index, value) {
    await cmd('LSET', key, index, JSON.stringify(value));
  },
  async listLen(key) {
    return (await cmd('LLEN', key)) || 0;
  },
  async del(key) {
    await cmd('DEL', key);
  },

  // Hash operations (blacklist)
  async hset(key, field, value) {
    await cmd('HSET', key, field, JSON.stringify(value));
  },
  async hexists(key, field) {
    return !!(await cmd('HEXISTS', key, field));
  },
  async hkeys(key) {
    return (await cmd('HKEYS', key)) || [];
  },
};
