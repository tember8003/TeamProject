document.addEventListener("DOMContentLoaded", async () => {
    const starRatingEl = document.querySelector(".star-rating");
    const stars = starRatingEl.querySelectorAll(".fa-star");
    const ratingValueEl = document.querySelector(".rating-value");
    const textReviewEl = document.querySelector(".text-review");
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    const submitButton = document.querySelector(".review-upload");
    const cancelButton = document.querySelector(".cancel-edit");

    // URL 파라미터로 groupId와 reviewId 가져오기
    const groupId = window.location.pathname.split('/')[2]; // URL에서 groupId 추출
    const reviewId = window.location.pathname.split('/')[4]; // URL에서 ratingId 추출

    if (!groupId || !reviewId) {
        alert("잘못된 접근입니다.");
        window.location.href = `/introduceclub/${groupId}/reviewList`;
        return;
    }

    try {
        // 백엔드에서 리뷰 데이터 가져오기
        const response = await fetch(`/introduceclub/${groupId}/review/${reviewId}`);
        if (!response.ok) throw new Error("리뷰 데이터를 가져오는 데 실패했습니다.");

        const review = await response.json();

        // 기존 리뷰 데이터 렌더링
        ratingValueEl.textContent = `${review.ratingScore}/5`;
        textReviewEl.value = review.review;

        // 체크박스 옵션 초기화
        checkboxes.forEach((checkbox) => {
            checkbox.checked = review.options.includes(checkbox.value);
        });

        // 별점 초기화
        stars.forEach((star, index) => {
            star.classList.toggle("fa-solid", index < review.ratingScore);
            star.classList.toggle("fa-regular", index >= review.ratingScore);
        });

        // 별점 클릭 이벤트
        stars.forEach((star, index) => {
            star.addEventListener("click", () => {
                stars.forEach((s, i) => {
                    s.classList.toggle("fa-solid", i <= index);
                    s.classList.toggle("fa-regular", i > index);
                });
                ratingValueEl.textContent = `${index + 1}/5`;
            });
        });

        // 수정 완료 버튼 클릭 이벤트
        submitButton.addEventListener("click", async (e) => {
            e.preventDefault();

            const updatedRating = parseInt(ratingValueEl.textContent.split("/")[0]);
            const updatedContent = textReviewEl.value.trim();
            const updatedOptions = Array.from(checkboxes)
                .filter((checkbox) => checkbox.checked)
                .map((checkbox) => checkbox.value);

            if (!updatedContent) {
                alert("리뷰 내용을 입력해주세요.");
                return;
            }

            // 백엔드로 데이터 전송
            try {
                const updateResponse = await fetch(`/introduceclub/${groupId}/review/${reviewId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ratingScore: updatedRating,
                        review: updatedContent,
                        options: updatedOptions,
                    }),
                });

                if (!updateResponse.ok) throw new Error("리뷰 수정에 실패했습니다.");

                alert("리뷰가 성공적으로 수정되었습니다.");
                window.location.href = `/introduceclub/${groupId}/reviewList`;
            } catch (error) {
                console.error("리뷰 수정 중 오류 발생:", error);
                alert("리뷰 수정 중 문제가 발생했습니다.");
            }
        });

        // 취소 버튼 클릭 이벤트
        cancelButton.addEventListener("click", () => {
            const confirmCancel = confirm("수정을 취소하시겠습니까?");
            if (confirmCancel) {
                window.location.href = `/introduceclub/${groupId}/reviewList`;
            }
        });
    } catch (error) {
        console.error("리뷰 데이터를 불러오는 중 오류 발생:", error);
        alert("리뷰 데이터를 불러오는 데 실패했습니다.");
        window.location.href = `/introduceclub/${groupId}/reviewList`;
    }
});