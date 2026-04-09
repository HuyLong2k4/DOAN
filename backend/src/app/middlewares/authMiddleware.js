const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    let token;

    try {
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
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
        }

        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });

    } catch (err) {
        console.log(err);
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token failed'
        });
    }
};

module.exports = authMiddleware;
