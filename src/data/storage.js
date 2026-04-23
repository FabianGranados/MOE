const PREFIX = 'moe-';

async function get(key) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v == null ? null : { value: v };
  } catch {
    return null;
  }
}

async function set(key, value) {
  try { localStorage.setItem(PREFIX + key, value); } catch {}
}

async function del(key) {
  try { localStorage.removeItem(PREFIX + key); } catch {}
}

export const storage = { get, set, delete: del };

export async function loadJSON(key, fallback) {
  const r = await storage.get(key);
  if (!r?.value) return fallback;
  try { return JSON.parse(r.value); } catch { return fallback; }
}

export async function saveJSON(key, value) {
  await storage.set(key, JSON.stringify(value));
}
