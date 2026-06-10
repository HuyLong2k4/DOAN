/**
 * Seed dữ liệu demo (Hà Nội) cho app Food Sharing.
 *
 * Quy mô: 1 admin + 10 donor + 10 receiver + 10 volunteer (≥10/vai trò).
 *
 * - Idempotent: chạy lại nhiều lần không nhân đôi. Tài khoản upsert theo phone,
 *   hồ sơ upsert theo user_id. Donation/request/delivery/feedback/notification/
 *   conversation/message của riêng các tài khoản seed sẽ bị xoá rồi tạo lại để
 *   giữ trạng thái sạch.
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
const Conversation = require('../src/app/models/conversationModel');
const Message = require('../src/app/models/messageModel');

const PASSWORD = '123456';
const H   = (h) => new Date(Date.now() + h * 3600 * 1000); // tương lai
const code4 = () => String(Math.floor(1000 + Math.random() * 9000));

// Toạ độ trung tâm các quận Hà Nội (đều trong ~10km quanh Hoàn Kiếm).
const DISTRICT = {
  HoanKiem:   [21.0285, 105.8542],
  BaDinh:     [21.0353, 105.8145],
  DongDa:     [21.0167, 105.8300],
  HaiBaTrung: [21.0050, 105.8550],
  CauGiay:    [21.0360, 105.7900],
  ThanhXuan:  [20.9950, 105.8050],
  TayHo:      [21.0700, 105.8200],
  HoangMai:   [20.9750, 105.8500],
  LongBien:   [21.0450, 105.8900],
  NamTuLiem:  [21.0300, 105.7650],
};
// Lệch nhẹ theo vai trò để các điểm không trùng khít nhau nhưng vẫn cùng quận.
const loc = (d, dLat = 0, dLng = 0) => ({
  latitude:  +(DISTRICT[d][0] + dLat).toFixed(4),
  longitude: +(DISTRICT[d][1] + dLng).toFixed(4),
});

// ─────────────────────────────── DỮ LIỆU ───────────────────────────────────

const USERS = [
  { phone: '0900000001', name: 'Quản trị viên', role: 'ADMIN' },
  // Donors (10)
  { phone: '0905100001', name: 'Trần Minh Quân',  role: 'DONOR' },
  { phone: '0905100002', name: 'Lê Thị Hoa',      role: 'DONOR' },
  { phone: '0905100003', name: 'Phạm Văn Hùng',   role: 'DONOR' },
  { phone: '0905100004', name: 'Nguyễn Thị Lan',  role: 'DONOR' },
  { phone: '0905100005', name: 'Hoàng Anh Tuấn',  role: 'DONOR' },
  { phone: '0905100006', name: 'Đỗ Thu Hằng',     role: 'DONOR' },
  { phone: '0905100007', name: 'Vũ Đình Phong',   role: 'DONOR' },
  { phone: '0905100008', name: 'Bùi Thị Nga',     role: 'DONOR' },
  { phone: '0905100009', name: 'Đặng Văn Khoa',   role: 'DONOR' },
  { phone: '0905100010', name: 'Trịnh Thị Mỹ',    role: 'DONOR' },
  // Receivers (10)
  { phone: '0906200001', name: 'Nguyễn Văn Phúc', role: 'RECEIVER' },
  { phone: '0906200002', name: 'Trần Thị Bích',   role: 'RECEIVER' },
  { phone: '0906200003', name: 'Lê Quang Vinh',   role: 'RECEIVER' },
  { phone: '0906200004', name: 'Phan Thị Hồng',   role: 'RECEIVER' },
  { phone: '0906200005', name: 'Võ Minh Trí',     role: 'RECEIVER' },
  { phone: '0906200006', name: 'Nguyễn Thị Tư',   role: 'RECEIVER' },
  { phone: '0906200007', name: 'Hoàng Văn Sơn',   role: 'RECEIVER' },
  { phone: '0906200008', name: 'Lý Thị Thu',      role: 'RECEIVER' },
  { phone: '0906200009', name: 'Cao Văn Dũng',    role: 'RECEIVER' },
  { phone: '0906200010', name: 'Đinh Thị Hạnh',   role: 'RECEIVER' },
  // Volunteers (10)
  { phone: '0907300001', name: 'Vũ Đức Thắng',    role: 'VOLUNTEER' },
  { phone: '0907300002', name: 'Trần Thị Mai',    role: 'VOLUNTEER' },
  { phone: '0907300003', name: 'Lê Hoàng Nam',    role: 'VOLUNTEER' },
  { phone: '0907300004', name: 'Phạm Quốc Bảo',   role: 'VOLUNTEER' },
  { phone: '0907300005', name: 'Ngô Thị Thanh',   role: 'VOLUNTEER' },
  { phone: '0907300006', name: 'Đỗ Văn Tài',      role: 'VOLUNTEER' },
  { phone: '0907300007', name: 'Nguyễn Thị Yến',  role: 'VOLUNTEER' },
  { phone: '0907300008', name: 'Hoàng Minh Đức',  role: 'VOLUNTEER' },
  { phone: '0907300009', name: 'Trần Văn Lộc',    role: 'VOLUNTEER' },
  { phone: '0907300010', name: 'Phạm Thị Hương',  role: 'VOLUNTEER' },
];

const DONOR_PROFILES = [
  { phone: '0905100001', donor_type: 'RESTAURANT', business_name: 'Nhà hàng Hương Việt', contact_name: 'Trần Minh Quân', address_line: '124 Hàng Bông, Hoàn Kiếm',        city: 'Hà Nội', pin_code: '100000', ...loc('HoanKiem') },
  { phone: '0905100002', donor_type: 'BAKERY',     business_name: 'Tiệm bánh Ngọt Lành',  contact_name: 'Lê Thị Hoa',     address_line: '88 Tây Sơn, Đống Đa',            city: 'Hà Nội', pin_code: '100000', ...loc('DongDa') },
  { phone: '0905100003', donor_type: 'RESTAURANT', business_name: 'Nhà hàng Biển Đông',   contact_name: 'Phạm Văn Hùng',  address_line: '27 Bạch Mai, Hai Bà Trưng',      city: 'Hà Nội', pin_code: '100000', ...loc('HaiBaTrung') },
  { phone: '0905100004', donor_type: 'BAKERY',     business_name: 'Bánh mì Cô Ba',        contact_name: 'Nguyễn Thị Lan', address_line: '15 Cầu Giấy, Cầu Giấy',          city: 'Hà Nội', pin_code: '100000', ...loc('CauGiay') },
  { phone: '0905100005', donor_type: 'INDIVIDUAL', business_name: null,                   contact_name: 'Hoàng Anh Tuấn', address_line: '56 Đội Cấn, Ba Đình',            city: 'Hà Nội', pin_code: '100000', ...loc('BaDinh') },
  { phone: '0905100006', donor_type: 'INDIVIDUAL', business_name: null,                   contact_name: 'Đỗ Thu Hằng',    address_line: '102 Nguyễn Trãi, Thanh Xuân',    city: 'Hà Nội', pin_code: '100000', ...loc('ThanhXuan') },
  { phone: '0905100007', donor_type: 'RESTAURANT', business_name: 'Nhà hàng Phố Cổ',      contact_name: 'Vũ Đình Phong',  address_line: '7 Quảng An, Tây Hồ',             city: 'Hà Nội', pin_code: '100000', ...loc('TayHo') },
  { phone: '0905100008', donor_type: 'BAKERY',     business_name: 'Tiệm bánh Mây',        contact_name: 'Bùi Thị Nga',    address_line: '19 Giải Phóng, Hoàng Mai',       city: 'Hà Nội', pin_code: '100000', ...loc('HoangMai') },
  { phone: '0905100009', donor_type: 'INDIVIDUAL', business_name: null,                   contact_name: 'Đặng Văn Khoa',  address_line: '64 Ngọc Lâm, Long Biên',         city: 'Hà Nội', pin_code: '100000', ...loc('LongBien') },
  { phone: '0905100010', donor_type: 'RESTAURANT', business_name: 'Quán Cơm Niêu',        contact_name: 'Trịnh Thị Mỹ',   address_line: '30 Mỹ Đình, Nam Từ Liêm',        city: 'Hà Nội', pin_code: '100000', ...loc('NamTuLiem') },
];

const RECEIVER_PROFILES = [
  { phone: '0906200001', receiver_type: 'ORPHANAGE',  organization_name: 'Mái ấm Hy Vọng',                contact_name: 'Nguyễn Văn Phúc', address_line: '33 Thái Hà, Đống Đa',          city: 'Hà Nội', pin_code: '100000', ...loc('DongDa', 0.0015, 0.0010) },
  { phone: '0906200002', receiver_type: 'NGO',        organization_name: 'Quỹ Từ Thiện Nhân Ái',          contact_name: 'Trần Thị Bích',   address_line: '12 Tràng Thi, Hoàn Kiếm',      city: 'Hà Nội', pin_code: '100000', ...loc('HoanKiem', 0.0015, 0.0010) },
  { phone: '0906200003', receiver_type: 'SHELTER',    organization_name: 'Nhà tình thương Bình An',       contact_name: 'Lê Quang Vinh',   address_line: '5 Kim Đồng, Hoàng Mai',        city: 'Hà Nội', pin_code: '100000', ...loc('HoangMai', 0.0015, 0.0010) },
  { phone: '0906200004', receiver_type: 'NGO',        organization_name: 'Hội Chữ Thập Đỏ Hà Nội',        contact_name: 'Phan Thị Hồng',   address_line: '70 Liễu Giai, Ba Đình',        city: 'Hà Nội', pin_code: '100000', ...loc('BaDinh', 0.0015, 0.0010) },
  { phone: '0906200005', receiver_type: 'TRUST',      organization_name: 'Quỹ Bảo Trợ Trẻ Em',            contact_name: 'Võ Minh Trí',     address_line: '41 Minh Khai, Hai Bà Trưng',   city: 'Hà Nội', pin_code: '100000', ...loc('HaiBaTrung', 0.0015, 0.0010) },
  { phone: '0906200006', receiver_type: 'INDIVIDUAL', organization_name: null,                            contact_name: 'Nguyễn Thị Tư',   address_line: '9 Khương Trung, Thanh Xuân',   city: 'Hà Nội', pin_code: '100000', ...loc('ThanhXuan', 0.0015, 0.0010) },
  { phone: '0906200007', receiver_type: 'ORPHANAGE',  organization_name: 'Mái ấm Tình Thương',            contact_name: 'Hoàng Văn Sơn',   address_line: '22 Xuân Thủy, Cầu Giấy',       city: 'Hà Nội', pin_code: '100000', ...loc('CauGiay', 0.0015, 0.0010) },
  { phone: '0906200008', receiver_type: 'NGO',        organization_name: 'Bếp ăn Từ Thiện Sen',           contact_name: 'Lý Thị Thu',      address_line: '14 Lạc Long Quân, Tây Hồ',     city: 'Hà Nội', pin_code: '100000', ...loc('TayHo', 0.0015, 0.0010) },
  { phone: '0906200009', receiver_type: 'SHELTER',    organization_name: 'Trung tâm Bảo trợ Ánh Dương',   contact_name: 'Cao Văn Dũng',    address_line: '48 Ngọc Lâm, Long Biên',       city: 'Hà Nội', pin_code: '100000', ...loc('LongBien', 0.0015, 0.0010) },
  { phone: '0906200010', receiver_type: 'INDIVIDUAL', organization_name: null,                            contact_name: 'Đinh Thị Hạnh',   address_line: '17 Mỹ Đình, Nam Từ Liêm',      city: 'Hà Nội', pin_code: '100000', ...loc('NamTuLiem', 0.0015, 0.0010) },
];

const VOL = (phone, name, district, days, time, goal, active) => ({
  phone, contact_name: name, city: 'Hà Nội', pin_code: '100000',
  availability_days: days, availability_time: time, delivery_goal: goal, is_active: active,
  ...loc(district, -0.0010, 0.0015),
});
const VOLUNTEER_PROFILES = [
  { ...VOL('0907300001', 'Vũ Đức Thắng',  'HoanKiem',   'ALL_WEEKEND',  'AFTERNOON', 20, true),  address_line: '200 Lý Thường Kiệt, Hoàn Kiếm' },
  { ...VOL('0907300002', 'Trần Thị Mai',  'DongDa',     'ALL_WEEKDAYS', 'MORNING',   15, true),  address_line: '45 Láng Hạ, Đống Đa' },
  { ...VOL('0907300003', 'Lê Hoàng Nam',  'CauGiay',    'ANY_DAY',      'NIGHT',     30, true),  address_line: '18 Xuân Thủy, Cầu Giấy' },
  { ...VOL('0907300004', 'Phạm Quốc Bảo', 'HaiBaTrung', ['MON','WED','FRI'], 'AFTERNOON', 10, false), address_line: '60 Trương Định, Hai Bà Trưng' },
  { ...VOL('0907300005', 'Ngô Thị Thanh', 'BaDinh',     'ALL_WEEKEND',  'MORNING',   25, true),  address_line: '110 Kim Mã, Ba Đình' },
  { ...VOL('0907300006', 'Đỗ Văn Tài',    'ThanhXuan',  'ALL_WEEKDAYS', 'AFTERNOON', 18, true),  address_line: '77 Nguyễn Trãi, Thanh Xuân' },
  { ...VOL('0907300007', 'Nguyễn Thị Yến','TayHo',      'ANY_DAY',      'MORNING',   22, true),  address_line: '5 Âu Cơ, Tây Hồ' },
  { ...VOL('0907300008', 'Hoàng Minh Đức','HoangMai',   ['SAT','SUN'],  'NIGHT',     12, false), address_line: '88 Giải Phóng, Hoàng Mai' },
  { ...VOL('0907300009', 'Trần Văn Lộc',  'LongBien',   'ALL_WEEKEND',  'AFTERNOON', 28, true),  address_line: '12 Ngọc Lâm, Long Biên' },
  { ...VOL('0907300010', 'Phạm Thị Hương','NamTuLiem',  'ALL_WEEKDAYS', 'MORNING',   16, true),  address_line: '40 Mỹ Đình, Nam Từ Liêm' },
];

// donor/receiver/volunteer = phone. exp = giờ tính từ bây giờ (âm = đã hết hạn).
const DONATIONS = [
  { donor: '0905100001', title: 'Cơm hộp thịt kho trứng',       description: '30 suất cơm trưa còn nóng, đóng hộp sạch.',     food_type: 'COOKED',   quantity: 30, unit: 'suất', exp: 6,   status: 'COMPLETED', receiver: '0906200001', volunteer: '0907300001' },
  { donor: '0905100002', title: 'Bánh mì thịt nguội cuối ngày', description: 'Bánh còn tươi, dùng trong tối nay.',            food_type: 'PACKAGED', quantity: 25, unit: 'cái',  exp: 8,   status: 'PENDING' },
  { donor: '0905100003', title: 'Cơm chay từ thiện',            description: 'Cơm chay đủ dinh dưỡng cho người khó khăn.',    food_type: 'COOKED',   quantity: 50, unit: 'suất', exp: 4,   status: 'COMPLETED', receiver: '0906200004', volunteer: '0907300003' },
  { donor: '0905100004', title: 'Hải sản tươi: cá, mực',        description: 'Cá nục và mực ống tươi, cần lấy sớm.',          food_type: 'RAW',      quantity: 15, unit: 'kg',   exp: 12,  status: 'ACCEPTED',  receiver: '0906200002', selfPickup: true },
  { donor: '0905100005', title: 'Bánh ngọt cuối ngày',          description: 'Bánh su, bông lan dư cuối ca.',                 food_type: 'PACKAGED', quantity: 40, unit: 'cái',  exp: 5,   status: 'PICKED_UP', receiver: '0906200007', volunteer: '0907300004' },
  { donor: '0905100006', title: 'Cơm gà xối mỡ',                description: 'Suất cơm gà nóng, đóng hộp.',                   food_type: 'COOKED',   quantity: 28, unit: 'suất', exp: 5,   status: 'COMPLETED', receiver: '0906200006', volunteer: '0907300005' },
  { donor: '0905100007', title: 'Bún chả Hà Nội',               description: 'Bún chả còn dư buổi trưa, đóng hộp gọn.',       food_type: 'COOKED',   quantity: 35, unit: 'suất', exp: 4,   status: 'COMPLETED', receiver: '0906200008', volunteer: '0907300007' },
  { donor: '0905100008', title: 'Thịt heo đông lạnh',           description: 'Thịt đông lạnh đóng gói hút chân không.',       food_type: 'FROZEN',   quantity: 10, unit: 'kg',   exp: 48,  status: 'ACCEPTED',  receiver: '0906200003', selfPickup: true },
  { donor: '0905100009', title: 'Rau củ quả tươi',              description: 'Cà rốt, bắp cải, khoai tây.',                   food_type: 'RAW',      quantity: 20, unit: 'kg',   exp: 24,  status: 'PICKED_UP', receiver: '0906200010', volunteer: '0907300006' },
  { donor: '0905100010', title: 'Xôi gấc & giò',                description: 'Xôi gấc và giò lụa, suất ăn sáng.',             food_type: 'COOKED',   quantity: 45, unit: 'suất', exp: 6,   status: 'COMPLETED', receiver: '0906200009', volunteer: '0907300009' },
  { donor: '0905100001', title: 'Trái cây: chuối, táo',         description: 'Chuối và táo còn tươi.',                        food_type: 'RAW',      quantity: 18, unit: 'kg',   exp: 20,  status: 'PENDING' },
  { donor: '0905100002', title: 'Bánh kem dư tiệc',             description: 'Bánh kem nguyên vẹn dư từ đặt hàng.',           food_type: 'PACKAGED', quantity: 12, unit: 'cái',  exp: 6,   status: 'ACCEPTED',  receiver: '0906200005', volunteer: '0907300002' },
  { donor: '0905100003', title: 'Cháo dinh dưỡng nóng',         description: 'Cháo thịt bằm, dùng ngay trong chiều.',         food_type: 'COOKED',   quantity: 35, unit: 'suất', exp: -2,  status: 'EXPIRED' },
  { donor: '0905100004', title: 'Mì gói & đồ khô',              description: 'Mì gói, miến, bún khô dự trữ.',                 food_type: 'PACKAGED', quantity: 60, unit: 'gói',  exp: 72,  status: 'PENDING' },
  { donor: '0905100005', title: 'Bánh quy hộp',                 description: 'Bánh quy đóng hộp còn hạn dài.',                food_type: 'PACKAGED', quantity: 20, unit: 'hộp',  exp: 10,  status: 'CANCELLED' },
  { donor: '0905100006', title: 'Cơm tấm sườn',                 description: 'Cơm tấm sườn nướng, suất đầy đặn.',             food_type: 'COOKED',   quantity: 25, unit: 'suất', exp: 5,   status: 'PENDING' },
  { donor: '0905100007', title: 'Cá hồi tươi',                  description: 'Phi lê cá hồi tươi, bảo quản lạnh.',           food_type: 'RAW',      quantity: 8,  unit: 'kg',   exp: 12,  status: 'PENDING' },
  { donor: '0905100008', title: 'Phở bò còn dư',                description: 'Phở bò buổi sáng còn dư.',                      food_type: 'COOKED',   quantity: 30, unit: 'suất', exp: -1,  status: 'EXPIRED' },
  { donor: '0905100009', title: 'Hải sản đông lạnh',            description: 'Tôm, mực đông lạnh đóng túi.',                  food_type: 'FROZEN',   quantity: 15, unit: 'kg',   exp: 48,  status: 'PENDING' },
  { donor: '0905100010', title: 'Sữa hộp & bánh',               description: 'Sữa tươi hộp và bánh quy cho trẻ.',             food_type: 'PACKAGED', quantity: 40, unit: 'hộp',  exp: 36,  status: 'PENDING' },
  // ── Bổ sung đợt 2 ──
  { donor: '0905100002', title: 'Bánh ngọt & bánh mì sáng',     description: 'Bánh ngọt và bánh mì còn tươi đầu ngày.',       food_type: 'PACKAGED', quantity: 30, unit: 'cái',  exp: 6,   status: 'COMPLETED', receiver: '0906200002', volunteer: '0907300002' },
  { donor: '0905100004', title: 'Cơm hộp cá kho',               description: 'Cơm trắng và cá kho tộ, đóng hộp nóng.',        food_type: 'COOKED',   quantity: 40, unit: 'suất', exp: 5,   status: 'COMPLETED', receiver: '0906200005', volunteer: '0907300004' },
  { donor: '0905100005', title: 'Pizza & mì Ý dư',              description: 'Pizza và mì Ý dư cuối ca, còn ngon.',           food_type: 'COOKED',   quantity: 20, unit: 'suất', exp: 4,   status: 'COMPLETED', receiver: '0906200007', volunteer: '0907300006' },
  { donor: '0905100008', title: 'Bánh bao nhân thịt',           description: 'Bánh bao nóng hổi, nhân thịt trứng.',           food_type: 'PACKAGED', quantity: 50, unit: 'cái',  exp: 6,   status: 'COMPLETED', receiver: '0906200003', volunteer: '0907300008' },
  { donor: '0905100009', title: 'Rau xanh & củ quả',            description: 'Rau muống, cải, su hào tươi.',                  food_type: 'RAW',      quantity: 25, unit: 'kg',   exp: 24,  status: 'COMPLETED', receiver: '0906200010', volunteer: '0907300010' },
  { donor: '0905100001', title: 'Bánh chưng còn dư',            description: 'Bánh chưng gói sẵn, dùng trong ngày.',          food_type: 'PACKAGED', quantity: 15, unit: 'cái',  exp: 24,  status: 'PENDING' },
  { donor: '0905100002', title: 'Sữa chua & bánh flan',         description: 'Sữa chua và bánh flan mát lạnh.',               food_type: 'PACKAGED', quantity: 30, unit: 'hộp',  exp: 12,  status: 'PENDING' },
  { donor: '0905100003', title: 'Lẩu thập cẩm phần dư',         description: 'Phần lẩu chưa dùng, còn nguyên.',               food_type: 'COOKED',   quantity: 20, unit: 'suất', exp: 4,   status: 'PENDING' },
  { donor: '0905100004', title: 'Bánh mì que pate',             description: 'Bánh mì que pate, giòn rụm.',                   food_type: 'PACKAGED', quantity: 50, unit: 'cái',  exp: 8,   status: 'PENDING' },
  { donor: '0905100005', title: 'Nước ép trái cây',             description: 'Nước ép cam, táo đóng chai.',                   food_type: 'PACKAGED', quantity: 24, unit: 'chai', exp: 10,  status: 'PENDING' },
  { donor: '0905100006', title: 'Cơm cuộn kimbap',              description: 'Cơm cuộn rong biển, suất ăn nhẹ.',              food_type: 'COOKED',   quantity: 30, unit: 'suất', exp: 5,   status: 'PENDING' },
  { donor: '0905100007', title: 'Chả giò chiên sẵn',           description: 'Chả giò chiên giòn, dùng ngay.',                food_type: 'COOKED',   quantity: 40, unit: 'suất', exp: 4,   status: 'PENDING' },
  { donor: '0905100008', title: 'Bánh trung thu tồn',          description: 'Bánh trung thu còn hạn, đóng hộp.',             food_type: 'PACKAGED', quantity: 24, unit: 'cái',  exp: 48,  status: 'PENDING' },
  { donor: '0905100009', title: 'Cá biển tươi',                description: 'Cá thu, cá nục tươi đánh bắt.',                 food_type: 'RAW',      quantity: 12, unit: 'kg',   exp: 12,  status: 'PENDING' },
  { donor: '0905100010', title: 'Gạo & nhu yếu phẩm',          description: 'Gạo, dầu ăn, nước mắm dự trữ.',                 food_type: 'PACKAGED', quantity: 80, unit: 'kg',   exp: 96,  status: 'PENDING' },
  { donor: '0905100006', title: 'Cơm văn phòng dư',            description: 'Suất cơm văn phòng còn nguyên.',                food_type: 'COOKED',   quantity: 25, unit: 'suất', exp: 5,   status: 'ACCEPTED',  receiver: '0906200004', volunteer: '0907300005' },
  { donor: '0905100010', title: 'Bánh mì & pate',              description: 'Bánh mì kẹp pate, tự đến lấy.',                 food_type: 'PACKAGED', quantity: 35, unit: 'cái',  exp: 8,   status: 'ACCEPTED',  receiver: '0906200008', selfPickup: true },
  { donor: '0905100003', title: 'Súp gà & cháo',               description: 'Súp gà và cháo nóng cho người ốm.',             food_type: 'COOKED',   quantity: 30, unit: 'suất', exp: 4,   status: 'PICKED_UP', receiver: '0906200009', volunteer: '0907300007' },
  { donor: '0905100007', title: 'Bún bò Huế',                  description: 'Bún bò Huế đậm đà, đóng hộp.',                  food_type: 'COOKED',   quantity: 28, unit: 'suất', exp: 5,   status: 'PICKED_UP', receiver: '0906200006', volunteer: '0907300009' },
  { donor: '0905100001', title: 'Xôi đỗ buổi sáng',            description: 'Xôi đỗ xanh, suất ăn sáng.',                    food_type: 'COOKED',   quantity: 20, unit: 'suất', exp: -3,  status: 'EXPIRED' },
  { donor: '0905100004', title: 'Bánh kem để lâu',             description: 'Bánh kem dư, huỷ do để lâu.',                   food_type: 'PACKAGED', quantity: 10, unit: 'cái',  exp: 8,   status: 'CANCELLED' },
  // ── Đợt 3: phủ nốt các trạng thái Delivery còn thiếu ──
  // WAITING_AGENT: receiver đã nhận đơn (VIA_AGENT) nhưng chưa có volunteer tới lấy.
  { donor: '0905100005', title: 'Cơm trưa chờ tình nguyện viên',     description: 'Receiver đã nhận, đang chờ TNV tới lấy.',       food_type: 'COOKED', quantity: 30, unit: 'suất', exp: 6, status: 'ACCEPTED',  receiver: '0906200006', viaAgent: true },
  // AWAITING_CONFIRMATION: volunteer báo đã giao, chờ receiver xác nhận đã nhận.
  { donor: '0905100006', title: 'Cơm trưa văn phòng (chờ xác nhận)', description: 'TNV báo đã giao, chờ người nhận xác nhận.',     food_type: 'COOKED', quantity: 25, unit: 'suất', exp: 5, status: 'PICKED_UP', receiver: '0906200006', volunteer: '0907300010', deliveryStatus: 'AWAITING_CONFIRMATION' },
  // Delivery CANCELLED: đơn đã ghép nhưng chuyến giao bị huỷ (TNV không tới).
  { donor: '0905100007', title: 'Bún chả huỷ chuyến giao',          description: 'Chuyến giao bị huỷ do TNV không tới.',          food_type: 'COOKED', quantity: 28, unit: 'suất', exp: 4, status: 'CANCELLED', receiver: '0906200008', volunteer: '0907300003', deliveryStatus: 'CANCELLED' },
];

// linkDonationIndex: gắn vào DONATIONS[index] (cho FULFILLED). accepted = phone donor.
const REQUESTS = [
  { receiver: '0906200001', title: 'Cần cơm cho 40 trẻ em',           description: 'Mái ấm cần suất ăn trưa cho các bé.',         food_type: 'COOKED',   quantity: 40,  unit: 'suất', need: 5,  status: 'PENDING' },
  { receiver: '0906200002', title: 'Cần thực phẩm khô dự trữ',        description: 'Mì, miến, đồ hộp cho chương trình phát quà.', food_type: 'PACKAGED', quantity: 50,  unit: 'gói',  need: 48, status: 'PENDING' },
  { receiver: '0906200003', title: 'Cần rau củ nấu ăn',               description: 'Rau xanh, củ quả cho bếp ăn tình thương.',    food_type: 'RAW',      quantity: 25,  unit: 'kg',   need: 24, status: 'PENDING' },
  { receiver: '0906200004', title: 'Suất ăn tối cho người vô gia cư', description: 'Cơm/cháo nóng phát tối thứ 7.',               food_type: 'COOKED',   quantity: 60,  unit: 'suất', need: 6,  status: 'ACCEPTED', accepted: '0905100001' },
  { receiver: '0906200005', title: 'Cần sữa & bánh cho trẻ',          description: 'Sữa hộp, bánh quy cho trẻ mẫu giáo.',         food_type: 'PACKAGED', quantity: 30,  unit: 'hộp',  need: 8,  status: 'PENDING' },
  { receiver: '0906200006', title: 'Cần cơm trưa',                    description: 'Vài suất cơm cho gia đình neo đơn.',          food_type: 'COOKED',   quantity: 20,  unit: 'suất', need: 4,  status: 'FULFILLED', accepted: '0905100001', linkDonationIndex: 0 },
  { receiver: '0906200002', title: 'Cần gạo phát từ thiện',           description: 'Gạo tẻ cho 50 hộ khó khăn.',                  food_type: 'PACKAGED', quantity: 100, unit: 'kg',   need: 72, status: 'PENDING' },
  { receiver: '0906200001', title: 'Cần thịt, cá tươi',               description: 'Thực phẩm tươi cho bữa ăn cuối tuần.',        food_type: 'RAW',      quantity: 15,  unit: 'kg',   need: 24, status: 'PENDING' },
  { receiver: '0906200003', title: 'Cần đồ đông lạnh',                description: 'Thịt/cá đông lạnh dự trữ tủ đông.',           food_type: 'FROZEN',   quantity: 12,  unit: 'kg',   need: 48, status: 'CANCELLED' },
  { receiver: '0906200007', title: 'Cần cháo cho trẻ nhỏ',            description: 'Cháo dinh dưỡng cho trẻ dưới 3 tuổi.',        food_type: 'COOKED',   quantity: 30,  unit: 'suất', need: 5,  status: 'PENDING' },
  { receiver: '0906200008', title: 'Cần rau xanh cho bếp ăn',         description: 'Rau xanh các loại cho bếp ăn 0 đồng.',        food_type: 'RAW',      quantity: 20,  unit: 'kg',   need: 24, status: 'ACCEPTED', accepted: '0905100003' },
  { receiver: '0906200009', title: 'Cần thực phẩm cho người già',     description: 'Đồ ăn mềm, dễ tiêu cho người cao tuổi.',      food_type: 'PACKAGED', quantity: 40,  unit: 'gói',  need: 48, status: 'PENDING' },
  { receiver: '0906200010', title: 'Cần suất ăn trưa',                description: 'Suất cơm trưa cho hộ khó khăn.',              food_type: 'COOKED',   quantity: 15,  unit: 'suất', need: 4,  status: 'PENDING' },
  { receiver: '0906200005', title: 'Cần bánh mì sáng',                description: 'Bánh mì cho bữa sáng của các cháu.',          food_type: 'PACKAGED', quantity: 35,  unit: 'cái',  need: 6,  status: 'PENDING' },
  { receiver: '0906200004', title: 'Cần trái cây tươi',               description: 'Trái cây bổ sung vitamin cho bữa ăn.',        food_type: 'RAW',      quantity: 18,  unit: 'kg',   need: 12, status: 'PENDING' },
  // ── Bổ sung đợt 2 ──
  { receiver: '0906200001', title: 'Cần bánh mì cho bữa sáng',        description: 'Bánh mì cho bữa sáng của các cháu.',         food_type: 'PACKAGED', quantity: 40,  unit: 'cái',  need: 6,  status: 'PENDING' },
  { receiver: '0906200002', title: 'Cần dầu ăn & gia vị',            description: 'Dầu ăn, nước mắm, muối cho bếp.',            food_type: 'PACKAGED', quantity: 30,  unit: 'chai', need: 72, status: 'PENDING' },
  { receiver: '0906200003', title: 'Cần sữa cho trẻ sơ sinh',        description: 'Sữa bột cho trẻ dưới 1 tuổi.',               food_type: 'PACKAGED', quantity: 24,  unit: 'hộp',  need: 12, status: 'PENDING' },
  { receiver: '0906200004', title: 'Cần cơm chay ngày rằm',          description: 'Cơm chay cho ngày rằm.',                    food_type: 'COOKED',   quantity: 50,  unit: 'suất', need: 5,  status: 'PENDING' },
  { receiver: '0906200005', title: 'Cần mì tôm dự trữ',              description: 'Mì tôm cho kho dự trữ khẩn cấp.',            food_type: 'PACKAGED', quantity: 60,  unit: 'gói',  need: 48, status: 'PENDING' },
  { receiver: '0906200006', title: 'Cần rau củ tươi hằng ngày',      description: 'Rau củ cho bữa ăn hằng ngày.',               food_type: 'RAW',      quantity: 20,  unit: 'kg',   need: 24, status: 'ACCEPTED', accepted: '0905100005' },
  { receiver: '0906200007', title: 'Cần thịt cho bữa trưa',          description: 'Thịt heo, gà cho bữa trưa.',                 food_type: 'RAW',      quantity: 18,  unit: 'kg',   need: 8,  status: 'PENDING' },
  { receiver: '0906200008', title: 'Cần bánh ngọt cho trẻ',          description: 'Bánh ngọt cho giờ ăn xế.',                   food_type: 'PACKAGED', quantity: 40,  unit: 'cái',  need: 6,  status: 'PENDING' },
  { receiver: '0906200009', title: 'Cần cháo cho người già',         description: 'Cháo cho người già yếu.',                    food_type: 'COOKED',   quantity: 35,  unit: 'suất', need: 5,  status: 'PENDING' },
  { receiver: '0906200010', title: 'Cần gạo nếp & đỗ xanh',          description: 'Gạo nếp và đỗ xanh nấu xôi.',                food_type: 'PACKAGED', quantity: 50,  unit: 'kg',   need: 72, status: 'PENDING' },
  { receiver: '0906200001', title: 'Cần trứng & thực phẩm tươi',     description: 'Trứng gà và thực phẩm tươi.',                food_type: 'RAW',      quantity: 200, unit: 'quả',  need: 24, status: 'PENDING' },
  { receiver: '0906200002', title: 'Cần suất ăn tối từ thiện',       description: 'Suất ăn tối cho người khó khăn.',            food_type: 'COOKED',   quantity: 45,  unit: 'suất', need: 6,  status: 'FULFILLED', accepted: '0905100003', linkDonationIndex: 2 },
  { receiver: '0906200003', title: 'Cần đồ hộp dự trữ',              description: 'Cá hộp, thịt hộp dự trữ.',                   food_type: 'PACKAGED', quantity: 40,  unit: 'hộp',  need: 48, status: 'CANCELLED' },
  { receiver: '0906200007', title: 'Cần bánh mì sandwich',           description: 'Sandwich cho bữa sáng nhanh.',               food_type: 'PACKAGED', quantity: 30,  unit: 'cái',  need: 6,  status: 'PENDING' },
  { receiver: '0906200009', title: 'Cần thực phẩm đông lạnh',        description: 'Thịt, cá đông lạnh trữ tủ.',                 food_type: 'FROZEN',   quantity: 15,  unit: 'kg',   need: 48, status: 'PENDING' },
];

const FEEDBACK_COMMENTS = [
  'Thức ăn còn nóng, đóng gói cẩn thận. Cảm ơn nhà hảo tâm rất nhiều!',
  'Tình nguyện viên giao đúng giờ, thái độ thân thiện.',
  'Receiver nhận hàng nhanh gọn, hợp tác tốt.',
  'Đồ ăn ngon, số lượng đúng như mô tả.',
  'Rất cảm kích sự giúp đỡ, mong được hỗ trợ tiếp.',
];

// Hội thoại mẫu gắn theo donation (tham chiếu donation qua title — các title chọn ở đây là duy nhất).
// a / b = phone 2 người tham gia. messages[].from = phone người gửi.
// seen = true nếu người CÒN LẠI đã đọc (false → là tin chưa đọc của họ).
const CONVERSATIONS = [
  // 1) Donor ↔ Receiver — đơn đã hoàn tất, tất cả đã đọc.
  {
    donationTitle: 'Cơm hộp thịt kho trứng', a: '0906200001', b: '0905100001', agoHours: 20,
    messages: [
      { from: '0906200001', text: 'Chào anh, mái ấm bọn em xin nhận 30 suất cơm ạ.', seen: true },
      { from: '0905100001', text: 'Được em nhé, 11h30 qua lấy là cơm còn nóng.',     seen: true },
      { from: '0906200001', text: 'Vâng em cảm ơn anh nhiều ạ!',                     seen: true },
      { from: '0905100001', text: 'Không có gì, chúc các bé ăn ngon!',               seen: true },
    ],
  },
  // 2) Receiver ↔ Volunteer — đơn đang giao, có tin CHƯA ĐỌC của receiver.
  {
    donationTitle: 'Bánh ngọt cuối ngày', a: '0906200007', b: '0907300004', agoHours: 1,
    messages: [
      { from: '0907300004', text: 'Em là TNV nhận giao đơn bánh ngọt nhé.',     seen: true },
      { from: '0906200007', text: 'Vâng anh, địa chỉ bên em ở Cầu Giấy ạ.',     seen: true },
      { from: '0907300004', text: 'Anh đang trên đường, 15 phút nữa tới ạ.',    seen: false },
      { from: '0907300004', text: 'Anh tới cổng rồi nhé, ra nhận giúp anh.',    seen: false },
    ],
  },
  // 3) Donor ↔ Volunteer — trao đổi điểm lấy hàng.
  {
    donationTitle: 'Bánh ngọt cuối ngày', a: '0905100005', b: '0907300004', agoHours: 2,
    messages: [
      { from: '0907300004', text: 'Chào anh, em qua lấy đơn bánh ạ. Mình lấy lúc nào tiện ạ?', seen: true },
      { from: '0905100005', text: 'Em qua trước 18h nhé, anh để sẵn ở quầy.',                  seen: true },
      { from: '0907300004', text: 'Vâng em tới nơi sẽ báo ạ.',                                 seen: false },
    ],
  },
  // 4) Receiver ↔ Donor — có gửi kèm hình ảnh (test message attachment).
  {
    donationTitle: 'Cơm chay từ thiện', a: '0906200004', b: '0905100003', agoHours: 26,
    messages: [
      { from: '0905100003', text: 'Gửi chị ảnh suất cơm chay hôm nay ạ.', seen: true },
      { from: '0905100003', text: '', seen: true, attachments: [
        { url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd', name: 'com-chay.jpg', mime_type: 'image/jpeg', size_bytes: 184320 },
      ] },
      { from: '0906200004', text: 'Nhìn ngon quá, cảm ơn anh nhiều!', seen: true },
    ],
  },
  // 5) Đơn "chờ xác nhận" — receiver chưa đọc tin TNV báo đã giao.
  {
    donationTitle: 'Cơm trưa văn phòng (chờ xác nhận)', a: '0906200006', b: '0907300010', agoHours: 1,
    messages: [
      { from: '0907300010', text: 'Em để cơm ở quầy lễ tân giúp chị rồi nhé.',          seen: false },
      { from: '0907300010', text: 'Chị xác nhận đã nhận trên app giúp em với ạ.',       seen: false },
    ],
  },
  // 6) Hội thoại vừa mở, CHƯA có tin nhắn nào (test trạng thái rỗng).
  {
    donationTitle: 'Hải sản tươi: cá, mực', a: '0906200002', b: '0905100004', agoHours: 0,
    messages: [],
  },
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
    const doc = await User.findOneAndUpdate(
      { phone_number: u.phone },
      {
        $set: {
          full_name: u.name,
          role: u.role,
          password: passwordHash,
          is_phone_verified: true,
          profile_completed: true,
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
    Conversation.deleteMany({ participants: { $in: seedIds } }),
    Message.deleteMany({ sender_id: { $in: seedIds } }),
  ]);

  // 4) Tạo donations (+ delivery / feedback / điểm cho đơn hoàn tất)
  const donationDocs = [];
  const feedbacks = [];
  const notifications = [];

  for (const d of DONATIONS) {
    const donorId = id(d.donor);
    const receiverId = d.receiver ? id(d.receiver) : null;
    const volunteerId = d.volunteer ? id(d.volunteer) : null;
    const deliveryType = d.selfPickup ? 'SELF_PICKUP'
      : (volunteerId || d.viaAgent) ? 'VIA_AGENT'
      : null;

    const donation = await FoodDonation.create({
      donor_id: donorId,
      selected_receiver_id: receiverId,
      volunteer_id: volunteerId,
      selected_at: receiverId ? H(-2) : null,
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
      const dStatus = d.deliveryStatus || (
        d.status === 'COMPLETED' ? 'DELIVERED'
        : d.status === 'PICKED_UP' ? 'ON_THE_WAY'
        : d.selfPickup ? 'SELF_PICKUP_READY'
        : volunteerId ? 'AGENT_ASSIGNED'
        : 'WAITING_AGENT');
      const pickedUp = ['ON_THE_WAY', 'AWAITING_CONFIRMATION', 'DELIVERED'].includes(dStatus);

      delivery = await Delivery.create({
        donation_id: donation._id,
        donor_id: donorId,
        receiver_id: receiverId,
        volunteer_id: volunteerId,
        delivery_type: deliveryType || 'SELF_PICKUP',
        status: dStatus,
        pickup_code: code4(),
        assigned_at: volunteerId ? H(-2) : null,
        picked_up_at: pickedUp ? H(-1.5) : null,
        delivered_at: dStatus === 'DELIVERED' ? H(-1) : null,
        cancelled_at: dStatus === 'CANCELLED' ? H(-0.5) : null,
      });
      await FoodDonation.updateOne({ _id: donation._id }, { $set: { delivery_id: delivery._id } });
      donation.delivery_id = delivery._id; // giữ doc trong RAM đồng bộ để seed conversation dùng
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

  // 6) Tạo hội thoại + tin nhắn mẫu
  const conversations = [];
  const messages = [];
  for (const c of CONVERSATIONS) {
    const don = donationDocs.find((x) => x.title === c.donationTitle);
    if (!don) continue;
    const aId = id(c.a);
    const bId = id(c.b);

    const conv = await Conversation.create({
      participants: [aId, bId],
      pair_key: [String(aId), String(bId)].sort().join(':'),
      donation_id: don._id,
      delivery_id: don.delivery_id || null,
      is_active: true,
      last_message_text: '',
      last_message_at: null,
      last_sender_id: null,
    });

    const baseMs = Date.now() - (c.agoHours ?? 3) * 3600 * 1000;
    let last = null;
    (c.messages || []).forEach((m, i) => {
      const senderId = id(m.from);
      const recipientId = String(senderId) === String(aId) ? bId : aId;
      const createdAt = new Date(baseMs + i * 4 * 60 * 1000); // cách nhau 4 phút
      const text = m.text || '';
      messages.push({
        conversation_id: conv._id,
        sender_id: senderId,
        text,
        attachments: m.attachments || [],
        seen_by: m.seen ? [recipientId] : [], // người nhận đã đọc → không tính chưa đọc
        createdAt,
        updatedAt: createdAt,
      });
      last = { text: text || (m.attachments?.length ? '[Hình ảnh]' : ''), at: createdAt, sender: senderId };
    });

    if (last) {
      await Conversation.updateOne(
        { _id: conv._id },
        { $set: { last_message_text: last.text, last_message_at: last.at, last_sender_id: last.sender } },
      );
    }
    conversations.push(conv);
  }
  // timestamps:false để giữ nguyên createdAt thủ công (đảm bảo đúng thứ tự tin nhắn).
  if (messages.length) await Message.insertMany(messages, { timestamps: false });
  console.log(`💬 Conversations: ${conversations.length} | Messages: ${messages.length}`);

  // 7) Thông báo đa dạng (đủ loại type + có cả đã đọc/chưa đọc) cho tab thông báo
  notifications.push(
    { user_id: id('0905100001'), title: 'Yêu cầu mới gần bạn',    message: 'Mái ấm Hy Vọng cần 40 suất cơm.',                            type: 'NEW_FOOD_REQUEST',  related_entity_type: 'FoodRequest',  is_read: false },
    { user_id: id('0905100005'), title: 'Yêu cầu mới gần bạn',    message: 'Bếp ăn tình thương cần 25kg rau củ.',                         type: 'NEW_FOOD_REQUEST',  related_entity_type: 'FoodRequest',  is_read: true },
    { user_id: id('0905100007'), title: 'Yêu cầu mới gần bạn',    message: 'Mái ấm Tình Thương cần 30 suất cháo.',                        type: 'NEW_FOOD_REQUEST',  related_entity_type: 'FoodRequest',  is_read: false },
    { user_id: id('0906200007'), title: 'Tin nhắn mới',           message: 'TNV Phạm Quốc Bảo: "Anh tới cổng rồi nhé."',                  type: 'NEW_MESSAGE',       related_entity_type: 'Conversation', is_read: false },
    { user_id: id('0906200006'), title: 'Chờ bạn xác nhận',       message: 'TNV báo đã giao "Cơm trưa văn phòng". Hãy xác nhận đã nhận.',  type: 'VOLUNTEER_DELIVERY_AWAITING_CONFIRM', related_entity_type: 'Delivery', is_read: false },
    { user_id: id('0905100003'), title: 'Bạn nhận đánh giá 5★',   message: 'Người nhận vừa đánh giá đơn của bạn.',                        type: 'FEEDBACK_RECEIVED', related_entity_type: 'FoodDonation', is_read: true },
    { user_id: id('0905100003'), title: 'Đơn đã hết hạn',         message: '"Cháo dinh dưỡng nóng" hết hạn mà chưa có người nhận.',        type: 'DONATION_EXPIRED',  related_entity_type: 'FoodDonation', is_read: true },
    { user_id: id('0906200004'), title: 'Yêu cầu được chấp nhận', message: 'Donor đã chấp nhận yêu cầu suất ăn tối của bạn.',              type: 'FOOD_REQUEST_ACCEPTED', related_entity_type: 'FoodDonation', is_read: false },
    { user_id: id('0906200006'), title: 'Đã kết nối đơn',         message: 'Bạn đã được kết nối với đơn "Cơm trưa chờ tình nguyện viên".', type: 'DONATION_CONNECTED_AUTO', related_entity_type: 'FoodDonation', is_read: true },
  );
  if (notifications.length) await Notification.insertMany(notifications);
  console.log(`🔔 Notifications: ${notifications.length}`);

  console.log('\n🎉 Seed hoàn tất! Mật khẩu mọi tài khoản: ' + PASSWORD);
  console.log('   Admin: 0900000001 | Donor: 0905100001-010 | Receiver: 0906200001-010 | Volunteer: 0907300001-010');

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Seed lỗi:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
