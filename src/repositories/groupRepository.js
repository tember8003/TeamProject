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

async function findByName(groupName) {
    return prisma.group.findUnique({
        where: {
            name: groupName,
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


export default {
    findGroupsByCategories,
    findByName,
    createGroup,
}