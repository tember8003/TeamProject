import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import userController from './controllers/userController.js';
import groupController from './controllers/groupController.js';
import ImageController from './controllers/ImageController.js';
import errorHandler from './middlewares/errorHandler.js';
import cors from 'cors';

const app = express();


//app.use('/api/image', ImageController);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 백엔드 코드 배포용 설정
app.use(cors({
    origin: ['https://4601-1-238-203-158.ngrok-free.app', 'http://127.0.0.1:5000'], // 허용할 도메인들
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // 쿠키 및 인증 정보를 포함한 요청 허용
}));

app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.use('/group', express.static(path.join(__dirname, 'group')));
app.use('/uploads', express.static('/uploads'));
//app.use('/profile', express.static(path.join(__dirname, 'profile')));
app.use('/api', userController);
app.use('/api/group', groupController);


app.get('/check-files', (req, res) => {
    const uploadsDir = '/uploads'; // Persistent Disk 경로
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        res.json({ files });
    } else {
        res.status(404).json({ message: 'Uploads directory does not exist' });
    }
});

app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send({ message: 'File not found' });
    }
});

app.get('/', (req, res) => {
    res.status(201).json('Welcome');
    console.log("welcome!");
});

app.use(errorHandler);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
