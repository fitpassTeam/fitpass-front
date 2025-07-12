## 🚀 주요 기능

- **회원가입/로그인/소셜로그인(JWT)**
- **체육관/트레이너/이용권 관리 (CRUD)**
- **게시글(공지/일반) 등록, 수정, 삭제, 이미지 업로드**
- **실시간 알림(SSE), 채팅방, 예약/결제**
- **역할별(오너/트레이너/회원) 분기 및 UX**
- **반응형 UI, 접근성, 에러/만료/권한 분기 처리**

---

## ⚙️ 환경 변수(.env 예시)

```env
VITE_API_BASE_URL=http://localhost:8080
```
- `.env` 파일을 프로젝트 루트에 생성 후, 위와 같이 API 서버 주소를 입력하세요.

---

🛠️ 기술스택 (Tech Stack)

React
SPA(싱글 페이지 애플리케이션) UI 개발
Vite
빠른 번들링 및 개발 서버
JavaScript (ES6+)
Tailwind CSS
유틸리티 기반 CSS 프레임워크 (설정 파일 존재)
Axios
REST API 통신 (src/api/\*.js)
Context API
글로벌 상태 관리 (src/context/NotificationContext.jsx)
HTML5, CSS3

---

## 🏃‍♂️ 로컬 개발 실행

```bash
npm install
npm run dev
```
- 개발 서버: [http://localhost:5173](http://localhost:5173)

---

## 📝 커밋/브랜치 전략

- `main`: 운영 배포용
- `dev`: 개발 통합 브랜치
- 기능별 브랜치에서 작업 후 PR

---

## 💡 기타

- **API 연동**: Spring Boot 백엔드와 RESTful 방식으로 통신
- **배포**: Vercel, Netlify 등 클라우드 배포 지원

---


