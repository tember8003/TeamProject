document.addEventListener("DOMContentLoaded", () => {
    const itemsContainer = document.getElementById("items");
    const addQuestionButton = document.getElementById("add-question");
    const submitButton = document.getElementById("submit");

    // 질문 추가 기능
    addQuestionButton.addEventListener("click", () => {
        const formItem = document.createElement("div");
        formItem.classList.add("form-item");

        formItem.innerHTML = `
            <div class="question-box">
                <input type="text" class="form-question" placeholder="질문을 입력하세요.">
            </div>
            <div class="form-answer">
                <span>답변이 여기에 표시됩니다.</span>
            </div>
            <button class="delete-btn">삭제</button>
        `;

        // 삭제 버튼 클릭 시 해당 질문 항목 제거
        const deleteButton = formItem.querySelector(".delete-btn");
        deleteButton.addEventListener("click", () => {
            itemsContainer.removeChild(formItem);
        });

        itemsContainer.appendChild(formItem);
    });

    // 설문 제출 기능
    submitButton.addEventListener("click", () => {
        const title = document.getElementById("title").value.trim();
        const description = document.getElementById("description").value.trim();

        const questions = [];
        document.querySelectorAll(".form-question").forEach((input) => {
            const question = input.value.trim();
            if (question) {
                questions.push(question);
            }
        });

        if (!title || questions.length === 0) {
            alert("제목과 최소 하나 이상의 질문을 입력해주세요.");
            return;
        }

        const surveyData = {
            title: title,
            description: description,
            questions: questions,
        };

        // localStorage에 설문 데이터 저장
        localStorage.setItem("surveyData", JSON.stringify(surveyData));
        console.log("설문 데이터:", surveyData);
        alert("설문이 저장되었습니다!");

        // 설문 제출 후 초기화
        document.getElementById("title").value = "";
        document.getElementById("description").value = "";
        itemsContainer.innerHTML = `
            <div class="form-item">
                <div class="question-box">
                    <input type="text" class="form-question" placeholder="질문을 입력하세요.">
                </div>
                <div class="form-answer">
                    <span>답변이 여기에 표시됩니다.</span>
                </div>
            </div>
        `;
    });
});