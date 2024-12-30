document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/mypage';

    // JWT 토큰 가져오기
    const token = localStorage.getItem("jwt");

    // 토큰이 없으면 로그인 페이지로 이동
    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "/login";
        return;
    }

    // 페이지 로드 시 유저 정보 가져오기
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`, // JWT 토큰을 Authorization 헤더에 추가
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("인증 실패");
            }
        })
        .then(data => {
            if (data.success === false) {
                alert(data.message);
                window.location.href = "/login"; // 인증 실패 시 로그인 페이지로 이동
                return;
            }

            // 가져온 유저 정보를 입력 필드에 채움
            document.getElementById('name').value = data.name || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('password').value = data.password || '';
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
            alert("인증이 만료되었습니다. 다시 로그인해주세요.");
            window.location.href = "/login"; // 인증 실패 시 로그인 페이지로 이동
        });

    // 수정 버튼 클릭 이벤트
    document.querySelector('.btn-success').addEventListener('click', () => {
        const updateData = {
            password: document.getElementById('password').value,
        };

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`, // JWT 토큰을 Authorization 헤더에 추가
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("업데이트 실패");
                }
            })
            .then(data => {
                if (data.success) {
                    alert('프로필이 성공적으로 업데이트되었습니다.');
                } else {
                    alert('업데이트 실패: ' + data.message);
                }
            })
            .catch(error => {
                console.error("Error updating profile:", error);
                alert("프로필 업데이트 중 문제가 발생했습니다. 다시 시도해주세요.");
            });
    });
});
