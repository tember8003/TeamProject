console.log("main.js 로드됨");

// 페이지가 로드될 때 전체 카테고리를 기본으로 표시
document.addEventListener("DOMContentLoaded", function () {
    showCategory('all');
    fetchClubs();
});

window.viewClub = function (clubId) {
    console.log("viewClub 호출됨, clubId:", clubId);
    if (!clubId) {
        alert("동아리 ID가 유효하지 않습니다.");
        return;
    }
    window.location.href = `/introduceclub/${clubId}`;
};


function showCategory(category) {
    const allSections = document.querySelectorAll('.category-content');
    allSections.forEach(section => {
        section.classList.remove('active');  // 모든 카테고리 숨김
    });

    const activeSection = document.getElementById(category);
    if (activeSection) {
        activeSection.classList.add('active');  // 선택된 카테고리만 표시
    }
}

// 동아리 목록을 서버에서 가져와 표시
function fetchClubs() {
    fetch('/get_clubs')
        .then(response => response.json())
        .then(data => {
            displayClubs(data.clubs);
        })
        .catch(error => console.error('동아리 목록 가져오기 오류:', error));
}

function displayClubs(clubs) {
    const allSection = document.getElementById('all');
    allSection.innerHTML = ''; // 기존 내용 초기화

    clubs.forEach(club => {
        const clubElement = document.createElement('div');
        clubElement.className = 'club-item';
        clubElement.innerHTML = `
            <h3>${club.name}</h3>
            <p>${club.category} | ${club.description}</p>
            <p class="club-status">${club.status}</p>
        `;

        allSection.appendChild(clubElement);
    });
}

// 페이지 로드 시 동아리 목록 불러오기
document.addEventListener("DOMContentLoaded", fetchClubs);


// 동아리 등록 폼 제출 이벤트
document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("club-register-form");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // 기본 폼 동작 방지

            // 폼 데이터 가져오기
            const formData = new FormData(registerForm);
            const clubData = Object.fromEntries(formData.entries()); // 객체로 변환

            try {
                const response = await fetch("/register_club", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(clubData)
                });
                const data = await response.json();

                if (data.success) {
                    alert(data.message); // 성공 메시지 표시
                    window.location.href = "/"; // 메인 페이지로 이동
                } else {
                    alert("동아리 등록 실패: " + (data.message || "알 수 없는 오류"));
                }
            } catch (error) {
                console.error("동아리 등록 실패:", error);
                alert("서버 오류가 발생했습니다. 다시 시도해주세요.");
            }
        });
    }
});


// 카테고리별 필터링
document.querySelectorAll('.category-link').forEach(link => {
    link.addEventListener('click', () => {
        const category = link.textContent.trim();
        fetch(`/get_clubs?category=${category}`)
            .then(response => response.json())
            .then(data => displayClubs(data.clubs))
            .catch(error => console.error('동아리 가져오기 오류:', error));
    });
});


document.addEventListener("DOMContentLoaded", function () {
    // 초기 로그인 상태 확인
    fetch("/check_login_status", {
        method: "GET",
        credentials: "include" // 쿠키 전송
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 로그인 상태 확인 후 UI 업데이트
                updateAuthUI(data.user);
            } else {
                console.log("로그인 상태가 아닙니다.");
            }
        })
        .catch(error => console.error("로그인 상태 확인 실패:", error));

    // 로그인 버튼 클릭 이벤트 리스너
    const loginButton = document.querySelector(".login-button");
    if (loginButton) {
        loginButton.addEventListener("click", function () {
            const userIdInput = document.querySelector("input[type='text']");
            const passwordInput = document.querySelector("input[type='password']");
            const userId = userIdInput.value.trim();
            const password = passwordInput.value.trim();

            // 입력값 검증
            if (!userId || !password) {
                alert("아이디와 비밀번호를 입력해주세요.");
                return;
            }

            // 로그인 요청
            fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userNum: userId, password: password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert("로그인 성공");
                        window.location.reload();
                        updateAuthUI(data.user); // UI 업데이트
                    } else {
                        alert(data.message || "로그인 실패");
                    }
                })
                .catch(error => {
                    console.error("로그인 요청 실패: ", error);
                });
        });
    } else {
        console.error("로그인 버튼을 찾을 수 없습니다!");
    }

    // 로그아웃 버튼 클릭 이벤트 리스너
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                const response = await fetch("/logout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message); // 로그아웃 성공 메시지
                    window.location.reload(); // 페이지 새로고침
                } else {
                    alert(result.message || "로그아웃에 실패했습니다.");
                }
            } catch (error) {
                console.error("로그아웃 요청 중 오류:", error);
                alert("서버와 통신 중 오류가 발생했습니다.");
            }
        });
    }
});

// UI 업데이트 함수
function updateAuthUI(userInfo) {
    const parentElement = document.querySelector(".auth");
    if (!parentElement) {
        console.error("부모 요소를 찾을 수 없습니다!");
        return;
    }

    // 기존 UI 초기화
    parentElement.innerHTML = "";

    // 사용자 환영 메시지 표시
    const welcomeMessage = document.createElement("span");
    welcomeMessage.textContent = `환영합니다, ${userInfo.name}님!`;
    parentElement.appendChild(welcomeMessage);

    // 로그아웃 버튼 추가
    const logoutButton = document.createElement("button");
    logoutButton.id = "logout-btn";
    logoutButton.className = "logout-button";
    logoutButton.textContent = "로그아웃";
    parentElement.appendChild(logoutButton);

    // 로그아웃 버튼 이벤트 리스너 추가
    logoutButton.addEventListener("click", async () => {
        try {
            const response = await fetch("/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message); // 로그아웃 성공 메시지
                window.location.reload(); // 페이지 새로고침
            } else {
                alert(result.message || "로그아웃에 실패했습니다.");
            }
        } catch (error) {
            console.error("로그아웃 요청 중 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    });
}


function displayClubs(clubs) {
    const allSection = document.getElementById('all');
    allSection.innerHTML = ''; // 기존 내용을 초기화

    clubs.forEach(club => {
        const clubElement = document.createElement('div');
        clubElement.className = 'club-card'; // club-card 클래스를 추가
        clubElement.innerHTML = `
            <img src="${club.GroupImage}" alt="${club.name} 대표 이미지" class="club-image">
            <h3>${club.name}</h3>
            <p>${club.description}</p>
        `;
        allSection.appendChild(clubElement);
    });
}


