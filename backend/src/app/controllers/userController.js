const UserService = require('../services/userService');

class UserController {
    // GET /api/users/:id
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            if(req.user.id !== id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập'
                })
            }

            const user = await UserService.getUserById(id);

            return res.status(200).json({
                success: true,
                data: user,
            });
        } catch (err){
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/users
    static async getAllUsers(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
    }
            const users = await UserService.getAllUsers();
            return res.status(200).json({
                success: true,
                data: users,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }

    // POST /api/users
    static async createUser(req, res) {
        try {
            const { full_name, phone_number, email, password, avatar_url, role } = req.body;

            if(!full_name || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'full_name, password là bắt buộc',
                });
            }

            const user = await UserService.createUser({ full_name, phone_number, email, password, avatar_url, role })

            return res.status(201).json({
                success: true,
                data: user,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ 
                success: false,
                message: err.message,
            });
        }
    }

    // PATCH /api/users/:id
    static async updateUser(req, res) {
        try {
            const { id } = req.params;

            if(req.user.id !== id && req.user.role !== 'ADMIN'){
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền cập nhật',
                });
            }

            const allowedFields = ['full_name', 'phone_number', 'email', 'avatar_url'];
            const updateData = {};

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            })

            const updatedUser = await UserService.updateUser(id, updateData);

            return res.status(200).json({
                success: true,
                data: updatedUser
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }

    static async changePassword(req, res) {
        try {
            const { id } = req.params;
            const { oldPassword, newPassword } = req.body;
        
            if(req.user.id !== id) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền đổi mật khẩu'
                });
            }
        
            const result = await UserService.changePassword(id, oldPassword, newPassword);
        
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }

    // DELETE api/users/:id
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            if(req.user.id !== id && req.user.role !== 'ADMIN'){
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền xóa user này'
                });
            }

            const result = await UserService.deleteUser(id);
            
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/users/leaderboard
    static async getLeaderboard(req, res) {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const data = await UserService.getLeaderboard(limit);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }
}

module.exports = UserController;