// Đọc app.json làm base rồi inject các giá trị động từ env.
// EAS sẽ truyền env theo profile build (xem eas.json).
const base = require('./app.json');

module.exports = () => ({
  ...base.expo,
  android: {
    ...base.expo.android,
    config: {
      ...(base.expo.android?.config || {}),
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || '',
      },
    },
  },
});
