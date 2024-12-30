from flask import Flask, render_template, request, redirect, url_for, jsonify, make_response, session,send_from_directory
from functools import wraps
import os
import requests
import jwt

app = Flask(__name__)

# 파일 저장 경로 설정
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 기본 라우트 설정
def create_app():
    static_folder = os.path.join(os.getcwd(), 'static')
    if not os.path.exists(static_folder):
        os.makedirs(static_folder)
    return app

SECRET_KEY = 'JwTsEcReTkEyOrHaShInG'

def authenticate_token(func):
    """JWT 인증 데코레이터"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = request.cookies.get('jwt')  # 클라이언트가 보낸 JWT 토큰
        if not token:
            return jsonify({"success": False, "message": "로그인이 필요합니다."}), 401

        try:
            # 토큰 검증
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user = decoded_token  # 디코딩된 사용자 정보를 요청에 추가
            return func(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            print("에러 발생! 401!")
            return jsonify({"success": False, "message": "토큰이 만료되었습니다. 다시 로그인해주세요."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "유효하지 않은 토큰입니다."}), 401

    return wrapper

#GET으로 폼 불러오기
@app.route('/introduceclub/<int:group_id>/manageForm', methods=['GET'])
@authenticate_token
def manage_form_page(group_id):
    # 외부 API URL
    api_url = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/form"
    token = request.cookies.get('jwt')

    try:
        # 외부 API에서 데이터 가져오기
        response = requests.get(api_url, headers={"Authorization": f"Bearer {token}"})
        response.raise_for_status()
        form_data = response.json()

        # HTML 반환 (템플릿에 form 데이터를 전달)
        return render_template('newForm.html', group_id=group_id, form=form_data)
    except requests.exceptions.RequestException as e:
        print("API 호출 실패:", e)
        return render_template('newForm.html', group_id=group_id, form={})

# PUT 요청: 외부 API로 form 데이터 업데이트
@app.route('/introduceclub/<int:group_id>/manageForm', methods=['PUT'])
@authenticate_token
def update_form(group_id):
    # JWT 토큰 가져오기
    token = request.cookies.get('jwt')

    # 요청 데이터 가져오기
    data = request.get_json()
    form = data.get("form")

    # 입력 데이터 검증
    if not form or not form.startswith("https://docs.google.com/forms"):
        return jsonify({"error": "유효한 구글 폼 링크를 입력해주세요."}), 400

    # 외부 API URL
    api_url = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/form"

    try:
        # 외부 API 호출
        response = requests.put(
            api_url,
            json={"form": form},
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        response.raise_for_status()

        # 성공적으로 업데이트된 경우
        updated_data = response.json()
        return jsonify({"success": True, "message": "폼 링크가 성공적으로 업데이트되었습니다.", "form": updated_data})
    except requests.exceptions.RequestException as e:
        print("API 호출 실패:", e)
        return jsonify({"success": False, "message": "외부 API 호출 중 오류가 발생했습니다."}), 500


@app.route('/introduceclub/<int:club_id>', methods=['GET'])
def render_introduceclub(club_id):
    # 기본 HTML만 렌더링
    print(f"[INFO] Render introduceclub.html for club_id: {club_id}")
    return render_template('introduceclub.html')

# CSS 및 JS 제공
@app.route('/introduceclub/<path:filename>', methods=['GET'])
def static_files(filename):
    """
    같은 디렉토리에서 정적 파일 제공
    """
    print(f"[INFO] Serving static file: {filename}")
    return send_from_directory(os.getcwd(), filename)

@app.route('/introduceclub/<int:group_id>/activity', methods=['GET'])
@authenticate_token
def get_activity(group_id):
    """
    동아리 활동 내용 가져오기
    """
    NODE_API_URL = f'https://teamproject-jv72.onrender.com/api/group/{group_id}/activity'

    try:
        print(group_id)
        # Node.js API에 GET 요청
        headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}
        response = requests.get(NODE_API_URL, headers=headers)

        print("[DEBUG] Node.js API 응답 상태 코드:", response.status_code)
        print("[DEBUG] Node.js API 응답 데이터:", response.json())

        # 응답 상태 확인
        if response.status_code == 200:
            activities = response.json()  # Node.js에서 받은 데이터를 JSON 형식으로 파싱
            return jsonify(activities), 200
        else:
            # Node.js API에서 오류 반환 시
            error_message = response.json().get('message', '활동 내용을 불러오는 데 실패했습니다.')
            return jsonify({"success": False, "message": error_message}), response.status_code

    except requests.exceptions.RequestException as e:
        # Node.js API 호출 실패 시
        print(f"[ERROR] Node.js API 호출 실패: {e}")
        return jsonify({"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}), 500

@app.route('/api/group/<int:club_id>', methods=['GET'])
def get_group(club_id):
    # Node.js 백엔드 URL 구성
    api_url = f'https://teamproject-jv72.onrender.com/api/group/{club_id}'

    try:
        # Node.js 백엔드에서 데이터 가져오기
        print(f"[INFO] Fetching data from Node.js backend: {api_url}")
        response = requests.get(api_url)
        print(f"[DEBUG] Response status: {response.status_code}")  # 응답 상태 코드 확인
        response.raise_for_status()  # 오류가 있으면 예외 발생

        # Node.js에서 받은 응답 데이터를 JSON으로 반환
        group_data = response.json()
        print(f"[DEBUG] Response data: {group_data}")  # 받은 데이터 출력
        return group_data
    except requests.exceptions.RequestException as e:
        # Node.js API 호출 오류 처리
        error_message = f"서버 오류: {str(e)}"
        print(f"[ERROR] Node.js API 호출 오류: {error_message}")
        return {"success": False, "message": error_message}, 500
    
# 리뷰 리스트 페이지
@app.route('/introduceclub/<int:group_id>/reviewList', methods=['GET'])
def review_list(group_id):
    """
    리뷰 목록 페이지 렌더링
    """
    print(f"[INFO] Render reviewList.html for group_id: {group_id}")
    return render_template('reviewList.html', group_id=group_id)

@app.route('/introduceclub/<int:group_id>/review/<int:rating_id>', methods=['DELETE'])
@authenticate_token
def delete_review(group_id, rating_id):
    """
    리뷰 삭제 API
    """
    print(f"[INFO] Attempting to delete review {rating_id} in group {group_id}")
    
    # Node.js 백엔드 API URL
    NODE_API_URL = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/review/{rating_id}"

    try:
        # Node.js로 DELETE 요청
        headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}
        response = requests.delete(NODE_API_URL, headers=headers)

        # Node.js 응답 확인
        print("[DEBUG] Node.js 응답 상태 코드:", response.status_code)
        print("[DEBUG] Node.js 응답 본문:", response.text)

        if response.status_code == 200:
            return jsonify({"success": True, "message": "리뷰 삭제 성공"}), 200
        else:
            return jsonify({"success": False, "message": response.json().get('error', '리뷰 삭제 실패')}), response.status_code

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Node.js API 호출 실패: {e}")
        return jsonify({"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}), 500

@app.route('/introduceclub/<int:group_id>/reviewEdit/<int:rating_id>', methods=['GET'])
@authenticate_token
def get_review_edit_page(group_id, rating_id):
    """
    리뷰 수정 페이지 렌더링
    """
    print(f"[INFO] Rendering reviewEdit.html for group_id: {group_id}, rating_id: {rating_id}")
    try:
        # Node.js 백엔드에서 해당 리뷰 데이터 가져오기
        NODE_API_URL = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/review/{rating_id}"
        headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}
        response = requests.get(NODE_API_URL, headers=headers)

        if response.status_code == 200:
            # 성공적으로 데이터를 가져왔으면 HTML 렌더링
            review_data = response.json()
            return render_template('reviewEdit.html', group_id=group_id, rating_id=rating_id, review=review_data)
        else:
            # 데이터 가져오기 실패 시 오류 반환
            return jsonify({"error": "리뷰 데이터를 가져오는 데 실패했습니다."}), response.status_code
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Node.js API 호출 실패: {e}")
        return jsonify({"error": f"리뷰 데이터를 가져오는 중 오류가 발생했습니다: {str(e)}"}), 500

@app.route('/introduceclub/<int:group_id>/review/<int:rating_id>', methods=['PUT'])
@authenticate_token
def update_review(group_id, rating_id):
    """
    리뷰 수정 API
    """
    print(f"[INFO] Attempting to update review {rating_id} in group {group_id}")
    data = request.json  # 클라이언트가 보낸 JSON 데이터

    # Node.js 백엔드 API URL
    NODE_API_URL = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/review/{rating_id}"

    try:
        # Node.js로 PUT 요청
        headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}
        response = requests.put(NODE_API_URL, headers=headers, json=data)

        # Node.js 응답 확인
        print("[DEBUG] Node.js 응답 상태 코드:", response.status_code)
        print("[DEBUG] Node.js 응답 본문:", response.text)

        if response.status_code == 200:
            return jsonify({"success": True, "message": "리뷰 수정 성공"}), 200
        else:
            return jsonify({"success": False, "message": response.json().get('error', '리뷰 수정 실패')}), response.status_code

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Node.js API 호출 실패: {e}")
        return jsonify({"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}), 500


@app.route('/introduceclub/<int:group_id>/reviewWrite', methods=['GET', 'POST'])
@authenticate_token
def review_write(group_id):
    """
    리뷰 작성: GET 요청 시 HTML 렌더링, POST 요청 시 데이터 처리
    """
    NODE_API_URL = f'https://teamproject-jv72.onrender.com/api/group/{group_id}/review'
    
    if request.method == 'GET':
        # HTML 렌더링
        return render_template('reviewWrite.html', group_id=group_id)
    
    elif request.method == 'POST':
        try:
            # 클라이언트로부터 받은 데이터
            data = request.json
            rating_score = data.get('rating')
            review_content = data.get('content')
            options = data.get('options')  # 추가 옵션
            date = data.get('date')  # 리뷰 작성 날짜

            # 받은 데이터 확인
            print("[DEBUG] 받은 데이터:", data)

            # 데이터 검증
            if not rating_score or not review_content:
                return jsonify({"success": False, "message": "별점과 리뷰 내용을 모두 작성해주세요."}), 400

            if int(rating_score) < 1 or int(rating_score) > 5:
                return jsonify({"success": False, "message": "별점은 1~5 사이의 값이어야 합니다."}), 400

            # Node.js 백엔드에 보낼 데이터
            payload = {
                "ratingScore": rating_score,
                "review": review_content,
                "options": options,
                "date": date  # 그대로 전달
            }
            print("[DEBUG] Node.js로 보낼 데이터:", payload)

            # Node.js로 POST 요청
            response = requests.post(
                NODE_API_URL,
                json=payload,
                headers={"Authorization": f"Bearer {request.cookies.get('jwt')}"}
            )

            # Node.js 응답 확인
            print("[DEBUG] Node.js 응답 상태 코드:", response.status_code)
            print("[DEBUG] Node.js 응답 본문:", response.text)

            if response.status_code == 201:
                return jsonify({"success": True, "message": "리뷰가 성공적으로 등록되었습니다."}), 201
            else:
                return jsonify({"success": False, "message": response.json().get('error', '리뷰 등록 실패')}), response.status_code

        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Node.js API 호출 실패: {e}")
            return jsonify({"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}), 500

# 클럽 관리자 페이지
@app.route('/introduceclub/<int:group_id>/clubAdmin', methods=['GET'])
@authenticate_token
def club_admin(group_id):
    """
    클럽 관리자 페이지 렌더링
    """
    # Node.js 백엔드 API URL
    NODE_API_URL = f'https://teamproject-jv72.onrender.com/api/group/{group_id}/clubAdmin'

    try:
        # Node.js 백엔드 호출
        headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}
        response = requests.get(NODE_API_URL, headers=headers)
        response.raise_for_status()

        # Node.js 응답 데이터
        club_data = response.json()
        print("[INFO] 클럽 데이터:", club_data)

        # 클럽 데이터를 HTML에 전달
        return render_template('clubAdmin.html', group_id=group_id, club=club_data)
    except requests.exceptions.RequestException as e:
        print("[ERROR] Node.js API 호출 실패:", e)
        return jsonify({"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}), 500


@app.route('/introduceclub/<int:group_id>/edit', methods=['GET', 'PUT'])
@authenticate_token
def edit_club(group_id):
    NODE_API_URL = "https://teamproject-jv72.onrender.com/api/group"
    
    if request.method == 'GET':
        # GET 요청: 클럽 데이터를 가져옴
        try:
            headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}
            response = requests.get(f"{NODE_API_URL}/{group_id}", headers=headers)
            response.raise_for_status()
            club_data = response.json()

            # HTML 템플릿 렌더링과 데이터 전달
            return render_template('introduceclubEdit.html', club=club_data)
        except requests.exceptions.RequestException as e:
            print("[ERROR] Node.js API 호출 실패:", e)
            return render_template('error.html', message="클럽 데이터를 가져오는 중 오류가 발생했습니다."), 500

    elif request.method == 'PUT':
    # PUT 요청: 클럽 데이터 수정
        try:
        # 텍스트 데이터 추출
            updated_data = {
                "name": request.form.get("name"),
                "GroupLeader": request.form.get("GroupLeader"),
                "GroupRoom": request.form.get("GroupRoom"),
                "GroupTime": request.form.get("GroupTime"),
                "Contact": request.form.get("Contact"),
                "category": request.form.get("category"),
                "description": request.form.get("description"),
            }
            
            # 파일 데이터 추출
            files = {}
            if 'GroupImage' in request.files:
                files['GroupImage'] = request.files['GroupImage']
            if 'IntroduceImage' in request.files:
                files['IntroduceImage'] = request.files['IntroduceImage']

            print("[DEBUG] Updated Data:", updated_data)
            print("[DEBUG] Files:", files)

            # Node.js API로 요청 전송
            headers = {
                "Authorization": f"Bearer {request.cookies.get('jwt')}"
            }
            response = requests.put(
                f"{NODE_API_URL}/{group_id}",
                data=request.form,  # 텍스트 데이터
                files={             # 파일 데이터
                    'GroupImage': request.files.get('GroupImage'),
                    'IntroduceImage': request.files.get('IntroduceImage'),
                },
                headers=headers
            )
            response.raise_for_status()

            return jsonify({"success": True, "message": "클럽 정보가 성공적으로 수정되었습니다."})
        except requests.exceptions.RequestException as e:
            print("[ERROR] Node.js API 호출 실패:", e)
            return jsonify({"success": False, "message": "클럽 정보를 수정하는 중 오류가 발생했습니다."}), 500
        
# 활동 내용 등록 및 화면 렌더링
@app.route('/introduceclub/<int:group_id>/ActivityLog', methods=['GET', 'POST'])
@authenticate_token
def activity_log(group_id):
    """
    활동 내용 등록 (POST 요청) 및 활동 기록 작성 화면 렌더링 (GET 요청)
    """
    NODE_API_URL = f'https://teamproject-jv72.onrender.com/api/group/{group_id}/activity'

    if request.method == 'GET':
        # GET 요청 시 HTML 페이지 렌더링
        return render_template('ActivityLog.html', group_id=group_id)

    elif request.method == 'POST':
        try:
            # 클라이언트에서 받은 데이터
            title = request.form.get('title')
            description = request.form.get('description')
            activity_image = request.files.get('ActivityImage')

            # 데이터 검증
            if not title:
                return jsonify({"success": False, "message": "활동 제목을 입력해주세요."}), 400


            # 파일 업로드 준비
            files = None
            if activity_image:
                files = {
                    'ActivityImage': (
                        activity_image.filename,
                        activity_image.stream,
                        activity_image.content_type
                    )
                }
            print("[DEBUG] Title:", title)
            print("[DEBUG] Description:", description)
            if activity_image:
                print("[DEBUG] File Name:", activity_image.filename)

            # Node.js 백엔드에 보낼 데이터
            payload = {
                "title": title,
                "description": description
            }
            print("[DEBUG] Node.js로 보낼 데이터:", payload)
            print("파일은",files)

            # Node.js API로 POST 요청 전송
            headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}
            response = requests.post(NODE_API_URL, data=payload, files=files, headers=headers)

            # Node.js 응답 확인
            print("[DEBUG] Node.js 응답 상태 코드:", response.status_code)
            print("[DEBUG] Node.js 응답 본문:", response.text)

            if response.status_code == 201:
                return jsonify({"success": True, "message": "활동 내용이 성공적으로 등록되었습니다."}), 201
            else:
                return jsonify({"success": False, "message": response.json().get('error', '활동 내용 등록 실패')}), response.status_code

        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Node.js API 호출 실패: {e}")
            return jsonify({"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}), 500

@app.route('/check_login_status', methods=['GET'])
def check_login_status():
    """로그인 상태 확인"""
    token = request.cookies.get('jwt')  # 클라이언트가 보낸 JWT 토큰
    if not token:
        return jsonify({"success": False, "message": "로그인되지 않았습니다."})

    try:
        # JWT 토큰 검증
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify({"success": True, "user": decoded_token})
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "토큰이 만료되었습니다. 다시 로그인하세요."})
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "message": "유효하지 않은 토큰입니다."})
    
@app.route('/')
def main_page():
    # 쿠키에서 JWT 토큰 가져오기
    token = request.cookies.get('jwt')
    user_info = None
    is_logged_in = False

    if token:
        try:
            user_info = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            is_logged_in = True
        except jwt.ExpiredSignatureError:
            print("JWT 토큰 만료")
        except jwt.InvalidTokenError:
            print("유효하지 않은 JWT 토큰")

    # Node.js 백엔드 API 호출
    api_url = 'https://teamproject-jv72.onrender.com/api/main'
    my_group_url = 'https://teamproject-jv72.onrender.com/api/myGroup'

    headers = {"Authorization": f"Bearer {token}"}
    params = {
        'category': request.args.get('category', 'all'),
        'sortBy': request.args.get('sortBy', 'latest')
    }

    try:
        # 모든 동아리 데이터 가져오기
        response = requests.get(api_url, params=params)
        response.raise_for_status()
        group_data = response.json()

    except requests.exceptions.RequestException as e:
        group_data = {"error": "Failed to fetch data", "details": str(e)}
        my_group_data = []

    # 템플릿에 데이터 전달
    return render_template(
        './main.html',
        groups=group_data,  
        is_logged_in=is_logged_in,
        user_info=user_info,
    )

@app.route('/introduceclub/<int:group_id>/getForm', methods=['GET'])
@authenticate_token
def get_form(group_id):
    # 외부 API URL
    api_url = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/form"
    token = request.cookies.get('jwt')

    try:
        response = requests.get(api_url, headers={"Authorization": f"Bearer {token}"})
        response.raise_for_status()
        form_data = response.json()

        print("Response from API:", form_data)

        # 성공 응답 반환
        return jsonify({"success": True, "Form": form_data.get("Form")})
    except requests.exceptions.RequestException as e:
        print("API 호출 실패:", e)
        return jsonify({"success": False, "message": "폼 링크를 가져오는 중 오류가 발생했습니다."}), 500



# GET: `showUser.html` 반환
@app.route('/introduceclub/<int:group_id>/member', methods=['GET'])
@authenticate_token
def show_user_form(group_id):
    return render_template('showUser.html', group_id=group_id)

# POST: 멤버 추가 요청 처리
@app.route('/introduceclub/<int:group_id>/member', methods=['POST'])
@authenticate_token
def add_member(group_id):
    token = request.cookies.get('jwt')
    data = request.get_json()

    # 유효성 검사
    name = data.get("name")
    student_nb = data.get("studentNb")
    if not name or not student_nb:
        return jsonify({"success": False, "message": "이름과 학번은 필수 항목입니다."}), 400

    api_url = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/member"

    try:
        # 외부 API 호출
        response = requests.post(
            api_url,
            json={"name": name, "userNum": student_nb},
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        response.raise_for_status()

        return jsonify({"success": True, "message": "멤버가 성공적으로 추가되었습니다."})
    except requests.exceptions.RequestException as e:
        print("API 호출 실패:", e)
        return jsonify({"success": False, "message": "외부 API 호출 중 오류가 발생했습니다."}), 500


@app.route('/login', methods=['POST'])
def login():
    """로그인 엔드포인트: Node.js로부터 JWT를 전달받아 처리"""
    print("로그인 요청 들어옴!")  # 디버깅용 로그

    # 클라이언트에서 전달된 로그인 데이터 가져오기
    data = request.get_json()
    userNum = data.get('userNum')
    password = data.get('password')

    # Node.js 백엔드 API 호출
    api_url = 'https://teamproject-jv72.onrender.com/api/login'
    print("Node.js로 요청 보내기 전:", userNum, password)

    try:
        # Node.js에 로그인 요청
        response = requests.post(api_url, json={'userNum': userNum, 'password': password})
        response.raise_for_status()

        if response.status_code == 200:
            # Node.js에서 반환된 데이터
            node_response = response.json()
            print("Node.js 응답 데이터:", node_response)

            # Node.js가 반환한 JWT 토큰 확인
            token = node_response.get('token')
            if not token:
                return jsonify({"success": False, "message": "Node.js에서 토큰을 받지 못했습니다."}), 500

            # JWT를 클라이언트 쿠키에 저장
            flask_response = make_response(jsonify({"success": True, "message": "로그인 성공"}))
            flask_response.set_cookie('jwt', token, httponly=True, samesite='Strict', secure=True)
            return flask_response
        else:
            return jsonify({"success": False, "message": response.json().get('message', '로그인 실패')}), response.status_code
    except requests.exceptions.RequestException as e:
        print("Node.js API 호출 실패:", e)
        return jsonify({"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}), 500


@app.route('/mypage')
@authenticate_token
def mypage():
    """사용자 정보 페이지"""
    user_info = request.user  # JWT에서 디코딩된 사용자 정보 사용
    return render_template('mypage.html', user=user_info)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        # 사용자 입력 데이터 가져오기
        user_data = {
            'userNum': request.form.get('id'),
            'name': request.form.get('name'),
            'email': request.form.get('email'),
            'password': request.form.get('password'),
            'category': request.form.getlist('club_interest')  # 다중 선택 가능
        }

        # 파일 가져오기
        file = request.files.get('MSI_Image')
        if not file:
            return "MSI 사진을 업로드하세요.", 400

        # Node.js 백엔드로 요청 보내기
        api_url = 'https://teamproject-jv72.onrender.com/api/register'
        try:
            response = requests.post(
                api_url,
                data=user_data,
                files={'MSI_Image': (file.filename, file.stream, file.content_type)}
            )
            response.raise_for_status()  # HTTP 오류 발생 시 예외 처리

            # 성공 시 메시지 출력
            if response.status_code == 201:
                return redirect(url_for('main_page'))  # 메인 페이지로 리다이렉트
            else:
                return response.json().get('message', '알 수 없는 오류가 발생했습니다.')
        except requests.exceptions.RequestException as e:
            print("API 호출 실패:", e)
            return f"API 호출 실패: {e}", 500

    # GET 요청 시 회원가입 페이지 렌더링
    return render_template('signup.html')

@app.route('/qa')
def qa_page():
    return render_template('Q&A.html')

@app.route('/update_info', methods=['POST'])
@authenticate_token
def update_info():
    """사용자 정보 수정"""
    user_data = request.get_json()
    updated_info = {
        "userNum": request.user['userNum'],  # JWT에서 사용자 ID 추출
        "name": user_data.get('name'),
        "email": user_data.get('email'),
        "category": user_data.get('category')
    }

    api_url = 'https://teamproject-jv72.onrender.com/api/update_info'
    try:
        response = requests.post(api_url, json=updated_info)
        response.raise_for_status()

        if response.status_code == 200:
            return {"success": True, "message": "정보가 수정되었습니다."}
        else:
            return {"success": False, "message": response.json().get("message", "정보 수정 실패")}
    except requests.exceptions.RequestException as e:
        print("API 호출 실패:", e)
        return {"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}, 500

@app.route('/change_password', methods=['POST'])
@authenticate_token
def change_password():
    """비밀번호 변경"""
    data = request.get_json()
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    api_url = 'https://teamproject-jv72.onrender.com/api/change_password'
    try:
        response = requests.post(
            api_url,
            json={
                "userNum": request.user['userNum'],  # JWT에서 사용자 ID 추출
                "currentPassword": current_password,
                "newPassword": new_password
            }
        )
        response.raise_for_status()

        if response.status_code == 200:
            return {"success": True, "message": "비밀번호가 변경되었습니다."}
        else:
            return {"success": False, "message": response.json().get("message", "비밀번호 변경 실패")}
    except requests.exceptions.RequestException as e:
        print("API 호출 실패:", e)
        return {"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}, 500

club_list = []  # 임시 데이터 저장소

@app.route('/get_clubs', methods=['GET'])  # '/get_clubs' URL에 대한 GET 요청 처리
def get_clubs():
    # 클라이언트로부터 전달된 'category' 파라미터를 가져옵니다.
    # 기본값은 'all'로 설정되어, 카테고리가 지정되지 않으면 전체 동아리를 반환합니다.
    category = request.args.get('category', 'all')

    if category == 'all':
        # 카테고리가 'all'일 경우, 모든 동아리 데이터를 반환
        filtered_clubs = club_list
    else:
        # 특정 카테고리가 지정된 경우, 해당 카테고리에 속하는 동아리만 필터링
        filtered_clubs = [club for club in club_list if club['category'] == category]

    # 클라이언트에게 JSON 형식으로 필터링된 동아리 데이터를 반환
    # 반환 데이터 형식: {"clubs": [동아리 데이터 목록]}
    return {"clubs": filtered_clubs}

@app.route('/register_club', methods=['GET', 'POST'])
@authenticate_token
def register_club():
    if request.method == 'GET':
        # GET 요청 시 클라이언트에 HTML 페이지 반환
        return render_template('club_register.html')

    elif request.method == 'POST':
    # 사용자 입력 데이터 가져오기
        form_data = {
            'name': request.form.get('club_name'),  # 동아리 이름
            'GroupLeader':request.form.get('club_leader'),
            'category': request.form.get('category'),  # 동아리 카테고리
            'description': request.form.get('club_description'),  # 동아리 소개
            'GroupTime': request.form.get('meeting_time'),  # 모임 시간
            'GroupRoom': request.form.get('club_room'),  # 동아리방 위치
            'Contact': request.form.get('contact')  # 연락처
        }

    files = {
        'GroupImage': request.files.get('GroupImage'),
        'IntroduceImage': request.files.get('IntroduceImage'),
        'ActiveLog': request.files.get('ActiveLog')
    }

    # Node.js API URL 및 헤더 설정
    api_url = 'https://teamproject-jv72.onrender.com/api/group_form'
    headers = {
        "Authorization": f"Bearer {request.cookies.get('jwt')}"
    }

    # 파일 전송 데이터 준비
    files_to_send = {
        key: (file.filename, file.stream, file.content_type)
        for key, file in files.items() if file
    }

    
    try:
        # Node.js API 호출
        response = requests.post(api_url, data=form_data, files=files_to_send, headers=headers)
        response.raise_for_status()

        if response.status_code == 201:
            return {"success": True, "message": "동아리 등록 완료"}
        else:
            return {"success": False, "message": "동아리 등록 실패"}
    except requests.exceptions.RequestException as e:
        print("Node.js API 호출 실패:", e)
        return {"success": False, "message": "서버와의 통신 중 오류가 발생했습니다."}, 500


@app.route('/get_club_details', methods=['GET'])
def get_club_details():
    club_id = request.args.get('id')  # URL에서 ID 가져오기
    if not club_id:
        return {"success": False, "message": "동아리 ID가 필요합니다."}, 400

    try:
        # 동아리 ID로 해당 동아리 검색
        club = next((club for club in club_list if club['id'] == int(club_id)), None)
        if club:
            return {"success": True, "club": club}
        else:
            return {"success": False, "message": "해당 동아리를 찾을 수 없습니다."}, 404
    except ValueError:
        return {"success": False, "message": "유효하지 않은 동아리 ID입니다."}, 400

@app.route('/logout', methods=['POST'])
def logout():
    """로그아웃 엔드포인트"""
    response = make_response(jsonify({"success": True, "message": "로그아웃 성공"}))
    response.delete_cookie('jwt')  # JWT 쿠키 삭제
    return response

# 회원 목록 조회 (HTML 반환)
@app.route('/introduceclub/<int:group_id>/memberManage', methods=['GET'])
@authenticate_token
def get_members(group_id):
    """
    회원 목록 조회 API (HTML 반환)
    """
    print(f"[INFO] Fetching members for group {group_id}")
    NODE_API_URL = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/member"
    headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}
    print(group_id)

    try:
        # Node.js API 호출
        response = requests.get(NODE_API_URL, headers=headers)
        print(f"[DEBUG] Response Status Code: {response.status_code}")
        print(f"[DEBUG] Response Text: {response.text}")

        # 응답 상태 코드 확인
        if response.status_code == 200:
            try:
                data = response.json()  # JSON 응답 파싱
                members = [
                    {
                        "id": member["user"]["id"],
                        "name": member["user"]["name"],
                        "userNum": member["user"]["userNum"],
                        "joinDate": member["joinDate"]
                    }
                    for member in data["members"]
                ]
                print(f"[DEBUG] Processed Members Data: {members}")

                # HTML 템플릿 렌더링 (회원 데이터 전달)
                return render_template('memberManage.html', group_id=group_id, members=members)
            except ValueError:
                # JSON 파싱 실패
                print("[ERROR] 응답 JSON 파싱 실패:", response.text)
                return f"<h1>오류 발생</h1><p>Node.js에서 반환된 응답이 올바르지 않습니다.</p>", 500
        else:
            error_message = response.json().get("message", "회원 목록을 가져오는 데 실패했습니다.")
            print(f"[ERROR] API 응답 오류: {error_message}")
            return f"<h1>오류 발생</h1><p>{error_message}</p>", response.status_code

    except requests.exceptions.RequestException as e:
        print("[ERROR] 회원 목록 API 호출 실패:", e)
        return f"<h1>오류 발생</h1><p>회원 목록 요청 중 오류가 발생했습니다.</p>", 500



# 회원 삭제
@app.route('/introduceclub/<int:group_id>/member/<int:member_id>', methods=['DELETE'])
@authenticate_token
def delete_member(group_id, member_id):
    """
    회원 삭제 API
    """
    print(f"[INFO] Attempting to delete member {member_id} from group {group_id}")
    NODE_API_URL = f"https://teamproject-jv72.onrender.com/api/group/{group_id}/member/{member_id}"
    headers = {"Authorization": f"Bearer {request.cookies.get('jwt')}"}

    try:
        response = requests.delete(NODE_API_URL, headers=headers)

        if response.status_code == 200:
            return jsonify({"success": True, "message": "회원 삭제 성공"}), 200
        else:
            error_message = response.json().get("message", "회원 삭제에 실패했습니다.")
            return jsonify({"success": False, "message": error_message}), response.status_code
    except requests.exceptions.RequestException as e:
        print("[ERROR] 회원 삭제 API 호출 실패:", e)
        return jsonify({"success": False, "message": "회원 삭제 요청 중 오류가 발생했습니다."}), 500


# 배포 준비
if __name__ == "__main__":
    # 템플릿 폴더와 정적 파일 경로 설정
    app = create_app()
    app.template_folder = os.getcwd()
    app.static_folder = os.path.join(os.getcwd(), 'static')

    # 서버 시작
    app.run(host='0.0.0.0', port=5000, debug=True)