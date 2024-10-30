import express from 'express';
import userService from '../services/userService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { fileURLToPath } from 'url';

// __dirname을 ESM 방식으로 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userController = express.Router();

// 이미지 저장소 설정 (multer 설정)
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        callback(null, uploadPath);
    },
    filename(req, file, callback) {
        callback(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    console.log("파일 MIME 타입:", file.mimetype);

    if (allowedTypes.includes(file.mimetype)) {
        console.log("허용된 파일 형식입니다.");
        callback(null, true);
    } else {
        console.error("지원하지 않는 파일 형식입니다.");
        callback(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// 유저 회원가입하기 (이미지와 함께 데이터 받기)
userController.post('/register', upload.single('MSI_Image'), async (req, res, next) => {
    try {
        console.log("회원가입 요청");

        let { userNum, name, nickname, phoneNumber, email, password, category } = req.body;

        if (!password || !userNum || !name || !phoneNumber || !email) {
            return res.status(400).json({ message: '잘못된 요청입니다. - 필수 입력사항을 적어주세요.' });
        }

        console.log("Uploaded file details:", req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'MSI 사진을 반드시 등록해야 합니다.' });
        }

        if (/^\d+$/.test(userNum)) {
            userNum = parseInt(userNum, 10);
        } else {
            return res.status(400).json({ message: 'userNum은 숫자로만 구성되어야 합니다.' });
        }

        const MSI_ImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const userData = {
            userNum,
            name,
            nickname: nickname || '익명',
            phoneNumber,
            email,
            password,
            category: category || [],
            MSI_Image: MSI_ImageUrl,
            status: "pending"
        };

        const createdUser = await userService.createUser(userData);
        return res.status(201).json({ message: '회원가입 요청이 접수되었습니다. 관리자가 승인 후 사용할 수 있습니다.', user: createdUser });

    } catch (error) {
        if (error.code === 422) {
            res.status(422).json({ message: error.message });
        } else {
            return next(error);
        }
    }
});

export default userController;
