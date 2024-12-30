// 데이터 불러오기 및 렌더링
window.addEventListener('DOMContentLoaded', function () {
    // localStorage에서 저장된 폼 데이터 가져오기
    const keys = Object.keys(localStorage).filter(key => key.startsWith('form-'));

    if (keys.length === 0) {
        alert('제출된 폼 데이터가 없습니다.');
        return;
    }

    // 가장 최근에 저장된 데이터 가져오기
    const latestKey = keys[keys.length - 1];
    const formData = JSON.parse(localStorage.getItem(latestKey));

    // 제목과 설명 렌더링
    document.getElementById('survey-title').textContent = formData.title || '제목 없음';
    document.getElementById('survey-description').textContent = formData.description || '설명이 없습니다.';

    // 질문 및 답변 렌더링
    const itemsContainer = document.getElementById('items');
    formData.responses.forEach(response => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('form-item');

        const questionBox = document.createElement('div');
        questionBox.classList.add('question-box');
        questionBox.innerHTML = `<p>${response.question}</p>`;
        itemDiv.appendChild(questionBox);

        const answerBox = document.createElement('div');
        answerBox.classList.add('form-answer');
        answerBox.innerHTML = `<p>${response.answer || '답변 없음'}</p>`;
        itemDiv.appendChild(answerBox);

        itemsContainer.appendChild(itemDiv);
    });
});