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
    const group = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
        select: {
            id: true,
            name: true,
            description: true,
            GroupImage: true,
            category: true,
            tags: true,
            isOfficial: true,
            createdById: true,
            IntroduceImage: true,
            GroupLeader: true,
            GroupRoom: true,
            Contact: true,
            GroupTime: true,
            memberNum: true,
            isRatingPublic: true,
            totalCount: true,
            averageScore: true,
            ratings: true, // 후기 포함
        },
    });

    if (!group) return null;

    // `isRatingPublic`이 false라면 `ratings`를 null로 설정
    if (!group.isRatingPublic) {
        group.ratings = null;
    } //후기 데이터 가져오지 않게 만들기! (데이터베이스내 정보는 바뀌지 않음)

    return group;
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
            GroupLeader: groupData.GroupLeader,
            category: groupData.category,
            description: groupData.description,
            GroupImage: groupData.GroupImage, // 여기도 GroupImage로 일관성 유지
            IntroduceImage: groupData.IntroduceImage,
            GroupRoom: groupData.GroupRoom,
            GroupTime: groupData.GroupTime,
            Contact: groupData.Contact,
            //period: groupData.period,
            //tags: groupData.tags,
            ActiveLog: groupData.ActiveLog,
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
    const group = prisma.group.findFirst({
        where: {
            id: groupId,
            createdById: userId, // 동아리 생성자 확인
        },
    });
    return !!group; // `null`을 `false`로 변환
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
            GroupLeader: groupData.GroupLeader || existedGroup.GroupLeader,
            description: groupData.description || existedGroup.description,
            tags: groupData.tags || existedGroup.tags,
            GroupImage: groupData.GroupImage || existedGroup.GroupImage,
            GroupTime: groupData.GroupTime || existedGroup.GroupTime,
            GroupRoom: groupData.GroupRoom || existedGroup.GroupRoom,
            IntroduceImage: groupData.IntroduceImage || existedGroup.IntroduceImage,
            Contact: groupData.Contact || existedGroup.Contact,
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
                options: ratingData.options,
                createdAt: ratingData.createdAt
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

//후기 비공개/공개 전환
async function updateRatingPublic(groupId, isRatingPublic) {
    return prisma.group.update({
        where: {
            id: groupId,
        },
        data: {
            isRatingPublic: isRatingPublic, // 공개 여부 업데이트
        },
        select: {
            id: true,
            isRatingPublic: true, // 업데이트된 공개 상태 반환
        },
    });
}

async function checkGroupJoin(groupId, userId) {
    const member = await prisma.userGroup.findFirst({
        where: {
            groupId: groupId,
            userId: userId,
        },
    });

    // membership이 존재하면 true 반환, 없으면 false 반환
    return !!member;
}

// 활동내용 조회
async function getActivity(groupId) {
    return prisma.groupActivity.findMany({
        where: {
            groupId: groupId,
        },
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            title: true,
            description: true,
            ActivityImage: true,
            createdAt: true,
        },
    });
}

// 활동내용 등록
async function createActivity(activityData) {
    return prisma.groupActivity.create({
        data: {
            title: activityData.title,
            description: activityData.description,
            ActivityImage: activityData.ActivityImage,
            groupId: activityData.groupId,
        },
    });
}

async function getClubAdmin(groupId) {
    return prisma.group.findUnique({
        where: {
            id: groupId
        },
    })
}

async function getForm(groupId) {
    return prisma.group.findUnique({
        where: {
            id: groupId, // 고유한 그룹 ID로 조회
        },
        select: {
            form: true, // form 필드만 조회
        },
    });
}

async function addForm(groupId, form) {
    return prisma.group.update({
        where: {
            id: groupId, // 수정하려는 그룹 ID
        },
        data: {
            form: form, // 업데이트할 form 데이터
        },
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
    updateRatingPublic,
    checkGroupJoin,
    getActivity,
    createActivity,
    getClubAdmin,
    addForm,
    getForm,
}