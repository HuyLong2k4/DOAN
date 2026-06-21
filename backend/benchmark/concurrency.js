// Kiểm chứng tính đúng đắn dưới tương tranh: nhiều receiver cùng connect MỘT đơn,
// kỳ vọng đúng 1 thành công (200), còn lại bị từ chối (409) — không double-booking.
//   node benchmark/concurrency.js
// Biến môi trường (tuỳ chọn): BENCH_BASE_URL, BENCH_DONOR, BENCH_RECEIVERS (CSV), BENCH_ITER.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { BASE, login, authHeaders, futureISO } = require('./lib');

const DONOR = process.env.BENCH_DONOR || '0905100001';
const RECEIVERS = (process.env.BENCH_RECEIVERS
  || '0906200001,0906200002,0906200003,0906200004,0906200005')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ITERATIONS = Number(process.env.BENCH_ITER || 10);

async function createDonation(token) {
  const r = await fetch(`${BASE}/food-donations`, {
    method: 'POST', headers: authHeaders(token),
    body: JSON.stringify({
      title: 'Race test ' + Date.now(), food_type: 'COOKED', storage_condition: 'ROOM',
      quantity: 5, unit: 'suất', expiration_datetime: futureISO(12), images: [],
    }),
  });
  const j = await r.json().catch(() => ({}));
  const id = j?.donation?._id || j?.data?.donation?._id || j?.donation?.id;
  if (!id) throw new Error('Không tạo được đơn để test: ' + (j.message || ('HTTP ' + r.status)));
  return id;
}

function connect(token, donationId) {
  return fetch(`${BASE}/food-donations/${donationId}/connect`, {
    method: 'PATCH', headers: authHeaders(token),
  }).then((r) => r.status).catch(() => 0);
}

function cancel(token, donationId) {
  return fetch(`${BASE}/food-donations/${donationId}/cancel`, {
    method: 'PATCH', headers: authHeaders(token),
  }).catch(() => {});
}

async function main() {
  console.log(`Base URL: ${BASE}`);
  const donor = await login(DONOR);
  const receivers = [];
  for (const r of RECEIVERS) receivers.push(await login(r));
  console.log(`Donor + ${receivers.length} receiver đã đăng nhập. Chạy ${ITERATIONS} vòng, mỗi vòng ${receivers.length} request connect ĐỒNG THỜI.\n`);

  const rows = [];
  let allCorrect = true;
  for (let i = 1; i <= ITERATIONS; i++) {
    const donationId = await createDonation(donor.token);
    const statuses = await Promise.all(receivers.map((rcv) => connect(rcv.token, donationId)));
    const success = statuses.filter((s) => s === 200).length;
    const rejected409 = statuses.filter((s) => s === 409).length;
    const correct = success === 1;
    if (!correct) allCorrect = false;
    rows.push({
      vong: i, request_dong_thoi: receivers.length,
      thanh_cong_200: success, tu_choi_409: rejected409, dung_ky_vong: correct ? 'OK' : 'SAI',
    });
    await cancel(donor.token, donationId);
  }

  console.log('=== Test đồng thời: nhiều receiver cùng connect 1 đơn ===');
  console.table(rows);
  console.log(`Kỳ vọng mỗi vòng đúng 1 thành công. Tổng kết: ${allCorrect ? 'ĐẠT — không có double-booking.' : 'CÓ LỖI — xuất hiện double-booking!'}`);
}

main().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
