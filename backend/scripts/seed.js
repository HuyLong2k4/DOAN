/**
 * Seed dữ liệu demo (Hà Nội) cho app Food Sharing.
 *
 * - Idempotent: chạy lại nhiều lần không nhân đôi. Tài khoản upsert theo phone,
 *   hồ sơ upsert theo user_id. Donation/request/delivery/feedback/notification
 *   của riêng các tài khoản seed sẽ bị xoá rồi tạo lại để giữ trạng thái sạch.
 * - Chỉ tác động dữ liệu của tài khoản seed (phone 0900/0905/0906/0907...),
 *   không đụng dữ liệu thật khác trong DB.
 *
 * Chạy:  node scripts/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/app/models/userModel');
const DonorProfile = require('../src/app/models/donorProfileModel');
const ReceiverProfile = require('../src/app/models/receiverProfileModel');
const VolunteerProfile = require('../src/app/models/volunteerProfileModel');
const FoodDonation = require('../src/app/models/foodDonationModel');
const FoodRequest = require('../src/app/models/foodRequestModel');
const Delivery = require('../src/app/models/deliveryModel');
const Feedback = require('../src/app/models/feedbackModel');
const Notification = require('../src/app/models/notificationModel');

const PASSWORD = '123456';
const H   = (h) => new Date(Date.now() + h * 3600 * 1000); // tương lai
const AGO = (h) => new Date(Date.now() - h * 3600 * 1000); // quá khứ
const code4 = () => String(Math.floor(1000 + Math.random() * 9000));

// ─────────────────────────────── DỮ LIỆU ───────────────────────────────────

const USERS = [
  { phone: '0900000001', name: 'Quản trị viên',   role: 'ADMIN'     },
  // Donors
  { phone: '0905100001', name: 'Trần Minh Quân',  role: 'DONOR'     },
  { phone: '0905100002', name: 'Lê Thị Hoa',      role: 'DONOR'     },
  { phone: '0905100003', name: 'Phạm Văn Hùng',   role: 'DONOR'     },
  { phone: '0905100004', name: 'Nguyễn Thị Lan',  role: 'DONOR'     },
  { phone: '0905100005', name: 'Hoàng Anh Tuấn',  role: 'DONOR'     },
  { phone: '0905100006', name: 'Đỗ Thu Hằng',     role: 'DONOR'     },
  // Receivers
  { phone: '0906200001', name: 'Nguyễn Văn Phúc', role: 'RECEIVER'  },
  { phone: '0906200002', name: 'Trần Thị Bích',   role: 'RECEIVER'  },
  { phone: '0906200003', name: 'Lê Quang Vinh',   role: 'RECEIVER'  },
  { phone: '0906200004', name: 'Phan Thị Hồng',   role: 'RECEIVER'  },
  { phone: '0906200005', name: 'Võ Minh Trí',     role: 'RECEIVER'  },
  { phone: '0906200006', name: 'Nguyễn Thị Tư',   role: 'RECEIVER'  },
  // Volunteers
  { phone: '0907300001', name: 'Vũ Đức Thắng',    role: 'VOLUNTEER' },
  { phone: '0907300002', name: 'Trần Thị Mai',    role: 'VOLUNTEER' },
  { phone: '0907300003', name: 'Lê Hoàng Nam',    role: 'VOLUNTEER' },
  { phone: '0907300004', name: 'Phạm Quốc Bảo',   role: 'VOLUNTEER' },
  { phone: '0907300005', name: 'Ngô Thị Thanh',   role: 'VOLUNTEER' },
];

const DONOR_PROFILES = [
  { phone: '0905100001', donor_type: 'RESTAURANT', business_name: 'Nhà hàng Hương Việt', contact_name: 'Trần Minh Quân', address_line: '124 Hàng Bông, Hoàn Kiếm',       city: 'Hà Nội', pin_code: '100000', latitude: 21.0285, longitude: 105.8542 },
  { phone: '0905100002', donor_type: 'BAKERY',     business_name: 'Tiệm bánh Ngọt Lành',  contact_name: 'Lê Thị Hoa',     address_line: '88 Tây Sơn, Đống Đa',           city: 'Hà Nội', pin_code: '100000', latitude: 21.0167, longitude: 105.8300 },
  { phone: '0905100003', donor_type: 'RESTAURANT', business_name: 'Nhà hàng Biển Đông',   contact_name: 'Phạm Văn Hùng',  address_line: '27 Bạch Mai, Hai Bà Trưng',     city: 'Hà Nội', pin_code: '100000', latitude: 21.0050, longitude: 105.8550 },
  { phone: '0905100004', donor_type: 'BAKERY',     business_name: 'Bánh mì Cô Ba',        contact_name: 'Nguyễn Thị Lan', address_line: '15 Cầu Giấy, Cầu Giấy',         city: 'Hà Nội', pin_code: '100000', latitude: 21.0360, longitude: 105.7900 },
  { phone: '0905100005', donor_type: 'INDIVIDUAL', business_name: null,                   contact_name: 'Hoàng Anh Tuấn', address_line: '56 Đội Cấn, Ba Đình',           city: 'Hà Nội', pin_code: '100000', latitude: 21.0353, longitude: 105.8145 },
  { phone: '0905100006', donor_type: 'INDIVIDUAL', business_name: null,                   contact_name: 'Đỗ Thu Hằng',    address_line: '102 Nguyễn Trãi, Thanh Xuân',   city: 'Hà Nội', pin_code: '100000', latitude: 20.9950, longitude: 105.8050 },
];

const RECEIVER_PROFILES = [
  { phone: '0906200001', receiver_type: 'ORPHANAGE', organization_name: 'Mái ấm Hy Vọng',          contact_name: 'Nguyễn Văn Phúc', address_line: '33 Thái Hà, Đống Đa',        city: 'Hà Nội', pin_code: '100000', latitude: 21.0180, longitude: 105.8280 },
  { phone: '0906200002', receiver_type: 'NGO',       organization_name: 'Quỹ Từ Thiện Nhân Ái',     contact_name: 'Trần Thị Bích',   address_line: '12 Tràng Thi, Hoàn Kiếm',    city: 'Hà Nội', pin_code: '100000', latitude: 21.0300, longitude: 105.8520 },
  { phone: '0906200003', receiver_type: 'SHELTER',   organization_name: 'Nhà tình thương Bình An',  contact_name: 'Lê Quang Vinh',   address_line: '5 Giải Phóng, Hoàng Mai',    city: 'Hà Nội', pin_code: '100000', latitude: 20.9750, longitude: 105.8500 },
  { phone: '0906200004', receiver_type: 'NGO',       organization_name: 'Hội Chữ Thập Đỏ Hà Nội',   contact_name: 'Phan Thị Hồng',   address_line: '70 Liễu Giai, Ba Đình',      city: 'Hà Nội', pin_code: '100000', latitude: 21.0360, longitude: 105.8150 },
  { phone: '0906200005', receiver_type: 'TRUST',     organization_name: 'Quỹ Bảo Trợ Trẻ Em',       contact_name: 'Võ Minh Trí',     address_line: '41 Minh Khai, Hai Bà Trưng', city: 'Hà Nội', pin_code: '100000', latitude: 21.0070, longitude: 105.8500 },
  { phone: '0906200006', receiver_type: 'INDIVIDUAL',organization_name: null,                       contact_name: 'Nguyễn Thị Tư',   address_line: '9 Khương Trung, Thanh Xuân', city: 'Hà Nội', pin_code: '100000', latitude: 20.9960, longitude: 105.8060 },
];

const VOLUNTEER_PROFILES = [
  { phone: '0907300001', contact_name: 'Vũ Đức Thắng',  address_line: '200 Lý Thường Kiệt, Hoàn Kiếm', city: 'Hà Nội', pin_code: '100000', latitude: 21.0290, longitude: 105.8500, availability_days: 'ALL_WEEKEND',           availability_time: 'AFTERNOON', delivery_goal: 20, is_active: true  },
  { phone: '0907300002', contact_name: 'Trần Thị Mai',  address_line: '45 Láng Hạ, Đống Đa',           city: 'Hà Nội', pin_code: '100000', latitude: 21.0150, longitude: 105.8250, availability_days: 'ALL_WEEKDAYS',          availability_time: 'MORNING',   delivery_goal: 15, is_active: true  },
  { phone: '0907300003', contact_name: 'Lê Hoàng Nam',  address_line: '18 Xuân Thủy, Cầu Giấy',        city: 'Hà Nội', pin_code: '100000', latitude: 21.0340, longitude: 105.7950, availability_days: 'ANY_DAY',               availability_time: 'NIGHT',     delivery_goal: 30, is_active: true  },
  { phone: '0907300004', contact_name: 'Phạm Quốc Bảo', address_line: '60 Trương Định, Hai Bà Trưng',  city: 'Hà Nội', pin_code: '100000', latitude: 21.0060, longitude: 105.8520, availability_days: ['MON','WED','FRI'],     availability_time: 'AFTERNOON', delivery_goal: 10, is_active: false },
  { phone: '0907300005', contact_name: 'Ngô Thị Thanh', address_line: '110 Kim Mã, Ba Đình',           city: 'Hà Nội', pin_code: '100000', latitude: 21.0340, longitude: 105.8170, availability_days: 'ALL_WEEKEND',           availability_time: 'MORNING',   delivery_goal: 25, is_active: true  },
];

// donor, receiver, volunteer = phone (hoặc null). exp = giờ tính từ bây giờ (âm = đã hết hạn)
const DONATIONS = [
  { donor: '0905100001', title: 'Cơm hộp thịt kho trứng',       description: '30 suất cơm trưa còn nóng, đóng hộp sạch.',         food_type: 'COOKED',   quantity: 30, unit: 'suất', exp: 6,   status: 'COMPLETED', receiver: '0906200001', volunteer: '0907300001' },
  { donor: '0905100002', title: 'Bánh mì thịt nguội cuối ngày', description: 'Bánh còn tươi, dùng trong tối nay.',                food_type: 'PACKAGED', quantity: 25, unit: 'cái',  exp: 8,   status: 'PENDING' },
  { donor: '0905100003', title: 'Hải sản tươi: cá, mực',        description: 'Cá nục và mực ống tươi, cần lấy sớm.',              food_type: 'RAW',      quantity: 15, unit: 'kg',   exp: 12,  status: 'ACCEPTED',  receiver: '0906200003', selfPickup: true },
  { donor: '0905100004', title: 'Bánh ngọt cuối ngày',          description: 'Bánh su, bông lan dư cuối ca.',                     food_type: 'PACKAGED', quantity: 40, unit: 'cái',  exp: 5,   status: 'PICKED_UP', receiver: '0906200005', volunteer: '0907300002' },
  { donor: '0905100005', title: 'Rau củ quả tươi',              description: 'Cà rốt, bắp cải, khoai tây.',                       food_type: 'RAW',      quantity: 20, unit: 'kg',   exp: 24,  status: 'PENDING' },
  { donor: '0905100003', title: 'Cơm chay từ thiện',            description: 'Cơm chay đủ dinh dưỡng cho người khó khăn.',        food_type: 'COOKED',   quantity: 50, unit: 'suất', exp: 4,   status: 'COMPLETED', receiver: '0906200004', volunteer: '0907300003' },
  { donor: '0905100006', title: 'Thịt heo đông lạnh',           description: 'Thịt đông lạnh đóng gói hút chân không.',           food_type: 'FROZEN',   quantity: 10, unit: 'kg',   exp: 48,  status: 'PENDING' },
  { donor: '0905100003', title: 'Cháo dinh dưỡng nóng',         description: 'Cháo thịt bằm, dùng ngay trong chiều.',             food_type: 'COOKED',   quantity: 35, unit: 'suất', exp: -2,  status: 'EXPIRED' },
  { donor: '0905100002', title: 'Bánh kem dư tiệc',             description: 'Bánh kem nguyên vẹn dư từ đặt hàng.',               food_type: 'PACKAGED', quantity: 8,  unit: 'cái',  exp: 6,   status: 'CANCELLED' },
  { donor: '0905100005', title: 'Trái cây: chuối, táo',         description: 'Chuối và táo còn tươi.',                            food_type: 'RAW',      quantity: 18, unit: 'kg',   exp: 20,  status: 'PENDING' },
  { donor: '0905100004', title: 'Cơm gà xối mỡ',                description: 'Suất cơm gà nóng, đóng hộp.',                       food_type: 'COOKED',   quantity: 28, unit: 'suất', exp: 5,   status: 'ACCEPTED',  receiver: '0906200002', volunteer: '0907300004' },
  { donor: '0905100006', title: 'Mì gói & đồ khô',              description: 'Mì gói, miến, bún khô dự trữ.',                     food_type: 'PACKAGED', quantity: 60, unit: 'gói',  exp: 72,  status: 'COMPLETED', receiver: '0906200006', volunteer: '0907300005' },
];

// linkDonationIndex: gắn vào DONATIONS[index] (cho FULFILLED). accepted = phone donor.
const REQUESTS = [
  { receiver: '0906200001', title: 'Cần cơm cho 40 trẻ em',             description: 'Mái ấm cần suất ăn trưa cho các bé.',           food_type: 'COOKED',   quantity: 40,  unit: 'suất', need: 5,  status: 'PENDING' },
  { receiver: '0906200002', title: 'Cần thực phẩm khô dự trữ',          description: 'Mì, miến, đồ hộp cho chương trình phát quà.',   food_type: 'PACKAGED', quantity: 50,  unit: 'gói',  need: 48, status: 'PENDING' },
  { receiver: '0906200003', title: 'Cần rau củ nấu ăn',                 description: 'Rau xanh, củ quả cho bếp ăn tình thương.',      food_type: 'RAW',      quantity: 25,  unit: 'kg',   need: 24, status: 'PENDING' },
  { receiver: '0906200004', title: 'Suất ăn tối cho người vô gia cư',   description: 'Cơm/cháo nóng phát tối thứ 7.',                 food_type: 'COOKED',   quantity: 60,  unit: 'suất', need: 6,  status: 'ACCEPTED', accepted: '0905100001' },
  { receiver: '0906200005', title: 'Cần sữa & bánh cho trẻ',            description: 'Sữa hộp, bánh quy cho trẻ mẫu giáo.',           food_type: 'PACKAGED', quantity: 30,  unit: 'hộp',  need: 8,  status: 'PENDING' },
  { receiver: '0906200002', title: 'Cần gạo phát từ thiện',             description: 'Gạo tẻ cho 50 hộ khó khăn.',                    food_type: 'PACKAGED', quantity: 100, unit: 'kg',   need: 72, status: 'PENDING' },
  { receiver: '0906200001', title: 'Cần thịt, cá tươi',                 description: 'Thực phẩm tươi cho bữa ăn cuối tuần.',          food_type: 'RAW',      quantity: 15,  unit: 'kg',   need: 24, status: 'PENDING' },
  { receiver: '0906200006', title: 'Cần cơm trưa',                      description: 'Vài suất cơm cho gia đình neo đơn.',            food_type: 'COOKED',   quantity: 20,  unit: 'suất', need: 4,  status: 'FULFILLED', accepted: '0905100001', linkDonationIndex: 0 },
  { receiver: '0906200003', title: 'Cần đồ đông lạnh',                  description: 'Thịt/cá đông lạnh dự trữ tủ đông.',             food_type: 'FROZEN',   quantity: 12,  unit: 'kg',   need: 48, status: 'CANCELLED' },
];

const FEEDBACK_COMMENTS = [
  'Thức ăn còn nóng, đóng gói cẩn thận. Cảm ơn nhà hảo tâm rất nhiều!',
  'Tình nguyện viên giao đúng giờ, thái độ thân thiện.',
  'Receiver nhận hàng nhanh gọn, hợp tác tốt.',
  'Đồ ăn ngon, số lượng đúng như mô tả.',
  'Rất cảm kích sự giúp đỡ, mong được hỗ trợ tiếp.',
];

// ─────────────────────────────── CHẠY SEED ─────────────────────────────────

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('Thiếu MONGO_URI trong backend/.env');

  await mongoose.connect(uri);
  console.log('✅ Đã kết nối:', mongoose.connection.host, '/', mongoose.connection.name);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // 1) Upsert users
  const byPhone = {};
  for (const u of USERS) {
    const hasProfile = u.role !== 'ADMIN';
    const doc = await User.findOneAndUpdate(
      { phone_number: u.phone },
      {
        $set: {
          full_name: u.name,
          role: u.role,
          password: passwordHash,
          is_phone_verified: true,
          profile_completed: hasProfile || u.role === 'ADMIN',
          onboarding_step: 4,
          language: 'vi',
          is_active: true,
          points: 0, // reset để idempotent — sẽ cộng lại bên dưới
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    byPhone[u.phone] = doc;
  }
  console.log(`👤 Users: ${USERS.length}`);

  const id = (phone) => byPhone[phone]?._id;
  const seedIds = Object.values(byPhone).map((d) => d._id);

  // 2) Upsert profiles
  for (const p of DONOR_PROFILES) {
    await DonorProfile.findOneAndUpdate({ user_id: id(p.phone) },
      { $set: { ...p, user_id: id(p.phone) } }, { upsert: true, new: true });
  }
  for (const p of RECEIVER_PROFILES) {
    await ReceiverProfile.findOneAndUpdate({ user_id: id(p.phone) },
      { $set: { ...p, user_id: id(p.phone) } }, { upsert: true, new: true });
  }
  for (const p of VOLUNTEER_PROFILES) {
    await VolunteerProfile.findOneAndUpdate({ user_id: id(p.phone) },
      { $set: { ...p, user_id: id(p.phone) } }, { upsert: true, new: true });
  }
  console.log(`📋 Profiles: ${DONOR_PROFILES.length} donor, ${RECEIVER_PROFILES.length} receiver, ${VOLUNTEER_PROFILES.length} volunteer`);

  // 3) Dọn dữ liệu giao dịch cũ của tài khoản seed (idempotent)
  await Promise.all([
    FoodDonation.deleteMany({ donor_id: { $in: seedIds } }),
    FoodRequest.deleteMany({ receiver_id: { $in: seedIds } }),
    Delivery.deleteMany({ $or: [{ donor_id: { $in: seedIds } }, { receiver_id: { $in: seedIds } }] }),
    Feedback.deleteMany({ $or: [{ from_user_id: { $in: seedIds } }, { to_user_id: { $in: seedIds } }] }),
    Notification.deleteMany({ user_id: { $in: seedIds } }),
  ]);

  // 4) Tạo donations (+ delivery / feedback / điểm cho đơn hoàn tất)
  const donationDocs = [];
  const feedbacks = [];
  const notifications = [];

  for (const d of DONATIONS) {
    const donorId = id(d.donor);
    const receiverId = d.receiver ? id(d.receiver) : null;
    const volunteerId = d.volunteer ? id(d.volunteer) : null;
    const deliveryType = d.selfPickup ? 'SELF_PICKUP' : (volunteerId ? 'VIA_AGENT' : null);

    const donation = await FoodDonation.create({
      donor_id: donorId,
      selected_receiver_id: receiverId,
      volunteer_id: volunteerId,
      selected_at: receiverId ? AGO(2) : null,
      delivery_type: deliveryType,
      title: d.title,
      description: d.description,
      food_type: d.food_type,
      quantity: d.quantity,
      unit: d.unit,
      expiration_datetime: H(d.exp),
      status: d.status,
    });

    // Delivery cho các đơn có receiver
    let delivery = null;
    if (receiverId) {
      const dStatus =
        d.status === 'COMPLETED' ? 'DELIVERED'
        : d.status === 'PICKED_UP' ? 'ON_THE_WAY'
        : d.selfPickup ? 'SELF_PICKUP_READY'
        : volunteerId ? 'AGENT_ASSIGNED'
        : 'WAITING_AGENT';

      delivery = await Delivery.create({
        donation_id: donation._id,
        donor_id: donorId,
        receiver_id: receiverId,
        volunteer_id: volunteerId,
        delivery_type: deliveryType || 'SELF_PICKUP',
        status: dStatus,
        pickup_code: code4(),
        assigned_at: volunteerId ? AGO(2) : null,
        picked_up_at: ['ON_THE_WAY', 'DELIVERED'].includes(dStatus) ? AGO(1.5) : null,
        delivered_at: dStatus === 'DELIVERED' ? AGO(1) : null,
      });
      await FoodDonation.updateOne({ _id: donation._id }, { $set: { delivery_id: delivery._id } });
    }

    // Đơn hoàn tất → cộng điểm + feedback + thông báo
    if (d.status === 'COMPLETED') {
      await User.updateOne({ _id: donorId }, { $inc: { points: 100 } });
      if (volunteerId) await User.updateOne({ _id: volunteerId }, { $inc: { points: 100 } });

      feedbacks.push(
        { delivery_id: delivery._id, from_user_id: receiverId, to_user_id: donorId,     rating: 5, comment: FEEDBACK_COMMENTS[0] },
        { delivery_id: delivery._id, from_user_id: donorId,     to_user_id: receiverId, rating: 5, comment: FEEDBACK_COMMENTS[2] },
      );
      if (volunteerId) {
        feedbacks.push({ delivery_id: delivery._id, from_user_id: receiverId, to_user_id: volunteerId, rating: 4, comment: FEEDBACK_COMMENTS[1] });
      }
      notifications.push(
        { user_id: receiverId, title: 'Đơn đã hoàn tất', message: `Bạn đã nhận "${d.title}". Cảm ơn bạn!`, type: 'DELIVERY', related_entity_type: 'FoodDonation', related_entity_id: donation._id, is_read: false },
        { user_id: donorId,    title: 'Bạn được +100 điểm', message: `Đơn "${d.title}" đã hoàn tất. Cảm ơn tấm lòng của bạn!`, type: 'DONATION', related_entity_type: 'FoodDonation', related_entity_id: donation._id, is_read: false },
      );
      if (volunteerId) {
        notifications.push({ user_id: volunteerId, title: 'Giao hàng thành công', message: `Bạn được +100 điểm cho đơn "${d.title}".`, type: 'DELIVERY', related_entity_type: 'FoodDonation', related_entity_id: donation._id, is_read: false });
      }
    }

    donationDocs.push(donation);
  }
  if (feedbacks.length) await Feedback.insertMany(feedbacks);
  console.log(`🍱 Donations: ${donationDocs.length} | Feedback: ${feedbacks.length}`);

  // 5) Tạo requests
  let reqCount = 0;
  for (const r of REQUESTS) {
    await FoodRequest.create({
      receiver_id: id(r.receiver),
      title: r.title,
      description: r.description,
      requested_quantity: r.quantity,
      unit: r.unit,
      food_type: r.food_type,
      needed_before: H(r.need),
      status: r.status,
      accepted_by_donor_id: r.accepted ? id(r.accepted) : null,
      linked_donation_id: r.linkDonationIndex != null ? donationDocs[r.linkDonationIndex]?._id : null,
    });
    reqCount++;
  }
  console.log(`🙏 Requests: ${reqCount}`);

  // 6) Vài thông báo "đơn mới" cho donor (cho tab thông báo phong phú)
  notifications.push(
    { user_id: id('0905100001'), title: 'Yêu cầu mới gần bạn', message: 'Mái ấm Hy Vọng cần 40 suất cơm.', type: 'NEW_FOOD_REQUEST', is_read: false },
    { user_id: id('0905100005'), title: 'Yêu cầu mới gần bạn', message: 'Bếp ăn tình thương cần 25kg rau củ.', type: 'NEW_FOOD_REQUEST', is_read: true },
  );
  if (notifications.length) await Notification.insertMany(notifications);
  console.log(`🔔 Notifications: ${notifications.length}`);

  console.log('\n🎉 Seed hoàn tất! Mật khẩu mọi tài khoản: ' + PASSWORD);
  console.log('   Admin: 0900000001 (cần đăng nhập admin web bằng số này)');

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Seed lỗi:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
