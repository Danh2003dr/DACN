const nowMs = () => Date.now();

class TTLCache {
  constructor({ ttlMs = 60000 } = {}) {
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  get(key) {
    const item = this.map.get(key);
    if (!item) return undefined;
    if (item.expiresAt <= nowMs()) {
      this.map.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key, value) {
    this.map.set(key, { value, expiresAt: nowMs() + this.ttlMs });
  }

  delete(key) {
    this.map.delete(key);
  }
}

module.exports = {
  TTLCache
};


