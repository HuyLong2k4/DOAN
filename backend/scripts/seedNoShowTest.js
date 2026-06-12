/**
 * Seed 1 kịch bản test: VOLUNTEER ĐÃ LẤY HÀNG NHƯNG KHÔNG GIAO cho receiver.
 *
 * Trạng thái tạo ra (đúng điều kiện để bấm "report-no-show"):
 *   - FoodDonation.status = 'PICKED_UP'   (volunteer đã lấy, đang trên đường giao)
 *   - Delivery.status     = 'ON_THE_WAY'  (picked_up_at đã set, delivered_at = null)
 *   - delivery_type       = 'VIA_AGENT'
 *
 * Luồng cần test:
 *   Receiver mở Tracking → bấm "Báo không giao hàng"
 *   → PATCH /api/food-donations/:id/report-no-show
 *   → delivery + donation chuyển CANCELLED, notify donor + volunteer.
 *   (Chỉ chạy được khi delivery.status === 'ON_THE_WAY' — xem receiverActions.js)
 *
 * Yêu cầu: đã chạy `node scripts/seed.js` trước để có sẵn 3 tài khoản dưới đây.
 * Idempotent: chạy lại sẽ xoá donation/delivery test cũ (theo title marker) rồi tạo lại.
 *
 * Chạy:  node scripts/seedNoShowTest.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../src/app/models/userModel');
const FoodDonation = require('../src/app/models/foodDonationModel');
const Delivery = require('../src/app/models/deliveryModel');
const Conversation = require('../src/app/models/conversationModel');
const Message = require('../src/app/models/messageModel');
const Notification = require('../src/app/models/notificationModel');

// ── Cấu hình kịch bản ───────────────────────────────────────────────────────
const DONOR_PHONE     = '0905100005'; // Hoàng Anh Tuấn (Ba Đình) — đã có profile + toạ độ
const RECEIVER_PHONE  = '0906200007'; // Hoàng Văn Sơn  (Cầu Giấy)
const VOLUNTEER_PHONE = '0907300004'; // Phạm Quốc Bảo  (Hai Bà Trưng)

const MARKER_TITLE = '[TEST no-show] Cơm hộp volunteer ôm hàng không giao';
const H = (h) => new Date(Date.now() + h * 3600 * 1000); // h<0 = quá khứ, h>0 = tương lai

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('Thiếu MONGO_URI trong backend/.env');

  await mongoose.connect(uri);
  console.log('✅ Đã kết nối:', mongoose.connection.host, '/', mongoose.connection.name);

  // 1) Lấy 3 tài khoản (phải tồn tại — chạy seed.js trước nếu chưa có)
  const [donor, receiver, volunteer] = await Promise.all([
    User.findOne({ phone_number: DONOR_PHONE }).lean(),
    User.findOne({ phone_number: RECEIVER_PHONE }).lean(),
    User.findOne({ phone_number: VOLUNTEER_PHONE }).lean(),
  ]);

  const missing = [
    !donor && `donor ${DONOR_PHONE}`,
    !receiver && `receiver ${RECEIVER_PHONE}`,
    !volunteer && `volunteer ${VOLUNTEER_PHONE}`,
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(`Thiếu tài khoản: ${missing.join(', ')}. Hãy chạy "node scripts/seed.js" trước.`);
  }

  // 2) Dọn donation/delivery test cũ (idempotent)
  const old = await FoodDonation.find({ title: MARKER_TITLE, donor_id: donor._id }).select('_id').lean();
  const oldIds = old.map((d) => d._id);
  if (oldIds.length) {
    await Promise.all([
      Delivery.deleteMany({ donation_id: { $in: oldIds } }),
      Conversation.deleteMany({ donation_id: { $in: oldIds } }),
      FoodDonation.deleteMany({ _id: { $in: oldIds } }),
    ]);
    console.log(`🧹 Đã xoá ${oldIds.length} donation test cũ cùng delivery/hội thoại.`);
  }

  // 3) Tạo donation PICKED_UP
  const donation = await FoodDonation.create({
    donor_id: donor._id,
    selected_receiver_id: receiver._id,
    volunteer_id: volunteer._id,
    selected_at: H(-3),
    delivery_type: 'VIA_AGENT',
    title: MARKER_TITLE,
    description: 'Kịch bản test: volunteer đã lấy hàng lúc ~1.5h trước nhưng chưa giao tới receiver.',
    food_type: 'COOKED',
    quantity: 30,
    unit: 'suất',
    expiration_datetime: H(6),
    status: 'PICKED_UP',
  });

  // 4) Tạo delivery ON_THE_WAY (đã pickup, chưa giao)
  const pickupCode = String(Math.floor(1000 + Math.random() * 9000));
  const delivery = await Delivery.create({
    donation_id: donation._id,
    donor_id: donor._id,
    receiver_id: receiver._id,
    volunteer_id: volunteer._id,
    delivery_type: 'VIA_AGENT',
    status: 'ON_THE_WAY',
    pickup_code: pickupCode,
    assigned_at: H(-2),
    picked_up_at: H(-1.5),
    delivered_at: null,
    cancelled_at: null,
  });
  await FoodDonation.updateOne({ _id: donation._id }, { $set: { delivery_id: delivery._id } });

  // 5) (tuỳ chọn) Hội thoại receiver ↔ volunteer + 1 thông báo cho thật
  const conv = await Conversation.create({
    participants: [receiver._id, volunteer._id],
    pair_key: [String(receiver._id), String(volunteer._id)].sort().join(':'),
    donation_id: donation._id,
    delivery_id: delivery._id,
    is_active: true,
    last_message_text: 'Anh ơi em chờ mãi chưa thấy hàng tới ạ?',
    last_message_at: H(-0.2),
    last_sender_id: receiver._id,
  });
  const t0 = Date.now() - 0.5 * 3600 * 1000;
  await Message.insertMany([
    { conversation_id: conv._id, sender_id: volunteer._id, text: 'Anh lấy hàng xong rồi nhé, đang trên đường.', attachments: [], seen_by: [receiver._id], createdAt: new Date(t0), updatedAt: new Date(t0) },
    { conversation_id: conv._id, sender_id: receiver._id, text: 'Anh ơi em chờ mãi chưa thấy hàng tới ạ?', attachments: [], seen_by: [], createdAt: new Date(t0 + 6 * 60 * 1000), updatedAt: new Date(t0 + 6 * 60 * 1000) },
  ], { timestamps: false });

  await Notification.create({
    user_id: receiver._id,
    title: 'Tình nguyện viên đang giao hàng',
    message: `TNV ${volunteer.full_name} đã lấy "${donation.title}" và đang trên đường giao.`,
    type: 'VOLUNTEER_ON_THE_WAY',
    related_entity_type: 'FoodDonation',
    related_entity_id: donation._id,
    is_read: false,
  });

  // ── Tóm tắt ────────────────────────────────────────────────────────────────
  console.log('\n🎯 Đã tạo kịch bản test "volunteer ôm hàng không giao":');
  console.log('   Donation ID :', donation._id.toString(), '| status =', donation.status);
  console.log('   Delivery ID :', delivery._id.toString(), '| status =', delivery.status, '| picked_up_at =', delivery.picked_up_at.toISOString());
  console.log('   pickup_code :', pickupCode);
  console.log('\n👥 Đăng nhập (mật khẩu mọi tài khoản: 123456):');
  console.log(`   Receiver  : ${RECEIVER_PHONE} (${receiver.full_name})  ← người bấm "report-no-show"`);
  console.log(`   Volunteer : ${VOLUNTEER_PHONE} (${volunteer.full_name})`);
  console.log(`   Donor     : ${DONOR_PHONE} (${donor.full_name})`);
  console.log('\n🧪 Cách test API trực tiếp:');
  console.log(`   PATCH /api/food-donations/${donation._id}/report-no-show   (JWT của receiver)`);
  console.log('   → kỳ vọng: delivery + donation chuyển CANCELLED, donor & volunteer nhận thông báo VOLUNTEER_NO_SHOW.\n');

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Seed lỗi:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
