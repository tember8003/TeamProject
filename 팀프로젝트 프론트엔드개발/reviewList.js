document.addEventListener("DOMContentLoaded", async () => {
    const reviewList = document.getElementById("review-list");
    const averageRatingEl = document.getElementById("average-rating");
    const averageStarsEl = document.getElementById("average-stars");

    const groupId = window.location.pathname.split('/')[2];

    if (!groupId || isNaN(groupId)) {
        reviewList.innerHTML = '<p>유효한 그룹 ID가 제공되지 않았습니다.</p>';
        return;
    }

    try {
        // GET 요청: 리뷰 목록 불러오기
        const response = await fetch(`/api/group/${groupId}`);
        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }

        const groupData = await response.json();
        const reviews = groupData.ratings || [];

        // 리뷰 목록 렌더링
        const renderReviews = () => {
            reviewList.innerHTML = "";
            reviews.forEach((review) => {
                const li = document.createElement("li");
                const filledStars = `<i class="fa-solid fa-star"></i>`.repeat(review.ratingScore);
                const emptyStars = `<i class="fa-regular fa-star"></i>`.repeat(5 - review.ratingScore);
                li.innerHTML = `
                    <div>
                        <div>${filledStars}${emptyStars}</div>
                        <small>${review.createdAt}</small>
                        <p>${review.review}</p>
                        <small>${review.options.join(", ")}</small>
                        <button class="delete-btn" data-id="${review.ratingId}">삭제</button>
                    </div>
                `;
                reviewList.appendChild(li);
            });
        };

        // 수정 및 삭제 버튼 이벤트 핸들링
        reviewList.addEventListener("click", async (event) => {
            const target = event.target;

            if (target.classList.contains("edit-btn")) {
                const ratingId = target.dataset.id;
                window.location.href = `/introduceclub/${groupId}/reviewEdit/${ratingId}`;
            }

            if (target.classList.contains("delete-btn")) {
                const ratingId = target.dataset.id;
                console.log("Rating ID to delete:", ratingId);
                const confirmDelete = confirm("이 리뷰를 삭제하시겠습니까?");

                if (confirmDelete) {
                    try {
                        // DELETE 요청
                        const response = await fetch(`/introduceclub/${groupId}/review/${ratingId}`, {
                            method: "DELETE",
                        });

                        if (!response.ok) {
                            const result = await response.json();
                            throw new Error(result.error || "리뷰 삭제 실패");
                        }

                        alert("리뷰 삭제 성공");
                        location.reload();
                    } catch (error) {
                        console.error("리뷰 삭제 중 오류 발생:", error);
                        alert("리뷰 삭제 중 문제가 발생했습니다.");
                    }
                }
            }
        });

        renderReviews();
    } catch (error) {
        console.error("리뷰 데이터를 불러오는 중 오류 발생:", error);
        reviewList.innerHTML = '<p>리뷰 데이터를 불러오는 데 실패했습니다.</p>';
    }
});
