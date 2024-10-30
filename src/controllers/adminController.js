import express from 'express';
import userService from '../services/userService.js';

const adminController = express.Router();

function adminOnly(req, res, next) {
    if (req.user && req.user.userType === 'developer') {
        return next();
    }
    return res.status(403).json({ message: '접근 권한이 없습니다.' });
}

// 관리자 전용 라우터에 권한 확인 미들웨어 적용
adminController.use(adminOnly);


adminController.get('/users', async (req, res) => {
    try {
        const { status } = req.query; // 쿼리 파라미터로 status 필터 (예: pending)
        const users = await userService.getUsersByStatus(status);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: '사용자 목록 조회 중 오류가 발생했습니다.', error });
    }
});

adminController.patch('/approveUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await userService.getUserById(userId);

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        user.status = "approved"; // 상태를 approved로 설정
        await user.save();
        res.status(200).json({ message: '사용자가 승인되었습니다.', user });
    } catch (error) {
        res.status(500).json({ message: '사용자 승인 중 오류가 발생했습니다.', error });
    }
});

adminController.patch('/setUserType/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { newUserType } = req.body; // "admin" 또는 "user"

        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        user.userType = newUserType;
        await user.save();
        res.status(200).json({ message: `사용자 역할이 ${newUserType}으로 변경되었습니다.`, user });
    } catch (error) {
        res.status(500).json({ message: '사용자 역할 변경 중 오류가 발생했습니다.', error });
    }
});

export default adminController;