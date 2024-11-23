import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import userController from './controllers/userController.js';
import groupController from './controllers/groupController.js';
import ImageController from './controllers/ImageController.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

//app.use('/api/image', ImageController);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/group', express.static(path.join(__dirname, 'group')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/profile', express.static(path.join(__dirname, 'profile')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', userController);
app.use('/api/group', groupController);

app.get('/', (req, res) => {
    res.status(201).json('Welcome');
    console.log("welcome!");
});



app.use(errorHandler);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
