import jwt from 'jsonwebtoken';

export default function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401); // 토큰이 없으면 접근 불가

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // 유효하지 않은 토큰
        req.user = user; // 토큰이 유효하면 user 정보를 req에 저장
        next();
    });
}