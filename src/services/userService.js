import userRepository from "../repositories/userRepository.js";
import groupRepository from "../repositories/groupRepository.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import 'dotenv/config'; // dotenv 사용

const secretKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';

function hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

async function validateUserNumber(userNum) {//이미 있는 학번인지 검사
    if (typeof userNum !== 'string') {
        userNum = String(userNum);
    }

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

function encrypt(text) { //암호화
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`; // IV와 암호화된 데이터 반환
}

function decrypt(encryptedText) { //복호화
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex'); // IV를 버퍼로 변환
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
    return decrypted.toString();
}

async function createUser(userData) { //유저 생성
    await validateUserNumber(userData.userNum); //이미 있는 학번이면 Error 처리
    await validateEmail(userData.email); //이미 있는 이메일이면 Error 처리

    //비밀번호 해싱 작업
    if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
    }

    // 학번 해싱
    userData.userNum = hash(userData.userNum);

    //이메일 암호화
    userData.email = encrypt(userData.email);

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

//개인 페이지 조회하기
async function getUserById(id) {
    const existedUser = await userRepository.findById(id);

    if (!existedUser) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: id };
        throw error;
    }

    // 민감 데이터 복호화
    const decryptedEmail = decrypt(existedUser.email);
    existedUser.email = decryptedEmail;


    return filterSensitiveUserData(existedUser, ['password']);
}

//로그인
async function login(userData) {
    // 입력받은 학번을 암호화
    const hashedUserNum = hash(userData.userNum);

    // 암호화된 학번으로 사용자 조회
    const existedUser = await userRepository.findByNum(hashedUserNum);
    if (!existedUser) {
        return { status: 401, message: '학번 틀렸습니다.' };
    }

    // 비밀번호 비교
    const isPasswordCorrect = await userRepository.checkPassword(userData.password, existedUser.password);
    if (!isPasswordCorrect) {
        return { status: 401, message: '학번 혹은 비밀번호가 틀렸습니다.' };
    }

    // 로그인 성공
    return { status: 200, user: existedUser };
}

//유저 삭제하기
async function deleteUser(userData) {
    const existedUser = await userRepository.findById(userData.id);
    if (!existedUser) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: id };
        throw error;
    }

    const isPasswordCorrect = await userRepository.checkPassword(userData.password, existedUser.password);
    if (!isPasswordCorrect) {
        const error = new Error('비밀번호가 틀렸습니다.');
        error.code = 401;
        throw error;
    }

    return userRepository.deleteUser(userData.id);
}

//유저 개인 페이지 수정
async function updateUserProfile(userId, userData) {
    const existedUser = await userRepository.findById(userId);
    if (!existedUser) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: id };
        throw error;
    }

    if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
    }

    return await userRepository.updateUser(userId, userData);
}

// 나중엔 groupService.js로 이동할 수 있음 -> 동아리 추천 
async function getRecommendedGroups(userId) {
    // 사용자의 선호 카테고리 가져오기
    const user = await userRepository.findUserWithSelectedDataById(userId);

    // 선호 카테고리가 없으면 빈 배열 반환
    if (!user || !user.category || user.category.length === 0) {
        return [];
    }

    // 사용자 선호 카테고리에 맞는 그룹 추천
    const recommendedGroups = await groupRepository.findGroupsByCategories(user.category);
    return recommendedGroups;
}

async function createGroup(userId, groupData) {
    const user = await userRepository.findById(userId);
    if (!user) {
        const error = new Error('존재하지 않습니다.');
        error.code = 404;
        error.data = { id: id };
        throw error;
    }

    const existedName = await groupRepository.findByName(groupData.name);
    if (existedName) {
        const error = new Error('동일한 이름이 존재합니다.');
        error.code = 422;
        error.data = { existedName };
        throw error;
    }
    const uniqueTags = [...new Set(groupData.tags.map(tag => tag.trim().toLowerCase()))];
    groupData.tags = uniqueTags;

    return await groupRepository.createGroup(userId, groupData);
}



export default {
    createUser,
    validateEmail,
    validateUserNumber,
    getUserById,
    login,
    deleteUser,
    updateUserProfile,
    getRecommendedGroups,
    createGroup,
}