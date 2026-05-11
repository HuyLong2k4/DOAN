const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Khởi tạo Firebase Admin SDK theo thứ tự ưu tiên:
 *   1. FIREBASE_CREDENTIALS_JSON  — nội dung JSON service account (string, 1 dòng).
 *   2. GOOGLE_APPLICATION_CREDENTIALS — đường dẫn file JSON (mount vào container).
 *   3. File ./<firebase-adminsdk*.json> trong thư mục này (fallback dev cũ).
 */
function initFirebase() {
    if (admin.apps.length > 0) return admin.app();

    let credential;

    if (process.env.FIREBASE_CREDENTIALS_JSON) {
        try {
            const json = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
            credential = admin.credential.cert(json);
        } catch (err) {
            console.error('[firebase] FIREBASE_CREDENTIALS_JSON parse error:', err.message);
            process.exit(1);
        }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (!fs.existsSync(filePath)) {
            console.error(`[firebase] GOOGLE_APPLICATION_CREDENTIALS file not found: ${filePath}`);
            process.exit(1);
        }
        credential = admin.credential.cert(require(filePath));
    } else {
        // Fallback: tìm file *firebase-adminsdk*.json trong cùng thư mục (dev only)
        const files = fs.readdirSync(__dirname).filter((f) => /firebase-adminsdk.*\.json$/i.test(f));
        if (files.length === 0) {
            console.error('[firebase] Missing Firebase credentials. Set FIREBASE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
            process.exit(1);
        }
        credential = admin.credential.cert(require(path.join(__dirname, files[0])));
    }

    admin.initializeApp({ credential });
    console.log('Firebase Admin initialized');
    return admin.app();
}

module.exports = { initFirebase };
