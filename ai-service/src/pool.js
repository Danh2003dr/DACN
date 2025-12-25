async function promisePool(items, worker, concurrency = 6) {
  const results = new Array(items.length);
  let idx = 0;

  async function runOne() {
    while (idx < items.length) {
      const current = idx++;
      try {
        results[current] = await worker(items[current], current);
      } catch (err) {
        results[current] = { __error: true, error: err };
      }
    }
  }

  const runners = [];
  const c = Math.max(1, Math.min(concurrency, items.length || 1));
  for (let i = 0; i < c; i++) runners.push(runOne());
  await Promise.all(runners);
  return results;
}

module.exports = {
  promisePool
};


