import prisma from "../config/prisma.js";
import bcrypt from 'bcrypt';

//id 검색하기
async function findById(userId) {
    return prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
}

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
            MSI_Image: userData.MSI_Image,
            category: userData.category,
        },
    });
    return userInfo;
}

//비밀번호 확인하기
async function checkPassword(inputPassword, hashedPassword) { //비밀번호 확인
    return await bcrypt.compare(inputPassword, hashedPassword);
}

//유저 개인 페이지 조회용
async function findUserWithSelectedDataById(id) {
    return prisma.user.findUnique({
        where: {
            id,
        },
        select: {
            userNum: true,
            name: true,
            nickname: true,
            email: true,
            ProfileImage: true,
            createdAt: true,
            category: true,
            groups: true,
            ratings: true
        }
    });
}

//유저 삭제
async function deleteUser(userId) {
    const deletedUser = await prisma.user.delete({
        where: {
            id: userId,
        },
    });

    return deletedUser;
}

//유저 정보 수정하기
async function updateUser(userId, userData) {
    const existedUser = await findById(userId);

    return await prisma.user.update({
        where: {
            id: existedUser.id,
        },
        data: {
            password: userData.password || existedUser.password,
            nickname: userData.nickname || existedUser.nickname,
            category: userData.category || existedUser.category,
            ProfileImage: userData.ProfileImage || existedUser.ProfileImage,
        },
    });
}

//유저가 동아리에 들어가있는지 확인하기
async function findGroupByUser(userId, groupId) {
    return await prisma.userGroup.findUnique({
        where: {
            userId: userId,
            groupId: groupId,
        },
    });
}

//동아리 목록 가져오기
async function getGroup(category, orderBy) {
    const group = await prisma.group.findMany({
        where: {
            category: category,
        },
        orderBy: orderBy || undefined,
        select: {
            name: true,
            tags: true,
        }
    })
    return group;
}


export default {
    findByNum,
    findByEmail,
    createUser,
    findUserWithSelectedDataById,
    checkPassword,
    findById,
    deleteUser,
    updateUser,
    findGroupByUser,
    getGroup,
}