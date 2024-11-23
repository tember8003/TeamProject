import prisma from "../config/prisma.js";
import bcrypt from 'bcrypt';

async function findGroupsByCategories(categories) {
    return prisma.group.findMany({
        where: {
            category: { in: categories }, // 사용자의 선호 카테고리에 포함되는 그룹 조회
        },
        select: {
            id: false,
            name: true,
            description: true,
            GroupImage: true,
            category: true,
            tags: true,
            isOfficial: true,
            createdAt: false
        },
        orderBy: {
            createdAt: 'desc' // 최신 그룹 순서로 정렬
        }
    });
}

async function getInfo(groupId) {
    return prisma.group.findUnique({
        where: {
            id: groupId,
        },
        select: {
            id: false,
            name: true,
            description: true,
            GroupImage: true,
            category: true,
            tags: true,
            isOfficial: true,
            createdById: true,
            ratings: true,
            memberNum: true,
        },
    });
}

async function findByName(groupName) {
    return prisma.group.findUnique({
        where: {
            name: groupName,
        },
    });
}

async function findById(groupId) {
    return prisma.group.findUnique({
        where: {
            id: groupId,
        },
    });
}

async function createGroup(userId, groupData) {
    return prisma.group.create({
        data: {
            name: groupData.name,
            category: groupData.category,
            description: groupData.description,
            GroupImage: groupData.GroupImage, // 여기도 GroupImage로 일관성 유지
            tags: groupData.tags,
            isOfficial: false,
            createdBy: {
                connect: {
                    id: userId,
                }
            },
        },
    });
}

//동아리 삭제
async function deleteGroup(groupId) {
    return prisma.group.delete({
        where: {
            id: groupId,
        },
    });
}

//동아리 개설자인지 확인
async function findByIdWithAdmin(groupId, userId) {
    return prisma.group.findFirst({
        where: {
            id: groupId,
            createdById: userId, // 동아리 생성자 확인
        },
    });
}

//동아리 수정
async function updateGroup(groupData) {
    const existedGroup = await findById(groupData.id);

    return await prisma.group.update({
        where: {
            id: existedGroup.id,
        },
        data: {
            name: groupData.name || existedGroup.name,
            description: groupData.description || existedGroup.description,
            tags: groupData.tags || existedGroup.tags,
            GroupImage: groupData.GroupImage || existedGroup.GroupImage,
        },
    });
}

//질문 등록
async function postQuestion(questionData) {
    return await prisma.groupQuestion.create({
        data: {
            groupId: questionData.groupId,
            questionText: questionData.questionText, // 데이터 저장
        },
    });
}

// 후기 작성과 평균 별점 업데이트를 트랜잭션으로 처리
async function createRatingAndUpdateGroup(ratingData, userId, newTotalCount, newAverageScore) {
    const prisma = require('../prismaClient'); // Prisma 클라이언트

    return await prisma.$transaction(async (tx) => {
        // 후기 작성
        const rating = await tx.rating.create({
            data: {
                groupId: ratingData.groupId,
                userId: userId,
                ratingScore: ratingData.ratingScore,
                review: ratingData.review,
            },
        });

        // 그룹 평균 별점 및 후기 개수 업데이트
        await tx.group.update({
            where: {
                id: ratingData.groupId,
            },
            data: {
                totalCount: newTotalCount,
                averageScore: parseFloat(newAverageScore.toFixed(2)), // 소수점 두 자리로 저장
            },
        });

        return rating; // 작성된 후기 반환
    });
}



export default {
    findGroupsByCategories,
    findByName,
    createGroup,
    findById,
    getInfo,
    deleteGroup,
    findByIdWithAdmin,
    updateGroup,
    postQuestion,
    createRatingAndUpdateGroup,
}