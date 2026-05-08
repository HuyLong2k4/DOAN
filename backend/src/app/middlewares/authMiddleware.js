const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token',
            });
        }

        const token = header.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        // Token bị vô hiệu hoá (logout / đổi mật khẩu) → token_version đã tăng
        const tokenVersion = decoded.tokenVersion ?? 0;
        const userVersion  = user.token_version  ?? 0;
        if (tokenVersion !== userVersion) {
            return res.status(401).json({
                success: false,
                message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            });
        }

        if (user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khoá.',
            });
        }

        req.user = {
            id:                user._id.toString(),
            email:             user.email,
            phone_number:      user.phone_number,
            full_name:         user.full_name,
            role:              user.role,
            onboarding_step:   user.onboarding_step,
            profile_completed: user.profile_completed,
        };

        return next();
    } catch (err) {
        console.log('[authMiddleware]', err.message);
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token failed',
        });
    }
};

module.exports = authMiddleware;
