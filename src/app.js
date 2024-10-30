import 'dotenv/config';
import express from 'express';

import userController from './controllers/userController.js';
import groupController from './controllers/groupController.js';
import ImageController from './controllers/ImageController.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

//app.use('/api/image', ImageController);
app.use('/api', userController);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(201).json('Welcome');
    console.log("welcome!");
});



app.use(errorHandler);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
