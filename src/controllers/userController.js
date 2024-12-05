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

function createMulterStorage(folderName) {
    // 프로젝트 루트 경로에서 src/group 경로로 설정
    const uploadPath = path.join(__dirname, '..', folderName); // '..'을 추가해 상위 폴더로 이동

    // 폴더가 존재하지 않으면 생성
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    return multer.diskStorage({
        destination: function (req, file, callback) {
            console.log("파일 저장 경로:", uploadPath); // 경로 확인
            callback(null, uploadPath);
        },
        filename(req, file, callback) {
            const fileName = Date.now() + path.extname(file.originalname);
            console.log("파일 이름:", fileName); // 파일 이름 확인
            callback(null, fileName);
        }
    });
}



const fileFilter = (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    //console.log("파일 MIME 타입:", file.mimetype);

    if (allowedTypes.includes(file.mimetype)) {
        //console.log("허용된 파일 형식입니다.");
        callback(null, true);
    } else {
        //console.error("지원하지 않는 파일 형식입니다.");
        callback(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

// 문서 파일 필터
const documentFileFilter = (req, file, callback) => {
    const allowedDocumentTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/haansofthwp' // .hwp
    ];

    if (allowedDocumentTypes.includes(file.mimetype)) {
        callback(null, true); // 허용된 문서 형식
    } else {
        callback(new Error('지원하지 않는 문서 파일 형식입니다.'), false); // 허용되지 않은 문서 형식
    }
};

const upload = multer({ storage: createMulterStorage('uploads'), fileFilter: fileFilter });

// 유저 회원가입하기 (이미지와 함께 데이터 받기)
userController.post('/register', upload.single('MSI_Image'), async (req, res, next) => {
    try {
        console.log("회원가입 요청");
        console.log("요청 데이터:", req.body);
        console.log("업로드된 파일:", req.file);

        let { userNum, name, nickname, email, password, category } = req.body;

        if (!password || !userNum || !name || !email) {
            return res.status(400).json({ message: '잘못된 요청입니다. - 필수 입력사항을 적어주세요.' });
        }

        const categoryArray = Array.isArray(category) ? category : [category];

        console.log("Uploaded file details:", req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'MSI 사진을 반드시 등록해야 합니다.' });
        }

        if (/^\d+$/.test(userNum)) {
            userNum = userNum.trim();
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
            category: categoryArray || [],
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

userController.get('/user_page/review', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id; // 토큰에서 유저 ID 가져오기
        const user = await userService.getReviewById(userId);

        return res.status(200).json(user);
    } catch (error) {
        return next(error);
    }
})

//유저 로그인하기 + 나중엔 token 값 출력X
userController.post('/login', async (req, res, next) => {
    try {
        let { userNum, password } = req.body;
        console.log("로그인할래요!!");

        if (!/^\d+$/.test(userNum)) {
            return { status: 400, message: '학번 혹은 비밀번호가 틀렸습니다.' };
        }

        const userData = {
            userNum,
            password
        };
        console.log("유효성 검사 통과, 데이터:", userData);

        const result = await userService.login(userData);

        if (result.status === 200) {
            // 로그인 성공 시 토큰 발행
            const token = authService.generateToken({ id: result.user.id, userNum: result.user.userNum });
            console.log("로그인 했어요!!");
            res.status(200).json({
                message: '로그인 성공', token, user: {
                    id: result.user.id,
                    userNum: result.user.userNum,
                    name: result.user.name
                }
            });
        } else {
            console.log("로그인 못했어요..");
            res.status(result.status).json({ message: result.message });
        }
    } catch (error) {
        next(error);
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

/*
//유저 개인 페이지에 프로필 사진 등록하기 위해 설정
const uploadProfileImage = multer({
    storage: createMulterStorage('profile'),
    fileFilter: fileFilter
});
*/

//유저 개인 페이지 수정
userController.put('/user_page', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id; // 인증된 사용자 ID 가져오기
        const { password, category } = req.body;

        /*
        // 업로드된 프로필 이미지 URL 생성 - 프로필 사진 삭제
        let profileImageUrl;
        if (req.file) {
            profileImageUrl = `${req.protocol}://${req.get('host')}/profile/${req.file.filename}`;
        }
        */

        const updateData = {
            password,
            category,
            //nickname,
            //ProfileImage: profileImageUrl || null // 프로필 이미지 URL 저장
        };

        // 프로필 정보 업데이트
        const updatedUser = await userService.updateUserProfile(userId, updateData);

        return res.status(200).json({ message: '프로필이 성공적으로 업데이트되었습니다.', user: updatedUser });

    } catch (error) {
        next(error);
    }
});

//카테고리별 동아리 목록 (동아리 추천 기능 X - 제외하기로 함)
userController.get('/main', async (req, res, next) => {
    try {
        //const userId = req.user.id; // 인증된 사용자 ID 가져오기
        //const recommendedGroups = await userService.getRecommendedGroups(userId);
        console.log("들어옴!!");

        const sortBy = req.query.sortBy || 'latest';
        //const category = req.query.category || 'IT';

        const group = await userService.getGroup(sortBy);

        return res.status(200).json(group);
    } catch (error) {
        next(error);
    }
});

const uploadAllFiles = multer({
    storage: createMulterStorage('uploads'),
    fileFilter: (req, file, callback) => {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const allowedDocumentTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/haansofthwp' // .hwp
        ];
        const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes];

        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true); // 허용된 파일 형식
        } else {
            callback(new Error('지원하지 않는 파일 형식입니다.'), false); // 허용되지 않은 파일 형식
        }
    }
});

userController.post(
    '/group_form',
    uploadAllFiles.fields([
        { name: 'GroupImage', maxCount: 1 },
        { name: 'IntroduceImage', maxCount: 1 },
        { name: 'ActiveLog', maxCount: 1 }
    ]),
    authenticateToken,
    async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { name, GroupLeader, category, description, GroupTime, GroupRoom, Contact } = req.body;

            console.log("동아리 등록할래요!");

            console.log("받은 요청 데이터:", req.body);
            console.log("업로드된 파일:", req.files);

            if (!name || !category || !description) {
                return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
            }

            // 업로드된 파일 URL 생성
            const groupImageUrl = req.files['GroupImage']
                ? `${req.protocol}://${req.get('host')}/uploads/${req.files['GroupImage'][0].filename}`
                : null;
            const introduceImageUrl = req.files['IntroduceImage']
                ? `${req.protocol}://${req.get('host')}/uploads/${req.files['IntroduceImage'][0].filename}`
                : null;
            const activeLogUrl = req.files['ActiveLog']
                ? `${req.protocol}://${req.get('host')}/uploads/${req.files['ActiveLog'][0].filename}`
                : null;

            const groupData = {
                name,
                GroupLeader,
                category,
                description,
                GroupTime,
                GroupRoom,
                Contact,
                GroupImage: groupImageUrl,
                IntroduceImage: introduceImageUrl,
                ActiveLog: activeLogUrl
            };

            const group = await userService.createGroup(userId, groupData);

            return res.status(201).json({ message: '동아리 신청이 완료됐습니다. 관리자가 확인 후 승인됩니다.' });
        } catch (error) {
            next(error);
        }
    }
);


export default userController;
