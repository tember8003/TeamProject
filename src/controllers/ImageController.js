import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ImageController = express.Router();
//이미지 URL 추출용 Controller


//이미지 저장소 설정
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = 'uploads/';

        // 폴더가 없으면 생성
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }

        callback(null, uploadPath);
    },
    filename(req, file, callback) {
        callback(null, Date.now() + path.extname(file.originalname));
    }
});

// 파일 타입 검증 (이미지 파일만 허용)
const fileFilter = (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

const uploadMiddleware = upload.single('image');

//이미지 업로드시 폴더 저장 후 URL 추출
ImageController.post('/', uploadMiddleware, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '이미지가 업로드되지 않았습니다.' });
        }

        //const imageUrl = `/uploads/${req.file.filename}`;

        //절대경로로 이미지 URL 생성
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        return res.status(201).json({ imageUrl });
    } catch (error) {
        return res.status(500).json({ message: '이미지 업로드 중 오류가 발생했습니다.', error });
    }
});

export default ImageController;