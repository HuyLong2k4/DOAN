const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../../uploads/donations');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

function sanitizeName(filename = 'file') {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const userId = req.user?.id || 'anonymous';
        const safeName = sanitizeName(file.originalname || 'image');
        cb(null, `${userId}-${timestamp}-${safeName}`);
    },
});

const uploadDonationImages = multer({
    storage,
    limits: {
        files: 6,
        fileSize: 8 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            return cb(new Error('Chỉ chấp nhận file ảnh.'));
        }
        cb(null, true);
    },
});

module.exports = {
    uploadDonationImages,
};
