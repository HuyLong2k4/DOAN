// Đo độ trễ kênh thời gian thực (Socket.IO): thời gian khứ hồi (RTT) của sự kiện
// chat:send tính theo ack callback của server.
//   npm i socket.io-client      (chỉ cần cho script này)
//   node benchmark/realtime-rtt.js
// Biến môi trường: BENCH_SOCKET_URL (mặc định suy từ BENCH_BASE_URL bỏ /api),
//   BENCH_RT_USER, BENCH_CONVERSATION_ID, BENCH_RT_SAMPLES.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { BASE, login, summarize } = require('./lib');

let ioClient;
try {
  ioClient = require('socket.io-client');
} catch {
  console.error('Thiếu gói socket.io-client. Cài bằng: npm i socket.io-client');
  process.exit(1);
}
const io = ioClient.io || ioClient.default || ioClient;

const SOCKET_URL = process.env.BENCH_SOCKET_URL || BASE.replace(/\/api$/, '');
const USER = process.env.BENCH_RT_USER || '0906200001';
const CONVERSATION_ID = process.env.BENCH_CONVERSATION_ID || '';
const SAMPLES = Number(process.env.BENCH_RT_SAMPLES || 50);

function emitTimed(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const timer = setTimeout(() => reject(new Error('timeout chờ ack')), 10000);
    socket.emit(event, payload, (ack) => {
      clearTimeout(timer);
      if (ack && ack.success === false) return reject(new Error(ack.message || 'ack lỗi'));
      resolve(Date.now() - t0);
    });
  });
}

async function main() {
  const user = await login(USER);
  console.log(`Socket URL: ${SOCKET_URL} | user: ${USER}`);

  const socket = io(SOCKET_URL, { auth: { token: user.token }, transports: ['websocket'], reconnection: false });

  const connectStart = Date.now();
  await new Promise((res, rej) => {
    socket.on('connect', res);
    socket.on('connect_error', (e) => rej(new Error('connect_error: ' + e.message)));
    setTimeout(() => rej(new Error('connect timeout')), 10000);
  });
  console.log(`Bắt tay (handshake) + xác thực JWT: ${Date.now() - connectStart} ms`);

  if (!CONVERSATION_ID) {
    console.log('\nChưa đặt BENCH_CONVERSATION_ID → chỉ đo handshake.');
    console.log('Đặt biến này bằng id một hội thoại mà user là thành viên (mở một cuộc chat trong app hoặc lấy từ collection conversations) để đo RTT gửi tin nhắn.');
    socket.close();
    return;
  }

  await emitTimed(socket, 'chat:join', { conversation_id: CONVERSATION_ID });

  const rtts = [];
  for (let i = 0; i < SAMPLES; i++) {
    const ms = await emitTimed(socket, 'chat:send', { conversation_id: CONVERSATION_ID, text: `bench ${Date.now()}` });
    rtts.push(ms);
  }
  const s = summarize(rtts);
  console.log(`\n=== Realtime RTT (chat:send ack), ${SAMPLES} mẫu ===`);
  console.table([{ su_kien: 'chat:send (ack)', so_mau: s.n, rtt_trung_binh_ms: s.mean, p95_ms: s.p95, p99_ms: s.p99 }]);
  console.log('Lưu ý: mỗi mẫu tạo 1 tin nhắn thật trong hội thoại — chạy lại seed để dọn nếu cần.');
  socket.close();
}

main().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
