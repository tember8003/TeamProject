import express from 'express';
import groupService from '../services/groupService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authenticateToken from '../middlewares/authenticateToken.js';

const groupController = express.Router();

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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    console.log("파일 MIME 타입:", file.mimetype);

    if (allowedTypes.includes(file.mimetype)) {
        console.log("허용된 파일 형식입니다.");
        callback(null, true);
    } else {
        console.error("지원하지 않는 파일 형식입니다.");
        callback(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

//동아리 정보 가져오기
groupController.get('/:id', async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);

        if (isNaN(groupId)) {
            return res.status(400).json({ error: 'Invalid group ID.' });
        }

        const group = await groupService.getInfo(groupId);

        return res.status(200).json(group);
    } catch (error) {
        if (error.code) {
            return res.status(error.code).json({ error: error.message });
        }
        next(error);
    }
});

//동아리 삭제
groupController.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);

        if (isNaN(groupId)) {
            return res.status(400).json({ error: 'Invalid group ID.' });
        }

        await groupService.deleteGroup(groupId);

        return res.status(200).json({ message: '동아리가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        if (error.code) {
            return res.status(error.code).json({ error: error.message });
        }
        next(error);
    }
});

//유저 개인 페이지에 프로필 사진 등록하기 위해 설정
const uploadgroupImage = multer({
    storage: createMulterStorage('group'),
    fileFilter: fileFilter
});


//동아리 내용 수정 (기본적인 이름,설명,이미지,태그,카테고리만 등록됨) - 후기 내용 추가해야 함. (테스트 아직 X)
groupController.put('/:id', uploadgroupImage.single('GroupImage'), authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        let { name, category, description, tags, GroupTime, GroupRoom, period, Contact } = req.body;

        if (isNaN(groupId)) {
            return res.status(400).json({ error: 'Invalid group ID.' });
        }
        // `tags`가 문자열이면 배열로 변환
        const tagsArray = Array.isArray(tags) ? tags : [tags];

        //console.log("req.file:", req.file);

        // 업로드된 그룹 이미지 URL 생성
        let groupImageUrl;
        if (req.file) {
            groupImageUrl = `${req.protocol}://${req.get('host')}/group/${req.file.filename}`;
        }

        const groupData = {
            id: groupId,
            name,
            category,
            description,
            tags: tagsArray,
            GroupTime,
            GroupRoom,
            period,
            Contact,
            GroupImage: groupImageUrl || null // 동아리 프로필 이미지 URL 저장
        };

        const group = await groupService.updateGroup(groupData, userId);

        return res.status(200).json({ message: '동아리 수정 성공' });
    } catch (error) {
        next(error);
    }
});

//질문 등록 (테스트 아직 X)
groupController.post(':/id/questions', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { questionText } = req.body;

        if (!questionText) {
            return res.status(400).json({ error: '질문을 등록해주세요' });
        }

        const questionData = {
            groupId,
            questionText
        }

        const question = await groupService.postQuestion(questionData, userId);

        return res.status(201).json({ message: '질문 등록 성공' });
    } catch (error) {
        next(error);
    }
});

//어드민 페이지 불러오기
groupController.get('/:id/clubAdmin', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        const club = await groupService.getClubAdmin(groupId, userId);

        return res.status(201).json(club);
    } catch (error) {
        if (error.code === 403) {
            console.log("권한이 없습니다!");
        }
        next(error);
    }
});

//동아리내 후기 작성 (테스트 아직 X)
groupController.post('/:id/review', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { ratingScore, review, options, date } = req.body;

        // 날짜 검증 및 변환
        const reviewDate = new Date(date); // 클라이언트에서 보낸 날짜를 Date 객체로 변환
        if (isNaN(reviewDate.getTime())) {
            return res.status(400).json({ error: '유효한 날짜 형식이 아닙니다.' });
        }

        if (!ratingScore || !review) {
            return res.status(400).json({ error: '별점이나 후기를 등록해주세요' });
        }

        if (ratingScore < 1 || ratingScore > 5) {
            return res.status(400).json({ error: '별점은 1~5 사이의 값이어야 합니다.' });
        }

        const ratingData = {
            groupId,
            ratingScore,
            review,
            options,
            createdAt: reviewDate.toISOString()
        };

        const rating = await groupService.postRating(ratingData, userId);

        return res.status(201).json({ message: '후기 등록 성공', data: rating });
    } catch (error) {
        next(error);
    }
});

/*
//후기 비공개/공개 전환
groupController.patch('/:id/rating-visibility', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const { isRatingPublic } = req.body;
        const userId = req.user.id;

        if (typeof isRatingPublic !== 'boolean') {
            return res.status(400).json({ error: 'Invalid value for isRatingPublic.' });
        }

        const updatedGroup = await groupService.updateRatingPublic(userId, groupId, isRatingPublic);

        return res.status(200).json({ message: '공개/비공개 전환 성공', data: updatedGroup });
    } catch (error) {
        next(error);
    }
});
*/

//질문 불러오기
groupController.get('/:id/questions', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        if (isNaN(groupId)) {
            return res.status(400).json({ error: '유효하지 않은 동아리 ID입니다.' });
        }

        const group = await groupService.getQuestions(userId, groupId);

        return res.status(200).json(group);
    } catch (error) {
        next(error);
    }
});

//동아리 활동내용 불러오기
groupController.get('/:id/activity', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        if (isNaN(groupId)) {
            return res.status(400).json({ error: '유효하지 않은 동아리 ID입니다.' });
        }

        const group = await groupService.getActive(userId, groupId);

        return res.status(200).json(group);
    } catch (error) {
        next(error);
    }
});

// 활동내용 등록
groupController.post('/:id/activity', authenticateToken, uploadgroupImage.array('images', 5), async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { title, description, type } = req.body;

        if (!title || !type) {
            return res.status(400).json({ error: '활동 제목과 타입을 입력해주세요.' });
        }

        // 업로드된 이미지 경로 배열 생성
        const imagePaths = req.files.map(file => `${req.protocol}://${req.get('host')}/group/${file.filename}`);

        // 활동 내용 데이터 생성
        const activityData = {
            groupId,
            title,
            description,
            images: imagePaths,
            type
        };

        // 서비스 호출
        const activity = await groupService.createActivity(activityData, userId);

        return res.status(201).json({ message: '활동내용 등록 성공', data: activity });
    } catch (error) {
        next(error);
    }
});

export default groupController;