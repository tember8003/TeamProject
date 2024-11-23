import groupRepository from "../repositories/groupRepository.js";
import bcrypt from 'bcrypt';
import userRepository from "../repositories/userRepository.js";

async function getInfo(groupId) { //동아리 정보 가져오기
    if (!groupId) {
        const error = new Error('동아리 ID가 존재하지 않습니다');
        error.code = 400; // Bad Request
        throw error;
    }

    const group = await groupRepository.findById(groupId);

    if (!group) {
        const error = new Error('동아리가 존재하지 않습니다');
        error.code = 404; // Not Found
        throw error;
    }

    return await groupRepository.getInfo(group.id);
}

//동아리 수정
async function updateGroup(groupData, userId) {
    const group = await groupRepository.findById(groupData.id);

    if (!group) {
        const error = new Error('동아리가 존재하지 않습니다');
        error.code = 404; // Not Found
        throw error;
    }

    const check = await groupRepository.findByIdWithAdmin(group.id, userId);

    if (!check) {
        const error = new Error('권한이 없습니다.');
        error.code = 403;
        throw error;
    }

    return await groupRepository.updateGroup(groupData);
}


//동아리 삭제
async function deleteGroup(groupId) { //동아리 삭제

    const group = await groupRepository.findById(groupId);

    if (!group) {
        const error = new Error('동아리가 존재하지 않습니다');
        error.code = 404; // Not Found
        throw error;
    }

    const check = await groupRepository.findByIdWithAdmin(group.id, userId);

    if (!check) {
        const error = new Error('권한이 없습니다.');
        error.code = 403;
        throw error;
    }

    return await groupRepository.deleteGroup(group.id);
}

async function postQuestion(questionData, userId) {
    const group = await groupRepository.findById(questionData.groupId);

    if (!group) {
        const error = new Error('동아리가 존재하지 않습니다.');
        error.code = 404; // Not Found
        throw error;
    }

    // 권한 확인
    const check = await groupRepository.findByIdWithAdmin(group.id, userId);
    if (!check) {
        const error = new Error('권한이 없습니다.');
        error.code = 403;
        throw error;
    }

    return await groupRepository.postQuestion(questionData);
}

//4개월 이상인지 확인하는 함수 (동아리 후기 작성용)
function isUserQualifiedForReview(joinDate) {
    const FOUR_MONTHS_IN_MILLISECONDS = 4 * 30 * 24 * 60 * 60 * 1000;
    const currentDate = new Date();

    if (currentDate - new Date(joinDate) >= FOUR_MONTHS_IN_MILLISECONDS) {
        return true;
    }
    else {
        return false;
    }
}

async function postRating(ratingData, userId) {
    const group = await groupRepository.findById(ratingData.groupId);

    if (!group) {
        const error = new Error('동아리가 존재하지 않습니다.');
        error.code = 404; // Not Found
        throw error;
    }

    const groupUser = await userRepository.findGroupByUser(group.id, userId);

    if (!groupUser) {
        const error = new Error('해당 동아리에 등록되어 있지 않습니다');
        error.code = 403; // 권한 X
        throw error;
    }

    // 4개월 이상 여부 확인
    const joinDate = groupUser.joinDate;
    const isQualified = isUserQualifiedForReview(joinDate);

    //만약 4개월 이상 안됐으면 에러
    if (!isQualified) {
        const error = new Error('동아리에 4개월 이상 다닌 회원만 후기를 작성할 수 있습니다.');
        error.code = 403; // Forbidden
        throw error;
    }

    const newTotalCount = group.totalCount + 1;
    const newAverageScore =
        (group.averageScore * group.totalCount + ratingData.ratingScore) / newTotalCount;

    // Repository에서 트랜잭션 실행 (후기 작성 등록 + 평균 별점과 후기 개수 추가)
    const rating = await groupRepository.createRatingAndUpdateGroup(
        ratingData,
        userId,
        newTotalCount,
        newAverageScore
    );

    return rating;
}


export default {
    getInfo,
    deleteGroup,
    updateGroup,
    postQuestion,
    postRating,
}