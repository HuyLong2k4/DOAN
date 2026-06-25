// Đo độ trễ + thông lượng các API REST tiêu biểu bằng autocannon.
//   npm i -D autocannon        (cài một lần)
//   node benchmark/api-latency.js
// Biến môi trường (tuỳ chọn): BENCH_BASE_URL, BENCH_VU, BENCH_DURATION, BENCH_N_WRITE,
//   BENCH_DONOR, BENCH_RECEIVER, BENCH_LAT, BENCH_LON.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { BASE, PASSWORD, login, futureISO } = require('./lib');

let autocannon;
try {
  autocannon = require('autocannon');
} catch {
  console.error('Thiếu gói autocannon. Cài bằng: npm i -D autocannon');
  process.exit(1);
}

const LAT = process.env.BENCH_LAT || 21.0285;        // Hà Nội (khớp dữ liệu seed)
const LON = process.env.BENCH_LON || 105.8542;
const VU = Number(process.env.BENCH_VU || 10);             // số kết nối đồng thời
const DURATION = Number(process.env.BENCH_DURATION || 10); // giây — cho endpoint đọc
const WRITE_AMOUNT = Number(process.env.BENCH_N_WRITE || 50); // tổng request — cho endpoint ghi

const DONOR = process.env.BENCH_DONOR || '0905100001';
const RECEIVER = process.env.BENCH_RECEIVER || '0906200001';
const COOLDOWN = Number(process.env.BENCH_COOLDOWN || 4000); // ms nghỉ giữa các phép đo để server hồi

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Bọc autocannon ở dạng Promise (dùng callback để chạy đúng với mọi phiên bản).
function run(opts) {
  return new Promise((resolve, reject) => {
    autocannon({ connections: VU, pipelining: 1, ...opts }, (err, res) => (err ? reject(err) : resolve(res)));
  });
}

async function main() {
  console.log(`Base URL: ${BASE} | VU: ${VU} | duration (đọc): ${DURATION}s | amount (ghi): ${WRITE_AMOUNT}\n`);
  const donor = await login(DONOR);
  const receiver = await login(RECEIVER);
  const H = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

  const cases = [
    {
      name: 'POST /auth/login',
      opts: {
        url: `${BASE}/auth/login`, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: RECEIVER, password: PASSWORD }),
        amount: Math.max(WRITE_AMOUNT, VU),
      },
    },
    {
      name: 'GET /food-donations (lọc vị trí)',
      opts: { url: `${BASE}/food-donations?lat=${LAT}&lon=${LON}`, headers: H(receiver.token), duration: DURATION },
    },
    {
      name: 'GET /notifications',
      opts: { url: `${BASE}/notifications`, headers: H(receiver.token), duration: DURATION },
    },
    {
      name: 'GET /food-donations/my',
      opts: { url: `${BASE}/food-donations/my`, headers: H(donor.token), duration: DURATION },
    },
    {
      name: 'POST /food-donations (tạo đơn)',
      opts: {
        url: `${BASE}/food-donations`, method: 'POST', headers: H(donor.token),
        body: JSON.stringify({
          title: 'Benchmark donation', food_type: 'COOKED', storage_condition: 'ROOM',
          quantity: 5, unit: 'suất', expiration_datetime: futureISO(12), images: [],
        }),
        amount: Math.max(WRITE_AMOUNT, VU),
      },
    },
  ];

  const rows = [];
  for (const c of cases) {
    process.stdout.write(`Đang đo: ${c.name} ... `);
    const r = await run(c.opts);
    const sent = r.requests.sent || r.requests.total || 0;
    const twoxx = r['2xx'] || 0;
    rows.push({
      endpoint: c.name,
      VU,
      TB_ms: r.latency.average,
      p50_ms: r.latency.p50,
      'p97.5_ms': r.latency.p97_5,
      p99_ms: r.latency.p99,
      'req/s': r.requests.average,
      'loi_%': sent ? +(((sent - twoxx) / sent) * 100).toFixed(2) : 0,
    });
    console.log('xong');
    await sleep(COOLDOWN);
  }

  console.log(`\n=== API latency (autocannon, VU=${VU}) ===`);
  console.table(rows);
  console.log('Ghi chú: autocannon báo p97.5 (gần p95) và p99 cho đuôi trễ. POST tạo đơn sinh dữ liệu thật — chạy lại "node scripts/seed.js" để dọn.');
}

main().catch((e) => { console.error('Lỗi benchmark:', e.message); process.exit(1); });
