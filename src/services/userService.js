import userRepository from "../repositories/userRepository.js";
import bcrypt from 'bcrypt';

async function validateUserNumber(userNum) {//이미 있는 학번인지 검사
    const existedNum = await userRepository.findByNum(userNum);

    if (existedNum) {
        const error = new Error('동일한 학번이 존재합니다.');
        error.code = 422;
        error.data = { userNum };
        throw error;
    }
}

async function validateEmail(email) { //이미 있는 이메일인지 검사
    const existedEmail = await userRepository.findByEmail(email);

    if (existedEmail) {
        const error = new Error('동일한 이메일이 존재합니다.');
        error.code = 422;
        error.data = { email };
        throw error;
    }
}

async function createUser(userData) { //유저 생성
    await validateUserNumber(userData.userNum); //이미 있는 학번이면 Error 처리
    await validateEmail(userData.email); //이미 있는 이메일이면 Error 처리

    if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
    }

    const createdUser = await userRepository.createUser(userData);
    return filterSensitiveUserData(createdUser, ['password']);
}

//password같은 중요 데이터는 해싱되어 저장되므로 가져오지 않음.
function filterSensitiveUserData(userData, sensitiveFields = []) {
    const filteredData = { ...userData };

    for (const field of sensitiveFields) {
        delete filteredData[field];
    }

    return filteredData;
}

export default {
    createUser,
}