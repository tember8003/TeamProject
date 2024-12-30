document.addEventListener("DOMContentLoaded", () => {
    // 페이지 로딩 시 설문 데이터 가져오기 (저장된 JSON 파일 혹은 로컬 저장소에서 불러옴)
    const surveyData = JSON.parse(localStorage.getItem("surveyData")) || {};

    // 설문 데이터가 없으면 경고
    if (!surveyData.title || !surveyData.questions || surveyData.questions.length === 0) {
        alert("설문 데이터가 없습니다.");
        return;
    }

    const titleElement = document.getElementById("survey-title");
    const descriptionElement = document.getElementById("survey-description");
    const itemsContainer = document.getElementById("items");

    // 설문지 제목 및 설명 설정
    titleElement.textContent = surveyData.title;
    descriptionElement.textContent = surveyData.description;

    // 질문과 답변을 화면에 표시
    surveyData.questions.forEach((question, index) => {
        const formItem = document.createElement("div");
        formItem.classList.add("form-item");

        formItem.innerHTML = `
            <div class="question-box">
                <p class="form-question">${question}</p>
            </div>
            <div class="form-answer">
                <input type="text" id="answer-${index}" class="form-answer-input" placeholder="답변을 입력해주세요.">
            </div>
        `;

        itemsContainer.appendChild(formItem);
    });

    // 제출 버튼 클릭 시
    document.getElementById("submit").addEventListener("click", () => {
        const responses = [];

        // 질문에 대한 각 답변 가져오기
        surveyData.questions.forEach((question, index) => {
            const answerInput = document.getElementById(`answer-${index}`);
            responses.push({
                question: question,
                answer: answerInput.value.trim() || "답변 없음", // 답변 없으면 기본값 설정
            });
        });

        // 저장할 데이터 생성
        const submittedFormData = {
            title: surveyData.title,
            description: surveyData.description,
            responses: responses,
        };

        // 로컬 스토리지에 데이터 저장
        const timestamp = new Date().toISOString(); // 고유 키 생성
        localStorage.setItem(`form-${timestamp}`, JSON.stringify(submittedFormData));

        alert("설문이 제출되었습니다.");
        // 폼 초기화
        itemsContainer.innerHTML = "";
    });
});