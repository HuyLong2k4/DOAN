// Tiện ích dùng chung cho các script benchmark.
// Yêu cầu Node 18+ (có sẵn global fetch).

const BASE = (process.env.BENCH_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const PASSWORD = process.env.BENCH_PASSWORD || '123456';

// Đăng nhập bằng số điện thoại (hoặc email) -> trả về { token, userId }.
async function login(identifier, password = PASSWORD) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const json = await res.json().catch(() => ({}));
  const token = json.accessToken || json.token || json.data?.accessToken || json.data?.token;
  if (!res.ok || !token) {
    throw new Error(`Đăng nhập thất bại cho ${identifier}: HTTP ${res.status} ${json.message || ''}`);
  }
  const user = json.user || json.data?.user || {};
  return { token, userId: String(user.id || user._id || ''), raw: json };
}

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function summarize(latencies) {
  const s = [...latencies].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    mean: s.length ? +(sum / s.length).toFixed(1) : 0,
    p50: +percentile(s, 50).toFixed(1),
    p95: +percentile(s, 95).toFixed(1),
    p99: +percentile(s, 99).toFixed(1),
    max: s.length ? +s[s.length - 1].toFixed(1) : 0,
  };
}

// Chạy `total` request bằng `concurrency` worker chạy song song; fn() thực hiện
// một request và trả { ok: boolean }. Trả về { latencies[], errors, elapsedMs }.
async function runLoad(fn, total, concurrency) {
  const latencies = [];
  let errors = 0;
  let dispatched = 0;
  const start = Date.now();

  async function worker() {
    while (dispatched < total) {
      dispatched += 1;
      const t0 = Date.now();
      try {
        const r = await fn();
        latencies.push(Date.now() - t0);
        if (!r || r.ok === false) errors += 1;
      } catch {
        latencies.push(Date.now() - t0);
        errors += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return { latencies, errors, elapsedMs: Date.now() - start };
}

function futureISO(hours = 12) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

module.exports = { BASE, PASSWORD, login, authHeaders, percentile, summarize, runLoad, futureISO };
