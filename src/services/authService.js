// authService.js
import jwt from 'jsonwebtoken';

function generateToken(user) {
    return jwt.sign({ id: user.id, userNum: user.userNum }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

export default {
    generateToken,
    verifyToken,
}