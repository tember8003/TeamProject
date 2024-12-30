document.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll(".star-rating .fa-star");
    const ratingValue = document.querySelector(".rating-value");
    const reviewUploadButton = document.querySelector(".review-upload");
    const textReview = document.querySelector(".text-review");
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let selectedRating = 0;

    // 별점 이벤트
    stars.forEach((star, index) => {
        star.addEventListener("click", () => {
            selectedRating = index + 1;

            // 클릭한 별까지 활성화
            stars.forEach((s, i) => {
                if (i < selectedRating) {
                    s.classList.remove("fa-regular");
                    s.classList.add("fa-solid");
                } else {
                    s.classList.remove("fa-solid");
                    s.classList.add("fa-regular");
                }
            });

            // 별점 표시
            ratingValue.textContent = `${selectedRating}/5`;
        });
    });

    // 리뷰 업로드 이벤트
    reviewUploadButton.addEventListener("click", async (e) => {
        e.preventDefault(); // 기본 폼 제출 방지

        const reviewContent = textReview.value.trim();
        const selectedCheckboxes = Array.from(checkboxes)
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.value);

        // 입력 검증
        if (selectedRating === 0) {
            alert("별점을 선택해주세요!");
            return;
        }

        if (reviewContent === "") {
            alert("리뷰 내용을 작성해주세요!");
            return;
        }

        // 리뷰 데이터 생성
        const review = {
            rating: selectedRating,
            content: reviewContent,
            options: selectedCheckboxes,
            date: new Date().toISOString(),
        };

        console.log("[DEBUG] 전송할 데이터:", review);

        // 서버로 데이터 전송
        try {
            const groupId = window.location.pathname.split('/')[2]; // URL에서 group_id 추출
            const response = await fetch(`/introduceclub/${groupId}/reviewWrite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(review),
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                location.href = `/introduceclub/${groupId}/reviewList`; // 리뷰 리스트 페이지로 이동
            } else {
                alert(result.message || "리뷰 등록 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("리뷰 등록 중 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    });
});