// authService.js
import jwt from 'jsonwebtoken';

console.log("JWT_SECRET:", process.env.JWT_SECRET);

function generateToken(user) {
    return jwt.sign({ id: user.id, userNum: user.userNum, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

}

function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.error("JWT 검증 실패:", err);
        throw new Error("Invalid token");
    }
}

export default {
    generateToken,
    verifyToken,
}