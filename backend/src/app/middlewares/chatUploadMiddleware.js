const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../../uploads/chat');
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
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const safeName = sanitizeName(file.originalname || 'file');
        cb(null, `${timestamp}-${safeName}`);
    },
});

const uploadChatAttachment = multer({
    storage,
    limits: {
        files: 5,
        fileSize: 10 * 1024 * 1024,
    },
});

module.exports = {
    uploadChatAttachment,
};
