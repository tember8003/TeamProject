import jwt from 'jsonwebtoken';

export default function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '토큰이 없습니다. 접근이 불가합니다.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT 인증 실패:", err);
            return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
        }

        req.user = user; // 유효한 토큰의 정보를 저장
        next();
    });
}