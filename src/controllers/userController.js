import express from 'express';
import userService from '../services/userService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authenticateToken from '../middlewares/authenticateToken.js';
import authService from '../services/authService.js';

//-------회원가입 로직용 시작----------

import { fileURLToPath } from 'url';

// __dirname을 ESM 방식으로 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userController = express.Router();

// 이미지 저장소 설정을 생성하는 함수
function createMulterStorage(folderName) {
    const uploadPath = path.join(__dirname, '..', folderName);

    // 폴더가 존재하지 않으면 생성
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    return multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, uploadPath);
        },
        filename(req, file, callback) {
            callback(null, Date.now() + path.extname(file.originalname));
        }
    });
}

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

const upload = multer({ storage: createMulterStorage('uploads'), fileFilter: fileFilter });

// 유저 회원가입하기 (이미지와 함께 데이터 받기)
userController.post('/register', upload.single('MSI_Image'), async (req, res, next) => {
    try {
        console.log("회원가입 요청");

        let { userNum, name, nickname, email, password, category } = req.body;

        if (!password || !userNum || !name || !email) {
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

//-------회원가입 로직용 끝----------

//개인 페이지 조회하기
userController.get('/user_page', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id; // 토큰에서 유저 ID 가져오기
        const user = await userService.getUserById(userId);

        return res.status(200).json(user);
    } catch (error) {
        return next(error);
    }
});

//유저 로그인하기 + 나중엔 token 값 출력X
userController.post('/login', async (req, res, next) => {
    try {
        let { userNum, password } = req.body;

        if (!/^\d+$/.test(userNum)) {
            return { status: 400, message: '학번 혹은 비밀번호가 틀렸습니다.' };
        }
        userNum = parseInt(userNum, 10);

        const userData = {
            userNum,
            password
        };

        const result = await userService.login(userData);

        if (result.status === 200) {
            // 로그인 성공 시 토큰 발행
            const token = authService.generateToken({ id: result.user.id, userNum: result.user.userNum });
            res.status(200).json({ message: '로그인 성공', token });
        } else {
            res.status(result.status).json({ message: result.message });
        }
    } catch (error) {
        if (error.code === 422) {
            res.status(422).json({ message: error.message });
        } else {
            next(error);
        }
    }
});

//유저 삭제
userController.delete('/user_page', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id; // 토큰에서 유저 ID 가져오기
        const password = req.body.password;
        const userData = {
            id: userId,
            password
        }

        if (!password) {
            return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
        }

        const DeletedUser = await userService.deleteUser(userData);

        return res.status(200).json({ message: '삭제 완료' });
    } catch (error) {
        if (error.code === 401) {
            res.status(401).json({ message: error.message });
        } else {
            return next(error);
        }
    }
});

//유저 개인 페이지에 프로필 사진 등록하기 위해 설정
const uploadProfileImage = multer({
    storage: createMulterStorage('profile'),
    fileFilter: fileFilter
});

//유저 개인 페이지 수정
userController.update('/user_page', authenticateToken, uploadProfileImage.single('ProfileImage'), async (req, res, next) => {
    try {
        const userId = req.user.id; // 인증된 사용자 ID 가져오기
        const { password, category, nickname } = req.body;

        // 업로드된 프로필 이미지 URL 생성
        let profileImageUrl;
        if (req.file) {
            profileImageUrl = `${req.protocol}://${req.get('host')}/profile/${req.file.filename}`;
        }

        const updateData = {
            password,
            category,
            nickname,
            ProfileImage: profileImageUrl || null // 프로필 이미지 URL 저장
        };

        // 프로필 정보 업데이트
        const updatedUser = await userService.updateUserProfile(userId, updateData);

        return res.status(200).json({ message: '프로필이 성공적으로 업데이트되었습니다.', user: updatedUser });

    } catch (error) {

    }
});


export default userController;
