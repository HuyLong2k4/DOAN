require('dotenv').config();
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db/index');
const path = require('path');
const { createChatSocketServer } = require('./socket/chatSocket');
const FoodDonationService = require('./app/services/foodDonationService');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Tin proxy của Railway/Nginx → req.protocol đọc đúng X-Forwarded-Proto (https).
// Cần thiết để URL upload (avatar/chat) được sinh ra với https://, không bị mixed-content.
app.set('trust proxy', 1);

// CORS: đọc whitelist từ env. Để trống hoặc "*" → cho phép tất cả (dev only).
const allowedOriginsEnv = (process.env.ALLOWED_ORIGINS || '').trim();
const corsOptions = allowedOriginsEnv && allowedOriginsEnv !== '*'
  ? { origin: allowedOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean), credentials: true }
  : { origin: true, credentials: true };

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Healthcheck cho Docker / load balancer
app.get('/health', (_, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

// ========== Routes ==========
const authRoutes         = require('./app/routes/authRoutes');
const userRoutes         = require('./app/routes/userRoutes');
const profileRoutes      = require('./app/routes/profileRoutes');
const foodDonationRoutes = require('./app/routes/foodDonationRoutes');
const foodRequestRoutes  = require('./app/routes/foodRequestRoutes');
const chatRoutes         = require('./app/routes/chatRoutes');
const feedbackRoutes     = require('./app/routes/feedbackRoutes');
const reportRoutes       = require('./app/routes/reportRoutes');
const notificationRoutes = require('./app/routes/notificationRoutes');

app.use('/api/auth',            authRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/profile',         profileRoutes);
app.use('/api/food-donations',  foodDonationRoutes);
app.use('/api/food-requests',   foodRequestRoutes);
app.use('/api/chat',            chatRoutes);
app.use('/api/feedback',        feedbackRoutes);
app.use('/api/reports',         reportRoutes);
app.use('/api/notifications',   notificationRoutes);

app.get('/', (_, res) => res.send('Hello world'));

const server = http.createServer(app);
// Lưu io vào app để các controller REST (vd. gửi tin nhắn qua HTTP fallback) phát
// được socket event cho người nhận — đồng bộ với đường socket.
const io = createChatSocketServer(server);
app.set('io', io);

server.listen(PORT, '0.0.0.0', () =>
  console.log(`Server listening on port ${PORT}`)
);

// ── Cron tasks ──────────────────────────────────────────────────────────────
const EXPIRE_INTERVAL_MS = 15 * 60 * 1000;        // 15 phút
const AUTO_CONFIRM_INTERVAL_MS = 60 * 60 * 1000;  // 1 giờ
const AUTO_CONFIRM_TIMEOUT_HOURS = 24;            // auto-confirm sau 24h không phản hồi
const NO_SHOW_INTERVAL_MS = 30 * 60 * 1000;       // 30 phút
const NO_SHOW_TIMEOUT_HOURS = 6;                  // auto-cancel ON_THE_WAY sau 6h

const runExpireSweep = () => {
  FoodDonationService.expireOverdueDonations()
    .then((res) => {
      if (res?.expired_count > 0) {
        console.log(`[expire-cron] expired ${res.expired_count} donations`);
      }
    })
    .catch((err) => console.error('[expire-cron] error:', err?.message || err));

  FoodDonationService.expireStaleSelfPickups()
    .then((res) => {
      if (res?.expired_count > 0) {
        console.log(`[expire-cron] expired ${res.expired_count} stale self-pickups`);
      }
    })
    .catch((err) => console.error('[expire-cron] error:', err?.message || err));
};

const runAutoConfirmSweep = () => {
  FoodDonationService.autoConfirmStaleDeliveries(AUTO_CONFIRM_TIMEOUT_HOURS)
    .then((res) => {
      if (res?.confirmed_count > 0) {
        console.log(`[auto-confirm-cron] auto-confirmed ${res.confirmed_count} deliveries`);
      }
    })
    .catch((err) => console.error('[auto-confirm-cron] error:', err?.message || err));
};

const runNoShowSweep = () => {
  FoodDonationService.cancelStaleOnTheWayDeliveries(NO_SHOW_TIMEOUT_HOURS)
    .then((res) => {
      if (res?.cancelled_count > 0) {
        console.log(`[no-show-cron] cancelled ${res.cancelled_count} stale ON_THE_WAY deliveries`);
      }
    })
    .catch((err) => console.error('[no-show-cron] error:', err?.message || err));
};

// Chạy lần đầu sau 60s (đợi DB connect ổn định).
setTimeout(runExpireSweep, 60 * 1000);
setTimeout(runAutoConfirmSweep, 90 * 1000);
setTimeout(runNoShowSweep, 120 * 1000);

setInterval(runExpireSweep, EXPIRE_INTERVAL_MS);
setInterval(runAutoConfirmSweep, AUTO_CONFIRM_INTERVAL_MS);
setInterval(runNoShowSweep, NO_SHOW_INTERVAL_MS);