import express from 'express';
import groupService from '../services/groupService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authenticateToken from '../middlewares/authenticateToken.js';

const groupController = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = '/uploads'; // Persistent Disk 경로
        console.log("파일 저장 경로:", uploadPath); // 경로 확인 로그
        callback(null, uploadPath); // 저장 경로 지정
    },
    filename: function (req, file, callback) {
        const sanitizedFilename = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
        console.log("파일 이름:", sanitizedFilename); // 파일 이름 확인 로그
        callback(null, sanitizedFilename);
    }
});

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


const uploadAllFiles = multer({
    storage: storage,
    fileFilter: fileFilter
});

//동아리 내용 수정 (기본적인 이름,설명,이미지,태그,카테고리만 등록됨) - 후기 내용 추가해야 함. (테스트 아직 X)
groupController.put('/:id', uploadAllFiles.fields([
    { name: 'GroupImage' },
    { name: 'IntroduceImage' }]), authenticateToken, async (req, res, next) => {
        try {
            console.log('[DEBUG] Request Headers:', req.headers);
            const groupId = parseInt(req.params.id, 10);
            const userId = req.user.id;
            console.log('[DEBUG] req.files:', req.files);

            if (!req.files) {
                return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
            }

            let { name, GroupLeader, category, description, GroupTime, GroupRoom, Contact } = req.body;

            if (isNaN(groupId)) {
                return res.status(400).json({ error: 'Invalid group ID.' });
            }

            //console.log("req.file:", req.file);

            // 업로드된 그룹 이미지 URL 생성
            const groupImageUrl = req.files['GroupImage']
                ? `${req.protocol}://${req.get('host')}/uploads/${req.files['GroupImage'][0].filename}`
                : null;
            const introduceImageUrl = req.files['IntroduceImage']
                ? `${req.protocol}://${req.get('host')}/uploads/${req.files['IntroduceImage'][0].filename}`
                : null;

            const groupData = {
                id: groupId,
                name,
                GroupLeader,
                category,
                description,
                GroupTime,
                GroupRoom,
                Contact,
                GroupImage: groupImageUrl || null, // 동아리 프로필 이미지 URL 저장
                IntroduceImage: introduceImageUrl || null,

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
        console.log("리뷰하러 왔습니다!!");
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { ratingScore, review, options, date } = req.body;

        console.log("클라이언트에서 받은 날짜:", date);

        // 날짜 검증 및 변환
        const reviewDate = new Date(date); // 클라이언트에서 보낸 날짜를 Date 객체로 변환
        if (isNaN(reviewDate.getTime())) {
            try {
                reviewDate = new Date(date.replace('.', '-').replace('오후', 'PM').replace('오전', 'AM'));
            } catch (error) {
                return res.status(400).json({ error: '유효한 날짜 형식이 아닙니다.' });
            }
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

        console.log("리뷰 성공인 거 같습니다!");
        return res.status(201).json({ message: '후기 등록 성공', data: rating });
    } catch (error) {
        console.log("리뷰 실패했습니다..");
        next(error);
    }
});

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

        const group = await groupService.getActive(groupId, userId);

        return res.status(200).json(group);
    } catch (error) {
        next(error);
    }
});

// 활동내용 등록
groupController.post('/:id/activity', authenticateToken, uploadAllFiles.single('ActivityImage'), async (req, res, next) => {
    try {
        console.log("활동내용 등록할래요!!");
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { title, description } = req.body;

        console.log('Request body:', req.body);
        console.log('File:', req.file); // 단일 파일 확인

        if (!title) {
            return res.status(400).json({ error: '활동 제목을 입력해주세요.' });
        }

        // 단일 파일의 경로 구성
        const ImagePaths = req.file
            ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            : null;

        // 활동 내용 데이터 생성
        const activityData = {
            groupId,
            title,
            description,
            ActivityImage: ImagePaths,
        };

        console.log('Activity Data:', activityData); // 디버깅용 출력

        // 서비스 호출
        const activity = await groupService.createActivity(activityData, userId);
        return res.status(201).json({ message: '활동내용 등록 성공', data: activity });
    } catch (error) {
        console.error("활동내용 등록 실패했어요..", error);
        next(error);
    }
});

groupController.put('/:id/form', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { form } = req.body;

        if (isNaN(groupId)) {
            return res.status(400).json({ error: '유효하지 않은 동아리 ID입니다.' });
        }

        const addform = groupService.addForm(groupId, userId, form);

        return res.status(200).json(addform);
    } catch (error) {
        next(error);
    }
});

groupController.post('/:id/member', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { userNum, name } = req.body;

        if (isNaN(groupId)) {
            return res.status(400).json({ error: '유효하지 않은 동아리 ID입니다.' });
        }
        const groupData = {
            userNum,
            name,
        }

        const addMember = await groupService.addMember(groupId, userId, groupData);


        return res.status(200).json(addMember);
    } catch (error) {
        console.error("멤버 추가 중 에러:", error);
        return res.status(500).json({ error: '멤버 추가 중 오류가 발생했습니다.', details: error.message });
    }
})

groupController.get('/:id/form', authenticateToken, async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.id, 10);

        if (isNaN(groupId)) {
            return res.status(400).json({ error: '유효하지 않은 동아리 ID입니다.' });
        }

        const getform = groupService.getForm(groupId);

        return res.status(200).json(getform);
    } catch (error) {
        next(error);
    }
});


export default groupController;