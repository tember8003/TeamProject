import prisma from "../config/prisma.js";
import bcrypt from 'bcrypt';

//학번으로 유저 찾기
async function findByNum(userNum) {
    return prisma.user.findUnique({
        where: {
            userNum,
        },
    });
}

//이메일로 유저 찾기
async function findByEmail(email) {
    return prisma.user.findUnique({
        where: {
            email,
        },
    });
}

//유저 생성하기
async function createUser(userData) {

    const userInfo = await prisma.user.create({ //유저 정보 생성
        data: {
            userNum: userData.userNum,
            name: userData.name,
            nickname: userData.nickname,
            email: userData.email,
            password: userData.password,
            ProfileImage: userData.ProfileImage,
            phoneNumber: userData.phoneNumber,
            category: userData.category,
        },
    });
    return userInfo;
}

export default {
    findByNum,
    findByEmail,
    createUser,
}